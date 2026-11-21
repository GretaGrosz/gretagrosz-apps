// Local development only: `wrangler dev --local` has no Workers AI, so captions never arrive and the
// transcript features can't be tried. Started with `--var YAP_DEV_FAKE_AI:1`, requests to localhost get this
// stand-in, which "hears" one of a few fixed sentences and spreads its words over the clip.
// It can't run in production: it also requires the request to come to localhost / 127.0.0.1.

const LINES = [
  'okay so you will not believe what happened in maths today',
  'are we still meeting at the station at four or did that change',
  'hallo ich bin gleich da warte kurz beim eingang',
  'I just finished the presentation and honestly I think it went really well',
  'can you send me the notes from economics I missed the last part',
]

export function devAI(env, url) {
  if (env.YAP_DEV_FAKE_AI !== '1' || !['localhost', '127.0.0.1'].includes(url.hostname)) return null
  return {
    fake: true,
    async run(model, input) {
      if (!String(model).includes('whisper')) throw new Error('The local stand-in only does captions')
      await new Promise(r => setTimeout(r, 900))
      const audio = String(input.audio || '')
      let h = 0
      for (let i = 0; i < audio.length; i += 97) h = (Math.imul(h, 31) + audio.charCodeAt(i)) | 0
      const words = LINES[Math.abs(h) % LINES.length].split(' ')
      const duration = Math.max(1, Number(input.duration) || words.length * 0.4)
      const start = Math.min(0.3, duration * 0.05), span = Math.max(0.5, duration - start - 0.2)
      const step = span / words.length
      const timed = words.map((word, i) => ({ word: ' ' + word, start: +(start + i * step).toFixed(2), end: +(start + (i + 0.85) * step).toFixed(2) }))
      return { text: words.join(' '), segments: [{ start, end: start + span, text: words.join(' '), words: timed }] }
    },
  }
}
