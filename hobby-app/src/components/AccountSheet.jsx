// Account screens: log in / create an account (with a passkey or a password), and the account section on the You page
// (account.jsx does the work)
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Icon, Segmented, Sheet, SheetHeader, Spinner } from './ui'

const ERRORS = {
  bad_username: 'Usernames are 3–24 letters, numbers, dots or underscores.',
  short_password: 'Your password needs at least 8 characters.',
  bad_password: 'That password is too long.',
  taken: 'That username is already taken.',
  rude_username: 'That username isn’t allowed. Pick a different one.',
  banned: 'This email belongs to an account that was banned for breaking the rules.',
  wrong_password: 'Wrong username or password.',
  too_many: 'Too many tries. Wait a few minutes, then try again.',
  offline: 'You’re offline. Connect to the internet and try again.',
  too_big: 'Your data is too big to save in the account.',
  bad_email: 'That email address doesn’t look right.',
  no_email_service: 'Password reset isn’t set up yet. Ask Greta.',
  bad_link: 'This link has expired or was already used. Ask for a new one.',
  logged_out: 'That account was logged out. Log in to it again.',
  expired: 'That took too long. Try again.',
  passkey_failed: 'That passkey didn’t work. Try again.',
  passkey_unknown: 'That passkey isn’t linked to a Blank account anymore.',
  passkey_taken: 'That passkey already belongs to another account.',
  too_many_passkeys: 'You already have plenty of passkeys.',
  // From the browser (a DOMException's name)
  InvalidStateError: 'This phone already has a passkey for this account.',
  SecurityError: 'Passkeys don’t work here. Use a password instead.',
  NotSupportedError: 'Passkeys don’t work here. Use a password instead.',
}
const errorText = (t, e) => t(ERRORS[e?.code] || ERRORS[e?.name] || 'Something went wrong. Try again.')
// The person closed the Face ID / fingerprint prompt: not an error, just stop
const cancelled = (e) => e?.name === 'NotAllowedError' || e?.name === 'AbortError'

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{label}</span>
      <input className="input" {...props} />
    </label>
  )
}

function Problem({ children }) {
  if (!children) return null
  return (
    <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
      {children}
    </p>
  )
}

