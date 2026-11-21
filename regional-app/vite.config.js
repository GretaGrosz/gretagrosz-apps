import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Writes sw.js with the exact files of this build, so the app opens offline and a new deploy
// replaces the old cache in one step (the cache name is a hash of the file list).
function serviceWorker() {
  return {
    name: 'qed-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const statics = ['icon-180.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest']
      const list = ['./', ...files, ...statics]
      let h = 0
      for (const ch of list.join('|')) h = (Math.imul(31, h) + ch.charCodeAt(0)) | 0
      const version = (h >>> 0).toString(36)
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// QED offline cache (generated at build time)
const CACHE = 'qed-${version}'
const FILES = ${JSON.stringify(list)}
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
`,
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  server: {
    // The app shares the marker's prompts with the Worker (../worker/qed-prompts.js)
    fs: { allow: ['..'] },
    // In development the marking API comes from `wrangler dev --port 5219`
    proxy: { '/qed/api': { target: 'http://127.0.0.1:5219', changeOrigin: true } },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/react') || id.includes('node_modules/scheduler') ? 'react' : undefined),
      },
    },
  },
})
