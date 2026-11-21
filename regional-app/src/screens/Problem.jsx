import { useEffect, useRef, useState } from 'react'
import { PAPERS, paperLinks } from '../plan'
import { checkAnswer } from '../check'
import { gradeProof } from '../ai'
import { t, tn } from '../i18n'
import { CHALLENGE_MASTER, PROOF_PASS, TRIES, bestScore, checksOn } from '../logic'
import { BackButton, ChatIcon, GradeCard, MistakePicker, NavBar, Page, PhotoStrip, PointsSelf, Rich, Split, StepCheck, areaColor, useDraft } from '../ui'

export const SELF_MIN_CHARS = 60 // typed before you can check it yourself (or one photo)

// The first sentence of a worked solution, used as the last hint for problems without a written hint ladder
const firstStep = (solution) => {
  const parts = (solution || '')
    .split(/\n+/)
    .flatMap((line) => line.match(/[^.]+(?:\.|$)/g) || [])
    .map((x) => x.trim())
    .filter(Boolean)
  if (parts.length < 2) return null
  return parts[0].endsWith(':') ? `${parts[0]} ${parts[1]}` : parts[0]
}

export function Hints({ hints }) {
  const [level, setLevel] = useState(0)
  if (!hints.length) return null
  return (
    <div className="mt-3 space-y-2">
      {hints.slice(0, level).map(([name, h]) => (
        <div key={name} className="rise rounded-xl px-3 py-2.5" style={{ background: 'var(--fill)' }}>
          <p className="caption font-semibold uppercase">{t(name)}</p>
          <Rich text={h} className="subhead mt-0.5" />
        </div>
      ))}
      {level < hints.length && (
        <button onClick={() => setLevel((l) => l + 1)} className="link flex h-11 items-center px-1 text-[15px] active:opacity-50">
          {level === 0 ? t('Show a hint') : t('Show the next hint')}
        </button>
      )}
    </div>
  )
}

export const hintLadder = (problem) =>
  problem.hints
    ? problem.hints.map((h, i) => [['Nudge', 'Key idea', 'First step'][i] || 'Hint', h])
    : [problem.hint && ['Hint', problem.hint], (problem.keySteps?.[0] || firstStep(problem.solution)) && ['First step', problem.keySteps?.[0] || firstStep(problem.solution)]].filter(Boolean)

