import { daysUntil } from './data/questions.js'

export const LOCALES = { de: 'de-AT', en: 'en-GB', hu: 'hu-HU' }

const toDate = (day) => {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// "Fr., 14. November" (lang: de/en/hu)
export function formatDay(day, lang, opts = { weekday: 'short', day: 'numeric', month: 'long' }) {
  return new Intl.DateTimeFormat(LOCALES[lang] ?? 'de-AT', opts).format(toDate(day))
}

export const formatShort = (day, lang) => formatDay(day, lang, { weekday: 'short', day: 'numeric', month: 'short' })

// "Heute" · "Morgen" · "in 9 Tagen"
export function countdownText(t, day) {
  const n = daysUntil(day)
  if (n <= 0) return t('today')
  if (n === 1) return t('tomorrow')
  return t('inDays', { n })
}

// Name des Tages im Lernplan: "Heute", "Morgen", sonst Wochentag + Datum
export function planDayLabel(t, day, lang) {
  const n = daysUntil(day)
  if (n === 0) return t('today')
  if (n === 1) return t('tomorrow')
  return formatShort(day, lang)
}
