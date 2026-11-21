import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { dayOf } from '../data'
import { CHALLENGES, challengeById, challengeState, daysLeftThisMonth, everWon, startOfNextMonth } from '../challenges'
import { pick } from '../guides'
import { outfitItem } from '../components/Buddy'
import Mascot from '../assistant/Mascot'
import { BackButton, Confetti, Icon, ProgressBar, Sheet, tintStyle } from '../components/ui'

function useChallenge(ch) {
  const { data } = useStore()
  return challengeState(ch, data.challenges[ch.id], data.challengeWins)
}

// The one button: join, check in, done today, or when it opens again
function Action({ ch, onCheckIn, className = '' }) {
  const { actions } = useStore()
  const { t, fmt } = useT()
  const s = useChallenge(ch)
  const opens = fmt.date(startOfNextMonth(), { day: 'numeric', month: 'long' })
  if (s.won)
    return (
      <span className={`btn cursor-default bg-good/15 text-good ${className}`}>
        <Icon name="trophy" className="h-4 w-4" /> {t('Finished')}
      </span>
    )
  if (!s.reachable) return <span className={`btn cursor-default bg-mist text-sub ${className}`}>{t('Opens {date}', { date: opens })}</span>
  if (!s.joined)
    return (
      <button onClick={() => actions.joinChallenge(ch.id)} className={`btn-primary ${className}`}>
        {t('Join')}
      </button>
    )
  if (s.doneToday)
    return (
      <span className={`btn cursor-default bg-good/15 text-good ${className}`}>
        <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> {t('Done today')}
      </span>
    )
  return (
    <button
      onClick={() => {
        actions.checkInChallenge(ch.id)
        onCheckIn?.()
      }}
      className={`btn-primary ${className}`}
    >
      <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> {t('I did it today')}
    </button>
  )
}

function ChallengeCard({ ch }) {
  const { t, lang } = useT()
  const s = useChallenge(ch)
  const reward = outfitItem(ch.outfit)
  return (
    <div className="surface flex flex-col p-4">
      <Link to={`/challenge/${ch.id}`} className="flex items-start gap-3 active:opacity-70">
        <span className="tint flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[12px]" style={tintStyle(ch.category)}>
          <Mascot size={52} peek outfit={{ head: reward.id }} title="" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold leading-snug">{pick(ch.title, lang)}</span>
          <span className="block text-[15px] text-sub">{t('{n} days this month', { n: ch.goal })}</span>
        </span>
        <Icon name="chevron" className="mt-1 h-4 w-4 shrink-0 text-ink/30" strokeWidth={2.6} />
      </Link>
      {s.joined && (
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={Math.min(100, (s.days.length / ch.goal) * 100)} />
          <span className="shrink-0 text-[13px] font-semibold tabular-nums text-sub">
            {s.days.length}/{ch.goal}
          </span>
        </div>
      )}
      <Action ch={ch} className="mt-3 w-full" />
    </div>
  )
}

export function ChallengesList() {
  const { t, tn, fmt } = useT()
  return (
    <div className="mx-auto max-w-2xl pt-2 lg:max-w-[1760px]">
      <BackButton fallback="/you" />
      <h1 className="large-title px-1">{t('{month} challenges', { month: fmt.month() })}</h1>
      <p className="mt-1 px-1 text-[15px] text-sub">{tn(daysLeftThisMonth(), '{n} day left', '{n} days left')}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
        {CHALLENGES.map((ch) => (
          <ChallengeCard key={ch.id} ch={ch} />
        ))}
      </div>
    </div>
  )
}

