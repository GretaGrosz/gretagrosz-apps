// Blank accounts (/blank/api/account/*): a username and a password, so your projects follow you to another phone
// or computer. Blank still works fully without one; an account only adds the copy on the server.
// The data syncs through D1; photos go to R2 (bucket blank-photos, binding PHOTOS) under u/<user id>/<photo id>,
// so the same photo shows on every device. The bucket is private: photos only come out through this Worker.
//
//   POST   /account/signup    { username, password, email?, data? } → { token, username, rev }
//   POST   /account/login     { username, password }           → { token, username, rev, data }
//   GET    /account           (token)                          → { username, created, rev, email, password, data } (password: has one)
//   PUT    /account/data      (token) { data, rev }            → { rev }   409 { rev, data } if another device saved first
//   POST   /account/password  (token) { password, newPassword } changes it and logs out every other device
//                                                               (a passkey-only account sets its first one without `password`)
//   POST   /account/logout    (token)
//   DELETE /account           (token) { password }             deletes the account, its saved data and its photos (no password
//                                                               needed for a passkey-only account)
//   PUT    /account/email     (token) { email }                adds/changes the email for password resets ('' removes it)
//   POST   /account/forgot    { login, lang }                  login = username or email → sends a reset link (always { ok })
//   POST   /account/reset     { token, password }              sets a new password from the link → { username }
//   POST   /account/passkey/register/options { username }        → options for navigator.credentials.create() + challengeId (a new account;
//                                                                  the username is checked like signup)
//   POST   /account/passkey/register/options (token)             → the same, to add a passkey to the account you're logged into
//   POST   /account/passkey/register/verify  { challengeId, id, clientDataJSON, authenticatorData, publicKey, alg, transports?, data? }
//                                                                → { token, username, rev } for a new account, { ok, passkeys } with a token
//   POST   /account/passkey/login/options    → { challengeId, challenge, rpId, allowCredentials: [] } (any passkey on the phone, no username)
//   POST   /account/passkey/login/verify     { challengeId, id, clientDataJSON, authenticatorData, signature, userHandle? }
//                                                                → { token, username, rev, data, password }
//   PUT    /account/photos/:id (token) body = the image            stores one photo (the id is the one in "idb:<id>")
//   GET    /account/photos/:id (token)                             → the image
//   DELETE /account/photos/:id (token)
//
// "(token)" = header "Authorization: Bearer <token>". Tables: worker/migrations/0330_blank_accounts.sql (yap database).
// Reset emails go out through Resend (secret RESEND_KEY: npx wrangler secret put RESEND_KEY), from blank@gretagrosz.com.
// Passwords: PBKDF2-SHA256 with a random salt (100k rounds, the most Workers allow). Tokens: 32 random bytes, only
// their SHA-256 is stored. Wrong passwords are limited per username and per network.
// Passkeys (Face ID, fingerprint, screen lock): WebAuthn checked with WebCrypto in passkeys.js (ES256 + RS256, attestation
// 'none', discoverable). The browser hands over the public key (getPublicKey()), so no CBOR. Challenges live five minutes in
// blank_passkey_challenges and are deleted on use; rpID comes from the request's host (gretagrosz.com, the workers.dev
// host, localhost in dev). Accounts made with only a passkey have has_password = 0 and a random, unusable pass_hash.
// Tables: worker/migrations/0550_blank_passkeys.sql.
// BW Buddy's accounts (bwbuddy-account.js) reuse the exported helpers below; they don't change anything here.

import { use } from './limits.js'
import { badWords } from './blank-words.js'
import { unb64url, verifyAssertion, verifyRegistration } from './passkeys.js'

const ITER = 100_000
const DATA_MAX = 1_500_000 // bytes of JSON; photos aren't in it, so real data is far smaller
const SESSION_DAYS = 365 // logged out after a year without opening Blank
const FAILS_PER_USER = 10 // per 15 minutes
const FAILS_PER_IP = 40
const SIGNUPS_PER_IP = 10 // per day
const PHOTO_MAX = 8_000_000 // bytes; Blank shrinks photos to ~300 KB before saving, so this is generous
const PHOTOS_PER_DAY = 600
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const PHOTO_ID = /^[A-Za-z0-9_-]{3,64}$/
const FOUNDERS = 50 // the first 50 accounts are founding testers (migration 0390)
const RESET_MINUTES = 60
const RESETS_PER_HOUR = 3 // per account, and 10 per network
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i
const PASSKEY_MINUTES = 5
const PASSKEYS_PER_USER = 10
const OPEN_CHALLENGES_PER_IP = 30 // unused passkey challenges one network can have at a time
const MIN = 60_000
const DAY = 86_400_000

