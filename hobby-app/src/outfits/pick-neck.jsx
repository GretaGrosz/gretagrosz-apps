// More neck items (made for the store, which is gone). Like every outfit, you pick one when you finish a project.
// Same contract as ./README.md.
// Drawn under the chin in the axolotl's 200x200 box. Paws sit on top of these in the peek pose, so the
// good bits live in the middle (x ~84–124). Anything box-neck.css moves is a plain <g> with a class.
import { useId } from 'react'
import './pick-neck.css'

const O = '#4A1A0E'
const I = { stroke: O, strokeWidth: 2.2, strokeLinejoin: 'round', strokeLinecap: 'round' }
const T = { ...I, strokeWidth: 1.6 }
const H = { ...I, strokeWidth: 1.1 }
const line = (stroke, w) => ({ fill: 'none', stroke, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round' })
const uid = () => useId().replace(/[^a-zA-Z0-9_-]/g, '')

// A four-point sparkle centred on (0, 0)
const spark = (r) => `M0 ${-r}L${r * 0.26} ${-r * 0.26}L${r} 0L${r * 0.26} ${r * 0.26}L0 ${r}L${-r * 0.26} ${r * 0.26}L${-r} 0L${-r * 0.26} ${-r * 0.26}Z`

// Point on a cubic bezier
const bez = (p, t) => {
  const u = 1 - t
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
  return [0, 1].map((j) => k.reduce((s, c, i) => s + c * p[i][j], 0))
}

// ---------- 1. pond pearls: a strand of pearls with a scallop shell pendant ----------
const P = { pearl: '#FFF8EE', pearlLo: '#EADBD0', shell: '#FFC9B5', shellLo: '#F09A84', shellHi: '#FFF0E6', bail: '#F6C443' }
const STRAND = [[57, 99], [70, 121], [140, 119], [153, 90]]
const PEARLS = Array.from({ length: 15 }, (_, i) => {
  const t = 0.03 + (i / 14) * 0.94
  const [x, y] = bez(STRAND, t)
  return { x, y, r: i % 2 ? 3.6 : 4.2 }
})

function PondPearls() {
  return (
    <g>
      {/* the thread peeking between pearls */}
      <path d={`M${STRAND[0]}C${STRAND[1]} ${STRAND[2]} ${STRAND[3]}`} {...line('#C9B3A6', 1.3)} />
      {PEARLS.map(({ x, y, r }, i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={P.pearl} {...T} />
          <path d={`M${x - r * 0.55} ${y + r * 0.45}A${r * 0.7} ${r * 0.7} 0 0 0 ${x + r * 0.6} ${y + r * 0.35}`} {...line(P.pearlLo, 1.2)} />
          <g className="pp-twinkle" style={{ animationDelay: `${(i * 0.18).toFixed(2)}s` }}>
            <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.33} fill="#FFFFFF" />
          </g>
        </g>
      ))}
      {/* the pendant: a scallop shell on a gold bail, swinging gently */}
      <g className="pp-swing">
        <g transform="translate(104.5 117) scale(1.2) translate(-104.5 -117)">
        <circle cx="104.5" cy="117.6" r="2.8" fill={P.bail} {...H} />
        <path d="M98.5 120.4H110.5L109.5 124H99.5Z" fill={P.shellLo} {...T} />
        <path
          d="M100.5 123.5H108.5C116 126.5 119.5 133 116.8 139.2Q114.4 141.6 111.6 139.6Q108.4 142.6 104.5 140.6Q100.6 142.6 97.4 139.6Q94.6 141.6 92.2 139.2C89.5 133 93 126.5 100.5 123.5Z"
          fill={P.shell}
          {...I}
        />
        <path d="M104.5 125V139M102 125.2L97.8 138.4M107 125.2L111.2 138.4M100.6 124.6L93.6 137.4M108.4 124.6L115.4 137.4" {...line(P.shellLo, 1.3)} />
        <path d="M95 131.2C95.6 128.6 97.4 126.6 99.6 125.6" {...line(P.shellHi, 1.8)} />
        <circle cx="101" cy="122.2" r="0.8" fill={P.shellHi} />
        </g>
      </g>
      <g className="pp-glint">
        <path d={spark(4.4)} transform="translate(123 131)" fill="#FFFFFF" stroke={O} strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  )
}

// ---------- 2. instant cam: a chunky instant camera on a strap that prints out tiny photos ----------
const C = { body: '#8FD6C4', bodyLo: '#5FB09D', bodyHi: '#C9F0E5', top: '#FFF1D6', topLo: '#E9D2AE', strap: '#F2B544', strapLo: '#D18F2A', lens: '#3E4B5C', glass: '#6FA7C2', red: '#F0675A' }

function InstantCam() {
  return (
    <g>
      {/* strap from behind the neck to the lugs */}
      <path d="M62 101.5C70 106 78 109.5 88.5 113L87 118C76 114.5 67 110.5 59.5 105.5Z" fill={C.strap} {...T} />
      <path d="M146 94.5C140 101.5 130 108 120 112.5L122 117.4C133 112.6 143 105.6 150 98Z" fill={C.strap} {...T} />
      <path d="M64.5 105C72 109 79 112 86.5 114.8M146.6 98C140 104.6 131 110.4 121.6 114.6" {...line(C.strapLo, 1)} strokeDasharray="2.2 2" />
      {/* the photo, tucked inside until it prints */}
      <g className="ic-photo">
        <rect x="96" y="113" width="17" height="18" rx="1.2" fill="#FFFDF8" {...T} />
        <rect x="98.3" y="115" width="12.4" height="11" fill="#8BC9E0" />
        <path d="M98.3 123.2C101 121.6 104 121.4 106.5 122.6C108 123.3 109.4 123.4 110.7 123V126H98.3Z" fill="#84C36A" />
        <path d="M104.5 118.6C103.6 117.4 101.7 117.8 101.9 119.4C102.1 120.8 104.5 122.2 104.5 122.2C104.5 122.2 106.9 120.8 107.1 119.4C107.3 117.8 105.4 117.4 104.5 118.6Z" fill="#F0839A" />
      </g>
      {/* body */}
      <path d="M86 116C86 112.5 88 110.5 91.5 110.5H117.5C121 110.5 123 112.5 123 116V128.5C123 131.8 121 133.6 117.5 133.6H91.5C88 133.6 86 131.8 86 128.5Z" fill={C.body} {...I} />
      <path d="M86.6 117.4H122.4" {...line(O, 1.4)} />
      <path d="M86.3 116.8C86.3 113 88.4 111.2 91.5 111.2H117.5C120.6 111.2 122.6 113 122.6 116.8Z" fill={C.top} />
      <path d="M86.3 117.4H122.6" {...line(O, 1.5)} />
      <path d="M88.6 130.6H120.4" {...line(C.bodyLo, 2)} />
      <path d="M89 120.8V126.4" {...line(C.bodyHi, 2)} />
      {/* the photo slot */}
      <path d="M95.5 131.6H113.5" {...line(O, 1.6)} />
      {/* flash window, viewfinder, shutter */}
      <rect x="89" y="112.8" width="8.4" height="3.4" rx="1" fill="#FFFFFF" {...H} />
      <rect x="112" y="112.8" width="5.6" height="3.4" rx="1" fill={C.lens} {...H} />
      <path d="M117.5 110.4V109A2.2 2.2 0 0 1 121.9 109V110.4" fill={C.red} {...H} />
      {/* big lens */}
      <circle cx="104.5" cy="123.2" r="8.4" fill={C.top} {...I} />
      <circle cx="104.5" cy="123.2" r="5.6" fill={C.lens} {...T} />
      <circle cx="104.5" cy="123.2" r="3.3" fill={C.glass} />
      <circle cx="102.9" cy="121.6" r="1.3" fill="#FFFFFF" />
      <circle cx="106.3" cy="125" r="0.6" fill="#FFFFFF" opacity="0.8" />
      {/* sticker heart */}
      <path d="M118.8 125.4C118 124.3 116.3 124.7 116.5 126.1C116.7 127.4 118.8 128.6 118.8 128.6C118.8 128.6 120.9 127.4 121.1 126.1C121.3 124.7 119.6 124.3 118.8 125.4Z" fill={C.red} stroke={O} strokeWidth="0.9" strokeLinejoin="round" />
      {/* flash! */}
      <g className="ic-flash">
        <path d={spark(9)} transform="translate(93.2 114.5)" fill="#FFF8C9" stroke={O} strokeWidth="1" strokeLinejoin="round" />
        <circle cx="93.2" cy="114.5" r="2.2" fill="#FFFFFF" />
      </g>
    </g>
  )
}

// ---------- 3. cozy knit: a chunky striped hand-knitted scarf with a fringed end ----------
const K = { base: '#EE6F84', lo: '#C94E66', hi: '#FFA8B5', cream: '#FFF1D6', creamLo: '#EBD3AE', teal: '#69C2C0', tealLo: '#47A09F' }
const WRAP = 'M48.5 91C50 96 55 99.5 62 102.5C76 107.5 102 107.5 120 103C134 99.5 146 93 152.5 86C158 88 161 93 159.5 99C156 109 140 119 118 122.5C96 126 70 123 56 114C49 109.5 46.5 99 48.5 91Z'

function CozyKnit() {
  const clip = `bn-knit-${uid()}`
  const endClip = `bn-knitend-${uid()}`
  const end = 'M108 112L124.5 109.5L129.5 146L112.5 148.5Z'
  return (
    <g>
      <clipPath id={clip}>
        <path d={WRAP} />
      </clipPath>
      <clipPath id={endClip}>
        <path d={end} />
      </clipPath>
      {/* the hanging end, under the wrap, with its fringe swaying */}
      <g className="ck-end">
        <path d={end} fill={K.base} {...I} />
        <g clipPath={`url(#${endClip})`}>
          <path d="M105 124.5L130 121M105 132L131 128.4" {...line(K.cream, 4.4)} strokeLinecap="butt" />
          <path d="M105 139L132 135.2" {...line(K.teal, 3.4)} strokeLinecap="butt" />
          {/* knit: little v-stitches */}
          {[115, 120.5, 126, 131.5, 137, 142.5].map((y, r) =>
            [0, 1].map((c) => {
              const x = 112.4 + c * 7.6 + (y - 115) * 0.14
              const yy = y - c * 1.1
              return <path key={`${r}-${c}`} d={`M${x} ${yy}L${x + 2.2} ${yy + 2.6}L${x + 4.4} ${yy - 0.4}`} {...line(r === 2 || r === 3 ? K.creamLo : K.lo, 1.1)} />
            }),
          )}
        </g>
        <path d={end} fill="none" {...I} />
        <g className="ck-fringe">
          {[0, 1, 2, 3, 4].map((i) => {
            const x = 114.2 + i * 3.6
            const y = 148.3 - i * 0.5
            return (
              <g key={i}>
                <path d={`M${x} ${y}C${x - 0.8} ${y + 3} ${x + 0.8} ${y + 5} ${x} ${y + 7.5}`} {...line(O, 3.6)} />
                <path d={`M${x} ${y}C${x - 0.8} ${y + 3} ${x + 0.8} ${y + 5} ${x} ${y + 7.5}`} {...line(i % 2 ? K.cream : K.base, 1.8)} />
              </g>
            )
          })}
        </g>
      </g>
      {/* the wrap */}
      <path d={WRAP} fill={K.base} />
      <g clipPath={`url(#${clip})`}>
        <path d="M46 104C60 117 90 120 112 117.5C134 115 152 106 162 94" {...line(K.cream, 4.6)} />
        <path d="M46 97C62 110 90 113.5 112 111C134 108.5 150 100 160 88" {...line(K.teal, 2.8)} />
        {/* ribbing: soft dents across the chunky knit */}
        {[62, 76, 90, 104, 118, 132, 146].map((x, i) => (
          <path key={x} d={`M${x} ${106 - Math.abs(i - 3) * 1.6}l${-0.6 - (i - 3) * 0.5} 15`} {...line(K.lo, 1.2)} opacity="0.45" />
        ))}
        <path d="M58 110C70 117 86 120 98 120.4" {...line(K.hi, 2.2)} />
      </g>
      <path d={WRAP} fill="none" {...I} />
      {/* the fold where the end tucks in */}
      <path d="M106.5 117.5C110 120.5 117 121 123.5 118.4" {...line(K.lo, 1.6)} />
    </g>
  )
}

// ---------- 4. fishy bow tie: a little clownfish doing its best impression of a bow tie ----------
const F = { base: '#F8934A', lo: '#DD6E2C', hi: '#FFC48E', white: '#FFF8EE', fin: '#F27A3A', collar: '#FFFDF8', collarLo: '#E6DCD0' }

function FishyBowTie() {
  return (
    <g>
      <g transform="translate(104 113) rotate(-5) scale(1.3) translate(-104 -113)">
      {/* tail fin = the right wing, flapping */}
      <g className="fb-tail">
        <path d="M106.5 111L121.5 102.5C125 102 126.8 105 126.4 110.6C126 116.8 124 121.6 120.6 121.5L106.5 116.5Z" fill={F.base} {...I} />
        <path d="M120.6 103.2C123 107 123.2 116.6 120.4 120.8" {...line(O, 1.5)} />
        <path d="M121 103.4C124.4 104 125.6 107.4 125.4 111C125.2 115 124 119.6 121 120.6Z" fill={F.white} />
        <path d="M110 112.6L118 108.4M110.4 115L118.4 116.4" {...line(F.lo, 1.2)} />
      </g>
      {/* head = the left wing */}
      <path d="M101 110C96 104.4 88.4 103.4 84.4 107C81.4 109.8 81 114.6 83.2 118C86 122.4 94.8 122.6 101 117Z" fill={F.base} {...I} />
      <path d="M94.4 105.2C96.8 108.8 97 115.8 94.2 120.4" {...line(O, 1.5)} />
      <path d="M94.9 105.6C97 109.2 97.1 115.6 94.7 119.9L98 119.6C99.6 115.6 99.6 109.4 98 106.4Z" fill={F.white} />
      <path d="M86 108.4C87.2 106.6 89.2 105.6 91.2 105.5" {...line(F.hi, 1.8)} />
      {/* the face */}
      <g className="fb-eye">
        <circle cx="88.4" cy="111.6" r="2.6" fill={F.white} {...H} />
        <circle cx="87.9" cy="111.8" r="1.4" fill={O} />
        <circle cx="87.5" cy="111.2" r="0.5" fill="#FFFFFF" />
      </g>
      <path d="M83.4 115.6C82.2 115.6 81.6 116.6 82 117.4C82.4 118.2 83.6 118.2 84.2 117.4" fill="#F7A6A2" {...H} />
      <ellipse cx="90.4" cy="117.2" rx="2" ry="1.2" fill="#F29C9C" opacity="0.85" />
      {/* the knot: the fish's middle */}
      <rect x="99.6" y="107.8" width="8.8" height="11.6" rx="3.4" fill={F.fin} {...I} />
      <path d="M101.5 108.8C102.5 112 102.5 115.4 101.5 118.4" {...line(F.white, 1.8)} />
      <path d="M106.6 109.6V117.4" {...line(F.lo, 1.2)} />
      {/* little fins under the knot */}
      <path d="M100.6 119.2L98.6 123.2L104 121.4M107.4 119.2L109.8 122.8L104 121.4" fill={F.base} {...T} />
      {/* bubbles from the mouth */}
      <g className="fb-bub fb-bub-1">
        <circle cx="78.6" cy="112" r="2.2" fill="#DDF3F7" stroke={O} strokeWidth="1.1" />
        <circle cx="78" cy="111.3" r="0.6" fill="#FFFFFF" />
      </g>
      <g className="fb-bub fb-bub-2">
        <circle cx="79.6" cy="114.6" r="1.4" fill="#DDF3F7" stroke={O} strokeWidth="1" />
      </g>
      </g>
    </g>
  )
}

// ---------- 5. messy bib: a gingham bib after a very enthusiastic spaghetti dinner ----------
const B = { cloth: '#FFFDF6', clothLo: '#EDE3D2', red: '#E8554A', redLo: '#C63F37', check: '#F7A39C', sauce: '#E0533A', sauceLo: '#B83C2A', sauceHi: '#F58A6E', noodle: '#F7D57A', noodleLo: '#E1B24F', ball: '#9A5A3A', ballHi: '#C47E58', basil: '#6DB359' }
const BIB = 'M68 102C84 108.8 118 108.4 138 98C143 110 142 130 131 140.5C120 150.5 92 151.5 79.5 142C67.5 133 63.5 115 68 102Z'
const PANEL = 'M74.4 108.2C88 112.6 116 112.4 132.2 105.6C135.2 115.4 133.8 129.4 126 136.6C117 144.8 94 145.4 84 138C74.6 131 71.6 118.4 74.4 108.2Z'

function MessyBib() {
  const id = uid()
  const pat = `bn-gingham-${id}`
  return (
    <g>
      <defs>
        <pattern id={pat} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <rect width="7" height="7" fill={B.cloth} />
          <rect width="3.5" height="7" fill={B.check} />
          <rect width="7" height="3.5" fill={B.check} />
          <rect width="3.5" height="3.5" fill={B.red} />
        </pattern>
      </defs>
      {/* ties disappearing behind the neck */}
      <path d="M68.6 103.4C62 101 57.6 97.8 55.4 94.6M137.4 99.4C143 96 147.4 92.2 149.6 88.4" {...line(O, 4)} />
      <path d="M68.6 103.4C62 101 57.6 97.8 55.4 94.6M137.4 99.4C143 96 147.4 92.2 149.6 88.4" {...line(B.red, 2.2)} />
      <path d={BIB} fill={`url(#${pat})`} {...I} />
      <path d={PANEL} fill={B.cloth} {...T} />
      <path d={PANEL} fill="none" stroke={B.redLo} strokeWidth="0.9" strokeDasharray="1.8 1.8" transform="translate(104 124) scale(0.9) translate(-104 -124)" />
      <path d="M78.4 116C78 122.4 80 128.4 84 132.6" {...line(B.clothLo, 2.2)} />
      {/* the evidence */}
      <g transform="translate(104 125) scale(1.22) translate(-104 -125)">
      <path
        d="M100.5 118.4C104 116.4 108 117.6 109.4 120.2C112.6 119.6 115.4 121.6 114.6 124.4C117.6 126.2 116.6 130.4 113 130.6C112.6 134 108.4 135.2 105.8 133C103 135.6 98.2 134.6 98 131.2C94.2 131.4 92.6 127.6 95.2 125.4C93 122.4 96 119 99.6 120.2Z"
        fill={B.sauce}
        {...T}
      />
      <circle cx="91" cy="121" r="1.7" fill={B.sauce} {...H} />
      <circle cx="118.6" cy="118.8" r="1.3" fill={B.sauce} {...H} />
      <circle cx="117.4" cy="133.6" r="1.1" fill={B.sauce} {...H} />
      <path d="M99.4 123.6C100.6 122 102.4 121.4 104.2 121.6" {...line(B.sauceHi, 1.6)} />
      {/* a loyal noodle, hanging on for dear life */}
      <g className="mb-noodle">
        <path d="M108 126.6C113 129 107.6 133 110.6 136.6C113.6 140 108.6 143.6 111.4 147.4C113 149.6 111.6 152.4 109.4 153.6" {...line(O, 4.4)} />
        <path d="M108 126.6C113 129 107.6 133 110.6 136.6C113.6 140 108.6 143.6 111.4 147.4C113 149.6 111.6 152.4 109.4 153.6" {...line(B.noodle, 2.4)} />
      </g>
      <path d="M96.4 129.4C99.8 126.4 102.6 131.6 106 128.4C108 126.6 110.6 127.4 112.4 128.8" {...line(O, 4)} />
      <path d="M96.4 129.4C99.8 126.4 102.6 131.6 106 128.4C108 126.6 110.6 127.4 112.4 128.8" {...line(B.noodle, 2.2)} />
      {/* meatball with a basil leaf */}
      <circle cx="103.4" cy="124.4" r="4.4" fill={B.ball} {...T} />
      <path d="M100.8 122.8C101.4 121.6 102.6 120.8 104 120.8" {...line(B.ballHi, 1.4)} />
      <circle cx="105.2" cy="126.2" r="0.6" fill={B.sauceLo} />
      <path d="M106.2 120.4C108 118 111.2 117.8 112.4 119.2C110.8 121.4 108 121.8 106.2 120.4Z" fill={B.basil} {...H} />
      </g>
    </g>
  )
}

export const PICK_NECK = [
  { id: 'pondpearls', name: 'Pond pearls', slot: 'neck', hobby: 'crafts', box: '52 84 106 62', axo: <PondPearls /> },
  { id: 'instantcam', name: 'Instant cam', slot: 'neck', hobby: 'photo', box: '56 88 98 62', axo: <InstantCam /> },
  { id: 'cozyknit', name: 'Cozy knit', slot: 'neck', hobby: 'crafts', box: '44 82 120 80', axo: <CozyKnit /> },
  { id: 'fishybowtie', name: 'Fishy bow tie', slot: 'neck', hobby: 'other', box: '70 92 66 44', axo: <FishyBowTie /> },
  { id: 'messybib', name: 'Messy bib', slot: 'neck', hobby: 'cooking', box: '50 84 104 74', axo: <MessyBib /> },
]
