// Practice: oral-exam speaking practice. Pick 1, 3 or 5 minutes, English or German, the topic library or your own
// topic list, draw a topic, speak, get a transcript and a coach's note. Your trend, streak and every talk below.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, useLoad } from './api.js'
import { lang as uiLang, relDay, t } from './i18n.js'
import { Button, Card, Empty, Icon, LargeTitle, LoadError, Page, SectionTitle, Segmented, Spinner, fmt, spring, useApp } from './ui.jsx'
import { Spark } from './minute-parts.jsx'
import MinuteResult from './minute-result.jsx'
import Session from './minute-session.jsx'

const PREFS = 'stance.practice'
const readPrefs = () => {
  const d = { length: 60, lang: uiLang, source: 'library' }
  try { return { ...d, ...JSON.parse(localStorage.getItem(PREFS)) } } catch { return d }
}
const lastNoteFor = (minutes, lang) => minutes?.find(m => m.status === 'done' && m.lang === lang && m.feedback?.improve)?.feedback.improve || ''

export default function Practice() {
  const { me, refresh, withAccount, openTopics, openMinute, toast } = useApp()
  const [prefs, setPrefsState] = useState(readPrefs)
  const list = useLoad(me ? 'minutes' : null, '/minutes', [refresh])
  const topics = useLoad(me ? 'topics' : null, '/topics', [refresh])
  const [session, setSession] = useState(null)
  const [retrying, setRetrying] = useState(null)
  const setPrefs = patch => setPrefsState(p => {
    const next = { ...p, ...patch }
    try { localStorage.setItem(PREFS, JSON.stringify(next)) } catch {}
    return next
  })

  const minutes = list.data?.minutes || []
  const myTopics = topics.data?.topics || []
  const source = prefs.source === 'mine' && myTopics.length ? 'mine' : 'library'

  const draw = () => withAccount(() => {
    if (prefs.source === 'mine' && !myTopics.length && topics.data) return openTopics()
    setSession({ key: Math.random(), prefs: { ...prefs, source } })
  })
  const saved = m => list.setData(d => ({ ...(d || { streak: 0 }), minutes: [m, ...(d?.minutes || []).filter(x => x.id !== m.id)] }))
  const deleted = id => list.setData(d => d && { ...d, minutes: d.minutes.filter(x => x.id !== id) })
  const retry = async m => {
    setRetrying(m.id)
    try {
      const { minute } = await api(`/minutes/${m.id}/analyse`, { method: 'POST', timeout: 120000 })
      saved(minute)
      if (minute.status === 'failed') toast(t('result.failedTitle'), 'error')
      list.reload()
    } catch (e) { toast(e.message, 'error') }
    setRetrying(null)
  }

  return (
    <div>
      <LargeTitle title={t('practice.title')} />

      <div className="px-4">
        <Card className="p-4">
          <Field label={t('practice.length')}>
            <Segmented value={prefs.length} onChange={v => setPrefs({ length: v })} label={t('practice.length')}
              options={[60, 180, 300].map(v => ({ id: v, label: t('practice.min', { n: v / 60 }) }))} />
          </Field>
          <Field label={t('practice.language')}>
            <Segmented value={prefs.lang} onChange={v => setPrefs({ lang: v })} label={t('practice.language')}
              options={[{ id: 'en', label: 'English' }, { id: 'de', label: 'Deutsch' }]} />
          </Field>
          <Field label={t('practice.topics')} right={me && <Button kind="plain" size="sm" className="-my-2 -mr-3" onClick={openTopics}>{myTopics.length ? t('practice.editTopics', { n: myTopics.length }) : t('practice.addTopics')}</Button>}>
            <Segmented value={prefs.source} onChange={v => setPrefs({ source: v })} label={t('practice.topics')}
              options={[{ id: 'library', label: t('practice.library') }, { id: 'mine', label: t('practice.mine') }]} />
          </Field>
          <Button size="lg" className="mt-4 w-full" onClick={draw}><Icon.Shuffle size={20} />{t('practice.draw')}</Button>
        </Card>
      </div>

      {me && (!list.data ? (
        list.error ? <LoadError error={list.error} onRetry={list.reload} icon={<Icon.Mic size={30} />} /> : <div className="grid place-items-center py-16 text-fg2"><Spinner size={24} /></div>
      ) : minutes.length ? (
        <>
          <div className="px-4 pt-3"><Stats minutes={minutes} streak={list.data.streak} /></div>
          <SectionTitle>{t('practice.yourTalks')}</SectionTitle>
          <div className="flex flex-col gap-2.5 px-4">
            <AnimatePresence initial={false}>
              {minutes.map((m, i) => <Row key={m.id} minute={m} index={i} onOpen={() => openMinute(m.id)} onRetry={() => retry(m)} retrying={retrying === m.id} />)}
            </AnimatePresence>
          </div>
        </>
      ) : (
        <Empty icon={<Icon.Mic size={30} />} title={t('practice.empty')} />
      ))}

      <AnimatePresence>
        {session && (
          <Session key={session.key} prefs={session.prefs} topic={session.topic} lastNote={lastNoteFor(minutes, session.prefs.lang)}
            onClose={() => { setSession(null); list.reload() }} onSaved={saved} onDeleted={deleted} />
        )}
      </AnimatePresence>
    </div>
  )
}

