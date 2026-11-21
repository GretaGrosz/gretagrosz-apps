// Ready-made beginner plans, in English and German; Hungarian comes from src/hu.js by the English text. Every plan with a photo shows up under Ideas.
import { PHOTOS } from './photos'
import HU from './hu'
import { KIND_CATEGORY, hobbyKind, templateSteps } from './templates'
import { MATERIALS } from './materials'
import { STARTERS, STARTER_MATCHERS, STARTER_MATERIALS } from './starters'

// YouTube search filtered to playlists only
const yt = (en, de, query) => ({
  kind: 'youtube',
  title: { en, de },
  note: { en: 'YouTube playlists', de: 'YouTube-Playlists' },
  url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%253D%253D`,
})
const site = (title, url, en, de) => ({ kind: 'site', title: { en: title, de: title }, url, note: { en, de } })
const reddit = (sub) => ({
  kind: 'community',
  title: { en: `r/${sub}`, de: `r/${sub}` },
  url: `https://www.reddit.com/r/${sub}/`,
  note: { en: 'Ask questions, share progress', de: 'Fragen stellen, Fortschritt zeigen' },
})

const g = (category, time, cost, en, de, resources) => ({ category, time, cost, title: { en: en[0], de: de[0] }, steps: { en: en[1], de: de[1] }, resources })

