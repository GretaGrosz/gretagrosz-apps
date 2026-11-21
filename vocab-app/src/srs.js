// Spaced repetition with Leitner boxes. Every word you have been tested on has an entry [box, due, lastGraded]:
// box 1–6, due = the day it should come back, lastGraded = the day it was last marked.
// Right → one box up, back after 3, 7, 16, 35 or 90 days. Wrong → box 1, back tomorrow.
// A word is "known" from box 3 on: you have recalled it at least once after a real gap of days.

export const GAPS = [0, 1, 3, 7, 16, 35, 90] // index = box
export const KNOWN_BOX = 3

// Mark one answer. `cap` (optional) = the latest day it may come back (a list's last day before its test).
export function grade(entry, correct, today, cap = null) {
  const [box = 0, , last = null] = entry || []
  // Retaking a test on the same day doesn't climb the boxes twice
  if (correct && last === today && entry) return entry
  const next = correct ? Math.min(Math.max(box, 1) + 1, GAPS.length - 1) : 1
  let due = today + GAPS[next]
  if (cap != null) due = Math.max(today + 1, Math.min(due, cap))
  return [next, due, today]
}

export function gradeAll(map, results, today, cap = null) {
  const out = { ...map }
  for (const r of results) out[r.key] = grade(out[r.key], r.correct, today, cap)
  return out
}

// Keys due today or earlier, the longest overdue and the weakest first
export function dueKeys(map, today) {
  return Object.entries(map || {})
    .filter(([, e]) => e[1] <= today)
    .sort((a, b) => a[1][1] - b[1][1] || a[1][0] - b[1][0])
    .map(([key]) => key)
}

export const knownCount = (map) => Object.values(map || {}).filter((e) => e[0] >= KNOWN_BOX).length
export const stateOf = (entry) => (!entry ? 'new' : entry[0] >= KNOWN_BOX ? 'known' : 'learning')