// variant: 'day' (a problem of a day), 'review' (warm-up or redo from the mistake notebook), 'mini' (a mini-mock problem)
// next: { label, onClick } — where to go once this one is done
export function ProblemScreen({ d, part, problem, entry, update, isCurrent, ai, today, onBack, onCoach, onNewProblem, onMistake, variant = 'day', title, eyebrow, backLabel, failNote, next, draftKey }) {
  const isMock = d.kind === 'paper' || variant === 'mini'
  const isChallenge = part === 'c' && variant === 'day'
  const kind = problem.type === 'answer' ? 'answer' : 'proof'
  const passMark = isChallenge ? CHALLENGE_MASTER : PROOF_PASS
  const maxChecks = isMock ? 1 : isChallenge ? Infinity : TRIES
  const used = isMock ? entry.grades.length : checksOn(entry, today)
  const best = bestScore(entry)
  const done = kind === 'answer' ? entry.solved || entry.tries >= TRIES : best >= passMark || used >= maxChecks
  const failed = done && !isMock && !isChallenge && (kind === 'answer' ? !entry.solved : best < passMark)
  const passed = kind === 'answer' ? entry.solved : best >= passMark
  const weakMock = variant === 'mini' && entry.grades.length > 0 && best < PROOF_PASS
  const hints = hintLadder(problem)
  const locked = !isCurrent && !d.result
  const pickMistake = (reason) => {
    update((w) => ({ ...w, mistake: reason }))
    onMistake?.(reason)
  }

  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(0)
  const [formatHint, setFormatHint] = useState(false)
  const [showSolution, setShowSolution] = useState(false)
  const [photos, setPhotos] = useState([])
  const [markedPhotos, setMarkedPhotos] = useState([])
  const [text, setText] = useDraft(draftKey)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selfCheck, setSelfCheck] = useState(false)
  const [zeroNote, setZeroNote] = useState(false)
  const resultRef = useRef(null)

  // Bring the verdict into view on a phone
  useEffect(() => {
    if (done && resultRef.current && innerWidth < 1024) resultRef.current.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
  }, [done])

  const submitAnswer = (e) => {
    e.preventDefault()
    if (!input.trim() || done || locked) return
    const verdict = checkAnswer(input, problem.answers)
    setFormatHint(verdict === 'format')
    if (verdict === 'format') return
    if (verdict === 'correct') update((w) => ({ ...w, solved: true }))
    else {
      setWrong((n) => n + 1)
      update((w) => ({ ...w, tries: w.tries + 1 }))
    }
  }

  const addGrade = (g) => update((w) => ({ ...w, grades: [...w.grades, { ...g, day: today }] }))

  const check = async () => {
    setBusy(true)
    setError('')
    try {
      const sent = photos
      const grade = await gradeProof(problem, { photos: sent, text })
      setMarkedPhotos(sent)
      addGrade({ ...grade, source: 'ai' })
      // Keep the proof so it can be fixed and checked again; clear it once it passes
      if (grade.score >= passMark) {
        setPhotos([])
        setText('')
      }
    } catch (e) {
      setError(e.message)
    }
    setBusy(false)
  }

  const latest = entry.grades[entry.grades.length - 1]
  const label = title || (isChallenge ? t('Challenge') : t('Problem {n}', { n: Number(part.slice(1)) + 1 }))
  const coachAllowed = (!isMock || d.result) && ai.mode !== 'none'
  const canSelf = isMock || photos.length > 0 || text.trim().length >= SELF_MIN_CHARS
  const outOfMarks = ai.mode === 'hosted' && ai.marksLeft === 0
  const steps = problem.rubric?.length ? problem.rubric : problem.keySteps?.length ? problem.keySteps.map((s) => [s, 0]) : null
  const saveSelf = (g) => {
    setSelfCheck(false)
    // An empty self-check is "not yet", not one of today's checks
    if (!isMock && g.score === 0) return setZeroNote(true)
    setZeroNote(false)
    if (g.score >= passMark) {
      setPhotos([])
      setText('')
    }
    addGrade(g)
  }

  const statement = (
    <>
      <p className="footnote font-semibold" style={{ color: isChallenge ? 'var(--purple)' : areaColor(d) }}>
        {eyebrow || (isChallenge ? problem.source : isMock ? `${t(PAPERS[d.paper?.[0]]?.name || 'Regionalwettbewerb')} ${d.paper?.[1] || ''}` : kind === 'answer' ? t('Find the answer') : t('Prove it'))}
      </p>
      {entry.swaps?.length > 0 && <p className="footnote mt-1">{t('New problem, from day {n}', { n: entry.swaps[entry.swaps.length - 1].index + 1 })}</p>}
      <div className="card mt-2 p-5">
        <Rich text={problem.q} />
      </div>
      {!done && !isMock && <Hints hints={hints} />}
    </>
  )

  return (
    <>
      <NavBar
        title={label}
        alwaysTitle
        wide
        left={<BackButton onClick={onBack} label={backLabel || (isMock ? t('Paper') : t('Day'))} />}
        right={
          coachAllowed && (
            <button onClick={() => onCoach(problem, latest)} className="link flex h-11 items-center gap-1.5 active:opacity-50">
              <ChatIcon className="h-[20px] w-[20px]" /> {t('Ask')}
            </button>
          )
        }
      />
      <Page className="pt-2" wide>
        <Split statement={statement}>
          {kind === 'answer' && (
            <form onSubmit={submitAnswer} className="mt-6 lg:mt-0">
              <input
                key={wrong}
                value={entry.solved ? problem.answers[0] : input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setFormatHint(false)
                }}
                readOnly={done || locked}
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                inputMode="text"
                enterKeyHint="go"
                aria-label={t('Your answer')}
                placeholder={t('Your answer')}
                className={`field h-14 w-full px-4 text-center text-[22px] font-medium outline-none placeholder:text-[17px] placeholder:font-normal placeholder:text-[var(--label-2)] ${wrong && !entry.solved ? 'shake' : ''}`}
                style={{ color: 'var(--label)', borderColor: entry.solved ? 'var(--green)' : entry.tries >= TRIES ? 'var(--red)' : formatHint ? 'var(--orange)' : 'transparent' }}
              />
              <p className="footnote mt-2 text-center" aria-live="polite" style={formatHint ? { color: 'var(--orange)' } : undefined}>
                {entry.solved ? '' : formatHint ? t('Enter just the number') : entry.tries >= TRIES ? t('No tries left') : entry.tries ? tn(TRIES - entry.tries, 'Not quite. {n} try left', 'Not quite. {n} tries left') : tn(TRIES, '{n} try', '{n} tries')}
              </p>
              {entry.solved && (
                <p ref={resultRef} className="pop headline text-center" style={{ color: 'var(--green)' }}>
                  {t('Correct!')}
                </p>
              )}
              {!done && (
                <button disabled={!input.trim() || locked} className="btn btn-filled mt-4 w-full">
                  {t('Check')}
                </button>
              )}
            </form>
          )}

          {kind === 'proof' && (
            <div className="mt-6 lg:mt-0">
              {latest && <GradeCard grade={latest} photos={latest.source === 'ai' ? markedPhotos : []} />}
              {entry.grades.length > 1 && (
                <p className="footnote mt-2 px-1">
                  {t('Earlier')}: {entry.grades.slice(0, -1).map((g) => `${g.score}/8`).join(' · ')}
                </p>
              )}
              {best >= passMark && (
                <p ref={resultRef} className="pop headline mt-4 text-center" style={{ color: isChallenge ? 'var(--purple)' : 'var(--green)' }}>
                  {isChallenge ? t('Mastered!') : t('Proof accepted!')}
                </p>
              )}

              {!done && !locked && (
                <div className="mt-4">
                  {selfCheck ? (
                    steps ? (
                      <StepCheck steps={steps} solution={problem.solution} onCancel={() => setSelfCheck(false)} onScore={saveSelf} />
                    ) : (
                      <PointsSelf solutionsUrl={d.paper ? paperLinks(d.paper).solutions : null} onCancel={() => setSelfCheck(false)} onScore={saveSelf} />
                    )
                  ) : (
                    <>
                      <div className="card p-4">
                        <p className="headline mb-3">{isMock ? t('Hand in your solution') : latest ? t('Improve and check again') : t('Your proof')}</p>
                        <PhotoStrip photos={photos} setPhotos={setPhotos} disabled={busy} onError={setError} />
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          disabled={busy}
                          rows={4}
                          aria-label={t('Your proof')}
                          placeholder={t('…or type it here')}
                          className="mt-3 w-full resize-y rounded-xl p-3 text-[17px] leading-[23px] outline-none placeholder:text-[var(--label-2)]"
                          style={{ background: 'var(--fill)', color: 'var(--label)' }}
                        />
                      </div>
                      {error && (
                        <p className="footnote mt-2 px-1" style={{ color: 'var(--red)' }} role="alert">
                          {error}
                        </p>
                      )}
                      {zeroNote && <p className="footnote mt-2 px-1">{t('Nothing proved yet, so no check was used.')}</p>}
                      {ai.mode !== 'none' && (
                        <button onClick={check} disabled={busy || outOfMarks || (!photos.length && !text.trim())} className={`btn mt-4 w-full ${isChallenge ? 'btn-purple' : 'btn-filled'}`}>
                          {busy ? (
                            <>
                              <span className="spinner" aria-hidden="true" /> {t('Reading your proof…')}
                            </>
                          ) : outOfMarks ? (
                            t('No marks left today')
                          ) : isMock ? (
                            t('Hand In')
                          ) : (
                            t('Check My Proof')
                          )}
                        </button>
                      )}
                      {!busy && (
                        <button onClick={() => setSelfCheck(true)} disabled={!canSelf} className={`btn mt-3 w-full ${ai.mode !== 'none' && !outOfMarks ? 'btn-gray' : 'btn-filled'}`}>
                          {t('Check It Myself')}
                        </button>
                      )}
                      <p className="footnote mt-2 text-center tabular-nums">
                        {[Number.isFinite(maxChecks) && (isMock ? t('Marked once') : tn(maxChecks - used, '{n} check left today', '{n} checks left today')), ai.mode === 'hosted' && ai.marksLeft != null && tn(ai.marksLeft, '{n} AI mark left today', '{n} AI marks left today')].filter(Boolean).join(' · ')}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {done && passed && next && (
            <button onClick={next.onClick} className="btn btn-filled pop mt-5 w-full">
              {next.label}
            </button>
          )}

          {failed && !d.result && (
            <div className="card fade-in mt-6 p-4">
              <p className="headline">{t('Out of tries on this one.')}</p>
              {failNote && <p className="subhead secondary mt-1">{failNote}</p>}
              {onMistake && (
                <div className="mt-3">
                  <MistakePicker value={entry.mistake} onPick={pickMistake} />
                </div>
              )}
              {onNewProblem && (
                <button onClick={onNewProblem} className="btn btn-filled mt-4 w-full">
                  {t('Try a New Problem')}
                </button>
              )}
            </div>
          )}
          {weakMock && d.result && onMistake && (
            <div className="card fade-in mt-6 p-4">
              <MistakePicker value={entry.mistake} onPick={pickMistake} />
            </div>
          )}
          {d.kind === 'paper' && d.result && (
            <a href={paperLinks(d.paper).solutions} target="_blank" rel="noreferrer" className="link mt-6 flex h-11 items-center px-1 text-[15px]">
              {t('Official solutions (PDF)')}
            </a>
          )}
          {(!isMock || (variant === 'mini' && d.result)) && problem.solution && (
            <div className="mt-6">
              {showSolution || (done && kind === 'answer') || failed ? (
                <div className="card fade-in p-4">
                  <p className="footnote mb-1 font-semibold uppercase">{t('Solution')}</p>
                  <Rich text={problem.solution} />
                </div>
              ) : (
                <button onClick={() => setShowSolution(true)} className="link flex h-11 items-center px-1 text-[15px] active:opacity-50">
                  {done ? t('See the official solution') : t('I give up, show the solution')}
                </button>
              )}
            </div>
          )}
        </Split>
      </Page>
    </>
  )
}
