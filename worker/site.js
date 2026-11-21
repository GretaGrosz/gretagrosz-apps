// gretagrosz.com: the contact sheet, Weekend Ink requests and Greta's inbox (/inbox/).
//
//   POST   /api/site/messages            public: a message from the contact sheet or the Weekend Ink planner
//   POST   /api/site/cv                  public: a recruiter's name, email and company; answers { url } to the CV
//   GET    /api/site/cv/:id.:key         the CV PDF, for 30 days after that request
//   GET    /api/site/inbox               Greta: messages, newest first (?status=open|done|all, ?before=<created>)
//   GET    /api/site/inbox/:id/logo      Greta: the logo (or QR code) attached to a Weekend Ink request
//   GET    /api/site/inbox/:id/preview   Greta: the picture of the design on the arm, as the visitor placed it
//   PATCH  /api/site/inbox/:id           Greta: { done: true|false }
//   DELETE /api/site/inbox/:id           Greta: delete a message
//   GET    /api/site/push/key            the VAPID public key the inbox subscribes with
//   POST   /api/site/push                Greta: turn on notifications for this browser
//   DELETE /api/site/push                Greta: turn them off
//
// Greta's requests carry "Authorization: Bearer <INBOX_TOKEN>" (secret: npx wrangler secret put INBOX_TOKEN).
// Tables: worker/migrations/0100_site_messages.sql + 0101_site_preview.sql (in the yap database, binding DB).
// Spam: same-origin only, a honeypot field, a typing-time check, and per-visitor and per-day limits.
//
// The CV: the full PDF (phone number, date of birth) is not a public file. It is bundled into this Worker
// (worker/private/, the "Data" rule in wrangler.jsonc) and handed out only after someone leaves their name,
// email and company. Each request lands in the inbox as kind 'cv', so Greta sees who downloaded it.
import { encrypt, vapidAuth, vapidPublicKey } from './push.js'
import CV_PDF from './private/Greta_Grosz_Lebenslauf.pdf'

const BASE = '/api/site'
const KINDS = ['contact', 'weekendink']
const TOPICS = ['internship', 'apps', 'weekendink', 'clothing', 'other']
const OCCASIONS = ['festival', 'event', 'team']
const DESIGNS = ['logo', 'name', 'qr', 'idea']
const MAX_BODY = 1_000_000        // request bytes (a downscaled logo and the preview fit easily)
const MAX_LOGO = 700_000          // data: URL characters
const MAX_PREVIEW = 250_000       // data: URL characters (a 1120 × 700 JPEG)
const PER_10_MIN = 3, PER_DAY = 10, ALL_PER_DAY = 400
const MIN_TYPING_MS = 2500
const CV_FILE = 'Greta_Grosz_Lebenslauf.pdf'
const CV_DAYS = 30
const EMAIL = /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[^\s@<>()",;:\\]{2,}$/
const LOGO = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/
const PREVIEW = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/

class HttpError extends Error {
  constructor(status, error, field) { super(error); this.status = status; this.field = field }
}
const fail = (status, error, field) => { throw new HttpError(status, error, field) }
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s) => crypto.subtle.digest('SHA-256', enc.encode(s))
const id = () => hex(crypto.getRandomValues(new Uint8Array(9)))

export async function site(request, env, ctx, url) {
  try {
    return await route(request, env, ctx, url)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, ...(e.field ? { field: e.field } : {}) }, e.status)
    console.error(e)
    return json({ error: 'server' }, 500)
  }
}

