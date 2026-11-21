import en from './translations/en.js'
import hu from './translations/hu.js'

const TITLES = { en, hu }

// Titel eines Kapitels oder Themas in der gewählten Sprache (Fallback: Deutsch).
export function titleOf(item, lang) {
  if (!item) return ''
  return TITLES[lang]?.[item.id] ?? item.title
}
