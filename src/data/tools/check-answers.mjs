// Prüft, ob man Multiple-Choice-Fragen an der Länge der Antworten erraten kann.
// Aufruf (im Projektordner): node src/data/tools/check-answers.mjs [--all]
// Zeigt pro Thema und Sprache, wie oft die richtige Antwort die (strikt) längste ist.
// Ziel: höchstens 30 % pro Thema. --all listet zusätzlich jede Frage, bei der die richtige
// Antwort mehr als 1,3-mal so lang ist wie die längste falsche.
const here = new URL('..', import.meta.url)
const { jahrgaenge } = await import(new URL('curriculum.js', here))
const LANGS = ['de', 'en', 'hu']
const LIMIT = 0.3
const showAll = process.argv.includes('--all')

const longest = (o, c) => o.every((x, i) => i === c || x.length < o[c].length)
const total = Object.fromEntries(LANGS.map((l) => [l, [0, 0]]))
let worst = 0
const rows = []

for (const j of jahrgaenge) {
  const de = (await import(new URL(`fragen/de/jg${j.id}.js`, here))).default
  const zusatz = (await import(new URL(`zusatzfragen/year${j.id}.js`, here))).default
  const tr = {}
  for (const l of ['en', 'hu']) tr[l] = (await import(new URL(`translations/${l}/jg${j.id}.js`, here))).default.questions
  for (const t of j.topics) {
    const per = Object.fromEntries(LANGS.map((l) => [l, [0, 0]]))
    const flagged = []
    const items = (de[t.id] ?? []).map((q, i) => ({
      id: i,
      de: q,
      en: tr.en[t.id]?.[i],
      hu: tr.hu[t.id]?.[i],
    }))
    ;(zusatz[t.id] ?? []).forEach((x, n) => {
      if (x.type !== 'mc') return
      const m = (l) => ({ options: x[l].o, correctIndex: x.correctIndex })
      items.push({ id: `x${n}`, de: m('de'), en: m('en'), hu: m('hu') })
    })
    for (const it of items) for (const l of LANGS) {
      const q = it[l]
      if (!q) continue
      per[l][1]++
      if (longest(q.options, q.correctIndex)) per[l][0]++
      const others = q.options.filter((_, i) => i !== q.correctIndex).map((o) => o.length)
      if (q.options[q.correctIndex].length > 1.3 * Math.max(...others)) flagged.push(`${l}#${it.id}`)
    }
    for (const l of LANGS) { total[l][0] += per[l][0]; total[l][1] += per[l][1] }
    const shares = LANGS.map((l) => (per[l][1] ? per[l][0] / per[l][1] : 0))
    worst = Math.max(worst, ...shares)
    rows.push({ year: j.id, topic: t.id, shares, n: per.de[1], flagged })
  }
}

const pct = (x) => `${Math.round(x * 100)}%`.padStart(4)
for (const r of rows) {
  const mark = r.shares.some((s) => s > LIMIT) ? '!!' : '  '
  console.log(`${mark} ${r.year} ${r.topic.padEnd(42)} ${String(r.n).padStart(3)} Fragen  de ${pct(r.shares[0])}  en ${pct(r.shares[1])}  hu ${pct(r.shares[2])}`)
  if (showAll && r.flagged.length) console.log(`      >1,3×: ${r.flagged.join(' ')}`)
}
console.log(`\nRichtige Antwort ist die längste: ${LANGS.map((l) => `${l} ${total[l][0]}/${total[l][1]} = ${((100 * total[l][0]) / total[l][1]).toFixed(1)} %`).join(' · ')}`)
console.log(`Schlechtestes Thema: ${pct(worst).trim()} (Grenze ${pct(LIMIT).trim()})`)
process.exitCode = worst > LIMIT ? 1 : 0
