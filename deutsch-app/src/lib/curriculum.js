// Units, lessons, phases, pacing and session building.
import { GENERATORS, rng } from '../generators/index.js'
import { shuffle } from './check.js'
import { today, addDays, daysBetween, fromKey, toKey, weekKey } from './dates.js'

const files = import.meta.glob('../../data/units/*.json', { eager: true, import: 'default' })

export const CAT_NAMES = { G: 'Grammatik', R: 'Rechtschreibung', A: 'Ausdruck', B: 'Beistrich', S: 'Satzbau', T: 'Textsorte' }
export function catOf(skill = '') {
  if (/^komma/.test(skill)) return 'B'
  if (/^(rs|genus\.internet)/.test(skill)) return 'R'
  if (/^(wortstellung|ns\.|konnektor|satzbau|inf\.zu)/.test(skill)) return 'S'
  if (/^(kollok|ausdruck|redemittel|stil|fvg|wort)/.test(skill)) return 'A'
  if (/^textsorte/.test(skill)) return 'T'
  if (/^mine\.([GRABS])/.test(skill)) return skill.slice(5, 6)
  return 'G'
}

const firstSentences = (t = '', n = 2) => t.split(/(?<=[.!?])\s+/).slice(0, n).join(' ')

export const UNITS = Object.values(files)
  .sort((a, b) => a.n - b.n)
  .map((u) => ({
    ...u,
    lessons: u.lessons.map((l) => ({
      ...l,
      unit: u.id,
      items: l.items.map((it, i) => {
        const s = it.s || l.s || u.id
        const r = it.r || l.r || firstSentences(u.tips.de)
        const re = it.re || l.re || firstSentences(u.tips.en)
        return { ...it, id: `${l.id}.${i}`, s, c: it.c || catOf(s), r, re }
      }),
    })),
  }))

export const LESSONS = UNITS.flatMap((u) => u.lessons)
export const lessonById = (id) => LESSONS.find((l) => l.id === id)
export const unitById = (id) => UNITS.find((u) => u.id === id)
// Units tied to Greta's 9 weak areas: never suggested for skipping after the placement test
export const PROTECTED = ['u02', 'u03', 'u04', 'u06', 'u07', 'u11', 'u13', 'u16', 'u17', 'u18', 'u24', 'u25']

// ---------- Phases ----------
export function phases(setup) {
  const exam = setup.examDate
  const start = setup.startDate || today()
  const p3 = addDays(exam, -28)
  const review = addDays(exam, -5)
  const y = fromKey(exam).getFullYear()
  let p2 = toKey(new Date(fromKey(exam).getMonth() >= 1 ? y : y - 1, 1, 1))
  if (!(p2 > start && daysBetween(p2, p3) >= 14)) {
    p2 = addDays(start, Math.max(1, Math.round(daysBetween(start, p3) * 0.55)))
  }
  return { start, p2, p3, review, exam }
}
export function phaseOf(setup, d = today()) {
  const p = phases(setup)
  if (d >= p.exam) return { n: 4, name: 'C1-Pfad', sub: 'nach der Schularbeit', from: p.exam, to: p.exam }
  if (d >= p.review) return { n: 3, name: 'Prüfungsmodus', sub: 'Nur Wiederholung', from: p.p3, to: p.exam, reviewOnly: true }
  if (d >= p.p3) return { n: 3, name: 'Prüfungsmodus', from: p.p3, to: p.exam }
  if (d >= p.p2) return { n: 2, name: 'Textsorten', from: p.p2, to: p.p3 }
  return { n: 1, name: 'Fundament', from: p.start, to: p.p2 }
}
export const unitsOfPhase = (n) => UNITS.filter((u) => u.phase === n)

export function lessonDone(state, lessonId) {
  const l = state.lessons[lessonId]
  if (l?.done) return true
  const unit = lessonById(lessonId)?.unit
  return !!(unit && state.units[unit]?.passed)
}
export function unitDone(state, u) {
  return state.units[u.id]?.passed || u.lessons.every((l) => state.lessons[l.id]?.done)
}

// Path order: all units in order. The next lesson = first lesson not done.
export function nextLesson(state) {
  for (const u of UNITS) {
    if (state.units[u.id]?.passed) continue
    for (const l of u.lessons) if (!state.lessons[l.id]?.done) return l
  }
  return null
}

