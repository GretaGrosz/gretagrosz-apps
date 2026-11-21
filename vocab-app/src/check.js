// Marking typed answers the way a fair teacher would.
//
// Accepted:
// - articles are optional ("Hund" = "der Hund"), and so is "to" before English verbs and a reflexive pronoun (sich, se, si, s')
// - capital letters don't matter, unless they are the only thing that tells two of today's words apart (morgen / der Morgen)
// - ae/oe/ue/ss for ä/ö/ü/ß, and a missing accent (cafe → café); the correct spelling is shown
// - one slip (a missing, extra, swapped or wrong letter) in a word of 5+ letters; the correct spelling is shown
// - several answers typed at once ("hallo, servus") if every one of them is right
//
// Refused, even when it is only one letter away:
// - another word from the same test (el padre for "mother", sehen for "to go"), or as close to one as to the real answer
// - any other real word of the language (skirt for "shirt")
// - the prompt typed back in your own language (fish for "der Fisch")

const ARTICLES = {
  // value = genders the article can go with (m, f, n, p = plural, * = any)
  en: { the: '*', a: '*', an: '*' },
  de: { der: 'm', die: 'fp', das: 'n', den: 'm', dem: 'mn', des: 'mn', ein: 'mn', eine: 'f', einen: 'm', einem: 'mn' },
  es: { el: 'm', la: 'f', los: 'mp', las: 'fp', un: 'm', una: 'f', unos: 'mp', unas: 'fp' },
  fr: { le: 'm', la: 'f', les: 'p', un: 'm', une: 'f', des: 'p' },
  it: { il: 'm', lo: 'm', la: 'f', i: 'mp', gli: 'mp', le: 'fp', un: 'm', uno: 'm', una: 'f' },
}
const REFLEXIVE = { de: ['sich'], fr: ['se'], it: ['si'], es: ['se'] }
const ELIDED = { fr: ["l'", "s'"], it: ["l'", "un'"] } // l'eau, s'habiller, l'amico, un'amica

