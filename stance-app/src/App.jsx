// The shell: three tabs (Today, Practice, You), screens pushed on top of them, and the account sheet.
// Navigation lives in the URL and in browser history, so Back, the iOS edge swipe, reload and shared links all work.
// Who you are is cached on the device, so the app opens straight into content; only a 401 signs you out.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { api, clearCache, getKey, setKey } from './api.js'
import { disablePush, registerWorker, setBadge, syncPush } from './device.js'
import { audioCtx } from './audio.js'
import { t } from './i18n.js'
import Today, { Archive, OpinionPage, QuestionPage } from './Today.jsx'
import { DebatePage, DebatesPage, NewDebate } from './Debates.jsx'
import Practice, { MinutePage } from './Minute.jsx'
import { TopicsPage } from './topics.jsx'
import { SparPage } from './spar.jsx'
import { Me, Profile } from './Profile.jsx'
import AccountSheet from './Onboarding.jsx'
import { AppContext, Confirm, Icon, OfflinePill, spring, useInterval, useToasts } from './ui.jsx'

const TABS = [
  { id: 'today', icon: Icon.Today, on: Icon.TodayFill },
  { id: 'practice', icon: Icon.Practice, on: Icon.PracticeFill },
  { id: 'you', icon: Icon.You, on: Icon.YouFill },
]

// ---------- routes ----------

const newKey = () => Math.random().toString(36).slice(2)
const hashOf = e => ({
  question: () => `q/${e.id}${e.opinionId ? '/' + e.opinionId : ''}`,
  opinion: () => `opinion/${e.id}`,
  debate: () => `debate/${e.id}`,
  debates: () => `debates${e.seg ? '/' + e.seg : ''}`,
  profile: () => `user/${e.handle}`,
  archive: () => 'archive',
  minute: () => `minute/${e.id}`,
  spar: () => `spar/${e.qid}`,
  topics: () => 'topics',
}[e.type]())
const urlOf = nav => '#' + (nav.stack.length ? hashOf(nav.stack[nav.stack.length - 1]) : nav.tab)
const same = (a, b) => hashOf(a) === hashOf(b)

