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
  watch()
  return ctx
}

// ---------- iPhone/iPad: Stummschalter, Hintergrund, Unterbrechungen ----------
// Auf iOS gehört Web Audio standardmäßig zur Audio-Sitzung „ambient“ und bleibt bei eingeschaltetem
// Stummschalter still – dann wirkt der Ton kaputt. Zwei Wege, beide nur in einer Berührung:
// 1. Safari 16.4+: navigator.audioSession.type = 'playback' (Ton wie bei Videos, trotz Stummschalter).
// 2. Ältere iOS-Versionen: ein unsichtbares <audio>-Element spielt in Schleife Stille ab. Das schaltet
//    die Seite in die Medien-Sitzung, und Web Audio klingt mit. Wird pausiert, wenn die Seite im
//    Hintergrund ist, und bei der nächsten Berührung wieder gestartet.
// Dazu: nach Hintergrund oder Unterbrechung (Anruf, Siri, Wecker; Safari meldet dann state 'interrupted')
// den AudioContext wieder anwerfen – sofort, falls erlaubt, sonst bei der nächsten Berührung.

const IOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

let keepAlive = null // <audio> mit Stille (nur iOS)
let watching = false

// Kurze stille WAV-Datei (8 kHz, 8 Bit, mono, 0,1 s) als data-URI, im Code erzeugt.
function silentWav() {
  const n = 800
  const bytes = new Uint8Array(44 + n)
  const dv = new DataView(bytes.buffer)
  const text = (at, str) => [...str].forEach((ch, i) => dv.setUint8(at + i, ch.charCodeAt(0)))
  text(0, 'RIFF')
  dv.setUint32(4, 36 + n, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  dv.setUint32(16, 16, true) // Länge des fmt-Blocks
  dv.setUint16(20, 1, true) // PCM
  dv.setUint16(22, 1, true) // mono
  dv.setUint32(24, 8000, true) // Abtastrate
  dv.setUint32(28, 8000, true) // Bytes pro Sekunde
  dv.setUint16(32, 1, true) // Bytes pro Abtastwert
  dv.setUint16(34, 8, true) // Bit
  text(36, 'data')
  dv.setUint32(40, n, true)
  bytes.fill(128, 44) // 8-Bit-PCM: 128 = Stille
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(bin)
}

function playbackSession() {
  try {
    const session = navigator.audioSession
    if (session && session.type !== 'playback') session.type = 'playback'
  } catch {
    /* nicht unterstützt */
  }
}

function startKeepAlive() {
  if (!IOS) return
  try {
    if (!keepAlive) {
      const a = document.createElement('audio')
      a.setAttribute('playsinline', '')
      a.setAttribute('webkit-playsinline', '')
      a.setAttribute('x-webkit-airplay', 'deny')
      try {
        a.disableRemotePlayback = true
      } catch {
        /* egal */
      }
      a.preload = 'auto'
      a.loop = true
      a.src = silentWav()
      keepAlive = a
    }
    if (keepAlive.paused && !document.hidden) {
      const p = keepAlive.play()
      if (p && p.catch) p.catch(() => {})
    }
  } catch {
    /* ohne Ersatzweg weiter */
  }
}

function resumeContext() {
  try {
    if (ctx && ctx.state !== 'running' && ctx.state !== 'closed') {
      const p = ctx.resume()
      if (p && p.catch) p.catch(() => {})
    }
  } catch {
    /* nächste Berührung versucht es wieder */
  }
}

// Bei jeder Berührung/Taste (solange das Spiel schon Ton hatte): alles wieder anwerfen, was hängt.
function onGesture() {
  if (!ctx) return
  if (ctx.state !== 'running' || (keepAlive && keepAlive.paused && (state.music || state.sfx))) unlockAudio()
}

function onVisibility() {
  try {
    if (document.hidden) {
      if (keepAlive && !keepAlive.paused) keepAlive.pause()
    } else {
      // Zurück im Vordergrund: gleich versuchen; klappt das ohne Berührung nicht, übernimmt onGesture.
      resumeContext()
      if (keepAlive) startKeepAlive()
    }
  } catch {
    /* ignorieren */
  }
}

function watch() {
  if (watching) return
  watching = true
  try {
    // 'interrupted' (iOS) oder 'suspended': sobald möglich weiterspielen
    ctx.addEventListener?.('statechange', () => {
      if (ctx.state === 'interrupted' || (ctx.state === 'suspended' && !document.hidden)) resumeContext()
    })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onVisibility)
    for (const type of ['touchend', 'click', 'keydown']) document.addEventListener(type, onGesture, { capture: true, passive: true })
  } catch {
    /* ignorieren */
  }
}

