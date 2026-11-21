// Blank (/blank/): one real buddy per person. Two phones pair through an invite link and see each other's
// streak and check-ins (steps ticked, progress added, sessions, finished projects), plus a nudge.
// The buddy needs no account: the server hands each phone a random key and only stores its SHA-256.
//
//   POST   /blank/api/pairs               { name, lang }            → { code, key }    create an invite
//   GET    /blank/api/invite/:code                                  → { name, open }   who invited you
//   POST   /blank/api/invite/:code/join   { name, lang }            → { key }          accept it
//   GET    /blank/api/pair                (key)                     → { code, side, me, buddy, checkins }
//   PATCH  /blank/api/pair                (key) { name?, streak?, lang? }
//   DELETE /blank/api/pair                (key)                     ends the pair for both and deletes its check-ins
//   POST   /blank/api/checkins            (key) { kind, project, detail, streak }   kind 'cheer' = a reaction to your buddy's day
//   POST   /blank/api/nudge               (key)                     at most once an hour
//   GET    /blank/api/push/key                                      → { key }  the VAPID public key (null if not set up)
//   POST   /blank/api/push                (key) { endpoint, keys }  notifications on for this phone
//   DELETE /blank/api/push                (key)
//   POST   /blank/api/ask                 Ask, the axolotl's AI help (worker/blank-ai.js)
//          /blank/api/account/*           Accounts: username + password, data synced across devices (worker/blank-account.js)
//          /blank/api/social/*            Profiles, friends, posts, feed, reports (worker/blank-social.js)
//   POST   /blank/api/feedback            { text, lang, page } (token optional)  "Send feedback" → Greta's inbox (/inbox/)
//   POST   /blank/api/visit               { source, first }         counts an opening of Blank (once a day per device)
//   POST   /blank/api/reminders           { device, project, at, step, lang, sub }   the axolotl's reminder (blank-reminders.js)
//   POST   /blank/api/reminders/cancel    { device, project }
//
// Sparks, "started because of you": a shared project anyone with the link can start too.
//   POST   /blank/api/sparks              { name, title, category, guideKey, steps, lang } → { code, key }
//   GET    /blank/api/sparks/:code                                  → { name, title, category, guideKey, steps, lang, started }
//   PUT    /blank/api/sparks/:code        (key) same body as POST     the sharer changed the project
//   DELETE /blank/api/sparks/:code        (key)
//   POST   /blank/api/sparks/:code/start  { device }                 → { started }  each phone counts once
//   GET    /blank/api/sparks?codes=a,b    → { a: n, b: n }            the sharer's counts
//
// "(key)" = header "Authorization: Bearer <key>". Tables: worker/migrations/0300_blank_buddies.sql and 0320_blank_sparks.sql
// (yap database, binding DB).
// Push uses the same VAPID_PRIVATE secret as Yap and Stance.
import { encrypt, pushEndpointOk, vapidAuth, vapidPublicKey } from './push.js'
import { reminders } from './blank-reminders.js'

export { pushEndpointOk }
import { ask } from './blank-ai.js'
import { account, auth as accountAuth } from './blank-account.js'
import { social } from './blank-social.js'
import { addToInbox } from './site.js'

const BASE = '/blank/api'
const KINDS = ['step', 'photo', 'entry', 'session', 'finish', 'cheer']
const INVITES_PER_DAY = 12
const FEEDBACK_PER_DAY = 10 // per network
const CHECKINS_PER_DAY = 150
const INVITE_DAYS = 14
const KEEP_DAYS = 30
const SPARKS_PER_DAY = 30
const STARTS_PER_DAY = 200 // per network (a whole school can share one), so one person can't pump a count
const STEPS_MAX = 30
const NUDGE_GAP = 60 * 60_000
const PUSH_GAP = 10 * 60_000 // quick check-ins in a row become one notification
const DAY = 86_400_000
const VISIT_SOURCES = ['reddit', 'tiktok', 'instagram', 'search', 'friend', 'direct', 'other', 'poster', 'whatsapp', 'card', 'nfc']
const VISITS_PER_DAY = 5_000 // per source: 9 sources stay far under D1's free 100,000 writes a day

