// C1 generators: Futur II / subjektive Modalverben, Partizipialattribute, Passiversatz, als ob, C1-Präpositionen, C1-Konnektoren.
// All sentence material is written out by hand; the generators only recombine it.

const pick = (rnd, arr) => arr[Math.floor(rnd() * arr.length)]
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
function idOf(name, key) {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return `g.${name}.${(h >>> 0).toString(36)}`
}
const item = (name, key, o) => ({ id: idOf(name, key), gen: name, ...o })

// ---------- Perfekt sentences → Futur II (Vermutung) and subjektive Modalverben ----------
// subject | sg/pl | aux (h/s) | middle | participle | English
const PAST = `
sie|sg|h|den Bus|verpasst|she has missed the bus
er|sg|h|die Angabe nicht genau|gelesen|he hasn't read the task carefully
die Lehrerin|sg|h|die Texte schon|korrigiert|the teacher has already corrected the texts
die Schüler|pl|h|zu wenig|geschlafen|the students have slept too little
der Zug|sg|s|schon|abgefahren|the train has already left
die Touristen|pl|s|mit dem Bus|gekommen|the tourists have come by bus
die Regierung|sg|h|das Problem|unterschätzt|the government has underestimated the problem
viele|pl|h|die Nachricht nicht|verstanden|many have not understood the message
die Preise|pl|s|stark|gestiegen|prices have risen sharply
er|sg|s|zu spät|aufgestanden|he got up too late
sie|pl|h|die Quelle nicht|geprüft|they have not checked the source
die Demonstration|sg|h|schon|begonnen|the demonstration has already started
der Autor|sg|h|den Artikel sehr schnell|geschrieben|the author wrote the article very quickly
die Firma|sg|h|viel Geld|verloren|the company has lost a lot of money
die Mieten|pl|s|im letzten Jahr|gestiegen|rents rose last year
sie|sg|s|nach Italien|geflogen|she has flown to Italy
die Stadt|sg|h|die Straße|gesperrt|the city has closed the road
das Handy|sg|h|ihn|abgelenkt|the phone has distracted him
`
const past = PAST.trim().split('\n').map((l) => {
  const [s, n, aux, mid, p2, en] = l.split('|')
  return { s, pl: n === 'pl', aux, mid, p2, en }
})
const auxInf = (p) => (p.aux === 's' ? 'sein' : 'haben')
const auxFin = (p) => (p.aux === 's' ? (p.pl ? 'sind' : 'ist') : p.pl ? 'haben' : 'hat')
const perfekt = (p) => `${cap(p.s)} ${auxFin(p)} ${p.mid} ${p.p2}.`
const futur2 = (p) => `${cap(p.s)} ${p.pl ? 'werden' : 'wird'} ${p.mid} ${p.p2} ${auxInf(p)}.`
const modalPast = (p, m) => `${cap(p.s)} ${m[p.pl ? 1 : 0]} ${p.mid} ${p.p2} ${auxInf(p)}.`
const MODALS = [
  { m: ['muss', 'müssen'], sense: 'ich bin mir fast sicher (≈ 90 %)', en: 'must have' },
  { m: ['dürfte', 'dürften'], sense: 'wahrscheinlich (≈ 75 %)', en: 'probably has' },
  { m: ['könnte', 'könnten'], sense: 'vielleicht (≈ 40 %)', en: 'might have' },
  { m: ['kann', 'können'], sense: 'es ist möglich', en: 'may have' },
  { m: ['soll', 'sollen'], sense: 'man sagt / es wird berichtet', en: 'is said to have' },
  { m: ['will', 'wollen'], sense: 'er/sie behauptet es selbst', en: 'claims to have' },
]

export function futurZwei(rnd) {
  const p = pick(rnd, past)
  const right = futur2(p)
  const kind = rnd()
  const base = {
    s: 'verb.futur2', c: 'G',
    r: `Futur II = werden + Partizip II + haben/sein. Drückt eine Vermutung über die Vergangenheit aus: „${right}“`,
    re: 'Futur II is mostly used for guesses about the past: "Sie wird den Bus verpasst haben" = she has probably missed the bus.',
  }
  if (kind < 0.5) return item('fut2', p.s + p.p2, { ...base, t: 'tf', q: `Drück eine Vermutung aus (Futur II):\n${perfekt(p)}`, a: right })
  const wrong1 = `${cap(p.s)} ${p.pl ? 'werden' : 'wird'} ${p.mid} ${auxInf(p)} ${p.p2}.`
  const wrong2 = `${cap(p.s)} ${p.pl ? 'werden' : 'wird'} ${p.mid} ${p.p2} ${p.aux === 's' ? 'haben' : 'sein'}.`
  return item('fut2mc', p.s + p.p2, { ...base, t: 'mc', q: `Vermutung (Futur II): „${p.en}“`, o: [right, wrong1, wrong2], a: right })
}

