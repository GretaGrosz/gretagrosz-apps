// One real buddy, by invite link: you see each other's streak and what you did, and can nudge each other.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { onActivity, useStore } from '../store'
import { useT } from '../i18n'
import { ApiError, createInvite, disablePush, enablePush, endPair, getPair, inviteLink, patchPair, pushStatus, sendCheckin, sendNudge } from '../buddy'
import { Icon, Sheet, SheetHeader, Spinner } from './ui'
import Mascot from '../assistant/Mascot'
import { fx, svgIn } from '../assistant/motion'

const REFRESH = 'blank-buddy-refresh'
export const requestBuddyRefresh = () => window.dispatchEvent(new Event(REFRESH))

// Keeps the buddy link in sync: sends what you do, fetches what your buddy did. Mounted once in the layout.
export function BuddySync() {
  const { data, actions, streak } = useStore()
  const { lang } = useT()
  const ref = useRef(null)
  ref.current = { buddy: data.buddy, streak, lang }
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    const b = ref.current.buddy
    if (!b?.key || busy.current || document.hidden) return
    busy.current = true
    try {
      // Anything that couldn't be sent while offline goes first
      let outbox = b.outbox || []
      while (outbox.length) {
        await sendCheckin(b.key, { ...outbox[0], streak: ref.current.streak })
        outbox = outbox.slice(1)
        actions.patchBuddy({ outbox })
      }
      const res = await getPair(b.key)
      if (res.me.streak !== ref.current.streak) patchPair(b.key, { streak: ref.current.streak, lang: ref.current.lang }).catch(() => {})
      actions.patchBuddy({ cache: res, fetchedAt: Date.now(), error: null })
    } catch (e) {
      if (e.code === 'gone') {
        actions.setBuddy(null)
        actions.toast({ text: 'Your buddy link has ended.' })
      } else {
        actions.patchBuddy({ error: e.code || 'server' })
      }
    } finally {
      busy.current = false
    }
  }, [actions])

  const key = data.buddy?.key
  useEffect(() => {
    if (!key) return
    refresh()
    const onShow = () => !document.hidden && refresh()
    const timer = setInterval(refresh, 60_000)
    window.addEventListener(REFRESH, refresh)
    window.addEventListener('focus', onShow)
    document.addEventListener('visibilitychange', onShow)
    return () => {
      clearInterval(timer)
      window.removeEventListener(REFRESH, refresh)
      window.removeEventListener('focus', onShow)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [key, refresh])

  // Tell your buddy what you just did
  useEffect(
    () =>
      onActivity((evt) => {
        const b = ref.current.buddy
        if (!b?.key || !['step', 'photo', 'entry', 'session', 'finish'].includes(evt.kind)) return
        const body = {
          kind: evt.kind,
          project: (evt.project || '').slice(0, 80),
          detail: evt.step ? evt.step.slice(0, 140) : evt.minutes ? String(evt.minutes) : '',
        }
        // A moment later, so the streak already includes what you just did
        setTimeout(async () => {
          const now = ref.current.buddy
          if (!now?.key) return
          try {
            await sendCheckin(now.key, { ...body, streak: ref.current.streak })
            refresh()
          } catch (e) {
            if (e.code === 'gone') return refresh()
            if (e.code === 'offline' || e.code === 'server') actions.patchBuddy({ outbox: [...(now.outbox || []), body].slice(-20) })
          }
        }, 60)
      }),
    [actions, refresh],
  )
  return null
}

// What a check-in says, from your side or your buddy's
function useCheckinText() {
  const { t } = useT()
  return (c, buddyName) => {
    const vars = { name: buddyName, step: c.detail, project: c.project, n: c.detail }
    const mine = {
      step: 'You ticked “{step}”',
      photo: 'You added a photo to {project}',
      entry: 'You logged progress on {project}',
      session: 'You did {n} min on {project}',
      finish: 'You finished {project}',
      nudge: 'You nudged {name}',
      cheer: 'You cheered {name}',
    }
    const theirs = {
      step: '{name} ticked “{step}”',
      photo: '{name} added a photo to {project}',
      entry: '{name} logged progress on {project}',
      session: '{name} did {n} min on {project}',
      finish: '{name} finished {project}',
      nudge: '{name} nudged you',
      cheer: '{name} cheered you',
    }
    return t((c.mine ? mine : theirs)[c.kind] || '', vars)
  }
}

// One tap: make the buddy link and open the share sheet (Today's card, and "With a friend" in Ideas).
// → true if the link was made; false if your name is missing (the caller opens the invite sheet) or it failed
export function useQuickInvite() {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const share = useShareLink()
  const [busy, setBusy] = useState(false)
  const invite = async () => {
    if (!data.me.name.trim()) return false
    setBusy(true)
    try {
      const { code, key } = await createInvite(data.me.name, lang)
      actions.setBuddy({ code, key, side: 'a', cache: null, outbox: [], error: null })
      share(code)
      return true
    } catch (err) {
      actions.toast({ text: errorText(t, err instanceof ApiError ? err.code : 'server') })
      return false
    } finally {
      setBusy(false)
    }
  }
  return { invite, busy }
}

function useShareLink() {
  const { t } = useT()
  const { actions } = useStore()
  return async (code) => {
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
      actions.toast({ text: 'Link copied' })
    } catch {
      window.prompt(t('Copy this link'), url)
    }
  }
}

