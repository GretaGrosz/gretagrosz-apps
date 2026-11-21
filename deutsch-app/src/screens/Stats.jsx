import { useState } from 'react'
import { useStore, currentStreak } from '../lib/store.js'
import { today, addDays, daysBetween, fmtShort, weekKey } from '../lib/dates.js'
import { CAT_NAMES, LESSONS, lessonDone } from '../lib/curriculum.js'
import { Page, TopBar, Stat, Tabs } from '../components/ui.jsx'
import { SKILL_LABEL, LevelCard } from './Home.jsx'
import Icon from '../components/Icon.jsx'

const CAT_COLORS = { G: '#16936b', R: '#d9480f', A: '#7048e8', B: '#e8a317', S: '#1c7ed6' }

// Weekly accuracy per category (G/R/A/B/S), like the teacher's correction symbols
function weeklySeries(cats, weeks = 10) {
  const end = weekKey(today())
  const keys = Array.from({ length: weeks }, (_, i) => addDays(end, -7 * (weeks - 1 - i)))
  const series = {}
  for (const c of Object.keys(CAT_COLORS)) series[c] = keys.map(() => [0, 0])
  for (const [d, v] of Object.entries(cats)) {
    const i = keys.indexOf(weekKey(d))
    if (i < 0) continue
    for (const [c, [n, ok]] of Object.entries(v)) if (series[c]) { series[c][i][0] += n; series[c][i][1] += ok }
  }
  return { keys, series }
}