export const GUIDES = {
  knit: g(
    'crafts',
    { en: '4–8 weeks', de: '4–8 Wochen' },
    '€€',
    [
      'Knit your first sweater',
      [
        ['Knit a 20-stitch swatch: 10 rows of knit stitch', 'Cast on 20 stitches with any yarn and needles and knit every row. Done when you have 10 rows and still 20 stitches.'],
        ['Knit 10 rows of stocking stitch: one row knit, one row purl', 'Smooth little V shapes on the front mean it worked. Count your stitches at the end of every row.'],
        ['Pick a free beginner top-down sweater pattern in your size', 'Search Ravelry for “top down sweater”, filter by free and beginner. Measure your chest and circle your size.'],
        ['Buy the yarn and needles your pattern lists', 'Take the pattern to the shop. Chunky yarn knits up fastest. Get one extra ball from the same dye lot.'],
        ['Knit a 10 × 10 cm gauge swatch and count the stitches', 'Compare with the pattern. More stitches than it says: use thicker needles. Fewer: use thinner ones.'],
        ['Knit the yoke until it reaches your armpits', 'Follow the increases row by row and put a marker at each one. Try it on as you go: it should lie flat around your neck.'],
        ['Knit the body until it’s 30 cm below the armpits', 'Put the sleeve stitches on spare yarn, join front and back and knit in rounds. Measure from the armpit down.'],
        ['Knit both sleeves, weave in the ends and wear it', 'Count the rows of the first sleeve so the second matches. Weave every loose end through 5 cm of stitches before cutting.'],
      ],
    ],
    [
      'Strick deinen ersten Pullover',
      [
        ['Strick ein Probestück mit 20 Maschen: 10 Reihen rechts', 'Schlag 20 Maschen mit beliebiger Wolle an und strick jede Reihe rechts. Fertig, wenn du 10 Reihen und noch 20 Maschen hast.'],
        ['Strick 10 Reihen glatt rechts: eine Reihe rechts, eine links', 'Glatte kleine V-Formen auf der Vorderseite heißen: Es klappt. Zähl am Ende jeder Reihe deine Maschen.'],
        ['Such dir eine kostenlose Top-down-Anleitung in deiner Größe', 'Such auf Ravelry nach „top down sweater“, filtere nach kostenlos und Anfänger. Miss deinen Brustumfang und kreis deine Größe ein.'],
        ['Kauf die Wolle und die Nadeln aus deiner Anleitung', 'Nimm die Anleitung mit in den Laden. Dicke Wolle geht am schnellsten. Kauf ein Knäuel mehr aus derselben Partie.'],
        ['Strick eine Maschenprobe von 10 × 10 cm und zähl die Maschen', 'Vergleich mit der Anleitung. Mehr Maschen als angegeben: dickere Nadeln. Weniger: dünnere.'],
        ['Strick die Passe, bis sie bis zu den Achseln reicht', 'Folge den Zunahmen Reihe für Reihe und setz an jeder einen Markierer. Probier zwischendurch an: Sie soll flach um den Hals liegen.'],
        ['Strick den Körper, bis er 30 cm unter den Achseln ist', 'Leg die Ärmelmaschen auf einen Hilfsfaden, verbinde Vorder- und Rückenteil und strick in Runden. Miss von der Achsel abwärts.'],
        ['Strick beide Ärmel, vernähe die Fäden und zieh ihn an', 'Zähl die Reihen am ersten Ärmel, damit der zweite gleich wird. Zieh jedes Fadenende 5 cm durch die Maschen, bevor du es abschneidest.'],
      ],
    ],
    [
      yt('Beginner sweater knit-alongs', 'Pullover-Knit-alongs für Anfänger', 'beginner top down sweater knit along'),
      site('Ravelry', 'https://www.ravelry.com/', 'Thousands of free patterns, filter by “beginner”', 'Tausende Gratis-Anleitungen, Filter „Anfänger“'),
      reddit('knitting'),
    ],
  ),
  embroidery: g(
    'crafts',
    { en: '1–2 weeks', de: '1–2 Wochen' },
    '€',
    [
      'Learn hand embroidery',
      [
        ['Put fabric in a hoop, tight as a drum', 'Loosen the screw, put cotton fabric between the rings, tighten and pull it taut. Tap it: it should sound like a drum.'],
        ['Stitch a 10 cm line in back stitch', 'Use 2 strands of floss. Come up one stitch ahead, go down into the end of the last one. Aim for 3 mm stitches, all the same.'],
        ['Stitch a curve in stem stitch and fill a circle with satin stitch', 'Stem stitch: keep the thread on the same side every time. Satin stitch: lay stitches close together so no fabric shows.'],
        ['Trace a small design (up to 8 cm) onto the fabric', 'Tape the design to a window, hold the fabric over it and trace with a pencil or washable pen. Bold, simple lines work best.'],
        ['Outline the whole design', 'Back stitch or stem stitch every line first. Start each thread with a small knot at the back; end it by weaving under stitches.'],
        ['Fill the shapes until no traced line shows', 'Satin stitch the small areas and add French knots for dots. Done when you can’t see any pencil anymore.'],
        ['Finish the back and hang it up in the hoop', 'Cut the fabric 2 cm bigger than the hoop, gather it at the back with a running stitch, and hang it on the wall.'],
      ],
    ],
    [
      'Lerne Handsticken',
      [
        ['Spann Stoff in einen Stickrahmen, straff wie eine Trommel', 'Lös die Schraube, leg Baumwollstoff zwischen die Ringe, zieh fest und spann ihn. Klopf drauf: Er soll wie eine Trommel klingen.'],
        ['Stick eine 10 cm lange Linie im Rückstich', 'Nimm 2 Fäden Stickgarn. Komm einen Stich weiter vorne hoch und stich ins Ende des letzten zurück. Ziel: gleich lange Stiche von 3 mm.'],
        ['Stick eine Kurve im Stielstich und füll einen Kreis mit Plattstich', 'Stielstich: Halt den Faden immer auf derselben Seite. Plattstich: Leg die Stiche dicht nebeneinander, sodass kein Stoff durchscheint.'],
        ['Pause ein kleines Motiv (bis 8 cm) auf den Stoff', 'Kleb das Motiv an ein Fenster, halt den Stoff davor und zeichne es mit Bleistift oder auswaschbarem Stift nach. Klare, einfache Linien sind am besten.'],
        ['Stick alle Umrisse des Motivs', 'Stick zuerst alle Linien im Rück- oder Stielstich. Beginn jeden Faden mit einem kleinen Knoten hinten und vernähe das Ende unter den Stichen.'],
        ['Füll die Flächen, bis keine Vorzeichnung mehr zu sehen ist', 'Füll kleine Flächen mit Plattstich und setz Knötchenstiche als Punkte. Fertig, wenn kein Bleistiftstrich mehr zu sehen ist.'],
        ['Mach die Rückseite fertig und häng es im Rahmen auf', 'Schneid den Stoff 2 cm größer als den Rahmen zu, raff ihn hinten mit Vorstichen zusammen und häng ihn an die Wand.'],
      ],
    ],
    [yt('Embroidery stitches for beginners', 'Stickstiche für Anfänger', 'hand embroidery for beginners stitches'), reddit('Embroidery')],
  ),
  sewing: g(
    'crafts',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    '€€',
    [
      'Learn to use a sewing machine',
      [
        ['Thread the machine, wind a bobbin and sew 10 cm', 'Follow the numbers printed on the machine or in its manual. Done when 10 cm on scrap fabric sews without tangling underneath.'],
        ['Sew along 5 lines drawn on paper, no thread', 'Draw lines 1.5 cm apart and sew slowly along them. Guide the paper with both hands; don’t push or pull.'],
        ['Sew 3 straight seams on fabric, 1.5 cm from the edge', 'Line the edge up with the 1.5 cm mark on the plate. Sew 3 stitches back and forth at the start and end so it holds.'],
        ['Sew a square corner and a gentle curve', 'At a corner stop with the needle down, lift the foot, turn the fabric, lower the foot. On curves go slowly and turn bit by bit.'],
        ['Sew a tote bag from 2 rectangles and 2 straps', 'Cut 2 pieces of 40 × 45 cm and 2 straps of 8 × 60 cm. Sew sides and bottom, fold the top over twice and sew in the straps.'],
        ['Sew a pillowcase with an envelope back', 'Measure your pillow and add 3 cm. Cut one front and two overlapping back pieces; hem the back openings before joining.'],
        ['Choose your next project from a free beginner pattern', 'Search “free beginner sewing pattern” and pick one with straight seams, like pyjama shorts. Buy the fabric it lists.'],
      ],
    ],
    [
      'Lerne mit der Nähmaschine nähen',
      [
        ['Fädle die Maschine ein, spul eine Spule auf und näh 10 cm', 'Folge den Nummern auf der Maschine oder in der Anleitung. Fertig, wenn 10 cm auf einem Reststück ohne Fadensalat unten gehen.'],
        ['Näh ohne Faden 5 Linien auf Papier nach', 'Zeichne Linien im Abstand von 1,5 cm und näh langsam darauf. Führ das Papier mit beiden Händen, ohne zu schieben oder zu ziehen.'],
        ['Näh 3 gerade Nähte auf Stoff, 1,5 cm vom Rand', 'Leg die Stoffkante an die 1,5-cm-Markierung der Stichplatte. Näh am Anfang und Ende 3 Stiche vor und zurück, damit es hält.'],
        ['Näh eine rechtwinklige Ecke und eine sanfte Kurve', 'An der Ecke mit der Nadel unten anhalten, Füßchen heben, Stoff drehen, Füßchen senken. In Kurven langsam nähen und Stück für Stück drehen.'],
        ['Näh eine Stofftasche aus 2 Rechtecken und 2 Henkeln', 'Schneid 2 Teile von 40 × 45 cm und 2 Henkel von 8 × 60 cm zu. Näh Seiten und Boden, schlag oben zweimal um und näh die Henkel ein.'],
        ['Näh einen Kissenbezug mit Hotelverschluss', 'Miss dein Kissen und gib 3 cm dazu. Schneid ein Vorderteil und zwei überlappende Rückenteile zu und säume die Öffnungen vor dem Zusammennähen.'],
        ['Such dir dein nächstes Projekt aus einem kostenlosen Anfängerschnitt', 'Such nach „Schnittmuster Anfänger kostenlos“ und nimm eins mit geraden Nähten, zum Beispiel Pyjamashorts. Kauf den angegebenen Stoff.'],
      ],
    ],
    [yt('Sewing machine basics', 'Nähmaschine: die Grundlagen', 'sewing machine for beginners'), reddit('sewing')],
  ),
  pottery: g(
    'crafts',
    { en: '4–6 weeks', de: '4–6 Wochen' },
    '€€',
    [
      'Throw your first bowl on the wheel',
      [
        ['Book a beginner wheel class or open-studio session', 'Search for a pottery studio or community centre near you. A taster session is usually 2–3 hours, clay included.'],
        ['Wedge 3 balls of clay until they have no air bubbles', 'Push the clay away with the heels of your hands and roll it back, about 50 times. Cut one in half: no holes means it’s ready.'],
        ['Centre 1 kg of clay so it doesn’t wobble', 'Wet the clay, brace your elbows on your legs and push it up into a cone and down again 3 times. Centred clay feels still.'],
        ['Open the clay and pull up a wall 8 cm high', 'Press your thumbs down in the middle and leave a 1 cm floor. Pull up slowly with fingers inside and out, wheel turning slowly.'],
        ['Throw 5 small bowls (collapses count too)', 'Each one teaches you something. Cut a failed one in half to see where the wall got too thick or too thin.'],
        ['Trim a foot ring on your best bowl when it’s leather-hard', 'After 1–2 days it feels like cold cheese. Put it upside down on the wheel and trim the foot with a loop tool.'],
        ['Glaze it and get it fired', 'Ask the studio which glazes are food-safe. Keep glaze 5 mm away from the bottom so it doesn’t stick to the kiln shelf.'],
      ],
    ],
    [
      'Dreh deine erste Schale an der Töpferscheibe',
      [
        ['Buch einen Anfängerkurs an der Töpferscheibe', 'Such nach einer Töpferwerkstatt oder einem Kulturzentrum in deiner Nähe. Ein Schnupperkurs dauert meist 2–3 Stunden, Ton inklusive.'],
        ['Knete 3 Tonkugeln, bis keine Luftblasen mehr drin sind', 'Drück den Ton mit den Handballen weg und roll ihn zurück, etwa 50-mal. Schneid eine Kugel durch: keine Löcher heißt fertig.'],
        ['Zentriere 1 kg Ton, bis er nicht mehr eiert', 'Mach den Ton nass, stütz die Ellbogen auf die Beine und drück ihn 3-mal zu einem Kegel hoch und wieder runter. Zentrierter Ton fühlt sich ruhig an.'],
        ['Öffne den Ton und zieh eine 8 cm hohe Wand hoch', 'Drück die Daumen in der Mitte nach unten und lass 1 cm Boden stehen. Zieh langsam mit den Fingern innen und außen hoch, die Scheibe dreht langsam.'],
        ['Dreh 5 kleine Schalen (eingestürzte zählen auch)', 'Jede bringt dir etwas bei. Schneid eine misslungene durch, um zu sehen, wo die Wand zu dick oder zu dünn wurde.'],
        ['Dreh deiner besten Schale lederhart einen Standring ab', 'Nach 1–2 Tagen fühlt sie sich an wie kalter Käse. Stell sie umgedreht auf die Scheibe und dreh mit einer Schlinge den Fuß ab.'],
        ['Glasiere sie und lass sie brennen', 'Frag in der Werkstatt, welche Glasuren lebensmittelecht sind. Lass unten 5 mm frei, damit nichts an der Ofenplatte festklebt.'],
      ],
    ],
    [yt('Wheel throwing for beginners', 'Drehen an der Scheibe für Anfänger', 'pottery wheel throwing for beginners'), reddit('Pottery')],
  ),
  linocut: g(
    'art',
    { en: '1 week', de: '1 Woche' },
    '€',
    [
      'Make your first linocut print',
      [
        ['Carve 5 test lines on a scrap of lino', 'V-gouge for thin lines, U-gouge for big areas. Always push away from your other hand. Warm lino cuts more easily.'],
        ['Draw a bold design the size of your block', 'Thick shapes and strong contrast work best; avoid lines thinner than 2 mm. Shade in what will print black.'],
        ['Transfer the design onto the block, mirrored', 'Trace it in soft pencil, lay the paper face down on the block and rub the back. Letters must read backwards on the block.'],
        ['Carve away everything that should stay white', 'Carve the outlines first, then clear the big areas. Leave the black parts untouched.'],
        ['Pull your first print by hand with a spoon', 'Roll the ink thin until it sounds like Velcro, ink the block, lay paper on top and rub hard in small circles.'],
        ['Print an edition of 5 and sign them', 'Re-ink before every print. Sign in pencil under the image: title on the left, “1/5” and your name on the right.'],
      ],
    ],
    [
      'Mach deinen ersten Linoldruck',
      [
        ['Schneid 5 Probelinien in ein Reststück Linoleum', 'V-Messer für feine Linien, U-Messer für Flächen. Schneid immer von deiner anderen Hand weg. Warmes Linoleum lässt sich leichter schneiden.'],
        ['Zeichne ein kräftiges Motiv in der Größe deiner Platte', 'Dicke Formen und starke Kontraste wirken am besten; keine Linien unter 2 mm. Mal aus, was schwarz gedruckt wird.'],
        ['Übertrag das Motiv spiegelverkehrt auf die Platte', 'Zeichne es mit weichem Bleistift nach, leg das Papier mit der Zeichnung nach unten auf die Platte und reib die Rückseite. Schrift muss auf der Platte spiegelverkehrt sein.'],
        ['Schneid alles weg, was weiß bleiben soll', 'Schneid zuerst die Umrisse, dann die großen Flächen frei. Die schwarzen Teile bleiben unberührt.'],
        ['Druck deinen ersten Abzug von Hand mit einem Löffel', 'Walz die Farbe dünn aus, bis sie wie ein Klettverschluss klingt, färb die Platte ein, leg Papier drauf und reib fest in kleinen Kreisen.'],
        ['Druck eine Auflage von 5 und signier sie', 'Färb vor jedem Druck neu ein. Signier mit Bleistift unter dem Bild: links der Titel, rechts „1/5“ und dein Name.'],
      ],
    ],
    [yt('Linocut printing for beginners', 'Linoldruck für Anfänger', 'linocut printmaking for beginners'), reddit('printmaking')],
  ),
  sketch: g(
    'art',
    { en: '30 days to start', de: '30 Tage zum Einstieg' },
    '€',
    [
      'Start a daily sketch habit',
      [
        ['Draw 20 cubes, cylinders and spheres in 10 minutes', 'Simple shapes are the bones of everything you’ll draw. Draw fast and lightly, and turn them to different angles.'],
        ['Sketch for 10 minutes on 5 different days', 'Pick a fixed time, like after school. Date every page; anything counts as a subject.'],
        ['Shade a sphere in 5 tones from white to black', 'Choose one light source. Light side, mid-tone, core shadow, reflected light, cast shadow. Squint to compare tones.'],
        ['Draw your mug, a plant and your hand from life', 'Ten minutes each. Measure proportions with your pencil at arm’s length, and draw what you see, not what you expect.'],
        ['Draw 10 eyes in 10 minutes from photos', 'Notice how the eyelid covers part of the iris, and leave the highlight white. Speed beats perfection here.'],
        ['Make one detailed drawing in 45 minutes', 'Pick something you care about. Block in shapes lightly, then the darks, then details. Finish it to the edges.'],
        ['Put your first and latest drawings side by side', 'Photograph them together and write down 3 things that got better.'],
      ],
    ],
    [
      'Fang an, jeden Tag zu skizzieren',
      [
        ['Zeichne 20 Würfel, Zylinder und Kugeln in 10 Minuten', 'Einfache Formen stecken in allem, was du zeichnest. Zeichne schnell und leicht und dreh sie in verschiedene Winkel.'],
        ['Skizziere an 5 verschiedenen Tagen je 10 Minuten', 'Wähl eine feste Zeit, etwa nach der Schule. Schreib auf jede Seite das Datum; jedes Motiv zählt.'],
        ['Schattiere eine Kugel in 5 Tönen von Weiß bis Schwarz', 'Wähl eine Lichtquelle. Lichtseite, Mittelton, Kernschatten, Reflexlicht, Schlagschatten. Kneif die Augen zusammen, um Töne zu vergleichen.'],
        ['Zeichne deine Tasse, eine Pflanze und deine Hand nach dem echten Vorbild', 'Je 10 Minuten. Miss Proportionen mit dem Bleistift auf Armlänge und zeichne, was du siehst, nicht was du erwartest.'],
        ['Zeichne 10 Augen in 10 Minuten nach Fotos', 'Achte darauf, dass das Lid einen Teil der Iris verdeckt, und lass das Glanzlicht weiß. Hier zählt Tempo, nicht Perfektion.'],
        ['Mach eine detaillierte Zeichnung in 45 Minuten', 'Wähl etwas, das dir etwas bedeutet. Erst leicht die Formen, dann die dunklen Stellen, dann Details. Zeichne sie bis an den Rand fertig.'],
        ['Leg deine erste und deine neueste Zeichnung nebeneinander', 'Fotografier sie zusammen und schreib 3 Dinge auf, die besser geworden sind.'],
      ],
    ],
    [
      yt('Learn to draw from scratch', 'Zeichnen von Grund auf', 'learn to draw for beginners course'),
      site('Drawabox', 'https://drawabox.com/', 'Free structured drawing lessons', 'Kostenlose, aufbauende Zeichenlektionen'),
      reddit('learnart'),
    ],
  ),
  lemons: g(
    'art',
    { en: '2 weeks', de: '2 Wochen' },
    '€',
    [
      'Paint your first watercolour still life',
      [
        ['Paint 3 flat washes and 3 gradients', 'Mix a big puddle of paint first. Tilt the paper a little and pull a wet bead down. For a gradient, add water with each stroke.'],
        ['Paint the same circle wet-on-wet and wet-on-dry', 'Wet-on-wet: wet the paper first and colours blur softly. Wet-on-dry: paint on dry paper for sharp edges. Label both.'],
        ['Paint 6 lemons from simple shapes', 'Start with a pale yellow shape and let it dry. Then add the shadow with yellow plus a touch of purple or blue.'],
        ['Set up 3 real lemons with one lamp from the side', 'One strong light gives clear shadows. Take a photo of the setup so you can compare later.'],
        ['Sketch the setup lightly in 5 minutes', 'Pencil in only the outlines and the shadow shapes. Press lightly: pencil shows through watercolour.'],
        ['Paint the still life in 30 minutes, light to dark', 'Lightest colours first, let them dry, then shadows, then the darkest darks. Leave white paper for the highlights.'],
      ],
    ],
    [
      'Mal dein erstes Aquarell-Stillleben',
      [
        ['Mal 3 gleichmäßige Lasuren und 3 Verläufe', 'Misch zuerst eine große Pfütze Farbe. Kipp das Papier leicht und zieh einen nassen Farbrand nach unten. Für den Verlauf bei jedem Strich Wasser dazugeben.'],
        ['Mal denselben Kreis nass in nass und nass auf trocken', 'Nass in nass: Papier zuerst befeuchten, die Farben verlaufen weich. Nass auf trocken: auf trockenem Papier für scharfe Kanten. Beschrifte beide.'],
        ['Mal 6 Zitronen aus einfachen Formen', 'Fang mit einer hellgelben Form an und lass sie trocknen. Dann den Schatten mit Gelb und einem Hauch Lila oder Blau.'],
        ['Bau 3 echte Zitronen mit einer Lampe von der Seite auf', 'Ein starkes Licht macht klare Schatten. Mach ein Foto vom Aufbau, damit du später vergleichen kannst.'],
        ['Skizziere den Aufbau in 5 Minuten ganz leicht', 'Zeichne nur Umrisse und Schattenformen vor. Drück leicht auf: Bleistift scheint durch Aquarell durch.'],
        ['Mal das Stillleben in 30 Minuten, von hell nach dunkel', 'Zuerst die hellsten Farben, trocknen lassen, dann Schatten, dann die dunkelsten Stellen. Lass für die Glanzlichter weißes Papier frei.'],
      ],
    ],
    [yt('Watercolour for beginners', 'Aquarell für Anfänger', 'watercolor for beginners step by step'), reddit('Watercolor')],
  ),
  pixels: g(
    'art',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    'Free',
    [
      'Learn pixel art',
      [
        ['Open a free pixel editor with a 16×16 canvas', 'Piskel (piskelapp.com) runs in the browser. Zoom in until each pixel is a big square.'],
        ['Load a palette of 8 colours', 'Pick a ready-made 8-colour palette on lospec.com and load it. Few colours are what make pixel art look good.'],
        ['Draw 3 objects at 16×16: a cup, an apple, a key', 'Outline in a dark colour, then fill. No stray single pixels: every pixel should be there for a reason.'],
        ['Shade all 3 with one light and one dark tone', 'Choose a light direction, like top left. Add a lighter colour on that side and a darker one on the opposite side.'],
        ['Draw a 32×32 character', 'Big head, simple body: it reads better small. Check it at 100% zoom to see how it really looks.'],
        ['Animate a 4-frame walk and export it as a GIF', 'Frames: step, down, step with the other leg, up. Set 150 ms per frame, then export.'],
      ],
    ],
    [
      'Lerne Pixel-Art',
      [
        ['Öffne einen kostenlosen Pixel-Editor mit 16×16 Leinwand', 'Piskel (piskelapp.com) läuft im Browser. Zoom rein, bis jeder Pixel ein großes Quadrat ist.'],
        ['Lade eine Palette mit 8 Farben', 'Such dir auf lospec.com eine fertige 8-Farben-Palette aus und lade sie. Wenige Farben machen Pixel-Art schön.'],
        ['Zeichne 3 Gegenstände in 16×16: Tasse, Apfel, Schlüssel', 'Erst die Umrisse in einer dunklen Farbe, dann füllen. Keine einzelnen verirrten Pixel: Jeder Pixel hat einen Grund.'],
        ['Schattiere alle 3 mit einem hellen und einem dunklen Ton', 'Leg eine Lichtrichtung fest, etwa oben links. Setz auf dieser Seite einen helleren Ton und gegenüber einen dunkleren.'],
        ['Zeichne eine Figur in 32×32', 'Großer Kopf, einfacher Körper: Klein wirkt das besser. Schau sie bei 100 % Zoom an, um zu sehen, wie sie wirklich aussieht.'],
        ['Animiere einen Gang mit 4 Bildern und exportier ihn als GIF', 'Bilder: Schritt, unten, Schritt mit dem anderen Bein, oben. Stell 150 ms pro Bild ein und exportier.'],
      ],
    ],
    [
      yt('Pixel art tutorials', 'Pixel-Art-Tutorials', 'pixel art tutorial for beginners'),
      site('Lospec', 'https://lospec.com/', 'Free palettes and pixel art tutorials', 'Gratis-Paletten und Pixel-Art-Tutorials'),
      reddit('PixelArt'),
    ],
  ),
  console: g(
    'tech',
    { en: '1–2 months', de: '1–2 Monate' },
    'Free',
    [
      'Make your first small video game',
      [
        ['Install Godot and run an empty project', 'Download it free from godotengine.org. Create a new project and press Play (F5): a grey window means it works.'],
        ['Make a square that moves with the arrow keys', 'Add a CharacterBody2D with a sprite and a collision shape, then attach the built-in “Basic Movement” script.'],
        ['Tune gravity and the jump until you can reach a platform', 'The template already has both. Change the jump velocity a little at a time until jumping feels good.'],
        ['Build a level with 5 platforms', 'Use a TileMap or StaticBody2D blocks. Make the last jump the hardest one.'],
        ['Add a goal, a spike and a restart', 'Use an Area2D for both. Touching the spike reloads the scene; touching the goal shows “You win!”.'],
        ['Add one sound and your own art', 'Make free sound effects on sfxr.me and draw sprites in Piskel. A jump sound alone makes it feel much better.'],
        ['Let 3 people play it and fix the biggest problem', 'Watch them without helping. Write down where they get stuck, then change that one thing.'],
      ],
    ],
    [
      'Programmier dein erstes kleines Videospiel',
      [
        ['Installier Godot und starte ein leeres Projekt', 'Lad es kostenlos von godotengine.org. Leg ein neues Projekt an und drück auf Play (F5): Ein graues Fenster heißt, es läuft.'],
        ['Bau ein Quadrat, das sich mit den Pfeiltasten bewegt', 'Füg einen CharacterBody2D mit Sprite und Kollisionsform hinzu und häng das eingebaute Skript „Basic Movement“ an.'],
        ['Stell Schwerkraft und Sprung ein, bis du auf eine Plattform kommst', 'Die Vorlage hat beides schon. Ändere die Sprunggeschwindigkeit in kleinen Schritten, bis sich das Springen gut anfühlt.'],
        ['Bau ein Level mit 5 Plattformen', 'Nimm eine TileMap oder StaticBody2D-Blöcke. Mach den letzten Sprung zum schwersten.'],
        ['Füg ein Ziel, einen Stachel und einen Neustart hinzu', 'Nimm für beides eine Area2D. Berührt man den Stachel, startet die Szene neu; am Ziel erscheint „Gewonnen!“.'],
        ['Füg einen Sound und eigene Grafiken hinzu', 'Mach kostenlose Soundeffekte auf sfxr.me und zeichne Sprites in Piskel. Schon ein Sprung-Sound macht viel aus.'],
        ['Lass 3 Leute spielen und behebe das größte Problem', 'Schau zu, ohne zu helfen. Schreib auf, wo sie hängen bleiben, und ändere genau das.'],
      ],
    ],
    [
      yt('Godot beginner courses', 'Godot-Kurse für Anfänger', 'godot 4 beginner tutorial series'),
      site('Godot docs', 'https://docs.godotengine.org/', 'Official step-by-step tutorials', 'Offizielle Schritt-für-Schritt-Tutorials'),
      reddit('godot'),
    ],
  ),
  scratch: g(
    'tech',
    { en: '1–2 weeks', de: '1–2 Wochen' },
    'Free',
    [
      'Make a tiny game in Scratch',
      [
        ['Open Scratch and make the cat say “Hello!”', 'scratch.mit.edu → Create. Drag “when green flag clicked” and “say Hello!” together, then click the flag.'],
        ['Make a sprite move with all 4 arrow keys', 'Use “when right arrow key pressed” → “change x by 10”. Repeat for the other 3 directions with x and y.'],
        ['Add something to collect and a score', 'Make a variable “score”. When the sprite touches the item, change score by 1 and move the item to a random position.'],
        ['Add an enemy that ends the game', 'Let it glide to random positions forever. If it touches the player, say “Game over” and stop all.'],
        ['Play a sound and show “You win!” at 10 points', 'Use “if score = 10 then”: play a sound, switch to a win backdrop, stop all.'],
        ['Share it and let a friend try to beat your score', 'Click Share to get a link. Write down both scores.'],
      ],
    ],
    [
      'Programmier ein kleines Spiel in Scratch',
      [
        ['Öffne Scratch und lass die Katze „Hallo!“ sagen', 'scratch.mit.edu → Entwickeln. Zieh „Wenn grüne Flagge angeklickt“ und „sage Hallo!“ zusammen und klick auf die Flagge.'],
        ['Lass eine Figur mit allen 4 Pfeiltasten laufen', 'Nimm „Wenn Taste Pfeil nach rechts gedrückt“ → „ändere x um 10“. Wiederhol das für die anderen 3 Richtungen mit x und y.'],
        ['Füg etwas zum Einsammeln und einen Punktestand hinzu', 'Leg eine Variable „Punkte“ an. Berührt die Figur das Objekt, ändere Punkte um 1 und setz das Objekt an eine zufällige Position.'],
        ['Füg einen Gegner hinzu, der das Spiel beendet', 'Lass ihn fortlaufend zu zufälligen Positionen gleiten. Berührt er die Spielfigur: „Game over“ sagen und alles stoppen.'],
        ['Spiel bei 10 Punkten einen Sound und zeig „Gewonnen!“', 'Nimm „falls Punkte = 10, dann“: Sound abspielen, zu einem Sieg-Hintergrund wechseln, alles stoppen.'],
        ['Teil es und lass einen Freund deinen Punktestand schlagen', 'Klick auf Veröffentlichen, um einen Link zu bekommen. Schreib beide Punktestände auf.'],
      ],
    ],
    [
      yt('Scratch game tutorials', 'Scratch-Spiele-Tutorials', 'scratch game tutorial for beginners'),
      site('Scratch', 'https://scratch.mit.edu/', 'Free coding for games, from MIT', 'Gratis Spiele programmieren, vom MIT'),
      reddit('scratch'),
    ],
  ),
  synth: g(
    'music',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    'Free',
    [
      'Make your first song',
      [
        ['Install a free music app and play its demo', 'GarageBand (iPhone, Mac), BandLab (any phone or browser) or LMMS (PC). Done when you hear sound.'],
        ['Make a 4-bar drum loop with kick, snare and hi-hat', 'Kick on beats 1 and 3, snare on 2 and 4, hi-hat on every eighth. Then change one thing to make it yours.'],
        ['Add a bassline that uses only 3 notes', 'Pick a key, for example A minor: A, C and E. Play the bass together with the kick. Fewer notes sound better.'],
        ['Add an 8-note melody on top', 'Hum something over the loop first, then find it on the keys. Stay in the same scale as the bass.'],
        ['Arrange it into at least 1 minute: intro, main part, ending', 'Start with drums only, bring everything in, then take parts away again for the ending.'],
        ['Export the song and play it for someone', 'Export as MP3. Ask them which part they liked best.'],
      ],
    ],
    [
      'Produzier deinen ersten Song',
      [
        ['Installier eine kostenlose Musik-App und spiel die Demo ab', 'GarageBand (iPhone, Mac), BandLab (jedes Handy oder Browser) oder LMMS (PC). Fertig, wenn du etwas hörst.'],
        ['Bau einen Drum-Loop über 4 Takte mit Kick, Snare und Hi-Hat', 'Kick auf 1 und 3, Snare auf 2 und 4, Hi-Hat auf jede Achtel. Dann änder eine Sache, damit er deiner wird.'],
        ['Füg eine Basslinie mit nur 3 Tönen hinzu', 'Wähl eine Tonart, zum Beispiel a-Moll: A, C und E. Spiel den Bass zusammen mit der Kick. Weniger Töne klingen besser.'],
        ['Setz eine Melodie aus 8 Tönen obendrauf', 'Summ erst etwas über den Loop und such es dann auf den Tasten. Bleib in derselben Tonleiter wie der Bass.'],
        ['Bau daraus mindestens 1 Minute: Intro, Hauptteil, Ende', 'Fang nur mit Drums an, nimm alles dazu und lass zum Ende wieder Teile weg.'],
        ['Exportier den Song und spiel ihn jemandem vor', 'Exportier ihn als MP3. Frag, welcher Teil am besten gefallen hat.'],
      ],
    ],
    [
      yt('Music production for beginners', 'Musikproduktion für Anfänger', 'music production for beginners free'),
      site('musictheory.net', 'https://www.musictheory.net/', 'Free interactive music theory lessons', 'Kostenlose interaktive Musiktheorie'),
      reddit('WeAreTheMusicMakers'),
    ],
  ),
  ukulele: g(
    'music',
    { en: '3–6 weeks', de: '3–6 Wochen' },
    '€€',
    [
      'Learn your first songs on ukulele',
      [
        ['Tune your ukulele with a free tuner app', 'From the top string down: G, C, E, A. Turn each peg slowly until the app shows green.'],
        ['Play C and Am, 4 clean strums each', 'Press with your fingertips just behind the fret. Pluck each string alone: no buzzing means it’s clean.'],
        ['Add F and G, then play C–Am–F–G 4 times through', 'Change chords on beat 1 even if the chord isn’t perfect yet. Slow and steady beats fast and stopping.'],
        ['Switch between C and G 20 times in one minute', 'Set a 1-minute timer. Keep your fingers close to the strings between chords.'],
        ['Learn the down-down-up-up-down-up strum', 'Count “1, 2 and, 3 and, 4 and” out loud. Keep your hand moving even when it doesn’t hit the strings.'],
        ['Play one whole song without stopping', 'Pick a song with only C, Am, F and G. Play along with the recording at 75% speed first.'],
        ['Play it for someone or record a video', 'A phone video is enough. Mistakes are fine; just keep going.'],
      ],
    ],
    [
      'Lerne deine ersten Songs auf der Ukulele',
      [
        ['Stimm deine Ukulele mit einer kostenlosen Stimm-App', 'Von der oberen Saite nach unten: G, C, E, A. Dreh jeden Wirbel langsam, bis die App grün zeigt.'],
        ['Spiel C und Am, je 4 saubere Anschläge', 'Drück mit den Fingerkuppen direkt hinter dem Bundstäbchen. Zupf jede Saite einzeln: Kein Schnarren heißt sauber.'],
        ['Nimm F und G dazu und spiel 4-mal C–Am–F–G', 'Wechsle auf Schlag 1, auch wenn der Akkord noch nicht perfekt ist. Langsam und gleichmäßig schlägt schnell mit Pausen.'],
        ['Wechsle 20-mal in einer Minute zwischen C und G', 'Stell einen Timer auf 1 Minute. Halt die Finger zwischen den Akkorden nah an den Saiten.'],
        ['Lern den Schlag ab-ab-auf-auf-ab-auf', 'Zähl laut „1, 2 und, 3 und, 4 und“. Lass die Hand weiterschwingen, auch wenn sie die Saiten nicht trifft.'],
        ['Spiel einen ganzen Song ohne anzuhalten', 'Nimm einen Song nur mit C, Am, F und G. Spiel erst mit der Aufnahme bei 75 % Tempo mit.'],
        ['Spiel es jemandem vor oder nimm ein Video auf', 'Ein Handyvideo reicht. Fehler sind okay, spiel einfach weiter.'],
      ],
    ],
    [yt('Ukulele for beginners', 'Ukulele für Anfänger', 'ukulele for beginners lessons'), reddit('ukulele')],
  ),
  scarf: g(
    'crafts',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    '€',
    [
      'Knit your first scarf',
      [
        ['Get chunky yarn (200–300 g) and 8–10 mm needles', 'Chunky yarn grows fast. A light colour makes the stitches easier to see.'],
        ['Cast on 20 stitches with the long-tail method', 'Leave a tail 3 times as long as the width. Watch a short video and pause after each move.'],
        ['Knit 10 practice rows without losing a stitch', 'Knit every row. Count at the end of each row: still 20 stitches?'],
        ['Cast on your scarf, about 20 cm wide', 'Hold up the practice piece and count how many stitches make 20 cm. Cast on that many.'],
        ['Knit until the scarf is 50 cm long', '10 rows a day gets you there in about a week. Join a new ball at the start of a row.'],
        ['Keep knitting until it’s 150 cm', 'Wrap it around your neck to check. Long enough to tie is long enough.'],
        ['Bind off, weave in the ends and wear it', 'Knit 2, pull the first over the second, repeat. Weave each end through 5 cm of stitches.'],
      ],
    ],
    [
      'Strick deinen ersten Schal',
      [
        ['Besorg dicke Wolle (200–300 g) und Nadeln in 8–10 mm', 'Dicke Wolle wächst schnell. Eine helle Farbe macht die Maschen leichter sichtbar.'],
        ['Schlag 20 Maschen mit dem Kreuzanschlag an', 'Lass einen Faden, der 3-mal so lang ist wie die Breite. Schau ein kurzes Video und pausier nach jedem Handgriff.'],
        ['Strick 10 Probereihen, ohne eine Masche zu verlieren', 'Strick jede Reihe rechts. Zähl am Ende jeder Reihe: noch 20 Maschen?'],
        ['Schlag deinen Schal an, etwa 20 cm breit', 'Halt dein Probestück hoch und zähl, wie viele Maschen 20 cm ergeben. So viele schlägst du an.'],
        ['Strick, bis der Schal 50 cm lang ist', 'Mit 10 Reihen am Tag bist du in etwa einer Woche da. Setz ein neues Knäuel am Reihenanfang an.'],
        ['Strick weiter, bis er 150 cm lang ist', 'Wickel ihn zum Testen um den Hals. Lang genug zum Knoten ist lang genug.'],
        ['Kette ab, vernähe die Fäden und trag ihn', '2 Maschen stricken, die erste über die zweite ziehen, wiederholen. Zieh jedes Ende 5 cm durch die Maschen.'],
      ],
    ],
    [yt('Knit a scarf for beginners', 'Schal stricken für Anfänger', 'knit a scarf for beginners'), reddit('knitting')],
  ),
  crochet: g(
    'crafts',
    { en: '1–2 weeks', de: '1–2 Wochen' },
    '€',
    [
      'Crochet your first granny square',
      [
        ['Make a slip knot and a chain of 20', 'Hold the hook like a pencil. Keep each loop loose enough to slide; even chains matter more than speed.'],
        ['Crochet 5 rows of single crochet, 15 stitches wide', 'Go into the second chain from the hook. Chain 1 and turn at each row’s end, then count: still 15?'],
        ['Crochet 5 rows of double crochet', 'Wrap the yarn over before going into the stitch. Chain 3 to turn. Straight edges mean your count is right.'],
        ['Make a magic ring with 12 double crochets', 'Wrap the yarn twice around two fingers, crochet into the ring, then pull the tail to close the hole.'],
        ['Crochet a granny square of 3 rounds', 'Round 1: 4 groups of 3 double crochets. Rounds 2–3: each corner gets 3 dc, chain 2, 3 dc. Done when it lies flat.'],
        ['Make 4 squares and join them into a coaster', 'Weave in all ends first, then join with slip stitches through the back loops.'],
      ],
    ],
    [
      'Häkle dein erstes Granny Square',
      [
        ['Mach eine Anfangsschlinge und 20 Luftmaschen', 'Halt die Nadel wie einen Bleistift. Jede Schlinge soll locker genug zum Gleiten sein; gleichmäßig ist wichtiger als schnell.'],
        ['Häkle 5 Reihen feste Maschen, 15 Maschen breit', 'Stich in die zweite Luftmasche ab der Nadel ein. Am Reihenende 1 Luftmasche und wenden, dann zählen: noch 15?'],
        ['Häkle 5 Reihen Stäbchen', 'Mach einen Umschlag, bevor du in die Masche stichst. 3 Luftmaschen zum Wenden. Gerade Ränder heißen, die Zahl stimmt.'],
        ['Mach einen Fadenring mit 12 Stäbchen', 'Wickel den Faden zweimal um zwei Finger, häkle in den Ring und zieh am Ende das Fadenende fest, bis das Loch zu ist.'],
        ['Häkle ein Granny Square mit 3 Runden', 'Runde 1: 4 Gruppen aus 3 Stäbchen. Runde 2–3: In jede Ecke 3 Stäbchen, 2 Luftmaschen, 3 Stäbchen. Fertig, wenn es flach liegt.'],
        ['Häkle 4 Quadrate und verbinde sie zu einem Untersetzer', 'Vernähe erst alle Fäden und verbinde sie dann mit Kettmaschen durch die hinteren Maschenglieder.'],
      ],
    ],
    [yt('Crochet for beginners', 'Häkeln für Anfänger', 'crochet granny square for beginners'), reddit('crochet')],
  ),
  singing: g(
    'music',
    { en: '3–4 weeks', de: '3–4 Wochen' },
    'Free',
    [
      'Sing one song really well',
      [
        ['Find your lowest and highest comfortable note', 'Sing along with a free piano app, sliding down and up. Write both notes down and pick a song that stays between them.'],
        ['Warm up for 5 minutes: humming, lip trills, sirens', 'Do this before every practice. Sirens slide smoothly from low to high like an ambulance, without pushing.'],
        ['Learn the first verse and chorus by heart', 'Write the lyrics out by hand, then sing them line by line. Done when you can sing them without looking.'],
        ['Sing along with the original, one section at a time', 'Loop the hardest line 10 times. Breathe where the singer breathes.'],
        ['Record yourself and mark 3 off-key spots', 'Listen back with headphones. Write down the exact words where you go off.'],
        ['Fix those 3 spots: slowly first, then at full speed', 'Sing them on “ma” with a piano app until they’re right, then put the words back.'],
        ['Record the whole song with a karaoke track', 'Do 3 takes and keep the best one.'],
      ],
    ],
    [
      'Sing einen Song richtig gut',
      [
        ['Finde deinen tiefsten und höchsten bequemen Ton', 'Sing mit einer kostenlosen Klavier-App runter und rauf. Schreib beide Töne auf und such einen Song aus, der dazwischen bleibt.'],
        ['Wärm dich 5 Minuten auf: Summen, Lippenflattern, Sirenen', 'Mach das vor jedem Üben. Sirenen gleiten weich von tief nach hoch wie ein Krankenwagen, ohne zu drücken.'],
        ['Lern die erste Strophe und den Refrain auswendig', 'Schreib den Text mit der Hand ab und sing ihn Zeile für Zeile. Fertig, wenn du ihn ohne Hinschauen singen kannst.'],
        ['Sing Abschnitt für Abschnitt mit dem Original mit', 'Wiederhol die schwierigste Zeile 10-mal. Atme da, wo die Sängerin oder der Sänger atmet.'],
        ['Nimm dich auf und markier 3 schiefe Stellen', 'Hör es mit Kopfhörern an. Schreib die genauen Wörter auf, bei denen du danebenliegst.'],
        ['Bring die 3 Stellen in Ordnung: erst langsam, dann im Tempo', 'Sing sie mit einer Klavier-App auf „ma“, bis sie stimmen, dann wieder mit Text.'],
        ['Nimm den ganzen Song mit einer Karaoke-Version auf', 'Mach 3 Aufnahmen und behalt die beste.'],
      ],
    ],
    [
      yt('Singing lessons for beginners', 'Gesangsunterricht für Anfänger', 'singing lessons for beginners'),
      reddit('singing'),
    ],
  ),
  guitar: g(
    'music',
    { en: '1–3 months', de: '1–3 Monate' },
    '€€',
    [
      'Learn your first songs on guitar',
      [
        ['Tune your guitar with a free tuner app', 'Thickest to thinnest string: E, A, D, G, B, E. Tune up to the note rather than down to it.'],
        ['Play Em and G, 4 clean strums each', 'Press with your fingertips right behind the fret. Pluck each string alone to check that nothing buzzes.'],
        ['Add C and D, then play G–C–D–Em 4 times through', 'Change on beat 1 even if it’s not perfect. Keep the strumming hand moving.'],
        ['Switch between G and C 20 times in one minute', 'Set a 1-minute timer and move all fingers together as one shape. It gets fast quickly if you do it daily.'],
        ['Learn the down-down-up-up-down-up strum', 'Count “1, 2 and, 3 and, 4 and” out loud. Keep your hand swinging even when you miss the strings.'],
        ['Play one whole song slowly without stopping', 'Pick a song with only G, C, D and Em. Play along on YouTube at 75% speed first.'],
        ['Play it for a friend or record a video', 'A phone video counts. Keep going through mistakes.'],
      ],
    ],
    [
      'Lerne deine ersten Songs auf der Gitarre',
      [
        ['Stimm deine Gitarre mit einer kostenlosen Stimm-App', 'Von der dicksten zur dünnsten Saite: E, A, D, G, H, E. Stimm von unten an den Ton heran, nicht von oben.'],
        ['Spiel Em und G, je 4 saubere Anschläge', 'Drück mit den Fingerkuppen direkt hinter dem Bundstäbchen. Zupf jede Saite einzeln, damit nichts schnarrt.'],
        ['Nimm C und D dazu und spiel 4-mal G–C–D–Em', 'Wechsle auf Schlag 1, auch wenn es nicht perfekt ist. Die Schlaghand bleibt in Bewegung.'],
        ['Wechsle 20-mal in einer Minute zwischen G und C', 'Stell einen 1-Minuten-Timer und beweg alle Finger zusammen als eine Form. Täglich geübt wird das schnell flüssig.'],
        ['Lern den Schlag ab-ab-auf-auf-ab-auf', 'Zähl laut „1, 2 und, 3 und, 4 und“. Lass die Hand weiterschwingen, auch wenn du die Saiten verfehlst.'],
        ['Spiel einen ganzen Song langsam ohne anzuhalten', 'Nimm einen Song nur mit G, C, D und Em. Spiel erst auf YouTube bei 75 % Tempo mit.'],
        ['Spiel es einem Freund vor oder nimm ein Video auf', 'Ein Handyvideo zählt. Spiel über Fehler einfach weiter.'],
      ],
    ],
    [
      yt('Beginner guitar courses', 'Gitarrenkurse für Anfänger', 'beginner guitar course lessons'),
      site('JustinGuitar', 'https://www.justinguitar.com/', 'Free, very popular beginner guitar course', 'Kostenloser, sehr beliebter Anfängerkurs'),
      reddit('guitarlessons'),
    ],
  ),
  sourdough: g(
    'cooking',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    '€',
    [
      'Bake your first sourdough loaf',
      [
        ['Start a starter: 50 g flour and 50 g water in a jar', 'Wholemeal or rye flour works best. Stir well, cover loosely and mark the level with a rubber band.'],
        ['Feed it daily until it doubles within 6 hours', 'Each day keep 50 g and add 50 g flour and 50 g water. It usually takes 5–10 days; bubbles all through mean it’s ready.'],
        ['Mix the dough and do 4 rounds of stretch-and-folds', 'Follow one beginner recipe exactly, e.g. 500 g flour, 350 g water, 100 g starter, 10 g salt. Fold every 30 minutes.'],
        ['Let it rise until it’s 50% bigger', 'Usually 4–6 hours at room temperature. It should be bubbly, wobbly and domed.'],
        ['Shape a tight loaf and put it in the fridge overnight', 'Fold the edges to the middle, flip it and drag it towards you to tighten the top. Put it seam-up in a floured bowl.'],
        ['Bake it in a hot pot: 20 min with the lid, 25 without', 'Heat oven and pot to 250 °C; ask an adult to help with the hot pot. Score the top with a sharp blade first.'],
        ['Cut it after 1 hour and note what to change', 'Big holes only at the top: rise it longer. Flat loaf: shorter. Write it down and bake again.'],
      ],
    ],
    [
      'Back dein erstes Sauerteigbrot',
      [
        ['Setz einen Sauerteig an: 50 g Mehl und 50 g Wasser im Glas', 'Vollkorn- oder Roggenmehl klappt am besten. Gut umrühren, locker abdecken und den Füllstand mit einem Gummi markieren.'],
        ['Füttere ihn täglich, bis er sich in 6 Stunden verdoppelt', 'Behalt jeden Tag 50 g und gib 50 g Mehl und 50 g Wasser dazu. Das dauert meist 5–10 Tage; Blasen überall heißen fertig.'],
        ['Misch den Teig und mach 4 Runden Dehnen und Falten', 'Halt dich genau an ein Anfängerrezept, z. B. 500 g Mehl, 350 g Wasser, 100 g Sauerteig, 10 g Salz. Alle 30 Minuten falten.'],
        ['Lass ihn gehen, bis er um die Hälfte größer ist', 'Meist 4–6 Stunden bei Zimmertemperatur. Er soll blasig, wabbelig und gewölbt sein.'],
        ['Form einen straffen Laib und stell ihn über Nacht in den Kühlschrank', 'Falte die Ränder zur Mitte, dreh ihn um und zieh ihn zu dir, damit die Oberfläche straff wird. Mit dem Schluss nach oben in eine bemehlte Schüssel.'],
        ['Back ihn im heißen Topf: 20 Min mit Deckel, 25 ohne', 'Heiz Ofen und Topf auf 250 °C vor; lass dir beim heißen Topf von einem Erwachsenen helfen. Schneid die Oberfläche vorher mit einer scharfen Klinge ein.'],
        ['Schneid ihn nach 1 Stunde an und notier, was du änderst', 'Große Löcher nur oben: länger gehen lassen. Flacher Laib: kürzer. Schreib es auf und back noch einmal.'],
      ],
    ],
    [
      yt('Sourdough for beginners', 'Sauerteig für Anfänger', 'sourdough bread for beginners'),
      site('The Perfect Loaf', 'https://www.theperfectloaf.com/', 'Detailed beginner guides and schedules', 'Ausführliche Anleitungen und Zeitpläne'),
      reddit('Sourdough'),
    ],
  ),
  focaccia: g(
    'cooking',
    { en: '1 weekend', de: '1 Wochenende' },
    '€',
    [
      'Bake a focaccia',
      [
        ['Pick a no-knead focaccia recipe and get the ingredients', 'About 500 g flour, 400 g water, 7 g yeast, 10 g salt and olive oil. Read the recipe twice.'],
        ['Mix the dough the evening before', 'Stir until no dry flour is left. It will be very sticky, and that’s right. Cover the bowl.'],
        ['Let it rise in the fridge for 12–24 hours', 'Slow, cold rising gives flavour and big bubbles. It should at least double.'],
        ['Stretch it into an oiled tray and let it rise for 2 hours', 'Pour 3 tablespoons of oil into the tray. If the dough springs back, wait 15 minutes and stretch again.'],
        ['Dimple it all over and add the toppings', 'Oil your fingers and press right down to the tray. Drizzle oil, sprinkle flaky salt and rosemary.'],
        ['Bake at 230 °C for 20–25 minutes until golden', 'Ask an adult to help with the hot oven. Golden and crisp underneath means it’s done. Share it warm.'],
      ],
    ],
    [
      'Back eine Focaccia',
      [
        ['Such ein Focaccia-Rezept ohne Kneten und kauf die Zutaten', 'Etwa 500 g Mehl, 400 g Wasser, 7 g Hefe, 10 g Salz und Olivenöl. Lies das Rezept zweimal.'],
        ['Misch den Teig am Abend vorher', 'Rühr, bis kein trockenes Mehl mehr da ist. Er ist sehr klebrig, und das ist richtig. Deck die Schüssel ab.'],
        ['Lass ihn 12–24 Stunden im Kühlschrank gehen', 'Langsames, kaltes Gehen bringt Geschmack und große Blasen. Er soll sich mindestens verdoppeln.'],
        ['Zieh ihn auf einem geölten Blech aus und lass ihn 2 Stunden gehen', 'Gib 3 Esslöffel Öl aufs Blech. Zieht sich der Teig zurück, warte 15 Minuten und zieh ihn noch mal aus.'],
        ['Drück überall Mulden hinein und belege ihn', 'Öl deine Finger ein und drück bis aufs Blech. Träufel Öl darüber, streu Flockensalz und Rosmarin drauf.'],
        ['Back ihn bei 230 °C 20–25 Minuten goldbraun', 'Lass dir beim heißen Ofen von einem Erwachsenen helfen. Goldbraun und unten knusprig heißt fertig. Warm teilen!'],
      ],
    ],
    [yt('Focaccia recipes', 'Focaccia-Rezepte', 'easy focaccia recipe beginner'), reddit('Breadit')],
  ),
  ramen: g(
    'cooking',
    { en: '1 weekend', de: '1 Wochenende' },
    '€€',
    [
      'Make homemade ramen',
      [
        ['Choose shoyu ramen and write a shopping list', 'Shoyu (soy sauce) is the easiest style. You need noodles, chicken stock, soy sauce, mirin, eggs and spring onions.'],
        ['Marinate soft-boiled eggs the day before', 'Boil the eggs for exactly 6½ minutes, cool them in ice water, peel, and soak them overnight in soy sauce, mirin and water.'],
        ['Simmer the broth for at least 1 hour', 'Stock with ginger, garlic and spring onions on low heat. Don’t let it boil hard, or it turns cloudy.'],
        ['Mix the tare: soy sauce, mirin and a little sugar', 'About 3 tablespoons per bowl. It’s the salty base: taste a spoon of broth with a little tare to check.'],
        ['Prepare 3 toppings and cook the noodles', 'For example spring onions, sweetcorn and nori. Cook the noodles 1 minute less than the packet says.'],
        ['Build the bowl: tare, hot broth, noodles, toppings', 'Warm the bowl with hot water first. Lay the egg halves on top last, then take the photo.'],
      ],
    ],
    [
      'Koch selbstgemachte Ramen',
      [
        ['Entscheide dich für Shoyu-Ramen und schreib eine Einkaufsliste', 'Shoyu (Sojasoße) ist die einfachste Art. Du brauchst Nudeln, Hühnerbrühe, Sojasoße, Mirin, Eier und Frühlingszwiebeln.'],
        ['Mariniere weich gekochte Eier am Vortag', 'Koch die Eier genau 6½ Minuten, schreck sie in Eiswasser ab, schäl sie und leg sie über Nacht in Sojasoße, Mirin und Wasser.'],
        ['Lass die Brühe mindestens 1 Stunde köcheln', 'Brühe mit Ingwer, Knoblauch und Frühlingszwiebeln bei kleiner Hitze. Nicht sprudelnd kochen, sonst wird sie trüb.'],
        ['Rühr die Tare an: Sojasoße, Mirin und etwas Zucker', 'Etwa 3 Esslöffel pro Schüssel. Das ist die salzige Basis: Probier einen Löffel Brühe mit etwas Tare.'],
        ['Bereite 3 Toppings vor und koch die Nudeln', 'Zum Beispiel Frühlingszwiebeln, Mais und Nori. Koch die Nudeln 1 Minute kürzer als auf der Packung.'],
        ['Richte die Schüssel an: Tare, heiße Brühe, Nudeln, Toppings', 'Wärm die Schüssel erst mit heißem Wasser vor. Die Eihälften kommen zuletzt obendrauf, dann das Foto.'],
      ],
    ],
    [
      yt('Homemade ramen', 'Ramen selbst machen', 'homemade ramen from scratch'),
      site('Serious Eats', 'https://www.seriouseats.com/', 'Tested recipes that explain the why', 'Getestete Rezepte, die das Warum erklären'),
      reddit('ramen'),
    ],
  ),
  cinnamon: g(
    'cooking',
    { en: '1 day', de: '1 Tag' },
    '€',
    [
      'Bake cinnamon rolls',
      [
        ['Pick a beginner cinnamon roll recipe and read it twice', 'Check the timings: rolls take about 3 hours including rising.'],
        ['Knead the dough for 10 minutes until it springs back', 'Poke it: if the dent slowly fills back in, it’s ready. Let it rise until doubled, about 1 hour.'],
        ['Roll it out to 40 × 30 cm and spread the filling', 'Soft butter, brown sugar and cinnamon. Leave a 2 cm strip bare along one long side so the roll seals.'],
        ['Roll it up tightly and cut 12 equal pieces', 'Mark 12 equal spots first. Dental floss or a sharp knife cuts cleanly without squashing.'],
        ['Let them rise for 45 minutes and bake until golden', 'Usually 180 °C for 20–25 minutes; ask an adult to help with the oven. They should touch each other in the tin.'],
        ['Ice them while warm and share them', 'Icing: powdered sugar with a few spoons of milk or cream cheese. Take the photo before they’re gone.'],
      ],
    ],
    [
      'Back Zimtschnecken',
      [
        ['Such ein Zimtschnecken-Rezept für Anfänger und lies es zweimal', 'Prüf die Zeiten: Mit Gehen dauern Zimtschnecken etwa 3 Stunden.'],
        ['Knete den Teig 10 Minuten, bis er zurückfedert', 'Drück mit dem Finger hinein: Füllt sich die Delle langsam wieder, ist er fertig. Lass ihn gehen, bis er doppelt so groß ist, etwa 1 Stunde.'],
        ['Roll ihn auf 40 × 30 cm aus und streich die Füllung drauf', 'Weiche Butter, brauner Zucker und Zimt. Lass an einer langen Seite 2 cm frei, damit die Rolle zuhält.'],
        ['Roll ihn fest auf und schneid 12 gleiche Stücke', 'Markier zuerst 12 gleiche Abstände. Zahnseide oder ein scharfes Messer schneiden, ohne zu quetschen.'],
        ['Lass sie 45 Minuten gehen und back sie goldbraun', 'Meist 180 °C für 20–25 Minuten; lass dir am Ofen von einem Erwachsenen helfen. In der Form sollen sie sich berühren.'],
        ['Glasier sie noch warm und teil sie', 'Glasur: Puderzucker mit ein paar Löffeln Milch oder Frischkäse. Mach das Foto, bevor sie weg sind.'],
      ],
    ],
    [yt('Cinnamon rolls step by step', 'Zimtschnecken Schritt für Schritt', 'cinnamon rolls recipe from scratch'), reddit('Baking')],
  ),
  pasta: g(
    'cooking',
    { en: '1 afternoon', de: '1 Nachmittag' },
    '€',
    [
      'Make fresh pasta from scratch',
      [
        ['Weigh out 200 g flour and get 2 eggs', 'Enough for 2 people. “00” flour is best, but plain flour works too.'],
        ['Make a well, mix and knead for 10 minutes', 'Beat the eggs in the middle with a fork and pull the flour in slowly. Done when the dough is smooth and springs back.'],
        ['Wrap the dough and let it rest for 30 minutes', 'Cling film or an upturned bowl over it. Resting makes it much easier to roll.'],
        ['Roll it until you can see your hand through it', 'Work with a quarter at a time and flour lightly. With a pasta machine, go to the second-thinnest setting.'],
        ['Cut tagliatelle 1 cm wide', 'Flour the sheet, roll it up loosely and slice. Shake the strands loose and dust them with flour.'],
        ['Cook for 2 minutes and toss with a simple sauce', 'Salt the water well. Butter, parmesan and a splash of the pasta water is enough.'],
      ],
    ],
    [
      'Mach frische Pasta selbst',
      [
        ['Wieg 200 g Mehl ab und nimm 2 Eier', 'Reicht für 2 Personen. Mehl Typ 00 ist am besten, normales Mehl geht auch.'],
        ['Mach eine Mulde, misch alles und knete 10 Minuten', 'Verquirl die Eier in der Mitte mit einer Gabel und zieh das Mehl langsam hinein. Fertig, wenn der Teig glatt ist und zurückfedert.'],
        ['Wickel den Teig ein und lass ihn 30 Minuten ruhen', 'Frischhaltefolie oder eine umgedrehte Schüssel drüber. Nach dem Ruhen lässt er sich viel leichter ausrollen.'],
        ['Roll ihn aus, bis du deine Hand durchschimmern siehst', 'Nimm immer ein Viertel und bemehl leicht. Mit Nudelmaschine bis zur zweitdünnsten Stufe.'],
        ['Schneid Tagliatelle, 1 cm breit', 'Bemehl die Platte, roll sie locker auf und schneid sie. Schüttel die Bänder auseinander und bestäub sie mit Mehl.'],
        ['Koch sie 2 Minuten und schwenk sie in einer einfachen Soße', 'Salz das Wasser kräftig. Butter, Parmesan und ein Schuss Nudelwasser reichen.'],
      ],
    ],
    [yt('Fresh pasta for beginners', 'Frische Pasta für Anfänger', 'fresh pasta from scratch beginner'), reddit('pasta')],
  ),
  tomato: g(
    'garden',
    { en: '3–4 months', de: '3–4 Monate' },
    '€',
    [
      'Grow tomatoes on a balcony',
      [
        ['Get one compact tomato plant: cherry or bush', 'Look for “patio” or “balcony” on the label. One plant is enough to start.'],
        ['Plant it deep in a 20-litre pot with compost', 'Wait until nights stay above 10 °C. Bury the stem up to the first leaves: it grows roots along it.'],
        ['Put it in your sunniest spot and tie it to a stake', 'Tomatoes need 6 or more hours of sun. Tie the stem loosely with soft string.'],
        ['Water for 2 weeks using the finger test', 'Push a finger 2 cm into the soil: dry means water. Water the soil, never the leaves.'],
        ['Pinch out side shoots and feed weekly once it flowers', 'Side shoots grow in the gap between stem and leaf. Use tomato feed from the first flowers on.'],
        ['Harvest your first fully red tomatoes', 'Pick them when they’re fully coloured and slightly soft. Count your harvest.'],
      ],
    ],
    [
      'Zieh Tomaten auf dem Balkon',
      [
        ['Besorg eine kompakte Tomatenpflanze: Cherry- oder Buschtomate', 'Achte auf „Balkon“ oder „Terrasse“ auf dem Etikett. Eine Pflanze reicht für den Anfang.'],
        ['Pflanz sie tief in einen 20-Liter-Topf mit Erde', 'Warte, bis die Nächte über 10 °C bleiben. Setz den Stängel bis zu den ersten Blättern ein: Er bildet daran Wurzeln.'],
        ['Stell sie an den sonnigsten Platz und binde sie an einen Stab', 'Tomaten brauchen 6 oder mehr Stunden Sonne. Binde den Stängel locker mit weicher Schnur an.'],
        ['Gieß 2 Wochen lang mit dem Fingertest', 'Steck einen Finger 2 cm in die Erde: trocken heißt gießen. Gieß die Erde, nie die Blätter.'],
        ['Geiz sie aus und dünge wöchentlich, sobald sie blüht', 'Geiztriebe wachsen zwischen Stängel und Blatt. Ab den ersten Blüten mit Tomatendünger düngen.'],
        ['Ernte deine ersten ganz roten Tomaten', 'Pflück sie, wenn sie ganz durchgefärbt und etwas weich sind. Zähl deine Ernte.'],
      ],
    ],
    [
      yt('Container tomato growing', 'Tomaten im Topf ziehen', 'growing tomatoes in pots balcony'),
      site('RHS gardening advice', 'https://www.rhs.org.uk/advice', 'Trusted beginner gardening guides', 'Verlässliche Gartenanleitungen für Anfänger'),
      reddit('vegetablegardening'),
    ],
  ),
  plant: g(
    'garden',
    { en: '3–6 weeks', de: '3–6 Wochen' },
    'Free',
    [
      'Propagate houseplants from cuttings',
      [
        ['Choose an easy plant: pothos, tradescantia or monstera', 'Ask friends or family for a cutting, or buy one small plant.'],
        ['Take 3 cuttings just below a node', 'A node is the bump where a leaf grows. Use clean scissors, cut 10–15 cm long and remove the lowest leaf.'],
        ['Put them in water in bright, indirect light', 'The nodes go under water, the leaves stay above it. No direct midday sun.'],
        ['Change the water every week until roots appear', 'Roots usually show after 1–3 weeks. Take a photo each week to watch them grow.'],
        ['Pot them in soil when the roots are 3 cm long', 'A small pot with drainage holes. Keep the soil slightly moist for the first 2 weeks.'],
        ['Give one of the new plants to a friend', 'Write the plant’s name and how to water it on a little card.'],
      ],
    ],
    [
      'Vermehre Zimmerpflanzen aus Stecklingen',
      [
        ['Such dir eine einfache Pflanze aus: Efeutute, Tradeskantie oder Monstera', 'Frag Freunde oder Familie nach einem Steckling oder kauf eine kleine Pflanze.'],
        ['Schneid 3 Stecklinge direkt unter einem Knoten ab', 'Ein Knoten ist die Verdickung, an der ein Blatt wächst. Mit sauberer Schere 10–15 cm lang schneiden und das unterste Blatt entfernen.'],
        ['Stell sie in Wasser an einen hellen Platz ohne direkte Sonne', 'Die Knoten unter Wasser, die Blätter darüber. Keine direkte Mittagssonne.'],
        ['Wechsle jede Woche das Wasser, bis Wurzeln kommen', 'Wurzeln zeigen sich meist nach 1–3 Wochen. Mach jede Woche ein Foto, um zuzusehen, wie sie wachsen.'],
        ['Topf sie in Erde ein, wenn die Wurzeln 3 cm lang sind', 'Ein kleiner Topf mit Abflussloch. Halt die Erde die ersten 2 Wochen leicht feucht.'],
        ['Schenk eine der neuen Pflanzen einem Freund', 'Schreib den Namen der Pflanze und wie man sie gießt auf ein kleines Kärtchen.'],
      ],
    ],
    [yt('Plant propagation for beginners', 'Pflanzen vermehren für Anfänger', 'houseplant propagation for beginners'), reddit('houseplants')],
  ),
  canoe: g(
    'outdoors',
    { en: '2–4 weekends', de: '2–4 Wochenenden' },
    '€€',
    [
      'Learn to canoe',
      [
        ['Book a beginner paddling session with a guide', 'Search for a canoe club or a rental with lessons. Always wear a life jacket on the water.'],
        ['Practise getting in and out at the shore 3 times', 'Step into the middle, stay low and hold both sides. Never stand up in a canoe.'],
        ['Paddle 100 m in a straight line', 'Top hand on the grip, turn from your body. Keep the paddle close to the boat.'],
        ['Learn the J-stroke and paddle around a buoy', 'At the end of each stroke turn the paddle outward like a J. It stops the canoe from turning.'],
        ['Practise a capsize with your instructor', 'Learn to stay with the boat and get back to the shore. Only with an instructor and a life jacket.'],
        ['Paddle on a calm lake for 1 hour with a friend', 'Check the weather and wind first, and tell someone where you’re going and when you’ll be back.'],
      ],
    ],
    [
      'Lerne Kanufahren',
      [
        ['Buch eine Paddelstunde für Anfänger mit Begleitung', 'Such nach einem Kanuverein oder Verleih mit Kursen. Auf dem Wasser immer eine Schwimmweste tragen.'],
        ['Üb 3-mal das Ein- und Aussteigen am Ufer', 'Tritt in die Mitte, bleib tief und halt dich an beiden Seiten fest. Steh im Kanu nie auf.'],
        ['Paddle 100 m geradeaus', 'Obere Hand auf den Griff, dreh dich aus dem Oberkörper. Halt das Paddel nah am Boot.'],
        ['Lern den J-Schlag und paddle um eine Boje', 'Dreh das Paddel am Ende jedes Schlags nach außen wie ein J. So dreht das Kanu nicht weg.'],
        ['Üb das Kentern mit deinem Trainer', 'Lern, beim Boot zu bleiben und ans Ufer zurückzukommen. Nur mit Trainer und Schwimmweste.'],
        ['Paddle mit einem Freund 1 Stunde auf einem ruhigen See', 'Prüf vorher Wetter und Wind und sag jemandem, wohin ihr fahrt und wann ihr zurück seid.'],
      ],
    ],
    [yt('Canoe strokes for beginners', 'Paddelschläge für Anfänger', 'canoe paddling strokes for beginners'), reddit('Canoeing')],
  ),
  bench: g(
    'wood',
    { en: '1–2 weekends', de: '1–2 Wochenenden' },
    '€',
    [
      'Restore an old piece of wooden furniture',
      [
        ['Find a wooden piece to restore and photograph it', 'A stool, chair or bench. The “before” photo will make the “after” feel amazing.'],
        ['Tighten every loose joint and screw', 'Wiggle each leg. Glue loose joints with wood glue and clamp them for 24 hours.'],
        ['Sand off the old finish with 80 grit', 'Wear a dust mask. Always sand along the grain, never across it.'],
        ['Sand again with 120, then 180 grit', 'Each finer grit removes the scratches of the last one. Done when it feels smooth as paper.'],
        ['Wipe off all the dust with a damp cloth', 'Dust under the oil turns into bumps. Let it dry for 30 minutes.'],
        ['Apply 3 thin coats of oil, one day apart', 'Wipe on, wait 15 minutes, wipe off the extra. Oily rags can catch fire: lay them flat outside to dry.'],
        ['Take the “after” photo from the same angle', 'Same spot, same light, then put both photos side by side.'],
      ],
    ],
    [
      'Restaurier ein altes Holzmöbel',
      [
        ['Such dir ein Holzstück zum Restaurieren und fotografier es', 'Ein Hocker, Stuhl oder eine Bank. Das Vorher-Foto macht das Nachher erst richtig gut.'],
        ['Zieh alle lockeren Verbindungen und Schrauben fest', 'Wackel an jedem Bein. Leim lockere Verbindungen mit Holzleim und spann sie 24 Stunden ein.'],
        ['Schleif die alte Oberfläche mit 80er Körnung ab', 'Trag eine Staubmaske. Schleif immer mit der Maserung, nie quer.'],
        ['Schleif noch einmal mit 120er, dann 180er Körnung', 'Jede feinere Körnung entfernt die Kratzer der vorigen. Fertig, wenn es sich glatt wie Papier anfühlt.'],
        ['Wisch den ganzen Staub mit einem feuchten Tuch ab', 'Staub unter dem Öl wird zu Pickeln. Lass es 30 Minuten trocknen.'],
        ['Trag 3 dünne Schichten Öl auf, je einen Tag Abstand', 'Auftragen, 15 Minuten warten, Überschuss abwischen. Ölige Lappen können sich entzünden: draußen flach ausgebreitet trocknen lassen.'],
        ['Mach das Nachher-Foto aus demselben Winkel', 'Gleicher Ort, gleiches Licht, dann beide Fotos nebeneinander.'],
      ],
    ],
    [yt('Furniture restoration for beginners', 'Möbel restaurieren für Anfänger', 'wood furniture restoration beginner'), reddit('woodworking')],
  ),
  tools: g(
    'wood',
    { en: '2–4 weeks', de: '2–4 Wochen' },
    '€€',
    [
      'Set up a small beginner workshop',
      [
        ['Clear a corner with a sturdy table and good light', 'The table shouldn’t wobble when you saw on it. A clamp-on lamp is enough.'],
        ['Gather 5 basic tools: saw, square, ruler, clamps, sandpaper', 'Second-hand is fine. Ask your family what they already have.'],
        ['Get safety gear: glasses, ear and dust protection', 'Wear the glasses every time, even for “just one cut”.'],
        ['Make 10 straight cuts on scrap wood', 'Mark each line with the square and start the cut slowly. Check every cut with the square.'],
        ['Build a simple wall rack for your tools', 'A board with screws or pegs. Every tool gets its own spot.'],
        ['Make one small project, like a box', 'Write down which tool you missed. Buy tools only when a project needs them.'],
      ],
    ],
    [
      'Richte dir eine kleine Werkstatt ein',
      [
        ['Räum eine Ecke mit stabilem Tisch und gutem Licht frei', 'Der Tisch darf beim Sägen nicht wackeln. Eine Klemmlampe reicht.'],
        ['Besorg 5 Grundwerkzeuge: Säge, Winkel, Maßstab, Zwingen, Schleifpapier', 'Gebraucht ist völlig okay. Frag deine Familie, was schon da ist.'],
        ['Besorg Schutzausrüstung: Brille, Gehör- und Staubschutz', 'Trag die Brille jedes Mal, auch für „nur einen Schnitt“.'],
        ['Mach 10 gerade Schnitte in Restholz', 'Zeichne jede Linie mit dem Winkel an und setz die Säge langsam an. Prüf jeden Schnitt mit dem Winkel.'],
        ['Bau ein einfaches Wandbrett für dein Werkzeug', 'Ein Brett mit Schrauben oder Haken. Jedes Werkzeug bekommt seinen Platz.'],
        ['Bau ein kleines Projekt, zum Beispiel eine Kiste', 'Schreib auf, welches Werkzeug dir gefehlt hat. Kauf Werkzeug erst, wenn ein Projekt es braucht.'],
      ],
    ],
    [yt('Beginner woodworking', 'Holzarbeiten für Anfänger', 'woodworking for beginners getting started'), reddit('woodworking')],
  ),
  birdhouse: g(
    'wood',
    { en: '1 weekend', de: '1 Wochenende' },
    '€',
    [
      'Build a birdhouse',
      [
        ['Find a free birdhouse plan for birds near you', 'The hole size decides who moves in: 28 mm for blue tits, 32 mm for great tits and sparrows.'],
        ['Buy untreated wood, about 18 mm thick', 'Untreated pine or spruce. No paint or varnish inside: it can harm the birds.'],
        ['Mark and cut all 6 pieces', 'Measure twice, cut once, and ask an adult to help with the saw. Number the pieces in pencil.'],
        ['Drill the entrance hole and 4 drainage holes', 'The entrance about 18 cm above the floor. Small holes in the floor let rainwater out.'],
        ['Screw it together with a roof that opens', 'A hinged or removable roof lets you clean it out every autumn.'],
        ['Hang it 2–4 m high, out of reach of cats', 'Facing east or south-east is best, away from wind and the midday sun.'],
      ],
    ],
    [
      'Bau ein Vogelhaus',
      [
        ['Such einen kostenlosen Vogelhaus-Bauplan für Vögel bei dir', 'Die Lochgröße entscheidet, wer einzieht: 28 mm für Blaumeisen, 32 mm für Kohlmeisen und Spatzen.'],
        ['Kauf unbehandeltes Holz, etwa 18 mm dick', 'Unbehandelte Kiefer oder Fichte. Innen keine Farbe und kein Lack: Das kann den Vögeln schaden.'],
        ['Zeichne alle 6 Teile an und säg sie aus', 'Zweimal messen, einmal sägen, und lass dir an der Säge von einem Erwachsenen helfen. Nummerier die Teile mit Bleistift.'],
        ['Bohr das Einflugloch und 4 Abflusslöcher', 'Das Einflugloch etwa 18 cm über dem Boden. Kleine Löcher im Boden lassen Regenwasser ab.'],
        ['Schraub es mit einem aufklappbaren Dach zusammen', 'Ein Klapp- oder abnehmbares Dach, damit du es jeden Herbst sauber machen kannst.'],
        ['Häng es 2–4 m hoch auf, außer Reichweite von Katzen', 'Am besten nach Osten oder Südosten, weg von Wind und Mittagssonne.'],
      ],
    ],
    [yt('Birdhouse build', 'Vogelhaus bauen', 'how to build a birdhouse beginner'), reddit('woodworking')],
  ),
  radio: g(
    'tech',
    { en: '2–4 weeks', de: '2–4 Wochen' },
    '€',
    [
      'Repair an old electronic device',
      [
        ['Pick a broken device that runs on batteries or USB', 'Start with low voltage: a speaker, radio, toy or lamp. Never open TVs, microwaves or anything plugged into the wall.'],
        ['Write down exactly what’s wrong', 'Does it turn on? Any sound, smell or heat? A clear symptom is half the repair.'],
        ['Find a repair or teardown guide for it', 'Search iFixit or YouTube for the model name, and read it all before you start.'],
        ['Open it and photograph every step', 'Keep the screws in an egg box in order. The photos help you put it back together.'],
        ['Check the 3 most common faults', 'A loose or broken wire, a dirty contact (clean it with a cotton bud), a dead battery or fuse.'],
        ['Fix or replace the broken part', 'Order the exact part number. Ask an adult to help if it needs soldering.'],
        ['Put it back together and test it', 'Follow your photos backwards. Test it before you close the last screws.'],
      ],
    ],
    [
      'Reparier ein altes Elektrogerät',
      [
        ['Such dir ein kaputtes Gerät mit Batterie oder USB aus', 'Fang mit niedriger Spannung an: Lautsprecher, Radio, Spielzeug oder Lampe. Öffne nie Fernseher, Mikrowellen oder etwas am Stromnetz.'],
        ['Schreib genau auf, was nicht stimmt', 'Geht es an? Gibt es Geräusche, Geruch oder Wärme? Ein klares Symptom ist die halbe Reparatur.'],
        ['Such eine Reparatur- oder Zerlegeanleitung dafür', 'Such auf iFixit oder YouTube nach dem Modellnamen und lies alles, bevor du anfängst.'],
        ['Öffne es und fotografier jeden Schritt', 'Leg die Schrauben der Reihe nach in einen Eierkarton. Die Fotos helfen dir beim Zusammenbauen.'],
        ['Prüf die 3 häufigsten Fehler', 'Ein lockeres oder gebrochenes Kabel, ein schmutziger Kontakt (mit Wattestäbchen reinigen), eine leere Batterie oder Sicherung.'],
        ['Reparier oder tausch das kaputte Teil', 'Bestell genau die Teilenummer. Lass dir von einem Erwachsenen helfen, wenn gelötet werden muss.'],
        ['Bau es wieder zusammen und teste es', 'Geh deine Fotos rückwärts durch. Teste es, bevor du die letzten Schrauben eindrehst.'],
      ],
    ],
    [
      yt('Electronics repair for beginners', 'Elektronik reparieren für Anfänger', 'electronics repair for beginners'),
      site('iFixit', 'https://www.ifixit.com/', 'Free step-by-step repair guides', 'Kostenlose Reparaturanleitungen'),
      reddit('AskElectronics'),
    ],
  ),
  circuit: g(
    'tech',
    { en: '1–2 weeks', de: '1–2 Wochen' },
    '€',
    [
      'Learn to solder',
      [
        ['Get a temperature-controlled iron, a stand and lead-free solder', 'A starter kit with a stand and a wet sponge is ideal. Set it to about 350 °C.'],
        ['Read a safety guide and set up by an open window', 'The tip is 350 °C: always put it back in the stand. Wash your hands afterwards.'],
        ['Solder 10 joints on a practice board', 'Heat the pad and the wire together for 2 seconds, then add solder. A good joint is shiny and shaped like a small volcano.'],
        ['Redo 3 bad joints with desoldering braid', 'Lay the braid on the joint and heat it: it soaks up the solder. Then solder the joint again.'],
        ['Build a small kit: blinking LEDs', 'Start with the lowest parts (resistors). The longer LED leg is +. Check each joint as you go.'],
        ['Make it blink and film it', 'If it doesn’t work, look for solder bridges between joints and LEDs put in the wrong way round.'],
      ],
    ],
    [
      'Lerne Löten',
      [
        ['Besorg einen regelbaren Lötkolben, einen Ständer und bleifreies Lötzinn', 'Ein Einsteigerset mit Ständer und nassem Schwamm ist ideal. Stell ihn auf etwa 350 °C.'],
        ['Lies eine Sicherheitsanleitung und bau am offenen Fenster auf', 'Die Spitze ist 350 °C heiß: Leg sie immer in den Ständer zurück. Danach Hände waschen.'],
        ['Löte 10 Lötstellen auf einer Übungsplatine', 'Erhitz Lötpad und Draht 2 Sekunden zusammen, dann Lötzinn dazu. Eine gute Lötstelle glänzt und sieht aus wie ein kleiner Vulkan.'],
        ['Mach 3 schlechte Lötstellen mit Entlötlitze neu', 'Leg die Litze auf die Lötstelle und erhitz sie: Sie saugt das Zinn auf. Dann neu löten.'],
        ['Bau einen kleinen Bausatz: blinkende LEDs', 'Fang mit den flachsten Teilen an (Widerstände). Das längere LED-Bein ist +. Prüf jede Lötstelle gleich.'],
        ['Bring es zum Blinken und film es', 'Wenn es nicht geht, such nach Zinnbrücken zwischen Lötstellen und falsch herum eingesetzten LEDs.'],
      ],
    ],
    [
      yt('Soldering for beginners', 'Löten für Anfänger', 'how to solder for beginners'),
      site('Adafruit Learn', 'https://learn.adafruit.com/', 'Free guides, including soldering basics', 'Gratis-Anleitungen, auch zu Lötgrundlagen'),
      reddit('AskElectronics'),
    ],
  ),
  runner: g(
    'fitness',
    { en: '8–12 weeks', de: '8–12 Wochen' },
    'Free',
    [
      'Run 10 km without stopping',
      [
        ['Run-walk for 20 minutes: 1 min running, 1½ walking', 'Run slowly enough to talk. Comfortable trainers are all you need to start.'],
        ['Do 3 run-walks this week with a rest day between', 'Write the date and minutes down; a screenshot of your running app counts.'],
        ['Run 10 minutes without walking', 'Slow down instead of stopping. Most people get here in 3–4 weeks.'],
        ['Run 5 km without stopping', 'Use a free app to measure. Your pace doesn’t matter, only that you keep going.'],
        ['Run 7 km slowly', 'Add about 10% distance a week: one long, slow run a week and the others short.'],
        ['Run 10 km without stopping', 'Slow is fine. Eat something light 2 hours before and bring water.'],
      ],
    ],
    [
      'Lauf 10 km ohne Pause',
      [
        ['Lauf-geh 20 Minuten: 1 Min laufen, 1½ gehen', 'Lauf so langsam, dass du reden kannst. Bequeme Turnschuhe reichen für den Anfang.'],
        ['Mach diese Woche 3 Lauf-Geh-Einheiten mit Ruhetag dazwischen', 'Schreib Datum und Minuten auf; ein Screenshot deiner Lauf-App zählt.'],
        ['Lauf 10 Minuten ohne zu gehen', 'Werd langsamer, statt anzuhalten. Die meisten schaffen das nach 3–4 Wochen.'],
        ['Lauf 5 km am Stück', 'Miss mit einer kostenlosen App. Das Tempo ist egal, nur dranbleiben zählt.'],
        ['Lauf langsam 7 km', 'Steiger die Strecke um etwa 10 % pro Woche: ein langer, langsamer Lauf pro Woche, die anderen kurz.'],
        ['Lauf 10 km ohne anzuhalten', 'Langsam ist völlig okay. Iss 2 Stunden vorher etwas Leichtes und nimm Wasser mit.'],
      ],
    ],
    [yt('Beginner running plans', 'Laufpläne für Anfänger', 'beginner running plan couch to 5k'), reddit('C25K')],
  ),
  trail: g(
    'outdoors',
    { en: '4–6 weeks', de: '4–6 Wochen' },
    '€',
    [
      'Try trail running',
      [
        ['Find an easy, marked trail of 3–5 km', 'Use a hiking app or map and look for “easy” with little climbing.'],
        ['Pack water and tell someone your route', 'Charge your phone and bring a light jacket if it’s cold.'],
        ['Run-walk the trail: run the flats, walk the climbs', 'Everyone walks the steep parts. Short steps keep you safe.'],
        ['Practise 5 downhill runs with short, quick steps', 'Look 3–4 m ahead, not at your feet, and use your arms for balance.'],
        ['Run the whole loop without stopping on the flat parts', 'Keep a pace where you can still talk. Note your time.'],
        ['Run it again and beat your time by 1 minute', 'Same loop, same start. Just walk a little less.'],
      ],
    ],
    [
      'Probier Trailrunning',
      [
        ['Such eine leichte, markierte Strecke von 3–5 km', 'Nimm eine Wander-App oder Karte und achte auf „leicht“ mit wenig Höhenmetern.'],
        ['Pack Wasser ein und sag jemandem deine Route', 'Lad dein Handy und nimm eine leichte Jacke mit, wenn es kalt ist.'],
        ['Lauf-geh die Strecke: flach laufen, bergauf gehen', 'Alle gehen an steilen Stellen. Kurze Schritte halten dich sicher.'],
        ['Üb 5 Bergab-Läufe mit kurzen, schnellen Schritten', 'Schau 3–4 m nach vorne, nicht auf die Füße, und halt mit den Armen das Gleichgewicht.'],
        ['Lauf die ganze Runde, ohne im Flachen anzuhalten', 'Halt ein Tempo, bei dem du noch reden kannst. Notier deine Zeit.'],
        ['Lauf sie noch mal und sei 1 Minute schneller', 'Gleiche Runde, gleicher Start. Geh einfach etwas weniger.'],
      ],
    ],
    [
      yt('Trail running for beginners', 'Trailrunning für Anfänger', 'trail running tips for beginners'),
      site('AllTrails', 'https://www.alltrails.com/', 'Find trails near you', 'Wege in deiner Nähe finden'),
      reddit('trailrunning'),
    ],
  ),
  mountain: g(
    'outdoors',
    { en: '4–8 weeks', de: '4–8 Wochen' },
    '€',
    [
      'Hike to a summit',
      [
        ['Go on a 2-hour hike', 'Comfortable shoes, water and snacks. Notice how your legs feel the next day.'],
        ['Hike 3 hours with 400 m of climbing', 'Go slowly uphill: you should still be able to talk.'],
        ['Break in your boots on 3 walks', 'New boots can give you blisters on a long day. Wear the socks you’ll hike in.'],
        ['Pick a beginner summit and check the forecast', 'Check the route length, climbing and weather. Go with an adult or a group.'],
        ['Pack water, food, layers and an offline map', '2 litres of water, a warm layer and a rain jacket, even when it’s sunny. Download the map to your phone.'],
        ['Reach the summit and take the photo', 'Start early. Turn back if the weather changes: the mountain will still be there.'],
      ],
    ],
    [
      'Wander auf einen Gipfel',
      [
        ['Mach eine 2-stündige Wanderung', 'Bequeme Schuhe, Wasser und Snacks. Achte darauf, wie sich deine Beine am nächsten Tag anfühlen.'],
        ['Wandere 3 Stunden mit 400 Höhenmetern', 'Geh bergauf langsam: Du solltest noch reden können.'],
        ['Lauf deine Schuhe auf 3 Spaziergängen ein', 'Neue Schuhe können an einem langen Tag Blasen machen. Trag die Socken, mit denen du wandern wirst.'],
        ['Such dir einen Anfängergipfel aus und prüf die Wettervorhersage', 'Prüf Länge, Höhenmeter und Wetter. Geh mit einem Erwachsenen oder einer Gruppe.'],
        ['Pack Wasser, Essen, Kleidungsschichten und eine Offline-Karte', '2 Liter Wasser, eine warme Schicht und eine Regenjacke, auch bei Sonne. Lad die Karte aufs Handy.'],
        ['Erreich den Gipfel und mach das Foto', 'Brich früh auf. Kehr um, wenn das Wetter umschlägt: Der Berg bleibt da.'],
      ],
    ],
    [
      yt('Hiking for beginners', 'Wandern für Anfänger', 'hiking for beginners tips'),
      site('AllTrails', 'https://www.alltrails.com/', 'Routes, difficulty and reviews', 'Routen, Schwierigkeit und Bewertungen'),
      reddit('hiking'),
    ],
  ),
  climb: g(
    'fitness',
    { en: '4 weeks', de: '4 Wochen' },
    '€€',
    [
      'Get into bouldering',
      [
        ['Do an intro session at a climbing gym', 'They teach you the rules and how to fall. Rent shoes; buy your own later.'],
        ['Climb 10 routes of the easiest grade', 'Climb down instead of jumping when you can, and rest 2–3 minutes between climbs.'],
        ['Practise 5 controlled falls from low down', 'Land on both feet, bend your knees and roll backwards.'],
        ['Climb 3 routes with silent feet', 'Place each foot so carefully that it makes no sound. Good footwork saves your arms.'],
        ['Finish your first route of the next grade', 'Try the same problem several times. Rest, watch others, then try again.'],
        ['Finish 3 routes of that grade with a friend', 'Take turns and give each other tips. Write down the routes you’ve done.'],
      ],
    ],
    [
      'Fang mit Bouldern an',
      [
        ['Mach einen Einführungskurs in einer Kletterhalle', 'Dort lernst du die Regeln und wie man fällt. Leih Schuhe aus; eigene kaufst du später.'],
        ['Klettere 10 Routen im leichtesten Grad', 'Kletter lieber ab, statt zu springen, und mach 2–3 Minuten Pause zwischen den Routen.'],
        ['Üb 5 kontrollierte Stürze aus geringer Höhe', 'Lande auf beiden Füßen, beug die Knie und roll nach hinten ab.'],
        ['Klettere 3 Routen mit leisen Füßen', 'Setz jeden Fuß so genau, dass er kein Geräusch macht. Gute Fußarbeit schont die Arme.'],
        ['Schaff deine erste Route im nächsten Grad', 'Versuch dasselbe Problem mehrmals. Pause, anderen zuschauen, dann wieder probieren.'],
        ['Schaff 3 Routen in diesem Grad mit einem Freund', 'Wechselt euch ab und gebt euch Tipps. Schreib die geschafften Routen auf.'],
      ],
    ],
    [yt('Bouldering technique for beginners', 'Boulder-Technik für Anfänger', 'bouldering technique for beginners'), reddit('bouldering')],
  ),
  journal: g(
    'writing',
    { en: '30 days', de: '30 Tage' },
    'Free',
    [
      'Start a journaling habit',
      [
        ['Pick a notebook and write today’s date on page 1', 'Any notebook works. Keep it where you’ll see it at your writing time.'],
        ['Write 3 lines tonight: what happened and how it felt', 'There are no rules for style. Three lines is enough.'],
        ['Write on 5 days this week', 'The same time each day helps; right after brushing your teeth works well.'],
        ['Answer 3 prompts on days you’re stuck', '“What made me smile today?”, “What am I looking forward to?”, “What would I tell my younger self?”'],
        ['Read back your first week and mark a favourite line', 'Notice what changed since the first page.'],
        ['Fill 30 pages', 'Add a sketch, a ticket or a photo now and then. It’s yours.'],
      ],
    ],
    [
      'Fang an, Tagebuch zu schreiben',
      [
        ['Such dir ein Notizbuch aus und schreib das heutige Datum auf Seite 1', 'Jedes Notizbuch geht. Leg es dahin, wo du es zur Schreibzeit siehst.'],
        ['Schreib heute Abend 3 Zeilen: was passiert ist und wie es sich anfühlte', 'Es gibt keine Stilregeln. Drei Zeilen reichen.'],
        ['Schreib an 5 Tagen diese Woche', 'Jeden Tag zur selben Zeit hilft; direkt nach dem Zähneputzen klappt gut.'],
        ['Beantworte 3 Fragen an Tagen, an denen dir nichts einfällt', '„Was hat mich heute zum Lächeln gebracht?“, „Worauf freue ich mich?“, „Was würde ich meinem jüngeren Ich sagen?“'],
        ['Lies deine erste Woche nach und markier eine Lieblingszeile', 'Achte darauf, was sich seit der ersten Seite verändert hat.'],
        ['Füll 30 Seiten', 'Kleb ab und zu eine Skizze, ein Ticket oder ein Foto ein. Es gehört dir.'],
      ],
    ],
    [yt('Journaling for beginners', 'Tagebuchschreiben für Anfänger', 'journaling for beginners how to start'), reddit('Journaling')],
  ),
  camera: g(
    'photo',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    '€€',
    [
      'Shoot your first roll of film',
      [
        ['Get a simple film camera that works', 'A second-hand point-and-shoot or a single-use camera. Check that the battery works.'],
        ['Buy a roll of ISO 400 colour film', 'ISO 400 copes with sun and shade. Get 36 exposures.'],
        ['Load the film and wind on to frame 1', 'Do it in the shade. Pull the film to the mark, close the back and wind until the counter shows 1.'],
        ['Shoot 36 photos in good light', 'Light behind you, subject 1–3 m away. Think before each shot: there’s no delete button.'],
        ['Get it developed and scanned at a lab', 'Ask for digital scans. It usually takes a few days.'],
        ['Pick your 3 best photos and share them', 'Write down why they work: the light, the subject or the moment?'],
      ],
    ],
    [
      'Fotografier deinen ersten Film',
      [
        ['Besorg eine einfache, funktionierende Filmkamera', 'Eine gebrauchte Kompaktkamera oder eine Einwegkamera. Prüf, ob die Batterie geht.'],
        ['Kauf einen ISO-400-Farbfilm', 'ISO 400 kommt mit Sonne und Schatten klar. Nimm 36 Aufnahmen.'],
        ['Leg den Film ein und spul bis Bild 1 vor', 'Mach das im Schatten. Zieh den Film bis zur Markierung, schließ die Klappe und spul, bis der Zähler 1 zeigt.'],
        ['Mach 36 Fotos bei gutem Licht', 'Licht im Rücken, Motiv 1–3 m entfernt. Denk vor jedem Bild nach: Es gibt keine Löschtaste.'],
        ['Lass ihn in einem Labor entwickeln und scannen', 'Frag nach digitalen Scans. Das dauert meist ein paar Tage.'],
        ['Such deine 3 besten Fotos aus und teil sie', 'Schreib auf, warum sie funktionieren: das Licht, das Motiv oder der Moment?'],
      ],
    ],
    [yt('Film photography for beginners', 'Analogfotografie für Anfänger', 'film photography for beginners'), reddit('AnalogCommunity')],
  ),
  flowers: g(
    'photo',
    { en: '30 days', de: '30 Tage' },
    'Free',
    [
      'Get better at photography',
      [
        ['Take 10 photos using the rule of thirds', 'Turn on the grid in your camera app and put the subject on a line or a crossing, not in the middle.'],
        ['Shoot the same subject in 3 different lights', 'Morning, midday and golden hour (the hour before sunset). Put them side by side.'],
        ['Take 10 photos at golden hour', 'Soft, warm light from the side: faces and flowers look their best now.'],
        ['Make 5 photos with a blurred background', 'Get close to the subject and far from the background, or use portrait mode. Tap to focus.'],
        ['Take one photo every day for 14 days', 'One theme helps: colours, shadows or hands. Make it a game.'],
        ['Pick your best 10 and share them', 'Edit lightly: straighten and brighten. Ask someone which one they like most.'],
      ],
    ],
    [
      'Werd besser im Fotografieren',
      [
        ['Mach 10 Fotos nach der Drittel-Regel', 'Schalt das Raster in der Kamera-App ein und setz das Motiv auf eine Linie oder einen Schnittpunkt, nicht in die Mitte.'],
        ['Fotografier dasselbe Motiv in 3 verschiedenen Lichtern', 'Morgens, mittags und zur goldenen Stunde (die Stunde vor Sonnenuntergang). Leg sie nebeneinander.'],
        ['Mach 10 Fotos zur goldenen Stunde', 'Weiches, warmes Licht von der Seite: Gesichter und Blumen sehen jetzt am besten aus.'],
        ['Mach 5 Fotos mit unscharfem Hintergrund', 'Geh nah ans Motiv und weit weg vom Hintergrund oder nimm den Porträtmodus. Tipp zum Scharfstellen.'],
        ['Mach 14 Tage lang jeden Tag ein Foto', 'Ein Thema hilft: Farben, Schatten oder Hände. Mach ein Spiel daraus.'],
        ['Such deine besten 10 aus und teil sie', 'Bearbeite nur leicht: gerade richten und aufhellen. Frag jemanden, welches ihm am besten gefällt.'],
      ],
    ],
    [
      yt('Photography basics', 'Grundlagen der Fotografie', 'photography basics for beginners'),
      site('Cambridge in Colour', 'https://www.cambridgeincolour.com/tutorials.htm', 'Free photography tutorials', 'Kostenlose Foto-Tutorials'),
      reddit('photography'),
    ],
  ),
  cooking: g(
    'cooking',
    { en: '1–2 weeks', de: '1–2 Wochen' },
    '€',
    [
      'Learn to cook a new dish',
      [
        ['Pick one dish and find a well-reviewed easy recipe', 'A dish you love eating. Look for “easy” and fewer than 10 ingredients.'],
        ['Read the recipe twice and buy the ingredients', 'Check you have the pans and tools too.'],
        ['Prepare every ingredient before you turn on the heat', 'Chop and measure everything into small bowls. Chefs call it mise en place.'],
        ['Cook it once exactly as written', 'Use a timer. Ask an adult when you use hot oil or sharp knives.'],
        ['Note 2 changes and cook it again', 'More salt? Less time? Write it on the recipe.'],
        ['Cook it for friends or family', 'Take a photo before anyone starts eating.'],
      ],
    ],
    [
      'Lerne ein neues Gericht kochen',
      [
        ['Such dir ein Gericht aus und ein gut bewertetes, einfaches Rezept', 'Ein Gericht, das du gern isst. Achte auf „einfach“ und weniger als 10 Zutaten.'],
        ['Lies das Rezept zweimal und kauf die Zutaten', 'Prüf auch, ob du Töpfe und Werkzeug hast.'],
        ['Bereite alle Zutaten vor, bevor du den Herd anmachst', 'Schneid und wieg alles in kleine Schälchen ab. Köche nennen das Mise en place.'],
        ['Koch es einmal genau nach Rezept', 'Nimm einen Timer. Frag einen Erwachsenen bei heißem Öl oder scharfen Messern.'],
        ['Notier 2 Änderungen und koch es noch mal', 'Mehr Salz? Weniger Zeit? Schreib es aufs Rezept.'],
        ['Koch es für Freunde oder Familie', 'Mach ein Foto, bevor jemand anfängt zu essen.'],
      ],
    ],
    [
      yt('Cooking basics', 'Kochen: die Grundlagen', 'cooking basics for beginners'),
      site('Serious Eats', 'https://www.seriouseats.com/', 'Tested recipes that explain the why', 'Getestete Rezepte, die das Warum erklären'),
      reddit('Cooking'),
    ],
  ),
  web: g(
    'tech',
    { en: '2–4 weeks', de: '2–4 Wochen' },
    'Free',
    [
      'Build your first small website',
      [
        ['Make an index.html page that says hello', 'Use a free online editor like CodePen, or VS Code. Type <h1>Hello</h1> and open it in a browser.'],
        ['Add a heading, 2 paragraphs, an image and a link', 'The tags are h1, p, img and a. Change one thing at a time and refresh.'],
        ['Style it with CSS: font, colours and spacing', 'Start with body { font-family: sans-serif; max-width: 700px; margin: auto; } and go from there.'],
        ['Build a one-page site about something you love', 'Sketch the layout on paper first: header, 3 sections, footer.'],
        ['Add one button that does something with JavaScript', 'For example a dark-mode button: button.onclick = () => document.body.classList.toggle("dark").'],
        ['Publish it for free and send the link to a friend', 'GitHub Pages, Netlify Drop or Neocities all work. Check it on your phone too.'],
      ],
    ],
    [
      'Bau deine erste kleine Website',
      [
        ['Bau eine index.html, die Hallo sagt', 'Nimm einen kostenlosen Online-Editor wie CodePen oder VS Code. Tipp <h1>Hallo</h1> und öffne es im Browser.'],
        ['Füg eine Überschrift, 2 Absätze, ein Bild und einen Link hinzu', 'Die Tags heißen h1, p, img und a. Änder immer nur eine Sache und lad neu.'],
        ['Gestalte sie mit CSS: Schrift, Farben, Abstände', 'Fang an mit body { font-family: sans-serif; max-width: 700px; margin: auto; } und mach von da aus weiter.'],
        ['Bau eine einseitige Website über etwas, das du liebst', 'Skizzier das Layout zuerst auf Papier: Kopf, 3 Abschnitte, Fußzeile.'],
        ['Füg einen Button hinzu, der mit JavaScript etwas macht', 'Zum Beispiel ein Dunkelmodus-Button: button.onclick = () => document.body.classList.toggle("dark").'],
        ['Veröffentliche sie kostenlos und schick einem Freund den Link', 'GitHub Pages, Netlify Drop oder Neocities gehen alle. Schau sie dir auch am Handy an.'],
      ],
    ],
    [
      yt('Web development for beginners', 'Webentwicklung für Anfänger', 'html css for beginners full course'),
      site('freeCodeCamp', 'https://www.freecodecamp.org/', 'Free interactive coding courses', 'Kostenlose interaktive Programmierkurse'),
      reddit('learnprogramming'),
    ],
  ),
  writing: g(
    'writing',
    { en: '2–3 weeks', de: '2–3 Wochen' },
    'Free',
    [
      'Write your first short story',
      [
        ['Read 2 short stories and note what grabbed you', 'A sentence, a character, a twist: write it down.'],
        ['Create a character who wants one thing', 'Five lines: name, age, what they want, what stops them, what they’re afraid of.'],
        ['Plan the beginning, middle and end in 5 lines', 'Beginning: what they want. Middle: things get worse. End: they get it, or they change.'],
        ['Write a messy first draft of 500–1500 words', 'Don’t fix anything yet. Finish it in one or two sittings.'],
        ['Wait 2 days, then revise it and cut 10%', 'Read it out loud and cut every sentence that doesn’t move the story forward.'],
        ['Share it with one person you trust', 'Ask: which part did you like most, and where did you get bored?'],
      ],
    ],
    [
      'Schreib deine erste Kurzgeschichte',
      [
        ['Lies 2 Kurzgeschichten und notier, was dich gepackt hat', 'Ein Satz, eine Figur, eine Wendung: Schreib es auf.'],
        ['Erfinde eine Figur, die eine Sache will', 'Fünf Zeilen: Name, Alter, was sie will, was sie aufhält, wovor sie Angst hat.'],
        ['Plan Anfang, Mitte und Ende in 5 Zeilen', 'Anfang: was die Figur will. Mitte: Es wird schlimmer. Ende: Sie bekommt es oder verändert sich.'],
        ['Schreib einen chaotischen ersten Entwurf mit 500–1500 Wörtern', 'Verbessere noch nichts. Schreib ihn in ein oder zwei Sitzungen fertig.'],
        ['Warte 2 Tage, überarbeite ihn und kürz 10 %', 'Lies ihn laut vor und streich jeden Satz, der die Geschichte nicht weiterbringt.'],
        ['Zeig ihn einer Person, der du vertraust', 'Frag: Welcher Teil hat dir am besten gefallen, und wo wurde es langweilig?'],
      ],
    ],
    [yt('Creative writing for beginners', 'Kreatives Schreiben für Anfänger', 'how to write a short story for beginners'), reddit('writing')],
  ),
  sockmonkey: g(
    'crafts',
    { en: '1 weekend', de: '1 Wochenende' },
    '€',
    [
      'Make a sock monkey',
      [
        ['Pick two long socks and draw the cuts with chalk', 'Fluffy socks with a different-coloured heel work best: the heel becomes the mouth. Sock 1 is the head, body and legs; sock 2 is the arms, tail, ears and mouth.'],
        ['Sew and cut the legs from sock 1', 'Turn it inside out, heel facing up. Draw a line from the cuff to 5 cm below the heel, sew 1 cm on each side of it, then cut along the line between the seams.'],
        ['Stuff the head, body and legs, then close the gap', 'Turn it right side out and stuff it through the opening between the legs: firm in the head, softer in the legs. Close it with small ladder stitches.'],
        ['Cut the arms, tail, ears and mouth from sock 2', 'Cut the cuff in half lengthwise for the two arms, a long strip from the foot for the tail, the heel with 1 cm around it for the mouth, and two small ovals for the ears.'],
        ['Sew the arms and tail, stuff them and sew them on', 'Fold each piece inside out, sew the open side and the end, turn it and stuff it. Pin them on first to see where they look best, then attach them with ladder stitch.'],
        ['Sew on the mouth and the ears', 'Pin the heel piece across the lower face, sew halfway round, push in a little stuffing and finish the seam. Fold the ovals, close them and sew one on each side of the head.'],
        ['Give it a face: eyes and a smile', 'Sew on two buttons for eyes, or felt circles if it’s for a small child. Stitch a smile across the mouth with dark thread.'],
        ['Take a photo of your monkey and post it', 'Show it next to the sock it came from. Your post shows how many people started one because of you.'],
      ],
    ],
    [
      'Näh einen Sockenaffen',
      [
        ['Such dir zwei lange Socken aus und zeichne die Schnitte mit Kreide', 'Flauschige Socken mit andersfarbiger Ferse sind ideal: Aus der Ferse wird der Mund. Socke 1 wird Kopf, Körper und Beine, Socke 2 Arme, Schwanz, Ohren und Mund.'],
        ['Näh und schneid die Beine aus Socke 1', 'Dreh sie auf links, Ferse nach oben. Zeichne eine Linie vom Bündchen bis 5 cm unter die Ferse, näh 1 cm links und rechts davon und schneid dann zwischen den Nähten entlang der Linie.'],
        ['Stopf Kopf, Körper und Beine aus und schließ die Öffnung', 'Dreh sie auf rechts und stopf sie durch die Öffnung zwischen den Beinen: fest im Kopf, weicher in den Beinen. Schließ sie mit kleinen Matratzenstichen.'],
        ['Schneid Arme, Schwanz, Ohren und Mund aus Socke 2', 'Schneid das Bündchen der Länge nach in zwei Arme, einen langen Streifen vom Fuß für den Schwanz, die Ferse mit 1 cm Rand für den Mund und zwei kleine Ovale für die Ohren.'],
        ['Näh Arme und Schwanz, stopf sie aus und näh sie an', 'Leg jedes Teil auf links, näh die offene Seite und das Ende zu, wende es und stopf es aus. Steck sie erst mit Nadeln an, dann näh sie mit Matratzenstich fest.'],
        ['Näh den Mund und die Ohren an', 'Steck das Fersenstück auf das untere Gesicht, näh es halb rundherum fest, schieb etwas Füllung hinein und schließ die Naht. Falte die Ovale, näh sie zu und setz je eins an jede Kopfseite.'],
        ['Gib ihm ein Gesicht: Augen und ein Lächeln', 'Näh zwei Knöpfe als Augen an, oder Filzkreise, wenn er für ein kleines Kind ist. Stick mit dunklem Faden ein Lächeln über den Mund.'],
        ['Fotografier deinen Affen und poste ihn', 'Zeig ihn neben der Socke, aus der er entstanden ist. Dein Post zeigt, wie viele wegen dir einen angefangen haben.'],
      ],
    ],
    [yt('Sock monkey tutorials', 'Sockenaffe-Anleitungen', 'sock monkey tutorial step by step'), reddit('sewing')],
  ),
  bracelet: g(
    'crafts',
    { en: '1 weekend', de: '1 Wochenende' },
    '€',
    [
      'Make a friendship bracelet',
      [
        ['Cut 4 strings of 80 cm in 2 colours', 'Measure from your fingertips to your shoulder twice: that’s about 80 cm. Fold them in half and knot a loop at the top.'],
        ['Tape the loop down and tie 10 forward knots', 'Lay the left string over the next one like a 4, pull it through and up. Do it twice: that’s one forward knot.'],
        ['Tie 10 backward knots', 'The mirror of a forward knot: a backwards 4 with the right string. Always tie each knot twice.'],
        ['Knot 3 cm of a candy-stripe pattern', 'Tie forward knots with the leftmost string across all the others. Then start again with the new leftmost string.'],
        ['Knot 3 cm of a chevron pattern', 'Forward knots from the left to the middle, backward knots from the right to the middle, then knot the two middle strings together.'],
        ['Knot a whole chevron bracelet, 16 cm long', 'Measure your wrist and add 2 cm. Push each row up tight against the last so no gaps show.'],
        ['Braid the ends, tie it off and give it to a friend', 'Braid 5 cm, knot it and cut off the rest. The braid goes through the loop to close the bracelet.'],
      ],
    ],
    [
      'Knüpf ein Freundschaftsarmband',
      [
        ['Schneid 4 Fäden à 80 cm in 2 Farben', 'Miss zweimal von den Fingerspitzen bis zur Schulter: Das sind etwa 80 cm. Falte sie in der Mitte und knote oben eine Schlaufe.'],
        ['Kleb die Schlaufe fest und knüpf 10 Vorwärtsknoten', 'Leg den linken Faden wie eine 4 über den nächsten, zieh ihn durch und nach oben. Zweimal: Das ist ein Vorwärtsknoten.'],
        ['Knüpf 10 Rückwärtsknoten', 'Das Spiegelbild vom Vorwärtsknoten: eine umgedrehte 4 mit dem rechten Faden. Knüpf jeden Knoten immer zweimal.'],
        ['Knüpf 3 cm Streifenmuster', 'Knüpf mit dem linken Faden Vorwärtsknoten über alle anderen. Dann fang mit dem neuen linken Faden von vorn an.'],
        ['Knüpf 3 cm Pfeilmuster', 'Links bis zur Mitte Vorwärtsknoten, rechts bis zur Mitte Rückwärtsknoten, dann die zwei mittleren Fäden miteinander verknoten.'],
        ['Knüpf ein ganzes Pfeilmuster-Armband, 16 cm lang', 'Miss dein Handgelenk und rechne 2 cm dazu. Schieb jede Reihe fest an die letzte, damit keine Lücken bleiben.'],
        ['Flecht die Enden, knote ab und schenk es jemandem', 'Flecht 5 cm, mach einen Knoten und schneid den Rest ab. Der Zopf geht durch die Schlaufe und schließt das Armband.'],
      ],
    ],
    [yt('Friendship bracelets for beginners', 'Freundschaftsarmbänder für Anfänger', 'friendship bracelet for beginners chevron'), reddit('crafts')],
  ),
  skate: g(
    'fitness',
    { en: '4–8 weeks', de: '4–8 Wochen' },
    '€€€',
    [
      'Learn to skateboard',
      [
        ['Find your stance and stand on the board on grass for 5 minutes', 'Wear a helmet from day one. The foot you’d step forward with to catch a fall goes in front, both feet over the bolts.'],
        ['Push off and roll 10 metres with both feet on, 10 times', 'Push with your back foot, then put it on the tail. Look where you’re going, not at your feet.'],
        ['Stop 10 times with a foot brake', 'Keep your weight on the front foot and drag your whole back sole lightly along the ground, not the heel.'],
        ['Carve around a bottle 10 times each way', 'Lean on your toes or heels to turn and keep your knees bent. Start with a wide circle.'],
        ['Do 20 kick turns on flat ground', 'Press the tail so the front wheels lift, then turn your shoulders and the board follows. Start with quarter turns.'],
        ['Roll down a gentle slope 5 times', 'Only on a slope with flat ground at the bottom and no cars. Bend your knees more than feels normal.'],
        ['Film one run: push, carve, kick turn and stop', 'Prop your phone up and film from the side. Compare your knees with the first day.'],
      ],
    ],
    [
      'Lern Skateboarden',
      [
        ['Find deine Fußstellung und steh 5 Minuten auf dem Brett im Gras', 'Trag vom ersten Tag an einen Helm. Der Fuß, mit dem du einen Sturz abfangen würdest, kommt nach vorn, beide Füße über die Schrauben.'],
        ['Stoß dich ab und roll 10-mal 10 Meter mit beiden Füßen drauf', 'Stoß mit dem hinteren Fuß ab und stell ihn dann aufs Tail. Schau nach vorn, nicht auf deine Füße.'],
        ['Brems 10-mal mit dem Fuß', 'Lass das Gewicht auf dem vorderen Fuß und schleif die ganze hintere Sohle leicht über den Boden, nicht die Ferse.'],
        ['Fahr 10-mal in jede Richtung eine Kurve um eine Flasche', 'Verlager das Gewicht auf Zehen oder Fersen, um zu lenken, und bleib in den Knien. Fang mit einem großen Kreis an.'],
        ['Mach 20 Kickturns auf flachem Boden', 'Drück aufs Tail, bis die Vorderräder abheben, dann dreh die Schultern, und das Brett folgt. Fang mit Vierteldrehungen an.'],
        ['Roll 5-mal einen leichten Hang hinunter', 'Nur an einem Hang mit flachem Auslauf und ohne Autos. Geh tiefer in die Knie, als es sich normal anfühlt.'],
        ['Film eine Fahrt: abstoßen, Kurve, Kickturn und bremsen', 'Stell dein Handy auf und film von der Seite. Vergleich deine Knie mit dem ersten Tag.'],
      ],
    ],
    [yt('Skateboarding for beginners', 'Skateboarden für Anfänger', 'how to skateboard for beginners first day'), reddit('NewSkaters')],
  ),
  piano: g(
    'music',
    { en: '4–6 weeks', de: '4–6 Wochen' },
    '€€',
    [
      'Play your first song on the piano',
      [
        ['Play C D E F G with fingers 1 to 5, 10 times', 'Middle C is the white key just left of the two black keys in the middle. Your thumb is finger 1.'],
        ['Play the C major scale with your right hand 5 times without stopping', 'After E, tuck your thumb under to play F. Slow and even beats fast.'],
        ['Play the C major scale with your left hand 5 times', 'Start with your little finger on C. At A, cross finger 3 over your thumb.'],
        ['Switch between the chords C, F and G 10 times with your left hand', 'C is C-E-G, F is F-A-C, G is G-B-D. Keep your hand curved, as if holding a ball.'],
        ['Learn the right-hand melody of “Ode to Joy”', 'E E F G G F E D C C D E E D D. Learn 4 notes at a time, then join them.'],
        ['Play melody and chords together 3 times at 60 bpm', 'Your left hand plays one chord per bar. A free metronome app keeps you steady.'],
        ['Record the whole song in one go', 'One take without stopping is the goal. Mistakes are fine; just keep playing.'],
      ],
    ],
    [
      'Spiel deinen ersten Song am Klavier',
      [
        ['Spiel C D E F G mit den Fingern 1 bis 5, 10-mal', 'Das mittlere C ist die weiße Taste links neben den zwei schwarzen Tasten in der Mitte. Der Daumen ist Finger 1.'],
        ['Spiel die C-Dur-Tonleiter mit rechts 5-mal ohne Pause', 'Nach dem E schlägst du den Daumen unter und spielst F. Langsam und gleichmäßig schlägt schnell.'],
        ['Spiel die C-Dur-Tonleiter mit links 5-mal', 'Fang mit dem kleinen Finger auf C an. Beim A kreuzt Finger 3 über den Daumen.'],
        ['Wechsle 10-mal mit links zwischen den Akkorden C, F und G', 'C ist C-E-G, F ist F-A-C, G ist G-H-D. Halt die Hand rund, als würdest du einen Ball halten.'],
        ['Lern die Melodie von „Freude, schöner Götterfunken“ mit rechts', 'E E F G G F E D C C D E E D D. Lern immer 4 Töne und häng sie dann zusammen.'],
        ['Spiel Melodie und Akkorde 3-mal zusammen bei 60 bpm', 'Die linke Hand spielt einen Akkord pro Takt. Eine kostenlose Metronom-App hält dich im Takt.'],
        ['Nimm den ganzen Song in einem Durchgang auf', 'Ziel ist ein Durchgang ohne Anhalten. Fehler sind okay, spiel einfach weiter.'],
      ],
    ],
    [yt('Piano for beginners', 'Klavier für Anfänger', 'piano for absolute beginners first lesson'), reddit('piano')],
  ),
  // The onboarding ideas' own plans (starters.js)
  ...STARTERS,
}
Object.assign(MATERIALS, STARTER_MATERIALS)

