// Web Push without a library: VAPID signing (RFC 8292) and aes128gcm payload encryption (RFC 8291),
// all with WebCrypto. The VAPID private key is the VAPID_PRIVATE secret (a P-256 JWK).

const enc = new TextEncoder()
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const unb64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0))
const concat = (...parts) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

/** The public key browsers need to subscribe (uncompressed P-256 point, base64url) */
export function vapidPublicKey(env) {
  if (!env.VAPID_PRIVATE) return null
  const jwk = JSON.parse(env.VAPID_PRIVATE)
  return b64url(concat([4], unb64url(jwk.x), unb64url(jwk.y)))
}

/** The VAPID Authorization header for one push endpoint (also used by site.js) */
export async function vapidAuth(env, endpoint) {
  const jwk = JSON.parse(env.VAPID_PRIVATE)
  const key = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, d: jwk.d }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'])
  const head = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })))
  const claims = b64url(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'https://gretagrosz.com/yap/' })))
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + claims))
  return `vapid t=${head}.${claims}.${b64url(sig)}, k=${vapidPublicKey(env)}`
}

const hkdf = async (salt, ikm, info, bytes) => {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8))
}

/** Encrypts `payload` (a string) for one subscription, as an aes128gcm body */
export async function encrypt(sub, payload) {
  const uaPublic = unb64url(sub.p256dh), authSecret = unb64url(sub.auth)
  const local = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', local.publicKey))
  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, local.privateKey, 256))
  const ikm = await hkdf(authSecret, shared, concat(enc.encode('WebPush: info\0'), uaPublic, asPublic), 32)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16)
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12)
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, concat(enc.encode(payload), [2])))
  const header = new Uint8Array(21)
  header.set(salt)
  new DataView(header.buffer).setUint32(16, 4096)
  header[20] = asPublic.length
  return concat(header, asPublic, sealed)
}

/** Sends { title, body, url, tag } to every browser `userId` turned notifications on in (in that app's `db`); drops dead ones */
export async function notify(env, userId, message, db = env.DB) {
  if (!env.VAPID_PRIVATE) return
  const { results } = await db.prepare('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?').bind(userId).all()
  await Promise.all(results.map(async sub => {
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
      if (res.status === 404 || res.status === 410) await db.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(sub.endpoint).run()
      else if (!res.ok) console.error('push', res.status, await res.text())
    } catch (e) { console.error('push', e) }
  }))
}

// Notifications only go to the browsers' own push services, so a made-up "subscription" can't make the Worker
// send requests to any other address
const PUSH_HOSTS = /^(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$/
export const pushEndpointOk = (endpoint) => {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return false
  try {
    const u = new URL(endpoint)
    return u.protocol === 'https:' && !u.port && !u.username && !u.password && PUSH_HOSTS.test(u.hostname)
  } catch {
    return false
  }
}
