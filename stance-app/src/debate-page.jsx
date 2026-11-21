// One debate: the motion, the matchup, the turns in two voices, and whatever you can do next
// (accept, take the other side, write your turn, wait, vote, see the verdict, repost a declined challenge).
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, appLink, readCache, writeCache } from './api.js'
import { t, timeAgo } from './i18n.js'
import { Avatar, Button, Card, Confirm, Empty, Icon, IconButton, LoadError, Page, Sheet, SideTag, Spinner, TextArea, spring, useApp, useInterval } from './ui.jsx'
import { Kicker, OpenSeat, firstName, isMe, nextTurn, roundName, sideLabel } from './debate-parts.jsx'

const draftKey = id => 'stance.draft.debate.' + id
const readDraft = id => { try { return localStorage.getItem(draftKey(id)) || '' } catch { return '' } }
const saveDraft = (id, text) => { try { text ? localStorage.setItem(draftKey(id), text) : localStorage.removeItem(draftKey(id)) } catch {} }

export function DebatePage({ id, onBack, covered }) {
  const { me, toast, bump, refreshMe, withAccount } = useApp()
  const [data, setDataState] = useState(() => readCache('debate.' + id))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [composing, setComposing] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'decline' | 'withdraw'
  const verdictRef = useRef(null)
  const setData = r => { writeCache('debate.' + id, r); setDataState(r) }

  const load = () => api('/debates/' + id).then(r => {
    setDataState(old => {
      // Say so when the other side has just answered
      if (old && !old.debate.needsMe && r.debate.needsMe && r.debate.status === 'active') toast(t('debate.yourTurnToast', { round: nextTurn(r.debate).mid }))
      writeCache('debate.' + id, r)
      return r
    })
    setError(null)
  }).catch(e => setError(e))

  useEffect(() => { load() }, [id, me?.handle])
  const d = data?.debate
  // While something can change on the other side, keep an eye on it
  useInterval(load, 10000, !!d && ['open', 'pending', 'active'].includes(d.status) && !d.needsMe)

  const act = async (fn, after) => {
    setBusy(true)
    try { await fn(); after?.() } catch (e) { toast(e.message, 'error'); load() } finally { setBusy(false) }
  }
  const accept = () => withAccount(() => act(async () => {
    setData(await api(`/debates/${id}/accept`, { method: 'POST' }))
    bump(); refreshMe().catch(() => {})
  }, () => setTimeout(() => setComposing(true), 350)))
  const decline = () => act(async () => {
    setData(await api(`/debates/${id}/decline`, { method: 'POST' }))
    setConfirm(null); bump(); refreshMe().catch(() => {})
    toast(t('debate.declinedToast'))
  })
  const withdraw = () => act(async () => {
    await api('/debates/' + id, { method: 'DELETE' })
    setConfirm(null); bump(); toast(t('debate.withdrawnToast')); onBack()
  })
  const reopen = () => act(async () => { setData(await api(`/debates/${id}/reopen`, { method: 'POST' })); bump(); toast(t('debate.reopenedToast')) })
  const vote = side => withAccount(() => act(async () => { setData(await api(`/debates/${id}/verdict`, { method: 'POST', body: { side } })); bump() }))
  const post = async text => {
    const n = nextTurn(d)
    const r = await api(`/debates/${id}/turns`, { method: 'POST', body: { text } })
    saveDraft(id, '')
    setData(r)
    setComposing(false)
    bump(); refreshMe().catch(() => {})
    toast(r.debate.status === 'closed' ? t('debate.finishedToast') : t('debate.postedToast', { round: n.name }))
  }
  const share = async () => {
    const url = appLink('debate/' + id)
    try {
      if (navigator.share) await navigator.share({ title: d.motion, url })
      else { await navigator.clipboard.writeText(url); toast(t('ui.linkCopied')) }
    } catch (e) { if (e?.name !== 'AbortError') toast(url) }
  }

  if (!d) {
    return (
      <Page covered={covered} onBack={onBack}>
        {error?.status === 404 ? <Empty icon={<Icon.Debate size={30} />} title={t('debate.gone')} />
          : error ? <LoadError error={error} onRetry={load} />
          : <div className="grid place-items-center py-40 text-fg2"><Spinner size={26} /></div>}
      </Page>
    )
  }

  const next = nextTurn(d)
  return (
    <Page covered={covered} onBack={onBack} title={d.motion} right={<IconButton label={t('ui.share')} onClick={share}><Icon.Share size={20} /></IconButton>}>
      <Header d={d} />
      <Matchup d={d} me={me} />
      <Transcript d={d} turns={data.turns} me={me} onWrite={() => setComposing(true)} />
      {d.status === 'closed' && <div ref={verdictRef}><Verdict d={d} me={me} busy={busy} onVote={vote} /></div>}
      <ActionBar d={d} busy={busy} verdictRef={verdictRef}
        onAccept={accept} onDecline={() => setConfirm('decline')} onWithdraw={() => setConfirm('withdraw')} onWrite={() => setComposing(true)} onReopen={reopen} />
      <Composer open={composing} d={d} turns={data.turns} next={next} onClose={() => setComposing(false)} onPost={post} />
      <Confirm open={confirm === 'decline'} onClose={() => setConfirm(null)} title={t('debate.declineQ', { name: firstName(d.for) })} action={t('debate.decline')} danger busy={busy} onConfirm={decline} />
      <Confirm open={confirm === 'withdraw'} onClose={() => setConfirm(null)} title={t('debate.withdrawQ')} action={t('debate.withdraw')} danger busy={busy} onConfirm={withdraw} />
    </Page>
  )
}

