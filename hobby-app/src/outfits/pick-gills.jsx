// More gills items (made for the store, which is gone). Like every outfit, you pick one when you finish a project.
// Same contract as ./README.md.
// Drawn once per gill tip, centred on the tip at (0,0), everything drawn for r = 8 and wrapped in scale(r / 8).
import './pick-gills.css'

const INK = '#4A1A0E'

// Which way each gill points, outward from its stalk (degrees, 0 = right, -90 = up), top → bottom
const DIR = { l: [-92, -112, -152, 176], r: [-85, -62, -35, 36] }
const out = (side, i, d) => {
  const a = (DIR[side][i] * Math.PI) / 180
  return [(Math.cos(a) * d).toFixed(2), (Math.sin(a) * d).toFixed(2)]
}

const sized = (r, kids) => <g transform={`scale(${(r / 8).toFixed(3)})`}>{kids}</g>

const f2 = (n) => n.toFixed(2)
// smooth closed blob through points at radius rad(θ): quadratic curves through the midpoints
const blob = (n, rad) => {
  const p = Array.from({ length: n }, (_, j) => {
    const t = (j / n) * Math.PI * 2
    const r = rad(t)
    return [Math.cos(t) * r, Math.sin(t) * r]
  })
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${f2(mid(p[n - 1], p[0])[0])} ${f2(mid(p[n - 1], p[0])[1])}`
  for (let j = 0; j < n; j++) {
    const m = mid(p[j], p[(j + 1) % n])
    d += `Q${f2(p[j][0])} ${f2(p[j][1])} ${f2(m[0])} ${f2(m[1])}`
  }
  return d + 'Z'
}
const circ = (r, cx = 0, cy = 0) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`

/* ---------- yarn bobbles (knitting) ---------- */

const YARN = [
  { fill: '#FF8F86', dark: '#D2544C' }, // coral
  { fill: '#86D9E6', dark: '#3E9AAE' }, // teal
  { fill: '#FFD166', dark: '#D69A26' }, // mustard
  { fill: '#C9A8F7', dark: '#8A62CF' }, // lilac
]

function Yarn({ r, i, side }) {
  const c = YARN[(i + (side === 'r' ? 2 : 0)) % 4]
  const needles = (i + (side === 'r' ? 1 : 0)) % 3 === 0
  const [x, y] = out(side, i, 1.2)
  const m = side === 'r' ? 1 : -1
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      {/* loose end of the yarn, dangling */}
      <g transform={`translate(${2.6 * m} 7.2)`}>
        <g className="strand">
          <path d={`M0 0C${1.8 * m} 2.6 ${-1.2 * m} 4.6 ${0.6 * m} 7C${1.8 * m} 8.6 ${3.8 * m} 7.8 ${3.2 * m} 6.2`} fill="none" stroke={INK} strokeWidth="2.8" strokeLinecap="round" />
          <path d={`M0 0C${1.8 * m} 2.6 ${-1.2 * m} 4.6 ${0.6 * m} 7C${1.8 * m} 8.6 ${3.8 * m} 7.8 ${3.2 * m} 6.2`} fill="none" stroke={c.fill} strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
      <g className="ball">
        {needles && (
          <g transform={`rotate(${DIR[side][i] + 90})`}>
            {[
              [-3.6, 2, 5, -14.4],
              [3.6, 2, -5, -14.4],
            ].map(([x1, y1, x2, y2], k) => (
              <g key={k}>
                <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
                <path d={`M${x1} ${y1}L${x2} ${y2}`} stroke="#F2D29B" strokeWidth="1.9" strokeLinecap="round" />
                <circle cx={x2} cy={y2} r="2.3" fill="#FF86BA" stroke={INK} strokeWidth="1.3" />
              </g>
            ))}
          </g>
        )}
        <circle r="7.8" fill={c.fill} stroke={INK} strokeWidth="1.6" />
        <path
          d="M-6.6 -3.2C-2.6 -2.4 1.2 1.6 2.2 7.4M-4.4 -6C-0.4 -4.6 3.6 -0.8 5 5.2M-7.6 0.8C-4.6 1.6 -2 4.2 -1.4 7.6M-1 -7.6C2.6 -6.6 5.8 -4 7.2 -0.8"
          fill="none"
          stroke={c.dark}
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        <path d="M4.6 -6.2C3.2 -3.6 3.4 -1 5.2 1.6M6.6 -3.6C5.8 -2 6 -0.4 7 1" fill="none" stroke={c.dark} strokeWidth="1.1" strokeLinecap="round" />
        <ellipse cx="-3.8" cy="-4.4" rx="1.8" ry="1" transform="rotate(-40 -3.8 -4.4)" fill="#fff" opacity="0.9" />
      </g>
    </g>
  )
}