export function modalSubjektiv(rnd) {
  const p = pick(rnd, past)
  const m = pick(rnd, MODALS)
  const right = modalPast(p, m.m)
  const kind = rnd()
  const others = MODALS.filter((x) => x !== m).sort(() => rnd() - 0.5).slice(0, 2)
  const base = {
    s: 'verb.modalsubj', c: 'G',
    r: `Subjektive Modalverben + Infinitiv Perfekt (Partizip + haben/sein): ${m.m[0]} … ${p.p2} ${auxInf(p)} = ${m.sense}.`,
    re: `"${m.en} …": modal verb + past participle + haben/sein at the end. The modal shows how sure the speaker is.`,
  }
  if (kind < 0.5) {
    return item('modsubj', p.s + p.p2 + m.m[0], { ...base, t: 'tf', q: `Schreib mit „${m.m[0]}“ (${m.sense}):\n${perfekt(p)}`, a: right })
  }
  return item('modsubjmc', p.s + p.p2 + m.m[0], {
    ...base, t: 'mc', q: `„${right}“\nWas bedeutet „${m.m[p.pl ? 1 : 0]}“ hier?`, o: [m.sense, ...others.map((o) => o.sense)], a: m.sense,
  })
}

// ---------- Partizipialattribute (extended participle phrases) ----------
// noun phrase in the nominative | relative clause | participle attribute
const PART = `
die Reform|die im Parlament beschlossen wurde|die im Parlament beschlossene Reform
der Artikel|der gestern veröffentlicht wurde|der gestern veröffentlichte Artikel
die Schüler|die vor dem Ministerium protestieren|die vor dem Ministerium protestierenden Schüler
die Preise|die seit Jahren steigen|die seit Jahren steigenden Preise
das Problem|das von vielen unterschätzt wird|das von vielen unterschätzte Problem
die Touristen|die täglich ankommen|die täglich ankommenden Touristen
der Müll|der am Strand zurückgelassen wurde|der am Strand zurückgelassene Müll
die Jugendlichen|die sich politisch engagieren|die sich politisch engagierenden Jugendlichen
die Studie|die im Herbst erschienen ist|die im Herbst erschienene Studie
das Gesetz|das seit Jänner gilt|das seit Jänner geltende Gesetz
die Maßnahmen|die von der Regierung geplant werden|die von der Regierung geplanten Maßnahmen
die Lehrkräfte|die fehlen|die fehlenden Lehrkräfte
die Mieten|die stark gestiegen sind|die stark gestiegenen Mieten
der Verkehr|der ständig zunimmt|der ständig zunehmende Verkehr
die Diskussion|die in den Medien geführt wird|die in den Medien geführte Diskussion
die Argumente|die oft wiederholt werden|die oft wiederholten Argumente
die Kinder|die in Zelten lernen|die in Zelten lernenden Kinder
der Zug|der verspätet angekommen ist|der verspätet angekommene Zug
die Fotos|die in den sozialen Medien geteilt werden|die in den sozialen Medien geteilten Fotos
die Altstadt|die von Touristen überfüllt ist|die von Touristen überfüllte Altstadt
`
export const partData = PART.trim().split('\n').map((l) => {
  const [np, rel, attr] = l.split('|')
  return { np, rel, attr }
})
export function partizipAttribut(rnd) {
  const d = pick(rnd, partData)
  const toAttr = rnd() < 0.6
  const relFull = `${d.np}, ${d.rel}`
  const w = d.attr.split(' ')
  const isPresent = /end(e|en|er|es)$/.test(w[w.length - 2])
  const base = {
    s: 'part.attr', c: 'G',
    r: `Partizipialattribut: Aktiv/gleichzeitig → Partizip I (-end + Endung), Passiv/abgeschlossen → Partizip II (+ Endung). Alles aus dem Relativsatz steht zwischen Artikel und Nomen.`,
    re: 'German can pack a whole relative clause between the article and the noun: "die im Parlament beschlossene Reform" = the reform (which was) passed in parliament.',
  }
  if (toAttr) return item('partattr', d.attr, { ...base, t: 'tf', q: `Mach daraus ein Partizipialattribut:\n${cap(relFull)}`, a: cap(d.attr), h: isPresent ? '(Partizip I: -end-)' : '(Partizip II)' })
  return item('partrel', d.attr, { ...base, t: 'tf', q: `Löse das Partizipialattribut in einen Relativsatz auf:\n${cap(d.attr)}`, a: cap(relFull) })
}

