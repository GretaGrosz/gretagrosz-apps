// "Add Blank to your Home Screen": the install prompt Chrome/Android hands over, and how often Blank has asked.
// The rule: ask right after someone posts or saves a plan (the start flow, pages/Onboarding.jsx), once more after the
// first reaction to their post (App.jsx InstallSheet), and never more than twice.
import { isIOS, isStandalone } from './buddy'

const KEY = 'blank-install' // 'done' once it's on the Home Screen
const ASKS = 'blank-install-asks'
export const MAX_ASKS = 2

// Chrome/Android hands over its install prompt once, often before React is up: keep it
let installEvent = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    try {
      localStorage.setItem(KEY, 'done')
    } catch {}
  })
}

export const canPrompt = () => !!installEvent
// Whether there's anything to show: not on the Home Screen yet, and either a one-tap prompt or the iPhone steps
export const canInstall = () => !isStandalone() && (!!installEvent || isIOS)

export function asks() {
  try {
    if (localStorage.getItem(KEY) === 'done') return MAX_ASKS
    return Number(localStorage.getItem(ASKS)) || 0
  } catch {
    return MAX_ASKS // no storage: we couldn't keep count, so don't nag
  }
}
export function countAsk() {
  try {
    localStorage.setItem(ASKS, String(asks() + 1))
  } catch {}
}
export function markInstalled() {
  try {
    localStorage.setItem(KEY, 'done')
  } catch {}
}

// The one-tap install (Android/desktop Chrome). → true if they said yes
export async function promptInstall() {
  const e = installEvent
  installEvent = null
  if (!e) return false
  e.prompt()
  const choice = await e.userChoice.catch(() => null)
  if (choice?.outcome === 'accepted') {
    markInstalled()
    return true
  }
  return false
}
