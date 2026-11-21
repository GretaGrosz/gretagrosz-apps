import { addDays, dayKey, daysUntil } from './questions.js'
import { examTopics } from './forecast.js'

// LERNPLAN rückwärts vom Prüfungstag:
//   • Prüfungstag: frei
//   • die zwei Tage davor: Probetest unter Zeitdruck + Fehlerheft
//   • alle Tage davor: jedes Thema der Prüfung lesen und üben, gleichmäßig verteilt
// Der Plan wird jeden Tag neu aus dem Fortschritt berechnet – wer einen Tag auslässt, bekommt die
// Aufgaben auf die übrigen Tage verteilt. Die Aufgaben von heute werden morgens festgehalten
// (planDay), damit sich die Liste nicht verschiebt, während man sie abarbeitet.

const MOCK_DAYS = 2

const accuracy = (r) => (r && r.last.length ? r.last.reduce((s, x) => s + x, 0) / r.last.length : 0)

export function topicPractised(exam, k, topicId, { done, results }) {
  const r = results[`${exam.jahrgangId}|${k}|${topicId}`]
  return Boolean(done[`quizpass:${exam.jahrgangId}|${topicId}`]) || (r && r.last.length >= 5 && accuracy(r) >= 0.8)
}

// Alle noch offenen Aufgaben einer Prüfung in Lernreihenfolge
export function openTasks(exam, state) {
  const tasks = []
  for (const { topic, k } of examTopics(exam)) {
    if (!state.done[`summary:${topic.id}`]) tasks.push({ id: `learn:${topic.id}`, kind: 'learn', topicId: topic.id, k })
    if (!topicPractised(exam, k, topic.id, state)) tasks.push({ id: `practise:${topic.id}`, kind: 'practise', topicId: topic.id, k })
  }
  return tasks
}

// Plan als Liste von Tagen: [{ day, tasks }]
export function buildPlan(exam, state, today = dayKey()) {
  const left = daysUntil(exam.date)
  if (left < 0) return []
  const tasks = openTasks(exam, state)
  const learnDays = Math.max(0, left - MOCK_DAYS)
  const days = []
  // Jeder Tag nimmt seinen Anteil vom Rest (vorne etwas mehr); Tage ohne neues Thema sind Wiederholungstage
  let next = 0
  for (let i = 0; i < learnDays; i++) {
    const take = Math.ceil((tasks.length - next) / (learnDays - i))
    const dayTasks = tasks.slice(next, next + take)
    next += take
    days.push({ day: addDays(today, i), kind: 'learn', tasks: dayTasks.length ? dayTasks : [{ id: 'review', kind: 'review' }] })
  }
  for (let i = learnDays; i < left; i++) {
    const mockTasks = [{ id: `mock:${exam.id}`, kind: 'mock' }, { id: 'mistakes', kind: 'mistakes' }]
    // Was bis jetzt nicht geschafft wurde, kommt auf den ersten Probetest-Tag
    if (learnDays === 0 && i === 0) mockTasks.unshift(...tasks.filter((t) => t.kind === 'practise').slice(0, 2))
    days.push({ day: addDays(today, i), kind: 'mock', tasks: mockTasks })
  }
  days.push({ day: exam.date, kind: 'exam', tasks: [] })
  return days
}

// Aufgaben für heute (mit Wiederholungen, falls Karten fällig sind)
export function todaysTasks(exam, state, dueCount, today = dayKey()) {
  const plan = buildPlan(exam, state, today)
  const first = plan[0]
  if (!first || first.kind === 'exam') return []
  const tasks = first.tasks.filter((t) => t.kind !== 'review')
  if (dueCount > 0) tasks.push({ id: 'review', kind: 'review' })
  return tasks
}

// Ist eine Aufgabe erledigt? (heute)
export function taskDone(task, exam, state, { dueCount, mistakeCount }) {
  const log = state.day?.date === dayKey() ? state.day : { practised: [], mocks: 0, mistakes: 0 }
  switch (task.kind) {
    case 'learn':
      return Boolean(state.done[`summary:${task.topicId}`])
    case 'practise':
      return log.practised.includes(task.topicId) || topicPractised(exam, task.k, task.topicId, state)
    case 'mock':
      return log.mocks > 0
    case 'mistakes':
      return log.mistakes > 0 || mistakeCount === 0
    case 'review':
      return dueCount === 0
    default:
      return false
  }
}