function Chart({ cats }) {
  const { keys, series } = weeklySeries(cats)
  const W = 340, H = 180, L = 30, B = 22, T = 8
  const x = (i) => L + (i * (W - L - 8)) / (keys.length - 1)
  const y = (v) => T + (1 - v) * (H - T - B)
  const [hide, setHide] = useState({})
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Genauigkeit pro Kategorie und Woche">
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity=".12" />
            <text x={L - 4} y={y(v) + 4} fontSize="10" textAnchor="end" fill="currentColor" opacity=".6">{v * 100}%</text>
          </g>
        ))}
        {keys.map((k, i) => (i % 3 === 0 || i === keys.length - 1) && <text key={k} x={x(i)} y={H - 6} fontSize="10" textAnchor="middle" fill="currentColor" opacity=".6">{fmtShort(k)}</text>)}
        {Object.entries(series).filter(([c]) => !hide[c]).map(([c, pts]) => {
          const p = pts.map(([n, ok], i) => (n ? [x(i), y(ok / n)] : null)).filter(Boolean)
          if (!p.length) return null
          return (
            <g key={c}>
              <polyline points={p.map((q) => q.join(',')).join(' ')} fill="none" stroke={CAT_COLORS[c]} strokeWidth="2.5" strokeLinejoin="round" />
              {p.map((q, i) => <circle key={i} cx={q[0]} cy={q[1]} r="3" fill={CAT_COLORS[c]} />)}
            </g>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(CAT_COLORS).map(([c, col]) => (
          <button key={c} onClick={() => setHide((h) => ({ ...h, [c]: !h[c] }))} className={`chip ${hide[c] ? 'opacity-40' : ''}`}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: col }} />{c} · {CAT_NAMES[c]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Stats() {
  const s = useStore()
  const [tab, setTab] = useState('overview')
  const t = today()
  const totals = {}
  for (const v of Object.values(s.cats)) for (const [c, [n, ok]] of Object.entries(v)) { totals[c] = totals[c] || [0, 0]; totals[c][0] += n; totals[c][1] += ok }
  const answered = Object.values(s.answers).reduce((a, v) => a + v.n, 0)
  const cards = Object.entries(s.cards).map(([id, c]) => ({ id, ...c }))
  const top5 = cards.filter((c) => c.seen > 0 && !c.mastered).sort((a, b) => (b.wrongs - b.rightDays.length) - (a.wrongs - a.rightDays.length) || b.wrongs - a.wrongs).slice(0, 5)
  const skills = Object.entries(s.skills).filter(([, v]) => v.n >= 3).map(([k, v]) => ({ k, n: v.n, acc: v.c / v.n })).sort((a, b) => a.acc - b.acc)
  return (
    <Page wide>
      <TopBar title="Fortschritt" onBack={null} right={<a href="#/einstellungen" className="chip" aria-label="Einstellungen"><Icon name="settings" size={16} /></a>} />
      <div className="flex gap-2">
        <Stat label="Tage bis SA" value={Math.max(0, daysBetween(t, s.setup.examDate))} icon="calendar" />
        <Stat label="Streak" value={currentStreak(s)} sub={`Rekord ${s.streak.best || 0}`} icon="flame" />
        <Stat label="XP" value={s.xp.total} icon="star" />
      </div>
      <div className="mt-2 flex gap-2">
        <Stat label="Übungen" value={answered} icon="pen" />
        <Stat label="Lektionen" value={`${LESSONS.filter((l) => lessonDone(s, l.id)).length}/${LESSONS.length}`} icon="map" />
        <Stat label="Texte" value={s.texts.length} icon="fileText" />
      </div>
      <LevelCard s={s} />
      <div className="mt-4"><Tabs tabs={[['overview', 'Kategorien'], ['skills', 'Mikro-Skills'], ['top', 'Top-5 Fehler']]} value={tab} onChange={setTab} /></div>
      {tab === 'overview' && (
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 [&>*]:lg:mt-0">
          <div className="card">
            <p className="mb-2 font-bold">Genauigkeit pro Woche (wie die Korrekturzeichen)</p>
            <Chart cats={s.cats} />
          </div>
          <div className="card mt-3">
            {Object.keys(CAT_COLORS).map((c) => {
              const [n, ok] = totals[c] || [0, 0]
              return (
                <div key={c} className="flex items-center gap-3 border-t border-black/5 py-2 first:border-0 dark:border-white/10">
                  <span className="w-6 text-center font-bold" style={{ color: CAT_COLORS[c] }}>{c}</span>
                  <span className="flex-1 text-sm">{CAT_NAMES[c]}</span>
                  <span className="text-sm tabular-nums muted">{n} Übungen</span>
                  <span className="w-12 text-right font-semibold tabular-nums">{n ? Math.round((ok / n) * 100) + '%' : '–'}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {tab === 'skills' && (
        <div className="card">
          {skills.length === 0 && <p className="text-sm muted">Noch zu wenige Daten. Mach ein paar Lektionen!</p>}
          {skills.map((k) => (
            <a key={k.k} href={`#/ueben?skill=${encodeURIComponent(k.k)}`} className="flex items-center gap-3 border-t border-black/5 py-2 first:border-0 dark:border-white/10">
              <span className="flex-1 text-sm">{SKILL_LABEL(k.k)}</span>
              <span className="text-xs muted">{k.n}×</span>
              <div className="h-2 w-20 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full" style={{ width: `${k.acc * 100}%`, background: k.acc >= 0.9 ? '#16936b' : k.acc >= 0.7 ? '#e8a317' : '#e03131' }} /></div>
              <span className="w-10 text-right text-sm font-semibold tabular-nums">{Math.round(k.acc * 100)}%</span>
            </a>
          ))}
        </div>
      )}
      {tab === 'top' && (
        <div className="card">
          {top5.length === 0 && <p className="text-sm muted">Noch keine Fehler gesammelt.</p>}
          {top5.map((c, i) => (
            <div key={c.id} className="border-t border-black/5 py-2 first:border-0 dark:border-white/10">
              <p className="text-sm font-semibold">{i + 1}. {String(c.item.w || c.item.q || c.item.en || '').replace('___', '…').slice(0, 90)}</p>
              <p className="text-sm text-green-700 dark:text-green-400">richtig: {String([].concat(c.item.a)[0]).slice(0, 90)}</p>
              <p className="text-xs muted">{c.wrongs}× falsch · Box {c.box} · richtig an {c.rightDays.length}/3 Tagen</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href="#/fehler" className="btn-ghost gap-2"><Icon name="notebook" size={18} />Meine Fehler</a>
        <a href="#/einstellungen" className="btn-ghost gap-2"><Icon name="settings" size={18} />Einstellungen</a>
      </div>
    </Page>
  )
}
