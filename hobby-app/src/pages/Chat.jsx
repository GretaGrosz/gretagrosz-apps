// One chat: messages, and a check-in button that tells the others what you worked on today, so friends keep
// each other going. New messages are fetched every few seconds while it's open.
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT } from '../i18n'
import { api, sendChatPhoto, useAuthImage } from '../social'
import { processImage } from '../media'
import { cat } from '../data'
import { BackButton, Icon, Sheet, SheetHeader, Spinner } from '../components/ui'
import { Avatar, ERRORS, NeedAccount, PostIdeaSheet, REASON_LABEL, errorText } from '../components/Social'
import { categoryLabel } from '../components/ProjectBits'
import { ChatAvatar, NewChatSheet, chatTitle } from './Chats'
import { guessLang, planFromSomeone } from '../plan'
import { accountPushPref, turnOnAccountPush } from '../notify'
import { ProjectPin, TogetherCard, catEmoji, togetherLine } from '../components/Together'
import { RequestBanner } from '../components/MessageSafety'

// How often an open chat asks for new messages: every 4 s while something is happening (a message in the last
// minute, or you're typing), every 15 s when it's quiet, never while Blank is in the background. Each ask is one
// request out of the free 100,000 a day that all of gretagrosz.com shares.
const POLL_BUSY = 4000
const POLL_QUIET = 15_000
const BUSY_FOR = 60_000
const GAP = 15 * 60_000 // a time line between messages further apart than this
const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'] // the same six as worker/blank-social.js

