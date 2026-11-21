// Korrekturlesen generator: takes a correct paragraph and hides 5–10 typical mistakes in it.
// Paragraph markup: {richtig|falsch|K} marks a hand-chosen error spot (one word, K = G/R/A/B/S).
// Extra rule-based spots: missing comma before dass/weil/ob/relative pronoun …, dass → das, noun → lowercase.
const SUB = new Set(['dass', 'weil', 'ob', 'wenn', 'obwohl', 'da', 'damit', 'die', 'der', 'das', 'denen', 'deren', 'dessen', 'den', 'dem', 'um', 'wo', 'was', 'falls', 'sodass', 'bevor', 'nachdem', 'während'])
const KEEP_CAP = new Set(['Sie', 'Ihr', 'Ihnen', 'Ihre', 'Ihren', 'Ihrem', 'Ihrer'])

export function parseParagraph(text) {
  return text.trim().split(/\s+/).map((w) => {
    const m = w.match(/^(.*?)\{([^|}]+)\|([^|}]+)\|([GRABS])\}(.*)$/)
    if (m) return { right: m[1] + m[2] + m[5], marked: { wrong: m[1] + m[3] + m[5], cat: m[4] } }
    return { right: w }
  })
}
export const correctText = (text) => parseParagraph(text).map((t) => t.right).join(' ')

export function candidates(tokens) {
  const out = []
  tokens.forEach((t, i) => {
    if (t.marked) { out.push({ i, wrong: t.marked.wrong, cat: t.marked.cat, why: 'typischer Fehler' }); return }
    const w = t.right
    const next = tokens[i + 1]?.right.replace(/[.,!?:;"„“]/g, '')
    const prev = tokens[i - 1]?.right
    if (w.endsWith(',') && next && SUB.has(next.toLowerCase()) && !tokens[i + 1]?.marked) out.push({ i, wrong: w.slice(0, -1), cat: 'B', why: `Beistrich vor „${next}“` })
    if (/^dass[,.]?$/.test(w)) out.push({ i, wrong: w.replace('dass', 'das'), cat: 'R', why: '„dass“ als Konjunktion mit ss' })
    const bare = w.replace(/^[„"(]/, '')
    if (prev && !/[.!?:]["“]?$/.test(prev) && /^[A-ZÄÖÜ][a-zäöüß]{3,}/.test(bare) && !KEEP_CAP.has(bare.replace(/[.,!?:;"“)]/g, '')) && !/^[„"(]/.test(w)) {
      out.push({ i, wrong: w.replace(/[A-ZÄÖÜ]/, (c) => c.toLowerCase()), cat: 'R', why: 'Nomen schreibt man groß' })
    }
  })
  return out
}

export function makeProofread(text, rnd = Math.random, min = 5, max = 10) {
  const tokens = parseParagraph(text)
  const cands = candidates(tokens)
  const marked = cands.filter((c) => tokens[c.i].marked)
  const rules = cands.filter((c) => !tokens[c.i].marked)
  const shuffle = (a) => a.map((x) => [rnd(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1])
  const want = min + Math.floor(rnd() * (max - min + 1))
  const chosen = []
  const used = new Set()
  // hand-marked spots first (they are Greta's typical mistakes), then rule-based ones, max 2 per category from rules
  const perCat = {}
  for (const c of [...shuffle(marked), ...shuffle(rules)]) {
    if (chosen.length >= want) break
    if (used.has(c.i) || used.has(c.i - 1) || used.has(c.i + 1)) continue
    if (!tokens[c.i].marked && (perCat[c.cat] || 0) >= 3) continue
    chosen.push(c); used.add(c.i); perCat[c.cat] = (perCat[c.cat] || 0) + 1
  }
  const errors = new Map(chosen.map((c) => [c.i, c]))
  return {
    tokens: tokens.map((t, i) => ({ shown: errors.has(i) ? errors.get(i).wrong : t.right, right: t.right, error: errors.get(i) || null })),
    count: chosen.length,
  }
}
