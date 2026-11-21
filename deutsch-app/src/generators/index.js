// Exercise generators: endless fresh practice from the word tables. Every generator returns one item
// in the same format as the hand-written JSON items. Tested in tests/generators.test.mjs.
import { nouns, datPl, adjectives, verbs, PERSONS, verbPreps, daWord, woWord, PREPS, GENERIC_ADJ } from './lexicon.js'
import { CASE_NAME, CASE_Q, GENDER_NAME, def, einWord, possWord, nounPhrase, adjReason, ARTICLE_RULE_EN, ADJ_END } from './grammar.js'
import {
  clauses, cap, mainClause, inverted, invertedChunks, invertedAlt, subClause, englishOrder, chunksMain, chunksSub,
  DASS_INTROS, OB_INTROS, FRONTS, pairs, INF_GROUPS, INF_INTROS,
} from './clauses.js'

import { C1_GENERATORS } from './c1.js'

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)]
const uniq = (arr) => [...new Set(arr)]
function idOf(name, key) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return `g.${name}.${(h >>> 0).toString(36)}`
}
const item = (name, key, o) => ({ id: idOf(name, key), gen: name, ...o })
const PERSON_NOUNS = nouns.filter((n) => n.person)
const THING_NOUNS = nouns.filter((n) => !n.person)
const COUNT = nouns.filter((n) => n.pl && n.pl !== n.sg)
const ART = { m: 'der', f: 'die', n: 'das' }

// ---------- Genus ----------
const GENUS_RULES = [
  [/(ung|heit|keit|schaft|ion|tät|ik|ie|ur|enz|anz)$/, 'f', (m) => `Endung -${m} → immer feminin (die)`],
  [/(chen|lein)$/, 'n', (m) => `Endung -${m} → immer neutral (das)`],
  [/(um|ment|nis|ma)$/, 'n', (m) => `Endung -${m} → meistens neutral (das)`],
  [/(ismus|ling|or|ist|ent|ant|eur)$/, 'm', (m) => `Endung -${m} → maskulin (der)`],
]
function genusReason(n) {
  for (const [re, g, txt] of GENUS_RULES) {
    const m = n.sg.match(re)
    if (m && g === n.g) return txt(m[1])
  }
  if (n.person && n.g === 'm' && /er$/.test(n.sg)) return 'Person auf -er → maskulin (der)'
  if (n.person && n.g === 'f' && /in$/.test(n.sg)) return 'weibliche Person auf -in → die'
  if (/e$/.test(n.sg) && n.g === 'f') return 'Endung -e → meistens feminin (die)'
  if (/^(Ge)/.test(n.sg) && n.g === 'n') return 'Ge- am Anfang → oft neutral (das)'
  return 'keine Regel – mit dem Artikel auswendig lernen'
}
export function genus(rnd) {
  const n = pick(rnd, nouns.filter((x) => !(x.sg === 'Herr')))
  const why = genusReason(n)
  const others = uniq(['keine Regel – mit dem Artikel auswendig lernen', 'Endung -e → meistens feminin (die)', 'Endung -ung → immer feminin (die)', 'Endung -chen → immer neutral (das)', 'Person auf -er → maskulin (der)']).filter((x) => x !== why)
  return item('genus', n.sg, {
    t: 'mc', q: `___ ${n.sg}`, o: ['der', 'die', 'das'], a: ART[n.g], keepOrder: true,
    y: [why, pick(rnd, others), pick(rnd, others.filter((x) => x !== why))].filter((v, i, a) => a.indexOf(v) === i),
    s: 'genus', r: `${ART[n.g]} ${n.sg}${n.pl ? ` – Plural: die ${n.pl}` : ''}. ${why}.`,
    re: 'English has one article ("the"); German nouns have a gender. Always learn the noun with its article.',
  })
}

// ---------- Plural ----------
function wrongPlurals(n) {
  const c = [n.pl + 'n', n.sg + 'en', n.sg + 'e', n.sg + 's', n.sg + 'er', n.sg + 'n']
  return uniq(c).filter((x) => x !== n.pl && x !== datPl(n.pl) + 'x').filter((x) => x !== n.pl)
}
export function pluralForm(rnd) {
  const n = pick(rnd, COUNT)
  const wrong = wrongPlurals(n).filter((x) => x !== n.pl)
  const opts = uniq([n.pl, ...wrong.sort(() => rnd() - 0.5)]).slice(0, 4)
  return item('plural', n.sg, {
    t: rnd() < 0.5 ? 'mc' : 'gap', q: `${ART[n.g]} ${n.sg} → die ___`, o: opts, a: n.pl, h: '(Plural)',
    s: 'plural.form', r: `${ART[n.g]} ${n.sg} → die ${n.pl}. Im Dativ Plural: den ${datPl(n.pl)}.`,
    re: 'German plurals have several endings (-e, -er, -n, -s, umlaut, or none). Learn each plural with the noun.',
  })
}
const PL_FRAMES = [
  { k: 'A', q: 'Es gibt in Österreich viele ___.', why: 'Akkusativ Plural nach „es gibt“ → kein extra -n' },
  { k: 'N', q: 'Viele ___ sind ein Thema in der Zeitung.', why: 'Nominativ Plural (Subjekt) → kein extra -n' },
  { k: 'A', q: 'Manche Menschen kritisieren alle ___.', why: 'Akkusativ Plural (wen?) → kein extra -n' },
  { k: 'D', q: 'Das hängt von vielen ___ ab.', why: 'Dativ Plural nach „von“ → Nomen bekommt -n' },
  { k: 'D', q: 'Wir beschäftigen uns mit den ___.', why: 'Dativ Plural nach „mit“ → Nomen bekommt -n' },
  { k: 'D', q: 'In manchen ___ ist das ein Problem.', why: 'Dativ Plural nach „in“ (wo?) → Nomen bekommt -n' },
]
export function pluralCase(rnd) {
  const n = pick(rnd, COUNT.filter((x) => !/[nsa]$/.test(x.pl)))
  const f = pick(rnd, PL_FRAMES)
  const a = f.k === 'D' ? datPl(n.pl) : n.pl
  const wrong = f.k === 'D' ? n.pl : n.pl + 'n'
  const otherWhy = f.k === 'D' ? 'Akkusativ Plural → kein extra -n' : 'Dativ Plural → Nomen bekommt -n'
  return item('pluralCase', n.sg + f.q, {
    t: rnd() < 0.5 ? 'mc' : 'gap', q: f.q, h: `(${ART[n.g]} ${n.sg}, Plural)`, o: [a, wrong], a,
    y: [f.why, otherWhy, 'Genitiv Plural → Nomen bekommt -s'],
    s: f.k === 'D' ? 'plural.datn' : 'plural.keinN', c: 'G',
    r: `Nur im Dativ Plural bekommt das Nomen ein -n: den ${datPl(n.pl)}. Sonst: die ${n.pl}.`,
    re: 'Only the dative plural adds -n (mit den Kindern). Nominative/accusative plural never do: es gibt Kinder, alle Kinder.',
  })
}

