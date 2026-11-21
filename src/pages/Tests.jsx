import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dayKey, daysUntil } from '../data/questions.js'
import { LOCALES, countdownText, formatDay } from '../format.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import { IconTile, ListGroup, ListRow } from '../components/List.jsx'
import { ChevronLeft, ChevronRight, ClockIcon, PlusIcon } from '../components/Icons.jsx'
import { examChapters, examTypeLabel } from '../components/ExamCards.jsx'
import { readRun, runSecondsLeft } from '../data/examRun.js'

// Monatskalender; Tage mit Prüfung sind markiert. Ein Tag antippen = Prüfung an diesem Tag eintragen
// (oder die eingetragene öffnen).
function MonthCalendar({ exams }) {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const now = new Date()
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstWeekday = (new Date(year, m, 1).getDay() + 6) % 7 // Montag = 0
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const today = dayKey()
  const byDay = Object.fromEntries(exams.map((e) => [e.date, e]))
  const locale = LOCALES[lang] ?? 'de-AT'
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2024, 0, 1 + i)))
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)

  return (
    <div className="mb-7 rounded-card bg-surface p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="pl-2 text-[17px] font-semibold text-label">{monthName}</span>
        <span className="flex">
          <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="flex h-11 w-11 items-center justify-center text-accent-text active:opacity-50" aria-label={t('prevMonth')}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="flex h-11 w-11 items-center justify-center text-accent-text active:opacity-50" aria-label={t('nextMonth')}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </span>
      </div>
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((w, i) => (
          <span key={i} className="pb-1 text-[13px] font-semibold text-label3">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />
          const key = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const exam = byDay[key]
          const isToday = key === today
          const past = key < today
          return (
            <button
              key={key}
              disabled={past && !exam}
              onClick={() => navigate(exam ? `/tests/${exam.id}` : `/tests/neu?date=${key}`)}
              aria-label={`${formatDay(key, lang)}${exam ? ` · ${examTypeLabel(t, exam.type)}` : ''}`}
              className="flex h-11 items-center justify-center"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-[17px] tabular ${
                  exam ? 'bg-accent font-semibold text-white' : isToday ? 'font-semibold text-accent-text' : past ? 'text-label3' : 'text-label'
                }`}
              >
                {d}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// /tests – Prüfungstermine, Kalender, Probetest
export default function Tests() {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const { exams } = useProgress()
  const upcoming = exams.filter((e) => daysUntil(e.date) >= 0)
  const past = exams.filter((e) => daysUntil(e.date) < 0).slice(-5).reverse()
  const run = readRun()
  const running = run && run.phase === 'run'

  return (
    <Page title={t('tests')}>
      {running && (
        <ListGroup>
          <ListRow
            title={t('mockRunning')}
            subtitle={run.endsAt ? t('timeLeft', { time: fmtMinutes(runSecondsLeft(run)) }) : t('questionOf', { n: run.index + 1, total: run.items.length })}
            left={<IconTile tone="danger"><ClockIcon className="h-[18px] w-[18px]" /></IconTile>}
            right={t('resume')}
            onClick={() => navigate('/tests/lauf')}
          />
        </ListGroup>
      )}

      <ListGroup header={upcoming.length ? t('upcoming') : null}>
        {upcoming.map((e) => (
          <ListRow
            key={e.id}
            title={`${examTypeLabel(t, e.type)} · ${examChapters(e, lang)}`}
            subtitle={formatDay(e.date, lang)}
            right={<span className="text-[15px]">{countdownText(t, e.date)}</span>}
            onClick={() => navigate(`/tests/${e.id}`)}
          />
        ))}
        <ListRow title={t('addExam')} tone="accent" left={<PlusIcon className="h-5 w-5 text-accent-text" />} chevron={false} onClick={() => navigate('/tests/neu')} />
      </ListGroup>

      <MonthCalendar exams={exams} />

      <ListGroup>
        <ListRow
          title={t('mockTest')}
          subtitle={t('mockTestSub')}
          left={<IconTile><ClockIcon className="h-[18px] w-[18px]" /></IconTile>}
          onClick={() => navigate('/tests/probe')}
        />
      </ListGroup>

      {past.length > 0 && (
        <ListGroup header={t('pastExams')}>
          {past.map((e) => (
            <ListRow key={e.id} title={`${examTypeLabel(t, e.type)} · ${examChapters(e, lang)}`} subtitle={formatDay(e.date, lang)} onClick={() => navigate(`/tests/${e.id}`)} />
          ))}
        </ListGroup>
      )}
    </Page>
  )
}

const fmtMinutes = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
