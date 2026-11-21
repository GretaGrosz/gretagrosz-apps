// Your chats (worker/blank-social.js): one-to-one with a friend, and hobby crews, group chats of friends who
// keep each other going. Only friends can be in a chat with you. Shown on the Friends tab (pages/Friends.jsx).
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api } from '../social'
import { CATEGORIES, cat } from '../data'
import { Icon, Sheet, SheetHeader, Spinner } from '../components/ui'
import { Avatar, errorText } from '../components/Social'
import { categoryLabel } from '../components/ProjectBits'
import Mascot from '../assistant/Mascot'
import { catEmoji } from '../components/Together'

// The Friends tab's badge: chats with something new and friend requests waiting. Checked every minute while the app
// is open, and again whenever you move to another page (reading a chat or accepting a request clears it).
const BadgeCtx = createContext({ chats: 0, requests: 0, refresh: () => {} })
export const useFriendsBadge = () => useContext(BadgeCtx)

export function BadgeProvider({ children }) {
  const { account } = useAccount()
  const { pathname } = useLocation()
  const [n, setN] = useState({ chats: 0, requests: 0 })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!account) return setN({ chats: 0, requests: 0 })
    let alive = true
    const check = () =>
      document.visibilityState === 'visible' &&
      api(account.token)
        .unreadChats()
        .then((r) => alive && setN({ chats: r.n || 0, requests: r.requests || 0 }))
        .catch(() => {})
    check()
    const id = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      alive = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', check)
    }
  }, [account, pathname, tick])
  const value = useMemo(() => ({ ...n, refresh: () => setTick((x) => x + 1) }), [n])
  return <BadgeCtx.Provider value={value}>{children}</BadgeCtx.Provider>
}

// What a chat is called: the group's name, or your friend's
export const chatTitle = (c) => (c.kind === 'group' || c.kind === 'project' ? c.name : c.members[0]?.name || `@${c.members[0]?.username || ''}`)

// One line about the newest message
export function lastLine(t, m) {
  if (!m) return t('No messages yet')
  const who = m.mine ? t('You') : m.from?.name || `@${m.from?.username}`
  if (m.unsent) return m.mine ? t('You unsent a message') : t('{name} unsent a message', { name: who })
  if (m.removed) return t('Message removed')
  if (m.photo && !m.text) return m.mine ? `${t('You')}: ${t('Photo')}` : t('{name} sent a photo', { name: who })
  if (m.kind === 'checkin') return t('{name} worked on {project}', { name: who, project: m.project })
  if (m.kind === 'progress') return m.info?.finished ? t('{name} finished the whole plan 🎉', { name: who }) : t('{name} finished step {n} 🎉', { name: who, n: m.info?.done })
  if (m.kind === 'poke') return t('{name}: you coming? 👉', { name: who })
  if (m.kind === 'session') return t('{name} planned a session', { name: who })
  if (m.kind === 'system' && m.text === 'together') return m.mine ? t('You invited them to do this plan together') : t('{name} wants to do this plan together', { name: who })
  if (m.kind === 'system' && m.text === 'joined') return t('{name} joined the plan', { name: who })
  if (m.kind === 'system' && m.text === 'finished') return t('You both finished it! 🎉')
  if (m.kind === 'share') return m.mine ? `${t('You')}: ${m.project}` : t('{name} sent {title}', { name: who, title: m.project })
  if (m.kind === 'system') return m.text === 'left' ? t('{name} left', { name: who }) : t('{name} added people', { name: who })
  return m.mine ? `${t('You')}: ${m.text}` : m.text
}

// A group's picture: its hobby's colour with the first members' faces
export function ChatAvatar({ chat, size = 48 }) {
  // A project chat: its hobby's picture, with your friend's face in the corner
  if (chat.kind === 'project')
    return (
      <span className="relative inline-flex shrink-0 items-center justify-center rounded-full" style={{ width: size, height: size, background: cat(chat.hobby || 'other').color + '33', fontSize: size * 0.45 }}>
        <span aria-hidden="true">{catEmoji(chat.hobby)}</span>
        {chat.members[0] && (
          <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-card">
            <Avatar user={chat.members[0]} size={Math.round(size * 0.42)} />
          </span>
        )}
      </span>
    )
  if (chat.kind !== 'group') return <Avatar user={chat.members[0] || {}} size={size} />
  const color = chat.hobby ? cat(chat.hobby).color : '#B4614A'
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full text-white" style={{ width: size, height: size, background: color }}>
      <Icon name="friends" className="h-[45%] w-[45%]" strokeWidth={2.2} />
    </span>
  )
}