// Plans without a photo of their own borrow the closest one (only for the small picture, not the Ideas gallery)
// Only photos that show the same thing (a game console is not a website, so web has none)
const BORROWED_PHOTO = {
  writing: 'journal', cooking: 'ramen', scarf: 'knit', crochet: 'knit', ukulele: 'guitar', scratch: 'pixels',
  // starters.js
  sketchbook: 'sketch', hand: 'sketch', ferrata: 'mountain', herbs: 'plant', scraps: 'plant', photoday: 'flowers', street: 'flowers',
}
for (const [key, guide] of Object.entries(GUIDES)) {
  guide.key = key
  guide.photoKey = PHOTOS[key] ? key : BORROWED_PHOTO[key] || null
  guide.photo = guide.photoKey ? PHOTOS[guide.photoKey] : null
}

// The photo a plan made from a template borrows for its thumbnail (the plan itself is the template, templates.js)
// Every plan starts with a tiny step you can do today in about 10 minutes, with nothing to buy
export const TINY_STEP = {
  en: ['Watch a 10-minute beginner video and note 3 tips', 'Search YouTube for a beginner video and write down the 3 most useful tips. No photo needed for this one: just tap Done.'],
  de: ['Schau ein 10-minütiges Anfängervideo und notier 3 Tipps', 'Such auf YouTube ein Anfängervideo und schreib die 3 nützlichsten Tipps auf. Dafür brauchst du kein Foto: Tipp einfach auf Fertig.'],
}

