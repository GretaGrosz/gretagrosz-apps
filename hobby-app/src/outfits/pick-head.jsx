// More head items (made for the store, which is gone). Like every outfit, you pick one when you finish a project.
// Same contract as ./README.md.
// Drawn like head.jsx: upright around (0, 0), placed with at() onto the crown, tilted with the head and scaled.
// Anything box-head.css moves is a plain <g> with a class and no transform attribute.
import './pick-head.css'

const O = '#4A1A0E'
const pens = (s = 1) => {
  const I = { stroke: O, strokeWidth: 2.2 / s, strokeLinejoin: 'round', strokeLinecap: 'round' }
  return { I, T: { ...I, strokeWidth: 1.6 / s }, H: { ...I, strokeWidth: 1.1 / s } }
}
const at = (x, y, r = -9, s = 1) => `translate(${x} ${y}) rotate(${r}) scale(${s})`

// A four-point sparkle centred on (0, 0)
const spark = (r) => `M0 ${-r}L${r * 0.26} ${-r * 0.26}L${r} 0L${r * 0.26} ${r * 0.26}L0 ${r}L${-r * 0.26} ${r * 0.26}L${-r} 0L${-r * 0.26} ${-r * 0.26}Z`
const Spark = ({ x, y, r, fill = '#FFFFFF' }) => <path d={spark(r)} transform={`translate(${x} ${y})`} fill={fill} stroke={O} strokeWidth={1} strokeLinejoin="round" />
const Blush = ({ x, y, rx = 3, ry = 1.8, fill = '#F29C9C' }) => <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={fill} opacity={0.85} />
// A thick outlined line: ink underneath, colour on top
const Rope = ({ d, w = 3.6, fill, edge = 2.2 }) => (
  <>
    <path d={d} fill="none" stroke={O} strokeWidth={w + edge * 2} strokeLinecap="round" strokeLinejoin="round" />
    <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  </>
)
// A little happy face centred on (0, 0)
const Face = ({ e = 5, r = 1.9, blush = 8, smile = 2.4, bl = '#F29C9C' }) => {
  const { T } = pens()
  return (
    <>
      <circle cx={-e} cy={0} r={r} fill={O} />
      <circle cx={e} cy={0} r={r} fill={O} />
      <circle cx={-e + r * 0.3} cy={-r * 0.35} r={r * 0.33} fill="#FFFFFF" />
      <circle cx={e + r * 0.3} cy={-r * 0.35} r={r * 0.33} fill="#FFFFFF" />
      <path d={`M${-smile} ${r + 1.4}Q0 ${r + 1.4 + smile} ${smile} ${r + 1.4}`} fill="none" {...T} />
      <Blush x={-blush} y={r + 1.6} rx={2.4} ry={1.4} fill={bl} />
      <Blush x={blush} y={r + 1.6} rx={2.4} ry={1.4} fill={bl} />
    </>
  )
}

