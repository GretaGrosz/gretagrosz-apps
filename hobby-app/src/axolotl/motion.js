// Blank's axolotl: one-shot motion + the idle scheduler.
//
// Every helper takes an svg.axo, a React ref to one, any element inside one, or a container that holds one,
// and returns a Promise that settles when the motion is over (never rejects). Importing this module is enough
// for idle life: every svg.axo on the page gets breathing/sway (axolotl.css), random blinks and pupil drift,
// paused while it is offscreen or the tab is hidden. prefers-reduced-motion turns all of it into plain fades.
import './axolotl.css'

const SVG_NS = 'http://www.w3.org/2000/svg'
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const IN = 'cubic-bezier(0.55, 0, 0.75, 0.1)'
const SOFT = 'cubic-bezier(0.45, 0, 0.55, 1)'
const BIG_PROPS = new Set(['camera', 'guitar', 'bread', 'book', 'timer'])
const SPARKLE_COLORS = ['#B85A43', '#F08F7E', '#F2B84B', '#B85A43', '#F08F7E', '#F2B84B', '#B85A43', '#F08F7E']

const hasDOM = typeof document !== 'undefined' && typeof window !== 'undefined'
const reducedQuery = hasDOM && typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null
const reduced = () => !!(reducedQuery && reducedQuery.matches)
const done = Promise.resolve()
const rand = (a, b) => a + Math.random() * (b - a)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/** Finds the svg.axo for an element, a ref ({ current }), a selector, or a container. */
export function resolve(target) {
  if (!hasDOM || !target) return null
  let el = target
  if (typeof el === 'string') el = document.querySelector(el)
  else if (!(el instanceof Element) && typeof el === 'object' && 'current' in el) el = el.current
  if (!(el instanceof Element)) return null
  if (el.matches('svg.axo')) return el
  return el.closest('svg.axo') || el.querySelector('svg.axo')
}

// ---------------------------------------------------------------------------------------------------------------
// Per-instance state + scheduler
// ---------------------------------------------------------------------------------------------------------------

const states = new WeakMap()
const attached = new Set()
let io = null

function getIO() {
  if (!io && typeof IntersectionObserver === 'function') {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const s = states.get(e.target)
        if (!s) continue
        if (!e.target.isConnected) {
          detach(e.target)
          continue
        }
        s.visible = e.isIntersecting
        sync(e.target, s)
      }
    }, { rootMargin: '48px' })
  }
  return io
}

function state(el) {
  let s = states.get(el)
  if (!s) {
    s = {
      visible: typeof IntersectionObserver !== 'function',
      active: false,
      blinkTimer: 0,
      driftTimer: 0,
      lookTimer: 0,
      lookHeld: false,
      giggleTimer: 0,
      swapTimer: 0,
      blinking: false,
      anims: new Map(),
      peek: [],
      bump: [],
      travel: 0,
      moodObserver: null,
      mood: el.getAttribute('data-mood') || 'idle',
    }
    states.set(el, s)
  }
  return s
}

/** Starts idle life on one svg.axo. Idempotent; called automatically for every axolotl that renders. */
export function attach(target) {
  const el = resolve(target)
  if (!el) return () => {}
  const s = state(el)
  if (attached.has(el)) return () => detach(el)
  attached.add(el)
  for (const other of attached) if (!other.isConnected) detach(other)

  // Different phase per instance, so a screen full of axolotls never breathes or sways in sync
  el.style.setProperty('--axo-phase', `-${rand(0, 3.4).toFixed(2)}s`)

  s.variants = visibleVariants(el)
  s.moodObserver = new MutationObserver(() => {
    const mood = el.getAttribute('data-mood') || 'idle'
    if (mood === s.mood) return
    const from = s.mood
    s.mood = mood
    onMood(el, s, from, mood)
  })
  s.moodObserver.observe(el, { attributes: true, attributeFilter: ['data-mood'] })

  const obs = getIO()
  if (obs) obs.observe(el)
  sync(el, s)
  return () => detach(el)
}

/** Stops idle life on one svg.axo (also happens on its own when the element leaves the DOM). */
export function detach(target) {
  const el = target instanceof Element ? target : resolve(target)
  if (!el) return
  const s = states.get(el)
  attached.delete(el)
  if (io) io.unobserve(el)
  if (!s) return
  clearTimers(s)
  clearTimeout(s.giggleTimer)
  clearTimeout(s.swapTimer)
  if (s.moodObserver) s.moodObserver.disconnect()
  s.moodObserver = null
  s.active = false
}