// A step is { text, how } (how: one or two sentences on how to do it). Plans store them as [text, how] pairs;
// older data and shared links have plain strings.
export const stepText = (s) => (Array.isArray(s) ? s[0] : s && typeof s === 'object' ? s.text : String(s ?? ''))
export const stepHow = (s) => (Array.isArray(s) ? s[1] : s && typeof s === 'object' ? s.how : '') || ''
const asStep = (s, lang) => {
  const tr = (x) => (lang === 'hu' && HU[x]) || x
  return { text: tr(stepText(s)), how: tr(stepHow(s)) }
}

// Shared steps travel as plain text (links, posts): each gets its how line back if it's still worded like the plan's
// Which language someone's steps are in, for posts and links from before they said so. null = can't tell.
const HU_WORDS = /\b(és|egy|az|meg|hogy|vagy|ki|fel|be|el|le|egyet|percig|készíts|vágj|keress|csinálj)\b/gi
const DE_WORDS = /\b(und|der|die|das|den|dem|mit|ein|eine|einen|für|auf|dich|dir|zu|aus|mach|schneide)\b/gi
const EN_WORDS = /\b(the|and|a|an|of|to|with|for|your|it|make|cut|draw)\b/gi
export function guessLang(texts) {
  const s = ` ${texts.join(' ')} `
  if (/[őűŐŰ]/.test(s)) return 'hu'
  if (/ß/.test(s)) return 'de'
  const n = (re) => (s.match(re) || []).length
  const score = { hu: n(HU_WORDS) + (/[áéíóú]/i.test(s) ? 2 : 0), de: n(DE_WORDS) + (/[äÄ]/.test(s) ? 2 : 0), en: n(EN_WORDS) }
  const [best, second] = Object.entries(score).sort((a, b) => b[1] - a[1])
  return best[1] > 0 && best[1] > second[1] ? best[0] : null
}

