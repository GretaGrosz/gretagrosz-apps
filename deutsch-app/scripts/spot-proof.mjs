import { readFileSync } from 'node:fs'
import { makeProofread, parseParagraph } from '../src/generators/proofread.js'
import { rng } from '../src/generators/index.js'
const P = JSON.parse(readFileSync(new URL('../data/korrektur.json', import.meta.url)))
const r = rng(3)
for (const p of P.slice(0, Number(process.argv[2] || 3))) {
  const g = makeProofread(p.text, r)
  console.log(p.id, g.count, 'errors')
  console.log(g.tokens.map((t) => (t.error ? `[${t.shown}→${t.right}:${t.error.cat}]` : t.shown)).join(' '))
  const words = parseParagraph(p.text).length
  console.log('words', words, '\n')
}