// ---------- Cases with articles ----------
const CASE_FRAMES = {
  thing: [
    { k: 'N', q: '{NP} ist ein wichtiges Thema.', pq: '{NP} sind ein wichtiges Thema.', why: 'Nominativ: Subjekt (wer/was ist ein Thema?)' },
    { k: 'A', q: 'Viele Jugendliche kritisieren {NP}.', why: 'Akkusativ: „kritisieren“ + direktes Objekt (wen/was?)' },
    { k: 'A', q: 'In meinem Text gehe ich auf {NP} ein.', why: 'Akkusativ: „eingehen auf“ + Akkusativ' },
    { k: 'D', q: 'Die Klasse beschäftigt sich mit {NP}.', why: 'Dativ: „mit“ verlangt immer den Dativ' },
    { k: 'D', q: 'Viele sind mit {NP} nicht zufrieden.', why: 'Dativ: „mit“ verlangt immer den Dativ' },
    { k: 'G', q: 'Die Bedeutung {NP} wird oft unterschätzt.', why: 'Genitiv: die Bedeutung wessen?' },
    { k: 'G', q: 'Wegen {NP} gibt es eine Diskussion.', why: 'Genitiv: „wegen“ + Genitiv (Schriftsprache)' },
  ],
  person: [
    { k: 'N', q: '{NP} hat eine klare Meinung.', pq: '{NP} haben eine klare Meinung.', why: 'Nominativ: Subjekt (wer hat eine Meinung?)' },
    { k: 'A', q: 'Ich frage {NP} um Rat.', why: 'Akkusativ: jemanden fragen (wen?)' },
    { k: 'A', q: 'Wir unterstützen {NP}.', why: 'Akkusativ: „unterstützen“ + wen?' },
    { k: 'D', q: 'Ich habe {NP} eine Nachricht geschickt.', why: 'Dativ: wem schicke ich etwas?' },
    { k: 'D', q: 'Das Handyverbot gefällt {NP} nicht.', why: 'Dativ: „gefallen“ + wem?' },
    { k: 'G', q: 'Die Meinung {NP} ist wichtig.', why: 'Genitiv: die Meinung wessen?' },
  ],
}
function frameFor(rnd, n) {
  return pick(rnd, n.person ? CASE_FRAMES.person : CASE_FRAMES.thing)
}
function caseDistractors(k) {
  const all = {
    N: 'Nominativ: Subjekt (wer/was?)', A: 'Akkusativ: direktes Objekt (wen/was?)',
    D: 'Dativ: indirektes Objekt / Dativ-Präposition (wem?)', G: 'Genitiv: Besitz (wessen?)',
  }
  return Object.entries(all).filter(([c]) => c !== k).map(([, v]) => v)
}
export function articleCase(rnd) {
  const n = pick(rnd, nouns)
  const f = frameFor(rnd, n)
  const plural = !!n.pl && rnd() < 0.3
  const g = plural ? 'pl' : n.g
  const np = nounPhrase({ det: 'der', noun: n, kase: f.k, plural })
  const q = (plural && f.pq ? f.pq : f.q)
  const sentence = q.replace('{NP}', '___ ' + np.nouns[0])
  const opts = uniq([np.det, ...['der', 'die', 'das', 'den', 'dem', 'des']]).slice(0, 6)
  const dis = caseDistractors(f.k)
  return item('articleCase', n.sg + q + plural, {
    t: 'mc', q: sentence.charAt(0) === '_' ? sentence : sentence, h: `(${ART[n.g]} ${n.sg}${plural ? ', Plural' : ''})`,
    o: opts, a: np.det, capFirst: sentence.startsWith('___'),
    y: [f.why, dis[0], dis[1]], s: `art.${f.k}.${g}`,
    r: `${CASE_NAME[f.k]} ${GENDER_NAME[g]}: ${np.det} ${np.nouns[0]}. ${f.why}.`, re: ARTICLE_RULE_EN[f.k],
  })
}
export function nounPhraseCase(rnd) {
  const n = pick(rnd, nouns)
  const f = frameFor(rnd, n)
  const det = pick(rnd, f.k === 'A' ? ['der', 'ein', 'kein', 'dieser'] : ['der', 'der', 'ein', 'dieser'])
  const plural = det !== 'ein' && !!n.pl && rnd() < 0.3
  const np = nounPhrase({ det, noun: n, kase: f.k, plural })
  const q = (plural && f.pq ? f.pq : f.q)
  const starts = q.startsWith('{NP}')
  const answers = np.nouns.map((nf) => [np.det, nf].join(' ')).map((s) => (starts ? cap(s) : s))
  const base = det === 'der' ? `${ART[n.g]} ${n.sg}` : det === 'dieser' ? `dies- + ${n.sg}` : `${det} + ${n.sg}`
  return item('npCase', n.sg + det + q + plural, {
    t: 'gap', q: q.replace('{NP}', '___'), a: answers[0], acc: answers.slice(1), h: `(${base}${plural ? ', Plural' : ''})`,
    y: [f.why, ...caseDistractors(f.k).slice(0, 2)], s: `np.${f.k}${n.nDecl ? '.ndekl' : ''}`,
    r: `${CASE_NAME[f.k]}: ${answers[0]}. ${f.why}.${n.nDecl ? ` „${n.sg}“ ist ein n-Nomen: außer im Nominativ Singular immer -${n.nForm.slice(n.sg.length)}.` : ''}`,
    re: ARTICLE_RULE_EN[f.k],
  })
}

