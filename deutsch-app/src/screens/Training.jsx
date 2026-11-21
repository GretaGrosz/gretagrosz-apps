import { useMemo, useState } from 'react'
import Player from '../components/Player.jsx'
import { useStore, update, recordAnswer, addXP, touchStreak, getState } from '../lib/store.js'
import { GENERATORS, rng } from '../generators/index.js'
import { makeProofread, correctText } from '../generators/proofread.js'
import { UNITS, LESSONS, unitDone, allHandItems } from '../lib/curriculum.js'
import { addMistake } from '../lib/srs.js'
import { shuffle, normalize, words as splitWords } from '../lib/check.js'
import { Page, TopBar, go, UmlautBar, En } from '../components/ui.jsx'
import { copyFeedbackPrompt } from './Writing.jsx'
import Icon, { IconTile } from '../components/Icon.jsx'
import PARAGRAPHS from '../../data/korrektur.json'
import VORGABEN from '../../data/vorgaben.json'

export const SPRINTS = {
  endung: { name: 'Endungs-Sprint', icon: 'type', desc: 'Adjektiv- und Artikelendungen', gen: ['adjEnding', 'possessive', 'pluralCase'] },
  artikel: { name: 'Artikel-Sprint', icon: 'tag', desc: 'der, die oder das?', gen: ['genus'] },
  verbende: { name: 'Verb-zum-Schluss-Sprint', icon: 'verbEnd', desc: 'dass, weil, obwohl …: Verb ans Ende', gen: ['dassClause', 'conjClause', 'v2Front', 'adverbConnector'] },
  beistrich: { name: 'Beistrich-Sprint', icon: 'comma', desc: 'Wo fehlt ein Beistrich?', gen: ['commaItem'] },
  c1: { name: 'C1-Sprint', icon: 'mountain', desc: 'Konnektoren, Präpositionen, Passiversatz, Vermutungen', gen: ['konnC1', 'prepC1', 'passivErsatz', 'modalSubjektiv', 'futurZwei'] },
}

export function sprintItems(kind, n = 80) {
  const rnd = rng(Date.now())
  const sp = SPRINTS[kind]
  const out = []
  let guard = 0
  while (out.length < n && guard++ < n * 30) {
    const it = GENERATORS[sp.gen[Math.floor(rnd() * sp.gen.length)]](rnd)
    if (it.t === 'mc' || it.t === 'komma') out.push({ ...it, y: undefined })
    else if (it.t === 'gap' && it.o && !Array.isArray(it.a)) out.push({ ...it, display: 'choose', y: undefined })
  }
  return out.map((it, i) => ({ ...it, _k: i }))
}

export default function Training() {
  const s = useStore()
  return (
    <Page wide>
      <TopBar title="Training" onBack={null} />
      <h2 className="h2 mb-2 flex items-center gap-2"><Icon name="zap" size={20} className="text-gold" />Sprints · 60 Sekunden</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(SPRINTS).map(([k, sp]) => (
          <a key={k} href={`#/sprint/${k}`} className="card !p-3">
            <IconTile name={sp.icon} tone="gold" className="mb-2" />
            <p className="font-bold leading-tight">{sp.name}</p>
            <p className="text-xs muted">{sp.desc}</p>
            <p className="mt-1 text-xs font-bold text-gold">Rekord: {s.sprints[k] || 0}</p>
          </a>
        ))}
      </div>
      <h2 className="h2 mb-2 mt-6 flex items-center gap-2"><Icon name="target" size={20} className="text-brand" />Präzision</h2>
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        <a href="#/korrektur" className="card flex items-center gap-3"><IconTile name="search" /><div className="flex-1"><p className="font-bold">Korrekturlesen</p><p className="text-sm muted">Absatz mit 5–10 versteckten Fehlern. Finde und korrigiere sie. {s.proof.n ? `· ${s.proof.n} gemacht` : ''}</p></div><Icon name="chevronRight" size={20} className="muted" /></a>
        <a href="#/diktat" className="card flex items-center gap-3"><IconTile name="headphones" tone="blue" /><div className="flex-1"><p className="font-bold">Diktat</p><p className="text-sm muted">Hören und exakt schreiben – mit Beistrichen und Großschreibung</p></div><Icon name="chevronRight" size={20} className="muted" /></a>
        <a href="#/bauen" className="card flex items-center gap-3"><IconTile name="blocks" tone="violet" /><div className="flex-1"><p className="font-bold">Sätze bauen mit Vorgaben</p><p className="text-sm muted">z. B. ein Satz mit „obwohl“ und Konjunktiv II</p></div><Icon name="chevronRight" size={20} className="muted" /></a>
        <a href="#/ueben" className="card flex items-center gap-3"><IconTile name="repeat" tone="gold" /><div className="flex-1"><p className="font-bold">Üben (gemischt)</p><p className="text-sm muted">Fehler + Meine Fehler + Schwachstellen, interleaved</p></div><Icon name="chevronRight" size={20} className="muted" /></a>
      </div>
      <h2 className="h2 mb-2 mt-6 flex items-center gap-2"><Icon name="infinity" size={20} className="text-brand" />Endlos-Training pro Unit</h2>
      <div className="card !p-2 lg:columns-2 lg:gap-4">
        {UNITS.map((u) => {
          const open = unitDone(s, u) || u.lessons.some((l) => s.lessons[l.id]?.done)
          return (
            <a key={u.id} href={open ? `#/endlos/${u.id}` : undefined} className={`flex break-inside-avoid items-center gap-3 rounded-xl px-2 py-2.5 ${open ? 'hover:bg-black/5 active:bg-black/5 dark:hover:bg-white/5' : 'opacity-40'}`}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-xs font-bold tabular-nums dark:bg-white/10">{u.n}</span>
              <span className="flex-1 text-sm font-medium">{u.title} <span className="text-xs muted">{u.level}</span></span>
              <Icon name={open ? 'play' : 'lock'} size={14} className="muted" />
            </a>
          )
        })}
      </div>
    </Page>
  )
}

