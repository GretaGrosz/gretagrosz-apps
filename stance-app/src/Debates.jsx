// Debates, reached from Today: the full list (live, open challenges, yours, finished) and the card used everywhere.
// The debate page and the new-debate sheet live in debate-page.jsx and debate-new.jsx.
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLoad } from './api.js'
import { t, timeAgo } from './i18n.js'
import { Button, Card, Empty, Icon, IconButton, LoadError, Page, Segmented, SectionTitle, Spinner, spring, useApp } from './ui.jsx'
import { Kicker, MiniMatchup, MiniSplit, TurnDots, statusLine } from './debate-parts.jsx'

export { DebatePage } from './debate-page.jsx'
export { NewDebate } from './debate-new.jsx'

const SEGS = ['live', 'open', 'mine', 'closed']

export function DebatesPage({ seg: initial, onBack, covered }) {
  const { me, refresh, openNewDebate } = useApp()
  // me is undefined while a signed-in identity is still loading; only a guest (null) has no Mine
  const [seg, setSeg] = useState(SEGS.includes(initial) && (initial !== 'mine' || me !== null) ? initial : 'live')
  const segs = me !== null ? SEGS : SEGS.filter(s => s !== 'mine')
  // Each list keeps its own cache and request, so switching shows the last copy at once and a slow reply can't block another
  const { data, error, reload } = useLoad(`debates.${seg}`, `/debates?tab=${seg}`, [refresh])
  const list = data?.debates

  return (
    <Page covered={covered} onBack={onBack} title={t('debates.title')} right={<IconButton label={t('debates.new')} onClick={() => openNewDebate()}><Icon.Plus size={21} /></IconButton>}>
      <header className="px-5 pb-3 pt-1"><h1 className="text-[34px] font-bold leading-[41px]">{t('debates.title')}</h1></header>
      <div className="px-4">
        <Segmented options={segs.map(id => ({ id, label: t('debates.seg.' + id) }))} value={seg} onChange={setSeg} label={t('debates.title')} />
      </div>
      {!list ? (
        error ? <LoadError error={error} onRetry={reload} icon={<Icon.Debate size={28} />} /> : <div className="grid place-items-center py-24 text-fg2"><Spinner size={24} /></div>
      ) : seg === 'mine' ? (
        <MineList debates={list} />
      ) : list.length ? (
        <CardList debates={list} className="pt-4" />
      ) : (
        <Empty icon={<Icon.Debate size={30} />} title={t('debates.empty.' + seg)}>
          {seg !== 'closed' && <Button className="mt-5" onClick={() => openNewDebate()}><Icon.Plus size={18} />{t('debates.new')}</Button>}
        </Empty>
      )}
    </Page>
  )
}

function CardList({ debates, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 px-4 ${className}`}>
      {debates.map((d, i) => (
        <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: Math.min(i, 8) * 0.03 }}>
          <DebateCard debate={d} />
        </motion.div>
      ))}
    </div>
  )
}

/** Yours: what needs you first, then live, then challenges you sent (declined ones too), then finished */
function MineList({ debates }) {
  const { openNewDebate } = useApp()
  const groups = [
    ['yourMove', debates.filter(d => d.needsMe)],
    ['inProgress', debates.filter(d => !d.needsMe && d.status === 'active')],
    ['waiting', debates.filter(d => !d.needsMe && ['open', 'pending', 'declined'].includes(d.status))],
    ['finished', debates.filter(d => d.status === 'closed')],
  ].filter(g => g[1].length)
  if (!groups.length) {
    return (
      <Empty icon={<Icon.Swords size={30} />} title={t('debates.empty.mine')}>
        <Button className="mt-5" onClick={() => openNewDebate()}><Icon.Plus size={18} />{t('debates.new')}</Button>
      </Empty>
    )
  }
  return groups.map(([key, list]) => (
    <section key={key}>
      <SectionTitle>{t('debates.group.' + key)}</SectionTitle>
      <CardList debates={list} />
    </section>
  ))
}

/** A debate in a list: motion, the two debaters, where it stands. Tap to read it. */
export function DebateCard({ debate: d }) {
  const { me, openDebate } = useApp()
  return (
    <motion.button type="button" onClick={() => openDebate(d.id)} whileTap={{ scale: 0.985 }} transition={spring} className="block w-full text-left">
      <Card className="px-5 pb-3.5 pt-4">
        <div className="flex h-6 items-center justify-between gap-3">
          <Kicker d={d} />
          <span className="text-[13px] tabular-nums text-fg2">{timeAgo(d.updated)}</span>
        </div>
        <h3 className="serif prose-wrap mt-2 text-[21px] font-medium leading-[1.22] text-fg">{d.motion}</h3>
        <div className="mt-4"><MiniMatchup d={d} me={me} /></div>
        <div className="mt-3.5 flex items-center gap-3 border-t border-line pt-3">
          <span className={`min-w-0 flex-1 truncate text-[14px] ${d.needsMe ? 'font-semibold text-accent-ink' : 'text-fg2'}`}>{statusLine(d, me)}</span>
          {d.status === 'active' && <TurnDots d={d} />}
          {d.status === 'closed' && d.votes && d.votes[0] + d.votes[1] > 0 && <MiniSplit votes={d.votes} />}
        </div>
      </Card>
    </motion.button>
  )
}