export class HttpError extends Error {
  constructor(status, error, extra) {
    super(error)
    this.status = status
    this.extra = extra
  }
}
export const fail = (status, error, extra) => {
  throw new HttpError(status, error, extra)
}
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
const enc = new TextEncoder()
export const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
export const unhex = (s) => new Uint8Array(s.match(/../g).map((h) => parseInt(h, 16)))
export const sha256 = async (s) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)))
export const random = (n) => crypto.getRandomValues(new Uint8Array(n))
export const b64url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

export async function pbkdf2(password, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256))
}
// Same time whether or not the hashes match
export function same(a, b) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}

const USERNAME = /^[a-z0-9._]{3,24}$/
function username(v) {
  const u = String(v ?? '').trim().toLowerCase().replace(/^@/, '')
  if (!USERNAME.test(u) || /^[._]|[._]$/.test(u)) fail(400, 'bad_username')
  return u
}
function password(v) {
  const p = String(v ?? '')
  if (p.length < 8) fail(400, 'short_password')
  if (p.length > 200) fail(400, 'bad_password')
  return p
}
function email(v) {
  const e = String(v ?? '').trim().toLowerCase()
  if (!e) return null
  if (e.length > 254 || !EMAIL.test(e)) fail(400, 'bad_email')
  return e
}

const RESET_TEXT = {
  en: { subject: 'Reset your Blank password', hi: 'Hi @{u},', body: 'Someone asked to reset the password for your Blank account. Tap the button to choose a new one. The link works for one hour.', button: 'Choose a new password', ignore: 'If this wasn’t you, ignore this email. Your password stays the same.' },
  de: { subject: 'Dein Blank-Passwort zurücksetzen', hi: 'Hallo @{u},', body: 'Jemand möchte das Passwort für dein Blank-Konto zurücksetzen. Tippe auf den Button, um ein neues zu wählen. Der Link gilt eine Stunde.', button: 'Neues Passwort wählen', ignore: 'Wenn du das nicht warst, ignoriere diese E-Mail. Dein Passwort bleibt gleich.' },
  hu: { subject: 'Blank-jelszó visszaállítása', hi: 'Szia @{u}!', body: 'Valaki vissza szeretné állítani a Blank-fiókod jelszavát. Koppints a gombra, és válassz újat. A link egy óráig érvényes.', button: 'Új jelszó választása', ignore: 'Ha nem te voltál, hagyd figyelmen kívül ezt az e-mailt. A jelszavad nem változik.' },
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// One email through Resend (also used by blank-social.js for the admin's report alerts)
export async function sendEmail(env, { to, subject, html, text }) {
  if (!env.RESEND_KEY) return
  // Inside Resend's free 100 a day / 3,000 a month (limits.js); past that, emails wait for the next day or month
  await use(env, 'email_day')
  await use(env, 'email_month')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: 'Blank <blank@gretagrosz.com>', to: Array.isArray(to) ? to : [to], subject, html, text }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`)
}

async function sendResetEmail(env, to, username, link, lang) {
  const t = RESET_TEXT[lang] || RESET_TEXT.en
  const hi = t.hi.replace('{u}', username)
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1c1e">
<p style="font-size:22px;font-weight:700;margin:0 0 16px">Blank</p>
<p style="font-size:16px;line-height:1.5">${esc(hi)}</p>
<p style="font-size:16px;line-height:1.5">${esc(t.body)}</p>
<p style="margin:28px 0"><a href="${esc(link)}" style="background:#b4614a;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:600;font-size:16px;display:inline-block">${esc(t.button)}</a></p>
<p style="font-size:14px;line-height:1.5;color:#6b6b70">${esc(t.ignore)}</p>
</div>`
  await sendEmail(env, { to, subject: t.subject, html, text: `${hi}\n\n${t.body}\n\n${link}\n\n${t.ignore}` })
}

