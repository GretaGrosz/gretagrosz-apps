// The plan a new project starts with. Blank's own plans come first (they're hand-made and have photos);
// for anything else, the axolotl's AI writes one: steps, what you need, and a tutorial search (assistant/api.js).
// If the AI can't (offline, limit reached), the general plan for that kind of project is used, so starting never fails;
// outOfAI says the day's AI is used up, so the app can tell them to come back tomorrow.
import { GUIDES, guessLang, pick, planForName, resourcesFor, stepsFor, withHow } from './guides'

export { guessLang }
import { makePlan } from './assistant/api'
import { translate } from './i18n'

// The toast when the day's AI is used up and the general plan stands in
export const OUT_OF_AI = 'Blank ran out of imagination for today. Here’s a simple plan for now. Come back tomorrow for one made just for you!'
// The toast when a friend's post only got the general plan (the AI didn't answer in time)
export const STARTER_ONLY = 'The AI couldn’t write a plan for this post right now, so here’s a starter plan. You can change the steps with Edit.'

const youtube = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
const mapSearch = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

// Is there a hand-made plan for exactly this? (planForName without a category only matches real plans)
export const ownPlanFor = (title) => {
  const { guide } = planForName(title)
  return guide.key ? guide : null
}

// → { category, guideKey, steps, resources, materials, ai, outOfAI? }
// From someone's post: guideKey = the Blank plan they followed (that plan, as it is), about = what the post says,
// so the AI knows what the project really is when its name doesn't say ("Weekend project").
// budget, pace: the quick questions before a start (journey.js); the AI plan fits them, a hand-made plan stays as it is
export async function planProject({ title, category, level, lang, guideKey = null, about = '', fromPost = false, budget = null, pace = null }) {
  const own = (guideKey && GUIDES[guideKey]) || ownPlanFor(title)
  if (own) return { category: own.category, guideKey: own.key, steps: stepsFor(own, level, lang), resources: resourcesFor(own, lang), materials: [], ai: false }
  try {
    // From a friend's post: one more try after a quick hiccup (not after a timeout, that would double the wait)
    const ask = () => makePlan({ title, category, level, lang, about, fromPost, budget, pace })
    const p = await ask().catch((e) => (fromPost && (e?.code === 'upstream' || e?.code === 'server' || e?.code === 'invalid') ? ask() : Promise.reject(e)))
    return {
      category: p.category || category || 'other',
      guideKey: null,
      steps: (p.steps || []).map((s) => (typeof s === 'string' ? { text: s, how: '' } : { text: String(s?.text || ''), how: String(s?.how || '') })),
      materials: p.materials || [],
      resources: [
        { kind: 'youtube', url: youtube(p.video || title), title: p.video || title, note: 'YouTube' },
        // Sports and other club hobbies: a map search for clubs near them (the map uses their location, we never see it)
        ...(p.club ? [{ kind: 'map', url: mapSearch(p.club), title: p.club, note: translate(lang, 'Find a club near you') }] : []),
      ],
      ai: true,
    }
  } catch (e) {
    if (e?.code === 'not_a_hobby' || e?.code === 'crisis') throw e
    const { guide, category: c } = planForName(title, category)
    const outOfAI = e?.code === 'quota' || e?.code === 'busy'
    return { category: c, guideKey: guide.key || null, steps: stepsFor(guide, level, lang), resources: resourcesFor(guide, lang), materials: [], ai: false, outOfAI, starterOnly: fromPost && !outOfAI && !guide.key }
  }
}

// Starting a project from someone else's post or shared link: their steps when they're in your language;
// otherwise the same project in yours (Blank's own plan if they followed one, or the AI writes it from their steps).
// If the AI can't, their steps as they are, so starting never fails. → planProject's shape, plus title.
// hows: each step's how line from their post (same order), materials: what they used
export async function planFromSomeone({ title, category, steps = [], stepsLang = null, guideKey = null, about = '', hows = [], materials = [], lang, level, budget = null, pace = null }) {
  const guide = guideKey && GUIDES[guideKey]
  // A Blank idea's own name ("Újíts fel egy régi fabútort") also comes in your language
  const ownTitle = guide && ['en', 'de', 'hu'].some((l) => pick(guide.title, l) === title) ? pick(guide.title, lang) : title
  const theirs = steps.map((x) => String(x || '').trim()).filter(Boolean)
  const same = (stepsLang || guessLang([title, ...theirs])) === lang
  if (theirs.length && same) {
    return {
      title,
      category,
      guideKey: guide ? guideKey : null,
      steps: guide ? withHow(theirs, stepsFor(guide, null, lang)) : theirs.map((text, i) => ({ text, how: String(hows[i] || '') })),
      resources: guide ? resourcesFor(guide, lang) : [],
      materials,
    }
  }
  if (guide) return { title: ownTitle, ...(await planProject({ title, category, level, lang, guideKey })) }
  const hint = [about, theirs.length ? `Their steps: ${theirs.join('; ')}` : ''].filter(Boolean).join(' ')
  // No AI right now (or it won't plan it): their real steps beat a general starter plan, even in their language
  const asTheyAre = { title, category, guideKey: null, steps: theirs.map((text, i) => ({ text, how: String(hows[i] || '') })), resources: [], materials }
  let plan
  try {
    plan = await planProject({ title, category, level, lang, about: hint, fromPost: true, budget, pace })
  } catch (e) {
    if (theirs.length) return asTheyAre
    throw e
  }
  return !plan.ai && theirs.length ? asTheyAre : { title, ...plan }
}
