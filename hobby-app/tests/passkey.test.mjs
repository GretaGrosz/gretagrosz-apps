// Passkey accounts (worker/blank-account.js) with a pretend authenticator: a real P-256 key made with WebCrypto,
// signing exactly what a phone signs, so the Worker's checks run for real
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { server } from './api.mjs'

const ORIGIN = 'https://gretagrosz.com'
const enc = new TextEncoder()
const b64url = (bytes) => Buffer.from(bytes).toString('base64url')
const sha256 = async (bytes) => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]

// WebCrypto signs ECDSA as r || s; WebAuthn sends DER
function rawToDer(raw) {
  const int = (b) => {
    let i = 0
    while (i < b.length - 1 && b[i] === 0) i++
    b = b.slice(i)
    if (b[0] & 0x80) b = new Uint8Array([0, ...b])
    return [2, b.length, ...b]
  }
  const body = [...int(raw.slice(0, 32)), ...int(raw.slice(32))]
  return new Uint8Array([0x30, body.length, ...body])
}

async function authenticator({ rpId = 'gretagrosz.com', origin = ORIGIN, counter = 0 } = {}) {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const credId = crypto.getRandomValues(new Uint8Array(20))
  const rpHash = await sha256(enc.encode(rpId))
  let userHandle = null
  return {
    id: b64url(credId),
    async create(options) {
      userHandle = options.user.id
      const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.create', challenge: options.challenge, origin }))
      const authData = new Uint8Array([...rpHash, 0x45, ...u32(counter), ...new Uint8Array(16), 0, credId.length, ...credId])
      return {
        challengeId: options.challengeId,
        id: b64url(credId),
        clientDataJSON: b64url(clientDataJSON),
        authenticatorData: b64url(authData),
        publicKey: b64url(new Uint8Array(await crypto.subtle.exportKey('spki', keys.publicKey))),
        alg: -7,
        transports: ['internal', 'hybrid', 'made-up'],
      }
    },
    async get(options, { bump = 0 } = {}) {
      counter += bump
      const clientDataJSON = enc.encode(JSON.stringify({ type: 'webauthn.get', challenge: options.challenge, origin }))
      const authData = new Uint8Array([...rpHash, 0x05, ...u32(counter)])
      const signed = new Uint8Array([...authData, ...(await sha256(clientDataJSON))])
      const raw = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, signed))
      return {
        challengeId: options.challengeId,
        id: b64url(credId),
        clientDataJSON: b64url(clientDataJSON),
        authenticatorData: b64url(authData),
        signature: b64url(rawToDer(raw)),
        userHandle,
      }
    },
  }
}

test('passkey: make an account without a password, then sign in with no username', async () => {
  const { call, rows } = server()
  const phone = await authenticator()
  const opts = await call('POST', '/account/passkey/register/options', { body: { username: '@Mila_' } })
  assert.equal(opts.status, 400) // same username rules as signup
  const o = await call('POST', '/account/passkey/register/options', { body: { username: 'Mila' } })
  assert.equal(o.status, 200)
  assert.equal(o.data.rp.id, 'gretagrosz.com')
  assert.equal(o.data.authenticatorSelection.residentKey, 'required')
  assert.equal(o.data.attestation, 'none')
  const made = await call('POST', '/account/passkey/register/verify', { body: { ...(await phone.create(o.data)), data: { projects: [{ id: 'p1' }] } } })
  assert.equal(made.status, 200, JSON.stringify(made.data))
  assert.equal(made.data.username, 'mila')
  assert.equal(made.data.rev, 1)
  assert.ok(made.data.token)
  assert.deepEqual(JSON.parse(rows('SELECT transports FROM blank_passkeys')[0].transports), ['internal', 'hybrid'])
  // The challenge was single use
  assert.equal((await call('POST', '/account/passkey/register/verify', { body: await phone.create(o.data) })).status, 400)
  // No password to log in with, and the username is taken now
  assert.equal((await call('POST', '/account/login', { body: { username: 'mila', password: '' } })).status, 401)
  assert.equal((await call('POST', '/account/passkey/register/options', { body: { username: 'mila' } })).status, 409)
  assert.equal((await call('POST', '/account/signup', { body: { username: 'mila', password: 'long enough pw' } })).status, 409)

  const l = await call('POST', '/account/passkey/login/options')
  assert.equal(l.status, 200)
  assert.deepEqual(l.data.allowCredentials, [])
  const inn = await call('POST', '/account/passkey/login/verify', { body: await phone.get(l.data) })
  assert.equal(inn.status, 200, JSON.stringify(inn.data))
  assert.equal(inn.data.username, 'mila')
  assert.equal(inn.data.password, false)
  assert.equal(inn.data.data.projects[0].id, 'p1')
  // Reusing the same challenge fails
  assert.equal((await call('POST', '/account/passkey/login/verify', { body: await phone.get(l.data) })).status, 400)

  const me = await call('GET', '/account', { token: inn.data.token })
  assert.equal(me.data.password, false)
  // Setting a first password needs no current one, and then password login works
  assert.equal((await call('POST', '/account/password', { token: inn.data.token, body: { newPassword: 'long enough pw' } })).status, 200)
  assert.equal((await call('POST', '/account/login', { body: { username: 'mila', password: 'long enough pw' } })).status, 200)
  assert.equal((await call('GET', '/account', { token: made.data.token })).status, 200) // adding one didn't log out the other device
})

