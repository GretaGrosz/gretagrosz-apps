import { getKapitelTopics } from './curriculum.js'
import { cardsOfTopic } from './flashcards.js'
import { GRADE_STEPS, gradeOf, questionCount } from './questions.js'
import { isKnown } from './srs.js'

// NOTENPROGNOSE für eine eingetragene Prüfung – nur aus Daten, die die App ohnehin speichert:
//   • die letzten 10 Antworten je Thema (results)
//   • ob die Zusammenfassung erreicht wurde (done['summary:…'])
//   • welche Karteikarten sitzen (srs)
// Jedes Thema bekommt eine geschätzte Trefferquote. Ohne Antworten gilt ein Startwert (gelesen 55 %,
// ungelesen 30 %), echte Antworten verdrängen ihn schnell (er zählt wie 4 Antworten). Gewichtet wird
// mit der Zahl der Fragen pro Thema – so wie der Testmodus seine Fragen zieht.

export const MIN_ANSWERS = 5
const PRIOR_WEIGHT = 4
const MASTERED = 0.92

export function topicEstimate({ answers, read, cardShare }) {
  const prior = (read ? 0.55 : 0.3) + 0.15 * cardShare
  const right = answers.reduce((s, x) => s + x, 0)
  return (right + prior * PRIOR_WEIGHT) / (answers.length + PRIOR_WEIGHT)
}

export function examTopics(exam) {
  return exam.kapitelIds.flatMap((k) => getKapitelTopics(exam.jahrgangId, k).map((topic) => ({ topic, k })))
}

export function forecast(exam, { results, done, srs }) {
  const rows = examTopics(exam).map(({ topic, k }) => {
    const answers = results[`${exam.jahrgangId}|${k}|${topic.id}`]?.last ?? []
    const read = Boolean(done[`summary:${topic.id}`])
    const cards = cardsOfTopic(topic.id, 'de')
    const cardShare = cards.length ? cards.filter((c) => isKnown(srs[c.id])).length / cards.length : 0
    const p = topicEstimate({ answers, read, cardShare })
    return { topic, k, p, read, answers: answers.length, w: Math.max(1, questionCount(topic.id)) }
  })
  const W = rows.reduce((s, r) => s + r.w, 0) || 1
  const pct = (rows.reduce((s, r) => s + r.w * r.p, 0) / W) * 100
  const grade = gradeOf(pct)
  const answered = rows.reduce((s, r) => s + r.answers, 0)

  // Welche Themen bringen am meisten bis zur nächstbesseren Note?
  const gains = rows
    .map((r) => ({ ...r, gain: ((r.w / W) * Math.max(0, MASTERED - r.p)) * 100 }))
    .filter((r) => r.gain > 0.2)
    .sort((a, b) => b.gain - a.gain)
  let focus = []
  let target = null
  if (grade > 1) {
    target = grade - 1
    const need = GRADE_STEPS[grade - 2] - pct
    let sum = 0
    for (const r of gains) {
      if (focus.length >= 3 || sum >= need) break
      focus.push(r)
      sum += r.gain
    }
  } else if (gains.length && gains[0].p < 0.85) {
    focus = [gains[0]]
  }

  return { pct, grade, target, focus, rows, answered, ready: answered >= MIN_ANSWERS }
}
