// Small pieces of Practice: lengths, progress rings, filler words, the pace note, trend lines and the recording player.
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { audioUrl } from './api.js'
import { t } from './i18n.js'
import { Icon, Spinner, fmt, useApp } from './ui.jsx'

// Talk length → thinking time and recording bitrate (5 minutes at 24 kbps stays well under the server's limit)
export const MODES = {
  60: { think: 15, bitrate: 64000 },
  180: { think: 30, bitrate: 32000 },
  300: { think: 60, bitrate: 24000 },
}
export const MIN_TALK = 20

/** A circular progress ring (progress 0-1) with content in the middle */
export function Ring({ size = 240, stroke = 10, progress = 0, animate = false, className = '', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, progress)))
  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-fill2" />
        {animate ? (
          <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" className="text-accent"
            strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }} transition={{ type: 'spring', damping: 30, stiffness: 70, delay: 0.15 }} />
        ) : (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" className="text-accent"
            strokeDasharray={c} strokeDashoffset={off} style={{ opacity: progress > 0.001 ? 1 : 0 }} />
        )}
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

/** The filler words the server counted, most frequent first */
export const fillerList = minute => Object.entries(minute.feedback?.fillerWords || {}).sort((a, b) => b[1] - a[1])

/** The transcript with its filler words picked out */
export function Transcript({ text, fillers }) {
  const words = fillers.map(([w]) => w).sort((a, b) => b.length - a.length)
  if (!words.length) return text
  const re = new RegExp(`(?<![\\p{L}])(${words.map(w => w.replace(/ /g, '\\s+')).join('|')})(?![\\p{L}])`, 'giu')
  return text.split(re).map((part, i) => i % 2
    ? <mark key={i} className="-mx-[2px] rounded-[5px] bg-accent/[0.14] px-[2px] text-accent-ink [box-decoration-break:clone]">{part}</mark>
    : part)
}

/** How a pace compares with a natural speaking pace (120–160 words a minute) */
export function paceNote(wpm) {
  if (wpm < 100) return t('pace.slow')
  if (wpm < 120) return t('pace.bitSlow')
  if (wpm <= 160) return t('pace.good')
  if (wpm <= 185) return t('pace.bitFast')
  return t('pace.fast')
}

/**
 * One coach score over your recent talks, as a sparkline. Single series, so no legend: the label names it.
 * Touch or hover a point to read it; the number on the right shows that talk, otherwise the latest.
 */
export function Spark({ label, values }) {
  const [at, setAt] = useState(null)
  const W = 160, H = 34, P = 4
  const n = values.length
  const x = i => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - 2 * P))
  const y = v => P + (1 - (v - 1) / 9) * (H - 2 * P)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const shown = at ?? n - 1
  const pick = e => {
    const r = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - r.left) / r.width * W - P) / ((W - 2 * P) / Math.max(1, n - 1)))
    setAt(Math.max(0, Math.min(n - 1, i)))
  }
  return (
    <div className="flex items-center gap-3">
      <span className="w-[84px] shrink-0 truncate text-[14px] text-fg2">{label}</span>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[34px] min-w-0 flex-1 touch-none overflow-visible" role="img"
        aria-label={`${label}: ${values.join(', ')}`} onPointerMove={pick} onPointerDown={pick} onPointerLeave={() => setAt(null)}>
        <line x1={P} x2={W - P} y1={y(5.5)} y2={y(5.5)} className="stroke-line" strokeWidth="1" strokeDasharray="2 3" />
        <path d={d} fill="none" stroke="rgb(var(--accent))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={x(shown)} cy={y(values[shown])} r="4" fill="rgb(var(--accent))" stroke="rgb(var(--surface))" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="w-6 shrink-0 text-right text-[17px] font-semibold tabular-nums">{values[shown]}</span>
    </div>
  )
}

/**
 * Play/pause with a draggable progress bar. The recording is fetched as soon as the player appears,
 * so play() runs inside the tap: iPhone Safari refuses to start audio after an await.
 */
export function Player({ src, duration }) {
  const { toast } = useApp()
  const audio = useRef(null)
  const bar = useRef(null)
  const [url, setUrl] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | playing | paused | error
  const [time, setTime] = useState(0)
  const [len, setLen] = useState(duration || 0)

  useEffect(() => {
    let live = true
    setState('loading')
    audioUrl(src).then(u => { if (live) { setUrl(u); setState('ready') } }, () => live && setState('error'))
    return () => { live = false; audio.current?.pause() }
  }, [src])

  // Move the bar smoothly while playing (timeupdate fires only a few times a second)
  useEffect(() => {
    if (state !== 'playing') return
    let raf
    const loop = () => { setTime(audio.current.currentTime); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [state])

  const toggle = () => {
    const a = audio.current
    if (state === 'error') {
      setState('loading')
      audioUrl(src).then(u => { setUrl(u); setState('ready') }, e => { setState('error'); toast(e.message, 'error') })
      return
    }
    if (!url) return
    if (state === 'playing') return a.pause()
    a.play().catch(() => setState('paused'))
  }

  const seekTo = clientX => {
    const a = audio.current
    if (!url || !bar.current) return
    const r = bar.current.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    a.currentTime = p * (a.duration && isFinite(a.duration) ? a.duration : len)
    setTime(a.currentTime)
  }
  const onPointerDown = e => { e.currentTarget.setPointerCapture(e.pointerId); seekTo(e.clientX) }
  const onPointerMove = e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) seekTo(e.clientX) }
  const onKey = e => {
    const a = audio.current
    if (!url || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return
    e.preventDefault()
    a.currentTime = Math.max(0, Math.min(len, a.currentTime + (e.key === 'ArrowRight' ? 5 : -5)))
    setTime(a.currentTime)
  }

  const p = len ? Math.min(1, time / len) : 0
  return (
    <div className="flex items-center gap-3.5">
      <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={toggle} aria-label={state === 'playing' ? t('player.pause') : t('player.play')}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent text-white">
        {state === 'loading' ? <Spinner size={18} /> : state === 'error' ? <Icon.Retry size={20} /> : state === 'playing' ? <Icon.Pause size={20} /> : <Icon.Play size={20} className="translate-x-[1px]" />}
      </motion.button>
      <div className="min-w-0 flex-1">
        <div ref={bar} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onKeyDown={onKey} tabIndex={0}
          className="relative -my-3 cursor-pointer touch-none py-3" role="slider" aria-label={t('player.position')} aria-valuemin={0} aria-valuemax={Math.round(len)} aria-valuenow={Math.round(time)} aria-valuetext={fmt(time)}>
          <div className="h-[5px] overflow-hidden rounded-full bg-fill2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${p * 100}%` }} />
          </div>
          <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]" style={{ left: `${p * 100}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[12.5px] font-medium tabular-nums text-fg2">
          <span>{fmt(time)}</span><span>{fmt(len)}</span>
        </div>
      </div>
      <audio ref={audio} src={url || undefined} preload="auto" className="hidden"
        onPlay={() => setState('playing')} onPause={() => setState('paused')} onEnded={() => { setState('paused'); setTime(0) }}
        onLoadedMetadata={e => isFinite(e.currentTarget.duration) && setLen(e.currentTarget.duration)} />
    </div>
  )
}
