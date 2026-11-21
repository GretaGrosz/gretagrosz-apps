// Saved progress: one localStorage key, validated on every load and every import so a bad file or an old
// version can never put the app into a state it can't render. Before anything replaces the progress
// (an imported backup, a reset), the current state is kept in PREV_KEY so it can be brought back.
import { TOTAL_DAYS } from './plan'
import { dayOf, dayOfIso, isoOfDay } from './dates'
import { EMPTY_LIFE, normalizeLife } from './life/engine'

export const KEY = 'regional-150'
export const PREV_KEY = 'regional-150-prev'
export const VERSION = 1

// results: plan index → { day: calendar day, status, score }
// work: `${index}:${part}` → { day, tries, solved, grades, startedAt, swaps, mistake }
//   grades: [{ score, source, day, … }] — day is when it was marked; checks per day count today's grades only
// srs: `${index}:${k}` → { box, due } (when a solved problem comes back as a warm-up)
// reviews: calendar day → today's warm-up { index, k, tries, solved, grades, mistake } or null
// mistakes: [{ index, k, reason, at, fixed }] or [{ bank: id, reason, at, fixed }]
// minis: n → { refs: [{ index, k }], startedAt, handedAt, work: { i → entry } }
// bank: problem id → { attempts: [{ score, source, at, hints, secs, mock? }], timerAt, due }
// mocks: [{ id, kind, label, ids, startedAt, minutes, handedAt, work: { i → { grades, mistake } } }]
// target: your own goal out of 32   paceStart: the day you started, for the schedule
// life: everyday maths (skills, the round in progress, its own streak), see life/engine.js
export const EMPTY = {
  next: 0,
  streak: { count: 0, lastDay: null },
  best: 0,
  results: {},
  work: {},
  examDate: '',
  paceStart: null,
  srs: null,
  reviews: {},
  mistakes: [],
  minis: {},
  bank: {},
  mocks: [],
  target: 16,
  lastBackup: null,
  seen: {},
  life: EMPTY_LIFE,
}

const STATUSES = ['passed', 'mastered', 'done']
const REASONS = ['idea', 'fact', 'calc', 'case', 'gap', 'read']

const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v)
const int = (v, min, max, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : fallback
}
const optInt = (v) => (v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)))
const time = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null)
const str = (v, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : '')
const entries = (v) => (isObj(v) ? Object.entries(v) : [])

function grade(g) {
  if (!isObj(g) || !Number.isFinite(Number(g.score))) return null
  const out = { ...g, score: int(g.score, 0, 8, 0), source: g.source === 'ai' ? 'ai' : 'self' }
  if (out.day != null) out.day = optInt(out.day)
  out.summary = str(g.summary)
  out.good = Array.isArray(g.good) ? g.good.map((s) => str(s, 600)).filter(Boolean) : []
  out.issues = Array.isArray(g.issues) ? g.issues.filter(isObj).map((i) => ({ where: str(i.where, 200), problem: str(i.problem, 800), hint: str(i.hint, 600), page: int(i.page, 0, 6, 0), box: null })) : []
  return out
}
const grades = (v) => (Array.isArray(v) ? v.map(grade).filter(Boolean) : [])
const ref = (r) => (isObj(r) && Number.isInteger(Number(r.index)) && (r.k === 'c' || Number.isInteger(Number(r.k))) ? { index: int(r.index, 0, TOTAL_DAYS - 1, 0), k: r.k === 'c' ? 'c' : int(r.k, 0, 9, 0) } : null)

function workEntry(w) {
  if (!isObj(w)) return null
  const out = { day: optInt(w.day), tries: int(w.tries, 0, 99, 0), solved: w.solved === true, grades: grades(w.grades) }
  if (time(w.startedAt)) out.startedAt = time(w.startedAt)
  if (time(w.handedAt)) out.handedAt = time(w.handedAt)
  if (Array.isArray(w.swaps)) out.swaps = w.swaps.map(ref).filter((r) => r && r.k !== 'c')
  if (REASONS.includes(w.mistake)) out.mistake = w.mistake
  return out
}

