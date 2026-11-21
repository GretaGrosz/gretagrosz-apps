// The social pieces, built from the same parts as the rest of Blank (surface cards, rows, sheets, Segmented):
// avatars, post cards, the post composer (with the rules the first time), and the menus on a post.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api, forgetImage, mediaOf, mediaPath, uploadMedia, useAuthImage } from '../social'
import { getPhotoBlob, processImage } from '../media'
import { COST_LABEL, TIME_LABEL } from '../data'
import { Icon, PhotoError, Segmented, Sheet, SheetHeader, Spinner } from './ui'
import { CropSheet } from './CropSheet'
import { LoginSheet } from './AccountSheet'
import { OUT_OF_AI, STARTER_ONLY, guessLang, planFromSomeone } from '../plan'
import { SendSheet } from './SendSheet'
import { StartQuestions } from './Journey'
import { accountPushPref, turnOnAccountPush } from '../notify'

export const ERRORS = {
  offline: 'You’re offline. Connect to the internet and try again.',
  too_many: 'That’s the limit for today. Try again tomorrow.',
  banned: 'Your account can’t post anymore because it broke the rules.',
  no_storage: 'Photos aren’t set up on the server yet.',
  photo_rejected: 'That photo can’t be used. Pick a different one.',
  photo_check: 'Photos can’t be checked right now. Try again later.',
  too_big: 'That photo is too big.',
  too_many_media: 'A post can have up to 10 photos.',
  not_found: 'This doesn’t exist anymore.',
  limit: 'Blank has reached its free limit for today. Try again tomorrow.',
  text_rejected: 'Some words in there aren’t allowed on Blank. Change them and try again.',
}
export const errorText = (t, e) => t(ERRORS[e?.code] || 'Something went wrong. Try again.')

// ---------- your social profile (cached for the whole app) ----------
let meCache = { token: null, value: null, promise: null }
const meListeners = new Set()
export function useSocialMe() {
  const { account } = useAccount()
  const token = account?.token
  const [me, setMe] = useState(meCache.token === token ? meCache.value : null)
  useEffect(() => {
    const fn = (v) => setMe(v)
    meListeners.add(fn)
    if (!token) {
      setMe(null)
      return () => meListeners.delete(fn)
    }
    if (meCache.token !== token) meCache = { token, value: null, promise: null }
    if (meCache.value) setMe(meCache.value)
    else if (!meCache.promise) {
      meCache.promise = api(token)
        .me()
        .then((v) => {
          meCache.value = v
          meListeners.forEach((l) => l(v))
        })
        .catch(() => {})
        .finally(() => (meCache.promise = null))
    }
    return () => meListeners.delete(fn)
  }, [token])
  const update = useCallback((patch) => {
    meCache.value = { ...meCache.value, ...patch }
    meListeners.forEach((l) => l(meCache.value))
  }, [])
  return [me, update]
}

// ---------- founding tester badge (the first 50 accounts, worker/blank-social.js) ----------
export function FounderBadge({ small = false }) {
  const { t } = useT()
  if (small)
    return (
      <span className="ml-1 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-spark-soft align-[-3px] text-spark-ink" title={t('Founding tester')} aria-label={t('Founding tester')}>
        <Icon name="trophy" className="h-[11px] w-[11px]" />
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-spark-soft px-3 py-1 text-[13px] font-semibold text-spark-ink">
      <Icon name="trophy" className="h-3.5 w-3.5" /> {t('Founding tester')}
    </span>
  )
}

// ---------- avatar ----------
export function Avatar({ user, size = 40, bust = 0 }) {
  const { account } = useAccount()
  const url = useAuthImage(user?.avatar ? `/social/avatar/${user.username}${bust ? `?v=${bust}` : ''}` : null, account?.token)
  const letter = (user?.name || user?.username || '?').trim().charAt(0).toUpperCase()
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-spark-soft font-semibold text-spark-ink"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : letter}
    </span>
  )
}

// One photo of a post. Loads once it's on screen or next to it.
function MediaSlide({ post, n, near }) {
  const { account } = useAccount()
  const [seen, setSeen] = useState(near)
  if (near && !seen) setSeen(true)
  const url = useAuthImage(seen ? mediaPath(post, n) : null, account?.token)
  return <span className="relative block h-full w-full bg-mist">{url && <img src={url} alt="" decoding="async" className="h-full w-full object-cover" />}</span>
}

// Every slide (and the Ideas tile) gets the first photo's shape, kept between wide (1.91:1) and tall (4:5) like other apps do
const shapeOf = (item) => Math.min(1.25, Math.max(0.52, item?.ratio || 1))

// Where a photo sits in the stack, by how far it is behind the top one (like iMessage: tilted, peeking out)
const STACK = [
  { x: 0, r: 0, s: 1 },
  { x: 7, r: 3, s: 0.95 },
  { x: -7, r: -3, s: 0.9 },
]

