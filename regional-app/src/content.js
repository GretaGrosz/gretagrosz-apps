import { PLAN, TOTAL_DAYS } from './plan'

// Written lessons live in ./content, one chunk per file, loaded in parallel at start-up (and cached by the
// service worker), so the app shell paints before the lessons have arrived.
const files = import.meta.glob('./content/*.js', { import: 'default' })
const BY_DAY = {}
let ready = null

export function loadContent() {
  ready ||= Promise.all(Object.values(files).map((load) => load())).then((mods) => {
    mods.forEach((m) => Object.assign(BY_DAY, m))
  })
  return ready
}

export function getDay(index) {
  const plan = PLAN[Math.max(0, Math.min(TOTAL_DAYS - 1, index))]
  return { ...plan, content: BY_DAY[plan.day] || null }
}