// Pacing for the current phase: how many lessons per day keep you on schedule
export function pacing(state, d = today()) {
  const ph = phaseOf(state.setup, d)
  if (ph.n >= 3) return { ph, perDay: 0, remaining: 0, behind: false }
  const units = unitsOfPhase(ph.n)
  const all = units.flatMap((u) => u.lessons)
  const remaining = all.filter((l) => !lessonDone(state, l.id)).length
  const daysLeft = Math.max(1, daysBetween(d, ph.to))
  const totalDays = Math.max(1, daysBetween(ph.from, ph.to))
  const elapsed = Math.max(0, daysBetween(ph.from, d))
  const expectedDone = Math.floor((all.length * elapsed) / totalDays)
  const done = all.length - remaining
  const behind = done < expectedDone - 1
  let perDay = Math.ceil(remaining / daysLeft)
  if (behind) perDay += 1
  return { ph, perDay: Math.max(remaining ? 1 : 0, perDay), remaining, total: all.length, done, daysLeft, behind, expectedDone }
}

export const TEXTSORTEN_ROTATION = ['leserbrief', 'eroerterung', 'kommentar', 'meinungsrede', 'offenerbrief', 'empfehlung', 'zusammenfassung', 'textanalyse']
export function weeklyTextsorte(setup, d = today()) {
  const p = phases(setup)
  const weeks = Math.max(0, Math.floor(daysBetween(weekKey(p.p2), weekKey(d)) / 7))
  return TEXTSORTEN_ROTATION[weeks % TEXTSORTEN_ROTATION.length]
}

// ---------- Session building ----------
const TAP = ['mc', 'order', 'match', 'komma']
const TYPE = ['gap', 'fix', 'tf', 'tr', 'listen', 'mine']

// Adapt an item to the level: 1 = tap, 2 = type answers, 3 = full sentences, no hints
export function adapt(it, level) {
  let x = { ...it }
  if (x.t === 'gap' && typeof x.q === 'string' && x.q.startsWith('___') && typeof x.a === 'string' && /^[a-zäöü]/.test(x.a) && x.capFirst) {
    x.a = x.a.charAt(0).toUpperCase() + x.a.slice(1)
  }
  if (x.t === 'mc' && x.capFirst) {
    x.o = x.o.map((o) => o.charAt(0).toUpperCase() + o.slice(1))
    x.a = x.a.charAt(0).toUpperCase() + x.a.slice(1)
  }
  if (x.t === 'mc' && level >= 2 && x.q.includes('___') && !x.q.includes('→') && !x.keepOrder) {
    x = { ...x, t: 'gap', o: undefined }
  }
  if (x.t === 'gap') {
    const single = !Array.isArray(x.a)
    if (level === 1 && single && x.o) x = { ...x, display: 'choose' }
    if (level >= 3 && !x.q.includes('→') && x.q.includes('___')) {
      const parts = [].concat(x.a)
      let i = 0
      const full = x.q.replace(/___/g, () => parts[i++] ?? '')
      x = { ...x, t: 'tf', q: `Schreib den ganzen Satz:\n${x.q}${x.h ? '  ' + x.h : ''}`, a: full, acc: (x.acc || []).map((alt) => x.q.replace('___', alt)), h: undefined, y: undefined }
    }
  }
  if (level >= 3) x.h = x.t === 'tf' ? x.h : undefined
  return x
}

function fromGen(gen, n, rnd) {
  const names = Object.entries(gen || {}).flatMap(([k, w]) => Array(w).fill(k)).filter((k) => GENERATORS[k])
  const out = []
  for (let i = 0; i < n && names.length; i++) {
    const g = names[Math.floor(rnd() * names.length)]
    out.push(GENERATORS[g](rnd))
  }
  return out
}

function suitable(it, level) {
  if (level === 1) return TAP.includes(it.t) || (it.t === 'gap' && it.o && !Array.isArray(it.a)) || it.t === 'tr'
  if (level === 2) return true
  return it.t !== 'match'
}

export function buildLesson(lesson, { level = 1, n = 14, seen = {}, seed = Date.now() } = {}) {
  const rnd = rng(seed)
  const hand = lesson.items.filter((it) => suitable(it, level))
  // least-seen items first, so replaying a lesson shows new sentences
  const sorted = shuffle(hand, rnd).sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0))
  const genCount = lesson.gen ? Math.round(n * (hand.length >= 15 ? 0.35 : 0.55)) : 0
  const picked = sorted.slice(0, n - genCount)
  let gen = fromGen(lesson.gen, n - picked.length, rnd).filter((it) => suitable(it, level) || level === 1)
  if (level === 1) gen = gen.map((it) => (it.t === 'gap' && it.o && !Array.isArray(it.a) ? it : it.t === 'gap' && !it.o ? it : it))
  const items = shuffle([...picked, ...gen], rnd).slice(0, n)
  // level 1 starts with tap exercises
  if (level === 1) items.sort((a, b) => (TAP.includes(a.t) ? 0 : 1) - (TAP.includes(b.t) ? 0 : 1))
  return items.map((it) => adapt(it, level))
}

