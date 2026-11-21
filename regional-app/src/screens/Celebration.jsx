import { useEffect, useMemo, useState } from 'react'
import { t, tn } from '../i18n'
import { Ring, STATUS } from '../ui'

const CONFETTI = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55']

// Shown when a day is finished. Continue works straight away and a tap anywhere dismisses it.
export function Celebration({ status, kind, from, to, title, score, onDone }) {
  const reduced = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [filled, setFilled] = useState(reduced ? 1 : 0.04)
  useEffect(() => {
    if (reduced) return
    const a = setTimeout(() => setFilled(1), 250)
    return () => clearTimeout(a)
  }, [reduced])
  useEffect(() => {
    const onKey = (e) => (e.key === 'Escape' || e.key === 'Enter') && onDone()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])
  const mastered = status === 'mastered'
  const color = STATUS[status].color
  const colors = mastered ? ['#AF52DE', '#BF5AF2', '#5856D6', '#FF2D55'] : CONFETTI
  const pieces = useMemo(
    () => (reduced ? [] : Array.from({ length: 40 }, (_, i) => ({ left: `${(i * 53) % 100}%`, delay: `${0.2 + (i % 10) * 0.05}s`, color: colors[i % colors.length], duration: `${1.8 + (i % 5) * 0.25}s` }))),
    [reduced],
  )
  const heading = kind === 'paper' ? t('Paper done') : mastered ? t('Day mastered') : t('Day passed')

  return (
    <div onClick={onDone} className="fade-in fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center overflow-hidden px-6 text-center" style={{ background: 'var(--bg)' }} role="dialog" aria-label={heading}>
      {pieces.map((p, i) => (
        <span key={i} className="confetti-piece" style={{ left: p.left, background: p.color, animationDelay: p.delay, animationDuration: p.duration }} />
      ))}
      <p className="footnote rise font-semibold uppercase">{score ? t('{score} points', { score }) : mastered ? t('Challenge solved') : kind === 'learn' ? t('All 3 solved') : t('Done')}</p>
      <div className="pop mt-6">
        <Ring value={filled} size={220} stroke={22} color={color}>
          {to != null ? (
            <>
              <span className="num-out absolute text-[72px] font-bold leading-none tracking-tight tabular-nums">{from}</span>
              <span className="num-in absolute text-[72px] font-bold leading-none tracking-tight tabular-nums">{to}</span>
            </>
          ) : (
            <svg viewBox="0 0 24 24" className="num-in absolute h-20 w-20" fill={color} aria-hidden="true">
              <path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
            </svg>
          )}
        </Ring>
      </div>
      <h1 className="large-title rise mt-8" style={{ animationDelay: '0.35s' }}>
        {heading}
      </h1>
      <p className="body secondary rise mt-1" style={{ animationDelay: '0.45s' }}>
        <span lang="de">{title}</span>
        {to != null ? ` · ${tn(to, '{n}-day streak', '{n}-day streak')}` : ''}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDone()
        }}
        autoFocus
        className="btn btn-filled mt-10 w-full max-w-xs"
      >
        {t('Continue')}
      </button>
    </div>
  )
}
