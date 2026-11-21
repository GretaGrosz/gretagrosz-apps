// Hats: things from the axolotl's pond (and its hobbies) that end up sitting on its head.
// Most are drawn upright around (0, 0) and placed with at(): moved onto the crown, tilted with the head and scaled.
// pens(s) keeps the outlines the same weight as the axolotl's at that scale.
// Anything head.css moves is a plain <g> with a class and no transform attribute. Contract: ./README.md
import './head.css'

const O = '#4A1A0E'
const pens = (s = 1) => {
  const I = { stroke: O, strokeWidth: 2.2 / s, strokeLinejoin: 'round', strokeLinecap: 'round' }
  return { I, T: { ...I, strokeWidth: 1.6 / s }, H: { ...I, strokeWidth: 1.1 / s } }
}
const at = (x, y, r = -9, s = 1) => `translate(${x} ${y}) rotate(${r}) scale(${s})`

// A pointed petal standing on (0, 0), `l` long
const petal = (l) => `M0 0C${-l * 0.32} ${-l * 0.2} ${-l * 0.34} ${-l * 0.66} 0 ${-l}C${l * 0.34} ${-l * 0.66} ${l * 0.32} ${-l * 0.2} 0 0Z`
// A four-point sparkle centred on (0, 0)
const spark = (r) => `M0 ${-r}L${r * 0.26} ${-r * 0.26}L${r} 0L${r * 0.26} ${r * 0.26}L0 ${r}L${-r * 0.26} ${r * 0.26}L${-r} 0L${-r * 0.26} ${-r * 0.26}Z`
const Spark = ({ x, y, r, fill = '#FFFFFF' }) => <path d={spark(r)} transform={`translate(${x} ${y})`} fill={fill} stroke={O} strokeWidth={1} strokeLinejoin="round" />
const Blush = ({ x, y, rx = 3, ry = 1.8, fill = '#F29C9C' }) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} opacity={0.85} />

// A rubbery five-petal flower centred on (0, 0)
function Bloom({ r, fill, mid = '#F5CF5B' }) {
  const { T } = pens()
  return (
    <>
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={Math.sin((a * Math.PI) / 180) * r * 0.6} cy={-Math.cos((a * Math.PI) / 180) * r * 0.6} r={r * 0.5} fill={fill} {...T} />
      ))}
      <circle r={r * 0.36} fill={mid} {...T} />
      <circle cx={-r * 0.12} cy={-r * 0.12} r={r * 0.11} fill="#FFFFFF" opacity={0.8} />
    </>
  )
}

// ---------- 1. lily pad: a floppy pad with a water lily and a drop of pond ----------
const lilypad = (() => {
  const { I, T } = pens(1.08)
  const pad = 'M8.6 6.2A40 12.5 0 1 1 21.4 4.7L3-5Z'
  return (
    <g transform={at(103, 50, -9, 1.08)}>
      <path d={pad} transform="translate(0 3.6)" fill="#5E9A5A" {...I} />
      <path d={pad} fill="#86BF78" {...I} />
      <path d="M3-5L-27-11M3-5L-32 0M3-5L-9-15M3-5L19-14.5M3-5L32-7M3-5L-15 4.6" stroke="#A9D69A" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-31-10C-23-15.5-9-17.5 6-17.5" fill="none" stroke="#C6E8B6" strokeWidth={2.6} strokeLinecap="round" />
      <g className="hd-lily">
        <g transform="translate(-8 -4)">
          {[-64, -32, 0, 32, 64].map((a) => <path key={a} d={petal(19)} transform={`rotate(${a})`} fill="#EF8FAE" {...T} />)}
          <ellipse cy={-7} rx={6} ry={3.6} fill="#F5CF5B" {...T} />
          <path d="M-3-9.5V-12M0-10V-13M3-9.5V-12" stroke={O} strokeWidth={1.2} strokeLinecap="round" />
          {[-48, -16, 16, 48].map((a) => <path key={a} d={petal(15)} transform={`rotate(${a})`} fill="#FBC3D3" {...T} />)}
          <path d={petal(13)} transform="rotate(-98)" fill="#F7A9C1" {...T} />
          <path d={petal(13)} transform="rotate(98)" fill="#F7A9C1" {...T} />
          <path d="M-3.4-12.5C-2-8.4-2.2-4.8-2.6-2.4" fill="none" stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={1.5} strokeLinecap="round" />
        </g>
      </g>
      <path d="M22-14C24.8-10.2 26.6-8 26.6-5.4C26.6-2.8 24.6-1 22-1C19.4-1 17.4-2.8 17.4-5.4C17.4-8 19.2-10.2 22-14Z" fill="#BFE3F2" {...T} />
      <ellipse cx={20.4} cy={-5.4} rx={1.3} ry={2} fill="#FFFFFF" />
      <g className="hd-glint"><Spark x={28.5} y={-13} r={4.2} /></g>
    </g>
  )
})()