export function Sprint({ kind }) {
  const sp = SPRINTS[kind]
  const [run, setRun] = useState(0)
  const items = useMemo(() => (sp ? sprintItems(kind) : []), [kind, run])
  const best = useStore((s) => s.sprints[kind] || 0)
  const [started, setStarted] = useState(false)
  if (!sp) return null
  if (!started) {
    return (
      <Page className="pt-16 text-center">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-gold-light text-[#b07b0e] dark:bg-gold/20 dark:text-gold"><Icon name={sp.icon} size={48} strokeWidth={1.8} /></span>
        <h1 className="h1 mt-3">{sp.name}</h1>
        <p className="mt-2 muted">{sp.desc}. So viele wie möglich in 60 Sekunden – bis die richtige Form automatisch kommt.</p>
        <p className="mt-4 text-lg font-bold text-gold">Persönlicher Rekord: {best}</p>
        <button className="btn-gold mt-8 w-full text-lg" onClick={() => setStarted(true)}>Start</button>
        <button className="btn-ghost mt-3 w-full" onClick={() => go('/training')}>Zurück</button>
      </Page>
    )
  }
  return (
    <Player key={run} items={items} mode="sprint" time={60} useHearts={false} why={false} title={`${sp.name} · Rekord ${Math.max(best)}`}
      onDone={(sum, saving) => {
        if (saving) update((s) => { s.sprints[kind] = Math.max(s.sprints[kind] || 0, sum.right) })
        else { setStarted(false); setRun((r) => r + 1) }
      }} onQuit={() => go('/training')} />
  )
}

// ---------- Korrekturlesen ----------
export function Proofread() {
  const [seed, setSeed] = useState(() => Date.now())
  const para = useMemo(() => PARAGRAPHS[Math.floor(rng(seed)() * PARAGRAPHS.length)], [seed])
  const task = useMemo(() => makeProofread(para.text, rng(seed + 1)), [para, seed])
  const [fixes, setFixes] = useState({})
  const [sel, setSel] = useState(null)
  const [val, setVal] = useState('')
  const [done, setDone] = useState(null)
  const choose = (i) => { if (done) return; setSel(i); setVal(fixes[i] ?? task.tokens[i].shown) }
  const save = () => {
    setFixes((f) => {
      const n = { ...f }
      if (normalize(val) === task.tokens[sel].shown) delete n[sel]
      else n[sel] = normalize(val)
      return n
    })
    setSel(null)
  }
  const submit = () => {
    let found = 0, wrongFix = 0, falseAlarm = 0
    task.tokens.forEach((t, i) => {
      if (t.error) {
        const ok = fixes[i] === t.right
        if (ok) found++
        else if (i in fixes) wrongFix++
        recordAnswer({ ok, skill: `korrektur.${t.error.cat}`, cat: t.error.cat })
        if (!ok) addMistake({ id: `proof.${para.id}.${i}`, t: 'fix', w: task.tokens.slice(Math.max(0, i - 4), i + 5).map((x, j) => (Math.max(0, i - 4) + j === i ? x.shown : x.right)).join(' '), a: task.tokens.slice(Math.max(0, i - 4), i + 5).map((x) => x.right).join(' '), r: t.error.why, s: `korrektur.${t.error.cat}`, c: t.error.cat })
      } else if (i in fixes) falseAlarm++
    })
    const missed = task.count - found - wrongFix
    update((s) => { s.proof.n++; s.proof.found += found; s.proof.missed += missed; s.proof.wrongTaps += falseAlarm })
    addXP(found * 2 + 5); touchStreak()
    setDone({ found, wrongFix, falseAlarm, missed })
    setSel(null)
  }
  return (
    <Page>
      <TopBar title="Korrekturlesen" onBack={() => go('/training')} />
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">{para.topic} · {task.count} Fehler versteckt</p>
        <p className="mt-1 text-sm muted">Tippe auf ein falsches Wort und korrigiere es (auch fehlende Beistriche: tippe auf das Wort davor und schreib den Beistrich dazu).</p>
        <div className="mt-3 text-[18px] leading-[2.1rem]">
          {task.tokens.map((t, i) => {
            const fixed = i in fixes
            let cls = 'rounded px-0.5 '
            if (done) {
              if (t.error) cls += fixes[i] === t.right ? 'bg-green-200 dark:bg-green-900/60' : 'bg-red-200 dark:bg-red-900/60'
              else if (fixed) cls += 'bg-amber-200 line-through dark:bg-amber-800/60'
            } else if (sel === i) cls += 'bg-amber-200 dark:bg-amber-700/60'
            else if (fixed) cls += 'bg-brand-light font-semibold text-brand dark:bg-brand/30'
            return (
              <span key={i}>
                <button onClick={() => choose(i)} className={cls}>{done && t.error ? t.right : fixed ? fixes[i] : t.shown}</button>{' '}
              </span>
            )
          })}
        </div>
      </div>
      {sel !== null && !done && (
        <div className="card mt-3 animate-pop">
          <p className="text-sm font-semibold">Korrektur für „{task.tokens[sel].shown}“</p>
          <input autoFocus className="input mt-2" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
          <UmlautBar className="mt-2" />
          <div className="mt-3 flex gap-2"><button className="btn-ghost flex-1" onClick={() => { setFixes((f) => { const n = { ...f }; delete n[sel]; return n }); setSel(null) }}>Doch richtig</button><button className="btn-primary flex-1" onClick={save}>OK</button></div>
        </div>
      )}
      {!done && <button className="btn-primary mt-4 w-full" onClick={submit}>Abgeben ({Object.keys(fixes).length} korrigiert)</button>}
      {done && (
        <div className="card mt-3">
          <p className="text-lg font-bold">{done.found}/{task.count} Fehler gefunden und richtig korrigiert</p>
          <ul className="mt-1 text-sm">
            <li className="flex items-center gap-2"><Icon name="checkCircle" size={16} className="text-green-600" />richtig korrigiert: {done.found}</li>
            <li className="flex items-center gap-2"><Icon name="halfCircle" size={16} className="text-gold" />gefunden, aber falsch korrigiert: {done.wrongFix}</li>
            <li className="flex items-center gap-2"><Icon name="xCircle" size={16} className="text-red-500" />übersehen: {done.missed}</li>
            <li className="flex items-center gap-2"><Icon name="alert" size={16} className="text-orange-500" />richtige Wörter „korrigiert“: {done.falseAlarm}</li>
          </ul>
          <div className="mt-3 space-y-1 text-sm">
            {task.tokens.map((t, i) => t.error && (
              <p key={i}><b>{t.error.cat}</b> · <span className="text-red-600 line-through">{t.shown}</span> → <span className="font-semibold text-green-700 dark:text-green-400">{t.right}</span> <span className="muted">({t.error.why})</span></p>
            ))}
          </div>
          <button className="btn-primary mt-4 w-full" onClick={() => { setSeed(Date.now()); setFixes({}); setDone(null) }}>Nächster Absatz</button>
        </div>
      )}
    </Page>
  )
}

// ---------- Diktat ----------
export function Dictation() {
  const items = useMemo(() => {
    const done = new Set(LESSONS.filter((l) => getState().lessons[l.id]?.done).map((l) => l.id))
    const pool = allHandItems().filter((it) => ['listen', 'tr', 'tf', 'fix', 'order'].includes(it.t) && typeof it.a === 'string' && it.a.split(' ').length >= 5)
    const pref = pool.filter((it) => done.has(it.id.split('.')[0]))
    const base = pref.length >= 10 ? pref : pool
    const rnd = rng(Date.now())
    const gen = [GENERATORS.commaItem(rnd), GENERATORS.commaItem(rnd), GENERATORS.dassClause(rnd)].map((g) => g.a)
    return shuffle([...shuffle(base).slice(0, 8).map((it) => it.a), ...gen]).map((a, i) => ({ id: 'diktat.' + i + '.' + a.length, t: 'listen', a, s: 'diktat', c: /,/.test(a) ? 'B' : 'R', r: 'Achte auf Beistriche, Großschreibung, ß und Umlaute.', re: 'Every comma and capital letter counts, just like in the Schularbeit.' }))
  }, [])
  return <Player items={items} mode="practice" useHearts={false} why={false} title="Diktat" onDone={(s, saving) => !saving && go('/training')} onQuit={() => go('/training')} />
}

// ---------- Sätze bauen mit Vorgaben ----------
const VERBISH = /^(ist|sind|war|waren|hat|haben|hatte|hatten|kann|können|muss|müssen|soll|sollen|sollte|sollten|will|wollen|wird|werden|würde|würden|hätte|hätten|wäre|wären|könnte|könnten|darf|dürfen|gibt|geht|[a-zäöüß]+(en|ern|eln|t|te|ten|st))$/
export function runChecks(text, checks) {
  const t = normalize(text)
  const toks = splitWords(t)
  const low = toks.map((w) => w.replace(/[.,!?;:"„“]/g, '').toLowerCase())
  return checks.map((c) => {
    const w = (c.w || '').toLowerCase()
    const idx = low.indexOf(w)
    let ok = false
    if (c.k === 'word') ok = idx >= 0
    if (c.k === 'comma') ok = idx === 0 || (idx > 0 && toks[idx - 1].endsWith(','))
    if (c.k === 'verbEnd') {
      if (idx >= 0) {
        let j = idx + 1
        while (j < toks.length && !/[,.!?;]$/.test(toks[j])) j++
        const last = (toks[Math.min(j, toks.length - 1)] || '').replace(/[.,!?;:"]/g, '')
        ok = j > idx + 1 && VERBISH.test(last) && last === last.toLowerCase()
      }
    }
    if (c.k === 'v2') {
      if (idx >= 0) { const nx = (toks[idx + 1] || '').replace(/[.,!?]/g, ''); ok = !toks[idx].endsWith(',') && VERBISH.test(nx) && nx === nx.toLowerCase() }
    }
    if (c.k === 'any') ok = c.ws.some((x) => low.includes(x.toLowerCase()) || t.toLowerCase().includes(x.toLowerCase()))
    if (c.k === 'minWords') ok = toks.length >= c.n
    if (c.k === 'end') ok = /[.!?]$/.test(t)
    if (c.k === 'capStart') ok = /^[A-ZÄÖÜ„"]/.test(t)
    return { ...c, ok }
  })
}
export function Build() {
  const [i, setI] = useState(() => Math.floor(Math.random() * VORGABEN.length))
  const v = VORGABEN[i]
  const [text, setText] = useState('')
  const [res, setRes] = useState(null)
  const checks = [...v.checks, { k: 'capStart', label: 'Großer Anfangsbuchstabe' }, { k: 'end', label: 'Satzzeichen am Ende' }]
  const check = () => {
    const r = runChecks(text, checks)
    setRes(r)
    r.forEach((c) => recordAnswer({ ok: c.ok, skill: c.skill || 'bauen', cat: c.cat || 'S' }))
    if (r.every((c) => c.ok)) { addXP(5); touchStreak() }
  }
  return (
    <Page>
      <TopBar title="Sätze bauen" onBack={() => go('/training')} />
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">Aufgabe {i + 1}/{VORGABEN.length}</p>
        <p className="mt-1 text-lg font-semibold">{v.q}</p>
        <En>{v.en}</En>
        <ul className="mt-3 space-y-1 text-sm">
          {checks.map((c, j) => <li key={j} className={`flex items-center gap-2 ${res ? (res[j].ok ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400') : 'muted'}`}><Icon name={res ? (res[j].ok ? 'checkCircle' : 'xCircle') : 'square'} size={16} />{c.label}</li>)}
        </ul>
      </div>
      <textarea className="input mt-3" rows={4} value={text} spellCheck={false} onChange={(e) => { setText(e.target.value); setRes(null) }} placeholder="Dein Satz …" />
      <UmlautBar className="mt-2" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-primary" disabled={!text.trim()} onClick={check}>Prüfen</button>
        <button className="btn-ghost" disabled={!text.trim()} onClick={() => copyFeedbackPrompt({ text, angabe: `Sätze bauen: ${v.q}`, kind: 'satz' })}><Icon name="clipboard" size={18} className="mr-2" />Feedback holen</button>
      </div>
      {res && res.every((c) => c.ok) && <p className="mt-3 rounded-xl bg-green-50 p-3 text-sm dark:bg-green-900/30">Alle Regeln erfüllt! Die Prüfung ist automatisch und kann nicht alles sehen. Für Stil und Inhalt hol dir Feedback.</p>}
      {v.example && res && <p className="mt-3 text-sm muted">Beispiel: {v.example}</p>}
      <button className="btn-ghost mt-3 w-full" onClick={() => { setI((i + 1) % VORGABEN.length); setText(''); setRes(null) }}>Nächste Aufgabe ›</button>
    </Page>
  )
}
