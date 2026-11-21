// The axolotl as the app's assistant: it peeks in from the bottom at the right moment with one short line and one
// action, then gets out of the way. Tap it to ask about your project. Also: the streak axolotl in the header.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { onActivity, useStore } from '../store'
import { useT } from '../i18n'
import { ideaTitle, sessionMinutes } from '../data'
import { Icon, useAnySheetOpen, usePhotoPicker, PhotoError } from '../components/ui'
import { pickStarters, startIdea } from '../pages/Onboarding'
import Mascot from './Mascot'
import { fx, svgIn } from './motion'
import { needsTodayOf, useHour, useStreakAxo } from './mood'
import { loadMemory, pickTip, remember, rememberClosed, saveMemory, focusProject } from './tips'
import AskSheet from './AskSheet'
import SplitSheet from './SplitSheet'
import { useStepPhoto } from '../components/StepPhoto'

const Ctx = createContext(null)
export const useAssistant = () => useContext(Ctx)

export function AssistantProvider({ openSession, children }) {
  const [ask, setAsk] = useState(null) // { projectId, prompt }
  const [split, setSplit] = useState(null) // { projectId, stepId }
  const [tipHeight, setTipHeight] = useState(0)
  const value = useMemo(
    () => ({
      openAsk: (opts = {}) => setAsk(opts),
      openSplit: (projectId, stepId) => setSplit({ projectId, stepId }),
      openSession,
      tipHeight,
      setTipHeight,
    }),
    [openSession, tipHeight],
  )
  const closeAsk = useCallback(() => setAsk(null), [])
  const closeSplit = useCallback(() => setSplit(null), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      {ask && <AskSheet projectId={ask.projectId} prompt={ask.prompt} onClose={closeAsk} />}
      {split && <SplitSheet projectId={split.projectId} stepId={split.stepId} onClose={closeSplit} />}
    </Ctx.Provider>
  )
}

// ---------- the streak, as the axolotl (header) ----------