// fresh: adding another account to this device (the projects of the one you're on stay with it)
export function LoginSheet({ onClose, initialMode = 'login', fresh = false, onDone }) {
  const { t } = useT()
  const { logIn, signUp, forgot } = useAccount()
  const { actions } = useStore()
  const { lang } = useT()
  const [mode, setMode] = useState(initialMode)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const signup = mode === 'signup'

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    const u = username.trim().toLowerCase().replace(/^@/, '')
    if (signup && !/^[a-z0-9._]{3,24}$/.test(u)) return setError(t(ERRORS.bad_username))
    if (signup && password.length < 8) return setError(t(ERRORS.short_password))
    if (signup && email.trim() && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim())) return setError(t(ERRORS.bad_email))
    setBusy(true)
    try {
      if (signup) await signUp(u, password, email.trim(), { fresh })
      else await logIn(u, password, { fresh })
      actions.toast({
        text: fresh ? 'Switched to @{name}' : signup ? 'Account created. Your projects are saved.' : 'Logged in. Your projects are synced.',
        vars: { name: u },
      })
      onClose()
      onDone?.(u)
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }

  if (mode === 'forgot') {
    const send = async (e) => {
      e.preventDefault()
      if (busy || !username.trim()) return
      setBusy(true)
      setError(null)
      try {
        await forgot(username.trim(), lang)
        setSent(true)
      } catch (err) {
        setError(errorText(t, err))
      } finally {
        setBusy(false)
      }
    }
    return (
      <Sheet onClose={onClose} label={t('Forgot password')}>
        <SheetHeader title={t('Forgot password')} onClose={onClose} />
        <form onSubmit={send} className="px-5 pb-2 pt-2">
          {sent ? (
            <p className="px-1 text-[17px] leading-snug">{t('If that account has an email, a link to choose a new password is on its way. Check your inbox (and spam).')}</p>
          ) : (
            <>
              <p className="px-1 text-[15px] leading-snug text-sub">{t('Enter your username or the email on your account. We’ll send a link to choose a new password.')}</p>
              <div className="mt-5">
                <Field
                  label={t('Username or email')}
                  data-autofocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                />
              </div>
              <Problem>{error}</Problem>
              <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
                {busy ? <Spinner className="h-5 w-5" /> : t('Send link')}
              </button>
            </>
          )}
          <button type="button" onClick={() => (setMode('login'), setSent(false), setError(null))} className="mt-3 h-11 w-full text-[15px] font-medium text-spark-ink active:opacity-60">
            {t('Back to log in')}
          </button>
        </form>
      </Sheet>
    )
  }

  return (
    <Sheet onClose={onClose} label={fresh ? t('Add account') : signup ? t('Create an account') : t('Log in')}>
      <SheetHeader title={fresh ? t('Add account') : signup ? t('Create an account') : t('Log in')} onClose={onClose} />
      <form onSubmit={submit} className="px-5 pb-2 pt-2">
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m)
            setError(null)
          }}
          label={t('Account')}
          options={[
            ['login', t('Log in')],
            ['signup', t('New account')],
          ]}
        />
        <p className="mt-4 px-1 text-[15px] leading-snug text-sub">
          {fresh
            ? t('The account you’re on keeps its projects. Switch back any time.')
            : signup
              ? t('Your projects, photos and streak are saved to your account, so you can open them on any phone or computer.')
              : t('Log in to get your projects on this device. Anything already here is kept too.')}
        </p>
        <div className="mt-5 space-y-4">
          <Field
            label={t('Username')}
            data-autofocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={25}
            required
          />
          <Field
            label={t('Password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'}
            placeholder={signup ? t('At least 8 characters') : undefined}
            maxLength={200}
            required
          />
          {signup && (
            <Field
              label={t('Email (optional)')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              placeholder={t('Only for resetting your password')}
              maxLength={254}
            />
          )}
        </div>
        {!signup && (
          <button type="button" onClick={() => (setMode('forgot'), setError(null))} className="mt-2 px-1 text-[15px] font-medium text-spark-ink active:opacity-60">
            {t('Forgot password?')}
          </button>
        )}
        <Problem>{error}</Problem>
        <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
          {busy ? <Spinner className="h-5 w-5" /> : signup ? t('Create account') : t('Log in')}
        </button>
        {signup && (
          <p className="mt-3 px-1 text-center text-[13px] leading-snug text-sub">
            {t('Without an email, a forgotten password can’t be reset.')}{' '}
            <a href={lang === 'hu' ? '/adatvedelem/' : '/datenschutz/'} target="_blank" rel="noopener" className="underline">
              {t('Privacy')}
            </a>
          </p>
        )}
      </form>
    </Sheet>
  )
}

// Make an account (or come back to one) with Face ID, a fingerprint or the phone's screen lock: no password.
// Without passkeys in this browser it's the normal LoginSheet. onDone(username) after it worked.
// fresh: adding another account to this device, like LoginSheet
export function PasskeySheet({ onClose, onDone, title, sub, fresh = false }) {
  const { t } = useT()
  const { passkeySupported, passkeySignUp, passkeyLogIn } = useAccount()
  const { actions } = useStore()
  const [password, setPassword] = useState(!passkeySupported)
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(null) // 'create' | 'login'
  const [error, setError] = useState(null)
  if (password) return <LoginSheet onClose={onClose} onDone={onDone} fresh={fresh} initialMode="login" />

  const run = async (kind, go) => {
    if (busy) return
    setError(null)
    setBusy(kind)
    try {
      const r = await go()
      actions.toast({
        text: fresh ? 'Switched to @{name}' : kind === 'create' ? 'Account created. Your projects are saved.' : 'Logged in. Your projects are synced.',
        vars: { name: r.username },
      })
      onClose()
      onDone?.(r.username)
    } catch (err) {
      if (!cancelled(err)) setError(errorText(t, err))
      setBusy(null)
    }
  }
  const create = (e) => {
    e.preventDefault()
    const u = username.trim().toLowerCase().replace(/^@/, '')
    if (!/^[a-z0-9._]{3,24}$/.test(u) || /^[._]|[._]$/.test(u)) return setError(t(ERRORS.bad_username))
    run('create', () => passkeySignUp(u, { fresh }))
  }
  const heading = title || t('Sign in to post')

  return (
    <Sheet onClose={onClose} label={heading}>
      <SheetHeader title={heading} onClose={onClose} />
      <form onSubmit={create} className="px-5 pb-2 pt-2">
        {sub && <p className="mb-5 px-1 text-[15px] leading-snug text-sub">{sub}</p>}
        <Field
          label={t('Username')}
          data-autofocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username webauthn"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={25}
          required
        />
        <Problem>{error}</Problem>
        <button type="submit" disabled={!!busy} className="btn-primary btn-lg mt-6 w-full">
          {busy === 'create' ? <Spinner className="h-5 w-5" /> : t('Continue with a passkey')}
        </button>
        <p className="mt-2 px-1 text-center text-[13px] leading-snug text-sub">{t('Face ID, fingerprint or your phone’s screen lock. No password.')}</p>
        <button
          type="button"
          onClick={() => run('login', () => passkeyLogIn({ fresh }))}
          disabled={!!busy}
          className="mt-4 flex h-11 w-full items-center justify-center text-[17px] font-medium text-spark-ink active:opacity-60"
        >
          {busy === 'login' ? <Spinner className="h-5 w-5" /> : t('I already have an account')}
        </button>
        <button type="button" onClick={() => setPassword(true)} disabled={!!busy} className="h-10 w-full text-[13px] text-sub active:opacity-60">
          {t('Use a password instead')}
        </button>
      </form>
    </Sheet>
  )
}

