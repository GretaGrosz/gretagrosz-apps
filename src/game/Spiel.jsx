import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useBack } from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { ChevronLeft, ChevronRight } from '../components/Icons.jsx'
import { SPRING } from '../motion.js'
import { useLang } from '../i18n.jsx'
import { XP, currentStreak, useProgress } from '../progress.jsx'
import { useContentReady } from '../data/content.js'
import { daysUntil } from '../data/questions.js'
import { getKapitelList } from '../data/curriculum.js'
import ShopWorld from './scene/ShopWorld.jsx'
import { DAY_LEN, PRICES, act, answer, clockOf, closingCosts, createDay, isRush, promptOf } from './sim.js'
import { buildPool, mixed, nextQuestion, refKey, regularQuestions } from './learn.js'
import { NAMES, makeT } from './strings.js'
import { setAudio, setRush, sfx, startMusic, stopMusic, unlockAudio } from './audio.js'
import { ActionButton, Count, Hud, Joystick, MaterialSheet, MoneyPops, PauseCard, Pill, QuestionCard, SoundToggles, Summary, Toasts, UpgradeSheet } from './ui/GameUI.jsx'

// Loopy & Co. – Loopy führt ihren Bonbonstand auf der schwebenden Insel. Man läuft mit WASD/Pfeiltasten
// (am Handy mit dem Joystick) herum, bedient Kundschaft, füllt Gläser aus dem Lager nach, bestellt am Steg
// und liest die Post. An jeder Station kommen BW-Fragen aus dem gewählten Lernstoff. Ein Tag dauert ca. 3 Minuten.
//
// Ablauf: menu → play (⇄ question, pause) → summary → menu …

const SAVE_KEY = 'loopy-shop-save'
const fresh = () => ({ v: 2, day: 1, coins: 30, upgrades: {}, jars: null, store: null, focus: null, audio: { music: true, sfx: true }, seenHowTo: false })

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (s && s.v === 2 && typeof s.day === 'number' && typeof s.coins === 'number') return { ...fresh(), ...s, upgrades: { ...s.upgrades }, audio: { ...fresh().audio, ...s.audio } }
  } catch {
    /* kein oder kaputter Spielstand → neu beginnen */
  }
  return fresh()
}

function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* Speicher voll oder gesperrt – das Spiel läuft trotzdem */
  }
}

const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

let uid = 0

