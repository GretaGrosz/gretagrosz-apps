// Today: streak ring, the honest numbers, what to do next, today's words and your own lists
import { DAYS_PER_COLOR, stageFor } from '../theme'
import { formatDay, useT } from '../i18n'
import { CheckIcon, Chevron, GearIcon, NavBar, PlusIcon, Ring, Word } from '../ui'

export default function Home({ from, lang, streak, view, lists, today, onLearn, onTest, onReview, onPractise, onSettings, onYear, onList, onNewList }) {
  const t = useT()
  const stage = stageFor(streak)
  const { set, dayNumber, passedToday, cardsDone, known, dueCount, extraDue } = view

  let primary
  let secondary
  if (cardsDone) {
    primary = { label: t.takeTest, run: onTest }
    secondary = { label: t.learnAgain, run: onLearn }
  } else if (!passedToday) {
    primary = { label: t.learnWords, run: onLearn }
    secondary = { label: t.takeTest, run: onTest }
  } else if (extraDue > 0) {
    primary = { label: t.review(extraDue), run: onReview }
    secondary = { label: t.next10, run: onLearn }
  } else {
    primary = { label: t.next10, run: onLearn }
    secondary = { label: t.practise, run: onPractise }
  }

  return (
    <main className="page">
      <NavBar
        plain
        right={
          <button onClick={onSettings} className="icon-btn" aria-label={t.settings}>
            <GearIcon />
          </button>
        }
      />
      <p className="caption">
        {t.languages[from]} → {t.languages[lang]}
      </p>
      <h1 className="large-title">{t.today}</h1>

      <section className="mt-6 flex flex-col items-center text-center">
        <button onClick={onYear} className="ring-btn rounded-full" aria-label={`${streak} ${t.dayStreak(streak)} · ${t.openYear}`}>
          <Ring value={stage.dayInColor / DAYS_PER_COLOR} slow>
            <span className="num text-[60px] font-bold leading-none">{streak}</span>
            <span className="footnote mt-1">{t.dayStreak(streak)}</span>
          </Ring>
        </button>
        <div className="mt-5 grid w-full max-w-xs grid-cols-2">
          <Stat value={known} label={t.wordsKnown(known)} />
          <Stat value={dueCount} label={t.toReview} />
        </div>
        {passedToday && (
          <p className="headline pop mt-4 flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
            <CheckIcon className="h-[18px] w-[18px]" /> {t.doneToday}
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-3">
        <button onClick={primary.run} className="btn btn-filled">
          {primary.label}
        </button>
        <button onClick={secondary.run} className="btn btn-tinted">
          {secondary.label}
        </button>
        {(!passedToday || cardsDone) && extraDue > 0 && (
          <button onClick={onReview} className="btn btn-tinted">
            {t.review(extraDue)}
          </button>
        )}
      </div>

      <p className="caption mb-2 mt-8 px-4">{t.myLists}</p>
      <div className="group">
        {lists.map((l) => (
          <button key={l.id} className="row" onClick={() => onList(l.id)}>
            <span className="min-w-0 flex-1">
              <span className="body block truncate">{l.name}</span>
              <span className="footnote block truncate">{listLine(t, l, today)}</span>
            </span>
            <span className="secondary">
              <Chevron />
            </span>
          </button>
        ))}
        <button className="row" onClick={onNewList}>
          <span style={{ color: 'var(--link)' }}>
            <PlusIcon />
          </span>
          <span className="body flex-1" style={{ color: 'var(--link)' }}>
            {t.addList}
          </span>
        </button>
      </div>
      <p className="caption mb-2 mt-8 px-4">{(passedToday ? t.nextCaption : t.dayCaption)(dayNumber, t.theme(set.theme))}</p>
      <div className="group">
        {set.words.map((w) => (
          <div key={w.key} className="row justify-between gap-4">
            <span className="body secondary min-w-0 break-words">
              <Word text={w.front} />
            </span>
            <span className="headline min-w-0 break-words text-right">
              <Word text={w.answers[0]} />
            </span>
          </div>
        ))}
      </div>

    </main>
  )
}

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span key={value} className="title2 num pop">
        {value}
      </span>
      <span className="footnote">{label}</span>
    </div>
  )
}

function listLine(t, l, today) {
  if (l.test < today) return t.testWas(formatDay(t, l.test))
  const parts = [`${t.testIn(l.test - today)} · ${formatDay(t, l.test, { weekday: 'short', day: 'numeric', month: 'short' })}`]
  if (l.passed === today) parts.push(t.doneToday)
  return parts.join(' · ')
}
