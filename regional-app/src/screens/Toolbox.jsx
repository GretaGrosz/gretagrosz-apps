import { useMemo, useState } from 'react'
import { AREAS, AREA_ORDER, TOTAL_DAYS } from '../plan'
import { getDay } from '../content'
import { EXAM, TOOLS, bankForTool, norm, toolsLoaded } from '../data'
import { t } from '../i18n'
import { AreaBadge, BackButton, ChevronIcon, Done, Header, NavBar, Page, Rich, SearchField, SectionHeader, Segmented, dayTitle } from '../ui'
import { AREA_SHORT, BankRow } from './Train'

export const EMPTY_TOOL_FILTERS = { q: '', area: 'all' }

const toolArea = (x) => ({ kind: 'learn', area: AREAS[x.area] ? x.area : 'X' })

function ToolRow({ x, onOpen }) {
  return (
    <button onClick={() => onOpen(x.id)} className="row">
      <AreaBadge d={toolArea(x)} small />
      <span className="min-w-0 flex-1">
        <span className="body block truncate">{x.name}</span>
        {x.nameDe && x.nameDe !== x.name && (
          <span className="footnote block truncate" lang="de">
            {x.nameDe}
          </span>
        )}
      </span>
      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
    </button>
  )
}

export function ToolboxScreen({ filters, setFilters, onOpenTool, onOpenExam, onBack, backLabel }) {
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }))
  const list = useMemo(() => {
    const q = norm(filters.q)
    return TOOLS.filter((x) => (filters.area === 'all' || x.area === filters.area) && (!q || [x.name, x.nameDe, x.statement, x.when, ...(x.tags || [])].some((s) => norm(s).includes(q))))
  }, [filters, TOOLS.length])
  const areas = [...AREA_ORDER, ...new Set(TOOLS.map((x) => x.area).filter((a) => !AREA_ORDER.includes(a)))]
  const examHits = EXAM.filter((e) => !filters.q || [e.title, e.body, ...(e.points || [])].some((s) => norm(s).includes(norm(filters.q))))

  return (
    <>
      <NavBar title={t('Toolbox')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <Header title={t('Toolbox')} />
        <div className="mt-3">
          <SearchField value={filters.q} onChange={set('q')} placeholder={t('Search the toolbox')} />
        </div>
        <Segmented className="mt-3" value={filters.area} onChange={set('area')} options={[['all', t('All')], ...AREA_ORDER.map((a) => [a, AREA_SHORT[a]]), ['exam', t('Exam')]]} label={t('Area')} />

        {!toolsLoaded() && (
          <div className="mt-6 flex justify-center" aria-label={t('Loading')}>
            <span className="spinner spinner-dark" />
          </div>
        )}

        {filters.area !== 'exam' &&
          areas.map((a) => {
            const ts = list.filter((x) => x.area === a)
            if (!ts.length) return null
            return (
              <div key={a}>
                <SectionHeader>
                  {AREAS[a]?.name || a} · {ts.length}
                </SectionHeader>
                <div className="group" style={{ '--inset': '56px' }}>
                  {ts.map((x) => (
                    <ToolRow key={x.id} x={x} onOpen={onOpenTool} />
                  ))}
                </div>
              </div>
            )
          })}

        {(filters.area === 'exam' || filters.area === 'all') && examHits.length > 0 && (
          <>
            <SectionHeader>{t('Exam day')}</SectionHeader>
            <div className="group">
              {examHits.map((e) => (
                <button key={e.id} onClick={() => onOpenExam(e.id)} className="row">
                  <span className="body min-w-0 flex-1 truncate">{e.title}</span>
                  <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                </button>
              ))}
            </div>
          </>
        )}

        {toolsLoaded() && filters.q && list.length === 0 && examHits.length === 0 && (
          <div className="card mt-5 p-4">
            <p className="subhead secondary">{t('Nothing found for “{q}”.', { q: filters.q })}</p>
          </div>
        )}
      </Page>
    </>
  )
}