const errorText = (t, code) =>
  code === 'offline'
    ? t('No connection. Try again when you’re online.')
    : code === 'too_many'
      ? t('Too many invites today. Try again tomorrow.')
      : code === 'not_found'
        ? t('Buddies aren’t available right now.')
        : t('Something went wrong. Try again.')

function InviteForm({ onDone }) {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const [name, setName] = useState(data.me.name || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const { code, key } = await createInvite(name.trim(), lang)
      if (!data.me.name) actions.setMe({ name: name.trim() })
      actions.setBuddy({ code, key, side: 'a', cache: null, outbox: [], error: null })
      onDone?.(code)
    } catch (err) {
      setError(err instanceof ApiError ? err.code : 'server')
    } finally {
      setBusy(false)
    }
  }
  return (
    <form onSubmit={submit} className="px-5 pb-2 pt-2">
      <label htmlFor="buddy-name" className="mb-1.5 block text-[15px] font-medium text-sub">
        {t('Your name for your buddy')}
      </label>
      <input
        id="buddy-name"
        className="input text-[17px]"
        data-autofocus
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoComplete="given-name"
      />
      {error && (
        <p className="mt-2 text-[15px] text-bad" role="alert">
          {errorText(t, error)}
        </p>
      )}
      <button className="btn-primary btn-lg mt-4 w-full" disabled={!name.trim() || busy}>
        {busy ? <Spinner /> : <Icon name="link" className="h-5 w-5" />} {t('Create invite link')}
      </button>
    </form>
  )
}

function PushRow() {
  const { data } = useStore()
  const { t } = useT()
  const [status, setStatus] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    pushStatus().then(setStatus)
  }, [])
  if (!status || status === 'unsupported') return null
  const toggle = async () => {
    setBusy(true)
    setError(null)
    try {
      if (status === 'on') {
        await disablePush(data.buddy.key)
        setStatus('off')
      } else {
        await enablePush(data.buddy.key)
        setStatus('on')
      }
    } catch (e) {
      setError(e?.code === 'denied' ? 'denied' : e?.code === 'dismissed' ? null : 'failed')
      setStatus(await pushStatus())
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="mx-5 mt-4 rounded-[14px] bg-mist">
      <div className="row min-h-[52px]">
        <Icon name="bell" className="h-5 w-5 text-sub" />
        <span className="flex-1 text-[17px]">{t('Notifications')}</span>
        {status === 'install' || status === 'denied' ? null : (
          <button
            role="switch"
            aria-checked={status === 'on'}
            onClick={toggle}
            disabled={busy}
            className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${status === 'on' ? 'bg-good' : 'bg-ink/15'}`}
            aria-label={t('Notifications')}
          >
            <span
              className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform duration-200 ${status === 'on' ? 'translate-x-[22px]' : 'translate-x-[2px]'}`}
            />
          </button>
        )}
      </div>
      {(status === 'install' || status === 'denied' || error) && (
        <p className="px-4 pb-3 text-[13px] text-sub">
          {status === 'install'
            ? t('On iPhone, add Blank to your Home Screen first (Share → Add to Home Screen).')
            : status === 'denied' || error === 'denied'
              ? t('Notifications are blocked for this site in your settings.')
              : t('Notifications couldn’t be turned on.')}
        </p>
      )}
    </div>
  )
}