export default function Spiel() {
  const back = useBack('/')
  const { lang } = useLang()
  const t = useMemo(() => makeT(lang), [lang])
  const { myYear, exams, mistakes, streak, award, recordAnswer } = useProgress()
  const [save, setSave] = useState(loadSave)
  useEffect(() => storeSave(save), [save])
  const touch = useMemo(isTouch, [])

  // ---------- Lernstoff ----------
  const exam = exams.find((e) => daysUntil(e.date) >= 0)
  const focus = useMemo(() => {
    if (save.focus && getKapitelList(save.focus.year).length) return save.focus
    if (exam) return { year: exam.jahrgangId, kapitelIds: exam.kapitelIds }
    return { year: myYear || 1, kapitelIds: [] }
  }, [save.focus, exam, myYear])
  const ready = useContentReady(lang, [focus.year])
  const pool = useMemo(() => (ready ? buildPool(focus.year, focus.kapitelIds, lang) : null), [ready, focus.year, focus.kapitelIds.join(','), lang]) // eslint-disable-line react-hooks/exhaustive-deps
  const chapterCount = getKapitelList(focus.year).length
  const materialLabel = focus.kapitelIds.length && focus.kapitelIds.length < chapterCount ? t('materialSome', { n: focus.kapitelIds.length }) : t('materialAll', { n: focus.year })
  const formatDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(lang === 'hu' ? 'hu-HU' : lang === 'en' ? 'en-GB' : 'de-AT', { day: 'numeric', month: 'numeric' })

  // ---------- Spielwelt ----------
  const simRef = useRef(null)
  const inputRef = useRef({ kx: 0, ky: 0, jx: 0, jy: 0 })
  const [phase, setPhase] = useState('menu')
  const [dayKey, setDayKey] = useState(0)
  const [customers, setCustomers] = useState([])
  const [hud, setHud] = useState({ clock: '08:00', progress: 0, rush: false, money: 0, combo: 0, prompt: null })
  const [question, setQuestion] = useState(null)
  const [toasts, setToasts] = useState([])
  const [pops, setPops] = useState([])
  const [report, setReport] = useState(null)
  const [sheet, setSheet] = useState(null) // 'material' | 'shop'
  const used = useRef(new Set())
  const regulars = useRef([])
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  // Vorschau im Menü: Insel mit dem gespeicherten Lager
  if (!simRef.current) simRef.current = createDay(save, 0)
  // Nur beim Entwickeln: Zugriff für automatische Tests
  if (import.meta.env.DEV) window.__loopy = { simRef, act: () => act(simRef.current) }

  const toast = useCallback((text, extra = {}) => {
    const id = ++uid
    setToasts((l) => [...l.slice(-2), { id, text, ...extra }])
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), extra.big ? 2200 : 1700)
  }, [])

  const pop = useCallback((amount) => {
    const id = ++uid
    setPops((l) => [...l.slice(-3), { id, amount }])
    setTimeout(() => setPops((l) => l.filter((x) => x.id !== id)), 900)
  }, [])

  useEffect(() => setAudio(save.audio), [save.audio])
  useEffect(() => () => stopMusic(), [])

  // ---------- Tag starten / beenden ----------
  const startDay = () => {
    if (!pool || !pool.all.length) return
    unlockAudio()
    const regs = regularQuestions(mistakes, focus.year, focus.kapitelIds, lang)
    regulars.current = regs.sort(() => Math.random() - 0.5).slice(0, 3)
    used.current = new Set()
    simRef.current = createDay(save, regulars.current.length)
    setCustomers([])
    setDayKey((k) => k + 1)
    setReport(null)
    setPhase('play')
    setSave((s) => ({ ...s, seenHowTo: true }))
    startMusic()
    setRush(false)
    sfx('bell')
  }

  const finishDay = useCallback(() => {
    const s = simRef.current
    stopMusic()
    const costs = closingCosts(save)
    const profit = s.money + costs.reduce((n, [, v]) => n + v, 0)
    // Was Loopy oder Kai noch tragen und was am Steg liegt, kommt ins Lager
    const store = [...s.store]
    const back = [...s.dockBoxes, s.loopy.carry?.type, s.kai?.carry?.type].filter((x) => x !== undefined && x !== null)
    back.forEach((ty) => (store[ty] = Math.min(s.storeCap, store[ty] + 1)))
    const ok = s.answers.filter((a) => a.ok).length
    const ratio = s.answers.length ? ok / s.answers.length : 1
    const stars = s.lost === 0 && ratio >= 0.8 ? 3 : s.lost <= 2 && ratio >= 0.6 ? 2 : s.served > 0 ? 1 : 0
    setReport({ day: save.day, ledger: s.ledger, costs, profit, served: s.served, lost: s.lost, answers: s.answers, bestCombo: s.bestCombo, stars })
    setSave((sv) => ({ ...sv, day: sv.day + 1, coins: Math.max(0, sv.coins + profit), jars: [...s.jars], store }))
    setPhase('summary')
    sfx(stars >= 2 ? 'right' : 'combo')
  }, [save])

  // ---------- Fragen ----------
  const openQuestion = useCallback(
    (ev) => {
      const s = simRef.current
      let q = null
      let header = ''
      let hint = null
      if (ev.station === 'counter') {
        const c = s.customers.find((c) => c.id === ev.customerId)
        const names = NAMES[lang] ?? NAMES.de
        const name = names[(ev.customerId ?? 0) % names.length]
        if (c?.kind === 'regular' && regulars.current.length) {
          q = mixed(regulars.current.shift())
          header = t('q_regular', { name })
        } else header = t('q_counter', { name })
      } else if (ev.station === 'store') header = t('q_store')
      else if (ev.station === 'dock') {
        header = t('q_dock')
        hint = t('q_dockHint', { good: PRICES.boxGood, full: PRICES.boxFull })
      } else header = t('q_mail')
      if (!q) q = nextQuestion(pool, ev.station, used.current)
      if (!q) {
        answer(s, true, null)
        return
      }
      used.current.add(refKey(q.ref))
      setQuestion({ q, header, hint, picked: null })
      setPhase('question')
    },
    [pool, lang, t],
  )

  const pick = useCallback(
    (i) => {
      setQuestion((cur) => {
        if (!cur || cur.picked !== null) return cur
        const ok = i === cur.q.correctIndex
        sfx(ok ? 'right' : 'wrong')
        navigator.vibrate?.(ok ? 12 : [20, 40, 20])
        recordAnswer(cur.q.ref, ok)
        if (ok) award(`quiz:${refKey(cur.q.ref)}`, XP.quiz)
        return { ...cur, picked: i }
      })
    },
    [recordAnswer, award],
  )

  const closeQuestion = useCallback(() => {
    const cur = question
    if (!cur || cur.picked === null) return
    const ok = cur.picked === cur.q.correctIndex
    const s = simRef.current
    answer(s, ok, cur.q.ref)
    const last = s.answers[s.answers.length - 1]
    if (last) last.text = cur.q.question.replace(/\s+/g, ' ')
    setQuestion(null)
    setPhase('play')
  }, [question])

  // ---------- Ereignisse aus der Spielwelt (10× pro Sekunde) ----------
  useEffect(() => {
    if (phase !== 'play' && phase !== 'question') return
    const id = setInterval(() => {
      const s = simRef.current
      if (!s) return
      const events = s.events.splice(0)
      for (const ev of events) {
        switch (ev.type) {
          case 'sfx':
            sfx(ev.name)
            break
          case 'money':
            pop(ev.amount)
            break
          case 'ask':
            openQuestion(ev)
            break
          case 'nope':
            sfx('nope')
            toast(t(`n_${ev.action}`))
            break
          case 'combo':
            sfx('combo')
            toast(t('combo', { n: ev.n }), { tone: 'good' })
            break
          case 'comboLost':
            toast(t('comboLost'), { tone: 'bad' })
            break
          case 'lost':
            toast(t('lost'), { tone: 'bad' })
            break
          case 'mail':
            toast(t('mail'))
            break
          case 'inventurStart':
            toast(t('inventurStart'))
            break
          case 'delivered':
            toast(t('delivered'), { tone: 'good' })
            break
          case 'ordered':
            toast(`${t('ordered', { n: ev.cost })}${ev.discount ? ` · ${t('discount')}` : ''}`)
            break
          case 'rushStart':
            setRush(true)
            sfx('rush')
            toast(t('rush'), { big: true, sub: t('rushSub') })
            break
          case 'rushEnd':
            setRush(false)
            break
          case 'closing':
            toast(t('closing'), { big: true })
            break
          case 'over':
            finishDay()
            return
          default:
        }
      }
      const list = s.customers
      setCustomers((prev) => (prev.length === list.length && prev.every((c, i) => c === list[i]) ? prev : [...list]))
      const prompt = promptOf(s)
      setHud((h) => {
        const next = { clock: clockOf(s.t), progress: s.t / DAY_LEN, rush: isRush(s.t), money: s.money, combo: s.combo, prompt }
        return JSON.stringify(next) === JSON.stringify(h) ? h : next
      })
    }, 100)
    return () => clearInterval(id)
  }, [phase, openQuestion, finishDay, toast, pop, t])

  // ---------- Tastatur ----------
  useEffect(() => {
    const keys = new Set()
    const sync = () => {
      const i = inputRef.current
      i.kx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0)
      i.ky = (keys.has('up') ? 1 : 0) - (keys.has('down') ? 1 : 0)
    }
    const dirOf = (e) =>
      ({ KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right' })[e.code]
    const down = (e) => {
      if (e.target instanceof HTMLInputElement) return
      const d = dirOf(e)
      if (d) {
        keys.add(d)
        sync()
        if (phaseRef.current === 'play') e.preventDefault()
        return
      }
      if (phaseRef.current === 'play' && !e.repeat && (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        act(simRef.current)
      }
      if (e.code === 'Escape' && phaseRef.current === 'play') setPhase('pause')
    }
    const up = (e) => {
      const d = dirOf(e)
      if (d) {
        keys.delete(d)
        sync()
      }
    }
    const blur = () => {
      keys.clear()
      sync()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // Pause, wenn die App in den Hintergrund geht
  useEffect(() => {
    const onHide = () => document.hidden && phaseRef.current === 'play' && setPhase('pause')
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [])

  const quitDay = () => {
    stopMusic()
    simRef.current = createDay(save, 0)
    setCustomers([])
    setDayKey((k) => k + 1)
    setQuestion(null)
    setPhase('menu')
  }

  const toMenu = () => {
    simRef.current = createDay(save, 0)
    setCustomers([])
    setDayKey((k) => k + 1)
    setPhase('menu')
  }

  const buy = (u) => {
    setSave((s) => (s.upgrades[u.id] || s.coins < u.cost ? s : { ...s, coins: s.coins - u.cost, upgrades: { ...s.upgrades, [u.id]: true } }))
    sfx('gold')
  }
  // Nach dem Kauf zeigt die Vorschau-Insel gleich das Neue (z. B. die vierte Sorte)
  useEffect(() => {
    if (phaseRef.current === 'menu' || phaseRef.current === 'summary') simRef.current = createDay(save, 0)
  }, [save.upgrades]) // eslint-disable-line react-hooks/exhaustive-deps

  const onAudio = (change) => setSave((s) => ({ ...s, audio: { ...s.audio, ...change } }))

  const playing = phase === 'play' || phase === 'question' || phase === 'pause'
  const coinsShown = save.coins + (playing ? hud.money : 0)
  const days = currentStreak(streak)
  const labels = useMemo(() => ({ sign: t('shopName'), store: lang === 'hu' ? 'Raktár' : lang === 'en' ? 'Storeroom' : 'Lager', dock: lang === 'hu' ? 'Rendelés' : lang === 'en' ? 'Orders' : 'Bestellung' }), [t, lang])

  return (
    <div className="game fixed inset-0 z-40 select-none overflow-hidden bg-[#EAF2FE] font-body" style={{ WebkitTouchCallout: 'none' }}>
      <div className="absolute inset-0">
        <WebGLGuard>
          <ShopWorld simRef={simRef} inputRef={inputRef} running={phase === 'play' || phase === 'question'} follow={playing} customers={customers} kai={Boolean(save.upgrades.kai)} dayKey={dayKey} labels={labels} />
        </WebGLGuard>
      </div>

      {/* ---------- Menü ---------- */}
      <AnimatePresence>
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-[max(12px,env(safe-area-inset-top))]">
              <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
                <button onClick={back} aria-label={t('leave')} className="game-float pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-text active:opacity-60">
                  <ChevronLeft className="h-[22px] w-[22px]" />
                </button>
                <div className="flex items-center gap-2">
                  {days > 0 && <Pill className="text-[#FF7A00]">🔥 {days}</Pill>}
                  <Pill>
                    <span className="game-coin" />
                    <Count value={save.coins} />
                  </Pill>
                </div>
              </div>
            </div>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} transition={SPRING} className="absolute inset-x-0 bottom-0 px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              <div className="game-float mx-auto max-w-xl rounded-[26px] bg-surface/95 p-5 backdrop-blur">
                <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">{t('title')}</p>
                <p className="text-[28px] font-bold leading-tight">{t('shopName')}</p>
                <p className="text-[15px] text-label2">{t('day', { n: save.day })}</p>
                {!save.seenHowTo && (
                  <ol className="mt-3 space-y-1.5 rounded-2xl bg-bg px-4 py-3 text-[14px] leading-snug">
                    {['how1', 'how2', 'how3', 'how4'].map((k, i) => (
                      <li key={k} className="flex gap-2">
                        <span className="font-bold text-accent-text">{i + 1}.</span>
                        {t(k)}
                      </li>
                    ))}
                  </ol>
                )}
                <button onClick={() => setSheet('material')} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-bg px-4 py-3 text-left active:opacity-70">
                  <span>
                    <span className="block text-[12px] font-semibold uppercase tracking-wide text-label2">{t('material')}</span>
                    <span className="text-[16px] font-semibold">{materialLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-label3" />
                </button>
                <SoundToggles t={t} audio={save.audio} onAudio={onAudio} className="mt-2.5" />
                <p className="mt-3 text-center text-[12px] text-label2">{touch ? t('controlsTouch') : t('controlsKeys')}</p>
                <div className="mt-2 flex gap-3">
                  <Button variant="secondary" onClick={() => setSheet('shop')} className="flex-1">
                    {t('upgrades')}
                  </Button>
                  <Button onClick={startDay} disabled={!pool || !pool.all.length} className="flex-[1.4]">
                    {!pool ? t('loading') : pool.all.length ? t('startDay', { n: save.day }) : t('noQuestions')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Spiel ---------- */}
      {playing && (
        <>
          <Hud t={t} clock={hud.clock} progress={hud.progress} rush={hud.rush} coins={coinsShown} combo={hud.combo} onPause={() => setPhase('pause')} />
          <MoneyPops pops={pops} />
          <Toasts items={toasts} />
          {phase === 'play' && (
            <>
              {touch && <Joystick inputRef={inputRef} />}
              <ActionButton touch={touch} prompt={hud.prompt} label={hud.prompt ? t(`a_${hud.prompt.action}`) : ''} onAct={() => act(simRef.current)} />
            </>
          )}
        </>
      )}

      <AnimatePresence>{phase === 'question' && question && <QuestionCard key="q" t={t} item={question} onPick={pick} onNext={closeQuestion} />}</AnimatePresence>

      <AnimatePresence>
        {phase === 'pause' && (
          <PauseCard
            key="pause"
            t={t}
            audio={save.audio}
            onAudio={onAudio}
            onResume={() => setPhase(question ? 'question' : 'play')}
            onQuit={quitDay}
            onLeave={() => {
              stopMusic()
              back()
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'summary' && report && (
          <Summary
            key="sum"
            t={t}
            day={report.day}
            report={report}
            onShop={() => setSheet('shop')}
            onNext={startDay}
            onMenu={toMenu}
          />
        )}
      </AnimatePresence>

      <MaterialSheet open={sheet === 'material'} onClose={() => setSheet(null)} t={t} lang={lang} focus={focus} onChange={(f) => setSave((s) => ({ ...s, focus: f }))} exam={exam} formatDate={formatDate} />
      <UpgradeSheet open={sheet === 'shop'} onClose={() => setSheet(null)} t={t} save={save} onBuy={buy} />
    </div>
  )
}

function WebGLGuard({ children }) {
  const ok = useMemo(() => {
    try {
      const c = document.createElement('canvas')
      return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      return false
    }
  }, [])
  if (!ok) return <div className="flex h-full items-center justify-center px-8 text-center text-[17px] font-semibold">Dein Gerät kann die 3D-Insel leider nicht anzeigen.</div>
  return children
}