// ---------- Passiversatz ----------
// passive with können/müssen | alternatives (first = sein + zu)
const PASS = `
Das Problem kann gelöst werden.|Das Problem ist zu lösen.|Das Problem lässt sich lösen.|Das Problem ist lösbar.
Die Angabe muss genau gelesen werden.|Die Angabe ist genau zu lesen.
Der Müll kann leicht vermieden werden.|Der Müll ist leicht zu vermeiden.|Der Müll lässt sich leicht vermeiden.|Der Müll ist leicht vermeidbar.
Diese Frage kann nicht beantwortet werden.|Diese Frage ist nicht zu beantworten.|Diese Frage lässt sich nicht beantworten.|Diese Frage ist nicht beantwortbar.
Die Folgen können kaum vorhergesagt werden.|Die Folgen sind kaum vorherzusagen.|Die Folgen lassen sich kaum vorhersagen.|Die Folgen sind kaum vorhersagbar.
Die Regeln müssen eingehalten werden.|Die Regeln sind einzuhalten.
Der Text kann gut verstanden werden.|Der Text ist gut zu verstehen.|Der Text lässt sich gut verstehen.|Der Text ist gut verständlich.
Die Kosten können nicht bezahlt werden.|Die Kosten sind nicht zu bezahlen.|Die Kosten lassen sich nicht bezahlen.|Die Kosten sind nicht bezahlbar.
Der Fehler kann leicht erklärt werden.|Der Fehler ist leicht zu erklären.|Der Fehler lässt sich leicht erklären.|Der Fehler ist leicht erklärbar.
Der Massentourismus kann kaum begrenzt werden.|Der Massentourismus ist kaum zu begrenzen.|Der Massentourismus lässt sich kaum begrenzen.
Die Wohnung kann nicht mehr bezahlt werden.|Die Wohnung ist nicht mehr zu bezahlen.|Die Wohnung lässt sich nicht mehr bezahlen.|Die Wohnung ist nicht mehr bezahlbar.
Die Hausübung muss bis Freitag abgegeben werden.|Die Hausübung ist bis Freitag abzugeben.
Diese Entwicklung kann nicht aufgehalten werden.|Diese Entwicklung ist nicht aufzuhalten.|Diese Entwicklung lässt sich nicht aufhalten.|Diese Entwicklung ist nicht aufhaltbar.
Das Ergebnis kann nicht vorhergesehen werden.|Das Ergebnis ist nicht vorherzusehen.|Das Ergebnis lässt sich nicht vorhersehen.|Das Ergebnis ist nicht vorhersehbar.
`
export const passData = PASS.trim().split('\n').map((l) => {
  const [p, ...alts] = l.split('|')
  return { p, alts }
})
export function passivErsatz(rnd) {
  const d = pick(rnd, passData)
  const kind = rnd()
  const base = {
    s: 'passiv.ersatz', c: 'G',
    r: 'Passiversatz: kann/muss … werden → sein + zu + Infinitiv (ist zu lösen), sich lassen + Infinitiv (lässt sich lösen), Adjektiv auf -bar/-lich (lösbar). Trennbare Verben: zu in der Mitte (vorherzusagen).',
    re: 'Formal German avoids long passives: "ist zu lösen" (must/can be solved), "lässt sich lösen" (can be solved), "lösbar" (solvable).',
  }
  if (kind < 0.45) return item('passers', d.p, { ...base, t: 'tf', q: `Schreib mit „sein + zu“:\n${d.p}`, a: d.alts[0] })
  if (d.alts[1] && kind < 0.75) return item('passlassen', d.p, { ...base, t: 'tf', q: `Schreib mit „sich lassen“:\n${d.p}`, a: d.alts[1] })
  const noZu = d.alts[0].replace(/ zu (\S+)\.$/, ' $1.').replace(/(\S+?)zu(\S+)\.$/, '$1$2.')
  const haben = d.alts[0].replace(/ ist /, ' hat ').replace(/ sind /, ' haben ')
  const opts = [d.alts[0], noZu, haben].filter((v, i, a) => a.indexOf(v) === i)
  return item('passmc', d.p, { ...base, t: 'mc', q: `Welcher Satz bedeutet dasselbe?\n„${d.p}“`, o: opts, a: d.alts[0] })
}

