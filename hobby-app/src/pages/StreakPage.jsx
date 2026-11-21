import { Fragment, useRef, useState } from 'react'
import { useStore } from '../store'
import { OutfitPick } from '../components/OutfitPick'
import { useT } from '../i18n'
import { dayOf, countedWeeks, frozenWeeks, weekOf } from '../data'
import { OUTFITS, OutfitPreview } from '../components/Buddy'
import { BackButton, Icon } from '../components/ui'
import Mascot from '../assistant/Mascot'
import { fx, svgIn } from '../assistant/motion'
import { useStreakAxo } from '../assistant/mood'
import { useAssistant } from '../assistant/Assistant'

// A calendar day number (data.js dayOf) back to a local date, at noon so no timezone tips it over
const noonOf = (d) => {
  const u = new Date(d * 864e5)
  return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate(), 12)
}

// The last five weeks, Monday first: a filled day is a day you worked on a hobby; the mark at the end of a row
// says the week counted (or a freeze saved it)
function Weeks() {
  const { data } = useStore()
  const { t, fmt } = useT()
  const times = data.activity.map((a) => a.at)
  const worked = new Set(times.map(dayOf))
  const frozen = new Set(data.freezes.used)
  const saved = new Set(frozenWeeks(data.freezes.used))
  const counted = countedWeeks(times, data.me.weekGoals)
  const today = dayOf(Date.now())
  const weekday = (new Date().getDay() + 6) % 7
  const start = today - weekday - 28
  const days = Array.from({ length: 35 }, (_, i) => start + i)
  const labels = Array.from({ length: 7 }, (_, i) => fmt.date(noonOf(start + i), { weekday: 'narrow' }))
  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Last 5 weeks')}</h2>
      <div className="surface p-4">
        <div className="grid grid-cols-[repeat(7,1fr)_28px] gap-1.5 text-center">
          {labels.map((l, i) => (
            <span key={i} className="pb-1 text-[12px] font-semibold text-sub">
              {l}
            </span>
          ))}
          <span />
          {days.map((d, i) => {
            const end = i % 7 === 6
            const w = weekOf(noonOf(d).getTime())
            const mark = end && (counted.has(w) ? 'done' : saved.has(w) ? 'ice' : null)
            const future = d > today
            const on = worked.has(d)
            const ice = !on && frozen.has(d)
            const cell = (
              <span
                key={d}
                className={`mx-auto flex aspect-square w-full max-w-[40px] items-center justify-center rounded-full text-[13px] font-semibold tabular-nums ${
                  on ? 'bg-spark text-white' : ice ? 'text-sky-500 ring-2 ring-inset ring-sky-400' : future ? 'text-ink/20' : 'bg-mist text-sub'
                } ${d === today && !on ? 'ring-2 ring-inset ring-spark' : ''}`}
                aria-label={`${fmt.date(noonOf(d), { weekday: 'long', day: 'numeric', month: 'long' })}${on ? `, ${t('counted')}` : ice ? `, ${t('saved by a freeze')}` : ''}`}
              >
                {noonOf(d).getDate()}
              </span>
            )
            return end ? (
              <Fragment key={d}>
                {cell}
                <span className="flex items-center justify-center" aria-label={mark === 'done' ? t('This week counted') : mark === 'ice' ? t('saved by a freeze') : undefined}>
                  {mark === 'done' ? (
                    <Icon name="check" className="h-4 w-4 text-spark-ink" strokeWidth={3} />
                  ) : mark === 'ice' ? (
                    <Icon name="snow" className="h-4 w-4 text-sky-500" />
                  ) : null}
                </span>
              </Fragment>
            ) : (
              cell
            )
          })}
        </div>
      </div>
    </section>
  )
}

// When the put-on animation lands, per slot (ms)
const LANDS = { head: 380, eyes: 520, neck: 370, gills: 300 }

