// Finding people, friend requests and your friends. Shown on the Friends tab (pages/Friends.jsx).
// Ideas from the big apps: one search box for names and usernames with your recent searches (Instagram), friend
// requests on top and "people you may know" with mutual friends (Facebook), a swipeable Quick Add row (Snapchat).
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api, shareInvite } from '../social'
import { CATEGORY_LABEL } from '../data'
import { Icon, Spinner } from '../components/ui'
import { Avatar, ERRORS } from '../components/Social'
import { useFriendsBadge } from './Chats'

// Small lists kept on this device only
const RECENT = 'blank-people-recent'
const HIDDEN = 'blank-people-hidden'
const readList = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const writeList = (key, list) => {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {}
}

function Person({ user, sub, onOpen, children }) {
  const { tn } = useT()
  const line = sub ?? (user.mutual ? tn(user.mutual, '{n} mutual friend', '{n} mutual friends') : user.name ? `@${user.username}` : '')
  return (
    <li className="row min-h-[60px]">
      <Link to={`/u/${user.username}`} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70">
        <Avatar user={user} size={44} />
        <span className="min-w-0">
          <span className="block truncate text-[17px] font-medium leading-tight">{user.name || `@${user.username}`}</span>
          {line && <span className="block truncate text-[13px] text-sub">{line}</span>}
        </span>
      </Link>
      {children}
    </li>
  )
}

