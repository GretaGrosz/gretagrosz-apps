import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/Button.jsx'
import { CheckIcon, XIcon } from '../../components/Icons.jsx'
import { SPRING } from '../../motion.js'
import { sfx } from '../audio.js'
import { formatEuro, scoreMiniGame } from '../minigames.js'

// Mini-Spiele von Loopy & Co. als Karte unten (wie die Fragekarte).
//   <MiniGame game={makeMiniGame(…)} lang="de" header="Mila will zahlen" onDone={(ok) => …} />
// Arten: 'change' Rückgeld · 'calc' Rechnen · 'sort' Sortieren (tippen oder ziehen) · 'match' Zuordnen

const TEXT = {
  de: {
    give: 'Geben',
    undo: 'Zurück',
    clear: 'Leeren',
    check: 'Prüfen',
    next: 'Weiter',
    right: 'Richtig!',
    rightOne: 'Richtig – 1 Fehler ist erlaubt',
    wrong: 'Nicht ganz',
    wrongN: '{n} Fehler – höchstens 1 ist erlaubt',
    given: 'Gegeben',
    paid: 'Bezahlt mit',
    discount: 'Stammkunden-Rabatt',
    tapCoins: 'Tippe Münzen und Scheine an',
    youGave: 'Du hast {a} gegeben – richtig wären {b}.',
    eg: 'z. B.',
    left: 'noch {n}',
    sortHint: 'Tippe ein Kärtchen und dann den Korb – oder zieh es hinein.',
    keysSort: 'Tasten: 1–6 wählen · ← → einsortieren',
    keysMatch: 'Tasten: 1–4 Begriff · A–D Erklärung',
    keysChange: 'Tasten: 1–6 Münzen · ⌫ zurück · Enter geben',
    belongs: 'gehört zu',
    mixedUp: 'Hier gab es Verwechslungen:',
    yourAnswer: 'Deine Antwort',
    tray: 'Rückgeld',
  },
  en: {
    give: 'Give',
    undo: 'Undo',
    clear: 'Clear',
    check: 'Check',
    next: 'Next',
    right: 'Correct!',
    rightOne: 'Correct – 1 mistake is allowed',
    wrong: 'Not quite',
    wrongN: '{n} mistakes – at most 1 is allowed',
    given: 'Given',
    paid: 'Paid with',
    discount: 'Regular-customer discount',
    tapCoins: 'Tap coins and notes',
    youGave: 'You gave {a} – the right change is {b}.',
    eg: 'e.g.',
    left: '{n} left',
    sortHint: 'Tap a card, then a basket – or drag it in.',
    keysSort: 'Keys: 1–6 pick · ← → sort',
    keysMatch: 'Keys: 1–4 term · A–D explanation',
    keysChange: 'Keys: 1–6 coins · ⌫ undo · Enter give',
    belongs: 'belongs to',
    mixedUp: 'These got mixed up:',
    yourAnswer: 'Your answer',
    tray: 'Change',
  },
  hu: {
    give: 'Odaadom',
    undo: 'Vissza',
    clear: 'Törlés',
    check: 'Ellenőrzés',
    next: 'Tovább',
    right: 'Helyes!',
    rightOne: 'Helyes – 1 hiba megengedett',
    wrong: 'Nem egészen',
    wrongN: '{n} hiba – legfeljebb 1 megengedett',
    given: 'Visszaadva',
    paid: 'Fizetett',
    discount: 'Törzsvásárlói kedvezmény',
    tapCoins: 'Koppints az érmékre és bankjegyekre',
    youGave: '{a} összeget adtál vissza – a helyes visszajáró {b}.',
    eg: 'pl.',
    left: 'még {n}',
    sortHint: 'Koppints egy kártyára, majd a kosárra – vagy húzd bele.',
    keysSort: 'Billentyűk: 1–6 választás · ← → besorolás',
    keysMatch: 'Billentyűk: 1–4 fogalom · A–D magyarázat',
    keysChange: 'Billentyűk: 1–6 érmék · ⌫ vissza · Enter odaadás',
    belongs: 'helye:',
    mixedUp: 'Ezeket keverted össze:',
    yourAnswer: 'A válaszod',
    tray: 'Visszajáró',
  },
}
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k])

