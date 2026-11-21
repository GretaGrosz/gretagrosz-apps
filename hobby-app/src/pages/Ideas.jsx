import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { useT } from '../i18n'
import { useAccount } from '../account'
import { api, mediaOf, mediaPath, useAuthImage } from '../social'
import { CATEGORY_LABEL } from '../data'
import { GUIDES, IDEA_GUIDES, pick, resourcesFor, stepsFor } from '../guides'
import { Icon, IdeaPhoto, ResourceList, Sheet, Spinner, useBack } from '../components/ui'
import { NeedAccount, PostIdeaSheet, PostSheet, PostTile } from '../components/Social'
import { useUi } from '../components/Layout'
import { useQuickInvite } from '../components/BuddyCard'
import { StartQuestions } from '../components/Journey'
import { sessionMinutes } from '../data'

// The feed is only real people: everyone's public posts, or your friends' with the "Friends" chip. Blank's own ideas
// sit apart in "Start something new", and once someone posts a project made from an idea, their photo replaces the
// stock one, so the ideas turn into real people's work as Blank grows.
async function loadPosts(token, scope) {
  const all = []
  let before
  for (let page = 0; page < 3; page++) {
    const r = await api(token).feed(scope, before)
    all.push(...r.posts)
    if (r.posts.length < 20) break
    before = r.posts[r.posts.length - 1].created
  }
  return all.filter((p) => p.status === 'ok' || p.mine)
}

const costLabel = (t, cost) => (cost === 'Free' ? t('Free') : cost)

const IDEA_KEYS = new Set(IDEA_GUIDES.map((g) => g.key))

// Real posts per idea, newest first. Older posts don't carry the idea, so a project titled like an idea counts too.
function postsByIdea(posts) {
  const byTitle = {}
  for (const g of IDEA_GUIDES) for (const lang of ['en', 'de', 'hu']) byTitle[pick(g.title, lang).toLowerCase()] = g.key
  const m = {}
  for (const p of posts) {
    const key = (IDEA_KEYS.has(p.guide) && p.guide) || byTitle[p.project.toLowerCase().trim()]
    if (key) (m[key] ||= []).push(p)
  }
  return m
}

// An idea in "Start something new": a real person's photo once someone made it, Blank's stock photo until then
function IdeaCard({ guide, posts = [], mine, onOpen, natural = false }) {
  const { t, tn, lang } = useT()
  const { account } = useAccount()
  const real = posts.find((p) => mediaOf(p).length)
  const url = useAuthImage(real ? mediaPath(real, 0) : null, account?.token)
  const makers = new Set(posts.map((p) => p.author.username)).size
  const shape = natural ? '' : 'aspect-[4/5]'
  return (
    <button onClick={onOpen} className="idea-card block w-full text-left active:opacity-75">
      <span className="relative block">
        {real ? (
          <span
            className={`relative block w-full overflow-hidden rounded-[16px] bg-mist ${shape}`}
            style={natural ? { aspectRatio: `1 / ${Math.min(1.25, Math.max(0.52, mediaOf(real)[0].ratio || 1))}` } : undefined}
          >
            {url && <img src={url} alt="" decoding="async" className="h-full w-full object-cover" />}
            <span className="absolute bottom-2 left-2 max-w-[85%] truncate rounded-full bg-black/55 px-2 py-0.5 text-[12px] font-semibold text-white">
              @{real.author.username}
            </span>
          </span>
        ) : (
          <IdeaPhoto guide={guide} natural={natural} className={`w-full rounded-[16px] ${shape}`} />
        )}
        {mine && <MineBadge project={mine} />}
      </span>
      <span className="mt-2 block px-0.5 text-[15px] font-semibold leading-snug">{pick(guide.title, lang)}</span>
      <span className="block px-0.5 text-[13px] text-sub">
        {makers
          ? tn(makers, '{n} person made this', '{n} people made this')
          : `${pick(guide.time, lang)}${guide.cost ? ` · ${costLabel(t, guide.cost)}` : ''}`}
      </span>
    </button>
  )
}

