// Checks every hand-written item: structure, answers in options, gap counts, fix items differ, word banks join up.
//   node scripts/check-content.mjs          errors only
//   node scripts/check-content.mjs --dump   also print every item (for proofreading)
import { readFileSync, readdirSync } from 'node:fs'
import { normalize, bankTokens } from '../src/lib/check.js'
const dir = new URL('../data/units/', import.meta.url)
const dump = process.argv.includes('--dump')
let n = 0, errors = 0, repeats = 0
const byType = {}
const seen = new Map()
const err = (id, msg, it) => { errors++; console.log(`✗ ${id}: ${msg}\n   ${JSON.stringify(it).slice(0, 200)}`) }
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
  const u = JSON.parse(readFileSync(new URL(f, dir)))
  for (const k of ['id', 'n', 'phase', 'title', 'tips', 'lessons']) if (!(k in u)) err(f, 'missing ' + k, {})
  for (const k of ['de', 'en', 'contrast', 'examples']) if (!u.tips[k]) err(f, 'tips missing ' + k, {})
  for (const l of u.lessons) {
    l.items.forEach((it, i) => {
      const id = `${l.id}.${i}`
      n++; byType[it.t] = (byType[it.t] || 0) + 1
      const key = it.t + JSON.stringify(it.q || it.w || it.en || '') + JSON.stringify(it.a ?? it.pairs)
      // the same sentence in another unit is fine (Greta's mistakes are repeated on purpose); inside one lesson it is not
      if (seen.has(key) && seen.get(key).split('.')[0] === l.id) err(id, 'duplicate in lesson: ' + seen.get(key), it)
      else if (seen.has(key)) repeats++
      seen.set(key, id)
      if (it.t === 'mc') {
        if (!it.o?.includes(it.a)) err(id, 'answer not in options', it)
        if (new Set(it.o).size !== it.o.length) err(id, 'duplicate options', it)
      }
      if (it.t === 'gap') {
        const blanks = (it.q.match(/___/g) || []).length
        const ans = [].concat(it.a)
        if (blanks !== ans.length) err(id, `blanks ${blanks} ≠ answers ${ans.length}`, it)
        if (it.o && !it.o.includes(ans[0])) err(id, 'gap answer not in options', it)
      }
      if (it.t === 'fix') {
        if (normalize(it.w) === normalize(it.a)) err(id, 'fix: wrong == right', it)
      }
      if (it.t === 'order') {
        const joined = it.chunks ? normalize(it.chunks.join(' ')) : normalize(bankTokens(it.a).join(' '))
        if (joined.replace(/[.!?]$/, '') !== normalize(it.a).replace(/[.!?]$/, '')) err(id, 'order chunks do not join to answer: ' + joined, it)
      }
      if (it.t === 'match' && (!it.pairs || it.pairs.length < 3)) err(id, 'match needs ≥3 pairs', it)
      if (it.t === 'komma' && !it.a.includes(',')) err(id, 'komma item without comma', it)
      if (['tf', 'tr', 'listen'].includes(it.t) && !it.a) err(id, 'no answer', it)
      if (it.y && it.y.length < 2) err(id, 'why needs ≥2 options', it)
      if (dump) console.log(`${id} [${it.t}] ${it.q || it.w || it.en || ''} → ${JSON.stringify(it.a)}${it.acc ? ' | ' + it.acc.join(' | ') : ''}`)
    })
  }
}
console.log(`\n${n} hand-written items (${repeats} repeated on purpose in a later unit), ${errors} problems`, byType)
process.exit(errors ? 1 : 0)