const TAB = 'blank-chats-tab'

export function ChatList({ onStart }) {
  const { t, fmt } = useT()
  const { account } = useAccount()
  const [chats, setChats] = useState(null)
  const [tab, setTab] = useState(() => {
    try {
      return localStorage.getItem(TAB) || 'friends'
    } catch {
      return 'friends'
    }
  })
  const token = account?.token

  useEffect(() => {
    if (!token) return
    let alive = true
    const load = () =>
      document.visibilityState === 'visible' &&
      api(token)
        .chats()
        .then((r) => alive && setChats(r.chats))
        .catch(() => alive && setChats((c) => c || []))
    load()
    const id = setInterval(load, 15_000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [token])

  if (chats === null)
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-sub" />
      </div>
    )
  if (!chats.length)
    return (
      <section className="surface mt-5 flex flex-col items-center px-6 pb-6 pt-6 text-center">
        <Mascot size={120} mood="happy" title="" />
        <p className="mt-3 text-[20px] font-bold">{t('Hobbies stick better with friends')}</p>
        <p className="mt-1 text-[15px] text-sub">{t('Start a hobby crew: a group chat where you check in on each other and keep going together.')}</p>
        <button onClick={onStart} className="btn-primary btn-lg mt-5 w-full sm:w-auto">
          {t('Start a hobby crew')}
        </button>
      </section>
    )
  // Message requests from people who aren't your friends wait in their own folder (MessageSafety.jsx)
  const requests = chats.filter((c) => c.request === 'received')
  const friendChats = chats.filter((c) => c.kind !== 'project' && c.request !== 'received')
  const projectChats = chats.filter((c) => c.kind === 'project' && !c.archived)
  const archived = chats.filter((c) => c.kind === 'project' && c.archived)
  const unreadIn = (list) => list.filter((c) => c.unread > 0).length
  const shown = tab === 'projects' ? projectChats : friendChats
  const pick = (v) => {
    setTab(v)
    try {
      localStorage.setItem(TAB, v)
    } catch {}
  }
  const Badge = ({ n }) => (n > 0 ? <span className="ml-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-spark px-1 text-[11px] font-bold text-white">{n}</span> : null)
  return (
    <>
      {/* Two kinds of chats: your friends (one per person) and your projects together (one per shared plan) */}
      <div className="mt-4 grid grid-cols-2 rounded-[10px] bg-mist p-0.5 text-[14px] font-semibold" role="tablist">
        {[
          ['friends', t('Friends'), unreadIn(friendChats)],
          ['projects', t('Projects'), unreadIn(projectChats)],
        ].map(([v, label, n]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => pick(v)} className={`flex min-h-[34px] items-center justify-center rounded-[8px] ${tab === v ? 'bg-card shadow-soft' : 'text-sub'}`}>
            {label}
            <Badge n={n} />
          </button>
        ))}
      </div>
      {shown.length === 0 && (
        <p className="surface mt-3 px-5 py-6 text-center text-[15px] leading-snug text-sub">
          {tab === 'projects' ? t('No projects together yet. Open one of your projects and tap “Do this together”.') : t('No chats yet. Say hi to a friend from their profile.')}
        </p>
      )}
      {tab === 'friends' && requests.length > 0 && (
        <details className="surface mt-3 overflow-hidden">
          <summary className="row min-h-[52px] cursor-pointer list-none text-[17px] font-medium text-spark-ink">
            <Icon name="chat" className="h-5 w-5" />
            <span className="flex-1">{t('Message requests')}</span>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-spark px-1.5 text-[12px] font-bold text-white">{requests.length}</span>
          </summary>
          <p className="px-4 pb-2 text-[13px] text-sub">{t('From people who aren’t your friends. They can’t see if you’ve read them.')}</p>
          <Rows list={requests} />
        </details>
      )}
      {shown.length > 0 && <Rows list={shown} />}
      {tab === 'projects' && archived.length > 0 && (
        <details className="mt-5">
          <summary className="section-label cursor-pointer list-none">
            {t('Archive')} ({archived.length})
          </summary>
          <Rows list={archived} />
        </details>
      )}
    </>
  )
}

