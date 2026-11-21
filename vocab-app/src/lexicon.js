// The word data at runtime. Each language is its own chunk (built by scripts/vite-plugins.mjs from src/words.js),
// so the app downloads only the languages in use. Call loadLanguages() first; the getters below are synchronous.
import THEMES from 'virtual:deca-themes'

export const LANGUAGE_IDS = ['en', 'de', 'es', 'fr', 'it']
export const DAY_COUNT = THEMES.length

const LOADERS = {
  en: () => import('virtual:deca-lang/en'),
  de: () => import('virtual:deca-lang/de'),
  es: () => import('virtual:deca-lang/es'),
  fr: () => import('virtual:deca-lang/fr'),
  it: () => import('virtual:deca-lang/it'),
}
const columns = {}
const pending = {}

export function loadLanguages(...ids) {
  return Promise.all(
    ids
      .filter((id) => LOADERS[id])
      .map((id) => columns[id] || (pending[id] ||= LOADERS[id]().then((m) => (columns[id] = m.default)).finally(() => delete pending[id]))),
  )
}
export const isLoaded = (...ids) => ids.every((id) => !id || columns[id])

const word = (d, i, from, to) => ({ key: `${d}:${i}`, front: columns[from][d][i].split('|')[0], answers: columns[to][d][i].split('|') })

// The 10 words of a day. After the last day it starts again from day 1.
export function wordsForDay(dayIndex, from, to) {
  const d = dayIndex % DAY_COUNT
  return { day: d, theme: THEMES[d], words: columns[to][d].map((_, i) => word(d, i, from, to)) }
}

// One word by its key ("day:row")
export function wordByKey(key, from, to) {
  const [d, i] = key.split(':').map(Number)
  return columns[to]?.[d]?.[i] != null && columns[from]?.[d]?.[i] != null ? word(d, i, from, to) : null
}

// Every answer that exists in a language. The checker uses it to refuse a "typo" that is really another word.
const dictionaries = {}
export function dictionary(id) {
  if (!columns[id]) return []
  return (dictionaries[id] ||= columns[id].flatMap((day) => day.flatMap((cell) => cell.split('|'))))
}

export const themeOf = (dayIndex) => THEMES[dayIndex % DAY_COUNT]

// Levels: each one starts further into the year of words (the later days have rarer words)
export const LEVELS = [
  { id: 'a1', name: 'A1', start: 0 },
  { id: 'a2', name: 'A2', start: 60 },
  { id: 'b1', name: 'B1', start: 150 },
  { id: 'b2', name: 'B2', start: 240 },
  { id: 'c1', name: 'C1', start: 300 },
]

export const levelIndexOf = (dayIndex) => {
  const day = dayIndex % DAY_COUNT
  let index = 0
  LEVELS.forEach((level, i) => {
    if (day >= level.start) index = i
  })
  return index
}

// 10 words for "Find my level": 2 random words from each level, each from a different day
export function placementWords(from, to) {
  const picks = []
  LEVELS.forEach((level, i) => {
    const end = LEVELS[i + 1]?.start ?? DAY_COUNT
    const days = new Set()
    while (days.size < 2) {
      const day = level.start + Math.floor(Math.random() * (end - level.start))
      if (days.has(day)) continue
      days.add(day)
      const words = wordsForDay(day, from, to).words
      picks.push({ ...words[Math.floor(Math.random() * words.length)], level: i })
    }
  })
  return picks
}
