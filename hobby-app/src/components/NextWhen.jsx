// "When's the next step?" One tap on a time and the axolotl reminds you then (reminders.js). Shown under the next
// step until you pick a time or say not now; after you tick the step off it asks about the next one. Off in You →
// Settings. Asking people when they'll do something makes them much more likely to do it (Gollwitzer & Sheeran 2006).
import { useState } from 'react'
import { useStore } from '../store'
import { locale, useT } from '../i18n'
import { Icon } from './ui'
import { setReminder, cancelReminder, whenOptions } from '../reminders'

// Why the reminder can't come yet, and the one thing that fixes it
const HINT = {
  install: 'Add Blank to your Home Screen to get the reminder.',
  off: 'Turn on notifications for Blank to get the reminder.',
  denied: 'Notifications for Blank are blocked. Turn them on in your phone’s settings, then tap Try again.',
  error: 'The reminder couldn’t be set.',
}

// The plan for this project's next step, if it still counts (older projects saved startPlan: { when })
export function stepPlanFor(project) {
  const next = project.milestones.find((m) => !m.done)
  if (!next) return { next: null, plan: null }
  let plan = project.stepPlan?.stepId === next.id ? project.stepPlan : null
  if (!plan && project.startPlan?.when && !project.milestones.some((m) => m.done && !m.auto)) plan = { stepId: next.id, at: project.startPlan.when }
  if (plan && !plan.skip && plan.at < Date.now()) plan = null // that time has passed: ask again
  return { next, plan }
}

export default function NextWhen({ project, compact = false }) {
  const { data, actions } = useStore()
  const { t, fmt, lang } = useT()
  const [picking, setPicking] = useState(false)
  const [custom, setCustom] = useState(null)
  const { next, plan } = stepPlanFor(project)
  if (!next || data.me.askWhen === false || project.status === 'done') return null
  if (plan?.skip) return null

  const first = !project.milestones.some((m) => m.done && !m.auto)
  const hour = data.me.remindHour ?? 17
  const time = (ms) => new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit' }).format(ms)
  const day = (ms) => {
    const w = new Intl.DateTimeFormat(locale(lang), { weekday: 'long' }).format(ms)
    return w.charAt(0).toUpperCase() + w.slice(1)
  }
  const label = (o) => (o.key === 'today' ? t('Today {time}', { time: time(o.at) }) : o.key === 'tomorrow' ? t('Tomorrow {time}', { time: time(o.at) }) : `${day(o.at)} ${time(o.at)}`)
  // "tomorrow 17:00", "Saturday 10:00", or the date when it's further away
  const whenText = (ms) => {
    const days = Math.round((new Date(ms).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5)
    // Mid-sentence: "Next step: tomorrow 17:00" (weekdays keep their capital in English and German)
    const lower = (x) => x.charAt(0).toLowerCase() + x.slice(1)
    if (days === 0) return lower(t('Today {time}', { time: time(ms) }))
    if (days === 1) return lower(t('Tomorrow {time}', { time: time(ms) }))
    if (days < 7) return lang === 'hu' ? lower(`${day(ms)} ${time(ms)}`) : `${day(ms)} ${time(ms)}`
    return fmt.date(ms, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  }

  const set = (patch) => actions.updateProject(project.id, { stepPlan: { stepId: next.id, ...patch } })
  const pick = async (ms, rememberHour) => {
    setPicking(false)
    setCustom(null)
    set({ at: ms, remind: 'pending' })
    if (rememberHour != null && rememberHour !== hour) actions.setMe({ remindHour: rememberHour })
    try {
      // Straight from the tap, so the phone can ask for permission
      await setReminder({ project: project.id, step: next.text, when: ms, lang })
      set({ at: ms, remind: 'on' })
      actions.toast({ text: 'The axolotl will remind you.' })
    } catch (e) {
      const remind = e?.code === 'install' ? 'install' : e?.code === 'denied' ? 'denied' : e?.code === 'dismissed' ? 'off' : 'error'
      set({ at: ms, remind })
      // iPhone: no notifications until Blank is on the Home Screen, so show how right away
      if (remind === 'install') window.dispatchEvent(new Event('blank:install'))
    }
  }
  const skip = () => {
    if (plan?.remind === 'on') cancelReminder(project.id)
    set({ skip: true })
  }

  // A time is set: one quiet line
  if (plan && !picking) {
    return (
      <div className={compact ? 'mt-2' : 'surface mb-4 px-4 py-3'}>
        <div className="flex items-center gap-2">
          <Icon name="bell" className={`shrink-0 text-spark-ink ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
          <span className={`min-w-0 flex-1 leading-snug ${compact ? 'text-[14px] text-sub' : 'text-[15px]'}`}>
            {first ? t('Start: {when}', { when: whenText(plan.at) }) : t('Next step: {when}', { when: whenText(plan.at) })}
          </span>
          <button onClick={() => setPicking(true)} className="h-8 shrink-0 rounded-full px-2 text-[14px] font-medium text-spark-ink active:opacity-60">
            {t('Change')}
          </button>
        </div>
        {HINT[plan.remind] && (
          <div className="mt-2 rounded-[12px] bg-spark-soft px-3 py-2">
            <p className="text-[14px] leading-snug text-spark-ink">{t(HINT[plan.remind])}</p>
            <button
              onClick={() => (plan.remind === 'install' ? window.dispatchEvent(new Event('blank:install')) : pick(Math.max(plan.at, Date.now() + 60_000)))}
              className="mt-1 h-8 rounded-full text-[14px] font-semibold text-spark-ink underline-offset-2 active:opacity-60"
            >
              {plan.remind === 'install' ? t('Add to Home Screen') : t('Try again')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Asking: one line, three times, done
  const options = whenOptions(new Date(), hour)
  return (
    <div className={compact ? 'mt-3' : 'surface mb-4 px-4 py-3'}>
      <div className="flex items-center gap-2">
        <p className={`flex-1 font-semibold ${compact ? 'text-[14px] text-sub' : 'text-[16px]'}`}>{first ? t('When will you start?') : t('When’s the next step?')}</p>
        <button onClick={skip} className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist" aria-label={t('Not now')} title={t('Not now')}>
          <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => pick(o.at, o.key === 'weekend' ? null : new Date(o.at).getHours())}
            className="h-9 rounded-full bg-spark-soft px-3.5 text-[15px] font-semibold text-spark-ink transition active:scale-95"
          >
            {label(o)}
          </button>
        ))}
        {custom == null ? (
          <button onClick={() => setCustom('')} className="h-9 rounded-full bg-mist px-3.5 text-[15px] font-medium text-ink active:scale-95">
            {t('Other time')}
          </button>
        ) : (
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (custom) pick(new Date(custom).getTime(), new Date(custom).getHours())
            }}
          >
            <input type="datetime-local" className="input h-10 py-0" value={custom} onChange={(e) => setCustom(e.target.value)} aria-label={t('Other time')} autoFocus />
            <button disabled={!custom} className="btn-primary min-h-[40px] shrink-0 px-4">
              {t('Save')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
