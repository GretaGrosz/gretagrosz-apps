import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { pick } from '../guides'
import { challengeById } from '../challenges'
import { outfitItem } from './Buddy'
import { Icon, Logo, Sheet, SheetHeader, Spinner } from './ui'
import SessionSheet, { useSessionClock } from './Session'
import { PickSync } from './OutfitPick'
import { BadgeProvider, useFriendsBadge } from '../pages/Chats'
import { exportBackup } from '../backup'
import { BuddySync } from './BuddyCard'
import { SparkSync } from './Spark'
import { TogetherSync } from './Together'
import { AssistantProvider, Peek, StreakAxo, useAssistant } from '../assistant/Assistant'
import { cancelReminder } from '../reminders'
import { useAccount } from '../account'
import { useAccountPushSync } from '../notify'
import { usePhoto } from '../media'
import { PostSheet } from './Social'
import { NewProjectSheet } from './ProjectBits'

// After you tick a step with its photo: "Share this?" The photo, the step and the project are already the post, so
// sharing is two taps (this card, then Post). Once a day per project; after three "no"s in a row it stops asking
// until you post something yourself.
const OFFERED = 'blank-share-offered'
const SKIPS = 'blank-share-skips'
const readJson = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d
  } catch {
    return d
  }
}
const writeJson = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch {}
}
export const resetShareSkips = () => writeJson(SKIPS, 0)

function ShareOffer({ offer, raised, onShare, onClose }) {
  const { t } = useT()
  const url = usePhoto(offer.photo)
  useEffect(() => {
    const id = setTimeout(() => onClose(false), 12000)
    return () => clearTimeout(id)
  }, [offer, onClose])
  return (
    <div
      className="fixed inset-x-3 z-40 mx-auto flex max-w-md animate-rise items-center gap-3 rounded-[22px] bg-card p-2.5 pr-3 shadow-pop md:inset-x-auto md:right-6"
      style={{ bottom: `calc(var(--tip-base) + ${raised ? 56 : 0}px)` }}
      role="dialog"
      aria-label={t('Share this step?')}
    >
      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-[14px] bg-mist">{url && <img src={url} alt="" className="h-full w-full object-cover" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight">{t('Share this step?')}</span>
        <span className="block truncate text-[13px] text-sub">{offer.text}</span>
      </span>
      <button onClick={onShare} className="btn-primary min-h-[38px] shrink-0 px-4 text-[15px]">
        {t('Share')}
      </button>
      <button onClick={() => onClose(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist" aria-label={t('Not now')}>
        <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
      </button>
    </div>
  )
}

// A reminder is for one step: once that step is done (or the project finished or deleted), it's called off
function ReminderSync() {
  const { data, actions } = useStore()
  const live = useRef(new Set())
  useEffect(() => {
    const now = new Set()
    for (const p of data.projects) {
      const plan = p.stepPlan
      if (plan?.remind !== 'on' || plan.at < Date.now()) continue
      const step = p.milestones.find((m) => m.id === plan.stepId)
      if (p.status === 'done' || !step || step.done) {
        cancelReminder(p.id)
        actions.updateProject(p.id, { stepPlan: { ...plan, remind: 'done' } })
      } else now.add(p.id)
    }
    for (const id of live.current) if (!now.has(id) && !data.projects.some((p) => p.id === id)) cancelReminder(id)
    live.current = now
  }, [data.projects, actions])
  return null
}

const TABS = [
  { to: '/', label: 'Today', icon: 'today', end: true },
  { to: '/ideas', label: 'Ideas', icon: 'ideas' },
  { to: '/friends', label: 'Friends', icon: 'friends', badge: true },
  { to: '/you', label: 'You', icon: 'user' },
]

// New chats and friend requests, on the Friends tab
function TabBadge({ className }) {
  const { chats, requests } = useFriendsBadge()
  const n = chats + requests
  if (!n) return null
  return (
    <span className={`${className} h-[18px] min-w-[18px] items-center justify-center rounded-full bg-spark px-1 text-[11px] font-bold leading-none text-white tabular-nums`}>
      {n > 9 ? '9+' : n}
    </span>
  )
}

const UiCtx = createContext(null)
export const useUi = () => useContext(UiCtx)

function Toasts({ raised }) {
  const { toasts, dismissToast } = useStore()
  const { tipHeight } = useAssistant()
  const { t, lang } = useT()
  const navigate = useNavigate()
  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map((x) => setTimeout(() => dismissToast(x.id), x.long ? 6500 : x.action ? 5000 : 3200))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismissToast])
  const vars = (v = {}) => ({
    ...v,
    ...(v.titleKey && { title: pick(challengeById(v.titleKey)?.title, lang) }),
    ...(v.outfit && { name: t(outfitItem(v.outfit)?.name || '') }),
  })
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[70] flex flex-col items-center gap-2 px-4"
      style={{ bottom: `calc(var(--tip-base) + ${(raised ? 56 : 0) + (tipHeight ? tipHeight + 8 : 0)}px)` }}
      aria-live="polite"
    >
      {toasts.map((x) => (
        <div
          key={x.id}
          className="bar pointer-events-auto flex max-w-md animate-toast items-center gap-3 rounded-full py-2.5 pl-4 pr-2 text-[15px] font-medium shadow-pop"
        >
          <span className="min-w-0 flex-1">{t(x.text, vars(x.vars))}</span>
          {x.action ? (
            <button
              onClick={() => {
                x.action.run()
                dismissToast(x.id)
              }}
              className="h-9 shrink-0 rounded-full px-3 font-semibold text-spark-ink active:opacity-60"
            >
              {t(x.action.label)}
            </button>
          ) : x.link ? (
            <button
              onClick={() => {
                navigate(x.link)
                dismissToast(x.id)
              }}
              className="h-9 shrink-0 rounded-full px-3 font-semibold text-spark-ink active:opacity-60"
            >
              {t('Show')}
            </button>
          ) : (
            <span className="w-2" />
          )}
        </div>
      ))}
    </div>
  )
}

