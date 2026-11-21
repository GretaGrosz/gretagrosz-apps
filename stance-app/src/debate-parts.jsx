// Small pieces shared by the debate screens: who is who, what state a debate is in, progress marks.
import { Avatar } from './ui.jsx'
import { lang, t, timeAgo } from './i18n.js'

export const firstName = u => (u?.name || u?.handle || '?').split(/\s+/)[0]
export const isMe = (u, me) => !!u && !!me && u.handle === me.handle
/** mid: inside a sentence (English lowercases, German nouns keep their capital) */
export const roundName = (i, mid = false) => {
  const name = t(['debate.opening', 'debate.rebuttal', 'debate.closing'][i])
  return mid && lang === 'en' ? name.toLowerCase() : name
}

/** The label of a side: the question's own sides for debates started from a question, else For / Against */
export const sideLabel = (d, side) => d.labels?.[side] || t(side ? 'debate.against' : 'debate.for')

/** The next turn to be written: index 0-5, side, round number and round name */
export function nextTurn(d) {
  const i = Math.min(d.turns, 5)
  return { index: i, side: i % 2, round: Math.floor(i / 2) + 1, name: roundName(Math.floor(i / 2)), mid: roundName(Math.floor(i / 2), true) }
}

/** One line under a debate card: the state of play, never repeated elsewhere on the card */
export function statusLine(d, me) {
  if (d.status === 'open') return d.role === 'for' ? t('debate.waitingAnyone') : t('debate.takeOther')
  if (d.status === 'pending') return d.role === 'against' ? t('debate.challengedYou', { name: firstName(d.for) }) : t('debate.waitingFor', { name: firstName(d.against) })
  if (d.status === 'declined') return t('debate.declinedBy', { name: firstName(d.against) })
  if (d.status === 'active') {
    const n = nextTurn(d)
    return `${t('debate.roundOf', { n: n.round })} · ${d.needsMe ? t('debate.yourTurn') : t('debate.theirTurn', { name: firstName(n.side ? d.against : d.for), ago: timeAgo(d.lastTurn) })}`
  }
  if (d.forfeit !== null && d.forfeit !== undefined) {
    const w = d.forfeit ? d.for : d.against
    return t('debate.forfeitWin', { name: isMe(w, me) ? t('debate.you') : firstName(w) })
  }
  if (!d.votes) return t('debate.notVoted')
  const total = d.votes[0] + d.votes[1]
  if (!total) return t('debate.noVotes')
  if (d.winner === null) return `${t('debate.votes', { n: total })} · ${t('debate.tied')}`
  const w = d.winner ? d.against : d.for
  return `${t('debate.votes', { n: total })} · ${t('debate.won', { name: isMe(w, me) ? t('debate.you') : firstName(w) })}`
}

/** Small uppercase label for the state of a debate */
export function Kicker({ d, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.05em] ${d.status === 'active' ? 'text-accent-ink' : 'text-fg2'} ${className}`}>
      {d.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
      {t('debate.kicker.' + d.status)}
    </span>
  )
}

/** Six turns as marks, paired by round. Side one is the accent, side two neutral. */
export function TurnDots({ d, className = '' }) {
  return (
    <div className={`flex shrink-0 items-center gap-[7px] ${className}`} role="img" aria-label={t('debate.turnsWritten', { n: d.turns })}>
      {[0, 1, 2].map(r => (
        <span key={r} className="flex gap-[3px]">
          {[0, 1].map(s => {
            const i = r * 2 + s
            return <span key={s} className={`h-[7px] w-[7px] rounded-full ${i < d.turns ? (s ? 'bg-fg2' : 'bg-accent') : i === d.turns && d.status === 'active' ? 'ring-[1.5px] ring-inset ring-fg2' : 'bg-fill2'}`} />
          })}
        </span>
      ))}
    </div>
  )
}

/** The empty seat in an open challenge */
export function OpenSeat({ size = 40 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-fg2/70 font-serif text-fg2" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">?</span>
  )
}

/** "Ada  vs  Bo" in one line for cards */
export function MiniMatchup({ d, me }) {
  const name = u => (isMe(u, me) ? t('debate.you') : u.name)
  return (
    <div className="flex items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Avatar user={d.for} size={32} />
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold">{name(d.for)}</div>
          <div className="truncate text-[12.5px] font-semibold text-accent-ink">{sideLabel(d, 0)}</div>
        </div>
      </div>
      <span className="serif shrink-0 text-[15px] italic text-fg2">vs</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5 text-right">
        <div className="min-w-0 leading-tight">
          <div className={`truncate text-[15px] font-semibold ${d.against ? '' : 'text-fg2'}`}>{d.against ? name(d.against) : t('debate.anyone')}</div>
          <div className="truncate text-[12.5px] font-semibold text-fg2">{sideLabel(d, 1)}</div>
        </div>
        {d.against ? <Avatar user={d.against} size={32} /> : <OpenSeat size={32} />}
      </div>
    </div>
  )
}

/** A tiny split for finished cards */
export function MiniSplit({ votes }) {
  const total = votes[0] + votes[1]
  return (
    <span className="flex h-1.5 w-14 shrink-0 overflow-hidden rounded-full bg-fill2" aria-hidden="true">
      <span className="h-full rounded-full bg-accent" style={{ width: `${Math.round((votes[0] / total) * 100)}%` }} />
    </span>
  )
}