// ---------- n-Deklination ----------
const NDEKL_FRAMES = [
  { k: 'N', q: '___ hat recht.', why: 'Nominativ Singular: einzige Form ohne -(e)n' },
  { k: 'A', q: 'Ich frage ___ nach seiner Meinung.', why: 'Akkusativ: n-Nomen bekommt -(e)n' },
  { k: 'D', q: 'Wir danken ___ für die Hilfe.', why: 'Dativ: n-Nomen bekommt -(e)n' },
  { k: 'G', q: 'Die Meinung ___ ist uns wichtig.', why: 'Genitiv: n-Nomen bekommt -(e)n (kein -s)' },
  { k: 'A', q: 'Die Zeitung interviewt ___.', why: 'Akkusativ: n-Nomen bekommt -(e)n' },
  { k: 'D', q: 'Ich gebe ___ das Formular.', why: 'Dativ: n-Nomen bekommt -(e)n' },
]
export function nDekl(rnd) {
  const n = pick(rnd, nouns.filter((x) => x.nDecl))
  const f = pick(rnd, NDEKL_FRAMES)
  const np = nounPhrase({ det: 'der', noun: n, kase: f.k })
  const ans = f.q.startsWith('___') ? cap(np.text) : np.text
  const wrong = f.k === 'N' ? `${def('N', 'm')} ${n.nForm}` : `${np.det} ${n.sg}`
  return item('ndekl', n.sg + f.q, {
    t: rnd() < 0.4 ? 'mc' : 'gap', q: f.q, h: `(der ${n.sg})`, a: ans, o: [ans, f.q.startsWith('___') ? cap(wrong) : wrong],
    y: [f.why, 'n-Nomen bekommen nur im Plural -n', 'Genitiv: wie normale Nomen -s'], s: 'ndekl',
    r: `„${n.sg}“ gehört zur n-Deklination: der ${n.sg}, den/dem/des ${n.nForm}. ${f.why}.`,
    re: 'Some masculine nouns (often people: der Mensch, der Kollege, der Student) add -(e)n in every case except the nominative singular.',
  })
}

// ---------- Possessive articles ----------
const OWNERS = [
  { s: 'Ich', p: 'mein', bra: 'brauche', sei: 'bin', label: 'ich' },
  { s: 'Du', p: 'dein', bra: 'brauchst', sei: 'bist', label: 'du' },
  { s: 'Der Schüler', p: 'sein', bra: 'braucht', sei: 'ist', label: 'er' },
  { s: 'Die Schülerin', p: 'ihr', bra: 'braucht', sei: 'ist', label: 'sie, Singular' },
  { s: 'Wir', p: 'unser', bra: 'brauchen', sei: 'sind', label: 'wir' },
  { s: 'Ihr', p: 'euer', bra: 'braucht', sei: 'seid', label: 'ihr' },
  { s: 'Die Schüler', p: 'ihr', bra: 'brauchen', sei: 'sind', label: 'sie, Plural' },
  { s: 'Die Jugendlichen', p: 'ihr', bra: 'brauchen', sei: 'sind', label: 'sie, Plural' },
]
export function possessive(rnd) {
  const n = pick(rnd, nouns.filter((x) => x.poss))
  const o = pick(rnd, OWNERS)
  const plural = !!n.pl && rnd() < 0.35
  const g = plural ? 'pl' : n.g
  const k = rnd() < 0.55 ? 'A' : 'D'
  const word = possWord(o.p, k, g)
  const noun = k === 'D' && plural ? datPl(n.pl) : plural ? n.pl : n.nDecl && k !== 'N' ? n.nForm : n.sg
  const q = k === 'A' ? `${o.s} ${o.bra} ___ ${noun}.` : `${o.s} ${o.sei} mit ___ ${noun} zufrieden.`
  const why = k === 'A' ? `Akkusativ ${GENDER_NAME[g]} („brauchen“ + wen/was?)` : `Dativ ${GENDER_NAME[g]} („mit“ + Dativ)`
  const wrongs = uniq(['', 'e', 'en', 'em', 'er', 'es'].map((e) => possWord(o.p, 'N', 'm').replace(/^euer$/, 'eur') + e).map((w) => (w === 'eur' ? 'euer' : w)))
  return item('poss', n.sg + o.s + k + plural, {
    t: rnd() < 0.4 ? 'mc' : 'gap', q, h: `(${o.p}-)`, a: word, o: uniq([word, ...wrongs]).slice(0, 5),
    y: [why, k === 'A' ? `Dativ ${GENDER_NAME[g]}` : `Akkusativ ${GENDER_NAME[g]}`, `Nominativ ${GENDER_NAME[g]}`],
    s: `poss.${k}.${g}`, r: `${o.label} → ${o.p}-. ${why}: ${word} ${noun}.`,
    re: 'The possessive takes the ending of the noun\'s case and gender, like "ein": not the owner\'s. ihr Traum → ihren Traum (Akk), ihre Träume (Pl).',
  })
}

// ---------- Adjective endings ----------
const ADJ_FRAMES = {
  thing: [
    { k: 'N', q: '{NP} spielt eine große Rolle.', pq: '{NP} spielen eine große Rolle.' },
    { k: 'A', q: 'Viele Menschen kritisieren {NP}.' },
    { k: 'A', q: 'Der Artikel beschreibt {NP}.' },
    { k: 'D', q: 'Die Klasse beschäftigt sich mit {NP}.' },
    { k: 'D', q: 'Vieles hängt von {NP} ab.', noDef: true },
    { k: 'G', q: 'Man muss die Folgen {NP} bedenken.' },
  ],
  person: [
    { k: 'N', q: '{NP} hat eine klare Meinung.', pq: '{NP} haben eine klare Meinung.' },
    { k: 'A', q: 'Die Zeitung interviewt {NP}.' },
    { k: 'D', q: 'Ich spreche mit {NP}.' },
    { k: 'G', q: 'Die Meinung {NP} ist wichtig.' },
  ],
}
export function adjEnding(rnd, opts = {}) {
  for (let tries = 0; tries < 50; tries++) {
    const n = pick(rnd, nouns)
    const f = pick(rnd, n.person ? ADJ_FRAMES.person : ADJ_FRAMES.thing)
    let det = 'det' in opts ? opts.det : pick(rnd, ['der', 'der', 'dieser', 'ein', 'ein', 'kein', 'mein', 'unser', null, 'viele'])
    let plural = !!n.pl && (det === 'viele' || rnd() < 0.3)
    if (det === 'viele' && !n.pl) continue
    if (det === 'ein' && plural) det = 'kein'
    if (det === null && !plural && !n.mass) continue
    if (det === null && !plural && f.k === 'G' && n.g !== 'f') continue
    if (f.noDef && (det === 'der' || det === 'dieser')) continue
    if (det === 'viele' && f.k === 'G') continue
    const adj = pick(rnd, GENERIC_ADJ.filter((a) => !(n.person && ['digital', 'öffentlich', 'aktuell', 'modern'].includes(a))))
    const np = nounPhrase({ det, adj, noun: n, kase: f.k, plural })
    const g = plural ? 'pl' : n.g
    const q = (plural && f.pq ? f.pq : f.q)
    const start = q.startsWith('{NP}')
    const before = np.det ? (start ? cap(np.det) : np.det) + ' ' : ''
    const sentence = q.replace('{NP}', `${before}___ ${np.nouns[0]}`)
    const stemAdj = np.adj.slice(0, np.adj.length - ADJ_END[np.type][f.k][g].length)
    const typeName = { der: 'der-Wort', ein: 'ein-Wort', null: 'ohne Artikel' }[np.type]
    const reason = adjReason(np.type, f.k, g)
    const wrongReasons = [adjReason(np.type === 'der' ? 'ein' : 'der', f.k, g), adjReason(np.type, f.k === 'A' ? 'D' : 'A', g), adjReason(np.type === 'null' ? 'der' : 'null', f.k, g)]
      .filter((r) => r !== reason)
    const capNoDet = start && !np.det
    const ans = capNoDet ? cap(np.adj) : np.adj
    return item('adj', [n.sg, det, adj, f.q, plural].join('|'), {
      t: rnd() < 0.35 ? 'mc' : 'gap', q: sentence, h: `(${adj})`, a: ans,
      o: uniq(['e', 'en', 'er', 'es', 'em'].map((e) => (capNoDet ? cap(stemAdj) : stemAdj) + e)),
      y: [reason, ...wrongReasons.slice(0, 2)], s: `adj.${typeName}.${f.k}.${g}`,
      r: `${typeName}, ${CASE_NAME[f.k]} ${GENDER_NAME[g]} → ${np.text}. ${reason}.`,
      re: 'English adjectives never change ("the new law", "a new law"). In German the ending depends on the article type, case and gender.',
    })
  }
  return adjEnding(rnd, opts)
}

