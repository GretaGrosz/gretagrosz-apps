// First visit: a clean splash, pick a face and a username, then back the account up with a passkey.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, setKey } from './api.js'
import { cancelled, passkeyChallenge, passkeysSupported, savePasskey, signInWithPasskey } from './device.js'
import { Logo } from './Feed.jsx'
import { AVATARS } from './People.jsx'
import { Avatar, Button, Icon, Spinner, useApp } from './ui.jsx'

const BARS = [30, 52, 78, 100, 64, 88, 46, 70, 36, 58, 24]

export default function Onboarding({ onIn }) {
  const { toast } = useApp()
  const [step, setStep] = useState('hello')
  const [emoji, setEmoji] = useState(() => AVATARS[Math.floor(Math.random() * AVATARS.length)])
  const [name, setName] = useState('')
  const [handle, setHandle] = useState('')
  const [touched, setTouched] = useState(false)
  const [key, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [made, setMade] = useState(null)
  const [challenge, setChallenge] = useState(null)

  // A passkey sign-in has to open straight from the tap, so the challenge is fetched before it
  useEffect(() => {
    if (step !== 'key' || !passkeysSupported) return
    const get = () => passkeyChallenge().then(setChallenge).catch(() => {})
    get()
    const t = setInterval(get, 4 * 60_000)
    return () => clearInterval(t)
  }, [step])

  const suggested = name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20)
  const finalHandle = touched ? handle : suggested
  const valid = /^[a-z0-9_]{3,20}$/.test(finalHandle) && name.trim()

  const signup = async () => {
    setBusy(true)
    try {
      const { key, user } = await api('/signup', { method: 'POST', body: { handle: finalHandle, name, emoji, hue: 0 } })
      setKey(key)
      if (passkeysSupported) { setMade(user); setStep('backup') } else onIn(user, true)
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const login = async () => {
    setBusy(true)
    try {
      const { user } = await api('/login', { method: 'POST', body: { key } })
      setKey(key.trim())
      onIn(user)
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }

  const backup = async () => {
    setBusy(true)
    try {
      await savePasskey(made)
      toast('Passkey saved')
      onIn(made, true)
    } catch (e) {
      if (!cancelled(e)) toast(e.message || "Couldn't save the passkey", 'error')
    }
    setBusy(false)
  }
  const passkeyLogin = async () => {
    if (!challenge) return
    setBusy(true)
    try {
      const { key, user } = await signInWithPasskey(challenge)
      setKey(key)
      onIn(user)
    } catch (e) {
      if (!cancelled(e)) toast(e.message || "Couldn't sign in", 'error')
      passkeyChallenge().then(setChallenge).catch(() => {})
    }
    setBusy(false)
  }

  const input = 'h-[52px] w-full rounded-xl bg-s1 px-4 text-[16px] outline-none placeholder:text-muted focus:ring-1 focus:ring-s3'

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-[500px] flex-col px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(16px,env(safe-area-inset-top))]">
      <AnimatePresence mode="wait">
        {step === 'hello' && (
          <motion.div key="hello" className="flex flex-1 flex-col" exit={{ opacity: 0 }}>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-24 items-center gap-[6px]">
                {BARS.map((h, i) => (
                  <motion.span
                    key={i}
                    className={`w-[7px] rounded-full ${i === 3 ? 'bg-accent' : 'bg-white'}`}
                    animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`] }}
                    transition={{ duration: 1 + (i % 3) * 0.2, repeat: Infinity, repeatType: 'mirror', delay: i * 0.06 }}
                  />
                ))}
              </div>
              <div className="mt-8"><Logo size={56} /></div>
              <p className="mt-3 max-w-[290px] text-[17px] text-muted">The social app with no typing. Posts, replies and chats are all voice.</p>
            </div>
            <Button className="h-[52px] w-full text-[17px]" onClick={() => setStep('face')}>Create account</Button>
            <button type="button" onClick={() => setStep('key')} className="mt-3 h-11 text-[15px] font-semibold text-white">I already have an account</button>
          </motion.div>
        )}

        {step === 'face' && (
          <motion.div key="face" className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button type="button" onClick={() => setStep('hello')} className="-ml-2 grid h-11 w-11 place-items-center" aria-label="Back"><Icon.Back size={26} /></button>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em]">Create your profile</h1>
            <p className="mt-1 text-[15px] text-muted">Pick a face, a name and a username.</p>
            <div className="mt-6 flex justify-center">
              <motion.div key={emoji} initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                <Avatar user={{ emoji }} size={104} />
              </motion.div>
            </div>
            <div className="mt-5 grid grid-cols-8 gap-1">
              {AVATARS.map(e => (
                <button key={e} type="button" onClick={() => setEmoji(e)} className={`grid aspect-square place-items-center rounded-xl text-[22px] transition ${emoji === e ? 'bg-s2 ring-2 ring-accent' : ''}`}>{e}</button>
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-2.5">
              <input value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="Name" className={input} />
              <label className={`${input} flex items-center`}>
                <span className="text-muted">@</span>
                <input value={finalHandle} onChange={e => { setTouched(true); setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)) }} placeholder="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} className="h-full flex-1 bg-transparent outline-none placeholder:text-muted" />
              </label>
            </div>
            <div className="flex-1" />
            <Button className="mt-6 h-[52px] w-full text-[17px]" disabled={!valid || busy} onClick={signup}>{busy ? <Spinner /> : 'Continue'}</Button>
          </motion.div>
        )}

        {step === 'key' && (
          <motion.div key="key" className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <button type="button" onClick={() => setStep('hello')} className="-ml-2 grid h-11 w-11 place-items-center" aria-label="Back"><Icon.Back size={26} /></button>
            <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em]">Welcome back</h1>
            {passkeysSupported && (
              <>
                <p className="mt-1 text-[15px] text-muted">Use the passkey you saved, or paste your login key.</p>
                <Button kind="white" className="mt-6 h-[52px] w-full text-[17px]" disabled={!challenge || busy} onClick={passkeyLogin}>
                  {busy && !key ? <Spinner /> : <><Icon.Passkey size={22} /> Sign in with passkey</>}
                </Button>
                <div className="mt-6 flex items-center gap-3 text-[13px] text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
              </>
            )}
            {!passkeysSupported && <p className="mt-1 text-[15px] text-muted">Paste the login key from Me → Login key on your other phone.</p>}
            <input value={key} onChange={e => setKeyInput(e.target.value)} placeholder="yap_…" autoCapitalize="none" autoCorrect="off" spellCheck={false} className={`${input} mt-6 font-mono text-[15px]`} />
            <div className="flex-1" />
            <Button className="mt-6 h-[52px] w-full text-[17px]" disabled={key.trim().length < 10 || busy} onClick={login}>{busy ? <Spinner /> : 'Sign in'}</Button>
          </motion.div>
        )}

        {step === 'backup' && made && (
          <motion.div key="backup" className="flex flex-1 flex-col" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="relative">
                <Avatar user={made} size={96} />
                <span className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full border-4 border-black bg-accent text-white"><Icon.Passkey size={20} /></span>
              </div>
              <h1 className="mt-6 text-[28px] font-bold tracking-[-0.03em]">Save your account</h1>
              <p className="mt-2 max-w-[300px] text-[16px] text-muted">Yap has no passwords. Save a passkey and you can always get back in with Face ID, even on a new phone.</p>
            </div>
            <Button className="h-[52px] w-full text-[17px]" disabled={busy} onClick={backup}>{busy ? <Spinner /> : 'Save passkey'}</Button>
            <button type="button" onClick={() => onIn(made, true)} className="mt-3 h-11 text-[15px] font-semibold text-muted">Not now</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
