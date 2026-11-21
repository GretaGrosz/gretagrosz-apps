import { useEffect, useState } from 'react'
import { useStore } from './lib/store.js'
import { seedMine } from './lib/srs.js'
import seed from '../data/my-errors.json'
import Home from './screens/Home.jsx'
import Path, { Tips } from './screens/Path.jsx'
import { LessonScreen, CheckpointScreen, EndlessScreen, ReviewUnitScreen } from './screens/Lesson.jsx'
import Practice from './screens/Practice.jsx'
import Mistakes from './screens/Mistakes.jsx'
import Training, { Sprint, Proofread, Dictation, Build } from './screens/Training.jsx'
import Writing, { TextTypeScreen, AngabeTrainer, Simulation, TextsScreen, TextDetail, Paragraph } from './screens/Writing.jsx'
import Stats from './screens/Stats.jsx'
import Settings from './screens/Settings.jsx'
import Setup from './screens/Setup.jsx'
import LockIn from './screens/LockIn.jsx'
import Icon from './components/Icon.jsx'
import { useStore as useS, currentStreak, hearts as heartsOf } from './lib/store.js'

function useRoute() {
  const read = () => {
    const h = window.location.hash.replace(/^#/, '') || '/'
    const [path, qs] = h.split('?')
    return { path, parts: path.split('/').filter(Boolean), query: new URLSearchParams(qs || '') }
  }
  const [r, setR] = useState(read)
  useEffect(() => {
    const on = () => { setR(read()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

const TABS = [
  ['/', 'Heute', 'sun'],
  ['/pfad', 'Pfad', 'map'],
  ['/training', 'Training', 'zap'],
  ['/schreiben', 'Schreiben', 'pen'],
  ['/ich', 'Ich', 'chart'],
]
const SIDE_EXTRA = [
  ['/ueben', 'Üben', 'repeat'],
  ['/fehler', 'Meine Fehler', 'notebook'],
  ['/einstellungen', 'Einstellungen', 'settings'],
]

export default function App() {
  const r = useRoute()
  const done = useStore((s) => s.setup.done)
  useEffect(() => { seedMine(seed) }, [])

  if (!done && r.parts[0] !== 'setup') return <Setup />
  const [a, b] = r.parts
  let screen
  let fullscreen = false
  switch (a) {
    case undefined: screen = <Home />; break
    case 'pfad': screen = <Path />; break
    case 'tipps': screen = <Tips unitId={b} />; break
    case 'lektion': screen = <LessonScreen lessonId={b} level={Number(r.query.get('lvl') || 0)} />; fullscreen = true; break
    case 'checkpoint': screen = <CheckpointScreen unitId={b} skip={r.query.get('skip') === '1'} />; fullscreen = true; break
    case 'endlos': screen = <EndlessScreen unitId={b} />; fullscreen = true; break
    case 'lockin': screen = <LockIn />; fullscreen = true; break
    case 'wiederholung': screen = <ReviewUnitScreen />; fullscreen = true; break
    case 'ueben': screen = <Practice refill={r.query.get('refill') === '1'} skill={r.query.get('skill')} />; fullscreen = true; break
    case 'fehler': screen = <Mistakes />; break
    case 'training': screen = <Training />; break
    case 'sprint': screen = <Sprint kind={b} />; fullscreen = true; break
    case 'korrektur': screen = <Proofread />; fullscreen = true; break
    case 'diktat': screen = <Dictation />; fullscreen = true; break
    case 'bauen': screen = <Build />; break
    case 'schreiben': screen = <Writing />; break
    case 'textsorte': screen = <TextTypeScreen id={b} />; break
    case 'angabe': screen = <AngabeTrainer />; break
    case 'simulation': screen = <Simulation angabeId={b} />; fullscreen = true; break
    case 'absatz': screen = <Paragraph />; break
    case 'texte': screen = <TextsScreen />; break
    case 'text': screen = <TextDetail id={b} />; break
    case 'ich': screen = <Stats />; break
    case 'einstellungen': screen = <Settings />; break
    case 'setup': screen = <Setup again />; break
    default: screen = <Home />
  }
  const tab = '/' + (a || '')
  const activeTab = TABS.find(([p]) => p === tab) ? tab : { tipps: '/pfad', fehler: '/ich', einstellungen: '/ich', bauen: '/training', textsorte: '/schreiben', angabe: '/schreiben', texte: '/schreiben', text: '/schreiben', absatz: '/schreiben' }[a]
  return (
    <div className="min-h-[100dvh]">
      {!fullscreen && <Sidebar active={activeTab} path={'/' + (a || '')} />}
      <div key={window.location.hash} className={fullscreen ? '' : 'lg:pl-64'}>{screen}</div>
      {!fullscreen && (
        <nav className="safe-b fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/95 backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#121916]/95">
          <div className="mx-auto flex max-w-xl">
            {TABS.map(([p, label, icon]) => (
              <a key={p} href={'#' + p} className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${activeTab === p ? 'text-brand' : 'muted'}`}>
                <Icon name={icon} size={22} strokeWidth={activeTab === p ? 2.4 : 2} />{label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}

// Desktop: fixed sidebar with logo, the five sections and shortcuts
function Sidebar({ active, path }) {
  const streak = useS(currentStreak)
  const hearts = useS(heartsOf)
  const item = (p, label, icon, on) => (
    <a key={p} href={'#' + p} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${on ? 'bg-brand-light text-brand dark:bg-brand/20 dark:text-[#7fe0b4]' : 'text-ink-soft hover:bg-black/5 dark:text-[#b7c3bd] dark:hover:bg-white/5'}`}>
      <Icon name={icon} size={20} />{label}
    </a>
  )
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-black/5 bg-white/70 px-4 py-6 backdrop-blur lg:flex dark:border-white/10 dark:bg-[#111816]/80">
      <a href="#/" className="mb-8 flex items-center gap-3 px-2">
        <img src="./logo.png" alt="" width="40" height="40" className="h-10 w-10 rounded-xl shadow-sm" />
        <span className="text-lg font-bold tracking-tight">Lock-In</span>
      </a>
      <nav className="space-y-1">{TABS.map(([p, l, i]) => item(p, l, i, active === p))}</nav>
      <div className="my-4 border-t border-black/5 dark:border-white/10" />
      <nav className="space-y-1">{SIDE_EXTRA.map(([p, l, i]) => item(p, l, i, path === p))}</nav>
      <a href="#/lockin" className="btn-primary mt-6 gap-2"><Icon name="lock" size={18} />Lock-In starten</a>
      <div className="mt-auto flex gap-2 px-1 text-sm font-semibold">
        <span className="chip"><Icon name="flame" size={16} className="text-orange-500" />{streak}</span>
        <span className="chip"><Icon name="heart" size={16} className="text-red-500" />{hearts}</span>
      </div>
    </aside>
  )
}
