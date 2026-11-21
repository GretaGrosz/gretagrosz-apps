import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../i18n.jsx'
import { CheckIcon, XIcon } from './Icons.jsx'
import { QUICK } from '../motion.js'

// Antworten für Fragen, die man aus mehreren Teilen zusammentippt:
//   multi  – alle richtigen Antworten auswählen      value: [Indizes]
//   order  – Schritte der Reihe nach antippen          value: [Item-Indizes in gewählter Reihenfolge]
//   match  – jedem Begriff links eine Antwort zuordnen value: [Index der rechten Seite je Zeile | null]
// reveal: nach dem Prüfen (Üben) richtig/falsch einfärben; im Probetest bleibt es aus.
export default function BuildAnswer({ question, value, onChange, reveal = false }) {
  if (question.type === 'multi') return <Multi q={question} value={value ?? []} onChange={onChange} reveal={reveal} />
  if (question.type === 'order') return <Order q={question} value={value ?? []} onChange={onChange} reveal={reveal} />
  if (question.type === 'match') return <Match q={question} value={value ?? []} onChange={onChange} reveal={reveal} />
  return null
}

const empty = (list) => (list.length === 0 || list.every((x) => x === null || x === undefined) ? null : list)

function Hint({ children }) {
  return <p className="-mt-2 mb-4 text-[15px] text-label2">{children}</p>
}

function Mark({ ok }) {
  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white ${ok ? 'bg-success' : 'bg-danger'}`}>
      {ok ? <CheckIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
    </span>
  )
}

function Multi({ q, value, onChange, reveal }) {
  const { t } = useLang()
  const toggle = (i) => onChange(empty(value.includes(i) ? value.filter((x) => x !== i) : [...value, i].sort((a, b) => a - b)))
  return (
    <>
      <Hint>{t('multiHint')}</Hint>
      <div className="flex flex-col gap-2.5">
        {q.options.map((option, i) => {
          const on = value.includes(i)
          const right = q.correct.includes(i)
          const look = !reveal
            ? on
              ? 'border-accent bg-accent/10'
              : 'border-transparent bg-surface active:bg-fill/10'
            : right
            ? on
              ? 'border-success bg-success/10'
              : 'border-success border-dashed bg-surface'
            : on
            ? 'border-danger bg-danger/10'
            : 'border-transparent bg-surface opacity-60'
          return (
            <button
              key={i}
              type="button"
              role="checkbox"
              aria-checked={on}
              disabled={reveal}
              onClick={() => toggle(i)}
              className={`flex min-h-[56px] items-center gap-3 rounded-control border-2 px-4 py-3 text-left text-[17px] text-label transition-[background-color,border-color,opacity] duration-150 ${look}`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors ${
                  on ? (reveal ? (right ? 'border-success bg-success' : 'border-danger bg-danger') : 'border-accent bg-accent') : 'border-label3'
                } text-white`}
              >
                {on && <CheckIcon className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
              {reveal && right && !on && <span className="text-[13px] font-semibold text-success">{t('missed')}</span>}
            </button>
          )
        })}
      </div>
    </>
  )
}

