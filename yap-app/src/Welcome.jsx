// Before an account: hear Yap first (the welcome from @yap, today's question, and whoever invited you),
// then make an account in two fields, back it up with a passkey, or sign in with a passkey or a code.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, setKey } from './api.js'
import { cancelled, isIOS, isStandalone, passkeyChallenge, passkeysSupported, savePasskey, signInWithPasskey, unlockName } from './device.js'
import { t } from './i18n.js'
import { AVATARS } from './Me.jsx'
import { InstallSheet } from './Setup.jsx'
import { AppContext, Avatar, Button, Caption, Icon, PlayButton, SPRING, Spinner, Waveform, fmt, toast } from './ui.jsx'
import { Wordmark } from './App.jsx'

const GUEST = 'yap.guest'
const INVITE = 'yap.invite'

/** Suggests a username from a name, keeping the letters under accents: Gréta Müller → greta_muller, Strauß → strauss */
export const handleFrom = name => name.normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').replace(/[æ]/gi, 'ae').replace(/[øœ]/gi, 'o')
  .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20)

export default function Welcome({ onIn }) {
  const [step, setStep] = useState('guest')
  const [made, setMade] = useState(null) // { key, user } after sign-up, before the passkey step
  const [inviter, setInviter] = useState(null)
  const [invite, setInvite] = useState(() => { try { return sessionStorage.getItem(INVITE) } catch { return null } })
  const [guest, setGuest] = useState(() => { try { return JSON.parse(localStorage.getItem(GUEST) || 'null') } catch { return null } })
  const [guestError, setGuestError] = useState(false)
  const [linking, setLinking] = useState(false)

  const loadGuest = () => {
    setGuestError(false)
    api('/guest', { key: null }).then(d => { setGuest(d); try { localStorage.setItem(GUEST, JSON.stringify(d)) } catch {} }).catch(() => setGuestError(true))
  }
  useEffect(() => {
    loadGuest()
    const m = location.hash.match(/^#(join|link)\/(\w+)/)
    if (m?.[1] === 'join') {
      setInvite(m[2])
      try { sessionStorage.setItem(INVITE, m[2]) } catch {}
      history.replaceState(null, '', location.pathname)
    }
    // A one-time code in the address: from "Sign in on another device", or carried into the Home Screen app
    if (m?.[1] === 'link') {
      history.replaceState(null, '', location.pathname)
      setLinking(true)
      api('/login', { method: 'POST', key: null, body: { code: m[2] } })
        .then(({ key, user }) => onIn(key, user))
        .catch(e => { setLinking(false); toast(e.message, 'error'); setStep('signin') })
    }
  }, [])
  useEffect(() => {
    if (!invite) return
    api(`/invite/${invite}`, { key: null }).then(d => setInviter(d.user)).catch(() => { setInvite(null); try { sessionStorage.removeItem(INVITE) } catch {} })
  }, [invite])

  const finish = () => {
    try { sessionStorage.removeItem(INVITE) } catch {}
    onIn(made.key, made.user)
  }

  if (linking) return <div className="grid min-h-[100dvh] place-items-center"><Spinner size={26} /></div>

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[520px] flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
      <AnimatePresence mode="wait" initial={false}>
        {step === 'guest' && (
          <motion.div key="guest" className="flex flex-1 flex-col" exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
            <header className="flex h-12 items-center justify-between">
              <Wordmark />
              <button type="button" onClick={() => setStep('signin')} className="-mr-2 h-11 px-2 text-[17px] font-semibold text-accent">{t('signIn')}</button>
            </header>
            <div className="flex-1 pb-6">
              {inviter && <InviterCard user={inviter} />}
              {guest?.welcome && <GuestPost post={guest.welcome} />}
              {guest?.prompt && (
                <section className="mt-4 rounded-[20px] bg-surface p-4">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.03em] text-accent"><Icon.Question size={16} /> {t('dailyQuestion')}</div>
                  <p className="mt-1.5 text-[22px] font-bold leading-[1.2]">{guest.prompt.text}</p>
                  <div className="mt-4 flex justify-end">
                    <Button className="h-11 px-5 text-[16px]" onClick={() => setStep('create')}><Icon.MicFill size={18} /> {t('answer')}</Button>
                  </div>
                </section>
              )}
              {!guest && (guestError
                ? <div className="py-16 text-center"><div className="text-[17px] text-muted">{t('couldntLoad')}</div><Button kind="tinted" className="mx-auto mt-3 h-11 px-5" onClick={loadGuest}>{t('retry')}</Button></div>
                : <div className="grid place-items-center py-20 text-muted"><Spinner size={24} /></div>)}
            </div>
            <div className="sticky bottom-[max(20px,env(safe-area-inset-bottom))]">
              <Button className="h-[54px] w-full text-[18px]" onClick={() => setStep('create')}>{inviter ? t('joinName', { name: inviter.name.split(' ')[0] }) : t('createAccount')}</Button>
            </div>
          </motion.div>
        )}

        {step === 'create' && (
          <Create key="create" invite={invite} inviter={inviter} onBack={() => setStep('guest')}
            onMade={d => { setKey(d.key); setMade(d); if (passkeysSupported) setStep('backup'); else onIn(d.key, d.user) }} />
        )}
        {step === 'signin' && <SignIn key="signin" onBack={() => setStep('guest')} onIn={onIn} />}
        {step === 'backup' && made && <Backup key="backup" made={made} onDone={finish} />}
      </AnimatePresence>
    </div>
  )
}

