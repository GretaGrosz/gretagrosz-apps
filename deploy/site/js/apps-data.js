// The one list of Greta's apps. Nothing else on the site lists apps by hand:
// scripts/apps-sync.mjs writes every app list into the HTML (between <!-- apps:NAME --> and <!-- /apps:NAME -->),
// and this file adds the German for everything those lists say. Add, remove or reorder an app here, then run
//   node scripts/apps-sync.mjs        (sync-site.sh runs it too)
// Order = the order the apps appear everywhere.
;(function (root) {
  const APPS = [
    {
      id: 'bwbuddy', name: 'BW Buddy', url: '/bwbuddy/', icon: '/img/icon-bw.webp',
      kind: ['Business studies', 'Betriebswirtschaft'],
      cv: ['HAK business studies with a grade forecast and a study plan.', 'BW für die HAK mit Notenprognose und Lernplan.'],
    },
    {
      id: 'stance', name: 'Agora', url: '/stance/', icon: '/img/icon-stance.webp',
      kind: ['Debate', 'Debatte'],
      cv: ['Daily debates, an AI to argue against, oral Matura practice.', 'Tägliche Debatten, KI-Gegenrede, Training für die Matura.'],
    },
    {
      id: 'qed', name: 'QED', url: '/regional/', icon: '/img/icon-qed.webp',
      kind: ['Olympiad maths', 'Mathe-Olympiade'],
      cv: ['Maths Olympiad training with AI marking of handwritten proofs, plus everyday maths to practise on the go.', 'Mathe-Olympiade-Training mit KI-Korrektur von Beweisen, dazu Alltagsmathe für unterwegs.'],
    },
    {
      id: 'deca', name: 'Deca', url: '/tenaday/', icon: '/img/icon-ten.webp',
      kind: ['Vocabulary', 'Vokabeln'],
      cv: ['Ten new words a day in five languages, with review.', 'Zehn neue Wörter am Tag in fünf Sprachen, mit Wiederholung.'],
    },
    {
      id: 'yap', name: 'Yap', url: '/yap/', icon: '/img/icon-yap.webp',
      kind: ['Voice social', 'Sprach-App'],
      cv: ['A voice-only social app with Catch up and search.', 'Soziales Netzwerk nur mit Sprache, mit Aufholen und Suche.'],
    },
    {
      id: 'blank', name: 'Blank', url: '/blank/', icon: '/img/icon-blank.webp',
      kind: ['Projects', 'Projekte'],
      cv: ['A coach for hobby projects, with a buddy to stay on track.', 'Ein Coach für Hobbyprojekte, mit Buddy zum Dranbleiben.'],
    },
    {
      id: 'deutsch', name: 'Lock-In', url: '/deutsch/', icon: '/img/icon-deutsch.webp',
      kind: ['German for school', 'Deutsch'],
      cv: ['A grammar path and Schularbeit trainer for German, built around my own mistakes.', 'Ein Grammatik-Pfad und Schularbeit-Training für Deutsch, gebaut um meine eigenen Fehler.'],
    },
  ]

  // Every sentence that carries the number of apps, in both languages, from the one count above
  const EN_N = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve']
  const DE_N = ['keine', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf']
  const n = APPS.length
  const cap = (s) => s[0].toUpperCase() + s.slice(1)
  const en = EN_N[n] || String(n), de = DE_N[n] || String(n)
  const PHRASES = {
    live: [`${n} apps, all live`, `${n} Apps, alle online`],
    built: [`${cap(en)} apps I designed and built`, `${cap(de)} Apps, selbst entworfen und gebaut`],
    cvTitle: [`${cap(en)} apps, designed and built by me`, `${cap(de)} Apps, selbst entworfen und entwickelt`],
    cvProfile: [
      `I study business and finance at a BHAK in Austria, in German. I grew up in England and Hungary. I learn by doing: I researched how Austria’s banks compete for Gen Z, turned it into an Excel tool, and designed and built ${en} apps that are live.`,
      `Ich bin in England und Ungarn aufgewachsen und besuche jetzt eine BHAK in Österreich, auf Deutsch. Ich lerne durchs Tun: Ich habe analysiert, wie Österreichs Banken um die Gen Z werben, daraus ein Excel-Tool gebaut und ${de} Apps entwickelt, die online sind.`,
    ],
    all: [`All ${n}`, `Alle ${n}`],
    shelf: [`The ${en} apps`, `Die ${de} Apps`],
  }

  const DE = {}
  for (const a of APPS) { DE[a.kind[0]] = a.kind[1]; DE[a.cv[0]] = a.cv[1]; DE[`Open ${a.name}`] = `${a.name} öffnen` }
  for (const k in PHRASES) DE[PHRASES[k][0]] = PHRASES[k][1]

  root.APPS = { list: APPS, phrases: PHRASES, de: DE }
  if (root.I18N) root.I18N.add(DE)
})(typeof window !== 'undefined' ? window : globalThis)