// "3h ago" / "vor 3 Std." within a week, "now" just now, the date after that
const ago = ts => {
  const s = (Date.now() - ts) / 1000
  return s >= 45 && s < 86400 * 7 ? t('time.ago', { t: timeAgo(ts) }) : timeAgo(ts)
}

function Header({ d }) {
  const when = d.status === 'closed' ? t('debate.finishedAgo', { t: ago(d.ended) })
    : d.status === 'active' ? `${t('debate.startedAgo', { t: ago(d.started) })} · ${t('debate.roundOf', { n: nextTurn(d).round })}`
    : t('debate.postedAgo', { t: ago(d.created) })
  return (
    <header className="px-6 pt-3">
      <Kicker d={d} />
      <h1 className="serif prose-wrap mt-2.5 text-[30px] font-medium leading-[1.15]">{d.motion}</h1>
      {d.context && <p className="prose-wrap mt-3 whitespace-pre-wrap text-[16px] leading-[1.5] text-fg2">{d.context}</p>}
      <div className="mt-3 text-[13.5px] text-fg2">{when}</div>
    </header>
  )
}

/** The two seats, side by side, with the round track underneath */
function Matchup({ d, me }) {
  const { openProfile } = useApp()
  const Seat = ({ user, side }) => (
    <div className="flex min-w-0 flex-col items-center text-center">
      <div className="relative">
        {user ? <Avatar user={user} size={56} onClick={user.handle === 'deleted' ? undefined : () => openProfile(user.handle)} /> : <OpenSeat size={56} />}
        {d.status === 'closed' && d.winner === side && <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-accent text-white"><Icon.Trophy size={14} /></span>}
      </div>
      <div className={`mt-2.5 max-w-full truncate text-[16px] font-semibold ${user ? '' : 'text-fg2'}`}>{user ? (isMe(user, me) ? t('debate.you') : user.name) : t('debate.anyone')}</div>
      <div className="max-w-full truncate text-[13.5px] text-fg2">{user ? '@' + user.handle : t('debate.openSeat')}</div>
      <SideTag side={side} label={sideLabel(d, side)} className="mt-2" />
    </div>
  )
  return (
    <Card className="mx-4 mt-6 px-4 pb-4 pt-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2">
        <Seat user={d.for} side={0} />
        <span className="serif mt-4 text-[20px] italic text-fg2">vs</span>
        <Seat user={d.against} side={1} />
      </div>
      <div className="mt-4 border-t border-line pt-3.5"><RoundTrack d={d} /></div>
    </Card>
  )
}

function RoundTrack({ d }) {
  const next = d.status === 'active' ? d.turns : -1
  return (
    <div className="flex w-full justify-between px-2" role="img" aria-label={t('debate.turnsWritten', { n: d.turns })}>
      {[0, 1, 2].map(i => (
        <div key={i} className={`flex min-w-0 flex-col items-center gap-1.5 text-[12.5px] font-semibold ${Math.floor(next / 2) === i ? 'text-fg' : 'text-fg2'}`}>
          <span className="flex gap-[3px]">
            {[0, 1].map(s => {
              const k = i * 2 + s
              return <span key={s} className={`h-[7px] w-[18px] rounded-full ${k < d.turns ? (s ? 'bg-fg2' : 'bg-accent') : k === next ? 'ring-[1.5px] ring-inset ring-fg2' : 'bg-fill2'}`} />
            })}
          </span>
          <span className="truncate">{roundName(i)}</span>
        </div>
      ))}
    </div>
  )
}

/** The written turns, round by round; side one on the left, side two on the right */
function Transcript({ d, turns, me, onWrite }) {
  const rounds = [1, 2, 3].map(r => turns.filter(x => x.round === r))
  const next = nextTurn(d)
  const pendingSeat = ['open', 'pending', 'declined'].includes(d.status)
  return (
    <div className="mt-6 px-4">
      {rounds.map((list, i) => {
        const ghost = (d.status === 'active' && next.round === i + 1) || (pendingSeat && i === 0)
        if (!list.length && !ghost) return null
        return (
          <section key={i} className="mb-2">
            <div className="flex items-center gap-3 px-2 pb-3 pt-4">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('debate.roundN', { n: i + 1 })} · {roundName(i)}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <div className="flex flex-col gap-3">
              {list.map(x => <Turn key={x.id} turn={x} d={d} me={me} />)}
              {ghost && <NextTurn d={d} me={me} onWrite={onWrite} />}
            </div>
          </section>
        )
      })}
      {d.forfeit !== null && d.forfeit !== undefined && (
        <p className="px-2 py-4 text-center text-[15px] text-fg2">{t('debate.leftDebate')}</p>
      )}
    </div>
  )
}

