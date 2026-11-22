import { createHash } from 'node:crypto'
import { readdirSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BW Buddy (root src/). Beim Build entsteht zusätzlich sw.js: ein Service Worker, der die App-Hülle
// vorab speichert und jede nachgeladene Datei (Inhalte pro Sprache/Jahrgang) beim ersten Abruf ablegt.
// So öffnet die App auch ohne Netz, und wiederholte Starts brauchen keinen Netzwerk-Umweg.
function serviceWorker() {
  return {
    name: 'bw-buddy-service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const shell = new Set(['./', 'manifest.webmanifest'])
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk' && file.isEntry) {
          shell.add(file.fileName)
          file.imports.forEach((f) => shell.add(f))
          file.viteMetadata?.importedCss?.forEach((f) => shell.add(f))
        }
        // Seiten-Dateien (nicht die großen Inhaltspakete unter src/data und nicht das 3D-Spiel unter src/game,
        // das erst beim Öffnen von /spiel geladen und dann abgelegt wird) gehören zur Hülle
        if (file.type === 'chunk' && file.isDynamicEntry && file.facadeModuleId && !/\/src\/(data|game)\//.test(file.facadeModuleId)) {
          shell.add(file.fileName)
          file.imports.forEach((f) => shell.add(f))
        }
        if (file.type === 'asset' && file.fileName.endsWith('.css')) shell.add(file.fileName)
      }
      try {
        readdirSync('public').filter((f) => /\.(png|svg|webmanifest)$/.test(f) && f !== 'og.png').forEach((f) => shell.add(f))
      } catch {
        /* kein public-Ordner */
      }
      const files = [...shell].sort()
      const version = createHash('sha256').update(files.join('|')).digest('hex').slice(0, 12)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: swSource(version, files) })
    },
  }
}

function swSource(version, files) {
  return `// Erzeugt beim Build (vite.config.js) – nicht von Hand bearbeiten.
const CACHE = 'bw-buddy-${version}'
const SHELL = ${JSON.stringify(files)}
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
  // Konto-API (/bwbuddy/api/*) nie aus dem Speicher
  if (url.pathname.includes('/api/')) return

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
`
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  // Nur beim Entwickeln: die Konto-API (worker/bwbuddy-account.js) vom lokalen `npx wrangler dev --port 8799`.
  // Der Worker nimmt Schreibzugriffe nur von der eigenen Adresse an, darum bekommt die Weiterleitung dessen Origin.
  server: {
    proxy: {
      '/bwbuddy/api': {
        target: 'http://localhost:8799',
        changeOrigin: true,
        configure: (proxy) => proxy.on('proxyReq', (req) => { if (req.getHeader('origin')) req.setHeader('origin', 'http://localhost:8799') }),
      },
    },
  },
  build: {
    // Die Inhalte (pro Sprache und Jahrgang) sind bewusst große, nachgeladene Pakete
    chunkSizeWarningLimit: 700,
  },
})