class HttpError extends Error {
  constructor(status, error) {
    super(error)
    this.status = status
  }
}
const fail = (status, error) => {
  throw new HttpError(status, error)
}
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const enc = new TextEncoder()
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/l/i: readable if someone types it
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => ALPHABET[b % ALPHABET.length]).join('')
const newKey = () => b64url(crypto.getRandomValues(new Uint8Array(32)))
const id = () => hex(crypto.getRandomValues(new Uint8Array(9)))

export async function blank(request, env, ctx, url) {
  try {
    return await route(request, env, ctx, url)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status)
    console.error(e)
    return json({ error: 'server' }, 500)
  }
}

async function route(request, env, ctx, url) {
  const db = env.DB
  const path = url.pathname.slice(BASE.length)
  const method = request.method
  const later = (p) => ctx.waitUntil(p.catch((e) => console.error(e)))
  let m

  if (method !== 'GET') {
    const origin = request.headers.get('origin')
    if (origin && origin !== url.origin) fail(403, 'origin')
  }

  if (path === '/push/key' && method === 'GET') return json({ key: vapidPublicKey(env) })
  if (path === '/ask') return ask(request, env, url)
  if (path === '/account' || path.startsWith('/account/')) return account(request, env, ctx, url, path)
  if (path.startsWith('/social/')) return social(request, env, ctx, path)
  if (path === '/sparks' || path.startsWith('/sparks/')) return sparks(request, db, url, path, method)
  if (path === '/reminders' || path.startsWith('/reminders/')) return reminders(request, env, path, method)

  // Someone opened Blank today (App.jsx, once a day per device): a count per day and source, nothing about them is
  // kept (migrations/0440_blank_visits.sql). Capped per day so a script can't run up the free D1 writes.
  if (path === '/visit' && method === 'POST') {
    const b = await readJson(request, 500)
    const source = VISIT_SOURCES.includes(b.source) ? b.source : 'other'
    await db
      .prepare(
        `INSERT INTO blank_visits (day, source, visitors, new_visitors) VALUES (?, ?, 1, ?)
         ON CONFLICT (day, source) DO UPDATE SET visitors = visitors + 1, new_visitors = new_visitors + excluded.new_visitors
         WHERE visitors < ${VISITS_PER_DAY}`,
      )
      .bind(new Date().toISOString().slice(0, 10), source, b.first ? 1 : 0)
      .run()
    return json({ ok: true })
  }

  // "Send feedback" (You page): lands in Greta's inbox with a notification, signed with the username if logged in
  if (path === '/feedback' && method === 'POST') {
    const b = await readJson(request, 6000)
    const text = String(b.text ?? '').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, '').trim().slice(0, 3000) // keeps line breaks
    if (text.length < 3) fail(400, 'empty')
    const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank`)
    const n = await db.prepare("SELECT COUNT(*) AS n FROM blank_auth_events WHERE kind = 'feedback' AND who = ? AND created > ?").bind(ipHash, Date.now() - DAY).first()
    if ((n?.n || 0) >= FEEDBACK_PER_DAY) fail(429, 'too_many')
    const me = await accountAuth(request, db).catch(() => null)
    await addToInbox(env, ctx, {
      kind: 'blank',
      topic: 'blank',
      name: me ? `@${me.username}` : 'Blank (no account)',
      email: me?.email || '',
      body: text,
      lang: lang(b.lang),
      page: typeof b.page === 'string' ? b.page.slice(0, 100) : null,
      ipHash,
    })
    await db.prepare("INSERT INTO blank_auth_events (kind, who, created) VALUES ('feedback', ?, ?)").bind(ipHash, Date.now()).run()
    return json({ ok: true })
  }

  if (path === '/pairs' && method === 'POST') {
    const b = await readJson(request, 2000)
    const name = str(b.name, 1, 40)
    const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank`)
    const n = await db
      .prepare('SELECT COUNT(*) AS n FROM blank_pairs WHERE ip_hash = ? AND created > ?')
      .bind(ipHash, Date.now() - DAY)
      .first()
    if ((n?.n || 0) >= INVITES_PER_DAY) fail(429, 'too_many')
    const key = newKey()
    const c = code()
    const now = Date.now()
    await db
      .prepare('INSERT INTO blank_pairs (code, a_key, a_name, a_lang, a_seen, ip_hash, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(c, await sha256(key), name, lang(b.lang), now, ipHash, now)
      .run()
    return json({ code: c, key })
  }

  if ((m = path.match(/^\/invite\/([a-z0-9]{10})$/)) && method === 'GET') {
    const row = await db.prepare('SELECT a_name, b_key, created FROM blank_pairs WHERE code = ?').bind(m[1]).first()
    if (!row) fail(404, 'not_found')
    return json({ name: row.a_name, open: !row.b_key && row.created > Date.now() - INVITE_DAYS * DAY })
  }

  if ((m = path.match(/^\/invite\/([a-z0-9]{10})\/join$/)) && method === 'POST') {
    const b = await readJson(request, 2000)
    const name = str(b.name, 1, 40)
    const key = newKey()
    const now = Date.now()
    // Only the first person to accept gets in
    const row = await db
      .prepare(
        `UPDATE blank_pairs SET b_key = ?, b_name = ?, b_lang = ?, b_seen = ?, joined = ?
      WHERE code = ? AND b_key IS NULL AND created > ? RETURNING code, a_push, a_lang`,
      )
      .bind(await sha256(key), name, lang(b.lang), now, now, m[1], now - INVITE_DAYS * DAY)
      .first()
    if (!row) {
      const exists = await db.prepare('SELECT 1 FROM blank_pairs WHERE code = ?').bind(m[1]).first()
      fail(exists ? 409 : 404, exists ? 'taken' : 'not_found')
    }
    if (row.a_push) later(push(env, db, row.code, 'a', row.a_push, message(row.a_lang, 'joined', name)))
    return json({ key })
  }

  // Everything below needs the phone's key
  const me = await auth(request, db)
  const side = me.side
  const other = side === 'a' ? 'b' : 'a'
  const col = (s, f) => `${s}_${f}`

  if (path === '/pair') {
    if (method === 'GET') {
      await db
        .prepare(`UPDATE blank_pairs SET ${col(side, 'seen')} = ? WHERE code = ?`)
        .bind(Date.now(), me.code)
        .run()
      const { results } = await db
        .prepare('SELECT id, side, kind, project, detail, created FROM blank_checkins WHERE code = ? AND created > ? ORDER BY created DESC LIMIT 60')
        .bind(me.code, Date.now() - KEEP_DAYS * DAY)
        .all()
      return json({
        code: me.code,
        side,
        me: { name: me.row[col(side, 'name')], streak: me.row[col(side, 'streak')], push: !!me.row[col(side, 'push')] },
        buddy: me.row[col(other, 'key')] ? { name: me.row[col(other, 'name')], streak: me.row[col(other, 'streak')], seen: me.row[col(other, 'seen')] } : null,
        canNudge: Date.now() - me.row[col(side, 'nudged')] >= NUDGE_GAP,
        checkins: results.map((r) => ({ ...r, mine: r.side === side })),
      })
    }
    if (method === 'PATCH') {
      const b = await readJson(request, 2000)
      const sets = []
      const vals = []
      if (b.name !== undefined) {
        sets.push(`${col(side, 'name')} = ?`)
        vals.push(str(b.name, 1, 40))
      }
      if (b.streak !== undefined) {
        sets.push(`${col(side, 'streak')} = ?`)
        vals.push(streak(b.streak))
      }
      if (b.lang !== undefined) {
        sets.push(`${col(side, 'lang')} = ?`)
        vals.push(lang(b.lang))
      }
      if (!sets.length) fail(400, 'invalid')
      await db
        .prepare(`UPDATE blank_pairs SET ${sets.join(', ')} WHERE code = ?`)
        .bind(...vals, me.code)
        .run()
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.batch([
        db.prepare('DELETE FROM blank_checkins WHERE code = ?').bind(me.code),
        db.prepare('DELETE FROM blank_pairs WHERE code = ?').bind(me.code),
      ])
      return json({ ok: true })
    }
  }

  if (path === '/checkins' && method === 'POST') {
    const b = await readJson(request, 3000)
    if (!KINDS.includes(b.kind)) fail(400, 'invalid')
    const project = str(b.project || '', 0, 80)
    const detail = str(b.detail == null ? '' : String(b.detail), 0, 140)
    const now = Date.now()
    const n = await db
      .prepare('SELECT COUNT(*) AS n FROM blank_checkins WHERE code = ? AND side = ? AND created > ?')
      .bind(me.code, side, now - DAY)
      .first()
    if ((n?.n || 0) >= CHECKINS_PER_DAY) fail(429, 'too_many')
    await db.batch([
      db
        .prepare('INSERT INTO blank_checkins (id, code, side, kind, project, detail, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(id(), me.code, side, b.kind, project, detail, now),
      db.prepare(`UPDATE blank_pairs SET ${col(side, 'streak')} = ?, ${col(side, 'seen')} = ? WHERE code = ?`).bind(streak(b.streak), now, me.code),
      db.prepare('DELETE FROM blank_checkins WHERE code = ? AND created < ?').bind(me.code, now - KEEP_DAYS * DAY),
    ])
    const sub = me.row[col(other, 'push')]
    const quiet = now - me.row[col(other, 'pushed')] < PUSH_GAP && b.kind !== 'finish'
    if (sub && me.row[col(other, 'key')] && !quiet) {
      later(push(env, db, me.code, other, sub, message(me.row[col(other, 'lang')], b.kind, me.row[col(side, 'name')], project, detail)))
    }
    return json({ ok: true })
  }

  if (path === '/nudge' && method === 'POST') {
    if (!me.row[col(other, 'key')]) fail(409, 'no_buddy')
    const now = Date.now()
    const r = await db
      .prepare(`UPDATE blank_pairs SET ${col(side, 'nudged')} = ? WHERE code = ? AND ${col(side, 'nudged')} < ?`)
      .bind(now, me.code, now - NUDGE_GAP)
      .run()
    if (!r.meta.changes) fail(429, 'too_soon')
    await db
      .prepare('INSERT INTO blank_checkins (id, code, side, kind, project, detail, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id(), me.code, side, 'nudge', '', '', now)
      .run()
    const sub = me.row[col(other, 'push')]
    if (sub) later(push(env, db, me.code, other, sub, message(me.row[col(other, 'lang')], 'nudge', me.row[col(side, 'name')])))
    return json({ ok: true })
  }

  if (path === '/push') {
    if (method === 'POST') {
      const b = await readJson(request, 4000)
      const endpoint = String(b.endpoint || '')
      const k = b.keys || {}
      if (!pushEndpointOk(endpoint)) fail(400, 'invalid')
      if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string' || k.p256dh.length > 200 || k.auth.length > 100) fail(400, 'invalid')
      await db
        .prepare(`UPDATE blank_pairs SET ${col(side, 'push')} = ? WHERE code = ?`)
        .bind(JSON.stringify({ endpoint, p256dh: k.p256dh, auth: k.auth }), me.code)
        .run()
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db
        .prepare(`UPDATE blank_pairs SET ${col(side, 'push')} = NULL WHERE code = ?`)
        .bind(me.code)
        .run()
      return json({ ok: true })
    }
  }

  fail(404, 'not_found')
}

// ---------- sparks: "started because of you" ----------

const CATEGORIES = ['art', 'music', 'crafts', 'cooking', 'tech', 'outdoors', 'fitness', 'writing', 'photo', 'garden', 'wood', 'learn', 'other']

function sparkBody(b) {
  if (!Array.isArray(b.steps) || b.steps.length > STEPS_MAX) fail(400, 'invalid')
  return {
    name: str(b.name, 1, 40),
    title: str(b.title, 1, 120),
    category: CATEGORIES.includes(b.category) ? b.category : 'other',
    guideKey: b.guideKey == null || b.guideKey === '' ? null : str(String(b.guideKey), 1, 60),
    steps: JSON.stringify(b.steps.map((s) => str(String(s), 1, 200))),
    lang: lang(b.lang),
  }
}

const countOf = async (db, code) => (await db.prepare('SELECT COUNT(*) AS n FROM blank_spark_starts WHERE code = ?').bind(code).first())?.n || 0

async function ownSpark(request, db, code) {
  const key = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(key)) fail(401, 'unauthorized')
  const row = await db.prepare('SELECT code FROM blank_sparks WHERE code = ? AND key_hash = ?').bind(code, await sha256(key)).first()
  if (!row) fail(404, 'gone')
}