// ---------- 2. frog friend: smug, half-lidded, holding on ----------
const FROG = '#8CCB6A'
const FROG_LO = '#6FAE52'
const frog = (() => {
  const s = 1.32
  const { I, T } = pens(s)
  return (
    <g transform={at(105, 49, -8, s)}>
      {/* folded back legs, then the body */}
      <ellipse cx={-17} cy={0.5} rx={8} ry={6.5} fill={FROG_LO} {...I} />
      <ellipse cx={17} cy={0.5} rx={8} ry={6.5} fill={FROG_LO} {...I} />
      <path d="M-25.5 5.2L-22 4.2M-25 2.2L-22 2.8M25.5 5.2L22 4.2M25 2.2L22 2.8" stroke={O} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={-10.5} cy={-19} r={8} fill={FROG} {...I} />
      <circle cx={10.5} cy={-19} r={8} fill={FROG} {...I} />
      <path d="M-20 4C-23-7-17-17 0-17C17-17 23-7 20 4C13 8.5-13 8.5-20 4Z" fill={FROG} {...I} />
      <circle cx={-10.5} cy={-19} r={6.6} fill={FROG} />
      <circle cx={10.5} cy={-19} r={6.6} fill={FROG} />
      <path d="M-16.5-12C-14.6-15-10-16-6-16" fill="none" stroke="#B9E39A" strokeWidth={2} strokeLinecap="round" />
      {/* smug, half-lidded eyes; .hd-frog-lid closes them for a blink */}
      {[-10.5, 10.5].map((x) => (
        <g key={x}>
          <circle cx={x} cy={-19} r={5.2} fill="#FBF5EE" {...T} />
          <circle cx={x + (x < 0 ? 1.4 : -1.4)} cy={-17.2} r={2.9} fill={O} />
          <circle cx={x + (x < 0 ? 2.4 : -0.4)} cy={-18.3} r={0.9} fill="#FFFFFF" />
          <path d={`M${x - 6} -19.6A6 6 0 0 1 ${x + 6} -19.6L${x + 5.6} -18.6Q${x} -17.6 ${x - 5.6} -18.6Z`} fill={FROG} />
          <path d={`M${x - 5.3} -18.6Q${x} -17 ${x + 5.3} -18.6`} fill="none" {...T} />
          <g className="hd-frog-lid" opacity={0}>
            <circle cx={x} cy={-19} r={5.9} fill={FROG} />
            <path d={`M${x - 4.8} -16.4Q${x} -14.4 ${x + 4.8} -16.4`} fill="none" {...T} />
          </g>
        </g>
      ))}
      <g className="hd-frog-throat">
        <ellipse cx={0} cy={-1.2} rx={6.4} ry={3.4} fill="#E2F2B6" {...T} />
      </g>
      {/* the smirk: one corner up */}
      <path d="M-9-7.8Q-2-2.4 7.6-8.2" fill="none" {...I} />
      <path d="M7.6-8.2Q9.4-8.8 9.8-10.8" fill="none" {...T} />
      <Blush x={-14.2} y={-7.6} />
      <Blush x={14.6} y={-8.4} />
      {/* little hands gripping the axolotl */}
      <path d="M-15.5 5.6C-16.5 2-10.8 1-9.2 4.2C-8.6 6-9.8 7.8-12.2 7.8C-14.2 7.8-15.2 7-15.5 5.6Z" fill={FROG_LO} {...T} />
      <path d="M15.5 5.6C16.5 2 10.8 1 9.2 4.2C8.6 6 9.8 7.8 12.2 7.8C14.2 7.8 15.2 7 15.5 5.6Z" fill={FROG_LO} {...T} />
    </g>
  )
})()

