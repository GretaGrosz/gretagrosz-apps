// Flashcards: flip a card, then "Got it" or "Again". Swipe right/left does the same, and so do → / ← on a keyboard.
// "Again" cards go to the back of the pile until every card is done.
import { useEffect, useRef, useState } from 'react'
import { useT } from '../i18n'
import { speak } from '../speech'
import { useSessionState } from '../store'
import { BackButton, CheckIcon, NavBar, SpeakButton, Word, vibrate } from '../ui'

const SWIPE = 90 // px needed to count as a swipe

export default function Flashcards({ id, words, from, lang, sound, backLabel, onBack, onFinished, onTest }) {
  const t = useT()
  const [s, setS] = useSessionState(`deca-c:${id}`, () => ({ queue: words.map((_, n) => n), known: [], missed: [], round: 0 }))
  const [flipped, setFlipped] = useState(false)
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [fly, setFly] = useState(null) // 'left' | 'right' while the card flies off
  const start = useRef(null)
  const reported = useRef(false)

  const current = s.queue[0]
  const word = current != null ? words[current] : null
  const done = current == null

  useEffect(() => {
    if (done && !reported.current) {
      reported.current = true
      onFinished?.()
    }
  }, [done])

  const flip = () => {
    if (!flipped && sound && word) speak(word.answers[0], lang)
    setFlipped(!flipped)
  }

  const decide = (dir) => {
    if (fly || done) return
    setFly(dir)
    vibrate(dir === 'right' ? 10 : [20, 30, 20])
    setTimeout(() => {
      setS((p) =>
        dir === 'right'
          ? { ...p, known: [...p.known, p.queue[0]], queue: p.queue.slice(1), round: p.round + 1 }
          : { ...p, missed: p.missed.includes(p.queue[0]) ? p.missed : [...p.missed, p.queue[0]], queue: [...p.queue.slice(1), p.queue[0]], round: p.round + 1 },
      )
      setFly(null)
      setDx(0)
      setFlipped(false)
    }, 200)
  }

  const restart = () => {
    reported.current = true
    setS((p) => ({ queue: words.map((_, n) => n), known: [], missed: [], round: p.round + 1 }))
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return
      if (done) return
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        flip()
      } else if (e.key === 'ArrowLeft') decide('left')
      else if (e.key === 'ArrowRight') decide('right')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const onDown = (e) => {
    if (fly) return
    start.current = { x: e.clientX, moved: false }
    setDragging(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // pointer capture not available: moves still arrive while over the card
    }
  }
  const onMove = (e) => {
    if (!start.current) return
    const d = e.clientX - start.current.x
    if (Math.abs(d) > 6) start.current.moved = true
    setDx(d)
  }
  const onUp = (e) => {
    if (!start.current) return
    const d = e.clientX - start.current.x
    const moved = start.current.moved || Math.abs(d) > 6
    start.current = null
    setDragging(false)
    if (!moved) {
      setDx(0)
      flip()
    } else if (d <= -SWIPE) decide('left')
    else if (d >= SWIPE) decide('right')
    else setDx(0)
  }

  const width = typeof window !== 'undefined' ? window.innerWidth : 400
  const offset = fly === 'left' ? -width * 1.2 : fly === 'right' ? width * 1.2 : dx
  const pull = Math.min(1, Math.abs(offset) / SWIPE)

  return (
    <main className="page page-fill overflow-x-hidden">
      <NavBar left={<BackButton onClick={onBack} label={backLabel} />} title={t.flashcards} right={<span className="footnote num pr-2">{t.of(s.known.length, words.length)}</span>} />
      <div className="segments mt-3" aria-hidden="true">
        {words.map((_, n) => (
          <span key={n} className={s.known.includes(n) ? 'right' : s.missed.includes(n) ? 'wrong' : n === current ? 'on' : ''} />
        ))}
      </div>

      {done ? (
        <div className="flex flex-1 flex-col items-center pt-16 text-center">
          <span className="pop flex h-20 w-20 items-center justify-center rounded-full text-white" style={{ background: 'var(--green-fill)' }}>
            <CheckIcon className="h-10 w-10" />
          </span>
          <h1 className="title2 rise mt-5">{t.allDone(words.length)}</h1>
          <div className="mt-auto grid w-full gap-3 pt-10">
            <button onClick={onTest} className="btn btn-filled">
              {t.takeTest}
            </button>
            <button onClick={restart} className="btn btn-tinted">
              {t.goAgain}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="relative mx-auto mt-6 aspect-[4/5] max-h-[52dvh] w-full">
            {s.queue.length > 1 && <div className="absolute inset-0 translate-y-2 scale-[0.95] rounded-[28px] bg-[var(--surface)] opacity-60" />}
            <div key={s.round} className="pop absolute inset-0">
              <div
                role="button"
                tabIndex={0}
                aria-label={t.flip}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className="flip absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
                style={{
                  transform: `translateX(${offset}px) rotate(${offset / 20}deg)`,
                  transition: dragging ? 'none' : 'transform 200ms cubic-bezier(.2,.8,.2,1)',
                }}
              >
                <div className={`flip-inner relative h-full w-full ${flipped ? 'flipped' : ''}`}>
                  <div className="flip-face absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[28px] bg-[var(--surface)] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                    <span className="caption">{t.languages[from]}</span>
                    <span className="mt-3 break-words text-center text-[36px] font-bold leading-tight">
                      <Word text={word.front} />
                    </span>
                    <span className="kbd absolute bottom-5 opacity-70">Space</span>
                  </div>
                  <div className="flip-face flip-back absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-[28px] p-6" style={{ background: 'var(--button)', color: 'var(--on-accent)' }}>
                    <span className="text-[13px] font-semibold uppercase opacity-80">{t.languages[lang]}</span>
                    <span className="mt-3 break-words text-center text-[36px] font-bold leading-tight">
                      <Word text={word.answers[0]} />
                    </span>
                    {word.answers.length > 1 && <span className="mt-3 text-center text-[15px] opacity-85">{word.answers.slice(1).join(' · ')}</span>}
                    <SpeakButton text={word.answers[0]} lang={lang} className="icon-btn absolute bottom-3" onDark />
                  </div>
                </div>
                {/* Colour while pulling: green to the right, red to the left */}
                <div
                  className="pointer-events-none absolute inset-0 flex items-start justify-center rounded-[28px] pt-7"
                  style={{ background: offset > 0 ? 'var(--green-fill)' : 'var(--red-fill)', opacity: pull * 0.9 }}
                >
                  <span className="rounded-full border-[3px] border-white px-4 py-1 text-[20px] font-bold uppercase text-white">{offset > 0 ? t.gotIt : t.again}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 pt-8">
            <button onClick={() => decide('left')} className="btn btn-red">
              <span className="kbd" style={{ background: 'rgba(255,255,255,0.25)' }}>←</span>
              {t.again}
            </button>
            <button onClick={() => decide('right')} className="btn btn-green">
              {t.gotIt}
              <span className="kbd" style={{ background: 'rgba(0,0,0,0.12)' }}>→</span>
            </button>
          </div>
        </>
      )}
    </main>
  )
}
