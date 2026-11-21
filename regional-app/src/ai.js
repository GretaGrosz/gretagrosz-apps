// AI marking and the coach. Normally hosted on gretagrosz.com (/qed/api, Greta's key stays on the server,
// with a daily allowance per device). If hosting is off or today's allowance is used up, a student's own
// Anthropic key (Settings) still works, straight from the browser.
import { useEffect, useState } from 'react'
import { GRADER, GRADE_SCHEMA, MAX_POINTS, coachPrompt, gradePrompt, normaliseGrade } from '../../worker/qed-prompts.js'
import { t } from './i18n'

export { MAX_POINTS }
export const OWN_MODEL = 'claude-sonnet-5-5'
const API = '/qed/api'
const SETTINGS_KEY = 'regional-150-ai'
const DEVICE_KEY = 'qed-device'
const STATUS_KEY = 'qed-ai-status'

export function loadAI() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY))
    return { key: typeof s?.key === 'string' ? s.key : '' }
  } catch {
    return { key: '' }
  }
}
export function saveAI(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ key: settings.key || '' }))
  } catch {}
  emit()
}

function device() {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id || !/^[A-Za-z0-9-]{16,64}$/.test(id)) {
      id = crypto.randomUUID?.() || Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return 'unsaved-device-00000000'
  }
}

/* ---------- status: hosted or not, and what's left today ---------- */

// Last known status is kept, so the right buttons show instantly on the next open
let status = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(STATUS_KEY))
    return s && typeof s.hosted === 'boolean' ? s : { hosted: false, unknown: true }
  } catch {
    return { hosted: false, unknown: true }
  }
})()
const listeners = new Set()
function emit() {
  listeners.forEach((f) => f())
}
function setStatus(next) {
  status = { ...status, ...next, unknown: false, day: new Date().toDateString() }
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify({ hosted: status.hosted, marks: status.marks, chats: status.chats, day: status.day }))
  } catch {}
  emit()
}

