// The Friends tab: your chats and hobby crews, and finding people, in one place (#/friends and #/friends/people)
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '../account'
import { useT } from '../i18n'
import { Icon, useWide } from '../components/ui'
import { NeedAccount } from '../components/Social'
import { ChatList, NewChatSheet, useFriendsBadge } from './Chats'
import { PeopleList } from './People'

const Count = ({ n }) =>
  n > 0 ? (
    <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-spark px-1.5 text-[12px] font-bold text-white tabular-nums">{n}</span>
  ) : null

export default function Friends({ tab }) {
  const { t } = useT()
  const { account } = useAccount()
  const badge = useFriendsBadge()
  const [starting, setStarting] = useState(false)
  const wide = useWide()
  const segments = [
    { id: 'chats', to: '/friends', label: t('Chats'), n: badge.chats },
    { id: 'people', to: '/friends/people', label: t('People'), n: badge.requests },
  ]

  return (
    <div className="mx-auto max-w-2xl pt-6 lg:max-w-[1760px]">
      <div className="flex items-center gap-2 px-1">
        <h1 className="large-title flex-1">{t('Friends')}</h1>
        {account && (tab === 'chats' || wide) && (
          <button
            onClick={() => setStarting(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark text-white active:opacity-80"
            aria-label={t('New chat')}
          >
            <Icon name="plus" className="h-5 w-5" strokeWidth={2.4} />
          </button>
        )}
      </div>

      {!account ? (
        <NeedAccount />
      ) : (
        <>
          <div className="mt-4 flex rounded-full bg-ink/[0.07] p-1 lg:hidden" role="tablist">
            {segments.map((s) => (
              <Link
                key={s.id}
                to={s.to}
                replace
                role="tab"
                aria-selected={tab === s.id}
                className={`flex h-9 flex-1 items-center justify-center rounded-full text-[15px] font-semibold transition ${tab === s.id ? 'bg-card text-ink shadow-soft' : 'text-sub'}`}
              >
                {s.label}
                <Count n={s.n} />
              </Link>
            ))}
          </div>
          {!wide ? (
            tab === 'chats' ? <ChatList onStart={() => setStarting(true)} /> : <PeopleList />
          ) : (
          // Computers have room for both at once
          <div className="grid grid-cols-2 items-start gap-10 2xl:gap-16">
            <section>
              <h2 className="section-label mt-6 flex items-center">
                {t('Chats')}
                <Count n={badge.chats} />
              </h2>
              <ChatList onStart={() => setStarting(true)} />
            </section>
            <section>
              <h2 className="section-label mt-6 flex items-center">
                {t('People')}
                <Count n={badge.requests} />
              </h2>
              <PeopleList />
            </section>
          </div>
          )}
        </>
      )}

      {starting && <NewChatSheet onClose={() => setStarting(false)} />}
    </div>
  )
}
