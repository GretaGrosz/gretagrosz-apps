// The feed: friends' voice notes, the Catch up card, and today's question.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { mutate, revalidate, useResource } from './store.js'
import { discard, retry, useOutbox } from './outbox.js'
import { usePlayer } from './audio.js'
import { t } from './i18n.js'
import { CatchUpCard } from './CatchUp.jsx'
import { NotifyCard } from './Setup.jsx'
import { ReportSheet, useBlock } from './Safety.jsx'
import { ActionSheet, Avatar, Button, Caption, Empty, Icon, Loadable, PlayButton, SPRING, Sheet, SheetHeader, Spinner, Waveform, fmt, timeAgo, toast, useApp } from './ui.jsx'
import { Wordmark } from './App.jsx'

export const toItem = post => ({
  id: post.id, audio: post.audio, fx: post.fx, duration: post.duration, user: post.user, words: post.words, transcript: post.transcript,
  onStart: () => {
    if (post.mineAuthor || post.heard) return
    api(`/posts/${post.id}/play`, { method: 'POST' }).then(() => revalidate('/unheard')).catch(() => {})
  },
})

const LIKE = '❤️'
const likeCount = post => Object.values(post.reactions || {}).reduce((a, b) => a + b, 0)

/** Applies a change to a post wherever lists hold it */
function updatePost(np) {
  const swap = list => list?.map(x => (x.id === np.id ? { ...x, ...np } : x))
  mutate('/feed', d => ({ ...d, posts: swap(d.posts) }))
  mutate('/prompt', d => ({ ...d, answers: swap(d.answers), mine: d.mine?.id === np.id ? { ...d.mine, ...np } : d.mine }))
}
function removePost(id) {
  mutate('/feed', d => ({ ...d, posts: d.posts.filter(x => x.id !== id) }))
}

