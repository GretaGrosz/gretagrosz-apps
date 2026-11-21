// The start flow (first visit, or "retake" from You). Blank's idea in one go: share what you do, or get an idea and
// a plan, then Blank on the Home Screen and a friend.
//
//   welcome  the axolotl (about 2 s, tap to skip) + HU / DE / EN, set from the phone's language
//   share    Share your hobby: a photo + what it is (5 words) + "I'm 16 or older, or my parents agree" → Post
//            or "I don't have a hobby yet, give me ideas"
//   Path A (post):  sign in (passkey; the post is kept) → posted ("First post", others see "New on Blank")
//                   → home → where → the feed
//   Path B (ideas): quiz (3 quick questions: what's fun, what you want from it, budget) → ideas (3 picks that fit
//                   + "Show me 3 others") → tap one and you're in the app on its plan. No "when", no sign-in here.
//   home     Add Blank to your Home Screen → notifications (asked here once; App.jsx asks once more, install.js)
//   where    School / Club / Skip + Invite a friend
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { locale, useT } from '../i18n'
import { COST_LABEL, IDEAS, ideaTitle } from '../data'
import { materialsFor, planForName, resourcesFor, stepsFor } from '../guides'
import { CheckCircle, Icon, IdeaPhoto, Logo, Segmented, Spinner } from '../components/ui'
import { LoginSheet, PasskeySheet } from '../components/AccountSheet'
import { Avatar, PostCard } from '../components/Social'
import { useAccount } from '../account'
import { call, isIOS } from '../buddy'
import { api, mediaOf, mediaPath, shareInvite, uploadMedia, useAuthImage } from '../social'
import { processImage, savePhoto } from '../media'
import { setReminder } from '../reminders'
import { turnOnAccountPush } from '../notify'
import { asks, canInstall, canPrompt, countAsk, MAX_ASKS, promptInstall } from '../install'
import WelcomeIntro from '../onboarding/WelcomeIntro'

const ALLOWED_COST = { free: ['free'], cheap: ['free', 'cheap'], any: ['free', 'cheap', 'some'] }

// "I don't have a hobby yet": three one-tap questions before the ideas, so the 3 picks fit the person
const QUIZ = [
  {
    key: 'fun',
    q: 'What sounds most fun?',
    options: [
      ['Making things with my hands', ['crafts', 'art', 'wood']],
      ['Cooking and baking', ['cooking', 'garden']],
      ['Music', ['music']],
      ['Moving and being outside', ['fitness', 'outdoors']],
      ['Computers and games', ['tech', 'learn']],
      ['Taking photos and writing', ['photo', 'writing']],
    ],
  },
  {
    key: 'want',
    q: 'What do you want from it?',
    options: [
      ['To relax after school', ['art', 'writing', 'garden', 'crafts']],
      ['To make something I can show', ['crafts', 'photo', 'cooking', 'wood']],
      ['To get fitter', ['fitness', 'outdoors']],
      ['To learn something new', ['learn', 'tech', 'music']],
    ],
  },
  {
    key: 'budget',
    q: 'How much can you spend on it?',
    options: [
      ['Nothing', 'free'],
      ['A little, under 10 €', 'cheap'],
      ['Doesn’t matter', 'any'],
    ],
  },
]
// Categories from the first two answers, the ones both answers point to first
const quizInterests = (fun = [], want = []) => {
  const both = fun.filter((c) => want.includes(c))
  return [...new Set([...both, ...fun, ...want])]
}

// Three starter ideas: one per chosen interest first, cheapest and gear-free first, then anything that fits the budget
export function pickStarters(interests = [], budget, skip = []) {
  const fits = IDEAS.filter((i) => ALLOWED_COST[budget || 'any'].includes(i.cost) && !skip.includes(i.title)).sort((a, b) => b.noGear - a.noGear)
  const picks = []
  for (let round = 0; picks.length < 3 && round < 3; round++) {
    for (const c of interests) {
      const idea = fits.filter((i) => i.category === c && !picks.includes(i))[0]
      if (idea && picks.length < 3) picks.push(idea)
    }
  }
  for (const i of fits) if (picks.length < 3 && !picks.includes(i)) picks.push(i)
  return picks
}

