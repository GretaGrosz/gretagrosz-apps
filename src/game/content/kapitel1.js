// Loopy & Co. – Kapitel 1 "Die Wirtschaft betrifft uns alle" (1. Jahrgang).
// Zwei Themen aus dem Lernteil: "Grundlagen des Wirtschaftens" und "Der Markt". Jede Lektion entspricht
// genau einem Lernschritt (src/data/lerninhalte/jg1.js) und enthält nur, was dort steht.
//
// Lektion: { id, topicId, step, title, cards: [{ title, text, example? }], learned: [...], cases: [fn] }
// Jede Fall-Funktion liefert bei jedem Aufruf eine neue Variante (andere Beispiele, andere Reihenfolge).
// Fallarten:
//   choice: { say, ask?, options: [text], correct, explanation }
//   sort:   { say, buckets: [name], items: [{ text, bucket }], explanation }
//   order:  { say, items: [in richtiger Reihenfolge], explanation }
//   price:  { say, demand: [a, b], supply: [c, d], explanation }   Menge = a − b·Preis bzw. c + d·Preis

export const KAPITEL = {
  id: 'k1',
  title: 'Die Wirtschaft betrifft uns alle',
  learnBase: '/lernen/1/wirtschaft-betrifft-uns-alle',
}

const G = 'grundlagen-des-wirtschaftens'
const M = 'der-markt'

const pick = (list) => list[Math.floor(Math.random() * list.length)]
const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const some = (list, n) => shuffle(list).slice(0, n)

// Auswahlfrage: richtige Antwort zuerst angeben, gemischt wird hier
function choice(id, say, right, wrong, explanation, ask) {
  const options = shuffle([right, ...wrong])
  return { id, type: 'choice', say, ask, options, correct: options.indexOf(right), explanation }
}
// Sortieren: pool = [[Text, Fach], …]; n Karten, aus jedem Fach mindestens eine
function sort(id, say, buckets, pool, n, explanation) {
  const perBucket = buckets.map((_, b) => shuffle(pool.filter((p) => p[1] === b)))
  const items = perBucket.map((l) => l.shift()).filter(Boolean)
  const rest = shuffle(perBucket.flat())
  while (items.length < n && rest.length) items.push(rest.shift())
  return { id, type: 'sort', say, buckets, items: shuffle(items).map(([text, bucket]) => ({ text, bucket })), explanation }
}
const order = (id, say, items, explanation) => ({ id, type: 'order', say, items, explanation })