function InviterCard({ user }) {
  const bio = user.bio
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mt-4 flex flex-col items-center rounded-[20px] bg-surface px-5 py-6 text-center">
      <Avatar user={user} size={88} />
      <h1 className="mt-3 text-[26px] font-bold leading-tight">{t('invitedYou', { name: user.name })}</h1>
      <div className="text-[16px] text-muted">@{user.handle}</div>
      {bio && (
        <div className="mt-4 flex w-full max-w-[320px] items-center gap-2.5 rounded-full bg-fill py-1.5 pl-1.5 pr-4">
          <PlayButton item={{ id: 'invite-bio', audio: bio.audio, duration: bio.duration, fx: bio.fx, user }} size={36} label={t('voiceBio')} />
          <Waveform id="invite-bio" wave={bio.wave} height={24} />
          <span className="text-[14px] tabular-nums text-muted">{fmt(bio.duration)}</span>
        </div>
      )}
    </motion.section>
  )
}

function GuestPost({ post }) {
  const item = { id: 'guest-' + post.id, audio: post.audio, duration: post.duration, user: post.user }
  return (
    <article className="mt-4 rounded-[20px] bg-surface p-4">
      <div className="flex items-center gap-3">
        <Avatar user={post.user} size={40} />
        <div className="min-w-0"><div className="text-[16px] font-semibold">{post.user.name}</div><div className="text-[14px] text-muted">@{post.user.handle}</div></div>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-fill p-3">
        <PlayButton item={item} size={44} label={post.user.name} />
        <Waveform id={item.id} wave={post.wave} height={36} />
        <span className="w-10 text-right text-[14px] font-medium tabular-nums text-muted">{fmt(post.duration)}</span>
      </div>
      <Caption text={post.transcript} className="mt-2 px-1" />
    </article>
  )
}

const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: SPRING }

