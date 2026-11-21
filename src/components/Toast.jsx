import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { SPRING, isFocusRoute } from '../motion.js'

// Kurze Meldung unten (z. B. "Prüfung gelöscht · Rückgängig"). Verschwindet nach `duration` ms.
export default function Toast({ toast, onClose, duration = 5000 }) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(onClose, duration)
    return () => clearTimeout(id)
  }, [toast, onClose, duration])
  const bottom = isFocusRoute(pathname) ? 'bottom-[calc(env(safe-area-inset-bottom)+96px)]' : 'bottom-[calc(max(12px,env(safe-area-inset-bottom))+76px)] lg:bottom-6'
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id ?? toast.text}
          role="status"
          className={`fixed inset-x-0 z-40 flex justify-center px-4 lg:pl-64 ${bottom}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={SPRING}
        >
          <div className="flex min-h-[48px] items-center gap-4 rounded-full bg-[rgb(30_30_32)] pl-5 pr-2 text-[15px] text-white shadow-sheet">
            <span>{toast.text}</span>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action.run()
                  onClose()
                }}
                className="min-h-[40px] rounded-full px-3 font-semibold text-[rgb(100_160_255)] active:opacity-60"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