// ---------- Comparison ----------
export function comparison(rnd) {
  const a = pick(rnd, adjectives.filter((x) => !['viel', 'wenig'].includes(x.pos) || rnd() < 0.5))
  const sup = rnd() < 0.5
  const ans = sup ? `am ${a.sup}en` : a.comp
  return item('komp', a.pos + sup, {
    t: 'gap', q: `${a.pos} → ${sup ? 'Superlativ: ___' : 'Komparativ: ___'}`, a: ans, h: sup ? '(am …)' : '(…er)',
    s: sup ? 'komp.sup' : 'komp.comp', r: `${a.pos} – ${a.comp} – am ${a.sup}en`,
    re: 'Like English -er/-est, but many short adjectives add an umlaut (alt → älter) and there is no "more/most" construction.',
  })
}

// ---------- Verbs ----------
const SUBJ = [['ich', 0], ['du', 1], ['er', 2], ['sie (Singular)', 2], ['man', 2], ['wir', 3], ['ihr', 4], ['sie (Plural)', 5], ['Sie (höflich)', 5]]
export function present(rnd) {
  const v = pick(rnd, verbs)
  const [s, i] = pick(rnd, SUBJ)
  return item('praes', v.inf + s, {
    t: 'gap', q: `${s} + ${v.inf} → ___`, a: v.forms[i], h: v.sep ? '(trennbar!)' : `(${v.en})`, s: v.sep ? 'verb.trennbar' : /[äöüi]/.test(v.forms[2]) && !/[äöüi]/.test(v.inf) ? 'verb.stammwechsel' : 'verb.praesens',
    r: `${v.inf}: ich ${v.forms[0]}, du ${v.forms[1]}, er ${v.forms[2]}, wir ${v.forms[3]}, ihr ${v.forms[4]}, sie ${v.forms[5]}.`,
    re: 'German verbs have an ending for every person. Some change the vowel in du/er (lesen → liest), and separable verbs send the prefix to the end.',
  })
}
const AUX = { h: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'], s: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'] }
export function perfect(rnd) {
  const v = pick(rnd, verbs.filter((x) => !['können', 'müssen', 'dürfen', 'sollen', 'wollen', 'mögen'].includes(x.inf)))
  const [s, i] = pick(rnd, SUBJ)
  const aux = AUX[v.aux][i]
  return item('perf', v.inf + s, {
    t: 'gap', q: `${s} + ${v.inf} (Perfekt) → ${s.split(' ')[0]} ___ … ___`, a: [aux, v.p2], o: [aux, AUX[v.aux === 'h' ? 's' : 'h'][i]],
    y: [v.aux === 's' ? 'sein: Bewegung/Veränderung (gehen, fahren, werden …) oder bleiben/sein' : 'haben: die meisten Verben (auch mit Objekt)', v.aux === 's' ? 'haben: die meisten Verben' : 'sein: Bewegung oder Veränderung', 'immer haben'],
    s: 'perf.' + v.aux, r: `${v.inf} → ${v.aux === 's' ? 'ist' : 'hat'} ${v.p2}.`,
    re: 'English always uses "have". German uses "sein" for movement or change of state (ich bin gefahren, er ist gewachsen) and for sein/bleiben.',
  })
}
export function preterite(rnd) {
  const v = pick(rnd, verbs)
  const pl = rnd() < 0.4
  const parts = v.prt.split(' ')
  const plForm = [parts[0] + (parts[0].endsWith('e') ? 'n' : 'en'), ...parts.slice(1)].join(' ')
  return item('praet', v.inf + pl, {
    t: 'gap', q: `${pl ? 'wir' : 'er'} + ${v.inf} (Präteritum) → ___`, a: pl ? plForm : v.prt, h: `(${v.en})`, s: 'verb.praet',
    r: `${v.inf} – ${v.prt} – ${v.aux === 's' ? 'ist' : 'hat'} ${v.p2}`, re: 'The Präteritum is the written past tense (in stories, reports). Irregular verbs change the stem: gehen → ging.',
  })
}

