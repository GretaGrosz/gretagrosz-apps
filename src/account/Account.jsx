// Konto in der App: Provider (Abgleich starten, Zustand für alle Seiten), das Konto-Blatt und der Abschnitt in den
// Einstellungen. Die eigentliche Arbeit macht sync.js; ohne Konto passiert hier nichts.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Sheet from '../components/Sheet.jsx'
import Button from '../components/Button.jsx'
import { IconTile, ListGroup, ListRow } from '../components/List.jsx'
import * as sync from './sync.js'
import { syncedText, useAccountText } from './strings.js'

const Ctx = createContext({ account: null, status: 'off', open: () => {} })
export const useAccount = () => useContext(Ctx)

export function AccountProvider({ children }) {
  const state = useSyncExternalStore(sync.subscribe, sync.getSnapshot)
  const [view, setView] = useState(null) // null = zu; sonst die Ansicht im Blatt
  const [note, setNote] = useState(null)

  useEffect(() => {
    sync.start({ onLoggedOut: () => setNote('loggedOutNote') })
  }, [])

  const open = useCallback((mode) => setView(mode || (sync.readAccount() ? 'manage' : 'signup')), [])
  const value = useMemo(() => ({ ...state, open }), [state, open])

  return (
    <Ctx.Provider value={value}>
      {children}
      <AccountSheet view={view} setView={setView} state={state} note={note} clearNote={() => setNote(null)} />
    </Ctx.Provider>
  )
}

// ---------- kleine Bausteine ----------
const CloudIcon = ({ className = 'h-[18px] w-[18px]' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.1 4.75 4.75 0 0 0 7 18.5z" />
    <path d="m9.5 13.5 2.5-2.5 2.5 2.5M12 11v5" />
  </svg>
)
const KeyIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H20m-3 0v3m-3-3v2" />
  </svg>
)

function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function statusLine(t, state, now) {
  switch (state.status) {
    case 'syncing':
      return t('syncing')
    case 'offline':
      return t('offline')
    case 'error':
      return t('syncError')
    case 'limit':
      return t('limit')
    case 'full':
      return t('full')
    default:
      return syncedText(t, state.account?.syncedAt, now)
  }
}

const errorText = (t, e, { loggedIn = false } = {}) => {
  if (!e || e.name === 'NotAllowedError' || e.name === 'AbortError') return null // Passkey-Fenster abgebrochen
  if (loggedIn && e.code === 'wrong_password') return t('e_wrong_current')
  const key = `e_${e.code}`
  const text = t(key)
  return text === key ? t('e_generic') : text
}

