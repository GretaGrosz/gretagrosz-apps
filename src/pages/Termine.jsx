import { useState } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getKapitelList, jahrgaenge, kapitelOfTopic } from '../data/curriculum.js'
import { addDays, dayKey, daysUntil } from '../data/questions.js'
import { titleOf } from '../data/translate.js'
import { countdownText, formatDay } from '../format.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import Page, { useBack } from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Segmented from '../components/Segmented.jsx'
import ContentBoundary from '../components/ContentBoundary.jsx'
import { ConfirmSheet } from '../components/Sheet.jsx'
import { useToast } from '../components/ToastContext.jsx'
import { ListGroup, ListRow } from '../components/List.jsx'
import { CheckIcon, ClockIcon } from '../components/Icons.jsx'
import { ForecastCard, PlanList, examChapters, examTypeLabel, mockState } from '../components/ExamCards.jsx'

export const EXAM_TYPES = ['sa', 'lzk', 'test']

function Check({ on }) {
  return (
    <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent text-white' : 'border-label3'}`}>
      {on && <CheckIcon className="h-4 w-4" />}
    </span>
  )
}

// /tests/neu (?date=JJJJ-MM-TT) und /tests/:examId/bearbeiten
export function ExamForm() {
  const { examId } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { myYear, last, exams, addExam, updateExam, removeExam, restoreExam } = useProgress()
  const toast = useToast()
  const editing = examId ? exams.find((e) => e.id === examId) : null
  const back = useBack(editing ? `/tests/${editing.id}` : '/tests')

  const initialYear = editing?.jahrgangId ?? myYear ?? 1
  // Vorauswahl: das Kapitel, das zuletzt gelernt wurde
  const lastKapitel = last && last.jahrgangId === initialYear ? kapitelOfTopic(initialYear, last.topicId)?.id : null
  const paramDate = search.get('date')
  const [type, setType] = useState(editing?.type ?? 'sa')
  const [date, setDate] = useState(editing?.date ?? (paramDate && paramDate >= dayKey() ? paramDate : addDays(dayKey(), 7)))
  const [year, setYear] = useState(initialYear)
  const [kapitelIds, setKapitelIds] = useState(editing?.kapitelIds ?? (lastKapitel ? [lastKapitel] : [getKapitelList(initialYear)[0]?.id].filter(Boolean)))
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (examId && !editing) return <Navigate to="/tests" replace />

  const chapters = getKapitelList(year)
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date) && kapitelIds.length > 0

  const save = () => {
    if (!valid) return
    const data = { type, date, jahrgangId: Number(year), kapitelIds }
    if (editing) {
      updateExam(editing.id, data)
      back()
    } else {
      const id = addExam(data)
      navigate(`/tests/${id}`, { replace: true })
    }
  }

  return (
    <Page
      title={editing ? t('editExam') : t('newExam')}
      back={editing ? `/tests/${editing.id}` : '/tests'}
      trailing={
        <button onClick={save} disabled={!valid} className="min-h-[44px] px-2 text-[17px] font-semibold text-accent-text disabled:text-label3 active:opacity-50">
          {t('save')}
        </button>
      }
    >
      <Segmented id="type" label={t('examType')} options={EXAM_TYPES.map((x) => ({ value: x, label: examTypeLabel(t, x) }))} value={type} onChange={setType} />

      <ListGroup>
        <label className="relative flex min-h-[48px] items-center justify-between gap-3 px-4">
          <span className="text-[17px] text-label">{t('examDate')}</span>
          <span className="rounded-[8px] bg-fill/[0.14] px-2.5 py-1 text-[17px] text-accent-text">{formatDay(date, lang)}</span>
          {/* Natives Datumsfeld über der Zeile: öffnet am iPhone das Rad, am Desktop den Kalender */}
          <input
            type="date"
            min={dayKey()}
            value={date}
            required
            aria-label={t('examDate')}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </ListGroup>

      <Segmented
        id="exam-year"
        label={t('chooseYear')}
        options={jahrgaenge.map((j) => ({ value: j.id, label: t('yearShort', { n: j.id }) }))}
        value={Number(year)}
        onChange={(v) => {
          setYear(v)
          setKapitelIds([])
        }}
      />

      <ListGroup header={t('examChapters')}>
        {chapters.map((k) => {
          const on = kapitelIds.includes(k.id)
          return (
            <ListRow
              key={k.id}
              title={titleOf(k, lang)}
              chevron={false}
              selected={on}
              right={<Check on={on} />}
              onClick={() => setKapitelIds(on ? kapitelIds.filter((x) => x !== k.id) : [...kapitelIds, k.id])}
            />
          )
        })}
      </ListGroup>

      <Button onClick={save} disabled={!valid} className="w-full">
        {t('save')}
      </Button>

      {editing && (
        <>
          <Button variant="danger" onClick={() => setConfirmDelete(true)} className="mt-3 w-full">
            {t('deleteExam')}
          </Button>
          <ConfirmSheet
            open={confirmDelete}
            title={t('deleteExamQ')}
            confirmLabel={t('deleteExam')}
            cancelLabel={t('cancel')}
            onCancel={() => setConfirmDelete(false)}
            onConfirm={() => {
              const removed = editing
              removeExam(removed.id)
              navigate('/tests', { replace: true })
              toast({ text: t('examDeleted'), action: { label: t('undo'), run: () => restoreExam(removed) } })
            }}
          />
        </>
      )}
    </Page>
  )
}

// /tests/:examId – eine Prüfung: Prognose, ganzer Lernplan, Probetest
export function ExamDetail() {
  const { examId } = useParams()
  const { exams } = useProgress()
  const exam = exams.find((e) => e.id === examId)
  if (!exam) return <Navigate to="/tests" replace />
  return <ExamDetailView exam={exam} />
}

function ExamDetailView({ exam }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const left = daysUntil(exam.date)

  return (
    <Page
      title={examTypeLabel(t, exam.type)}
      back="/tests"
      trailing={
        <button onClick={() => navigate(`/tests/${exam.id}/bearbeiten`)} className="min-h-[44px] px-2 text-[17px] text-accent-text active:opacity-50">
          {t('edit')}
        </button>
      }
    >
      <p className="-mt-2 mb-5 text-[17px] text-label2">
        {formatDay(exam.date, lang)} · {left < 0 ? t('past') : countdownText(t, exam.date)}
      </p>
      <ContentBoundary>
        <ForecastCard exam={exam} compact />
        {left > 0 && (
          <Button variant="secondary" onClick={() => navigate('/tests/probe', { state: mockState(exam) })} className="mb-7 w-full">
            <ClockIcon className="h-5 w-5" />
            {t('mockTest')}
          </Button>
        )}
        {left >= 0 && (
          <>
            <h2 className="mb-3 mt-2 text-[22px] font-bold text-label">{t('plan')}</h2>
            <PlanList exam={exam} />
          </>
        )}
        <p className="mt-2 px-4 text-[13px] text-label2">{examChapters(exam, lang)}</p>
      </ContentBoundary>
    </Page>
  )
}
