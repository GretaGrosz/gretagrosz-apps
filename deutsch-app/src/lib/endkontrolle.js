// Endkontrolle: rule-based checks for Greta's typical mistakes. Not perfect – they point at places to re-read.
const SUBJ = 'dass|weil|wenn|ob|obwohl|falls|damit|nachdem|bevor|sodass|während|als|da'
const FINITE = new Set('ist sind war waren hat haben hatte hatten kann können konnte konnten muss müssen musste mussten soll sollen sollte sollten will wollen wollte wird werden wurde wurden würde würden gibt gab geht ging macht kommt bringt zeigt bietet hilft fehlt braucht brauchen spielt spielen'.split(' '))
const NO_COMMA_BEFORE = new Set(['und', 'oder', 'als', 'auch', 'so', 'sondern', 'aber', 'ohne', 'statt', 'anstatt', 'außer', 'gerade', 'nur', 'vor', 'allem', 'bis', 'je', 'sowie', 'zwar'])
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const KNOWN = [
  [/\bMeine Meinung nach\b/gi, 'Meiner Meinung nach'],
  [/\bAn der anderen Seite\b/gi, 'Auf der anderen Seite'],
  [/\bAuf einer Seite\b/gi, 'Auf der einen Seite'],
  [/\bin Internet\b/gi, 'im Internet'],
  [/\bauf Internet\b/gi, 'auf das Internet'],
  [/\bZugreife\b/g, 'Zugriff'],
  [/\bin folgende\b/gi, 'im Folgenden'],
  [/\bim folgenden\b/g, 'im Folgenden (groß)'],
  [/\bin Sicht der\b/gi, 'aus Sicht der'],
  [/\bauch wann\b/gi, 'auch wenn'],
  [/\b[Ww]ann (?!\w+\?)(?=[^?]*[.,!])/g, 'wenn? („wann“ nur für Fragen nach der Zeit)'],
  [/\bMassen-Tourismus\b/g, 'Massentourismus'],
  [/\b[Ss]ozial(e)? [Mm]edian\b|\bSozialen Medien\b/g, 'in den sozialen Medien (sozial klein)'],
  [/\bder Schuld (an|zu)\b/gi, 'jemandem die Schuld geben/zuschieben'],
  [/\bVerantwortung (für [^.]{0,30})?zu nehmen\b|\bVerantwortung nehmen\b/gi, 'Verantwortung übernehmen'],
  [/Änderungen fördern\b/gi, 'Änderungen bewirken'],
  [/\bmehrere Menschen\b/gi, 'immer mehr Menschen? (falls eine Entwicklung gemeint ist)'],
  [/\bfür die Unschuldige\b/gi, 'den Unschuldigen (Dativ)'],
  [/\bin dem (Frankreich|Österreich|Deutschland|Italien|Ungarn|England)\b/g, 'in $1 (Länder ohne Artikel)'],
  [/\bmit viele\b/gi, 'mit vielen (Dativ)'],
  [/\bStadt\b(?= (muss|sollte|soll|unterstützt|fördert|regiert))/g, 'Staat? (Land/Regierung) – Stadt = Ort'],
  [/\bfördern bessere\b|\bfördern mehr\b/gi, 'fordern (verlangen)? – fördern = unterstützen'],
  [/\bdas (es|er|sie|man|wir|ich|die|der) /g, 'dass? (Konjunktion vor einem Nebensatz)'],
  [/\bGDP\b/g, 'BIP'],
]

// Plurals with an extra -n after es gibt / manche / alle / viele (only allowed in the dative)
const PL_N = /\b([Ee]s gibt|gibt es|[Mm]anche|[Aa]lle|[Vv]iele|[Ee]inige|[Mm]ehrere|[Dd]iese|[Dd]ie)\s+([a-zäöüß]+\s+)?([A-ZÄÖÜ][a-zäöüß]*(ern|eln))(?![a-zäöüß])/g
const DAT_BEFORE = /\b(mit|von|aus|bei|nach|seit|zu|in|an|auf|unter|vor|zwischen|den|vielen|allen|manchen|einigen)\s*$/i

export function splitSentences(text) {
  return text.replace(/\n+/g, ' \n ').split(/(?<=[.!?])\s+/)
}

export function clauses(text) {
  // subordinate clauses: from a conjunction (or ", der/die/das …") to the next , . ; ! ?
  const out = []
  const re = new RegExp(`(^|[\\s„"(])((${SUBJ})|(?<=,\\s)(der|die|das|denen|deren|dessen|dem|den))\\s([^,.;!?\\n]+)`, 'gi')
  let m
  while ((m = re.exec(text))) {
    const conj = m[2]
    const body = m[5]
    const start = m.index + m[1].length
    const toks = body.trim().split(/\s+/)
    const low = toks.map((t) => t.toLowerCase())
    // suspicious: a finite verb in position 2 or 3 and words after it ("dass es ist schwer")
    let sus = false
    for (let k = 1; k <= 2 && k < toks.length - 1; k++) if (FINITE.has(low[k]) && toks.length - 1 > k) sus = true
    if (/^(als|da|während)$/i.test(conj) && !sus) continue
    out.push({ start, end: start + conj.length + 1 + body.length, conj, body, sus, last: toks[toks.length - 1] })
  }
  return out
}

