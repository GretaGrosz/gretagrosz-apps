// Leitner boxes 1–5 with intervals 1, 2, 4, 7, 14 days. Wrong → box 1.
// A mistake counts as mastered after it was answered right on 3 different days.
// Before the Schularbeit, intervals are squeezed so every open card comes up at least once in the final 5 days.
import { update, getState } from './store.js'
import { today, addDays, daysBetween } from './dates.js'

export const INTERVALS = [1, 2, 4, 7, 14]

function squeeze(due, s) {
  const exam = s.setup.examDate
  const t = today()
  if (!exam || t >= exam) return due
  const finalStart = addDays(exam, -5)
  if (due >= exam) {
    // land somewhere inside the final 5 days (but never in the past)
    const d = addDays(finalStart, Math.abs(hashNum(due)) % 4)
    return d > t ? d : addDays(t, 1)
  }
  return due
}
function hashNum(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h }

// Strip an item down to what's needed to show it again later
function snapshot(item) {
  const { id, t, q, o, a, acc, h, w, chunks, extra, first, pairs, en, r, re, y, s, c, keepOrder, quiz, src } = item
  return JSON.parse(JSON.stringify({ id, t, q, o, a, acc, h, w, chunks, extra, first, pairs, en, r, re, y, s, c, keepOrder, quiz, src }))
}

export function addMistake(item) {
  if (!item?.id) return
  update((s) => {
    const card = s.cards[item.id]
    if (card) {
      card.box = 1; card.due = addDays(today(), 1); card.rightDays = []; card.wrongs++; card.mastered = false
    } else {
      s.cards[item.id] = { item: snapshot(item), box: 1, due: addDays(today(), 1), rightDays: [], wrongs: 1, seen: 1, mastered: false, added: today() }
    }
  })
}

export function review(id, ok) {
  update((s) => {
    const card = s.cards[id]
    if (!card) return
    card.seen++
    card.last = today()
    if (ok) {
      if (!card.rightDays.includes(today())) card.rightDays.push(today())
      card.box = Math.min(5, card.box + 1)
      card.due = squeeze(addDays(today(), INTERVALS[card.box - 1]), s)
      card.mastered = card.rightDays.length >= 3
    } else {
      card.box = 1; card.rightDays = []; card.wrongs++; card.mastered = false
      card.due = addDays(today(), 1)
    }
  })
}

export function dueCards(s = getState(), d = today()) {
  const exam = s.setup.examDate
  const finalWindow = exam && daysBetween(d, exam) <= 5 && daysBetween(d, exam) >= 0
  return Object.entries(s.cards)
    .filter(([, c]) => {
      if (finalWindow && (!c.last || c.last < addDays(exam, -5))) return true // final 5 days: everything once
      return !c.mastered && c.due <= d
    })
    .map(([id, c]) => ({ id, ...c }))
    .sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : 1))
}

export function seedMine(seed) {
  // own-mistake deck: one card per entry, due right away
  update((s) => {
    for (const e of [...seed, ...s.mine]) {
      const id = 'mine.' + e.id
      if (s.cards[id]) continue
      s.cards[id] = { item: mineItem(e), box: 1, due: today(), rightDays: [], wrongs: 0, seen: 0, mastered: false, added: today(), src: 'mine' }
    }
  })
}

export function mineItem(e) {
  const cat = String(e.category || 'G').split('/')[0]
  if (e.quiz) return { id: 'mine.' + e.id, t: 'mc', q: e.quiz.q, o: e.quiz.o, a: e.quiz.o[0], r: e.rule, re: e.ruleEn, s: 'textsorte', c: 'T', src: 'mine' }
  return { id: 'mine.' + e.id, t: 'mine', w: e.wrong, a: e.correct, acc: e.acceptedAnswers || [], r: e.rule || e.note || '', re: e.ruleEn || '', s: 'mine.' + cat, c: cat, src: 'mine' }
}
