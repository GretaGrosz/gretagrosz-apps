// More eyes items (made for the store, which is gone). Like every outfit, you pick one when you finish a project.
// Same contract as ./README.md.
// Most are drawn level on the eye line around (0, 0) and then tilted onto it with EYELINE: the eyes sit at
// (-35, 0) and (35, 0) there. Anything pick-eyes.css moves is a plain <g> with a class and no transform attribute.
import './pick-eyes.css'

const O = '#4A1A0E'
const EYELINE = 'translate(103.5 79.75) rotate(-8.65)'
const I = { stroke: O, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' }
const T = { ...I, strokeWidth: 1.6 }

// An ellipse as a path (for evenodd holes)
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`
// A four-point sparkle centred on (0, 0)
const spark = (r) => `M0 ${-r}L${r * 0.26} ${-r * 0.26}L${r} 0L${r * 0.26} ${r * 0.26}L0 ${r}L${-r * 0.26} ${r * 0.26}L${-r} 0L${-r * 0.26} ${-r * 0.26}Z`
// A twinkling sparkle: the outer <g> places it, the inner one is what the css scales
const Twinkle = ({ x, y, r, i = 0, fill = '#FFFFFF', cls }) => (
  <g transform={`translate(${x} ${y})`}>
    <g className={cls} style={{ '--i': i }}>
      <path d={spark(r)} fill={fill} stroke={O} strokeWidth={1} strokeLinejoin="round" />
    </g>
  </g>
)
// A chunky rim: ink first, then the colour on top, so it reads as an outlined tube
const Rim = ({ d, c, w = 3.6 }) => (
  <>
    <path d={d} fill="none" stroke={O} strokeWidth={w + 3} strokeLinejoin="round" strokeLinecap="round" />
    <path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
  </>
)

// ---------- 1. heart shades: pink heart lenses, a bit of sparkle ----------
const HEART = 'M0 14C-6 9.5-21 2-21-7C-21-13.5-16-17-11-17C-5.8-17-2-14 0-10C2-14 5.8-17 11-17C16-17 21-13.5 21-7C21 2 6 9.5 0 14Z'
const heartAt = (x) => `translate(${x} 1.5)`

const heartshades = (
  <>
    <g transform={EYELINE}>
      {/* arms disappearing round the head */}
      <Rim d="M-55-6.5C-58-6-60.5-4.5-62-2M55-6.5C58-6.5 60-5.5 61-4" c="#EE5C8E" w={3} />
      <Rim d="M-14-7C-8-12 8-12 14-7" c="#EE5C8E" w={3.2} />
      {[-35, 35].map((x) => (
        <g key={x} transform={heartAt(x)}>
          <path d={HEART} fill="#FF7FA8" fillOpacity={0.3} />
          <Rim d={HEART} c="#EE5C8E" w={3.8} />
          <path d="M-17-9C-16.5-12.5-13.5-14.3-10.5-14.3" fill="none" stroke="#FFC4D7" strokeWidth={1.4} strokeLinecap="round" />
          <path d="M-9 4L1-10.5M-3.5 5.5L1.5-1.5" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" opacity={0.75} />
        </g>
      ))}
      {/* tiny hinge rivets */}
      <circle cx={-53.5} cy={-8} r={1.6} fill="#FFE07A" stroke={O} strokeWidth={1} />
      <circle cx={53.5} cy={-8} r={1.6} fill="#FFE07A" stroke={O} strokeWidth={1} />
    </g>
    {/* love is in the pond */}
    <g transform="translate(160 54)">
      <g className="hs-float">
        <path d={HEART} transform="scale(0.32)" fill="#FF8FB1" stroke={O} strokeWidth={4.4} strokeLinejoin="round" />
        <circle cx={-3} cy={-3.2} r={1.1} fill="#FFFFFF" />
      </g>
    </g>
    <Twinkle x={52} y={62} r={5.2} i={0} cls="hs-twinkle" fill="#FFF3B0" />
    <Twinkle x={152} y={95} r={4} i={1} cls="hs-twinkle" />
    <Twinkle x={118} y={58} r={3.4} i={2} cls="hs-twinkle" fill="#FFF3B0" />
  </>
)

// ---------- 2. 3D cinema specs: cardboard frame, red & cyan lenses, a fish that swims out of the screen ----------
const CARD = 'M-60-13Q-60-19-54-19H54Q60-19 60-13V11Q60 17 54 17H15Q9 17 6.5 11.5Q3.5 5 0 5Q-3.5 5-6.5 11.5Q-9 17-15 17H-54Q-60 17-60 11Z'
const lens = (cx) => `M${cx - 21} -9Q${cx - 21} -14 ${cx - 16} -14H${cx + 16}Q${cx + 21} -14 ${cx + 21} -9V7Q${cx + 21} 12 ${cx + 16} 12H${cx - 16}Q${cx - 21} 12 ${cx - 21} 7Z`
const FISH = 'M-8 0C-5-5.5 3-6 7.5-1.5L12-5.5C13-2 13 2 12 5.5L7.5 1.5C3 6-5 5.5-8 0Z'

const cinema3d = (
  <>
    <g transform={EYELINE}>
      <path d="M-60-8C-63-7-64.5-5.5-65.5-3M60-8C62.5-8 64-7 65-5.5" fill="none" stroke={O} strokeWidth={6} strokeLinecap="round" />
      <path d="M-60-8C-63-7-64.5-5.5-65.5-3M60-8C62.5-8 64-7 65-5.5" fill="none" stroke="#FFFDF5" strokeWidth={3} strokeLinecap="round" />
      <path d={CARD + lens(-34) + lens(34)} fill="#FFFDF5" fillRule="evenodd" {...I} strokeWidth={2.4} />
      <path d={lens(-34)} fill="#F2545B" fillOpacity={0.42} {...I} />
      <path d={lens(34)} fill="#3FC7E8" fillOpacity={0.42} {...I} />
      {/* cardboard stripes */}
      <path d="M-56-16.5H-20M20-16.5H56" stroke="#E7DFC9" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M-50 14.5H-20M20 14.5H50" stroke="#E7DFC9" strokeWidth={1.4} strokeLinecap="round" />
      {/* "3D" stamped on the bridge */}
      <g transform="translate(0 -6.5) scale(0.62)" fill="none" stroke={O} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M-8.5-5.5C-6.5-8-2.5-7.5-2.5-4.5C-2.5-2-5-1.2-6-1.2C-4.5-1.2-2-0.5-2 2.3C-2 6-7 6.5-9 4" />
        <path d="M2-7.5V5.5C9 6 10.5 2.5 10.5-1C10.5-5 8.5-7.8 2-7.5Z" />
      </g>
      <path d="M-50-9.5L-44.5-9.5M18-9.5L22.5-9.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
      <path d="M-30 6L-22-9M-25 7L-21-0.5M38 6L46-9M43 7L47-0.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
    </g>
    {/* the fish leaps out of the movie */}
    <g transform="translate(163 44) rotate(-14) scale(1.35)">
      <g className="c3-fish">
        <path d={FISH} transform="translate(-2.4 0)" fill="#F2545B" opacity={0.55} />
        <path d={FISH} transform="translate(2.4 0)" fill="#3FC7E8" opacity={0.55} />
        <path d={FISH} fill="#F7A33F" {...T} />
        <path d="M2.5-3.5C3.5-1.5 3.5 1.5 2.5 3.5" fill="none" stroke={O} strokeWidth={1.1} strokeLinecap="round" />
        <circle cx={-4} cy={-1.2} r={1.2} fill={O} />
        <path d="M-5-3.2C-3-4.6 0-4.8 2-4" fill="none" stroke="#FFD9A3" strokeWidth={1.1} strokeLinecap="round" />
      </g>
    </g>
    <Twinkle x={180} y={31} r={3.4} i={0} cls="c3-twinkle" fill="#FFF3B0" />
  </>
)

// ---------- 3. cucumber spa: two cool slices, totally relaxed ----------
const Slice = ({ x, y, r, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <circle r={r} fill="#4E9A3F" {...I} strokeWidth={2.4} />
    <circle r={r - 3} fill="#D6EFA6" />
    <circle r={r - 3} fill="none" stroke="#A8D27A" strokeWidth={1.2} />
    <circle r={r * 0.42} fill="#EAF7C4" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <ellipse key={a} cx={0} cy={-r * 0.42} rx={1.5} ry={2.6} transform={`rotate(${a})`} fill="#FDFFF0" stroke="#9CC46A" strokeWidth={0.9} />
    ))}
    <path d={`M${-r * 0.78} ${-r * 0.2}A${r * 0.8} ${r * 0.8} 0 0 1 ${-r * 0.2} ${-r * 0.78}`} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
  </g>
)

const cucumberspa = (
  <>
    <g className="cu-slice cu-slice-l"><Slice x={68.5} y={84.5} r={16} rot={-20} /></g>
    <g className="cu-slice cu-slice-r"><Slice x={138.5} y={73.5} r={15.5} rot={15} /></g>
    {/* a cool drop running down */}
    <g className="cu-drop">
      <path d="M57 97C59 99.8 60.3 101.6 60.3 103.4C60.3 105.3 58.8 106.6 57 106.6C55.2 106.6 53.7 105.3 53.7 103.4C53.7 101.6 55 99.8 57 97Z" fill="#BFE3F2" {...T} strokeWidth={1.3} />
      <ellipse cx={56} cy={103.4} rx={0.9} ry={1.4} fill="#FFFFFF" />
    </g>
    <Twinkle x={103} y={62} r={4.4} i={0} cls="cu-twinkle" fill="#E4F7C4" />
    <Twinkle x={160} y={60} r={3.4} i={1} cls="cu-twinkle" />
    <Twinkle x={47} y={72} r={3.2} i={2} cls="cu-twinkle" fill="#E4F7C4" />
  </>
)

// ---------- 4. shell patch: a pirate's scallop eye patch that lifts for a peek ----------
const SHELL = 'M-3 13L-18-2Q-21-6-18.5-10Q-16.5-15-11-15.5Q-8-19.5-3-18.5Q0-21.5 3-18.5Q8-19.5 11-15.5Q16.5-15 18.5-10Q21-6 18-2L3 13Z'
const STRAP = 'M124 66C104 57 78 58 53 71'

const shellpatch = (
  <>
    <path d={STRAP} fill="none" stroke={O} strokeWidth={6.6} strokeLinecap="round" />
    <path d={STRAP} fill="none" stroke="#6E3B22" strokeWidth={3.6} strokeLinecap="round" />
    <path d="M110 60.5C96 57 82 58 70 62" fill="none" stroke="#9A5E3C" strokeWidth={1.1} strokeLinecap="round" />
    <path d="M152 70C155 70.5 156.5 71.5 157.5 73.5" fill="none" stroke={O} strokeWidth={6.6} strokeLinecap="round" />
    <path d="M152 70C155 70.5 156.5 71.5 157.5 73.5" fill="none" stroke="#6E3B22" strokeWidth={3.6} strokeLinecap="round" />
    <g className="sp-lift">
      <g transform="translate(138.5 77.5) rotate(-12) scale(1.3)">
        <path d="M-7.5 9.5L7.5 9.5L6.5 17Q0 18.5-6.5 17Z" fill="#E98A68" {...T} />
        <path d={SHELL} fill="#F6A483" {...I} />
        <path d="M0 11.5L-15.5-7.5M0 11.5L-8.5-14.5M0 11.5V-17M0 11.5L8.5-14.5M0 11.5L15.5-7.5" fill="none" stroke="#D6714F" strokeWidth={1.5} strokeLinecap="round" />
        <path d="M-15.5-10.5Q-13.5-13.5-10-13.5" fill="none" stroke="#FFD9C7" strokeWidth={1.6} strokeLinecap="round" />
        <circle cx={0} cy={13.6} r={2.6} fill="#FFF6EE" stroke={O} strokeWidth={1.1} />
        <circle cx={-0.8} cy={12.8} r={0.8} fill="#FFFFFF" />
      </g>
    </g>
    <Twinkle x={124} y={56} r={4.6} i={0} cls="sp-glint" />
  </>
)

// ---------- 5. hero mask: a painted domino mask with ribbons flapping in the current ----------
const MASK = 'M0-9C12-13 24-19 40-19C52-19 59-17 64-21C65-9 61 6 54 13C47 19.5 32 20.5 22 15.5C14 11.5 8 8.5 0 8.5C-8 8.5-14 11.5-22 15.5C-32 20.5-47 19.5-54 13C-61 6-65-9-64-21C-59-17-52-19-40-19C-24-19-12-13 0-9Z'
const HOLES = ell(-35, 0.5, 15.5, 12.5) + ell(35, 0.5, 15, 12.5)
const TAIL1 = 'M47 85C40 89 36 95 28 97C31 100 36 101 40 99C44 97 46 92 48.5 89'
const TAIL2 = 'M48 88C45 95 44 103 38 109C42 110.5 46 109 48.5 106C51 102.5 51 96 50.5 91'

const heromask = (
  <>
    {/* knot at the back */}
    <circle cx={45} cy={88} r={3.4} fill="#E5483F" {...T} />
    <g className="hm-tail hm-tail-1"><path d={TAIL1} fill="#C7362F" {...I} /></g>
    <g className="hm-tail hm-tail-2"><path d={TAIL2} fill="#C7362F" {...I} /></g>
    <g transform={EYELINE}>
      <path d={MASK + HOLES} fill="#E5483F" fillRule="evenodd" {...I} strokeWidth={2.4} />
      <path d={HOLES} fill="none" stroke="#A82A24" strokeWidth={1.4} opacity={0.6} />
      <path d="M-58-14C-52-12.5-46-14-38-14.5C-28-14.5-20-11.5-14-9.5" fill="none" stroke="#FF9A8A" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M58-14C54-13 50-13.5 46-14" fill="none" stroke="#FF9A8A" strokeWidth={1.6} strokeLinecap="round" />
      {/* the painted bolt on the bridge */}
      <path d="M1.5-8.5L-4.5-0.5H-0.5L-2.5 5.5L4-2.5H0Z" fill="#F7C948" {...T} strokeWidth={1.2} />
      {/* paint flecks */}
      <circle cx={-56} cy={4} r={1.5} fill="#F7C948" />
      <circle cx={-53} cy={9} r={1} fill="#FFFFFF" opacity={0.85} />
      <circle cx={57} cy={0} r={1.4} fill="#FFFFFF" opacity={0.85} />
    </g>
    <Twinkle x={164} y={52} r={4.4} i={0} cls="hm-glint" fill="#FFF3B0" />
  </>
)

export const PICK_EYES = [
  { id: 'heartshades', name: 'Heart shades', slot: 'eyes', hobby: 'photo', box: '42 50 126 50', axo: heartshades },
  { id: 'cinema3d', name: '3D cinema specs', slot: 'eyes', hobby: 'tech', box: '36 26 150 66', axo: cinema3d },
  { id: 'cucumberspa', name: 'Cucumber spa', slot: 'eyes', hobby: 'other', box: '44 55 120 54', axo: cucumberspa },
  { id: 'shellpatch', name: 'Shell eye patch', slot: 'eyes', hobby: 'outdoors', box: '50 48 112 50', axo: shellpatch },
  { id: 'heromask', name: 'Hero mask', slot: 'eyes', hobby: 'art', box: '28 44 144 66', axo: heromask },
]
