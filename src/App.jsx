import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { lazy } from 'react'
import Home from './pages/Home.jsx'
import TabBar from './components/TabBar.jsx'
import LevelUpToast from './components/LevelUpToast.jsx'
import Tests from './pages/Tests.jsx'
import Onboarding from './pages/Onboarding.jsx'

// Seiten außer Start, Themen und Tests kommen als eigene kleine Dateien (der Service Worker legt sie ab)
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const LernInhalt = lazy(() => import('./pages/LernInhalt.jsx'))
const KartenDeck = lazy(() => import('./pages/Karten.jsx').then((m) => ({ default: m.KartenDeck })))
const Wiederholen = lazy(() => import('./pages/Wiederholen.jsx'))
const ExamDetail = lazy(() => import('./pages/Termine.jsx').then((m) => ({ default: m.ExamDetail })))
const ExamForm = lazy(() => import('./pages/Termine.jsx').then((m) => ({ default: m.ExamForm })))
const ProbeSetup = lazy(() => import('./pages/Pruefung.jsx').then((m) => ({ default: m.ProbeSetup })))
const ProbeLauf = lazy(() => import('./pages/Pruefung.jsx').then((m) => ({ default: m.ProbeLauf })))
// Das Spiel (3D) ist ein eigenes großes Paket und wird nur unter /spiel geladen
const Spiel = lazy(() => import('./game/Spiel.jsx'))
const Einstellungen = lazy(() => import('./pages/Einstellungen.jsx'))
const JahrgangWahl = lazy(() => import('./pages/Einstellungen.jsx').then((m) => ({ default: m.JahrgangWahl })))
const SprachWahl = lazy(() => import('./pages/Einstellungen.jsx').then((m) => ({ default: m.SprachWahl })))
import ContentBoundary from './components/ContentBoundary.jsx'
import SaveNudge from './account/SaveNudge.jsx'
import { ToastProvider } from './components/ToastContext.jsx'
import { useProgress } from './progress.jsx'
import { useLang } from './i18n.jsx'
import { loadContent } from './data/content.js'
import { ThemaSeite, ThemenJahrgang, ThemenKapitel, ThemenStart, ToThemen } from './pages/Themen.jsx'

export default function App() {
  const { onboarded, myYear } = useProgress()
  const { lang } = useLang()

  // Eigener Jahrgang in der aktuellen Sprache liegt immer bereit
  useEffect(() => {
    if (myYear) loadContent(lang, myYear).catch(() => {})
  }, [lang, myYear])

  if (!onboarded) return <Onboarding />

  return (
    <ToastProvider>
    <div className="lg:pl-64">
      <ScrollToTop />
      <LevelUpToast />
      <ContentBoundary>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Themen: Jahrgang → Kapitel → Thema */}
          <Route path="/themen" element={<ThemenStart />} />
          <Route path="/themen/:jahrgangId" element={<ThemenJahrgang />} />
          <Route path="/themen/:jahrgangId/:kapitelId" element={<ThemenKapitel />} />
          <Route path="/themen/:jahrgangId/:kapitelId/:topicId" element={<ThemaSeite />} />

          {/* Die drei Arten zu lernen (topicId "gesamt" = ganzes Kapitel) */}
          <Route path="/lernen/:jahrgangId/:kapitelId/:topicId" element={<LernInhaltMitReset />} />
          <Route path="/ueben/:jahrgangId/:kapitelId/:topicId" element={<QuizMitReset />} />
          <Route path="/ueben-mix/:jahrgangId" element={<Quiz mode="mix" />} />
          <Route path="/karten/:jahrgangId/:kapitelId/:topicId" element={<KartenDeck />} />

          {/* Alte Listen-Adressen weiterleiten */}
          {['/lernen', '/ueben', '/karten'].map((base) => [
            <Route key={base} path={base} element={<Navigate to="/themen" replace />} />,
            <Route key={`${base}-j`} path={`${base}/:jahrgangId`} element={<ToThemen />} />,
            <Route key={`${base}-k`} path={`${base}/:jahrgangId/:kapitelId`} element={<ToThemen />} />,
          ])}

          <Route path="/fehler" element={<Quiz mode="fehler" />} />
          <Route path="/wiederholen" element={<Wiederholen />} />

          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/neu" element={<ExamForm />} />
          <Route path="/tests/probe" element={<ProbeSetup />} />
          <Route path="/tests/lauf" element={<ProbeLauf />} />
          <Route path="/tests/:examId" element={<ExamDetail />} />
          <Route path="/tests/:examId/bearbeiten" element={<ExamForm />} />
          {/* frühere Adressen */}
          {['/testmodus', '/pruefung', '/termine'].map((p) => (
            <Route key={p} path={p} element={<Navigate to="/tests" replace />} />
          ))}
          <Route path="/shop" element={<Navigate to="/" replace />} />

          <Route path="/spiel" element={<Spiel />} />

          <Route path="/einstellungen" element={<Einstellungen />} />
          <Route path="/einstellungen/jahrgang" element={<JahrgangWahl />} />
          <Route path="/einstellungen/sprache" element={<SprachWahl />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ContentBoundary>
      <TabBar />
      <SaveNudge />
    </div>
    </ToastProvider>
  )
}

// Neue Seite → oben anfangen (Zurück stellt die Position nicht wieder her, wie bei einer App mit Stapel)
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Neuer Schlüssel pro Thema → Lernseite bzw. Quiz startet bei jedem Themenwechsel neu.
function LernInhaltMitReset() {
  const { topicId } = useParams()
  return <LernInhalt key={topicId} />
}
function QuizMitReset() {
  const { jahrgangId, kapitelId, topicId } = useParams()
  return <Quiz key={`${jahrgangId}/${kapitelId}/${topicId}`} />
}