function EmailSheet({ onClose }) {
  const { t } = useT()
  const { getEmail, setEmail } = useAccount()
  const { actions } = useStore()
  const [email, setValue] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    getEmail()
      .then(setValue)
      .catch(() => setValue(''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await setEmail(email.trim())
      actions.toast({ text: email.trim() ? 'Email saved' : 'Email removed' })
      onClose()
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Email for password reset')}>
      <SheetHeader title={t('Email for password reset')} onClose={onClose} />
      <form onSubmit={save} className="px-5 pb-2 pt-2">
        <p className="px-1 text-[15px] leading-snug text-sub">{t('Blank only uses it to send you a link if you forget your password. Nobody else sees it.')}</p>
        {email === null ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-6 w-6 text-sub" />
          </div>
        ) : (
          <div className="mt-5">
            <Field label={t('Email')} type="email" data-autofocus value={email} onChange={(e) => setValue(e.target.value)} autoComplete="email" autoCapitalize="none" maxLength={254} />
          </div>
        )}
        <Problem>{error}</Problem>
        <button type="submit" disabled={busy || email === null} className="btn-primary btn-lg mt-6 w-full">
          {busy ? <Spinner className="h-5 w-5" /> : t('Save')}
        </button>
      </form>
    </Sheet>
  )
}

function LogOutSheet({ onClose }) {
  const { t } = useT()
  const { logOut } = useAccount()
  const [busy, setBusy] = useState(false)
  const go = async (forget) => {
    setBusy(true)
    await logOut(forget)
    onClose()
  }
  return (
    <Sheet onClose={onClose} label={t('Log out')}>
      <SheetHeader title={t('Log out')} onClose={onClose} />
      <div className="px-5 pb-2 pt-2">
        <p className="px-1 text-[15px] leading-snug text-sub">
          {t('Your projects and photos stay saved in your account. Photos that haven’t finished uploading yet would be lost if you remove them here.')}
        </p>
        <button onClick={() => go(false)} disabled={busy} className="btn-primary btn-lg mt-5 w-full">
          {t('Log out, keep everything here')}
        </button>
        <button onClick={() => go(true)} disabled={busy} className="btn-plain btn-lg mt-3 w-full text-bad">
          {t('Log out and remove from this device')}
        </button>
      </div>
    </Sheet>
  )
}

// mode: 'password' (change it, or set a first one on a passkey-only account) or 'delete'
function PasswordSheet({ onClose, mode }) {
  const { t } = useT()
  const { account, changePassword, deleteAccount } = useAccount()
  const { actions } = useStore()
  const del = mode === 'delete'
  const noPassword = account?.hasPassword === false // made with a passkey: nothing to type in
  const [password, setPassword] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!del && next.length < 8) return setError(t(ERRORS.short_password))
    setBusy(true)
    try {
      if (del) {
        await deleteAccount(password)
        actions.toast({ text: 'Account deleted. Your projects are still on this device.' })
      } else {
        await changePassword(password, next)
        actions.toast({ text: noPassword ? 'Password saved.' : 'Password changed. Other devices were logged out.' })
      }
      onClose()
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }
  const title = del ? t('Delete account') : noPassword ? t('Set a password') : t('Change password')
  return (
    <Sheet onClose={onClose} label={title}>
      <SheetHeader title={title} onClose={onClose} />
      <form onSubmit={submit} className="px-5 pb-2 pt-2">
        {del && (
          <p className="mb-4 px-1 text-[15px] leading-snug text-sub">
            {t('This deletes your account and the copy of your projects on the server. Everything on this device stays.')}
          </p>
        )}
        {!del && noPassword && (
          <p className="mb-4 px-1 text-[15px] leading-snug text-sub">{t('Optional: a second way in, for devices without your passkey.')}</p>
        )}
        <div className="space-y-4">
          {!noPassword && (
            <Field
              label={del ? t('Password') : t('Current password')}
              type="password"
              data-autofocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          )}
          {!del && (
            <Field
              label={t('New password')}
              type="password"
              data-autofocus={noPassword || undefined}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              placeholder={t('At least 8 characters')}
              maxLength={200}
              required
            />
          )}
        </div>
        <Problem>{error}</Problem>
        <button type="submit" disabled={busy} className={`btn-lg mt-6 w-full ${del ? 'btn bg-bad text-white' : 'btn-primary'}`}>
          {busy ? <Spinner className="h-5 w-5" /> : title}
        </button>
      </form>
    </Sheet>
  )
}