// ---------- passkeys ----------
// Which site the passkey belongs to: gretagrosz.com (also from www.), the workers.dev host, or localhost in dev
// (any port, since Vite serves the app on its own port and proxies the API)
export function relyingParty(request) {
  const host = new URL(request.url).hostname
  if (host === 'localhost' || host === '127.0.0.1') return { rpId: 'localhost', origin: (o) => /^http:\/\/localhost(:\d+)?$/.test(String(o)) }
  const rpId = host === 'gretagrosz.com' || host.endsWith('.gretagrosz.com') ? 'gretagrosz.com' : host
  return { rpId, origin: `https://${host}` }
}
async function newChallenge(db, ip, kind, { username = null, userId = null } = {}) {
  const open = await db.prepare('SELECT COUNT(*) AS n FROM blank_passkey_challenges WHERE ip = ? AND expires > ?').bind(ip, Date.now()).first()
  if ((open?.n || 0) >= OPEN_CHALLENGES_PER_IP) fail(429, 'too_many')
  const id = b64url(random(16))
  const challenge = b64url(random(32))
  await db.batch([
    db.prepare('DELETE FROM blank_passkey_challenges WHERE expires < ?').bind(Date.now()),
    db
      .prepare('INSERT INTO blank_passkey_challenges (id, challenge, kind, username, user_id, ip, expires) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(id, challenge, kind, username, userId, ip, Date.now() + PASSKEY_MINUTES * MIN),
  ])
  return { id, challenge }
}
// Single use: gone as soon as it's taken, whether the passkey then checks out or not
async function takeChallenge(db, id, kind) {
  if (!/^[A-Za-z0-9_-]{16,40}$/.test(String(id ?? ''))) fail(400, 'expired')
  const row = await db
    .prepare('DELETE FROM blank_passkey_challenges WHERE id = ? AND kind = ? AND expires > ? RETURNING challenge, username, user_id')
    .bind(String(id), kind, Date.now())
    .first()
  if (!row) fail(400, 'expired')
  return row
}
// The authenticator's signature counter (bytes 33–36 of the authenticator data)
export const signCount = (authData) => (authData.length >= 37 ? ((authData[33] << 24) >>> 0) + (authData[34] << 16) + (authData[35] << 8) + authData[36] : 0)
const TRANSPORTS = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']
export const transports = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => TRANSPORTS.includes(x)))] : [])
export const readTransports = (s) => {
  try {
    return transports(JSON.parse(s || '[]'))
  } catch {
    return []
  }
}
const creationOptions = (rp, c, user, exclude) => ({
  challengeId: c.id,
  challenge: c.challenge,
  rp: { id: rp.rpId, name: 'Blank' },
  user: { id: b64url(enc.encode(user.id)), name: user.username, displayName: `@${user.username}` },
  pubKeyCredParams: [
    { type: 'public-key', alg: -7 },
    { type: 'public-key', alg: -257 },
  ],
  excludeCredentials: exclude,
  authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' },
  attestation: 'none',
  timeout: PASSKEY_MINUTES * MIN,
})

// The same checks for every new username, with a password or a passkey
async function checkNewUsername(db, ip, u) {
  if (badWords(u)) fail(400, 'rude_username')
  if ((await count(db, 'signup', ip, Date.now() - DAY)) >= SIGNUPS_PER_IP) fail(429, 'too_many')
  if (await db.prepare('SELECT 1 FROM blank_users WHERE username = ?').bind(u).first()) fail(409, 'taken')
}

export async function readJson(request, max) {
  const text = await request.text()
  if (text.length > max) fail(413, 'too_big')
  try {
    const b = JSON.parse(text || '{}')
    return b && typeof b === 'object' ? b : {}
  } catch {
    fail(400, 'bad_json')
  }
}
// The app's data: has to look like Blank's data, and photos inside it as text are left out (they belong on the device)
function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d) || !Array.isArray(d.projects)) fail(400, 'bad_data')
  const out = { ...d, projects: d.projects.map((p) => ({ ...p, entries: (p.entries || []).map((e) => (String(e.photo || '').startsWith('data:') ? { ...e, photo: null } : e)) })) }
  delete out.savedAt
  const text = JSON.stringify(out)
  if (text.length > DATA_MAX) fail(413, 'too_big')
  return text
}

async function newSession(db, userId) {
  const token = b64url(random(32))
  const now = Date.now()
  await db.prepare('INSERT INTO blank_sessions (token_hash, user_id, created, seen) VALUES (?, ?, ?, ?)').bind(await sha256(token), userId, now, now).run()
  return token
}

export async function auth(request, db) {
  const m = (request.headers.get('authorization') || '').match(/^Bearer ([A-Za-z0-9_-]{20,100})$/)
  if (!m) fail(401, 'logged_out')
  const hash = await sha256(m[1])
  const row = await db
    .prepare('SELECT s.user_id, s.seen, u.username, u.created, u.rev, u.data, u.pass_hash, u.pass_salt, u.pass_iter, u.name, u.bio, u.avatar, u.rules_at, u.admin, u.banned, u.email, u.founder, u.has_password FROM blank_sessions s JOIN blank_users u ON u.id = s.user_id WHERE s.token_hash = ?')
    .bind(hash)
    .first()
  if (!row || row.seen < Date.now() - SESSION_DAYS * DAY) fail(401, 'logged_out')
  if (row.seen < Date.now() - DAY) await db.prepare('UPDATE blank_sessions SET seen = ? WHERE token_hash = ?').bind(Date.now(), hash).run()
  return { ...row, tokenHash: hash }
}

