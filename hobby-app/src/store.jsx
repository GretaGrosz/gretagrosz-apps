// All app data lives here, saved on this device: the text in localStorage, photos in IndexedDB (media.js).
// With an account (account.jsx) the text is also kept in step with the server; photos never leave the device.
// Nothing is invented: a new user starts with no projects, no streak and no history.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { uid, weeklyStreak, bestWeeklyStreak, countedWeeks, frozenWeeks, goalFor, weekOf, daysThisWeek, dayOf } from './data'
import { CHALLENGES, checkinsThisMonth, monthKey } from './challenges'
import { OUTFITS, RENAMED } from './components/Buddy'
import { stepHow, stepText } from './guides'
import { readLang, translate } from './i18n'
import {
  askPersistentStorage,
  blobToDataUrl,
  clearPhotos,
  clearStateCopy,
  dataUrlToBlob,
  deletePhotos,
  getPhotoBlob,
  loadStateCopy,
  savePhoto,
  saveStateCopy,
} from './media'

const KEY = 'blank-data-v2'
const VERSION = 6
const Ctx = createContext(null)

export const emptyData = () => ({
  version: VERSION,
  onboarded: false,
  me: { name: '', prefs: null, outfit: {}, tips: true },
  projects: [],
  activity: [],
  freezes: { available: 0, used: [], earned: [] },
  challenges: {},
  challengeWins: [],
  unlockedNotified: null,
  // A hobby outfit for each project you finished and posted: { [projectId]: item id, or null until you pick one }
  picks: {},
  session: null,
  buddy: null,
  focusId: null,
})

// ---------- bringing data from older versions over ----------

const OLD_ME = 'u_me'
// The demo projects older versions put in every new account. Dropped unless you changed them.
const SEED_PROJECTS = {
  pr_guitar: { done: ['m1', 'm2'], steps: ['m1', 'm2', 'm3', 'm4', 'm5'], updates: ['up1', 'up2'] },
  pr_world: { done: ['m6'], steps: ['m6', 'm7', 'm8', 'm9'], updates: ['up3'] },
}
function untouchedSeed(p) {
  const seed = SEED_PROJECTS[p.id]
  if (!seed) return false
  const ids = p.milestones.map((m) => m.id)
  const done = p.milestones.filter((m) => m.done).map((m) => m.id)
  return ids.join() === seed.steps.join() && done.join() === seed.done.join() && p.updates.every((u) => seed.updates.includes(u.id)) && p.status !== 'done'
}
const ownPhoto = (src) => (typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('idb:')) ? src : null)