// A post's photos. Several: a stack like in iMessage. Swipe left and the top photo slides off and goes behind
// the others, swipe right and the one at the back comes to the front.
// compact: inside a feed tile (PostTile), which opens the post when tapped. Swiping there flips the photos and
// doesn't open it; only the top photo and the next one load until you swipe (R2 reads stay low in a long feed).
function PostMedia({ post, compact = false }) {
  const { t } = useT()
  const items = mediaOf(post)
  const [index, setIndex] = useState(0)
  const [dx, setDx] = useState(0)
  const [flying, setFlying] = useState(null)
  const drag = useRef(null)
  const swiped = useRef(false)
  if (items.length === 1) {
    const r = items[0].ratio
    return (
      <span className={`relative block w-full overflow-hidden ${r ? '' : 'min-h-[160px]'}`} style={r ? { aspectRatio: `1 / ${r}`, maxHeight: '70vh' } : undefined}>
        <MediaSlide post={post} n={0} near />
      </span>
    )
  }
  const ratio = shapeOf(items[0])
  const count = items.length
  const go = (i) => {
    setDx(0)
    setIndex(((i % count) + count) % count)
  }
  // Swipe left: the top photo flies off, then tucks in at the back of the stack
  const next = (from) => {
    setFlying({ n: index, x: from })
    setDx(0)
    setTimeout(() => {
      setIndex((i) => (i + 1) % count)
      setFlying(null)
    }, 220)
  }

  const down = (e) => {
    swiped.current = false
    if (flying) return
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, side: null }
  }
  const move = (e) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const mx = e.clientX - d.x
    const my = e.clientY - d.y
    if (!d.side) {
      if (Math.abs(mx) < 6 && Math.abs(my) < 6) return
      d.side = Math.abs(mx) > Math.abs(my) ? 'x' : 'y'
      if (d.side === 'x') {
        swiped.current = true
        e.currentTarget.setPointerCapture?.(e.pointerId)
      }
    }
    if (d.side === 'x') setDx(mx)
  }
  const up = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.side !== 'x') return setDx(0)
    const mx = e.clientX - d.x
    if (mx < -50) next(mx)
    else if (mx > 50) go(index - 1)
    else setDx(0)
  }

  const place = (n) => {
    const k = (n - index + count) % count
    if (flying?.n === n) return { z: count + 1, transform: 'translateX(-125%) rotate(-12deg)', fly: true }
    if (k === 0 && dx) return { z: count, transform: `translateX(${dx}px) rotate(${dx / 25}deg)`, drag: true }
    // Peeking out: the next photo, and the one you just swiped away (now at the back)
    const slot = k === 0 ? 0 : k === 1 ? 1 : k === count - 1 ? 2 : null
    const p = STACK[slot ?? 2]
    return { z: count - k, transform: `translateX(${p.x}%) rotate(${p.r}deg) scale(${p.s})`, hidden: slot == null }
  }

  return (
    <div
      className="relative"
      // A swipe in a feed tile flips the photos; it isn't a tap on the tile
      onClickCapture={(e) => {
        if (!swiped.current) return
        swiped.current = false
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <div
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          drag.current = null
          setDx(0)
        }}
        className={`relative mx-auto touch-pan-y select-none ${compact ? 'w-[86%] py-2' : 'w-[78%] py-3'}`}
        aria-label={t('{n} photos', { n: count })}
      >
        <div className="relative" style={{ aspectRatio: `1 / ${ratio}`, maxHeight: '70vh' }}>
          {items.map((item, n) => {
            const p = place(n)
            const k = (n - index + count) % count
            return (
              <div
                key={n}
                className="absolute inset-0 overflow-hidden rounded-[18px] shadow-[0_4px_18px_rgba(0,0,0,0.18)] [&_img]:pointer-events-none"
                style={{
                  zIndex: p.z,
                  transform: p.transform,
                  opacity: p.hidden ? 0 : 1,
                  transition: p.drag ? 'none' : `transform ${p.fly ? 220 : 380}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms`,
                }}
                aria-hidden={k !== 0}
              >
                <MediaSlide post={post} n={n} near={compact ? k <= 1 : k <= 2 || k === count - 1} />
              </div>
            )
          })}
        </div>
      </div>
      <span
        className={`pointer-events-none absolute z-[20] rounded-full bg-black/55 px-2 py-0.5 font-semibold tabular-nums text-white ${compact ? 'right-[9%] top-3.5 text-[12px]' : 'right-[13%] top-5 text-[13px]'}`}
      >
        {index + 1}/{items.length}
      </span>
      {compact ? (
        // In a tile (itself a button) the dots only show where you are
        <span className="mt-1 flex justify-center gap-1" aria-hidden="true">
          {items.map((_, n) => (
            <span key={n} className={`h-1.5 rounded-full transition-all ${n === index ? 'w-3.5 bg-spark' : 'w-1.5 bg-ink/20'}`} />
          ))}
        </span>
      ) : (
      <div className="mt-2 flex justify-center gap-1.5">
        {items.map((_, n) => (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            className={`h-1.5 rounded-full transition-all ${n === index ? 'w-4 bg-spark' : 'w-1.5 bg-ink/20'}`}
            aria-label={t('Photo {n}', { n: n + 1 })}
            aria-current={n === index}
          />
        ))}
      </div>
      )}
    </div>
  )
}

