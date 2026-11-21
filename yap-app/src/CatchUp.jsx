// Catch up: one tap plays everything you haven't heard, back to back — 1:1 chats first, then groups, then
// friends' yaps — with the pauses cut out, at 1.25×, a live transcript where captions exist, the lock screen /
// AirPods controls, and hold-to-reply to whoever is talking. At the end: how long it took and how much time it saved.
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { peek, revalidate, useResource } from './store.js'
import { enqueue } from './outbox.js'
import { back as prevTrack, jumpTo, pause, playerState, playQueue, prepare, savedOn, seek, setSpeed, skip, SPEEDS, toggle, usePlayer } from './audio.js'
import { t } from './i18n.js'
import { HoldToTalk } from './Chats.jsx'
import { Avatar, Button, Icon, SPRING, Spinner, fmt, toast, useApp, useLayer, portal } from './ui.jsx'

// ---------- the session (shared with the mini player) ----------

let cu = { active: false, items: [], finished: false, listened: 0, original: 0, heard: 0, startedAt: 0 }
const subs = new Set()
const set = patch => { cu = { ...cu, ...patch }; subs.forEach(f => f()) }
export const useCatchUp = () => useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => cu)

const contextOf = it => (it.kind === 'group' ? it.ctx.name : it.kind === 'dm' ? t('voiceMessage') : it.ctx.reply ? t('replyToYou') : it.ctx.prompt ? t('dailyQuestion') : t('yapPost'))

function markHeard(it) {
  const req = it.kind === 'dm' ? api(`/messages/${it.id}/heard`, { method: 'POST' })
    : it.kind === 'group' ? api(`/groups/${it.ctx.groupId}/heard`, { method: 'POST', body: { at: it.created } })
      : api(`/posts/${it.id}/play`, { method: 'POST' })
  req.then(() => revalidate('/me')).catch(() => {})
}

/** Starts Catch up with server items (from /unheard); call straight from a tap */
export function startCatchUp(items, from = 0) {
  if (!items.length) return
  const list = items.map(it => ({
    id: it.id, audio: it.audio, duration: it.duration, fx: it.fx, user: it.user, words: it.words, transcript: it.transcript,
    trim: true, context: contextOf(it), source: it, onStart: () => markHeard(it),
  }))
  if (playerState().speed === 1) setSpeed(1.25)
  // Only notes that played to the end count towards "N voice notes in m:ss" and the time saved
  set({ active: true, items: list, finished: false, listened: 0, original: 0, heard: 0, startedAt: Date.now() })
  playQueue(list, from, {
    ended: async item => {
      const trimmed = await savedOn(item)
      set({ listened: cu.listened + Math.max(0.5, item.duration - trimmed) / playerState().speed, original: cu.original + item.duration, heard: cu.heard + 1 })
    },
    done: () => {
      set({ finished: true })
      for (const p of ['/unheard', '/chats', '/feed', '/me', '/prompt']) revalidate(p)
    },
  })
}
export function endCatchUp() { set({ active: false, finished: false, items: [] }) }

// ---------- the full-screen player ----------

export default function CatchUp({ onClose }) {
  const ref = useRef(null)
  useLayer(true, onClose, ref)
  const s = useCatchUp()
  const p = usePlayer()
  const res = useResource(s.active ? null : '/unheard')
  const playingHere = s.active && s.items.some(x => x.id === p.item?.id)
  const close = () => { if (s.finished) endCatchUp(); onClose() }

  return portal(
    <motion.div ref={ref} role="dialog" aria-label={t('catchUp')} tabIndex={-1}
      className="fixed inset-0 z-[55] flex flex-col bg-bg outline-none"
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={SPRING}>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 px-2 pt-[max(8px,env(safe-area-inset-top))]">
          <button type="button" onClick={close} className="grid h-11 w-11 place-items-center" aria-label={t('close')}><Icon.ChevronDown size={26} /></button>
          <div className="min-w-0 flex-1 text-center">
            <div className="text-[17px] font-semibold">{t('catchUp')}</div>
            {playingHere && <div className="text-[13px] tabular-nums text-muted">{t('nOfTotal', { n: p.index + 1, total: p.total })}</div>}
          </div>
          <SpeedButton />
        </header>
        {s.finished ? <Finished s={s} onDone={close} />
          : playingHere ? <NowPlaying s={s} p={p} />
            : s.active ? <NowPlaying s={s} p={p} paused />
              : <Start res={res} onDone={close} />}
      </div>
    </motion.div>,
  )
}

