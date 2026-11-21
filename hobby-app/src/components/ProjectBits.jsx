import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { CATEGORY_LABEL } from '../data'
import { GUIDES, planForName, pick } from '../guides'
import { OUT_OF_AI, ownPlanFor, planProject } from '../plan'
import { Icon, IdeaPhoto, Photo, Sheet, SheetHeader, Spinner, tintStyle } from './ui'
import { useAccount } from '../account'
import { useAuthImage } from '../social'

// Your newest photo of a project, if there is one
export const latestPhoto = (project) => project.entries.find((e) => e.photo)?.photo || null

// A project's picture: your own newest photo, else the photo of the plan it came from, else its colour
export function ProjectThumb({ project, className = 'h-12 w-12 rounded-[12px]', w = 300 }) {
  const own = latestPhoto(project)
  if (own) return <Photo src={own} className={className} w={w} />
  // Started from someone's post: their photo until you have one of your own
  if (project.fromPost) return <CoverPhoto project={project} className={className} />
  const guide = project.guideKey && GUIDES[project.guideKey]
  if (guide?.photo) return <IdeaPhoto guide={guide} w={w} className={className} />
  return (
    <span className={`tint flex items-center justify-center text-[17px] font-bold ${className}`} style={tintStyle(project.category)} aria-hidden="true">
      {project.title.trim().charAt(0).toUpperCase()}
    </span>
  )
}

function CoverPhoto({ project, className }) {
  const { account } = useAccount()
  const url = useAuthImage(`/social/posts/${project.fromPost}/media/0`, account?.token)
  if (!url) return <span className={`tint ${className}`} style={tintStyle(project.category)} aria-hidden="true" />
  return <img src={url} alt="" decoding="async" className={`object-cover ${className}`} />
}

// Starting a project: a name, and whether you want a ready-made plan for it
export function NewProjectSheet({ onClose, initial = '' }) {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial)
  const [wantsPlan, setWantsPlan] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const name = title.trim()
  const own = name ? ownPlanFor(name) : null
  // A hand-made plan if Blank has one for this, otherwise the AI writes one (plan.js)
  const planHint = !name ? null : own ? pick(own.title, lang) : t('Made for you by AI')

  const submit = async (e) => {
    e.preventDefault()
    if (!name || busy) return
    setError(null)
    let plan = { category: planForName(name).category, guideKey: null, steps: [], resources: [], materials: [] }
    if (wantsPlan) {
      setBusy(true)
      try {
        plan = await planProject({ title: name, level: data.me.prefs?.level, lang })
      } catch (err) {
        setBusy(false)
        if (err?.code === 'crisis') return setError(err.answer)
        return setError(err?.code === 'not_a_hobby' ? t('That doesn’t look like a hobby project. Try another name.') : t('Something went wrong. Try again.'))
      }
    }
    const { outOfAI, ...rest } = plan
    const id = actions.addProject({ title: name, ...rest })
    if (outOfAI) actions.toast({ text: OUT_OF_AI, long: true })
    onClose()
    navigate(`/project/${id}`)
  }

  return (
    <Sheet onClose={onClose} label={t('New project')}>
      <SheetHeader title={t('New project')} onClose={onClose} />
      <form onSubmit={submit} className="px-5 pb-2 pt-2">
        <input
          className="input text-[17px]"
          data-autofocus
          enterKeyHint="go"
          maxLength={80}
          placeholder={t('e.g. Learn the ukulele')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t('Project name')}
        />
        <div className="surface mt-4 divide-y divide-line/15 overflow-hidden bg-mist shadow-none">
          {[
            [true, t('With a step-by-step plan'), planHint && wantsPlan ? planHint : null],
            [false, t('Empty, I’ll add my own steps'), null],
          ].map(([v, label, hint]) => (
            <button key={String(v)} type="button" onClick={() => setWantsPlan(v)} className="row min-h-[52px] active:bg-ink/5" aria-pressed={wantsPlan === v}>
              <span className="min-w-0 flex-1 py-2">
                <span className="block text-[17px]">{label}</span>
                {hint && <span className="block truncate text-[13px] text-sub">{hint}</span>}
              </span>
              {wantsPlan === v && <Icon name="check" className="h-5 w-5 shrink-0 text-spark-ink" strokeWidth={2.6} />}
            </button>
          ))}
        </div>
        {error && (
          <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        <button className="btn-primary btn-lg mt-5 w-full" disabled={!name || busy}>
          {busy ? (
            <>
              <Spinner className="h-5 w-5" /> {t('Making your plan…')}
            </>
          ) : (
            t('Start project')
          )}
        </button>
      </form>
    </Sheet>
  )
}

export const categoryLabel = (t, id) => t(CATEGORY_LABEL[id] || 'Other')
