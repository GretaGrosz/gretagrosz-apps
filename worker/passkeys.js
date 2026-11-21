// Passkeys (WebAuthn) so an account survives a lost phone. Used by Yap (index.js → yap.js) and Stance (stance.js);
// both keep the same `passkeys` and `challenges` tables in their own database.
// The browser hands over the public key itself (getPublicKey(), SPKI), so there is no CBOR to parse;
// sign-ins are checked with WebCrypto.
//
// Every ceremony runs on a challenge this server issued and deletes on use:
// - sign-in challenges have a plain random id,
// - registration challenges have the id `r.<userId>.<random>`, so a challenge issued to one account
//   can never be used to register a passkey on another.

const enc = new TextEncoder()
export const unb64url = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(s).length + 3) % 4)), c => c.charCodeAt(0))
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const rid = () => b64url(crypto.getRandomValues(new Uint8Array(12)))
const TTL = 5 * 60_000
const ALGS = {
  [-7]: { import: { name: 'ECDSA', namedCurve: 'P-256' }, verify: { name: 'ECDSA', hash: 'SHA-256' } },
  [-257]: { import: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, verify: { name: 'RSASSA-PKCS1-v1_5' } },
}

const sha256 = async bytes => new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i])
/** An error with an HTTP status the calling worker turns into its own error response */
const problem = (status, message, code) => Object.assign(new Error(message), { status, code })

/** Checks clientDataJSON and the authenticator data; returns the parsed client data */
async function checkCommon(rpId, origin, type, clientDataJSON, authData) {
  let client
  try { client = JSON.parse(new TextDecoder().decode(clientDataJSON)) } catch { throw new Error('Bad client data') }
  if (client.type !== type) throw new Error('Wrong ceremony')
  // origin: the one allowed origin, or a check (Blank allows any localhost port in dev)
  if (typeof origin === 'function' ? !origin(client.origin) : client.origin !== origin) throw new Error('Wrong origin')
  if (authData.length < 37 || !same(authData.slice(0, 32), await sha256(enc.encode(rpId)))) throw new Error('Wrong site')
  if (!(authData[32] & 1)) throw new Error('No user presence')
  return client
}

/**
 * Registration: `challenge` is the one this server issued for it (base64url). Returns { id, publicKey, alg } to store.
 * The credential id must be the one inside the signed-over authenticator data, not just what the client claims.
 */
export async function verifyRegistration({ rpId, origin }, b, challenge) {
  if (!challenge) throw new Error('Expired, try again')
  const alg = Number(b.alg)
  if (!ALGS[alg]) throw new Error('Unsupported passkey type')
  if (!/^[\w-]{16,1400}$/.test(String(b.id || ''))) throw new Error('Bad passkey id')
  const authData = unb64url(b.authenticatorData)
  const client = await checkCommon(rpId, origin, 'webauthn.create', unb64url(b.clientDataJSON), authData)
  if (client.challenge !== challenge) throw new Error('Expired, try again')
  // Attested credential data: rpIdHash (32) flags (1) signCount (4) aaguid (16) idLength (2) id
  if (!(authData[32] & 0x40) || authData.length < 55) throw new Error('Bad passkey id')
  const len = (authData[53] << 8) | authData[54]
  const credId = authData.slice(55, 55 + len)
  if (len < 16 || credId.length !== len || b64url(credId) !== b.id) throw new Error('Bad passkey id')
  await crypto.subtle.importKey('spki', unb64url(b.publicKey), ALGS[alg].import, false, ['verify'])
  return { id: b.id, publicKey: b.publicKey, alg }
}

/** Sign-in: `stored` is the passkeys row, `challenge` the one we issued (base64url) */
export async function verifyAssertion({ rpId, origin }, stored, challenge, b) {
  const clientDataJSON = unb64url(b.clientDataJSON), authData = unb64url(b.authenticatorData)
  const client = await checkCommon(rpId, origin, 'webauthn.get', clientDataJSON, authData)
  if (client.challenge !== challenge) throw new Error('Expired, try again')
  const a = ALGS[stored.alg]
  const key = await crypto.subtle.importKey('spki', unb64url(stored.public_key), a.import, false, ['verify'])
  let sig = unb64url(b.signature)
  if (stored.alg === -7) sig = derToRaw(sig)
  const data = new Uint8Array([...authData, ...(await sha256(clientDataJSON))])
  if (!(await crypto.subtle.verify(a.verify, key, sig, data))) throw new Error('Passkey did not match')
}

// ---------- the ceremonies, shared by both apps ----------

