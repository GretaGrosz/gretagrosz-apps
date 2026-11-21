// Talks to the Stance API in worker/stance.js. The login key lives in this browser only.
// Every request has a timeout, sends the UI language, and reports whether the network is reachable.
// Screens keep their last good data here (memory + localStorage), so anything seen before appears instantly.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { lang, t } from './i18n.js'

const BASE = '/stance/api'
const KEY = 'stance.key'

export function getKey() {
  try { return localStorage.getItem(KEY) } catch { return null }
}
export function setKey(key) {
  try { key ? localStorage.setItem(KEY, key) : localStorage.removeItem(KEY) } catch {}
}

// ---------- online / offline ----------

let online = true
const listeners = new Set()
function setOnline(v) {
  if (online === v) return
  online = v
  listeners.forEach(f => f())
}
export const useOnline = () => useSyncExternalStore(f => { listeners.add(f); return () => listeners.delete(f) }, () => online)
window.addEventListener('online', () => setOnline(true))

// ---------- requests ----------

/** timeout in ms: 15 s by default; uploads and AI calls pass longer ones */
export async function api(path, { method = 'GET', body, form, timeout = 15000, headers: extra } = {}) {
  const headers = { 'x-lang': lang, ...extra }
  const key = getKey()
  if (key) headers.authorization = 'Bearer ' + key
  if (body) headers['content-type'] = 'application/json'
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined), signal: ctl.signal })
  } catch (e) {
    setOnline(false)
    throw Object.assign(new Error(e?.name === 'AbortError' ? t('err.slow') : t('err.offline')), { status: 0 })
  } finally {
    clearTimeout(timer)
  }
  setOnline(true)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || t('err.generic')), { status: res.status, data })
  return data
}

// ---------- cache ----------

const mem = new Map()
const ns = () => `stance.c.${lang}.${(getKey() || 'guest').slice(-8)}.`
export function readCache(key) {
  const k = ns() + key
  if (mem.has(k)) return mem.get(k)
  try {
    const v = JSON.parse(localStorage.getItem(k))
    if (v != null) mem.set(k, v)
    return v
  } catch { return null }
}
export function writeCache(key, value) {
  const k = ns() + key
  mem.set(k, value)
  try {
    const s = JSON.stringify(value)
    if (s.length < 350_000) localStorage.setItem(k, s)
  } catch {}
}
export function clearCache() {
  mem.clear()
  try { Object.keys(localStorage).filter(k => k.startsWith('stance.c.')).forEach(k => localStorage.removeItem(k)) } catch {}
}

/**
 * Data for a screen: shows the cached copy at once, fetches a fresh one, keeps the old one on failure.
 * Returns { data, error, loading, reload, setData }. `key` null = don't load.
 */
export function useLoad(key, path, deps = []) {
  const [data, setDataState] = useState(() => (key ? readCache(key) : null))
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)
  const setData = useCallback(v => {
    setDataState(old => {
      const next = typeof v === 'function' ? v(old) : v
      if (key && next) writeCache(key, next)
      return next
    })
  }, [key])
  const reload = useCallback(async () => {
    if (!key) return
    const n = ++seq.current
    setLoading(true)
    try {
      const d = await api(typeof path === 'function' ? path() : path)
      if (n !== seq.current) return
      writeCache(key, d)
      setDataState(d)
      setError(null)
    } catch (e) {
      if (n === seq.current) setError(e)
    } finally {
      if (n === seq.current) setLoading(false)
    }
  }, [key, path])
  useEffect(() => {
    if (!key) return
    setDataState(readCache(key))
    setError(null)
    reload()
  }, [key, ...deps])
  return { data, error, loading, reload, setData }
}

// ---------- audio ----------

// Audio from the API needs the key, so it is fetched once and kept as a blob URL
const blobs = new Map()
export function audioUrl(src) {
  if (!src.startsWith(BASE)) return Promise.resolve(src)
  if (!blobs.has(src)) {
    const p = fetch(src, { headers: { authorization: 'Bearer ' + getKey() } })
      .then(r => { if (!r.ok) throw new Error(t('err.recording')); return r.blob() })
      .then(b => URL.createObjectURL(b))
    p.catch(() => blobs.delete(src))
    blobs.set(src, p)
  }
  return blobs.get(src)
}

export const appLink = hash => `${location.origin}/stance/#${hash}`