async function route(request, env, ctx, url) {
  const db = env.DB
  const path = url.pathname.slice(BASE.length)
  const method = request.method
  let p

  if (path === '/messages') {
    if (method !== 'POST') fail(405, 'method')
    return receive(request, env, ctx, url)
  }
  if (path === '/cv') {
    if (method !== 'POST') fail(405, 'method')
    return cvRequest(request, env, ctx, url)
  }
  if ((p = path.match(/^\/cv\/([a-f0-9]{18})\.([a-f0-9]{32})$/)) && (method === 'GET' || method === 'HEAD')) return cvFile(env, p[1], p[2])
  if (path === '/push/key' && method === 'GET') return json({ key: vapidPublicKey(env) })

  // Everything below is Greta's
  await authorize(request, env)

  if (path === '/inbox' && method === 'GET') {
    const status = url.searchParams.get('status') || 'open'
    const before = Number(url.searchParams.get('before')) || Date.now() + 1
    const where = status === 'done' ? 'done = 1' : status === 'all' ? '1 = 1' : 'done = 0'
    const { results } = await db.prepare(`SELECT id, kind, topic, name, email, body, details, lang, page, suspect, done, created, logo IS NOT NULL AS has_logo, preview IS NOT NULL AS has_preview
      FROM site_messages WHERE ${where} AND created < ? ORDER BY created DESC LIMIT 100`).bind(before).all()
    const counts = await db.prepare('SELECT SUM(done = 0) AS open, SUM(done = 1) AS done FROM site_messages').first()
    const details = (m) => {
      if (!m.details) return null
      const d = JSON.parse(m.details)
      delete d.key   // the CV link's key stays on the server
      return d
    }
    return json({
      messages: results.map((m) => ({ ...m, details: details(m), suspect: !!m.suspect, done: !!m.done, has_logo: !!m.has_logo, has_preview: !!m.has_preview })),
      counts: { open: counts?.open || 0, done: counts?.done || 0 },
      more: results.length === 100,
    })
  }
  if ((p = path.match(/^\/inbox\/([a-f0-9]{18})\/(logo|preview)$/)) && method === 'GET') {
    const row = await db.prepare(`SELECT ${p[2]} AS img FROM site_messages WHERE id = ?`).bind(p[1]).first()
    if (!row || !row.img) fail(404, 'not_found')
    const [, type, b64] = row.img.match(/^data:(image\/[a-z]+);base64,(.*)$/)
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    return new Response(bytes, { headers: { 'content-type': type, 'cache-control': 'private, max-age=3600' } })
  }
  if ((p = path.match(/^\/inbox\/([a-f0-9]{18})$/))) {
    if (method === 'PATCH') {
      const b = await readJson(request, 1000)
      if (typeof b.done !== 'boolean') fail(400, 'invalid', 'done')
      const r = await db.prepare('UPDATE site_messages SET done = ? WHERE id = ?').bind(b.done ? 1 : 0, p[1]).run()
      if (!r.meta.changes) fail(404, 'not_found')
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      const r = await db.prepare('DELETE FROM site_messages WHERE id = ?').bind(p[1]).run()
      if (!r.meta.changes) fail(404, 'not_found')
      return json({ ok: true })
    }
  }
  if (path === '/push') {
    const b = await readJson(request, 4000)
    const endpoint = String(b.endpoint || '')
    if (!/^https:\/\//.test(endpoint) || endpoint.length > 1000) fail(400, 'invalid', 'endpoint')
    if (method === 'POST') {
      const k = b.keys || {}
      if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 100) fail(400, 'invalid', 'keys')
      await db.prepare('INSERT OR REPLACE INTO site_push (endpoint, p256dh, auth, created) VALUES (?, ?, ?, ?)').bind(endpoint, k.p256dh, k.auth, Date.now()).run()
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.prepare('DELETE FROM site_push WHERE endpoint = ?').bind(endpoint).run()
      return json({ ok: true })
    }
  }
  fail(404, 'not_found')
}

async function authorize(request, env) {
  if (!env.INBOX_TOKEN) fail(503, 'inbox_not_set_up')
  const got = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  const [a, b] = await Promise.all([sha256(got), sha256(env.INBOX_TOKEN)])
  if (!got || !crypto.subtle.timingSafeEqual(a, b)) fail(401, 'unauthorized')
}

async function readJson(request, max) {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) fail(415, 'json_only')
  const len = Number(request.headers.get('content-length') || 0)
  if (len > max) fail(413, 'too_big')
  const text = await request.text()
  if (text.length > max) fail(413, 'too_big')
  try {
    const b = JSON.parse(text)
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error()
    return b
  } catch { fail(400, 'invalid') }
}

const str = (v, field, min, max) => {
  const s = typeof v === 'string' ? v.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim() : ''
  if (s.length < min || s.length > max) fail(400, 'invalid', field)
  return s
}

