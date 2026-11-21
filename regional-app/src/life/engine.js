// Everyday maths: what's saved, how strong each skill is, and which questions a round asks.
// A round is stored as a seed and a list of skill ids, so the same questions come back after a reload.
import { OLY_PATH, PATH, SKILLS, SKILLS_BY_ID } from './skills'
import { T, pct, rng } from './format'

export const ROUND = 5 // questions in a skill round
export const MIX = 8 // questions in the everyday mix
export const OMIX = 10 // questions in the olympiad pocket set
export const SPRINT_SECONDS = 60
const HISTORY = 10

// skills: id → { h: '1101…' (last 10 answers, 1 = right), n: answers ever, last: calendar day, read: lesson opened }
// mix: the everyday mix, omix: the olympiad pocket set, run: the last skill round — each { id: 'mix' | skill id, ids: [skill id per question], seed, i,
//   res: [1|0…], startedAt, endedAt, done }. Two slots, so a lesson opened from a mix can be practised without losing the mix.
// streak: days in a row with a finished round, card session or sprint · mixDay / omixDay: the last day each mix was finished
// cards: toolbox id → { box, due } (rule flashcards) · cardsNew: { day, n } new cards met today
// ideas: bank id → { r: 0 missed · 1 partly · 2 had it, at: calendar day, n: times }
// best: best sprint score · log: calendar day → answers that day (last 60 days)
export const EMPTY_LIFE = { skills: {}, mix: null, omix: null, run: null, streak: { count: 0, lastDay: null }, mixDay: null, omixDay: null, best: 0, log: {}, cards: {}, cardsNew: { day: null, n: 0 }, ideas: {} }

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v)
const int = (v, min, max, fallback) => (Number.isFinite(Number(v)) ? Math.max(min, Math.min(max, Math.round(Number(v)))) : fallback)
const optInt = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)))
const ID = /^[a-z0-9-]{1,40}$/

function normalizeRun(r) {
  if (!(isObj(r) && ID.test(String(r.id)) && Array.isArray(r.ids) && r.ids.length && r.ids.length <= 20 && r.ids.every((x) => typeof x === 'string' && ID.test(x)))) return null
  const res = (Array.isArray(r.res) ? r.res : []).slice(0, r.ids.length).map((x) => (x ? 1 : 0))
  const run = { id: r.id, ids: r.ids, seed: int(r.seed, 0, 2 ** 31, 1), i: int(r.i, 0, r.ids.length, 0), res, startedAt: Number(r.startedAt) || Date.now(), endedAt: Number(r.endedAt) || null, done: r.done === true || res.length >= r.ids.length }
  if (run.i < res.length && !run.done) run.i = res.length
  return run
}

export function normalizeLife(raw) {
  const s = isObj(raw) ? raw : {}
  const skills = {}
  if (isObj(s.skills))
    Object.entries(s.skills).forEach(([id, e]) => {
      if (!ID.test(id) || !isObj(e)) return
      skills[id] = { h: typeof e.h === 'string' ? e.h.replace(/[^01]/g, '').slice(-HISTORY) : '', n: int(e.n, 0, 1e7, 0), last: optInt(e.last), read: e.read === true }
    })
  const st = isObj(s.streak) ? s.streak : {}
  const log = {}
  if (isObj(s.log)) Object.entries(s.log).forEach(([d, n]) => /^\d+$/.test(d) && (log[d] = int(n, 0, 1e6, 0)))
  const mix = normalizeRun(s.mix)
  const omix = normalizeRun(s.omix)
  const run = normalizeRun(s.run)
  const cards = {}
  if (isObj(s.cards)) Object.entries(s.cards).forEach(([id, c]) => ID.test(id) && isObj(c) && (cards[id] = { box: int(c.box, 0, 20, 0), due: optInt(c.due) ?? 0 }))
  const ideas = {}
  if (isObj(s.ideas)) Object.entries(s.ideas).forEach(([id, e]) => /^[A-Za-z0-9-]{1,40}$/.test(id) && isObj(e) && (ideas[id] = { r: int(e.r, 0, 2, 0), at: optInt(e.at), n: int(e.n, 1, 1e5, 1) }))
  const cn = isObj(s.cardsNew) ? s.cardsNew : {}
  return {
    skills,
    mix: mix?.id === 'mix' ? mix : null,
    omix: omix?.id === 'omix' ? omix : null,
    run: run && !MIXES[run.id] ? run : null,
    streak: { count: int(st.count, 0, 1e5, 0), lastDay: optInt(st.lastDay) },
    mixDay: optInt(s.mixDay),
    omixDay: optInt(s.omixDay),
    best: int(s.best, 0, 1e4, 0),
    log,
    cards,
    cardsNew: { day: optInt(cn.day), n: int(cn.n, 0, 1000, 0) },
    ideas,
  }
}

