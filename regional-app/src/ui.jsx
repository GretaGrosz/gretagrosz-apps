import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AREAS, PAPERS } from './plan'
import { MAX_POINTS, readPhoto } from './ai'
import { t, tn } from './i18n'
import { PROOF_PASS } from './logic'

export { DAY, dayOf, dayOfDate } from './dates'
export { FRESH, PROOF_PASS, bestScore } from './logic'

// Shared building blocks: iOS-style bars, lists, rings and badges

export function useScrolled(limit = 44) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > limit)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [limit])
  return scrolled
}

export const STATUS = {
  passed: { color: 'var(--green)', label: 'Passed' },
  mastered: { color: 'var(--purple)', label: 'Mastered' },
  done: { color: 'var(--orange)', label: 'Paper done' },
}
export const statusLabel = (s) => t(STATUS[s].label)

export const KIND = { learn: 'Learn', paper: 'Past paper', task: 'Task' }

export const formatTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const areaColor = (d) => (d.kind === 'paper' ? 'var(--indigo)' : d.area === 'X' ? 'var(--label-2)' : AREAS[d.area].color)
export const dayLabel = (d) => (d.kind === 'paper' ? t(PAPERS[d.paper[0]].name) : AREAS[d.area].name)
export const badgeLetter = (d) => (d.kind === 'paper' ? 'P' : d.area === 'X' ? 'M' : d.area)
export const dayTitle = (d) => (d.kind === 'paper' ? `${d.paper[0] === 'GWF' ? 'GWF' : t('Bundeswettbewerb T1')} ${d.paper[1]}` : d.topic)
export const daySub = (d) =>
  d.kind === 'paper' ? (d.topic.startsWith('Probewettbewerb') ? d.topic : d.paper[0] === 'GWF' ? t('Past regional paper') : t('Federal Part 1 paper, one round harder')) : d.details.join(' · ')

/* ---------- Maths in plain text ---------- */

// Content mixes Unicode maths with ASCII leftovers: R_{km}, a_{n−1}, 2^(i−k), ν_2(n!).
// Sub- and superscripts become real <sub>/<sup>, and spaces around operators stop being line breaks,
// so "(x + 1)(y + 2) = 8" never splits mid-formula (a formula longer than the line still wraps).
const SCRIPT = /([_^])(?:\{([^{}]{1,40})\}|\(([^()]{1,40})\)|(-?[0-9]{1,4}|[A-Za-zα-ωπ](?![A-Za-z])))/g
const OPS = /([A-Za-z0-9)\]²³⁴ⁿ'!|πα-ω]) ([+=−<>≤≥·×≠≡∣]) (?=[A-Za-z0-9(√−[|πα-ω∑∏])/g