// ---------- Prepositions ----------
const PREP_CASE_NAME = { A: 'Akkusativ', D: 'Dativ', G: 'Genitiv', W: 'Wechselpräposition (wo? Dativ / wohin? Akkusativ)' }
export function prepCase(rnd) {
  const kind = pick(rnd, ['A', 'D', 'G', 'W'])
  const p = pick(rnd, PREPS[kind])
  return item('prepcase', p, {
    t: 'mc', q: `„${p}“ steht mit …`, o: ['Akkusativ', 'Dativ', 'Genitiv', 'Wechselpräposition (wo? Dativ / wohin? Akkusativ)'], a: PREP_CASE_NAME[kind], keepOrder: true,
    s: `prep.${kind}`, r: `${p} + ${PREP_CASE_NAME[kind]}. Akkusativ: durch, für, gegen, ohne, um. Dativ: aus, bei, mit, nach, seit, von, zu.`,
    re: 'English prepositions don\'t change the noun. In German each preposition decides the case.',
  })
}
export function prepMatch(rnd) {
  const kinds = ['A', 'D', 'G', 'A', 'D'].sort(() => rnd() - 0.5).slice(0, 4)
  const used = new Set()
  const pairsOut = kinds.map((k) => {
    let p
    do p = pick(rnd, PREPS[k]); while (used.has(p))
    used.add(p)
    return [p, { A: 'Akkusativ', D: 'Dativ', G: 'Genitiv' }[k]]
  })
  return item('prepmatch', pairsOut.flat().join(), { t: 'match', q: 'Verbinde: Präposition → Fall', pairs: pairsOut, s: 'prep.match', r: 'Akk: durch, für, gegen, ohne, um · Dat: aus, bei, mit, nach, seit, von, zu · Gen: wegen, trotz, während, aufgrund', re: 'Learn the prepositions in their case groups.' })
}
const PLACES = ['Stadt', 'Schule', 'Klasse', 'Wohnung', 'Krankenhaus', 'Museum', 'Theater', 'Hotel', 'Restaurant', 'Supermarkt', 'Klassenzimmer', 'Kaffeehaus', 'Bank', 'Zentrum', 'Parlament', 'Gemeinde', 'Fabrik', 'Dorf']
const WO = [
  { q: 'Ich wohne ___ {N}.', k: 'D', ok: ['Stadt', 'Wohnung', 'Dorf', 'Zentrum', 'Gemeinde'] },
  { q: 'Wir treffen uns ___ {N}.', k: 'D' },
  { q: 'Am Montag gehe ich ___ {N}.', k: 'A' },
  { q: 'Nach dem Unterricht fahren wir ___ {N}.', k: 'A' },
  { q: 'Die Schüler warten ___ {N}.', k: 'D' },
  { q: 'Die Demonstranten laufen ___ {N}.', k: 'A' },
]
const CONTRACT = { 'in dem': 'im', 'in das': 'ins' }
export function wechsel(rnd) {
  const f = pick(rnd, WO)
  const sg = pick(rnd, f.ok || PLACES)
  const n = nouns.find((x) => x.sg === sg)
  const full = `in ${def(f.k, n.g)}`
  const ans = CONTRACT[full] || full
  const otherK = f.k === 'D' ? 'A' : 'D'
  const other = CONTRACT[`in ${def(otherK, n.g)}`] || `in ${def(otherK, n.g)}`
  const q = f.q.replace('{N}', n.sg)
  return item('wechsel', f.q + sg, {
    t: rnd() < 0.6 ? 'mc' : 'gap', q, o: uniq([ans, other, 'in die', 'in der', 'im', 'ins']).slice(0, 4), a: ans, h: `(${ART[n.g]} ${n.sg})`,
    y: [f.k === 'D' ? 'wo? → Dativ (Position)' : 'wohin? → Akkusativ (Richtung)', f.k === 'D' ? 'wohin? → Akkusativ (Richtung)' : 'wo? → Dativ (Position)', '„in“ immer mit Dativ'],
    s: `wechsel.${f.k}`, r: `Wechselpräposition: wo? → Dativ (in der / im), wohin? → Akkusativ (in die / ins). Hier: ${f.k === 'D' ? 'wo' : 'wohin'}? → ${ans}. (in + dem = im, in + das = ins)`,
    re: 'English: "in the city" vs "into the city". German: "in der Stadt" (where? dative) vs "in die Stadt" (where to? accusative).',
  })
}

// ---------- Verbs with prepositions, da-/wo-words ----------
export function verbPrep(rnd) {
  const vp = pick(rnd, verbPreps.filter((x) => new RegExp(`(^|\\s)${x.prep}(\\s|$)`, 'i').test(x.ex.replace(/[.,]/g, ''))))
  const toks = vp.ex.split(' ')
  const i = toks.findIndex((t) => t.toLowerCase() === vp.prep)
  const q = toks.map((t, j) => (j === i ? '___' : t)).join(' ')
  const ans = i === 0 ? vp.prep.charAt(0).toUpperCase() + vp.prep.slice(1) : vp.prep
  const others = uniq(['auf', 'an', 'für', 'mit', 'von', 'über', 'um', 'zu', 'vor', 'nach'].filter((p) => p !== vp.prep)).sort(() => rnd() - 0.5).slice(0, 3)
  const caseName = vp.kase === 'A' ? 'Akkusativ' : 'Dativ'
  const other = vp.kase === 'A' ? 'Dativ' : 'Akkusativ'
  return item('verbprep', vp.ex, {
    t: rnd() < 0.5 ? 'mc' : 'gap', q, o: [ans, ...others], a: ans, h: `(${vp.verb})`,
    y: [`${vp.prep} + ${caseName}`, `${vp.prep} + ${other}`, `${vp.prep} + Genitiv`], s: `vprep.${vp.kase}`,
    r: `${vp.verb} ${vp.prep} + ${caseName} (${vp.en}).`, re: `"${vp.en}": the German preposition is fixed and often different from English. Learn verb + preposition + case as one block.`,
  })
}
export function verbPrepMatch(rnd) {
  const list = [...verbPreps].sort(() => rnd() - 0.5)
  const chosen = []
  const preps = new Set()
  for (const v of list) {
    if (preps.has(v.prep)) continue
    preps.add(v.prep); chosen.push(v)
    if (chosen.length === 4) break
  }
  return item('vpmatch', chosen.map((c) => c.verb).join(), { t: 'match', q: 'Welche Präposition gehört zum Verb?', pairs: chosen.map((c) => [c.verb, c.prep]), s: 'vprep.match', r: chosen.map((c) => `${c.verb} ${c.prep} + ${c.kase === 'A' ? 'Akk' : 'Dat'}`).join(' · '), re: 'Fixed prepositions: learn them as pairs.' })
}
export function daWo(rnd) {
  const vp = pick(rnd, verbPreps)
  const da = rnd() < 0.5
  const w = da ? daWord(vp.prep) : cap(woWord(vp.prep))
  return item('dawo', vp.verb + da, {
    t: 'gap', q: da ? `Da-Wort zu „${vp.verb} ${vp.prep}“: ___` : `Fragewort zu „${vp.verb} ${vp.prep}“ (nach einer Sache): ___ …?`,
    a: w, h: da ? '(da- / dar-)' : '(wo- / wor-)', s: 'dawo',
    r: `${vp.prep} → ${daWord(vp.prep)} / ${woWord(vp.prep)}. Beginnt die Präposition mit einem Vokal, kommt ein -r- dazu (darauf, worüber).`,
    re: 'English "about it" / "what … about?": German fuses them into one word: darüber, worüber. Only for things, not for people.',
  })
}

