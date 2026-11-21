import { useRef } from 'react'
import { useStore, update, exportJSON, importJSON, resetAll } from '../lib/store.js'
import { fmt } from '../lib/dates.js'
import { phases } from '../lib/curriculum.js'
import { Page, TopBar } from '../components/ui.jsx'
import Icon from '../components/Icon.jsx'

export function download(name, text, type = 'application/json') {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function Settings() {
  const s = useStore()
  const file = useRef()
  const set = (k, v) => update((st) => { st.setup[k] = v })
  const p = phases(s.setup)
  return (
    <Page>
      <TopBar title="Einstellungen" />
      <div className="card space-y-4">
        <label className="block">
          <span className="text-sm font-bold">Datum der Schularbeit</span>
          <input type="date" className="input mt-1" value={s.setup.examDate} onChange={(e) => e.target.value && set('examDate', e.target.value)} />
          <span className="mt-1 block text-xs muted">Phase 2 ab {fmt(p.p2)} · Prüfungsmodus ab {fmt(p.p3)} · nur Wiederholung ab {fmt(p.review)}</span>
        </label>
        <div>
          <span className="text-sm font-bold">Tagesziel (XP)</span>
          <div className="mt-1 flex gap-2">{[20, 50, 100].map((m) => <button key={m} onClick={() => set('dailyGoal', m)} className={`chip flex-1 justify-center !py-2 ${s.setup.dailyGoal === m ? '!bg-brand !text-white' : ''}`}>{m}</button>)}</div>
        </div>
        <div>
          <span className="text-sm font-bold">Übungen pro Tag</span>
          <div className="mt-1 flex gap-2">{[50, 100, 150, 200].map((m) => <button key={m} onClick={() => set('dailyTarget', m)} className={`chip flex-1 justify-center !py-2 ${s.setup.dailyTarget === m ? '!bg-brand !text-white' : ''}`}>{m}</button>)}</div>
        </div>
        <div>
          <span className="text-sm font-bold">Minuten pro Tag</span>
          <div className="mt-1 flex gap-2">{[15, 30, 45, 60].map((m) => <button key={m} onClick={() => set('minutes', m)} className={`chip flex-1 justify-center !py-2 ${s.setup.minutes === m ? '!bg-brand !text-white' : ''}`}>{m}</button>)}</div>
        </div>
        <label className="flex items-center justify-between"><span className="text-sm font-bold">Englische Erklärungen</span><input type="checkbox" className="h-6 w-6 accent-[#16936b]" checked={s.setup.showEn} onChange={(e) => set('showEn', e.target.checked)} /></label>
        <label className="flex items-center justify-between"><span className="text-sm font-bold">Töne</span><input type="checkbox" className="h-6 w-6 accent-[#16936b]" checked={s.setup.sound} onChange={(e) => set('sound', e.target.checked)} /></label>
      </div>
      <div className="card mt-3 space-y-2">
        <p className="font-bold">Sicherung</p>
        <p className="text-sm muted">Alles bleibt auf diesem Gerät. Exportiere eine Sicherung, um das Gerät zu wechseln.</p>
        <button className="btn-ghost w-full" onClick={() => download(`deutsch-lockin-${new Date().toISOString().slice(0, 10)}.json`, exportJSON())}><Icon name="download" size={18} className="mr-2" />Fortschritt exportieren</button>
        <button className="btn-ghost w-full" onClick={() => file.current.click()}><Icon name="upload" size={18} className="mr-2" />Sicherung importieren</button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={async (e) => {
          const f = e.target.files[0]; if (!f) return
          try { importJSON(await f.text()); alert('Sicherung geladen.') } catch (err) { alert('Fehler: ' + err.message) }
        }} />
      </div>
      <div className="card mt-3 space-y-2">
        <a className="btn-ghost w-full" href="#/setup">Einstufungstest wiederholen</a>
        <button className="btn w-full bg-red-50 text-red-600 dark:bg-red-900/30" onClick={() => { if (confirm('Wirklich ALLES löschen? Exportiere vorher eine Sicherung.')) resetAll() }}>Alles zurücksetzen</button>
      </div>
    </Page>
  )
}
