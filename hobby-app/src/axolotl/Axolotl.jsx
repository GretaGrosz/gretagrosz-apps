import { useId } from 'react'

// Blank's axolotl, traced from the original art (mascot-photos/*.png, public/logo.png) in a 200x200 box.
// Shapes only: every bit of motion lives in axolotl.css / motion.js, keyed on the class names below.
//
// Composition:
//   edge  — a prop (camera, guitar, bread, book, timer, sign) or the streak badge is the edge it peeks over,
//           exactly like the reference drawings
//   peek  — no object, head + paws resting on an invisible bottom edge (the app icon pose)
//   full  — no object and peek={false}: the whole little body
// Layout offsets sit on the unclassed wrapper g.axo-stage, so CSS transforms on g.axo-body never fight them.

export const MOODS = ['idle', 'happy', 'cheer', 'sleepy', 'worried', 'thinking', 'proud', 'wave']
export const PROPS = ['none', 'flame', 'camera', 'guitar', 'bread', 'book', 'timer', 'sign']

const C = {
  out: '#4A1A0E',
  pinkHi: '#F5C8BB',
  pink: '#EFB4A5',
  pinkLo: '#E39E8D',
  paw: '#E89A87',
  pawLo: '#D9826D',
  seam: '#D28570',
  sclera: '#E2C0B7',
  pupil: '#47150A',
  shine: '#FFF9F2',
  stalk: '#93432E',
  tip: '#E8A08C',
  tipLo: '#CE7A64',
  tipShine: '#F4F1F4',
  fx: '#B85A43',
  mouth: '#5A1C10',
  tongue: '#E8857A',
  blush: '#EC8B7E',
  cream: '#F1E8DD',
  creamHi: '#FBF5EE',
  brown: '#8A4B2E',
  lens: '#6E3A2C',
  lensRing: '#4A1D10',
  salmon: '#E8907A',
  glass: '#D9E0EA',
  crust: '#D99A5B',
  crustHi: '#E9B47A',
  score: '#F6DDB4',
  wood: '#E8A86A',
  woodHi: '#F0BC83',
  accent: '#B85A43',
  flame: '#F0874A',
  flameIn: '#FFD27A',
  page: '#FBF5EC',
  ink: '#C9A48F',
}

// [base x, base y (hidden under the head, also the transform-origin), c1, c2, tip x, tip y, tip r]
const GILLS_L = [
  [74, 62, 60, 55, 50, 42, 49, 18, 8],
  [70, 64, 50, 61, 33, 50, 25, 30, 7.5],
  [66, 68, 46, 67, 27, 65, 10, 56, 8],
  [62, 72, 48, 73, 33, 85, 18, 86, 7.5],
]
const GILLS_R = [
  [128, 54, 141, 45, 149, 30, 151, 8, 8],
  [136, 56, 150, 50, 164, 41, 172, 26, 7.5],
  [144, 60, 160, 60, 176, 57, 190, 47, 8],
  [148, 64, 160, 61, 172, 65, 183, 73, 7.5],
]

const HEAD =
  'M48 89C46.5 76 59 62 78 55C95 48.5 119 46 138 53C150 57.5 158 65 157.5 75C157 87 138 97.5 120 102C102 106.5 76 106.5 62 101.5C53 98.5 48.5 94.5 48 89Z'

// Eye geometry: socket (sclera) ellipse, its tilt, and the resting pupil. Pupils sit toward the seam like the art.
const EYES = {
  l: { cx: 69, cy: 85, rx: 14, ry: 11.5, rot: -8, px: 73.5, py: 85.5, pr: 10 },
  r: { cx: 138, cy: 74.5, rx: 13.5, ry: 11.5, rot: -12, px: 133.5, py: 75, pr: 10 },
}
const MOUTH = { x: 106, y: 95.5, rot: -9 }

// Rotated ellipse as a path, so tilted eye shapes carry no transform attribute (CSS transforms would replace it).
function ellipseD(cx, cy, rx, ry, deg) {
  const a = (deg * Math.PI) / 180
  const dx = rx * Math.cos(a)
  const dy = rx * Math.sin(a)
  const f = (n) => Math.round(n * 100) / 100
  return `M${f(cx - dx)} ${f(cy - dy)}A${rx} ${ry} ${deg} 1 0 ${f(cx + dx)} ${f(cy + dy)}A${rx} ${ry} ${deg} 1 0 ${f(cx - dx)} ${f(cy - dy)}Z`
}

