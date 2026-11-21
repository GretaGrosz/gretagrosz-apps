// Phone features: notifications (Web Push through sw.js), the Home Screen badge and install, and passkeys.
import { api } from './api.js'

const b64url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0))

export const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isAndroid = /Android/.test(navigator.userAgent)
export const isMac = /Mac/.test(navigator.platform) && !isIOS
export const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

/** What unlocks a passkey on this device, for the button label */
export const unlockName = () => (isIOS ? (screen.height >= 812 ? 'faceid' : 'touchid') : isMac ? 'touchid' : /Windows/.test(navigator.userAgent) ? 'hello' : 'screenlock')

// ---------- service worker and notifications ----------

let reg = null
export function registerWorker(onOpen) {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.register('/yap/sw.js', { scope: '/yap/' }).then(r => { reg = r }).catch(() => {})
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
  if (perm !== 'granted') throw Object.assign(new Error('push'), { code: perm === 'denied' ? 'pushDenied' : 'pushOff' })
  const { key } = await api('/push/key')
  if (!key) throw Object.assign(new Error('push'), { code: 'pushServer' })
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

export function setBadge(n) {
  try { n ? navigator.setAppBadge?.(n) : navigator.clearAppBadge?.() } catch {}
}

// ---------- staying signed in when Yap moves to the Home Screen ----------
// On iPhone the Home Screen app has its own storage and starts signed out. While the "Add to Home Screen"
// steps are open, the page address and the manifest's start URL carry a one-time sign-in code, so the new
// Home Screen app opens already signed in (the code works once, for 15 minutes).

let manifestBlob = null
export function carryCode(code) {
  history.replaceState(history.state, '', `/yap/#link/${code}`)
  const link = document.querySelector('link[rel="manifest"]')
  if (!link) return
  fetch('/yap/manifest.webmanifest').then(r => r.json()).then(m => {
    const abs = u => new URL(u, location.origin).href
    const out = { ...m, start_url: abs(`/yap/#link/${code}`), scope: abs('/yap/'), id: abs('/yap/'), icons: m.icons.map(i => ({ ...i, src: abs(i.src) })) }
    if (manifestBlob) URL.revokeObjectURL(manifestBlob)
    manifestBlob = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/manifest+json' }))
    link.href = manifestBlob
  }).catch(() => {})
}
export function stopCarrying(hash) {
  history.replaceState(history.state, '', '/yap/' + (hash || ''))
  const link = document.querySelector('link[rel="manifest"]')
  if (link) link.href = '/yap/manifest.webmanifest'
  if (manifestBlob) { URL.revokeObjectURL(manifestBlob); manifestBlob = null }
}

// ---------- passkeys ----------

export const passkeysSupported = typeof window.PublicKeyCredential === 'function'

/** Saves a passkey for the signed-in account; the challenge comes from the server and is bound to the account */
export async function savePasskey() {
  const o = await api('/passkeys/options', { method: 'POST' })
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: fromB64url(o.challenge),
      rp: { name: 'Yap', id: o.rpId },
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
export const passkeyChallenge = () => api('/passkeys/challenge', { method: 'POST', key: null })

export async function signInWithPasskey(ch) {
  const cred = await navigator.credentials.get({
    publicKey: { challenge: fromB64url(ch.challenge), rpId: ch.rpId, userVerification: 'preferred', allowCredentials: [], timeout: 120000 },
  })
  const res = cred.response
  return api('/passkeys/login', {
    method: 'POST',
    key: null,
    body: {
      challengeId: ch.id, id: cred.id, clientDataJSON: b64url(res.clientDataJSON),
      authenticatorData: b64url(res.authenticatorData), signature: b64url(res.signature),
    },
  })
}

/** True when the person closed the passkey sheet themselves */
export const cancelled = e => e?.name === 'NotAllowedError' || e?.name === 'AbortError'
