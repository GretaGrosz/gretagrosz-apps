// Calendar days as integers: 0 = 1 Jan 1970 in the visitor's own time zone
export const DAY = 864e5
export const dayOf = (t) => Math.floor((t - new Date(t).getTimezoneOffset() * 6e4) / DAY)
export const dayOfDate = (y, m, d) => dayOf(new Date(y, m, d).getTime())
export const dayOfIso = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  return m ? dayOfDate(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
export const isoOfDay = (day) => new Date(day * DAY).toISOString().slice(0, 10)
// Local noon of a calendar day, for formatting
export const dateOfDay = (day) => {
  const [y, m, d] = isoOfDay(day).split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}