async function receive(request, env, ctx, url) {
  // Only this site's own pages may post here
  const origin = request.headers.get('origin')
  if (origin && origin !== url.origin) fail(403, 'origin')
  const b = await readJson(request, MAX_BODY)

  // A field people never see; bots fill it in. Answer as if it worked, store nothing.
  if (b.website) return json({ ok: true, id: id() })

  const kind = KINDS.includes(b.kind) ? b.kind : fail(400, 'invalid', 'kind')
  const topic = kind === 'weekendink' ? 'weekendink' : TOPICS.includes(b.topic) ? b.topic : fail(400, 'invalid', 'topic')
  const name = str(b.name, 'name', 1, 80)
  const email = str(b.email, 'email', 3, 200)
  if (!EMAIL.test(email)) fail(400, 'invalid', 'email')
  const body = str(b.message, 'message', kind === 'weekendink' ? 1 : 10, 4000)
  const lang = b.lang === 'de' ? 'de' : 'en'
  const page = typeof b.page === 'string' ? b.page.slice(0, 100) : null

  let details = null, logo = null, preview = null
  if (kind === 'weekendink') {
    const d = b.details || {}
    const occasion = OCCASIONS.includes(d.occasion) ? d.occasion : fail(400, 'invalid', 'occasion')
    const design = DESIGNS.includes(d.design) ? d.design : fail(400, 'invalid', 'design')
    let date = null
    if (d.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || Number.isNaN(Date.parse(d.date + 'T12:00:00Z'))) fail(400, 'invalid', 'date')
      if (Date.parse(d.date + 'T23:59:59Z') < Date.now() - 86_400_000) fail(400, 'past', 'date')
      date = d.date
    }
    let people = null
    if (d.people != null && d.people !== '') {
      people = Number(d.people)
      if (!Number.isInteger(people) || people < 1 || people > 100_000) fail(400, 'invalid', 'people')
    }
    // what the visitor saw on the arm: its size, the lettering of a name, where a QR code leads
    let size = null, text = null, qr = null
    if (d.size != null) {
      size = Number(d.size)
      if (!Number.isFinite(size) || size < 1 || size > 15) fail(400, 'invalid', 'size')
      size = Math.round(size * 2) / 2
    }
    if (design === 'name' && d.text != null && d.text !== '') text = str(d.text, 'text', 1, 40)
    if (design === 'qr' && d.qr != null && d.qr !== '') qr = str(d.qr, 'qr', 1, 500)
    details = JSON.stringify({ occasion, design, date, people, size, text, qr })
    if (b.logo != null && b.logo !== '') {
      if (typeof b.logo !== 'string' || b.logo.length > MAX_LOGO || !LOGO.test(b.logo)) fail(400, 'invalid', 'logo')
      logo = b.logo
    }
    if (b.preview != null && b.preview !== '') {
      if (typeof b.preview !== 'string' || b.preview.length > MAX_PREVIEW || !PREVIEW.test(b.preview)) fail(400, 'invalid', 'preview')
      preview = b.preview
    }
  }

  const db = env.DB
  const now = Date.now()
  const ipHash = await checkLimits(request, db, now)

  const typed = Number(b.typingMs)
  const suspect = !Number.isFinite(typed) || typed < MIN_TYPING_MS ? 1 : 0
  const mid = id()
  await db.prepare(`INSERT INTO site_messages (id, kind, topic, name, email, body, details, logo, preview, lang, page, ip_hash, suspect, done, created)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`).bind(mid, kind, topic, name, email, body, details, logo, preview, lang, page, ipHash, suspect, now).run()

  if (!suspect) ctx.waitUntil(pushToGreta(env, {
    title: kind === 'weekendink' ? `Weekend Ink · ${name}` : `${name} · ${topic}`,
    body: body.length > 140 ? body.slice(0, 139) + '…' : body,
    url: `/inbox/#${mid}`,
    tag: 'site-' + mid,
  }).catch((e) => console.error('site push', e)))
  return json({ ok: true, id: mid })
}

// A message from inside an app (Blank's "Send feedback", worker/blank.js), straight into the inbox with a notification.
// The app checks who may send and how often; email may be '' (no reply address).
export async function addToInbox(env, ctx, { kind, topic, name, email, body, lang, page, ipHash }) {
  const mid = id()
  await env.DB.prepare(`INSERT INTO site_messages (id, kind, topic, name, email, body, lang, page, ip_hash, suspect, done, created)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`).bind(mid, kind, topic, name, email || '', body, lang, page, ipHash, Date.now()).run()
  ctx.waitUntil(pushToGreta(env, {
    title: `${name} · Blank`,
    body: body.length > 140 ? body.slice(0, 139) + '…' : body,
    url: `/inbox/#${mid}`,
    tag: 'site-' + mid,
  }).catch((e) => console.error('site push', e)))
  return mid
}