// ---------- als ob / als wenn ----------
// main clause | clause content (subject | rest | Konj II verb)
const ALSOB = `
Er tut so,|er|alles|wüsste|he acts as if he knew everything
Sie sieht aus,|sie|die ganze Nacht nicht|geschlafen hätte|she looks as if she hadn't slept all night
Die Regierung handelt,|es|keinen Klimawandel|gäbe|the government acts as if there were no climate change
Viele leben,|die Erde|unendlich viele Ressourcen|hätte|many live as if the earth had unlimited resources
Er spricht so,|er|Experte|wäre|he talks as if he were an expert
Es klingt,|die Entscheidung|schon längst|gefallen wäre|it sounds as if the decision had long been made
Die Touristen benehmen sich,|ihnen|die Stadt|gehörte|the tourists behave as if the city belonged to them
Du schaust,|du|einen Geist|gesehen hättest|you look as if you had seen a ghost
`
const alsOb = ALSOB.trim().split('\n').map((l) => {
  const [main, s, mid, v, en] = l.split('|')
  return { main, s, mid, v, en }
})
export function alsObGen(rnd) {
  const d = pick(rnd, alsOb)
  const useOb = rnd() < 0.5
  const vw = d.v.split(' ')
  const finite = vw[vw.length - 1]
  const rest = vw.slice(0, -1).join(' ')
  const withOb = `${d.main} als ob ${d.s} ${d.mid} ${d.v}.`
  const withAls = `${d.main} als ${finite} ${d.s} ${d.mid}${rest ? ' ' + rest : ''}.`
  return item('alsob', d.main + useOb, {
    t: 'tf', q: `„${d.en}“\nSchreib mit „${useOb ? 'als ob' : 'als + Verb direkt danach'}“:\n${d.main} …`, a: useOb ? withOb : withAls,
    acc: useOb ? [`${d.main} als wenn ${d.s} ${d.mid} ${d.v}.`] : [],
    s: 'konj2.alsob', c: 'G',
    r: `Irrealer Vergleich: als ob/als wenn + Konjunktiv II (Verb am Ende) – oder „als“ + Konjunktiv II direkt danach. „${withAls}“`,
    re: '"as if" = als ob + Konjunktiv II at the end, or als + verb straight after: "als wüsste er alles".',
  })
}

// ---------- C1 prepositions ----------
// preposition | sentence | case | English | wrong options that clearly don't fit (meaning or case)
const PREPC1 = `
zufolge|Einer Studie ___ schlafen Jugendliche zu wenig.|Dativ, nachgestellt|according to|wegen,trotz,während
anhand|___ eines Beispiels möchte ich das erklären.|Genitiv|by means of / using|Ungeachtet,Infolge,Zugunsten
mithilfe|___ einer App lernen viele Schüler Vokabeln.|Genitiv|with the help of|Ungeachtet,Mangels,Zufolge
infolge|___ des Streiks fielen viele Züge aus.|Genitiv|as a result of|Zugunsten,Mithilfe,Anhand
hinsichtlich|___ der Kosten gibt es noch offene Fragen.|Genitiv|with regard to|Infolge,Mithilfe,Mangels
ungeachtet|___ aller Kritik hält die Regierung an ihrem Plan fest.|Genitiv|regardless of|Aufgrund,Anhand,Mithilfe
zugunsten|Die Gemeinde verzichtet ___ der Umwelt auf den Neubau.|Genitiv|in favour of|infolge,mangels,anhand
angesichts|___ der steigenden Mieten fordern viele eine Reform.|Genitiv|in view of|Ungeachtet,Mithilfe,Zugunsten
bezüglich|___ Ihrer Anfrage kann ich Folgendes sagen.|Genitiv|regarding|Infolge,Mangels,Ungeachtet
aufgrund|___ der hohen Nachfrage wurden mehr Züge eingesetzt.|Genitiv|due to|Ungeachtet,Mangels,Anhand
mangels|___ ausreichender Beweise wurde das Verfahren eingestellt.|Genitiv|for lack of|Mithilfe,Zugunsten,Anhand
seitens|___ der Schulleitung gab es keine Einwände.|Genitiv|on the part of|Mangels,Infolge,Mithilfe
entgegen|___ allen Erwartungen stiegen die Preise weiter.|Dativ|contrary to|Gemäß,Mithilfe,Anhand
gemäß|___ der Hausordnung sind Handys im Unterricht verboten.|Dativ|in accordance with|Entgegen,Mangels,Ungeachtet
`
const prepC1 = PREPC1.trim().split('\n').map((l) => {
  const [p, q, kase, en, wrong] = l.split('|')
  return { p, q, kase, en, wrong: wrong.split(',') }
})
const SYN = { hinsichtlich: ['bezüglich'], bezüglich: ['hinsichtlich'], aufgrund: ['infolge', 'wegen'], infolge: ['aufgrund', 'wegen'], mithilfe: ['mit Hilfe'], anhand: ['mithilfe'] }
export function prepC1Gen(rnd) {
  const d = pick(rnd, prepC1)
  const ans = d.q.startsWith('___') ? cap(d.p) : d.p
  const acc = (SYN[d.p] || []).map((x) => (d.q.startsWith('___') ? cap(x) : x))
  return item('prepc1', d.q, {
    t: rnd() < 0.5 ? 'mc' : 'gap', q: d.q, o: [ans, ...d.wrong], a: ans, acc, h: `(${d.en})`,
    y: [`${d.p} + ${d.kase}`, `${d.p} + Akkusativ`, `${d.p} + ${d.kase.startsWith('Genitiv') ? 'Dativ' : 'Genitiv'}`],
    s: 'prep.c1', c: 'A', r: `${d.p} (${d.en}) + ${d.kase}.`, re: `"${d.en}" in formal German: ${d.p} + ${d.kase.toLowerCase()}.`,
  })
}