// 2 columns on phones, up to 6 on big screens (the Ideas page uses the full width)
function useColumns() {
  const get = () => {
    const w = window.innerWidth
    return w >= 1800 ? 6 : w >= 1400 ? 5 : w >= 1024 ? 4 : w >= 640 ? 3 : 2
  }
  const [n, setN] = useState(get)
  useEffect(() => {
    const onResize = () => setN(get())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return n
}

// A row that scrolls sideways. Fingers swipe it; on a computer (no touch, often no sideways scroll) arrow buttons
// page through it. scroll-padding keeps the first card from snapping under the screen edge.
function Carousel({ children }) {
  const { t } = useT()
  const ref = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  const update = () => {
    const el = ref.current
    if (!el) return
    const start = el.scrollLeft <= 4
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    setEdges((e) => (e.start === start && e.end === end ? e : { start, end }))
  }
  // After every render too: a search or a category changes how many cards there are
  useEffect(update)
  useEffect(() => {
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const page = (dir) => {
    const el = ref.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  const arrow = (dir, hidden) => (
    <button
      type="button"
      onClick={() => page(dir)}
      aria-label={dir < 0 ? t('Back') : t('More')}
      tabIndex={hidden ? -1 : 0}
      className={`absolute top-[calc(50%-36px)] z-10 hidden h-11 w-11 items-center justify-center rounded-full bg-card text-ink shadow-pop transition hover:scale-105 [@media(hover:hover)_and_(pointer:fine)]:flex ${dir < 0 ? '-left-3' : '-right-3'} ${hidden ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <Icon name={dir < 0 ? 'back' : 'chevron'} className="h-5 w-5" strokeWidth={2.4} />
    </button>
  )
  return (
    <div className="relative">
      {arrow(-1, edges.start)}
      <div
        ref={ref}
        onScroll={update}
        className="-mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0"
      >
        {children}
      </div>
      {arrow(1, edges.end)}
    </div>
  )
}

// Each card goes into the shortest column, so both columns start at the top and end close together
function balance(list, n) {
  const cols = Array.from({ length: n }, () => [])
  const heights = Array(n).fill(0)
  for (const g of list) {
    const i = heights.indexOf(Math.min(...heights))
    cols[i].push(g)
    heights[i] += (g.post ? (g.post.photo ? g.post.ratio || 1 : 0.8) : g.photo?.ratio || 1) + 0.35
  }
  return cols
}

function IdeaSheet({ guide, posts = [], onClose, onOpenPost }) {
  const { data, actions } = useStore()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const steps = stepsFor(guide, data.me.prefs?.level, lang)
  const existing = data.projects.find((p) => p.guideKey === guide.key && p.status !== 'done')
  const ui = useUi()
  const buddyInvite = useQuickInvite()
  const minutes = sessionMinutes(data.me.prefs)
  const create = (extra = {}) =>
    existing?.id ||
    actions.addProject({ title: pick(guide.title, lang), category: guide.category, guideKey: guide.key, steps, resources: resourcesFor(guide, lang), ...extra })
  const [asking, setAsking] = useState(false) // the three quick questions (Journey.jsx)
  const start = () => (existing ? navigate(`/project/${existing.id}`, { replace: true }) : setAsking(true))
  // The answers: the plan for your level, and your budget and time on the project (the steps' timing, Journey.jsx)
  const startWith = ({ budget, pace, level }) => {
    const id = create({ steps: stepsFor(guide, level, lang) })
    actions.updateProject(id, { pace, budget })
    navigate(`/project/${id}`, { replace: true })
  }
  // Do it now: the project and the timer on step 1 in one tap
  const now = () => {
    const id = create()
    if (!data.session) actions.startSession(id, minutes)
    navigate(`/project/${id}`, { replace: true })
    ui?.openSession()
  }
  // Mini: the first two real steps and "show it", a small finished thing in a few days
  const mini = () => {
    const real = steps.filter((s) => !s.quick)
    const id = actions.addProject({
      title: `${pick(guide.title, lang)} · ${t('mini')}`,
      category: guide.category,
      guideKey: guide.key,
      steps: [...steps.filter((s) => s.quick), ...real.slice(0, 2), { text: t('Show someone what you made'), how: t('The mini version is done: a photo or a short video is enough.') }],
      resources: resourcesFor(guide, lang),
    })
    navigate(`/project/${id}`, { replace: true })
  }
  // With a friend: the project, then the buddy link to send them (or your buddy sees it if you have one)
  const together = async () => {
    const id = create()
    if (data.buddy) {
      actions.toast({ text: 'Your buddy will see your progress.' })
      return navigate(`/project/${id}`, { replace: true })
    }
    const ok = await buddyInvite.invite()
    if (ok) navigate(`/project/${id}`, { replace: true })
    else if (!data.me.name.trim()) navigate('/', { replace: true, state: { openInvite: true } })
  }
  return (
    <Sheet onClose={onClose} label={pick(guide.title, lang)} wide className="!pb-0">
      <div className="relative -mt-[17px] sm:mt-0">
        <IdeaPhoto guide={guide} w={900} eager className="aspect-[4/3] w-full sm:rounded-t-[22px]" />
        <button
          onClick={onClose}
          className="bar absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full !bg-black/45 text-white"
          aria-label={t('Close')}
        >
          <Icon name="x" className="h-4 w-4" strokeWidth={2.6} />
        </button>
        {guide.photo?.by && (
          <span className="absolute bottom-2 right-3 text-[11px] font-medium text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {guide.photo.by} / Unsplash
          </span>
        )}
      </div>
      <div className="px-5 pt-4">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">
          {t(CATEGORY_LABEL[guide.category])} · {pick(guide.time, lang)}
          {guide.cost ? ` · ${costLabel(t, guide.cost)}` : ''}
        </p>
        <h2 className="mt-1 text-[26px] font-bold leading-tight tracking-[-0.01em]">{pick(guide.title, lang)}</h2>
        {posts.length > 0 && (
          <>
            <h3 className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">{t('People who made this')}</h3>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
              {posts.slice(0, 12).map((p) => (
                <div key={p.id} className="w-[38%] shrink-0 sm:w-[30%]">
                  <PostTile post={p} onOpen={onOpenPost} />
                </div>
              ))}
            </div>
          </>
        )}
        <ol className="mt-5 space-y-3">
          {steps.map((s, i) => (
            <li key={s.text} className="flex gap-3 text-[17px] leading-snug">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-[13px] font-bold tabular-nums">{i + 1}</span>
              <span className="min-w-0 pt-0.5">
                <span className="block">{s.text}</span>
                {s.how && <span className="mt-0.5 block text-[15px] leading-snug text-sub">{s.how}</span>}
              </span>
            </li>
          ))}
        </ol>
        <h3 className="mb-2 mt-6 text-[13px] font-semibold uppercase tracking-[0.04em] text-sub">{t('Helpful links')}</h3>
        <ResourceList resources={resourcesFor(guide, lang)} />
      </div>
      <div className="sticky bottom-0 mt-4 bg-card px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <div className="flex gap-2">
          <button onClick={start} className="btn-primary btn-lg w-full">
            {existing ? t('Open your project') : t('Start this project')}
          </button>
        </div>
        {!existing && (
          // Other ways in, each one tap: right now with the timer, a mini version, or together with a friend
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[
              ['timer', t('Do it now'), t('{n} min', { n: minutes }), now, false],
              ['list', t('Mini version'), t('{n} steps', { n: Math.min(2, steps.filter((s) => !s.quick).length) + 1 + steps.filter((s) => s.quick).length }), mini, false],
              ['friends', t('With a friend'), data.buddy ? t('Your buddy') : t('Invite'), together, buddyInvite.busy],
            ].map(([icon, label, sub, run, busy]) => (
              <button key={label} onClick={run} disabled={busy} className="flex min-h-[64px] flex-col items-center justify-center rounded-2xl bg-spark-soft px-1 py-2 text-spark-ink active:scale-[0.97] disabled:opacity-60">
                {busy ? <Spinner className="h-5 w-5" /> : <Icon name={icon} className="h-5 w-5" />}
                <span className="mt-1 text-[14px] font-semibold leading-tight">{label}</span>
                <span className="text-[12px] leading-tight opacity-80">{sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {asking && <StartQuestions title={pick(guide.title, lang)} onClose={() => setAsking(false)} onStart={startWith} />}
    </Sheet>
  )
}

// On an idea you already started: how far you got, or that you finished it
function MineBadge({ project }) {
  const { t } = useT()
  const done = project.status === 'done'
  const total = project.milestones.length
  const ticked = project.milestones.filter((m) => m.done).length
  return (
    <span className="absolute left-2 top-2 flex h-7 items-center gap-1 rounded-full bg-black/70 pl-2 pr-2.5 text-[13px] font-semibold text-white backdrop-blur-sm">
      <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />
      {done ? t('Done') : total ? <span className="tabular-nums">{ticked}/{total}</span> : t('Started')}
    </span>
  )
}

export default function Ideas() {
  const { key } = useParams()
  const { data } = useStore()
  const { t, lang } = useT()
  const navigate = useNavigate()
  const back = useBack('/ideas')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const columns = useColumns()
  const interests = data.me.prefs?.interests || []
  // Your own project per idea: newest first, so a restarted idea shows its current state
  const mine = useMemo(() => {
    const m = {}
    for (const p of data.projects) if (p.guideKey && !m[p.guideKey]) m[p.guideKey] = p
    return m
  }, [data.projects])

  const { account } = useAccount()
  const token = account?.token
  const [posts, setPosts] = useState({ public: null, friends: null })
  const [opened, setOpened] = useState(null)
  const [composing, setComposing] = useState(false)
  const [allIdeas, setAllIdeas] = useState(false)
  const scope = filter === 'friends' ? 'friends' : 'public'

  // Public posts load for everyone (worker/blank-social.js guestRoute), friends' posts only with an account
  useEffect(() => {
    if (!token && scope === 'friends') return
    let alive = true
    loadPosts(token, scope)
      .then((list) => alive && setPosts((p) => ({ ...p, [scope]: list })))
      .catch(() => alive && setPosts((p) => ({ ...p, [scope]: p[scope] || [] })))
    return () => {
      alive = false
    }
  }, [token, scope])
  const changePost = (np) => {
    setPosts((p) => ({ public: p.public?.map((x) => (x.id === np.id ? np : x)) || null, friends: p.friends?.map((x) => (x.id === np.id ? np : x)) || null }))
    setOpened((o) => (o?.id === np.id ? np : o))
  }
  const removePost = (rp, wholeAuthor) => {
    const keep = (x) => x.id !== rp.id && !(wholeAuthor && x.author.username === rp.author.username)
    setPosts((p) => ({ public: p.public?.filter(keep) || null, friends: p.friends?.filter(keep) || null }))
  }
  const addPost = (np) =>
    setPosts((p) => ({ public: np.visibility === 'public' && p.public ? [np, ...p.public] : p.public, friends: p.friends ? [np, ...p.friends] : p.friends }))
  // A post made with the big + (components/Layout.jsx) shows up here right away too
  useEffect(() => {
    const on = (e) => e.detail && addPost(e.detail)
    window.addEventListener('blank:posted', on)
    return () => window.removeEventListener('blank:posted', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Your interests first, in the same order as the cards below
  const cats = useMemo(
    () => [...new Set(IDEA_GUIDES.map((g) => g.category))].sort((a, b) => interests.includes(b) - interests.includes(a)),
    [interests],
  )
  // Real posts per idea, from both feeds (a friends-only post counts for you too)
  const made = useMemo(() => {
    const seen = new Set()
    return postsByIdea([...(posts.public || []), ...(posts.friends || [])].filter((p) => !seen.has(p.id) && seen.add(p.id)))
  }, [posts])
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return IDEA_GUIDES.filter((g) => filter === 'all' || g.category === filter || (filter === 'free' && g.cost === 'Free'))
      .filter((g) => !q || `${g.title.en} ${g.title.de} ${pick(g.title, 'hu')} ${t(CATEGORY_LABEL[g.category])}`.toLowerCase().includes(q))
      .sort((a, b) => interests.includes(b.category) - interests.includes(a.category) || !!made[b.key] - !!made[a.key])
  }, [query, filter, interests, t, made])
  // Matches hiding behind the category you picked
  const elsewhere = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || filter === 'all') return 0
    return IDEA_GUIDES.filter((g) => `${g.title.en} ${g.title.de} ${t(CATEGORY_LABEL[g.category])}`.toLowerCase().includes(q)).length
  }, [query, filter, t])
  const open = key && GUIDES[key]?.photo ? GUIDES[key] : null

  // Posts that match the search and the category chip, as grid items next to the ideas
  const postItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (posts[scope] || [])
      .filter((p) => filter === 'all' || filter === 'friends' || p.category === filter || (filter === 'free' && p.cost === 'free'))
      .filter((p) => !q || `${p.project} ${p.text} ${p.author.username} ${p.author.name}`.toLowerCase().includes(q))
      .map((p) => ({ key: `post-${p.id}`, post: p }))
  }, [posts, scope, filter, query])
  const loadingPosts = (!!token || scope === 'public') && posts[scope] === null
  const feedEmpty = !postItems.length
  const showIdeas = filter !== 'friends' && list.length > 0
  const ideasOpen = allIdeas

  return (
    <div className="mx-auto max-w-[1760px] pt-6">
      <div className="flex items-center gap-2 px-1">
        <h1 className="large-title flex-1">{t('Ideas')}</h1>
      </div>
      <div className="relative mt-4 max-w-xl">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-sub"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          className="input bg-ink/[0.07] pl-10"
          placeholder={t('Search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t('Search ideas')}
        />
      </div>
      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
        {/* "Costs nothing": ideas you can start without buying anything */}
        {['all', 'free', 'friends', ...cats].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            aria-pressed={filter === c}
            className={`min-h-[36px] shrink-0 rounded-full px-4 text-[15px] font-medium transition ${filter === c ? 'bg-ink text-card' : 'bg-card text-ink shadow-soft'}`}
          >
            {c === 'all' ? t('All') : c === 'free' ? t('Costs nothing') : c === 'friends' ? t('Friends') : t(CATEGORY_LABEL[c])}
          </button>
        ))}
      </div>

      {showIdeas && (
        <section className="mt-6">
          <div className="flex items-baseline gap-2 px-1">
            <h2 className="flex-1 text-[22px] font-bold tracking-[-0.01em]">{t('Start something new')}</h2>
            <button onClick={() => setAllIdeas((x) => !x)} className="-my-2 h-10 shrink-0 px-1 text-[17px] text-spark-ink active:opacity-60">
              {allIdeas ? t('Show less') : t('See all')}
            </button>
          </div>
          {ideasOpen ? (
            <div className="mt-3 flex items-start gap-3">
              {balance(list, columns).map((col, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
                  {col.map((g) => (
                    <IdeaCard key={g.key} guide={g} posts={made[g.key]} mine={mine[g.key]} natural onOpen={() => navigate(`/ideas/${g.key}`)} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <Carousel>
              {list.slice(0, 12).map((g) => (
                <div key={g.key} className="w-[40%] shrink-0 snap-start sm:w-[28%] lg:w-[200px]">
                  <IdeaCard guide={g} posts={made[g.key]} mine={mine[g.key]} onOpen={() => navigate(`/ideas/${g.key}`)} />
                </div>
              ))}
              {list.length > 12 && (
                <button
                  onClick={() => setAllIdeas(true)}
                  className="flex w-[40%] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[16px] bg-mist text-[15px] font-semibold text-spark-ink active:opacity-70 sm:w-[28%] lg:w-[200px]"
                  style={{ aspectRatio: '4 / 5' }}
                >
                  <Icon name="ideas" className="h-6 w-6" />
                  {t('All {n} ideas', { n: list.length })}
                </button>
              )}
            </Carousel>
          )}
        </section>
      )}

      {filter === 'friends' && !account ? (
        <div className="max-w-2xl">
          <NeedAccount />
        </div>
      ) : (
        <section className="mt-8">
          <h2 className="px-1 text-[22px] font-bold tracking-[-0.01em]">{filter === 'friends' ? t('From your friends') : t('What people are making')}</h2>
          {loadingPosts ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-6 w-6 text-sub" />
            </div>
          ) : feedEmpty ? (
            query.trim() ? (
              // Nothing at all matches: the message below says so once
              (filter === 'friends' || list.length > 0) && (
                <p className="px-1 py-10 text-center text-[17px] text-sub">{t('No posts match “{q}”.', { q: query.trim() })}</p>
              )
            ) : (
              <div className="surface mt-3 flex flex-col items-center px-6 py-8 text-center">
                <p className="text-[17px] font-semibold">
                  {filter === 'friends'
                    ? t('Nothing here yet')
                    : filter === 'all'
                      ? t('Be the first to post')
                      : filter === 'free'
                        ? t('Be the first to post')
                        : t('Nobody posted {hobby} yet', { hobby: t(CATEGORY_LABEL[filter]) })}
                </p>
                <p className="mt-1 text-[15px] text-sub">
                  {filter === 'friends' ? t('Add friends to see what they make, or post your first project.') : t('Show what you’re making. Your post could be what gets someone else started.')}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button onClick={() => setComposing(true)} className="btn-primary">
                    {t('Post')}
                  </button>
                  {filter === 'friends' && (
                    <Link to="/friends/people" className="btn-tinted">
                      {t('Find friends')}
                    </Link>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="mt-3 flex items-start gap-3">
              {balance(postItems, columns).map((col, i) => (
                <div key={i} className="flex min-w-0 flex-1 flex-col gap-4">
                  {col.map((g) => (
                    <PostTile key={g.key} post={g.post} onOpen={setOpened} />
                  ))}
                </div>
              ))}
            </div>
          )}
          {!account && !feedEmpty && (
            <div className="mx-auto max-w-2xl">
              <NeedAccount />
            </div>
          )}
        </section>
      )}

      {filter !== 'friends' && !list.length && query.trim() && feedEmpty && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-[17px] font-semibold text-ink">{t('No ideas match “{q}”.', { q: query.trim() })}</p>
          {elsewhere > 0 ? (
            <button onClick={() => setFilter('all')} className="btn-primary">
              {t('Show {n} in All', { n: elsewhere })}
            </button>
          ) : (
            <button
              onClick={() => {
                setQuery('')
                setFilter('all')
              }}
              className="btn-primary"
            >
              {t('Clear search')}
            </button>
          )}
        </div>
      )}

      {open && (
        <IdeaSheet
          key={open.key}
          guide={open}
          posts={made[open.key]}
          onClose={back}
          onOpenPost={(p) => {
            back()
            setOpened(p)
          }}
        />
      )}
      {opened && <PostIdeaSheet post={opened} onClose={() => setOpened(null)} onChange={changePost} onRemove={removePost} />}
      {composing && <PostSheet onClose={() => setComposing(false)} onPosted={addPost} />}
    </div>
  )
}