// ---------- 1. toadstool: a spotty fly-agaric cap with a caterpillar commuting across it ----------
const toadstool = (() => {
  const s = 1.1
  const { I, T } = pens(s)
  const CAT = '#9ED36F'
  return (
    <g transform={at(104, 50, -9, s)}>
      {/* the frilly underside peeks out below the rim */}
      <path d="M-37 0C-26 9 26 9 37 0L35 4C24 12-24 12-35 4Z" fill="#F6E7CF" {...T} />
      <path d="M-26 6.6L-25 9.4M-16 8.2L-15.6 11M-6 8.8V11.6M4 8.8V11.6M14 8.4L14.4 11.2M24 7L25 9.6" stroke="#D9BE96" strokeWidth={1.3} strokeLinecap="round" />
      <path d="M-39 1C-44-20-24-37 0-37C24-37 44-20 39 1C28 7-28 7-39 1Z" fill="#E5574C" {...I} />
      <path d="M-31-14C-27-25-16-32-4-33" fill="none" stroke="#F59A8C" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M-34 1.4C-20 5.6 20 5.6 34 1.4" fill="none" stroke="#C3433A" strokeWidth={2.6} strokeLinecap="round" />
      {/* spots */}
      {[[-22, -10, 5.4, 4.2], [-6, -24, 4.6, 3.4], [9, -11, 6, 4.6], [27, -17, 4, 3.4], [-32, -3, 2.6, 2.2], [13, -29, 3, 2.4], [30, -3, 2.8, 2.4]].map(([x, y, rx, ry]) => (
        <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} fill="#FFF8EE" {...T} />
      ))}
      {/* caterpillar: inches along the top of the cap */}
      <g transform="translate(-10 -34)">
        <g className="bh-cater">
          {[[-15, 1.6, 4.6], [-8.6, -1.4, 5.2], [-1.6, -2.6, 5.4]].map(([x, y, r], k) => (
            <g key={x}>
              <path d={`M${x - 1.6} ${y + r - 0.6}V${y + r + 2.2}M${x + 1.6} ${y + r - 0.6}V${y + r + 2.2}`} stroke={O} strokeWidth={1.4} strokeLinecap="round" />
              <circle cx={x} cy={y} r={r} fill={k % 2 ? '#86C25A' : CAT} {...T} />
            </g>
          ))}
          <path d="M8 -9.6Q7.4-15 4.6-17M12.6-8.6Q14.6-13.6 17.4-14.6" fill="none" stroke={O} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={4.6} cy={-17} r={1.6} fill="#F5CF5B" stroke={O} strokeWidth={1} />
          <circle cx={17.4} cy={-14.6} r={1.6} fill="#F5CF5B" stroke={O} strokeWidth={1} />
          <circle cx={7.6} cy={-2.4} r={7.6} fill={CAT} {...T} />
          <path d="M3-6.4C4-8.4 6-9.4 8.2-9.2" fill="none" stroke="#D6F0B8" strokeWidth={1.6} strokeLinecap="round" />
          <g transform="translate(9 -2) scale(0.62)"><Face e={4.6} r={2} blush={7.2} smile={2.2} /></g>
        </g>
      </g>
      <g className="bh-twinkle"><Spark x={34} y={-28} r={4.4} /></g>
    </g>
  )
})()

// ---------- 2. teapot: tiny, chubby, always on the boil; the lid rattles, the tag swings ----------
const teapot = (() => {
  const s = 1.12
  const { I, T } = pens(s)
  const POT = '#9AD3D8'
  return (
    <g transform={at(105, 49, -9, s)}>
      <g className="bh-steam" fill="none" stroke="#C9B4A8" strokeWidth={2.2} strokeLinecap="round">
        <path d="M44-38C41-41 46-44 43-48C41-51 44-53 43-56" />
        <path d="M50-36C47-39 52-42 49-46C47-49 50-51 49-54" />
      </g>
      {/* handle and spout behind the body */}
      <Rope d="M-23-22C-36-24-37-6-24-5" w={4} fill={POT} edge={2.2 / s} />
      <path d="M21-14C29-15 33-22 37-32L43-34C42-24 36-8 22-4Z" fill={POT} {...I} />
      <path d="M36.4-31.2L43.4-34" fill="none" stroke="#6EB3BA" strokeWidth={2.4} strokeLinecap="round" />
      {/* body */}
      <path d="M-25 0C-32-10-28-27-11-29H11C28-27 32-10 25 0C14 3.4-14 3.4-25 0Z" fill={POT} {...I} />
      <path d="M-23-1.8C-12 1.6 12 1.6 23-1.8" fill="none" stroke="#6EB3BA" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M-21-16C-20-22-15-25.6-9-26.4" fill="none" stroke="#D3F0F1" strokeWidth={3.2} strokeLinecap="round" />
      {/* polka dots and a face */}
      {[[-16, -6], [18, -10], [-6, -22], [13, -22], [21, -3]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={1.8} fill="#FFFFFF" opacity={0.9} />)}
      <g transform="translate(1 -13)"><Face e={6} r={2.2} blush={9.6} smile={2.8} /></g>
      {/* lid with a knob; rattles from the bottom */}
      <g className="bh-lid">
        <path d="M-14-28C-14-34-6-36.6 0-36.6C6-36.6 14-34 14-28Q0-25.4-14-28Z" fill="#F7A8C0" {...T} />
        <circle cy={-39.4} r={3.6} fill="#F7A8C0" {...T} />
        <circle cx={-1.2} cy={-40.6} r={1.1} fill="#FFFFFF" />
      </g>
      {/* teabag string and tag dangling down the side */}
      <g className="bh-tag">
        <path d="M-6-33C-14-33-20-26-27-15" fill="none" stroke={O} strokeWidth={1.1} strokeLinecap="round" />
        <g transform="translate(-27 -15) rotate(18)">
          <path d="M-4.6 0H4.6V8.6H-4.6Z" fill="#F5CF5B" {...T} />
          <path d="M-2 3.2Q0 1.4 2 3.2Q2 5.8 0 6.2Q-2 5.8-2 3.2Z" fill="#E5675A" />
        </g>
      </g>
    </g>
  )
})()

