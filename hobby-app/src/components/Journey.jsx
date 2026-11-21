// Journeys (journey.js): a quick update while you make something (a photo, a tag, maybe a line), and at the end a
// plan made from your updates that you fix up and post, so others can make it too.
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { BUDGETS, LEVELS, PACES, TAG, TAGS, draftPlan, nextPlan } from '../journey'
import { GUIDES, pick, resourcesFor, stepsFor } from '../guides'
import { tidySteps } from '../assistant/api'
import { TIME_LABEL } from '../data'
import { Icon, Photo, PhotoError, Sheet, SheetHeader, Spinner, usePhotoPicker } from './ui'

const PLACEHOLDER = {
  step: 'Anything to add? (optional)',
  bought: 'What did you get? Like “wool, 4 mm needles”',
  mistake: 'What went wrong, and what would you do next time?',
  tip: 'Your tip for someone making this',
}

// A photo, a tag, a line: under 10 seconds. "Finished a step" ticks that step with the photo.
export function QuickUpdate({ project }) {
  const { actions } = useStore()
  const { t } = useT()
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const [tag, setTag] = useState(null)
  const open = project.milestones.filter((m) => !m.done && !m.auto)
  const [stepId, setStepId] = useState(open[0]?.id || '')
  const picker = usePhotoPicker(async (res) => setPhoto(res))
  const step = open.find((m) => m.id === stepId) || open[0]
  // A step only counts as done with a photo of it (StepPhoto.jsx), so "Finished a step" needs one
  const needsPhoto = tag === 'step' && !photo
  const ready = !needsPhoto && (text.trim() || photo)
  const submit = (e) => {
    e.preventDefault()
    if (!ready) return
    actions.addEntry(project.id, {
      text: tag === 'step' && step && !text.trim() ? step.text : text,
      photo: photo?.ref || null,
      ratio: photo?.ratio || null,
      tag,
      step: tag === 'step' ? step?.id : null,
    })
    if (tag === 'step' && step) actions.toggleStep(project.id, step.id)
    setText('')
    setPhoto(null)
    setTag(null)
    setStepId(open.find((m) => m.id !== step?.id)?.id || '')
  }
  return (
    <form onSubmit={submit} className="surface p-3">
      {/* Tap instead of typing */}
      <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none]" role="group" aria-label={t('What kind of update?')}>
        {TAGS.filter((k) => k !== 'step' || open.length).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTag(tag === k ? null : k)}
            aria-pressed={tag === k}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[15px] font-medium ${tag === k ? 'bg-ink text-card' : 'bg-mist'}`}
          >
            <Icon name={TAG[k].icon} className="h-4 w-4" /> {t(TAG[k].label)}
          </button>
        ))}
      </div>
      {tag === 'step' && open.length > 1 && (
        <select className="input mb-2" value={step?.id || ''} onChange={(e) => setStepId(e.target.value)} aria-label={t('Which step?')}>
          {open.map((m) => (
            <option key={m.id} value={m.id}>
              {m.text}
            </option>
          ))}
        </select>
      )}
      {tag === 'step' && open.length === 1 && <p className="mb-2 px-1 text-[15px] font-medium">{step.text}</p>}
      <textarea
        className="input min-h-[64px] resize-none bg-transparent px-1 py-1 focus:ring-0"
        placeholder={t(PLACEHOLDER[tag] || 'What did you do today?')}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        aria-label={t('Journal entry')}
      />
      {photo && (
        <div className="relative mt-2 w-28 animate-scale-in">
          <Photo src={photo.ref} className="aspect-square w-full rounded-[12px]" w={300} />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-card"
            aria-label={t('Remove photo')}
          >
            <Icon name="x" className="h-3.5 w-3.5" strokeWidth={2.8} />
          </button>
        </div>
      )}
      {picker.error && (
        <div className="mt-2">
          <PhotoError code={picker.error} onDismiss={picker.clearError} />
        </div>
      )}
      {needsPhoto && <p className="mt-1 px-1 text-[13px] text-sub">{t('Add a photo of it to tick the step off.')}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onClick={picker.open} disabled={picker.busy} className="btn-plain min-h-[40px] px-4">
          {picker.busy ? <Spinner className="h-4 w-4" /> : <Icon name="camera" className="h-5 w-5" />} {t('Photo')}
        </button>
        {picker.input}
        <button className="btn-primary min-h-[40px]" disabled={!ready}>
          {t('Add')}
        </button>
      </div>
    </form>
  )
}

const AI_ERROR = {
  quota: 'Blank ran out of imagination for today. Try again tomorrow.',
  busy: 'Blank ran out of imagination for today. Try again tomorrow.',
  offline: 'You’re offline. Connect to the internet and try again.',
}

// The plan from your updates: fix it up (or let the AI tidy it), then post it with your result
export function PlanDraftSheet({ project, onClose, onPublish }) {
  const { t, lang } = useT()
  const { actions } = useStore()
  const draft = useMemo(() => draftPlan(project, t), [project, t])
  const [steps, setSteps] = useState(draft.steps.length ? draft.steps : [{ text: '', how: '' }])
  const [materials, setMaterials] = useState(draft.materials.join('\n'))
  const [tidying, setTidying] = useState(false)
  const set = (i, patch) => setSteps((list) => list.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i, by) =>
    setSteps((list) => {
      const next = [...list]
      const [x] = next.splice(i, 1)
      next.splice(i + by, 0, x)
      return next
    })
  const filled = steps.filter((s) => s.text.trim())
  const tidy = async () => {
    if (tidying || !filled.length) return
    setTidying(true)
    try {
      setSteps(await tidySteps({ title: project.title, steps: filled, lang }))
    } catch (e) {
      actions.toast({ text: AI_ERROR[e.code] || 'The AI couldn’t tidy it right now. Your steps are still here.' })
    } finally {
      setTidying(false)
    }
  }
  const publish = () =>
    onPublish({
      plan: filled.map((s) => s.text.trim()),
      planHow: filled.map((s) => (s.how || '').trim()),
      materials: materials
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean),
      time: draft.time,
    })
  return (
    <Sheet onClose={onClose} label={t('Your plan')} wide>
      <SheetHeader title={t('Your plan')} onClose={onClose} />
      <div className="px-5 pb-3">
        <p className="px-1 text-[15px] text-sub">
          {t('Made from your updates. Fix anything, then post it so others can make it too.')} · {t(TIME_LABEL[draft.time])}
        </p>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="surface p-3">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-[15px] font-semibold tabular-nums text-sub">{i + 1}</span>
                <input
                  className="input min-w-0 flex-1"
                  value={s.text}
                  onChange={(e) => set(i, { text: e.target.value })}
                  placeholder={t('What to do')}
                  maxLength={120}
                  aria-label={t('Step {n}', { n: i + 1 })}
                />
              </div>
              <textarea
                className="input mt-2 min-h-[52px] resize-none text-[15px]"
                value={s.how}
                onChange={(e) => set(i, { how: e.target.value })}
                placeholder={t('How, a tip, or what to watch out for (optional)')}
                maxLength={300}
                aria-label={t('How to do it')}
              />
              <div className="mt-1 flex justify-end gap-1 text-sub">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="flex h-9 w-9 items-center justify-center rounded-full active:bg-mist disabled:opacity-30" aria-label={t('Move up')}>
                  <Icon name="up" className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={i === steps.length - 1}
                  onClick={() => move(i, 1)}
                  className="flex h-9 w-9 rotate-180 items-center justify-center rounded-full active:bg-mist disabled:opacity-30"
                  aria-label={t('Move down')}
                >
                  <Icon name="up" className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setSteps((list) => list.filter((_, j) => j !== i))} className="flex h-9 w-9 items-center justify-center rounded-full active:bg-mist" aria-label={t('Remove')}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setSteps((list) => [...list, { text: '', how: '' }])} className="btn-plain mt-2 w-full">
          <Icon name="plus" className="h-5 w-5" /> {t('Add a step')}
        </button>
        <h3 className="section-label mt-5">{t('What you need')}</h3>
        <textarea
          className="input min-h-[90px] resize-none text-[15px]"
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder={t('One thing per line')}
          aria-label={t('What you need')}
        />
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={tidy} disabled={tidying || !filled.length} className="btn-tinted btn-lg flex-1">
            {tidying ? <Spinner className="h-5 w-5" /> : <Icon name="pencil" className="h-5 w-5" />} {t('Tidy the steps with AI')}
          </button>
          <button type="button" onClick={publish} disabled={!filled.length || tidying} className="btn-primary btn-lg flex-1">
            {t('Post it with the plan')}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

// Three quick questions before a start, already filled in from last time: most people just tap Start
export function StartQuestions({ title, onClose, onStart, busy = false, error = null }) {
  const { t } = useT()
  const { data, actions } = useStore()
  const prefs = data.me.prefs || {}
  const [budget, setBudget] = useState(prefs.budget || 'cheap')
  const [pace, setPace] = useState(prefs.pace || 'few')
  const [level, setLevel] = useState(prefs.level || 'new')
  const go = () => {
    actions.savePrefs({ budget, pace, level })
    onStart({ budget, pace, level })
  }
  const Row = ({ label, options, value, set }) => (
    <div className="mt-4">
      <p className="px-1 pb-1.5 text-[15px] font-medium text-sub">{t(label)}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t(label)}>
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={value === id}
            onClick={() => set(id)}
            className={`h-10 rounded-full px-4 text-[15px] font-medium ${value === id ? 'bg-ink text-card' : 'bg-mist'}`}
          >
            {t(text)}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <Sheet onClose={onClose} label={title}>
      <SheetHeader title={title} onClose={onClose} />
      <div className="px-5 pb-3">
        <p className="px-1 text-[15px] text-sub">{t('Three quick questions, so the plan fits you.')}</p>
        <Row label="Your budget" options={BUDGETS} value={budget} set={setBudget} />
        <Row label="Time for it" options={PACES} value={pace} set={setPace} />
        <Row label="Your level" options={LEVELS} value={level} set={setLevel} />
        {error && (
          <p className="mt-4 px-1 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        <button onClick={go} disabled={busy} className="btn-primary btn-lg mt-6 w-full">
          {busy ? (
            <>
              <Spinner className="h-5 w-5" /> {t('Making your plan…')}
            </>
          ) : (
            t('Start')
          )}
        </button>
      </div>
    </Sheet>
  )
}

// Finished: the plan that builds on what you just learned (journey.js NEXT), one tap to start it
export function NextPlanCard({ project }) {
  const { t, lang } = useT()
  const { data, actions } = useStore()
  const navigate = useNavigate()
  const [asking, setAsking] = useState(false)
  const guide = nextPlan(project, data.projects, GUIDES)
  if (!guide) return null
  const title = pick(guide.title, lang)
  const startWith = ({ budget, pace, level }) => {
    const id = actions.addProject({ title, category: guide.category, guideKey: guide.key, steps: stepsFor(guide, level, lang), resources: resourcesFor(guide, lang) })
    actions.updateProject(id, { pace, budget })
    navigate(`/project/${id}`)
  }
  return (
    <section className="surface mt-4 flex items-center gap-3 p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">{t('Next')}</span>
        <span className="block text-[17px] font-semibold leading-snug">{title}</span>
        <span className="block text-[13px] text-sub">{pick(guide.time, lang)}</span>
      </span>
      <button onClick={() => setAsking(true)} className="btn-primary shrink-0 px-5">
        {t('Start')}
      </button>
      {asking && <StartQuestions title={title} onClose={() => setAsking(false)} onStart={startWith} />}
    </section>
  )
}