// Strip the hints in brackets and punctuation, keep letters and case
export function clean(text) {
  return String(text)
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/[’`´‘]/g, "'")
    .replace(/[.,!?¡¿"„“”«»…:;]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Remove accents and spell umlauts out, then drop spaces, hyphens and apostrophes: "la Grand-Mère" → "grandmere"
function fold(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s'-]/g, '')
}
// Same, but an umlaut just loses its dots (schön → schon), for people who leave them out
const bare = (text) => fold(text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))

const cache = new Map()
// { article, core, norm, loose, bare, raw }: core = the word without article/reflexive (case kept), norm = core lower-cased
export function forms(text, lang) {
  const id = `${lang}\u0000${text}`
  const hit = cache.get(id)
  if (hit) return hit
  const tokens = clean(text).split(' ').filter(Boolean)
  let article = null
  if (tokens.length) {
    const first = tokens[0].toLowerCase()
    const elided = (ELIDED[lang] || []).find((p) => first.startsWith(p) && first.length > p.length)
    if (elided) {
      if (elided !== "s'") article = elided
      tokens[0] = tokens[0].slice(elided.length)
    } else if (tokens.length > 1 && (lang === 'fr' || lang === 'it') && first === 'l') {
      article = "l'" // "l amico", typed without the apostrophe
      tokens.shift()
    } else if (tokens.length > 1 && ARTICLES[lang]?.[first]) {
      article = first
      tokens.shift()
    } else if (tokens.length > 1 && lang === 'en' && first === 'to') {
      tokens.shift()
    }
  }
  if (tokens.length > 1 && REFLEXIVE[lang]?.includes(tokens[0].toLowerCase())) tokens.shift()
  const core = tokens.join(' ')
  const result = {
    article,
    core,
    norm: core.toLowerCase(),
    loose: fold(core),
    bare: bare(core),
    raw: clean(text).toLowerCase(),
    upper: /\p{Lu}/u.test(clean(text)),
  }
  if (cache.size > 20000) cache.clear()
  cache.set(id, result)
  return result
}

// Optimal string alignment distance (a swap of two neighbouring letters counts as one slip)
export function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

const EXACT = 3
const SPELLING = 2
const TYPO = 1

// How close the typed text is to one answer
function level(typed, answer, lang) {
  const a = forms(answer, lang)
  if (!a.norm) return 0
  if (typed.norm === a.norm) return EXACT
  if (typed.loose === a.loose || typed.bare === a.bare || fold(typed.raw) === fold(a.raw)) return SPELLING
  if (a.loose.length >= 5 && typed.loose.length >= 4 && distance(typed.loose, a.loose) <= 1) return TYPO
  return 0
}

// When the typed word fits two of today's words equally well, the article and capital letters decide
function evidence(typed, answer, lang) {
  const a = forms(answer, lang)
  let score = 0
  if (typed.article) {
    if (!a.article) score -= 2
    else if (compatible(typed.article, a.article, lang)) score += 2
  }
  if (typed.upper) score += typed.core === a.core ? 1 : -1
  if (typed.raw === a.raw) score += 0.5
  return score
}

function compatible(x, y, lang) {
  const gx = ARTICLES[lang]?.[x]
  const gy = ARTICLES[lang]?.[y]
  if (!gx || !gy || gx === '*' || gy === '*') return true // l', un' or English: no gender to compare
  return [...gx].some((g) => gy.includes(g))
}

const dictionaryIndex = new WeakMap()
function indexOf(dict, lang) {
  let byLang = dictionaryIndex.get(dict)
  if (!byLang) dictionaryIndex.set(dict, (byLang = {}))
  if (!byLang[lang]) {
    const loose = new Set()
    const norm = new Set()
    for (const word of dict) {
      const f = forms(word, lang)
      if (!f.norm) continue
      loose.add(f.loose)
      norm.add(f.norm)
    }
    byLang[lang] = { loose, norm }
  }
  return byLang[lang]
}

// Only prompts that look exactly alike (hints included) are twins; a hint like "(Wasser)" is what tells two apart
const sameFront = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

function best(typed, answers, lang) {
  let top = 0
  let hits = []
  for (const answer of answers) {
    const l = level(typed, answer, lang)
    if (l > top) {
      top = l
      hits = [answer]
    } else if (l === top && l > 0) hits.push(answer)
  }
  return { top, hits }
}

/**
 * Mark one typed answer.
 * word: { front, answers }  ctx: { lang, from, others: [{ front, answers }], dict: string[] }
 * Returns { correct, kind, answer, other }:
 *   kind: exact | article (right word, wrong gender) | spelling (accent/umlaut) | typo | wrong | other (that's another word of today) | prompt | empty
 *   answer: the accepted answer it matched (or the main answer when wrong), other: the word it was confused with
 */
export function checkAnswer(input, word, ctx = {}) {
  const lang = ctx.lang
  const main = word.answers[0]
  if (!clean(input)) return { correct: false, kind: 'empty', answer: main }

  // Two prompts that look the same in your language: either answer is fine
  const twins = (ctx.others || []).filter((o) => o !== word && sameFront(o.front, word.front))
  const targets = [...word.answers, ...twins.flatMap((t) => t.answers)]
  const others = (ctx.others || []).filter((o) => o !== word && !twins.includes(o))

  // Several answers at once: "hallo, servus" or "hallo / servus"
  const parts = clean(input.replace(/[,/;]/g, ' | ')).split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length > 1) {
    const each = parts.map((p) => checkAnswer(p, word, ctx))
    if (each.every((r) => r.correct)) {
      const order = ['exact', 'article', 'spelling', 'typo']
      return each.reduce((worst, r) => (order.indexOf(r.kind) > order.indexOf(worst.kind) ? r : worst))
    }
  }

  const typed = forms(input, lang)
  const t = best(typed, targets, lang)
  let o = { top: 0, hits: [] }
  let otherWord = null
  for (const w of others) {
    const b = best(typed, w.answers, lang)
    if (b.top > o.top) {
      o = b
      otherWord = w
    }
  }

  const wrong = (kind = 'wrong') => ({ correct: false, kind, answer: main, ...(kind === 'other' ? { other: otherWord } : {}) })
  const accept = (kind, answer) => ({ correct: true, kind, answer })

  if (t.top === EXACT) {
    if (o.top === EXACT) {
      const score = (hits) => Math.max(...hits.map((a) => evidence(typed, a, lang)))
      if (score(o.hits) > score(t.hits)) return wrong('other')
    }
    const answer = t.hits.find((a) => !typed.article || !forms(a, lang).article || compatible(typed.article, forms(a, lang).article, lang)) || t.hits[0]
    const fa = forms(answer, lang)
    if (typed.article && fa.article && !compatible(typed.article, fa.article, lang)) return accept('article', answer)
    return accept('exact', answer)
  }
  if (o.top === EXACT) return wrong('other')

  if (t.top === SPELLING) {
    if (o.top >= SPELLING) return wrong(o.top === SPELLING ? 'wrong' : 'other')
    // In German an umlaut makes a different word: "schon" is not "schön"
    if (lang === 'de' && ctx.dict && indexOf(ctx.dict, lang).norm.has(typed.norm)) return wrong()
    return accept('spelling', t.hits[0])
  }
  if (o.top === SPELLING) return wrong('other')

  if (t.top === TYPO) {
    if (ctx.from) {
      const prompt = new Set([forms(word.front, ctx.from).loose, forms(word.front, lang).loose, fold(clean(word.front))])
      if (prompt.has(typed.loose) || prompt.has(fold(typed.raw))) return wrong('prompt')
    }
    // As close to another of today's words (or closer) → not a typo
    for (const w of others) {
      for (const a of w.answers) {
        const fa = forms(a, lang)
        if (fa.loose && distance(typed.loose, fa.loose) <= 1) {
          otherWord = w
          return wrong('other')
        }
      }
    }
    // A real word of the language that isn't the answer → not a typo
    if (ctx.dict) {
      const index = indexOf(ctx.dict, lang)
      const targetLoose = new Set(targets.map((a) => forms(a, lang).loose))
      if (index.loose.has(typed.loose) && !targetLoose.has(typed.loose)) return wrong()
    }
    return accept('typo', t.hits[0])
  }
  return wrong()
}
