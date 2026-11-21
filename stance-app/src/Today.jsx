// Today: the daily question. Take a side, make your case, then read everyone else's, argue back against the
// strongest case for the other side, and see the debates. The same view serves past questions and the archive.
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, useLoad } from './api.js'
import { dayText, t, todayKey } from './i18n.js'
import { DebateCard } from './Debates.jsx'
import { Actions, Clamp, Confirm, OpinionCard, OpinionPage, SwitchedSheet } from './today-opinion.jsx'
import { Button, Card, Empty, Icon, IconButton, LargeTitle, LoadError, Page, Segmented, SectionTitle, SideTag, Spinner, SplitBar, TextArea, spring, useApp } from './ui.jsx'

export { OpinionCard, OpinionPage }

const LIMIT = [20, 1500]
const SWITCH_WINDOW = 10 * 60_000

// Unposted arguments survive closing the app
const draftKey = id => 'stance.draft.' + id
const readDraft = id => { try { return JSON.parse(localStorage.getItem(draftKey(id))) || {} } catch { return {} } }
const writeDraft = (id, d) => { try { d ? localStorage.setItem(draftKey(id), JSON.stringify(d)) : localStorage.removeItem(draftKey(id)) } catch {} }

/** A question payload (today's when id is null), cached so it shows at once */
function useQuestion(id) {
  const { refresh } = useApp()
  const [sort, setSort] = useState('top')
  const q = useLoad(`q.${id || 'today'}`, `${id ? `/questions/${id}` : '/today'}?sort=${sort}`, [refresh, sort])
  return { ...q, sort, changeSort: setSort }
}

export default function Today() {
  const { openArchive } = useApp()
  const state = useQuestion(null)
  const d = state.data
  const streak = d?.streak?.days || 0
  return (
    <>
      <LargeTitle title={t('today.title')}
        subtitle={<>
          <span className="truncate">{d ? `${t('today.no', { n: d.question.number })} · ${dayText(d.question.day)}` : dayText(todayKey())}</span>
          {streak > 1 && <span className="flex shrink-0 items-center gap-0.5 text-accent-ink" aria-label={t('today.streak', { n: streak })}><Icon.Flame size={14} />{streak}</span>}
        </>}
        right={<IconButton label={t('archive.title')} onClick={openArchive} className="mb-0.5 !bg-surface !shadow-none"><Icon.Archive size={21} /></IconButton>} />
      <QuestionView state={state} today />
    </>
  )
}

/** Any question by id, from the archive or a link; opinionId scrolls to and highlights that argument */
export function QuestionPage({ id, opinionId, onBack, covered }) {
  const state = useQuestion(id)
  const q = state.data?.question
  return (
    <Page covered={covered} onBack={onBack} title={q?.title || ''}>
      {q && (
        <div className="px-5 pb-3 pt-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-fg2">
          {t('today.no', { n: q.number })} · {state.data.isToday ? t('time.today') : dayText(q.day)}
        </div>
      )}
      <QuestionView state={state} focus={opinionId} />
    </Page>
  )
}

function QuestionView({ state, focus, today = false }) {
  const { data, setData, error, reload, sort, changeSort, loading } = state
  const [lit, setLit] = useState(null)
  const scrolled = useRef(false)
  const root = useRef(null)

  // Deep link to one argument: scroll there once and outline it briefly
  useEffect(() => {
    if (!focus || !data?.mine || scrolled.current) return
    const el = root.current?.querySelector(`[data-op="${focus}"]`)
    if (!el) return
    scrolled.current = true
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)
    setLit(focus)
    setTimeout(() => setLit(null), 2600)
  }, [focus, data])

  if (!data) {
    return error ? <LoadError error={error} onRetry={reload} icon={<Icon.Today size={30} />} /> : <HeroSkeleton />
  }

  const { question: q, mine } = data
  // The payload already holds the fresh question; other screens reload when they open
  const posted = payload => setData(payload)

  return (
    <div ref={root} className="px-4">
      <Hero q={q} answered={!!mine} />
      <AnimatePresence mode="wait" initial={false}>
        {mine ? (
          <motion.div key="answered" initial="hidden" animate="show" exit={{ opacity: 0 }}
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } }}>
            <Rise><MyArgument data={data} onPayload={posted} lit={lit === mine.id} /></Rise>
            {data.total > 1 && <Rise><Split data={data} /></Rise>}
            <Rise><SparCard q={q} side={mine.side} /></Rise>
            <Rise><Arguments data={data} setData={setData} sort={sort} changeSort={changeSort} sorting={loading} lit={lit} /></Rise>
          </motion.div>
        ) : (
          <motion.div key="ask" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
            <Answer data={data} onPosted={posted} />
          </motion.div>
        )}
      </AnimatePresence>
      {today && <DebatesSection />}
    </div>
  )
}

