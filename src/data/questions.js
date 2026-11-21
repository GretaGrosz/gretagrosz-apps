import { getKapitelTopics, getTopic, jahrgaenge } from './curriculum.js'
import { deQuestions, questionsIn, zusatzOf } from './content.js'
import { cardsOfTopic } from './flashcards.js'

// Jede Quizfrage bekommt eine feste Adresse (ref), die in allen Sprachen gleich ist:
// Jahrgang, Kapitel, Thema und Position der Frage im Thema ("x3" = Zusatzfrage, "c5" = Fachbegriff erkennen,
// "m1" = Begriffe zuordnen aus den Karteikarten).
export const refKey = (r) => `${r.jahrgangId}|${r.kapitelId}|${r.topicId}|${r.i}`

export function topicQuestions(jahrgangId, kapitelId, topic, lang) {
  if (!topic) return []
  const base = questionsIn(topic.id, lang).questions.map((q, i) => ({
    ...q,
    type: 'mc',
    ref: { jahrgangId: Number(jahrgangId), kapitelId, topicId: topic.id, i },
  }))
  const extra = zusatzOf(topic.id).map((x, n) =>
    extraQuestion(x, lang, { jahrgangId: Number(jahrgangId), kapitelId, topicId: topic.id, i: `x${n}` }),
  )
  const match = matchGroups(topic.id).map((_, n) =>
    matchQuestion({ jahrgangId: Number(jahrgangId), kapitelId, topicId: topic.id, i: `m${n}` }, lang),
  )
  return [...base, ...extra, ...match.filter(Boolean)]
}

const TF_Q = { de: 'Richtig oder falsch?', en: 'True or false?', hu: 'Igaz vagy hamis?' }
const TF_O = { de: ['Richtig', 'Falsch'], en: ['True', 'False'], hu: ['Igaz', 'Hamis'] }

// Zusatzfrage in der gewünschten Sprache (Fallback Deutsch)
function extraQuestion(x, lang, ref) {
  const tr = x[lang] ?? x.de
  const base = { type: x.type, question: tr.q, explanation: tr.e, ref }
  switch (x.type) {
    case 'tf':
      // Richtig/Falsch ist eine Auswahlfrage mit fester Reihenfolge
      return { ...base, type: 'mc', kind: 'tf', fixed: true, question: `${TF_Q[lang] ?? TF_Q.de}\n„${tr.q}“`, options: TF_O[lang] ?? TF_O.de, correctIndex: x.correct ? 0 : 1 }
    case 'mc':
      return { ...base, options: tr.o, correctIndex: x.correctIndex }
    case 'multi':
      return { ...base, options: tr.o, correct: [...x.correct].sort((a, b) => a - b) }
    case 'order':
      return { ...base, items: tr.o }
    case 'match':
      return { ...base, pairs: tr.p }
    case 'text':
      return { ...base, answers: [...tr.a, ...(lang === 'de' ? [] : x.de.a)] }
    default:
      return { ...base, value: x.value, tol: x.tol ?? 0, unit: x.unit ? x.unit[lang] ?? x.unit.de : '' }
  }
}

// ---------- "Begriffe zuordnen" aus den Karteikarten ----------
// Die Karten eines Themas werden der Reihe nach in Vierergruppen geteilt (ein Rest von 1–2 Karten
// kommt zur letzten Gruppe), jede Gruppe ergibt eine Zuordnungsfrage. Ab 3 Karten.
function matchGroups(topicId) {
  const n = cardsOfTopic(topicId, 'de').length
  if (n < 3) return []
  const groups = []
  for (let i = 0; i < n; i += 4) groups.push([...Array(Math.min(4, n - i)).keys()].map((k) => i + k))
  const last = groups[groups.length - 1]
  if (groups.length > 1 && last.length < 3) groups[groups.length - 2].push(...groups.pop())
  return groups
}

const MATCH_Q = {
  de: 'Ordne jedem Begriff die passende Erklärung zu.',
  en: 'Match each term with its explanation.',
  hu: 'Párosítsd a fogalmakat a megfelelő magyarázattal.',
}