function Create({ invite, inviter, onBack, onMade }) {
  const [emoji, setEmoji] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [touched, setTouched] = useState(false)
  const [check, setCheck] = useState({ handle: '', state: 'idle' }) // checking | free | taken | invalid
  const [busy, setBusy] = useState(false)
  const final = touched ? handle : handleFrom(name)
  const valid = /^[a-z0-9_]{3,20}$/.test(final)

  useEffect(() => {
    if (!final) return setCheck({ handle: '', state: 'idle' })
    if (!valid) return setCheck({ handle: final, state: 'invalid' })
    setCheck({ handle: final, state: 'checking' })
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      api(`/handles/${final}`, { key: null, signal: ctrl.signal })
        .then(d => setCheck({ handle: final, state: d.available ? 'free' : 'taken', suggestion: d.suggestion }))
        .catch(e => e.name !== 'AbortError' && setCheck({ handle: final, state: 'idle' }))
    }, 300)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [final])

  const signup = async () => {
    setBusy(true)
    try {
      const d = await api('/signup', { method: 'POST', key: null, body: { handle: final, name: name.trim(), emoji, hue: 0, invite } })
      onMade(d)
    } catch (e) {
      toast(e.message, 'error')
      if (e.code === 'handleTaken') setCheck({ handle: final, state: 'taken' })
    }
    setBusy(false)
  }
  const field = 'h-[52px] w-full rounded-[12px] bg-surface px-4 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-accent/40'
  const status = check.handle === final ? check.state : 'idle'
  return (
    <motion.div className="flex flex-1 flex-col" {...slide}>
      <div className="flex h-12 items-center">
        <button type="button" onClick={onBack} className="-ml-2 grid h-11 w-11 place-items-center text-accent" aria-label={t('back')}><Icon.Back size={24} /></button>
      </div>
      <h1 className="text-[34px] font-bold leading-tight">{inviter ? t('joinName', { name: inviter.name.split(' ')[0] }) : t('createAccount')}</h1>
      <div className="mt-6 flex justify-center">
        <motion.div key={emoji} initial={{ scale: 0.88 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}><Avatar user={{ emoji }} size={100} /></motion.div>
      </div>
      <div className="mt-5 grid grid-cols-8 gap-1" role="radiogroup" aria-label={t('picture')}>
        {AVATARS.map(e => (
          <button key={e} type="button" role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)}
            className={`grid aspect-square min-h-[42px] place-items-center rounded-[12px] text-[22px] ${emoji === e ? 'bg-accent-soft ring-2 ring-accent' : ''}`}>{e}</button>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={40} placeholder={t('name')} aria-label={t('name')} autoComplete="name" className={field} />
        <label className={`${field} flex items-center`}>
          <span className="text-muted">@</span>
          <input value={final} onChange={e => { setTouched(true); setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)) }}
            placeholder={t('username')} aria-label={t('username')} aria-describedby="handle-status" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username"
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted" />
          <span className="ml-2 shrink-0" aria-hidden="true">
            {status === 'checking' && <Spinner size={16} />}
            {status === 'free' && <Icon.Check size={20} className="text-[var(--green)]" />}
          </span>
        </label>
        <div id="handle-status" className="min-h-[22px] px-1 text-[15px]" aria-live="polite">
          {status === 'taken' && (
            <span className="text-[var(--red)]">{t('handleTaken', { handle: final })}{check.suggestion && <> · <button type="button" onClick={() => { setTouched(true); setHandle(check.suggestion) }} className="font-semibold text-accent underline-offset-2 hover:underline">@{check.suggestion}</button></>}</span>
          )}
          {status === 'invalid' && <span className="text-muted">{t('handleRule')}</span>}
        </div>
      </div>
      <div className="flex-1" />
      <Button className="mt-4 h-[54px] w-full text-[18px]" disabled={!valid || !name.trim() || busy || status === 'taken' || status === 'checking'} onClick={signup}>{busy ? <Spinner /> : t('continue')}</Button>
    </motion.div>
  )
}

/** Back the new account up. On iPhone Safari there's no "Not now": Safari and the Home Screen app don't share sign-ins. */
function Backup({ made, onDone }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [install, setInstall] = useState(false)
  const [installed, setInstalled] = useState(false)
  const strict = isIOS && !isStandalone
  const save = async () => {
    setBusy(true)
    try {
      await savePasskey()
      toast(t('passkeySaved'))
      onDone()
    } catch (e) {
      if (!cancelled(e)) { setFailed(true); toast(e.message || t('passkeyFailed'), 'error') }
    }
    setBusy(false)
  }
  const unlock = unlockName()
  return (
    <motion.div className="flex flex-1 flex-col" {...slide}>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <Avatar user={made.user} size={96} />
          <span className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border-4 border-[var(--bg)] bg-accent text-white"><Icon.Passkey size={20} /></span>
        </div>
        <h1 className="mt-6 text-[30px] font-bold leading-tight">{t('saveAccount')}</h1>
        <div className="mt-1 text-[17px] text-muted">@{made.user.handle}</div>
      </div>
      <Button className="h-[54px] w-full text-[18px]" disabled={busy} onClick={save}>{busy ? <Spinner /> : t('saveWith_' + unlock)}</Button>
      {strict ? (
        <>
          <Button kind="tinted" className="mt-3 h-[50px] w-full" onClick={() => setInstall(true)}>{t('addToHome')}</Button>
          {(failed || installed) && <button type="button" onClick={onDone} className="mt-2 h-11 text-[16px] font-semibold text-muted">{t('continueInSafari')}</button>}
        </>
      ) : (
        <button type="button" onClick={onDone} className="mt-3 h-11 text-[16px] font-semibold text-muted">{t('notNow')}</button>
      )}
      <AppContext.Provider value={{ me: made.user }}>
        <InstallSheet open={install} onClose={() => { setInstall(false); setInstalled(true) }} />
      </AppContext.Provider>
    </motion.div>
  )
}