// ---------- 3. birthday cake: frosting drips, sprinkles, one very serious candle ----------
const cake = (() => {
  const s = 1.1
  const { I, T } = pens(s)
  const sprinkles = [[-20, -16, 30, '#7CC4E8'], [-11, -21, -40, '#F5CF5B'], [-3, -14, 60, '#8CCB72'], [8, -20, -20, '#7CC4E8'], [16, -14, 40, '#F5CF5B'], [21, -21, -60, '#C3B0F6'], [-17, -24, 10, '#C3B0F6']]
  return (
    <g transform={at(104, 49, -9, s)}>
      {/* plate */}
      <ellipse cy={1} rx={36} ry={5.6} fill="#FBF5EE" {...I} />
      <path d="M-28 1.6Q0 5 28 1.6" fill="none" stroke="#E6D8C6" strokeWidth={1.6} strokeLinecap="round" />
      {/* sponge with a jam layer */}
      <path d="M-28 0V-20C-28-25 28-25 28-20V0Q0 4-28 0Z" fill="#F6D7A2" {...I} />
      <path d="M-27-8.6Q0-5.4 27-8.6" fill="none" stroke="#E5675A" strokeWidth={3.2} strokeLinecap="round" />
      <path d="M-27-8.6Q0-5.4 27-8.6" fill="none" stroke="#F09A8E" strokeWidth={1.2} strokeLinecap="round" />
      <path d="M-26-3.4Q0-0.4 26-3.4" fill="none" stroke="#E2B77A" strokeWidth={1.6} strokeLinecap="round" />
      {/* pink frosting with drips over the edge */}
      <path d="M-29-20C-29-30 29-30 29-20C29-17 27-15.6 25.6-16.6C24.4-12 20.6-12 20-16C18-14 15-14.6 14.2-17C13-9 7.4-9 7.2-15.8C5-14 1.6-14.4 1-17C-0.4-12.4-5-12.6-5.6-16.4C-8-14.6-11-15-12-17.4C-13-10.6-19-10.4-19.4-16.4C-22-15-25.6-15.6-26.6-17.2C-28-16.6-29-18.2-29-20Z" fill="#F7A8C0" {...I} />
      <path d="M-22-25.4C-12-27.6 4-28 14-27" fill="none" stroke="#FCD3E0" strokeWidth={2.6} strokeLinecap="round" />
      {sprinkles.map(([x, y, a, c]) => (
        <path key={x} d="M-1.8 0H1.8" transform={`translate(${x} ${y}) rotate(${a})`} stroke={c} strokeWidth={2} strokeLinecap="round" />
      ))}
      {/* cherry */}
      <path d="M-14-26Q-15-32-11-35" fill="none" stroke={O} strokeWidth={1.4} strokeLinecap="round" />
      <circle cx={-15} cy={-25.4} r={4.4} fill="#E5574C" {...T} />
      <circle cx={-16.4} cy={-26.8} r={1.2} fill="#FFFFFF" />
      {/* the candle */}
      <path d="M5-24V-42H12V-24Z" fill="#FBF5EE" {...T} />
      <path d="M5.6-28L11.4-31.6M5.6-34L11.4-37.6M5.6-40L9.4-42" stroke="#7CC4E8" strokeWidth={2} strokeLinecap="round" />
      <path d="M5-24V-42H12V-24Z" fill="none" {...T} />
      <path d="M8.5-42V-45" stroke={O} strokeWidth={1.4} strokeLinecap="round" />
      <g transform="translate(8.5 -45)">
        <g className="bh-flame">
          <path d="M0 0C-4.4 0-5-4.4-2.6-7.6C-1.4-9.4-0.6-11.6 0-14C2.6-10.4 5-7.6 4.4-4C4 -1.4 2.4 0 0 0Z" fill="#F5CF5B" {...T} />
          <path d="M0-1.6C-1.8-1.6-2.2-3.4-1.2-5C-0.6-6-0.2-7 0-8C1.2-6.2 2.2-4.8 1.8-3.2C1.6-2.2 1-1.6 0-1.6Z" fill="#F08A4E" />
        </g>
      </g>
      <g className="bh-twinkle"><Spark x={-30} y={-32} r={4.2} fill="#FFF3B0" /></g>
      <g className="bh-twinkle bh-twinkle-2"><Spark x={27} y={-36} r={3.4} fill="#FFF3B0" /></g>
    </g>
  )
})()