export function PeopleList() {
  const { t, tn } = useT()
  const { account } = useAccount()
  const { data, actions } = useStore()
  const [lists, setLists] = useState(null)
  const [known, setKnown] = useState([])
  const [similar, setSimilar] = useState([])
  const [samePlans, setSamePlans] = useState([])
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(null)
  const [recent, setRecent] = useState(() => readList(RECENT))
  const [hidden, setHidden] = useState(() => readList(HIDDEN))
  const badge = useFriendsBadge()
  const navigate = useNavigate()
  const token = account?.token
  const a = api(token)
  // Just became friends: one tap to the chat, so the friendship starts with a hello
  const friendsNow = (username) => ({
    text: 'You’re friends now',
    long: true,
    action: { label: 'Say hi', run: () => a.startChat({ with: [username] }).then((r) => navigate(`/chats/${r.id}`)).catch(() => {}) },
  })

  const load = () =>
    a
      .friends()
      .then(setLists)
      .catch(() => setLists({ friends: [], incoming: [], outgoing: [] }))
  useEffect(() => {
    if (!token) return
    load()
    a.known()
      .then((r) => setKnown(r.users))
      .catch(() => {})
    // People who posted publicly from the same plans as yours (the plan, or a project with the same title)
    const guides = [...new Set(data.projects.map((p) => p.guideKey).filter(Boolean))]
    const titles = [...new Set(data.projects.filter((p) => !p.guideKey).map((p) => p.title))]
    if (guides.length || titles.length)
      a.samePlans(guides, titles)
        .then((r) => setSamePlans(r.users))
        .catch(() => {})
    const cats = data.me.prefs?.interests || data.me.prefs?.categories || []
    if (cats.length)
      a.suggestions(cats)
        .then((r) => setSimilar(r.users))
        .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Names and usernames, as you type
  useEffect(() => {
    const query = q.trim()
    if (!token || !query.replace(/^@/, '').length) return setResults(null)
    // Results while you type, from the first letter (a short pause so each letter isn't its own request)
    const id = setTimeout(() => {
      a.search(query)
        .then((r) => setResults(r.users))
        .catch(() => setResults([]))
    }, 150)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, token])

  const remember = (u) => {
    const next = [{ username: u.username, name: u.name, avatar: u.avatar }, ...recent.filter((x) => x.username !== u.username)].slice(0, 8)
    setRecent(next)
    writeList(RECENT, next)
  }
  const forget = (username) => {
    const next = username ? recent.filter((x) => x.username !== username) : []
    setRecent(next)
    writeList(RECENT, next)
  }
  const hide = (username) => {
    const next = [username, ...hidden].slice(0, 200)
    setHidden(next)
    writeList(HIDDEN, next)
  }

  const act = async (username, fn, toast) => {
    setBusy(username)
    try {
      await fn(username)
      if (toast) actions.toast(typeof toast === 'string' ? { text: toast } : toast)
      await load()
      badge.refresh()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(null)
    }
  }
  const relationOf = (u) =>
    lists?.friends.some((x) => x.username === u.username)
      ? 'friends'
      : lists?.incoming.some((x) => x.username === u.username)
        ? 'incoming'
        : lists?.outgoing.some((x) => x.username === u.username)
          ? 'outgoing'
          : 'none'
  const group = 'surface divide-y divide-line/15 overflow-hidden'
  const small = 'btn min-h-[34px] shrink-0 px-3.5 text-[15px]'

  const Action = ({ user, wide = false }) => {
    const rel = relationOf(user)
    const w = wide ? 'w-full' : ''
    if (busy === user.username) return <Spinner className="h-5 w-5 text-sub" />
    if (rel === 'friends') return <span className="text-[15px] text-sub">{t('Friends')}</span>
    if (rel === 'outgoing')
      return (
        <button onClick={() => act(user.username, a.removeFriend)} className={`${small} ${w} bg-mist text-sub`}>
          {t('Requested')}
        </button>
      )
    return (
      <button onClick={() => act(user.username, a.addFriend, rel === 'incoming' ? friendsNow(user.username) : 'Request sent')} className={`${small} ${w} bg-spark text-white`}>
        {rel === 'incoming' ? t('Accept') : t('Add')}
      </button>
    )
  }

  // Quick add: friends of friends first (most mutual friends), then people into the same hobbies
  const quick = useMemo(() => {
    const seen = new Set([...hidden, ...samePlans.map((u) => u.username)])
    const out = []
    for (const u of [...known, ...similar]) {
      if (seen.has(u.username)) continue
      seen.add(u.username)
      out.push(u)
    }
    return out
  }, [known, similar, hidden, samePlans])
  const sameShown = lists ? samePlans.filter((u) => !hidden.includes(u.username) && relationOf(u) !== 'friends') : []
  const quickShown = lists ? quick.filter((u) => relationOf(u) !== 'friends') : []

  const searching = q.trim().replace(/^@/, '').length >= 1
  const showRecent = focused && !q && recent.length > 0
  // A person card in the swipeable rows
  const card = (u) => (
                  <div key={u.username} className="surface relative flex w-[150px] shrink-0 snap-start flex-col items-center px-3 pb-3 pt-5 text-center lg:w-auto">
                    <button
                      onClick={() => hide(u.username)}
                      className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sub active:bg-mist"
                      aria-label={t('Hide')}
                      title={t('Hide')}
                    >
                      <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
                    </button>
                    <Link to={`/u/${u.username}`} className="flex w-full min-w-0 flex-col items-center active:opacity-70">
                      <Avatar user={u} size={64} />
                      <span className="mt-2 block max-w-full truncate text-[15px] font-semibold leading-tight">{u.name || `@${u.username}`}</span>
                      <span className="mt-0.5 block max-w-full truncate text-[13px] text-sub">
                        {u.plan
                          ? t('Also did: {plan}', { plan: u.plan })
                          : u.mutual
                            ? tn(u.mutual, '{n} mutual friend', '{n} mutual friends')
                            : u.category
                              ? t('Into {hobby} too', { hobby: t(CATEGORY_LABEL[u.category] || 'Other').toLowerCase() })
                              : `@${u.username}`}
                      </span>
                    </Link>
                    <div className="mt-3 flex w-full justify-center">
                      <Action user={u} wide />
                    </div>
                  </div>
  )
  const row = 'flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4 -mx-4'


  return (
    <>
      {/* One search box for names and usernames */}
      <div className="relative mt-4">
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sub" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          className="input bg-ink/[0.07] pl-10"
          placeholder={t('Name or @username')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label={t('Name or @username')}
        />
      </div>

      {showRecent && (
        <>
          <div className="mt-5 flex items-baseline px-4">
            <h2 className="flex-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-ink/55">{t('Recent')}</h2>
            <button onMouseDown={(e) => e.preventDefault()} onClick={() => forget()} className="text-[15px] text-spark-ink active:opacity-60">
              {t('Clear all')}
            </button>
          </div>
          <ul className={`${group} mt-2`}>
            {recent.map((u) => (
              <Person key={u.username} user={u} onOpen={() => remember(u)}>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => forget(u.username)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist"
                  aria-label={t('Remove')}
                >
                  <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
                </button>
              </Person>
            ))}
          </ul>
        </>
      )}

      {searching && (
        <ul className={`${group} mt-3`}>
          {results === null ? (
            <li className="row min-h-[60px] justify-center">
              <Spinner className="h-5 w-5 text-sub" />
            </li>
          ) : results.length === 0 ? (
            <li className="row min-h-[56px] text-[15px] text-sub">{t('Nobody found.')}</li>
          ) : (
            results.map((u) => (
              <Person key={u.username} user={u} onOpen={() => remember(u)}>
                <Action user={u} />
              </Person>
            ))
          )}
        </ul>
      )}

      {!searching && !showRecent && (
        <>
          {!lists ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-6 w-6 text-sub" />
            </div>
          ) : (
            <>
              {lists.incoming.length > 0 && (
                <>
                  <h2 className="section-label mt-7">
                    {t('Friend requests')} <span className="text-spark-ink">{lists.incoming.length}</span>
                  </h2>
                  <ul className={group}>
                    {/* Like Facebook: the name gets the whole line, the two buttons sit under it */}
                    {lists.incoming.map((u) => (
                      <li key={u.username} className="flex gap-3 px-4 py-3">
                        <Link to={`/u/${u.username}`} className="shrink-0 active:opacity-70">
                          <Avatar user={u} size={52} />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/u/${u.username}`} className="block active:opacity-70">
                            <span className="block truncate text-[17px] font-medium leading-tight">{u.name || `@${u.username}`}</span>
                            <span className="block truncate text-[13px] text-sub">{u.name ? `@${u.username}` : ''}</span>
                          </Link>
                          {busy === u.username ? (
                            <Spinner className="mt-2 h-5 w-5 text-sub" />
                          ) : (
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => act(u.username, a.addFriend, friendsNow(u.username))} className={`${small} flex-1 bg-spark text-white lg:flex-none`}>
                                {t('Accept')}
                              </button>
                              <button onClick={() => act(u.username, a.removeFriend)} className={`${small} flex-1 bg-mist text-ink lg:flex-none`}>
                                {t('Decline')}
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* People who did the same plans as you: the most in common, so they come first */}
              {sameShown.length > 0 && (
                <section className="mt-7">
                  <h2 className="section-label">{t('Did the same plans as you')}</h2>
                  <div className={row}>{sameShown.slice(0, 12).map(card)}</div>
                </section>
              )}

              {/* Quick add: cards you can swipe through */}
              {quickShown.length > 0 && (
                <section className="mt-7">
                  <h2 className="section-label">{known.length ? t('People you may know') : t('People into the same things')}</h2>
                  <div className="-mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
                    {quickShown.slice(0, 12).map(card)}
                  </div>
                </section>
              )}

              <button
                onClick={async () => {
                  const r = await shareInvite(account.token, account.username, t('Add me on Blank'))
                  if (r === 'copied') actions.toast({ text: 'Invite link copied' })
                }}
                className="surface row mt-7 min-h-[56px] text-[17px] text-spark-ink active:bg-mist"
              >
                <Icon name="link" className="h-5 w-5" />
                <span className="flex-1">{t('Invite friends with your link')}</span>
                <Icon name="share" className="h-5 w-5" />
              </button>

              <h2 className="section-label mt-7">
                {t('Your friends')} {lists.friends.length > 0 && <span className="text-sub">{lists.friends.length}</span>}
              </h2>
              <ul className={group}>
                {lists.friends.length === 0 ? (
                  <li className="row min-h-[50px] text-[15px] text-sub">{t('No friends yet. Search for a name above.')}</li>
                ) : (
                  lists.friends.map((u) => (
                    <Person key={u.username} user={u}>
                      <Icon name="chevron" className="h-4 w-4 text-ink/30" strokeWidth={2.6} />
                    </Person>
                  ))
                )}
              </ul>

              {lists.outgoing.length > 0 && (
                <>
                  <h2 className="section-label mt-7">{t('Sent requests')}</h2>
                  <ul className={group}>
                    {lists.outgoing.map((u) => (
                      <Person key={u.username} user={u}>
                        <Action user={u} />
                      </Person>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
