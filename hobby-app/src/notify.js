// Notifications for your account: someone liked your post, started because of it, wants to be friends, wrote to
// you (worker/blank-notify.js). Same push subscription as the buddy and the reminders (buddy.js).
import { useEffect } from 'react'
import { pushSubscription } from './buddy'
import { api } from './social'

const PREF = 'blank-account-push' // 'on' | 'off' (you switched it off) | missing (never asked)
const SYNCED = 'blank-account-push-synced'
const read = (k) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
const write = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {}
}
export const accountPushPref = () => read(PREF)

// From a tap (the phone may ask for permission)
export async function turnOnAccountPush(token, lang) {
  const sub = await pushSubscription()
  await api(token).pushOn({ ...sub, lang })
  write(PREF, 'on')
  write(SYNCED, `${new Date().toISOString().slice(0, 10)}|${token.slice(0, 6)}`)
}

export async function turnOffAccountPush(token) {
  write(PREF, 'off')
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await api(token).pushOff(sub.endpoint)
  } catch {}
}

// Logged in and notifications already allowed (from a reminder or the buddy): this account gets them too, quietly,
// once a day (so a new subscription or a new account on this phone is picked up). Never asks for permission itself.
export function useAccountPushSync(token, lang) {
  useEffect(() => {
    if (!token || read(PREF) === 'off') return
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
    const today = new Date().toISOString().slice(0, 10)
    if (read(SYNCED) === `${today}|${token.slice(0, 6)}`) return
    pushSubscription()
      .then((sub) => api(token).pushOn({ ...sub, lang }))
      .then(() => {
        write(PREF, 'on')
        write(SYNCED, `${today}|${token.slice(0, 6)}`)
      })
      .catch(() => {})
  }, [token, lang])
}
