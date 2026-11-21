import { deLesson, extraCardsOf, lessonOf } from './content.js'

// Karteikarten entstehen automatisch aus den "begriff"-Blöcken der Lerninhalte.
// Die ID nutzt die Position im deutschen Inhalt, damit der Fortschritt in allen
// Sprachen derselbe bleibt (Übersetzungen haben dieselbe Struktur).
// Dazu kommen die Zusatzkarten aus karten/yearN.js (ID "thema#k2").
export function cardsOfTopic(topicId, lang, { extra = true } = {}) {
  const de = deLesson(topicId)
  if (!de) return []
  const { inhalt } = lessonOf(topicId, lang)
  const cards = []
  de.schritte.forEach((schritt, s) => {
    schritt.blocks.forEach((block, b) => {
      if (block.type !== 'begriff') return
      const shown = inhalt.schritte[s]?.blocks[b] ?? block
      cards.push({
        id: `${topicId}#${cards.length}`,
        topicId,
        term: shown.term,
        erklaerung: shown.erklaerung,
        beispiel: shown.beispiel,
        deTerm: block.term,
      })
    })
  })
  if (!extra) return cards
  extraCardsOf(topicId).forEach((x, k) => {
    const shown = x[lang] ?? x.de
    cards.push({ id: `${topicId}#k${k}`, topicId, term: shown.term, erklaerung: shown.erklaerung, beispiel: shown.beispiel, deTerm: x.de.term })
  })
  return cards
}

// Karte über ihre ID ("thema#3")
export function cardById(id, lang) {
  const [topicId, n] = id.split('#')
  if (n?.startsWith('k')) return cardsOfTopic(topicId, lang).find((c) => c.id === id) ?? null
  return cardsOfTopic(topicId, lang, { extra: false })[Number(n)] ?? null
}
