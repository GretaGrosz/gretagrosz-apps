// Stance's building blocks: solid cards, buttons, sheets, pages, titles, toasts and icons.
// Glass is used only where content scrolls underneath (tab bar, nav bars, sheets, floating bars).
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion'
import { t, timeAgo } from './i18n.js'
import { useOnline } from './api.js'

export { timeAgo }
export const AppContext = createContext(null)
/** me, toast(text, 'error'?), navigation (open*), requireAccount (see App.jsx) */
export const useApp = () => useContext(AppContext)

// One spring for the whole suite
export const spring = { type: 'spring', stiffness: 380, damping: 34 }

// ---------- Escape closes the topmost layer ----------

const escStack = []
window.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || !escStack.length) return
  e.preventDefault()
  escStack[escStack.length - 1].current?.()
})
export function useEscape(handler, active = true) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    if (!active) return
    escStack.push(ref)
    return () => { const i = escStack.lastIndexOf(ref); if (i >= 0) escStack.splice(i, 1) }
  }, [active])
}

// ---------- modal layers make everything behind them inert ----------

let inertCount = 0
/** While active, the app root (everything but portals) can't be focused, tapped or read out */
export function useInertRoot(active) {
  useEffect(() => {
    if (!active) return
    const root = document.getElementById('root')
    inertCount++
    root?.setAttribute('inert', '')
    return () => { if (--inertCount === 0) root?.removeAttribute('inert') }
  }, [active])
}

// ---------- surfaces and buttons ----------

/** A solid card, the iOS grouped style */
export function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return <Tag className={`card relative rounded-[22px] ${className}`} {...props}>{children}</Tag>
}

/**
 * kind: 'accent' (filled, the one main action), 'gray' (secondary), 'plain' (text, accent), 'danger' (text, red).
 * size: 'lg' 50px, 'md' 44px, 'sm' 36px (its hit area still reaches 44px).
 */
export function Button({ kind = 'accent', size = 'md', className = '', type = 'button', children, ...props }) {
  const k = { accent: 'bg-accent text-white', gray: 'bg-fill text-fg', plain: 'text-accent-ink', danger: 'text-danger' }[kind]
  const s = { lg: 'h-[50px] px-6 text-[17px]', md: 'h-11 px-5 text-[16px]', sm: 'h-9 px-4 text-[15px] after:absolute after:-inset-y-1 after:inset-x-0' }[size]
  return (
    <motion.button type={type} whileTap={{ scale: 0.97 }} transition={spring}
      className={`relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-opacity disabled:opacity-40 ${s} ${k} ${className}`} {...props}>
      {children}
    </motion.button>
  )
}

/** Round floating button (44px) on glass, for nav bars: back, close, share */
export function IconButton({ label, className = '', children, ...props }) {
  return (
    <motion.button type="button" whileTap={{ scale: 0.9 }} aria-label={label} title={label}
      className={`glass grid h-11 w-11 shrink-0 place-items-center rounded-full text-fg ${className}`} {...props}>
      {children}
    </motion.button>
  )
}

