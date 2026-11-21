// One typed question after another: the daily test, reviews, list sessions and "Find my level" all use this.
import { useEffect, useMemo, useRef, useState } from 'react'
import { checkAnswer } from '../check'
import { useT } from '../i18n'
import { speak } from '../speech'
import { useSessionState } from '../store'
import { CheckIcon, NavBar, SpeakButton, Word, XIcon, vibrate } from '../ui'

export default function Quiz({ id, items, from, lang, dict, title, sound, onFinish, onCancel }) {
  const t = useT()
  const [s, setS] = useSessionState(`deca-q:${id}`, { i: 0, results: [], input: '', result: null })
  const [shakeKey, setShakeKey] = useState(0)
  const input = useRef(null)
  const i = Math.min(s.i, items.length - 1)
  const word = items[i]
  const ctx = useMemo(() => ({ lang, from, others: items, dict }), [items, lang, from, dict])
  const last = i === items.length - 1
  const streak = useMemo(() => {
    let n = 0
    const all = s.result ? [...s.results, s.result] : s.results
    for (let k = all.length - 1; k >= 0 && all[k].correct; k--) n++
    return n
  }, [s.results, s.result])

  useEffect(() => {
    // Keep the keyboard up from one question to the next
    input.current?.focus({ preventScroll: true })
  }, [i])

  const submit = (e) => {
    e.preventDefault()
    if (s.result) {
      const results = [...s.results, s.result]
      if (last) {
        onFinish(results)
        return
      }
      setS({ i: i + 1, results, input: '', result: null })
      return
    }
    const r = checkAnswer(s.input, word, ctx)
    const result = { key: word.key, front: word.front, answers: word.answers, level: word.level, input: s.input.trim(), correct: r.correct, kind: r.kind, answer: r.answer, other: r.other?.front || null }
    setS({ ...s, result })
    if (r.correct) vibrate(12)
    else {
      vibrate([30, 40, 30])
      setShakeKey((k) => k + 1)
    }
    if (sound) speak(r.answer, lang)
  }

  const done = s.results.length + (s.result ? 1 : 0)
  const r = s.result
  const label = r ? (last ? t.seeResult : t.continue) : s.input.trim() ? t.check : t.dontKnow

  return (
    <main className="page page-fill">
      <NavBar
        left={
          <button onClick={onCancel} className="link -ml-1">
            {t.cancel}
          </button>
        }
        title={title}
        right={<span className="footnote num pr-2">{t.of(Math.min(done + (r ? 0 : 1), items.length), items.length)}</span>}
      />
      <div className="segments mt-3" aria-hidden="true">
        {items.map((w, n) => {
          const res = n < s.results.length ? s.results[n] : n === s.results.length ? r : null
          return <span key={n} className={res ? (res.correct ? 'right' : 'wrong') : n === i ? 'on' : ''} />
        })}
      </div>
      <div className="flex h-8 items-center justify-end">
        {streak >= 3 && (
          <span key={streak} className="bump footnote num rounded-full px-2.5 py-0.5 font-semibold" style={{ background: 'var(--tint)', color: 'var(--link)' }}>
            {t.inARow(streak)}
          </span>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex flex-col">
        <div key={i} className="rise text-center">
          <p className="caption">{t.inLang(t.languages[lang])}</p>
          <p className="mt-2 break-words text-[34px] font-bold leading-tight">
            <Word text={word.front} />
          </p>
        </div>

        <div key={`f${shakeKey}`} className={shakeKey && r && !r.correct ? 'shake' : ''}>
          <input
            ref={input}
            autoFocus
            value={s.input}
            onChange={(e) => !r && setS({ ...s, input: e.target.value })}
            readOnly={!!r}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint={r ? 'next' : 'done'}
            lang={lang}
            aria-label={t.placeholder}
            placeholder={t.placeholder}
            className={`field mt-6 h-14 w-full px-4 text-center text-[20px] ${r ? (r.correct ? 'is-right' : 'is-wrong') : ''}`}
          />
        </div>

        {r && <Feedback r={r} lang={lang} />}

        <button className={`btn mt-4 w-full ${!r && !s.input.trim() ? 'btn-gray' : 'btn-filled'}`}>{label}</button>
      </form>
    </main>
  )
}

function Feedback({ r, lang }) {
  const t = useT()
  const note = { article: t.article, spelling: t.spelling, typo: t.typo }[r.kind]
  const also = r.correct ? r.answers.filter((a) => a !== r.answer) : []
  return (
    <div className={`pop group mt-3 flex items-start gap-3 p-4 ${r.correct ? 'glow' : ''}`} role="status">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white" style={{ background: r.correct ? 'var(--green-fill)' : 'var(--red-fill)' }}>
        {r.correct ? <CheckIcon className="h-4 w-4" /> : <XIcon className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="headline" style={{ color: r.correct ? 'var(--green)' : 'var(--red)' }}>
          {r.correct ? t.correct : t.wrong}
        </p>
        <p className="body mt-0.5 break-words">
          {(note || !r.correct) && <span className="secondary">{note || t.answer}: </span>}
          <strong>
            <Word text={r.answer} />
          </strong>
        </p>
        {r.kind === 'other' && r.other && <p className="footnote mt-1">{t.otherWord(r.input, r.other)}</p>}
        {also.length > 0 && (
          <p className="footnote mt-1">
            {t.alsoRight}: {also.join(', ')}
          </p>
        )}
      </div>
      <SpeakButton text={r.answer} lang={lang} className="icon-btn -my-2 -mr-2 shrink-0" />
    </div>
  )
}
