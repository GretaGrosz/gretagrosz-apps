// Word data for the generators. Every form is written out by hand (no guessing rules), so generated
// exercises are always correct. Format per noun:  gender|singular|plural|genitive singular(s)|tags
//   plural '-'  = no plural (uncountable)          genitive: alternatives with '/', e.g. Traums/Traumes
//   tags: N = n-Deklination (genitive field = the -n form used in Akk/Dat/Gen singular)
//         P = person, p = fits "my/your ..." (possessive drills), U = usually uncountable/mass noun
const NOUNS = `
m|Staat|Staaten|Staates
m|Schüler|Schüler|Schülers|P p
m|Lehrer|Lehrer|Lehrers|P p
m|Bürger|Bürger|Bürgers|P
m|Politiker|Politiker|Politikers|P
m|Nutzer|Nutzer|Nutzers|P
m|Arbeitgeber|Arbeitgeber|Arbeitgebers|P
m|Arbeitnehmer|Arbeitnehmer|Arbeitnehmers|P
m|Bewohner|Bewohner|Bewohners|P
m|Leser|Leser|Lesers|P
m|Zuschauer|Zuschauer|Zuschauers|P
m|Influencer|Influencer|Influencers|P
m|Minister|Minister|Ministers|P
m|Direktor|Direktoren|Direktors|P
m|Freund|Freunde|Freundes/Freunds|P p
m|Arzt|Ärzte|Arztes/Arzts|P p
m|Gast|Gäste|Gastes/Gasts|P
m|Lehrling|Lehrlinge|Lehrlings|P
m|Computer|Computer|Computers|p
m|Vorteil|Vorteile|Vorteils/Vorteiles
m|Nachteil|Nachteile|Nachteils/Nachteiles
m|Grund|Gründe|Grundes/Grunds
m|Beitrag|Beiträge|Beitrags/Beitrages
m|Artikel|Artikel|Artikels
m|Brief|Briefe|Briefes/Briefs|p
m|Text|Texte|Textes|p
m|Satz|Sätze|Satzes
m|Beruf|Berufe|Berufs/Berufes|p
m|Job|Jobs|Jobs|p
m|Lohn|Löhne|Lohnes/Lohns|p
m|Markt|Märkte|Marktes/Markts
m|Preis|Preise|Preises
m|Plan|Pläne|Plans/Planes|p
m|Schritt|Schritte|Schrittes/Schritts
m|Einfluss|Einflüsse|Einflusses
m|Unterricht|-|Unterrichts/Unterrichtes|U
m|Verkehr|-|Verkehrs|U
m|Tourismus|-|Tourismus|U
m|Müll|-|Mülls/Mülles|U
m|Klimawandel|-|Klimawandels|U
m|Umweltschutz|-|Umweltschutzes|U
m|Konsum|-|Konsums|U
m|Erfolg|Erfolge|Erfolgs/Erfolges|p
m|Fehler|Fehler|Fehlers|p
m|Traum|Träume|Traums/Traumes|p
m|Wunsch|Wünsche|Wunsches|p
m|Weg|Wege|Weges/Wegs
m|Ort|Orte|Ortes/Orts
m|Urlaub|Urlaube|Urlaubs/Urlaubes|p
m|Urlaubsort|Urlaubsorte|Urlaubsorts/Urlaubsortes
m|Flughafen|Flughäfen|Flughafens
m|Zug|Züge|Zuges/Zugs
m|Bus|Busse|Busses
m|Wald|Wälder|Waldes/Walds
m|Fluss|Flüsse|Flusses
m|Berg|Berge|Berges/Bergs
m|See|Seen|Sees
m|Verein|Vereine|Vereins/Vereines|p
m|Unterschied|Unterschiede|Unterschieds/Unterschiedes
m|Zweck|Zwecke|Zwecks/Zweckes
m|Zugang|Zugänge|Zugangs/Zuganges
m|Zugriff|Zugriffe|Zugriffs/Zugriffes
m|Bereich|Bereiche|Bereichs/Bereiches
m|Alltag|-|Alltags|p U
m|Abschluss|Abschlüsse|Abschlusses|p
m|Bericht|Berichte|Berichts/Berichtes
m|Kommentar|Kommentare|Kommentars
m|Leserbrief|Leserbriefe|Leserbriefs/Leserbriefes
m|Vorschlag|Vorschläge|Vorschlags/Vorschlages|p
m|Standpunkt|Standpunkte|Standpunkts/Standpunktes|p
m|Bildschirm|Bildschirme|Bildschirms/Bildschirmes
m|Termin|Termine|Termins|p
m|Zeitpunkt|Zeitpunkte|Zeitpunkts/Zeitpunktes
m|Wohnort|Wohnorte|Wohnorts/Wohnortes|p
m|Haushalt|Haushalte|Haushalts/Haushaltes
m|Betrieb|Betriebe|Betriebs/Betriebes
m|Konflikt|Konflikte|Konflikts/Konfliktes
m|Protest|Proteste|Protests/Protestes
m|Streik|Streiks|Streiks
m|Lärm|-|Lärms/Lärmes|U
m|Stress|-|Stresses|U
m|Beweis|Beweise|Beweises
m|Aspekt|Aspekte|Aspekts/Aspektes
m|Faktor|Faktoren|Faktors
m|Wert|Werte|Wertes/Werts
m|Schutz|-|Schutzes|U
m|Kontakt|Kontakte|Kontakts/Kontaktes
m|Inhalt|Inhalte|Inhalts/Inhaltes
m|Zeitraum|Zeiträume|Zeitraums/Zeitraumes
m|Raum|Räume|Raumes/Raums
m|Lebensstil|Lebensstile|Lebensstils|p
m|Supermarkt|Supermärkte|Supermarkts/Supermarktes
m|Algorithmus|Algorithmen|Algorithmus
m|Account|Accounts|Accounts|p
m|Abfall|Abfälle|Abfalls/Abfalles
m|Alkohol|-|Alkohols|U
m|Wettbewerb|Wettbewerbe|Wettbewerbs/Wettbewerbes
m|Fortschritt|Fortschritte|Fortschritts/Fortschrittes
m|Bildungsweg|Bildungswege|Bildungswegs/Bildungsweges|p
m|Mensch|Menschen|Menschen|N P
m|Kollege|Kollegen|Kollegen|N P p
m|Kunde|Kunden|Kunden|N P
m|Experte|Experten|Experten|N P
m|Junge|Jungen|Jungen|N P
m|Nachbar|Nachbarn|Nachbarn|N P p
m|Student|Studenten|Studenten|N P
m|Präsident|Präsidenten|Präsidenten|N P
m|Patient|Patienten|Patienten|N P
m|Journalist|Journalisten|Journalisten|N P
m|Tourist|Touristen|Touristen|N P
m|Polizist|Polizisten|Polizisten|N P
m|Demonstrant|Demonstranten|Demonstranten|N P
m|Praktikant|Praktikanten|Praktikanten|N P
m|Kandidat|Kandidaten|Kandidaten|N P
m|Soldat|Soldaten|Soldaten|N P
m|Bauer|Bauern|Bauern|N P
m|Psychologe|Psychologen|Psychologen|N P
m|Zeuge|Zeugen|Zeugen|N P
m|Held|Helden|Helden|N P
m|Fotograf|Fotografen|Fotografen|N P
m|Assistent|Assistenten|Assistenten|N P
m|Architekt|Architekten|Architekten|N P
m|Aktivist|Aktivisten|Aktivisten|N P
m|Spezialist|Spezialisten|Spezialisten|N P
m|Herr|Herren|Herrn|N P
f|Gesellschaft|Gesellschaften|
f|Meinung|Meinungen||p
f|Lösung|Lösungen|
f|Entscheidung|Entscheidungen||p
f|Entwicklung|Entwicklungen|
f|Bildung|-||U
f|Umwelt|-||U
f|Verantwortung|-||U
f|Freiheit|Freiheiten||p
f|Möglichkeit|Möglichkeiten|
f|Gelegenheit|Gelegenheiten|
f|Schwierigkeit|Schwierigkeiten|
f|Sicherheit|-||U
f|Gesundheit|-||p U
f|Wirtschaft|-||U
f|Politik|-||U
f|Schule|Schulen||p
f|Klasse|Klassen||p
f|Lehrkraft|Lehrkräfte||P
f|Lehrerin|Lehrerinnen||P p
f|Schülerin|Schülerinnen||P
f|Freundin|Freundinnen||P p
f|Stadt|Städte||p
f|Gemeinde|Gemeinden|
f|Regierung|Regierungen|
f|Demokratie|Demokratien|
f|Zeitung|Zeitungen|
f|Zeitschrift|Zeitschriften|
f|Nachricht|Nachrichten||p
f|Information|Informationen|
f|Diskussion|Diskussionen|
f|Situation|Situationen||p
f|Generation|Generationen|
f|Kommunikation|-||U
f|Digitalisierung|-||U
f|Organisation|Organisationen|
f|Region|Regionen|
f|Reaktion|Reaktionen||p
f|Gefahr|Gefahren|
f|Folge|Folgen|
f|Ursache|Ursachen|
f|Frage|Fragen|
f|Antwort|Antworten||p
f|Aufgabe|Aufgaben||p
f|Arbeit|Arbeiten||p
f|Ausbildung|Ausbildungen||p
f|Prüfung|Prüfungen||p
f|Note|Noten||p
f|Familie|Familien||p
f|Kindheit|-||p U
f|Jugend|-||p U
f|Zukunft|-||p U
f|Vergangenheit|-||U
f|Zeit|Zeiten||p
f|Woche|Wochen|
f|Stunde|Stunden|
f|Reise|Reisen||p
f|Landschaft|Landschaften|
f|Natur|-||U
f|Luft|-||U
f|Energie|Energien|
f|Plattform|Plattformen|
f|App|Apps|
f|Webseite|Webseiten|
f|Werbung|-||U
f|Rolle|Rollen||p
f|Chance|Chancen||p
f|Herausforderung|Herausforderungen|
f|Veränderung|Veränderungen|
f|Änderung|Änderungen|
f|Maßnahme|Maßnahmen|
f|Regel|Regeln|
f|Strafe|Strafen|
f|Behörde|Behörden|
f|Firma|Firmen||p
f|Wohnung|Wohnungen||p
f|Miete|Mieten|
f|Steuer|Steuern|
f|Ausgabe|Ausgaben|
f|Krankheit|Krankheiten|
f|Sucht|Süchte|
f|Ernährung|-||p U
f|Bewegung|Bewegungen|
f|Pause|Pausen||p
f|Freizeit|-||p U
f|Mannschaft|Mannschaften||p
f|Erfahrung|Erfahrungen||p
f|Fähigkeit|Fähigkeiten||p
f|Leistung|Leistungen||p
f|Unterstützung|-||U
f|Sprache|Sprachen||p
f|Kultur|Kulturen|
f|Tradition|Traditionen|
f|Religion|Religionen|
f|Grenze|Grenzen|
f|Straße|Straßen|
f|Brücke|Brücken|
f|Fabrik|Fabriken|
f|Industrie|Industrien|
f|Ressource|Ressourcen|
f|Quelle|Quellen|
f|Studie|Studien|
f|Umfrage|Umfragen|
f|Statistik|Statistiken|
f|Zahl|Zahlen|
f|Mehrheit|Mehrheiten|
f|Minderheit|Minderheiten|
f|Wahl|Wahlen|
f|Partei|Parteien|
f|Stimme|Stimmen||p
f|Überschrift|Überschriften|
f|Einleitung|Einleitungen|
f|Anrede|Anreden|
f|Grußformel|Grußformeln|
f|Stellungnahme|Stellungnahmen|
f|Erörterung|Erörterungen|
f|Zusammenfassung|Zusammenfassungen|
f|Empfehlung|Empfehlungen|
f|Rede|Reden|
f|Ansicht|Ansichten||p
f|Behauptung|Behauptungen|
f|Begründung|Begründungen|
f|Forderung|Forderungen|
f|Förderung|Förderungen|
f|Mobilität|-||U
f|Nachhaltigkeit|-||U
f|Mutter|Mütter||P p
f|Tochter|Töchter||P
f|Hand|Hände|
f|Nacht|Nächte|
f|Kraft|Kräfte|
f|Bank|Banken|
f|Ware|Waren|
f|Grundlage|Grundlagen|
f|Voraussetzung|Voraussetzungen|
f|Wirkung|Wirkungen|
f|Auswirkung|Auswirkungen|
f|Beziehung|Beziehungen||p
f|Erziehung|-||U
f|Haltung|Haltungen||p
f|Einstellung|Einstellungen||p
f|Belastung|Belastungen|
f|Gewalt|-||U
f|Armut|-||U
f|Arbeitslosigkeit|-||U
f|Ungleichheit|Ungleichheiten|
f|Gerechtigkeit|-||U
f|Toleranz|-||U
f|Integration|-||U
f|Bevölkerung|Bevölkerungen|
f|Öffentlichkeit|-||U
f|Wissenschaft|Wissenschaften|
f|Forschung|Forschungen|
f|Technik|Techniken|
f|Technologie|Technologien|
f|Sendung|Sendungen|
f|Serie|Serien|
f|Geschichte|Geschichten|
f|Handlung|Handlungen|
f|Aussage|Aussagen|
f|Absicht|Absichten||p
f|Realität|Realitäten|
f|Krise|Krisen|
f|Fahrt|Fahrten|
f|Unterkunft|Unterkünfte|
f|Sehenswürdigkeit|Sehenswürdigkeiten|
f|Insel|Inseln|
f|Küste|Küsten|
f|Matura|Maturen||p
f|Lehrstelle|Lehrstellen||p
f|Bewerbung|Bewerbungen||p
f|Gesundheitsversorgung|-||U
n|Land|Länder|Landes/Lands
n|Kind|Kinder|Kindes/Kinds|P p
n|Problem|Probleme|Problems|p
n|Thema|Themen|Themas
n|Argument|Argumente|Arguments
n|Beispiel|Beispiele|Beispiels/Beispieles
n|Ergebnis|Ergebnisse|Ergebnisses|p
n|Ziel|Ziele|Ziels/Zieles|p
n|Leben|Leben|Lebens|p
n|Internet|-|Internets|U
n|Handy|Handys|Handys|p
n|Smartphone|Smartphones|Smartphones|p
n|Medium|Medien|Mediums
n|Netzwerk|Netzwerke|Netzwerks/Netzwerkes
n|Unternehmen|Unternehmen|Unternehmens
n|Geschäft|Geschäfte|Geschäfts/Geschäftes
n|Geld|-|Geldes/Gelds|p U
n|Gehalt|Gehälter|Gehalts/Gehaltes|p
n|Projekt|Projekte|Projekts/Projektes|p
n|Gesetz|Gesetze|Gesetzes
n|Recht|Rechte|Rechts/Rechtes|p
n|Verbot|Verbote|Verbots/Verbotes
n|Angebot|Angebote|Angebots/Angebotes
n|Bedürfnis|Bedürfnisse|Bedürfnisses|p
n|Verhalten|-|Verhaltens|p U
n|Verhältnis|Verhältnisse|Verhältnisses
n|Interesse|Interessen|Interesses|p
n|Gefühl|Gefühle|Gefühls/Gefühles|p
n|Wissen|-|Wissens|p U
n|Studium|Studien|Studiums|p
n|Fach|Fächer|Faches/Fachs|p
n|Schulfach|Schulfächer|Schulfaches/Schulfachs
n|Klassenzimmer|Klassenzimmer|Klassenzimmers
n|Gymnasium|Gymnasien|Gymnasiums
n|Zeugnis|Zeugnisse|Zeugnisses|p
n|Praktikum|Praktika|Praktikums|p
n|Auto|Autos|Autos|p
n|Flugzeug|Flugzeuge|Flugzeugs/Flugzeuges
n|Fahrrad|Fahrräder|Fahrrads/Fahrrades|p
n|Hotel|Hotels|Hotels
n|Restaurant|Restaurants|Restaurants
n|Dorf|Dörfer|Dorfes/Dorfs
n|Haus|Häuser|Hauses
n|Gebäude|Gebäude|Gebäudes
n|Zentrum|Zentren|Zentrums
n|Klima|-|Klimas|U
n|Wetter|-|Wetters|U
n|Plastik|-|Plastiks|U
n|Wasser|-|Wassers|U
n|Essen|-|Essens|p U
n|Tier|Tiere|Tieres/Tiers
n|Volk|Völker|Volkes/Volks
n|Parlament|Parlamente|Parlaments/Parlamentes
n|Amt|Ämter|Amtes/Amts
n|System|Systeme|Systems
n|Programm|Programme|Programms/Programmes
n|Spiel|Spiele|Spiels/Spieles
n|Video|Videos|Videos
n|Foto|Fotos|Fotos|p
n|Bild|Bilder|Bildes/Bilds
n|Gespräch|Gespräche|Gesprächs/Gespräches
n|Mittel|Mittel|Mittels
n|Risiko|Risiken|Risikos
n|Vorbild|Vorbilder|Vorbilds/Vorbildes|p
n|Ereignis|Ereignisse|Ereignisses
n|Erlebnis|Erlebnisse|Erlebnisses|p
n|Jahrhundert|Jahrhunderte|Jahrhunderts
n|Jahr|Jahre|Jahres/Jahrs
n|Semester|Semester|Semesters
n|Wochenende|Wochenenden|Wochenendes|p
n|Publikum|-|Publikums|U
n|Team|Teams|Teams|p
n|Mädchen|Mädchen|Mädchens|P
n|Hobby|Hobbys|Hobbys|p
n|Training|Trainings|Trainings|p
n|Krankenhaus|Krankenhäuser|Krankenhauses
n|Medikament|Medikamente|Medikaments/Medikamentes
n|Material|Materialien|Materials
n|Produkt|Produkte|Produkts/Produktes
n|Konto|Konten|Kontos|p
n|Budget|Budgets|Budgets|p
n|Einkommen|Einkommen|Einkommens|p
n|Ende|Enden|Endes
n|Bewusstsein|-|Bewusstseins|U
n|Engagement|Engagements|Engagements|p
n|Ehrenamt|Ehrenämter|Ehrenamts/Ehrenamtes
n|Museum|Museen|Museums
n|Theater|Theater|Theaters
n|Konzert|Konzerte|Konzerts/Konzertes
n|Festival|Festivals|Festivals
n|Ticket|Tickets|Tickets
n|Kaffeehaus|Kaffeehäuser|Kaffeehauses
n|Verkehrsmittel|Verkehrsmittel|Verkehrsmittels
n|Fahrzeug|Fahrzeuge|Fahrzeugs/Fahrzeuges
n|Bundesland|Bundesländer|Bundeslandes/Bundeslands
`