/** Initials in a circle. Stance has no photos: you are what you argue. */
export function Avatar({ user, size = 40, onClick, className = '' }) {
  const initials = (user?.name || user?.handle || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => [...w][0]).join('').toUpperCase()
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag {...(onClick ? { type: 'button', onClick, 'aria-label': user?.name } : { 'aria-hidden': true })}
      className={`relative grid shrink-0 select-none place-items-center rounded-full bg-fill2 font-semibold text-fg2 ${onClick ? 'after:absolute after:-inset-1' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </Tag>
  )
}

/** "Name @handle · 2h": the name truncates first, the time never does; tap opens the profile */
export function Byline({ user, time, className = '' }) {
  const { openProfile } = useApp()
  return (
    <button type="button" onClick={() => openProfile(user.handle)} className={`relative flex min-h-[28px] w-full min-w-0 items-baseline gap-1.5 text-left after:absolute after:-inset-y-2 after:inset-x-0 ${className}`}>
      <span className="min-w-0 truncate text-[15px] font-semibold">{user.name}</span>
      <span className="min-w-0 shrink-[8] truncate text-[14px] text-fg2">@{user.handle}</span>
      {time ? <span className="shrink-0 text-[14px] text-fg2">· {timeAgo(time)}</span> : null}
    </button>
  )
}

/** The two sides: side 0 is the accent, side 1 neutral. The only colour coding in the app. */
export function SideTag({ side, label, className = '' }) {
  return (
    <span className={`inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-semibold ${side === 0 ? 'bg-accent/[0.12] text-accent-ink' : 'bg-fill text-fg'} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${side === 0 ? 'bg-accent' : 'bg-fg2'}`} /><span className="truncate">{label}</span>
    </span>
  )
}

/** Split bar for two sides: counts = [a, b] */
export function SplitBar({ counts, className = '' }) {
  const total = counts[0] + counts[1]
  const a = total ? Math.round((counts[0] / total) * 100) : 50
  return (
    <div className={`flex h-2.5 overflow-hidden rounded-full bg-fill2 ${className}`}>
      <motion.div className="h-full rounded-full bg-accent" initial={{ width: '50%' }} animate={{ width: `${a}%` }} transition={{ type: 'spring', stiffness: 160, damping: 26 }} />
    </div>
  )
}

/** iOS segmented control. options: [{ id, label }] */
export function Segmented({ options, value, onChange, className = '', label }) {
  const id = useRef('seg' + Math.random().toString(36).slice(2)).current
  return (
    <div className={`flex rounded-[10px] bg-fill p-[3px] ${className}`} role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={`relative h-[38px] min-w-0 flex-1 rounded-[8px] px-2 text-[14px] font-semibold transition-colors after:absolute after:-inset-y-[3px] after:inset-x-0 ${value === o.id ? 'text-fg' : 'text-fg2'}`}>
          {value === o.id && <motion.span layoutId={id} className="absolute inset-0 rounded-[8px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)] dark:bg-[#636366]" transition={spring} />}
          <span className="relative block truncate">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Multi-line text box that grows with its text; a counter appears only near the limits */
export function TextArea({ value, onChange, max, min = 0, placeholder, rows = 4, autoFocus, className = '', textClassName = 'text-[17px] leading-[1.45]', label, onSubmit }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  const left = max - value.length
  const short = value.trim().length && value.trim().length < min
  return (
    <div className={`relative ${className}`}>
      <textarea ref={ref} value={value} onChange={e => onChange(e.target.value.slice(0, max))} placeholder={placeholder} rows={rows} autoFocus={autoFocus} aria-label={label || placeholder}
        onKeyDown={e => { if (onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onSubmit() } }}
        className={`prose-wrap block w-full resize-none bg-transparent text-fg outline-none placeholder:text-fg3 ${textClassName}`} />
      <div className="mt-1 flex h-4 justify-end text-[12.5px] tabular-nums text-fg2">
        {short ? t('ui.more', { n: min - value.trim().length }) : left < 150 ? t('ui.left', { n: left }) : ''}
      </div>
    </div>
  )
}

/** Large iOS title with an optional control; a glass bar with the small title appears once you scroll */
export function LargeTitle({ title, subtitle, right }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <div className={`glass fixed inset-x-0 top-0 z-30 transition-opacity duration-200 ${scrolled ? 'opacity-100' : 'pointer-events-none opacity-0'}`} aria-hidden={!scrolled}>
        <div className="mx-auto flex h-[calc(env(safe-area-inset-top)+44px)] max-w-[600px] items-end justify-center px-16 pb-3 text-[17px] font-semibold"><span className="truncate">{title}</span></div>
      </div>
      <header className="flex items-end justify-between gap-3 px-5 pb-3 pt-[calc(env(safe-area-inset-top)+16px)]">
        <div className="min-w-0">
          {subtitle && <div className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.04em] text-fg2">{subtitle}</div>}
          <h1 className="truncate text-[34px] font-bold leading-[41px]">{title}</h1>
        </div>
        {right}
      </header>
    </>
  )
}

/** Full-screen page pushed over the tabs (slides in from the right) with a back button */
export function Page({ children, onBack, title, right, bottom, covered = false }) {
  const [scrolled, setScrolled] = useState(false)
  useEscape(onBack, !covered)
  return (
    <motion.div inert={covered ? '' : undefined} className="fixed inset-0 z-40 bg-bg" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={spring} role="dialog" aria-modal="true" aria-label={title || undefined}>
      <div onScroll={e => setScrolled(e.currentTarget.scrollTop > 8)} className="h-full overflow-y-auto overscroll-contain" data-page-scroll>
        <div className={`sticky top-0 z-20 transition-[background,box-shadow] duration-200 ${scrolled ? 'glass' : ''}`}>
          <div className="mx-auto flex max-w-[600px] items-center gap-2 px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)]">
            <IconButton label={t('ui.back')} onClick={onBack} className={scrolled ? '!bg-transparent !shadow-none !backdrop-filter-none' : ''}><Icon.Back size={22} /></IconButton>
            <div className={`min-w-0 flex-1 truncate text-center text-[17px] font-semibold transition-opacity ${scrolled ? 'opacity-100' : 'opacity-0'}`}>{title}</div>
            {right || <div className="w-11" />}
          </div>
        </div>
        <main className="mx-auto max-w-[600px] pb-[calc(env(safe-area-inset-bottom)+40px)]">{children}</main>
        {bottom}
      </div>
    </motion.div>
  )
}

/**
 * Bottom sheet (a centred dialog on wide screens). Escape, the backdrop, or dragging it down closes it.
 * Rendered into <body> so a transformed parent can't trap position: fixed. Focus moves in and comes back.
 */
export function Sheet({ open, onClose, children, full = false, title, z = 50, label }) {
  const panel = useRef(null)
  const drag = useDragControls()
  const reduce = useReducedMotion()
  useEscape(onClose, open)
  useInertRoot(open)
  useEffect(() => {
    if (!open) return
    const before = document.activeElement
    const id = setTimeout(() => {
      const el = panel.current
      if (!el || el.contains(document.activeElement)) return
      ;(el.querySelector('[autofocus],input,textarea') || el).focus({ preventScroll: true })
    }, 60)
    return () => { clearTimeout(id); before?.focus?.({ preventScroll: true }) }
  }, [open])
  const onDragEnd = (_, info) => { if (info.offset.y > 110 || info.velocity.y > 600) onClose() }
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 flex items-end justify-center sm:items-center" style={{ zIndex: z }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
          <div className="absolute inset-0 bg-black/35" onClick={onClose} aria-hidden="true" />
          <motion.div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label || (typeof title === 'string' ? title : undefined)}
            className={`glass glass-sheet relative mx-2 flex w-full max-w-[600px] flex-col overflow-hidden rounded-[32px] outline-none sm:mx-4 ${full ? 'h-[calc(100dvh-env(safe-area-inset-top)-24px)] sm:h-[min(820px,calc(100dvh-48px))]' : 'max-h-[88dvh]'}`}
            style={{ marginBottom: 'max(8px, env(safe-area-inset-bottom))' }}
            drag={reduce ? false : 'y'} dragListener={false} dragControls={drag} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} onDragEnd={onDragEnd}
            initial={{ y: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }} animate={{ y: 0, opacity: 1 }} exit={{ y: reduce ? 0 : '100%', opacity: reduce ? 0 : 1 }} transition={spring}>
            <div className="shrink-0 cursor-grab touch-none pt-2 active:cursor-grabbing" onPointerDown={e => drag.start(e)}>
              <div className="mx-auto h-[5px] w-9 rounded-full bg-fill2" />
              {title !== undefined ? (
                <div className="flex h-12 items-center justify-between px-4">
                  <div className="w-11" />
                  <div className="min-w-0 truncate text-[17px] font-semibold">{title}</div>
                  <IconButton label={t('ui.close')} onClick={onClose} onPointerDown={e => e.stopPropagation()} className="!bg-fill !shadow-none"><Icon.Close size={16} /></IconButton>
                </div>
              ) : <div className="h-3" />}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** A short confirmation sheet: one main action and a way out */
export function Confirm({ open, onClose, title, children, action, danger = false, busy = false, onConfirm }) {
  return (
    <Sheet open={open} onClose={onClose} label={title}>
      <div className="px-6 pb-5 pt-2">
        <div className="text-center text-[20px] font-semibold">{title}</div>
        {children && <div className="mt-2 text-center text-[15px] leading-[1.45] text-fg2">{children}</div>}
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" kind={danger ? 'gray' : 'accent'} className={danger ? '!text-danger' : ''} disabled={busy} onClick={onConfirm}>
            {busy ? <Spinner /> : action}
          </Button>
          <Button size="lg" kind="plain" className="!text-fg" onClick={onClose}>{t('ui.cancel')}</Button>
        </div>
      </div>
    </Sheet>
  )
}

/** iOS action sheet: a list of actions in one group */
export function Actions({ open, onClose, items }) {
  return (
    <Sheet open={open} onClose={onClose} label={t('ui.options')}>
      <div className="px-3 pb-3">
        <div className="overflow-hidden rounded-[18px] bg-surface">
          {items.filter(Boolean).map((it, i) => (
            <button key={it.label} type="button" onClick={() => { onClose(); it.onClick() }}
              className={`flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] active:bg-fill ${i ? 'border-t border-line' : ''} ${it.danger ? 'text-danger' : 'text-fg'}`}>
              <span className={it.danger ? '' : 'text-fg2'}>{it.icon}</span><span className="min-w-0 truncate">{it.label}</span>
            </button>
          ))}
        </div>
        <Button size="lg" kind="plain" className="mt-1 w-full !text-fg" onClick={onClose}>{t('ui.cancel')}</Button>
      </div>
    </Sheet>
  )
}

/** Empty or error state: a title, at most one line, and an action */
export function Empty({ icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      {icon && <div className="mb-3 text-fg2">{icon}</div>}
      <div className="text-[20px] font-semibold">{title}</div>
      {text && <p className="mt-1.5 max-w-[300px] text-[15px] leading-snug text-fg2">{text}</p>}
      {children}
    </div>
  )
}

/** Error with a retry, for a screen that has nothing to show yet */
export function LoadError({ error, onRetry, icon }) {
  return (
    <Empty icon={icon || <Icon.Cloud size={30} />} title={error?.status === 0 ? t('err.offlineTitle') : t('err.loadTitle')} text={error?.message}>
      <Button kind="gray" className="mt-5" onClick={onRetry}><Icon.Retry size={18} />{t('ui.retry')}</Button>
    </Empty>
  )
}

export function Spinner({ size = 18, className = '' }) {
  return <span role="status" aria-label={t('ui.loading')} className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none ${className}`} style={{ width: size, height: size }} />
}