export const withHow = (texts, planSteps) => texts.map((text) => ({ text, how: planSteps.find((s) => s.text === text)?.how || '' }))

// → [{ text, how }] in the plan's language. People who've done this before skip the "watch a beginner video" step,
// and so do plans whose first step already is one (the templates).
export const stepsFor = (guide, level, lang = 'en') => {
  if (guide.kind)
    return templateSteps(guide.kind, pick(guide.title, lang), lang)
      .map((s, i) => (i === 0 && guide.videoFirst ? { ...s, quick: true } : s))
      .filter((s, i) => i > 0 || !level || level === 'new' || !guide.videoFirst)
  const own = guide.steps[lang]
  const steps = (own || guide.steps.en).map((s) => (own ? { text: stepText(s), how: stepHow(s) } : asStep(s, lang)))
  if (level && level !== 'new') return steps
  if (guide.noVideo) return steps
  const tiny = TINY_STEP[lang] || TINY_STEP.en
  // The video step is the one step you tick off without a photo (quick)
  return [{ ...(lang === 'de' ? { text: tiny[0], how: tiny[1] } : asStep(tiny, lang)), quick: true }, ...steps]
}

// The tool list of a ready-made plan, in your language
export const materialsFor = (key, lang = 'en') => MATERIALS[key]?.[lang] || MATERIALS[key]?.en || []