export default function ChallengePage() {
  const { id } = useParams()
  const { data, actions } = useStore()
  const { t, tn, lang, fmt } = useT()
  const [wins, setWins] = useState(0)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const closeLeave = useCallback(() => setConfirmLeave(false), [])
  const ch = challengeById(id)
  const s = challengeState(ch || CHALLENGES[0], data.challenges[(ch || CHALLENGES[0]).id], data.challengeWins)
  if (!ch) {
    return (
      <div className="pt-2">
        <BackButton fallback="/challenges" />
        <p className="py-20 text-center text-sub">{t('This page doesn’t exist.')}</p>
      </div>
    )
  }
  const reward = outfitItem(ch.outfit)
  const won = everWon(data.challengeWins, ch.id)

  // This month's calendar, with the days you checked in filled
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const firstDay = dayOf(monthStart.getTime())
  const today = dayOf(Date.now())

  const leave = () => {
    setConfirmLeave(false)
    actions.leaveChallenge(ch.id)
  }

  return (
    <div className="mx-auto max-w-2xl pt-2">
      <BackButton fallback="/challenges" />
      <header className="surface relative mt-1 overflow-hidden p-5 sm:p-6">
        {wins > 0 && <Confetti key={wins} />}
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">
              {fmt.month()} · {tn(daysLeftThisMonth(), '{n} day left', '{n} days left')}
            </p>
            <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-[-0.01em]">{pick(ch.title, lang)}</h1>
            <p className="mt-1 text-[17px] text-sub">{t('{n} days this month', { n: ch.goal })}</p>
          </div>
          <div className="tint flex h-28 w-24 shrink-0 flex-col items-center justify-center rounded-[18px]" style={tintStyle(ch.category)}>
            <div className={won ? '' : 'opacity-60'}>
              <Mascot size={88} peek mood={won ? 'proud' : 'idle'} outfit={{ ...(data.me.outfit || {}), head: reward.id }} title="" />
            </div>
          </div>
        </div>
        <p className="mt-3 text-[17px] leading-snug">{pick(ch.blurb, lang)}</p>
        {s.joined && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-[15px] font-semibold tabular-nums">
              <span>{t('{n} of {goal} days', { n: s.days.length, goal: ch.goal })}</span>
              <span>{Math.min(100, Math.round((s.days.length / ch.goal) * 100))}%</span>
            </div>
            <ProgressBar value={Math.min(100, (s.days.length / ch.goal) * 100)} className="h-2" />
          </div>
        )}
        <Action ch={ch} onCheckIn={() => setWins((n) => n + 1)} className="btn-lg mt-5 w-full sm:w-auto" />
      </header>

      {s.joined && (
        <section className="mt-8">
          <h2 className="section-label">{fmt.month()}</h2>
          <div className="surface p-4">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }, (_, i) => (
                <span key={`pad${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = firstDay + i
                const done = s.days.includes(d)
                return (
                  <span
                    key={d}
                    className={`flex aspect-square items-center justify-center rounded-[10px] text-[13px] font-semibold tabular-nums transition-colors ${
                      done ? 'bg-spark text-white' : d === today ? 'ring-2 ring-inset ring-spark text-ink' : d > today ? 'text-ink/25' : 'bg-mist text-sub'
                    }`}
                  >
                    {i + 1}
                  </span>
                )
              })}
            </div>
          </div>
          <button onClick={() => (s.days.length ? setConfirmLeave(true) : leave())} className="mt-3 h-11 px-4 text-[17px] text-bad active:opacity-60">
            {t('Leave challenge')}
          </button>
        </section>
      )}

      {confirmLeave && (
        <Sheet onClose={closeLeave} label={t('Leave challenge')}>
          <div className="px-5 pt-3">
            <h2 className="text-[22px] font-bold leading-tight">{t('Leave challenge')}</h2>
            <p className="mt-2 text-[17px] leading-snug text-ink">
              {tn(s.days.length, 'Your {n} check-in this month will be removed.', 'Your {n} check-ins this month will be removed.')}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={leave} className="btn btn-lg w-full bg-bad text-white">
                {t('Leave challenge')}
              </button>
              <button onClick={closeLeave} className="btn-plain btn-lg w-full">
                {t('Cancel')}
              </button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  )
}
