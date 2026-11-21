// Your own page: profile, your yaps, and settings (notifications, passkey, other devices, language, blocked people).
import { useEffect, useState } from 'react'
import { api } from './api.js'
import { mutate, revalidate, useResource } from './store.js'
import { lang, setLang, t } from './i18n.js'
import { PostCard, toItem } from './Feed.jsx'
import { ProfileHeader, shareInvite } from './People.jsx'
import { NotificationsRow, PasskeyRow } from './Setup.jsx'
import { ActionSheet, Avatar, Button, Empty, Group, Icon, Loadable, Page, Row, Sheet, SheetHeader, Spinner, toast, useApp } from './ui.jsx'

export const AVATARS = ['😎', '🦊', '🐸', '👽', '🦄', '🐙', '🍕', '🌈', '🔥', '👾', '🐼', '🦋', '🍉', '🤠', '🐶', '🐱', '🌵', '🪩', '🎧', '🛸', '🍄', '🦖', '🐝', '💀']

export default function Me({ active }) {
  const { me, meData, signOut, openBlocked, openReports, pendingSends, openRecorder } = useApp()
  const path = `/users/${me.handle}`
  const res = useResource(path, { active })
  const blocks = useResource(active ? '/blocks' : null)
  const [editing, setEditing] = useState(false)
  const [code, setCode] = useState(false)
  const [ask, setAsk] = useState(null) // 'signout' | 'everywhere' | 'delete'
  const posts = res.data?.posts || []

  const del = async () => {
    try { await api('/me', { method: 'DELETE' }); toast(t('accountDeleted')); window.dispatchEvent(new Event('yap:signedout')) } catch (e) { toast(e.message, 'error') }
  }
  const unsent = pendingSends ? t('unsentWarning', { n: pendingSends }) : ''

  return (
    <div className="pb-40 pt-[env(safe-area-inset-top)] lg:pb-10">
      <ProfileHeader mine user={me}>
        <Button kind="gray" className="h-11 flex-1 text-[16px]" onClick={() => setEditing(true)}>{t('editProfile')}</Button>
        <Button kind="gray" className="h-11 flex-1 text-[16px]" onClick={() => shareInvite(me)}><Icon.Share size={17} /> {t('invite')}</Button>
      </ProfileHeader>

      <h2 className="mt-8 text-[22px] font-bold">{t('yourYaps')}</h2>
      <Loadable res={res}>
        {() => posts.length ? (
          <div>
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} next={posts.slice(i + 1).map(toItem)}
                onChange={np => mutate(path, d => ({ ...d, posts: d.posts.map(x => (x.id === np.id ? np : x)) }))}
                onRemove={np => { mutate(path, d => ({ ...d, posts: d.posts.filter(x => x.id !== np.id) })); revalidate('/feed') }} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Button kind="tinted" className="mx-auto h-11 px-5" onClick={() => openRecorder({ kind: 'post' }, () => { revalidate(path); revalidate('/feed') })}><Icon.MicFill size={18} /> {t('postFirstYap')}</Button>
          </div>
        )}
      </Loadable>

      <Group title={t('settings')}>
        <NotificationsRow />
        <PasskeyRow />
        <Row icon={<Icon.Devices size={22} />} title={t('signInOther')} onClick={() => setCode(true)} />
      </Group>
      <Group>
        <div className="flex min-h-[48px] items-center gap-3 px-4 py-2">
          <span className="text-muted"><Icon.Globe size={22} /></span>
          <span className="flex-1 text-[17px]">{t('language')}</span>
          <div className="flex rounded-[9px] bg-fill p-[2px]" role="radiogroup" aria-label={t('language')}>
            {[['en', 'English'], ['de', 'Deutsch']].map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={lang() === k} onClick={() => setLang(k)}
                className={`h-[34px] min-w-[44px] rounded-[7px] px-3 text-[14px] font-semibold ${lang() === k ? 'bg-[var(--seg-on)] shadow-sm' : 'text-muted'}`}>{label}</button>
            ))}
          </div>
        </div>
      </Group>
      <Group>
        <Row icon={<Icon.Block size={22} />} title={t('blockedPeople')} value={blocks.data?.users.length || null} onClick={openBlocked} />
        {meData?.admin && <Row icon={<Icon.Shield size={22} />} title={t('reports')} value={meData.reports || null} onClick={openReports} />}
      </Group>
      <Group footer={meData?.sessions > 1 ? t('signedInOnN', { n: meData.sessions }) : null}>
        <Row title={t('signOut')} onClick={() => setAsk('signout')} chevron={false} />
        {meData?.sessions > 1 && <Row title={t('signOutOthers')} onClick={() => setAsk('everywhere')} chevron={false} />}
      </Group>
      <Group>
        <Row title={t('deleteAccount')} destructive onClick={() => setAsk('delete')} chevron={false} />
      </Group>

      <EditProfile open={editing} onClose={() => setEditing(false)} />
      <CodeSheet open={code} onClose={() => setCode(false)} />
      <ActionSheet open={ask === 'signout'} onClose={() => setAsk(null)} title={t('signOutQ')}
        message={[meData?.passkeys ? '' : t('noPasskeyWarning'), unsent].filter(Boolean).join(' ') || null}
        actions={[{ label: t('signOut'), destructive: true, onClick: () => signOut() }]} />
      <ActionSheet open={ask === 'everywhere'} onClose={() => setAsk(null)} title={t('signOutOthersQ', { n: (meData?.sessions || 1) - 1 })}
        actions={[{ label: t('signOutOthers'), destructive: true, onClick: async () => {
          try { const d = await api('/sessions/revoke', { method: 'POST' }); toast(t('signedOutN', { n: d.signedOut })); revalidate('/me') } catch (e) { toast(e.message, 'error') }
        } }]} />
      <ActionSheet open={ask === 'delete'} onClose={() => setAsk(null)} title={t('deleteAccountQ')} message={t('deleteAccountWhat')}
        actions={[{ label: t('deleteAccount'), destructive: true, onClick: del }]} />
    </div>
  )
}

