// Your year: what you did on each calendar day, per language you learn.
// state.history[day] = { s: streak that day, t: [{ k, lang, from, n, p, w }] }
//   k = 'c' (the 10 words of a day; n = that day's index), 'l' (own list; n = list name), 'r' (review)
//   p = 1 passed / 0 not passed (null for reviews), w = [[front, answer, 1 right | 0 wrong], ...]
// Days from before the history existed are filled in from spaced repetition (the day each word was last tested).

const KEEP_DAYS = 800

export function record(history = {}, day, entry, streak) {
  const h = { ...history }
  const prev = h[day] || { s: 0, t: [] }
  const same = (e) => e.k === entry.k && e.lang === entry.lang && e.n === entry.n
  let t
  if (entry.k === 'r') t = [...prev.t, entry].slice(-6)
  else {
    const old = prev.t.find(same)
    t = [...prev.t.filter((e) => !same(e)), old?.p ? { ...entry, p: 1, w: entry.p ? entry.w : old.w } : entry]
  }
  h[day] = { s: Math.max(prev.s || 0, streak || 0), t }
  for (const k of Object.keys(h)) if (Number(k) < day - KEEP_DAYS) delete h[k]
  return h
}

/**
 * yearOf(state, lang, today) → {
 *   start, end (the 366-day window that contains today), days: Map(day → { done, s, tests }),
 *   doneCount, longest
 * }
 */
export function yearOf(state, lang, today) {
  const days = new Map()
  for (const [d, h] of Object.entries(state.history || {})) {
    const tests = (h.t || []).filter((e) => e.lang === lang)
    if (tests.length) days.set(Number(d), { done: tests.some((e) => e.p === 1), s: h.s || 0, tests })
  }
  // Before the history: words graded on a day tell that a test happened, and how it went
  const byDay = {}
  for (const [key, e] of Object.entries(state.srs?.[lang] || {})) {
    const g = e[2]
    if (g == null || days.has(g)) continue
    ;(byDay[g] ||= []).push([key, e[0] >= 2 ? 1 : 0])
  }
  for (const [d, keys] of Object.entries(byDay)) {
    const right = keys.filter((k) => k[1]).length
    days.set(Number(d), { done: right >= Math.ceil(keys.length * 0.8), s: 0, tests: [{ k: 'c', lang, from: state.from, keys }] })
  }
  const passed = state.course?.[lang]?.passed
  if (passed != null && !days.has(passed)) days.set(passed, { done: true, s: 0, tests: [] })

  // Streak colour for days without a recorded streak: their place in the run of done days
  const sorted = [...days.keys()].sort((a, b) => a - b)
  let run = 0
  let longest = 0
  let prev = null
  for (const d of sorted) {
    const v = days.get(d)
    if (!v.done) {
      prev = d
      run = 0
      continue
    }
    run = prev === d - 1 && run > 0 ? run + 1 : 1
    longest = Math.max(longest, run)
    if (!v.s) v.s = run
    prev = d
  }

  const first = sorted.length ? Math.min(sorted[0], today) : today
  const year = Math.floor((today - first) / 366)
  const start = first + year * 366
  const end = start + 365
  let doneCount = 0
  for (const [d, v] of days) if (v.done && d >= start && d <= end) doneCount++
  return { start, end, days, doneCount, longest }
}
