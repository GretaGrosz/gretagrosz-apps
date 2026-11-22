import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/Button.jsx'
import Sheet from '../../components/Sheet.jsx'
import { CheckIcon, ChevronLeft, ChevronRight, XIcon } from '../../components/Icons.jsx'
import { SPRING } from '../../motion.js'
import { getKapitelList, jahrgaenge } from '../../data/curriculum.js'
import { CANDY, DAY_LEN, RUSH } from '../sim.js'

// Bedienelemente und Fenster von Loopy & Co. (über der 3D-Insel)

export function Pill({ children, className = '' }) {
  return <div className={`game-float flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[15px] font-semibold tabular-nums ${className}`}>{children}</div>
}

// Zählt sichtbar zum neuen Wert
export function Count({ value }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (shown === value) return
    const diff = value - shown
    const stepBy = Math.max(1, Math.round(Math.abs(diff) / 12))
    const id = setTimeout(() => setShown((s) => s + Math.sign(diff) * Math.min(stepBy, Math.abs(value - s))), 30)
    return () => clearTimeout(id)
  }, [shown, value])
  return <span>{shown}</span>
}

// ---------- Kopfzeile während des Spiels ----------
export function Hud({ t, clock, progress, rush, coins, combo, onPause }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
        <button onClick={onPause} aria-label={t('paused')} className="game-float pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-text active:opacity-60">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor"><rect x="6" y="5" width="4.2" height="14" rx="1.4" /><rect x="13.8" y="5" width="4.2" height="14" rx="1.4" /></svg>
        </button>
        <div className="flex flex-col items-center gap-1">
          <Pill className={rush ? '!bg-[#FF5E8A] text-white' : ''}>
            <SunIcon />
            {clock}
          </Pill>
          <DayBar progress={progress} />
        </div>
        <div className="flex items-center gap-2">
          {combo >= 3 && (
            <motion.div key={combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={SPRING}>
              <Pill className="!px-3 text-[#FF5E8A]">×{combo}</Pill>
            </motion.div>
          )}
          <Pill>
            <span className="game-coin" />
            <Count value={coins} />
          </Pill>
        </div>
      </div>
    </div>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1="12" y1="2.5" x2="12" y2="4.8" transform={`rotate(${a} 12 12)`} />
      ))}
    </svg>
  )
}

