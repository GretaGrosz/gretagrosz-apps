// One shared player for every voice note in the app, and the microphone recorder.
// Items: { id, audio, duration, fx, user, words?, transcript?, onStart?, trim? }.
// Voice effects are real pitch shifts rendered on the phone; Catch up items (trim: true) play with their pauses cut.
// The lock screen / AirPods controls (Media Session) drive the same queue.
import { useSyncExternalStore } from 'react'
import { audioBlob, audioUrl } from './api.js'
import { decode, originalTime, pitchShift, toWav, trimSilences } from './dsp.js'

export const FX = {
  '': { pitch: 1 },
  chipmunk: { pitch: 1.5 },
  deep: { pitch: 0.75 },
}
export const SPEEDS = [1, 1.25, 1.5, 2]
const SPEED_KEY = 'yap.speed'

// ---------- player ----------

const el = typeof Audio !== 'undefined' ? new Audio() : null
if (el) el.preload = 'auto'
const savedSpeed = (() => { try { return Number(localStorage.getItem(SPEED_KEY)) } catch { return 0 } })()
let state = { item: null, playing: false, loading: false, progress: 0, time: 0, speed: SPEEDS.includes(savedSpeed) ? savedSpeed : 1, index: 0, total: 0, error: false }
let queue = [] // the items in order; state.index is the one playing
let onEnded = null
let onDone = null
let processed = null // { segments } of the current item when it was trimmed
const subs = new Set()
const set = patch => { state = { ...state, ...patch }; subs.forEach(f => f()) }

export function usePlayer() {
  return useSyncExternalStore(cb => { subs.add(cb); return () => subs.delete(cb) }, () => state)
}
export const playerState = () => state

// iOS only lets audio start inside a tap; play a silent sound on the first touch so later plays work
const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
let unlocked = false
export function unlockAudio() {
  audioCtx()
  if (unlocked || !el) return
  unlocked = true
  el.src = SILENT
  el.play().catch(() => {})
}

// One AudioContext for the mic meter, resumed on taps (iOS starts it suspended outside a tap)
let ctxShared = null
export function audioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!ctxShared || ctxShared.state === 'closed') ctxShared = new Ctx()
  if (ctxShared.state !== 'running') ctxShared.resume?.().catch(() => {})
  return ctxShared
}

// Processed versions (pitch-shifted and/or trimmed), made once per item and mode
const renders = new Map()
function render(item) {
  const pitch = (FX[item.fx] || FX['']).pitch
  if (pitch === 1 && !item.trim) return null
  const k = item.audio + '|' + item.fx + '|' + !!item.trim
  if (!renders.has(k)) {
    const p = (async () => {
      const blob = item.audio.startsWith('blob:') ? await (await fetch(item.audio)).blob() : await audioBlob(item.audio)
      let x = await decode(blob)
      if (pitch !== 1) x = pitchShift(x, pitch)
      let segments = null, saved = 0
      if (item.trim) ({ samples: x, segments, saved } = trimSilences(x))
      return { url: URL.createObjectURL(toWav(x)), segments, saved, length: x.length / 24000 }
    })()
    p.catch(() => renders.delete(k))
    renders.set(k, p)
    if (renders.size > 40) {
      const [oldK, oldP] = renders.entries().next().value
      renders.delete(oldK)
      oldP.then(r => URL.revokeObjectURL(r.url)).catch(() => {})
    }
  }
  return renders.get(k)
}
/** Starts preparing an item so it plays without a gap */
export function prepare(item) {
  if (!item) return
  const r = render(item)
  if (r) r.catch(() => {})
  else audioUrl(item.audio).catch(() => {})
}
/** How many seconds trimming saves on an item, once it has been prepared (0 until then) */
export async function savedOn(item) {
  try { return (await render({ ...item, trim: true }))?.saved || 0 } catch { return 0 }
}

function applyRate() {
  el.preservesPitch = el.webkitPreservesPitch = el.mozPreservesPitch = true
  el.playbackRate = state.speed
}

let raf = 0
function tick() {
  if (!state.item) return
  const total = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : state.item.duration
  const t = el.currentTime
  set({ progress: total ? Math.min(1, t / total) : 0, time: originalTime(processed?.segments, t) })
  updatePosition()
  if (state.playing) raf = requestAnimationFrame(tick)
}

/** Plays `item`; `next` keeps playing after it. Tapping the playing item pauses it. */
export function play(item, { next = [], ended, done } = {}) {
  if (state.item?.id === item.id) return state.playing ? pause() : resume()
  return playQueue([item, ...next], 0, { ended, done })
}

/** Plays a whole list from `index` (Catch up uses this; prev/next move within it) */
export async function playQueue(items, index = 0, { ended, done } = {}) {
  if (!el || !items[index]) return
  queue = items
  onEnded = ended || null
  onDone = done || null
  return start(index)
}