async function count(db, kind, who, since) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM blank_auth_events WHERE kind = ? AND who = ? AND created > ?').bind(kind, who, since).first()
  return r?.n || 0
}
const note = (db, kind, who) => db.prepare('INSERT INTO blank_auth_events (kind, who, created) VALUES (?, ?, ?)').bind(kind, who, Date.now()).run()

async function checkPassword(db, user, given, ip) {
  if (await pbkdf2(given, unhex(user.pass_salt), user.pass_iter).then((h) => same(h, user.pass_hash))) return
  await db.batch([
    db.prepare('INSERT INTO blank_auth_events (kind, who, created) VALUES (?, ?, ?)').bind('fail', user.username, Date.now()),
    db.prepare('INSERT INTO blank_auth_events (kind, who, created) VALUES (?, ?, ?)').bind('fail', ip, Date.now()),
  ])
  fail(401, 'wrong_password')
}

// Everything under u/<user id>/, a thousand at a time
async function deleteAllPhotos(bucket, userId) {
  let cursor
  do {
    const list = await bucket.list({ prefix: `u/${userId}/`, cursor, limit: 1000 })
    if (list.objects.length) await bucket.delete(list.objects.map((o) => o.key))
    cursor = list.truncated ? list.cursor : undefined
  } while (cursor)
}

export async function account(request, env, ctx, url, path) {
  try {
    return await route(request, env, ctx, path)
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message, ...e.extra }, e.status)
    if (e?.name === 'LimitError') return json({ error: 'limit', limit: e.key }, 503) // a free-tier ceiling (limits.js)
    console.error(e)
    return json({ error: 'server' }, 500)
  }
}

