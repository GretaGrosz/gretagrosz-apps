// The axolotl's tips: plain rules over the app's real state. Instant, offline, no network.
// One tip at a time, never the same one twice in a row, a few a day at most, and a dismissed tip stays away for days.
import { dayOf } from '../data'
import { outfitItem } from '../components/Buddy'

const HOUR = 3600_000
export const RULES = {
  perDay: 3, // ambient tips per day (tips that answer something you just did don't count)
  gap: 4 * 60_000, // between two tips
  again: 20 * HOUR, // the same tip, shown before
  dismissed: 72 * HOUR, // the same tip, closed with ×
  stuckDays: 3,
}

// When the step you're on became your step: the project started, it was added, or the one before it was ticked
export function stepSince(p, m) {
  const prev = p.milestones.filter((x) => x.done && x.doneAt).map((x) => x.doneAt)
  return Math.max(p.createdAt || 0, m.addedAt || 0, ...prev)
}
export const stuckDaysOf = (p, m, now = Date.now()) => dayOf(now) - dayOf(stepSince(p, m))

// The project you're most likely to want next: the one you touched last, with a step left
export function focusProject(data, active) {
  const last = {}
  for (const a of data.activity) if (a.at > (last[a.projectId] || 0)) last[a.projectId] = a.at
  return (
    active
      .filter((p) => p.milestones.some((m) => !m.done))
      .sort((a, b) => (last[b.id] || b.createdAt) - (last[a.id] || a.createdAt))[0] || null
  )
}

// ---------- memory (this device) ----------
const KEY = 'blank-axo-v1'
export function loadMemory() {
  try {
    const m = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (m && typeof m === 'object') return { last: null, lastAt: 0, day: 0, count: 0, seen: {}, closed: {}, nudge: 0, ...m }
  } catch {}
  return { last: null, lastAt: 0, day: 0, count: 0, seen: {}, closed: {}, nudge: 0 }
}
export function saveMemory(m) {
  // Forget anything older than a week so this never grows
  const cut = Date.now() - 7 * 24 * HOUR
  const trim = (o) => Object.fromEntries(Object.entries(o).filter(([, t]) => t > cut))
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...m, seen: trim(m.seen), closed: trim(m.closed) }))
  } catch {}
}

function allowed(key, mem, now, ambient) {
  if (mem.last === key) return false
  if (now - (mem.closed[key] || 0) < RULES.dismissed) return false
  if (!ambient) return !mem.seen[key]
  if (now - (mem.seen[key] || 0) < RULES.again) return false
  if (now - mem.lastAt < RULES.gap) return false
  return !(mem.day === dayOf(now) && mem.count >= RULES.perDay)
}

/**
 * The one tip to show now, or null.
 * s: { data, streak, doneToday, needsToday, active, done, route, projectId, hour, now, minutes, starter, event }
 */
