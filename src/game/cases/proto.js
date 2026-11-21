// Fälle für den Prototyp (Thema "Rücktrittsrechte", 1. Jahrgang). Jeder Fall stammt aus dem Lerninhalt
// des Themas (src/data/lerninhalte/jg1.js); `step` ist der Lernschritt, zu dem "Nachlesen" führt.
// Details (hier: die Tage seit der Lieferung) werden bei jedem Durchgang neu gewürfelt.

export const LEARN_PATH = '/lernen/1/konsument-als-kaeufer/ruecktrittsrechte'

const pick = (list) => list[Math.floor(Math.random() * list.length)]

const KUNDEN = [
  { name: 'Frau Kugel', color: '#FFD45E', dark: '#E8B63A', hat: '#B39CFF' },
  { name: 'Herr Blubb', color: '#8EE3C4', dark: '#3FBF98', hat: '#4DA3FF' },
  { name: 'Oma Perla', color: '#D9C8FF', dark: '#A98BF0', hat: '#FF84A6' },
]

function umtausch() {
  return {
    id: 'umtausch',
    step: 0,
    text: 'Ich habe gestern bei dir Himbeerbonbons gekauft. Jetzt hätte ich doch lieber Zitrone. Du musst sie umtauschen – das ist mein gutes Recht!',
    options: [
      { text: 'Stimmt, im Gesetz steht ein Umtauschrecht von 14 Tagen.', kunde: 'happy', reply: 'Na also! Sag ich doch.' },
      { text: 'Ein Umtauschrecht steht nicht im Gesetz. Aber ich tausche gern freiwillig um.', kunde: 'happy', reply: 'Oh! Das ist aber nett von dir, Loopy.' },
      { text: 'Umtauschen geht nur gegen eine Stornogebühr.', kunde: 'angry', reply: 'Stornogebühr?! Für Bonbons?!' },
    ],
    correct: 1,
    explanation:
      'Ist ein Kaufvertrag gültig abgeschlossen, gibt es grundsätzlich kein Zurück. Ein Umtauschrecht steht NICHT im Gesetz – es muss vereinbart sein. Loopy darf freiwillig umtauschen oder auch nur einen Gutschein geben.',
    learned: 'Kein gesetzliches Umtauschrecht – Umtausch ist freiwillig',
  }
}

function fernabsatz() {
  const tage = pick([5, 9, 13, 16, 21])
  const inFrist = tage <= 14
  return {
    id: 'fernabsatz',
    step: 1,
    text: `Ich habe die Loopy-Tasse in deinem Onlineshop bestellt. Geliefert wurde sie vor ${tage} Tagen. Über das Rücktrittsrecht hast du mich informiert. Ich trete zurück – warum, sage ich nicht!`,
    options: [
      { text: 'In Ordnung. Der Rücktritt geht ohne Grund und ohne Stornogebühr.', kunde: 'happy', reply: 'Wunderbar, dann schicke ich sie zurück.' },
      { text: 'Das geht nicht mehr. Die Frist ist schon vorbei.', kunde: 'angry', reply: inFrist ? 'Wie bitte?! Ich kenne meine Rechte!' : 'Hmpf. Dann eben nicht.' },
      { text: 'Ohne einen guten Grund kann niemand zurücktreten.', kunde: 'angry', reply: 'Einen Grund? Den brauche ich nicht!' },
    ],
    correct: inFrist ? 0 : 1,
    explanation: `Im Fernabsatz (Onlineshop) kann ein Konsument 14 Kalendertage ab Lieferung zurücktreten – ohne Angabe von Gründen und ohne Stornogebühr. Hier sind ${tage} Tage vergangen: Die Frist ${inFrist ? 'läuft noch' : 'ist abgelaufen'}.`,
    learned: 'Fernabsatz: 14 Kalendertage Rücktritt ab Lieferung, ohne Grund',
  }
}

function sonderanfertigung() {
  return {
    id: 'sonderanfertigung',
    step: 2,
    text: 'Ich habe online ein Bonbonglas bestellt, in das du den Namen meiner Enkelin graviert hast. Es kam vor 3 Tagen. Ich trete zurück – 14 Tage gelten ja immer!',
    options: [
      { text: 'Ja, die 14 Tage gelten bei jedem Onlinekauf.', kunde: 'happy', reply: 'Na bitte. Hier hast du das Glas zurück.' },
      { text: 'Nein. Bei Sonderanfertigungen gibt es kein Rücktrittsrecht.', kunde: 'ok', reply: 'Hm. Na gut, es ist ja wirklich nur für sie gemacht.' },
      { text: 'Ja, aber nur, wenn das Glas noch verpackt ist.', kunde: 'angry', reply: 'Verpackt? Ich wollte es doch ansehen!' },
    ],
    correct: 1,
    explanation:
      'Bei Sonderanfertigungen gibt es KEIN Rücktrittsrecht (z. B. maßgeschneidertes Kleid, Fotobuch). Das gravierte Glas wurde extra für diese Kundin gemacht – Loopy könnte es niemandem sonst verkaufen.',
    learned: 'Kein Rücktritt bei Sonderanfertigungen',
  }
}

// Ein Spieltag: drei Fälle, Antworten gemischt, jede Kundschaft sieht anders aus.
export function buildDay() {
  return [umtausch(), fernabsatz(), sonderanfertigung()].map((c, i) => {
    const order = c.options.map((_, k) => k).sort(() => Math.random() - 0.5)
    return {
      ...c,
      kunde: KUNDEN[i % KUNDEN.length],
      options: order.map((k) => c.options[k]),
      correct: order.indexOf(c.correct),
    }
  })
}

export const REWARD = { right: 15, wrong: -10 }
