// AUFBAU der Inhalte: Jahrgang → Kapitel → Thema (nur Struktur und deutsche Titel).
// Die Kapitelstruktur folgt den Inhaltsverzeichnissen der Trauner "come grow with me" Praxisblicke-Bücher.
// Lerninhalte und Fragen liegen pro Sprache und Jahrgang in eigenen Dateien und werden erst geladen,
// wenn sie gebraucht werden (siehe content.js). Der 4. und 5. Jahrgang sind noch nicht geschrieben
// und deshalb nicht in der App.

export const jahrgaenge = [
  {
    "id": 1,
    "kapitel": [
      {
        "id": "wirtschaft-betrifft-uns-alle",
        "title": "Die Wirtschaft betrifft uns alle",
        "topicIds": [
          "grundlagen-des-wirtschaftens",
          "der-markt"
        ]
      },
      {
        "id": "praxisblick-unternehmen",
        "title": "Ein Praxisblick ins Unternehmen",
        "topicIds": [
          "unternehmen-und-umfeld",
          "leistungserstellung-1jg"
        ]
      },
      {
        "id": "konsument-als-kaeufer",
        "title": "Der Konsument als Käufer",
        "topicIds": [
          "phasen-kaufen-verkaufen",
          "gesetzliche-grundlagen-kauf",
          "fernabsatz-ecommerce",
          "ruecktrittsrechte"
        ]
      },
      {
        "id": "unternehmen-kaeufer-verkaeufer",
        "title": "Das Unternehmen als Käufer und Verkäufer",
        "topicIds": [
          "bestandteile-kaufvertrag",
          "schriftverkehr-kaufvertrag"
        ]
      },
      {
        "id": "bezahlen-in-der-praxis",
        "title": "Bezahlen in der Praxis",
        "topicIds": [
          "zahlungsformen-1jg"
        ]
      },
      {
        "id": "unzuverlaessige-partner",
        "title": "Wenn Verkäufer oder Käufer unzuverlässig sind",
        "topicIds": [
          "unzuverlaessige-verkaeufer",
          "unzuverlaessige-kaeufer",
          "rechtsdurchsetzung"
        ]
      },
      {
        "id": "unternehmensgruendung-kapitel",
        "title": "Unternehmensgründung: Der Weg in die Selbstständigkeit",
        "topicIds": [
          "unternehmensgruendung-schritte",
          "wahl-der-rechtsform-1jg",
          "businessplan-1jg",
          "vertraege-mitarbeiter"
        ]
      }
    ],
    "topics": [
      {
        "id": "grundlagen-des-wirtschaftens",
        "title": "Grundlagen des Wirtschaftens"
      },
      {
        "id": "der-markt",
        "title": "Der Markt"
      },
      {
        "id": "unternehmen-und-umfeld",
        "title": "Das Unternehmen und sein Umfeld"
      },
      {
        "id": "leistungserstellung-1jg",
        "title": "Leistungserstellung im Unternehmen"
      },
      {
        "id": "phasen-kaufen-verkaufen",
        "title": "Phasen beim Kaufen und Verkaufen"
      },
      {
        "id": "gesetzliche-grundlagen-kauf",
        "title": "Gesetzliche Grundlagen (Kaufvertrag)"
      },
      {
        "id": "fernabsatz-ecommerce",
        "title": "Fernabsatz & E-Commerce"
      },
      {
        "id": "ruecktrittsrechte",
        "title": "Rücktritts- & Widerrufsrechte"
      },
      {
        "id": "bestandteile-kaufvertrag",
        "title": "Bestandteile des Kaufvertrags"
      },
      {
        "id": "schriftverkehr-kaufvertrag",
        "title": "Vom Angebot bis zur Rechnung"
      },
      {
        "id": "zahlungsformen-1jg",
        "title": "Zahlungsformen"
      },
      {
        "id": "unzuverlaessige-verkaeufer",
        "title": "Unzuverlässige Verkäufer"
      },
      {
        "id": "unzuverlaessige-kaeufer",
        "title": "Unzuverlässige Käufer"
      },
      {
        "id": "rechtsdurchsetzung",
        "title": "Wenn der Streit eskaliert"
      },
      {
        "id": "unternehmensgruendung-schritte",
        "title": "Schritte der Unternehmensgründung"
      },
      {
        "id": "wahl-der-rechtsform-1jg",
        "title": "Wahl der Rechtsform"
      },
      {
        "id": "businessplan-1jg",
        "title": "Der Businessplan"
      },
      {
        "id": "vertraege-mitarbeiter",
        "title": "Verträge mit Mitarbeiter:innen"
      }
    ]
  },
  {
    "id": 2,
    "kapitel": [
      {
        "id": "unternehmensrechtliche-grundlagen",
        "title": "Unternehmensrechtliche Grundlagen",
        "topicIds": [
          "unternehmer-firma-firmenbuch",
          "rechtsformen-unternehmen",
          "vollmachten",
          "beschaeftigungsverhaeltnisse"
        ]
      },
      {
        "id": "internationale-geschaeftstaetigkeit",
        "title": "Internationale Geschäftstätigkeit",
        "topicIds": [
          "kaufvertraege-aussenhandel"
        ]
      },
      {
        "id": "leistungserstellung-unternehmen-2jg",
        "title": "Die Leistungserstellung im Unternehmen",
        "topicIds": [
          "grundlagen-leistungserstellung-2jg"
        ]
      },
      {
        "id": "marketing-2jg",
        "title": "Marketing",
        "topicIds": [
          "kunde-im-mittelpunkt",
          "marktforschung",
          "instrumente-marketings"
        ]
      },
      {
        "id": "material-warenwirtschaft-kapitel",
        "title": "Material und Warenwirtschaft",
        "topicIds": [
          "material-warenwirtschaft",
          "beschaffungsmarketing",
          "lager-transport-entsorgung"
        ]
      },
      {
        "id": "supply-chain-logistik-kapitel",
        "title": "Supply Chain Management und Logistik",
        "topicIds": [
          "supply-chain-management",
          "logistik"
        ]
      },
      {
        "id": "handel-kapitel",
        "title": "Handel",
        "topicIds": [
          "der-handel"
        ]
      },
      {
        "id": "businessplan-unternehmensgruendung-2jg-kapitel",
        "title": "Business plan und Unternehmensgründung",
        "topicIds": [
          "businessplan-2jg"
        ]
      }
    ],
    "topics": [
      {
        "id": "unternehmer-firma-firmenbuch",
        "title": "Unternehmer, Firma & Firmenbuch"
      },
      {
        "id": "rechtsformen-unternehmen",
        "title": "Rechtsformen der Unternehmen"
      },
      {
        "id": "vollmachten",
        "title": "Vollmachten im Unternehmen"
      },
      {
        "id": "beschaeftigungsverhaeltnisse",
        "title": "Beschäftigungsverhältnisse in der Praxis"
      },
      {
        "id": "kaufvertraege-aussenhandel",
        "title": "Kaufverträge im Außenhandel"
      },
      {
        "id": "grundlagen-leistungserstellung-2jg",
        "title": "Grundlagen der betrieblichen Leistungserstellung"
      },
      {
        "id": "kunde-im-mittelpunkt",
        "title": "Der Kunde im Mittelpunkt"
      },
      {
        "id": "marktforschung",
        "title": "Marktforschung"
      },
      {
        "id": "instrumente-marketings",
        "title": "Instrumente des Marketings"
      },
      {
        "id": "material-warenwirtschaft",
        "title": "Material- & Warenwirtschaft im Überblick"
      },
      {
        "id": "beschaffungsmarketing",
        "title": "Beschaffungsmarketing & -logistik"
      },
      {
        "id": "lager-transport-entsorgung",
        "title": "Lager-, Transport- & Entsorgungslogistik"
      },
      {
        "id": "supply-chain-management",
        "title": "Supply Chain Management"
      },
      {
        "id": "logistik",
        "title": "Logistik"
      },
      {
        "id": "der-handel",
        "title": "Der Handel – Bedeutender Teil unserer Wirtschaft"
      },
      {
        "id": "businessplan-2jg",
        "title": "Entwicklung eines Businessplans"
      }
    ]
  },
  {
    "id": 3,
    "kapitel": [
      {
        "id": "unternehmensfuehrung-kapitel",
        "title": "Unternehmensführung",
        "topicIds": [
          "unternehmensfuehrung-ueberblick",
          "normatives-management",
          "strategisches-operatives-management",
          "organisieren-und-fuehren"
        ]
      },
      {
        "id": "personalmanagement-kapitel",
        "title": "Aufgabe des Personalmanagements",
        "topicIds": [
          "personalbedarfsplanung",
          "personaleinsatzgestaltung",
          "personalbeurteilung"
        ]
      },
      {
        "id": "produktionsbetriebe-kapitel",
        "title": "Produktionsbetriebe",
        "topicIds": [
          "produktionsbetriebe",
          "leistungserstellungsprozess-produktion"
        ]
      },
      {
        "id": "investition-finanzmanagement-kapitel",
        "title": "Investition und Finanzmanagement",
        "topicIds": [
          "investition-finanzierung-ueberblick",
          "investitionsmanagement",
          "finanzmanagement",
          "finanzplan-analyse"
        ]
      },
      {
        "id": "finanzplanung-businessplan-kapitel",
        "title": "Finanzplanung im Business Plan",
        "topicIds": [
          "businessplan-3jg"
        ]
      }
    ],
    "topics": [
      {
        "id": "unternehmensfuehrung-ueberblick",
        "title": "Unternehmensführung im Überblick"
      },
      {
        "id": "normatives-management",
        "title": "Normatives Management"
      },
      {
        "id": "strategisches-operatives-management",
        "title": "Managementprozess: Strategisches & operatives Management"
      },
      {
        "id": "organisieren-und-fuehren",
        "title": "Erfolgreiches Organisieren & Führen"
      },
      {
        "id": "personalbedarfsplanung",
        "title": "Personalbedarfsplanung"
      },
      {
        "id": "personaleinsatzgestaltung",
        "title": "Personaleinsatzgestaltung"
      },
      {
        "id": "personalbeurteilung",
        "title": "Personalbeurteilung & Unterstützungsfunktionen"
      },
      {
        "id": "produktionsbetriebe",
        "title": "Die Produktionsbetriebe"
      },
      {
        "id": "leistungserstellungsprozess-produktion",
        "title": "Leistungserstellungsprozess in Produktionsbetrieben"
      },
      {
        "id": "investition-finanzierung-ueberblick",
        "title": "Investition & Finanzierung im Überblick"
      },
      {
        "id": "investitionsmanagement",
        "title": "Investitionsmanagement"
      },
      {
        "id": "finanzmanagement",
        "title": "Finanzmanagement"
      },
      {
        "id": "finanzplan-analyse",
        "title": "Finanzplan & finanzwirtschaftliche Analyse"
      },
      {
        "id": "businessplan-3jg",
        "title": "Finanzplan professionell erstellen"
      }
    ]
  }
]

