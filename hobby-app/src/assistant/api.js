// Ask: the axolotl's AI help (worker/blank-ai.js). Everything else the axolotl does is local and instant.
import { dayNumber, uid } from '../data'
import { stuckDaysOf } from './tips'

const DEVICE = 'blank-device'
export function deviceId() {
  try {
    let id = localStorage.getItem(DEVICE)
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      id = uid('dev').replace(/[^A-Za-z0-9_-]/g, '') + uid('x').slice(2)
      localStorage.setItem(DEVICE, id)
    }
    return id
  } catch {
    return uid('dev') + uid('x').slice(2)
  }
}

export class AskError extends Error {
  constructor(code) {
    super(code)
    this.code = code // offline | timeout | quota | busy | not_configured | too_big | server | upstream | crisis
  }
}

// What the axolotl knows about your project: its steps, where you are, your last notes
export function projectContext(p) {
  if (!p) return null
  const next = p.milestones.find((m) => !m.done)
  return {
    title: p.title.slice(0, 80),
    category: p.category || '',
    description: (p.description || '').slice(0, 300),
    steps: p.milestones.slice(0, 30).map((m) => ({ text: m.text.slice(0, 120), done: !!m.done })),
    step: next ? next.text.slice(0, 120) : '',
    day: dayNumber(p.createdAt, p.status === 'done' ? p.finishedAt || Date.now() : Date.now()),
    minutes: (p.sessions || []).reduce((a, s) => a + (s.minutes || 0), 0),
    stuckDays: next ? stuckDaysOf(p, next) : 0,
    notes: p.entries
      .filter((e) => e.text)
      .slice(0, 3)
      .map((e) => e.text.slice(0, 200)),
  }
}

export async function ask({ question = '', mode = 'ask', project, history = [], lang }) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AskError('offline')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 20_000)
  let res
  try {
    res = await fetch('/blank/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        device: deviceId(),
        lang,
        mode,
        question: question.slice(0, 400),
        project: projectContext(project),
        history: history.slice(-6).map((h) => ({ role: h.role, text: h.text.slice(0, 900) })),
      }),
      signal: ctrl.signal,
    })
  } catch (e) {
    throw new AskError(e?.name === 'AbortError' ? 'timeout' : 'offline')
  } finally {
    clearTimeout(timer)
  }
  let data = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok || !data) throw new AskError(data?.error || (res.status === 404 ? 'not_configured' : 'server'))
  return { answer: String(data.answer || ''), steps: Array.isArray(data.steps) ? data.steps.map(String) : [], left: data.left ?? null }
}

// A whole plan for any project name (worker/blank-ai.js, mode 'plan'): { category, steps, materials, video }
// The creator's own draft steps, rewritten clearly by the AI (worker/blank-ai.js tidy): same content, nothing invented
export async function tidySteps({ title, steps, lang }) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AskError('offline')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25_000)
  let res
  try {
    res = await fetch('/blank/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device: deviceId(), lang, mode: 'tidy', title: String(title || '').slice(0, 80), steps: steps.slice(0, 20).map((s) => ({ text: s.text.slice(0, 120), how: (s.how || '').slice(0, 300) })) }),
      signal: ctrl.signal,
    })
  } catch (e) {
    throw new AskError(e?.name === 'AbortError' ? 'timeout' : 'offline')
  } finally {
    clearTimeout(timer)
  }
  let data = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok || !data) throw new AskError(data?.error || 'server')
  return data.steps
}

export async function makePlan({ title, category, level, lang, about = '', fromPost = false, budget = null, pace = null }) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new AskError('offline')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 25_000)
  let res
  try {
    res = await fetch('/blank/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ device: deviceId(), lang, mode: 'plan', title: title.slice(0, 80), category, level, ...(about && { about: about.slice(0, 300) }), ...(fromPost && { post: true }), ...(budget && { budget }), ...(pace && { pace }) }),
      signal: ctrl.signal,
    })
  } catch (e) {
    throw new AskError(e?.name === 'AbortError' ? 'timeout' : 'offline')
  } finally {
    clearTimeout(timer)
  }
  let data = null
  try {
    data = await res.json()
  } catch {}
  if (!res.ok || !data) throw new AskError(data?.error || 'server')
  // The name was about feeling unsafe: no plan, the answer pointing to real people instead
  if (data.crisis) throw Object.assign(new AskError('crisis'), { answer: String(data.answer || '') })
  return data
}
