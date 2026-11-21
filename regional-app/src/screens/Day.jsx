import { useState } from 'react'
import { AREAS, PAPERS, PLAN, paperLinks } from '../plan'
import { getDay } from '../content'
import { TOOLS } from '../data'
import { MAX_POINTS } from '../ai'
import { t, tn } from '../i18n'
import { CHALLENGE_MASTER, PROOF_PASS, TRIES, bestScore, currentProblem, partStatus } from '../logic'
import { AreaBadge, BackButton, ChatIcon, ChevronIcon, Done, NavBar, Page, PartRow, Rich, STATUS, SectionHeader, areaColor, dayLabel, daySub, dayTitle, formatTime, statusLabel, useNow } from '../ui'

function Lesson({ lesson }) {
  const [showExample, setShowExample] = useState(false)
  return (
    <>
      <SectionHeader>{t('The idea')}</SectionHeader>
      <div className="card p-4">
        <Rich text={lesson.idea} className="body leading-[24px]" />
      </div>
      <SectionHeader>{t('How to use it')}</SectionHeader>
      <div className="group" style={{ '--inset': '52px' }}>
        {lesson.steps.map((s, i) => (
          <div key={i} className="row items-start">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: 'var(--tint)', color: 'var(--link)' }}>
              {i + 1}
            </span>
            <Rich as="span" text={s} className="body" />
          </div>
        ))}
      </div>
      <SectionHeader>{t('Example')}</SectionHeader>
      <div className="card overflow-hidden">
        <Rich text={lesson.example.q} className="problem p-4" />
        {showExample ? (
          <Rich text={lesson.example.a} className="fade-in problem secondary px-4 pb-4" />
        ) : (
          <button onClick={() => setShowExample(true)} className="row link" style={{ borderTop: '0.5px solid var(--sep)' }}>
            {t('Show solution')}
          </button>
        )}
      </div>
      {lesson.de && (
        <>
          <SectionHeader>{t('On the German paper')}</SectionHeader>
          <div className="card grid grid-cols-2 gap-x-4 gap-y-2 p-4">
            {lesson.de.map(([de, en]) => (
              <div key={de}>
                <p className="subhead font-semibold" lang="de">
                  {de}
                </p>
                <p className="caption" lang="en">
                  {en}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function DayHeader({ d, result, backLabel, onBack, children }) {
  return (
    <>
      <NavBar title={dayTitle(d)} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <div className="flex items-center gap-2">
          <span className="rounded-full px-2.5 py-0.5 text-[13px] font-semibold text-white" style={{ background: areaColor(d) }}>
            {dayLabel(d)}
          </span>
          <span className="footnote">
            {t('Day {n}', { n: d.day })} · {d.phase.name}
          </span>
        </div>
        <h1 className="large-title mt-1 break-words" lang="de">
          {dayTitle(d)}
        </h1>
        {daySub(d) && (
          <p className="subhead secondary mt-1" lang={d.kind === 'paper' ? undefined : 'de'}>
            {daySub(d)}
          </p>
        )}
        {result && (
          <p className="headline mt-2" style={{ color: STATUS[result.status].color }}>
            {statusLabel(result.status)}
            {result.score ? ` · ${t('{score} points', { score: result.score })}` : ''}
          </p>
        )}
        {children}
      </Page>
    </>
  )
}

export function DayScreen({ d, state, getWork, current, today, ai, backLabel, onBack, onPart, onOpenDay, onStartPaper, onMarkDone, onCoach, onToolbox }) {
  const result = state.results[d.index]
  // Every day is open: any day you haven't finished can be worked on now
  const isCurrent = d.index === current || !result
  const [showLesson, setShowLesson] = useState(() => !Object.keys(state.work).some((key) => key.startsWith(`${d.index}:p`)))
  const { content } = d
  const header = { d, result, backLabel, onBack }

  if (d.kind === 'paper')
    return (
      <DayHeader {...header}>
        <PaperBody d={d} state={state} getWork={getWork} isCurrent={isCurrent} onPart={onPart} onStart={onStartPaper} />
      </DayHeader>
    )
  if (d.kind === 'task' || !content)
    return (
      <DayHeader {...header}>
        <TaskBody d={d} state={state} result={result} isCurrent={isCurrent} ai={ai} onMarkDone={onMarkDone} onCoach={onCoach} onOpenDay={onOpenDay} onToolbox={onToolbox} />
      </DayHeader>
    )

  return (
    <DayHeader {...header}>
      {content.lesson &&
        (showLesson ? (
          <Lesson lesson={content.lesson} />
        ) : (
          <button onClick={() => setShowLesson(true)} className="link mt-2 flex h-11 items-center text-[15px]">
            {t('Show the lesson')}
          </button>
        ))}

      <SectionHeader>{result ? t('Problems') : t('Solve all 3 to pass')}</SectionHeader>
      <div className="group">
        {content.problems.map((_, i) => {
          const entry = getWork(d.index, `p${i}`)
          const p = currentProblem(d.index, `p${i}`, entry)
          const status = partStatus(p, entry, today)
          const sub =
            status === 'failed'
              ? t('Out of tries · open it for a new problem')
              : `${entry.swaps?.length ? `${t('New problem')} · ` : ''}${p.type === 'answer' ? tn(TRIES, 'Find the answer · {n} try', 'Find the answer · {n} tries') : t('Proof · {n}/8 to pass', { n: PROOF_PASS })}`
          return <PartRow key={i} label={t('Problem {n}', { n: i + 1 })} sub={sub} status={status} score={p.type === 'proof' ? bestScore(entry) : -1} onClick={() => onPart(d.index, `p${i}`)} />
        })}
      </div>

      {content.challenge && (
        <>
          <SectionHeader>{t('Challenge')}</SectionHeader>
          <div className="group">
            <PartRow
              label={content.challenge.source}
              sub={result ? t('A harder proof · {n}/8 masters the day', { n: CHALLENGE_MASTER }) : t('Unlocks when you pass')}
              color="var(--purple)"
              status={result?.status === 'mastered' ? 'ok' : 'open'}
              score={bestScore(getWork(d.index, 'c'))}
              disabled={!result}
              onClick={() => onPart(d.index, 'c')}
            />
          </div>
        </>
      )}
    </DayHeader>
  )
}

// What to do on days without problems in the app
export function taskSteps(d) {
  const text = d.items.join(' ').toLowerCase()
  if (d.redo) return [t('Pick the past paper with your lowest score (see Progress).'), t('Sit it again, 4 hours, without looking at your old solutions.'), t('Compare: which mistakes are gone, which are still there? Add them to your Fehlerheft.')]
  if (text.includes('pause')) return [t('No maths today. Rest is part of the plan.'), t('Pack compass, ruler, set square (Geodreieck), pens and a watch.'), t('Go to bed early.')]
  if (text.includes('nachbesprechung') || text.includes('fehleranalyse'))
    return [t('Read the official solutions of the last paper problem by problem.'), t('For every lost point, write one line in your Fehlerheft: what went wrong and what to do next time.'), t('Rewrite your weakest solution cleanly, as you would hand it in.')]
  if (text.includes('formelblatt')) return [t('Go through the toolbox for this area below. Cover each statement and say it out loud.'), t('Write a one-page sheet of the facts you didn’t know by heart, each with one tiny example.'), t('Read it again the evening before the competition.')]
  if (text.includes('fehlerheft')) return [t('Go through your whole Fehlerheft.'), t('Group the mistakes: careless, missing case, unproven claim, wrong idea.'), t('Write your 5 personal rules for the competition.')]
  if (text.includes('aufwärm')) return [t('Solve 4 easy problems from early in the plan, quickly and cleanly.'), t('Plan your 4 hours: read all problems first, start with the one you like most.'), t('Decide when you will switch problems if you are stuck.')]
  if (text.includes('schwächst')) return [t('Look at your Fehlerheft and Progress: which area loses the most points?'), t('Redo the proofs from earlier days in that area (below).'), t('Try 2 past problems in that area in Train.')]
  return [t('Redo the proofs from earlier days on these topics (below), without looking at your old work.'), t('If one is hard again, use a hint instead of reading the solution.'), t('Note anything you had forgotten in your Fehlerheft.')]
}

// Which areas of the toolbox a task day is about, e.g. "Formelblatt Zahlentheorie, Kombinatorik"
function taskAreas(d) {
  if (d.kind !== 'task') return []
  const text = d.items.join(' ')
  const found = [['A', /Ungleichung|Identit|Algebra|AM-GM|Polynom|Vieta|Rekursion|Teleskop/], ['G', /Geometrie|Sehnenviereck|Südpol|Ankreis|Winkel/], ['K', /Kombinatorik|Schubfach|Invariant|Färbung|Spiele/], ['N', /Zahlentheorie|Teilbarkeit|Kongruenz|Fermat|Legendre|Diophant/]]
    .filter(([, re]) => re.test(text))
    .map(([a]) => a)
  return [...new Set([...(d.area !== 'X' ? [d.area] : []), ...found])]
}

function TaskBody({ d, state, result, isCurrent, ai, onMarkDone, onCoach, onOpenDay, onToolbox }) {
  const toolAreas = taskAreas(d).filter((a) => TOOLS.some((x) => x.area === a) || TOOLS.length === 0)
  const formelblatt = /formelblatt/i.test(d.items.join(' '))
  const steps = taskSteps(d)
  const reviewArea = d.kind === 'task' && d.area !== 'X' ? d.area : d.items[0].includes('Kombinatorik') ? 'K' : d.items[0].includes('Zahlentheorie') ? 'N' : d.items[0].includes('Geometrie') ? 'G' : null
  const earlier = reviewArea ? PLAN.filter((p) => p.index < d.index && p.kind === 'learn' && p.area === reviewArea && getDay(p.index).content).slice(-6) : []

  return (
    <>
      <SectionHeader>{t('Today')}</SectionHeader>
      <div className="group" style={{ '--inset': '52px' }}>
        {steps.map((s, i) => (
          <div key={i} className="row items-start">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: 'var(--tint)', color: 'var(--link)' }}>
              {i + 1}
            </span>
            <span className="callout">{s}</span>
          </div>
        ))}
      </div>

      {toolAreas.length > 0 && (
        <>
          <SectionHeader>{formelblatt ? t('Your Formelblatt') : t('Toolbox')}</SectionHeader>
          <div className="group" style={{ '--inset': '60px' }}>
            {toolAreas.map((a) => (
              <button key={a} onClick={() => onToolbox(a)} className="row">
                <AreaBadge d={{ kind: 'learn', area: a }} small />
                <span className="min-w-0 flex-1">
                  <span className="body block">{AREAS[a].name}</span>
                  {TOOLS.length > 0 && <span className="footnote block">{tn(TOOLS.filter((x) => x.area === a).length, '{n} theorem or trick', '{n} theorems and tricks')}</span>}
                </span>
                <ChevronIcon className="h-4 w-4 text-[var(--tertiary)]" />
              </button>
            ))}
          </div>
        </>
      )}

      {earlier.length > 0 && (
        <>
          <SectionHeader>{t('Redo these days')}</SectionHeader>
          <div className="group" style={{ '--inset': '60px' }}>
            {earlier.map((p) => (
              <button key={p.index} onClick={() => onOpenDay(p.index)} className="row">
                <AreaBadge d={p} small />
                <span className="min-w-0 flex-1">
                  <span className="body block truncate" lang="de">
                    {dayTitle(p)}
                  </span>
                  <span className="footnote block">{t('Day {n}', { n: p.day })}</span>
                </span>
                {state.results[p.index] && <Done status={state.results[p.index].status} small />}
                <ChevronIcon className="h-4 w-4 text-[var(--tertiary)]" />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 grid gap-3">
        {ai.mode !== 'none' && (
          <button onClick={() => onCoach({ title: dayTitle(d), items: d.items.slice(1) })} className="btn btn-tinted">
            <ChatIcon className="h-5 w-5" /> {t('Ask the Coach')}
          </button>
        )}
        {!result && (
          <button onClick={onMarkDone} disabled={!isCurrent} className="btn btn-filled">
            {t('Mark Day {n} as Done', { n: d.day })}
          </button>
        )}
      </div>
    </>
  )
}

function PaperBody({ d, state, getWork, isCurrent, onPart, onStart }) {
  const timer = getWork(d.index, 'paper')
  const now = useNow(!!timer.startedAt && !state.results[d.index])
  const result = state.results[d.index]
  const { minutes, name } = PAPERS[d.paper[0]]
  const links = paperLinks(d.paper)
  const left = timer.startedAt ? timer.startedAt + minutes * 6e4 - now : null
  const scores = [0, 1, 2, 3].map((i) => bestScore(getWork(d.index, `p${i}`)))
  const started = !!timer.startedAt || !!result

  return (
    <>
      <div className="group mt-5">
        <a href={links.problems} target="_blank" rel="noreferrer" className="row">
          <span className="min-w-0 flex-1">
            <span className="body block" style={{ color: 'var(--link)' }}>
              {t('Open the paper (PDF)')}
            </span>
            <span className="footnote block">
              {t(name)} {d.paper[1]} · {t('official ÖMO archive')}
            </span>
          </span>
          <ChevronIcon className="h-4 w-4 text-[var(--tertiary)]" />
        </a>
        {(result || (left != null && left <= 0)) && (
          <a href={links.solutions} target="_blank" rel="noreferrer" className="row">
            <span className="body flex-1" style={{ color: 'var(--link)' }}>
              {t('Official solutions (PDF)')}
            </span>
            <ChevronIcon className="h-4 w-4 text-[var(--tertiary)]" />
          </a>
        )}
      </div>

      {!started ? (
        <>
          <div className="card mt-4 p-5 text-center">
            <p className="title1 tabular-nums">{formatTime(minutes * 6e4)}</p>
            <p className="subhead secondary mt-1">{t('4 problems · {n} points each', { n: MAX_POINTS })}</p>
          </div>
          <button onClick={onStart} disabled={!isCurrent} className="btn btn-filled mt-5 w-full">
            {t('Start the Clock')}
          </button>
        </>
      ) : (
        <>
          {!result && (
            <div className="card mt-4 flex items-center justify-between p-4">
              <span className="body">{left > 0 ? t('Time left') : t('Time’s up · mark your paper')}</span>
              <span className="title2 tabular-nums" style={{ color: left > 0 ? 'var(--label)' : 'var(--red)' }}>
                {formatTime(left > 0 ? left : 0)}
              </span>
            </div>
          )}
          <SectionHeader>{t('Hand in')}</SectionHeader>
          <div className="group">
            {scores.map((sc, i) => (
              <PartRow key={i} label={t('Problem {n}', { n: i + 1 })} sub={sc >= 0 ? t('Marked') : t('Not handed in yet')} status={null} score={sc} onClick={() => onPart(d.index, `p${i}`)} />
            ))}
          </div>
        </>
      )}
    </>
  )
}
