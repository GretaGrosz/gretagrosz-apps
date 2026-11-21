import { useEffect, useState } from 'react'
import { jahrgaenge, yearOfTopic } from './curriculum.js'

// INHALTE werden pro Sprache und Jahrgang erst geladen, wenn sie gebraucht werden ("Pakete").
// Die App selbst (Navigation, Titel, Fortschritt) ist sofort da; ein Paket kommt beim ersten Mal
// übers Netz und danach aus dem Cache (Service Worker + unveränderliche Dateinamen).
//
// Paket "de" je Jahrgang:
//   lerninhalte  ./lerninhalte/jgN.js     { [topicId]: { schritte: [{ titel, blocks }], zusammenfassung } }
//   questions    ./fragen/de/jgN.js       { [topicId]: [{ question, options, correctIndex, explanation }] }
//   zusatz       ./zusatzfragen/yearN.js  { [topicId]: [Zusatzfrage] }
//   karten       ./karten/yearN.js        { [topicId]: [{ de: { term, erklaerung, beispiel? }, en: {…}, hu: {…} }] }
//                (zusätzliche Karteikarten neben den "begriff"-Blöcken, alle Sprachen in einer Datei)
// Paket "en"/"hu" je Jahrgang: ./translations/<lang>/jgN.js → { lerninhalte, questions } (gleiche Struktur,
// fehlt etwas, wird Deutsch gezeigt). Für en/hu wird das deutsche Paket immer mitgeladen
// (Karteikarten-IDs, deutscher Fachbegriff, Schwierigkeitsstufen, deutsche Antworten bei Eingabefragen).
//
// Block-Typen in einem Lernschritt:
//   { type: 'text', text }
//   { type: 'begriff', term, erklaerung, beispiel? }          → wird automatisch zur Karteikarte
//   { type: 'merke', text }
//   { type: 'pyramide', stufen: [{ name, beispiel }] }         (oben → unten)
//   { type: 'vergleich', frage?, links: { titel, punkte }, rechts: { titel, punkte } }
//   { type: 'kette', glieder: [{ titel, wert }] }
//   { type: 'entscheidung', titel, schritte: [{ frage, links, rechts }] }
//   { type: 'prinzip', minimal, maximal }
//   { type: 'kreislaufDiagramm' } · { type: 'marktdiagramm' }
//   { type: 'ablauf', titel?, schritte: [{ titel, text? }] }
//   { type: 'tabelle', spalten: [...], zeilen: [[...]] }
//   { type: 'zyklus', mitte, schritte: ['…'] }
//   { type: 'formel', name, zaehler, nenner, faktor?, beispiel? }
//   { type: 'organe', oben, links, rechts: { name, punkte }, pfeile: { links, rechts, unten } }
//   { type: 'transportweg', titel, stationen: [4 Orte], risiko: index, kosten: index }
//
// Zusatzfragen (zusätzliche Fragen pro Thema mit fester Schwierigkeit, level 1 leicht · 2 mittel · 3 sehr schwer):
//   { type: 'text', level, de: { q, a: ['akzeptierte Antwort', …], e }, en: {…}, hu: {…} }   Begriff eintippen
//   { type: 'number', level, value, tol, unit: { de, en, hu }, de: { q, e }, … }               Ergebnis eintippen
//   { type: 'mc', level, correctIndex, de: { q, o: [4 Antworten], e }, … }
//   { type: 'tf', level, correct: true|false, de: { q: 'Aussage', e }, … }                     Richtig oder falsch
//   { type: 'multi', level, correct: [0, 2], de: { q, o: [4–6 Antworten], e }, … }            mehrere richtige Antworten
//   { type: 'order', level, de: { q, o: [Schritte in richtiger Reihenfolge], e }, … }         in Reihenfolge bringen
//   { type: 'match', level, de: { q, p: [[links, rechts], …], e }, … }                        zuordnen
// Prüfen: node src/data/tools/check-extra.mjs

const LOADERS = {
  de: {
    1: () => Promise.all([import('./lerninhalte/jg1.js'), import('./fragen/de/jg1.js'), import('./zusatzfragen/year1.js'), import('./karten/year1.js')]),
    2: () => Promise.all([import('./lerninhalte/jg2.js'), import('./fragen/de/jg2.js'), import('./zusatzfragen/year2.js'), import('./karten/year2.js')]),
    3: () => Promise.all([import('./lerninhalte/jg3.js'), import('./fragen/de/jg3.js'), import('./zusatzfragen/year3.js'), import('./karten/year3.js')]),
  },
  en: {
    1: () => import('./translations/en/jg1.js'),
    2: () => import('./translations/en/jg2.js'),
    3: () => import('./translations/en/jg3.js'),
  },
  hu: {
    1: () => import('./translations/hu/jg1.js'),
    2: () => import('./translations/hu/jg2.js'),
    3: () => import('./translations/hu/jg3.js'),
  },
}

const packs = {}
const pending = {}
const failed = {}
const listeners = new Set()

