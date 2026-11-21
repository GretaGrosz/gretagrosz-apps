// Everyday maths: numbers, money and percentages in the reader's language, a seeded random source so a
// round can be rebuilt after a reload, and a forgiving number reader for typed answers.
import { getLang, locale } from '../i18n'

// Content is written as [English, German] pairs
export const L = (p) => (Array.isArray(p) ? (getLang() === 'de' ? p[1] : p[0]) : p)
export const T = (en, de) => (getLang() === 'de' ? de : en)

export const r2 = (x) => Math.round(x * 100) / 100
// German groups thousands with a dot (1.500), like the euro amounts, not with the Austrian thin space
export const num = (x, max = 2) => new Intl.NumberFormat(getLang() === 'de' ? 'de-DE' : locale(), { maximumFractionDigits: max }).format(x)
// Whole euros without cents, everything else to the cent
export const eur = (x) => {
  const v = r2(x)
  const whole = Number.isInteger(v)
  return new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(v)
}
export const pct = (x, max = 2) => (getLang() === 'de' ? `${num(x, max)} %` : `${num(x, max)}%`)
const SUP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' }
export const pow = (base, n) => `${base}${SUP[n] || `^${n}`}`
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
export const frac = (n, d) => {
  const g = gcd(n, d) || 1
  return { n: n / g, d: d / g }
}
export const hm = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`

// mulberry32: small, fast and the same on every device
export function rng(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  }
}

// "12,50", "€ 12.50", "1.500" (German) or "1,500" (English), "−3", "45 %", "7/3" → a number, or null
export function parseNumber(input) {
  // A fraction: 7/3, −2 / 5
  const f = String(input ?? '').normalize('NFKC').replace(/[−–—]/g, '-').match(/^\s*(-?\d+)\s*\/\s*(\d+)\s*$/)
  if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : null
  let s = String(input ?? '')
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/[^0-9.,-]/g, '')
  if (!/\d/.test(s)) return null
  const dot = s.lastIndexOf('.')
  const comma = s.lastIndexOf(',')
  if (dot >= 0 && comma >= 0) {
    // Both marks: the later one is the decimal point
    const dec = dot > comma ? '.' : ','
    s = s.split(dec === '.' ? ',' : '.').join('').replace(dec, '.')
  } else if (dot >= 0 || comma >= 0) {
    const sep = dot >= 0 ? '.' : ','
    const parts = s.split(sep)
    const lead = parts[0].replace('-', '')
    // A group of exactly three digits after the thousands mark of the reader's language is thousands
    const thousandsMark = getLang() === 'de' ? '.' : ','
    const thousands = parts.length > 2 || (sep === thousandsMark && parts[1].length === 3 && lead !== '' && lead !== '0')
    s = thousands ? parts.join('') : parts.join('.')
  }
  if (!/^-?\d*\.?\d+$/.test(s)) return null
  const v = Number(s)
  return Number.isFinite(v) ? v : null
}

// q: { answer, tol } or { min, max }, or a choice question { choices, answer: index }
export function isRight(q, input) {
  if (q.choices) return Number(input) === q.answer
  const v = parseNumber(input)
  if (v == null) return null
  if (q.min != null) return v >= q.min - 1e-9 && v <= q.max + 1e-9
  return Math.abs(v - q.answer) <= (q.tol ?? 0.005) + 1e-9
}