export function ToolScreen({ tool: x, state, backLabel, onBack, onOpenDay, onOpenBank }) {
  const [showExample, setShowExample] = useState(false)
  const problems = bankForTool(x)
  const days = (x.days || []).filter((n) => n >= 1 && n <= TOTAL_DAYS).map((n) => getDay(n - 1))
  const color = AREAS[x.area]?.color || 'var(--indigo)'

  return (
    <>
      <NavBar title={x.name} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <p className="footnote font-semibold" style={{ color }}>
          {AREAS[x.area]?.name || t('Toolbox')}
        </p>
        <h1 className="title1 mt-1">{x.name}</h1>
        {x.nameDe && x.nameDe !== x.name && (
          <p className="subhead secondary mt-1" lang="de">
            {x.nameDe}
          </p>
        )}

        <SectionHeader>{t('Statement')}</SectionHeader>
        <div className="card p-4">
          <Rich text={x.statement} />
        </div>

        {x.equality && (
          <>
            <SectionHeader>
              <span lang="de">Wann gilt Gleichheit?</span>
            </SectionHeader>
            <div className="card p-4">
              <Rich text={x.equality} />
            </div>
          </>
        )}

        {x.when && (
          <>
            <SectionHeader>{t('When to use it')}</SectionHeader>
            <div className="card p-4">
              <Rich text={x.when} />
            </div>
          </>
        )}

        {x.example?.q && (
          <>
            <SectionHeader>{t('Example')}</SectionHeader>
            <div className="card overflow-hidden">
              <Rich text={x.example.q} className="problem p-4" />
              {showExample ? (
                <Rich text={x.example.a} className="fade-in problem secondary px-4 pb-4" />
              ) : (
                <button onClick={() => setShowExample(true)} className="row link" style={{ borderTop: '0.5px solid var(--sep)' }}>
                  {t('Show solution')}
                </button>
              )}
            </div>
          </>
        )}

        {x.pitfalls?.length > 0 && (
          <>
            <SectionHeader>{t('Pitfalls')}</SectionHeader>
            <div className="group">
              {x.pitfalls.map((s, i) => (
                <div key={i} className="row items-start">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--orange)' }} />
                  <Rich as="span" text={s} className="callout" />
                </div>
              ))}
            </div>
          </>
        )}

        {days.length > 0 && (
          <>
            <SectionHeader>{t('In the plan')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {days.map((d) => (
                <button key={d.index} onClick={() => onOpenDay(d.index)} className="row">
                  <AreaBadge d={d} small />
                  <span className="min-w-0 flex-1">
                    <span className="body block truncate" lang="de">
                      {dayTitle(d)}
                    </span>
                    <span className="footnote block">{t('Day {n}', { n: d.day })}</span>
                  </span>
                  {state.results[d.index] && <Done status={state.results[d.index].status} small />}
                  <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                </button>
              ))}
            </div>
          </>
        )}

        {problems.length > 0 && (
          <>
            <SectionHeader>{t('Past problems that use it · {n}', { n: problems.length })}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {problems.map((p) => (
                <BankRow key={p.id} p={p} entry={state.bank?.[p.id]} onOpen={onOpenBank} results={state.results} />
              ))}
            </div>
          </>
        )}
      </Page>
    </>
  )
}

export function ExamScreen({ item, backLabel, onBack }) {
  return (
    <>
      <NavBar title={item.title} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <p className="footnote font-semibold" style={{ color: 'var(--indigo)' }}>
          {t('Exam day')}
        </p>
        <h1 className="title1 mt-1">{item.title}</h1>
        {item.body && (
          <div className="card mt-5 p-4">
            <Rich text={item.body} />
          </div>
        )}
        {item.points?.length > 0 && (
          <div className="group mt-4" style={{ '--inset': '52px' }}>
            {item.points.map((s, i) => (
              <div key={i} className="row items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: 'var(--tint)', color: 'var(--link)' }}>
                  {i + 1}
                </span>
                <Rich as="span" text={s} className="callout" />
              </div>
            ))}
          </div>
        )}
      </Page>
    </>
  )
}
