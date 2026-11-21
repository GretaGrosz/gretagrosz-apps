// Who can write to you (worker/blank-social.js, /social/me and /social/requests). Many people on Blank are teenagers:
// - by default only friends can write (and the people you do a plan with, who are always friends)
// - "Message requests": others may send ONE text message, which waits in a separate Requests folder until you accept,
//   decline or block. Only for people 16 or older: the birth year is asked once, and the server checks it.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api } from '../social'
import { Segmented, Sheet, SheetHeader, Spinner } from './ui'
import { ERRORS } from './Social'

const SAFETY_ERRORS = {
  too_young: 'Message requests are only for people 16 and older.',
  need_year: 'Pick the year you were born.',
  requests_off: 'They only get messages from friends. Send a friend request instead.',
  exists: 'You already have a chat with them.',
  request_pending: 'Wait until they accept your message request.',
}

// On the You page: the setting
export function MessageSetting() {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [me, setMe] = useState(null)
  const [asking, setAsking] = useState(false)
  const [year, setYear] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!account) return
    api(account.token)
      .me()
      .then(setMe)
      .catch(() => {})
  }, [account])
  if (!account || !me) return null
  const save = async (on, birthYear) => {
    setBusy(true)
    try {
      const r = await api(account.token).saveMe({ requests: on, ...(birthYear && { birthYear }) })
      setMe((m) => ({ ...m, requests: r.requests, birthYear: r.birthYear }))
      setAsking(false)
    } catch (e) {
      if (e.code === 'need_year') setAsking(true)
      else actions.toast({ text: SAFETY_ERRORS[e.code] || ERRORS[e.code] || 'Something went wrong. Try again.', long: true })
    } finally {
      setBusy(false)
    }
  }
  const now = new Date().getFullYear()
  return (
    <>
      <h2 className="section-label mt-8">{t('Messages')}</h2>
      <div className="surface p-4">
        <p className="text-[17px]">{t('Who can message me')}</p>
        <div className="mt-2">
          <Segmented
            value={me.requests ? 'requests' : 'friends'}
            onChange={(v) => !busy && save(v === 'requests')}
            label={t('Who can message me')}
            options={[
              ['friends', t('Friends')],
              ['requests', t('Friends + requests')],
            ]}
          />
        </div>
        <p className="mt-2 text-[13px] leading-snug text-sub">
          {me.requests
            ? t('Others can send you one message. It waits under Requests until you accept, decline or block them.')
            : t('Only your friends (and the friends you do a plan with) can write to you.')}
        </p>
      </div>
      {asking && (
        <Sheet onClose={() => setAsking(false)} label={t('Message requests')}>
          <SheetHeader title={t('Message requests')} onClose={() => setAsking(false)} />
          <form
            className="px-5 pb-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (year) save(true, Number(year))
            }}
          >
            <p className="px-1 text-[15px] leading-snug text-sub">{t('Message requests are only for people 16 and older. What year were you born?')}</p>
            <select className="input mt-3" value={year} onChange={(e) => setYear(e.target.value)} aria-label={t('Year you were born')} required>
              <option value="">{t('Year you were born')}</option>
              {Array.from({ length: 80 }, (_, i) => now - 5 - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button className="btn-primary btn-lg mt-4 w-full" disabled={!year || busy}>
              {busy ? <Spinner className="h-5 w-5" /> : t('Turn on')}
            </button>
          </form>
        </Sheet>
      )}
    </>
  )
}

// On someone's profile (not your friend, requests on): write them one message
export function RequestSheet({ user, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const send = async (e) => {
    e.preventDefault()
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const r = await api(account.token).sendRequest(user.username, text.trim())
      actions.toast({ text: t('Sent. They decide if you can keep writing.') })
      navigate(`/chats/${r.id}`)
    } catch (err) {
      actions.toast({ text: SAFETY_ERRORS[err.code] || ERRORS[err.code] || 'Something went wrong. Try again.', long: true })
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Message request')}>
      <SheetHeader title={t('Message request')} onClose={onClose} />
      <form onSubmit={send} className="px-5 pb-4">
        <p className="px-1 text-[15px] leading-snug text-sub">
          {t('You’re not friends yet, so you can send @{name} one message. Be kind, and say why you’re writing.', { name: user.username })}
        </p>
        <textarea className="input mt-3 min-h-[100px] resize-none" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} aria-label={t('Message')} placeholder={t('Hi! I saw your project and…')} />
        <button className="btn-primary btn-lg mt-3 w-full" disabled={!text.trim() || busy}>
          {busy ? <Spinner className="h-5 w-5" /> : t('Send request')}
        </button>
      </form>
    </Sheet>
  )
}

// In a chat that is still a request: accept, decline or block (you got it), or wait (you sent it)
export function RequestBanner({ chat, onDone }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const other = chat.members[0] || {}
  if (chat.request === 'sent')
    return <p className="surface mt-3 px-4 py-3 text-center text-[15px] text-sub">{t('Message request sent. You can write more once @{name} accepts.', { name: other.username })}</p>
  const run = async (fn, after) => {
    setBusy(true)
    try {
      await fn()
      after()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
      setBusy(false)
    }
  }
  const a = api(account.token)
  return (
    <div className="surface mt-3 p-4">
      <p className="text-[15px] leading-snug">
        <b>{other.name || `@${other.username}`}</b> {t('isn’t your friend and wants to message you. They can’t see if you’ve read this until you accept.')}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button disabled={busy} onClick={() => run(() => a.acceptRequest(chat.id), onDone)} className="btn-primary min-h-[38px] text-[15px]">
          {t('Accept')}
        </button>
        <button disabled={busy} onClick={() => run(() => a.declineRequest(chat.id), () => navigate('/friends', { replace: true }))} className="btn-plain min-h-[38px] text-[15px]">
          {t('Decline')}
        </button>
        <button
          disabled={busy}
          onClick={() =>
            window.confirm(t('Block @{name}? You won’t see each other anymore.', { name: other.username })) &&
            run(async () => (await a.declineRequest(chat.id), await a.block(other.username)), () => navigate('/friends', { replace: true }))
          }
          className="btn-plain min-h-[38px] text-[15px] text-bad"
        >
          {t('Block')}
        </button>
      </div>
    </div>
  )
}

