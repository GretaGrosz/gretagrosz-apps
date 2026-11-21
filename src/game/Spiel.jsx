import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBack } from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { CheckIcon, ChevronLeft, XIcon } from '../components/Icons.jsx'
import { SPRING } from '../motion.js'
import Scene from './scene/Scene.jsx'
import { LEARN_PATH, REWARD, buildDay } from './cases/proto.js'

// Loopy & Co. – Prototyp (Schritt 1 aus docs/loopy-tycoon-plan.md): die Insel in 3D, Loopy mit
// Stimmungen, der Marktstand und ein kurzer Spieltag mit drei Fällen. Noch ohne Speichern und XP.
//
// Ablauf: map → (enter → ask → result → leave) je Fall → summary → map

export default function Spiel() {
  const navigate = useNavigate()
  const back = useBack('/')
  const [phase, setPhase] = useState('map')
  const [day, setDay] = useState(1)
  const [cases, setCases] = useState([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [coins, setCoins] = useState(50)
  const [results, setResults] = useState([])
  const [poked, setPoked] = useState(false)
  const [burst, setBurst] = useState(0)
  const timers = useRef([])
  const coinRef = useRef(null)

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms))
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const webgl = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  }, [])

  const current = cases[idx]
  const right = picked !== null && current && picked === current.correct

  const enter = () => {
    setPicked(null)
    setPhase('enter')
    later(() => setPhase('ask'), 1500)
  }
  const startDay = () => {
    if (phase !== 'map') return
    setCases(buildDay())
    setIdx(0)
    setResults([])
    enter()
  }
  const choose = (i) => {
    if (phase !== 'ask') return
    const ok = i === current.correct
    setPicked(i)
    setResults((r) => [...r, ok])
    setCoins((c) => Math.max(0, c + (ok ? REWARD.right : REWARD.wrong)))
    if (ok) setBurst((b) => b + 1)
    navigator.vibrate?.(ok ? 12 : [20, 40, 20])
    setPhase('result')
  }
  const next = () => {
    setPhase('leave')
    later(() => {
      if (idx + 1 < cases.length) {
        setIdx(idx + 1)
        enter()
      } else setPhase('summary')
    }, 750)
  }
  const endDay = () => {
    setDay((d) => d + 1)
    setPhase('map')
  }
  const poke = () => {
    if (poked) return
    setPoked(true)
    later(() => setPoked(false), 1900)
  }

  const stars = results.filter(Boolean).length
  const loopyMood =
    phase === 'ask' ? 'think' : phase === 'result' ? (right ? 'happy' : 'sad') : phase === 'summary' ? (stars >= 2 ? 'happy' : 'sad') : poked ? 'happy' : 'idle'
  const customer =
    current && ['enter', 'ask', 'result', 'leave'].includes(phase)
      ? {
          key: `${day}-${idx}`,
          ...current.kunde,
          present: phase !== 'leave',
          mood: phase === 'ask' ? 'talk' : phase === 'result' ? current.options[picked].kunde : 'ok',
        }
      : null

  return (
    <div className="game fixed inset-0 z-40 overflow-hidden font-body">
      <div className="absolute inset-0">
        {webgl ? (
          <Scene phase={phase} loopyMood={loopyMood} customer={customer} onStart={startDay} onPoke={poke} />
        ) : (
          <div className="flex h-full items-center justify-center px-8 text-center text-[17px] font-semibold">
            Dein Gerät kann die 3D-Insel leider nicht anzeigen.
          </div>
        )}
      </div>

      {/* Kopfzeile */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2">
          <button onClick={back} aria-label="Zurück zu BW Buddy" className="game-float pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-text active:opacity-60">
            <ChevronLeft className="h-[22px] w-[22px]" />
          </button>
          <div className="game-float rounded-full bg-surface px-4 py-2 text-[15px] font-semibold">Tag {day}</div>
          <div ref={coinRef} className="game-float flex items-center gap-1.5 rounded-full bg-surface py-2 pl-3 pr-4 text-[15px] font-semibold tabular-nums">
            <span className="game-coin" />
            <Count value={coins} />
          </div>
        </div>
      </div>

      {/* Karte: Firmenname und Start */}
      <AnimatePresence>
        {phase === 'map' && (
          <motion.div
            key="map"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={SPRING}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(20px,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto max-w-md">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">Loopy &amp; Co.</p>
              <p className="text-[28px] font-bold leading-tight">Loopys Bonbonstand</p>
              <p className="mt-0.5 text-[15px] text-label2">Am Stand wartet Kundschaft.</p>
              <Button onClick={startDay} className="pointer-events-auto mt-4 w-full">
                Tag {day} starten
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sprechblase */}
      <AnimatePresence>
        {current && (phase === 'ask' || phase === 'result') && (
          <motion.div
            key={`talk-${idx}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={SPRING}
            className="pointer-events-none absolute inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+56px)] z-10 px-4"
          >
            <div className="game-float pointer-events-auto mx-auto max-w-md rounded-card bg-surface px-4 py-3.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wide text-accent-text">{current.kunde.name}</span>
                <span className="text-[13px] text-label3 tabular-nums">
                  {idx + 1} / {cases.length}
                </span>
              </div>
              <Typed key={`${idx}-${phase}`} text={phase === 'ask' ? current.text : current.options[picked].reply} fast={phase === 'result'} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Antworten */}
      <AnimatePresence>
        {current && phase === 'ask' && (
          <motion.div
            key={`opts-${idx}`}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ ...SPRING, delay: 0.2 }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(18px,env(safe-area-inset-bottom))]"
          >
            <div className="mx-auto flex max-w-md flex-col gap-2.5">
              <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-label2">Was sagt Loopy?</p>
              {current.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => choose(i)}
                  className="game-float pointer-events-auto flex items-center gap-3 rounded-card bg-surface px-4 py-3.5 text-left text-[16px] leading-snug transition-transform duration-150 active:scale-[0.98]"
                >
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/10 text-[13px] font-semibold text-accent-text">
                    {'ABC'[i]}
                  </span>
                  <span>{o.text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ergebnis */}
      <AnimatePresence>
        {current && phase === 'result' && (
          <motion.div
            key={`res-${idx}`}
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={SPRING}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(18px,env(safe-area-inset-bottom))]"
          >
            <div className="game-float pointer-events-auto mx-auto max-w-md rounded-card bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className={`text-[22px] font-bold ${right ? 'text-success' : 'text-danger'}`}>{right ? 'Richtig' : 'Nicht ganz'}</span>
                <span className="flex items-center gap-1.5 text-[15px] font-semibold text-label2 tabular-nums">
                  {right ? `+${REWARD.right}` : `−${-REWARD.wrong}`}
                  <span className="game-coin" />
                </span>
              </div>
              {!right && (
                <p className="mt-2 text-[15px] font-semibold leading-snug">Richtig wäre: „{current.options[current.correct].text}"</p>
              )}
              <p className="mt-2 text-[15px] leading-snug text-label2">{current.explanation}</p>
              <div className="mt-4 flex gap-3">
                <Button variant="secondary" onClick={() => navigate(LEARN_PATH, { state: { step: current.step } })} className="flex-1">
                  Nachlesen
                </Button>
                <Button onClick={next} className="flex-1">
                  Weiter
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tagesabschluss */}
      <AnimatePresence>
        {phase === 'summary' && (
          <motion.div
            key="sum"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={SPRING}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-[max(18px,env(safe-area-inset-bottom))]"
          >
            <div className="game-float pointer-events-auto mx-auto max-w-md rounded-card bg-surface p-5">
              <p className="text-center text-[13px] font-semibold uppercase tracking-wide text-label2">Tag {day} geschafft</p>
              <div className="mt-2 flex justify-center gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.svg
                    key={i}
                    viewBox="0 0 24 24"
                    className="h-11 w-11"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...SPRING, delay: 0.25 + i * 0.18 }}
                  >
                    <path
                      d="M12 2.6l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8z"
                      fill={i < stars ? '#FFD45E' : '#E5E5EA'}
                      stroke={i < stars ? '#FFD45E' : '#E5E5EA'}
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                ))}
              </div>
              <p className="mt-2 text-center text-[20px] font-bold">
                {stars === 3 ? 'Perfekt, alle Fälle richtig' : stars === 2 ? 'Gut gemacht' : stars === 1 ? 'Da geht noch mehr' : 'Morgen wird es besser'}
              </p>
              <div className="mt-4 rounded-2xl bg-bg px-4 py-3">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">Heute gelernt</p>
                <ul className="mt-2 space-y-2">
                  {cases.map((c, i) => (
                    <li key={c.id} className="flex gap-2.5 text-[15px] leading-snug">
                      <span className={`mt-[3px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-white ${results[i] ? 'bg-success' : 'bg-danger'}`}>
                        {results[i] ? <CheckIcon className="h-3 w-3" strokeWidth={3} /> : <XIcon className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {c.learned}
                    </li>
                  ))}
                </ul>
              </div>
              <Button onClick={endDay} className="mt-4 w-full">
                Zur Insel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CoinBurst trigger={burst} target={coinRef} />
    </div>
  )
}

// Text erscheint Buchstabe für Buchstabe; Antippen zeigt ihn sofort ganz
function Typed({ text, fast = false }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= text.length) return
    const id = setTimeout(() => setN((v) => Math.min(text.length, v + (fast ? 3 : 2))), 28)
    return () => clearTimeout(id)
  }, [n, text, fast])
  return (
    <p onClick={() => setN(text.length)} className="relative mt-1 text-[17px] leading-snug">
      <span className="invisible">{text}</span>
      <span className="absolute inset-0">{text.slice(0, n)}</span>
    </p>
  )
}

// Zählt sichtbar zum neuen Wert
function Count({ value }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (shown === value) return
    const id = setTimeout(() => setShown((s) => s + Math.sign(value - s)), 35)
    return () => clearTimeout(id)
  }, [shown, value])
  return <span>{shown}</span>
}

// Münzen fliegen von der Bildmitte zum Kontostand
function CoinBurst({ trigger, target }) {
  const [flights, setFlights] = useState([])
  useEffect(() => {
    if (!trigger) return
    const box = target.current?.getBoundingClientRect()
    const to = box ? { x: box.left + 14, y: box.top + 8 } : { x: window.innerWidth - 60, y: 30 }
    const from = { x: window.innerWidth / 2 - 9, y: window.innerHeight * 0.42 }
    const batch = Array.from({ length: 7 }, (_, i) => ({ id: `${trigger}-${i}`, from, to, i }))
    setFlights((f) => [...f, ...batch])
    const id = setTimeout(() => setFlights((f) => f.filter((c) => !batch.includes(c))), 1400)
    return () => clearTimeout(id)
  }, [trigger, target])
  return flights.map((c) => (
    <motion.span
      key={c.id}
      className="game-coin pointer-events-none fixed left-0 top-0 z-20"
      initial={{ x: c.from.x, y: c.from.y, scale: 0 }}
      animate={{
        x: [c.from.x, c.from.x + (c.i - 3) * 26, c.to.x],
        y: [c.from.y, c.from.y - 70 - (c.i % 3) * 22, c.to.y],
        scale: [0, 1, 0.8],
      }}
      transition={{ duration: 0.85, delay: c.i * 0.06, times: [0, 0.4, 1], ease: 'easeInOut' }}
    />
  ))
}