// Lange Erklärungen auf den ersten Satz kürzen, damit die Zuordnung am Handy lesbar bleibt
function shortText(text) {
  const s = String(text ?? '')
  if (s.length <= 120) return s
  const cut = s.search(/[.!?;:](\s|$)/)
  return cut > 30 && cut < 160 ? s.slice(0, cut + 1) : s
}

function matchQuestion(ref, lang) {
  const group = matchGroups(ref.topicId)[Number(String(ref.i).slice(1))]
  if (!group) return null
  const cards = cardsOfTopic(ref.topicId, lang)
  const pairs = group.map((k) => cards[k]).filter(Boolean).map((c) => [c.term, shortText(c.erklaerung)])
  if (pairs.length < 3) return null
  return {
    type: 'match',
    question: MATCH_Q[lang] ?? MATCH_Q.de,
    pairs,
    explanation: pairs.map(([l, r]) => `${l}: ${r}`).join('\n'),
    ref,
  }
}

export function chapterQuestions(jahrgangId, kapitelId, lang) {
  return getKapitelTopics(jahrgangId, kapitelId).flatMap((topic) => topicQuestions(jahrgangId, kapitelId, topic, lang))
}

// Anzahl Fragen eines Themas (ohne Inhalte zu übersetzen)
export function questionCount(topicId) {
  return deQuestions(topicId).length + zusatzOf(topicId).length + matchGroups(topicId).length
}

export function questionByRef(ref, lang) {
  if (!getTopic(ref.jahrgangId, ref.topicId)) return null
  if (String(ref.i).startsWith('c')) return termQuestion(ref, lang)
  if (String(ref.i).startsWith('m')) return matchQuestion(ref, lang)
  if (String(ref.i).startsWith('x')) {
    const x = zusatzOf(ref.topicId)[Number(String(ref.i).slice(1))]
    return x ? extraQuestion(x, lang, ref) : null
  }
  const q = questionsIn(ref.topicId, lang).questions[ref.i]
  return q ? { ...q, type: 'mc', ref } : null
}

export function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const listOf = (q) => q && (q.options ?? q.items ?? q.pairs)

// Zufällige Reihenfolge der Antworten (als Indizes, damit sie in jeder Sprache gleich bleibt).
// Reihenfolge- und Zuordnungsfragen werden nie schon "gelöst" angezeigt.
export function randomOrder(q) {
  const list = listOf(q)
  if (!list || q.fixed) return null
  let o = shuffle(list.map((_, i) => i))
  if ((q.items || q.pairs) && o.length > 1 && o.every((v, i) => v === i)) o = [...o.slice(1), o[0]]
  return o
}

// Frage mit umgestellten Antworten. Bei Reihenfolge (items) und Zuordnung (pairs) bleibt die Lösung
// in der Originalreihenfolge, `shown` sagt, in welcher Reihenfolge die Teile angezeigt werden.
export function withOrder(q, order) {
  const list = listOf(q)
  if (!list || !order || q.fixed) return q
  const o = order.filter((i) => i < list.length)
  if (o.length !== list.length) return q
  if (!q.options) return { ...q, shown: o }
  return {
    ...q,
    options: o.map((i) => q.options[i]),
    correctIndex: q.correctIndex === undefined ? undefined : o.indexOf(q.correctIndex),
    correct: q.correct ? q.correct.map((c) => o.indexOf(c)).sort((a, b) => a - b) : undefined,
  }
}

// Fragen, die man durch Antippen mehrerer Teile beantwortet (brauchen einen "Prüfen"-Knopf)
export const isBuildQ = (q) => Boolean(q && (q.type === 'multi' || q.type === 'order' || q.type === 'match'))

// Ist ein Entwurf vollständig genug zum Prüfen/Abgeben?
export function draftReady(q, draft) {
  if (!Array.isArray(draft)) return false
  if (q.type === 'multi') return draft.length > 0
  if (q.type === 'order') return draft.length === q.items.length
  if (q.type === 'match') return q.pairs.every((_, i) => draft[i] !== null && draft[i] !== undefined)
  return false
}