// ---------- 3. party snail: rides along, brought its own hat ----------
const SNAIL = '#EBD5A8'
const snail = (() => {
  const s = 1.12
  const { I, T } = pens(s)
  const stalk = (cls, d, ex, ey) => (
    <g className={`hd-stalk ${cls}`}>
      <path d={d} fill="none" stroke={O} strokeWidth={4.8} strokeLinecap="round" />
      <path d={d} fill="none" stroke={SNAIL} strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={ex} cy={ey} r={3.3} fill={O} />
      <circle cx={ex - 1} cy={ey - 1} r={1.05} fill="#FFFFFF" />
    </g>
  )
  return (
    <g transform={at(106, 50, -7, s)}>
      {/* eye stalks first, so the head covers their roots */}
      {stalk('hd-stalk-l', 'M-30-22Q-32-30-36-36', -36.5, -37)}
      {stalk('hd-stalk-r', 'M-23-22Q-20-30-19-37', -18.8, -38.2)}
      <path d="M34 4C28-1 18-2 6-2H-12C-16-2-17-8-17-14C-17-21-21-25-27-25C-33-25-36-20-35.5-14C-35-7-33 1-37 5C-30 8.5 20 8.5 34 4Z" fill={SNAIL} {...I} />
      <path d="M-31-20.4C-29.4-22.6-26.6-23.2-24.4-22.6" fill="none" stroke="#FBF0D8" strokeWidth={2} strokeLinecap="round" />
      <path d="M-34.2-12.4Q-31.6-9-28.4-11.8" fill="none" {...T} />
      <Blush x={-25} y={-12.4} rx={2.6} ry={1.5} />
      <path d="M-28 3.6Q0 6.2 30 3" fill="none" stroke="#D3B07E" strokeWidth={1.4} strokeLinecap="round" />
      {/* shell */}
      <circle cx={11} cy={-16} r={16.5} fill="#E9A15E" {...I} />
      <path d="M-2-23C1.6-29 10-32 17.6-30" fill="none" stroke="#F5C68F" strokeWidth={2.8} strokeLinecap="round" />
      <path d="M11-15A2 2 0 0 1 15-15A4 4 0 0 1 7-15A6 6 0 0 1 19-15A8 8 0 0 1 3-15A10 10 0 0 1 23-15A11.5 11.5 0 0 1 0-15" fill="none" stroke={O} strokeWidth={1.8} strokeLinecap="round" />
      {/* its own tiny party hat */}
      <g transform="translate(-26.6 -24.6) rotate(-12)">
        <path d="M-7 0L0-18L7 0Q0 2.2-7 0Z" fill="#7CC4E8" />
        <path d="M-4.6-6L-2.4-11.8L1.8-8.6L-1.2-3.4ZM2.4-1L4.8-6.6L5.8-0.6Z" fill="#F5CF5B" />
        <path d="M-7 0L0-18L7 0Q0 2.2-7 0Z" fill="none" {...T} />
        <circle cy={-19} r={3} fill="#F08FB0" {...T} />
      </g>
    </g>
  )
})()

