// Small shared pieces: icons (drawn like SF Symbols, one stroke weight), ring, nav bar, rows
import { canSpeak, speak } from './speech'
import { useT } from './i18n'

const Svg = ({ className = 'h-5 w-5', children, weight = 2.4 }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)

export const CheckIcon = ({ className }) => (
  <Svg className={className} weight={2.8}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
)
export const XIcon = ({ className }) => (
  <Svg className={className} weight={2.8}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </Svg>
)
export const Chevron = ({ left = false, className = 'h-[20px] w-[20px]' }) => (
  <Svg className={className} weight={2.6}>
    <path d={left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </Svg>
)
export const PlusIcon = ({ className }) => (
  <Svg className={className} weight={2.4}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)
export const GearIcon = ({ className = 'h-[22px] w-[22px]' }) => (
  <Svg className={className} weight={2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Svg>
)
export const SpeakerIcon = ({ className = 'h-[22px] w-[22px]' }) => (
  <Svg className={className} weight={2}>
    <path d="M4 9.5v5h3.5L12 19V5L7.5 9.5H4z" fill="currentColor" stroke="none" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Svg>
)
export const ListIcon = ({ className = 'h-[20px] w-[20px]' }) => (
  <Svg className={className} weight={2.2}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1" fill="currentColor" />
    <circle cx="4.5" cy="12" r="1" fill="currentColor" />
    <circle cx="4.5" cy="18" r="1" fill="currentColor" />
  </Svg>
)

// Activity-style ring
export function Ring({ value, size = 200, stroke = 20, color = 'var(--accent)', children, slow = false }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          opacity={value > 0 ? 1 : 0}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.001, Math.min(1, value)))}
          style={{ transition: `stroke-dashoffset ${slow ? 900 : 500}ms cubic-bezier(.2,.8,.2,1), stroke 300ms` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">{children}</div>
    </div>
  )
}

export function NavBar({ left, right, title, plain = false }) {
  return (
    <header className={`navbar ${plain ? 'navbar-plain' : ''}`}>
      <div className="grid h-11 grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex min-w-0 justify-start">{left}</div>
        <div className="headline truncate px-2 text-center">{title}</div>
        <div className="flex min-w-0 justify-end">{right}</div>
      </div>
    </header>
  )
}

export function BackButton({ onClick, label }) {
  const t = useT()
  return (
    <button onClick={onClick} className="link -ml-1 gap-0.5 pl-1">
      <Chevron left /> <span className="truncate">{label || t.back}</span>
    </button>
  )
}

export function SpeakButton({ text, lang, className = 'icon-btn', onDark = false }) {
  const t = useT()
  if (!canSpeak) return null
  return (
    <button
      type="button"
      className={className}
      style={onDark ? { color: 'inherit' } : undefined}
      aria-label={t.listen}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        speak(text, lang)
      }}
    >
      <SpeakerIcon />
    </button>
  )
}

// A word with its hint in brackets shown quieter: "kochen (Wasser)"
export function Word({ text }) {
  const m = /^(.*?)\s*(\(.*\))\s*$/.exec(text)
  if (!m) return text
  return (
    <>
      {m[1]} <span className="font-normal opacity-60">{m[2]}</span>
    </>
  )
}

export function Picker({ label, value, onChange, options, placeholder }) {
  return (
    <label className="row cursor-pointer">
      <span className="body flex-1">{label}</span>
      <span className="relative flex items-center" style={{ color: value != null && value !== '' ? 'var(--label-2)' : 'var(--link)' }}>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="body min-h-[44px] cursor-pointer appearance-none bg-transparent pr-6 text-right outline-none"
          style={{ color: 'inherit' }}
        >
          {(value == null || value === '') && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-0 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      </span>
    </label>
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="row cursor-pointer">
      <span className="body flex-1">{label}</span>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
        style={{ background: checked ? 'var(--green-fill)' : 'var(--fill)' }}
      >
        <span
          className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)] transition-transform duration-200"
          style={{ transform: `translateX(${checked ? 22 : 2}px)` }}
        />
      </span>
    </label>
  )
}

export const vibrate = (pattern) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // not supported (iOS Safari)
  }
}
