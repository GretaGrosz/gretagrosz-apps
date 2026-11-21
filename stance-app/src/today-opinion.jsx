// One argument on a question: the card (Good point, replies, "Convinced me", challenge, share) and its reply thread.
import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, appLink, useLoad } from './api.js'
import { t, timeAgo, relDay } from './i18n.js'
import { shareSwitch } from './share.js'
import { Actions, Avatar, Button, Byline, Card, Confirm, Empty, Icon, LoadError, Page, SectionTitle, Sheet, SideTag, Spinner, spring, useApp } from './ui.jsx'

export { Actions, Confirm }

/** Text that clamps to a few lines with a "More" link when it is long */
export function Clamp({ text, lines = 8, className = '' }) {
  const ref = useRef(null)
  const [open, setOpen] = useState(false)
  const [over, setOver] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el && !open) setOver(el.scrollHeight > el.clientHeight + 2)
  }, [text, open, lines])
  return (
    <div>
      <p ref={ref} className={`prose-wrap whitespace-pre-wrap ${className}`}
        style={open ? undefined : { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {text}
      </p>
      {over && !open && (
        <button type="button" onClick={() => setOpen(true)} className="-ml-1 -my-1 h-11 px-1 text-[15px] font-semibold text-accent-ink">{t('ui.moreText')}</button>
      )}
    </div>
  )
}

/** One small action under an argument: icon + count, 44px tall */
function Action({ label, on = false, onClick, disabled, children }) {
  return (
    <motion.button type="button" aria-label={label} title={label} whileTap={disabled ? undefined : { scale: 0.9 }} onClick={onClick} disabled={disabled}
      className={`-ml-2 flex h-11 min-w-[44px] items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[14px] font-semibold tabular-nums transition-colors ${on ? 'text-accent-ink' : 'text-fg2'} ${disabled ? '' : 'active:bg-fill'}`}>
      {children}
    </motion.button>
  )
}

/**
 * An argument. `question` gives the side labels ({ id, title, question, sides }).
 * mySide: the viewer's side on this question (null if not answered); "Convinced me" and Challenge need the other side.
 * myText: the viewer's own argument (the opening if they challenge). onChange(opinion) after a Good point;
 * onConvinced(questionPayload) after switching. compact: for profiles. full: no clamping (the thread page).
 */
export function OpinionCard({ opinion, question, onChange, compact = false, mySide = null, myText = '', onConvinced, onReply, onMenu, full = false, highlight = false }) {
  const { me, openOpinion, openQuestion, openProfile, openNewDebate, toast, bump } = useApp()
  const [op, setOp] = useState(opinion)
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [more, setMore] = useState(false)
  const [switched, setSwitched] = useState(null)
  useEffect(() => setOp(opinion), [opinion])
  const sides = question?.sides || ['', '']
  const other = !op.mine && mySide !== null && mySide !== undefined && mySide !== op.side
  const deleted = op.user.handle === 'deleted'

  const point = async () => {
    const before = op
    const next = { ...op, pointed: !op.pointed, points: op.points + (op.pointed ? -1 : 1) }
    setOp(next)
    navigator.vibrate?.(8)
    try {
      const r = await api(`/opinions/${op.id}/point`, { method: 'POST' })
      const fresh = { ...next, ...r }
      setOp(fresh)
      onChange?.(fresh)
    } catch (e) { setOp(before); toast(e.message, 'error') }
  }

  const convince = async () => {
    setBusy(true)
    try {
      const payload = await api(`/opinions/${op.id}/convinced`, { method: 'POST' })
      setAsking(false)
      navigator.vibrate?.([10, 40, 10])
      setSwitched({ payload, side: op.side })
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const afterSwitch = () => {
    const p = switched?.payload
    setSwitched(null)
    if (p) onConvinced ? onConvinced(p) : bump()
  }

  const share = async () => {
    const url = appLink(`q/${op.questionId}/${op.id}`)
    try {
      if (navigator.share) await navigator.share({ title: question?.question, text: `“${op.text.slice(0, 120)}${op.text.length > 120 ? '…' : ''}” @${op.user.handle}`, url })
      else { await navigator.clipboard.writeText(url); toast(t('ui.linkCopied')) }
    } catch (e) { if (e?.name !== 'AbortError') toast(url) }
  }
  const challenge = () => openNewDebate({ opponent: op.user, questionId: op.questionId, question, opening: myText, mySide })
  const replies = () => (onReply ? onReply() : openOpinion(op.id))

  return (
    <Card as="article" data-op={op.id} className="px-5 pb-1.5 pt-4">
      <motion.span aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-accent"
        initial={false} animate={{ opacity: highlight ? 1 : 0 }} transition={{ duration: highlight ? 0.25 : 1.2 }} />
      {compact && question && (
        <button type="button" onClick={() => openQuestion(question.id, op.id)} className="mb-3 block w-full border-b border-line pb-3 text-left">
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{question.title}</div>
          <div className="serif prose-wrap mt-1 line-clamp-2 text-[17px] leading-[1.3] text-fg">{question.question}</div>
        </button>
      )}

      <header className="flex items-center gap-3">
        {!compact && <Avatar user={op.user} size={38} onClick={deleted ? undefined : () => openProfile(op.user.handle)} />}
        <div className="min-w-0 flex-1">
          {compact
            ? <SideTag side={op.side} label={sides[op.side]} />
            : <>
              <Byline user={op.user} time={op.created} />
              <SideTag side={op.side} label={sides[op.side]} className="mt-0.5" />
            </>}
        </div>
        {compact && <span className="text-[13px] text-fg2">{relDay(op.created)}</span>}
        {(onMenu || (!op.mine && !compact)) && (
          <button type="button" aria-label={t('ui.options')} onClick={onMenu || (() => setMore(true))} className="-mr-3 grid h-11 w-11 shrink-0 place-items-center self-start rounded-full text-fg2 active:bg-fill">
            <Icon.More size={20} />
          </button>
        )}
      </header>

      <div className="mt-3">
        {full
          ? <p className="prose-wrap whitespace-pre-wrap text-[17px] leading-[1.5]">{op.text}</p>
          : <Clamp text={op.text} lines={compact ? 5 : 8} className="text-[16.5px] leading-[1.5]" />}
      </div>

      {(op.convincedBy || op.convinced > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {op.convincedBy && (
            <button type="button" onClick={() => openOpinion(op.convincedBy.opinionId)}
              className="relative inline-flex h-8 max-w-full items-center gap-1.5 rounded-full bg-fill px-3 text-[13.5px] text-fg after:absolute after:-inset-y-1.5 after:inset-x-0 active:bg-fill2">
              <Icon.Convinced size={14} />
              <span className="truncate">{t('op.convincedBy')} <span className="font-semibold">@{op.convincedBy.handle}</span></span>
            </button>
          )}
          {op.convinced > 0 && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent/[0.12] px-3 text-[13.5px] font-semibold text-accent-ink">
              <Icon.Convinced size={14} />{t('op.changedMinds', { n: op.convinced })}
            </span>
          )}
        </div>
      )}

      <div className="mt-1 flex items-center gap-1">
        {op.mine ? (
          <span className="-ml-2 flex h-11 min-w-[44px] items-center gap-1.5 px-2.5 text-[14px] font-semibold tabular-nums text-fg2" title={t('op.points', { n: op.points })}>
            <Icon.Point size={19} />{op.points > 0 && op.points}
          </span>
        ) : (
          <Action label={op.pointed ? t('op.pointMarked') : t('op.point')} on={op.pointed} onClick={point}>
            <motion.span key={String(op.pointed)} initial={{ scale: op.pointed ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12, stiffness: 400 }}>
              {op.pointed ? <Icon.PointFill size={19} /> : <Icon.Point size={19} />}
            </motion.span>
            {op.points > 0 && op.points}
          </Action>
        )}
        <Action label={op.replies ? t('op.replies', { n: op.replies }) : t('op.reply')} onClick={replies}>
          <Icon.Reply size={19} />{op.replies > 0 && op.replies}
        </Action>
        <div className="flex-1" />
        {other && (
          <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setAsking(true)}
            className="-mr-1.5 flex h-11 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14.5px] font-semibold text-accent-ink active:bg-fill">
            <Icon.Convinced size={17} />{t('op.convincedMe')}
          </motion.button>
        )}
      </div>

      <Actions open={more} onClose={() => setMore(false)} items={[
        other && me && !deleted && { label: t('op.challenge', { name: op.user.name.split(' ')[0] }), icon: <Icon.Swords size={20} />, onClick: challenge },
        { label: t('ui.share'), icon: <Icon.Share size={20} />, onClick: share },
      ]} />

      <Confirm open={asking} onClose={() => setAsking(false)} title={t('op.changedQ')} action={t('op.switchTo', { side: sides[op.side] })} busy={busy} onConfirm={convince}>
        <span className="serif prose-wrap mx-auto block max-w-[420px] rounded-[16px] bg-fill px-4 py-3 text-left text-[16px] leading-[1.4] text-fg" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>“{op.text}”</span>
      </Confirm>

      <SwitchedSheet open={!!switched} onClose={afterSwitch} question={question} side={switched?.side} by={{ name: op.user.name, handle: op.user.handle, text: op.text }} />
    </Card>
  )
}

/** Right after "Convinced me": the moment, and a card to share it */
export function SwitchedSheet({ open, onClose, question, side, by }) {
  const { me, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const share = async () => {
    setBusy(true)
    try { await shareSwitch({ question, side, by, me }) } catch (e) { if (e?.name !== 'AbortError') toast(e.message || t('err.generic'), 'error') }
    setBusy(false)
  }
  return (
    <Sheet open={open} onClose={onClose} label={t('op.switchedTitle')}>
      <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
        <motion.div initial={{ scale: 0.5, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.05 }}
          className="grid h-16 w-16 place-items-center rounded-full bg-accent text-white"><Icon.Convinced size={30} /></motion.div>
        <h2 className="mt-4 text-[26px] font-bold leading-tight">{t('op.switchedTitle')}</h2>
        {question && side != null && <p className="mt-1 text-[16px] text-fg2">{t('op.nowOn', { side: question.sides[side] })}</p>}
        {by && <p className="mt-1 text-[15px] text-fg2">{t('op.creditTo', { handle: by.handle })}</p>}
        <Button size="lg" className="mt-6 w-full" disabled={busy} onClick={share}>{busy ? <Spinner /> : <><Icon.Share size={19} />{t('op.shareSwitch')}</>}</Button>
        <Button kind="plain" className="mt-1 w-full !text-fg" onClick={onClose}>{t('ui.done')}</Button>
      </div>
    </Sheet>
  )
}

/** An argument with its reply thread and a composer at the bottom */
export function OpinionPage({ id, onBack, covered }) {
  const { toast, openQuestion, refresh, replaceTop } = useApp()
  const thread = useLoad(`opinion.${id}`, `/opinions/${id}/replies`, [refresh])
  const qid = thread.data?.opinion?.questionId
  const qp = useLoad(qid ? `q.${qid}` : null, `/questions/${qid}`, [refresh])
  const [del, setDel] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const composer = useRef(null)
  const end = useRef(null)

  // Not answered yet: the question is where you start, so go there instead of a dead end
  useEffect(() => {
    if (thread.data?.locked) replaceTop({ type: 'question', id: thread.data.questionId, opinionId: id })
  }, [thread.data])

  const data = thread.data?.locked ? null : thread.data
  const removeReply = async () => {
    setDeleting(true)
    try {
      await api(`/replies/${del.id}`, { method: 'DELETE' })
      thread.setData(d => ({ ...d, replies: d.replies.filter(r => r.id !== del.id), opinion: { ...d.opinion, replies: Math.max(0, d.opinion.replies - 1) } }))
      setDel(null)
    } catch (e) { toast(e.message, 'error') }
    setDeleting(false)
  }
  const added = reply => {
    thread.setData(d => ({ ...d, replies: [...d.replies, reply], opinion: { ...d.opinion, replies: d.opinion.replies + 1 } }))
    setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 60)
  }

  const question = qp.data?.question
  const mine = qp.data?.mine

  return (
    <Page covered={covered} onBack={onBack} title={t('op.argument')}>
      {thread.error && !data ? (
        thread.error.status === 404 ? <Empty icon={<Icon.Quote size={28} />} title={thread.error.message} /> : <LoadError error={thread.error} onRetry={thread.reload} />
      ) : !data || !question ? (
        <div className="grid h-[60dvh] place-items-center text-fg2"><Spinner size={26} /></div>
      ) : (
        <div className="flex min-h-[calc(100dvh-env(safe-area-inset-top)-112px)] flex-col">
          <div className="px-4 pt-2">
            <button type="button" onClick={() => openQuestion(question.id)} className="flex w-full items-center gap-3 px-1 pb-4 text-left">
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{t('today.no', { n: question.number })} · {question.title}</div>
                <div className="serif prose-wrap mt-1 line-clamp-2 text-[19px] leading-[1.25]">{question.question}</div>
              </div>
              <Icon.Chevron size={16} className="shrink-0 text-fg2" />
            </button>
            <OpinionCard full opinion={data.opinion} question={question} mySide={mine ? mine.side : null} myText={mine?.text}
              onChange={o => thread.setData(d => ({ ...d, opinion: o }))}
              onConvinced={() => { thread.reload(); qp.reload() }}
              onReply={() => composer.current?.focus()} />
          </div>

          <SectionTitle>{data.replies.length ? t('op.replies', { n: data.replies.length }) : t('op.repliesTitle')}</SectionTitle>
          <div className="flex flex-col gap-2.5 px-4">
            <AnimatePresence initial={false}>
              {data.replies.map(r => (
                <motion.div key={r.id} layout="position" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring}>
                  <Reply reply={r} sides={question.sides} onDelete={() => setDel(r)} />
                </motion.div>
              ))}
            </AnimatePresence>
            {!data.replies.length && <p className="px-6 py-6 text-center text-[15px] text-fg2">{t('op.noReplies')}</p>}
            <div ref={end} className="scroll-mb-28" />
          </div>

          <div className="flex-1" />
          <ReplyComposer ref={composer} opinion={data.opinion} onAdded={added} />
        </div>
      )}

      <Confirm open={!!del} onClose={() => setDel(null)} title={t('op.deleteReplyQ')} action={t('op.deleteReply')} danger busy={deleting} onConfirm={removeReply} />
    </Page>
  )
}