const CANDY_COLOR = { lolly: '#FF5E8A', drops: '#FFD45E', gummy: '#5CD6B0', choco: '#A86B45' }
const PAIR_COLORS = ['#FF5E8A', '#339AFF', '#3FBF98', '#FFB13D']
const BUCKET_COLORS = ['#FF84A6', '#339AFF']

const buzz = (pattern) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* kein Vibrieren */
  }
}
const finePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: fine)').matches

export default function MiniGame({ game, lang = 'de', header, onDone }) {
  const t = TEXT[lang] ?? TEXT.de
  const [result, setResult] = useState(null) // { ok, mistakes, … }
  const doneRef = useRef(false)

  const finish = useCallback(
    (answer) => {
      if (doneRef.current) return
      doneRef.current = true
      const r = scoreMiniGame(game, answer)
      setResult({ ...r, answer })
      sfx(r.ok ? 'right' : 'wrong')
      buzz(r.ok ? 14 : [30, 50, 30])
    },
    [game],
  )

  useEffect(() => {
    if (!result) return
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onDone?.(result.ok)
      }
    }
    // erst nach dem Tastendruck, der das Spiel beendet hat
    const id = setTimeout(() => window.addEventListener('keydown', onKey), 250)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', onKey)
    }
  }, [result, onDone])

  if (!game) return null
  const Body = { change: ChangeGame, calc: CalcGame, sort: SortGame, match: MatchGame }[game.kind]
  const showPrompt = game.kind !== 'change' // beim Rückgeld zeigt der Kassenzettel alles

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={SPRING}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[88dvh] overflow-y-auto overflow-x-hidden px-3 pb-[max(14px,env(safe-area-inset-bottom))]"
    >
      <div lang={lang} className="game-float mx-auto max-w-xl rounded-[26px] bg-surface p-4 sm:p-5 [hyphens:auto]">
        {header && <p className="text-[13px] font-semibold uppercase tracking-wide text-accent-text">{header}</p>}
        <div className="mt-1 flex items-center gap-2">
          <KindBadge kind={game.kind} />
          <p className="min-w-0 text-[18px] font-bold leading-snug">{game.title}</p>
        </div>
        {showPrompt && <p className="mt-1 text-[15px] leading-snug text-label2">{game.prompt}</p>}
        <div className="mt-3">{Body && <Body game={game} lang={lang} t={t} done={!!result} result={result} onFinish={finish} />}</div>
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <ResultLine t={t} kind={game.kind} result={result} />
              <Explanation game={game} lang={lang} t={t} result={result} />
              <Button onClick={() => onDone?.(result.ok)} className="mt-4 w-full">
                {t.next}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function KindBadge({ kind }) {
  const tone = { change: '#FFB13D', calc: '#3FBF98', sort: '#FF84A6', match: '#339AFF' }[kind] ?? '#339AFF'
  return (
    <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-white" style={{ background: tone }}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {kind === 'change' && (
          <>
            <circle cx="12" cy="12" r="7.5" />
            <path d="M14.5 9.2a3 3 0 1 0 0 5.6M8 11h5M8 13.2h5" />
          </>
        )}
        {kind === 'calc' && <path d="M6 8h4M8 6v4M14 8h4M6 16.5l3-3M9 16.5l-3-3M14 14h4M14 17h4" />}
        {kind === 'sort' && <path d="M4 9h7v10H4zM13 9h7v10h-7zM7.5 4v3M16.5 4v3" />}
        {kind === 'match' && <path d="M5 7h5M5 12h5M5 17h5M14 7h5M14 12h5M14 17h5M10 7l4 5M10 12l4-5" />}
      </svg>
    </span>
  )
}