export function PostCard({ post, next = [], onChange = updatePost, onRemove = p => removePost(p.id), compact = false }) {
  const { openProfile, openThread } = useApp()
  const p = usePlayer()
  const active = p.item?.id === post.id
  const [menu, setMenu] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [report, setReport] = useState(null)
  const [listeners, setListeners] = useState(false)
  const [askBlock, blockSheet] = useBlock(() => onRemove(post))
  const liked = !!post.mine

  const like = async () => {
    const reactions = { ...post.reactions }
    if (liked) { reactions[post.mine] = (reactions[post.mine] || 1) - 1; if (!reactions[post.mine]) delete reactions[post.mine] }
    else reactions[LIKE] = (reactions[LIKE] || 0) + 1
    onChange({ ...post, reactions, mine: liked ? null : LIKE })
    navigator.vibrate?.(8)
    try {
      const { post: fresh } = await api(`/posts/${post.id}/react`, { method: 'POST', body: { emoji: liked ? post.mine : LIKE } })
      onChange({ ...post, ...fresh })
    } catch (e) { toast(e.message, 'error'); onChange(post) }
  }
  const remove = async () => {
    try {
      await api(`/posts/${post.id}`, { method: 'DELETE' })
      onRemove(post)
      revalidate('/prompt')
    } catch (e) { toast(e.message, 'error') }
  }

  // Your own new yap gets its caption a few seconds after posting
  const waiting = post.mineAuthor && !post.transcript && Date.now() - post.created < 60_000
  useEffect(() => {
    if (!waiting) return
    const timer = setInterval(() => {
      if (Date.now() - post.created > 60_000) return clearInterval(timer)
      api(`/captions?p=${post.id}`).then(d => { const c = d.captions[post.id]; if (c) onChange({ ...post, ...c }) }).catch(() => {})
    }, 4000)
    return () => clearInterval(timer)
  }, [waiting, post.id])

  const likes = likeCount(post)
  const own = post.mineAuthor
  const actions = own
    ? [{ label: t('deleteYap'), destructive: true, onClick: () => setConfirmDelete(true) }]
    : post.user.bot ? [] : [
      { label: t('reportYap'), onClick: () => setReport({ kind: 'post', id: post.id, user: post.user }) },
      { label: t('blockName', { name: post.user.name }), destructive: true, onClick: () => askBlock(post.user) },
    ]
  return (
    <article className={compact ? 'py-3' : 'border-b border-line py-4'}>
      <div className="flex items-center gap-3">
        <Avatar user={post.user} size={compact ? 34 : 40} onClick={() => openProfile(post.user.handle)} />
        <button type="button" className="min-h-[44px] min-w-0 flex-1 text-left" onClick={() => openProfile(post.user.handle)}>
          <div className="truncate text-[16px] font-semibold leading-tight">{post.user.name}</div>
          <div className="truncate text-[14px] text-muted">@{post.user.handle} · {timeAgo(post.created)}{post.fx ? ' · ' + t('fx_' + post.fx) : ''}</div>
        </button>
        {actions.length > 0 && (
          <button type="button" onClick={() => setMenu(true)} className="-mr-2 grid h-11 w-11 place-items-center text-muted" aria-label={t('more')}><Icon.Dots size={22} /></button>
        )}
      </div>
      {post.removed && own && <div className="mt-2 text-[14px] font-medium text-[var(--red)]">{t('removedNote')}</div>}
      {post.prompt && (
        <div className="mt-2.5 flex items-start gap-1.5 text-[15px] leading-snug text-muted">
          <Icon.Question size={17} className="mt-[1px] shrink-0 text-accent" /><span>{post.prompt}</span>
        </div>
      )}
      <div className={`mt-3 flex items-center gap-3 rounded-[16px] bg-surface ${compact ? 'p-2.5' : 'p-3'}`}>
        <PlayButton item={toItem(post)} next={next} size={compact ? 36 : 44} label={post.user.name} />
        <Waveform id={post.id} wave={post.wave} height={compact ? 28 : 36} />
        <span className="w-10 shrink-0 text-right text-[14px] font-medium tabular-nums text-muted">{fmt(active ? post.duration * (1 - p.progress) : post.duration)}</span>
      </div>
      <Caption text={post.transcript} className="mt-2 px-1" />

      <div className={`-ml-2.5 flex items-center ${compact ? 'mt-1' : 'mt-1.5'}`}>
        <motion.button type="button" whileTap={{ scale: 1.2 }} onClick={like} className="flex h-11 min-w-[44px] items-center gap-1.5 px-2.5" aria-label={liked ? t('unlike') : t('like')} aria-pressed={liked}>
          {liked ? <Icon.HeartFill size={compact ? 21 : 24} className="text-accent" /> : <Icon.Heart size={compact ? 21 : 24} />}
          {likes > 0 && <span className="text-[15px] font-semibold tabular-nums">{likes}</span>}
        </motion.button>
        {!compact && (
          <button type="button" onClick={() => openThread(post.id)} className="flex h-11 min-w-[44px] items-center gap-1.5 px-2.5" aria-label={t('replies')}>
            <Icon.Reply size={23} />{post.replies > 0 && <span className="text-[15px] font-semibold tabular-nums">{post.replies}</span>}
          </button>
        )}
        {own && post.heardBy > 0 && (
          <button type="button" onClick={() => setListeners(true)} className="ml-auto flex h-11 items-center gap-1.5 px-2 text-[14px] text-muted">
            <Icon.Ear size={18} /> {t('heardBy', { n: post.heardBy })}
          </button>
        )}
      </div>
      <ActionSheet open={menu} onClose={() => setMenu(false)} actions={actions} />
      <ActionSheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('deleteYapQ')} actions={[{ label: t('delete'), destructive: true, onClick: remove }]} />
      <ReportSheet target={report} onClose={() => setReport(null)} onDone={() => onRemove(post)} />
      {blockSheet}
      <Listeners postId={listeners ? post.id : null} onClose={() => setListeners(false)} />
    </article>
  )
}

