// Profiles (yours and other people's) and your settings: language, notifications, passkey, login key, account.
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api, appLink, getKey, useLoad } from './api.js'
import { cancelled, disablePush, enablePush, passkeysSupported, pushStatus, savePasskey, unlockWord } from './device.js'
import { lang, setLang, t } from './i18n.js'
import { OpinionCard } from './Today.jsx'
import { DebateCard } from './Debates.jsx'
import { Avatar, Button, Card, Confirm, Empty, Icon, LargeTitle, LoadError, Page, Segmented, SectionTitle, Sheet, Spinner, TextArea, useApp } from './ui.jsx'

async function share(user, toast) {
  const url = appLink('user/' + user.handle)
  try {
    if (navigator.share) return await navigator.share({ title: t('profile.shareTitle', { name: user.name }), url })
  } catch (e) { if (e?.name === 'AbortError') return }
  try { await navigator.clipboard.writeText(url); toast(t('ui.linkCopied')) } catch { toast(url) }
}

function Stat({ n, label }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="text-[22px] font-semibold tabular-nums">{n ?? '–'}</div>
      <div className="truncate px-0.5 text-[12px] leading-tight text-fg2">{label}</div>
    </div>
  )
}

/** The top of a profile: who they are, what their arguments have done, and what you can do */
function Header({ data, children }) {
  const { user, stats } = data
  return (
    <div className="px-4">
      <div className="flex flex-col items-center pt-2 text-center">
        <Avatar user={user} size={88} />
        <h1 className="prose-wrap mt-3 text-[26px] font-bold leading-tight">{user.name}</h1>
        <div className="text-[15px] text-fg2">@{user.handle}</div>
        {user.bio && <p className="serif prose-wrap mt-3 max-w-[360px] text-[18px] italic leading-snug text-fg">{user.bio}</p>}
      </div>
      <Card className="mt-5 flex px-2 py-3.5">
        <Stat n={stats.opinions} label={t('profile.arguments')} />
        <Stat n={stats.points} label={t('profile.points')} />
        <Stat n={stats.convinced} label={t('profile.minds')} />
        <Stat n={stats.debates ? `${stats.wins}/${stats.debates}` : 0} label={t('profile.won')} />
      </Card>
      <div className="mt-3 flex gap-2.5">{children}</div>
    </div>
  )
}

/** Their arguments and debates */
function Body({ data, mine }) {
  const [tab, setTab] = useState('arguments')
  return (
    <div className="mt-6">
      <div className="px-4">
        <Segmented value={tab} onChange={setTab} label={t('profile.arguments')} options={[{ id: 'arguments', label: t('profile.arguments') }, { id: 'debates', label: t('debates.title') }]} />
      </div>
      <div className="mt-4 flex flex-col gap-3 px-4">
        {tab === 'arguments' ? (
          <>
            {data.opinions.map(o => <OpinionCard key={o.id} compact opinion={o} question={o.question} />)}
            {data.hidden > 0 && <p className="flex items-center justify-center gap-2 px-4 py-3 text-center text-[14.5px] text-fg2"><Icon.Lock size={16} />{t('profile.hidden', { n: data.hidden })}</p>}
            {!data.opinions.length && !data.hidden && <Empty icon={<Icon.Quote size={28} />} title={t('profile.noArguments')} />}
          </>
        ) : (
          <>
            {data.debates.map(d => <DebateCard key={d.id} debate={d} />)}
            {!data.debates.length && <Empty icon={<Icon.Debate size={28} />} title={t('profile.noDebates')} />}
          </>
        )}
      </div>
    </div>
  )
}

/** Someone else's profile, pushed as a page */
export function Profile({ handle, onBack, covered }) {
  const { toast, openNewDebate, refresh } = useApp()
  const { data, error, reload } = useLoad(`user.${handle}`, `/users/${handle}`, [refresh])
  return (
    <Page covered={covered} onBack={onBack} title={data?.user.name}>
      {!data ? (
        error?.status === 404 ? <Empty icon={<Icon.You size={30} />} title={t('profile.nobody')} />
          : error ? <LoadError error={error} onRetry={reload} />
          : <div className="grid place-items-center py-24 text-fg2"><Spinner size={26} /></div>
      ) : (
        <>
          <Header data={data}>
            <Button className="flex-1" onClick={() => openNewDebate({ opponent: data.user })}><Icon.Swords size={18} />{t('profile.challenge')}</Button>
            <Button kind="gray" className="w-[52px] !px-0" aria-label={t('ui.share')} onClick={() => share(data.user, toast)}><Icon.Share size={19} /></Button>
          </Header>
          <Body data={data} />
        </>
      )}
    </Page>
  )
}