export function migrateLegacy(old) {
  const d = emptyData()
  const meUser = (old.users || []).find((u) => u.id === OLD_ME) || {}
  d.onboarded = !!old.onboarded
  d.me = { name: meUser.name && meUser.name !== 'You' ? meUser.name : '', prefs: meUser.prefs || null, outfit: meUser.outfit || {} }

  const kept = (old.projects || []).filter((p) => p.userId === OLD_ME && !untouchedSeed(p))
  const keptIds = new Set(kept.map((p) => p.id))
  const myPosts = (old.posts || []).filter((p) => p.userId === OLD_ME && !(p.id === 'p20' && !keptIds.has('pr_guitar')))

  d.projects = kept.map((p) => {
    const finishPost = myPosts.find((x) => x.projectId === p.id && x.kind === 'made' && /^Finished: /.test(x.title || ''))
    const entries = (p.updates || []).map((u) => ({ id: u.id, at: u.createdAt, text: u.text || '', photo: ownPhoto(u.image), ratio: null, kind: 'note' }))
    for (const post of myPosts.filter((x) => x.projectId === p.id && x !== finishPost)) {
      entries.push({
        id: post.id,
        at: post.createdAt,
        text: [post.title, post.caption].filter(Boolean).join('\n'),
        photo: ownPhoto(post.image),
        ratio: post.ratio || null,
        kind: 'note',
      })
    }
    const finishPhoto = ownPhoto(p.cover) || ownPhoto(finishPost?.image)
    const finishedAt = p.status === 'done' ? finishPost?.createdAt || Math.max(p.createdAt, ...entries.map((e) => e.at)) : null
    if (finishPhoto || finishPost?.caption) {
      entries.push({
        id: uid('en'),
        at: finishedAt || Date.now(),
        text: finishPost?.caption || '',
        photo: finishPhoto,
        ratio: finishPost?.ratio || null,
        kind: 'finish',
      })
    }
    return {
      id: p.id,
      title: p.title,
      category: p.category || 'other',
      guideKey: null,
      description: p.description || '',
      createdAt: p.createdAt,
      status: p.status === 'done' ? 'done' : 'active',
      finishedAt,
      milestones: (p.milestones || []).map((m) => ({ id: m.id, text: m.text, done: !!m.done, doneAt: null })),
      entries: entries.sort((a, b) => b.at - a.at),
      sessions: [],
      resources: p.resources || [],
    }
  })

  // Posts you made that weren't part of a project become a project of their own, so nothing you made is lost
  for (const post of myPosts.filter((x) => !x.projectId || !keptIds.has(x.projectId))) {
    const done = post.kind === 'made'
    d.projects.push({
      id: uid('pr'),
      title: (post.title || '').replace(/^Finished: /, '') || 'Untitled',
      category: post.category || 'other',
      guideKey: null,
      description: '',
      createdAt: post.createdAt,
      status: done ? 'done' : 'active',
      finishedAt: done ? post.createdAt : null,
      milestones: [],
      entries: [
        { id: post.id, at: post.createdAt, text: post.caption || '', photo: ownPhoto(post.image), ratio: post.ratio || null, kind: done ? 'finish' : 'note' },
      ],
      sessions: [],
      resources: [],
    })
  }
  d.projects.sort((a, b) => b.createdAt - a.createdAt)

  const projectIds = new Set(d.projects.map((p) => p.id))
  d.activity = (old.activity || [])
    .filter((a) => projectIds.has(a.projectId) || String(a.projectId).startsWith('challenge:'))
    .map((a) => ({ projectId: a.projectId, at: a.at, kind: String(a.projectId).startsWith('challenge:') ? 'challenge' : 'step' }))
  // The free streak freeze older versions handed out with the demo history only stays if you have real history
  d.freezes = d.activity.length && old.freezes ? old.freezes : { available: 0, used: [], earned: [] }
  d.challenges = old.challenges || {}
  d.challengeWins = (old.challengeWins || []).map((w) => (w.includes(':') ? w : `${w}:legacy`))
  d.unlockedNotified = old.unlockedNotified ?? null
  return d
}

// Outfits from the first wardrobe carry over to the item that replaced them
const renamed = (id) => RENAMED[id] || id
const renameOutfit = (outfit) => Object.fromEntries(Object.entries(outfit || {}).map(([slot, id]) => [slot, id && renamed(id)]))

// What the lootboxes of the short-lived store dropped stays yours, as picks
const boxPicks = (wallet) => Object.fromEntries((wallet?.boxes || []).map((b) => [`box:${b.id}`, b.item]))

function normalize(d) {
  const base = emptyData()
  const me = { ...base.me, ...(d.me || {}) }
  return {
    ...base,
    ...d,
    me: { ...me, outfit: renameOutfit(me.outfit) },
    unlockedNotified: d.unlockedNotified ? [...new Set(d.unlockedNotified.map(renamed))] : d.unlockedNotified ?? null,
    freezes: { ...base.freezes, ...(d.freezes || {}) },
    picks: { ...boxPicks(d.wallet), ...(d.picks || {}) },
    wallet: undefined,
    projects: (d.projects || []).map((p) => ({ milestones: [], entries: [], sessions: [], resources: [], description: '', ...p })),
    version: VERSION,
  }
}

