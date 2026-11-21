// Opening a shared project (#/s/<code>): what someone is doing, their steps, and one button to start it too.
// Starting counts for them as "started because of you" (sparks.js).
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { planFromSomeone } from '../plan'
import { getSpark, startSpark } from '../sparks'
import { validCode } from '../buddy'
import { categoryLabel } from '../components/ProjectBits'
import { Logo, Spinner } from '../components/ui'
import { cat } from '../data'

export default function SparkJoin() {
  const { code } = useParams()
  const { data, actions } = useStore()
  const { t, tn, lang } = useT()
  const navigate = useNavigate()
  const [spark, setSpark] = useState(null)
  const [state, setState] = useState('loading') // loading | ready | starting | error
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  const own = data.projects.find((p) => p.spark?.code === code)
  const mine = data.projects.find((p) => p.from?.code === code)

  useEffect(() => {
    if (!validCode(code)) {
      setError('not_found')
      setState('error')
      return
    }
    let alive = true
    setState('loading')
    getSpark(code)
      .then((res) => {
        if (!alive) return
        setSpark(res)
        setState('ready')
      })
      .catch((e) => {
        if (!alive) return
        setError(e.code)
        setState('error')
      })
    return () => {
      alive = false
    }
  }, [code, attempt])

  const start = async () => {
    if (mine) return navigate(`/project/${mine.id}`, { replace: true })
    setState('starting')
    setError(null)
    try {
      await startSpark(code)
    } catch (e) {
      setError(e.code)
      setState('ready')
      return
    }
    // Their steps if they're in your language, otherwise the same project in yours (plan.js)
    let plan
    try {
      plan = await planFromSomeone({ title: spark.title, category: spark.category, steps: spark.steps, stepsLang: spark.lang, guideKey: spark.guideKey, lang, level: data.me.prefs?.level })
    } catch {
      plan = { title: spark.title, category: spark.category, steps: spark.steps } // not something the AI plans: their steps as they are
    }
    const { outOfAI, starterOnly, ai, ...rest } = plan
    const id = actions.addProject({ ...rest, from: { code, name: spark.name } })
    if (!data.onboarded) actions.completeOnboarding({ interests: [spark.category], level: null, time: null, budget: null })
    actions.toast({ text: 'You started it. {name} sees one more person started.', vars: { name: spark.name } })
    navigate(`/project/${id}`, { replace: true })
  }

  const leave = () => navigate('/', { replace: true })
  const message =
    error === 'offline'
      ? t('No connection. Try again when you’re online.')
      : error === 'not_found'
        ? t('This link doesn’t exist anymore.')
        : t('Something went wrong. Try again.')
  const others = Math.max(0, (spark?.started || 0) - (mine ? 1 : 0))

  return (
    <main className="min-h-[100dvh] bg-page">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex h-12 items-center">
          <Logo word />
        </div>
        {state === 'loading' ? (
          <div className="flex flex-1 items-center justify-center pb-16 text-sub">
            <Spinner className="h-7 w-7" />
          </div>
        ) : state === 'error' ? (
          <div className="flex flex-1 flex-col justify-center pb-16 text-center">
            <p className="animate-rise text-[20px] font-semibold leading-snug">{message}</p>
            <div className="mt-6 flex flex-col gap-2">
              {error === 'offline' && (
                <button onClick={() => setAttempt((n) => n + 1)} className="btn-primary btn-lg">
                  {t('Try again')}
                </button>
              )}
              <button onClick={leave} className="btn-plain btn-lg">
                {t('Open Blank')}
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-rise flex flex-1 flex-col pt-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: cat(spark.category).color }} />
              {categoryLabel(t, spark.category)} · {t('{name} is doing this', { name: spark.name })}
            </p>
            <h1 className="large-title mt-2">{spark.title}</h1>
            {others > 0 && <p className="mt-2 text-[15px] text-sub">{tn(others, '{n} person started it from this link', '{n} people started it from this link')}</p>}
            {spark.steps.length > 0 && (
              <ol className="surface mt-6 space-y-3 p-4">
                {spark.steps.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[17px] leading-snug">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-[13px] font-bold tabular-nums">{i + 1}</span>
                    <span className="pt-0.5">{s}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-auto pt-6">
              {own ? (
                <p className="mb-3 text-center text-[15px] text-sub">{t('This is your own project. Send the link to a friend.')}</p>
              ) : (
                <>
                  {error && (
                    <p className="mb-2 text-[15px] text-bad" role="alert">
                      {message}
                    </p>
                  )}
                  <button onClick={start} className="btn-primary btn-lg w-full" disabled={state === 'starting'}>
                    {state === 'starting' ? <Spinner /> : null} {mine ? t('Open your project') : t('Start this too')}
                  </button>
                </>
              )}
              <button onClick={leave} className="mt-2 h-12 w-full text-[17px] text-spark-ink active:opacity-60">
                {own ? t('Open Blank') : t('Not now')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