/* ---------- how well you know a skill ---------- */

export const strength = (e) => (e?.h ? [...e.h].filter((x) => x === '1').length / HISTORY : 0)
export const mastered = (e) => strength(e) >= 0.9
export const tried = (e) => (e?.n || 0) > 0
export const lifeStreak = (life, today) => (life.streak.lastDay != null && life.streak.lastDay >= today - 1 ? life.streak.count : 0)
export const nextSkill = (life, track = 'everyday') => (track === 'olympiad' ? OLY_PATH : PATH).map((id) => SKILLS_BY_ID[id]).find((s) => s && !tried(life.skills[s.id]))

// The two mixes: which skills they draw from and how long they are
export const MIXES = {
  omix: { track: 'olympiad', size: OMIX, path: OLY_PATH, day: 'omixDay' },
  mix: { track: 'everyday', size: MIX, path: PATH, day: 'mixDay' },
}

/* ---------- rounds ---------- */

const newSeed = () => (Math.floor(Math.random() * 2 ** 31) ^ Date.now()) >>> 1

// A mix: your weakest and longest-unseen skills come up most. With fewer than 3 skills tried, it fills up
// with the first skills of the path, so it works from day one. The olympiad set always has two
// true-or-false claims and one past-problem idea question in it.
export function pickMix(life, today, id = 'mix', seed = newSeed()) {
  const r = rng(seed)
  const M = MIXES[id]
  const fixed = id === 'omix' ? ['o-true-false', 'o-true-false', 'o-first-move'] : []
  const all = SKILLS.filter((s) => s.track === M.track && !fixed.includes(s.id))
  let pool = all.filter((s) => tried(life.skills[s.id]))
  if (pool.length < 3) pool = [...pool, ...M.path.map((x) => SKILLS_BY_ID[x]).filter((s) => s && all.includes(s) && !tried(life.skills[s.id])).slice(0, 4 - pool.length)]
  const weight = (s) => {
    const e = life.skills[s.id]
    const stale = e?.last != null ? Math.min(7, today - e.last) / 7 : 1
    return 0.25 + (1 - strength(e)) + stale
  }
  const ids = []
  const count = {}
  for (let k = 0; k < M.size - fixed.length; k++) {
    const options = pool.filter((s) => s.id !== ids[ids.length - 1] && (count[s.id] || 0) < 2)
    const list = options.length ? options : pool
    const total = list.reduce((a, s) => a + weight(s), 0)
    let x = r.next() * total
    let pick = list[list.length - 1]
    for (const s of list) {
      x -= weight(s)
      if (x <= 0) {
        pick = s
        break
      }
    }
    ids.push(pick.id)
    count[pick.id] = (count[pick.id] || 0) + 1
  }
  // The fixed questions go at even spots, so the set alternates computing and judging
  fixed.forEach((f, i) => ids.splice(Math.min(ids.length, 2 + i * 3), 0, f))
  return { id, ids, seed, i: 0, res: [], startedAt: Date.now(), done: false }
}

export const newRound = (id) => ({ id, ids: Array(ROUND).fill(id), seed: newSeed(), i: 0, res: [], startedAt: Date.now(), done: false })

// Question k of a round, the same every time it's asked
export function questionAt(run, k) {
  const skill = SKILLS_BY_ID[run.ids[k]]
  if (!skill) return null
  return { skill, ...skill.gen(rng((run.seed + (k + 1) * 7919) >>> 0)) }
}

export const slotOf = (id) => (MIXES[id] ? id : 'run')
export const runFor = (life, id) => (life[slotOf(id)]?.id === id ? life[slotOf(id)] : null)

// One answer in the round for id: the skill's history, today's count
export function recordAnswer(life, id, skillId, ok, today) {
  const e = life.skills[skillId] || { h: '', n: 0, last: null, read: false }
  const log = { ...life.log, [today]: (life.log[today] || 0) + 1 }
  Object.keys(log).forEach((d) => Number(d) < today - 60 && delete log[d])
  const slot = slotOf(id)
  const r = runFor(life, id)
  const run = r && !r.done ? { ...r, res: [...r.res, ok ? 1 : 0] } : life[slot]
  return { ...life, [slot]: run, log, skills: { ...life.skills, [skillId]: { ...e, h: (e.h + (ok ? '1' : '0')).slice(-HISTORY), n: e.n + 1, last: today } } }
}

// Move a round on; the last question finishes it (and the day's streak)
export function advance(life, id, today) {
  const slot = slotOf(id)
  const r = runFor(life, id)
  if (!r || r.done || r.res.length <= r.i) return life
  const i = r.i + 1
  if (i < r.ids.length) return { ...life, [slot]: { ...r, i } }
  const days = MIXES[id] ? { [MIXES[id].day]: today } : {}
  return bumpStreak({ ...life, [slot]: { ...r, i, done: true, endedAt: Date.now() }, ...days }, today)
}

