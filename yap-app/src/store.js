// What the app already knows, shown at once: every list is kept in memory and in localStorage,
// painted immediately on the next open, and refreshed quietly in the background (stale-while-revalidate).
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { api, getKey } from './api.js'

const STORE = 'yap.cache.v2'
const PERSIST = /^\/(me|feed|chats|friends|prompt|unheard|blocks|invite|users\/\w+|chats\/\w+|groups\/[\w-]+)$/
const entries = new Map() // path -> { data, error, loading, at }
const subs = new Map()
const inflight = new Map()

try {
  const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
  if (saved && saved.key === keyTag()) for (const [k, v] of Object.entries(saved.data)) entries.set(k, { data: v, error: null, loading: false, at: 0 })
} catch {}

function keyTag() { return (getKey() || '').slice(-10) }

let saveTimer = 0
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const data = {}
    for (const [k, v] of entries) {
      if (!PERSIST.test(k) || v.data === undefined) continue
      // Conversations keep their newest 60 messages on disk; older ones load when you scroll up
      data[k] = v.data.messages?.length > 60 ? { ...v.data, messages: v.data.messages.slice(-60), more: true } : v.data
    }
    try { localStorage.setItem(STORE, JSON.stringify({ key: keyTag(), data })) } catch {
      // Full storage: drop the conversations, keep the lists
      for (const k of Object.keys(data)) if (/^\/(chats|groups)\//.test(k)) delete data[k]
      try { localStorage.setItem(STORE, JSON.stringify({ key: keyTag(), data })) } catch {}
    }
  }, 300)
}

const EMPTY = { data: undefined, error: null, loading: false, at: 0 }
const get = path => entries.get(path) || EMPTY
function set(path, patch) {
  entries.set(path, { ...get(path), ...patch })
  subs.get(path)?.forEach(f => f())
  if ('data' in patch) persist()
}

/** Fetches `path` now (one request at a time per path) and stores the result */
export function revalidate(path) {
  if (!getKey()) return Promise.resolve()
  if (inflight.has(path)) return inflight.get(path)
  set(path, { loading: true })
  const p = api(path)
    .then(data => set(path, { data, error: null, loading: false, at: Date.now() }))
    .catch(error => { set(path, { error, loading: false }); if (error.status === 401) window.dispatchEvent(new Event('yap:signedout')) })
    .finally(() => inflight.delete(path))
  inflight.set(path, p)
  return p
}

/** Change what's stored for `path` (optimistic updates); fn gets the old data */
export function mutate(path, fn) {
  const old = get(path).data
  if (old === undefined) return
  set(path, { data: typeof fn === 'function' ? fn(old) : fn })
}
export const peek = path => get(path).data
export const prime = (path, data) => set(path, { data, at: Date.now() })

export function clearCache() {
  entries.clear()
  try { localStorage.removeItem(STORE) } catch {}
  for (const s of subs.values()) s.forEach(f => f())
}

/**
 * { data, error, loading, reload } for an API path. Shows stored data at once, refreshes on mount,
 * when the app comes back to the front, when the connection returns, and every `poll` ms while `active`.
 */
export function useResource(path, { poll = 0, active = true, maxAge = 0 } = {}) {
  const snap = useSyncExternalStore(
    cb => {
      if (!path) return () => {}
      if (!subs.has(path)) subs.set(path, new Set())
      subs.get(path).add(cb)
      return () => subs.get(path)?.delete(cb)
    },
    () => (path ? get(path) : EMPTY),
  )
  const activeRef = useRef(active)
  activeRef.current = active
  useEffect(() => {
    if (!path) return
    if (!maxAge || Date.now() - get(path).at > maxAge) revalidate(path)
    const again = () => activeRef.current && document.visibilityState === 'visible' && revalidate(path)
    window.addEventListener('online', again)
    document.addEventListener('visibilitychange', again)
    const id = poll ? setInterval(again, poll) : 0
    return () => {
      window.removeEventListener('online', again)
      document.removeEventListener('visibilitychange', again)
      clearInterval(id)
    }
  }, [path, poll])
  // Coming back to a tab: refresh if what it shows is more than a few seconds old
  useEffect(() => {
    if (path && active && Date.now() - get(path).at > 8000) revalidate(path)
  }, [active])
  return { ...snap, reload: () => revalidate(path) }
}
