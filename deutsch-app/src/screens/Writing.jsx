import { useMemo, useState } from 'react'
import { useStore, update, addXP, touchStreak, getState } from '../lib/store.js'
import { today, fmt } from '../lib/dates.js'
import { shuffle } from '../lib/check.js'
import { Page, TopBar, En, go, mmss, useCountdown, Modal, Tabs } from '../components/ui.jsx'
import { endkontrolle, highlight } from '../lib/endkontrolle.js'
import { parseImport } from './Mistakes.jsx'
import { seedMine } from '../lib/srs.js'
import TEXTSORTEN from '../../data/textsorten.json'
import REDEMITTEL from '../../data/redemittel.json'
import ANGABEN from '../../data/angaben.json'
import Icon, { IconTile, TEXTSORTE_ICON } from '../components/Icon.jsx'

const tsById = (id) => TEXTSORTEN.find((t) => t.id === id)
const wc = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0)
// Which phrases trigger verb-last (Nebensatz) or verb-second (fronted adverb)?
const verbLast = (p) => /\b(dass|ob|weil|wenn|obwohl|falls|damit|nachdem|bevor|wie)\b\s*…/.test(p) || /, (der|die|das) …/.test(p)
const verbSecond = (p) => /^(Meiner Meinung nach|Auf der anderen Seite|Außerdem|Darüber hinaus|Deshalb|Trotzdem|Beispielsweise|Zunächst einmal|Aus meiner Sicht|Laut einer aktuellen Umfrage|Heutzutage|Andererseits|Zwar|Im Folgenden|Abschließend)\b/.test(p)

// ---------- Feedback holen: copy text + Angabe + teacher prompt for the normal Claude chat ----------
export function feedbackPrompt({ text, angabe, kind, type }) {
  return `Du bist eine erfahrene Deutschlehrerin an einer österreichischen Oberstufe (BHAK). Ich bin Schülerin, Englisch ist meine Erstsprache, und ich bereite mich auf meine Deutsch-Schularbeit vor. Korrigiere meinen Text bitte genau so streng wie bei einer Schularbeit.

Arbeite in DREI Schritten und warte nach Schritt 1 auf meine Antwort:

SCHRITT 1 – Nur markieren: Gib meinen Text wieder und markiere jeden Fehler mit [Kategorie] direkt nach dem Fehler, OHNE die Korrektur zu verraten. Kategorien (österreichische Korrekturzeichen): G = Grammatik, R = Rechtschreibung, A = Ausdruck, B = Beistrich, S = Satzbau. Ich versuche dann selbst, die Fehler zu verbessern.

SCHRITT 2 – Nach meiner Antwort: Zeig die richtigen Korrekturen mit einer kurzen Regel (Deutsch, dann ein Satz auf Englisch). Weise besonders auf Unterschiede zwischen Englisch und Deutsch hin (Verbstellung, Fälle, Beistrich).

SCHRITT 3 – Bewertung: Schätze die Note (1–5) nach den vier Kriterien der österreichischen Beurteilung: Inhalt, Textstruktur, Stil und Ausdruck, Normative Sprachrichtigkeit. Prüfe auch: Passt der Text zur Textsorte${type ? ` (${type})` : ''}? Sind alle Arbeitsaufträge erfüllt? Stimmt die Wortanzahl? Überschrift/Anrede/Grußformel richtig?
Liste am Ende ALLE Fehler in genau diesem Format (eine Zeile pro Fehler, ohne Tabelle):
falsch | richtig | Kategorie

=== ANGABE ===
${angabe || '(keine Angabe – freier Text)'}

=== MEIN TEXT (${wc(text)} Wörter) ===
${text}`
}
export async function copyFeedbackPrompt(o) {
  const p = feedbackPrompt(o)
  try {
    await navigator.clipboard.writeText(p)
    alert('Kopiert! Öffne jetzt deinen Claude-Chat und füge alles ein. Die Fehlerliste am Ende kannst du unter „Meine Fehler → Import“ einfügen.')
  } catch {
    const w = window.open('', '_blank')
    if (w) { w.document.body.innerText = p } else prompt('Kopiere diesen Text:', p)
  }
}
export const angabeText = (a) => a ? `${tsById(a.type)?.name}: ${a.title}\n${a.situation}\nAdressat: ${a.addressee}\nArbeitsaufträge:\n${a.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}\nUmfang: ${a.words[0]}–${a.words[1]} Wörter` : ''

