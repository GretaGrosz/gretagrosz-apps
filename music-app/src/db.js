// Everything lives on the device, in IndexedDB: the song list (with tags and cover art), the audio files
// themselves in their own store (so opening the library never reads megabytes of audio), and the playlists.
const DB_NAME = 'tape'
let dbp

function open() {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      db.createObjectStore('tracks', { keyPath: 'id' })
      db.createObjectStore('audio')
      db.createObjectStore('playlists', { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbp
}

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve()
  tx.onerror = tx.onabort = () => reject(tx.error)
})
const result = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result)
  req.onerror = () => reject(req.error)
})

async function all(store) {
  const db = await open()
  return result(db.transaction(store).objectStore(store).getAll())
}

export const allTracks = () => all('tracks')
export const allPlaylists = () => all('playlists')

export async function audioFor(id) {
  const db = await open()
  return result(db.transaction('audio').objectStore('audio').get(id))
}

export async function addTrack(track, blob) {
  const db = await open()
  const tx = db.transaction(['tracks', 'audio'], 'readwrite')
  tx.objectStore('audio').put(blob, track.id)
  tx.objectStore('tracks').put(track)
  return done(tx)
}

export async function deleteTrack(id) {
  const db = await open()
  const tx = db.transaction(['tracks', 'audio', 'playlists'], 'readwrite')
  tx.objectStore('tracks').delete(id)
  tx.objectStore('audio').delete(id)
  // Take the song out of every playlist too
  const lists = tx.objectStore('playlists')
  lists.getAll().onsuccess = (e) => {
    for (const p of e.target.result) {
      if (p.trackIds.includes(id)) lists.put({ ...p, trackIds: p.trackIds.filter((t) => t !== id) })
    }
  }
  return done(tx)
}

export async function savePlaylist(playlist) {
  const db = await open()
  const tx = db.transaction('playlists', 'readwrite')
  tx.objectStore('playlists').put(playlist)
  return done(tx)
}

export async function deletePlaylist(id) {
  const db = await open()
  const tx = db.transaction('playlists', 'readwrite')
  tx.objectStore('playlists').delete(id)
  return done(tx)
}

// Ask the browser not to clear the library when the device runs low on space
export async function keepStorage() {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* not supported */
  }
}

export async function storageUse() {
  try {
    const { usage, quota } = await navigator.storage.estimate()
    return { usage, quota }
  } catch {
    return null
  }
}
