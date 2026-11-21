// Your photos live in IndexedDB as real image files (not text in localStorage), so hundreds fit.
// The app data only keeps a reference like "idb:ph_x7k2…". Older versions stored photos as data: URLs;
// those still display, and the store moves them over on first start (see store.jsx).
import { useEffect, useState } from 'react'
import { uid } from './data'

const DB_NAME = 'blank-media'
const STORE = 'photos'
const STATE = 'state' // a second copy of the app data, for when localStorage is full

export class MediaError extends Error {
  constructor(code, cause) {
    super(code)
    this.code = code // 'type' | 'decode' | 'quota' | 'unavailable' | 'write'
    this.cause = cause
  }
}

let dbPromise = null
function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new MediaError('unavailable'))
    let req
    try {
      req = indexedDB.open(DB_NAME, 2)
    } catch (e) {
      return reject(new MediaError('unavailable', e))
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      if (!db.objectStoreNames.contains(STATE)) db.createObjectStore(STATE)
    }
    req.onsuccess = () => {
      const db = req.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
    req.onerror = () => reject(new MediaError('unavailable', req.error))
    req.onblocked = () => reject(new MediaError('unavailable'))
  }).catch((e) => {
    dbPromise = null
    throw e
  })
  return dbPromise
}

const isQuota = (e) => e && (e.name === 'QuotaExceededError' || e.code === 22 || /quota/i.test(e.message || ''))

async function run(mode, fn, storeName = STORE) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    let tx
    try {
      tx = db.transaction(storeName, mode)
    } catch (e) {
      return reject(new MediaError('unavailable', e))
    }
    const store = tx.objectStore(storeName)
    let result
    Promise.resolve(fn(store)).then((r) => (result = r))
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(new MediaError(isQuota(tx.error) ? 'quota' : 'write', tx.error))
    tx.onabort = () => reject(new MediaError(isQuota(tx.error) ? 'quota' : 'write', tx.error))
  })
}
const req = (r) =>
  new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })

// ---- in-memory cache of object URLs, so a photo you already saw shows with no wait ----
const urls = new Map() // id -> object URL
const listeners = new Map() // id -> Set(callback)
const loading = new Map()

// Stored as { type, buf } (bytes), not as a Blob: Safari can't store Blobs in IndexedDB in private browsing
const asBlob = (v) => (!v ? null : v instanceof Blob ? v : v.buf ? new Blob([v.buf], { type: v.type || 'image/jpeg' }) : null)
const asRecord = async (blob) => ({ type: blob.type, buf: await blob.arrayBuffer() })

const idOf = (ref) => (ref?.startsWith('idb:') ? ref.slice(4) : null)
export const isLocalPhoto = (ref) => !!idOf(ref)

function remember(id, blob) {
  const old = urls.get(id)
  if (old) URL.revokeObjectURL(old)
  const url = URL.createObjectURL(blob)
  urls.set(id, url)
  listeners.get(id)?.forEach((cb) => cb(url))
  return url
}

function load(id) {
  if (urls.has(id)) return Promise.resolve(urls.get(id))
  if (!loading.has(id)) {
    loading.set(
      id,
      run('readonly', (s) => req(s.get(id)))
        .then((v) => (asBlob(v) ? remember(id, asBlob(v)) : null))
        .catch(() => null)
        .finally(() => loading.delete(id)),
    )
  }
  return loading.get(id)
}

// Load every stored photo into memory in one go at startup
export async function warmPhotos() {
  try {
    await run('readonly', async (s) => {
      const [keys, values] = await Promise.all([req(s.getAllKeys()), req(s.getAll())])
      keys.forEach((k, i) => !urls.has(k) && asBlob(values[i]) && remember(k, asBlob(values[i])))
    })
  } catch {}
}

export async function savePhoto(blob) {
  const id = uid('ph')
  const record = await asRecord(blob)
  await run('readwrite', (s) => s.put(record, id))
  remember(id, blob)
  return `idb:${id}`
}

// A photo that came from your account (account.jsx): stored under the same id it has on your other devices
export async function savePhotoAs(ref, blob) {
  const id = idOf(ref)
  if (!id) return
  const record = await asRecord(blob)
  await run('readwrite', (s) => s.put(record, id))
  remember(id, blob)
}

export async function hasPhoto(ref) {
  const id = idOf(ref)
  if (!id) return false
  try {
    return (await run('readonly', (s) => req(s.count(id)))) > 0
  } catch {
    return false
  }
}

export async function getPhotoBlob(ref) {
  const id = idOf(ref)
  if (id) return asBlob(await run('readonly', (s) => req(s.get(id))))
  if (ref?.startsWith('data:')) return (await fetch(ref)).blob()
  return null
}

export async function deletePhotos(refs) {
  const ids = refs.map(idOf).filter(Boolean)
  if (!ids.length) return
  try {
    await run('readwrite', (s) => ids.forEach((id) => s.delete(id)))
  } catch {}
  ids.forEach((id) => {
    const u = urls.get(id)
    if (u) URL.revokeObjectURL(u)
    urls.delete(id)
  })
}