function EditProfile({ open, onClose }) {
  const { me, setMe, openRecorder } = useApp()
  const [name, setName] = useState(me.name)
  const [emoji, setEmoji] = useState(me.emoji)
  const [busy, setBusy] = useState(false)
  const [removeBio, setRemoveBio] = useState(false)
  useEffect(() => { if (open) { setName(me.name); setEmoji(me.emoji) } }, [open])
  const save = async () => {
    setBusy(true)
    try {
      const { user } = await api('/me', { method: 'PATCH', body: { name: name.trim() || me.name, emoji } })
      setMe(user)
      revalidate('/me')
      onClose()
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const dropBio = () => api('/me/bio', { method: 'DELETE' }).then(() => { setMe({ bio: null }); revalidate('/me') }).catch(e => toast(e.message, 'error'))
  return (
    <Sheet open={open} onClose={onClose} full label={t('editProfile')}>
      <SheetHeader title={t('editProfile')} onClose={onClose}
        right={<button type="button" onClick={save} disabled={busy || !name.trim()} className="h-11 px-2 text-[17px] font-semibold text-accent disabled:opacity-30">{busy ? <Spinner /> : t('done')}</button>} />
      <div className="flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mt-3 flex justify-center"><Avatar user={{ emoji }} size={96} /></div>
        <div className="mt-4 grid grid-cols-8 gap-1" role="radiogroup" aria-label={t('picture')}>
          {AVATARS.map(e => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)}
              className={`grid aspect-square min-h-[44px] place-items-center rounded-[12px] text-[23px] ${emoji === e ? 'bg-accent-soft ring-2 ring-accent' : ''}`}>{e}</button>
          ))}
        </div>
        <Group title={t('name')}>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={40} aria-label={t('name')} className="h-[48px] w-full bg-transparent px-4 text-[17px] outline-none" />
        </Group>
        <Group title={t('voiceBio')}>
          <Row icon={<Icon.MicFill size={20} />} title={me.bio ? t('reRecordBio') : t('addVoiceBio')} onClick={() => { onClose(); openRecorder({ kind: 'bio' }, ({ bio }) => { setMe({ bio }); revalidate('/me') }) }} />
          {me.bio && <Row icon={<Icon.Trash size={20} />} title={t('removeBio')} destructive onClick={() => setRemoveBio(true)} chevron={false} />}
        </Group>
      </div>
      <ActionSheet open={removeBio} onClose={() => setRemoveBio(false)} title={t('removeBioQ')} actions={[{ label: t('removeBio'), destructive: true, onClick: dropBio }]} />
    </Sheet>
  )
}

