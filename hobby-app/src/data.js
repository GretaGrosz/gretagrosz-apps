// Categories and small helpers shared across the app
import HU from './hu'

export const CATEGORIES = [
  { id: 'art', color: '#E0607E' },
  { id: 'music', color: '#8B5CF6' },
  { id: 'crafts', color: '#EC4899' },
  { id: 'cooking', color: '#F59E0B' },
  { id: 'tech', color: '#0EA5E9' },
  { id: 'outdoors', color: '#10B981' },
  { id: 'fitness', color: '#84CC16' },
  { id: 'writing', color: '#A8A29E' },
  { id: 'photo', color: '#64748B' },
  { id: 'garden', color: '#22C55E' },
  { id: 'wood', color: '#F97316' },
  { id: 'learn', color: '#14B8A6' }, // languages, chess, reading, science, puzzles
  { id: 'other', color: '#6366F1' },
]
export const cat = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
export const CATEGORY_LABEL = {
  art: 'Art',
  music: 'Music',
  crafts: 'Crafts',
  cooking: 'Cooking',
  tech: 'Tech',
  outdoors: 'Outdoors',
  fitness: 'Fitness',
  writing: 'Writing',
  photo: 'Photography',
  garden: 'Gardening',
  wood: 'Woodwork',
  learn: 'Learning',
  other: 'Other',
}

// Starter ideas for the welcome quiz. cost: 'free' | 'cheap' | 'some'; noGear: start with what you have
export const IDEAS = [
  { title: 'Bake your first loaf of bread', de: 'Backe dein erstes Brot', category: 'cooking', cost: 'cheap', noGear: true },
  {
    title: 'Cook a dish from a country you have never visited',
    de: 'Koch ein Gericht aus einem Land, in dem du noch nie warst',
    category: 'cooking',
    cost: 'cheap',
    noGear: true,
  },
  { title: 'Make fresh pasta from scratch', de: 'Mach frische Pasta selbst', category: 'cooking', cost: 'cheap', noGear: true },
  { title: 'Learn three chords on the ukulele', de: 'Lerne drei Akkorde auf der Ukulele', category: 'music', cost: 'some', noGear: false },
  { title: 'Make your first beat in a free music app', de: 'Bau deinen ersten Beat in einer Gratis-Musik-App', category: 'music', cost: 'free', noGear: true },
  { title: 'Learn to sing one song really well', de: 'Lerne einen Song richtig gut zu singen', category: 'music', cost: 'free', noGear: true },
  { title: 'Fill one sketchbook page a day for a week', de: 'Eine Woche lang jeden Tag eine Skizzenbuchseite', category: 'art', cost: 'free', noGear: true },
  { title: 'Draw your own hand every day for a week', de: 'Zeichne eine Woche lang jeden Tag deine Hand', category: 'art', cost: 'free', noGear: true },
  { title: 'Paint a watercolour postcard', de: 'Male eine Aquarell-Postkarte', category: 'art', cost: 'cheap', noGear: false },
  { title: 'Fold 10 different origami animals', de: 'Falte 10 verschiedene Origami-Tiere', category: 'crafts', cost: 'free', noGear: true },
  { title: 'Knit a simple scarf', de: 'Strick einen einfachen Schal', category: 'crafts', cost: 'cheap', noGear: false },
  {
    title: 'Build a tiny website about something you love',
    de: 'Bau eine kleine Website über etwas, das du liebst',
    category: 'tech',
    cost: 'free',
    noGear: true,
  },
  { title: 'Make a tiny game in Scratch', de: 'Programmier ein kleines Spiel in Scratch', category: 'tech', cost: 'free', noGear: true },
  { title: 'Climb your first via ferrata with a guide', de: 'Geh deinen ersten Klettersteig mit einem Guide', category: 'outdoors', cost: 'some', noGear: false },
  { title: 'Try bouldering at a climbing gym', de: 'Probier Bouldern in einer Kletterhalle', category: 'fitness', cost: 'some', noGear: false },
  { title: 'Learn 100 words in a new language', de: 'Lern 100 Wörter in einer neuen Sprache', category: 'learn', cost: 'free', noGear: true },
  { title: 'Learn chess and win your first game', de: 'Lern Schach und gewinn deine erste Partie', category: 'learn', cost: 'free', noGear: true },
  { title: 'Read 3 books in a month', de: 'Lies 3 Bücher in einem Monat', category: 'learn', cost: 'free', noGear: true },
  { title: 'Solve a Rubik’s cube on your own', de: 'Lös einen Zauberwürfel allein', category: 'learn', cost: 'cheap', noGear: false },
  { title: 'Walk a trail you have never tried', de: 'Geh einen Weg, den du noch nie gegangen bist', category: 'outdoors', cost: 'free', noGear: true },
  { title: 'Watch the sunrise from somewhere new', de: 'Schau dir den Sonnenaufgang an einem neuen Ort an', category: 'outdoors', cost: 'free', noGear: true },
  { title: 'Run 5 km without stopping', de: 'Lauf 5 km ohne Pause', category: 'fitness', cost: 'free', noGear: true },
  {
    title: 'Do 20 push-ups in a row by the end of the month',
    de: 'Schaff bis Monatsende 20 Liegestütze am Stück',
    category: 'fitness',
    cost: 'free',
    noGear: true,
  },
  { title: 'Try 10 minutes of yoga every day for a week', de: 'Eine Woche lang jeden Tag 10 Minuten Yoga', category: 'fitness', cost: 'free', noGear: true },
  { title: 'Write a 500-word short story', de: 'Schreib eine Kurzgeschichte mit 500 Wörtern', category: 'writing', cost: 'free', noGear: true },
  { title: 'Keep a journal for 30 days', de: 'Führ 30 Tage lang ein Tagebuch', category: 'writing', cost: 'free', noGear: true },
  { title: 'Take one photo every day for 30 days', de: 'Mach 30 Tage lang jeden Tag ein Foto', category: 'photo', cost: 'free', noGear: true },
  { title: 'Make a photo series about your street', de: 'Mach eine Fotoserie über deine Straße', category: 'photo', cost: 'free', noGear: true },
  { title: 'Grow herbs on a windowsill', de: 'Zieh Kräuter auf dem Fensterbrett', category: 'garden', cost: 'cheap', noGear: false },
  { title: 'Regrow vegetables from kitchen scraps', de: 'Lass Gemüse aus Küchenresten nachwachsen', category: 'garden', cost: 'free', noGear: true },
  { title: 'Make a birdhouse', de: 'Bau ein Vogelhaus', category: 'wood', cost: 'cheap', noGear: false },
  { title: 'Whittle a small wooden spoon', de: 'Schnitz einen kleinen Holzlöffel', category: 'wood', cost: 'cheap', noGear: false },
]
// A starter idea's title in the app's language
export const ideaTitle = (idea, lang) => (lang === 'de' ? idea.de : lang === 'hu' ? HU[idea.title] || idea.title : idea.title)

