// Hearing a word: the phone's own voices (speechSynthesis). Works offline, costs nothing.
import { clean } from './check'

const VOICE_LANG = { en: ['en-GB', 'en-US', 'en'], de: ['de-AT', 'de-DE', 'de'], es: ['es-ES', 'es-MX', 'es'], fr: ['fr-FR', 'fr-CA', 'fr'], it: ['it-IT', 'it'] }

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

let voices = []
if (canSpeak) {
  const refresh = () => (voices = window.speechSynthesis.getVoices())
  refresh()
  window.speechSynthesis.addEventListener?.('voiceschanged', refresh)
}

function voiceFor(lang) {
  for (const tag of VOICE_LANG[lang] || [lang]) {
    const matches = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(tag.toLowerCase()))
    if (matches.length) return matches.find((v) => v.localService) || matches[0]
  }
  return null
}

export function speak(text, lang) {
  if (!canSpeak || !text) return
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(clean(text))
  const voice = voiceFor(lang)
  utterance.lang = voice?.lang || VOICE_LANG[lang]?.[0] || lang
  if (voice) utterance.voice = voice
  utterance.rate = 0.92
  synth.speak(utterance)
}
