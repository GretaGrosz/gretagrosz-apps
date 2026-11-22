import { getKapitelList, getKapitelTopics, getTopic } from '../data/curriculum.js'
import { questionByRef, refKey, topicQuestions } from '../data/questions.js'

// Welche BW-Fragen an welcher Station kommen. Jede Station gehört zu einem Bereich aus dem Unterricht:
//   Theke (counter)  → Kundschaft, Markt, Kaufvertrag aus Sicht der Kundschaft, Zahlung, Marketing, Handel
//   Lager (store)    → Leistungserstellung, Material- und Warenwirtschaft, Lager, Logistik, Produktion
//   Steg (dock)      → Einkauf beim Lieferanten: Angebot, Bestellung, Kaufvertrag, Lieferverzug, Außenhandel
//   Post (mail)      → alles rund ums Unternehmen: Gründung, Rechtsform, Firmenbuch, Personal, Finanzen …
// Hat eine Station im gewählten Lernstoff keine Fragen, kommt eine Frage aus dem übrigen Lernstoff.

const COUNTER = [
  'grundlagen-des-wirtschaftens',
  'der-markt',
  'phasen-kaufen-verkaufen',
  'gesetzliche-grundlagen-kauf',
  'fernabsatz-ecommerce',
  'ruecktrittsrechte',
  'zahlungsformen-1jg',
  'unzuverlaessige-kaeufer',
  'kunde-im-mittelpunkt',
  'marktforschung',
  'instrumente-marketings',
  'der-handel',
]
const STORE = [
  'leistungserstellung-1jg',
  'grundlagen-leistungserstellung-2jg',
  'material-warenwirtschaft',
  'lager-transport-entsorgung',
  'logistik',
  'produktionsbetriebe',
  'leistungserstellungsprozess-produktion',
]
const DOCK = [
  'bestandteile-kaufvertrag',
  'schriftverkehr-kaufvertrag',
  'unzuverlaessige-verkaeufer',
  'kaufvertraege-aussenhandel',
  'beschaffungsmarketing',
  'supply-chain-management',
]

export function stationOf(topicId) {
  if (COUNTER.includes(topicId)) return 'counter'
  if (STORE.includes(topicId)) return 'store'
  if (DOCK.includes(topicId)) return 'dock'
  return 'mail'
}

// Nur Auswahlfragen (auch Richtig/Falsch) – die passen in einen kurzen Spielmoment
const playable = (q) => q && q.type === 'mc' && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correctIndex)

/** Alle spielbaren Fragen des Lernstoffs, nach Station sortiert. */
export function buildPool(year, kapitelIds, lang) {
  const pool = { counter: [], store: [], dock: [], mail: [], all: [] }
  const chapters = getKapitelList(year).filter((k) => !kapitelIds?.length || kapitelIds.includes(k.id))
  for (const k of chapters) {
    for (const topic of getKapitelTopics(year, k.id)) {
      const station = stationOf(topic.id)
      for (const q of topicQuestions(year, k.id, topic, lang)) {
        if (!playable(q)) continue
        pool[station].push(q)
        pool.all.push(q)
      }
    }
  }
  return pool
}

const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Nächste Frage für eine Station. used: Set der heute schon gestellten Fragen (refKey).
 * Bevorzugt Fragen, die heute noch nicht kamen; die Antworten werden gemischt.
 */
// Am Handy mitten im Spiel lesen sich kurze Fragen viel leichter: die kommen zuerst, lange nur, wenn nichts anderes da ist
export const isShort = (q) => q.question.length <= 150 && q.options.every((o) => String(o).length <= 85)

export function nextQuestion(pool, station, used) {
  const all = (list) => list.filter((q) => !used.has(refKey(q.ref)))
  const fresh = (list) => (all(list).some(isShort) ? all(list).filter(isShort) : all(list))
  const list = fresh(pool[station]).length ? fresh(pool[station]) : fresh(pool.all).length ? fresh(pool.all) : pool[station].length ? pool[station] : pool.all
  if (!list.length) return null
  const q = list[Math.floor(Math.random() * list.length)]
  return mixed(q)
}

/** Frage mit gemischten Antworten (Richtig/Falsch bleibt in fester Reihenfolge). */
export function mixed(q) {
  if (q.fixed) return { ...q }
  const order = shuffle(q.options.map((_, i) => i))
  return { ...q, options: order.map((i) => q.options[i]), correctIndex: order.indexOf(q.correctIndex) }
}

/** Fragen aus dem Fehlerheft der App, die im Lernstoff liegen und ins Spiel passen (für Stammkundschaft). */
export function regularQuestions(mistakes, year, kapitelIds, lang) {
  return Object.values(mistakes ?? {})
    .filter((ref) => ref && Number(ref.jahrgangId) === Number(year) && (!kapitelIds?.length || kapitelIds.includes(ref.kapitelId)))
    .filter((ref) => getTopic(ref.jahrgangId, ref.topicId))
    .map((ref) => questionByRef(ref, lang))
    .filter(playable)
}

export { refKey }
