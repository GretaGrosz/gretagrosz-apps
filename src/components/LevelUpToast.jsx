import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SHOP_LEVELS, levelText } from '../data/shop.js'
import { useLang } from '../i18n.jsx'
import { useProgress } from '../progress.jsx'
import { SPRING } from '../motion.js'
import ShopScene from './ShopScene.jsx'

// Neue Stufe von Loopys Laden: kleine Glas-Pille oben, die man nicht antippen kann –
// sie liegt nie über einem Button und unterbricht kein Quiz.
export default function LevelUpToast() {
  const { levelUp, clearLevelUp } = useProgress()
  const { lang, t } = useLang()

  useEffect(() => {
    if (levelUp === null) return
    const timer = setTimeout(clearLevelUp, 3500)
    return () => clearTimeout(timer)
  }, [levelUp, clearLevelUp])

  const level = levelUp !== null ? SHOP_LEVELS[levelUp] : null

  return (
    <AnimatePresence>
      {level && (
        <motion.div
          key={levelUp}
          role="status"
          className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+4px)] z-40 flex justify-center px-4 lg:pl-64"
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={SPRING}
        >
          <div className="glass flex items-center gap-3 rounded-full py-1.5 pl-2 pr-5 shadow-sheet">
            <ShopScene level={levelUp} still className="h-9 w-12 shrink-0" />
            <span className="text-[15px] font-semibold text-label">
              {t('levelN', { n: levelUp + 1 })} · {levelText(level, lang).name}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
