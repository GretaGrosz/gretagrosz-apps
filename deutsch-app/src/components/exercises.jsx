// One component per exercise type. Each calls onSubmit({ ok, given, expected, textual }) once.
import { useEffect, useMemo, useRef, useState } from 'react'
import { isCorrect, closest, shuffle, bankTokens, finalPunct, normalize, words } from '../lib/check.js'
import { speak, canSpeak } from '../lib/speech.js'
import { UmlautBar } from './ui.jsx'
import Icon from './Icon.jsx'

// Computer: number keys pick option n, Enter submits
function useKeys(active, opts, choose, submit) {
  useEffect(() => {
    if (!active) return
    const on = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (/^[1-9]$/.test(e.key) && opts[Number(e.key) - 1] !== undefined) { e.preventDefault(); choose(opts[Number(e.key) - 1]) }
      else if (e.key === 'Enter' && submit) { e.preventDefault(); submit() }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  })
}
const Key = ({ n }) => <kbd className="mr-2 hidden align-middle lg:inline">{n}</kbd>

const answers = (it) => [].concat(it.a, it.acc || [])
const Check = ({ disabled, onClick, label = 'Prüfen' }) => (
  <button className="btn-primary w-full text-lg" disabled={disabled} onClick={onClick}>{label}</button>
)
function Prompt({ children }) {
  return <p className="whitespace-pre-line text-xl font-semibold leading-snug">{children}</p>
}
const TITLES = {
  mc: 'Wähle die richtige Antwort', gap: 'Ergänze die Lücke', order: 'Bilde den Satz', fix: 'Fehler finden', match: 'Verbinde die Paare',
  tf: 'Forme den Satz um', tr: 'Übersetze ins Deutsche', listen: 'Hör zu und schreib', mine: 'Meine Fehler: Schreib es richtig', komma: 'Beistriche setzen',
}
export const exerciseTitle = (it) => (it.t === 'gap' && it.display === 'choose' ? 'Wähle die richtige Form' : TITLES[it.t] || '')

// ---------- Multiple choice ----------
export function MC({ item, onSubmit, locked }) {
  const opts = useMemo(() => (item.keepOrder ? item.o : shuffle(item.o)), [item])
  const [sel, setSel] = useState(null)
  const hasGap = item.q.includes('___')
  useKeys(!locked, opts, setSel, sel ? () => onSubmit({ ok: sel === item.a, given: sel, expected: item.a }) : null)
  return (
    <div className="flex flex-1 flex-col">
      <Prompt>
        {hasGap ? item.q.split('___').map((p, i, arr) => (
          <span key={i}>{p}{i < arr.length - 1 && <span className="mx-1 inline-block min-w-[3rem] border-b-2 border-brand px-1 text-brand">{sel ?? ' '}</span>}</span>
        )) : item.q}
      </Prompt>
      {item.h && <p className="mt-1 muted">{item.h}</p>}
      <div className={`mt-5 grid gap-2 ${opts.every((o) => o.length < 14) ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {opts.map((o, n) => (
          <button key={o} disabled={locked} onClick={() => setSel(o)}
            className={`min-h-[52px] rounded-2xl border-2 px-4 py-2 text-left text-[17px] font-medium transition hover:border-brand/50 ${sel === o ? 'border-brand bg-brand-light dark:bg-brand/20' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#18201c]'}`}>
            <Key n={n + 1} />{o}
          </button>
        ))}
      </div>
      <div className="mt-auto pt-6">{!locked && <Check disabled={!sel} onClick={() => onSubmit({ ok: sel === item.a, given: sel, expected: item.a })} />}</div>
    </div>
  )
}