export function StreakAxo() {
  const { t, tn } = useT()
  const { streak, weekDone, mood, bump, change } = useStreakAxo()
  const box = useRef(null)
  useEffect(() => {
    if (!bump) return
    const svg = svgIn(box.current)
    fx.streakBump(svg, change.from, change.to)
    fx.hop(svg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bump])
  return (
    <Link
      ref={box}
      to="/streak"
      className="-mr-1 flex h-11 items-center justify-center rounded-full pl-1 pr-1 active:opacity-70"
      aria-label={`${t('Streak')}: ${tn(streak, '{n} week', '{n} weeks')}${weekDone ? '' : `, ${t('this week isn’t done yet')}`}`}
    >
      <Mascot size={44} streak={streak} mood={mood} title="" />
    </Link>
  )
}

// ---------- the tip that peeks in ----------

const routeOf = (pathname) => {
  if (pathname === '/') return { route: 'today' }
  const m = pathname.match(/^\/project\/([^/]+)$/)
  if (m) return { route: 'project', projectId: decodeURIComponent(m[1]) }
  return { route: 'other' }
}

export function Peek() {
  const store = useStore()
  const { data, streak, doneToday, active, done, actions } = store
  const needsToday = needsTodayOf(store)
  const { t, lang } = useT()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const assistant = useAssistant()
  const sheetOpen = useAnySheetOpen()
  const hour = useHour()
  const memRef = useRef(loadMemory())
  const [queue, setQueue] = useState([]) // things that just happened, oldest first
  const event = queue[0] || null
  const push = (e) => setQueue((q) => [...q.filter((x) => x.key !== e.key), e].slice(-4))
  const [tip, setTip] = useState(null)
  const [leaving, setLeaving] = useState(false)
  const [hold, setHold] = useState(false)
  const box = useRef(null)
  const card = useRef(null)
  const mascot = useRef(null)
  const minutes = sessionMinutes(data.me.prefs)
  const tipRoute = useRef(null)

  const photoTarget = useRef(null)
  const picker = usePhotoPicker(async ({ ref, ratio }) => {
    const pid = photoTarget.current
    if (!pid) return
    actions.addEntry(pid, { photo: ref, ratio })
    const p = data.projects.find((x) => x.id === pid)
    actions.toast({ text: 'Photo added to {title}', vars: { title: p?.title || '' }, link: `/project/${pid}` })
    hide()
  })
  // Ticking a step from a tip asks for its photo first
  const snap = useStepPhoto(() => hide())

  const writeMem = (m) => {
    memRef.current = m
    saveMemory(m)
  }

  // Things you just did
  useEffect(
    () =>
      onActivity((evt) => {
        const at = Date.now()
        if (evt.kind === 'session') push({ key: `s${at}`, type: 'session', projectId: evt.projectId, minutes: evt.minutes, at })
        if (evt.kind === 'finish') push({ key: `f${evt.projectId}`, type: 'finish', projectId: evt.projectId, at })
        if (evt.kind === 'outfit') push({ key: `o${evt.outfit}`, type: 'outfit', outfit: evt.outfit, at })
      }),
    [],
  )

  // Your buddy nudged you (seen on the next sync)
  const cache = data.buddy?.cache
  useEffect(() => {
    const n = cache?.checkins?.find((c) => c.kind === 'nudge' && !c.mine)
    if (!n || n.created <= memRef.current.nudge) return
    writeMem({ ...memRef.current, nudge: n.created })
    if (Date.now() - n.created < 12 * 3600_000 && cache.buddy) push({ key: `n${n.created}`, type: 'nudge', name: cache.buddy.name, at: n.created })
  }, [cache])

  const hide = useCallback(() => {
    setLeaving(true)
    const svg = svgIn(mascot.current)
    Promise.race([fx.peekOut(svg), new Promise((r) => setTimeout(r, 420))]).then(() => {
      setTip(null)
      setLeaving(false)
      setHold(false)
    })
  }, [])

  // Decide, a moment after things settle
  useEffect(() => {
    if (tip || sheetOpen) return
    // Something that happened a while ago (a sheet was open the whole time) isn't news any more
    const maxAge = { session: 120_000, finish: 120_000, outfit: 600_000 }[event?.type]
    if (event && maxAge && Date.now() - event.at > maxAge) {
      setQueue((q) => q.slice(1))
      return
    }
    const { route, projectId } = routeOf(pathname)
    const delay = event ? (event.type === 'finish' ? 1100 : 650) : 1400
    const id = setTimeout(() => {
      const starter = pickStarters(data.me.prefs?.interests || [], data.me.prefs?.budget)[0]
      const next = pickTip(
        {
          data,
          streak,
          doneToday,
          needsToday,
          active,
          done,
          route,
          projectId,
          hour,
          now: Date.now(),
          minutes,
          starter: starter && { idea: starter, label: ideaTitle(starter, lang) },
          event,
        },
        memRef.current,
      )
      if (event) setQueue((q) => q.slice(1))
      if (!next) return
      writeMem(remember(memRef.current, next, Date.now()))
      tipRoute.current = next.event ? null : pathname
      setTip({ ...next, starter })
    }, delay)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, event, sheetOpen, tip, data, streak, doneToday, needsToday, hour, lang])

  // A tip about this screen leaves with it
  useEffect(() => {
    if (tip && tipRoute.current && tipRoute.current !== pathname) {
      setTip(null)
      setLeaving(false)
    }
  }, [pathname, tip])

  // A sheet opening over it sends it away too
  useEffect(() => {
    if (tip && sheetOpen) {
      setTip(null)
      setLeaving(false)
    }
  }, [sheetOpen, tip])

  // Entrance: peek in, then look at the thing it means
  useLayoutEffect(() => {
    if (!tip) return
    const svg = svgIn(mascot.current)
    fx.peekIn(svg)
    const target = tip.target && document.querySelector(tip.target)
    const id = target ? setTimeout(() => fx.lookAt(svg, target), 520) : null
    return () => id && clearTimeout(id)
  }, [tip])

  // …and out again on its own if you don't touch it
  useEffect(() => {
    if (!tip || hold || leaving) return
    const id = setTimeout(hide, tip.event ? 16000 : 9000)
    return () => clearTimeout(id)
  }, [tip, hold, leaving, hide])

  // The layout lifts toasts above the tip
  useLayoutEffect(() => {
    if (!tip || !box.current) return assistant.setTipHeight(0)
    const el = box.current
    const ro = new ResizeObserver(() => assistant.setTipHeight(el.offsetHeight))
    ro.observe(el)
    return () => {
      ro.disconnect()
      assistant.setTipHeight(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip])

  if (!tip) return <>{picker.input}{snap.input}</>

  const close = () => {
    writeMem(rememberClosed(memRef.current, tip, Date.now()))
    hide()
  }
  const run = (a) => {
    const p = a.projectId && data.projects.find((x) => x.id === a.projectId)
    switch (a.type) {
      case 'session':
        if (p && !data.session) actions.startSession(p.id, minutes)
        if (data.session && data.session.projectId !== a.projectId) return navigate(`/project/${data.session.projectId}`)
        assistant.openSession()
        break
      case 'tick':
        {
          const step = p?.milestones.find((m) => m.id === a.stepId && !m.done)
          if (!step) break
          snap.open(p.id, step)
        }
        return // the tip leaves once the photo is in
      case 'photo':
        photoTarget.current = a.projectId
        picker.open()
        return // the tip leaves once the photo is in
      case 'split':
        assistant.openSplit(a.projectId, a.stepId)
        break
      case 'reel':
        navigate(`/project/${a.projectId}`, { state: { reel: true } })
        break
      case 'starter':
        if (tip.starter) navigate(`/project/${startIdea(actions, tip.starter, data.me.prefs, lang)}`)
        break
      case 'go':
        navigate(a.to)
        break
      case 'wear':
        actions.setMe({ outfit: { ...(data.me.outfit || {}), [a.slot]: a.item } })
        break
      default:
    }
    hide()
  }

  const askAbout = () => {
    fx.boop(svgIn(mascot.current))
    const pid = tip.action?.projectId || focusProject(data, active)?.id
    setTimeout(() => {
      setTip(null)
      assistant.openAsk({ projectId: pid })
    }, 180)
  }

  const raised = data.session ? 56 : 0
  return (
    <>
    {picker.input}
    {snap.input}
    <div
      ref={box}
      className="pointer-events-none fixed inset-x-3 z-40 mx-auto max-w-[420px] pt-14 md:left-auto md:right-6 md:mx-0 md:w-[380px]"
      style={{ bottom: `calc(var(--tip-base) + ${raised}px)` }}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
    >
      <button
        ref={mascot}
        type="button"
        onClick={askAbout}
        className={`pointer-events-auto absolute left-4 top-0 z-20 h-[76px] w-[76px] ${leaving ? 'axo-tip-out' : 'axo-tip-in'}`}
        style={{ clipPath: 'inset(-60px -60px 14px -60px)' }}
        aria-label={t('Ask the axolotl')}
      >
        {/* Its paws rest on the card's top edge, the way it peeks over things in the drawings; it rises from just below that edge */}
        <Mascot size={76} peek mood={tip.mood} outfit={tip.outfit ? { ...(data.me.outfit || {}), ...tip.outfit } : undefined} />
      </button>
      <div
        ref={card}
        role="status"
        className={`bar pointer-events-auto relative z-10 flex items-center gap-2 rounded-[22px] py-2 pl-4 pr-2 shadow-pop ${leaving ? 'axo-card-out' : 'axo-card-in'}`}
      >
        <p className="min-w-0 flex-1 py-1 text-[15px] font-medium leading-snug">
          {t(tip.text, { ...tip.vars, ...Object.fromEntries(Object.entries(tip.tvars || {}).map(([k, v]) => [k, t(v)])) })}
        </p>
        {tip.photo && (
          <button
            onClick={() => run({ type: 'photo', projectId: tip.photo.projectId })}
            disabled={picker.busy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink active:scale-95"
            aria-label={t('Add a progress photo')}
          >
            <Icon name="camera" className="h-[18px] w-[18px]" />
          </button>
        )}
        <button onClick={() => run(tip.action)} className="btn-primary min-h-[36px] shrink-0 gap-1.5 px-4 text-[15px]">
          {tip.action.icon && <Icon name={tip.action.icon} className="h-4 w-4" strokeWidth={2.6} />}
          {t(tip.action.label, tip.action.vars)}
        </button>
        <button onClick={close} className="-ml-1 flex h-9 w-8 shrink-0 items-center justify-center text-sub active:opacity-60" aria-label={t('Close')}>
          <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>
      {(picker.error || snap.error) && (
        <div className="pointer-events-auto mt-2">
          <PhotoError code={picker.error || snap.error} onDismiss={() => (picker.clearError(), snap.clearError())} />
        </div>
      )}
    </div>
    </>
  )
}
