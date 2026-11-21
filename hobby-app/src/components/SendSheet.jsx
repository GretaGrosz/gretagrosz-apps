// "Send to a friend": a post or a plan goes into a chat as a card (worker/blank-social.js, kind 'share').
// Your friends and your hobby crews, newest chats first; one tap sends it. share = { type: 'post', id } or
// { type: 'plan', title, category, steps, lang, guide }.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api } from '../social'
import { Sheet, SheetHeader, Spinner } from './ui'
import { Avatar, ERRORS, NeedAccount } from './Social'

export function SendSheet({ share, title, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [people, setPeople] = useState(null) // [{ key, name, sub, user?, chatId?, username? }]
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    if (!account) return
    const a = api(account.token)
    Promise.all([a.chats().catch(() => ({ chats: [] })), a.friends().catch(() => ({ friends: [] }))]).then(([c, f]) => {
      const out = []
      const seen = new Set()
      // Chats you used last come first; then friends you haven't chatted with yet
      for (const ch of c.chats || []) {
        if (ch.kind === 'group') out.push({ key: ch.id, chatId: ch.id, name: ch.name, sub: t('{n} people', { n: ch.members.length + 1 }), user: { username: ch.name } })
        else if (ch.members[0]) {
          seen.add(ch.members[0].username)
          out.push({ key: ch.id, chatId: ch.id, name: ch.members[0].name || `@${ch.members[0].username}`, sub: `@${ch.members[0].username}`, user: ch.members[0] })
        }
      }
      for (const u of f.friends || []) if (!seen.has(u.username)) out.push({ key: u.username, username: u.username, name: u.name || `@${u.username}`, sub: `@${u.username}`, user: u })
      setPeople(out)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.token])

  const send = async (p) => {
    if (busy) return
    setBusy(p.key)
    try {
      const a = api(account.token)
      const id = p.chatId || (await a.startChat({ with: [p.username] })).id
      await a.send(id, { kind: 'share', share, text: text.trim() })
      actions.toast({ text: t('Sent to {name}', { name: p.name }), action: { label: t('Open'), run: () => navigate(`/chats/${id}`) } })
      onClose()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
      setBusy(null)
    }
  }

  return (
    <Sheet onClose={onClose} label={t('Send to a friend')}>
      <SheetHeader title={t('Send to a friend')} onClose={onClose} />
      {!account ? (
        <div className="px-5 pb-4">
          <NeedAccount title={t('Create an account to send it')} text={t('It takes half a minute, and your projects are saved too.')} />
        </div>
      ) : (
        <div className="px-5 pb-3">
          {title && <p className="truncate px-1 text-[15px] text-sub">{title}</p>}
          <input
            className="input mt-2"
            placeholder={t('Add a message (optional)')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            aria-label={t('Add a message (optional)')}
          />
          {people === null ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6 text-sub" />
            </div>
          ) : people.length === 0 ? (
            <p className="px-1 py-8 text-center text-[15px] text-sub">{t('No friends yet. Add someone on the Friends tab first.')}</p>
          ) : (
            <ul className="surface mt-3 divide-y divide-line/15 overflow-hidden">
              {people.map((p) => (
                <li key={p.key}>
                  <button onClick={() => send(p)} disabled={!!busy} className="row min-h-[60px] w-full gap-3 py-2 text-left active:bg-mist disabled:opacity-60">
                    <Avatar user={p.user} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-medium leading-tight">{p.name}</span>
                      <span className="block truncate text-[13px] text-sub">{p.sub}</span>
                    </span>
                    {busy === p.key ? <Spinner className="h-5 w-5 text-sub" /> : <span className="btn-tinted min-h-[34px] shrink-0 px-3.5 text-[15px]">{t('Send')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  )
}