/** A one-time code (15 minutes) that signs in one more device */
function CodeSheet({ open, onClose }) {
  const [state, setState] = useState(null)
  const [now, setNow] = useState(Date.now())
  const make = () => { setState(null); api('/link-code', { method: 'POST' }).then(setState).catch(e => setState({ error: e.message })) }
  useEffect(() => { if (open) make() }, [open])
  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [open])
  const left = state?.expires ? Math.max(0, Math.round((state.expires - now) / 1000)) : 0
  const link = state?.code ? `${location.origin}/yap/#link/${state.code}` : ''
  const share = async () => {
    try { if (navigator.share) return await navigator.share({ url: link }) } catch (e) { if (e?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(link); toast(t('linkCopied')) } catch {}
  }
  return (
    <Sheet open={open} onClose={onClose} label={t('signInOther')}>
      <SheetHeader title={t('signInOther')} onClose={onClose} closeLabel={t('done')} />
      <div className="flex flex-col items-center px-6 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 text-center">
        {!state ? <div className="py-10"><Spinner size={24} /></div> : state.error ? (
          <div className="py-6"><div className="text-[17px] text-muted">{state.error}</div><Button kind="tinted" className="mx-auto mt-4 h-11 px-5" onClick={make}>{t('retry')}</Button></div>
        ) : left > 0 ? (
          <>
            <div className="select-all font-mono text-[40px] font-semibold tracking-[0.12em] tabular-nums" aria-label={state.code.split('').join(' ')}>{state.code.slice(0, 4)} {state.code.slice(4)}</div>
            <div className="mt-1 text-[15px] tabular-nums text-muted">{t('codeValid', { time: `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` })}</div>
            <Button kind="tinted" className="mt-6 h-[50px] w-full max-w-[320px]" onClick={share}><Icon.Share size={18} /> {t('shareLink')}</Button>
          </>
        ) : (
          <Button className="my-6 h-[50px] w-full max-w-[320px]" onClick={make}>{t('newCode')}</Button>
        )}
      </div>
    </Sheet>
  )
}

export function BlockedPage({ onBack }) {
  const res = useResource('/blocks')
  const [busy, setBusy] = useState(null)
  const unblock = async u => {
    setBusy(u.handle)
    try { await api(`/users/${u.handle}/block`, { method: 'DELETE' }); revalidate('/blocks'); toast(t('unblocked', { name: u.name })) } catch (e) { toast(e.message, 'error') }
    setBusy(null)
  }
  return (
    <Page onBack={onBack} label={t('blockedPeople')} title={<div className="truncate text-center text-[17px] font-semibold">{t('blockedPeople')}</div>}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-16">
        <Loadable res={res}>
          {d => d.users.length ? (
            <Group>
              {d.users.map(u => (
                <div key={u.handle} className="flex min-h-[60px] items-center gap-3 px-4">
                  <Avatar user={u} size={40} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[17px]">{u.name}</span><span className="block truncate text-[14px] text-muted">@{u.handle}</span></span>
                  <Button kind="gray" className="h-9 px-4 text-[15px]" disabled={busy === u.handle} onClick={() => unblock(u)}>{busy === u.handle ? <Spinner size={15} /> : t('unblock')}</Button>
                </div>
              ))}
            </Group>
          ) : <Empty icon={<Icon.Block size={34} />} title={t('noOneBlocked')} />}
        </Loadable>
      </div>
    </Page>
  )
}
