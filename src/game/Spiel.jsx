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
import { getKapitelList, getKapitelTopics } from '../data/curriculum.js'
import ShopWorld from './scene/ShopWorld.jsx'
import { AQUARIUM, CAFE, DAY_LEN, PLACES, PRICES, act, answer, canPlace, clockOf, closingCosts, createDay, frontCustomer, goTo, isRush, planEvents, promptOf, sendCustomer } from './sim.js'
import { AREAS, CAST, DECOR, OUTFITS, SAVE_VERSION, STAFF, UPGRADES, decorById, freshSave, holidayOf, seasonOf, speciesById, MAX_HEARTS } from './data.js'
import { buildPool, mixed, nextQuestion, refKey, regularQuestions } from './learn.js'
import { makeMiniGame } from './minigames.js'
import {
  albumRewards,
  applyDayToMissions,
  claimDaily,
  claimMission,
  decodeIsland,
  ensureMissions,
  islandAsSave,
  markSeason,
  markStickers,
  markStory,
  missionsReady,
  newStickers,
  redeemGift,
  sendGift,
  AREA_TEXT,
  STAFF_TEXT,
  UPGRADE_TEXT,
  stickerList,
  storyBeat,
} from './meta.js'
import { NAMES, makeT } from './strings.js'
import { setAudio, setRush, sfx, startMusic, stopMusic, unlockAudio, voice } from './audio.js'
import { ActionButton, Count, Hud, Joystick, MaterialSheet, MoneyPops, PauseCard, Pill, QuestionCard, Summary, Toasts } from './ui/GameUI.jsx'
import MiniGame from './ui/MiniGame.jsx'
import { CoachCard, EdgeArrows } from './ui/Guide.jsx'
import { AlbumSheet, DailyGiftCard, FriendsSheet, IslandSheet, MissionsCard, StoryDialog, VisitBanner, WardrobeSheet } from './ui/MetaUI.jsx'

// Loopy & Co. – Loopy führt ihren Bonbonstand auf der schwebenden Insel. Man läuft mit WASD/Pfeiltasten
// (am Handy mit dem Joystick) herum, bedient Tier-Kundschaft, füllt Gläser aus dem Lager nach, bestellt am Steg,
// liest die Post, serviert Kakao im Café und führt Gruppen durchs Aquarium. An jeder Station kommen BW-Fragen
// oder Mini-Spiele aus dem gewählten Lernstoff. Ein Tag dauert ca. 3 Minuten.
//
// Dazu (für „noch ein Tag!“): Tagesgeschenk, Tagesaufgaben, Stickeralbum, Outfits, Deko, Personal,
// Inselteile, eine kleine Geschichte mit Oma Schildi und Haibert, Freunde besuchen per Code.
//
// Ablauf: menu → play (⇄ question, pause) → summary → menu …   menu ⇄ decorate, menu ⇄ visit

const SAVE_KEY = 'loopy-shop-save'

function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (s && (s.v === 2 || s.v === SAVE_VERSION) && typeof s.day === 'number' && typeof s.coins === 'number') {
      const base = freshSave()
      const next = { ...base, ...s, v: SAVE_VERSION, upgrades: { ...s.upgrades }, audio: { ...base.audio, ...s.audio }, staff: { ...s.staff }, daily: { ...base.daily, ...s.daily }, story: { ...base.story, ...s.story }, skill: { ...base.skill, ...s.skill }, gifts: { ...base.gifts, ...s.gifts } }
      // Version 2: Kai war ein Ausbau, jetzt ist er Personal
      if (next.upgrades.kai) {
        next.staff.kai = next.staff.kai ?? { energy: 100 }
        delete next.upgrades.kai
      }
      if (!Array.isArray(next.wardrobe) || !next.wardrobe.includes('none')) next.wardrobe = ['none', ...(next.wardrobe ?? [])]
      if (!Array.isArray(next.decor)) next.decor = []
      return next
    }
  } catch {
    /* kein oder kaputter Spielstand → neu beginnen */
  }
  return freshSave()
}

function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* Speicher voll oder gesperrt – das Spiel läuft trotzdem */
  }
}

