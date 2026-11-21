import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { addPhotoFromFile, usePhoto } from '../media'
import { cat } from '../data'
import { photoFile } from '../photos'
import { useT } from '../i18n'
import { CropSheet } from './CropSheet'

// One stroke icon set, drawn on the same 24px grid with the same weight
const PATHS = {
  today: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17M8 2.75v3.5M16 2.75v3.5" />
      <path d="m9 15 2 2 4-4" />
    </>
  ),
  ideas: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3Z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  up: <path d="M12 19.5v-15M5.5 11 12 4.5l6.5 6.5" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  chat: <path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.2 0-2.4-.25-3.4-.7L4 19.5l1.2-3.6C4.4 14.6 4 13.1 4 11.5 4 7.4 7.6 4 12 4s8 3.4 8 7.5Z" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  back: <path d="m15 5-7 7 7 7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  camera: (
    <>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4-4-9 9" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 2M9.5 2.5h5" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.9M17 6h2.5a2.5 2.5 0 0 1-2.6 3.9M12 14v3.5M8.5 20.5h7" />
    </>
  ),
  snow: <path d="M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />,
  share: (
    <>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </>
  ),
  play: <path d="M7 4.5v15l12.5-7.5z" />,
  replay: (
    <>
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4.5h4.5" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20Z" />,
  friends: (
    <>
      <circle cx="9" cy="8.5" r="3.25" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.5a3.25 3.25 0 0 1 0 6M17.5 14.2a5.5 5.5 0 0 1 3 5.3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4.5h5v2M6 6.5l1 13a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5l1-13" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  external: <path d="M14 4h6v6M10 14 20 4M18 13.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5" />,
  buddy: (
    <>
      <circle cx="8.5" cy="8.5" r="3.25" />
      <circle cx="16.5" cy="9.5" r="2.75" />
      <path d="M2.5 20a6 6 0 0 1 12 0M15 14.3A5 5 0 0 1 21.5 19" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  download: <path d="M12 3.5v12M7.5 11l4.5 4.5 4.5-4.5M4.5 20.5h15" />,
  upload: <path d="M12 15.5v-12M7.5 8 12 3.5 16.5 8M4.5 20.5h15" />,
  crop: <path d="M6 2.5V16a2 2 0 0 0 2 2h13.5M2.5 6H16a2 2 0 0 1 2 2v13.5" />,
  pencil: <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />,
  list: <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />,
  link: (
    <>
      <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 8 2.5 8h-17S6 15 6 9" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  warning: (
    <>
      <path d="M10.3 4.2 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5v4M12 17h.01" />
    </>
  ),
  reply: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.7 4 2.5 5.8 6.5 6.5-4 .7-5.8 2.5-6.5 6.5-.7-4-2.5-5.8-6.5-6.5 4-.7 5.8-2.5 6.5-6.5Z" />
      <path d="M18.5 16v4M16.5 18h4" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5" />
    </>
  ),
}

export function Icon({ name, className = 'h-5 w-5', filled = false, strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}

export function Logo({ word = false }) {
  return (
    <span className="flex items-center gap-2">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width="32" height="32" className="h-8 w-8 rounded-[9px]" />
      {word && <span className="text-[19px] font-bold tracking-tight">Blank</span>}
    </span>
  )
}

export const tintStyle = (category) => ({ '--tint': cat(category).color })

// One of your photos (IndexedDB or an old inline one), with a quiet placeholder while it loads
// ratio (height / width) reserves the space before the photo arrives, so nothing jumps
export function Photo({ src, alt = '', className = '', imgClassName = 'h-full w-full object-cover', w = 800, ratio, maxHeight, onLoad }) {
  const url = usePhoto(src, w)
  const [loaded, setLoaded] = useState(false)
  const style = ratio ? { aspectRatio: `1 / ${ratio}`, maxHeight } : undefined
  return (
    <span className={`relative block overflow-hidden bg-mist ${className}`} style={style}>
      {url && (
        <img
          src={url}
          alt={alt}
          decoding="async"
          ref={(el) => el?.complete && el.naturalWidth && !loaded && setLoaded(true)}
          onLoad={(e) => {
            setLoaded(true)
            onLoad?.(e)
          }}
          className={`${imgClassName} transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </span>
  )
}

// A plan's photo from public/ideas/
export function IdeaPhoto({ guide, w = 440, className = '', eager = false, natural = false }) {
  const [loaded, setLoaded] = useState(false)
  if (!guide?.photo) return <span className={`tint block ${className}`} style={tintStyle(guide?.category)} />
  return (
    <span className={`relative block overflow-hidden bg-mist ${className}`} style={natural ? { aspectRatio: `1 / ${guide.photo.ratio}` } : undefined}>
      <img
        src={photoFile(guide.photoKey, w)}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        ref={(el) => el?.complete && el.naturalWidth && !loaded && setLoaded(true)}
        onLoad={() => setLoaded(true)}
        className={`h-full w-full object-cover transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}

export function ProgressBar({ value, className = '' }) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-ink/10 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full rounded-full bg-spark transition-[width] duration-300" style={{ width: `${value}%` }} />
    </div>
  )
}

// Back that never leaves the app: opened from a link (no history inside the app) it goes to `fallback`
export function useBack(fallback = '/') {
  const navigate = useNavigate()
  return useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}

export function BackButton({ fallback = '/', className = '' }) {
  const back = useBack(fallback)
  const { t } = useT()
  return (
    <button
      onClick={back}
      className={`-ml-2 flex h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-[17px] text-spark-ink active:opacity-60 ${className}`}
      aria-label={t('Back')}
    >
      <Icon name="back" className="h-6 w-6" strokeWidth={2.4} />
    </button>
  )
}

// How many sheets are open right now (the axolotl never peeks in over one)
let openSheets = 0
const sheetListeners = new Set()
const setOpenSheets = (n) => {
  openSheets = n
  sheetListeners.forEach((fn) => fn())
}
export const useAnySheetOpen = () =>
  useSyncExternalStore(
    (fn) => {
      sheetListeners.add(fn)
      return () => sheetListeners.delete(fn)
    },
    () => openSheets > 0,
  )

// The page behind a sheet doesn't scroll. One counter for every sheet: two sheets on top of each other close in
// any order (starting a project from a post closes both at once), and the page only scrolls again when the last
// one is gone. Each sheet saving and restoring the old value left the page stuck when they closed in the wrong order.
let scrollLocks = 0
let scrollBefore = ''
export function lockScroll() {
  if (scrollLocks++ === 0) {
    scrollBefore = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  let done = false
  return () => {
    if (done) return
    done = true
    if (--scrollLocks === 0) document.body.style.overflow = scrollBefore
  }
}

// Bottom sheet on phones, centred panel on wider screens
// iPhone Safari doesn't shrink the page when the keyboard opens: a sheet at the bottom of the screen ends up behind
// the keyboard, with the field you're typing in hidden. While the keyboard is up, the sheet is fitted into the part of
// the screen you can still see (window.visualViewport), and the field you're in is scrolled into view inside it.
function useKeyboardFit(panel) {
  const [fit, setFit] = useState(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const covered = window.innerHeight - vv.height
      // Under ~100px it's a browser bar or pinch zoom, not a keyboard
      setFit(covered > 100 ? { top: vv.offsetTop, height: vv.height, bottom: 'auto' } : null)
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  useEffect(() => {
    if (!fit) return
    const el = document.activeElement
    if (el && panel.current?.contains(el) && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) el.scrollIntoView({ block: 'nearest' })
  }, [fit, panel])
  return fit
}

export function Sheet({ onClose, children, label, className = '', wide = false }) {
  const panel = useRef(null)
  useEffect(() => {
    setOpenSheets(openSheets + 1)
    const unlock = lockScroll()
    return () => {
      setOpenSheets(Math.max(0, openSheets - 1))
      unlock()
    }
  }, [])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevFocus = document.activeElement
    const first = panel.current?.querySelector('[data-autofocus]') || panel.current
    first?.focus({ preventScroll: true })
    return () => {
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [onClose])
  const fit = useKeyboardFit(panel)
  // Drawn straight into <body>: a sheet opened from inside another sheet (sign up from "New post") was otherwise
  // trapped in the outer sheet's animated panel, and iPhone Safari clipped it to that panel's size
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" style={fit} role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 animate-fade bg-black/40" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        // With the keyboard up there's no room for the bottom safe-area gap, and the sheet fits above the keyboard
        style={fit ? { maxHeight: fit.height - 8, paddingBottom: 12 } : undefined}
        className={`relative max-h-[92dvh] w-full animate-sheet overflow-y-auto overscroll-contain rounded-t-[22px] bg-card pb-[max(16px,env(safe-area-inset-bottom))] shadow-pop outline-none sm:max-h-[86dvh] sm:animate-scale-in sm:rounded-[22px] sm:pb-4 ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} ${className}`}
      >
        <div className="sticky top-0 z-10 flex justify-center pb-1 pt-2 sm:hidden" aria-hidden="true">
          <span className="h-[5px] w-9 rounded-full bg-ink/20" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function SheetHeader({ title, onClose, action }) {
  const { t } = useT()
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-1 sm:pt-3">
      <h2 className="min-w-0 truncate text-[17px] font-semibold">{title}</h2>
      <div className="flex items-center gap-1">
        {action}
        <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-sub active:opacity-60" aria-label={t('Close')}>
          <Icon name="x" className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}

export function Segmented({ value, options, onChange, label }) {
  return (
    <div className="grid auto-cols-fr grid-flow-col rounded-[10px] bg-mist p-0.5 text-[13px] font-semibold" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button" // inside a form, Enter on the keyboard must submit the form, not switch the tab
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`min-h-[32px] rounded-[8px] px-3 transition ${value === v ? 'bg-card text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-sub'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

// A round check: fills with a little spring when done
export function CheckCircle({ done, className = 'h-[26px] w-[26px]' }) {
  return (
    <span
      className={`check-fill flex shrink-0 items-center justify-center rounded-full border-2 ${done ? 'on border-spark bg-spark text-white' : 'border-ink/25'} ${className}`}
      aria-hidden="true"
    >
      {done && <Icon name="check" className="h-3.5 w-3.5 animate-pop" strokeWidth={3} />}
    </span>
  )
}

// A short burst of confetti from the top of the parent
const CONFETTI_COLORS = ['#B85A43', '#F59E0B', '#10B981', '#EC4899', '#3B82F6']
export function Confetti({ count = 26 }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    left: `${8 + ((i * 37) % 84)}%`,
    delay: `${(i % 6) * 0.03}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    dx: `${((i * 53) % 120) - 60}px`,
    rot: `${180 + ((i * 47) % 360)}deg`,
  }))
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-x-clip overflow-y-visible" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti" style={{ left: p.left, animationDelay: p.delay, background: p.color, '--dx': p.dx, '--rot': p.rot }} />
      ))}
    </div>
  )
}

const RESOURCE_ICON = { youtube: 'play', site: 'external', community: 'buddy', map: 'pin' }
export function ResourceList({ resources }) {
  return (
    <ul className="surface divide-y divide-line/15 overflow-hidden">
      {resources.map((r) => (
        <li key={r.url}>
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="row min-h-[56px] active:bg-mist">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mist text-sub">
              <Icon name={RESOURCE_ICON[r.kind] || 'external'} className="h-4 w-4" filled={r.kind === 'youtube'} />
            </span>
            <span className="min-w-0 flex-1 py-2">
              <span className="block truncate text-[15px] font-medium">{r.title}</span>
              <span className="block truncate text-[13px] text-sub">{r.note}</span>
            </span>
            <Icon name="external" className="h-4 w-4 shrink-0 text-sub" />
          </a>
        </li>
      ))}
    </ul>
  )
}

// A file picker that lets you crop the chosen photo, then turns it into a stored photo; shows its own busy and error state
// aspect: a fixed crop shape (1 for a square), or none for a free choice
export function usePhotoPicker(onPicked, { aspect } = {}) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null) // the picked file, while you crop it
  const open = () => {
    setError(null)
    input.current?.click()
  }
  const onChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setPending(file)
  }
  const cancel = useCallback(() => setPending(null), [])
  const save = async (crop) => {
    const file = pending
    setPending(null)
    setBusy(true)
    try {
      const res = await addPhotoFromFile(file, crop)
      await onPicked(res)
    } catch (err) {
      setError(err?.code || 'write')
    } finally {
      setBusy(false)
    }
  }
  const el = (
    <>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={onChange} />
      {pending && <CropSheet file={pending} aspect={aspect} onDone={save} onCancel={cancel} />}
    </>
  )
  return { open, busy, error, clearError: () => setError(null), input: el }
}

export function PhotoError({ code, onDismiss }) {
  const { t } = useT()
  if (!code) return null
  const text =
    code === 'quota'
      ? t('Your device is out of space for photos. Free up some space, then try again.')
      : code === 'type' || code === 'decode'
        ? t('This photo format can’t be opened here. Try a JPEG or PNG.')
        : code === 'unavailable'
          ? t('This browser blocks photo storage (private mode?). Photos can’t be saved here.')
          : t('The photo couldn’t be saved. Try again.')
  return (
    <div className="flex items-start gap-2 rounded-xl bg-bad/10 px-3 py-2.5 text-[15px] text-bad" role="alert">
      <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{text}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="-m-1 flex h-7 w-7 items-center justify-center rounded-full" aria-label={t('Close')}>
          <Icon name="x" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// true on screens at least `px` wide (Tailwind's lg is 1024), updated live when the window is resized
export function useWide(px = 1024) {
  const query = `(min-width: ${px}px)`
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setWide(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return wide
}
