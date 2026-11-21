// Plans that fit any hobby. When Blank has no hand-made plan for what someone typed and the AI can't write one
// (offline, or the day's AI is used up), the plan comes from here: one shape per kind of hobby, with the project's
// name filled in. Every step has a finish line you can photograph (ticking a step off asks for a photo) and a "how"
// line that says how to do it. Kinds: sport, train, music, art, make, cook, tech, outdoors, write, photo, grow, skill.
//
// Each step: [en text, en how, de text, de how, hu text, hu how]. {x} is the project's name.

const VIDEO = [
  'Watch a beginner video on “{x}” and note 3 tips',
  'About 10 minutes is enough. Write down the 3 most useful tips. No photo needed for this one: just tap Done.',
  'Schau ein Anfängervideo zu „{x}“ und notier 3 Tipps',
  'Etwa 10 Minuten reichen. Schreib die 3 nützlichsten Tipps auf. Dafür brauchst du kein Foto: Tipp einfach auf Fertig.',
  'Nézz meg egy kezdő videót: „{x}”, és írj fel 3 tippet',
  'Kb. 10 perc elég. Írd fel a 3 leghasznosabb tippet. Ehhez nem kell fotó: csak koppints a Kész gombra.',
]

const TEMPLATES = {
  // Team sports, martial arts, dance, swimming: usually learned in a club
  sport: [
    VIDEO,
    ['Find 2 clubs or classes for “{x}” near you', 'Search a map for clubs or classes. Many offer a free trial session for beginners: note the times.',
      'Finde 2 Vereine oder Kurse für „{x}“ in deiner Nähe', 'Such auf einer Karte nach Vereinen oder Kursen. Viele bieten ein kostenloses Probetraining an: Notier die Zeiten.',
      'Keress 2 egyesületet vagy edzést a közeledben ehhez: „{x}”', 'Keress térképen egyesületeket vagy órákat. Sok helyen van ingyenes próbaedzés kezdőknek: írd fel az időpontokat.'],
    ['Go to a trial training', 'Bring sports clothes and water, and tell the coach you’re a beginner. Ask what to practise at home.',
      'Geh zu einem Probetraining', 'Nimm Sportsachen und Wasser mit und sag dem Trainer, dass du Anfänger bist. Frag, was du zu Hause üben kannst.',
      'Menj el egy próbaedzésre', 'Vigyél sportruhát és vizet, és szólj az edzőnek, hogy kezdő vagy. Kérdezd meg, mit gyakorolhatsz otthon.'],
    ['Practise the first basic skill 30 times', 'Ask the coach or a video which basic skill matters most (a pass, a stance, a step) and repeat only that.',
      'Üb die erste Grundtechnik 30-mal', 'Frag den Trainer oder ein Video, welche Grundtechnik am wichtigsten ist (ein Pass, eine Haltung, ein Schritt), und wiederhol nur die.',
      'Gyakorold az első alaptechnikát 30-szor', 'Kérdezd meg az edzőt vagy egy videót, melyik alaptechnika a legfontosabb (egy passz, egy alapállás, egy lépés), és csak azt ismételd.'],
    ['Train twice a week for 2 weeks', 'Write each session down with one thing that went better than last time.',
      'Trainier 2 Wochen lang zweimal pro Woche', 'Schreib jedes Training auf, mit einer Sache, die besser lief als beim letzten Mal.',
      'Eddz 2 hétig hetente kétszer', 'Írj fel minden edzést, és egy dolgot, ami jobban ment, mint legutóbb.'],
    ['Do the basic skill 20 times in a row without a mistake', 'Film yourself once from the side and compare with the video or the coach.',
      'Mach die Grundtechnik 20-mal hintereinander ohne Fehler', 'Film dich einmal von der Seite und vergleich mit dem Video oder dem Trainer.',
      'Csináld meg az alaptechnikát 20-szor egymás után hiba nélkül', 'Vedd fel magad egyszer oldalról, és hasonlítsd össze a videóval vagy az edzővel.'],
    ['Play or finish one full game, round or session', 'A match, a full class or a whole routine, from start to end.',
      'Spiel oder schaff ein ganzes Spiel, eine Runde oder Einheit', 'Ein Spiel, eine ganze Stunde oder eine komplette Übung, von Anfang bis Ende.',
      'Játssz végig vagy teljesíts egy teljes meccset, kört vagy edzést', 'Egy meccset, egy teljes órát vagy egy egész gyakorlatsort, az elejétől a végéig.'],
  ],
  // Training on your own: push-ups, yoga, stretching, workouts, skipping
  train: [
    VIDEO,
    ['Test yourself: how many or how long can you do today?', 'Write the number down with the date: it’s your starting point. Stop at good form, not at pain.',
      'Teste dich: Wie viele oder wie lange schaffst du heute?', 'Schreib die Zahl mit Datum auf: Das ist dein Startwert. Hör auf, wenn die Haltung nachlässt, nicht erst bei Schmerz.',
      'Mérd fel magad: hányat vagy meddig bírsz ma?', 'Írd fel a számot a dátummal: ez a kiindulópontod. Akkor állj meg, amikor romlik a tartásod, ne amikor fáj.'],
    ['Learn the correct form with an easier version', 'For example push-ups against a wall or on your knees. Film yourself once from the side and compare with the video.',
      'Lern die richtige Ausführung mit einer leichteren Variante', 'Zum Beispiel Liegestütze an der Wand oder auf den Knien. Film dich einmal von der Seite und vergleich mit dem Video.',
      'Tanuld meg a helyes technikát egy könnyebb változattal', 'Például fekvőtámasz falnak dőlve vagy térdelve. Vedd fel magad egyszer oldalról, és hasonlítsd össze a videóval.'],
    ['Do 3 sessions this week with a rest day in between', 'Warm up for 5 minutes first. Stop if something hurts (not just tired). Write each session down.',
      'Mach diese Woche 3 Einheiten mit Ruhetag dazwischen', 'Wärm dich erst 5 Minuten auf. Hör auf, wenn etwas wehtut (nicht nur müde ist). Schreib jede Einheit auf.',
      'Eddz a héten 3-szor, közte pihenőnappal', 'Előtte melegíts be 5 percig. Ha valami fáj (nem csak fáradt), hagyd abba. Írj fel minden edzést.'],
    ['Beat your first test by a quarter', 'Test again exactly like the first time. Most people get there in 2–3 weeks.',
      'Übertriff deinen ersten Test um ein Viertel', 'Teste dich genau wie beim ersten Mal. Die meisten schaffen das in 2–3 Wochen.',
      'Javíts egynegyedet az első felmérésedhez képest', 'Pontosan úgy mérd fel magad, mint először. A legtöbben 2–3 hét alatt eljutnak ide.'],
    ['Reach your goal for “{x}”', 'Film it or have someone count, then write down your next goal.',
      'Erreich dein Ziel bei „{x}“', 'Film es oder lass jemanden mitzählen und schreib dann dein nächstes Ziel auf.',
      'Érd el a célodat ebben: „{x}”', 'Vedd fel videóra, vagy számolja valaki, aztán írd fel a következő célodat.'],
  ],
  // Instruments and singing
  music: [
    VIDEO,
    ['Get the instrument or app ready and tuned', 'Borrow before you buy. A free tuner app works for most instruments.',
      'Mach Instrument oder App bereit und stimm es', 'Leih erst, bevor du kaufst. Eine kostenlose Stimm-App geht für die meisten Instrumente.',
      'Készítsd elő és hangold be a hangszert vagy az appot', 'Előbb kölcsönözz, mielőtt veszel. A legtöbb hangszerhez jó egy ingyenes hangoló app.'],
    ['Play your first 3 notes or chords 10 times each, cleanly', 'Slow is fine. Clean means no buzzing and no wrong notes.',
      'Spiel deine ersten 3 Töne oder Akkorde je 10-mal sauber', 'Langsam ist okay. Sauber heißt: kein Schnarren, keine falschen Töne.',
      'Játszd le az első 3 hangodat vagy akkordodat 10-szer, tisztán', 'A lassú is jó. Tiszta: nem recseg, nincs hamis hang.'],
    ['Play an exercise for 5 minutes to a metronome at 60 bpm', 'Free metronome apps exist. Slow and even beats fast and messy.',
      'Spiel 5 Minuten eine Übung zum Metronom auf 60 bpm', 'Es gibt kostenlose Metronom-Apps. Langsam und gleichmäßig schlägt schnell und chaotisch.',
      'Játssz 5 percig egy gyakorlatot metronómra, 60-as tempóban', 'Vannak ingyenes metronóm appok. A lassú és egyenletes jobb, mint a gyors és kapkodó.'],
    ['Learn the first 8 bars of an easy song', 'Pick a song you love with a beginner tutorial. Loop the hard bar 10 times.',
      'Lern die ersten 8 Takte eines leichten Songs', 'Nimm einen Song, den du liebst und für den es ein Anfänger-Tutorial gibt. Wiederhol den schweren Takt 10-mal.',
      'Tanuld meg egy könnyű dal első 8 ütemét', 'Válassz egy kedvenc dalt, amihez van kezdő oktatóvideó. A nehéz ütemet ismételd 10-szer.'],
    ['Play the whole song slowly without stopping', 'Keep going through mistakes. Play along with the recording at 75% speed.',
      'Spiel den ganzen Song langsam ohne anzuhalten', 'Spiel über Fehler weiter. Spiel bei 75 % Tempo mit der Aufnahme mit.',
      'Játszd el az egész dalt lassan, megállás nélkül', 'A hibákon menj tovább. Játssz együtt a felvétellel 75%-os sebességgel.'],
    ['Record it and listen back', 'A phone recording is enough. Write down one thing to fix next time.',
      'Nimm ihn auf und hör ihn dir an', 'Eine Handyaufnahme reicht. Schreib eine Sache auf, die du nächstes Mal verbesserst.',
      'Vedd fel, és hallgasd vissza', 'Elég egy telefonos felvétel. Írj fel egy dolgot, amit legközelebb javítasz.'],
  ],
  // Drawing, painting, visual art
  art: [
    VIDEO,
    ['Get the basic materials for “{x}”', 'The cheapest beginner set is enough. Write down what you got.',
      'Besorg das Grundmaterial für „{x}“', 'Das günstigste Anfängerset reicht. Schreib auf, was du hast.',
      'Szerezd be az alapanyagokat ehhez: „{x}”', 'Elég a legolcsóbb kezdőkészlet. Írd fel, mit szereztél be.'],
    ['Fill one page with practice marks', 'Lines, shapes, textures, light and dark: try everything the material can do.',
      'Füll eine Seite mit Übungsspuren', 'Linien, Formen, Strukturen, hell und dunkel: Probier alles aus, was das Material kann.',
      'Tölts meg egy oldalt gyakorló nyomokkal', 'Vonalak, formák, textúrák, világos és sötét: próbálj ki mindent, amire az anyag képes.'],
    ['Copy one simple example from a tutorial in 20 minutes', 'Copying is how artists learn. Pause the video after each step.',
      'Kopier ein einfaches Beispiel aus einem Tutorial in 20 Minuten', 'Kopieren ist, wie Künstler lernen. Halt das Video nach jedem Schritt an.',
      'Másolj le egy egyszerű példát egy oktatóvideóból 20 perc alatt', 'A művészek így tanulnak. Minden lépés után állítsd meg a videót.'],
    ['Make 3 small studies of real objects', '10 minutes each, from life, not from memory.',
      'Mach 3 kleine Studien von echten Gegenständen', 'Je 10 Minuten, nach dem echten Vorbild, nicht aus dem Kopf.',
      'Készíts 3 kis tanulmányt valódi tárgyakról', 'Mindegyikre 10 perc, élő modell alapján, nem fejből.'],
    ['Make one finished piece you’d hang on a wall', 'Plan it with a quick sketch first, then finish it to the edges.',
      'Mach ein fertiges Werk, das du aufhängen würdest', 'Plan es zuerst mit einer schnellen Skizze und mach es dann bis zum Rand fertig.',
      'Készíts egy kész művet, amit kitennél a falra', 'Előbb tervezd meg egy gyors vázlattal, aztán dolgozd ki egészen a széléig.'],
    ['Photograph it next to your first practice page', 'Write down 3 things that got better.',
      'Fotografier es neben deiner ersten Übungsseite', 'Schreib 3 Dinge auf, die besser geworden sind.',
      'Fényképezd le az első gyakorló oldalad mellett', 'Írj fel 3 dolgot, ami jobb lett.'],
  ],
  // Crafts and woodwork: making a thing
  make: [
    VIDEO,
    ['List the materials and tools and get the cheapest set', 'Borrow tools first; buy only what this project needs.',
      'Schreib Material und Werkzeug auf und besorg die günstigste Variante', 'Leih Werkzeug zuerst aus; kauf nur, was dieses Projekt braucht.',
      'Írd össze az anyagokat és eszközöket, és szerezd be a legolcsóbbat', 'Előbb kölcsönözz szerszámot; csak azt vedd meg, ami ehhez a projekthez kell.'],
    ['Practise the basic technique on scraps for 20 minutes', 'Leftover material is perfect for mistakes. Stop when it starts to look even.',
      'Üb die Grundtechnik 20 Minuten an Resten', 'Reste sind perfekt für Fehler. Hör auf, wenn es gleichmäßig aussieht.',
      'Gyakorold az alaptechnikát 20 percig maradékon', 'A maradék anyag tökéletes a hibázáshoz. Akkor állj meg, ha már egyenletesnek tűnik.'],
    ['Make a mini test piece', 'A small version of the real thing shows you where it gets tricky.',
      'Mach ein kleines Probestück', 'Eine kleine Version vom Original zeigt dir, wo es knifflig wird.',
      'Készíts egy kis próbadarabot', 'Az igazi kis változata megmutatja, hol lesz nehéz.'],
    ['Plan the real piece and do the first third', 'Measure and mark before you cut or join. Ask an adult to help with sharp or hot tools.',
      'Plan das echte Stück und mach das erste Drittel', 'Miss und zeichne an, bevor du schneidest oder verbindest. Lass dir bei scharfem oder heißem Werkzeug von einem Erwachsenen helfen.',
      'Tervezd meg az igazi darabot, és készítsd el az első harmadát', 'Mérj és jelölj, mielőtt vágsz vagy illesztesz. Éles vagy forró szerszámnál kérj segítséget egy felnőttől.'],
    ['Finish the piece', 'Tidy the details: ends, edges, finish. Done when you’d give it as a present.',
      'Mach das Stück fertig', 'Kümmer dich um die Details: Enden, Kanten, Oberfläche. Fertig, wenn du es verschenken würdest.',
      'Fejezd be a darabot', 'Dolgozd el a részleteket: végek, szélek, felület. Kész, ha oda mernéd adni ajándékba.'],
    ['Show it and note what you’d do differently', 'Write down one thing for your next project.',
      'Zeig es her und notier, was du anders machen würdest', 'Schreib eine Sache für dein nächstes Projekt auf.',
      'Mutasd meg, és írd fel, mit csinálnál másképp', 'Írj fel egy dolgot a következő projektedhez.'],
  ],
  cook: [
    ['Find a well-reviewed recipe for “{x}” and read it twice', 'Look for “easy” and fewer than 10 ingredients.',
      'Such ein gut bewertetes Rezept für „{x}“ und lies es zweimal', 'Achte auf „einfach“ und weniger als 10 Zutaten.',
      'Keress egy jól értékelt receptet ehhez: „{x}”, és olvasd el kétszer', 'Keresd a „könnyű” jelzőt és a 10-nél kevesebb hozzávalót.'],
    ['Buy the ingredients and check your tools', 'Tick off each item on the recipe.',
      'Kauf die Zutaten und prüf dein Werkzeug', 'Hak jede Zutat im Rezept ab.',
      'Vedd meg a hozzávalókat, és nézd át az eszközeidet', 'Pipáld ki a recepten az összes tételt.'],
    ['Prepare every ingredient before you turn on the heat', 'Chop and measure everything into small bowls first.',
      'Bereite alle Zutaten vor, bevor du den Herd anmachst', 'Schneid und wieg erst alles in kleine Schälchen ab.',
      'Készíts elő minden hozzávalót, mielőtt bekapcsolod a tűzhelyet', 'Előbb vágj fel és mérj ki mindent kis tálkákba.'],
    ['Make it once exactly as written', 'Use a timer. Ask an adult when you use hot oil, the oven or sharp knives.',
      'Mach es einmal genau nach Rezept', 'Nimm einen Timer. Frag einen Erwachsenen bei heißem Öl, Backofen oder scharfen Messern.',
      'Készítsd el egyszer pontosan a recept szerint', 'Használj időzítőt. Forró olajnál, sütőnél vagy éles késnél kérj segítséget egy felnőttől.'],
    ['Taste, note 2 changes and make it again', 'More salt? Less time? Write it on the recipe.',
      'Probier, notier 2 Änderungen und mach es noch mal', 'Mehr Salz? Weniger Zeit? Schreib es aufs Rezept.',
      'Kóstold meg, írj fel 2 változtatást, és készítsd el újra', 'Több só? Kevesebb idő? Írd rá a receptre.'],
    ['Make it for someone and take a photo', 'Photograph it before anyone starts eating.',
      'Mach es für jemanden und fotografier es', 'Fotografier es, bevor jemand anfängt zu essen.',
      'Készítsd el valakinek, és fotózd le', 'Fényképezd le, mielőtt bárki enni kezd.'],
  ],
  // Coding, games, electronics, 3D printing, apps
  tech: [
    VIDEO,
    ['Install the free tools you need', 'Only use official downloads. Done when the tool opens.',
      'Installier die kostenlosen Werkzeuge, die du brauchst', 'Nur offizielle Downloads. Fertig, wenn das Programm startet.',
      'Telepítsd a szükséges ingyenes eszközöket', 'Csak hivatalos letöltést használj. Kész, ha elindul a program.'],
    ['Follow one beginner tutorial to the end', 'About 30 minutes. Type everything yourself instead of copying.',
      'Mach ein Anfänger-Tutorial bis zum Ende', 'Etwa 30 Minuten. Tipp alles selbst, statt es zu kopieren.',
      'Csinálj végig egy kezdő oktatóanyagot', 'Kb. 30 perc. Mindent magad gépelj be, ne másold.'],
    ['Change 3 things in the result to make it yours', 'Colours, text, speed, anything. Breaking it and fixing it teaches the most.',
      'Änder 3 Dinge am Ergebnis, damit es deins wird', 'Farben, Text, Tempo, egal was. Kaputt machen und reparieren bringt am meisten.',
      'Változtass meg 3 dolgot az eredményen, hogy a tiéd legyen', 'Színek, szöveg, sebesség, bármi. Elrontani és megjavítani tanít a legtöbbet.'],
    ['Build one small feature of your own', 'Write it down in one sentence first, then make the smallest version that works.',
      'Bau eine kleine eigene Funktion', 'Schreib sie zuerst in einem Satz auf und bau dann die kleinste Version, die funktioniert.',
      'Építs egy saját kis funkciót', 'Előbb írd le egy mondatban, aztán készítsd el a legkisebb működő változatát.'],
    ['Finish a small project and let someone try it', 'Watch them without helping, then fix the first thing that confuses them.',
      'Mach ein kleines Projekt fertig und lass es jemanden ausprobieren', 'Schau zu, ohne zu helfen, und behebe dann das Erste, was verwirrt.',
      'Fejezz be egy kis projektet, és próbáltasd ki valakivel', 'Nézd segítség nélkül, aztán javítsd ki az első dolgot, ami összezavarja.'],
  ],
  outdoors: [
    VIDEO,
    ['Find an easy beginner spot or route near you', 'Use a map or app and look for “easy” or “beginner”. Note the distance.',
      'Finde einen leichten Ort oder eine Anfängerroute in deiner Nähe', 'Nimm eine Karte oder App und achte auf „leicht“ oder „Anfänger“. Notier die Entfernung.',
      'Keress egy könnyű, kezdőknek való helyet vagy útvonalat a közeledben', 'Használj térképet vagy appot, és keresd a „könnyű” vagy „kezdő” jelzést. Írd fel a távot.'],
    ['Check the gear you need and borrow what you can', 'Safety gear first. Borrow or rent before buying.',
      'Prüf die Ausrüstung und leih dir, was geht', 'Zuerst die Sicherheitsausrüstung. Leihen oder mieten vor dem Kaufen.',
      'Nézd át, milyen felszerelés kell, és amit lehet, kölcsönözz', 'Először a biztonsági felszerelés. Kölcsönözz vagy bérelj, mielőtt veszel.'],
    ['Go the first time with an adult, a guide or a club', 'Tell someone where you’re going and when you’ll be back.',
      'Geh das erste Mal mit einem Erwachsenen, Guide oder Verein', 'Sag jemandem, wohin du gehst und wann du zurück bist.',
      'Először felnőttel, vezetővel vagy egyesülettel menj', 'Szólj valakinek, hová mész, és mikor érsz vissza.'],
    ['Do a short first outing of about 1 hour', 'Check the weather first. Write down what you’d bring next time.',
      'Mach einen ersten kurzen Ausflug von etwa 1 Stunde', 'Prüf vorher das Wetter. Schreib auf, was du nächstes Mal mitnimmst.',
      'Tegyél egy rövid, kb. 1 órás első kirándulást', 'Előtte nézd meg az időjárást. Írd fel, mit vinnél legközelebb.'],
    ['Do a longer outing and photograph the best moment', 'Twice as long as the first. Turn back if the weather changes.',
      'Mach einen längeren Ausflug und fotografier den besten Moment', 'Doppelt so lang wie der erste. Kehr um, wenn das Wetter umschlägt.',
      'Tegyél egy hosszabb kirándulást, és fotózd le a legjobb pillanatot', 'Kétszer olyan hosszú, mint az első. Ha változik az idő, fordulj vissza.'],
  ],
  write: [
    ['Read 2 short examples of “{x}” and note what you liked', 'A sentence, an idea, a style: write it down.',
      'Lies 2 kurze Beispiele für „{x}“ und notier, was dir gefallen hat', 'Ein Satz, eine Idee, ein Stil: Schreib es auf.',
      'Olvass el 2 rövid példát ehhez: „{x}”, és írd fel, mi tetszett', 'Egy mondat, egy ötlet, egy stílus: jegyezd fel.'],
    ['Write for 10 minutes without stopping', 'Set a timer. Don’t correct anything, just keep the pen moving.',
      'Schreib 10 Minuten ohne anzuhalten', 'Stell einen Timer. Verbessere nichts, schreib einfach weiter.',
      'Írj 10 percig megállás nélkül', 'Állíts be időzítőt. Ne javíts semmit, csak írj tovább.'],
    ['Plan your piece in 5 bullet points', 'Beginning, middle, end, and the one thing you want the reader to feel.',
      'Plan deinen Text in 5 Stichpunkten', 'Anfang, Mitte, Ende und das eine Gefühl, das der Leser haben soll.',
      'Tervezd meg az írásodat 5 pontban', 'Eleje, közepe, vége, és az az egy érzés, amit az olvasóban akarsz kelteni.'],
    ['Write the whole first draft', 'Messy is fine. Finish it in one or two sittings.',
      'Schreib den ganzen ersten Entwurf', 'Chaotisch ist okay. Schreib ihn in ein oder zwei Sitzungen fertig.',
      'Írd meg a teljes első változatot', 'Lehet kusza. Egy-két ülésben fejezd be.'],
    ['Wait a day, read it aloud and cut 10%', 'Cut every sentence that doesn’t earn its place.',
      'Warte einen Tag, lies ihn laut und kürz 10 %', 'Streich jeden Satz, der seinen Platz nicht verdient.',
      'Várj egy napot, olvasd fel hangosan, és húzz ki 10%-ot', 'Húzz ki minden mondatot, ami nem szolgálja a szöveget.'],
    ['Share it with one person you trust', 'Ask which part they liked most and where they got bored.',
      'Zeig ihn einer Person, der du vertraust', 'Frag, welcher Teil am besten gefallen hat und wo es langweilig wurde.',
      'Mutasd meg valakinek, akiben megbízol', 'Kérdezd meg, melyik rész tetszett a legjobban, és hol unatkozott.'],
  ],
  photo: [
    VIDEO,
    ['Take 10 photos using the rule of thirds', 'Turn on the grid in your camera app and put the subject on a line, not in the middle.',
      'Mach 10 Fotos nach der Drittel-Regel', 'Schalt das Raster in der Kamera-App ein und setz das Motiv auf eine Linie, nicht in die Mitte.',
      'Készíts 10 fotót a harmadolás szabálya szerint', 'Kapcsold be a rácsot a kameraappban, és a témát egy vonalra tedd, ne középre.'],
    ['Shoot the same subject in 3 different lights', 'Morning, midday and the hour before sunset. Compare them side by side.',
      'Fotografier dasselbe Motiv in 3 verschiedenen Lichtern', 'Morgens, mittags und in der Stunde vor Sonnenuntergang. Vergleich sie nebeneinander.',
      'Fotózd le ugyanazt a témát 3 különböző fényben', 'Reggel, délben és naplemente előtt egy órával. Hasonlítsd össze őket egymás mellett.'],
    ['Take 20 photos on one theme for “{x}”', 'One theme keeps you looking: colours, shapes, people, details.',
      'Mach 20 Fotos zu einem Thema für „{x}“', 'Ein Thema schärft den Blick: Farben, Formen, Menschen, Details.',
      'Készíts 20 fotót egy témára ehhez: „{x}”', 'Egy téma segít figyelni: színek, formák, emberek, részletek.'],
    ['Edit your best 5 lightly', 'Straighten, crop and brighten. Stop before it looks edited.',
      'Bearbeite deine besten 5 leicht', 'Gerade richten, zuschneiden, aufhellen. Hör auf, bevor es bearbeitet aussieht.',
      'Szerkeszd finoman a legjobb 5-öt', 'Egyenesítsd, vágd és világosítsd. Állj meg, mielőtt szerkesztettnek tűnne.'],
    ['Share your best 3', 'Ask someone which one they like most, and why.',
      'Teil deine besten 3', 'Frag jemanden, welches ihm am besten gefällt und warum.',
      'Oszd meg a legjobb 3-at', 'Kérdezz meg valakit, melyik tetszik neki a legjobban, és miért.'],
  ],
  grow: [
    ['Find out what “{x}” needs: light, water, space', 'Write the 3 answers down. Pick the sunniest spot you have if it needs sun.',
      'Find heraus, was „{x}“ braucht: Licht, Wasser, Platz', 'Schreib die 3 Antworten auf. Nimm deinen sonnigsten Platz, wenn Sonne nötig ist.',
      'Derítsd ki, mire van szüksége ennek: „{x}” – fény, víz, hely', 'Írd fel a 3 választ. Ha napot igényel, a legnaposabb helyedet válaszd.'],
    ['Get the seeds or plant, a pot and soil', 'A pot with drainage holes and fresh compost. Start small.',
      'Besorg Samen oder Pflanze, Topf und Erde', 'Ein Topf mit Abflussloch und frische Erde. Fang klein an.',
      'Szerezz magot vagy palántát, cserepet és földet', 'Vízelvezető lyukas cserép és friss virágföld. Kezdd kicsiben.'],
    ['Sow or plant it following the packet', 'Check the depth and spacing on the packet or label, then water gently.',
      'Säe oder pflanz es nach Packungsanleitung', 'Prüf Tiefe und Abstand auf der Packung oder dem Etikett und gieß vorsichtig an.',
      'Vesd el vagy ültesd el a csomagoláson leírtak szerint', 'Nézd meg a mélységet és a tőtávolságot a zacskón vagy a címkén, aztán óvatosan öntözd meg.'],
    ['Water for 2 weeks using the finger test', 'Push a finger 2 cm into the soil: dry means water.',
      'Gieß 2 Wochen lang mit dem Fingertest', 'Steck einen Finger 2 cm in die Erde: trocken heißt gießen.',
      'Öntözd 2 hétig az ujjpróba alapján', 'Dugd az ujjad 2 cm mélyen a földbe: ha száraz, önts.'],
    ['Take a photo every week for a month', 'Same spot, same angle. You’ll see it grow.',
      'Mach einen Monat lang jede Woche ein Foto', 'Gleicher Platz, gleicher Winkel. So siehst du es wachsen.',
      'Fényképezd le hetente egy hónapig', 'Ugyanott, ugyanabból a szögből. Így látod, ahogy nő.'],
    ['Enjoy the first flower, leaf or harvest', 'Write down what worked so you can do it again.',
      'Freu dich über die erste Blüte, das erste Blatt oder die erste Ernte', 'Schreib auf, was geklappt hat, damit du es wiederholen kannst.',
      'Örülj az első virágnak, levélnek vagy termésnek', 'Írd fel, mi vált be, hogy legközelebb is így csináld.'],
  ],
  // Anything else: languages, chess, magic tricks, a skill
  skill: [
    VIDEO,
    ['Write down what you need for “{x}” and get it', 'Borrow, use what you have or buy second-hand. Start with the minimum.',
      'Schreib auf, was du für „{x}“ brauchst, und besorg es', 'Leih es, nimm, was du hast, oder kauf gebraucht. Fang mit dem Minimum an.',
      'Írd fel, mi kell ehhez: „{x}”, és szerezd be', 'Kölcsönözz, használd, ami van, vagy vegyél használtat. A minimummal kezdd.'],
    ['Do a first 15-minute try', 'It’s allowed to be bad. Write down the one thing that was hardest.',
      'Mach einen ersten Versuch von 15 Minuten', 'Er darf schlecht sein. Schreib die eine Sache auf, die am schwersten war.',
      'Próbáld ki először 15 percig', 'Lehet rossz. Írd fel azt az egy dolgot, ami a legnehezebb volt.'],
    ['Practise that hardest part 10 times in a row', 'Only that part, slowly. It’s the fastest way to get better.',
      'Üb diesen schwersten Teil 10-mal hintereinander', 'Nur diesen Teil, langsam. So wirst du am schnellsten besser.',
      'Gyakorold ezt a legnehezebb részt 10-szer egymás után', 'Csak ezt a részt, lassan. Így fejlődsz a leggyorsabban.'],
    ['Do 3 sessions of 20 minutes this week', 'The same time each day helps. Note one thing that got better after each.',
      'Mach diese Woche 3 Einheiten à 20 Minuten', 'Jeden Tag zur selben Zeit hilft. Notier nach jeder eine Sache, die besser wurde.',
      'Gyakorolj a héten 3-szor 20 percet', 'Segít, ha mindig ugyanakkor csinálod. Mindegyik után írj fel egy dolgot, ami jobb lett.'],
    ['Make or do one small finished thing', 'Something with a clear end you can show: a piece, a recording, a full round.',
      'Mach eine kleine fertige Sache', 'Etwas mit klarem Ende, das du zeigen kannst: ein Stück, eine Aufnahme, eine ganze Runde.',
      'Készíts vagy csinálj végig egy kis kész dolgot', 'Valamit, aminek világos vége van, és meg tudod mutatni: egy darabot, egy felvételt, egy teljes kört.'],
    ['Show it to someone and ask what to try next', 'Write their idea down as your next step.',
      'Zeig es jemandem und frag, was du als Nächstes probieren sollst', 'Schreib die Idee als deinen nächsten Schritt auf.',
      'Mutasd meg valakinek, és kérdezd meg, mit próbálj ki legközelebb', 'Írd fel az ötletét a következő lépésednek.'],
  ],
}

