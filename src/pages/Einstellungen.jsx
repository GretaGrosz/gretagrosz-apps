import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LANGUAGES, useLang } from '../i18n.jsx'
import { jahrgaenge } from '../data/curriculum.js'
import { dayKey } from '../data/questions.js'
import { STORAGE_KEY, useProgress } from '../progress.jsx'
import Page from '../components/Page.jsx'
import { ConfirmSheet } from '../components/Sheet.jsx'
import { useToast } from '../components/ToastContext.jsx'
import { IconTile, ListGroup, ListRow } from '../components/List.jsx'
import { CapIcon, CheckIcon, DownloadIcon, GlobeIcon, UploadIcon } from '../components/Icons.jsx'
import { AccountSettings } from '../account/Account.jsx'

const Check = () => <CheckIcon className="h-5 w-5 text-accent-text" />

// Einstellungen: Konto, Jahrgang, Sprache, Sicherung des Fortschritts
export default function Einstellungen() {
  const navigate = useNavigate()
  const { lang, t } = useLang()
  const progress = useProgress()
  const toast = useToast()
  const fileRef = useRef(null)
  const [pending, setPending] = useState(null)
  const currentLang = LANGUAGES.find((l) => l.code === lang)

  const exportBackup = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '{}'
      const blob = new Blob([JSON.stringify({ app: 'bw-buddy', version: 1, savedAt: new Date().toISOString(), progress: JSON.parse(raw) }, null, 1)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bw-buddy-${dayKey()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast({ text: t('backupFailed') })
    }
  }

  const readBackup = async (file) => {
    try {
      const data = JSON.parse(await file.text())
      const p = data && data.app === 'bw-buddy' ? data.progress : data
      if (!p || typeof p !== 'object' || Array.isArray(p) || !('xp' in p || 'done' in p || 'exams' in p)) throw new Error('kein BW-Buddy-Stand')
      setPending(p)
    } catch {
      toast({ text: t('backupInvalid') })
    }
  }

  return (
    <Page title={t('settings')}>
      <AccountSettings />

      <ListGroup>
        <ListRow
          title={t('myYear')}
          left={<IconTile><CapIcon className="h-[18px] w-[18px]" /></IconTile>}
          right={progress.myYear ? t('yearLabel', { n: progress.myYear }) : null}
          onClick={() => navigate('/einstellungen/jahrgang')}
        />
        <ListRow
          title={t('language')}
          left={<IconTile><GlobeIcon className="h-[18px] w-[18px]" /></IconTile>}
          right={currentLang?.label}
          onClick={() => navigate('/einstellungen/sprache')}
        />
      </ListGroup>

      <ListGroup header={t('backup')} footer={progress.saveError ? t('saveError') : null}>
        <ListRow title={t('backupSave')} left={<IconTile tone="gray"><DownloadIcon className="h-[18px] w-[18px]" /></IconTile>} chevron={false} onClick={exportBackup} />
        <ListRow title={t('backupLoad')} left={<IconTile tone="gray"><UploadIcon className="h-[18px] w-[18px]" /></IconTile>} chevron={false} onClick={() => fileRef.current?.click()} />
      </ListGroup>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) readBackup(f)
        }}
      />

      <ConfirmSheet
        open={Boolean(pending)}
        title={t('backupReplaceQ')}
        confirmLabel={t('backupReplace')}
        cancelLabel={t('cancel')}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          progress.replaceAll(pending)
          setPending(null)
          toast({ text: t('backupLoaded') })
        }}
      />
    </Page>
  )
}

// /einstellungen/jahrgang
export function JahrgangWahl() {
  const { t } = useLang()
  const { myYear, setMyYear } = useProgress()
  return (
    <Page title={t('myYear')} back="/einstellungen">
      <ListGroup>
        {jahrgaenge.map((j) => (
          <ListRow key={j.id} title={t('yearLabel', { n: j.id })} chevron={false} selected={j.id === myYear} onClick={() => setMyYear(j.id)} right={j.id === myYear ? <Check /> : null} />
        ))}
      </ListGroup>
    </Page>
  )
}

// /einstellungen/sprache
export function SprachWahl() {
  const { lang, setLang, t } = useLang()
  return (
    <Page title={t('language')} back="/einstellungen">
      <ListGroup>
        {LANGUAGES.map((l) => (
          <ListRow key={l.code} title={l.label} chevron={false} selected={l.code === lang} onClick={() => setLang(l.code)} right={l.code === lang ? <Check /> : null} />
        ))}
      </ListGroup>
    </Page>
  )
}
