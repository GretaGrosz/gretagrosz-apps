// One sitting of Practice, full screen: draw a topic, think, speak for 1, 3 or 5 minutes, then the coach's notes.
// If the upload fails the recording stays here for another try; if the analysis fails the recording is already
// saved on the server and can be analysed again from here or later from the list. It never counts as a result.
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { api } from './api.js'
import { canRecord, startRecording } from './audio.js'
import { t } from './i18n.js'
import { Button, Card, Icon, IconButton, useApp, useEscape, useInertRoot, fmt } from './ui.jsx'
import { MIN_TALK, MODES, Ring } from './minute-parts.jsx'
import MinuteResult from './minute-result.jsx'

const wait = ms => new Promise(r => setTimeout(r, ms))
const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 } }

/** prefs: { length, lang, source }; topic: a fixed topic (again, same topic); lastNote: the coach's last "next time" */
export default function Session({ prefs, topic: fixedTopic, lastNote, onClose, onSaved, onDeleted }) {
  const { toast } = useApp()
  const reduce = useReducedMotion()
  const LEN = prefs.length
  const THINK = MODES[LEN].think
  const [phase, setPhaseState] = useState(fixedTopic ? 'ready' : 'draw') // draw | ready | think | starting | tap | speak | sending | failed | result
  const [topic, setTopic] = useState(fixedTopic || '')
  const [face, setFace] = useState(fixedTopic || 'back')
  const [redrawn, setRedrawn] = useState(!!fixedTopic)
  const [mic, setMic] = useState('pending') // pending | ready | an error message
  const [tm, setT] = useState(0)
  const [clip, setClip] = useState(null)
  const [minute, setMinute] = useState(null)
  const [error, setError] = useState(null) // { kind: 'upload' | 'analysis', message }
  const [retrying, setRetrying] = useState(false)
  const [locked, setLocked] = useState(!!fixedTopic) // the same topic again: no redraw
  const phaseRef = useRef(phase)
  const topicRef = useRef(fixedTopic || '')
  const closed = useRef(false)
  const warm = useRef(null) // the mic opened on Start, so speaking can begin without another tap
  const warmP = useRef(null)
  const rec = useRef(null)
  const bars = useRef(null)
  const level = useRef(null)
  const setPhase = p => { phaseRef.current = p; setPhaseState(p) }

  const release = () => {
    warm.current?.cancel(); warm.current = null
    rec.current?.cancel(); rec.current = null
  }

  // Back (browser, Android, iOS swipe) and Escape close the session like the close button
  useEffect(() => {
    closed.current = false
    history.pushState({ ...history.state, layer: 'session' }, '')
    const onPop = () => { if (history.state?.layer !== 'session') finishClose(false) }
    window.addEventListener('popstate', onPop)
    if (!fixedTopic) draw()
    const html = document.documentElement.style
    const was = html.overflow
    html.overflow = 'hidden'
    return () => { window.removeEventListener('popstate', onPop); closed.current = true; release(); html.overflow = was }
  }, [])
  const finishClose = (popHistory = true) => {
    if (closed.current) return
    closed.current = true
    release()
    if (popHistory && history.state?.layer === 'session') history.back()
    onClose()
  }
  useEscape(() => finishClose())
  useInertRoot(true)

  // ---------- draw ----------
  async function draw() {
    setFace('back')
    const t0 = Date.now()
    try {
      const q = new URLSearchParams({ lang: prefs.lang, source: prefs.source, ...(topicRef.current ? { skip: topicRef.current } : {}) })
      const { topic: next } = await api('/minute/topic?' + q)
      await wait(Math.max(0, (reduce ? 0 : 650) - (Date.now() - t0)))
      if (closed.current) return
      topicRef.current = next
      setTopic(next)
      setFace(next)
    } catch (e) {
      toast(e.message, 'error')
      if (!topicRef.current) finishClose()
      else setFace(topicRef.current)
    }
  }
  const redraw = () => { setRedrawn(true); draw() }

  // ---------- think ----------
  const start = () => {
    if (!canRecord()) return toast(t('session.cantRecord'), 'error')
    setPhase('think')
    setT(0)
    setMic('pending')
    // Asking for the mic inside this tap is what lets iOS open it again, tap-free, when the countdown ends
    warmP.current = startRecording(MODES[LEN].bitrate).then(r => {
      if (closed.current || !['think', 'starting'].includes(phaseRef.current)) return r.cancel()
      warm.current = r
      setMic('ready')
    }, e => setMic(e.message))
    navigator.vibrate?.(10)
  }

  useEffect(() => {
    if (phase !== 'think') return
    const t0 = performance.now()
    let raf
    const loop = () => {
      const s = (performance.now() - t0) / 1000
      setT(s)
      if (level.current) level.current.style.transform = `scale(${1 + (warm.current?.level() || 0) * 1.6})`
      if (s >= THINK) return speak()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // ---------- speak ----------
  async function speak(fromTap = false) {
    if (!fromTap && phaseRef.current !== 'think') return
    setPhase('starting')
    if (!fromTap) await warmP.current?.catch(() => {})
    try {
      const r = await startRecording(MODES[LEN].bitrate)
      if (closed.current) return r.cancel()
      rec.current = r
      warm.current?.cancel(); warm.current = null
      setT(0)
      setPhase('speak')
      navigator.vibrate?.(15)
    } catch (e) {
      warm.current?.cancel(); warm.current = null
      setMic(e.message)
      setPhase('tap')
    }
  }

  useEffect(() => {
    if (phase !== 'speak') return
    let raf
    const loop = () => {
      const r = rec.current
      if (!r) return
      const s = r.elapsed()
      const el = bars.current
      if (el) {
        const n = el.children.length, smp = r.samples
        for (let i = 0; i < n; i++) {
          const v = smp[smp.length - n + i] ?? 0
          el.children[i].style.height = Math.max(6, Math.min(100, v * 150)) + '%'
          el.children[i].style.opacity = 0.3 + (i / n) * 0.7
        }
      }
      setT(s)
      if (s >= LEN) return finish()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  async function finish() {
    const r = rec.current
    if (!r) return
    rec.current = null
    navigator.vibrate?.([12, 70, 12])
    try {
      const c = await r.stop()
      setClip(c)
      upload(c)
    } catch (e) {
      toast(e.message, 'error')
      finishClose()
    }
  }

  // ---------- analyse ----------
  const landed = m => {
    onSaved(m)
    if (closed.current) return
    setMinute(m)
    if (m.status === 'failed') {
      setError({ kind: 'analysis' })
      setPhase('failed')
    } else {
      setPhase('result')
      navigator.vibrate?.(10)
    }
  }
  async function upload(c) {
    setPhase('sending')
    setError(null)
    const form = new FormData()
    const ext = c.mime.includes('mp4') ? 'm4a' : c.mime.includes('ogg') ? 'ogg' : 'webm'
    form.append('audio', new File([c.blob], 'talk.' + ext, { type: c.mime }))
    form.append('duration', String(Math.min(c.duration, LEN + 1)))
    form.append('topic', topicRef.current)
    form.append('length', String(LEN))
    form.append('lang', prefs.lang)
    try {
      const { minute: m } = await api('/minutes', { method: 'POST', form, timeout: 120000 })
      landed(m)
    } catch (e) {
      if (closed.current) return
      setError({ kind: 'upload', message: e.message })
      setPhase('failed')
    }
  }
  async function analyseAgain() {
    setRetrying(true)
    setPhase('sending')
    try {
      const { minute: m } = await api(`/minutes/${minute.id}/analyse`, { method: 'POST', timeout: 120000 })
      landed(m)
    } catch (e) {
      if (closed.current) return
      setError({ kind: 'analysis', message: e.message })
      setPhase('failed')
    } finally { setRetrying(false) }
  }

  // Again: the same topic straight to Start, or a fresh draw
  const again = same => {
    release()
    setClip(null); setMinute(null); setError(null); setT(0)
    if (same) {
      topicRef.current = same
      setTopic(same); setFace(same); setRedrawn(true); setLocked(true)
      setPhase('ready')
    } else {
      setRedrawn(false); setLocked(false)
      setPhase('draw')
      draw()
    }
  }

  const remove = async () => {
    try {
      await api(`/minutes/${minute.id}`, { method: 'DELETE' })
      onDeleted(minute.id)
      toast(t('result.deleted'))
      finishClose()
    } catch (e) { toast(e.message, 'error') }
  }

  const title = { draw: t('practice.title'), ready: t('practice.title'), think: t('session.think'), starting: t('session.speak'), tap: t('session.speak'), speak: t('session.recording'), sending: t('session.listening'), failed: t('session.notAnalysed'), result: t('session.yourTalk') }[phase]
  const left = Math.max(0, LEN - tm)

  return createPortal(
    <motion.div className="fixed inset-0 z-[45] overflow-hidden bg-bg" role="dialog" aria-modal="true" aria-label={t('practice.title')}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <div className={`relative mx-auto flex h-full max-w-[600px] flex-col ${phase === 'result' ? 'overflow-y-auto overscroll-contain' : ''}`}>
        <header className={`sticky top-0 z-10 flex shrink-0 items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] ${phase === 'result' ? 'glass' : ''}`}>
          <IconButton label={t('ui.close')} onClick={() => finishClose()} className="!bg-fill !shadow-none"><Icon.Close size={18} /></IconButton>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 text-[17px] font-semibold">
            {phase === 'speak' && <span className="h-2 w-2 rounded-full bg-danger" />}
            <span className="truncate" aria-live="polite">{title}</span>
          </div>
          <div className="w-11" />
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {(phase === 'draw' || phase === 'ready') && (
            <motion.div key="draw" {...fade} className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
              <div className="flex flex-1 items-center justify-center py-4"><TopicCard face={face} length={LEN} lang={prefs.lang} /></div>
              <div className="flex gap-3">
                {!locked && (
                  <Button kind="gray" size="lg" className="shrink-0 whitespace-nowrap !px-5" onClick={redraw} disabled={redrawn || face === 'back'}>
                    <Icon.Shuffle size={19} />{t('session.drawAnother')}
                  </Button>
                )}
                <Button size="lg" className="flex-1" onClick={start} disabled={face === 'back'}>{t('session.start')}</Button>
              </div>
            </motion.div>
          )}

          {['think', 'starting', 'tap', 'speak'].includes(phase) && (
            <motion.div key="clock" {...fade} className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
              <TopicLine topic={topic} quiet={phase !== 'think'} />
              <div className="flex flex-1 flex-col items-center justify-center">
                {phase === 'think' && (
                  <Ring size={240} stroke={9} progress={1 - tm / THINK}>
                    <div className="text-[84px] font-extralight leading-none tabular-nums">{Math.max(1, Math.ceil(THINK - tm))}</div>
                    <div className="mt-1 text-[15px] font-medium text-fg2">{t('session.thinkLeft')}</div>
                  </Ring>
                )}
                {(phase === 'speak' || phase === 'starting') && (
                  <Ring size={240} stroke={9} progress={phase === 'speak' ? tm / LEN : 0}>
                    <div className={`font-extralight leading-none tabular-nums transition-colors ${LEN > 60 ? 'text-[68px]' : 'text-[84px]'} ${left <= 10 && phase === 'speak' ? 'text-accent-ink' : ''}`}>
                      {LEN > 60 ? fmt(phase === 'speak' ? Math.ceil(left) : LEN) : phase === 'speak' ? Math.ceil(left) : LEN}
                    </div>
                    <div className="mt-1 text-[15px] font-medium text-fg2">{phase === 'speak' ? t('session.left') : t('session.go')}</div>
                  </Ring>
                )}
                {phase === 'tap' && (
                  <div className="flex flex-col items-center text-center">
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-surface text-accent-ink"><Icon.Mic size={40} /></div>
                    <div className="mt-5 text-[20px] font-semibold">{t('session.readyWhenYou')}</div>
                    {/allow|erlaub/i.test(mic) && <p className="mt-1.5 max-w-[290px] text-[15px] leading-snug text-fg2">{mic}</p>}
                  </div>
                )}

                {phase === 'think' && lastNote && (
                  <Card className="mt-6 w-full max-w-[380px] px-4 py-3">
                    <div className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-accent-ink">{t('session.lastTime')}</div>
                    <p className="mt-0.5 text-[15px] leading-snug">{lastNote}</p>
                  </Card>
                )}
                {phase === 'think' && <MicStatus mic={mic} levelRef={level} />}
                {(phase === 'speak' || phase === 'starting') && (
                  <div ref={bars} className="mt-8 flex h-14 w-full max-w-[300px] items-center gap-[3px]" aria-hidden="true">
                    {Array.from({ length: 44 }, (_, i) => <span key={i} className="flex-1 rounded-full bg-accent" style={{ height: '6%', opacity: 0.3 }} />)}
                  </div>
                )}
              </div>

              {phase === 'think' && <Button size="lg" className="w-full" onClick={() => speak()}>{t('session.ready')}</Button>}
              {(phase === 'speak' || phase === 'starting') && (
                <div className="flex gap-3">
                  <Button kind="gray" size="lg" className="flex-1" onClick={() => finishClose()}>{t('ui.cancel')}</Button>
                  <Button size="lg" className="flex-1" onClick={finish} disabled={phase !== 'speak' || tm < MIN_TALK}>
                    {tm < MIN_TALK && phase === 'speak' ? t('session.finishIn', { n: Math.ceil(MIN_TALK - tm) }) : t('session.finish')}
                  </Button>
                </div>
              )}
              {phase === 'tap' && <Button size="lg" className="w-full" onClick={() => speak(true)}><Icon.Mic size={20} />{t('session.startSpeaking')}</Button>}
            </motion.div>
          )}

          {phase === 'sending' && (
            <motion.div key="sending" {...fade} className="flex flex-1 flex-col px-5 pb-[max(28px,env(safe-area-inset-bottom))]">
              <TopicLine topic={topic} quiet />
              <Listening wave={clip?.wave} />
            </motion.div>
          )}

          {phase === 'failed' && (
            <motion.div key="failed" {...fade} className="flex flex-1 flex-col px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
              <TopicLine topic={topic} quiet />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-surface text-fg2"><Icon.Cloud size={34} /></div>
                <div className="mt-5 text-[22px] font-semibold">{error?.kind === 'analysis' ? t('result.failedTitle') : t('session.uploadFailed')}</div>
                <p className="mt-1.5 max-w-[300px] text-[15px] leading-snug text-fg2">{error?.kind === 'analysis' ? t('result.failedText') : t('session.uploadKept')}</p>
                {error?.message && <p className="mt-1 max-w-[300px] text-[14px] text-fg2">{error.message}</p>}
              </div>
              <Button size="lg" className="w-full" disabled={retrying} onClick={() => (error?.kind === 'analysis' ? analyseAgain() : upload(clip))}><Icon.Retry size={19} />{t('ui.retry')}</Button>
              <Button kind="plain" size="md" className="mx-auto mt-2 !text-fg" onClick={() => finishClose()}>{error?.kind === 'analysis' ? t('session.later') : t('session.discard')}</Button>
            </motion.div>
          )}

          {phase === 'result' && minute && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="pb-[calc(env(safe-area-inset-bottom)+32px)] pt-2">
              <MinuteResult minute={minute} src={clip?.url} onAgain={() => again(minute.topic)} onNew={() => again(null)} onDelete={remove} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  )
}

/** The drawn topic as a card; it flips over from its back when a topic arrives */
function TopicCard({ face, length, lang }) {
  return (
    <div className="w-full max-w-[360px]" style={{ perspective: 1200 }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={face}
          initial={{ rotateY: face === 'back' ? -90 : 90, scale: 0.96 }}
          animate={{ rotateY: 0, scale: 1, transition: { type: 'spring', damping: 22, stiffness: 260 } }}
          exit={{ rotateY: face === 'back' ? 90 : -90, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } }}>
          {face === 'back' ? (
            <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-[32px] bg-accent text-white" aria-label={t('session.drawing')}>
              <Icon.Practice size={56} />
            </div>
          ) : (
            <Card className="flex aspect-[4/5] flex-col !rounded-[32px] p-7">
              <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{t('practice.min', { n: length / 60 })} · {lang === 'de' ? 'Deutsch' : 'English'}</div>
              <div className="flex flex-1 items-center">
                <h2 lang={lang} className="serif prose-wrap text-[34px] font-medium leading-[1.15] [text-wrap:balance]">{face}</h2>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function TopicLine({ topic, quiet }) {
  return (
    <div className="mx-auto max-w-[360px] pt-3 text-center">
      <motion.div layout="position" className={`serif prose-wrap font-medium leading-[1.2] transition-[font-size,color] duration-300 [text-wrap:balance] ${quiet ? 'text-[19px] text-fg2' : 'text-[25px]'}`}>{topic}</motion.div>
    </div>
  )
}

function MicStatus({ mic, levelRef }) {
  const ok = mic === 'ready', pending = mic === 'pending'
  return (
    <div className="mt-6 flex h-9 max-w-full items-center gap-2.5 rounded-full bg-surface px-4 text-[14px] font-medium text-fg">
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        {ok && <span ref={levelRef} className="absolute inset-0 rounded-full bg-accent/30 transition-transform duration-75" />}
        <span className={`relative h-2 w-2 rounded-full ${ok ? 'bg-accent' : pending ? 'bg-fg2' : 'bg-danger'}`} />
      </span>
      <span className="truncate">{ok ? t('session.micReady') : pending ? t('session.micOpening') : mic}</span>
    </div>
  )
}

/** The wait while the server transcribes and the coach reads: your own waveform and one honest line */
function Listening({ wave }) {
  const reduce = useReducedMotion()
  const src = wave?.length ? wave : Array(40).fill(40)
  const n = 23
  const w = Array.from({ length: n }, (_, i) => Math.max(10, src[Math.floor((i / n) * src.length)]))
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex h-28 w-[220px] items-center gap-[4px]" aria-hidden="true">
        {w.map((v, i) => (
          <motion.span key={i} className="flex-1 rounded-full bg-accent" style={{ height: `${Math.max(8, v)}%` }}
            animate={reduce ? { opacity: 0.6 } : { opacity: [0.25, 1, 0.25] }} transition={{ duration: 1.6, repeat: reduce ? 0 : Infinity, delay: (i / n) * 1.1, ease: 'easeInOut' }} />
        ))}
      </div>
      <div className="serif mt-8 text-[28px] font-medium" role="status">{t('session.listeningBack')}</div>
    </div>
  )
}
