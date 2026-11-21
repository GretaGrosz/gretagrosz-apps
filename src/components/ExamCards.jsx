import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getKapitel, getTopic } from '../data/curriculum.js'
import { titleOf } from '../data/translate.js'
import { forecast, examTopics } from '../data/forecast.js'
import { buildPlan, taskDone, todaysTasks } from '../data/plan.js'
import { dayKey, daysUntil } from '../data/questions.js'
import { dueIds } from '../data/srs.js'
import { countdownText, formatDay, planDayLabel } from '../format.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import { SPRING } from '../motion.js'
import Button from './Button.jsx'
import { IconTile } from './List.jsx'
import { BookIcon, CheckIcon, ChevronRight, ClockIcon, FlagIcon, NotebookIcon, QuizIcon, RepeatIcon, TargetIcon } from './Icons.jsx'

const TYPE_LABEL = { sa: 'typeSA', lzk: 'typeLZK', test: 'typeTest' }
export const examTypeLabel = (t, type) => t(TYPE_LABEL[type] ?? 'typeSA')
export const examChapters = (exam, lang) =>
  exam.kapitelIds.map((k) => titleOf(getKapitel(exam.jahrgangId, k), lang)).filter(Boolean).join(' · ')

// Probetest passend zur Prüfung (Schularbeit → lange Form, sonst kurze)
export const mockState = (exam) => ({ jahrgangId: exam.jahrgangId, kapitelIds: exam.kapitelIds, kind: exam.type === 'sa' ? 'sa' : 'test', examId: exam.id })

const SEEN_KEY = 'bw-buddy-forecast-seen'
function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
  } catch {
    return {}
  }
}