function clearTimers(s) {
  clearTimeout(s.blinkTimer)
  clearTimeout(s.driftTimer)
  s.blinkTimer = 0
  s.driftTimer = 0
}

function sync(el, s) {
  if (!el.isConnected) return detach(el)
  const active = s.visible && !document.hidden && !reduced()
  el.toggleAttribute('data-axo-paused', !(s.visible && !document.hidden))
  if (active === s.active) return
  s.active = active
  clearTimers(s)
  if (active) {
    scheduleBlink(el, s, rand(900, 4200))
    scheduleDrift(el, s, rand(1200, 3500))
  }
}

function scheduleBlink(el, s, delay) {
  clearTimeout(s.blinkTimer)
  s.blinkTimer = setTimeout(() => {
    if (!s.active) return
    if (!el.isConnected) return detach(el)
    if (s.mood !== 'sleepy' && !el.hasAttribute('data-axo-giggle')) blink(el, { double: Math.random() < 0.18 })
    scheduleBlink(el, s, rand(2500, 6000))
  }, delay)
}

function scheduleDrift(el, s, delay) {
  clearTimeout(s.driftTimer)
  s.driftTimer = setTimeout(() => {
    if (!s.active) return
    if (!el.isConnected) return detach(el)
    if (!s.lookHeld) drift(el, s)
    scheduleDrift(el, s, rand(2600, 6500))
  }, delay)
}

// Pupils wander a little: mostly near the centre, sometimes a glance to the side
function drift(el, s) {
  const t = travel(el, s)
  if (s.mood === 'sleepy') return setLook(el, 0, t * 0.3)
  if (s.mood === 'thinking' || s.mood === 'worried') {
    const a = rand(0, Math.PI * 2)
    return setLook(el, Math.cos(a) * t * 0.25, Math.sin(a) * t * 0.2)
  }
  const glance = Math.random() < 0.3
  const r = glance ? rand(0.6, 0.95) : rand(0, 0.35)
  const a = rand(0, Math.PI * 2)
  setLook(el, Math.cos(a) * t * r, Math.sin(a) * t * r * 0.7)
}

function setLook(el, x, y, ms) {
  if (ms != null) el.style.setProperty('--axo-look', `${ms}ms`)
  el.style.setProperty('--axo-lx', `${x.toFixed(2)}px`)
  el.style.setProperty('--axo-ly', `${y.toFixed(2)}px`)
}

// How far a pupil may travel inside its eye, in viewBox units
function travel(el, s) {
  if (s.travel) return s.travel
  let t = 3
  try {
    // The pupil is clipped by its socket, so it may travel past the rim a little: scale with the eye's width
    const eye = el.querySelector('.axo-eye-white') || el.querySelector('.axo-pupil')
    if (eye) {
      const w = eye.getBBox().width
      if (w > 0) t = Math.max(1.5, Math.min(6, w * 0.17))
    }
  } catch {
    // getBBox throws while the svg is display:none; keep the default and measure again next time
    return t
  }
  s.travel = t
  return t
}

// Mood-dependent shapes. Axolotl.jsx hides the inactive ones with display="none" (or does not render them).
const VARIANTS = "[data-mood], [class^='axo-mouth-'], .axo-fx > *, .axo-brows, .axo-paw-up, .axo-paw-rest, .axo-eye-closed, .axo-halflid, .axo-shine-head, .axo-eye > g"

function visibleVariants(el) {
  const set = new Set()
  for (const n of el.querySelectorAll(VARIANTS)) {
    if (n.getAttribute('display') !== 'none' && !n.closest('[display="none"]:not(.axo)')) set.add(n)
  }
  return set
}