// ---------- Word order: V2 and Nebensatz ----------
export function v2Front(rnd) {
  const c = pick(rnd, clauses)
  const front = pick(rnd, FRONTS)
  const right = `${front} ${inverted(c)}.`
  const wrong = `${front}, ${mainClause(c)}.`
  const kind = rnd()
  if (kind < 0.35) {
    return item('v2', front + c.subj + c.mid, {
      t: 'mc', q: 'Welcher Satz ist richtig?', o: [right, wrong], a: right,
      y: ['Verb an Position 2: nach dem ersten Satzglied kommt sofort das Verb', 'Nach einem Adverbial kommt ein Beistrich', 'Das Subjekt steht immer an Position 1'],
      s: 'wortstellung.v2', c: 'S', r: `Im Hauptsatz steht das Verb an Position 2. Wenn „${front}“ vorne steht, kommt das Subjekt nach dem Verb. Kein Beistrich!`,
      re: 'English: "On the other hand, all students have…". German: the verb must be second, so the subject moves behind it, with no comma.',
    })
  }
  if (kind < 0.7) {
    return item('v2o', front + c.subj + c.mid, {
      t: 'order', q: 'Bilde den Satz. Beginne mit dem Adverbial.', chunks: [front, ...invertedChunks(c)], a: right, acc: [`${front} ${invertedAlt(c)}.`], first: front,
      s: 'wortstellung.v2', c: 'S', r: `Position 1: „${front}“ → Position 2: Verb (${c.fin}) → dann das Subjekt.`, re: 'Verb second: whatever comes first, the verb follows immediately.',
    })
  }
  return item('v2t', front + c.subj + c.mid, {
    t: 'tf', q: `Beginne mit „${front}“:\n${cap(mainClause(c))}.`, a: right, acc: [`${front} ${invertedAlt(c)}.`],
    s: 'wortstellung.v2', c: 'S', r: `Nach „${front}“: Verb an Position 2, dann das Subjekt.`, re: 'Verb second, then the subject. No comma after the fronted phrase.',
  })
}

export function dassClause(rnd) {
  const c = pick(rnd, clauses)
  const intro = pick(rnd, DASS_INTROS)
  const right = `${intro}, dass ${subClause(c)}.`
  const wrong = `${intro}, dass ${englishOrder(c)}.`
  const kind = rnd()
  const base = { s: 'wortstellung.ns', c: 'S', r: `Nach „dass“ wandert das konjugierte Verb („${c.fin}“) ans Ende. Vor „dass“ steht ein Beistrich.`, re: 'English keeps "that it is hard". German sends the verb to the end: "dass es schwer ist". Comma before dass.' }
  if (kind < 0.3 && wrong !== right) return item('dassmc', intro + c.subj + c.mid, { ...base, t: 'mc', q: 'Welcher Satz ist richtig?', o: [right, wrong], a: right, y: ['„dass“ leitet einen Nebensatz ein → Verb ans Ende', 'Nach „dass“ steht das Verb an Position 2', 'Das Verb steht immer nach dem Subjekt'] })
  if (kind < 0.65) return item('dasso', intro + c.subj + c.mid, { ...base, t: 'order', q: 'Bilde den Satz.', chunks: [intro, ',', 'dass', ...chunksSub(c)], a: right, first: intro })
  return item('dasst', intro + c.subj + c.mid, { ...base, t: 'tf', q: `Verbinde mit „${intro}, dass …“:\n${cap(mainClause(c))}.`, a: right })
}
export function obClause(rnd) {
  const c = pick(rnd, clauses)
  const intro = pick(rnd, OB_INTROS)
  const right = `${intro}, ob ${subClause(c)}.`
  return item('ob', intro + c.subj + c.mid, {
    t: rnd() < 0.5 ? 'order' : 'tf', q: `Verbinde mit „${intro}, ob …“:\n${cap(mainClause(c))}.`, chunks: [intro, ',', 'ob', ...chunksSub(c)], a: right, first: intro,
    s: 'wortstellung.ns', c: 'S', r: '„ob“ (= whether) leitet einen Nebensatz ein: Beistrich davor, Verb ans Ende.', re: '"ob" = whether/if (indirect yes/no question). Comma before it, verb at the end.',
  })
}

const CONJ = {
  weil: { set: 'CAUSE', en: 'because', r: '„weil“ nennt einen Grund. Nebensatz → Verb am Ende, Beistrich davor.' },
  da: { set: 'CAUSE', en: 'since/as', r: '„da“ nennt einen bekannten Grund. Nebensatz → Verb am Ende.' },
  obwohl: { set: 'CONTRAST', en: 'although', r: '„obwohl“ nennt einen Gegengrund. Nebensatz → Verb am Ende.' },
  wenn: { set: 'CONDITION', en: 'if/when', r: '„wenn“ nennt eine Bedingung. Nebensatz → Verb am Ende.' },
  falls: { set: 'CONDITION', en: 'in case/if', r: '„falls“ = wenn (Bedingung). Nebensatz → Verb am Ende.' },
}
const isPron = (c) => /^(sie|er|es|ich|wir|du|ihr)$/.test(c.subj) && !(c.subj === 'es' && c.fin === 'gibt')
export function conjClause(rnd, opts = {}) {
  const conj = opts.conj || pick(rnd, Object.keys(CONJ))
  const info = CONJ[conj]
  const [a, b] = pick(rnd, pairs[info.set])
  const right = `${cap(mainClause(a))}, ${conj} ${subClause(b)}.`
  const nsFirstOk = !isPron(b)
  const front = `${cap(conj)} ${subClause(b)}, ${inverted(a)}.`
  const frontAlt = `${cap(conj)} ${subClause(b)}, ${invertedAlt(a)}.`
  const kind = rnd()
  const base = { s: `ns.${conj}`, c: 'S', r: info.r, re: `"${info.en}": in English the word order stays the same. In German the verb goes to the end of the ${conj}-clause.` }
  const key = conj + a.subj + b.subj
  if (kind < 0.25) return item('conjt', key, { ...base, t: 'tf', q: `Verbinde mit „${conj}“:\n${cap(mainClause(a))}. ${cap(mainClause(b))}.`, a: right })
  if (kind < 0.5) return item('conjo', key, { ...base, t: 'order', q: `Verbinde mit „${conj}“.`, chunks: [...chunksMain(a).map((x, i) => (i === 0 ? cap(x) : x)), ',', conj, ...chunksSub(b)], a: right, first: cap(a.subj) })
  if (kind < 0.75 && nsFirstOk) {
    return item('conjf', key, {
      ...base, t: rnd() < 0.5 ? 'order' : 'tf', q: `Beginne mit „${cap(conj)} …“:\n${cap(mainClause(a))}, ${conj} ${subClause(b)}.`,
      chunks: [cap(conj), ...chunksSub(b), ',', ...invertedChunks(a)], a: front, acc: [frontAlt], first: cap(conj),
      s: 'wortstellung.verbverb', r: 'Steht der Nebensatz vorne, ist er Position 1. Dann kommt sofort das Verb des Hauptsatzes: „…, Verb, Verb …“.',
      re: 'If the subordinate clause comes first, it counts as position 1, so the main-clause verb comes right after the comma: "Weil …, sind viele …".',
    })
  }
  const wrong = `${cap(mainClause(a))}, ${conj} ${englishOrder(b)}.`
  if (wrong === right) return conjClause(rnd, opts)
  return item('conjmc', key, { ...base, t: 'mc', q: 'Welcher Satz ist richtig?', o: [right, wrong], a: right, y: [`„${conj}“ → Nebensatz → Verb ans Ende`, `„${conj}“ → Hauptsatz → Verb an Position 2`, 'Im Nebensatz steht das Verb nach dem Subjekt'] })
}
// deshalb / trotzdem / darum: main-clause connectors (verb second)
export function adverbConnector(rnd) {
  const useCause = rnd() < 0.6
  const list = (useCause ? pairs.CAUSE : pairs.CONTRAST).filter(([, b]) => !isPron(b))
  const [a, b] = pick(rnd, list)
  const word = useCause ? pick(rnd, ['Deshalb', 'Darum', 'Daher']) : pick(rnd, ['Trotzdem', 'Dennoch'])
  const right = `${cap(mainClause(b))}. ${word} ${inverted(a)}.`
  const wrong = `${cap(mainClause(b))}. ${word} ${mainClause(a)}.`
  return item('advconn', word + a.subj + b.subj, {
    t: rnd() < 0.5 ? 'mc' : 'tf', q: rnd() < 0.5 ? 'Welcher Text ist richtig?' : `Verbinde mit „${word}“:\n${cap(mainClause(b))}. ${cap(mainClause(a))}.`,
    o: [right, wrong], a: right, acc: [`${cap(mainClause(b))}. ${word} ${invertedAlt(a)}.`],
    y: [`„${word}“ ist ein Adverb auf Position 1 → Verb an Position 2`, `„${word}“ leitet einen Nebensatz ein → Verb ans Ende`, `Nach „${word}“ steht das Subjekt`],
    s: 'konnektor.adverb', c: 'S', r: `„${word}“ steht auf Position 1 im Hauptsatz – dann kommt sofort das Verb (${a.fin}).`,
    re: `English "${useCause ? 'therefore' : 'nevertheless'}, they are…" keeps subject-verb. German: ${word} + verb + subject.`,
  })
}