export const COST_LABEL = { free: 'Costs nothing', cheap: 'Under €20', more: '€20+', some: 'Needs some gear' } // more: only on posts
// How long a posted project took (worker/blank-social.js TIMES)
export const TIME_LABEL = { hour: 'Under an hour', hours: 'A few hours', days: 'A few days', weeks: 'Weeks', months: 'Months' }

// Minutes for one work session, from the welcome quiz ("How much time do you have?")
export const SESSION_MINUTES = { little: 10, some: 20, lots: 45 }
export const sessionMinutes = (prefs) => SESSION_MINUTES[prefs?.time] || 15

const rand = (n) => {
  const a = new Uint8Array(n)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')
}
export const uid = (prefix = 'id') => `${prefix}_${rand(10)}`

export const progressOf = (project) => {
  const total = project.milestones.length
  if (!total) return project.status === 'done' ? 100 : 0
  return Math.round((project.milestones.filter((m) => m.done).length / total) * 100)
}

// Daily streaks: a day counts if you did at least one thing that day
export const DAY = 864e5
export const dayOf = (t) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY) // your local calendar day

// Weekly streaks: a week (Monday to Sunday) counts when you worked on your hobbies on at least `goal` different
// days. Hobbies don't happen every day like a lesson, so missing a day never breaks anything.
export const WEEK_GOAL = 3
const weekOfDay = (d) => Math.floor((d + 3) / 7) // day 0 (1 January 1970) was a Thursday
export const weekOf = (t) => weekOfDay(dayOf(t))
// Freezes that saved a week are stored as "w:<week>" (older ones, for single days, are plain day numbers)
export const frozenWeeks = (used = []) => used.filter((x) => String(x).startsWith('w:')).map((x) => Number(String(x).slice(2)))

// Your goal for a week. goals = me.weekGoals, { [week]: days }: a change counts from that week on, so raising
// your goal never takes back weeks that already counted.
export function goalFor(goals, week) {
  const from = Object.keys(goals || {}).map(Number).filter((w) => w <= week)
  return from.length ? goals[Math.max(...from)] : WEEK_GOAL
}

// The weeks that counted (and the ones a freeze saved)
export function countedWeeks(times, goals = {}, frozen = []) {
  const perWeek = new Map()
  for (const d of new Set(times.map(dayOf))) perWeek.set(weekOfDay(d), (perWeek.get(weekOfDay(d)) || 0) + 1)
  return new Set([...[...perWeek].filter(([w, n]) => n >= goalFor(goals, w)).map(([w]) => w), ...frozen])
}

export function weeklyStreak(times, goals = {}, frozen = []) {
  const done = countedWeeks(times, goals, frozen)
  let w = weekOf(Date.now())
  if (!done.has(w)) w -= 1 // this week isn't over yet, so last week still keeps the streak alive
  let n = 0
  while (done.has(w)) {
    n += 1
    w -= 1
  }
  return n
}

// Your longest run of weeks in a row
export function bestWeeklyStreak(times, goals = {}, frozen = []) {
  const weeks = [...countedWeeks(times, goals, frozen)].sort((a, b) => a - b)
  let best = 0
  let run = 0
  weeks.forEach((w, i) => {
    run = i > 0 && w === weeks[i - 1] + 1 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

// How many different days you worked on hobbies this week
export const daysThisWeek = (times, t = Date.now()) => new Set(times.filter((x) => weekOf(x) === weekOf(t)).map(dayOf)).size

// Calendar days between two moments, counting both ends ("day 1" is the day you started)
export const dayNumber = (start, t) => dayOf(t) - dayOf(start) + 1

export const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'project'