// ---------- 4. shell crown: scallops, a starfish with a face, pearls ----------
const shellcrown = (() => {
  const s = 1.1
  const { I, T } = pens(s)
  const scallop = (
    <>
      <path d="M-2.5 1L-10.5-12Q-11-18-5.5-19Q-3-21 0-20Q3-21 5.5-19Q11-18 10.5-12L2.5 1Z" fill="#FBE3C8" {...I} />
      <path d="M0 0L-7-15.5M0 0L-3.4-18.5M0 0V-19.5M0 0L3.4-18.5M0 0L7-15.5" stroke="#E7A98E" strokeWidth={1.4} strokeLinecap="round" />
      <path d="M-5 1.5L-4-2H4L5 1.5Z" fill="#F4C1A6" {...T} />
    </>
  )
  const turret = (flip) => (
    <>
      <path d="M-5 0C-6-6-3-12 0-16C3-12 6-6 5 0Q0 2-5 0Z" fill="#F4A88F" {...T} />
      <path d={flip ? 'M-4.6-6.6L4.4-4.6M-3-11L3-9.6' : 'M-4.4-4.6L4.6-6.6M-3-9.6L3-11'} stroke={O} strokeWidth={1.3} strokeLinecap="round" />
    </>
  )
  const pearl = (x, y, r) => (
    <g key={`${x} ${y}`}>
      <circle cx={x} cy={y} r={r} fill="#FBF5EE" {...T} />
      <circle cx={x - r * 0.32} cy={y - r * 0.34} r={r * 0.32} fill="#FFFFFF" />
    </g>
  )
  return (
    <g transform={at(104, 49, -8, s)}>
      <g transform="translate(-30 -1) rotate(-28)">{turret(false)}</g>
      <g transform="translate(31 -1) rotate(28)">{turret(true)}</g>
      <g transform="translate(-17 -2) rotate(-16)">{scallop}</g>
      <g transform="translate(18 -2) rotate(16)">{scallop}</g>
      <g transform="translate(0.5 -17)">
        <path
          d="M0-17C2.4-17 3.4-9.6 5.2-7.2C7-5 15-6 15.8-3.6C16.6-1.4 10 2.6 9.4 5.8C8.8 9 12.6 15.6 10.6 17C8.6 18.4 3 13 0 13C-3 13-8.6 18.4-10.6 17C-12.6 15.6-8.8 9-9.4 5.8C-10 2.6-16.6-1.4-15.8-3.6C-15-6-7-5-5.2-7.2C-3.4-9.6-2.4-17 0-17Z"
          fill="#F2955E"
          {...I}
        />
        <path d="M-2-12.6C-1.2-14.4 0-14.6 0.8-14.4" fill="none" stroke="#FBC497" strokeWidth={1.6} strokeLinecap="round" />
        {[[0, -9], [-10.5, -3], [10.5, -3], [-7, 11.5], [7, 11.5]].map(([x, y]) => <circle key={x + ' ' + y} cx={x} cy={y} r={1.1} fill="#FCD3A6" />)}
        <circle cx={-3.4} cy={0.6} r={1.8} fill={O} />
        <circle cx={3.4} cy={0.6} r={1.8} fill={O} />
        <circle cx={-3} cy={0} r={0.6} fill="#FFFFFF" />
        <circle cx={3.8} cy={0} r={0.6} fill="#FFFFFF" />
        <path d="M-2.4 4.2Q0 6.6 2.4 4.2" fill="none" {...T} />
        <Blush x={-6.6} y={3.6} rx={1.8} ry={1.1} fill="#EC6F64" />
        <Blush x={6.6} y={3.6} rx={1.8} ry={1.1} fill="#EC6F64" />
      </g>
      {/* the string of pearls holding it all together */}
      {[[-32, 4.5], [-24.5, 3], [-17, 2], [-9.5, 1.4], [-2, 1], [5.5, 1], [13, 1.4], [20.5, 2.2], [28, 3.6], [35, 5.6]].map(([x, y]) => pearl(x, y, 3.9))}
      {pearl(-19, -24, 3.2)}
      {pearl(20.5, -23.5, 3.2)}
      <g className="hd-twinkle"><Spark x={26} y={-29} r={4.6} /></g>
    </g>
  )
})()

