// Starting a debate. From an argument on a daily question: the question is the motion, each of you keeps your side,
// and your own argument is the opening. Otherwise: a motion you argue For, an opponent (someone, or anyone), your opening.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { t } from './i18n.js'
import { Avatar, Button, Card, Icon, Segmented, Sheet, SideTag, Spinner, TextArea, spring, useApp } from './ui.jsx'

const DRAFT = 'stance.draft.newdebate'
const readDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT)) || {} } catch { return {} } }

export function NewDebate({ opponent: initialOpponent, motion: initialMotion, questionId, question, opening: initialOpening, mySide, onClose, onCreated }) {
  const { toast } = useApp()
  const fromQuestion = !!questionId && !!question
  const [open, setOpen] = useState(true)
  const [draft] = useState(() => (fromQuestion ? {} : readDraft()))
  const [motionText, setMotion] = useState(initialMotion || draft.motion || '')
  const [context, setContext] = useState(draft.context || '')
  const [opening, setOpening] = useState(initialOpening || draft.opening || '')
  const [mode, setMode] = useState(initialOpponent ? 'person' : 'open')
  const [opponent, setOpponent] = useState(initialOpponent || null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (fromQuestion) return
    try { localStorage.setItem(DRAFT, JSON.stringify({ motion: motionText, context, opening })) } catch {}
  }, [motionText, context, opening])

  // Let the sheet slide away before App unmounts it
  const close = () => { setOpen(false); setTimeout(onClose, 280) }

  const m = motionText.trim()
  const missing = !fromQuestion && m.length < 10 ? t('new.needMotion') : mode === 'person' && !opponent ? t('new.needOpponent') : opening.trim().length < 40 ? t('new.needOpening') : ''
  const send = async () => {
    if (missing || sending) return
    setSending(true)
    try {
      const body = fromQuestion
        ? { questionId, opening: opening.trim(), ...(opponent ? { opponent: opponent.handle } : {}) }
        : { motion: m, context: context.trim(), opening: opening.trim(), ...(mode === 'person' ? { opponent: opponent.handle } : {}) }
      const r = await api('/debates', { method: 'POST', body })
      if (!fromQuestion) try { localStorage.removeItem(DRAFT) } catch {}
      toast(opponent && (fromQuestion || mode === 'person') ? t('new.sent', { name: opponent.name.split(' ')[0] }) : t('new.posted'))
      onCreated(r.debate)
    } catch (e) {
      toast(e.message, 'error')
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onClose={close} full title={opponent && fromQuestion ? t('new.challengeTitle', { name: opponent.name.split(' ')[0] }) : t('debates.new')}>
      <div className="px-5 pb-6">
        {fromQuestion ? (
          <Card className="px-5 py-4">
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-accent-ink">{question.title}</div>
            <div className="serif prose-wrap mt-1.5 text-[21px] font-medium leading-[1.25]">{question.question}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SideTag side={0} label={`${t('debate.you')}: ${question.sides[mySide]}`} />
              {opponent && <SideTag side={1} label={`${opponent.name.split(' ')[0]}: ${question.sides[1 - mySide]}`} />}
            </div>
          </Card>
        ) : (
          <>
            <Label>{t('new.motion')}</Label>
            <SerifField value={motionText} onChange={setMotion} max={160} placeholder={t('new.motionPh')} />
            <div className="h-4 px-1 text-right text-[12.5px] tabular-nums text-fg2">{m.length && m.length < 10 ? t('ui.more', { n: 10 - m.length }) : 160 - m.length < 40 ? t('ui.left', { n: 160 - m.length }) : ''}</div>

            <Label className="mt-5">{t('new.context')} <span className="font-normal normal-case tracking-normal text-fg2">· {t('new.optional')}</span></Label>
            <div className="rounded-[18px] bg-surface px-4 pb-1 pt-3">
              <TextArea value={context} onChange={setContext} max={400} rows={2} placeholder={t('new.contextPh')} label={t('new.context')} />
            </div>

            <Label className="mt-5">{t('new.opponent')}</Label>
            <Segmented options={[{ id: 'open', label: t('new.anyone') }, { id: 'person', label: t('new.someone') }]} value={mode} onChange={setMode} label={t('new.opponent')} />
            <AnimatePresence initial={false}>
              {mode === 'person' && (
                <motion.div key="person" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="pt-3"><PersonPicker value={opponent} onChange={setOpponent} /></div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        <Label className="mt-5">{t('new.opening')}</Label>
        <div className="rounded-[18px] bg-surface px-4 pb-1 pt-3">
          <TextArea value={opening} onChange={setOpening} min={40} max={1500} rows={6} placeholder={t('new.openingPh')} label={t('new.opening')} onSubmit={send} />
        </div>

        <Button size="lg" className="mt-5 w-full" disabled={!!missing || sending} onClick={send}>
          {sending ? <Spinner /> : <><Icon.Send size={18} />{opponent && (fromQuestion || mode === 'person') ? t('new.send') : t('new.post')}</>}
        </Button>
        {missing && <p className="mt-2.5 text-center text-[13.5px] text-fg2">{missing}</p>}
      </div>
    </Sheet>
  )
}

function Label({ children, className = '' }) {
  return <div className={`mb-2 px-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-fg2 ${className}`}>{children}</div>
}

/** The motion: big serif text that wraps and grows, no line breaks */
function SerifField({ value, onChange, max, placeholder }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [value])
  return (
    <textarea ref={ref} value={value} rows={1} placeholder={placeholder} enterKeyHint="next" aria-label={placeholder}
      onChange={e => onChange(e.target.value.replace(/\s*\n\s*/g, ' ').slice(0, max))}
      className="serif prose-wrap block w-full resize-none bg-transparent px-1 text-[26px] font-medium leading-[1.2] text-fg outline-none placeholder:text-fg3" />
  )
}

/** Search people by name or handle; shows the chosen one as a row */
function PersonPicker({ value, onChange }) {
  const [q, setQ] = useState('')
  const [users, setUsers] = useState(null)
  const [loading, setLoading] = useState(false)
  const seq = useRef(0)
  useEffect(() => {
    const term = q.trim()
    if (!term) { setUsers(null); setLoading(false); return }
    const n = ++seq.current
    setLoading(true)
    const id = setTimeout(() => {
      api('/users?q=' + encodeURIComponent(term))
        .then(r => { if (n === seq.current) setUsers(r.users) })
        .catch(() => { if (n === seq.current) setUsers([]) })
        .finally(() => { if (n === seq.current) setLoading(false) })
    }, 250)
    return () => clearTimeout(id)
  }, [q])

  if (value) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={spring} className="flex items-center gap-3 rounded-[18px] bg-surface px-3.5 py-2.5">
        <Avatar user={value} size={40} />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-[16px] font-semibold">{value.name}</div>
          <div className="truncate text-[14px] text-fg2">@{value.handle}</div>
        </div>
        <Button kind="plain" size="sm" className="px-2" onClick={() => onChange(null)}>{t('new.change')}</Button>
      </motion.div>
    )
  }
  return (
    <div className="overflow-hidden rounded-[18px] bg-surface">
      <label className="flex h-12 items-center gap-2.5 px-4">
        <Icon.Search size={18} className="shrink-0 text-fg2" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('new.search')} aria-label={t('new.search')} autoCapitalize="off" autoCorrect="off" spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[17px] text-fg outline-none placeholder:text-fg3" />
        {loading && <Spinner size={15} className="text-fg2" />}
      </label>
      {users && (
        <div className="border-t border-line">
          {users.length ? users.map(u => (
            <button key={u.handle} type="button" onClick={() => onChange(u)} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left active:bg-fill">
              <Avatar user={u} size={34} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[15px] font-semibold">{u.name}</div>
                <div className="truncate text-[13.5px] text-fg2">@{u.handle}</div>
              </div>
            </button>
          )) : !loading && <div className="px-4 py-3.5 text-[15px] text-fg2">{t('new.nobody')}</div>}
        </div>
      )}
    </div>
  )
}
