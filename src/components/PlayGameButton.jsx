import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLang } from '../i18n.jsx'

// Spielstand von Loopy & Co. (gleicher Schlüssel wie in src/game/Spiel.jsx). Nur lesen, nie schreiben.
const GAME_SAVE_KEY = 'loopy-shop-save'

export function readGameDay() {
  try {
    const s = JSON.parse(localStorage.getItem(GAME_SAVE_KEY) || 'null')
    const day = s && typeof s === 'object' ? s.day : null
    return Number.isInteger(day) && day >= 1 && day < 10000 ? day : null
  } catch {
    return null
  }
}

// Großer Aufruf zum Spiel unter Loopys Insel: Play-Symbol, Titel, Unterzeile und „Neu“-Abzeichen
// (nur ohne Spielstand). Alle paar Sekunden ein sanftes Pulsieren mit Glanz; bei „weniger Bewegung“ ruhig.
export default function PlayGameButton({ onClick, className = '' }) {
  const { t } = useLang()
  const reduced = useReducedMotion()
  const [day] = useState(readGameDay)

  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={reduced ? undefined : { scale: [1, 1.025, 1] }}
      transition={reduced ? undefined : { duration: 0.9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3.2, delay: 1.2 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex min-h-[64px] w-full items-center gap-3 rounded-full bg-accent py-2.5 pl-2.5 pr-4 text-left text-white shadow-[0_10px_24px_-10px_rgb(var(--accent)/0.75)] ${className}`}
    >
      {/* Glanzstreifen, der ab und zu über den Knopf läuft */}
      {!reduced && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            initial={{ x: '-150%' }}
            animate={{ x: ['-150%', '400%'] }}
            transition={{ duration: 1.1, ease: 'easeInOut', repeat: Infinity, repeatDelay: 3, delay: 1.3 }}
          />
        </span>
      )}
      <span className="relative flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white text-accent">
        <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M8 5.6v12.8c0 .8.9 1.3 1.6.9l10-6.4c.6-.4.6-1.3 0-1.7l-10-6.4C8.9 4.3 8 4.8 8 5.6z" />
        </svg>
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-[18px] font-bold leading-tight">{day ? t('gameContinue', { n: day }) : t('playGame')}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-white/85">{day ? 'Loopy & Co.' : t('gameTagline')}</span>
      </span>
      {/* „Neu“-Aufkleber oben rechts, nur solange noch nicht gespielt wurde */}
      {!day && (
        <span className="absolute -top-2.5 right-7 rotate-[4deg] rounded-full bg-amber-400 px-2.5 py-0.5 text-[12px] font-bold uppercase tracking-wide text-amber-950 shadow-[0_3px_8px_-3px_rgb(0_0_0/0.35)]">
          {t('playGameSub')}
        </span>
      )}
      <svg viewBox="0 0 24 24" className="relative h-5 w-5 flex-none text-white/80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 6l6 6-6 6" />
      </svg>
    </motion.button>
  )
}
