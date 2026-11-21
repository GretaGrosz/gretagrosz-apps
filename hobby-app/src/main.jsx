import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import Crash from './components/Crash.jsx'
import { StoreProvider } from './store.jsx'
import { AccountProvider } from './account.jsx'
import { LangProvider } from './i18n.jsx'
import { warmPhotos } from './media'
import './index.css'

// Start reading your photos from IndexedDB right away, in parallel with the first render
warmPhotos()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Crash>
      <LangProvider>
        <StoreProvider>
          <AccountProvider>
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <App />
            </HashRouter>
          </AccountProvider>
        </StoreProvider>
      </LangProvider>
    </Crash>
  </React.StrictMode>,
)

// Offline: the service worker keeps the app itself on the device (it never stores your data or API calls)
// A new version: the app starts from its saved copy, so without this an iPhone that keeps Safari's tab in memory
// would run the old version for days. It looks for an update whenever you come back to Blank, and once the new one
// is ready it reloads itself, but never while a sheet is open or you're typing (then: the next time you leave Blank).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const hadWorker = !!navigator.serviceWorker.controller
  let stale = false
  const busy = () => !!document.querySelector('[role=dialog]') || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
  const reloadIfFree = () => stale && (document.hidden || !busy()) && location.reload()
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The very first install also takes control; that's not a new version
    if (!hadWorker || stale) return
    stale = true
    reloadIfFree()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) reloadIfFree()
          else reg.update().catch(() => {})
        })
      })
      .catch(() => {})
  })
}