const topicYear = {}
for (const j of jahrgaenge) for (const t of j.topics) topicYear[t.id] = j.id

// Jahrgang eines Themas (für das Nachladen der Inhalte)
export const yearOfTopic = (topicId) => topicYear[topicId]

export function getJahrgang(id) {
  return jahrgaenge.find((j) => j.id === Number(id))
}

export function getTopic(jahrgangId, topicId) {
  return getJahrgang(jahrgangId)?.topics.find((t) => t.id === topicId)
}

export function getKapitelList(jahrgangId) {
  return getJahrgang(jahrgangId)?.kapitel ?? []
}

export function getKapitel(jahrgangId, kapitelId) {
  return getKapitelList(jahrgangId).find((k) => k.id === kapitelId)
}

export function getKapitelTopics(jahrgangId, kapitelId) {
  const jahrgang = getJahrgang(jahrgangId)
  const kapitel = getKapitel(jahrgangId, kapitelId)
  if (!jahrgang || !kapitel) return []
  return kapitel.topicIds.map((id) => jahrgang.topics.find((t) => t.id === id)).filter(Boolean)
}

// Kapitel, in dem ein Thema steht
export function kapitelOfTopic(jahrgangId, topicId) {
  return getKapitelList(jahrgangId).find((k) => k.topicIds.includes(topicId))
}