/** The You tab */
export function Me() {
  const { me, toast, refresh, signIn, signUp } = useApp()
  const { data, error, reload } = useLoad(me ? `user.${me.handle}` : null, me ? `/users/${me.handle}` : '', [refresh])
  const [editing, setEditing] = useState(false)
  return (
    <div>
      <LargeTitle title={t('tab.you')} />
      {me === null ? (
        <div className="px-4">
          <Card className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
            <img src="/stance/icon-192.png" alt="" className="h-[72px] w-[72px]" />
            <div className="mt-3 text-[22px] font-bold">Agora</div>
            <Button size="lg" className="mt-5 w-full" onClick={signUp}>{t('account.newTitle')}</Button>
            <Button kind="gray" size="lg" className="mt-2 w-full" onClick={signIn}>{t('account.haveOne')}</Button>
          </Card>
        </div>
      ) : me === undefined ? (
        <div className="grid place-items-center py-24 text-fg2"><Spinner size={26} /></div>
      ) : !data ? (
        error ? <LoadError error={error} onRetry={reload} /> : <div className="grid place-items-center py-24 text-fg2"><Spinner size={26} /></div>
      ) : (
        <>
          <Header data={{ ...data, user: me }}>
            <Button kind="gray" className="flex-1" onClick={() => setEditing(true)}>{t('profile.edit')}</Button>
            <Button kind="gray" className="flex-1" onClick={() => share(me, toast)}><Icon.Share size={18} />{t('ui.share')}</Button>
          </Header>
          <Body data={data} mine />
        </>
      )}
      <Settings />
      {me && <EditProfile open={editing} onClose={() => setEditing(false)} />}
    </div>
  )
}

function EditProfile({ open, onClose }) {
  const { me, setMe, toast, bump } = useApp()
  const [name, setName] = useState(me.name)
  const [bio, setBio] = useState(me.bio)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setName(me.name); setBio(me.bio) } }, [open])
  const save = async e => {
    e?.preventDefault()
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      const { user } = await api('/me', { method: 'PATCH', body: { name, bio } })
      setMe(user)
      bump()
      onClose()
    } catch (err) { toast(err.message, 'error') }
    setBusy(false)
  }
  return (
    <Sheet open={open} onClose={onClose} title={t('profile.edit')}>
      <form onSubmit={save} className="px-5 pb-6">
        <label className="block px-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2" htmlFor="ep-name">{t('account.name')}</label>
        <input id="ep-name" value={name} onChange={e => setName(e.target.value)} maxLength={40} className="mt-2 h-[52px] w-full rounded-[14px] bg-surface px-4 text-[17px] outline-none focus:ring-2 focus:ring-accent/50" />
        <div className="mt-5 px-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('profile.bio')}</div>
        <div className="mt-2 rounded-[14px] bg-surface px-4 pt-3">
          <TextArea value={bio} onChange={setBio} max={160} rows={2} placeholder={t('profile.bioPh')} label={t('profile.bio')} />
        </div>
        <Button type="submit" size="lg" className="mt-6 w-full" disabled={!name.trim() || busy}>{busy ? <Spinner /> : t('ui.save')}</Button>
      </form>
    </Sheet>
  )
}

// ---------- settings ----------

function Row({ icon, title, text, children, onClick, danger }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className="flex min-h-[52px] w-full items-center gap-3 border-b border-line px-4 py-3 text-left last:border-0 active:bg-fill">
      {icon && <span className={danger ? 'text-danger' : 'text-fg2'}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <div className={`text-[16.5px] ${danger ? 'text-danger' : ''}`}>{title}</div>
        {text && <div className="text-[13.5px] leading-snug text-fg2">{text}</div>}
      </div>
      {children}
    </Tag>
  )
}

