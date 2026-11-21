import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { loadLanguages } from './lexicon'
import './index.css'

// Start downloading the two languages in use right away, and show the app as soon as they are there
// (from the offline cache that is instant; on a first visit it waits at most a moment, then the app loads them itself)
let saved = null
try {
  saved = JSON.parse(localStorage.getItem('ten-a-day'))
} catch {
  saved = null
}
const languages = [saved?.from || (saved?.lang ? 'en' : null), saved?.lang].filter(Boolean)
const preload = languages.length ? Promise.race([loadLanguages(...languages).catch(() => {}), new Promise((r) => setTimeout(r, 1500))]) : Promise.resolve()

preload.then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {})
  })
}