function Reply({ reply: r, sides, onDelete }) {
  const { openProfile } = useApp()
  return (
    <Card className="!rounded-[20px] px-4 pb-3.5 pt-2.5">
      <div className="flex items-center gap-2.5">
        <Avatar user={r.user} size={30} onClick={() => openProfile(r.user.handle)} />
        <button type="button" onClick={() => openProfile(r.user.handle)} className="h-9 min-w-0 truncate text-[15px] font-semibold">{r.user.name}</button>
        {r.side !== null && <SideTag side={r.side} label={sides[r.side]} className="min-w-0 shrink" />}
        <span className="shrink-0 text-[13px] text-fg2">{timeAgo(r.created)}</span>
        <span className="flex-1" />
        {r.mine && (
          <button type="button" aria-label={t('op.deleteReply')} onClick={onDelete} className="-mr-2.5 grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg2 active:bg-fill">
            <Icon.Trash size={18} />
          </button>
        )}
      </div>
      <p className="prose-wrap mt-0.5 whitespace-pre-wrap pl-[40px] text-[16px] leading-[1.45]">{r.text}</p>
    </Card>
  )
}

const MAX_REPLY = 800

/** Glass bar at the bottom of the thread: a growing text box and a send button */
const ReplyComposer = forwardRef(function ReplyComposer({ opinion, onAdded }, ref) {
  const { toast } = useApp()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const box = useRef(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 168) + 'px'
  }, [text])
  useEffect(() => { if (ref) ref.current = box.current })
  const ok = text.trim().length >= 2 && !busy
  const send = async () => {
    if (!ok) return
    setBusy(true)
    try {
      const { reply } = await api(`/opinions/${opinion.id}/replies`, { method: 'POST', body: { text: text.trim() } })
      setText('')
      onAdded(reply)
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const left = MAX_REPLY - text.length
  return (
    <div className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 mt-6 px-3">
      <div className="glass flex items-end gap-2 rounded-[24px] py-1.5 pl-4 pr-1.5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.3)]">
        <textarea ref={box} rows={1} value={text} onChange={e => setText(e.target.value.slice(0, MAX_REPLY))}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }} aria-label={t('op.replyLabel')}
          placeholder={opinion.mine ? t('op.addToYours') : t('op.replyTo', { name: opinion.user.name.split(' ')[0] })}
          className="prose-wrap block max-h-[168px] min-h-[44px] flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[1.4] text-fg outline-none placeholder:text-fg3" />
        {left < 120 && <span className="pb-3 text-[12.5px] tabular-nums text-fg2">{left}</span>}
        <motion.button type="button" aria-label={t('op.send')} whileTap={ok ? { scale: 0.9 } : undefined} onClick={send} disabled={!ok}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${ok || busy ? 'bg-accent text-white' : 'bg-fill2 text-fg2'}`}>
          {busy ? <Spinner size={16} /> : <Icon.Send size={18} />}
        </motion.button>
      </div>
    </div>
  )
})