// ---------- Notenprognose ----------
export function ForecastCard({ exam, compact = false }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const progress = useProgress()
  const f = useMemo(() => forecast(exam, progress), [exam, progress.results, progress.done, progress.srs]) // eslint-disable-line react-hooks/exhaustive-deps
  const left = daysUntil(exam.date)

  // Hat sich die Prognose seit dem letzten Blick verbessert? Dann kurz von der alten zur neuen Note.
  const [shownGrade, setShownGrade] = useState(() => {
    const seen = readSeen()[exam.id]
    return f.ready && seen && seen > f.grade ? seen : f.grade
  })
  const [improvedFrom, setImprovedFrom] = useState(null)
  useEffect(() => {
    if (!f.ready) return
    if (shownGrade !== f.grade) {
      const id = setTimeout(() => {
        if (shownGrade > f.grade) setImprovedFrom(shownGrade)
        setShownGrade(f.grade)
      }, 650)
      return () => clearTimeout(id)
    }
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify({ ...readSeen(), [exam.id]: f.grade }))
    } catch {
      /* ignorieren */
    }
  }, [f.ready, f.grade, shownGrade, exam.id])

  const allTopicIds = examTopics(exam).map((x) => x.topic.id)
  const practiseFocus = () => navigate(`/ueben-mix/${exam.jahrgangId}?t=${f.focus.map((r) => r.topic.id).join(',')}&n=15`)
  const quickTest = () => navigate(`/ueben-mix/${exam.jahrgangId}?t=${allTopicIds.join(',')}&n=10`)

  return (
    <section className="mb-5 rounded-card bg-surface p-5" aria-label={t('forecast')}>
      <button onClick={() => navigate(`/tests/${exam.id}`)} className="-m-1 flex w-[calc(100%+0.5rem)] items-start gap-3 rounded-control p-1 text-left active:bg-fill/10">
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold uppercase tracking-wide text-accent-text">
            {examTypeLabel(t, exam.type)} · {countdownText(t, exam.date)}
          </span>
          <span className="mt-0.5 block text-[17px] font-semibold leading-snug text-label">{examChapters(exam, lang)}</span>
        </span>
        {!compact && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-label3" />}
      </button>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-accent text-white">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={f.ready ? shownGrade : 'none'}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={SPRING}
              className="text-[44px] font-bold leading-none tabular"
            >
              {f.ready ? shownGrade : '–'}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="min-w-0">
          {f.ready ? (
            <>
              <p className="text-[22px] font-bold leading-tight text-label">{t(`grade${shownGrade}`)}</p>
              <p className="mt-0.5 text-[15px] text-label2">
                {t('forecastFor', { date: formatDay(exam.date, lang, { day: 'numeric', month: 'short' }) })} · {Math.round(f.pct)} %
              </p>
              <AnimatePresence>
                {improvedFrom && (
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mt-1 text-[13px] font-semibold text-success">
                    {t('improved', { from: improvedFrom, to: shownGrade })}
                  </motion.p>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <p className="text-[22px] font-bold leading-tight text-label">{t('noForecast')}</p>
              <p className="mt-0.5 text-[15px] text-label2">{t('forecastAfter', { n: Math.max(1, 5 - f.answered) })}</p>
            </>
          )}
        </div>
      </div>

      {f.ready && f.focus.length > 0 && (
        <div className="mt-4">
          <p className="text-[15px] font-semibold text-label">{f.target ? t('toReachGrade', { g: f.target }) : t('toKeepGrade')}</p>
          <ul className="mt-1.5">
            {f.focus.map((r) => (
              <li key={r.topic.id} className="flex items-center gap-3 border-t border-sep/20 py-2 first:border-t-0">
                <span className="min-w-0 flex-1 text-[15px] text-label">{titleOf(r.topic, lang)}</span>
                <span className="shrink-0 text-[15px] text-label2 tabular">{r.answers ? `${Math.round(r.p * 100)} %` : r.read ? t('readNotPractised') : t('notStarted')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {left >= 0 &&
        (f.ready ? (
          f.focus.length > 0 && (
            <Button onClick={practiseFocus} className="mt-4 w-full">
              <TargetIcon className="h-5 w-5" />
              {t('practiseThese')}
            </Button>
          )
        ) : (
          <Button onClick={quickTest} className="mt-4 w-full">
            {t('quickTest')}
          </Button>
        ))}
    </section>
  )
}

// ---------- Aufgaben ----------
function useTaskContext() {
  const progress = useProgress()
  const dueCount = useMemo(() => dueIds(progress.srs).length, [progress.srs])
  const mistakeCount = Object.keys(progress.mistakes).length
  return { progress, dueCount, mistakeCount }
}

function TaskRow({ task, exam, done, dueCount, mistakeCount, interactive = true }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const topic = task.topicId ? getTopic(exam.jahrgangId, task.topicId) : null
  const meta = {
    learn: { Icon: BookIcon, title: titleOf(topic, lang), sub: t('learn'), go: () => navigate(`/lernen/${exam.jahrgangId}/${task.k}/${task.topicId}`) },
    practise: { Icon: QuizIcon, title: titleOf(topic, lang), sub: t('practice'), go: () => navigate(`/ueben/${exam.jahrgangId}/${task.k}/${task.topicId}`) },
    mock: { Icon: ClockIcon, title: t('mockTest'), sub: examTypeLabel(t, exam.type), go: () => navigate('/tests/probe', { state: mockState(exam) }) },
    mistakes: { Icon: NotebookIcon, title: t('mistakesTitle'), sub: mistakeCount ? t('questionsCount', { n: mistakeCount }) : null, go: () => navigate('/fehler') },
    review: { Icon: RepeatIcon, title: t('review'), sub: dueCount ? t('dueCount', { n: dueCount }) : null, go: () => navigate('/wiederholen') },
  }[task.kind]
  if (!meta || (task.topicId && !topic)) return null
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      type={interactive ? 'button' : undefined}
      onClick={interactive ? meta.go : undefined}
      className={`flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left ${interactive ? 'active:bg-fill/[0.14]' : ''}`}
    >
      <IconTile tone={done ? 'gray' : 'accent'}>
        <meta.Icon className="h-[18px] w-[18px]" />
      </IconTile>
      <span className="min-w-0 flex-1">
        <span className={`block text-[17px] leading-snug ${done ? 'text-label2 line-through decoration-label3' : 'text-label'}`}>{meta.title}</span>
        {meta.sub && <span className="block text-[13px] text-label2">{meta.sub}</span>}
      </span>
      <AnimatePresence initial={false}>
        {done && (
          <motion.span
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success text-white"
            aria-label={t('doneLabel')}
          >
            <CheckIcon className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
      {!done && interactive && <ChevronRight className="h-4 w-4 shrink-0 text-label3" />}
    </Tag>
  )
}

// Heute im Lernplan (die Liste wird morgens festgehalten)
export function TodayPlan({ exam }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const { progress, dueCount, mistakeCount } = useTaskContext()
  const { planDay, setPlanDay } = progress
  const today = dayKey()
  const snap = planDay && planDay.date === today && planDay.examId === exam.id ? planDay.tasks : null
  const computed = useMemo(() => (snap ? null : todaysTasks(exam, progress, dueCount, today)), [snap, exam, today]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!snap && computed) setPlanDay({ date: today, examId: exam.id, tasks: computed })
  }, [snap, computed, today, exam.id, setPlanDay])
  const tasks = (snap ?? computed ?? []).filter((task) => !task.topicId || getTopic(exam.jahrgangId, task.topicId))
  const left = daysUntil(exam.date)

  if (left === 0) {
    return (
      <section className="mb-5 rounded-card bg-surface p-5">
        <p className="text-[22px] font-bold text-label">{t('examToday', { type: examTypeLabel(t, exam.type) })}</p>
        {mistakeCount > 0 && (
          <Button variant="secondary" onClick={() => navigate('/fehler')} className="mt-4 w-full">
            <NotebookIcon className="h-5 w-5" />
            {t('mistakesQuick', { n: mistakeCount })}
          </Button>
        )}
      </section>
    )
  }
  if (tasks.length === 0) return null

  const states = tasks.map((task) => taskDone(task, exam, progress, { dueCount, mistakeCount }))
  const doneCount = states.filter(Boolean).length
  const allDone = doneCount === tasks.length
  const nextOpen = allDone ? buildPlan(exam, progress).flatMap((d) => d.tasks).find((task) => !taskDone(task, exam, progress, { dueCount, mistakeCount })) : null

  return (
    <section className="mb-5" aria-label={t('todayTitle')}>
      <div className="mb-1.5 flex items-baseline justify-between px-4">
        <h2 className="text-[13px] uppercase tracking-wide text-label2">{t('todayTitle')}</h2>
        <span className="text-[13px] font-semibold text-label2 tabular">{t('doneOf', { n: doneCount, total: tasks.length })}</span>
      </div>
      <div className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-sep/20">
        {tasks.map((task, i) => (
          <TaskRow key={task.id} task={task} exam={exam} done={states[i]} dueCount={dueCount} mistakeCount={mistakeCount} />
        ))}
      </div>
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mt-3 flex items-center justify-between gap-3 px-4">
            <span className="text-[15px] font-semibold text-success">{t('todayDone')}</span>
            {nextOpen && (
              <button
                onClick={() =>
                  nextOpen.kind === 'mock'
                    ? navigate('/tests/probe', { state: mockState(exam) })
                    : navigate(`/${nextOpen.kind === 'learn' ? 'lernen' : 'ueben'}/${exam.jahrgangId}/${nextOpen.k}/${nextOpen.topicId}`)
                }
                className="min-h-[44px] text-[15px] font-semibold text-accent-text active:opacity-60"
              >
                {t('workAhead')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

// Ganzer Plan bis zur Prüfung (Prüfungsseite)
export function PlanList({ exam }) {
  const { lang, t } = useLang()
  const { progress, dueCount, mistakeCount } = useTaskContext()
  const plan = useMemo(() => buildPlan(exam, progress), [exam, progress.done, progress.results]) // eslint-disable-line react-hooks/exhaustive-deps
  const today = dayKey()
  const snap = progress.planDay && progress.planDay.date === today && progress.planDay.examId === exam.id ? progress.planDay.tasks : null

  return (
    <div>
      {plan.map((d) => {
        const tasks = d.day === today && snap ? snap : d.tasks
        return (
          <section key={d.day} className="mb-5">
            <h3 className="mb-1.5 px-4 text-[13px] uppercase tracking-wide text-label2">
              {planDayLabel(t, d.day, lang)}
              {d.kind === 'mock' && ` · ${t('mockDay')}`}
            </h3>
            <div className="overflow-hidden rounded-card bg-surface [&>*+*]:border-t [&>*+*]:border-sep/20">
              {d.kind === 'exam' ? (
                <div className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
                  <IconTile tone="danger">
                    <FlagIcon className="h-[18px] w-[18px]" />
                  </IconTile>
                  <span className="text-[17px] font-semibold text-label">{examTypeLabel(t, exam.type)}</span>
                </div>
              ) : tasks.length === 0 ? (
                <p className="px-4 py-3.5 text-[15px] text-label2">{t('freeDay')}</p>
              ) : (
                tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    exam={exam}
                    done={d.day === today && taskDone(task, exam, progress, { dueCount, mistakeCount })}
                    dueCount={d.day === today ? dueCount : 0}
                    mistakeCount={mistakeCount}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