/** '#q/id/op', '#debate/id', '#user/handle', '#practice', … → { tab } | { entry } | null */
function parse(hash) {
  const m = String(hash || '').replace(/^#/, '').match(/^(\w+)(?:\/([\w-]+))?(?:\/([\w-]+))?$/)
  if (!m) return null
  const [, kind, id, sub] = m
  if (kind === 'today' || kind === 'you') return { tab: kind }
  if (kind === 'practice' || kind === 'minute' && !id) return { tab: 'practice' }
  if (kind === 'archive') return { entry: { type: 'archive' } }
  if (kind === 'topics') return { entry: { type: 'topics' } }
  if (kind === 'debates') return { entry: { type: 'debates', ...(id ? { seg: id } : {}) } }
  if (!id) return null
  if (kind === 'q') return { entry: { type: 'question', id, ...(sub ? { opinionId: sub } : {}) } }
  if (kind === 'opinion') return { entry: { type: 'opinion', id } }
  if (kind === 'debate') return { entry: { type: 'debate', id } }
  if (kind === 'user') return { entry: { type: 'profile', handle: id.toLowerCase() } }
  if (kind === 'minute') return { entry: { type: 'minute', id } }
  if (kind === 'spar') return { entry: { type: 'spar', qid: id } }
  return null
}

// Where the app starts: the saved history entry on reload, else the link it was opened with
const BOOT = (() => {
  const saved = history.state?.stance
  if (saved) return saved
  const r = parse(location.hash)
  if (r?.entry) {
    // Back from a shared link lands on Today, not outside the app
    history.replaceState({ stance: { tab: 'today', stack: [] } }, '', '#today')
    const nav = { tab: 'today', stack: [{ ...r.entry, key: newKey() }] }
    history.pushState({ stance: nav }, '', urlOf(nav))
    return nav
  }
  const nav = { tab: r?.tab || 'today', stack: [] }
  history.replaceState({ stance: nav }, '', location.hash ? urlOf(nav) : location.pathname)
  return nav
})()

// ---------- identity cache ----------

const ME = 'stance.me'
const readMe = () => { try { return JSON.parse(localStorage.getItem(ME)) } catch { return null } }
const writeMe = v => { try { v ? localStorage.setItem(ME, JSON.stringify(v)) : localStorage.removeItem(ME) } catch {} }

export default function App() {
  const [toast, toasts, clearToasts] = useToasts()
  const cached = getKey() ? readMe() : null
  // undefined = signed in but not loaded yet (first open after signing in elsewhere); null = guest
  const [me, setMeState] = useState(cached ? cached.user : getKey() ? undefined : null)
  const [passkeys, setPasskeys] = useState(cached?.passkeys || 0)
  const [waiting, setWaiting] = useState(cached?.waiting || 0)
  const [nav, setNav] = useState(BOOT)
  const [account, setAccount] = useState(null)
  const [newDebate, setNewDebate] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const navRef = useRef(nav)
  navRef.current = nav
  const meRef = useRef(me)
  meRef.current = me

  const setMe = user => {
    setMeState(user)
    const c = readMe() || {}
    if (user) writeMe({ ...c, user })
  }
  const refreshMe = () => api('/me').then(d => {
    setMeState(d.user)
    setPasskeys(d.passkeys)
    setWaiting(d.debatesWaiting)
    setBadge(d.debatesWaiting)
    writeMe({ user: d.user, passkeys: d.passkeys, waiting: d.debatesWaiting })
  })
  const signedOut = () => {
    setKey(null); writeMe(null); clearCache(); setBadge(0)
    setMeState(null); setPasskeys(0); setWaiting(0)
    setRefresh(r => r + 1)
  }

  // ---------- navigation ----------

  const go = (next, mode) => { history[mode]({ stance: next }, '', urlOf(next)); setNav(next) }
  const push = entry => {
    const n = navRef.current
    const e = { ...entry, key: newKey() }
    go({ tab: n.tab, stack: [...n.stack.filter(x => !same(x, e)), e] }, 'pushState')
  }
  const back = () => (navRef.current.stack.length ? history.back() : null)
  const setTab = tab => {
    go({ tab, stack: [] }, 'replaceState')
    window.scrollTo({ top: 0 })
  }
  const openLink = url => {
    const r = parse(url)
    if (r?.tab) setTab(r.tab)
    else if (r?.entry) push(r.entry)
  }

  useEffect(() => {
    // Back/forward restores the saved screens; a typed or tapped #link while open is pushed like any other screen
    const onPop = e => {
      const s = e.state?.stance
      if (s) return setNav(s)
      const r = parse(location.hash)
      const n = navRef.current
      if (r?.tab) go({ tab: r.tab, stack: [] }, 'replaceState')
      else if (r?.entry) go({ tab: n.tab, stack: [...n.stack, { ...r.entry, key: newKey() }] }, 'replaceState')
      else go(n, 'replaceState')
    }
    const onHash = () => { if (!history.state?.stance) onPop({ state: null }) }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onHash)
    registerWorker(openLink)
    if (getKey()) refreshMe().catch(e => { if (e.status === 401) signedOut() })
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onHash) }
  }, [])

  // The mic meter needs an AudioContext started inside a tap (iOS)
  useEffect(() => {
    const unlock = () => audioCtx()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const signedIn = !!me
  useEffect(() => { if (signedIn) syncPush().catch(() => {}) }, [signedIn])
  useInterval(() => meRef.current && refreshMe().catch(e => { if (e.status === 401) signedOut() }), 30000, signedIn)

  /** Runs fn once there is an account, asking for one first if needed (the first write is where a guest signs up) */
  const requireAccount = (mode = 'new') => (meRef.current ? Promise.resolve(meRef.current) : new Promise((resolve, reject) => setAccount({ mode, resolve, reject })))
  const withAccount = fn => requireAccount().then(fn, () => {})

  const ctx = {
    me, setMe, toast, refreshMe, setTab, tab: nav.tab, passkeys, setPasskeys, waiting, refresh, bump: () => setRefresh(r => r + 1),
    requireAccount, withAccount, back,
    openQuestion: (id, opinionId) => push({ type: 'question', id, ...(opinionId ? { opinionId } : {}) }),
    openOpinion: id => push({ type: 'opinion', id }),
    openArchive: () => push({ type: 'archive' }),
    openDebate: id => push({ type: 'debate', id }),
    openDebates: seg => push({ type: 'debates', ...(seg ? { seg } : {}) }),
    openProfile: handle => (handle === meRef.current?.handle ? setTab('you') : handle !== 'deleted' && push({ type: 'profile', handle })),
    openMinute: id => push({ type: 'minute', id }),
    openSpar: qid => withAccount(() => push({ type: 'spar', qid })),
    openTopics: () => withAccount(() => push({ type: 'topics' })),
    /** New debate sheet; opts: { opponent?, motion?, questionId?, opening? } */
    openNewDebate: (opts = {}) => withAccount(() => setNewDebate({ ...opts, key: newKey() })),
    replaceTop: entry => {
      const n = navRef.current
      go({ tab: n.tab, stack: [...n.stack.slice(0, -1), { ...entry, key: newKey() }] }, 'replaceState')
    },
    signIn: () => requireAccount('signin').catch(() => {}),
    signUp: () => requireAccount('new').catch(() => {}),
    signOut: () => setSigningOut(true),
    signedOut,
  }

  const doSignOut = async () => {
    await Promise.race([disablePush().catch(() => {}), new Promise(r => setTimeout(r, 1500))])
    // With a passkey, this device's key is retired on the server too. Without one the login key is the only way
    // back in, so it has to keep working.
    if (passkeys) await api('/session', { method: 'DELETE', timeout: 5000 }).catch(() => {})
    setSigningOut(false)
    signedOut()
    setTab('today')
    toast(t('you.signedOut'))
  }

  return (
    <MotionConfig reducedMotion="user" transition={spring}>
      <AppContext.Provider value={ctx}>
        {toasts}
        <OfflinePill />
        <main inert={nav.stack.length ? '' : undefined} className="relative mx-auto min-h-[100dvh] max-w-[600px] pb-[calc(env(safe-area-inset-bottom)+110px)]">
          <motion.div key={nav.tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            {nav.tab === 'today' && <Today />}
            {nav.tab === 'practice' && <Practice />}
            {nav.tab === 'you' && <Me />}
          </motion.div>
        </main>

        <TabBar tab={nav.tab} setTab={setTab} waiting={me ? waiting : 0} hidden={nav.stack.length > 0} />

        <AnimatePresence>
          {nav.stack.map((e, i) => {
            const props = { key: e.key, onBack: back, covered: i < nav.stack.length - 1 }
            if (e.type === 'question') return <QuestionPage {...props} id={e.id} opinionId={e.opinionId} />
            if (e.type === 'opinion') return <OpinionPage {...props} id={e.id} />
            if (e.type === 'archive') return <Archive {...props} />
            if (e.type === 'debate') return <DebatePage {...props} id={e.id} />
            if (e.type === 'debates') return <DebatesPage {...props} seg={e.seg} />
            if (e.type === 'minute') return <MinutePage {...props} id={e.id} />
            if (e.type === 'spar') return <SparPage {...props} qid={e.qid} />
            if (e.type === 'topics') return <TopicsPage {...props} />
            return <Profile {...props} handle={e.handle} />
          })}
        </AnimatePresence>

        {newDebate && (
          <NewDebate key={newDebate.key} {...newDebate}
            onClose={() => setNewDebate(null)}
            onCreated={d => { setNewDebate(null); ctx.bump(); push({ type: 'debate', id: d.id }) }} />
        )}

        <AccountSheet open={!!account} mode={account?.mode} onClose={() => { account?.reject(new Error('cancelled')); setAccount(null) }}
          onDone={(user, isNew) => {
            clearToasts()
            setMe(user)
            refreshMe().catch(() => {})
            setRefresh(r => r + 1)
            account?.resolve(user)
            setAccount(null)
            toast(isNew ? t('account.welcome', { name: user.name.split(' ')[0] }) : t('account.welcomeBack', { name: user.name.split(' ')[0] }))
          }} />

        <Confirm open={signingOut} onClose={() => setSigningOut(false)} title={t('you.signOutQ')} action={t('you.signOut')} onConfirm={doSignOut}>
          {passkeys ? t('you.signOutPasskey') : t('you.signOutKey')}
        </Confirm>
      </AppContext.Provider>
    </MotionConfig>
  )
}

/** Floating glass tab bar; the selected tab is the accent tint, like iOS */
function TabBar({ tab, setTab, waiting, hidden }) {
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.nav initial={{ y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 90, opacity: 0 }} transition={spring}
          className="fixed inset-x-0 bottom-[max(14px,env(safe-area-inset-bottom))] z-30 flex justify-center px-4" aria-label="Agora">
          <div className="glass flex w-full max-w-[360px] rounded-full p-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
            {TABS.map(x => {
              const on = tab === x.id
              const I = on ? x.on : x.icon
              const n = x.id === 'today' ? waiting : 0
              return (
                <button key={x.id} type="button" onClick={() => setTab(x.id)} aria-current={on ? 'page' : undefined}
                  className={`relative flex h-[54px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full transition-colors ${on ? 'text-accent-ink' : 'text-fg'}`}>
                  <I size={24} />
                  <span className="text-[11px] font-semibold">{t('tab.' + x.id)}</span>
                  {n > 0 && <span className="absolute right-[24%] top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[11px] font-bold text-white" aria-label={t('tab.waiting', { n })}>{n}</span>}
                </button>
              )
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}