// ---------- 5. jellyfish (the legendary one): glowing, translucent, delighted ----------
const JELLY = '#C3B0F6'
const tentacle = (d, key, w = 1) => (
  <g key={key}>
    <path d={d} fill="none" stroke={O} strokeWidth={5.6 * w} strokeLinecap="round" />
    <path d={d} fill="none" stroke="#D9CCFB" strokeWidth={3 * w} strokeLinecap="round" />
  </g>
)
const jelly = (() => {
  const { I, T } = pens()
  return (
    <g>
      <g className="hd-jelly-glow">
        <ellipse cx={104} cy={32} rx={50} ry={35} fill="#D9CCFF" opacity={0.3} />
        <ellipse cx={104} cy={32} rx={40} ry={28} fill="#E6DCFF" opacity={0.4} />
      </g>
      {/* tentacles drape down the sides of the head, outside the eyes */}
      <g className="hd-tent hd-tent-l">
        {tentacle('M74 49C66 52 70 58 62 61C55 64 59 70 53 74', 'a')}
        {tentacle('M80 51C75 55 79 59 74 63', 'b', 0.8)}
      </g>
      <g className="hd-tent hd-tent-r">
        {tentacle('M133 40C141 43 137 49 145 53C152 57 148 63 156 67', 'a')}
        {tentacle('M129 44C134 47 131 51 136 55', 'b', 0.8)}
      </g>
      <g transform={at(104, 47)}>
        {/* frilly mouth-arms under the bell */}
        <path d="M-8 1C-10 5-6 7-8 11M0 1C-2 5 2 8 0 12M8 1C6 5 10 7 8 11" fill="none" stroke={O} strokeWidth={4.4} strokeLinecap="round" />
        <path d="M-8 1C-10 5-6 7-8 11M0 1C-2 5 2 8 0 12M8 1C6 5 10 7 8 11" fill="none" stroke="#F3B6E2" strokeWidth={2} strokeLinecap="round" />
        <g className="hd-jelly-bell">
          <path
            d="M-34 0C-36-23-19-38 0-38C19-38 36-23 34 0Q29.8 4.6 25.5 0.6Q21.2 4.6 17 0.6Q12.8 4.6 8.5 0.6Q4.2 4.6 0 0.6Q-4.2 4.6-8.5 0.6Q-12.8 4.6-17 0.6Q-21.2 4.6-25.5 0.6Q-29.8 4.6-34 0Z"
            fill={JELLY}
            fillOpacity={0.92}
            {...I}
          />
          <path d="M-26-6C-27-22-15-32 0-32C15-32 27-22 26-6C16-3-16-3-26-6Z" fill="#DCD0FF" opacity={0.75} />
          <path d="M-23-18C-20-26-13-31-4-32" fill="none" stroke="#FFFFFF" strokeWidth={3.2} strokeLinecap="round" opacity={0.95} />
          <circle cx={19} cy={-27} r={1.8} fill="#FFFFFF" />
          <circle cx={-9.5} cy={-14} r={3.5} fill={O} />
          <circle cx={9.5} cy={-14} r={3.5} fill={O} />
          <circle cx={-10.6} cy={-15.5} r={1.3} fill="#FFFFFF" />
          <circle cx={8.4} cy={-15.5} r={1.3} fill="#FFFFFF" />
          <path d="M-4.4-9Q0-3 4.4-9Z" fill="#5A1C10" stroke="#5A1C10" strokeWidth={1.4} strokeLinejoin="round" />
          <path d="M-2-6.4Q0-7.6 2-6.4Q0-4.8-2-6.4Z" fill="#E8857A" />
          <Blush x={-17} y={-9.5} rx={3.8} ry={2.1} fill="#F49AC8" />
          <Blush x={17} y={-9.5} rx={3.8} ry={2.1} fill="#F49AC8" />
        </g>
      </g>
      <g className="hd-twinkle"><Spark x={63} y={28} r={4.2} fill="#FFF3B0" /></g>
      <g className="hd-twinkle hd-twinkle-2"><Spark x={147} y={20} r={3.4} fill="#FFF3B0" /></g>
    </g>
  )
})()

