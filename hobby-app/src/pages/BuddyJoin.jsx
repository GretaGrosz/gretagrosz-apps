// Opening a buddy invite link (#/b/<code>): who invited you, and one button to accept
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { getInvite, inviteLink, joinInvite, validCode } from '../buddy'
import Mascot from '../assistant/Mascot'
import { Icon, Logo, Spinner } from '../components/ui'

export default function BuddyJoin() {
  const { code } = useParams()
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [invite, setInvite] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | joining | error
  const [error, setError] = useState(null)
  const [name, setName] = useState(data.me.name || '')
  const [attempt, setAttempt] = useState(0)

  // Your own link, still waiting for someone; once it's taken, it's your buddy's link too
  const own = data.buddy?.code === code && !data.buddy?.cache?.buddy
  const hasOther = data.buddy && !own

  useEffect(() => {
    if (!validCode(code)) {
      setError('not_found')
      setState('error')
      return
    }
    if (own || hasOther) return
    let alive = true
    setState('loading')
    getInvite(code)
      .then((res) => {
        if (!alive) return
        setInvite(res)
        setState(res.open ? 'ready' : 'error')
        if (!res.open) setError('taken')
      })
      .catch((e) => {
        if (!alive) return
        setError(e.code)
        setState('error')
      })
    return () => {
      alive = false
    }
  }, [code, own, hasOther, attempt])

  const join = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setState('joining')
    try {
      const { key } = await joinInvite(code, name.trim(), lang)
      if (!data.me.name) actions.setMe({ name: name.trim() })
      actions.setBuddy({ code, key, side: 'b', cache: null, outbox: [], error: null })
      actions.toast({ text: '{name} is your buddy now', vars: { name: invite.name } })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.code)
      setState(err.code === 'offline' || err.code === 'server' ? 'ready' : 'error')
    }
  }

  const leave = () => navigate('/', { replace: true })
  const [copied, setCopied] = useState(false)
  // Your own link opened by mistake: hand it straight to the share sheet instead of a dead end
  const shareOwn = async () => {
    const url = inviteLink(code)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Blank', text: t('Be my buddy on Blank?'), url })
        return
      } catch (e) {
        if (e?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {}
    setCopied(true)
  }
  const seeBuddy = () => navigate('/', { replace: true, state: { openBuddy: true } })
  const message = own
    ? t('This is your own invite. Send the link to a friend.')
    : hasOther
      ? t('You already have a buddy. Stop being buddies first, then open this link again.')
      : error === 'taken'
        ? t('This invite was already used or has expired.')
        : error === 'offline'
          ? t('No connection. Try again when you’re online.')
          : error === 'not_found'
            ? t('This invite link doesn’t exist.')
            : t('Something went wrong. Try again.')

  return (
    <main className="min-h-[100dvh] bg-page">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex h-12 items-center">
          <Logo word />
        </div>
        <div className="flex flex-1 flex-col justify-center pb-16">
          {state === 'loading' && !own && !hasOther ? (
            <div className="flex justify-center text-sub">
              <Spinner className="h-7 w-7" />
            </div>
          ) : state === 'ready' || state === 'joining' ? (
            <form onSubmit={join} className="animate-rise">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
                <Icon name="buddy" className="h-7 w-7" />
              </span>
              <h1 className="large-title mt-5">{t('{name} wants you as their buddy', { name: invite.name })}</h1>
              <label htmlFor="join-name" className="mb-1.5 mt-8 block text-[15px] font-medium text-sub">
                {t('Your name for your buddy')}
              </label>
              <input
                id="join-name"
                className="input text-[17px]"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
              {error && (
                <p className="mt-2 text-[15px] text-bad" role="alert">
                  {message}
                </p>
              )}
              <button className="btn-primary btn-lg mt-5 w-full" disabled={!name.trim() || state === 'joining'}>
                {state === 'joining' ? <Spinner /> : null} {t('Be buddies')}
              </button>
              <button type="button" onClick={leave} className="mt-2 h-12 w-full text-[17px] text-spark-ink active:opacity-60">
                {t('Not now')}
              </button>
            </form>
          ) : own || hasOther ? (
            <div className="animate-rise flex flex-col items-center text-center">
              <Mascot size={132} mood="happy" />
              <h1 className="large-title mt-5">{own ? t('Your invite link') : t('You already have a buddy')}</h1>
              {own && (
                <button onClick={shareOwn} className="mt-6 flex h-11 max-w-full items-center gap-2 rounded-full bg-mist px-4 text-[15px] active:opacity-60">
                  <Icon name="link" className="h-4 w-4 shrink-0 text-sub" />
                  <span className="truncate">{inviteLink(code).replace(/^https?:\/\//, '')}</span>
                </button>
              )}
              <div className="mt-6 flex w-full flex-col gap-2">
                {own ? (
                  <button onClick={shareOwn} className="btn-primary btn-lg w-full">
                    <Icon name={copied ? 'check' : 'share'} className="h-5 w-5" /> {copied ? t('Link copied') : t('Share link')}
                  </button>
                ) : (
                  <button onClick={seeBuddy} className="btn-primary btn-lg w-full">
                    <Icon name="buddy" className="h-5 w-5" /> {t('See your buddy')}
                  </button>
                )}
                <button onClick={leave} className="btn-plain btn-lg">
                  {t('Open Blank')}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-rise text-center">
              <p className="text-[20px] font-semibold leading-snug">{message}</p>
              <div className="mt-6 flex flex-col gap-2">
                {error === 'offline' && (
                  <button onClick={() => setAttempt((n) => n + 1)} className="btn-primary btn-lg">
                    {t('Try again')}
                  </button>
                )}
                <button onClick={leave} className="btn-plain btn-lg">
                  {t('Open Blank')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