function onMood(el, s, from, to) {
  // Whatever the new mood shows fades + pops in (~200 ms); shapes that stay visible are left alone
  const now = visibleVariants(el)
  const before = s.variants || new Set()
  s.variants = now
  const rm = reduced()
  for (const n of now) {
    if (before.has(n)) continue
    const own = n.hasAttribute('transform') || rm
    if (!own) {
      n.style.transformBox = 'fill-box'
      // pop from the shape's own centre, paws from their bottom edge
      n.style.transformOrigin = n.matches('.axo-paw-up, .axo-paw-rest') ? '50% 100%' : '50% 50%'
    }
    n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: rm ? 120 : 160, easing: 'ease-out' })
    if (!own) {
      n.animate([{ transform: 'scale(0.6)' }, { transform: 'scale(1)' }], { duration: 220, easing: SPRING, composite: 'add' })
    }
  }
  if (to !== 'thinking' && from === 'thinking' && !s.lookHeld) setLook(el, 0, 0)
  if (rm) return
  // Small squash-and-stretch on every mood change
  run(el, 'mood', el.querySelector('.axo-body'), [
    { transform: 'scale(1, 1)' },
    { transform: 'scale(1.05, 0.94)', offset: 0.35 },
    { transform: 'scale(0.98, 1.03)', offset: 0.7 },
    { transform: 'scale(1, 1)' },
  ], { duration: 260, easing: SOFT })
  if (to !== 'sleepy' && from !== 'sleepy' && to !== 'happy' && to !== 'cheer' && Math.random() < 0.6) {
    setTimeout(() => blink(el), 120)
  }
  if (to === 'cheer' || to === 'happy') wiggle(el, { strength: to === 'cheer' ? 1 : 0.6 })
}

// ---------------------------------------------------------------------------------------------------------------
// Animation plumbing
// ---------------------------------------------------------------------------------------------------------------

// Runs one WAAPI animation per (instance, key, node), cancelling the previous one with the same key so rapid
// repeats restart instead of stacking. Transform effects are added on top of the CSS idle loops.
function run(el, key, node, frames, opts) {
  if (!node || typeof node.animate !== 'function') return done
  const s = state(el)
  const id = key
  let byNode = s.anims.get(id)
  if (!byNode) {
    byNode = new Map()
    s.anims.set(id, byNode)
  }
  const prev = byNode.get(node)
  if (prev) prev.cancel()
  const a = node.animate(frames, { composite: 'add', fill: 'none', ...opts })
  byNode.set(node, a)
  return a.finished.then(
    () => { if (byNode.get(node) === a) byNode.delete(node) },
    () => {},
  )
}

function all(el, key, nodes, frames, opts) {
  return Promise.all(Array.from(nodes, (n) => run(el, key, n, frames, opts)))
}

// ---------------------------------------------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------------------------------------------

/** Closes and opens both lids (~150 ms). `double: true` blinks twice. */
export async function blink(target, { double = false } = {}) {
  const el = resolve(target)
  if (!el || reduced()) return
  const s = state(el)
  if (s.blinking) return
  const lids = el.querySelectorAll('.axo-lid')
  if (!lids.length) return
  // Eyes already closed (^^ moods, giggle): nothing to blink
  const open = el.querySelector('.axo-pupil')
  if (el.hasAttribute('data-axo-giggle') || (open && open.closest('[display="none"]'))) return
  s.blinking = true
  try {
    for (let i = 0; i < (double ? 2 : 1); i++) {
      if (i) await wait(70)
      await Promise.all([
        all(el, 'blink', lids, [
          { transform: 'scaleY(0)', easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)' },
          { transform: 'scaleY(1)', offset: 0.38 },
          { transform: 'scaleY(1)', offset: 0.5, easing: OUT },
          { transform: 'scaleY(0)' },
        ], { duration: 160, composite: 'replace' }),
        all(el, 'blink-eye', el.querySelectorAll('.axo-eye'), [
          { transform: 'scale(1, 1)' },
          { transform: 'scale(1.03, 0.94)', offset: 0.45 },
          { transform: 'scale(1, 1)' },
        ], { duration: 160, easing: SOFT }),
      ])
    }
  } finally {
    s.blinking = false
  }
}

