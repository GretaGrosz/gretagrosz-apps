// Doing a plan together (worker/blank-social.js, chats of kind 'project'). Everything a project chat has:
// - TogetherSheet: "Do this together" on a project → pick a friend → the project chat, with the plan pinned on top
// - ProjectPin: that pinned plan in the chat: both people's progress, Join, Poke, the shopping list, sessions
// - ListSheet / SessionSheet: the shared shopping list ("I'll buy the yarn") and planning a time and place
// - ProgressCard, PokeCard, SessionCard: the small cards in the chat ("Lilla finished step 3 🎉")
// - useTogetherSync: ticking a step in your own project sends your progress to its project chat
// Nothing here is real-time: the chat's normal check for new messages (Chat.jsx) brings the changes.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from '../account'
import { useStore } from '../store'
import { useT, locale } from '../i18n'
import { api } from '../social'
import { cat } from '../data'
import { materialsFor } from '../guides'
import { guessLang, planFromSomeone } from '../plan'
import { Icon, Sheet, SheetHeader, Spinner } from './ui'
import { Avatar, ERRORS, NeedAccount } from './Social'

// A small picture for each hobby (chips and the chat list)
export const CAT_EMOJI = { art: '🎨', music: '🎵', crafts: '🧶', cooking: '🍳', tech: '💻', outdoors: '🌲', fitness: '💪', writing: '✍️', photo: '📷', garden: '🌱', wood: '🪵', learn: '📚', other: '✨' }
export const catEmoji = (c) => CAT_EMOJI[c] || CAT_EMOJI.other

// Your steps in a project (the automatic "Choose your project" doesn't count)
const stepsOf = (project) => project.milestones.filter((m) => !m.auto)
const progressOf = (project) => {
  const steps = stepsOf(project)
  const done = steps.filter((m) => m.done)
  const last = [...done].sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))[0]
  return { done: done.length, total: Math.max(1, steps.length), step: last?.text || '' }
}