// ---------- one post ----------
export function PostCard({ post, onChange, onRemove, admin }) {
  const { t, tn } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [menu, setMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const name = post.author.name || `@${post.author.username}`

  const [login, setLogin] = useState(false)
  const [comments, setComments] = useState(false)
  const like = async () => {
    if (!account) return setLogin(true)
    if (busy) return
    setBusy(true)
    const next = !post.liked
    onChange?.({ ...post, liked: next, ...(post.mine && { likes: post.likes + (next ? 1 : -1) }) })
    try {
      const r = await api(account.token).like(post.id, next)
      onChange?.(r.post)
    } catch (e) {
      onChange?.(post)
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="surface animate-rise overflow-hidden">
      <div className="flex items-center gap-3 px-4 pb-3 pt-3">
        {/* Profiles need an account: without one, the name asks you to make one */}
        <Link
          to={`/u/${post.author.username}`}
          onClick={(e) => !account && (e.preventDefault(), setLogin(true))}
          className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70"
        >
          <Avatar user={post.author} size={36} />
          <span className="min-w-0">
            <span className="flex items-center text-[15px] font-semibold leading-tight">
              <span className="truncate">{name}</span>
              {post.author.founder && <FounderBadge small />}
              {/* Their first post: a small welcome, so people say hi to someone new */}
              {post.first && !post.mine && (
                <span className="ml-1.5 shrink-0 rounded-full bg-spark-soft px-2 py-0.5 text-[11px] font-semibold text-spark-ink">{t('New on Blank')}</span>
              )}
            </span>
            <span className="block truncate text-[13px] text-sub">
              {post.project || ''}
            </span>
          </span>
        </Link>
        {account && (
          <button
            onClick={() => setMenu(true)}
            className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist"
            aria-label={t('More')}
          >
            <Icon name="more" className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>
      {post.first && post.mine && (
        <p className="mx-4 mb-3 flex items-center gap-2 rounded-[12px] bg-spark-soft px-3 py-2 text-[13px] font-semibold text-spark-ink">
          <Icon name="sparkle" className="h-4 w-4 shrink-0" />
          {t('First post. Others see you as new on Blank.')}
        </p>
      )}
      {mediaOf(post).length > 0 && <PostMedia post={post} />}
      <div className="px-4 py-3">
        {post.kind === 'finish' && (
          <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-spark-ink">
            <Icon name="trophy" className="h-4 w-4" /> {t('Finished')}
          </p>
        )}
        {post.text && <p className="whitespace-pre-line text-[17px] leading-snug">{post.text}</p>}
        {(post.cost || post.time) && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-[13px] font-medium text-sub">
            {post.cost && <span className="rounded-full bg-mist px-2.5 py-1">{t(COST_LABEL[post.cost])}</span>}
            {post.time && (
              <span className="flex items-center gap-1 rounded-full bg-mist px-2.5 py-1">
                <Icon name="timer" className="h-3.5 w-3.5" /> {t(TIME_LABEL[post.time])}
              </span>
            )}
          </p>
        )}
        {post.status === 'review' && (
          <p className="mt-2 rounded-xl bg-mist px-3 py-2 text-[13px] text-sub">{t('Waiting for a check. Only you can see this for now.')}</p>
        )}
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={like}
            className={`-ml-2 flex h-9 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium active:bg-mist ${post.liked ? 'text-spark-ink' : 'text-sub'}`}
            aria-pressed={post.liked}
            aria-label={t('Like')}
          >
            <Icon name="heart" filled={post.liked} className="h-5 w-5" />
            {/* The count is only sent to the author (worker/blank-social.js shapePost) */}
            {post.mine && post.likes > 0 && <span className="tabular-nums">{post.likes}</span>}
          </button>
          {(!post.commentsOff || post.comments > 0) && (
            <button
              onClick={() => (account ? setComments(true) : setLogin(true))}
              className="flex h-9 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium text-sub active:bg-mist"
              aria-label={t('Comments')}
            >
              <Icon name="chat" className="h-5 w-5" />
              {post.comments > 0 && <span className="tabular-nums">{post.comments}</span>}
            </button>
          )}
          <span className="ml-auto text-[13px] text-sub">{post.visibility === 'public' ? t('Everyone') : t('Friends')}</span>
        </div>
        {(post.started > 0 || post.made > 0) && (
          <p className="mt-1 text-[13px] font-semibold text-spark-ink">
            {[
              post.made > 0 && tn(post.made, '{n} person made this because of it', '{n} people made this because of it'),
              post.started > 0 && tn(post.started, '{n} person started this because of it', '{n} people started this because of it'),
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {admin && post.reports && Object.keys(post.reports).length > 0 && (
          <p className="mt-2 text-[13px] text-bad">
            {t('Reported')}: {Object.entries(post.reports).map(([r, n]) => `${t(REASON_LABEL[r] || 'Other')} ×${n}`).join(', ')}
          </p>
        )}
      </div>
      {menu && <PostMenu post={post} onClose={() => setMenu(false)} onRemove={onRemove} onChange={onChange} />}
      {comments && <CommentsSheet post={post} onClose={() => setComments(false)} onCount={(n) => n !== post.comments && onChange?.({ ...post, comments: n })} />}
      {login && <LoginSheet initialMode="signup" onClose={() => setLogin(false)} />}
    </li>
  )
}

export const REASON_LABEL = { spam: 'Spam', mean: 'Mean or bullying', nudity: 'Nudity or sexual', violence: 'Violence or dangerous', notmine: 'Not their own work', other: 'Something else' }

function PostMenu({ post, onClose, onRemove, onChange }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [mode, setMode] = useState('menu')
  const [busy, setBusy] = useState(false)
  const a = api(account.token)
  const run = async (fn, toast) => {
    setBusy(true)
    try {
      await fn()
      if (toast) actions.toast({ text: toast })
      onClose()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
      setBusy(false)
    }
  }
  const row = 'row min-h-[52px] text-[17px] active:bg-mist disabled:opacity-50'
  return (
    <Sheet onClose={onClose} label={t('Post')}>
      <SheetHeader title={mode === 'report' ? t('Report post') : t('Post')} onClose={onClose} />
      <div className="px-5 pb-2 pt-1">
        {mode === 'menu' ? (
          <ul className="surface divide-y divide-line/15 overflow-hidden">
            {post.mine ? (
              <>
              <li>
                <button
                  disabled={busy}
                  className={row}
                  onClick={() => run(async () => onChange?.((await a.setCommentsOff(post.id, !post.commentsOff)).post), post.commentsOff ? 'Comments are on' : 'Comments are off')}
                >
                  <Icon name="chat" className="h-5 w-5" /> {post.commentsOff ? t('Turn on comments') : t('Turn off comments')}
                </button>
              </li>
              <li>
                <button
                  disabled={busy}
                  className={`${row} text-bad`}
                  onClick={() => window.confirm(t('Delete this post?')) && run(async () => (await a.deletePost(post.id), onRemove?.(post)), 'Post deleted')}
                >
                  <Icon name="trash" className="h-5 w-5" /> {t('Delete post')}
                </button>
              </li>
              </>
            ) : (
              <>
                <li>
                  <button disabled={busy} className={`${row} text-spark-ink`} onClick={() => setMode('report')}>
                    <Icon name="warning" className="h-5 w-5" /> {t('Report post')}
                  </button>
                </li>
                <li>
                  <button
                    disabled={busy}
                    className={`${row} text-bad`}
                    onClick={() =>
                      window.confirm(t('Block @{name}? You won’t see each other anymore.', { name: post.author.username })) &&
                      run(async () => (await a.block(post.author.username), onRemove?.(post, true)), 'Blocked')
                    }
                  >
                    {t('Block @{name}', { name: post.author.username })}
                  </button>
                </li>
              </>
            )}
          </ul>
        ) : (
          <>
            <p className="px-1 pb-3 text-[15px] text-sub">{t('What’s wrong with it? Reports are anonymous.')}</p>
            <ul className="surface divide-y divide-line/15 overflow-hidden">
              {Object.entries(REASON_LABEL).map(([id, label]) => (
                <li key={id}>
                  <button disabled={busy} className={row} onClick={() => run(() => a.report(post.id, id), 'Thanks. We’ll check it.')}>
                    {t(label)}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  )
}

// ---------- comments under a post ----------
// Oldest first, like a conversation. Tap a comment: delete it (yours, or any under your post) or report it.
export function CommentsSheet({ post, onClose, onCount }) {
  const { t, fmt } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [list, setList] = useState(null)
  const [off, setOff] = useState(post.commentsOff)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState(null) // a comment you tapped
  const [reporting, setReporting] = useState(false)
  const end = useRef(null)
  const a = api(account.token)
  useEffect(() => {
    a.comments(post.id)
      .then((r) => {
        setList(r.comments)
        setOff(r.off)
        onCount?.(r.comments.length)
      })
      .catch(() => setList([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id])
  useEffect(() => {
    if (list?.length) end.current?.scrollIntoView({ block: 'end' })
  }, [list?.length])
  const send = async (e) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      const r = await a.comment(post.id, body)
      const next = [...(list || []), r.comment]
      setList(next)
      onCount?.(next.length)
      setText('')
    } catch (err) {
      actions.toast({ text: err.code === 'comments_off' ? 'Comments are off for this post.' : ERRORS[err.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }
  const remove = async (c) => {
    setPicked(null)
    try {
      await a.deleteComment(c.id)
      const next = list.filter((x) => x.id !== c.id)
      setList(next)
      onCount?.(next.length)
    } catch (err) {
      actions.toast({ text: ERRORS[err.code] || 'Something went wrong. Try again.' })
    }
  }
  const report = async (c, reason) => {
    setPicked(null)
    setReporting(false)
    try {
      await a.reportComment(c.id, reason)
      actions.toast({ text: 'Thanks. We’ll check it.' })
    } catch (err) {
      actions.toast({ text: ERRORS[err.code] || 'Something went wrong. Try again.' })
    }
  }
  const row = 'row min-h-[52px] w-full text-left text-[17px] active:bg-mist'
  return (
    <Sheet onClose={onClose} label={t('Comments')}>
      <SheetHeader title={t('Comments')} onClose={onClose} />
      <div className="px-5 pb-2">
        {list === null ? (
          <div className="flex justify-center py-10">
            <Spinner className="h-6 w-6 text-sub" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-[15px] text-sub">{off && !post.mine ? t('Comments are off for this post.') : t('No comments yet. Say something nice!')}</p>
        ) : (
          <ul className="max-h-[50vh] space-y-3 overflow-y-auto py-1">
            {list.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setPicked(c)} className="flex w-full items-start gap-2.5 text-left active:opacity-70">
                  <Avatar user={c.author} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-sub">
                      <span className="font-semibold text-ink">{c.author.name || `@${c.author.username}`}</span> · {fmt.ago(c.created)}
                    </span>
                    <span className="block whitespace-pre-line break-words text-[15px] leading-snug">{c.text}</span>
                  </span>
                </button>
              </li>
            ))}
            <li ref={end} />
          </ul>
        )}
        {(!off || post.mine) && (
          <form onSubmit={send} className="mt-3 flex items-end gap-2 rounded-[22px] bg-mist p-1.5">
            <textarea
              rows={1}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('Add a comment')}
              aria-label={t('Add a comment')}
              maxLength={500}
              className="max-h-28 min-h-[38px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[16px] leading-snug outline-none"
            />
            <button
              disabled={!text.trim() || busy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spark text-white disabled:opacity-35"
              aria-label={t('Send')}
            >
              {busy ? <Spinner className="h-4 w-4" /> : <Icon name="up" className="h-5 w-5" strokeWidth={2.6} />}
            </button>
          </form>
        )}
      </div>
      {picked && (
        <Sheet onClose={() => (setPicked(null), setReporting(false))} label={t('Comment')}>
          <SheetHeader title={reporting ? t('Report comment') : t('Comment')} onClose={() => (setPicked(null), setReporting(false))} />
          <div className="px-5 pb-3">
            {reporting && <p className="px-1 pb-3 text-[15px] text-sub">{t('What’s wrong with it? Reports are anonymous.')}</p>}
            <ul className="surface divide-y divide-line/15 overflow-hidden">
              {reporting ? (
                Object.entries(REASON_LABEL).map(([id, label]) => (
                  <li key={id}>
                    <button className={row} onClick={() => report(picked, id)}>
                      {t(label)}
                    </button>
                  </li>
                ))
              ) : (
                <>
                  {picked.canDelete && (
                    <li>
                      <button className={`${row} text-bad`} onClick={() => remove(picked)}>
                        <Icon name="trash" className="h-5 w-5" /> {t('Delete comment')}
                      </button>
                    </li>
                  )}
                  {!picked.mine && (
                    <li>
                      <button className={`${row} text-bad`} onClick={() => setReporting(true)}>
                        <Icon name="warning" className="h-5 w-5" /> {t('Report comment')}
                      </button>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>
        </Sheet>
      )}
    </Sheet>
  )
}

// ---------- not logged in ----------
export function NeedAccount({ title, text }) {
  const { t } = useT()
  const [sheet, setSheet] = useState(null)
  return (
    <div className="surface mt-5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink">
          <Icon name="friends" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold">{title || t('Share what you make')}</p>
          <p className="mt-0.5 text-[15px] leading-snug text-sub">{text || t('With an account you can add friends, post your projects and see what others are making.')}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => setSheet('signup')} className="btn-primary">
          {t('Create account')}
        </button>
        <button onClick={() => setSheet('login')} className="btn-tinted">
          {t('Log in')}
        </button>
      </div>
      {sheet && <LoginSheet initialMode={sheet} onClose={() => setSheet(null)} />}
    </div>
  )
}

// ---------- posting ----------
const RULES = [
  'Post things you made or are working on.',
  'Be kind. No bullying, hate or threats.',
  'No nudity, violence, drugs or weapons.',
  'Only post photos of other people if they said yes.',
  'Reported posts get checked and can be removed. Breaking the rules again gets you banned.',
]

function Rules({ onAccepted }) {
  const { t } = useT()
  const { account } = useAccount()
  const [age, setAge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const accept = async () => {
    setBusy(true)
    setError(null)
    try {
      await api(account.token).acceptRules()
      onAccepted()
    } catch (e) {
      setError(errorText(t, e))
      setBusy(false)
    }
  }
  return (
    <div className="px-5 pb-2 pt-1">
      <p className="px-1 text-[15px] leading-snug text-sub">{t('Before your first post, the rules for Blank:')}</p>
      <ul className="surface mt-3 divide-y divide-line/15 overflow-hidden">
        {RULES.map((r) => (
          <li key={r} className="row min-h-[48px] py-2.5 text-[15px] leading-snug">
            <Icon name="check" className="h-4 w-4 shrink-0 text-spark-ink" strokeWidth={2.6} />
            <span className="flex-1">{t(r)}</span>
          </li>
        ))}
      </ul>
      <label className="mt-4 flex items-start gap-3 px-1 text-[15px] leading-snug">
        <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-spark" />
        <span>{t('I’m 16 or older, or a parent said it’s OK.')}</span>
      </label>
      {error && (
        <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
          {error}
        </p>
      )}
      <button onClick={accept} disabled={!age || busy} className="btn-primary btn-lg mt-5 w-full">
        {busy ? <Spinner className="h-5 w-5" /> : t('I agree')}
      </button>
    </div>
  )
}

const MAX_MEDIA = 10

// Multiple choice that you can leave empty: tap the picked one again to clear it
function Choices({ label, value, onChange, options }) {
  return (
    <div className="mt-4">
      <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(value === v ? null : v)}
            className={`min-h-[36px] rounded-full px-3.5 text-[15px] font-medium transition ${value === v ? 'bg-ink text-card' : 'bg-mist text-ink'}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}

// The photos picked for a post: kept in memory until it's posted.
// orig is the photo as picked, so cropping again always starts from all of it.
let itemKey = 0
const itemOf = ({ blob, ratio }, orig = blob, crop = null) => ({ key: ++itemKey, blob, ratio, orig, crop, url: URL.createObjectURL(blob) })

function MediaPicker({ items, setItems, disabled }) {
  const { t } = useT()
  const input = useRef(null)
  const inputId = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const onChange = async (e) => {
    const files = [...(e.target.files || [])]
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setError(null)
    const added = []
    for (const file of files) {
      if (items.length + added.length >= MAX_MEDIA) {
        setError('full')
        break
      }
      try {
        added.push(itemOf(await processImage(file), file))
      } catch (err) {
        setError(err?.code || 'decode')
      }
    }
    setItems((cur) => [...cur, ...added])
    setBusy(false)
  }
  const remove = (key) =>
    setItems((cur) => {
      const gone = cur.find((x) => x.key === key)
      if (gone) URL.revokeObjectURL(gone.url)
      return cur.filter((x) => x.key !== key)
    })
  // Cropping a photo swaps it for a new copy in the same place
  const [cropping, setCropping] = useState(null)
  const stopCropping = useCallback(() => setCropping(null), [])
  const recrop = async (crop) => {
    const x = cropping
    setCropping(null)
    setBusy(true)
    setError(null)
    try {
      const next = itemOf(await processImage(x.orig, { crop }), x.orig, crop)
      setItems((cur) => cur.map((y) => (y.key === x.key ? next : y)))
      URL.revokeObjectURL(x.url)
    } catch (err) {
      setError(err?.code || 'decode')
    }
    setBusy(false)
  }
  // A <label> for the file field, not a button that clicks a hidden field from script: iPhone Safari doesn't
  // always open the photo picker for a script click, but a tap on the field's label always does.
  const off = busy || disabled
  const add = (
    <label
      htmlFor={inputId}
      onClick={() => setError(null)}
      aria-disabled={off || undefined}
      className={`${items.length ? 'flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-[14px] bg-mist text-[13px] font-medium text-spark-ink active:opacity-70' : 'btn-tinted w-full'} cursor-pointer ${off ? 'pointer-events-none opacity-50' : ''}`}
    >
      {busy ? <Spinner className="h-5 w-5" /> : <Icon name={items.length ? 'plus' : 'camera'} className="h-5 w-5" />}
      {items.length ? t('Add more') : t('Add photos')}
    </label>
  )
  return (
    <>
      {items.length > 0 ? (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {items.map((x) => (
            <div key={x.key} className="relative h-24 w-24 shrink-0 animate-scale-in overflow-hidden rounded-[14px] bg-mist">
              <img src={x.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setCropping(x)}
                disabled={disabled || busy}
                className="absolute bottom-1 left-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white active:opacity-70"
                aria-label={t('Crop')}
              >
                <Icon name="crop" className="h-3.5 w-3.5" strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => remove(x.key)}
                disabled={disabled}
                className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white active:opacity-70"
                aria-label={t('Remove')}
              >
                <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.6} />
              </button>
            </div>
          ))}
          {items.length < MAX_MEDIA && add}
        </div>
      ) : (
        add
      )}
      <input ref={input} id={inputId} type="file" accept="image/*" multiple disabled={off} className="sr-only" tabIndex={-1} onChange={onChange} />
      {cropping && <CropSheet file={cropping.orig} initial={cropping.crop} onDone={recrop} onCancel={stopCropping} />}
      {error && (
        <div className="mt-2">
          {error === 'full' ? (
            <p className="rounded-xl bg-bad/10 px-3 py-2.5 text-[15px] text-bad" role="alert">
              {t(ERRORS.too_many_media)}
            </p>
          ) : (
            <PhotoError code={error} onDismiss={() => setError(null)} />
          )}
        </div>
      )}
    </>
  )
}

// initial: { project, category, kind, text, photo (idb ref), ratio } — from a project entry, or empty from the feed
export function PostSheet({ onClose, onPosted, initial = {} }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { data, actions } = useStore()
  const [me, updateMe] = useSocialMe()
  const [text, setText] = useState(initial.text || '')
  const [items, setItems] = useState([])
  const [cost, setCost] = useState(null)
  const [time, setTime] = useState(null)
  // The project it's for: the one you came from, otherwise the one you're working on now (posts tied to a project
  // are what others can start from, and they show it's your own work)
  const [projectId, setProjectId] = useState(
    () => data.projects.find((p) => p.title === initial.project)?.id || (initial.project == null && data.projects.find((p) => p.status !== 'done')?.id) || '',
  )
  const [details, setDetails] = useState(false)
  // Everyone sees it unless you switch to friends only
  const [visibility, setVisibility] = useState('public')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  // The project photo you're sharing, as the first item; and every preview freed when the sheet closes
  useEffect(() => {
    let alive = true
    // One photo (a step, an entry) or several in order (before & after, your week): initial.photos = [{ photo, ratio }]
    const wanted = initial.photos?.length ? initial.photos : initial.photo ? [{ photo: initial.photo, ratio: initial.ratio }] : []
    Promise.all(wanted.slice(0, 10).map((x) => getPhotoBlob(x.photo).then((blob) => (blob ? itemOf({ blob, ratio: x.ratio || null }) : null)).catch(() => null)))
      .then((loaded) => alive && setItems((cur) => [...loaded.filter(Boolean), ...cur]))
      .catch(() => {})
    return () => {
      alive = false
      itemsRef.current.forEach((x) => URL.revokeObjectURL(x.url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!account) {
    return (
      <Sheet onClose={onClose} label={t('New post')}>
        <SheetHeader title={t('New post')} onClose={onClose} />
        {/* After the account is made this sheet turns into the post, with the photo still in it */}
        <div className="px-5 pb-4">
          <NeedAccount title={t('Create an account to post')} text={t('It takes half a minute, and your projects are saved too. Your photo stays here.')} />
        </div>
      </Sheet>
    )
  }

  const project = data.projects.find((p) => p.id === projectId)
  const empty = !text.trim() && !items.length
  const submit = async (e) => {
    e.preventDefault()
    if (busy || empty) return
    setBusy(true)
    setError(null)
    const a = api(account.token)
    let made = null
    try {
      const body = {
        kind: initial.kind === 'finish' && project?.title === initial.project ? 'finish' : 'update',
        project: project?.title || '',
        category: project?.category || 'other',
        guide: project?.guideKey || null,
        plan: project?.milestones?.filter((m) => !m.auto).map((m) => m.text) || [],
        planHow: project?.milestones?.filter((m) => !m.auto).map((m) => m.how || '') || [],
        materials: project?.materials || [],
        // The language the steps are in (an old project can be in another one than the app), so others get theirs in their own
        lang: guessLang(project?.milestones?.filter((m) => !m.auto).map((m) => m.text) || []) || lang,
        text,
        // Everyone only sees posts with a photo of something you made (the server checks it too)
        visibility: items.length ? visibility : 'friends',
        cost,
        time,
      }
      // A plan made from your updates (Journey.jsx PlanDraftSheet) replaces the project's own steps
      if (initial.plan?.plan?.length) {
        Object.assign(body, { plan: initial.plan.plan, planHow: initial.plan.planHow, materials: initial.plan.materials, lang: guessLang(initial.plan.plan) || lang })
        if (!body.time) body.time = initial.plan.time
      }
      // Finished a project you started from someone's post: your result shows under theirs ("made because of you")
      if (body.kind === 'finish' && project?.from?.post) body.madeFrom = project.from.post
      let r
      if (!items.length) r = await a.post(body)
      else {
        // The post first (only you see it while it uploads), then every photo one by one, then it goes live
        made = (await a.post({ ...body, media: items.map((x) => ({ ratio: x.ratio })) })).post
        for (const [n, x] of items.entries()) {
          setProgress({ n: n + 1, of: items.length })
          await uploadMedia(account.token, made.id, n, x.blob)
        }
        setProgress(null)
        r = await a.publish(made.id)
      }
      // The first time: ask if they want to hear when someone likes it (being answered is what makes people post again)
      const ask = !accountPushPref() && typeof Notification !== 'undefined' && Notification.permission !== 'granted'
      const onlyFriends = visibility === 'public' && items.length && r.post.visibility === 'friends'
      actions.toast(
        r.post.status === 'review'
          ? { text: 'Posted. A quick check runs before others see it.' }
          : onlyFriends
            ? { text: 'Posted for your friends. Everyone sees posts that show something you made.', long: true }
          : ask
            ? {
                text: 'Posted. Want to know when someone likes it?',
                long: true,
                action: { label: 'Turn on', run: () => turnOnAccountPush(account.token, lang).then(() => actions.toast({ text: 'Notifications are on' })).catch(() => {}) },
              }
            : { text: 'Posted' },
      )
      onPosted?.(r.post)
      onClose()
    } catch (err) {
      if (made) a.deletePost(made.id).catch(() => {})
      setProgress(null)
      setError(errorText(t, err))
      setBusy(false)
    }
  }

  return (
    <Sheet onClose={onClose} label={t('New post')}>
      <SheetHeader title={t('New post')} onClose={onClose} />
      {!me ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6 text-sub" />
        </div>
      ) : !me.rules ? (
        <Rules onAccepted={() => updateMe({ rules: true })} />
      ) : (
        <form onSubmit={submit} className="px-5 pb-2 pt-1">
          <MediaPicker items={items} setItems={setItems} disabled={busy} />
          <textarea
            className="input mt-3 min-h-[90px] resize-none"
            placeholder={t('What did you make?')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            aria-label={t('What did you make?')}
          />
          {data.projects.length > 0 && (
            <label className="mt-3 block">
              <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('Project')}</span>
              <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">{t('None')}</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
          )}
          {/* Cost and time help others decide to start it, but they're optional: folded away so Post stays in reach */}
          {details || cost || time ? (
            <>
              <Choices label={t('What did it cost?')} value={cost} onChange={setCost} options={Object.entries(COST_LABEL).map(([k, v]) => [k, t(v)])} />
              <Choices label={t('How long did it take?')} value={time} onChange={setTime} options={Object.entries(TIME_LABEL).map(([k, v]) => [k, t(v)])} />
            </>
          ) : (
            <button type="button" onClick={() => setDetails(true)} className="mt-3 px-1 text-[15px] font-medium text-spark active:opacity-60">
              {t('+ Cost and time (optional)')}
            </button>
          )}
          <div className="mt-4">
            <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('Who can see it')}</span>
            <Segmented
              value={items.length ? visibility : 'friends'}
              onChange={(v) => (items.length || v === 'friends') && setVisibility(v)}
              label={t('Who can see it')}
              options={[
                ['friends', t('Friends')],
                ['public', t('Everyone')],
              ]}
            />
            <p className="mt-1.5 px-1 text-[13px] text-sub">
              {!items.length
                ? t('Add a photo of what you made to show it to everyone.')
                : visibility === 'public'
                  ? t('Anyone can see it, also people without an account. Blank is for things people make.')
                  : t('Only your friends can see it.')}
            </p>
          </div>
          {error && (
            <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || empty} className="btn-primary btn-lg mt-5 w-full">
            {busy ? (
              <>
                <Spinner className="h-5 w-5" /> {progress ? t('Uploading {n} of {total}…', { n: progress.n, total: progress.of }) : null}
              </>
            ) : (
              t('Post')
            )}
          </button>
        </form>
      )}
    </Sheet>
  )
}

// ---------- posts as ideas (the Ideas page) ----------
const titleOf = (post) => post.project || post.text.split('\n')[0].slice(0, 60)

// A post in the Ideas grid: looks like an idea card (photo, title, small line under it)
export function PostTile({ post, onOpen }) {
  const { account } = useAccount()
  const { tn } = useT()
  const first = mediaOf(post)[0]
  const more = mediaOf(post).length > 1
  const url = useAuthImage(first && !more ? mediaPath(post, 0) : null, account?.token)
  return (
    <button onClick={() => onOpen(post)} className="idea-card block w-full text-left active:opacity-75">
      {more ? (
        // Several photos: swipe through them right here, like in the opened post
        <PostMedia post={post} compact />
      ) : first ? (
        <span className="relative block w-full overflow-hidden rounded-[16px] bg-mist" style={{ aspectRatio: `1 / ${shapeOf(first)}` }}>
          {url && <img src={url} alt="" decoding="async" className="h-full w-full object-cover" />}
        </span>
      ) : (
        <span className="surface block rounded-[16px] p-3 text-[15px] leading-snug">
          <span className="line-clamp-6 whitespace-pre-line">{post.text}</span>
        </span>
      )}
      {/* A text-only post already shows its text in the card above: the title would just repeat it */}
      {(first || post.project) && <span className="mt-2 block px-0.5 text-[15px] font-semibold leading-snug">{titleOf(post)}</span>}
      <span className={`flex items-center gap-1 px-0.5 text-[13px] text-sub ${first || post.project ? '' : 'mt-2'}`}>
        <span className="truncate">@{post.author.username}</span>
        {post.started > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <span className="shrink-0 font-semibold text-spark-ink">{tn(post.started, '{n} started', '{n} started')}</span>
          </>
        )}
        {post.likes > 0 && (
          <>
            <span aria-hidden="true">·</span>
            <Icon name="heart" filled className="h-3 w-3 shrink-0" />
            <span className="tabular-nums">{post.likes}</span>
          </>
        )}
      </span>
    </button>
  )
}

// A post opened from Ideas: the full post, and "Start this project" so it works like an idea
export function PostIdeaSheet({ post, onClose, onChange, onRemove }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { data, actions } = useStore()
  const navigate = useNavigate()
  const title = titleOf(post)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [asking, setAsking] = useState(false) // the three quick questions (Journey.jsx)
  // Blank's own plan if it has one for this, otherwise the AI writes one for exactly this post (plan.js)
  const start = async ({ budget, pace, level } = {}) => {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      // The poster's real plan if it's in your language, otherwise the same project in yours (plan.js)
      const { outOfAI, starterOnly, title: name, ...plan } = await planFromSomeone({
        title,
        category: post.category,
        steps: post.plan || [],
        stepsLang: post.planLang,
        guideKey: post.guide,
        about: post.text && post.text.trim() !== title.trim() ? post.text : '',
        hows: post.planHow || [],
        materials: post.materials || [],
        lang,
        level: level || data.me.prefs?.level,
        budget,
        pace,
      })
      const id = actions.addProject({ title: name, ...plan, from: { name: post.author.name || post.author.username, post: post.id }, fromPost: mediaOf(post).length ? post.id : null })
      if (pace || budget) actions.updateProject(id, { pace, budget })
      // Counts on the post and its author's profile: "started because of you"
      api(account?.token).startFromPost(post.id).catch(() => {})
      if (outOfAI) actions.toast({ text: OUT_OF_AI, long: true })
      else if (starterOnly) actions.toast({ text: STARTER_ONLY, long: true })
      navigate(`/project/${id}`, { replace: true })
    } catch (e) {
      setBusy(false)
      setError(e?.code === 'not_a_hobby' ? t('That doesn’t look like a hobby project. Try another name.') : t('Something went wrong. Try again.'))
    }
  }
  return (
    <Sheet onClose={onClose} label={title} wide>
      <SheetHeader title={title} onClose={onClose} />
      <ul className="px-5">
        <PostCard post={post} onChange={onChange} onRemove={(p, all) => (onRemove?.(p, all), onClose())} />
      </ul>
      {post.plan?.length > 0 && (
        <section className="mt-4 px-5">
          <h3 className="section-label">{t('Their plan')}</h3>
          <ol className="surface divide-y divide-line/15 overflow-hidden">
            {post.plan.map((s, i) => (
              <li key={i} className="row min-h-[44px] items-start py-2 text-[15px] leading-snug">
                <span className="w-5 shrink-0 text-center font-semibold tabular-nums text-sub">{i + 1}</span>
                <span className="flex-1">
                  {s}
                  {post.planHow?.[i] && <span className="mt-0.5 block text-[14px] text-sub">{post.planHow[i]}</span>}
                </span>
              </li>
            ))}
          </ol>
          {post.materials?.length > 0 && (
            <>
              <h3 className="section-label mt-4">{t('What you need')}</h3>
              <p className="surface px-4 py-3 text-[15px] leading-relaxed">{post.materials.join(' · ')}</p>
            </>
          )}
        </section>
      )}
      {post.made > 0 && account && <MadeByOthers post={post} />}
      <div className="px-5 pt-3">
        <button onClick={() => setSending(true)} className="btn-plain w-full text-spark-ink">
          <Icon name="chat" className="h-5 w-5" /> {t('Send to a friend')}
        </button>
      </div>
      {asking && <StartQuestions title={title} busy={busy} error={error} onClose={() => !busy && setAsking(false)} onStart={start} />}
      {sending && <SendSheet title={title} share={{ type: 'post', id: post.id }} onClose={() => setSending(false)} />}
      {!post.mine && (
        <div className="sticky bottom-0 mt-2 bg-card px-5 pb-1 pt-3">
          {error && (
            <p className="mb-2 px-1 text-[15px] text-bad" role="alert">
              {error}
            </p>
          )}
          <button onClick={() => setAsking(true)} disabled={busy} className="btn-primary btn-lg w-full">
            {busy ? (
              <>
                <Spinner className="h-5 w-5" /> {t('Making your plan…')}
              </>
            ) : (
              t('Start this project')
            )}
          </button>
        </div>
      )}
    </Sheet>
  )
}

// Results people made by following this post: a row of their photos, tap one to see the post
function MadeByOthers({ post }) {
  const { t, tn } = useT()
  const { account } = useAccount()
  const [posts, setPosts] = useState(null)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    api(account.token)
      .madeFrom(post.id)
      .then((r) => setPosts(r.posts))
      .catch(() => setPosts([]))
  }, [post.id, account.token])
  if (!posts?.length) return null
  return (
    <section className="mt-4 px-5">
      <h3 className="section-label">{tn(posts.length, 'Made by {n} other person', 'Made by {n} other people')}</h3>
      <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {posts.map((p) => (
          <div key={p.id} className="w-[132px] shrink-0 snap-start">
            <PostTile post={p} onOpen={setOpen} />
          </div>
        ))}
      </div>
      {open && (
        <Sheet onClose={() => setOpen(null)} label={t('Post')} wide>
          <SheetHeader title={open.author.name || `@${open.author.username}`} onClose={() => setOpen(null)} />
          <ul className="px-5 pb-3">
            <PostCard post={open} onChange={setOpen} />
          </ul>
        </Sheet>
      )}
    </section>
  )
}

export { forgetImage }
