// Talking to the buddy API (worker/blank.js) and turning on notifications for it.
// Everything else in Blank works without a connection; only the buddy needs one.

const API = '/blank/api'

export class ApiError extends Error {
  constructor(code, status = 0) {
    super(code)
    this.code = code // offline | gone | taken | not_found | too_many | too_soon | server | …
    this.status = status
  }
}

export async function call(path, { method = 'GET', key, body } = {}) {
  let res
  try {
    res = await fetch(API + path, {
      method,
      headers: { ...(body && { 'content-type': 'application/json' }), ...(key && { authorization: `Bearer ${key}` }) },
      body: body && JSON.stringify(body),
    })
  } catch {
    throw new ApiError('offline')
  }
  let data = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok) {
    const err = new ApiError(data?.error || (res.status === 404 ? 'not_found' : 'server'), res.status)
    err.body = data
    throw err
  }
  return data
}

export const createInvite = (name, lang) => call('/pairs', { method: 'POST', body: { name, lang } })
export const getInvite = (code) => call(`/invite/${encodeURIComponent(code)}`)
export const joinInvite = (code, name, lang) => call(`/invite/${encodeURIComponent(code)}/join`, { method: 'POST', body: { name, lang } })
export const getPair = (key) => call('/pair', { key })
export const patchPair = (key, body) => call('/pair', { method: 'PATCH', key, body })
export const endPair = (key) => call('/pair', { method: 'DELETE', key })
export const sendCheckin = (key, body) => call('/checkins', { method: 'POST', key, body })
export const sendNudge = (key) => call('/nudge', { method: 'POST', key })

export const inviteLink = (code) => `${location.origin}${import.meta.env.BASE_URL}#/b/${code}`
export const validCode = (code) => /^[a-z0-9]{10}$/.test(code || '')

// ---------- notifications (Web Push through public/sw.js) ----------

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0))
export const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

const registration = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new ApiError('no_worker')), 4000))])

/** 'on' | 'off' | 'denied' | 'install' (iPhone, not on the Home Screen yet) | 'unsupported' */
export async function pushStatus() {
  if (!pushSupported()) return isIOS && !isStandalone() ? 'install' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission !== 'granted') return 'off'
  try {
    const sub = await (await registration()).pushManager.getSubscription()
    return sub ? 'on' : 'off'
  } catch {
    return 'unsupported'
  }
}

// This phone's push subscription, asking for permission if needed. Must run straight from a tap: iOS only shows
// the permission prompt inside one. Used by the buddy and by the axolotl's reminders (reminders.js).
export async function pushSubscription() {
  if (!pushSupported()) throw new ApiError(isIOS && !isStandalone() ? 'install' : 'unsupported')
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
  if (perm !== 'granted') throw new ApiError(perm === 'denied' ? 'denied' : 'dismissed')
  const { key: vapid } = await call('/push/key')
  if (!vapid) throw new ApiError('push_not_set_up')
  const reg = await registration()
  let sub = await reg.pushManager.getSubscription()
  if (sub && b64url(sub.options?.applicationServerKey || new ArrayBuffer(0)) !== vapid) {
    await sub.unsubscribe()
    sub = null
  }
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(vapid) })
  return sub.toJSON()
}

export async function enablePush(key) {
  await call('/push', { method: 'POST', key, body: await pushSubscription() })
}

export async function disablePush(key) {
  await call('/push', { method: 'DELETE', key }).catch(() => {})
  if (!pushSupported()) return
  try {
    const sub = await (await registration()).pushManager.getSubscription()
    await sub?.unsubscribe()
  } catch {}
}