async function route(request, env, ctx, path) {
  const db = env.DB
  const method = request.method
  const ip = `ip:${await sha256(`${request.headers.get('cf-connecting-ip') || 'local'}|blank-account`)}`
  // Old guessing records go away on their own
  if (Math.random() < 0.02) ctx.waitUntil(db.prepare('DELETE FROM blank_auth_events WHERE created < ?').bind(Date.now() - DAY).run().catch(() => {}))

  if (path === '/account/signup' && method === 'POST') {
    const b = await readJson(request, DATA_MAX + 2000)
    const u = username(b.username)
    const p = password(b.password)
    const data = b.data ? cleanData(b.data) : null
    const mail = email(b.email)
    // A banned account's email can't start a new one, even after that account was deleted (blank-social.js keeps its hash)
    if (mail && (await db.prepare('SELECT 1 FROM blank_banned_emails WHERE hash = ?').bind(await sha256(`banned|${mail}`)).first())) fail(403, 'banned')
    await checkNewUsername(db, ip, u)
    const salt = random(16)
    const id = hex(random(12))
    const now = Date.now()
    try {
      await db
        // The first FOUNDERS accounts get the founding tester badge (blank-social.js)
        .prepare(`INSERT INTO blank_users (id, username, pass_hash, pass_salt, pass_iter, data, rev, updated, created, email, founder)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COUNT(*) < ${FOUNDERS} FROM blank_users))`)
        .bind(id, u, await pbkdf2(p, salt, ITER), hex(salt), ITER, data, data ? 1 : 0, now, now, mail)
        .run()
    } catch (e) {
      if (/UNIQUE/i.test(String(e?.message))) fail(409, 'taken') // two people picked the same name at the same moment
      throw e
    }
    await note(db, 'signup', ip)
    return json({ token: await newSession(db, id), username: u, rev: data ? 1 : 0 })
  }

  if (path === '/account/login' && method === 'POST') {
    const b = await readJson(request, 2000)
    const u = String(b.username ?? '').trim().toLowerCase().replace(/^@/, '')
    const p = String(b.password ?? '')
    const since = Date.now() - 15 * MIN
    if ((await count(db, 'fail', ip, since)) >= FAILS_PER_IP) fail(429, 'too_many')
    if (USERNAME.test(u) && (await count(db, 'fail', u, since)) >= FAILS_PER_USER) fail(429, 'too_many')
    const user = USERNAME.test(u) && (await db.prepare('SELECT * FROM blank_users WHERE username = ?').bind(u).first())
    if (!user) {
      await pbkdf2(p, random(16), ITER) // takes as long as a real check, so it doesn't tell which usernames exist
      await note(db, 'fail', ip)
      fail(401, 'wrong_password')
    }
    await checkPassword(db, user, p, ip)
    return json({ token: await newSession(db, user.id), username: user.username, rev: user.rev, data: user.data ? JSON.parse(user.data) : null })
  }

  if (path === '/account/passkey/register/options' && method === 'POST') {
    const b = await readJson(request, 2000)
    const rp = relyingParty(request)
    if (request.headers.get('authorization')) {
      // Adding a passkey to the account this device is logged into
      const me = await auth(request, db)
      const keys = (await db.prepare('SELECT id, transports FROM blank_passkeys WHERE user_id = ?').bind(me.user_id).all()).results || []
      if (keys.length >= PASSKEYS_PER_USER) fail(400, 'too_many_passkeys')
      const c = await newChallenge(db, ip, 'add', { userId: me.user_id })
      const exclude = keys.map((k) => ({ type: 'public-key', id: k.id, transports: readTransports(k.transports) }))
      return json(creationOptions(rp, c, { id: me.user_id, username: me.username }, exclude))
    }
    // A new account: the username is checked now and again when it's created; the account id is picked now (it's the passkey's user handle)
    const u = username(b.username)
    await checkNewUsername(db, ip, u)
    const id = hex(random(12))
    const c = await newChallenge(db, ip, 'new', { username: u, userId: id })
    return json(creationOptions(rp, c, { id, username: u }, []))
  }

  if (path === '/account/passkey/register/verify' && method === 'POST') {
    const b = await readJson(request, DATA_MAX + 20000)
    const rp = relyingParty(request)
    if ((await count(db, 'fail', ip, Date.now() - 15 * MIN)) >= FAILS_PER_IP) fail(429, 'too_many')
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
        .prepare('INSERT INTO blank_passkeys (id, user_id, public_key, alg, counter, transports, created) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(key.id, userId, key.publicKey, key.alg, signCount(unb64url(b.authenticatorData)), JSON.stringify(transports(b.transports)), now)
    const owner = (await db.prepare('SELECT user_id FROM blank_passkeys WHERE id = ?').bind(key.id).first())?.user_id
    if (owner && owner !== me?.user_id) fail(409, 'passkey_taken')

    if (me) {
      const n = (await db.prepare('SELECT COUNT(*) AS n FROM blank_passkeys WHERE user_id = ?').bind(me.user_id).first())?.n || 0
      if (owner) return json({ ok: true, passkeys: n }) // this phone already had it
      if (n >= PASSKEYS_PER_USER) fail(400, 'too_many_passkeys')
      await insertKey(me.user_id).run()
      return json({ ok: true, passkeys: n + 1 })
    }

    // A new account, like /account/signup but with a random password hash nobody can log in with
    const data = b.data ? cleanData(b.data) : null
    if ((await count(db, 'signup', ip, now - DAY)) >= SIGNUPS_PER_IP) fail(429, 'too_many')
    const u = ch.username
    const id = ch.user_id
    try {
      await db.batch([
        db
          .prepare(`INSERT INTO blank_users (id, username, pass_hash, pass_salt, pass_iter, data, rev, updated, created, email, founder, has_password)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, (SELECT COUNT(*) < ${FOUNDERS} FROM blank_users), 0)`)
          .bind(id, u, hex(random(32)), hex(random(16)), ITER, data, data ? 1 : 0, now, now),
        insertKey(id),
      ])
    } catch (e) {
      if (/UNIQUE/i.test(String(e?.message))) fail(409, 'taken') // someone took the name while the passkey sheet was open
      throw e
    }
    await note(db, 'signup', ip)
    return json({ token: await newSession(db, id), username: u, rev: data ? 1 : 0 })
  }

  if (path === '/account/passkey/login/options' && method === 'POST') {
    const c = await newChallenge(db, ip, 'login')
    // No allowCredentials: the phone offers whichever Blank passkeys it has, so nobody types a username
    return json({ challengeId: c.id, challenge: c.challenge, rpId: relyingParty(request).rpId, allowCredentials: [], userVerification: 'preferred', timeout: PASSKEY_MINUTES * MIN })
  }

  if (path === '/account/passkey/login/verify' && method === 'POST') {
    const b = await readJson(request, 20000)
    if ((await count(db, 'fail', ip, Date.now() - 15 * MIN)) >= FAILS_PER_IP) fail(429, 'too_many')
    const ch = await takeChallenge(db, b.challengeId, 'login')
    const stored = await db.prepare('SELECT * FROM blank_passkeys WHERE id = ?').bind(String(b.id ?? '')).first()
    const user = stored && (await db.prepare('SELECT * FROM blank_users WHERE id = ?').bind(stored.user_id).first())
    if (!user) {
      await note(db, 'fail', ip)
      fail(401, 'passkey_unknown')
    }
    let n
    try {
      // The user handle (when the phone sends one) has to be this account's id
      if (b.userHandle && new TextDecoder().decode(unb64url(b.userHandle)) !== user.id) throw new Error('Wrong account')
      await verifyAssertion(relyingParty(request), stored, ch.challenge, b)
      n = signCount(unb64url(b.authenticatorData))
      // A counter that didn't go up means a copied authenticator (passkeys that sync always send 0)
      if ((n || stored.counter) && n <= stored.counter) throw new Error('Counter went back')
    } catch {
      await note(db, 'fail', ip)
      fail(401, 'passkey_failed')
    }
    await db.prepare('UPDATE blank_passkeys SET counter = ?, used = ? WHERE id = ?').bind(n, Date.now(), stored.id).run()
    return json({ token: await newSession(db, user.id), username: user.username, rev: user.rev, data: user.data ? JSON.parse(user.data) : null, password: !!user.has_password })
  }

  if (path === '/account/forgot' && method === 'POST') {
    const b = await readJson(request, 2000)
    const login = String(b.login ?? '').trim().toLowerCase().replace(/^@/, '')
    if (!login) fail(400, 'bad_username')
    if (!env.RESEND_KEY) fail(503, 'no_email_service')
    if ((await count(db, 'reset', ip, Date.now() - 60 * MIN)) >= 10) fail(429, 'too_many')
    await note(db, 'reset', ip)
    const user = await db.prepare('SELECT id, username, email FROM blank_users WHERE username = ? OR email = ?').bind(login, login).first()
    // Same answer whether or not the account exists or has an email, so nobody can find out who uses Blank
    if (user?.email && (await count(db, 'reset', user.id, Date.now() - 60 * MIN)) < RESETS_PER_HOUR) {
      await note(db, 'reset', user.id)
      const token = b64url(random(32))
      await db.prepare('INSERT INTO blank_resets (token_hash, user_id, created) VALUES (?, ?, ?)').bind(await sha256(token), user.id, Date.now()).run()
      const origin = new URL(request.url).origin
      const lang = ['en', 'de', 'hu'].includes(b.lang) ? b.lang : 'en'
      ctx.waitUntil(sendResetEmail(env, user.email, user.username, `${origin}/blank/#/reset/${token}`, lang).catch((e) => console.error('blank reset email', e)))
    }
    return json({ ok: true })
  }

  if (path === '/account/reset' && method === 'POST') {
    const b = await readJson(request, 2000)
    const token = String(b.token ?? '')
    if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) fail(400, 'bad_link')
    const p = password(b.password)
    const hash = await sha256(token)
    const row = await db
      .prepare('UPDATE blank_resets SET used = 1 WHERE token_hash = ? AND used = 0 AND created > ? RETURNING user_id')
      .bind(hash, Date.now() - RESET_MINUTES * MIN)
      .first()
    if (!row) fail(410, 'bad_link')
    const user = await db.prepare('SELECT username FROM blank_users WHERE id = ?').bind(row.user_id).first()
    if (!user) fail(410, 'bad_link')
    const salt = random(16)
    await db.batch([
      db.prepare('UPDATE blank_users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, has_password = 1 WHERE id = ?').bind(await pbkdf2(p, salt, ITER), hex(salt), ITER, row.user_id),
      db.prepare('DELETE FROM blank_sessions WHERE user_id = ?').bind(row.user_id),
      db.prepare('DELETE FROM blank_resets WHERE user_id = ?').bind(row.user_id),
      db.prepare("DELETE FROM blank_auth_events WHERE kind = 'fail' AND who = ?").bind(user.username),
    ])
    return json({ username: user.username })
  }

  // Everything below needs a logged-in device
  const me = await auth(request, db)

  if (path === '/account/email' && method === 'PUT') {
    const b = await readJson(request, 2000)
    const mail = email(b.email)
    await db.prepare('UPDATE blank_users SET email = ? WHERE id = ?').bind(mail, me.user_id).run()
    return json({ email: mail })
  }

  if (path === '/account' && method === 'GET') {
    return json({ username: me.username, created: me.created, rev: me.rev, email: me.email || null, password: !!me.has_password, data: me.data ? JSON.parse(me.data) : null })
  }

  if (path === '/account/data' && method === 'PUT') {
    const b = await readJson(request, DATA_MAX + 2000)
    const data = cleanData(b.data)
    const base = Number(b.rev)
    // Only saves if nobody saved since this device last saw the data
    const row = await db
      .prepare('UPDATE blank_users SET data = ?, rev = rev + 1, updated = ? WHERE id = ? AND rev = ? RETURNING rev')
      .bind(data, Date.now(), me.user_id, base)
      .first()
    if (!row) {
      const cur = await db.prepare('SELECT rev, data FROM blank_users WHERE id = ?').bind(me.user_id).first()
      fail(409, 'conflict', { rev: cur.rev, data: cur.data ? JSON.parse(cur.data) : null })
    }
    return json({ rev: row.rev })
  }

  // Changes the password, or sets the first one on an account made with a passkey (then without the current one)
  if (path === '/account/password' && method === 'POST') {
    const b = await readJson(request, 2000)
    if (me.has_password) {
      if ((await count(db, 'fail', me.username, Date.now() - 15 * MIN)) >= FAILS_PER_USER) fail(429, 'too_many')
      await checkPassword(db, me, String(b.password ?? ''), ip)
    }
    const p = password(b.newPassword)
    const salt = random(16)
    await db.batch([
      db.prepare('UPDATE blank_users SET pass_hash = ?, pass_salt = ?, pass_iter = ?, has_password = 1 WHERE id = ?').bind(await pbkdf2(p, salt, ITER), hex(salt), ITER, me.user_id),
      // A changed password logs out every other device; adding a first one doesn't
      db.prepare('DELETE FROM blank_sessions WHERE user_id = ? AND token_hash != ? AND ?').bind(me.user_id, me.tokenHash, me.has_password ? 1 : 0),
    ])
    return json({ ok: true })
  }

  if (path === '/account/logout' && method === 'POST') {
    await db.prepare('DELETE FROM blank_sessions WHERE token_hash = ?').bind(me.tokenHash).run()
    return json({ ok: true })
  }

  if (path === '/account' && method === 'DELETE') {
    const b = await readJson(request, 2000)
    // An account made with a passkey has no password to ask for: being logged in on this device is enough
    if (me.has_password) {
      if ((await count(db, 'fail', me.username, Date.now() - 15 * MIN)) >= FAILS_PER_USER) fail(429, 'too_many')
      await checkPassword(db, me, String(b.password ?? ''), ip)
    }
    const uid = me.user_id
    // The chats they were in: their messages go, their one-to-one chats go whole, a group they were the last one in goes too
    const chatIds = ((await db.prepare('SELECT chat_id FROM blank_chat_members WHERE user_id = ?').bind(uid).all()).results || []).map((r) => r.chat_id)
    // D1 takes at most 100 values per statement, so the chats go in groups of 90
    const groups = []
    for (let i = 0; i < chatIds.length; i += 90) groups.push(chatIds.slice(i, i + 90))
    const perGroup = (sql) => groups.map((ids) => db.prepare(sql.replace('$IDS', `(${ids.map(() => '?').join(',')})`)).bind(...ids))
    // Chat photos that go with them: theirs, and everything in their one-to-one chats and groups only they were left in
    const chatPhotos = (
      await db
        .prepare(
          `SELECT x.id FROM blank_messages x WHERE x.photo = 1 AND (x.user_id = ?1 OR x.chat_id IN (SELECT m.chat_id FROM blank_chat_members m JOIN blank_chats c ON c.id = m.chat_id
             WHERE m.user_id = ?1 AND (c.kind = 'dm' OR (SELECT COUNT(*) FROM blank_chat_members o WHERE o.chat_id = c.id) = 1)))`,
        )
        .bind(uid)
        .all()
    ).results || []
    await db.batch([
      db.prepare('DELETE FROM blank_sessions WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM blank_message_reactions WHERE user_id = ? OR message_id IN (SELECT id FROM blank_messages WHERE user_id = ?)').bind(uid, uid),
      // Their comments, comments under their posts, and reports on either
      db.prepare('DELETE FROM blank_comment_reports WHERE reporter = ? OR comment_id IN (SELECT c.id FROM blank_comments c WHERE c.user_id = ? OR c.post_id IN (SELECT id FROM blank_posts WHERE user_id = ?))').bind(uid, uid, uid),
      db.prepare('DELETE FROM blank_comments WHERE user_id = ? OR post_id IN (SELECT id FROM blank_posts WHERE user_id = ?)').bind(uid, uid),
      db.prepare('DELETE FROM blank_users WHERE id = ?').bind(uid),
      // Their posts, likes, friendships and blocks go too (photos are cleaned up below)
      db.prepare('DELETE FROM blank_likes WHERE user_id = ? OR post_id IN (SELECT id FROM blank_posts WHERE user_id = ?)').bind(uid, uid),
      db.prepare('DELETE FROM blank_reports WHERE reporter = ? OR post_id IN (SELECT id FROM blank_posts WHERE user_id = ?)').bind(uid, uid),
      db.prepare('DELETE FROM blank_friends WHERE requester = ? OR addressee = ?').bind(uid, uid),
      db.prepare('DELETE FROM blank_blocks WHERE blocker = ? OR blocked = ?').bind(uid, uid),
      db.prepare('DELETE FROM blank_resets WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM blank_passkeys WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM blank_passkey_challenges WHERE user_id = ?').bind(uid),
      // Reports they made, and reports about their profile
      db.prepare('DELETE FROM blank_user_reports WHERE user_id = ? OR reporter = ?').bind(uid, uid),
      db.prepare('DELETE FROM blank_message_reports WHERE reporter = ? OR message_id IN (SELECT id FROM blank_messages WHERE user_id = ?)').bind(uid, uid),
      db.prepare('DELETE FROM blank_messages WHERE user_id = ?').bind(uid),
      db.prepare('DELETE FROM blank_chat_members WHERE user_id = ?').bind(uid),
      ...perGroup("DELETE FROM blank_chat_members WHERE chat_id IN (SELECT id FROM blank_chats WHERE kind = 'dm' AND id IN $IDS)"),
      ...perGroup(`DELETE FROM blank_message_reports WHERE message_id IN (SELECT id FROM blank_messages WHERE chat_id IN $IDS
                   AND NOT EXISTS (SELECT 1 FROM blank_chat_members m WHERE m.chat_id = blank_messages.chat_id))`),
      ...perGroup('DELETE FROM blank_messages WHERE chat_id IN $IDS AND NOT EXISTS (SELECT 1 FROM blank_chat_members m WHERE m.chat_id = blank_messages.chat_id)'),
      ...perGroup('DELETE FROM blank_chats WHERE id IN $IDS AND NOT EXISTS (SELECT 1 FROM blank_chat_members m WHERE m.chat_id = blank_chats.id)'),
    ])
    const postPhotos = await db.prepare('SELECT id FROM blank_posts WHERE user_id = ? AND photo = 1').bind(uid).all()
    await db.prepare('DELETE FROM blank_posts WHERE user_id = ?').bind(uid).run()
    if (env.PHOTOS) {
      const keys = [`a/${uid}`, ...(postPhotos.results || []).map((r) => `p/${r.id}`), ...chatPhotos.map((r) => `m/${r.id}`)]
      ctx.waitUntil(env.PHOTOS.delete(keys).catch((e) => console.error(e)))
    }
    if (env.PHOTOS) ctx.waitUntil(deleteAllPhotos(env.PHOTOS, me.user_id).catch((e) => console.error(e)))
    return json({ ok: true })
  }

  let m
  if ((m = path.match(/^\/account\/photos\/([^/]+)$/))) {
    if (!env.PHOTOS) fail(503, 'no_storage')
    if (!PHOTO_ID.test(m[1])) fail(400, 'bad_photo')
    const key = `u/${me.user_id}/${m[1]}`

    if (method === 'PUT') {
      const type = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      if (!PHOTO_TYPES.includes(type)) fail(415, 'bad_photo')
      if (Number(request.headers.get('content-length') || 0) > PHOTO_MAX) fail(413, 'too_big')
      const body = await request.arrayBuffer()
      if (!body.byteLength) fail(400, 'bad_photo')
      if (body.byteLength > PHOTO_MAX) fail(413, 'too_big')
      if ((await count(db, 'photo', me.user_id, Date.now() - DAY)) >= PHOTOS_PER_DAY) fail(429, 'too_many')
      await env.PHOTOS.put(key, body, { httpMetadata: { contentType: type } })
      await note(db, 'photo', me.user_id)
      return json({ ok: true })
    }
    if (method === 'GET') {
      const obj = await env.PHOTOS.get(key)
      if (!obj) fail(404, 'not_found')
      return new Response(obj.body, {
        headers: { 'content-type': obj.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
      })
    }
    if (method === 'DELETE') {
      await env.PHOTOS.delete(key)
      return json({ ok: true })
    }
  }

  fail(404, 'not_found')
}
