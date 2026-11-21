import { useId } from 'react'
import './neck.css'

// Neckwear, drawn under the chin in the axolotl's 200x200 box (see README.md for the geometry).
// Paws are drawn on top of these, so the middle (x 98–110) and the sides beyond the paws stay readable.

const O = '#4A1A0E'

// Yellow plastic for the duck floatie
const Y = { hi: '#FFF4BD', base: '#FFD84D', lo: '#F2B637', beak: '#F6973A', beakLo: '#E2772A' }

function DuckFloat() {
  return (
    <g className="df-bob">
      {/* the ring is the duck's body: a fat tube around the neck, head poking up on one side, tail on the other */}
      <path d="M40 93C34.5 89 31 82 31.5 74.5C34 73.5 36 75.5 37.5 78C40 81.5 43.5 84 46.5 87Z" fill={Y.base} stroke={O} strokeWidth="2" strokeLinejoin="round" />
      {/* the hole: the neck in shadow between chin and tube */}
      <path
        d="M49 91.5C57 104 80 112 104 112C126 112 146 101 153 85C146 92 134 99 120 102.5C102 107 76 107 62 102C55 99.5 50.5 96 49 91.5Z"
        fill="#C97A63"
      />
      <path
        d="M49 91.5C45 87 38 86.5 34.5 91C29.5 97.5 31 109 40 117C52 127 74 133 100 133.5C128 134 152 126 164 112.5C172 103 172 90 163 84C159 81.5 155 82 153 85C146 101 126 112 104 112C80 112 57 104 49 91.5Z"
        fill={Y.base}
        stroke={O}
        strokeWidth="2.3"
        strokeLinejoin="round"
      />
      {/* shade underneath, gloss on top */}
      <path d="M38 112C50 123 74 129.5 100 130C126 130.5 148 123 160 111" fill="none" stroke={Y.lo} strokeWidth="5" strokeLinecap="round" />
      <path d="M62 112.5C72 117 84 119.5 95 120.2" fill="none" stroke={Y.hi} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="101.5" cy="120.6" r="1.7" fill={Y.hi} />
      <path d="M36 99C36 103 37.5 106.5 40 109" fill="none" stroke={Y.hi} strokeWidth="2.4" strokeLinecap="round" />
      {/* seams of the inflatable */}
      <path d="M79 109.8C78 115.5 78.5 124 80.5 130.6M134 106.6C136 113 136.6 120.6 135.5 127" fill="none" stroke={Y.lo} strokeWidth="1.5" strokeLinecap="round" />
      {/* valve nub */}
      <circle cx="119" cy="124.5" r="3.6" fill={Y.lo} stroke={O} strokeWidth="1.7" />
      <circle cx="118.6" cy="123.9" r="1.5" fill={Y.hi} />
      {/* the duck, nodding along */}
      <g className="df-duck">
        <path d="M155.5 112C153 105 154.5 98 158.5 93H171.5C177 97 179 103 174.5 108C172 110.5 168 111 165 111.5Z" fill={Y.base} />
        <path d="M155.5 112C153 105 154.5 98 158.5 93M171.5 93C177 97 179 103 174.5 108C172.5 110 169.5 110.8 166.5 111.2" fill="none" stroke={O} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M158 105C157.5 101.5 158.3 98.5 160 96" fill="none" stroke={Y.hi} strokeWidth="2" strokeLinecap="round" />
        <circle cx="165" cy="85.5" r="12" fill={Y.base} stroke={O} strokeWidth="2.2" />
        <path d="M156.3 81.5C157.3 77.5 160.5 75 164.5 74.4" fill="none" stroke={Y.hi} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M164.5 73.6C163 70 164.5 67.2 167.8 66.6" fill="none" stroke={O} strokeWidth="1.9" strokeLinecap="round" />
        <path d="M174.8 85C180 81 188 81.5 190.5 85.3C192.3 88.7 188.4 92.6 182.2 92.6C178.3 92.6 175.6 91 174.8 88.6Z" fill={Y.beak} stroke={O} strokeWidth="2" strokeLinejoin="round" />
        <path d="M176 88.7C180.4 89.4 184.8 88.8 189.3 87.2" fill="none" stroke={O} strokeWidth="1.3" strokeLinecap="round" />
        <path d="M178.5 84.4C180.7 83.5 183 83.3 185.2 83.5" fill="none" stroke="#FFC98A" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="169.6" cy="82" rx="2.2" ry="2.8" fill={O} />
        <circle cx="170.4" cy="80.9" r="0.9" fill="#FFF9F2" />
        <ellipse cx="166" cy="89.8" rx="3.2" ry="1.9" fill="#F59A6E" opacity="0.6" />
      </g>
    </g>
  )
}

