import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, readBackup } from '../store'
import { locale, useT } from '../i18n'
import { photoStats } from '../media'
import { exportBackup } from '../backup'
import { Icon, Segmented, Sheet, Spinner } from '../components/ui'
import { ProjectThumb } from '../components/ProjectBits'
import Mascot from '../assistant/Mascot'
import { startedTotal } from '../components/Spark'
import { AccountSection, AccountSettings } from '../components/AccountSheet'
import { FeedbackRow } from '../components/Feedback'
import { MessageSetting } from '../components/MessageSafety'
import { useAccount } from '../account'
import { accountPushPref, turnOffAccountPush, turnOnAccountPush } from '../notify'

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('blank-theme') || 'auto'
    } catch {
      return 'auto'
    }
  })
  const choose = (v) => {
    setTheme(v)
    try {
      if (v === 'auto') localStorage.removeItem('blank-theme')
      else localStorage.setItem('blank-theme', v)
    } catch {}
    if (v === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = v
  }
  return [theme, choose]
}

const mb = (bytes, lang) => new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(bytes / 1048576)

function ConfirmSheet({ title, detail, confirm, onConfirm, onClose }) {
  const { t } = useT()
  return (
    <Sheet onClose={onClose} label={title}>
      <div className="px-5 pb-2 pt-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bad/10 text-bad">
          <Icon name="trash" className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-[20px] font-bold leading-tight text-ink">{title}</h2>
        {detail && <p className="mt-2 text-[15px] text-ink">{detail}</p>}
        <button
          onClick={onConfirm}
          className="btn mt-6 min-h-[52px] w-full bg-bad text-[17px] font-semibold text-white active:opacity-80"
        >
          {confirm}
        </button>
        <button data-autofocus onClick={onClose} className="mt-2 min-h-[52px] w-full rounded-full text-[17px] font-semibold text-ink outline-none active:bg-mist">
          {t('Cancel')}
        </button>
      </div>
    </Sheet>
  )
}

// Computers: a card with your axolotl in its outfits and what you've done so far (phones have it on the Streak page)
function YouCard({ streak, doneToday }) {
  const { data } = useStore()
  const { t, tn, lang } = useT()
  const projects = data.projects
  const finished = projects.filter((p) => p.status === 'done').length
  const steps = projects.reduce((n, p) => n + p.milestones.filter((m) => m.done).length, 0)
  const minutes = projects.reduce((n, p) => n + (p.sessions || []).reduce((m, s) => m + (s.minutes || 0), 0), 0)
  const stat = (value, label) => (
    <div className="rounded-2xl bg-mist px-3 py-3 text-center">
      <p className="text-[24px] font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1.5 text-[13px] leading-tight text-sub">{label}</p>
    </div>
  )
  return (
    <Link to="/streak" className="surface hidden flex-col items-center px-6 pb-6 pt-7 text-center transition active:scale-[0.99] lg:flex">
      <Mascot size={168} streak={streak} mood={doneToday ? 'happy' : 'idle'} title="" />
      <p className="mt-3 text-[22px] font-bold tracking-tight">{data.me.name || t('You')}</p>
      <p className="text-[15px] text-sub">{tn(streak, '{n} week', '{n} weeks')} · {t('Streak')}</p>
      <div className="mt-5 grid w-full grid-cols-2 gap-2 xl:grid-cols-4">
        {stat(projects.length - finished, t('Projects'))}
        {stat(finished, t('Finished'))}
        {stat(steps, t('Steps done'))}
        {stat(new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(minutes / 60), t('Hours of hobbies'))}
      </div>
    </Link>
  )
}

function Row({ children, className = '' }) {
  return <li className={`row min-h-[50px] ${className}`}>{children}</li>
}

