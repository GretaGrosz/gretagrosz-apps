// Glasses & face things for the axolotl: drawn in its 200x200 box over the eyes (see README.md for the geometry).
// Idle motion lives in eyes.css, keyed on the class names below.
import './eyes.css'

const OUT = '#4A1A0E'

// ---------- snorkel mask ----------
// Drawn level around the middle of the eye line, then tilted onto it (the eyes sit on a -8.65° line).
const MASK_OUT = 'M-57-7C-57-20-44-23-32-22C-12-20.5 12-20.5 32-22C44-23 57-20 57-7V3C57 14 47 18.5 37 17.5C26 16.5 19 11 12 8.5Q0 4.5-12 8.5C-19 11-26 16.5-37 17.5C-47 18.5-57 14-57 3Z'
const MASK_GLASS = 'M-51.5-6C-51.5-15-42-17.5-32-16.8C-12-15.4 12-15.4 32-16.8C42-17.5 51.5-15 51.5-6V2.5C51.5 10 45 13 37.5 12.2C28 11.3 21.5 6.8 13.5 3.8Q0-0.8-13.5 3.8C-21.5 6.8-28 11.3-37.5 12.2C-45 13-51.5 10-51.5 2.5Z'
const TUBE = 'M66 103C56 106.5 46 104 43.5 96C42 90 41.5 70 40.5 32'

const snorkel = (
  <>
    {/* the strap disappears round the back of the head */}
    <path d="M49 92.5C46 89 45 83 47.5 78.5M156.5 67C158.5 72 158 77 155.5 80" fill="none" stroke={OUT} strokeWidth="7.5" strokeLinecap="round" />
    <path d="M49 92.5C46 89 45 83 47.5 78.5M156.5 67C158.5 72 158 77 155.5 80" fill="none" stroke="#2F8C8A" strokeWidth="4.2" strokeLinecap="round" />

    {/* the snorkel: pointless, it's an axolotl */}
    <path d={TUBE} fill="none" stroke={OUT} strokeWidth="10" strokeLinecap="round" />
    <path d={TUBE} fill="none" stroke="#F7C948" strokeWidth="6.4" strokeLinecap="round" />
    <path d="M41.2 88C40.5 75 40 60 39 44" fill="none" stroke="#FFF3C4" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
    <path d="M65.5 99.5C70.5 98.5 73 102 71.5 105.5C70 108.5 65.5 108 64 105.5" fill="#3FA7A3" stroke={OUT} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M37.8 40.2L43.6 39.9M37.6 46.2L43.4 45.9" stroke="#F0784A" strokeWidth="2.6" />
    <rect x="34.5" y="17" width="12" height="13" rx="4" fill="#F0784A" stroke={OUT} strokeWidth="2.2" />
    <path d="M37.5 21V26.5M41.5 21V26.5" stroke={OUT} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    {/* clip holding the tube to the strap */}
    <rect x="38" y="80" width="10" height="7" rx="2.5" fill="#3FA7A3" stroke={OUT} strokeWidth="2" />

    <g className="snk-bubbles">
      {[[41, 9, 4.4, 0], [35.5, 0, 3.2, 1], [43, -7, 3.7, 2]].map(([x, y, r, i]) => (
        <g key={i} className="snk-bub" style={{ '--i': i, '--dy': `${14 - y}px` }}>
          <circle cx={x} cy={y} r={r} fill="#D8F1F4" fillOpacity="0.55" stroke="#2F8C8A" strokeWidth="1.5" />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.32} fill="#FFFFFF" />
        </g>
      ))}
    </g>

    <g transform="translate(103.5 79.75) rotate(-8.65)">
      <path d={MASK_OUT + MASK_GLASS} fill="#3FA7A3" fillRule="evenodd" stroke={OUT} strokeWidth="2.4" strokeLinejoin="round" />
      <path d={MASK_GLASS} fill="#9EE3EE" fillOpacity="0.2" />
      <path d={MASK_GLASS} fill="none" stroke={OUT} strokeWidth="6.6" strokeLinejoin="round" />
      <path d={MASK_GLASS} fill="none" stroke="#F7C948" strokeWidth="3.6" strokeLinejoin="round" />
      <path d="M-46-12.5C-40-15-30-15.2-20-14.6" fill="none" stroke="#FFF3C4" strokeWidth="1.3" strokeLinecap="round" />
      {/* glare */}
      <path d="M-11-1.5L-3-13.5M-4.5-1.5L-0.5-7.5M-49 3L-45.5-3" fill="none" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" opacity="0.85" />
    </g>
  </>
)

