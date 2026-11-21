// Recordings are never lost: every send goes through this outbox. The clip is saved in IndexedDB first,
// shown at once as "Sending", and removed only when the server has it. A failed send stays as
// "Not sent · Tap to retry", survives a reload, and is retried by itself when the connection comes back.
import { useSyncExternalStore } from 'react'
import { getKey, newId, sendClip } from './api.js'

const DB = 'yap', STORE = 'outbox'
let items = [] // { cid, path, kind, extra, blob, mime, duration, wave, fx, created, status: 'sending'|'failed', error, url }
const subs = new Set()
const sentHandlers = new Set()
const emit = () => { items = [...items]; subs.forEach(f => f()) }

let dbp = null
function db() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('no indexedDB'))
  dbp ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'cid' })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}
async function tx(mode, fn) {
  const d = await db()
  return new Promise((resolve, reject) => {
    const t = d.transaction(STORE, mode)
    const r = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(r?.result)
    t.onerror = () => reject(t.error)
  })
}
const save = rec => {
  const { url, ...stored } = rec
  return tx('readwrite', s => s.put(stored)).catch(() => {})
}
const drop = cid => tx('readwrite', s => s.delete(cid)).catch(() => {})

/** Loads what was waiting from last time (for this account) and tries it again */
export async function restoreOutbox() {
  try {
    const all = await tx('readonly', s => s.getAll())
    const mine = (all || []).filter(r => r.owner === (getKey() || '').slice(-10))
    items = mine.map(r => ({ ...r, status: 'failed', url: URL.createObjectURL(r.blob) }))
    emit()
    retryAll()
  } catch {}
}

/** Queues a clip for `path` and sends it. Resolves with the server's answer, or null if it is waiting. */
export async function enqueue(path, clip, { kind, extra = {} } = {}) {
  const rec = {
    cid: clip.cid || newId(), path, kind, extra, blob: clip.blob, mime: clip.mime, duration: clip.duration,
    wave: clip.wave, fx: clip.fx || '', created: Date.now(), status: 'sending', error: null,
    owner: (getKey() || '').slice(-10), url: clip.url || URL.createObjectURL(clip.blob),
  }
  items.push(rec)
  emit()
  await save(rec)
  return attempt(rec.cid)
}

async function attempt(cid) {
  const rec = items.find(r => r.cid === cid)
  if (!rec) return null
  rec.status = 'sending'; rec.error = null
  emit()
  try {
    const data = await sendClip(rec.path, rec, rec.extra)
    items = items.filter(r => r.cid !== cid)
    emit()
    drop(cid)
    sentHandlers.forEach(f => f(rec, data))
    return data
  } catch (e) {
    const r = items.find(x => x.cid === cid)
    if (r) {
      r.status = 'failed'
      // Too long / not audio / not friends any more: retrying won't help, so it waits for the person to decide
      r.error = e.status >= 400 && e.status < 500 && e.status !== 429 && e.status !== 408 ? e.message : null
      emit()
    }
    return null
  }
}

export const retry = cid => attempt(cid)
export function discard(cid) {
  const rec = items.find(r => r.cid === cid)
  if (rec?.url) URL.revokeObjectURL(rec.url)
  items = items.filter(r => r.cid !== cid)
  emit()
  drop(cid)
}
export function retryAll() {
  for (const r of items) if (r.status === 'failed' && !r.error) attempt(r.cid)
}
/** Called with (record, serverAnswer) whenever a queued clip arrives */
export function onSent(fn) { sentHandlers.add(fn); return () => sentHandlers.delete(fn) }

export function clearOutbox() {
  items = []
  emit()
  tx('readwrite', s => s.clear()).catch(() => {})
}

export function useOutbox(filter) {
  const all = useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => items)
  return filter ? all.filter(filter) : all
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', retryAll)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && retryAll())
}
