// BW Buddy accounts (/bwbuddy/api/account/*): an optional username + password (or passkey), so a student's progress
// follows them to another phone or computer and isn't lost when the browser clears its storage (iOS Safari does after
// about 7 days without a visit). BW Buddy works fully without one; the account only keeps a copy on the server.
// No email and no real name (students are 14 to 19): a forgotten password is reset with the one-time recovery code
// shown at signup (only its SHA-256 is kept), or the student logs in with their passkey.
//
// Built like Blank's accounts (blank-account.js, whose helpers it imports) with its own tables
// (worker/migrations/0560_bwbuddy_accounts.sql, yap database, binding DB).
//
//   POST   /account/signup    { username, password, data? }      → { token, username, rev, recoveryCode }
//   POST   /account/login     { username, password }             → { token, username, rev, data, password }
//   POST   /account/recover   { username, code, newPassword }    → like login, plus a new recoveryCode (the old one is used
//                                                                  up, every other device is logged out)
//   GET    /account           (token)                            → { username, created, rev, password, passkeys }
//   GET    /account/data?rev=N (token)                           → { rev, data } (data null when rev is still N)
//   PUT    /account/data      (token) { data, rev }              → { rev }   409 { rev, data } if another device saved first
//   POST   /account/password  (token) { password, newPassword }  changes it and logs out every other device
//                                                                  (a passkey-only account sets its first one without `password`)
//   POST   /account/recovery-code (token) { password? }          → { recoveryCode } a new one (the old one stops working)
//   POST   /account/logout    (token)
//   DELETE /account           (token) { password? }              deletes the account and its saved data
//   POST   /account/passkey/register/options { username } | (token) → options for navigator.credentials.create()
//   POST   /account/passkey/register/verify  { challengeId, id, clientDataJSON, authenticatorData, publicKey, alg, transports?, data? }
//                                                                → { token, username, rev, recoveryCode } new account; { ok, passkeys } with a token
//   POST   /account/passkey/login/options    → { challengeId, challenge, rpId, allowCredentials: [] }
//   POST   /account/passkey/login/verify     { challengeId, id, clientDataJSON, authenticatorData, signature, userHandle? }
//                                                                → { token, username, rev, data, password }
//
// "(token)" = header "Authorization: Bearer <token>". data = { progress, game, savedAt } (savedAt only coming back).
//
// Free tier (Greta's rule): this uses only the D1 database that Yap, Blank and Agora share, so it's frugal.
// The app saves at most once a minute while open plus once when it's put away, and only when something changed;
// here an unchanged save isn't written (data_hash), a save is at most 300 KB, and one account can save at most
// 300 times a day. A save is 1 row written; opening the app reads 2 rows. Nothing here can cost money: on the Workers
// Free plan D1 and requests stop at the daily limit instead of billing.

import { badWords } from './blank-words.js'
import { unb64url, verifyAssertion, verifyRegistration } from './passkeys.js'
import {
  HttpError,
  b64url,
  fail,
  hex,
  json,
  pbkdf2,
  random,
  readJson,
  readTransports,
  relyingParty,
  same,
  sha256,
  signCount,
  transports,
  unhex,
} from './blank-account.js'

const ITER = 100_000
const DATA_MAX = 300_000 // bytes of JSON per account
const WRITES_PER_DAY = 300 // saves per account and day (the app does far fewer)
const SESSION_DAYS = 365 // logged out after a year without opening BW Buddy
const FAILS_PER_USER = 10 // wrong passwords / recovery codes per 15 minutes
const FAILS_PER_IP = 60 // higher than Blank: a whole class shares the school's network
const SIGNUPS_PER_IP = 40 // per day, same reason
const PASSKEY_MINUTES = 5
const PASSKEYS_PER_USER = 10
const OPEN_CHALLENGES_PER_IP = 30
const MIN = 60_000
const DAY = 86_400_000
const enc = new TextEncoder()

// Letters and digits that can't be mixed up when copied by hand (no 0/O, 1/I)
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newRecoveryCode() {
  const bytes = random(16) // 16 × 5 bits = 80 bits
  const s = [...bytes].map((b) => CODE_ABC[b & 31]).join('')
  return s.match(/.{4}/g).join('-')
}
const normalCode = (v) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
const recoveryHash = (userId, code) => sha256(`bwbuddy-recovery|${userId}|${normalCode(code)}`)

