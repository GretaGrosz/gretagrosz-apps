// Runs a session of exercises: lesson, practice, checkpoint, placement or sprint.
import { useMemo, useRef, useState } from 'react'
import { Exercise, exerciseTitle } from './exercises.jsx'
import { Diff, En, Progress, back, mmss, useCountdown } from './ui.jsx'
import { useStore, getState, loseHeart, hearts as heartsOf, recordAnswer, addXP, touchStreak, currentStreak, update } from '../lib/store.js'
import { addMistake, review } from '../lib/srs.js'
import { sounds } from '../lib/sound.js'
import { shuffle, distance, normalize } from '../lib/check.js'
import { CAT_NAMES } from '../lib/curriculum.js'
import Icon from './Icon.jsx'
import { useEffect } from 'react'

export default function Player({ items: initial, mode = 'lesson', title, onDone, onQuit = back, time, useHearts = mode === 'lesson', why = true, xpBonus = 5 }) {
  const [queue, setQueue] = useState(() => initial.map((it, i) => ({ ...it, _k: i })))
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('answer') // answer | why | feedback | out | summary
  const [res, setRes] = useState(null)
  const [whyPick, setWhyPick] = useState(null)
  const [results, setResults] = useState([])
  const [sprintFlash, setSprintFlash] = useState(null)
  const hearts = useStore(heartsOf)
  const sound = useStore((s) => s.setup.sound)
  const sprint = mode === 'sprint'
  const finished = useRef(false)
  const left = useCountdown(time || 0, sprint && phase !== 'summary', () => finish(resultsRef.current))
  const resultsRef = useRef(results)
  resultsRef.current = results
  const item = queue[idx]
  const play = (k) => sound && sounds[k]()

  const whyOpts = useMemo(() => (item?.y ? shuffle(item.y) : []), [item])
  // Keyboard (computer): 1–9 picks a reason in the "Warum?" step, Enter continues after feedback
  useEffect(() => {
    const on = (e) => {
      if (phase === 'why' && /^[1-9]$/.test(e.key) && whyOpts[Number(e.key) - 1]) { e.preventDefault(); chooseWhy(whyOpts[Number(e.key) - 1]) }
      else if (phase === 'feedback' && e.key === 'Enter' && document.activeElement?.tagName !== 'BUTTON') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
  const firstCount = initial.length

  function finish(rs) {
    if (finished.current) return
    finished.current = true
    const first = rs.filter((r) => !r.repeat)
    const pts = first.reduce((a, r) => a + (r.ok ? (r.half ? 0.5 : 1) : 0), 0)
    const acc = first.length ? pts / first.length : 0
    const xp = Math.round(rs.filter((r) => r.ok).length + (sprint ? 0 : xpBonus) + (acc >= 0.9 && !sprint ? 5 : 0))
    if (mode !== 'placement') { addXP(xp); touchStreak() }
    play('done')
    const summary = { acc, xp, n: first.length, right: first.filter((r) => r.ok).length, results: rs }
    setRes(summary)
    setPhase('summary')
    onDone?.(summary, true)
  }

  function submit(r) {
    if (sprint) {
      record(r, false)
      setSprintFlash(r.ok ? 'ok' : 'bad')
      setTimeout(() => setSprintFlash(null), 250)
      next(r)
      return
    }
    setRes(r)
    if (r.ok && why && item.y && item.y.length > 1) { setPhase('why'); return }
    record(r, false)
    setPhase('feedback')
  }
  function chooseWhy(opt) {
    setWhyPick(opt)
    const half = opt !== item.y[0]
    const r = { ...res, half }
    setRes(r)
    record(r, half)
    setPhase('feedback')
  }
  function record(r, half) {
    const rep = !!item._repeat
    play(r.ok ? 'right' : 'wrong')
    recordAnswer({ ok: r.ok, half, skill: rep ? null : item.s, cat: rep ? null : item.c })
    if (item._card) review(item._card, r.ok && !half)
    else if (!r.ok && mode !== 'placement') addMistake(item)
    if (item.src !== 'gen' && item.id && !item.id.startsWith('g.') && !rep) update((s) => { s.seenItems = s.seenItems || {}; s.seenItems[item.id] = (s.seenItems[item.id] || 0) + 1 })
    setResults((rs) => [...rs, { id: item.id, ok: r.ok, half, repeat: rep, skill: item.s, cat: item.c, item }])
    if (!r.ok && useHearts) loseHeart()
    if (!r.ok && !rep && (mode === 'lesson' || mode === 'practice')) setQueue((q) => [...q, { ...item, _repeat: true, _k: q.length }])
  }
  function next(rLast) {
    const rs = sprint ? [...resultsRef.current] : results
    if (!sprint && useHearts && heartsOf(getState()) <= 0) { setPhase('out'); return }
    const nextIdx = idx + 1
    const qLen = sprint ? queue.length : queue.length
    if (nextIdx >= qLen) {
      if (sprint) { setIdx(nextIdx); return }
      finish(rs)
      return
    }
    setIdx(nextIdx); setPhase('answer'); setRes(null); setWhyPick(null)
  }

  if (phase === 'summary') return <Summary summary={res} title={title} mode={mode} onClose={() => onDone?.(res, false)} />
  if (phase === 'out') return <OutOfHearts onQuit={onQuit} />
  if (!item) {
    if (sprint) { setTimeout(() => finish(resultsRef.current), 0); return null }
    return null
  }

  const progress = sprint ? 1 - left / time : Math.min(1, results.filter((r) => r.ok || r.repeat === false).length / Math.max(1, queue.length))
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 lg:max-w-2xl lg:px-6">
      <div className="safe-t flex items-center gap-3 pb-3 pt-2">
        <button onClick={onQuit} aria-label="Beenden" className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full muted hover:bg-black/5 active:bg-black/5 dark:hover:bg-white/10"><Icon name="x" size={24} /></button>
        <Progress value={progress} className="flex-1" color={sprint ? 'bg-gold' : 'bg-brand'} />
        {sprint ? <span className="w-14 text-right font-bold tabular-nums">{mmss(left)}</span>
          : useHearts ? <span className="flex w-14 items-center justify-end gap-1 font-bold text-red-500"><Icon name="heart" size={20} className="fill-red-500" />{hearts}</span>
          : <span className="w-12 text-right text-sm font-semibold muted">{Math.min(idx + 1, queue.length)}/{queue.length}</span>}
      </div>
      {sprint && <div className="mb-2 flex items-center justify-center gap-3 text-sm font-semibold muted"><span className="flex items-center gap-1 text-green-600"><Icon name="check" size={16} />{results.filter((r) => r.ok).length}</span><span className="flex items-center gap-1 text-red-500"><Icon name="x" size={16} />{results.filter((r) => !r.ok).length}</span></div>}
      <div className={`flex flex-1 flex-col pb-4 ${sprintFlash === 'bad' ? 'animate-shake' : ''}`}>
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-brand">
          {item._repeat && <Icon name="repeat" size={14} className="mr-1 -mt-0.5" />}{item._repeat ? 'Noch einmal · ' : ''}{exerciseTitle(item)}
        </p>
        <Exercise key={item._k + (sprint ? '-' + idx : '')} item={item} onSubmit={submit} locked={phase !== 'answer'} />
      </div>
      {phase === 'why' && (
        <Sheet tone="why">
          <p className="flex items-center gap-2 text-lg font-bold text-green-700 dark:text-green-300"><Icon name="checkCircle" size={22} />Richtig! Und warum?</p>
          <p className="mb-3 text-sm muted">Mit dem richtigen Grund gibt es den vollen Punkt.</p>
          <div className="space-y-2">
            {whyOpts.map((o, n) => (
              <button key={o} onClick={() => chooseWhy(o)} className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl border-2 border-black/10 bg-white px-4 py-2 text-left font-medium hover:border-brand/50 dark:border-white/10 dark:bg-[#18201c]"><kbd className="hidden lg:inline">{n + 1}</kbd>{o}</button>
            ))}
          </div>
        </Sheet>
      )}
      {phase === 'feedback' && <Feedback item={item} res={res} whyPick={whyPick} onNext={() => next()} />}
    </div>
  )
}

function Sheet({ tone, children }) {
  const bg = tone === 'ok' ? 'bg-green-50 dark:bg-[#12291f]' : tone === 'bad' ? 'bg-red-50 dark:bg-[#2c1616]' : 'bg-white dark:bg-[#18201c]'
  return <div className={`safe-b sticky bottom-0 -mx-4 animate-pop rounded-t-3xl px-4 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,.12)] ${bg}`}>{children}</div>
}

function Feedback({ item, res, whyPick, onNext }) {
  const ok = res.ok
  return (
    <Sheet tone={ok ? 'ok' : 'bad'}>
      <p className={`text-xl font-bold ${ok ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
        <span className="flex items-center gap-2"><Icon name={ok ? (res.half ? 'halfCircle' : 'checkCircle') : 'xCircle'} size={24} />{ok ? (res.half ? 'Richtig – aber falscher Grund (½ Punkt)' : 'Richtig!') : 'Nicht ganz.'}</span>
      </p>
      {!ok && (
        <div className="mt-2">
          {res.textual && res.given ? <Diff given={res.given} correct={res.expected} mode={res.mode || (distance(normalize(res.given), normalize(res.expected)) > Math.max(6, String(res.expected).length * 0.35) ? 'word' : 'char')} /> : <p className="font-semibold">Richtig: {String(res.expected)}</p>}
          {res.note && <p className="mt-1 text-sm">{res.note}</p>}
        </div>
      )}
      {res.half && item.y && <p className="mt-1 text-sm">Der Grund ist: <b>{item.y[0]}</b></p>}
      {item.r && <p className="mt-2 flex gap-2 text-[15px]"><Icon name="bulb" size={18} className="mt-0.5 text-gold" /><span>{item.r}</span></p>}
      <En>{item.re}</En>
      {item.c && !ok && <p className="mt-1 text-xs muted">Kategorie: {CAT_NAMES[item.c] || item.c} · kommt in „Üben“ wieder</p>}
      <button autoFocus className={`btn mt-4 w-full text-lg text-white ${ok ? 'bg-green-600 shadow-[0_4px_0_#166534]' : 'bg-red-500 shadow-[0_4px_0_#991b1b]'}`} onClick={onNext}>Weiter <kbd className="ml-2 hidden border-white/40 lg:inline">Enter</kbd></button>
    </Sheet>
  )
}

function OutOfHearts({ onQuit }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <Icon name="heartCrack" size={64} className="text-red-500" strokeWidth={1.6} />
      <h2 className="h1 mt-4">Keine Herzen mehr</h2>
      <p className="mt-2 muted">Mach eine Übungsrunde mit deinen Fehlern – danach hast du wieder 5 Herzen.</p>
      <a href="#/ueben?refill=1" className="btn-primary mt-6 w-full">Fehler üben & Herzen auffüllen</a>
      <button onClick={onQuit} className="btn-ghost mt-3 w-full">Später</button>
    </div>
  )
}

function Summary({ summary, title, mode, onClose }) {
  const streak = useStore(currentStreak)
  const pct = Math.round(summary.acc * 100)
  const gold = summary.acc >= 0.9
  const wrong = summary.results.filter((r) => !r.ok && !r.repeat)
  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-6 pt-12 text-center">
      <div className="mx-auto flex h-24 w-24 animate-pop items-center justify-center rounded-[28px] bg-gradient-to-br from-[#6fdcac] to-brand text-white shadow-[0_10px_30px_rgba(22,147,107,.35)]"><Icon name={mode === 'sprint' ? 'zap' : gold ? 'trophy' : pct >= 70 ? 'star' : 'trendingUp'} size={48} strokeWidth={1.8} /></div>
      <h2 className="h1 mt-4">{mode === 'sprint' ? `${summary.right} richtig!` : gold ? 'Ausgezeichnet!' : pct >= 70 ? 'Gut gemacht!' : 'Weiter so!'}</h2>
      {title && <p className="muted">{title}</p>}
      <div className="mt-6 flex gap-2">
        <div className="card flex-1 !p-3"><div className="text-xs font-bold text-gold">XP</div><div className="text-2xl font-bold">+{summary.xp}</div></div>
        <div className="card flex-1 !p-3"><div className="text-xs font-bold text-brand">Genauigkeit</div><div className="text-2xl font-bold">{pct}%</div></div>
        <div className="card flex-1 !p-3"><div className="text-xs font-bold text-orange-500">Streak</div><div className="flex items-center justify-center gap-1 text-2xl font-bold"><Icon name="flame" size={22} className="text-orange-500" />{streak}</div></div>
      </div>
      {mode === 'lesson' && <p className="mt-4 text-sm muted">{gold ? 'Lektion vergoldet (≥ 90 %).' : 'Ab 90 % wird die Lektion golden – wiederhole sie später.'}</p>}
      {wrong.length > 0 && (
        <div className="card mt-4 text-left">
          <p className="mb-2 text-sm font-bold">Diese Fehler kommen in „Üben“ wieder:</p>
          <ul className="space-y-1 text-sm">
            {wrong.slice(0, 6).map((r, i) => <li key={i}>• {String([].concat(r.item.a)[0]).slice(0, 80)}</li>)}
          </ul>
        </div>
      )}
      <div className="mt-auto pb-10 pt-6"><button className="btn-primary w-full text-lg" onClick={onClose}>Weiter</button></div>
    </div>
  )
}
