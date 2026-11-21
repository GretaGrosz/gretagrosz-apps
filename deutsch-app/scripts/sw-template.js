// Deutsch Lock-In's service worker (generated at build time from scripts/sw-template.js).
// The app keeps everything on the phone, so after the first visit it opens instantly, also with no connection.
// - the app shell and its files are cached when the worker installs, one cache per build version
// - opening the app: the cached page right away, refreshed in the background
// - everything else (e.g. the word list of a language): from the cache, otherwise fetched once and kept
const VERSION = '__VERSION__'
const PRECACHE = __PRECACHE__
const CACHE = `deutsch-${VERSION}`
const scoped = (file) => new URL(file, self.registration.scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map(scoped)))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = await caches.open(CACHE)
      for (const key of await caches.keys()) {
        if (key === CACHE || !key.startsWith('deutsch-')) continue
        // carry over the language files that were already downloaded, if this build still uses them
        const old = await caches.open(key)
        for (const request of await old.keys()) {
          if (/\/assets\/.+\.js$/.test(request.url) && !(await keep.match(request))) {
            const response = await old.match(request)
            if (response) await keep.put(request, response)
          }
        }
        await caches.delete(key)
      }
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || !request.url.startsWith(self.registration.scope)) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        const cached = await cache.match(scoped('./'))
        const fresh = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(scoped('./'), response.clone())
            return response
          })
          .catch(() => null)
        if (cached) {
          event.waitUntil(fresh)
          return cached
        }
        return (await fresh) || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok && url.pathname.includes('/assets/')) cache.put(request, response.clone())
      return response
    })(),
  )
})