export function missingCommas(text) {
  const hits = []
  const re = new RegExp(`(\\S+)\\s+(${SUBJ}|der|die|das|denen|deren|dessen)\\s`, 'g')
  let m
  while ((m = re.exec(text))) {
    const prev = m[1]
    const conj = m[2]
    if (/[,.;:!?(„"–-]$/.test(prev)) continue
    if (NO_COMMA_BEFORE.has(prev.toLowerCase())) continue
    if (/^(der|die|das|denen|deren|dessen)$/.test(conj)) continue // articles vs. relative pronouns: too ambiguous
    if (/^(als|da|während)$/.test(conj)) continue
    hits.push(`${prev} ${conj} … → Beistrich vor „${conj}“?`)
  }
  // infinitive groups after typical triggers without comma
  const inf = /\b(wichtig|schwer|einfach|notwendig|sinnvoll|darauf an|Ziel ist es|versuchen|versucht|beschlossen|die Aufgabe|lohnt es sich|lohnt sich|vor|die Möglichkeit|geschafft)\s+(?!,)([^,.!?]{2,80}?\s(zu\s\w+|\w+zu\w+en))\b/gi
  while ((m = inf.exec(text))) {
    if (/\bum$/.test(m[1])) continue
    hits.push(`${m[1]} ${m[2].slice(0, 40)}… → Beistrich vor der Infinitivgruppe?`)
  }
  return hits
}

export function knownHits(text) {
  const hits = []
  for (const [re, fix] of KNOWN) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(text))) {
      hits.push(`„${m[0]}“ → ${fix.replace('$1', m[1] || '')}`)
      if (!re.global) break
    }
  }
  return hits
}
export function pluralHits(text) {
  const hits = []
  let m
  PL_N.lastIndex = 0
  while ((m = PL_N.exec(text))) {
    const before = text.slice(Math.max(0, m.index - 15), m.index)
    if (DAT_BEFORE.test(before)) continue
    if (/^(die|diese)$/i.test(m[1]) && /\b(mit|von|aus|bei|nach|zu|in|an|auf)\s*$/i.test(before)) continue
    hits.push(`„${m[0]}“ → Plural ohne -n? (nur im Dativ: mit den ${m[3]})`)
  }
  return hits
}

