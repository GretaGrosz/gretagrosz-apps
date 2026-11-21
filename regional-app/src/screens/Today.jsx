import { AREAS, PAPERS, TOTAL_DAYS } from '../plan'
import { getDay } from '../content'
import { BANK, bankArea, bankStatus, bankTitle, mockFinished } from '../data'
import { DAY, dateOfDay, dayOfIso } from '../dates'
import { fmtDate, t, tn } from '../i18n'
import { CHALLENGE_MASTER, FRESH, MINI_MINUTES, PROOF_PASS, miniEnd, partStatus, problemAt } from '../logic'
import { AreaBadge, CheckIcon, ChevronIcon, Done, FlameIcon, GearIcon, Header, IconBadge, KIND, NavBar, NavIconButton, Page, PlanIcon, RepeatIcon, Ring, SectionHeader, ShareIcon, StatusDot, TimerIcon, areaColor, dayLabel, daySub, dayTitle, formatTime, useNow } from '../ui'

export function paceLabel(p) {
  if (!p) return null
  if (p.kind === 'behind') return { text: tn(p.n, '{n} day behind', '{n} days behind'), color: 'var(--orange)' }
  if (p.kind === 'ok') return { text: p.spare > 0 ? tn(p.spare, 'On track · {n} spare day', 'On track · {n} spare days') : t('On track'), color: 'var(--green)' }
  if (p.kind === 'done') return { text: t('Plan done'), color: 'var(--green)' }
  return null
}