const Rise = ({ children }) => (
  <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: spring } }}>{children}</motion.div>
)

/** The question itself: the star of the app */
function Hero({ q, answered }) {
  return (
    <Card className="px-6 pb-5 pt-6">
      <div className="text-[12.5px] font-semibold uppercase tracking-[0.08em] text-accent-ink">{q.title}</div>
      <h2 className="serif prose-wrap mt-2.5 text-[29px] font-medium leading-[1.17] text-fg">{q.question}</h2>
      {/* Once you've answered, the context steps back so the arguments come sooner */}
      <div className="mt-4"><Clamp key={String(answered)} text={q.context} lines={answered ? 3 : 20} className="text-[16px] leading-[1.5] text-fg2" /></div>
      {q.thinkers && (
        <div className="mt-4 flex items-baseline gap-2.5 border-t border-line pt-4">
          <span className="shrink-0 text-[12px] font-semibold uppercase tracking-[0.08em] text-fg2">{t('today.thinkers')}</span>
          <span className="serif text-[16px] italic text-fg">{q.thinkers}</span>
        </div>
      )}
    </Card>
  )
}

function HeroSkeleton() {
  return (
    <div className="px-4" aria-busy="true">
      <Card className="px-6 pb-7 pt-6">
        <div className="h-3 w-32 rounded-full bg-fill2" />
        <div className="mt-4 h-6 w-[92%] rounded-full bg-fill2" />
        <div className="mt-2.5 h-6 w-[70%] rounded-full bg-fill2" />
        <div className="mt-6 h-3 w-full rounded-full bg-fill" />
        <div className="mt-2 h-3 w-[88%] rounded-full bg-fill" />
        <div className="mt-2 h-3 w-[60%] rounded-full bg-fill" />
      </Card>
    </div>
  )
}