function BuddySheet({ onClose }) {
  const { data, actions, streak } = useStore()
  const { t, tn, fmt } = useT()
  const share = useShareLink()
  const text = useCheckinText()
  const [nudging, setNudging] = useState(false)
  const [copied, setCopied] = useState(false)
  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(inviteLink(code))
    } catch {
      window.prompt(t('Copy this link'), inviteLink(code))
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  const b = data.buddy
  const cache = b?.cache
  const buddy = cache?.buddy

  const nudge = async () => {
    setNudging(true)
    try {
      await sendNudge(b.key)
      actions.toast({ text: 'Nudged {name}', vars: { name: buddy.name } })
      requestBuddyRefresh()
    } catch (e) {
      actions.toast({ text: e.code === 'too_soon' ? 'You can nudge again in an hour.' : errorText(t, e.code) })
    } finally {
      setNudging(false)
    }
  }
  const [confirming, setConfirming] = useState(false)
  const [ending, setEnding] = useState(false)
  const end = async () => {
    setEnding(true)
    try {
      await endPair(b.key)
    } catch (e) {
      if (e.code !== 'gone') {
        actions.toast({ text: errorText(t, e.code) })
        setEnding(false)
        return
      }
    }
    disablePush(b.key).catch(() => {})
    setEnding(false)
    actions.setBuddy(null)
    onClose()
  }

  if (!b) return null
  return (
    <Sheet onClose={onClose} label={t('Buddy')}>
      <SheetHeader title={buddy ? buddy.name : t('Invite sent')} onClose={onClose} />
      {buddy ? (
        <>
          <div className="mx-5 mt-2 grid grid-cols-2 gap-3">
            {[
              [buddy.name, buddy.streak, {}],
              [t('You'), streak, undefined],
            ].map(([who, n, outfit]) => (
              <div key={who} className="flex flex-col items-center rounded-[14px] bg-mist px-3 pb-3 pt-4">
                <Mascot size={76} streak={n} mood={n > 0 ? 'happy' : 'idle'} outfit={outfit} />
                <p className="mt-2 max-w-full truncate text-[15px] font-semibold">{who}</p>
                <p className="text-[13px] tabular-nums text-sub">{tn(n, '{n} week', '{n} weeks')}</p>
              </div>
            ))}
          </div>
          <div className="px-5 pt-3">
            <button onClick={nudge} disabled={nudging || !cache.canNudge} className="btn-tinted btn-lg w-full">
              {nudging ? <Spinner /> : <Icon name="bell" className="h-5 w-5" />} {cache.canNudge ? t('Nudge {name}', { name: buddy.name }) : t('Nudged')}
            </button>
          </div>
          <PushRow />
          <h3 className="section-label mt-6 px-5">{t('Recent')}</h3>
          {cache.checkins.length ? (
            <ul className="mx-5 divide-y divide-line/15 overflow-hidden rounded-[14px] bg-mist">
              {cache.checkins.slice(0, 25).map((c) => (
                <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.mine ? 'bg-ink/25' : 'bg-spark'}`} />
                  <span className="min-w-0 flex-1 text-[15px] leading-snug">{text(c, buddy.name)}</span>
                  <span className="shrink-0 text-[13px] text-sub">{fmt.ago(c.created)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 text-[15px] text-sub">{t('Nothing yet.')}</p>
          )}
        </>
      ) : (
        <div className="px-5 pt-2">
          <div className="flex flex-col items-center pb-2 pt-1 text-center">
              <Mascot size={96} mood="happy" />
              <p className="mt-3 text-[20px] font-semibold">{t('Waiting for your buddy')}</p>
              <button onClick={() => copy(b.code)} className="mt-3 flex h-11 max-w-full items-center gap-2 rounded-full bg-mist px-4 text-[15px] active:opacity-60">
                <Icon name="link" className="h-4 w-4 shrink-0 text-sub" />
                <span className="truncate">{inviteLink(b.code).replace(/^https?:\/\//, '')}</span>
                <span className="shrink-0 font-semibold text-spark-ink">{copied ? t('Copied') : t('Copy')}</span>
              </button>
            </div>
          <button onClick={() => share(b.code)} className="btn-primary btn-lg mt-3 w-full">
            <Icon name="share" className="h-5 w-5" /> {t('Share link')}
          </button>
          <PushRow />
        </div>
      )}
      <div className="px-5 pt-4">
        {confirming ? (
          <div className="animate-rise rounded-[14px] bg-mist p-4 text-center">
            <p className="text-[15px] font-semibold leading-snug">
              {buddy ? t('Stop being buddies with {name}? You both lose the shared history.', { name: buddy.name }) : t('Cancel this invite?')}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirming(false)} disabled={ending} className="btn min-h-[44px] bg-card text-ink">
                {t('Keep')}
              </button>
              <button onClick={end} disabled={ending} className="btn min-h-[44px] bg-bad text-white">
                {ending ? <Spinner /> : buddy ? t('Stop') : t('Cancel invite')}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} className="btn min-h-[44px] w-full text-bad">
            {buddy ? t('Stop being buddies') : t('Cancel invite')}
          </button>
        )}
      </div>
    </Sheet>
  )
}

export default function BuddyCard() {
  const { data, actions, streak } = useStore()
  const { t, tn, fmt, lang } = useT()
  const [creating, setCreating] = useState(false)
  const [quickSent, setQuickSent] = useState(null)
  const [quickBusy, setQuickBusy] = useState(false)
  const axo = useRef(null)
  const text = useCheckinText()
  const share = useShareLink()
  const location = useLocation()
  const [sheet, setSheet] = useState(location.state?.openBuddy && data.buddy ? 'buddy' : location.state?.openInvite && !data.buddy ? 'invite' : null) // 'invite' | 'buddy'
  const b = data.buddy
  const buddy = b?.cache?.buddy
  const latest = b?.cache?.checkins?.find((c) => !c.mine)

  let body
  // You already told Blank your name: one tap makes the link and opens the share sheet
  const quickInvite = async () => {
    if (!data.me.name.trim()) return setSheet('invite')
    setCreating(true)
    try {
      const { code, key } = await createInvite(data.me.name, lang)
      actions.setBuddy({ code, key, side: 'a', cache: null, outbox: [], error: null })
      setSheet('buddy')
      share(code)
    } catch (err) {
      actions.toast({ text: errorText(t, err instanceof ApiError ? err.code : 'server') })
    } finally {
      setCreating(false)
    }
  }

  if (!b) {
    body = (
      <button onClick={quickInvite} disabled={creating} className="row min-h-[64px] active:bg-mist">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
          <Icon name="buddy" className="h-5 w-5" />
        </span>
        <span className="flex-1 text-[17px] font-medium">{t('Do it with a friend')}</span>
        <span className="text-[17px] text-spark-ink">{creating ? <Spinner /> : t('Invite')}</span>
      </button>
    )
  } else if (!buddy) {
    body = (
      <div className="row min-h-[64px]">
        <button onClick={() => setSheet('buddy')} className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left active:opacity-60">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-sub">
            <Icon name="buddy" className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[17px] font-medium">{t('Waiting for your buddy')}</span>
            <span className="block text-[13px] text-sub">{b.error === 'offline' ? t('Offline') : t('Invite link created')}</span>
          </span>
        </button>
        <button onClick={() => share(b.code)} className="btn-tinted min-h-[36px] px-4 text-[15px]">
          {t('Share')}
        </button>
      </div>
    )
  } else {
    const nudged = latest?.kind === 'nudge' && Date.now() - latest.created < 12 * 3600_000
    const midnight = new Date().setHours(0, 0, 0, 0)
    const theirsToday = b.cache.checkins.filter((c) => !c.mine && !['nudge', 'cheer'].includes(c.kind) && c.created >= midnight)
    // One tap right on the card: cheer what they did today, or nudge them if they haven't started
    const quick = theirsToday.length ? 'cheer' : 'nudge'
    // What a tap answers: their latest check-in today, or today itself for a nudge
    const quickId = `${quick}:${theirsToday[0]?.id || midnight}`
    const sent =
      quick === 'cheer'
        ? b.cache.checkins.some((c) => c.mine && c.kind === 'cheer' && c.created >= theirsToday[0].created) || quickSent === quickId
        : !b.cache.canNudge || quickSent === quickId
    const quickTap = async (e) => {
      e.stopPropagation()
      if (sent || quickBusy) return
      setQuickBusy(true)
      try {
        if (quick === 'nudge') await sendNudge(b.key)
        else await sendCheckin(b.key, { kind: 'cheer', project: '', detail: '', streak })
        setQuickSent(quickId)
        fx.hop(svgIn(axo.current))
        actions.toast({ text: quick === 'nudge' ? 'Nudged {name}' : 'Cheered {name}', vars: { name: buddy.name } })
        requestBuddyRefresh()
      } catch (err) {
        if (err.code === 'too_soon') setQuickSent(quickId)
        actions.toast({ text: err.code === 'too_soon' ? 'You can nudge again in an hour.' : errorText(t, err.code) })
      } finally {
        setQuickBusy(false)
      }
    }
    const action = (
      <button
        onClick={quickTap}
        disabled={quickBusy}
        aria-pressed={sent}
        className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[15px] font-semibold transition active:scale-95 ${sent ? 'bg-spark text-white' : 'bg-spark-soft text-spark-ink'}`}
      >
        {quickBusy ? <Spinner className="h-4 w-4" /> : <Icon name={sent ? 'check' : quick === 'nudge' ? 'bell' : 'heart'} className="h-4 w-4" strokeWidth={2.4} />}
        {sent ? (quick === 'nudge' ? t('Nudged') : t('Cheered')) : quick === 'nudge' ? t('Nudge') : t('Cheer')}
      </button>
    )
    body = (
      <div className="row min-h-[68px] py-3">
      <button onClick={() => setSheet('buddy')} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-60">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[17px] font-bold ${nudged ? 'bg-spark text-white' : 'bg-spark-soft text-spark-ink'}`}
        >
          {buddy.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[17px] font-semibold">{buddy.name}</span>
            <span className="flex shrink-0 items-center gap-0.5 text-[15px] font-semibold tabular-nums text-spark-ink" aria-label={tn(buddy.streak, '{n} week', '{n} weeks')}>
              <Mascot ref={axo} size={26} peek outfit={{}} /> {buddy.streak}
            </span>
          </span>
          <span className={`block truncate text-[13px] ${nudged ? 'font-semibold text-spark-ink' : 'text-sub'}`}>
            {latest ? `${text(latest, buddy.name)} · ${fmt.ago(latest.created)}` : b.error === 'offline' ? t('Offline') : t('No check-ins yet')}
          </span>
        </span>
        {!action && <Icon name="chevron" className="h-4 w-4 shrink-0 text-ink/30" strokeWidth={2.6} />}
      </button>
      {action}
      </div>
    )
  }

  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Buddy')}</h2>
      <div className="surface overflow-hidden">{body}</div>
      {sheet === 'invite' && (
        <Sheet onClose={() => setSheet(null)} label={t('Invite a buddy')}>
          <SheetHeader title={t('Invite a buddy')} onClose={() => setSheet(null)} />
          <InviteForm onDone={() => setSheet('buddy')} />
        </Sheet>
      )}
      {sheet === 'buddy' && <BuddySheet onClose={() => setSheet(null)} />}
    </section>
  )
}
