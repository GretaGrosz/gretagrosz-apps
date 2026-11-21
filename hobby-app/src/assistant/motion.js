// Bridge to the axolotl's one-shot motion (src/axolotl/motion.js, through src/axolotl/index.js). Every helper settles, never throws.
import { boop, hop, lookAt as look, peekIn, peekOut, streakBump } from '../axolotl'

export const svgIn = (el) => (el?.matches?.('svg.axo') ? el : el?.querySelector?.('svg.axo') || null)
const safe = (fn) => (el, ...rest) => (el ? Promise.resolve(fn(el, ...rest)).catch(() => {}) : Promise.resolve())

export const fx = {
  boop: safe(boop),
  hop: safe(hop),
  peekIn: safe(peekIn),
  peekOut: safe(peekOut),
  lookAt: safe((el, target) => look(el, target)),
  streakBump: safe((el, from, to) => streakBump(el, from, to)),
}
