// "Send feedback" on the You page: a few lines straight to Greta's inbox (worker/blank.js /feedback), with the
// username attached when logged in, so she can write back if there's an email on the account
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { call } from '../buddy'
import { Icon, Sheet, SheetHeader, Spinner } from './ui'

const ERRORS = {
  too_many: 'That’s a lot of feedback for today. Thank you! Try again tomorrow.',
  offline: 'You’re offline. Connect to the internet and try again.',
}

function FeedbackSheet({ onClose }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const { pathname } = useLocation()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const send = async (e) => {
    e.preventDefault()
    if (busy || text.trim().length < 3) return
    setBusy(true)
    setError(null)
    try {
      await call('/feedback', { method: 'POST', key: account?.token, body: { text, lang, page: pathname } })
      actions.toast({ text: 'Thank you! Greta reads every message.' })
      onClose()
    } catch (err) {
      setError(t(ERRORS[err.code] || 'Something went wrong. Try again.'))
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Send feedback')}>
      <SheetHeader title={t('Send feedback')} onClose={onClose} />
      <form onSubmit={send} className="px-5 pb-2 pt-1">
        <p className="px-1 pb-3 text-[15px] leading-snug text-sub">{t('What’s confusing, what’s missing, what do you love? Every message goes straight to Greta, who makes Blank.')}</p>
        <textarea
          className="input min-h-[140px] resize-none text-[17px]"
          data-autofocus
          maxLength={3000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('e.g. I didn’t get what the streak is for')}
          aria-label={t('Your feedback')}
        />
        <p className="mt-2 px-1 text-[13px] text-sub">{t('Want an answer? Add an email to your account, or write it in your message.')}</p>
        {error && (
          <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy || text.trim().length < 3} className="btn-primary btn-lg mt-5 w-full">
          {busy ? <Spinner className="h-5 w-5" /> : t('Send')}
        </button>
      </form>
    </Sheet>
  )
}

// The row on the You page that opens it
export function FeedbackRow() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="surface row mt-8 min-h-[60px] w-full text-left active:bg-mist">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
          <Icon name="heart" className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-semibold">{t('Send feedback')}</span>
          <span className="block text-[13px] text-sub">{t('Tell Greta what to make better')}</span>
        </span>
        <Icon name="chevron" className="h-4 w-4 text-sub" />
      </button>
      {open && <FeedbackSheet onClose={() => setOpen(false)} />}
    </>
  )
}