// ---------- 4. headphones: big comfy cans, cranked up, notes escaping ----------
// Drawn straight onto the head: the band hugs the crown, the cups sit over the gill bases, clear of the eyes.
const headphones = (() => {
  const { I, T } = pens()
  const band = 'M57 66C58 48 78 36 104 34.6C131 33.4 151 42 153.4 55'
  const cup = (x, y, r) => (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse rx={12.4} ry={16.4} fill="#8E7FE0" {...I} />
      <ellipse rx={8.2} ry={11.8} fill="#B4A9F2" {...T} />
      <path d="M-8.4-7C-7.4-11.4-4-14-0.4-14.4" fill="none" stroke="#E2DCFF" strokeWidth={2.6} strokeLinecap="round" />
      <path d="M0-5.4L1.8-1.8L5.6-1.4L2.8 1.2L3.6 5L0 3L-3.6 5L-2.8 1.2L-5.6-1.4L-1.8-1.8Z" fill="#F5CF5B" stroke={O} strokeWidth={1.1} strokeLinejoin="round" />
    </g>
  )
  return (
    <g>
      <g transform="translate(34 44) rotate(-14)">
        <g className="bh-note bh-note-1">
          <path d="M0 0V-14L10-16.4V-2.4" fill="none" stroke={O} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0 0V-14L10-16.4V-2.4" fill="none" stroke="#F7A8C0" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-2.6} cy={0.6} rx={4} ry={3} transform="rotate(-20 -2.6 0.6)" fill="#F7A8C0" stroke={O} strokeWidth={1.5} />
          <ellipse cx={7.4} cy={-1.8} rx={4} ry={3} transform="rotate(-20 7.4 -1.8)" fill="#F7A8C0" stroke={O} strokeWidth={1.5} />
        </g>
      </g>
      <g transform="translate(172 34) rotate(10)">
        <g className="bh-note bh-note-2">
          <path d="M0 0V-14Q5-12 6.6-7.4" fill="none" stroke={O} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0 0V-14Q5-12 6.6-7.4" fill="none" stroke="#7CC4E8" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-2.6} cy={0.6} rx={4} ry={3} transform="rotate(-20 -2.6 0.6)" fill="#7CC4E8" stroke={O} strokeWidth={1.5} />
        </g>
      </g>
      <g transform="translate(150 22) rotate(-6) scale(0.8)">
        <g className="bh-note bh-note-3">
          <path d="M0 0V-14Q5-12 6.6-7.4" fill="none" stroke={O} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0 0V-14Q5-12 6.6-7.4" fill="none" stroke="#F5CF5B" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
          <ellipse cx={-2.6} cy={0.6} rx={4} ry={3} transform="rotate(-20 -2.6 0.6)" fill="#F5CF5B" stroke={O} strokeWidth={1.5} />
        </g>
      </g>
      {/* band: padded, with a stitched cushion on top */}
      <path d={band} fill="none" stroke={O} strokeWidth={12} strokeLinecap="round" />
      <path d={band} fill="none" stroke="#8E7FE0" strokeWidth={7.6} strokeLinecap="round" />
      <path d="M68 47C78 40 90 37 100 36.2" fill="none" stroke="#C9C0F7" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M88 39C95 34.4 113 33 123 35.6C124 41 120 42.6 112 42C104 41.6 94 42 89 44C86 43 86 40.6 88 39Z" fill="#F7A8C0" {...T} />
      <path d="M93 41V39M99 40V37.6M105 39.6V37.2M111 39.6V37.2M117 40V37.8" stroke="#FCD3E0" strokeWidth={1.3} strokeLinecap="round" />
      <g className="bh-cup bh-cup-l">{cup(55, 68, 14)}</g>
      <g className="bh-cup bh-cup-r">{cup(154.6, 56, -26)}</g>
    </g>
  )
})()

