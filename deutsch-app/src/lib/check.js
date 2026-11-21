// Strict answer checking. Only whitespace and quote styles are normalised; endings, umlauts, ß,
// capital letters and commas must be exactly right. The final full stop of a sentence is optional.

export function normalize(s) {
  return String(s ?? '')
    .replace(/[„“”«»"]/g, '"')
    .replace(/[‚‘’‹›`´]/g, "'")
    .replace(/[–—]/g, '–')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?:;])/g, '$1')
    .replace(/\s*…/g, ' …')
    .trim()
}

const dropFinalStop = (s) => s.replace(/\.$/, '')

export function isCorrect(given, answers) {
  const g = dropFinalStop(normalize(given))
  if (!g) return false
  return [].concat(answers).some((a) => dropFinalStop(normalize(a)) === g)
}

// Which accepted answer is closest to what was typed (for the diff)
export function closest(given, answers) {
  const list = [].concat(answers)
  let best = list[0], bestD = Infinity
  for (const a of list) {
    const d = distance(normalize(given), normalize(a))
    if (d < bestD) { bestD = d; best = a }
  }
  return best
}

export function distance(a, b) {
  const m = a.length, n = b.length
  if (!m) return n
  if (!n) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    prev = cur
  }
  return prev[n]
}

// Alignment of two sequences (chars or words). Returns [{t:'same'|'del'|'ins', v}]:
// 'del' = only in what was typed (wrong), 'ins' = only in the correct answer (missing).
export function diff(aSeq, bSeq) {
  const a = [...aSeq], b = [...bSeq]
  const m = a.length, n = b.length
  const L = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
  const out = []
  const push = (t, v) => (out.length && out[out.length - 1].t === t && typeof v === 'string' && v.length === 1 && typeof aSeq === 'string' ? (out[out.length - 1].v += v) : out.push({ t, v }))
  let i = 0, j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) { push('same', a[i]); i++; j++ }
    else if (L[i + 1][j] >= L[i][j + 1]) { push('del', a[i]); i++ }
    else { push('ins', b[j]); j++ }
  }
  while (i < m) push('del', a[i++])
  while (j < n) push('ins', b[j++])
  return out
}

export const charDiff = (given, correct) => diff(normalize(given), normalize(correct))
export const words = (s) => normalize(s).split(' ').filter(Boolean)
export const wordDiff = (given, correct) => diff(words(given), words(correct))

// Tokens for the word bank: commas become their own tiles (placing the Beistrich is part of the task)
export function bankTokens(sentence) {
  const s = normalize(sentence).replace(/[.!?]$/, '')
  return s.replace(/,/g, ' ,').split(' ').filter(Boolean)
}
export const finalPunct = (sentence) => (normalize(sentence).match(/[.!?]$/) || [''])[0]
export function joinTokens(tokens) {
  return normalize(tokens.join(' '))
}

export function shuffle(arr, rnd = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function hash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0).toString(36)
}