// ---------- Gap fill (typed, or choose for level 1) ----------
export function Gap({ item, onSubmit, locked }) {
  const parts = item.q.split('___')
  const n = parts.length - 1
  const exp = [].concat(item.a)
  const [vals, setVals] = useState(() => Array(n).fill(''))
  const first = useRef()
  useEffect(() => { if (item.display !== 'choose') first.current?.focus() }, [item])
  const opts = useMemo(() => (item.display === 'choose' ? shuffle(item.o) : null), [item])
  useKeys(!locked && !!opts, opts || [], (o) => setVals([o]), null)
  const submit = () => {
    if (n === 1) {
      const ok = isCorrect(vals[0], [item.a, ...(item.acc || [])])
      onSubmit({ ok, given: vals[0], expected: ok ? vals[0] : closest(vals[0], [item.a, ...(item.acc || [])]), textual: item.display !== 'choose' })
    } else {
      const ok = vals.every((v, i) => isCorrect(v, exp[i]))
      onSubmit({ ok, given: vals.join(' … '), expected: exp.join(' … '), textual: true })
    }
  }
  return (
    <div className="flex flex-1 flex-col">
      <div className="text-xl font-semibold leading-[2.6rem]">
        {parts.map((p, i) => (
          <span key={i} className="whitespace-pre-line">
            {p}
            {i < n && (item.display === 'choose'
              ? <span className="mx-1 inline-block min-w-[3.5rem] border-b-2 border-brand px-1 text-center text-brand">{vals[0] || ' '}</span>
              : <input ref={i === 0 ? first : undefined} value={vals[i]} disabled={locked} autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
                  onChange={(e) => setVals((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
                  onKeyDown={(e) => e.key === 'Enter' && vals.every(Boolean) && !locked && submit()}
                  className="mx-1 inline-block w-36 rounded-lg border-b-2 border-brand bg-brand-light/60 px-2 py-0.5 text-center text-lg outline-none dark:bg-brand/20"
                  style={{ width: `${Math.max(5, String(exp[i] || '').length + 2)}ch` }} />)}
          </span>
        ))}
      </div>
      {item.h && <p className="mt-1 muted">{item.h}</p>}
      {opts && (
        <div className="mt-5 flex flex-wrap gap-2">
          {opts.map((o, n) => (
            <button key={o} disabled={locked} onClick={() => setVals([o])} title={`Taste ${n + 1}`}
              className={`min-h-[48px] rounded-2xl border-2 px-4 text-[17px] font-medium ${vals[0] === o ? 'border-brand bg-brand-light dark:bg-brand/20' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#18201c]'}`}>{o}</button>
          ))}
        </div>
      )}
      <div className="mt-auto space-y-3 pt-6">
        {item.display !== 'choose' && !locked && <UmlautBar />}
        {!locked && <Check disabled={!vals.every((v) => v.trim())} onClick={submit} />}
      </div>
    </div>
  )
}

// ---------- Typed full answer: transform, translate, listen, own mistakes ----------
export function Typed({ item, onSubmit, locked }) {
  const [val, setVal] = useState('')
  const ref = useRef()
  useEffect(() => {
    ref.current?.focus()
    if (item.t === 'listen') setTimeout(() => speak(item.a), 300)
  }, [item])
  const submit = () => {
    const all = answers(item)
    const ok = isCorrect(val, all)
    onSubmit({ ok, given: val, expected: ok ? val : closest(val, all), textual: true })
  }
  return (
    <div className="flex flex-1 flex-col">
      {item.t === 'tr' && <Prompt>„{item.en}“</Prompt>}
      {item.t === 'tf' && <Prompt>{item.q}</Prompt>}
      {item.t === 'mine' && (
        <>
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">{item.src === 'mine' ? 'So stand es in meiner Schularbeit' : 'Dieser Satz hat einen Fehler – schreib ihn richtig'}</p>
          <Prompt><span className="decoration-red-400 decoration-wavy underline-offset-4">{item.w}</span></Prompt>
        </>
      )}
      {item.t === 'listen' && (
        <div className="flex gap-3">
          <button onClick={() => speak(item.a)} className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand text-white shadow-[0_4px_0_#0f7353]" aria-label="Anhören"><Icon name="volume" size={36} /></button>
          <button onClick={() => speak(item.a, 0.6)} className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl bg-brand-light text-brand dark:bg-brand/20" aria-label="Langsam"><Icon name="gauge" size={28} /><span className="text-[11px] font-bold">langsam</span></button>
          {!canSpeak && <p className="text-sm muted">Dein Browser kann nicht vorlesen.</p>}
        </div>
      )}
      {item.h && <p className="mt-1 muted">{item.h}</p>}
      <textarea ref={ref} rows={3} value={val} disabled={locked} spellCheck={false} autoCapitalize="sentences" autoCorrect="off" autoComplete="off"
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (val.trim() && !locked) submit() } }}
        placeholder={item.t === 'listen' ? 'Schreib genau, was du hörst …' : 'Auf Deutsch …'} className="input mt-5 resize-none" />
      <div className="mt-auto space-y-3 pt-4">
        {!locked && <UmlautBar />}
        {!locked && <Check disabled={!val.trim()} onClick={submit} />}
      </div>
    </div>
  )
}

// ---------- Word bank ----------
export function Order({ item, onSubmit, locked }) {
  const tiles = useMemo(() => {
    const base = item.chunks ? [...item.chunks] : bankTokens(item.a)
    return shuffle([...base, ...(item.extra || [])]).map((t, i) => ({ t, i }))
  }, [item])
  const [line, setLine] = useState([])
  const used = new Set(line.map((x) => x.i))
  const punct = finalPunct(item.a) || '.'
  const submit = () => {
    const given = normalize(line.map((x) => x.t).join(' ')) + punct
    const ok = isCorrect(given, answers(item))
    onSubmit({ ok, given, expected: ok ? given : closest(given, answers(item)), textual: true, mode: 'word' })
  }
  return (
    <div className="flex flex-1 flex-col">
      {item.q && <Prompt>{item.q}</Prompt>}
      {item.en && <p className="mt-1 muted">„{item.en}“</p>}
      <div className="mt-4 flex min-h-[112px] flex-wrap content-start gap-2 border-b-2 border-t-2 border-black/10 py-3 dark:border-white/10">
        {line.map((x) => (
          <button key={x.i} disabled={locked} onClick={() => setLine((l) => l.filter((y) => y.i !== x.i))}
            className="min-h-[44px] rounded-xl bg-white px-3 text-[17px] font-medium shadow-[0_2px_0_rgba(0,0,0,.15)] ring-1 ring-black/10 dark:bg-[#1d2622] dark:ring-white/10">{x.t}</button>
        ))}
        {line.length > 0 && <span className="self-end pb-2 text-lg">{punct}</span>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {tiles.map((x) => (
          <button key={x.i} disabled={locked || used.has(x.i)} onClick={() => setLine((l) => [...l, x])}
            className={`min-h-[44px] rounded-xl px-3 text-[17px] font-medium ring-1 ring-black/10 dark:ring-white/10 ${used.has(x.i) ? 'bg-black/5 text-transparent dark:bg-white/5' : 'bg-white shadow-[0_2px_0_rgba(0,0,0,.15)] dark:bg-[#1d2622]'}`}>{x.t}</button>
        ))}
      </div>
      <div className="mt-auto pt-6">{!locked && <Check disabled={!line.length} onClick={submit} />}</div>
    </div>
  )
}

// ---------- Fehler finden: tap the wrong word, type the fix ----------
export function Fix({ item, onSubmit, locked }) {
  const wrongT = useMemo(() => words(item.w), [item])
  const rightT = useMemo(() => words(item.a), [item])
  const sameLen = wrongT.length === rightT.length
  const targets = useMemo(() => (sameLen ? wrongT.map((t, i) => (t !== rightT[i] ? i : -1)).filter((i) => i >= 0) : []), [wrongT, rightT, sameLen])
  const [fixed, setFixed] = useState({})
  const [sel, setSel] = useState(null)
  const [val, setVal] = useState('')
  const inp = useRef()
  // word-order mistakes (same words, different order) can't be fixed word by word → type the whole sentence
  const bare = (arr) => arr.map((w) => w.replace(/[.,!?;:]/g, '').toLowerCase()).sort().join(' ')
  const reorder = targets.length > 1 && bare(wrongT) === bare(rightT)
  if (!sameLen || !targets.length || reorder) return <Typed item={{ ...item, t: 'mine' }} onSubmit={onSubmit} locked={locked} />
  const remaining = targets.filter((i) => !(i in fixed))
  const choose = (i) => { setSel(i); setVal(wrongT[i]); setTimeout(() => inp.current?.select(), 30) }
  const submit = () => {
    if (!targets.includes(sel)) {
      onSubmit({ ok: false, given: `„${wrongT[sel]}“ ist richtig`, expected: item.a, textual: false, note: `Der Fehler war: ${targets.map((i) => `„${wrongT[i]}“ → „${rightT[i]}“`).join(', ')}` })
      return
    }
    const altOk = (item.acc || []).map(words).some((alt) => alt.length === wrongT.length && alt[sel] === normalize(val))
    if (normalize(val) !== rightT[sel] && !altOk) {
      onSubmit({ ok: false, given: wrongT.map((t, i) => (i === sel ? val : i in fixed ? rightT[i] : t)).join(' '), expected: item.a, textual: true, mode: 'word' })
      return
    }
    const nf = { ...fixed, [sel]: true }
    setFixed(nf); setSel(null); setVal('')
    if (targets.every((i) => i in nf)) onSubmit({ ok: true, given: item.a, expected: item.a })
  }
  return (
    <div className="flex flex-1 flex-col">
      <p className="muted">{remaining.length > 1 ? `Hier sind ${remaining.length} Fehler. ` : ''}Tippe auf das falsche Wort und korrigiere es.</p>
      <div className="mt-4 flex flex-wrap gap-x-1.5 gap-y-2 text-xl leading-relaxed">
        {wrongT.map((t, i) => (
          <button key={i} disabled={locked || i in fixed} onClick={() => choose(i)}
            className={`rounded-lg px-1.5 py-0.5 ${i in fixed ? 'bg-green-100 font-semibold text-green-800 dark:bg-green-900/50 dark:text-green-200' : sel === i ? 'bg-amber-200 dark:bg-amber-700/60' : 'active:bg-black/5'}`}>
            {i in fixed ? rightT[i] : t}
          </button>
        ))}
      </div>
      {sel !== null && !locked && (
        <div className="mt-5 animate-pop">
          <label className="text-sm font-semibold muted">Korrektur für „{wrongT[sel]}“</label>
          <input ref={inp} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoCapitalize="off" autoCorrect="off" spellCheck={false} className="input mt-1" />
        </div>
      )}
      <div className="mt-auto space-y-3 pt-6">
        {sel !== null && !locked && <UmlautBar />}
        {!locked && <Check disabled={sel === null} onClick={submit} />}
      </div>
    </div>
  )
}

// ---------- Match pairs ----------
export function Match({ item, onSubmit, locked }) {
  const left = useMemo(() => shuffle(item.pairs.map((p, i) => ({ v: p[0], i }))), [item])
  const right = useMemo(() => shuffle(item.pairs.map((p, i) => ({ v: p[1], i }))), [item])
  const [selL, setSelL] = useState(null)
  const [done, setDone] = useState([])
  const [doneR, setDoneR] = useState([])
  const [bad, setBad] = useState(null)
  const [errors, setErrors] = useState(0)
  const tapRight = (r) => {
    if (selL === null) return
    if (item.pairs[selL.i][1] === r.v) {
      const nd = [...done, selL.i]
      setDone(nd); setDoneR((d) => [...d, r.i]); setSelL(null)
      if (nd.length === item.pairs.length) onSubmit({ ok: errors === 0, given: errors ? `${errors} falsche Zuordnung(en)` : 'alle richtig', expected: item.pairs.map((p) => `${p[0]} → ${p[1]}`).join(' · ') })
    } else {
      setErrors((e) => e + 1); setBad(r.i); setTimeout(() => setBad(null), 400)
    }
  }
  const rightDone = (r) => doneR.includes(r.i)
  const cls = 'min-h-[52px] w-full rounded-2xl border-2 px-3 text-[16px] font-medium transition'
  return (
    <div className="flex flex-1 flex-col">
      <Prompt>{item.q}</Prompt>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((l) => (
            <button key={l.i} disabled={locked || done.includes(l.i)} onClick={() => setSelL(l)}
              className={`${cls} ${done.includes(l.i) ? 'border-transparent bg-green-100 text-green-800 opacity-50 dark:bg-green-900/40 dark:text-green-200' : selL?.i === l.i ? 'border-brand bg-brand-light dark:bg-brand/20' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#18201c]'}`}>{l.v}</button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((r) => (
            <button key={r.i} disabled={locked || rightDone(r)} onClick={() => tapRight(r)}
              className={`${cls} ${rightDone(r) ? 'border-transparent bg-green-100 text-green-800 opacity-50 dark:bg-green-900/40 dark:text-green-200' : bad === r.i ? 'animate-shake border-red-400 bg-red-50 dark:bg-red-900/30' : 'border-black/10 bg-white dark:border-white/10 dark:bg-[#18201c]'}`}>{r.v}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Beistrich: tap the gaps where a comma belongs ----------
export function Komma({ item, onSubmit, locked }) {
  const toks = useMemo(() => {
    const s = normalize(item.a).replace(/[.!?]$/, '')
    return s.split(' ').map((w) => ({ w: w.replace(/,$/, ''), comma: w.endsWith(',') }))
  }, [item])
  const [set, setSet] = useState(() => new Set())
  const punct = finalPunct(item.a) || '.'
  const toggle = (i) => setSet((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  const submit = () => {
    const given = toks.map((t, i) => t.w + (set.has(i) ? ',' : '')).join(' ') + punct
    const ok = toks.every((t, i) => t.comma === set.has(i))
    onSubmit({ ok, given, expected: item.a, textual: true, mode: 'word' })
  }
  return (
    <div className="flex flex-1 flex-col">
      <p className="muted">Tippe zwischen die Wörter, wo ein Beistrich fehlt.</p>
      <div className="mt-4 flex flex-wrap items-center text-xl leading-[2.8rem]">
        {toks.map((t, i) => (
          <span key={i} className="inline-flex items-center">
            <span>{t.w}</span>
            {i < toks.length - 1 ? (
              <button disabled={locked} onClick={() => toggle(i)} aria-label="Beistrich" className={`mx-0.5 h-9 w-6 rounded-md text-2xl font-black leading-none ${set.has(i) ? 'bg-brand-light text-brand dark:bg-brand/30' : 'text-black/20 active:bg-black/5 dark:text-white/20'}`}>{set.has(i) ? ',' : '·'}</button>
            ) : <span>{punct}</span>}
          </span>
        ))}
      </div>
      <div className="mt-auto pt-6">{!locked && <Check onClick={submit} />}</div>
    </div>
  )
}

export function Exercise(props) {
  const t = props.item.t
  if (t === 'mc') return <MC {...props} />
  if (t === 'gap') return <Gap {...props} />
  if (t === 'order') return <Order {...props} />
  if (t === 'fix') return <Fix {...props} />
  if (t === 'match') return <Match {...props} />
  if (t === 'komma') return <Komma {...props} />
  return <Typed {...props} />
}
