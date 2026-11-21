// The progress reel: a 9:16 video of a project, from the day-1 photo to the finished thing.
// Drawn on a canvas and recorded right in the browser (MediaRecorder), so it works offline and nothing is uploaded.
import { dayNumber } from './data'
import { photoUrl } from './media'

export const W = 1080
export const H = 1920
const FONT = '-apple-system, "SF Pro Display", BlinkMacSystemFont, system-ui, "Segoe UI", Roboto, sans-serif'
const ACCENT = '#B85A43'
// Instagram covers roughly the top 250 px and the bottom 340 px of a story with its own UI
const SAFE_TOP = 260
const SAFE_BOTTOM = H - 360

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3)
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const springy = (x) => {
  const t = clamp(x)
  return 1 - Math.cos(t * Math.PI * 2.2) * Math.exp(-5.5 * t)
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img.naturalWidth ? img : null)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// The photos of a project, oldest first, as loaded images with their day number
export async function loadFrames(project) {
  const entries = [...project.entries].filter((e) => e.photo).sort((a, b) => a.at - b.at)
  const out = []
  for (const e of entries) {
    const url = await photoUrl(e.photo).catch(() => null)
    const img = url && (await loadImage(url))
    if (img) out.push({ img, day: dayNumber(project.createdAt, e.at), kind: e.kind })
  }
  return out
}

export const loadLogo = () => loadImage(`${import.meta.env.BASE_URL}logo.png`)

function cover(ctx, img, scale = 1, panX = 0, panY = 0, x = 0, y = 0, w = W, h = H) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * scale
  const dw = img.naturalWidth * s
  const dh = img.naturalHeight * s
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, x + (w - dw) / 2 + panX * (dw - w) * 0.5, y + (h - dh) / 2 + panY * (dh - h) * 0.5, dw, dh)
  ctx.restore()
}