// Aus einer Berührung/Taste aufrufen. Darf beliebig oft aufgerufen werden und wirft nie.
export function unlockAudio() {
  try {
    // Sind Musik und Töne aus, nicht in die Medien-Sitzung wechseln (sonst stoppt z. B. Spotify umsonst)
    if (state.music || state.sfx) {
      playbackSession()
      startKeepAlive()
    }
    ensure()
    resumeContext()
  } catch {
    /* ohne Ton weiterspielen */
  }
}

export function setAudio({ music, sfx }) {
  if (music !== undefined) state.music = music
  if (sfx !== undefined) state.sfx = sfx
  if (!state.music && !state.sfx && keepAlive && !keepAlive.paused) {
    try {
      keepAlive.pause()
    } catch {
      /* egal */
    }
  }
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
  // Nach einer Pause (Hintergrund, Unterbrechung) nicht alle verpassten Noten auf einmal nachholen
  if (nextTime < ctx.currentTime - 0.25) nextTime = ctx.currentTime + 0.05
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
  munch: (t) => [0, 1, 2].forEach((i) => noise(sfxBus, { at: t + i * 0.11, dur: 0.06, vol: 0.12, high: 900 })),
  pat: (t) => [0, 1].forEach((i) => tone(sfxBus, { at: t + i * 0.09, freq: hz(84 + i * 5), dur: 0.14, vol: 0.09, harmonic: 0.2 })),
  fanfare: (t) => [67, 72, 76, 79, 76, 79, 84].forEach((m, i) => tone(sfxBus, { at: t + i * 0.09, freq: hz(m), dur: 0.22, type: i > 4 ? 'triangle' : 'square', vol: 0.07 })),
  thunder: (t) => {
    noise(sfxBus, { at: t, dur: 1.2, vol: 0.22, high: 60 })
    tone(sfxBus, { at: t, freq: 70, dur: 1.0, type: 'sawtooth', vol: 0.05, slide: 0.6 })
  },
  sparkle: (t) => [88, 91, 96].forEach((m, i) => tone(sfxBus, { at: t + i * 0.05, freq: hz(m), dur: 0.18, vol: 0.06 })),
  gift: (t) => [72, 76, 79, 84, 79, 84, 88].forEach((m, i) => tone(sfxBus, { at: t + i * 0.07, freq: hz(m), dur: 0.28, vol: 0.13, harmonic: 0.3 })),
  blip: (t) => tone(sfxBus, { at: t, freq: 900 + Math.random() * 200, dur: 0.035, type: 'square', vol: 0.025 }),
}

// ---------- Plapperstimmen der Tiere ----------
// base: Grundton (Hz) je Tierart, mood: ok (Hallo) | talk (erzählt) | happy (Danke!) | angry (grummelt)
let lastVoice = 0
export function voice(base = 520, mood = 'ok') {
  if (!state.sfx || !ensure()) return
  const now = ctx.currentTime
  if (now - lastVoice < 0.25) return // nicht alle durcheinander
  lastVoice = now
  const n = mood === 'talk' ? 5 + Math.floor(Math.random() * 3) : mood === 'happy' ? 3 : mood === 'angry' ? 3 : 2
  let at = now + 0.01
  for (let i = 0; i < n; i++) {
    let f = base * (0.88 + Math.random() * 0.3)
    if (mood === 'happy') f = base * (1 + i * 0.18)
    if (mood === 'angry') f = base * (0.6 - i * 0.05)
    const dur = mood === 'angry' ? 0.11 : 0.065 + Math.random() * 0.03
    const o = ctx.createOscillator()
    const flt = ctx.createBiquadFilter()
    const g = ctx.createGain()
    o.type = mood === 'angry' ? 'sawtooth' : 'square'
    o.frequency.setValueAtTime(f, at)
    o.frequency.exponentialRampToValueAtTime(f * (mood === 'happy' && i === n - 1 ? 1.35 : 0.92), at + dur)
    flt.type = 'lowpass'
    flt.frequency.value = mood === 'angry' ? 900 : 2200
    flt.Q.value = 3
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(mood === 'angry' ? 0.05 : 0.045, at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(flt)
    flt.connect(g)
    g.connect(sfxBus)
    o.start(at)
    o.stop(at + dur + 0.03)
    at += dur + 0.025
  }
}

export function sfx(name) {
  if (!state.sfx || !ensure() || !SFX[name]) return
  if (ctx.state !== 'running') resumeContext()
  SFX[name](ctx.currentTime + 0.01)
}
