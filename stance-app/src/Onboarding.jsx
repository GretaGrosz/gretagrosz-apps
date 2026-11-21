// The account sheet. Guests read everything first; this opens at the first thing that needs an account
// (taking a side, practising, a debate) or from You. New: a name and a username, then a passkey. Back: passkey or login key.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, setKey } from './api.js'
import { cancelled, passkeyChallenge, passkeysSupported, savePasskey, signInWithPasskey, unlockWord } from './device.js'
import { t } from './i18n.js'
import { Avatar, Button, Icon, Sheet, Spinner, spring } from './ui.jsx'

// "Gréta Müller" → "greta_muller": marks dropped, ß → ss, everything else to _
export const suggestHandle = name => name.toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 20)

export default function AccountSheet({ open, mode = 'new', onClose, onDone }) {
  const [step, setStep] = useState(mode)
  const [made, setMade] = useState(null)
  useEffect(() => { if (open) { setStep(mode); setMade(null) } }, [open, mode])
  // Once the account exists, closing the sheet still signs you in (the passkey is optional)
  const close = () => (made ? onDone(made, true) : onClose())
  return (
    <Sheet open={open} onClose={close} z={70} label={t(step === 'signin' ? 'account.signinTitle' : 'account.newTitle')}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }} className="px-6 pb-6">
          {step === 'new' && <NewAccount onMade={user => { if (passkeysSupported) { setMade(user); setStep('backup') } else onDone(user, true) }} onSignin={() => setStep('signin')} />}
          {step === 'backup' && made && <Backup user={made} onDone={() => onDone(made, true)} />}
          {step === 'signin' && <SignIn onIn={user => onDone(user, false)} onNew={() => setStep('new')} />}
        </motion.div>
      </AnimatePresence>
    </Sheet>
  )
}

const field = 'h-[52px] w-full rounded-[14px] bg-fill px-4 text-[17px] text-fg outline-none placeholder:text-fg3 focus:ring-2 focus:ring-accent/50'

function NewAccount({ onMade, onSignin }) {
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [taken, setTaken] = useState(null) // the handle the server said is taken
  const finalHandle = touched ? handle : suggestHandle(name)
  const validHandle = /^[a-z0-9_]{3,20}$/.test(finalHandle)
  const ok = name.trim() && validHandle && taken !== finalHandle && !busy

  // Check the username while typing, so "taken" shows up before Continue
  useEffect(() => {
    if (!validHandle) return
    let live = true
    const id = setTimeout(() => {
      api('/handles/' + finalHandle).then(r => { if (live && !r.available) setTaken(finalHandle) }).catch(() => {})
    }, 350)
    return () => { live = false; clearTimeout(id) }
  }, [finalHandle, validHandle])

  const submit = async e => {
    e.preventDefault()
    if (!ok) return
    setBusy(true); setError('')
    try {
      const { key, user } = await api('/signup', { method: 'POST', body: { handle: finalHandle, name: name.trim() } })
      setKey(key)
      onMade(user)
    } catch (err) {
      if (err.status === 409) setTaken(finalHandle)
      else setError(err.message)
      setBusy(false)
    }
  }
  const handleError = taken === finalHandle ? t('account.taken', { handle: finalHandle })
    : finalHandle && !validHandle && touched ? t('account.handleRule') : ''

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="pt-1 text-[28px] font-bold leading-tight">{t('account.newTitle')}</h2>
      <div className="mt-5 flex justify-center"><Avatar user={{ name: name || '?' }} size={72} /></div>
      <div className="mt-5 flex flex-col gap-3">
        <input value={name} onChange={e => { setName(e.target.value); setError('') }} maxLength={40} placeholder={t('account.name')} aria-label={t('account.name')}
          autoComplete="name" enterKeyHint="next" className={field} autoFocus />
        <div>
          <label className={`${field} flex items-center gap-0.5 ${handleError ? '!ring-2 !ring-danger/60' : ''}`}>
            <span className="text-fg2">@</span>
            <input value={finalHandle} aria-label={t('account.username')} aria-invalid={!!handleError} aria-describedby="handle-error"
              onChange={e => { setTouched(true); setError(''); setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)) }}
              placeholder={t('account.username')} autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go"
              className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg3" />
            {validHandle && taken !== finalHandle && finalHandle && <Icon.Check size={18} className="shrink-0 text-accent-ink" />}
          </label>
          <p id="handle-error" className="h-6 px-1 pt-1 text-[13.5px] text-danger" aria-live="polite">{handleError || error}</p>
        </div>
      </div>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={!ok}>{busy ? <Spinner /> : t('account.continue')}</Button>
      <Button kind="plain" className="mt-1 w-full" onClick={onSignin}>{t('account.haveOne')}</Button>
    </form>
  )
}