// ---------- Commas ----------
export function commaItem(rnd) {
  const k = Math.floor(rnd() * 7)
  let a, s, r, re
  if (k === 0) { const c = pick(rnd, clauses); a = `${pick(rnd, DASS_INTROS)}, dass ${subClause(c)}.`; s = 'komma.dass'; r = 'Vor „dass“ steht immer ein Beistrich.'; re = 'Always a comma before dass. English never puts one before "that".' }
  else if (k === 1) { const [x, y] = pick(rnd, pairs.CAUSE); a = `${cap(mainClause(x))}, weil ${subClause(y)}.`; s = 'komma.ns'; r = 'Haupt- und Nebensatz werden durch Beistrich getrennt (weil, obwohl, wenn, da …).'; re = 'Main and subordinate clauses are always separated by a comma.' }
  else if (k === 2) { const [x, y] = pick(rnd, pairs.CONDITION); a = `Wenn ${subClause(y)}, ${inverted(x)}.`; s = 'komma.ns'; r = 'Steht der Nebensatz vorne, kommt der Beistrich zwischen den beiden Verben.'; re = 'Subordinate clause first → comma between the two verbs.' }
  else if (k === 3) { const intro = pick(rnd, INF_INTROS); const grp = pick(rnd, INF_GROUPS.filter((g) => !g.r || intro.imp)); a = `${intro.t}, ${grp.t}.`; s = 'komma.inf'; r = 'Vor einer Infinitivgruppe mit „zu“, die von einem Nomen/Adjektiv/„es“/„darauf“ abhängt, steht ein Beistrich.'; re = 'German needs a comma before an infinitive group with zu after "es ist wichtig", "es kommt darauf an" etc.' }
  else if (k === 4) { const c = pick(rnd, clauses); a = `${pick(rnd, OB_INTROS)}, ob ${subClause(c)}.`; s = 'komma.ob'; r = 'Vor „ob“ steht immer ein Beistrich.'; re = 'Always a comma before "ob".' }
  else if (k === 5) { const n = pick(rnd, COUNT.filter((x) => !x.person)); const g = n.g; const rel = { m: 'den', f: 'die', n: 'das' }[g]; a = `${cap(def('N', g))} ${n.sg}, ${rel} wir heute besprechen, ist wichtig.`; s = 'komma.rel'; r = 'Ein Relativsatz wird vorne und hinten mit Beistrich abgetrennt.'; re = 'A relative clause gets commas on both sides, even where English would have none.' }
  else { const [x, y] = pick(rnd, pairs.CONTRAST); a = `${cap(mainClause(x))}, obwohl ${subClause(y)}.`; s = 'komma.ns'; r = 'Vor „obwohl“ steht ein Beistrich.'; re = 'Comma before obwohl.' }
  return item('komma', a, { t: 'komma', q: 'Setze die fehlenden Beistriche.', a, s, c: 'B', r, re })
}

function infChunks(t) {
  const w = t.split(' ')
  const last = w.pop()
  if (w[w.length - 1] === 'zu') { w.pop(); return [w.join(' '), 'zu', last].filter(Boolean) }
  return [w.join(' '), last].filter(Boolean)
}
export function infZu(rnd) {
  const intro = pick(rnd, INF_INTROS)
  const grp = pick(rnd, INF_GROUPS.filter((g) => !g.r || intro.imp))
  const right = `${intro.t}, ${grp.t}.`
  const words = grp.t.split(' ')
  const kind = rnd()
  if (kind < 0.5) {
    const wrong = `${intro.t} ${grp.t}.`
    const wrong2 = `${intro.t}, ${grp.t.replace(/ zu (\S+)$/, ' $1').replace(/(\S+)zu(\S+)$/, '$1$2')}.`
    return item('infzu', intro.t + grp.t, {
      t: 'mc', q: 'Welcher Satz ist richtig?', o: uniq([right, wrong, wrong2]), a: right, s: 'komma.inf', c: 'B',
      r: 'Infinitivgruppe: „zu“ + Infinitiv am Ende, bei trennbaren Verben in der Mitte (vorzubereiten). Beistrich davor.',
      re: 'zu + infinitive goes at the end; with separable verbs zu goes inside (vorzubereiten). Comma before the group.',
    })
  }
  return item('infzuo', intro.t + grp.t, {
    t: 'order', q: 'Bilde den Satz.', chunks: [intro.t, ',', ...infChunks(grp.t)], a: right, first: intro.t, s: 'inf.zu', c: 'S',
    r: 'Das Verb mit „zu“ steht am Ende der Infinitivgruppe.', re: 'English "to + verb" comes first; German puts "zu + verb" at the very end.',
  })
}

