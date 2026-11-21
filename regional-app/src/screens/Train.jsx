import { useMemo, useState } from 'react'
import { AREAS, AREA_ORDER, PLAN } from '../plan'
import { MAX_POINTS, gradeProof } from '../ai'
import { BANK, BANK_STATUS, TECHNIQUES, TOOLS, YEARS, aiProblem, bankArea, bankBest, bankStatus, bankTitle, mockFinished, mockTotal, norm, toolsForProblem } from '../data'
import { fmtDate, t, tn } from '../i18n'
import {
  AreaBadge, BackButton, ChatIcon, CheckIcon, ChevronIcon, Difficulty, GradeCard, Header, IconBadge, LangToggle, MistakePicker, NavBar, Page, PhotoStrip, PickerRow, PointsSelf, Rich, SearchField,
  SectionHeader, Segmented, Split, StepCheck, TimerIcon, ToolboxIcon, areaColor, formatTime, useDraft, useNow,
} from '../ui'
import { Hints, SELF_MIN_CHARS } from './Problem'

export const AREA_SHORT = { A: 'Alg', G: 'Geo', K: 'Komb', N: 'ZT' }
export const PER_PROBLEM_MIN = 60 // four problems in four hours
export const EMPTY_FILTERS = { q: '', area: 'all', status: 'all', year: 'all', tech: 'all' }

export const problemText = (p, lang) => (lang === 'en' ? p.q || p.qDe : p.qDe || p.q)

// The plan saves every GWF year for a paper day. Until that day is done, the paper is "reserved":
// practising it early spoils the Generalprobe.
export function reservedFor(year, results) {
  const d = PLAN.find((x) => x.kind === 'paper' && x.paper[0] === 'GWF' && x.paper[1] === year)
  return d && !results?.[d.index] ? d : null
}

// Right side of a bank row: your best score, or nothing if it's new
export function BankScore({ entry }) {
  const st = bankStatus(entry)
  if (st === 'new') return null
  if (st === 'full')
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: BANK_STATUS.full.color }} aria-label="8/8">
        <CheckIcon className="h-3.5 w-3.5 text-white" />
      </span>
    )
  return (
    <span className="subhead tabular-nums" style={{ color: BANK_STATUS[st].color }}>
      {bankBest(entry)}/8
    </span>
  )
}

export function BankRow({ p, entry, sub, onOpen, results }) {
  const reserved = results && bankStatus(entry) === 'new' ? reservedFor(p.year, results) : null
  return (
    <button onClick={() => onOpen(p.id)} className="row">
      <AreaBadge d={bankArea(p)} small />
      <span className="min-w-0 flex-1">
        <span className="body block truncate">{p.title || bankTitle(p)}</span>
        <span className="footnote flex items-center gap-2">
          <span className="truncate">{sub || `${bankTitle(p)} · ${AREAS[p.area].name}`}</span>
          <Difficulty n={p.difficulty} />
        </span>
      </span>
      {reserved ? (
        <span className="caption shrink-0 rounded-full px-2 py-0.5 tabular-nums" style={{ background: 'var(--fill)' }}>
          {t('Day {n}', { n: reserved.day })}
        </span>
      ) : (
        <BankScore entry={entry} />
      )}
      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
    </button>
  )
}

/* ---------- Train tab ---------- */