// The axolotl's page: your streak, the days that counted, and the outfits it has earned
export default function StreakPage() {
  const { data, actions, bestStreak, isUnlocked, openPick, thisWeek, weekGoal } = useStore()
  const [picking, setPicking] = useState(null)
  const { t, tn } = useT()
  const { streak, weekDone, mood } = useStreakAxo()
  const assistant = useAssistant()
  const axo = useRef(null)
  const outfit = data.me.outfit || {}
  const mine = OUTFITS.filter(isUnlocked)
  const need = Math.max(0, weekGoal - thisWeek)
  const worked = new Set(data.activity.map((a) => dayOf(a.at)))
  const monday = dayOf(Date.now()) - ((new Date().getDay() + 6) % 7)
  const freezes = data.freezes.available

  const wear = (item) => {
    if (!isUnlocked(item)) return
    const on = outfit[item.slot] === item.id
    actions.setMe({ outfit: { ...outfit, [item.slot]: on ? null : item.id } })
    // A little hop the moment it lands (src/outfits/wear.css)
    if (!on) setTimeout(() => fx.hop(svgIn(axo.current)), LANDS[item.slot])
  }

  return (
    <div className="mx-auto max-w-2xl pt-2 lg:max-w-[1760px]">
      <BackButton fallback="/you" />
      <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-10">
      <section className="surface mt-1 flex lg:sticky lg:top-20 flex-col items-center px-6 pb-6 pt-8 text-center">
        <button
          type="button"
          onClick={() => fx.boop(svgIn(axo.current))}
          className="rounded-[28px] focus-visible:outline-offset-4"
          aria-label={`${t('Streak')}: ${tn(streak, '{n} week', '{n} weeks')}`}
        >
          <Mascot ref={axo} size={208} streak={streak} mood={mood} outfit={outfit} title="" />
        </button>
        <p className="mt-4 text-[34px] font-bold tabular-nums tracking-tight">{tn(streak, '{n} week', '{n} weeks')}</p>
        <p className="text-[17px] text-sub">
          {weekDone
            ? t('This week counts.')
            : streak > 0
              ? tn(need, '{n} more day of hobbies this week to keep it.', '{n} more days of hobbies this week to keep it.')
              : tn(need, '{n} more day of hobbies this week to start.', '{n} more days of hobbies this week to start.')}
        </p>
        {/* This week, Monday to Sunday */}
        <div className="mt-3 flex gap-1.5" aria-label={t('{done} of {goal} days this week', { done: thisWeek, goal: weekGoal })}>
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className={`h-2.5 w-7 rounded-full ${worked.has(monday + i) ? 'bg-spark' : 'bg-mist'}`} />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-[15px] font-medium">
          <button
            onClick={() => actions.setWeekGoal(weekGoal - 1)}
            disabled={weekGoal <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-[20px] active:opacity-60 disabled:opacity-30"
            aria-label={t('Fewer days')}
          >
            −
          </button>
          <span className="min-w-[150px]">{tn(weekGoal, 'Goal: {n} day a week', 'Goal: {n} days a week')}</span>
          <button
            onClick={() => actions.setWeekGoal(weekGoal + 1)}
            disabled={weekGoal >= 7}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-[20px] active:opacity-60 disabled:opacity-30"
            aria-label={t('More days')}
          >
            +
          </button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-[15px] font-medium">
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-mist px-3">
            <Icon name="trophy" className="h-4 w-4 text-sub" /> {tn(bestStreak, 'Best: {n} week', 'Best: {n} weeks')}
          </span>
          <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-mist px-3">
            <Icon name="snow" className="h-4 w-4 text-sub" /> {tn(freezes, '{n} freeze', '{n} freezes')}
          </span>
        </div>
        <button onClick={() => assistant.openAsk()} className="btn-tinted btn-lg mt-5 w-full sm:w-auto">
          {t('Ask something')}
        </button>
      </section>

      <div className="lg:[&>*:first-child]:mt-1">
      {/* Hobby outfits: finish a project, post it, pick one */}
      <section className="surface mt-4 flex items-center gap-4 px-5 py-4">
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">{openPick ? t('You earned a new outfit') : t('Outfits')}</span>
          <span className="block text-[15px] text-sub">
            {openPick ? t('For a project you finished.') : t('Finish a project: you pick a new outfit.')}
          </span>
        </span>
        {openPick && (
          <button onClick={() => setPicking(openPick)} className="btn-primary shrink-0">
            {t('Pick')}
          </button>
        )}
      </section>
      {picking && <OutfitPick pickKey={picking} onClose={() => setPicking(null)} />}

      <Weeks />

      {/* Your outfits, to put on and take off. Every one came from a finished project. */}
      <section className="mt-8">
        <h2 className="section-label">{t('Your outfits')}</h2>
        {mine.length === 0 ? (
          <p className="surface px-5 py-4 text-[15px] text-sub">{t('Finish a project to pick your first outfit.')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {mine.map((item) => {
              const on = outfit[item.slot] === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => wear(item)}
                  aria-pressed={on}
                  className={`surface relative flex flex-col items-center p-3 transition active:scale-[0.97] ${on ? 'ring-2 ring-spark' : ''}`}
                >
                  <span key={on ? 'on' : 'off'} className={`flex h-14 w-full items-center justify-center ${on ? 'acc-tile-pop' : ''}`}>
                    <OutfitPreview item={item} />
                  </span>
                  <span className="mt-1 text-center text-[13px] font-semibold leading-tight">{t(item.name)}</span>
                  <span className="mt-0.5 min-h-[16px] text-[12px] font-semibold text-spark-ink">{on ? t('Wearing') : null}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>
      </div>
      </div>
    </div>
  )
}
