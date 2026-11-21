import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SPRING } from '../motion.js'

// Bottom Sheet wie bei iOS: Glas, Griff oben, nach unten wischen oder Escape schließt.
export default function Sheet({ open, onClose, title, children, action }) {
  return <AnimatePresence>{open && <Panel onClose={onClose} title={title} action={action}>{children}</Panel>}</AnimatePresence>
}

function Panel({ onClose, title, action, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const prev = document.activeElement
    ref.current?.focus({ preventScroll: true })
    const onKey = (e) => e.key === 'Escape' && onClose()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        ref={ref}
        tabIndex={-1}
        className="sheet relative max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-[28px] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-sheet outline-none lg:rounded-[28px]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={SPRING}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 600) && onClose()}
      >
        <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-label3/60" />
        {title && (
          <div className="relative flex min-h-[44px] items-center justify-center px-16 pt-1">
            <h2 className="text-center text-[17px] font-semibold text-label">{title}</h2>
            {action && <div className="absolute right-3 top-1">{action}</div>}
          </div>
        )}
        <div onPointerDownCapture={(e) => e.stopPropagation()}>{children}</div>
      </motion.div>
    </div>
  )
}

// Bestätigung wie ein iOS-Aktionsblatt: Frage, eine (rote) Aktion, Abbrechen.
export function ConfirmSheet({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive = true }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:items-center" role="alertdialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel} />
          <motion.div className="relative w-full max-w-md" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} transition={SPRING}>
            <div className="sheet overflow-hidden rounded-[14px] text-center">
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-semibold text-label2">{title}</p>
                {message && <p className="mt-0.5 text-[13px] text-label2">{message}</p>}
              </div>
              <button autoFocus onClick={onConfirm} className={`min-h-[56px] w-full border-t border-sep/30 text-[20px] ${destructive ? 'text-danger' : 'text-accent-text'} active:bg-fill/20`}>
                {confirmLabel}
              </button>
            </div>
            <button onClick={onCancel} className="mt-2 min-h-[56px] w-full rounded-[14px] bg-surface text-[20px] font-semibold text-accent-text active:bg-fill/20 dark:bg-raised">
              {cancelLabel}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