// Starting a project from one of the starter ideas: the right plan, in your language, sized to your level
export function startIdea(actions, idea, prefs, lang) {
  const { guide, category } = planForName(idea.title, idea.category)
  return actions.addProject({
    title: ideaTitle(idea, lang),
    category,
    guideKey: guide.key,
    steps: stepsFor(guide, prefs?.level, lang),
    resources: resourcesFor(guide, lang),
  })
}

// About 5 words is the idea (the counter shows it), but nobody is stopped from writing more. 80 = the server's limit
const wordCount = (v) => v.trim().split(/\s+/).filter(Boolean).length

// Where you are in the flow survives a reload (iPhone reloads a tab that sat in the background)
const PROGRESS = 'blank-start'
const readProgress = () => {
  try {
    return JSON.parse(sessionStorage.getItem(PROGRESS) || 'null')
  } catch {
    return null
  }
}
const writeProgress = (v) => {
  try {
    if (v) sessionStorage.setItem(PROGRESS, JSON.stringify(v))
    else sessionStorage.removeItem(PROGRESS)
  } catch {}
}

// The 16+ tick: the same promise as the rules before a first post (components/Social.jsx)
function AgeTick({ checked, onChange }) {
  const { t } = useT()
  return (
    <label className="flex min-h-[44px] cursor-pointer items-start gap-3 px-1 text-[15px] leading-snug">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-spark" />
      <span>{t('I’m 16 or older, or my parents agree')}</span>
    </label>
  )
}

function TopBar({ onBack, right }) {
  const { t } = useT()
  return (
    <div className="flex h-12 items-center justify-between gap-3">
      {onBack ? (
        <button onClick={onBack} className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-spark-ink active:opacity-60" aria-label={t('Back')}>
          <Icon name="back" className="h-6 w-6" strokeWidth={2.4} />
        </button>
      ) : (
        <Logo word />
      )}
      {right}
    </div>
  )
}

// The newest public posts with a photo (one request, for the desktop wall)
let photoPosts = null
function usePhotoPosts() {
  const [posts, setPosts] = useState([])
  useEffect(() => {
    let alive = true
    photoPosts ||= call('/social/feed?scope=public')
      .then((r) => (r.posts || []).filter((p) => mediaOf(p).length))
      .catch(() => ((photoPosts = null), []))
    photoPosts.then((list) => alive && setPosts(list))
    return () => {
      alive = false
    }
  }, [])
  return posts
}