/** ^^ eyes for `ms` (default 600). Calling again while giggling extends it. */
export function giggle(target, ms = 600) {
  const el = resolve(target)
  if (!el) return done
  const s = state(el)
  if (!el.hasAttribute('data-axo-giggle')) {
    for (const eye of el.querySelectorAll('.axo-eye')) {
      const drawn = eye.querySelector('.axo-eye-closed')
      if (drawn) {
        // The art has its own ^^ eye (possibly inside a hidden mood group): unhide it and its wrappers
        for (let n = drawn; n && n !== eye; n = n.parentElement) n.setAttribute('data-axo-show', '')
        if (!reduced()) drawn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, easing: 'ease-out' })
        continue
      }
      const ref = eye.querySelector('.axo-eye-white') || eye.querySelector('.axo-pupil') || eye
      let b
      try {
        b = ref.getBBox()
      } catch {
        continue
      }
      if (!b.width) continue
      const w = Math.max(b.width, b.height)
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      const path = document.createElementNS(SVG_NS, 'path')
      path.setAttribute('class', 'axo-giggle')
      path.setAttribute('aria-hidden', 'true')
      path.setAttribute('stroke-width', (w * 0.13).toFixed(2))
      path.setAttribute('d', `M${cx - w * 0.34} ${cy + w * 0.1} Q${cx} ${cy - w * 0.42} ${cx + w * 0.34} ${cy + w * 0.1}`)
      eye.appendChild(path)
      if (!reduced()) path.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 90, easing: 'ease-out' })
    }
    el.setAttribute('data-axo-giggle', '')
  }
  clearTimeout(s.giggleTimer)
  return new Promise((resolveDone) => {
    s.giggleTimer = setTimeout(() => {
      el.removeAttribute('data-axo-giggle')
      for (const p of el.querySelectorAll('.axo-giggle')) p.remove()
      for (const n of el.querySelectorAll('[data-axo-show]')) n.removeAttribute('data-axo-show')
      resolveDone()
    }, ms)
  })
}

/**
 * Celebration jump: anticipation squash, stretch up, squash on landing.
 *  - whole body (layout full): the creature jumps, an object beside it takes the landing
 *  - peeking over an object (edge): creature and object jump together, the object a beat behind
 *  - peeking over nothing (peek): a short pop, the neck stretches so the head never floats free of the edge
 */
export function hop(target, { height = 1 } = {}) {
  const el = resolve(target)
  if (!el || reduced()) return done
  const layout = el.getAttribute('data-layout')
  const prop = el.querySelector('.axo-prop')
  const hasProp = !!(prop && prop.childElementCount)
  const mode = layout === 'full' ? 'full' : hasProp ? 'edge' : 'peek'
  const up = { full: 40, edge: 30, peek: 9 }[mode] * height
  const dur = mode === 'peek' ? 560 : 680
  const offsets = [0, 0.14, 0.4, 0.52, 0.74, 0.87, 1]
  const lift = [0, -1, up * 0.9, up, 0, 0, 0]
  const squash = ['1, 1', '1.1, 0.88', '0.93, 1.09', '1, 1', '1.14, 0.86', '0.96, 1.04', '1, 1']
  const eases = [OUT, OUT, OUT, IN, OUT, SOFT]
  const track = (fn) => offsets.map((offset, i) => ({ transform: fn(i), offset, ...(eases[i] ? { easing: eases[i] } : {}) }))
  const jobs = [run(el, 'hop', el.querySelector('.axo-body'), track((i) => `translate(0px, ${-lift[i]}px) scale(${squash[i]})`), { duration: dur })]

  if (mode === 'peek') {
    const neck = el.querySelector('.axo-neck')
    if (neck) {
      let h = 10
      try {
        h = neck.getBBox().height || h
      } catch {
        // not rendered: keep the drawn neck height
      }
      neck.style.transformBox = 'fill-box'
      neck.style.transformOrigin = '50% 0%'
      jobs.push(run(el, 'hop', neck, track((i) => `scale(1, ${1 + Math.max(0, lift[i]) / h})`), { duration: dur }))
    }
  } else if (mode === 'edge') {
    // A rigid object: it rides along without squashing, then settles with a small wobble
    const ride = [0, 0, up * 0.86, up, 0, 0, 0]
    const tilt = [0, 0, -2, -1, 1.5, -0.5, 0]
    jobs.push(run(el, 'hop', prop, track((i) => `translate(0px, ${-ride[i]}px) rotate(${tilt[i]}deg)`), { duration: dur, delay: 30 }))
  } else if (hasProp) {
    jobs.push(run(el, 'hop', prop, [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.03, 0.95)', offset: 0.35 },
      { transform: 'scale(0.995, 1.01)', offset: 0.7 },
      { transform: 'scale(1, 1)' },
    ], { duration: 260, delay: dur * 0.72, easing: SOFT }))
  }
  setTimeout(() => wiggle(el, { strength: 0.9 }), dur * 0.12)
  setTimeout(() => giggle(el, dur * 0.62), dur * 0.16)
  return Promise.all(jobs).then(() => {})
}

