import { addDays, dayKey } from './questions.js'

// Wiederholen mit Lernkarteikasten (Leitner): jede Karteikarte liegt in einem Fach.
// Gewusst → ein Fach weiter (längere Pause), nicht gewusst → zurück ins erste Fach (morgen wieder).
// Fach → Tage bis zur nächsten Wiederholung
export const INTERVALS = [0, 1, 3, 7, 16, 35]
const MAX = INTERVALS.length - 1

export function nextEntry(entry, known, today = dayKey()) {
  if (!known) return { box: 1, due: addDays(today, 1) }
  const box = entry ? Math.min(entry.box + 1, MAX) : 2
  return { box, due: addDays(today, INTERVALS[box]) }
}

// Eine Karte gilt als "sitzt", sobald sie mindestens im zweiten Fach liegt.
export const isKnown = (entry) => Boolean(entry && entry.box >= 2)

export function dueIds(srs, today = dayKey()) {
  return Object.entries(srs)
    .filter(([, e]) => e.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box)
    .map(([id]) => id)
}

// Wie viele Karten an einem bestimmten Tag fällig sind (für den Lernplan)
export function dueOn(srs, day) {
  return Object.values(srs).filter((e) => e.due === day).length
}