async function sparks(request, db, url, path, method) {
  let m
  if (path === '/sparks' && method === 'POST') {
    const s = sparkBody(await readJson(request, 12000))
    const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank`)
    const n = await db
      .prepare('SELECT COUNT(*) AS n FROM blank_sparks WHERE ip_hash = ? AND created > ?')
      .bind(ipHash, Date.now() - DAY)
      .first()
    if ((n?.n || 0) >= SPARKS_PER_DAY) fail(429, 'too_many')
    const key = newKey()
    const c = code()
    const now = Date.now()
    await db
      .prepare(
        'INSERT INTO blank_sparks (code, key_hash, name, title, category, guide_key, steps, lang, ip_hash, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(c, await sha256(key), s.name, s.title, s.category, s.guideKey, s.steps, s.lang, ipHash, now, now)
      .run()
    return json({ code: c, key })
  }

  // The sharer's counts, many at once. Counts aren't secret: anyone with a link sees its number too.
  if (path === '/sparks' && method === 'GET') {
    const codes = [...new Set((url.searchParams.get('codes') || '').split(',').filter((c) => /^[a-z0-9]{10}$/.test(c)))].slice(0, 50)
    if (!codes.length) return json({})
    const { results } = await db
      .prepare(`SELECT code, COUNT(*) AS n FROM blank_spark_starts WHERE code IN (${codes.map(() => '?').join(',')}) GROUP BY code`)
      .bind(...codes)
      .all()
    const out = Object.fromEntries(codes.map((c) => [c, 0]))
    for (const r of results) out[r.code] = r.n
    return json(out)
  }

  if ((m = path.match(/^\/sparks\/([a-z0-9]{10})$/))) {
    const c = m[1]
    if (method === 'GET') {
      const row = await db.prepare('SELECT name, title, category, guide_key, steps, lang FROM blank_sparks WHERE code = ?').bind(c).first()
      if (!row) fail(404, 'not_found')
      return json({ name: row.name, title: row.title, category: row.category, guideKey: row.guide_key, steps: JSON.parse(row.steps), lang: row.lang || null, started: await countOf(db, c) })
    }
    if (method === 'PUT') {
      await ownSpark(request, db, c)
      const s = sparkBody(await readJson(request, 12000))
      await db
        .prepare('UPDATE blank_sparks SET name = ?, title = ?, category = ?, guide_key = ?, steps = ?, lang = ?, updated = ? WHERE code = ?')
        .bind(s.name, s.title, s.category, s.guideKey, s.steps, s.lang, Date.now(), c)
        .run()
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await ownSpark(request, db, c)
      await db.batch([db.prepare('DELETE FROM blank_spark_starts WHERE code = ?').bind(c), db.prepare('DELETE FROM blank_sparks WHERE code = ?').bind(c)])
      return json({ ok: true })
    }
  }

  if ((m = path.match(/^\/sparks\/([a-z0-9]{10})\/start$/)) && method === 'POST') {
    const c = m[1]
    const b = await readJson(request, 1000)
    if (typeof b.device !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(b.device)) fail(400, 'invalid')
    const row = await db.prepare('SELECT 1 FROM blank_sparks WHERE code = ?').bind(c).first()
    if (!row) fail(404, 'not_found')
    const ipHash = await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank`)
    const now = Date.now()
    const n = await db
      .prepare('SELECT COUNT(*) AS n FROM blank_spark_starts WHERE ip_hash = ? AND created > ?')
      .bind(ipHash, now - DAY)
      .first()
    if ((n?.n || 0) >= STARTS_PER_DAY) fail(429, 'too_many')
    await db
      .prepare('INSERT OR IGNORE INTO blank_spark_starts (code, device_hash, ip_hash, created) VALUES (?, ?, ?, ?)')
      .bind(c, await sha256(`${b.device}|${c}`), ipHash, now)
      .run()
    return json({ started: await countOf(db, c) })
  }

  fail(404, 'not_found')
}

