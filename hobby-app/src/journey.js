// Journeys: quick updates while you make something, and a plan others can follow made from them at the end.
// An update is a photo, a tap on a tag and maybe a line of text (components/Journey.jsx QuickUpdate); the date and
// the order come by themselves. No AI here: the draft is built by simple rules, so it's free and instant (the AI
// "tidy" is a separate, optional button: worker/blank-ai.js mode 'tidy').

export const TAG = {
  step: { label: 'Finished a step', icon: 'check' },
  bought: { label: 'Bought materials', icon: 'list' },
  mistake: { label: 'Made a mistake', icon: 'warning' },
  tip: { label: 'Tip', icon: 'pin' },
}
export const TAGS = Object.keys(TAG)

const DAY = 86_400_000
// How long it took, as a post's time (data.js TIME_LABEL): one day → hours, a week → days, ~a month → weeks
export function timeOf(from, to) {
  const days = (to - from) / DAY
  if (days < 1) return 'hours'
  if (days <= 7) return 'days'
  if (days <= 45) return 'weeks'
  return 'months'
}

// What you bought, as separate items: "wool, needles; stuffing" → 3 items
const items = (text) =>
  String(text || '')
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1 && x.length <= 80)

/**
 * The draft plan from a project's updates.
 * Steps: every step you ticked, in the order you ticked them, plus updates tagged "Finished a step" that aren't one of
 * the project's steps. A mistake or tip you noted goes with the step you were working on then (the next one you
 * ticked after it; after the last one, the last step). A line of your own on a finished-step update joins it too.
 * Materials: what you tagged "Bought materials", plus the project's own list. Time: first update to the end.
 * label(key) translates "Watch out:" and "Tip:" (the plan is written in the app's language).
 * → { steps: [{ text, how }], materials: [], time }
 */
export function draftPlan(project, label = (s) => s) {
  const entries = [...(project.entries || [])].sort((a, b) => a.at - b.at)
  const ms = (project.milestones || []).filter((m) => !m.auto)
  const stepOf = (e) => ms.find((m) => m.id === e.step) || (!e.tag || e.tag === 'step' ? ms.find((m) => m.text === e.text) : null)
  // When each step was finished: its tick, or the update that finished it
  const steps = []
  for (const m of ms.filter((x) => x.done)) steps.push({ text: m.text, at: m.doneAt || 0, notes: [], how: m.how || '', id: m.id })
  for (const e of entries) {
    const m = stepOf(e)
    if (m) {
      const s = steps.find((x) => x.id === m.id)
      if (s && !s.at) s.at = e.at
      if (s && e.text && e.text.trim() !== m.text) s.notes.push(e.text.trim())
    } else if (e.tag === 'step' && e.text?.trim() && !steps.some((x) => x.text === e.text.trim())) {
      steps.push({ text: e.text.trim(), at: e.at, notes: [], how: '' })
    }
  }
  steps.sort((a, b) => a.at - b.at)
  for (const e of entries) {
    if ((e.tag !== 'mistake' && e.tag !== 'tip') || !e.text?.trim()) continue
    const s = steps.find((x) => x.at >= e.at) || steps[steps.length - 1]
    if (s) s.notes.splice(s.notes.length, 0, `${label(e.tag === 'mistake' ? 'Watch out:' : 'Tip:')} ${e.text.trim()}`)
  }
  const materials = []
  for (const x of [...entries.filter((e) => e.tag === 'bought').flatMap((e) => items(e.text)), ...(project.materials || [])]) {
    if (!materials.some((y) => y.toLowerCase() === x.toLowerCase())) materials.push(x)
  }
  const start = entries[0]?.at ?? project.createdAt ?? Date.now()
  const end = project.finishedAt || entries[entries.length - 1]?.at || Date.now()
  return {
    steps: steps.map((s) => ({ text: s.text, how: s.notes.length ? s.notes.join(' ') : s.how })),
    materials: materials.slice(0, 20),
    time: timeOf(start, end),
  }
}

// ---------- before you start: budget, time a week, level (components/Journey.jsx StartQuestions) ----------
export const BUDGETS = [
  ['free', 'Almost free'],
  ['cheap', 'A little money'],
  ['any', 'No limit'],
]
export const PACES = [
  ['hour', 'About an hour a week'],
  ['few', 'A few hours a week'],
  ['weekend', 'Weekends'],
]
export const LEVELS = [
  ['new', 'Total beginner'],
  ['some', 'Tried it a bit'],
  ['good', 'Pretty experienced'],
]
// How many steps fit in one week (or weekend) at that pace: the plan is the same, the timing around it changes
const PER = { hour: 1, few: 2, weekend: 2 }
export function paceLine(project) {
  const per = PER[project.pace]
  if (!per) return null
  const left = project.milestones.filter((m) => !m.done && !m.auto && !m.quick).length
  if (!left) return null
  const n = Math.max(1, Math.ceil(left / per))
  return { key: project.pace === 'weekend' ? 'weekend' : 'week', n, per }
}

// ---------- what's next: after finishing a plan, a logical next one ----------
// Hand-written: each plan points to the one that builds on what you just learned. A chain, so if you've already
// done the first suggestion, the next one along comes up.
export const NEXT = {
  bracelet: 'crochet', crochet: 'scarf', scarf: 'knit', knit: 'embroidery', embroidery: 'sewing', sewing: 'sockmonkey', sockmonkey: 'embroidery',
  origami: 'bracelet', pottery: 'spoon', spoon: 'birdhouse', birdhouse: 'bench', bench: 'tools', tools: 'birdhouse',
  sketchbook: 'sketch', hand: 'sketch', sketch: 'lemons', lemons: 'linocut', linocut: 'pixels', pixels: 'scratch', scratch: 'console', console: 'web', web: 'console',
  circuit: 'radio', radio: 'circuit',
  ukulele: 'guitar', guitar: 'singing', singing: 'synth', synth: 'piano', piano: 'synth',
  focaccia: 'cinnamon', cinnamon: 'sourdough', sourdough: 'pasta', pasta: 'ramen', ramen: 'cooking', cooking: 'pasta',
  scraps: 'herbs', herbs: 'tomato', plant: 'tomato', tomato: 'herbs',
  pushups: 'runner', yoga: 'climb', skate: 'pushups', runner: 'trail', trail: 'mountain', sunrise: 'mountain', canoe: 'mountain', mountain: 'ferrata', ferrata: 'climb', climb: 'ferrata',
  photoday: 'street', street: 'flowers', flowers: 'camera', camera: 'street',
  words: 'reading', reading: 'writing', journal: 'writing', writing: 'journal', chess: 'rubik', rubik: 'chess',
}

/**
 * The plan to suggest after this one: its own next plan (following the chain past ones you've started), otherwise a
 * Blank plan from the same hobby you haven't started yet. guides: GUIDES (passed in, so this file stays light).
 */
export function nextPlan(project, projects, guides) {
  const started = new Set(projects.map((p) => p.guideKey).filter(Boolean))
  started.add(project.guideKey)
  let key = NEXT[project.guideKey]
  for (let i = 0; key && i < 8; i++) {
    if (guides[key] && !started.has(key)) return guides[key]
    key = NEXT[key]
  }
  return Object.values(guides).find((g) => g.category === project.category && !started.has(g.key)) || null
}
