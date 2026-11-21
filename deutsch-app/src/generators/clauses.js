// Clause building blocks for word-order generators (V2, Nebensatz, Beistrich).
// A clause: subject | finite verb | middle field | verb end (infinitive, participle or separable particle) | flags
//   flag 'sep' = the end part is a separable particle (in a Nebensatz it joins the verb: ab + lenkt → ablenkt)
// Written mid-sentence (lowercase start unless a noun). Every clause works after "dass".
const CLAUSES = `
viele Jugendliche|verbringen|zu viel Zeit am Handy||
der Massentourismus|zerstört|die Natur in vielen Regionen||
die Schule|bereitet|die Schüler nicht gut auf das Leben|vor|sep
man|kann|im Internet fast alles|lernen|
soziale Medien|beeinflussen|die Meinung vieler Jugendlicher||
die Regierung|muss|mehr für den Klimaschutz|tun|
immer mehr Menschen|fliegen|in den Urlaub||
der Staat|sollte|die Bildung stärker|fördern|
alle Schüler|haben|heute Zugriff auf das Internet||
die Mieten|steigen|in Wien jedes Jahr||
viele Familien|können|sich keinen Urlaub mehr|leisten|
der öffentliche Verkehr|ist|in Österreich gut ausgebaut||
das Handy|lenkt|viele Schüler vom Lernen|ab|sep
die Klassen|sind|oft überfüllt||
Schulproteste|können|wirkliche Änderungen|bewirken|
es|ist|schwer|gewesen|
die Demonstranten|haben|vor dem Parlament|protestiert|
die Zeitung|hat|einen Artikel über das Handyverbot|veröffentlicht|
viele Lehrkräfte|fühlen|sich überlastet||
der Unterricht|fällt|wegen des Lehrermangels oft|aus|sep
die Wirtschaft|profitiert|stark vom Tourismus||
Jugendliche|lesen|kaum noch Zeitung||
Fake News|verbreiten|sich im Internet sehr schnell||
die Gemeinde|plant|einen neuen Radweg||
mein Argument|kann|zum Nachdenken|anregen|
die Lehrerin|hat|unsere Texte schon|korrigiert|
die Preise|sind|im letzten Jahr stark|gestiegen|
die Schüler|nehmen|an der Demonstration|teil|sep
das Thema|betrifft|die ganze Gesellschaft||
der Klimawandel|ist|eine große Herausforderung||
viele Menschen|teilen|ihre Urlaubsfotos in den sozialen Medien||
die Stadt|sollte|mehr Grünflächen|schaffen|
die Politik|nimmt|die Sorgen der Jugend nicht ernst||
das Fliegen|schadet|dem Klima||
Influencer|verdienen|mit Werbung viel Geld||
die Matura|wird|immer wichtiger||
der Staat|unterstützt|junge Familien zu wenig||
das Wahlalter|wurde|in Österreich auf 16 Jahre|gesenkt|
regionale Produkte|sind|oft teurer||
die Verantwortung|liegt|bei jedem Einzelnen||
`
export const clauses = CLAUSES.trim().split('\n').map((l) => {
  const [subj, fin, mid, end, flags] = l.split('|')
  return { subj, fin, mid, end, sep: (flags || '').includes('sep') }
})

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// Hauptsatz: S V M E
export const mainClause = (c) => [c.subj, c.fin, c.mid, c.end].filter(Boolean).join(' ')
// Inversion after a fronted element: V S M E
// (a reflexive "sich" moves in front of a noun subject: "Heute fühlen sich viele Lehrkräfte überlastet")
export const inverted = (c) => invertedChunks(c).join(' ')
export function invertedChunks(c) {
  if (c.mid.startsWith('sich ') && !/^(er|sie|es|man|wir|ich|du|ihr)$/.test(c.subj)) return [c.fin, 'sich', c.subj, c.mid.slice(5), c.end].filter(Boolean)
  return [c.fin, c.subj, c.mid, c.end].filter(Boolean)
}
// also correct, but less usual: "Heute fühlen viele Lehrkräfte sich überlastet"
export const invertedAlt = (c) => [c.fin, c.subj, c.mid, c.end].filter(Boolean).join(' ')
// Nebensatz: S M E V (separable particle joins the verb)
export function subClause(c) {
  if (c.sep) return [c.subj, c.mid, c.end + c.fin].filter(Boolean).join(' ')
  return [c.subj, c.mid, c.end, c.fin].filter(Boolean).join(' ')
}
// The wrong English-style order inside a Nebensatz ("dass es ist schwer")
export function englishOrder(c) {
  return [c.subj, c.fin, c.mid, c.end].filter(Boolean).join(' ')
}
export const chunksMain = (c) => [c.subj, c.fin, c.mid, c.end].filter(Boolean)
export function chunksSub(c) {
  if (c.sep) return [c.subj, c.mid, c.end + c.fin].filter(Boolean)
  return [c.subj, c.mid, c.end, c.fin].filter(Boolean)
}