function SaveBanner() {
  const { saveError, loadProblem, actions, data } = useStore()
  const { t } = useT()
  const [busy, setBusy] = useState(false)
  if (!saveError && !loadProblem) return null
  if (loadProblem && !saveError) {
    return (
      <div className="mx-auto mt-2 flex max-w-3xl items-start gap-3 rounded-2xl bg-bad/10 px-4 py-3 text-[15px] text-bad" role="alert">
        <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1">{t('Saved data from an earlier visit couldn’t be read. It was set aside, not deleted.')}</p>
        <button onClick={actions.clearLoadProblem} className="-my-1 h-9 rounded-full px-3 font-semibold active:opacity-60">
          {t('OK')}
        </button>
      </div>
    )
  }
  const text =
    saveError === 'unavailable'
      ? t('This browser doesn’t allow saving (private mode?). Changes are lost when you close the tab.')
      : saveError === 'quota'
        ? t('Not saved: this browser’s storage is full. Back up your projects, then free up space.')
        : t('Your last change couldn’t be saved.')
  return (
    <div className="mx-auto mt-2 max-w-3xl rounded-2xl bg-bad/10 px-4 py-3 text-[15px] text-bad" role="alert">
      <div className="flex items-start gap-3">
        <Icon name="warning" className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="flex-1 font-medium">{text}</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 pl-8">
        {saveError !== 'unavailable' && (
          <button onClick={actions.retrySave} className="btn min-h-[36px] bg-bad px-4 text-white">
            {t('Try again')}
          </button>
        )}
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await exportBackup(data)
              actions.setMe({ lastBackup: Date.now() })
              actions.toast({ text: 'Backup saved' })
            } catch {
              actions.toast({ text: 'The backup couldn’t be made. Try again.' })
            } finally {
              setBusy(false)
            }
          }}
          className="btn min-h-[36px] bg-card px-4 text-bad disabled:opacity-50"
        >
          {busy ? <Spinner className="h-4 w-4" /> : t('Back up now')}
        </button>
      </div>
    </div>
  )
}