function Turn({ turn: x, d, me }) {
  const { openProfile } = useApp()
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={x.side ? 'pl-6' : 'pr-6'}>
      <Card className="px-5 pb-5 pt-4">
        <header className="flex items-center gap-2.5">
          <Avatar user={x.user} size={32} onClick={x.user.handle === 'deleted' ? undefined : () => openProfile(x.user.handle)} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[15px] font-semibold">{isMe(x.user, me) ? t('debate.you') : x.user.name}</div>
            <div className="truncate text-[13px] text-fg2">{roundName(x.round - 1)} · {timeAgo(x.created)}</div>
          </div>
          <SideTag side={x.side} label={sideLabel(d, x.side)} className="min-w-0 shrink" />
        </header>
        <p className="serif prose-wrap mt-3 whitespace-pre-wrap text-[18px] leading-[1.55] text-fg">{x.text}</p>
      </Card>
    </motion.article>
  )
}

/** The turn that comes next: an empty seat, the other person's turn (and since when), or yours (tap to write) */
function NextTurn({ d, me, onWrite }) {
  const n = nextTurn(d)
  const user = n.side ? d.against : d.for
  const mine = d.status === 'active' && d.needsMe
  const title = isMe(user, me) ? t('debate.yourRound', { round: n.mid }) : user ? t('debate.theirRound', { name: firstName(user), round: n.mid }) : t('debate.openRound', { round: n.name, side: sideLabel(d, 1) })
  let text = ''
  if (d.status === 'open') text = d.role === 'for' ? t('debate.waitingAnyone') : t('debate.takeOther')
  else if (d.status === 'pending') text = d.role === 'against' ? t('debate.acceptToWrite') : t('debate.waitingFor', { name: firstName(user) })
  else if (d.status === 'declined') text = t('debate.declinedBy', { name: firstName(user) })
  else if (!mine) text = t('debate.waitingSince', { t: ago(d.lastTurn) })
  const Tag = mine ? motion.button : motion.div
  return (
    <div className={n.side ? 'pl-6' : 'pr-6'}>
      <Tag {...(mine ? { type: 'button', onClick: onWrite, whileTap: { scale: 0.98 } } : {})} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className={`block w-full rounded-[22px] border-[1.5px] border-dashed px-5 py-4 text-left ${mine ? 'border-accent/60' : 'border-line'}`}>
        <div className="flex items-center gap-2.5">
          {user ? <Avatar user={user} size={32} /> : <OpenSeat size={32} />}
          <div className="min-w-0 flex-1 truncate text-[15px] font-semibold">{title}</div>
          <SideTag side={n.side} label={sideLabel(d, n.side)} className="min-w-0 shrink" />
        </div>
        {text && <div className="mt-2.5 text-[15px] leading-snug text-fg2">{text}</div>}
        {mine && <div className="mt-2.5 flex items-center gap-1.5 text-[15px] font-semibold text-accent-ink"><Icon.Edit size={16} />{t('debate.writeRound', { round: n.mid })}</div>}
      </Tag>
    </div>
  )
}