export function pickTip(s, mem) {
  const { data, streak, doneToday, needsToday, active, now, hour, minutes } = s
  const find = (id) => data.projects.find((p) => p.id === id)

  // Something you just did, or your buddy did: answered right away
  const e = s.event
  if (e) {
    if (e.type === 'finish') {
      const p = find(e.projectId)
      const key = `finish:${e.projectId}:${e.at}`
      if (p && p.status === 'done' && allowed(key, mem, now, false)) {
        const days = dayOf(p.finishedAt || now) - dayOf(p.createdAt) + 1
        return {
          key,
          text: days === 1 ? '{title}, done in a day. Here’s your reel.' : '{title}, done in {n} days. Here’s your reel.',
          vars: { title: p.title, n: days },
          mood: 'proud',
          action: { label: 'Play', type: 'reel', projectId: p.id },
          event: true,
        }
      }
    }
    if (e.type === 'session') {
      const p = find(e.projectId)
      const key = `session:${e.at}`
      if (p && p.status !== 'done' && allowed(key, mem, now, false)) {
        const next = p.milestones.find((m) => !m.done)
        return next
          ? {
              key,
              text: '{n} minutes, nice. Did you finish “{step}”?',
              vars: { n: e.minutes, step: next.text },
              mood: 'cheer',
              action: { label: 'Done', icon: 'check', type: 'tick', projectId: p.id, stepId: next.id },
              photo: { projectId: p.id },
              target: `[data-axo-target="project-${p.id}"]`,
              event: true,
            }
          : {
              key,
              text: '{n} minutes, nice. A photo of where you’re at?',
              vars: { n: e.minutes },
              mood: 'cheer',
              action: { label: 'Photo', icon: 'camera', type: 'photo', projectId: p.id },
              event: true,
            }
      }
    }
    if (e.type === 'outfit') {
      const item = outfitItem(e.outfit)
      const key = `outfit:${e.outfit}`
      if (item && allowed(key, mem, now, false)) {
        const wearing = data.me.outfit?.[item.slot] === item.id
        return {
          key,
          text: 'New for me: {name}.',
          vars: {},
          tvars: { name: item.name },
          mood: 'proud',
          outfit: { [item.slot]: item.id },
          action: wearing ? { label: 'Show', type: 'go', to: '/streak' } : { label: 'Wear it', type: 'wear', slot: item.slot, item: item.id },
          event: true,
        }
      }
    }
    if (e.type === 'nudge') {
      const key = `nudge:${e.at}`
      const p = focusProject(data, active)
      if (allowed(key, mem, now, false) && !doneToday) {
        return {
          key,
          text: '{name} nudged you. Your turn.',
          vars: { name: e.name },
          mood: 'wave',
          action: p && !data.session ? { label: '{n} min', vars: { n: minutes }, icon: 'timer', type: 'session', projectId: p.id } : { label: 'Open', type: 'go', to: '/' },
          event: true,
        }
      }
    }
  }

  if (data.me.tips === false) return null
  const onToday = s.route === 'today'
  const onProject = s.route === 'project'

  // The weekly streak needs today, and it's evening
  if ((onToday || onProject) && hour >= 19 && streak > 0 && needsToday && !data.session) {
    const p = (onProject && active.find((x) => x.id === s.projectId && x.milestones.some((m) => !m.done))) || focusProject(data, active)
    const key = `risk:${dayOf(now)}`
    if (p && allowed(key, mem, now, true)) {
      return {
        key,
        text: streak === 1 ? 'Your streak needs today. Quick {m} minutes?' : 'Your {n}-week streak needs today. Quick {m} minutes?',
        vars: { n: streak, m: minutes },
        mood: 'worried',
        action: { label: 'Start', icon: 'timer', type: 'session', projectId: p.id },
        target: `[data-axo-target="project-${p.id}"]`,
      }
    }
  }

  // The same step for days: offer to break it up
  if (onToday || onProject) {
    const pool = onProject ? active.filter((p) => p.id === s.projectId) : active
    for (const p of pool) {
      const m = p.milestones.find((x) => !x.done)
      if (!m) continue
      const days = stuckDaysOf(p, m, now)
      const key = `stuck:${m.id}`
      if (days >= RULES.stuckDays && allowed(key, mem, now, true)) {
        return {
          key,
          text: '“{step}” has been waiting {n} days. Split it up?',
          vars: { step: m.text, n: days },
          mood: 'thinking',
          action: { label: 'Split', type: 'split', projectId: p.id, stepId: m.id },
          target: `[data-axo-target="project-${p.id}"]`,
        }
      }
    }
  }

  // Today: the one next step, one tap to start the timer
  if (onToday && !doneToday && !data.session && hour >= 6 && hour < 22) {
    const p = focusProject(data, active)
    const m = p?.milestones.find((x) => !x.done)
    const key = m && `next:${m.id}`
    if (m && allowed(key, mem, now, true)) {
      return {
        key,
        text: '{n} minutes on “{step}”?',
        vars: { n: minutes, step: m.text },
        mood: 'happy',
        action: { label: 'Start', icon: 'timer', type: 'session', projectId: p.id },
        target: `[data-axo-target="project-${p.id}"]`,
      }
    }
  }

  // Nothing on the go
  if (onToday && !active.length && s.starter && allowed('empty', mem, now, true)) {
    return {
      key: 'empty',
      text: s.done.length ? 'What’s next? “{idea}” could be fun.' : 'Nothing on the go yet. How about “{idea}”?',
      vars: { idea: s.starter.label },
      mood: 'wave',
      action: { label: 'Start', type: 'starter' },
      target: '[data-axo-target="starters"]',
    }
  }
  return null
}

// Write down that a tip was shown
export function remember(mem, tip, now) {
  const today = dayOf(now)
  const before = mem.day === today ? mem.count : 0
  return { ...mem, last: tip.key, lastAt: now, day: today, count: tip.event ? before : before + 1, seen: { ...mem.seen, [tip.key]: now } }
}
// …and that it was closed with ×
export const rememberClosed = (mem, tip, now) => ({ ...mem, closed: { ...mem.closed, [tip.key]: now } })
