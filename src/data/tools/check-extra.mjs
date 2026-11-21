// Prüft neue Fragen- und Karteikartendateien auf Format und Übersetzungen.
// Aufruf: node src/data/tools/check-extra.mjs zusatzfragen/jg1e.js karten/jg1e.js …   (Pfade relativ zu src/data)
// Ohne Argumente: alle zusatzfragen/jg*.js und karten/jg*.js
import { readdirSync } from 'node:fs'

const here = new URL('..', import.meta.url)
const { jahrgaenge } = await import(new URL('curriculum.js', here))
const topicIds = new Set(jahrgaenge.flatMap((j) => j.topics.map((t) => t.id)))
const LANGS = ['de', 'en', 'hu']
const TYPES = ['mc', 'tf', 'multi', 'order', 'match', 'text', 'number']

let files = process.argv.slice(2)
if (!files.length)
  files = [
    ...readdirSync(new URL('zusatzfragen/', here)).filter((f) => /^jg\d/.test(f)).map((f) => `zusatzfragen/${f}`),
    ...readdirSync(new URL('karten/', here)).filter((f) => /^jg\d/.test(f)).map((f) => `karten/${f}`),
  ]

let errors = 0
const err = (where, msg) => {
  errors++
  console.log(`✗ ${where}: ${msg}`)
}
const str = (v) => typeof v === 'string' && v.trim().length > 0
const strs = (v, n) => Array.isArray(v) && v.length >= n && v.every(str)

function checkQuestion(x, where) {
  if (!TYPES.includes(x.type)) return err(where, `unbekannter type ${x.type}`)
  if (![1, 2, 3].includes(x.level)) err(where, 'level muss 1, 2 oder 3 sein')
  for (const l of LANGS) {
    const tr = x[l]
    if (!tr) {
      err(where, `Sprache ${l} fehlt`)
      continue
    }
    if (!str(tr.q)) err(where, `${l}.q fehlt`)
    if (!str(tr.e)) err(where, `${l}.e (Erklärung) fehlt`)
    if (x.type === 'mc' && (!strs(tr.o, 4) || tr.o.length !== 4)) err(where, `${l}.o braucht genau 4 Antworten`)
    if (x.type === 'multi' && (!strs(tr.o, 4) || tr.o.length > 6)) err(where, `${l}.o braucht 4–6 Antworten`)
    if (x.type === 'order' && (!strs(tr.o, 3) || tr.o.length > 7)) err(where, `${l}.o braucht 3–7 Schritte`)
    if (x.type === 'match' && (!Array.isArray(tr.p) || tr.p.length < 3 || tr.p.length > 5 || !tr.p.every((p) => Array.isArray(p) && p.length === 2 && p.every(str))))
      err(where, `${l}.p braucht 3–5 Paare [links, rechts]`)
    if (x.type === 'text' && !strs(tr.a, 1)) err(where, `${l}.a braucht mindestens eine akzeptierte Antwort`)
    if (['mc', 'multi', 'order'].includes(x.type) && tr.o && x.de.o && tr.o.length !== x.de.o.length) err(where, `${l}.o hat andere Länge als de`)
    if (x.type === 'match' && tr.p && x.de.p && tr.p.length !== x.de.p.length) err(where, `${l}.p hat andere Länge als de`)
    if (x.type === 'order' && tr.o && new Set(tr.o).size !== tr.o.length) err(where, `${l}.o enthält doppelte Schritte`)
    if (x.type === 'match' && tr.p && new Set(tr.p.map((p) => p[1])).size !== tr.p.length) err(where, `${l}.p rechte Seite doppelt`)
  }
  if (x.type === 'mc' && ![0, 1, 2, 3].includes(x.correctIndex)) err(where, 'correctIndex 0–3 fehlt')
  if (x.type === 'tf' && typeof x.correct !== 'boolean') err(where, 'correct muss true oder false sein')
  if (x.type === 'multi') {
    const n = x.de?.o?.length ?? 0
    if (!Array.isArray(x.correct) || x.correct.length < 2 || x.correct.length >= n || !x.correct.every((c) => Number.isInteger(c) && c >= 0 && c < n) || new Set(x.correct).size !== x.correct.length)
      err(where, 'correct muss 2 bis (Anzahl−1) verschiedene gültige Indizes enthalten')
  }
  if (x.type === 'number') {
    if (typeof x.value !== 'number' || Number.isNaN(x.value)) err(where, 'value (Zahl) fehlt')
    if (typeof x.tol !== 'number') err(where, 'tol (Toleranz) fehlt')
    if (x.unit && !LANGS.every((l) => typeof x.unit[l] === 'string')) err(where, 'unit braucht de/en/hu')
  }
}

function checkCard(c, where) {
  for (const l of LANGS) {
    const tr = c[l]
    if (!tr) err(where, `Sprache ${l} fehlt`)
    else {
      if (!str(tr.term)) err(where, `${l}.term fehlt`)
      if (!str(tr.erklaerung)) err(where, `${l}.erklaerung fehlt`)
      if (tr.beispiel !== undefined && !str(tr.beispiel)) err(where, `${l}.beispiel leer`)
      if (str(tr.erklaerung) && tr.erklaerung.length > 260) err(where, `${l}.erklaerung zu lang (${tr.erklaerung.length} > 260 Zeichen)`)
    }
  }
}

const stats = {}
for (const f of files) {
  const mod = (await import(new URL(f, here))).default
  const isCards = f.startsWith('karten/')
  for (const [topicId, list] of Object.entries(mod)) {
    if (!topicIds.has(topicId)) err(`${f} ${topicId}`, 'unbekannte Themen-ID')
    if (!Array.isArray(list)) {
      err(`${f} ${topicId}`, 'muss eine Liste sein')
      continue
    }
    list.forEach((x, i) => {
      const where = `${f} ${topicId}[${i}]`
      if (isCards) checkCard(x, where)
      else {
        checkQuestion(x, where)
        stats[x.type] = (stats[x.type] ?? 0) + 1
      }
    })
    if (isCards) stats.karten = (stats.karten ?? 0) + list.length
  }
}
console.log(errors ? `\n${errors} Fehler` : '✓ alles in Ordnung', stats)
process.exit(errors ? 1 : 0)
