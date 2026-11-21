// Business page: the two hero tiles lean toward the pointer, and "Plan your tattoos" opens a sheet that
// writes the request for you (occasion, design, date, people), shows the design (a logo, a name, a QR code) as a
// tattoo printed on a real forearm photo, and sends it straight to Greta with a picture of it (worker/site.js).
// "Copy the message instead" stays for anyone who prefers LinkedIn.
// Without JS (or without <dialog>) the button is a plain link to /contact/.
;(function () {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const fine = matchMedia('(hover: hover) and (pointer: fine)')

  /* ---------- Hero tiles: a small 3D lean toward the pointer ---------- */
  document.querySelectorAll('.pair .tile').forEach((tile) => {
    const icon = tile.querySelector('.app-icon')
    let raf = 0
    let px = 0
    let py = 0
    const paint = () => {
      raf = 0
      const r = icon.getBoundingClientRect()
      const x = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (r.width / 2)))
      const y = Math.max(-1, Math.min(1, (py - (r.top + r.height / 2)) / (r.height / 2)))
      icon.style.setProperty('--ry', (x * 12).toFixed(2) + 'deg')
      icon.style.setProperty('--rx', (-y * 12).toFixed(2) + 'deg')
    }
    tile.addEventListener('pointermove', (e) => {
      if (!fine.matches || reduced.matches || e.pointerType !== 'mouse') return
      px = e.clientX
      py = e.clientY
      tile.classList.add('tracking')
      if (!raf) raf = requestAnimationFrame(paint)
    })
    tile.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf)
      raf = 0
      tile.classList.remove('tracking')
      icon.style.removeProperty('--rx')
      icon.style.removeProperty('--ry')
    })
  })

  // site.js (loaded after this file) provides the sheet and the sender
  document.addEventListener('DOMContentLoaded', planner)

  /* ---------- The arm photos ----------
     Real photographs, one per skin tone, rotated so the forearm runs left to right and cropped to one framing: the
     wrist sits at 35 % of the width and the middle of the forearm fills 42 % of the height, about 7 cm on a real arm.
     All three are free for commercial use without attribution under the Pexels licence (https://www.pexels.com/license/):
       light   https://www.pexels.com/photo/persons-right-hand-on-white-wall-8753386/   (Alexandra Krainyukhova)
       medium  https://www.pexels.com/photo/raised-arm-of-woman-20805383/               (Vera Emilie)
       deep    https://www.pexels.com/photo/photograph-of-a-person-s-arm-8062714/       (Amusan John)
     Self-hosted as /img/ink/arm-<tone>.webp (560 × 350) and @2x (1120 × 700).
     t / b: the forearm's top and bottom outline as fractions of the height, every 2.5 % of the width from u0 to 1. */
  const ARM = { u0: 0.375, step: 0.025, cm: 7, frac: 0.42 }
  const ARMS = [
    { name: 'light',
      t: [0.271, 0.275, 0.279, 0.284, 0.287, 0.289, 0.29, 0.29, 0.29, 0.29, 0.289, 0.288, 0.288, 0.288, 0.288, 0.289, 0.29, 0.29, 0.292, 0.293, 0.295, 0.296, 0.298, 0.3, 0.303, 0.306],
      b: [0.686, 0.687, 0.688, 0.69, 0.691, 0.693, 0.694, 0.697, 0.7, 0.704, 0.708, 0.711, 0.715, 0.719, 0.722, 0.726, 0.73, 0.734, 0.739, 0.744, 0.75, 0.756, 0.763, 0.771, 0.779, 0.784] },
    { name: 'medium',
      t: [0.104, 0.107, 0.111, 0.115, 0.119, 0.123, 0.126, 0.128, 0.131, 0.135, 0.139, 0.142, 0.144, 0.146, 0.147, 0.147, 0.148, 0.148, 0.148, 0.147, 0.145, 0.142, 0.139, 0.138, 0.136, 0.136],
      b: [0.483, 0.487, 0.492, 0.499, 0.507, 0.516, 0.525, 0.533, 0.541, 0.548, 0.555, 0.563, 0.571, 0.579, 0.588, 0.596, 0.605, 0.614, 0.624, 0.633, 0.642, 0.651, 0.66, 0.67, 0.679, 0.684] },
    { name: 'deep',
      t: [0.315, 0.315, 0.314, 0.313, 0.311, 0.31, 0.307, 0.304, 0.3, 0.296, 0.291, 0.288, 0.284, 0.28, 0.276, 0.272, 0.269, 0.264, 0.258, 0.252, 0.246, 0.239, 0.231, 0.223, 0.214, 0.207],
      b: [0.711, 0.708, 0.705, 0.702, 0.7, 0.7, 0.702, 0.704, 0.706, 0.708, 0.709, 0.71, 0.711, 0.711, 0.711, 0.711, 0.711, 0.711, 0.711, 0.711, 0.71, 0.709, 0.709, 0.708, 0.706, 0.705] },
  ]
  const WRAP = 0.8    // how round the forearm is: 1 = a cylinder, 0 = flat (an inner forearm is a flattened oval)
  const INK = 0.9     // a temporary tattoo never covers skin completely
  const QR_MM = 0.8   // smallest module that a phone camera still reads off skin, in millimetres

  // Where the forearm is in every pixel column of a W × H rendering
  const colCache = new Map()
  function columns(W, H, ix) {
    const k = `${W}x${H}:${ix}`
    if (colCache.has(k)) return colCache.get(k)
    const arm = ARMS[ix], n = arm.t.length, t = new Float32Array(W).fill(NaN), b = new Float32Array(W).fill(NaN)
    for (let x = 0; x < W; x++) {
      const f = ((x + 0.5) / W - ARM.u0) / ARM.step
      if (f < 0) continue
      const i = Math.min(n - 2, Math.floor(f)), a = Math.min(1, f - i)
      t[x] = (arm.t[i] * (1 - a) + arm.t[i + 1] * a) * H
      b[x] = (arm.b[i] * (1 - a) + arm.b[i + 1] * a) * H
    }
    const out = { t, b }
    if (colCache.size > 12) colCache.clear()
    colCache.set(k, out)
    return out
  }
  // Half the forearm's visible width at u, as a fraction of the height
  function halfWidth(ix, u) {
    const arm = ARMS[ix], n = arm.t.length
    const f = Math.max(0, Math.min(n - 1.001, (u - ARM.u0) / ARM.step)), i = Math.floor(f), a = f - i
    return ((arm.b[i] - arm.t[i]) * (1 - a) + (arm.b[i + 1] - arm.t[i + 1]) * a) / 2
  }

  /* An ink texture: mip levels from large to small, each holding ink density per channel = alpha × (1 − colour),
     so bilinear filtering never bleeds a background colour into the edge. content = the share of the texture the
     size in cm measures (a QR code's quiet zone is skin, not code). */
  function makeTexture(canvas, content = 1) {
    const levels = []
    let src = canvas
    const k = Math.min(1, 768 / Math.max(canvas.width, canvas.height))
    let w = Math.max(1, Math.round(canvas.width * k)), h = Math.max(1, Math.round(canvas.height * k))
    for (;;) {
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const g = c.getContext('2d')
      g.imageSmoothingQuality = 'high'
      g.drawImage(src, 0, 0, w, h)
      const px = g.getImageData(0, 0, w, h).data, d = new Uint8Array(w * h * 3)
      for (let i = 0, j = 0; i < px.length; i += 4, j += 3) {
        const a = px[i + 3]
        d[j] = (a * (255 - px[i])) / 255
        d[j + 1] = (a * (255 - px[i + 1])) / 255
        d[j + 2] = (a * (255 - px[i + 2])) / 255
      }
      levels.push({ w, h, d })
      if (Math.max(w, h) <= 40) break
      src = c
      w = Math.max(1, Math.round(w / 2)); h = Math.max(1, Math.round(h / 2))
    }
    return { levels, aspect: canvas.width / canvas.height, content }
  }

  /* The ink, wrapped onto the forearm: every pixel of the forearm near the tattoo is traced back through the oval
     cross-section to the flat design (inverse mapping, so there are no gaps or seams), then written as colour + alpha
     for a multiply blend. Near the outline the design turns away from the camera, compresses and fades. */
  function renderInk(W, H, ix, tex, cm, pl) {
    const col = columns(W, H, ix)
    const side = (cm * ARM.frac * H) / ARM.cm / tex.content
    const tw = tex.aspect >= 1 ? side : side * tex.aspect, th = tex.aspect >= 1 ? side / tex.aspect : side
    const X0 = pl.u * W, Y0 = pl.v * H, cs = Math.cos(pl.rot), sn = Math.sin(pl.rot)
    const hx = 0.5 * (Math.abs(tw * cs) + Math.abs(th * sn))
    const x0 = Math.max(Math.ceil(ARM.u0 * W), Math.floor(X0 - hx) - 1), x1 = Math.min(W, Math.ceil(X0 + hx) + 2)
    if (x1 <= x0) return null
    let y0 = H, y1 = 0
    for (let x = x0; x < x1; x++) { if (col.t[x] < y0) y0 = col.t[x]; if (col.b[x] > y1) y1 = col.b[x] }
    y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1))
    const bw = x1 - x0, bh = y1 - y0
    if (bw <= 0 || bh <= 0) return null
    // the smallest level that still has (nearly) a texel per pixel: no shimmer, and a touch of softness like real print
    let L = tex.levels[0]
    for (const l of tex.levels) if (l.w >= tw * 0.9) L = l
    const lw = L.w, lh = L.h, d = L.d, sx = lw / tw, sy = lh / th
    const img = new ImageData(bw, bh), o = img.data
    for (let x = x0; x < x1; x++) {
      const top = col.t[x], bot = col.b[x], c = (top + bot) / 2, r = (bot - top) / 2
      if (!(r > 1)) continue
      const dX = x + 0.5 - X0
      const ya = Math.max(y0, Math.ceil(top)), yb = Math.min(y1, Math.floor(bot))
      for (let y = ya; y < yb; y++) {
        const k = (y + 0.5 - c) / r
        if (k <= -1 || k >= 1) continue
        const dY = r * (WRAP * Math.asin(k) + (1 - WRAP) * k) - Y0
        const tx = (dX * cs + dY * sn + tw / 2) * sx - 0.5, ty = (dY * cs - dX * sn + th / 2) * sy - 0.5
        if (tx <= -1 || ty <= -1 || tx >= lw || ty >= lh) continue
        const ix0 = Math.floor(tx), iy0 = Math.floor(ty), fx = tx - ix0, fy = ty - iy0
        let r0 = 0, g0 = 0, b0 = 0
        for (let q = 0; q < 4; q++) {
          const xx = ix0 + (q & 1), yy = iy0 + (q >> 1)
          if (xx < 0 || yy < 0 || xx >= lw || yy >= lh) continue
          const wgt = (q & 1 ? fx : 1 - fx) * (q >> 1 ? fy : 1 - fy), j = (yy * lw + xx) * 3
          r0 += d[j] * wgt; g0 += d[j + 1] * wgt; b0 += d[j + 2] * wgt
        }
        const f = (INK * Math.min(1, Math.sqrt(1 - k * k) / 0.4)) / 255
        const dr = r0 * f, dg = g0 * f, db = b0 * f, A = Math.max(dr, dg, db)
        if (A < 0.004) continue
        const i = ((y - y0) * bw + (x - x0)) * 4
        o[i] = 255 * (1 - dr / A); o[i + 1] = 255 * (1 - dg / A); o[i + 2] = 255 * (1 - db / A); o[i + 3] = 255 * A
      }
    }
    return { x: x0, y: y0, img }
  }

  /* Uploaded logos: a plain backdrop (white paper, a flat colour) is keyed out from the edges inwards, its
     anti-aliased rim un-mixed from the backdrop colour; transparent PNGs keep their own alpha; photos stay as they are.
     The result is trimmed to the design so the size in cm means the design, not the empty margin around it. */
  function keyOut(c) {
    const g = c.getContext('2d'), w = c.width, h = c.height
    const im = g.getImageData(0, 0, w, h), p = im.data
    const border = []
    for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x)
    for (let y = 1; y < h - 1; y++) border.push(y * w, y * w + w - 1)
    let clear = 0
    for (const i of border) if (p[i * 4 + 3] < 250) clear++
    if (clear < border.length * 0.02) {
      const med = (ch) => { const v = border.map((i) => p[i * 4 + ch]).sort((a, b) => a - b); return v[v.length >> 1] }
      const bg = [med(0), med(1), med(2)]
      const dist = (i) => { const r = p[i * 4] - bg[0], gg = p[i * 4 + 1] - bg[1], b = p[i * 4 + 2] - bg[2]; return Math.sqrt(r * r + gg * gg + b * b) }
      let near = 0
      for (const i of border) if (dist(i) < 40) near++
      if (near >= border.length * 0.85) {
        const HARD = 34, SOFT = 120
        const done = new Uint8Array(w * h), queue = new Int32Array(w * h)
        let head = 0, tail = 0
        const visit = (j) => { if (!done[j] && dist(j) < HARD) { done[j] = 1; queue[tail++] = j } }
        for (const i of border) visit(i)
        while (head < tail) {
          const i = queue[head++], x = i % w
          if (x > 0) visit(i - 1)
          if (x < w - 1) visit(i + 1)
          if (i >= w) visit(i - w)
          if (i < w * (h - 1)) visit(i + w)
        }
        for (let i = 0; i < w * h; i++) if (done[i]) p[i * 4 + 3] = 0
        let ring = done
        for (let pass = 0; pass < 2; pass++) {
          const next = new Uint8Array(w * h)
          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const i = y * w + x
              if (done[i] || !(ring[i - 1] || ring[i + 1] || ring[i - w] || ring[i + w])) continue
              next[i] = 1
              const a = Math.max(0, Math.min(1, (dist(i) - HARD) / (SOFT - HARD)))
              if (a >= 1) continue
              for (let ch = 0; ch < 3; ch++) p[i * 4 + ch] = a > 0.02 ? Math.max(0, Math.min(255, bg[ch] + (p[i * 4 + ch] - bg[ch]) / a)) : bg[ch]
              p[i * 4 + 3] = Math.round(p[i * 4 + 3] * a)
            }
          }
          for (let i = 0; i < w * h; i++) if (next[i]) done[i] = 1
          ring = next
        }
        g.putImageData(im, 0, 0)
      }
    }
    // trim to what will actually be printed
    let minX = w, minY = h, maxX = -1, maxY = -1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (p[(y * w + x) * 4 + 3] > 10) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y }
      }
    }
    if (maxX < 0) return null
    const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02)
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad)
    const out = document.createElement('canvas')
    out.width = maxX - minX + 1; out.height = maxY - minY + 1
    out.getContext('2d').drawImage(c, minX, minY, out.width, out.height, 0, 0, out.width, out.height)
    return out
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('unreadable'))
      img.src = src
    })
  }

  // The QR encoder (js/vendor/qrcode.js, MIT) loads the first time the sheet opens
  let qrLoading = null
  function loadQr() {
    if (window.qrcode) return Promise.resolve(window.qrcode)
    if (!qrLoading) {
      qrLoading = new Promise((resolve, reject) => {
        const s = document.createElement('script')
        s.src = '/js/vendor/qrcode.js'
        s.onload = () => { window.qrcode.stringToBytes = window.qrcode.stringToBytesFuncs['UTF-8']; resolve(window.qrcode) }
        s.onerror = () => { qrLoading = null; s.remove(); reject(new Error('qr')) }
        document.head.appendChild(s)
      })
    }
    return qrLoading
  }
  // "gretagrosz.com/apps" becomes a link a phone opens; anything else (a sentence, a phone number) is encoded as typed
  function qrTarget(raw) {
    const s = raw.trim().replace(/\s+/g, ' ')
    if (!s) return ''
    if (/^(https?|mailto|tel|sms):/i.test(s)) return s
    if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?([/?#]\S*)?$/i.test(s)) return 'https://' + s
    return s
  }

  function planner() {
    const dialog = document.querySelector('.planner')
    const trigger = document.querySelector('[data-plan]')
    if (!dialog || !trigger || typeof dialog.showModal !== 'function' || !window.SITE) return

    const t = I18N.t
    const sheet = SITE.sheet(dialog)
    const form = dialog.querySelector('.plan')
    const done = dialog.querySelector('.gs-done')
    const f = form.elements
    const msg = f.msg
    const err = form.querySelector('.g-err')
    const send = form.querySelector('.send')
    const copyBtn = form.querySelector('.copy')
    const status = form.querySelector('[role="status"]')

    /* ----- The tattoo on the arm ----- */
    const tryBox = form.querySelector('.try')
    const stage = tryBox.querySelector('.try-stage')
    const photos = [...stage.querySelectorAll('.try-photo')]
    const cv = stage.querySelector('.try-ink')
    const cx = cv.getContext('2d')
    const file = tryBox.querySelector('input[type=file]')
    const addLabel = tryBox.querySelector('.try-add b')
    const removeBtn = tryBox.querySelector('.try-x')
    const size = f.size
    const sizeOut = tryBox.querySelector('.size output')
    const minNote = tryBox.querySelector('.try-min')
    const dateBox = form.querySelector('.gdate')

    const tex = { logo: null, name: null, qr: null }   // the ink for each design
    let logo = null       // the uploaded file as a data: URL, sent to Greta as it was (she designs from the original)
    let qrPng = null      // the QR code as a print-ready PNG, sent along with its target
    let qrModules = 0
    let tone = 1
    let cm = 5
    const sizes = { logo: 5, name: 7, qr: 4 }   // each design keeps its own size
    let lastDesign = 'logo'
    const place = { u: 0.66, v: 0, rot: 0 }   // centre along the arm (share of the width), across it (share of the height), turn
    let shown = false

    const design = () => f.design.value || 'logo'
    const current = () => tex[design()] || null
    const minCm = () => (design() === 'qr' && qrModules ? Math.max(2, Math.ceil(qrModules * QR_MM * 0.2) / 2) : 2)

    /* ----- Drawing ----- */
    let raf = 0
    let box = null   // the canvas region holding ink right now
    const schedule = () => { if (!raf) raf = requestAnimationFrame(paint) }
    function paint() {
      raf = 0
      const r = stage.getBoundingClientRect()
      if (!r.width) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5)
      const W = Math.round(r.width * dpr), H = Math.round(W / 1.6)
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; box = null }
      if (box) cx.clearRect(box.x, box.y, box.w, box.h)
      box = null
      const ink = current()
      if (!ink) return
      const out = renderInk(W, H, tone, ink, cm, place)
      if (!out) return
      cx.putImageData(out.img, out.x, out.y)
      box = { x: out.x, y: out.y, w: out.img.width, h: out.img.height }
    }
    if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(stage)

    // Keep the design on the forearm: past the wrist is the hand, and it can wrap around the arm but not off it
    function clampPlace() {
      const ink = current()
      if (!ink) return
      const side = (cm * ARM.frac) / ARM.cm / ink.content
      const tw = ink.aspect >= 1 ? side : side * ink.aspect, th = ink.aspect >= 1 ? side / ink.aspect : side
      const hx = (0.5 * (Math.abs(tw * Math.cos(place.rot)) + Math.abs(th * Math.sin(place.rot)))) / 1.6
      const lo = ARM.u0 + hx + 0.01, hi = Math.max(lo, 0.985 - hx * 0.25)
      place.u = Math.max(lo, Math.min(hi, place.u))
      const r = halfWidth(tone, place.u)
      place.v = Math.max(-r * 0.85, Math.min(r * 0.85, place.v))
    }

    function paintSize() {
      size.min = String(minCm())
      if (cm < minCm()) cm = minCm()
      size.value = String(cm)
      const lo = Number(size.min), hi = Number(size.max)
      size.style.setProperty('--fill', `${((cm - lo) / (hi - lo)) * 100}%`)
      sizeOut.textContent = `${I18N.num(Math.round(cm * 2) / 2, { maximumFractionDigits: 1 })} cm`
      const guard = design() === 'qr' && !!current() && cm <= minCm() + 0.01
      minNote.hidden = !guard
      if (guard) minNote.textContent = t('Smaller than {n} cm won’t scan.').replace('{n}', I18N.num(minCm(), { maximumFractionDigits: 1 }))
    }
    function setCm(v) {
      cm = Math.max(minCm(), Math.min(Number(size.max), v))
      paintSize(); clampPlace(); schedule()
    }
    size.addEventListener('input', () => setCm(Number(size.value)))
    size.addEventListener('change', () => { cm = Math.round(cm * 2) / 2; paintSize(); refresh() })

    form.querySelectorAll('input[name=tone]').forEach((r) => r.addEventListener('change', () => {
      tone = Number(r.value)
      stage.dataset.tone = r.value
      photos.forEach((p) => p.classList.toggle('on', p.dataset.tone === r.value))
      clampPlace(); schedule()
    }))

    // The stage state for the chosen design: which field shows, whether there is ink to move and size
    function syncStage() {
      const d = design()
      if (d !== lastDesign) {
        if (lastDesign in sizes) sizes[lastDesign] = cm
        if (d in sizes) cm = sizes[d]
        lastDesign = d
      }
      tryBox.hidden = d === 'idea'
      tryBox.dataset.design = d
      tryBox.querySelectorAll('.try-field').forEach((x) => { x.hidden = x.dataset.for !== d })
      const has = !!current()
      tryBox.classList.toggle('has', has)
      size.disabled = !has
      cv.tabIndex = has ? 0 : -1
      if (has && !shown) { cv.classList.remove('in'); void cv.offsetWidth; cv.classList.add('in') }
      shown = has
      addLabel.textContent = t(logo ? 'Change' : 'Add your logo')
      removeBtn.hidden = !logo
      paintSize(); clampPlace(); schedule()
    }

    /* ----- Logo ----- */
    // The file as Greta receives it: a PNG (keeps transparency) of at most 900 px, small enough to send
    function sendable(img) {
      let w = img.naturalWidth || 900, h = img.naturalHeight || 900
      const k = Math.min(1, 900 / Math.max(w, h))
      w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k))
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      c.getContext('2d').drawImage(img, 0, 0, w, h)
      let out = c.toDataURL('image/png')
      if (out.length > 650000) out = c.toDataURL('image/webp', 0.9)
      if (!out.startsWith('data:image/webp') && out.length > 650000) out = c.toDataURL('image/jpeg', 0.88)
      if (out.length > 650000) throw new Error('too big')
      return out
    }
    async function useFile(blob) {
      if (!blob) return
      if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(blob.type) || blob.size > 15 * 1024 * 1024) { showError('logo'); return }
      const url = URL.createObjectURL(blob)
      try {
        const img = await loadImage(url)
        const nw = img.naturalWidth || 1024, nh = img.naturalHeight || 1024
        const k = Math.min(1, 1200 / Math.max(nw, nh))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(nw * k)); c.height = Math.max(1, Math.round(nh * k))
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        const keyed = keyOut(c)
        if (!keyed) throw new Error('empty')
        const sent = sendable(img)
        tex.logo = makeTexture(keyed)
        logo = sent
      } catch (e) {
        showError('logo')
        return
      } finally { URL.revokeObjectURL(url) }
      shown = false
      clearError()
      syncStage()
      refresh()
    }
    function clearLogo() {
      logo = null
      tex.logo = null
      file.value = ''
      syncStage()
      refresh()
    }
    file.addEventListener('change', () => useFile(file.files[0]))
    removeBtn.addEventListener('click', () => { clearLogo(); file.focus() })
    stage.addEventListener('dragover', (e) => { if (design() !== 'logo') return; e.preventDefault(); stage.classList.add('drag') })
    stage.addEventListener('dragleave', () => stage.classList.remove('drag'))
    stage.addEventListener('drop', (e) => { if (design() !== 'logo') return; e.preventDefault(); stage.classList.remove('drag'); useFile(e.dataTransfer.files[0]) })

    /* ----- A name, in hand lettering (Caveat, already on the site) ----- */
    let nameJob = 0
    async function buildName() {
      const text = f.text.value.trim().replace(/\s+/g, ' ')
      const job = ++nameJob
      if (!text) { tex.name = null; syncStage(); return }
      const F = 180, font = `700 ${F}px Caveat, 'Bradley Hand', cursive`
      try { if (document.fonts) await document.fonts.load(font, text) } catch (e) { /* the fallback face still draws */ }
      if (job !== nameJob) return
      const c = document.createElement('canvas'), g = c.getContext('2d')
      g.font = font
      const m = g.measureText(text)
      const left = m.actualBoundingBoxLeft || 0, right = m.actualBoundingBoxRight || m.width
      const asc = m.actualBoundingBoxAscent || F * 0.75, desc = m.actualBoundingBoxDescent || F * 0.25
      const pad = Math.ceil(F * 0.08)
      c.width = Math.ceil(left + right + pad * 2); c.height = Math.ceil(asc + desc + pad * 2)
      g.font = font
      g.fillStyle = g.strokeStyle = '#18181C'
      g.lineJoin = 'round'
      g.lineWidth = F * 0.035
      g.fillText(text, pad + left, pad + asc)
      g.strokeText(text, pad + left, pad + asc)
      tex.name = makeTexture(c)
      syncStage()
    }

    /* ----- A QR code ----- */
    let qrJob = 0
    async function buildQr() {
      const target = qrTarget(f.qr.value)
      const job = ++qrJob
      if (!target) { tex.qr = null; qrPng = null; qrModules = 0; syncStage(); return }
      let qr
      try {
        const make = await loadQr()
        if (job !== qrJob) return
        qr = make(0, 'M')
        qr.addData(target, 'Byte')
        qr.make()
      } catch (e) { tex.qr = null; qrPng = null; qrModules = 0; syncStage(); return }
      const n = qr.getModuleCount(), Q = 4
      const draw = (M, paper) => {
        const c = document.createElement('canvas')
        c.width = c.height = (n + Q * 2) * M
        const g = c.getContext('2d')
        if (paper) { g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height) }
        g.fillStyle = '#111114'
        for (let r = 0; r < n; r++) for (let q = 0; q < n; q++) if (qr.isDark(r, q)) g.fillRect((q + Q) * M, (r + Q) * M, M, M)
        return c
      }
      qrModules = n
      tex.qr = makeTexture(draw(8, false), n / (n + Q * 2))
      qrPng = draw(12, true).toDataURL('image/png')
      if (cm < minCm()) cm = minCm()
      syncStage()
    }

    /* ----- Move it with a finger, pinch to resize and turn; arrow keys and +/- on a keyboard ----- */
    const pts = new Map()
    let gest = null
    function baseline() {
      const p = [...pts.values()], r = cv.getBoundingClientRect()
      gest = { r, u: place.u, v: place.v, rot: place.rot, cm, p0: p.map((q) => ({ x: q.x, y: q.y })) }
      if (p.length > 1) {
        gest.d0 = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) || 1
        gest.a0 = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x)
      }
    }
    cv.addEventListener('pointerdown', (e) => {
      if (!current() || pts.size >= 2) return
      e.preventDefault()
      try { cv.setPointerCapture(e.pointerId) } catch (x) { /* already captured */ }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      cv.classList.add('grab')
      baseline()
    })
    cv.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !gest) return
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const p = [...pts.values()], g = gest
      if (p.length === 1 || !g.d0) {
        place.u = g.u + (p[0].x - g.p0[0].x) / g.r.width
        place.v = g.v + (p[0].y - g.p0[0].y) / g.r.height
      } else {
        const mx = (p[0].x + p[1].x) / 2 - (g.p0[0].x + g.p0[1].x) / 2, my = (p[0].y + p[1].y) / 2 - (g.p0[0].y + g.p0[1].y) / 2
        place.u = g.u + mx / g.r.width
        place.v = g.v + my / g.r.height
        let rot = g.rot + Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) - g.a0
        rot = Math.atan2(Math.sin(rot), Math.cos(rot))
        place.rot = Math.abs(rot) < 0.07 ? 0 : rot   // snaps straight
        cm = Math.max(minCm(), Math.min(Number(size.max), (g.cm * Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)) / g.d0))
        paintSize()
      }
      clampPlace()
      schedule()
    })
    const lift = (e) => {
      if (!pts.delete(e.pointerId)) return
      if (pts.size) { baseline(); return }
      gest = null
      cv.classList.remove('grab')
      cm = Math.round(cm * 2) / 2
      paintSize(); clampPlace(); schedule(); refresh()
    }
    cv.addEventListener('pointerup', lift)
    cv.addEventListener('pointercancel', lift)
    cv.addEventListener('keydown', (e) => {
      if (!current()) return
      const k = e.key, step = e.shiftKey ? 0.05 : 0.015
      if (k === 'ArrowLeft') place.u -= step
      else if (k === 'ArrowRight') place.u += step
      else if (k === 'ArrowUp') place.v -= step
      else if (k === 'ArrowDown') place.v += step
      else if (k === '+' || k === '=') { setCm(cm + 0.5); refresh() }
      else if (k === '-' || k === '_') { setCm(cm - 0.5); refresh() }
      else return
      e.preventDefault()
      clampPlace(); schedule()
    })

    // The picture Greta gets: the 2x photo with the ink multiplied on, as a JPEG
    async function preview() {
      const ink = current()
      if (!ink) return null
      const W = 1120, H = 700
      const img = await loadImage(`/img/ink/arm-${ARMS[tone].name}@2x.webp`)
      const c = document.createElement('canvas')
      c.width = W; c.height = H
      const g = c.getContext('2d')
      g.drawImage(img, 0, 0, W, H)
      const out = renderInk(W, H, tone, ink, cm, place)
      if (out) {
        const layer = document.createElement('canvas')
        layer.width = W; layer.height = H
        layer.getContext('2d').putImageData(out.img, out.x, out.y)
        g.globalCompositeOperation = 'multiply'
        g.drawImage(layer, 0, 0)
      }
      for (const q of [0.86, 0.76, 0.64]) {
        const url = c.toDataURL('image/jpeg', q)
        if (url.length <= 240000) return url
      }
      return null
    }

    /* ----- The message, written from the choices until the visitor types in it ----- */
    let edited = false
    let started = 0
    let doneTimer = 0
    const OCC = { festival: 'for a festival', event: 'for an event', team: 'for my team' }

    function compose() {
      const occ = f.occ.value || 'festival'
      const d = design()
      let first = `${t('I would like Weekend Ink tattoos')} ${t(OCC[occ])}`
      if (f.date.value) {
        const day = new Date(f.date.value + 'T12:00:00')
        if (!Number.isNaN(day.getTime())) {
          const when = new Intl.DateTimeFormat(I18N.lang === 'de' ? 'de-AT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(day)
          first += ' ' + t('on {date}').replace('{date}', when)
        }
      }
      const n = Math.round(Number(f.people.value))
      if (f.people.value !== '' && Number.isFinite(n) && n > 0) first += ' ' + t(n === 1 ? 'for about {n} person' : 'for about {n} people').replace('{n}', I18N.num(n))
      let what
      const text = f.text.value.trim().replace(/\s+/g, ' '), target = qrTarget(f.qr.value)
      if (d === 'logo') what = t('We are thinking of our logo.') + (logo ? ' ' + t('I have attached it.') : '')
      else if (d === 'name') what = text ? t('We are thinking of a name: “{text}”.').replace('{text}', text) : t('We are thinking of a name.')
      else if (d === 'qr') what = target ? t('We are thinking of a QR code that opens {url}.').replace('{url}', target) : t('We are thinking of a QR code.')
      else what = t('We have our own idea.')
      if (current()) what += ' ' + t('About {n} cm in size.').replace('{n}', I18N.num(Math.round(cm * 2) / 2, { maximumFractionDigits: 1 }))
      return `${t('Hi Greta,')}\n\n${first}. ${what} ${t('Can we talk about it?')}`
    }
    function fit() {
      if (!dialog.open) return
      const top = dialog.scrollTop
      msg.style.height = 'auto'
      msg.style.height = msg.scrollHeight + 2 + 'px'
      dialog.scrollTop = top
    }
    function refresh() {
      if (!edited) msg.value = compose()
      dateBox.classList.toggle('empty', !f.date.value)
      fit()
    }

    /* ----- Errors ----- */
    function showError(code) {
      err.dataset.code = code
      err.textContent = SITE.errorText(code)
      err.classList.add('on')
    }
    function clearError() {
      err.classList.remove('on')
      form.querySelectorAll('.gfield.bad').forEach((x) => x.classList.remove('bad'))
    }
    function mark(field) {
      const el = form.querySelector(`[data-f="${field}"]`)
      if (!el) return
      el.classList.remove('bad'); void el.offsetWidth; el.classList.add('bad')
      const input = el.querySelector('input:not([type=file]), textarea')
      if (input) input.focus()
    }

    // Only the choices that write the message rewrite it (a change on name/email must not move the layout under a tap)
    form.addEventListener('change', (e) => {
      if (e.target.name === 'design') syncStage()
      if (['occ', 'design', 'date', 'people'].includes(e.target.name)) refresh()
    })
    form.addEventListener('input', (e) => {
      const n = e.target.name
      if (e.target === msg) { edited = msg.value.trim() !== '' && msg.value !== compose(); fit() }
      else if (n === 'text') { buildName().then(refresh); refresh() }
      else if (n === 'qr') { buildQr().then(refresh); refresh() }
      else if (['date', 'people'].includes(n)) refresh()
      const fieldBox = e.target.closest('.gfield')
      if (fieldBox) fieldBox.classList.remove('bad')
      if (e.target.type !== 'range' && e.target.type !== 'file') err.classList.remove('on')
    })
    // Enter in the lettering or QR field closes the keyboard instead of sending the form half-filled
    ;[f.text, f.qr].forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); x.blur() } }))
    document.addEventListener('langchange', () => {
      refresh(); paintSize()
      addLabel.textContent = t(logo ? 'Change' : 'Add your logo')
      if (err.classList.contains('on')) showError(err.dataset.code)
    })

    /* ----- The keyboard on iPhone: lift the sheet above it and keep the focused field in sight ----- */
    const vv = window.visualViewport
    function keyboard() {
      if (!vv) return
      const cover = dialog.open ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0
      const on = cover > 120 && matchMedia('(max-width: 560px)').matches
      dialog.classList.toggle('kb', on)
      dialog.style.setProperty('--kb', on ? cover + 'px' : '0px')
      dialog.style.maxHeight = on ? Math.round(vv.height - 8) + 'px' : ''
      if (!on) return
      const el = document.activeElement
      if (!el || !dialog.contains(el) || !el.matches('input, textarea')) return
      const r = (el.closest('.gfield') || el).getBoundingClientRect(), d = dialog.getBoundingClientRect()
      if (r.bottom > d.bottom - 12) dialog.scrollTop += r.bottom - d.bottom + 12
      else if (r.top < d.top + 12) dialog.scrollTop -= d.top + 12 - r.top
    }
    if (vv) {
      vv.addEventListener('resize', keyboard)
      vv.addEventListener('scroll', keyboard)
      dialog.addEventListener('focusin', () => setTimeout(keyboard, 60))
      dialog.addEventListener('close', keyboard)
    }

    /* ----- Send ----- */
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      if (send.classList.contains('busy')) return
      clearError()
      const name = f.name.value.trim(), email = f.email.value.trim(), message = (msg.value.trim() || compose())
      const today = new Date().toISOString().slice(0, 10)
      const people = f.people.value === '' ? null : Number(f.people.value)
      let bad = null
      if (f.date.value && f.date.value < today) bad = 'date'
      else if (people != null && (!Number.isInteger(people) || people < 1 || people > 100000)) bad = 'people'
      else if (!name) bad = 'name'
      else if (!SITE.EMAIL.test(email)) bad = 'email'
      if (bad) { mark(bad); showError(bad); return }
      send.classList.add('busy')
      send.disabled = true
      try {
        const d = design()
        const details = { occasion: f.occ.value, design: d, date: f.date.value || null, people }
        if (current()) details.size = Math.round(cm * 2) / 2
        if (d === 'name' && f.text.value.trim()) details.text = f.text.value.trim().replace(/\s+/g, ' ')
        if (d === 'qr' && qrTarget(f.qr.value)) details.qr = qrTarget(f.qr.value)
        let shot = null
        try { shot = await preview() } catch (x) { shot = null }   // the request still goes out without a picture
        await SITE.send({
          kind: 'weekendink', name, email, message, details,
          logo: d === 'logo' ? logo : d === 'qr' ? qrPng : null,
          preview: shot,
          website: f.website.value,
          typingMs: Date.now() - started,
        })
        SITE.rememberMe(name, email)
        done.querySelector('p').textContent = t('Thanks, {name}. I’ll reply to {email}.').replace('{name}', name.split(/\s+/)[0]).replace('{email}', email)
        form.hidden = true
        done.hidden = false
        done.querySelector('.btn').focus({ preventScroll: true })
      } catch (x) {
        if (x.field) mark(x.field)
        showError(x.code)
      } finally {
        send.classList.remove('busy')
        send.disabled = false
      }
    })

    /* ----- Copy the message instead ----- */
    function setCopied(on) {
      clearTimeout(doneTimer)
      copyBtn.querySelector('.l-copy').hidden = on
      copyBtn.querySelector('.l-done').hidden = !on
      if (on) doneTimer = setTimeout(() => setCopied(false), 2400)
    }
    copyBtn.addEventListener('click', async () => {
      const text = msg.value.trim() || compose()
      let ok = false
      if (navigator.clipboard && window.isSecureContext) {
        try { await navigator.clipboard.writeText(text); ok = true } catch (e) { ok = false }
      }
      if (!ok) {
        const prev = [msg.selectionStart, msg.selectionEnd]
        msg.select()
        try { ok = document.execCommand('copy') } catch (e) { ok = false }
        try { msg.setSelectionRange(prev[0], prev[1]) } catch (e) { /* the textarea lost focus */ }
      }
      if (ok) { setCopied(true); status.textContent = t('Message copied.') }
      else { msg.focus(); msg.select(); status.textContent = t('Select the message and copy it.') }
    })

    /* ----- Open ----- */
    trigger.addEventListener('click', (e) => {
      e.preventDefault()
      if (dialog.open) return
      const now = new Date()
      f.date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      if (!done.hidden) {   // a request already went out: start a fresh one
        form.hidden = false; done.hidden = true; edited = false
        f.text.value = ''; f.qr.value = ''
        tex.name = tex.qr = null; qrPng = null; qrModules = 0
        place.u = 0.66; place.v = 0; place.rot = 0
        Object.assign(sizes, { logo: 5, name: 7, qr: 4 }); cm = sizes[design()] || 5
        clearLogo()
      }
      const m = SITE.me()
      if (!f.name.value && m.name) f.name.value = m.name
      if (!f.email.value && m.email) f.email.value = m.email
      if (!started) started = Date.now()
      clearError(); setCopied(false); status.textContent = ''
      sheet.open(trigger)
      syncStage()
      refresh()
      loadQr().catch(() => { /* tried again when the QR option is used */ })
    })
    syncStage()
    refresh()
  }
})()