export const pick = (value, lang) => (value && typeof value === 'object' ? value[lang] || (lang === 'hu' && HU[value.en]) || value.en : value)

// The plans with a photo: the Ideas gallery
export const IDEA_GUIDES = Object.values(GUIDES).filter((guide) => guide.photoKey === guide.key)

// Finds a fitting plan for whatever name someone types ("learn ukulele" → the ukulele plan)
const MATCHERS = [
  ['bracelet', /friendship bracelet|bracelet|freundschaftsband|freundschaftsarmband|armband kn|karkötő|karkoto/],
  ['skate', /skate ?board|skaten|gördeszk|gordeszk|\bollie/],
  ['piano', /piano|klavier|zongor/],
  ['sockmonkey', /sock ?monkey|sock.{0,40}monkey|monkey.{0,40}sock|socken ?aff|socke.{0,40}aff|aff.{0,40}socke|zoknimajo?m|zokni ?majo?m|zokni.{0,40}majo?m|majo?m.{0,40}zokni/],
  ['crochet', /crochet|häkel|horgol|granny square|amigurumi/],
  ['scarf', /scarf|\bschals?\b|beanie|mütze|\bhat\b|sál|sapka/],
  ['knit', /knit|strick|sweater|pullover|jumper|kötés|kötni|kötök|pulóver/],
  ['embroidery', /embroider|stick(en|erei)|cross.?stitch|hímz|hímez/],
  ['sewing', /\bsew|\bnäh|tote bag|quilt|varr/],
  ['pottery', /pottery|potter|töpfer|ceramic|keramik|clay|\bton\b|kerámia|korongoz|agyag|on the wheel|throw.*\bbowl/],
  ['linocut', /lino|printmaking|block print|linó/],
  ['lemons', /watercolou?r|aquarell|paint|\bmal(en|e)\b|akvarell|fest/],
  ['pixels', /pixel/],
  ['sketch', /draw|zeichn|sketch|skizz|doodle|illustrat|rajz|vázlat|skicc/],
  ['journal', /journal|diary|tagebuch|napló/],
  ['scratch', /(?<!from )scratch/],
  ['console', /video ?game|computer ?game|\bgames? (dev|design)|(make|build|code|program) (a |my )?(small |first )?(\w+ )?games?\b|videospiel|computerspiel|vide[oó]játék|spiel(e)? (programmier|entwickl|bau)|godot|unity|videojáték|számítógépes játék|játékfejleszt|játékot (készít|csinál|fejleszt|programoz)/],
  ['singing', /\bsing(ing|en|e)?\b|vocal|gesang|choir|\bchor\b|karaoke|énekel|enekel|éneklé/],
  ['synth', /\bbeat|produc|produzier|compose|komponier|synth|(^|\s)dj\b|\bsong\b|első számod|zene|\bdalt?\b|beatet/],
  ['ukulele', /ukulel/],
  ['guitar', /guitar|gitarre|bass|chord|akkord|gitár|akkord|basszus/],
  ['focaccia', /focacci/],
  ['sourdough', /sourdough|sauerteig|loaf|(?<!banana )bread|\bbrot\b|kovász|kenyér/],
  ['ramen', /ramen|noodle|nudelsuppe/],
  ['pasta', /pasta|nudeln|tészt/],
  ['cinnamon', /cinnamon|zimt|\bbuns?\b|pastr|bake|baking|back(en|e)\b|cake|kuchen|cookie|keks|fahéj|süt|torta|süti|keksz/],
  ['tomato', /tomat|paradicsom/],
  ['plant', /propagat|cuttings?\b|steckling|houseplant|zimmerpflanz|szobanövény|dugvány|ableger/],
  ['canoe', /canoe|kanu|kayak|kajak|paddl|kenu|evez/],
  ['bench', /restor|furniture|möbel|refinish|bútor|felújít/],
  ['tools', /workshop|werkstatt|műhely/],
  ['birdhouse', /birdhouse|bird house|vogelhaus|madárodú|odú/],
  ['radio', /radio|rádió|((repair|fix|reparier|javít)\w*).*(lamp|speaker|electr|device|gerät|lautsprecher|lámpa|hangszóró|készülék|elektron)/],
  ['circuit', /solder|\blöt|circuit|forraszt|áramkör/],
  ['trail', /trail ?run|terepfut/],
  ['runner', /\brun\b|\brunning|lauf|marathon|5 ?k(m)?\b|10 ?k(m)?\b|jog|futás|futni|futok|maraton/],
  ['mountain', /hike|hiking|wander|summit|gipfel|mountain|\bberg|túr[aá]z|túrá|hegymászás|csúcs|\bhegy/],
  ['climb', /climb|kletter|boulder|mász/],
  ['camera', /film camera|filmkamera|analog|roll of film|filmes|analóg|filmtekercs|fotografier\w* (deinen |einen )?(ersten )?film/],
  ['flowers', /photo|foto|camera|kamera|fotó|fényképez/],
  ['web', /website|webseite|html|code|coding|program|\bapp\b|weboldal|honlap|programoz|kódol/],
  ['writing', /story|geschichte|write|writing|schreib|poem|gedicht|book|buch|novel|roman|blog|novell|történet|írás|vers|könyv|regény/],
  ['cooking', /cook|koch|recipe|rezept|dish|gericht|meal|food|essen|főz|recept|étel/],
]

