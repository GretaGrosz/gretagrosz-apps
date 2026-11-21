// Voice-only chats: friends and groups, each a walkie-talkie conversation you hold to talk in.
// Search finds anything anyone said (from the captions).
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { mutate, peek, revalidate, useResource } from './store.js'
import { discard, enqueue, onSent, retry, useOutbox } from './outbox.js'
import { coolMic, pause, play, playerState, usePlayer, startRecording, canRecord, MAX_SECONDS } from './audio.js'
import { t } from './i18n.js'
import { ReportSheet, useBlock } from './Safety.jsx'
import { shareInvite } from './People.jsx'
import { ActionSheet, Avatar, Button, Caption, Empty, Group, Icon, Loadable, Page, PlayButton, Row, SPRING, Sheet, SheetHeader, Spinner, Waveform, dayLabel, fmt, timeAgo, toast, useApp, useInterval } from './ui.jsx'

const GROUP_EMOJIS = ['💬', '🎉', '🔥', '🎮', '⚽️', '🎵', '🍕', '👯', '📚', '🌴']

export default function Chats({ active, selected }) {
  const { openChat, openGroup, me } = useApp()
  const res = useResource('/chats', { poll: 8000, active })
  const [making, setMaking] = useState(false)
  const [q, setQ] = useState('')
  const chats = res.data?.chats
  return (
    <div className="pb-40 lg:pb-10">
      <header className="glass-bar sticky top-0 z-20 -mx-4 px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))]">
        <div className="flex h-11 items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-[-0.01em]">{t('tabChats')}</h1>
          <button type="button" onClick={() => setMaking(true)} className="-mr-2 grid h-11 w-11 place-items-center text-accent" aria-label={t('newGroup')}><Icon.NewGroup size={25} /></button>
        </div>
        <label className="mt-1 flex h-10 items-center gap-2 rounded-[10px] bg-fill px-2.5">
          <Icon.Search size={18} className="text-muted" />
          <input value={q} onChange={e => setQ(e.target.value)} type="search" enterKeyHint="search" placeholder={t('searchSaid')} aria-label={t('searchSaid')}
            className="h-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => setQ('')} className="-mr-1 grid h-10 w-10 place-items-center text-muted" aria-label={t('clear')}><Icon.Close size={16} /></button>}
        </label>
      </header>
      {q.trim().length >= 2 ? <SearchResults q={q.trim()} /> : (
        <Loadable res={res}>
          {() => (
            <div className="-mx-4 mt-1">
              {chats.map(c => {
                const g = c.group, who = c.user || g
                const isSel = selected && (g ? selected.groupId === g.id : selected.handle === c.user.handle)
                return (
                  <button key={g ? 'g' + g.id : c.user.handle} type="button" onClick={() => (g ? openGroup(g.id) : openChat(c.user.handle))}
                    aria-current={isSel ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill ${isSel ? 'bg-fill' : ''}`}>
                    <Avatar user={who} size={52} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">{who.name}</span>
                        {c.lastDuration != null && <span className="shrink-0 text-[14px] text-muted">{timeAgo(c.lastAt)}</span>}
                      </div>
                      <div className={`mt-0.5 flex items-center gap-1 text-[15px] ${c.unread ? 'font-semibold text-label' : 'text-muted'}`}>
                        {c.lastDuration != null ? (
                          <>
                            <Icon.Mic size={15} className="shrink-0" />
                            <span className="truncate">{c.unread ? t('nNewVoice', { n: c.unread }) : `${c.lastMine ? t('you') : g ? c.lastName.split(' ')[0] : t('voiceMessage')} · ${fmt(c.lastDuration)}`}</span>
                          </>
                        ) : <span className="truncate">{g ? t('nPeople', { n: g.members }) : '@' + c.user.handle}</span>}
                      </div>
                    </div>
                    {c.unread > 0 && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" aria-label={t('unheard')} />}
                  </button>
                )
              })}
              {!chats.some(c => c.user) && (
                <Empty icon={<Icon.Chat size={34} />} title={t('noFriendsYet')}>
                  <Button className="mt-5 h-11 px-5" onClick={() => shareInvite(me)}><Icon.Share size={18} /> {t('inviteFriends')}</Button>
                </Empty>
              )}
            </div>
          )}
        </Loadable>
      )}
      <NewGroup open={making} onClose={() => setMaking(false)} onMade={g => { setMaking(false); revalidate('/chats'); openGroup(g.id) }} />
    </div>
  )
}

/** Matches in everything said (captions) in your chats, groups and friends' yaps; tap to open it there */
function SearchResults({ q }) {
  const { openChat, openGroup, openThread } = useApp()
  const [state, setState] = useState({ q: '', results: null, error: false })
  useEffect(() => {
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      api('/search?q=' + encodeURIComponent(q), { signal: ctrl.signal })
        .then(d => setState({ q, results: d.results, error: false }))
        .catch(e => e.name !== 'AbortError' && setState({ q, results: null, error: true }))
    }, 250)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q])
  if (state.error) return <div className="py-14 text-center text-[16px] text-muted">{t('couldntLoad')}</div>
  if (!state.results) return <div className="grid place-items-center py-14 text-muted"><Spinner /></div>
  if (!state.results.length) return <div className="py-14 text-center text-[16px] text-muted">{t('noMatches', { q })}</div>
  const open = r => (r.kind === 'group' ? openGroup(r.ctx.groupId) : r.kind === 'dm' ? openChat(r.ctx.handle) : openThread(r.ctx.postId))
  return (
    <div className="-mx-4 mt-1">
      {state.results.map(r => {
        const where = r.kind === 'group' ? { name: r.ctx.name, emoji: r.ctx.emoji } : r.kind === 'dm' ? r.ctx.with : r.user
        return (
          <button key={r.kind + r.id} type="button" onClick={() => open(r)} className="flex w-full items-start gap-3 px-4 py-2.5 text-left active:bg-fill">
            <Avatar user={where} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{where.name}</span>
                <span className="shrink-0 text-[14px] text-muted">{timeAgo(r.created)}</span>
              </div>
              <p className="line-clamp-2 text-[15px] text-muted">
                {r.kind !== 'dm' || r.mine ? <span className="text-label">{r.mine || r.mineAuthor ? t('you') : r.user.name.split(' ')[0]}: </span> : null}
                <Snippet text={r.snippet} />
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
const Snippet = ({ text }) => String(text || '').split(/(\u0002[^\u0003]*\u0003)/).map((part, i) =>
  part.startsWith('\u0002') ? <mark key={i} className="rounded-[3px] bg-accent-soft px-0.5 font-semibold text-label">{part.slice(1, -1)}</mark> : <span key={i}>{part}</span>)

/** Pick friends (and optionally a name) for a new group */
function NewGroup({ open, onClose, onMade }) {
  const { me } = useApp()
  const res = useResource(open ? '/friends' : null)
  const [picked, setPicked] = useState([])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0])
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setPicked([]); setName(''); setEmoji(GROUP_EMOJIS[0]) } }, [open])
  const toggle = h => setPicked(p => (p.includes(h) ? p.filter(x => x !== h) : [...p, h]))
  const create = async () => {
    setBusy(true)
    try { onMade((await api('/groups', { method: 'POST', body: { members: picked, name, emoji } })).group) } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const friends = res.data?.friends
  return (
    <Sheet open={open} onClose={onClose} full label={t('newGroup')}>
      <SheetHeader title={t('newGroup')} onClose={onClose}
        right={<button type="button" disabled={picked.length < 2 || busy} onClick={create} className="h-11 px-2 text-[17px] font-semibold text-accent disabled:opacity-30">{busy ? <Spinner /> : t('create')}</button>} />
      <div className="flex-1 overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mt-3 flex items-center gap-3">
          <Avatar user={{ emoji }} size={56} />
          <input value={name} onChange={e => setName(e.target.value)} maxLength={30} placeholder={t('groupName')} aria-label={t('groupName')}
            className="h-12 min-w-0 flex-1 rounded-[12px] bg-surface px-4 text-[17px] outline-none placeholder:text-muted" />
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-1 overflow-x-auto px-4" role="radiogroup" aria-label={t('groupPicture')}>
          {GROUP_EMOJIS.map(e => (
            <button key={e} type="button" role="radio" aria-checked={emoji === e} onClick={() => setEmoji(e)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] text-[22px] ${emoji === e ? 'bg-accent-soft ring-2 ring-accent' : ''}`}>{e}</button>
          ))}
        </div>
        <Loadable res={res}>
          {() => friends.length < 2 ? (
            <div className="py-8 text-center">
              <div className="text-[17px] text-muted">{t('needTwoFriends')}</div>
              <Button className="mx-auto mt-4 h-11 px-5" onClick={() => { onClose(); shareInvite(me) }}><Icon.Share size={18} /> {t('inviteFriends')}</Button>
            </div>
          ) : (
            <Group title={t('nSelected', { n: picked.length })}>
              {friends.map(u => (
                <button key={u.handle} type="button" role="checkbox" aria-checked={picked.includes(u.handle)} onClick={() => toggle(u.handle)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left active:bg-fill">
                  <Avatar user={u} size={38} />
                  <span className="min-w-0 flex-1"><span className="block truncate text-[17px]">{u.name}</span><span className="block truncate text-[14px] text-muted">@{u.handle}</span></span>
                  {picked.includes(u.handle) && <Icon.Check size={20} className="text-accent" />}
                </button>
              ))}
            </Group>
          )}
        </Loadable>
      </div>
    </Sheet>
  )
}

/** One conversation: with a friend (`handle`) or a group (`groupId`). `pane` = shown beside the list on wide screens. */
export function ChatView({ handle, groupId, onBack, pane }) {
  const { openRecorder, openProfile } = useApp()
  const base = groupId ? `/groups/${groupId}` : `/chats/${handle}`
  const res = useResource(base)
  const data = res.data
  const [info, setInfo] = useState(false)
  const [older, setOlder] = useState({ busy: false, more: true })
  const [report, setReport] = useState(null)
  const [menu, setMenu] = useState(false)
  const [askBlock, blockSheet] = useBlock(onBack)
  const scroller = useRef(null)
  const stick = useRef(true)
  const pending = useOutbox(r => r.path === base)
  const msgs = data?.messages || []
  const user = data?.user, group = data?.group

  useEffect(() => { if (res.error && res.error.status >= 400 && res.error.status < 500) { toast(res.error.message, 'error'); onBack() } }, [res.error])
  // Leaving the chat lets go of the microphone at once
  useEffect(() => () => coolMic(), [])
  useEffect(() => { if (data) setOlder(o => ({ ...o, more: o.more && data.more !== false })) }, [!!data])

  const setMsgs = fn => mutate(base, d => ({ ...d, messages: fn(d.messages) }))
  const markHeard = m => {
    if (m.mine || m.heard) return
    setMsgs(list => list.map(x => (x.id === m.id || (groupId && !x.mine && x.created <= m.created) ? { ...x, heard: true } : x)))
    const req = groupId ? api(`${base}/heard`, { method: 'POST', body: { at: m.created } }) : api(`/messages/${m.id}/heard`, { method: 'POST' })
    req.then(() => { revalidate('/me'); revalidate('/chats'); revalidate('/unheard') }).catch(() => {})
  }
  const toItem = m => ({ id: m.id, audio: m.audio, fx: m.fx, duration: m.duration, words: m.words, transcript: m.transcript, user: m.mine ? null : m.user || user, context: group?.name, onStart: () => markHeard(m) })

  // Walkie-talkie: new voice messages arrive every couple of seconds and play by themselves
  useInterval(async () => {
    if (!data) return
    const last = msgs[msgs.length - 1]
    try {
      const d = await api(`${base}?after=${last ? last.created : 0}`)
      const known = new Set((peek(base)?.messages || []).map(x => x.id))
      const fresh = d.messages.filter(m => !known.has(m.id))
      if (fresh.length || d.status) {
        setMsgs(list => [...list.map(x => (d.status?.[x.id] ? { ...x, ...d.status[x.id] } : x)), ...fresh])
      }
      const theirs = fresh.filter(m => !m.mine && !m.heard)
      if (theirs.length && !playerState().playing && document.visibilityState === 'visible') play(toItem(theirs[0]), { next: theirs.slice(1).map(toItem) })
    } catch {}
  }, 2500, !!data)

  // Captions arrive a few seconds after a message; ask for just those
  useInterval(async () => {
    const waiting = msgs.filter(m => !m.transcript && Date.now() - m.created < 90_000).map(m => m.id)
    if (!waiting.length) return
    try {
      const { captions } = await api('/captions?m=' + waiting.join(','))
      if (Object.keys(captions).length) setMsgs(list => list.map(x => (captions[x.id] ? { ...x, ...captions[x.id] } : x)))
    } catch {}
  }, 3000, msgs.some(m => !m.transcript && Date.now() - m.created < 90_000))

  // A queued clip that reached the server becomes a normal message
  useEffect(() => onSent((rec, d) => {
    if (rec.path !== base || !d?.message) return
    setMsgs(list => (list.some(x => x.id === d.message.id) ? list : [...list, d.message]))
    revalidate('/chats')
  }), [base])

  const loadOlder = async () => {
    if (older.busy || !older.more || !msgs.length) return
    setOlder(o => ({ ...o, busy: true }))
    const el = scroller.current, before = el?.scrollHeight || 0
    try {
      const d = await api(`${base}?before=${msgs[0].created}`)
      setMsgs(list => [...d.messages.filter(m => !list.some(x => x.id === m.id)), ...list])
      setOlder({ busy: false, more: d.more })
      requestAnimationFrame(() => { if (el) el.scrollTop += el.scrollHeight - before })
    } catch { setOlder(o => ({ ...o, busy: false })) }
  }

  // Stay at the bottom as messages come in (unless you scrolled up to read)
  useLayoutEffect(() => {
    const el = scroller.current
    if (el && stick.current) el.scrollTop = el.scrollHeight
  }, [msgs.length, pending.length, !!data])
  const onScroll = () => {
    const el = scroller.current
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (el.scrollTop < 200) loadOlder()
  }

  const send = async clip => { stick.current = true; await enqueue(base, clip, { kind: groupId ? 'group' : 'dm' }) }
  const withEffects = () => openRecorder(groupId ? { kind: 'group', group } : { kind: 'dm', user }, () => {})
  const who = user || group

  return (
    <Page
      onBack={onBack}
      label={who?.name}
      pane={pane}
      right={data && (
        <button type="button" onClick={() => (group ? setInfo(true) : setMenu(true))} className="grid h-11 w-11 place-items-center text-accent" aria-label={group ? t('groupInfo') : t('more')}>
          <Icon.Dots size={22} />
        </button>
      )}
      title={data && (
        <button type="button" onClick={() => (group ? setInfo(true) : openProfile(user.handle))} className="flex min-w-0 items-center gap-2.5 text-left">
          <Avatar user={who} size={34} />
          <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold leading-tight">{who.name}</div>
            <div className="truncate text-[13px] text-muted">{group ? t('nPeople', { n: group.members.length }) : '@' + user.handle}</div>
          </div>
        </button>
      )}
    >
      <div ref={scroller} onScroll={onScroll} className="min-h-0 flex-1 overflow-y-auto px-3 pt-2">
        <Loadable res={res}>
          {() => (
            <div className="flex min-h-full flex-col justify-end gap-1.5 pb-3">
              {older.more && msgs.length >= 50 && <div className="grid h-10 place-items-center text-muted">{older.busy && <Spinner />}</div>}
              {msgs.length === 0 && !pending.length && (
                <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                  <Avatar user={who} size={88} />
                  <div className="mt-3 text-[22px] font-bold">{who.name}</div>
                  <div className="text-[15px] text-muted">{group ? t('nPeople', { n: group.members.length }) : '@' + user.handle}</div>
                </div>
              )}
              {msgs.map((m, i) => {
                const prev = msgs[i - 1]
                const newDay = i === 0 || new Date(m.created).toDateString() !== new Date(prev.created).toDateString()
                const showName = group && !m.mine && (newDay || prev.user?.handle !== m.user?.handle)
                return (
                  <div key={m.id} className="flex flex-col">
                    {newDay && <div className="my-3 text-center text-[13px] font-medium text-muted">{dayLabel(m.created)}</div>}
                    {showName && <div className="mb-0.5 ml-3 mt-1 text-[13px] text-muted">{m.user.name}</div>}
                    <Bubble m={m} group={!!group} item={toItem(m)} next={msgs.slice(i + 1).filter(x => !x.mine).map(toItem)}
                      onMenu={() => !m.mine && setReport({ kind: 'message', id: m.id, user: m.user || user })} />
                  </div>
                )
              })}
              {pending.map(r => <LocalBubble key={r.cid} r={r} />)}
            </div>
          )}
        </Loadable>
      </div>
      {data && <HoldToTalk onClip={send} onEffects={withEffects} hotkey label={t('holdToTalk')} />}
      {group && <GroupInfo open={info} group={group} onClose={() => setInfo(false)} onChanged={() => revalidate(base)} onLeft={onBack} />}
      <ReportSheet target={report} onClose={() => setReport(null)} onDone={({ blocked }) => blocked && !group && onBack()} />
      {blockSheet}
      {user && <ActionSheet open={menu} onClose={() => setMenu(false)} actions={[
        { label: t('viewProfile'), onClick: () => openProfile(user.handle) },
        { label: t('reportName', { name: user.name }), onClick: () => setReport({ kind: 'user', user }) },
        { label: t('blockName', { name: user.name }), destructive: true, onClick: () => askBlock(user) },
      ]} />}
    </Page>
  )
}

/** A recording on its way: "Sending", or "Not sent · Tap to retry" */
function LocalBubble({ r }) {
  const [menu, setMenu] = useState(false)
  const failed = r.status === 'failed'
  return (
    <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={SPRING} className="flex flex-col items-end">
      <button type="button" onClick={() => failed && setMenu(true)} disabled={!failed}
        className={`flex max-w-[82%] items-center gap-2.5 rounded-[22px] py-2 pl-2 pr-3.5 text-white ${failed ? 'bg-[var(--red)]' : 'bg-accent/70'}`}
        style={{ width: Math.min(100, 60 + r.duration * 2) + '%' }}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/25">{failed ? <span className="text-[17px] font-bold">!</span> : <Spinner size={16} />}</span>
        <span className="flex h-[26px] min-w-0 flex-1 items-center gap-[2px]">{r.wave.map((v, i) => <span key={i} className="flex-1 rounded-full bg-white/55" style={{ height: Math.max(10, v) + '%' }} />)}</span>
        <span className="shrink-0 text-[14px] font-medium tabular-nums">{fmt(r.duration)}</span>
      </button>
      {failed
        ? <button type="button" onClick={() => setMenu(true)} className="hit-y mr-2 mt-0.5 text-[12px] font-semibold text-[var(--red)]">{r.error || t('notSentTap')}</button>
        : <span className="mr-2 mt-0.5 text-[12px] text-muted">{t('sending')}</span>}
      <ActionSheet open={menu} onClose={() => setMenu(false)} title={r.error || t('notSent')} actions={[
        !r.error && { label: t('tryAgain'), onClick: () => retry(r.cid) },
        { label: t('deleteRecording'), destructive: true, onClick: () => discard(r.cid) },
      ]} />
    </motion.div>
  )
}

/**
 * Press and hold to record, let go to send, slide away to cancel. On a keyboard, hold Space.
 * `onEffects` adds the button for the recorder with voice effects. `onStart` runs when recording begins.
 */
export function HoldToTalk({ onClip, onEffects, label, onStart, hotkey = false, bare = false }) {
  const [phase, setPhase] = useState('idle')
  const [elapsed, setElapsed] = useState(0)
  const [armed, setArmed] = useState(false)
  const rec = useRef(null)
  const held = useRef(false)
  const origin = useRef(null)
  const cancelArmed = useRef(false)
  const bars = useRef(null)

  const begin = async origin_ => {
    if (phase !== 'idle') return
    if (!canRecord()) return toast(t('cantRecord'), 'error')
    held.current = true
    cancelArmed.current = false
    setArmed(false)
    origin.current = origin_
    pause()
    onStart?.()
    setPhase('starting')
    try {
      const r = await startRecording()
      if (!held.current) { r.cancel(); setPhase('idle'); return toast(t('holdWhileTalking')) }
      rec.current = r
      setPhase('recording')
      navigator.vibrate?.(15)
    } catch (err) {
      held.current = false
      setPhase('idle')
      toast(t(err.code || 'cantRecord'), 'error')
    }
  }
  const down = e => {
    if (e.button > 0) return
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
    begin({ x: e.clientX, y: e.clientY })
  }
  const move = e => {
    if (!held.current || !origin.current) return
    const far = Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > 90
    if (far !== cancelArmed.current) { cancelArmed.current = far; setArmed(far); navigator.vibrate?.(8) }
  }
  const release = async (cancel = false) => {
    if (!held.current) return
    held.current = false
    const r = rec.current
    rec.current = null
    if (!r) return
    if (cancel || cancelArmed.current) { r.cancel(); setPhase('idle'); return }
    if (r.elapsed() < 0.6) { r.cancel(); setPhase('idle'); return toast(t('holdToRecord')) }
    setPhase('sending')
    try { await onClip(await r.stop()) } catch (err) { toast(t(err.code || 'cantRecord'), 'error') }
    setPhase('idle')
  }
  const releaseRef = useRef(release)
  releaseRef.current = release

  useEffect(() => () => { held.current = false; rec.current?.cancel() }, [])

  // Hold Space to talk (when no text field is focused)
  useEffect(() => {
    if (!hotkey) return
    const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
    const kd = e => { if (e.code === 'Space' && !e.repeat && !typing()) { e.preventDefault(); begin(null) } else if (e.code === 'Escape' && held.current) { e.stopPropagation(); releaseRef.current(true) } }
    const ku = e => { if (e.code === 'Space' && held.current) { e.preventDefault(); releaseRef.current() } }
    window.addEventListener('keydown', kd, true)
    window.addEventListener('keyup', ku, true)
    return () => { window.removeEventListener('keydown', kd, true); window.removeEventListener('keyup', ku, true) }
  }, [hotkey, phase])

  // Timer and live level bars while recording
  useEffect(() => {
    if (phase !== 'recording') return
    let raf
    const loop = () => {
      const r = rec.current
      if (!r) return
      const tt = r.elapsed()
      setElapsed(tt)
      const el = bars.current?.children, s = r.samples
      if (el) for (let i = 0; i < el.length; i++) el[i].style.height = Math.max(8, Math.min(100, (s[s.length - el.length + i] ?? 0) * 140)) + '%'
      if (tt >= MAX_SECONDS) return releaseRef.current()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  const live = phase === 'recording'
  return (
    <div className={`relative ${bare ? '' : 'border-t border-line bg-bg px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3'}`}>
      <AnimatePresence>
        {live && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={SPRING}
            className="pointer-events-none absolute inset-x-4 bottom-full mb-3 flex items-center gap-3 rounded-[18px] bg-elevated px-4 py-3 shadow-xl" role="status">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${armed ? 'bg-muted' : 'bg-[var(--red)] motion-safe:animate-pulse'}`} />
            <span className="w-11 shrink-0 text-[17px] font-semibold tabular-nums">{fmt(elapsed)}</span>
            <div ref={bars} className="flex h-7 min-w-0 flex-1 items-center gap-[2px]">
              {Array.from({ length: 28 }, (_, i) => <span key={i} className={`flex-1 rounded-full ${armed ? 'bg-muted' : 'bg-label'}`} style={{ height: '8%' }} />)}
            </div>
            <span className={`shrink-0 text-[14px] ${armed ? 'font-semibold text-[var(--red)]' : 'text-muted'}`}>{armed ? t('releaseToCancel') : t('slideToCancel')}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2.5">
        {onEffects && (
          <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={onEffects} disabled={phase !== 'idle'} className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-fill disabled:opacity-40" aria-label={t('recordWithEffects')}>
            <Icon.Waveform size={22} />
          </motion.button>
        )}
        <motion.button
          type="button"
          animate={{ scale: live ? [1, 1.07, 1.03] : phase === 'starting' ? 0.97 : 1 }}
          transition={live ? { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] } : SPRING}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={() => release()}
          onPointerCancel={() => release(true)}
          onKeyDown={e => { if ((e.key === 'Enter') && !e.repeat) { e.preventDefault(); begin(null) } }}
          onKeyUp={e => { if (e.key === 'Enter') release() }}
          onContextMenu={e => e.preventDefault()}
          style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
          className={`flex h-[50px] flex-1 items-center justify-center gap-2 rounded-full text-[17px] font-semibold text-white transition-colors ${armed ? 'bg-[var(--label-3)]' : 'bg-accent'}`}
          aria-label={label}
        >
          {phase === 'starting' || phase === 'sending' ? <Spinner /> : <Icon.MicFill size={21} />}
          <span className="truncate">{phase === 'sending' ? t('sending') : live ? (armed ? t('releaseToCancel') : t('releaseToSend')) : label}</span>
        </motion.button>
      </div>
    </div>
  )
}

function GroupInfo({ open, group, onClose, onChanged, onLeft }) {
  const { me, openProfile } = useApp()
  const [adding, setAdding] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const friends = useResource(adding ? '/friends' : null)
  const inGroup = new Set(group.members.map(u => u.handle))
  const add = async u => {
    try {
      await api(`/groups/${group.id}/members`, { method: 'POST', body: { members: [u.handle] } })
      onChanged()
      toast(t('addedName', { name: u.name }))
    } catch (e) { toast(e.message, 'error') }
  }
  const leave = async () => {
    try { await api(`/groups/${group.id}`, { method: 'DELETE' }); onClose(); revalidate('/chats'); onLeft() } catch (e) { toast(e.message, 'error') }
  }
  const candidates = (friends.data?.friends || []).filter(u => !inGroup.has(u.handle))
  return (
    <Sheet open={open} onClose={() => { setAdding(false); onClose() }} label={group.name}>
      <div className="max-h-[80dvh] overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
        <div className="flex flex-col items-center text-center">
          <Avatar user={group} size={72} />
          <div className="mt-2 text-[22px] font-bold">{group.name}</div>
          <div className="text-[15px] text-muted">{t('nPeople', { n: group.members.length })}</div>
        </div>
        <Group>
          {group.members.map(u => (
            <button key={u.handle} type="button" onClick={() => { onClose(); u.handle !== me.handle && openProfile(u.handle) }} className="flex min-h-[54px] w-full items-center gap-3 px-4 text-left active:bg-fill">
              <Avatar user={u} size={36} />
              <span className="min-w-0 flex-1"><span className="block truncate text-[17px]">{u.handle === me.handle ? t('you') : u.name}</span><span className="block truncate text-[14px] text-muted">@{u.handle}</span></span>
            </button>
          ))}
        </Group>
        {adding ? (
          <Group title={t('addFriends')}>
            {friends.data ? (candidates.length ? candidates.map(u => (
              <div key={u.handle} className="flex min-h-[54px] items-center gap-3 px-4">
                <Avatar user={u} size={34} />
                <span className="min-w-0 flex-1 truncate text-[17px]">{u.name}</span>
                <Button kind="tinted" className="h-9 px-4 text-[15px]" onClick={() => add(u)}>{t('add')}</Button>
              </div>
            )) : <div className="px-4 py-3 text-[15px] text-muted">{t('allFriendsHere')}</div>) : <div className="grid place-items-center py-4"><Spinner /></div>}
          </Group>
        ) : (
          <Group><Row icon={<Icon.Plus size={20} />} title={t('addFriends')} onClick={() => setAdding(true)} chevron={false} /></Group>
        )}
        <Group><Row icon={<Icon.Leave size={20} />} title={t('leaveGroup')} destructive onClick={() => setConfirmLeave(true)} chevron={false} /></Group>
      </div>
      <ActionSheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title={t('leaveQ', { name: group.name })} actions={[{ label: t('leaveGroup'), destructive: true, onClick: leave }]} />
    </Sheet>
  )
}

function Bubble({ m, item, next, group, onMenu }) {
  const p = usePlayer()
  const active = p.item?.id === m.id
  const unheard = !m.mine && !m.heard
  const status = m.mine ? (group ? (m.heardBy ? t('heardBy', { n: m.heardBy }) : t('sent')) : m.heard ? t('played') : t('sent')) : null
  const press = useRef(0)
  const startPress = () => { clearTimeout(press.current); press.current = setTimeout(() => { navigator.vibrate?.(10); onMenu() }, 550) }
  const endPress = () => clearTimeout(press.current)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}
      onContextMenu={e => { if (!m.mine) { e.preventDefault(); onMenu() } }}
      onPointerDown={m.mine ? undefined : startPress} onPointerUp={endPress} onPointerLeave={endPress} onPointerCancel={endPress}
      className={`flex max-w-[82%] flex-col rounded-[22px] py-1.5 pl-1.5 pr-3.5 ${m.mine ? 'self-end bg-accent text-white' : 'self-start bg-surface'}`}
      style={{ width: Math.min(100, 60 + m.duration * 2) + '%' }}
    >
      <div className="flex items-center gap-2">
        <PlayButton item={item} next={next} size={36} tone={m.mine ? 'onAccent' : 'label'} />
        <Waveform id={m.id} wave={m.wave} height={26} played={m.mine ? '#FFFFFF' : 'var(--label)'} idle={m.mine ? 'rgba(255,255,255,.45)' : 'var(--wave-idle)'} />
        <div className="flex shrink-0 flex-col items-end leading-tight">
          <span className="text-[14px] font-medium tabular-nums">{fmt(active ? m.duration * (1 - p.progress) : m.duration)}</span>
          <span className={`text-[12px] ${m.mine ? 'text-white/80' : 'text-muted'}`}>
            {status || (unheard ? <span className="font-semibold text-accent">{t('new')}</span> : timeAgo(m.created))}
          </span>
        </div>
      </div>
      <Caption text={m.transcript} color={m.mine ? 'text-white/90' : 'text-muted'} className="px-1.5 pb-0.5 pt-1" />
    </motion.div>
  )
}