const STATUS = {
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline – syncs when you’re back online',
  error: 'Couldn’t sync – tap to try again',
}

// The top of the You page
export function AccountSection() {
  const { t } = useT()
  const { account, status, syncNow, saved } = useAccount()
  const [sheet, setSheet] = useState(null)
  const group = 'surface divide-y divide-line/15 overflow-hidden'
  const close = () => setSheet(null)

  return (
    <>
      {!account ? (
        <div className="surface mt-5 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
              <Icon name="user" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{t('Save your projects to an account')}</p>
              <p className="mt-0.5 text-[15px] leading-snug text-sub">{t('Open them on any phone or computer, and never lose them if this one breaks.')}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => setSheet('signup')} className="btn-primary">
              {t('Create account')}
            </button>
            <button onClick={() => setSheet(saved.length ? 'switch' : 'login')} className="btn-tinted">
              {t('Log in')}
            </button>
          </div>
        </div>
      ) : (
        <ul className={`${group} mt-5`}>
            <li className="row min-h-[56px]">
              <Link to={`/u/${account.username}`} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
                <Icon name="user" className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-medium">@{account.username}</span>
                <span className="block text-[13px] text-sub">{t('Your profile')}</span>
              </span>
              <Icon name="chevron" className="h-4 w-4 text-ink/30" strokeWidth={2.6} />
              </Link>
            </li>
            <li>
              <button onClick={() => setSheet('switch')} className="row min-h-[50px] w-full text-[17px] text-spark-ink active:bg-mist">
                <Icon name="friends" className="h-5 w-5" />
                <span className="flex-1 text-left">{t('Switch account')}</span>
                {saved.length > 1 && <span className="text-[15px] text-sub tabular-nums">{saved.length}</span>}
              </button>
            </li>
            <li className="row min-h-[44px]">
              <span className="min-w-0 flex-1">
                <button
                  onClick={status === 'error' || status === 'offline' ? syncNow : undefined}
                  className={`flex items-center gap-1.5 text-[13px] ${status === 'error' ? 'text-bad' : 'text-sub'}`}
                >
                  {status === 'syncing' ? <Spinner className="h-3 w-3" /> : status === 'synced' ? <Icon name="check" className="h-3 w-3 text-good" strokeWidth={3} /> : null}
                  {t(STATUS[status] || STATUS.synced)}
                </button>
              </span>
            </li>
        </ul>
      )}
      {sheet === 'login' || sheet === 'signup' ? <LoginSheet initialMode={sheet} onClose={close} /> : null}
      {sheet === 'switch' && <AccountSwitcher onClose={close} />}
    </>
  )
}

