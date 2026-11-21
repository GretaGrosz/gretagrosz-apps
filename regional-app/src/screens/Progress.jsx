import { useMemo, useState } from 'react'
import { AREAS, AREA_ORDER, PLAN, TOTAL_DAYS } from '../plan'
import { getDay } from '../content'
import { BANK, BANK_BY_ID, TOOLS, bankArea, bankStatus, bankTitle, mockFinished, mockTotal, toolsForProblem } from '../data'
import { dateOfDay, dayOfDate } from '../dates'
import { fmtDate, getLang, t, tn } from '../i18n'
import { MAX_POINTS } from '../ai'
import { PAPER_MASTER, PAPER_PASS, bestScore } from '../logic'
import { prediction } from '../score'
import { AreaBadge, ChevronIcon, Header, NavBar, Page, REASONS, Ring, STATUS, SectionHeader, dayTitle, reasonLabel, statusLabel } from '../ui'
import { BankRow } from './Train'

const WEEKDAYS = { en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'], de: ['M', 'D', 'M', 'D', 'F', 'S', 'S'] }

function Calendar({ state, today, onOpen }) {
  const now = dateOfDay(today)
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const byDay = useMemo(() => {
    const map = {}
    Object.entries(state.results).forEach(([index, r]) => (map[r.day] = { index: Number(index), status: r.status }))
    return map
  }, [state.results])
  const first = new Date(month.y, month.m, 1)
  const blanks = (first.getDay() + 6) % 7
  const length = new Date(month.y, month.m + 1, 0).getDate()
  const shift = (by) => setMonth(({ y, m }) => ({ y: m + by < 0 ? y - 1 : m + by > 11 ? y + 1 : y, m: (m + by + 12) % 12 }))

  return (
    <div className="card p-3">
      <div className="mb-1 flex items-center justify-between pl-2">
        <span className="headline">{fmtDate(first, { month: 'long', year: 'numeric' })}</span>
        <span className="flex" style={{ color: 'var(--link)' }}>
          <button onClick={() => shift(-1)} aria-label={t('Previous month')} className="flex h-11 w-11 items-center justify-center active:opacity-50">
            <ChevronIcon left className="h-5 w-5" />
          </button>
          <button onClick={() => shift(1)} aria-label={t('Next month')} className="flex h-11 w-11 items-center justify-center active:opacity-50">
            <ChevronIcon className="h-5 w-5" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS[getLang()].map((d, i) => (
          <span key={i} className="caption pb-1 font-semibold">
            {d}
          </span>
        ))}
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {Array.from({ length }, (_, i) => {
          const day = dayOfDate(month.y, month.m, i + 1)
          const hit = byDay[day]
          const isToday = day === today
          return (
            <span key={i} className="flex justify-center">
              <button
                disabled={!hit}
                onClick={() => onOpen(hit.index)}
                aria-label={hit ? `${i + 1} · ${dayTitle(getDay(hit.index))} · ${statusLabel(hit.status)}` : undefined}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[16px] transition-transform active:scale-90"
                style={{
                  background: hit ? STATUS[hit.status].color : 'transparent',
                  boxShadow: isToday && !hit ? 'inset 0 0 0 2px var(--accent)' : 'none',
                  color: hit ? '#FFFFFF' : isToday ? 'var(--link)' : day > today ? 'var(--tertiary)' : 'var(--label)',
                  fontWeight: hit || isToday ? 600 : 400,
                }}
              >
                {i + 1}
              </button>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// Bars out of a maximum, with a dashed target line labelled in the left gutter.
// Values sit inside the bar when it's tall enough, so they never collide with the line.
function BarChart({ bars, max, target, onOpen }) {
  const H = 132
  const y = (v) => (v / max) * H
  return (
    <div className="relative flex pl-7" style={{ height: H + 24 }}>
      {target != null && (
        <>
          <span className="absolute left-7 right-0 border-t border-dashed" style={{ bottom: y(target) + 20, borderColor: 'var(--label-2)' }} aria-hidden="true" />
          <span className="caption absolute left-0 w-6 text-right tabular-nums" style={{ bottom: y(target) + 13 }}>
            {target}
          </span>
        </>
      )}
      <div className="relative flex flex-1 items-end gap-2">
        {bars.map((b) => {
          const h = Math.max(4, y(b.value))
          const inside = h >= 22
          return (
            <button key={b.key} onClick={() => onOpen(b)} className="relative flex max-w-[44px] flex-1 flex-col items-center justify-end" style={{ height: H + 24 }} aria-label={`${b.label}: ${b.value}/${max}`}>
              {!inside && <span className="caption mb-1 font-semibold tabular-nums">{b.value}</span>}
              <span className="relative flex w-full justify-center rounded-md pt-1" style={{ height: h, background: b.color }}>
                {inside && <span className="text-[12px] font-semibold leading-4 tabular-nums text-white">{b.value}</span>}
              </span>
              <span className="caption mt-1 h-4 leading-4 tabular-nums">{b.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function ProgressTab({ state, today, current, onOpenDay, onRedo, onMini, onOpenBank, onOpenTool, onOpenMock }) {
  const doneMocks = (state.mocks || []).filter(mockFinished)
  const target = state.target || 16
  const pred = useMemo(() => prediction(state), [state])
  const hasPrediction = AREA_ORDER.some((a) => pred.areas[a])
  const [allMistakes, setAllMistakes] = useState(false)
  const mistakes = state.mistakes || []
  const open = mistakes.filter((m) => !m.fixed).slice().reverse()
  const reasonCounts = REASONS.map(([id, , tip]) => ({ id, tip, n: mistakes.filter((m) => m.reason === id).length }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n)
  const minis = Object.entries(state.minis || {}).filter(([, m]) => m.refs.length && m.refs.every((_, i) => m.work?.[i]?.grades?.length))
  const papers = PLAN.filter((d) => d.kind === 'paper' && state.results[d.index]?.score)
  const doneCount = Object.keys(state.results).length
  const masteredCount = Object.values(state.results).filter((r) => r.status === 'mastered').length

  // What to practise next: the weakest area by the same numbers shown above
  const focus = useMemo(() => {
    const area = pred.weakest
    const bank = state.bank || {}
    const busy = new Set((state.mocks || []).filter((m) => !mockFinished(m)).flatMap((m) => m.ids))
    const rank = (p) => (bank[p.id]?.due != null && bank[p.id].due <= today ? 0 : bankStatus(bank[p.id]) === 'tried' ? 1 : 2)
    const problems = BANK.filter((p) => p.area === area && !busy.has(p.id) && ['new', 'tried'].includes(bankStatus(bank[p.id])))
      .sort((x, y) => rank(x) - rank(y) || (x.difficulty || 3) - (y.difficulty || 3) || y.year - x.year)
      .slice(0, 3)
    const weak = BANK.filter((p) => p.area === area && bankStatus(bank[p.id]) === 'tried')
    const seen = new Set()
    const tools = [...weak.flatMap((p) => toolsForProblem(p)), ...TOOLS.filter((x) => x.area === area)].filter((x) => x.area === area && !seen.has(x.id) && seen.add(x.id)).slice(0, 2)
    return { area, problems, tools }
  }, [pred, state, today])

  return (
    <>
      <NavBar title={t('Progress')} />
      <Page>
        <Header title={t('Progress')} />

        {hasPrediction && (
          <div className="card mt-4 p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="footnote">{t('If the competition were today')}</p>
                <p className="mt-0.5 tabular-nums">
                  <span className="text-[44px] font-bold leading-[48px]">{pred.total != null ? Math.round(pred.total) : '–'}</span>
                  <span className="title3 secondary">/32</span>
                </p>
              </div>
              <div className="pb-1.5 text-right">
                <p className="footnote tabular-nums">{t('Target {n}', { n: target })}</p>
                {pred.total != null && (
                  <p className="subhead font-semibold tabular-nums" style={{ color: pred.total >= target ? 'var(--green)' : 'var(--orange)' }}>
                    {pred.total >= target ? t('On target') : t('{n} to go', { n: Math.ceil(target - pred.total) })}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {AREA_ORDER.map((a) => {
                const x = pred.areas[a]
                return (
                  <div key={a} className="flex items-center gap-3">
                    <span className="subhead w-[112px] shrink-0 truncate font-semibold" style={{ color: AREAS[a].color }}>
                      {AREAS[a].name}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--fill)' }}>
                      <span className="bar-fill block h-full rounded-full" style={{ width: `${x ? (x.points / 8) * 100 : 0}%`, background: AREAS[a].color }} />
                    </span>
                    <span className="subhead w-12 text-right tabular-nums" style={{ color: x ? 'var(--label)' : 'var(--label-2)' }}>
                      {x ? `${x.points.toFixed(1)}` : '–'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {hasPrediction && (focus.problems.length > 0 || focus.tools.length > 0) && (
          <>
            <SectionHeader>
              {t('Practise next')}: {AREAS[focus.area].name}
            </SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {focus.problems.map((p) => (
                <BankRow key={p.id} p={p} entry={state.bank?.[p.id]} onOpen={onOpenBank} current={current} results={state.results} />
              ))}
              {focus.tools.map((x) => (
                <button key={x.id} onClick={() => onOpenTool(x.id)} className="row">
                  <AreaBadge d={{ kind: 'learn', area: x.area }} small />
                  <span className="min-w-0 flex-1">
                    <span className="body block truncate">{x.name}</span>
                    <span className="footnote block truncate">{t('Toolbox')}</span>
                  </span>
                  <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                </button>
              ))}
            </div>
          </>
        )}

        <SectionHeader>{t('Plan')}</SectionHeader>
        <div className="card flex items-center gap-4 p-4">
          <Ring value={doneCount / TOTAL_DAYS} size={76} stroke={9} label={t('{done} of {total} days', { done: doneCount, total: TOTAL_DAYS })}>
            <span className="headline tabular-nums">{doneCount}</span>
          </Ring>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            <div>
              <p className="title2 tabular-nums">{doneCount}</p>
              <p className="caption">{t('days done')}</p>
            </div>
            <div>
              <p className="title2 tabular-nums" style={{ color: masteredCount ? 'var(--purple)' : undefined }}>
                {masteredCount}
              </p>
              <p className="caption">{t('mastered')}</p>
            </div>
            <div>
              <p className="title2 tabular-nums" style={{ color: state.best ? 'var(--orange)' : undefined }}>
                {state.best || 0}
              </p>
              <p className="caption">{t('best streak')}</p>
            </div>
          </div>
        </div>

        {mistakes.length > 0 && (
          <>
            <SectionHeader>{t('Mistake notebook')}</SectionHeader>
            <div className="card p-4">
              <div className="space-y-2.5">
                {reasonCounts.map((r) => (
                  <div key={r.id} className="flex items-center gap-3">
                    <span className="subhead w-[150px] shrink-0">{reasonLabel(r.id)}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--fill)' }}>
                      <span className="block h-full rounded-full" style={{ width: `${(r.n / reasonCounts[0].n) * 100}%`, background: 'var(--red)' }} />
                    </span>
                    <span className="subhead secondary w-6 text-right tabular-nums">{r.n}</span>
                  </div>
                ))}
              </div>
              <p className="subhead mt-4">{t(reasonCounts[0].tip)}</p>
            </div>
            {open.length > 0 && (
              <div className="group mt-3" style={{ '--inset': '56px' }}>
                {(allMistakes ? open : open.slice(0, 5)).map((m, i) => {
                  if (m.bank) {
                    const p = BANK_BY_ID[m.bank]
                    if (!p) return null
                    return (
                      <button key={i} onClick={() => onOpenBank(p.id)} className="row">
                        <AreaBadge d={bankArea(p)} small />
                        <span className="min-w-0 flex-1">
                          <span className="body block truncate">{p.title || bankTitle(p)}</span>
                          <span className="footnote block truncate">
                            {bankTitle(p)} · {reasonLabel(m.reason)}
                          </span>
                        </span>
                        <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                      </button>
                    )
                  }
                  const md = getDay(m.index)
                  return (
                    <button key={i} onClick={() => onRedo(m)} className="row">
                      <AreaBadge d={md} small />
                      <span className="min-w-0 flex-1">
                        <span className="body block truncate" lang="de">
                          {dayTitle(md)}
                        </span>
                        <span className="footnote block truncate">
                          {t('Day {n}', { n: md.day })}
                          {m.k === 'c' ? ` · ${t('Challenge')}` : ''} · {reasonLabel(m.reason)}
                        </span>
                      </span>
                      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                    </button>
                  )
                })}
                {open.length > 5 && (
                  <button onClick={() => setAllMistakes((v) => !v)} className="row link">
                    {allMistakes ? t('Show fewer') : t('Show all {n}', { n: open.length })}
                  </button>
                )}
              </div>
            )}
            {mistakes.length > open.length && <p className="footnote mt-2 px-4">{tn(mistakes.length - open.length, '{n} fixed', '{n} fixed')}</p>}
          </>
        )}

        {doneMocks.length > 0 && (
          <>
            <SectionHeader>{t('Mocks')}</SectionHeader>
            <div className="card p-4">
              <BarChart
                max={32}
                target={target}
                bars={doneMocks.slice(-10).map((m) => {
                  const total = mockTotal(m)
                  return { key: m.id, id: m.id, value: total, label: fmtDate(m.startedAt, { day: 'numeric', month: 'numeric' }), color: total >= target ? 'var(--green)' : 'var(--orange)' }
                })}
                onOpen={(b) => onOpenMock(b.id)}
              />
            </div>
          </>
        )}

        {papers.length > 0 && (
          <>
            <SectionHeader>{t('Past papers')}</SectionHeader>
            <div className="card p-4">
              <BarChart
                max={32}
                target={16}
                bars={papers.map((d) => {
                  const [got, max] = state.results[d.index].score.split('/').map(Number)
                  const pct = got / max
                  return { key: d.index, index: d.index, value: got, label: `${d.paper[0] === 'GWF' ? '' : 'B'}${String(d.paper[1]).slice(2)}`, color: pct >= PAPER_MASTER ? 'var(--purple)' : pct >= PAPER_PASS ? 'var(--green)' : 'var(--orange)' }
                })}
                onOpen={(b) => onOpenDay(b.index)}
              />
            </div>
          </>
        )}

        {minis.length > 0 && (
          <>
            <SectionHeader>{t('Mini-mocks')}</SectionHeader>
            <div className="group">
              {minis.map(([n, m]) => {
                const total = m.refs.reduce((sum, _, i) => sum + Math.max(0, bestScore(m.work[i])), 0)
                const max = m.refs.length * MAX_POINTS
                return (
                  <button key={n} onClick={() => onMini(Number(n))} className="row">
                    <span className="body flex-1">{t('Mini-mock {n}', { n })}</span>
                    <span className="subhead tabular-nums" style={{ color: total >= PAPER_MASTER * max ? 'var(--purple)' : total >= PAPER_PASS * max ? 'var(--green)' : 'var(--orange)' }}>
                      {total}/{max}
                    </span>
                    <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                  </button>
                )
              })}
            </div>
          </>
        )}

        <SectionHeader>{t('Calendar')}</SectionHeader>
        <Calendar state={state} today={today} onOpen={onOpenDay} />
      </Page>
    </>
  )
}
