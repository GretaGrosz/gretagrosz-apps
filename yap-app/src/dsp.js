// Audio processing on the phone, before playback:
// - trimSilences: Catch up skips the pauses in voice notes (long gaps become a short beat), and returns
//   a map from the trimmed time back to the original time so the live transcript stays in sync.
// - pitchShift: the voice effects change the pitch, not the speed (WSOLA time-stretch, then resample),
//   so a 60-second "deep" note still takes 60 seconds.
// - toWav: the processed samples as a WAV blob the normal <audio> element (and the lock screen) can play.

const RATE = 24000

let decoder = null
function ctx() {
  const C = window.AudioContext || window.webkitAudioContext
  if (!C) throw new Error('No Web Audio')
  decoder ??= new C()
  return decoder
}

/** Mono samples at 24 kHz from an encoded clip */
export async function decode(blob) {
  const buf = await blob.arrayBuffer()
  const audio = await new Promise((resolve, reject) => {
    const p = ctx().decodeAudioData(buf, resolve, reject)
    if (p?.then) p.then(resolve, reject)
  })
  const ch = audio.numberOfChannels
  const src = audio.getChannelData(0)
  let mono = src
  if (ch > 1) {
    mono = new Float32Array(src.length)
    for (let c = 0; c < ch; c++) { const d = audio.getChannelData(c); for (let i = 0; i < d.length; i++) mono[i] += d[i] / ch }
  }
  return resample(mono, audio.sampleRate / RATE)
}

/** Linear-interpolation resampling: reads the input `ratio` times faster */
function resample(x, ratio) {
  if (Math.abs(ratio - 1) < 1e-6) return x
  const n = Math.floor(x.length / ratio)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const p = i * ratio, j = Math.floor(p), f = p - j
    out[i] = (x[j] || 0) * (1 - f) + (x[j + 1] || 0) * f
  }
  return out
}

/**
 * Shortens every pause longer than 0.45 s to 0.18 s. Returns { samples, segments, saved } where segments are
 * [outStart, inStart, length] in seconds, for mapping playback time back to the original recording.
 */
export function trimSilences(x) {
  const win = Math.round(RATE * 0.02)
  const n = Math.floor(x.length / win)
  if (n < 10) return { samples: x, segments: [[0, 0, x.length / RATE]], saved: 0 }
  const rms = new Float32Array(n)
  for (let w = 0; w < n; w++) {
    let s = 0
    for (let i = w * win; i < (w + 1) * win; i++) s += x[i] * x[i]
    rms[w] = Math.sqrt(s / win)
  }
  const sorted = Array.from(rms).sort((a, b) => a - b)
  const floor = sorted[Math.floor(n * 0.1)], peak = sorted[Math.floor(n * 0.98)]
  const threshold = Math.max(floor * 2.5, peak * 0.07, 0.004)
  const minGap = Math.round(0.45 / 0.02), keep = Math.round(0.09 / 0.02)
  const quiet = w => rms[w] < threshold
  // Windows to cut: the middle of every long quiet run, keeping a little on each side
  const cut = new Uint8Array(n)
  for (let w = 0; w < n;) {
    if (!quiet(w)) { w++; continue }
    let e = w
    while (e < n && quiet(e)) e++
    const leading = w === 0, trailing = e === n
    if (e - w >= minGap || leading || trailing) {
      const from = leading ? w : w + keep, to = trailing ? e : e - keep
      for (let k = from; k < to; k++) cut[k] = 1
    }
    w = e
  }
  const kept = []
  for (let w = 0; w < n;) {
    if (cut[w]) { w++; continue }
    let e = w
    while (e < n && !cut[e]) e++
    kept.push([w * win, e * win])
    w = e
  }
  if (!kept.length) return { samples: x, segments: [[0, 0, x.length / RATE]], saved: 0 }
  const total = kept.reduce((a, [s, e]) => a + e - s, 0)
  const out = new Float32Array(total)
  const segments = []
  const fade = Math.round(RATE * 0.006)
  let o = 0
  for (const [s, e] of kept) {
    out.set(x.subarray(s, e), o)
    // Tiny fades at the joins so the cuts don't click
    for (let i = 0; i < fade && i < e - s; i++) { out[o + i] *= i / fade; out[o + e - s - 1 - i] *= i / fade }
    segments.push([o / RATE, s / RATE, (e - s) / RATE])
    o += e - s
  }
  return { samples: out, segments, saved: (x.length - total) / RATE }
}

/** Original-recording time for a playback time in a trimmed clip */
export function originalTime(segments, t) {
  if (!segments) return t
  for (const [out, inn, len] of segments) if (t < out + len) return inn + Math.max(0, t - out)
  const last = segments[segments.length - 1]
  return last ? last[1] + last[2] : t
}

/** WSOLA time stretch: output is `factor` times as long, same pitch */
function stretch(x, factor) {
  const N = 1024, Hs = N / 2, tol = 192
  const Ha = Hs / factor
  const outLen = Math.floor(x.length * factor)
  const out = new Float32Array(outLen + N)
  const norm = new Float32Array(outLen + N)
  const w = new Float32Array(N)
  for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1))
  let prev = 0
  for (let k = 0; k * Hs < outLen; k++) {
    const nominal = Math.round(k * Ha)
    let best = nominal
    if (k > 0) {
      // Pick the frame near the nominal position that continues the previous one most smoothly
      const natural = prev + Hs
      let bestScore = -Infinity
      for (let d = -tol; d <= tol; d += 4) {
        const c = nominal + d
        if (c < 0 || c + N >= x.length) continue
        let s = 0
        for (let i = 0; i < Hs; i += 4) s += x[c + i] * (x[natural + i] || 0)
        if (s > bestScore) { bestScore = s; best = c }
      }
    }
    best = Math.max(0, Math.min(best, x.length - N - 1))
    if (best < 0) break
    const o = k * Hs
    for (let i = 0; i < N; i++) { out[o + i] += (x[best + i] || 0) * w[i]; norm[o + i] += w[i] }
    prev = best
  }
  for (let i = 0; i < outLen; i++) out[i] = norm[i] > 1e-3 ? out[i] / norm[i] : 0
  return out.subarray(0, outLen)
}

/** Raises (ratio > 1) or lowers the pitch, keeping the length */
export function pitchShift(x, ratio) {
  if (x.length < 4096 || Math.abs(ratio - 1) < 0.01) return x
  return resample(stretch(x, ratio), ratio)
}

/** 16-bit mono WAV */
export function toWav(x, rate = RATE) {
  const buf = new ArrayBuffer(44 + x.length * 2)
  const v = new DataView(buf)
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + x.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true)
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, x.length * 2, true)
  for (let i = 0; i < x.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 0x7fff, true)
  return new Blob([buf], { type: 'audio/wav' })
}

export const SAMPLE_RATE = RATE
