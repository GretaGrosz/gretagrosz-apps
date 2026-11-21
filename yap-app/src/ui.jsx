// Shared building blocks: avatars, waveforms, play buttons, sheets, pages, action sheets, toasts, icons.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import { play, seek, usePlayer } from './audio.js'
import { t, lang } from './i18n.js'

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)
export const SPRING = { type: 'spring', stiffness: 380, damping: 34 }

export function Avatar({ user, size = 44, ring = false, onClick, label }) {
  const Tag = onClick ? 'button' : 'span'
  // The official @yap account wears the app icon, everyone else their emoji
  const face = user?.bot && user?.handle === 'yap' ? (
    <img src="/yap/icon-180.png" alt="" draggable="false" className="block h-full w-full rounded-full object-cover" />
  ) : (
    <span className="grid h-full w-full place-items-center rounded-full bg-fill" style={{ fontSize: size * 0.5 }}>
      <span className="leading-none">{user?.emoji || '🙂'}</span>
    </span>
  )
  return (
    <Tag
      {...(onClick ? { type: 'button', onClick, 'aria-label': label || user?.name } : { 'aria-hidden': true })}
      className={`relative block shrink-0 select-none rounded-full ${onClick ? 'hit-area' : ''} ${ring ? 'bg-accent p-[2.5px]' : ''}`}
      style={{ width: size, height: size, '--hit-size': size + 'px' }}
    >
      {ring ? <span className="block h-full w-full rounded-full bg-bg p-[2px]">{face}</span> : face}
    </Tag>
  )
}

export const fmt = s => {
  s = Math.max(0, Math.round(s || 0))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

export function timeAgo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000)
  if (s < 45) return t('now')
  if (s < 3600) return Math.round(s / 60) + (lang() === 'de' ? ' Min.' : 'm')
  if (s < 86400) return Math.round(s / 3600) + (lang() === 'de' ? ' Std.' : 'h')
  if (s < 86400 * 7) return Math.round(s / 86400) + (lang() === 'de' ? ' T.' : 'd')
  return new Date(ts).toLocaleDateString(lang(), { day: 'numeric', month: 'short' })
}

/** "Today", "Yesterday", the weekday this week, else the date */
export function dayLabel(ts) {
  const d = new Date(ts), now = new Date()
  const start = x => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(now) - start(d)) / 86400_000)
  if (days === 0) return t('today')
  if (days === 1) return t('yesterday')
  if (days < 7) return d.toLocaleDateString(lang(), { weekday: 'long' })
  return d.toLocaleDateString(lang(), { day: 'numeric', month: 'long', ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}) })
}

/** Waveform bars; the played part fills in. `id` ties it to the shared player. */
export function Waveform({ id, wave, height = 36, played = 'var(--label)', idle = 'var(--wave-idle)' }) {
  const p = usePlayer()
  const active = p.item?.id === id
  const progress = active ? p.progress : 0
  const ref = useRef(null)
  const bars = wave?.length ? wave : Array(40).fill(12)
  const onSeek = e => {
    if (!active) return
    const r = ref.current.getBoundingClientRect()
    seek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)))
    e.stopPropagation()
  }
  return (
    <div ref={ref} onClick={onSeek} className="flex min-w-0 flex-1 items-center gap-[2px]" style={{ height }}>
      {bars.map((v, i) => (
        <span key={i} className="flex-1 rounded-full transition-colors duration-150" style={{ height: Math.max(10, v) + '%', background: (i + 0.5) / bars.length <= progress ? played : idle }} />
      ))}
    </div>
  )
}

export function PlayButton({ item, next, ended, size = 44, tone = 'label', label }) {
  const p = usePlayer()
  const active = p.item?.id === item.id
  const playing = active && p.playing
  const colors = tone === 'accent' ? 'bg-accent text-white' : tone === 'onAccent' ? 'bg-white text-accent-ink' : 'bg-label text-bg'
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={e => { e.stopPropagation(); play(item, { next, ended }) }}
      className="hit grid shrink-0 place-items-center rounded-full"
      style={{ width: Math.max(size, 44), height: Math.max(size, 44), margin: size < 44 ? (size - 44) / 2 : 0 }}
      aria-label={(playing ? t('pause') : t('play')) + (label ? ' · ' + label : '')}
    >
      <span className={`grid place-items-center rounded-full ${colors}`} style={{ width: size, height: size }}>
        {active && p.loading ? <Spinner size={size * 0.36} /> : playing ? <Icon.Pause size={size * 0.38} /> : <Icon.Play size={size * 0.4} className="ml-[2px]" />}
      </span>
    </motion.button>
  )
}

