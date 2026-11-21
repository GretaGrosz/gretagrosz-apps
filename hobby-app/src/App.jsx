import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Today from './pages/Today'
import Ideas from './pages/Ideas'
import ProjectPage from './pages/ProjectPage'
import You from './pages/You'
import Onboarding from './pages/Onboarding'
import StreakPage from './pages/StreakPage'
import ChallengePage, { ChallengesList } from './pages/Challenges'
import BuddyJoin from './pages/BuddyJoin'
import SparkJoin from './pages/SparkJoin'
import Profile from './pages/Profile'
import Friends from './pages/Friends'
import Chat from './pages/Chat'
import Admin from './pages/Admin'
import { ResetPage } from './components/AccountSheet'
import { useStore } from './store'
import { useT } from './i18n'
import { call, isIOS, isStandalone } from './buddy'
import { useAccount } from './account'
import { api } from './social'
import { asks, canInstall, canPrompt, countAsk, promptInstall } from './install'
import { Icon, Sheet, useAnySheetOpen } from './components/ui'

// Blank on the Home Screen: one tap on Android, the two Safari taps on iPhone. The start flow asks the first time
// (right after your first post or plan); this asks once more after the first like or comment on your post, and that's
// it (install.js: never more than twice). A reminder that can't reach you yet asks for it too (blank:install).
function InstallSheet() {
  const { t } = useT()
  const { account } = useAccount()
  const otherSheet = useAnySheetOpen()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const ask = () => !isStandalone() && setOpen(true)
    window.addEventListener('blank:install', ask)
    return () => window.removeEventListener('blank:install', ask)
  }, [])
  // The second ask: once someone reacted to one of your posts (checked once per opening, only while it's still due)
  const [reacted, setReacted] = useState(false)
  useEffect(() => {
    if (!account || asks() !== 1 || !canInstall()) return
    let gone = false
    api(account.token)
      .user(account.username)
      .then((r) => !gone && setReacted((r.posts || []).some((p) => p.likes > 0 || p.comments > 0)))
      .catch(() => {})
    return () => {
      gone = true
    }
  }, [account])
  useEffect(() => {
    if (open || !reacted || otherSheet || asks() !== 1) return
    const id = setTimeout(() => {
      if (canInstall() && !document.querySelector('[role="dialog"]')) {
        countAsk()
        setOpen(true)
      }
    }, 2500)
    return () => clearTimeout(id)
  }, [reacted, open, otherSheet])
  if (!open) return null
  const close = () => setOpen(false)
  const install = async () => {
    await promptInstall()
    close()
  }
  return (
    <Sheet onClose={() => close()} label={t('Add to Home Screen')}>
      <div className="flex flex-col items-center px-5 pb-2 pt-4 text-center">
        <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width="72" height="72" className="h-[72px] w-[72px] rounded-[18px] shadow-soft" />
        <h2 className="mt-4 text-[22px] font-bold tracking-tight">{t('Add Blank to your Home Screen')}</h2>
        {/* Why it's worth it: some things only work from the Home Screen (on iPhone, notifications at all) */}
        <p className="mt-2 max-w-[320px] text-[15px] leading-snug text-sub">{t('From the Home Screen Blank works like a real app: the axolotl can remind you when it’s time for your next step, and it opens in one tap, full screen. In the browser, reminders can’t reach you.')}</p>
      </div>
      {isIOS && !canPrompt() ? (
        <ol className="mx-5 mt-4 divide-y divide-line/15 overflow-hidden rounded-[14px] bg-mist">
          <li className="row min-h-[54px] text-[17px]">
            <span className="w-5 text-center font-semibold text-ink">1</span>
            <span className="flex-1">{t('Tap Share')}</span>
            <Icon name="share" className="h-6 w-6 text-[#007AFF]" strokeWidth={2} />
          </li>
          <li className="row min-h-[54px] text-[17px]">
            <span className="w-5 text-center font-semibold text-ink">2</span>
            <span className="flex-1">{t('Add to Home Screen')}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] border-2 border-ink">
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.6} />
            </span>
          </li>
        </ol>
      ) : (
        <div className="px-5 pt-4">
          <button onClick={install} className="btn-primary btn-lg w-full" data-autofocus>
            {t('Add to Home Screen')}
          </button>
        </div>
      )}
      <div className="px-5 pt-2">
        <button onClick={() => close()} className="h-12 w-full rounded-full text-[17px] text-spark-ink active:opacity-60">
          {isIOS && !canPrompt() ? t('Done') : t('Not now')}
        </button>
      </div>
    </Sheet>
  )
}

