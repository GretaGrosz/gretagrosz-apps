// Your own lists: paste the school vocab page, set the test date, and study the plan that ends the day before the test
import { useEffect, useMemo, useState } from 'react'
import { LANGUAGE_IDS, dictionary, isLoaded, loadLanguages } from '../lexicon'
import { guessLearnSide, parseList, planFor, toWords } from '../lists'
import { stateOf } from '../srs'
import { dayFromInput, inputFromDay } from '../store'
import { formatDay, useT } from '../i18n'
import { BackButton, CheckIcon, NavBar, Picker, Word } from '../ui'

export function ListNew({ defaults, today, onCreate, onCancel }) {
  const t = useT()
  const [name, setName] = useState('')
  const [from, setFrom] = useState(defaults.from)
  const [lang, setLang] = useState(defaults.lang)
  const [date, setDate] = useState(inputFromDay(today + 7))
  const [text, setText] = useState('')
  const [side, setSide] = useState(null) // null = guess
  const [, setLoaded] = useState(0)
  useEffect(() => {
    let alive = true
    loadLanguages(from, lang).then(() => alive && setLoaded((n) => n + 1), () => {})
    return () => {
      alive = false
    }
  }, [from, lang])

  const parsed = useMemo(() => parseList(text), [text])
  const ready = isLoaded(from, lang)
  const guessed = useMemo(
    () => (parsed.rows.length && ready ? guessLearnSide(parsed.rows, from, lang, { [from]: dictionary(from), [lang]: dictionary(lang) }) : 'left'),
    [parsed, from, lang, ready],
  )
  const learnSide = side || guessed
  const words = useMemo(() => toWords(parsed.rows, learnSide), [parsed, learnSide])
  const test = dayFromInput(date)
  const dateOk = test != null && test > today
  const valid = words.length >= 2 && dateOk && from !== lang
  const options = LANGUAGE_IDS.map((id) => ({ value: id, label: t.languages[id] }))

  const pickFrom = (id) => {
    if (id === lang) setLang(from)
    setFrom(id)
  }
  const pickLang = (id) => {
    if (id === from) setFrom(lang)
    setLang(id)
  }
  const create = () => {
    if (!valid) return
    onCreate({ name: name.trim() || t.listDefaultName(formatDay(t, test, { day: 'numeric', month: 'short' })), from, lang, test, words })
  }

  return (
    <main className="page">
      <NavBar
        left={
          <button onClick={onCancel} className="link -ml-1">
            {t.cancel}
          </button>
        }
        title={t.newList}
        right={
          <button onClick={create} disabled={!valid} className="link pr-2 font-semibold">
            {t.create}
          </button>
        }
      />
      <div className="group mt-6">
        <label className="row">
          <span className="body w-24 shrink-0">{t.listName}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.listNamePlaceholder}
            className="body min-h-[24px] min-w-0 flex-1 bg-transparent text-right outline-none placeholder:text-[var(--label-2)]"
            maxLength={60}
            enterKeyHint="next"
          />
        </label>
        <label className="row">
          <span className="body flex-1">{t.testDate}</span>
          <input
            type="date"
            value={date}
            min={inputFromDay(today + 1)}
            onChange={(e) => setDate(e.target.value)}
            className="body min-h-[34px] rounded-lg bg-[var(--fill)] px-2 text-right outline-none"
            style={{ color: dateOk ? 'var(--label)' : 'var(--red)' }}
          />
        </label>
        <Picker label={t.speak} value={from} onChange={pickFrom} options={options} />
        <Picker label={t.learn} value={lang} onChange={pickLang} options={options} />
      </div>
      {!dateOk && <p className="footnote mt-2 px-4" style={{ color: 'var(--red)' }}>{t.pickFuture}</p>}

      <p className="caption mb-2 mt-8 px-4">{t.pasteCaption}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t.pastePlaceholder}
        rows={8}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        className="field block min-h-[180px] w-full resize-y px-4 py-3 text-[17px] leading-[24px]"
      />

      {parsed.rows.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between px-4">
            <p className="caption">{t.wordsCount(words.length)}</p>
            <button className="link -mr-2 text-[15px]" onClick={() => setSide(learnSide === 'left' ? 'right' : 'left')}>
              {t.swap}
            </button>
          </div>
          <div className="group mt-2">
            {words.slice(0, 8).map((w) => (
              <div key={w.front} className="row justify-between gap-4">
                <span className="body secondary min-w-0 break-words">{w.front}</span>
                <span className="headline min-w-0 break-words text-right">{w.answers.join(' / ')}</span>
              </div>
            ))}
            {words.length > 8 && (
              <div className="row">
                <span className="footnote">+ {words.length - 8}</span>
              </div>
            )}
          </div>
        </>
      )}
      {parsed.skipped.length > 0 && (
        <div className="mt-4 px-4">
          <p className="footnote" style={{ color: 'var(--red)' }}>
            {t.skipped(parsed.skipped.length)}
          </p>
          <ul className="footnote mt-1 space-y-0.5">
            {parsed.skipped.slice(0, 5).map((line, i) => (
              <li key={i} className="truncate">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={create} disabled={!valid} className="btn btn-filled mt-8 w-full">
        {t.create}
      </button>
    </main>
  )
}

export function ListHome({ list, today, onBack, onLearn, onTest, onPractise, onDelete, onDate }) {
  const t = useT()
  const plan = planFor(list, today)
  const cardsDone = list.cards === today
  const passedToday = list.passed === today
  const session = plan.newToday.length + plan.due.length
  const over = plan.testIn < 0

  let primary = null
  let secondary = null
  if (!passedToday && plan.newToday.length && !cardsDone) {
    primary = { label: t.learnNew(plan.newToday.length), run: onLearn }
    secondary = { label: t.takeTest, run: onTest }
  } else if (!passedToday && session > 0) {
    primary = { label: plan.testIn === 1 && !plan.newToday.length ? t.finalReview : t.takeTest, run: onTest }
    if (plan.newToday.length) secondary = { label: t.learnAgain, run: onLearn }
  }
  if (!primary) primary = { label: t.practise, run: onPractise, tinted: true }

  return (
    <main className="page">
      <NavBar plain left={<BackButton onClick={onBack} label={t.today} />} />
      <p className="caption">
        {t.languages[list.from]} → {t.languages[list.lang]} · {t.wordsCount(list.words.length)}
      </p>
      <h1 className="large-title break-words">{list.name}</h1>
      <p className="headline mt-1" style={{ color: over ? 'var(--label-2)' : 'var(--link)' }}>
        {over ? t.testWas(formatDay(t, list.test)) : t.testIn(plan.testIn)}
      </p>

      {!over && (
        <div className="-mx-4 mt-5 overflow-x-auto px-4 [scrollbar-width:none]">
          <div className="flex gap-2">
            {plan.days.map((d) => {
              const isToday = d.day === today
              const isTest = d.kind === 'test'
              return (
                <div
                  key={d.day}
                  className="flex w-[52px] shrink-0 flex-col items-center rounded-2xl py-2"
                  style={{
                    background: isTest ? 'var(--button)' : 'var(--surface)',
                    color: isTest ? 'var(--on-accent)' : 'var(--label)',
                    boxShadow: isToday && !isTest ? 'inset 0 0 0 2px var(--accent)' : 'none',
                  }}
                >
                  <span className="text-[11px] font-semibold uppercase" style={{ opacity: isTest ? 0.85 : 0.6 }}>
                    {formatDay(t, d.day, { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span className="headline num">{formatDay(t, d.day, { day: 'numeric' }).replace('.', '')}</span>
                  <span className="mt-0.5 flex h-4 items-center text-[12px] font-medium" style={{ opacity: isTest ? 1 : 0.7 }}>
                    {isTest ? t.test : d.kind === 'review' ? t.planAll : isToday && passedToday ? <CheckIcon className="h-3.5 w-3.5" /> : `+${d.count}`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {passedToday && (
        <p className="headline pop mt-5 flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
          <CheckIcon className="h-[18px] w-[18px]" /> {t.doneToday}
        </p>
      )}

      <div className="mt-6 grid gap-3">
        <button onClick={primary.run} className={`btn ${primary.tinted ? 'btn-tinted' : 'btn-filled'}`}>
          {primary.label}
        </button>
        {secondary && (
          <button onClick={secondary.run} className="btn btn-tinted">
            {secondary.label}
          </button>
        )}
      </div>

      <div className="group mt-8">
        <label className="row">
          <span className="body flex-1">{t.testDate}</span>
          <input
            type="date"
            value={inputFromDay(list.test)}
            min={inputFromDay(today + 1)}
            onChange={(e) => {
              const d = dayFromInput(e.target.value)
              if (d != null && d > today) onDate(d)
            }}
            className="body min-h-[34px] rounded-lg bg-[var(--fill)] px-2 text-right outline-none"
          />
        </label>
      </div>

      <p className="caption mb-2 mt-8 px-4">{t.wordsCaption}</p>
      <div className="group">
        {list.words.map((w, i) => {
          const st = stateOf(list.srs?.[i])
          return (
            <div key={i} className="row justify-between gap-3">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                aria-hidden="true"
                style={{ background: st === 'known' ? 'var(--green-fill)' : st === 'learning' ? 'var(--accent)' : 'var(--fill)' }}
              />
              <span className="body secondary min-w-0 flex-1 break-words">
                <Word text={w.front} />
              </span>
              <span className="headline min-w-0 break-words text-right">
                <Word text={w.answers[0]} />
              </span>
            </div>
          )
        })}
      </div>

      <div className="group mt-8">
        <button
          className="row justify-center"
          onClick={() => {
            if (window.confirm(t.confirmDelete(list.name))) onDelete()
          }}
        >
          <span className="body" style={{ color: 'var(--red)' }}>
            {t.deleteList}
          </span>
        </button>
      </div>
    </main>
  )
}
