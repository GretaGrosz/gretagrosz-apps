import { startTransition, useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getKapitelList, jahrgaenge, kapitelOfTopic } from '../data/curriculum.js'
import { useContent } from '../data/content.js'
import { buildExam, correctAnswerText, examPool, givenAnswerText, gradeOf, isBuildQ, isCorrect, questionByRef, randomOrder, refKey, withOrder } from '../data/questions.js'
import { titleOf } from '../data/translate.js'
import AnswerInput from '../components/AnswerInput.jsx'
import BuildAnswer from '../components/BuildAnswer.jsx'
import { useLang } from '../i18n.jsx'
import { XP, useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Segmented from '../components/Segmented.jsx'
import Sheet, { ConfirmSheet } from '../components/Sheet.jsx'
import { ListGroup, ListRow, SectionHeader } from '../components/List.jsx'
import { CheckIcon, ChevronLeft, GridIcon, XIcon } from '../components/Icons.jsx'
import { QUICK, SPRING } from '../motion.js'
import { readRun, runSecondsLeft, writeRun } from '../data/examRun.js'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// Probetest wie eine echte Schularbeit: gemischte Fragen, kein Feedback zwischendurch, Zeitlimit, Note am Ende.
// Gespeichert wird der Lauf in data/examRun.js.
// Fragenanzahl je Art und Stufe (Leicht, Mittel, Schwer, Extrem) und Zeit in Minuten (0 = ohne Limit)
const COUNTS = { test: [12, 15, 15, 18], sa: [25, 30, 30, 35] }
const TIMES = { test: { options: [15, 20, 25, 30, 45, 0], recommended: 25 }, sa: { options: [30, 40, 50, 60, 75, 0], recommended: 50 } }

// Empfohlene Zeit, wenn weniger Fragen da sind als vorgesehen (nächste passende Auswahl)
function recommendedMinutes(kind, level, count) {
  const nominal = COUNTS[kind][level]
  const target = (TIMES[kind].recommended * count) / nominal
  const opts = TIMES[kind].options.filter(Boolean)
  return opts.reduce((best, m) => (Math.abs(m - target) < Math.abs(best - target) ? m : best), opts[0])
}

function Check({ on }) {
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-label3'}`}>
      {on && <CheckIcon className="h-4 w-4" />}
    </span>
  )
}

// ---------- /tests/probe: Einstellungen ----------
export function ProbeSetup() {
  const { state: preset } = useLocation()
  const { myYear, last } = useProgress()
  const startYear = preset?.jahrgangId ?? myYear ?? 1
  const [year, setYear] = useState(startYear)
  const { lang } = useLang()
  useContent(lang, [year])
  const lastKapitel = last && last.jahrgangId === startYear ? kapitelOfTopic(startYear, last.topicId)?.id : null
  return (
    <SetupForm
      year={year}
      setYear={setYear}
      initialChapters={preset?.kapitelIds ?? (lastKapitel ? [lastKapitel] : null)}
      initialKind={preset?.kind ?? 'test'}
      examId={preset?.examId ?? null}
    />
  )
}