export default function Chat() {
  const { id } = useParams()
  const { t, fmt, lang } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [chat, setChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [gone, setGone] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [sheet, setSheet] = useState(null) // 'checkin' | 'info' | { report } | { project } | { actions }
  const [reply, setReply] = useState(null) // the message you're answering
  const [photo, setPhoto] = useState(null) // { blob, url, ratio } waiting to be sent
  const [viewer, setViewer] = useState(null) // a photo message, full screen
  const [seen, setSeen] = useState(0)
  const [typing, setTyping] = useState([]) // names of the others typing right now
  const [project, setProject] = useState(null) // a project chat: the plan, both people's progress, list, sessions
  const [projects, setProjects] = useState([]) // a friend chat: the projects you're doing together (chips on top)
  const typed = useRef(0)
  const end = useRef(null)
  const input = useRef(null)
  const file = useRef(null)
  const since = useRef(0)
  const active = useRef(0) // the last time something happened in this chat (see POLL_BUSY)
  const token = account?.token

  // New messages are added, changed ones (a reaction, an unsend) replace what we had
  const merge = (fresh) => {
    if (!fresh.length) return
    setMessages((cur) => {
      const byId = new Map(cur.map((m) => [m.id, m]))
      for (const m of fresh) byId.set(m.id, m)
      return [...byId.values()].sort((a, b) => a.created - b.created)
    })
  }
  // The next poll asks for everything since this answer (a few seconds of overlap; merge drops the doubles)
  const took = (r) => {
    since.current = r.now ? r.now - 3000 : Math.max(since.current, ...r.messages.map((m) => m.created))
    if (r.seen != null) setSeen(r.seen)
    if (r.typing) setTyping(r.typing)
    if (r.project) setProject(r.project)
    if (r.projects) setProjects(r.projects)
  }

  useEffect(() => {
    if (!token) return
    let alive = true
    since.current = 0
    shown.current = 0
    setMessages([])
    api(token)
      .chat(id)
      .then((r) => {
        if (!alive) return
        setChat(r.chat)
        merge(r.messages)
        took(r)
      })
      .catch((e) => alive && e.code === 'not_found' && setGone(true))
    let timer = null
    const next = () => {
      clearTimeout(timer)
      if (!alive || document.visibilityState !== 'visible') return
      timer = setTimeout(ask, Date.now() - active.current < BUSY_FOR ? POLL_BUSY : POLL_QUIET)
    }
    const ask = () => {
      if (!alive || document.visibilityState !== 'visible') return
      if (!since.current) return next()
      api(token)
        .chat(id, { after: since.current })
        .then((r) => {
          if (!alive) return
          if (r.messages.length) active.current = Date.now()
          merge(r.messages)
          took(r)
        })
        .catch(() => {})
        .finally(next)
    }
    // Back from the background: ask right away, then carry on
    const onShow = () => document.visibilityState === 'visible' && ask()
    document.addEventListener('visibilitychange', onShow)
    active.current = Date.now()
    next()
    return () => {
      alive = false
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onShow)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token])

  // Keep the newest message in view (straight there when the chat opens, smoothly for new messages after that)
  const shown = useRef(0)
  useEffect(() => {
    if (!messages.length) return
    end.current?.scrollIntoView({ block: 'end', behavior: shown.current ? 'smooth' : 'auto' })
    shown.current = messages.length
  }, [messages.length])

  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo])

  if (!account) {
    return (
      <div className="mx-auto max-w-2xl pt-2">
        <BackButton fallback="/friends" />
        <NeedAccount />
      </div>
    )
  }
  if (gone) {
    return (
      <div className="mx-auto max-w-2xl pt-2">
        <BackButton fallback="/friends" />
        <p className="py-20 text-center text-sub">{t('This chat doesn’t exist anymore.')}</p>
      </div>
    )
  }
  if (!chat) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-6 w-6 text-sub" />
      </div>
    )
  }

  const failed = (e) =>
    actions.toast({ text: ERRORS[e.code] || (e.code === 'blocked' ? 'You can’t message this person.' : 'Something went wrong. Try again.') })
  const send = async (body) => {
    active.current = Date.now()
    setBusy(true)
    try {
      const r = await api(token).send(id, { ...body, ...(reply && { reply: reply.id }) })
      merge([r.message])
      setReply(null)
      askForPush()
      return true
    } catch (e) {
      failed(e)
      return false
    } finally {
      setBusy(false)
    }
  }
  const sendPhoto = async () => {
    setBusy(true)
    try {
      const r = await sendChatPhoto(token, id, photo.blob, { text: text.trim(), reply: reply?.id, ratio: photo.ratio })
      merge([r.message])
      setPhoto(null)
      setText('')
      setReply(null)
      askForPush()
    } catch (e) {
      failed(e)
    } finally {
      setBusy(false)
    }
  }
  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    if (photo) return sendPhoto()
    const body = text.trim()
    if (!body) return
    if (await send({ text: body })) setText('')
  }
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const { blob, ratio } = await processImage(f, { max: 1600 })
      setPhoto({ blob, ratio, url: URL.createObjectURL(blob) })
      input.current?.focus()
    } catch {
      actions.toast({ text: 'That photo couldn’t be opened. Try another one.' })
    }
  }
  const startReply = (m) => {
    setReply(m)
    setSheet(null)
    input.current?.focus()
  }
  const react = async (m, emoji) => {
    setSheet(null)
    const mineNow = m.reactions?.find((r) => r.me)?.emoji
    try {
      const r = await api(token).react(m.id, mineNow === emoji ? null : emoji)
      merge([r.message])
    } catch (e) {
      failed(e)
    }
  }
  const unsend = async (m) => {
    setSheet(null)
    try {
      const r = await api(token).unsend(m.id)
      merge([r.message])
      if (reply?.id === m.id) setReply(null)
    } catch (e) {
      failed(e)
    }
  }
  const copy = async (m) => {
    setSheet(null)
    try {
      await navigator.clipboard.writeText(m.text)
      actions.toast({ text: 'Copied' })
    } catch {}
  }

  // The first message you send: offer notifications, so you see the answer without keeping the chat open
  const askForPush = () => {
    if (accountPushPref() || typeof Notification === 'undefined' || Notification.permission !== 'default') return
    try {
      if (sessionStorage.getItem('blank-chat-push-asked')) return
      sessionStorage.setItem('blank-chat-push-asked', '1')
    } catch {}
    actions.toast({
      text: 'Sent. Want a notification when they answer?',
      long: true,
      action: { label: 'Turn on', run: () => turnOnAccountPush(token, lang).then(() => actions.toast({ text: 'Notifications are on' })).catch(() => {}) },
    })
  }

  const group = chat.kind === 'group'
  const isProject = chat.kind === 'project'
  // After a change in the pinned plan (join, list, session, poke): fetch what's new right away
  const refresh = () =>
    api(token)
      .chat(id, { after: since.current || Date.now() - 5000 })
      .then((r) => {
        merge(r.messages)
        took(r)
      })
      .catch(() => {})
  const last = messages[messages.length - 1]
  // "Seen" goes under your newest message once they've had the chat open since (one-to-one chats)
  const lastMine = !group && [...messages].reverse().find((m) => m.mine && m.kind !== 'system' && !m.removed)
  // One-tap answers: to a friend's check-in (being cheered on is what makes people check in again), or to start a chat
  const replies =
    busy || text.trim() || photo || reply
      ? []
      : !last
        ? [group ? 'Hi everyone!' : 'Hi!', 'What are you working on?']
        : last.kind === 'checkin' && !last.mine && !last.removed
          ? ['Nice work!', 'How did it go?', 'Send a photo!']
          : []
  const names = Object.fromEntries(chat.members.map((u) => [u.username, u.name || `@${u.username}`]))
  const who = (m) => (m.mine ? t('You') : m.from?.name || `@${m.from?.username}`)
  const tray = reply || photo

  return (
    <div className="mx-auto flex max-w-2xl flex-col pt-2 lg:max-w-3xl">
      <div className="flex items-center gap-2">
        <BackButton fallback="/friends" />
        <button
          onClick={() => (group ? setSheet('info') : navigate(`/u/${chat.members[0].username}`))}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-1 pr-2 text-left active:opacity-70"
        >
          <ChatAvatar chat={chat} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-semibold leading-tight">{chatTitle(chat)}</span>
            <span className="block truncate text-[13px] text-sub">
              {group
                ? [chat.hobby && categoryLabel(t, chat.hobby), t('{n} people', { n: chat.members.length + 1 })].filter(Boolean).join(' · ')
                : isProject
                  ? t('with {name}', { name: chat.members[0].name || `@${chat.members[0].username}` })
                  : `@${chat.members[0].username}`}
            </span>
          </span>
        </button>
      </div>

      {/* A friend chat: the projects you're doing together with them, one tap away */}
      {projects.length > 0 && (
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {projects.map((p) => (
            <button key={p.id} onClick={() => navigate(`/chats/${p.id}`)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-mist px-3.5 text-[15px] font-medium active:opacity-70">
              <span aria-hidden="true">{catEmoji(p.category)}</span> {p.name}
            </button>
          ))}
        </div>
      )}
      {/* A message request from someone who isn't your friend: accept, decline or block (or wait, if you sent it) */}
      {chat.request && <RequestBanner chat={chat} onDone={() => setChat((c) => ({ ...c, request: null }))} />}
      {/* A project chat: the plan pinned on top */}
      {isProject && project && (
        <div className="mt-3">
          <ProjectPin chatId={id} info={project} onInfo={refresh} />
        </div>
      )}

      <ul className="mt-3 flex flex-col gap-1.5">
        {messages.length === 0 && (
          <li className="py-10 text-center text-[15px] text-sub">{group ? t('Say hi to your crew, or check in with what you worked on today.') : t('Say hi!')}</li>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const time = !prev || m.created - prev.created > GAP
          const showName = group && !m.mine && m.kind !== 'system' && (time || prev?.from?.username !== m.from?.username || prev?.kind === 'system')
          return (
            <li key={m.id} id={`m-${m.id}`} className="flex flex-col">
              {time && <span className="py-2 text-center text-[12px] font-medium text-sub">{fmt.ago(m.created)}</span>}
              {m.kind === 'progress' || m.kind === 'poke' || m.kind === 'session' ? (
                <TogetherCard m={m} who={who} />
              ) : m.kind === 'system' && togetherLine(t, m, who(m)) ? (
                <span className="py-1 text-center text-[13px] text-sub">{togetherLine(t, m, who(m))}</span>
              ) : m.kind === 'system' ? (
                <span className="py-1 text-center text-[13px] text-sub">
                  {m.text === 'left'
                    ? t('{name} left', { name: who(m) })
                    : t('{name} added {names}', { name: who(m), names: m.text.replace(/^added:/, '').split(',').map((u) => names[u] || `@${u}`).join(', ') })}
                </span>
              ) : (
                <Bubble
                  m={m}
                  group={group}
                  showName={showName}
                  who={who}
                  onOpen={() => !m.removed && setSheet(m.kind === 'share' ? { share: m } : { actions: m })}
                  onReply={() => !m.removed && startReply(m)}
                  onPhoto={() => setViewer(m)}
                />
              )}
              {lastMine?.id === m.id && seen >= m.created && <span className="px-2 pt-0.5 text-right text-[12px] font-medium text-sub">{t('Seen')}</span>}
            </li>
          )
        })}
        {typing.length > 0 && (
          <li className="flex items-center gap-2 px-1 pt-1 text-[13px] text-sub" aria-live="polite">
            <span className="flex gap-0.5 rounded-full bg-mist px-3 py-2.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-sub/70" style={{ animationDelay: `${i * 160}ms` }} />
              ))}
            </span>
            {typing.length === 1 ? t('{name} is typing…', { name: typing[0] }) : t('{n} people are typing…', { n: typing.length })}
          </li>
        )}
        {replies.length > 0 && (
          <li className={`flex flex-wrap gap-2 pt-2 ${last ? `justify-start ${group ? 'pl-9' : ''}` : 'justify-center'}`}>
            {replies.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => send({ text: t(r) })}
                className="h-9 rounded-full border border-spark/40 px-3.5 text-[15px] font-medium text-spark-ink active:bg-mist"
              >
                {t(r)}
              </button>
            ))}
          </li>
        )}
        {/* Room for the composer: scrolling to this keeps the newest message above it */}
        <li ref={end} aria-hidden="true" className={`shrink-0 ${tray ? 'h-[230px]' : 'h-[150px]'}`} />
      </ul>

      {/* The composer sits above the tab bar */}
      <form
        onSubmit={submit}
        // A request you sent: nothing more to write until they accept
        className={`${chat.request === 'sent' ? 'hidden' : ''} bar fixed inset-x-0 bottom-[calc(max(10px,env(safe-area-inset-bottom))+64px)] z-30 mx-auto max-w-2xl rounded-[26px] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12),inset_0_0_0_0.5px_rgb(var(--line)/0.25)] md:bottom-6 lg:max-w-3xl`}
        style={{ left: 12, right: 12 }}
      >
        {tray && (
          <div className="flex items-center gap-3 px-2 pb-1.5 pt-1">
            {photo && <img src={photo.url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />}
            {reply ? (
              <span className="min-w-0 flex-1 border-l-2 border-spark pl-2.5">
                <span className="block truncate text-[13px] font-semibold text-spark-ink">{t('Replying to {name}', { name: who(reply) })}</span>
                <span className="block truncate text-[13px] text-sub">{quoteLine(t, reply)}</span>
              </span>
            ) : (
              <span className="min-w-0 flex-1 text-[15px] text-sub">{t('Add a caption, or just send it.')}</span>
            )}
            <button
              type="button"
              onClick={() => (reply ? setReply(null) : setPhoto(null))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-sub active:opacity-70"
              aria-label={reply ? t('Cancel reply') : t('Remove photo')}
            >
              <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        )}
        {reply && photo && (
          <div className="flex items-center gap-2 px-2 pb-1.5 text-[13px] text-sub">
            <Icon name="image" className="h-4 w-4" /> <span className="flex-1">{t('Photo ready to send')}</span>
            <button type="button" onClick={() => setPhoto(null)} className="font-medium text-spark-ink active:opacity-60">
              {t('Remove')}
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => setSheet('checkin')}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-mist px-3 text-[15px] font-semibold text-spark-ink active:opacity-70"
          >
            <Icon name="check" className="h-4 w-4" strokeWidth={2.8} /> {t('Check in')}
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-spark-ink active:bg-mist"
            aria-label={t('Send a photo')}
          >
            <Icon name="image" className="h-[22px] w-[22px]" />
          </button>
          <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={pick} />
          <textarea
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => {
              active.current = Date.now()
              setText(e.target.value)
              // "typing…" for the others: at most one small request every 3 seconds while you type
              if (e.target.value.trim() && Date.now() - typed.current > 3000) {
                typed.current = Date.now()
                api(token).typing(id).catch(() => {})
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia('(hover: hover)').matches) submit(e)
            }}
            placeholder={photo ? t('Caption') : t('Message')}
            aria-label={photo ? t('Caption') : t('Message')}
            maxLength={2000}
            className="max-h-32 min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2 text-[17px] leading-snug outline-none"
          />
          <button
            disabled={(!text.trim() && !photo) || busy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark text-white transition disabled:opacity-35"
            aria-label={t('Send')}
          >
            {busy ? <Spinner className="h-4 w-4" /> : <Icon name="up" className="h-5 w-5" strokeWidth={2.6} />}
          </button>
        </div>
      </form>

      {sheet?.actions && (
        <MessageSheet
          m={sheet.actions}
          onClose={() => setSheet(null)}
          onReact={(emoji) => react(sheet.actions, emoji)}
          onReply={() => startReply(sheet.actions)}
          onCopy={() => copy(sheet.actions)}
          onUnsend={() => unsend(sheet.actions)}
          onReport={() => setSheet({ report: sheet.actions })}
          onSteps={() => setSheet({ project: sheet.actions })}
        />
      )}
      {sheet?.share?.share?.type === 'plan' && (
        <CheckInProjectSheet
          message={{ ...sheet.share, project: sheet.share.share.title, category: sheet.share.share.category, progress: sheet.share.share }}
          onClose={() => setSheet(null)}
          onReport={() => setSheet({ report: sheet.share })}
        />
      )}
      {sheet?.share?.share?.type === 'post' && <SharedPost id={sheet.share.share.id} onClose={() => setSheet(null)} />}
      {sheet?.project && (
        <CheckInProjectSheet message={sheet.project} onClose={() => setSheet(null)} onReport={() => setSheet({ report: sheet.project })} />
      )}
      {sheet === 'checkin' && <CheckInSheet onClose={() => setSheet(null)} onSend={async (body) => (await send(body)) && setSheet(null)} />}
      {sheet === 'info' && (
        <CrewSheet
          chat={chat}
          onClose={() => setSheet(null)}
          onChanged={(c) => setChat((cur) => ({ ...cur, ...c }))}
          onLeft={() => navigate('/friends', { replace: true })}
        />
      )}
      {sheet?.report && <ReportMessageSheet message={sheet.report} onClose={() => setSheet(null)} />}
      {viewer && <PhotoViewer m={viewer} who={who} onClose={() => setViewer(null)} onReply={() => (setViewer(null), startReply(viewer))} />}
    </div>
  )
}

// A short line about a message, for a reply's quote
function quoteLine(t, m) {
  if (m.removed) return t('Message removed')
  if (m.kind === 'checkin') return t('Checked in: {project}', { project: m.project || '' })
  if (m.kind === 'progress') return t('Step {n} done', { n: m.info?.done || '' })
  if (m.kind === 'share') return m.share?.type === 'plan' ? t('Plan: {title}', { title: m.project }) : t('Post: {title}', { title: m.project })
  if (m.photo && !m.text) return t('Photo')
  return m.text || m.project || ''
}

// One message: tap for reactions, reply and the rest; swipe it to the right to reply (like WhatsApp and iMessage)
function Bubble({ m, group, showName, who, onOpen, onReply, onPhoto }) {
  const { t } = useT()
  const [dx, setDx] = useState(0)
  const touch = useRef(null)
  const onTouchStart = (e) => {
    const p = e.touches[0]
    touch.current = { x: p.clientX, y: p.clientY, swiping: false }
  }
  const onTouchMove = (e) => {
    const s = touch.current
    if (!s) return
    const p = e.touches[0]
    const x = p.clientX - s.x
    const y = p.clientY - s.y
    if (!s.swiping && Math.abs(y) > 10 && Math.abs(y) > Math.abs(x)) return (touch.current = null) // scrolling
    if (x > 8) {
      s.swiping = true
      setDx(Math.min(72, x * 0.6))
    }
  }
  const onTouchEnd = () => {
    if (dx >= 50) onReply()
    touch.current = null
    setDx(0)
  }
  const removedText = m.unsent ? (m.mine ? t('You unsent a message') : t('{name} unsent a message', { name: who(m) })) : t('Message removed')
  const q = m.reply
  return (
    <div
      className={`relative flex items-end gap-2 ${m.mine ? 'justify-end' : ''}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {dx > 0 && (
        <span className="absolute left-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-mist text-sub" style={{ opacity: Math.min(1, dx / 50) }}>
          <Icon name="reply" className="h-4 w-4" strokeWidth={2.4} />
        </span>
      )}
      {group && !m.mine && (
        <Link to={`/u/${m.from?.username}`} className="mb-0.5 shrink-0" aria-label={who(m)}>
          <Avatar user={m.from || {}} size={28} />
        </Link>
      )}
      <div className={`flex max-w-[78%] flex-col ${m.mine ? 'items-end' : 'items-start'}`} style={{ transform: dx ? `translateX(${dx}px)` : undefined, transition: dx ? 'none' : 'transform 180ms ease-out' }}>
        {showName && <span className="mb-0.5 block px-3 text-[12px] font-medium text-sub">{who(m)}</span>}
        {q && !m.removed && (
          <button
            type="button"
            onClick={() => document.getElementById(`m-${q.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}
            className={`mb-0.5 max-w-full rounded-2xl border-l-2 border-spark/60 bg-ink/[0.04] px-3 py-1.5 text-left active:opacity-70`}
          >
            <span className="block truncate text-[12px] font-semibold text-sub">{q.mine ? t('You') : q.name}</span>
            <span className="block truncate text-[14px] text-sub">{q.removed ? t('Message removed') : q.photo && !q.text ? t('Photo') : q.text}</span>
          </button>
        )}
        <button type="button" onClick={onOpen} className="max-w-full text-left">
          {m.removed ? (
            <span className="block rounded-[18px] border border-line/30 px-3.5 py-2 text-[15px] italic text-sub">{removedText}</span>
          ) : m.kind === 'checkin' ? (
            <CheckIn m={m} />
          ) : m.kind === 'share' ? (
            <ShareCard m={m} />
          ) : (
            <>
              {m.photo && <ChatPhoto m={m} onOpen={onPhoto} />}
              {m.text && (
                <span
                  className={`${m.photo ? 'mt-0.5' : ''} block whitespace-pre-wrap break-words rounded-[18px] px-3.5 py-2 text-[17px] leading-snug ${m.mine ? 'bg-spark text-white' : 'bg-mist'}`}
                >
                  {m.text}
                </span>
              )}
            </>
          )}
        </button>
        {m.reactions?.length > 0 && !m.removed && (
          <button
            type="button"
            onClick={onOpen}
            className="relative z-[1] -mt-1.5 flex items-center gap-1 rounded-full bg-card px-2 py-0.5 text-[14px] shadow-soft ring-1 ring-line/20"
            aria-label={m.reactions.map((r) => `${r.emoji} ${r.n}`).join(', ')}
          >
            {m.reactions.map((r) => (
              <span key={r.emoji} className="flex items-center gap-0.5">
                {r.emoji}
                {r.n > 1 && <span className="text-[12px] font-semibold tabular-nums text-sub">{r.n}</span>}
              </span>
            ))}
          </button>
        )}
      </div>
    </div>
  )
}