export const LESSONS = [
  // ───────────────────────── Grundlagen des Wirtschaftens ─────────────────────────
  {
    id: 'g0',
    topicId: G,
    step: 0,
    title: 'Bedürfnisse',
    cards: [
      { title: 'Bedürfnis', text: 'Du merkst, dass dir etwas fehlt, und willst das ändern.', example: 'Du hast Durst → du willst trinken → das Mittel dazu ist Wasser.' },
      {
        title: 'Die Bedürfnispyramide von Maslow',
        text: 'Sie ordnet Bedürfnisse danach, wie dringend sie sind. Zuerst wird die unterste Stufe erfüllt, dann die nächste.',
        example: 'Von unten nach oben: Grundbedürfnisse → Sicherheit → Soziale Bedürfnisse → Anerkennung → Selbstverwirklichung',
      },
      {
        title: 'Primär und sekundär',
        text: 'Grundbedürfnisse (Existenzbedürfnisse) brauchst du zum Überleben. Sie heißen auch Primärbedürfnisse. Kulturbedürfnisse und Luxusbedürfnisse zusammen sind die Sekundärbedürfnisse.',
        example: 'Grund: Essen, Wohnen · Kultur: Bildung, Kino · Luxus: Sportwagen, Villa',
      },
    ],
    learned: ['Bedürfnis = dir fehlt etwas und du willst das ändern', 'Maslow: Grundbedürfnisse → Sicherheit → Soziale → Anerkennung → Selbstverwirklichung', 'Primär = Grundbedürfnisse · Sekundär = Kultur + Luxus'],
    cases: [
      () =>
        choice(
          'g0-beduerfnis',
          pick(['Mir knurrt der Magen! Ich brauche sofort etwas zu essen.', 'Ich habe solchen Durst! Ich will unbedingt etwas trinken.']),
          'Ein Bedürfnis: Jemandem fehlt etwas und er will das ändern.',
          ['Ein Gut: etwas, das man kaufen kann.', 'Ein Angebot: Hier wird etwas angeboten.'],
          'Ein Bedürfnis heißt: Du merkst, dass dir etwas fehlt, und willst das ändern. Hunger → essen wollen.',
          'Was ist das?',
        ),
      () =>
        order(
          'g0-maslow',
          'Loopy schreibt die Bedürfnispyramide auf die Tafel. Ordne von unten (am dringendsten) nach oben.',
          ['Grundbedürfnisse', 'Sicherheit', 'Soziale Bedürfnisse', 'Anerkennung', 'Selbstverwirklichung'],
          'Maslow von unten nach oben: Grundbedürfnisse → Sicherheit → Soziale Bedürfnisse → Anerkennung → Selbstverwirklichung. Zuerst wird die unterste Stufe erfüllt.',
        ),
      () =>
        sort(
          'g0-arten',
          'Die Kundschaft erzählt, was sie sich wünscht. Welche Art von Bedürfnis ist das?',
          ['Grundbedürfnis', 'Kulturbedürfnis', 'Luxusbedürfnis'],
          [['Essen', 0], ['Trinken', 0], ['Kleidung', 0], ['Wohnen', 0], ['Bildung', 1], ['Urlaub', 1], ['Sport', 1], ['Kino', 1], ['Sportwagen', 2], ['Villa', 2], ['Weltreise', 2]],
          6,
          'Grundbedürfnisse brauchst du zum Überleben (Essen, Trinken, Kleidung, Wohnen). Kulturbedürfnisse machen das Leben angenehm (Bildung, Urlaub, Sport, Kino). Luxusbedürfnisse zeigen Status (Sportwagen, Villa, Weltreise).',
        ),
      () =>
        choice(
          'g0-sekundaer',
          'Ich gönne mir einen Kinoabend und nächstes Jahr eine Weltreise. Wie nennt man Kultur- und Luxusbedürfnisse zusammen?',
          'Sekundärbedürfnisse',
          ['Primärbedürfnisse', 'Existenzbedürfnisse'],
          'Kultur- und Luxusbedürfnisse zusammen nennt man Sekundärbedürfnisse. Primärbedürfnisse sind die Grundbedürfnisse.',
        ),
      () => {
        const [say, right] = pick([
          ['Am wichtigsten sind mir gerade meine Gesundheit und ein sicherer Job.', 'Sicherheit'],
          ['Ohne meine Freunde und meine Familie geht bei mir gar nichts.', 'Soziale Bedürfnisse'],
          ['Ich wünsche mir Lob und Erfolg in meinem Beruf.', 'Anerkennung'],
          ['Ich will meine Talente entfalten und meinen Traumberuf finden.', 'Selbstverwirklichung'],
        ])
        const wrong = some(['Grundbedürfnisse', 'Sicherheit', 'Soziale Bedürfnisse', 'Anerkennung', 'Selbstverwirklichung'].filter((s) => s !== right), 2)
        return choice('g0-stufe', say, right, wrong, 'Maslow: Sicherheit = Gesundheit, sicherer Job, Geld · Soziale Bedürfnisse = Freunde, Familie · Anerkennung = Lob, Erfolg · Selbstverwirklichung = Talente entfalten, Traumberuf.', 'Welche Stufe der Pyramide ist das?')
      },
    ],
  },
  {
    id: 'g1',
    topicId: G,
    step: 1,
    title: 'Güter',
    cards: [
      { title: 'Güter', text: 'Alles, womit wir Bedürfnisse befriedigen. Ein anderes Wort dafür ist Produkte.' },
      { title: 'Kostet es etwas?', text: 'Freie Güter gibt es unbegrenzt in der Natur, meist kostenlos. Wirtschaftsgüter sind knapp und kosten Geld – je knapper, desto teurer.', example: 'Frei: Luft, Sonnenlicht · Wirtschaftsgut: Kakao, Erdöl' },
      {
        title: 'Kann man es angreifen?',
        text: 'Sachgüter kann man angreifen, lagern und transportieren. Dienstleistungen kann man nicht angreifen und nicht lagern. Sie sind sachbezogen (an einer Sache) oder personenbezogen (an einem Menschen).',
        example: 'Sachgut: Auto, Möbel · Dienstleistung: Autoreparatur (Sache), Arztbesuch (Person)',
      },
      { title: 'Wofür wird es verwendet?', text: 'Konsumgüter werden selbst verbraucht oder benutzt. Mit Investitionsgütern stellt eine Firma andere Güter her. Es kommt darauf an, WER es WOFÜR verwendet.', example: 'Konsumgut: Essen, Auto für privat · Investitionsgut: Maschine, Lieferwagen' },
    ],
    learned: ['Freie Güter (unbegrenzt, gratis) ↔ Wirtschaftsgüter (knapp, kosten Geld)', 'Sachgüter (angreifbar) ↔ Dienstleistungen (nicht angreifbar, nicht lagerbar)', 'Konsumgut oder Investitionsgut: Wer verwendet es wofür?'],
    cases: [
      () =>
        sort(
          'g1-frei',
          'Loopy schaut sich am Markt um. Kostet das etwas?',
          ['Freies Gut', 'Wirtschaftsgut'],
          [['Luft', 0], ['Sonnenlicht', 0], ['Kakao', 1], ['Erdöl', 1], ['Bonbons', 1], ['Zucker', 1], ['Ein Lieferwagen', 1]],
          5,
          'Freie Güter gibt es unbegrenzt in der Natur, meist kostenlos (Luft, Sonnenlicht). Wirtschaftsgüter sind knapp und kosten Geld (Kakao, Erdöl).',
        ),
      () =>
        sort(
          'g1-sach',
          'Kann man es angreifen? Sortiere, was die Leute am Markt kaufen.',
          ['Sachgut', 'Dienstleistung'],
          [['Auto', 0], ['Möbel', 0], ['Kleidung', 0], ['Bonbonglas', 0], ['Haarschnitt', 1], ['Arztbesuch', 1], ['Autoreparatur', 1]],
          6,
          'Sachgüter kann man angreifen, lagern und transportieren (Auto, Möbel, Kleidung). Dienstleistungen kann man nicht angreifen und nicht lagern (Haarschnitt, Arztbesuch, Reparatur).',
        ),
      () => {
        const [say, right] = pick([
          ['Loopy kauft eine Maschine, mit der sie am Stand Bonbons herstellt.', 'Investitionsgut'],
          ['Loopy kauft einen Lieferwagen für ihre Firma.', 'Investitionsgut'],
          ['Ich kaufe eine Tüte Bonbons und esse sie gleich selbst.', 'Konsumgut'],
          ['Meine Familie kauft ein Auto für private Ausflüge.', 'Konsumgut'],
        ])
        return choice('g1-konsum', say, right, [right === 'Konsumgut' ? 'Investitionsgut' : 'Konsumgut', 'Freies Gut'], 'Konsumgüter werden selbst verbraucht oder benutzt. Mit Investitionsgütern stellt eine Firma andere Güter her (Maschine, Lieferwagen).', 'Was für ein Gut ist das?')
      },
      () => {
        const [say, right] = pick([
          ['Ich lasse gerade mein Fahrrad reparieren.', 'Sachbezogene Dienstleistung'],
          ['Ich komme gerade von der Untersuchung beim Arzt.', 'Personenbezogene Dienstleistung'],
          ['Ich war eben beim Friseur – neuer Haarschnitt!', 'Personenbezogene Dienstleistung'],
          ['Mein Auto ist in der Werkstatt zur Reparatur.', 'Sachbezogene Dienstleistung'],
        ])
        return choice('g1-dl', say, right, [right.startsWith('Sach') ? 'Personenbezogene Dienstleistung' : 'Sachbezogene Dienstleistung', 'Sachgut'], 'Sachbezogen: an einer Sache gemacht (Autoreparatur). Personenbezogen: an einem Menschen gemacht (Untersuchung beim Arzt).', 'Was wurde hier gekauft?')
      },
      () =>
        choice(
          'g1-wofuer',
          'Ich habe denselben Laptop wie du, Loopy! Ich spiele damit zu Hause, du machst damit die Abrechnung für den Stand.',
          'Zu Hause ist er ein Konsumgut, bei Loopy am Stand ein Investitionsgut.',
          ['Ein Laptop ist immer ein Konsumgut.', 'Ein Laptop ist immer ein Investitionsgut.'],
          'Ob Konsum- oder Investitionsgut hängt davon ab, WER es WOFÜR verwendet: privat benutzt = Konsumgut, in der Firma zum Arbeiten = Investitionsgut.',
        ),
      () =>
        order(
          'g1-check',
          'Der Güter-Check: In welcher Reihenfolge stellst du die drei Fragen?',
          ['Ist es knapp und kostet Geld?', 'Kann man es angreifen?', 'Wofür wird es verwendet?'],
          'Güter-Check: 1. Knapp und kostet Geld? (frei oder Wirtschaftsgut) → 2. Kann man es angreifen? (Sachgut oder Dienstleistung) → 3. Wofür wird es verwendet? (Konsum- oder Investitionsgut)',
        ),
    ],
  },
  {
    id: 'g2',
    topicId: G,
    step: 2,
    title: 'Wirtschaften',
    cards: [
      { title: 'Knappheit', text: 'Wir wollen viel, haben aber nur begrenzt Geld und Zeit. Die Mittel (Geld, Zeit, Rohstoffe) reichen nie für alle Wünsche.' },
      { title: 'Wirtschaften', text: 'Planvoll und vernünftig (rational) handeln, damit die Knappheit kleiner wird.', example: 'Du teilst dein Taschengeld so ein, dass es für das Wichtigste reicht.' },
      { title: 'Nachhaltigkeit', text: 'So wirtschaften, dass auch spätere Generationen noch genug Ressourcen haben.' },
    ],
    learned: ['Knappheit: Die Mittel reichen nie für alle Wünsche', 'Wirtschaften = planvoll und vernünftig handeln', 'Nachhaltigkeit: auch spätere Generationen sollen genug haben'],
    cases: [
      () =>
        choice(
          'g2-knappheit',
          'Loopy hat 50 Münzen. Sie möchte neue Gläser, ein Schild und einen Vorrat Zucker – aber das Geld reicht nicht für alles.',
          'Knappheit',
          ['Nachhaltigkeit', 'Spezialisierung'],
          'Knappheit: Die Mittel (Geld, Zeit, Rohstoffe) reichen nie für alle Wünsche.',
          'Wie heißt dieses Problem?',
        ),
      () =>
        choice(
          'g2-wirtschaften',
          'Du redest immer vom „Wirtschaften", Loopy. Was heißt das eigentlich?',
          'Planvoll und vernünftig handeln, damit die Knappheit kleiner wird.',
          ['Möglichst viel Geld ausgeben, solange man es hat.', 'Niemals etwas kaufen und alles sparen.'],
          'Wirtschaften heißt planvoll und vernünftig (rational) handeln, damit die Knappheit kleiner wird.',
        ),
      () =>
        choice(
          'g2-nachhaltig',
          'Loopy füllt ihre Bonbons in Gläser, die man wieder auffüllen kann. So bleibt auch für spätere Generationen genug übrig.',
          'Nachhaltigkeit',
          ['Knappheit', 'Luxusbedürfnis'],
          'Nachhaltigkeit: so wirtschaften, dass auch spätere Generationen noch genug Ressourcen haben.',
          'Wie nennt man dieses Denken?',
        ),
      () =>
        choice(
          'g2-einteilen',
          'Loopy hat nur 40 Münzen. Zucker ist aus, und ohne Zucker gibt es keine Bonbons. Sie hätte aber auch gern ein goldenes Schild.',
          'Zuerst den Zucker kaufen und das Geld so einteilen, dass es für das Wichtigste reicht.',
          ['Alles für das goldene Schild ausgeben.', 'Gar nicht planen und einfach abwarten.'],
          'Wirtschaften heißt planvoll einteilen – wie beim Taschengeld, das für das Wichtigste reichen muss.',
          'Was ist wirtschaftlich gedacht?',
        ),
      () =>
        sort(
          'g2-begriffe',
          'Loopy sortiert ihre Notizen. Wozu gehört der Satz?',
          ['Knappheit', 'Wirtschaften', 'Nachhaltigkeit'],
          [
            ['Das Geld reicht nicht für alle Wünsche.', 0],
            ['Die Zeit reicht nicht für alles.', 0],
            ['Das Taschengeld gut einteilen.', 1],
            ['Planvoll und vernünftig handeln.', 1],
            ['Auch spätere Generationen sollen genug Ressourcen haben.', 2],
          ],
          5,
          'Knappheit: Die Mittel reichen nie für alle Wünsche. Wirtschaften: planvoll und vernünftig handeln. Nachhaltigkeit: an spätere Generationen denken.',
        ),
    ],
  },
  {
    id: 'g3',
    topicId: G,
    step: 3,
    title: 'Minimal- und Maximalprinzip',
    cards: [
      { title: 'Wirtschaftlichkeitsprinzip', text: 'Das beste Verhältnis zwischen Bedürfnissen und knappen Mitteln finden. Das geht auf zwei Wegen.' },
      { title: 'Minimalprinzip', text: 'Das Ziel ist fix. Du willst es mit möglichst wenig Einsatz erreichen.', example: 'Ich will einen Basketball → ich suche den billigsten.' },
      { title: 'Maximalprinzip', text: 'Der Einsatz (zum Beispiel das Geld) ist fix. Du willst damit möglichst viel erreichen.', example: 'Ich habe 30 € → ich kaufe so viele Snacks wie möglich.' },
      { title: 'Der Trick', text: 'Frag dich: Was ist fix? Das ZIEL fix → Minimalprinzip. Das GELD oder der EINSATZ fix → Maximalprinzip.' },
    ],
    learned: ['Minimalprinzip: Ziel fix → möglichst wenig Einsatz', 'Maximalprinzip: Einsatz fix → möglichst viel Ergebnis'],
    cases: [
      () =>
        sort(
          'g3-sort',
          'Was ist fix – das Ziel oder der Einsatz? Sortiere die Sätze.',
          ['Minimalprinzip', 'Maximalprinzip'],
          [
            ['Loopy braucht 10 kg Zucker und sucht den billigsten Lieferanten.', 0],
            ['Ich will einen Basketball und suche den billigsten.', 0],
            ['100 Bonbons sollen mit möglichst wenig Zucker gelingen.', 0],
            ['Der Stand soll mit möglichst wenigen Helfern aufgebaut werden.', 0],
            ['Loopy hat 30 Münzen und will dafür möglichst viele Gläser.', 1],
            ['Ich habe 30 € und kaufe so viele Snacks wie möglich.', 1],
            ['Aus 5 kg Zucker sollen möglichst viele Bonbons werden.', 1],
            ['In 2 Stunden will Loopy möglichst viele Kunden bedienen.', 1],
          ],
          5,
          'Ziel fix (ein Basketball, 10 kg Zucker) → Minimalprinzip: möglichst wenig Einsatz. Einsatz fix (30 €, 5 kg Zucker, 2 Stunden) → Maximalprinzip: möglichst viel Ergebnis.',
        ),
      () => {
        const [say, right] = pick([
          ['Ich habe genau 5 Münzen dabei. Gib mir dafür so viele Bonbons wie möglich!', 'Maximalprinzip'],
          ['Ich brauche genau 20 Bonbons für die Party. Wo bekomme ich sie am billigsten?', 'Minimalprinzip'],
        ])
        return choice('g3-kunde', say, right, [right === 'Minimalprinzip' ? 'Maximalprinzip' : 'Minimalprinzip', 'Nachhaltigkeit'], 'Ist das Geld fix (5 Münzen), soll möglichst viel herauskommen: Maximalprinzip. Ist das Ziel fix (20 Bonbons), soll es möglichst wenig kosten: Minimalprinzip.', 'Welches Prinzip ist das?')
      },
      () => {
        const min = Math.random() < 0.5
        return choice(
          'g3-fix',
          `Ich verwechsle das immer, Loopy. Was ist beim ${min ? 'Minimalprinzip' : 'Maximalprinzip'} fix?`,
          min ? 'Das Ziel' : 'Der Einsatz, zum Beispiel das Geld',
          [min ? 'Der Einsatz, zum Beispiel das Geld' : 'Das Ziel', 'Gar nichts'],
          'Der Trick: Das ZIEL fix → Minimalprinzip. Das GELD oder der EINSATZ fix → Maximalprinzip.',
        )
      },
      () =>
        choice(
          'g3-prinzip',
          'Minimalprinzip, Maximalprinzip … Wozu gibt es das Wirtschaftlichkeitsprinzip überhaupt?',
          'Um das beste Verhältnis zwischen Bedürfnissen und knappen Mitteln zu finden.',
          ['Damit alle Preise gleich hoch sind.', 'Damit der Staat alles planen kann.'],
          'Wirtschaftlichkeitsprinzip: das beste Verhältnis zwischen Bedürfnissen und knappen Mitteln finden – nach dem Minimal- oder dem Maximalprinzip.',
        ),
    ],
  },
  {
    id: 'g4',
    topicId: G,
    step: 4,
    title: 'Wirtschaftsteilnehmer',
    cards: [
      { title: 'Wer macht mit?', text: 'Wirtschaftsteilnehmer sind alle Personen und Einrichtungen, die bei der Wirtschaft mitmachen. Auch du!' },
      { title: 'Unternehmen und Haushalte', text: 'Unternehmen stellen Güter her oder bieten Dienstleistungen an. Haushalte (eine Person oder Familie) verdienen Geld durch Arbeit, kaufen damit ein oder sparen. Sie sind die Konsumenten.', example: 'Unternehmen: Bäckerei, Friseur' },
      { title: 'Staat', text: 'Macht Gesetze und kassiert Steuern – Geld, das man laut Gesetz an den Staat zahlen muss. Er gibt es zum Beispiel für Schulen, Straßen und Familienbeihilfe aus. Mit Subventionen unterstützt er Unternehmen für einen bestimmten Zweck.', example: 'Subvention: Förderung für Forschung oder Photovoltaik' },
      { title: 'Banken', text: 'Nehmen Erspartes an und verleihen Geld (Kredit). Dafür gibt es Zinsen.' },
    ],
    learned: ['Unternehmen stellen her, Haushalte arbeiten, kaufen und sparen', 'Staat: Gesetze, Steuern, Subventionen', 'Banken: Erspartes annehmen, Kredite vergeben, Zinsen'],
    cases: [
      () =>
        sort(
          'g4-wer',
          'Wer macht was in der Wirtschaft?',
          ['Unternehmen', 'Haushalte', 'Staat', 'Banken'],
          [
            ['stellen Güter her', 0],
            ['bieten Dienstleistungen an', 0],
            ['verdienen Geld durch Arbeit', 1],
            ['kaufen ein oder sparen', 1],
            ['macht Gesetze', 2],
            ['kassiert Steuern', 2],
            ['zahlt Familienbeihilfe', 2],
            ['verleihen Geld als Kredit', 3],
            ['nehmen Erspartes an', 3],
          ],
          6,
          'Unternehmen stellen Güter her oder bieten Dienstleistungen an. Haushalte verdienen Geld, kaufen ein oder sparen. Der Staat macht Gesetze und kassiert Steuern. Banken nehmen Erspartes an und verleihen Geld.',
        ),
      () =>
        choice(
          'g4-zinsen',
          'Die Bank leiht dir 100 Münzen für deinen Stand, Loopy. Aber umsonst macht sie das nicht.',
          'Zinsen',
          ['Steuern', 'Subventionen'],
          'Banken nehmen Erspartes an und verleihen Geld (Kredit). Dafür gibt es Zinsen.',
          'Was bekommt die Bank für den Kredit?',
        ),
      () =>
        choice(
          'g4-steuern',
          'Von deinem Gewinn musst du laut Gesetz einen Teil an den Staat zahlen, Loopy.',
          'Steuern',
          ['Zinsen', 'Subventionen'],
          'Steuern sind Geld, das man laut Gesetz an den Staat zahlen muss. Der Staat gibt sie z. B. für Schulen, Straßen und Familienbeihilfe aus.',
          'Wie heißt dieses Geld?',
        ),
      () =>
        choice(
          'g4-subvention',
          'Gute Nachricht, Loopy: Der Staat unterstützt dich mit Geld, wenn du eine Photovoltaik-Anlage auf deinen Stand baust.',
          'Eine Subvention',
          ['Eine Steuer', 'Ein Kredit mit Zinsen'],
          'Subventionen sind Geld vom Staat, mit dem er Unternehmen für einen bestimmten Zweck unterstützt, z. B. Forschung oder Photovoltaik.',
          'Was ist dieses Geld vom Staat?',
        ),
      () =>
        choice(
          'g4-haushalt',
          'Ich gehe arbeiten, verdiene mein Geld und kaufe davon bei dir Bonbons. Ein bisschen spare ich auch.',
          'Ein Haushalt (Konsument)',
          ['Ein Unternehmen', 'Eine Bank'],
          'Haushalte sind eine Person oder Familie. Sie verdienen Geld durch Arbeit, kaufen damit ein oder sparen – sie sind die Konsumenten.',
          'Welcher Wirtschaftsteilnehmer spricht hier?',
        ),
    ],
  },
  {
    id: 'g5',
    topicId: G,
    step: 5,
    title: 'Wirtschaftskreislauf',
    cards: [
      { title: 'Geben und Nehmen', text: 'Der Wirtschaftskreislauf zeigt, wie alle Wirtschaftsteilnehmer zusammenhängen.' },
      { title: 'Die Kernbeziehung', text: 'Unternehmen und Haushalte tauschen: Haushalte geben Arbeitskraft und bekommen Einkommen. Unternehmen liefern Güter und bekommen den Kaufpreis.' },
      { title: 'Einfach, erweitert, vollständig', text: 'Einfach: Unternehmen und Haushalte. Erweitert: Die Banken kommen dazu. Vollständig: Auch der Staat ist dabei.', example: 'Vollständig = 4 Teilnehmer: Unternehmen, Haushalte, Banken, Staat' },
    ],
    learned: ['Kernbeziehung: Arbeitskraft ↔ Einkommen, Güter ↔ Kaufpreis', 'Einfach: U + H · Erweitert: + Banken · Vollständig: + Staat'],
    cases: [
      () =>
        sort(
          'g5-fluss',
          'Was fließt im Kreislauf in welche Richtung?',
          ['Haushalte → Unternehmen', 'Unternehmen → Haushalte'],
          [['Arbeitskraft', 0], ['Kaufpreis für Güter', 0], ['Einkommen', 1], ['Güter', 1]],
          4,
          'Haushalte geben Arbeitskraft und zahlen den Kaufpreis. Unternehmen zahlen Einkommen und liefern Güter.',
        ),
      () =>
        choice(
          'g5-voll',
          'Wer gehört alles zum vollständigen Wirtschaftskreislauf?',
          'Unternehmen, Haushalte, Banken und der Staat',
          ['Nur Unternehmen und Haushalte', 'Unternehmen, Haushalte und Banken'],
          'Vollständiger Wirtschaftskreislauf = 4 Teilnehmer: Unternehmen, Haushalte, Banken, Staat.',
        ),
      () =>
        order(
          'g5-ausbau',
          'Der Kreislauf wächst in drei Schritten. Wer ist wann dabei?',
          ['Unternehmen und Haushalte', 'Die Banken kommen dazu', 'Der Staat kommt dazu'],
          'Einfach: Unternehmen + Haushalte. Erweitert: + Banken. Vollständig: + Staat.',
        ),
      () => {
        const erw = Math.random() < 0.5
        return choice(
          'g5-dazu',
          erw ? 'Wer kommt beim erweiterten Wirtschaftskreislauf neu dazu?' : 'Wer macht aus dem erweiterten den vollständigen Wirtschaftskreislauf?',
          erw ? 'Die Banken' : 'Der Staat',
          [erw ? 'Der Staat' : 'Die Banken', 'Die Haushalte'],
          'Einfach: Unternehmen + Haushalte. Erweitert: + Banken. Vollständig: + Staat.',
        )
      },
      () =>
        choice(
          'g5-kern',
          'Ich arbeite ab morgen in der Bäckerei nebenan. Ich gebe meine Arbeitskraft – und was bekomme ich dafür?',
          'Einkommen',
          ['Güter', 'Subventionen'],
          'Kernbeziehung im Kreislauf: Haushalte geben Arbeitskraft und bekommen dafür Einkommen. Für Güter zahlen sie den Kaufpreis.',
        ),
    ],
  },

  // ───────────────────────────────── Der Markt ─────────────────────────────────
  {
    id: 'm0',
    topicId: M,
    step: 0,
    title: 'Arbeitsteilung',
    cards: [
      { title: 'Arbeitsteilung', text: 'Früher hat jeder alles selbst gemacht. Heute wird eine große Aufgabe in viele kleine Schritte zerlegt, die verschiedene Personen oder Firmen übernehmen. Das geht schneller und besser.' },
      { title: 'Spezialisierung', text: 'Eine Firma oder Person macht nur das, was sie besonders gut kann (Know-how).', example: 'Bauer erntet Tomaten → Fabrik macht Ketchup → Supermarkt verkauft es.' },
      { title: 'Drei Arten', text: 'Innerbetrieblich: Abteilungen oder Mitarbeiter in EINER Firma. National: verschiedene Firmen in einem Land. International: verschiedene Länder.', example: 'Einkauf und Verkauf · Bauer, Molkerei, Supermarkt · Bananen aus Ecuador' },
    ],
    learned: ['Arbeitsteilung: eine Aufgabe in kleine Schritte zerlegen', 'Spezialisierung: nur das machen, was man besonders gut kann', 'Innerbetrieblich · national · international'],
    cases: [
      () =>
        sort(
          'm0-arten',
          'Wer teilt sich hier die Arbeit?',
          ['Innerbetrieblich', 'National', 'International'],
          [
            ['Einkauf, Buchhaltung und Verkauf in einer Firma', 0],
            ['Loopy kocht Bonbons, ihre Aushilfe verkauft sie', 0],
            ['Bauer, Molkerei und Supermarkt in Österreich', 1],
            ['Bananen kommen aus Ecuador', 2],
            ['Das Handy kommt aus China', 2],
          ],
          5,
          'Innerbetrieblich: in EINER Firma. National: verschiedene Firmen in einem Land. International: verschiedene Länder.',
        ),
      () =>
        choice(
          'm0-spez',
          'Loopy macht nur Bonbons – weil sie das besonders gut kann. Das Brot kauft sie beim Bäcker.',
          'Spezialisierung',
          ['Knappheit', 'Maximalprinzip'],
          'Spezialisierung: Eine Firma oder Person macht nur das, was sie besonders gut kann (Know-how).',
          'Wie nennt man das?',
        ),
      () =>
        choice(
          'm0-def',
          'Arbeitsteilung? Was soll das sein, Loopy?',
          'Eine große Aufgabe wird in kleine Schritte zerlegt, die verschiedene Personen oder Firmen übernehmen.',
          ['Jeder macht alles selbst.', 'Der Staat verteilt die Arbeit an alle.'],
          'Arbeitsteilung: Eine große Aufgabe wird in viele kleine Schritte zerlegt, die verschiedene Personen oder Firmen übernehmen. Das geht schneller und besser.',
        ),
      () =>
        order(
          'm0-ketchup',
          'Vom Feld ins Regal: Wer ist beim Ketchup wann dran?',
          ['Der Bauer erntet Tomaten', 'Die Fabrik macht Ketchup', 'Der Supermarkt verkauft es'],
          'Spezialisierung beim Ketchup: Bauer erntet Tomaten → Fabrik macht Ketchup → Supermarkt verkauft es.',
        ),
    ],
  },
  {
    id: 'm1',
    topicId: M,
    step: 1,
    title: 'Wirtschaftssektoren',
    cards: [
      { title: 'Vertikal oder horizontal', text: 'Vertikal: Firmen auf VERSCHIEDENEN Produktionsstufen arbeiten nacheinander am selben Produkt. Horizontal: Firmen auf der GLEICHEN Stufe spezialisieren sich auf verschiedene Produkte.', example: 'Horizontal: Eine Firma macht Brautmode, eine andere Sportkleidung.' },
      { title: 'Beispiel Jeans (vertikal)', text: 'Baumwolle anbauen → Großhandel und Transport → Spinnerei, Weberei, Kleiderfabrik → Transport und Einzelhandel → Kunde.' },
      { title: 'Die Sektoren', text: 'Primär (Urproduktion): Rohstoffe gewinnen. Sekundär (Produktion): Rohstoffe verarbeiten. Tertiär (Dienstleistung): Güter bereitstellen und Dienstleistungen.', example: 'Landwirtschaft · Sägewerk, Tischlerei · Möbelhaus, Friseur' },
      { title: 'Noch zwei', text: 'Heute spricht man auch vom quartären Sektor (Information) und vom quintären Sektor (Entsorgung).' },
    ],
    learned: ['Vertikal = verschiedene Stufen · horizontal = gleiche Stufe, andere Produkte', 'Primär: Rohstoffe · Sekundär: Verarbeitung · Tertiär: Dienstleistung'],
    cases: [
      () =>
        sort(
          'm1-sektoren',
          'In welchen Sektor gehört der Betrieb?',
          ['Primär', 'Sekundär', 'Tertiär'],
          [
            ['Landwirtschaft', 0],
            ['Forstwirtschaft', 0],
            ['Ölförderung', 0],
            ['Sägewerk', 1],
            ['Tischlerei', 1],
            ['Kleiderfabrik', 1],
            ['Möbelhaus', 2],
            ['Friseur', 2],
            ['Einzelhandel', 2],
          ],
          6,
          'Primär (Urproduktion): Rohstoffe gewinnen. Sekundär (Produktion): Rohstoffe verarbeiten. Tertiär (Dienstleistung): Güter bereitstellen und Dienstleistungen.',
        ),
      () =>
        order(
          'm1-jeans',
          'Wie entsteht eine Jeans? Bring die Stufen in die richtige Reihenfolge.',
          ['Baumwolle anbauen', 'Großhandel bringt die Baumwolle zur Fabrik', 'Spinnerei, Weberei, Kleiderfabrik', 'Einzelhandel verkauft die Jeans'],
          'Vertikale Arbeitsteilung bei der Jeans: Urproduktion (Baumwolle) → Dienstleistung (Großhandel, Transport) → Produktion (Spinnerei, Weberei, Kleiderfabrik) → Dienstleistung (Transport, Einzelhandel) → Kunde.',
        ),
      () => {
        const [say, right] = pick([
          ['Eine Firma näht nur Brautmode, eine andere nur Sportkleidung.', 'Horizontale Arbeitsteilung'],
          ['Der Bauer, die Weberei und das Modegeschäft arbeiten nacheinander an derselben Jeans.', 'Vertikale Arbeitsteilung'],
        ])
        return choice('m1-vh', say, right, [right.startsWith('Hor') ? 'Vertikale Arbeitsteilung' : 'Horizontale Arbeitsteilung', 'Innerbetriebliche Arbeitsteilung'], 'Vertikal: verschiedene Produktionsstufen arbeiten nacheinander am selben Produkt. Horizontal: gleiche Stufe, aber verschiedene Produkte.', 'Welche Arbeitsteilung ist das?')
      },
      () =>
        choice(
          'm1-stand',
          'Du stellst deine Bonbons für die Kundschaft bereit und verkaufst sie, Loopy – so wie ein Möbelhaus seine Möbel.',
          'Tertiärer Sektor (Dienstleistung)',
          ['Primärer Sektor (Urproduktion)', 'Sekundärer Sektor (Produktion)'],
          'Tertiärer Sektor: Güter bereitstellen und Dienstleistungen, z. B. Möbelhaus, Friseur. Der Handel gehört dazu.',
          'In welchem Sektor ist der Verkauf?',
        ),
      () => {
        const info = Math.random() < 0.5
        return choice(
          'm1-quartaer',
          info ? 'Mein Sohn arbeitet in der Informationsbranche. Welcher Sektor ist das?' : 'Meine Tochter arbeitet in der Entsorgung. Welcher Sektor ist das?',
          info ? 'Quartärer Sektor' : 'Quintärer Sektor',
          [info ? 'Quintärer Sektor' : 'Quartärer Sektor', 'Primärer Sektor'],
          'Heute spricht man auch vom quartären Sektor (Information) und vom quintären Sektor (Entsorgung).',
        )
      },
    ],
  },
  {
    id: 'm2',
    topicId: M,
    step: 2,
    title: 'Markt, Angebot und Nachfrage',
    cards: [
      { title: 'Markt', text: 'Jeder Ort, an dem Güter gegen Geld getauscht werden. Er kann echt sein (Supermarkt) oder online.' },
      { title: 'Anbieter (Verkäufer)', text: 'Bietet Güter an – das ist das Angebot. Dafür bekommt er Geld.' },
      { title: 'Nachfrager (Käufer)', text: 'Fragt Güter nach – das ist die Nachfrage. Dafür bezahlt er Geld.' },
    ],
    learned: ['Markt = jeder Ort, an dem Güter gegen Geld getauscht werden', 'Anbieter = Angebot · Nachfrager = Nachfrage'],
    cases: [
      () =>
        sort(
          'm2-rolle',
          'Wer bietet an, wer fragt nach?',
          ['Anbieter', 'Nachfrager'],
          [
            ['Loopy verkauft Bonbons am Stand', 0],
            ['Der Lieferant verkauft Zucker an Loopy', 0],
            ['Ein Onlineshop bietet Tassen an', 0],
            ['Frau Kugel kauft Bonbons', 1],
            ['Loopy kauft Zucker beim Lieferanten', 1],
            ['Herr Blubb bestellt eine Tasse', 1],
          ],
          6,
          'Der Anbieter (Verkäufer) bietet Güter an und bekommt Geld. Der Nachfrager (Käufer) fragt Güter nach und bezahlt. Loopy ist am Stand Anbieterin, beim Zuckerkauf Nachfragerin.',
        ),
      () =>
        choice(
          'm2-online',
          'Ich kaufe meine Bonbons jetzt im Internet. Aber ein Onlineshop ist doch kein richtiger Markt, oder?',
          'Doch. Ein Markt ist jeder Ort, an dem Güter gegen Geld getauscht werden – auch online.',
          ['Stimmt, ein Markt braucht immer Stände im Freien.', 'Stimmt, ein Markt ist nur ein Supermarkt.'],
          'Ein Markt ist jeder Ort, an dem Güter gegen Geld getauscht werden. Er kann echt (Supermarkt) oder online sein.',
        ),
      () =>
        choice(
          'm2-nachfrager',
          'Loopy kauft beim Lieferanten einen Sack Zucker für ihre Bonbons.',
          'Loopy – sie fragt den Zucker nach und bezahlt dafür.',
          ['Der Lieferant – er bekommt das Geld.', 'Niemand, das ist kein Markt.'],
          'Der Nachfrager (Käufer) fragt Güter nach und bezahlt dafür. Der Anbieter (Verkäufer) bietet an und bekommt das Geld.',
          'Wer ist hier der Nachfrager?',
        ),
      () =>
        choice(
          'm2-treffen',
          'Heute ist viel los am Wochenmarkt! Was trifft hier eigentlich aufeinander?',
          'Angebot und Nachfrage',
          ['Steuern und Subventionen', 'Primär- und Sekundärbedürfnisse'],
          'Am Markt treffen Angebot (Verkäufer) und Nachfrage (Käufer) aufeinander.',
        ),
    ],
  },
  {
    id: 'm3',
    topicId: M,
    step: 3,
    title: 'Marktarten',
    cards: [
      { title: 'Was wird gehandelt?', text: 'Konsumgütermarkt: Sachgüter für Endverbraucher. Investitionsgütermarkt: Sachgüter für Firmen. Dienstleistungsmarkt: persönlich (Friseur) oder sachlich (Reparatur).', example: 'Kleidung · Maschinen · Friseur' },
      { title: 'Faktormärkte', text: 'Märkte für die Produktionsfaktoren Arbeit, Boden und Kapital: Arbeitsmarkt (Arbeitskraft), Immobilienmarkt (Grundstücke und Gebäude), Kapitalmarkt (Kredite, Geldanlagen).' },
      { title: 'Wie viele machen mit?', text: 'Polypol: viele. Oligopol: wenige. Monopol: einer.', example: 'Kleidung · Mobilfunkanbieter · Glücksspiel (Staat)' },
      { title: 'Marktmacht', text: 'Je weniger Teilnehmer, desto mehr Marktmacht – Preise können künstlich hoch sein.' },
    ],
    learned: ['Märkte nach dem, WAS gehandelt wird – Faktormärkte: Arbeit, Boden, Kapital', 'Polypol (viele) · Oligopol (wenige) · Monopol (einer)'],
    cases: [
      () => {
        const all = [
          ['Loopy sucht eine Aushilfe für den Stand.', 'Arbeitsmarkt'],
          ['Loopy braucht einen Kredit von der Bank.', 'Kapitalmarkt'],
          ['Loopy sucht ein Geschäftslokal für ihren Laden.', 'Immobilienmarkt'],
          ['Loopy kauft eine Maschine für die Bonbonherstellung.', 'Investitionsgütermarkt'],
          ['Ich kaufe mir eine neue Jacke.', 'Konsumgütermarkt'],
          ['Ich gehe heute noch zum Friseur.', 'Dienstleistungsmarkt'],
        ]
        const [say, right] = pick(all)
        const wrong = some(all.map((a) => a[1]).filter((m) => m !== right), 2)
        return choice('m3-markt', say, right, wrong, 'Märkte nach dem, was gehandelt wird: Konsumgüter (für Endverbraucher), Investitionsgüter (für Firmen), Dienstleistungen, Arbeit, Kapital (Kredite, Geldanlagen), Immobilien (Grundstücke, Gebäude).', 'Auf welchem Markt passiert das?')
      },
      () =>
        sort(
          'm3-form',
          'Wie viele Anbieter gibt es? Ordne die Marktform zu.',
          ['Polypol', 'Oligopol', 'Monopol'],
          [
            ['Kleidung: viele Anbieter', 0],
            ['Viele Bonbonstände am Wochenmarkt', 0],
            ['Mobilfunk: wenige Anbieter', 1],
            ['Nur wenige Firmen bieten etwas an', 1],
            ['Glücksspiel: nur der Staat', 2],
            ['Nur ein einziger Anbieter', 2],
          ],
          5,
          'Poly = viele, Oligo = wenige, Mono = einer. Polypol: Kleidung. Oligopol: Mobilfunkanbieter. Monopol: Glücksspiel (Staat).',
        ),
      () =>
        choice(
          'm3-faktor',
          'Arbeit, Boden und Kapital sind Produktionsfaktoren. Welche Märkte gehören zu den Faktormärkten?',
          'Arbeitsmarkt, Immobilienmarkt und Kapitalmarkt',
          ['Konsumgütermarkt und Dienstleistungsmarkt', 'Nur der Wochenmarkt'],
          'Faktormärkte sind Märkte für die Produktionsfaktoren Arbeit, Boden und Kapital: Arbeits-, Immobilien- und Kapitalmarkt.',
        ),
      () =>
        choice(
          'm3-macht',
          'Stell dir vor, Loopy wäre die einzige Bonbonverkäuferin weit und breit – ein Monopol.',
          'Sie hätte viel Marktmacht. Die Preise könnten künstlich hoch sein.',
          ['Die Preise würden von selbst immer sinken.', 'Es würde sich gar nichts ändern.'],
          'Je weniger Teilnehmer, desto mehr Marktmacht – Preise können künstlich hoch sein.',
          'Was könnte dann passieren?',
        ),
    ],
  },
  {
    id: 'm4',
    topicId: M,
    step: 4,
    title: 'Preisbildung',
    cards: [
      { title: 'Preis', text: 'Geld, das man für ein Gut zahlen muss. Der Verkäufer will einen möglichst hohen Preis, der Käufer einen möglichst niedrigen. Der Marktpreis ist der Ausgleich.' },
      { title: 'Nachfragegesetz', text: 'Preis steigt → Nachfrage sinkt. Preis sinkt → Nachfrage steigt.' },
      { title: 'Angebotsgesetz', text: 'Preis steigt → Angebot steigt. Preis sinkt → Angebot sinkt.' },
      { title: 'Gleichgewichtspreis', text: 'Der Preis, bei dem die angebotene Menge gleich der nachgefragten Menge ist (Marktgleichgewicht).' },
    ],
    learned: ['Nachfragegesetz: Preis ↑ → Nachfrage ↓', 'Angebotsgesetz: Preis ↑ → Angebot ↑', 'Gleichgewichtspreis: angebotene Menge = nachgefragte Menge'],
    cases: [
      () => {
        // Nachfrage = a − b·p, Angebot = c + d·p; Gleichgewicht bei einem ganzen Preis zwischen 2 und 6
        const eq = 2 + Math.floor(Math.random() * 5)
        const b = pick([4, 5, 6])
        const d = pick([3, 4, 5])
        const q = 22 + Math.floor(Math.random() * 6)
        return {
          id: 'm4-preis',
          type: 'price',
          say: 'Wie viel soll eine Tüte Bonbons heute kosten? Finde den Gleichgewichtspreis: Dann ist die angebotene Menge gleich der nachgefragten Menge.',
          demand: [q + b * eq, b],
          supply: [q - d * eq, d],
          eq,
          explanation: `Beim Gleichgewichtspreis ist die angebotene Menge gleich der nachgefragten Menge – hier bei ${eq} Münzen. Ist der Preis höher, sinkt die Nachfrage und Ware bleibt übrig. Ist er niedriger, wollen mehr Leute kaufen, als Ware da ist.`,
        }
      },
      () => {
        const [say, right, wrong] = pick([
          ['Du hast die Bonbons teurer gemacht, Loopy! Was passiert jetzt mit der Nachfrage?', 'Die Nachfrage sinkt.', 'Die Nachfrage steigt.'],
          ['Die Bonbons sind heute billiger! Was passiert mit der Nachfrage?', 'Die Nachfrage steigt.', 'Die Nachfrage sinkt.'],
          ['Für Bonbons bekommt man gerade einen hohen Preis. Was machen die Anbieter?', 'Das Angebot steigt.', 'Das Angebot sinkt.'],
          ['Der Preis für Bonbons ist stark gefallen. Was machen die Anbieter?', 'Das Angebot sinkt.', 'Das Angebot steigt.'],
        ])
        return choice('m4-gesetz', say, right, [wrong, 'Es ändert sich nichts.'], 'Nachfragegesetz: Preis steigt → Nachfrage sinkt, Preis sinkt → Nachfrage steigt. Angebotsgesetz: Preis steigt → Angebot steigt, Preis sinkt → Angebot sinkt.')
      },
      () =>
        sort(
          'm4-einfluss',
          'Was beeinflusst den Preis noch? Liegt es beim Verkäufer oder beim Käufer?',
          ['Beim Verkäufer', 'Beim Käufer'],
          [['Produktionskosten', 0], ['Gewinnspanne', 0], ['Preise der Konkurrenz', 0], ['Technologie', 0], ['Einkommen', 1], ['Nutzen des Gutes', 1], ['Dringender Bedarf (Medikamente)', 1]],
          5,
          'Beim Verkäufer: Produktionskosten, Gewinnspanne, Preise der Konkurrenz, Technologie. Beim Käufer: Einkommen, Nutzen des Gutes, dringender Bedarf.',
        ),
      () =>
        choice(
          'm4-gleichgewicht',
          'Heute passt alles, Loopy: Du hast genau so viele Tüten mitgebracht, wie die Leute kaufen wollen.',
          'Der Gleichgewichtspreis',
          ['Der Monopolpreis', 'Der Mindestpreis'],
          'Gleichgewichtspreis: Die angebotene Menge ist gleich der nachgefragten Menge (Marktgleichgewicht).',
          'Wie heißt der Preis, bei dem das so ist?',
        ),
      () =>
        choice(
          'm4-ausgleich',
          'Ich will möglichst wenig zahlen, du willst möglichst viel verlangen. Wie finden wir da zusammen?',
          'Der Marktpreis ist der Ausgleich – er wird vor allem von Angebot und Nachfrage bestimmt.',
          ['Der Käufer bestimmt den Preis allein.', 'Der Verkäufer bestimmt den Preis allein.'],
          'Der Verkäufer will einen möglichst hohen Preis, der Käufer einen möglichst niedrigen. Der Marktpreis ist der Ausgleich und wird vor allem von Angebot und Nachfrage bestimmt.',
        ),
    ],
  },
  {
    id: 'm5',
    topicId: M,
    step: 5,
    title: 'Wirtschaftsordnungen',
    cards: [
      { title: 'Wirtschaftsordnung', text: 'Die Regeln, nach denen die Wirtschaft in einem Land läuft. Der Unterschied: Wie viel bestimmt der Staat?' },
      { title: 'Freie Marktwirtschaft', text: 'Jeder plant selbst. Der Preis entsteht durch Angebot und Nachfrage. Der Staat gibt nur den Rahmen vor. Nachteil: Arm-Reich-Schere.' },
      { title: '(Öko-)Soziale Marktwirtschaft', text: 'Jeder plant selbst, aber der Staat steuert mit: sozial (Familienbeihilfe), beim Wettbewerb (Konsumentenschutz) und ökologisch (Umweltgesetze).', example: 'Österreich, Deutschland' },
      { title: 'Planwirtschaft', text: 'Der Staat plant alles in einem Gesamtplan und bestimmt die Preise. Nachteil: zu viele oder zu wenige Güter.', example: 'Nordkorea, teilweise Kuba' },
      { title: 'Daseinsvorsorge', text: 'Güter und Leistungen, die der Staat für alle bereitstellt.', example: 'Gratis Schulbücher, öffentlicher Verkehr' },
    ],
    learned: ['Freie Marktwirtschaft: Staat gibt nur den Rahmen vor', '(Öko-)Soziale Marktwirtschaft: Staat steuert mit (Österreich)', 'Planwirtschaft: Staat plant alles und bestimmt die Preise'],
    cases: [
      () =>
        sort(
          'm5-ordnung',
          'Zu welcher Wirtschaftsordnung passt das?',
          ['Freie Marktwirtschaft', '(Öko-)Soziale Marktwirtschaft', 'Planwirtschaft'],
          [
            ['Der Staat gibt nur den Rahmen vor', 0],
            ['Nachteil: Arm-Reich-Schere', 0],
            ['Österreich und Deutschland', 1],
            ['Der Staat greift sozial und ökologisch ein', 1],
            ['Familienbeihilfe und Konsumentenschutz', 1],
            ['Der Staat bestimmt die Preise', 2],
            ['Nordkorea', 2],
            ['Nachteil: zu viele oder zu wenige Güter', 2],
          ],
          6,
          'Freie Marktwirtschaft: Staat gibt nur den Rahmen vor. (Öko-)Soziale Marktwirtschaft: Staat steuert sozial und ökologisch mit (Österreich). Planwirtschaft: Staat plant alles und bestimmt die Preise.',
        ),
      () =>
        choice(
          'm5-daseins',
          'Meine Enkelin bekommt ihre Schulbücher gratis und fährt mit dem Bus zur Schule. Wie nennt man solche Leistungen des Staates für alle?',
          'Daseinsvorsorge',
          ['Subvention', 'Planwirtschaft'],
          'Daseinsvorsorge: Güter und Leistungen, die der Staat für alle bereitstellt, z. B. gratis Schulbücher, öffentlicher Verkehr.',
        ),
      () =>
        choice(
          'm5-preis',
          'Wer bestimmt eigentlich bei uns in Österreich, was deine Bonbons kosten?',
          'Angebot und Nachfrage – der Staat steuert nur mit.',
          ['Der Staat legt jeden Preis fest.', 'Die Banken legen die Preise fest.'],
          'In der (Öko-)Sozialen Marktwirtschaft entsteht der Preis durch Angebot und Nachfrage. Jeder plant selbst, der Staat steuert mit.',
        ),
      () =>
        choice(
          'm5-plan',
          'In manchen Ländern plant der Staat alles in einem Gesamtplan und bestimmt auch die Preise.',
          'Planwirtschaft',
          ['Freie Marktwirtschaft', '(Öko-)Soziale Marktwirtschaft'],
          'Planwirtschaft: Der Staat plant alles (Gesamtplan) und bestimmt die Preise. Beispiel: Nordkorea, teilweise Kuba.',
          'Wie heißt diese Wirtschaftsordnung?',
        ),
      () =>
        choice(
          'm5-oesterreich',
          'Welche Wirtschaftsordnung haben wir eigentlich in Österreich, Loopy?',
          '(Öko-)Soziale Marktwirtschaft',
          ['Freie Marktwirtschaft', 'Planwirtschaft'],
          'Österreich und Deutschland haben eine (Öko-)Soziale Marktwirtschaft: Jeder plant selbst, der Staat greift sozial und ökologisch ein.',
        ),
    ],
  },
]

export const lessonById = Object.fromEntries(LESSONS.map((l) => [l.id, l]))
export const ALL_CASES = LESSONS.flatMap((l) => l.cases.map((make, i) => ({ lesson: l, make, index: i, id: make().id })))
export const caseById = Object.fromEntries(ALL_CASES.map((c) => [c.id, c]))
