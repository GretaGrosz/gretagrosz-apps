import { useState } from 'react'
import { AREAS, AREA_ORDER, PLAN } from '../plan'
import { MAX_POINTS } from '../ai'
import { BANK, BANK_BY_ID, FULL_YEARS, aiProblem, bankArea, bankStatus, mockFinished, mockScores, mockTotal, paperOf } from '../data'
import { fmtDate, fmtTime, t } from '../i18n'
import { AreaBadge, BackButton, ChatIcon, CheckIcon, ChevronIcon, GradeCard, LangToggle, MistakePicker, NavBar, Page, Rich, Ring, SectionHeader, Sheet, Split, areaColor, formatTime, useNow } from '../ui'
import { MarkPanel, SolutionCard, problemText, reservedFor } from './Train'

export const MOCK_MINUTES = 240

// How precious a year is to the plan: papers whose day is done are free, Altaufgaben days next, the Generalprobe last
function planCost(year, results) {
  const d = PLAN.find((x) => x.kind === 'paper' && x.paper[0] === 'GWF' && x.paper[1] === year)
  if (!d || results[d.index]) return 0
  return d.day >= 136 ? 2 : 1
}

// One problem per area, in the order of the real paper. New problems first, never one from an earlier mock,
// and papers the plan still needs come last.
export function pickMixed(state) {
  const used = new Set((state.mocks || []).flatMap((m) => m.ids))
  return AREA_ORDER.map((a) => {
    const all = BANK.filter((p) => p.area === a)
    const fresh = all.filter((p) => !used.has(p.id) && bankStatus(state.bank?.[p.id]) === 'new')
    const unused = all.filter((p) => !used.has(p.id))
    const pool = [fresh, unused, all].find((x) => x.length) || []
    if (!pool.length) return null
    const cheapest = Math.min(...pool.map((p) => planCost(p.year, state.results)))
    const best = pool.filter((p) => planCost(p.year, state.results) === cheapest)
    return best[Math.floor(Math.random() * best.length)].id
  }).filter(Boolean)
}

export const newMock = (state, choice) => {
  const ids = choice === 'mixed' ? pickMixed(state) : paperOf(Number(choice)).map((p) => p.id)
  return { id: Date.now(), kind: choice === 'mixed' ? 'mixed' : 'year', label: choice === 'mixed' ? 'Mixed paper' : `GWF ${choice}`, ids, startedAt: Date.now(), minutes: MOCK_MINUTES, work: {} }
}
export const mockLabel = (m) => (m.kind === 'mixed' ? t('Mixed paper') : m.label)

const RULES = ['Read all four problems first, then start with the one you like most.', 'Paper, pen, compass, ruler and set square. No calculator, no notes.', 'Prove every claim. For inequalities, say when equality holds.']

export function MockStartScreen({ state, onBack, onStart, backLabel }) {
  const [choice, setChoice] = useState('mixed')
  const bank = state.bank || {}
  const mocks = state.mocks || []
  const yearNote = (y) => {
    const m = mocks.filter((x) => x.label === `GWF ${y}` && mockFinished(x)).pop()
    if (m) return t('Mock done · {n}/32', { n: mockTotal(m) })
    const r = reservedFor(y, state.results)
    const seen = paperOf(y).filter((p) => bankStatus(bank[p.id]) !== 'new').length
    if (r) return seen ? t('Day {d} · {n} of 4 practised', { d: r.day, n: seen }) : t('Saved for day {n}', { n: r.day })
    return seen ? t('{n} of 4 practised', { n: seen }) : t('Not seen yet')
  }
  const reserved = choice !== 'mixed' ? reservedFor(Number(choice), state.results) : null
  return (
    <>
      <NavBar title={t('Exam simulator')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <h1 className="large-title mt-1">{t('Set Up a Mock')}</h1>

        <SectionHeader>{t('Paper')}</SectionHeader>
        <div className="group">
          <button onClick={() => setChoice('mixed')} className="row" aria-pressed={choice === 'mixed'}>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('Mixed paper')}</span>
              <span className="footnote block">{t('One new problem per area')}</span>
            </span>
            {choice === 'mixed' && <CheckIcon className="h-5 w-5 text-[var(--link)]" />}
          </button>
          {FULL_YEARS.map((y) => (
            <button key={y} onClick={() => setChoice(String(y))} className="row" aria-pressed={choice === String(y)}>
              <span className="min-w-0 flex-1">
                <span className="body block">GWF {y}</span>
                <span className="footnote block">{yearNote(y)}</span>
              </span>
              {choice === String(y) && <CheckIcon className="h-5 w-5 text-[var(--link)]" />}
            </button>
          ))}
        </div>

        <SectionHeader>{t('Rules')}</SectionHeader>
        <div className="group" style={{ '--inset': '52px' }}>
          {RULES.map((r, i) => (
            <div key={i} className="row items-start">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: 'var(--tint)', color: 'var(--link)' }}>
                {i + 1}
              </span>
              <span className="callout">{t(r)}</span>
            </div>
          ))}
        </div>

        <div className="card mt-5 p-5 text-center">
          <p className="title1 tabular-nums">{formatTime(MOCK_MINUTES * 6e4)}</p>
        </div>
        <button onClick={() => onStart(choice)} className="btn btn-filled mt-5 w-full">
          {reserved ? t('Start Anyway') : t('Start the Clock')}
        </button>
        {reserved && <p className="footnote mt-2 text-center">{t('GWF {y} is saved for day {n}.', { y: choice, n: reserved.day })}</p>}
      </Page>
    </>
  )
}

