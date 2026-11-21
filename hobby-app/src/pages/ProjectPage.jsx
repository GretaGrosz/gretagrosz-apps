import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { dayNumber, progressOf, sessionMinutes } from '../data'
import { materialsFor } from '../guides'
import { TAG, paceLine } from '../journey'
import {
  BackButton,
  CheckCircle,
  Confetti,
  Icon,
  Photo,
  PhotoError,
  ProgressBar,
  ResourceList,
  Sheet,
  SheetHeader,
  Spinner,
  usePhotoPicker,
} from '../components/ui'
import { ProjectThumb, categoryLabel } from '../components/ProjectBits'
import { useUi } from '../components/Layout'
import ProgressReel from '../components/Reel'
import { SparkCard } from '../components/Spark'
import { TogetherEntry } from '../components/Together'
import { useAssistant } from '../assistant/Assistant'
import { PostSheet } from '../components/Social'
import { useStepPhoto } from '../components/StepPhoto'
import Mascot from '../assistant/Mascot'
import NextWhen from '../components/NextWhen'
import { NextPlanCard, PlanDraftSheet, QuickUpdate } from '../components/Journey'

// The big card with the one thing to do next
function NextStep({ project, onFinish }) {
  const { actions, data } = useStore()
  const { t, tn } = useT()
  const ui = useUi()
  const [burst, setBurst] = useState(0)
  const [first, setFirst] = useState('')
  const next = project.milestones.find((m) => !m.done)
  const doneCount = project.milestones.filter((m) => m.done).length
  const minutes = sessionMinutes(data.me.prefs)
  const running = data.session?.projectId === project.id
  const picker = usePhotoPicker(async ({ ref, ratio }) => actions.addEntry(project.id, { photo: ref, ratio }))
  // Done means a photo of the step first
  const snap = useStepPhoto(() => setBurst((n) => n + 1))

  return (
    <section data-axo-target={`project-${project.id}`} className="relative mt-6 overflow-hidden rounded-[22px] bg-spark p-5 text-white sm:p-6">
      {burst > 0 && <Confetti key={burst} />}
      {next ? (
        <>
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-white/80">
            {t('Step {n} of {total}', { n: doneCount + 1, total: project.milestones.length })}
          </p>
          <p key={next.id} className="mt-1.5 animate-rise text-[24px] font-bold leading-tight tracking-[-0.01em]">
            {next.text}
          </p>
          {/* How to do it: from the plan (guides.js, templates.js or the AI) */}
          {next.how && (
            <p key={`${next.id}-how`} className="mt-2 max-w-2xl animate-rise text-[16px] leading-snug text-white/90">
              {next.how}
            </p>
          )}
        </>
      ) : project.milestones.length ? (
        <p className="text-[24px] font-bold leading-tight">{t('Every step is done.')}</p>
      ) : (
        <>
          <p className="text-[24px] font-bold leading-tight">{t('What’s one thing you could do in 10 minutes?')}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!first.trim()) return
              actions.addStep(project.id, first)
              setFirst('')
            }}
            className="mt-4 flex gap-2"
          >
            <input
              className="input bg-white text-black placeholder:text-black/40"
              placeholder={t('First step')}
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              aria-label={t('First step')}
            />
            <button className="btn shrink-0 bg-white text-[rgb(var(--accent))]" disabled={!first.trim()}>
              {t('Add')}
            </button>
          </form>
        </>
      )}
      {project.milestones.length > 0 && (
        <div className="mt-5 flex items-center gap-2">
          {next ? (
            <button
              onClick={() => snap.open(project.id, next)}
              disabled={snap.busy}
              className="btn btn-lg min-w-0 flex-1 bg-white px-4 text-[rgb(var(--accent))] sm:max-w-[220px]"
            >
              {snap.busy ? <Spinner /> : <Icon name={next.quick ? 'check' : 'camera'} className="h-5 w-5" strokeWidth={next.quick ? 2.6 : 2} />} {t('Done')}
            </button>
          ) : (
            <button onClick={onFinish} className="btn btn-lg min-w-0 flex-1 bg-white px-4 text-[rgb(var(--accent))] sm:max-w-[220px]">
              <Icon name="trophy" className="h-5 w-5" /> {t('Finish project')}
            </button>
          )}
          <button
            onClick={() => (running ? ui.openSession() : (actions.startSession(project.id, minutes), ui.openSession()))}
            disabled={!!data.session && !running}
            className="btn btn-lg shrink-0 bg-white/20 px-4 tabular-nums text-white"
          >
            <Icon name="timer" className="h-5 w-5" /> {running ? t('Running') : tn(minutes, '{n} min', '{n} min')}
          </button>
          <button
            onClick={picker.open}
            disabled={picker.busy}
            className="btn btn-lg w-[50px] shrink-0 bg-white/20 px-0 text-white"
            aria-label={t('Add a progress photo')}
          >
            {picker.busy ? <Spinner /> : <Icon name="camera" className="h-5 w-5" />}
          </button>
          {picker.input}
          {snap.input}
        </div>
      )}
      {next && <p className="mt-3 text-[15px] text-white/80">{next.quick ? t('No photo needed for this one.') : t('Send a photo of it to tick it off.')}</p>}
      {snap.error && (
        <div className="mt-3 rounded-xl bg-white">
          <PhotoError code={snap.error} onDismiss={snap.clearError} />
        </div>
      )}
      {picker.error && (
        <div className="mt-3 rounded-xl bg-white">
          <PhotoError code={picker.error} onDismiss={picker.clearError} />
        </div>
      )}
    </section>
  )
}

