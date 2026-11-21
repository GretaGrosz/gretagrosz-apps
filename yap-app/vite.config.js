import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Writes sw.js with the exact files of this build: the app opens instantly and offline from the Home Screen,
// a new deploy replaces the old cache in one step (the cache name is a hash of the file list), and it shows
// push notifications. API responses are never cached here; the app keeps its own last-known data.
function serviceWorker() {
  return {
    name: 'yap-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'))
      const statics = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'favicon.png', 'manifest.webmanifest', 'seed/welcome.m4a', 'seed/welcome-de.m4a']
      const list = ['./', ...files, ...statics]
      let h = 0
      for (const ch of list.join('|')) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0
      const version = (h >>> 0).toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Yap service worker (generated at build time): offline app shell, push notifications, notification taps
const CACHE = 'yap-${version}'
const FILES = ${JSON.stringify(list)}
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('yap-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', e => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith('/yap/') || url.pathname.startsWith('/yap/api/')) return
  if (req.mode === 'navigate') {
    // The shell from the cache at once; a fresh copy is fetched in the background for next time
    e.respondWith(caches.open(CACHE).then(async c => {
      const cached = await c.match('./')
      const fresh = fetch(req).then(res => (res.ok && c.put('./', res.clone()), res)).catch(() => cached)
      return cached || fresh
    }))
    return
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok && url.pathname.includes('/assets/')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)) }
    return res
  })))
})

self.addEventListener('push', e => {
  let d = {}
  try { d = e.data.json() } catch {}
  e.waitUntil(self.registration.showNotification(d.title || 'Yap', {
    body: d.body || '',
    tag: d.tag,
    renotify: !!d.tag,
    icon: '/yap/icon-192.png',
    data: { url: d.url || '' },
  }))
})
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || ''
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const app = open.find(c => new URL(c.url).pathname.startsWith('/yap/'))
    if (app) {
      await app.focus()
      app.postMessage({ type: 'open', url })
    } else {
      await self.clients.openWindow('/yap/' + url)
    }
  })())
})
`,
      })
    },
  }
}

// Builds straight into the site at /yap/ (npm run build:yap); the API is worker/yap.js
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/yap/',
  plugins: [react(), serviceWorker()],
  build: { outDir: '../deploy/site/yap', emptyOutDir: true },
})
