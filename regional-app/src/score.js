// One number per area, in expected points out of 8, and the sum out of 32: "if the competition were today".
// Only competition-level work counts: past GWF problems (first tries), mocks, plan papers, mini-mocks and
// lesson challenges. Easy lesson problems and ticked lessons don't, so the number can't be farmed.
import { AREA_ORDER, PLAN, TOTAL_DAYS } from './plan'
import { getDay } from './content'
import { BANK, BANK_BY_ID, mockFinished, mockScores } from './data'
import { DAY, dayOfIso } from './dates'
import { bestScore } from './logic'

const RECENT = 8 // the last 8 results per area count

export function areaSamples(state) {
  const out = Object.fromEntries(AREA_ORDER.map((a) => [a, []]))
  const add = (area, v, w, at) => out[area] && out[area].push({ v: Math.max(0, Math.min(1, v)), w, at: at || 0 })
  const mockIds = new Set()
  ;(state.mocks || []).filter(mockFinished).forEach((m) => {
    mockScores(m).forEach((s, i) => {
      const p = BANK_BY_ID[m.ids[i]]
      if (p && s >= 0) add(p.area, s / 8, 2, m.handedAt || m.startedAt)
    })
    m.ids.forEach((id) => mockIds.add(`${m.id}:${id}`))
  })
  // Past problems: your first try only, not the third go after reading the solution. Hints halve the weight.
  Object.entries(state.bank || {}).forEach(([id, e]) => {
    const p = BANK_BY_ID[id]
    const first = e.attempts?.[0]
    if (!p || !first || (first.mock != null && mockIds.has(`${first.mock}:${id}`))) return
    add(p.area, first.score / 8, first.hints ? 0.5 : 1, first.at)
  })
  PLAN.filter((d) => d.kind === 'paper' && state.results[d.index]).forEach((d) => {
    ;[0, 1, 2, 3].forEach((i) => {
      const s = bestScore(state.work[`${d.index}:p${i}`])
      if (s < 0) return
      const area = (d.paper[0] === 'GWF' && BANK.find((p) => p.year === d.paper[1] && p.n === i + 1)?.area) || AREA_ORDER[i]
      add(area, s / 8, d.paper[0] === 'GWF' ? 2 : 1.5, state.results[d.index].day * DAY)
    })
  })
  Object.values(state.minis || {}).forEach((m) =>
    m.refs.forEach((ref, i) => {
      const s = bestScore(m.work?.[i])
      if (s >= 0) add(getDay(ref.index).area, s / 8, 1.5, m.startedAt)
    }),
  )
  Object.entries(state.work || {}).forEach(([key, w]) => {
    const m = key.match(/^(\d+):c$/)
    if (!m || !w.grades?.length) return
    const d = getDay(Number(m[1]))
    if (d.kind === 'learn') add(d.area, w.grades[0].score / 8, 0.5, (w.grades[0].day ?? w.day ?? 0) * DAY)
  })
  return out
}

// { A: { points: 5.3, n: 4 } | null, … }, total (null until every area has a result), weakest area
export function prediction(state) {
  const samples = areaSamples(state)
  const areas = {}
  AREA_ORDER.forEach((a) => {
    const recent = samples[a].sort((x, y) => x.at - y.at).slice(-RECENT)
    const w = recent.reduce((s, x) => s + x.w, 0)
    areas[a] = recent.length ? { points: (8 * recent.reduce((s, x) => s + x.v * x.w, 0)) / w, n: recent.length } : null
  })
  const all = AREA_ORDER.every((a) => areas[a])
  const total = all ? AREA_ORDER.reduce((s, a) => s + areas[a].points, 0) : null
  // Weakest first: an area with no result yet, then the lowest points
  const weakest = AREA_ORDER.slice().sort((x, y) => (areas[x]?.points ?? -1) - (areas[y]?.points ?? -1))[0]
  return { areas, total, weakest }
}

// Plan days left vs calendar days left before the competition
export function pace(state, today) {
  const examDay = dayOfIso(state.examDate)
  if (examDay == null) return null
  const done = Object.keys(state.results).length
  const remaining = TOTAL_DAYS - done
  const daysLeft = examDay - today // competition day itself is not a training day
  if (daysLeft < 0) return { kind: 'past' }
  if (remaining <= 0) return { kind: 'done', daysLeft }
  const spare = daysLeft - remaining
  return spare >= 0 ? { kind: 'ok', spare, daysLeft } : { kind: 'behind', n: -spare, daysLeft, perDay: Math.ceil(remaining / Math.max(1, daysLeft)) }
}
