import { useRef, useState } from 'react'
import { loadAI, saveAI, testKey } from '../ai'
import { dateOfDay, dayOfIso } from '../dates'
import { fmtDate, getLang, t, tn } from '../i18n'
import { BackupError, parseBackup, readPrevious, summary } from '../store'
import { BackButton, CheckIcon, Header, NavBar, Page, SectionHeader, Segmented, Sheet } from '../ui'

const BACKUP_ERRORS = {
  'not-json': 'This file isn’t a QED backup.',
  'not-qed': 'This file isn’t a QED backup.',
  newer: 'This backup is from a newer version of QED. Reload the page and try again.',
}

function Summary({ s, savedAt }) {
  return (
    <div className="group">
      <div className="row">
        <span className="body flex-1">{t('Plan')}</span>
        <span className="body secondary tabular-nums">{t('Day {n}', { n: s.day })}</span>
      </div>
      <div className="row">
        <span className="body flex-1">{t('Days done')}</span>
        <span className="body secondary tabular-nums">{s.done}</span>
      </div>
      <div className="row">
        <span className="body flex-1">{t('Streak')}</span>
        <span className="body secondary tabular-nums">{s.streak}</span>
      </div>
      {s.mocks > 0 && (
        <div className="row">
          <span className="body flex-1">{t('Mocks')}</span>
          <span className="body secondary tabular-nums">{s.mocks}</span>
        </div>
      )}
      {savedAt && (
        <div className="row">
          <span className="body flex-1">{t('Saved')}</span>
          <span className="body secondary">{fmtDate(savedAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      )}
    </div>
  )
}

export function SettingsScreen({ state, setState, replaceState, ai, lang, onLang, onBack, backLabel, onBackup }) {
  const [key, setKey] = useState(() => loadAI().key)
  const [keyStatus, setKeyStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [incoming, setIncoming] = useState(null) // a parsed backup waiting for confirmation
  const [fileError, setFileError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)
  const [restoring, setRestoring] = useState(null)
  const [saved, setSaved] = useState('')
  const fileInput = useRef(null)
  const prev = readPrevious()
  const examDay = dayOfIso(state.examDate)

  const test = async () => {
    setBusy(true)
    setKeyStatus('')
    try {
      await testKey()
      setKeyStatus('ok')
    } catch (e) {
      setKeyStatus(e.message)
    }
    setBusy(false)
  }

  const pickFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setFileError('')
    if (file.size > 20_000_000) return setFileError(t('This file isn’t a QED backup.'))
    try {
      setIncoming(parseBackup(await file.text()))
    } catch (err) {
      setFileError(t(err instanceof BackupError ? BACKUP_ERRORS[err.code] || BACKUP_ERRORS['not-qed'] : BACKUP_ERRORS['not-qed']))
    }
  }

  return (
    <>
      <NavBar title={t('Settings')} left={<BackButton onClick={onBack} label={backLabel} />} />
      <Page>
        <Header title={t('Settings')} />

        <SectionHeader>{t('Language')}</SectionHeader>
        <Segmented value={lang} onChange={onLang} options={[['en', 'English'], ['de', 'Deutsch']]} label={t('Language')} />

        <SectionHeader>{t('Competition')}</SectionHeader>
        <div className="group">
          <label className="row relative cursor-pointer">
            <span className="body flex-1" lang="de">
              Regionalwettbewerb
            </span>
            <span className="body" style={{ color: examDay != null ? 'var(--label-2)' : 'var(--link)' }}>
              {examDay != null ? fmtDate(dateOfDay(examDay), { day: 'numeric', month: 'long', year: 'numeric' }) : t('Add')}
            </span>
            <input
              type="date"
              value={state.examDate}
              onChange={(e) => setState((s) => ({ ...s, examDate: e.target.value }))}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t('Date of the Regionalwettbewerb')}
              lang={getLang() === 'de' ? 'de-AT' : 'en-GB'}
            />
          </label>
          {examDay != null && (
            <button onClick={() => setState((s) => ({ ...s, examDate: '' }))} className="row" style={{ color: 'var(--red)' }}>
              <span className="body">{t('Remove the date')}</span>
            </button>
          )}
          <div className="row">
            <span className="body flex-1">{t('Your target')}</span>
            <button onClick={() => setState((s) => ({ ...s, target: Math.max(1, (s.target || 16) - 1) }))} className="btn btn-gray h-11 w-11 p-0 text-[22px]" aria-label={t('Lower target')}>
              −
            </button>
            <span className="headline w-14 text-center tabular-nums">{state.target || 16}/32</span>
            <button onClick={() => setState((s) => ({ ...s, target: Math.min(32, (s.target || 16) + 1) }))} className="btn btn-gray h-11 w-11 p-0 text-[22px]" aria-label={t('Raise target')}>
              +
            </button>
          </div>
        </div>

        <SectionHeader>{t('AI marking')}</SectionHeader>
        <div className="group">
          {ai.hosted && (
            <div className="row">
              <span className="body flex-1">{t('Marks today')}</span>
              <span className="body secondary tabular-nums">{ai.limit != null && ai.marksLeft != null ? t('{left} of {limit} left', { left: ai.marksLeft, limit: ai.limit }) : '–'}</span>
            </div>
          )}
          <label className="row">
            <span className="body shrink-0">{t('Own API key')}</span>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                const k = e.target.value.trim()
                setKey(k)
                setKeyStatus('')
                saveAI({ key: k })
              }}
              placeholder="sk-ant-…"
              autoComplete="off"
              spellCheck="false"
              className="min-w-0 flex-1 bg-transparent text-right text-[17px] outline-none placeholder:text-[var(--label-2)]"
              style={{ color: 'var(--label)' }}
            />
          </label>
          {key && (
            <button onClick={test} disabled={busy} className="row disabled:opacity-40">
              <span className="body flex-1" style={{ color: 'var(--link)' }}>
                {busy ? t('Testing…') : t('Test the key')}
              </span>
              {keyStatus === 'ok' && <CheckIcon className="h-5 w-5 text-[var(--green)]" />}
            </button>
          )}
        </div>
        {keyStatus && keyStatus !== 'ok' && (
          <p className="footnote mt-2 px-4" style={{ color: 'var(--red)' }} role="alert">
            {keyStatus}
          </p>
        )}

        <SectionHeader>{t('Backup')}</SectionHeader>
        <div className="group">
          <button
            onClick={async () => {
              const at = await onBackup()
              if (at) setSaved(at)
            }}
            className="row"
          >
            <span className="body flex-1" style={{ color: 'var(--link)' }}>
              {t('Save a backup')}
            </span>
            <span className="footnote">{state.lastBackup ? fmtDate(state.lastBackup, { day: 'numeric', month: 'short' }) : t('Never')}</span>
          </button>
          <button onClick={() => fileInput.current.click()} className="row">
            <span className="body" style={{ color: 'var(--link)' }}>
              {t('Load a backup')}
            </span>
          </button>
          {prev && (
            <button onClick={() => setRestoring(prev)} className="row">
              <span className="min-w-0 flex-1">
                <span className="body block" style={{ color: 'var(--link)' }}>
                  {t('Bring back the previous progress')}
                </span>
                <span className="footnote block">
                  {t('From before {when}', { when: fmtDate(prev.savedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
                </span>
              </span>
            </button>
          )}
          <input ref={fileInput} type="file" accept=".json,application/json" className="hidden" onChange={pickFile} />
        </div>
        {saved && !fileError && (
          <p className="footnote fade-in mt-2 px-4" style={{ color: 'var(--green)' }}>
            {t('Backup saved')}
          </p>
        )}
        {fileError && (
          <p className="footnote mt-2 px-4" style={{ color: 'var(--red)' }} role="alert">
            {fileError}
          </p>
        )}

        <div className="group mt-8">
          <button onClick={() => setConfirmReset(true)} className="row">
            <span className="body" style={{ color: 'var(--red)' }}>
              {t('Reset progress')}
            </span>
          </button>
        </div>
        <p className="footnote mt-6 px-4 text-center">{t('Not affiliated with the Österreichische Mathematik-Olympiade.')}</p>
      </Page>

      {incoming && (
        <Sheet onClose={() => setIncoming(null)} label={t('Load this backup?')}>
          <p className="title3 mb-3 px-1">{t('Load this backup?')}</p>
          <Summary s={incoming.summary} savedAt={incoming.savedAt} />
          <p className="footnote mt-3 px-1">{t('It replaces the progress on this device. You can bring the current progress back afterwards.')}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => setIncoming(null)} className="btn btn-gray">
              {t('Cancel')}
            </button>
            <button
              onClick={() => {
                replaceState(incoming.state, 'import')
                setIncoming(null)
              }}
              className="btn btn-filled"
            >
              {t('Load')}
            </button>
          </div>
        </Sheet>
      )}

      {restoring && (
        <Sheet onClose={() => setRestoring(null)} label={t('Bring back the previous progress?')}>
          <p className="title3 mb-3 px-1">{t('Bring back the previous progress?')}</p>
          <Summary s={summary(restoring.state)} savedAt={null} />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button onClick={() => setRestoring(null)} className="btn btn-gray">
              {t('Cancel')}
            </button>
            <button
              onClick={() => {
                replaceState(restoring.state, 'restore')
                setRestoring(null)
              }}
              className="btn btn-filled"
            >
              {t('Bring Back')}
            </button>
          </div>
        </Sheet>
      )}

      {confirmReset && (
        <Sheet onClose={() => setConfirmReset(false)} label={t('Reset all progress?')}>
          <p className="title3 mb-1 px-1">{t('Reset all progress?')}</p>
          <p className="subhead secondary mb-4 px-1">{tn(Object.keys(state.results).length, '{n} day done so far.', '{n} days done so far.')}</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setConfirmReset(false)} className="btn btn-gray">
              {t('Cancel')}
            </button>
            <button
              onClick={() => {
                replaceState({ examDate: state.examDate, target: state.target }, 'reset')
                setConfirmReset(false)
              }}
              className="btn btn-destructive"
            >
              {t('Reset')}
            </button>
          </div>
        </Sheet>
      )}
    </>
  )
}