export default function Writing() {
  const s = useStore()
  return (
    <Page wide>
      <TopBar title="Schreiben" onBack={null} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <a href="#/simulation" className="card !p-3"><IconTile name="clock" tone="gold" className="mb-2" /><p className="font-bold">Schularbeit-Simulation</p><p className="text-xs muted">Angabe, Timer, Endkontrolle</p></a>
        <a href="#/angabe" className="card !p-3"><IconTile name="search" tone="blue" className="mb-2" /><p className="font-bold">Angabe lesen</p><p className="text-xs muted">„Siehe Angabe!“ – nie wieder</p></a>
        <a href="#/absatz" className="card !p-3"><IconTile name="pen" tone="violet" className="mb-2" /><p className="font-bold">Kurzer Absatz</p><p className="text-xs muted">60–100 Wörter</p></a>
        <a href="#/texte" className="card !p-3"><IconTile name="notebook" className="mb-2" /><p className="font-bold">Meine Texte</p><p className="text-xs muted">{s.texts.length} gespeichert</p></a>
      </div>
      <h2 className="h2 mb-2 mt-6">Textsorten-Trainer</h2>
      <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {TEXTSORTEN.map((t) => (
          <a key={t.id} href={`#/textsorte/${t.id}`} className="card flex items-center gap-3 !p-3">
            <IconTile name={TEXTSORTE_ICON[t.id]} />
            <div className="flex-1"><p className="font-bold">{t.name}</p><p className="text-sm muted">{t.short}</p></div>
            <Icon name="chevronRight" size={20} className="muted" />
          </a>
        ))}
      </div>
    </Page>
  )
}

