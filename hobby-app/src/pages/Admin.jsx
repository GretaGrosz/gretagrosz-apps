// The review queue, only for the admin: posts the photo or word check held back, posts people reported, and
// reported profiles (dismiss, clear their name/bio/picture, or ban)
import { useEffect, useState } from 'react'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api, useAuthImage } from '../social'
import { BackButton, Icon, Spinner } from '../components/ui'
import { Avatar, ERRORS, PostCard, REASON_LABEL, errorText, useSocialMe } from '../components/Social'

// How Blank is doing: accounts, posts and projects, counted on the server each time the page opens
function Stats({ stats: s }) {
  const { t } = useT()
  const tiles = [
    { label: 'Accounts', n: s.accounts, sub: t('+{today} today · +{week} this week', { today: s.accountsToday, week: s.accountsWeek }) },
    { label: 'Active this week', n: s.activeWeek },
    { label: 'Posts', n: s.posts, sub: t('+{n} this week', { n: s.postsWeek }) },
    { label: 'Projects started', n: s.projects },
    { label: 'Projects finished', n: s.finished },
    { label: 'Started from a shared link', n: s.sparkStarts },
  ]
  return (
    <section className="mt-6">
      <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Stats')}</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((x) => (
          <div key={x.label} className="surface p-3">
            <p className="text-[13px] text-sub">{t(x.label)}</p>
            <p className="text-[28px] font-semibold leading-tight tabular-nums">{x.n ?? 0}</p>
            {x.sub && <p className="text-[13px] text-sub">{x.sub}</p>}
          </div>
        ))}
      </div>
      <p className="mt-2 px-1 text-[13px] text-sub">{t('Only people with an account are counted. Anyone using Blank without an account keeps their projects on their own device.')}</p>
      {s.days && <Days days={s.days} />}
    </section>
  )
}

const SOURCE_LABEL = { reddit: 'Reddit', tiktok: 'TikTok', instagram: 'Instagram', poster: 'Poster (QR)', whatsapp: 'WhatsApp', card: 'Business card (QR)', nfc: 'Business card (NFC)', search: 'Search', friend: 'A friend’s link', direct: 'Direct', other: 'Other' }