// A plan for anything without a hand-made one: the template for its kind of hobby (templates.js), with the name in it
export const genericGuide = (name, hintCategory) => {
  const kind = hobbyKind(name, hintCategory)
  const category = hintCategory && hintCategory !== 'other' ? hintCategory : KIND_CATEGORY[kind]
  // No borrowed category photo: an embroidery picture on "Fold 10 origami animals" is more confusing than a plain tile
  const photoKey = null
  return {
    key: null,
    kind,
    videoFirst: !/^(cook|write|grow)$/.test(kind),
    category,
    title: { en: name, de: name },
    time: { en: 'a few weeks', de: 'ein paar Wochen' },
    cost: '',
    photoKey,
    photo: photoKey ? PHOTOS[photoKey] : null,
    steps: { en: [] },
    resources: [
      { ...yt(`${name}: beginner playlists`, `${name}: Playlists für Anfänger`, `${name} for beginners`), title: { en: `${name}: beginner playlists`, de: `${name}: Playlists für Anfänger`, hu: `${name}: lejátszási listák kezdőknek` } },
      ...(kind === 'sport'
        ? [{ kind: 'map', url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' club')}`, title: { en: `${name}: clubs near you`, de: `${name}: Vereine in deiner Nähe`, hu: `${name}: egyesületek a közeledben` }, note: { en: 'Find a club near you', de: 'Finde einen Verein in deiner Nähe', hu: 'Keress egyesületet a közeledben' } }]
        : []),
    ],
  }
}

export function planForName(name, hintCategory) {
  const text = name.toLowerCase()
  const hit = STARTER_MATCHERS.find(([, re]) => re.test(text)) || MATCHERS.find(([, re]) => re.test(text))
  if (hit) {
    const guide = GUIDES[hit[0]]
    return { guide, category: guide.category }
  }
  // Nothing hand-made fits: a plan for its kind of hobby, not a hand-made plan for something else
  const guide = genericGuide(name, hintCategory)
  return { guide, category: guide.category }
}

// Resources as stored on a project: plain strings in the language the project was started in
export const resourcesFor = (guide, lang) =>
  (guide.resources || []).map((r) => ({ kind: r.kind, url: r.url, title: pick(r.title, lang), note: pick(r.note, lang) }))