function Order({ q, value, onChange, reveal }) {
  const { t } = useLang()
  const shown = q.shown ?? q.items.map((_, i) => i)
  const pool = shown.filter((i) => !value.includes(i))
  return (
    <>
      <Hint>{t('orderHint')}</Hint>
      <ol className="flex flex-col gap-2">
        {q.items.map((_, pos) => {
          const item = value[pos]
          const filled = item !== undefined
          const ok = reveal && item === pos
          return (
            <li key={pos}>
              <button
                type="button"
                disabled={reveal || !filled}
                onClick={() => onChange(empty(value.filter((_, k) => k !== pos)))}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-control border-2 px-4 py-2.5 text-left text-[17px] transition-colors ${
                  !filled
                    ? 'border-dashed border-fill/30 text-label3'
                    : reveal
                    ? ok
                      ? 'border-success bg-success/10 text-label'
                      : 'border-danger bg-danger/10 text-label'
                    : 'border-accent bg-accent/10 text-label'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular ${filled ? 'bg-accent text-white' : 'bg-fill/[0.16] text-label2'}`}>
                  {pos + 1}
                </span>
                {filled ? (
                  <motion.span layout transition={QUICK} className="min-w-0 flex-1">
                    {q.items[item]}
                  </motion.span>
                ) : (
                  <span className="flex-1 text-[15px]">{pos === value.length ? t('orderNext') : ''}</span>
                )}
                {reveal && filled && <Mark ok={ok} />}
              </button>
            </li>
          )
        })}
      </ol>
      {pool.length > 0 && !reveal && (
        <div className="mt-5 flex flex-col gap-2">
          {pool.map((i) => (
            <motion.button
              layout
              transition={QUICK}
              key={i}
              type="button"
              onClick={() => onChange([...value, i])}
              className="min-h-[52px] rounded-control border-2 border-transparent bg-surface px-4 py-2.5 text-left text-[17px] text-label active:bg-fill/10"
            >
              {q.items[i]}
            </motion.button>
          ))}
        </div>
      )}
    </>
  )
}

function Match({ q, value, onChange, reveal }) {
  const { t } = useLang()
  const n = q.pairs.length
  const shown = q.shown ?? q.pairs.map((_, i) => i)
  const row = (i) => (value[i] === undefined ? null : value[i])
  const used = new Set(value.filter((x) => x !== null && x !== undefined))
  const [focus, setFocus] = useState(null)
  // Aktive Zeile: die zuletzt angetippte (solange sie frei ist), sonst die erste ohne Zuordnung
  const active = focus !== null && row(focus) === null ? focus : [...Array(n).keys()].find((i) => row(i) === null)
  const pick = (r) => {
    if (active === undefined) return
    const next = [...Array(n).keys()].map(row)
    next[active] = r
    setFocus(null)
    onChange(empty(next))
  }
  const tapRow = (i) => {
    const next = [...Array(n).keys()].map(row)
    next[i] = null
    setFocus(i)
    onChange(empty(next))
  }
  return (
    <>
      <Hint>{t('matchHint')}</Hint>
      <div className="flex flex-col gap-2">
        {q.pairs.map(([left], i) => {
          const r = row(i)
          const ok = reveal && r === i
          const isActive = !reveal && i === active
          return (
            <button
              key={i}
              type="button"
              disabled={reveal}
              onClick={() => tapRow(i)}
              className={`flex w-full flex-col gap-1.5 rounded-control border-2 px-4 py-3 text-left transition-colors ${
                reveal ? (ok ? 'border-success bg-success/10' : 'border-danger bg-danger/10') : isActive ? 'border-accent bg-surface' : 'border-transparent bg-surface'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="min-w-0 flex-1 text-[17px] font-semibold text-label">{left}</span>
                {reveal && <Mark ok={ok} />}
              </span>
              {r !== null ? (
                <span className="rounded-[10px] bg-accent/10 px-3 py-2 text-[15px] leading-snug text-label">{q.pairs[r][1]}</span>
              ) : (
                <span className={`rounded-[10px] border border-dashed px-3 py-2 text-[15px] ${isActive ? 'border-accent text-accent-text' : 'border-fill/30 text-label3'}`}>
                  {isActive ? t('matchPick') : '—'}
                </span>
              )}
              {reveal && !ok && <span className="text-[13px] leading-snug text-success">✓ {q.pairs[i][1]}</span>}
            </button>
          )
        })}
      </div>
      {!reveal && used.size < n && (
        <div className="mt-5 flex flex-col gap-2">
          {shown
            .filter((r) => !used.has(r))
            .map((r) => (
              <motion.button
                layout
                transition={QUICK}
                key={r}
                type="button"
                onClick={() => pick(r)}
                className="min-h-[48px] rounded-control border-2 border-transparent bg-fill/[0.10] px-4 py-2.5 text-left text-[15px] leading-snug text-label active:bg-fill/20"
              >
                {q.pairs[r][1]}
              </motion.button>
            ))}
        </div>
      )}
    </>
  )
}