// Tagesverlauf mit den Rush-Hour-Abschnitten
function DayBar({ progress }) {
  return (
    <div className="game-float relative h-[6px] w-[120px] overflow-hidden rounded-full bg-surface">
      {RUSH.map(([a, b]) => (
        <div key={a} className="absolute inset-y-0 bg-[#FF5E8A]/35" style={{ left: `${(a / DAY_LEN) * 100}%`, width: `${((b - a) / DAY_LEN) * 100}%` }} />
      ))}
      <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.min(1, progress) * 100}%` }} />
    </div>
  )
}

// ---------- Kurze Hinweise und große Banner ----------
export function Toasts({ items }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+70px)] z-10 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {items.map((it) =>
          it.big ? (
            <motion.div
              key={it.id}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={SPRING}
              className="game-float rounded-[22px] bg-[#FF5E8A] px-6 py-3 text-center text-white"
              style={it.color ? { background: it.color } : undefined}
            >
              <p className="text-[26px] font-extrabold leading-tight">{it.text}</p>
              {it.sub && <p className="text-[14px] font-semibold opacity-90">{it.sub}</p>}
            </motion.div>
          ) : (
            <motion.div
              key={it.id}
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={SPRING}
              className={`game-float max-w-sm rounded-full px-4 py-2 text-center text-[15px] font-semibold ${
                it.tone === 'good' ? 'bg-[#34C759] text-white' : it.tone === 'bad' ? 'bg-[#FF5E5E] text-white' : 'bg-surface'
              }`}
            >
              {it.text}
            </motion.div>
          ),
        )}
      </AnimatePresence>
    </div>
  )
}

// Münzen fliegen kurz hoch, wenn sich der Kontostand ändert
export function MoneyPops({ pops }) {
  return (
    <div className="pointer-events-none absolute right-5 top-[calc(max(12px,env(safe-area-inset-top))+48px)] z-10">
      <AnimatePresence>
        {pops.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: -4, opacity: 1 }}
            exit={{ y: -22, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className={`absolute right-0 whitespace-nowrap text-[17px] font-extrabold ${p.amount > 0 ? 'text-[#E8A600]' : 'text-[#FF5E5E]'}`}
            style={{ textShadow: '0 1px 0 #fff, 0 0 6px #fff' }}
          >
            {p.amount > 0 ? `+${p.amount}` : `−${-p.amount}`}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ---------- Steuerung am Handy ----------
export function Joystick({ inputRef }) {
  const [pad, setPad] = useState(null) // { x, y, dx, dy }
  const origin = useRef(null)
  const R = 46
  const move = (e) => {
    if (!origin.current || e.pointerId !== origin.current.id) return
    let dx = e.clientX - origin.current.x
    let dy = e.clientY - origin.current.y
    const d = Math.hypot(dx, dy)
    if (d > R) {
      dx = (dx / d) * R
      dy = (dy / d) * R
    }
    inputRef.current.jx = dx / R
    inputRef.current.jy = -dy / R
    setPad({ x: origin.current.x, y: origin.current.y, dx, dy })
  }
  const end = (e) => {
    if (!origin.current || e.pointerId !== origin.current.id) return
    origin.current = null
    inputRef.current.jx = 0
    inputRef.current.jy = 0
    setPad(null)
  }
  return (
    <>
      <div
        className="absolute bottom-0 left-0 z-10 h-[46%] w-[58%]"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
          setPad({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 })
        }}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />
      {pad ? (
        <div className="pointer-events-none fixed z-10" style={{ left: pad.x - 56, top: pad.y - 56 }}>
          <div className="h-28 w-28 rounded-full border-[3px] border-white/80 bg-white/30 backdrop-blur-sm" />
          <div className="game-float absolute h-14 w-14 rounded-full bg-surface" style={{ left: 28 + pad.dx, top: 28 + pad.dy }} />
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-[max(28px,env(safe-area-inset-bottom))] left-7 z-10 h-24 w-24 rounded-full border-[3px] border-white/70 bg-white/25">
          <div className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </div>
      )}
    </>
  )
}

const STATION_TONE = { counter: '#339AFF', store: '#FF84A6', dock: '#3FBF98', mail: '#FFB13D' }

export function ActionButton({ prompt, label, onAct, touch }) {
  if (touch) {
    return (
      <button
        onPointerDown={(e) => {
          e.preventDefault()
          onAct()
        }}
        className={`game-float absolute bottom-[max(24px,env(safe-area-inset-bottom))] right-5 z-10 flex h-[104px] w-[104px] flex-col items-center justify-center rounded-full px-2 text-center text-[14px] font-bold leading-tight transition-transform active:scale-95 ${
          prompt ? (prompt.ok ? 'text-white' : 'bg-surface text-label2') : 'bg-surface/70 text-label3'
        }`}
        style={prompt?.ok ? { background: STATION_TONE[prompt.station] } : undefined}
      >
        {prompt ? label : '•••'}
      </button>
    )
  }
  return (
    <AnimatePresence>
      {prompt && (
        <motion.button
          key={prompt.station + prompt.action}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={SPRING}
          onClick={onAct}
          className={`game-float absolute bottom-[max(24px,env(safe-area-inset-bottom))] left-1/2 z-10 flex -translate-x-1/2 items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-5 text-[17px] font-semibold ${
            prompt.ok ? 'text-white' : 'bg-surface text-label2'
          }`}
          style={prompt.ok ? { background: STATION_TONE[prompt.station] } : undefined}
        >
          <kbd className={`rounded-lg px-2 py-0.5 font-body text-[14px] font-bold ${prompt.ok ? 'bg-white/25' : 'bg-fill/15'}`}>E</kbd>
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  )
}

// ---------- Frage ----------
export function QuestionCard({ t, item, onPick, onNext }) {
  const { q, header, hint, picked } = item
  const done = picked !== null
  const right = done && picked === q.correctIndex
  useEffect(() => {
    const onKey = (e) => {
      if (!done) {
        const n = Number(e.key)
        if (n >= 1 && n <= q.options.length) onPick(n - 1)
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, q, onPick, onNext])

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={SPRING}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[86dvh] overflow-y-auto px-3 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <div className="game-float mx-auto max-w-xl rounded-[26px] bg-surface p-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-accent-text">{header}</p>
          {!done && <p className="flex-none text-[12px] text-label3">⏸ {t('timeStops')}</p>}
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[18px] font-semibold leading-snug">{q.question}</p>
        {hint && !done && <p className="mt-1.5 text-[14px] text-label2">{hint}</p>}
        <div className="mt-4 flex flex-col gap-2">
          {q.options.map((o, i) => {
            const isRight = i === q.correctIndex
            const tone = !done ? 'bg-bg active:scale-[0.99]' : isRight ? 'bg-success/15 ring-2 ring-success' : i === picked ? 'bg-danger/10 ring-2 ring-danger' : 'bg-bg opacity-60'
            return (
              <button key={i} disabled={done} onClick={() => onPick(i)} className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-left text-[16px] leading-snug transition ${tone}`}>
                <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/10 text-[12px] font-bold text-accent-text">
                  {done && isRight ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : done && i === picked ? <XIcon className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span>{o}</span>
              </button>
            )
          })}
        </div>
        {done && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
            <p className={`mt-4 text-[20px] font-bold ${right ? 'text-success' : 'text-danger'}`}>{right ? t('right') : t('wrong')}</p>
            {q.explanation && <p className="mt-1 whitespace-pre-line text-[15px] leading-snug text-label2">{q.explanation}</p>}
            {!right && <p className="mt-2 rounded-xl bg-bg px-3 py-2 text-[14px] leading-snug text-label2">💛 {t('wrongNote')}</p>}
            <Button onClick={onNext} className="mt-4 w-full">
              {t('next')}
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ---------- Tagesabschluss ----------
export function Summary({ t, day, report, onNext, onShop, onMenu, children }) {
  const { ledger, costs, profit, served, lost, answers, bestCombo, stars } = report
  const right = answers.filter((a) => a.ok).length
  const lines = [
    ['sales', ledger.sales],
    ['tips', ledger.tips],
    ...(ledger.penalties ? [['penalties', -ledger.penalties]] : []),
    ...(ledger.goods ? [['goods', -ledger.goods]] : []),
    ...costs,
  ]
  return (
    <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }} transition={SPRING} className="absolute inset-x-0 bottom-0 z-20 max-h-[92dvh] overflow-y-auto px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
      <div className="game-float mx-auto max-w-xl rounded-[26px] bg-surface p-5">
        <p className="text-center text-[13px] font-semibold uppercase tracking-wide text-label2">{t('dayDone', { n: day })}</p>
        <div className="mt-2 flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.svg key={i} viewBox="0 0 24 24" className="h-11 w-11" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: 0.25 + i * 0.18 }}>
              <path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8z" fill={i < stars ? '#FFD45E' : '#E5E5EA'} stroke={i < stars ? '#FFD45E' : '#E5E5EA'} strokeWidth="1.6" strokeLinejoin="round" />
            </motion.svg>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-center">
          {[
            [served, 'served'],
            [lost, 'lostCount'],
            [`${right}/${answers.length}`, 'answers'],
            [bestCombo, 'bestCombo'],
          ].map(([v, k]) => (
            <div key={k} className="rounded-2xl bg-bg px-1 py-2">
              <p className="text-[20px] font-bold tabular-nums">{v}</p>
              <p className="text-[11px] leading-tight text-label2">{t(k)}</p>
            </div>
          ))}
        </div>
        {/* kleine Gewinn- und Verlustrechnung */}
        <div className="mt-3 rounded-2xl bg-bg px-4 py-3">
          {lines.map(([k, v]) => (
            <div key={k} className="flex justify-between py-0.5 text-[15px]">
              <span className="text-label2">{t(k)}</span>
              <span className={`tabular-nums ${v < 0 ? 'text-danger' : ''}`}>{v < 0 ? `−${-v}` : `+${v}`}</span>
            </div>
          ))}
          <div className="mt-1.5 flex justify-between border-t border-label3/30 pt-1.5 text-[17px] font-bold">
            <span>{profit >= 0 ? t('profit') : t('lossLine')}</span>
            <span className={`flex items-center gap-1.5 tabular-nums ${profit < 0 ? 'text-danger' : 'text-success'}`}>
              {profit < 0 ? `−${-profit}` : `+${profit}`}
              <span className="game-coin" />
            </span>
          </div>
        </div>
        {answers.length > 0 && (
          <div className="mt-3 rounded-2xl bg-bg px-4 py-3">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">{t('learnedToday')}</p>
            <ul className="mt-2 space-y-2">
              {answers.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[14px] leading-snug">
                  <span className={`mt-[2px] flex h-[18px] w-[18px] flex-none items-center justify-center rounded-full text-white ${a.ok ? 'bg-success' : 'bg-danger'}`}>
                    {a.ok ? <CheckIcon className="h-3 w-3" strokeWidth={3} /> : <XIcon className="h-3 w-3" strokeWidth={3} />}
                  </span>
                  <span className="line-clamp-2">{a.text}</span>
                </li>
              ))}
            </ul>
            {answers.some((a) => !a.ok) && <p className="mt-2 text-[13px] text-label2">{t('mistakesNote')}</p>}
          </div>
        )}
        {children}
        <div className="mt-4 flex gap-3">
          <Button variant="secondary" onClick={onShop} className="flex-1">
            {t('island')}
          </Button>
          <Button onClick={onNext} className="flex-1">
            {t('nextDay')}
          </Button>
        </div>
        <button onClick={onMenu} className="mt-2 w-full py-2 text-[15px] font-semibold text-accent-text">
          {t('toMenu')}
        </button>
      </div>
    </motion.div>
  )
}

