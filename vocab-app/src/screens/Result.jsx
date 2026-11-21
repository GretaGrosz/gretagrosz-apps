// After a test: the score, the words to practise; the streak moment; the "Find my level" result
import { useEffect, useMemo, useState } from 'react'
import { LEVELS, levelIndexOf } from '../lexicon'
import { DAYS_PER_COLOR, stageFor } from '../theme'
import { useT } from '../i18n'
import { BackButton, CheckIcon, NavBar, Ring, SpeakButton, Word, XIcon } from '../ui'

export const passMark = (total) => Math.ceil(total * 0.8)

function Missed({ results, lang }) {
  const t = useT()
  const missed = results.filter((r) => !r.correct)
  if (!missed.length) return null
  return (
    <>
      <p className="caption mb-2 mt-8 px-4">{t.missedCaption}</p>
      <div className="group">
        {missed.map((r) => (
          <div key={r.key} className="row justify-between gap-3">
            <span className="body secondary min-w-0 break-words">
              <Word text={r.front} />
            </span>
            <span className="flex min-w-0 items-center gap-1">
              <span className="headline break-words text-right">
                <Word text={r.answers[0]} />
              </span>
              <SpeakButton text={r.answers[0]} lang={lang} className="icon-btn -my-2 -mr-3 shrink-0" />
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

// mode: test | practice | review
export function Result({ results, mode, lang, backLabel, onRetry, onCards, onHome }) {
  const t = useT()
  const score = results.filter((r) => r.correct).length
  const total = results.length
  const mark = passMark(total)
  const passed = score >= mark
  const title = mode === 'review' ? t.reviewDone : mode === 'practice' ? t.practice : passed ? t.passed : score >= total / 2 ? t.close : t.notYet
  return (
    <main className="page">
      <NavBar plain left={<BackButton onClick={onHome} label={backLabel} />} />
      <div className="mt-4 flex flex-col items-center text-center">
        <Ring value={score / total} size={168} stroke={16} color={passed || mode !== 'test' ? 'var(--accent)' : 'var(--red-fill)'} slow>
          <span className="num text-[48px] font-bold leading-none">{score}</span>
          <span className="footnote num">{t.of('', total).trim()}</span>
        </Ring>
        <h1 className="title1 rise mt-5">{title}</h1>
        {mode === 'test' && !passed && <p className="body secondary mt-1">{t.toPass(mark)}</p>}
      </div>
      <Missed results={results} lang={lang} />
      <div className="mt-8 grid gap-3">
        {mode === 'test' && !passed ? (
          <>
            <button onClick={onRetry} className="btn btn-filled">
              {t.tryAgain}
            </button>
            <button onClick={onCards} className="btn btn-tinted">
              {t.flashcards}
            </button>
          </>
        ) : (
          <button onClick={onHome} className="btn btn-filled">
            {t.done}
          </button>
        )}
      </div>
    </main>
  )
}

const CONFETTI = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#30B0C7', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55']

// The streak moment after the first pass of the day
export function LevelUp({ from, to, results, lang, onDone }) {
  const t = useT()
  const before = stageFor(from)
  const after = stageFor(to)
  const newColor = from > 0 && before.color.id !== after.color.id
  const party = newColor || to % 10 === 0 || to === 1
  const [filled, setFilled] = useState(newColor || from === 0 ? 0 : before.dayInColor / DAYS_PER_COLOR)
  const score = results.filter((r) => r.correct).length
  useEffect(() => {
    const a = setTimeout(() => setFilled(after.dayInColor / DAYS_PER_COLOR), 350)
    return () => clearTimeout(a)
  }, [to])
  const pieces = useMemo(
    () =>
      party
        ? Array.from({ length: 44 }, (_, i) => ({
            left: `${(i * 53) % 100}%`,
            delay: `${0.5 + (i % 10) * 0.05}s`,
            color: CONFETTI[i % CONFETTI.length],
            duration: `${1.8 + (i % 5) * 0.25}s`,
          }))
        : [],
    [party],
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden" style={{ background: 'var(--bg)' }} role="dialog" aria-modal="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: p.left, background: p.color, animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
      <div className="page flex min-h-[100dvh] flex-col items-center pt-[max(48px,env(safe-area-inset-top))] text-center">
        <p className="caption fade mt-6">{t.testPassed(score, results.length)}</p>
        <div className="pop mt-6">
          <Ring value={Math.max(filled, 0.03)} size={220} stroke={22} slow>
            {from !== to && <span className="num-out num absolute text-[68px] font-bold leading-none">{from}</span>}
            <span className="num-in num absolute text-[68px] font-bold leading-none">{to}</span>
          </Ring>
        </div>
        <h1 className="large-title rise mt-7" style={{ animationDelay: '500ms' }}>
          {newColor || to === 1 ? t.colours[after.color.id] : t.dayN(to)}
        </h1>
        {(newColor || to === 1) && (
          <p className="body secondary rise mt-1" style={{ animationDelay: '600ms' }}>
            {newColor ? t.newColour : t.dayN(1)}
          </p>
        )}
        <div className="w-full text-left">
          <Missed results={results} lang={lang} />
        </div>
        <div className="mt-auto w-full pt-8">
          <button onClick={onDone} className="btn btn-filled fade w-full" autoFocus>
            {t.continue}
          </button>
        </div>
      </div>
    </div>
  )
}

// "Find my level": the highest level where you got at least one word right, stopping at the first level with none
export function PlacementResult({ results, currentDay, onStart, onBack, backLabel }) {
  const t = useT()
  let level = 0
  for (let L = 0; L < LEVELS.length; L++) {
    if (results.some((r) => r.level === L && r.correct)) level = L
    else break
  }
  const score = results.filter((r) => r.correct).length
  const found = LEVELS[level]
  const already = currentDay != null && levelIndexOf(currentDay) === level
  return (
    <main className="page">
      <NavBar plain left={<BackButton onClick={onBack} label={backLabel} />} />
      <div className="rise mt-4 flex flex-col items-center text-center">
        <Ring value={score / 10} size={168} stroke={16} slow>
          <span className="num text-[44px] font-bold leading-none">{score}</span>
          <span className="footnote">{t.right(score).replace(/^\d+\s*/, '')}</span>
        </Ring>
        <p className="caption mt-6">{t.yourLevel}</p>
        <h1 className="large-title">{found.name}</h1>
        <p className="body secondary">{t.levelNames[level]}</p>
      </div>

      <div className="group mt-8">
        {LEVELS.map((lv, L) => (
          <div key={lv.id} className="row justify-between">
            <span className={`body ${L === level ? 'font-semibold' : ''}`}>
              {lv.name} <span className="secondary font-normal">{t.levelNames[L]}</span>
            </span>
            <span className="flex gap-1.5">
              {results
                .filter((r) => r.level === L)
                .map((r) => (
                  <span
                    key={r.key}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ background: r.correct ? 'var(--green-fill)' : 'var(--red-fill)' }}
                    title={`${r.front} → ${r.answers[0]}`}
                  >
                    {r.correct ? <CheckIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3 w-3" />}
                  </span>
                ))}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3">
        <button onClick={() => onStart(already ? null : found.start)} className="btn btn-filled">
          {already ? t.done : t.startAt(found.name)}
        </button>
        {!already && currentDay != null && (
          <button onClick={() => onStart(null)} className="btn btn-tinted">
            {t.keepDay(currentDay + 1)}
          </button>
        )}
      </div>
    </main>
  )
}