export async function clearPhotos() {
  try {
    await run('readwrite', (s) => s.clear())
  } catch {}
  urls.forEach((u) => URL.revokeObjectURL(u))
  urls.clear()
}

export async function photoStats() {
  try {
    return await run('readonly', async (s) => {
      const values = await req(s.getAll())
      return { count: values.length, bytes: values.reduce((n, v) => n + (asBlob(v)?.size || 0), 0) }
    })
  } catch {
    return null
  }
}

// The src to show for a photo reference: an IndexedDB photo or an old inline data: URL
export function usePhoto(ref) {
  const id = idOf(ref)
  const [url, setUrl] = useState(() => (id ? urls.get(id) || null : null))
  useEffect(() => {
    if (!id) return
    setUrl(urls.get(id) || null)
    const set = listeners.get(id) || new Set()
    set.add(setUrl)
    listeners.set(id, set)
    load(id).then((u) => u && setUrl(u))
    return () => set.delete(setUrl)
  }, [id])
  if (!ref) return null
  if (id) return url
  return ref
}

export async function photoUrl(ref) {
  const id = idOf(ref)
  if (id) return load(id)
  return ref
}

// ---- turning a picked file into a reasonably small image ----

function decode(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new MediaError('decode'))
    }
    img.src = url
  })
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

// Is any part of the picture see-through? Checked on a small copy, which is plenty for stickers and cut-outs.
function hasAlpha(img) {
  const s = Math.min(1, 160 / Math.max(img.naturalWidth, img.naturalHeight))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(img.naturalWidth * s))
  c.height = Math.max(1, Math.round(img.naturalHeight * s))
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, c.width, c.height)
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true
  return false
}

// Downscales to at most `max` px on the long edge. Photos become JPEG; anything with transparency stays
// transparent (WebP where the browser can write it, otherwise PNG), so cut-outs never get a black box.
// crop: the part to keep, as fractions of the picture ({ x, y, w, h }, from CropSheet), or null for all of it.
export async function processImage(file, { crop = null, max = 1600 } = {}) {
  const okType = !file.type || file.type.startsWith('image/') || /\.(heic|heif|jpe?g|png|webp|gif|avif)$/i.test(file.name || '')
  if (!okType) throw new MediaError('type')
  const { img, url } = await decode(file)
  try {
    if (!img.naturalWidth || !img.naturalHeight) throw new MediaError('decode')
    const sx = crop ? Math.round(crop.x * img.naturalWidth) : 0
    const sy = crop ? Math.round(crop.y * img.naturalHeight) : 0
    const w0 = crop ? Math.max(1, Math.min(img.naturalWidth - sx, Math.round(crop.w * img.naturalWidth))) : img.naturalWidth
    const h0 = crop ? Math.max(1, Math.min(img.naturalHeight - sy, Math.round(crop.h * img.naturalHeight))) : img.naturalHeight
    const scale = Math.min(1, max / Math.max(w0, h0))
    const w = Math.max(1, Math.round(w0 * scale))
    const h = Math.max(1, Math.round(h0 * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const mayHaveAlpha = /png|webp|gif|avif/i.test(file.type) || /\.(png|webp|gif|avif)$/i.test(file.name || '')
    const alpha = mayHaveAlpha && hasAlpha(img)
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, sx, sy, w0, h0, 0, 0, w, h)
    let blob
    if (alpha) {
      blob = await toBlob(canvas, 'image/webp', 0.9)
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/png')
    } else {
      blob = await toBlob(canvas, 'image/jpeg', 0.84)
    }
    if (!blob) throw new MediaError('decode')
    // A small file that's already small enough: keep the original bytes
    if (!crop && scale === 1 && file.size && file.size < blob.size && /jpe?g|png|webp/i.test(file.type)) blob = file
    return { blob, ratio: h / w, alpha }
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Pick → crop → shrink → store. Returns { ref, ratio }.
export async function addPhotoFromFile(file, crop = null) {
  const { blob, ratio } = await processImage(file, { crop })
  try {
    const ref = await savePhoto(blob)
    return { ref, ratio }
  } catch (e) {
    throw e instanceof MediaError ? e : new MediaError(isQuota(e) ? 'quota' : 'write', e)
  }
}

export const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

export const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob()

// The app data's second home: written on every save, read at start if it's newer than localStorage
export const saveStateCopy = (json) => run('readwrite', (s) => s.put(json, 'data'), STATE)
export const loadStateCopy = () => run('readonly', (s) => req(s.get('data')), STATE).catch(() => null)
export const clearStateCopy = () => run('readwrite', (s) => s.delete('data'), STATE).catch(() => {})

// Ask the browser not to clear our storage when the device is low on space (where supported)
export function askPersistentStorage() {
  try {
    navigator.storage?.persisted?.().then((already) => !already && navigator.storage.persist?.())
  } catch {}
}