async function start(index) {
  const item = queue[index]
  cancelAnimationFrame(raf)
  el.pause()
  processed = null
  set({ item, index, total: queue.length, playing: false, loading: true, progress: 0, time: 0, error: false })
  setMetadata(item)
  try {
    let src
    const r = render(item)
    if (r) {
      try {
        const out = await r
        processed = out
        src = out.url
      } catch {
        // This browser can't decode the format: play it as it is
        processed = null
        src = await audioUrl(item.audio)
      }
    } else src = await audioUrl(item.audio)
    if (state.item?.id !== item.id) return
    el.src = src
    applyRate()
    await el.play()
    applyRate()
    set({ playing: true, loading: false })
    tick()
    item.onStart?.()
    prepare(queue[index + 1])
  } catch (e) {
    if (state.item?.id === item.id) set({ loading: false, playing: false, error: e?.name !== 'NotAllowedError' })
  }
}

function resume() {
  applyRate()
  return el.play().then(() => { set({ playing: true }); tick() }).catch(() => {})
}

export function pause() {
  el?.pause()
  cancelAnimationFrame(raf)
  set({ playing: false })
}
export const toggle = () => (state.playing ? pause() : state.item ? resume() : null)

export function stop() {
  el?.pause()
  cancelAnimationFrame(raf)
  queue = []
  processed = null
  set({ item: null, playing: false, loading: false, progress: 0, time: 0, index: 0, total: 0 })
  if ('mediaSession' in navigator) navigator.mediaSession.metadata = null
}

export function skip() {
  if (state.index + 1 < queue.length) return start(state.index + 1)
  const d = onDone
  stop()
  d?.()
}
export function back() {
  // Like a music player: back restarts the note unless it just began
  if (el.currentTime > 3 || state.index === 0) { seek(0); return }
  start(state.index - 1)
}
export const jumpTo = index => queue[index] && start(index)

export function seek(fraction) {
  if (!el || !state.item) return
  const total = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : state.item.duration
  try { el.currentTime = fraction * total } catch {}
  set({ progress: fraction, time: originalTime(processed?.segments, fraction * total) })
}

export function setSpeed(speed) {
  set({ speed })
  try { localStorage.setItem(SPEED_KEY, String(speed)) } catch {}
  if (el && state.item) applyRate()
}
export const cycleSpeed = () => setSpeed(SPEEDS[(SPEEDS.indexOf(state.speed) + 1) % SPEEDS.length])

export const upNext = () => queue.slice(state.index + 1)
export const currentQueue = () => queue

// Lock screen, Control Center and AirPods
function setMetadata(item) {
  if (!('mediaSession' in navigator) || !item) return
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: item.user?.name || 'Yap',
      artist: item.context || 'Yap',
      album: 'Yap',
      artwork: [{ src: '/yap/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
  } catch {}
}
function updatePosition() {
  if (!('mediaSession' in navigator) || !navigator.mediaSession.setPositionState) return
  const d = el.duration
  if (!Number.isFinite(d) || d <= 0) return
  try { navigator.mediaSession.setPositionState({ duration: d, playbackRate: el.playbackRate || 1, position: Math.min(el.currentTime, d) }) } catch {}
}
if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
  const on = (a, f) => { try { navigator.mediaSession.setActionHandler(a, f) } catch {} }
  on('play', () => resume())
  on('pause', () => pause())
  on('nexttrack', () => skip())
  on('previoustrack', () => back())
  on('seekto', e => { if (el.duration) seek(e.seekTime / el.duration) })
}

if (el) {
  el.addEventListener('ended', () => {
    if (el.src === SILENT) return
    const done = state.item
    set({ progress: 1, playing: false })
    cancelAnimationFrame(raf)
    onEnded?.(done)
    if (state.index + 1 < queue.length) setTimeout(() => state.item === done && start(state.index + 1), 250)
    else {
      const d = onDone
      setTimeout(() => { if (state.item === done) { stop(); d?.() } }, 300)
    }
  })
  el.addEventListener('pause', () => state.playing && set({ playing: false }))
}

// ---------- recorder ----------

export const MAX_SECONDS = 60
const TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
const MIME_KEY = 'yap.recMime'
let goodMime = (() => { try { return localStorage.getItem(MIME_KEY) } catch { return null } })()