// ---------- 6. painter's beret: splattered, with a brush tucked in ----------
const painter = (() => {
  const s = 1.16
  const { I, T } = pens(s)
  const H = { stroke: O, strokeWidth: 1.1, strokeLinejoin: 'round' }
  return (
    <g transform={at(105, 48, -12, s)}>
      <g className="hd-brush">
        <path d="M-4 3L33-27" fill="none" stroke={O} strokeWidth={7} strokeLinecap="round" />
        <path d="M-4 3L33-27" fill="none" stroke="#E8A86A" strokeWidth={3.8} strokeLinecap="round" />
        <path d="M29.6-24.4L35.6-29.2" stroke={O} strokeWidth={7.6} strokeLinecap="round" />
        <path d="M29.6-24.4L35.6-29.2" stroke="#D5DAE2" strokeWidth={4.4} strokeLinecap="round" />
        <path d="M34.4-31.6C37.6-35.6 42-38 47-39C45.8-34.4 43.4-30 38.8-27Z" fill="#E5675A" {...T} />
        <path d="M43.4-34.4Q44.6-35.4 45.4-35.6" stroke="#F5A196" strokeWidth={1.4} strokeLinecap="round" />
      </g>
      <path d="M-36-1C-42-13-22-25 2-25C27-25 43-15 39-4C37 2.5 24 4.5 2 4.5C-20 4.5-34 3-36-1Z" fill="#5B74C4" {...I} />
      <path d="M-28 1.6C-14 6.2 18 6.6 32 1.6" fill="none" stroke="#3F5598" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M-28-12.5C-21-19-9-22 3-22" fill="none" stroke="#8098E0" strokeWidth={2.8} strokeLinecap="round" />
      <path d="M1-25C1-28.4 3.2-30.4 6-30.4" fill="none" {...I} strokeWidth={3 / s} />
      {/* paint splats, one still dripping off the edge */}
      <path d="M-14-14C-15-17.4-10.6-18.6-9.4-16.2C-7.2-18.4-3.6-16.4-5.2-13.8C-3-12.6-4-9-7-9.6C-8.2-6.8-12.4-8-11.8-10.8C-14.6-10.8-15.2-13.2-14-14Z" fill="#F5CF5B" {...H} />
      <circle cx={-17} cy={-7} r={1.6} fill="#F5CF5B" {...H} />
      <path d="M8-17C8-19.8 12-20.4 13.2-18.2C15.4-19.8 18.2-17.6 16.6-15.4C18.2-13.8 16-11 13.8-12.2C12.6-10 8.8-10.6 9.4-13.4C7-13.4 6.4-16.2 8-17Z" fill="#E5675A" {...H} />
      <circle cx={20} cy={-10} r={1.8} fill="#E5675A" {...H} />
      <path d="M22-4.6C23-6.8 26.4-6.8 27.4-5C29-6.2 31.2-4.4 30-2.8C30 -1 30.2 3.4 28.4 7.4C27.2 4 26.8 0.4 25.2-0.8C23-0.2 21.4-2.6 22-4.6Z" fill="#8CCB72" {...H} />
      <circle cx={-2} cy={-5} r={2.4} fill="#FBF5EE" {...H} />
      <circle cx={-24} cy={-4} r={1.4} fill="#8CCB72" {...H} />
    </g>
  )
})()

// ---------- 7. swim cap: a rubber flower cap (it lives in water), goggles pushed up ----------
// Drawn straight onto the head: the cap hugs the crown and stops just above the eyes.
const swimcap = (() => {
  const { I, T } = pens()
  const strap = 'M56 66C63 61 72 57.6 82 55.6M129 49.4C139 49 148 50.4 156 53.6'
  return (
    <g>
      <path d="M53 71C46.5 47 68 24 102 22.5C136 21 161 37 157 60C149 57.6 140 55.8 128 55.8C108 55.8 84 60 68 65.6C61 67.8 57 69.4 53 71Z" fill="#A6E0D5" {...I} />
      {/* embossed petals all over, the retro rubber kind */}
      <g fill="none" stroke="#7CC6B8" strokeWidth={1.7} strokeLinecap="round">
        <path d={[[62, 52], [74, 46], [134, 43], [146, 46], [68, 37], [80, 33], [92, 30], [104, 29], [116, 29], [128, 31], [140, 35], [96, 41], [110, 40], [86, 23.5], [98, 22], [110, 22], [122, 23.5]].map(([x, y]) => `M${x - 6} ${y + 2}Q${x} ${y - 6} ${x + 6} ${y + 2}`).join('')} />
      </g>
      <path d="M60 52C64 40 76 31 90 28" fill="none" stroke="#DDF5F0" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M57.6 67.4C66 63.2 86 58.8 104 57.6C120 56.6 138 56.6 154.6 58.6" fill="none" stroke="#6FB9AE" strokeWidth={3} strokeLinecap="round" />
      {/* goggles pushed up on the forehead */}
      <path d={strap} fill="none" stroke={O} strokeWidth={5.4} strokeLinecap="round" />
      <path d={strap} fill="none" stroke="#F08A6E" strokeWidth={2.8} strokeLinecap="round" />
      <path d="M101.6 51.6Q106 47.4 110.4 50.4" fill="none" stroke={O} strokeWidth={5} strokeLinecap="round" />
      <path d="M101.6 51.6Q106 47.4 110.4 50.4" fill="none" stroke="#F08A6E" strokeWidth={2.4} strokeLinecap="round" />
      {[[92, 52.4], [119.6, 48.2]].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y} rx={10.6} ry={8} transform={`rotate(-9 ${x} ${y})`} fill="#F08A6E" {...I} />
          <ellipse cx={x} cy={y} rx={7.2} ry={5} transform={`rotate(-9 ${x} ${y})`} fill="#A9DCF5" {...T} />
          <path d={`M${x - 4.6} ${y - 0.6}Q${x - 2.6} ${y - 3.4} ${x + 1} ${y - 3.6}`} fill="none" stroke="#FFFFFF" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      ))}
      {/* rubber flowers */}
      <g transform="translate(141 38)"><Bloom r={9} fill="#FBF5EE" /></g>
      <g transform="translate(112 28)"><Bloom r={7.6} fill="#F5CF5B" mid="#F08A6E" /></g>
      <g transform="translate(76 39)">
        <g className="hd-flower"><Bloom r={12} fill="#F7A8C0" /></g>
      </g>
    </g>
  )
})()

