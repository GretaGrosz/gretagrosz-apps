// Moderation queue (only for the handles in the YAP_ADMINS variable): every open report, its recording
// and caption, and two decisions — remove it for everyone, or keep it.
import { api } from './api.js'
import { revalidate, useResource } from './store.js'
import { t } from './i18n.js'
import { Avatar, Button, Empty, Icon, Loadable, Page, PlayButton, Waveform, fmt, timeAgo, toast } from './ui.jsx'

export default function Reports({ onBack }) {
  const res = useResource('/admin/reports')
  const act = async (r, action) => {
    try {
      await api('/admin/reports', { method: 'POST', body: { kind: r.kind, id: r.id, action } })
      toast(action === 'remove' ? t('removed') : t('kept'))
      revalidate('/admin/reports'); revalidate('/me')
    } catch (e) { toast(e.message, 'error') }
  }
  return (
    <Page onBack={onBack} label={t('reports')} title={<div className="truncate text-center text-[17px] font-semibold">{t('reports')}</div>}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-16">
        <Loadable res={res}>
          {d => d.reports.length ? d.reports.map(r => (
            <article key={r.kind + r.id} className="mt-4 rounded-[16px] bg-surface p-4">
              <div className="flex items-center gap-3">
                <Avatar user={r.user} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[17px] font-semibold">{r.user.name} <span className="font-normal text-muted">@{r.user.handle}</span></div>
                  <div className="truncate text-[14px] text-muted">{t('kind_' + r.kind)} · {t('nReports', { n: r.count })} · {timeAgo(r.first)}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {r.reasons.map(x => <span key={x} className="rounded-full bg-fill px-2.5 py-1 text-[13px] font-medium">{t('reason_' + x)}</span>)}
                {r.hidden && <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[13px] font-medium text-accent">{t('hiddenNow')}</span>}
              </div>
              {r.audio && (
                <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-fill p-2.5">
                  <PlayButton item={{ id: 'report-' + r.kind + r.id, audio: r.audio, duration: r.duration, user: r.user }} size={38} />
                  <Waveform id={'report-' + r.kind + r.id} wave={r.wave} height={28} />
                  <span className="text-[14px] tabular-nums text-muted">{fmt(r.duration)}</span>
                </div>
              )}
              {r.transcript && <p className="mt-2 text-[15px] text-muted">{r.transcript}</p>}
              <div className="mt-3 flex gap-2">
                <Button kind="gray" className="h-11 flex-1 text-[16px]" onClick={() => act(r, 'dismiss')}>{t('keep')}</Button>
                <Button className="h-11 flex-1 text-[16px]" onClick={() => act(r, 'remove')}>{r.kind === 'user' ? t('resetProfile') : t('remove')}</Button>
              </div>
            </article>
          )) : <Empty icon={<Icon.Shield size={34} />} title={t('noReports')} />}
        </Loadable>
      </div>
    </Page>
  )
}
