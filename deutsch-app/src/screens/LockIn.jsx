// "Lock-In": one tap, the whole day's session without leaving the flow.
// 1) the next lesson on the path (or a Wiederholung in the exam phase), 2) Üben (mistakes + weak spots),
// 3) a 60-second sprint aimed at the weakest skill. Then a summary.
import { useMemo, useState } from 'react'
import Player from '../components/Player.jsx'
import { getState, useStore, currentStreak, refillHearts } from '../lib/store.js'
import { nextLesson, buildLesson, buildReviewUnit, phaseOf, weakestSkills, unitById } from '../lib/curriculum.js'
import { buildPractice } from './Practice.jsx'
import { sprintItems, SPRINTS } from './Training.jsx'
import { saveLesson, lessonLevel } from './Lesson.jsx'
import { update } from '../lib/store.js'
import { go } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

function sprintKindFor(state) {
  const w = weakestSkills(state, 1)[0]?.s || ''
  if (/^komma/.test(w)) return 'beistrich'
  if (/^(wortstellung|ns\.|konnektor|inf)/.test(w)) return 'verbende'
  if (/^genus/.test(w)) return 'artikel'
  return 'endung'
}

export default function LockIn() {
  const s0 = useMemo(() => getState(), [])
  const ph = phaseOf(s0.setup)
  const lesson = ph.n === 3 ? null : nextLesson(s0)
  const lv = lesson ? lessonLevel(lesson.id) : 2
  const kind = sprintKindFor(s0)
  const stages = useMemo(() => [
    lesson
      ? { key: 'lesson', title: `1/3 · ${unitById(lesson.unit)?.title}: ${lesson.title}`, items: buildLesson(lesson, { level: lv, seen: s0.seenItems || {} }), mode: 'lesson' }
      : { key: 'review', title: '1/3 · Wiederholung (gemischt)', items: buildReviewUnit(s0, { n: 15 }), mode: 'practice' },
    { key: 'practice', title: '2/3 · Üben: Fehler & Schwachstellen', items: buildPractice(s0, { n: 15 }), mode: 'practice' },
    { key: 'sprint', title: `3/3 · ${SPRINTS[kind].name}`, items: sprintItems(kind), mode: 'sprint' },
  ], [])
  const [i, setI] = useState(0)
  const [log, setLog] = useState([])
  const streak = useStore(currentStreak)
  if (i >= stages.length) {
    const xp = log.reduce((a, r) => a + r.xp, 0)
    const n = log.reduce((a, r) => a + r.n, 0)
    const right = log.reduce((a, r) => a + r.right, 0)
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-6 pt-12 text-center">
        <div className="mx-auto flex h-24 w-24 animate-pop items-center justify-center rounded-[28px] bg-ink text-white dark:bg-[#e7ece9] dark:text-ink"><Icon name="lock" size={46} strokeWidth={1.8} /></div>
        <h1 className="h1 mt-4">Locked in.</h1>
        <p className="muted">Heute erledigt: Lektion, Üben und Sprint.</p>
        <div className="mt-6 flex gap-2">
          <div className="card flex-1 !p-3"><div className="text-xs font-bold text-gold">XP</div><div className="text-2xl font-bold">+{xp}</div></div>
          <div className="card flex-1 !p-3"><div className="text-xs font-bold text-brand">Richtig</div><div className="text-2xl font-bold">{right}/{n}</div></div>
          <div className="card flex-1 !p-3"><div className="text-xs font-bold text-orange-500">Streak</div><div className="flex items-center justify-center gap-1 text-2xl font-bold"><Icon name="flame" size={22} className="text-orange-500" />{streak}</div></div>
        </div>
        <div className="mt-auto space-y-2 pb-10 pt-6">
          <a className="btn-ghost w-full" href="#/korrektur">Bonus: Korrekturlesen</a>
          <button className="btn-primary w-full text-lg" onClick={() => go('/')}>Fertig</button>
        </div>
      </div>
    )
  }
  const st = stages[i]
  return (
    <Player key={st.key} items={st.items} mode={st.mode} time={st.mode === 'sprint' ? 60 : undefined} useHearts={false} why={st.mode !== 'sprint'}
      title={st.title} onQuit={() => go('/')}
      onDone={(sum, saving) => {
        if (saving) {
          if (st.key === 'lesson') saveLesson(lesson.id, sum.acc, lv)
          if (st.key === 'practice') refillHearts()
          if (st.key === 'sprint') update((s) => { s.sprints[kind] = Math.max(s.sprints[kind] || 0, sum.right) })
          setLog((l) => [...l, { xp: sum.xp, n: sum.n, right: sum.right }])
        } else setI((x) => x + 1)
      }} />
  )
}