/* ---------- sprinkle donuts (baking) ---------- */

const ICING = [
  { fill: '#FFA3C8', shine: '#FFD6E7' }, // strawberry
  { fill: '#8E4E2E', shine: '#C08262' }, // chocolate
  { fill: '#A5E8CD', shine: '#DDF8EC' }, // mint
  { fill: '#FFE68F', shine: '#FFF6CF' }, // lemon
]
const SPRINKLE = ['#FF5C8A', '#4FC3F7', '#FFD447', '#7EDDB6', '#FFFFFF', '#B48CF2']
// [angle deg, radius, tilt deg]
const SPRINKLES = [
  [-150, 5.2, 30],
  [-95, 5.6, -40],
  [-40, 5, 70],
  [10, 5.4, -10],
  [60, 5.2, 40],
  [120, 5.4, -60],
  [175, 5, 10],
  [-70, 4.6, 100],
]
// the bite: scalloped edge between rim points at 10° and 58°
const BITE = (() => {
  const R = 9.2
  const p = (deg, rr) => [Math.cos((deg * Math.PI) / 180) * rr, Math.sin((deg * Math.PI) / 180) * rr].map(f2).join(' ')
  const edge = `M${p(6, R)}A2.3 2.3 0 0 0 ${p(33, 6)}A2.3 2.3 0 0 0 ${p(60, R)}`
  return { edge, cut: `${edge}L${p(62, 12)}L${p(32, 14)}L${p(4, 12)}Z` }
})()

function Donut({ r, i, side }) {
  const k = (i + (side === 'r' ? 1 : 0)) % 4
  const c = ICING[k]
  const bitten = side === 'r' && i === 1
  const [x, y] = out(side, i, 1)
  const ph = k * 1.3
  const icing = blob(40, (t) => 6.7 + 0.45 * Math.sin(6 * t + ph) + 1.5 * Math.exp(-((t - 1.9 - k * 0.3) ** 2) / 0.03))
  const mask = bitten ? 'url(#acc-sprinkledonut-bite)' : undefined
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      <g className="donut">
        {bitten && (
          <defs>
            <mask id="acc-sprinkledonut-bite" maskUnits="userSpaceOnUse" x="-20" y="-20" width="40" height="40">
              <rect x="-20" y="-20" width="40" height="40" fill="#fff" />
              <path d={BITE.cut} fill="#000" />
            </mask>
          </defs>
        )}
        <g mask={mask}>
          <path d={circ(8.9) + circ(2.4)} fillRule="evenodd" fill="#F2B866" stroke={INK} strokeWidth="1.6" />
          <path d={circ(2.4)} fill="none" stroke="#C9853A" strokeWidth="2.2" transform="scale(1.45)" />
          <path d={icing + circ(3.6)} fillRule="evenodd" fill={c.fill} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M-5.6 -1.6Q-4.8 -4.6 -1.8 -5.6" fill="none" stroke={c.shine} strokeWidth="1.5" strokeLinecap="round" />
          {SPRINKLES.map(([a, rr, tilt], j) => {
            const t = (a * Math.PI) / 180
            return (
              <rect
                key={j}
                x="-1.1"
                y="-0.45"
                width="2.2"
                height="0.9"
                rx="0.45"
                fill={SPRINKLE[(j + k * 2) % SPRINKLE.length]}
                transform={`translate(${f2(Math.cos(t) * rr)} ${f2(Math.sin(t) * rr)}) rotate(${tilt})`}
              />
            )
          })}
        </g>
        {bitten && <path d={BITE.edge} fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />}
      </g>
    </g>
  )
}

/* ---------- gill tunes (music) ---------- */

const NOTE = ['#FF86BA', '#6EC6FF', '#FFC93C', '#5FD3A0']

// one eighth note, head centred near (0,0), stem up
function Eighth({ fill, sw = 1 }) {
  return (
    <>
      <path d="M2.4 1L2.4 -11.6" stroke={INK} strokeWidth={4 * sw} strokeLinecap="round" />
      <path d="M2.4 -12C3.4 -8.4 8.6 -8.6 7.2 -2.8C6.6 -5.8 4.6 -7 2.4 -7.4Z" fill={fill} stroke={INK} strokeWidth={1.5 * sw} strokeLinejoin="round" />
      <ellipse cx="-1.2" cy="1.6" rx="4.1" ry="3.1" transform="rotate(-22 -1.2 1.6)" fill={fill} stroke={INK} strokeWidth={1.6 * sw} />
      <path d="M2.4 0L2.4 -11.4" stroke={fill} strokeWidth={1.7 * sw} strokeLinecap="round" />
      <ellipse cx="-2.4" cy="0.6" rx="1.4" ry="0.8" transform="rotate(-22 -2.4 0.6)" fill="#fff" opacity="0.9" />
    </>
  )
}