function shade(ctx, from, to, alpha = 0.6) {
  const g = ctx.createLinearGradient(0, from, 0, to)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${alpha})`)
  ctx.fillStyle = g
  ctx.fillRect(0, Math.min(from, to), W, Math.abs(to - from))
}

function wrap(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth || !line) line = test
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    let last = kept[maxLines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1)
    kept[maxLines - 1] = `${last.trimEnd()}…`
    return kept
  }
  return lines
}

function text(
  ctx,
  str,
  x,
  y,
  { size = 64, weight = 700, color = '#fff', alpha = 1, align = 'left', maxWidth = W - 160, maxLines = 3, lineHeight = 1.08 } = {},
) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.font = `${weight} ${size}px ${FONT}`
  const lines = wrap(ctx, str, maxWidth, maxLines)
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * size * lineHeight))
  ctx.restore()
  return lines.length * size * lineHeight
}

// Rounded rectangle path (ctx.roundRect is missing on older iOS)
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function pill(ctx, str, x, y, { alpha = 1, bg = 'rgba(0,0,0,0.45)', color = '#fff', size = 44 } = {}) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.font = `700 ${size}px ${FONT}`
  const w = ctx.measureText(str).width + size * 1.1
  const h = size * 1.75
  ctx.fillStyle = bg
  rr(ctx, x, y, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = color
  ctx.textBaseline = 'middle'
  ctx.fillText(str, x + size * 0.55, y + h / 2 + 2)
  ctx.restore()
}

function check(ctx, cx, cy, r, p, color = ACCENT) {
  ctx.save()
  ctx.lineWidth = 6
  ctx.strokeStyle = p > 0 ? color : 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
  if (p > 0) {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx, cy, r * springy(p), 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const q = easeOut(clamp((p - 0.2) / 0.6))
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.42, cy + r * 0.02)
    const mx = cx - r * 0.1
    const my = cy + r * 0.32
    const ex = cx + r * 0.45
    const ey = cy - r * 0.32
    if (q < 0.4) ctx.lineTo(cx - r * 0.42 + (mx - (cx - r * 0.42)) * (q / 0.4), cy + r * 0.02 + (my - (cy + r * 0.02)) * (q / 0.4))
    else {
      ctx.lineTo(mx, my)
      const k = (q - 0.4) / 0.6
      ctx.lineTo(mx + (ex - mx) * k, my + (ey - my) * k)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// Evenly picks up to n items, always keeping the first and the last
function sample(list, n) {
  if (list.length <= n) return list
  return Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / (n - 1))])
}

// Builds the scenes: [{ d: duration ms, draw(ctx, p 0..1, ms) }]
export function buildScenes({ project, frames, logo, t, tn, name = '' }) {
  const scenes = []
  const first = frames[0]
  const finishFrame = [...frames].reverse().find((f) => f.kind === 'finish') || frames[frames.length - 1]
  const last = frames.length > 1 ? finishFrame : null
  const middle = sample(
    frames.filter((f) => f !== first && f !== last),
    6,
  )
  const totalDays = dayNumber(project.createdAt, project.finishedAt || Date.now())
  const steps = project.milestones
  const doneSteps = steps.filter((m) => m.done)

  // 1. Day 1: the "before"
  scenes.push({
    d: 1700,
    draw(ctx, p) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      if (first) {
        cover(ctx, first.img, 1.04 + 0.05 * p, -0.3 + 0.3 * p, 0)
        shade(ctx, H * 0.45, H, 0.75)
        shade(ctx, SAFE_TOP + 120, 0, 0.35)
      }
      const a = easeOut(p / 0.35)
      pill(ctx, t('Day {n}', { n: first ? first.day : 1 }), 80, SAFE_TOP - 20 + (1 - a) * 30, { alpha: a, bg: ACCENT })
      const b = easeOut((p - 0.15) / 0.4)
      text(ctx, project.title, 80, SAFE_BOTTOM - 210 + (1 - b) * 40, { size: 92, alpha: b, maxLines: 3 })
    },
  })

  // 2. The middle: quick cuts with a soft crossfade
  middle.forEach((f, i) => {
    const prev = i === 0 ? first : middle[i - 1]
    scenes.push({
      d: 850,
      draw(ctx, p, ms) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, W, H)
        if (prev) cover(ctx, prev.img, 1.09, 0, 0)
        ctx.save()
        ctx.globalAlpha = easeOut(ms / 220)
        // Black first, so a see-through photo (a sticker, a cut-out) never shows the previous one through it
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, W, H)
        cover(ctx, f.img, 1.03 + 0.06 * p, i % 2 ? 0.25 - 0.25 * p : -0.25 + 0.25 * p, 0)
        ctx.restore()
        shade(ctx, SAFE_TOP + 160, 0, 0.4)
        pill(ctx, t('Day {n}', { n: f.day }), 80, SAFE_TOP - 20, { alpha: easeOut(ms / 160) })
      },
    })
  })

  // 3. The steps, ticking off one after another
  if (doneSteps.length) {
    const shown = doneSteps.slice(0, 8)
    const per = 230
    scenes.push({
      d: 500 + per * shown.length + 450,
      draw(ctx, p, ms) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, W, H)
        const head = easeOut(ms / 300)
        text(ctx, tn(doneSteps.length, '{n} step', '{n} steps'), 80, SAFE_TOP + 90 + (1 - head) * 30, { size: 88, alpha: head })
        const rowH = 132
        const top = SAFE_TOP + 220
        shown.forEach((m, i) => {
          const start = 300 + i * per
          const a = easeOut((ms - start + 120) / 260)
          const y = top + i * rowH
          check(ctx, 80 + 34, y + 34, 34, clamp((ms - start) / 380))
          text(ctx, m.text, 80 + 100, y + 50 + (1 - a) * 18, { size: 44, weight: 600, alpha: 0.35 + 0.65 * a, maxLines: 1, maxWidth: W - 280 })
        })
        if (doneSteps.length > shown.length) {
          text(ctx, `+${doneSteps.length - shown.length}`, 180, top + shown.length * rowH + 50, {
            size: 44,
            weight: 600,
            color: 'rgba(255,255,255,0.6)',
            alpha: easeOut((ms - 300 - shown.length * per) / 300),
          })
        }
      },
    })
  }

  // 4. The "after": finished
  scenes.push({
    d: 2100,
    draw(ctx, p, ms) {
      ctx.fillStyle = last || first ? '#000' : ACCENT
      ctx.fillRect(0, 0, W, H)
      const img = (last || (frames.length === 1 ? first : null))?.img
      if (img) {
        cover(ctx, img, 1.14 - 0.12 * easeOut(ms / 900), 0, 0)
        shade(ctx, H * 0.4, H, 0.8)
      } else {
        check(ctx, W / 2, H * 0.4, 150, clamp(ms / 700), '#fff')
      }
      const a = springy(clamp((ms - 250) / 700))
      ctx.save()
      ctx.translate(80, SAFE_BOTTOM - 120)
      ctx.scale(0.6 + 0.4 * a, 0.6 + 0.4 * a)
      text(ctx, t('Finished'), 0, 0, { size: 140, weight: 800, alpha: clamp((ms - 250) / 200) })
      ctx.restore()
      const b = easeOut((ms - 600) / 400)
      text(ctx, t('Day {n}', { n: totalDays }), 84, SAFE_BOTTOM - 10 + (1 - b) * 20, { size: 56, weight: 600, color: 'rgba(255,255,255,0.85)', alpha: b })
    },
  })

  // 5. Before and after, side by side (only with at least two photos)
  if (first && last) {
    scenes.push({
      d: 1700,
      draw(ctx, p, ms) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, W, H)
        const split = easeInOut(clamp(ms / 500))
        const half = H / 2
        cover(ctx, first.img, 1.02, 0, 0, 0, 0, W, half - 4)
        cover(ctx, last.img, 1.02, 0, 0, 0, half + 4 + (1 - split) * half, W, half - 4)
        pill(ctx, t('Day {n}', { n: first.day }), 80, SAFE_TOP - 20, { alpha: easeOut(ms / 300) })
        pill(ctx, t('Day {n}', { n: last.day }), 80, half + 60, { alpha: easeOut((ms - 300) / 300), bg: ACCENT })
      },
    })
  }

  // 6. End card
  const photos = frames.length
  const stats = [
    name.trim() || null,
    tn(totalDays, '{n} day', '{n} days'),
    doneSteps.length ? tn(doneSteps.length, '{n} step', '{n} steps') : null,
    photos ? tn(photos, '{n} photo', '{n} photos') : null,
  ]
    .filter(Boolean)
    .join(' · ')
  scenes.push({
    d: 1900,
    draw(ctx, p, ms) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)
      const a = easeOut(ms / 450)
      const h = text(ctx, project.title, 80, H * 0.42 + (1 - a) * 30, { size: 96, alpha: a, maxLines: 4 })
      const b = easeOut((ms - 200) / 450)
      text(ctx, stats, 84, H * 0.42 + h + 30, { size: 50, weight: 600, color: 'rgba(255,255,255,0.7)', alpha: b })
      const c = easeOut((ms - 450) / 450)
      ctx.save()
      ctx.globalAlpha = c
      if (logo) {
        ctx.save()
        rr(ctx, 80, SAFE_BOTTOM - 110, 96, 96, 24)
        ctx.clip()
        ctx.drawImage(logo, 80, SAFE_BOTTOM - 110, 96, 96)
        ctx.restore()
      }
      ctx.restore()
      text(ctx, 'Blank', logo ? 200 : 80, SAFE_BOTTOM - 44, { size: 52, alpha: c })
    },
  })
  return scenes
}

export const totalDuration = (scenes) => scenes.reduce((n, s) => n + s.d, 0)

export function drawAt(ctx, scenes, ms) {
  let acc = 0
  for (const s of scenes) {
    if (ms < acc + s.d) {
      s.draw(ctx, (ms - acc) / s.d, ms - acc)
      return
    }
    acc += s.d
  }
  const lastScene = scenes[scenes.length - 1]
  lastScene.draw(ctx, 1, lastScene.d)
}

// The first video format this browser can record: MP4 (Safari, newer Chrome) or WebM
export function recorderMime() {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null
  const options = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return (
    options.find((m) => {
      try {
        return MediaRecorder.isTypeSupported(m)
      } catch {
        return false
      }
    }) || null
  )
}

// A still card for sharing as a picture: day 1 on top, the result below (or the end card if there's one photo)
export function drawStill(ctx, { project, frames, logo, t, tn, name = '' }) {
  const scenes = buildScenes({ project, frames, logo, t, tn, name })
  const first = frames[0]
  const last = frames.length > 1 ? frames[frames.length - 1] : null
  if (first && last) {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    cover(ctx, first.img, 1, 0, 0, 0, 0, W, H / 2 - 4)
    cover(ctx, last.img, 1, 0, 0, 0, H / 2 + 4, W, H / 2 - 4)
    shade(ctx, H * 0.62, H, 0.8)
    pill(ctx, t('Day {n}', { n: first.day }), 80, SAFE_TOP - 20)
    pill(ctx, t('Day {n}', { n: last.day }), 80, H / 2 + 60, { bg: ACCENT })
    // The title sits above the stats line, however many lines it wraps to
    ctx.font = `700 84px ${FONT}`
    const lines = wrap(ctx, project.title, W - 160, 2).length
    text(ctx, project.title, 80, SAFE_BOTTOM - 70 - (lines - 1) * 84 * 1.08, { size: 84, maxLines: 2 })
    const days = dayNumber(project.createdAt, project.finishedAt || Date.now())
    text(ctx, [name.trim() || null, tn(days, '{n} day', '{n} days'), 'Blank'].filter(Boolean).join(' · '), 84, SAFE_BOTTOM + 10, {
      size: 46,
      weight: 600,
      color: 'rgba(255,255,255,0.8)',
    })
    return
  }
  const end = scenes[scenes.length - 1]
  end.draw(ctx, 1, end.d)
}