export function TrainTab({ state, today, filters, setFilters, onOpenBank, onMockStart, onOpenMock, onToolbox }) {
  const bank = state.bank || {}
  const set = (k) => (v) => setFilters((f) => ({ ...f, [k]: v }))
  const now = useNow()
  const active = (state.mocks || []).find((m) => !mockFinished(m))
  const done = (state.mocks || []).filter(mockFinished)
  const target = state.target || 16

  const list = useMemo(() => {
    const q = norm(filters.q)
    return BANK.filter(
      (p) =>
        (filters.area === 'all' || p.area === filters.area) &&
        (filters.year === 'all' || String(p.year) === String(filters.year)) &&
        (filters.tech === 'all' || p.techniques.includes(filters.tech)) &&
        (filters.status === 'all' || bankStatus(bank[p.id]) === filters.status) &&
        (!q || [p.title, p.q, p.qDe, bankTitle(p), ...p.techniques].some((s) => norm(s).includes(q))),
    )
  }, [filters, bank])
  const due = BANK.filter((p) => bank[p.id]?.due != null && bank[p.id].due <= today && bankStatus(bank[p.id]) !== 'full')
  const byYear = YEARS.map((y) => [y, list.filter((p) => p.year === y)]).filter(([, ps]) => ps.length)
  const filtered = Object.entries(filters).some(([k, v]) => v !== EMPTY_FILTERS[k])
  const counts = { solved: BANK.filter((p) => ['solved', 'full'].includes(bankStatus(bank[p.id]))).length, tried: BANK.filter((p) => bankStatus(bank[p.id]) !== 'new').length }
  const end = active ? active.startedAt + active.minutes * 6e4 : 0

  return (
    <>
      <NavBar title={t('Train')} />
      <Page>
        <Header title={t('Train')} />

        <div className="group mt-4" style={{ '--inset': '56px' }}>
          {active ? (
            <button onClick={() => onOpenMock(active.id)} className="row">
              <IconBadge color="var(--indigo)">
                <TimerIcon className="h-4 w-4" />
              </IconBadge>
              <span className="min-w-0 flex-1">
                <span className="body block">{active.handedAt || now >= end ? t('Mark your mock') : t('Mock in progress')}</span>
                <span className="footnote block tabular-nums">{active.handedAt ? active.label : now >= end ? `${active.label} · ${t('time’s up')}` : `${active.label} · ${t('{time} left', { time: formatTime(end - now) })}`}</span>
              </span>
              <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
            </button>
          ) : (
            <button onClick={onMockStart} disabled={!BANK.length} className="row">
              <IconBadge color="var(--indigo)">
                <TimerIcon className="h-4 w-4" />
              </IconBadge>
              <span className="min-w-0 flex-1">
                <span className="body block">{t('Exam simulator')}</span>
                <span className="footnote block">{t('4 problems · 4 hours · out of 32')}</span>
              </span>
              <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
            </button>
          )}
          <button onClick={onToolbox} className="row">
            <IconBadge color="var(--label-2)">
              <ToolboxIcon className="h-4 w-4" />
            </IconBadge>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Toolbox')}</span>
              <span className="footnote block">{TOOLS.length ? tn(TOOLS.length, '{n} theorem or trick', '{n} theorems and tricks') : t('Theorems and tricks')}</span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
        </div>

        {done.length > 0 && (
          <>
            <SectionHeader>{t('Mock history')}</SectionHeader>
            <div className="group">
              {done
                .slice()
                .reverse()
                .slice(0, 5)
                .map((m) => {
                  const total = mockTotal(m)
                  return (
                    <button key={m.id} onClick={() => onOpenMock(m.id)} className="row">
                      <span className="min-w-0 flex-1">
                        <span className="body block truncate">{m.kind === 'mixed' ? t('Mixed paper') : m.label}</span>
                        <span className="footnote block">{fmtDate(m.startedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </span>
                      <span className="headline tabular-nums" style={{ color: total >= target ? 'var(--green)' : 'var(--orange)' }}>
                        {total}/32
                      </span>
                      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                    </button>
                  )
                })}
            </div>
          </>
        )}

        {due.length > 0 && (
          <>
            <SectionHeader>{t('Try again today')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {due.map((p) => (
                <BankRow key={p.id} p={p} entry={bank[p.id]} sub={`${bankTitle(p)} · ${t('best {n}/8', { n: bankBest(bank[p.id]) })}`} onOpen={onOpenBank} />
              ))}
            </div>
          </>
        )}

        <SectionHeader>{t('Past problems')}</SectionHeader>
        <SearchField value={filters.q} onChange={set('q')} placeholder={t('Search problems and techniques')} />
        <Segmented className="mt-3" value={filters.area} onChange={set('area')} options={[['all', t('All')], ...AREA_ORDER.map((a) => [a, AREA_SHORT[a]])]} label={t('Area')} />
        <Segmented className="mt-2" value={filters.status} onChange={set('status')} options={[['all', t('Any')], ['new', t('New')], ['tried', t('Tried')], ['solved', t('Solved')], ['full', '8/8']]} label={t('Status')} />
        <div className="group mt-3">
          <PickerRow label={t('Year')} value={filters.year} onChange={set('year')} options={[['all', t('All years')], ...YEARS.map((y) => [y, String(y)])]} />
          <PickerRow label={t('Technique')} value={filters.tech} onChange={set('tech')} options={[['all', t('All')], ...TECHNIQUES.map((x) => [x, x])]} />
        </div>
        <div className="mt-1 flex min-h-[44px] items-center justify-between px-4">
          <p className="footnote tabular-nums">{t('{shown} of {all} · {tried} tried, {solved} solved', { shown: list.length, all: BANK.length, ...counts })}</p>
          {filtered && (
            <button onClick={() => setFilters(EMPTY_FILTERS)} className="link flex h-11 items-center text-[15px]">
              {t('Clear filters')}
            </button>
          )}
        </div>
        {byYear.length === 0 && (
          <div className="card mt-1 p-4">
            <p className="subhead secondary">{t('No problems match these filters.')}</p>
          </div>
        )}
        {byYear.map(([y, ps]) => (
          <div key={y}>
            <SectionHeader>GWF {y}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {ps.map((p) => (
                <BankRow key={p.id} p={p} entry={bank[p.id]} sub={`${t('Aufgabe')} ${p.n} · ${AREAS[p.area].name}`} onOpen={onOpenBank} results={state.results} />
              ))}
            </div>
          </div>
        ))}
      </Page>
    </>
  )
}

/* ---------- Marking ---------- */

// Hand in photos or text for the AI marker, or mark it yourself with the marking scheme.
// practice: self-marking opens only once there is something to mark (a photo or a few lines).
export function MarkPanel({ p, ai, onGrade, title, handInLabel, practice = true, draftKey }) {
  const [photos, setPhotos] = useState([])
  const [text, setText] = useDraft(draftKey)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [self, setSelf] = useState(false)

  const check = async () => {
    setBusy(true)
    setError('')
    try {
      const sent = photos
      const grade = await gradeProof(aiProblem(p), { photos: sent, text })
      setText('')
      onGrade({ ...grade, source: 'ai' }, sent)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  const selfScore = (g) => {
    setText('')
    onGrade(g, [])
  }
  if (self && p.rubric.length) return <StepCheck steps={p.rubric} solution={p.solution} onCancel={() => setSelf(false)} onScore={selfScore} />
  if (self) return <PointsSelf solution={p.solution} onCancel={() => setSelf(false)} onScore={selfScore} />

  const outOfMarks = ai.mode === 'hosted' && ai.marksLeft === 0
  const canSelf = !practice || photos.length > 0 || text.trim().length >= SELF_MIN_CHARS
  return (
    <>
      <div className="card p-4">
        <p className="headline mb-3">{title || t('Your solution')}</p>
        <PhotoStrip photos={photos} setPhotos={setPhotos} disabled={busy} onError={setError} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          rows={4}
          aria-label={t('Your solution')}
          placeholder={t('…or type it here')}
          className="mt-3 w-full resize-y rounded-xl p-3 text-[17px] leading-[23px] outline-none placeholder:text-[var(--label-2)]"
          style={{ background: 'var(--fill)', color: 'var(--label)' }}
        />
      </div>
      {error && (
        <p className="footnote mt-2 px-1" style={{ color: 'var(--red)' }} role="alert">
          {error}
        </p>
      )}
      {ai.mode !== 'none' && (
        <button onClick={check} disabled={busy || outOfMarks || (!photos.length && !text.trim())} className="btn btn-filled mt-4 w-full">
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" /> {t('Marking like the jury…')}
            </>
          ) : outOfMarks ? (
            t('No marks left today')
          ) : (
            handInLabel || t('Mark My Solution')
          )}
        </button>
      )}
      {!busy && (
        <button onClick={() => setSelf(true)} disabled={!canSelf} className={`btn mt-3 w-full ${ai.mode !== 'none' && !outOfMarks ? 'btn-gray' : 'btn-filled'}`}>
          {t('Mark It Myself')}
        </button>
      )}
      {ai.mode === 'hosted' && ai.marksLeft != null && <p className="footnote mt-2 text-center tabular-nums">{tn(ai.marksLeft, '{n} AI mark left today', '{n} AI marks left today')}</p>}
    </>
  )
}

export function SolutionCard({ p, onOpenTool }) {
  const tools = toolsForProblem(p)
  return (
    <>
      <div className="card fade-in p-4">
        {p.answer && (
          <>
            <p className="footnote mb-1 font-semibold uppercase">{t('Answer')}</p>
            <Rich text={p.answer} className="body mb-4" />
          </>
        )}
        <p className="footnote mb-1 font-semibold uppercase">{t('Solution')}</p>
        <Rich text={p.solution || '–'} />
      </div>
      {p.pitfalls.length > 0 && (
        <>
          <SectionHeader>{t('Where people lose points')}</SectionHeader>
          <div className="group">
            {p.pitfalls.map((s, i) => (
              <div key={i} className="row items-start">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--orange)' }} />
                <Rich as="span" text={s} className="callout" />
              </div>
            ))}
          </div>
        </>
      )}
      {p.rubric.length > 0 && (
        <>
          <SectionHeader>{t('Marking scheme')}</SectionHeader>
          <div className="group">
            {p.rubric.map(([s, pts], i) => (
              <div key={i} className="row items-start">
                <Rich as="span" text={s} className="callout flex-1" />
                <span className="subhead secondary shrink-0 tabular-nums">{t('{n} P', { n: pts })}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {(tools.length > 0 || p.techniques.length > 0) && (
        <>
          <SectionHeader>{t('Techniques')}</SectionHeader>
          <div className="group">
            {tools.map((x) => (
              <button key={x.id} onClick={() => onOpenTool(x.id)} className="row">
                <span className="min-w-0 flex-1">
                  <span className="body block truncate">{x.name}</span>
                  {x.nameDe && (
                    <span className="footnote block truncate" lang="de">
                      {x.nameDe}
                    </span>
                  )}
                </span>
                <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
              </button>
            ))}
            {tools.length === 0 && (
              <div className="row">
                <span className="callout">{p.techniques.join(' · ')}</span>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

/* ---------- A past problem ---------- */

export function BankScreen({ p, entry = {}, results, ai, backLabel, onBack, onCoach, onAttempt, onTimer, onMistake, onOpenTool }) {
  const [lang, setLang] = useState('de')
  const [hintsUsed, setHintsUsed] = useState(0)
  const [just, setJust] = useState(null)
  const [justPhotos, setJustPhotos] = useState([])
  const [reveal, setReveal] = useState(false)
  const [mistake, setMistake] = useState(null)
  const [openAnyway, setOpenAnyway] = useState(false)
  const now = useNow(!!entry.timerAt)
  const attempts = entry.attempts || []
  const hints = p.hints.map((h, i) => [['Nudge', 'Key idea', 'First step'][i] || 'Hint', h])
  const elapsed = entry.timerAt ? now - entry.timerAt : 0
  const reserved = !attempts.length && !openAnyway ? reservedFor(p.year, results) : null

  const grade = (g, photos) => {
    const attempt = { ...g, at: Date.now(), hints: hintsUsed, secs: entry.timerAt ? Math.round((Date.now() - entry.timerAt) / 1000) : null }
    onAttempt(attempt)
    setJust(attempt)
    setJustPhotos(photos || [])
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }
  const again = () => {
    setJust(null)
    setJustPhotos([])
    setReveal(false)
    setHintsUsed(0)
    setMistake(null)
  }

  const nav = (
    <NavBar
      title={bankTitle(p)}
      alwaysTitle
      wide
      left={<BackButton onClick={onBack} label={backLabel} />}
      right={
        ai.mode !== 'none' &&
        !reserved && (
          <button onClick={() => onCoach(aiProblem(p), just)} className="link flex h-11 items-center gap-1.5 active:opacity-50">
            <ChatIcon className="h-[20px] w-[20px]" /> {t('Ask')}
          </button>
        )
      }
    />
  )

  if (reserved)
    return (
      <>
        {nav}
        <Page className="pt-2">
          <p className="footnote font-semibold" style={{ color: areaColor(bankArea(p)) }}>
            {t('Aufgabe')} {p.n} · {AREAS[p.area].name}
          </p>
          <h1 className="title2 mt-1">{p.title || bankTitle(p)}</h1>
          <div className="card mt-5 p-5 text-center">
            <p className="title3">{t('Saved for day {n}', { n: reserved.day })}</p>
            <p className="subhead secondary mt-1">{reserved.topic.startsWith('Probewettbewerb') ? `${reserved.topic} · GWF ${p.year}` : `GWF ${p.year}`}</p>
            <button onClick={() => setOpenAnyway(true)} className="btn btn-gray mt-5 w-full">
              {t('Open Anyway')}
            </button>
          </div>
        </Page>
      </>
    )

  const statement = (
    <>
      <p className="footnote flex items-center gap-2 font-semibold" style={{ color: areaColor(bankArea(p)) }}>
        <span>
          {t('Aufgabe')} {p.n} · {AREAS[p.area].name}
        </span>
        <Difficulty n={p.difficulty} />
      </p>
      <h1 className="title2 mt-1">{p.title || bankTitle(p)}</h1>
      <div className="mt-3 flex items-center justify-between gap-3">
        <LangToggle lang={lang} setLang={setLang} />
        {attempts.length > 0 && <span className="footnote text-right tabular-nums">{t('Best {n}/8 · {k}×', { n: bankBest(entry), k: attempts.length })}</span>}
      </div>
      <div className="card mt-3 p-5" lang={lang}>
        <Rich text={problemText(p, lang)} />
      </div>
      {!just && (
        <div onClickCapture={(e) => e.target.closest('button') && setHintsUsed((n) => n + 1)}>
          <Hints key={attempts.length} hints={hints} />
        </div>
      )}
    </>
  )

  return (
    <>
      {nav}
      <Page className="pt-2" wide>
        <Split statement={statement}>
          {just ? (
            <div className="mt-6 lg:mt-0">
              <GradeCard grade={just} photos={justPhotos} />
              {just.secs != null && (
                <p className="footnote mt-2 px-1 tabular-nums">
                  {t('Time')}: {formatTime(just.secs * 1000)}
                  {just.hints ? ` · ${tn(just.hints, '{n} hint', '{n} hints')}` : ''}
                </p>
              )}
              {just.score < MAX_POINTS && (
                <div className="card fade-in mt-4 p-4">
                  <MistakePicker
                    value={mistake}
                    onPick={(r) => {
                      setMistake(r)
                      onMistake(r)
                    }}
                  />
                </div>
              )}
              <button onClick={again} className="btn btn-tinted mt-5 w-full">
                {t('Try Again')}
              </button>
              <div className="mt-6">
                <SolutionCard p={p} onOpenTool={onOpenTool} />
              </div>
            </div>
          ) : (
            <div className="mt-4 lg:mt-0">
              <div className="group">
                {entry.timerAt ? (
                  <div className="row">
                    <span style={{ color: elapsed > PER_PROBLEM_MIN * 6e4 ? 'var(--red)' : 'var(--indigo)' }}>
                      <TimerIcon className="h-5 w-5 shrink-0" />
                    </span>
                    <span className="headline flex-1 tabular-nums" style={{ color: elapsed > PER_PROBLEM_MIN * 6e4 ? 'var(--red)' : 'var(--label)' }}>
                      {formatTime(elapsed)} <span className="footnote font-normal">/ 1:00:00</span>
                    </span>
                    <button onClick={() => onTimer(false)} className="link flex h-11 items-center px-1 text-[15px]">
                      {t('Stop')}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => onTimer(true)} className="row">
                    <TimerIcon className="h-5 w-5 shrink-0 text-[var(--link)]" />
                    <span className="body flex-1" style={{ color: 'var(--link)' }}>
                      {t('Start a timer')}
                    </span>
                    <span className="footnote">{t('{n} min', { n: PER_PROBLEM_MIN })}</span>
                  </button>
                )}
              </div>

              {attempts.length > 0 && (
                <p className="footnote mt-4 px-1">
                  {t('Earlier')}: {attempts.map((a) => `${a.score}/8${a.mock ? ` (${t('mock')})` : ''}`).join(' · ')}
                </p>
              )}

              <div className="mt-4">
                <MarkPanel p={p} ai={ai} onGrade={grade} draftKey={`bank:${p.id}`} />
              </div>

              <div className="mt-6">
                {reveal ? (
                  <SolutionCard p={p} onOpenTool={onOpenTool} />
                ) : (
                  <button onClick={() => setReveal(true)} className="link flex h-11 items-center px-1 text-[15px] active:opacity-50">
                    {attempts.length ? t('See the solution') : t('I give up, show the solution')}
                  </button>
                )}
              </div>
            </div>
          )}
        </Split>
      </Page>
    </>
  )
}