/** Gills burst: every stalk flicks and settles, staggered outward. */
export function wiggle(target, { strength = 1 } = {}) {
  const el = resolve(target)
  if (!el || reduced()) return done
  const gills = el.querySelectorAll('.axo-gill')
  return Promise.all(Array.from(gills, (g) => {
    const dir = g.closest('.axo-gills-l') ? -1 : 1
    const i = parseFloat(getComputedStyle(g).getPropertyValue('--i')) || 0
    const k = dir * strength
    return run(el, 'wiggle', g, [
      { transform: 'rotate(0deg)' },
      { transform: `rotate(${-15 * k}deg)`, offset: 0.18 },
      { transform: `rotate(${10 * k}deg)`, offset: 0.4 },
      { transform: `rotate(${-6 * k}deg)`, offset: 0.62 },
      { transform: `rotate(${2.5 * k}deg)`, offset: 0.82 },
      { transform: 'rotate(0deg)' },
    ], { duration: 720, delay: i * 40, easing: SOFT })
  })).then(() => {})
}

/** Tap reaction: squish, ^^ eyes for 600 ms, blush up, a little gill flick. */
export function boop(target) {
  const el = resolve(target)
  if (!el) return done
  const eyes = giggle(el, 600)
  if (reduced()) return eyes
  const body = el.querySelector('.axo-body')
  const jobs = [
    eyes,
    run(el, 'boop', body, [
      { transform: 'scale(1, 1)', easing: OUT },
      { transform: 'scale(1.12, 0.85)', offset: 0.2, easing: SOFT },
      { transform: 'scale(0.95, 1.06)', offset: 0.5, easing: SOFT },
      { transform: 'scale(1.02, 0.985)', offset: 0.75, easing: SOFT },
      { transform: 'scale(1, 1)' },
    ], { duration: 440 }),
    all(el, 'boop', headParts(el), [
      { transform: 'translate(0px, 0px)' },
      { transform: 'translate(0px, 3px)', offset: 0.2 },
      { transform: 'translate(0px, -1px)', offset: 0.55 },
      { transform: 'translate(0px, 0px)' },
    ], { duration: 440, easing: SOFT }),
    wiggle(el, { strength: 0.55 }),
  ]
  const blush = el.querySelector('.axo-blush')
  if (blush) {
    jobs.push(run(el, 'boop-blush', blush, [
      { opacity: 1, offset: 0.15 },
      { opacity: 1, offset: 0.8 },
    ], { duration: 700, composite: 'replace', easing: 'ease' }))
  }
  return Promise.all(jobs).then(() => {})
}

// The gills grow out of the head, so anything that moves the head moves them with it (same pivot, see axolotl.css)
function headParts(el) {
  return [el.querySelector('.axo-head'), el.querySelector('.axo-gills-l'), el.querySelector('.axo-gills-r')].filter(Boolean)
}

/** Small "yes": the head dips twice. */
export function nod(target) {
  const el = resolve(target)
  if (!el || reduced()) return done
  return all(el, 'head', headParts(el), [
    { transform: 'translate(0px, 0px) scale(1, 1)' },
    { transform: 'translate(0px, 5px) scale(1.01, 0.97)', offset: 0.25 },
    { transform: 'translate(0px, -1px) scale(1, 1)', offset: 0.5 },
    { transform: 'translate(0px, 3.5px) scale(1.005, 0.98)', offset: 0.72 },
    { transform: 'translate(0px, 0px) scale(1, 1)' },
  ], { duration: 620, easing: SOFT }).then(() => {})
}

/** Gentle "no": the head sways side to side, eyes closed for a beat. */
export function shake(target) {
  const el = resolve(target)
  if (!el || reduced()) return done
  setTimeout(() => blink(el), 60)
  return Promise.all([
    all(el, 'head', headParts(el), [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(-7deg)', offset: 0.18 },
      { transform: 'rotate(6deg)', offset: 0.42 },
      { transform: 'rotate(-4deg)', offset: 0.64 },
      { transform: 'rotate(1.5deg)', offset: 0.84 },
      { transform: 'rotate(0deg)' },
    ], { duration: 680, easing: SOFT }),
    wiggle(el, { strength: 0.4 }),
  ]).then(() => {})
}