/** Before you've answered: pick a side, make your case. Guests can write; the account comes when they post. */
function Answer({ data, onPosted }) {
  const { question: q, total } = data
  const { toast, requireAccount } = useApp()
  const draft = useRef(readDraft(q.id)).current
  const [side, setSide] = useState(draft.side ?? null)
  const [text, setText] = useState(draft.text || '')
  const [busy, setBusy] = useState(false)
  useEffect(() => { writeDraft(q.id, side === null && !text ? null : { side, text }) }, [side, text])
  const short = LIMIT[0] - text.trim().length
  const ok = side !== null && short <= 0 && !busy

  const post = async () => {
    if (!ok) return
    try { await requireAccount() } catch { return }
    setBusy(true)
    try {
      const payload = await api(`/questions/${q.id}/opinion`, { method: 'POST', body: { side, text: text.trim() } })
      writeDraft(q.id, null)
      navigator.vibrate?.(12)
      onPosted(payload)
    } catch (e) { toast(e.message, 'error'); setBusy(false) }
  }

  return (
    <div>
      <h3 className="px-1 pb-3 pt-7 text-[22px] font-bold">{t('today.where')}</h3>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label={t('today.where')}>
        {q.sides.map((label, i) => <SideChoice key={i} label={label} on={side === i} onClick={() => setSide(i)} />)}
      </div>

      <AnimatePresence initial={false}>
        {side !== null && (
          <motion.div key="composer" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <Card className="mt-3 px-5 pb-4 pt-4">
              <TextArea value={text} onChange={setText} min={LIMIT[0]} max={LIMIT[1]} rows={4} onSubmit={post}
                placeholder={t('today.why', { side: q.sides[side] })} />
              <Button size="lg" className="mt-2 w-full" disabled={!ok} onClick={post}>
                {busy ? <Spinner /> : t('today.post')}
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout="position" transition={spring} className="mt-7 flex items-center gap-3 rounded-[22px] border border-dashed border-line px-5 py-4 text-[15px] font-semibold text-fg2">
        <Icon.Lock size={18} />
        <span>{total ? t('today.lockedCount', { n: total }) : t('today.lockedNone')}</span>
      </motion.div>
    </div>
  )
}

function SideChoice({ label, on, onClick }) {
  return (
    <motion.button type="button" role="radio" aria-checked={on} whileTap={{ scale: 0.97 }} transition={spring} onClick={onClick}
      className={`relative flex h-[104px] flex-col justify-between rounded-[22px] p-4 text-left transition-colors duration-200 ${on ? 'bg-accent text-white' : 'card text-fg'}`}>
      <span className={`grid h-6 w-6 place-items-center rounded-full transition-colors ${on ? 'bg-white text-accent' : 'border-[1.5px] border-fg2/60'}`}>
        {on && <Icon.Check size={15} />}
      </span>
      <span className="prose-wrap text-[19px] font-semibold leading-[1.15]">{label}</span>
    </motion.button>
  )
}

/** Your own argument: read it, edit it, take it back, or share the moment you changed your mind */
function MyArgument({ data, onPayload, lit }) {
  const { question: q, mine } = data
  const { toast } = useApp()
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setBusy(true)
    try {
      onPayload(await api(`/questions/${q.id}/opinion`, { method: 'DELETE' }))
      toast(t('today.deleted'))
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
    setDeleting(false)
  }

  return (
    <div className="pt-7">
      <h3 className="px-1 pb-3 text-[22px] font-bold">{t('today.yours')}</h3>
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div key="edit" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <EditArgument q={q} mine={mine} onCancel={() => setEditing(false)} onSaved={p => { setEditing(false); onPayload(p) }} />
          </motion.div>
        ) : (
          <motion.div key="view" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            <OpinionCard opinion={mine} question={q} onMenu={() => setMenu(true)} highlight={lit} />
            {mine.convincedBy && (
              <div className="flex gap-2 px-1 pt-2">
                <Button kind="gray" size="sm" onClick={() => setSharing(true)}><Icon.Share size={16} />{t('op.shareSwitch')}</Button>
                <Button kind="plain" size="sm" onClick={() => setEditing(true)}>{t('today.update')}</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Actions open={menu} onClose={() => setMenu(false)} items={[
        { label: t('today.edit'), icon: <Icon.Edit size={20} />, onClick: () => setEditing(true) },
        { label: t('today.delete'), icon: <Icon.Trash size={20} />, danger: true, onClick: () => setDeleting(true) },
      ]} />
      <Confirm open={deleting} onClose={() => setDeleting(false)} title={t('today.deleteQ')} action={t('today.delete')} danger busy={busy} onConfirm={remove} />
      <SwitchedSheet open={sharing} onClose={() => setSharing(false)} question={q} side={mine.side} by={mine.convincedBy} />
    </div>
  )
}

function EditArgument({ q, mine, onCancel, onSaved }) {
  const { toast } = useApp()
  const [text, setText] = useState(mine.text)
  const [side, setSide] = useState(mine.side)
  const [busy, setBusy] = useState(false)
  const left = Math.ceil((SWITCH_WINDOW - (Date.now() - mine.created)) / 60_000)
  const canSwitch = left > 0 && !mine.convincedBy
  const changed = text.trim() !== mine.text || side !== mine.side
  const ok = changed && text.trim().length >= LIMIT[0] && !busy

  const save = async () => {
    if (!ok) return
    setBusy(true)
    try { onSaved(await api(`/questions/${q.id}/opinion`, { method: 'POST', body: { side, text: text.trim() } })) }
    catch (e) { toast(e.message, 'error'); setBusy(false) }
  }

  return (
    <Card className="px-5 pb-4 pt-4">
      {canSwitch ? (
        <>
          <Segmented value={side} onChange={setSide} options={q.sides.map((label, i) => ({ id: i, label }))} label={t('today.where')} />
          <p className="mt-2 px-1 text-[13.5px] text-fg2">{t('today.switchLeft', { n: left })}</p>
        </>
      ) : <SideTag side={mine.side} label={q.sides[mine.side]} />}
      <TextArea value={text} onChange={setText} min={LIMIT[0]} max={LIMIT[1]} rows={3} autoFocus className="mt-3" onSubmit={save} label={t('today.yours')} />
      <div className="mt-2 flex gap-2">
        <Button kind="gray" size="md" className="flex-1" onClick={onCancel}>{t('ui.cancel')}</Button>
        <Button size="md" className="flex-1" disabled={!ok} onClick={save}>{busy ? <Spinner /> : t('ui.save')}</Button>
      </div>
    </Card>
  )
}

/** How everyone split, and where you sit in it */
function Split({ data }) {
  const { question: q, counts, total, mine } = data
  const a = total ? Math.round((counts[0] / total) * 100) : 0
  const others = counts[mine.side] - 1
  const against = counts[1 - mine.side]
  return (
    <Card className="mt-3 px-5 pb-4 pt-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[28px] font-bold leading-none text-accent-ink tabular-nums">{a}%</div>
          <div className="mt-1 truncate text-[13.5px] font-semibold text-accent-ink">{q.sides[0]} <span className="font-normal text-fg2">· {counts[0]}</span></div>
        </div>
        <div className="min-w-0 text-right">
          <div className="text-[28px] font-bold leading-none tabular-nums">{total ? 100 - a : 0}%</div>
          <div className="mt-1 truncate text-[13.5px] font-semibold"><span className="font-normal text-fg2">{counts[1]} · </span>{q.sides[1]}</div>
        </div>
      </div>
      <SplitBar counts={counts} />
      <p className="mt-3 text-[15px] leading-snug text-fg2">
        {others > 0 ? t('today.splitWith', { n: others, side: q.sides[mine.side] }) : t('today.splitAlone', { side: q.sides[mine.side] })}
        {' '}{t('today.splitAgainst', { n: against })}
      </p>
    </Card>
  )
}

/** The way into Argue back for this question, showing where your round stands */
function SparCard({ q, side }) {
  const { openSpar, refresh, me } = useApp()
  const { data } = useLoad(me ? `spar.${q.id}` : null, `/questions/${q.id}/spar`, [refresh])
  const s = data?.spar && data.spar.side === side ? data.spar : null
  let status
  if (!s) status = t('spar.against', { side: q.sides[1 - side] })
  else if (s.status === 'judged') status = t('spar.result.' + s.verdict.winner)
  else status = `${t('spar.round', { n: Math.min(3, s.yourTurns + (s.status === 'open' ? 1 : 0)) })} · ${s.status === 'open' ? t('spar.yourTurn') : t('spar.theirTurn')}`
  return (
    <motion.button type="button" whileTap={{ scale: 0.985 }} transition={spring} onClick={() => openSpar(q.id)}
      className="card mt-3 flex w-full items-center gap-3.5 rounded-[22px] py-3.5 pl-4 pr-3 text-left">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white"><Icon.Swords size={21} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold">{t('spar.title')}</span>
        <span className="block truncate text-[14.5px] text-fg2">{status}</span>
      </span>
      <Icon.Chevron size={16} className="shrink-0 text-fg2" />
    </motion.button>
  )
}

/** Everyone else's arguments, Top or New */
function Arguments({ data, setData, sort, changeSort, sorting, lit }) {
  const { question: q, opinions, mine } = data
  const update = o => setData(d => ({ ...d, opinions: d.opinions.map(x => (x.id === o.id ? o : x)) }))
  return (
    <div className="pt-7">
      <div className="flex min-h-[44px] items-center justify-between gap-3 px-1 pb-3">
        <h3 className="text-[22px] font-bold">{opinions.length ? t('today.args', { n: opinions.length }) : t('today.argsTitle')}</h3>
        {opinions.length > 1 && (
          <Segmented className="w-[150px]" value={sort} onChange={changeSort} options={[{ id: 'top', label: t('today.top') }, { id: 'new', label: t('today.new') }]} label={t('today.sort')} />
        )}
      </div>
      {opinions.length ? (
        <div className={`flex flex-col gap-3 transition-opacity ${sorting ? 'opacity-60' : ''}`}>
          <AnimatePresence initial={false}>
            {opinions.map(o => (
              <motion.div key={o.id} layout="position" transition={spring}>
                <OpinionCard opinion={o} question={q} mySide={mine.side} myText={mine.text} onChange={update} onConvinced={setData} highlight={lit === o.id} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <Card><Empty icon={<Icon.Quote size={28} />} title={t('today.first')} /></Card>
      )}
    </div>
  )
}

/** Debates live inside Today: what needs you, then open challenges, then what is live */
function DebatesSection() {
  const { me, refresh, openDebates, openNewDebate } = useApp()
  const mine = useLoad(me ? 'debates.mine' : null, '/debates?tab=mine', [refresh])
  const open = useLoad('debates.open', '/debates?tab=open', [refresh])
  const live = useLoad('debates.live', '/debates?tab=live', [refresh])
  const seen = new Set()
  const pick = list => (list || []).filter(d => !seen.has(d.id) && seen.add(d.id))
  const cards = [
    ...pick(mine.data?.debates.filter(d => d.needsMe)),
    ...pick(mine.data?.debates.filter(d => d.status === 'active' || d.status === 'declined')),
    ...pick(open.data?.debates.filter(d => !d.role)).slice(0, 2),
    ...pick(live.data?.debates).slice(0, 2),
  ].slice(0, 4)
  const loading = !open.data && !open.error
  return (
    <section className="pt-4">
      <SectionTitle className="!px-1" right={<Button kind="plain" size="sm" className="-mr-3" onClick={() => openDebates(mine.data?.debates.some(d => d.needsMe) ? 'mine' : undefined)}>{t('debates.all')}</Button>}>{t('debates.title')}</SectionTitle>
      {loading ? (
        <div className="grid place-items-center py-10 text-fg2"><Spinner size={22} /></div>
      ) : (
        <div className="flex flex-col gap-3">
          {cards.map(d => <DebateCard key={d.id} debate={d} />)}
          <Button kind="gray" size="lg" className="w-full" onClick={() => openNewDebate()}><Icon.Plus size={19} />{t('debates.new')}</Button>
        </div>
      )}
    </section>
  )
}

/** Every question asked so far, newest first */
export function Archive({ onBack, covered }) {
  const { openQuestion, refresh } = useApp()
  const { data, error, reload } = useLoad('archive', '/archive', [refresh])
  const list = data?.questions
  const answered = list?.filter(q => q.mine !== null).length || 0

  return (
    <Page covered={covered} onBack={onBack} title={t('archive.title')}>
      <header className="px-5 pb-4 pt-1">
        <h1 className="text-[34px] font-bold leading-[41px]">{t('archive.title')}</h1>
        {list && list.length > 1 && <p className="mt-1 text-[15px] text-fg2">{t('archive.answered', { a: answered, n: list.length })}</p>}
      </header>
      {error && !list ? (
        <LoadError error={error} onRetry={reload} icon={<Icon.Archive size={28} />} />
      ) : !list ? (
        <div className="grid h-[50dvh] place-items-center text-fg2"><Spinner size={26} /></div>
      ) : (
        <div className="flex flex-col gap-3 px-4">
          {list.map((q, i) => (
            <motion.button key={q.id + q.number} type="button" onClick={() => openQuestion(q.id)} whileTap={{ scale: 0.985 }}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { ...spring, delay: Math.min(i, 8) * 0.035 } }}
              className="card block w-full rounded-[22px] px-5 pb-4 pt-4 text-left">
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-fg2">{t('today.no', { n: q.number })} · {i === 0 ? t('time.today') : dayText(q.day, { day: 'numeric', month: 'short' })}</span>
                <span className="flex-1" />
                {q.mine !== null
                  ? <SideTag side={q.mine} label={q.sides[q.mine]} className="min-w-0" />
                  : <span className="text-[14px] font-semibold text-accent-ink">{t('archive.answer')}</span>}
              </div>
              <div className="mt-2 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{q.title}</div>
              <div className="serif prose-wrap mt-1 line-clamp-2 text-[19px] leading-[1.25] text-fg">{q.question}</div>
              <div className="mt-3.5 flex items-center gap-3">
                <MiniSplit counts={q.counts} hidden={q.mine === null} />
                <span className="shrink-0 text-[13.5px] tabular-nums text-fg2">{t('today.args', { n: q.total })}</span>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </Page>
  )
}

/** Thin split bar; before you've answered it stays blank so the crowd can't lean on you */
function MiniSplit({ counts, hidden }) {
  const total = counts[0] + counts[1]
  const a = total ? (counts[0] / total) * 100 : 50
  return (
    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill2" aria-hidden="true">
      {!hidden && total > 0 && <div className="h-full rounded-full bg-accent" style={{ width: `${a}%` }} />}
    </div>
  )
}
