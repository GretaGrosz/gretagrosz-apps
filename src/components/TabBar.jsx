import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../i18n.jsx'
import { isFocusRoute } from '../motion.js'
import { BookIcon, CalendarIcon, GearIcon, HomeIcon } from './Icons.jsx'

const TABS = [
  { to: '/', label: 'home', Icon: HomeIcon, match: ['/', '/fehler', '/wiederholen'] },
  { to: '/themen', label: 'topics', Icon: BookIcon, match: ['/themen', '/lernen', '/ueben', '/ueben-mix', '/karten'] },
  { to: '/tests', label: 'tests', Icon: CalendarIcon, match: ['/tests'] },
  { to: '/einstellungen', label: 'settings', Icon: GearIcon, match: ['/einstellungen'] },
]

// iPhone: schwebende Tab-Leiste aus Glas (auf Lern-, Quiz- und Testseiten ausgeblendet).
// Ab 1024 px: Seitenleiste links.
export default function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useLang()
  const section = '/' + (pathname.split('/')[1] ?? '')
  const focus = isFocusRoute(pathname)

  const go = (to, active) => {
    if (active && pathname === to) window.scrollTo({ top: 0, behavior: 'smooth' })
    else navigate(to)
  }

  return (
    <>
      {!focus && (
        <nav aria-label={t('tabs')} className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 lg:hidden">
          <div className="glass mx-auto flex max-w-md rounded-full px-1.5 py-1 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.3)]">
            {TABS.map(({ to, label, Icon, match }) => {
              const active = match.includes(section)
              return (
                <button
                  key={to}
                  onClick={() => go(to, active)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    active ? 'text-accent-text' : 'text-label2'
                  }`}
                >
                  <Icon className="h-[25px] w-[25px]" strokeWidth={active ? 2.1 : 1.8} />
                  {t(label)}
                </button>
              )
            })}
          </div>
        </nav>
      )}

      <nav aria-label={t('tabs')} className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sep/20 bg-surface/60 px-3 pt-6 lg:flex">
        <p className="mb-5 px-3 text-[22px] font-bold text-label">BW Buddy</p>
        {TABS.map(({ to, label, Icon, match }) => {
          const active = match.includes(section)
          return (
            <button
              key={to}
              onClick={() => go(to, active)}
              aria-current={active ? 'page' : undefined}
              className={`mb-0.5 flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 text-[17px] transition-colors ${
                active ? 'bg-accent text-white' : 'text-label hover:bg-fill/[0.12]'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              {t(label)}
            </button>
          )
        })}
      </nav>
    </>
  )
}
