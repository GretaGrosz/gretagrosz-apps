// All progress lives in localStorage (key 'deutsch-lockin.v1'), plus JSON export/import.
import { useSyncExternalStore } from 'react'
import { today, weekKey, addDays, daysBetween } from './dates.js'

const KEY = 'deutsch-lockin.v1'
export const DEFAULTS = {
  version: 1,
  setup: { done: false, examDate: '2027-05-15', minutes: 30, showEn: true, dailyGoal: 50, dailyTarget: 100, startDate: null, sound: true },
  placement: { done: false, scores: {}, suggested: [] },
  lessons: {}, // lessonId: { done, best, gold, level, plays, last }
  units: {}, // unitId: { checkpoint, passed, skipped }
  xp: { total: 0, byDay: {} },
  answers: {}, // day: { n, c }
  cats: {}, // day: { G: [n, c], ... }
  skills: {}, // skill: { n, c, last, recent: [0/1 …] }
  streak: { count: 0, last: null, best: 0, freezeWeek: null, frozen: [] },
  hearts: { day: null, n: 5 },
  cards: {}, // id: { item, box, due, rightDays: [], wrongs, seen, mastered, src }
  mine: [], // own mistakes added after a correction: { id, wrong, correct, category, rule, ruleEn, note, added }
  mineState: {}, // id -> card id link not needed; seed cards created lazily
  sprints: {}, // name: best
  texts: [], // { id, date, kind, angabeId, title, text, words, minutes, checks }
  writing: {}, // weekKey: count of full texts
  proof: { n: 0, found: 0, missed: 0, wrongTaps: 0 },
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(DEFAULTS)
    return merge(structuredClone(DEFAULTS), JSON.parse(raw))
  } catch {
    return structuredClone(DEFAULTS)
  }
}
function merge(base, data) {
  for (const k in data) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && data[k] && typeof data[k] === 'object' && !Array.isArray(data[k])) base[k] = { ...base[k], ...data[k] }
    else base[k] = data[k]
  }
  return base
}

let state = load()
const listeners = new Set()
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
}
export function getState() { return state }
export function update(fn) {
  const next = structuredClone(state)
  fn(next)
  state = next
  persist()
  listeners.forEach((l) => l())
}
export function useStore(select = (s) => s) {
  return select(useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => state))
}
export function exportJSON() {
  return JSON.stringify({ app: 'deutsch-lockin', exported: new Date().toISOString(), state }, null, 1)
}
export function importJSON(text) {
  const data = JSON.parse(text)
  const s = data.state || data
  if (!s || typeof s !== 'object' || !s.setup) throw new Error('Keine gültige Sicherung')
  state = merge(structuredClone(DEFAULTS), s)
  persist()
  listeners.forEach((l) => l())
}
export function resetAll() {
  state = structuredClone(DEFAULTS)
  persist()
  listeners.forEach((l) => l())
}

// ---------- hearts ----------
export function hearts(s = state) {
  return s.hearts.day === today() ? s.hearts.n : 5
}
export function loseHeart() {
  update((s) => { const n = hearts(s); s.hearts = { day: today(), n: Math.max(0, n - 1) } })
}
export function refillHearts() {
  update((s) => { s.hearts = { day: today(), n: 5 } })
}

// ---------- XP, answers, streak ----------
export function addXP(n) {
  update((s) => {
    const d = today()
    s.xp.total += n
    s.xp.byDay[d] = (s.xp.byDay[d] || 0) + n
  })
}
export function recordAnswer({ ok, half, skill, cat }) {
  update((s) => {
    const d = today()
    const a = (s.answers[d] ||= { n: 0, c: 0 })
    a.n++
    if (ok) a.c += half ? 0.5 : 1
    if (cat) {
      const c = ((s.cats[d] ||= {})[cat] ||= [0, 0])
      c[0]++
      if (ok) c[1] += half ? 0.5 : 1
    }
    if (skill) {
      const k = (s.skills[skill] ||= { n: 0, c: 0, recent: [] })
      k.n++
      if (ok) k.c += half ? 0.5 : 1
      k.recent = [...k.recent, ok ? (half ? 0.5 : 1) : 0].slice(-20)
      k.last = d
    }
  })
}
// Called when a lesson/practice session is finished: keeps the streak alive
export function touchStreak() {
  update((s) => {
    const d = today()
    const st = s.streak
    if (st.last === d) return
    if (st.last) {
      const gap = daysBetween(st.last, d)
      if (gap === 1) st.count++
      else if (gap === 2 && st.freezeWeek !== weekKey(d)) {
        // one missed day: the weekly streak freeze saves the streak
        st.freezeWeek = weekKey(d)
        st.frozen = [...(st.frozen || []), addDays(d, -1)].slice(-20)
        st.count++
      } else st.count = 1
    } else st.count = 1
    st.last = d
    st.best = Math.max(st.best || 0, st.count)
  })
}
export function currentStreak(s = state) {
  const st = s.streak
  if (!st.last) return 0
  const gap = daysBetween(st.last, today())
  if (gap <= 1) return st.count
  if (gap === 2 && st.freezeWeek !== weekKey(today())) return st.count // can still be saved today
  return 0
}
export const freezeAvailable = (s = state) => s.streak.freezeWeek !== weekKey(today())
