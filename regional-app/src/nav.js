// Every screen has a URL, so reload, Back and the iOS edge swipe work.
// #/<tab>/<screen>/<args…>/<screen>/<args…>   e.g. #/today/day/12/part/12/p1, #/train/bank/gwf-2019-1
// Each screen name takes a fixed number of arguments, so the whole stack can be read back from the hash.

export const TABS = ['today', 'train', 'life', 'progress']

const SCREENS = {
  plan: [],
  day: ['day'], // 1-based plan day
  part: ['day', 'part'], // p0…p3 or c
  warmup: [],
  redo: ['day', 'k'],
  mini: ['n'],
  'mini-q': ['n', 'i'],
  settings: [],
  bank: ['id'],
  'mock-new': [],
  mock: ['id'],
  'mock-q': ['id', 'i'],
  tool: ['id'],
  exam: ['id'],
  toolbox: [],
  skill: ['id'], // everyday maths lesson
  quiz: ['id'], // a round: 'mix' or a skill id
  sprint: [],
  cheats: [],
  cards: [], // rule flashcards
  idea: ['id'], // find the idea of a past problem
  everyday: [],
}

const NAMES = { warmup: 'review', 'mini-q': 'miniPart', 'mock-new': 'mockStart', 'mock-q': 'mockPart' }
const SEGMENTS = Object.fromEntries(Object.entries(NAMES).map(([a, b]) => [b, a]))

function toScreen(seg, args) {
  const name = NAMES[seg] || seg
  const n = (v) => (/^\d+$/.test(v) ? Number(v) : NaN)
  switch (name) {
    case 'day':
      return n(args[0]) >= 1 ? { name, index: n(args[0]) - 1 } : null
    case 'part':
      return n(args[0]) >= 1 && /^(p\d|c)$/.test(args[1]) ? { name, index: n(args[0]) - 1, part: args[1] } : null
    case 'redo':
      return n(args[0]) >= 1 && /^(\d|c)$/.test(args[1]) ? { name, ref: { index: n(args[0]) - 1, k: args[1] === 'c' ? 'c' : Number(args[1]) } } : null
    case 'mini':
      return n(args[0]) >= 1 ? { name, n: n(args[0]) } : null
    case 'miniPart':
      return n(args[0]) >= 1 && n(args[1]) >= 0 ? { name, n: n(args[0]), i: n(args[1]) } : null
    case 'mock':
      return n(args[0]) > 0 ? { name, id: n(args[0]) } : null
    case 'mockPart':
      return n(args[0]) > 0 && n(args[1]) >= 0 ? { name, id: n(args[0]), i: n(args[1]) } : null
    case 'bank':
    case 'tool':
    case 'exam':
    case 'skill':
    case 'quiz':
    case 'idea':
      return args[0] ? { name, id: decodeURIComponent(args[0]) } : null
    default:
      return { name }
  }
}

function toSegment(s) {
  const seg = SEGMENTS[s.name] || s.name
  switch (s.name) {
    case 'day':
      return [seg, s.index + 1]
    case 'part':
      return [seg, s.index + 1, s.part]
    case 'redo':
      return [seg, s.ref.index + 1, s.ref.k]
    case 'mini':
      return [seg, s.n]
    case 'miniPart':
      return [seg, s.n, s.i]
    case 'mock':
      return [seg, s.id]
    case 'mockPart':
      return [seg, s.id, s.i]
    case 'bank':
    case 'tool':
    case 'exam':
    case 'skill':
    case 'quiz':
    case 'idea':
      return [seg, encodeURIComponent(s.id)]
    default:
      return [seg]
  }
}

export function encode(tab, stack) {
  return '#/' + [tab, ...stack.flatMap(toSegment)].join('/')
}

export function decode(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('/').filter(Boolean)
  const tab = TABS.includes(parts[0]) ? parts[0] : 'today'
  const stack = []
  let i = TABS.includes(parts[0]) ? 1 : 0
  while (i < parts.length) {
    const seg = parts[i]
    const arity = SCREENS[seg]
    if (!arity) break
    const args = parts.slice(i + 1, i + 1 + arity.length)
    if (args.length < arity.length) break
    const screen = toScreen(seg, args)
    if (!screen) break
    stack.push(screen)
    i += 1 + arity.length
  }
  return { tab, stack }
}
