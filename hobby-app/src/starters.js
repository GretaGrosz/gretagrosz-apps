// Hand-made plans for the onboarding ideas (data.js IDEAS) that had none of their own and borrowed a plan for
// something else ("Read 3 books" got the short-story plan). English, German and Hungarian live right here.
// They have no photo of their own, so they don't show up in the Ideas gallery; they're merged into GUIDES (guides.js)
// and found by name through STARTER_MATCHERS, which are tried before the general ones.
// noVideo: the "watch a 10-minute beginner video" first step would make no sense (a sunrise, reading)

const yt = (en, de, query) => ({
  kind: 'youtube',
  title: { en, de },
  note: { en: 'YouTube playlists', de: 'YouTube-Playlists' },
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D`,
})
const site = (title, url, en, de) => ({ kind: 'site', title: { en: title, de: title }, url, note: { en, de } })

const s = (category, time, cost, en, de, hu, resources = [], extra = {}) => ({
  category,
  time,
  cost,
  title: { en: en[0], de: de[0], hu: hu[0] },
  steps: { en: en[1], de: de[1], hu: hu[1] },
  resources,
  ...extra,
})

export const STARTERS = {
  sketchbook: s(
    'art',
    { en: '1 week', de: '1 Woche', hu: '1 hét' },
    '€',
    [
      'Fill one sketchbook page a day for a week',
      [
        ['Day 1: fill a page with 30 quick objects from your room', 'One minute each, no erasing. Mugs, shoes, plants: whatever is closest.'],
        ['Day 2: draw the view from your window', 'Start with the big shapes (buildings, sky, trees), then add only the details you notice first.'],
        ['Day 3: draw your shoes from three sides', 'Front, side and from above. Look at the shoe more than at the paper.'],
        ['Day 4: draw someone or something that moves', 'A pet, people on the street, a video on pause. Quick lines that catch the pose, not the details.'],
        ['Day 5 and 6: one page from a photo, one from your head', 'Copy a photo you like, then draw a place you’d like to be. Compare the two.'],
        ['Day 7: pick your best page and redo it bigger', 'Use the whole page and take 30 minutes. Then flip through all seven days.'],
      ],
    ],
    [
      'Eine Woche lang jeden Tag eine Skizzenbuchseite',
      [
        ['Tag 1: füll eine Seite mit 30 schnellen Gegenständen aus deinem Zimmer', 'Je eine Minute, nicht radieren. Tassen, Schuhe, Pflanzen: was gerade am nächsten ist.'],
        ['Tag 2: zeichne den Blick aus deinem Fenster', 'Fang mit den großen Formen an (Häuser, Himmel, Bäume) und zeichne dann nur die Details, die dir zuerst auffallen.'],
        ['Tag 3: zeichne deine Schuhe von drei Seiten', 'Von vorne, von der Seite und von oben. Schau öfter auf den Schuh als aufs Papier.'],
        ['Tag 4: zeichne jemanden oder etwas, das sich bewegt', 'Ein Haustier, Leute auf der Straße, ein pausiertes Video. Schnelle Linien für die Haltung, keine Details.'],
        ['Tag 5 und 6: eine Seite nach einem Foto, eine aus dem Kopf', 'Zeichne ein Foto ab, das dir gefällt, dann einen Ort, an dem du gern wärst. Vergleich die beiden.'],
        ['Tag 7: such dir deine beste Seite aus und zeichne sie größer neu', 'Nimm die ganze Seite und 30 Minuten. Dann blätter alle sieben Tage durch.'],
      ],
    ],
    [
      'Egy hétig tölts meg naponta egy oldalt a vázlatfüzetedben',
      [
        ['1. nap: tölts meg egy oldalt 30 gyors tárggyal a szobádból', 'Mindegyikre egy perc, radír nélkül. Bögre, cipő, növény: ami épp a legközelebb van.'],
        ['2. nap: rajzold le, amit az ablakodból látsz', 'Kezdd a nagy formákkal (házak, ég, fák), aztán csak azokat a részleteket rajzold, amik először feltűnnek.'],
        ['3. nap: rajzold le a cipődet három oldalról', 'Elölről, oldalról és felülről. Többet nézd a cipőt, mint a papírt.'],
        ['4. nap: rajzolj le valakit vagy valamit, ami mozog', 'Egy háziállat, emberek az utcán, egy megállított videó. Gyors vonalak a tartásra, részletek nélkül.'],
        ['5. és 6. nap: egy oldal fotóról, egy fejből', 'Másolj le egy fotót, ami tetszik, aztán rajzolj le egy helyet, ahol szívesen lennél. Hasonlítsd össze a kettőt.'],
        ['7. nap: válaszd ki a legjobb oldaladat, és rajzold újra nagyobban', 'Használd az egész oldalt, és szánj rá 30 percet. Aztán lapozd végig mind a hét napot.'],
      ],
    ],
    [yt('Sketchbook ideas for beginners', 'Skizzenbuch-Ideen für Anfänger', 'sketchbook ideas for beginners')],
    { noVideo: true },
  ),

  hand: s(
    'art',
    { en: '1 week', de: '1 Woche', hu: '1 hét' },
    '€',
    [
      'Draw your own hand every day for a week',
      [
        ['Day 1: trace around your hand, then draw it next to the tracing', 'The tracing shows you the real proportions. Fingers are longer than most people draw them.'],
        ['Day 2: draw your hand flat as simple boxes and cylinders', 'A box for the palm, three cylinders for each finger. Shapes first, outline later.'],
        ['Day 3: draw a fist and a pointing hand', 'Five minutes each. Look where the knuckles make a curved line.'],
        ['Day 4: draw your hand holding a pen, a cup and your phone', 'Holding things is the hard part: draw the object first, then the fingers around it.'],
        ['Day 5 and 6: one hand in 30 seconds, ten times in a row', 'Change the pose every time. Speed teaches you to see the main lines.'],
        ['Day 7: one careful drawing with shading, then compare with day 1', 'Take 30 minutes and use one light source. Put day 1 and day 7 side by side.'],
      ],
    ],
    [
      'Zeichne eine Woche lang jeden Tag deine Hand',
      [
        ['Tag 1: fahr deine Hand nach und zeichne sie daneben frei', 'Die Umrisslinie zeigt dir die echten Proportionen. Finger sind länger, als die meisten sie zeichnen.'],
        ['Tag 2: zeichne deine flache Hand aus einfachen Kästen und Zylindern', 'Ein Kasten für die Handfläche, drei Zylinder pro Finger. Erst die Formen, dann der Umriss.'],
        ['Tag 3: zeichne eine Faust und eine zeigende Hand', 'Je fünf Minuten. Schau, wie die Knöchel eine gebogene Linie bilden.'],
        ['Tag 4: zeichne deine Hand mit einem Stift, einer Tasse und deinem Handy', 'Halten ist der schwierige Teil: zeichne zuerst den Gegenstand, dann die Finger drumherum.'],
        ['Tag 5 und 6: zehnmal hintereinander eine Hand in 30 Sekunden', 'Wechsel jedes Mal die Haltung. Tempo bringt dir bei, die Hauptlinien zu sehen.'],
        ['Tag 7: eine sorgfältige Zeichnung mit Schatten, dann vergleich mit Tag 1', 'Nimm dir 30 Minuten und eine Lichtquelle. Leg Tag 1 und Tag 7 nebeneinander.'],
      ],
    ],
    [
      'Rajzold le a saját kezedet egy hétig minden nap',
      [
        ['1. nap: rajzold körbe a kezed, aztán rajzold le mellé szabadkézzel', 'A körberajzolás megmutatja a valódi arányokat. Az ujjak hosszabbak, mint ahogy a legtöbben rajzolják.'],
        ['2. nap: rajzold le a kinyújtott kezed egyszerű dobozokból és hengerekből', 'Egy doboz a tenyérnek, ujjanként három henger. Előbb a formák, aztán a körvonal.'],
        ['3. nap: rajzolj egy öklöt és egy mutató kezet', 'Mindkettőre öt perc. Figyeld meg, hogyan alkotnak a bütykök egy ívelt vonalat.'],
        ['4. nap: rajzold le a kezed, ahogy egy tollat, egy bögrét és a telefonodat fogja', 'A fogás a nehéz rész: előbb a tárgyat rajzold le, aztán köré az ujjakat.'],
        ['5. és 6. nap: tízszer egymás után egy kéz 30 másodperc alatt', 'Minden alkalommal változtass a tartáson. A gyorsaság megtanít meglátni a fő vonalakat.'],
        ['7. nap: egy gondos rajz árnyékolással, aztán hasonlítsd össze az 1. nappal', 'Szánj rá 30 percet, és egy fényforrást használj. Tedd egymás mellé az 1. és a 7. napot.'],
      ],
    ],
    [yt('How to draw hands', 'Hände zeichnen lernen', 'how to draw hands for beginners')],
  ),

  ferrata: s(
    'outdoors',
    { en: '2–4 weeks', de: '2–4 Wochen', hu: '2–4 hét' },
    '€€',
    [
      'Climb your first via ferrata with a guide',
      [
        ['Find a mountain guide or Alpine club tour for beginners', 'Search “via ferrata beginner course” plus your region. Alpine clubs (Alpenverein, ÖAV, DAV) have cheap youth tours.'],
        ['Book a date and ask what gear is included', 'Usually the guide lends you a harness, a via ferrata set and a helmet. Ask about the minimum age and if a parent must sign.'],
        ['Get ready: walk uphill for an hour twice this week', 'Stairs or a hill with a backpack. Via ferratas are mostly walking uphill, with short climbing parts.'],
        ['Pack: sturdy shoes, gloves, water, snacks and a rain jacket', 'Shoes with a good grip (hiking or approach shoes). Cheap bike or garden gloves protect your hands on the cable.'],
        ['Do the tour and clip in at every anchor', 'Always one carabiner on the cable. The guide shows you how; say it out loud when you switch: “one, two”.'],
        ['Take a photo at the top and write down the route name and grade', 'Grades go from A (easy) to E. Note what felt hard, so you can pick your next one.'],
      ],
    ],
    [
      'Geh deinen ersten Klettersteig mit einem Guide',
      [
        ['Such einen Bergführer oder eine Alpenvereinstour für Anfänger', 'Such nach „Klettersteig Anfängerkurs“ und deiner Region. Alpenvereine (ÖAV, DAV) haben günstige Jugendtouren.'],
        ['Buch einen Termin und frag, welche Ausrüstung dabei ist', 'Meist leiht dir der Guide Gurt, Klettersteigset und Helm. Frag nach dem Mindestalter und ob ein Elternteil unterschreiben muss.'],
        ['Mach dich fit: diese Woche zweimal eine Stunde bergauf gehen', 'Treppen oder ein Hügel mit Rucksack. Klettersteige sind meist Gehen bergauf mit kurzen Kletterstellen.'],
        ['Pack ein: feste Schuhe, Handschuhe, Wasser, Snacks und eine Regenjacke', 'Schuhe mit gutem Profil (Wander- oder Zustiegsschuhe). Billige Rad- oder Gartenhandschuhe schützen deine Hände am Seil.'],
        ['Geh die Tour und häng dich an jedem Anker richtig um', 'Immer ein Karabiner am Seil. Der Guide zeigt es dir; sag beim Umhängen laut mit: „eins, zwei“.'],
        ['Mach oben ein Foto und schreib dir Namen und Schwierigkeit der Route auf', 'Die Skala geht von A (leicht) bis E. Notier, was schwer war, damit du den nächsten aussuchen kannst.'],
      ],
    ],
    [
      'Mássz meg egy vasalt utat egy vezetővel',
      [
        ['Keress hegyivezetőt vagy kezdő túrát egy hegymászó egyesületnél', 'Keress rá: „via ferrata kezdő tanfolyam” és a környéked. Az alpesi egyesületeknek (ÖAV, DAV, MHSSZ) olcsó ifjúsági túráik vannak.'],
        ['Foglalj időpontot, és kérdezd meg, milyen felszerelés van benne', 'A vezető általában kölcsönad beülőt, ferratakészletet és sisakot. Kérdezd meg a korhatárt, és hogy kell-e szülői aláírás.'],
        ['Készülj fel: a héten kétszer menj egy órát felfelé', 'Lépcső vagy domb, hátizsákkal. A vasalt utak nagy része felfelé gyaloglás, rövid mászós részekkel.'],
        ['Pakold be: erős cipő, kesztyű, víz, nasi és esőkabát', 'Jól tapadó talpú cipő (túra- vagy megközelítő cipő). Egy olcsó bicikliskesztyű vagy kerti kesztyű megvédi a kezed a kötélen.'],
        ['Menj végig a túrán, és minden rögzítési pontnál akassz át rendesen', 'Mindig legyen egy karabiner a kötélen. A vezető megmutatja; átakasztáskor mondd ki hangosan: „egy, kettő”.'],
        ['Fotózz a csúcson, és írd fel az út nevét és nehézségét', 'A skála A-tól (könnyű) E-ig tart. Jegyezd fel, mi volt nehéz, hogy ki tudd választani a következőt.'],
      ],
    ],
    [site('Bergsteigen.com', 'https://www.bergsteigen.com/touren/klettersteig/', 'Via ferrata routes with grades', 'Klettersteige mit Schwierigkeit')],
    { noVideo: true },
  ),

  origami: s(
    'crafts',
    { en: '1–2 weeks', de: '1–2 Wochen', hu: '1–2 hét' },
    'Free',
    [
      'Fold 10 different origami animals',
      [
        ['Cut 20 squares of paper, 15 × 15 cm', 'Any thin paper works: printer paper, old magazines, wrapping paper. Fold one corner to the opposite edge and cut off the strip.'],
        ['Learn the valley fold, mountain fold and squash fold', 'Valley folds towards you, mountain folds away. Crease every fold sharply with your fingernail.'],
        ['Fold 3 easy animals: a fox face, a cat face and a whale', 'Each takes under 10 folds. Look up “easy origami fox” and fold along with the video.'],
        ['Fold a jumping frog and a penguin', 'Press the frog’s back and it jumps. If a fold looks wrong, unfold one step and try again.'],
        ['Fold a crane', 'The classic: it uses the bird base. It may take three tries. That’s normal.'],
        ['Fold 3 animals of your choice and line all 10 up for a photo', 'A butterfly, a rabbit, a dog, anything. Put them in a row from easiest to hardest.'],
      ],
    ],
    [
      'Falte 10 verschiedene Origami-Tiere',
      [
        ['Schneid 20 Quadrate Papier, 15 × 15 cm', 'Jedes dünne Papier geht: Druckerpapier, alte Zeitschriften, Geschenkpapier. Falte eine Ecke auf die gegenüberliegende Kante und schneid den Streifen ab.'],
        ['Lern Talfalte, Bergfalte und Quetschfalte', 'Talfalten gehen zu dir hin, Bergfalten von dir weg. Zieh jeden Knick mit dem Fingernagel scharf nach.'],
        ['Falte 3 leichte Tiere: einen Fuchskopf, einen Katzenkopf und einen Wal', 'Jedes braucht unter 10 Faltungen. Such nach „Origami Fuchs einfach“ und falte mit dem Video mit.'],
        ['Falte einen springenden Frosch und einen Pinguin', 'Drück dem Frosch auf den Rücken, dann springt er. Sieht eine Falte falsch aus, geh einen Schritt zurück.'],
        ['Falte einen Kranich', 'Der Klassiker: er baut auf der Vogelbasis auf. Es kann drei Versuche dauern. Das ist normal.'],
        ['Falte 3 Tiere deiner Wahl und stell alle 10 für ein Foto auf', 'Ein Schmetterling, ein Hase, ein Hund, egal was. Stell sie vom leichtesten zum schwersten auf.'],
      ],
    ],
    [
      'Hajtogass 10 különböző origami állatot',
      [
        ['Vágj ki 20 papírnégyzetet, 15 × 15 cm-eset', 'Bármilyen vékony papír jó: nyomtatópapír, régi újság, csomagolópapír. Hajtsd az egyik sarkot a szemközti szélhez, és vágd le a csíkot.'],
        ['Tanuld meg a völgyhajtást, a hegyhajtást és a lapítóhajtást', 'A völgyhajtás feléd, a hegyhajtás tőled el hajlik. Minden hajtást húzz meg élesen a körmöddel.'],
        ['Hajtogass 3 könnyű állatot: rókafejet, macskafejet és bálnát', 'Mindegyik 10-nél kevesebb hajtás. Keress rá: „easy origami fox”, és hajtogass együtt a videóval.'],
        ['Hajtogass egy ugráló békát és egy pingvint', 'Nyomd meg a béka hátát, és ugrik. Ha egy hajtás rossznak tűnik, bontsd vissza egy lépéssel.'],
        ['Hajtogass egy darut', 'A klasszikus: a madáralapra épül. Lehet, hogy három próba kell hozzá. Ez teljesen normális.'],
        ['Hajtogass 3 állatot, amit te választasz, és állítsd fel mind a 10-et egy fotóhoz', 'Pillangó, nyúl, kutya, bármi. Állítsd sorba őket a legkönnyebbtől a legnehezebbig.'],
      ],
    ],
    [yt('Easy origami animals', 'Einfache Origami-Tiere', 'easy origami animals for beginners')],
  ),

  words: s(
    'learn',
    { en: '3–4 weeks', de: '3–4 Wochen', hu: '3–4 hét' },
    'Free',
    [
      'Learn 100 words in a new language',
      [
        ['Pick the language and install a free flashcard app', 'Anki or Quizlet for your own cards, or Duolingo to start. Choose a language you can hear somewhere: songs, series, family.'],
        ['Learn the 20 most useful words: greetings, numbers, yes, no, please', 'Search “100 most common words” plus the language. Say each word out loud, don’t just read it.'],
        ['Add 10 words a day for a week, about things around you', 'Your room, food, school. Label 5 things at home with sticky notes.'],
        ['Repeat your cards every day, even on days without new words', '5 minutes is enough. The app shows you the hard ones more often.'],
        ['Write 5 short sentences using your words', 'Like “I eat bread” or “My room is small”. Check them with a translator, then fix them.'],
        ['Test yourself on all 100 and say 10 of them to someone', 'Count how many you know without looking. A voice message to a friend counts.'],
      ],
    ],
    [
      'Lern 100 Wörter in einer neuen Sprache',
      [
        ['Wähl die Sprache und installier eine kostenlose Karteikarten-App', 'Anki oder Quizlet für eigene Karten, oder Duolingo zum Einstieg. Nimm eine Sprache, die du irgendwo hörst: Songs, Serien, Familie.'],
        ['Lern die 20 nützlichsten Wörter: Grüße, Zahlen, ja, nein, bitte', 'Such nach „100 häufigste Wörter“ und der Sprache. Sag jedes Wort laut, lies es nicht nur.'],
        ['Lern eine Woche lang jeden Tag 10 Wörter über Dinge um dich herum', 'Dein Zimmer, Essen, Schule. Kleb Zettel auf 5 Dinge zu Hause.'],
        ['Wiederhol deine Karten jeden Tag, auch an Tagen ohne neue Wörter', '5 Minuten reichen. Die App zeigt dir die schwierigen öfter.'],
        ['Schreib 5 kurze Sätze mit deinen Wörtern', 'Etwa „Ich esse Brot“ oder „Mein Zimmer ist klein“. Prüf sie mit einem Übersetzer und verbessere sie.'],
        ['Teste dich bei allen 100 und sag 10 davon jemandem', 'Zähl, wie viele du ohne Nachschauen weißt. Eine Sprachnachricht an eine Freundin zählt.'],
      ],
    ],
    [
      'Tanulj meg 100 szót egy új nyelven',
      [
        ['Válaszd ki a nyelvet, és telepíts egy ingyenes szókártyás appot', 'Anki vagy Quizlet a saját kártyáidhoz, vagy Duolingo a kezdéshez. Olyan nyelvet válassz, amit hallasz valahol: zene, sorozat, család.'],
        ['Tanuld meg a 20 leghasznosabb szót: köszönés, számok, igen, nem, kérem', 'Keress rá: „100 leggyakoribb szó” és a nyelv. Minden szót mondj ki hangosan, ne csak olvasd.'],
        ['Egy hétig tanulj naponta 10 szót a körülötted lévő dolgokról', 'A szobád, ételek, iskola. Ragassz cetlit 5 tárgyra otthon.'],
        ['Ismételd a kártyáidat minden nap, akkor is, ha nincs új szó', '5 perc elég. Az app a nehezebbeket gyakrabban mutatja.'],
        ['Írj 5 rövid mondatot a szavaiddal', 'Például „Kenyeret eszem” vagy „Kicsi a szobám”. Ellenőrizd fordítóval, és javítsd ki őket.'],
        ['Kérdezd ki magad mind a 100-ból, és mondj el 10-et valakinek', 'Számold meg, hányat tudsz puskázás nélkül. Egy hangüzenet egy barátnak is számít.'],
      ],
    ],
    [site('Anki', 'https://apps.ankiweb.net/', 'Free flashcards that repeat at the right time', 'Kostenlose Karteikarten, die zur richtigen Zeit wiederholen')],
  ),

  chess: s(
    'learn',
    { en: '3–4 weeks', de: '3–4 Wochen', hu: '3–4 hét' },
    'Free',
    [
      'Learn chess and win your first game',
      [
        ['Learn how every piece moves on lichess.org/learn', 'Free and without an account. Do all the lessons in the “Chess pieces” part.'],
        ['Learn check, checkmate, castling and stalemate', 'Same site, “Fundamentals”. Checkmate the king with a queen and a rook against nothing else.'],
        ['Learn 3 opening rules and play 5 games against the computer', 'Control the centre, bring out knights and bishops, castle early. Pick the easiest computer level.'],
        ['Solve 10 puzzles a day for 5 days', 'lichess.org/training. Puzzles teach you to spot moves that win a piece.'],
        ['Before every move, check what your opponent just threatened', 'Most games between beginners are lost by leaving a piece undefended. Ask: “What does that move attack?”'],
        ['Play people your level until you win a game', 'Online on lichess (10-minute games) or a friend at school. Take a screenshot or photo of the winning position.'],
      ],
    ],
    [
      'Lern Schach und gewinn deine erste Partie',
      [
        ['Lern auf lichess.org/learn, wie jede Figur zieht', 'Kostenlos und ohne Konto. Mach alle Lektionen im Teil „Schachfiguren“.'],
        ['Lern Schach, Schachmatt, Rochade und Patt', 'Gleiche Seite, „Grundlagen“. Setz den König mit Dame und Turm matt.'],
        ['Lern 3 Eröffnungsregeln und spiel 5 Partien gegen den Computer', 'Kontrollier das Zentrum, bring Springer und Läufer raus, rochier früh. Nimm die leichteste Stufe.'],
        ['Löse 5 Tage lang jeden Tag 10 Aufgaben', 'lichess.org/training. Aufgaben bringen dir bei, Züge zu sehen, die eine Figur gewinnen.'],
        ['Schau vor jedem Zug, was dein Gegner gerade bedroht', 'Die meisten Anfängerpartien gehen verloren, weil eine Figur ungedeckt steht. Frag dich: „Was greift dieser Zug an?“'],
        ['Spiel gegen Leute auf deinem Niveau, bis du eine Partie gewinnst', 'Online auf lichess (10-Minuten-Partien) oder gegen jemanden aus der Schule. Mach ein Foto von der Gewinnstellung.'],
      ],
    ],
    [
      'Tanulj meg sakkozni, és nyerd meg az első játszmádat',
      [
        ['Tanuld meg a lichess.org/learn oldalon, hogyan lép minden bábu', 'Ingyenes, fiók sem kell. Csináld végig a „Sakkbábuk” rész összes leckéjét.'],
        ['Tanuld meg a sakkot, a mattot, a sáncolást és a pattot', 'Ugyanott, „Alapok”. Adj mattot a királynak vezérrel és bástyával.'],
        ['Tanulj meg 3 megnyitási szabályt, és játssz 5 játszmát a gép ellen', 'Uraljad a centrumot, hozd ki a huszárokat és a futókat, sáncolj korán. A legkönnyebb szintet válaszd.'],
        ['5 napig oldj meg naponta 10 feladványt', 'lichess.org/training. A feladványokból megtanulod észrevenni a bábunyerő lépéseket.'],
        ['Minden lépésed előtt nézd meg, mit fenyeget az ellenfeled', 'A kezdők játszmái többnyire azért vesznek el, mert egy bábu védtelen marad. Kérdezd meg: „Mit támad ez a lépés?”'],
        ['Játssz a szintedhez illő ellenfelekkel, amíg nem nyersz egy játszmát', 'Online a lichessen (10 perces játszmák) vagy valakivel a suliban. Fotózd le a nyerő állást.'],
      ],
    ],
    [site('Lichess', 'https://lichess.org/learn', 'Free lessons, puzzles and games', 'Kostenlose Lektionen, Aufgaben und Partien')],
    { noVideo: true },
  ),

  rubik: s(
    'learn',
    { en: '2–3 weeks', de: '2–3 Wochen', hu: '2–3 hét' },
    '€',
    [
      'Solve a Rubik’s cube on your own',
      [
        ['Get a 3 × 3 cube and learn the move names (R, L, U, D, F, B)', 'A cheap speed cube turns more easily than an old one. R means turn the right side clockwise; R′ means the other way.'],
        ['Make the white cross on top', 'Match each white edge with the centre colour on its side. Work it out slowly; there’s no formula for this part.'],
        ['Finish the white side with the white corners', 'Learn one move sequence: R U R′ U′. Repeat it until the corner drops into place.'],
        ['Solve the 4 middle-layer edges', 'U R U′ R′ U′ F′ U F moves an edge down to the right; mirror it to go left. Write both on a sticky note.'],
        ['Make the yellow cross, then the whole yellow side', 'F R U R′ U′ F′ for the cross. Then the corner sequence again until the top is yellow.'],
        ['Put the last corners and edges in place and solve it without help', 'Mix it up and solve it with your notes, then try without them. Time yourself and film the last turn.'],
      ],
    ],
    [
      'Lös einen Zauberwürfel allein',
      [
        ['Besorg dir einen 3 × 3 Würfel und lern die Zugnamen (R, L, U, D, F, B)', 'Ein günstiger Speedcube dreht sich leichter als ein alter. R heißt rechte Seite im Uhrzeigersinn; R′ in die andere Richtung.'],
        ['Mach das weiße Kreuz oben', 'Bring jede weiße Kante zur Mittelfarbe ihrer Seite. Probier langsam; für diesen Teil gibt es keine Formel.'],
        ['Mach die weiße Seite mit den weißen Ecken fertig', 'Lern eine Zugfolge: R U R′ U′. Wiederhol sie, bis die Ecke an ihren Platz fällt.'],
        ['Löse die 4 Kanten der mittleren Ebene', 'U R U′ R′ U′ F′ U F bringt eine Kante nach rechts unten, gespiegelt geht sie nach links. Schreib beide auf einen Zettel.'],
        ['Mach das gelbe Kreuz und dann die ganze gelbe Seite', 'F R U R′ U′ F′ für das Kreuz. Dann wieder die Eckenfolge, bis oben alles gelb ist.'],
        ['Bring die letzten Ecken und Kanten an ihren Platz und lös ihn ohne Hilfe', 'Verdreh ihn und lös ihn mit deinen Notizen, dann ohne. Stopp die Zeit und film die letzte Drehung.'],
      ],
    ],
    [
      'Rakd ki egyedül a Rubik-kockát',
      [
        ['Szerezz egy 3 × 3-as kockát, és tanuld meg a lépések nevét (R, L, U, D, F, B)', 'Egy olcsó speedcube könnyebben forog, mint egy régi. Az R a jobb oldal elforgatása az óramutató irányába; az R′ a másik irányba.'],
        ['Rakd ki a fehér keresztet felül', 'Minden fehér élt vigyél az oldala középső színéhez. Lassan próbálgasd; ehhez a részhez nincs képlet.'],
        ['Fejezd be a fehér oldalt a fehér sarkokkal', 'Tanulj meg egy lépéssort: R U R′ U′. Ismételd, amíg a sarok a helyére nem kerül.'],
        ['Rakd ki a középső sor 4 élét', 'Az U R U′ R′ U′ F′ U F egy élt jobbra lent a helyére visz, a tükörképe balra. Írd fel mindkettőt egy cetlire.'],
        ['Rakd ki a sárga keresztet, aztán az egész sárga oldalt', 'F R U R′ U′ F′ a kereszthez. Aztán újra a saroklépéssor, amíg felül minden sárga nem lesz.'],
        ['Tedd a helyére az utolsó sarkokat és éleket, és rakd ki segítség nélkül', 'Keverd össze, és rakd ki a jegyzeteiddel, aztán nélkülük. Mérd az időt, és vedd videóra az utolsó forgatást.'],
      ],
    ],
    [yt('Rubik’s cube beginner method', 'Zauberwürfel Anfängermethode', 'rubiks cube beginner method')],
  ),

  reading: s(
    'learn',
    { en: '1 month', de: '1 Monat', hu: '1 hónap' },
    'Free',
    [
      'Read 3 books in a month',
      [
        ['Pick 3 books you actually want to read', 'Ask a friend, a librarian or BookTok. Shorter books (under 300 pages) are fine. Get them from the library.'],
        ['Find your daily reading time: 20 minutes', 'Before bed, on the bus, after school. Put your phone in another room or on airplane mode.'],
        ['Finish book 1 by day 10', 'About 25 pages a day. If you don’t like it after 50 pages, switch: that still counts.'],
        ['Write 3 sentences about book 1: what happened, what you liked, who should read it', 'In a notebook or in your notes app. It helps you remember the book for years.'],
        ['Finish book 2 by day 20 and book 3 by day 30', 'Keep the same reading time. Behind? Read 40 minutes on the weekend.'],
        ['Take a photo of all 3 books and tell someone which one was best', 'Stack them up for the photo. Recommend the best one to a friend.'],
      ],
    ],
    [
      'Lies 3 Bücher in einem Monat',
      [
        ['Such dir 3 Bücher aus, die du wirklich lesen willst', 'Frag eine Freundin, in der Bücherei oder auf BookTok. Kürzere Bücher (unter 300 Seiten) sind okay. Leih sie in der Bücherei aus.'],
        ['Find deine tägliche Lesezeit: 20 Minuten', 'Vor dem Schlafen, im Bus, nach der Schule. Leg dein Handy in ein anderes Zimmer oder schalt den Flugmodus ein.'],
        ['Lies Buch 1 bis Tag 10 fertig', 'Etwa 25 Seiten am Tag. Gefällt es dir nach 50 Seiten nicht, wechsle: das zählt trotzdem.'],
        ['Schreib 3 Sätze über Buch 1: was passiert, was dir gefallen hat, wer es lesen sollte', 'In ein Heft oder in deine Notizen-App. So bleibt dir das Buch jahrelang im Kopf.'],
        ['Lies Buch 2 bis Tag 20 und Buch 3 bis Tag 30', 'Bleib bei deiner Lesezeit. Hinterher? Lies am Wochenende 40 Minuten.'],
        ['Mach ein Foto von allen 3 Büchern und erzähl jemandem, welches das beste war', 'Stapel sie fürs Foto. Empfiehl das beste einer Freundin.'],
      ],
    ],
    [
      'Olvass el 3 könyvet egy hónap alatt',
      [
        ['Válassz 3 könyvet, amit tényleg el akarsz olvasni', 'Kérdezz meg egy barátot, a könyvtárost, vagy nézz BookTokot. A rövidebb könyvek (300 oldal alatt) is jók. Kölcsönözd ki őket a könyvtárból.'],
        ['Találd meg a napi olvasási idődet: 20 perc', 'Lefekvés előtt, a buszon, suli után. Tedd a telefonodat egy másik szobába, vagy kapcsold repülő módba.'],
        ['Olvasd ki az 1. könyvet a 10. napig', 'Nagyjából napi 25 oldal. Ha 50 oldal után sem tetszik, válts: az is számít.'],
        ['Írj 3 mondatot az 1. könyvről: mi történt, mi tetszett, kinek ajánlanád', 'Egy füzetbe vagy a jegyzetek appba. Így évekig emlékezni fogsz rá.'],
        ['Olvasd ki a 2. könyvet a 20. napig, a 3.-at a 30. napig', 'Tartsd meg az olvasási idődet. Lemaradtál? Hétvégén olvass 40 percet.'],
        ['Fotózd le mind a 3 könyvet, és mondd el valakinek, melyik volt a legjobb', 'Rakd őket egy kupacba a fotóhoz. A legjobbat ajánld egy barátodnak.'],
      ],
    ],
    [site('Goodreads', 'https://www.goodreads.com/', 'Find books and see what others thought', 'Bücher finden und sehen, wie sie anderen gefallen haben')],
    { noVideo: true },
  ),

  sunrise: s(
    'outdoors',
    { en: '1 week', de: '1 Woche', hu: '1 hét' },
    'Free',
    [
      'Watch the sunrise from somewhere new',
      [
        ['Pick a spot with a view to the east', 'A hill, a bridge, a lake, a high floor. Check on a map which way is east and that you can get there in the dark.'],
        ['Look up tomorrow’s sunrise time and set two alarms', 'Search “sunrise” plus your town. Be there 20 minutes before: the sky is most colourful just before the sun appears.'],
        ['Tell someone where you’re going, or take a friend', 'Send your parents the spot and time. Bring a torch or use your phone light on the way.'],
        ['Pack warm clothes, a blanket and something hot to drink', 'Mornings are colder than you think, even in summer.'],
        ['Watch it with your phone in your pocket for 5 minutes', 'Then take your photos. Notice the colours change from blue to pink to gold.'],
        ['Write down the place, time and one thing you noticed', 'Add your best photo. Choose where to go next time.'],
      ],
    ],
    [
      'Schau dir den Sonnenaufgang an einem neuen Ort an',
      [
        ['Such dir einen Platz mit Blick nach Osten', 'Ein Hügel, eine Brücke, ein See, ein hohes Stockwerk. Schau auf der Karte, wo Osten ist und ob du im Dunkeln hinkommst.'],
        ['Schau nach, wann morgen die Sonne aufgeht, und stell zwei Wecker', 'Such nach „Sonnenaufgang“ und deinem Ort. Sei 20 Minuten früher da: kurz bevor die Sonne kommt, ist der Himmel am buntesten.'],
        ['Sag jemandem, wohin du gehst, oder nimm eine Freundin mit', 'Schick deinen Eltern Ort und Uhrzeit. Nimm eine Taschenlampe mit oder nutz das Handylicht.'],
        ['Pack warme Kleidung, eine Decke und etwas Heißes zu trinken ein', 'Morgens ist es kälter, als du denkst, auch im Sommer.'],
        ['Schau 5 Minuten zu, das Handy in der Tasche', 'Mach danach deine Fotos. Achte darauf, wie die Farben von Blau über Rosa zu Gold wechseln.'],
        ['Schreib Ort, Uhrzeit und eine Sache auf, die dir aufgefallen ist', 'Füg dein bestes Foto dazu. Such dir aus, wohin du nächstes Mal gehst.'],
      ],
    ],
    [
      'Nézd meg a napfelkeltét egy új helyről',
      [
        ['Válassz egy helyet, ahonnan kelet felé látsz', 'Egy domb, egy híd, egy tó, egy magas emelet. Nézd meg a térképen, merre van kelet, és hogy sötétben is oda tudsz-e jutni.'],
        ['Nézd meg, mikor kel fel holnap a nap, és állíts be két ébresztőt', 'Keress rá: „napkelte” és a településed. Érj oda 20 perccel előtte: az ég közvetlenül a napfelkelte előtt a legszínesebb.'],
        ['Szólj valakinek, hová mész, vagy vigyél magaddal egy barátot', 'Küldd el a szüleidnek a helyet és az időpontot. Vigyél zseblámpát, vagy használd a telefonod lámpáját.'],
        ['Pakolj be meleg ruhát, egy takarót és valami forró italt', 'Reggel hidegebb van, mint gondolnád, nyáron is.'],
        ['Nézd 5 percig úgy, hogy a telefonod a zsebedben van', 'Utána fotózz. Figyeld meg, ahogy a színek kékből rózsaszínbe, majd aranyba váltanak.'],
        ['Írd fel a helyet, az időt és egy dolgot, ami feltűnt', 'Tedd mellé a legjobb fotódat. Válaszd ki, hová mész legközelebb.'],
      ],
    ],
    [],
    { noVideo: true },
  ),

  pushups: s(
    'fitness',
    { en: '1 month', de: '1 Monat', hu: '1 hónap' },
    'Free',
    [
      'Do 20 push-ups in a row by the end of the month',
      [
        ['Test yourself: how many clean push-ups can you do today?', 'Body straight from head to heels, chest almost to the floor. Write the number and the date down.'],
        ['Learn the easier versions: wall, table and knee push-ups', 'If you can’t do 5 full ones, start with the hardest version where you can do 10.'],
        ['Train every other day: 4 sets, 1 minute rest in between', 'Each set: as many clean ones as you can, minus one or two. Rest days make you stronger.'],
        ['Add one push-up to every set each week', 'Week 1: 4 × 5, week 2: 4 × 6 and so on. Slow and clean beats fast and sloppy.'],
        ['Test yourself again after 2 weeks', 'Same rules as on day 1. Compare with your first number.'],
        ['Do 20 in a row and film it', 'Rest two days before the try. Count out loud.'],
      ],
    ],
    [
      'Schaff bis Monatsende 20 Liegestütze am Stück',
      [
        ['Teste dich: wie viele saubere Liegestütze schaffst du heute?', 'Körper gerade von Kopf bis Ferse, Brust fast bis zum Boden. Schreib Zahl und Datum auf.'],
        ['Lern die leichteren Varianten: an der Wand, am Tisch und auf den Knien', 'Schaffst du keine 5 ganzen, fang mit der schwersten Variante an, bei der du 10 schaffst.'],
        ['Trainier jeden zweiten Tag: 4 Sätze, 1 Minute Pause dazwischen', 'Jeder Satz: so viele saubere, wie du kannst, minus ein oder zwei. Ruhetage machen dich stärker.'],
        ['Mach jede Woche pro Satz einen Liegestütz mehr', 'Woche 1: 4 × 5, Woche 2: 4 × 6 und so weiter. Langsam und sauber schlägt schnell und schlampig.'],
        ['Teste dich nach 2 Wochen noch einmal', 'Gleiche Regeln wie am ersten Tag. Vergleich mit deiner ersten Zahl.'],
        ['Mach 20 am Stück und film es', 'Mach vor dem Versuch zwei Tage Pause. Zähl laut mit.'],
      ],
    ],
    [
      'Csinálj meg 20 fekvőtámaszt egyben a hónap végéig',
      [
        ['Teszteld magad: hány szabályos fekvőtámaszt tudsz ma?', 'A tested legyen egyenes a fejedtől a sarkadig, a mellkasod majdnem érje a földet. Írd fel a számot és a dátumot.'],
        ['Tanuld meg a könnyebb változatokat: falnál, asztalnál és térdelve', 'Ha 5 teljeset sem tudsz, azzal a legnehezebb változattal kezdd, amiből 10 megy.'],
        ['Edzz minden második nap: 4 sorozat, köztük 1 perc pihenő', 'Minden sorozat: annyi szabályos, amennyit bírsz, mínusz egy-kettő. A pihenőnapoktól leszel erősebb.'],
        ['Minden héten tegyél minden sorozathoz egy fekvőtámaszt', '1. hét: 4 × 5, 2. hét: 4 × 6 és így tovább. A lassú és szabályos többet ér, mint a gyors és hanyag.'],
        ['2 hét múlva teszteld magad újra', 'Ugyanazokkal a szabályokkal, mint az első napon. Hasonlítsd össze az első számoddal.'],
        ['Csinálj meg 20-at egyben, és vedd videóra', 'A próba előtt pihenj két napot. Számolj hangosan.'],
      ],
    ],
    [yt('Push-up progression for beginners', 'Liegestütze lernen für Anfänger', 'push up progression for beginners')],
  ),

  yoga: s(
    'fitness',
    { en: '1 week', de: '1 Woche', hu: '1 hét' },
    'Free',
    [
      'Try 10 minutes of yoga every day for a week',
      [
        ['Find a 10-minute beginner yoga video and a spot on the floor', 'Search “10 minute yoga for beginners”. A towel works if you don’t have a mat.'],
        ['Day 1: do the video slowly and only as far as feels good', 'Yoga shouldn’t hurt. Breathe through your nose and don’t hold your breath.'],
        ['Day 2 and 3: same video, same time of day', 'Repeating it lets you watch your body instead of the screen.'],
        ['Day 4: learn downward dog, child’s pose and cat-cow properly', 'Hold each for 5 slow breaths. These come back in almost every class.'],
        ['Day 5 and 6: try a different 10-minute video each day', 'One for the morning, one for before bed. Notice which you like more.'],
        ['Day 7: do 10 minutes without a video and write down how you feel', 'String together the poses you remember. Compare with day 1: what got easier?'],
      ],
    ],
    [
      'Mach eine Woche lang jeden Tag 10 Minuten Yoga',
      [
        ['Such ein 10-minütiges Anfänger-Yogavideo und einen Platz am Boden', 'Such nach „10 Minuten Yoga Anfänger“. Ohne Matte geht auch ein Handtuch.'],
        ['Tag 1: mach das Video langsam mit und nur so weit, wie es sich gut anfühlt', 'Yoga soll nicht wehtun. Atme durch die Nase und halt die Luft nicht an.'],
        ['Tag 2 und 3: dasselbe Video zur selben Tageszeit', 'Durchs Wiederholen kannst du auf deinen Körper achten statt auf den Bildschirm.'],
        ['Tag 4: lern den herabschauenden Hund, die Kindhaltung und Katze-Kuh richtig', 'Halt jede Haltung 5 langsame Atemzüge lang. Sie kommen in fast jeder Stunde vor.'],
        ['Tag 5 und 6: probier jeden Tag ein anderes 10-Minuten-Video', 'Eins für morgens, eins für vor dem Schlafen. Achte darauf, was dir besser gefällt.'],
        ['Tag 7: mach 10 Minuten ohne Video und schreib auf, wie du dich fühlst', 'Reih die Haltungen aneinander, die du noch weißt. Vergleich mit Tag 1: was ist leichter geworden?'],
      ],
    ],
    [
      'Jógázz egy hétig minden nap 10 percet',
      [
        ['Keress egy 10 perces kezdő jógavideót és egy helyet a padlón', 'Keress rá: „10 perces jóga kezdőknek”. Ha nincs matracod, egy törölköző is jó.'],
        ['1. nap: csináld lassan a videóval, és csak addig, amíg jólesik', 'A jóga nem fájhat. Az orrodon át lélegezz, és ne tartsd vissza a levegőt.'],
        ['2. és 3. nap: ugyanaz a videó, ugyanabban a napszakban', 'Az ismétléstől a testedre tudsz figyelni a képernyő helyett.'],
        ['4. nap: tanuld meg rendesen a lefelé néző kutyát, a gyermekpózt és a macska-tehén pózt', 'Mindegyikben maradj 5 lassú levegővételig. Szinte minden órán előjönnek.'],
        ['5. és 6. nap: próbálj ki minden nap egy másik 10 perces videót', 'Egyet reggelre, egyet lefekvés előttre. Figyeld meg, melyik tetszik jobban.'],
        ['7. nap: jógázz 10 percet videó nélkül, és írd fel, hogy érzed magad', 'Fűzd össze azokat a pózokat, amikre emlékszel. Hasonlítsd össze az 1. nappal: mi lett könnyebb?'],
      ],
    ],
    [yt('10 minute yoga for beginners', '10 Minuten Yoga für Anfänger', '10 minute yoga for beginners')],
    { noVideo: true },
  ),

  herbs: s(
    'garden',
    { en: '4–6 weeks', de: '4–6 Wochen', hu: '4–6 hét' },
    '€',
    [
      'Grow herbs on a windowsill',
      [
        ['Pick 3 easy herbs: basil, chives and parsley', 'Seeds cost about €1–2 a packet. Or buy one supermarket basil and split it into 3 small pots.'],
        ['Find your sunniest windowsill', 'Herbs need at least 4–6 hours of light. A south or west window is best.'],
        ['Fill 3 pots with soil and sow the seeds', 'Any pot with a hole in the bottom, or a yoghurt cup with a hole poked in it. Press the seeds in lightly and label each pot.'],
        ['Water when the top of the soil feels dry', 'Stick your finger in 1 cm. Too much water is the most common way to kill herbs.'],
        ['Thin them out when they’re 3 cm tall', 'Pull out the weakest sprouts so the others have room. Keep about 5 per pot.'],
        ['Harvest your first leaves and cook something with them', 'Cut basil above a pair of leaves so it grows bushier. Pesto, a pasta or a sandwich counts.'],
      ],
    ],
    [
      'Zieh Kräuter auf dem Fensterbrett',
      [
        ['Such dir 3 leichte Kräuter aus: Basilikum, Schnittlauch und Petersilie', 'Ein Samenpäckchen kostet etwa 1–2 €. Oder kauf ein Basilikum im Supermarkt und teil es auf 3 kleine Töpfe auf.'],
        ['Find dein sonnigstes Fensterbrett', 'Kräuter brauchen mindestens 4–6 Stunden Licht. Ein Süd- oder Westfenster ist am besten.'],
        ['Füll 3 Töpfe mit Erde und säe die Samen aus', 'Jeder Topf mit Loch im Boden geht, auch ein Joghurtbecher mit Loch. Drück die Samen leicht an und beschrifte jeden Topf.'],
        ['Gieß, wenn sich die Erde oben trocken anfühlt', 'Steck den Finger 1 cm tief rein. Zu viel Wasser ist der häufigste Grund, warum Kräuter eingehen.'],
        ['Dünn sie aus, wenn sie 3 cm hoch sind', 'Zieh die schwächsten Keimlinge raus, damit die anderen Platz haben. Lass etwa 5 pro Topf stehen.'],
        ['Ernte deine ersten Blätter und koch etwas damit', 'Schneid Basilikum über einem Blattpaar ab, dann wächst es buschiger. Pesto, Pasta oder ein Brot zählt.'],
      ],
    ],
    [
      'Nevelj fűszernövényeket az ablakpárkányon',
      [
        ['Válassz 3 könnyű fűszernövényt: bazsalikom, metélőhagyma és petrezselyem', 'Egy csomag mag kb. 1–2 €. Vagy vegyél egy bolti bazsalikomot, és oszd szét 3 kis cserépbe.'],
        ['Keresd meg a legnaposabb ablakpárkányodat', 'A fűszernövényeknek legalább 4–6 óra fény kell. A déli vagy nyugati ablak a legjobb.'],
        ['Tölts meg 3 cserepet földdel, és vesd el a magokat', 'Bármilyen cserép jó, aminek lyuk van az alján, akár egy kilyukasztott joghurtos pohár is. Nyomd bele finoman a magokat, és címkézd fel a cserepeket.'],
        ['Akkor locsold, amikor a föld teteje száraznak tűnik', 'Dugd bele az ujjad 1 cm mélyen. A túl sok víz a leggyakoribb oka, hogy a fűszernövények elpusztulnak.'],
        ['Ritkítsd őket, amikor 3 cm magasak', 'Húzd ki a leggyengébb csírákat, hogy a többinek legyen helye. Cserepenként kb. 5 maradjon.'],
        ['Szüreteld le az első leveleket, és főzz velük valamit', 'A bazsalikomot egy levélpár fölött vágd el, így bokrosabb lesz. Pesto, tészta vagy egy szendvics is számít.'],
      ],
    ],
    [yt('Growing herbs indoors for beginners', 'Kräuter auf der Fensterbank ziehen', 'growing herbs indoors windowsill beginners')],
  ),

  scraps: s(
    'garden',
    { en: '2–3 weeks', de: '2–3 Wochen', hu: '2–3 hét' },
    'Free',
    [
      'Regrow vegetables from kitchen scraps',
      [
        ['Save the ends of spring onions, a lettuce and a celery', 'Keep about 3–5 cm with the roots or the base. Ask whoever cooks at home to keep them for you.'],
        ['Put each in a glass with 1–2 cm of water', 'Only the bottom should be in water, not the whole thing. Put them on a bright windowsill.'],
        ['Change the water every two days', 'Fresh water stops it from going slimy. Rinse the base if it feels sticky.'],
        ['Take a photo every 3 days to see how much they grow', 'Spring onions grow fastest: often 5 cm in a few days.'],
        ['Move the best one into a pot with soil once it has roots', 'Plant it so the new green part sticks out. Water it well.'],
        ['Cut your first homegrown leaves and eat them', 'Spring onions grow back several times. Put the photos side by side: day 1 and today.'],
      ],
    ],
    [
      'Lass Gemüse aus Küchenresten nachwachsen',
      [
        ['Heb die Enden von Frühlingszwiebeln, einem Salat und einem Stangensellerie auf', 'Lass etwa 3–5 cm mit den Wurzeln oder dem Strunk dran. Bitte die Person, die bei dir kocht, sie für dich aufzuheben.'],
        ['Stell jedes Stück in ein Glas mit 1–2 cm Wasser', 'Nur der Boden soll im Wasser stehen, nicht das ganze Stück. Stell sie auf ein helles Fensterbrett.'],
        ['Wechsel alle zwei Tage das Wasser', 'Frisches Wasser verhindert, dass es schleimig wird. Spül den Strunk ab, wenn er klebrig ist.'],
        ['Mach alle 3 Tage ein Foto, um zu sehen, wie viel sie wachsen', 'Frühlingszwiebeln wachsen am schnellsten: oft 5 cm in ein paar Tagen.'],
        ['Setz das beste Stück in einen Topf mit Erde, sobald es Wurzeln hat', 'Pflanz es so, dass der neue grüne Teil herausschaut. Gieß es gut an.'],
        ['Schneid deine ersten selbst gezogenen Blätter ab und iss sie', 'Frühlingszwiebeln wachsen mehrmals nach. Leg die Fotos nebeneinander: Tag 1 und heute.'],
      ],
    ],
    [
      'Neveld újra a zöldségeket a konyhai maradékokból',
      [
        ['Tedd félre egy újhagyma, egy saláta és egy szárzeller végét', 'Kb. 3–5 cm maradjon a gyökerekkel vagy a torzsával. Kérd meg, aki otthon főz, hogy tegye félre neked.'],
        ['Tedd mindegyiket egy pohárba 1–2 cm vízzel', 'Csak az alja álljon vízben, ne az egész. Tedd őket egy világos ablakpárkányra.'],
        ['Kétnaponta cseréld a vizet', 'A friss víztől nem lesz nyálkás. Öblítsd le a torzsát, ha ragacsos.'],
        ['3 naponta fotózd le, hogy lásd, mennyit nőnek', 'Az újhagyma nő a leggyorsabban: pár nap alatt gyakran 5 cm-t.'],
        ['A legszebbet ültesd át egy földes cserépbe, amint van gyökere', 'Úgy ültesd, hogy az új zöld rész kilógjon. Jól locsold meg.'],
        ['Vágd le az első saját nevelésű leveleidet, és edd meg őket', 'Az újhagyma többször is visszanő. Tedd egymás mellé a fotókat: az 1. nap és a mai.'],
      ],
    ],
    [],
    { noVideo: true },
  ),

  spoon: s(
    'wood',
    { en: '2–3 weeks', de: '2–3 Wochen', hu: '2–3 hét' },
    '€€',
    [
      'Whittle a small wooden spoon',
      [
        ['Get a carving knife, a cut-resistant glove and a piece of soft wood', 'A Mora 120 knife or similar. Fresh birch, lime (basswood) or alder carve easily; ask a gardener or woodworker for a branch.'],
        ['Learn the two safe grips: the push cut and the pull cut', 'Always cut away from the hand holding the wood, or wear the glove on it. Ask an adult to watch the first time.'],
        ['Draw the spoon shape on the wood with a pencil', 'About 15–20 cm long. Draw it from the top and from the side.'],
        ['Carve the outline and the handle', 'Take thin slices, not big chunks. Turn the wood often and follow the grain.'],
        ['Hollow out the bowl with a spoon knife or the tip of your knife', 'Go slowly, in small scoops, from the edge to the middle.'],
        ['Let it dry, sand it and rub in cooking oil', 'Sunflower or olive oil. Take a photo of your first spoon next to your first pencil drawing of it.'],
      ],
    ],
    [
      'Schnitz einen kleinen Holzlöffel',
      [
        ['Besorg dir ein Schnitzmesser, einen Schnittschutzhandschuh und ein Stück weiches Holz', 'Ein Mora 120 oder ähnlich. Frische Birke, Linde oder Erle lassen sich leicht schnitzen; frag Gärtner oder Tischler nach einem Ast.'],
        ['Lern die zwei sicheren Griffe: Schubschnitt und Zugschnitt', 'Schneid immer weg von der Hand, die das Holz hält, oder trag dort den Handschuh. Lass beim ersten Mal einen Erwachsenen zuschauen.'],
        ['Zeichne die Löffelform mit Bleistift aufs Holz', 'Etwa 15–20 cm lang. Zeichne sie von oben und von der Seite.'],
        ['Schnitz den Umriss und den Stiel', 'Nimm dünne Späne, keine großen Stücke. Dreh das Holz oft und folg der Faser.'],
        ['Höhl die Laffe mit einem Löffelmesser oder der Messerspitze aus', 'Langsam, in kleinen Zügen, vom Rand zur Mitte.'],
        ['Lass ihn trocknen, schleif ihn und reib ihn mit Speiseöl ein', 'Sonnenblumen- oder Olivenöl. Fotografier deinen ersten Löffel neben deiner ersten Bleistiftskizze davon.'],
      ],
    ],
    [
      'Faragj egy kis fakanalat',
      [
        ['Szerezz egy faragókést, egy vágásbiztos kesztyűt és egy darab puha fát', 'Egy Mora 120-as kés vagy hasonló. A friss nyír-, hárs- vagy égerfa könnyen faragható; kérj egy ágat egy kertésztől vagy asztalostól.'],
        ['Tanuld meg a két biztonságos fogást: a toló és a húzó vágást', 'Mindig attól a kezedtől el vágj, amelyik a fát tartja, vagy arra húzd fel a kesztyűt. Az első alkalommal nézze egy felnőtt.'],
        ['Rajzold rá ceruzával a kanál formáját a fára', 'Kb. 15–20 cm hosszú legyen. Rajzold le felülről és oldalról is.'],
        ['Faragd ki a körvonalat és a nyelét', 'Vékony forgácsokat vegyél le, ne nagy darabokat. Gyakran fordítsd meg a fát, és kövesd a rostirányt.'],
        ['Váj ki a kanál fejét kanálvájó késsel vagy a késed hegyével', 'Lassan, kis mozdulatokkal, a széltől a közepe felé.'],
        ['Hagyd megszáradni, csiszold le, és dörzsöld be étolajjal', 'Napraforgó- vagy olívaolaj. Fotózd le az első kanaladat az első ceruzavázlatod mellett.'],
      ],
    ],
    [yt('Spoon carving for beginners', 'Löffel schnitzen für Anfänger', 'spoon carving for beginners')],
  ),

  photoday: s(
    'photo',
    { en: '30 days', de: '30 Tage', hu: '30 nap' },
    'Free',
    [
      'Take one photo every day for 30 days',
      [
        ['Make a photo album called “30 days” and set a daily reminder', 'One photo a day, picked from what you took. Choose a time when you’re usually outside.'],
        ['Week 1: one colour each day', 'Red on Monday, blue on Tuesday and so on. It makes you notice things you walk past.'],
        ['Week 2: turn on the grid and use the rule of thirds', 'Put the main thing on a line, not in the middle.'],
        ['Week 3: shoot from unusual angles', 'From the floor, from above, very close. Same thing, new picture.'],
        ['Week 4: light and shadow', 'Early morning, late afternoon, a lamp at night. Look for shadows before you look for subjects.'],
        ['Day 30: pick your 9 best and put them in one post', 'Look at day 1 next to day 30. What do you see now that you didn’t before?'],
      ],
    ],
    [
      'Mach 30 Tage lang jeden Tag ein Foto',
      [
        ['Leg ein Fotoalbum „30 Tage“ an und stell eine tägliche Erinnerung', 'Ein Foto pro Tag, ausgewählt aus dem, was du gemacht hast. Wähl eine Zeit, zu der du meistens draußen bist.'],
        ['Woche 1: jeden Tag eine Farbe', 'Montag Rot, Dienstag Blau und so weiter. So fallen dir Dinge auf, an denen du sonst vorbeigehst.'],
        ['Woche 2: schalt das Raster ein und nutz die Drittelregel', 'Setz das Wichtigste auf eine Linie, nicht in die Mitte.'],
        ['Woche 3: fotografier aus ungewöhnlichen Winkeln', 'Vom Boden, von oben, ganz nah. Gleiches Motiv, neues Bild.'],
        ['Woche 4: Licht und Schatten', 'Früh am Morgen, am späten Nachmittag, eine Lampe in der Nacht. Such zuerst Schatten, dann Motive.'],
        ['Tag 30: such deine 9 besten aus und stell sie in einen Beitrag', 'Schau Tag 1 neben Tag 30 an. Was siehst du jetzt, was du vorher nicht gesehen hast?'],
      ],
    ],
    [
      'Készíts 30 napig minden nap egy fotót',
      [
        ['Hozz létre egy „30 nap” nevű albumot, és állíts be napi emlékeztetőt', 'Napi egy fotó, abból kiválasztva, amit csináltál. Olyan időpontot válassz, amikor általában kint vagy.'],
        ['1. hét: minden nap egy szín', 'Hétfőn piros, kedden kék és így tovább. Így észreveszed, amik mellett máskor elmész.'],
        ['2. hét: kapcsold be a rácsot, és használd a harmadolás szabályát', 'A lényeg kerüljön egy vonalra, ne középre.'],
        ['3. hét: fotózz szokatlan szögekből', 'A földről, felülről, egészen közelről. Ugyanaz a téma, új kép.'],
        ['4. hét: fény és árnyék', 'Kora reggel, késő délután, egy lámpa éjjel. Előbb árnyékokat keress, aztán témát.'],
        ['30. nap: válaszd ki a 9 legjobbat, és tedd őket egy bejegyzésbe', 'Nézd meg egymás mellett az 1. és a 30. napot. Mit látsz most, amit korábban nem?'],
      ],
    ],
    [],
    { noVideo: true },
  ),

  street: s(
    'photo',
    { en: '1–2 weeks', de: '1–2 Wochen', hu: '1–2 hét' },
    'Free',
    [
      'Make a photo series about your street',
      [
        ['Walk your street slowly and write down 10 things you never noticed', 'Doors, signs, plants, cracks, colours. These are your possible photos.'],
        ['Choose one theme for the series', 'Only doors, only windows, only the colour green, or “a day on my street”. A theme turns photos into a series.'],
        ['Take 30 photos of your theme', 'Same height and direction for all of them makes it look like one series.'],
        ['Go back at a different time of day and take 10 more', 'Morning light and evening light change everything. Rainy days are good too.'],
        ['Ask before photographing people, or leave them out', 'Faces need a yes. Hands, shadows or backs often tell more anyway.'],
        ['Pick the best 6–9, put them in an order and give the series a title', 'Edit them the same way so they belong together. Post them as one series.'],
      ],
    ],
    [
      'Mach eine Fotoserie über deine Straße',
      [
        ['Geh deine Straße langsam ab und schreib 10 Dinge auf, die dir nie aufgefallen sind', 'Türen, Schilder, Pflanzen, Risse, Farben. Das sind deine möglichen Fotos.'],
        ['Wähl ein Thema für die Serie', 'Nur Türen, nur Fenster, nur die Farbe Grün oder „ein Tag in meiner Straße“. Ein Thema macht aus Fotos eine Serie.'],
        ['Mach 30 Fotos zu deinem Thema', 'Gleiche Höhe und Richtung bei allen lässt es wie eine Serie aussehen.'],
        ['Geh zu einer anderen Tageszeit noch mal hin und mach 10 weitere', 'Morgen- und Abendlicht verändern alles. Regentage sind auch gut.'],
        ['Frag, bevor du Menschen fotografierst, oder lass sie weg', 'Für Gesichter brauchst du ein Ja. Hände, Schatten oder Rücken erzählen oft sowieso mehr.'],
        ['Such die besten 6–9 aus, bring sie in eine Reihenfolge und gib der Serie einen Titel', 'Bearbeite alle gleich, damit sie zusammengehören. Poste sie als eine Serie.'],
      ],
    ],
    [
      'Készíts fotósorozatot az utcádról',
      [
        ['Sétálj végig lassan az utcádon, és írj fel 10 dolgot, amit sosem vettél észre', 'Ajtók, táblák, növények, repedések, színek. Ezek a lehetséges fotóid.'],
        ['Válassz egy témát a sorozathoz', 'Csak ajtók, csak ablakok, csak a zöld szín, vagy „egy nap az utcámban”. A téma teszi a fotókat sorozattá.'],
        ['Készíts 30 fotót a témádról', 'Ha mindet ugyanabból a magasságból és irányból fotózod, egy sorozatnak fog hatni.'],
        ['Menj vissza egy másik napszakban, és készíts még 10-et', 'A reggeli és az esti fény mindent megváltoztat. Az esős nap is jó.'],
        ['Kérdezz, mielőtt embereket fotózol, vagy hagyd ki őket', 'Arcokhoz igen kell. A kezek, árnyékok vagy hátak gyakran amúgy is többet mesélnek.'],
        ['Válaszd ki a legjobb 6–9-et, tedd őket sorrendbe, és adj címet a sorozatnak', 'Mindet ugyanúgy szerkeszd, hogy összetartozzanak. Egy sorozatként tedd közzé őket.'],
      ],
    ],
    [],
    { noVideo: true },
  ),
}

// What you need, in the same three languages (merged into MATERIALS)
export const STARTER_MATERIALS = {
  sketchbook: { en: ['Small sketchbook', 'Pencil'], de: ['Kleines Skizzenbuch', 'Bleistift'], hu: ['Kis vázlatfüzet', 'Ceruza'] },
  hand: { en: ['Paper or sketchbook', 'Pencil', 'Eraser'], de: ['Papier oder Skizzenbuch', 'Bleistift', 'Radiergummi'], hu: ['Papír vagy vázlatfüzet', 'Ceruza', 'Radír'] },
  ferrata: {
    en: ['Guided tour (gear usually included)', 'Sturdy shoes', 'Gloves', 'Rain jacket', 'Water and snacks'],
    de: ['Geführte Tour (Ausrüstung meist dabei)', 'Feste Schuhe', 'Handschuhe', 'Regenjacke', 'Wasser und Snacks'],
    hu: ['Vezetett túra (a felszerelés általában benne van)', 'Erős cipő', 'Kesztyű', 'Esőkabát', 'Víz és nasi'],
  },
  origami: { en: ['Thin paper', 'Scissors'], de: ['Dünnes Papier', 'Schere'], hu: ['Vékony papír', 'Olló'] },
  words: { en: ['Phone with a flashcard app', 'Sticky notes'], de: ['Handy mit Karteikarten-App', 'Klebezettel'], hu: ['Telefon szókártyás appal', 'Öntapadós cetlik'] },
  chess: { en: ['Phone or computer', 'A chessboard (optional)'], de: ['Handy oder Computer', 'Ein Schachbrett (optional)'], hu: ['Telefon vagy számítógép', 'Egy sakktábla (nem kötelező)'] },
  rubik: { en: ['3 × 3 cube', 'Sticky note for the moves'], de: ['3 × 3 Würfel', 'Zettel für die Zugfolgen'], hu: ['3 × 3-as kocka', 'Cetli a lépéssorokhoz'] },
  reading: { en: ['3 books (library)', 'Notebook'], de: ['3 Bücher (Bücherei)', 'Heft'], hu: ['3 könyv (könyvtár)', 'Füzet'] },
  sunrise: { en: ['Warm clothes', 'Blanket', 'Hot drink', 'Torch'], de: ['Warme Kleidung', 'Decke', 'Heißes Getränk', 'Taschenlampe'], hu: ['Meleg ruha', 'Takaró', 'Forró ital', 'Zseblámpa'] },
  yoga: { en: ['Mat or towel'], de: ['Matte oder Handtuch'], hu: ['Matrac vagy törölköző'] },
  herbs: { en: ['3 pots with holes', 'Potting soil', 'Herb seeds', 'Labels'], de: ['3 Töpfe mit Loch', 'Blumenerde', 'Kräutersamen', 'Schildchen'], hu: ['3 lyukas cserép', 'Virágföld', 'Fűszernövény-magok', 'Címkék'] },
  scraps: { en: ['Glasses or jars', 'Vegetable ends', 'A pot with soil'], de: ['Gläser', 'Gemüsereste', 'Ein Topf mit Erde'], hu: ['Poharak vagy befőttesüvegek', 'Zöldségvégek', 'Egy cserép földdel'] },
  spoon: {
    en: ['Carving knife', 'Cut-resistant glove', 'Soft fresh wood', 'Sandpaper', 'Cooking oil'],
    de: ['Schnitzmesser', 'Schnittschutzhandschuh', 'Weiches frisches Holz', 'Schleifpapier', 'Speiseöl'],
    hu: ['Faragókés', 'Vágásbiztos kesztyű', 'Puha friss fa', 'Csiszolópapír', 'Étolaj'],
  },
}

// Name → plan, tried before the general matchers in guides.js (the specific idea wins over "draw" or "book")
export const STARTER_MATCHERS = [
  ['sketchbook', /sketchbook page|skizzenbuchseite|vázlatfüzet\w* (egy )?oldal|oldalt a vázlatfüzet/],
  ['hand', /(draw|zeichn|rajzol)\w*.*\b(hands?|hände|kez\w*)\b/],
  ['ferrata', /via ferrata|klettersteig|vasalt út|ferrat/],
  ['origami', /origami/],
  ['words', /\b\d+ (new )?(words|wörter|szót?)\b|vocabulary|vokabeln|szókincs/],
  ['chess', /\bchess|\bschach|\bsakk/],
  ['rubik', /rubik|zauberwürfel/],
  ['reading', /\bread \d+ books?|\bread (a|more) books?|lies \d+ bücher|bücher (zu )?lesen|könyvet? (el)?olvas|olvass el \d+ könyv/],
  ['sunrise', /sunrise|sonnenaufgang|napfelkelt|napkelt/],
  ['pushups', /push-?ups?|liegestütz|fekvőtámasz/],
  ['yoga', /\byoga|\bjóg/],
  ['herbs', /(grow|plant|zieh|pflanz|nevel|ültet|termeszt)\w*.*\b(herbs?|kräuter\w*|fűszernövény\w*)|\b(herbs?|kräuter|fűszernövény\w*)\b.*(windowsill|fensterbrett|balcony|balkon|ablakpárkány|erkély)/],
  ['scraps', /kitchen scraps|regrow\w* (vegetables|veg|veggies|food|from)|küchenrest|gemüse\w* .*nachwachsen|konyhai maradék|zöldség\w* .*maradék/],
  ['spoon', /whittl|carv\w* (a |your )?(wooden )?spoon|wooden spoon|holzlöffel|löffel schnitz|schnitz\w* .*löffel|fakanal|fakanál/],
  ['photoday', /photo (every|a) day|jeden tag ein foto|minden nap egy fotó|30 days? of photos/],
  ['street', /photo series|fotoserie|fotósorozat|street photo/],
]