function Switch({ on, onClick, disabled, label }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onClick}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? 'bg-[#34C759]' : 'bg-fill2'}`}>
      <motion.span className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)]" animate={{ left: on ? 22 : 2 }} transition={{ type: 'spring', damping: 24, stiffness: 400 }} />
    </button>
  )
}

function Settings() {
  const { toast, signOut, signedOut, passkeys, setPasskeys, me } = useApp()
  const [push, setPush] = useState(null)
  const [busy, setBusy] = useState(false)
  const [install, setInstall] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const check = () => pushStatus().then(setPush).catch(() => setPush('unsupported'))
  useEffect(() => { if (me) check() }, [!!me])

  const togglePush = async () => {
    setBusy(true)
    try {
      if (push === 'on') { await disablePush(); toast(t('push.off')) }
      else { await enablePush(); toast(t('push.on')); api('/push/test', { method: 'POST' }).catch(() => {}) }
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
    check()
  }
  const addPasskey = async () => {
    setBusy(true)
    try { const r = await savePasskey(me); setPasskeys(r.passkeys); toast(t('account.passkeySaved')) } catch (e) { if (!cancelled(e)) toast(e.message || t('account.passkeyFail'), 'error') }
    setBusy(false)
  }
  const copyKey = async () => {
    try { await navigator.clipboard.writeText(getKey()); toast(t('you.keyCopied')) } catch { setShowKey(true) }
  }
  const del = async () => {
    setDeleteBusy(true)
    try {
      await api('/me', { method: 'DELETE' })
      await disablePush().catch(() => {})
      setDeleting(false)
      signedOut()
      toast(t('you.deleted'))
    } catch (e) { toast(e.message, 'error') }
    setDeleteBusy(false)
  }
  const pushText = { denied: t('push.deniedText'), install: t('push.installText'), unsupported: t('push.unsupported') }[push] || ''

  return (
    <div className="px-4 pb-4">
      <SectionTitle className="!px-1">{t('you.settings')}</SectionTitle>
      <Card className="overflow-hidden !rounded-[18px]">
        <div className="flex min-h-[52px] items-center gap-3 border-b border-line px-4 py-2.5 last:border-0">
          <span className="text-fg2"><Icon.Globe size={21} /></span>
          <span className="min-w-0 flex-1 text-[16.5px]">{t('you.language')}</span>
          <Segmented className="w-[176px]" value={lang} onChange={v => v !== lang && setLang(v)} label={t('you.language')} options={[{ id: 'en', label: 'English' }, { id: 'de', label: 'Deutsch' }]} />
        </div>
        {me && (
          <>
            <Row icon={<Icon.Bell size={21} />} title={t('push.title')} text={pushText}>
              {(push === 'on' || push === 'off') && <Switch on={push === 'on'} disabled={busy} onClick={togglePush} label={t('push.title')} />}
              {push === 'install' && <Button size="sm" kind="gray" onClick={() => setInstall(true)}>{t('push.how')}</Button>}
            </Row>
            {passkeysSupported && (
              <Row icon={<Icon.Passkey size={21} />} title={t('you.passkey')} text={passkeys ? t('you.passkeyOn', { unlock: unlockWord() }) : ''}>
                {passkeys ? <span className="flex items-center gap-1 text-[15px] font-semibold text-accent-ink"><Icon.Check size={18} />{t('you.on')}</span>
                  : <Button size="sm" disabled={busy} onClick={addPasskey}>{t('ui.save')}</Button>}
              </Row>
            )}
            <div className="border-b border-line px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-fg2"><Icon.Key size={21} /></span>
                <div className="min-w-0 flex-1 text-[16.5px]">{t('account.loginKey')}</div>
                <Button kind="gray" size="sm" onClick={copyKey}>{t('you.copy')}</Button>
                <Button kind="gray" size="sm" onClick={() => setShowKey(s => !s)}>{showKey ? t('you.hide') : t('you.show')}</Button>
              </div>
              {showKey && <code className="mt-3 block select-all break-all rounded-xl bg-fill px-3 py-2.5 font-mono text-[13px]">{getKey()}</code>}
            </div>
            <Row title={t('you.signOut')} onClick={signOut} />
            <Row title={t('you.delete')} danger onClick={() => setDeleting(true)} />
          </>
        )}
      </Card>
      <p className="mt-6 text-center text-[13px] text-fg2">{t('you.footer')}</p>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
      <Confirm open={deleting} onClose={() => setDeleting(false)} title={t('you.deleteQ')} action={t('you.delete')} danger busy={deleteBusy} onConfirm={del}>
        {t('you.deleteText')}
      </Confirm>
    </div>
  )
}

function InstallSheet({ open, onClose }) {
  const { passkeys } = useApp()
  const steps = [
    passkeys ? null : [t('install.passkey'), t('install.passkeyText', { unlock: unlockWord() })],
    [<>{t('install.share1')} <Icon.Share size={17} className="mx-0.5 inline -translate-y-[2px]" /> {t('install.share2')}</>, ''],
    [t('install.add'), ''],
    [t('install.open'), ''],
  ].filter(Boolean)
  return (
    <Sheet open={open} onClose={onClose} title={t('install.title')}>
      <div className="px-5 pb-6">
        <ol className="flex flex-col gap-4">
          {steps.map(([title, text], i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[14px] font-bold text-white">{i + 1}</span>
              <div className="pt-0.5"><div className="text-[16.5px] font-semibold">{title}</div>{text && <div className="text-[14.5px] text-fg2">{text}</div>}</div>
            </li>
          ))}
        </ol>
        <Button size="lg" className="mt-6 w-full" onClick={onClose}>{t('ui.done')}</Button>
      </div>
    </Sheet>
  )
}
