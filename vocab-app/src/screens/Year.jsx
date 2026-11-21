// Your year: every day as a square in that day's streak colour. Tap a day to see its words.
import { useEffect, useMemo, useRef, useState } from 'react'
import { themeOf, wordByKey } from '../lexicon'
import { shadeHex } from '../theme'
import { yearOf } from '../year'
import { formatDay, useT } from '../i18n'
import { BackButton, CheckIcon, NavBar, Word, XIcon } from '../ui'
import { dateOfDay } from '../store'

const CASCADE_MS = 300 // the last square starts here; each one takes 100 ms

export default function Year({ state, lang, today, dark, onBack }) {
  const t = useT()
  const data = useMemo(() => yearOf(state, lang, today), [state, lang, today])
  const [open, setOpen] = useState(null)

  // Months of the window, each as weeks starting on Monday
  const months = useMemo(() => {
    const out = []
    let d = data.start
    while (d <= data.end) {
      const date = dateOfDay(d)
      const y = date.getUTCFullYear()
      const m = date.getUTCMonth()
      const first = Math.floor(Date.UTC(y, m, 1) / 864e5)
      const last = Math.floor(Date.UTC(y, m + 1, 0) / 864e5)
      const lead = (dateOfDay(first).getUTCDay() + 6) % 7
      const cells = Array.from({ length: lead }, () => null)
      for (let x = first; x <= last; x++) cells.push(x)
      out.push({ key: `${y}-${m}`, first, cells })
      d = last + 1
    }
    return out
  }, [data.start, data.end])

  const span = data.end - data.start
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, i) => formatDay(t, 4 + i, { weekday: 'narrow' })), [t]) // day 4 = Mon 5 Jan 1970

  return (
    <main className="page">
      <NavBar plain left={<BackButton onClick={onBack} label={t.today} />} />
      <p className="caption">
        {t.languages[state.from]} → {t.languages[lang]}
      </p>
      <h1 className="large-title">{t.yourYear}</h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="group px-4 py-3">
          <p className="title2 num">{data.doneCount}</p>
          <p className="footnote">{t.daysDone(data.doneCount)}</p>
        </div>
        <div className="group px-4 py-3">
          <p className="title2 num">{data.longest}</p>
          <p className="footnote">{t.longestStreak}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6">
        {months.map((m) => (
          <section key={m.key} aria-label={formatDay(t, m.first, { month: 'long', year: 'numeric' })}>
            <p className="headline mb-1.5">{formatDay(t, m.first, { month: 'short' }).replace('.', '')}</p>
            <div className="grid grid-cols-7 gap-[3px]">
              {weekdays.map((w, i) => (
                <span key={i} className="text-center text-[10px] font-medium leading-4 text-[var(--label-2)]" aria-hidden="true">
                  {w}
                </span>
              ))}
              {m.cells.map((d, i) =>
                d == null || d < data.start || d > data.end ? (
                  <span key={i} className="aspect-square" />
                ) : (
                  <Square key={i} day={d} info={data.days.get(d)} today={today} dark={dark} order={span ? (d - data.start) / span : 0} onOpen={setOpen} />
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      {open != null && <DaySheet day={open} info={data.days.get(open)} today={today} from={state.from} lang={lang} onClose={() => setOpen(null)} />}
    </main>
  )
}

function Square({ day, info, today, dark, order, onOpen }) {
  const t = useT()
  const done = info?.done
  const future = day > today
  const isToday = day === today
  const style = { animationDelay: `${Math.round(order * CASCADE_MS)}ms` }
  let cls = 'year-sq aspect-square rounded-[5px]'
  if (done) style.background = shadeHex(info.s, dark)
  else if (future) style.background = 'color-mix(in srgb, var(--fill) 55%, transparent)'
  else style.boxShadow = `inset 0 0 0 1.5px ${isToday ? 'var(--accent)' : 'color-mix(in srgb, var(--label-2) 65%, transparent)'}`
  if (isToday) cls += ' year-today'
  const label = `${formatDay(t, day, { weekday: 'long', day: 'numeric', month: 'long' })}: ${done ? t.doneDay : t.missed}`
  if (future) return <span className={cls} style={style} aria-hidden="true" />
  return <button type="button" className={`${cls} min-h-0`} style={style} aria-label={label} onClick={() => onOpen(day)} />
}

function DaySheet({ day, info, today, from, lang, onClose }) {
  const t = useT()
  const sheet = useRef(null)
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    sheet.current?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [])
  const tests = (info?.tests || []).map((e) => ({
    ...e,
    rows: e.w || (e.keys || []).map(([key, ok]) => {
      const w = wordByKey(key, e.from || from, lang)
      return w ? [w.front, w.answers[0], ok] : null
    }).filter(Boolean),
  }))
  const status = info?.done ? `${info.s} ${t.dayStreak(info.s)}` : day === today ? t.notDoneYet : t.missed

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={formatDay(t, day, { weekday: 'long', day: 'numeric', month: 'long' })}>
      <button type="button" className="sheet-backdrop absolute inset-0 h-full w-full bg-black/30" aria-label={t.done} onClick={onClose} />
      <div ref={sheet} tabIndex={-1} className="sheet absolute inset-x-0 bottom-0 mx-auto max-h-[78dvh] max-w-[30rem] overflow-y-auto rounded-t-[28px] px-4 pb-[calc(24px+env(safe-area-inset-bottom))] outline-none">
        <div className="sticky top-0 z-10 -mx-4 flex items-center justify-between px-4 pb-2 pt-3" style={{ background: 'inherit' }}>
          <span className="mx-auto mb-1 block h-[5px] w-9 rounded-full bg-[var(--label-2)] opacity-40" aria-hidden="true" />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="title2">{formatDay(t, day, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
            <p className="subhead mt-0.5" style={{ color: info?.done ? 'var(--green)' : 'var(--label-2)' }}>
              {status}
            </p>
          </div>
          <button onClick={onClose} className="link -mr-2 font-semibold">
            {t.done}
          </button>
        </div>
        {tests.map((e, i) =>
          e.rows.length ? (
            <div key={i}>
              <div className="mb-2 mt-6 flex items-baseline justify-between px-4">
                <p className="caption truncate">{e.k === 'c' && typeof e.n === 'number' ? t.dayCaption(e.n + 1, t.theme(themeOf(e.n))) : e.k === 'l' ? e.n : e.k === 'r' ? t.reviewTitle : t.test}</p>
                <p className="footnote num shrink-0 pl-2">{t.of(e.rows.filter((r) => r[2]).length, e.rows.length)}</p>
              </div>
              <div className="group" style={{ background: 'var(--surface)' }}>
                {e.rows.map(([front, answer, ok], j) => (
                  <div key={j} className="row gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white" style={{ background: ok ? 'var(--green-fill)' : 'var(--red-fill)' }}>
                      {ok ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-2.5 w-2.5" />}
                    </span>
                    <span className="body secondary min-w-0 flex-1 break-words">
                      <Word text={front} />
                    </span>
                    <span className="headline min-w-0 break-words text-right">
                      <Word text={answer} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}