export function upgrade(raw) {
  if (!raw || typeof raw !== 'object') return emptyData()
  if ((raw.version || 2) < 6 || Array.isArray(raw.users)) return migrateLegacy(raw)
  return normalize(raw)
}

function load() {
  let raw = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return { data: emptyData(), problem: 'unavailable' }
  }
  if (!raw) return { data: emptyData(), problem: null }
  try {
    return { data: upgrade(JSON.parse(raw)), problem: null }
  } catch {
    // Never throw away something we can't read: park it under another key first
    try {
      localStorage.setItem(`${KEY}-unreadable-${Date.now()}`, raw)
    } catch {}
    return { data: emptyData(), problem: 'unreadable' }
  }
}

// ---------- things that happen on their own after you do something ----------
// Streak freezes and challenge wins. Returns [data, events]; same object when nothing changed.
function sync(d) {
  let n = d
  const events = []
  const times = n.activity.map((a) => a.at)
  const goals = n.me.weekGoals || {}
  const week = weekOf(Date.now())

  // A missed week gets covered by a saved streak freeze, if the week before it counted
  if (n.freezes.available > 0 && times.length) {
    const done = countedWeeks(times, goals, frozenWeeks(n.freezes.used))
    if (!done.has(week - 1) && done.has(week - 2)) {
      n = { ...n, freezes: { ...n.freezes, available: n.freezes.available - 1, used: [...n.freezes.used, `w:${week - 1}`] } }
      events.push({ text: 'A streak freeze saved your streak last week.' })
    }
  }

  // Every 4 weeks in a row earns a freeze (you can keep up to 2)
  const frozen = frozenWeeks(n.freezes.used)
  const streak = weeklyStreak(times, goals, frozen)
  if (streak > 0 && streak % 4 === 0) {
    const last = countedWeeks(times, goals, frozen).has(week) ? week : week - 1
    const key = `w${last - streak + 1}-${streak}`
    if (!n.freezes.earned.includes(key)) {
      const gotOne = n.freezes.available < 2
      n = { ...n, freezes: { ...n.freezes, available: Math.min(2, n.freezes.available + 1), earned: [...n.freezes.earned, key] } }
      if (gotOne) events.push({ text: '{n} weeks in a row. You earned a streak freeze.', vars: { n: streak } })
    }
  }

  // Finishing a monthly challenge (stored per month, so next month starts fresh)
  const month = monthKey()
  for (const ch of CHALLENGES) {
    const key = `${ch.id}:${month}`
    if (!n.challengeWins.includes(key) && checkinsThisMonth(n.challenges[ch.id]).length >= ch.goal) {
      n = { ...n, challengeWins: [...n.challengeWins, key] }
      events.push({ text: 'Challenge finished: {title}', vars: { titleKey: ch.id }, kind: 'challenge' })
    }
  }

  return [n, events]
}

// Other parts of the app (the buddy link) listen for things you did
const activityListeners = new Set()
export const onActivity = (fn) => {
  activityListeners.add(fn)
  return () => activityListeners.delete(fn)
}
const announce = (evt) =>
  activityListeners.forEach((fn) => {
    try {
      fn(evt)
    } catch {}
  })

// Photos of removed entries wait here until their Undo has expired
const pendingPhotoDeletes = new Map()

// ---------- backup files ----------
const BACKUP_FORMAT = 'blank-backup'

async function collectPhotos(data) {
  const refs = new Set()
  for (const p of data.projects) for (const e of p.entries) if (e.photo?.startsWith('idb:')) refs.add(e.photo)
  const photos = {}
  for (const ref of refs) {
    const blob = await getPhotoBlob(ref).catch(() => null)
    if (blob) photos[ref] = await blobToDataUrl(blob)
  }
  return photos
}