const USERNAME = /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/
const cleanName = (v) => String(v ?? '').trim().toLowerCase().replace(/^@/, '')
function username(v) {
  const u = cleanName(v)
  if (!USERNAME.test(u)) fail(400, 'bad_username')
  return u
}
function password(v) {
  const p = String(v ?? '')
  if (p.length < 8) fail(400, 'short_password')
  if (p.length > 200) fail(400, 'bad_password')
  return p
}

// { progress, game }: each an object or null. Returns the JSON that gets stored.
function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) fail(400, 'bad_data')
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null)
  const progress = obj(d.progress)
  const game = obj(d.game)
  if ((d.progress && !progress) || (d.game && !game)) fail(400, 'bad_data')
  if (progress && 'xp' in progress && typeof progress.xp !== 'number') fail(400, 'bad_data')
  const text = JSON.stringify({ progress, game })
  if (text.length > DATA_MAX) fail(413, 'too_big')
  return text
}
const dataOut = (row) => {
  if (!row?.data) return null
  try {
    return { ...JSON.parse(row.data), savedAt: row.updated }
  } catch {
    return null
  }
}

async function count(db, kind, who, since) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM bwbuddy_auth_events WHERE kind = ? AND who = ? AND created > ?').bind(kind, who, since).first()
  return r?.n || 0
}
const note = (db, kind, who) => db.prepare('INSERT INTO bwbuddy_auth_events (kind, who, created) VALUES (?, ?, ?)').bind(kind, who, Date.now()).run()
const noteFail = (db, user, ip) =>
  db.batch([
    db.prepare('INSERT INTO bwbuddy_auth_events (kind, who, created) VALUES (?, ?, ?)').bind('fail', user, Date.now()),
    db.prepare('INSERT INTO bwbuddy_auth_events (kind, who, created) VALUES (?, ?, ?)').bind('fail', ip, Date.now()),
  ])
async function tooManyFails(db, ip, user) {
  const since = Date.now() - 15 * MIN
  if ((await count(db, 'fail', ip, since)) >= FAILS_PER_IP) fail(429, 'too_many')
  if (user && (await count(db, 'fail', user, since)) >= FAILS_PER_USER) fail(429, 'too_many')
}

async function checkPassword(db, user, given, ip) {
  if (await pbkdf2(given, unhex(user.pass_salt), user.pass_iter).then((h) => same(h, user.pass_hash))) return
  await noteFail(db, user.username, ip)
  fail(401, 'wrong_password')
}

