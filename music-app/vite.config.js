import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { readdirSync } from 'node:fs'

// Writes sw.js with the exact files of this build: the app opens instantly and with no internet, and a new deploy
// replaces the old cache in one step (the cache name is a hash of the file list). The songs themselves are not
// in here: they live in IndexedDB (src/db.js).
function serviceWorker() {
  return {
    name: 'tape-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'))
      const themes = readdirSync(fileURLToPath(new URL('public/themes', import.meta.url))).map(f => 'themes/' + f)
      const list = ['./', ...files, 'icon-32.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest', ...themes]
      let h = 0
      for (const ch of list.join('|')) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0
      const version = (h >>> 0).toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Tape service worker (generated at build time by music-app/vite.config.js)
const CACHE = 'tape-${version}'
const FILES = ${JSON.stringify(list)}
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
`,
      })
    },
  }
}

// Builds straight into the site at /music/ (npm run build:music)
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/music/',
  plugins: [react(), serviceWorker()],
  build: { outDir: '../deploy/site/music', emptyOutDir: true },
})