// Switch account, like Instagram: every account logged in on this device, and adding another one
// onSwitched(username): after switching (your own profile then shows the new account's)
export function AccountSwitcher({ onClose, onSwitched }) {
  const { t } = useT()
  const { account, saved, switchTo } = useAccount()
  const { actions } = useStore()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  if (adding) return <LoginSheet fresh initialMode="login" onClose={onClose} onDone={onSwitched} />
  const pick = async (username) => {
    if (busy) return
    if (username === account?.username) return onClose()
    setBusy(username)
    setError(null)
    try {
      await switchTo(username)
      actions.toast({ text: 'Switched to @{name}', vars: { name: username } })
      onClose()
      onSwitched?.(username)
    } catch (e) {
      setError(errorText(t, e))
      setBusy(null)
    }
  }
  const list = [...saved].sort((a, b) => (a.username === account?.username ? -1 : b.username === account?.username ? 1 : a.username.localeCompare(b.username)))
  return (
    <Sheet onClose={onClose} label={t('Switch account')}>
      <SheetHeader title={t('Switch account')} onClose={onClose} />
      <div className="px-5 pb-2">
        <ul className="surface divide-y divide-line/15 overflow-hidden">
          {list.map((a) => (
            <li key={a.username}>
              <button onClick={() => pick(a.username)} disabled={!!busy} className="row min-h-[56px] w-full text-left active:bg-mist">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spark-soft text-[16px] font-semibold uppercase text-spark-ink">
                  {a.username[0]}
                </span>
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">@{a.username}</span>
                {busy === a.username ? (
                  <Spinner className="h-5 w-5 text-sub" />
                ) : a.username === account?.username ? (
                  <Icon name="check" className="h-5 w-5 text-spark-ink" strokeWidth={2.6} />
                ) : null}
              </button>
            </li>
          ))}
          <li>
            <button onClick={() => setAdding(true)} disabled={!!busy} className="row min-h-[56px] w-full text-[17px] text-spark-ink active:bg-mist">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist">
                <Icon name="plus" className="h-5 w-5" />
              </span>
              {t('Add account')}
            </button>
          </li>
        </ul>
        <Problem>{error}</Problem>
      </div>
    </Sheet>
  )
}

// The account rows further down the You page (log out, password, delete)
export function AccountSettings() {
  const { t } = useT()
  const { account, passkeySupported, addPasskey } = useAccount()
  const { actions } = useStore()
  const [sheet, setSheet] = useState(null)
  const [adding, setAdding] = useState(false)
  if (!account) return null
  const close = () => setSheet(null)
  // Straight to the Face ID / fingerprint prompt; the result shows as a toast
  const addKey = async () => {
    if (adding) return
    setAdding(true)
    try {
      await addPasskey()
      actions.toast({ text: 'Passkey added. Next time just use Face ID or your fingerprint.' })
    } catch (err) {
      if (!cancelled(err)) actions.toast({ text: ERRORS[err?.code] || ERRORS[err?.name] || 'Something went wrong. Try again.' })
    } finally {
      setAdding(false)
    }
  }
  return (
    <>
      <h2 className="section-label mt-8">{t('Account')}</h2>
      <ul className="surface divide-y divide-line/15 overflow-hidden">
        <li>
          <button onClick={() => setSheet('email')} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist">
            <Icon name="bell" className="h-5 w-5" />
            {t('Email for password reset')}
          </button>
        </li>
        <li>
          <button onClick={() => setSheet('password')} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist">
            <Icon name="lock" className="h-5 w-5" />
            {account.hasPassword === false ? t('Set a password') : t('Change password')}
          </button>
        </li>
        {passkeySupported && (
          <li>
            <button onClick={addKey} disabled={adding} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist">
              {adding ? <Spinner className="h-5 w-5" /> : <Icon name="user" className="h-5 w-5" />}
              {t('Add a passkey')}
            </button>
          </li>
        )}
        <li>
          <button onClick={() => setSheet('logout')} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist">
            {t('Log out')}
          </button>
        </li>
        <li>
          <button onClick={() => setSheet('delete')} className="row min-h-[50px] text-[17px] text-bad active:bg-mist">
            {t('Delete account')}
          </button>
        </li>
      </ul>
      {sheet === 'logout' && <LogOutSheet onClose={close} />}
      {sheet === 'email' && <EmailSheet onClose={close} />}
      {(sheet === 'password' || sheet === 'delete') && <PasswordSheet mode={sheet} onClose={close} />}
    </>
  )
}

// The page a reset email links to (#/reset/<token>): choose a new password, then you're logged in
export function ResetPage({ token, onDone }) {
  const { t } = useT()
  const { resetPassword } = useAccount()
  const { actions } = useStore()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError(t(ERRORS.short_password))
    setBusy(true)
    try {
      await resetPassword(token, password)
      actions.toast({ text: 'New password saved. You’re logged in.' })
      onDone()
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }
  return (
    <main className="min-h-[100dvh] bg-page">
      <form onSubmit={submit} className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10">
        <h1 className="large-title">{t('Choose a new password')}</h1>
        <div className="mt-6">
          <Field label={t('New password')} type="password" data-autofocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder={t('At least 8 characters')} maxLength={200} required />
        </div>
        <Problem>{error}</Problem>
        <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
          {busy ? <Spinner className="h-5 w-5" /> : t('Save and log in')}
        </button>
      </form>
    </main>
  )
}