test('passkey: a wrong origin, a wrong site, a bad signature or another account’s passkey is refused', async () => {
  const { call } = server()
  const evil = await authenticator({ origin: 'https://evil.example' })
  const o = await call('POST', '/account/passkey/register/options', { body: { username: 'nora' } })
  assert.equal((await call('POST', '/account/passkey/register/verify', { body: await evil.create(o.data) })).status, 400)
  const otherSite = await authenticator({ rpId: 'evil.example' })
  const o2 = await call('POST', '/account/passkey/register/options', { body: { username: 'nora' } })
  assert.equal((await call('POST', '/account/passkey/register/verify', { body: await otherSite.create(o2.data) })).status, 400)

  const phone = await authenticator({ counter: 5 })
  const o3 = await call('POST', '/account/passkey/register/options', { body: { username: 'nora' } })
  assert.equal((await call('POST', '/account/passkey/register/verify', { body: await phone.create(o3.data) })).status, 200)
  const l = (await call('POST', '/account/passkey/login/options')).data
  const signed = await phone.get(l, { bump: 1 })
  const bad = { ...signed, signature: b64url(rawToDer(new Uint8Array(64).fill(7))) }
  assert.equal((await call('POST', '/account/passkey/login/verify', { body: bad })).status, 401)
  const l3 = (await call('POST', '/account/passkey/login/options')).data
  assert.equal((await call('POST', '/account/passkey/login/verify', { body: await phone.get(l3) })).status, 200)
  // A counter that doesn't go up (a copied key)
  const l2 = (await call('POST', '/account/passkey/login/options')).data
  assert.equal((await call('POST', '/account/passkey/login/verify', { body: await phone.get(l2) })).status, 401)
  // A passkey nobody registered
  const stranger = await authenticator()
  const l4 = (await call('POST', '/account/passkey/login/options')).data
  const r = await call('POST', '/account/passkey/login/verify', { body: await stranger.get(l4) })
  assert.equal(r.status, 401)
  assert.equal(r.data.error, 'passkey_unknown')
})

test('passkey: add one to a password account, then delete a passkey-only account without a password', async () => {
  const { call, user, rows } = server()
  const a = await user('greta')
  const phone = await authenticator()
  const o = await call('POST', '/account/passkey/register/options', { token: a.token })
  assert.equal(o.status, 200)
  assert.equal(o.data.user.name, 'greta')
  const added = await call('POST', '/account/passkey/register/verify', { token: a.token, body: await phone.create(o.data) })
  assert.deepEqual(added.data, { ok: true, passkeys: 1 })
  const o2 = await call('POST', '/account/passkey/register/options', { token: a.token })
  assert.equal(o2.data.excludeCredentials[0].id, phone.id)
  const l = (await call('POST', '/account/passkey/login/options')).data
  const inn = await call('POST', '/account/passkey/login/verify', { body: await phone.get(l) })
  assert.equal(inn.data.username, 'greta')
  assert.equal(inn.data.password, true)
  // A password account still needs its password to be deleted
  assert.equal((await call('DELETE', '/account', { token: a.token, body: {} })).status, 401)

  const solo = await authenticator()
  const o3 = await call('POST', '/account/passkey/register/options', { body: { username: 'solo' } })
  const s = await call('POST', '/account/passkey/register/verify', { body: await solo.create(o3.data) })
  assert.equal((await call('DELETE', '/account', { token: s.data.token, body: {} })).status, 200)
  assert.equal(rows("SELECT 1 FROM blank_users WHERE username = 'solo'").length, 0)
  assert.equal(rows('SELECT 1 FROM blank_passkeys').length, 1) // only greta's is left
})

test('passkey: dev on localhost accepts any localhost port as the origin', async () => {
  const { env, ctx } = server()
  const { blank } = await import('../../worker/blank.js')
  const go = async (path, body) => {
    const url = new URL(`http://localhost:5249/blank/api${path}`)
    const res = await blank(new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) }), env, ctx, url)
    return { status: res.status, data: await res.json() }
  }
  const phone = await authenticator({ rpId: 'localhost', origin: 'http://localhost:5173' })
  const o = await go('/account/passkey/register/options', { username: 'devgirl' })
  assert.equal(o.data.rp.id, 'localhost')
  assert.equal((await go('/account/passkey/register/verify', await phone.create(o.data))).status, 200)
})