export function MockScreen({ mock, target, backLabel, onBack, onPart, onHandIn, onCancel }) {
  const now = useNow(!mock.handedAt)
  const [sheet, setSheet] = useState(null) // 'handin' | 'cancel'
  const scores = mockScores(mock)
  const finished = mockFinished(mock)
  const total = mockTotal(mock)
  const end = mock.startedAt + mock.minutes * 6e4
  const left = end - now
  const handed = !!mock.handedAt || left <= 0
  const used = (mock.handedAt || Math.min(now, end)) - mock.startedAt
  const problems = mock.ids.map((id) => BANK_BY_ID[id]).filter(Boolean)
  const label = mockLabel(mock)

  return (
    <>
      <NavBar title={label} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <p className="footnote font-semibold" style={{ color: 'var(--indigo)' }}>
          {finished ? t('Result') : handed ? t('Handed in · mark it') : t('Exam in progress')}
        </p>
        <h1 className="large-title mt-1">{label}</h1>
        <p className="subhead secondary mt-1">{fmtDate(mock.startedAt, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

        {finished ? (
          <div className="card pop mt-5 flex items-center gap-5 p-5">
            <Ring value={total / 32} size={110} stroke={12} color={total >= target ? 'var(--green)' : 'var(--orange)'} label={`${total}/32`}>
              <span className="title2 tabular-nums leading-none">{total}</span>
              <span className="caption">/32</span>
            </Ring>
            <div className="min-w-0 flex-1">
              <p className="headline">{total >= target ? t('Target reached') : t('{n} below your target', { n: target - total })}</p>
              <p className="footnote mt-0.5 tabular-nums">
                {t('Target {n}', { n: target })} · {formatTime(Math.min(used, mock.minutes * 6e4))}
              </p>
            </div>
          </div>
        ) : !handed ? (
          <div className="card mt-5 p-5 text-center">
            <p className="title1 tabular-nums">{formatTime(Math.max(0, left))}</p>
            <p className="subhead secondary mt-1">{t('Ends at {time}', { time: fmtTime(end) })}</p>
          </div>
        ) : null}

        <SectionHeader>{handed ? t('Mark each problem') : t('The paper')}</SectionHeader>
        <div className="group" style={{ '--inset': '56px' }}>
          {problems.map((p, i) => (
            <button key={p.id} onClick={() => onPart(i)} className="row">
              <AreaBadge d={bankArea(p)} small />
              <span className="min-w-0 flex-1">
                <span className="body block">
                  {t('Aufgabe')} {i + 1}
                </span>
                <span className="footnote block truncate">{handed ? `${AREAS[p.area].name} · GWF ${p.year}/${p.n}${p.title ? ` · ${p.title}` : ''}` : AREAS[p.area].name}</span>
              </span>
              {handed &&
                (scores[i] >= 0 ? (
                  <span className="subhead secondary tabular-nums">{scores[i]}/8</span>
                ) : (
                  <span className="footnote font-semibold" style={{ color: 'var(--link)' }}>
                    {t('Mark')}
                  </span>
                ))}
              <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
            </button>
          ))}
        </div>

        {finished && (
          <>
            <SectionHeader>{t('Points by area')}</SectionHeader>
            <div className="group">
              {problems.map((p, i) => (
                <div key={p.id} className="row">
                  <span className="body w-[112px] shrink-0 truncate">{AREAS[p.area].name}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--fill)' }}>
                    <span className="bar-fill block h-full rounded-full" style={{ width: `${(Math.max(0, scores[i]) / MAX_POINTS) * 100}%`, background: AREAS[p.area].color }} />
                  </span>
                  <span className="subhead secondary w-10 text-right tabular-nums">{scores[i]}/8</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!handed && (
          <button onClick={() => setSheet('handin')} className="btn btn-filled mt-6 w-full">
            {t('Hand In')}
          </button>
        )}
        {!finished && (
          <button onClick={() => setSheet('cancel')} className="mt-4 flex h-11 w-full items-center justify-center text-[15px]" style={{ color: 'var(--red)' }}>
            {t('Cancel the Mock')}
          </button>
        )}
      </Page>

      {sheet === 'handin' && (
        <Sheet onClose={() => setSheet(null)} label={t('Hand in now?')}>
          <p className="title3 px-1">{t('Hand in now?')}</p>
          <p className="subhead secondary mb-4 mt-1 px-1 tabular-nums">{t('{time} left', { time: formatTime(Math.max(0, left)) })}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSheet(null)} className="btn btn-gray">
              {t('Keep Going')}
            </button>
            <button
              onClick={() => {
                setSheet(null)
                onHandIn()
              }}
              className="btn btn-filled"
            >
              {t('Hand In')}
            </button>
          </div>
        </Sheet>
      )}
      {sheet === 'cancel' && (
        <Sheet onClose={() => setSheet(null)} label={t('Cancel this mock?')}>
          <p className="title3 mb-4 px-1">{t('Cancel this mock?')}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setSheet(null)} className="btn btn-gray">
              {t('Keep It')}
            </button>
            <button
              onClick={() => {
                setSheet(null)
                onCancel()
              }}
              className="btn btn-destructive"
            >
              {t('Cancel Mock')}
            </button>
          </div>
        </Sheet>
      )}
    </>
  )
}

export function MockProblemScreen({ mock, i, ai, onBack, onNext, onGrade, onMistake, onCoach, onOpenTool }) {
  const p = BANK_BY_ID[mock.ids[i]]
  const [lang, setLang] = useState('de')
  const [photos, setPhotos] = useState([])
  const now = useNow(!mock.handedAt)
  const work = mock.work?.[i] || {}
  const grade = work.grades?.[work.grades.length - 1]
  const handed = !!mock.handedAt || now >= mock.startedAt + mock.minutes * 6e4
  const nextOpen = mock.ids.findIndex((_, k) => k !== i && !(mock.work?.[k]?.grades?.length))

  const statement = (
    <>
      <p className="footnote font-semibold" style={{ color: areaColor(bankArea(p)) }}>
        {mockLabel(mock)} · {t('Aufgabe')} {i + 1}
        {handed && mock.kind === 'mixed' ? ` · GWF ${p.year}/${p.n}` : ''}
      </p>
      <div className="mt-3">
        <LangToggle lang={lang} setLang={setLang} />
      </div>
      <div className="card mt-3 p-5" lang={lang}>
        <Rich text={problemText(p, lang)} />
      </div>
    </>
  )

  return (
    <>
      <NavBar
        title={`${t('Aufgabe')} ${i + 1}`}
        alwaysTitle
        wide
        left={<BackButton onClick={onBack} label={t('Paper')} />}
        right={
          grade &&
          ai.mode !== 'none' && (
            <button onClick={() => onCoach(aiProblem(p), grade)} className="link flex h-11 items-center gap-1.5 active:opacity-50">
              <ChatIcon className="h-[20px] w-[20px]" /> {t('Ask')}
            </button>
          )
        }
      />
      <Page className="pt-2" wide>
        <Split statement={statement}>
          {!handed && (
            <button onClick={onBack} className="btn btn-tinted mt-6 w-full lg:mt-0">
              {t('Back to the Paper')}
            </button>
          )}

          {handed && !grade && (
            <div className="mt-6 lg:mt-0">
              <MarkPanel
                p={p}
                ai={ai}
                practice={false}
                draftKey={`mock:${mock.id}:${i}`}
                onGrade={(g, sent) => {
                  setPhotos(sent || [])
                  onGrade(g)
                }}
                title={t('Hand in Aufgabe {n}', { n: i + 1 })}
                handInLabel={t('Hand In for Marking')}
              />
            </div>
          )}

          {grade && (
            <div className="mt-6 lg:mt-0">
              <GradeCard grade={grade} photos={photos} />
              {nextOpen >= 0 && (
                <button onClick={() => onNext(nextOpen)} className="btn btn-filled pop mt-4 w-full">
                  {t('Next: Aufgabe {n}', { n: nextOpen + 1 })}
                </button>
              )}
              {grade.score < MAX_POINTS && (
                <div className="card fade-in mt-4 p-4">
                  <MistakePicker value={work.mistake} onPick={onMistake} />
                </div>
              )}
              <div className="mt-6">
                <SolutionCard p={p} onOpenTool={onOpenTool} />
              </div>
            </div>
          )}
        </Split>
      </Page>
    </>
  )
}