export function endkontrolle(text, { type, angabe } = {}) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  const first = lines[0] || ''
  const items = []
  // 1. Text type conventions
  const conv = []
  const titleLike = first && first.split(/\s+/).length <= 12 && !/[.,]$/.test(first)
  if (['eroerterung', 'kommentar', 'empfehlung', 'offenerbrief'].includes(type) && !titleLike) conv.push('Überschrift fehlt? (erste Zeile sollte ein kurzer Titel ohne Punkt sein)')
  if (type === 'leserbrief') {
    if (!/Sehr geehrte Damen und Herren,/.test(text)) conv.push('Anrede „Sehr geehrte Damen und Herren,“ (an die Redaktion) fehlt')
    if (/Professor/i.test(text)) conv.push('„Professor/in“ – ein Leserbrief geht an die Zeitung, nicht an die Lehrerin!')
    if (!/Artikel|Beitrag/.test(text)) conv.push('Bezug auf den Artikel (Titel, Zeitung, Datum) fehlt?')
  }
  if (type === 'offenerbrief' && !/Offener Brief/i.test(text)) conv.push('Überschrift „Offener Brief an …“ fehlt?')
  if (['leserbrief', 'offenerbrief'].includes(type)) {
    if (!/Mit freundlichen Grüßen/.test(text)) conv.push('Grußformel „Mit freundlichen Grüßen“ fehlt')
    if (/Mit freundlichen Grüßen,/.test(text)) conv.push('Nach „Mit freundlichen Grüßen“ steht kein Beistrich')
  }
  if (type === 'meinungsrede') {
    if (!/^(Sehr geehrte|Liebe|Hallo|Geschätzte)/m.test(text)) conv.push('Anrede des Publikums am Anfang fehlt?')
    if (!/Aufmerksamkeit|Danke/i.test(text)) conv.push('Dank am Schluss („Vielen Dank für Ihre Aufmerksamkeit!“) fehlt?')
  }
  if (type !== 'absatz') items.push({ label: 'Überschrift / Anrede / Grußformel passen zu Textsorte und Adressat', hits: conv, warn: conv.length > 0, auto: conv.length === 0, info: conv.length ? '' : 'Automatische Prüfung: nichts gefunden.' })
  // 2. Tasks + word count
  if (angabe) {
    const [lo, hi] = angabe.words
    const ok = words >= lo && words <= hi
    items.push({ label: `Wortanzahl: ${words} (verlangt ${lo}–${hi})`, warn: !ok, auto: ok, hits: ok ? [] : [words < lo ? `${lo - words} Wörter zu wenig` : `${words - hi} Wörter zu viel`] })
    angabe.tasks.forEach((t, i) => items.push({ label: `Arbeitsauftrag ${i + 1} erfüllt: ${t}` }))
  } else {
    items.push({ label: `Wortanzahl: ${words}` })
  }
  // 3. Verb position in subordinate clauses
  const cl = clauses(text)
  const sus = cl.filter((c) => c.sus)
  items.push({ label: `Jeder Nebensatz (dass/weil/wenn/ob/obwohl/der/die/das): Verb am Ende? (${cl.length} markiert)`, hits: sus.map((c) => `„${c.conj} ${c.body.slice(0, 50)}“ – Verb zu früh?`), warn: sus.length > 0, info: 'Gelb im Text = Nebensatz. Lies jeden: steht das konjugierte Verb ganz am Ende?' })
  // 4. Commas
  const commas = missingCommas(text)
  items.push({ label: 'Beistrich vor jedem dass/ob/wenn/weil-Satz, Relativsatz und jeder Infinitivgruppe mit „zu“', hits: commas, warn: commas.length > 0 })
  // 5. Known wrong forms
  const known = knownHits(text)
  items.push({ label: '„Meiner Meinung nach“, „Auf der anderen Seite“, „im Internet“ … richtig?', hits: known, warn: known.length > 0, auto: known.length === 0, info: known.length ? '' : 'Keine bekannten Fehlerformen gefunden.' })
  // 6. Plural -n
  const pl = pluralHits(text)
  items.push({ label: 'Plural nach „es gibt“, „manche“, „alle“, „viele“: kein extra -n (außer Dativ)', hits: pl, warn: pl.length > 0 })
  // 7. V2 after a fronted phrase with comma ("Auf der anderen Seite, alle …")
  const v2 = []
  const re = /\b(Auf der anderen Seite|Auf der einen Seite|Meiner Meinung nach|Außerdem|Deshalb|Trotzdem|Heutzutage|Beispielsweise|Zum Beispiel|Leider|Darüber hinaus|Andererseits|Einerseits|Zuerst|Danach|Schließlich|Letztendlich),\s+(\w+)/g
  let m
  while ((m = re.exec(text))) v2.push(`„${m[1]}, ${m[2]}“ → kein Beistrich, gleich das Verb: „${m[1]} + Verb …“`)
  items.push({ label: 'Nach einem Satzglied am Anfang: Verb an Position 2, kein Beistrich', hits: v2, warn: v2.length > 0, auto: v2.length === 0 })
  // 7b. Register: spoken words that cost marks in "Ausdruck"
  const reg = []
  const colloq = /\b(halt|eh|voll|total|irgendwie|cool|krass|mega|so ein|Leute|nix|okay|ok)\b/g
  while ((m = colloq.exec(text))) reg.push(`„${m[1]}“ → Umgangssprache, in der Schularbeit präziser formulieren`)
  items.push({ label: 'Schriftsprache: keine Umgangssprache (halt, eh, voll, irgendwie, Leute …)', hits: reg.slice(0, 6), warn: reg.length > 0, auto: reg.length === 0 })
  // 8. Capitalisation basics
  const cap = []
  const re2 = /(^|[.!?]\s+)([a-zäöü]\w*)/g
  while ((m = re2.exec(text))) cap.push(`„${m[2]}“ am Satzanfang → groß`)
  items.push({ label: 'Großschreibung: Satzanfang, Nomen und Nominalisierungen (das Lernen, im Folgenden)', hits: cap.slice(0, 5), warn: cap.length > 0 })
  return { items, warnCount: items.reduce((a, it) => a + (it.hits?.length || 0), 0), words }
}

// HTML with subordinate clauses highlighted (yellow) and suspicious ones (red)
export function highlight(text) {
  const cl = clauses(text)
  let out = ''
  let pos = 0
  for (const c of cl) {
    if (c.start < pos) continue
    out += esc(text.slice(pos, c.start))
    out += `<mark style="background:${c.sus ? 'rgba(239,68,68,.35)' : 'rgba(250,204,21,.35)'};color:inherit;border-radius:3px">${esc(text.slice(c.start, c.end))}</mark>`
    pos = c.end
  }
  out += esc(text.slice(pos))
  return out
}
