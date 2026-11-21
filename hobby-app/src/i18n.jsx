// English, German and Hungarian. Strings are written in English in the code; src/de.js and src/hu.js map them.
// The language choice is shared with the rest of gretagrosz.com (localStorage 'lang'; the site itself only has EN/DE).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import DE from './de'
import HU from './hu'

export const LANGS = ['en', 'de', 'hu']
const DICT = { de: DE, hu: HU }

// The language the app is in right now (store.jsx uses it for the head-start step)
export const readLang = () => {
  try {
    const v = localStorage.getItem('lang')
    if (LANGS.includes(v)) return v
  } catch {}
  const first = (navigator.languages || [navigator.language]).find((l) => /^(de|hu)\b/i.test(l || ''))
  return first ? first.slice(0, 2).toLowerCase() : 'en'
}

export function translate(lang, s, vars) {
  let out = DICT[lang]?.[s] ?? s
  if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
  return out
}

export const locale = (lang) => ({ de: 'de-AT', hu: 'hu-HU' })[lang] || 'en-GB'

function makeFormat(lang) {
  const rtf = new Intl.RelativeTimeFormat(locale(lang), { numeric: 'auto' })
  return {
    // "2 hours ago", "yesterday", "vor 3 Tagen"
    ago(t) {
      const s = (Date.now() - t) / 1000
      if (s < 45) return translate(lang, 'just now')
      if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute')
      if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour')
      if (s < 7 * 86400) return rtf.format(-Math.round(s / 86400), 'day')
      return new Date(t).toLocaleDateString(locale(lang), { day: 'numeric', month: 'short' })
    },
    date: (t, opts = { day: 'numeric', month: 'long' }) => new Date(t).toLocaleDateString(locale(lang), opts),
    month: (t = Date.now()) => new Date(t).toLocaleDateString(locale(lang), { month: 'long' }),
    num: (n) => new Intl.NumberFormat(locale(lang)).format(n),
  }
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(readLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  // Another tab of the site switched language
  useEffect(() => {
    const onStorage = (e) => e.key === 'lang' && LANGS.includes(e.newValue) && setLangState(e.newValue)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const setLang = useCallback((next) => {
    setLangState(next)
    try {
      localStorage.setItem('lang', next)
    } catch {}
  }, [])
  const value = useMemo(() => {
    const t = (s, vars) => translate(lang, s, vars)
    // Pick the singular or plural English string, then translate it
    const tn = (n, one, many, vars) => t(n === 1 ? one : many, { n, ...vars })
    return { lang, setLang, t, tn, fmt: makeFormat(lang) }
  }, [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useT = () => useContext(Ctx)
