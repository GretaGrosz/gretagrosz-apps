// Short feedback tones made with Web Audio (no sound files)
let ctx
function tone(freqs, dur = 0.12, type = 'sine', gain = 0.12) {
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    let t = ctx.currentTime
    for (const f of freqs) {
      const o = ctx.createOscillator(), g = ctx.createGain()
      o.type = type; o.frequency.value = f
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur)
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur)
      t += dur * 0.8
    }
  } catch { /* no audio */ }
}
export const sounds = {
  right: () => tone([660, 990], 0.11),
  wrong: () => tone([220, 180], 0.16, 'triangle', 0.15),
  done: () => tone([523, 659, 784, 1047], 0.13),
}