export function TextTypeScreen({ id }) {
  const t = tsById(id)
  const [tab, setTab] = useState('bau')
  if (!t) return null
  const groups = { ...REDEMITTEL, ...t.redemittel }
  const count = Object.values(groups).flat().length
  const angaben = ANGABEN.filter((a) => a.type === id)
  return (
    <Page>
      <TopBar title={t.name} />
      <p className="mb-3 text-sm muted">{t.short} <b>Adressat:</b> {t.addressee}</p>
      <Tabs tabs={[['bau', 'Bauplan'], ['rm', `Redemittel (${count})`], ['go', 'Schreiben']]} value={tab} onChange={setTab} />
      {tab === 'bau' && (
        <>
          <ol className="space-y-2">
            {t.bauplan.map(([h, d], i) => (
              <li key={i} className="card flex gap-3 !p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
                <div><p className="font-bold">{h}</p><p className="text-sm">{d}</p></div>
              </li>
            ))}
          </ol>
          <div className="card mt-3 border-l-4 border-l-red-400">
            <p className="font-bold">Typische Fehler</p>
            <ul className="mt-1 list-disc pl-5 text-sm">{t.mistakes.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        </>
      )}
      {tab === 'rm' && (
        <>
          <p className="mb-3 text-sm"><span className="rounded bg-red-100 px-1.5 font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">Verb ans Ende</span> = danach kommt ein Nebensatz. <span className="rounded bg-blue-100 px-1.5 font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Verb an Pos. 2</span> = gleich danach das Verb.</p>
          {Object.entries(groups).map(([g, list]) => (
            <div key={g} className="card mb-3 !p-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-brand">{g}</p>
              <ul className="space-y-1.5">
                {list.map((p, i) => (
                  <li key={i} className="text-[15px]">
                    {p}{' '}
                    {verbLast(p) && <span className="whitespace-nowrap rounded bg-red-100 px-1 text-[11px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">Verb ans Ende</span>}
                    {verbSecond(p) && <span className="whitespace-nowrap rounded bg-blue-100 px-1 text-[11px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Verb an Pos. 2</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </>
      )}
      {tab === 'go' && (
        <div className="space-y-2">
          <a href="#/angabe" className="card block !p-3"><p className="flex items-center gap-2 font-bold"><Icon name="search" size={18} className="text-brand" />Angabe lesen üben</p></a>
          {angaben.map((a) => <a key={a.id} href={`#/simulation/${a.id}`} className="card block !p-3"><p className="flex items-center gap-2 font-bold"><Icon name="pen" size={18} className="text-brand" />{a.title}</p><p className="text-sm muted">{a.words[0]}–{a.words[1]} Wörter · Adressat: {a.addressee}</p></a>)}
        </div>
      )}
    </Page>
  )
}

// ---------- "Angabe lesen" trainer ----------
function angabeQuestions(a) {
  const ts = tsById(a.type)
  const others = shuffle(ANGABEN.filter((x) => x.id !== a.id))
  const addr = shuffle([...new Set([a.addressee, 'meine Deutschlehrerin', ...others.map((x) => x.addressee)])].filter((x) => x !== a.addressee).slice(0, 3).concat(a.addressee))
  const types = shuffle([ts.name, ...shuffle(TEXTSORTEN.filter((t) => t.id !== a.type)).slice(0, 3).map((t) => t.name)])
  const wr = `${a.words[0]}–${a.words[1]} Wörter`
  const words = shuffle([wr, '135–165 Wörter', '270–330 Wörter', '405–495 Wörter', '540–660 Wörter'].filter((v, i, arr) => arr.indexOf(v) === i)).filter((w) => w !== wr).slice(0, 3).concat(wr)
  const fakeTasks = shuffle(others.flatMap((x) => x.tasks)).slice(0, 3)
  return [
    { q: 'An wen richtet sich der Text (Adressat)?', o: addr, a: a.addressee },
    { q: 'Welche Textsorte ist verlangt?', o: types, a: ts.name },
    { q: 'Wie viele Wörter?', o: shuffle(words), a: wr },
    { q: 'Welche Arbeitsaufträge musst du erfüllen? (alle richtigen antippen)', multi: true, o: shuffle([...a.tasks, ...fakeTasks]), a: a.tasks },
  ]
}
export function AngabeTrainer() {
  const [seed, setSeed] = useState(0)
  const a = useMemo(() => ANGABEN[Math.floor(Math.random() * ANGABEN.length)], [seed])
  const qs = useMemo(() => angabeQuestions(a), [a])
  const [ans, setAns] = useState({})
  const [checked, setChecked] = useState(false)
  const okQ = (q, i) => (q.multi ? (ans[i] || []).length === q.a.length && q.a.every((x) => (ans[i] || []).includes(x)) : ans[i] === q.a)
  return (
    <Page>
      <TopBar title="Angabe lesen" />
      <AngabeCard a={a} />
      {qs.map((q, i) => (
        <div key={i} className="card mt-3 !p-3">
          <p className="font-bold">{i + 1}. {q.q}</p>
          <div className="mt-2 space-y-1.5">
            {q.o.map((o) => {
              const sel = q.multi ? (ans[i] || []).includes(o) : ans[i] === o
              const right = q.multi ? q.a.includes(o) : q.a === o
              let cls = sel ? 'border-brand bg-brand-light dark:bg-brand/20' : 'border-black/10 dark:border-white/10'
              if (checked && right) cls = 'border-green-500 bg-green-50 dark:bg-green-900/30'
              else if (checked && sel && !right) cls = 'border-red-400 bg-red-50 dark:bg-red-900/30'
              return (
                <button key={o} disabled={checked} onClick={() => setAns((x) => ({ ...x, [i]: q.multi ? (sel ? x[i].filter((y) => y !== o) : [...(x[i] || []), o]) : o }))}
                  className={`min-h-[44px] w-full rounded-xl border-2 px-3 py-1.5 text-left text-[15px] ${cls}`}><span className="flex items-center gap-2">{q.multi && <Icon name={sel ? 'checkSquare' : 'square'} size={18} />}{o}</span></button>
              )
            })}
          </div>
          {checked && <p className={`mt-2 text-sm font-semibold ${okQ(q, i) ? 'text-green-700 dark:text-green-400' : 'text-red-600'}`}><span className="flex items-center gap-1.5"><Icon name={okQ(q, i) ? 'checkCircle' : 'xCircle'} size={16} />{okQ(q, i) ? 'Richtig' : 'Lies die Angabe noch einmal genau!'}</span></p>}
        </div>
      ))}
      {!checked ? <button className="btn-primary mt-4 w-full" onClick={() => { setChecked(true); const n = qs.filter(okQ).length; addXP(n * 2); touchStreak() }}>Prüfen</button>
        : <div className="mt-4 grid grid-cols-2 gap-2"><button className="btn-ghost" onClick={() => { setSeed(seed + 1); setAns({}); setChecked(false) }}>Nächste Angabe</button><a className="btn-primary" href={`#/simulation/${a.id}`}>Diesen Text schreiben</a></div>}
    </Page>
  )
}

export function AngabeCard({ a }) {
  const ts = tsById(a.type)
  return (
    <div className="card border-2 border-black/10 dark:border-white/15">
      <p className="text-xs font-bold uppercase tracking-wide muted">Angabe · Übungsangabe (der genannte Artikel ist erfunden)</p>
      <p className="mt-1 text-lg font-bold">{ts?.name}: {a.title}</p>
      <p className="mt-2 text-[15px]">{a.situation}</p>
      <p className="mt-2 text-[15px]">Verfassen Sie {ts?.id === 'eroerterung' || ts?.id === 'empfehlung' || ts?.id === 'kommentar' || ts?.id === 'zusammenfassung' || ts?.id === 'textanalyse' ? 'eine' : 'einen'} <b>{ts?.name}</b>{ts?.id === 'leserbrief' || ts?.id === 'offenerbrief' ? ` an ${a.addressee}` : ''} und bearbeiten Sie dabei folgende Arbeitsaufträge:</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[15px]">{a.tasks.map((t, i) => <li key={i}>{t}</li>)}</ul>
      <p className="mt-2 text-[15px]">Schreiben Sie zwischen <b>{a.words[0]} und {a.words[1]}</b> Wörter.</p>
    </div>
  )
}

// ---------- Endkontrolle ----------
export function Endkontrolle({ text, angabe, type, onDone }) {
  const res = useMemo(() => endkontrolle(text, { type, angabe }), [text, type, angabe])
  const [ticks, setTicks] = useState({})
  const all = res.items.every((it, i) => ticks[i])
  const html = useMemo(() => highlight(text), [text])
  return (
    <div>
      <p className="mb-2 text-sm muted">Geh jeden Punkt durch und hake ihn ab. Gelb = Nebensatz (Verb am Ende?), rot = verdächtig.</p>
      <div className="card mb-3 max-h-72 overflow-y-auto whitespace-pre-wrap text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
      <ul className="space-y-2">
        {res.items.map((it, i) => (
          <li key={i} className={`card !p-3 ${it.warn ? 'border-l-4 border-l-red-400' : it.auto ? 'border-l-4 border-l-green-500' : ''}`}>
            <label className="flex gap-3">
              <input type="checkbox" className="mt-1 h-6 w-6 shrink-0 accent-[#16936b]" checked={!!ticks[i]} onChange={(e) => setTicks((t) => ({ ...t, [i]: e.target.checked }))} />
              <div>
                <p className="font-semibold">{it.label}</p>
                {it.info && <p className="text-sm muted">{it.info}</p>}
                {it.hits?.length > 0 && <ul className="mt-1 space-y-0.5 text-sm text-red-700 dark:text-red-300">{it.hits.slice(0, 6).map((h, j) => <li key={j} className="flex gap-1.5"><Icon name="alert" size={14} className="mt-0.5" /><span>{h}</span></li>)}</ul>}
              </div>
            </label>
          </li>
        ))}
      </ul>
      <button className="btn-primary mt-4 w-full" disabled={!all} onClick={() => onDone(res)}>{all ? 'Endkontrolle abgeschlossen' : `Noch ${res.items.filter((_, i) => !ticks[i]).length} Punkte abhaken`}</button>
    </div>
  )
}

// ---------- Simulation ----------
export function Simulation({ angabeId }) {
  const [a, setA] = useState(() => ANGABEN.find((x) => x.id === angabeId) || null)
  const [mins, setMins] = useState(a && a.words[1] > 400 ? 100 : 50)
  const [stage, setStage] = useState(a ? 'brief' : 'pick') // pick | brief | write | check | done
  const [text, setText] = useState(() => { try { return localStorage.getItem('dli.draft') || '' } catch { return '' } })
  const left = useCountdown(mins * 60, stage === 'write', () => setStage('check'))
  const save = (t) => { setText(t); try { localStorage.setItem('dli.draft', t) } catch { /* ignore */ } }
  const n = wc(text)
  const [savedId, setSavedId] = useState(null)
  if (stage === 'pick') {
    return (
      <Page>
        <TopBar title="Simulation: Angabe wählen" onBack={() => go('/schreiben')} />
        <button className="btn-primary mb-3 w-full" onClick={() => { setA(ANGABEN[Math.floor(Math.random() * ANGABEN.length)]); setStage('brief') }}><Icon name="dice" size={18} className="mr-2" />Zufällige Angabe</button>
        <div className="space-y-2">{ANGABEN.map((x) => <button key={x.id} onClick={() => { setA(x); setMins(x.words[1] > 400 ? 100 : 50); setStage('brief') }} className="card block w-full !p-3 text-left"><p className="flex items-center gap-2 font-bold"><Icon name={TEXTSORTE_ICON[x.type]} size={18} className="text-brand" />{tsById(x.type).name}: {x.title}</p><p className="text-sm muted">{x.words[0]}–{x.words[1]} Wörter</p></button>)}</div>
      </Page>
    )
  }
  if (stage === 'brief') {
    return (
      <Page>
        <TopBar title="Schularbeit-Simulation" onBack={() => go('/schreiben')} />
        <AngabeCard a={a} />
        <div className="card mt-3">
          <p className="font-bold">Zeit</p>
          <div className="mt-2 flex gap-2">{[30, 50, 75, 100, 150].map((m) => <button key={m} onClick={() => setMins(m)} className={`chip flex-1 justify-center !py-2 ${mins === m ? '!bg-brand !text-white' : ''}`}>{m}′</button>)}</div>
          <p className="mt-2 text-xs muted">Keine Rechtschreibprüfung – wie bei der echten Schularbeit.</p>
        </div>
        <button className="btn-primary mt-4 w-full text-lg" onClick={() => { save(''); setStage('write') }}>Start</button>
        {text && <button className="btn-ghost mt-2 w-full" onClick={() => setStage('write')}>Entwurf fortsetzen ({wc(text)} Wörter)</button>}
      </Page>
    )
  }
  if (stage === 'write') {
    const [lo, hi] = a.words
    return (
      <div className="mx-auto max-w-xl px-4 lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:px-8">
        <div className="flex min-h-[100dvh] flex-col">
          <div className="safe-t sticky top-0 z-10 flex items-center gap-2 bg-[#f4f6f5] pb-2 dark:bg-[#0e1311] lg:pt-6">
            <span className={`chip font-mono ${left < 300 ? '!bg-red-500 !text-white' : ''}`}><Icon name="clock" size={15} />{mmss(left)}</span>
            <span className={`chip ${n < lo ? '' : n > hi ? '!bg-red-500 !text-white' : '!bg-green-600 !text-white'}`}>{n} / {lo}–{hi} W.</span>
            <details className="ml-auto lg:hidden"><summary className="chip cursor-pointer">Angabe</summary><div className="absolute left-4 right-4 z-20 mt-2"><AngabeCard a={a} /></div></details>
          </div>
          <textarea autoFocus spellCheck="false" autoCorrect="off" autoCapitalize="sentences" value={text} onChange={(e) => save(e.target.value)}
            className="input mt-2 min-h-[60vh] flex-1 resize-none !text-[17px] leading-relaxed lg:!text-[18px] lg:leading-8" placeholder="Überschrift …" />
          <div className="safe-b grid grid-cols-2 gap-2 py-3">
            <button className="btn-ghost" onClick={() => setStage('brief')}>Pause</button>
            <button className="btn-primary" onClick={() => setStage('check')}>Fertig: Endkontrolle</button>
          </div>
        </div>
        <aside className="hidden lg:block"><div className="sticky top-6 pt-6"><AngabeCard a={a} /></div></aside>
      </div>
    )
  }
  if (stage === 'check') {
    return (
      <Page>
        <TopBar title="Endkontrolle" onBack={() => setStage('write')} />
        <Endkontrolle text={text} angabe={a} type={a.type} onDone={(res) => {
          const id = 't' + Date.now().toString(36)
          update((s) => {
            s.texts.unshift({ id, date: today(), kind: 'simulation', angabeId: a.id, type: a.type, title: a.title, text, words: n, minutes: mins, warnings: res.warnCount })
          })
          addXP(30); touchStreak()
          try { localStorage.removeItem('dli.draft') } catch { /* ignore */ }
          setSavedId(id); setStage('done')
        }} />
      </Page>
    )
  }
  return (
    <Page className="pt-10">
      <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-brand-light text-brand dark:bg-brand/20"><Icon name="check" size={44} strokeWidth={2.4} /></span>
      <h1 className="h1 mt-2 text-center">Text gespeichert</h1>
      <p className="mt-2 text-center muted">Jetzt hol dir Feedback wie von deiner Lehrerin. Danach importierst du die Fehlerliste in „Meine Fehler“.</p>
      <button className="btn-primary mt-6 w-full" onClick={() => copyFeedbackPrompt({ text, angabe: angabeText(a), type: tsById(a.type)?.name })}><Icon name="clipboard" size={18} className="mr-2" />Feedback holen (kopieren)</button>
      <a className="btn-ghost mt-2 w-full" href={`#/text/${savedId}`}>Text öffnen & Feedback einfügen</a>
      <a className="btn-ghost mt-2 w-full" href="#/">Zur Startseite</a>
    </Page>
  )
}

// ---------- Short paragraph (Phase 1) ----------
const PARA_PROMPTS = [
  'Soll das Handy in der Schule verboten werden? Begründe deine Meinung mit einem Argument und einem Beispiel.',
  'Was spricht für und gegen Urlaub in beliebten Touristenorten? Schreib einen Absatz mit „Auf der einen Seite … Auf der anderen Seite …“.',
  'Sollen Jugendliche ab 16 wählen dürfen? Verwende „Meiner Meinung nach“ und einen dass-Satz.',
  'Wie beeinflussen soziale Medien unser Reiseverhalten? Verwende „weil“ und „obwohl“.',
  'Was kann jeder Einzelne für den Klimaschutz tun? Verwende „Es ist wichtig, … zu …“.',
  'Sind Schulproteste sinnvoll? Verwende einen Relativsatz und „deshalb“.',
  'Warum ist es so leicht, anderen die Schuld zu geben? Verwende „Verantwortung übernehmen“.',
  'Sollte die Schule später beginnen? Verwende „wenn“ und Konjunktiv II.',
]
export function Paragraph() {
  const [i, setI] = useState(() => Math.floor(Math.random() * PARA_PROMPTS.length))
  const [text, setText] = useState('')
  const [check, setCheck] = useState(false)
  const n = wc(text)
  if (check) {
    return (
      <Page>
        <TopBar title="Endkontrolle" onBack={() => setCheck(false)} />
        <Endkontrolle text={text} type="absatz" onDone={(res) => {
          const id = 't' + Date.now().toString(36)
          update((s) => { s.texts.unshift({ id, date: today(), kind: 'absatz', type: 'absatz', title: PARA_PROMPTS[i].slice(0, 60), text, words: n, warnings: res.warnCount, prompt: PARA_PROMPTS[i] }) })
          addXP(10); touchStreak(); go(`/text/${id}`)
        }} />
      </Page>
    )
  }
  return (
    <Page>
      <TopBar title="Kurzer Absatz" />
      <div className="card"><p className="font-semibold">{PARA_PROMPTS[i]}</p><p className="mt-1 text-sm muted">60–100 Wörter</p></div>
      <textarea spellCheck="false" className="input mt-3 min-h-[40vh]" value={text} onChange={(e) => setText(e.target.value)} />
      <p className={`mt-1 text-sm ${n >= 60 && n <= 100 ? 'text-green-700' : 'muted'}`}>{n} Wörter</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="btn-ghost" onClick={() => setI((i + 1) % PARA_PROMPTS.length)}>Anderes Thema</button>
        <button className="btn-primary" disabled={n < 20} onClick={() => setCheck(true)}>Endkontrolle</button>
      </div>
    </Page>
  )
}

export function TextsScreen() {
  const texts = useStore((s) => s.texts)
  return (
    <Page>
      <TopBar title="Meine Texte" />
      {texts.length === 0 && <p className="muted">Noch keine Texte. Starte eine Simulation oder schreib einen Absatz.</p>}
      <div className="space-y-2">
        {texts.map((t) => (
          <a key={t.id} href={`#/text/${t.id}`} className="card block !p-3">
            <p className="text-xs muted">{fmt(t.date)} · {t.kind === 'simulation' ? 'Simulation' : 'Absatz'} · {t.words} Wörter</p>
            <p className="flex items-center gap-2 font-bold"><Icon name={TEXTSORTE_ICON[t.type] || 'pen'} size={18} className="text-brand" />{t.title}</p>
            {t.feedback && <p className="text-xs text-green-700 dark:text-green-400">Feedback gespeichert</p>}
          </a>
        ))}
      </div>
    </Page>
  )
}

export function TextDetail({ id }) {
  const t = useStore((s) => s.texts.find((x) => x.id === id))
  const [fb, setFb] = useState(t?.feedback || '')
  const [msg, setMsg] = useState('')
  if (!t) return <Page><TopBar title="Text nicht gefunden" /></Page>
  const a = ANGABEN.find((x) => x.id === t.angabeId)
  const saveFb = () => {
    update((s) => { const x = s.texts.find((y) => y.id === id); if (x) x.feedback = fb })
    const rows = parseImport(fb)
    if (rows.length && confirm(`${rows.length} Fehler aus dem Feedback gefunden. Als Karten in „Meine Fehler“ anlegen?`)) {
      const stamp = Date.now().toString(36)
      update((s) => { rows.forEach((r, i) => s.mine.push({ ...r, id: `f${stamp}${i}`, rule: r.note, ruleEn: '', added: today(), from: id })) })
      seedMine([])
      setMsg(`${rows.length} Karten angelegt.`)
    } else setMsg('Gespeichert.')
  }
  return (
    <Page>
      <TopBar title={t.title} right={<button className="chip" onClick={() => { if (confirm('Text löschen?')) { update((s) => { s.texts = s.texts.filter((x) => x.id !== id) }); go('/texte') } }} aria-label="Löschen"><Icon name="trash" size={16} /></button>} />
      <p className="text-sm muted">{fmt(t.date)} · {t.words} Wörter{t.minutes ? ` · ${t.minutes} Min.` : ''}</p>
      <div className="card mt-2 whitespace-pre-wrap text-[15px] leading-relaxed" dangerouslySetInnerHTML={{ __html: highlight(t.text) }} />
      <button className="btn-primary mt-3 w-full" onClick={() => copyFeedbackPrompt({ text: t.text, angabe: a ? angabeText(a) : t.prompt, type: tsById(t.type)?.name })}><Icon name="clipboard" size={18} className="mr-2" />Feedback holen</button>
      <div className="card mt-3">
        <p className="font-bold">Feedback aus dem Claude-Chat einfügen</p>
        <p className="text-sm muted">Füge die Antwort ein. Zeilen im Format „falsch | richtig | Kategorie“ werden zu Fehlerkarten.</p>
        <textarea className="input mt-2 !text-sm" rows={8} value={fb} onChange={(e) => setFb(e.target.value)} spellCheck={false} />
        <button className="btn-primary mt-2 w-full" disabled={!fb.trim()} onClick={saveFb}>Speichern & Fehler importieren</button>
        {msg && <p className="mt-2 text-sm text-green-700 dark:text-green-400">{msg}</p>}
      </div>
    </Page>
  )
}