// ---------- 5. viking: a dented pond-raider helmet with seashell horns ----------
const viking = (() => {
  const s = 1.12
  const { I, T } = pens(s)
  const horn = (flip) => {
    const m = flip ? -1 : 1
    return (
      <g transform={`scale(${m} 1)`}>
        <path d="M-24-2C-40-2-52-14-48-42C-44-30-38-22-26-20Z" fill="#FBE3C8" {...I} />
        <path d="M-27-7.6L-28-19.6M-34.4-8.6L-33.6-21M-41-13L-38.6-24.4M-45.4-21L-42.4-28.4M-47.4-30L-45.2-34" stroke="#F4A88F" strokeWidth={2.6} strokeLinecap="round" />
        <path d="M-44.8-24C-46.4-30-46.8-35.6-46.4-39" fill="none" stroke="#FFF6EA" strokeWidth={1.6} strokeLinecap="round" />
        <path d="M-24-2C-40-2-52-14-48-42C-44-30-38-22-26-20Z" fill="none" {...I} />
      </g>
    )
  }
  return (
    <g transform={at(104, 50, -9, s)}>
      {horn(false)}
      {horn(true)}
      <path d="M-30 1C-32-20-17-32 0-32C17-32 32-20 30 1Q0 7-30 1Z" fill="#B9C3D2" {...I} />
      <path d="M-22-17C-18-25-10-29-2-29.6" fill="none" stroke="#E7ECF3" strokeWidth={3.4} strokeLinecap="round" />
      {/* the dent (it's seen things) */}
      <path d="M13-17.4Q17-14 15.8-10" fill="none" stroke="#8F9AAD" strokeWidth={1.8} strokeLinecap="round" />
      {/* nose guard ridge and brim */}
      <path d="M0-31.6V2" fill="none" stroke={O} strokeWidth={7.4 / s} strokeLinecap="round" />
      <path d="M0-31.6V2" fill="none" stroke="#E9B44C" strokeWidth={3.4} strokeLinecap="round" />
      <path d="M-32 2Q0 9.4 32 2" fill="none" stroke={O} strokeWidth={9 / s} strokeLinecap="round" />
      <path d="M-32 2Q0 9.4 32 2" fill="none" stroke="#E9B44C" strokeWidth={4.8} strokeLinecap="round" />
      {[-24, -12, 12, 24].map((x) => <circle key={x} cx={x} cy={2 + 7.4 * (1 - (x / 32) ** 2) * 0.5} r={1.4} fill="#FFF3B0" stroke={O} strokeWidth={0.9} />)}
      {/* a pearl stud on the front */}
      <circle cx={0} cy={-12} r={3.4} fill="#FBF5EE" {...T} />
      <circle cx={-1} cy={-13} r={1.1} fill="#FFFFFF" />
      <g className="bh-twinkle"><Spark x={-14} y={-24} r={4.4} /></g>
    </g>
  )
})()

