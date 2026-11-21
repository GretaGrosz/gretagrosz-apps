import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, getKey, setKey } from './api.js'
import { clearCache, prime, revalidate, useResource } from './store.js'
import { clearOutbox, onSent, restoreOutbox, useOutbox } from './outbox.js'
import { unlockAudio, usePlayer, pause, play as playItem, skip, stop, cycleSpeed, upNext } from './audio.js'
import { disablePush, registerWorker, setBadge, syncPush } from './device.js'
import { lang, onLang, t } from './i18n.js'
import Feed, { Thread } from './Feed.jsx'
import Chats, { ChatView } from './Chats.jsx'
import Friends, { Profile } from './People.jsx'
import Me, { BlockedPage } from './Me.jsx'
import Reports from './Admin.jsx'
import Recorder from './Recorder.jsx'
import Welcome from './Welcome.jsx'
import CatchUp, { useCatchUp } from './CatchUp.jsx'
import { AppContext, useApp, Avatar, Button, Icon, LoadError, Spinner, Toasts, toast } from './ui.jsx'

const TABS = [
  { id: 'feed', label: 'tabFeed', icon: Icon.Home, on: Icon.HomeFill },
  { id: 'chats', label: 'tabChats', icon: Icon.Chat, on: Icon.ChatFill },
  { id: 'friends', label: 'tabFriends', icon: Icon.Users, on: Icon.UsersFill },
  { id: 'me', label: 'tabMe' },
]
const TAB_IDS = TABS.map(x => x.id)

