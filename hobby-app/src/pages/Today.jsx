import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import NextWhen, { stepPlanFor } from '../components/NextWhen'
import { useAccount } from '../account'
import { LoginSheet } from '../components/AccountSheet'
import { usePhoto } from '../media'
import { useAssistant } from '../assistant/Assistant'
import { COST_LABEL, ideaTitle, sessionMinutes } from '../data'
import { CHALLENGES, challengeState } from '../challenges'
import { planForName, pick } from '../guides'
import { Confetti, Icon, IdeaPhoto, PhotoError, ProgressBar, usePhotoPicker } from '../components/ui'
import { NewProjectSheet, ProjectThumb } from '../components/ProjectBits'
import { useUi } from '../components/Layout'
import { pickStarters, startIdea } from './Onboarding'
import BuddyCard from '../components/BuddyCard'
import { TogetherToday } from '../components/Together'
import { useStepPhoto } from '../components/StepPhoto'

// One active project: its next step, and the three things you can do about it right now
function ProjectCard({ project }) {
  const { actions, data } = useStore()
  const { t, tn } = useT()
  const ui = useUi()
  const navigate = useNavigate()
  const [burst, setBurst] = useState(0)
  const [first, setFirst] = useState('')
  const [undo, setUndo] = useState(null)
  useEffect(() => {
    if (!undo) return
    const id = setTimeout(() => setUndo(null), 5000)
    return () => clearTimeout(id)
  }, [undo])
  const next = project.milestones.find((m) => !m.done)
  const doneCount = project.milestones.filter((m) => m.done).length
  const total = project.milestones.length
  const minutes = sessionMinutes(data.me.prefs)
  const running = data.session?.projectId === project.id
  const picker = usePhotoPicker(async ({ ref, ratio }) => {
    actions.addEntry(project.id, { photo: ref, ratio })
    actions.toast({ text: 'Photo added to {title}', vars: { title: project.title }, link: `/project/${project.id}` })
  })

  // Done means a photo of the step first
  const [justTicked, setJustTicked] = useState(false)
  const snap = useStepPhoto(({ step }) => {
    setBurst((n) => n + 1)
    setUndo({ id: step.id, text: step.text })
    setJustTicked(true)
  })
  const tick = () => snap.open(project.id, next)
  const assistant = useAssistant()
  // Nothing done on this project for a week
  const lastMoved = Math.max(
    project.createdAt,
    ...project.milestones.filter((m) => m.done && !m.auto).map((m) => m.doneAt || 0),
    ...(project.entries || []).map((e) => e.at || 0),
    ...(project.sessions || []).map((x) => x.at || x.startedAt || 0),
  )
  const stalled = !!next && Date.now() - lastMoved > 7 * 864e5

  return (
    <article data-axo-target={`project-${project.id}`} className="surface relative overflow-hidden">
      {burst > 0 && <Confetti key={burst} count={18} />}
      <Link to={`/project/${project.id}`} className="flex items-center gap-3 px-4 pb-2 pt-4 active:opacity-70">
        <ProjectThumb project={project} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold">{project.title}</span>
          <span className="mt-1 flex items-center gap-2">
            <ProgressBar value={total ? (doneCount / total) * 100 : 0} className="max-w-[140px]" />
            {total > 0 && (
              <span className="text-[13px] font-medium tabular-nums text-sub">
                {doneCount}/{total}
              </span>
            )}
          </span>
        </span>
        <Icon name="chevron" className="h-5 w-5 shrink-0 text-ink/30" />
      </Link>

      <div className="px-4 pb-4">
        {undo && (
          <div key={undo.id} className="mt-1 flex animate-rise items-center gap-2">
            <Icon name="check" className="h-4 w-4 shrink-0 text-good" strokeWidth={2.8} />
            <span className="min-w-0 flex-1 truncate text-[15px] text-sub line-through">{undo.text}</span>
            <button
              onClick={() => {
                actions.toggleStep(project.id, undo.id)
                setUndo(null)
              }}
              className="flex h-9 shrink-0 items-center px-1 text-[15px] font-semibold text-spark-ink active:opacity-60"
            >
              {t('Undo')}
            </button>
          </div>
        )}
        {next ? (
          <>
            <p key={next.id} className="mt-2 animate-rise text-[20px] font-semibold leading-snug tracking-[-0.01em]">
              {next.text}
            </p>
            {next.how && <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-sub">{next.how}</p>}
            {stalled ? (
              // A week without moving: the step is probably too big, so the axolotl offers to split it
              <button onClick={() => assistant.openSplit(project.id, next.id)} className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-spark-soft px-3 py-2.5 text-left text-[15px] text-spark-ink active:opacity-70">
                <Icon name="list" className="h-5 w-5 shrink-0" />
                <span className="flex-1 font-semibold">{t('Stuck? Let the axolotl split this step')}</span>
                <Icon name="chevron" className="h-4 w-4 shrink-0" strokeWidth={2.6} />
              </button>
            ) : (
              // "When's the next one?" right after you tick a step (the natural moment), or the time you already picked
              (justTicked || stepPlanFor(project).plan) && <NextWhen project={project} compact />
            )}
          </>
        ) : total ? (
          <p className="mt-2 text-[20px] font-semibold leading-snug">{t('Every step is done.')}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!first.trim()) return
              actions.addStep(project.id, first)
              setFirst('')
            }}
            className="mt-2 flex gap-2"
          >
            <input
              className="input"
              placeholder={t('First step')}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              enterKeyHint="done"
              aria-label={t('First step')}
            />
            <button className="btn-primary shrink-0" disabled={!first.trim()}>
              {t('Add')}
            </button>
          </form>
        )}

        <div className="mt-4 flex items-center gap-2">
            {total === 0 ? null : next ? (
              <button onClick={tick} disabled={snap.busy} className="btn-primary min-w-0 flex-1 px-3">
                <Icon name={next.quick ? 'check' : 'camera'} className="h-5 w-5" strokeWidth={next.quick ? 2.6 : 2} /> {t('Done')}
              </button>
            ) : (
              <button onClick={() => navigate(`/project/${project.id}`, { state: { finish: true } })} className="btn-primary min-w-0 flex-1 px-3">
                <Icon name="trophy" className="h-5 w-5" /> {t('Finish project')}
              </button>
            )}
            <button
              onClick={() => {
                if (!data.session) actions.startSession(project.id, minutes)
                ui.openSession()
              }}
              className={`btn-tinted shrink-0 px-3 tabular-nums ${total === 0 ? 'flex-1' : ''}`}
              aria-label={running ? t('Session running') : t('Start a {n}-minute session', { n: minutes })}
            >
              <Icon name="timer" className="h-5 w-5" /> {running ? t('Running') : tn(minutes, '{n} min', '{n} min')}
            </button>
            <button onClick={picker.open} disabled={picker.busy} className="btn-tinted w-11 shrink-0 px-0" aria-label={t('Add a progress photo')}>
              <Icon name="camera" className="h-5 w-5" />
            </button>
            {picker.input}
            {snap.input}
          </div>
        {snap.error && (
          <div className="mt-3">
            <PhotoError code={snap.error} onDismiss={snap.clearError} />
          </div>
        )}
        {picker.error && (
          <div className="mt-3">
            <PhotoError code={picker.error} onDismiss={picker.clearError} />
          </div>
        )}
      </div>
    </article>
  )
}