function SessionBar({ onOpen }) {
  const { data } = useStore()
  const { t } = useT()
  const s = data.session
  const clock = useSessionClock(s)
  const project = s && data.projects.find((p) => p.id === s.projectId)
  if (!s || !project) return null
  return (
    <button
      onClick={onOpen}
      className="bar fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+72px)] z-30 mx-auto flex h-12 max-w-md animate-rise items-center gap-3 rounded-full pl-4 pr-3 text-left shadow-pop md:bottom-6"
      aria-label={t('Session running')}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${clock.done ? 'bg-good' : 'bg-spark'}`} />
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{project.title}</span>
      <span className="font-semibold tabular-nums">{clock.done ? t('Done') : clock.label}</span>
    </button>
  )
}

// The big +: one place to make something. It asks: a new project, or a new post?
function QuickSheet({ onClose, onNew, onPost }) {
  const { t } = useT()
  const go = (fn) => () => {
    onClose()
    fn()
  }
  const rows = [
    { key: 'new', icon: 'plus', label: t('New project'), sub: t('Start something new'), run: go(onNew) },
    { key: 'post', icon: 'camera', label: t('New post'), sub: t('Show everyone what you made'), run: go(onPost) },
  ]
  return (
    <Sheet onClose={onClose} label={t('What do you want to make?')}>
      <SheetHeader title={t('What do you want to make?')} onClose={onClose} />
      <ul className="px-4 pb-2">
        {rows.map((r, i) => (
          <li key={r.key}>
            <button
              onClick={r.run}
              data-autofocus={i === 0 || undefined}
              className="flex min-h-[64px] w-full items-center gap-4 rounded-2xl px-2 text-left outline-none active:bg-mist"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-spark/15 text-spark-ink">
                <Icon name={r.icon} className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold text-ink">{r.label}</span>
                <span className="block truncate text-[14px] text-sub">{r.sub}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const { t } = useT()
  const { data } = useStore()
  const [sessionOpen, setSessionOpen] = useState(false)
  const [quick, setQuick] = useState(false)
  const [creating, setCreating] = useState(false)
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  useEffect(() => {
    if (!data.session) setSessionOpen(false)
  }, [data.session])
  const [offer, setOffer] = useState(null)
  const [sharing, setSharing] = useState(null)
  const { account } = useAccount()
  const { lang } = useT()
  useAccountPushSync(account?.token, lang)
  const ui = useMemo(
    () => ({
      openSession: () => setSessionOpen(true),
      offerShare: (o) => {
        const today = new Date().toISOString().slice(0, 10)
        const offered = readJson(OFFERED, {})
        if (offered[o.projectId] === today || readJson(SKIPS, 0) >= 3) return
        writeJson(OFFERED, { ...offered, [o.projectId]: today })
        setOffer(o)
      },
      share: (initial) => setSharing(initial),
    }),
    [],
  )
  const closeOffer = useCallback((skipped) => {
    if (skipped) writeJson(SKIPS, readJson(SKIPS, 0) + 1)
    setOffer(null)
  }, [])

  return (
    <UiCtx.Provider value={ui}>
      <AssistantProvider openSession={ui.openSession}>
      <BadgeProvider>
      <div className="min-h-[100dvh]">
        <header className="bar hairline sticky top-0 z-30 pt-[env(safe-area-inset-top)]">
          <div className="px-4 md:px-8">
          <div className="mx-auto flex h-14 max-w-[1760px] items-center gap-2">
            <Link to="/" className="-ml-1 shrink-0 rounded-[10px] p-1 active:opacity-60" aria-label="Blank">
              <Logo word />
            </Link>
            <nav className="ml-6 hidden items-center gap-1 md:flex">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-[15px] font-semibold transition ${isActive ? 'bg-ink text-card' : 'text-sub hover:text-ink'}`
                  }
                >
                  {t(tab.label)}
                  {tab.badge && <TabBadge className="ml-1.5 inline-flex align-[1px]" />}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              {/* The phone's round + button, for computers: the same quick actions */}
              <button
                onClick={() => setQuick(true)}
                aria-label={t('What do you want to make?')}
                title={t('What do you want to make?')}
                className="hidden h-9 w-9 items-center justify-center rounded-full bg-spark text-white transition hover:opacity-90 active:scale-95 md:flex"
              >
                <Icon name="plus" className="h-5 w-5" strokeWidth={2.6} />
              </button>
              <StreakAxo />
            </div>
          </div>
          </div>
        </header>

        <div className="px-4">
          <SaveBanner />
        </div>

        {/* Each page sets its own width: lists and settings stay readable, Today and Ideas use the whole screen */}
        <main className="mx-auto px-4 pb-[calc(env(safe-area-inset-bottom)+120px)] md:px-8 md:pb-16">
          <Outlet />
        </main>

        <BuddySync />
        <ReminderSync />
        <SparkSync />
        <TogetherSync />
        <Peek />
        <PickSync />
        <Toasts raised={!!data.session} />
        <SessionBar onOpen={() => setSessionOpen(true)} />
        {offer && !sharing && (
          <ShareOffer
            offer={offer}
            raised={!!data.session}
            onClose={closeOffer}
            onShare={() => {
              setSharing({ project: offer.project, category: offer.category, kind: 'update', text: offer.text, photo: offer.photo, ratio: offer.ratio })
              setOffer(null)
            }}
          />
        )}
        {sharing && (
          <PostSheet
            initial={sharing}
            onClose={() => setSharing(null)}
            onPosted={(post) => {
              resetShareSkips()
              // The Ideas feed puts it at the top right away (pages/Ideas.jsx)
              window.dispatchEvent(new CustomEvent('blank:posted', { detail: post }))
            }}
          />
        )}
        {sessionOpen && data.session && <SessionSheet onClose={() => setSessionOpen(false)} />}

        {/* Phone tab bar */}
        <nav className="fixed inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 flex justify-center px-6 md:hidden" aria-label={t('Main')}>
          <div className="bar flex w-full max-w-[380px] items-center rounded-full p-1 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_0_0_0.5px_rgb(var(--line)/0.25)]">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition ${isActive ? 'bg-ink/[0.07] text-spark-ink' : 'text-ink/70'}`
                }
              >
                <span className="relative">
                  <Icon name={tab.icon} className="h-6 w-6" />
                  {tab.badge && <TabBadge className="absolute -right-2.5 -top-1.5 flex" />}
                </span>
                {t(tab.label)}
              </NavLink>
            ))}
          </div>
          <button
            onClick={() => setQuick(true)}
            aria-label={t('What do you want to make?')}
            className="ml-2 flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-spark text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-transform active:scale-95"
          >
            <Icon name="plus" className="h-7 w-7" strokeWidth={2.6} />
          </button>
        </nav>
        {quick && <QuickSheet onClose={() => setQuick(false)} onNew={() => setCreating(true)} onPost={() => setSharing({})} />}
        {creating && <NewProjectSheet onClose={() => setCreating(false)} />}
      </div>
      </BadgeProvider>
      </AssistantProvider>
    </UiCtx.Provider>
  )
}
