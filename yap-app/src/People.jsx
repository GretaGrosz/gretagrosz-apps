// Friends tab and profiles. Yap is friends-only: you hear someone once you've both added each other,
// or straight away when you join through their invite link.
import { useEffect, useState } from 'react'
import { api, inviteLink } from './api.js'
import { mutate, revalidate, useResource } from './store.js'
import { t } from './i18n.js'
import { PostCard, toItem } from './Feed.jsx'
import { ReportSheet, useBlock } from './Safety.jsx'
import { ActionSheet, Avatar, Button, Caption, Empty, Group, Icon, Loadable, Page, PlayButton, Spinner, Waveform, fmt, toast, useApp } from './ui.jsx'

/** Shares your invite link (whoever joins with it is your friend right away) */
export async function shareInvite(me) {
  let code
  try { code = (await api('/invite')).code } catch (e) { return toast(e.message, 'error') }
  const url = inviteLink(code)
  const text = t('inviteText', { name: me.name.split(' ')[0] })
  try {
    if (navigator.share) return await navigator.share({ title: 'Yap', text, url })
  } catch (e) { if (e?.name === 'AbortError') return }
  try { await navigator.clipboard.writeText(url); toast(t('linkCopied')) } catch { toast(url) }
}

/** Add / Accept / Friends ⌄ / Requested ⌄ — removing a friend or a request asks first */
export function RelationButton({ user, onChange, wide = false }) {
  const { openChat } = useApp()
  const [busy, setBusy] = useState(false)
  const [menu, setMenu] = useState(false)
  const act = async method => {
    setBusy(true)
    try {
      const { user: u } = await api(`/friends/${user.handle}`, { method })
      onChange?.(u)
      revalidate('/friends'); revalidate('/me'); revalidate('/chats')
      if (u.relation === 'friend' && method === 'POST') toast(t('nowFriends', { name: u.name }))
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const size = wide ? 'h-11 flex-1 text-[16px]' : 'h-9 px-4 text-[15px]'
  if (['me', 'bot', 'blocked'].includes(user.relation)) return null
  if (busy) return <Button kind="gray" className={size} disabled><Spinner size={15} /></Button>
  if (user.relation === 'friend' || user.relation === 'pending') {
    const friend = user.relation === 'friend'
    return (
      <>
        <Button kind="gray" className={size} onClick={() => setMenu(true)} aria-haspopup="menu">
          {friend ? t('friends') : t('requested')} <Icon.ChevronDown size={15} />
        </Button>
        <ActionSheet open={menu} onClose={() => setMenu(false)} title={friend ? user.name : t('requestTo', { name: user.name })}
          actions={friend
            ? [{ label: t('talk'), onClick: () => openChat(user.handle) }, { label: t('removeFriend'), destructive: true, onClick: () => act('DELETE') }]
            : [{ label: t('cancelRequest'), destructive: true, onClick: () => act('DELETE') }]} />
      </>
    )
  }
  if (user.relation === 'request') return <Button className={size} onClick={() => act('POST')}>{t('accept')}</Button>
  return <Button className={size} onClick={() => act('POST')}>{t('add')}</Button>
}

function PersonRow({ user, sub, right }) {
  const { openProfile } = useApp()
  return (
    <div className="flex min-h-[60px] items-center gap-3 px-4 py-1.5">
      <Avatar user={user} size={44} onClick={() => openProfile(user.handle)} />
      <button type="button" onClick={() => openProfile(user.handle)} className="min-w-0 flex-1 text-left">
        <div className="truncate text-[17px]">{user.name}</div>
        <div className="truncate text-[14px] text-muted">{sub || '@' + user.handle}</div>
      </button>
      {right}
    </div>
  )
}

export default function Friends({ active }) {
  const { me, openChat } = useApp()
  const res = useResource('/friends', { poll: 30000, active })
  const [q, setQ] = useState('')
  const [found, setFound] = useState(null)
  const search = query => api('/users?q=' + encodeURIComponent(query)).then(d => setFound(d.users)).catch(() => setFound([]))
  useEffect(() => {
    if (!q.trim()) return setFound(null)
    const timer = setTimeout(() => search(q.trim()), 250)
    return () => clearTimeout(timer)
  }, [q])
  const changed = () => { revalidate('/friends'); if (q.trim()) search(q.trim()) }
  const lists = res.data

  return (
    <div className="pb-40 lg:pb-10">
      <header className="glass-bar sticky top-0 z-20 -mx-4 px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex h-11 items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-[-0.01em]">{t('tabFriends')}</h1>
          <button type="button" onClick={() => shareInvite(me)} className="-mr-2 grid h-11 w-11 place-items-center text-accent" aria-label={t('inviteFriends')}><Icon.Share size={23} /></button>
        </div>
        <label className="mt-1 flex h-10 items-center gap-2 rounded-[10px] bg-fill px-2.5">
          <Icon.Search size={18} className="text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} type="search" placeholder={t('searchUsernames')} aria-label={t('searchUsernames')} autoCapitalize="none" autoCorrect="off" spellCheck={false}
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} className="-mr-1 grid h-10 w-10 place-items-center text-muted" aria-label={t('clear')}><Icon.Close size={16} /></button>}
        </label>
      </header>

      {found ? (
        <Group>
          {found.length ? found.map(u => <PersonRow key={u.handle} user={u} right={<RelationButton user={u} onChange={changed} />} />)
            : <div className="px-4 py-6 text-center text-[16px] text-muted">{t('noOneCalled', { q: q.replace(/^@/, '') })}</div>}
        </Group>
      ) : (
        <Loadable res={res}>
          {() => (
            <>
              <button type="button" onClick={() => shareInvite(me)} className="mt-4 flex w-full items-center gap-3 rounded-[16px] bg-accent px-4 py-3.5 text-left text-white active:opacity-90">
                <Icon.Link size={24} />
                <span className="min-w-0 flex-1 text-[17px] font-semibold">{t('inviteFriends')}</span>
                <Icon.Share size={20} />
              </button>
              {lists.requests.length > 0 && (
                <Group title={t('friendRequests')}>
                  {lists.requests.map(u => <PersonRow key={u.handle} user={u} right={<RelationButton user={{ ...u, relation: 'request' }} onChange={changed} />} />)}
                </Group>
              )}
              <Group title={t('yourFriends')}>
                {lists.friends.length ? lists.friends.map(u => (
                  <PersonRow key={u.handle} user={u} right={<Button kind="tinted" className="h-9 px-4 text-[15px]" onClick={() => openChat(u.handle)}><Icon.MicFill size={16} /> {t('talk')}</Button>} />
                )) : <div className="px-4 py-4 text-[16px] text-muted">{t('noFriendsYet')}</div>}
              </Group>
              {lists.suggested.length > 0 && (
                <Group title={t('peopleYouMayKnow')}>
                  {lists.suggested.map(u => (
                    <PersonRow key={u.handle} user={u} sub={u.mutual > 1 ? t('friendsWithN', { name: u.via.split(' ')[0], n: u.mutual - 1 }) : t('friendsWith', { name: u.via.split(' ')[0] })}
                      right={<RelationButton user={u} onChange={changed} />} />
                  ))}
                </Group>
              )}
              {lists.pending.length > 0 && (
                <Group title={t('requested')}>
                  {lists.pending.map(u => <PersonRow key={u.handle} user={u} right={<RelationButton user={{ ...u, relation: 'pending' }} onChange={changed} />} />)}
                </Group>
              )}
            </>
          )}
        </Loadable>
      )}
    </div>
  )
}

