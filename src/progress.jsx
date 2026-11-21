import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { levelOf } from './data/shop.js'
import { addDays, dayKey, refKey } from './data/questions.js'
import { getJahrgang, getTopic } from './data/curriculum.js'
import { nextEntry } from './data/srs.js'

// Lernfortschritt – nur im Browser gespeichert (ein Schlüssel), mit Export/Import in den Einstellungen.
// XP gibt es für jede Aktion nur einmal (Schlüssel in `done`), Wiederholungen einmal pro Karte und Tag.

export const STORAGE_KEY = 'bw-buddy-progress'
// myYear: gewählter Jahrgang · last: zuletzt geöffnetes Thema (für „Weitermachen“)
// mistakes: falsch beantwortete Fragen (Fehlerheft) · results: letzte 10 Antworten je Thema
// exams: eingetragene Schularbeiten / LZKs / Tests · srs: Karteikasten { [kartenId]: { box, due } }
// day: was heute schon erledigt wurde (für den Lernplan) · planDay: die Aufgaben von heute
// mocks: Ergebnisse der Probetests · hints: einmalige Hinweise, die schon gezeigt wurden
const EMPTY = {
  xp: 0, done: {}, cards: {}, streak: { day: null, count: 0 }, myYear: null, last: null,
  mistakes: {}, results: {}, exams: [], srs: {}, day: null, planDay: null, mocks: [], hints: {},
  onboarded: false,
}

export const XP = { step: 5, summary: 20, quiz: 3, card: 2, review: 1 }

const validYear = (y) => Boolean(getJahrgang(y))

// Alte oder fremde Stände aufräumen: unbekannte Jahrgänge/Themen raus, alte Karteikarten in den Karteikasten.
export function normalize(saved) {
  const s = { ...EMPTY, ...saved }
  if (typeof s.xp !== 'number' || s.xp < 0) s.xp = 0
  for (const k of ['done', 'cards', 'mistakes', 'results', 'srs', 'hints']) if (!s[k] || typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = {}
  if (!Array.isArray(s.exams)) s.exams = []
  if (!Array.isArray(s.mocks)) s.mocks = []
  s.onboarded = saved.onboarded ?? Boolean(saved.myYear)
  if (s.myYear !== null && !validYear(s.myYear)) {
    // z. B. 4./5. Jahrgang (noch nicht geschrieben): Jahrgang neu wählen lassen
    s.myYear = null
    s.onboarded = false
  }
  s.exams = s.exams.filter((e) => e && validYear(e.jahrgangId) && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && Array.isArray(e.kapitelIds))
  s.mistakes = Object.fromEntries(Object.entries(s.mistakes).filter(([, r]) => r && getTopic(r.jahrgangId, r.topicId)))
  s.results = Object.fromEntries(Object.entries(s.results).filter(([, r]) => r && Array.isArray(r.last) && getTopic(r.jahrgangId, r.topicId)))
  if (s.last && !getTopic(s.last.jahrgangId, s.last.topicId)) s.last = null
  const tomorrow = addDays(dayKey(), 1)
  for (const id of Object.keys(s.cards)) if (!s.srs[id]) s.srs[id] = { box: 2, due: tomorrow }
  return s
}

// Deep link von gretagrosz.com: …/bwbuddy/#jahrgang=2 überspringt die Einrichtung
function yearFromLink() {
  const m = /[#?&]jahrgang=(\d)/.exec(window.location.hash)
  return m && validYear(Number(m[1])) ? Number(m[1]) : null
}

function readStored() {
  let state = EMPTY
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) state = normalize(JSON.parse(raw))
  } catch {
    /* Speicher nicht verfügbar oder kaputt – leer starten */
  }
  const linked = yearFromLink()
  if (linked && !state.onboarded) state = { ...state, myYear: linked, onboarded: true }
  return state
}

function nextStreak(streak) {
  const today = dayKey()
  if (streak.day === today) return streak
  const yesterday = addDays(today, -1)
  return { day: today, count: streak.day === yesterday ? streak.count + 1 : 1 }
}

// Aktuelle Streak: zählt nur, wenn heute oder gestern gelernt wurde.
export function currentStreak(streak) {
  const today = dayKey()
  return streak.day === today || streak.day === addDays(today, -1) ? streak.count : 0
}