// Üblicher österreichischer Notenschlüssel (Richtwert).
export const GRADE_STEPS = [89, 76, 63, 50]
export function gradeOf(pct) {
  if (pct >= 89) return 1
  if (pct >= 76) return 2
  if (pct >= 63) return 3
  if (pct >= 50) return 4
  return 5
}

// Datum als "JJJJ-MM-TT" (lokale Zeit)
export function dayKey(date = new Date()) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Tag + n Tage als "JJJJ-MM-TT"
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

// Tage von heute bis zum Datum (0 = heute)
export function daysUntil(day) {
  const [y, m, d] = day.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target - today) / 86400000)
}

// Schwache Themen: mindestens 3 Antworten, davon mindestens 30 % falsch (aus den letzten 10).
export function weakTopics(results, max = 3) {
  return Object.values(results)
    .filter((r) => getTopic(r.jahrgangId, r.topicId))
    .map((r) => ({ ...r, wrongShare: r.last.filter((x) => x === 0).length / r.last.length }))
    .filter((r) => r.last.length >= 3 && r.wrongShare >= 0.3)
    .sort((a, b) => b.wrongShare - a.wrongShare)
    .slice(0, max)
}

// ---------- Schwierigkeit (für den Testmodus) ----------
// Die Fragen haben keine eigene Schwierigkeitsangabe. Sie wird deshalb aus typischen Merkmalen
// geschätzt (immer anhand der deutschen Fassung, damit sie in allen Sprachen gleich ist):
//   schwer:  Rechnungen, Fallbeispiele ("Loopy möchte …", "Die … GmbH …"), Verneinungen ("NICHT")
//   leicht:  Definitionsfragen ("Was versteht man unter …")
// Die Antwortlängen zählen bewusst nicht mehr mit (sie sind absichtlich angeglichen).
function difficultyScore(q) {
  const text = q.question
  let s = 0
  if (/\d/.test(text) && /(EUR|€|%|berechn|Wie hoch|beträgt|ergibt|Wie viel)/i.test(text)) s += 3
  if (/^(Loopy|Ein |Eine |Im |Das Hotel|Die [A-ZÄÖÜ][^ ]* (GmbH|AG|KG|OG))/.test(text) || text.length > 150) s += 2
  if (/\b(NICHT|KEIN|KEINE)\b|nicht zu(trifft)?\b|falsch\b/.test(text)) s += 2
  if (/^(Was versteht man|Wie wird|Was ist|Wofür steht|Wie nennt man|Was bedeutet|Wie heißt|Was sind)/.test(text)) s -= 1.5
  if (text.length < 60) s -= 0.5
  return s
}

const tierCache = {}
// Stufe 1 (leicht), 2 (mittel) oder 3 (schwer) je Frage eines Jahrgangs: unterste 40 % leicht, oberste 30 % schwer.
function tiers(jahrgangId) {
  if (tierCache[jahrgangId]) return tierCache[jahrgangId]
  const j = jahrgaenge.find((x) => x.id === Number(jahrgangId))
  const scores = []
  for (const t of j?.topics ?? []) deQuestions(t.id).forEach((q, i) => scores.push({ key: `${t.id}|${i}`, s: difficultyScore(q) }))
  const sorted = scores.map((x) => x.s).sort((a, b) => a - b)
  const low = sorted[Math.floor(sorted.length * 0.4)]
  const high = sorted[Math.floor(sorted.length * 0.7)]
  tierCache[jahrgangId] = Object.fromEntries(scores.map((x) => [x.key, x.s < low ? 1 : x.s >= high ? 3 : 2]))
  return tierCache[jahrgangId]
}

export const tierOf = (ref) => {
  if (String(ref.i).startsWith('x')) return zusatzOf(ref.topicId)[Number(String(ref.i).slice(1))]?.level ?? 2
  if (String(ref.i).startsWith('m')) return 1
  return tiers(ref.jahrgangId)[`${ref.topicId}|${ref.i}`] ?? 2
}

