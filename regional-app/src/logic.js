// Rules of the plan: problems, tries and checks, warm-ups, mini-mocks
import { AREA_ORDER, PLAN } from './plan'
import { getDay } from './content'
import { dayOf } from './dates'

export const TRIES = 3 // per answer problem, and checks per proof, each day
export const PROOF_PASS = 5 // of 8
export const CHALLENGE_MASTER = 7 // of 8
export const PAPER_PASS = 0.5
export const PAPER_MASTER = 0.75
export const REVIEW_GAPS = [3, 10, 30, 60] // days until a solved problem comes back in a warm-up, after 0, 1, 2, 3+ good reviews
export const MINI_EVERY = 14 // a mini-mock after every 14 finished days
export const MINI_COUNT = 7 // up to day 98, then the real papers start
export const MINI_MINUTES = 60
export const BANK_GAPS = { low: 3, mid: 14 } // days until a past problem comes back: below 5 points, 5–7 points

export const FRESH = { tries: 0, solved: false, grades: [] }
export const bestScore = (entry) => Math.max(-1, ...(entry?.grades || []).map((g) => g.score))
// Proof checks used on one calendar day (grades from before a day stamp count on the entry's own day)
export const checksOn = (entry, day) => (entry?.grades || []).filter((g) => (g.day ?? entry.day) === day).length

export const refKey = (r) => `${r.index}:${r.k}`
export const mistakeKey = (m) => (m.bank ? `bank:${m.bank}` : refKey(m))

// A problem anywhere in the plan: { index, k } where k is a problem number or 'c' for the challenge
export function problemAt(ref) {
  const c = getDay(ref.index).content
  if (!c) return null
  return ref.k === 'c' ? c.challenge || null : c.problems[ref.k] || null
}

export function originalProblem(index, part) {
  return getDay(index).content.problems[Number(part.slice(1))]
}
export function currentProblem(index, part, entry) {
  const swap = entry.swaps?.[entry.swaps.length - 1]
  return (swap && problemAt(swap)) || originalProblem(index, part)
}

// When you run out of tries you get a new problem of the same kind (answer or proof),
// preferably from the same area and from a day you've already reached.
export function pickReplacement(index, part, entry) {
  const day = getDay(index)
  const type = originalProblem(index, part).type
  const used = new Set([`${index}:${part.slice(1)}`, ...(entry.swaps || []).map((s) => `${s.index}:${s.k}`)])
  const candidates = []
  PLAN.forEach((p) => {
    if (p.index === index || p.kind !== 'learn') return
    const content = getDay(p.index).content
    if (!content) return
    content.problems.forEach((q, k) => {
      if (q.type !== type || used.has(`${p.index}:${k}`)) return
      const rank = (p.area === day.area ? 0 : 2) + (p.index < index ? 0 : 1)
      candidates.push({ index: p.index, k, rank, dist: Math.abs(p.index - index) })
    })
  })
  candidates.sort((a, b) => a.rank - b.rank || a.dist - b.dist)
  return candidates[0] ? { index: candidates[0].index, k: candidates[0].k } : null
}

export function partStatus(problem, entry, today = dayOf(Date.now())) {
  if (!problem) return 'open'
  if (problem.type === 'answer') return entry.solved ? 'ok' : entry.tries >= TRIES ? 'failed' : 'open'
  return bestScore(entry) >= PROOF_PASS ? 'ok' : checksOn(entry, today) >= TRIES ? 'failed' : 'open'
}

// After a day is passed its quick problems join the warm-up rotation. Problems you ran out of tries on come back tomorrow.
export function addDayToSrs(srs, index, work, day) {
  const d = getDay(index)
  if (d.kind !== 'learn' || !d.content) return
  d.content.problems.forEach((_, i) => {
    const chain = [{ index, k: i }, ...(work[`${index}:p${i}`]?.swaps || [])]
    chain.forEach((ref, j) => {
      if (problemAt(ref)?.type !== 'answer') return
      const last = j === chain.length - 1
      if (!last || !srs[refKey(ref)]) srs[refKey(ref)] = { box: 0, due: day + (last ? REVIEW_GAPS[0] : 1) }
    })
  })
}

export function pickMini(state) {
  const used = new Set(Object.values(state.minis || {}).flatMap((m) => m.refs.map(refKey)))
  return AREA_ORDER.map((a) => {
    const days = PLAN.filter((p) => p.kind === 'learn' && p.area === a && state.results[p.index] && getDay(p.index).content?.challenge?.keySteps && !used.has(`${p.index}:c`))
    if (!days.length) return null
    const open = days.filter((p) => state.results[p.index].status !== 'mastered')
    const pool = open.length ? open : days
    return { index: pool[Math.floor(Math.random() * pool.length)].index, k: 'c' }
  }).filter(Boolean)
}

export const miniFinished = (m) => !!m && m.refs.length > 0 && m.refs.every((_, i) => m.work?.[i]?.grades?.length)
export const miniEnd = (m) => m.startedAt + MINI_MINUTES * 6e4

// The newest mini-mock you have unlocked and not finished. Older unfinished ones are skipped, not stacked.
export function miniDue(state) {
  const unlocked = Math.min(MINI_COUNT, Math.floor(Object.keys(state.results).length / MINI_EVERY))
  for (let n = unlocked; n >= 1; n--) {
    const m = state.minis?.[n]
    if (m && !miniFinished(m)) return n // one in progress always wins
  }
  if (unlocked < 1) return null
  return state.minis?.[unlocked] ? null : unlocked
}