function attempt(a) {
  if (!isObj(a) || !Number.isFinite(Number(a.score))) return null
  const g = grade(a)
  return { ...g, at: time(a.at) || 0, hints: int(a.hints, 0, 9, 0), secs: a.secs == null ? null : int(a.secs, 0, 1e7, null), ...(a.mock != null ? { mock: a.mock } : {}) }
}

function mock(m) {
  if (!isObj(m) || !Array.isArray(m.ids) || !m.ids.length || !time(m.startedAt)) return null
  const work = {}
  entries(m.work).forEach(([i, w]) => {
    if (!isObj(w)) return
    work[int(i, 0, 9, 0)] = { grades: grades(w.grades), ...(REASONS.includes(w.mistake) ? { mistake: w.mistake } : {}) }
  })
  return {
    id: Number.isFinite(Number(m.id)) ? Number(m.id) : time(m.startedAt),
    kind: m.kind === 'year' ? 'year' : 'mixed',
    label: str(m.label, 60) || 'Mock',
    ids: m.ids.filter((id) => typeof id === 'string').slice(0, 4),
    startedAt: time(m.startedAt),
    minutes: int(m.minutes, 1, 600, 240),
    handedAt: time(m.handedAt),
    work,
  }
}

// Any parsed JSON → a state the app can always render. Unknown fields are dropped.
export function normalizeState(raw, today = dayOf(Date.now())) {
  const s = isObj(raw) ? raw : {}
  const results = {}
  entries(s.results).forEach(([i, r]) => {
    const index = Number(i)
    if (!Number.isInteger(index) || index < 0 || index >= TOTAL_DAYS || !isObj(r)) return
    results[index] = { day: optInt(r.day) ?? today, status: STATUSES.includes(r.status) ? r.status : 'passed', ...(typeof r.score === 'string' && /^\d+\/\d+$/.test(r.score) ? { score: r.score } : {}) }
  })
  const work = {}
  entries(s.work).forEach(([key, w]) => {
    if (!/^\d+:(p\d|c|paper|done)$/.test(key)) return
    const e = workEntry(w)
    if (e) work[key] = e
  })
  let srs = null
  if (isObj(s.srs)) {
    srs = {}
    entries(s.srs).forEach(([key, v]) => {
      if (/^\d+:\d$/.test(key) && isObj(v)) srs[key] = { box: int(v.box, 0, 20, 0), due: optInt(v.due) ?? today }
    })
  }
  const reviews = {}
  entries(s.reviews).forEach(([day, r]) => {
    if (!/^\d+$/.test(day)) return
    if (r === null) return (reviews[day] = null)
    const rr = ref(r)
    if (rr && rr.k !== 'c') reviews[day] = { ...rr, ...workEntry(r) }
  })
  const mistakes = (Array.isArray(s.mistakes) ? s.mistakes : [])
    .filter(isObj)
    .map((m) => {
      const base = { reason: REASONS.includes(m.reason) ? m.reason : 'idea', at: optInt(m.at) ?? today, ...(m.fixed ? { fixed: true } : {}) }
      if (typeof m.bank === 'string') return { bank: m.bank, ...base }
      const r = ref(m)
      return r ? { ...r, ...base } : null
    })
    .filter(Boolean)
  const minis = {}
  entries(s.minis).forEach(([n, m]) => {
    if (!/^\d+$/.test(n) || !isObj(m)) return
    const work = {}
    entries(m.work).forEach(([i, w]) => {
      const e = workEntry(w)
      if (e) work[int(i, 0, 9, 0)] = e
    })
    minis[n] = { refs: (Array.isArray(m.refs) ? m.refs : []).map(ref).filter(Boolean), startedAt: time(m.startedAt) || Date.now(), handedAt: time(m.handedAt), work }
  })
  const bank = {}
  entries(s.bank).forEach(([id, e]) => {
    if (!isObj(e)) return
    bank[id] = { attempts: (Array.isArray(e.attempts) ? e.attempts : []).map(attempt).filter(Boolean), timerAt: time(e.timerAt), due: optInt(e.due) }
  })
  const firstDay = Object.values(results).reduce((min, r) => Math.min(min, r.day), Infinity)
  const streak = isObj(s.streak) ? s.streak : {}
  return {
    next: int(s.next, 0, TOTAL_DAYS, Math.min(TOTAL_DAYS, Object.keys(results).length)),
    streak: { count: int(streak.count, 0, 10000, 0), lastDay: optInt(streak.lastDay) },
    best: int(s.best, 0, 10000, 0),
    results,
    work,
    examDate: dayOfIso(s.examDate) != null ? s.examDate : '',
    paceStart: optInt(s.paceStart) ?? (Number.isFinite(firstDay) ? firstDay : today),
    srs,
    reviews,
    mistakes,
    minis,
    bank,
    mocks: (Array.isArray(s.mocks) ? s.mocks : []).map(mock).filter(Boolean),
    target: int(s.target, 1, 32, 16),
    lastBackup: typeof s.lastBackup === 'string' && !Number.isNaN(Date.parse(s.lastBackup)) ? s.lastBackup : null,
    seen: isObj(s.seen) ? Object.fromEntries(entries(s.seen).filter(([, v]) => v === true)) : {},
    life: normalizeLife(s.life),
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return normalizeState(raw ? JSON.parse(raw) : null)
  } catch {
    return normalizeState(null)
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

// Keep a copy of the current progress before something replaces it
export function keepPrevious(state, reason) {
  try {
    localStorage.setItem(PREV_KEY, JSON.stringify({ app: 'qed', version: VERSION, savedAt: new Date().toISOString(), reason, state }))
  } catch {}
}
export function readPrevious() {
  try {
    const p = JSON.parse(localStorage.getItem(PREV_KEY))
    return p && isObj(p.state) ? { ...p, state: normalizeState(p.state) } : null
  } catch {
    return null
  }
}

export const summary = (state) => ({
  day: Math.min(state.next + 1, TOTAL_DAYS),
  done: Object.keys(state.results).length,
  streak: state.streak.count,
  mocks: state.mocks.length,
  problems: Object.keys(state.bank).length,
})

export class BackupError extends Error {
  constructor(code) {
    super(code)
    this.code = code // 'not-json' | 'not-qed' | 'newer' | 'empty'
  }
}

// A backup file's text → { state, savedAt, summary }. Throws BackupError.
export function parseBackup(text) {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new BackupError('not-json')
  }
  if (!isObj(parsed)) throw new BackupError('not-qed')
  let data = parsed
  if (parsed.app != null) {
    if (parsed.app !== 'qed') throw new BackupError('not-qed')
    if (Number(parsed.version) > VERSION) throw new BackupError('newer')
    data = parsed.state
  }
  if (!isObj(data) || !isObj(data.results)) throw new BackupError('not-qed')
  const state = normalizeState(data)
  const savedAt = typeof parsed.savedAt === 'string' && !Number.isNaN(Date.parse(parsed.savedAt)) ? parsed.savedAt : state.lastBackup
  return { state, savedAt, summary: summary(state) }
}

export function backupJSON(state) {
  const savedAt = new Date().toISOString()
  return { savedAt, text: JSON.stringify({ app: 'qed', version: VERSION, savedAt, state: { ...state, lastBackup: savedAt } }) }
}

// Save a backup: the share sheet where there is one (Files, iCloud Drive, AirDrop), a download otherwise
export async function shareBackup(state) {
  const { savedAt, text } = backupJSON(state)
  const name = `qed-backup-${isoOfDay(dayOf(Date.now()))}.json`
  const file = typeof File === 'function' ? new File([text], name, { type: 'application/json' }) : null
  if (file && navigator.canShare?.({ files: [file] }) && matchMedia('(pointer: coarse)').matches) {
    try {
      await navigator.share({ files: [file] })
      return savedAt
    } catch (e) {
      if (e?.name === 'AbortError') return null
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  return savedAt
}

// Ask the browser not to clear our storage under pressure (granted silently for installed web apps)
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}
