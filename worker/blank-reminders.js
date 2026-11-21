// Blank: the axolotl's reminders. When someone picks a time for their next step ("Tomorrow 17:00"), the app saves it
// here with the phone's push subscription; the Worker's cron (index.js scheduled, every 5 minutes) sends the
// notification when it's due and deletes it. No account needed: the app's random device id, stored only as a hash.
//
//   POST /blank/api/reminders         { device, project, at, step, lang, sub: { endpoint, keys: { p256dh, auth } } }
//   POST /blank/api/reminders/cancel  { device, project }
//
// Free: Cloudflare cron triggers and Web Push cost nothing; each reminder is one D1 write when set and one delete
// when sent (capped per device below). Table: migrations/0470_blank_reminders.sql (yap database, binding DB).
import { encrypt, pushEndpointOk, vapidAuth } from './push.js'

const MAX_AHEAD = 30 * 86_400_000 // a reminder at most 30 days ahead
const SETS_PER_DAY = 60 // per device
const ACTIVE_MAX = 30 // reminders waiting per device (one per project)
const BATCH = 200 // sent per cron run
const DAY = 86_400_000

class HttpError extends Error {
  constructor(status, error) {
    super(error)
    this.status = status
  }
}
const fail = (status, error) => {
  throw new HttpError(status, error)
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))

async function body(request) {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) fail(415, 'json_only')
  const text = await request.text()
  if (text.length > 4000) fail(413, 'too_big')
  try {
    const b = JSON.parse(text)
    if (b && typeof b === 'object' && !Array.isArray(b)) return b
  } catch {}
  fail(400, 'invalid')
}
const deviceOf = async (b) => {
  if (typeof b.device !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(b.device)) fail(400, 'invalid')
  return sha256(`${b.device}|blank-reminder`)
}
const projectOf = (b) => {
  if (typeof b.project !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(b.project)) fail(400, 'invalid')
  return b.project
}

export async function reminders(request, env, path, method) {
  try {
    if (method !== 'POST') fail(405, 'method')
    const db = env.DB
    const b = await body(request)
    const device = await deviceOf(b)
    const project = projectOf(b)

    if (path === '/reminders/cancel') {
      await db.prepare('DELETE FROM blank_reminders WHERE device = ? AND project = ?').bind(device, project).run()
      return json({ ok: true })
    }
    if (path !== '/reminders') fail(404, 'not_found')

    const at = Number(b.at)
    const now = Date.now()
    if (!Number.isFinite(at) || at < now - 60_000 || at > now + MAX_AHEAD) fail(400, 'bad_time')
    const step = String(b.step ?? '')
      .replace(/[\u0000-\u001f\u007f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120)
    if (!step) fail(400, 'invalid')
    const lang = b.lang === 'de' || b.lang === 'hu' ? b.lang : 'en'
    const s = b.sub || {}
    const k = s.keys || {}
    if (!pushEndpointOk(s.endpoint) || typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 100) fail(400, 'bad_subscription')

    const n = await db.prepare("SELECT COUNT(*) AS n FROM blank_auth_events WHERE kind = 'remind' AND who = ? AND created > ?").bind(device, now - DAY).first()
    if ((n?.n || 0) >= SETS_PER_DAY) fail(429, 'too_many')
    const active = await db.prepare('SELECT COUNT(*) AS n FROM blank_reminders WHERE device = ? AND project != ?').bind(device, project).first()
    if ((active?.n || 0) >= ACTIVE_MAX) fail(429, 'too_many')

    await db.batch([
      db
        .prepare(
          `INSERT INTO blank_reminders (device, project, at, sub, step, lang, created) VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (device, project) DO UPDATE SET at = excluded.at, sub = excluded.sub, step = excluded.step, lang = excluded.lang, created = excluded.created`,
        )
        .bind(device, project, Math.max(at, now), JSON.stringify({ endpoint: s.endpoint, p256dh: k.p256dh, auth: k.auth }), step, lang, now),
      db.prepare("INSERT INTO blank_auth_events (kind, who, created) VALUES ('remind', ?, ?)").bind(device, now),
    ])
    return json({ ok: true })
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error('blank reminders', e)
    return json({ error: 'server' }, 500)
  }
}

// What the axolotl says, in the language the reminder was set in
const TEXT = {
  en: { title: 'The axolotl here', body: (step) => `Time for: ${step}` },
  de: { title: 'Hier ist der Axolotl', body: (step) => `Zeit für: ${step}` },
  hu: { title: 'Az axolotl üzen', body: (step) => `Itt az idő: ${step}` },
}

// Cron: send everything that's due, then forget it. Notifications to a phone that unsubscribed are just dropped.
export async function sendDue(env, now = Date.now()) {
  if (!env.VAPID_PRIVATE) return 0
  const db = env.DB
  const { results } = await db.prepare('SELECT device, project, sub, step, lang FROM blank_reminders WHERE at <= ? ORDER BY at LIMIT ?').bind(now, BATCH).all()
  let sent = 0
  for (const r of results || []) {
    try {
      const sub = JSON.parse(r.sub)
      if (!pushEndpointOk(sub.endpoint)) continue
      const t = TEXT[r.lang] || TEXT.en
      const msg = { title: t.title, body: t.body(r.step), tag: `blank-step-${r.project}`, url: `#/project/${r.project}` }
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: { authorization: await vapidAuth(env, sub.endpoint), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: '3600', urgency: 'high' },
        body: await encrypt(sub, JSON.stringify(msg)),
      })
      if (res.ok) sent++
      else if (res.status !== 404 && res.status !== 410) console.error('blank reminder push', res.status)
    } catch (e) {
      console.error('blank reminder', e)
    }
  }
  if (results?.length) {
    await db.batch(results.map((r) => db.prepare('DELETE FROM blank_reminders WHERE device = ? AND project = ? AND at <= ?').bind(r.device, r.project, now)))
  }
  return sent
}
