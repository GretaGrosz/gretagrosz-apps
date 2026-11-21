import React from 'react'

// If a page crashes, show what happened instead of a white screen, so a screenshot tells us what broke.
// Kept free of the app's own parts (store, i18n, router), because one of those may be what crashed.
const TEXT = {
  en: ['Something went wrong', 'Your projects are safe. Send a screenshot of this screen to Greta so it gets fixed.', 'Reload', 'Back to Today'],
  de: ['Etwas ist schiefgelaufen', 'Deine Projekte sind sicher. Schick Greta einen Screenshot von diesem Bildschirm, damit es behoben wird.', 'Neu laden', 'Zurück zu Heute'],
  hu: ['Valami hiba történt', 'A projektjeid biztonságban vannak. Küldj Gretának képernyőképet erről, hogy kijavítsuk.', 'Újratöltés', 'Vissza a Mához'],
}

export default class Crash extends React.Component {
  state = { error: null }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ where: (info?.componentStack || '').trim().split('\n').slice(0, 4).join('\n') })
  }
  render() {
    const { error, where } = this.state
    if (!error) return this.props.children
    let lang = 'en'
    try {
      lang = TEXT[localStorage.getItem('lang')] ? localStorage.getItem('lang') : 'en'
    } catch {}
    const [title, text, reload, home] = TEXT[lang]
    const detail = [String(error?.message || error), location.hash, where].filter(Boolean).join('\n')
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-6 py-10">
        <h1 className="text-[24px] font-bold">{title}</h1>
        <p className="mt-2 text-[17px] text-sub">{text}</p>
        <pre className="mt-4 max-h-[40dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-mist p-3 text-[12px] text-ink">{detail}</pre>
        <button className="btn-primary btn-lg mt-6 w-full" onClick={() => location.reload()}>
          {reload}
        </button>
        <button
          className="btn-tinted mt-3 w-full"
          onClick={() => {
            location.hash = '#/'
            location.reload()
          }}
        >
          {home}
        </button>
      </div>
    )
  }
}