export default function You() {
  const { data, actions, streak, done, doneToday } = useStore()
  const { t, tn, lang, setLang } = useT()
  const [theme, setTheme] = useTheme()
  const [stats, setStats] = useState(null)
  const [busy, setBusy] = useState(null)
  const [restoreError, setRestoreError] = useState(null)
  const fileRef = useRef(null)
  const [ask, setAsk] = useState(null)
  const { account } = useAccount()
  const [pushOn, setPushOn] = useState(() => accountPushPref() === 'on')
  const lastBackup = data.me.lastBackup || null
  const backupDays = lastBackup ? Math.floor((Date.now() - lastBackup) / 86400000) : null
  const backupStale = data.projects.length > 0 && (backupDays === null || backupDays >= 7)
  const backupWhen =
    backupDays === null
      ? t('Never backed up')
      : backupDays === 0
        ? t('Backed up today')
        : tn(backupDays, 'Backed up {n} day ago', 'Backed up {n} days ago')

  useEffect(() => {
    photoStats().then(setStats)
  }, [data.projects])

  const backup = async () => {
    setBusy('backup')
    try {
      await exportBackup(data)
      actions.setMe({ lastBackup: Date.now() })
      actions.toast({ text: 'Backup saved' })
    } catch {
      actions.toast({ text: 'The backup couldn’t be made. Try again.' })
    } finally {
      setBusy(null)
    }
  }
  const restore = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setRestoreError(null)
    if (data.projects.length) return setAsk({ file })
    await doRestore(file)
  }
  const doRestore = async (file) => {
    setBusy('restore')
    try {
      const next = await readBackup(file)
      actions.replaceAll(next)
      actions.toast({ text: 'Backup restored' })
    } catch (err) {
      setRestoreError(
        err?.message === 'not-backup'
          ? t('That file isn’t a Blank backup.')
          : err?.code === 'quota'
            ? t('Your device is out of space for photos. Free up some space, then try again.')
            : t('The backup couldn’t be restored.'),
      )
    } finally {
      setBusy(null)
    }
  }
  const wipe = () => {
    setAsk('wipe')
  }

  const group = 'surface divide-y divide-line/15 overflow-hidden'
  return (
    <div className="mx-auto max-w-2xl pt-6 lg:max-w-[1760px] lg:pt-10">
      <h1 className="large-title px-1">{t('You')}</h1>
      {/* Computers: three columns (you, settings, this device) that each keep a readable width; phones: one list */}
      <div className="lg:mt-5 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] 2xl:gap-12">
      <div className="lg:[&>*:first-child]:mt-0">

      <YouCard streak={streak} doneToday={doneToday} />

      <div className="lg:mt-6"><AccountSection /></div>

      <ul className={`${group} mt-5`}>
        <Row>
          <label htmlFor="me-name" className="shrink-0 text-[17px]">
            {t('Name')}
          </label>
          <input
            id="me-name"
            className="min-w-0 flex-1 bg-transparent py-3 text-right text-[17px] outline-none placeholder:text-sub"
            placeholder={t('Optional')}
            maxLength={40}
            value={data.me.name}
            onChange={(e) => actions.setMe({ name: e.target.value })}
            autoComplete="given-name"
          />
        </Row>
      </ul>

      <ul className={`${group} mt-6`}>
        {/* On computers the card above shows the streak */}
        <li className="lg:hidden">
          <Link to="/streak" className="row min-h-[50px] active:bg-mist">
            <span className="-my-2 flex w-5 shrink-0 justify-center">
              <Mascot size={30} mood={doneToday ? 'happy' : 'idle'} />
            </span>
            <span className="flex-1 text-[17px]">{t('Streak')}</span>
            <span className="text-[17px] tabular-nums text-sub">{tn(streak, '{n} week', '{n} weeks')}</span>
            <Icon name="chevron" className="h-4 w-4 text-ink/30" strokeWidth={2.6} />
          </Link>
        </li>
        <li>
          <Link to="/challenges" className="row min-h-[50px] active:bg-mist">
            <Icon name="trophy" className="h-5 w-5 text-spark-ink" />
            <span className="flex-1 text-[17px]">{t('Monthly challenges')}</span>
            <Icon name="chevron" className="h-4 w-4 text-ink/30" strokeWidth={2.6} />
          </Link>
        </li>
        {data.projects.some((p) => p.spark) && (
          <li className="row min-h-[50px]">
            <Icon name="share" className="h-5 w-5 text-spark-ink" />
            <span className="flex-1 text-[17px]">{t('Started because of you')}</span>
            <span className="text-[17px] tabular-nums text-sub">{tn(startedTotal(data.projects), '{n} person', '{n} people')}</span>
          </li>
        )}
      </ul>

      {done.length > 0 && (
        <section className="mt-8">
          <h2 className="section-label">{t('Finished')}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {done.map((p) => (
              <Link key={p.id} to={`/project/${p.id}`} className="active:opacity-70">
                <ProjectThumb project={p} className="aspect-square w-full rounded-[16px]" />
                <span className="mt-1.5 line-clamp-2 block text-[13px] font-medium leading-tight">{p.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      </div>
      {/* Settings and this device: one column under each other on smaller computers, two columns on big ones */}
      <div className="xl:contents">
      <div className="lg:[&>*:first-child]:mt-0">
      <FeedbackRow />
      <h2 className="section-label mt-8">{t('Settings')}</h2>
      <ul className={group}>
        <Row>
          <span className="flex-1 text-[17px]">{t('Language')}</span>
          <div className="w-[168px]">
            <Segmented
              value={lang}
              onChange={setLang}
              label={t('Language')}
              options={[
                ['en', 'EN'],
                ['de', 'DE'],
                ['hu', 'HU'],
              ]}
            />
          </div>
        </Row>
        <Row>
          <span className="flex-1 text-[17px]">{t('Appearance')}</span>
          <div className="w-[190px]">
            <Segmented
              value={theme}
              onChange={setTheme}
              label={t('Appearance')}
              options={[
                ['auto', t('Auto')],
                ['light', t('Light')],
                ['dark', t('Dark')],
              ]}
            />
          </div>
        </Row>
        <Row>
          <label htmlFor="axo-tips" className="flex-1 text-[17px]">
            {t('Tips from the axolotl')}
          </label>
          <button
            id="axo-tips"
            role="switch"
            aria-checked={data.me.tips !== false}
            onClick={() => actions.setMe({ tips: data.me.tips === false })}
            className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${data.me.tips !== false ? 'bg-good' : 'bg-ink/15'}`}
          >
            <span
              className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-bounce ${data.me.tips !== false ? 'translate-x-5' : ''}`}
            />
          </button>
        </Row>
        <Row>
          <label htmlFor="ask-when" className="flex-1 text-[17px]">
            {t('Ask when I’ll do the next step')}
          </label>
          <button
            id="ask-when"
            role="switch"
            aria-checked={data.me.askWhen !== false}
            onClick={() => actions.setMe({ askWhen: data.me.askWhen === false })}
            className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${data.me.askWhen !== false ? 'bg-good' : 'bg-ink/15'}`}
          >
            <span
              className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-bounce ${data.me.askWhen !== false ? 'translate-x-5' : ''}`}
            />
          </button>
        </Row>
        {account && (
          <Row>
            <label htmlFor="acc-push" className="flex-1 text-[17px] leading-snug">
              {t('Notifications about likes, friends and chats')}
            </label>
            <button
              id="acc-push"
              role="switch"
              aria-checked={pushOn}
              onClick={async () => {
                try {
                  if (pushOn) await turnOffAccountPush(account.token)
                  else await turnOnAccountPush(account.token, lang)
                  setPushOn(!pushOn)
                } catch (e) {
                  actions.toast({ text: e?.code === 'install' ? 'Add Blank to your Home Screen to get notifications.' : 'Notifications are blocked for Blank in your settings.' })
                }
              }}
              className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${pushOn ? 'bg-good' : 'bg-ink/15'}`}
            >
              <span className={`absolute left-[2px] top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-200 ease-bounce ${pushOn ? 'translate-x-5' : ''}`} />
            </button>
          </Row>
        )}
        <li>
          <button onClick={actions.retakeOnboarding} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist">
            {t('Change my answers')}
          </button>
        </li>
      </ul>
      </div>

      <div className="xl:[&>*:first-child]:mt-0">
      <AccountSettings />

      <MessageSetting />
      <h2 className="section-label mt-8">{t('On this device')}</h2>
      <ul className={group}>
        <Row>
          <span className="flex-1 text-[17px]">{t('Photos')}</span>
          <span className="text-[17px] tabular-nums text-sub">
            {!stats ? '–' : stats.count ? `${stats.count} · ${mb(stats.bytes, lang)} MB` : t('None')}
          </span>
        </Row>
        <li>
          <button onClick={backup} disabled={!!busy} className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist disabled:opacity-50">
            {busy === 'backup' ? <Spinner className="h-5 w-5" /> : <Icon name="download" className="h-5 w-5" />}
            <span className="flex-1 text-left">{t('Back up')}</span>
            <span className={`flex shrink-0 items-center gap-1.5 text-[15px] ${backupStale ? 'font-semibold text-bad' : 'text-sub'}`}>
              {backupStale && <span className="h-2 w-2 rounded-full bg-bad" />}
              {backupWhen}
            </span>
          </button>
        </li>
        <li>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={!!busy}
            className="row min-h-[50px] text-[17px] text-spark-ink active:bg-mist disabled:opacity-50"
          >
            {busy === 'restore' ? <Spinner className="h-5 w-5" /> : <Icon name="upload" className="h-5 w-5" />}
            {t('Restore from a backup')}
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={restore} />
        </li>
      </ul>
      {restoreError && (
        <p className="mt-2 px-4 text-[15px] text-bad" role="alert">
          {restoreError}
        </p>
      )}

      <ul className={`${group} mt-6`}>
        <li>
          <button onClick={wipe} className="row min-h-[50px] text-[17px] text-bad active:bg-mist">
            {t('Delete everything')}
          </button>
        </li>
      </ul>
      <p className="mt-6 flex justify-center gap-5 text-[13px] text-sub">
        <a href={lang === 'hu' ? '/adatvedelem/' : '/datenschutz/'} target="_blank" rel="noopener" className="active:opacity-60">
          {t('Privacy policy')}
        </a>
        <a href="/impressum/" target="_blank" rel="noopener" className="active:opacity-60">
          {t('Imprint')}
        </a>
      </p>
      </div>
      </div>
      </div>
      {ask === 'wipe' && (
        <ConfirmSheet
          title={t('Delete everything?')}
          detail={tn(data.projects.length, '{n} project, your photos and your streak', '{n} projects, your photos and your streak')}
          confirm={t('Delete everything')}
          onClose={() => setAsk(null)}
          onConfirm={async () => {
            setAsk(null)
            await actions.resetAll()
          }}
        />
      )}
      {ask?.file && (
        <ConfirmSheet
          title={t('Replace with the backup?')}
          detail={tn(data.projects.length, '{n} project on this device will be replaced', '{n} projects on this device will be replaced')}
          confirm={t('Replace')}
          onClose={() => setAsk(null)}
          onConfirm={() => {
            const f = ask.file
            setAsk(null)
            doRestore(f)
          }}
        />
      )}
    </div>
  )
}