/** Readers vote before they see the score; debaters and voters see the bars */
function Verdict({ d, me, busy, onVote }) {
  const [changing, setChanging] = useState(false)
  const choosing = d.forfeit == null && (d.canVote || !me) && (d.myVerdict === null || changing)
  return (
    <Card className="mx-4 mt-6 p-5">
      <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('debate.verdict')}</div>
      <AnimatePresence mode="wait" initial={false}>
        {choosing ? (
          <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <h2 className="serif mt-1.5 text-[26px] font-medium leading-tight">{t('debate.whoBetter')}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[0, 1].map(side => {
                const u = side ? d.against : d.for
                return (
                  <motion.button key={side} type="button" disabled={busy} whileTap={{ scale: 0.96 }} transition={spring} onClick={() => { setChanging(false); onVote(side) }}
                    className={`flex min-w-0 flex-col items-center rounded-[20px] bg-fill px-3 pb-4 pt-5 transition-opacity disabled:opacity-50 ${d.myVerdict === side ? 'ring-2 ring-accent' : ''}`}>
                    <Avatar user={u} size={44} />
                    <span className="mt-2.5 max-w-full truncate text-[16px] font-semibold text-fg">{u.name}</span>
                    <span className={`mt-0.5 max-w-full truncate text-[13.5px] font-semibold ${side ? 'text-fg2' : 'text-accent-ink'}`}>{sideLabel(d, side)}</span>
                  </motion.button>
                )
              })}
            </div>
            {changing && <div className="mt-3 text-center"><Button kind="plain" size="sm" onClick={() => setChanging(false)}>{t('debate.keepVote')}</Button></div>}
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={spring}>
            <Result d={d} me={me} />
            {d.canVote && d.myVerdict !== null && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-2 text-[14.5px] text-fg2">
                <span className="flex min-w-0 items-center gap-1.5"><Icon.Check size={16} className="shrink-0 text-accent-ink" /><span className="truncate">{t('debate.youVoted', { name: firstName(d.myVerdict ? d.against : d.for) })}</span></span>
                <Button kind="plain" size="sm" className="-mr-3" onClick={() => setChanging(true)}>{t('debate.change')}</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

function Result({ d, me }) {
  const votes = d.votes || [0, 0]
  const total = votes[0] + votes[1]
  const w = d.winner
  const winner = w === null ? null : w ? d.against : d.for
  const forfeit = d.forfeit !== null && d.forfeit !== undefined
  const headline = forfeit ? t('debate.forfeitWin', { name: isMe(winner, me) ? t('debate.you') : firstName(winner) })
    : !total ? t('debate.noVotes') : w === null ? t('debate.tooClose') : isMe(winner, me) ? t('debate.youBetter') : t('debate.theyBetter', { name: firstName(winner) })
  const sub = forfeit ? '' : !total ? '' : w === null ? t('debate.tieAt', { n: votes[0] }) : t('debate.ofVotes', { a: votes[w], n: total })
  return (
    <>
      <h2 className="serif mt-1.5 flex items-center gap-2 text-[26px] font-medium leading-tight">
        {winner && <Icon.Trophy size={24} className="shrink-0 text-accent-ink" />}
        <span className="min-w-0">{headline}</span>
      </h2>
      {sub && <p className="mt-1 text-[15px] text-fg2">{sub}</p>}
      {!forfeit && total > 0 && (
        <div className="mt-5 flex flex-col gap-4">
          {[0, 1].map(side => {
            const u = side ? d.against : d.for
            const pct = Math.round((votes[side] / total) * 100)
            return (
              <div key={side}>
                <div className="flex items-center gap-2.5">
                  <Avatar user={u} size={28} />
                  <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{isMe(u, me) ? t('debate.you') : u.name}</span>
                  <span className="w-11 text-right text-[15px] font-semibold tabular-nums">{pct}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-fill">
                  <motion.div className={`h-full rounded-full ${side ? 'bg-fg2' : 'bg-accent'}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: 'spring', damping: 26, stiffness: 140, delay: 0.1 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

/** The floating bar at the bottom: what you can do now */
function ActionBar({ d, busy, verdictRef, onAccept, onDecline, onWithdraw, onWrite, onReopen }) {
  const n = nextTurn(d)
  const seen = useInView(verdictRef)
  let body = null
  if (d.status === 'pending' && d.role === 'against') {
    body = (
      <div className="flex gap-2.5">
        <Button kind="gray" size="lg" className="flex-1" disabled={busy} onClick={onDecline}>{t('debate.decline')}</Button>
        <Button size="lg" className="flex-[1.4]" disabled={busy} onClick={onAccept}>{busy ? <Spinner /> : t('debate.accept')}</Button>
      </div>
    )
  } else if (d.status === 'open' && !d.role) {
    body = <Button size="lg" className="w-full" disabled={busy} onClick={onAccept}>{busy ? <Spinner /> : <><Icon.Swords size={19} />{t('debate.takeSide', { side: sideLabel(d, 1) })}</>}</Button>
  } else if (d.role === 'for' && d.status === 'declined') {
    body = (
      <div className="flex gap-2.5">
        <Button kind="gray" size="lg" className="flex-1 !text-danger" disabled={busy} onClick={onWithdraw}>{t('debate.withdraw')}</Button>
        <Button size="lg" className="flex-[1.4]" disabled={busy} onClick={onReopen}>{busy ? <Spinner /> : t('debate.postOpen')}</Button>
      </div>
    )
  } else if (d.role === 'for' && ['open', 'pending'].includes(d.status)) {
    body = <Button kind="gray" size="lg" className="w-full !text-danger" disabled={busy} onClick={onWithdraw}>{t('debate.withdraw')}</Button>
  } else if (d.status === 'active' && d.needsMe) {
    body = <Button size="lg" className="w-full" onClick={onWrite}><Icon.Edit size={18} />{t('debate.writeRound', { round: n.mid })}</Button>
  } else if (d.status === 'closed' && d.forfeit == null && d.myVerdict === null && !d.role && !seen) {
    body = <Button kind="gray" size="lg" className="w-full" onClick={() => verdictRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{t('debate.whoBetter')}</Button>
  }
  return (
    <div className="pointer-events-none sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 mt-6 px-3">
      <AnimatePresence>
        {body && (
          <motion.div key={d.status + (d.needsMe ? 1 : 0)} initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} transition={spring}
            className="glass pointer-events-auto rounded-[32px] p-2 shadow-[0_8px_30px_-14px_rgba(0,0,0,0.35)]">
            {body}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function useInView(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  })
  return seen
}

/** Writing your turn: their last argument for reference, then the text */
function Composer({ open, d, turns, next, onClose, onPost }) {
  const [text, setText] = useState(() => readDraft(d.id))
  const [sending, setSending] = useState(false)
  const [full, setFull] = useState(false)
  const { toast } = useApp()
  useEffect(() => { saveDraft(d.id, text) }, [text])
  const last = [...turns].reverse().find(x => x.side !== next.side)
  const ok = text.trim().length >= 40 && !sending
  const send = async () => {
    if (!ok) return
    setSending(true)
    try { await onPost(text.trim()); setText('') } catch (e) { toast(e.message, 'error') } finally { setSending(false) }
  }
  return (
    <Sheet open={open} onClose={onClose} full title={t('debate.yourRound', { round: next.mid })}>
      <div className="flex min-h-full flex-col px-5 pb-5">
        <div className="flex items-center gap-2">
          <SideTag side={next.side} label={sideLabel(d, next.side)} className="min-w-0" />
          <span className="shrink-0 text-[13.5px] text-fg2">{t('debate.roundOf', { n: next.round })}</span>
        </div>
        {last && (
          <button type="button" onClick={() => setFull(f => !f)} aria-expanded={full} className="mt-4 block w-full rounded-[18px] bg-surface px-4 py-3 text-left">
            <div className="flex items-center justify-between text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">
              <span className="truncate">{firstName(last.user)} · {roundName(last.round - 1)}</span>
              <span className="shrink-0 normal-case tracking-normal">{full ? t('ui.less') : t('ui.moreText')}</span>
            </div>
            <p className={`serif prose-wrap mt-1.5 whitespace-pre-wrap text-[16px] leading-[1.5] text-fg ${full ? '' : 'line-clamp-3'}`}>{last.text}</p>
          </button>
        )}
        <div className="mt-5 flex-1">
          <TextArea value={text} onChange={setText} min={40} max={1500} rows={7} autoFocus onSubmit={send}
            placeholder={next.round === 3 ? t('debate.phClosing') : next.round === 2 ? t('debate.phRebuttal') : t('debate.phOpening')} />
        </div>
        <Button size="lg" className="sticky bottom-0 mt-4 w-full" disabled={!ok} onClick={send}>
          {sending ? <Spinner /> : <><Icon.Send size={18} />{t('debate.postRound', { round: next.mid })}</>}
        </Button>
      </div>
    </Sheet>
  )
}
