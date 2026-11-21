import { AREA_ORDER } from './plan'

// Past GWF problems and the toolbox are their own chunks. The bank loads with the lessons at start-up;
// the toolbox follows right after first paint. These are live bindings: read them inside functions.
export let BANK = []
export let BANK_BY_ID = {}
export let YEARS = []
export let FULL_YEARS = [] // years with all four problems, for a full mock paper
export let TECHNIQUES = []
export let TOOLS = []
export let EXAM = []
export let TOOLS_BY_ID = {}

let bankReady = null
export function loadBank() {
  bankReady ||= import('./bank/gwf.js').then((mod) => {
    const raw = mod.default || []
    BANK = (Array.isArray(raw) ? raw : Object.values(raw))
      .filter((p) => p && p.id && AREA_ORDER.includes(p.area))
      .map((p) => ({
        ...p,
        year: Number(p.year),
        n: Number(p.n),
        techniques: p.techniques || [],
        hints: [].concat(p.hints || []),
        rubric: (p.rubric || []).map((r) => (Array.isArray(r) ? [r[0], Number(r[1]) || 0] : [r.step || r.text || '', Number(r.points) || 0])),
        pitfalls: [].concat(p.pitfalls || []),
      }))
      .sort((a, b) => b.year - a.year || a.n - b.n)
    BANK_BY_ID = Object.fromEntries(BANK.map((p) => [p.id, p]))
    YEARS = [...new Set(BANK.map((p) => p.year))].sort((a, b) => b - a)
    FULL_YEARS = YEARS.filter((y) => AREA_ORDER.every((_, i) => BANK.some((p) => p.year === y && p.n === i + 1)))
    const count = {}
    BANK.forEach((p) => p.techniques.forEach((t) => (count[t] = (count[t] || 0) + 1)))
    TECHNIQUES = Object.keys(count).sort((a, b) => a.localeCompare(b))
  })
  return bankReady
}

let toolsReady = null
export function loadTools() {
  toolsReady ||= import('./reference.js').then((ref) => {
    TOOLS = (ref.TOOLS || []).filter((t) => t && t.id)
    EXAM = (ref.EXAM || []).filter((e) => e && e.id)
    TOOLS_BY_ID = Object.fromEntries(TOOLS.map((t) => [t.id, t]))
  })
  return toolsReady
}
export const toolsLoaded = () => TOOLS.length > 0

export const paperOf = (year) => BANK.filter((p) => p.year === year).sort((a, b) => a.n - b.n)

export const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '')

export const bankTitle = (p) => `${p.comp || 'GWF'} ${p.year} · ${p.n}`
export const bankArea = (p) => ({ kind: 'learn', area: p.area }) // for AreaBadge and areaColor

// A tool matches a problem when its id, a tag or its name is one of the problem's techniques.
// Some techniques are worded differently from the toolbox, so they point to a tool id here.
const ALIASES = {
  gcd: 'gcd-euclid',
  euclideanalgorithm: 'gcd-euclid',
  hmam: 'mean-chain',
  qmam: 'mean-chain',
  reflection: 'auxiliary-lines',
  divisorcounting: 'divisor-functions',
  construction: 'bound-construction',
  incenterexcenterlemma: 'incenter-excenter',
  squaresbetweensquares: 'between-squares',
  orthocenter: 'orthocentre',
  fermatlittletheorem: 'fermat',
  bijection: 'bijections',
  counting: 'sum-product-rule',
}
const techKeys = (x) => [norm(x), ALIASES[norm(x)] && norm(ALIASES[norm(x)])].filter(Boolean)
const toolKeys = (t) => new Set([t.id, ...(t.tags || []), t.name, t.nameDe].filter(Boolean).map(norm))
export const bankForTool = (t) => {
  const keys = toolKeys(t)
  return BANK.filter((p) => p.techniques.some((x) => techKeys(x).some((k) => keys.has(k))))
}
// Best matches first: a technique naming the tool itself beats a shared tag
export const toolsForProblem = (p, max = 5) => {
  const tech = new Set(p.techniques.flatMap(techKeys))
  const score = (t) => (tech.has(norm(t.id)) || tech.has(norm(t.name)) || tech.has(norm(t.nameDe)) ? 2 : 0) + (t.tags || []).filter((x) => tech.has(norm(x))).length
  return TOOLS.map((t) => [t, score(t)])
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1] || (a[0].area === p.area ? -1 : 1))
    .slice(0, max)
    .map(([t]) => t)
}

// What the AI coach sees: the German statement, the translation, the marking scheme and the solution
export const aiProblem = (p) => ({
  q: [p.qDe, p.q && p.qDe ? `English translation:\n${p.q}` : p.q].filter(Boolean).join('\n\n'),
  answers: p.answer ? [p.answer] : undefined,
  rubric: p.rubric.length ? p.rubric : undefined,
  solution: p.solution,
  pitfalls: p.pitfalls,
})

// Your results on a bank problem: new, tried, solved (5+ of 8) or full (8 of 8)
export const bankBest = (entry) => Math.max(-1, ...(entry?.attempts || []).map((a) => a.score))
export function bankStatus(entry) {
  const best = bankBest(entry)
  return best < 0 ? 'new' : best >= 8 ? 'full' : best >= 5 ? 'solved' : 'tried'
}
export const BANK_STATUS = {
  new: { label: 'New' },
  tried: { label: 'Tried', color: 'var(--orange)' },
  solved: { label: 'Solved', color: 'var(--green)' },
  full: { label: '8/8', color: 'var(--purple)' },
}

// A mock is finished when every problem has been marked
export const mockScores = (m) => m.ids.map((_, i) => Math.max(-1, ...(m.work?.[i]?.grades || []).map((g) => g.score)))
export const mockFinished = (m) => mockScores(m).every((x) => x >= 0)
export const mockTotal = (m) => mockScores(m).reduce((a, b) => a + Math.max(0, b), 0)
