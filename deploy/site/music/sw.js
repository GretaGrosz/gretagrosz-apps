// Tape service worker (generated at build time by music-app/vite.config.js)
const CACHE = 'tape-wcv2th'
const FILES = ["./","assets/index-B6OTKjuz.css","assets/index-Bw_lyx6P.js","icon-32.png","icon-180.png","icon-192.png","icon-512.png","manifest.webmanifest","themes/block.svg","themes/grass.svg","themes/sparkle.svg","themes/stone.svg"]
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('tape-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith('/music/')) return
  if (req.mode === 'navigate') {
    // The app from the cache at once; a fresh copy is fetched in the background for next time
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = await c.match('./')
      const fresh = fetch(req).then(res => (res.ok && c.put('./', res.clone()), res)).catch(() => cached)
      return cached || fresh
    }))
    return
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && url.pathname.includes('/assets/')) caches.open(CACHE).then(c => c.put(req, res.clone()))
    return res
  })))
})
