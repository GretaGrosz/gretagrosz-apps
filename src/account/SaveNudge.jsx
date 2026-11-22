// Ein einziger, sanfter Hinweis auf der Startseite: "Fortschritt sichern". Erscheint erst, wenn es etwas zu verlieren
// gibt (3 Themen fertig gelesen oder Spieltag 3 im Laden-Spiel), nur ohne Konto, und verschwindet für immer, sobald
// man ihn antippt oder wegklickt (hints.accountNudge in progress.jsx).
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useProgress } from '../progress.jsx'
import { SPRING } from '../motion.js'
import { XIcon } from '../components/Icons.jsx'
import { useAccount } from './Account.jsx'
import { useAccountText } from './strings.js'
import { topicsDone } from './merge.js'

function gameDay() {
  try {
    return Number(JSON.parse(localStorage.getItem('loopy-shop-save') || 'null')?.day) || 0
  } catch {
    return 0
  }
}

export default function SaveNudge() {
  const { pathname } = useLocation()
  const progress = useProgress()
  const { account, open } = useAccount()
  const t = useAccountText()
  const show =
    pathname === '/' && !account && !progress.hints?.accountNudge && (topicsDone(progress) >= 3 || gameDay() >= 3)

  const dismiss = () => progress.markHint('accountNudge')

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-x-3 bottom-[calc(max(12px,env(safe-area-inset-bottom))+72px)] z-20 mx-auto max-w-md lg:bottom-6 lg:left-[calc(16rem+12px)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={SPRING}
        >
          <div className="glass flex items-center gap-3 rounded-[20px] py-3 pl-4 pr-2 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.35)]">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-label">{t('nudgeTitle')}</p>
              <p className="text-[13px] leading-snug text-label2">{t('nudgeText')}</p>
            </div>
            <button
              onClick={() => {
                dismiss()
                open('signup')
              }}
              className="min-h-[36px] shrink-0 rounded-full bg-accent px-4 text-[15px] font-semibold text-white active:opacity-80"
            >
              {t('nudgeGo')}
            </button>
            <button onClick={dismiss} aria-label={t('notNow')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-label2 active:bg-fill/20">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