/** A fresh sign-in challenge (fetched before the tap, so the passkey sheet can open straight from it) */
export async function loginChallenge(db, rp) {
  const id = rid(), challenge = b64url(crypto.getRandomValues(new Uint8Array(32)))
  await db.batch([
    db.prepare('DELETE FROM challenges WHERE expires < ?').bind(Date.now()),
    db.prepare('INSERT INTO challenges (id, challenge, expires) VALUES (?, ?, ?)').bind(id, challenge, Date.now() + TTL),
  ])
  return { id, challenge, rpId: rp.rpId }
}

/** Checks a signed sign-in; returns the stored passkey row (its user_id is who signed in) */
export async function verifyLogin(db, rp, b) {
  const challengeId = String(b.challengeId || '')
  if (!/^[\w-]{8,40}$/.test(challengeId)) throw problem(400, 'That took too long, try again', 'expired')
  const ch = await db.prepare('DELETE FROM challenges WHERE id = ? AND expires > ? RETURNING challenge').bind(challengeId, Date.now()).first()
  if (!ch) throw problem(400, 'That took too long, try again', 'expired')
  const stored = await db.prepare('SELECT * FROM passkeys WHERE id = ?').bind(String(b.id || '')).first()
  if (!stored) throw problem(401, 'That passkey is not linked to an account anymore', 'passkeyUnknown')
  try { await verifyAssertion(rp, stored, ch.challenge, b) } catch (e) { throw problem(401, e.message, 'passkeyFailed') }
  return stored
}

/**
 * Options for saving a passkey on `user` ({ id, handle, name }): a challenge bound to this account,
 * the account's opaque id as the WebAuthn user handle, and the passkeys it already has (so a device isn't added twice).
 */
export async function registrationOptions(db, rp, user) {
  const id = `r.${user.id}.${rid()}`, challenge = b64url(crypto.getRandomValues(new Uint8Array(32)))
  const [, , existing] = await db.batch([
    db.prepare('DELETE FROM challenges WHERE expires < ?').bind(Date.now()),
    db.prepare('INSERT INTO challenges (id, challenge, expires) VALUES (?, ?, ?)').bind(id, challenge, Date.now() + TTL),
    db.prepare('SELECT id FROM passkeys WHERE user_id = ?').bind(user.id),
  ])
  return {
    challengeId: id, challenge, rpId: rp.rpId,
    user: { id: b64url(enc.encode(user.id)), name: '@' + user.handle, displayName: user.name },
    exclude: existing.results.map(r => r.id),
  }
}

/** Stores a passkey for `userId` after checking it against the challenge issued to that account. Returns the account's passkey count. */
export async function registerPasskey(db, rp, userId, b) {
  const count = await db.prepare('SELECT COUNT(*) n FROM passkeys WHERE user_id = ?').bind(userId).first('n')
  if (count >= 10) throw problem(400, 'You already have plenty of passkeys', 'passkeyMany')
  const challengeId = String(b.challengeId || '')
  if (!challengeId.startsWith(`r.${userId}.`)) throw problem(400, 'That took too long, try again', 'expired')
  const ch = await db.prepare('DELETE FROM challenges WHERE id = ? AND expires > ? RETURNING challenge').bind(challengeId, Date.now()).first()
  if (!ch) throw problem(400, 'That took too long, try again', 'expired')
  let key
  try { key = await verifyRegistration(rp, b, ch.challenge) } catch (e) { throw problem(400, e.message, 'passkeyFailed') }
  const owner = await db.prepare('SELECT user_id FROM passkeys WHERE id = ?').bind(key.id).first('user_id')
  if (owner && owner !== userId) throw problem(409, 'That passkey belongs to another account', 'passkeyTaken')
  if (!owner) {
    await db.prepare('INSERT INTO passkeys (id, user_id, public_key, alg, created) VALUES (?, ?, ?, ?, ?)').bind(key.id, userId, key.publicKey, key.alg, Date.now()).run()
  }
  return owner ? count : count + 1
}

// ECDSA signatures from WebAuthn are DER (SEQUENCE of two INTEGERs); WebCrypto wants r || s
function derToRaw(der) {
  let o = 2
  if (der[1] & 0x80) o += der[1] & 0x7f
  const int = () => {
    if (der[o++] !== 2) throw new Error('Bad signature')
    const len = der[o++]
    let v = der.slice(o, o + len)
    o += len
    while (v.length > 32 && v[0] === 0) v = v.slice(1)
    const out = new Uint8Array(32)
    out.set(v, 32 - v.length)
    return out
  }
  return new Uint8Array([...int(), ...int()])
}
