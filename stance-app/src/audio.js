// The microphone recorder for Practice (the same one Yap uses), with a live level meter.
import { t } from './i18n.js'

// One AudioContext for the mic meter, resumed on taps (iOS starts it suspended outside a tap)
let ctxShared = null
export function audioCtx() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!ctxShared || ctxShared.state === 'closed') ctxShared = new Ctx()
  if (ctxShared.state !== 'running') ctxShared.resume?.().catch(() => {})
  return ctxShared
}

const TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']

export function canRecord() {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

/** Starts recording; returns { level(), elapsed(), samples, stop(): Promise<clip>, cancel() } */
export async function startRecording(bitrate = 64000) {
  const ctx = audioCtx()
  let stream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
  } catch (e) {
    throw new Error(t(e?.name === 'NotAllowedError' ? 'mic.denied' : e?.name === 'NotFoundError' ? 'mic.none' : 'mic.busy'))
  }
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  const source = ctx.createMediaStreamSource(stream)
  source.connect(analyser)
  const buf = new Float32Array(analyser.fftSize)
  // Some browsers say they support a format and then fail as soon as they start; try the next one
  let rec, mime, chunks
  for (const t of [...TYPES.filter(t => MediaRecorder.isTypeSupported?.(t)), '']) {
    chunks = []
    try {
      rec = new MediaRecorder(stream, t ? { mimeType: t, audioBitsPerSecond: bitrate } : undefined)
      rec.ondataavailable = e => e.data.size && chunks.push(e.data)
      rec.start(250)
      await new Promise(r => setTimeout(r, 120))
      if (rec.state === 'recording') { mime = t; break }
    } catch {}
  }
  if (rec?.state !== 'recording') {
    stream.getTracks().forEach(t => t.stop())
    source.disconnect()
    throw new Error(t('session.cantRecord'))
  }
  const started = performance.now() - 120
  const samples = []
  let lastLevel = 0

  const level = () => {
    analyser.getFloatTimeDomainData(buf)
    let sum = 0
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
    lastLevel = Math.min(1, Math.sqrt(sum / buf.length) * 4)
    return lastLevel
  }
  const sampler = setInterval(() => samples.push(level()), 50)

  const release = () => {
    clearInterval(sampler)
    stream.getTracks().forEach(t => t.stop())
    source.disconnect()
  }

  return {
    samples,
    level: () => lastLevel,
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
          if (duration < 0.6 || blob.size < 200) return reject(new Error(t('mic.short')))
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
