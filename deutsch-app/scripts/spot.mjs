import { GENERATORS, rng } from '../src/generators/index.js'
const r = rng(Number(process.argv[3] || 7))
const names = process.argv[2] ? process.argv[2].split(',') : Object.keys(GENERATORS)
const n = Number(process.argv[4] || 4)
for (const name of names) for (let i = 0; i < n; i++) {
  const it = GENERATORS[name](r)
  const show = it.t === 'order' ? it.chunks.join(' | ') + '  =>  ' + it.a : it.q.replace(/\n/g, ' / ') + '  =>  ' + JSON.stringify(it.a) + (it.acc?.length ? ' acc:' + JSON.stringify(it.acc) : '') + (it.h ? ' ' + it.h : '')
  console.log(name.padEnd(14), it.t.padEnd(6), show)
}
