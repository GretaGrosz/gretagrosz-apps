import { useEffect, useMemo, useState } from 'react'
import { DAY_COUNT, dictionary, isLoaded, loadLanguages, placementWords, wordByKey, wordsForDay } from './lexicon'
import { dueKeys, gradeAll, knownCount } from './srs'
import { newListId, planFor } from './lists'
import { clearSession, useDark, useSaved, useSessionState, useToday } from './store'
import { STRINGS, UiContext, initialUi, saveUi } from './i18n'
import { themeFor } from './theme'
import Setup from './screens/Setup'
import Home from './screens/Home'
import Flashcards from './screens/Flashcards'
import Quiz from './screens/Quiz'
import { LevelUp, PlacementResult, Result, passMark } from './screens/Result'
import { ListHome, ListNew } from './screens/Lists'
import Year from './screens/Year'
import { record } from './year'

const REVIEWS_IN_TEST = 10 // due reviews mixed into the daily test
const REVIEW_SESSION = 20
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const EMPTY_COURSE = { day: 0, passed: null, last: null, cards: null }

export default function App() {
  const [state, setState] = useSaved()
  const today = useToday()
  const dark = useDark()
  const [ui, setUi] = useState(initialUi)
  const [route, setRoute] = useSessionState('deca-route', () => ({ screen: 'home', day: today }))
  const [levelUp, setLevelUp] = useState(null)
  const [, setLoadTick] = useState(0)
  const [loadFailed, setLoadFailed] = useState(false)

  const t = STRINGS[ui]
  const from = state.from
  const lang = state.lang

  // UI language: shared with the website through localStorage 'lang'
  const changeUi = (next) => {
    setUi(next)
    saveUi(next)
  }
  useEffect(() => {
    document.documentElement.lang = ui
    const onStorage = (e) => e.key === 'lang' && (e.newValue === 'de' || e.newValue === 'en') && setUi(e.newValue)
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [ui])

  // A test or card deck left open in this tab yesterday doesn't come back today
  useEffect(() => {
    if (route.day != null && route.day !== today && route.screen !== 'home') setRoute({ screen: 'home', day: today })
  }, [])

  const go = (r) => setRoute({ day: today, ...r })
  // Every screen starts at the top
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.screen, route.listId, route.id])
  const home = () => go({ screen: 'home' })

  const lists = state.lists || []
  const list = route.listId ? lists.find((l) => l.id === route.listId) : null
  const needed = [from, lang, route.from, route.lang, list?.from, list?.lang].filter(Boolean)
  const ready = isLoaded(...needed)
  const loadNeeded = () => {
    setLoadFailed(false)
    loadLanguages(...needed).then(
      () => setLoadTick((n) => n + 1),
      () => setLoadFailed(true), // offline and this language was never downloaded
    )
  }
  useEffect(() => {
    if (!ready) loadNeeded()
  }, [needed.join(), ready])

  // Streak: one for all your studying; a missed day resets it
  const { count, lastDay } = state.streak
  const streak = lastDay != null && lastDay >= today - 1 ? count : 0
  const theme = themeFor(streak, dark)

  const course = (lang && state.course[lang]) || EMPTY_COURSE
  const srsMap = (lang && state.srs[lang]) || {}
  const view = useMemo(() => {
    if (!lang || !isLoaded(from, lang)) return null
    const set = wordsForDay(course.day, from, lang)
    const own = new Set(set.words.map((w) => w.key))
    const due = dueKeys(srsMap, today).filter((k) => !own.has(k))
    const passedToday = course.passed === today
    return {
      set,
      dayNumber: course.day + 1,
      passedToday,
      cardsDone: course.cards === today,
      known: knownCount(srsMap),
      dueCount: due.length,
      inTest: due.slice(0, REVIEWS_IN_TEST),
      extraDue: due.length - Math.min(due.length, REVIEWS_IN_TEST),
      due,
    }
  }, [lang, from, course, srsMap, today, ready])

  const updateList = (id, fn) => setState((s) => ({ ...s, lists: (s.lists || []).map((l) => (l.id === id ? fn(l) : l)) }))

  const startCards = (ctx, words, f = from, l = lang) => {
    clearSession('deca-c:')
    go({ screen: 'cards', id: uid(), ctx, words, from: f, lang: l, listId: ctx.listId })
  }
  const startQuiz = (ctx, items, f = from, l = lang) => {
    clearSession('deca-q:')
    go({ screen: 'quiz', id: uid(), ctx, items: shuffle(items), from: f, lang: l, listId: ctx.listId })
  }

  /* ----- the course (10 words a day) ----- */
  const courseTestItems = () => [...view.set.words, ...view.inTest.map((k) => wordByKey(k, from, lang)).filter(Boolean)]
  const courseActions = {
    onLearn: () => startCards({ type: 'course', day: course.day }, view.set.words),
    onTest: () => startQuiz({ type: 'course' }, courseTestItems()),
    onReview: () => startQuiz({ type: 'review' }, (view.passedToday ? view.due : view.due.slice(REVIEWS_IN_TEST)).slice(0, REVIEW_SESSION).map((k) => wordByKey(k, from, lang)).filter(Boolean)),
    onPractise: () => startQuiz({ type: 'practice' }, wordsForDay(course.last ?? Math.max(0, course.day - 1), from, lang).words),
  }

  // First pass of the day keeps the streak; returns the new count, or null if today already counted
  const streakAfterPass = () => (lastDay === today ? null : lastDay === today - 1 ? count + 1 : 1)

  const finishQuiz = (results) => {
    const ctx = route.ctx
    const qLang = route.lang
    const score = results.filter((r) => r.correct).length
    const passed = score >= passMark(results.length)
    const showResult = (mode) => go({ screen: 'result', results, mode, ctx, from: route.from, lang: qLang, listId: ctx.listId })

    if (ctx.type === 'practice' || ctx.type === 'listPractice') return showResult('practice')

    // The year grid: what was tested today, in which language, and how it went
    const testList = ctx.type === 'list' ? lists.find((x) => x.id === ctx.listId) : null
    const entry = {
      k: ctx.type === 'list' ? 'l' : ctx.type === 'review' ? 'r' : 'c',
      lang: qLang,
      from: route.from,
      n: ctx.type === 'list' ? testList?.name || '' : ctx.type === 'review' ? null : course.day % DAY_COUNT,
      p: ctx.type === 'review' ? null : passed ? 1 : 0,
      w: results.map((r) => [r.front, r.answers[0], r.correct ? 1 : 0]),
    }
    const streakThatDay = ctx.type !== 'review' && passed ? streakAfterPass() ?? streak : streak
    setState((s) => ({ ...s, history: record(s.history, today, entry, streakThatDay) }))

    if (ctx.type === 'review' || ctx.type === 'course') {
      setState((s) => ({ ...s, srs: { ...s.srs, [qLang]: gradeAll(s.srs[qLang] || {}, results, today) } }))
      if (ctx.type === 'review') return showResult('review')
    }

    if (ctx.type === 'list') {
      const l = lists.find((x) => x.id === ctx.listId)
      if (!l) return home()
      const cap = today < l.test ? l.test - 1 : null
      updateList(l.id, (x) => ({ ...x, srs: gradeAll(x.srs || {}, results, today, cap), passed: passed ? today : x.passed }))
    }

    if (!passed) return showResult('test')

    const next = streakAfterPass()
    setState((s) => {
      let out = s
      if (ctx.type === 'course') {
        const c = s.course[s.lang] || EMPTY_COURSE
        out = { ...out, course: { ...out.course, [s.lang]: { day: c.day + 1, passed: today, last: c.day, cards: null } } }
      }
      if (next != null) out = { ...out, streak: { count: next, lastDay: today } }
      return out
    })
    if (next != null) {
      setLevelUp({ from: streak, to: next, results, lang: qLang })
      return ctx.type === 'list' ? go({ screen: 'list', listId: ctx.listId }) : home()
    }
    showResult('test')
  }

  /* ----- your own lists ----- */
  const listWord = (l, i) => ({ key: String(i), front: l.words[i].front, answers: l.words[i].answers })
  const assignToday = (l, indices) =>
    updateList(l.id, (x) => {
      const intro = { ...(x.intro || {}) }
      indices.forEach((i) => intro[i] == null && (intro[i] = today))
      return { ...x, intro }
    })
  const listActions = (l) => {
    const plan = planFor(l, today)
    return {
      onLearn: () => {
        assignToday(l, plan.newToday)
        startCards({ type: 'list', listId: l.id }, plan.newToday.map((i) => listWord(l, i)), l.from, l.lang)
      },
      onTest: () => {
        assignToday(l, plan.newToday)
        startQuiz({ type: 'list', listId: l.id }, [...plan.newToday, ...plan.due].map((i) => listWord(l, i)), l.from, l.lang)
      },
      onPractise: () => {
        const studied = l.words.map((_, i) => i).filter((i) => l.intro?.[i] != null)
        const pool = studied.length ? studied : l.words.map((_, i) => i)
        startQuiz({ type: 'listPractice', listId: l.id }, shuffle(pool).slice(0, REVIEW_SESSION).map((i) => listWord(l, i)), l.from, l.lang)
      },
      onDelete: () => {
        setState((s) => ({ ...s, lists: (s.lists || []).filter((x) => x.id !== l.id) }))
        clearSession('deca-q:')
        clearSession('deca-c:')
        home()
      },
      onDate: (d) => updateList(l.id, (x) => ({ ...x, test: d })),
    }
  }
  const listDict = useMemo(() => {
    const l = route.ctx?.listId ? lists.find((x) => x.id === route.ctx.listId) : null
    if (!l || !isLoaded(l.lang)) return null
    return [...dictionary(l.lang), ...l.words.flatMap((w) => w.answers)]
  }, [route.ctx?.listId, lists, ready])

  /* ----- screens ----- */
  let page = null
  const firstRun = !lang
  const placementBack = (r) => go(r.returnTo === 'first' ? { screen: 'home', draft: r.draft } : { screen: 'settings', draft: r.draft })
  const findLevel = (returnTo) => (draft) =>
    loadLanguages(draft.from, draft.lang).then(() =>
      go({ screen: 'placement', id: uid(), items: placementWords(draft.from, draft.lang), from: draft.from, lang: draft.lang, returnTo, draft }),
    )
  const saveSetup = (choice, stay) => {
    if (stay) return setState((s) => ({ ...s, ...choice }))
    setState((s) => {
      const c = s.course[choice.lang] || EMPTY_COURSE
      const course = choice.startDay != null ? { ...c, day: choice.startDay, cards: null } : c
      return { ...s, from: choice.from, lang: choice.lang, course: { ...s.course, [choice.lang]: course } }
    })
    home()
  }

  if (!ready && loadFailed && route.screen !== 'settings') {
    page = (
      <main className="page page-fill items-center justify-center text-center">
        <h1 className="title2">{t.offline}</h1>
        <div className="mt-6 grid w-full max-w-xs gap-3">
          <button onClick={loadNeeded} className="btn btn-filled">
            {t.tryAgain}
          </button>
          <button onClick={() => go({ screen: 'settings' })} className="btn btn-tinted">
            {t.settings}
          </button>
        </div>
      </main>
    )
  } else if (!ready && route.screen !== 'settings') {
    page = <main className="page" />
  } else if (route.screen === 'placement') {
    page = (
      <Quiz
        id={route.id}
        items={route.items}
        from={route.from}
        lang={route.lang}
        dict={dictionary(route.lang)}
        title={t.findLevel}
        sound={false}
        onCancel={() => placementBack(route)}
        onFinish={(results) => go({ ...route, screen: 'placementResult', results })}
      />
    )
  } else if (route.screen === 'placementResult') {
    const existing = state.course[route.lang]
    page = (
      <PlacementResult
        results={route.results}
        currentDay={existing && route.returnTo !== 'first' ? existing.day : null}
        backLabel={route.returnTo === 'first' ? t.back : t.settings}
        onBack={() => placementBack(route)}
        onStart={(startDay) => saveSetup({ from: route.from, lang: route.lang, startDay: startDay ?? (route.returnTo === 'first' ? 0 : null) })}
      />
    )
  } else if (firstRun) {
    page = <Setup key="first" firstRun state={state} ui={ui} draft={route.draft} onUi={changeUi} onDone={saveSetup} onFindLevel={findLevel('first')} />
  } else if (route.screen === 'settings') {
    page = <Setup key="settings" state={state} ui={ui} draft={route.draft} onUi={changeUi} onDone={saveSetup} onCancel={home} onFindLevel={findLevel('settings')} />
  } else if (route.screen === 'cards' && route.words?.length) {
    const ctx = route.ctx
    const l = ctx.listId ? list : null
    page = (
      <Flashcards
        id={route.id}
        words={route.words}
        from={route.from}
        lang={route.lang}
        sound={state.sound !== false}
        backLabel={l ? l.name : t.today}
        onBack={() => (l ? go({ screen: 'list', listId: l.id }) : home())}
        onFinished={() => {
          if (ctx.type === 'course' && ctx.day === course.day) setState((s) => ({ ...s, course: { ...s.course, [s.lang]: { ...(s.course[s.lang] || EMPTY_COURSE), cards: today } } }))
          if (l && ctx.type === 'list') updateList(l.id, (x) => ({ ...x, cards: today }))
        }}
        onTest={() => (l ? listActions(l).onTest() : ctx.type === 'course' ? courseActions.onTest() : startQuiz(ctx, route.words, route.from, route.lang))}
      />
    )
  } else if (route.screen === 'quiz' && route.items?.length) {
    const ctx = route.ctx
    const isList = ctx.type === 'list' || ctx.type === 'listPractice'
    if (isList && !list) page = null
    else
      page = (
        <Quiz
          id={route.id}
          items={route.items}
          from={route.from}
          lang={route.lang}
          dict={isList ? listDict || dictionary(route.lang) : dictionary(route.lang)}
          title={isList ? list.name : ctx.type === 'review' ? t.reviewTitle : ctx.type === 'practice' ? t.practice : t.test}
          sound={state.sound !== false}
          onCancel={() => (isList ? go({ screen: 'list', listId: list.id }) : home())}
          onFinish={finishQuiz}
        />
      )
  } else if (route.screen === 'result' && route.results?.length) {
    const ctx = route.ctx
    const isList = !!ctx.listId
    if (isList && !list) page = null
    else {
      const back = () => (isList ? go({ screen: 'list', listId: list.id }) : home())
      page = (
        <Result
          results={route.results}
          mode={route.mode}
          lang={route.lang}
          backLabel={isList ? list.name : t.today}
          onHome={back}
          onRetry={() => (isList ? listActions(list).onTest() : courseActions.onTest())}
          onCards={() => startCards(ctx, route.results.map((r) => ({ key: r.key, front: r.front, answers: r.answers })), route.from, route.lang)}
        />
      )
    }
  } else if (route.screen === 'list' && list) {
    page = <ListHome list={list} today={today} onBack={home} {...listActions(list)} />
  } else if (route.screen === 'year' && !firstRun) {
    page = <Year state={state} lang={lang} today={today} dark={dark} onBack={home} />
  } else if (route.screen === 'listNew') {
    page = (
      <ListNew
        defaults={{ from, lang }}
        today={today}
        onCancel={home}
        onCreate={(data) => {
          const id = newListId()
          setState((s) => ({ ...s, lists: [...(s.lists || []), { id, ...data, created: today, intro: {}, srs: {}, passed: null, cards: null }] }))
          go({ screen: 'list', listId: id })
        }}
      />
    )
  }

  if (!page && ready && !firstRun) {
    page = view && (
      <Home
        from={from}
        lang={lang}
        streak={streak}
        view={view}
        lists={lists}
        today={today}
        {...courseActions}
        onSettings={() => go({ screen: 'settings' })}
        onYear={() => go({ screen: 'year' })}
        onList={(id) => go({ screen: 'list', listId: id })}
        onNewList={() => go({ screen: 'listNew' })}
      />
    )
  }

  return (
    <UiContext.Provider value={{ ui, t }}>
      <div className="app" style={theme}>
        {page}
        {levelUp && <LevelUp {...levelUp} onDone={() => setLevelUp(null)} />}
      </div>
    </UiContext.Provider>
  )
}