// ---------- "Fachbegriff erkennen" (nur Extrem) ----------
// Erklärung wird gezeigt, gesucht ist der Begriff. Die drei falschen Antworten sind Begriffe
// aus demselben Kapitel – sie klingen also ähnlich. Die Auswahl steckt in der Adresse (ref),
// damit die Frage in jeder Sprache und im Fehlerheft gleich bleibt.
function chapterCards(jahrgangId, kapitelId, lang) {
  // Zuerst die Karten aus den Lerninhalten, dann die Zusatzkarten (so bleiben alte Adressen gültig)
  const topics = getKapitelTopics(jahrgangId, kapitelId)
  const base = topics.flatMap((t) => cardsOfTopic(t.id, lang, { extra: false }))
  return [...base, ...topics.flatMap((t) => cardsOfTopic(t.id, lang).slice(cardsOfTopic(t.id, lang, { extra: false }).length))]
}

export function termQuestionRefs(jahrgangId, kapitelId) {
  const cards = chapterCards(jahrgangId, kapitelId, 'de')
  if (cards.length < 4) return []
  return cards.map((card, ci) => {
    const others = shuffle(cards.map((_, k) => k).filter((k) => k !== ci && cards[k].term !== card.term)).slice(0, 3)
    const pos = Math.floor(Math.random() * 4)
    const order = [...others]
    order.splice(pos, 0, ci)
    return { jahrgangId: Number(jahrgangId), kapitelId, topicId: card.topicId, i: `c${ci}`, order }
  })
}

const TERM_Q = {
  de: 'Welcher Fachbegriff passt zu dieser Beschreibung?',
  en: 'Which technical term matches this description?',
  hu: 'Melyik szakkifejezés illik erre a leírásra?',
}

function termQuestion(ref, lang) {
  const cards = chapterCards(ref.jahrgangId, ref.kapitelId, lang)
  const ci = Number(String(ref.i).slice(1))
  const card = cards[ci]
  if (!card || !ref.order) return null
  return {
    type: 'mc',
    question: `${TERM_Q[lang] ?? TERM_Q.de}\n„${card.erklaerung}“`,
    options: ref.order.map((k) => cards[k]?.term ?? ''),
    correctIndex: ref.order.indexOf(ci),
    explanation: `${card.term}: ${card.erklaerung}`,
    ref,
  }
}

// Fragen für eine Prüfung im Testmodus zusammenstellen.
// level 0 Leicht: leichte Fragen · 1 Mittel: halb leicht, halb schwer
// 2 Schwer: ¾ schwer, ¼ mittel · 3 Extrem: nur die schwersten + "Fachbegriff erkennen"
export function examPool(jahrgangId, kapitelIds) {
  return kapitelIds.flatMap((k) => chapterQuestions(jahrgangId, k, 'de').map((q) => q.ref))
}

export function buildExam(jahrgangId, kapitelIds, level, count) {
  const pool = examPool(jahrgangId, kapitelIds)
  const by = { 1: shuffle(pool.filter((r) => tierOf(r) === 1)), 2: shuffle(pool.filter((r) => tierOf(r) === 2)), 3: shuffle(pool.filter((r) => tierOf(r) === 3)) }
  const take = (tier, n) => by[tier].splice(0, n)
  const mix = {
    0: [[1, 1]],
    1: [[1, 0.5], [3, 0.5]],
    2: [[3, 0.75], [2, 0.25]],
    3: [[3, 0.7]],
  }[level]

  const picked = []
  mix.forEach(([tier, share]) => picked.push(...take(tier, Math.round(count * share))))
  if (level === 3) {
    // höchstens 40 % "Fachbegriff erkennen", damit es auch bei kleinen Kapiteln eine echte Prüfung bleibt
    const terms = shuffle(kapitelIds.flatMap((k) => termQuestionRefs(jahrgangId, k)))
    picked.push(...terms.slice(0, Math.min(count - picked.length, Math.ceil(count * 0.4))))
  }
  // Falls in den gewählten Kapiteln zu wenige Fragen einer Stufe sind: mit der nächstpassenden auffüllen
  const fallback = { 0: [1, 2, 3], 1: [2, 1, 3], 2: [3, 2, 1], 3: [3, 2, 1] }[level]
  for (const tier of fallback) if (picked.length < count) picked.push(...take(tier, count - picked.length))
  return shuffle(picked).slice(0, count)
}