function SetupForm({ year, setYear, initialChapters, initialKind, examId }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const [kind, setKind] = useState(initialKind)
  const [level, setLevel] = useState(1)
  const [chosen, setChosen] = useState(() => initialChapters ?? getKapitelList(year).map((k) => k.id))
  const [minutes, setMinutes] = useState(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const existing = readRun()
  const running = existing && existing.phase === 'run'

  const chapters = getKapitelList(year).map((k) => ({ k, n: examPool(year, [k.id]).length }))
  const available = chapters.filter((c) => chosen.includes(c.k.id)).reduce((s, c) => s + c.n, 0)
  const count = Math.min(COUNTS[kind][level], available)
  const rec = count ? recommendedMinutes(kind, level, count) : TIMES[kind].recommended
  const time = minutes ?? rec

  const start = () => {
    const refs = buildExam(year, chosen, level, count)
    const items = refs.map((ref) => ({ ref, order: String(ref.i).startsWith('c') ? null : randomOrder(questionByRef(ref, 'de')) }))
    const now = Date.now()
    writeRun({
      v: 1,
      phase: 'run',
      config: { jahrgangId: year, kapitelIds: chosen, level, kind, minutes: time, examId },
      items,
      answers: items.map(() => null),
      index: 0,
      startedAt: now,
      endsAt: time ? now + time * 60000 : null,
      timeUp: false,
    })
    navigate('/tests/lauf', { replace: true })
  }

  return (
    <Page
      title={t('mockTest')}
      back={examId ? `/tests/${examId}` : '/tests'}
      bar={
        <Button onClick={() => (running ? setConfirmReplace(true) : start())} disabled={count === 0} className="w-full">
          {count === 0 ? t('pickChapter') : t('startMock', { n: count, time: time ? t('minutesShort', { n: time }) : t('noLimit') })}
        </Button>
      }
    >
      {running && (
        <ListGroup>
          <ListRow title={t('mockRunning')} tone="accent" right={t('resume')} onClick={() => navigate('/tests/lauf')} />
        </ListGroup>
      )}

      <Segmented
        id="kind"
        label={t('examType')}
        options={['test', 'sa'].map((k) => ({ value: k, label: t(k === 'sa' ? 'typeSA' : 'typeTest') }))}
        value={kind}
        onChange={(k) => {
          setKind(k)
          setMinutes(null)
        }}
      />

      <SectionHeader>{t('difficulty')}</SectionHeader>
      <Segmented
        id="level"
        label={t('difficulty')}
        className="mb-1.5"
        options={[0, 1, 2, 3].map((i) => ({ value: i, label: t(`diff${i + 1}`) }))}
        value={level}
        onChange={(l) => {
          setLevel(l)
          setMinutes(null)
        }}
      />
      <p className="mb-6 px-4 text-[13px] text-label2">{t(`diffDesc${level + 1}`)}</p>

      <SectionHeader>{t('timeHeader')}</SectionHeader>
      <Segmented
        id="time"
        label={t('timeHeader')}
        options={TIMES[kind].options.map((m) => ({ value: m, label: m ? t('minutesShort', { n: m }) : t('noLimit') }))}
        value={time}
        onChange={setMinutes}
      />

      <Segmented
        id="probe-year"
        label={t('chooseYear')}
        options={jahrgaenge.map((j) => ({ value: j.id, label: t('yearShort', { n: j.id }) }))}
        value={Number(year)}
        onChange={(v) =>
          startTransition(() => {
            setYear(v)
            setChosen(getKapitelList(v).map((k) => k.id))
          })
        }
      />

      <ListGroup header={t('examChapters')}>
        {chapters.map(({ k }) => {
          const on = chosen.includes(k.id)
          return (
            <ListRow
              key={k.id}
              title={titleOf(k, lang)}
              chevron={false}
              selected={on}
              right={<Check on={on} />}
              onClick={() => setChosen(on ? chosen.filter((x) => x !== k.id) : [...chosen, k.id])}
            />
          )
        })}
      </ListGroup>

      <ConfirmSheet
        open={confirmReplace}
        title={t('replaceRunQ')}
        confirmLabel={t('startNew')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirmReplace(false)}
        onConfirm={start}
      />
    </Page>
  )
}

// ---------- /tests/lauf: laufender Test und Ergebnis ----------
export function ProbeLauf() {
  const { lang } = useLang()
  const [run] = useState(readRun)
  // Hooks immer gleich aufrufen; ohne Test geht es zurück zur Einstellung
  useContent(lang, run ? [run.config.jahrgangId] : [])
  if (!run) return <Navigate to="/tests/probe" replace />
  return <Runner initial={run} />
}

function Runner({ initial }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { award, recordAnswer, logMock } = useProgress()
  const [run, setRunState] = useState(initial)
  const [now, setNow] = useState(Date.now())
  const [gridOpen, setGridOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [dir, setDir] = useState(1)

  const setRun = useCallback((update) => {
    setRunState((r) => {
      const next = typeof update === 'function' ? update(r) : update
      writeRun(next)
      return next
    })
  }, [])

  const questions = useMemo(() => run.items.map(({ ref, order }) => withOrder(questionByRef(ref, lang), order)), [run.items, lang])
  const total = questions.length

  const finish = useCallback(
    (timeUp = false) => {
      setRun((r) => {
        if (r.phase !== 'run') return r
        return { ...r, phase: 'result', timeUp, finishedAt: Date.now() }
      })
    },
    [setRun],
  )

  // Ergebnis einmal verbuchen (Fehlerheft, Prognose, XP, Lernplan)
  useEffect(() => {
    if (run.phase !== 'result' || run.recorded) return
    let score = 0
    questions.forEach((q, i) => {
      if (!q) return
      const ok = isCorrect(q, run.answers[i])
      if (ok) score++
      recordAnswer(q.ref, ok)
      if (ok) award(`quiz:${refKey(q.ref)}`, XP.quiz)
    })
    const pct = total ? Math.round((score / total) * 100) : 0
    logMock({ pct, grade: gradeOf(pct), jahrgangId: run.config.jahrgangId, kapitelIds: run.config.kapitelIds, examId: run.config.examId, level: run.config.level })
    setRun((r) => ({ ...r, recorded: true }))
    window.scrollTo({ top: 0 })
  }, [run.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Uhr: läuft nach Datum/Uhrzeit weiter, auch wenn Safari im Hintergrund war
  useEffect(() => {
    if (run.phase !== 'run' || !run.endsAt) return
    const tick = () => {
      const n = Date.now()
      setNow(n)
      if (n >= run.endsAt) finish(true)
    }
    tick()
    const id = setInterval(tick, 500)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [run.phase, run.endsAt, finish])

  const go = (i) => {
    if (i < 0 || i >= total) return
    setDir(i > run.index ? 1 : -1)
    setRun((r) => ({ ...r, index: i }))
    window.scrollTo({ top: 0 })
  }
  const setAnswer = (value) => setRun((r) => ({ ...r, answers: r.answers.map((a, j) => (j === r.index ? value : a)) }))
  const open = run.answers.filter((a) => a === null || a === '').length
  const handIn = () => (open > 0 ? setConfirm(true) : finish(false))

  useEffect(() => {
    if (run.phase !== 'run') return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLInputElement) return
      const q = questions[run.index]
      if (e.key === 'ArrowRight') go(run.index + 1)
      else if (e.key === 'ArrowLeft') go(run.index - 1)
      else if (q?.type === 'mc') {
        const n = '1234'.indexOf(e.key) >= 0 ? Number(e.key) - 1 : 'abcd'.indexOf(e.key.toLowerCase())
        if (n >= 0 && n < q.options.length) setAnswer(n)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  if (run.phase === 'result') return <Result run={run} questions={questions} onAgain={() => navigate('/tests/probe', { replace: true, state: { ...run.config } })} />

  const q = questions[run.index]
  const last = run.index + 1 >= total
  const secondsLeft = runSecondsLeft(run, now)
  const answer = run.answers[run.index]
  const typedQ = q && (q.type === 'text' || q.type === 'number')

  return (
    <Page
      title={t('mockTest')}
      back="/tests"
      inline
      trailing={
        <button onClick={handIn} className="min-h-[44px] px-2 text-[17px] font-semibold text-accent-text active:opacity-50">
          {t('examFinish')}
        </button>
      }
      bar={
        <div className="flex gap-3">
          <button
            onClick={() => go(run.index - 1)}
            disabled={run.index === 0}
            aria-label={t('previousQuestion')}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-fill/[0.14] text-accent-text active:scale-95 disabled:text-label3"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => setGridOpen(true)}
            aria-label={t('overview')}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-fill/[0.14] text-accent-text active:scale-95"
          >
            <GridIcon className="h-[22px] w-[22px]" />
          </button>
          <Button onClick={() => (last ? handIn() : go(run.index + 1))} className="flex-1">
            {last ? t('examFinish') : t('next')}
          </Button>
        </div>
      }
    >
      <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-label2 tabular">
        <span>{t('questionOf', { n: run.index + 1, total })}</span>
        {secondsLeft !== null && (
          <span className={`text-[15px] ${secondsLeft < 60 ? 'font-bold text-danger' : 'text-label'}`} role="timer" aria-label={t('timeLeft', { time: fmtTime(secondsLeft) })}>
            {fmtTime(secondsLeft)}
          </span>
        )}
      </div>
      <div className="mb-6 flex gap-[3px]" aria-hidden>
        {run.answers.map((a, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i === run.index ? 'bg-label' : a !== null && a !== '' ? 'bg-accent' : 'bg-fill/20'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={run.index} initial={{ opacity: 0, x: 16 * dir }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 * dir }} transition={QUICK}>
          {q ? (
            <>
              <h2 className="mb-5 whitespace-pre-line text-[22px] font-bold leading-[28px] text-label">{q.question}</h2>
              {typedQ && (
                <AnswerInput question={q} value={answer ?? ''} onChange={(v) => setAnswer(v)} onSubmit={() => (last ? handIn() : go(run.index + 1))} />
              )}
              {isBuildQ(q) && <BuildAnswer question={q} value={answer} onChange={setAnswer} />}
              <div className="flex flex-col gap-2.5">
                {(q.type === 'mc' ? q.options : []).map((option, i) => {
                  const on = answer === i
                  return (
                    <button
                      key={i}
                      onClick={() => setAnswer(on ? null : i)}
                      aria-pressed={on}
                      className={`flex min-h-[56px] items-center gap-3 rounded-control border-2 px-4 py-3 text-left text-[17px] text-label transition-colors ${
                        on ? 'border-accent bg-accent/10' : 'border-transparent bg-surface'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${on ? 'bg-accent text-white' : 'bg-fill/[0.16] text-label2'}`}>
                        {LETTERS[i]}
                      </span>
                      <span className="min-w-0">{option}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="text-label2">{t('questionMissing')}</p>
          )}
        </motion.div>
      </AnimatePresence>

      <Sheet open={gridOpen} onClose={() => setGridOpen(false)} title={t('overview')}>
        <div className="grid grid-cols-6 gap-2 px-5 pb-2 pt-3 sm:grid-cols-8">
          {run.answers.map((a, i) => {
            const answered = a !== null && a !== ''
            return (
              <button
                key={i}
                onClick={() => {
                  go(i)
                  setGridOpen(false)
                }}
                aria-label={`${t('questionOf', { n: i + 1, total })}${answered ? '' : ` · ${t('unanswered')}`}`}
                className={`flex h-11 items-center justify-center rounded-[10px] text-[15px] font-semibold tabular ${
                  answered ? 'bg-accent text-white' : 'bg-fill/[0.16] text-label'
                } ${i === run.index ? 'ring-2 ring-label ring-offset-2 ring-offset-bg' : ''}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
        <p className="px-5 pt-2 text-[13px] text-label2">{t('openCount', { n: open })}</p>
      </Sheet>

      <ConfirmSheet
        open={confirm}
        title={t('handInQ', { n: open })}
        confirmLabel={t('handInAnyway')}
        cancelLabel={t('keepWriting')}
        destructive={false}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false)
          finish(false)
        }}
      />
    </Page>
  )
}

function Result({ run, questions, onAgain }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const score = questions.filter((q, i) => q && isCorrect(q, run.answers[i])).length
  const total = questions.length
  const pct = total ? Math.round((score / total) * 100) : 0
  const grade = gradeOf(pct)
  const wrong = questions.map((q, i) => ({ q, a: run.answers[i] })).filter(({ q, a }) => q && !isCorrect(q, a))
  const done = () => {
    writeRun(null)
    navigate(run.config.examId ? `/tests/${run.config.examId}` : '/tests', { replace: true })
  }

  return (
    <Page title={t('mockTest')} onBack={done} inline>
      <div className="mb-7 flex flex-col items-center pt-6 text-center">
        <p className="text-[13px] uppercase tracking-wide text-label2">{t('examResult')}</p>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 20 }}
          className="my-3 flex h-28 w-28 items-center justify-center rounded-[30px] bg-accent text-[64px] font-bold text-white tabular"
        >
          {grade}
        </motion.div>
        <p className="text-[22px] font-bold text-label">{t(`grade${grade}`)}</p>
        <p className="mt-1 text-[15px] text-label2">{t('examPoints', { score, total, pct })}</p>
        {run.timeUp && <p className="mt-1 text-[15px] font-semibold text-danger">{t('examTimeUp')}</p>}
      </div>

      <div className="mx-auto mb-9 flex max-w-md flex-col gap-2.5">
        <Button onClick={done} className="w-full">
          {t('doneButton')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            writeRun(null)
            onAgain()
          }}
          className="w-full"
        >
          {t('examAgain')}
        </Button>
      </div>

      {wrong.length > 0 && (
        <section>
          <h2 className="mb-1.5 px-4 text-[13px] uppercase tracking-wide text-label2">{t('missedHeader', { n: wrong.length })}</h2>
          <div className="flex flex-col gap-2.5">
            {wrong.map(({ q, a }) => (
              <article key={refKey(q.ref)} className="rounded-card bg-surface p-4">
                <p className="whitespace-pre-line text-[17px] font-semibold text-label">{q.question}</p>
                <p className="mt-2 flex gap-1.5 text-[15px] text-danger">
                  <XIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-line">{givenAnswerText(q, a) ?? t('noAnswer')}</span>
                </p>
                <p className="mt-1 flex gap-1.5 text-[15px] text-success">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="whitespace-pre-line">{correctAnswerText(q, lang)}</span>
                </p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-snug text-label2">{q.explanation}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </Page>
  )
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