// Kelp greens
const K = { hi: '#BCE59A', base: '#84C36A', lo: '#5A9A4C', under: '#4C8644', rib: '#477C3D', bulb: '#C8B85A', bulbHi: '#E9DC8C' }

function KelpScarf() {
  return (
    <g>
      {/* the wrap: two chunky turns of ruffled kelp hugging the chin */}
      <path
        d="M53 102Q49 111 57 114.5Q63 121.5 73 120.5Q82 127.5 93 125Q103 129.5 113 123.5Q123 127 130.5 118.5Q141 119.5 145 111Q154.5 110 157 100L150 100C130 110 80 115 54 100Z"
        fill={K.under}
        stroke={O}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M49 92C50.5 96 55 99.5 62 102.5C76 107.5 102 107.5 120 103C134 99.5 146 93 152.5 86C157 88 160 92 159 96Q156 102 150 101.5Q147 108 140 106.5Q136 113.5 128 112Q123 119 115 117Q109 123.5 101 121Q94 125 87 120.5Q79 122 74 116.5Q66 117 62 112Q55 111 53 106Q47 103 47.5 98Q47 95 49 92Z"
        fill={K.base}
        stroke={O}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* folds of the wrap, the rib running along it, a bit of sheen */}
      <path d="M66 104C69.5 107.5 71 111.5 70.5 115M138 99.5C140 102 140.5 104.5 140 106.5" fill="none" stroke={K.lo} strokeWidth="2" strokeLinecap="round" />
      <path d="M55 101C68 108.5 90 114 113 112C128 110.5 142 104.5 152 95" fill="none" stroke={K.rib} strokeWidth="1.4" strokeLinecap="round" strokeDasharray="6 4.5" />
      <path d="M74 107.8C82 109.8 90 110.6 98 110.6M118 107C125 106 131 104.2 135 102.4" fill="none" stroke={K.hi} strokeWidth="2.3" strokeLinecap="round" />
      {/* the loose ends: ruffly kelp blades */}
      <g className="kelp-end kelp-end-l">
        <path
          d="M97 118Q91 122 93.5 127Q88 131.5 91.5 136.5Q86.5 141.5 90 146.5Q87.5 152.5 93.5 154.5Q99 155 100 149.5Q105.5 145 102 140Q107.5 135.5 104 130.5Q109.5 126 106 120.5Z"
          fill={K.base}
          stroke={O}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M101 121C98.5 131 97.5 141 94.5 151" fill="none" stroke={K.rib} strokeWidth="1.4" strokeLinecap="round" />
        <path d="M95.5 128C94.8 131 94.5 133.5 94.6 136" fill="none" stroke={K.hi} strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <g className="kelp-end kelp-end-r">
        <path
          d="M104 119Q107 125.5 112 126Q112.5 132.5 117.5 133.5Q118 140 123 141Q125.5 147 130 145.5Q132.5 141 128.5 137.5Q129.5 131.5 124 129.5Q124.5 123.5 118.5 122Q117 116.5 110 117Z"
          fill={K.lo}
          stroke={O}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M108 120C114 127 120 135 127 142" fill="none" stroke={K.rib} strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* knot: a kelp float bulb */}
      <circle cx="103.5" cy="118.5" r="6.2" fill={K.bulb} stroke={O} strokeWidth="2" />
      <path d="M100 116.5C100.8 115 102.2 114 103.8 113.8" fill="none" stroke={K.bulbHi} strokeWidth="1.8" strokeLinecap="round" />
      {/* bubbles */}
      <g className="kelp-bub kelp-bub-1">
        <circle cx="80" cy="140" r="3.4" fill="#DDF3F7" stroke={O} strokeWidth="1.4" />
        <circle cx="78.9" cy="138.8" r="1" fill="#FFFFFF" />
      </g>
      <g className="kelp-bub kelp-bub-2">
        <circle cx="138" cy="139" r="2.6" fill="#DDF3F7" stroke={O} strokeWidth="1.3" />
        <circle cx="137.2" cy="138.2" r="0.7" fill="#FFFFFF" />
      </g>
      <g className="kelp-bub kelp-bub-3">
        <circle cx="143" cy="130" r="1.7" fill="#DDF3F7" stroke={O} strokeWidth="1.1" />
      </g>
    </g>
  )
}

// Gold
const G = { hi: '#FFF1B0', base: '#F6C443', lo: '#D99A2B', deep: '#B97A1E', rib: '#5FB7C7', ribLo: '#3F95A8', stripe: '#F49AA8' }

// Little stars stamped round the rim: [x, y] centres
const RIM_STARS = Array.from({ length: 8 }, (_, i) => {
  const a = (Math.PI * 2 * i) / 8 - Math.PI / 2 + Math.PI / 8
  return [104 + 13 * Math.cos(a), 129 + 13 * Math.sin(a)]
})
const star = (x, y, r) => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * i) / 5 - Math.PI / 2
    const rr = i % 2 ? r * 0.45 : r
    d += `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(2)} ${(y + rr * Math.sin(a)).toFixed(2)}`
  }
  return d + 'Z'
}