// ---------- 6. rain cloud: a sleepy little cloud that came along to keep the axolotl damp ----------
const raincloud = (() => {
  const s = 1.12
  const { I, T } = pens(s)
  const drop = (x, y, k) => (
    <g key={k} transform={`translate(${x} ${y})`}>
      <g className={`bh-drop bh-drop-${k}`}>
        <path d="M0 0C3 4.2 4.4 6.4 4.4 8.4C4.4 10.9 2.5 12.6 0 12.6C-2.5 12.6-4.4 10.9-4.4 8.4C-4.4 6.4-3 4.2 0 0Z" fill="#8CC8F0" {...T} />
        <ellipse cx={-1.6} cy={8} rx={1.1} ry={1.8} fill="#FFFFFF" />
      </g>
    </g>
  )
  return (
    <g transform={at(104, 47, -9, s)}>
      {/* a little rainbow behind it */}
      <g fill="none" strokeLinecap="round">
        <path d="M14-26C18-42 40-44 44-22" stroke={O} strokeWidth={14.4 / s} />
        <path d="M14-26C18-42 40-44 44-22" stroke="#F08A8A" strokeWidth={10.6} />
        <path d="M14-26C18-42 40-44 44-22" stroke="#F5CF5B" strokeWidth={6.6} />
        <path d="M14-26C18-42 40-44 44-22" stroke="#8CCB72" strokeWidth={2.8} />
      </g>
      <g className="bh-rain">
        {drop(-27, 4, 1)}
        {drop(-12, 6, 2)}
        {drop(27, 4, 3)}
      </g>
      <g className="bh-cloud">
        <path d="M-32 3C-42 3-43-12-33-14C-35-27-18-32-11-24C-7-37 14-38 17-25C25-32 40-24 35-13C45-10 43 3 34 3C16 6-16 6-32 3Z" fill="#F2F5FB" {...I} />
        <path d="M-36-2C-20 2.4 20 2.4 39-2C38 1 36 3 34 3C16 6-16 6-32 3C-34 3-35.4 0.6-36-2Z" fill="#CAD5E8" />
        <path d="M-35-2C-20 2 20 2 39-2.4" fill="none" stroke="#B3C0D8" strokeWidth={1.4} strokeLinecap="round" />
        <path d="M-32 3C-42 3-43-12-33-14C-35-27-18-32-11-24C-7-37 14-38 17-25C25-32 40-24 35-13C45-10 43 3 34 3C16 6-16 6-32 3Z" fill="none" {...I} />
        <path d="M-6-27C-3-32 4-33.6 9-31" fill="none" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
        {/* content, sleepy face */}
        <path d="M-10.6-10.6Q-7.6-7.6-4.6-10.6M4.6-10.6Q7.6-7.6 10.6-10.6" fill="none" {...T} />
        <path d="M-2.2-5.6Q0-3.6 2.2-5.6" fill="none" {...T} />
        <Blush x={-13.6} y={-6} rx={3} ry={1.7} />
        <Blush x={13.6} y={-6} rx={3} ry={1.7} />
      </g>
    </g>
  )
})()

export const PICK_HEAD = [
  { id: 'toadstool', name: 'Toadstool', slot: 'head', hobby: 'garden', box: '58 -6 96 76', axo: toadstool },
  { id: 'teapot', name: 'Teapot', slot: 'head', hobby: 'cooking', box: '62 -16 100 84', axo: teapot },
  { id: 'cake', name: 'Birthday cake', slot: 'head', hobby: 'cooking', box: '62 -8 86 76', axo: cake },
  { id: 'headphones', name: 'Headphones', slot: 'head', hobby: 'music', box: '34 4 146 84', axo: headphones },
  { id: 'viking', name: 'Viking helmet', slot: 'head', hobby: 'fitness', box: '46 -4 116 74', axo: viking },
  { id: 'raincloud', name: 'Rain cloud', slot: 'head', hobby: 'outdoors', box: '58 -2 102 78', axo: raincloud },
]