export function bumpStreak(life, today) {
  const { count, lastDay } = life.streak
  if (lastDay === today) return life
  return { ...life, streak: { count: lastDay === today - 1 ? count + 1 : 1, lastDay: today } }
}

/* ---------- the 60-second sprint ---------- */

// Mental arithmetic that gets a little harder as you go: + − × ÷, halves, doubles and easy percentages
export function sprintQuestion(k, seed) {
  const r = rng((seed + k * 104729) >>> 0)
  const hard = k >= 8
  const kind = r.int(0, hard ? 6 : 4)
  switch (kind) {
    case 0: {
      const a = hard ? r.int(48, 389) : r.int(12, 89)
      const b = hard ? r.int(23, 199) : r.int(11, 69)
      return { q: `${a} + ${b}`, answer: a + b }
    }
    case 1: {
      const a = hard ? r.int(120, 500) : r.int(30, 99)
      const b = r.int(11, a - 5)
      return { q: `${a} − ${b}`, answer: a - b }
    }
    case 2: {
      const a = r.int(3, hard ? 12 : 9)
      const b = hard ? r.int(13, 49) : r.int(3, 12)
      return { q: `${a} × ${b}`, answer: a * b }
    }
    case 3: {
      const b = r.int(3, 9)
      const c = r.int(3, hard ? 25 : 12)
      return { q: `${b * c} ÷ ${b}`, answer: c }
    }
    case 4: {
      const p = r.pick([10, 50, 25, 20])
      const base = p === 25 ? 4 * r.int(3, 40) : 10 * r.int(2, 40)
      return { q: T(`${pct(p)} of ${base}`, `${pct(p)} von ${base}`), answer: (base * p) / 100 }
    }
    case 5: {
      const a = r.int(11, 99) * 2 + 1
      return { q: T(`Half of ${a}`, `Hälfte von ${a}`), answer: a / 2 }
    }
    default: {
      const a = r.int(13, 49)
      const b = r.pick([11, 15, 19, 21, 25, 99])
      return { q: `${a} × ${b}`, answer: a * b }
    }
  }
}

/* ---------- rule cards (the toolbox as flashcards) ---------- */

export const CARD_GAPS = [1, 2, 4, 8, 16, 32, 64] // days until a card comes back, by box
export const NEW_CARDS = 5 // new cards a day
export const CARD_SESSION = 12

// Today's cards: the due ones (oldest first), then new ones in the order the plan teaches them
export function cardQueue(life, tools, today) {
  const due = tools.filter((t) => life.cards[t.id] && life.cards[t.id].due <= today).sort((a, b) => life.cards[a.id].due - life.cards[b.id].due)
  const metToday = life.cardsNew.day === today ? life.cardsNew.n : 0
  const fresh = tools
    .filter((t) => !life.cards[t.id])
    .sort((a, b) => Math.min(999, ...(a.days || [])) - Math.min(999, ...(b.days || [])))
    .slice(0, Math.max(0, NEW_CARDS - metToday))
  return [...due, ...fresh].slice(0, CARD_SESSION)
}

export function rateCard(life, id, knew, today) {
  const old = life.cards[id]
  const box = knew ? (old ? old.box + 1 : 1) : 0
  const cardsNew = old ? life.cardsNew : { day: today, n: (life.cardsNew.day === today ? life.cardsNew.n : 0) + 1 }
  const log = { ...life.log, [today]: (life.log[today] || 0) + 1 }
  return { ...life, log, cardsNew, cards: { ...life.cards, [id]: { box, due: today + (knew ? CARD_GAPS[Math.min(box, CARD_GAPS.length - 1)] : 1) } } }
}

/* ---------- find the idea (past problems, no write-up) ---------- */

// Problems you've never looked at come first (easiest first), then the ones you missed, longest ago first
export function nextIdea(life, bank, skip) {
  const fresh = bank.filter((p) => !life.ideas[p.id] && p.id !== skip).sort((a, b) => (a.difficulty || 3) - (b.difficulty || 3) || b.year - a.year)
  if (fresh.length) return fresh[0]
  const weak = bank.filter((p) => life.ideas[p.id]?.r < 2 && p.id !== skip).sort((a, b) => life.ideas[a.id].r - life.ideas[b.id].r || (life.ideas[a.id].at ?? 0) - (life.ideas[b.id].at ?? 0))
  return weak[0] || bank.find((p) => p.id !== skip) || null
}

export function rateIdea(life, id, r, today) {
  const e = life.ideas[id]
  const log = { ...life.log, [today]: (life.log[today] || 0) + 1 }
  return { ...life, log, ideas: { ...life.ideas, [id]: { r, at: today, n: (e?.n || 0) + 1 } } }
}