// Several projects: one is open, the others wait as one-line rows; tap a row to bring it up
function FocusStack({ projects }) {
  const { t } = useT()
  const { data, actions } = useStore()
  // Open: the one you chose, else the one with a running session, else the one you touched last
  const lastTouched = (p) => Math.max(p.createdAt || 0, ...p.milestones.map((m) => m.doneAt || 0), ...p.sessions.map((x) => x.at), ...p.entries.map((e) => e.at))
  const focus =
    projects.find((p) => p.id === data.focusId) ||
    projects.find((p) => p.id === data.session?.projectId) ||
    [...projects].sort((a, b) => lastTouched(b) - lastTouched(a))[0]
  const rest = projects.filter((p) => p !== focus)
  return (
    <div className="mt-5">
      <div key={focus.id} className="animate-rise">
        <ProjectCard project={focus} />
      </div>
      <ul className="surface mt-4 divide-y divide-line/15 overflow-hidden">
        {rest.map((p) => {
          const next = p.milestones.find((m) => !m.done)
          return (
            <li key={p.id}>
              <button onClick={() => actions.focusProject(p.id)} className="row min-h-[68px] py-2 text-left active:bg-mist">
                <ProjectThumb project={p} className="h-11 w-11 rounded-[10px]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-semibold">{p.title}</span>
                  <span className="block truncate text-[15px] text-ink">{next ? next.text : p.milestones.length ? t('Every step is done.') : t('First step')}</span>
                </span>
                <Icon name="chevron" className="h-5 w-5 shrink-0 rotate-90 text-ink/30" />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Nothing on the go: three ideas that start a project in one tap, or your own
function StartCard({ hasFinished }) {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const prefs = data.me.prefs
  const starters = pickStarters(prefs?.interests || [], prefs?.budget)
  return (
    <section className="mt-6">
      <h2 className="px-1 text-[22px] font-bold tracking-tight">{hasFinished ? t('What’s next?') : t('Start your first project')}</h2>
      <ul data-axo-target="starters" className="surface mt-3 divide-y divide-line/15 overflow-hidden">
        {starters.map((idea) => {
          const { guide } = planForName(idea.title, idea.category)
          return (
            <li key={idea.title}>
              <button onClick={() => navigate(`/project/${startIdea(actions, idea, prefs, lang)}`)} className="row min-h-[72px] py-2 active:bg-mist">
                <IdeaPhoto guide={guide} className="h-14 w-14 shrink-0 rounded-[12px]" eager />
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-medium leading-snug">{ideaTitle(idea, lang)}</span>
                  <span className="block text-[13px] text-sub">{t(COST_LABEL[idea.cost])}</span>
                </span>
                <span className="btn-primary min-h-[34px] shrink-0 px-4 text-[15px]">{t('Start')}</span>
              </button>
            </li>
          )
        })}
        <li>
          <button onClick={() => setCreating(true)} className="row min-h-[56px] text-[17px] text-spark-ink active:bg-mist">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center">
              <Icon name="plus" className="h-6 w-6" />
            </span>
            {t('My own idea')}
          </button>
        </li>
      </ul>
      <Link to="/ideas" className="mt-3 flex h-11 items-center justify-center text-[15px] font-medium text-spark-ink active:opacity-60">
        {t('Browse all ideas')}
      </Link>
      {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
    </section>
  )
}

function ChallengeRows() {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const joined = CHALLENGES.map((ch) => ({ ch, s: challengeState(ch, data.challenges[ch.id], data.challengeWins) })).filter((x) => x.s.joined)
  if (!joined.length) return null
  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Challenges')}</h2>
      <ul className="surface divide-y divide-line/15 overflow-hidden">
        {joined.map(({ ch, s }) => (
          <li key={ch.id} className="row min-h-[60px]">
            <Link to={`/challenge/${ch.id}`} className="min-w-0 flex-1 py-2 active:opacity-60">
              <span className="block truncate text-[17px]">{pick(ch.title, lang)}</span>
              <span className="block text-[13px] tabular-nums text-sub">
                {s.won ? t('Finished this month') : t('{n} of {goal} days', { n: s.days.length, goal: ch.goal })}
              </span>
            </Link>
            {s.won || s.doneToday ? (
              <span className="flex h-9 items-center gap-1 text-[15px] font-semibold text-good">
                <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> {t('Today')}
              </span>
            ) : s.reachable ? (
              <button onClick={() => actions.checkInChallenge(ch.id)} className="btn-tinted min-h-[36px] px-4 text-[15px]">
                {t('Did it')}
              </button>
            ) : (
              <span className="text-[13px] text-sub">{t('Next month')}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

// Mondays and the 1st of the month: a fresh start (people start goals far more often after such "new beginnings",
// Dai, Milkman & Riis 2014). One card, once that day, straight to your next step.
const FRESH = 'blank-fresh'
function FreshStart({ project }) {
  const { t } = useT()
  const today = new Date().toISOString().slice(0, 10)
  const [gone, setGone] = useState(() => {
    try {
      return localStorage.getItem(FRESH) === today
    } catch {
      return true
    }
  })
  const d = new Date()
  const kind = d.getDate() === 1 ? 'month' : d.getDay() === 1 ? 'week' : null
  const next = project?.milestones.find((m) => !m.done)
  if (!kind || gone || !next) return null
  const close = () => {
    setGone(true)
    try {
      localStorage.setItem(FRESH, today)
    } catch {}
  }
  return (
    <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-spark px-4 py-3.5 text-white lg:mt-8">
      <Link to={`/project/${project.id}`} onClick={close} className="min-w-0 flex-1 active:opacity-80">
        <span className="block text-[17px] font-bold leading-tight">{kind === 'month' ? t('New month, fresh start') : t('New week, fresh start')}</span>
        <span className="mt-0.5 block truncate text-[15px] text-white/85">{t('First up: {step}', { step: next.text })}</span>
      </Link>
      <button onClick={close} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 active:bg-white/25" aria-label={t('Close')}>
        <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  )
}

// Sundays: "Show your week". The step photos you took this week are the post already; you take out what you don't want.
const WEEK = 'blank-week-shown'
function YourWeek() {
  const { data } = useStore()
  const { t } = useT()
  const ui = useUi()
  const today = new Date().toISOString().slice(0, 10)
  const [gone, setGone] = useState(() => {
    try {
      return localStorage.getItem(WEEK) === today
    } catch {
      return true
    }
  })
  const monday = new Date()
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const week = data.projects
    .flatMap((p) => (p.entries || []).filter((e) => e.photo && e.at >= monday.getTime()).map((e) => ({ ...e, p })))
    .sort((a, b) => a.at - b.at)
  if (new Date().getDay() !== 0 || gone || week.length < 2) return null
  const close = () => {
    setGone(true)
    try {
      localStorage.setItem(WEEK, today)
    } catch {}
  }
  // The project you worked on most this week names the post
  const top = Object.values(week.reduce((m, e) => ({ ...m, [e.p.id]: { p: e.p, n: (m[e.p.id]?.n || 0) + 1 } }), {})).sort((a, b) => b.n - a.n)[0].p
  return (
    <section className="surface mt-5 p-4 lg:mt-8">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold leading-tight">{t('Show your week')}</p>
          <p className="mt-0.5 text-[15px] text-sub">{t('{n} photos of what you made this week. Share them with your friends?', { n: week.length })}</p>
        </div>
        <button onClick={close} className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist" aria-label={t('Close')}>
          <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {week.slice(-4).map((e) => (
          <WeekThumb key={e.id} photo={e.photo} />
        ))}
      </div>
      <button
        onClick={() => {
          close()
          ui.share({ project: top.title, category: top.category, kind: 'update', text: '', photos: week.slice(-10).map((e) => ({ photo: e.photo, ratio: e.ratio })) })
        }}
        className="btn-primary mt-3 w-full"
      >
        {t('Post my week')}
      </button>
    </section>
  )
}
function WeekThumb({ photo }) {
  const url = usePhoto(photo)
  return <span className="aspect-square flex-1 overflow-hidden rounded-[12px] bg-mist">{url && <img src={url} alt="" className="h-full w-full object-cover" />}</span>
}

// No account yet and the first real step is done: offer to keep it safe (without one it lives only on this phone)
const SAVE = 'blank-save-asked'
function SaveProgress() {
  const { data } = useStore()
  const { account } = useAccount()
  const { t } = useT()
  const [sheet, setSheet] = useState(false)
  const [gone, setGone] = useState(() => {
    try {
      return !!localStorage.getItem(SAVE)
    } catch {
      return true
    }
  })
  const started = data.projects.some((p) => p.milestones.some((m) => m.done && !m.auto && !m.quick))
  if (account || gone || !started) return sheet ? <LoginSheet initialMode="signup" onClose={() => setSheet(false)} /> : null
  const close = () => {
    setGone(true)
    try {
      localStorage.setItem(SAVE, '1')
    } catch {}
  }
  return (
    <section className="surface mt-5 flex items-start gap-3 p-4 lg:mt-8">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
        <Icon name="lock" className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-semibold leading-tight">{t('Don’t lose your progress')}</p>
        <p className="mt-0.5 text-[15px] leading-snug text-sub">{t('Right now it’s only on this phone. With an account it’s safe, and you can post what you make.')}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => setSheet(true)} className="btn-primary min-h-[38px] px-4 text-[15px]">
            {t('Create account')}
          </button>
          <button onClick={close} className="btn-plain min-h-[38px] px-4 text-[15px]">
            {t('Not now')}
          </button>
        </div>
      </div>
      {sheet && <LoginSheet initialMode="signup" onClose={() => setSheet(false)} />}
    </section>
  )
}

export default function Today() {
  const { active, done, data } = useStore()
  const { account } = useAccount()
  const { t, fmt } = useT()

  return (
    <div className="mx-auto max-w-2xl pt-6 lg:max-w-[1760px] lg:pt-10">
      <p className="px-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">
        {fmt.date(Date.now(), { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
      <div className="flex items-end justify-between gap-3 px-1">
        <h1 className="large-title">{t('Today')}</h1>
      </div>

      <FreshStart project={active[0]} />
      <YourWeek />
      <SaveProgress />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12 xl:grid-cols-[minmax(0,1fr)_440px] 2xl:grid-cols-[minmax(0,1fr)_520px] 2xl:gap-16">
        <div>
          {active.length > 0 ? (
            active.length < 2 ? (
              <div className="mt-5 space-y-4 lg:mt-8">
                {active.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <FocusStack projects={active} />
            )
          ) : (
            <StartCard hasFinished={done.length > 0} />
          )}
        </div>

        <aside className="lg:mt-8 lg:[&>section:first-child]:mt-0">
          {/* With an account: doing it together in a project chat; Buddy stays for people without one (or already paired) */}
          {account && !data.buddy ? <TogetherToday /> : <BuddyCard />}
          <ChallengeRows />

          {done.length > 0 && (
            <section className="mt-8">
              <h2 className="section-label">{t('Finished')}</h2>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
                {done.map((p) => (
                  <Link key={p.id} to={`/project/${p.id}`} className="w-[120px] shrink-0 active:opacity-70 lg:w-auto">
                    <ProjectThumb project={p} className="aspect-square w-full rounded-[16px]" />
                    <span className="mt-1.5 line-clamp-2 block text-[13px] font-medium leading-tight">{p.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

    </div>
  )
}
