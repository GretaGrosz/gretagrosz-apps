import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SPRING } from '../../motion.js'
import { Portrait } from './MetaUI.jsx'

// Hilfen beim Spielen: Pfeile am Bildschirmrand zu Stationen, die gerade etwas brauchen, und Oma Schildis
// Hinweis-Karte am Einführungstag.

/**
 * Pfeile am Rand für Ziele außerhalb des Bildes. needsRef.current: [{ id, icon, x, z, sx, sy }] (sx/sy rechnet die
 * 3D-Szene jedes Bild aus). items: dieselbe Liste für React (nur id + icon). Antippen → onGo(item): Loopy läuft hin.
 */
export function EdgeArrows({ needsRef, items, onGo, top = 104, bottom = 150 }) {
  const els = useRef({})
  useEffect(() => {
    let id
    const loop = () => {
      const W = window.innerWidth
      const H = window.innerHeight
      const m = 34
      for (const n of needsRef.current ?? []) {
        const el = els.current[n.id]
        if (!el) continue
        const inside = n.sx > m && n.sx < W - m && n.sy > top && n.sy < H - bottom
        if (n.sx === undefined || inside) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
          continue
        }
        const cx = W / 2
        const cy = (top + H - bottom) / 2
        const dx = n.sx - cx
        const dy = n.sy - cy
        const k = Math.min((W / 2 - m) / Math.max(1e-3, Math.abs(dx)), ((H - bottom - top) / 2) / Math.max(1e-3, Math.abs(dy)))
        const x = cx + dx * k
        const y = cy + dy * k
        el.style.transform = `translate(${x - 27}px, ${y - 27}px)`
        el.style.opacity = '1'
        el.style.pointerEvents = 'auto'
        const arrow = el.firstChild
        if (arrow) arrow.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`
      }
      id = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(id)
  }, [needsRef, top, bottom])

  return items.map((n) => (
    <button
      key={n.id}
      ref={(el) => (els.current[n.id] = el)}
      onPointerDown={(e) => {
        e.stopPropagation()
        onGo(n)
      }}
      aria-label={n.label ?? n.icon}
      className={`game-float absolute left-0 top-0 z-[11] flex h-[54px] w-[54px] items-center justify-center rounded-full transition-opacity duration-200 ${n.guide ? 'bg-[#FF5E8A]' : 'bg-surface'}`}
      style={{ opacity: 0, pointerEvents: 'none' }}
    >
      {/* Spitze, die zum Ziel zeigt */}
      <span className="pointer-events-none absolute inset-0">
        <span className={`absolute right-[-9px] top-1/2 h-0 w-0 -translate-y-1/2 border-y-[8px] border-l-[11px] border-y-transparent ${n.guide ? 'border-l-[#FF5E8A]' : 'border-l-white'}`} />
      </span>
      <span className="relative text-[24px] leading-none" aria-hidden>
        {n.icon}
      </span>
    </button>
  ))
}

/** Oma Schildis Hinweis oben im Bild (Einführungstag). */
export function CoachCard({ lang, text, step, steps, onSkip, skipLabel, action, onAction }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(max(12px,env(safe-area-inset-top))+64px)] z-[12] px-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={text}
          initial={{ y: -14, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={SPRING}
          className="game-float pointer-events-auto mx-auto flex max-w-xl items-start gap-3 rounded-[22px] bg-surface/95 p-3 pr-4 backdrop-blur"
        >
          <div className="flex-none">
            <Portrait who="schildi" size={46} lang={lang} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug">{text}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {Array.from({ length: steps }, (_, i) => (
                <span key={i} className={`h-1.5 rounded-full ${i < step ? 'w-3 bg-[#3FBF98]' : i === step ? 'w-5 bg-[#3FBF98]' : 'w-1.5 bg-fill/25'}`} />
              ))}
              <span className="flex-1" />
              {action ? (
                <button onClick={onAction} className="rounded-full bg-accent px-4 py-1.5 text-[15px] font-bold text-white active:opacity-80">
                  {action}
                </button>
              ) : (
                <button onClick={onSkip} className="px-1 text-[13px] font-semibold text-label3 active:opacity-60">
                  {skipLabel}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
