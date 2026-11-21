import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { t } from './i18n'
import { KEY, PREV_KEY } from './store'
import { loadContent } from './content'
import { loadBank } from './data'

// If anything ever throws while rendering, this screen replaces the app. It never deletes anything:
// it can save everything that's stored as a file, bring back the copy kept before the last import or reset,
// or try again.
function Recovery({ error }) {
  const raw = (() => {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  })()
  const prev = (() => {
    try {
      return localStorage.getItem(PREV_KEY)
    } catch {
      return null
    }
  })()
  const save = () => {
    let state = null
    try {
      state = JSON.parse(raw)
    } catch {}
    const text = JSON.stringify({ app: 'qed', version: 1, savedAt: new Date().toISOString(), state: state ?? raw, previous: (() => {
        try {
          return JSON.parse(prev)
        } catch {
          return null
        }
      })() })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
    a.download = `qed-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
  const restore = () => {
    try {
      const p = JSON.parse(prev)
      // Swap, so the current data becomes the "previous" copy and nothing is lost either way
      localStorage.setItem(PREV_KEY, JSON.stringify({ app: 'qed', version: 1, savedAt: new Date().toISOString(), reason: 'recovery', state: JSON.parse(raw) }))
      localStorage.setItem(KEY, JSON.stringify(p.state))
    } catch {}
    location.reload()
  }
  return (
    <main className="recovery">
      <h1 className="title1">{t('QED hit a problem')}</h1>
      <p className="subhead secondary mt-2">{t('Your progress is still saved on this device.')}</p>
      <div className="mt-6 grid gap-3">
        <button className="btn btn-filled w-full" onClick={() => location.reload()}>
          {t('Try Again')}
        </button>
        {raw && (
          <button className="btn btn-gray w-full" onClick={save}>
            {t('Save My Data as a File')}
          </button>
        )}
        {prev && (
          <button className="btn btn-gray w-full" onClick={restore}>
            {t('Bring Back the Previous Progress')}
          </button>
        )}
      </div>
      {error && <p className="caption mt-8 break-words">{String(error.message || error).slice(0, 300)}</p>}
    </main>
  )
}

class ErrorBoundary extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error) {
    console.error(error)
  }
  render() {
    return this.state.error ? <Recovery error={this.state.error} /> : this.props.children
  }
}

function LoadFailed() {
  return (
    <main className="recovery">
      <h1 className="title1">{t('QED couldn’t load')}</h1>
      <p className="subhead secondary mt-2">{t('Check your connection and try again. Your progress is saved on this device.')}</p>
      <button className="btn btn-filled mt-6 w-full" onClick={() => location.reload()}>
        {t('Try Again')}
      </button>
    </main>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))

// The shell in index.html stays on screen while the app, lessons and past problems load in parallel
Promise.all([import('./App.jsx'), loadContent(), loadBank()])
  .then(([{ default: App }]) =>
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>,
    ),
  )
  .catch((e) => {
    console.error(e)
    root.render(<LoadFailed />)
  })

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {}))
}
