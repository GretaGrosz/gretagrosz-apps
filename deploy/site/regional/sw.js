// QED offline cache (generated at build time)
const CACHE = 'qed-ny1q6x'
const FILES = ["./","assets/index-BaBGzjR1.css","assets/react-ebxS2RN4.js","assets/index-D_4gftBx.js","assets/App-BFyAASdY.js","assets/days-01-fa4KBXOq.js","assets/days-02-DK_bLzJ1.js","assets/days-03-CFVatMtk.js","assets/days-A-Jrh4c6FV.js","assets/days-G-BFOpFsbK.js","assets/days-K-UlvpORKh.js","assets/days-N-D-yIHF4f.js","assets/reused-B2aRSaDa.js","assets/gwf-uclRWCQ4.js","assets/reference-nyrJ6U2n.js","icon-180.png","icon-192.png","icon-512.png","manifest.webmanifest"]
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('qed-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return
  if (req.mode === 'navigate') {
    // The app shell from the cache at once; a fresh copy is fetched in the background for next time
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const cached = await c.match('./')
        const fresh = fetch(req).then((res) => (res.ok && c.put('./', res.clone()), res)).catch(() => cached)
        return cached || fresh
      }),
    )
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok && url.pathname.includes('/assets/')) caches.open(CACHE).then((c) => c.put(req, res.clone()))
    return res
  })))
})
