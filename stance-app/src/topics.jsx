// My topics: your own speaking topics for Practice, e.g. your school's Matura topic areas. Paste a whole list at once,
// one topic per line (numbering and bullets are stripped). Tap a topic to remove it.
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { api, useLoad } from './api.js'
import { t } from './i18n.js'
import { Actions, Button, Card, Empty, Icon, LoadError, Page, Spinner, TextArea, spring, useApp } from './ui.jsx'

export function TopicsPage({ onBack, covered }) {
  const { toast, refresh, bump } = useApp()
  const { data, error, reload, setData } = useLoad('topics', '/topics', [refresh])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [picked, setPicked] = useState(null)
  const topics = data?.topics

  const add = async () => {
    if (!text.trim() || busy) return
    setBusy(true)
    try {
      const r = await api('/topics', { method: 'POST', body: { text } })
      setData({ topics: r.topics })
      setText('')
      toast(r.added ? t('topics.added', { n: r.added }) : t('topics.already'))
      bump()
    } catch (e) { toast(e.message, 'error') }
    setBusy(false)
  }
  const remove = async topic => {
    setData(d => ({ topics: d.topics.filter(x => x.id !== topic.id) }))
    try { setData(await api(`/topics/${topic.id}`, { method: 'DELETE' })); bump() } catch (e) { toast(e.message, 'error'); reload() }
  }

  return (
    <Page covered={covered} onBack={onBack} title={t('topics.title')}>
      <header className="px-5 pb-3 pt-1">
        <h1 className="text-[34px] font-bold leading-[41px]">{t('topics.title')}</h1>
        {topics && <p className="mt-0.5 text-[15px] text-fg2">{t('topics.count', { n: topics.length })}</p>}
      </header>
      <div className="px-4">
        <Card className="px-4 pb-3 pt-3">
          <TextArea value={text} onChange={setText} max={8000} rows={3} placeholder={t('topics.placeholder')} onSubmit={add} label={t('topics.placeholder')} />
          <Button size="md" className="mt-1 w-full" disabled={!text.trim() || busy} onClick={add}>{busy ? <Spinner /> : <><Icon.Plus size={18} />{t('topics.add')}</>}</Button>
        </Card>
      </div>
      {!topics ? (
        error ? <LoadError error={error} onRetry={reload} /> : <div className="grid place-items-center py-20 text-fg2"><Spinner size={24} /></div>
      ) : topics.length ? (
        <Card className="mx-4 mt-5 overflow-hidden !rounded-[18px]">
          <AnimatePresence initial={false}>
            {topics.map((x, i) => (
              <motion.button key={x.id} type="button" layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }} transition={spring}
                onClick={() => setPicked(x)} className={`prose-wrap block min-h-[48px] w-full px-4 py-3 text-left text-[16.5px] leading-snug active:bg-fill ${i ? 'border-t border-line' : ''}`}>
                {x.text}
              </motion.button>
            ))}
          </AnimatePresence>
        </Card>
      ) : (
        <Empty icon={<Icon.List size={30} />} title={t('topics.empty')} />
      )}
      <Actions open={!!picked} onClose={() => setPicked(null)} items={[
        picked && { label: t('topics.remove'), icon: <Icon.Trash size={20} />, danger: true, onClick: () => remove(picked) },
      ]} />
    </Page>
  )
}
