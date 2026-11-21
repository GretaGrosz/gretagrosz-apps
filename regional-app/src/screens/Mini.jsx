import { useEffect, useState } from 'react'
import { AREAS } from '../plan'
import { getDay } from '../content'
import { MAX_POINTS } from '../ai'
import { t } from '../i18n'
import { FRESH, MINI_MINUTES, PAPER_MASTER, PAPER_PASS, bestScore, miniEnd, partStatus, problemAt } from '../logic'
import { BackButton, NavBar, Page, PartRow, SectionHeader, dayTitle, formatTime, useNow } from '../ui'
import { ProblemScreen } from './Problem'

export function MiniScreen({ n, mini, onStart, onPart, onBack, backLabel }) {
  const refs = mini?.refs || []
  const scores = refs.map((_, i) => bestScore(mini?.work?.[i]))
  const finished = refs.length > 0 && scores.every((x) => x >= 0)
  const now = useNow(!!mini && !finished)
  const total = scores.reduce((a, b) => a + Math.max(0, b), 0)
  const max = refs.length * MAX_POINTS
  const left = mini ? miniEnd(mini) - now : null

  return (
    <>
      <NavBar title={t('Mini-mock {n}', { n })} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <h1 className="large-title mt-1">{t('Mini-mock {n}', { n })}</h1>
        {!mini ? (
          <>
            <div className="card mt-5 p-5 text-center">
              <p className="title1 tabular-nums">{formatTime(MINI_MINUTES * 6e4)}</p>
              <p className="subhead secondary mt-1">{t('One problem per area · {n} points each', { n: MAX_POINTS })}</p>
            </div>
            <button onClick={onStart} className="btn btn-filled mt-5 w-full">
              {t('Start the Clock')}
            </button>
          </>
        ) : refs.length === 0 ? (
          <div className="card mt-5 p-4">
            <p className="subhead secondary">{t('Pass a few more lesson days first.')}</p>
          </div>
        ) : (
          <>
            {finished ? (
              <div className="card pop mt-5 p-5 text-center">
                <p className="title1 tabular-nums">
                  {total}/{max}
                </p>
                <p className="subhead mt-1 font-semibold" style={{ color: total >= PAPER_MASTER * max ? 'var(--purple)' : total >= PAPER_PASS * max ? 'var(--green)' : 'var(--orange)' }}>
                  {total >= PAPER_MASTER * max ? t('Excellent') : total >= PAPER_PASS * max ? t('A good score at the real thing') : t('Note what went wrong in each problem')}
                </p>
              </div>
            ) : (
              <div className="card mt-5 flex items-center justify-between p-4">
                <span className="body">{left > 0 ? t('Time left') : t('Time’s up · mark it')}</span>
                <span className="title2 tabular-nums" style={{ color: left > 0 ? 'var(--label)' : 'var(--red)' }}>
                  {formatTime(left > 0 ? left : 0)}
                </span>
              </div>
            )}
            <SectionHeader>{t('Problems')}</SectionHeader>
            <div className="group">
              {refs.map((ref, i) => {
                const d = getDay(ref.index)
                return (
                  <PartRow
                    key={i}
                    label={`${t('Problem {n}', { n: i + 1 })} · ${AREAS[d.area].name}`}
                    sub={finished ? t('From day {n}: {title}', { n: d.day, title: dayTitle(d) }) : scores[i] >= 0 ? t('Handed in') : t('Not handed in yet')}
                    status={null}
                    score={scores[i]}
                    onClick={() => onPart(i)}
                  />
                )
              })}
            </div>
          </>
        )}
      </Page>
    </>
  )
}

// Redo a problem from the mistake notebook. Nothing is saved except that the mistake is fixed.
export function RedoScreen({ refObj, ai, today, onBack, onCoach, onFixed, backLabel }) {
  const [entry, setEntry] = useState(FRESH)
  const d = getDay(refObj.index)
  const problem = problemAt(refObj)
  const ok = problem && partStatus(problem, entry, today) === 'ok'
  useEffect(() => {
    if (ok) onFixed()
  }, [ok])
  if (!problem) return null
  return (
    <ProblemScreen
      d={d}
      part={refObj.k === 'c' ? 'c' : `p${refObj.k}`}
      variant="review"
      problem={problem}
      entry={entry}
      update={(f) => setEntry(f)}
      isCurrent
      ai={ai}
      today={today}
      onBack={onBack}
      onCoach={onCoach}
      title={t('Redo')}
      eyebrow={`${t('From day {n}', { n: d.day })} · ${dayTitle(d)}`}
      backLabel={backLabel}
      failNote={t('Try this one again in a few days.')}
      next={{ label: t('Back to Progress'), onClick: onBack }}
    />
  )
}
