import { useMemo, useState } from 'react'
import Player from '../components/Player.jsx'
import { useStore, update } from '../lib/store.js'
import { today, fmt } from '../lib/dates.js'
import { unitById, PROTECTED } from '../lib/curriculum.js'
import { shuffle } from '../lib/check.js'
import { Page, go } from '../components/ui.jsx'
import PLACEMENT from '../../data/placement.json'

export default function Setup({ again }) {
  const s = useStore()
  const [step, setStep] = useState(again ? 'test' : 'intro')
  const [f, setF] = useState({ examDate: s.setup.examDate, minutes: s.setup.minutes, dailyGoal: s.setup.dailyGoal, showEn: s.setup.showEn })
  const [result, setResult] = useState(null)
  const items = useMemo(() => shuffle(PLACEMENT.map((it, i) => ({ ...it, id: 'place.' + i, s: 'placement', c: 'G' }))), [])

  if (step === 'test') {
    return (
      <Player items={items} mode="placement" useHearts={false} why={false} title="Einstufungstest"
        onDone={(sum, saving) => {
          if (!saving) return
          const scores = {}
          sum.results.forEach((r) => { const u = r.item.u; scores[u] = scores[u] || [0, 0]; scores[u][0]++; if (r.ok) scores[u][1]++ })
          const suggested = Object.entries(scores).filter(([u, [n, c]]) => n === c && !PROTECTED.includes(u)).map(([u]) => u)
          update((st) => { st.placement = { done: true, scores, suggested, acc: sum.acc } })
          setResult({ scores, suggested, acc: sum.acc })
          setTimeout(() => setStep('result'), 0)
        }} />
    )
  }
  if (step === 'result' && result) {
    return (
      <Page className="pt-10">
        <h1 className="h1">Dein Ergebnis: {Math.round(result.acc * 100)} %</h1>
        <p className="mt-2 muted">Der Pfad beginnt bei Unit 1. Units, die du schon kannst, darfst du mit dem Überspringen-Test (≥ 90 %) abschließen. Units zu deinen 9 Schwachstellen werden nie zum Überspringen vorgeschlagen.</p>
        <div className="card mt-4">
          <p className="font-bold">Vorschlag: diese Units kannst du testen und überspringen</p>
          {result.suggested.length === 0 && <p className="mt-2 text-sm muted">Keine – du gehst den ganzen Pfad. Das ist gut so!</p>}
          <ul className="mt-2 space-y-2">
            {result.suggested.map((u) => <li key={u} className="flex items-center justify-between text-sm"><span>Unit {unitById(u)?.n}: {unitById(u)?.title}</span><a className="chip !text-brand" href={`#/checkpoint/${u}?skip=1`} onClick={() => finish()}>Test</a></li>)}
          </ul>
        </div>
        <button className="btn-primary mt-6 w-full" onClick={() => { finish(); go('/') }}>Los geht’s!</button>
      </Page>
    )
  }
  function finish() {
    update((st) => { st.setup = { ...st.setup, ...f, done: true, startDate: st.setup.startDate || today() } })
  }
  return (
    <Page className="pt-10">
      <img src="./icon-192.png" alt="" width="88" height="88" className="h-[88px] w-[88px] rounded-[24px] shadow-[0_10px_30px_rgba(22,147,107,.25)]" />
      <h1 className="h1 mt-3">Deutsch Lock-In</h1>
      <p className="mt-2 text-[17px]">Grammatik-Pfad, strenge Übungen und Schularbeit-Training – genau für deine Fehler.</p>
      <div className="card mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-bold">Wann ist deine nächste Schularbeit?</span>
          <input type="date" className="input mt-1" value={f.examDate} onChange={(e) => setF({ ...f, examDate: e.target.value })} />
          <span className="mt-1 block text-xs muted">{f.examDate && fmt(f.examDate)} – du kannst das Datum jederzeit ändern.</span>
        </label>
        <div>
          <span className="text-sm font-bold">Minuten pro Tag</span>
          <div className="mt-1 flex gap-2">{[15, 30, 45, 60].map((m) => <button key={m} onClick={() => setF({ ...f, minutes: m })} className={`chip flex-1 justify-center !py-2 ${f.minutes === m ? '!bg-brand !text-white' : ''}`}>{m}</button>)}</div>
        </div>
        <div>
          <span className="text-sm font-bold">Tagesziel (XP)</span>
          <div className="mt-1 flex gap-2">{[20, 50, 100].map((m) => <button key={m} onClick={() => setF({ ...f, dailyGoal: m })} className={`chip flex-1 justify-center !py-2 ${f.dailyGoal === m ? '!bg-brand !text-white' : ''}`}>{m} XP</button>)}</div>
        </div>
        <label className="flex items-center justify-between">
          <span className="text-sm font-bold">Englische Erklärungen anzeigen</span>
          <input type="checkbox" className="h-6 w-6 accent-[#16936b]" checked={f.showEn} onChange={(e) => setF({ ...f, showEn: e.target.checked })} />
        </label>
        <p className="text-xs muted">Textsorten: alle möglich (Leserbrief, Erörterung, Kommentar, Meinungsrede, Offener Brief, Empfehlung, Zusammenfassung, Textanalyse).</p>
      </div>
      <button className="btn-primary mt-6 w-full text-lg" onClick={() => { update((st) => { st.setup = { ...st.setup, ...f } }); setStep('test') }}>Einstufungstest starten (10 Min.)</button>
      <button className="mt-3 w-full py-2 text-sm muted" onClick={() => { finish(); go('/') }}>Test überspringen</button>
    </Page>
  )
}
