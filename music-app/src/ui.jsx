import { useEffect } from 'react'
import { useCoverUrl } from './player.js'

const PATHS = {
  play: 'M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z',
  pause: 'M7 4h3.5v16H7zM13.5 4H17v16h-3.5z',
  next: 'M4 5.5v13a1 1 0 0 0 1.53.85L15 13.2V18h3V6h-3v4.8L5.53 4.65A1 1 0 0 0 4 5.5z',
  prev: 'M20 5.5v13a1 1 0 0 1-1.53.85L9 13.2V18H6V6h3v4.8l9.47-6.15A1 1 0 0 1 20 5.5z',
  plus: 'M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z',
  more: 'M5 10.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z',
  down: 'M5.3 8.3a1 1 0 0 1 1.4 0L12 13.6l5.3-5.3a1 1 0 1 1 1.4 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1 0-1.4z',
  back: 'M15.7 5.3a1 1 0 0 1 0 1.4L10.4 12l5.3 5.3a1 1 0 0 1-1.4 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.4 0z',
  search: 'M10.5 4a6.5 6.5 0 0 1 5.2 10.4l4 4a1 1 0 0 1-1.4 1.4l-4-4A6.5 6.5 0 1 1 10.5 4zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z',
  note: 'M19 3v12.5a3.5 3.5 0 1 1-2-3.16V7.2l-8 1.6v8.7A3.5 3.5 0 1 1 7 14.34V6.2L19 3z',
  check: 'M9.5 16.6 4.9 12a1 1 0 1 0-1.4 1.4l5.3 5.3a1 1 0 0 0 1.4 0L21.5 7.4A1 1 0 1 0 20.1 6z',
  heart: 'M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.9 1.4-1.8 3-2.9 5-2.9 3.6 0 5.6 3.5 4.3 6.8-1.8 4.6-9.3 9.2-9.3 9.2z',
  palette: 'M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.4-.7-.4-1.1 0-.9.7-1.7 1.7-1.7h2A5.4 5.4 0 0 0 22 10c0-3.9-4.5-7-10-7zm-5 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
}

export function Icon({ name, size = 24, className = '' }) {
  if (name === 'shuffle' || name === 'repeat' || name === 'repeat1') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        {name === 'shuffle' ? (
          <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
        ) : (
          <>
            <path d="M17 2l4 4-4 4" />
            <path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" />
            <path d="M21 13v2a3 3 0 0 1-3 3H3" />
            {name === 'repeat1' && <path d="M11 10h1.5v5" strokeWidth="1.8" />}
          </>
        )}
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

export function Cover({ blob, size = 44, radius = 8, className = '', theme }) {
  const src = useCoverUrl(blob)
  return (
    <div
      className={`shrink-0 overflow-hidden bg-fill2 grid place-items-center text-fg3 ${className}`}
      style={{ width: size, height: size, borderRadius: `calc(${radius}px * var(--round, 1))` }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" draggable="false" /> : <Placeholder theme={theme} size={typeof size === 'number' ? Math.round(size * 0.42) : 72} />}
    </div>
  )
}

// Songs without cover art get the theme's own picture: a grass block, a heart, or a note
function Placeholder({ size, theme = document.documentElement.dataset.theme }) {
  if (theme === 'blocks') return <img src="/music/themes/block.svg" alt="" className="w-full h-full" style={{ imageRendering: 'pixelated' }} draggable="false" />
  return <Icon name={theme === 'dream' ? 'heart' : 'note'} size={size} />
}

export function time(s) {
  if (!Number.isFinite(s) || s < 0) s = 0
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export function bytes(n) {
  if (n < 1e6) return `${Math.max(1, Math.round(n / 1e3))} KB`
  if (n < 1e9) return `${Math.round(n / 1e6)} MB`
  return `${(n / 1e9).toFixed(1)} GB`
}

// A sheet that slides up from the bottom; tap outside or Escape closes it
export function Sheet({ open, onClose, children, full = false, label }) {
  useEffect(() => {
    if (!open) return
    const key = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [open, onClose])
  return (
    <div className={`fixed inset-0 z-40 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`absolute left-0 right-0 bottom-0 mx-auto max-w-[600px] rounded-t-[calc(22px*var(--round,1))] bg-bg transition-transform duration-300 ${full ? 'top-[max(12px,env(safe-area-inset-top))]' : 'max-h-[85vh]'} flex flex-col`}
        style={{ transform: open ? 'translateY(0)' : 'translateY(105%)', transitionTimingFunction: 'var(--spring)' }}
      >
        {open && children}
      </div>
    </div>
  )
}

// iOS-style action list inside a Sheet
export function Actions({ title, subtitle, items, onClose }) {
  return (
    <div className="p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
      {title && (
        <div className="px-2 pb-3 text-center">
          <div className="font-semibold truncate">{title}</div>
          {subtitle && <div className="text-sm text-fg2 truncate">{subtitle}</div>}
        </div>
      )}
      <div className="card rounded-2xl overflow-hidden">
        {items.map((it, i) => (
          <button
            key={it.label}
            onClick={() => { onClose(); it.run() }}
            className={`w-full text-left px-4 py-3.5 text-[17px] active:bg-fill ${i ? 'border-t border-line' : ''} ${it.danger ? 'text-danger' : 'text-accent-ink'}`}
          >
            {it.label}
          </button>
        ))}
      </div>
      <button onClick={onClose} className="card mt-2 w-full rounded-2xl px-4 py-3.5 text-[17px] font-semibold active:bg-fill">
        Cancel
      </button>
    </div>
  )
}
