// Talks to the Yap API (worker/yap.js). The session key lives in this browser only.
import { lang } from './i18n.js'

const BASE = '/yap/api'
const KEY = 'yap.key'

export function getKey() {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export function setKey(key) {
  try { key ? localStorage.setItem(KEY, key) : localStorage.removeItem(KEY) } catch {}
}

/** One request. Errors carry `status` (0 = no connection) and `code` (from the server). */
export async function api(path, { method = 'GET', body, form, key = getKey(), signal } = {}) {
  const headers = { 'x-yap-lang': lang() }
  if (key) headers.authorization = 'Bearer ' + key
  if (body) headers['content-type'] = 'application/json'
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined), signal })
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    throw Object.assign(new Error(lang() === 'de' ? 'Keine Verbindung' : 'No connection'), { status: 0, code: 'offline' })
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || (lang() === 'de' ? 'Etwas ist schiefgelaufen' : 'Something went wrong')), { status: res.status, code: data.code })
  return data
}

/** Sends a finished recording as a post, a reply, or a voice message. `cid` makes a retry safe. */
export function sendClip(path, clip, extra = {}) {
  const form = new FormData()
  const ext = clip.mime.includes('mp4') ? 'm4a' : clip.mime.includes('ogg') ? 'ogg' : 'webm'
  form.append('audio', new File([clip.blob], 'yap.' + ext, { type: clip.mime }))
  form.append('duration', String(clip.duration))
  form.append('wave', JSON.stringify(clip.wave))
  form.append('fx', clip.fx || '')
  if (clip.cid) form.append('cid', clip.cid)
  for (const [k, v] of Object.entries(extra)) if (v != null) form.append(k, v)
  return api(path, { method: 'POST', form })
}

// Audio from the API needs the key, so it is fetched once and kept as a blob
const blobs = new Map()
export function audioBlob(src) {
  if (!blobs.has(src)) {
    const auth = src.startsWith(BASE) && getKey() ? { authorization: 'Bearer ' + getKey() } : {}
    const p = fetch(src, { headers: auth })
      .then(r => { if (!r.ok) throw new Error('audio ' + r.status); return r.blob() })
    p.catch(() => blobs.delete(src))
    blobs.set(src, p)
    if (blobs.size > 120) blobs.delete(blobs.keys().next().value)
  }
  return blobs.get(src)
}
const urls = new Map()
export async function audioUrl(src) {
  if (src.startsWith('blob:') || src.startsWith('data:')) return src
  if (!src.startsWith(BASE)) return src
  if (!urls.has(src)) urls.set(src, URL.createObjectURL(await audioBlob(src)))
  return urls.get(src)
}

export const inviteLink = code => `${location.origin}/yap/#join/${code}`
export const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