function SignIn({ onBack, onIn }) {
  const [challenge, setChallenge] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(null)
  const input = useRef(null)
  // A passkey sign-in has to open straight from the tap, so the challenge is fetched before it
  useEffect(() => {
    if (!passkeysSupported) return
    const get = () => passkeyChallenge().then(setChallenge).catch(() => {})
    get()
    const timer = setInterval(get, 4 * 60_000)
    return () => clearInterval(timer)
  }, [])
  const passkey = async () => {
    if (!challenge) return
    setBusy('passkey')
    try {
      const { key, user } = await signInWithPasskey(challenge)
      onIn(key, user)
    } catch (e) {
      if (!cancelled(e)) toast(e.message || t('signInFailed'), 'error')
      passkeyChallenge().then(setChallenge).catch(() => {})
    }
    setBusy(null)
  }
  const isKey = code.trim().startsWith('yap_')
  const clean = code.toUpperCase().replace(/[^0-9A-Z]/g, '')
  const ready = isKey ? code.trim().length > 20 : clean.length === 8
  const withCode = async () => {
    setBusy('code')
    try {
      const { key, user } = await api('/login', { method: 'POST', key: null, body: isKey ? { key: code.trim() } : { code: clean } })
      onIn(key, user)
    } catch (e) { toast(e.message, 'error') }
    setBusy(null)
  }
  return (
    <motion.div className="flex flex-1 flex-col" {...slide}>
      <div className="flex h-12 items-center">
        <button type="button" onClick={onBack} className="-ml-2 grid h-11 w-11 place-items-center text-accent" aria-label={t('back')}><Icon.Back size={24} /></button>
      </div>
      <h1 className="text-[34px] font-bold leading-tight">{t('signIn')}</h1>
      {passkeysSupported && (
        <>
          <Button kind="label" className="mt-8 h-[54px] w-full text-[18px]" disabled={!challenge || !!busy} onClick={passkey}>
            {busy === 'passkey' ? <Spinner /> : <><Icon.Passkey size={22} /> {t('signInPasskey')}</>}
          </Button>
          <div className="my-6 flex items-center gap-3 text-[14px] text-muted"><span className="h-px flex-1 bg-[var(--sep)]" />{t('or')}<span className="h-px flex-1 bg-[var(--sep)]" /></div>
        </>
      )}
      <label className="text-[15px] font-medium text-muted" htmlFor="code">{t('codeFromDevice')}</label>
      <input ref={input} id="code" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && ready && withCode()}
        placeholder="XXXX XXXX" autoCapitalize="characters" autoCorrect="off" spellCheck={false} autoComplete="one-time-code" inputMode="text"
        className={`mt-2 h-[56px] w-full rounded-[12px] bg-surface px-4 font-mono outline-none placeholder:text-[var(--label-3)] focus:ring-2 focus:ring-accent/40 ${isKey ? 'text-[15px]' : 'text-[24px] tracking-[0.14em]'}`} />
      <div className="flex-1" />
      <Button className="mt-6 h-[54px] w-full text-[18px]" disabled={!ready || !!busy} onClick={withCode}>{busy === 'code' ? <Spinner /> : t('signIn')}</Button>
    </motion.div>
  )
}