function Steps({ project, editable }) {
  const { actions } = useStore()
  const { t, tn } = useT()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  // Only the next step shows its how line; tap the little arrow on another step to read its own
  const [open, setOpen] = useState(() => new Set())
  const nextId = project.milestones.find((m) => !m.done)?.id
  const toggleHow = (id) => setOpen((s) => (s.has(id) ? new Set([...s].filter((x) => x !== id)) : new Set([...s, id])))
  const snap = useStepPhoto()
  const add = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    actions.addStep(project.id, text)
    setText('')
  }
  const remove = (m) => {
    const removed = actions.removeStep(project.id, m.id)
    if (removed) actions.toast({ text: 'Step removed', action: { label: 'Undo', run: () => actions.restoreStep(project.id, removed) } })
  }
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between px-4 pb-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">{t('Steps')}</h2>
        {editable && project.milestones.length > 0 && (
          <button onClick={() => setEditing((v) => !v)} className="-mb-2 h-9 px-1 text-[17px] text-spark-ink active:opacity-60">
            {editing ? t('Done') : t('Edit')}
          </button>
        )}
      </div>
      {/* The pace you picked before starting (journey.js): same steps, how they spread over your weeks */}
      {paceLine(project) && (
        <p className="px-4 pb-2 text-[15px] text-sub">
          {paceLine(project).key === 'weekend'
            ? tn(paceLine(project).n, 'Weekend version: about {n} weekend left', 'Weekend version: about {n} weekends left')
            : paceLine(project).per === 1
              ? tn(paceLine(project).n, 'One step a week: about {n} week left', 'One step a week: about {n} weeks left')
              : tn(paceLine(project).n, 'Two steps a week: about {n} week left', 'Two steps a week: about {n} weeks left')}
        </p>
      )}
      <ul className="surface divide-y divide-line/15 overflow-hidden">
        {project.milestones.map((m) => (
          <li key={m.id} className="flex items-stretch">
            {editing ? (
              <div className="row min-h-[52px] animate-fade">
                <button
                  onClick={() => remove(m)}
                  className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bad text-white active:scale-95"
                  aria-label={t('Remove step')}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
                <input
                  key={m.text}
                  defaultValue={m.text}
                  onBlur={(ev) => {
                    const v = ev.target.value.trim()
                    if (v && v !== m.text) actions.editStep(project.id, m.id, v)
                    else ev.target.value = m.text
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Escape') ev.target.value = m.text
                    if (ev.key === 'Enter' || ev.key === 'Escape') ev.target.blur()
                  }}
                  enterKeyHint="done"
                  maxLength={120}
                  className="min-w-0 flex-1 bg-transparent py-3 text-[17px] leading-snug outline-none"
                  aria-label={t('Step')}
                />
              </div>
            ) : (
              <button
                disabled={!editable || snap.busy}
                onClick={() => (m.done ? actions.toggleStep(project.id, m.id) : snap.open(project.id, m))}
                className="row min-h-[52px] py-3 active:bg-mist disabled:active:bg-transparent"
                aria-pressed={m.done}
              >
                <CheckCircle done={m.done} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[17px] leading-snug transition-colors ${m.done && editable ? 'text-sub line-through decoration-ink/30' : ''}`}>
                    {m.text}
                  </span>
                  {m.how && !m.done && (m.id === nextId || open.has(m.id)) && <span className="mt-0.5 block text-[14px] leading-snug text-sub">{m.how}</span>}
                </span>
              </button>
            )}
            {!editing && m.how && !m.done && m.id !== nextId && (
              <button
                onClick={() => toggleHow(m.id)}
                className="flex w-11 shrink-0 items-start justify-center pt-4 text-sub active:bg-mist"
                aria-expanded={open.has(m.id)}
                aria-label={t('How to do it')}
              >
                <Icon name="chevron" className={`h-4 w-4 transition-transform ${open.has(m.id) ? '-rotate-90' : 'rotate-90'}`} strokeWidth={2.6} />
              </button>
            )}
          </li>
        ))}
        {editable && (
          <li>
            <form onSubmit={add} className="row min-h-[52px] gap-2 py-2">
              <Icon name="plus" className="h-[26px] w-[26px] shrink-0 p-0.5 text-sub" />
              <input
                className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-sub"
                placeholder={t('Add a step')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                enterKeyHint="done"
                aria-label={t('Add a step')}
              />
              {text.trim() && <button className="btn-primary min-h-[34px] px-4 text-[15px]">{t('Add')}</button>}
            </form>
          </li>
        )}
      </ul>
      {snap.input}
      {snap.error && (
        <div className="mt-2">
          <PhotoError code={snap.error} onDismiss={snap.clearError} />
        </div>
      )}
    </section>
  )
}

// Everything that happened, newest first: journal entries with photos, ticked steps and sessions
function Timeline({ project, editable }) {
  const { actions } = useStore()
  const { t, fmt } = useT()
  const remove = (e) => {
    const removed = actions.removeEntry(project.id, e.id)
    if (removed) actions.toast({ text: 'Entry deleted', action: { label: 'Undo', run: () => actions.restoreEntry(project.id, removed) } })
  }
  const [sharing, setSharing] = useState(null)
  const items = useMemo(() => {
    const list = [
      ...project.entries.map((e) => ({ type: 'entry', at: e.at, e })),
      ...project.milestones.filter((m) => m.done && m.doneAt && !m.auto).map((m) => ({ type: 'step', at: m.doneAt, m })),
      ...project.sessions.map((s, i) => ({ type: 'session', at: s.at, s, i })),
    ]
    return list.sort((a, b) => b.at - a.at)
  }, [project])

  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Progress')}</h2>
      {editable && project.status !== 'done' && <QuickUpdate project={project} />}
      {items.length === 0 ? (
        <p className="px-4 py-6 text-[15px] text-sub">{t('Nothing yet.')}</p>
      ) : (
        <ol className="mt-4 space-y-1">
          {items.map((it) => {
            const day = dayNumber(project.createdAt, it.at)
            if (it.type === 'entry') {
              const e = it.e
              return (
                <li key={e.id} className="surface animate-rise overflow-hidden">
                  {e.photo &&
                    (e.ratio ? (
                      <Photo src={e.photo} ratio={e.ratio} maxHeight="70vh" className="w-full" w={1200} />
                    ) : (
                      <Photo src={e.photo} className="min-h-[160px] w-full" imgClassName="max-h-[70vh] w-full object-cover" w={1200} />
                    ))}
                  <div className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-sub">
                        {e.kind === 'finish' ? t('Finished') : t('Day {n}', { n: day })} · {fmt.date(e.at, { day: 'numeric', month: 'short' })}
                        {e.tag && TAG[e.tag] && <span className="ml-1.5 rounded-full bg-mist px-2 py-0.5 text-[12px] text-ink/70">{t(TAG[e.tag].label)}</span>}
                      </p>
                      {e.text && <p className="mt-0.5 whitespace-pre-line text-[17px] leading-snug">{e.text}</p>}
                    </div>
                    {editable && (
                      <button
                        onClick={() =>
                          setSharing({ project: project.title, category: project.category, kind: e.kind === 'finish' ? 'finish' : 'update', text: e.text, photo: e.photo, ratio: e.ratio })
                        }
                        className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist"
                        aria-label={t('Post this')}
                      >
                        <Icon name="share" className="h-[18px] w-[18px]" />
                      </button>
                    )}
                    {editable && (
                      <button
                        onClick={() => remove(e)}
                        className="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sub active:bg-mist"
                        aria-label={t('Delete entry')}
                      >
                        <Icon name="trash" className="h-[18px] w-[18px]" />
                      </button>
                    )}
                  </div>
                </li>
              )
            }
            return (
              <li key={`${it.type}${it.at}${it.i ?? ''}${it.m?.id ?? ''}`} className="flex items-center gap-3 px-4 py-2 text-[15px] text-sub">
                <Icon name={it.type === 'step' ? 'check' : 'timer'} className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                <span className="min-w-0 flex-1 truncate">{it.type === 'step' ? it.m.text : t('{n} min session', { n: it.s.minutes })}</span>
                <span className="shrink-0 text-[13px]">{t('Day {n}', { n: day })}</span>
              </li>
            )
          })}
        </ol>
      )}
      {sharing && <PostSheet initial={sharing} onClose={() => setSharing(null)} />}
    </section>
  )
}

function FinishSheet({ project, onClose, onFinished }) {
  const { actions } = useStore()
  const { t } = useT()
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState(null)
  const picker = usePhotoPicker(async (res) => setPhoto(res))
  const submit = (e) => {
    e.preventDefault()
    // No finish without a proof photo of the result
    if (!photo) return
    actions.finishProject(project.id, { text, photo: photo?.ref || null, ratio: photo?.ratio || null })
    onFinished()
  }
  return (
    <Sheet onClose={onClose} label={t('Finish project')}>
      <SheetHeader title={t('Finish project')} onClose={onClose} />
      <form onSubmit={submit} className="px-5 pb-2 pt-2">
        {photo ? (
          <div className="relative animate-scale-in">
            <Photo src={photo.ref} className="aspect-[4/3] w-full rounded-[16px]" w={900} />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              aria-label={t('Remove photo')}
            >
              <Icon name="x" className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={picker.open}
            disabled={picker.busy}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[16px] bg-mist text-[17px] font-medium text-spark-ink active:opacity-70"
          >
            {picker.busy ? <Spinner className="h-7 w-7" /> : <Icon name="camera" className="h-8 w-8" />}
            {t('Photo of the result')}
          </button>
        )}
        {picker.input}
        {picker.error && (
          <div className="mt-2">
            <PhotoError code={picker.error} onDismiss={picker.clearError} />
          </div>
        )}
        <textarea
          className="input mt-3 min-h-[80px] resize-none"
          placeholder={t('How did it go?')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={t('How did it go?')}
        />
        <button className="btn-primary btn-lg mt-4 w-full" disabled={picker.busy || !photo}>
          <Icon name="trophy" className="h-5 w-5" /> {t('Finish')}
        </button>
        {!photo && <p className="mt-2 text-center text-[15px] text-sub">{t('A photo of the result is needed to finish.')}</p>}
      </form>
    </Sheet>
  )
}

function RenameSheet({ project, onClose }) {
  const { actions } = useStore()
  const { t } = useT()
  const [title, setTitle] = useState(project.title)
  return (
    <Sheet onClose={onClose} label={t('Rename')}>
      <SheetHeader title={t('Rename')} onClose={onClose} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          actions.updateProject(project.id, { title: title.trim() })
          onClose()
        }}
        className="px-5 pb-2 pt-2"
      >
        <input
          className="input text-[17px]"
          data-autofocus
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t('Project name')}
        />
        <button className="btn-primary btn-lg mt-4 w-full" disabled={!title.trim()}>
          {t('Save')}
        </button>
      </form>
    </Sheet>
  )
}

function MenuSheet({ project, onClose, onRename, onFinish }) {
  const { actions } = useStore()
  const { t } = useT()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const done = project.status === 'done'
  const items = [
    { icon: 'pencil', label: t('Rename'), run: onRename },
    done
      ? { icon: 'replay', label: t('Reopen project'), run: () => (actions.reopenProject(project.id), onClose()) }
      : { icon: 'trophy', label: t('Finish project'), run: onFinish },
    {
      icon: 'trash',
      label: t('Delete project'),
      danger: true,
      run: () => setConfirming(true),
    },
  ]
  if (confirming) {
    return (
      <Sheet onClose={onClose} label={t('Delete project')}>
        <SheetHeader title={t('Delete project')} onClose={onClose} />
        <div className="px-5 pb-2 pt-2">
          <p className="text-[17px] leading-snug">{t('Delete “{title}” and all its photos? This can’t be undone.', { title: project.title })}</p>
          <button
            onClick={() => {
              onClose()
              actions.deleteProject(project.id)
              navigate('/', { replace: true })
            }}
            className="btn btn-lg mt-5 w-full bg-bad text-white"
          >
            <Icon name="trash" className="h-5 w-5" /> {t('Delete project')}
          </button>
          <button onClick={() => setConfirming(false)} className="btn-plain btn-lg mt-2 w-full">
            {t('Cancel')}
          </button>
        </div>
      </Sheet>
    )
  }
  return (
    <Sheet onClose={onClose} label={project.title}>
      <SheetHeader title={project.title} onClose={onClose} />
      <ul className="mx-5 mt-2 divide-y divide-line/15 overflow-hidden rounded-[14px] bg-mist">
        {items.map((it) => (
          <li key={it.label}>
            <button onClick={it.run} className={`row min-h-[52px] text-[17px] active:bg-ink/5 ${it.danger ? 'text-bad' : ''}`}>
              <Icon name={it.icon} className="h-5 w-5" />
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}

export default function ProjectPage() {
  const { id } = useParams()
  const { data, actions, daysWorked } = useStore()
  const { t, tn, fmt, lang } = useT()
  const location = useLocation()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(null) // 'menu' | 'rename' | 'finish' | 'reel'
  const [celebrate, setCelebrate] = useState(0)
  const assistant = useAssistant()
  const project = data.projects.find((p) => p.id === id)
  // AI plans carry their own list; ready-made plans use the shared one, so older projects get it too
  const needs = project?.materials?.length ? project.materials : materialsFor(project?.guideKey, lang)
  const have = project?.have || []
  const ui = useUi()
  // Before & after: the first photo you took and the finishing one
  const photos = (project?.entries || []).filter((e) => e.photo).sort((a, b) => a.at - b.at)
  const finishEntry = photos.findLast?.((e) => e.kind === 'finish') || photos[photos.length - 1]
  const beforeAfter = photos.length ? [...new Set([photos[0], finishEntry])].map((e) => ({ photo: e.photo, ratio: e.ratio })) : []
  const finishText = (project?.entries || []).find((e) => e.kind === 'finish')?.text || ''

  // "Finish project" from the Today card lands here with the sheet open; the axolotl's "Play" with the reel
  useEffect(() => {
    if (location.state?.finish && project?.status !== 'done') {
      setSheet('finish')
      navigate(location.pathname, { replace: true, state: {} })
    } else if (location.state?.reel && project?.status === 'done') {
      setSheet('reel')
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, navigate, project?.status])

  if (!project) {
    return (
      <div className="pt-4">
        <BackButton />
        <p className="py-20 text-center text-sub">{t('This project doesn’t exist anymore.')}</p>
      </div>
    )
  }

  const done = project.status === 'done'
  const pct = progressOf(project)
  const doneSteps = project.milestones.filter((m) => m.done).length
  const day = dayNumber(project.createdAt, done ? project.finishedAt || Date.now() : Date.now())
  const worked = daysWorked(project.id)

  return (
    <div className="relative mx-auto max-w-2xl pt-2 lg:max-w-[1760px] lg:pt-6">
      {celebrate > 0 && <Confetti key={celebrate} count={36} />}
      <div className="flex items-center gap-1">
        <BackButton fallback="/" />
        <button
          onClick={() => assistant.openAsk({ projectId: project.id })}
          className="ml-auto flex h-11 items-center gap-1.5 rounded-full pl-1 pr-3 text-[17px] text-spark-ink active:opacity-60"
        >
          <Mascot size={34} mood={done ? 'proud' : 'idle'} />
          {t('Ask')}
        </button>
        <button
          onClick={() => setSheet('menu')}
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-spark-ink active:opacity-60"
          aria-label={t('More')}
        >
          <Icon name="more" className="h-6 w-6" />
        </button>
      </div>

      <header className="mt-1 flex items-start gap-4 px-1">
        <div className="min-w-0 flex-1">
          <h1 className="text-[30px] font-bold leading-[1.12] tracking-[-0.02em]">{project.title}</h1>
          <p className="mt-1.5 text-[15px] text-sub">
            {categoryLabel(t, project.category)} · {t('Started {date}', { date: fmt.date(project.createdAt, { day: 'numeric', month: 'short' }) })}
            {worked > 0 && ` · ${tn(worked, '{n} day worked', '{n} days worked')}`}
            {project.from && ` · ${t('Started because of {name}', { name: project.from.name })}`}
          </p>
        </div>
        <ProjectThumb project={project} className="h-16 w-16 shrink-0 rounded-[16px]" />
      </header>

      {project.milestones.length > 0 && !done && (
        <div className="mt-4 flex items-center gap-3 px-1">
          <ProgressBar value={pct} className="h-2" />
          <span className="shrink-0 text-[15px] font-semibold tabular-nums">
            {doneSteps}/{project.milestones.length}
          </span>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-14">
      <div>
      {done ? (
        <>
        <section className="hero mt-6 overflow-hidden rounded-[22px] p-5 sm:p-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] opacity-70">
            {t('Finished')} · {fmt.date(project.finishedAt || Date.now(), { day: 'numeric', month: 'long' })}
          </p>
          <p className="mt-1.5 text-[26px] font-bold leading-tight tracking-[-0.01em]">{tn(day, 'Done in {n} day', 'Done in {n} days')}</p>
          {/* The proudest moment is the best time to post: the first and the last photo, already in the post */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {beforeAfter.length > 0 && (
              <button
                onClick={() => ui.share({ project: project.title, category: project.category, kind: 'finish', text: finishText, photos: beforeAfter })}
                className="btn btn-lg bg-spark text-white"
              >
                <Icon name="share" className="h-5 w-5" />{' '}
                {/* Started from someone's post: the result goes under theirs, so they see it was made because of them */}
                {project.from?.post ? t('Show {name} what you made', { name: project.from.name }) : beforeAfter.length > 1 ? t('Post your before & after') : t('Post it')}
              </button>
            )}
            <button onClick={() => setSheet('reel')} className={`btn btn-lg ${beforeAfter.length ? 'bg-white/15 text-white' : 'bg-spark text-white'}`}>
              <Icon name="play" filled className="h-4 w-4" /> {t('Make the reel')}
            </button>
          </div>
          {/* Your own project: your updates become a plan others can follow (journey.js) */}
          {!project.from?.post && (project.entries.length > 0 || project.milestones.some((m) => m.done && !m.auto)) && (
            <button onClick={() => setSheet('plan')} className="mt-3 flex min-h-[44px] items-center gap-2 text-left text-[16px] font-semibold text-white/90 active:opacity-70">
              <Icon name="list" className="h-5 w-5" /> {t('Turn your updates into a plan others can follow')}
            </button>
          )}
        </section>
        <NextPlanCard project={project} />
        </>
      ) : (
        <>
          <NextWhen project={project} />
          <NextStep project={project} onFinish={() => setSheet('finish')} />
        </>
      )}

      {(project.milestones.length > 0 || !done) && <Steps project={project} editable={!done} />}
      {needs.length > 0 && (
        <section className="mt-8">
          <h2 className="section-label flex items-baseline">
            <span className="flex-1">{t('What you need')}</span>
            <span className="normal-case tracking-normal">{t('{n} of {total} at home', { n: needs.filter((m) => have.includes(m)).length, total: needs.length })}</span>
          </h2>
          {project.budget === 'free' && (
            <p className="px-4 pb-2 text-[15px] text-sub">{t('Almost free: borrow first, use what you have at home, and swap anything pricey for the cheapest version.')}</p>
          )}
          {/* Tick what you already have: often it's nearly everything, and then there's nothing to buy before you start */}
          <ul className="surface divide-y divide-line/15 overflow-hidden">
            {needs.map((m) => {
              const on = have.includes(m)
              return (
                <li key={m}>
                  <button
                    onClick={() => actions.updateProject(project.id, { have: on ? have.filter((x) => x !== m) : [...have, m] })}
                    className="row min-h-[48px] py-2.5 text-[17px] leading-snug active:bg-mist"
                    aria-pressed={on}
                  >
                    <CheckCircle done={on} />
                    <span className={`flex-1 ${on ? 'text-sub' : ''}`}>{m}</span>
                    {!on && <span className="shrink-0 text-[14px] text-sub">{t('I have this')}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          {needs.length > 0 && needs.every((m) => have.includes(m)) && <p className="mt-2 px-4 text-[15px] text-good">{t('You have everything. Nothing to buy!')}</p>}
        </section>
      )}
      {project.resources?.length > 0 && (
        <section className="mt-8 hidden lg:block">
          <h2 className="section-label">{t('Helpful links')}</h2>
          <ResourceList resources={project.resources} />
        </section>
      )}
      </div>
      {/* On a laptop: your progress at the top of the right column, the share card under it */}
      <div className="lg:flex lg:flex-col-reverse lg:justify-end lg:[&>section]:!mt-6">
      <TogetherEntry project={project} />
      <SparkCard project={project} />
      <Timeline project={project} editable />
      </div>
      </div>

      {project.resources?.length > 0 && (
        <section className="mt-8 lg:hidden">
          <h2 className="section-label">{t('Helpful links')}</h2>
          <ResourceList resources={project.resources} />
        </section>
      )}

      {sheet === 'menu' && (
        <MenuSheet project={project} onClose={() => setSheet(null)} onRename={() => setSheet('rename')} onFinish={() => setSheet('finish')} />
      )}
      {sheet === 'rename' && <RenameSheet project={project} onClose={() => setSheet(null)} />}
      {sheet === 'finish' && (
        <FinishSheet
          project={project}
          onClose={() => setSheet(null)}
          onFinished={() => {
            // The axolotl presents the reel a moment later (assistant/tips.js, 'finish')
            setCelebrate((n) => n + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setSheet(null)
          }}
        />
      )}
      {sheet === 'reel' && <ProgressReel project={project} onClose={() => setSheet(null)} />}
      {sheet === 'plan' && (
        <PlanDraftSheet
          project={project}
          onClose={() => setSheet(null)}
          onPublish={(plan) => {
            setSheet(null)
            ui.share({ project: project.title, category: project.category, kind: 'finish', text: finishText, photos: beforeAfter, plan })
          }}
        />
      )}
    </div>
  )
}