function Backup({ user, onDone }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    setBusy(true); setError('')
    try {
      await savePasskey(user)
      onDone()
    } catch (e) {
      if (!cancelled(e)) setError(e.message || t('account.passkeyFail'))
      setBusy(false)
    }
  }
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <div className="relative">
        <Avatar user={user} size={84} />
        <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-white ring-4 ring-[rgb(var(--surface))]"><Icon.Passkey size={19} /></span>
      </div>
      <h2 className="mt-5 text-[26px] font-bold">{t('account.keepTitle')}</h2>
      <p className="mt-1.5 max-w-[300px] text-[16px] leading-snug text-fg2">{t('account.keepText', { unlock: unlockWord() })}</p>
      <p className="h-6 pt-1 text-[13.5px] text-danger" aria-live="polite">{error}</p>
      <Button size="lg" className="mt-1 w-full" disabled={busy} onClick={save}>{busy ? <Spinner /> : <><Icon.Passkey size={20} />{t('account.savePasskey')}</>}</Button>
      <Button kind="plain" className="mt-1 w-full !text-fg" onClick={onDone}>{t('account.notNow')}</Button>
    </div>
  )
}

function SignIn({ onIn, onNew }) {
  const [key, setKeyInput] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [challenge, setChallenge] = useState(null)
  const live = useRef(true)

  // A passkey sign-in has to open straight from the tap, so the challenge is fetched before it
  useEffect(() => {
    live.current = true
    if (!passkeysSupported) return
    const get = () => passkeyChallenge().then(c => live.current && setChallenge(c)).catch(() => {})
    get()
    const id = setInterval(get, 4 * 60_000)
    return () => { live.current = false; clearInterval(id) }
  }, [])

  const withKey = async e => {
    e.preventDefault()
    if (key.trim().length < 10 || busy) return
    setBusy('key'); setError('')
    try {
      const { user } = await api('/login', { method: 'POST', body: { key: key.trim() } })
      setKey(key.trim())
      onIn(user)
    } catch (err) { setError(err.message); setBusy('') }
  }
  const withPasskey = async () => {
    if (!challenge || busy) return
    setBusy('passkey'); setError('')
    try {
      const { key: k, user } = await signInWithPasskey(challenge)
      setKey(k)
      onIn(user)
    } catch (err) {
      if (!cancelled(err)) setError(err.message || t('account.signinFail'))
      passkeyChallenge().then(setChallenge).catch(() => {})
      setBusy('')
    }
  }

  return (
    <form onSubmit={withKey} noValidate>
      <h2 className="pt-1 text-[28px] font-bold leading-tight">{t('account.signinTitle')}</h2>
      {passkeysSupported && (
        <>
          <Button size="lg" className="mt-6 w-full" disabled={!challenge || !!busy} onClick={withPasskey}>
            {busy === 'passkey' ? <Spinner /> : <><Icon.Passkey size={21} />{t('account.withPasskey')}</>}
          </Button>
          <div className="my-5 flex items-center gap-3 text-[13px] text-fg2"><span className="h-px flex-1 bg-line" />{t('account.or')}<span className="h-px flex-1 bg-line" /></div>
        </>
      )}
      <input value={key} onChange={e => { setKeyInput(e.target.value); setError('') }} placeholder={t('account.keyPlaceholder')} aria-label={t('account.loginKey')}
        autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" className={`${field} font-mono text-[16px] ${passkeysSupported ? '' : 'mt-6'}`} />
      <p className="h-6 px-1 pt-1 text-[13.5px] text-danger" aria-live="polite">{error}</p>
      <motion.div layout transition={spring}>
        <Button type="submit" kind="gray" size="lg" className="mt-1 w-full" disabled={key.trim().length < 10 || !!busy}>{busy === 'key' ? <Spinner /> : t('account.withKey')}</Button>
      </motion.div>
      <Button kind="plain" className="mt-1 w-full" onClick={onNew}>{t('account.createInstead')}</Button>
    </form>
  )
}
