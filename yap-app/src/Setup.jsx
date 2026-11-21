// Getting Yap onto the phone properly: notifications, the Home Screen, and a passkey backup.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from './api.js'
import { revalidate } from './store.js'
import { cancelled, carryCode, disablePush, enablePush, isIOS, isStandalone, passkeysSupported, pushStatus, savePasskey, stopCarrying } from './device.js'
import { t } from './i18n.js'
import { Switch } from './Safety.jsx'
import { Button, Icon, Row, SPRING, Sheet, SheetHeader, Spinner, toast, useApp } from './ui.jsx'

const DISMISS = 'yap.notifyCard'
const dismissed = () => { try { return localStorage.getItem(DISMISS) === '1' } catch { return false } }

export function usePushStatus() {
  const [status, setStatus] = useState(null)
  const check = () => pushStatus().then(setStatus).catch(() => setStatus('unsupported'))
  useEffect(() => { check() }, [])
  return [status, check]
}

/** Turns notifications on (from a tap) and sends a test one */
export function useTurnOn(after) {
  const [busy, setBusy] = useState(false)
  const on = async () => {
    setBusy(true)
    try {
      await enablePush()
      toast(t('notificationsOn'))
      api('/push/test', { method: 'POST' }).catch(() => {})
    } catch (e) { toast(e.code ? t(e.code) : e.message, 'error') }
    setBusy(false)
    after?.()
  }
  return [on, busy]
}

/** Card in the feed until notifications are on (or it is closed) */
export function NotifyCard() {
  const [status, check] = usePushStatus()
  const [hidden, setHidden] = useState(dismissed)
  const [install, setInstall] = useState(false)
  const [on, busy] = useTurnOn(check)
  const show = !hidden && (status === 'off' || status === 'install')
  const close = () => { setHidden(true); try { localStorage.setItem(DISMISS, '1') } catch {} }
  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.section initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={SPRING} className="overflow-hidden">
            <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-surface py-2 pl-4 pr-1">
              <Icon.Bell size={22} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1 text-[16px] font-semibold leading-snug">{status === 'install' ? t('addToHomeTitle') : t('notifyTitle')}</div>
              {status === 'install'
                ? <Button kind="tinted" className="h-9 shrink-0 px-4 text-[15px]" onClick={() => setInstall(true)}>{t('how')}</Button>
                : <Button kind="tinted" className="h-9 shrink-0 px-4 text-[15px]" disabled={busy} onClick={on}>{busy ? <Spinner size={15} /> : t('turnOn')}</Button>}
              <button type="button" onClick={close} className="grid h-11 w-11 shrink-0 place-items-center text-muted" aria-label={t('close')}><Icon.Close size={16} /></button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
    </>
  )
}

/**
 * Safari → Share → Add to Home Screen. While these steps are open, the page carries a one-time sign-in code,
 * so the Home Screen app (which has its own storage on iPhone) opens already signed in.
 */
export function InstallSheet({ open, onClose }) {
  const { me } = useApp() || {}
  const [code, setCode] = useState(null)
  useEffect(() => {
    if (!open || !me) return
    const before = location.hash
    let live = true
    api('/link-code', { method: 'POST' }).then(d => { if (live) { setCode(d.code); carryCode(d.code) } }).catch(() => {})
    return () => { live = false; stopCarrying(before); setCode(null) }
  }, [open])
  return (
    <Sheet open={open} onClose={onClose} label={t('addToHome')}>
      <SheetHeader title={t('addToHome')} onClose={onClose} closeLabel={t('done')} />
      <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-2">
        <ol className="flex flex-col gap-5">
          <Step n={1}>
            <span>{t('installStep1a')}</span>
            <span className="mx-1.5 inline-grid h-8 w-8 translate-y-[2px] place-items-center rounded-[8px] bg-fill text-[var(--blue)]"><Icon.Share size={19} /></span>
            <span>{t('installStep1b')}</span>
          </Step>
          <Step n={2}>
            <span className="inline-flex w-full items-center justify-between rounded-[10px] bg-surface px-3 py-2.5 text-[16px]">
              {t('addToHome')}
              <span className="grid h-6 w-6 place-items-center rounded-[6px] border-[1.5px] border-label"><Icon.Plus size={15} /></span>
            </span>
          </Step>
          <Step n={3}><span>{t('installStep3')}</span></Step>
        </ol>
        {code && (
          <div className="mt-6 flex items-center justify-between rounded-[12px] bg-fill px-4 py-3">
            <span className="text-[15px] text-muted">{t('signInCode')}</span>
            <span className="font-mono text-[19px] font-semibold tracking-[0.1em]">{code.slice(0, 4)} {code.slice(4)}</span>
          </div>
        )}
      </div>
    </Sheet>
  )
}
const Step = ({ n, children }) => (
  <li className="flex items-center gap-3 text-[17px]">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent text-[15px] font-bold text-white">{n}</span>
    <span className="min-w-0 flex-1">{children}</span>
  </li>
)

/** Me → Notifications */
export function NotificationsRow() {
  const [status, check] = usePushStatus()
  const [install, setInstall] = useState(false)
  const [on, busy] = useTurnOn(check)
  const off = async () => { await disablePush().catch(() => {}); check() }
  if (status === 'unsupported') return null
  return (
    <>
      <Row icon={<Icon.Bell size={22} />} title={t('notifications')} value={status === 'denied' ? t('blockedInSettings') : null}>
        {(status === 'on' || status === 'off') && <Switch on={status === 'on'} disabled={busy} onChange={v => (v ? on() : off())} label={t('notifications')} />}
        {status === 'install' && <Button kind="tinted" className="h-9 px-4 text-[15px]" onClick={() => setInstall(true)}>{t('how')}</Button>}
      </Row>
      <InstallSheet open={install} onClose={() => setInstall(false)} />
    </>
  )
}

/** Saves a passkey; `onDone` runs after it is saved */
export function usePasskey(onDone) {
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      await savePasskey()
      revalidate('/me')
      toast(t('passkeySaved'))
      onDone?.()
    } catch (e) {
      if (!cancelled(e)) toast(e.message || t('passkeyFailed'), 'error')
    }
    setBusy(false)
  }
  return [save, busy]
}

/** Me → Passkey */
export function PasskeyRow() {
  const { meData } = useApp()
  const [save, busy] = usePasskey()
  if (!passkeysSupported) return null
  return (
    <Row icon={<Icon.Passkey size={22} />} title={t('passkey')} value={meData?.passkeys ? t('on') : null}>
      {!meData?.passkeys && <Button kind="tinted" className="h-9 px-4 text-[15px]" disabled={busy} onClick={save}>{busy ? <Spinner size={15} /> : t('save')}</Button>}
    </Row>
  )
}

export const needsHomeScreen = isIOS && !isStandalone
