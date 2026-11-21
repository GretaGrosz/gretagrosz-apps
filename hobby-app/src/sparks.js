// "Started because of you": sharing a project as a link (#/s/<code>) that anyone can start too.
// The server (worker/blank.js, sparks) keeps the title and steps and counts each phone that starts it once.
import { call } from './buddy'

export const createSpark = (body) => call('/sparks', { method: 'POST', body })
export const updateSpark = (code, key, body) => call(`/sparks/${code}`, { method: 'PUT', key, body })
export const getSpark = (code) => call(`/sparks/${encodeURIComponent(code)}`)
export const startSpark = (code) => call(`/sparks/${code}/start`, { method: 'POST', body: { device: deviceId() } })
export const sparkCounts = (codes) => call(`/sparks?codes=${codes.join(',')}`)

export const sparkLink = (code) => `${location.origin}${import.meta.env.BASE_URL}#/s/${code}`

// What the link shows: the project as it is now
export const sparkBody = (project, name, lang) => ({
  name,
  title: project.title,
  category: project.category,
  guideKey: project.guideKey,
  steps: project.milestones
    .filter((m) => !m.auto)
    .map((m) => m.text.trim())
    .filter(Boolean)
    .slice(0, 30),
  lang,
})

// A random id for this phone, so starting the same link twice only counts once. Not part of the backup on purpose.
const DEVICE_KEY = 'blank-device'
export function deviceId() {
  try {
    const old = localStorage.getItem(DEVICE_KEY)
    if (old) return old
  } catch {}
  const id = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join('')
  try {
    localStorage.setItem(DEVICE_KEY, id)
  } catch {}
  return id
}
