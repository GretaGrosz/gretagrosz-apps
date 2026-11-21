// The one-tap reminder times (components/NextWhen.jsx), kept apart so tests can load them
const at = (d, h, m = 0) => {
  const x = new Date(d)
  x.setHours(h, m, 0, 0)
  return x
}
const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

// The one-tap times: later today (if there's still time), tomorrow and the weekend, at the hour you usually pick.
// → [{ key: 'today' | 'tomorrow' | 'weekend', at }]
export function whenOptions(now = new Date(), hour = 17) {
  const out = []
  const today = at(now, hour)
  if (today - now >= 30 * 60_000) out.push({ key: 'today', at: today.getTime() })
  else if (now.getHours() < 21) out.push({ key: 'today', at: at(now, now.getHours() + 1 + (now.getMinutes() >= 30 ? 1 : 0)).getTime() })
  out.push({ key: 'tomorrow', at: at(addDays(now, 1), hour).getTime() })
  // The next Saturday after tomorrow (Sunday if tomorrow is Saturday), 10:00
  let d = addDays(now, 2)
  while (d.getDay() !== 6 && d.getDay() !== 0) d = addDays(d, 1)
  out.push({ key: 'weekend', at: at(d, 10).getTime() })
  return out
}

