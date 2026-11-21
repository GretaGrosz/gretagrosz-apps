// English and German. The site's language toggle stores its choice in localStorage.lang on the same origin,
// so QED opens in whatever language the visitor picked on gretagrosz.com. English strings are the keys.
import { DE } from './i18n-de'

const pick = () => {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'de' || saved === 'en') return saved
  } catch {}
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']
  const first = langs.find((l) => /^(de|en)\b/i.test(l)) || 'en'
  return /^de/i.test(first) ? 'de' : 'en'
}

let LANG = pick()

export const getLang = () => LANG
export function setLang(lang) {
  LANG = lang === 'de' ? 'de' : 'en'
  try {
    localStorage.setItem('lang', LANG)
  } catch {}
  document.documentElement.lang = LANG
}
document.documentElement.lang = LANG

// t('Day {n} of {total}', { n: 3, total: 150 })
export function t(key, vars) {
  let s = (LANG === 'de' && DE[key]) || key
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
  return s
}

// Pick the singular or plural key by n
export const tn = (n, one, many, vars = {}) => t(n === 1 ? one : many, { n, ...vars })

export const locale = () => (LANG === 'de' ? 'de-AT' : 'en-GB')
export const fmtDate = (d, opts) => new Date(d).toLocaleDateString(locale(), opts)
export const fmtTime = (d) => new Date(d).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
