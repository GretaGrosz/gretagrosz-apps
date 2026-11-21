import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/Button.jsx'
import { SPRING } from '../../motion.js'

// Die vier Fallarten. Jede meldet am Ende onDone({ ok, solution }):
// ok = richtig gelöst, solution = Zeilen für "Richtig wäre" (nur bei Fehlern gezeigt).

const CARD = 'game-float rounded-card bg-surface'
const LABEL = 'px-1 text-[13px] font-semibold uppercase tracking-wide text-label2'

export function ChoicePanel({ c, onDone }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className={LABEL}>{c.ask ?? 'Was antwortet Loopy?'}</p>
      {c.options.map((text, i) => (
        <button
          key={i}
          onClick={() => onDone({ ok: i === c.correct, solution: [c.options[c.correct]] })}
          className={`${CARD} pointer-events-auto flex items-center gap-3 px-4 py-3.5 text-left text-[16px] leading-snug transition-transform duration-150 active:scale-[0.98]`}
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent/10 text-[13px] font-semibold text-accent-text">{'ABC'[i]}</span>
          <span>{text}</span>
        </button>
      ))}
    </div>
  )
}

// Sortieren: eine Karte nach der anderen ins richtige Fach tippen
export function SortPanel({ c, onDone }) {
  const [i, setI] = useState(0)
  const [flash, setFlash] = useState(null) // { bucket, ok }
  const [wrong, setWrong] = useState([])
  const item = c.items[i]
  const allowed = c.items.length >= 5 ? 1 : 0

  const tap = (b) => {
    if (flash) return
    const ok = b === item.bucket
    const misses = ok ? wrong : [...wrong, item]
    setWrong(misses)
    setFlash({ bucket: b, ok })
    navigator.vibrate?.(ok ? 8 : [15, 30, 15])
    setTimeout(
      () => {
        setFlash(null)
        if (i + 1 < c.items.length) setI(i + 1)
        else onDone({ ok: misses.length <= allowed, solution: misses.map((m) => `${m.text} → ${c.buckets[m.bucket]}`) })
      },
      ok ? 380 : 900,
    )
  }

  return (
    <div className="pointer-events-auto flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className={LABEL}>Wohin gehört das?</p>
        <div className="flex gap-1 pr-1">
          {c.items.map((_, k) => (
            <span key={k} className={`h-1.5 w-1.5 rounded-full ${k < i ? 'bg-accent' : k === i ? 'bg-accent/50' : 'bg-fill/30'}`} />
          ))}
        </div>
      </div>
      <div className="relative h-[76px]">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={SPRING}
            className={`${CARD} absolute inset-0 flex items-center justify-center px-4 text-center text-[17px] font-semibold leading-snug`}
          >
            {item.text}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className={`grid gap-2.5 ${c.buckets.length === 3 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {c.buckets.map((name, b) => {
          const hit = flash && flash.bucket === b
          const reveal = flash && !flash.ok && item.bucket === b
          const tone = hit ? (flash.ok ? 'bg-success text-white' : 'bg-danger text-white') : reveal ? 'bg-success text-white' : 'bg-surface text-accent-text'
          return (
            <button key={b} onClick={() => tap(b)} className={`game-float min-h-[50px] rounded-2xl px-3 py-2.5 text-[16px] font-semibold leading-tight transition-[background-color,transform] duration-150 active:scale-[0.98] ${tone}`}>
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Reihenfolge: die Schritte in der richtigen Folge antippen
export function OrderPanel({ c, onDone }) {
  const pool = useMemo(() => {
    let p
    do p = c.items.map((text, k) => ({ text, k })).sort(() => Math.random() - 0.5)
    while (p.every((x, i) => x.k === i))
    return p
  }, [c])
  const [seq, setSeq] = useState([])
  const left = pool.filter((p) => !seq.includes(p))
  const full = seq.length === pool.length

  return (
    <div className="pointer-events-auto flex flex-col gap-2.5">
      <p className={LABEL}>Tippe in der richtigen Reihenfolge</p>
      <div className={`${CARD} min-h-[52px] px-3 py-2.5`}>
        {seq.length === 0 && <p className="py-1 text-center text-[15px] text-label3">Zuerst kommt …</p>}
        <ol className="space-y-1.5">
          {seq.map((s, n) => (
            <motion.li key={s.k} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
              <button onClick={() => setSeq(seq.filter((x) => x !== s))} className="flex w-full items-center gap-2.5 text-left text-[15px] leading-snug">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent text-[12px] font-semibold text-white">{n + 1}</span>
                {s.text}
              </button>
            </motion.li>
          ))}
        </ol>
      </div>
      {left.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {left.map((p) => (
            <button key={p.k} onClick={() => setSeq([...seq, p])} className="game-float rounded-2xl bg-surface px-3.5 py-2.5 text-left text-[15px] font-semibold leading-tight text-accent-text transition-transform duration-150 active:scale-[0.97]">
              {p.text}
            </button>
          ))}
        </div>
      )}
      {full && (
        <Button onClick={() => onDone({ ok: seq.every((s, n) => s.k === n), solution: [c.items.join(' → ')] })} className="w-full">
          Prüfen
        </Button>
      )}
      {!full && seq.length > 0 && <p className="text-center text-[13px] text-label2">Zum Ändern einen Schritt in der Liste antippen.</p>}
    </div>
  )
}

// Preis festlegen: Schieberegler, Nachfrage und Angebot reagieren sofort
export function PricePanel({ c, onDone }) {
  const [p, setP] = useState(() => (c.eq <= 4 ? 7 : 1))
  const demand = Math.max(0, c.demand[0] - c.demand[1] * p)
  const supply = Math.max(0, c.supply[0] + c.supply[1] * p)
  const max = Math.max(c.demand[0] - c.demand[1], c.supply[0] + c.supply[1] * 8)
  const state = demand === supply ? 'Angebot und Nachfrage sind gleich groß.' : demand > supply ? 'Mehr Leute wollen kaufen, als Ware da ist.' : 'Es bleibt Ware übrig.'

  return (
    <div className={`${CARD} pointer-events-auto p-4`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-label2">Preis pro Tüte</span>
        <span className="text-[22px] font-bold tabular-nums">{p} Münzen</span>
      </div>
      <input type="range" min="1" max="8" step="1" value={p} onChange={(e) => setP(Number(e.target.value))} aria-label="Preis pro Tüte" className="mt-2 w-full accent-[rgb(37,99,235)]" />
      <div className="mt-3 space-y-2">
        <Bar label="Nachfrage" value={demand} max={max} color="#FF84A6" />
        <Bar label="Angebot" value={supply} max={max} color="#339AFF" />
      </div>
      <p className="mt-3 text-[15px] text-label2">{state}</p>
      <Button onClick={() => onDone({ ok: p === c.eq, solution: [`${c.eq} Münzen: Dann sind Angebot und Nachfrage gleich groß.`] })} className="mt-3 w-full">
        Preis festlegen
      </Button>
    </div>
  )
}

function Bar({ label, value, max, color }) {
  return (
    <div className="flex items-center gap-2.5 text-[15px]">
      <span className="w-[86px] flex-none">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-fill/15">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${(value / max) * 100}%` }} transition={SPRING} />
      </div>
      <span className="w-8 flex-none text-right font-semibold tabular-nums">{value}</span>
    </div>
  )
}