function scripts(text, key) {
  const out = []
  let last = 0
  let m
  SCRIPT.lastIndex = 0
  while ((m = SCRIPT.exec(text))) {
    // Only right after a letter, digit, ) or prime: "R_{km}", "ν_2", "2^(i−k)" — not "_" on its own
    const prev = text[m.index - 1]
    if (!prev || !/[A-Za-z0-9)\]'α-ωπ]/.test(prev)) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    const body = m[2] ?? m[3] ?? m[4]
    out.push(m[1] === '_' ? <sub key={`${key}-${m.index}`}>{body}</sub> : <sup key={`${key}-${m.index}`}>{body}</sup>)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Rich({ text, className = 'problem', as: Tag = 'p', ...rest }) {
  const s = String(text || '').replace(OPS, '$1\u00A0$2\u00A0')
  // "(x + 1)(y + 2)" is one word now; keep it from breaking at ")("
  const parts = s.split(/(\S*\)\(\S*)/)
  return (
    <Tag className={className} {...rest}>
      {parts.map((part, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {scripts(part, `r${i}`)}
          </span>
        ) : (
          scripts(part, `r${i}`)
        ),
      )}
    </Tag>
  )
}

/* ---------- Icons (SF Symbols–style, one stroke weight) ---------- */

export const Icon = ({ d, className = 'h-[22px] w-[22px]', fill = 'none', strokeWidth = 2.2 }) => (
  <svg viewBox="0 0 24 24" className={className} fill={fill} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)
export const CheckIcon = ({ className = 'h-5 w-5' }) => <Icon className={className} strokeWidth={2.8} d={<path d="M5 12.5l4.5 4.5L19 7.5" />} />
export const XIcon = ({ className = 'h-4 w-4' }) => <Icon className={className} strokeWidth={2.8} d={<path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />} />
export const ChevronIcon = ({ left = false, className = 'h-[18px] w-[18px]' }) => <Icon className={className} strokeWidth={2.6} d={<path d={left ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />} />
export const FlameIcon = ({ className = 'h-5 w-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2c.5 3.2-1.4 5-3 6.8C7.4 10.6 6 12.3 6 15a6 6 0 0012 0c0-2.4-1.1-4.2-2.3-5.5-.2 1.6-1 2.7-2.2 3.2.6-3.6-.2-7.4-1.5-10.7z" />
  </svg>
)
export const TodayIcon = (p) => <Icon {...p} d={<><rect x="3.5" y="4.5" width="17" height="16" rx="3.5" /><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4" /><circle cx="12" cy="15" r="1.8" fill="currentColor" stroke="none" /></>} />
export const PlanIcon = (p) => <Icon {...p} d={<><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></>} />
export const ProgressIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5.2" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /></>} />
export const CameraIcon = (p) => <Icon {...p} d={<><path d="M4 8.5A2.5 2.5 0 016.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0120 8.5v8A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5z" /><circle cx="12" cy="12.5" r="3.4" /></>} />
export const ChatIcon = (p) => <Icon {...p} d={<path d="M20 11.5c0 4.1-3.6 7.5-8 7.5-1.1 0-2.2-.2-3.1-.6L4 20l1.3-3.8C4.5 14.9 4 13.3 4 11.5 4 7.4 7.6 4 12 4s8 3.4 8 7.5z" />} />
export const LifeIcon = (p) => <Icon {...p} d={<path d="M13.5 2.8L5.5 13.5h6l-1 7.7 8-10.7h-6z" />} />
export const TrainIcon = (p) => <Icon {...p} d={<><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /></>} />
export const ToolboxIcon = (p) => <Icon {...p} d={<><path d="M4 9h16v9.5a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><path d="M9 9V6.5A1.5 1.5 0 0110.5 5h3A1.5 1.5 0 0115 6.5V9M4 13.5h16" /></>} />
export const GearIcon = (p) => (
  <Icon
    {...p}
    d={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>}
  />
)
export const SearchIcon = (p) => <Icon {...p} d={<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5L20 20" /></>} />
export const TimerIcon = (p) => <Icon {...p} d={<><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 1.5M9.5 2.8h5" /></>} />
export const UpDownIcon = (p) => <Icon {...p} strokeWidth={2.4} d={<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4" />} />
export const ShareIcon = (p) => <Icon {...p} d={<><path d="M12 15V3.5M7.5 8L12 3.5 16.5 8" /><path d="M6 11.5H5a1.5 1.5 0 00-1.5 1.5v6A1.5 1.5 0 005 20.5h14a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5h-1" /></>} />
export const RepeatIcon = (p) => <Icon {...p} d={<><path d="M4.5 11V9.5A3.5 3.5 0 018 6h11.5M16.5 3l3 3-3 3" /><path d="M19.5 13v1.5A3.5 3.5 0 0116 18H4.5M7.5 21l-3-3 3-3" /></>} />

/* ---------- Building blocks ---------- */

export function Ring({ value, size = 220, stroke = 22, color = 'var(--accent)', track, children, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track || color} strokeOpacity={track ? 1 : 0.18} strokeWidth={stroke} />
        {value > 0 && <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0.001, Math.min(1, value)))}
        />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">{children}</div>
    </div>
  )
}

// iOS-style navigation bar: transparent at the top, frosted with a small title once you scroll
export function NavBar({ title, left, right, alwaysTitle = false, wide = false }) {
  const scrolled = useScrolled()
  return (
    <div className={`navbar ${scrolled ? 'scrolled' : 'flat'}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className={`mx-auto flex h-11 items-center justify-between px-4 ${wide ? 'max-w-md lg:max-w-5xl' : 'max-w-md lg:max-w-2xl'}`}>
        <div className="flex min-w-[88px]">{left}</div>
        <div className="headline truncate px-2 transition-opacity duration-200" style={{ opacity: scrolled || alwaysTitle ? 1 : 0 }}>
          {title}
        </div>
        <div className="flex min-w-[88px] justify-end">{right}</div>
      </div>
    </div>
  )
}

export function BackButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="link -ml-2 flex h-11 min-w-[44px] items-center gap-0.5 pr-2 active:opacity-50">
      <ChevronIcon left className="h-[22px] w-[22px] shrink-0" /> <span className="truncate">{label || t('Back')}</span>
    </button>
  )
}

export function NavIconButton({ onClick, label, children }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="link -mx-2 flex h-11 w-11 items-center justify-center active:opacity-50">
      {children}
    </button>
  )
}

export function Page({ children, className = '', wide = false }) {
  return <div className={`mx-auto px-4 pb-32 lg:pb-16 ${wide ? 'max-w-md lg:max-w-5xl' : 'max-w-md lg:max-w-2xl'} ${className}`}>{children}</div>
}

// Problem screens on a laptop: statement on the left (stays in view), your work on the right
export function Split({ statement, children }) {
  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
      <div className="lg:sticky lg:top-16">{statement}</div>
      <div className="lg:pt-0">{children}</div>
    </div>
  )
}

export function Header({ eyebrow, title, children }) {
  return (
    <header className="mb-2 mt-1">
      {eyebrow && <p className="footnote font-semibold uppercase tracking-wide">{eyebrow}</p>}
      <h1 className="large-title">{title}</h1>
      {children}
    </header>
  )
}

export const SectionHeader = ({ children, id }) => (
  <h2 className="section-header" id={id}>
    {children}
  </h2>
)

export function AreaBadge({ d, small = false, letter }) {
  return (
    <span
      className={`badge-fill flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${small ? 'h-7 w-7 text-[13px]' : 'h-9 w-9 text-[15px]'}`}
      style={{ '--badge': areaColor(d) }}
      aria-hidden="true"
    >
      {letter || badgeLetter(d)}
    </span>
  )
}

// A plain round badge with an icon, for rows that aren't about one area
export function IconBadge({ children, color = 'var(--label-2)', small = true }) {
  return (
    <span className={`badge-fill flex shrink-0 items-center justify-center rounded-full text-white ${small ? 'h-7 w-7' : 'h-9 w-9'}`} style={{ '--badge': color }} aria-hidden="true">
      {children}
    </span>
  )
}

export function Done({ status, small }) {
  return (
    <span className={`flex items-center justify-center rounded-full ${small ? 'h-5 w-5' : 'h-6 w-6'}`} style={{ background: STATUS[status].color }} aria-label={statusLabel(status)}>
      <CheckIcon className={small ? 'h-3 w-3 text-white' : 'h-3.5 w-3.5 text-white'} />
    </span>
  )
}

export const REASONS = [
  ['idea', 'Didn’t find the idea', 'Before computing, spend 5 minutes on small cases and a big, exact sketch.'],
  ['fact', 'Didn’t know a fact', 'Put the fact on your formula sheet and redo that day’s lesson example.'],
  ['calc', 'Calculation slip', 'Check each line before moving on, and put your answer back into the question.'],
  ['case', 'Missed a case', 'Before you finish, ask: did I cover every case (zero, negative, equal, small n)?'],
  ['gap', 'Gap in my proof', 'Every claim needs a reason. After each line, ask yourself “why?”.'],
  ['read', 'Misread the question', 'Underline what is asked and read the question again before you answer.'],
]
export const reasonLabel = (id) => t(REASONS.find((r) => r[0] === id)?.[1] || id)

export function MistakePicker({ value, onPick }) {
  return (
    <div className="mt-1">
      <p className="footnote mb-2 font-semibold uppercase">{t('What went wrong?')}</p>
      <div className="group" style={{ background: 'var(--fill)' }}>
        {REASONS.map(([id, label]) => (
          <button key={id} onClick={() => onPick(id)} className="row callout">
            <span className="flex-1">{t(label)}</span>
            {value === id && <CheckIcon className="h-4 w-4 text-[var(--link)]" />}
          </button>
        ))}
      </div>
    </div>
  )
}

export function StatusDot({ status }) {
  if (status === 'ok')
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: 'var(--green)' }} aria-label={t('Solved')}>
        <CheckIcon className="h-3.5 w-3.5 text-white" />
      </span>
    )
  if (status === 'failed')
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full text-white" style={{ background: 'var(--red)' }} aria-label={t('Out of tries')}>
        <XIcon className="h-3 w-3" />
      </span>
    )
  return null
}

export function PartRow({ label, sub, status, score, color, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="row disabled:opacity-50">
      <span className="min-w-0 flex-1">
        <span className="body block" style={{ color }}>
          {label}
        </span>
        <span className="footnote block">{sub}</span>
      </span>
      {status === 'ok' || status === 'failed' ? <StatusDot status={status} /> : score >= 0 ? <span className="subhead secondary tabular-nums">{score}/8</span> : null}
      <ChevronIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
    </button>
  )
}

// The marker's remark, drawn on the student's own page: the lines it's about, cropped and outlined
function PageCrop({ photo, box }) {
  const pad = Math.round(Math.max(24, Math.min(box.w, box.h) * 0.25))
  const x = Math.max(0, box.x - pad)
  const y = Math.max(0, box.y - pad)
  const w = Math.min(photo.w - x, box.w + 2 * pad)
  const h = Math.min(photo.h - y, box.h + 2 * pad)
  if (!(w > 0 && h > 0)) return null
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} className="mt-2 block w-full rounded-[10px] bg-white" style={{ maxHeight: 170 }} preserveAspectRatio="xMidYMid meet" role="img" aria-label={t('The lines this is about, on your page')}>
      <image href={photo.dataUrl} x="0" y="0" width={photo.w} height={photo.h} />
      <rect x={box.x - 6} y={box.y - 6} width={box.w + 12} height={box.h + 12} rx={10} fill="rgba(255,149,0,0.12)" stroke="#FF9500" strokeWidth={Math.max(3, w / 160)} />
    </svg>
  )
}

export function GradeCard({ grade, photos = [] }) {
  const pct = grade.score / MAX_POINTS
  const color = grade.score >= PROOF_PASS ? 'var(--green)' : pct >= 0.25 ? 'var(--orange)' : 'var(--red)'
  const VERDICTS = { complete: 'complete', 'minor gaps': 'minor gaps', 'major gaps': 'major gaps', 'wrong approach': 'wrong approach', unreadable: 'unreadable' }
  return (
    <div className="card rise p-4" aria-live="polite">
      <div className="flex items-center gap-4">
        <Ring value={pct} size={60} stroke={7} color={color} label={t('{n} of 8 points', { n: grade.score })}>
          <span className="headline tabular-nums">{grade.score}</span>
        </Ring>
        <div className="min-w-0 flex-1">
          <p className="headline">{t('{n} of 8 points', { n: grade.score })}</p>
          <p className="footnote">
            {grade.source === 'self' ? t('Checked by you') : t('Marked by AI')}
            {grade.verdict && VERDICTS[grade.verdict] ? ` · ${t(VERDICTS[grade.verdict])}` : ''}
          </p>
        </div>
      </div>
      {grade.summary && <p className="callout mt-3">{grade.summary}</p>}
      {grade.good?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {grade.good.map((g, i) => (
            <li key={i} className="callout flex gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--green)]" />
              <span>{g}</span>
            </li>
          ))}
        </ul>
      )}
      {grade.issues?.length > 0 && (
        <div className="mt-3 space-y-3 rounded-xl p-3" style={{ background: 'var(--fill)' }}>
          {grade.issues.map((g, i) => {
            const photo = g.page > 0 && g.box && photos[g.page - 1]
            return (
              <div key={i}>
                {g.where && (
                  <p className="subhead font-semibold">
                    {g.where}
                    {g.page > 0 && photos.length > 1 ? <span className="secondary font-normal"> · {t('page {n}', { n: g.page })}</span> : null}
                  </p>
                )}
                <p className="callout">{g.problem}</p>
                {g.hint && (
                  <p className="footnote mt-0.5">
                    {t('Hint')}: {g.hint}
                  </p>
                )}
                {photo && photo.w > 0 && <PageCrop photo={photo} box={g.box} />}
              </div>
            )
          })}
        </div>
      )}
      {grade.next_step && (
        <p className="footnote mt-3">
          {t('Next')}: {grade.next_step}
        </p>
      )}
    </div>
  )
}

export function PhotoStrip({ photos, setPhotos, disabled, onError }) {
  const input = useRef(null)
  const add = async (files) => {
    try {
      const read = await Promise.all([...files].map((f) => readPhoto(f)))
      setPhotos((p) => [...p, ...read].slice(0, 6))
    } catch (e) {
      onError?.(e.message)
    }
  }
  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((p, i) => (
        <span key={i} className="pop relative">
          <img src={p.dataUrl} alt={t('Page {n}', { n: i + 1 })} className="h-24 w-[72px] rounded-xl object-cover" />
          {!disabled && (
            <button
              onClick={() => setPhotos((list) => list.filter((_, k) => k !== i))}
              className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center"
              aria-label={t('Remove photo {n}', { n: i + 1 })}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-white">
                <XIcon className="h-3 w-3" />
              </span>
            </button>
          )}
        </span>
      ))}
      {!disabled && photos.length < 6 && (
        <button onClick={() => input.current.click()} className="press flex h-24 w-[72px] flex-col items-center justify-center gap-1 rounded-xl" style={{ background: 'var(--fill)', color: 'var(--link)' }}>
          <CameraIcon className="h-6 w-6" />
          <span className="caption" style={{ color: 'var(--link)' }}>
            {photos.length ? t('Add page') : t('Photo')}
          </span>
        </button>
      )}
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files).then(() => (e.target.value = ''))} />
    </div>
  )
}

// iOS search bar
export function SearchField({ value, onChange, placeholder }) {
  return (
    <div className="flex h-11 items-center gap-1.5 rounded-[12px] pl-2.5" style={{ background: 'var(--fill)' }}>
      <SearchIcon className="h-[17px] w-[17px] shrink-0 text-[var(--label-2)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('Search')}
        aria-label={placeholder || t('Search')}
        type="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        className="min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-[var(--label-2)]"
        style={{ color: 'var(--label)' }}
      />
      {value && (
        <button onClick={() => onChange('')} aria-label={t('Clear')} className="flex h-11 w-11 shrink-0 items-center justify-center">
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-white" style={{ background: 'var(--tertiary)' }}>
            <XIcon className="h-2.5 w-2.5" />
          </span>
        </button>
      )}
    </div>
  )
}

// A list row that opens a native menu. options: [[value, label]]
export function PickerRow({ label, value, options, onChange }) {
  const current = options.find(([v]) => String(v) === String(value))
  return (
    <label className="row relative cursor-pointer">
      <span className="body flex-1">{label}</span>
      <span className="body secondary max-w-[60%] truncate">{current ? current[1] : ''}</span>
      <UpDownIcon className="h-4 w-4 shrink-0 text-[var(--tertiary)]" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 w-full cursor-pointer opacity-0" aria-label={label}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Segmented({ value, options, onChange, className = '', label }) {
  return (
    <div className={`segmented ${className}`} role="tablist" aria-label={label}>
      {options.map(([v, l]) => (
        <button key={v} role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={value === v ? 'on' : ''}>
          {l}
        </button>
      ))}
    </div>
  )
}

// German is the language of the paper, English one tap away
export function LangToggle({ lang, setLang }) {
  return <Segmented value={lang} onChange={setLang} options={[['de', 'Deutsch'], ['en', 'English']]} className="w-[200px]" label={t('Language of the problem')} />
}

export function Difficulty({ n }) {
  if (!n) return null
  return (
    <span className="inline-flex items-center gap-[3px] align-middle" role="img" aria-label={t('Difficulty {n} of 5', { n })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-[6px] w-[6px] rounded-full" style={{ background: i <= n ? 'var(--label-2)' : 'var(--fill)' }} />
      ))}
    </span>
  )
}

// Self-marking, one step at a time: the next step of the scheme shows only after you've answered the last,
// so the scheme can't be read as a solution before you've written anything.
// steps: [[text, points]] (points 0 = equal share of 8)
export function StepCheck({ steps, solution, onScore, onCancel, zeroNote }) {
  const total = steps.reduce((a, [, p]) => a + (p || 0), 0)
  const weight = (i) => (total ? steps[i][1] : MAX_POINTS / steps.length)
  const max = total || MAX_POINTS
  const [answers, setAnswers] = useState([])
  const [showSolution, setShowSolution] = useState(false)
  const i = answers.length
  const got = answers.reduce((a, yes, k) => a + (yes ? weight(k) : 0), 0)
  const score = Math.round((got * MAX_POINTS) / max)
  const finished = i >= steps.length

  return (
    <div className="fade-in">
      <div className="mb-2 mt-1 flex items-center justify-between px-1">
        <p className="footnote font-semibold uppercase">{finished ? t('Your mark') : t('Step {n} of {total}', { n: i + 1, total: steps.length })}</p>
        <span className="flex gap-1" aria-hidden="true">
          {steps.map((_, k) => (
            <span key={k} className="h-1.5 w-4 rounded-full transition-colors" style={{ background: k < i ? (answers[k] ? 'var(--green)' : 'var(--label-2)') : k === i ? 'var(--accent)' : 'var(--fill)' }} />
          ))}
        </span>
      </div>
      {!finished ? (
        <div key={i} className="card rise p-4">
          <Rich text={steps[i][0]} className="callout" />
          {total > 0 && <p className="footnote mt-2 tabular-nums">{t('{n} P', { n: steps[i][1] })}</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => setAnswers((a) => [...a, false])} className="btn btn-gray h-auto min-h-[50px] whitespace-normal py-2 text-[16px] leading-5">
              {t('Not in my proof')}
            </button>
            <button onClick={() => setAnswers((a) => [...a, true])} className="btn btn-filled h-auto min-h-[50px] whitespace-normal py-2 text-[16px] leading-5">
              {t('Proved it')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card pop p-5 text-center">
          <p className="title1 tabular-nums">{score}/8</p>
          {score === 0 && zeroNote && <p className="footnote mt-1">{zeroNote}</p>}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between px-1">
        <button onClick={i ? () => setAnswers((a) => a.slice(0, -1)) : onCancel} className="link flex h-11 items-center text-[15px]">
          {i ? t('Back') : t('Cancel')}
        </button>
        {finished && solution && !showSolution && (
          <button onClick={() => setShowSolution(true)} className="link flex h-11 items-center text-[15px]">
            {t('Compare with the solution')}
          </button>
        )}
      </div>
      {finished && showSolution && (
        <div className="card fade-in mt-2 p-4">
          <p className="footnote mb-1 font-semibold uppercase">{t('Solution')}</p>
          <Rich text={solution} />
        </div>
      )}
      {finished && (
        <button onClick={() => onScore({ source: 'self', score, steps: answers, summary: tn(steps.length, '{got} of {n} step.', '{got} of {n} steps.', { got: answers.filter(Boolean).length }) })} className="btn btn-filled mt-4 w-full">
          {t('Save {n}/8', { n: score })}
        </button>
      )}
    </div>
  )
}

// Mark it yourself against an official solution PDF or the written solution, 0–8
export function PointsSelf({ solutionsUrl, solution, onScore, onCancel }) {
  const [points, setPoints] = useState(0)
  return (
    <div className="card fade-in p-4">
      <p className="headline">{t('Mark it yourself')}</p>
      {solutionsUrl && (
        <a href={solutionsUrl} target="_blank" rel="noreferrer" className="link mt-1 flex h-11 items-center text-[15px]">
          {t('Official solution (PDF)')}
        </a>
      )}
      <div className="mt-3 flex items-center justify-center gap-5">
        <button onClick={() => setPoints((p) => Math.max(0, p - 1))} className="btn btn-gray h-11 w-11 p-0 text-[22px]" aria-label={t('Fewer points')}>
          −
        </button>
        <span className="title1 w-16 text-center tabular-nums">{points}/8</span>
        <button onClick={() => setPoints((p) => Math.min(MAX_POINTS, p + 1))} className="btn btn-gray h-11 w-11 p-0 text-[22px]" aria-label={t('More points')}>
          +
        </button>
      </div>
      {solution && <Rich text={solution} className="problem secondary mt-4" />}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button onClick={onCancel} className="btn btn-gray">
          {t('Cancel')}
        </button>
        <button onClick={() => onScore({ source: 'self', score: points, summary: t('Marked by you with the official solution.') })} className="btn btn-filled">
          {t('Save {n}/8', { n: points })}
        </button>
      </div>
    </div>
  )
}

// A sheet that slides up from the bottom (a centred dialog on a laptop)
export function Sheet({ children, onClose, label }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  // A portal: the screen transitions animate a transform, which would otherwise trap a fixed sheet inside the page
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="sheet sheet-up relative w-full max-w-md rounded-t-[20px] px-4 pb-4 pt-2 lg:rounded-[20px] lg:pb-5" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto mb-3 h-[5px] w-9 rounded-full lg:hidden" style={{ background: 'var(--tertiary)' }} />
        {children}
      </div>
    </div>,
    document.body,
  )
}

// A typed proof survives a reload or a crash: kept per problem until it's cleared
export function useDraft(key) {
  const storageKey = key ? `qed-draft:${key}` : null
  const [text, setText] = useState(() => {
    try {
      return (storageKey && localStorage.getItem(storageKey)) || ''
    } catch {
      return ''
    }
  })
  const update = (v) => {
    setText(v)
    try {
      if (!storageKey) return
      if (v) localStorage.setItem(storageKey, v)
      else localStorage.removeItem(storageKey)
    } catch {}
  }
  return [text, update]
}

// A ticking clock, for timers that live in saved state
export function useNow(on = true) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!on) return
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [on])
  return now
}