function Medal() {
  const clip = `neck-medal-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <g>
      {/* ribbon: two wide straps from behind the neck, crossing at the medal */}
      <path d="M130 99.8L115 104L99 119.5L110 121Z" fill={G.ribLo} stroke={O} strokeWidth="2" strokeLinejoin="round" />
      <path d="M122.5 101.9L104.5 120.3" stroke={G.stripe} strokeWidth="2.6" />
      <path d="M77 104.8L93 106.2L109 119.5L98 121Z" fill={G.rib} stroke={O} strokeWidth="2" strokeLinejoin="round" />
      <path d="M85 105.5L103.5 120.3" stroke={G.stripe} strokeWidth="2.6" />
      <path d="M80.5 106.6L85 110.4" stroke="#A9E2EA" strokeWidth="1.6" strokeLinecap="round" />
      <g className="medal-swing">
        <rect x="98.5" y="112.6" width="11" height="5.4" rx="2" fill={G.lo} stroke={O} strokeWidth="1.8" />
        <circle cx="104" cy="129" r="15" fill={G.lo} stroke={O} strokeWidth="2.3" />
        {RIM_STARS.map(([x, y], i) => (
          <path key={i} d={star(x, y, 1.9)} fill={G.hi} />
        ))}
        <circle cx="104" cy="129" r="10.6" fill={G.base} stroke={G.deep} strokeWidth="1" strokeOpacity="0.6" />
        <clipPath id={clip}>
          <circle cx="104" cy="129" r="14" />
        </clipPath>
        {/* stamped axolotl: gills, head, eyes, smile */}
        <g fill={G.deep} stroke={G.deep} strokeWidth="1.3" strokeLinecap="round">
          <path d="M98.6 127.4L95.6 124.2M97.8 130.4L94.2 129.6M98.6 133.2L95.4 135.2M109.4 127.4L112.4 124.2M110.2 130.4L113.8 129.6M109.4 133.2L112.6 135.2" />
          <circle cx="95" cy="123.6" r="1.4" stroke="none" />
          <circle cx="93.6" cy="129.4" r="1.4" stroke="none" />
          <circle cx="94.8" cy="135.6" r="1.4" stroke="none" />
          <circle cx="113" cy="123.6" r="1.4" stroke="none" />
          <circle cx="114.4" cy="129.4" r="1.4" stroke="none" />
          <circle cx="113.2" cy="135.6" r="1.4" stroke="none" />
        </g>
        <path d="M97.4 130.5C97.4 126.6 100.4 124.6 104 124.6C107.6 124.6 110.6 126.6 110.6 130.5C110.6 133.6 107.6 135.4 104 135.4C100.4 135.4 97.4 133.6 97.4 130.5Z" fill={G.lo} stroke={G.deep} strokeWidth="1.3" />
        <circle cx="101.2" cy="129.6" r="1.15" fill={O} />
        <circle cx="106.8" cy="129.6" r="1.15" fill={O} />
        <path d="M102.6 132.2Q104 133.4 105.4 132.2" fill="none" stroke={O} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M99.4 127.6C100.4 126.4 101.8 125.8 103.2 125.7" fill="none" stroke={G.hi} strokeWidth="1.1" strokeLinecap="round" />
        <path d="M95.4 123.4C96.8 120.4 99.6 118.6 102.6 118.2" fill="none" stroke={G.hi} strokeWidth="1.7" strokeLinecap="round" />
        {/* the shine that sweeps across */}
        <g clipPath={`url(#${clip})`}>
          <g className="medal-sweep">
            <path d="M68 148L79 108H85L74 148Z" fill="#FFFFFF" opacity="0.75" />
          </g>
        </g>
        <g className="medal-glint">
          <path d="M117 112.5L118.2 116.3L122 117.5L118.2 118.7L117 122.5L115.8 118.7L112 117.5L115.8 116.3Z" fill="#FFFFFF" stroke={O} strokeWidth="1" strokeLinejoin="round" />
        </g>
      </g>
    </g>
  )
}

export const NECK = [
  { id: 'duckfloat', name: 'Duck floatie', hobby: 'other', slot: 'neck', box: '29 62 165 75', axo: <DuckFloat /> },
  { id: 'kelp', name: 'Kelp scarf', hobby: 'garden', slot: 'neck', box: '42 80 120 78', axo: <KelpScarf /> },
  { id: 'medal', name: 'Champion medal', hobby: 'fitness', slot: 'neck', box: '74 96 56 52', axo: <Medal /> },
]
