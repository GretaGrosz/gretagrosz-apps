// Your own word lists: paste the vocab page from your school book, give it the test date, and Deca plans it.
import { forms } from './check.js'
import { dueKeys } from './srs.js'

/* ---------- Parsing a pasted list ---------- */

// Separators between the two columns, most specific first. A plain "-" only counts with spaces around it,
// so "ice-cream" and "grand-mère" stay one word.
const SEPARATORS = [
  /\t+/,
  /\s+(?:=>|->|→|⇒)\s+/,
  /\s+=\s+|\s*=\s*/,
  /\s+[–—]\s+|\s*[–—]\s*/,
  /\s+-\s+/,
  /\s*;\s*/,
  /\s+:\s+|\s*:\s+/,
  /\s{2,}/,
  /\s*\|\s*/,
]
const BULLET = /^\s*(?:\d{1,3}\s*[.)]\s+|[-•*·▪●◦–]\s+)/
// A heading copied along with the list ("Unit 7 – Vocabulary", "Lektion 3: Wortschatz", "Page 42")
const HEADING = /^(?:unit|lesson|chapter|module|page|vocabulary|vocab|word ?list|lektion|kapitel|einheit|seite|vokabeln|wortschatz|wörter|unité|leçon|vocabulaire|unidad|lección|vocabulario|unità|lezione|vocabolario)\b/i

// Several answers in one cell: "der Hund / die Hündin", "schauen, sehen"
const splitAlternatives = (cell) =>
  cell
    .split(/\s*\/\s*|\s*,\s*|\s*;\s*/)
    .map((s) => s.trim())
    .filter(Boolean)

/**
 * parseList(text) → { rows: [{ left, right }], skipped: [line] }
 * Accepts "word - translation", "word = translation", tabs (copied from Word/Excel/a PDF table), semicolons, colons,
 * arrows, two or more spaces, numbered or bulleted lines. A single comma is used only when nothing else is there.
 */
export function parseList(text) {
  const rows = []
  const skipped = []
  const seen = new Set()
  for (const raw of String(text).replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.replace(BULLET, '').replace(/ /g, ' ').trim()
    if (!line) continue
    if (HEADING.test(line) && /\d/.test(line)) {
      skipped.push(line)
      continue
    }
    let parts = null
    for (const sep of SEPARATORS) {
      const p = line.split(sep).map((s) => s.trim()).filter(Boolean)
      if (p.length >= 2) {
        parts = p
        break
      }
    }
    if (!parts && (line.match(/,/g) || []).length === 1) parts = line.split(',').map((s) => s.trim()).filter(Boolean)
    if (!parts || parts.length < 2) {
      skipped.push(line)
      continue
    }
    // Three columns (word | grammar | translation): keep the first and the last
    const left = parts[0]
    const right = parts[parts.length - 1]
    const id = `${left.toLowerCase()}\u0000${right.toLowerCase()}`
    if (seen.has(id)) continue
    seen.add(id)
    rows.push({ left, right })
  }
  return { rows, skipped }
}

// Which column is the language you learn? Counts how many cells are known words of each language.
export function guessLearnSide(rows, from, lang, dicts) {
  const index = (id) => new Set((dicts[id] || []).map((w) => forms(w, id).loose))
  const own = index(from)
  const target = index(lang)
  let leftIsTarget = 0
  let rightIsTarget = 0
  for (const { left, right } of rows) {
    const l = splitAlternatives(left)
    const r = splitAlternatives(right)
    const hit = (cells, set, id) => cells.some((c) => set.has(forms(c, id).loose))
    if (hit(l, target, lang)) leftIsTarget++
    if (hit(r, own, from)) leftIsTarget++
    if (hit(r, target, lang)) rightIsTarget++
    if (hit(l, own, from)) rightIsTarget++
  }
  // A school vocab page usually has the new language on the left
  return rightIsTarget > leftIsTarget ? 'right' : 'left'
}

// Rows → words: front = your language (shown), answers = the language you learn (typed)
export function toWords(rows, learnSide) {
  const merged = new Map()
  for (const { left, right } of rows) {
    const [target, own] = learnSide === 'left' ? [left, right] : [right, left]
    const front = own.trim()
    const answers = splitAlternatives(target)
    if (!front || !answers.length) continue
    const key = front.toLowerCase()
    const prev = merged.get(key)
    if (prev) prev.answers = [...new Set([...prev.answers, ...answers])]
    else merged.set(key, { front, answers })
  }
  return [...merged.values()]
}

/* ---------- Planning to the test date ---------- */

// Every list word gets an entry in list.srs keyed by its index. list.intro[i] = the day it was first studied.
// New words are spread over the days before the test; the last day before the test is for reviewing everything,
// and no word is scheduled after that day. Missed words come back the next day.

const introducedOn = (list, i) => list.intro?.[i]

// How many new words each remaining day gets
function spread(remaining, today, test) {
  const lastIntroDay = test - 2 // the day before the test is review only
  const days = Math.max(1, lastIntroDay - today + 1)
  return Math.ceil(remaining / days)
}

/**
 * planFor(list, today) → {
 *   newToday: [index], due: [index], testIn: days until the test (0 = today, negative = past),
 *   days: [{ day, count, kind: 'new' | 'review' | 'test' }]  (today → test day)
 * }
 */
export function planFor(list, today) {
  const n = list.words.length
  const all = list.words.map((_, i) => i)
  const assignedToday = all.filter((i) => introducedOn(list, i) === today)
  const fresh = all.filter((i) => introducedOn(list, i) == null)
  const testIn = list.test - today
  let newToday = assignedToday
  if (!assignedToday.length && fresh.length && list.passed !== today) {
    const count = testIn <= 1 ? fresh.length : spread(fresh.length, today, list.test)
    newToday = fresh.slice(0, count)
  }
  const newSet = new Set(newToday)
  // Due: words already studied before today, whose day has come. On the last day before the test: all of them.
  const dueStrs = dueKeys(list.srs, today).map(Number)
  const finalDay = testIn === 1
  const studied = all.filter((i) => introducedOn(list, i) != null && introducedOn(list, i) < today)
  const due = (finalDay && list.passed !== today ? studied : dueStrs).filter((i) => !newSet.has(i) && introducedOn(list, i) !== today)

  const days = []
  if (testIn >= 0) {
    let left = fresh.length - (assignedToday.length ? 0 : newToday.length)
    for (let d = today; d <= list.test; d++) {
      if (d === list.test) days.push({ day: d, count: n, kind: 'test' })
      else if (d === today) days.push({ day: d, count: newToday.length, kind: newToday.length ? 'new' : 'review' })
      else if (d >= list.test - 1 && list.test - today > 1) days.push({ day: d, count: n, kind: 'review' })
      else {
        const c = left > 0 ? spread(left, d, list.test) : 0
        left -= c
        days.push({ day: d, count: c, kind: c ? 'new' : 'review' })
      }
    }
  }
  return { newToday, due, testIn, days, total: n, studied: n - fresh.length }
}

export const newListId = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