// ---------- Lernstoff wählen ----------
export function MaterialSheet({ open, onClose, t, lang, focus, onChange, exam, formatDate }) {
  const year = focus.year
  const chapters = getKapitelList(year)
  const chosen = new Set(focus.kapitelIds.length ? focus.kapitelIds : chapters.map((k) => k.id))
  const toggle = (id) => {
    const next = new Set(chosen)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    if (next.size === 0) return
    onChange({ year, kapitelIds: next.size === chapters.length ? [] : chapters.filter((k) => next.has(k.id)).map((k) => k.id) })
  }
  const titleOf = (k) => (lang !== 'de' && k[`title_${lang}`]) || k.title
  return (
    <Sheet open={open} onClose={onClose} title={t('materialTitle')} action={<button onClick={onClose} className="px-2 py-2 text-[17px] font-semibold text-accent-text">{t('done')}</button>}>
      <div className="px-4 pb-2">
        <p className="px-1 text-[14px] leading-snug text-label2">{t('materialHint')}</p>
        {exam && (
          <button onClick={() => onChange({ year: exam.jahrgangId, kapitelIds: exam.kapitelIds })} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-accent px-4 py-3 text-left text-[15px] font-semibold text-white active:opacity-80">
            {t('materialExam', { date: formatDate(exam.date) })}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div className="mt-3 flex gap-2">
          {jahrgaenge.map((j) => (
            <button key={j.id} onClick={() => onChange({ year: j.id, kapitelIds: [] })} className={`flex-1 rounded-full py-2 text-[15px] font-semibold ${j.id === year ? 'bg-accent text-white' : 'bg-fill/[0.14] text-accent-text'}`}>
              {t('year')} {j.id}
            </button>
          ))}
        </div>
        <ul className="mt-3 overflow-hidden rounded-2xl bg-surface">
          {chapters.map((k, i) => (
            <li key={k.id}>
              <button onClick={() => toggle(k.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[16px] active:bg-fill/10 ${i ? 'border-t border-label3/20' : ''}`}>
                <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full ${chosen.has(k.id) ? 'bg-accent text-white' : 'border-2 border-label3/60'}`}>
                  {chosen.has(k.id) && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {titleOf(k)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

// ---------- Pause ----------
export function PauseCard({ t, audio, onAudio, onResume, onQuit, onLeave, gfx, onGfx }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 px-5">
      <motion.div initial={{ scale: 0.92 }} animate={{ scale: 1 }} transition={SPRING} className="game-float w-full max-w-sm rounded-[26px] bg-surface p-5">
        <p className="text-center text-[22px] font-bold">{t('paused')}</p>
        <SoundToggles t={t} audio={audio} onAudio={onAudio} className="mt-4" />
        {onGfx && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="px-1 text-[14px] font-semibold text-label2">{t('gfx')}</span>
            {[
              ['nice', t('gfxNice')],
              ['fast', t('gfxFast')],
            ].map(([k, label]) => (
              <button key={k} onClick={() => onGfx(k)} className={`flex-1 rounded-full py-2 text-[15px] font-semibold ${gfx === k ? 'bg-accent/15 text-accent-text' : 'bg-fill/[0.12] text-label3'}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        <Button onClick={onResume} className="mt-4 w-full">
          {t('resume')}
        </Button>
        <Button variant="danger" onClick={onQuit} className="mt-2.5 w-full">
          {t('quitDay')}
        </Button>
        <p className="mt-1.5 text-center text-[12px] text-label2">{t('quitHint')}</p>
        <button onClick={onLeave} className="mt-3 flex w-full items-center justify-center gap-1 py-2 text-[15px] font-semibold text-accent-text">
          <ChevronLeft className="h-4 w-4" />
          {t('leave')}
        </button>
      </motion.div>
    </motion.div>
  )
}

export function SoundToggles({ t, audio, onAudio, className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {[
        ['music', '♪'],
        ['sfx', '🔔'],
      ].map(([k, icon]) => (
        <button key={k} onClick={() => onAudio({ [k]: !audio[k] })} className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-[15px] font-semibold ${audio[k] ? 'bg-accent/15 text-accent-text' : 'bg-fill/[0.12] text-label3 line-through'}`}>
          <span aria-hidden>{icon}</span>
          {t(k === 'music' ? 'music' : 'sounds')}
        </button>
      ))}
    </div>
  )
}

export { CANDY }