function Field({ label, right, children }) {
  return (
    <div className="mb-3">
      <div className="flex h-7 items-center justify-between px-1 pb-1.5">
        <span className="text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2">{label}</span>
        {right}
      </div>
      {children}
    </div>
  )
}

const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** Streak, totals, and how the coach's three scores have moved over your last talks */
function Stats({ minutes, streak }) {
  const done = minutes.filter(m => m.status === 'done' && m.words > 0)
  const wpm = Math.round(avg(done.map(m => m.wpm)))
  const perMin = avg(done.map(m => m.fillers / Math.max(0.2, m.duration / 60)))
  const doneToday = done.some(m => m.day === new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin' }).format(new Date()))
  const scored = done.filter(m => m.feedback?.scores).slice(0, 12).reverse()
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${streak ? 'bg-accent text-white' : 'bg-fill text-fg2'}`}><Icon.Flame size={21} /></div>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold">{streak ? t('practice.streak', { n: streak }) : t('practice.noStreak')}</div>
          <div className="text-[14.5px] text-fg2">{doneToday ? t('practice.doneToday') : streak ? t('practice.keepIt') : t('practice.startOne')}</div>
        </div>
      </div>
      <div className="my-4 h-px bg-line" />
      <div className="grid grid-cols-3 gap-2">
        <Figure value={done.length} label={t('practice.talks', { n: done.length })} />
        <Figure value={wpm || '–'} label={t('result.wpm')} />
        <Figure value={done.length ? perMin.toFixed(1) : '–'} label={t('result.fillersPerMin')} />
      </div>
      {scored.length >= 2 && (
        <>
          <div className="my-4 h-px bg-line" />
          <div className="mb-2 text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2">{t('practice.trend', { n: scored.length })}</div>
          <div className="flex flex-col gap-1.5">
            {['structure', 'clarity', 'depth'].map(k => <Spark key={k} label={t('score.' + k)} values={scored.map(m => m.feedback.scores[k])} />)}
          </div>
        </>
      )}
    </Card>
  )
}

function Figure({ value, label }) {
  return (
    <div className="min-w-0">
      <div className="text-[26px] font-semibold leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-[13px] leading-tight text-fg2">{label}</div>
    </div>
  )
}

function Row({ minute: m, index, onOpen, onRetry, retrying }) {
  const s = m.status === 'done' ? m.feedback?.scores : null
  return (
    <motion.div layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...spring, delay: Math.min(index, 8) * 0.025 }}
      className="card flex items-center rounded-[22px]">
      <motion.button type="button" whileTap={{ scale: 0.985 }} onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-[18px] pr-3 text-left">
        <div className="min-w-0 flex-1">
          <div lang={m.lang} className="serif prose-wrap line-clamp-2 text-[18px] font-medium leading-[1.25]">{m.topic}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[13.5px] tabular-nums text-fg2">
            <span>{relDay(m.created)}</span><span>·</span><span>{fmt(m.duration)}</span><span>·</span><span>{m.lang.toUpperCase()}</span>
            {m.status === 'done' && m.wpm > 0 && <><span>·</span><span>{m.wpm} {t('practice.wpmShort')}</span></>}
            {m.status === 'silent' && <><span>·</span><span>{t('result.silentTitle')}</span></>}
            {m.status === 'failed' && <><span>·</span><span className="font-semibold text-fg">{t('practice.notAnalysed')}</span></>}
          </div>
        </div>
        {s && (
          <div className="flex shrink-0 gap-2.5" aria-label={`${t('score.structure')} ${s.structure}, ${t('score.clarity')} ${s.clarity}, ${t('score.depth')} ${s.depth}`}>
            {['structure', 'clarity', 'depth'].map(k => (
              <div key={k} className="flex w-6 flex-col items-center">
                <span className="text-[17px] font-semibold leading-none tabular-nums">{s[k]}</span>
                <span className="mt-1 h-[3px] w-5 overflow-hidden rounded-full bg-fill2"><span className="block h-full rounded-full bg-accent" style={{ width: `${s[k] * 10}%` }} /></span>
                <span className="mt-1 text-[10.5px] font-semibold text-fg2">{t('score.' + k)[0]}</span>
              </div>
            ))}
          </div>
        )}
        {m.status !== 'failed' && <Icon.Chevron size={16} className="shrink-0 text-fg2" />}
      </motion.button>
      {m.status === 'failed' && (
        <button type="button" onClick={onRetry} disabled={retrying} aria-label={t('ui.retry')}
          className="mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white disabled:opacity-60">
          {retrying ? <Spinner size={16} /> : <Icon.Retry size={19} />}
        </button>
      )}
    </motion.div>
  )
}

/** One saved talk, pushed as a page (#minute/id) */
export function MinutePage({ id, onBack, covered }) {
  const { refresh, bump, toast, me } = useApp()
  const list = useLoad(me ? 'minutes' : null, '/minutes', [refresh])
  const [retrying, setRetrying] = useState(false)
  const [session, setSession] = useState(null)
  const m = list.data?.minutes.find(x => x.id === id)

  const retry = async () => {
    setRetrying(true)
    try {
      const { minute } = await api(`/minutes/${id}/analyse`, { method: 'POST', timeout: 120000 })
      list.setData(d => ({ ...d, minutes: d.minutes.map(x => (x.id === id ? minute : x)) }))
      if (minute.status === 'failed') toast(t('result.failedTitle'), 'error')
      bump()
    } catch (e) { toast(e.message, 'error') }
    setRetrying(false)
  }
  const remove = async () => {
    try {
      await api(`/minutes/${id}`, { method: 'DELETE' })
      list.setData(d => ({ ...d, minutes: d.minutes.filter(x => x.id !== id) }))
      toast(t('result.deleted'))
      bump()
      onBack()
    } catch (e) { toast(e.message, 'error') }
  }
  useEffect(() => { if (list.data && !m && !list.loading) list.reload() }, [id])

  return (
    <Page covered={covered} onBack={onBack} title={t('session.yourTalk')}>
      {m ? (
        <div className="pt-1">
          <MinuteResult minute={m} onRetry={retry} retrying={retrying} onDelete={remove}
            onAgain={m.status === 'done' ? () => setSession({ key: Math.random(), topic: m.topic }) : undefined} />
        </div>
      ) : list.error ? <LoadError error={list.error} onRetry={list.reload} />
        : list.data && !list.loading ? <Empty icon={<Icon.Mic size={30} />} title={t('practice.gone')} />
        : <div className="grid place-items-center py-40 text-fg2"><Spinner size={26} /></div>}
      <AnimatePresence>
        {session && m && (
          <Session key={session.key} prefs={{ length: m.length, lang: m.lang, source: 'library' }} topic={session.topic}
            lastNote={lastNoteFor(list.data?.minutes, m.lang)}
            onClose={() => { setSession(null); bump() }} onSaved={() => {}} onDeleted={() => {}} />
        )}
      </AnimatePresence>
    </Page>
  )
}
