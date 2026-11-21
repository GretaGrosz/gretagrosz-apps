import { useMemo } from 'react'
import Player from '../components/Player.jsx'
import { getState, refillHearts } from '../lib/store.js'
import { dueCards } from '../lib/srs.js'
import { LESSONS, weakestSkills, genForSkill, adapt } from '../lib/curriculum.js'
import { GENERATORS, rng } from '../generators/index.js'
import { shuffle } from '../lib/check.js'
import { go } from '../components/ui.jsx'

// "Üben": endless interleaved review. Due mistakes (spaced repetition) + own mistakes deck +
// the 3 weakest micro-skills + a mix of finished lessons, so topics alternate like in a real text.
export function buildPractice(s, { n = 15, skill = null } = {}) {
  const rnd = rng(Date.now())
  const out = []
  if (skill) {
    const g = genForSkill(skill)
    const cards = Object.entries(s.cards).filter(([, c]) => c.item.s === skill && !c.mastered).slice(0, 5)
    cards.forEach(([id, c]) => out.push({ ...c.item, _card: id }))
    if (g) while (out.length < n) out.push(GENERATORS[g](rnd))
    return shuffle(out, rnd).map((it) => adapt(it, 2))
  }
  const due = dueCards(s).slice(0, 9)
  due.forEach((c) => out.push({ ...c.item, _card: c.id }))
  for (const w of weakestSkills(s, 3)) {
    const g = genForSkill(w.s)
    if (g) out.push(GENERATORS[g](rnd))
  }
  const done = LESSONS.filter((l) => s.lessons[l.id]?.done)
  const pool = done.length ? done : LESSONS.slice(0, 5)
  while (out.length < n) {
    const l = pool[Math.floor(rnd() * pool.length)]
    const it = l.items[Math.floor(rnd() * l.items.length)]
    if (!out.some((x) => x.id === it.id)) out.push(it)
  }
  // interleave: never two items of the same skill family in a row if avoidable
  const sh = shuffle(out, rnd)
  for (let i = 1; i < sh.length; i++) {
    const fam = (x) => String(x.s || '').split('.')[0]
    if (fam(sh[i]) === fam(sh[i - 1])) {
      const j = sh.findIndex((x, k) => k > i && fam(x) !== fam(sh[i - 1]))
      if (j > 0) [sh[i], sh[j]] = [sh[j], sh[i]]
    }
  }
  return sh.map((it) => adapt(it, 2))
}

export default function Practice({ refill, skill }) {
  const items = useMemo(() => buildPractice(getState(), { skill }), [skill])
  return (
    <Player items={items} mode="practice" useHearts={false} title={skill ? 'Gezielt üben' : 'Üben'}
      onDone={(sum, saving) => { if (saving && refill) refillHearts(); if (!saving) go(refill ? '/pfad' : '/') }} />
  )
}
