import { useState } from 'react'
import { PHASES, PLAN } from '../plan'
import { getDay } from '../content'
import { t } from '../i18n'
import { AreaBadge, BackButton, ChevronIcon, Done, Header, NavBar, Page, Segmented, dayLabel, daySub, dayTitle } from '../ui'

export function PlanScreen({ state, current, onOpenDay, onBack, backLabel }) {
  const [phase, setPhase] = useState(() => Math.max(0, PHASES.findIndex((p) => current + 1 >= p.days[0] && current + 1 <= p.days[1])))
  const p = PHASES[phase]
  const days = PLAN.slice(p.days[0] - 1, p.days[1])
  return (
    <>
      <NavBar title={t('Plan')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <Header title={t('Plan')} />
        <Segmented className="mt-3" value={phase} onChange={setPhase} options={PHASES.map((ph, i) => [i, ph.name])} label={t('Phase')} />
        <p className="footnote mt-3 px-1 tabular-nums">{t('Days {from}–{to}', { from: p.days[0], to: p.days[1] })}</p>
        <div className="group mt-2" style={{ '--inset': '56px' }}>
          {days.map((plan) => {
            const d = getDay(plan.index)
            const r = state.results[plan.index]
            const isToday = plan.index === current
            return (
              <button key={plan.index} onClick={() => onOpenDay(plan.index)} className="row">
                <span>
                  <AreaBadge d={d} small />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="body block truncate" lang="de">
                    {dayTitle(d)}
                  </span>
                  <span className="footnote block truncate">
                    {t('Day {n}', { n: d.day })}
                    {daySub(d) ? ` · ${daySub(d)}` : ` · ${dayLabel(d)}`}
                  </span>
                </span>
                {r ? (
                  <Done status={r.status} small />
                ) : isToday ? (
                  <span className="footnote font-semibold" style={{ color: 'var(--link)' }}>
                    {t('Today')}
                  </span>
                ) : null}
                <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
              </button>
            )
          })}
        </div>
      </Page>
    </>
  )
}