export const nouns = NOUNS.trim().split('\n').map((line) => {
  const [g, sg, pl, gen, tags = ''] = line.split('|')
  const t = tags.split(/\s+/)
  const N = t.includes('N')
  return {
    g, sg,
    pl: pl === '-' ? null : pl,
    gen: g === 'f' ? [sg] : N ? [gen] : gen.split('/'),
    nForm: N ? gen : null,
    nDecl: N,
    person: t.includes('P'),
    poss: t.includes('p'),
    mass: t.includes('U'),
  }
})

// Dative plural: add -n unless the plural already ends in -n or -s (or is a foreign plural in -a: die Praktika)
export const datPl = (pl) => (/[nsa]$/.test(pl) ? pl : pl + 'n')

// Noun form in a case (sg/pl). Genitive returns the first form; use nounForms for all accepted forms.
export function nounForms(n, kase, plural) {
  if (plural) return [kase === 'D' ? datPl(n.pl) : n.pl]
  if (kase === 'N') return [n.sg]
  if (n.nDecl) return [n.nForm]
  if (kase === 'G') return n.gen
  return [n.sg]
}

// Adjectives: positive|comparative|superlative stem (am …-sten / der …-ste)
const ADJ = `
wichtig|wichtiger|wichtigst
neu|neuer|neuest
groß|größer|größt
klein|kleiner|kleinst
modern|moderner|modernst
digital|digitaler|digitalst
sozial|sozialer|sozialst
öffentlich|öffentlicher|öffentlichst
aktuell|aktueller|aktuellst
international|internationaler|internationalst
politisch|politischer|politischst
lokal|lokaler|lokalst
gut|besser|best
schlecht|schlechter|schlechtest
bekannt|bekannter|bekanntest
typisch|typischer|typischst
jung|jünger|jüngst
alt|älter|ältest
einfach|einfacher|einfachst
schwierig|schwieriger|schwierigst
günstig|günstiger|günstigst
billig|billiger|billigst
teuer|teurer|teuerst
hoch|höher|höchst
nachhaltig|nachhaltiger|nachhaltigst
gesund|gesünder|gesündest
beliebt|beliebter|beliebtest
interessant|interessanter|interessantest
sicher|sicherer|sicherst
gefährlich|gefährlicher|gefährlichst
erfolgreich|erfolgreicher|erfolgreichst
kurz|kürzer|kürzest
lang|länger|längst
stark|stärker|stärkst
schwach|schwächer|schwächst
warm|wärmer|wärmst
kalt|kälter|kältest
laut|lauter|lautest
ruhig|ruhiger|ruhigst
schnell|schneller|schnellst
langsam|langsamer|langsamst
viel|mehr|meist
wenig|weniger|wenigst
nah|näher|nächst
umweltfreundlich|umweltfreundlicher|umweltfreundlichst
sinnvoll|sinnvoller|sinnvollst
effektiv|effektiver|effektivst
`
export const adjectives = ADJ.trim().split('\n').map((l) => {
  const [pos, comp, sup] = l.split('|')
  return { pos, comp, sup }
})
// Adjectives that fit almost any noun in the declension drills (no odd combinations)
export const GENERIC_ADJ = ['neu', 'aktuell', 'wichtig', 'groß', 'modern', 'digital', 'öffentlich', 'international', 'politisch', 'lokal', 'gut', 'bekannt', 'typisch']
// declension stem when it differs from the positive (teuer → teur-, hoch → hoh-)
export const ADJ_STEM = { teuer: 'teur', hoch: 'hoh', dunkel: 'dunkl' }