export function canRecord() {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

// The microphone opens when you press and closes again soon after: it stays open only for 10 seconds after a
// recording ends, so a quick second note starts instantly, then it is released (no orange mic dot while nobody talks).
// The first word isn't clipped because the "recording" state, the haptic and the button pulse only appear once the
// recorder has actually started (its start event): people speak after the cue.
const KEEP_WARM = 10_000
let warm = null // { stream, timer }
async function openStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
  } catch (e) {
    throw Object.assign(new Error('mic'), { code: e?.name === 'NotAllowedError' ? 'micDenied' : 'micMissing' })
  }
}
function keepWarm(stream) {
  coolMic(stream)
  warm = { stream, timer: setTimeout(() => coolMic(), KEEP_WARM) }
}
/** Releases the microphone now (leaving a chat, the app going to the background) */
export function coolMic(except) {
  if (!warm) return
  clearTimeout(warm.timer)
  if (warm.stream !== except) warm.stream.getTracks().forEach(t => t.stop())
  warm = null
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && coolMic())

/** How long the last press took: { mic: ms to get the stream, start: ms until the recorder really started } */
export let lastStartTiming = null

/** Starts recording; resolves once the recorder is really running. Returns { elapsed(), samples, stop(): Promise<clip>, cancel() } */
export async function startRecording() {
  const t0 = performance.now()
  const ctx = audioCtx()
  const reuse = !!warm && warm.stream.getAudioTracks().some(t => t.readyState === 'live')
  const stream = reuse ? warm.stream : await openStream()
  if (reuse) { clearTimeout(warm.timer); warm = null }
  const tMic = performance.now()
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  const source = ctx.createMediaStreamSource(stream)
  source.connect(analyser)
  const buf = new Float32Array(analyser.fftSize)
  // Some browsers say they support a format and then fail as soon as they start; try the next one (once, then remember)
  let rec, mime, chunks
  const order = goodMime != null ? [goodMime, ...TYPES.filter(t => t !== goodMime)] : TYPES
  for (const t of [...order.filter(t => !t || MediaRecorder.isTypeSupported?.(t)), '']) {
    chunks = []
    try {
      rec = new MediaRecorder(stream, t ? { mimeType: t, audioBitsPerSecond: 64000 } : undefined)
      rec.ondataavailable = e => e.data.size && chunks.push(e.data)
      // Wait for the recorder's own start event (or a failure), not a fixed delay
      const started = await new Promise(resolve => {
        const timer = setTimeout(() => resolve(rec.state === 'recording'), 1500)
        rec.onstart = () => { clearTimeout(timer); resolve(true) }
        rec.onerror = () => { clearTimeout(timer); resolve(false) }
        rec.start(250)
      })
      if (started && rec.state === 'recording') {
        mime = t
        if (goodMime !== t) { goodMime = t; try { localStorage.setItem(MIME_KEY, t) } catch {} }
        break
      }
      try { rec.stop() } catch {}
    } catch {}
  }
  if (rec?.state !== 'recording') {
    stream.getTracks().forEach(t => t.stop())
    source.disconnect()
    throw Object.assign(new Error('rec'), { code: 'cantRecord' })
  }
  const started = performance.now()
  lastStartTiming = { mic: Math.round(tMic - t0), start: Math.round(started - t0) }
  // Exposed on localhost only, for the latency check in the test scripts
  if (location.hostname === 'localhost') window.__yapTiming = lastStartTiming
  const samples = []
  const level = () => {
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    return Math.min(1, Math.sqrt(sum / buf.length) * 4)
  }
  const sampler = setInterval(() => samples.push(level()), 50)
  let released = false
  const release = () => {
    if (released) return
    released = true
    clearInterval(sampler)
    source.disconnect()
    keepWarm(stream)
  }

  return {
    samples,
    elapsed: () => (performance.now() - started) / 1000,
    cancel() { try { rec.stop() } catch {} release() },
    stop() {
      return new Promise((resolve, reject) => {
        const duration = (performance.now() - started) / 1000
        let done = false
        const finish = () => {
          if (done) return
          done = true
          release()
          const type = (rec.mimeType || mime || 'audio/webm').split(';')[0]
          const blob = new Blob(chunks, { type })
          if (duration < 0.6 || blob.size < 200) return reject(Object.assign(new Error('short'), { code: 'tooShort' }))
          resolve({ blob, mime: type, duration: +duration.toFixed(2), wave: toWave(samples), url: URL.createObjectURL(blob) })
        }
        rec.onstop = finish
        if (rec.state === 'inactive') return finish()
        try { rec.requestData?.() } catch {}
        rec.stop()
        setTimeout(finish, 1500)
      })
    },
  }
}

// 40 bars from the level samples, scaled 0-99
export function toWave(samples, bars = 40) {
  if (!samples.length) return Array(bars).fill(10)
  const out = []
  for (let b = 0; b < bars; b++) {
    const from = Math.floor((b / bars) * samples.length), to = Math.max(from + 1, Math.floor(((b + 1) / bars) * samples.length))
    let max = 0
    for (let i = from; i < to && i < samples.length; i++) max = Math.max(max, samples[i])
    out.push(max)
  }
  const peak = Math.max(...out) || 1
  return out.map(v => Math.round(Math.pow(v / peak, 0.7) * 99))
}