const keyOf = (lang, year) => `${lang}:${year}`
const validYear = (year) => jahrgaenge.some((j) => j.id === Number(year))

function loadOne(lang, year) {
  const key = keyOf(lang, year)
  if (packs[key]) return Promise.resolve(packs[key])
  if (pending[key]) return pending[key]
  delete failed[key]
  pending[key] = LOADERS[lang][year]()
    .then((mod) => {
      const pack = Array.isArray(mod)
        ? { lerninhalte: mod[0].default, questions: mod[1].default, zusatz: mod[2].default, karten: mod[3].default }
        : { lerninhalte: mod.default.lerninhalte ?? {}, questions: mod.default.questions ?? {} }
      packs[key] = pack
      delete pending[key]
      listeners.forEach((fn) => fn())
      return pack
    })
    .catch((error) => {
      delete pending[key]
      failed[key] = error
      listeners.forEach((fn) => fn())
      throw error
    })
  return pending[key]
}

// Lädt alles, was für `lang` im Jahrgang `year` gebraucht wird (Deutsch immer dabei).
export function loadContent(lang, year) {
  if (!validYear(year)) return Promise.resolve()
  const y = Number(year)
  const jobs = [loadOne('de', y)]
  if (lang !== 'de' && LOADERS[lang]) jobs.push(loadOne(lang, y))
  return Promise.all(jobs)
}

export function isLoaded(lang, year) {
  const y = Number(year)
  if (!validYear(y)) return true
  return Boolean(packs[keyOf('de', y)] && (lang === 'de' || !LOADERS[lang] || packs[keyOf(lang, y)]))
}

function failure(lang, year) {
  return failed[keyOf('de', year)] || (lang !== 'de' ? failed[keyOf(lang, year)] : null)
}

// Für React Suspense: liefert das Paket oder wirft das Lade-Promise (bzw. den Fehler).
function read(lang, year) {
  const y = Number(year)
  const pack = packs[keyOf(lang, y)]
  if (pack && (lang === 'de' || packs[keyOf('de', y)])) return pack
  const error = failure(lang, y)
  if (error) throw error
  throw loadContent(lang, y)
}

export function retryContent() {
  Object.keys(failed).forEach((k) => delete failed[k])
}

// Hook: stellt sicher, dass die Pakete geladen sind (wirft sonst für Suspense).
export function useContent(lang, years) {
  const list = [...new Set(years.filter(validYear).map(Number))]
  // alle gleichzeitig anstoßen, dann der Reihe nach "lesen"
  list.forEach((y) => !isLoaded(lang, y) && !failure(lang, y) && loadContent(lang, y).catch(() => {}))
  list.forEach((y) => read(lang, y) && read('de', y))
}

// Hook ohne Suspense: true, sobald die Pakete da sind (für Bereiche, die nicht warten sollen).
export function useContentReady(lang, years) {
  const list = years.filter(validYear).map(Number)
  const ready = () => list.every((y) => isLoaded(lang, y))
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((n) => n + 1)
    listeners.add(fn)
    list.forEach((y) => loadContent(lang, y).catch(() => {}))
    return () => listeners.delete(fn)
  }, [lang, list.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  return ready()
}

// ---------- synchroner Zugriff (setzt geladene Pakete voraus, wirft sonst für Suspense) ----------
const yearOf = (topicId) => yearOfTopic(topicId)

export function deLesson(topicId) {
  const y = yearOf(topicId)
  return y ? read('de', y).lerninhalte[topicId] : undefined
}

export function lessonOf(topicId, lang) {
  const y = yearOf(topicId)
  if (!y) return { inhalt: undefined, translated: true }
  const de = read('de', y).lerninhalte[topicId]
  if (lang === 'de' || !de || !LOADERS[lang]) return { inhalt: de, translated: true }
  const tr = read(lang, y).lerninhalte[topicId]
  return tr ? { inhalt: tr, translated: true } : { inhalt: de, translated: false }
}

export function deQuestions(topicId) {
  const y = yearOf(topicId)
  return y ? read('de', y).questions[topicId] ?? [] : []
}

export function questionsIn(topicId, lang) {
  const de = deQuestions(topicId)
  if (lang === 'de' || !LOADERS[lang] || de.length === 0) return { questions: de, translated: true }
  const tr = read(lang, yearOf(topicId)).questions[topicId]
  return tr ? { questions: tr, translated: true } : { questions: de, translated: false }
}

export function extraCardsOf(topicId) {
  const y = yearOf(topicId)
  return y ? read('de', y).karten?.[topicId] ?? [] : []
}

export function zusatzOf(topicId) {
  const y = yearOf(topicId)
  return y ? read('de', y).zusatz[topicId] ?? [] : []
}

// Alle Jahrgänge vorladen, sobald der Browser Zeit hat (für das Fehlerheft, Wiederholen usw.).
export function prefetchAll(lang) {
  const run = () => jahrgaenge.forEach((j) => loadContent(lang, j.id).catch(() => {}))
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 4000 })
  else setTimeout(run, 1500)
}