const has = (list, mood) => (list.includes(mood) ? undefined : 'none')

function digits(n) {
  const v = Math.max(0, Math.floor(Number(n) || 0))
  return v > 99999 ? '99999+' : String(v)
}

// The mitten paw from the drawing: arched top hooked over the edge, two round toes, split up the middle.
const PAW = 'M-11.5-1.5C-11.5-7.5-4.5-10.5 1-10.5C7-10.5 12.5-7.5 12.5-1.5C12.5 4.5 10.5 9 6.5 9.3C3.2 9.6 1.2 6.5 0.8 2.5C0 8.2-2.6 11.6-6.2 11.3C-10.2 11-11.8 4.5-11.5-1.5Z'
const PAW_SPLIT = 'M0.8 2.5C0.6-0.5 1-3 2-5'

function Paw({ x, y, rot = 0, k, flip = false, grad }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})${flip ? ' scale(-1 1)' : ''}`}>
      <path d={PAW} fill={grad} stroke={C.out} strokeWidth={1.8 * k} strokeLinejoin="round" />
      <path d={PAW_SPLIT} fill="none" stroke={C.out} strokeWidth={1.5 * k} strokeLinecap="round" />
    </g>
  )
}

function RaisedPaw({ side, k, grad, layout }) {
  // Arm rises from behind the edge (or from the shoulder) and the paw opens beside the cheek, toes up.
  const L = side === 'l'
  const [bx, by] = layout === 'full' ? (L ? [80, 118] : [128, 118]) : L ? [55, 109] : [151, 109]
  const [px, py] = L ? [37, 100] : [167, 95]
  const d = `M${bx} ${by}Q${L ? bx - 4 : bx + 4} ${py + 4} ${px} ${py + 3}`
  return (
    <g>
      <path d={d} fill="none" stroke={C.out} strokeWidth={11 + 1.8 * k} strokeLinecap="butt" />
      <path d={d} fill="none" stroke={C.pawLo} strokeWidth={11 - 1.8 * k} strokeLinecap="butt" />
      <g transform={`translate(${px} ${py}) rotate(${L ? 160 : 200})`}>
        <path d={PAW} fill={grad} stroke={C.out} strokeWidth={1.8 * k} strokeLinejoin="round" />
        <path d={PAW_SPLIT} fill="none" stroke={C.out} strokeWidth={1.5 * k} strokeLinecap="round" />
      </g>
    </g>
  )
}

function Flame({ x, y, s = 1, k }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="axo-flame">
      <path
        d="M0-19C7-11 14-5 14 4.5C14 12.5 7.8 18 0 18C-7.8 18-14 12.5-14 4.5C-14-2-10-6-7-11.5C-5.5-7-3.5-5-1.5-4C-3-9.5-2.5-15 0-19Z"
        fill={C.flame}
        stroke={C.out}
        strokeWidth={(2.2 * k) / s}
        strokeLinejoin="round"
      />
      <path d="M0.5 0C4 3.5 6.5 6.5 6.5 10C6.5 13.5 3.8 15.5 0.5 15.5C-2.8 15.5-5.5 13.5-5.5 10C-5.5 6-2 3.8 0.5 0Z" fill={C.flameIn} />
      </g>
    </g>
  )
}

function Badge({ streak, flame, compact, k, small }) {
  const text = digits(streak)
  const len = text.length
  if (compact) {
    // Pinned to the corner of another prop.
    const fs = len <= 2 ? 34 : len === 3 ? 28 : 22
    return (
      <g className="axo-badge">
        <rect x={124} y={158} width={72} height={40} rx={20} fill={C.creamHi} stroke={C.out} strokeWidth={2.6 * k} />
        {flame && <Flame x={142} y={178} s={0.62} k={k} />}
        <text
          className="axo-badge-num"
          x={flame ? 170 : 160}
          y={178 + fs * 0.35}
          textAnchor="middle"
          fontSize={fs}
          fontWeight={800}
          fill={C.out}
          style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums' }}
        >
          {text}
        </text>
      </g>
    )
  }
  const top = small ? 100 : 106
  const h = small ? 98 : 88
  const cy = top + h / 2 + 2
  const base = small ? 92 : 78
  const fs = flame ? [base * 0.9, base * 0.9, base * 0.67, base * 0.54, base * 0.46][Math.min(len, 5) - 1] : [base, base, base * 0.86, base * 0.68, base * 0.56][Math.min(len, 5) - 1]
  const tx = flame ? 122 : 100
  const fitW = flame ? 96 : 140
  return (
    <g className="axo-badge">
      <rect x={20} y={top} width={160} height={h} rx={small ? 26 : 22} fill={C.creamHi} stroke={C.out} strokeWidth={3 * k} />
      {flame && <Flame x={small ? 46 : 48} y={cy + 1} s={small ? 1.35 : 1.15} k={k} />}
      <text
        className="axo-badge-num"
        x={tx}
        y={cy + fs * 0.35}
        textAnchor="middle"
        fontSize={fs}
        fontWeight={800}
        fill={C.out}
        textLength={len >= 5 ? fitW : undefined}
        lengthAdjust="spacingAndGlyphs"
        style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
      >
        {text}
      </text>
    </g>
  )
}

function Camera({ k, small }) {
  const w = 3 * k
  return (
    <g>
      <rect x={21} y={95} width={25} height={14} rx={2.5} fill={C.salmon} stroke={C.out} strokeWidth={w * 0.8} />
      <rect x={8} y={107} width={184} height={87} rx={13} fill={C.cream} stroke={C.out} strokeWidth={w} />
      <rect x={9.5} y={130} width={181} height={51} fill={C.brown} />
      <path d="M9 130H191M9 181H191" stroke={C.out} strokeWidth={w * 0.75} />
      {!small && <path d="M14 117C20 114.5 30 113.5 40 113.5" stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={2.4} strokeLinecap="round" fill="none" />}
      {!small && <rect x={154} y={115} width={25} height={12} rx={3} fill={C.glass} stroke={C.out} strokeWidth={w * 0.75} />}
      <circle cx={100} cy={150} r={37.5} fill={C.cream} stroke={C.out} strokeWidth={w} />
      <circle cx={100} cy={150} r={25.5} fill={C.lensRing} />
      <circle cx={100} cy={150} r={17} fill={C.lens} />
      <circle cx={92} cy={142} r={5.2} fill="#F0D9C8" />
      {!small && <circle cx={107} cy={158} r={2.2} fill="#C9A898" />}
    </g>
  )
}

function Guitar({ k, small }) {
  const w = 3 * k
  return (
    <g>
      <rect x={156} y={139} width={32} height={18} rx={2} fill={C.brown} stroke={C.out} strokeWidth={w * 0.8} />
      {!small && <path d="M165 139V157M174 139V157M182 139V157" stroke={C.out} strokeWidth={1.4} />}
      <path d="M186 133L198 130.5V165.5L186 163Z" fill={C.brown} stroke={C.out} strokeWidth={w * 0.8} strokeLinejoin="round" />
      {!small && [[191, 130], [199, 129], [191, 166], [199, 167]].map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r={3.6} fill={C.creamHi} stroke={C.out} strokeWidth={1.6} />)}
      <path
        d="M46 107C70 107 86 117 92 121C100 112 112 108 128 108C152 108 166 125 166 144C166 164 150 181 128 181C116 181 108 177 101 172C94 188 74 201 46 201C20 201 0 180 0 154C0 128 20 107 46 107Z"
        fill={C.wood}
        stroke={C.out}
        strokeWidth={w}
        strokeLinejoin="round"
      />
      {!small && <path d="M12 168C9 146 19 124 40 117" stroke={C.woodHi} strokeWidth={5} strokeLinecap="round" fill="none" />}
      <circle cx={110} cy={146} r={14.5} fill={C.lensRing} />
      <rect x={31} y={137} width={8} height={19} rx={2} fill={C.brown} stroke={C.out} strokeWidth={w * 0.6} />
      {!small && <path d="M38 141.5H190M38 145H190M38 148.5H190M38 152H190" stroke={C.creamHi} strokeWidth={0.9} />}
    </g>
  )
}

function Bread({ k, small }) {
  const w = 3 * k
  return (
    <g>
      <path
        d="M13 172C11 134 52 106 100 106C148 106 189 134 187 172C186 190 176 196 100 196C24 196 14 190 13 172Z"
        fill={C.crust}
        stroke={C.out}
        strokeWidth={w}
        strokeLinejoin="round"
      />
      {!small && <path d="M27 173C24 148 50 124 101 118" stroke={C.crustHi} strokeWidth={5} strokeLinecap="round" fill="none" />}
      <path d="M51 142C80 130 122 130 149 142M41 163C76 149 126 149 160 163" stroke={C.score} strokeWidth={4.2 * Math.min(k, 1.6)} strokeLinecap="round" fill="none" />
      {!small && [[73, 130], [124, 126], [103, 152], [60, 177], [141, 173], [90, 181]].map(([x, y]) => <circle key={x} cx={x} cy={y} r={1.3} fill="#FFF8EE" />)}
    </g>
  )
}

function Book({ k, small }) {
  const w = 2.8 * k
  return (
    <g>
      <path d="M14 113C40 106 76 106 100 116C124 106 160 106 186 113V190C160 184 124 184 100 194C76 184 40 184 14 190Z" fill={C.accent} stroke={C.out} strokeWidth={w} strokeLinejoin="round" />
      <path d="M22 110C46 104 78 105 100 114V186C78 177 46 177 22 182Z" fill={C.page} stroke={C.out} strokeWidth={w * 0.8} strokeLinejoin="round" />
      <path d="M178 110C154 104 122 105 100 114V186C122 177 154 177 178 182Z" fill={C.page} stroke={C.out} strokeWidth={w * 0.8} strokeLinejoin="round" />
      {!small && (
        <path
          d="M34 134C52 131 72 132 88 137M34 147C52 144 72 145 88 150M34 160C52 157 72 158 88 163M112 137C128 132 148 131 166 134M112 150C128 145 148 144 166 147M112 163C128 158 148 157 152 157"
          stroke={C.ink}
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  )
}

function Timer({ k, small }) {
  const w = 3 * k
  // Remaining time wedge (about a third left), drawn as a pie from 12 o'clock clockwise.
  return (
    <g>
      <rect x={14} y={107} width={172} height={88} rx={44} fill={C.cream} stroke={C.out} strokeWidth={w} />
      <circle cx={100} cy={151} r={33} fill={C.creamHi} stroke={C.out} strokeWidth={w * 0.85} />
      <path d="M100 151V124A27 27 0 0 1 123.4 164.5Z" fill={C.accent} />
      {!small && <path d="M100 121V126M130 151H125M100 181V176M70 151H75" stroke={C.out} strokeWidth={2} strokeLinecap="round" />}
      <path d="M100 151L100 127" stroke={C.out} strokeWidth={2.6 * k} strokeLinecap="round" />
      <circle cx={100} cy={151} r={3.6} fill={C.out} />
      {!small && <circle cx={36} cy={151} r={6} fill={C.salmon} stroke={C.out} strokeWidth={2} />}
    </g>
  )
}

function Sign({ k, label }) {
  const fs = label && label.length > 8 ? 26 : 34
  return (
    <g>
      <rect x={20} y={106} width={160} height={88} rx={22} fill={C.creamHi} stroke={C.out} strokeWidth={3 * k} />
      {label ? (
        <text
          className="axo-sign-text"
          x={100}
          y={150 + fs * 0.35}
          textAnchor="middle"
          fontSize={fs}
          fontWeight={800}
          fill={C.out}
          textLength={label.length > 12 ? 140 : undefined}
          lengthAdjust="spacingAndGlyphs"
          style={{ fontFamily: 'ui-rounded, "SF Pro Rounded", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }}
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

export default function Axolotl({
  mood = 'idle',
  prop = 'none',
  size = 96,
  streak,
  peek = false,
  onBoop,
  className = '',
  title,
  label,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const m = MOODS.includes(mood) ? mood : 'idle'
  const p = PROPS.includes(prop) ? prop : 'none'
  const hasStreak = streak !== undefined && streak !== null && streak !== false
  const small = size < 40
  const k = small ? 2.2 : size < 64 ? 1.4 : 1

  const edgeProp = ['camera', 'guitar', 'bread', 'book', 'timer', 'sign'].includes(p)
  const layout = edgeProp || hasStreak ? 'edge' : peek || small ? 'peek' : 'full'
  const stage = layout === 'peek' ? (small ? 'translate(-15 26) scale(1.15)' : 'translate(0 38)') : layout === 'full' ? 'translate(0 10)' : undefined

  const id = (n) => `axo${uid}-${n}`
  const url = (n) => `url(#${id(n)})`
  const ow = 2 * k

  const raisedL = m === 'cheer'
  const raisedR = m === 'cheer' || m === 'wave'

  // Paw rest positions: on the edge, or on the belly when the whole body shows.
  const restL = layout === 'full' ? [86, 128, -10] : [57.5, 120, -8]
  const restR = layout === 'full' ? [122, 128, 10] : [148, 115.5, 4]

  const label_ = title || (hasStreak ? `Axolotl, ${digits(streak)}` : 'Axolotl')
  const interactive = typeof onBoop === 'function'

  const onKeyDown = interactive
    ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onBoop(e)
        }
      }
    : undefined

  return (
    <svg
      className={`axo${className ? ' ' + className : ''}`}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      overflow="visible"
      data-mood={m}
      data-prop={p}
      data-layout={layout}
      data-small={small ? '' : undefined}
      role={interactive ? 'button' : 'img'}
      aria-label={label_}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onBoop : undefined}
      onKeyDown={onKeyDown}
      style={{ '--axo-ink': C.out, overflow: 'visible', cursor: interactive ? 'pointer' : undefined, WebkitTapHighlightColor: 'transparent' }}
    >
      <title>{label_}</title>
      <defs>
        <linearGradient id={id('skin')} x1="0.8" y1="0" x2="0.25" y2="1">
          <stop offset="0" stopColor={C.pinkHi} />
          <stop offset="0.55" stopColor={C.pink} />
          <stop offset="1" stopColor={C.pinkLo} />
        </linearGradient>
        <linearGradient id={id('paw')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.paw} />
          <stop offset="1" stopColor={C.pawLo} />
        </linearGradient>
        <linearGradient id={id('tip')} x1="0.3" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={C.tip} />
          <stop offset="1" stopColor={C.tipLo} />
        </linearGradient>
        <radialGradient id={id('blush')}>
          <stop offset="0" stopColor={C.blush} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.blush} stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="axo-stage" transform={stage}>
        <g className="axo-prop">
          {p === 'camera' && <Camera k={k} small={small} />}
          {p === 'guitar' && <Guitar k={k} small={small} />}
          {p === 'bread' && <Bread k={k} small={small} />}
          {p === 'book' && <Book k={k} small={small} />}
          {p === 'timer' && <Timer k={k} small={small} />}
          {p === 'sign' && !hasStreak && <Sign k={k} label={label} />}
          {hasStreak && <Badge streak={streak} flame={p === 'flame'} compact={edgeProp && p !== 'sign'} k={k} small={small} />}
          {p === 'flame' && !hasStreak && <Flame x={layout === 'full' ? 42 : 176} y={layout === 'full' ? 158 : 96} s={layout === 'full' ? 1.2 : 1.05} k={k} />}
        </g>

        <g className="axo-body">
          {[['l', GILLS_L], ['r', GILLS_R]].map(([side, gills]) => (
            <g key={side} className={`axo-gills-${side}`}>
              {gills.map(([bx, by, c1x, c1y, c2x, c2y, tx, ty, r], i) => {
                const d = `M${bx} ${by}C${c1x} ${c1y} ${c2x} ${c2y} ${tx} ${ty}`
                const tr = small ? r * 1.2 : r
                return (
                  <g key={i} className="axo-gill" style={{ '--i': i, transformOrigin: `${bx}px ${by}px` }}>
                    <path d={d} fill="none" stroke={C.out} strokeWidth={small ? 8 : 6.2} strokeLinecap="round" />
                    <path d={d} fill="none" stroke={C.stalk} strokeWidth={small ? 3.6 : 4} strokeLinecap="round" />
                    <circle className="axo-gill-tip" cx={tx} cy={ty} r={tr} fill={url('tip')} stroke={C.out} strokeWidth={1.8 * Math.min(k, 1.6)} />
                    {!small && <ellipse cx={tx + r * 0.32} cy={ty - r * 0.42} rx={r * 0.3} ry={r * 0.2} transform={`rotate(-30 ${tx + r * 0.32} ${ty - r * 0.42})`} fill={C.tipShine} />}
                  </g>
                )
              })}
            </g>
          ))}

          {layout === 'full' && (
            <g className="axo-torso">
              <path
                className="axo-tail"
                d="M132 140C146 150 162 154 176 144C180 141 185 142 184 147C180 166 156 174 134 162Z"
                fill={url('paw')}
                stroke={C.out}
                strokeWidth={ow}
                strokeLinejoin="round"
                style={{ transformOrigin: '134px 152px' }}
              />
              <Paw x={83} y={168} rot={14} k={k} grad={url('paw')} />
              <Paw x={125} y={168} rot={-14} k={k} flip grad={url('paw')} />
              <path
                d="M80 100C63 114 59 145 70 160C80 173 128 173 138 160C149 145 145 114 128 100Z"
                fill={url('skin')}
                stroke={C.out}
                strokeWidth={ow}
                strokeLinejoin="round"
              />
              {!small && <ellipse cx={104} cy={146} rx={24} ry={19} fill={C.pinkHi} opacity={0.7} />}
            </g>
          )}

          {layout !== 'full' && (
            <g className="axo-neck">
              <path d="M102 99H117C117.5 103 118.5 106 120.5 109H102Z" fill={C.pinkLo} />
              <path d="M117 100C117.5 103.5 118.6 106.4 120.6 108.6" fill="none" stroke={C.out} strokeWidth={ow * 0.85} strokeLinecap="round" />
            </g>
          )}

          <g className="axo-head">
            <path className="axo-skin" d={HEAD} fill={url('skin')} stroke={C.out} strokeWidth={ow * 1.15} strokeLinejoin="round" />
            <path className="axo-seam" d="M97.5 51L105.5 103" stroke={C.seam} strokeWidth={small ? 4.5 : 2.8} strokeLinecap="round" />
            <path
              className="axo-shine-head"
              d="M118 54C130 54.5 142 58 148 64"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity={0.75}
              strokeWidth={3}
              strokeLinecap="round"
              display={has(['proud'], m)}
            />

            <g className="axo-blush" opacity={{ happy: 0.55, cheer: 0.65, proud: 0.5, wave: 0.45, sleepy: 0.3 }[m] || 0}>
              <ellipse cx={60} cy={99} rx={9} ry={5} fill={url('blush')} />
              <ellipse cx={150} cy={86} rx={8.5} ry={5} fill={url('blush')} transform="rotate(-12 150 86)" />
            </g>

            {['l', 'r'].map((side) => {
              const e = EYES[side]
              const look = m === 'thinking' ? [-4.5, -4] : m === 'worried' ? [side === 'l' ? 0.5 : -0.5, 0.5] : [0, 0]
              const pr = small ? e.pr * 1.15 : m === 'worried' ? e.pr * 1.08 : e.pr
              const px = e.px + look[0]
              const py = e.py + look[1]
              const tilt = `rotate(${e.rot} ${e.cx} ${e.cy})`
              const sock = ellipseD(e.cx, e.cy, e.rx, e.ry, e.rot)
              // ^^ closed happy eye
              const arc = `M${e.cx - 10} ${e.cy + 3}Q${e.cx} ${e.cy - 10} ${e.cx + 10} ${e.cy + 3}`
              // Lid: covers the socket from the top; sleepy shows ~55%, proud ~35%.
              const lidD = (f) => {
                const yb = e.cy - e.ry + 2 * e.ry * f
                return `M${e.cx - e.rx - 2} ${e.cy - e.ry - 3}H${e.cx + e.rx + 2}V${yb}Q${e.cx} ${yb + 2.5} ${e.cx - e.rx - 2} ${yb}Z`
              }
              const lidEdge = (f) => {
                const yb = e.cy - e.ry + 2 * e.ry * f
                return `M${e.cx - e.rx + 1} ${yb + 0.6}Q${e.cx} ${yb + 2.8} ${e.cx + e.rx - 1} ${yb + 0.6}`
              }
              const clip = id(`sock-${side}`)
              const open = ['idle', 'sleepy', 'worried', 'thinking', 'proud', 'wave']
              return (
                <g key={side} className={`axo-eye axo-eye-${side}`}>
                  <clipPath id={clip}>
                    <path d={sock} />
                  </clipPath>
                  <g data-mood={open.join(' ')} display={has(open, m)}>
                    {!small && <path className="axo-eye-white" d={sock} fill={C.sclera} />}
                    <g clipPath={small ? undefined : `url(#${clip})`}>
                      <ellipse className="axo-pupil" cx={px} cy={py} rx={pr * 0.92} ry={pr * 1.1} fill={C.pupil} />
                    </g>
                    <circle className="axo-shine" cx={px + (side === 'l' ? 1.5 : -4.5)} cy={py - 5.2} r={small ? 3.4 : 3} fill={C.shine} />
                    {!small && (
                      <path d={sock} fill="none" stroke={C.out} strokeWidth={1.6} />
                    )}
                    {!small && (
                      <path
                        d={side === 'l'
                          ? `M${e.cx - 13.5} ${e.cy + 4}C${e.cx - 15} ${e.cy - 6} ${e.cx - 6} ${e.cy - 12.5} ${e.cx + 4} ${e.cy - 11.5}`
                          : `M${e.cx - 4} ${e.cy - 12}C${e.cx + 6} ${e.cy - 13} ${e.cx + 14.5} ${e.cy - 6} ${e.cx + 13} ${e.cy + 5}`}
                        transform={tilt}
                        fill="none"
                        stroke={C.out}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                      />
                    )}
                    <g className="axo-halflid" display={has(['sleepy', 'proud'], m)} clipPath={`url(#${clip})`}>
                      <path d={lidD(m === 'sleepy' ? 0.58 : 0.36)} transform={tilt} fill={C.pink} />
                      <path d={lidEdge(m === 'sleepy' ? 0.58 : 0.36)} transform={tilt} fill="none" stroke={C.out} strokeWidth={1.8 * k} strokeLinecap="round" />
                    </g>
                    <path
                      className="axo-lid"
                      d={`M${e.cx - e.rx - 1.5} ${e.cy - e.ry - 2}H${e.cx + e.rx + 1.5}V${e.cy + 1}Q${e.cx} ${e.cy + e.ry + 2} ${e.cx - e.rx - 1.5} ${e.cy + 1}Z`}
                      fill={C.pink}
                      stroke={C.out}
                      strokeWidth={1.4 * k}
                      clipPath={`url(#${clip})`}
                      style={{ transform: 'scaleY(0)', transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                    />
                  </g>
                  <g data-mood="happy cheer" display={has(['happy', 'cheer'], m)}>
                    <path className="axo-eye-closed" d={arc} transform={tilt} fill="none" stroke={C.out} strokeWidth={3 * Math.min(k, 1.6)} strokeLinecap="round" />
                  </g>
                </g>
              )
            })}

            <g className="axo-brows" display={has(['worried'], m)}>
              <path d="M60 70.5Q67 70 73 64.5" fill="none" stroke={C.out} strokeWidth={2.4 * k} strokeLinecap="round" />
              <path d="M130 58Q136 60.5 144 59.5" fill="none" stroke={C.out} strokeWidth={2.4 * k} strokeLinecap="round" />
            </g>

            <g className="axo-mouth">
              {[
                ['happy', ['happy', 'wave'], <>
                  <path d="M-6.5-1.5Q0 9 6.5-1.5Z" fill={C.mouth} stroke={C.mouth} strokeWidth={1.4 * k} strokeLinejoin="round" />
                  {!small && <path d="M-3.4 3.2Q0 1 3.4 3.2Q0 6.2-3.4 3.2Z" fill={C.tongue} />}
                </>],
                ['cheer', ['cheer'], <>
                  <path d="M-8.5-2.5Q0 13 8.5-2.5Z" fill={C.mouth} stroke={C.mouth} strokeWidth={1.4 * k} strokeLinejoin="round" />
                  {!small && <path d="M-4.5 4.4Q0 1.4 4.5 4.4Q0 8.6-4.5 4.4Z" fill={C.tongue} />}
                </>],
                ['sleepy', ['sleepy'], <ellipse cx={0} cy={0.5} rx={2.2} ry={2.6} fill={C.mouth} />],
                ['worried', ['worried'], <path d="M-5.5 1.5Q-2.8-1.5 0 1Q2.8 3.5 5.5 0.5" fill="none" stroke={C.mouth} strokeWidth={2 * k} strokeLinecap="round" />],
                ['thinking', ['thinking'], <path d="M-1 1Q3-0.3 6.5 0.2" fill="none" stroke={C.mouth} strokeWidth={2 * k} strokeLinecap="round" />],
                ['proud', ['proud'], <path d="M-6.5-1Q1 6.5 7.5-2.5" fill="none" stroke={C.mouth} strokeWidth={2.2 * k} strokeLinecap="round" />],
              ].map(([name, moods, shape]) => (
                <g key={name} className={`axo-mouth-${name}`} data-mood={moods.join(' ')} display={has(moods, m)}>
                  <g transform={`translate(${MOUTH.x} ${MOUTH.y}) rotate(${MOUTH.rot}) scale(1.2)`}>{shape}</g>
                </g>
              ))}
            </g>

            <g className="axo-fx" display={small ? 'none' : undefined} fill="none" stroke={C.fx} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              {/* Every effect is a direct child (axolotl.css animates .axo-fx > *), staggered by --i */}
              <path className="axo-fx-notice" d="M163 93.5L169 88.5M164 97.5L171.5 97M163 101.5L168.5 105" display={has(['idle', 'worried', 'happy'], m)} />
              <path className="axo-fx-notice-l" d="M43 101L37 97M42 105L34.5 105.5M44 109L38.5 112" display={has(['happy'], m)} />
              <path className="axo-z" style={{ '--i': 0 }} d="M104 34H110L104 40H110" display={has(['sleepy'], m)} />
              <path className="axo-z" style={{ '--i': 1 }} d="M114 21H122L114 29H122" display={has(['sleepy'], m)} />
              <path className="axo-z" style={{ '--i': 2 }} d="M126 6H136L126 16H136" display={has(['sleepy'], m)} />
              <path className="axo-sweat" d="M152 50C155 55 157 58 157 60.5C157 63.2 154.8 65 152.5 65C150.2 65 148 63.2 148 60.5C148 58 150 55 152 50Z" fill="#BFD9EE" stroke={C.out} strokeWidth={1.4} display={has(['worried'], m)} />
              <circle className="axo-dot" style={{ '--i': 0 }} cx={78} cy={40} r={3.2} fill={C.fx} stroke="none" display={has(['thinking'], m)} />
              <circle className="axo-dot" style={{ '--i': 1 }} cx={88} cy={34} r={3.6} fill={C.fx} stroke="none" display={has(['thinking'], m)} />
              <circle className="axo-dot" style={{ '--i': 2 }} cx={99} cy={27} r={4} fill={C.fx} stroke="none" display={has(['thinking'], m)} />
              <path className="axo-spark" style={{ '--i': 0 }} d="M168 84L170 90L176 92L170 94L168 100L166 94L160 92L166 90Z" fill="#F2B544" stroke={C.out} strokeWidth={1.2} display={has(['proud'], m)} />
              <path className="axo-spark" style={{ '--i': 1 }} d="M38 96L39.4 100.2L43.6 101.6L39.4 103L38 107.2L36.6 103L32.4 101.6L36.6 100.2Z" fill="#F2B544" stroke={C.out} strokeWidth={1.2} display={has(['proud'], m)} />
              <path className="axo-spark" style={{ '--i': 0 }} d="M84 22L86.2 28.8L93 31L86.2 33.2L84 40L81.8 33.2L75 31L81.8 28.8Z" fill="#F2B544" stroke={C.out} strokeWidth={1.2} display={has(['cheer'], m)} />
              <path className="axo-spark" style={{ '--i': 1 }} d="M120 18L121.6 23L126.6 24.6L121.6 26.2L120 31.2L118.4 26.2L113.4 24.6L118.4 23Z" fill="#F2B544" stroke={C.out} strokeWidth={1.2} display={has(['cheer'], m)} />
              <path className="axo-wave-lines" d="M186 80C189 84 189 90 186 94M190 76C195 82 195 92 190 98" display={has(['wave'], m)} />
            </g>
          </g>

          <g className="axo-hand axo-hand-l">
            <g className="axo-paw-rest" display={raisedL ? 'none' : undefined}>
              <Paw x={restL[0]} y={restL[1]} rot={restL[2]} k={k} grad={url('paw')} />
            </g>
            <g className="axo-paw-up" display={raisedL ? undefined : 'none'}>
              <RaisedPaw side="l" k={k} grad={url('paw')} layout={layout} />
            </g>
          </g>
          <g className="axo-hand axo-hand-r">
            <g className="axo-paw-rest" display={raisedR ? 'none' : undefined}>
              <Paw x={restR[0]} y={restR[1]} rot={restR[2]} k={k} flip grad={url('paw')} />
            </g>
            <g className="axo-paw-up" display={raisedR ? undefined : 'none'}>
              <RaisedPaw side="r" k={k} grad={url('paw')} layout={layout} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  )
}