export function buildCheckpoint(unit, { n = 15, seed = Date.now() } = {}) {
  const rnd = rng(seed)
  const pool = unit.lessons.flatMap((l) => shuffle(l.items, rnd).slice(0, 3).concat(fromGen(l.gen, 1, rnd)))
  return shuffle(pool, rnd).slice(0, n).map((it) => adapt(it, 2))
}

// Endless practice for a unit
export function buildEndless(unit, { n = 15, seed = Date.now(), level = 2 } = {}) {
  const rnd = rng(seed)
  const hand = unit.lessons.flatMap((l) => l.items)
  const gens = Object.assign({}, ...unit.lessons.map((l) => l.gen || {}))
  const g = fromGen(gens, Math.ceil(n / 2), rnd)
  return shuffle([...shuffle(hand, rnd).slice(0, n - g.length), ...g], rnd).map((it) => adapt(it, level))
}

// Generators by skill prefix, for "weakest micro-skills" practice
const SKILL_GEN = [
  [/^verb\.futur2/, 'futurZwei'], [/^verb\.modalsubj/, 'modalSubjektiv'], [/^part\./, 'partizipAttribut'], [/^passiv\.ersatz/, 'passivErsatz'],
  [/^konj2\.alsob/, 'alsOb'], [/^prep\.c1/, 'prepC1'], [/^konnektor\.c1/, 'konnC1'],
  [/^adj/, 'adjEnding'], [/^plural\.datn/, 'pluralCase'], [/^plural/, 'pluralCase'], [/^art|^np/, 'nounPhraseCase'], [/^poss/, 'possessive'],
  [/^ndekl/, 'nDekl'], [/^komma/, 'commaItem'], [/^wortstellung\.v2/, 'v2Front'], [/^wortstellung/, 'dassClause'], [/^ns\./, 'conjClause'],
  [/^rel/, 'relative'], [/^vprep/, 'verbPrep'], [/^wechsel/, 'wechsel'], [/^genus/, 'genus'], [/^rs\.dasdass/, 'dasDass'],
  [/^perf/, 'perfect'], [/^verb/, 'present'], [/^konnektor/, 'adverbConnector'], [/^inf/, 'infZu'], [/^prep/, 'prepCase'], [/^komp/, 'comparison'],
]
export function genForSkill(skill) {
  return SKILL_GEN.find(([re]) => re.test(skill))?.[1]
}
export function weakestSkills(state, k = 3) {
  return Object.entries(state.skills)
    .filter(([, v]) => v.n >= 4)
    .map(([s, v]) => ({ s, acc: v.recent.length ? v.recent.reduce((a, b) => a + b, 0) / v.recent.length : v.c / v.n, n: v.n }))
    .sort((a, b) => a.acc - b.acc)
    .slice(0, k)
}

// Phase 3 "Wiederholung": everything mixed, weighted toward the weakest units
export function buildReviewUnit(state, { n = 15, seed = Date.now() } = {}) {
  const rnd = rng(seed)
  const weak = weakestSkills(state, 5).map((w) => genForSkill(w.s)).filter(Boolean)
  const all = LESSONS.filter((l) => state.lessons[l.id]?.done || state.units[l.unit]?.passed)
  const pool = (all.length ? all : LESSONS.slice(0, 20)).flatMap((l) => l.items)
  const out = shuffle(pool, rnd).slice(0, n - Math.min(6, weak.length * 2))
  for (const g of weak) out.push(GENERATORS[g](rnd), GENERATORS[g](rnd))
  return shuffle(out, rnd).slice(0, n).map((it) => adapt(it, 2))
}

export function allHandItems() {
  return LESSONS.flatMap((l) => l.items)
}

// ---------- CEFR levels ----------
export const LEVELS = ['A2', 'B1', 'B2', 'C1']
// Per level: how many lessons are done (or covered by a passed checkpoint) and how accurate they were
export function levelProgress(state) {
  const out = {}
  for (const lv of LEVELS) {
    const lessons = UNITS.filter((u) => u.level === lv).flatMap((u) => u.lessons)
    const done = lessons.filter((l) => lessonDone(state, l.id))
    const best = done.map((l) => state.lessons[l.id]?.best ?? (state.units[l.unit]?.checkpoint || 0.9))
    out[lv] = { total: lessons.length, done: done.length, acc: best.length ? best.reduce((a, b) => a + b, 0) / best.length : 0 }
  }
  return out
}
// The level you have "reached": all levels up to it at least 80 % done with ≥ 80 % accuracy
export function estimateLevel(state) {
  const p = levelProgress(state)
  let reached = null
  for (const lv of LEVELS) {
    if (p[lv].total && p[lv].done / p[lv].total >= 0.8 && p[lv].acc >= 0.8) reached = lv
    else break
  }
  const working = LEVELS[reached ? Math.min(LEVELS.indexOf(reached) + 1, LEVELS.length - 1) : 0]
  return { reached, working, progress: p }
}