function Beamed({ fill }) {
  return (
    <>
      <path d="M-1.6 2L-1.6 -9.6M6.4 0.4L6.4 -11.4" stroke={INK} strokeWidth="3.8" strokeLinecap="round" />
      <path d="M-2.6 -8.4L-2.6 -11.6L7.4 -13.6L7.4 -10.4Z" fill={fill} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <ellipse cx="-4.6" cy="2.4" rx="3.6" ry="2.7" transform="rotate(-22 -4.6 2.4)" fill={fill} stroke={INK} strokeWidth="1.5" />
      <ellipse cx="3.4" cy="0.8" rx="3.6" ry="2.7" transform="rotate(-22 3.4 0.8)" fill={fill} stroke={INK} strokeWidth="1.5" />
      <path d="M-1.6 1L-1.6 -9.8M6.4 -0.6L6.4 -11.6" stroke={fill} strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="-5.6" cy="1.6" rx="1.2" ry="0.7" transform="rotate(-22 -5.6 1.6)" fill="#fff" opacity="0.9" />
      <ellipse cx="2.4" cy="0" rx="1.2" ry="0.7" transform="rotate(-22 2.4 0)" fill="#fff" opacity="0.9" />
    </>
  )
}

function Tune({ r, i, side }) {
  const k = (i + (side === 'r' ? 2 : 0)) % 4
  const v = (i + (side === 'r' ? 1 : 0)) % 2
  const fill = NOTE[k]
  const [x, y] = out(side, i, 1.4)
  const m = side === 'r' ? 1 : -1
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      {v === 0 && (
        <g transform={`translate(${5 * m} -6)`}>
          <g className="float">
            <g transform="scale(0.55)">
              <Eighth fill={NOTE[(k + 1) % 4]} sw={1.5} />
            </g>
          </g>
        </g>
      )}
      <g className="bop">
        <g transform={`scale(${v ? 0.95 : 1.05})`}>{v ? <Beamed fill={fill} /> : <Eighth fill={fill} />}</g>
      </g>
    </g>
  )
}

/* ---------- gill gems ---------- */

const GEM = [
  { fill: '#FF5C7F', light: '#FFB8C8', dark: '#C2234A' }, // ruby
  { fill: '#5B93FF', light: '#C2D8FF', dark: '#2551B8' }, // sapphire
  { fill: '#33CE92', light: '#B0F2D6', dark: '#178A5E' }, // emerald
  { fill: '#B479F2', light: '#E5CCFF', dark: '#7840B8' }, // amethyst
  { fill: '#FFB833', light: '#FFE6A8', dark: '#D17E0A' }, // topaz
]
const HEART = (s) =>
  `M0 ${6.6 * s}C${-4 * s} ${3.8 * s} ${-8 * s} ${0.6 * s} ${-7.6 * s} ${-3.2 * s}C${-7.2 * s} ${-6.8 * s} ${-3 * s} ${-7.8 * s} 0 ${-4.4 * s}C${3 * s} ${-7.8 * s} ${7.2 * s} ${-6.8 * s} ${7.6 * s} ${-3.2 * s}C${8 * s} ${0.6 * s} ${4 * s} ${3.8 * s} 0 ${6.6 * s}Z`
const OCT = (s) =>
  Array.from({ length: 8 }, (_, j) => {
    const t = ((j * 45 + 22.5) * Math.PI) / 180
    return `${j ? 'L' : 'M'}${f2(Math.cos(t) * s)} ${f2(Math.sin(t) * s)}`
  }).join('') + 'Z'
const octPt = (j, s) => {
  const t = ((j * 45 + 22.5) * Math.PI) / 180
  return [Math.cos(t) * s, Math.sin(t) * s]
}
const SPARK = 'M0 -3.6Q0.6 -0.6 3.6 0Q0.6 0.6 0 3.6Q-0.6 0.6 -3.6 0Q-0.6 -0.6 0 -3.6Z'

