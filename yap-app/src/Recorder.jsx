// The recording screen: a timer and live waveform from the mic, then a preview with voice effects.
// Everything except a voice bio goes through the outbox, so a recording is never lost to a bad connection.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { startRecording, canRecord, MAX_SECONDS, play, stop as stopPlayer, pause } from './audio.js'
import { sendClip } from './api.js'
import { enqueue } from './outbox.js'
import { t } from './i18n.js'
import { PlayButton, SPRING, Spinner, Waveform, fmt, toast, useLayer, portal } from './ui.jsx'

const EFFECTS = ['', 'chipmunk', 'deep']

/** target: { kind: 'post' | 'reply' | 'dm' | 'group' | 'bio', replyTo?, prompt? (question text), user?, group? } */
export default function Recorder({ target, onClose, onSent }) {
  const ref = useRef(null)
  const [phase, setPhase] = useState('starting')
  const [clip, setClip] = useState(null)
  const [fx, setFx] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const rec = useRef(null)
  const live = useRef(null)
  const closed = useRef(false)

  const close = () => {
    closed.current = true
    rec.current?.cancel()
    rec.current = null
    stopPlayer()
    onClose()
  }
  useLayer(true, close, ref)

  const begin = async () => {
    pause()
    setClip(null)
    setPhase('starting')
    if (!canRecord()) { toast(t('cantRecord'), 'error'); return onClose() }
    try {
      const r = await startRecording()
      if (closed.current) return r.cancel()
      rec.current = r
      setPhase('recording')
      navigator.vibrate?.(15)
    } catch (e) {
      toast(t(e.code || 'cantRecord'), 'error')
      onClose()
    }
  }

  const finish = async () => {
    const r = rec.current
    if (!r) return
    rec.current = null
    try {
      const c = await r.stop()
      setClip(c)
      setPhase('review')
      navigator.vibrate?.([10, 40, 10])
    } catch (e) {
      toast(t(e.code || 'cantRecord'), 'error')
      setPhase('ready')
    }
  }

  const send = async () => {
    stopPlayer()
    const c = { ...clip, fx }
    if (target.kind === 'bio') {
      setPhase('sending')
      try {
        const data = await sendClip('/me/bio', c)
        closed.current = true
        onSent?.(data)
        onClose()
      } catch (e) { toast(e.message, 'error'); setPhase('review') }
      return
    }
    const path = { dm: `/chats/${target.user?.handle}`, group: `/groups/${target.group?.id}` }[target.kind] || '/posts'
    const extra = { reply_to: target.replyTo, prompt: target.prompt ? '1' : null }
    closed.current = true
    enqueue(path, c, { kind: target.kind, extra }).then(d => d && onSent?.(d))
    onClose()
  }

  useEffect(() => {
    begin()
    return () => { closed.current = true; rec.current?.cancel() }
  }, [])

  // Drive the live waveform straight from the mic level
  useEffect(() => {
    if (phase !== 'recording') return
    let raf
    const loop = () => {
      const r = rec.current
      if (!r) return
      const tt = r.elapsed()
      if (live.current) {
        const bars = live.current.children, s = r.samples
        for (let i = 0; i < bars.length; i++) {
          const v = s[s.length - bars.length + i] ?? 0
          bars[i].style.height = Math.max(4, Math.min(100, v * 140)) + '%'
          bars[i].style.opacity = i > bars.length - 4 ? 1 : 0.35 + (i / bars.length) * 0.65
        }
      }
      setElapsed(tt)
      if (tt >= MAX_SECONDS) return finish()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const verb = { dm: 'send', group: 'send', reply: 'reply', bio: 'save' }[target.kind] || 'post'
  const title = {
    post: t('newYap'), reply: t('replyTo', { name: target.user?.name.split(' ')[0] }),
    dm: t('toName', { name: target.user?.name }), group: t('toName', { name: target.group?.name }), bio: t('voiceBio'),
  }[target.kind]
  const previewOf = k => clip && { id: 'preview-' + k + clip.url, audio: clip.url, fx: k, duration: clip.duration }
  const preview = previewOf(fx)

  return portal(
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
      className="fixed inset-0 z-[60] flex justify-center bg-bg outline-none"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={SPRING}>
      <div className="relative flex w-full max-w-[520px] flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex h-12 items-center">
          <button type="button" onClick={close} className="-ml-1 h-11 min-w-[64px] px-1 text-left text-[17px] text-accent">{t('cancel')}</button>
          <div className="min-w-0 flex-1 truncate text-center text-[17px] font-semibold">{title}</div>
          <div className="w-[64px]" />
        </div>
        {target.prompt && (
          <div className="mx-auto mt-3 max-w-[360px] text-center">
            <div className="text-[13px] font-semibold uppercase tracking-[0.03em] text-accent">{t('dailyQuestion')}</div>
            <div className="mt-1 text-[24px] font-bold leading-tight">{target.prompt}</div>
          </div>
        )}

        <div className="relative flex flex-1 flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {(phase === 'recording' || phase === 'starting' || phase === 'ready') && (
              <motion.div key="rec" className="flex w-full flex-col items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <div className="text-[64px] font-light tabular-nums tracking-[-0.03em]" aria-live="off">{fmt(elapsed)}</div>
                <div ref={live} className="mt-8 flex h-20 w-full items-center gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 48 }, (_, i) => <span key={i} className="flex-1 rounded-full bg-label" style={{ height: '4%' }} />)}
                </div>
                <div className="mt-6 h-5 text-[16px] tabular-nums text-muted">
                  {phase === 'recording' ? t('secondsLeft', { n: Math.max(0, Math.ceil(MAX_SECONDS - elapsed)) }) : phase === 'ready' ? t('tapToRecordAgain') : ''}
                </div>
              </motion.div>
            )}
            {(phase === 'review' || phase === 'sending') && clip && (
              <motion.div key="review" className="w-full" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING}>
                <div className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
                  <PlayButton item={preview} size={52} />
                  <Waveform id={preview.id} wave={clip.wave} height={44} />
                  <span className="w-11 text-right text-[15px] font-medium tabular-nums text-muted">{fmt(clip.duration)}</span>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-[2px] rounded-[10px] bg-fill p-[2px]" role="radiogroup" aria-label={t('voiceEffect')}>
                  {EFFECTS.map(k => (
                    <button key={k} type="button" role="radio" aria-checked={fx === k}
                      onClick={() => { setFx(k); play(previewOf(k)) }}
                      className={`h-[40px] rounded-[8px] text-[15px] font-semibold transition-colors ${fx === k ? 'bg-[var(--seg-on)] shadow-sm' : 'text-muted'}`}>
                      {t('fx_' + (k || 'none'))}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex h-24 items-center justify-center gap-3">
          {(phase === 'recording' || phase === 'ready' || phase === 'starting') && (
            <motion.button type="button" whileTap={{ scale: 0.92 }}
              onClick={phase === 'recording' ? finish : phase === 'ready' ? begin : undefined}
              className="relative grid h-[78px] w-[78px] place-items-center rounded-full border-[4px] border-label"
              aria-label={phase === 'recording' ? t('stopRecording') : t('record')}>
              <motion.span className="block bg-[var(--red)]"
                animate={phase === 'recording' ? { width: 30, height: 30, borderRadius: 7 } : { width: 62, height: 62, borderRadius: 31 }}
                transition={SPRING} />
              {phase === 'starting' && <span className="absolute text-white"><Spinner size={22} /></span>}
            </motion.button>
          )}
          {(phase === 'review' || phase === 'sending') && (
            <>
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={begin} disabled={phase === 'sending'} className="h-[52px] rounded-full bg-fill px-6 text-[17px] font-semibold">{t('retake')}</motion.button>
              <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={send} disabled={phase === 'sending'}
                className="flex h-[52px] flex-1 items-center justify-center rounded-full bg-accent text-[17px] font-semibold text-white">
                {phase === 'sending' ? <Spinner /> : t(verb)}
              </motion.button>
            </>
          )}
        </div>
      </div>
    </motion.div>,
  )
}