function ResultLine({ t, kind, result }) {
  const lenient = kind === 'sort' || kind === 'match'
  const text = result.ok ? (lenient && result.mistakes === 1 ? t.rightOne : t.right) : t.wrong
  return (
    <div className="mt-4 flex items-center gap-2">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ ...SPRING, stiffness: 500, damping: 18 }}
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-white ${result.ok ? 'bg-success' : 'bg-danger'}`}
      >
        {result.ok ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : <XIcon className="h-4 w-4" strokeWidth={3} />}
      </motion.span>
      <div className="min-w-0">
        <p className={`text-[20px] font-bold leading-tight ${result.ok ? 'text-success' : 'text-danger'}`}>{text}</p>
        {!result.ok && lenient && <p className="text-[14px] text-label2">{fill(t.wrongN, { n: result.mistakes })}</p>}
      </div>
    </div>
  )
}

function Explanation({ game, lang, t, result }) {
  if (game.kind === 'calc' || game.kind === 'change') {
    const euro = (c) => formatEuro(c, lang, { cents: true })
    return (
      <div className="mt-2">
        {game.kind === 'change' && !result.ok && <p className="text-[15px] leading-snug">{fill(t.youGave, { a: euro(result.given), b: euro(game.changeCents) })}</p>}
        <div className="mt-2 rounded-2xl bg-bg px-3.5 py-2.5">
          {game.steps.map((s, i) => (
            <p key={i} className="text-[14px] leading-snug tabular-nums text-label2">
              {s}
            </p>
          ))}
          {game.kind === 'change' && game.bestCoins && (
            <p className="mt-1 text-[14px] leading-snug text-label2">
              {t.eg} {game.bestCoins.map((c) => game.denoms.find((d) => d.cents === c)?.label).join(' + ')}
            </p>
          )}
        </div>
      </div>
    )
  }
  if (game.kind === 'sort') return <p className="mt-1.5 text-[15px] leading-snug text-label2">{game.explanation}</p>
  if (game.kind === 'match') {
    const wrong = game.pairs.filter((p) => result.answer?.wrongIds?.includes(p.id))
    if (!wrong.length) return null
    return (
      <div className="mt-2 rounded-2xl bg-bg px-3.5 py-2.5">
        <p className="text-[13px] font-semibold text-label2">{t.mixedUp}</p>
        {wrong.map((p) => (
          <p key={p.id} className="mt-1 text-[14px] leading-snug">
            <span className="font-semibold">{p.term}</span> <span className="text-label2">= {p.def}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

// ======================================================================
// Rückgeld
// ======================================================================
function Coin({ d, size = 52 }) {
  if (d.type === 'note')
    return (
      <span
        className="relative flex items-center justify-center rounded-[8px] text-[15px] font-extrabold text-[#3d4a3f]"
        style={{ width: size * 1.55, height: size * 0.86, background: 'linear-gradient(135deg,#c9d8c5,#a9c1a3)', boxShadow: 'inset 0 0 0 2px #8fae88, 0 2px 0 #7f9c78' }}
      >
        <span className="absolute left-1.5 top-1 h-2 w-2 rounded-full bg-white/60" />
        {d.label}
      </span>
    )
  const bimetal = d.cents === 100 || d.cents === 200
  const outer = d.cents === 200 ? '#d9dde3' : '#e9bf4f'
  const inner = d.cents === 200 ? '#f1c95a' : d.cents === 100 ? '#dfe3e8' : '#f3d06b'
  const s = d.cents >= 50 ? size : d.cents === 20 ? size * 0.9 : size * 0.8
  return (
    <span
      className="flex items-center justify-center rounded-full text-[13px] font-extrabold text-[#5b4413]"
      style={{ width: s, height: s, background: bimetal ? `radial-gradient(circle, ${inner} 54%, ${outer} 56%)` : `radial-gradient(circle at 35% 30%, #fbe39a, ${inner} 55%, ${outer})`, boxShadow: `inset 0 0 0 2px ${outer === '#d9dde3' ? '#b8bec7' : '#c99a2c'}, 0 2px 0 #b98a22` }}
    >
      {d.label}
    </span>
  )
}