// ---------- C1 connectors ----------
// connector | sentence | meaning | wrong options (clearly wrong in this sentence)
const KONN = `
indem|Man kann Müll vermeiden, ___ man Mehrwegflaschen verwendet.|Art und Weise (by …ing)|wohingegen,ohne dass,seitdem
sodass|Es regnete stark, ___ das Konzert abgesagt wurde.|Folge (so that / with the result that)|indem,wohingegen,sofern
zumal|Ich gehe heute nicht hin, ___ ich ohnehin müde bin.|zusätzlicher Grund (especially since)|indem,wohingegen,sodass
wohingegen|Die Städte wachsen, ___ viele Dörfer schrumpfen.|Gegensatz (whereas)|indem,zumal,sodass
ohne dass|Er hat das Handy benutzt, ___ es jemand bemerkt hat.|fehlende Folge (without anyone …)|indem,zumal,sofern
anstatt dass|___ die Regierung handelt, wird nur diskutiert.|Alternative (instead of)|Indem,Zumal,Sodass
sofern|Wir fahren mit dem Zug, ___ er pünktlich ist.|Bedingung (provided that)|wohingegen,ohne dass,sodass
je nachdem|___ wie das Wetter ist, gehen wir wandern oder ins Museum.|Abhängigkeit (depending on)|Indem,Zumal,Sodass
insofern als|Die Regel ist sinnvoll, ___ sie die Konzentration verbessert.|Einschränkung (insofar as)|ohne dass,anstatt dass,wohingegen
seitdem|___ es das Klimaticket gibt, fahren mehr Menschen mit dem Zug.|Zeitpunkt in der Vergangenheit bis jetzt (since)|Indem,Zumal,Ohne dass
solange|___ die Mieten so hoch sind, bleiben viele bei ihren Eltern.|Dauer/Bedingung (as long as)|Indem,Ohne dass,Wohingegen
`
const konn = KONN.trim().split('\n').map((l) => {
  const [k, q, sense, wrong] = l.split('|')
  return { k, q, sense, wrong: wrong.split(',') }
})
export function konnC1Gen(rnd) {
  const d = pick(rnd, konn)
  const ans = d.q.startsWith('___') ? cap(d.k) : d.k
  const otherSenses = konn.filter((x) => x !== d).sort(() => rnd() - 0.5).slice(0, 2).map((x) => `${d.k}: ${x.sense}`)
  return item('konnc1', d.q, {
    t: 'mc', q: d.q, o: [ans, ...d.wrong], a: ans,
    y: [`${d.k}: ${d.sense}`, ...otherSenses],
    s: 'konnektor.c1', c: 'S', r: `„${d.k}“ = ${d.sense}. Nebensatz → Verb am Ende, Beistrich davor.`,
    re: `"${d.k}" – ${d.sense}. It starts a subordinate clause: verb at the end.`,
  })
}

export const C1_GENERATORS = { futurZwei, modalSubjektiv, partizipAttribut, passivErsatz, alsOb: alsObGen, prepC1: prepC1Gen, konnC1: konnC1Gen }
