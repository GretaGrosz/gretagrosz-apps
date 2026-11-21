import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Deutsch Lock-In. Built with: npm run build:deutsch (repo root) -> deploy/site/deutsch/
// The service worker (sw.js) is written at build time with the list of built files, so the app opens offline.
const here = path.dirname(fileURLToPath(import.meta.url))

function serviceWorker() {
  return {
    name: 'deutsch-sw',
    apply: 'build',
    enforce: 'post',
    generateBundle(_o, bundle) {
      const files = Object.keys(bundle).filter((f) => f !== 'index.html' && f !== 'sw.js')
      const statics = fs.readdirSync(path.join(here, 'public')).filter((f) => !f.startsWith('.'))
      const precache = ['./', ...new Set([...files, ...statics])].sort()
      const version = createHash('sha1').update(JSON.stringify(precache)).digest('hex').slice(0, 10)
      const source = fs.readFileSync(path.join(here, 'scripts/sw-template.js'), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  root: here,
  base: './',
  plugins: [react(), serviceWorker()],
  build: { chunkSizeWarningLimit: 1500 },
})
