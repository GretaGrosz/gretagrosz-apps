import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store.js'
import { charDiff, wordDiff, normalize } from '../lib/check.js'
import Icon from './Icon.jsx'

export const go = (path) => { window.location.hash = '#' + path }
export const back = () => (history.length > 1 ? history.back() : go('/'))

export function TopBar({ title, onBack = back, right }) {
  return (
    <div className="safe-t sticky top-0 z-20 -mx-4 mb-3 flex items-center gap-2 bg-[#f4f6f5]/90 px-4 pb-2 backdrop-blur dark:bg-[#0e1311]/90">
      {onBack && (
        <button onClick={onBack} aria-label="Zurück" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-black/5 active:bg-black/5 dark:hover:bg-white/10"><Icon name="chevronLeft" size={24} /></button>
      )}
      <h1 className="flex-1 truncate text-lg font-bold">{title}</h1>
      {right}
    </div>
  )
}

// wide = desktop pages with columns (Heute, Training, Schreiben, Ich); otherwise a comfortable reading width
export function Page({ children, className = '', wide = false }) {
  return <div className={`mx-auto max-w-xl px-4 pb-28 lg:pb-16 lg:pt-4 ${wide ? 'lg:max-w-6xl lg:px-10' : 'lg:max-w-3xl lg:px-8'} ${className}`}>{children}</div>
}

export function Progress({ value, className = '', color = 'bg-brand' }) {
  return (
    <div className={`h-3 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 ${className}`}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }} />
    </div>
  )
}

// English explanation, hidden when the toggle in settings is off
export function En({ children, className = '' }) {
  const show = useStore((s) => s.setup.showEn)
  if (!show || !children) return null
  return <p className={`en ${className}`}><span className="mr-1.5 rounded bg-black/5 px-1 py-px text-[10px] font-bold not-italic tracking-wide dark:bg-white/10">EN</span>{children}</p>
}

const UMLAUTS = ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü', '„', '“']
let lastInput = null
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    if (e.target.matches?.('input[type=text], textarea, input:not([type])')) lastInput = e.target
  })
}
export function insertText(ch) {
  const el = lastInput
  if (!el || !document.body.contains(el)) return
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? el.value.length
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value').set
  setter.call(el, el.value.slice(0, start) + ch + el.value.slice(end))
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.focus()
  requestAnimationFrame(() => el.setSelectionRange(start + ch.length, start + ch.length))
}
export function UmlautBar({ className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {UMLAUTS.map((u) => (
        <button key={u} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => insertText(u)}
          className="h-10 min-w-[40px] rounded-lg bg-white px-2 text-lg font-semibold shadow-sm ring-1 ring-black/10 active:bg-brand-light dark:bg-[#1d2622] dark:ring-white/10">
          {u}
        </button>
      ))}
    </div>
  )
}

// Character-level diff: red = wrong/extra in your answer, green underline = missing
export function Diff({ given, correct, mode = 'char' }) {
  const parts = mode === 'word' ? wordDiff(given, correct) : charDiff(given, correct)
  return (
    <div className="space-y-1 font-mono text-[15px] leading-relaxed">
      <div>
        <span className="mr-1 text-xs font-sans muted">Du:</span>
        {parts.map((p, i) => p.t === 'ins' ? null : (
          <span key={i} className={p.t === 'del' ? 'rounded bg-red-200 text-red-800 line-through decoration-red-500 dark:bg-red-900/60 dark:text-red-200' : ''}>{mode === 'word' ? p.v + ' ' : p.v}</span>
        ))}
      </div>
      <div>
        <span className="mr-1 text-xs font-sans muted">Richtig:</span>
        {parts.map((p, i) => p.t === 'del' ? null : (
          <span key={i} className={p.t === 'ins' ? 'rounded bg-green-200 font-bold text-green-900 underline dark:bg-green-900/60 dark:text-green-100' : ''}>{mode === 'word' ? p.v + ' ' : p.v}</span>
        ))}
      </div>
    </div>
  )
}

export function Stat({ label, value, sub, icon }) {
  return (
    <div className="card flex-1 !p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-xs font-medium muted">{icon && <Icon name={icon} size={14} />}{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs muted">{sub}</div>}
    </div>
  )
}

export function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div className="safe-b max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 animate-pop sm:rounded-3xl dark:bg-[#18201c]" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export function useCountdown(seconds, running, onEnd) {
  const [left, setLeft] = useState(seconds)
  const end = useRef(onEnd)
  end.current = onEnd
  useEffect(() => setLeft(seconds), [seconds])
  useEffect(() => {
    if (!running) return
    const t0 = Date.now()
    const start = left
    const id = setInterval(() => {
      const l = Math.max(0, start - Math.floor((Date.now() - t0) / 1000))
      setLeft(l)
      if (l === 0) { clearInterval(id); end.current?.() }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])
  return left
}

export const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
export const sameText = (a, b) => normalize(a) === normalize(b)

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/10">
      {tabs.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)} className={`min-h-[40px] flex-1 rounded-xl px-2 text-sm font-semibold ${value === k ? 'bg-white shadow-sm dark:bg-[#26302b]' : 'muted'}`}>{label}</button>
      ))}
    </div>
  )
}