// Per-visitor (hashed IP, new salt every day) and site-wide limits, shared by messages and CV requests
async function checkLimits(request, db, now) {
  const ip = request.headers.get('cf-connecting-ip') || 'local'
  const ipHash = hex(await sha256(`${ip}|${new Date(now).toISOString().slice(0, 10)}|gretagrosz.com`)).slice(0, 32)
  const limits = await db.prepare(`SELECT
      SUM(ip_hash = ?1 AND created > ?2) AS recent,
      SUM(ip_hash = ?1) AS today,
      COUNT(*) AS everyone
    FROM site_messages WHERE created > ?3`).bind(ipHash, now - 10 * 60_000, now - 86_400_000).first()
  if ((limits?.recent || 0) >= PER_10_MIN || (limits?.today || 0) >= PER_DAY) fail(429, 'rate')
  if ((limits?.everyone || 0) >= ALL_PER_DAY) fail(503, 'busy')
  return ipHash
}

async function cvRequest(request, env, ctx, url) {
  const origin = request.headers.get('origin')
  if (origin && origin !== url.origin) fail(403, 'origin')
  const b = await readJson(request, 4000)
  // Honeypot: a bot gets an answer that looks fine and a link that leads nowhere
  if (b.website) return json({ ok: true, url: `${BASE}/cv/${id()}.${hex(crypto.getRandomValues(new Uint8Array(16)))}` })

  const name = str(b.name, 'name', 1, 80)
  const email = str(b.email, 'email', 3, 200)
  if (!EMAIL.test(email)) fail(400, 'invalid', 'email')
  const company = str(b.company, 'company', 2, 120)
  const lang = b.lang === 'de' ? 'de' : 'en'
  const page = typeof b.page === 'string' ? b.page.slice(0, 100) : null

  const db = env.DB
  const now = Date.now()
  const ipHash = await checkLimits(request, db, now)
  const typed = Number(b.typingMs)
  const suspect = !Number.isFinite(typed) || typed < MIN_TYPING_MS ? 1 : 0
  const mid = id()
  const key = hex(crypto.getRandomValues(new Uint8Array(16)))
  await db.prepare(`INSERT INTO site_messages (id, kind, topic, name, email, body, details, lang, page, ip_hash, suspect, done, created)
    VALUES (?, 'cv', 'cv', ?, ?, '', ?, ?, ?, ?, ?, 0, ?)`).bind(mid, name, email, JSON.stringify({ company, key }), lang, page, ipHash, suspect, now).run()

  if (!suspect) ctx.waitUntil(pushToGreta(env, {
    title: `CV · ${name}`,
    body: `${company} downloaded your CV (${email})`,
    url: `/inbox/#${mid}`,
    tag: 'site-' + mid,
  }).catch((e) => console.error('site push', e)))
  return json({ ok: true, url: `${BASE}/cv/${mid}.${key}` })
}

async function cvFile(env, mid, key) {
  const row = await env.DB.prepare("SELECT details, created FROM site_messages WHERE id = ? AND kind = 'cv'").bind(mid).first()
  let stored = ''
  try { stored = JSON.parse(row.details).key || '' } catch {}
  const [a, b] = await Promise.all([sha256(key), sha256(stored)])
  const fresh = row && Date.now() - row.created < CV_DAYS * 86_400_000
  if (!stored || !fresh || !crypto.subtle.timingSafeEqual(a, b)) {
    return new Response('This CV link has expired. Request a new one at https://gretagrosz.com/cv/\n', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } })
  }
  return new Response(CV_PDF, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${CV_FILE}"`,
      'cache-control': 'private, no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  })
}

async function pushToGreta(env, message) {
  if (!env.VAPID_PRIVATE) return
  const { results } = await env.DB.prepare('SELECT endpoint, p256dh, auth FROM site_push').all()
  await Promise.all(results.map(async (sub) => {
    try {
      const res = await fetch(sub.endpoint, {
        method: 'POST',
        headers: {
          authorization: await vapidAuth(env, sub.endpoint),
          'content-encoding': 'aes128gcm',
          'content-type': 'application/octet-stream',
          ttl: '86400',
          urgency: 'high',
        },
        body: await encrypt(sub, JSON.stringify(message)),
      })
      if (res.status === 404 || res.status === 410) await env.DB.prepare('DELETE FROM site_push WHERE endpoint = ?').bind(sub.endpoint).run()
      else if (!res.ok) console.error('site push', res.status, await res.text())
    } catch (e) { console.error('site push', e) }
  }))
}