let inflight = null
export function refreshStatus() {
  inflight ||= fetch(`${API}/status?device=${encodeURIComponent(device())}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { hosted: false }))
    .then((s) => setStatus({ hosted: !!s.hosted, marks: s.marks, chats: s.chats }))
    .catch(() => {
      // Offline: keep what we knew. A new day means a fresh allowance on the server.
      if (status.hosted && status.day !== new Date().toDateString()) setStatus({ marks: status.marks && { ...status.marks, left: status.marks.limit }, chats: status.chats && { ...status.chats, left: status.chats.limit } })
    })
    .finally(() => (inflight = null))
  return inflight
}

// mode: 'hosted' | 'key' | 'none'. marksLeft: number or null (no limit with your own key)
export function aiState() {
  const own = !!loadAI().key
  const hosted = status.hosted
  const marksLeft = hosted ? status.marks?.left ?? null : null
  const chatsLeft = hosted ? status.chats?.left ?? null : null
  const mode = hosted && (marksLeft !== 0 || !own) ? 'hosted' : own ? 'key' : hosted ? 'hosted' : 'none'
  return { mode, hosted, own, marksLeft: mode === 'key' ? null : marksLeft, chatsLeft: mode === 'key' ? null : chatsLeft, limit: status.marks?.limit ?? null }
}

export function useAI() {
  const [, bump] = useState(0)
  useEffect(() => {
    const f = () => bump((n) => n + 1)
    listeners.add(f)
    refreshStatus()
    const onFocus = () => document.visibilityState === 'visible' && refreshStatus()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      listeners.delete(f)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [])
  return aiState()
}

/* ---------- photos ---------- */

// Shrink photos before sending: faster, cheaper, and still easy to read
export function readPhoto(file, maxSide = 1600) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      resolve({ dataUrl, data: dataUrl.split(',')[1], mediaType: 'image/jpeg', w: canvas.width, h: canvas.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(t('That file could not be opened as a picture.')))
    }
    img.src = url
  })
}

/* ---------- calls ---------- */

const ERRORS = {
  quota: 'No marks left today. More tomorrow.',
  site_cap: 'Marking is busy today. Try again tomorrow or mark it yourself.',
  busy: 'The marker is busy right now. Try again in a minute.',
  refusal: 'The marker couldn’t mark this one. Mark it yourself with the scheme.',
  bad_image: 'One of the photos couldn’t be read. Take it again.',
  too_large: 'That is too much at once. Send fewer or smaller photos.',
  empty: 'Add a photo or type your proof first.',
  not_configured: 'AI marking isn’t available right now.',
  upstream: 'The marker had a problem. Try again in a minute.',
  offline: 'You’re offline. Connect to get it marked, or mark it yourself.',
}
export class AIError extends Error {
  constructor(code, status) {
    super(t(ERRORS[code] || ERRORS.upstream))
    this.code = code
    this.status = status
  }
}

// The fields the marker sees, in the same shape the Worker checks
const promptProblem = (p) => ({
  q: String(p.q || ''),
  answers: [].concat(p.answers || []).filter((s) => typeof s === 'string'),
  keySteps: [].concat(p.keySteps || []).filter((s) => typeof s === 'string'),
  rubric: (p.rubric || []).filter((r) => Array.isArray(r)).map(([s, n]) => [String(s), Number(n) || 0]),
  solution: typeof p.solution === 'string' ? p.solution : '',
  pitfalls: [].concat(p.pitfalls || []).filter((s) => typeof s === 'string'),
})
const stripPhoto = (p) => ({ data: p.data, mediaType: p.mediaType })

async function hosted(path, body) {
  if (!navigator.onLine) throw new AIError('offline')
  let res
  try {
    res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device: device(), ...body }) })
  } catch {
    throw new AIError(navigator.onLine ? 'upstream' : 'offline')
  }
  const out = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (out.code === 'not_configured') setStatus({ hosted: false })
    if (out.code === 'quota') setStatus(path === '/grade' ? { marks: { ...status.marks, left: 0 } } : { chats: { ...status.chats, left: 0 } })
    throw new AIError(out.code || 'upstream', res.status)
  }
  if (typeof out.left === 'number') setStatus(path === '/grade' ? { marks: { ...status.marks, left: out.left } } : { chats: { ...status.chats, left: out.left } })
  return out
}

async function ownKey({ system, messages, maxTokens, outputConfig }) {
  const { key } = loadAI()
  if (!key) throw new AIError('not_configured')
  if (!navigator.onLine) throw new AIError('offline')
  let res
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'server-side-fallback-2026-07-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: OWN_MODEL, fallbacks: 'default', max_tokens: maxTokens, system, messages, output_config: outputConfig }),
    })
  } catch {
    throw new AIError(navigator.onLine ? 'upstream' : 'offline')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) throw Object.assign(new Error(t('The API key was not accepted. Check it in Settings.')), { code: 'key' })
    if (res.status === 429 || res.status === 529) throw new AIError('busy')
    throw new AIError('upstream', res.status)
  }
  if (body.stop_reason === 'refusal') throw new AIError('refusal')
  return (body.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n')
}

const photoBlocks = (photos) => photos.map((p) => ({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.data } }))

function useHosted() {
  const s = aiState()
  return s.mode === 'hosted'
}

export async function gradeProof(problem, { photos = [], text = '' }) {
  const p = promptProblem(problem)
  const pages = photos.map((x) => ({ w: x.w || 0, h: x.h || 0 }))
  if (useHosted()) {
    try {
      const out = await hosted('/grade', { problem: p, photos: photos.map(stripPhoto), pages, text })
      return out.grade
    } catch (e) {
      // Out of hosted marks or hosting just switched off: use the student's own key if there is one
      if (!(e instanceof AIError) || !['quota', 'not_configured', 'site_cap'].includes(e.code) || !loadAI().key) throw e
    }
  }
  const raw = await ownKey({
    system: GRADER,
    messages: [{ role: 'user', content: [...photoBlocks(photos), { type: 'text', text: gradePrompt(p, photos, pages, text) }] }],
    maxTokens: 12000,
    outputConfig: { effort: 'high', format: { type: 'json_schema', schema: GRADE_SCHEMA } },
  })
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  try {
    return normaliseGrade(JSON.parse(raw.slice(start, end + 1)))
  } catch {
    throw new AIError('upstream')
  }
}

// messages: [{ role: 'user' | 'assistant', text, photos? }]. topic: true when the coach is about a plan day, not a problem.
export async function askCoach(problem, messages, graded, topic = false) {
  const p = promptProblem(problem)
  const g = graded ? { score: graded.score, summary: graded.summary || '' } : null
  if (useHosted() && (aiState().chatsLeft ?? 1) > 0) {
    try {
      const out = await hosted('/coach', { problem: p, topic, graded: g, messages: messages.map((m) => ({ role: m.role, text: m.text, photos: (m.photos || []).map(stripPhoto) })) })
      return out.reply
    } catch (e) {
      if (!(e instanceof AIError) || !['quota', 'not_configured', 'site_cap'].includes(e.code) || !loadAI().key) throw e
    }
  }
  const apiMessages = messages.map((m) => ({
    role: m.role,
    content: m.photos?.length ? [...photoBlocks(m.photos), { type: 'text', text: m.text || 'Here is my work.' }] : m.text || '…',
  }))
  return ownKey({ system: coachPrompt(p, topic, g), messages: apiMessages, maxTokens: 4000, outputConfig: { effort: 'medium' } })
}

export async function testKey() {
  await ownKey({ system: 'Reply with OK.', messages: [{ role: 'user', content: 'Say OK.' }], maxTokens: 16, outputConfig: { effort: 'low' } })
}