/** What was said (automatic captions); tap to read all of it */
export function Caption({ text, className = '', color = 'text-muted' }) {
  const [open, setOpen] = useState(false)
  if (!text) return null
  return (
    <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o) }} aria-expanded={open}
      className={`hit-y block w-full text-left text-[15px] leading-snug ${color} ${open ? '' : 'line-clamp-2'} ${className}`}>
      {text}
    </button>
  )
}

export function Spinner({ size = 18 }) {
  return <span role="status" aria-label={t('loading')} className="inline-block animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none motion-reduce:opacity-60" style={{ width: size, height: size }} />
}

// ---------- layers: sheets and pages over the app ----------
// The top layer closes on Escape; everything under it is inert (no focus, no taps), and focus moves in and back.

const layers = []
function syncInert() {
  const base = document.getElementById('app-base')
  const top = layers[layers.length - 1]
  if (base) base.inert = layers.length > 0
  for (const l of layers) if (l.el.current) l.el.current.inert = l !== top
}
export function useLayer(open, onClose, el) {
  const close = useRef(onClose)
  close.current = onClose
  useLayoutEffect(() => {
    if (!open) return
    const entry = { el, close: () => close.current?.() }
    const before = document.activeElement
    layers.push(entry)
    syncInert()
    requestAnimationFrame(() => {
      const node = el.current
      if (node && !node.contains(document.activeElement)) (node.querySelector('[data-autofocus]') || node).focus({ preventScroll: true })
    })
    return () => {
      layers.splice(layers.indexOf(entry), 1)
      syncInert()
      if (before && document.contains(before)) before.focus?.({ preventScroll: true })
    }
  }, [open])
}
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && layers.length) { e.preventDefault(); layers[layers.length - 1].close() }
  })
}
export const layerOpen = () => layers.length > 0
/** Layers live directly in <body>, so making the app (or a page under a sheet) inert never reaches them */
export const portal = node => createPortal(node, document.body)

/** Bottom sheet; drag the grabber (or the sheet) down to close */
export function Sheet({ open, onClose, children, full = false, label, z = 50 }) {
  return (
    <AnimatePresence>
      {open && <SheetBody onClose={onClose} full={full} label={label} z={z}>{children}</SheetBody>}
    </AnimatePresence>
  )
}
function SheetBody({ onClose, children, full, label, z }) {
  const ref = useRef(null)
  const drag = useDragControls()
  useLayer(true, onClose, ref)
  return portal(
    <motion.div className="fixed inset-0 flex items-end justify-center lg:items-center" style={{ zIndex: z }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`glass-sheet relative flex w-full max-w-[520px] flex-col overflow-hidden rounded-t-[22px] outline-none lg:rounded-[22px] ${full ? 'h-[94dvh] lg:h-[86dvh]' : 'max-h-[94dvh]'}`}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={SPRING}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.9 }}
        onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) onClose() }}
      >
        <div className="flex h-5 shrink-0 cursor-grab touch-none items-center justify-center" onPointerDown={e => drag.start(e)} aria-hidden="true">
          <span className="h-[5px] w-9 rounded-full bg-[var(--grabber)]" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col" onPointerDown={e => { if (e.target.closest('[data-drag-handle]')) drag.start(e) }}>{children}</div>
      </motion.div>
    </motion.div>,
  )
}

