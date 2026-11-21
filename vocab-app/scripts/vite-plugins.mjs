// Build-time helpers for Deca.
// 1. decaVocab: the word data (src/words.js, all five languages in one row) is split into one chunk per language,
//    so the app only downloads the two languages you use (`virtual:deca-lang/<id>`), plus a tiny theme list.
//    Vocab edits need a dev-server restart (Node caches the imported data files).
// 2. decaServiceWorker: writes sw.js with the exact list of built files, versioned by their hashes, so the app
//    opens offline from the Home Screen. Language chunks are cached the first time they are used.
import { createHash } from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const LANG = 'virtual:deca-lang/'
const THEMES = 'virtual:deca-themes'

export function decaVocab() {
  let data
  const words = async () => (data ||= await import(pathToFileURL(path.join(here, '../src/words.js')).href))
  return {
    name: 'deca-vocab',
    resolveId(id) {
      if (id === THEMES || id.startsWith(LANG)) return '\0' + id
    },
    async load(id) {
      if (id === '\0' + THEMES) {
        const { DAYS } = await words()
        return `export default ${JSON.stringify(DAYS.map((d) => d.theme))}`
      }
      if (id.startsWith('\0' + LANG)) {
        const { DAYS, LANGUAGES } = await words()
        const lang = LANGUAGES.find((l) => l.id === id.slice(LANG.length + 1))
        if (!lang) throw new Error(`Unknown language chunk ${id}`)
        return `export default ${JSON.stringify(DAYS.map((d) => d.words.map((row) => row[lang.col])))}`
      }
    },
  }
}

export function decaServiceWorker() {
  return {
    name: 'deca-sw',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = []
      const lazy = []
      for (const [name, chunk] of Object.entries(bundle)) {
        if (name === 'sw.js') continue
        if (chunk.type === 'chunk' && chunk.facadeModuleId?.startsWith('\0' + LANG)) lazy.push(name)
        else files.push(name)
      }
      const publicDir = path.join(here, '../public')
      const statics = fs.existsSync(publicDir) ? fs.readdirSync(publicDir).filter((f) => f !== 'sw.js' && !f.startsWith('.') && f !== 'og.png') : []
      const precache = ['./', ...new Set([...files.filter((f) => f !== 'index.html'), ...statics])].sort()
      const version = createHash('sha1').update(JSON.stringify([precache, lazy.sort()])).digest('hex').slice(0, 10)
      const source = fs.readFileSync(path.join(here, 'sw-template.js'), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}
