import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AREAS, PAPERS, TOTAL_DAYS } from './plan'
import { getDay } from './content'
import { BANK, BANK_BY_ID, EXAM, TOOLS, TOOLS_BY_ID, loadTools, toolsLoaded } from './data'
import { useAI } from './ai'
import { dayOf } from './dates'
import { getLang, setLang, t } from './i18n'
import { decode, encode } from './nav'
import { prediction, pace as paceOf } from './score'
import { keepPrevious, loadState, normalizeState, requestPersist, saveState, shareBackup } from './store'
import {
  BANK_GAPS, CHALLENGE_MASTER, FRESH, MINI_COUNT, PAPER_MASTER, PAPER_PASS, PROOF_PASS, REVIEW_GAPS, addDayToSrs, bestScore, currentProblem, miniDue as miniDueOf, miniEnd, mistakeKey, partStatus, pickMini,
  pickReplacement, problemAt, refKey,
} from './logic'
import { GearIcon, LifeIcon, PlanIcon, ProgressIcon, TodayIcon, TrainIcon, dayTitle } from './ui'
import { SKILLS_BY_ID } from './life/skills'
import { MIXES, advance, bumpStreak, cardQueue, newRound, nextIdea, pickMix, rateCard, rateIdea, recordAnswer, runFor, slotOf } from './life/engine'
import { TodayTab } from './screens/Today'
import { PlanScreen } from './screens/Plan'
import { ProgressTab } from './screens/Progress'
import { SettingsScreen } from './screens/Settings'
import { DayScreen } from './screens/Day'
import { ProblemScreen } from './screens/Problem'
import { MiniScreen, RedoScreen } from './screens/Mini'
import { CoachSheet } from './screens/Coach'
import { Celebration } from './screens/Celebration'
import { BankScreen, EMPTY_FILTERS, TrainTab } from './screens/Train'
import { MockProblemScreen, MockScreen, MockStartScreen, newMock } from './screens/Mock'
import { EMPTY_TOOL_FILTERS, ExamScreen, ToolScreen, ToolboxScreen } from './screens/Toolbox'
import { CardsScreen, CheatSheetScreen, EverydayScreen, IdeaScreen, LifeTab, QuizScreen, SkillScreen, SprintScreen } from './screens/Life'

const TABS = [
  ['today', 'Today', TodayIcon],
  ['train', 'Train', TrainIcon],
  ['life', 'Pocket', LifeIcon],
  ['progress', 'Progress', ProgressIcon],
]
const PROBLEM_SCREENS = ['part', 'review', 'redo', 'miniPart', 'bank', 'mockPart', 'quiz', 'sprint', 'cards', 'idea']