// Bigger screens: a wall of what people just made, next to the form, so the page isn't one lonely column
function WallTile({ post, i }) {
  const url = useAuthImage(mediaOf(post)[0] ? mediaPath(post, 0) : null, null)
  const tilt = [-2.5, 1.8, 1.2, -1.6, -1, 2.2][i % 6]
  return (
    <li className="animate-rise" style={{ animationDelay: `${150 + i * 70}ms` }}>
      <div className="overflow-hidden rounded-[18px] bg-card shadow-soft transition duration-300 hover:rotate-0 hover:scale-[1.02]" style={{ transform: `rotate(${tilt}deg)` }}>
        <div className="bg-mist" style={{ aspectRatio: i % 3 === 0 ? '4 / 5' : '1 / 1' }}>
          {url && <img src={url} alt="" decoding="async" className="h-full w-full object-cover" />}
        </div>
        <div className="px-3 py-2.5">
          <p className="truncate text-[14px] font-semibold leading-tight">{post.project || post.text}</p>
          <p className="truncate text-[12px] text-sub">@{post.author.username}</p>
        </div>
      </div>
    </li>
  )
}
function PostWall() {
  const { t } = useT()
  const posts = usePhotoPosts().slice(0, 6)
  if (posts.length < 2) return null
  const cols = [posts.filter((_, i) => i % 2 === 0), posts.filter((_, i) => i % 2 === 1)]
  return (
    <section className="relative hidden h-[640px] max-h-[78vh] overflow-hidden md:block" aria-label={t('Posts on Blank')}>
      <p className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-spark-ink">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spark opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-spark" />
        </span>
        {t('Just posted on Blank')}
      </p>
      <div className="grid grid-cols-2 gap-5">
        {cols.map((col, c) => (
          <ul key={c} className={`space-y-5 ${c ? 'pt-12' : ''}`}>
            {col.map((p, i) => (
              <WallTile key={p.id} post={p} i={i * 2 + c} />
            ))}
          </ul>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-page to-transparent" />
    </section>
  )
}

export default function Onboarding() {
  const { data, actions } = useStore()
  const { t, lang, setLang } = useT()
  const navigate = useNavigate()
  const { account } = useAccount()
  const old = data.me.prefs
  const saved = useRef(readProgress()).current
  const [screen, setScreen] = useState(saved?.screen || (old ? 'share' : 'welcome'))
  const [path, setPath] = useState(saved?.path || null) // 'post' | 'plan'
  const [pid, setPid] = useState(saved?.pid || null)
  const [post, setPost] = useState(null)
  useEffect(() => {
    writeProgress(['welcome', 'share', 'quiz', 'ideas'].includes(screen) ? null : { screen, path, pid })
  }, [screen, path, pid])
  const project = data.projects.find((p) => p.id === pid)
  // A screen that needs a project that isn't there (reload after a reset): start again
  useEffect(() => {
    if (['plan', 'posted'].includes(screen) && !project) setScreen('share')
  }, [screen, project])

  const cancel = () => {
    writeProgress(null)
    actions.completeOnboarding(old)
    navigate('/', { replace: true })
  }

  // Sign-in, then whatever was waiting for it (the post, or saving the plan)
  const [signIn, setSignIn] = useState(null) // { title, sub, then }
  const [login, setLogin] = useState(false)
  const pending = useRef(null)
  useEffect(() => {
    if (account && pending.current) {
      const run = pending.current
      pending.current = null
      run(account)
    }
  }, [account])
  const withAccount = (sheet, run) => {
    if (account) return run(account)
    pending.current = run
    setSignIn(sheet)
  }

  // ---------- share ----------
  const [photo, setPhoto] = useState(null) // { blob, ratio, url }
  const [what, setWhat] = useState('')
  const [age, setAge] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const fileInput = useRef(null)
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      const { blob, ratio } = await processImage(file)
      if (photo) URL.revokeObjectURL(photo.url)
      setPhoto({ blob, ratio, url: URL.createObjectURL(blob) })
    } catch {
      setError(t('That photo didn’t work. Try another one.'))
    }
  }
  const canPost = !!photo && wordCount(what) > 0 && age && !busy

  const publish = async (acc) => {
    setBusy(true)
    setError(null)
    const a = api(acc.token)
    let made = null
    try {
      await a.acceptRules() // they ticked the box on the share screen
      const title = what.trim()
      // Kept on the device too: a project with this photo as its first update
      const id = pid || actions.addProject({ title, category: 'other', headStart: false })
      setPid(id)
      if (!pid) actions.addEntry(id, { photo: await savePhoto(photo.blob), ratio: photo.ratio })
      made = (await a.post({ kind: 'update', project: title, category: 'other', text: '', visibility: 'public', lang, media: [{ ratio: photo.ratio }] })).post
      await uploadMedia(acc.token, made.id, 0, photo.blob)
      const r = await a.publish(made.id)
      setPost(r.post)
      setPath('post')
      setScreen('posted')
    } catch (e) {
      if (made) a.deletePost(made.id).catch(() => {})
      setError(e?.code === 'offline' ? t('You’re offline. Your post is still here, try again in a moment.') : t('Posting didn’t work. Your post is still here, try again.'))
    } finally {
      setBusy(false)
    }
  }
  const submitPost = (e) => {
    e.preventDefault()
    if (!canPost) return
    withAccount({ title: t('Sign in to post'), sub: t('Your post is kept. It goes up right after.') }, publish)
  }

  // ---------- ideas ----------
  const [answers, setAnswers] = useState([]) // one per QUIZ question, in order
  const interests = quizInterests(answers[0], answers[1])
  const budget = answers[2] || 'any'
  const answer = (v) => {
    const next = [...answers, v]
    setAnswers(next)
    if (next.length === QUIZ.length) {
      setSeen([])
      setScreen('ideas')
    }
  }
  const quizBack = () => (answers.length ? setAnswers(answers.slice(0, -1)) : setScreen('share'))
  const [seen, setSeen] = useState([])
  const starters = screen === 'ideas' ? pickStarters(interests, budget, seen) : []
  const nextSeen = [...seen, ...starters.map((i) => i.title)]
  const more = () => setSeen(pickStarters(interests, budget, nextSeen).length ? nextSeen : [])

  // Tap an idea: the project is made and they're in the app on its plan, nothing else asked
  const startNow = (x) => {
    const prefs = { ...(old || {}), interests, budget }
    const id = startIdea(actions, x, prefs, lang)
    actions.completeOnboarding(prefs)
    writeProgress(null)
    navigate(`/project/${id}`, { replace: true })
  }
  // The step id is only known once the project is in the store: fill it in on the plan screen
  useEffect(() => {
    if (!project || !project.stepPlan || project.stepPlan.stepId) return
    const next = project.milestones.find((m) => !m.done)
    if (next) actions.updateProject(project.id, { stepPlan: { ...project.stepPlan, stepId: next.id } })
  }, [project, actions])

  // ---------- home screen ----------
  const installable = canInstall() && asks() < MAX_ASKS
  const [notifyDone, setNotifyDone] = useState(false)
  const nextStep = project?.milestones.find((m) => !m.done)
  const afterHome = () => setScreen('where')
  // The push permission comes from this tap: likes on your post (A), or the reminder on your day (B)
  const turnOn = async () => {
    try {
      if (path === 'plan') {
        if (project?.stepPlan?.at && nextStep) {
          await setReminder({ project: project.id, step: nextStep.text, when: project.stepPlan.at, lang })
          actions.updateProject(project.id, { stepPlan: { ...project.stepPlan, stepId: nextStep.id, remind: 'on' } })
        }
      } else if (account) await turnOnAccountPush(account.token, lang)
      setNotifyDone(true)
      setTimeout(afterHome, 700)
    } catch (e) {
      if (path === 'plan' && project?.stepPlan) {
        const remind = e?.code === 'install' ? 'install' : e?.code === 'denied' ? 'denied' : 'off'
        actions.updateProject(project.id, { stepPlan: { ...project.stepPlan, remind } })
      }
      afterHome()
    }
  }
  const goHome = () => {
    // Nothing to ask on this phone (already on the Home Screen with push decided, or no notifications at all)
    const pushAsk = typeof Notification !== 'undefined' && Notification.permission === 'default'
    if (installable) countAsk()
    setScreen(installable || pushAsk ? 'home' : 'where')
  }

  // ---------- where ----------
  const [where, setWhere] = useState(data.me.prefs?.where || null)
  const [invited, setInvited] = useState(null)
  const invite = async () => {
    if (!account) return
    const r = await shareInvite(account.token, account.username, t('I’m on Blank. Start something with me?'))
    setInvited(r)
  }
  const doneWhere = () => {
    actions.completeOnboarding({ ...(old || {}), where })
    writeProgress(null)
    navigate(path === 'plan' && pid ? `/project/${pid}` : '/ideas', { replace: true })
  }

  // ---------- plan: others doing it ----------
  const [others, setOthers] = useState(null)
  useEffect(() => {
    if (screen !== 'plan' || !account || !project) return
    let alive = true
    api(account.token)
      .samePlans(project.guideKey ? [project.guideKey] : [], [project.title.toLowerCase()])
      .then((r) => alive && setOthers(r.users || []))
      .catch(() => alive && setOthers([]))
    return () => {
      alive = false
    }
  }, [screen, account, project])

  // ---------- welcome ----------
  const [touchedLang, setTouchedLang] = useState(false)
  const [introDone, setIntroDone] = useState(false)
  const pickLang = (v) => {
    setTouchedLang(true)
    setLang(v)
  }
  const langSwitch = (
    <div className="w-[150px]">
      <Segmented
        value={lang}
        onChange={pickLang}
        label={t('Language')}
        options={[
          ['hu', 'HU'],
          ['de', 'DE'],
          ['en', 'EN'],
        ]}
      />
    </div>
  )

  const time = (ms) => new Intl.DateTimeFormat(locale(lang), { hour: '2-digit', minute: '2-digit' }).format(ms)
  const dayName = (ms) => {
    const w = new Intl.DateTimeFormat(locale(lang), { weekday: 'long' }).format(ms)
    return w.charAt(0).toUpperCase() + w.slice(1)
  }

  // Phone: one column top to bottom. Bigger screens: centred on the page, not stuck to the top with the button far below
  const shell = (children, { wide = false } = {}) => (
    <main className="min-h-[100dvh] bg-page">
      <div
        className={`mx-auto flex min-h-[100dvh] flex-col px-4 pb-[max(24px,env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+12px)] md:justify-center md:px-8 md:py-12 ${wide ? 'max-w-lg md:max-w-[1080px]' : 'max-w-lg md:max-w-[520px]'}`}
      >
        {children}
      </div>
    </main>
  )

  // ===== welcome =====
  if (screen === 'welcome') {
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full">
          <WelcomeIntro
            onDone={() => {
              setIntroDone(true)
              if (!touchedLang) setScreen('share')
            }}
          />
        </div>
        <div className="mt-8 flex flex-col items-center gap-4">
          {langSwitch}
          {/* Changed the language: stay so they see it switch, then go on with one tap */}
          {touchedLang && (
            <button onClick={() => setScreen('share')} className="btn-primary btn-lg w-[240px] animate-rise">
              {introDone ? t('Let’s go') : t('Next')}
            </button>
          )}
        </div>
      </div>,
    )
  }

  // ===== share =====
  if (screen === 'share') {
    return shell(
      <div className="flex flex-1 flex-col md:flex-none md:grid md:grid-cols-[minmax(0,440px)_minmax(0,1fr)] md:items-center md:gap-14 lg:gap-20">
       <div className="flex flex-1 flex-col md:flex-none">
        <TopBar
          right={
            old ? (
              <button onClick={cancel} className="h-11 rounded-full px-3 text-[17px] text-spark-ink active:opacity-60">
                {t('Cancel')}
              </button>
            ) : !account ? (
              <button onClick={() => setLogin(true)} className="h-11 rounded-full px-3 text-[17px] text-spark-ink active:opacity-60">
                {t('Log in')}
              </button>
            ) : null
          }
        />
        <form onSubmit={submitPost} className="mt-4 animate-rise">
          <h1 className="large-title">{t('Share your hobby')}</h1>
          <p className="mt-2 text-[17px] leading-snug text-sub">{t('Show what you make or do. Someone might start because of you.')}</p>

          <input ref={fileInput} type="file" accept="image/*" className="sr-only" onChange={pickPhoto} tabIndex={-1} aria-hidden="true" />
          {photo ? (
            <div className="relative mt-6 overflow-hidden rounded-[20px] bg-mist shadow-soft">
              <img src={photo.url} alt="" className="max-h-[46vh] w-full object-cover" style={{ aspectRatio: `1 / ${Math.min(photo.ratio || 1, 1.25)}` }} />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="absolute bottom-3 right-3 flex h-9 items-center gap-1.5 rounded-full bg-black/55 px-3.5 text-[15px] font-semibold text-white backdrop-blur active:opacity-70"
              >
                <Icon name="camera" className="h-4 w-4" strokeWidth={2.2} />
                {t('Change')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-6 flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed border-ink/15 bg-card text-spark-ink transition active:scale-[0.99] active:bg-mist"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-spark-soft">
                <Icon name="plus" className="h-7 w-7" strokeWidth={2.4} />
              </span>
              <span className="text-[17px] font-semibold">{t('Add photo')}</span>
            </button>
          )}

          <label className="mt-5 block">
            <span className="mb-1.5 flex items-baseline justify-between px-1 text-[15px] font-medium text-sub">
              <span>{t('What is it?')}</span>
              <span className="tabular-nums text-[13px]">{t('{n} of 5 words', { n: wordCount(what) })}</span>
            </span>
            <input
              className="input"
              value={what}
              onChange={(e) => setWhat(e.target.value.replace(/^\s+/, ''))}
              placeholder={t('e.g. my first crochet bag')}
              maxLength={80}
              enterKeyHint="done"
            />
          </label>

          <div className="mt-4">
            <AgeTick checked={age} onChange={setAge} />
            <p className="mt-1 px-1 pl-9 text-[13px] leading-snug text-sub">{t('Post things you made. Be kind. Posts get checked.')}</p>
          </div>

          {error && (
            <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
              {error}
            </p>
          )}
          <button disabled={!canPost} className="btn-primary btn-lg mt-5 w-full">
            {busy ? <Spinner className="h-5 w-5" /> : t('Post')}
          </button>
        </form>
        <button
          onClick={() => {
            setAnswers([])
            setScreen('quiz')
          }}
          className="mt-2 h-12 w-full rounded-full px-4 text-[15px] text-spark-ink active:opacity-60">
          {t('I don’t have a hobby yet, give me ideas')}
        </button>
       </div>
        <PostWall />
        {signIn && <PasskeySheet title={signIn.title} sub={signIn.sub} onClose={() => setSignIn(null)} onDone={() => setSignIn(null)} />}
        {login && <LoginSheet onClose={() => setLogin(false)} />}
      </div>,
      { wide: true },
    )
  }

  // ===== posted (A) =====
  if (screen === 'posted') {
    return shell(
      <>
        <div className="mt-6 animate-rise text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-spark-soft text-spark-ink animate-pop">
            <Icon name="sparkle" className="h-7 w-7" strokeWidth={2.2} />
          </span>
          <h1 className="large-title mt-4">{t('You’re on Blank')}</h1>
          <p className="mx-auto mt-2 max-w-[320px] text-[17px] leading-snug text-sub">
            {post?.status === 'review' ? t('A quick check runs, then everyone sees it as new on Blank.') : t('Everyone sees your post as new on Blank.')}
          </p>
        </div>
        {post && (
          <ul className="mt-6">
            <PostCard post={post} onChange={setPost} onRemove={() => setScreen('share')} />
          </ul>
        )}
        <div className="flex-1 md:hidden" />
        <button onClick={goHome} className="btn-primary btn-lg mt-6 w-full">
          {t('Next')}
        </button>
      </>,
    )
  }

  // ===== ideas (B) =====
  if (screen === 'ideas') {
    return shell(
      <>
        <TopBar
          onBack={() => {
            setAnswers(answers.slice(0, -1))
            setScreen('quiz')
          }}
        />
        <div className="mt-2 animate-rise">
          <h1 className="large-title">{t('Pick one to start')}</h1>
          <p className="mt-2 text-[17px] leading-snug text-sub">{t('Small, real, and you can start this week.')}</p>
          <ul className="mt-6 space-y-3">
            {starters.map((x, i) => {
              const { guide } = planForName(x.title, x.category)
              return (
                <li key={x.title + seen.length} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                  <button
                    onClick={() => startNow(x)}
                    className="surface flex w-full items-center gap-4 p-3 pr-4 text-left transition active:scale-[0.98]"
                  >
                    <IdeaPhoto guide={guide} className="h-[72px] w-[72px] shrink-0 rounded-[14px]" eager />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-semibold leading-snug">{ideaTitle(x, lang)}</span>
                      <span className="mt-0.5 block text-[15px] text-sub">{t(COST_LABEL[x.cost])}</span>
                    </span>
                    <span className="btn-primary min-h-[36px] shrink-0 px-4 text-[15px]">{t('Start')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <button onClick={more} className="mx-auto mt-4 flex h-12 items-center gap-2 rounded-full px-4 text-[17px] text-spark-ink active:opacity-60">
            <Icon name="replay" className="h-[18px] w-[18px]" strokeWidth={2.4} />
            {t('Show me 3 others')}
          </button>
        </div>
      </>,
    )
  }

  // ===== quiz (B): 3 questions, one tap each =====
  if (screen === 'quiz') {
    const n = Math.min(answers.length, QUIZ.length - 1)
    const q = QUIZ[n]
    return shell(
      <>
        <TopBar onBack={quizBack} right={<span className="text-[15px] text-sub">{t('{n} of {total}', { n: n + 1, total: QUIZ.length })}</span>} />
        <div key={q.key} className="mt-2 animate-rise">
          <h1 className="large-title">{t(q.q)}</h1>
          <div className="surface mt-6 divide-y divide-line/15 overflow-hidden">
            {q.options.map(([label, value]) => (
              <button key={label} onClick={() => answer(value)} className="row min-h-[56px] w-full text-left text-[17px] active:bg-mist">
                <span className="flex-1">{t(label)}</span>
                <Icon name="chevron" className="h-4 w-4 text-sub" />
              </button>
            ))}
          </div>
        </div>
      </>,
    )
  }

  // ===== the plan (B) =====
  if (screen === 'plan' && project) {
    const materials = project.materials?.length ? project.materials : project.guideKey ? materialsFor(project.guideKey, lang) : []
    return shell(
      <>
        <div className="mt-4 animate-rise">
          <p className="text-[15px] font-semibold text-spark-ink">{t('Your plan')}</p>
          <h1 className="large-title mt-1">{project.title}</h1>
          {project.stepPlan?.at > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[15px] text-sub">
              <Icon name="bell" className="h-4 w-4" />
              {t('Start: {when}', { when: `${dayName(project.stepPlan.at)} ${time(project.stepPlan.at)}` })}
            </p>
          )}
        </div>
        {nextStep && (
          <section className="surface mt-6 animate-rise p-4" style={{ animationDelay: '60ms' }}>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Step 1')}</p>
            <div className="mt-2 flex items-start gap-3">
              <CheckCircle done={false} />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold leading-snug">{nextStep.text}</p>
                {nextStep.how && <p className="mt-1 text-[15px] leading-snug text-sub">{nextStep.how}</p>}
              </div>
            </div>
          </section>
        )}
        {materials.length > 0 && (
          <section className="surface mt-3 animate-rise p-4" style={{ animationDelay: '120ms' }}>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-sub">{t('What you need')}</p>
            <ul className="mt-2 space-y-1.5">
              {materials.slice(0, 5).map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-[15px] leading-snug">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-spark" />
                  <span>{typeof m === 'string' ? m : m.name || m.text || m.title}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="surface mt-3 animate-rise p-4" style={{ animationDelay: '180ms' }}>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-sub">{t('Others doing it')}</p>
          {others == null ? (
            <Spinner className="mt-3 h-5 w-5 text-sub" />
          ) : others.length ? (
            <div className="mt-2 flex items-center gap-3">
              <div className="flex -space-x-2">
                {others.slice(0, 4).map((u) => (
                  <span key={u.username} className="rounded-full ring-2 ring-card">
                    <Avatar user={u} size={32} />
                  </span>
                ))}
              </div>
              <p className="flex-1 text-[15px] leading-snug">{t('{n} people on Blank are doing this too', { n: others.length })}</p>
            </div>
          ) : (
            <p className="mt-2 text-[15px] leading-snug">{t('You’re the first on Blank. Post step 1 and others can start because of you.')}</p>
          )}
        </section>
        <div className="flex-1 md:hidden" />
        <button onClick={goHome} className="btn-primary btn-lg mt-6 w-full">
          {t('Next')}
        </button>
      </>,
    )
  }

  // ===== Home Screen + notifications =====
  if (screen === 'home') {
    const iosSteps = installable && isIOS && !canPrompt()
    const why =
      path === 'plan'
        ? t('Then the axolotl can remind you on your day. In the browser, reminders can’t reach you.')
        : t('Then you hear when someone likes your post or starts because of you. In the browser, that can’t reach you.')
    return shell(
      <>
        <div className="flex flex-1 flex-col items-center justify-center text-center animate-rise">
          <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width="84" height="84" className="h-[84px] w-[84px] rounded-[20px] shadow-soft" />
          <h1 className="mt-5 text-[28px] font-bold leading-tight tracking-tight">{installable ? t('Add Blank to your Home Screen') : t('Turn on notifications')}</h1>
          <p className="mt-2 max-w-[330px] text-[17px] leading-snug text-sub">
            {installable ? why : path === 'plan' ? t('So the axolotl can remind you on your day.') : t('So you hear when someone likes your post.')}
          </p>
          {iosSteps && (
            <ol className="mt-6 w-full divide-y divide-line/15 overflow-hidden rounded-[14px] bg-card text-left shadow-soft">
              <li className="row min-h-[54px] text-[17px]">
                <span className="w-5 text-center font-semibold text-ink">1</span>
                <span className="flex-1">{t('Tap Share')}</span>
                <Icon name="share" className="h-6 w-6 text-[#007AFF]" strokeWidth={2} />
              </li>
              <li className="row min-h-[54px] text-[17px]">
                <span className="w-5 text-center font-semibold text-ink">2</span>
                <span className="flex-1">{t('Add to Home Screen')}</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border-2 border-ink">
                  <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
                </span>
              </li>
              <li className="row min-h-[54px] text-[17px]">
                <span className="w-5 text-center font-semibold text-ink">3</span>
                <span className="flex-1">{t('Open Blank from there and log in with your passkey')}</span>
              </li>
            </ol>
          )}
        </div>
        {iosSteps ? (
          <button onClick={afterHome} className="btn-primary btn-lg mt-6 w-full">
            {t('Done')}
          </button>
        ) : installable ? (
          <button
            onClick={async () => {
              await promptInstall()
              turnOn()
            }}
            className="btn-primary btn-lg mt-6 w-full"
          >
            {t('Add to Home Screen')}
          </button>
        ) : (
          <button onClick={turnOn} disabled={notifyDone} className="btn-primary btn-lg mt-6 w-full">
            {notifyDone ? <Icon name="check" className="h-5 w-5" strokeWidth={2.6} /> : t('Turn on')}
          </button>
        )}
        <button onClick={afterHome} className="mt-2 h-12 w-full rounded-full text-[17px] text-spark-ink active:opacity-60">
          {t('Not now')}
        </button>
      </>,
    )
  }

  // ===== a friend (and, after a post, where you do it) =====
  // After a plan you haven't started yet, "where do you do this?" makes no sense: only the friend is asked then.
  if (screen === 'where') {
    const PLACES = [
      ['school', 'School', 'today'],
      ['club', 'Club', 'friends'],
    ]
    const inviteText = invited === 'copied' ? t('Link copied. Send it to them.') : invited === 'shared' ? t('Sent. You’ll be friends as soon as they join.') : null
    const go = (
      <button onClick={doneWhere} className="btn-primary btn-lg mt-8 w-full">
        {path === 'plan' ? t('See my plan') : t('Go to the feed')}
      </button>
    )
    if (path === 'plan') {
      return shell(
        <>
          <div className="flex flex-1 flex-col items-center justify-center text-center animate-rise md:flex-none">
            <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-spark-soft text-spark-ink">
              <Icon name="friends" className="h-10 w-10" strokeWidth={1.8} />
            </span>
            <h1 className="large-title mt-6">{t('Start it with a friend?')}</h1>
            <p className="mx-auto mt-3 max-w-[340px] text-[17px] leading-snug text-sub">{inviteText || t('Hobbies stick when you do them with someone.')}</p>
          </div>
          {account && (
            <button onClick={invite} className="btn-primary btn-lg mt-8 w-full">
              {invited ? t('Invite someone else') : t('Invite a friend')}
            </button>
          )}
          <button onClick={doneWhere} className="mt-2 h-12 w-full rounded-full text-[17px] text-spark-ink active:opacity-60">
            {invited ? t('See my plan') : t('Not now')}
          </button>
        </>,
      )
    }
    return shell(
      <>
        <div className="animate-rise pt-6 md:pt-0">
          <h1 className="large-title">{t('Where do you do this?')}</h1>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {PLACES.map(([v, label, icon]) => {
              const on = where === v
              return (
                <button
                  key={v}
                  onClick={() => setWhere(on ? null : v)}
                  aria-pressed={on}
                  className={`flex h-[112px] flex-col items-start justify-between rounded-[20px] p-4 text-left transition active:scale-[0.97] ${on ? 'bg-spark text-white shadow-soft' : 'bg-card text-ink shadow-soft'}`}
                >
                  <Icon name={icon} className={`h-7 w-7 ${on ? 'text-white' : 'text-spark-ink'}`} strokeWidth={2} />
                  <span className="text-[19px] font-semibold">{t(label)}</span>
                </button>
              )
            })}
          </div>
          <button onClick={() => setWhere('skip')} className={`mt-2 h-11 px-1 text-[15px] active:opacity-60 ${where === 'skip' ? 'font-semibold text-ink' : 'text-sub'}`}>
            {t('Somewhere else / skip')}
          </button>

          {account && (
            <div className="mt-6 flex items-center gap-4 rounded-[20px] bg-spark-soft p-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold leading-snug text-ink">{t('Invite a friend')}</span>
                <span className="mt-0.5 block text-[15px] leading-snug text-sub">{inviteText || t('Hobbies stick when you do them with someone.')}</span>
              </span>
              <button onClick={invite} className="btn-primary min-h-[40px] shrink-0 px-5 text-[15px]">
                {t('Invite')}
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 md:hidden" />
        {go}
      </>,
    )
  }

  // Anything else (a reload landed on a screen whose state is gone): back to the start
  return shell(
    <div className="flex flex-1 items-center justify-center">
      <button onClick={() => setScreen('share')} className="btn-primary btn-lg w-[240px]">
        {t('Start')}
      </button>
    </div>,
  )
}
