// The axolotl as the rest of the app uses it (art: src/axolotl/Axolotl.jsx, motion: src/axolotl/motion.js).
// The wrapper span is what refs point at; the motion helpers find the svg.axo inside it.
// outfit: the hat / glasses / neckwear / gill bling you unlocked, drawn inside the axolotl's head group (and gill
// groups) so it moves with it. Changing it plays the put-on / take-off animation (src/outfits/wear.css).
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Axolotl } from '../axolotl'
import { AxoOutfit, GillTip, outfitItem, SLOT_IDS } from '../components/Buddy'
import { useStore } from '../store'

const PUT_ON_MS = 1300

// Decorative unless given a title: everywhere in the app it sits inside a labelled button or link.
// It wears what you dressed it in unless told otherwise (outfit={} for someone else's axolotl).
const Mascot = forwardRef(function Mascot({ size = 96, className = '', outfit: given, title, mood, ...props }, ref) {
  const store = useStore()
  const outfit = (given === undefined ? store?.data.me.outfit : given) || {}
  const box = useRef(null)
  const [parts, setParts] = useState(null) // { head, gills: [{ el, x, y, r, i, side }] }
  const [anim, setAnim] = useState(null) // { n, on: { slot: id }, off: { slot: id } }
  const prev = useRef(outfit)
  const wearing = SLOT_IDS.some((s) => outfit[s])
  const setRefs = useCallback(
    (el) => {
      box.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) ref.current = el
    },
    [ref],
  )

  // Something changed slot: put the new thing on (and toss the old one), never on the first render
  const key = SLOT_IDS.map((s) => outfit[s] || '').join('|')
  useLayoutEffect(() => {
    const before = prev.current
    prev.current = outfit
    const on = {}
    const off = {}
    for (const s of SLOT_IDS) {
      if ((before[s] || null) === (outfit[s] || null)) continue
      if (outfit[s]) on[s] = outfit[s]
      if (before[s]) off[s] = before[s]
    }
    if (Object.keys(on).length || Object.keys(off).length) setAnim({ n: Date.now(), on, off })
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!anim) return
    const t = setTimeout(() => setAnim(null), PUT_ON_MS)
    return () => clearTimeout(t)
  }, [anim])

  // Find the head and gills after every render: the art may swap its groups when the mood or layout changes
  const show = wearing || !!anim
  useLayoutEffect(() => {
    const svg = show ? box.current?.querySelector('svg.axo') : null
    const head = svg?.querySelector('.axo-head') || null
    const gills = svg
      ? [...svg.querySelectorAll('.axo-gill')].map((el) => {
          const c = el.querySelector('.axo-gill-tip')
          const side = el.closest('.axo-gills-r') ? 'r' : 'l'
          return { el, x: +c.getAttribute('cx'), y: +c.getAttribute('cy'), r: +c.getAttribute('r'), i: +el.style.getPropertyValue('--i') || 0, side }
        })
      : []
    const same = parts && parts.head === head && parts.gills.length === gills.length && parts.gills.every((g, i) => g.el === gills[i].el)
    if (!same) setParts(head ? { head, gills } : null)
  })

  const live = parts?.head?.isConnected
  const gill = outfitItem(outfit.gills)
  const gillGone = anim?.off.gills && outfitItem(anim.off.gills)
  return (
    <span ref={setRefs} className={`axo-wrap inline-block shrink-0 align-middle leading-[0] ${className}`} style={{ width: size, height: size }} aria-hidden={title ? undefined : true}>
      {/* Trying something on is exciting: a little cheer while it lands */}
      <Axolotl size={size} title={title || undefined} mood={anim && Object.keys(anim.on).length ? 'cheer' : mood} {...props} />
      {live && createPortal(<AxoOutfit outfit={outfit} anim={anim} />, parts.head)}
      {live &&
        parts.gills.map((tip, i) => (
          <GillPortal key={i} tip={tip} item={gill} gone={gillGone} anim={anim} />
        ))}
    </span>
  )
})
export default Mascot

function GillPortal({ tip, item, gone, anim }) {
  if (!tip.el.isConnected || (!item && !gone)) return null
  const fresh = !!item && anim?.on.gills === item.id
  return createPortal(
    <>
      {gone && <GillTip key={`off-${anim.n}`} item={gone} tip={tip} leaving />}
      {item && <GillTip key={fresh ? `on-${anim.n}` : item.id} item={item} tip={tip} fresh={fresh} />}
    </>,
    tip.el,
  )
}
