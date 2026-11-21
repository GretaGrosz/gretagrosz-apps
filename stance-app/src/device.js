// Phone features: notifications (Web Push through public/sw.js), the Home Screen badge, and passkeys.
import { api } from './api.js'
import { t } from './i18n.js'

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0))

export const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const isMac = !isIOS && /Macintosh/.test(navigator.userAgent)
/** What unlocks a passkey on this device, for the one line that mentions it */
export const unlockWord = () => t(isIOS ? 'device.faceid' : isMac ? 'device.touchid' : 'device.screenlock')
const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

// ---------- notifications ----------

let reg = null
export function registerWorker(onOpen) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/stance/sw.js', { scope: '/stance/' }).then(r => { reg = r }).catch(() => {})
  navigator.serviceWorker.addEventListener('message', e => e.data?.type === 'open' && onOpen(e.data.url))
}
const ready = () => (reg ? Promise.resolve(reg) : navigator.serviceWorker.ready)

/** 'on' | 'off' | 'denied' | 'install' (iPhone, not on the Home Screen yet) | 'unsupported' */
export async function pushStatus() {
  if (!pushSupported) return isIOS && !isStandalone ? 'install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  const sub = await (await ready()).pushManager.getSubscription()
  return sub ? 'on' : 'off'
}

// Must run straight from a tap: iOS only shows the permission prompt inside one
export async function enablePush() {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error(t(perm === 'denied' ? 'push.blocked' : 'push.stayOff'))
  const { key } = await api('/push/key')
  if (!key) throw new Error(t('push.notSetUp'))
  const r = await ready()
  let sub = await r.pushManager.getSubscription()
  if (sub && b64url(sub.options?.applicationServerKey || new ArrayBuffer(0)) !== key) { await sub.unsubscribe(); sub = null }
  if (!sub) sub = await r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(key) })
  await api('/push', { method: 'POST', body: sub.toJSON() })
}

export async function disablePush() {
  if (!pushSupported) return
  const sub = await (await ready()).pushManager.getSubscription()
  if (!sub) return
  await api('/push', { method: 'DELETE', body: { endpoint: sub.endpoint } }).catch(() => {})
  await sub.unsubscribe()
}

// After signing in on a phone that already allowed notifications, tell the server again
export async function syncPush() {
  if (!pushSupported || Notification.permission !== 'granted') return
  const sub = await (await ready()).pushManager.getSubscription()
  if (sub) await api('/push', { method: 'POST', body: sub.toJSON() })
}

/** The unread count on the Home Screen icon */
export function setBadge(n) {
  try { n ? navigator.setAppBadge?.(n) : navigator.clearAppBadge?.() } catch {}
}

// ---------- passkeys ----------

export const passkeysSupported = typeof window.PublicKeyCredential === 'function'

/** Saves a passkey for the signed-in account (iCloud Keychain, Google Password Manager, ...) */
export async function savePasskey() {
  // The challenge comes from the server and is bound to this account (worker/passkeys.js)
  const o = await api('/passkeys/options', { method: 'POST' })
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: fromB64url(o.challenge),
      rp: { name: 'Agora', id: o.rpId },
      user: { id: fromB64url(o.user.id), name: o.user.name, displayName: o.user.displayName },
      excludeCredentials: o.exclude.map(id => ({ type: 'public-key', id: fromB64url(id) })),
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'preferred' },
      attestation: 'none',
      timeout: 120000,
    },
  })
  const res = cred.response
  return api('/passkeys', {
    method: 'POST',
    body: {
      challengeId: o.challengeId, id: cred.id, alg: res.getPublicKeyAlgorithm(), publicKey: b64url(res.getPublicKey()),
      authenticatorData: b64url(res.getAuthenticatorData()), clientDataJSON: b64url(res.clientDataJSON),
    },
  })
}

/** Fetch a challenge before the tap, so the passkey sheet opens straight from it (Safari needs that) */
export const passkeyChallenge = () => api('/passkeys/challenge', { method: 'POST' })

export async function signInWithPasskey(ch) {
  const cred = await navigator.credentials.get({
    publicKey: { challenge: fromB64url(ch.challenge), rpId: ch.rpId, userVerification: 'preferred', allowCredentials: [], timeout: 120000 },
  })
  const res = cred.response
  return api('/passkeys/login', {
    method: 'POST',
    body: {
      challengeId: ch.id, id: cred.id, clientDataJSON: b64url(res.clientDataJSON),
      authenticatorData: b64url(res.authenticatorData), signature: b64url(res.signature),
    },
  })
}

/** True when the person closed the passkey sheet themselves */
export const cancelled = e => e?.name === 'NotAllowedError' || e?.name === 'AbortError'