/** The voice intro under a profile's name; on your own profile, a button to record one */
export function VoiceBio({ user, mine }) {
  const { openRecorder, setMe } = useApp()
  const bio = user.bio
  if (!bio && !mine) return null
  if (!bio) {
    return (
      <Button kind="tinted" className="mt-4 h-11 px-5 text-[16px]" onClick={() => openRecorder({ kind: 'bio' }, ({ bio }) => { setMe({ bio }); revalidate('/me') })}>
        <Icon.MicFill size={18} /> {t('addVoiceBio')}
      </Button>
    )
  }
  const item = { id: 'bio-' + bio.audio, audio: bio.audio, fx: bio.fx, duration: bio.duration, user }
  return (
    <div className="mt-4 w-full max-w-[340px]">
      <div className="flex items-center gap-2.5 rounded-full bg-surface py-1.5 pl-1.5 pr-4">
        <PlayButton item={item} size={36} label={t('voiceBio')} />
        <Waveform id={item.id} wave={bio.wave} height={24} />
        <span className="shrink-0 text-[14px] tabular-nums text-muted">{fmt(bio.duration)}</span>
      </div>
      <Caption text={bio.transcript} className="mt-2 px-2 text-center" />
    </div>
  )
}

export function ProfileHeader({ user, mine = false, children }) {
  return (
    <div className="flex flex-col items-center px-4 pt-6 text-center">
      <Avatar user={user} size={96} />
      <h1 className="mt-3 max-w-full break-words text-[28px] font-bold leading-tight">{user.name}</h1>
      <div className="text-[16px] text-muted">@{user.handle}</div>
      <VoiceBio user={user} mine={mine} />
      {children && <div className="mt-4 flex w-full max-w-[400px] gap-2">{children}</div>}
    </div>
  )
}

