import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getJahrgang, getKapitel, getTopic, kapitelOfTopic } from '../data/curriculum.js'
import { titleOf } from '../data/translate.js'
import { useContent } from '../data/content.js'
import { chapterQuestions, correctAnswerText, draftReady, givenAnswerText, isBuildQ, isCorrect, questionByRef, randomOrder, refKey, shuffle, topicQuestions, withOrder } from '../data/questions.js'
import { chapterLink, topicLink } from '../data/links.js'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import AnswerInput from '../components/AnswerInput.jsx'
import BuildAnswer from '../components/BuildAnswer.jsx'
import { CheckIcon, NotebookIcon, XIcon } from '../components/Icons.jsx'
import { useLang } from '../i18n.jsx'
import { XP, useProgress } from '../progress.jsx'
import { QUICK, SPRING } from '../motion.js'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

// Welche Fragen gehören zu dieser Runde? (als Adressen, damit ein Sprachwechsel nichts durcheinanderbringt)
function sessionSpec(mode, params, search, mistakes) {
  if (mode === 'fehler') {
    const refs = Object.values(mistakes)
    return { kind: 'fehler', years: [...new Set(refs.map((r) => r.jahrgangId))], refs }
  }
  if (mode === 'mix') {
    const year = Number(params.jahrgangId)
    const topicIds = (search.get('t') ?? '').split(',').filter((id) => getTopic(year, id))
    const n = Number(search.get('n')) || 0
    return { kind: 'mix', years: [year], year, topicIds, n }
  }
  const { jahrgangId, kapitelId, topicId } = params
  return { kind: topicId === 'gesamt' ? 'chapter' : 'topic', years: [Number(jahrgangId)], year: Number(jahrgangId), kapitelId, topicId }
}

function buildItems(spec, mistakes) {
  let refs = []
  if (spec.kind === 'fehler') refs = shuffle(Object.values(mistakes))
  else if (spec.kind === 'mix') {
    const all = spec.topicIds.flatMap((id) => {
      const k = kapitelOfTopic(spec.year, id)
      return k ? topicQuestions(spec.year, k.id, getTopic(spec.year, id), 'de').map((q) => q.ref) : []
    })
    refs = shuffle(all)
    if (spec.n) refs = refs.slice(0, spec.n)
  } else if (spec.kind === 'chapter') refs = shuffle(chapterQuestions(spec.year, spec.kapitelId, 'de').map((q) => q.ref))
  else refs = shuffle(topicQuestions(spec.year, spec.kapitelId, getTopic(spec.year, spec.topicId), 'de').map((q) => q.ref))
  return refs
    .map((ref) => {
      const q = questionByRef(ref, 'de')
      return q ? { ref, order: randomOrder(q) } : null
    })
    .filter(Boolean)
}

// mode: undefined (Thema oder ganzes Kapitel) · "fehler" (Fehlerheft) · "mix" (ausgewählte Themen, ?t=a,b&n=15)
export default function Quiz({ mode }) {
  const params = useParams()
  const [search] = useSearchParams()
  const { lang } = useLang()
  const { mistakes } = useProgress()
  // Fehlerheft beim Start festhalten (richtige Antworten entfernen Fragen sonst sofort)
  const [frozenMistakes] = useState(mistakes)
  const spec = useMemo(() => sessionSpec(mode, params, search, frozenMistakes), [mode, params.jahrgangId, params.kapitelId, params.topicId, search.toString(), frozenMistakes]) // eslint-disable-line react-hooks/exhaustive-deps
  useContent(lang, spec.years)
  return <QuizRun spec={spec} mistakes={frozenMistakes} />
}