/**
 * Pupils follow a point. `x, y` are viewport (client) coordinates, or pass an Element as `x` to look at its centre.
 * The gaze holds for `hold` ms (default 2500, Infinity = until `lookAt(el)` is called with no point).
 */
export function lookAt(target, x, y, { hold = 2500 } = {}) {
  const el = resolve(target)
  if (!el) return done
  const s = state(el)
  clearTimeout(s.lookTimer)
  const ms = reduced() ? 0 : 260
  if (x == null) {
    s.lookHeld = false
    setLook(el, 0, 0, ms)
    return done
  }
  let px = x
  let py = y
  if (x instanceof Element) {
    const r = x.getBoundingClientRect()
    px = r.left + r.width / 2
    py = r.top + r.height / 2
  }
  if (!Number.isFinite(px) || !Number.isFinite(py)) return done
  const eyes = el.querySelectorAll('.axo-eye')
  let box = el.getBoundingClientRect()
  if (eyes.length) {
    const a = eyes[0].getBoundingClientRect()
    const b = eyes[eyes.length - 1].getBoundingClientRect()
    box = { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), width: 0, height: 0 }
    box.width = Math.max(a.right, b.right) - box.left
    box.height = Math.max(a.bottom, b.bottom) - box.top
  }
  const cx = box.left + box.width / 2
  const cy = box.top + box.height / 2
  const dx = px - cx
  const dy = py - cy
  const d = Math.hypot(dx, dy)
  const t = travel(el, s)
  // Full deflection once the point is a bit more than the eyes' span away
  const k = d < 1 ? 0 : Math.min(1, d / Math.max(24, box.width * 1.4))
  s.lookHeld = true
  setLook(el, d ? (dx / d) * t * k : 0, d ? (dy / d) * t * k * 0.8 : 0, ms)
  if (Number.isFinite(hold)) {
    s.lookTimer = setTimeout(() => {
      s.lookHeld = false
      setLook(el, 0, 0, 420)
    }, hold)
  }
  return done
}

function peekDistance(el) {
  const vb = el.viewBox && el.viewBox.baseVal
  return (vb && vb.height ? vb.height : 200) * 1.04
}

function peekGroups(el) {
  return [el.querySelector('.axo-body'), el.querySelector('.axo-prop')].filter(Boolean)
}

// Clips the svg at its own bottom edge only, so the creature can rise from behind it and still overflow upward
const PEEK_CLIP = 'polygon(-200% -200%, 300% -200%, 300% 100%, -200% 100%)'

function clearPeek(el, s) {
  for (const a of s.peek) a.cancel()
  s.peek = []
}

/** Rises from behind the bottom edge with a little overshoot, then flicks its gills. */
export function peekIn(target) {
  const el = resolve(target)
  if (!el) return done
  const s = state(el)
  clearPeek(el, s)
  if (reduced()) {
    el.style.clipPath = ''
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: 'linear' })
    return a.finished.then(() => {}, () => {})
  }
  const d = peekDistance(el)
  el.style.clipPath = PEEK_CLIP
  const anims = peekGroups(el).map((g) => g.animate([
    { transform: `translate(0px, ${d}px)`, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
    { transform: 'translate(0px, -7px)', offset: 0.62, easing: SOFT },
    { transform: 'translate(0px, 2px)', offset: 0.82, easing: SOFT },
    { transform: 'translate(0px, 0px)' },
  ], { duration: 620, composite: 'add' }))
  s.peek = anims
  setTimeout(() => { if (s.peek === anims) wiggle(el, { strength: 0.8 }) }, 380)
  setTimeout(() => { if (s.peek === anims) blink(el) }, 640)
  return Promise.all(anims.map((a) => a.finished)).then(
    () => {
      if (s.peek !== anims) return
      el.style.clipPath = ''
      s.peek = []
    },
    () => {},
  )
}

