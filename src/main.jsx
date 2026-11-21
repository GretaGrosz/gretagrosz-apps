import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import App from './App.jsx'
import { LanguageProvider, initialLang } from './i18n.jsx'
import { ProgressProvider, STORAGE_KEY } from './progress.jsx'
import { loadContent } from './data/content.js'
import './index.css'

// Inhalte des eigenen Jahrgangs sofort anfordern – parallel zum ersten Zeichnen der App.
try {
  const year = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').myYear
  if (year) loadContent(initialLang().lang, year).catch(() => {})
} catch {
  /* kein Speicher – Inhalte werden geladen, sobald sie gebraucht werden */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <LanguageProvider>
        <ProgressProvider>
          <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
          </HashRouter>
        </ProgressProvider>
      </LanguageProvider>
    </MotionConfig>
  </React.StrictMode>,
)

// Offline-Fähigkeit: Service Worker nur im fertigen Build (sw.js entsteht beim Build, siehe vite.config.js)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {})
  })
}
// Browser bitten, den Fortschritt nicht von selbst zu löschen (Safari räumt sonst nach 7 Tagen auf)
navigator.storage?.persist?.().catch(() => {})
