// Erzeugt beim Build (vite.config.js) – nicht von Hand bearbeiten.
const CACHE = 'bw-buddy-8e32deed0f87'
const SHELL = ["./","apple-touch-icon.png","assets/BuildAnswer-C79NvrWh.js","assets/DeTerm-CtxlyANO.js","assets/Einstellungen-CeMafKL4.js","assets/Karten-CuBkVuaH.js","assets/LernInhalt-Dd0K0CEj.js","assets/Pruefung-Dn5_4ucj.js","assets/Quiz-DhIjrVWN.js","assets/Sheet-RHYgAAkm.js","assets/Termine-CCYQUtMN.js","assets/Wiederholen-DuLc7Omh.js","assets/index-BIoIB9NV.js","assets/index-DMyC1YHH.css","favicon.png","icon-192.png","icon-512.png","icon-maskable-512.png","manifest.webmanifest"]
const scope = self.registration.scope
const abs = (f) => new URL(f, scope).href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map(abs))).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('bw-buddy-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (!url.href.startsWith(scope)) return

  // Seite selbst: sofort aus dem Speicher, im Hintergrund aktualisieren
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(abs('./'))
        const fresh = fetch(req).then((res) => {
          if (res.ok) cache.put(abs('./'), res.clone())
          return res
        })
        if (cached) {
          event.waitUntil(fresh.catch(() => {}))
          return cached
        }
        return fresh
      }),
    )
    return
  }

  // Dateien mit Hash im Namen ändern sich nie: Speicher zuerst, sonst laden und ablegen
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req)
        if (cached) return cached
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // Symbole, Manifest: Speicher zuerst, im Hintergrund erneuern
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const fresh = fetch(req).then((res) => {
        if (res.ok) cache.put(req, res.clone())
        return res
      })
      if (cached) {
        event.waitUntil(fresh.catch(() => {}))
        return cached
      }
      return fresh
    }),
  )
})