/** Who heard your yap */
function Listeners({ postId, onClose }) {
  const { openProfile } = useApp()
  const [list, setList] = useState(null)
  useEffect(() => {
    if (!postId) return
    setList(null)
    api(`/posts/${postId}/listeners`).then(d => setList(d.listeners)).catch(e => { toast(e.message, 'error'); onClose() })
  }, [postId])
  return (
    <Sheet open={!!postId} onClose={onClose} label={t('heardByTitle')}>
      <SheetHeader title={t('heardByTitle')} onClose={onClose} closeLabel={t('done')} />
      <div className="max-h-[60dvh] overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {!list ? <div className="grid place-items-center py-10"><Spinner /></div> : list.map(({ user, at }) => (
          <button key={user.handle} type="button" onClick={() => { onClose(); openProfile(user.handle) }} className="flex w-full items-center gap-3 py-2 text-left">
            <Avatar user={user} size={40} />
            <span className="min-w-0 flex-1 truncate text-[17px]">{user.name}</span>
            <span className="text-[14px] text-muted">{timeAgo(at)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

/** Recordings still on their way (or that failed) */
function PendingPosts() {
  const pending = useOutbox(r => r.kind === 'post')
  if (!pending.length) return null
  return (
    <div className="mt-3 flex flex-col gap-2">
      {pending.map(r => <PendingRow key={r.cid} r={r} />)}
    </div>
  )
}
export function PendingRow({ r }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-[16px] bg-surface p-3">
      <PlayButton item={{ id: 'local-' + r.cid, audio: r.url, duration: r.duration, fx: r.fx }} size={40} />
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">{r.status === 'sending' ? t('posting') : t('notPosted')}</div>
        <div className="truncate text-[14px] text-muted">{r.error || fmt(r.duration)}</div>
      </div>
      {r.status === 'sending' ? <Spinner /> : (
        <>
          {!r.error && <Button kind="tinted" className="h-9 px-4 text-[15px]" onClick={() => retry(r.cid)}>{t('retry')}</Button>}
          <button type="button" onClick={() => discard(r.cid)} className="grid h-11 w-11 place-items-center text-muted" aria-label={t('discard')}><Icon.Trash size={20} /></button>
        </>
      )}
    </motion.div>
  )
}

export default function Feed({ active }) {
  const res = useResource('/feed', { poll: 30000, active })
  const [older, setOlder] = useState([])
  const [more, setMore] = useState(true)
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState(null)
  const bottom = useRef(null)
  const latest = res.data?.posts

  // New posts appear at once at the top; while you're scrolled down they wait behind a "new" pill
  useEffect(() => {
    if (!latest) return
    if (!shown || window.scrollY < 120 || !active) setShown(latest)
  }, [latest])
  const fresh = latest && shown ? latest.filter(x => !shown.some(s => s.id === x.id)).length : 0
  const base = (shown || latest || []).map(x => latest?.find(l => l.id === x.id) || x).filter(x => !latest || latest.some(l => l.id === x.id) || x.created < latest[latest.length - 1]?.created)
  const posts = [...base, ...older.filter(o => !base.some(b => b.id === o.id))]

  const loadMore = async () => {
    if (busy || !more || !posts.length) return
    setBusy(true)
    try {
      const { posts: got } = await api('/feed?before=' + posts[posts.length - 1].created)
      setOlder(o => [...o, ...got])
      setMore(got.length === 20)
    } catch {}
    setBusy(false)
  }
  useEffect(() => {
    if (!bottom.current || !more || !active) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && loadMore(), { rootMargin: '600px' })
    io.observe(bottom.current)
    return () => io.disconnect()
  }, [posts.length, more, active])

  const onChange = np => { updatePost(np); setOlder(o => o.map(x => (x.id === np.id ? np : x))) }
  const onRemove = np => { removePost(np.id); setOlder(o => o.filter(x => x.id !== np.id)); setShown(s => s?.filter(x => x.id !== np.id)) }

  return (
    <div className="pb-40 lg:pb-16">
      <header className="glass-bar sticky top-0 z-20 -mx-4 flex h-[calc(52px+max(0px,env(safe-area-inset-top)))] items-end px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))] lg:hidden">
        <Wordmark />
      </header>
      <CatchUpCard active={active} />
      <DailyQuestion active={active} />
      <NotifyCard />
      <PendingPosts />

      <AnimatePresence>
        {fresh > 0 && active && (
          <motion.button type="button" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={SPRING}
            onClick={() => { setShown(latest); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="fixed left-1/2 top-[calc(max(8px,env(safe-area-inset-top))+60px)] z-30 flex h-11 -translate-x-1/2 items-center gap-1.5 rounded-full bg-accent px-4 text-[15px] font-semibold text-white shadow-lg lg:left-[calc(50%+120px)]">
            <Icon.ArrowUp size={17} /> {t('nNew', { n: fresh })}
          </motion.button>
        )}
      </AnimatePresence>

      <Loadable res={res}>
        {() => posts.length === 0 ? (
          <Empty icon={<Icon.MicFill size={34} />} title={t('noYapsYet')} />
        ) : (
          <div className="mt-2">
            <AnimatePresence initial={false}>
              {posts.map((post, i) => (
                <motion.div key={post.id} layout="position" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={SPRING}>
                  <PostCard post={post} next={posts.slice(i + 1).map(toItem)} onChange={onChange} onRemove={onRemove} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Loadable>
      <div ref={bottom} className="grid h-16 place-items-center text-[14px] text-muted">{posts.length ? (more ? (busy ? <Spinner /> : null) : t('thatsAll')) : null}</div>
    </div>
  )
}

/** Today's question. Friends' answers unlock once you've answered; one answer a day */
function DailyQuestion({ active }) {
  const { openRecorder } = useApp()
  const res = useResource('/prompt', { active })
  const [replace, setReplace] = useState(false)
  const q = res.data
  if (!q) return null
  const answer = () => openRecorder({ kind: 'post', prompt: q.text }, () => { revalidate('/prompt'); revalidate('/feed') })
  return (
    <section className="mt-3 rounded-[20px] bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.03em] text-accent"><Icon.Question size={16} /> {t('dailyQuestion')}</div>
      <p className="mt-1.5 text-[22px] font-bold leading-[1.2] tracking-[-0.01em]">{q.text}</p>
      {q.answered ? (
        <>
          {q.answers.length > 0 && (
            <div className="mt-3 border-t border-line">
              {q.answers.map((a, i) => <PostCard key={a.id} compact post={a} next={q.answers.slice(i + 1).map(toItem)} />)}
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            <span className="flex-1 text-[15px] text-muted">{q.answers.length ? t('youAnswered') : t('firstToAnswer')}</span>
            <Button kind="gray" className="h-11 shrink-0 px-4 text-[15px]" onClick={() => setReplace(true)}><Icon.MicFill size={17} /> {t('reRecord')}</Button>
          </div>
          <ActionSheet open={replace} onClose={() => setReplace(false)} title={t('replaceAnswerQ')} actions={[{ label: t('recordNewAnswer'), onClick: answer }]} />
        </>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          {q.count > 0 ? (
            <span className="flex min-w-0 flex-1 items-center gap-2" style={{ '--ring-bg': 'var(--surface)' }}>
              <span className="flex shrink-0 -space-x-2">{q.faces.map(u => <span key={u.handle} className="rounded-full ring-2 ring-[var(--surface)]"><Avatar user={u} size={28} /></span>)}</span>
              <span className="line-clamp-2 text-[15px] leading-tight text-muted">{t('answeredLocked', { n: q.count })}</span>
            </span>
          ) : <span className="flex-1" />}
          <Button className="h-11 shrink-0 px-5 text-[16px]" onClick={answer}><Icon.MicFill size={18} /> {t('answer')}</Button>
        </div>
      )}
    </section>
  )
}

/** One post with its voice replies */
export function Thread({ postId, onClose }) {
  const { openRecorder } = useApp()
  const res = useResource(`/posts/${postId}`)
  const data = res.data
  const replies = data?.replies || []
  const path = `/posts/${postId}`
  const pending = useOutbox(r => r.kind === 'reply' && r.extra?.reply_to === postId)
  useEffect(() => { if (res.error?.status === 404) { toast(res.error.message, 'error'); onClose() } }, [res.error])
  const setPost = np => mutate(path, d => ({ ...d, post: { ...d.post, ...np } }))
  return (
    <Sheet open onClose={onClose} full label={t('replies')}>
      <SheetHeader title={t('replies')} onClose={onClose} closeLabel={t('done')} />
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <Loadable res={res}>
          {() => (
            <>
              <PostCard post={data.post} next={replies.map(toItem)} onChange={np => { setPost(np); updatePost(np) }} onRemove={onClose} />
              <div className="pl-11">
                {replies.length === 0 && !pending.length && <div className="py-8 text-center text-[16px] text-muted">{t('noRepliesYet')}</div>}
                {replies.map((r, i) => (
                  <PostCard key={r.id} compact post={r} next={replies.slice(i + 1).map(toItem)}
                    onChange={np => mutate(path, d => ({ ...d, replies: d.replies.map(x => (x.id === np.id ? np : x)) }))}
                    onRemove={np => mutate(path, d => ({ ...d, replies: d.replies.filter(x => x.id !== np.id) }))} />
                ))}
                {pending.map(r => <div key={r.cid} className="py-2"><PendingRow r={r} /></div>)}
              </div>
            </>
          )}
        </Loadable>
      </div>
      {data && (
        <div className="border-t border-line px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <Button className="h-[50px] w-full" onClick={() => openRecorder({ kind: 'reply', replyTo: data.post.id, user: data.post.user }, () => revalidate(path))}>
            <Icon.MicFill size={20} /> {t('replyTo', { name: data.post.user.name.split(' ')[0] })}
          </Button>
        </div>
      )}
    </Sheet>
  )
}