// A photo in a chat, loaded with your token; the box keeps its shape while it loads
function ChatPhoto({ m, onOpen }) {
  const { account } = useAccount()
  const url = useAuthImage(`/social/messages/${m.id}/photo`, account?.token)
  const ratio = Math.min(1.5, Math.max(0.6, m.ratio || 1))
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className="block w-[min(260px,62vw)] overflow-hidden rounded-[18px] bg-mist"
      style={{ aspectRatio: `${1 / ratio}` }}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center"><Spinner className="h-5 w-5 text-sub" /></span>}
    </span>
  )
}

function PhotoViewer({ m, who, onClose, onReply }) {
  const { t } = useT()
  const { account } = useAccount()
  const url = useAuthImage(`/social/messages/${m.id}/photo`, account?.token)
  useEffect(() => {
    const key = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black text-white" role="dialog" aria-label={t('Photo')}>
      <div className="flex items-center gap-2 px-3 pt-[max(10px,env(safe-area-inset-top))]">
        <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full active:bg-white/10" aria-label={t('Close')}>
          <Icon name="x" className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{who(m)}</span>
        {!m.removed && (
          <button onClick={onReply} className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold active:bg-white/10">
            <Icon name="reply" className="h-5 w-5" /> {t('Reply')}
          </button>
        )}
      </div>
      <button onClick={onClose} className="flex min-h-0 flex-1 items-center justify-center p-3" aria-label={t('Close')}>
        {url ? <img src={url} alt="" className="max-h-full max-w-full object-contain" /> : <Spinner className="h-6 w-6" />}
      </button>
      {m.text && <p className="px-5 pb-[max(16px,env(safe-area-inset-bottom))] text-center text-[17px] leading-snug">{m.text}</p>}
    </div>
  )
}

// Tap a message: react, reply, copy, unsend yours, report theirs (and a check-in's steps)
function MessageSheet({ m, onClose, onReact, onReply, onCopy, onUnsend, onReport, onSteps }) {
  const { t } = useT()
  const mineNow = m.reactions?.find((r) => r.me)?.emoji
  const row = 'row min-h-[52px] w-full text-left text-[17px] active:bg-mist'
  return (
    <Sheet onClose={onClose} label={t('Message')}>
      <div className="px-5 pb-3 pt-2">
        <div className="surface flex justify-between px-2 py-2" role="group" aria-label={t('React')}>
          {REACTIONS.map((e) => (
            <button
              key={e}
              onClick={() => onReact(e)}
              aria-pressed={mineNow === e}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-[26px] transition active:scale-90 ${mineNow === e ? 'bg-spark/15 ring-2 ring-spark/50' : 'active:bg-mist'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="surface mt-3 divide-y divide-line/15 overflow-hidden">
          <button onClick={onReply} className={row}>
            <Icon name="reply" className="h-5 w-5 text-sub" /> <span className="flex-1">{t('Reply')}</span>
          </button>
          {m.progress?.steps?.length > 0 && (
            <button onClick={onSteps} className={row}>
              <Icon name="list" className="h-5 w-5 text-sub" /> <span className="flex-1">{m.mine ? t('See steps') : t('See steps · start it too')}</span>
            </button>
          )}
          {m.text && (
            <button onClick={onCopy} className={row}>
              <Icon name="copy" className="h-5 w-5 text-sub" /> <span className="flex-1">{t('Copy')}</span>
            </button>
          )}
          {m.mine ? (
            <button onClick={onUnsend} className={`${row} text-bad`}>
              <Icon name="trash" className="h-5 w-5" /> <span className="flex-1">{t('Unsend')}</span>
            </button>
          ) : (
            <button onClick={onReport} className={`${row} text-bad`}>
              <Icon name="warning" className="h-5 w-5" /> <span className="flex-1">{t('Report message')}</span>
            </button>
          )}
        </div>
      </div>
    </Sheet>
  )
}

// A post or a plan sent into the chat ("Send to a friend"): tap to open it
function ShareCard({ m }) {
  const { t } = useT()
  const sh = m.share || {}
  const plan = sh.type === 'plan'
  const color = cat(sh.category || 'other').color
  return (
    <span className={`block w-[min(260px,66vw)] overflow-hidden rounded-[18px] ${m.mine ? 'bg-spark text-white' : 'bg-mist'}`}>
      <span className="flex items-center gap-2.5 px-3.5 pt-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: plan ? color : 'rgb(var(--accent))' }}>
          <Icon name={plan ? 'list' : 'camera'} className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span className="min-w-0">
          <span className={`block text-[12px] font-semibold uppercase tracking-[0.04em] ${m.mine ? 'text-white/80' : 'text-sub'}`}>
            {plan ? t('Plan · {n} steps', { n: sh.total || sh.steps?.length || 0 }) : sh.username ? t('Post by @{name}', { name: sh.username }) : t('Post')}
          </span>
          <span className="block truncate text-[17px] font-semibold leading-tight">{sh.title || m.project}</span>
        </span>
      </span>
      {m.text && <span className="block whitespace-pre-wrap break-words px-3.5 pt-1.5 text-[17px] leading-snug">{m.text}</span>}
      <span className={`block px-3.5 pb-2.5 pt-1.5 text-[13px] font-semibold ${m.mine ? 'text-white/80' : 'text-spark-ink'}`}>
        {plan ? (m.mine ? t('See steps') : t('See steps · start it too')) : t('Open post')}
      </span>
    </span>
  )
}

// A post sent into the chat, opened: loaded fresh, so it's gone if it was deleted or you may not see it
function SharedPost({ id, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const [post, setPost] = useState(null)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    api(account?.token)
      .getPost(id)
      .then((r) => setPost(r.post))
      .catch(() => setGone(true))
  }, [id, account?.token])
  if (post) return <PostIdeaSheet post={post} onClose={onClose} />
  return (
    <Sheet onClose={onClose} label={t('Post')}>
      <SheetHeader title={t('Post')} onClose={onClose} />
      <div className="flex justify-center px-5 pb-8 pt-4 text-[15px] text-sub">{gone ? t('This post isn’t available anymore.') : <Spinner className="h-6 w-6" />}</div>
    </Sheet>
  )
}

// "I worked on <project> today", in the project's hobby colour
function CheckIn({ m }) {
  const { t } = useT()
  const p = m.progress?.total ? m.progress : null
  const color = cat(m.category).color
  return (
    <span className={`block overflow-hidden rounded-[18px] ${m.mine ? 'bg-spark text-white' : 'bg-mist'}`}>
      <span className="flex items-center gap-2.5 px-3.5 pt-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ background: color }}>
          <Icon name="check" className="h-4 w-4" strokeWidth={3} />
        </span>
        <span className="min-w-0">
          <span className={`block text-[12px] font-semibold uppercase tracking-[0.04em] ${m.mine ? 'text-white/80' : 'text-sub'}`}>{t('Checked in')}</span>
          <span className="block truncate text-[17px] font-semibold leading-tight">{m.project}</span>
        </span>
      </span>
      {p && (
        <span className="block px-3.5 pt-2">
          <span className="flex items-center gap-2">
            <span className={`block h-1.5 flex-1 overflow-hidden rounded-full ${m.mine ? 'bg-white/30' : 'bg-ink/10'}`} role="progressbar" aria-valuenow={p.done} aria-valuemin={0} aria-valuemax={p.total}>
              <span className={`block h-full rounded-full ${m.mine ? 'bg-white' : 'bg-spark'}`} style={{ width: `${Math.round((p.done / p.total) * 100)}%` }} />
            </span>
            <span className={`text-[13px] font-semibold tabular-nums ${m.mine ? 'text-white/80' : 'text-sub'}`}>
              {p.done}/{p.total}
            </span>
          </span>
          {p.last && <span className={`mt-1 block text-[15px] leading-snug ${m.mine ? 'text-white/85' : 'text-sub'}`}>{t('Done: {step}', { step: p.last })}</span>}
        </span>
      )}
      {(m.text || !p?.last) && <span className="block whitespace-pre-wrap break-words px-3.5 pt-1.5 text-[17px] leading-snug">{m.text || t('Worked on it today.')}</span>}
      {p && <span className={`block px-3.5 pb-2.5 pt-1.5 text-[13px] font-semibold ${m.mine ? 'text-white/80' : 'text-spark-ink'}`}>{m.mine ? t('See steps') : t('See steps · start it too')}</span>}
      {!p && <span className="block pb-2.5" />}
    </span>
  )
}

// A friend's check-in, opened: their steps (ticked or not) and "Start this too", in your language (plan.js)
function CheckInProjectSheet({ message, onClose, onReport }) {
  const { t, lang } = useT()
  const { data, actions } = useStore()
  const navigate = useNavigate()
  const p = message.progress
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const name = message.from?.name || message.from?.username || ''
  const mine = message.mine && data.projects.find((x) => x.title === message.project)
  const started = !message.mine && data.projects.find((x) => x.from?.message === message.id)
  const start = async () => {
    if (busy) return
    if (started) return navigate(`/project/${started.id}`)
    setBusy(true)
    setError(null)
    try {
      const { outOfAI, starterOnly, ai, ...plan } = await planFromSomeone({
        title: message.project,
        category: message.category || 'other',
        steps: p.steps.map((s) => s.text),
        stepsLang: p.lang,
        guideKey: p.guide,
        lang,
        level: data.me.prefs?.level,
      })
      const id = actions.addProject({ ...plan, from: { name, message: message.id } })
      actions.toast({ text: 'You started it. Check in when you’ve done a step!' })
      navigate(`/project/${id}`)
    } catch {
      setBusy(false)
      setError(t('Something went wrong. Try again.'))
    }
  }
  return (
    <Sheet onClose={onClose} label={message.project}>
      <SheetHeader title={message.project} onClose={onClose} />
      <div className="px-5 pb-3">
        <p className="px-1 text-[15px] text-sub">
          {message.mine ? t('What your friends see') : message.kind === 'share' ? t('{name} sent you this plan', { name }) : t('{name} is doing this', { name })} · {categoryLabel(t, message.category || 'other')} · {p.done}/{p.total}
        </p>
        <ol className="surface mt-3 divide-y divide-line/15 overflow-hidden">
          {p.steps.map((s, i) => (
            <li key={i} className="row min-h-[44px] gap-3 py-2 text-[15px] leading-snug">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold tabular-nums ${s.done ? 'bg-spark text-white' : 'bg-mist text-sub'}`}
              >
                {s.done ? <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className={`flex-1 ${s.done ? 'text-sub' : ''}`}>{s.text}</span>
            </li>
          ))}
        </ol>
        {error && (
          <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        {message.mine ? (
          mine && (
            <button onClick={() => navigate(`/project/${mine.id}`)} className="btn-tinted btn-lg mt-4 w-full">
              {t('Open your project')}
            </button>
          )
        ) : (
          <>
            <button onClick={start} disabled={busy} className="btn-primary btn-lg mt-4 w-full">
              {busy ? (
                <>
                  <Spinner className="h-5 w-5" /> {t('Making your plan…')}
                </>
              ) : started ? (
                t('Open your project')
              ) : (
                t('Start this too')
              )}
            </button>
            <button onClick={onReport} className="mt-2 h-11 w-full text-[15px] text-sub active:opacity-60">
              {t('Report message')}
            </button>
          </>
        )}
      </div>
    </Sheet>
  )
}

// Pick one of your projects and say what you did
function CheckInSheet({ onClose, onSend }) {
  const { t, lang } = useT()
  const { active, done } = useStore()
  const projects = [...active, ...done.slice(0, 3)]
  const [pid, setPid] = useState(active[0]?.id || projects[0]?.id || '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const project = projects.find((p) => p.id === pid)
  const submit = async (e) => {
    e.preventDefault()
    if (!project || busy) return
    setBusy(true)
    // The steps go along, so friends see how far you are and can start it too
    const steps = project.milestones.filter((m) => !m.auto && m.text.trim())
    const last = steps.filter((m) => m.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))[0]
    await onSend({
      kind: 'checkin',
      project: project.title,
      category: project.category,
      text: note.trim(),
      steps: steps.slice(0, 30).map((m) => ({ text: m.text.trim().slice(0, 200), done: !!m.done })),
      last: last?.text.trim().slice(0, 200) || '',
      lang: guessLang(steps.map((m) => m.text)) || lang,
      guide: project.guideKey || null,
    })
    setBusy(false)
  }
  return (
    <Sheet onClose={onClose} label={t('Check in')}>
      <SheetHeader title={t('Check in')} onClose={onClose} />
      <form onSubmit={submit} className="px-5 pb-3">
        <p className="px-1 pb-3 text-[15px] text-sub">{t('Tell your friends what you worked on. It keeps you all going.')}</p>
        {projects.length === 0 ? (
          <p className="py-6 text-center text-[17px] text-sub">{t('Start a project first, then you can check in on it.')}</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPid(p.id)}
                  aria-pressed={pid === p.id}
                  className={`flex min-h-[52px] items-center gap-3 rounded-[16px] px-4 text-left text-[17px] ${pid === p.id ? 'bg-ink text-card' : 'bg-mist'}`}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cat(p.category).color }} />
                  <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                </button>
              ))}
            </div>
            <textarea
              className="input mt-4 min-h-[80px] resize-none"
              placeholder={t('What did you do? (optional)')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              aria-label={t('What did you do?')}
            />
            <button className="btn-primary btn-lg mt-4 w-full" disabled={!project || busy}>
              {busy ? <Spinner /> : t('Check in')}
            </button>
          </>
        )}
      </form>
    </Sheet>
  )
}

// A hobby crew: who's in it, its name, add friends, leave
function CrewSheet({ chat, onClose, onChanged, onLeft }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [name, setName] = useState(chat.name)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const a = api(account.token)

  const rename = async () => {
    const n = name.trim()
    if (!n || n === chat.name) return
    try {
      await a.renameChat(chat.id, { name: n })
      onChanged({ name: n })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
      setName(chat.name)
    }
  }
  const leave = async () => {
    if (!window.confirm(t('Leave {name}?', { name: chat.name }))) return
    setBusy(true)
    try {
      await a.leaveChat(chat.id)
      onLeft()
    } catch (e) {
      actions.toast({ text: errorText(t, e) })
      setBusy(false)
    }
  }

  if (adding)
    return (
      <NewChatSheet
        chatId={chat.id}
        already={chat.members.map((u) => u.username)}
        onClose={async (added) => {
          setAdding(false)
          if (added) {
            const r = await a.chat(chat.id).catch(() => null)
            if (r) onChanged(r.chat)
          }
        }}
      />
    )

  return (
    <Sheet onClose={onClose} label={chat.name}>
      <SheetHeader title={t('Hobby crew')} onClose={onClose} />
      <div className="px-5 pb-3">
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} onBlur={rename} maxLength={40} aria-label={t('Crew name')} />
        <h3 className="section-label mt-5">{t('{n} people', { n: chat.members.length + 1 })}</h3>
        <ul className="surface divide-y divide-line/15 overflow-hidden">
          <li className="row min-h-[52px]">
            <Avatar user={{ username: account.username }} size={32} />
            <span className="flex-1 text-[17px]">{t('You')}</span>
          </li>
          {chat.members.map((u) => (
            <li key={u.username}>
              <Link to={`/u/${u.username}`} className="row min-h-[52px] active:bg-mist">
                <Avatar user={u} size={32} />
                <span className="min-w-0 flex-1 truncate text-[17px]">{u.name || `@${u.username}`}</span>
              </Link>
            </li>
          ))}
        </ul>
        <button onClick={() => setAdding(true)} className="btn-tinted btn-lg mt-4 w-full">
          <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} /> {t('Add friends')}
        </button>
        <button onClick={leave} disabled={busy} className="mt-2 h-12 w-full rounded-full text-[17px] text-bad active:opacity-60">
          {t('Leave the crew')}
        </button>
      </div>
    </Sheet>
  )
}

function ReportMessageSheet({ message, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [busy, setBusy] = useState(false)
  const report = async (reason) => {
    setBusy(true)
    try {
      await api(account.token).reportMessage(message.id, reason)
      actions.toast({ text: 'Thanks. We’ll check it.' })
      onClose()
    } catch (e) {
      actions.toast({ text: errorText(t, e) })
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Report message')}>
      <SheetHeader title={t('Report message')} onClose={onClose} />
      <div className="px-5 pb-3">
        <p className="rounded-[16px] bg-mist px-4 py-3 text-[15px] text-sub">{message.text || message.project}</p>
        <ul className="surface mt-4 divide-y divide-line/15 overflow-hidden">
          {Object.entries(REASON_LABEL).filter(([k]) => k !== 'notmine').map(([k, v]) => (
            <li key={k}>
              <button disabled={busy} onClick={() => report(k)} className="row min-h-[52px] w-full text-left text-[17px] active:bg-mist">
                {t(v)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Sheet>
  )
}