// ---------- 8. sourdough: a fresh scored loaf, still steaming, balanced up there ----------
const loaf = (() => {
  const s = 1.2
  const { I } = pens(s)
  return (
    <g>
      <g className="hd-steam" fill="none" stroke="#B88E78" strokeWidth={2.4} strokeLinecap="round">
        <path d="M83 12C80 8 86 5 83 0C80-4 85-7 83-11" />
        <path d="M98 6C95 2 101-1 98-6C95-10 100-13 98-17" />
        <path d="M113 8C110 4 116 1 113-4C110-8 115-11 113-15" />
      </g>
      <g transform={at(105, 48, -11, s)}>
        <path d="M-32 3C-37-13-20-31 0-31C20-31 37-14 33 1C31 6 20 7 0 7C-20 7-30 7-32 3Z" fill="#D99A5B" {...I} />
        <ellipse cx={-3} cy={-22} rx={15} ry={5.5} fill="#F6E7CF" opacity={0.6} />
        <path d="M-31 1.5C-20 5-1 5.4 33-0.4" fill="none" stroke="#B9783F" strokeWidth={2.6} strokeLinecap="round" />
        <path d="M-28-6C-27-17-17-26-6-28" fill="none" stroke="#E9B47A" strokeWidth={4} strokeLinecap="round" />
        {/* the ear: one long score with the crust lifting off it */}
        <path d="M-22-12C-10-23 10-25 25-15" fill="none" stroke="#F6DDB4" strokeWidth={4.8} strokeLinecap="round" />
        <path d="M-22.4-14.9C-10-26 10-28 25.6-17.9" fill="none" stroke={O} strokeWidth={1.8 / s} strokeLinecap="round" />
        <path d="M-14-2.6L-9-6.4M-4-1.8L1-5.6M6-1.8L11-5.6M16-2.6L21-6.4" stroke="#F6DDB4" strokeWidth={2.6} strokeLinecap="round" />
        {[[-16, -24], [-6, -27], [6, -27.4], [18, -24], [-25, -6], [27, -8], [-1, -14], [12, -12.4], [-13, -14], [-8, -21], [10, -21]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={1.2} fill="#FBF3E4" />
        ))}
      </g>
    </g>
  )
})()

export const HEAD = [
  { id: 'lilypad', name: 'Lily pad', hobby: 'outdoors', slot: 'head', box: '60 4 92 70', axo: lilypad },
  { id: 'frog', name: 'Frog friend', hobby: 'outdoors', slot: 'head', box: '72 8 66 66', axo: frog },
  { id: 'snail', name: 'Party snail', hobby: 'garden', slot: 'head', box: '62 0 88 74', axo: snail },
  { id: 'shellcrown', name: 'Shell crown', hobby: 'other', slot: 'head', box: '62 6 86 66', axo: shellcrown },
  { id: 'jelly', name: 'Jellyfish hat', hobby: 'other', slot: 'head', box: '50 -4 108 90', axo: jelly },
  { id: 'painter', name: "Painter's beret", hobby: 'art', slot: 'head', box: '60 0 98 76', axo: painter },
  { id: 'swimcap', name: 'Swim cap', hobby: 'fitness', slot: 'head', box: '52 8 108 80', axo: swimcap },
  { id: 'loaf', name: 'Sourdough hat', hobby: 'cooking', slot: 'head', box: '58 -22 92 86', axo: loaf },
]
