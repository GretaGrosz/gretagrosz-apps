// Argue back: you against the strongest case for the other side of a question. Your argument is your opening;
// the other side answers, you reply, it answers again, you close, and a judge says who argued better and which
// point you never answered. Runs on Workers AI (worker/stance-ai.js); three rounds a day.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { api, useLoad, writeCache } from './api.js'
import { t } from './i18n.js'
import { Button, Card, Empty, Icon, LoadError, Page, SideTag, Spinner, spring, useApp } from './ui.jsx'

const AI_TIMEOUT = 60000

export function SparPage({ qid, onBack, covered }) {
  const { refresh, replaceTop, toast, me } = useApp()
  const qp = useLoad(`q.${qid}`, `/questions/${qid}`, [refresh])
  const sp = useLoad(me ? `spar.${qid}` : null, `/questions/${qid}/spar`, [refresh])
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null) // your turn, shown while the reply is written
  const end = useRef(null)

  const q = qp.data?.question
  const mine = qp.data?.mine
  const spar = sp.data?.spar && mine && sp.data.spar.side === mine.side ? sp.data.spar : null
  const left = sp.data?.left ?? 0

  // Not answered yet: Argue back starts from your own argument
  useEffect(() => { if (qp.data && !qp.data.mine) replaceTop({ type: 'question', id: qid }) }, [qp.data])
  useEffect(() => { if (spar || pending) setTimeout(() => end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80) }, [spar?.turns.length, spar?.status, pending])

  const save = d => { writeCache(`spar.${qid}`, d); sp.setData(d) }
  const run = async (path, body) => {
    setBusy(true)
    try {
      const d = await api(path, { method: 'POST', body, timeout: AI_TIMEOUT })
      save(d)
      setPending(null)
      navigator.vibrate?.(10)
      return true
    } catch (e) {
      toast(e.message, 'error')
      sp.reload()
      return false
    } finally { setBusy(false) }
  }
  const start = () => run(`/questions/${qid}/spar`)
  const reply = async text => { setPending(text); const ok = await run(`/spars/${spar.id}/turns`, { text }); if (!ok) setPending(null); return ok }
  const retry = () => run(`/spars/${spar.id}/continue`)

  if (!q || !sp.data) {
    const error = qp.error || sp.error
    return <Page covered={covered} onBack={onBack} title={t('spar.title')}>{error ? <LoadError error={error} onRetry={() => { qp.reload(); sp.reload() }} /> : <div className="grid place-items-center py-40 text-fg2"><Spinner size={26} /></div>}</Page>
  }

  const turns = spar ? [...spar.turns, ...(pending ? [{ role: 'you', text: pending, created: Date.now() }] : [])] : []
  const thinking = busy || spar?.status === 'thinking'
  const failed = spar?.status === 'thinking' && !busy
  const yourTurn = spar?.status === 'open' && !pending

  return (
    <Page covered={covered} onBack={onBack} title={t('spar.title')}>
      <header className="px-5 pt-1">
        <h1 className="text-[34px] font-bold leading-[41px]">{t('spar.title')}</h1>
        <div className="mt-3 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{q.title}</div>
        <p className="serif prose-wrap mt-1 text-[20px] font-medium leading-[1.25]">{q.question}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <SideTag side={0} label={`${t('debate.you')}: ${q.sides[mine.side]}`} />
          <SideTag side={1} label={`${t('spar.them')}: ${q.sides[1 - mine.side]}`} />
        </div>
      </header>

      {!spar ? (
        <div className="px-4 pt-6">
          <Card className="px-5 py-4">
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('spar.yourOpening')}</div>
            <p className="prose-wrap mt-2 line-clamp-6 whitespace-pre-wrap text-[16.5px] leading-[1.5]">{mine.text}</p>
          </Card>
          <Button size="lg" className="mt-5 w-full" disabled={busy || left <= 0} onClick={start}>
            {busy ? <Spinner /> : <><Icon.Swords size={19} />{t('spar.start')}</>}
          </Button>
          <p className="mt-2.5 text-center text-[14px] text-fg2">{left > 0 ? t('spar.left', { n: left }) : t('spar.noneLeft')}</p>
          {busy && <ThinkingCard />}
        </div>
      ) : (
        <div className="px-4 pt-4">
          {turns.map((x, i) => (
            <div key={i}>
              {x.role === 'you' && <Divider n={Math.floor(i / 2) + 1} />}
              <TurnCard turn={x} side={x.role === 'you' ? 0 : 1} label={x.role === 'you' ? t('debate.you') : t('spar.them')} />
            </div>
          ))}
          <AnimatePresence>
            {thinking && spar.status !== 'judged' && (
              <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {failed ? (
                  <Card className="mt-3 flex items-center gap-3 px-5 py-4">
                    <span className="min-w-0 flex-1 text-[15px] text-fg2">{spar.yourTurns >= 3 ? t('spar.judgeFailed') : t('spar.replyFailed')}</span>
                    <Button size="sm" onClick={retry}><Icon.Retry size={16} />{t('ui.retry')}</Button>
                  </Card>
                ) : <ThinkingCard judging={spar.yourTurns + (pending ? 1 : 0) >= 3} />}
              </motion.div>
            )}
          </AnimatePresence>
          {spar.status === 'judged' && spar.verdict && <VerdictCard v={spar.verdict} left={left} busy={busy} onAgain={start} />}
          <div ref={end} className="h-2 scroll-mb-40" />
        </div>
      )}

      {spar && yourTurn && <SparComposer round={spar.yourTurns + 1} onSend={reply} busy={busy} />}
      {!spar && sp.data && !mine && <Empty title={t('spar.answerFirst')} />}
    </Page>
  )
}

