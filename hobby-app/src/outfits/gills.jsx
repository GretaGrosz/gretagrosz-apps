// Gill bling: drawn once per gill tip, centred on the tip at (0,0) and scaled with its radius.
// Everything is drawn for r = 8 and wrapped in scale(r / 8), so tiny axolotls get chunkier lines for free.
import './gills.css'

const INK = '#4A1A0E'

// Which way each gill points, outward from its stalk (degrees, 0 = right, -90 = up), top → bottom
const DIR = { l: [-92, -112, -152, 176], r: [-85, -62, -35, 36] }
const out = (side, i, d) => {
  const a = (DIR[side][i] * Math.PI) / 180
  return [(Math.cos(a) * d).toFixed(2), (Math.sin(a) * d).toFixed(2)]
}

const sized = (r, kids) => <g transform={`scale(${(r / 8).toFixed(3)})`}>{kids}</g>

// rotate the [x, y] pairs of a tiny path template ('M', [x, y], 'C', [x, y] …) by deg
const rot = (pts, deg) => {
  const a = (deg * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return pts.map((p) => (typeof p === 'string' ? p : `${(p[0] * c - p[1] * s).toFixed(2)} ${(p[0] * s + p[1] * c).toFixed(2)}`)).join(' ')
}

/* ---------- gill bows ---------- */

const RIBBON = [
  { fill: '#FF86BA', dark: '#D24C86', dots: true }, // pink, polka dots
  { fill: '#BE97F7', dark: '#8558CC' }, // lilac
  { fill: '#7EDDB6', dark: '#2F9C70' }, // mint
]
const dot = (x, y) => `M${x - 0.75} ${y}a0.75 0.75 0 1 0 1.5 0a0.75 0.75 0 1 0 -1.5 0`

function Bow({ r, i, side }) {
  const c = RIBBON[(i + (side === 'r' ? 1 : 0)) % 3]
  const [x, y] = out(side, i, -6.8)
  // tied round the "neck" where the stalk meets the tip: loops across the stalk, tails trailing back down it
  return sized(
    r,
    <g transform={`translate(${x} ${y}) rotate(${DIR[side][i] + 90}) scale(1.12)`}>
      <g className="bow">
        <path d="M-1 0.8L-5 8.6L-2.9 7.6L-2 9.4L1 1.6Z M1 0.8L5 8.6L2.9 7.6L2 9.4L-1 1.6Z" fill={c.dark} stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
        <path
          d="M0 0C2.2 -6 9.6 -8.2 10.8 -3.6C11.8 0.6 6.4 3.8 0 0Z M0 0C-2.2 -6 -9.6 -8.2 -10.8 -3.6C-11.8 0.6 -6.4 3.8 0 0Z"
          fill={c.fill}
          stroke={INK}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {c.dots && <path d={dot(7.6, -1.2) + dot(4.4, -3.6) + dot(-7.2, -3.2) + dot(-5, -0.4)} fill="#fff" />}
        <path d="M2.6 -1.1Q5.6 -2.2 7.8 -0.9M-2.6 -1.1Q-5.6 -2.2 -7.8 -0.9" fill="none" stroke={c.dark} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M4.2 -4.6Q6.6 -6.2 8.8 -5" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="-2.3" y="-2.9" width="4.6" height="5.4" rx="2" fill={c.fill} stroke={INK} strokeWidth="1.5" />
      </g>
    </g>
  )
}

/* ---------- gill blossoms ---------- */

const SAKURA = ['M', [0, 0], 'C', [-4.6, -1.8], [-6, -7], [-2.9, -9.2], 'Q', [-1.4, -10], [0, -8.1], 'Q', [1.4, -10], [2.9, -9.2], 'C', [6, -7], [4.6, -1.8], [0, 0], 'Z']
const DAISY = ['M', [0, 0], 'C', [-3.8, -2], [-4.2, -9.4], [0, -9.8], 'C', [4.2, -9.4], [3.8, -2], [0, 0], 'Z']
const VEIN = ['M', [0, -3.4], 'L', [0, -6]]
const ring = (petal, turn) => [0, 1, 2, 3, 4].map((k) => rot(petal, k * 72 + turn)).join(' ')

const FLOWERS = [
  { petal: SAKURA, fill: '#FFDCE8', blush: '#FF9DBE', vein: '#F07FA6' }, // cherry blossom
  { petal: DAISY, fill: '#FFFFFF', blush: null, vein: '#E9D8C8' }, // daisy
]

function Blossom({ r, i, side }) {
  const v = (i + (side === 'r' ? 1 : 0)) % 2
  const f = FLOWERS[v]
  const turn = v ? 36 : (i * 17) % 72
  const [x, y] = out(side, i, 1.6)
  // only every other tip sheds a petal, which keeps it a gentle trickle
  const drift = v === 0
  return sized(
    r,
    <g transform={`translate(${x} ${y})`}>
      {drift && (
        <g className="petal">
          <path d={rot(SAKURA, 150)} transform="translate(2 -1) scale(0.55)" fill={f.fill} stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        </g>
      )}
      <g className="bloom">
        <path d={ring(f.petal, turn)} fill={f.fill} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        {f.blush && <circle r="4" fill={f.blush} opacity="0.7" />}
        <path d={ring(VEIN, turn)} fill="none" stroke={f.vein} strokeWidth="1" strokeLinecap="round" />
        <ellipse cx="-3.4" cy="-5.6" rx="1.7" ry="1" transform="rotate(-40 -3.4 -5.6)" fill="#fff" opacity="0.95" />
        <circle r="2.7" fill="#FFD447" stroke={INK} strokeWidth="1.4" />
        <circle cx="-0.8" cy="-0.9" r="0.8" fill="#FFF4B8" />
      </g>
    </g>
  )
}

/* ---------- fairy lights ---------- */

const BULBS = [
  { dim: '#D98A2E', lit: '#FFD84E', glow: '#FFC53D' }, // gold
  { dim: '#D24E72', lit: '#FF94B2', glow: '#FF7FA0' }, // rose
  { dim: '#DB6A30', lit: '#FFA666', glow: '#FF9450' }, // tangerine
  { dim: '#D6B06A', lit: '#FFF1B8', glow: '#FFE48A' }, // warm white
]
// hanging from its cap at (0,0), glass pointing down
const GLASS = 'M-2.8 3C-6.1 5.9 -5.4 12.3 0 16.2C5.4 12.3 6.1 5.9 2.8 3Z'

function Bulb({ r, i, side }) {
  const k = (i + (side === 'r' ? 2 : 0)) % 4
  const c = BULBS[k]
  const glow = `acc-fairy-glow-${k}`
  const m = side === 'r' ? -1 : 1
  // clipped under the outer edge of the tip, dangling a little outward like an ornament
  return sized(
    r,
    <g transform={`translate(${-3.6 * m} 5.9) rotate(${(12 + i * 3) * m}) scale(1.1)`}>
      <g className="swing">
        <defs>
          <radialGradient id={glow}>
            <stop offset="0" stopColor={c.glow} stopOpacity="1" />
            <stop offset="0.45" stopColor={c.glow} stopOpacity="0.55" />
            <stop offset="1" stopColor={c.glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <g transform="translate(0 10)">
          <g className="halo">
            <circle r="15" fill={`url(#${glow})`} />
          </g>
        </g>
        <path d={GLASS} fill={c.dim} />
        <g className="lit">
          <path d={GLASS} fill={c.lit} />
          <ellipse cx="0" cy="10" rx="2" ry="3" fill="#fff" opacity="0.9" />
        </g>
        <path d={GLASS} fill="none" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M-2.9 6Q-3.8 8.8 -2.4 11.4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
        <rect x="-3.4" y="-1.6" width="6.8" height="5.2" rx="1.4" fill="#5E8C4E" stroke={INK} strokeWidth="1.5" />
        <path d="M-2.4 1H2.4" stroke="#3B6230" strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  )
}

export const GILLS = [
  { id: 'gillbows', name: 'Gill bows', hobby: 'crafts', slot: 'gills', tip: (t) => <Bow {...t} /> },
  { id: 'blossoms', name: 'Gill blossoms', hobby: 'garden', slot: 'gills', tip: (t) => <Blossom {...t} /> },
  { id: 'fairylights', name: 'Fairy lights', hobby: 'crafts', slot: 'gills', tip: (t) => <Bulb {...t} /> },
]