// ---------- monocle & 'stache ----------
const STACHE = 'M0-3C3.5-6.5 10-6.5 14-3.4C15.6-2 16.6-0.4 18 0C14 4 6 5 1.5 2.6C-0.6 1.4-0.9-1.8 0-3Z'
const CURL = 'M15.5 0.4C20 1.5 23.5-1.5 22.8-5C22.2-8 18.4-8.6 17.4-6C16.8-4.4 18.2-3.2 19.4-3.8'

const half = (
  <>
    <path d={CURL} fill="none" stroke={OUT} strokeWidth="4.8" strokeLinecap="round" />
    <path d={STACHE} fill="#6E3B22" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
    <path d={CURL} fill="none" stroke="#6E3B22" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M2.5-2.3C5.5-4 9-4.2 11.5-2.8" fill="none" stroke="#9A5E3C" strokeWidth="1.3" strokeLinecap="round" />
  </>
)

const monocle = (
  <>
    {/* bead chain dangling off the rim */}
    <path d="M151.5 84C158 94 158 104 150 112" fill="none" stroke={OUT} strokeWidth="4.4" strokeLinecap="round" strokeDasharray="0.1 4.2" />
    <path d="M151.5 84C158 94 158 104 150 112" fill="none" stroke="#F2C14E" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 4.2" />

    <circle cx="138" cy="74.5" r="16.5" fill="#EAF6F7" fillOpacity="0.16" />
    <circle cx="138" cy="74.5" r="16.5" fill="none" stroke={OUT} strokeWidth="6.6" />
    <circle cx="138" cy="74.5" r="16.5" fill="none" stroke="#E9B43A" strokeWidth="3.6" />
    <path d="M124.5 68.5A15 15 0 0 1 133 59" fill="none" stroke="#FBE39A" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M128 80L137 66.5M133 82.5L137.5 76" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
    <g className="mon-glint">
      <path d="M126 56.5L128 62.5L134 64.5L128 66.5L126 72.5L124 66.5L118 64.5L124 62.5Z" fill="#FFFFFF" stroke="#F2C14E" strokeWidth="0.8" strokeLinejoin="round" />
    </g>

    <g transform="translate(106 90.6) rotate(-9) scale(1.08)">
      <g className="mon-stache mon-stache-l">
        <g transform="scale(-1 1)">{half}</g>
      </g>
      <g className="mon-stache mon-stache-r">{half}</g>
    </g>
  </>
)

// ---------- pixel shades ----------
// '#' black, 'w' white highlight, '.' empty. Each cell is P px; the grid is centred on the middle of the eye line.
const P = 4
const GRID = [
  '##############################',
  '..##########################..',
  '..##ww#######......##ww#####..',
  '..#ww########......#ww######..',
  '..###########......#########..',
  '...#########........#######...',
  '....#######..........#####....',
]
const W0 = -(GRID[0].length * P) / 2
const H0 = -14
const cells = (ch) => {
  let d = ''
  GRID.forEach((row, r) => [...row].forEach((c, k) => {
    if (c === ch) d += `M${W0 + k * P} ${H0 + r * P}h${P}v${P}h${-P}z`
  }))
  return d
}
// The sweep: diagonal stripes of lens cells that light up one after another
const SWEEP = []
for (let s = 0; s < 34; s += 1) {
  let d = ''
  GRID.forEach((row, r) => [...row].forEach((c, k) => {
    if (r > 0 && c === '#' && k - (GRID.length - 1 - r) === s) d += `M${W0 + k * P} ${H0 + r * P}h${P}v${P}h${-P}z`
  }))
  if (d) SWEEP.push(d)
}

const pixel = (
  <g transform="translate(103.5 79.75) rotate(-8.65)">
    <path d={cells('#')} fill="#1A1210" />
    <path d={cells('w')} fill="#FFFFFF" />
    <g className="pix-sweep">
      {SWEEP.map((d, i) => (
        <path key={i} className="pix-sweep-col" d={d} fill="#FFFFFF" opacity="0" style={{ '--i': i }} />
      ))}
    </g>
  </g>
)

export const EYES = [
  { id: 'snorkel', name: 'Snorkel mask', hobby: 'outdoors', slot: 'eyes', box: '28 -10 138 124', axo: snorkel },
  { id: 'monocle', name: "Monocle & 'stache", hobby: 'writing', slot: 'eyes', box: '82 52 80 64', axo: monocle },
  { id: 'pixel', name: 'Pixel shades', hobby: 'tech', slot: 'eyes', box: '40 50 128 60', axo: pixel },
]