/** Sinks behind the bottom edge and stays hidden until peekIn(). `instant: true` hides it without motion. */
export function peekOut(target, { instant = false } = {}) {
  const el = resolve(target)
  if (!el) return done
  const s = state(el)
  clearPeek(el, s)
  if (reduced()) {
    const a = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: instant ? 0 : 140, fill: 'forwards' })
    s.peek = [a]
    return a.finished.then(() => {}, () => {})
  }
  const d = peekDistance(el)
  el.style.clipPath = PEEK_CLIP
  const frames = instant
    ? [{ transform: `translate(0px, ${d}px)` }, { transform: `translate(0px, ${d}px)` }]
    : [
        { transform: 'translate(0px, 0px)', easing: SOFT },
        { transform: 'translate(0px, -6px)', offset: 0.25, easing: IN },
        { transform: `translate(0px, ${d}px)` },
      ]
  const anims = peekGroups(el).map((g) => g.animate(frames, {
    duration: instant ? 0 : 380, composite: 'add', fill: 'forwards',
  }))
  s.peek = anims
  return Promise.all(anims.map((a) => a.finished)).then(() => {}, () => {})
}

/** The badge number flips from `from` to `to`, the badge pops and a small sparkle burst goes off. */
export function streakBump(target, from, to) {
  const el = resolve(target)
  if (!el) return done
  const num = el.querySelector('.axo-badge-num')
  if (!num) return done
  const s = state(el)
  for (const n of s.bump) n.remove()
  s.bump = []
  const next = String(to)
  // Update the text node React owns in place (never replace it), so React's own update later lands on the same node
  const text = Array.from(num.childNodes).find((n) => n.nodeType === 3)
  if (text) {
    if (text.nodeValue !== next) text.nodeValue = next
  } else if (num.textContent !== next) {
    num.textContent = next
  }

  if (reduced()) {
    const a = num.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 })
    return a.finished.then(() => {}, () => {})
  }

  let h = 10
  try {
    h = num.getBBox().height || h
  } catch {
    // svg not rendered (display:none): flip with the default distance
  }
  const ghost = num.cloneNode(true)
  ghost.removeAttribute('id')
  ghost.setAttribute('class', 'axo-badge-ghost')
  ghost.setAttribute('aria-hidden', 'true')
  ghost.textContent = String(from)
  num.parentNode.insertBefore(ghost, num.nextSibling)
  s.bump.push(ghost)

  const jobs = [
    // Rolls like a drum: the old number squashes up and away, the new one unrolls from below, all inside the badge
    ghost.animate([
      { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1 },
      { transform: `translate(0px, ${-h * 0.5}px) scale(1, 0)`, opacity: 0.2 },
    ], { duration: 200, easing: IN, fill: 'forwards' }).finished.catch(() => {}),
    run(el, 'bump-num', num, [
      { transform: `translate(0px, ${h * 0.5}px) scale(1, 0)`, opacity: 0.2 },
      { transform: `translate(0px, ${-h * 0.06}px) scale(1, 1.08)`, opacity: 1, offset: 0.6 },
      { transform: 'translate(0px, 0px) scale(1, 1)', opacity: 1 },
    ], { duration: 340, delay: 150, easing: OUT, composite: 'replace', fill: 'backwards' }),
  ]
  const badge = el.querySelector('.axo-badge')
  if (badge) {
    // A big sign the creature peeks over pops gently; a small corner badge pops hard
    let wide = false
    try {
      wide = badge.getBBox().width > 100
    } catch {
      // not rendered: treat it as small
    }
    const k = wide ? 0.35 : 1
    const sc = (v) => 1 + (v - 1) * k
    jobs.push(run(el, 'bump-badge', badge, [
      { transform: 'scale(1, 1) rotate(0deg)' },
      { transform: `scale(${sc(1.24)}, ${sc(1.24)}) rotate(${-5 * k}deg)`, offset: 0.32 },
      { transform: `scale(${sc(0.95)}, ${sc(0.95)}) rotate(${3 * k}deg)`, offset: 0.6 },
      { transform: `scale(${sc(1.02)}, ${sc(1.02)}) rotate(${-1 * k}deg)`, offset: 0.8 },
      { transform: 'scale(1, 1) rotate(0deg)' },
    ], { duration: 460, delay: 40, easing: SOFT }))
    if (wide) {
      // the creature holding it reacts too
      setTimeout(() => wiggle(el, { strength: 0.7 }), 80)
      setTimeout(() => giggle(el, 520), 60)
    }
    jobs.push(sparkle(el, s, badge))
    const flame = badge.querySelector('.axo-flame')
    if (flame) {
      jobs.push(run(el, 'bump-flame', flame, [
        { transform: 'scale(1, 1)' },
        { transform: 'scale(1.25, 1.4)', offset: 0.3 },
        { transform: 'scale(0.95, 0.92)', offset: 0.62 },
        { transform: 'scale(1, 1)' },
      ], { duration: 520, delay: 40, easing: SOFT }))
    }
  }
  return Promise.all(jobs).then(() => {
    ghost.remove()
    s.bump = s.bump.filter((n) => n !== ghost)
  })
}