function SpeedButton() {
  const p = usePlayer()
  const next = SPEEDS[(SPEEDS.indexOf(p.speed) + 1) % SPEEDS.length]
  return (
    <button type="button" onClick={() => setSpeed(next)} className="h-11 min-w-[56px] rounded-full px-3 text-[15px] font-semibold tabular-nums" aria-label={t('speedIs', { x: p.speed })}>
      {p.speed}×
    </button>
  )
}

/** Before it starts: what's waiting, and one big Play */
function Start({ res, onDone }) {
  const items = res.data?.items
  if (!items) return <div className="grid flex-1 place-items-center">{res.error ? <Button kind="tinted" className="h-11 px-5" onClick={res.reload}>{t('retry')}</Button> : <Spinner size={26} />}</div>
  if (!items.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <CheckBadge />
        <div className="mt-5 text-[28px] font-bold">{t('allCaughtUp')}</div>
        <Button kind="tinted" className="mt-8 h-[50px] w-full max-w-[320px]" onClick={onDone}>{t('done')}</Button>
      </div>
    )
  }
  const total = items.reduce((a, x) => a + x.duration, 0)
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col items-center px-6 pt-6 text-center">
        <Faces users={items.map(i => i.user)} size={64} />
        <div className="mt-4 text-[28px] font-bold leading-tight">{t('nVoiceNotes', { n: items.length })}</div>
        <div className="mt-1 text-[17px] text-muted">{t('aboutMin', { m: Math.max(1, Math.round(total / 1.25 / 60)) })}</div>
        <Button className="mt-6 h-[54px] w-full max-w-[320px] text-[19px]" onClick={() => startCatchUp(items)}><Icon.Play size={22} /> {t('play')}</Button>
      </div>
      <Queue items={items.map(it => ({ ...it, context: contextOf(it) }))} onPick={i => startCatchUp(items, i)} />
    </div>
  )
}

function NowPlaying({ s, p, paused }) {
  const { me } = useApp()
  const item = paused ? s.items[0] : p.item
  const src = item?.source
  useEffect(() => { prepare(s.items[p.index + 1]); prepare(s.items[p.index + 2]) }, [p.index])
  // Brand-new notes get their caption a few seconds after they were sent; pick it up while listening
  useEffect(() => {
    const waiting = () => s.items.filter(x => !x.transcript && Date.now() - x.source.created < 120_000)
    if (!waiting().length) return
    const timer = setInterval(async () => {
      const list = waiting()
      if (!list.length) return clearInterval(timer)
      const m = list.filter(x => x.source.kind !== 'post').map(x => x.id), ps = list.filter(x => x.source.kind === 'post').map(x => x.id)
      try {
        const { captions } = await api(`/captions?m=${m.join(',')}&p=${ps.join(',')}`)
        let changed = false
        for (const x of list) if (captions[x.id]) { Object.assign(x, captions[x.id]); changed = true }
        if (changed) set({ items: [...cu.items] })
      } catch {}
    }, 3000)
    return () => clearInterval(timer)
  }, [s.items])
  if (!item) return null
  const target = src.kind === 'dm' ? { path: `/chats/${src.ctx.handle}`, kind: 'dm' }
    : src.kind === 'group' ? { path: `/groups/${src.ctx.groupId}`, kind: 'group' }
      : { path: '/posts', kind: 'reply', extra: { reply_to: src.ctx.postId } }
  const reply = async clip => {
    const sent = await enqueue(target.path, clip, { kind: target.kind, extra: target.extra })
    toast(sent ? t('sentTo', { name: src.kind === 'group' ? src.ctx.name : item.user.name }) : t('notSentYet'))
  }
  const remaining = s.items.slice(p.index + 1)
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-col items-center px-6 pt-4 text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={item.id} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={SPRING}>
            <Avatar user={item.user} size={112} ring={p.playing} />
          </motion.div>
        </AnimatePresence>
        <div className="mt-3 max-w-full truncate text-[24px] font-bold">{item.user.name}</div>
        <div className="max-w-full truncate text-[15px] text-muted">{item.context}</div>
      </div>
      <Transcript item={item} time={p.item?.id === item.id ? p.time : 0} />
      <div className="shrink-0 px-6">
        <Scrubber p={p} item={item} />
        <div className="mt-2 flex items-center justify-center gap-8">
          <button type="button" onClick={prevTrack} className="grid h-14 w-14 place-items-center" aria-label={t('previous')}><Icon.Prev size={30} /></button>
          <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => (paused ? startCatchUp(s.items.map(x => x.source)) : toggle())}
            className="grid h-[72px] w-[72px] place-items-center rounded-full bg-label text-bg" aria-label={p.playing ? t('pause') : t('play')}>
            {p.loading ? <Spinner size={26} /> : p.playing ? <Icon.Pause size={30} /> : <Icon.Play size={32} className="ml-1" />}
          </motion.button>
          <button type="button" onClick={skip} className="grid h-14 w-14 place-items-center" aria-label={t('next')}><Icon.Next size={30} /></button>
        </div>
        {item.user.handle !== me.handle && (
          <div className="mt-3">
            <HoldToTalk onClip={reply} label={t('holdToReply', { name: src.kind === 'group' ? src.ctx.name : item.user.name.split(' ')[0] })} onStart={pause} bare />
          </div>
        )}
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 max-h-[22dvh] shrink-0 overflow-y-auto border-t border-line">
          <div className="px-4 pt-3 text-[13px] font-semibold uppercase tracking-[0.02em] text-muted">{t('upNext')}</div>
          <Queue items={remaining} onPick={i => jumpTo(p.index + 1 + i)} flat />
        </div>
      )}
    </div>
  )
}