// ---------- Relative clauses ----------
const REL = { N: { m: 'der', f: 'die', n: 'das', pl: 'die' }, A: { m: 'den', f: 'die', n: 'das', pl: 'die' }, D: { m: 'dem', f: 'der', n: 'dem', pl: 'denen' }, G: { m: 'dessen', f: 'deren', n: 'dessen', pl: 'deren' } }
const REL_FRAMES = {
  thing: [
    { k: 'N', q: 'Wir sprechen über {NP}, ___ in der Zeitung erwähnt {wird}.' },
    { k: 'A', q: 'Wir sprechen über {NP}, ___ viele Menschen kritisieren.' },
    { k: 'D', q: 'Wir sprechen über {NP}, mit ___ sich die Klasse beschäftigt.' },
    { k: 'G', q: 'Wir sprechen über {NP}, ___ Bedeutung oft unterschätzt wird.' },
  ],
  person: [
    { k: 'N', q: 'Ich kenne {NP}, ___ in der Zeitung erwähnt {wird}.' },
    { k: 'A', q: 'Ich kenne {NP}, ___ die Zeitung interviewt hat.' },
    { k: 'D', q: 'Ich kenne {NP}, ___ wir vertrauen.' },
    { k: 'G', q: 'Ich kenne {NP}, ___ Meinung oft ignoriert wird.' },
  ],
}
export function relative(rnd) {
  const n = pick(rnd, nouns.filter((x) => !x.mass && x.sg !== 'Herr'))
  const f = pick(rnd, n.person ? REL_FRAMES.person : REL_FRAMES.thing)
  const plural = !!n.pl && rnd() < 0.35
  const g = plural ? 'pl' : n.g
  const np = nounPhrase({ det: 'der', noun: n, kase: 'A', plural })
  const q = f.q.replace('{NP}', np.text).replace('{wird}', plural ? 'werden' : 'wird')
  const a = REL[f.k][g]
  const why = `Bezugswort ${GENDER_NAME[g]} (${ART[n.g]} ${n.sg}${plural ? ', Plural' : ''}) + Fall im Relativsatz: ${CASE_NAME[f.k]}`
  return item('rel', n.sg + f.q + plural, {
    t: rnd() < 0.5 ? 'mc' : 'gap', q, o: uniq([a, 'der', 'die', 'das', 'den', 'dem', 'denen', 'dessen', 'deren']).slice(0, 5), a,
    y: [why, `Fall vom Bezugswort im Hauptsatz (Akkusativ)`, `Bezugswort ${GENDER_NAME[g === 'm' ? 'f' : 'm']} + ${CASE_NAME[f.k]}`],
    s: `rel.${f.k}`, r: `Genus/Zahl vom Bezugswort (${GENDER_NAME[g]}), Fall vom Verb oder der Präposition im Relativsatz (${CASE_NAME[f.k]}) → ${a}. Verb ans Ende!`,
    re: 'English "who/which/that" barely changes. German relative pronouns take gender/number from the noun and case from their own clause.',
  })
}

// ---------- das / dass ----------
export function dasDass(rnd) {
  const k = rnd()
  if (k < 0.45) {
    const c = pick(rnd, clauses)
    const intro = pick(rnd, DASS_INTROS)
    return item('dasdass', intro + c.subj, { t: 'mc', q: `${intro}, ___ ${subClause(c)}.`, o: ['dass', 'das'], a: 'dass', keepOrder: true, y: ['Konjunktion: kann nicht durch „welches/dieses“ ersetzt werden', 'Relativpronomen: = welches', 'Artikel vor einem Nomen'], s: 'rs.dasdass', c: 'R', r: '„dass“ ist eine Konjunktion (Nebensatz). Test: „welches“ oder „dieses“ passt nicht → dass.', re: '"dass" = that (conjunction). "das" = the / which / this. Test: if you can replace it with "welches" or "dieses", it is "das".' })
  }
  if (k < 0.8) {
    const n = pick(rnd, nouns.filter((x) => x.g === 'n' && !x.mass && !x.person))
    return item('dasdass', 'rel' + n.sg, { t: 'mc', q: `Das ${n.sg}, ___ wir heute besprechen, ist wichtig.`, o: ['dass', 'das'], a: 'das', keepOrder: true, y: ['Relativpronomen: = welches', 'Konjunktion: leitet einen dass-Satz ein', 'Artikel vor einem Nomen'], s: 'rs.dasdass', c: 'R', r: 'Hier ist „das“ ein Relativpronomen (= welches) für „das ' + n.sg + '“.', re: 'Relative pronoun for a neuter noun = "das" (which/that).' })
  }
  const n = pick(rnd, nouns.filter((x) => x.g === 'n' && !x.person))
  return item('dasdass', 'demo' + n.sg, { t: 'mc', q: `Ich glaube, ___ ${n.sg.toLowerCase() === n.sg ? n.sg : 'das ' + n.sg} wichtig ist.`, o: ['dass das', 'das dass', 'dass dass', 'das das'], a: 'dass das', y: ['erst Konjunktion (dass), dann Artikel (das)', 'erst Artikel, dann Konjunktion', 'zweimal Konjunktion'], s: 'rs.dasdass', c: 'R', r: `„dass“ leitet den Nebensatz ein, „das ${n.sg}“ ist der Artikel + Nomen.`, re: '"that the …" = "dass das …".' })
}

// ---------- Sprint helpers ----------
export function articleSprint(rnd) {
  return genus(rnd)
}

export const GENERATORS = {
  genus, pluralForm, pluralCase, articleCase, nounPhraseCase, nDekl, possessive, adjEnding, comparison,
  present, perfect, preterite, prepCase, prepMatch, wechsel, verbPrep, verbPrepMatch, daWo,
  v2Front, dassClause, obClause, conjClause, adverbConnector, commaItem, infZu, relative, dasDass,
  weil: (r) => conjClause(r, { conj: 'weil' }), obwohl: (r) => conjClause(r, { conj: 'obwohl' }), wenn: (r) => conjClause(r, { conj: 'wenn' }),
  ...C1_GENERATORS,
  adjDer: (r) => adjEnding(r, { det: 'der' }), adjEin: (r) => adjEnding(r, { det: pick(r, ['ein', 'kein', 'mein', 'unser']) }), adjNull: (r) => adjEnding(r, { det: pick(r, [null, 'viele']) }),
}

export function generate(name, rnd = Math.random) {
  const g = GENERATORS[name]
  if (!g) throw new Error('Unknown generator ' + name)
  return g(rnd)
}

export function rng(seed = Date.now()) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