function Divider({ n }) {
  return (
    <div className="flex items-center gap-3 px-2 pb-3 pt-4">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('spar.round', { n })}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

function TurnCard({ turn, side, label }) {
  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={spring} className={`mt-3 ${side ? 'pr-6' : 'pl-6'}`}>
      <Card className="px-5 pb-4 pt-3.5">
        <div className={`text-[13px] font-semibold uppercase tracking-[0.05em] ${side === 0 ? 'text-accent-ink' : 'text-fg2'}`}>{label}</div>
        <p className={`prose-wrap mt-1.5 whitespace-pre-wrap leading-[1.5] ${side ? 'serif text-[18px]' : 'text-[16.5px]'}`}>{turn.text}</p>
      </Card>
    </motion.article>
  )
}

/** Shown only while a reply is really being written on the server */
function ThinkingCard({ judging = false }) {
  const reduce = useReducedMotion()
  return (
    <div className="mt-3 pr-6">
      <Card className="flex items-center gap-3 px-5 py-4 text-[15px] text-fg2">
        <span className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map(i => (
            <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-fg2" animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />
          ))}
        </span>
        <span role="status">{judging ? t('spar.judging') : t('spar.writing')}</span>
      </Card>
    </div>
  )
}

function VerdictCard({ v, left, busy, onAgain }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={spring}>
      <Card className="mt-6 p-5">
        <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('debate.verdict')}</div>
        <h2 className="serif mt-1.5 flex items-center gap-2 text-[27px] font-medium leading-tight">
          {v.winner === 'you' && <Icon.Trophy size={24} className="shrink-0 text-accent-ink" />}
          {t('spar.result.' + v.winner)}
        </h2>
        <p className="mt-2 text-[16px] leading-[1.45]">{v.reason}</p>
        {v.strongest && (
          <div className="mt-4 rounded-[16px] bg-fill px-4 py-3">
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-accent-ink">{t('spar.strongest')}</div>
            <p className="serif prose-wrap mt-1 text-[17px] italic leading-[1.4]">“{v.strongest}”</p>
          </div>
        )}
        {v.unanswered && <Note label={t('spar.unanswered')} text={v.unanswered} />}
        {v.tip && <Note label={t('spar.tip')} text={v.tip} />}
        <Button size="lg" className="mt-5 w-full" disabled={busy || left <= 0} onClick={onAgain}>{busy ? <Spinner /> : <><Icon.Retry size={19} />{t('spar.again')}</>}</Button>
        <p className="mt-2 text-center text-[14px] text-fg2">{left > 0 ? t('spar.left', { n: left }) : t('spar.noneLeft')}</p>
      </Card>
    </motion.div>
  )
}

const Note = ({ label, text }) => (
  <div className="mt-4 border-t border-line pt-3">
    <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-fg2">{label}</div>
    <p className="mt-1 text-[16px] leading-[1.45]">{text}</p>
  </div>
)

function SparComposer({ round, onSend, busy }) {
  const [text, setText] = useState('')
  const box = useRef(null)
  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [text])
  const short = 20 - text.trim().length
  const ok = short <= 0 && !busy
  const send = async () => { if (ok && await onSend(text.trim())) setText('') }
  return (
    <div className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 mt-4 px-3">
      <div className="glass rounded-[24px] px-1.5 py-1.5 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.3)]">
        <div className="flex items-end gap-2 pl-3">
          <textarea ref={box} rows={1} value={text} onChange={e => setText(e.target.value.slice(0, 1500))} aria-label={t('spar.replyLabel')}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send() }}
            placeholder={round >= 3 ? t('spar.phClose') : t('spar.phReply')}
            className="prose-wrap block max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent py-[11px] text-[16px] leading-[1.4] text-fg outline-none placeholder:text-fg3" />
          <motion.button type="button" aria-label={t('op.send')} whileTap={ok ? { scale: 0.9 } : undefined} onClick={send} disabled={!ok}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${ok ? 'bg-accent text-white' : 'bg-fill2 text-fg2'}`}>
            <Icon.Send size={18} />
          </motion.button>
        </div>
        {text.trim() && short > 0 && <div className="px-3 pb-1 text-[12.5px] text-fg2">{t('ui.more', { n: short })}</div>}
      </div>
    </div>
  )
}
