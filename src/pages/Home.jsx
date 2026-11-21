import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { levelOf, levelText } from '../data/shop.js'
import { useLang } from '../i18n.jsx'
import { currentStreak, useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import ShopScene from '../components/ShopScene.jsx'
import ShopTimeline from '../components/ShopTimeline.jsx'
import Button from '../components/Button.jsx'
import ContentBoundary from '../components/ContentBoundary.jsx'
import { IconTile, ListGroup, ListRow } from '../components/List.jsx'
import { CalendarIcon, GridIcon, NotebookIcon, RepeatIcon } from '../components/Icons.jsx'
import { ForecastCard, TodayPlan } from '../components/ExamCards.jsx'
import { getJahrgang, getKapitel, getKapitelList, getTopic } from '../data/curriculum.js'
import { titleOf } from '../data/translate.js'
import { daysUntil, weakTopics } from '../data/questions.js'
import { dueIds } from '../data/srs.js'
import { SPRING } from '../motion.js'

// Startseite. Mit eingetragener Prüfung ist sie ein Countdown: Notenprognose, die Aufgaben von heute
// aus dem Lernplan, darunter Loopys Laden. Ohne Prüfung: Loopys Laden und genau ein nächster Schritt.
export default function Home() {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { mistakes, results, exams, srs } = useProgress()
  const exam = exams.find((e) => daysUntil(e.date) >= 0)
  const mistakeCount = Object.keys(mistakes).length
  const dueCount = useMemo(() => dueIds(srs).length, [srs])
  const weak = weakTopics(results)
    .map((r) => ({ ...r, topic: getTopic(r.jahrgangId, r.topicId) }))
    .filter((r) => r.topic)

  return (
    <Page title="BW Buddy">
      {exam ? (
        <ContentBoundary fallback={<div className="mb-5 h-[260px] rounded-card bg-surface" />}>
          <ForecastCard exam={exam} />
          <TodayPlan exam={exam} />
        </ContentBoundary>
      ) : (
        <>
          <Shop hero />
          <NextStep />
        </>
      )}

      <ListGroup>
        <ListRow
          title={t('playGame')}
          left={<IconTile><GridIcon className="h-[18px] w-[18px]" /></IconTile>}
          right={t('playGameSub')}
          onClick={() => navigate('/spiel')}
        />
      </ListGroup>

      {(!exam && dueCount > 0) || mistakeCount > 0 ? (
        <ListGroup>
          {!exam && dueCount > 0 && (
            <ListRow
              title={t('review')}
              left={<IconTile><RepeatIcon className="h-[18px] w-[18px]" /></IconTile>}
              right={t('dueCount', { n: dueCount })}
              onClick={() => navigate('/wiederholen')}
            />
          )}
          {mistakeCount > 0 && (
            <ListRow
              title={t('mistakesTitle')}
              left={<IconTile tone="danger"><NotebookIcon className="h-[18px] w-[18px]" /></IconTile>}
              right={<span className="tabular">{mistakeCount}</span>}
              onClick={() => navigate('/fehler')}
            />
          )}
        </ListGroup>
      ) : null}

      {weak.length > 0 && (
        <ListGroup header={t('weakTopics')}>
          {weak.map((r) => (
            <ListRow
              key={`${r.jahrgangId}-${r.topicId}`}
              title={titleOf(r.topic, lang)}
              right={<span className="tabular">{Math.round((1 - r.wrongShare) * 100)} %</span>}
              onClick={() => navigate(`/ueben/${r.jahrgangId}/${r.kapitelId}/${r.topicId}`)}
            />
          ))}
        </ListGroup>
      )}

      {!exam && (
        <ListGroup>
          <ListRow
            title={t('addExam')}
            tone="accent"
            left={<IconTile><CalendarIcon className="h-[18px] w-[18px]" /></IconTile>}
            onClick={() => navigate('/tests/neu')}
          />
        </ListGroup>
      )}

      {exam && <Shop />}
    </Page>
  )
}

// Zuletzt auf der Startseite gezeigte Stufe. Ist der Laden seither gewachsen, steht zuerst
// die alte Stufe da und kurz danach baut sich das Neue sichtbar auf.
const SEEN_KEY = 'bw-buddy-shop-seen'

function useShownLevel(index) {
  const [shown, setShown] = useState(() => {
    try {
      const raw = localStorage.getItem(SEEN_KEY)
      const seen = raw === null ? 0 : Number(raw)
      return Number.isInteger(seen) && seen >= 0 && seen < index ? seen : index
    } catch {
      return index
    }
  })

  useEffect(() => {
    if (shown < index) {
      const timer = setTimeout(() => setShown(index), 450)
      return () => clearTimeout(timer)
    }
    if (shown > index) setShown(index)
    try {
      localStorage.setItem(SEEN_KEY, String(index))
    } catch {
      /* ignorieren */
    }
  }, [shown, index])

  return Math.min(shown, index)
}

// Loopys Laden: wächst mit dem Lernen. Antippen zeigt die Firmengeschichte.
function Shop({ hero = false }) {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  const { xp, streak } = useProgress()
  const { index, level, next, progress } = levelOf(xp)
  const shown = useShownLevel(index)
  const [history, setHistory] = useState(false)
  const days = currentStreak(streak)

  return (
    <section className={`mb-5 overflow-hidden rounded-card bg-surface ${hero ? '' : ''}`}>
      <div className="relative">
        <button onClick={() => setHistory(true)} aria-label={t('historyTitle')} className="block w-full active:opacity-80">
          <ShopScene level={shown} className={`mx-auto h-auto w-full ${hero ? 'max-w-md' : 'max-w-[280px]'}`} />
        </button>
        {/* Auf der Insel spielen: Loopy & Co. */}
        <button
          onClick={() => navigate('/spiel')}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-accent py-2 pl-3 pr-4 text-[15px] font-semibold text-white shadow-[0_6px_18px_-6px_rgb(0_122_255/0.6)] transition-transform active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" /></svg>
          {t('play')}
        </button>
      </div>
      <div className="px-5 pb-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-semibold text-label">{levelText(level, lang).name}</span>
          <span className="text-[15px] text-label2 tabular">{t('levelN', { n: index + 1 })}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill/20" role="progressbar" aria-label={t('toNextLevel')} aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }} transition={SPRING} />
        </div>
        <p className="mt-2 text-[13px] text-label2">
          {next ? t('xpToNext', { xp, next: next.xp }) : t('maxLevel')}
          {days >= 2 && ` · ${t('streakDays', { n: days })}`}
        </p>
      </div>
      <ShopTimeline open={history} current={index} onClose={() => setHistory(false)} />
    </section>
  )
}

// Genau ein nächster Schritt: weiterlesen, wo man war, sonst das erste Thema des eigenen Jahrgangs.
function NextStep() {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { last, myYear, done } = useProgress()
  const lastTopic = last && getJahrgang(last.jahrgangId) && getKapitel(last.jahrgangId, last.kapitelId) && getTopic(last.jahrgangId, last.topicId)

  let headline
  let detail = null
  let label
  let go
  if (lastTopic) {
    const path = `${last.jahrgangId}/${last.kapitelId}/${last.topicId}`
    const steps = last.steps ?? 0
    const step = Math.min(last.step ?? 0, steps)
    const finished = done[`summary:${last.topicId}`] && step >= steps
    headline = titleOf(lastTopic, lang)
    if (steps) detail = step >= steps ? t('summary') : t('stepOf', { n: step + 1, total: steps })
    label = finished ? t('practice') : t('goOn')
    go = () => navigate(finished ? `/ueben/${path}` : steps ? `/lernen/${path}` : `/themen/${path}`, { state: { step } })
  } else {
    const year = getJahrgang(myYear) ? myYear : 1
    const kapitel = getKapitelList(year)[0]
    const topic = getTopic(year, kapitel.topicIds[0])
    headline = titleOf(topic, lang)
    detail = titleOf(kapitel, lang)
    label = t('start')
    go = () => navigate(`/lernen/${year}/${kapitel.id}/${topic.id}`)
  }

  return (
    <section className="mb-5 rounded-card bg-surface p-5">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">{lastTopic ? t('continueTitle') : t('firstTopic')}</p>
      <p className="mt-1 text-[22px] font-bold leading-tight text-label">{headline}</p>
      {detail && <p className="mt-0.5 text-[15px] text-label2">{detail}</p>}
      <Button onClick={go} className="mt-4 w-full">
        {label}
      </Button>
    </section>
  )
}