/** The caption, word by word: what's been said is bright, the word being said is in the accent colour */
function Transcript({ item, time }) {
  const box = useRef(null)
  const words = item.words
  const idx = words ? words.findLastIndex(w => w[0] <= time + 0.05) : -1
  useEffect(() => {
    const el = box.current?.querySelector('[data-now]')
    if (el) el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [idx])
  if (!item.transcript) return <div className="flex min-h-0 flex-1 items-center px-6"><BigWave item={item} /></div>
  return (
    <div ref={box} className="min-h-0 flex-1 overflow-y-auto px-6 py-5" aria-live="off">
      <p className="text-[26px] font-semibold leading-[1.3] tracking-[-0.01em]">
        {words?.length ? words.map((w, i) => (
          <span key={i} data-now={i === idx ? '' : undefined} className={`transition-colors duration-150 ${i === idx ? 'text-accent' : i < idx ? 'text-label' : 'text-[var(--label-3)]'}`}>{w[2]} </span>
        )) : <span className="text-label">{item.transcript}</span>}
      </p>
    </div>
  )
}

function BigWave({ item }) {
  const p = usePlayer()
  const progress = p.item?.id === item.id ? p.progress : 0
  const bars = item.source?.wave?.length ? item.source.wave : Array(40).fill(30)
  return (
    <div className="flex h-28 w-full items-center gap-[3px]" aria-hidden="true">
      {bars.map((v, i) => <span key={i} className="flex-1 rounded-full transition-colors duration-150" style={{ height: Math.max(8, v) + '%', background: (i + 0.5) / bars.length <= progress ? 'var(--accent)' : 'var(--wave-idle)' }} />)}
    </div>
  )
}

function Scrubber({ p, item }) {
  const ref = useRef(null)
  const active = p.item?.id === item.id
  const at = e => {
    const r = ref.current.getBoundingClientRect()
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
  }
  const total = item.duration
  const onKey = e => {
    if (e.key === 'ArrowRight') seek(Math.min(1, p.progress + 0.1))
    if (e.key === 'ArrowLeft') seek(Math.max(0, p.progress - 0.1))
  }
  return (
    <div>
      <div ref={ref} role="slider" tabIndex={0} aria-label={t('position')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.progress * 100)}
        onKeyDown={onKey} onPointerDown={e => active && seek(at(e))} className="flex h-8 cursor-pointer items-center">
        <div className="h-[5px] w-full overflow-hidden rounded-full bg-fill"><div className="h-full rounded-full bg-label" style={{ width: (active ? p.progress : 0) * 100 + '%' }} /></div>
      </div>
      <div className="flex justify-between text-[13px] tabular-nums text-muted">
        <span>{fmt(active ? p.time : 0)}</span><span>{fmt(total)}</span>
      </div>
    </div>
  )
}