// ---------- "Do this together": pick a friend ----------
export function TogetherSheet({ project, onClose }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const navigate = useNavigate()
  const [friends, setFriends] = useState(null)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (!account) return
    api(account.token)
      .friends()
      .then((r) => setFriends(r.friends))
      .catch(() => setFriends([]))
  }, [account])

  const start = async (friend) => {
    if (busy) return
    setBusy(friend.username)
    setError(null)
    try {
      const steps = stepsOf(project).map((m) => m.text)
      const needs = project.materials?.length ? project.materials : materialsFor(project.guideKey, lang)
      const { done } = progressOf(project)
      const r = await api(account.token).createProject({
        with: friend.username,
        done,
        plan: { title: project.title, category: project.category, guide: project.guideKey || null, steps, lang: guessLang(steps) || lang, materials: needs },
      })
      actions.updateProject(project.id, { chatId: r.id })
      remember(project.id, done)
      actions.toast({ text: t('Sent to {name}. They join with one tap.', { name: friend.name || `@${friend.username}` }) })
      navigate(`/chats/${r.id}`)
    } catch (e) {
      setBusy(null)
      setError(e.code === 'too_many_projects' ? t('You already have 3 projects going with {name}. Finish one first.', { name: friend.name || `@${friend.username}` }) : t(ERRORS[e.code] || 'Something went wrong. Try again.'))
    }
  }

  return (
    <Sheet onClose={onClose} label={t('Do this together')}>
      <SheetHeader title={t('Do this together')} onClose={onClose} />
      {!account ? (
        <div className="px-5 pb-4">
          <NeedAccount title={t('Create an account to do it with a friend')} text={t('It takes half a minute, and your projects are saved too.')} />
        </div>
      ) : (
        <div className="px-5 pb-3">
          <p className="px-1 text-[15px] leading-snug text-sub">
            {t('You both follow “{title}” with your own checklist, and see each other’s progress in a shared chat.', { title: project.title })}
          </p>
          {error && (
            <p className="mt-3 px-1 text-[15px] text-bad" role="alert">
              {error}
            </p>
          )}
          {friends === null ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-6 w-6 text-sub" />
            </div>
          ) : friends.length === 0 ? (
            <p className="px-1 py-8 text-center text-[15px] text-sub">{t('No friends yet. Add someone on the Friends tab first.')}</p>
          ) : (
            <ul className="surface mt-3 divide-y divide-line/15 overflow-hidden">
              {friends.map((f) => (
                <li key={f.username}>
                  <button onClick={() => start(f)} disabled={!!busy} className="row min-h-[60px] w-full gap-3 py-2 text-left active:bg-mist disabled:opacity-60">
                    <Avatar user={f} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[17px] font-medium leading-tight">{f.name || `@${f.username}`}</span>
                      <span className="block truncate text-[13px] text-sub">@{f.username}</span>
                    </span>
                    {busy === f.username ? <Spinner className="h-5 w-5 text-sub" /> : <span className="btn-tinted min-h-[34px] shrink-0 px-3.5 text-[15px]">{t('Invite')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  )
}

// ---------- progress sync: your project → its project chat ----------
const SENT = 'blank-together-sent' // { projectId: steps done when last sent }, on this device
const readSent = () => {
  try {
    return JSON.parse(localStorage.getItem(SENT) || '{}')
  } catch {
    return {}
  }
}
const remember = (projectId, done) => {
  try {
    localStorage.setItem(SENT, JSON.stringify({ ...readSent(), [projectId]: done }))
  } catch {}
}

export function useTogetherSync() {
  const { account } = useAccount()
  const { data } = useStore()
  const busy = useRef(false)
  useEffect(() => {
    if (!account || busy.current) return
    const sent = readSent()
    const changed = data.projects.filter((p) => p.chatId && progressOf(p).done !== (sent[p.id] ?? -1))
    if (!changed.length) return
    busy.current = true
    ;(async () => {
      for (const p of changed) {
        const prog = progressOf(p)
        try {
          await api(account.token).progress(p.chatId, prog)
          remember(p.id, prog.done)
        } catch (e) {
          // The chat is gone (blocked, or you left): stop trying for this project
          if (e.code === 'not_found' || e.code === 'blocked' || e.code === 'not_project') remember(p.id, prog.done)
        }
      }
      busy.current = false
    })()
  }, [account, data.projects])
}

// ---------- the pinned plan at the top of a project chat ----------
export function ProjectPin({ chatId, info, onInfo }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { data, actions } = useStore()
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(null) // 'list' | 'session' | 'steps'
  const [busy, setBusy] = useState(false)
  const plan = info.plan || { title: '', steps: [] }
  const me = info.people.find((p) => p.me)
  const others = info.people.filter((p) => !p.me)
  const mine = data.projects.find((p) => p.chatId === chatId)
  const pokeable = others.find((p) => p.canPoke)
  const items = info.items || []
  const next = (info.sessions || []).find((s) => s.at > Date.now() - 3_600_000)
  const a = api(account?.token)

  // Join: the plan becomes your own project (in your language if it can be), linked to this chat
  const join = async () => {
    if (busy) return
    setBusy(true)
    try {
      const r = await a.join(chatId)
      const p = r.plan || plan
      const { outOfAI, starterOnly, ai, title, ...made } = await planFromSomeone({ title: p.title, category: p.category || 'other', steps: p.steps || [], stepsLang: p.lang, guideKey: p.guide, lang, level: data.me.prefs?.level })
      const id = actions.addProject({ title: title || p.title, ...made, from: { name: others[0]?.name || others[0]?.username || '' } })
      actions.updateProject(id, { chatId })
      remember(id, 0)
      onInfo()
      actions.toast({ text: t('You’re in! Your checklist is in your projects.') })
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }
  const poke = async () => {
    try {
      await a.poke(chatId)
      onInfo()
    } catch (e) {
      actions.toast({ text: e.code === 'too_soon' ? t('You can poke once a day.') : ERRORS[e.code] || 'Something went wrong. Try again.' })
    }
  }

  return (
    <div className="surface mb-3 p-3.5">
      <button onClick={() => setSheet('steps')} className="flex w-full items-center gap-2.5 text-left active:opacity-70">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[18px]" style={{ background: cat(plan.category || 'other').color + '33' }} aria-hidden="true">
          {catEmoji(plan.category)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-semibold uppercase tracking-[0.04em] text-sub">{info.archived ? t('Finished together') : t('Plan')}</span>
          <span className="block truncate text-[17px] font-semibold leading-tight">{plan.title}</span>
        </span>
        <Icon name="chevron" className="h-4 w-4 text-sub" />
      </button>
      <ul className="mt-3 space-y-2">
        {info.people.map((p) => (
          <li key={p.username} className="flex items-center gap-2.5">
            <Avatar user={p} size={26} />
            <span className="w-16 shrink-0 truncate text-[13px] font-medium">{p.me ? t('You') : p.name || `@${p.username}`}</span>
            <span className="block h-2 flex-1 overflow-hidden rounded-full bg-ink/10" role="progressbar" aria-valuenow={p.done} aria-valuemin={0} aria-valuemax={p.total}>
              <span className="block h-full rounded-full bg-spark" style={{ width: `${p.joined ? Math.round((p.done / Math.max(1, p.total)) * 100) : 0}%` }} />
            </span>
            <span className="w-12 shrink-0 text-right text-[13px] font-semibold tabular-nums text-sub">{p.finished ? '🎉' : p.joined ? `${p.done}/${p.total}` : t('invited')}</span>
          </li>
        ))}
      </ul>
      {!info.archived && (
        <div className="mt-3 flex flex-wrap gap-2">
          {me && !me.joined ? (
            <button onClick={join} disabled={busy} className="btn-primary min-h-[38px] flex-1 px-4 text-[15px]">
              {busy ? <Spinner className="h-4 w-4" /> : t('Join and get my checklist')}
            </button>
          ) : (
            mine && (
              <button onClick={() => navigate(`/project/${mine.id}`)} className="btn-tinted min-h-[36px] px-3.5 text-[15px]">
                {t('My checklist')}
              </button>
            )
          )}
          <button onClick={() => setSheet('list')} className="btn-plain min-h-[36px] px-3.5 text-[15px]">
            🛒 {t('List')} {items.length > 0 && <span className="tabular-nums text-sub">{items.filter((i) => i.bought).length}/{items.length}</span>}
          </button>
          <button onClick={() => setSheet('session')} className="btn-plain min-h-[36px] px-3.5 text-[15px]">
            📅 {next ? new Date(next.at).toLocaleString(locale(lang), { weekday: 'short', hour: '2-digit', minute: '2-digit' }) : t('Plan a session')}
          </button>
        </div>
      )}
      {pokeable && (
        <button onClick={poke} className="btn-tinted mt-2 min-h-[38px] w-full text-[15px]">
          👉 {t('Poke {name}: you coming?', { name: pokeable.name || `@${pokeable.username}` })}
        </button>
      )}
      {sheet === 'list' && <ListSheet chatId={chatId} info={info} onInfo={onInfo} onClose={() => setSheet(null)} />}
      {sheet === 'session' && <SessionSheet chatId={chatId} info={info} onInfo={onInfo} onClose={() => setSheet(null)} />}
      {sheet === 'steps' && (
        <Sheet onClose={() => setSheet(null)} label={plan.title}>
          <SheetHeader title={plan.title} onClose={() => setSheet(null)} />
          <ol className="surface mx-5 mb-4 divide-y divide-line/15 overflow-hidden">
            {(plan.steps || []).map((s, i) => (
              <li key={i} className="row min-h-[44px] py-2 text-[15px] leading-snug">
                <span className="w-5 shrink-0 text-center font-semibold tabular-nums text-sub">{i + 1}</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ol>
        </Sheet>
      )}
    </div>
  )
}

// ---------- the shared shopping list ----------
function ListSheet({ chatId, info, onInfo, onClose }) {
  const { t } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const a = api(account.token)
  const run = async (fn) => {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      onInfo()
    } catch (e) {
      actions.toast({ text: ERRORS[e.code] || 'Something went wrong. Try again.' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Shopping list')}>
      <SheetHeader title={t('Shopping list')} onClose={onClose} />
      <div className="px-5 pb-4">
        <p className="px-1 text-[15px] text-sub">{t('Tap “I’ll get it” so you don’t both buy the same thing.')}</p>
        <ul className="surface mt-3 divide-y divide-line/15 overflow-hidden">
          {info.items.length === 0 && <li className="row min-h-[52px] text-[15px] text-sub">{t('Nothing on the list yet.')}</li>}
          {info.items.map((i) => (
            <li key={i.id} className="row min-h-[56px] gap-3 py-2">
              <button
                onClick={() => run(() => a.item(chatId, i.id, { bought: !i.bought }))}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${i.bought ? 'border-spark bg-spark text-white' : 'border-line'}`}
                aria-label={i.bought ? t('Not bought yet') : t('Bought')}
              >
                {i.bought && <Icon name="check" className="h-3.5 w-3.5" strokeWidth={3} />}
              </button>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[17px] ${i.bought ? 'text-sub line-through' : ''}`}>{i.text}</span>
                {i.claimedBy && <span className="block truncate text-[13px] text-sub">{i.claimedBy.me ? t('You’re getting it') : t('{name} is getting it', { name: i.claimedBy.name || `@${i.claimedBy.username}` })}</span>}
              </span>
              {!i.claimedBy ? (
                <button onClick={() => run(() => a.item(chatId, i.id, { claim: true }))} className="btn-tinted min-h-[32px] shrink-0 px-3 text-[14px]">
                  {t('I’ll get it')}
                </button>
              ) : (
                i.claimedBy.me &&
                !i.bought && (
                  <button onClick={() => run(() => a.item(chatId, i.id, { claim: false }))} className="min-h-[32px] shrink-0 px-2 text-[14px] text-sub">
                    {t('Undo')}
                  </button>
                )
              )}
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const v = text.trim()
            if (v) run(async () => (await a.addItem(chatId, v), setText('')))
          }}
          className="mt-3 flex gap-2"
        >
          <input className="input flex-1" placeholder={t('Add something')} value={text} onChange={(e) => setText(e.target.value)} maxLength={80} aria-label={t('Add something')} />
          <button className="btn-primary shrink-0 px-4" disabled={busy || !text.trim()}>
            {t('Add')}
          </button>
        </form>
      </div>
    </Sheet>
  )
}

// ---------- planning a session: when and where; both get a reminder 30 minutes before ----------
function SessionSheet({ chatId, info, onInfo, onClose }) {
  const { t, lang } = useT()
  const { account } = useAccount()
  const { actions } = useStore()
  const soon = new Date(Date.now() + 86_400_000)
  soon.setHours(16, 0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  const local = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  const [when, setWhen] = useState(local(soon))
  const [place, setPlace] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async (e) => {
    e.preventDefault()
    const at = new Date(when).getTime()
    if (!at || at < Date.now()) return actions.toast({ text: t('Pick a time in the future.') })
    setBusy(true)
    try {
      await api(account.token).addSession(chatId, { at, place: place.trim() })
      onInfo()
      onClose()
    } catch (err) {
      actions.toast({ text: ERRORS[err.code] || 'Something went wrong. Try again.' })
      setBusy(false)
    }
  }
  return (
    <Sheet onClose={onClose} label={t('Plan a session')}>
      <SheetHeader title={t('Plan a session')} onClose={onClose} />
      <form onSubmit={save} className="px-5 pb-4">
        {(info.sessions || []).length > 0 && (
          <ul className="surface mb-4 divide-y divide-line/15 overflow-hidden">
            {info.sessions.map((s) => (
              <li key={s.id} className="row min-h-[52px] text-[15px]">
                <span className="flex-1">
                  📅 {new Date(s.at).toLocaleString(locale(lang), { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {s.place && <span className="block text-[13px] text-sub">📍 {s.place}</span>}
                </span>
                {s.mine && (
                  <button type="button" onClick={() => api(account.token).deleteSession(chatId, s.id).then(onInfo).catch(() => {})} className="px-2 text-[14px] text-sub">
                    {t('Cancel')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        <label className="block">
          <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('When')}</span>
          <input type="datetime-local" className="input" value={when} onChange={(e) => setWhen(e.target.value)} required />
        </label>
        <label className="mt-3 block">
          <span className="mb-1.5 block px-1 text-[15px] font-medium text-sub">{t('Where (optional)')}</span>
          <input className="input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('e.g. at my place, the library, video call')} maxLength={80} />
        </label>
        <p className="mt-2 px-1 text-[13px] text-sub">{t('You both get a reminder 30 minutes before (if notifications are on).')}</p>
        <button className="btn-primary btn-lg mt-4 w-full" disabled={busy}>
          {busy ? <Spinner className="h-5 w-5" /> : t('Plan it')}
        </button>
      </form>
    </Sheet>
  )
}

// ---------- the small cards in a project chat ----------
export function TogetherCard({ m, who }) {
  const { t, lang } = useT()
  const i = m.info || {}
  const name = m.mine ? t('You') : who(m)
  let text = ''
  if (m.kind === 'progress') text = i.finished ? t('{name} finished the whole plan 🎉', { name }) : t('{name} finished step {n} 🎉', { name, n: i.done })
  if (m.kind === 'poke') text = m.mine ? t('You poked them 👉') : t('{name}: you coming? 👉', { name })
  if (m.kind === 'session')
    text = t('{name} planned a session: {when}', { name, when: new Date(i.at).toLocaleString(locale(lang), { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })
  return (
    <span className="mx-auto block max-w-[85%] rounded-2xl bg-spark/10 px-3.5 py-2 text-center text-[15px] leading-snug">
      <span className="font-semibold text-spark-ink">{text}</span>
      {m.kind === 'progress' && i.step && <span className="block text-[13px] text-sub">{i.step}</span>}
      {m.kind === 'session' && i.place && <span className="block text-[13px] text-sub">📍 {i.place}</span>}
      {m.kind === 'progress' && <span className="block text-[12px] tabular-nums text-sub">{i.done}/{i.total}</span>}
    </span>
  )
}

// The project system lines: invited, joined, both finished
export const togetherLine = (t, m, name) =>
  m.text === 'together'
    ? m.mine
      ? t('You invited them to do this plan together')
      : t('{name} wants to do this plan together', { name })
    : m.text === 'joined'
      ? t('{name} joined the plan', { name })
      : m.text === 'finished'
        ? t('You both finished it! 🎉 This chat is now in the Archive.')
        : null

// ---------- where it starts ----------
// On a project: "Do this together" (or, once you do, the way to your shared chat)
export function TogetherEntry({ project }) {
  const { t } = useT()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (project.status === 'done' && !project.chatId) return null
  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Together')}</h2>
      {project.chatId ? (
        <button onClick={() => navigate(`/chats/${project.chatId}`)} className="surface row min-h-[56px] w-full text-[17px] text-spark-ink active:bg-mist">
          <Icon name="chat" className="h-5 w-5" />
          <span className="flex-1 text-left">{t('Open your project chat')}</span>
          <Icon name="chevron" className="h-4 w-4 text-sub" />
        </button>
      ) : (
        <div className="surface p-4">
          <p className="text-[17px] leading-snug">{t('Do it with a friend: you each get your own checklist and see each other’s progress in a shared chat.')}</p>
          <button onClick={() => setOpen(true)} className="btn-primary btn-lg mt-3 w-full">
            <Icon name="friends" className="h-5 w-5" /> {t('Do this together')}
          </button>
        </div>
      )}
      {open && <TogetherSheet project={project} onClose={() => setOpen(false)} />}
    </section>
  )
}

// On Today, for people with an account (Buddy stays for people without one): do the project you're on with a friend
export function TogetherToday() {
  const { t } = useT()
  const { data } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const active = data.projects.filter((p) => p.status !== 'done')
  const project = active.find((p) => p.id === data.focusId) || active[0]
  if (!project) return null
  const shared = active.filter((p) => p.chatId)
  return (
    <section className="mt-8">
      <h2 className="section-label">{t('Together')}</h2>
      <div className="surface divide-y divide-line/15 overflow-hidden">
        {shared.map((p) => (
          <button key={p.id} onClick={() => navigate(`/chats/${p.chatId}`)} className="row min-h-[56px] w-full text-left active:bg-mist">
            <span aria-hidden="true" className="text-[20px]">
              {catEmoji(p.category)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[17px]">{p.title}</span>
            <Icon name="chat" className="h-5 w-5 text-spark-ink" />
          </button>
        ))}
        {!project.chatId && (
          <button onClick={() => setOpen(true)} className="row min-h-[56px] w-full text-left text-[17px] text-spark-ink active:bg-mist">
            <Icon name="friends" className="h-5 w-5" />
            <span className="min-w-0 flex-1 truncate">{t('Do “{title}” with a friend', { title: project.title })}</span>
          </button>
        )}
      </div>
      {open && <TogetherSheet project={project} onClose={() => setOpen(false)} />}
    </section>
  )
}

// Mounted once in the Layout: sends your progress to your project chats
export function TogetherSync() {
  useTogetherSync()
  return null
}