// The calendar day, kept current past midnight and when the app comes back from the background
function useToday() {
  const [day, setDay] = useState(() => dayOf(Date.now()))
  useEffect(() => {
    const check = () => setDay(dayOf(Date.now()))
    const timer = setInterval(check, 30_000)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [])
  return day
}

function TabBar({ tab, onTab }) {
  return (
    <nav className="tabbar lg:hidden" aria-label={t('Sections')}>
      <div className="mx-auto flex h-[54px] max-w-md">
        {TABS.map(([id, label, TabIcon]) => (
          <button key={id} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined} className="flex flex-1 flex-col items-center justify-center gap-0.5 active:opacity-60" style={{ color: tab === id ? 'var(--link)' : 'var(--label-2)' }}>
            <TabIcon className="h-[24px] w-[24px]" />
            <span className="text-[11px] font-medium">{t(label)}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

function Sidebar({ tab, top, onTab, onPlan, onSettings }) {
  const item = (active, onClick, Icon, label) => (
    <button key={label} onClick={onClick} aria-current={active ? 'page' : undefined} className="sidebar-item" data-active={active || undefined}>
      <Icon className="h-[22px] w-[22px]" />
      <span>{label}</span>
    </button>
  )
  return (
    <aside className="sidebar hidden lg:flex" aria-label={t('Sections')}>
      <div className="mb-4 flex items-center gap-2.5 px-3 pt-2">
        <img src={`${import.meta.env.BASE_URL}icon-180.png`} alt="" className="h-8 w-8 rounded-[8px]" />
        <span className="title3">QED</span>
      </div>
      {TABS.map(([id, label, Icon]) => item(tab === id && !['plan', 'settings'].includes(top?.name), () => onTab(id), Icon, t(label)))}
      <div className="my-2 h-px" style={{ background: 'var(--sep)' }} />
      {item(top?.name === 'plan', onPlan, PlanIcon, t('Plan'))}
      {item(top?.name === 'settings', onSettings, GearIcon, t('Settings'))}
    </aside>
  )
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [lang, setLangState] = useState(getLang)
  const today = useToday()
  const ai = useAI()
  const [nav, setNav] = useState(() => decode(location.hash))
  const navRef = useRef(nav)
  navRef.current = nav
  const [direction, setDirection] = useState('fade')
  const [coach, setCoach] = useState(null)
  const [celebration, setCelebration] = useState(null)
  const [trainFilters, setTrainFilters] = useState(EMPTY_FILTERS)
  const [toolFilters, setToolFilters] = useState(EMPTY_TOOL_FILTERS)
  const [toolsReady, setToolsReady] = useState(toolsLoaded)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    setSaveFailed(!saveState(state))
  }, [state])

  // The toolbox is its own chunk; fetch it after first paint
  useEffect(() => {
    loadTools()
      .then(() => setToolsReady(true))
      .catch(() => {})
  }, [])

  /* ---------- navigation: every screen has a URL ---------- */

  const { tab, stack } = nav
  const top = stack[stack.length - 1]

  useEffect(() => {
    // Rebuild the history for a deep link, so Back walks up through the parents instead of leaving the app
    const d = decode(location.hash)
    if (!history.state?.qed) {
      history.replaceState({ qed: 1, depth: 0 }, '', encode(d.tab, []))
      d.stack.forEach((_, i) => history.pushState({ qed: 1, depth: i + 1 }, '', encode(d.tab, d.stack.slice(0, i + 1))))
    }
    const onPop = () => {
      const next = decode(location.hash)
      setDirection(next.stack.length < navRef.current.stack.length ? 'pop' : next.stack.length > navRef.current.stack.length ? 'push' : 'fade')
      setNav(next)
      window.scrollTo(0, 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = (next, mode, how) => {
    const url = encode(next.tab, next.stack)
    if (how === 'push') history.pushState({ qed: 1, depth: next.stack.length }, '', url)
    else history.replaceState({ qed: 1, depth: next.stack.length }, '', url)
    setDirection(mode)
    setNav(next)
    window.scrollTo(0, 0)
  }
  const push = (screen) => go({ tab, stack: [...stack, screen] }, 'push', 'push')
  const replaceTop = (screen) => go({ tab, stack: [...stack.slice(0, -1), screen] }, 'push', 'replace')
  const pop = () => {
    if (!stack.length) return
    if (history.state?.qed && history.state.depth === stack.length) history.back()
    else go({ tab, stack: stack.slice(0, -1) }, 'pop', 'replace')
  }
  const switchTab = (id) => {
    if (id === tab && !stack.length) return window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
    go({ tab: id, stack: [] }, 'fade', stack.length ? 'push' : 'replace')
  }
  const openRoot = (screen) => go({ tab, stack: [screen] }, 'push', 'push')

  /* ---------- the plan ---------- */

  const { count, lastDay } = state.streak
  const streak = lastDay != null && lastDay >= today - 1 ? count : 0
  // No calendar: the next unfinished day is always open. One finished day per calendar day keeps the streak.
  const finishedToday = lastDay === today
  const current = Math.min(state.next, TOTAL_DAYS - 1)
  const doneCount = Object.keys(state.results).length

  // Work is kept until its day is passed, across midnight. Only the per-day allowance (tries, checks) starts fresh.
  const getWork = (index, part) => {
    const w = state.work[`${index}:${part}`]
    if (!w) return FRESH
    const e = { ...FRESH, ...w }
    if (state.results[index] || e.day === today || part === 'c' || part === 'paper' || part === 'done') return e
    return { ...e, tries: e.solved ? e.tries : 0 }
  }
  const updateWork = (index, part, f) =>
    setState((s) => {
      const key = `${index}:${part}`
      const old = s.work[key]
      let base = old ? { ...FRESH, ...old } : FRESH
      if (old && !s.results[index] && old.day !== today && part !== 'c') {
        // A new day: fresh tries; grades keep the day they were given on, so today's checks start at zero
        base = { ...base, tries: base.solved ? base.tries : 0, grades: base.grades.map((g) => (g.day == null ? { ...g, day: old.day } : g)) }
      }
      return { ...s, work: { ...s.work, [key]: { ...f(base), day: today } } }
    })

  const mini = miniDueOf(state)
  const pace = useMemo(() => paceOf(state, today), [state.examDate, state.results, today])

  // Problems you passed before warm-ups existed join the rotation once
  useEffect(() => {
    if (state.srs) return
    const srs = {}
    Object.entries(state.results).forEach(([i, r]) => addDayToSrs(srs, Number(i), state.work, r.day))
    setState((s) => ({ ...s, srs }))
  }, [state.srs])

  // Pick today's warm-up: a problem that is due, from the weakest area first (by the same numbers as Progress)
  useEffect(() => {
    if (!state.srs || state.reviews?.[today] !== undefined) return
    const areas = prediction(state).areas
    const due = Object.entries(state.srs)
      .filter(([, v]) => v.due <= today)
      .map(([key, v]) => {
        const [index, k] = key.split(':').map(Number)
        return { index, k, due: v.due, area: getDay(index).area }
      })
      .filter((x) => getDay(x.index).content?.problems[x.k])
      .sort((a, b) => (areas[a.area]?.points ?? 4.8) - (areas[b.area]?.points ?? 4.8) || a.due - b.due)
    setState((s) => ({ ...s, reviews: { ...s.reviews, [today]: due[0] ? { index: due[0].index, k: due[0].k, ...FRESH } : null } }))
  }, [state.srs, today])

  const updateReview = (f) =>
    setState((s) => {
      const old = s.reviews?.[today]
      if (!old) return s
      const next = f({ ...FRESH, ...old })
      const p = problemAt(old)
      let srs = s.srs
      if (partStatus(p, { ...FRESH, ...old }, today) === 'open' && partStatus(p, next, today) !== 'open') {
        const ok = partStatus(p, next, today) === 'ok'
        const box = ok ? (s.srs?.[refKey(old)]?.box || 0) + 1 : 0
        srs = { ...s.srs, [refKey(old)]: { box, due: today + (ok ? REVIEW_GAPS[Math.min(box, REVIEW_GAPS.length - 1)] : 1) } }
      }
      return { ...s, srs, reviews: { ...s.reviews, [today]: next } }
    })

  const addMistake = (ref, reason) =>
    setState((s) => ({
      ...s,
      mistakes: [...(s.mistakes || []).filter((m) => !(m.at === today && mistakeKey(m) === mistakeKey(ref))), ref.bank ? { bank: ref.bank, reason, at: today } : { index: ref.index, k: ref.k, reason, at: today }],
    }))
  const fixMistake = (ref) => setState((s) => ({ ...s, mistakes: (s.mistakes || []).map((m) => (mistakeKey(m) === mistakeKey(ref) ? { ...m, fixed: true } : m)) }))

  // Past problems: every attempt is kept. Below 8 points it comes back later; 5+ points crosses it off the mistake notebook.
  const updateBank = (id, f) => setState((s) => ({ ...s, bank: { ...s.bank, [id]: f({ attempts: [], ...s.bank?.[id] }) } }))
  const recordAttempt = (id, attempt) =>
    setState((s) => {
      const e = { attempts: [], ...s.bank?.[id] }
      const due = attempt.score >= 8 ? null : today + (attempt.score >= PROOF_PASS ? BANK_GAPS.mid : BANK_GAPS.low)
      const mistakes = attempt.score >= PROOF_PASS ? (s.mistakes || []).map((m) => (m.bank === id ? { ...m, fixed: true } : m)) : s.mistakes
      return { ...s, mistakes, bank: { ...s.bank, [id]: { ...e, attempts: [...e.attempts, attempt], timerAt: null, due } } }
    })

  const updateMock = (id, f) => setState((s) => ({ ...s, mocks: (s.mocks || []).map((m) => (m.id === id ? f(m) : m)) }))
  const gradeMock = (mock, i, g) => {
    updateMock(mock.id, (m) => ({ ...m, work: { ...m.work, [i]: { ...m.work?.[i], grades: [...(m.work?.[i]?.grades || []), g] } } }))
    recordAttempt(mock.ids[i], { ...g, at: Date.now(), mock: mock.id })
  }
  const updateMini = (n, i, f) =>
    setState((s) => {
      const m = s.minis[n]
      return { ...s, minis: { ...s.minis, [n]: { ...m, work: { ...m.work, [i]: f({ ...FRESH, ...m.work?.[i] }) } } } }
    })

  // Timed papers hand themselves in when the clock runs out, so nothing says "0:00:00 left" forever
  useEffect(() => {
    const run = () => {
      const now = Date.now()
      setState((s) => {
        let changed = false
        const mocks = s.mocks.map((m) => {
          const end = m.startedAt + m.minutes * 6e4
          if (m.handedAt || now < end) return m
          changed = true
          return { ...m, handedAt: end }
        })
        const minis = { ...s.minis }
        Object.entries(s.minis).forEach(([n, m]) => {
          if (!m.handedAt && m.refs.length && now >= miniEnd(m)) {
            changed = true
            minis[n] = { ...m, handedAt: miniEnd(m) }
          }
        })
        return changed ? { ...s, mocks, minis } : s
      })
    }
    run()
    const timer = setInterval(run, 15_000)
    return () => clearInterval(timer)
  }, [])

  // Ask the browser to keep our storage once there is progress worth keeping
  useEffect(() => {
    if (doneCount >= 1) requestPersist()
  }, [doneCount >= 1])

  // Finish a day as soon as everything in it is done. Every day is open, so this is any day you've worked on,
  // not only the next one; the plan then continues at the first day that isn't finished yet.
  useEffect(() => {
    if (doneCount >= TOTAL_DAYS) return
    const touched = [...new Set([current, ...Object.keys(state.work).map((key) => Number(key.split(':')[0]))])].filter((i) => i >= 0 && i < TOTAL_DAYS && !state.results[i])
    for (const index of touched) {
      const d = getDay(index)
      let status = 'passed'
      let score
      if (d.kind === 'paper') {
        const scores = [0, 1, 2, 3].map((i) => bestScore(getWork(index, `p${i}`)))
        if (scores.some((x) => x < 0)) continue
        const total = scores.reduce((x, y) => x + y, 0)
        const max = 4 * 8
        status = total >= PAPER_MASTER * max ? 'mastered' : total >= PAPER_PASS * max ? 'passed' : 'done'
        score = `${total}/${max}`
      } else if (d.kind === 'learn' && d.content) {
        if (!d.content.problems.every((_, i) => partStatus(currentProblem(index, `p${i}`, getWork(index, `p${i}`)), getWork(index, `p${i}`), today) === 'ok')) continue
      } else if (!getWork(index, 'done').solved) continue

      const nextCount = lastDay === today ? count : lastDay === today - 1 ? count + 1 : 1
      setState((s) => {
        const results = { ...s.results, [index]: { day: today, status, score } }
        let next = 0
        while (results[next]) next++
        const srs = { ...(s.srs || {}) }
        addDayToSrs(srs, index, s.work, today)
        return { ...s, srs, next, streak: { count: nextCount, lastDay: today }, best: Math.max(s.best || 0, nextCount), results }
      })
      setCelebration({ status, kind: d.kind, from: streak, to: nextCount !== streak ? nextCount : null, title: dayTitle(d), score })
      return
    }
  }, [state.work])

  // Mastering a challenge, today or on any earlier learning day
  useEffect(() => {
    Object.entries(state.results).forEach(([index, r]) => {
      if (r.status !== 'passed') return
      const d = getDay(Number(index))
      if (d.kind !== 'learn' || !d.content?.challenge) return
      if (bestScore(getWork(Number(index), 'c')) >= CHALLENGE_MASTER) {
        setState((s) => ({ ...s, results: { ...s.results, [index]: { ...s.results[index], status: 'mastered' } } }))
        setCelebration({ status: 'mastered', kind: 'learn', title: dayTitle(d) })
      }
    })
  }, [state.work])

  const replaceState = (raw, reason) => {
    keepPrevious(state, reason)
    setState(normalizeState(raw))
    setCoach(null)
    go({ tab: 'today', stack: [] }, 'fade', 'replace')
  }
  const backup = async () => {
    const at = await shareBackup(state)
    if (at) setState((s) => ({ ...s, lastBackup: at }))
    return at
  }
  const changeLang = (l) => {
    setLang(l)
    setLangState(l)
  }

  const openDay = (index) => push({ name: 'day', index })
  const openBank = (id) => push({ name: 'bank', id })
  const openTool = (id) => push({ name: 'tool', id })
  const openMock = (id) => push({ name: 'mock', id })
  const openSettings = () => (top?.name === 'settings' ? null : push({ name: 'settings' }))
  const openPlan = () => (top?.name === 'plan' ? null : push({ name: 'plan' }))
  const openToolbox = (area) => {
    setToolFilters({ ...EMPTY_TOOL_FILTERS, area: area || 'all' })
    push({ name: 'toolbox' })
  }
  const coachFor = (problem, grade) => setCoach({ problem, grade })

  // GWF papers come from the bank when it has them: the German statement, the marking scheme and the solution
  const paperProblem = (d, i) => {
    const b = d.paper[0] === 'GWF' && BANK.find((p) => p.year === d.paper[1] && p.n === i + 1)
    if (b) return { type: 'proof', q: b.qDe || b.q, rubric: b.rubric.length ? b.rubric : undefined, solution: b.solution, pitfalls: b.pitfalls, answers: b.answer ? [b.answer] : undefined }
    return { type: 'proof', q: t('Problem {n} of the ÖMO {paper} {year}. The statement is on the official paper: photograph it together with your solution.', { n: i + 1, paper: t(PAPERS[d.paper[0]].name), year: d.paper[1] }) }
  }

  // Where "Next" goes after a problem is done
  const nextAfter = (index, part) => {
    const d = getDay(index)
    const toPart = (p, label) => ({ label, onClick: () => replaceTop({ name: 'part', index, part: p }) })
    if (d.kind === 'paper') {
      const open = [0, 1, 2, 3].find((i) => `p${i}` !== part && bestScore(getWork(index, `p${i}`)) < 0)
      return open != null ? toPart(`p${open}`, t('Next: Problem {n}', { n: open + 1 })) : { label: t('Back to the Paper'), onClick: pop }
    }
    if (part === 'c' || !d.content) return { label: t('Back to the Day'), onClick: pop }
    const open = d.content.problems.map((_, i) => `p${i}`).find((p) => p !== part && partStatus(currentProblem(index, p, getWork(index, p)), getWork(index, p), today) !== 'ok')
    if (!open) return { label: state.results[index] ? t('Back to the Day') : t('Finish the Day'), onClick: pop }
    const prob = currentProblem(index, open, getWork(index, open))
    return toPart(open, prob.type === 'answer' ? t('Next: Problem {n}', { n: Number(open.slice(1)) + 1 }) : t('Next: the Proof'))
  }

  /* ---------- everyday maths ---------- */

  const setLife = (f) => setState((s) => ({ ...s, life: f(s.life) }))
  const startQuiz = (id) => setLife((l) => ({ ...l, [slotOf(id)]: MIXES[id] ? pickMix(l, today, id) : newRound(id) }))
  // An unfinished round carries on where it stopped; a finished one starts fresh
  const openQuiz = (id) => {
    const r = runFor(state.life, id)
    if (!r || r.done) startQuiz(id)
    push({ name: 'quiz', id })
  }
  const openSkill = (id) => push({ name: 'skill', id })
  const ideaNext = nextIdea(state.life, BANK)
  const openIdea = () => ideaNext && push({ name: 'idea', id: ideaNext.id })
  const finishSprint = (score) => setLife((l) => (score > 0 ? bumpStreak({ ...l, best: Math.max(l.best, score) }, today) : l))

  // A deep link to a round that isn't on this device yet
  useEffect(() => {
    if (top?.name === 'quiz' && (MIXES[top.id] || SKILLS_BY_ID[top.id]) && !runFor(state.life, top.id)) startQuiz(top.id)
  }, [top?.name, top?.id])

  const backLabel = stack.length > 1 ? t('Back') : t(TABS.find((x) => x[0] === tab)[1])

  /* ---------- the screen on top ---------- */

  const screenValid = useCallback(
    (s) => {
      switch (s.name) {
        case 'day':
          return s.index >= 0 && s.index < TOTAL_DAYS
        case 'part': {
          if (s.index < 0 || s.index >= TOTAL_DAYS) return false
          const d = getDay(s.index)
          if (d.kind === 'paper') return /^p[0-3]$/.test(s.part)
          if (!d.content) return false
          return s.part === 'c' ? !!d.content.challenge && !!state.results[s.index] : !!d.content.problems[Number(s.part.slice(1))]
        }
        case 'review':
          return !!state.reviews?.[today]
        case 'redo':
          return s.ref.index < TOTAL_DAYS && !!problemAt(s.ref)
        case 'mini':
          return s.n >= 1 && s.n <= MINI_COUNT && (!!state.minis?.[s.n] || s.n === mini)
        case 'miniPart':
          return !!state.minis?.[s.n]?.refs?.[s.i]
        case 'bank':
          return !!BANK_BY_ID[s.id]
        case 'mock':
          return !!state.mocks.find((m) => m.id === s.id)
        case 'mockPart':
          return !!state.mocks.find((m) => m.id === s.id && s.i < m.ids.length)
        case 'tool':
          return !toolsReady || !!TOOLS_BY_ID[s.id]
        case 'exam':
          return !toolsReady || !!EXAM.find((e) => e.id === s.id)
        case 'skill':
          return !!SKILLS_BY_ID[s.id]
        case 'quiz':
          return !!MIXES[s.id] || !!SKILLS_BY_ID[s.id]
        case 'idea':
          return !!BANK_BY_ID[s.id]
        default:
          return true
      }
    },
    [state, today, current, mini, toolsReady],
  )

  // A screen whose subject is gone (a mock was cancelled, the warm-up belonged to yesterday): fall back to its parent
  useEffect(() => {
    const valid = stack.findIndex((s) => !screenValid(s))
    if (valid >= 0) go({ tab, stack: stack.slice(0, valid) }, 'pop', 'replace')
  }, [stack, screenValid])

  let page = null
  if (top && !screenValid(top)) page = null
  else if (top?.name === 'day') {
    page = (
      <DayScreen
        d={{ ...getDay(top.index) }}
        state={state}
        getWork={getWork}
        current={current}
        today={today}
        ai={ai}
        backLabel={backLabel}
        onBack={pop}
        onToolbox={openToolbox}
        onPart={(index, part) => push({ name: 'part', index, part })}
        onOpenDay={openDay}
        onStartPaper={() => updateWork(top.index, 'paper', (w) => ({ ...w, startedAt: Date.now() }))}
        onMarkDone={() => updateWork(top.index, 'done', (w) => ({ ...w, solved: true }))}
        onCoach={(topic) => setCoach({ topic })}
      />
    )
  } else if (top?.name === 'part') {
    const d = { ...getDay(top.index), result: state.results[top.index] }
    const entry = getWork(top.index, top.part)
    const problem = d.kind === 'paper' ? paperProblem(d, Number(top.part.slice(1))) : top.part === 'c' ? d.content.challenge : currentProblem(top.index, top.part, entry)
    const ref = top.part === 'c' ? { index: top.index, k: 'c' } : entry.swaps?.[entry.swaps.length - 1] || { index: top.index, k: Number(top.part.slice(1)) }
    page = (
      <ProblemScreen
        key={`${top.index}:${top.part}:${entry.swaps?.length || 0}`}
        onNewProblem={() =>
          updateWork(top.index, top.part, (w) => {
            const next = pickReplacement(top.index, top.part, w)
            // If every problem of this kind has been used, start the same one again with fresh tries
            return { ...w, tries: 0, solved: false, grades: [], mistake: undefined, swaps: next ? [...(w.swaps || []), next] : w.swaps || [] }
          })
        }
        onMistake={d.kind === 'learn' ? (why) => addMistake(ref, why) : undefined}
        d={d}
        part={top.part}
        problem={problem}
        entry={entry}
        update={(f) => updateWork(top.index, top.part, f)}
        isCurrent={top.index === current || !state.results[top.index]}
        ai={ai}
        today={today}
        onBack={pop}
        onCoach={coachFor}
        failNote={t('Read the solution, then try a new problem of the same kind.')}
        next={nextAfter(top.index, top.part)}
        draftKey={`${top.index}:${top.part}:${entry.swaps?.length || 0}`}
      />
    )
  } else if (top?.name === 'review') {
    const r = state.reviews[today]
    const rd = getDay(r.index)
    page = (
      <ProblemScreen
        d={rd}
        part={`p${r.k}`}
        variant="review"
        problem={problemAt(r)}
        entry={{ ...FRESH, ...r }}
        update={updateReview}
        onMistake={(why) => addMistake(r, why)}
        isCurrent
        ai={ai}
        today={today}
        onBack={pop}
        onCoach={coachFor}
        title={t('Warm-up')}
        eyebrow={`${t('From day {n}', { n: rd.day })} · ${dayTitle(rd)}`}
        backLabel={backLabel}
        failNote={t('This one comes back tomorrow.')}
        draftKey={`review:${today}`}
        next={{ label: t('Done'), onClick: pop }}
      />
    )
  } else if (top?.name === 'redo') {
    page = <RedoScreen refObj={top.ref} ai={ai} today={today} onBack={pop} onCoach={coachFor} onFixed={() => fixMistake(top.ref)} backLabel={backLabel} />
  } else if (top?.name === 'mini') {
    page = (
      <MiniScreen
        n={top.n}
        mini={state.minis?.[top.n]}
        backLabel={backLabel}
        onBack={pop}
        onStart={() => setState((s) => ({ ...s, minis: { ...s.minis, [top.n]: { refs: pickMini(s), startedAt: Date.now(), handedAt: null, work: {} } } }))}
        onPart={(i) => push({ name: 'miniPart', n: top.n, i })}
      />
    )
  } else if (top?.name === 'miniPart') {
    const m = state.minis[top.n]
    const ref = m.refs[top.i]
    const md = getDay(ref.index)
    const finished = m.refs.every((_, i) => m.work?.[i]?.grades?.length)
    const open = m.refs.findIndex((_, i) => i !== top.i && !m.work?.[i]?.grades?.length)
    page = (
      <ProblemScreen
        key={`mini:${top.n}:${top.i}`}
        d={{ ...md, result: finished ? { status: 'done' } : undefined }}
        part="c"
        variant="mini"
        problem={problemAt(ref)}
        entry={{ ...FRESH, ...m.work?.[top.i] }}
        update={(f) => updateMini(top.n, top.i, f)}
        onMistake={(why) => addMistake(ref, why)}
        isCurrent
        ai={ai}
        today={today}
        onBack={pop}
        onCoach={coachFor}
        title={t('Problem {n}', { n: top.i + 1 })}
        eyebrow={`${t('Mini-mock {n}', { n: top.n })} · ${AREAS[md.area].name}`}
        backLabel={t('Mini-mock')}
        draftKey={`mini:${top.n}:${top.i}`}
        next={open >= 0 ? { label: t('Next: Problem {n}', { n: open + 1 }), onClick: () => replaceTop({ name: 'miniPart', n: top.n, i: open }) } : { label: t('See the Result'), onClick: pop }}
      />
    )
  } else if (top?.name === 'settings') {
    page = <SettingsScreen state={state} setState={setState} replaceState={replaceState} ai={ai} lang={lang} onLang={changeLang} onBack={pop} backLabel={backLabel} onBackup={backup} />
  } else if (top?.name === 'plan') {
    page = <PlanScreen state={state} current={current} onOpenDay={openDay} onBack={pop} backLabel={backLabel} />
  } else if (top?.name === 'bank') {
    const id = top.id
    page = (
      <BankScreen
        key={id}
        p={BANK_BY_ID[id]}
        entry={state.bank?.[id]}
        results={state.results}
        ai={ai}
        backLabel={backLabel}
        onBack={pop}
        onCoach={coachFor}
        onAttempt={(a) => recordAttempt(id, a)}
        onTimer={(on) => updateBank(id, (e) => ({ ...e, timerAt: on ? Date.now() : null }))}
        onMistake={(why) => addMistake({ bank: id }, why)}
        onOpenTool={openTool}
      />
    )
  } else if (top?.name === 'mockStart') {
    page = (
      <MockStartScreen
        state={state}
        backLabel={backLabel}
        onBack={pop}
        onStart={(choice) => {
          const m = newMock(state, choice)
          setState((s) => ({ ...s, mocks: [...(s.mocks || []), m] }))
          replaceTop({ name: 'mock', id: m.id })
        }}
      />
    )
  } else if (top?.name === 'mock') {
    const mock = state.mocks.find((m) => m.id === top.id)
    page = (
      <MockScreen
        mock={mock}
        target={state.target || 16}
        backLabel={backLabel}
        onBack={pop}
        onPart={(i) => push({ name: 'mockPart', id: mock.id, i })}
        onHandIn={() => updateMock(mock.id, (m) => ({ ...m, handedAt: Date.now() }))}
        onCancel={() => {
          pop()
          setState((s) => ({ ...s, mocks: s.mocks.filter((m) => m.id !== mock.id) }))
        }}
      />
    )
  } else if (top?.name === 'mockPart') {
    const mock = state.mocks.find((m) => m.id === top.id)
    page = (
      <MockProblemScreen
        key={`${mock.id}:${top.i}`}
        mock={mock}
        i={top.i}
        ai={ai}
        onBack={pop}
        onNext={(i) => replaceTop({ name: 'mockPart', id: mock.id, i })}
        onCoach={coachFor}
        onOpenTool={openTool}
        onGrade={(g) => gradeMock(mock, top.i, g)}
        onMistake={(why) => {
          updateMock(mock.id, (m) => ({ ...m, work: { ...m.work, [top.i]: { ...m.work?.[top.i], mistake: why } } }))
          addMistake({ bank: mock.ids[top.i] }, why)
        }}
      />
    )
  } else if (top?.name === 'tool' || top?.name === 'exam') {
    const tool = top.name === 'tool' && TOOLS_BY_ID[top.id]
    const exam = top.name === 'exam' && EXAM.find((e) => e.id === top.id)
    page = tool ? (
      <ToolScreen tool={tool} state={state} backLabel={backLabel} onBack={pop} onOpenDay={openDay} onOpenBank={openBank} />
    ) : exam ? (
      <ExamScreen item={exam} backLabel={backLabel} onBack={pop} />
    ) : (
      <div className="flex min-h-[60dvh] items-center justify-center" aria-label={t('Loading')}>
        <span className="spinner spinner-dark" />
      </div>
    )
  } else if (top?.name === 'toolbox') {
    page = <ToolboxScreen filters={toolFilters} setFilters={setToolFilters} onOpenTool={openTool} onOpenExam={(id) => push({ name: 'exam', id })} onBack={pop} backLabel={backLabel} />
  } else if (top?.name === 'skill') {
    const id = top.id
    page = (
      <SkillScreen
        skill={SKILLS_BY_ID[id]}
        entry={state.life.skills[id]}
        backLabel={backLabel}
        onBack={pop}
        onPractise={() => openQuiz(id)}
        onRead={() => setLife((l) => ({ ...l, skills: { ...l.skills, [id]: { h: '', n: 0, last: null, ...l.skills[id], read: true } } }))}
      />
    )
  } else if (top?.name === 'quiz') {
    const id = top.id
    page = (
      <QuizScreen
        id={id}
        life={state.life}
        today={today}
        backLabel={backLabel}
        onBack={pop}
        onAnswer={(skillId, ok) => setLife((l) => recordAnswer(l, id, skillId, ok, today))}
        onNext={() => setLife((l) => advance(l, id, today))}
        onAgain={() => startQuiz(id)}
        onOpenSkill={openSkill}
        onOpenBank={openBank}
      />
    )
  } else if (top?.name === 'sprint') {
    page = <SprintScreen best={state.life.best} backLabel={backLabel} onBack={pop} onFinish={finishSprint} />
  } else if (top?.name === 'cheats') {
    page = <CheatSheetScreen backLabel={backLabel} onBack={pop} onOpenSkill={openSkill} />
  } else if (top?.name === 'everyday') {
    page = <EverydayScreen life={state.life} today={today} backLabel={backLabel} onBack={pop} onOpenSkill={openSkill} onQuiz={openQuiz} />
  } else if (top?.name === 'cards') {
    page = (
      <CardsScreen
        life={state.life}
        today={today}
        tools={toolsReady ? TOOLS : []}
        backLabel={backLabel}
        onBack={pop}
        onRate={(id, knew) => setLife((l) => rateCard(l, id, knew, today))}
        onFinish={() => setLife((l) => bumpStreak(l, today))}
        onOpenTool={openTool}
      />
    )
  } else if (top?.name === 'idea') {
    const id = top.id
    page = (
      <IdeaScreen
        key={id}
        p={BANK_BY_ID[id]}
        entry={state.life.ideas[id]}
        backLabel={backLabel}
        onBack={pop}
        onRate={(r) => setLife((l) => bumpStreak(rateIdea(l, id, r, today), today))}
        onNext={() => {
          const n = nextIdea(state.life, BANK, id)
          if (n) replaceTop({ name: 'idea', id: n.id })
        }}
        onOpenBank={openBank}
      />
    )
  } else if (tab === 'life') {
    page = (
      <LifeTab
        life={state.life}
        today={today}
        cardsDue={toolsReady ? cardQueue(state.life, TOOLS, today).length : null}
        idea={ideaNext}
        onOpenSkill={openSkill}
        onQuiz={openQuiz}
        onSprint={() => push({ name: 'sprint' })}
        onCheats={() => push({ name: 'cheats' })}
        onCards={() => push({ name: 'cards' })}
        onIdea={openIdea}
        onEveryday={() => push({ name: 'everyday' })}
      />
    )
  } else if (tab === 'train') {
    page = <TrainTab state={state} today={today} filters={trainFilters} setFilters={setTrainFilters} onOpenBank={openBank} onMockStart={() => push({ name: 'mockStart' })} onOpenMock={openMock} onToolbox={() => openToolbox('all')} />
  } else if (tab === 'progress') {
    page = (
      <ProgressTab
        state={state}
        today={today}
        current={current}
        onOpenDay={openDay}
        onRedo={(ref) => push({ name: 'redo', ref: { index: ref.index, k: ref.k } })}
        onMini={(n) => push({ name: 'mini', n })}
        onOpenBank={openBank}
        onOpenTool={openTool}
        onOpenMock={openMock}
      />
    )
  } else {
    page = (
      <TodayTab
        state={state}
        today={today}
        current={current}
        streak={streak}
        finishedToday={finishedToday}
        mini={mini}
        pace={pace}
        onOpenDay={openDay}
        onPlan={openPlan}
        onSettings={openSettings}
        onReview={() => push({ name: 'review' })}
        onMini={(n) => push({ name: 'mini', n })}
        onOpenMock={openMock}
        onTrain={() => switchTab('train')}
        onMockStart={() => push({ name: 'mockStart' })}
        onToolbox={openToolbox}
        onBackup={backup}
      />
    )
  }

  const screenKey = top ? JSON.stringify(top) : tab
  const animation = direction === 'push' ? 'push-in' : direction === 'pop' ? 'pop-in' : 'fade-in'

  return (
    <div key={lang} className="app-root">
      <Sidebar tab={tab} top={top} onTab={switchTab} onPlan={() => (top?.name === 'plan' ? null : openRoot({ name: 'plan' }))} onSettings={() => (top?.name === 'settings' ? null : openRoot({ name: 'settings' }))} />
      <main className="app-main">
        {saveFailed && (
          <div className="mx-auto max-w-md px-4 pt-2 lg:max-w-2xl" role="alert">
            <p className="footnote rounded-xl px-3 py-2" style={{ background: 'var(--fill)', color: 'var(--red)' }}>
              {t('This browser isn’t saving right now. Save a backup in Settings.')}
            </p>
          </div>
        )}
        <div key={screenKey} className={animation}>
          {page}
        </div>
      </main>
      {!PROBLEM_SCREENS.includes(top?.name) && <TabBar tab={tab} onTab={switchTab} />}
      {coach && <CoachSheet problem={coach.problem} topic={coach.topic} grade={coach.grade} ai={ai} onClose={() => setCoach(null)} />}
      {celebration && <Celebration {...celebration} onDone={() => setCelebration(null)} />}
    </div>
  )
}
