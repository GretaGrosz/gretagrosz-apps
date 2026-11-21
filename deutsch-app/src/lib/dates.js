// Dates as local 'YYYY-MM-DD' strings
const pad = (n) => String(n).padStart(2, '0')
export const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const today = () => toKey(new Date())
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d) }
export const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)
export function weekKey(k) {
  const d = fromKey(k)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  return toKey(d)
}
const MONTHS = ['Jänner', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
export const fmt = (k) => { const d = fromKey(k); return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
export const fmtShort = (k) => { const d = fromKey(k); return `${d.getDate()}. ${MONTHS[d.getMonth()].slice(0, 3)}.` }