const todayLog = (s) => (s.day && s.day.date === dayKey() ? s.day : { date: dayKey(), practised: [], mocks: 0, reviewed: 0, mistakes: 0 })

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [state, setState] = useState(readStored)
  const [levelUp, setLevelUp] = useState(null)
  const prevLevel = useRef(levelOf(state.xp).index)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      setSaveError(false)
    } catch {
      setSaveError(true)
    }
    const level = levelOf(state.xp).index
    if (level > prevLevel.current) setLevelUp(level)
    prevLevel.current = level
  }, [state])

  // Änderungen aus einem anderen Tab übernehmen
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        setState(normalize(JSON.parse(e.newValue)))
      } catch {
        /* ignorieren */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Vergibt XP für `key`, aber nur beim ersten Mal.
  const award = useCallback((key, amount) => {
    setState((s) => {
      if (s.done[key]) return s
      return { ...s, xp: s.xp + amount, done: { ...s.done, [key]: 1 }, streak: nextStreak(s.streak) }
    })
  }, [])

  // Karteikarte beantwortet: Karteikasten weiterschieben (und "gewusst" fürs Häkchen merken)
  const reviewCard = useCallback((cardId, known, { review = false } = {}) => {
    const today = dayKey()
    setState((s) => {
      const cards = { ...s.cards }
      if (known) cards[cardId] = 1
      else delete cards[cardId]
      const srs = { ...s.srs, [cardId]: nextEntry(s.srs[cardId], known, today) }
      const log = todayLog(s)
      const day = review ? { ...log, reviewed: log.reviewed + 1 } : log
      let { xp, done, streak } = s
      const key = review ? `review:${cardId}:${today}` : `card:${cardId}`
      if (known && !done[key]) {
        xp += review ? XP.review : XP.card
        done = { ...done, [key]: 1 }
      }
      if (review || known) streak = nextStreak(streak)
      return { ...s, cards, srs, day, xp, done, streak }
    })
  }, [])

  const setMyYear = useCallback((year) => setState((s) => ({ ...s, myYear: Number(year) })), [])
  const finishOnboarding = useCallback((year) => setState((s) => ({ ...s, myYear: Number(year ?? s.myYear), onboarded: true })), [])

  // Merkt sich das zuletzt geöffnete Thema. Der Lernschritt bleibt erhalten,
  // wenn dasselbe Thema später über Üben oder Karteikarten geöffnet wird.
  const setLast = useCallback((entry) => {
    setState((s) => {
      const same = s.last && s.last.topicId === entry.topicId
      const last = { ...(same ? s.last : {}), ...entry }
      if (same && JSON.stringify(last) === JSON.stringify(s.last)) return s
      return { ...s, last }
    })
  }, [])

  // Eine Quizantwort merken: falsch → ins Fehlerheft, richtig → raus aus dem Fehlerheft.
  // Pro Thema zählen nur die letzten 10 Antworten (für schwache Themen und die Notenprognose).
  const recordAnswer = useCallback((ref, correct) => {
    if (!ref) return
    setState((s) => {
      const key = refKey(ref)
      const mistakes = { ...s.mistakes }
      if (correct) delete mistakes[key]
      else mistakes[key] = ref
      const topicKey = `${ref.jahrgangId}|${ref.kapitelId}|${ref.topicId}`
      const prev = s.results[topicKey]?.last ?? []
      const results = {
        ...s.results,
        [topicKey]: { jahrgangId: ref.jahrgangId, kapitelId: ref.kapitelId, topicId: ref.topicId, last: [...prev, correct ? 1 : 0].slice(-10) },
      }
      return { ...s, mistakes, results, streak: nextStreak(s.streak) }
    })
  }, [])

  // Tagesprotokoll für den Lernplan
  const logDay = useCallback((change) => {
    setState((s) => {
      const log = todayLog(s)
      return { ...s, day: change(log) }
    })
  }, [])
  const logPractised = useCallback(
    (topicIds) => logDay((d) => ({ ...d, practised: [...new Set([...d.practised, ...topicIds])] })),
    [logDay],
  )
  const logMistakesRun = useCallback(() => logDay((d) => ({ ...d, mistakes: d.mistakes + 1 })), [logDay])

  const logMock = useCallback((result) => {
    setState((s) => {
      const log = todayLog(s)
      return { ...s, day: { ...log, mocks: log.mocks + 1 }, mocks: [...s.mocks, { ...result, date: dayKey() }].slice(-30) }
    })
  }, [])

  const setPlanDay = useCallback((planDay) => setState((s) => ({ ...s, planDay })), [])

  const addExam = useCallback((exam) => {
    const id = `${Date.now()}`
    setState((s) => ({ ...s, exams: [...s.exams, { ...exam, id }].sort((a, b) => a.date.localeCompare(b.date)) }))
    return id
  }, [])

  const updateExam = useCallback((id, changes) => {
    setState((s) => ({
      ...s,
      exams: s.exams.map((e) => (e.id === id ? { ...e, ...changes } : e)).sort((a, b) => a.date.localeCompare(b.date)),
      planDay: s.planDay?.examId === id ? null : s.planDay,
    }))
  }, [])

  const removeExam = useCallback((id) => {
    setState((s) => ({ ...s, exams: s.exams.filter((e) => e.id !== id) }))
  }, [])

  const restoreExam = useCallback((exam) => {
    setState((s) => (s.exams.some((e) => e.id === exam.id) ? s : { ...s, exams: [...s.exams, exam].sort((a, b) => a.date.localeCompare(b.date)) }))
  }, [])

  const markHint = useCallback((key) => setState((s) => (s.hints[key] ? s : { ...s, hints: { ...s.hints, [key]: 1 } })), [])

  // Sicherung einspielen (Einstellungen → Sicherung)
  const replaceAll = useCallback((data) => {
    const next = normalize(data)
    prevLevel.current = levelOf(next.xp).index
    setState(next)
  }, [])

  const clearLevelUp = useCallback(() => setLevelUp(null), [])

  const value = useMemo(
    () => ({
      ...state, award, reviewCard, setMyYear, finishOnboarding, setLast, recordAnswer, logPractised, logMistakesRun, logMock,
      setPlanDay, addExam, updateExam, removeExam, restoreExam, markHint, replaceAll, levelUp, clearLevelUp, saveError,
    }),
    [state, award, reviewCard, setMyYear, finishOnboarding, setLast, recordAnswer, logPractised, logMistakesRun, logMock,
      setPlanDay, addExam, updateExam, removeExam, restoreExam, markHint, replaceAll, levelUp, clearLevelUp, saveError],
  )
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  return useContext(ProgressContext)
}
