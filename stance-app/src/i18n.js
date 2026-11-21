// Language for Stance. The first choice is the site-wide key gretagrosz.com writes (localStorage 'lang': 'en' | 'de'),
// then the browser's languages. Switching in the app writes the same key, so the whole site follows.
import { STRINGS } from './strings.js'

const KEY = 'lang'

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'de') return saved
  } catch {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']
  for (const l of langs) {
    const base = String(l).toLowerCase().slice(0, 2)
    if (base === 'de') return 'de'
    if (base === 'en') return 'en'
  }
  return 'en'
}

export let lang = detect()
document.documentElement.lang = lang

export function setLang(next) {
  try { localStorage.setItem(KEY, next) } catch {}
  // Every string, date and cached payload depends on it; a reload is the honest way to switch everything at once
  location.reload()
}

/** t('key', { n: 3 }) — {name} placeholders; an entry may be { one, other } for counts (uses vars.n) */
export function t(key, vars = {}) {
  let s = STRINGS[lang][key] ?? STRINGS.en[key]
  if (s == null) return key
  if (typeof s === 'object') s = vars.n === 1 ? s.one : s.other
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
}

export const locale = () => (lang === 'de' ? 'de-AT' : 'en-GB')

/** A YYYY-MM-DD day as text, e.g. "Sunday 18 October" */
export const dayText = (day, opts = { weekday: 'long', day: 'numeric', month: 'long' }) =>
  new Date(day + 'T12:00:00Z').toLocaleDateString(locale(), { ...opts, timeZone: 'UTC' })

/** Today's date the way the server counts days (Europe/Berlin), so the title never shows yesterday after midnight */
export const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date())

export function timeAgo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000)
  if (s < 45) return t('time.now')
  if (s < 3600) return t('time.m', { n: Math.round(s / 60) })
  if (s < 86400) return t('time.h', { n: Math.round(s / 3600) })
  if (s < 86400 * 7) return t('time.d', { n: Math.round(s / 86400) })
  return new Date(ts).toLocaleDateString(locale(), { day: 'numeric', month: 'short' })
}

/** "Today", "Yesterday", a weekday, or a date */
export function relDay(ts) {
  const d = new Date(ts), now = new Date()
  const days = Math.round((new Date(now.toDateString()) - new Date(d.toDateString())) / 86400000)
  if (days === 0) return t('time.today')
  if (days === 1) return t('time.yesterday')
  if (days < 7) return d.toLocaleDateString(locale(), { weekday: 'long' })
  return d.toLocaleDateString(locale(), { day: 'numeric', month: 'short', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}
export const clock = ts => new Date(ts).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' })