function Queue({ items, onPick, flat }) {
  return (
    <ul className={flat ? '' : 'mt-6 min-h-0 flex-1 overflow-y-auto border-t border-line'}>
      {items.map((it, i) => (
        <li key={it.id}>
          <button type="button" onClick={() => onPick(i)} className="flex w-full items-center gap-3 px-4 py-2 text-left active:bg-fill">
            <Avatar user={it.user} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-semibold">{it.user.name}</span>
              <span className="block truncate text-[14px] text-muted">{it.context}</span>
            </span>
            <span className="shrink-0 text-[14px] tabular-nums text-muted">{fmt(it.duration)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Finished({ s, onDone }) {
  const listened = Math.max(1, Math.round(s.listened))
  const saved = Math.max(0, Math.round(s.original - s.listened))
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <CheckBadge />
      <div className="mt-5 text-[28px] font-bold">{t('allCaughtUp')}</div>
      {s.heard > 0 && <div className="mt-2 text-[17px] text-muted">{t('notesIn', { n: s.heard, time: fmt(listened) })}</div>}
      {saved >= 3 && (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.15 }}
          className="mt-6 rounded-[20px] bg-accent-soft px-6 py-4">
          <div className="text-[34px] font-bold tabular-nums text-accent">{fmt(saved)}</div>
          <div className="text-[15px] font-medium text-accent">{t('saved')}</div>
        </motion.div>
      )}
      <Button className="mt-10 h-[50px] w-full max-w-[320px]" onClick={onDone}>{t('done')}</Button>
    </div>
  )
}

function CheckBadge() {
  return (
    <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING} className="grid h-20 w-20 place-items-center rounded-full bg-accent text-white">
      <Icon.Check size={40} />
    </motion.div>
  )
}

export function Faces({ users, size = 32, max = 4 }) {
  const seen = [], out = []
  for (const u of users) if (!seen.includes(u.handle)) { seen.push(u.handle); out.push(u) }
  return (
    <span className="flex" aria-hidden="true">
      {out.slice(0, max).map((u, i) => (
        <span key={u.handle} className="rounded-full ring-[3px] ring-[var(--ring-bg,var(--bg))]" style={{ marginLeft: i ? -size * 0.3 : 0, zIndex: max - i }}><Avatar user={u} size={size} /></span>
      ))}
    </span>
  )
}

/** The card at the top of the feed: who's waiting, how long it takes, one tap to listen */
export function CatchUpCard({ active }) {
  const { openCatchUp } = useApp()
  const res = useResource('/unheard', { poll: 30000, active })
  const s = useCatchUp()
  const items = res.data?.items || []
  if (!items.length || (s.active && !s.finished)) return null
  const total = items.reduce((a, x) => a + x.duration, 0)
  const go = () => { startCatchUp(items); openCatchUp() }
  const people = []
  for (const it of items) if (!people.some(u => u.handle === it.user.handle)) people.push(it.user)
  return (
    <motion.section layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING} className="mt-2">
      <button type="button" onClick={go} className="flex w-full items-center gap-4 rounded-[20px] bg-surface p-4 text-left active:scale-[0.99]" style={{ '--ring-bg': 'var(--surface)' }}>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-white"><Icon.Play size={26} className="ml-1" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[20px] font-bold leading-tight">{t('catchUp')}</span>
          <span className="block truncate text-[15px] text-muted">{t('nVoiceNotes', { n: items.length })} · {t('aboutMin', { m: Math.max(1, Math.round(total / 1.25 / 60)) })}</span>
        </span>
        {people.length === 1 && <Faces users={people} size={30} max={1} />}
      </button>
      {people.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4">
          {people.map(u => {
            const mine = items.filter(i => i.user.handle === u.handle)
            return (
              <button key={u.handle} type="button" onClick={() => { startCatchUp(mine); openCatchUp() }} className="flex w-[66px] shrink-0 flex-col items-center gap-1" aria-label={t('catchUpWith', { name: u.name, n: mine.length })}>
                <Avatar user={u} size={58} ring />
                <span className="w-full truncate text-center text-[13px]">{u.name.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      )}
    </motion.section>
  )
}

export const unheardCount = () => peek('/unheard')?.items?.length || 0
