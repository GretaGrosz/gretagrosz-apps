// The very first thing a new person sees: Blank's idea in under three seconds.
// An empty card (you, no hobby yet). The axolotl pops up over its edge and flips through hobbies (camera, guitar,
// bread, book: any of them), then drops onto the edge happy, and the blank card bursts into Blank's colour with a
// glow, a ring and a spray of the axolotl's own sparks, and the wordmark stamps in. Then onDone(), exactly once.
// Tap, click, Enter or Space skips straight to onDone(). Reduced motion: the final pose fades in, onDone after 1.2 s.
// Fills its container's width, 360px tall on a phone and up to 450px on a big screen. Not fixed.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Axolotl, wiggle } from '../axolotl'
import './WelcomeIntro.css'

// Beats, in ms from mount (the CSS keyframe delays in WelcomeIntro.css match these)
const HOBBIES = [
  ['camera', 0], // rises with it, 260–700
  ['guitar', 720],
  ['bread', 920],
  ['book', 1120],
]
const LAND_MS = 1340 // the props go, it drops onto the edge, happy
const TOTAL_MS = 2650
const REDUCED_MS = 1200

const AXO = 190 // axolotl size in px (viewBox 200)
const K = AXO / 200
const PEEK_DROP = 38 * K // the peek pose sits 38 viewBox units lower than the over-an-object pose (Axolotl.jsx)
const OUT = 'cubic-bezier(0.22, 1, 0.36, 1)'
const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

// The app's own spark shape (Axolotl.jsx), as a little standalone star
const SPARK = 'M0-10L2.6-2.6L10 0L2.6 2.6L0 10L-2.6 2.6L-10 0L-2.6-2.6Z'
const GOLD = '#F2B544'
const CORAL = '#F08F7E'
// Spray: from behind the card outward, all around, a few bigger ones
const SPRAY = Array.from({ length: 12 }, (_, i) => {
  const a = ((i / 12) * 360 + (i % 2 ? 9 : -6) - 90) * (Math.PI / 180)
  const d = [196, 172, 206, 166, 200, 184][i % 6]
  const dy = Math.sin(a) * d
  return { dx: Math.cos(a) * d * 0.82, dy: dy > 0 ? dy * 0.8 : dy, s: [18, 11, 14, 9, 16, 12][i % 6], c: i % 3 === 1 ? CORAL : GOLD, r: (i % 2 ? 1 : -1) * (90 + i * 12), i }
})
// Three that stay in the picture
const RESTING = [
  { x: 26, y: 26, s: 18, c: GOLD },
  { x: 168, y: 22, s: 14, c: GOLD },
  { x: 146, y: 46, s: 8, c: CORAL },
]

const prefersReduced = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Spark({ size, color, className, style }) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" width={size * 1.2} height={size * 1.2} style={style} aria-hidden="true">
      <path d={SPARK} fill={color} stroke="#4A1A0E" strokeWidth={1.4} strokeLinejoin="round" />
    </svg>
  )
}

export default function WelcomeIntro({ onDone }) {
  const [reduced] = useState(prefersReduced)
  const [prop, setProp] = useState(reduced ? 'none' : 'camera')
  const [mood, setMood] = useState(reduced ? 'happy' : 'idle')
  const root = useRef(null)
  const inner = useRef(null)
  const fired = useRef(false)
  const timers = useRef([])
  const lastProp = useRef(prop)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  const clear = () => {
    for (const t of timers.current) clearTimeout(t)
    timers.current = []
  }
  const finish = () => {
    if (fired.current) return
    fired.current = true
    clear()
    doneRef.current?.()
  }

  useEffect(() => {
    if (fired.current) return undefined
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms))
    if (reduced) {
      // The global reduced-motion rule flattens CSS animations, so the fade is a WAAPI one
      root.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' })
      at(REDUCED_MS, finish)
    } else {
      for (const [p, ms] of HOBBIES) if (ms) at(ms, () => setProp(p))
      at(LAND_MS, () => {
        setProp('none')
        setMood('happy')
      })
      at(LAND_MS + 260, () => wiggle(inner, { strength: 1.1 }))
      at(TOTAL_MS, finish)
    }
    return clear
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Each new hobby pops up in front of it with a squash; at the end it drops onto the edge
  useLayoutEffect(() => {
    if (lastProp.current === prop || reduced) return
    lastProp.current = prop
    const box = inner.current
    const svg = box?.querySelector('svg.axo')
    if (!box?.animate || !svg) return
    if (prop === 'none') {
      box.animate(
        [
          { transform: `translateY(${-PEEK_DROP}px)`, easing: 'cubic-bezier(0.55, 0, 0.75, 0.2)' },
          { transform: 'translateY(3px) scale(1.06, 0.93)', offset: 0.42, easing: OUT },
          { transform: 'translateY(-4px) scale(0.98, 1.03)', offset: 0.7, easing: OUT },
          { transform: 'none' },
        ],
        { duration: 520 },
      )
      return
    }
    svg.querySelector('.axo-prop')?.animate(
      [
        { transform: 'translate(0px, 46px) scale(0.8)', opacity: 0.4 },
        { transform: 'translate(0px, -7px) scale(1.04)', opacity: 1, offset: 0.55 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 300, easing: OUT },
    )
    box.animate(
      [
        { transform: 'scale(1.05, 0.93)' },
        { transform: 'scale(0.98, 1.035)', offset: 0.45 },
        { transform: 'none' },
      ],
      { duration: 300, easing: OUT },
    )
  }, [prop, reduced])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      finish()
    }
  }

  return (
    <div ref={root} role="button" tabIndex={0} aria-label="Blank" onClick={finish} onKeyDown={onKeyDown} className={`wi${reduced ? ' wi-still' : ''}`}>
      <div className="wi-stage" aria-hidden="true">
        <div className="wi-glow" />
        <div className="wi-ring" />
        <div className="wi-ring wi-ring-2" />
        {SPRAY.map((p) => (
          <Spark
            key={p.i}
            className="wi-fly"
            size={p.s}
            color={p.c}
            style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--r': `${p.r}deg`, '--i': p.i, marginLeft: -p.s * 0.6, marginTop: -p.s * 0.6 }}
          />
        ))}
        <div className="wi-tilt">
          <div className="wi-card">
            <div className="wi-face" />
            <div className="wi-window">
              <div className="wi-fill" />
              {RESTING.map((p, i) => (
                <Spark key={i} className="wi-rest" size={p.s} color={p.c} style={{ left: p.x - p.s * 0.6, top: p.y - p.s * 0.6, '--i': i }} />
              ))}
              <div className="wi-axo">
                <div ref={inner} className="wi-axo-in">
                  <Axolotl size={AXO} prop={prop} mood={mood} peek />
                </div>
              </div>
            </div>
            <div className="wi-strip">
              <span className="wi-blankline" />
              <span className="wi-word">Blank</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