function QuizRun({ spec, mistakes: startMistakes }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { award, setLast, recordAnswer, logPractised, logMistakesRun, mistakes } = useProgress()
  const isFehler = spec.kind === 'fehler'
  const year = spec.year
  const jahrgang = isFehler ? true : getJahrgang(year)
  const kapitel = spec.kapitelId ? getKapitel(year, spec.kapitelId) : null
  const topic = spec.kind === 'topic' ? getTopic(year, spec.topicId) : null

  const [items, setItems] = useState(() => buildItems(spec, startMistakes))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState([]) // pro Frage: gegebene Antwort (Index im gemischten Satz oder Text)
  const [typed, setTyped] = useState('')
  const [draft, setDraft] = useState(null) // Entwurf bei Mehrfachauswahl, Reihenfolge, Zuordnung
  const [finished, setFinished] = useState(false)

  const title = isFehler
    ? t('mistakesTitle')
    : spec.kind === 'mix'
    ? t('focusQuiz')
    : spec.kind === 'chapter'
    ? titleOf(kapitel, lang)
    : titleOf(topic, lang)
  const backTo = isFehler || spec.kind === 'mix' ? '/' : topicLink(year, spec.kapitelId, spec.topicId)

  useEffect(() => {
    if (topic) setLast({ jahrgangId: year, kapitelId: spec.kapitelId, topicId: topic.id })
  }, [topic?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const questions = useMemo(() => items.map(({ ref, order }) => withOrder(questionByRef(ref, lang), order)), [items, lang])
  const total = questions.length
  const q = questions[index]
  const answer = answers[index]
  const answered = answer !== undefined
  const typedQ = q && (q.type === 'text' || q.type === 'number')
  const buildQ = isBuildQ(q)
  const right = answered && isCorrect(q, answer)

  const select = useCallback(
    (value) => {
      if (answered || !q) return
      setAnswers((a) => {
        const next = [...a]
        next[index] = value
        return next
      })
      const ok = isCorrect(q, value)
      recordAnswer(q.ref, ok)
      if (ok) award(`quiz:${refKey(q.ref)}`, XP.quiz)
    },
    [answered, q, index, recordAnswer, award],
  )

  const finish = useCallback(() => {
    const score = questions.filter((x, i) => isCorrect(x, answers[i])).length
    if (isFehler) logMistakesRun()
    else {
      const topicIds = [...new Set(items.map((it) => it.ref.topicId))]
      logPractised(topicIds)
      if (spec.kind === 'topic' && total && score / total >= 0.8) award(`quizpass:${year}|${spec.topicId}`, 0)
    }
    setFinished(true)
    window.scrollTo({ top: 0 })
  }, [questions, answers, isFehler, items, spec, total, year, award, logPractised, logMistakesRun])

  const next = useCallback(() => {
    if (!answered) return
    if (index + 1 >= total) finish()
    else {
      setIndex((i) => i + 1)
      setTyped('')
      setDraft(null)
      window.scrollTo({ top: 0 })
    }
  }, [answered, index, total, finish])

  const restart = () => {
    setItems(buildItems(isFehler ? { ...spec } : spec, isFehler ? mistakes : startMistakes))
    setIndex(0)
    setAnswers([])
    setTyped('')
    setDraft(null)
    setFinished(false)
    window.scrollTo({ top: 0 })
  }

  // Tastatur: 1–4 oder A–D antworten, Enter = weiter
  useEffect(() => {
    if (finished) return
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const inInput = e.target instanceof HTMLInputElement
      if (e.key === 'Enter' && answered) {
        e.preventDefault()
        next()
        return
      }
      if (inInput || answered || !q || q.type !== 'mc') return
      const n = '1234'.indexOf(e.key) >= 0 ? Number(e.key) - 1 : 'abcd'.indexOf(e.key.toLowerCase())
      if (n >= 0 && n < q.options.length) select(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finished, answered, q, typedQ, next, select])

  if (!jahrgang || (spec.kind === 'topic' && !topic) || (spec.kind === 'chapter' && !kapitel)) {
    return (
      <Page title={t('practice')} back="/themen">
        <p className="text-label2">{t('topicNotFound')}</p>
      </Page>
    )
  }

  if (total === 0) {
    if (isFehler) return <MistakesEmpty />
    return (
      <Page title={title} back={backTo}>
        <p className="text-label2">{t('noQuestions')}</p>
      </Page>
    )
  }

  if (finished) {
    const results = questions.map((x, i) => ({ q: x, a: answers[i], ok: isCorrect(x, answers[i]) }))
    const score = results.filter((r) => r.ok).length
    const wrong = results.filter((r) => !r.ok)
    const pct = Math.round((score / total) * 100)
    const openMistakes = Object.keys(mistakes).length
    return (
      <Page title={title} back={backTo} inline>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="pt-6 text-center">
          <p className="text-[15px] font-semibold text-label2">{pct >= 80 ? t('resultGreat') : pct >= 50 ? t('resultGood') : t('resultLow')}</p>
          <p className="mt-1 text-[56px] font-bold leading-none text-label tabular">
            {score}
            <span className="text-label3">/{total}</span>
          </p>
          <p className="mt-2 text-[15px] text-label2">{t('percentRight', { pct })}</p>
        </motion.div>

        <div className="mx-auto mt-7 flex max-w-md flex-col gap-2.5">
          {wrong.length > 0 && openMistakes > 0 && !isFehler && (
            <Button onClick={() => navigate('/fehler', { replace: true })} className="w-full">
              <NotebookIcon className="h-5 w-5" />
              {t('reviewMistakes', { n: openMistakes })}
            </Button>
          )}
          <Button variant={wrong.length > 0 && openMistakes > 0 && !isFehler ? 'secondary' : 'primary'} onClick={restart} className="w-full">
            {isFehler ? (openMistakes > 0 ? t('mistakesAgain', { n: openMistakes }) : t('allMistakesFixed')) : t('againShuffled')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(isFehler || spec.kind === 'mix' ? '/' : chapterLink(year, spec.kapitelId), { replace: true })}
            className="w-full"
          >
            {isFehler || spec.kind === 'mix' ? t('toHome') : t('otherTopics')}
          </Button>
        </div>

        {wrong.length > 0 && (
          <section className="mt-9">
            <h2 className="mb-1.5 px-4 text-[13px] uppercase tracking-wide text-label2">{t('missedHeader', { n: wrong.length })}</h2>
            <div className="flex flex-col gap-2.5">
              {wrong.map(({ q: x, a }) => (
                <article key={refKey(x.ref)} className="rounded-card bg-surface p-4">
                  <p className="whitespace-pre-line text-[17px] font-semibold text-label">{x.question}</p>
                  <p className="mt-2 flex gap-1.5 text-[15px] text-danger">
                    <XIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-pre-line">{givenAnswerText(x, a) ?? t('noAnswer')}</span>
                  </p>
                  <p className="mt-1 flex gap-1.5 text-[15px] text-success">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="whitespace-pre-line">{correctAnswerText(x, lang)}</span>
                  </p>
                  <p className="mt-2 text-[15px] leading-snug text-label2">{x.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </Page>
    )
  }

  return (
    <Page
      title={title}
      back={backTo}
      inline
      bar={
        answered ? (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
            <div role="status" className="mb-3">
              <p className={`flex items-center gap-1.5 text-[17px] font-semibold ${right ? 'text-success' : 'text-danger'}`}>
                {right ? <CheckIcon className="h-5 w-5" /> : <XIcon className="h-5 w-5" />}
                {right ? t('correct') : t('notQuite')}
              </p>
              {(typedQ || q.type === 'order') && !right && (
                <p className="mt-1 text-[15px] text-label">
                  <span className="font-semibold">{t('rightAnswer')}</span> {correctAnswerText(q, lang)}
                </p>
              )}
              <p className="mt-1 max-h-[28dvh] overflow-y-auto whitespace-pre-line text-[15px] leading-snug text-label2">{q.explanation}</p>
            </div>
            <Button onClick={next} className="w-full" autoFocus>
              {index + 1 >= total ? t('showResult') : t('next')}
            </Button>
          </motion.div>
        ) : typedQ ? (
          <Button disabled={!typed.trim()} onClick={() => select(typed.trim())} className="w-full">
            {t('check')}
          </Button>
        ) : buildQ ? (
          <Button disabled={!draftReady(q, draft)} onClick={() => select(draft)} className="w-full">
            {t('check')}
          </Button>
        ) : null
      }
    >
      <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-label2 tabular">
        <span>{t('questionOf', { n: index + 1, total })}</span>
      </div>
      <div
        className="mb-6 h-1 w-full overflow-hidden rounded-full bg-fill/20"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + (answered ? 1 : 0)}
        aria-label={t('progress')}
      >
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
          transition={SPRING}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={index} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={QUICK}>
          <h2 className="mb-5 whitespace-pre-line text-[22px] font-bold leading-[28px] text-label">{q.question}</h2>

          {typedQ && (
            <AnswerInput
              question={q}
              value={answered ? String(answer) : typed}
              onChange={setTyped}
              onSubmit={() => typed.trim() && select(typed.trim())}
              locked={answered}
              state={!answered ? null : right ? 'right' : 'wrong'}
            />
          )}

          {buildQ && <BuildAnswer question={q} value={answered ? answer : draft} onChange={setDraft} reveal={answered} />}

          {!typedQ && !buildQ && (
            <div className="flex flex-col gap-2.5">
              {q.options.map((option, i) => {
                const chosen = answer === i
                const isRight = answered && i === q.correctIndex
                const isWrong = answered && chosen && !right
                const look = isRight
                  ? 'border-success bg-success/10'
                  : isWrong
                  ? 'border-danger bg-danger/10'
                  : answered
                  ? 'border-transparent bg-surface opacity-60'
                  : 'border-transparent bg-surface active:bg-fill/10'
                return (
                  <motion.button
                    key={`${index}-${i}`}
                    onClick={() => select(i)}
                    disabled={answered}
                    animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : isRight && chosen ? { scale: [1, 1.02, 1] } : {}}
                    transition={{ duration: 0.32 }}
                    className={`flex min-h-[56px] items-center gap-3 rounded-control border-2 px-4 py-3 text-left text-[17px] text-label transition-[background-color,border-color,opacity] duration-150 ${look}`}
                  >
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                        isRight ? 'bg-success text-white' : isWrong ? 'bg-danger text-white' : 'bg-fill/[0.16] text-label2'
                      }`}
                    >
                      {isRight ? <CheckIcon className="h-4 w-4" /> : isWrong ? <XIcon className="h-4 w-4" /> : LETTERS[i]}
                    </span>
                    <span className="min-w-0">{option}</span>
                  </motion.button>
                )
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}

function MistakesEmpty() {
  const navigate = useNavigate()
  const { t } = useLang()
  return (
    <Page title={t('mistakesTitle')} back="/">
      <div className="flex flex-col items-center pt-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckIcon className="h-8 w-8" />
        </span>
        <p className="mt-4 text-[20px] font-semibold text-label">{t('noMistakes')}</p>
        <Button onClick={() => navigate('/themen')} className="mt-6 min-w-[200px]">
          {t('practice')}
        </Button>
      </div>
    </Page>
  )
}
