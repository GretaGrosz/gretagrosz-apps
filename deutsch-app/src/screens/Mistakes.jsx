import { useState } from 'react'
import { useStore, update } from '../lib/store.js'
import { seedMine } from '../lib/srs.js'
import { today } from '../lib/dates.js'
import { Page, TopBar, En, Tabs, UmlautBar } from '../components/ui.jsx'
import seed from '../../data/my-errors.json'
import { CAT_NAMES } from '../lib/curriculum.js'
import Icon from '../components/Icon.jsx'

const CATS = ['G', 'R', 'A', 'B', 'S', 'Textsorte']

// Parse lines like "falsch | richtig | Kategorie" (from the Claude feedback)
export function parseImport(text) {
  const rows = []
  for (const raw of text.split('\n')) {
    const line = raw.replace(/^\s*[-*•\d.)]+\s*/, '').trim()
    if (!line.includes('|')) continue
    const cells = line.split('|').map((c) => c.trim()).filter((c, i, a) => !(c === '' && (i === 0 || i === a.length - 1)))
    if (cells.length < 2) continue
    if (/^falsch$/i.test(cells[0]) || /^-+$/.test(cells[0].replace(/[:\s]/g, ''))) continue
    const cat = (cells[2] || 'G').toUpperCase().match(/[GRABS]|TEXTSORTE/)?.[0] || 'G'
    rows.push({ wrong: cells[0], correct: cells[1], category: cat === 'TEXTSORTE' ? 'Textsorte' : cat, note: cells[3] || '' })
  }
  return rows
}

export default function Mistakes() {
  const s = useStore()
  const [tab, setTab] = useState('deck')
  const all = [...seed, ...s.mine]
  return (
    <Page wide>
      <TopBar title="Meine Fehler" />
      <Tabs tabs={[['deck', `Deck (${all.length})`], ['add', '+ Neu'], ['import', 'Import']]} value={tab} onChange={setTab} />
      {tab === 'deck' && <Deck all={all} s={s} />}
      {tab === 'add' && <AddForm onDone={() => setTab('deck')} />}
      {tab === 'import' && <ImportBox onDone={() => setTab('deck')} />}
    </Page>
  )
}

function Deck({ all, s }) {
  const [open, setOpen] = useState(null)
  const mastered = all.filter((e) => s.cards['mine.' + e.id]?.mastered).length
  return (
    <>
      <div className="card mb-3 flex items-center gap-3">
        <div className="flex-1">
          <p className="font-bold">{mastered}/{all.length} gemeistert</p>
          <p className="text-sm muted">Gemeistert = an 3 verschiedenen Tagen richtig. Die Karten kommen in „Üben“.</p>
        </div>
        <a href="#/ueben" className="btn-primary">Üben</a>
      </div>
      <ul className="space-y-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-2 lg:space-y-0">
        {all.map((e) => {
          const c = s.cards['mine.' + e.id]
          return (
            <li key={e.id} className="card !p-3" onClick={() => setOpen(open === e.id ? null : e.id)}>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 rounded-md bg-black/5 px-1.5 text-xs font-bold dark:bg-white/10">{e.category}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] text-red-600 line-through decoration-red-300 dark:text-red-400">{e.wrong}</p>
                  <p className="text-[15px] font-semibold text-green-700 dark:text-green-400">{e.correct}</p>
                </div>
                <span className="text-xs muted">{c?.mastered ? <Icon name="checkCircle" size={16} className="text-green-600" /> : c ? `Box ${c.box}` : ''}</span>
              </div>
              {open === e.id && (
                <div className="mt-2 border-t border-black/5 pt-2 text-sm dark:border-white/10">
                  {e.rule && <p className="flex gap-2"><Icon name="bulb" size={16} className="mt-0.5 text-gold" /><span>{e.rule}</span></p>}
                  <En>{e.ruleEn}</En>
                  {e.note && <p className="mt-1 muted">Notiz: {e.note}</p>}
                  {c && <p className="mt-1 text-xs muted">Richtig an {c.rightDays.length}/3 Tagen · nächste Wiederholung {c.due}</p>}
                  {e.added && <button className="mt-2 text-xs font-semibold text-red-500" onClick={(ev) => { ev.stopPropagation(); if (confirm('Diesen Fehler löschen?')) update((st) => { st.mine = st.mine.filter((m) => m.id !== e.id); delete st.cards['mine.' + e.id] }) }}>Löschen</button>}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function AddForm({ onDone }) {
  const [f, setF] = useState({ wrong: '', correct: '', category: 'G', note: '' })
  const save = () => {
    const e = { ...f, id: 'u' + Date.now().toString(36), rule: f.note, ruleEn: '', added: today() }
    update((s) => { s.mine.push(e) })
    seedMine([])
    onDone()
  }
  return (
    <div className="card space-y-3">
      <p className="text-sm muted">Nach jeder Korrektur: Trag deine Fehler hier ein. Sie kommen ab morgen in „Üben“.</p>
      <label className="block text-sm font-semibold">Falsch (wie in der Schularbeit)<textarea className="input mt-1" rows={2} value={f.wrong} onChange={(e) => setF({ ...f, wrong: e.target.value })} spellCheck={false} /></label>
      <label className="block text-sm font-semibold">Richtig<textarea className="input mt-1" rows={2} value={f.correct} onChange={(e) => setF({ ...f, correct: e.target.value })} spellCheck={false} /></label>
      <div>
        <p className="text-sm font-semibold">Kategorie</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {CATS.map((c) => <button key={c} onClick={() => setF({ ...f, category: c })} className={`chip !py-2 ${f.category === c ? '!bg-brand !text-white' : ''}`}>{c}{CAT_NAMES[c] ? ` · ${CAT_NAMES[c]}` : ''}</button>)}
        </div>
      </div>
      <label className="block text-sm font-semibold">Notiz / Regel<input className="input mt-1" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      <UmlautBar />
      <button className="btn-primary w-full" disabled={!f.wrong.trim() || !f.correct.trim()} onClick={save}>Speichern</button>
    </div>
  )
}

function ImportBox({ onDone }) {
  const [text, setText] = useState('')
  const rows = parseImport(text)
  const save = () => {
    const t = Date.now().toString(36)
    update((s) => { rows.forEach((r, i) => s.mine.push({ ...r, id: `i${t}${i}`, rule: r.note, ruleEn: '', added: today() })) })
    seedMine([])
    onDone()
  }
  return (
    <div className="card space-y-3">
      <p className="text-sm">Füge hier die Fehlerliste aus deinem Claude-Feedback ein. Format pro Zeile:</p>
      <pre className="rounded-xl bg-black/5 p-2 text-xs dark:bg-white/10">falsch | richtig | Kategorie</pre>
      <textarea className="input font-mono !text-sm" rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={'dass es ist schwer | dass es schwer ist | S\nMeine Meinung nach | Meiner Meinung nach | G'} spellCheck={false} />
      {rows.length > 0 && (
        <ul className="space-y-1 text-sm">
          {rows.map((r, i) => <li key={i}><b>{r.category}</b> · <span className="text-red-600 line-through">{r.wrong}</span> → <span className="font-semibold text-green-700 dark:text-green-400">{r.correct}</span></li>)}
        </ul>
      )}
      <button className="btn-primary w-full" disabled={!rows.length} onClick={save}>{rows.length} Karten anlegen</button>
    </div>
  )
}
