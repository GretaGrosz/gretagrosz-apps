import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { isFocusRoute } from '../motion.js'
import { ChevronLeft } from './Icons.jsx'

// Zurück wie bei iOS: zur vorigen Seite, wenn es eine gibt (dann passt auch Safaris Wischgeste),
// sonst – beim direkten Öffnen eines Links – zur übergeordneten Seite, ohne einen neuen Verlaufseintrag.
export function useBack(fallback) {
  const navigate = useNavigate()
  return () => {
    if ((window.history.state?.idx ?? 0) > 0) navigate(-1)
    else navigate(fallback ?? '/', { replace: true })
  }
}

/**
 * Seitengerüst im iOS-Stil:
 * - Navigationsleiste oben (Glas erst beim Scrollen), links "Zurück", rechts optional `trailing`
 * - großer Titel, der beim Scrollen klein in die Leiste wandert; `inline`: nur der kleine Titel
 * - `bar`: Aktionsleiste unten am Bildschirmrand (nur auf Seiten ohne Tab-Leiste)
 */
export default function Page({ title, back, onBack, inline = false, bar, trailing, children, className = '', titleHidden = false }) {
  const { pathname } = useLocation()
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const goBackDefault = useBack(back)
  const canGoBack = Boolean(back || onBack)
  const focus = isFocusRoute(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (inline ? 4 : 36))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [inline])

  const showSmallTitle = (inline || scrolled) && !titleHidden
  const bottomPad = bar ? 'pb-44' : focus ? 'pb-12' : 'pb-32 lg:pb-12'

  return (
    <div className={`min-h-[100dvh] overflow-x-clip ${bottomPad}`}>
      <header
        className={`sticky top-0 z-30 pt-[env(safe-area-inset-top)] transition-[background-color,box-shadow] duration-200 ${
          scrolled ? 'glass !shadow-[inset_0_-0.5px_0_var(--glass-edge)]' : ''
        }`}
      >
        <div className="mx-auto grid h-11 max-w-2xl grid-cols-[1fr_auto_1fr] items-center px-2">
          <div className="justify-self-start">
            {canGoBack && (
              <button
                onClick={onBack ?? goBackDefault}
                className="flex min-h-[44px] items-center gap-0.5 rounded-lg pl-0.5 pr-2 text-[17px] text-accent-text active:opacity-50"
              >
                <ChevronLeft className="h-[22px] w-[22px]" />
                {t('back')}
              </button>
            )}
          </div>
          <div
            aria-hidden={!showSmallTitle}
            className={`max-w-[56vw] truncate text-[17px] font-semibold text-label transition-opacity duration-200 lg:max-w-md ${
              showSmallTitle ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {title}
          </div>
          <div className="justify-self-end">{trailing}</div>
        </div>
      </header>

      <main className={`mx-auto max-w-2xl px-4 ${className}`}>
        {!inline && !titleHidden && (
          <h1 className="pb-4 pt-0.5 text-[34px] font-bold leading-[41px] text-label [overflow-wrap:anywhere] [hyphens:auto]">{title}</h1>
        )}
        {inline && <div className="h-3" />}
        {children}
      </main>

      {bar && (
        <div className="glass fixed inset-x-0 bottom-0 z-20 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[inset_0_0.5px_0_var(--glass-edge)] lg:left-64">
          <div className="mx-auto max-w-2xl px-4">{bar}</div>
        </div>
      )}
    </div>
  )
}