// Routes in the address bar, so Back, reload and links work: #feed #chats #friends #me,
// #chat/<handle> #group/<id> #post/<id> #user/<handle> #catchup #blocked #reports
export const routeOf = e => ({ chat: `chat/${e.handle}`, group: `group/${e.groupId}`, thread: `post/${e.postId}`, profile: `user/${e.handle}`, catchup: 'catchup', blocked: 'blocked', reports: 'reports' }[e.type])
export function parseRoute(hash) {
  const m = String(hash || '').replace(/^#/, '').match(/^(\w+)(?:\/([\w.-]+))?/)
  if (!m) return null
  const [, kind, id] = m
  if (TAB_IDS.includes(kind)) return { tab: kind }
  if (kind === 'chat' && id) return { entry: { type: 'chat', handle: id.toLowerCase() } }
  if (kind === 'group' && id) return { entry: { type: 'group', groupId: id } }
  if (kind === 'post' && id) return { entry: { type: 'thread', postId: id } }
  if ((kind === 'user' || kind === 'add') && id) return { entry: { type: 'profile', handle: id.toLowerCase() } }
  if (['catchup', 'blocked', 'reports'].includes(kind)) return { entry: { type: kind } }
  if (kind === 'join' && id) return { join: id }
  if (kind === 'link' && id) return { link: id }
  return null
}

const desktopQuery = typeof matchMedia !== 'undefined' ? matchMedia('(min-width: 1024px)') : null
const useDesktop = () => useSyncExternalStore(cb => { desktopQuery?.addEventListener('change', cb); return () => desktopQuery?.removeEventListener('change', cb) }, () => !!desktopQuery?.matches)
const useOnline = () => useSyncExternalStore(cb => { addEventListener('online', cb); addEventListener('offline', cb); return () => { removeEventListener('online', cb); removeEventListener('offline', cb) } }, () => navigator.onLine)

export default function App() {
  const [key, setKeyState] = useState(getKey)
  const [, setLangTick] = useState(0)
  useEffect(() => onLang(() => setLangTick(x => x + 1)), [])
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const signIn = (newKey, user) => {
    clearCache()
    setKey(newKey)
    prime('/me', { user, unread: 0, requests: 0, passkeys: 0, sessions: 1, admin: false, reports: 0 })
    setKeyState(newKey)
  }
  const signedOutHere = () => {
    stop()
    setBadge(0)
    setKey(null)
    clearCache()
    clearOutbox()
    history.replaceState(null, '', location.pathname)
    setKeyState(null)
  }
  useEffect(() => {
    const out = () => getKey() && signedOutHere()
    window.addEventListener('yap:signedout', out)
    return () => window.removeEventListener('yap:signedout', out)
  }, [])

  return (
    <>
      <Toasts />
      {key ? <SignedIn key={key + lang()} signedOutHere={signedOutHere} /> : <Welcome key={lang()} onIn={signIn} />}
    </>
  )
}

function SignedIn({ signedOutHere }) {
  const meRes = useResource('/me', { poll: 15000 })
  const me = meRes.data?.user
  const desktop = useDesktop()
  const online = useOnline()
  const [tab, setTabState] = useState('feed')
  const [stack, setStack] = useState([])
  const [recorder, setRecorder] = useState(null)
  const stackRef = useRef(stack)
  stackRef.current = stack
  const meRef = useRef(me)
  meRef.current = me
  const outbox = useOutbox()

  // ---------- history ----------
  const push = entry => {
    const e = { ...entry, key: Math.random() }
    const top = stackRef.current[stackRef.current.length - 1]
    // On a wide screen a chat replaces the open chat (the list stays beside it)
    if (desktop && tabRef.current === 'chats' && top && (top.type === 'chat' || top.type === 'group') && (e.type === 'chat' || e.type === 'group')) {
      setStack(s => [...s.slice(0, -1), e])
      history.replaceState({ depth: stackRef.current.length, entry: e }, '', '#' + routeOf(e))
      return
    }
    if (top && routeOf(top) === routeOf(e)) return
    setStack(s => [...s, e])
    history.pushState({ depth: stackRef.current.length + 1, entry: e }, '', '#' + routeOf(e))
  }
  const back = () => (history.state?.depth > 0 ? history.back() : (setStack(s => s.slice(0, -1)), history.replaceState({ depth: 0 }, '', '#' + tab)))
  useEffect(() => {
    const onPop = e => {
      const depth = e.state?.depth || 0
      setStack(s => (depth < s.length ? s.slice(0, depth) : depth > s.length && e.state?.entry ? [...s, { ...e.state.entry, key: Math.random() }] : s))
      if (!depth) {
        const r = parseRoute(location.hash)
        if (r?.tab) setTabState(r.tab)
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  // Each tab keeps its own scroll position (they share the window)
  const scrolls = useRef({})
  const tabRef = useRef(tab)
  tabRef.current = tab
  const setTab = next => {
    // Tapping the tab you're on scrolls it to the top, like iOS
    const same = next === tabRef.current
    scrolls.current[tabRef.current] = window.scrollY
    setTabState(next)
    history.replaceState({ depth: 0 }, '', '#' + next)
    requestAnimationFrame(() => window.scrollTo({ top: same ? 0 : scrolls.current[next] || 0, behavior: same ? 'smooth' : 'instant' }))
  }
  // Queued recordings that arrive refresh the lists that show them
  useEffect(() => onSent(rec => {
    if (rec.kind === 'post' || rec.kind === 'reply') { revalidate('/feed'); revalidate('/prompt'); revalidate(`/users/${meRef.current?.handle}`) }
    if (rec.kind === 'reply') revalidate(`/posts/${rec.extra?.reply_to}`)
    if (rec.kind === 'dm' || rec.kind === 'group') revalidate('/chats')
  }), [])

  // Links into the app: the address bar on open, invites, and taps on notifications
  const openLink = async url => {
    const r = parseRoute(url)
    if (!r) return
    if (r.tab) return setTab(r.tab)
    if (r.entry) return push(r.entry)
    if (r.join) {
      try {
        const { user } = await api(`/invite/${r.join}/accept`, { method: 'POST' })
        revalidate('/friends'); revalidate('/chats')
        if (user.relation === 'friend') { toast(t('nowFriends', { name: user.name })); push({ type: 'profile', handle: user.handle }) }
      } catch (e) { toast(e.message, 'error') }
    }
  }
  useEffect(() => {
    const start = location.hash
    const r = parseRoute(start)
    // A chat opened from a link or a reload sits on top of the Chats tab, so Back lands there
    const under = r?.tab || (['chat', 'group'].includes(r?.entry?.type) ? 'chats' : r?.entry?.type === 'profile' ? 'friends' : 'feed')
    history.replaceState({ depth: 0 }, '', '#' + under)
    setTabState(under)
    if (r && !r.tab) openLink(start)
    registerWorker(openLink)
    syncPush().catch(() => {})
    restoreOutbox()
  }, [])

  // The account's language follows the app's, so notifications arrive in it too
  useEffect(() => {
    if (me && me.lang !== lang()) api('/me', { method: 'PATCH', body: { lang: lang() } }).then(() => revalidate('/me')).catch(() => {})
  }, [me?.lang])
  useEffect(() => { if (meRes.data) setBadge(meRes.data.unread + meRes.data.requests) }, [meRes.data?.unread, meRes.data?.requests])

  const signOut = async ({ everywhere = false } = {}) => {
    stop()
    await Promise.race([disablePush().catch(() => {}), new Promise(r => setTimeout(r, 1500))])
    if (everywhere) await api('/sessions/revoke', { method: 'POST' }).catch(() => {})
    await Promise.race([api('/session', { method: 'DELETE' }).catch(() => {}), new Promise(r => setTimeout(r, 2500))])
    signedOutHere()
  }

  const ctx = {
    me, meData: meRes.data, desktop, tab, setTab, toast,
    refreshMe: () => revalidate('/me'),
    setMe: patch => prime('/me', { ...meRes.data, user: { ...me, ...(typeof patch === 'function' ? patch(me) : patch) } }),
    openProfile: handle => (handle === me?.handle ? (setStack([]), setTab('me')) : push({ type: 'profile', handle })),
    openThread: postId => push({ type: 'thread', postId }),
    // On a wide screen a chat opens beside the chat list
    openChat: handle => { if (desktop && !stack.length && tab !== 'chats') setTab('chats'); push({ type: 'chat', handle }) },
    openGroup: groupId => { if (desktop && !stack.length && tab !== 'chats') setTab('chats'); push({ type: 'group', groupId }) },
    openCatchUp: () => push({ type: 'catchup' }),
    openBlocked: () => push({ type: 'blocked' }),
    openReports: () => push({ type: 'reports' }),
    openRecorder: (target, onSent) => setRecorder({ target, onSent, key: Math.random() }),
    back, signOut, pendingSends: outbox.length,
  }

  if (!me) {
    return (
      <div className="grid min-h-[100dvh] place-items-center">
        {meRes.error ? <LoadError onRetry={meRes.reload} /> : <Spinner size={26} />}
      </div>
    )
  }

  const top = stack[stack.length - 1]
  const chatOpen = desktop && tab === 'chats' && stack.length === 1 && (top.type === 'chat' || top.type === 'group')
  return (
    <AppContext.Provider value={ctx}>
      <div id="app-base">
        <TabBar tab={tab} setTab={setTab} badges={meRes.data} me={me} />
        <main className={`relative min-h-[100dvh] px-4 lg:ml-[240px] lg:px-8 ${tab === 'chats' && desktop ? 'lg:mr-0 lg:w-[380px] lg:border-r lg:border-line lg:px-4' : ''}`}>
          <div className={tab === 'chats' && desktop ? '' : 'mx-auto max-w-[640px]'}>
            <div hidden={tab !== 'feed'}><Feed active={tab === 'feed' && !stack.length} /></div>
            <div hidden={tab !== 'chats'}><Chats active={tab === 'chats'} selected={chatOpen ? top : null} /></div>
            <div hidden={tab !== 'friends'}><Friends active={tab === 'friends' && !stack.length} /></div>
            <div hidden={tab !== 'me'}><Me active={tab === 'me' && !stack.length} /></div>
          </div>
        </main>
        <MiniPlayer lifted={!stack.length || chatOpen} />
        {!online && <div className="pointer-events-none fixed inset-x-0 top-[max(8px,env(safe-area-inset-top))] z-[90] flex justify-center"><span className="flex items-center gap-1.5 rounded-full bg-[var(--toast)] px-3 py-1 text-[13px] font-medium text-[var(--toast-ink)]"><Icon.Wifi size={14} /> {t('offline')}</span></div>}
      </div>

      <AnimatePresence>
        {stack.map(entry => {
          const close = back
          if (entry.type === 'profile') return <Profile key={entry.key} handle={entry.handle} onBack={close} />
          if (entry.type === 'chat' || entry.type === 'group') return <ChatView key={entry.key} handle={entry.handle} groupId={entry.groupId} onBack={close} pane={chatOpen && entry === top} />
          if (entry.type === 'thread') return <Thread key={entry.key} postId={entry.postId} onClose={close} />
          if (entry.type === 'catchup') return <CatchUp key={entry.key} onClose={close} />
          if (entry.type === 'blocked') return <BlockedPage key={entry.key} onBack={close} />
          if (entry.type === 'reports') return <Reports key={entry.key} onBack={close} />
          return null
        })}
      </AnimatePresence>

      <AnimatePresence>
        {recorder && <Recorder key={recorder.key} target={recorder.target} onClose={() => setRecorder(null)} onSent={d => recorder.onSent?.(d)} />}
      </AnimatePresence>
    </AppContext.Provider>
  )
}

function TabBar({ tab, setTab, badges, me }) {
  const { openRecorder, openCatchUp } = useApp()
  const record = () => openRecorder({ kind: 'post' }, () => { setTab('feed'); revalidate('/feed') })
  const count = id => (id === 'chats' ? badges?.unread : id === 'friends' ? badges?.requests : 0) || 0
  return (
    <>
      {/* Phone: a glass bar at the bottom with the record button in the middle */}
      <nav className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-30 mx-auto max-w-[480px] lg:hidden" aria-label={t('tabs')}>
        <div className="glass-bar flex h-[62px] items-center justify-around rounded-full px-1">
          {TABS.slice(0, 2).map(x => <TabButton key={x.id} x={x} on={tab === x.id} n={count(x.id)} me={me} onClick={() => setTab(x.id)} />)}
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={record} className="grid h-[46px] w-[62px] place-items-center rounded-full bg-accent text-white" aria-label={t('newYap')}>
            <Icon.MicFill size={24} />
          </motion.button>
          {TABS.slice(2).map(x => <TabButton key={x.id} x={x} on={tab === x.id} n={count(x.id)} me={me} onClick={() => setTab(x.id)} />)}
        </div>
      </nav>
      {/* Wide screens: a sidebar */}
      <nav className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col gap-1 border-r border-line bg-bg px-3 pt-6 lg:flex" aria-label={t('tabs')}>
        <div className="mb-5 px-3"><Wordmark size={30} /></div>
        {TABS.map(x => {
          const I = tab === x.id ? x.on : x.icon
          const n = count(x.id)
          return (
            <button key={x.id} type="button" onClick={() => setTab(x.id)} aria-current={tab === x.id ? 'page' : undefined}
              className={`flex h-11 items-center gap-3 rounded-[10px] px-3 text-[17px] ${tab === x.id ? 'bg-fill font-semibold' : ''}`}>
              {x.id === 'me' ? <Avatar user={me} size={26} /> : <I size={24} />}
              <span className="flex-1 text-left">{t(x.label)}</span>
              {n > 0 && <span className="grid h-[20px] min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[12px] font-bold text-white">{n}</span>}
            </button>
          )
        })}
        <Button className="mt-4 h-11 w-full" onClick={record}><Icon.MicFill size={20} /> {t('newYap')}</Button>
        <Button kind="tinted" className="mt-2 h-11 w-full" onClick={openCatchUp}><Icon.Headphones size={20} /> {t('catchUp')}</Button>
      </nav>
    </>
  )
}
function TabButton({ x, on, n, me, onClick }) {
  const I = on ? x.on : x.icon
  return (
    <button type="button" onClick={onClick} aria-current={on ? 'page' : undefined} aria-label={n ? t('tabWithCount', { label: t(x.label), n }) : t(x.label)} className={`relative flex h-[56px] w-[64px] flex-col items-center justify-center gap-0.5 ${on ? 'text-accent' : 'text-label'}`}>
      {x.id === 'me' ? <span className={`rounded-full ${on ? 'ring-2 ring-accent ring-offset-1 ring-offset-transparent' : ''}`}><Avatar user={me} size={26} /></span> : <I size={26} />}
      <span className="text-[10px] font-medium">{t(x.label)}</span>
      {n > 0 && <span className="absolute right-2.5 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{n}</span>}
    </button>
  )
}

export function Wordmark({ size = 30 }) {
  return <div className="font-display font-extrabold leading-none tracking-[-0.04em]" style={{ fontSize: size }} aria-label="Yap">yap<span className="text-accent">.</span></div>
}

/** Mini player above the tabs whenever something plays; in Catch up it opens the full player */
function MiniPlayer({ lifted }) {
  const p = usePlayer()
  const cu = useCatchUp()
  const { openCatchUp } = useApp()
  const item = p.item
  const show = item && item.user && !String(item.id).startsWith('preview')
  const inCatchUp = cu.active && cu.items.some(x => x.id === item?.id)
  return (
    <AnimatePresence>
      {show && lifted && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="fixed inset-x-0 bottom-[calc(max(10px,env(safe-area-inset-bottom))+70px)] z-30 mx-auto max-w-[480px] px-3 lg:bottom-6 lg:left-[240px] lg:max-w-[520px]">
          <div className="glass-bar relative flex items-center gap-2 overflow-hidden rounded-full p-1.5 pl-2">
            <button type="button" onClick={() => inCatchUp && openCatchUp()} className="flex min-w-0 flex-1 items-center gap-2.5 text-left" aria-label={inCatchUp ? t('openCatchUp') : item.user.name}>
              <Avatar user={item.user} size={36} />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{item.user.name}</span>
                <span className="block truncate text-[13px] text-muted">{inCatchUp ? t('catchUpProgress', { n: p.index + 1, total: p.total }) : upNext().length ? t('moreUpNext', { n: upNext().length }) : item.context || t('voiceNote')}</span>
              </span>
            </button>
            <button type="button" onClick={cycleSpeed} className="h-11 min-w-[44px] rounded-full px-2 text-[14px] font-semibold tabular-nums" aria-label={t('speed')}>{p.speed}×</button>
            <button type="button" onClick={() => (p.playing ? pause() : playItem(item))} className="grid h-11 w-11 place-items-center" aria-label={p.playing ? t('pause') : t('play')}>
              {p.loading ? <Spinner size={18} /> : p.playing ? <Icon.Pause size={22} /> : <Icon.Play size={22} />}
            </button>
            {upNext().length > 0 && <button type="button" onClick={skip} className="grid h-11 w-11 place-items-center" aria-label={t('next')}><Icon.Next size={22} /></button>}
            <div className="absolute inset-x-6 bottom-0 h-[2px] rounded-full bg-fill"><div className="h-full rounded-full bg-accent" style={{ width: p.progress * 100 + '%' }} /></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