// Verbs: infinitive | ich,du,er/sie/es,wir,ihr,sie/Sie | perfect auxiliary (h/s) | Partizip II | Präteritum (er) | English
const VERBS = `
lernen|lerne,lernst,lernt,lernen,lernt,lernen|h|gelernt|lernte|learn
arbeiten|arbeite,arbeitest,arbeitet,arbeiten,arbeitet,arbeiten|h|gearbeitet|arbeitete|work
machen|mache,machst,macht,machen,macht,machen|h|gemacht|machte|do
spielen|spiele,spielst,spielt,spielen,spielt,spielen|h|gespielt|spielte|play
brauchen|brauche,brauchst,braucht,brauchen,braucht,brauchen|h|gebraucht|brauchte|need
kaufen|kaufe,kaufst,kauft,kaufen,kauft,kaufen|h|gekauft|kaufte|buy
glauben|glaube,glaubst,glaubt,glauben,glaubt,glauben|h|geglaubt|glaubte|believe
meinen|meine,meinst,meint,meinen,meint,meinen|h|gemeint|meinte|think, mean
diskutieren|diskutiere,diskutierst,diskutiert,diskutieren,diskutiert,diskutieren|h|diskutiert|diskutierte|discuss
kritisieren|kritisiere,kritisierst,kritisiert,kritisieren,kritisiert,kritisieren|h|kritisiert|kritisierte|criticise
benutzen|benutze,benutzt,benutzt,benutzen,benutzt,benutzen|h|benutzt|benutzte|use
nutzen|nutze,nutzt,nutzt,nutzen,nutzt,nutzen|h|genutzt|nutzte|use
reisen|reise,reist,reist,reisen,reist,reisen|s|gereist|reiste|travel
warten|warte,wartest,wartet,warten,wartet,warten|h|gewartet|wartete|wait
antworten|antworte,antwortest,antwortet,antworten,antwortet,antworten|h|geantwortet|antwortete|answer
erklären|erkläre,erklärst,erklärt,erklären,erklärt,erklären|h|erklärt|erklärte|explain
verdienen|verdiene,verdienst,verdient,verdienen,verdient,verdienen|h|verdient|verdiente|earn
unterstützen|unterstütze,unterstützt,unterstützt,unterstützen,unterstützt,unterstützen|h|unterstützt|unterstützte|support
fordern|fordere,forderst,fordert,fordern,fordert,fordern|h|gefordert|forderte|demand
fördern|fördere,förderst,fördert,fördern,fördert,fördern|h|gefördert|förderte|support, promote
sein|bin,bist,ist,sind,seid,sind|s|gewesen|war|be
haben|habe,hast,hat,haben,habt,haben|h|gehabt|hatte|have
werden|werde,wirst,wird,werden,werdet,werden|s|geworden|wurde|become
können|kann,kannst,kann,können,könnt,können|h|gekonnt|konnte|can
müssen|muss,musst,muss,müssen,müsst,müssen|h|gemusst|musste|must
dürfen|darf,darfst,darf,dürfen,dürft,dürfen|h|gedurft|durfte|may
sollen|soll,sollst,soll,sollen,sollt,sollen|h|gesollt|sollte|should
wollen|will,willst,will,wollen,wollt,wollen|h|gewollt|wollte|want
mögen|mag,magst,mag,mögen,mögt,mögen|h|gemocht|mochte|like
wissen|weiß,weißt,weiß,wissen,wisst,wissen|h|gewusst|wusste|know
lesen|lese,liest,liest,lesen,lest,lesen|h|gelesen|las|read
sehen|sehe,siehst,sieht,sehen,seht,sehen|h|gesehen|sah|see
sprechen|spreche,sprichst,spricht,sprechen,sprecht,sprechen|h|gesprochen|sprach|speak
nehmen|nehme,nimmst,nimmt,nehmen,nehmt,nehmen|h|genommen|nahm|take
geben|gebe,gibst,gibt,geben,gebt,geben|h|gegeben|gab|give
helfen|helfe,hilfst,hilft,helfen,helft,helfen|h|geholfen|half|help
essen|esse,isst,isst,essen,esst,essen|h|gegessen|aß|eat
treffen|treffe,triffst,trifft,treffen,trefft,treffen|h|getroffen|traf|meet
vergessen|vergesse,vergisst,vergisst,vergessen,vergesst,vergessen|h|vergessen|vergaß|forget
fahren|fahre,fährst,fährt,fahren,fahrt,fahren|s|gefahren|fuhr|drive, go
schlafen|schlafe,schläfst,schläft,schlafen,schlaft,schlafen|h|geschlafen|schlief|sleep
tragen|trage,trägst,trägt,tragen,tragt,tragen|h|getragen|trug|carry, wear
laufen|laufe,läufst,läuft,laufen,lauft,laufen|s|gelaufen|lief|run
halten|halte,hältst,hält,halten,haltet,halten|h|gehalten|hielt|hold
lassen|lasse,lässt,lässt,lassen,lasst,lassen|h|gelassen|ließ|let
gehen|gehe,gehst,geht,gehen,geht,gehen|s|gegangen|ging|go
kommen|komme,kommst,kommt,kommen,kommt,kommen|s|gekommen|kam|come
bleiben|bleibe,bleibst,bleibt,bleiben,bleibt,bleiben|s|geblieben|blieb|stay
fliegen|fliege,fliegst,fliegt,fliegen,fliegt,fliegen|s|geflogen|flog|fly
finden|finde,findest,findet,finden,findet,finden|h|gefunden|fand|find
schreiben|schreibe,schreibst,schreibt,schreiben,schreibt,schreiben|h|geschrieben|schrieb|write
denken|denke,denkst,denkt,denken,denkt,denken|h|gedacht|dachte|think
bringen|bringe,bringst,bringt,bringen,bringt,bringen|h|gebracht|brachte|bring
verlieren|verliere,verlierst,verliert,verlieren,verliert,verlieren|h|verloren|verlor|lose
entscheiden|entscheide,entscheidest,entscheidet,entscheiden,entscheidet,entscheiden|h|entschieden|entschied|decide
verstehen|verstehe,verstehst,versteht,verstehen,versteht,verstehen|h|verstanden|verstand|understand
bekommen|bekomme,bekommst,bekommt,bekommen,bekommt,bekommen|h|bekommen|bekam|get
beginnen|beginne,beginnst,beginnt,beginnen,beginnt,beginnen|h|begonnen|begann|begin
steigen|steige,steigst,steigt,steigen,steigt,steigen|s|gestiegen|stieg|rise
sinken|sinke,sinkst,sinkt,sinken,sinkt,sinken|s|gesunken|sank|fall, sink
wachsen|wachse,wächst,wächst,wachsen,wachst,wachsen|s|gewachsen|wuchs|grow
anrufen|rufe an,rufst an,ruft an,rufen an,ruft an,rufen an|h|angerufen|rief an|call
einkaufen|kaufe ein,kaufst ein,kauft ein,kaufen ein,kauft ein,kaufen ein|h|eingekauft|kaufte ein|go shopping
aufstehen|stehe auf,stehst auf,steht auf,stehen auf,steht auf,stehen auf|s|aufgestanden|stand auf|get up
anfangen|fange an,fängst an,fängt an,fangen an,fangt an,fangen an|h|angefangen|fing an|start
teilnehmen|nehme teil,nimmst teil,nimmt teil,nehmen teil,nehmt teil,nehmen teil|h|teilgenommen|nahm teil|take part
vorbereiten|bereite vor,bereitest vor,bereitet vor,bereiten vor,bereitet vor,bereiten vor|h|vorbereitet|bereitete vor|prepare
einladen|lade ein,lädst ein,lädt ein,laden ein,ladet ein,laden ein|h|eingeladen|lud ein|invite
ausgeben|gebe aus,gibst aus,gibt aus,geben aus,gebt aus,geben aus|h|ausgegeben|gab aus|spend
zunehmen|nehme zu,nimmst zu,nimmt zu,nehmen zu,nehmt zu,nehmen zu|h|zugenommen|nahm zu|increase
beitragen|trage bei,trägst bei,trägt bei,tragen bei,tragt bei,tragen bei|h|beigetragen|trug bei|contribute
`
export const verbs = VERBS.trim().split('\n').map((l) => {
  const [inf, forms, aux, p2, prt, en] = l.split('|')
  const f = forms.split(',')
  return { inf, forms: f, aux, p2, prt, en, sep: f[0].includes(' ') }
})
export const PERSONS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie']
export const PERSONS_LABEL = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']

