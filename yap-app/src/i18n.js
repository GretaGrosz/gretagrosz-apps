// English and German. The first language is the one the site stored (localStorage 'lang', shared across
// gretagrosz.com), else the browser's; switching here writes the same key.
import { S } from './strings.js'

const KEY = 'lang'
const listeners = new Set()

function detect() {
  try { const s = localStorage.getItem(KEY); if (s === 'de' || s === 'en') return s } catch {}
  for (const l of navigator.languages || [navigator.language || 'en']) {
    if (/^de\b/i.test(l)) return 'de'
    if (/^en\b/i.test(l)) return 'en'
  }
  return 'en'
}

let current = typeof navigator !== 'undefined' ? detect() : 'en'
if (typeof document !== 'undefined') document.documentElement.lang = current

export const lang = () => current
export function setLang(l) {
  if (l !== 'en' && l !== 'de') return
  current = l
  try { localStorage.setItem(KEY, l) } catch {}
  document.documentElement.lang = l
  listeners.forEach(f => f(l))
}
export function onLang(fn) { listeners.add(fn); return () => listeners.delete(fn) }

/** The string for `key` in the current language; {name} placeholders come from `vars`; entries can be functions of vars */
export function t(key, vars = {}) {
  const e = S[key]
  if (!e) {
    if (import.meta.env.DEV) console.warn('Missing string', key)
    return key
  }
  let s = e[current === 'de' ? 1 : 0]
  if (typeof s === 'function') s = s(vars)
  return String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')
}
