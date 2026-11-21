// Someone's profile (/u/:username): picture, name, bio, friend button and the posts you're allowed to see.
// Your own profile has "Edit profile", and for the admin a link to the review queue. Other people's can be reported.
// Opened from an invite link (?i=<code>): an invite page first if you have no account, and once you have one you're
// friends right away, with a little celebration (FriendsNow).
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { INVITE_CODE, api, invitePreview, shareInvite, uploadAvatar } from '../social'
import { getPhotoBlob, deletePhotos } from '../media'
import { BackButton, Confetti, Icon, Logo, PhotoError, Sheet, SheetHeader, Spinner, usePhotoPicker } from '../components/ui'
import { AccountSwitcher, LoginSheet } from '../components/AccountSheet'
import { RequestSheet } from '../components/MessageSafety'
import { Avatar, ERRORS, FounderBadge, NeedAccount, PostCard, REASON_LABEL, errorText, forgetImage, useSocialMe } from '../components/Social'

// Someone's invite link, before you have an account: who invited you and one button to join them
function InviteLanding({ username, code }) {
  const { t } = useT()
  const [user, setUser] = useState({ username, name: '', avatar: false })
  const [sheet, setSheet] = useState(null)
  useEffect(() => {
    invitePreview(username, code)
      .then((r) => setUser(r.user))
      .catch(() => {})
  }, [username, code])
  const name = user.name || `@${username}`
  return (
    <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center px-2 text-center">
      <Logo word />
      <div className="invite-pop mt-10">
        <Avatar user={user} size={104} />
      </div>
      <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-[-0.01em]">{t('{name} invited you to Blank', { name })}</h1>
      <p className="mt-2 text-[17px] leading-snug text-sub">{t('Blank is where people share what they make. Join to see what {name} is working on, and you’ll be friends right away.', { name })}</p>
      <button onClick={() => setSheet('signup')} className="btn-primary btn-lg mt-8 w-full">
        {t('Join {name}', { name })}
      </button>
      <button onClick={() => setSheet('login')} className="mt-3 h-11 px-3 text-[15px] font-semibold text-spark-ink active:opacity-60">
        {t('I already have an account')}
      </button>
      {sheet && <LoginSheet initialMode={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

// You just became friends through an invite: both pictures slide together, confetti, and where to go next
function FriendsNow({ user, onDone }) {
  const { t } = useT()
  const [me] = useSocialMe()
  const name = user.name || `@${user.username}`
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" role="dialog" aria-modal="true" aria-label={t('You’re friends now')}>
      <div className="axo-card-in surface relative w-full max-w-sm overflow-visible px-6 pb-6 pt-10 text-center">
        <Confetti count={34} />
        <div className="flex items-center justify-center">
          <span className="friends-left rounded-full ring-4 ring-card">
            <Avatar user={me || { username: '?' }} size={76} />
          </span>
          <span className="friends-heart z-10 -mx-3 flex h-10 w-10 items-center justify-center rounded-full bg-spark text-white shadow-pop">
            <Icon name="check" className="h-5 w-5" strokeWidth={3} />
          </span>
          <span className="friends-right rounded-full ring-4 ring-card">
            <Avatar user={user} size={76} />
          </span>
        </div>
        <h2 className="mt-6 text-[24px] font-bold leading-tight">{t('You and {name} are friends now!', { name })}</h2>
        <p className="mt-2 text-[16px] leading-snug text-sub">{t('You’ll see each other’s posts in your feed. Start a project and show {name} what you’re making.', { name })}</p>
        <button onClick={onDone} className="btn-primary btn-lg mt-6 w-full" data-autofocus>
          {t('Let’s go')}
        </button>
      </div>
    </div>
  )
}

function ReportProfile({ user, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [busy, setBusy] = useState(false)
  const report = async (reason) => {
    setBusy(true)
    try {
      await api(account.token).reportUser(user.username, reason)
      actions.toast({ text: 'Thanks. We’ll check it.' })
      onClose()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Report profile')}>
      <SheetHeader title={t('Report profile')} onClose={onClose} />
      <div className="px-5 pb-2 pt-1">
        <p className="px-1 pb-3 text-[15px] text-sub">{t('What’s wrong with their name, bio or picture? Reports are anonymous.')}</p>
        <ul className="surface divide-y divide-line/15 overflow-hidden">
          {Object.entries(REASON_LABEL).filter(([k]) => k !== 'notmine').map(([id, label]) => (
            <li key={id}>
              <button disabled={busy} className="row min-h-[52px] text-[17px] active:bg-mist disabled:opacity-50" onClick={() => report(id)}>
                {t(label)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}

function EditProfile({ user, onClose, onSaved }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [, updateMe] = useSocialMe()
  const [name, setName] = useState(user.name)
  const [bio, setBio] = useState(user.bio)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [bust, setBust] = useState(0)
  const [hasAvatar, setHasAvatar] = useState(user.avatar)
  const picker = usePhotoPicker(async ({ ref }) => {
    setError(null)
    try {
      const blob = await getPhotoBlob(ref)
      await uploadAvatar(account.token, blob)
      forgetImage(`/social/avatar/${user.username}`)
      setHasAvatar(true)
      setBust(Date.now())
    } catch (e) {
      setError(errorText(t, e))
    } finally {
      deletePhotos([ref])
    }
  }, { aspect: 1 })
  const save = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const r = await api(account.token).saveMe({ name, bio })
      updateMe(r)
      if (name.trim()) actions.setMe({ name: name.trim() })
      onSaved({ ...r, avatar: hasAvatar }, bust)
      onClose()
    } catch (err) {
      setError(errorText(t, err))
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Edit profile')}>
      <SheetHeader title={t('Edit profile')} onClose={onClose} />
      <form onSubmit={save} className="px-5 pb-2 pt-1">
        <div className="flex flex-col items-center">
          <Avatar user={{ ...user, name, avatar: hasAvatar }} size={88} bust={bust} />
          <button type="button" onClick={picker.open} disabled={picker.busy} className="mt-3 h-9 rounded-full px-3 text-[15px] font-semibold text-spark-ink active:opacity-60">
            {picker.busy ? <Spinner className="h-5 w-5" /> : t('Change picture')}
          </button>
          {picker.input}
        </div>
        {picker.error && <PhotoError code={picker.error} onDismiss={picker.clearError} />}
        <label className="mt-3 block">
          <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('Name')}</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('Optional')} />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('About you')}</span>
          <textarea className="input min-h-[80px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} placeholder={t('What do you like making?')} />
        </label>
        {error && (
          <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary btn-lg mt-5 w-full">
          {busy ? <Spinner className="h-5 w-5" /> : t('Save')}
        </button>
      </form>
    </Sheet>
  )
}

export default function Profile() {
  const { username } = useParams()
  const [params] = useSearchParams()
  const invite = INVITE_CODE.test(params.get('i') || '') ? params.get('i') : null
  const navigate = useNavigate()
  const { t, tn } = useT()
  const { account } = useAccount()
  const { data, actions } = useStore()
  const [friendsNow, setFriendsNow] = useState(false)
  const joining = useRef(false)
  const [me] = useSocialMe()
  const [state, setState] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [bust, setBust] = useState(0)
  const token = account?.token

  // Only the newest request counts (switching account changes the token and then the page right after)
  const latest = useRef(0)
  const load = () => {
    const n = ++latest.current
    return api(token)
      .user(username)
      .then((r) => n === latest.current && (setState(r), setError(null)))
      .catch((e) => n === latest.current && setError(e))
  }
  useEffect(() => {
    setState(null)
    if (token) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, username])

  // Logged in with an invite code in the link: become friends now, then drop the code from the address
  useEffect(() => {
    if (!token || !invite || !state || joining.current) return
    if (state.relation === 'self' || state.relation === 'blocked') return navigate(`/u/${username}`, { replace: true })
    joining.current = true
    api(token)
      .addFriend(username, invite)
      .then((r) => {
        if (r.relation === 'friends' && state.relation !== 'friends') setFriendsNow(true)
        return load()
      })
      .catch(() => {})
      .finally(() => navigate(`/u/${username}`, { replace: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, invite, state])

  if (!account) {
    if (invite) return <InviteLanding username={username} code={invite} />
    // Opened from someone's invite link before having an account
    return (
      <div className="mx-auto max-w-2xl pt-6">
        <h1 className="large-title px-1">{t('@{name} invited you to Blank', { name: username })}</h1>
        <p className="mt-2 px-1 text-[17px] leading-snug text-sub">{t('Create an account or log in, then add each other as friends.')}</p>
        <NeedAccount />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-2xl pt-2">
        <BackButton fallback="/ideas" />
        <p className="py-24 text-center text-sub">{errorText(t, error)}</p>
      </div>
    )
  }
  if (!state) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6 text-sub" />
      </div>
    )
  }

  const a = api(token)
  const { user, relation, posts, friends, inspired = 0 } = state
  const act = async (fn, toast) => {
    setBusy(true)
    try {
      await fn(user.username)
      if (toast) actions.toast({ text: toast })
      await load()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }
  const setPosts = (fn) => setState((s) => ({ ...s, posts: fn(s.posts) }))

  return (
    <div className="mx-auto max-w-2xl pt-2 lg:max-w-[1760px]">
      <BackButton fallback="/ideas" />
      <div className="flex flex-col items-center px-4 pt-2 text-center">
        <Avatar user={user} size={88} bust={bust} />
        {relation === 'self' ? (
          <button onClick={() => setSwitching(true)} className="mt-3 flex items-center gap-1.5 active:opacity-60" aria-label={t('Switch account')}>
            <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em]">{user.name || `@${user.username}`}</h1>
            <Icon name="chevron" className="h-4 w-4 rotate-90 text-sub" strokeWidth={2.6} />
          </button>
        ) : (
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-[-0.01em]">{user.name || `@${user.username}`}</h1>
        )}
        {user.name && <p className="text-[15px] text-sub">@{user.username}</p>}
        {user.founder && (
          <span className="mt-2">
            <FounderBadge />
          </span>
        )}
        {user.bio && <p className="mt-2 max-w-sm whitespace-pre-line text-[17px] leading-snug">{user.bio}</p>}
        <p className="mt-2 text-[15px] text-sub">{tn(friends, '{n} friend', '{n} friends')}</p>
        {/* Blank's public number instead of likes: how many people started a project from these posts */}
        {inspired > 0 && (
          <p className="mt-1 text-[15px] font-semibold text-spark-ink">
            {relation === 'self'
              ? tn(inspired, '{n} person started a project because of you', '{n} people started a project because of you')
              : tn(inspired, '{n} person started a project because of these posts', '{n} people started a project because of these posts')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {relation === 'self' ? (
            <>
              <button onClick={() => setEditing(true)} className="btn-tinted">
                <Icon name="pencil" className="h-4 w-4" /> {t('Edit profile')}
              </button>
              <button
                onClick={async () => {
                  const r = await shareInvite(token, user.username, t('Add me on Blank'))
                  if (r === 'copied') actions.toast({ text: 'Invite link copied' })
                }}
                className="btn-plain"
              >
                <Icon name="link" className="h-4 w-4" /> {t('Invite link')}
              </button>
              {me?.admin && (
                <Link to="/admin" className="btn-plain">
                  {t('Review posts')}
                </Link>
              )}
            </>
          ) : relation === 'blocked' ? (
            <button disabled={busy} onClick={() => act(a.unblock, 'Unblocked')} className="btn-plain">
              {t('Unblock')}
            </button>
          ) : (
            <>
              {relation === 'friends' && (
                <button
                  disabled={busy}
                  onClick={async () => {
                    try {
                      const r = await a.startChat({ with: [user.username] })
                      navigate(`/chats/${r.id}`)
                    } catch (e) {
                      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
                    }
                  }}
                  className="btn-primary"
                >
                  <Icon name="chat" className="h-4 w-4" /> {t('Message')}
                </button>
              )}
              {/* Not friends, but they take message requests: one message, they decide (MessageSafety.jsx) */}
              {relation !== 'friends' && state.requestsOpen && (
                <button disabled={busy} onClick={() => setRequesting(true)} className="btn-plain">
                  <Icon name="chat" className="h-4 w-4" /> {t('Message')}
                </button>
              )}
              {relation === 'friends' ? (
                <button
                  disabled={busy}
                  onClick={() => window.confirm(t('Remove @{name} from your friends?', { name: user.username })) && act(a.removeFriend)}
                  className="btn-plain"
                >
                  <Icon name="check" className="h-4 w-4" strokeWidth={2.6} /> {t('Friends')}
                </button>
              ) : relation === 'outgoing' ? (
                <button disabled={busy} onClick={() => act(a.removeFriend)} className="btn-plain text-sub">
                  {t('Requested')}
                </button>
              ) : (
                <button disabled={busy} onClick={() => act(a.addFriend, relation === 'incoming' ? 'You’re friends now' : 'Request sent')} className="btn-primary">
                  {relation === 'incoming' ? t('Accept request') : t('Add friend')}
                </button>
              )}
              <button
                disabled={busy}
                onClick={() => window.confirm(t('Block @{name}? You won’t see each other anymore.', { name: user.username })) && act(a.block, 'Blocked')}
                className="btn-plain text-bad"
              >
                {t('Block')}
              </button>
              <button disabled={busy} onClick={() => setReporting(true)} className="btn-plain text-sub">
                {t('Report')}
              </button>
            </>
          )}
        </div>
      </div>

      {relation !== 'blocked' &&
        (posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-[15px] text-sub">
            {relation === 'self' ? t('You haven’t posted yet.') : relation === 'friends' ? t('No posts yet.') : t('No public posts yet. Add each other as friends to see more.')}
          </p>
        ) : (
          <ul className="mt-8 space-y-3 lg:columns-2 lg:gap-5 lg:space-y-0 lg:[&>li]:mb-5 lg:[&>li]:break-inside-avoid">
            {posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                admin={me?.admin}
                onChange={(np) => setPosts((list) => list.map((x) => (x.id === np.id ? np : x)))}
                onRemove={(rp) => setPosts((list) => list.filter((x) => x.id !== rp.id))}
              />
            ))}
          </ul>
        ))}

      {reporting && <ReportProfile user={user} onClose={() => setReporting(false)} />}
      {requesting && <RequestSheet user={user} onClose={() => setRequesting(false)} />}
      {friendsNow && (
        <FriendsNow
          user={user}
          onDone={() => {
            setFriendsNow(false)
            // New here: the welcome questions come next, then the app (App.jsx)
            if (!data.onboarded) navigate('/', { replace: true })
          }}
        />
      )}
      {switching && (
        <AccountSwitcher onClose={() => setSwitching(false)} onSwitched={(name) => navigate(`/u/${name}`, { replace: true })} />
      )}
      {editing && (
        <EditProfile
          user={user}
          onClose={() => setEditing(false)}
          onSaved={(u, b) => {
            setState((s) => ({ ...s, user: { ...s.user, ...u } }))
            if (b) setBust(b)
          }}
        />
      )}
    </div>
  )
}