// The kind of hobby from the category it was given (onboarding, a post's category) or from words in the name
const BY_CATEGORY = { art: 'art', music: 'music', crafts: 'make', wood: 'make', cooking: 'cook', tech: 'tech', outdoors: 'outdoors', fitness: 'sport', writing: 'write', photo: 'photo', garden: 'grow', learn: 'skill' }
const BY_NAME = [
  ['train', /push.?up|liegestütz|fekvőtámasz|pull.?up|klimmzug|húzódzkod|sit.?up|squat|kniebeuge|guggol|plank|yoga|jóga|pilates|stretch|dehn|nyújt|spagát|splits|handstand|kézenállás|workout|calisthenic|jump.?rope|seilspring|ugrókötél|fitness|\bgym\b|edzés|kondi/],
  ['sport', /ball|labda|foci|soccer|tennis|tenisz|badminton|tollaslabda|volley|röplabda|basket|kosár|hockey|hoki|rugby|baseball|cricket|golf|swim|schwimm|úsz|dance|danc|tanz|tánc|ballet|ballett|balett|judo|karate|taekwondo|kung ?fu|\bbox|bjj|wrestl|ring(en|kampf)|birkóz|fenc|fecht|vív|gymnast|turn(en)|torna|skate|skateboard|roller|ski\b|sí(zés|elés)?\b|snowboard|surf|szörf|row(ing)?\b|ruder|parkour|archery|bogenschie|íjász|cheer|frisbee/],
  ['music', /piano|klavier|zongor|violin|geige|heged|cello|csell|drum|schlagzeug|\bdob\b|dobol|flute|flöte|fuvol|furulya|recorder|blockflöte|sax|trumpet|trompete|trombit|harmonica|mundharmonika|szájharmonika|keyboard|bass guitar|accordion|akkordeon|harmonik|harp|harfe|hárfa|instrument|hangszer|kalimba|beatbox|\brap\b/],
  ['cook', /cook|koch|bake|back(en)?\b|recipe|rezept|recept|süt|főz|dessert|cake|torta|bread|smoothie|sushi|pizza|soup|suppe|leves|salad|salat|saláta|jam\b|marmelade|lekvár/],
  ['tech', /code|coding|program|\bapp\b|website|\bweb|game dev|spiel(e)? entwick|robot|arduino|raspberry|\b3d\b|3d.?print|drucker|nyomtat|electronic|elektronik|minecraft|\bmods?\b|python|javascript|linux|computer|számítógép|\bpc\b/],
  ['make', /craft|bastel|bark[áa]cs|macram|resin|candle|kerze|gyertya|soap|seife|szappan|jewel|schmuck|ékszer|bead|perle|gyöngy|origami|paper|papier|papír|leather|leder|bőr|wood|holz|fa(ragás|megmunk)|carv|schnitz|lego|model|modell|cosplay|costume|kostüm|jelmez|diy|nail|köröm/],
  ['art', /\bart\b|kunst|művészet|paint|mal(en)?\b|fest|draw|zeichn|rajz|sketch|calligraph|kalligraf|lettering|comic|manga|anime|graffiti|mural|sculpt|skulptur|szobr|animation|animáció/],
  ['outdoors', /hike|hiking|wander|túr|camp|zelt|sátor|kayak|kajak|canoe|kanu|kenu|sail|segel|vitorl|fish|angel|horgász|bird ?watch|vogel|madár|cycl|bike|fahrrad|rad\b|bicikl|kerékpár|geocach|climb|kletter|mász|ferrata|boulder|orienteer|tájfut|star ?gaz|stern|csillag/],
  ['write', /write|writ|schreib|írás|ír(ni|ok)\b|poem|poetry|gedicht|vers|story|geschichte|történet|novel|roman|regény|blog|journal|tagebuch|napló|fanfic|lyrics|songtext|dalszöveg|essay|esszé/],
  ['photo', /photo|foto|fotó|fényképez|camera|kamera|film(en|ing|ezés)?\b|video|videó|vlog|youtube|tiktok/],
  ['grow', /garden|garten|kert|plant|pflanz|növény|grow|anbau|termeszt|herb|kräuter|fűszer|flower|blume|virág|succulent|sukkulent|pozsgás|bonsai|vegetable|gemüse|zöldség|mushroom|pilz|gomba/],
]

