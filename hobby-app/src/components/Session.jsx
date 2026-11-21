// A focus session: a timer sized to the time you said you have. It runs on timestamps, so it keeps
// counting when the phone locks or the tab reloads, and a finished session counts for your streak.
import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Confetti, Icon, PhotoError, Sheet, SheetHeader } from './ui'
import Mascot from '../assistant/Mascot'
import { useStepPhoto } from './StepPhoto'

export function useSessionClock(session) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!session) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])
  if (!session) return { label: '', progress: 0, done: false, elapsed: 0 }
  const total = session.minutes * 60000
  const elapsed = Math.max(0, now - session.startedAt)
  const remaining = Math.max(0, total - elapsed)
  const s = Math.ceil(remaining / 1000)
  return {
    label: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`,
    progress: Math.min(1, elapsed / total),
    done: remaining === 0,
    elapsed,
  }
}

export default function SessionSheet({ onClose }) {
  const { data, actions } = useStore()
  const { t, tn } = useT()
  const s = data.session
  const clock = useSessionClock(s)
  // Done means a photo of the step first
  const snap = useStepPhoto()
  const project = s && data.projects.find((p) => p.id === s.projectId)
  if (!s || !project) return null
  const next = project.milestones.find((m) => !m.done)
  const R = 120
  const C = 2 * Math.PI * R
  const elapsedMin = Math.max(1, Math.round(clock.elapsed / 60000))

  const finish = (keep) => {
    // A kept session is answered by the axolotl's check-in (assistant/tips.js, 'session'), not a toast
    actions.endSession(keep)
    onClose()
  }

  return (
    <Sheet onClose={onClose} label={t('Session')}>
      <SheetHeader title={project.title} onClose={onClose} />
      <div className="relative flex flex-col items-center px-5 pb-2 pt-4">
        {clock.done && <Confetti />}
        <div className="relative h-[240px] w-[240px]">
          <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="130" cy="130" r={R} fill="none" stroke="rgb(var(--ink) / 0.08)" strokeWidth="12" />
            <circle
              cx="130"
              cy="130"
              r={R}
              fill="none"
              stroke={clock.done ? 'rgb(var(--good))' : 'rgb(var(--accent))'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - clock.progress)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {clock.done ? (
              <Mascot size={132} mood="cheer" title="" />
            ) : (
              <span className="text-[56px] font-bold tabular-nums leading-none tracking-tight" role="timer" aria-live="off">
                {clock.label}
              </span>
            )}
            <span className="mt-2 text-[15px] text-sub">{tn(s.minutes, '{n} minute', '{n} minutes')}</span>
          </div>
        </div>
        {next ? (
          <button
            key={next.id}
            onClick={() => snap.open(project.id, next)}
            disabled={snap.busy}
            className="mt-5 flex w-full max-w-sm animate-rise items-center gap-3 rounded-[16px] bg-mist px-4 py-3 text-left active:scale-[0.98]"
            role="checkbox"
            aria-checked="false"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink/25" />
            <span className="min-w-0 flex-1 text-[17px] font-medium leading-snug">{next.text}</span>
            <Icon name={next.quick ? 'check' : 'camera'} className="h-5 w-5 shrink-0 text-sub" />
          </button>
        ) : (
          project.milestones.length > 0 && <p className="mt-5 flex items-center gap-2 text-[17px] font-semibold text-good">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.8} /> {t('Every step is done.')}
          </p>
        )}
        {snap.input}
        {snap.error && (
          <div className="mt-2 w-full max-w-sm">
            <PhotoError code={snap.error} onDismiss={snap.clearError} />
          </div>
        )}
        {/* Something you enjoy while you work makes you come back more often (Milkman et al. 2014): Tape, Greta's
            music player, opens next to Blank and the timer keeps running (it counts from when you started) */}
        {!clock.done && (
          <a href="/music/" target="_blank" rel="noopener" className="mt-3 flex flex-col items-center active:opacity-60">
            <span className="flex items-center gap-1.5 text-[15px] font-semibold text-spark-ink">
              <Icon name="play" className="h-4 w-4" /> {t('Put on your music')}
            </span>
            <span className="text-[13px] text-sub">{t('the timer keeps running')}</span>
          </a>
        )}
      </div>
      <div className="flex flex-col gap-2 px-5 pt-4">
        {clock.done ? (
          <button onClick={() => finish(true)} className="btn-primary btn-lg" data-autofocus>
            {t('Log {n} minutes', { n: s.minutes })}
          </button>
        ) : (
          <>
            {clock.elapsed < 60000 ? (
              <button onClick={() => finish(false)} className="btn-plain btn-lg">
                {t('Cancel session')}
              </button>
            ) : (
              <>
                <button onClick={() => finish(true)} className="btn-plain btn-lg">
                  {t('End and log {n} min', { n: elapsedMin })}
                </button>
                <button onClick={() => finish(false)} className="btn min-h-[44px] text-bad">
                  {t('Cancel session')}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
