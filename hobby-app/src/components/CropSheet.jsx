// Crop a photo before it's saved or posted: drag the frame to move it, drag a corner to resize it.
// Hands back the crop as fractions of the picture ({ x, y, w, h }), or null for the whole photo.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../i18n'
import { lockScroll } from './ui'

const FULL = { x: 0, y: 0, w: 1, h: 1 }
const MIN = 48 // the smallest frame, in screen px
const SHAPES = [
  ['free', 'Freeform'],
  [1, 'Square'],
  [4 / 5, '4:5'],
  [4 / 3, '4:3'],
  [16 / 9, '16:9'],
]
const CORNERS = ['nw', 'ne', 'sw', 'se']

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)

// The biggest frame of this shape (width / height) that fits the picture, centred
function fitted(a, W, H) {
  let w = W
  let h = W / a
  if (h > H) {
    h = H
    w = H * a
  }
  return { x: (W - w) / 2 / W, y: (H - h) / 2 / H, w: w / W, h: h / H }
}

const isFull = (r) => r.x < 0.002 && r.y < 0.002 && r.w > 0.996 && r.h > 0.996

// file: the picked File or Blob. aspect: a fixed shape (1 for a profile photo), or none for a free choice.
// initial: an earlier crop of the same photo, to carry on from.
export function CropSheet({ file, aspect, initial, onDone, onCancel }) {
  const { t } = useT()
  const [url, setUrl] = useState(null)
  const [nat, setNat] = useState(null) // the picture's own size
  const [box, setBox] = useState(null) // the room the stage has
  const [shape, setShape] = useState(aspect || 'free')
  const [rect, setRect] = useState(initial || FULL)
  const stage = useRef(null)
  const frame = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    let alive = true
    const u = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (!alive) return
      setNat({ w: img.naturalWidth, h: img.naturalHeight })
      if (aspect && !initial) setRect(fitted(aspect, img.naturalWidth, img.naturalHeight))
      setUrl(u)
    }
    // Can't be shown here (a format this browser can't open): skip cropping, saving reports the problem
    img.onerror = () => alive && onDone(null)
    img.src = u
    return () => {
      alive = false
      URL.revokeObjectURL(u)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  useLayoutEffect(() => {
    const el = stage.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Escape cancels the crop only, not the sheet underneath it
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKey, true)
    const unlock = lockScroll() // shared with the sheets (ui.jsx), so closing in any order never leaves the page stuck
    return () => {
      window.removeEventListener('keydown', onKey, true)
      unlock()
    }
  }, [onCancel])

  // The picture as big as it fits on screen
  const scale = nat && box ? Math.min(box.w / nat.w, box.h / nat.h) : 0
  const W = nat ? nat.w * scale : 0
  const H = nat ? nat.h * scale : 0
  const ratio = shape === 'free' ? null : shape

  const down = (mode) => (e) => {
    e.preventDefault()
    e.stopPropagation()
    frame.current.setPointerCapture(e.pointerId)
    drag.current = { mode, px: e.clientX, py: e.clientY, r: { x: rect.x * W, y: rect.y * H, w: rect.w * W, h: rect.h * H } }
  }
  const move = (e) => {
    const d = drag.current
    if (!d) return
    const r = d.r
    let next
    if (d.mode === 'move') {
      next = { ...r, x: clamp(r.x + e.clientX - d.px, 0, W - r.w), y: clamp(r.y + e.clientY - d.py, 0, H - r.h) }
    } else {
      // A corner: the opposite corner stays put
      const left = d.mode.includes('w')
      const top = d.mode.includes('n')
      const ax = left ? r.x + r.w : r.x
      const ay = top ? r.y + r.h : r.y
      const maxW = left ? ax : W - ax
      const maxH = top ? ay : H - ay
      const b = frame.current.getBoundingClientRect()
      const px = e.clientX - b.left
      const py = e.clientY - b.top
      let w = clamp(left ? ax - px : px - ax, MIN, maxW)
      let h = clamp(top ? ay - py : py - ay, MIN, maxH)
      if (ratio) {
        // Keep the shape, following whichever side was pulled further
        if (w / h > ratio) h = w / ratio
        else w = h * ratio
        if (w > maxW) (w = maxW), (h = w / ratio)
        if (h > maxH) (h = maxH), (w = h * ratio)
      }
      next = { x: left ? ax - w : ax, y: top ? ay - h : ay, w, h }
    }
    setRect({ x: next.x / W, y: next.y / H, w: next.w / W, h: next.h / H })
  }
  const up = () => (drag.current = null)

  // Freeform starts again from the whole photo; a shape from the biggest frame of it
  const pickShape = (v) => {
    setShape(v)
    setRect(v === 'free' ? FULL : fitted(v, nat.w, nat.h))
  }
  const done = () => onDone(!aspect && isFull(rect) ? null : rect)

  const pct = (v) => `${v * 100}%`
  return createPortal(
    <div className="fixed inset-0 z-[80] flex animate-fade flex-col bg-black text-white" role="dialog" aria-modal="true" aria-label={t('Crop photo')}>
      <div className="flex items-center justify-between px-2 pb-1 pt-[max(8px,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} className="min-h-[44px] px-3 text-[17px] active:opacity-60">
          {t('Cancel')}
        </button>
        <h2 className="text-[17px] font-semibold">{t('Crop photo')}</h2>
        <button type="button" onClick={done} disabled={!nat} className="min-h-[44px] px-3 text-[17px] font-semibold text-spark active:opacity-60 disabled:opacity-40">
          {t('Done')}
        </button>
      </div>

      <div ref={stage} className="relative mx-5 my-4 flex min-h-0 flex-1 items-center justify-center">
        {url && scale > 0 && (
          <div
            ref={frame}
            className="relative touch-none select-none overflow-hidden"
            style={{ width: W, height: H }}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
          >
            <img src={url} alt="" draggable={false} className="pointer-events-none h-full w-full" />
            <div
              className="absolute cursor-move border border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
              style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
              onPointerDown={down('move')}
            >
              {/* Rule of thirds */}
              <span className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/40" />
              <span className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/40" />
              <span className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/40" />
              <span className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/40" />
              {CORNERS.map((c) => (
                <span
                  key={c}
                  onPointerDown={down(c)}
                  className="absolute h-11 w-11"
                  style={{
                    left: c.includes('w') ? -6 : undefined,
                    right: c.includes('e') ? -6 : undefined,
                    top: c.includes('n') ? -6 : undefined,
                    bottom: c.includes('s') ? -6 : undefined,
                    cursor: c === 'nw' || c === 'se' ? 'nwse-resize' : 'nesw-resize',
                  }}
                >
                  <span
                    className="pointer-events-none absolute h-5 w-5 border-white"
                    style={{
                      [c.includes('w') ? 'left' : 'right']: 4,
                      [c.includes('n') ? 'top' : 'bottom']: 4,
                      [c.includes('w') ? 'borderLeftWidth' : 'borderRightWidth']: 3,
                      [c.includes('n') ? 'borderTopWidth' : 'borderBottomWidth']: 3,
                    }}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex min-h-[52px] items-center justify-center gap-1.5 overflow-x-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-1 [scrollbar-width:none]">
        {!aspect &&
          SHAPES.map(([v, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => pickShape(v)}
              disabled={!nat}
              aria-pressed={shape === v}
              className={`min-h-[36px] shrink-0 rounded-full px-3 text-[14px] font-semibold transition ${shape === v ? 'bg-white text-black' : 'bg-white/15 text-white'}`}
            >
              {t(label)}
            </button>
          ))}
      </div>
    </div>,
    document.body,
  )
}
