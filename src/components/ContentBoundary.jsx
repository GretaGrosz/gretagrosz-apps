import { Component, Suspense } from 'react'
import { retryContent } from '../data/content.js'
import { useLang } from '../i18n.jsx'
import Button from './Button.jsx'

// Wartet auf nachgeladene Inhalte (Suspense) und zeigt bei einem Ladefehler (z. B. offline beim
// ersten Öffnen) eine ruhige Meldung mit "Erneut versuchen".
class Catcher extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <this.props.Fallback
          retry={() => {
            retryContent()
            this.setState({ error: null })
          }}
        />
      )
    }
    return this.props.children
  }
}

function LoadError({ retry }) {
  const { t } = useLang()
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[20px] font-semibold text-label">{t('loadFailed')}</p>
      <p className="mt-1 text-[15px] text-label2">{t('loadFailedSub')}</p>
      <Button onClick={retry} className="mt-5">
        {t('retry')}
      </Button>
    </div>
  )
}

export default function ContentBoundary({ children, fallback = null }) {
  return (
    <Catcher Fallback={LoadError}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </Catcher>
  )
}
