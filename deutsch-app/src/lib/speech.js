// German text-to-speech with the phone's own voices: de-AT first, then de-DE. Works offline, costs nothing.
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
let voices = []
if (canSpeak) {
  const refresh = () => (voices = window.speechSynthesis.getVoices())
  refresh()
  window.speechSynthesis.addEventListener?.('voiceschanged', refresh)
}
function voice() {
  for (const tag of ['de-at', 'de-de', 'de']) {
    const m = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(tag))
    if (m.length) return m.find((v) => v.localService) || m[0]
  }
  return null
}
export function speak(text, rate = 0.9) {
  if (!canSpeak || !text) return
  const synth = window.speechSynthesis
  synth.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = voice()
  u.lang = v?.lang || 'de-AT'
  if (v) u.voice = v
  u.rate = rate
  synth.speak(u)
}