// Wie Segmented.jsx, aber ohne gleitenden Schlitten: dessen layoutId-Animation hält im Blatt das
// Schließen-Animieren auf (das Blatt bliebe offen)
function ModeSwitch({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="mb-4 flex rounded-[9px] bg-fill/[0.14] p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`flex min-h-[36px] flex-1 items-center justify-center rounded-[7px] px-1 text-[13px] font-semibold transition-colors ${
              on ? 'bg-surface text-label shadow-[0_2px_6px_rgb(0_0_0/0.12)] dark:bg-raised' : 'text-label2'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Fields({ children }) {
  return <div className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-sep/20">{children}</div>
}
function Field({ label, ...props }) {
  return (
    <input
      aria-label={label}
      placeholder={label}
      className="block min-h-[50px] w-full bg-transparent px-4 text-[17px] text-label outline-none placeholder:text-label3"
      {...props}
    />
  )
}
const nameProps = { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false, maxLength: 20, autoComplete: 'username' }

function ErrorText({ children }) {
  return children ? (
    <p role="alert" className="mt-3 px-1 text-[15px] text-danger">
      {children}
    </p>
  ) : null
}
function BackLink({ onClick, t }) {
  return (
    <button type="button" onClick={onClick} className="mb-2 min-h-[44px] text-[17px] text-accent-text active:opacity-50">
      ‹ {t('back')}
    </button>
  )
}
function Busy({ busy, children }) {
  return busy ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : children
}

// ---------- das Blatt ----------
function AccountSheet({ view, setView, state, note, clearNote }) {
  const t = useAccountText()
  const close = useCallback(() => {
    setView(null)
    clearNote()
  }, [setView, clearNote])
  const [code, setCode] = useState(null) // gerade gezeigter Wiederherstellungscode
  const [message, setMessage] = useState(null)

  // Konto weg (abgemeldet, gelöscht) → zurück zum Anmelden
  const loggedIn = Boolean(state.account)
  const shown = !loggedIn && ['manage', 'password', 'newcode', 'logout'].includes(view) ? 'signup' : view

  const showCode = (c, then = 'manage') => {
    setCode({ value: c, then })
    setView('code')
  }
  const go = (v, msg = null) => {
    setMessage(msg)
    setView(v)
  }

  return (
    <Sheet open={Boolean(view)} onClose={close} title={t('account')}>
      <div className="px-4 pb-4 pt-2">
        {(shown === 'signup' || shown === 'login') && <AuthForm mode={shown} setMode={(m) => go(m)} t={t} note={note} onSignedUp={(r) => showCode(r.recoveryCode, 'welcome')} onLoggedIn={(r) => go('manage', t('welcomeBack', { u: r.username }))} onForgot={() => go('recover')} />}
        {shown === 'recover' && <RecoverForm t={t} onBack={() => go('login')} onDone={(r) => showCode(r.recoveryCode, 'manage')} />}
        {shown === 'code' && code && <CodeView t={t} code={code.value} onDone={() => go('manage', code.then === 'welcome' ? t('welcome') : null)} />}
        {shown === 'manage' && <Manage t={t} state={state} message={message} go={go} />}
        {shown === 'password' && <PasswordForm t={t} hasPassword={state.account?.hasPassword} onBack={() => go('manage')} onDone={(msg) => go('manage', msg)} />}
        {shown === 'newcode' && <NewCodeForm t={t} hasPassword={state.account?.hasPassword} onBack={() => go('manage')} onDone={(c) => showCode(c, 'manage')} />}
        {shown === 'logout' && <LogOutView t={t} onBack={() => go('manage')} onDone={close} />}
        {shown === 'delete' && <DeleteView t={t} hasPassword={state.account?.hasPassword} onBack={() => go('manage')} onDone={() => go('signup', null)} />}
      </div>
    </Sheet>
  )
}

function AuthForm({ mode, setMode, t, note, onSignedUp, onLoggedIn, onForgot }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const signup = mode === 'signup'

  const run = async (kind, fn) => {
    if (busy) return
    setBusy(kind)
    setError(null)
    try {
      const r = await fn()
      if (r?.recoveryCode) onSignedUp(r)
      else onLoggedIn(r)
    } catch (e) {
      setError(errorText(t, e))
    } finally {
      setBusy(null)
    }
  }
  const submit = (e) => {
    e.preventDefault()
    if (signup) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,18}[a-zA-Z0-9]$/.test(username.trim())) return setError(t('e_bad_username'))
      if (password.length < 8) return setError(t('e_short_password'))
      return run('form', () => sync.signUp(username.trim(), password))
    }
    run('form', () => sync.logIn(username.trim(), password))
  }
  const passkey = () => {
    if (signup) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{1,18}[a-zA-Z0-9]$/.test(username.trim())) return setError(t('e_bad_username'))
      return run('passkey', () => sync.passkeySignUp(username.trim()))
    }
    run('passkey', () => sync.passkeyLogIn())
  }

  return (
    <form onSubmit={submit} noValidate>
      {note && <p className="mb-3 rounded-[12px] bg-accent/10 px-4 py-3 text-[15px] text-label">{t(note)}</p>}
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-accent text-white">
          <CloudIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-[20px] font-bold leading-tight text-label">{t('saveTitle')}</p>
          <p className="mt-1 text-[15px] leading-snug text-label2">{t('introText')}</p>
        </div>
      </div>
      <ModeSwitch
        label={t('account')}
        value={mode}
        onChange={(m) => {
          setError(null)
          setMode(m)
        }}
        options={[
          { value: 'signup', label: t('tabNew') },
          { value: 'login', label: t('tabLogin') },
        ]}
      />
      <Fields>
        <Field label={t('username')} value={username} onChange={(e) => setUsername(e.target.value)} {...nameProps} autoComplete={signup ? 'username' : 'username webauthn'} />
        <Field label={signup ? t('passwordNew') : t('password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} />
      </Fields>
      {signup && <p className="mt-1.5 px-4 text-[13px] text-label2">{t('usernameHint')}</p>}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="mt-4 w-full" disabled={Boolean(busy)}>
        <Busy busy={busy === 'form'}>{signup ? t('createAccount') : t('logIn')}</Busy>
      </Button>
      {sync.passkeySupported && (
        <>
          <Button variant="secondary" className="mt-2.5 w-full" onClick={passkey} disabled={Boolean(busy)}>
            <KeyIcon />
            {signup ? t('passkeyCreate') : t('passkeyLogin')}
          </Button>
          <p className="mt-1.5 text-center text-[13px] text-label2">{t('passkeyHint')}</p>
        </>
      )}
      {!signup && (
        <button type="button" onClick={onForgot} className="mx-auto mt-3 block min-h-[44px] text-[15px] text-accent-text active:opacity-50">
          {t('forgot')}
        </button>
      )}
    </form>
  )
}

function RecoverForm({ t, onBack, onDone }) {
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError(t('e_short_password'))
    setBusy(true)
    setError(null)
    try {
      onDone(await sync.recover(username.trim(), code, password))
    } catch (err) {
      setError(errorText(t, err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} noValidate>
      <BackLink t={t} onClick={onBack} />
      <p className="text-[20px] font-bold text-label">{t('recoverTitle')}</p>
      <p className="mb-4 mt-1 text-[15px] text-label2">{t('recoverText')}</p>
      <Fields>
        <Field label={t('username')} value={username} onChange={(e) => setUsername(e.target.value)} {...nameProps} />
        <Field label={t('recoveryCode')} value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck={false} autoComplete="off" maxLength={40} className="block min-h-[50px] w-full bg-transparent px-4 font-mono text-[17px] uppercase tracking-wider text-label outline-none placeholder:font-body placeholder:normal-case placeholder:tracking-normal placeholder:text-label3" />
        <Field label={t('newPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </Fields>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="mt-4 w-full" disabled={busy}>
        <Busy busy={busy}>{t('setNewPassword')}</Busy>
      </Button>
    </form>
  )
}

function CodeView({ t, code, onDone }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      // Kein Zugriff auf die Zwischenablage: Text markieren, damit man ihn selbst kopieren kann
      const el = document.getElementById('acc-code')
      if (el) window.getSelection()?.selectAllChildren(el)
    }
  }
  return (
    <div>
      <p className="text-[20px] font-bold text-label">{t('codeTitle')}</p>
      <p className="mt-1 text-[15px] leading-snug text-label2">{t('codeText')}</p>
      <div className="mt-4 rounded-card bg-surface px-4 py-5 text-center">
        <p id="acc-code" className="select-all font-mono text-[24px] font-semibold tracking-[0.08em] text-label [overflow-wrap:anywhere]">
          {code}
        </p>
        <button type="button" onClick={copy} className="mt-3 min-h-[40px] rounded-full bg-fill/[0.14] px-4 text-[15px] font-semibold text-accent-text active:opacity-60">
          {copied ? `✓ ${t('copied')}` : t('copy')}
        </button>
      </div>
      <Button className="mt-5 w-full" onClick={onDone}>
        {t('savedIt')}
      </Button>
    </div>
  )
}

function Manage({ t, state, message, go }) {
  const now = useNow()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(message)
  const [error, setError] = useState(null)
  useEffect(() => setMsg(message), [message])
  const a = state.account
  if (!a) return null
  const ok = !['offline', 'error', 'limit', 'full'].includes(state.status)

  const addPasskey = async () => {
    setBusy(true)
    setError(null)
    try {
      await sync.addPasskey()
      setMsg(t('passkeyAdded'))
    } catch (e) {
      setError(errorText(t, e, { loggedIn: true }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {msg && <p className="mb-4 rounded-[12px] bg-success/10 px-4 py-3 text-[15px] text-label">{msg}</p>}
      <div className="mb-5 flex items-center gap-3 px-1">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-[20px] font-bold uppercase text-white">{a.username[0]}</span>
        <div className="min-w-0">
          <p className="truncate text-[20px] font-bold text-label">{a.username}</p>
          <p className="flex items-center gap-1.5 text-[15px] text-label2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-success-soft' : 'bg-label3'}`} aria-hidden="true" />
            {statusLine(t, state, now)}
          </p>
        </div>
      </div>
      <ListGroup className="!mb-5">
        <ListRow title={t('syncNow')} chevron={false} onClick={() => sync.syncNow()} />
        {sync.passkeySupported && <ListRow title={t('addPasskey')} chevron={false} disabled={busy} onClick={addPasskey} />}
        <ListRow title={a.hasPassword ? t('changePassword') : t('setPassword')} onClick={() => go('password')} />
        <ListRow title={t('newCode')} onClick={() => go('newcode')} />
      </ListGroup>
      <ErrorText>{error}</ErrorText>
      <ListGroup className="!mb-0">
        <ListRow title={t('logOut')} tone="accent" onClick={() => go('logout')} />
        <ListRow title={t('deleteAccount')} tone="danger" onClick={() => go('delete')} />
      </ListGroup>
    </div>
  )
}

// Ein Formular mit Passwortfeldern und einer Aktion (Passwort ändern, neuer Code, Konto löschen)
function usePasswordAction(t, action) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const run = async (...args) => {
    setBusy(true)
    setError(null)
    try {
      return await action(...args)
    } catch (e) {
      setError(errorText(t, e, { loggedIn: true }))
      return null
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

function PasswordForm({ t, hasPassword, onBack, onDone }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const { busy, error, setError, run } = usePasswordAction(t, () => sync.changePassword(current, next))
  const submit = async (e) => {
    e.preventDefault()
    if (next.length < 8) return setError(t('e_short_password'))
    if (await run()) onDone(hasPassword ? t('passwordChanged') : t('passwordSet'))
  }
  return (
    <form onSubmit={submit} noValidate>
      <BackLink t={t} onClick={onBack} />
      <p className="mb-4 text-[20px] font-bold text-label">{hasPassword ? t('changePassword') : t('setPassword')}</p>
      <Fields>
        {hasPassword && <Field label={t('currentPassword')} type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />}
        <Field label={t('newPassword')} type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      </Fields>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="mt-4 w-full" disabled={busy}>
        <Busy busy={busy}>{t('save')}</Busy>
      </Button>
    </form>
  )
}

function NewCodeForm({ t, hasPassword, onBack, onDone }) {
  const [password, setPassword] = useState('')
  const { busy, error, run } = usePasswordAction(t, () => sync.newRecoveryCode(password))
  const submit = async (e) => {
    e.preventDefault()
    const r = await run()
    if (r?.recoveryCode) onDone(r.recoveryCode)
  }
  return (
    <form onSubmit={submit} noValidate>
      <BackLink t={t} onClick={onBack} />
      <p className="text-[20px] font-bold text-label">{t('newCode')}</p>
      <p className="mb-4 mt-1 text-[15px] text-label2">{t('newCodeText')}</p>
      {hasPassword && (
        <Fields>
          <Field label={t('currentPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Fields>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" className="mt-4 w-full" disabled={busy}>
        <Busy busy={busy}>{t('getCode')}</Busy>
      </Button>
    </form>
  )
}

function LogOutView({ t, onBack, onDone }) {
  // Erst das Blatt schließen, dann abmelden (sonst springt es beim Schließen noch kurz aufs Anmelden um)
  const out = (forget) => {
    onDone()
    sync.logOut({ forget }).catch(() => {})
  }
  return (
    <div>
      <BackLink t={t} onClick={onBack} />
      <p className="text-[20px] font-bold text-label">{t('logOut')}</p>
      <p className="mb-4 mt-1 text-[15px] text-label2">{t('logOutText')}</p>
      <Button className="w-full" onClick={() => out(false)}>
        {t('logOutKeep')}
      </Button>
      <Button variant="danger" className="mt-2.5 w-full !text-[15px]" onClick={() => out(true)}>
        {t('logOutForget')}
      </Button>
      <p className="mt-1.5 text-center text-[13px] text-label2">{t('logOutForgetSub')}</p>
    </div>
  )
}

function DeleteView({ t, hasPassword, onBack, onDone }) {
  const [password, setPassword] = useState('')
  const [deleted, setDeleted] = useState(false)
  const { busy, error, run } = usePasswordAction(t, () => sync.deleteAccount(password).then(() => true))
  const submit = async (e) => {
    e.preventDefault()
    if (await run()) setDeleted(true)
  }
  if (deleted)
    return (
      <div>
        <p className="rounded-[12px] bg-success/10 px-4 py-3 text-[15px] text-label">{t('deleted')}</p>
        <Button className="mt-4 w-full" onClick={onDone}>
          {t('done')}
        </Button>
      </div>
    )
  return (
    <form onSubmit={submit} noValidate>
      <BackLink t={t} onClick={onBack} />
      <p className="text-[20px] font-bold text-label">{t('deleteAccount')}</p>
      <p className="mb-4 mt-1 text-[15px] text-label2">{t('deleteText')}</p>
      {hasPassword && (
        <Fields>
          <Field label={t('currentPassword')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Fields>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="danger" className="mt-4 w-full" disabled={busy || (hasPassword && !password)}>
        {t('deleteForever')}
      </Button>
    </form>
  )
}

// ---------- Einstellungen: Abschnitt "Konto" ----------
export function AccountSettings() {
  const t = useAccountText()
  const state = useAccount()
  const now = useNow()
  const a = state.account
  if (a)
    return (
      <ListGroup header={t('account')}>
        <ListRow
          title={a.username}
          subtitle={statusLine(t, state, now)}
          left={<span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-bold uppercase text-white">{a.username[0]}</span>}
          onClick={() => state.open('manage')}
        />
      </ListGroup>
    )
  return (
    <ListGroup header={t('account')} footer={t('settingsFooter')}>
      <ListRow title={t('saveTitle')} subtitle={t('saveSub')} left={<IconTile><CloudIcon /></IconTile>} onClick={() => state.open('signup')} />
      <ListRow title={t('haveAccount')} tone="accent" chevron={false} onClick={() => state.open('login')} />
    </ListGroup>
  )
}
