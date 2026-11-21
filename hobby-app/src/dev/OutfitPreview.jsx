// Dev only (outfit-preview.html?set=pick-head): every item of one outfit file on the axolotl, for screenshots.
import React from 'react'
import ReactDOM from 'react-dom/client'
import Mascot from '../assistant/Mascot'
import { OutfitPreview } from '../components/Buddy'
import { HEAD } from '../outfits/head'
import { EYES } from '../outfits/eyes'
import { NECK } from '../outfits/neck'
import { GILLS } from '../outfits/gills'
import { PICK_HEAD } from '../outfits/pick-head'
import { PICK_EYES } from '../outfits/pick-eyes'
import { PICK_NECK } from '../outfits/pick-neck'
import { PICK_GILLS } from '../outfits/pick-gills'
import '../index.css'

const SETS = { head: HEAD, eyes: EYES, neck: NECK, gills: GILLS, 'pick-head': PICK_HEAD, 'pick-eyes': PICK_EYES, 'pick-neck': PICK_NECK, 'pick-gills': PICK_GILLS }
const q = new URLSearchParams(location.search)
const items = SETS[q.get('set') || 'head'] || []
const only = q.get('id')

function Row({ item }) {
  const outfit = { [item.slot]: item.id }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, borderBottom: '1px solid #ddd' }}>
      <b style={{ width: 120, fontSize: 14 }}>{item.id}<br />{item.name}</b>
      <Mascot size={200} peek outfit={outfit} mood="idle" />
      <Mascot size={200} outfit={outfit} mood="happy" />
      <Mascot size={36} peek outfit={outfit} />
      <div style={{ width: 90, height: 90, background: '#fff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <OutfitPreview item={item} className="h-14 w-14" />
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <div style={{ background: '#FBF5EC', minHeight: '100vh' }}>
    {items.filter((i) => !only || i.id === only).map((i) => <Row key={i.id} item={i} />)}
    {!items.length && <p style={{ padding: 20 }}>No items in this set yet.</p>}
  </div>,
)