// Openers for dass/ob clauses (always need a comma before the clause)
export const DASS_INTROS = [
  'Ich bin der Meinung', 'Viele glauben', 'Es ist klar', 'Ich finde', 'Studien zeigen', 'Man muss bedenken',
  'Es stimmt', 'Kritiker behaupten', 'Ich bin überzeugt', 'Fest steht', 'Es ist kein Geheimnis', 'Viele Eltern befürchten',
]
export const OB_INTROS = ['Es ist fraglich', 'Ich frage mich', 'Niemand weiß', 'Wir diskutieren darüber', 'Es bleibt offen', 'Man muss prüfen']
export const FRONTS = [
  'Heutzutage', 'Meiner Meinung nach', 'Auf der anderen Seite', 'Außerdem', 'Leider', 'Tatsächlich', 'In vielen Fällen',
  'Auf der einen Seite', 'Ohne Zweifel', 'Laut einer Studie', 'Erfahrungsgemäß', 'Inzwischen',
]

// Cause/effect, contrast and condition pairs: [a, b] as clause strings (same format as above)
const P = (s) => {
  const [subj, fin, mid, end, flags] = s.split('|')
  return { subj, fin, mid, end, sep: (flags || '').includes('sep') }
}
// weil/da/deshalb: a happens because of b
export const CAUSE = [
  ['die Luft in vielen Städten|ist|schlecht||', 'zu viele Autos|fahren|durch die Zentren||'],
  ['die Mieten|steigen|in Wien stark||', 'immer mehr Menschen|ziehen|in die Stadt||'],
  ['viele Lehrkräfte|sind|überlastet||', 'die Klassen|sind|zu groß||'],
  ['der Unterricht|fällt|oft|aus|sep', 'es|gibt|zu wenige Lehrkräfte||'],
  ['viele Schüler|sind|in der Früh müde||', 'viele Jugendliche|schlafen|wegen des Handys zu wenig||'],
  ['die Altstadt von Hallstatt|ist|überfüllt||', 'täglich|kommen|tausende Touristen||'],
  ['viele Jugendliche|lesen|kaum Zeitung||', 'sie|informieren|sich über soziale Medien||'],
  ['die Strände|sind|voller Plastik||', 'viele Menschen|werfen|ihren Müll einfach weg||'],
  ['die Regierung|muss|handeln||', 'der Klimawandel|bedroht|unsere Zukunft||'],
  ['Fake News|verbreiten|sich schnell||', 'viele Menschen|prüfen|die Quellen nicht||'],
  ['viele junge Menschen|finden|keine Wohnung||', 'die Mieten|sind|zu hoch||'],
  ['die Schüler|protestieren|vor dem Ministerium||', 'sie|fordern|bessere Lernbedingungen||'],
  ['regionale Produkte|sind|umweltfreundlicher||', 'die Transportwege|sind|kürzer||'],
  ['die Gemeinde|baut|einen neuen Radweg||', 'immer mehr Menschen|fahren|mit dem Rad||'],
  ['viele Familien|bleiben|im Sommer zu Hause||', 'Urlaub|ist|sehr teuer|geworden|'],
  ['die Wirtschaft|braucht|den Tourismus||', 'er|schafft|viele Arbeitsplätze||'],
  ['wir|sollten|weniger|fliegen|', 'das Fliegen|schadet|dem Klima||'],
  ['viele Schüler|haben|Stress||', 'der Druck vor der Matura|ist|groß||'],
  ['das Handyverbot|ist|sinnvoll||', 'die Schüler|können|sich besser|konzentrieren|'],
  ['Hallstatt|hat|eine Obergrenze für Busse|eingeführt|', 'die Anrainer|haben|sich über die Massen|beschwert|'],
]
// obwohl/trotzdem: a happens although b
export const CONTRAST = [
  ['viele Menschen|fliegen|in den Urlaub||', 'das Fliegen|schadet|dem Klima||'],
  ['viele Jugendliche|nutzen|soziale Medien||', 'sie|kennen|die Risiken||'],
  ['die Schüler|haben|gut|gelernt|', 'die Schularbeit|war|schwer||'],
  ['der Tourismus|bringt|viel Geld||', 'er|belastet|die Umwelt||'],
  ['viele|kaufen|Kleidung online||', 'die Geschäfte in der Stadt|haben|gute Angebote||'],
  ['die Regierung|hat|das Gesetz|beschlossen|', 'viele Bürger|waren|dagegen||'],
  ['Influencer|haben|großen Einfluss||', 'ihre Inhalte|sind|oft oberflächlich||'],
  ['viele Menschen|fahren|mit dem Auto||', 'der öffentliche Verkehr|ist|gut ausgebaut||'],
  ['ich|gehe|zur Demonstration||', 'meine Eltern|sind|skeptisch||'],
  ['die Mieten|steigen|weiter||', 'die Stadt|baut|neue Wohnungen||'],
  ['viele Schüler|lernen|erst am letzten Tag||', 'sie|kennen|den Termin der Schularbeit schon lange||'],
  ['das Handyverbot|ist|umstritten||', 'es|hat|viele Vorteile||'],
]
// wenn/falls: a happens if b
export const CONDITION = [
  ['die Schüler|lernen|besser||', 'der Unterricht|ist|abwechslungsreich||'],
  ['wir|können|den Klimawandel|bremsen|', 'alle|tragen|etwas|bei|sep'],
  ['die Altstadt|bleibt|lebenswert||', 'die Zahl der Touristen|wird|begrenzt||'],
  ['man|sollte|die Quelle|prüfen|', 'man|liest|eine Nachricht im Internet||'],
  ['Jugendliche|engagieren|sich mehr||', 'die Politik|nimmt|sie ernst||'],
  ['man|bekommt|eine bessere Note||', 'man|liest|die Angabe genau||'],
  ['die Mieten|sinken||', 'mehr Wohnungen|werden|gebaut||'],
  ['mehr Menschen|fahren|mit dem Zug||', 'die Tickets|sind|günstiger||'],
  ['die Demonstration|ist|erfolgreich||', 'viele Schüler|nehmen|daran|teil|sep'],
  ['ein Text|wirkt|überzeugend||', 'jedes Argument|hat|ein Beispiel||'],
]

