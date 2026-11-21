import { useEffect, useRef, useState } from 'react'
import { useStore, getState } from '../lib/store.js'
import { UNITS, unitById, nextLesson, phaseOf, PROTECTED, unitDone } from '../lib/curriculum.js'
import { Page, TopBar, Modal, En, go } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

const OFFSETS = [0, 52, 78, 52, 0, -52, -78, -52]
const PHASE_NAMES = { 1: 'Phase 1 · Fundament', 2: 'Phase 2 · Textsorten', 4: 'C1-Pfad · B2 → C1' }

export default function Path() {
  const s = useStore()
  const next = nextLesson(s)
  const ph = phaseOf(s.setup)
  const [open, setOpen] = useState(null)
  const cur = useRef()
  useEffect(() => { cur.current?.scrollIntoView({ block: 'center' }) }, [])
  let lastPhase = 0
  let reachedNext = false
  return (
    <Page>
      <TopBar title="Lernpfad" onBack={null} right={<a href="#/ich" className="chip"><Icon name="star" size={15} className="text-gold" />{s.xp.total} XP</a>} />
      {ph.n === 3 && (
        <div className="card mb-6 border-2 border-gold">
          <p className="text-xs font-bold uppercase tracking-wide text-gold">Phase 3 · Prüfungsmodus</p>
          <p className="mt-1 font-bold">Keine neuen Units mehr. Wiederholung gemischt, gewichtet nach deinen Schwächen.</p>
          <div className="mt-3 flex gap-2">
            <a href="#/wiederholung" className="btn-gold flex-1 gap-2"><Icon name="repeat" size={18} />Wiederholung</a>
            <a href="#/simulation" className="btn-ghost flex-1 gap-2"><Icon name="clock" size={18} />Simulation</a>
          </div>
        </div>
      )}
      {UNITS.map((u) => {
        const header = u.phase !== lastPhase ? (lastPhase = u.phase, (
          <div key={'ph' + u.phase} className="mb-3 mt-6 text-center">
            <h2 className="text-sm font-bold uppercase tracking-widest muted">{PHASE_NAMES[u.phase]}</h2>
            {u.phase === 4 && <p className="mx-auto mt-1 max-w-sm text-xs muted">Nach der Schularbeit (oder wenn du schneller bist): die Grammatik bis C1. Partizipialattribute, Passiversatz, Modalverben, Konjunktiv, Stil.</p>}
          </div>
        )) : null
        const passed = s.units[u.id]?.passed
        const doneUnit = unitDone(s, u)
        return (
          <section key={u.id}>
            {header}
            <div className={`rounded-3xl p-4 text-white ${doneUnit ? 'bg-gold' : 'bg-brand'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide opacity-80"><span className="mr-1 rounded bg-white/25 px-1.5 py-0.5">{u.level}</span> Unit {u.n}{PROTECTED.includes(u.id) ? ' · deine Schwachstelle' : ''}</p>
                  <p className="text-lg font-bold leading-tight">{u.title}</p>
                </div>
                <a href={`#/tipps/${u.id}`} className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold hover:bg-white/30"><Icon name="book" size={16} />Tipps</a>
              </div>
              {!doneUnit && <button onClick={() => go(`/checkpoint/${u.id}?skip=1`)} className="mt-2 text-xs font-semibold underline opacity-90">Überspringen-Test (≥ 90 %)</button>}
              {passed && <p className="mt-1 flex items-center gap-1 text-xs font-semibold"><Icon name="check" size={14} />Checkpoint bestanden ({Math.round(s.units[u.id].checkpoint * 100)} %)</p>}
            </div>
            <div className="flex flex-col items-center py-5">
              {u.lessons.map((l, i) => {
                const st = s.lessons[l.id]
                const isNext = next?.id === l.id
                if (isNext) reachedNext = true
                const done = st?.done || passed
                const locked = !done && !isNext && reachedNext
                const gold = st?.gold
                return (
                  <div key={l.id} ref={isNext ? cur : undefined} className="relative my-2" style={{ transform: `translateX(${OFFSETS[i % OFFSETS.length]}px)` }}>
                    {isNext && <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl bg-white px-3 py-1 text-xs font-bold text-brand shadow dark:bg-[#1d2622]">START</div>}
                    <button onClick={() => setOpen({ l, u, locked, done, isNext, st })} aria-label={l.title}
                      className={`flex h-[72px] w-[72px] items-center justify-center rounded-full text-3xl transition active:translate-y-1 ${
                        gold ? 'bg-gold text-white shadow-[0_6px_0_#b07b0e]'
                          : done ? 'bg-brand text-white shadow-[0_6px_0_#0f7353]'
                          : isNext ? 'animate-bob bg-brand text-white shadow-[0_6px_0_#0f7353] ring-4 ring-brand/30'
                          : 'bg-[#d9dedb] text-white shadow-[0_6px_0_#b7bfba] dark:bg-[#2a332f] dark:shadow-[0_6px_0_#1b221f]'}`}>
                      <Icon name={gold ? 'star' : done ? 'check' : locked ? 'lock' : 'play'} size={30} strokeWidth={2.6} className={gold ? 'fill-white' : ''} />
                    </button>
                  </div>
                )
              })}
              <div className="my-2">
                <button onClick={() => go(`/checkpoint/${u.id}`)} aria-label="Checkpoint"
                  className={`flex h-[80px] w-[80px] items-center justify-center rounded-3xl text-white ${passed ? 'bg-gold shadow-[0_6px_0_#b07b0e]' : 'bg-[#d9dedb] shadow-[0_6px_0_#b7bfba] dark:bg-[#2a332f] dark:shadow-[0_6px_0_#1b221f]'}`}><Icon name="trophy" size={34} /></button>
              </div>
              {doneUnit && <a href={`#/endlos/${u.id}`} className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand"><Icon name="infinity" size={18} />Endlos-Training</a>}
            </div>
          </section>
        )
      })}
      <Modal open={!!open} onClose={() => setOpen(null)}>
        {open && <LessonSheet {...open} close={() => setOpen(null)} />}
      </Modal>
    </Page>
  )
}

function LessonSheet({ l, u, locked, done, st, close }) {
  const level = st?.level || 0
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-brand">Unit {u.n} · {u.title}</p>
      <h3 className="h1 mt-1">{l.title}</h3>
      {st && <p className="mt-1 text-sm muted">Beste Genauigkeit: {Math.round((st.best || 0) * 100)} % · Level {Math.max(1, level)} {st.gold ? '· golden' : ''}</p>}
      {locked ? (
        <>
          <p className="mt-3">Diese Lektion ist noch gesperrt. Du kannst die ganze Unit mit dem Überspringen-Test freischalten (≥ 90 %).</p>
          <button className="btn-primary mt-4 w-full" onClick={() => go(`/checkpoint/${u.id}?skip=1`)}>Überspringen-Test starten</button>
        </>
      ) : (
        <div className="mt-4 space-y-2">
          {!done && <button className="btn-primary w-full text-lg" onClick={() => go(`/lektion/${l.id}`)}>Start (+10 XP)</button>}
          {done && [1, 2, 3].map((lv) => (
            <button key={lv} disabled={lv > level + 1} className={lv === Math.min(3, level + 1) ? 'btn-primary w-full' : 'btn-ghost w-full'} onClick={() => go(`/lektion/${l.id}?lvl=${lv}`)}>
              Level {lv}: {lv === 1 ? 'antippen' : lv === 2 ? 'Antworten tippen' : 'ganze Sätze, keine Hilfen'} {lv > level + 1 ? <Icon name="lock" size={16} className="ml-1" /> : ''}
            </button>
          ))}
          <a className="btn-ghost w-full gap-2" href={`#/tipps/${u.id}`}><Icon name="book" size={18} />Tipps zur Unit</a>
        </div>
      )}
      <button className="mt-2 w-full py-2 text-sm muted" onClick={close}>Schließen</button>
    </div>
  )
}

export function Tips({ unitId }) {
  const u = unitById(unitId)
  if (!u) return <Page><TopBar title="Nicht gefunden" /></Page>
  const t = u.tips
  return (
    <Page>
      <TopBar title={`Tipps: ${u.title}`} />
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Die Regel</p>
        <p className="mt-1 text-[17px] leading-relaxed">{t.de}</p>
        <En className="!text-[15px] !not-italic">{t.en}</En>
      </div>
      <div className="lg:grid lg:grid-cols-2 lg:gap-4">
      <div>
      {t.table && (
        <div className="card mt-3 overflow-x-auto !p-0">
          <table className="w-full text-left text-sm">
            <tbody>
              {t.table.map((row, i) => (
                <tr key={i} className={i % 2 ? 'bg-black/[.03] dark:bg-white/[.03]' : ''}>
                  {row.map((c, j) => <td key={j} className={`px-3 py-2 ${j === 0 || (i === 0 && t.table[0][0] === '') ? 'font-bold' : ''}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
      <div>
      <div className="card mt-3 border-l-4 border-l-[#3b82f6]">
        <p className="text-xs font-bold uppercase tracking-wide text-[#3b82f6]">English vs. Deutsch</p>
        <p className="mt-1 leading-relaxed">{t.contrast}</p>
      </div>
      <div className="card mt-3">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Beispiele</p>
        <ul className="mt-2 space-y-2">
          {t.examples.map((e, i) => <li key={i} className="rounded-xl bg-brand-light/60 px-3 py-2 dark:bg-brand/15">{e}</li>)}
        </ul>
      </div>
      </div>
      </div>
      <button className="btn-primary mt-5 w-full lg:w-auto lg:px-10" onClick={() => { const l = u.lessons.find((x) => !getState().lessons[x.id]?.done) || u.lessons[0]; go(`/lektion/${l.id}`) }}>Los geht’s</button>
    </Page>
  )
}