// Counts this opening of Blank for the admin's stats (worker/blank.js /visit): once a day per device, with where the
// visitor came from. Links can say it themselves (gretagrosz.com/blank/?ref=reddit), since apps often hide it.
const VISIT_KEY = 'blank-visit'
const VISIT_FROM = [
  ['reddit', /reddit/],
  ['tiktok', /tiktok/],
  ['instagram', /instagram/],
  // The ad kit's own links (?ref=poster on the school poster's QR code, ?ref=whatsapp in class groups)
  ['poster', /poster/],
  ['whatsapp', /whatsapp/],
  // The business card: its QR code (?ref=card) and the NFC chip in it (?ref=nfc)
  ['card', /^card$/],
  ['nfc', /^nfc$/],
  ['search', /google|bing|duckduckgo|ecosia|yahoo|qwant/],
]
function visitSource() {
  const ref = (new URLSearchParams(location.search).get('ref') || '').toLowerCase()
  let from = ref
  try {
    if (!from && document.referrer) from = new URL(document.referrer).hostname
  } catch {}
  if (from) return VISIT_FROM.find(([, re]) => re.test(from))?.[0] || (from.includes(location.hostname) ? 'direct' : 'other')
  if (/^#\/(u|b|s)\//.test(location.hash)) return 'friend' // an invite or a shared project
  return 'direct'
}
// returning: this device used Blank before (so its first count after this shipped isn't a new visitor)
function useCountVisit(returning) {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    let last = null
    try {
      last = localStorage.getItem(VISIT_KEY)
      if (last === today) return
      localStorage.setItem(VISIT_KEY, today)
    } catch {
      return // no storage: we couldn't tell repeat visits apart, so don't count
    }
    call('/visit', { method: 'POST', body: { source: visitSource(), first: !last && !returning } }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

function NotFound() {
  const { t } = useT()
  return <p className="py-24 text-center text-sub">{t('This page doesn’t exist.')}</p>
}

// A password-reset link from the email
function Reset() {
  const { token } = useParams()
  const navigate = useNavigate()
  return <ResetPage token={token} onDone={() => navigate('/', { replace: true })} />
}

export default function App() {
  const { data } = useStore()
  useCountVisit(data.onboarded)
  return (
    <>
      <Routes>
        {/* A buddy invite opens even before the welcome questions */}
        <Route path="/b/:code" element={<BuddyJoin />} />
        {/* So does a shared project (sparks.js) */}
        <Route path="/s/:code" element={<SparkJoin />} />
        {/* And a password-reset link */}
        <Route path="/reset/:token" element={<Reset />} />
        {!data.onboarded ? (
          // First visit: the welcome questions instead of the app, not on top of it
          <>
            {/* Someone's invite link (their profile) works before the welcome questions too */}
            <Route
              path="/u/:username"
              element={
                <main className="mx-auto min-h-[100dvh] max-w-2xl px-4 pb-10 pt-[calc(env(safe-area-inset-top)+12px)]">
                  <Profile />
                </main>
              }
            />
            <Route path="*" element={<Onboarding />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Today />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="/ideas/:key" element={<Ideas />} />
            <Route path="/project/:id" element={<ProjectPage />} />
            <Route path="/you" element={<You />} />
            <Route path="/friends" element={<Friends tab="chats" />} />
            <Route path="/friends/people" element={<Friends tab="people" />} />
            <Route path="/people" element={<Navigate to="/friends/people" replace />} />
            <Route path="/u/:username" element={<Profile />} />
            <Route path="/chats" element={<Navigate to="/friends" replace />} />
            <Route path="/chats/:id" element={<Chat />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/streak" element={<StreakPage />} />
            <Route path="/challenges" element={<ChallengesList />} />
            <Route path="/challenge/:id" element={<ChallengePage />} />
            {/* Links from older versions */}
            <Route path="/projects" element={<Navigate to="/" replace />} />
            <Route path="/buddy" element={<Navigate to="/streak" replace />} />
            <Route path="/post/*" element={<Navigate to="/" replace />} />
            <Route path="/chat/*" element={<Navigate to="/" replace />} />
            <Route path="/chat" element={<Navigate to="/" replace />} />
            <Route path="/board/*" element={<Navigate to="/you" replace />} />
            <Route path="/new" element={<Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        )}
      </Routes>
      {data.onboarded && <InstallSheet />}
    </>
  )
}
