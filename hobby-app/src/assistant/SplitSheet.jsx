// A step that's been sitting for days becomes a few smaller ones. Online, the axolotl drafts them;
// offline (or if that fails) you write them yourself. Either way you can edit before anything changes.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Icon, Sheet, SheetHeader } from '../components/ui'
import Mascot from './Mascot'
import { ask } from './api'

export default function SplitSheet({ projectId, stepId, onClose }) {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const project = data.projects.find((p) => p.id === projectId)
  const step = project?.milestones.find((m) => m.id === stepId)
  const [parts, setParts] = useState(['', ''])
  const [drafting, setDrafting] = useState(true)
  const touched = useRef(false)

  useEffect(() => {
    if (!project || !step) return
    let alive = true
    ask({ mode: 'split', project, lang })
      .then((res) => {
        if (alive && !touched.current && res.steps.length >= 2) setParts(res.steps.slice(0, 4))
      })
      .catch(() => {})
      .finally(() => alive && setDrafting(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!project || !step || step.done) onClose()
  }, [project, step, onClose])
  if (!project || !step) return null

  const edit = (i, v) => {
    touched.current = true
    setParts((ps) => ps.map((p, j) => (j === i ? v : p)))
  }
  const filled = parts.filter((p) => p.trim()).length

  return (
    <Sheet onClose={onClose} label={t('Split it up')}>
      <SheetHeader title={t('Split it up')} onClose={onClose} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (filled < 2) return
          actions.splitStep(project.id, step.id, parts)
          actions.toast({ text: '“{step}” is now {n} steps', vars: { step: step.text, n: filled } })
          onClose()
        }}
        className="px-5 pt-1"
      >
        <div className="flex items-center gap-3">
          <Mascot size={52} mood={drafting ? 'thinking' : 'happy'} />
          <p className="min-w-0 flex-1 text-[17px] font-semibold leading-snug line-through decoration-ink/30">{step.text}</p>
        </div>
        <ol className="mt-4 space-y-2">
          {parts.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-5 shrink-0 text-right text-[15px] font-semibold tabular-nums text-sub">{i + 1}</span>
              <input
                className={`input ${drafting && !p ? 'animate-pulse' : ''}`}
                value={p}
                maxLength={120}
                onChange={(e) => edit(i, e.target.value)}
                placeholder={drafting ? '' : t('Smaller step')}
                aria-label={t('Step {n}', { n: i + 1 })}
                enterKeyHint={i === parts.length - 1 ? 'done' : 'next'}
              />
              {parts.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    touched.current = true
                    setParts((ps) => ps.filter((_, j) => j !== i))
                  }}
                  className="flex h-11 w-9 shrink-0 items-center justify-center text-sub active:opacity-60"
                  aria-label={t('Remove step')}
                >
                  <Icon name="x" className="h-4 w-4" strokeWidth={2.4} />
                </button>
              )}
            </li>
          ))}
        </ol>
        {parts.length < 4 && (
          <button
            type="button"
            onClick={() => {
              touched.current = true
              setParts((ps) => [...ps, ''])
            }}
            className="mt-1 flex h-11 items-center gap-2 pl-7 text-[17px] text-spark-ink active:opacity-60"
          >
            <Icon name="plus" className="h-5 w-5" /> {t('Add a step')}
          </button>
        )}
        <button className="btn-primary btn-lg mt-3 w-full" disabled={filled < 2}>
          {t('Replace with {n} steps', { n: Math.max(2, filled) })}
        </button>
      </form>
    </Sheet>
  )
}