function Rows({ list }) {
  const { t, fmt } = useT()
  return (
    <ul className="surface mt-3 divide-y divide-line/15 overflow-hidden">
      {list.map((c) => (
        <li key={c.id}>
          <Link to={`/chats/${c.id}`} className="row min-h-[72px] py-3 active:bg-mist">
            <ChatAvatar chat={c} />
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className={`min-w-0 flex-1 truncate text-[17px] leading-tight ${c.unread ? 'font-bold' : 'font-medium'}`}>{chatTitle(c)}</span>
                <span className="shrink-0 text-[13px] text-sub">{fmt.ago(c.last?.created || c.lastAt)}</span>
              </span>
              <span className="mt-0.5 flex items-center gap-2">
                <span className={`min-w-0 flex-1 truncate text-[15px] ${c.unread ? 'font-semibold text-ink' : 'text-sub'}`}>{lastLine(t, c.last)}</span>
                {c.unread > 0 && (
                  <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-spark px-1.5 text-[12px] font-bold text-white">{c.unread}</span>
                )}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Pick friends: one is a one-to-one chat, more (or a name) make a hobby crew
export function NewChatSheet({ onClose, chatId = null, already = [] }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [friends, setFriends] = useState(null)
  const [picked, setPicked] = useState([])
  const [name, setName] = useState('')
  const [hobby, setHobby] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const adding = !!chatId

  useEffect(() => {
    api(account.token)
      .friends()
      .then((r) => setFriends(r.friends.filter((f) => !already.includes(f.username))))
      .catch(() => setFriends([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const group = adding || picked.length > 1
  const toggle = (u) => setPicked((p) => (p.includes(u) ? p.filter((x) => x !== u) : [...p, u]))
  const ready = picked.length > 0 && (!group || adding || name.trim())

  const submit = async (e) => {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setError(null)
    try {
      const a = api(account.token)
      if (adding) {
        await a.addToChat(chatId, picked)
        onClose(true)
        return
      }
      const r = await a.startChat(group ? { with: picked, name: name.trim(), hobby } : { with: picked })
      onClose()
      navigate(`/chats/${r.id}`)
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={() => onClose()} label={adding ? t('Add friends') : t('New chat')}>
      <SheetHeader title={adding ? t('Add friends') : t('New chat')} onClose={() => onClose()} />
      <form onSubmit={submit} className="px-5 pb-3">
        {friends === null ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-sub" />
          </div>
        ) : friends.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-[17px] text-sub">{adding ? t('All your friends are in here already.') : t('Chats are with friends. Add some friends first.')}</p>
            {!adding && (
              <Link to="/friends/people" onClick={() => onClose()} className="btn-tinted mt-4 inline-flex">
                {t('Find friends')}
              </Link>
            )}
          </div>
        ) : (
          <>
            <p className="px-1 pb-2 text-[15px] text-sub">{adding ? t('Who should join?') : t('Pick one friend to talk, or a few for a hobby crew.')}</p>
            <ul className="surface max-h-[38vh] divide-y divide-line/15 overflow-y-auto">
              {friends.map((f) => {
                const on = picked.includes(f.username)
                return (
                  <li key={f.username}>
                    <button type="button" onClick={() => toggle(f.username)} className="row min-h-[56px] w-full text-left active:bg-mist" aria-pressed={on}>
                      <Avatar user={f} size={36} />
                      <span className="min-w-0 flex-1 truncate text-[17px]">{f.name || `@${f.username}`}</span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${on ? 'border-spark bg-spark text-white' : 'border-ink/25'}`}>
                        {on && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {group && !adding && (
              <>
                <input
                  className="input mt-4"
                  placeholder={t('Crew name, like “Sunday sketchers”')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  aria-label={t('Crew name')}
                />
                <p className="mt-4 px-1 pb-1.5 text-[15px] font-medium text-sub">{t('What do you do together?')}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setHobby(hobby === c.id ? null : c.id)}
                      aria-pressed={hobby === c.id}
                      className={`h-9 rounded-full px-3.5 text-[15px] font-medium ${hobby === c.id ? 'bg-ink text-card' : 'bg-mist'}`}
                    >
                      {categoryLabel(t, c.id)}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
        {error && <p className="mt-3 text-center text-[15px] text-bad">{error}</p>}
        {friends?.length > 0 && (
          <button className="btn-primary btn-lg mt-5 w-full" disabled={!ready || busy}>
            {busy ? <Spinner /> : adding ? t('Add') : group ? t('Start the crew') : t('Chat')}
          </button>
        )}
      </form>
    </Sheet>
  )
}