async function newSession(db, userId) {
  const token = b64url(random(32))
  const now = Date.now()
  await db.prepare('INSERT INTO bwbuddy_sessions (token_hash, user_id, created, seen) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now, now).run()
  return token
}

async function auth(request, db) {
  const m = (request.headers.get('authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{20,100})$/)
  if (!m) fail(401, 'logged_out')
  const hash = await sha256(m[1])
  const row = await db
    .prepare(
      `SELECT s.user_id, s.seen, u.username, u.created, u.rev, u.data_hash, u.pass_hash, u.pass_salt, u.pass_iter, u.has_password
       FROM bwbuddy_sessions s JOIN bwbuddy_users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .bind(hash)
    .first()
  if (!row || row.seen < Date.now() - SESSION_DAYS * DAY) fail(401, 'logged_out')
  // "Last seen" at most once a day, so it costs one row write per device and day
  if (row.seen < Date.now() - DAY) await db.prepare('UPDATE bwbuddy_sessions SET seen = ? WHERE token_hash = ?').bind(Date.now(), hash).run()
  return { ...row, tokenHash: hash }
}

// ---------- passkeys (same ceremony as Blank's, own tables) ----------
async function newChallenge(db, ip, kind, { username = null, userId = null } = {}) {
  const open = await db.prepare('SELECT COUNT(*) AS n FROM bwbuddy_passkey_challenges WHERE ip = ? AND expires > ?').bind(ip, Date.now()).first()
  if ((open?.n || 0) >= OPEN_CHALLENGES_PER_IP) fail(429, 'too_many')
  const id = b64url(random(16))
  const challenge = b64url(random(32))
  await db.batch([
    db.prepare('DELETE FROM bwbuddy_passkey_challenges WHERE expires < ?').bind(Date.now()),
    db
      .prepare('INSERT INTO bwbuddy_passkey_challenges (id, challenge, kind, username, user_id, ip, expires) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, challenge, kind, username, userId, ip, Date.now() + PASSKEY_MINUTES * MIN),
  ])
  return { id, challenge }
}
async function takeChallenge(db, id, kind) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(String(id ?? ''))) fail(400, 'expired')
  const row = await db
    .prepare('DELETE FROM bwbuddy_passkey_challenges WHERE id = ? AND kind = ? AND expires > ? RETURNING challenge, username, user_id')
    .bind(String(id), kind, Date.now())
    .first()
  if (!row) fail(400, 'expired')
  return row
}
// The phone's passkey list shows "name (BW Buddy)", so it isn't mixed up with a Blank passkey on the same site
const creationOptions = (rp, c, user, exclude) => ({
  challengeId: c.id,
  challenge: c.challenge,
  rp: { id: rp.rpId, name: 'BW Buddy' },
  user: { id: b64url(enc.encode(user.id)), name: `${user.username} (BW Buddy)`, displayName: `${user.username} (BW Buddy)` },
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  excludeCredentials: exclude,
  authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' },
  attestation: 'none',
  timeout: PASSKEY_MINUTES * MIN,
})

async function checkNewUsername(db, ip, u) {
  if (badWords(u.replace(/[._-]+/g, ' '), u)) fail(400, 'rude_username')
  if ((await count(db, 'signup', ip, Date.now() - DAY)) >= SIGNUPS_PER_IP) fail(429, 'too_many')
  if (await db.prepare('SELECT 1 FROM bwbuddy_users WHERE username = ?').bind(u).first()) fail(409, 'taken')
}

// ---------- routes ----------
export async function bwbuddy(request, env, ctx, url) {
  try {
    if (!env.DB) fail(503, 'no_db')
    const path = url.pathname.slice('/bwbuddy/api'.length)
    // Writes only from BW Buddy's own pages
    if (request.method !== 'GET') {
      const origin = request.headers.get('origin')
      if (origin && origin !== url.origin) fail(403, 'origin')
    }
    if (path === '/account' || path.startsWith('/account/')) return await route(request, env, ctx, url, path)
    fail(404, 'not_found')
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, ...e.extra }, e.status)
    console.error(e)
    return json({ error: 'server' }, 500)
  }
}

async function route(request, env, ctx, url, path) {
  const db = env.DB
  const method = request.method
  const ip = `ip:${await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|bwbuddy-account`)}`
  // Old guessing records go away on their own
  if (Math.random() < 0.02) ctx.waitUntil(db.prepare('DELETE FROM bwbuddy_auth_events WHERE created < ?').bind(Date.now() - DAY).run().catch(() => {}))

  if (path === '/account/signup' && method === 'POST') {
    const b = await readJson(request, DATA_MAX + 2000)
    const u = username(b.username)
    const p = password(b.password)
    const data = b.data ? cleanData(b.data) : null
    await checkNewUsername(db, ip, u)
    const salt = random(16)
    const id = hex(random(12))
    const code = newRecoveryCode()
    const now = Date.now()
    try {
      await db
        .prepare(
          `INSERT INTO bwbuddy_users (id, username, pass_hash, pass_salt, pass_iter, recovery_hash, data, data_hash, rev, writes_day, writes_n, updated, created)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(id, u, await pbkdf2(p, salt, ITER), hex(salt), ITER, await recoveryHash(id, code), data, data && (await sha256(data)), data ? 1 : 0, null, 0, now, now)
        .run()
    } catch (e) {
      if (/UNIQUE/i.test(String(e?.message))) fail(409, 'taken')
      throw e
    }
    await note(db, 'signup', ip)
    return json({ token: await newSession(db, id), username: u, rev: data ? 1 : 0, recoveryCode: code })
  }

  if (path === '/account/login' && method === 'POST') {
    const b = await readJson(request, 2000)
    const u = cleanName(b.username)
    const p = String(b.password ?? '')
    await tooManyFails(db, ip, USERNAME.test(u) ? u : null)
    const user = USERNAME.test(u) && (await db.prepare('SELECT * FROM bwbuddy_users WHERE username = ?').bind(u).first())
    if (!user) {
      await pbkdf2(p, random(16), ITER) // as slow as a real check, so it doesn't tell which usernames exist
      await note(db, 'fail', ip)
      fail(401, 'wrong_password')
    }
    await checkPassword(db, user, p, ip)
    return json({ token: await newSession(db, user.id), username: user.username, rev: user.rev, data: dataOut(user), password: !!user.has_password })
  }

  // Forgot the password: the recovery code from signup sets a new one (and is used up; a new code comes back)
  if (path === '/account/recover' && method === 'POST') {
    const b = await readJson(request, 2000)
    const u = cleanName(b.username)
    await tooManyFails(db, ip, USERNAME.test(u) ? u : null)
    const p = password(b.newPassword)
    const user = USERNAME.test(u) && (await db.prepare('SELECT * FROM bwbuddy_users WHERE username = ?').bind(u).first())
    const ok = user?.recovery_hash && same(await recoveryHash(user.id, b.code), user.recovery_hash)
    if (!ok) {
      await noteFail(db, USERNAME.test(u) ? u : 'none', ip)
      fail(401, 'wrong_code')
    }
    const salt = random(16)
    const code = newRecoveryCode()
    await db.batch([
      db
        .prepare('UPDATE bwbuddy_users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, has_password = 1, recovery_hash = ? WHERE id = ?')
        .bind(await pbkdf2(p, salt, ITER), hex(salt), ITER, await recoveryHash(user.id, code), user.id),
      db.prepare('DELETE FROM bwbuddy_sessions WHERE user_id = ?').bind(user.id),
      db.prepare("DELETE FROM bwbuddy_auth_events WHERE kind = 'fail' AND who = ?").bind(user.username),
    ])
    return json({ token: await newSession(db, user.id), username: user.username, rev: user.rev, data: dataOut(user), password: true, recoveryCode: code })
  }

  if (path === '/account/passkey/register/options' && method === 'POST') {
    const b = await readJson(request, 2000)
    const rp = relyingParty(request)
    if (request.headers.get('authorization')) {
      const me = await auth(request, db)
      const keys = (await db.prepare('SELECT id, transports FROM bwbuddy_passkeys WHERE user_id = ?').bind(me.user_id).all()).results || []
      if (keys.length >= PASSKEYS_PER_USER) fail(400, 'too_many_passkeys')
      const c = await newChallenge(db, ip, 'add', { userId: me.user_id })
      const exclude = keys.map((k) => ({ type: 'public-key', id: k.id, transports: readTransports(k.transports) }))
      return json(creationOptions(rp, c, { id: me.user_id, username: me.username }, exclude))
    }
    const u = username(b.username)
    await checkNewUsername(db, ip, u)
    const id = hex(random(12))
    const c = await newChallenge(db, ip, 'new', { username: u, userId: id })
    return json(creationOptions(rp, c, { id, username: u }, []))
  }

  if (path === '/account/passkey/register/verify' && method === 'POST') {
    const b = await readJson(request, DATA_MAX + 20000)
    const rp = relyingParty(request)
    await tooManyFails(db, ip)
    const me = request.headers.get('authorization') ? await auth(request, db) : null
    const ch = await takeChallenge(db, b.challengeId, me ? 'add' : 'new')
    if (me && ch.user_id !== me.user_id) fail(400, 'expired')
    let key
    try {
      key = await verifyRegistration(rp, b, ch.challenge)
    } catch {
      await note(db, 'fail', ip)
      fail(400, 'passkey_failed')
    }
    const now = Date.now()
    const insertKey = (userId) =>
      db
        .prepare('INSERT INTO bwbuddy_passkeys (id, user_id, public_key, alg, counter, transports, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(key.id, userId, key.publicKey, key.alg, signCount(unb64url(b.authenticatorData)), JSON.stringify(transports(b.transports)), now)
    const owner = (await db.prepare('SELECT user_id FROM bwbuddy_passkeys WHERE id = ?').bind(key.id).first())?.user_id
    if (owner && owner !== me?.user_id) fail(409, 'passkey_taken')

    if (me) {
      const n = (await db.prepare('SELECT COUNT(*) AS n FROM bwbuddy_passkeys WHERE user_id = ?').bind(me.user_id).first())?.n || 0
      if (owner) return json({ ok: true, passkeys: n })
      if (n >= PASSKEYS_PER_USER) fail(400, 'too_many_passkeys')
      await insertKey(me.user_id).run()
      return json({ ok: true, passkeys: n + 1 })
    }

    // A new account, like /account/signup but with a random password hash nobody can log in with
    const data = b.data ? cleanData(b.data) : null
    if ((await count(db, 'signup', ip, now - DAY)) >= SIGNUPS_PER_IP) fail(429, 'too_many')
    const u = ch.username
    const id = ch.user_id
    const code = newRecoveryCode()
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO bwbuddy_users (id, username, pass_hash, pass_salt, pass_iter, has_password, recovery_hash, data, data_hash, rev, writes_n, updated, created)
             VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, 0, ?, ?)`,
          )
          .bind(id, u, hex(random(32)), hex(random(16)), ITER, await recoveryHash(id, code), data, data && (await sha256(data)), data ? 1 : 0, now, now),
        insertKey(id),
      ])
    } catch (e) {
      if (/UNIQUE/i.test(String(e?.message))) fail(409, 'taken')
      throw e
    }
    await note(db, 'signup', ip)
    return json({ token: await newSession(db, id), username: u, rev: data ? 1 : 0, recoveryCode: code })
  }

  if (path === '/account/passkey/login/options' && method === 'POST') {
    const c = await newChallenge(db, ip, 'login')
    return json({ challengeId: c.id, challenge: c.challenge, rpId: relyingParty(request).rpId, allowCredentials: [], userVerification: 'preferred', timeout: PASSKEY_MINUTES * MIN })
  }

  if (path === '/account/passkey/login/verify' && method === 'POST') {
    const b = await readJson(request, 20000)
    await tooManyFails(db, ip)
    const ch = await takeChallenge(db, b.challengeId, 'login')
    const stored = await db.prepare('SELECT * FROM bwbuddy_passkeys WHERE id = ?').bind(String(b.id ?? '')).first()
    const user = stored && (await db.prepare('SELECT * FROM bwbuddy_users WHERE id = ?').bind(stored.user_id).first())
    if (!user) {
      await note(db, 'fail', ip)
      fail(401, 'passkey_unknown') // e.g. a Blank passkey picked on BW Buddy
    }
    let n
    try {
      if (b.userHandle && new TextDecoder().decode(unb64url(b.userHandle)) !== user.id) throw new Error('Wrong account')
      await verifyAssertion(relyingParty(request), stored, ch.challenge, b)
      n = signCount(unb64url(b.authenticatorData))
      if ((n || stored.counter) && n <= stored.counter) throw new Error('Counter went back')
    } catch {
      await note(db, 'fail', ip)
      fail(401, 'passkey_failed')
    }
    await db.prepare('UPDATE bwbuddy_passkeys SET counter = ?, used = ? WHERE id = ?').bind(n, Date.now(), stored.id).run()
    return json({ token: await newSession(db, user.id), username: user.username, rev: user.rev, data: dataOut(user), password: !!user.has_password })
  }

  // Everything below needs a logged-in device
  const me = await auth(request, db)

  if (path === '/account' && method === 'GET') {
    const keys = await db.prepare('SELECT COUNT(*) AS n FROM bwbuddy_passkeys WHERE user_id = ?').bind(me.user_id).first()
    return json({ username: me.username, created: me.created, rev: me.rev, password: !!me.has_password, passkeys: keys?.n || 0 })
  }

  // The newest copy, but only if it's newer than the one this device has (rev): otherwise just the rev
  if (path === '/account/data' && method === 'GET') {
    const known = Number(url.searchParams.get('rev'))
    if (Number.isInteger(known) && known === me.rev) return json({ rev: me.rev, data: null })
    const row = await db.prepare('SELECT rev, data, updated FROM bwbuddy_users WHERE id = ?').bind(me.user_id).first()
    return json({ rev: row.rev, data: dataOut(row) })
  }

  if (path === '/account/data' && method === 'PUT') {
    const b = await readJson(request, DATA_MAX + 2000)
    const data = cleanData(b.data)
    const hash = await sha256(data)
    const base = Number(b.rev)
    // Nothing new: no write
    if (base === me.rev && hash === me.data_hash) return json({ rev: me.rev, same: true })
    const today = new Date().toISOString().slice(0, 10)
    // Only saves if nobody saved since this device last saw the data, and the account is under its daily saves
    const row = await db
      .prepare(
        `UPDATE bwbuddy_users SET data = ?1, data_hash = ?2, rev = rev + 1, updated = ?3,
           writes_n = CASE WHEN writes_day = ?4 THEN writes_n + 1 ELSE 1 END, writes_day = ?4
         WHERE id = ?5 AND rev = ?6 AND NOT (writes_day IS ?4 AND writes_n >= ${WRITES_PER_DAY}) RETURNING rev`,
      )
      .bind(data, hash, Date.now(), today, me.user_id, base)
      .first()
    if (!row) {
      const cur = await db.prepare('SELECT rev, data, updated, writes_day, writes_n FROM bwbuddy_users WHERE id = ?').bind(me.user_id).first()
      if (cur.rev !== base) fail(409, 'conflict', { rev: cur.rev, data: dataOut(cur) })
      fail(429, 'too_many') // the daily saves are used up: the next ones go up tomorrow
    }
    return json({ rev: row.rev })
  }

  if (path === '/account/password' && method === 'POST') {
    const b = await readJson(request, 2000)
    if (me.has_password) {
      await tooManyFails(db, ip, me.username)
      await checkPassword(db, me, String(b.password ?? ''), ip)
    }
    const p = password(b.newPassword)
    const salt = random(16)
    await db.batch([
      db.prepare('UPDATE bwbuddy_users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, has_password = 1 WHERE id = ?').bind(await pbkdf2(p, salt, ITER), hex(salt), ITER, me.user_id),
      // A changed password logs out every other device; adding a first one doesn't
      db.prepare('DELETE FROM bwbuddy_sessions WHERE user_id = ? AND token_hash != ? AND ?').bind(me.user_id, me.tokenHash, me.has_password ? 1 : 0),
    ])
    return json({ ok: true })
  }

  // A new recovery code (e.g. the old one got lost); the old one stops working
  if (path === '/account/recovery-code' && method === 'POST') {
    const b = await readJson(request, 2000)
    if (me.has_password) {
      await tooManyFails(db, ip, me.username)
      await checkPassword(db, me, String(b.password ?? ''), ip)
    }
    const code = newRecoveryCode()
    await db.prepare('UPDATE bwbuddy_users SET recovery_hash = ? WHERE id = ?').bind(await recoveryHash(me.user_id, code), me.user_id).run()
    return json({ recoveryCode: code })
  }

  if (path === '/account/logout' && method === 'POST') {
    await db.prepare('DELETE FROM bwbuddy_sessions WHERE token_hash = ?').bind(me.tokenHash).run()
    return json({ ok: true })
  }

  if (path === '/account' && method === 'DELETE') {
    const b = await readJson(request, 2000)
    if (me.has_password) {
      await tooManyFails(db, ip, me.username)
      await checkPassword(db, me, String(b.password ?? ''), ip)
    }
    const uid = me.user_id
    await db.batch([
      db.prepare('DELETE FROM bwbuddy_sessions WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM bwbuddy_passkeys WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM bwbuddy_passkey_challenges WHERE user_id = ?').bind(uid),
      db.prepare("DELETE FROM bwbuddy_auth_events WHERE kind = 'fail' AND who = ?").bind(me.username),
      db.prepare('DELETE FROM bwbuddy_users WHERE id = ?').bind(uid),
    ])
    return json({ ok: true })
  }

  fail(404, 'not_found')
}
