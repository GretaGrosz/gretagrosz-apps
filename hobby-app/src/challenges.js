// Monthly challenges: do the thing on enough days in one calendar month to finish it and win a buddy outfit.
// Every month starts from zero. A challenge you can no longer finish this month says when it opens again.
import { dayOf } from './data'

export const CHALLENGES = [
  {
    id: 'ch_sketch',
    goal: 20,
    category: 'art',
    outfit: 'painter',
    title: { en: 'Sketch something', de: 'Skizzier etwas' },
    blurb: { en: 'Any sketch counts: a mug, your hand, a doodle on the bus.', de: 'Jede Skizze zählt: eine Tasse, deine Hand, ein Gekritzel im Bus.' },
  },
  {
    id: 'ch_move',
    goal: 15,
    category: 'fitness',
    outfit: 'swimcap',
    title: { en: 'Move for 15 minutes', de: 'Beweg dich 15 Minuten' },
    blurb: { en: 'Walk, dance, stretch, run. Anything that gets you moving.', de: 'Gehen, tanzen, dehnen, laufen. Alles, was dich bewegt.' },
  },
  {
    id: 'ch_cook',
    goal: 8,
    category: 'cooking',
    outfit: 'loaf',
    title: { en: 'Cook something new', de: 'Koch etwas Neues' },
    blurb: {
      en: 'A new recipe, a new ingredient or a new way of cooking something you know.',
      de: 'Ein neues Rezept, eine neue Zutat oder etwas Bekanntes auf neue Art.',
    },
  },
]

export const challengeById = (id) => CHALLENGES.find((c) => c.id === id)

const startOfMonth = (t = Date.now()) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}
export const startOfNextMonth = (t = Date.now()) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
}
// "2026-10": the key a win is stored under, so November starts fresh
export const monthKey = (t = Date.now()) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Days left in this month, today included
export const daysLeftThisMonth = (t = Date.now()) => dayOf(startOfNextMonth(t) - 1) - dayOf(t) + 1

// The days (this month) you checked in on a challenge
export const checkinsThisMonth = (entry, t = Date.now()) => (entry?.days || []).filter((day) => day >= dayOf(startOfMonth(t)))

export const wonThisMonth = (wins, id, t = Date.now()) => wins.includes(`${id}:${monthKey(t)}`)
export const everWon = (wins, id) => wins.some((w) => w.split(':')[0] === id)

// Where a challenge stands for you right now
export function challengeState(ch, entry, wins, t = Date.now()) {
  const days = checkinsThisMonth(entry, t)
  const doneToday = days.includes(dayOf(t))
  const won = wonThisMonth(wins, ch.id, t) || days.length >= ch.goal
  const left = daysLeftThisMonth(t) - (doneToday ? 1 : 0) // days you can still check in on, after today's
  const reachable = won || days.length + left >= ch.goal
  return { joined: !!entry, days, doneToday, won, reachable, needed: Math.max(0, ch.goal - days.length) }
}