export async function makeBackup(data) {
  const photos = await collectPhotos(data)
  const body = JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), data, photos })
  return new Blob([body], { type: 'application/json' })
}

export async function readBackup(file) {
  let parsed
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('not-backup')
  }
  if (!parsed || parsed.format !== BACKUP_FORMAT || !parsed.data || !Array.isArray(parsed.data.projects)) throw new Error('not-backup')
  const data = upgrade(parsed.data)
  const photos = parsed.photos || {}
  // Write every photo first; only then swap the references, so a failed import leaves nothing half-done
  const map = {}
  const written = []
  try {
    for (const [ref, dataUrl] of Object.entries(photos)) {
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) continue
      const newRef = await savePhoto(await dataUrlToBlob(dataUrl))
      written.push(newRef)
      map[ref] = newRef
    }
  } catch (e) {
    await deletePhotos(written)
    throw e
  }
  data.projects = data.projects.map((p) => ({
    ...p,
    entries: p.entries.map((e) => (e.photo && e.photo.startsWith('idb:') ? { ...e, photo: map[e.photo] || null } : e)),
  }))
  return data
}

// ---------- the provider ----------

export function StoreProvider({ children }) {
  const [{ data: initial, problem }] = useState(load)
  const [data, setData] = useState(initial)
  const [saveError, setSaveError] = useState(problem === 'unavailable' ? 'unavailable' : null)
  const [loadProblem, setLoadProblem] = useState(problem === 'unreadable' ? 'unreadable' : null)
  const [saveTick, setSaveTick] = useState(0)
  const [toasts, setToasts] = useState([])
  const dataRef = useRef(data)
  dataRef.current = data
  const copyChecked = useRef(false)

  const toast = useCallback((t) => {
    const item = { id: uid('t'), ...t }
    setToasts((list) => [...list.slice(-2), item])
    return item.id
  }, [])
  const dismissToast = useCallback((id) => setToasts((list) => list.filter((x) => x.id !== id)), [])

  // Streak freezes, challenge wins
  useEffect(() => {
    const [next, events] = sync(dataRef.current)
    if (next !== dataRef.current) setData(next)
    // A new outfit is the axolotl's news to tell (assistant/Assistant.jsx shows it on the axolotl); the rest are toasts
    events.forEach((e) => (e.vars?.outfit ? announce({ kind: 'outfit', outfit: e.vars.outfit }) : toast(e)))
  }, [data.activity, data.challenges, toast])

  // Save every change: to localStorage and to a copy in IndexedDB. Only if both fail is anything at risk,
  // and then it says so, and keeps saying so, until a save works.
  useEffect(() => {
    const json = JSON.stringify({ ...data, savedAt: Date.now() })
    let local = null
    try {
      localStorage.setItem(KEY, json)
    } catch (e) {
      local = e && (e.name === 'QuotaExceededError' || e.code === 22) ? 'quota' : 'failed'
    }
    if (!local) setSaveError(null)
    // Until the IndexedDB copy has been read at start, don't overwrite it (it may be the newer one)
    if (!copyChecked.current) {
      if (local) setSaveError(local)
      return
    }
    let alive = true
    saveStateCopy(json)
      .then(() => alive && local && setSaveError(null))
      .catch(() => alive && local && setSaveError(local))
    return () => {
      alive = false
    }
  }, [data, saveTick])

  // If the last save only reached IndexedDB (localStorage was full), that copy is the newer one
  useEffect(() => {
    let alive = true
    loadStateCopy().then((json) => {
      if (!alive) return
      copyChecked.current = true
      try {
        const copy = json && JSON.parse(json)
        if (copy && (copy.savedAt || 0) > (initial.savedAt || 0)) return setData(upgrade(copy))
      } catch {}
      setSaveTick((n) => n + 1) // write the copy now
    })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Another tab changed the data
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY || !e.newValue) return
      try {
        setData(upgrade(JSON.parse(e.newValue)))
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Photos from older versions are text inside localStorage: move them into IndexedDB once.
  // One stored photo per entry, even if two entries had the same picture, so deleting one never empties the other.
  useEffect(() => {
    askPersistentStorage()
    const inline = []
    for (const p of dataRef.current.projects) for (const e of p.entries) if (e.photo?.startsWith('data:')) inline.push({ pid: p.id, eid: e.id, src: e.photo })
    if (!inline.length) return
    let cancelled = false
    ;(async () => {
      const map = {}
      for (const { pid, eid, src } of inline) {
        try {
          map[`${pid}/${eid}`] = await savePhoto(await dataUrlToBlob(src))
        } catch {
          break // IndexedDB not available: the rest simply stay where they are
        }
      }
      if (cancelled) {
        deletePhotos(Object.values(map))
        return
      }
      if (!Object.keys(map).length) return
      setData((d) => ({
        ...d,
        projects: d.projects.map((p) => ({
          ...p,
          entries: p.entries.map((e) => (map[`${p.id}/${e.id}`] && e.photo?.startsWith('data:') ? { ...e, photo: map[`${p.id}/${e.id}`] } : e)),
        })),
      }))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const actions = useMemo(() => {
    const set = setData
    const mapProject = (id, fn) => set((d) => ({ ...d, projects: d.projects.map((p) => (p.id === id ? fn(p) : p)) }))
    const projectById = (id) => dataRef.current.projects.find((p) => p.id === id)
    // A project you finished earns an outfit to pick (components/OutfitPick.jsx), once.
    // Returns true when it's new, so the picker can open.
    const earnPick = (pid) => {
      if (pid in dataRef.current.picks) return false
      dataRef.current = { ...dataRef.current, picks: { ...dataRef.current.picks, [pid]: null } }
      set((d) => (pid in d.picks ? d : { ...d, picks: { ...d.picks, [pid]: null } }))
      announce({ kind: 'pick', key: pid })
      return true
    }

    return {
      toast,
      setMe: (patch) => set((d) => ({ ...d, me: { ...d.me, ...patch } })),
      // Days a week that count for the streak, from this week on (data.js goalFor)
      setWeekGoal: (n) => set((d) => ({ ...d, me: { ...d.me, weekGoals: { ...(d.me.weekGoals || {}), [weekOf(Date.now())]: Math.min(7, Math.max(1, n)) } } })),
      completeOnboarding: (prefs) => set((d) => ({ ...d, onboarded: true, me: { ...d.me, prefs } })),
      // The quick questions before a start (Journey.jsx): remembered, so next time they're filled in already
      savePrefs: (patch) => set((d) => ({ ...d, me: { ...d.me, prefs: { ...(d.me.prefs || {}), ...patch } } })),
      retakeOnboarding: () => set((d) => ({ ...d, onboarded: false })),

      addProject: ({ title, category = 'other', guideKey = null, steps = [], resources = [], materials = [], description = '', from = null, fromPost = null, headStart = true }) => {
        const now = Date.now()
        const p = {
          id: uid('pr'),
          title: title.trim(),
          category,
          guideKey,
          description,
          createdAt: now,
          status: 'active',
          finishedAt: null,
          // A step from a plan carries its how line (guides.js); plain strings (your own steps, shared links) don't
          milestones: [
            // A head start: choosing the project already counts, so the bar starts at 1 and not 0 (the endowed
            // progress effect: a loyalty card with 2 stamps already on it gets finished far more often)
            ...(headStart && steps.length ? [{ id: uid('m'), text: translate(readLang(), 'Choose your project'), auto: true, done: true, doneAt: now, addedAt: now }] : []),
            ...steps
              .map((s) => ({ text: stepText(s).trim(), how: stepHow(s).trim(), quick: !!s?.quick }))
              .filter((s) => s.text)
              .map(({ text, how, quick }) => ({ id: uid('m'), text, ...(how && { how }), ...(quick && { quick }), done: false, doneAt: null, addedAt: now })),
          ],
          entries: [],
          sessions: [],
          resources,
          ...(materials.length && { materials }), // what you need (from an AI plan, plan.js)
          ...(from && { from }), // { code, name }: started from someone's shared link (sparks.js)
          ...(fromPost && { fromPost }), // the post it was started from: its photo shows until you add your own
        }
        set((d) => ({ ...d, projects: [p, ...d.projects] }))
        return p.id
      },
      updateProject: (id, patch) => mapProject(id, (p) => ({ ...p, ...patch })),
      // Your shared links' latest counts from the server: { code: n }
      setSparkCounts: (counts) =>
        set((d) => ({
          ...d,
          projects: d.projects.map((p) => (p.spark && counts[p.spark.code] != null ? { ...p, spark: { ...p.spark, started: counts[p.spark.code] } } : p)),
        })),
      deleteProject: (id) => {
        const p = projectById(id)
        if (!p) return
        set((d) => ({
          ...d,
          projects: d.projects.filter((x) => x.id !== id),
          session: d.session?.projectId === id ? null : d.session,
        }))
        deletePhotos(p.entries.map((e) => e.photo).filter(Boolean))
      },

      // Ticking a step counts as activity; unticking takes that activity back
      toggleStep: (pid, mid) => {
        const p = projectById(pid)
        const m = p?.milestones.find((x) => x.id === mid)
        if (!m) return
        const nowDone = !m.done
        const at = Date.now()
        set((d) => ({
          ...d,
          projects: d.projects.map((x) =>
            x.id !== pid ? x : { ...x, milestones: x.milestones.map((s) => (s.id === mid ? { ...s, done: nowDone, doneAt: nowDone ? at : null } : s)) },
          ),
          activity: nowDone
            ? [...d.activity, { projectId: pid, at, kind: 'step', stepId: mid }]
            : d.activity.filter((a) => !(a.stepId === mid && dayOf(a.at) === dayOf(at))),
        }))
        if (nowDone) announce({ kind: 'step', projectId: pid, project: p.title, step: m.text })
        return nowDone
      },
      addStep: (pid, text) =>
        mapProject(pid, (p) => ({ ...p, milestones: [...p.milestones, { id: uid('m'), text: text.trim(), done: false, doneAt: null, addedAt: Date.now() }] })),
      // A step that was too big becomes a few smaller ones, in its place
      splitStep: (pid, mid, texts) => {
        const clean = texts.map((x) => x.trim()).filter(Boolean)
        if (!clean.length) return
        const at = Date.now()
        mapProject(pid, (p) => {
          const index = p.milestones.findIndex((m) => m.id === mid)
          if (index < 0) return p
          const list = [...p.milestones]
          list.splice(index, 1, ...clean.map((text) => ({ id: uid('m'), text, done: false, doneAt: null, addedAt: at })))
          return { ...p, milestones: list }
        })
      },
      // A reworded step loses its how line: it was written for the old wording
      editStep: (pid, mid, text) =>
        mapProject(pid, (p) => ({
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id !== mid || m.text === text.trim()) return m
            const { how, ...rest } = m
            return { ...rest, text: text.trim() }
          }),
        })),
      removeStep: (pid, mid) => {
        const p = projectById(pid)
        const index = p?.milestones.findIndex((m) => m.id === mid) ?? -1
        if (index < 0) return null
        const step = p.milestones[index]
        mapProject(pid, (x) => ({ ...x, milestones: x.milestones.filter((m) => m.id !== mid) }))
        return { step, index }
      },
      restoreStep: (pid, { step, index }) =>
        mapProject(pid, (p) => {
          if (p.milestones.some((m) => m.id === step.id)) return p
          const list = [...p.milestones]
          list.splice(Math.min(index, list.length), 0, step)
          return { ...p, milestones: list }
        }),

      // tag: a quick update's kind (journey.js TAGS), step: the step it finished (a milestone id)
      addEntry: (pid, { text = '', photo = null, ratio = null, tag = null, step = null }) => {
        const p = projectById(pid)
        const at = Date.now()
        const entry = { id: uid('en'), at, text: text.trim(), photo, ratio, kind: 'note', ...(tag && { tag }), ...(step && { step }) }
        set((d) => ({
          ...d,
          projects: d.projects.map((x) => (x.id === pid ? { ...x, entries: [entry, ...x.entries] } : x)),
          activity: [...d.activity, { projectId: pid, at, kind: 'entry' }],
        }))
        if (p) announce({ kind: photo ? 'photo' : 'entry', projectId: pid, project: p.title })
        return entry.id
      },
      // Removing with Undo: the entry goes at once, its photo only once Undo can no longer bring it back
      removeEntry: (pid, eid) => {
        const p = projectById(pid)
        const index = p?.entries.findIndex((x) => x.id === eid) ?? -1
        if (index < 0) return null
        const entry = p.entries[index]
        mapProject(pid, (x) => ({ ...x, entries: x.entries.filter((e) => e.id !== eid) }))
        if (entry.photo) pendingPhotoDeletes.set(entry.id, setTimeout(() => (pendingPhotoDeletes.delete(entry.id), deletePhotos([entry.photo])), 8000))
        return { entry, index }
      },
      restoreEntry: (pid, { entry, index }) => {
        clearTimeout(pendingPhotoDeletes.get(entry.id))
        pendingPhotoDeletes.delete(entry.id)
        mapProject(pid, (p) => {
          if (p.entries.some((e) => e.id === entry.id)) return p
          const list = [...p.entries]
          list.splice(Math.min(index, list.length), 0, entry)
          return { ...p, entries: list }
        })
      },
      deleteEntry: (pid, eid) => {
        const e = projectById(pid)?.entries.find((x) => x.id === eid)
        mapProject(pid, (p) => ({ ...p, entries: p.entries.filter((x) => x.id !== eid) }))
        if (e?.photo) deletePhotos([e.photo])
      },

      finishProject: (pid, { text = '', photo = null, ratio = null } = {}) => {
        const p = projectById(pid)
        if (!p) return
        const at = Date.now()
        const entry = photo || text.trim() ? { id: uid('en'), at, text: text.trim(), photo, ratio, kind: 'finish' } : null
        set((d) => ({
          ...d,
          projects: d.projects.map((x) => (x.id === pid ? { ...x, status: 'done', finishedAt: at, entries: entry ? [entry, ...x.entries] : x.entries } : x)),
          activity: [...d.activity, { projectId: pid, at, kind: 'finish' }],
          session: d.session?.projectId === pid ? null : d.session,
        }))
        announce({ kind: 'finish', projectId: pid, project: p.title })
        // Finishing a project earns an outfit to pick (components/OutfitPick.jsx)
        earnPick(pid)
      },
      // Which active project Today shows open; the others wait as rows
      focusProject: (pid) => set((d) => ({ ...d, focusId: pid })),
      reopenProject: (pid) => mapProject(pid, (p) => ({ ...p, status: 'active', finishedAt: null })),

      // Focus sessions: a timer sized to the time you said you have; a finished session counts for the streak
      startSession: (pid, minutes) => set((d) => ({ ...d, session: { projectId: pid, startedAt: Date.now(), minutes } })),
      endSession: (keep) => {
        const s = dataRef.current.session
        if (!s) return 0
        const minutes = Math.min(s.minutes, Math.max(1, Math.round((Date.now() - s.startedAt) / 60000)))
        const p = projectById(s.projectId)
        set((d) => {
          if (!keep || !p) return { ...d, session: null }
          const at = Date.now()
          return {
            ...d,
            session: null,
            projects: d.projects.map((x) => (x.id === s.projectId ? { ...x, sessions: [...x.sessions, { at, minutes }] } : x)),
            activity: [...d.activity, { projectId: s.projectId, at, kind: 'session' }],
          }
        })
        if (keep && p) announce({ kind: 'session', projectId: s.projectId, project: p.title, minutes })
        return keep ? minutes : 0
      },

      joinChallenge: (id) => set((d) => ({ ...d, challenges: { ...d.challenges, [id]: d.challenges[id] || { joinedAt: Date.now(), days: [] } } })),
      leaveChallenge: (id) =>
        set((d) => {
          const { [id]: _, ...rest } = d.challenges
          return { ...d, challenges: rest }
        }),
      checkInChallenge: (id) =>
        set((d) => {
          const entry = d.challenges[id] || { joinedAt: Date.now(), days: [] }
          const today = dayOf(Date.now())
          if (entry.days.includes(today)) return d
          return {
            ...d,
            challenges: { ...d.challenges, [id]: { ...entry, days: [...entry.days, today] } },
            activity: [...d.activity, { projectId: `challenge:${id}`, at: Date.now(), kind: 'challenge' }],
          }
        }),

      earnPick,
      choosePick: (key, itemId) => set((d) => ({ ...d, picks: { ...d.picks, [key]: itemId }, me: { ...d.me, outfit: { ...d.me.outfit, [OUTFITS.find((o) => o.id === itemId).slot]: itemId } } })),

      setBuddy: (buddy) => set((d) => ({ ...d, buddy })),
      patchBuddy: (patch) => set((d) => (d.buddy ? { ...d, buddy: { ...d.buddy, ...patch } } : d)),

      replaceAll: (next) => set(normalize({ ...next, onboarded: true })),
      // Data from your account (account.jsx): taken as it is; returns what this device now holds
      adopt: (next) => {
        const d = upgrade(next)
        dataRef.current = d
        set(d)
        return d
      },
      resetAll: async () => {
        await clearPhotos()
        await clearStateCopy()
        set(emptyData())
      },
      retrySave: () => setSaveTick((n) => n + 1),
      clearLoadProblem: () => setLoadProblem(null),
    }
  }, [toast])

  const value = useMemo(() => {
    const times = data.activity.map((a) => a.at)
    // The streak is in weeks: a week counts with weekGoal different days of hobby in it (data.js)
    const goals = data.me.weekGoals || {}
    const weekGoal = goalFor(goals, weekOf(Date.now()))
    const frozen = frozenWeeks(data.freezes.used)
    const streak = weeklyStreak(times, goals, frozen)
    const bestStreak = Math.max(bestWeeklyStreak(times, goals, frozen), streak)
    const doneToday = new Set(times.map(dayOf)).has(dayOf(Date.now()))
    const thisWeek = daysThisWeek(times)
    const weekDone = thisWeek >= weekGoal
    const picked = new Set(Object.values(data.picks).filter(Boolean))
    // Yours: picked after finishing a project, or earned the old way (streak days, challenges) before outfits worked like this
    const isUnlocked = (item) => picked.has(item.id) || !!data.unlockedNotified?.includes(item.id)
    // A finished, posted project whose outfit you haven't picked yet
    const openPick = Object.keys(data.picks).find((k) => !data.picks[k]) || null
    const daysWorked = (pid) => new Set(data.activity.filter((a) => a.projectId === pid).map((a) => dayOf(a.at))).size
    const active = data.projects.filter((p) => p.status !== 'done')
    const done = data.projects.filter((p) => p.status === 'done').sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))
    return { data, actions, streak, bestStreak, doneToday, thisWeek, weekGoal, weekDone, isUnlocked, openPick, daysWorked, active, done, toasts, dismissToast, saveError, loadProblem }
  }, [data, actions, toasts, dismissToast, saveError, loadProblem])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
