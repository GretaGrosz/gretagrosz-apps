// Ask: tap the axolotl, ask about the project you're on. It answers with your steps in mind and can propose
// steps you add with one tap. Needs a connection; says so plainly when there isn't one.
import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { Icon, Sheet, SheetHeader } from '../components/ui'
import Mascot from './Mascot'
import { fx, svgIn } from './motion'
import { ask, AskError } from './api'
import { focusProject } from './tips'

// Conversations stay while the app is open, one per project
const threads = new Map()
const NONE = '__none'

const ERRORS = {
  offline: 'You’re offline. Ask me again when you’re back online.',
  timeout: 'That took too long. Try again?',
  quota: 'Blank ran out of imagination for today. Come back tomorrow!',
  busy: 'Blank ran out of imagination for today. Come back tomorrow!',
  not_configured: 'Asking isn’t available here yet.',
  too_big: 'That’s a bit long. Try a shorter question.',
}

export default function AskSheet({ projectId: initialId, prompt, onClose }) {
  const { data, active, actions } = useStore()
  const { t, lang } = useT()
  const pickable = [...active, ...data.projects.filter((p) => p.status === 'done')]
  const [projectId, setProjectId] = useState(() => {
    if (initialId && data.projects.some((p) => p.id === initialId)) return initialId
    return focusProject(data, active)?.id || active[0]?.id || NONE
  })
  const project = data.projects.find((p) => p.id === projectId) || null
  const [thread, setThread] = useState(() => threads.get(projectId) || [])
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | <error code>
  const [left, setLeft] = useState(null)
  const end = useRef(null)
  const mascot = useRef(null)
  const input = useRef(null)
  const sentPrompt = useRef(false)

  useEffect(() => {
    threads.set(projectId, thread)
  }, [projectId, thread])

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end', behavior: thread.length > 1 ? 'smooth' : 'auto' })
  }, [thread.length, status])

  const switchProject = (id) => {
    setProjectId(id)
    setThread(threads.get(id) || [])
    setStatus('idle')
  }

  const send = async (question, mode = 'ask') => {
    const q = question.trim()
    if (status === 'loading' || (mode === 'ask' && q.length < 2)) return
    const history = thread.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }))
    const shown = mode === 'split' ? t('Split “{step}” into smaller steps', { step: project?.milestones.find((m) => !m.done)?.text || '' }) : q
    setThread((th) => [...th, { role: 'user', text: shown }])
    setText('')
    setStatus('loading')
    try {
      const res = await ask({ question: q, mode, project, history, lang })
      setThread((th) => [...th, { role: 'assistant', text: res.answer, steps: res.steps, added: [] }])
      if (res.left != null) setLeft(res.left)
      setStatus('idle')
      fx.hop(svgIn(mascot.current))
    } catch (e) {
      // The question goes back into the field so nothing typed is lost
      setThread((th) => th.slice(0, -1))
      if (mode === 'ask') setText(q)
      setStatus(e instanceof AskError ? e.code : 'server')
    }
  }

  // Opened with a question already (e.g. from a tip)
  useEffect(() => {
    if (!prompt || sentPrompt.current) return
    sentPrompt.current = true
    send(prompt.text || '', prompt.mode || 'ask')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addStep = (mi, si, step) => {
    if (!project || project.status === 'done') return
    actions.addStep(project.id, step)
    setThread((th) => th.map((m, i) => (i === mi ? { ...m, added: [...m.added, si] } : m)))
  }
  const addAll = (mi) => {
    const m = thread[mi]
    m.steps.forEach((s, si) => !m.added.includes(si) && actions.addStep(project.id, s))
    setThread((th) => th.map((x, i) => (i === mi ? { ...x, added: x.steps.map((_, si) => si) } : x)))
  }

  const next = project?.milestones.find((m) => !m.done)
  const quick = [
    project && project.status !== 'done' && { label: t('What’s next?'), run: () => send(t('What should I do next?')) },
    next && { label: t('Split this step'), run: () => send('', 'split') },
    next && { label: t('I’m stuck'), run: () => send(t('I’m stuck on “{step}”. What can I try?', { step: next.text })) },
    !project && { label: t('Give me a project idea'), run: () => send(t('Give me an idea for a small project I could start this week.')) },
  ].filter(Boolean)
  const canAdd = project && project.status !== 'done'
  const loading = status === 'loading'
  const error = status !== 'idle' && !loading ? status : null

  return (
    <Sheet onClose={onClose} label={t('Ask')} className="flex flex-col">
      <SheetHeader title={t('Ask')} onClose={onClose} />
      <div className="flex items-center gap-3 px-5 pb-2">
        <button
          ref={mascot}
          type="button"
          onClick={() => fx.boop(svgIn(mascot.current))}
          className="shrink-0 rounded-full"
          aria-label={t('Axolotl')}
        >
          <Mascot size={56} mood={loading ? 'thinking' : error ? 'worried' : thread.length ? 'happy' : 'wave'} />
        </button>
        {pickable.length > 0 ? (
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">{t('Project')}</span>
            <select
              value={projectId}
              onChange={(e) => switchProject(e.target.value)}
              className="h-11 w-full appearance-none truncate rounded-full bg-mist pl-4 pr-9 text-[16px] font-medium text-ink outline-none focus-visible:ring-2 focus-visible:ring-spark-ink/40"
            >
              {pickable.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
              <option value={NONE}>{t('Something else')}</option>
            </select>
            <Icon name="chevron" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-sub" strokeWidth={2.6} />
          </label>
        ) : (
          <p className="flex-1 text-[17px] font-medium">{t('Ask me anything about your hobby.')}</p>
        )}
      </div>

      <div className="min-h-[120px] flex-1 px-5 pt-2" aria-live="polite">
        {thread.length === 0 && !loading && quick.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {quick.map((q) => (
              <button key={q.label} onClick={q.run} className="btn-tinted min-h-[38px] px-4 text-[15px]">
                {q.label}
              </button>
            ))}
          </div>
        )}
        <ul className="space-y-3">
          {thread.map((m, mi) =>
            m.role === 'user' ? (
              <li key={mi} className="flex animate-rise justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-[20px] rounded-br-[6px] bg-spark px-4 py-2.5 text-[16px] leading-snug text-white">
                  {m.text}
                </p>
              </li>
            ) : (
              <li key={mi} className="animate-rise">
                {m.text && (
                  <p className="max-w-[92%] whitespace-pre-wrap break-words rounded-[20px] rounded-bl-[6px] bg-mist px-4 py-2.5 text-[16px] leading-snug">{m.text}</p>
                )}
                {m.steps?.length > 0 && (
                  <div className="mt-2 max-w-[92%] overflow-hidden rounded-[16px] border border-line/20">
                    <ul className="divide-y divide-line/15">
                      {m.steps.map((s, si) => {
                        const added = m.added.includes(si)
                        return (
                          <li key={si} className="flex min-h-[48px] items-center gap-3 py-1.5 pl-4 pr-1.5">
                            <span className="min-w-0 flex-1 text-[15px] leading-snug">{s}</span>
                            {canAdd &&
                              (added ? (
                                <span className="flex h-10 w-10 shrink-0 animate-pop items-center justify-center text-good" role="img" aria-label={t('Added')}>
                                  <Icon name="check" className="h-5 w-5" strokeWidth={2.8} />
                                </span>
                              ) : (
                                <button
                                  onClick={() => addStep(mi, si, s)}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spark-soft text-spark-ink active:scale-95"
                                  aria-label={t('Add “{step}”', { step: s })}
                                >
                                  <Icon name="plus" className="h-5 w-5" strokeWidth={2.6} />
                                </button>
                              ))}
                          </li>
                        )
                      })}
                    </ul>
                    {canAdd && m.steps.length > 1 && m.added.length < m.steps.length && (
                      <button onClick={() => addAll(mi)} className="h-11 w-full border-t border-line/15 text-[15px] font-semibold text-spark-ink active:bg-mist">
                        {t('Add all {n}', { n: m.steps.length - m.added.length })}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ),
          )}
          {loading && (
            <li className="flex animate-rise" aria-label={t('Thinking')}>
              <span className="flex h-[42px] items-center gap-1 rounded-[20px] rounded-bl-[6px] bg-mist px-4">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="axo-dot h-2 w-2 rounded-full bg-ink/40" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </span>
            </li>
          )}
        </ul>
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-bad/10 px-3 py-2.5 text-[15px] text-bad" role="alert">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{t(ERRORS[error] || 'Something went wrong. Try again?')}</span>
          </div>
        )}
        <div ref={end} className="h-2" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(text)
        }}
        className="sticky bottom-0 mt-2 flex items-end gap-2 bg-card px-5 pt-2"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t('Your question')}</span>
          <textarea
            ref={input}
            rows={1}
            maxLength={400}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              if (error) setStatus('idle')
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && matchMedia('(hover: hover)').matches) {
                e.preventDefault()
                send(text)
              }
            }}
            placeholder={project && project.status !== 'done' ? t('Ask about {title}', { title: project.title }) : t('Ask something')}
            className="block max-h-[120px] min-h-[44px] w-full resize-none rounded-[22px] bg-mist px-4 py-[10px] text-[16px] leading-snug text-ink outline-none placeholder:text-ink/40 focus:ring-2 focus:ring-spark-ink/40"
          />
        </label>
        <button
          disabled={loading || text.trim().length < 2}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-spark text-white transition active:scale-95 disabled:opacity-35"
          aria-label={t('Send')}
        >
          <Icon name="up" className="h-5 w-5" strokeWidth={2.6} />
        </button>
      </form>
      {left != null && left <= 3 && <p className="px-5 pt-1.5 text-center text-[13px] text-sub">{t(left === 1 ? '1 question left today' : '{n} questions left today', { n: left })}</p>}
    </Sheet>
  )
}
