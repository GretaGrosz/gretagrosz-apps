// Reporting and blocking. Every yap, voice message and profile can be reported; reports reach the moderators,
// and three reports hide a yap until someone has looked. Blocking ends the friendship and hides both people from each other.
import { useState } from 'react'
import { api } from './api.js'
import { revalidate } from './store.js'
import { t } from './i18n.js'
import { ActionSheet, Button, Icon, Sheet, SheetHeader, Spinner, toast } from './ui.jsx'

const REASONS = ['mean', 'inappropriate', 'harm', 'spam', 'other']

/** target: { kind: 'post' | 'message' | 'user', id?, user } */
export function ReportSheet({ target, onClose, onDone }) {
  const [reason, setReason] = useState(null)
  const [block, setBlock] = useState(false)
  const [busy, setBusy] = useState(false)
  const send = async () => {
    setBusy(true)
    try {
      await api('/reports', { method: 'POST', body: { kind: target.kind, id: target.id, handle: target.user.handle, reason, block } })
      toast(block ? t('reportedBlocked', { name: target.user.name }) : t('reported'))
      revalidate('/feed'); revalidate('/friends'); revalidate('/chats'); revalidate('/unheard')
      onDone?.({ blocked: block })
      onClose()
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const title = target ? t(target.kind === 'user' ? 'reportUser' : target.kind === 'message' ? 'reportMessage' : 'reportYap') : ''
  return (
    <Sheet open={!!target} onClose={onClose} label={title}>
      {target && (
        <>
          <SheetHeader title={title} onClose={onClose} />
          <div className="overflow-y-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
            <div role="radiogroup" aria-label={t('reason')} className="divide-y divide-line overflow-hidden rounded-[12px] bg-surface">
              {REASONS.map(r => (
                <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className="flex min-h-[50px] w-full items-center gap-3 px-4 text-left text-[17px] active:bg-fill">
                  <span className="flex-1">{t('reason_' + r)}</span>
                  {reason === r && <Icon.Check size={20} className="text-accent" />}
                </button>
              ))}
            </div>
            <label className="mt-4 flex min-h-[50px] items-center gap-3 rounded-[12px] bg-surface px-4">
              <span className="flex-1 text-[17px]">{t('alsoBlock', { name: target.user.name })}</span>
              <Switch on={block} onChange={setBlock} label={t('alsoBlock', { name: target.user.name })} />
            </label>
            {reason === 'harm' && <p className="mt-3 px-1 text-[15px] text-muted">{t('harmHelp')}</p>}
            <Button className="mt-5 h-[50px] w-full" disabled={!reason || busy} onClick={send}>{busy ? <Spinner /> : t('sendReport')}</Button>
          </div>
        </>
      )}
    </Sheet>
  )
}

export function Switch({ on, onChange, label, disabled }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${on ? 'bg-[var(--green)]' : 'bg-[var(--switch-off)]'}`}>
      <span className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-[left] duration-200 ease-[var(--ease)]" style={{ left: on ? 22 : 2 }} />
    </button>
  )
}

/** Confirm-and-block for a person; returns [open(user), sheetElement] */
export function useBlock(onBlocked) {
  const [user, setUser] = useState(null)
  const block = async () => {
    try {
      await api(`/users/${user.handle}/block`, { method: 'POST' })
      toast(t('blocked', { name: user.name }))
      revalidate('/friends'); revalidate('/chats'); revalidate('/feed'); revalidate('/unheard'); revalidate('/me')
      onBlocked?.(user)
    } catch (e) { toast(e.message, 'error') }
  }
  const sheet = (
    <ActionSheet open={!!user} onClose={() => setUser(null)} title={user ? t('blockQ', { name: user.name }) : ''} message={t('blockWhat')}
      actions={[{ label: t('block'), destructive: true, onClick: block }]} />
  )
  return [setUser, sheet]
}