async function auth(request, db) {
  const key = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(key)) fail(401, 'unauthorized')
  const h = await sha256(key)
  const row = await db.prepare('SELECT * FROM blank_pairs WHERE a_key = ?1 OR b_key = ?1').bind(h).first()
  if (!row) fail(404, 'gone') // the pair was ended (by you on another phone, or by your buddy)
  return { row, code: row.code, side: row.a_key === h ? 'a' : 'b' }
}

async function readJson(request, max) {
  if (!/^application\/json\b/i.test(request.headers.get('content-type') || '')) fail(415, 'json_only')
  const text = await request.text()
  if (text.length > max) fail(413, 'too_big')
  try {
    const b = JSON.parse(text)
    if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error()
    return b
  } catch {
    fail(400, 'invalid')
  }
}

function str(v, min, max) {
  const s =
    typeof v === 'string'
      ? v
          .replace(/[\u0000-\u001F\u007F]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : ''
  if (s.length < min || s.length > max) fail(400, 'invalid')
  return s
}
const streak = (v) => Math.max(0, Math.min(100000, Math.floor(Number(v) || 0)))
const lang = (v) => (v === 'de' || v === 'hu' ? v : 'en')

// The notification text, in the receiver's language
function message(to, kind, name, project = '', detail = '') {
  const de = to === 'de'
  const hu = to === 'hu'
  const T = {
    joined: hu
      ? [`${name} mostantól a buddyd`, 'Mostantól láthatjátok egymás haladását.']
      : de
        ? [`${name} ist jetzt dein Buddy`, 'Ab jetzt seht ihr euren Fortschritt gegenseitig.']
        : [`${name} is your buddy now`, 'You can see each other’s progress from now on.'],
    step: hu
      ? [`${name} kipipált egy lépést`, [detail, project].filter(Boolean).join(' · ')]
      : de
        ? [`${name} hat einen Schritt geschafft`, [detail, project].filter(Boolean).join(' · ')]
        : [`${name} ticked off a step`, [detail, project].filter(Boolean).join(' · ')],
    photo: hu ? [`${name} haladásfotót tett fel`, project] : de ? [`${name} hat ein Foto hinzugefügt`, project] : [`${name} added a progress photo`, project],
    entry: hu ? [`${name} haladást rögzített`, project] : de ? [`${name} hat Fortschritt eingetragen`, project] : [`${name} logged some progress`, project],
    session: hu
      ? [`${name} ${detail} percet dolgozott`, project]
      : de
        ? [`${name} hat ${detail} Minuten gearbeitet`, project]
        : [`${name} put in ${detail} minutes`, project],
    finish: hu
      ? [`${name} befejezte`, project ? `„${project}” kész.` : '']
      : de
        ? [`${name} hat es geschafft`, project ? `„${project}“ ist fertig.` : '']
        : [`${name} finished`, project ? `“${project}” is done.` : ''],
    nudge: hu ? [`${name} megbökött`, 'Te jössz.'] : de ? [`${name} stupst dich an`, 'Du bist dran.'] : [`${name} nudged you`, 'Your turn.'],
    cheer: hu ? [`${name} megünnepelte, amit ma csináltál`, ''] : de ? [`${name} feiert, was du heute gemacht hast`, ''] : [`${name} cheered what you did today`, ''],
  }[kind]
  return { title: T[0], body: T[1] || '', tag: kind === 'nudge' ? 'blank-nudge' : 'blank-buddy', url: '' }
}

async function push(env, db, pairCode, to, subJson, msg) {
  if (!env.VAPID_PRIVATE) return
  let sub
  try {
    sub = JSON.parse(subJson)
  } catch {
    return
  }
  if (!pushEndpointOk(sub?.endpoint)) return // saved before the check above existed
  await db.prepare(`UPDATE blank_pairs SET ${to}_pushed = ? WHERE code = ?`).bind(Date.now(), pairCode).run()
  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      authorization: await vapidAuth(env, sub.endpoint),
      'content-encoding': 'aes128gcm',
      'content-type': 'application/octet-stream',
      ttl: '86400',
      urgency: 'normal',
    },
    body: await encrypt(sub, JSON.stringify(msg)),
  })
  if (res.status === 404 || res.status === 410) await db.prepare(`UPDATE blank_pairs SET ${to}_push = NULL WHERE code = ?`).bind(pairCode).run()
  else if (!res.ok) console.error('blank push', res.status, await res.text())
}
