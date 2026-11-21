// Declension tables: articles, ein-words, possessives, adjective endings. Case keys: N A D G. Gender keys: m f n pl.
import { nounForms, ADJ_STEM } from './lexicon.js'

export const CASES = ['N', 'A', 'D', 'G']
export const CASE_NAME = { N: 'Nominativ', A: 'Akkusativ', D: 'Dativ', G: 'Genitiv' }
export const CASE_Q = { N: 'wer/was?', A: 'wen/was?', D: 'wem?', G: 'wessen?' }
export const GENDER_NAME = { m: 'maskulin', f: 'feminin', n: 'neutral', pl: 'Plural' }

const DEF = {
  N: { m: 'der', f: 'die', n: 'das', pl: 'die' },
  A: { m: 'den', f: 'die', n: 'das', pl: 'die' },
  D: { m: 'dem', f: 'der', n: 'dem', pl: 'den' },
  G: { m: 'des', f: 'der', n: 'des', pl: 'der' },
}
// endings for der-words (dieser, jeder, welcher …) on the stem
const DERWORD = {
  N: { m: 'er', f: 'e', n: 'es', pl: 'e' },
  A: { m: 'en', f: 'e', n: 'es', pl: 'e' },
  D: { m: 'em', f: 'er', n: 'em', pl: 'en' },
  G: { m: 'es', f: 'er', n: 'es', pl: 'er' },
}
// endings for ein-words (ein, kein, mein …); null = no ending
const EINWORD = {
  N: { m: '', f: 'e', n: '', pl: 'e' },
  A: { m: 'en', f: 'e', n: '', pl: 'e' },
  D: { m: 'em', f: 'er', n: 'em', pl: 'en' },
  G: { m: 'es', f: 'er', n: 'es', pl: 'er' },
}
export const ADJ_END = {
  // weak: after der-words
  der: { N: { m: 'e', f: 'e', n: 'e', pl: 'en' }, A: { m: 'en', f: 'e', n: 'e', pl: 'en' }, D: { m: 'en', f: 'en', n: 'en', pl: 'en' }, G: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
  // mixed: after ein-words (plural: after kein/mein … = weak -en)
  ein: { N: { m: 'er', f: 'e', n: 'es', pl: 'en' }, A: { m: 'en', f: 'e', n: 'es', pl: 'en' }, D: { m: 'en', f: 'en', n: 'en', pl: 'en' }, G: { m: 'en', f: 'en', n: 'en', pl: 'en' } },
  // strong: no article (also after viele, einige, mehrere, Zahlen)
  null: { N: { m: 'er', f: 'e', n: 'es', pl: 'e' }, A: { m: 'en', f: 'e', n: 'es', pl: 'e' }, D: { m: 'em', f: 'er', n: 'em', pl: 'en' }, G: { m: 'en', f: 'er', n: 'en', pl: 'er' } },
}

export const def = (kase, g) => DEF[kase][g]
export const derWord = (stem, kase, g) => stem + DERWORD[kase][g]
// ein-words: 'ein', 'kein', 'mein', 'unser', 'ihr' … ('ein' has no plural)
export function einWord(stem, kase, g) {
  if (stem === 'ein' && g === 'pl') return ''
  return stem + EINWORD[kase][g]
}
export const POSS = { ich: 'mein', du: 'dein', er: 'sein', sie: 'ihr', es: 'sein', wir: 'unser', ihrPl: 'euer', siePl: 'ihr', Sie: 'Ihr' }
export function possWord(stem, kase, g) {
  if (stem === 'euer') { const e = EINWORD[kase][g]; return e ? 'eur' + e : 'euer' }
  return stem + EINWORD[kase][g]
}

export function adjForm(adj, type, kase, g) {
  const stem = ADJ_STEM[adj] || adj
  return stem + ADJ_END[type][kase][g]
}

// A full noun phrase: { det: 'der'|'dieser'|'ein'|'kein'|'mein'…|null, adj, noun, kase, plural }
export function nounPhrase({ det, adj, noun, kase, plural }) {
  const g = plural ? 'pl' : noun.g
  let d = ''
  let type = 'null'
  if (det === 'der') { d = def(kase, g); type = 'der' }
  else if (det === 'dieser' || det === 'jeder') { d = derWord(det.slice(0, -2), kase, g); type = 'der' }
  else if (det === 'viele' || det === 'einige' || det === 'mehrere') { d = det.replace(/e$/, '') + ({ N: 'e', A: 'e', D: 'en', G: 'er' })[kase]; type = 'null' }
  else if (det) { d = det === 'euer' ? possWord('euer', kase, g) : einWord(det, kase, g); type = 'ein' }
  const forms = nounForms(noun, kase, plural)
  const a = adj ? adjForm(adj, type, kase, g) : ''
  return { det: d, adj: a, nouns: forms, type, g, text: [d, a, forms[0]].filter(Boolean).join(' ') }
}

// Why does the adjective get this ending? (used in the "Warum?" step)
export function adjReason(type, kase, g) {
  const e = ADJ_END[type][kase][g]
  const where = `${CASE_NAME[kase]} ${GENDER_NAME[g]}`
  if (type === 'der') return `der-Wort zeigt den Fall schon → schwache Endung -${e} (${where})`
  if (type === 'ein') {
    if (e === 'er' || e === 'es') return `ein-Wort ohne Endung → Adjektiv zeigt das Genus: -${e} (${where})`
    return `nach ein-Wort, ${where} → -${e}`
  }
  return `kein Artikel → Adjektiv trägt die Artikel-Endung: -${e} (${where})`
}

export const ARTICLE_RULE_EN = {
  N: 'Nominative = the subject (who/what does it?).',
  A: 'Accusative = the direct object (whom/what?). English only shows this in pronouns (he → him).',
  D: 'Dative = the indirect object or after a dative preposition (to whom?).',
  G: 'Genitive = belonging (whose? / of the …). English uses "of" or \'s.',
}