// Verbs with a fixed preposition: verb | preposition | case (A/D) | example sentence | English
const VPREP = `
warten|auf|A|Wir warten auf den Bus.|wait for
denken|an|A|Ich denke oft an meine Familie.|think of
sich interessieren|für|A|Sie interessiert sich für Politik.|be interested in
teilnehmen|an|D|Viele Schüler nehmen an der Demonstration teil.|take part in
sprechen|über|A|Wir sprechen über das neue Gesetz.|talk about
sich beschäftigen|mit|D|Die Klasse beschäftigt sich mit dem Klimawandel.|deal with
abhängen|von|D|Das hängt von der Situation ab.|depend on
sich kümmern|um|A|Die Gemeinde kümmert sich um den Müll.|take care of
sich freuen|auf|A|Ich freue mich auf die Ferien.|look forward to
sich ärgern|über|A|Viele ärgern sich über die hohen Preise.|be annoyed about
eingehen|auf|A|Im Text gehe ich auf die wichtigsten Aspekte ein.|deal with, address
sich konzentrieren|auf|A|Ich konzentriere mich auf die Schularbeit.|concentrate on
sich entscheiden|für|A|Sie hat sich für eine Lehre entschieden.|decide on
sich beschweren|über|A|Die Anrainer beschweren sich über den Lärm.|complain about
beitragen|zu|D|Jeder kann zum Umweltschutz beitragen.|contribute to
führen|zu|D|Der Massentourismus führt zu Problemen.|lead to
gehören|zu|D|Das gehört zu meinen Aufgaben.|be part of
sich verlassen|auf|A|Man kann sich nicht immer auf das Internet verlassen.|rely on
sich gewöhnen|an|A|Ich habe mich an die neue Schule gewöhnt.|get used to
sich erinnern|an|A|Ich erinnere mich gut an meine Kindheit.|remember
Angst haben|vor|D|Viele haben Angst vor der Zukunft.|be afraid of
schützen|vor|D|Wir müssen die Natur vor dem Müll schützen.|protect from
warnen|vor|D|Experten warnen vor den Folgen.|warn about
bitten|um|A|Ich bitte um eine Antwort.|ask for
sich bewerben|um|A|Er bewirbt sich um eine Lehrstelle.|apply for
sich auseinandersetzen|mit|D|Man sollte sich kritisch mit dem Thema auseinandersetzen.|engage with
diskutieren|über|A|Wir diskutieren über ein Handyverbot.|discuss
berichten|über|A|Die Zeitung berichtet über den Streik.|report on
leiden|unter|D|Viele Städte leiden unter dem Massentourismus.|suffer from
profitieren|von|D|Die Wirtschaft profitiert vom Tourismus.|benefit from
träumen|von|D|Viele träumen von einem eigenen Unternehmen.|dream of
sich einsetzen|für|A|Die Schüler setzen sich für den Klimaschutz ein.|stand up for
achten|auf|A|Man sollte auf die Rechtschreibung achten.|pay attention to
reagieren|auf|A|Die Regierung reagiert auf die Proteste.|react to
zweifeln|an|D|Ich zweifle an dieser Aussage.|doubt
fragen|nach|D|Der Lehrer fragt nach unserer Meinung.|ask about
suchen|nach|D|Wir suchen nach einer Lösung.|look for
Kritik üben|an|D|Viele üben Kritik an der Regierung.|criticise
anfangen|mit|D|Wir fangen mit der Einleitung an.|start with
aufhören|mit|D|Er hat mit dem Rauchen aufgehört.|stop doing
sich bedanken|für|A|Ich bedanke mich für Ihre Aufmerksamkeit.|thank for
sich entschuldigen|für|A|Er entschuldigt sich für den Fehler.|apologise for
hoffen|auf|A|Wir hoffen auf eine bessere Zukunft.|hope for
sich vorbereiten|auf|A|Ich bereite mich auf die Prüfung vor.|prepare for
ankommen|auf|A|Es kommt auf die richtige Lösung an.|depend on, matter
sich wenden|an|A|Ich wende mich an die Redaktion.|turn to, address
glauben|an|A|Sie glaubt an ihre Träume.|believe in
bestehen|aus|D|Die Klasse besteht aus 25 Schülern.|consist of
sich unterscheiden|von|D|Österreich unterscheidet sich von Ungarn.|differ from
stolz sein|auf|A|Sie ist stolz auf ihre Leistung.|be proud of
zufrieden sein|mit|D|Ich bin mit dem Ergebnis zufrieden.|be satisfied with
verantwortlich sein|für|A|Jeder ist für sein eigenes Leben verantwortlich.|be responsible for
sich halten|an|A|Alle müssen sich an die Regeln halten.|stick to
sich engagieren|für|A|Sie engagiert sich für Flüchtlinge.|be committed to
überzeugen|von|D|Er hat mich von seiner Idee überzeugt.|convince of
Stellung nehmen|zu|D|Ich nehme zu dem Artikel Stellung.|comment on, take a position on
`
export const verbPreps = VPREP.trim().split('\n').map((l) => {
  const [verb, prep, kase, ex, en] = l.split('|')
  return { verb, prep, kase, ex, en }
})

// da-/wo-Wörter
const VOWEL = /^[aeiouäöü]/
export const daWord = (p) => (VOWEL.test(p) ? 'dar' : 'da') + p
export const woWord = (p) => (VOWEL.test(p) ? 'wor' : 'wo') + p

export const PREPS = {
  A: ['durch', 'für', 'gegen', 'ohne', 'um', 'bis'],
  D: ['aus', 'bei', 'mit', 'nach', 'seit', 'von', 'zu', 'gegenüber'],
  G: ['wegen', 'trotz', 'während', 'aufgrund', 'innerhalb', 'außerhalb', 'statt', 'anstatt'],
  W: ['an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen'],
}
