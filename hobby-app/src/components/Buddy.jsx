// The axolotl's outfits: you pick one each time you finish a project.
// The items themselves are drawn in src/outfits/ (one file per slot, see its README); this file collects them,
// puts them on the axolotl and runs the put-on animation (src/outfits/wear.css).
import { HEAD } from '../outfits/head'
import { EYES } from '../outfits/eyes'
import { NECK } from '../outfits/neck'
import { GILLS } from '../outfits/gills'
import { PICK_HEAD } from '../outfits/pick-head'
import { PICK_EYES } from '../outfits/pick-eyes'
import { PICK_NECK } from '../outfits/pick-neck'
import { PICK_GILLS } from '../outfits/pick-gills'
import '../outfits/wear.css'

// Every outfit is earned the same way: finish a project and you pick one (components/OutfitPick.jsx).
// hobby: the kind of project it's shown first for.
export const OUTFITS = [...HEAD, ...EYES, ...NECK, ...GILLS, ...PICK_HEAD, ...PICK_EYES, ...PICK_NECK, ...PICK_GILLS]

export const SLOTS = [
  { id: 'head', label: 'Hats' },
  { id: 'eyes', label: 'Glasses' },
  { id: 'neck', label: 'Neck' },
  { id: 'gills', label: 'Gills' },
]
export const SLOT_IDS = SLOTS.map((s) => s.id)

// The first wardrobe (generic hats and glasses) → the axolotl-made one, same unlock day
export const RENAMED = {
  cap: 'lilypad',
  sunglasses: 'snorkel',
  bowtie: 'duckfloat',
  nerd: 'monocle',
  beanie: 'frog',
  party: 'snail',
  crown: 'shellcrown',
  scarf: 'kelp',
  hearts: 'pixel',
  wizard: 'jelly',
  beret: 'painter',
  headband: 'swimcap',
  chef: 'loaf',
}

export const outfitItem = (id) => OUTFITS.find((o) => o.id === id)

// Where each slot lands from, for the put-on animation and its sparkles (axolotl coords)
const ANCHOR = { head: [104, 46], eyes: [104, 80], neck: [106, 112] }

function Poof({ slot }) {
  const [x, y] = ANCHOR[slot]
  return (
    <g className="axo-poof" transform={`translate(${x} ${y})`}>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i} style={{ '--a': `${i * 51 + 10}deg`, '--i': i }}>
          {i % 2 ? (
            <circle className="axo-poof-bit" r="2.6" fill="#FFF3B0" stroke="#4A1A0E" strokeWidth="1.1" />
          ) : (
            <path className="axo-poof-bit" d="M0-6L1.6-1.6L6 0L1.6 1.6L0 6L-1.6 1.6L-6 0L-1.6-1.6Z" fill="#F2B544" stroke="#4A1A0E" strokeWidth="1.1" strokeLinejoin="round" />
          )}
        </g>
      ))}
    </g>
  )
}

// One worn item. `fresh` plays the put-on animation, `leaving` the take-off one; keyed by the caller so a
// re-equip restarts it.
function Worn({ item, slot, fresh, leaving }) {
  return (
    <g className="axo-wear" data-slot={slot} data-item={item.id} data-fresh={fresh ? '' : undefined} data-leaving={leaving ? '' : undefined}>
      <g className={`axo-acc axo-acc-${item.id}`}>{item.axo}</g>
    </g>
  )
}

// The worn outfit, as SVG for inside the axolotl's head group (so it moves with the head).
// anim: { n, on: { slot: id }, off: { slot: id } } while something is being put on or taken off.
export function AxoOutfit({ outfit = {}, anim }) {
  return (
    <g className="axo-outfit" pointerEvents="none">
      {['neck', 'eyes', 'head'].map((slot) => {
        const item = outfitItem(outfit[slot])
        const gone = anim?.off[slot] && outfitItem(anim.off[slot])
        const fresh = !!item && anim?.on[slot] === item.id
        return (
          <g key={slot}>
            {gone && <Worn key={`off-${anim.n}`} item={gone} slot={slot} leaving />}
            {item && <Worn key={fresh ? `on-${anim.n}` : item.id} item={item} slot={slot} fresh={fresh} />}
            {fresh && <Poof key={`poof-${anim.n}`} slot={slot} />}
          </g>
        )
      })}
    </g>
  )
}

// The gill item on one gill tip, drawn inside that gill's group so it sways with it
export function GillTip({ item, tip, fresh, leaving }) {
  return (
    <g className="axo-outfit" pointerEvents="none" transform={`translate(${tip.x} ${tip.y})`}>
      <g className="axo-wear" data-slot="gills" data-item={item.id} data-fresh={fresh ? '' : undefined} data-leaving={leaving ? '' : undefined} style={{ '--i': tip.i, '--s': tip.side === 'r' ? 1 : 0 }}>
        <g className={`axo-acc axo-acc-${item.id}`}>{item.tip(tip)}</g>
      </g>
    </g>
  )
}

// Three gill tips for the wardrobe tile
const TILE_TIPS = [
  { x: 14, y: 30, r: 8, i: 2, side: 'l', d: 'M30 52C24 46 19 40 14 30' },
  { x: 32, y: 16, r: 8, i: 0, side: 'l', d: 'M32 52C32 40 32 28 32 16' },
  { x: 50, y: 30, r: 8, i: 1, side: 'r', d: 'M34 52C40 46 45 40 50 30' },
]

// Just one outfit item on its own, for the wardrobe tiles
export function OutfitPreview({ item, className = 'h-12 w-12' }) {
  if (item.slot === 'gills') {
    return (
      <svg viewBox="2 2 60 52" className={className} aria-hidden="true">
        {TILE_TIPS.map((t) => (
          <g key={t.x}>
            <path d={t.d} fill="none" stroke="#4A1A0E" strokeWidth="6.2" strokeLinecap="round" />
            <path d={t.d} fill="none" stroke="#93432E" strokeWidth="4" strokeLinecap="round" />
            <circle cx={t.x} cy={t.y} r={t.r} fill="#E8A08C" stroke="#4A1A0E" strokeWidth="1.8" />
            <g transform={`translate(${t.x} ${t.y})`} className={`axo-acc axo-acc-${item.id}`}>
              {item.tip(t)}
            </g>
          </g>
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox={item.box} className={className} overflow="visible" aria-hidden="true">
      <g className={`axo-acc axo-acc-${item.id}`}>{item.axo}</g>
    </svg>
  )
}