// ---------- Antworten prüfen ----------
function normalize(text) {
  return String(text ?? '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/^(der|die|das|ein|eine|the|a|an|az|egy) /, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

// Eingetippter Begriff: kleine Tippfehler sind erlaubt (1 Fehler ab 6, 2 Fehler ab 12 Buchstaben)
export function textMatches(input, answers) {
  const x = normalize(input)
  if (!x) return false
  return answers.some((ans) => {
    const y = normalize(ans)
    const allowed = y.length >= 12 ? 2 : y.length >= 6 ? 1 : 0
    return distance(x, y) <= allowed
  })
}

// Zahl: Komma oder Punkt, mit oder ohne Tausenderpunkt, Einheiten werden ignoriert
function numberCandidates(input) {
  const s = String(input ?? '').replace(/[^0-9.,-]/g, '')
  if (!s) return []
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ','
    const thou = dec === '.' ? ',' : '.'
    return [Number(s.split(thou).join('').replace(dec, '.'))]
  }
  if (lastComma >= 0) return [Number(s.replace(/\./g, '').replace(',', '.')), Number(s.replace(/,/g, ''))]
  if (lastDot >= 0) return [Number(s), Number(s.replace(/\./g, ''))]
  return [Number(s)]
}

export function isCorrect(q, answer) {
  if (!q || answer === null || answer === undefined || answer === '') return false
  if (q.type === 'text') return textMatches(answer, q.answers)
  if (q.type === 'number') return numberCandidates(answer).some((n) => !Number.isNaN(n) && Math.abs(n - q.value) <= q.tol + 1e-9)
  if (q.type === 'multi') return Array.isArray(answer) && answer.length === q.correct.length && q.correct.every((c) => answer.includes(c))
  if (q.type === 'order') return Array.isArray(answer) && answer.length === q.items.length && answer.every((v, i) => v === i)
  if (q.type === 'match') return Array.isArray(answer) && q.pairs.every((_, i) => answer[i] === i)
  return answer === q.correctIndex
}

const LOCALES = { de: 'de-AT', en: 'en-GB', hu: 'hu-HU' }

// Richtige Antwort als Text (für Feedback und Auswertung)
export function correctAnswerText(q, lang) {
  if (q.type === 'text') return q.answers[0]
  if (q.type === 'multi') return q.correct.map((i) => q.options[i]).join(' · ')
  if (q.type === 'order') return q.items.join(' → ')
  if (q.type === 'match') return q.pairs.map(([l, r]) => `${l} → ${r}`).join('\n')
  if (q.type === 'number') {
    const n = new Intl.NumberFormat(LOCALES[lang] ?? 'de-AT', { maximumFractionDigits: 2 }).format(q.value)
    return q.unit ? `${n} ${q.unit}` : n
  }
  return q.options[q.correctIndex]
}

// Antwort der Schülerin / des Schülers als Text
export function givenAnswerText(q, answer) {
  if (answer === null || answer === undefined || answer === '') return null
  if (q.type === 'text' || q.type === 'number') return String(answer)
  if (q.type === 'multi') return answer.map((i) => q.options[i]).join(' · ')
  if (q.type === 'order') return answer.map((i) => q.items[i]).join(' → ')
  if (q.type === 'match') return q.pairs.map(([l], i) => `${l} → ${answer[i] === null || answer[i] === undefined ? '–' : q.pairs[answer[i]][1]}`).join('\n')
  return q.options[answer]
}