function Gem({ r, i, side }) {
  const c = GEM[(i * 2 + (side === 'r' ? 1 : 0)) % 5]
  const heart = (i + (side === 'r' ? 1 : 0)) % 2 === 0
  const [x, y] = out(side, i, 1.2)
  const m = side === 'r' ? 1 : -1
  let facets
  if (heart) {
    facets = (
      <>
        <path d="M0 6.6C4 3.8 8 0.6 7.6 -3.2C7.4 -5 6.2 -6.2 4.6 -6.6L1.6 -1.2Z" fill={c.dark} opacity="0.55" />
        <path d={HEART(0.45)} fill={c.light} />
        <path d="M0 -4.4L0 -2M-7.6 -3.2L-3.4 -1.4M7.6 -3.2L3.4 -1.4M0 6.6L0 3M-4.2 -7L-2 -3.2M4.2 -7L2 -3.2" stroke={c.dark} strokeWidth="0.8" strokeLinecap="round" />
      </>
    )
  } else {
    const o = (j) => octPt(j, 7).map(f2).join(' ')
    const n = (j) => octPt(j, 3.4).map(f2).join(' ')
    facets = (
      <>
        <path d={`M${o(7)}L${o(0)}L${o(1)}L${o(2)}L${n(2)}L${n(1)}L${n(0)}L${n(7)}Z`} fill={c.dark} opacity="0.55" />
        <path d={OCT(3.4)} fill={c.light} />
        <path d={[0, 1, 2, 3, 4, 5, 6, 7].map((j) => `M${o(j)}L${n(j)}`).join('')} stroke={c.dark} strokeWidth="0.8" strokeLinecap="round" />
      </>
    )
  }
  const shape = heart ? HEART(1) : OCT(7)
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      <g className="gem">
        <path d={heart ? HEART(1.24) : OCT(8.8)} fill="#FFD447" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        <path d={heart ? 'M-6.4 -6.8Q-3.6 -8.6 -1 -6.6' : 'M-6 -4.6Q-4.6 -6.8 -2.2 -7.6'} fill="none" stroke="#FFF4B8" strokeWidth="1.2" strokeLinecap="round" />
        <path d={shape} fill={c.fill} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        {facets}
        <path d={shape} fill="none" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
        <ellipse cx="-3.6" cy={heart ? -3.4 : -3.2} rx="1.6" ry="0.9" transform={`rotate(-40 -3.6 ${heart ? -3.4 : -3.2})`} fill="#fff" opacity="0.95" />
      </g>
      <g transform={`translate(${6.4 * m} -6.8)`}>
        <g className="spark">
          <path d={SPARK} fill="#FFFBE6" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  )
}

/* ---------- bubble helmets (pond) ---------- */

function Bubble({ r, i, side }) {
  const [x, y] = out(side, i, 1.2)
  const m = side === 'r' ? 1 : -1
  const tint = (i + (side === 'r' ? 1 : 0)) % 2 ? '#FFB3DA' : '#9FE3D0'
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      {/* little bubbles that wobble up and pop */}
      {[
        [3.6 * m, -8, 2.3, 'rise'],
        [-2.4 * m, -9, 1.6, 'rise rise-b'],
      ].map(([bx, by, br, cls], k) => (
        <g key={k} transform={`translate(${bx} ${by})`}>
          <g className={cls}>
            <circle r={br} fill="#E6F8FF" fillOpacity="0.6" stroke={INK} strokeWidth="1.1" />
            <circle cx={-br * 0.35} cy={-br * 0.35} r={br * 0.3} fill="#fff" />
          </g>
        </g>
      ))}
      <g className="wobble">
        <circle r="10.2" fill="#CDEFFF" fillOpacity="0.42" stroke={INK} strokeWidth="1.6" />
        <path d="M8.4 2.6A8.8 8.8 0 0 1 2.6 8.4" fill="none" stroke={tint} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M-7.4 -2.8A7.9 7.9 0 0 1 -2.8 -7.4" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="-7.6" cy="0.8" r="0.9" fill="#fff" />
      </g>
    </g>
  )
}

export const PICK_GILLS = [
  { id: 'yarnbobbles', name: 'Yarn bobbles', slot: 'gills', hobby: 'crafts', tip: (t) => <Yarn {...t} /> },
  { id: 'sprinkledonuts', name: 'Sprinkle donuts', slot: 'gills', hobby: 'cooking', tip: (t) => <Donut {...t} /> },
  { id: 'gilltunes', name: 'Gill tunes', slot: 'gills', hobby: 'music', tip: (t) => <Tune {...t} /> },
  { id: 'gillgems', name: 'Gill gems', slot: 'gills', hobby: 'art', tip: (t) => <Gem {...t} /> },
  { id: 'bubblehelmets', name: 'Bubble helmets', slot: 'gills', hobby: 'tech', tip: (t) => <Bubble {...t} /> },
]
