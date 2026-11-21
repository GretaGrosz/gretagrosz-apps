// "Started because of you": the card on a project that shares it as a link, and the count of people who started it from there
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useT } from '../i18n'
import { createSpark, sparkBody, sparkCounts, sparkLink, updateSpark } from '../sparks'
import { Icon, Spinner } from './ui'
import { guessLang } from '../plan'
import { SendSheet } from './SendSheet'

// Keeps the counts fresh while the app is open, and tells you when someone new started one of your projects
export function SparkSync() {
  const { data, actions } = useStore()
  const ref = useRef(null)
  ref.current = data.projects.filter((p) => p.spark)
  const codes = ref.current.map((p) => p.spark.code).join(',')
  const busy = useRef(false)

  const refresh = useCallback(async () => {
    const shared = ref.current
    if (!shared.length || busy.current || document.hidden) return
    busy.current = true
    try {
      const counts = await sparkCounts(shared.map((p) => p.spark.code))
      const grew = shared.filter((p) => (counts[p.spark.code] ?? 0) > (p.spark.started || 0))
      if (shared.some((p) => counts[p.spark.code] != null && counts[p.spark.code] !== p.spark.started)) actions.setSparkCounts(counts)
      for (const p of grew) {
        const more = counts[p.spark.code] - (p.spark.started || 0)
        actions.toast(
          more === 1
            ? { text: 'Someone started {title} because of you', vars: { title: p.title }, link: `/project/${p.id}` }
            : { text: '{n} people started {title} because of you', vars: { n: more, title: p.title }, link: `/project/${p.id}` },
        )
      }
    } catch {
      // Offline or the server is busy: the last count stays, the next refresh tries again
    } finally {
      busy.current = false
    }
  }, [actions])

  useEffect(() => {
    if (!codes) return
    refresh()
    const timer = setInterval(refresh, 60_000)
    const onShow = () => !document.hidden && refresh()
    document.addEventListener('visibilitychange', onShow)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onShow)
    }
  }, [codes, refresh])
  return null
}

export const startedTotal = (projects) => projects.reduce((n, p) => n + (p.spark?.started || 0), 0)

export function SparkCard({ project }) {
  const { data, actions } = useStore()
  const { t, tn, lang } = useT()
  const [name, setName] = useState(data.me.name || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const spark = project.spark
  const started = spark?.started || 0
  const needsName = !spark && !data.me.name.trim()

  const share = async (e) => {
    e?.preventDefault()
    const who = (data.me.name || name).trim()
    if (!who) return
    setBusy(true)
    setError(null)
    try {
      const body = sparkBody(project, who, guessLang(project.milestones.filter((m) => !m.auto).map((m) => m.text)) || lang)
      const sent = JSON.stringify(body)
      let code = spark?.code
      if (!spark) {
        const res = await createSpark(body)
        code = res.code
        if (!data.me.name.trim()) actions.setMe({ name: who })
        actions.updateProject(project.id, { spark: { code: res.code, key: res.key, started: 0, sent, sharedAt: Date.now() } })
      } else if (spark.sent !== sent) {
        // You changed the steps since you last shared: the link shows the new ones
        await updateSpark(spark.code, spark.key, body)
        actions.updateProject(project.id, { spark: { ...spark, sent } })
      }
      await shareUrl(sparkLink(code), t('Start this with me on Blank: {title}', { title: project.title }), t, actions)
    } catch (err) {
      setError(
        err.code === 'offline'
          ? t('No connection. Try again when you’re online.')
          : err.code === 'too_many'
            ? t('Too many shares today. Try again tomorrow.')
            : t('Something went wrong. Try again.'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Started because of you')}</h2>
      <form onSubmit={share} className="surface p-4">
        {spark ? (
          <div className="flex items-center gap-4">
            <span className="text-[44px] font-bold leading-none tabular-nums tracking-[-0.02em] text-spark-ink">{started}</span>
            <p className="text-[17px] leading-snug">
              {started === 0
                ? t('No one yet. Send the link to someone who’d like this.')
                : tn(started, 'person started this because of you', 'people started this because of you')}
            </p>
          </div>
        ) : (
          <p className="text-[17px] leading-snug">
            {t('Share this project. Whoever opens the link gets your steps and can start right away, and you see how many start because of you.')}
          </p>
        )}
        {needsName && (
          <input
            className="input mt-3 text-[17px]"
            placeholder={t('Your first name on the link')}
            aria-label={t('Your first name on the link')}
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="given-name"
          />
        )}
        {error && (
          <p className="mt-2 text-[15px] text-bad" role="alert">
            {error}
          </p>
        )}
        <button className={`${spark ? 'btn-tinted' : 'btn-primary'} btn-lg mt-3 w-full`} disabled={busy || (needsName && !name.trim())}>
          {busy ? <Spinner /> : <Icon name="share" className="h-5 w-5" />} {spark ? t('Share link again') : t('Share so others can start')}
        </button>
        {/* Or straight into a Blank chat, as a plan card they can start from */}
        <button type="button" onClick={() => setSending(true)} className="btn-plain mt-2 w-full text-spark-ink">
          <Icon name="chat" className="h-5 w-5" /> {t('Send to a friend in Blank')}
        </button>
      </form>
      {sending && (
        <SendSheet
          title={project.title}
          share={(() => {
            const steps = project.milestones.filter((m) => !m.auto).map((m) => m.text)
            return { type: 'plan', title: project.title, category: project.category, guide: project.guideKey || null, steps, lang: guessLang(steps) || lang }
          })()}
          onClose={() => setSending(false)}
        />
      )}
    </section>
  )
}

async function shareUrl(url, text, t, actions) {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Blank', text, url })
      return
    } catch (e) {
      if (e?.name === 'AbortError') return
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    actions.toast({ text: 'Link copied' })
  } catch {
    window.prompt(t('Copy this link'), url)
  }
}