// The last 7 days, newest first: how many opened Blank, how many were new, made an account, started a project.
// Opened counts every device once a day, with or without an account (worker/blank.js /visit).
function Days({ days }) {
  const { t, fmt } = useT()
  const rows = [...days].reverse()
  const sum = (k) => days.reduce((n, d) => n + d[k], 0)
  const from = {}
  for (const d of days) for (const [k, n] of Object.entries(d.sources)) from[k] = (from[k] || 0) + n
  const cols = [
    ['visitors', t('Opened')],
    ['newVisitors', t('New')],
    ['accounts', t('Accounts')],
    ['projects', t('Projects')],
  ]
  return (
    <>
      <h2 className="mt-6 px-1 text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Last 7 days')}</h2>
      <div className="surface mt-2 overflow-hidden">
        <table className="w-full text-[15px] tabular-nums">
          <thead>
            <tr className="text-[13px] text-sub">
              <th className="px-3 py-2 text-left font-medium">{t('Day')}</th>
              {cols.map(([k, label]) => (
                <th key={k} className="px-2 py-2 text-right font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/15">
            {rows.map((d) => (
              <tr key={d.day}>
                <td className="px-3 py-2">{fmt.date(Date.parse(d.day), { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                {cols.map(([k]) => (
                  <td key={k} className={`px-2 py-2 text-right ${d[k] ? 'font-semibold' : 'text-sub'}`}>
                    {d[k]}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-mist/60 font-semibold">
              <td className="px-3 py-2">{t('Total')}</td>
              {cols.map(([k]) => (
                <td key={k} className="px-2 py-2 text-right">
                  {sum(k)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {Object.keys(from).length > 0 && (
        <p className="mt-2 px-1 text-[15px]">
          <span className="text-sub">{t('New visitors came from')}: </span>
          {Object.entries(from)
            .sort((a, b) => b[1] - a[1])
            .map(([k, n]) => `${t(SOURCE_LABEL[k] || 'Other')} ${n}`)
            .join(' · ')}
        </p>
      )}
      <p className="mt-1 px-1 text-[13px] text-sub">
        {t('Opened counts each phone or computer once a day, with or without an account. Put ?ref=reddit (or tiktok, instagram) at the end of a link to see where people come from.')}
      </p>
    </>
  )
}

const reportText = (t, reports) => Object.entries(reports).map(([r, n]) => `${t(REASON_LABEL[r] || 'Other')} ×${n}`).join(', ')

export default function Admin() {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [me] = useSocialMe()
  const [posts, setPosts] = useState(null)
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [comments, setComments] = useState([])
  const [stats, setStats] = useState(null)
  const [firstPosts, setFirstPosts] = useState([])
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null)
  const token = account?.token

  useEffect(() => {
    if (!token) return
    api(token)
      .adminQueue()
      .then((r) => (setPosts(r.posts), setUsers(r.users || []), setMessages(r.messages || []), setComments(r.comments || []), setStats(r.stats || null), setFirstPosts(r.firstPosts || [])))
      .catch((e) => setError(e))
  }, [token])

  const act = async (post, action) => {
    if (action === 'ban' && !window.confirm(t('Ban @{name}? They can’t post anymore and all their posts disappear.', { name: post.author.username }))) return
    setBusy(post.id)
    try {
      await api(token).adminAction(post.id, action)
      setPosts((list) => list.filter((p) => (action === 'ban' ? p.author.username !== post.author.username : p.id !== post.id)))
      actions.toast({ text: action === 'approve' ? 'Approved' : action === 'ban' ? 'Banned' : 'Removed' })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  const actUser = async (user, action) => {
    if (action === 'ban' && !window.confirm(t('Ban @{name}? They can’t post anymore and all their posts disappear.', { name: user.username }))) return
    setBusy(user.username)
    try {
      await api(token).adminUserAction(user.username, action)
      setUsers((list) => list.filter((u) => u.username !== user.username))
      if (action === 'ban') setPosts((list) => list.filter((p) => p.author.username !== user.username))
      actions.toast({ text: action === 'ban' ? 'Banned' : action === 'clear' ? 'Profile cleared' : 'Dismissed' })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  const actMessage = async (m, action) => {
    if (action === 'ban' && !window.confirm(t('Ban @{name}? They can’t post anymore and all their posts disappear.', { name: m.from.username }))) return
    setBusy(m.id)
    try {
      await api(token).adminMessageAction(m.id, action)
      setMessages((list) => list.filter((x) => x.id !== m.id))
      actions.toast({ text: action === 'ban' ? 'Banned' : action === 'remove' ? 'Removed' : 'Dismissed' })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  const actComment = async (c, action) => {
    if (action === 'ban' && !window.confirm(t('Ban @{name}? They can’t post anymore and all their posts disappear.', { name: c.author.username }))) return
    setBusy(c.id)
    try {
      await api(token).adminCommentAction(c.id, action)
      setComments((list) => list.filter((x) => x.id !== c.id))
      actions.toast({ text: action === 'ban' ? 'Banned' : action === 'remove' ? 'Removed' : 'Dismissed' })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(null)
    }
  }

  if (!account || (me && !me.admin)) return <p className="py-24 text-center text-sub">{t('This page doesn’t exist.')}</p>

  return (
    <div className="mx-auto max-w-2xl pt-2">
      <BackButton fallback="/ideas" />
      <h1 className="large-title px-1">{t('Review posts')}</h1>
      <p className="mt-1 px-1 text-[15px] text-sub">{t('Posts the photo or word check held back, and posts and profiles people reported.')}</p>
      {stats && <Stats stats={stats} />}
      {/* Nobody's first post should go unanswered: one tap likes it, and they get a notification */}
      {firstPosts.length > 0 && (
        <section className="mt-6">
          <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-sub">{t('First posts: give them a cheer')}</h2>
          <ul className="surface mt-2 divide-y divide-line/15 overflow-hidden">
            {firstPosts.map((p) => (
              <li key={p.id} className="row min-h-[60px] py-2">
                <Avatar user={p.author} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{p.author.name || `@${p.author.username}`}</span>
                  <span className="block truncate text-[13px] text-sub">{p.project || p.text}</span>
                </span>
                <button
                  onClick={async () => {
                    try {
                      await api(token).like(p.id, true)
                      setFirstPosts((list) => list.filter((x) => x.id !== p.id))
                    } catch (e) {
                      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
                    }
                  }}
                  className="btn min-h-[36px] shrink-0 bg-spark px-3.5 text-[15px] text-white"
                  aria-label={t('Like')}
                >
                  <Icon name="heart" filled className="h-4 w-4" /> {t('Cheer')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {error ? (
        <p className="py-16 text-center text-sub">{errorText(t, error)}</p>
      ) : !posts ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-sub" />
        </div>
      ) : posts.length === 0 && users.length === 0 && messages.length === 0 && comments.length === 0 ? (
        <p className="py-16 text-center text-[15px] text-sub">{t('Nothing to review.')}</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {users.map((u) => (
            <li key={`u-${u.username}`} className="surface p-4">
              <div className="flex items-center gap-3">
                <Avatar user={u} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-semibold">{u.name || `@${u.username}`}</p>
                  {u.name && <p className="text-[13px] text-sub">@{u.username}</p>}
                </div>
              </div>
              {u.bio && <p className="mt-2 whitespace-pre-line text-[15px] leading-snug">{u.bio}</p>}
              <p className="mt-2 text-[13px] text-bad">
                {t('Profile reported')}: {reportText(t, u.reports)}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button disabled={busy === u.username} onClick={() => actUser(u, 'dismiss')} className="btn-tinted">
                  {t('Dismiss')}
                </button>
                <button disabled={busy === u.username} onClick={() => actUser(u, 'clear')} className="btn-plain">
                  {t('Clear profile')}
                </button>
                <button disabled={busy === u.username} onClick={() => actUser(u, 'ban')} className="btn-plain text-bad">
                  {t('Ban')}
                </button>
              </div>
            </li>
          ))}
          {comments.map((c) => (
            <li key={`c-${c.id}`} className="surface p-4">
              <div className="flex items-center gap-3">
                <Avatar user={c.author} size={40} />
                <p className="min-w-0 truncate text-[17px] font-semibold">{c.author.name || `@${c.author.username}`}</p>
              </div>
              <p className="mt-2 whitespace-pre-line rounded-[14px] bg-mist px-3.5 py-2 text-[15px] leading-snug">{c.text}</p>
              <p className="mt-2 text-[13px] text-bad">
                {t('Comment reported')}: {c.reasons.map((r) => t(REASON_LABEL[r] || 'Other')).join(', ')} ×{c.reports}
                {c.status !== 'ok' && ` · ${t('Hidden')}`}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button disabled={busy === c.id} onClick={() => actComment(c, 'dismiss')} className="btn-tinted">
                  {t('Dismiss')}
                </button>
                <button disabled={busy === c.id} onClick={() => actComment(c, 'remove')} className="btn-plain">
                  {t('Remove')}
                </button>
                <button disabled={busy === c.id} onClick={() => actComment(c, 'ban')} className="btn-plain text-bad">
                  {t('Ban')}
                </button>
              </div>
            </li>
          ))}
          {messages.map((m) => (
            <li key={`m-${m.id}`} className="surface p-4">
              <div className="flex items-center gap-3">
                <Avatar user={m.from} size={40} />
                <p className="min-w-0 truncate text-[17px] font-semibold">{m.from.name || `@${m.from.username}`}</p>
              </div>
              {m.photo && <ReportedPhoto id={m.id} />}
              {(m.text || m.kind === 'checkin') && (
                <p className="mt-2 whitespace-pre-line rounded-[14px] bg-mist px-3.5 py-2 text-[15px] leading-snug">{m.kind === 'checkin' ? `${m.project}: ${m.text}` : m.text}</p>
              )}
              <p className="mt-2 text-[13px] text-bad">
                {t('Chat message reported')}: {m.reasons.map((r) => t(REASON_LABEL[r] || 'Other')).join(', ')} ×{m.reports}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button disabled={busy === m.id} onClick={() => actMessage(m, 'dismiss')} className="btn-tinted">
                  {t('Dismiss')}
                </button>
                <button disabled={busy === m.id} onClick={() => actMessage(m, 'remove')} className="btn-plain">
                  {t('Remove')}
                </button>
                <button disabled={busy === m.id} onClick={() => actMessage(m, 'ban')} className="btn-plain text-bad">
                  {t('Ban')}
                </button>
              </div>
            </li>
          ))}
          {posts.map((p) => (
            <li key={p.id}>
              <ul>
                <PostCard post={p} admin onChange={() => {}} onRemove={(rp) => setPosts((l) => l.filter((x) => x.id !== rp.id))} />
              </ul>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button disabled={busy === p.id} onClick={() => act(p, 'approve')} className="btn-tinted">
                  {t('Approve')}
                </button>
                <button disabled={busy === p.id} onClick={() => act(p, 'remove')} className="btn-plain">
                  {t('Remove')}
                </button>
                <button disabled={busy === p.id} onClick={() => act(p, 'ban')} className="btn-plain text-bad">
                  {t('Ban')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// A reported chat photo (only the admin can load photos from chats they aren't in)
function ReportedPhoto({ id }) {
  const { account } = useAccount()
  const url = useAuthImage(`/social/messages/${id}/photo`, account?.token)
  return url ? <img src={url} alt="" className="mt-2 max-h-80 rounded-[14px] object-contain" /> : <div className="mt-2 h-40 rounded-[14px] bg-mist" />
}