/** Sheet header: a centred title, with Cancel/Close or an action on the sides; dragging it closes the sheet */
export function SheetHeader({ title, onClose, closeLabel, right }) {
  return (
    <div data-drag-handle className="relative flex h-11 shrink-0 touch-none items-center justify-center px-14">
      {onClose && <button type="button" onClick={onClose} className="absolute left-2 h-11 px-2 text-[17px] text-accent">{closeLabel || t('cancel')}</button>}
      <div className="truncate text-[17px] font-semibold">{title}</div>
      {right && <div className="absolute right-2">{right}</div>}
    </div>
  )
}

/** iOS action sheet: a list of choices and Cancel. actions: [{ label, onClick, destructive, icon }] */
export function ActionSheet({ open, onClose, title, message, actions = [] }) {
  return (
    <AnimatePresence>
      {open && <ActionSheetBody onClose={onClose} title={title} message={message} actions={actions} />}
    </AnimatePresence>
  )
}
function ActionSheetBody({ onClose, title, message, actions }) {
  const ref = useRef(null)
  useLayer(true, onClose, ref)
  return portal(
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={title || message} tabIndex={-1}
        className="relative w-full max-w-[440px] px-2 pb-[max(8px,env(safe-area-inset-bottom))] outline-none"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={SPRING}>
        <div className="overflow-hidden rounded-[14px] bg-elevated">
          {(title || message) && (
            <div className="border-b border-line px-4 py-3 text-center">
              {title && <div className="text-[13px] font-semibold text-muted">{title}</div>}
              {message && <div className="mt-0.5 text-[13px] text-muted">{message}</div>}
            </div>
          )}
          {actions.filter(Boolean).map((a, i) => (
            <button key={i} type="button" data-autofocus={i === 0 ? '' : undefined} onClick={() => { onClose(); a.onClick() }}
              className={`flex h-[57px] w-full items-center justify-center gap-2 border-b border-line text-[20px] last:border-0 active:bg-fill ${a.destructive ? 'text-[var(--red)]' : 'text-accent'}`}>
              {a.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={onClose} className="mt-2 h-[57px] w-full rounded-[14px] bg-elevated text-[20px] font-semibold text-accent active:bg-fill">{t('cancel')}</button>
      </motion.div>
    </motion.div>,
  )
}

/** Full-screen page pushed over the tabs, with a glass nav bar. Swipe from the left edge to go back. */
export function Page({ children, onBack, title, right, label, pane = false }) {
  const ref = useRef(null)
  const drag = useDragControls()
  // pane: a chat beside the chat list on wide screens; the list stays usable, so it is not a modal layer
  useLayer(!pane, onBack, ref)
  return portal(
    <motion.div
      ref={ref}
      role={pane ? 'region' : 'dialog'}
      aria-label={label}
      tabIndex={-1}
      className={`page fixed inset-0 z-40 mx-auto flex flex-col bg-bg outline-none ${pane ? 'lg:left-[620px] lg:z-20' : 'lg:left-auto lg:w-[560px] lg:border-l lg:border-line lg:shadow-2xl'}`}
      initial={pane ? { opacity: 0 } : { x: '100%' }}
      animate={pane ? { opacity: 1 } : { x: 0 }}
      exit={pane ? { opacity: 0 } : { x: '100%' }}
      transition={pane ? { duration: 0.12 } : SPRING}
      drag="x"
      dragControls={drag}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 1 }}
      onDragEnd={(_, i) => { if (i.offset.x > 90 || i.velocity.x > 500) onBack() }}
    >
      <div className="absolute inset-y-0 left-0 z-10 w-5 touch-none lg:hidden" onPointerDown={e => drag.start(e)} aria-hidden="true" />
      <header className="glass-bar sticky top-0 z-[5] flex shrink-0 items-center gap-1 px-1.5 pb-1 pt-[max(6px,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center text-accent" aria-label={t('back')}>
          <Icon.Back size={24} />
        </button>
        <div className="min-w-0 flex-1">{title}</div>
        {right || <div className="w-11" />}
      </header>
      {children}
    </motion.div>,
  )
}

// ---------- toasts: one at a time, above the tab bar or composer ----------

let pushToast = () => {}
export const toast = (text, kind = 'info') => pushToast({ text, kind, id: Math.random() })
export function Toasts() {
  const [cur, setCur] = useState(null)
  useEffect(() => {
    let timer
    pushToast = x => { clearTimeout(timer); setCur(x); timer = setTimeout(() => setCur(c => (c?.id === x.id ? null : c)), x.kind === 'error' ? 4000 : 2600) }
    return () => { pushToast = () => {} }
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(max(12px,env(safe-area-inset-bottom))+84px)] z-[100] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {cur && (
          <motion.div key={cur.id} initial={{ y: 16, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 8, opacity: 0 }} transition={SPRING}
            className="flex max-w-[420px] items-center gap-2 rounded-full bg-[var(--toast)] px-4 py-2.5 text-[15px] font-medium text-[var(--toast-ink)] shadow-xl">
            {cur.kind === 'error' && <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--red)]" />}
            <span>{cur.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function useInterval(fn, ms, on = true) {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => {
    if (!on) return
    const id = setInterval(() => document.visibilityState === 'visible' && saved.current(), ms)
    return () => clearInterval(id)
  }, [ms, on])
}

export function Empty({ icon, title, children }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      {icon && <div className="mb-4 text-muted">{icon}</div>}
      <div className="text-[20px] font-semibold">{title}</div>
      {children}
    </div>
  )
}

/** A list that couldn't load: one line and Retry */
export function LoadError({ onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-16 text-center">
      <div className="text-[17px] text-muted">{t('couldntLoad')}</div>
      <Button kind="tinted" className="h-11 px-5" onClick={onRetry}>{t('retry')}</Button>
    </div>
  )
}

/** Loading the first time / failed with nothing to show / the content */
export function Loadable({ res, children, skeleton }) {
  if (res.data !== undefined) return children(res.data)
  if (res.error) return <LoadError onRetry={res.reload} />
  return skeleton || <div className="grid place-items-center py-20 text-muted"><Spinner size={24} /></div>
}

export function Button({ children, kind = 'accent', className = '', ...props }) {
  const k = kind === 'accent' ? 'bg-accent text-white' : kind === 'tinted' ? 'bg-accent-soft text-accent' : kind === 'label' ? 'bg-label text-bg' : 'bg-fill text-label'
  return (
    <motion.button type="button" whileTap={{ scale: 0.97 }} className={`flex items-center justify-center gap-2 rounded-full text-[17px] font-semibold disabled:opacity-40 ${k} ${className}`} {...props}>
      {children}
    </motion.button>
  )
}

/** A grouped list row (iOS settings style) */
export function Row({ icon, title, value, onClick, destructive, children, chevron = !!onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left ${onClick ? 'active:bg-fill' : ''}`}>
      {icon && <span className={destructive ? 'text-[var(--red)]' : 'text-muted'}>{icon}</span>}
      <span className={`min-w-0 flex-1 text-[17px] ${destructive ? 'text-[var(--red)]' : ''}`}>{title}</span>
      {value != null && <span className="shrink-0 text-[17px] text-muted">{value}</span>}
      {children}
      {chevron && <Icon.Chevron size={16} className="shrink-0 text-[var(--label-3)]" />}
    </Tag>
  )
}
export function Group({ title, children, footer }) {
  return (
    <section className="mt-6">
      {title && <h2 className="mb-1.5 px-4 text-[13px] uppercase tracking-[0.02em] text-muted">{title}</h2>}
      <div className="divide-y divide-line overflow-hidden rounded-[12px] bg-surface">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] text-muted">{footer}</p>}
    </section>
  )
}

// ---------- icons (one stroke weight, SF-Symbols-like) ----------

const svg = (d, { fill = false, sw = 1.9 } = {}) => function I({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}
export const Icon = {
  Play: svg(<path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.5-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8Z" />, { fill: true }),
  Pause: svg(<><rect x="5.5" y="4" width="4.5" height="16" rx="1.4" /><rect x="14" y="4" width="4.5" height="16" rx="1.4" /></>, { fill: true }),
  Mic: svg(<><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></>),
  MicFill: svg(<><rect x="8.5" y="2" width="7" height="13" rx="3.5" fill="currentColor" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" /></>),
  Home: svg(<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5v-9.5Z" />),
  HomeFill: svg(<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5v-6h-6v6H4a.5.5 0 0 1-.5-.5v-9.5Z" fill="currentColor" />),
  Chat: svg(<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z" />),
  ChatFill: svg(<path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z" fill="currentColor" />),
  Users: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2" /></>),
  UsersFill: svg(<><circle cx="9" cy="8" r="3.8" fill="currentColor" /><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5Z" fill="currentColor" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.7 2.5 3 5.2" /></>),
  Back: svg(<path d="M15 4.5 7.5 12l7.5 7.5" />, { sw: 2.3 }),
  Close: svg(<path d="M6 6l12 12M18 6 6 18" />, { sw: 2.1 }),
  Next: svg(<><path d="M5 5.5v13l9-6.5-9-6.5Z" fill="currentColor" /><path d="M18 5v14" /></>),
  Prev: svg(<><path d="M19 5.5v13l-9-6.5 9-6.5Z" fill="currentColor" /><path d="M6 5v14" /></>),
  Reply: svg(<path d="M9.5 6.5 4 12l5.5 5.5M4.5 12H14a6 6 0 0 1 6 6v.5" />),
  Heart: svg(<path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11Z" />),
  HeartFill: svg(<path d="M12 20.5s-8.5-5-8.5-11A4.8 4.8 0 0 1 12 6.6a4.8 4.8 0 0 1 8.5 2.9c0 6-8.5 11-8.5 11Z" />, { fill: true }),
  Share: svg(<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />),
  Plus: svg(<path d="M12 5v14M5 12h14" />, { sw: 2.1 }),
  Check: svg(<path d="m5 12.5 4.5 4.5L19 7.5" />, { sw: 2.3 }),
  Search: svg(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  Dots: svg(<><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>),
  Chevron: svg(<path d="m9 5 7 7-7 7" />, { sw: 2.2 }),
  ChevronDown: svg(<path d="m6 9 6 6 6-6" />, { sw: 2.2 }),
  Bell: svg(<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 21h4" />),
  Ear: svg(<><path d="M7 9.5a5 5 0 0 1 10 0c0 2.6-1.8 3.8-2.9 5-1 1.1-1.1 2-1.6 3.4A2.6 2.6 0 0 1 7.6 17" /><path d="M10 10a2 2 0 0 1 4 0c0 1-.7 1.5-1.4 2" /></>),
  Waveform: svg(<path d="M3 12h1.5M6.5 8v8M10 4.5v15M13.5 8.5v7M17 6v12M20.5 10.5v3" />),
  Headphones: svg(<><path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3.5" y="14" width="4.5" height="6.5" rx="1.6" /><rect x="16" y="14" width="4.5" height="6.5" rx="1.6" /></>),
  NewGroup: svg(<><path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12Z" /><path d="M12 8.5v7M8.5 12h7" /></>),
  Passkey: svg(<><circle cx="10" cy="7.5" r="3.5" /><path d="M3.5 20c.5-3.8 3-6 6.5-6 1.2 0 2.3.3 3.2.8" /><circle cx="18" cy="14.5" r="2.5" /><path d="M18 17v4.5M18 19.5h1.8" /></>),
  Question: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 1.9-2.2 3.3M12 16.6h.01" /></>),
  Leave: svg(<path d="M14.5 4.5h4a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4M10 8l-4 4 4 4M6 12h10" />),
  Flag: svg(<path d="M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11" />),
  Block: svg(<><circle cx="12" cy="12" r="8.5" /><path d="m6 6 12 12" /></>),
  Link: svg(<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />),
  Globe: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5S9.6 5.9 12 3.5Z" /></>),
  Shield: svg(<path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z" />),
  Devices: svg(<><rect x="3" y="5" width="13" height="10" rx="1.5" /><path d="M7 19h5" /><rect x="17.5" y="9" width="4" height="10" rx="1" /></>),
  Trash: svg(<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />),
  ArrowUp: svg(<path d="M12 19V5M6 11l6-6 6 6" />, { sw: 2.2 }),
  Wifi: svg(<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />),
}