/** Section heading inside a screen */
export function SectionTitle({ children, right, className = '' }) {
  return (
    <div className={`flex min-h-[44px] items-end justify-between gap-3 px-5 pb-2 pt-6 ${className}`}>
      <h2 className="text-[22px] font-bold leading-[28px]">{children}</h2>
      {right}
    </div>
  )
}

/** A quiet pill at the top while the network can't be reached */
export function OfflinePill() {
  const online = useOnline()
  return (
    <AnimatePresence>
      {!online && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={spring}
          className="pointer-events-none fixed inset-x-0 bottom-[calc(max(14px,env(safe-area-inset-bottom))+72px)] z-[90] flex justify-center">
          <span className="glass flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-fg"><Icon.Cloud size={15} />{t('ui.offline')}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const toast = (text, kind = 'info', action) => {
    const id = Math.random()
    setToasts(list => [...list.slice(-2), { id, text, kind, action }])
    setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), action ? 5000 : 3200)
  }
  const clear = () => setToasts([])
  // Portalled so toasts stay visible and announced while a sheet makes the app inert
  const view = createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+10px)] z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {toasts.map(x => (
          <motion.div key={x.id} initial={{ y: -24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -16, opacity: 0 }} transition={spring}
            className="glass pointer-events-auto flex max-w-[440px] items-center gap-2 rounded-full py-2 pl-4 pr-2 text-[15px] font-semibold shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]">
            {x.kind === 'error' && <span className="h-2 w-2 shrink-0 rounded-full bg-danger" />}
            <span className="py-0.5 pr-2">{x.text}</span>
            {x.action && <button type="button" onClick={() => { setToasts(l => l.filter(y => y.id !== x.id)); x.action.onClick() }} className="h-8 shrink-0 rounded-full bg-accent px-3 text-[14px] text-white">{x.action.label}</button>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
  return [toast, view, clear]
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

export const fmt = s => {
  s = Math.max(0, Math.round(s || 0))
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0')
}

const svg = (d, { fill = false, sw = 1.9 } = {}) => function I({ size = 24, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  )
}
export const Icon = {
  // tabs
  Today: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  TodayFill: svg(<><circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="none" /><path d="M12 7.5V12l3 2" stroke="rgb(var(--bg))" /></>),
  Practice: svg(<><rect x="9" y="3" width="6" height="11.5" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>),
  PracticeFill: svg(<><rect x="8.5" y="2.5" width="7" height="12.5" rx="3.5" fill="currentColor" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>),
  You: svg(<><circle cx="12" cy="8.5" r="3.8" /><path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6" /></>),
  YouFill: svg(<><circle cx="12" cy="8.5" r="4.3" fill="currentColor" /><path d="M4.5 20c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6Z" fill="currentColor" /></>),
  // actions
  Back: svg(<path d="M15 4.5 7.5 12l7.5 7.5" />, { sw: 2.3 }),
  Close: svg(<path d="M6 6l12 12M18 6 6 18" />, { sw: 2.2 }),
  Chevron: svg(<path d="m9 5 7 7-7 7" />, { sw: 2.1 }),
  Plus: svg(<path d="M12 5v14M5 12h14" />, { sw: 2.2 }),
  Check: svg(<path d="m5 12.5 4.5 4.5L19 7.5" />, { sw: 2.4 }),
  More: svg(<><circle cx="5" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="19" cy="12" r="1.6" fill="currentColor" /></>),
  Share: svg(<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />),
  Trash: svg(<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />),
  Edit: svg(<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />),
  Send: svg(<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />, { sw: 2.3 }),
  Search: svg(<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  Retry: svg(<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" />),
  Lock: svg(<><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></>),
  Cloud: svg(<><path d="M7 18.5h10a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.6 4.5 4.5 0 0 0 7 18.5Z" /><path d="m4 4 16 16" /></>),
  Globe: svg(<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.5 5.2 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.2-3.5-8.5s1.1-6.1 3.5-8.5Z" /></>),
  List: svg(<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01" />, { sw: 2.2 }),
  // ideas
  Point: svg(<path d="M7 11.5V20H4.5v-8.5H7Zm0 0 4-7.2c1.3 0 2.3 1.1 2.1 2.4L12.6 10h5.6a2 2 0 0 1 2 2.3l-1.1 6a2 2 0 0 1-2 1.7H7" />),
  PointFill: svg(<path d="M7 11.5V20H4.5v-8.5H7Zm0 0 4-7.2c1.3 0 2.3 1.1 2.1 2.4L12.6 10h5.6a2 2 0 0 1 2 2.3l-1.1 6a2 2 0 0 1-2 1.7H7Z" fill="currentColor" />),
  Convinced: svg(<path d="M4 8h12l-3.5-3.5M20 16H8l3.5 3.5" />),
  Reply: svg(<path d="M9.5 6 4 11.5 9.5 17M4.5 11.5H14a6 6 0 0 1 6 6v1" />),
  Archive: svg(<><rect x="3.5" y="4.5" width="17" height="4" rx="1.2" /><path d="M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5M10 12.5h4" /></>),
  Quote: svg(<path d="M10 7H6.5A1.5 1.5 0 0 0 5 8.5V12h4.5v4.5L7 19M19 7h-3.5A1.5 1.5 0 0 0 14 8.5V12h4.5v4.5L16 19" />),
  Debate: svg(<><path d="M3.5 6.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H9l-3.5 3v-3a2 2 0 0 1-2-2v-4Z" /><path d="M17.5 9.5h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v3l-3.5-3h-2.5a2 2 0 0 1-2-2v-.5" /></>),
  Mic: svg(<><rect x="9" y="3" width="6" height="11.5" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>),
  Play: svg(<path d="M7 4.8v14.4a1 1 0 0 0 1.52.85l11.5-7.2a1 1 0 0 0 0-1.7L8.52 3.95A1 1 0 0 0 7 4.8Z" />, { fill: true }),
  Pause: svg(<><rect x="6" y="4.5" width="4" height="15" rx="1.3" /><rect x="14" y="4.5" width="4" height="15" rx="1.3" /></>, { fill: true }),
  Shuffle: svg(<path d="M3.5 7h3.2c2 0 3.3 1 4.3 2.7l2 3.6c1 1.7 2.3 2.7 4.3 2.7h3.2M18 4.5 20.5 7 18 9.5M3.5 17h3.2c1.4 0 2.5-.5 3.3-1.4M20.5 17 18 14.5M20.5 17 18 19.5M13.7 8.4c.8-.9 1.9-1.4 3.3-1.4" />),
  Flame: svg(<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.5 2.6-5.6 3.9-8.3.4 1.6 1.4 2.8 2.6 3.4.3-2.6 1.6-4.8 3.6-6.4-.2 2.8 3.9 5.8 3.9 10.9C19.5 18.2 16 21 12 21Z" />),
  Bell: svg(<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2ZM10 21h4" />),
  Passkey: svg(<><circle cx="10" cy="7.5" r="3.5" /><path d="M3.5 20c.5-3.8 3-6 6.5-6 1.2 0 2.3.3 3.2.8" /><circle cx="18" cy="14.5" r="2.5" /><path d="M18 17v4.5M18 19.5h1.8" /></>),
  Key: svg(<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16.5 6.5l2.5 2.5M14 9l2 2" /></>),
  Trophy: svg(<path d="M8 4.5h8v5a4 4 0 0 1-8 0v-5ZM8 6.5H4.5a3 3 0 0 0 3.6 3.6M16 6.5h3.5a3 3 0 0 1-3.6 3.6M12 13.5v4M8.5 20h7M10 17.5h4" />),
  Swords: svg(<path d="M4 4l9 9M4 4h3.5L14 10.5M4 4v3.5L10.5 14M20 4l-9 9M20 4h-3.5M20 4v3.5M14.5 14.5l4 4M9.5 14.5l-4 4M17 20l3-3M7 20l-3-3" />),
}
