import { useMemo } from 'react'
import Player from '../components/Player.jsx'
import { getState, update, hearts as heartsOf, useStore } from '../lib/store.js'
import { today } from '../lib/dates.js'
import { lessonById, unitById, buildLesson, buildCheckpoint, buildEndless, buildReviewUnit } from '../lib/curriculum.js'
import { go, Page, TopBar } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

export function saveLesson(lessonId, acc, lv) {
  update((s) => {
    const prev = s.lessons[lessonId] || {}
    s.lessons[lessonId] = {
      done: true, best: Math.max(prev.best || 0, acc), gold: prev.gold || acc >= 0.9,
      level: Math.max(prev.level || 0, lv), plays: (prev.plays || 0) + 1, last: today(),
    }
  })
}
export function lessonLevel(lessonId) {
  const st = getState().lessons[lessonId]
  return st?.done ? Math.min(3, (st.level || 1) + 1) : 1
}

export function LessonScreen({ lessonId, level }) {
  const lesson = lessonById(lessonId)
  const hearts = useStore(heartsOf)
  const st = getState().lessons[lessonId]
  const lv = level || (st?.done ? Math.min(3, (st.level || 1) + 1) : 1)
  const items = useMemo(() => (lesson ? buildLesson(lesson, { level: lv, seen: getState().seenItems || {} }) : []), [lessonId, lv])
  if (!lesson) return <Page><TopBar title="Lektion nicht gefunden" /></Page>
  if (hearts <= 0) {
    return (
      <Page className="pt-20 text-center">
        <Icon name="heartCrack" size={64} className="mx-auto text-red-500" strokeWidth={1.6} />
        <h2 className="h1 mt-3">Keine Herzen mehr</h2>
        <p className="mt-2 muted">Übe deine Fehler, dann bekommst du wieder 5 Herzen.</p>
        <a href="#/ueben?refill=1" className="btn-primary mt-6 w-full">Fehler üben</a>
      </Page>
    )
  }
  const onDone = (sum, saving) => {
    if (saving) saveLesson(lessonId, sum.acc, lv)
    else go('/pfad')
  }
  return <Player items={items} mode="lesson" title={`${lesson.title} · Level ${lv}`} onDone={onDone} xpBonus={10} />
}

export function CheckpointScreen({ unitId, skip }) {
  const u = unitById(unitId)
  const items = useMemo(() => (u ? buildCheckpoint(u, { n: skip ? 20 : 15 }) : []), [unitId])
  if (!u) return null
  const onDone = (sum, saving) => {
    if (saving) {
      update((s) => {
        const prev = s.units[unitId] || {}
        const passed = sum.acc >= 0.9
        s.units[unitId] = { ...prev, checkpoint: Math.max(prev.checkpoint || 0, sum.acc), passed: prev.passed || passed, skipped: prev.skipped || (passed && skip) }
      })
    } else go('/pfad')
  }
  return <Player items={items} mode="checkpoint" useHearts={false} title={`${skip ? 'Überspringen-Test' : 'Checkpoint'}: ${u.title} – ${'bestanden ab 90 %'}`} onDone={onDone} xpBonus={15} />
}

export function EndlessScreen({ unitId }) {
  const u = unitById(unitId)
  const items = useMemo(() => (u ? buildEndless(u, { n: 15 }) : []), [unitId])
  if (!u) return null
  return <Player items={items} mode="practice" useHearts={false} title={`Endlos-Training: ${u.title}`} onDone={(sum, saving) => !saving && go(`/endlos/${unitId}?r=${Date.now()}`)} />
}

export function ReviewUnitScreen() {
  const items = useMemo(() => buildReviewUnit(getState(), { n: 15 }), [])
  return <Player items={items} mode="practice" useHearts={false} title="Wiederholung" onDone={(sum, saving) => !saving && go('/')} />
}
