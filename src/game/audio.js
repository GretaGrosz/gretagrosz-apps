// Musik und Töne für Loopy & Co. – alles mit der Web Audio API erzeugt, keine Dateien.
// Startet erst nach einer Berührung/Taste (Browser-Regel). Musik und Töne lassen sich einzeln abschalten.

let ctx = null
let master = null
let musicBus = null
let sfxBus = null
let timer = null
let nextTime = 0
let stepIndex = 0
let rush = false
const state = { music: true, sfx: true }

function ensure() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.9
  master.connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.gain.value = state.music ? 0.32 : 0
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = state.sfx ? 0.55 : 0
  sfxBus.connect(master)
  return ctx
}

export function unlockAudio() {
  const c = ensure()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

export function setAudio({ music, sfx }) {
  if (music !== undefined) state.music = music
  if (sfx !== undefined) state.sfx = sfx
  if (!ctx) return
  const t = ctx.currentTime
  musicBus.gain.setTargetAtTime(state.music ? 0.32 : 0, t, 0.08)
  sfxBus.gain.setTargetAtTime(state.sfx ? 0.55 : 0, t, 0.05)
}

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12)

function tone(bus, { at, freq, dur = 0.2, type = 'sine', vol = 0.3, attack = 0.005, slide = 0, harmonic = 0 }) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), at + dur)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(vol, at + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g)
  g.connect(bus)
  o.start(at)
  o.stop(at + dur + 0.05)
  if (harmonic) {
    // hölzerner Oberton (Marimba)
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.frequency.setValueAtTime(freq * 4, at)
    g2.gain.setValueAtTime(0.0001, at)
    g2.gain.exponentialRampToValueAtTime(vol * harmonic, at + 0.003)
    g2.gain.exponentialRampToValueAtTime(0.0001, at + dur * 0.25)
    o2.connect(g2)
    g2.connect(bus)
    o2.start(at)
    o2.stop(at + dur)
  }
}

let noiseBuf = null
function noise(bus, { at, dur = 0.05, vol = 0.08, high = 6000 }) {
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  const src = ctx.createBufferSource()
  src.buffer = noiseBuf
  const f = ctx.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = high
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  src.connect(f)
  f.connect(g)
  g.connect(bus)
  src.start(at)
  src.stop(at + dur + 0.02)
}

// ---------- Musik: gemütliche Marimba-Schleife in F-Dur, 8 Takte ----------
// Akkorde je Takt (Grundton MIDI + Dreiklang)
const CHORDS = [
  [53, [65, 69, 72]], // F
  [50, [62, 65, 69]], // Dm
  [46, [62, 65, 70]], // Bb
  [48, [64, 67, 72]], // C
  [53, [65, 69, 72]], // F
  [45, [64, 69, 72]], // Am
  [46, [62, 65, 70]], // Bb
  [48, [64, 67, 70]], // C7
]
// Melodie in Achteln (0 = Pause), 8 pro Takt
const MELODY = [
  77, 0, 76, 77, 81, 0, 79, 0,
  77, 0, 74, 0, 72, 0, 74, 77,
  74, 0, 72, 74, 77, 0, 0, 79,
  76, 0, 72, 0, 79, 0, 76, 0,
  77, 0, 81, 0, 84, 0, 81, 79,
  81, 0, 76, 0, 72, 0, 76, 0,
  77, 79, 77, 0, 74, 0, 70, 0,
  72, 0, 0, 0, 76, 0, 79, 0,
]

function schedule() {
  const ahead = 0.18
  const eighth = 60 / (rush ? 128 : 102) / 2
  while (nextTime < ctx.currentTime + ahead) {
    const bar = Math.floor(stepIndex / 8) % 8
    const pos = stepIndex % 8
    const [root, chord] = CHORDS[bar]
    const at = nextTime
    // Bass auf 1 und 3 (bei Rush auch auf den Zwischenschlägen)
    if (pos === 0 || pos === 4 || (rush && pos % 2 === 0)) tone(musicBus, { at, freq: hz(root - 12), dur: eighth * 1.8, type: 'triangle', vol: 0.34 })
    // Begleitung: Akkordtöne als Marimba-Tupfer
    if (pos % 2 === 1) tone(musicBus, { at, freq: hz(chord[(pos >> 1) % 3]), dur: 0.32, vol: 0.09, harmonic: 0.25 })
    // Melodie
    const m = MELODY[(stepIndex % 64)]
    if (m) tone(musicBus, { at, freq: hz(m), dur: 0.42, vol: 0.16, harmonic: 0.35 })
    // leises Schlagwerk
    if (pos % 2 === 1) noise(musicBus, { at, dur: 0.03, vol: rush ? 0.06 : 0.035 })
    if (rush && pos === 4) noise(musicBus, { at, dur: 0.09, vol: 0.07, high: 1800 })
    nextTime += eighth
    stepIndex += 1
  }
}