export function TodayTab({ state, today, current, streak, finishedToday, mini, pace, onOpenDay, onPlan, onSettings, onReview, onMini, onOpenMock, onTrain, onMockStart, onToolbox, onBackup }) {
  const now = useNow()
  const doneCount = Object.keys(state.results).length
  const planDone = doneCount >= TOTAL_DAYS
  const activeMock = (state.mocks || []).find((m) => !mockFinished(m))
  const dueBank = BANK.filter((p) => state.bank?.[p.id]?.due != null && state.bank[p.id].due <= today && bankStatus(state.bank[p.id]) !== 'full')
  const review = state.reviews?.[today]
  const d = getDay(current)
  const result = state.results[current]
  const started = Object.entries(state.work).some(([key]) => key.startsWith(`${current}:`))
  const examDay = dayOfIso(state.examDate)
  const examDays = examDay != null ? examDay - today : null
  const paceInfo = paceLabel(pace)
  const backupAge = state.lastBackup ? Math.floor((Date.now() - Date.parse(state.lastBackup)) / DAY) : null
  const needsBackup = doneCount >= 3 && (backupAge == null || backupAge >= 7)

  let action
  let note
  if (result) {
    const canMaster = d.kind === 'learn' && d.content?.challenge && result.status !== 'mastered'
    action = canMaster ? t('Try the Challenge') : t('Review')
    note = canMaster ? t('{n}/8 on the challenge masters the day', { n: CHALLENGE_MASTER }) : null
  } else if (d.kind === 'paper') {
    action = started ? t('Continue') : t('Open the Paper')
    note = t('4 problems · {h} hours · 8 points each', { h: PAPERS[d.paper[0]].minutes / 60 })
  } else if (d.kind === 'task' || !d.content) {
    action = t('Open')
    note = daySub(d) || null
  } else {
    action = started ? t('Continue') : t('Start')
    note = t('Lesson · 2 quick problems · 1 proof ({n}/8 to pass)', { n: PROOF_PASS })
  }

  const upcoming = planDone ? [] : [1, 2, 3].map((n) => current + n).filter((i) => i < TOTAL_DAYS)
  const dueRows = []

  if (activeMock) {
    const end = activeMock.startedAt + activeMock.minutes * 6e4
    const over = !activeMock.handedAt && now >= end
    dueRows.push(
      <button key="mock" onClick={() => onOpenMock(activeMock.id)} className="row">
        <IconBadge color="var(--indigo)">
          <TimerIcon className="h-4 w-4" />
        </IconBadge>
        <span className="min-w-0 flex-1">
          <span className="body block truncate">{activeMock.handedAt || over ? t('Mark your mock') : t('Mock in progress')}</span>
          <span className="footnote block tabular-nums">{activeMock.handedAt ? activeMock.label : over ? `${activeMock.label} · ${t('time’s up')}` : `${activeMock.label} · ${t('{time} left', { time: formatTime(end - now) })}`}</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
      </button>,
    )
  }
  if (review) {
    const rd = getDay(review.index)
    const st = partStatus(problemAt(review), { ...FRESH, ...review }, today)
    dueRows.push(
      <button key="review" onClick={onReview} className="row">
        <AreaBadge d={rd} small />
        <span className="min-w-0 flex-1">
          <span className="body block truncate">{t('Warm-up')}</span>
          <span className="footnote block truncate">{st === 'ok' ? t('Done') : st === 'failed' ? t('Back tomorrow') : t('One quick problem from day {n}', { n: rd.day })}</span>
        </span>
        <StatusDot status={st} />
        <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
      </button>,
    )
  }
  if (dueBank.length > 0) {
    const sameArea = dueBank.every((p) => p.area === dueBank[0].area)
    dueRows.push(
      <button key="bank" onClick={onTrain} className="row">
        {sameArea ? (
          <AreaBadge d={bankArea(dueBank[0])} small />
        ) : (
          <IconBadge>
            <RepeatIcon className="h-4 w-4" />
          </IconBadge>
        )}
        <span className="min-w-0 flex-1">
          <span className="body block truncate">{dueBank.length === 1 ? bankTitle(dueBank[0]) : tn(dueBank.length, '{n} past problem to retry', '{n} past problems to retry')}</span>
          <span className="footnote block truncate">{sameArea ? AREAS[dueBank[0].area].name : [...new Set(dueBank.map((p) => AREAS[p.area].name))].join(', ')}</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
      </button>,
    )
  }
  if (mini) {
    const m = state.minis?.[mini]
    const over = m && !m.handedAt && now >= miniEnd(m)
    dueRows.push(
      <button key="mini" onClick={() => onMini(mini)} className="row">
        <IconBadge color="var(--indigo)">
          <span className="text-[13px] font-semibold">{mini}</span>
        </IconBadge>
        <span className="min-w-0 flex-1">
          <span className="body block truncate">{t('Mini-mock {n}', { n: mini })}</span>
          <span className="footnote block tabular-nums">{!m ? t('One problem per area · {n} minutes', { n: MINI_MINUTES }) : over || m.handedAt ? t('Time’s up · mark it') : t('{time} left', { time: formatTime(miniEnd(m) - now) })}</span>
        </span>
        <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
      </button>,
    )
  }
  if (needsBackup) {
    dueRows.push(
      <button key="backup" onClick={onBackup} className="row">
        <IconBadge color="var(--accent)">
          <ShareIcon className="h-4 w-4" />
        </IconBadge>
        <span className="min-w-0 flex-1">
          <span className="body block truncate">{t('Save a backup')}</span>
          <span className="footnote block">{backupAge == null ? t('No backup yet') : tn(backupAge, 'Last one {n} day ago', 'Last one {n} days ago')}</span>
        </span>
      </button>,
    )
  }

  return (
    <>
      <NavBar
        title={t('Today')}
        left={
          <span className="lg:hidden">
            <NavIconButton onClick={onPlan} label={t('Plan')}>
              <PlanIcon className="h-[24px] w-[24px]" />
            </NavIconButton>
          </span>
        }
        right={
          <span className="lg:hidden">
            <NavIconButton onClick={onSettings} label={t('Settings')}>
              <GearIcon className="h-[23px] w-[23px]" />
            </NavIconButton>
          </span>
        }
      />
      <Page>
        <Header eyebrow={fmtDate(dateOfDay(today), { weekday: 'long', day: 'numeric', month: 'long' })} title={t('Today')} />

        {planDone ? (
          <div className="card mt-4 p-4">
            <p className="footnote font-semibold" style={{ color: 'var(--green)' }}>
              {t('All {n} days done', { n: TOTAL_DAYS })}
            </p>
            <p className="title2 mt-1">{t('Exam mode')}</p>
            <div className="mt-4 grid gap-3">
              <button onClick={activeMock ? () => onOpenMock(activeMock.id) : onMockStart} className="btn btn-filled w-full">
                {activeMock ? t('Continue the Mock') : t('Sit a Mock')}
              </button>
              <button onClick={() => onToolbox('all')} className="btn btn-tinted w-full">
                {t('Formelblatt')}
              </button>
            </div>
          </div>
        ) : (
          <div className="card mt-4 overflow-hidden">
            {finishedToday && (
              <div className="flex items-center gap-2 px-4 pt-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: 'var(--green)' }}>
                  <CheckIcon className="h-3 w-3 text-white" />
                </span>
                <span className="subhead font-semibold" style={{ color: 'var(--green)' }}>
                  {t('Streak safe for today')}
                </span>
              </div>
            )}
            <button onClick={() => onOpenDay(current)} className="press block w-full p-4 pb-3 text-left">
              <div className="flex items-center gap-3">
                <AreaBadge d={d} />
                <div className="min-w-0 flex-1">
                  <p className="footnote font-semibold" style={{ color: areaColor(d) }}>
                    {finishedToday ? `${t('Next up')} · ` : ''}
                    {t('Day {n}', { n: d.day })} · {dayLabel(d)} · {t(KIND[d.kind])}
                  </p>
                  <p className="title3 leading-tight break-words" lang="de">
                    {dayTitle(d)}
                  </p>
                </div>
                {result && <Done status={result.status} />}
              </div>
              {note && <p className="footnote mt-3">{note}</p>}
            </button>
            <div className="px-4 pb-4">
              <button onClick={() => onOpenDay(current)} className={`btn w-full ${result && d.kind === 'learn' && d.content?.challenge && result.status !== 'mastered' ? 'btn-purple' : result ? 'btn-tinted' : 'btn-filled'}`}>
                {action}
              </button>
            </div>
          </div>
        )}

        {dueRows.length > 0 && (
          <>
            <SectionHeader>{t('Also due')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {dueRows}
            </div>
          </>
        )}

        <SectionHeader>{t('Plan')}</SectionHeader>
        <div className="group" style={{ '--inset': '72px' }}>
          <button onClick={onPlan} className="row">
            <Ring value={doneCount / TOTAL_DAYS} size={44} stroke={5} label={t('{done} of {total} days', { done: doneCount, total: TOTAL_DAYS })}>
              <span className="caption font-semibold tabular-nums" style={{ color: 'var(--label)' }}>
                {Math.round((doneCount / TOTAL_DAYS) * 100)}%
              </span>
            </Ring>
            <span className="min-w-0 flex-1">
              <span className="body block">{t('{done} of {total} days', { done: doneCount, total: TOTAL_DAYS })}</span>
              <span className="footnote flex items-center gap-1" style={{ color: streak ? 'var(--orange)' : undefined }}>
                <FlameIcon className="h-[14px] w-[14px]" /> {tn(streak, '{n}-day streak', '{n}-day streak')}
              </span>
            </span>
            <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
          </button>
          {examDays != null && examDays >= 0 ? (
            <button onClick={onSettings} className="row">
              <span className="flex w-11 shrink-0 justify-center">
                <span className="title3 tabular-nums">{examDays}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="body block">{examDays === 0 ? t('Competition today') : tn(examDays, 'day to the competition', 'days to the competition')}</span>
                {paceInfo && (
                  <span className="footnote block font-semibold" style={{ color: paceInfo.color }}>
                    {paceInfo.text}
                    {pace?.kind === 'behind' && pace.perDay > 1 ? ` · ${t('{n} a day to catch up', { n: pace.perDay })}` : ''}
                  </span>
                )}
              </span>
            </button>
          ) : (
            <button onClick={onSettings} className="row">
              <span className="flex w-11 shrink-0 justify-center">
                <TimerIcon className="h-5 w-5 text-[var(--link)]" />
              </span>
              <span className="body flex-1" style={{ color: 'var(--link)' }}>
                {t('Add the competition date')}
              </span>
            </button>
          )}
        </div>

        {upcoming.length > 0 && (
          <>
            <SectionHeader>{t('Up next')}</SectionHeader>
            <div className="group" style={{ '--inset': '56px' }}>
              {upcoming.map((i) => {
                const u = getDay(i)
                return (
                  <button key={i} onClick={() => onOpenDay(i)} className="row">
                    <AreaBadge d={u} small />
                    <span className="min-w-0 flex-1">
                      <span className="body block truncate" lang="de">
                        {dayTitle(u)}
                      </span>
                      <span className="footnote block">
                        {t('Day {n}', { n: u.day })} · {dayLabel(u)}
                      </span>
                    </span>
                    <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
                  </button>
                )
              })}
            </div>
          </>
        )}
      </Page>
    </>
  )
}