function ChangeGame({ game, lang, t, done, result, onFinish }) {
  const [given, setGiven] = useState([]) // [{ key, cents }]
  const keyN = useRef(0)
  const sum = given.reduce((s, g) => s + g.cents, 0)
  const euro = (c, whole) => formatEuro(c, lang, { cents: true, whole })
  const add = (cents) => {
    if (done || given.length >= 24) return
    setGiven((g) => [...g, { key: keyN.current++, cents }])
    sfx('coin')
    buzz(6)
  }
  const undo = () => !done && given.length && (setGiven((g) => g.slice(0, -1)), sfx('click'))
  const clear = () => !done && given.length && (setGiven([]), sfx('click'))
  const removeAt = (key) => !done && (setGiven((g) => g.filter((x) => x.key !== key)), sfx('click'))
  const give = () => !done && sum > 0 && onFinish(given.map((g) => g.cents))

  useEffect(() => {
    if (done) return
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= game.denoms.length) add(game.denoms[n - 1].cents)
      else if (e.key === 'Backspace') undo()
      else if (e.key === 'Enter') {
        e.preventDefault()
        give()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const ok = result?.ok
  return (
    <div>
      {/* Kassenzettel */}
      <div className="relative rounded-2xl bg-bg px-3.5 py-2.5">
        {game.lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2 py-0.5 text-[16px] leading-snug">
            <span className="h-3.5 w-3.5 flex-none rounded-full" style={{ background: CANDY_COLOR[l.candy], boxShadow: 'inset 0 -2px 0 rgb(0 0 0 / 0.15)' }} />
            <span className="min-w-0 font-medium">{l.label}</span>
          </div>
        ))}
        {game.discountPct > 0 && (
          <div className="flex items-center gap-2 py-0.5 text-[15px] font-semibold text-[#FF5E8A]">
            <span className="flex h-3.5 w-3.5 flex-none items-center justify-center text-[13px]">%</span>
            <span>
              −{game.discountPct} % {t.discount}
            </span>
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between border-t border-dashed border-label3/40 pt-2">
          <span className="text-[14px] text-label2">{t.paid}</span>
          <Coin d={{ type: 'note', label: euro(game.paidCents, true) }} size={34} />
        </div>
      </div>

      {/* Ablage mit dem Rückgeld */}
      <div className={`mt-2.5 rounded-2xl border-2 border-dashed px-3 py-2 transition-colors ${done ? (ok ? 'border-success bg-success/10' : 'border-danger bg-danger/10') : 'border-label3/40'}`}>
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-semibold uppercase tracking-wide text-label2">{t.tray}</span>
          <motion.span key={sum} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={SPRING} className="text-[22px] font-extrabold tabular-nums">
            {euro(sum)}
          </motion.span>
        </div>
        <div className="flex min-h-[46px] flex-wrap items-center gap-1.5 py-1">
          {given.length === 0 && <span className="text-[14px] text-label3">{t.tapCoins}</span>}
          <AnimatePresence initial={false}>
            {given.map((g) => {
              const d = game.denoms.find((x) => x.cents === g.cents)
              return (
                <motion.button
                  key={g.key}
                  layout
                  initial={{ y: -40, scale: 0.5, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ ...SPRING, stiffness: 520, damping: 22 }}
                  onClick={() => removeAt(g.key)}
                  disabled={done}
                  aria-label={d.label}
                >
                  <Coin d={d} size={36} />
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      {!done && (
        <>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {game.denoms.map((d, i) => (
              <motion.button
                key={d.cents}
                whileTap={{ scale: 0.92 }}
                onClick={() => add(d.cents)}
                className="flex h-[64px] items-center justify-center rounded-2xl bg-bg active:bg-fill/20"
                aria-label={d.label}
                title={`${i + 1}`}
              >
                <Coin d={d} size={46} />
              </motion.button>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <Button variant="secondary" onClick={undo} disabled={!given.length} className="flex-1 !px-3">
              {t.undo}
            </Button>
            <Button variant="secondary" onClick={clear} disabled={!given.length} className="flex-1 !px-3">
              {t.clear}
            </Button>
            <Button onClick={give} disabled={sum === 0} className="flex-[1.4] !px-3">
              {t.give}
            </Button>
          </div>
          {finePointer() && <p className="mt-2 text-center text-[12px] text-label3">{t.keysChange}</p>}
        </>
      )}
    </div>
  )
}

// ======================================================================
// Rechnen
// ======================================================================
function CalcGame({ game, done, result, onFinish }) {
  const picked = result?.answer
  useEffect(() => {
    if (done) return
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= game.options.length) onFinish(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [done, game, onFinish])
  return (
    <div className="grid grid-cols-2 gap-2">
      {game.options.map((o, i) => {
        const isRight = i === game.correctIndex
        const tone = !done ? 'bg-bg active:scale-[0.97]' : isRight ? 'bg-success/15 ring-2 ring-success' : i === picked ? 'bg-danger/10 ring-2 ring-danger' : 'bg-bg opacity-50'
        return (
          <motion.button
            key={i}
            disabled={done}
            onClick={() => (sfx('click'), onFinish(i))}
            animate={done && i === picked && !isRight ? { x: [0, -6, 6, -4, 4, 0] } : done && isRight ? { scale: [1, 1.06, 1] } : {}}
            transition={{ duration: 0.4 }}
            className={`relative flex min-h-[60px] items-center justify-center rounded-2xl px-3 py-3 text-center text-[18px] font-bold tabular-nums transition ${tone}`}
          >
            <span
              className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                done && isRight ? 'bg-success text-white' : done && i === picked ? 'bg-danger text-white' : 'bg-accent/10 text-accent-text'
              }`}
            >
              {done && isRight ? <CheckIcon className="h-3 w-3" strokeWidth={3} /> : done && i === picked ? <XIcon className="h-3 w-3" strokeWidth={3} /> : i + 1}
            </span>
            <span className="px-3">{o}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ======================================================================
// Sortieren – antippen + Korb antippen ODER ziehen (Pointer Events)
// ======================================================================
function SortGame({ game, t, done, result, onFinish }) {
  const [place, setPlace] = useState({}) // itemId → 0|1
  const [sel, setSel] = useState(null)
  const [ghost, setGhost] = useState(null) // { id, x, y, w, h, ox, oy }
  const [hover, setHover] = useState(null)
  const drag = useRef(null)
  const justDragged = useRef(false)
  const bucketRefs = [useRef(null), useRef(null)]
  const pool = game.items.filter((it) => place[it.id] === undefined)
  const wrongIds = result?.wrongIds ?? []

  const put = useCallback(
    (id, b) => {
      setPlace((p) => ({ ...p, [id]: b }))
      setSel(null)
      sfx('drop')
      buzz(8)
    },
    [setPlace],
  )
  const tapChip = (id) => {
    if (done) return
    if (justDragged.current) {
      justDragged.current = false
      return
    }
    if (place[id] !== undefined) {
      // aus dem Korb zurück in den Stapel
      setPlace((p) => {
        const n = { ...p }
        delete n[id]
        return n
      })
      setSel(id)
      sfx('pickup')
      return
    }
    setSel((s) => (s === id ? null : id))
    sfx('pickup')
  }
  const tapBucket = (b) => {
    if (done || !sel) return
    put(sel, b)
  }

  const bucketAt = (x, y) => {
    for (const b of [0, 1]) {
      const r = bucketRefs[b].current?.getBoundingClientRect()
      if (r && x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return b
    }
    return null
  }
  const onDown = (e, id) => {
    if (done || (e.pointerType === 'mouse' && e.button !== 0)) return
    const r = e.currentTarget.getBoundingClientRect()
    drag.current = { id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, active: false, r, el: e.currentTarget }
  }
  const onMove = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pid) return
    if (!d.active) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return
      d.active = true
      try {
        d.el.setPointerCapture(e.pointerId)
      } catch {
        /* egal */
      }
      setSel(null)
      sfx('pickup')
    }
    setGhost({ id: d.id, x: e.clientX, y: e.clientY, w: d.r.width, h: d.r.height, ox: d.x0 - d.r.left, oy: d.y0 - d.r.top })
    setHover(bucketAt(e.clientX, e.clientY))
  }
  const onUp = (e) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pid) return
    drag.current = null
    if (d.active) {
      justDragged.current = true
      setTimeout(() => (justDragged.current = false), 60)
      const b = bucketAt(e.clientX, e.clientY)
      setGhost(null)
      setHover(null)
      if (b !== null) put(d.id, b)
    }
  }
  const onCancel = () => {
    drag.current = null
    setGhost(null)
    setHover(null)
  }

  const check = () => !done && pool.length === 0 && onFinish(place)

  useEffect(() => {
    if (done) return
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= pool.length) {
        setSel(pool[n - 1].id)
        sfx('pickup')
      } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && sel) {
        e.preventDefault()
        put(sel, e.key === 'ArrowLeft' ? 0 : 1)
      } else if (e.key === 'Enter' && pool.length === 0) {
        e.preventDefault()
        check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const chipProps = (id) => ({
    onPointerDown: (e) => onDown(e, id),
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerCancel: onCancel,
    onClick: (e) => {
      e.stopPropagation()
      tapChip(id)
    },
    style: { touchAction: 'none' },
  })

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((b) => {
          const inside = game.items.filter((it) => place[it.id] === b)
          const active = !done && (hover === b || (sel && hover === null))
          return (
            <div
              key={b}
              ref={bucketRefs[b]}
              onClick={() => tapBucket(b)}
              className={`flex min-h-[132px] min-w-0 flex-col rounded-2xl border-2 p-1 transition-colors ${hover === b ? 'scale-[1.01]' : ''}`}
              style={{
                borderColor: active ? BUCKET_COLORS[b] : `${BUCKET_COLORS[b]}55`,
                background: hover === b ? `${BUCKET_COLORS[b]}26` : `${BUCKET_COLORS[b]}12`,
                borderStyle: sel || ghost ? 'dashed' : 'solid',
                cursor: sel ? 'pointer' : 'default',
              }}
            >
              <p className="px-1.5 pb-1 pt-0.5 text-center text-[14px] font-bold leading-tight" style={{ color: BUCKET_COLORS[b] === '#FF84A6' ? '#E0507A' : '#1F7BD8' }}>
                {game.buckets[b]}
              </p>
              <div className="flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {inside.map((it) => {
                    const wrong = done && wrongIds.includes(it.id)
                    const right = done && !wrong
                    return (
                      <motion.button
                        key={it.id}
                        layout
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={wrong ? { scale: 1, opacity: 1, x: [0, -5, 5, -3, 3, 0] } : { scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={SPRING}
                        disabled={done}
                        {...chipProps(it.id)}
                        className={`w-full select-none rounded-xl px-1.5 py-1.5 text-left text-[13px] font-medium leading-snug ${
                          wrong ? 'bg-danger/10 ring-2 ring-danger' : right ? 'bg-success/15 ring-1 ring-success' : 'bg-surface shadow-card'
                        } ${ghost?.id === it.id ? 'opacity-30' : ''}`}
                      >
                        <span className="flex items-start gap-1">
                          {done && (
                            <span className={`mt-[2px] flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full text-white ${wrong ? 'bg-danger' : 'bg-success'}`}>
                              {wrong ? <XIcon className="h-2.5 w-2.5" strokeWidth={3.5} /> : <CheckIcon className="h-2.5 w-2.5" strokeWidth={3.5} />}
                            </span>
                          )}
                          <span className="min-w-0 break-words">{it.text}</span>
                        </span>
                        {wrong && (
                          <span className="mt-0.5 block text-[12px] font-semibold text-danger">
                            → {game.buckets[it.bucket]}
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
      </div>

      {!done && (
        <>
          <div className="mt-2.5 flex min-h-[44px] flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {pool.map((it) => (
                <motion.button
                  key={it.id}
                  layout
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: sel === it.id ? 1.04 : 1, opacity: 1, y: sel === it.id ? -3 : 0 }}
                  exit={{ scale: 0.6, opacity: 0, transition: { duration: 0.12 } }}
                  transition={SPRING}
                  {...chipProps(it.id)}
                  className={`max-w-full select-none rounded-2xl px-3 py-2.5 text-left text-[15px] font-medium leading-snug ${
                    sel === it.id ? 'bg-accent text-white shadow-lg' : 'bg-bg'
                  } ${ghost?.id === it.id ? 'opacity-30' : ''}`}
                >
                  {it.text}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
          <p className="mt-2 text-center text-[13px] leading-snug text-label3">{t.sortHint}</p>
          <Button onClick={check} disabled={pool.length > 0} className="mt-2.5 w-full">
            {pool.length > 0 ? `${t.check} (${fill(t.left, { n: pool.length })})` : t.check}
          </Button>
          {finePointer() && <p className="mt-2 text-center text-[12px] text-label3">{t.keysSort}</p>}
        </>
      )}

      {ghost &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[100] rotate-[-3deg] rounded-2xl bg-accent px-3 py-2.5 text-[15px] font-medium leading-snug text-white shadow-2xl"
            style={{ left: ghost.x - ghost.ox, top: ghost.y - ghost.oy, width: ghost.w, minHeight: ghost.h }}
          >
            {game.items.find((it) => it.id === ghost.id)?.text}
          </div>,
          document.body,
        )}
    </div>
  )
}

// ======================================================================
// Zuordnen – Begriff antippen, dann Erklärung (oder umgekehrt)
// ======================================================================
function MatchGame({ game, t, done, onFinish }) {
  const byId = useMemo(() => Object.fromEntries(game.pairs.map((p) => [p.id, p])), [game])
  const [matched, setMatched] = useState([]) // pair ids in der Reihenfolge des Findens
  const [term, setTerm] = useState(null)
  const [def, setDef] = useState(null)
  const [shake, setShake] = useState(null) // { term, def, n }
  const wrong = useRef(new Set())

  const colorOf = (id) => PAIR_COLORS[matched.indexOf(id) % PAIR_COLORS.length]

  const tryPair = useCallback(
    (tid, did) => {
      if (tid === did) {
        const next = [...matched, tid]
        setMatched(next)
        setTerm(null)
        setDef(null)
        sfx('coin')
        buzz(10)
        if (next.length === game.pairs.length) setTimeout(() => onFinish({ wrongIds: [...wrong.current] }), 450)
      } else {
        wrong.current.add(tid)
        setShake({ term: tid, def: did, n: Date.now() })
        setTerm(null)
        setDef(null)
        sfx('drop')
        buzz([20, 40, 20])
      }
    },
    [matched, game, onFinish],
  )
  const pickTerm = (id) => {
    if (done || matched.includes(id)) return
    sfx('click')
    if (def) tryPair(id, def)
    else setTerm((x) => (x === id ? null : id))
  }
  const pickDef = (id) => {
    if (done || matched.includes(id)) return
    sfx('click')
    if (term) tryPair(term, id)
    else setDef((x) => (x === id ? null : id))
  }

  useEffect(() => {
    if (done) return
    const onKey = (e) => {
      const n = Number(e.key)
      if (n >= 1 && n <= game.left.length) pickTerm(game.left[n - 1])
      const L = 'abcd'.indexOf(e.key.toLowerCase())
      if (L >= 0 && L < game.right.length) pickDef(game.right[L])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shakeAnim = (on) => (on ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 })

  return (
    <div>
      <div className={`grid grid-cols-2 gap-2 ${done ? 'hidden' : ''}`}>
        {game.left.map((id) => {
          const isM = matched.includes(id)
          const isSel = term === id
          const isShake = shake?.term === id
          return (
            <motion.button
              key={id + (isShake ? shake.n : '')}
              onClick={() => pickTerm(id)}
              disabled={done || isM}
              animate={isM ? { scale: [1, 1.12, 1] } : shakeAnim(isShake)}
              transition={{ duration: 0.35 }}
              className={`flex min-h-[52px] min-w-0 items-center justify-center rounded-2xl px-2.5 py-2 text-center text-[15px] font-bold leading-tight transition-colors ${
                isM ? 'text-white' : isSel ? 'bg-accent text-white' : isShake ? 'bg-danger/15 text-danger' : 'bg-bg'
              }`}
              style={isM ? { background: colorOf(id) } : undefined}
            >
              <span className="min-w-0 break-words [hyphens:auto]">{byId[id].term}</span>
            </motion.button>
          )
        })}
      </div>
      <div className="mt-2.5 flex flex-col gap-1.5">
        {game.right.map((id, i) => {
          const isM = matched.includes(id)
          const isSel = def === id
          const isShake = shake?.def === id
          return (
            <motion.button
              key={id + (isShake ? shake.n : '')}
              onClick={() => pickDef(id)}
              disabled={done || isM}
              animate={isM ? { scale: [1, 1.03, 1] } : shakeAnim(isShake)}
              transition={{ duration: 0.35 }}
              className={`flex min-h-[48px] items-center gap-2.5 rounded-2xl px-3 py-2 text-left text-[14px] leading-snug transition-colors ${
                isSel ? 'bg-accent/15 ring-2 ring-accent' : isShake ? 'bg-danger/10 ring-2 ring-danger' : isM ? '' : 'bg-bg'
              }`}
              style={isM ? { background: `${colorOf(id)}22`, boxShadow: `inset 4px 0 0 ${colorOf(id)}` } : undefined}
            >
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold ${isM ? 'text-white' : 'bg-accent/10 text-accent-text'}`}
                style={isM ? { background: colorOf(id) } : undefined}
              >
                {isM ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : 'ABCD'[i]}
              </span>
              <span className="min-w-0">
                {isM && <span className="mr-1 font-bold">{byId[id].term}:</span>}
                {byId[id].def}
              </span>
            </motion.button>
          )
        })}
      </div>
      {!done && finePointer() && <p className="mt-2 text-center text-[12px] text-label3">{t.keysMatch}</p>}
    </div>
  )
}