function sparkle(el, s, around) {
  let b
  try {
    b = around.getBBox()
  } catch {
    return done
  }
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class', 'axo-sparkles')
  g.setAttribute('aria-hidden', 'true')
  g.setAttribute('pointer-events', 'none')
  const tf = around.getAttribute('transform')
  if (tf) g.setAttribute('transform', tf)
  around.parentNode.appendChild(g)
  s.bump.push(g)
  const cx = b.x + b.width / 2
  const cy = b.y + b.height / 2
  // Burst from just outside the badge's edge, a fixed short distance, whatever the badge size
  const span = Math.max(b.width, b.height)
  const ex = b.width / 2 + 2
  const ey = b.height / 2 + 2
  const reach = Math.max(12, Math.min(26, span * 0.35))
  const size = Math.max(4, Math.min(8, span * 0.12))
  const n = SPARKLE_COLORS.length
  const offset = rand(0, Math.PI * 2)
  const jobs = SPARKLE_COLORS.map((color, i) => {
    const a = offset + (i / n) * Math.PI * 2 + rand(-0.2, 0.2)
    const p = document.createElementNS(SVG_NS, 'path')
    const k = (i % 2 ? 0.7 : 1) * size
    // four-point star centred on 0,0
    p.setAttribute('d', `M0 ${-k}Q${k * 0.18} ${-k * 0.18} ${k} 0Q${k * 0.18} ${k * 0.18} 0 ${k}Q${-k * 0.18} ${k * 0.18} ${-k} 0Q${-k * 0.18} ${-k * 0.18} 0 ${-k}Z`)
    p.setAttribute('fill', color)
    p.style.transformBox = 'view-box'
    p.style.transformOrigin = '0 0'
    g.appendChild(p)
    const x0 = cx + Math.cos(a) * ex
    const y0 = cy + Math.sin(a) * ey
    const r = reach * rand(0.8, 1.15)
    const x1 = x0 + Math.cos(a) * r
    const y1 = y0 + Math.sin(a) * r
    return p.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(0.2) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${x0 + (x1 - x0) * 0.7}px, ${y0 + (y1 - y0) * 0.7}px) scale(1.1) rotate(40deg)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${x1}px, ${y1 + 4}px) scale(0) rotate(90deg)`, opacity: 0 },
    ], { duration: rand(560, 680), delay: 90 + rand(0, 60), easing: OUT, fill: 'both' }).finished.catch(() => {})
  })
  return Promise.all(jobs).then(() => {
    g.remove()
    s.bump = s.bump.filter((n2) => n2 !== g)
  })
}

// ---------------------------------------------------------------------------------------------------------------
// Auto-attach: axolotl.css gives .axo-head a 1 ms `axo-born` animation, so every svg.axo announces itself the moment
// it renders (and again if it is re-shown after display:none). Nothing to wire up in components.
// ---------------------------------------------------------------------------------------------------------------

if (hasDOM && !window.__axoMotion) {
  window.__axoMotion = true
  document.addEventListener('animationstart', (e) => {
    if (e.animationName !== 'axo-born') return
    const svg = e.target instanceof Element && e.target.closest('svg.axo')
    if (svg) attach(svg)
  }, true)
  document.addEventListener('visibilitychange', () => {
    for (const el of attached) {
      const s = states.get(el)
      if (s) sync(el, s)
    }
  })
  if (reducedQuery) {
    const onChange = () => {
      for (const el of attached) {
        const s = states.get(el)
        if (s) sync(el, s)
      }
    }
    if (reducedQuery.addEventListener) reducedQuery.addEventListener('change', onChange)
    else if (reducedQuery.addListener) reducedQuery.addListener(onChange)
  }
  const scan = () => document.querySelectorAll('svg.axo').forEach((el) => attach(el))
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan, { once: true })
  else scan()
}