export function hobbyKind(name, category) {
  const text = String(name || '').toLowerCase()
  const guess = BY_NAME.find(([, re]) => re.test(text))?.[0]
  // Fitness covers both: a club sport (handball) or training on your own (push-ups)
  if (category === 'fitness') return guess === 'train' ? 'train' : 'sport'
  return BY_CATEGORY[category] || guess || 'skill'
}

// The plan's category for a kind (so the project lands in the right place)
export const KIND_CATEGORY = { sport: 'fitness', train: 'fitness', music: 'music', art: 'art', make: 'crafts', cook: 'cooking', tech: 'tech', outdoors: 'outdoors', write: 'writing', photo: 'photo', grow: 'garden', skill: 'other' }

// A whole sentence (a post's text, "Reading every day in german until…") reads badly in quotes inside a step,
// so for long names the quoted name and the little word before it are left out
const LONG = (name) => name.length > 28 || name.trim().split(/\s+/).length > 4
const DROP = {
  en: [[/ (?:on|for|of) “\{x\}”/g, ''], [/“\{x\}”/g, 'your project']],
  de: [[/ (?:zu|für|bei) „\{x\}“/g, ''], [/„\{x\}“/g, 'dein Projekt']],
  hu: [[/(?: (?:ehhez|ebben|ennek))?: „\{x\}”/g, ''], [/„\{x\}”/g, 'a projekted']],
}
const fill = (s, name, lang) => {
  if (LONG(name)) for (const [re, to] of DROP[lang] || DROP.en) s = s.replace(re, to)
  return s.replace(/\{x\}/g, name)
}

// → steps for one language: [{ text, how }]
export function templateSteps(kind, name, lang = 'en') {
  const col = lang === 'de' ? 2 : lang === 'hu' ? 4 : 0
  return (TEMPLATES[kind] || TEMPLATES.skill).map((s) => ({ text: fill(s[col], name, lang), how: fill(s[col + 1], name, lang) }))
}

export const TEMPLATE_KINDS = Object.keys(TEMPLATES)
export { TEMPLATES }