export function Profile({ handle, onBack }) {
  const { openChat } = useApp()
  const path = `/users/${handle}`
  const res = useResource(path)
  const [menu, setMenu] = useState(false)
  const [report, setReport] = useState(null)
  const [askBlock, blockSheet] = useBlock(() => revalidate(path))
  useEffect(() => { if (res.error?.status === 404) { toast(res.error.message, 'error'); onBack() } }, [res.error])
  const u = res.data?.user
  const posts = res.data?.posts || []
  const canHear = u && ['me', 'friend', 'bot'].includes(u.relation)
  const unblock = async () => {
    try { await api(`/users/${u.handle}/block`, { method: 'DELETE' }); revalidate(path); revalidate('/blocks'); toast(t('unblocked', { name: u.name })) } catch (e) { toast(e.message, 'error') }
  }
  return (
    <Page onBack={onBack} label={u?.name}
      title={u && <div className="truncate text-center text-[17px] font-semibold">{u.name}</div>}
      right={u && !u.bot && u.relation !== 'me' ? <button type="button" onClick={() => setMenu(true)} className="grid h-11 w-11 place-items-center text-accent" aria-label={t('more')}><Icon.Dots size={22} /></button> : null}>
      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        <Loadable res={res}>
          {() => (
            <>
              <ProfileHeader user={u}>
                {u.relation === 'blocked' ? <Button kind="gray" className="h-11 flex-1 text-[16px]" onClick={unblock}>{t('unblock')}</Button> : (
                  <>
                    {u.relation === 'friend' && <Button className="h-11 flex-1 text-[16px]" onClick={() => openChat(u.handle)}><Icon.MicFill size={18} /> {t('talk')}</Button>}
                    <RelationButton wide user={u} onChange={nu => { mutate(path, d => ({ ...d, user: { ...d.user, ...nu } })); revalidate(path) }} />
                  </>
                )}
              </ProfileHeader>
              <div className="mt-6 border-t border-line px-4">
                {canHear ? (
                  posts.length ? posts.map((p, i) => (
                    <PostCard key={p.id} post={p} next={posts.slice(i + 1).map(toItem)}
                      onChange={np => mutate(path, d => ({ ...d, posts: d.posts.map(x => (x.id === np.id ? np : x)) }))}
                      onRemove={np => mutate(path, d => ({ ...d, posts: d.posts.filter(x => x.id !== np.id) }))} />
                  )) : <Empty icon={<Icon.MicFill size={30} />} title={t('noYapsYet')} />
                ) : u.relation !== 'blocked' && (
                  <Empty icon={<Icon.Users size={34} />} title={t('friendsOnly')} />
                )}
              </div>
            </>
          )}
        </Loadable>
      </div>
      {u && (
        <ActionSheet open={menu} onClose={() => setMenu(false)} actions={[
          { label: t('reportName', { name: u.name }), onClick: () => setReport({ kind: 'user', user: u }) },
          u.relation !== 'blocked' && { label: t('blockName', { name: u.name }), destructive: true, onClick: () => askBlock(u) },
        ]} />
      )}
      <ReportSheet target={report} onClose={() => setReport(null)} onDone={() => revalidate(path)} />
      {blockSheet}
    </Page>
  )
}
