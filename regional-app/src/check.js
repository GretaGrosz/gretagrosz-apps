// Checking typed answers. The maths counts, not the format:
// "x = 75", "∠BDC = 75°", "75" all match 75; "1,000" is a thousand, "4,5" is 4.5; "3,4,5" matches "3, 4, 5" in any order
// for list answers; "3*sqrt(2)" matches "3√2".
// Returns 'correct', 'wrong', or 'format' when the input isn't an answer of the expected shape (no try is used).

const base = (s) =>
  String(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()

// "x = 75", "∠bdc = 75", "a_n = 3" → "75"; only when the expected answer has no "=" of its own
const dropLabel = (s) => s.replace(/^(?:[a-z∠α-ω][a-z0-9_∠α-ω()']{0,12}\s*=\s*)+/, '')

const dropUnits = (s) => s.replace(/(?:degrees?|grad|°|cm²|cm|m²|km|m|units?|einheiten|punkte?|points?)$/u, '').trim()

const tidy = (s) =>
  s
    .replace(/sqrt\s*\(([^()]*)\)/g, '√$1')
    .replace(/sqrt/g, '√')
    .replace(/\*/g, '')
    .replace(/·/g, '')
    .replace(/\s+/g, '')

// A plain number or fraction: "75", "-3", "4,5", "1,000", "1 000", "9/2", "0.55"
function value(s) {
  let x = s.replace(/(\d)[\s'](?=\d{3}\b)/g, '$1') // 1 000, 1'000
  x = x.replace(/(\d),(\d{3})(?!\d)/g, '$1$2') // 1,000 → 1000 (exactly three digits after the comma)
  x = x.replace(/,/g, '.') // 4,5 → 4.5
  const m = x.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+(?:\.\d+)?))?$/)
  if (!m) return null
  const v = m[2] ? Number(m[1]) / Number(m[2]) : Number(m[1])
  return Number.isFinite(v) ? v : null
}

// Split "3, 4, 5" or "(1, 5), (5, 1)" at top-level commas (commas inside brackets stay)
function items(s) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if ('([{'.includes(ch)) depth++
    if (')]}'.includes(ch)) depth--
    if ((ch === ',' || ch === ';') && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

const sameAtom = (a, b) => {
  const ta = tidy(dropUnits(a))
  const tb = tidy(dropUnits(b))
  if (ta === tb) return true
  const x = value(ta)
  const y = value(tb)
  return x != null && y != null && Math.abs(x - y) < 1e-9
}

function matches(input, answer) {
  const b = base(answer)
  let a = base(input)
  if (!b.includes('=')) a = dropLabel(a)
  const bItems = items(b)
  if (bItems.length > 1) {
    // A list: same items in any order ("1,000" can't be a list here because the expected answer is one)
    const aItems = items(a)
    if (aItems.length !== bItems.length) return false
    const left = [...bItems]
    return aItems.every((x) => {
      const i = left.findIndex((y) => sameAtom(x, y))
      if (i < 0) return false
      left.splice(i, 1)
      return true
    })
  }
  return sameAtom(a, b)
}

const numeric = (answer) => value(tidy(dropUnits(base(answer)))) != null

export function checkAnswer(input, answers) {
  if (!String(input).trim()) return 'format'
  if (answers.some((ans) => matches(input, ans))) return 'correct'
  // When every accepted answer is a single number, anything that isn't one is a typo, not a wrong answer
  if (answers.every(numeric)) {
    let a = dropLabel(base(input))
    if (value(tidy(dropUnits(a))) == null) return 'format'
  }
  return 'wrong'
}

export const isCorrect = (input, answers) => checkAnswer(input, answers) === 'correct'