// Besuchs-Code aus dem Link (#/spiel?visit=CODE)
function visitFromLink() {
  try {
    const m = /[?&]visit=([^&#]+)/.exec(window.location.hash || '')
    return m ? decodeIsland(decodeURIComponent(m[1])) : null
  } catch {
    return null
  }
}

const weakDevice = () => {
  try {
    const mem = navigator.deviceMemory
    const cores = navigator.hardwareConcurrency
    return (mem && mem <= 3) || (cores && cores <= 4 && isTouch())
  } catch {
    return false
  }
}
const isTouch = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const STAFF_NAME = { kai: 'Kai', luma: 'Luma', otto: 'Otto', momo: 'Momo' }
const hiredStaff = (save) => STAFF.filter((st) => save.staff?.[st.id] && (!st.needs || save.areas?.[st.needs])).map((st) => st.id)

// Wie oft statt einer Auswahlfrage ein Mini-Spiel kommt
const MG_CHANCE = { counter: 0.3, store: 0.35, dock: 0.35, mail: 0.3 }
const MG_KIND = { counter: 'change', store: 'sort', dock: 'calc', mail: 'match' }

let uid = 0

// Einführungstag mit Oma Schildi: jeder Schritt hat ein Ziel (Pfeil), einen Start (was passiert) und ein „geschafft“
const TUT = [
  { id: 'walk', text: 'tut_walk', at: () => PLACES.serve, done: (s) => s.near === 'counter' },
  { id: 'serve', text: 'tut_serve', at: () => PLACES.serve, start: (s) => sendCustomer(s, 'normal', { want: 0 }), done: (s) => s.served >= 1 },
  { id: 'ask', text: 'tut_ask', at: () => PLACES.serve, start: (s) => sendCustomer(s, 'ask'), done: (s) => s.answers.length >= 1 && !s.pending },
  {
    id: 'empty',
    text: 'tut_empty',
    at: () => PLACES.storeDoor,
    start: (s) => {
      s.jars[1] = 0
      s.store[1] = Math.max(1, s.store[1])
      sendCustomer(s, 'normal', { want: 1 })
    },
    done: (s) => s.loopy.carry?.kind === 'box',
  },
  { id: 'refill', text: 'tut_refill', at: () => PLACES.serve, done: (s) => s.jars[1] > 0 },
  { id: 'serve2', text: 'tut_serve2', at: () => PLACES.serve, done: (s) => !s.customers.some((c) => c.slot >= 0) },
  {
    id: 'order',
    text: 'tut_order',
    at: () => PLACES.dock,
    start: (s) => (s.store = s.store.map(() => 0)),
    done: (s) => Boolean(s.order) || s.boat.state !== 'away' || s.dockBoxes.length > 0,
  },
  {
    id: 'unload',
    text: 'tut_unload',
    at: (s) => (s.loopy.carry?.src === 'dock' ? PLACES.storeDoor : PLACES.dockPile),
    done: (s) => s.boat.state !== 'coming' && !s.order && s.dockBoxes.length === 0 && !s.loopy.carry,
  },
  { id: 'done', text: 'tut_done', at: () => null, done: () => false },
]

export default function Spiel() {
  const back = useBack('/')
  const { lang } = useLang()
  const t = useMemo(() => makeT(lang), [lang])
  const { myYear, exams, mistakes, streak, award, recordAnswer } = useProgress()
  const [save, setSave] = useState(loadSave)
  useEffect(() => storeSave(save), [save])
  const touch = useMemo(isTouch, [])
  const now = useMemo(() => new Date(), [])
  const season = useMemo(() => seasonOf(now), [now])
  const holiday = useMemo(() => holidayOf(now), [now])

  // ---------- Lernstoff ----------
  const exam = exams.find((e) => daysUntil(e.date) >= 0)
  const focus = useMemo(() => {
    if (save.focus && getKapitelList(save.focus.year).length) return save.focus
    if (exam) return { year: exam.jahrgangId, kapitelIds: exam.kapitelIds }
    return { year: myYear || 1, kapitelIds: [] }
  }, [save.focus, exam, myYear])
  const ready = useContentReady(lang, [focus.year])
  const pool = useMemo(() => (ready ? buildPool(focus.year, focus.kapitelIds, lang) : null), [ready, focus.year, focus.kapitelIds.join(','), lang]) // eslint-disable-line react-hooks/exhaustive-deps
  const topicIds = useMemo(() => {
    const ks = focus.kapitelIds.length ? focus.kapitelIds : getKapitelList(focus.year).map((k) => k.id)
    return ks.flatMap((k) => getKapitelTopics(focus.year, k).map((tp) => tp.id))
  }, [focus.year, focus.kapitelIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps
  const chapterCount = getKapitelList(focus.year).length
  const materialLabel = focus.kapitelIds.length && focus.kapitelIds.length < chapterCount ? t('materialSome', { n: focus.kapitelIds.length }) : t('materialAll', { n: focus.year })
  const formatDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString(lang === 'hu' ? 'hu-HU' : lang === 'en' ? 'en-GB' : 'de-AT', { day: 'numeric', month: 'numeric' })

  // ---------- Spielwelt ----------
  const simRef = useRef(null)
  const inputRef = useRef({ kx: 0, ky: 0, jx: 0, jy: 0 })
  const [visit, setVisit] = useState(visitFromLink)
  const [phase, setPhase] = useState(() => (visit ? 'visit' : 'menu'))
  const [dayKey, setDayKey] = useState(0)
  const [customers, setCustomers] = useState([])
  const [hud, setHud] = useState({ clock: '08:00', progress: 0, rush: false, money: 0, combo: 0, prompt: null })
  const [question, setQuestion] = useState(null)
  const [toasts, setToasts] = useState([])
  const [pops, setPops] = useState([])
  const [report, setReport] = useState(null)
  const [sheet, setSheet] = useState(null) // 'material' | 'island' | 'wardrobe' | 'album' | 'friends'
  const [gift, setGift] = useState(null)
  const [beat, setBeat] = useState(null)
  const [placing, setPlacing] = useState(null) // Deko-ID, die gerade aufgestellt wird
  const [showMissions, setShowMissions] = useState(false)
  const [tut, setTut] = useState(null) // Schritt am Einführungstag (Index in TUT) oder null
  const tutRef = useRef(null)
  tutRef.current = tut
  const guideRef = useRef(null)
  const needsRef = useRef([])
  const [needs, setNeeds] = useState([])
  const lite = save.gfx === 'fast' || (save.gfx !== 'nice' && weakDevice())
  const used = useRef(new Set())
  const playedGames = useRef(new Set())
  const regulars = useRef([])
  const dayStats = useRef({ minigamesWon: 0 })
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const visitSave = useMemo(() => (visit ? islandAsSave(visit, freshSave()) : null), [visit])
  const world = phase === 'visit' && visitSave ? visitSave : save

  const previewDay = useCallback((sv) => {
    const s = createDay(sv, { holiday })
    return s
  }, [holiday])

  // Vorschau im Menü: Insel mit dem gespeicherten Lager
  if (!simRef.current) {
    simRef.current = previewDay(world)
    if (phase === 'visit') simRef.current.visit = true
  }
  // Nur beim Entwickeln: Zugriff für automatische Tests
  if (import.meta.env.DEV) window.__loopy = { simRef, act: () => act(simRef.current), setSave, setPhase }

  const toast = useCallback((text, extra = {}) => {
    const id = ++uid
    setToasts((l) => [...l.slice(-2), { id, text, ...extra }])
    setTimeout(() => setToasts((l) => l.filter((x) => x.id !== id)), extra.big ? 2200 : 1800)
  }, [])

  const pop = useCallback((amount) => {
    const id = ++uid
    setPops((l) => [...l.slice(-3), { id, amount }])
    setTimeout(() => setPops((l) => l.filter((x) => x.id !== id)), 900)
  }, [])

  useEffect(() => setAudio(save.audio), [save.audio])
  useEffect(() => () => stopMusic(), [])

  // ---------- Beim Öffnen: Tagesgeschenk und Tagesaufgaben ----------
  useEffect(() => {
    setSave((s) => {
      let next = ensureMissions(s, now)
      const r = claimDaily(next, now)
      if (r.gift) {
        // beim allerersten Öffnen kein Geschenk-Fenster (nur Oma Schildi) – ab dem zweiten Besuch schon
        if (s.seenHowTo) setGift({ ...r.gift })
        next = r.save
      }
      return next
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Geschichte: nächste Szene im Menü zeigen (nicht über dem Geschenk)
  useEffect(() => {
    if (phase !== 'menu' || gift || sheet || beat) return
    const b = storyBeat(save)
    if (b) {
      const id = setTimeout(() => setBeat(b), 450)
      return () => clearTimeout(id)
    }
  }, [phase, gift, sheet, beat, save])

  const finishBeat = () => {
    if (beat) setSave((s) => markStory(s, beat.id))
    if (beat?.reward) sfx('gift')
    setBeat(null)
  }

  // ---------- Tag starten / beenden ----------
  const startDay = () => {
    if (!pool || !pool.all.length) return
    unlockAudio()
    const regs = regularQuestions(mistakes, focus.year, focus.kapitelIds, lang)
    regulars.current = regs.sort(() => Math.random() - 0.5).slice(0, 4)
    used.current = new Set()
    playedGames.current = new Set()
    dayStats.current = { minigamesWon: 0 }
    // Stammgäste von heute: 2–3 aus der Runde, die noch am wenigsten Herzen haben, kommen etwas öfter
    const castIds = [...CAST].sort((a, b) => (save.friends?.[a.id] ?? 0) - (save.friends?.[b.id] ?? 0) + (Math.random() - 0.5) * 3).map((c) => c.id)
    const nReg = save.day < 3 ? 2 : 3
    // Schwierigkeit passt sich an: wer viel richtig hat und kaum Kundschaft verliert, bekommt mehr zu tun
    const sk = save.skill ?? { acc: 0.75, svc: 0.85 }
    const diff = clamp(0.86 + (sk.svc - 0.82) * 0.9 + (sk.acc - 0.72) * 0.6 + Math.min(0.12, save.day * 0.008), 0.8, 1.25)
    const tutorial = !save.tutorialDone && save.day === 1
    simRef.current = createDay(save, { regulars: tutorial ? [] : castIds.slice(0, nReg), diff, events: tutorial ? [] : planEvents(save.day, holiday), holiday })
    TUT.forEach((x) => (x.started = false))
    if (tutorial) {
      simRef.current.tutorial = true
      simRef.current.loopy.x = -2.3
      simRef.current.loopy.z = -1.9
      setTut(0)
    } else setTut(null)
    setCustomers([])
    setDayKey((k) => k + 1)
    setReport(null)
    setPhase('play')
    setSave((s) => markSeason({ ...s, seenHowTo: true }, now))
    startMusic()
    setRush(false)
    sfx('bell')
    if (save.day > 2 && diff >= 1.08) setTimeout(() => toast(t('harder')), 700)
    else if (save.day > 2 && diff <= 0.86) setTimeout(() => toast(t('easier')), 700)
  }

  const finishDay = useCallback(() => {
    const s = simRef.current
    stopMusic()
    const costs = closingCosts(save)
    const profit = s.money + costs.reduce((n, [, v]) => n + v, 0)
    // Was Loopy oder das Personal noch tragen und was am Steg liegt, kommt ins Lager
    const store = [...s.store]
    const carried = [s.loopy.carry, ...Object.values(s.staff).map((k) => k.carry)].filter((c) => c?.kind === 'box').map((c) => c.type)
    ;[...s.dockBoxes, ...carried].forEach((ty) => (store[ty] = Math.min(s.storeCap, store[ty] + 1)))
    const right = s.answers.filter((a) => a.ok).length
    const ratio = s.answers.length ? right / s.answers.length : 1
    const stars = s.lost === 0 && ratio >= 0.8 ? 3 : s.lost <= 2 && ratio >= 0.6 ? 2 : s.served > 0 ? 1 : 0
    const stats = {
      served: s.served,
      lost: s.lost,
      right,
      wrong: s.answers.length - right,
      bestCombo: s.bestCombo,
      profit,
      stars,
      species: s.species,
      staffCare: s.staffCare,
      minigamesWon: dayStats.current.minigamesWon,
      cocoa: s.cocoa,
      regularsHappy: s.regularsHappy,
    }
    const sv = save
    // Personal schläft über Nacht (am Strand richtig gut)
    const staff = { ...sv.staff }
    for (const k of Object.values(s.staff)) staff[k.id] = { energy: Math.min(100, Math.round(k.energy + (sv.areas?.beach ? 100 : 45))) }
    const topics = { ...sv.topics }
    s.answers.forEach((a) => a.ok && a.ref?.topicId && (topics[a.ref.topicId] = (topics[a.ref.topicId] ?? 0) + 1))
    const eventsSeen = { ...sv.eventsSeen }
    s.seenEvents.forEach((e) => (eventsSeen[e] = true))
    const met = s.served + s.lost
    const skill = {
      acc: s.answers.length ? sv.skill.acc * 0.65 + ratio * 0.35 : sv.skill.acc,
      svc: met ? sv.skill.svc * 0.65 + (s.served / met) * 0.35 : sv.skill.svc,
    }
    let next = {
      ...sv,
      day: sv.day + 1,
      coins: Math.max(0, sv.coins + profit),
      jars: [...s.jars],
      store,
      staff,
      topics,
      eventsSeen,
      skill,
      met: { ...sv.met, ...s.met },
      bestDay: Math.max(sv.bestDay ?? 0, profit),
    }
    next = applyDayToMissions(ensureMissions(next, new Date()), stats)
    next = albumRewards(next, lang)
    const fresh = newStickers(next, lang)
    setSave(next)
    setReport({ day: save.day, ledger: s.ledger, costs, profit, served: s.served, lost: s.lost, answers: s.answers, bestCombo: s.bestCombo, stars, cocoa: s.cocoa, fresh })
    setPhase('summary')
    sfx(stars >= 2 ? 'right' : 'combo')
  }, [save, lang])

  const endTutorial = useCallback(() => {
    const s = simRef.current
    if (s) {
      s.tutorial = false
      s.t = 0
      s.nextSpawn = 1.5
      s.customers.forEach((c) => (c.patience = c.max))
    }
    guideRef.current = null
    setTut(null)
    setSave((sv) => ({ ...sv, tutorialDone: true }))
    sfx('gift')
  }, [])

  // Loopy zu einem Ziel schicken (Pfeil am Rand oder Hintippen)
  const walkTo = useCallback((x, z, andAct = false) => {
    const s = simRef.current
    if (!s || (phaseRef.current !== 'play' && phaseRef.current !== 'visit')) return
    if (goTo(s, x, z, { act: andAct })) sfx('click')
  }, [])

  // ---------- Fragen und Mini-Spiele ----------
  const nameOf = useCallback(
    (c, id) => {
      if (c?.name) return c.name
      const names = NAMES[lang] ?? NAMES.de
      return names[(id ?? 0) % names.length]
    },
    [lang],
  )

  const openQuestion = useCallback(
    (ev) => {
      const s = simRef.current
      const c = ev.customerId ? s.customers.find((x) => x.id === ev.customerId) : null
      const name = nameOf(c, ev.customerId)
      // Mini-Spiel?
      const special = ev.sub === 'regular' || ev.sub === 'inspector' || ev.sub === 'late'
      const mgKind = s.tutorial ? null : ev.station === 'aquarium' ? (Math.random() < 0.5 ? 'match' : 'sort') : !special && Math.random() < (MG_CHANCE[ev.station] ?? 0) ? MG_KIND[ev.station] : null
      if (mgKind) {
        let game = null
        try {
          game = makeMiniGame(mgKind, { lang, year: focus.year, topicIds, exclude: [...playedGames.current] })
        } catch {
          game = null
        }
        if (game) {
          if (game.key) playedGames.current.add(game.key)
          const header =
            ev.station === 'aquarium' ? t('q_tour') : ev.station === 'counter' ? t('q_mgCounter', { name }) : ev.station === 'store' ? t('q_mgStore') : ev.station === 'dock' ? t('q_mgDock') : t('q_mgMail')
          setQuestion({ mode: 'mg', game, header, key: ++uid })
          setPhase('question')
          return
        }
      }
      let q = null
      let header = ''
      let hint = null
      if (ev.sub === 'inspector') header = t('q_inspector')
      else if (ev.sub === 'late') {
        header = t('q_late')
        hint = t('q_lateHint', { n: PRICES.late })
        q = nextQuestion({ ...pool, mail: pool.dock.length ? pool.dock : pool.mail }, 'mail', used.current)
      } else if (ev.station === 'counter') {
        if (ev.sub === 'regular' && regulars.current.length) {
          q = mixed(regulars.current.shift())
          header = t('q_regular', { name })
        } else header = ev.sub === 'regular' ? t('q_regular', { name }) : t('q_counter', { name })
      } else if (ev.station === 'store') header = t('q_store')
      else if (ev.station === 'dock') {
        header = t('q_dock')
        hint = t('q_dockHint', { good: PRICES.boxGood, full: PRICES.boxFull })
      } else if (ev.station === 'aquarium') header = t('q_tour')
      else header = t('q_mail')
      if (!q) q = nextQuestion(pool, ev.station === 'aquarium' ? 'mail' : ev.station, used.current)
      if (!q) {
        answer(s, true, null)
        return
      }
      used.current.add(refKey(q.ref))
      setQuestion({ mode: 'mc', q, header, hint, picked: null })
      setPhase('question')
    },
    [pool, lang, t, nameOf, focus.year, topicIds],
  )

  const pick = useCallback(
    (i) => {
      setQuestion((cur) => {
        if (!cur || cur.mode !== 'mc' || cur.picked !== null) return cur
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
    if (!cur || cur.mode !== 'mc' || cur.picked === null) return
    const ok = cur.picked === cur.q.correctIndex
    answer(simRef.current, ok, cur.q.ref, cur.q.question.replace(/\s+/g, ' '))
    setQuestion(null)
    setPhase('play')
  }, [question])

  const closeMiniGame = useCallback(
    (ok) => {
      const cur = question
      if (!cur || cur.mode !== 'mg') return
      if (ok) dayStats.current.minigamesWon += 1
      answer(simRef.current, ok, null, cur.game.summary || cur.game.title || '')
      setQuestion(null)
      setPhase('play')
    },
    [question],
  )

  // ---------- Ereignisse aus der Spielwelt (10× pro Sekunde) ----------
  useEffect(() => {
    if (phase !== 'play' && phase !== 'question' && phase !== 'visit') return
    const id = setInterval(() => {
      const s = simRef.current
      if (!s) return
      const events = s.events.splice(0)
      for (const ev of events) {
        switch (ev.type) {
          case 'sfx':
            sfx(ev.name)
            break
          case 'voice':
            voice(speciesById(ev.species).voice, ev.mood)
            break
          case 'money':
            pop(ev.amount)
            break
          case 'ask':
            openQuestion(ev)
            break
          case 'nope':
            sfx('nope')
            if (t(`n_${ev.action}`) !== `n_${ev.action}`) toast(t(`n_${ev.action}`))
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
          case 'tourStart':
            toast(t('tourStart'))
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
          case 'storm':
            sfx('thunder')
            toast(t('storm'), { big: true, sub: t('stormSub'), color: '#6C7DB5' })
            break
          case 'rainbow':
            sfx('sparkle')
            toast(t('rainbow'), { big: true, sub: t('rainbowSub'), color: '#B39CFF' })
            break
          case 'inspector':
            toast(t('inspector'))
            break
          case 'starArrives':
            toast(t('starArrives'), { big: true, sub: t('starSub'), color: '#F0B429' })
            break
          case 'star':
            sfx('fanfare')
            toast(t('star'), { tone: 'good' })
            break
          case 'rival':
            toast(t('rival'), { big: true, sub: t('rivalSub'), color: '#4A78B8' })
            break
          case 'late':
            toast(t('late'))
            break
          case 'lateBoat':
            toast(t('lateBoat'))
            break
          case 'asleep':
            toast(t('asleep', { name: STAFF_NAME[ev.who] }))
            break
          case 'awake':
            toast(t('awake', { name: STAFF_NAME[ev.who] }), { tone: 'good' })
            break
          case 'regularHere': {
            const c = CAST.find((x) => x.id === ev.castId)
            if (c) toast(t('regularHere', { name: c.name }))
            break
          }
          case 'friend':
            if (ev.ok) {
              setSave((sv) => ({ ...sv, friends: { ...sv.friends, [ev.castId]: Math.min(MAX_HEARTS, (sv.friends?.[ev.castId] ?? 0) + 1) } }))
              const c = CAST.find((x) => x.id === ev.castId)
              if (c) toast(t('friendUp', { name: c.name }), { tone: 'good' })
            }
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
      // Einführungstag
      const step = tutRef.current
      if (step !== null && step !== undefined && TUT[step]) {
        const T = TUT[step]
        if (!T.started) {
          T.started = true
          T.start?.(s)
        }
        guideRef.current = T.at(s)
        if (T.done(s) && TUT[step + 1]) {
          sfx('pat')
          tutRef.current = step + 1
          setTut(step + 1)
        }
      } else guideRef.current = null

      // Pfeile am Rand: was Loopy gerade braucht
      const want = []
      const add = (id, icon, at) => at && want.push({ id, icon, x: at[0], z: at[1] })
      if (guideRef.current) add('guide', '👉', guideRef.current)
      else {
        if (frontCustomer(s) && s.near !== 'counter') add('counter', '🙋', PLACES.serve)
        if (s.letter) add('mail', '✉️', PLACES.mailFront)
        if (s.inventur) add('store', '📋', PLACES.storeDoor)
        if (s.dockBoxes.length) add('dock', '📦', PLACES.dock)
        if (s.areas.cafe && s.customers.some((c) => c.state === 'sit' && !c.served && !c.claimed)) add('cafe', '☕', CAFE.machineFront)
        if (s.tour) add('tour', '🐠', AQUARIUM.front)
        for (const k of Object.values(s.staff)) if (k.asleep) add(`staff-${k.id}`, '💤', [k.x, k.z])
      }
      const old = new Map(needsRef.current.map((n) => [n.id, n]))
      needsRef.current = want.map((n) => {
        const o = old.get(n.id)
        if (!o) return { ...n, guide: n.id === 'guide' }
        o.x = n.x
        o.z = n.z
        return o
      })
      setNeeds((prev) => (prev.length === want.length && prev.every((p, i) => p.id === want[i].id) ? prev : needsRef.current.map((n) => ({ id: n.id, icon: n.icon, guide: n.guide }))))

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
    const walking = () => phaseRef.current === 'play' || phaseRef.current === 'visit'
    const down = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const d = dirOf(e)
      if (d) {
        keys.add(d)
        sync()
        if (walking()) e.preventDefault()
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

  const resetPreview = (sv = save) => {
    simRef.current = previewDay(sv)
    setCustomers([])
    setDayKey((k) => k + 1)
  }

  const quitDay = () => {
    stopMusic()
    setTut(null)
    guideRef.current = null
    resetPreview()
    setQuestion(null)
    setPhase('menu')
  }

  const toMenu = () => {
    resetPreview()
    setPhase('menu')
  }

  // Nach Käufen zeigt die Vorschau-Insel gleich das Neue (Personal, Outfit, Sorte …)
  const previewKey = JSON.stringify([save.upgrades, save.staff && Object.keys(save.staff), save.areas, save.outfit])
  useEffect(() => {
    if (phaseRef.current === 'menu' || phaseRef.current === 'summary' || phaseRef.current === 'decorate') resetPreview(save)
  }, [previewKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Kaufen ----------
  const spend = (cost, change) => {
    if (save.coins < cost) return false
    setSave((s) => (s.coins < cost ? s : change({ ...s, coins: s.coins - cost })))
    sfx('gold')
    return true
  }
  const buyUpgrade = (id) => {
    const u = UPGRADES.find((x) => x.id === id)
    if (u && !save.upgrades[id]) spend(u.cost, (s) => ({ ...s, upgrades: { ...s.upgrades, [id]: true } }))
  }
  const buyArea = (id) => {
    const a = AREAS.find((x) => x.id === id)
    if (a && !save.areas?.[id]) spend(a.cost, (s) => ({ ...s, areas: { ...s.areas, [id]: true } }))
  }
  const hire = (id) => {
    const st = STAFF.find((x) => x.id === id)
    if (st && !save.staff?.[id]) spend(st.cost, (s) => ({ ...s, staff: { ...s.staff, [id]: { energy: 100 } } }))
  }
  const buyDecor = (id) => {
    const d = decorById(id)
    if (d) spend(d.cost, (s) => ({ ...s, decorOwned: { ...s.decorOwned, [id]: (s.decorOwned?.[id] ?? 0) + 1 } }))
  }
  const buyOutfit = (id) => {
    const o = OUTFITS.find((x) => x.id === id)
    if (o && !save.wardrobe.includes(id)) spend(o.cost, (s) => ({ ...s, wardrobe: [...s.wardrobe, id], outfit: id }))
  }
  const wear = (id) => {
    if (save.wardrobe.includes(id) || id === 'none') {
      setSave((s) => ({ ...s, outfit: id }))
      sfx('pat')
    }
  }

  // ---------- Dekorieren ----------
  const owned = Object.entries(save.decorOwned ?? {}).filter(([, n]) => n > 0)
  const startDecorate = () => {
    setSheet(null)
    resetPreview()
    setPlacing(owned[0]?.[0] ?? null)
    setPhase('decorate')
  }
  const placeAt = (x, z) => {
    if (!placing || !(save.decorOwned?.[placing] > 0)) {
      toast(t('decorNone'))
      return
    }
    // nächster freier Platz in der Nähe (nicht pixelgenau tippen müssen)
    let px = null
    let pz = null
    for (let r = 0; r <= 1.0 && px === null; r += 0.2) {
      for (let k = 0; k < (r ? 12 : 1); k++) {
        const cx = Math.round((x + Math.cos((k / 12) * Math.PI * 2) * r) * 10) / 10
        const cz = Math.round((z + Math.sin((k / 12) * Math.PI * 2) * r) * 10) / 10
        if (canPlace(save, placing, cx, cz)) {
          px = cx
          pz = cz
          break
        }
      }
    }
    if (px === null) {
      sfx('nope')
      toast(t('cantPlace'))
      return
    }
    sfx('drop')
    setSave((s) => {
      const left = (s.decorOwned?.[placing] ?? 0) - 1
      const decorOwned = { ...s.decorOwned, [placing]: left }
      const next = { ...s, decorOwned, decor: [...s.decor, { id: placing, x: px, z: pz, rot: Math.round((Math.random() - 0.5) * 12) / 10 + 0.7 }] }
      if (left <= 0) {
        const other = Object.entries(decorOwned).find(([, n]) => n > 0)
        setPlacing(other?.[0] ?? null)
      }
      return next
    })
  }
  const pickDecor = (i) => {
    const d = save.decor[i]
    if (!d) return
    sfx('pickup')
    setSave((s) => ({ ...s, decor: s.decor.filter((_, k) => k !== i), decorOwned: { ...s.decorOwned, [d.id]: (s.decorOwned?.[d.id] ?? 0) + 1 } }))
    setPlacing(d.id)
    toast(t('pickedUp'))
  }

  // ---------- Freunde ----------
  const startVisit = (code) => {
    const island = decodeIsland(code)
    if (!island) return false
    setSheet(null)
    setVisit(island)
    const sv = islandAsSave(island, freshSave())
    simRef.current = previewDay(sv)
    simRef.current.visit = true
    setCustomers([])
    setDayKey((k) => k + 1)
    setPhase('visit')
    unlockAudio()
    return true
  }
  const leaveVisit = () => {
    setVisit(null)
    try {
      if (/visit=/.test(window.location.hash)) window.history.replaceState(null, '', '#/spiel')
    } catch {
      /* egal */
    }
    resetPreview()
    setPhase('menu')
  }
  const onRedeem = (code) => {
    const r = redeemGift(save, code)
    if (r.gift) {
      setSave(r.save)
      sfx('gift')
    }
    return r
  }
  const onMakeGift = (kind) => {
    const r = sendGift(save, kind, new Date())
    if (r.save !== save) setSave(r.save)
    return r
  }

  const onAudio = (change) => setSave((s) => ({ ...s, audio: { ...s.audio, ...change } }))

  const playing = phase === 'play' || phase === 'question' || phase === 'pause'
  const coinsShown = save.coins + (playing ? hud.money : 0)
  const days = currentStreak(streak)
  const labels = useMemo(
    () => ({
      sign: t('shopName'),
      store: lang === 'hu' ? 'Raktár' : lang === 'en' ? 'Storeroom' : 'Lager',
      dock: lang === 'hu' ? 'Rendelés' : lang === 'en' ? 'Orders' : 'Bestellung',
      cafe: t('cafe'),
      aquarium: t('aquarium'),
      rival: t('rivalShop'),
      rivalAd: t('rivalAd'),
    }),
    [t, lang],
  )
  const stickers = useMemo(() => (sheet === 'album' ? stickerList(save, lang) : []), [sheet, save, lang])
  const freshIds = useMemo(() => (sheet === 'album' ? newStickers(save, lang).map((s) => s.id) : []), [sheet]) // eslint-disable-line react-hooks/exhaustive-deps
  const albumNew = useMemo(() => newStickers(save, lang).length, [save, lang])
  const missionsNew = missionsReady(save)
  const actionLabel = hud.prompt ? t(`a_${hud.prompt.action}`, { name: STAFF_NAME[hud.prompt.who] ?? '' }) : ''

  // Nächstes Sparziel (immer sichtbar): das günstigste noch fehlende Stück aus Ausbau, Personal und Inselteilen
  const L3 = (o) => (typeof o === 'string' ? o : o?.[lang] ?? o?.de ?? '')
  const goal = [
    ...UPGRADES.filter((u) => !save.upgrades?.[u.id]).map((u) => ({ cost: u.cost, emoji: u.emoji, name: L3(UPGRADE_TEXT[u.id]?.name) })),
    ...STAFF.filter((x) => !save.staff?.[x.id] && (!x.needs || save.areas?.[x.needs])).map((x) => ({ cost: x.cost, emoji: x.emoji, name: STAFF_TEXT[x.id]?.name ?? x.id })),
    ...AREAS.filter((a) => !save.areas?.[a.id]).map((a) => ({ cost: a.cost, emoji: a.emoji, name: L3(AREA_TEXT[a.id]?.name) })),
  ].sort((a, b) => a.cost - b.cost)[0]

  // Am ersten Tag nur das Nötigste; danach kommt jeden Tag etwas dazu
  const menuButtons = [
    ['island', '🏝️', 0, 2],
    ['wardrobe', '👒', 0, 2],
    ['album', '📒', albumNew, 3],
    ['friends', '💌', 0, 4],
  ].filter(([, , , from]) => save.day >= from)

  return (
    <div className="game fixed inset-0 z-40 select-none overflow-hidden bg-[#EAF2FE] font-body" style={{ WebkitTouchCallout: 'none' }}>
      <div className="absolute inset-0">
        <WebGLGuard>
          <ShopWorld
            simRef={simRef}
            inputRef={inputRef}
            running={phase === 'play' || phase === 'question' || phase === 'visit'}
            follow={playing || phase === 'visit'}
            customers={customers}
            staffIds={hiredStaff(world)}
            dayKey={dayKey}
            labels={labels}
            areas={world.areas ?? {}}
            decor={world.decor ?? []}
            season={season}
            holiday={holiday}
            rival={(world.day ?? 1) >= 3}
            decorating={phase === 'decorate'}
            onGroundTap={placeAt}
            onPickDecor={pickDecor}
            onWalkTap={phase === 'play' || phase === 'visit' ? (x, z) => walkTo(x, z) : undefined}
            guideRef={guideRef}
            needsRef={needsRef}
            lite={lite}
            onSlow={() => {
              if (save.gfx === 'nice' || save.gfx === 'fast') return
              setSave((sv) => ({ ...sv, gfx: 'fast' }))
              toast(t('gfxAuto'))
            }}
          />
        </WebGLGuard>
      </div>

      {/* ---------- Menü ---------- */}
      <AnimatePresence>
        {phase === 'menu' && (
          <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 px-4 pt-[max(12px,env(safe-area-inset-top))]">
              <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
                <div className="pointer-events-auto flex items-center gap-2">
                  <button onClick={back} aria-label={t('leave')} className="game-float flex h-11 w-11 items-center justify-center rounded-full bg-surface text-accent-text active:opacity-60">
                    <ChevronLeft className="h-[22px] w-[22px]" />
                  </button>
                  {[
                    ['music', '♪'],
                    ['sfx', '🔔'],
                  ].map(([k, icon]) => (
                    <button key={k} onClick={() => onAudio({ [k]: !save.audio[k] })} aria-label={t(k === 'music' ? 'music' : 'sounds')} className={`game-float relative flex h-11 w-11 items-center justify-center rounded-full bg-surface text-[18px] font-bold active:opacity-60 ${save.audio[k] ? 'text-accent-text' : 'text-label3'}`}>
                      <span aria-hidden>{icon}</span>
                      {!save.audio[k] && <span className="absolute h-[2px] w-7 rotate-45 rounded bg-label3" />}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {days > 0 && <Pill className="text-[#FF7A00]">🔥 {days}</Pill>}
                  <Pill>
                    <span className="game-coin" />
                    <Count value={save.coins} />
                  </Pill>
                </div>
              </div>
              <div className="mx-auto mt-3 flex max-w-xl justify-end">
                <div className="pointer-events-auto flex flex-col gap-2.5">
                  {menuButtons.map(([k, icon, badge]) => (
                    <button key={k} onClick={() => setSheet(k)} className="game-float relative flex w-[58px] flex-col items-center rounded-[16px] bg-surface py-1 active:scale-95">
                      <span className="text-[22px] leading-none" aria-hidden>
                        {icon}
                      </span>
                      <span className="mt-0.5 text-[11px] font-semibold text-label2">{t(k)}</span>
                      {badge > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF5E8A] px-1 text-[11px] font-bold text-white">{badge}</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} transition={SPRING} className="absolute inset-x-0 bottom-0 max-h-[64dvh] overflow-y-auto px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              <div className="game-float mx-auto max-w-xl rounded-[26px] bg-surface/95 p-4 backdrop-blur sm:p-5">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-label2">{t('title')}</p>
                    <p className="truncate text-[24px] font-bold leading-tight">{t('shopName')}</p>
                  </div>
                  <p className="flex-none pb-0.5 text-[15px] font-semibold text-label2">{t('day', { n: save.day })}</p>
                </div>
                <button onClick={() => setSheet('material')} className="mt-3 flex w-full items-center justify-between rounded-2xl bg-bg px-4 py-2.5 text-left active:opacity-70">
                  <span>
                    <span className="block text-[12px] font-semibold uppercase tracking-wide text-label2">{t('material')}</span>
                    <span className="text-[16px] font-semibold">{materialLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-label3" />
                </button>
                {save.day >= 2 && save.missions?.list?.length > 0 && !showMissions && (
                  <button onClick={() => setShowMissions(true)} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-2.5 text-left active:opacity-70">
                    <span className="text-[20px]" aria-hidden>
                      📋
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold uppercase tracking-wide text-label2">{t('missions')}</span>
                      <span className="text-[16px] font-semibold">
                        {save.missions.list.filter((m) => m.progress >= m.target).length}/{save.missions.list.length}
                      </span>
                    </span>
                    {missionsNew > 0 && <span className="rounded-full bg-[#FF5E8A] px-2.5 py-1 text-[12px] font-bold text-white">{t('claim')}</span>}
                    <ChevronRight className="h-4 w-4 text-label3" />
                  </button>
                )}
                {save.day >= 2 && save.missions?.list?.length > 0 && showMissions && (
                  <div className="mt-2.5">
                    <MissionsCard
                      lang={lang}
                      missions={save.missions.list}
                      onClaim={(id) => {
                        setSave((s) => claimMission(s, id))
                        sfx('gift')
                      }}
                    />
                  </div>
                )}
                {goal && save.day >= 2 && (
                  <button onClick={() => setSheet('island')} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-bg px-4 py-2.5 text-left active:opacity-70">
                    <span className="text-[22px]" aria-hidden>
                      {goal.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[14px] font-semibold">
                          <span className="text-label2">{t('nextGoal')}: </span>
                          {goal.name}
                        </span>
                        <span className={`flex-none text-[13px] font-semibold tabular-nums ${save.coins >= goal.cost ? 'text-success' : 'text-label2'}`}>
                          {Math.min(save.coins, goal.cost)}/{goal.cost}
                        </span>
                      </span>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-fill/20">
                        <span className="block h-full rounded-full bg-[#F0B429]" style={{ width: `${Math.min(100, (save.coins / goal.cost) * 100)}%` }} />
                      </span>
                    </span>
                  </button>
                )}
                <p className="mt-2.5 text-center text-[12px] text-label2">{touch ? t('controlsTouch') : t('controlsKeys')}</p>
                <div className="mt-2 flex gap-3">
                  {(save.day >= 3 || owned.length > 0 || save.decor.length > 0) && (
                    <Button variant="secondary" onClick={startDecorate} className="flex-1">
                      {t('decorate')}
                    </Button>
                  )}
                  <Button onClick={startDay} disabled={!pool || !pool.all.length} className="flex-[1.4]">
                    {!pool ? t('loading') : pool.all.length ? t('startDay', { n: save.day }) : t('noQuestions')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Dekorieren ---------- */}
      <AnimatePresence>
        {phase === 'decorate' && (
          <motion.div key="decorate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute inset-x-0 top-0 px-4 pt-[max(12px,env(safe-area-inset-top))]">
              <div className="game-float mx-auto max-w-xl rounded-[20px] bg-surface/95 px-4 py-2.5 text-center text-[14px] font-semibold leading-snug">
                {placing ? t('decorHint', { item: DECOR.find((d) => d.id === placing)?.emoji ?? '' }) : t('decorNone')}
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
              <div className="game-float pointer-events-auto mx-auto max-w-xl rounded-[24px] bg-surface/95 p-3">
                <p className="px-1 text-[12px] font-semibold uppercase tracking-wide text-label2">{t('decorPick')}</p>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {owned.length === 0 && <p className="px-1 py-2 text-[14px] text-label2">{t('decorNone')}</p>}
                  {owned.map(([id, n]) => (
                    <button key={id} onClick={() => setPlacing(id)} className={`relative flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-[28px] ${placing === id ? 'bg-accent/20 ring-2 ring-accent' : 'bg-bg'}`}>
                      {decorById(id)?.emoji}
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-white">{n}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button variant="secondary" onClick={() => setSheet('island')} className="flex-1">
                    {t('island')}
                  </Button>
                  <Button onClick={toMenu} className="flex-1">
                    {t('decorDone')}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------- Zu Besuch ---------- */}
      {phase === 'visit' && visit && (
        <>
          <VisitBanner lang={lang} island={visit} onLeave={leaveVisit} onGift={() => setSheet('friends')} />
          {touch && <Joystick inputRef={inputRef} />}
        </>
      )}

      {/* ---------- Spiel ---------- */}
      {playing && (
        <>
          <Hud t={t} clock={hud.clock} progress={hud.progress} rush={hud.rush} coins={coinsShown} combo={hud.combo} onPause={() => setPhase('pause')} />
          <MoneyPops pops={pops} />
          <Toasts items={toasts} />
          {phase === 'play' && (
            <>
              <EdgeArrows
                needsRef={needsRef}
                items={needs}
                onGo={(n) => {
                  const at = needsRef.current.find((x) => x.id === n.id)
                  if (at) walkTo(at.x, at.z, !n.guide)
                }}
              />
              {tut !== null && TUT[tut] && (
                <CoachCard
                  lang={lang}
                  text={t(TUT[tut].text)}
                  step={tut}
                  steps={TUT.length}
                  skipLabel={t('tut_skip')}
                  onSkip={endTutorial}
                  action={TUT[tut].id === 'done' ? t('tut_go') : null}
                  onAction={endTutorial}
                />
              )}
              {touch && <Joystick inputRef={inputRef} />}
              <ActionButton touch={touch} prompt={hud.prompt} label={actionLabel} onAct={() => act(simRef.current)} />
            </>
          )}
        </>
      )}
      {!playing && <Toasts items={toasts} />}

      <AnimatePresence>
        {phase === 'question' && question?.mode === 'mc' && <QuestionCard key="q" t={t} item={question} onPick={pick} onNext={closeQuestion} />}
        {phase === 'question' && question?.mode === 'mg' && (
          <motion.div key={`mg-${question.key}`} initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={SPRING} className="absolute inset-x-0 bottom-0 z-20">
            <MiniGame game={question.game} lang={lang} header={question.header} onDone={closeMiniGame} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'pause' && (
          <PauseCard
            key="pause"
            t={t}
            audio={save.audio}
            onAudio={onAudio}
            gfx={lite ? 'fast' : 'nice'}
            onGfx={(g) => setSave((sv) => ({ ...sv, gfx: g }))}
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
          <Summary key="sum" t={t} day={report.day} report={report} onShop={() => setSheet('island')} onNext={startDay} onMenu={toMenu}>
            {report.fresh?.length > 0 && (
              <button
                onClick={() => {
                  setSheet('album')
                }}
                className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#FFF4D6] px-4 py-3 text-left active:opacity-80"
              >
                <span className="text-[26px]" aria-hidden>
                  {report.fresh[0].emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold">
                    {t('newStickers', { n: report.fresh.length })}
                  </span>
                  <span className="line-clamp-1 text-[13px] text-label2">{report.fresh.map((x) => x.title).join(' · ')}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-label3" />
              </button>
            )}
          </Summary>
        )}
      </AnimatePresence>

      <MaterialSheet open={sheet === 'material'} onClose={() => setSheet(null)} t={t} lang={lang} focus={focus} onChange={(f) => setSave((s) => ({ ...s, focus: f }))} exam={exam} formatDate={formatDate} />
      <IslandSheet
        open={sheet === 'island'}
        onClose={() => setSheet(null)}
        lang={lang}
        save={save}
        now={now}
        onBuyArea={buyArea}
        onHire={hire}
        onBuyUpgrade={buyUpgrade}
        onBuyDecor={buyDecor}
        onPlaceDecor={startDecorate}
      />
      <WardrobeSheet open={sheet === 'wardrobe'} onClose={() => setSheet(null)} lang={lang} save={save} now={now} onBuy={buyOutfit} onWear={wear} />
      <AlbumSheet
        open={sheet === 'album'}
        onClose={() => {
          setSheet(null)
          setSave((s) => markStickers(s, newStickers(s, lang).map((x) => x.id)))
        }}
        lang={lang}
        stickers={stickers}
        fresh={freshIds}
      />
      <FriendsSheet open={sheet === 'friends'} onClose={() => setSheet(null)} lang={lang} save={save} onVisit={startVisit} onRedeem={onRedeem} onRename={(name) => setSave((s) => ({ ...s, name }))} onMakeGift={onMakeGift} />

      <AnimatePresence>{gift && <DailyGiftCard key="gift" lang={lang} gift={gift} streak={gift.streak} onClose={() => { sfx('gift'); setGift(null) }} />}</AnimatePresence>
      <AnimatePresence>{beat && phase === 'menu' && <StoryDialog key={`story-${beat.id}`} lang={lang} beat={beat} onDone={finishBeat} />}</AnimatePresence>
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
