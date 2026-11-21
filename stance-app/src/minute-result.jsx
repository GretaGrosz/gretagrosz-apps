// What a talk came to: the coach's three scores, pace and filler words, strength and next step, your recording and
// the transcript. A talk that couldn't be analysed says so plainly and offers a real retry; no zeros posing as results.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { clock, lang, relDay, t } from './i18n.js'
import { Button, Card, Confirm, Icon, Spinner, fmt } from './ui.jsx'
import { Player, Ring, Transcript, fillerList, paceNote } from './minute-parts.jsx'

const SCORES = ['structure', 'clarity', 'depth']
const quote = w => (lang === 'de' ? `„${w}“` : `“${w}”`)
const rise = i => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring', stiffness: 380, damping: 34, delay: 0.04 + i * 0.05 } })

/** src overrides the recording (the local blob right after recording). onRetry analyses a failed talk again. */
export default function MinuteResult({ minute: m, src, onAgain, onNew, onDelete, onRetry, retrying = false }) {
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)
  const fb = m.feedback
  const scores = m.status === 'done' ? fb?.scores : null
  const fillers = fillerList(m)
  const minutes = m.duration / 60
  const perMin = minutes > 0 ? m.fillers / minutes : 0

  return (
    <div className="px-4">
      <motion.div {...rise(0)} className="px-1 pt-1">
        <div className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fg2">
          {relDay(m.created)} · {clock(m.created)} · {t('practice.min', { n: Math.round(m.length / 60) })} · {m.lang === 'de' ? 'Deutsch' : 'English'}
        </div>
        <h1 className="serif prose-wrap mt-2 text-[29px] font-medium leading-[1.15] [text-wrap:balance]">{m.topic}</h1>
        {fb?.summary && m.status === 'done' && <p className="serif mt-3 text-[18px] italic leading-[1.4] text-fg2">{fb.summary}</p>}
      </motion.div>

      {m.status === 'failed' && (
        <motion.div {...rise(1)}>
          <Card className="mt-5 p-5">
            <div className="text-[18px] font-semibold">{t('result.failedTitle')}</div>
            <p className="mt-1 text-[15px] text-fg2">{t('result.failedText')}</p>
            {onRetry && <Button size="lg" className="mt-4 w-full" disabled={retrying} onClick={onRetry}>{retrying ? <Spinner /> : <><Icon.Retry size={19} />{t('ui.retry')}</>}</Button>}
          </Card>
        </motion.div>
      )}
      {m.status === 'silent' && (
        <motion.div {...rise(1)}>
          <Card className="mt-5 p-5">
            <div className="text-[18px] font-semibold">{t('result.silentTitle')}</div>
            <p className="mt-1 text-[15px] text-fg2">{t('result.silentText')}</p>
          </Card>
        </motion.div>
      )}

      {scores && (
        <motion.div {...rise(1)}>
          <Card className="mt-5 px-3 pb-5 pt-5">
            <div className="grid grid-cols-3">
              {SCORES.map(k => (
                <div key={k} className="flex flex-col items-center">
                  <Ring size={86} stroke={7} progress={scores[k] / 10} animate>
                    <div className="text-[28px] font-semibold leading-none tabular-nums">{scores[k]}</div>
                  </Ring>
                  <div className="mt-2.5 text-[14.5px] font-semibold">{t('score.' + k)}</div>
                  <div className="text-[12.5px] text-fg2">{t('result.outOf10')}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
      {m.status === 'done' && !scores && onRetry && (
        <motion.div {...rise(1)}>
          <Card className="mt-5 flex items-center gap-3 p-4">
            <span className="min-w-0 flex-1 text-[15px] text-fg2">{t('result.noCoach')}</span>
            <Button size="sm" kind="gray" disabled={retrying} onClick={onRetry}>{retrying ? <Spinner size={16} /> : t('ui.retry')}</Button>
          </Card>
        </motion.div>
      )}

      {fb?.followed && m.status === 'done' && (
        <motion.div {...rise(2)}>
          <Card className="mt-3 flex gap-3 p-4">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-white"><Icon.Check size={14} /></span>
            <div className="min-w-0">
              <div className="text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('result.lastNote')}</div>
              <p className="mt-0.5 text-[16px] leading-[1.45]">{fb.followed}</p>
            </div>
          </Card>
        </motion.div>
      )}

      {m.status === 'done' && (
        <motion.div {...rise(2)}>
          <Card className="mt-3 p-5">
            <div className="grid grid-cols-3 gap-2">
              <Stat value={m.wpm} label={t('result.wpm')} />
              <Stat value={perMin.toFixed(perMin < 10 ? 1 : 0)} label={t('result.fillersPerMin')} />
              <Stat value={fmt(m.duration)} label={t('result.spoken')} />
            </div>
            <Pace wpm={m.wpm} />
            <div className="mt-4 flex flex-wrap gap-1.5">
              {fillers.length
                ? fillers.map(([w, n]) => (
                  <span key={w} className="inline-flex h-8 items-center gap-1 rounded-full bg-fill px-3 text-[14px] font-semibold">
                    {quote(w.replace(/^i\b/, 'I'))}<span className="font-medium text-fg2">×{n}</span>
                  </span>
                ))
                : <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent/[0.12] px-3 text-[14px] font-semibold text-accent-ink"><Icon.Check size={14} />{t('result.noFillers')}</span>}
            </div>
          </Card>
        </motion.div>
      )}

      {m.status === 'done' && (fb?.strength || fb?.improve) && (
        <motion.div {...rise(3)} className="mt-3 grid gap-3">
          {fb.strength && <Note label={t('result.strongest')} text={fb.strength} />}
          {fb.improve && <Note label={t('result.nextTime')} text={fb.improve} />}
        </motion.div>
      )}

      <motion.div {...rise(4)}>
        <Card className="mt-3 px-4 py-3.5"><Player src={src || m.audio} duration={m.duration} /></Card>
      </motion.div>

      {m.transcript && (
        <motion.div {...rise(5)}>
          <div className="flex items-baseline justify-between px-1 pb-2 pt-7">
            <h2 className="text-[22px] font-bold">{t('result.transcript')}</h2>
            <span className="text-[14px] tabular-nums text-fg2">{t('result.words', { n: m.words })}</span>
          </div>
          <Card className="px-5 py-5">
            <p lang={m.lang} className="serif prose-wrap text-[18px] leading-[1.6]"><Transcript text={m.transcript} fillers={fillers} /></p>
          </Card>
        </motion.div>
      )}

      <div className="mt-8 flex flex-col gap-2">
        {onAgain && <Button size="lg" className="w-full" onClick={onAgain}><Icon.Retry size={19} />{t('result.again')}</Button>}
        {onNew && <Button kind="gray" size="lg" className="w-full" onClick={onNew}><Icon.Shuffle size={19} />{t('result.newTopic')}</Button>}
        {onDelete && <Button kind="danger" size="md" className="mx-auto" onClick={() => setDeleting(true)}>{t('result.delete')}</Button>}
      </div>
      <Confirm open={deleting} onClose={() => setDeleting(false)} title={t('result.deleteQ')} action={t('result.delete')} danger busy={busy}
        onConfirm={async () => { setBusy(true); try { await onDelete() } finally { setBusy(false); setDeleting(false) } }} />
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="text-[28px] font-semibold leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-[13px] leading-tight text-fg2">{label}</div>
    </div>
  )
}

// Where your pace sits on a 60–220 wpm scale, with the natural 120–160 band shaded
function Pace({ wpm }) {
  const lo = 60, hi = 220
  const at = v => ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * 100
  return (
    <div className="mt-5">
      <div className="relative h-2 rounded-full bg-fill">
        <div className="absolute inset-y-0 rounded-full bg-accent/30" style={{ left: `${at(120)}%`, width: `${at(160) - at(120)}%` }} />
        <motion.div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[rgb(var(--surface))] bg-accent shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
          initial={{ left: '0%' }} animate={{ left: `${at(wpm)}%` }} transition={{ type: 'spring', damping: 26, stiffness: 120, delay: 0.3 }} />
      </div>
      <div className="relative mt-1.5 h-4 text-[11.5px] font-medium tabular-nums text-fg2">
        <span className="absolute -translate-x-1/2" style={{ left: `${at(120)}%` }}>120</span>
        <span className="absolute -translate-x-1/2" style={{ left: `${at(160)}%` }}>160</span>
      </div>
      <p className="mt-1 text-[15px] font-semibold">{paceNote(wpm)}</p>
    </div>
  )
}

function Note({ label, text }) {
  return (
    <Card className="p-4">
      <div className="text-[13px] font-semibold uppercase tracking-[0.05em] text-accent-ink">{label}</div>
      <p className="mt-1.5 text-[16px] leading-[1.45]">{text}</p>
    </Card>
  )
}
