// Everything Deca remembers lives on the phone, in localStorage['ten-a-day'] (key kept from the first version).
import { useEffect, useState } from 'react'

const KEY = 'ten-a-day'
export const DAY = 864e5

// Your local calendar day as a number (days since 1970 in your time zone)
export const dayOf = (t) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY)
// A day number as a Date to format with timeZone 'UTC', and back from an <input type="date"> value
export const dateOfDay = (day) => new Date(day * DAY)
export const dayFromInput = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  return m ? Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : null
}
export const inputFromDay = (day) => dateOfDay(day).toISOString().slice(0, 10)

/*
 v2 shape:
 {
   v: 2, from, lang,                       // the language you speak, the one you learn
   course: { [lang]: { day, passed, last, cards } }
     day    = next day of words to learn (0-based)
     passed = calendar day of the last pass (so "done today" is per language)
     last   = the day of words that pass was for (for "practise again")
     cards  = calendar day the flashcards of `day` were finished
   streak: { count, lastDay },             // one streak for all your studying
   srs: { [lang]: { "day:row": [box, due, lastGraded] } },
   lists: [{ id, name, from, lang, test, created, words: [{ front, answers }], intro: { [i]: day }, srs: { [i]: entry }, passed, cards }],
   history: { [day]: { s, t: [...] } },  // what you did each day, for the year grid (see year.js)
   sound: true,
 }
*/
export const EMPTY = { v: 2, from: null, lang: null, course: {}, streak: { count: 0, lastDay: null }, srs: {}, lists: [], history: {}, sound: true }

export function migrate(raw, today) {
  if (!raw || typeof raw !== 'object') return EMPTY
  if (raw.v === 2) return { ...EMPTY, ...raw, streak: { ...EMPTY.streak, ...raw.streak } }
  // v1: { from, lang, progress: { [lang]: daysPassed }, streak: { count, lastDay } }
  const streak = { count: raw.streak?.count || 0, lastDay: raw.streak?.lastDay ?? null }
  const course = {}
  for (const [lang, days] of Object.entries(raw.progress || {})) {
    const passedToday = lang === raw.lang && streak.lastDay === today && days > 0
    course[lang] = { day: days, passed: passedToday ? today : null, last: passedToday ? days - 1 : null, cards: null }
  }
  return { ...EMPTY, from: raw.lang ? raw.from || 'en' : raw.from || null, lang: raw.lang || null, course, streak }
}

export function useSaved() {
  const [state, setState] = useState(() => {
    try {
      return migrate(JSON.parse(localStorage.getItem(KEY)), dayOf(Date.now()))
    } catch {
      return EMPTY
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked (private mode): the app keeps working for this visit
    }
  }, [state])
  return [state, setState]
}

// Today's day number, kept right while the app stays open: re-checked at local midnight and whenever the app comes back
export function useToday() {
  const [today, setToday] = useState(() => dayOf(Date.now()))
  useEffect(() => {
    let timer
    const check = () => {
      setToday(dayOf(Date.now()))
      clearTimeout(timer)
      const now = new Date()
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1)
      timer = setTimeout(check, Math.max(1000, midnight - now))
    }
    check()
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', check)
    window.addEventListener('pageshow', check)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', check)
      window.removeEventListener('pageshow', check)
    }
  }, [])
  return today
}

// Light or dark, following the phone
export function useDark() {
  const query = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null
  const [dark, setDark] = useState(() => !!query?.matches)
  useEffect(() => {
    if (!query) return
    const on = (e) => setDark(e.matches)
    query.addEventListener?.('change', on)
    return () => query.removeEventListener?.('change', on)
  }, [])
  return dark
}

// State that survives a reload of this tab (where you are in a test or a card deck), but not a new visit
export function useSessionState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const saved = sessionStorage.getItem(key)
      if (saved != null) return JSON.parse(saved)
    } catch {
      // ignore unreadable session data
    }
    return typeof initial === 'function' ? initial() : initial
  })
  useEffect(() => {
    try {
      if (value === undefined) sessionStorage.removeItem(key)
      else sessionStorage.setItem(key, JSON.stringify(value))
    } catch {
      // session storage unavailable: nothing to restore later
    }
  }, [key, value])
  return [value, setValue]
}

export const clearSession = (prefix) => {
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // nothing stored
  }
}