export const pairs = {
  CAUSE: CAUSE.map(([a, b]) => [P(a), P(b)]),
  CONTRAST: CONTRAST.map(([a, b]) => [P(a), P(b)]),
  CONDITION: CONDITION.map(([a, b]) => [P(a), P(b)]),
}

// Infinitive groups with zu (r = reflexive "sich", only after impersonal openers)
export const INF_GROUPS = [
  { t: 'sich kritisch mit dem Thema auseinanderzusetzen', r: 1 },
  { t: 'eine Lösung zu finden' },
  { t: 'Verantwortung für das eigene Leben zu übernehmen' },
  { t: 'weniger Plastik zu verwenden' },
  { t: 'regelmäßig Sport zu treiben' },
  { t: 'die Angabe genau zu lesen' },
  { t: 'sich gut auf die Schularbeit vorzubereiten', r: 1 },
  { t: 'öfter mit dem Zug zu fahren' },
  { t: 'die eigene Meinung klar zu begründen' },
  { t: 'weniger Zeit am Handy zu verbringen' },
  { t: 'anderen nicht die Schuld zuzuschieben' },
  { t: 'den Massentourismus richtig zu begrenzen' },
  { t: 'Müll zu vermeiden' },
  { t: 'die Umwelt zu schützen' },
  { t: 'Fake News zu erkennen' },
  { t: 'sich für andere einzusetzen', r: 1 },
  { t: 'neue Lehrkräfte einzustellen' },
  { t: 'die Jugendlichen ernst zu nehmen' },
]
export const INF_INTROS = [
  { t: 'Es ist wichtig', imp: 1 }, { t: 'Es ist schwer', imp: 1 }, { t: 'Letztendlich kommt es darauf an', imp: 1 },
  { t: 'Es ist sinnvoll', imp: 1 }, { t: 'Es ist notwendig', imp: 1 }, { t: 'Viele Jugendliche versuchen', imp: 1 },
  { t: 'Die Schule hat die Aufgabe', imp: 1 }, { t: 'Es lohnt sich', imp: 1 }, { t: 'Ich habe vor' }, { t: 'Wir haben beschlossen' },
  { t: 'Es fällt vielen schwer', imp: 1 },
]