export function startMusic() {
  if (!ensure() || timer) return
  unlockAudio()
  nextTime = ctx.currentTime + 0.1
  stepIndex = 0
  timer = setInterval(schedule, 50)
}

export function stopMusic() {
  clearInterval(timer)
  timer = null
}

export function setRush(on) {
  rush = on
}

// ---------- Töne ----------
const SFX = {
  coin: (t) => {
    tone(sfxBus, { at: t, freq: 988, dur: 0.08, type: 'square', vol: 0.08 })
    tone(sfxBus, { at: t + 0.07, freq: 1319, dur: 0.22, type: 'square', vol: 0.08 })
  },
  gold: (t) => [72, 76, 79, 84, 88].forEach((m, i) => tone(sfxBus, { at: t + i * 0.06, freq: hz(m + 12), dur: 0.25, vol: 0.12, harmonic: 0.3 })),
  right: (t) => [72, 76, 79, 84].forEach((m, i) => tone(sfxBus, { at: t + i * 0.08, freq: hz(m), dur: 0.3, vol: 0.18, harmonic: 0.3 })),
  wrong: (t) => {
    tone(sfxBus, { at: t, freq: hz(64), dur: 0.22, type: 'triangle', vol: 0.22 })
    tone(sfxBus, { at: t + 0.18, freq: hz(60), dur: 0.4, type: 'triangle', vol: 0.22, slide: 0.94 })
  },
  pickup: (t) => tone(sfxBus, { at: t, freq: 420, dur: 0.14, type: 'triangle', vol: 0.25, slide: 1.8 }),
  drop: (t) => tone(sfxBus, { at: t, freq: 180, dur: 0.16, type: 'triangle', vol: 0.35, slide: 0.5 }),
  refill: (t) => [0, 1, 2, 3, 4].forEach((i) => tone(sfxBus, { at: t + i * 0.04, freq: hz(72 + i * 3), dur: 0.12, vol: 0.12, harmonic: 0.2 })),
  bell: (t) => {
    tone(sfxBus, { at: t, freq: hz(88), dur: 0.5, vol: 0.06 })
    tone(sfxBus, { at: t + 0.1, freq: hz(91), dur: 0.6, vol: 0.05 })
  },
  mail: (t) => {
    tone(sfxBus, { at: t, freq: hz(79), dur: 0.4, vol: 0.14, harmonic: 0.3 })
    tone(sfxBus, { at: t + 0.22, freq: hz(72), dur: 0.6, vol: 0.14, harmonic: 0.3 })
  },
  horn: (t) => {
    tone(sfxBus, { at: t, freq: hz(50), dur: 0.35, type: 'triangle', vol: 0.3 })
    tone(sfxBus, { at: t + 0.4, freq: hz(50), dur: 0.6, type: 'triangle', vol: 0.3 })
  },
  grumble: (t) => tone(sfxBus, { at: t, freq: 150, dur: 0.5, type: 'sawtooth', vol: 0.05, slide: 0.6 }),
  rush: (t) => [67, 72, 76, 79].forEach((m, i) => tone(sfxBus, { at: t + i * 0.05, freq: hz(m), dur: 0.2, type: 'square', vol: 0.06 })),
  combo: (t) => [79, 84].forEach((m, i) => tone(sfxBus, { at: t + i * 0.07, freq: hz(m), dur: 0.2, vol: 0.13, harmonic: 0.3 })),
  nope: (t) => tone(sfxBus, { at: t, freq: 220, dur: 0.12, type: 'square', vol: 0.05 }),
  click: (t) => tone(sfxBus, { at: t, freq: 660, dur: 0.05, vol: 0.08 }),
}

export function sfx(name) {
  if (!state.sfx || !ensure() || !SFX[name]) return
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  SFX[name](ctx.currentTime + 0.01)
}
