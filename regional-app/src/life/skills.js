// Everyday maths: 25 skills you use outside school. Each has a short lesson (the rule, the idea, a worked
// example, the usual trap, where it turns up) and a generator that writes a fresh question from a seeded
// random source, with the fast way to the answer.
// A question: { q, answer, tol } (or { min, max } for estimates), unit, show (the answer as text), steps,
// or a choice: { q, choices: [label…], answer: index }.
import { T, eur, hm, num, pct, pow, r2 } from './format'
import { OLYMPIAD, OLY_GROUPS } from './olympiad'

const EVERYDAY_GROUPS = [
  { id: 'mental', name: ['Mental maths', 'Kopfrechnen'], color: 'var(--blue)', glyph: '×' },
  { id: 'percent', name: ['Percentages', 'Prozente'], color: 'var(--green)', glyph: '%' },
  { id: 'money', name: ['Money', 'Geld'], color: 'var(--orange)', glyph: '€' },
  { id: 'chance', name: ['Chance & data', 'Zufall & Daten'], color: 'var(--purple)', glyph: '½' },
  { id: 'life', name: ['Time, trips & kitchen', 'Zeit, Wege & Küche'], color: 'var(--pink)', glyph: '⏱' },
]

const EURO = () => '€'
const PCT = () => '%'
const MIN = () => 'min'
const YEARS = () => T('years', 'Jahre')
const HOURS = () => T('hours', 'Stunden')

// 15% of x from 10% and 5%, 35% from 30% and 5%, …
function percentSteps(p, base) {
  const ten = base / 10
  const one = base / 100
  const z = eur((base * p) / 100)
  const tenLine = T(`10% = ${eur(base)} ÷ 10 = ${eur(ten)}`, `10 % = ${eur(base)} ÷ 10 = ${eur(ten)}`)
  switch (p) {
    case 5:
      return [tenLine, T(`5% = half of that = ${z}`, `5 % = die Hälfte davon = ${z}`)]
    case 10:
      return [tenLine]
    case 15:
      return [tenLine, T(`5% = half = ${eur(ten / 2)}`, `5 % = die Hälfte = ${eur(ten / 2)}`), `${pct(15)} = ${eur(ten)} + ${eur(ten / 2)} = ${z}`]
    case 20:
    case 30:
    case 40:
      return [tenLine, `${pct(p)} = ${p / 10} × ${eur(ten)} = ${z}`]
    case 35:
      return [tenLine, `${pct(30)} = 3 × ${eur(ten)} = ${eur(3 * ten)}`, T(`5% = half of 10% = ${eur(ten / 2)}`, `5 % = halbe 10 % = ${eur(ten / 2)}`), `${pct(35)} = ${eur(3 * ten)} + ${eur(ten / 2)} = ${z}`]
    case 25:
      return [T(`25% = a quarter: ${eur(base)} ÷ 4 = ${z}`, `25 % = ein Viertel: ${eur(base)} ÷ 4 = ${z}`)]
    case 75:
      return [T(`25% = ${eur(base)} ÷ 4 = ${eur(base / 4)}`, `25 % = ${eur(base)} ÷ 4 = ${eur(base / 4)}`), `${pct(75)} = 3 × ${eur(base / 4)} = ${z}`]
    case 12:
      return [tenLine, T(`1% = ${eur(one)}, so 2% = ${eur(2 * one)}`, `1 % = ${eur(one)}, also 2 % = ${eur(2 * one)}`), `${pct(12)} = ${eur(ten)} + ${eur(2 * one)} = ${z}`]
    default:
      return [T(`1% = ${eur(base)} ÷ 100 = ${eur(one)}`, `1 % = ${eur(base)} ÷ 100 = ${eur(one)}`), `${pct(p)} = ${p} × ${eur(one)} = ${z}`]
  }
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

const EVERYDAY = [
  /* ---------- Mental maths ---------- */
  {
    id: 'round-fix',
    group: 'mental',
    title: ['Round, then fix', 'Runden, dann korrigieren'],
    rule: ['4.99 × 6 = 5 × 6 − 0.01 × 6 = 29.94', '4,99 × 6 = 5 × 6 − 0,01 × 6 = 29,94'],
    idea: [
      'Prices like 4.99 are made to be awkward. Round to the easy number, multiply, then take back what you added — once for every item.',
      'Preise wie 4,99 sind absichtlich unhandlich. Runde auf die glatte Zahl, multipliziere und zieh dann wieder ab, was du dazugegeben hast – einmal pro Stück.',
    ],
    example: {
      q: ['7 drinks at €2.95 each. Total?', '7 Getränke zu je € 2,95. Summe?'],
      steps: [
        ['Round up: 7 × €3 = €21', 'Aufrunden: 7 × € 3 = € 21'],
        ['You added 5 cent 7 times: 35 cent', 'Du hast 7-mal 5 Cent zu viel: 35 Cent'],
        ['€21 − €0.35 = €20.65', '€ 21 − € 0,35 = € 20,65'],
      ],
    },
    trap: ['Take the fix off once per item, not once in total.', 'Die Korrektur pro Stück abziehen, nicht nur einmal.'],
    use: ['Checkout, menus, buying a round of drinks.', 'An der Kassa, bei der Speisekarte, bei einer Runde Getränke.'],
    gen(r) {
      const k = r.int(2, 19)
      const d = r.pick([0.01, 0.01, 0.05, 0.1, 0.2])
      const n = r.int(3, 9)
      const price = r2(k - d)
      const total = r2(price * n)
      const item = r.pick([
        ['coffees', 'Kaffees'],
        ['cinema tickets', 'Kinokarten'],
        ['exercise books', 'Hefte'],
        ['drinks', 'Getränke'],
        ['bus tickets', 'Busfahrscheine'],
      ])
      return {
        q: T(`${n} ${item[0]} at ${eur(price)} each. What’s the total?`, `${n} ${item[1]} zu je ${eur(price)}. Wie viel zahlst du?`),
        answer: total,
        tol: 0.005,
        unit: EURO(),
        show: eur(total),
        steps: [
          T(`Round up: ${n} × ${eur(k)} = ${eur(n * k)}`, `Aufrunden: ${n} × ${eur(k)} = ${eur(n * k)}`),
          T(`You added ${eur(d)} ${n} times: ${eur(n * d)}`, `Du hast ${n}-mal ${eur(d)} zu viel: ${eur(n * d)}`),
          `${eur(n * k)} − ${eur(n * d)} = ${eur(total)}`,
        ],
      }
    },
  },
  {
    id: 'split',
    group: 'mental',
    title: ['Split and multiply', 'Zerlegen und multiplizieren'],
    rule: ['7 × 46 = 7 × 40 + 7 × 6', '7 × 46 = 7 × 40 + 7 × 6'],
    idea: [
      'Break the bigger number into tens and ones, multiply each part, then add. Two small results are far easier to hold in your head than one big calculation.',
      'Zerlege die größere Zahl in Zehner und Einer, multipliziere beide Teile und addiere. Zwei kleine Ergebnisse merkst du dir viel leichter als eine große Rechnung.',
    ],
    example: {
      q: ['8 × 67', '8 × 67'],
      steps: [
        ['8 × 60 = 480', '8 × 60 = 480'],
        ['8 × 7 = 56', '8 × 7 = 56'],
        ['480 + 56 = 536', '480 + 56 = 536'],
      ],
    },
    trap: ['Do the big part first — then you only add a small number to it.', 'Zuerst den großen Teil – dann musst du nur noch eine kleine Zahl dazuzählen.'],
    use: ['Hours × wage, rows × seats, any “how many in total”.', 'Stunden × Lohn, Reihen × Plätze, jedes „wie viele insgesamt“.'],
    gen(r) {
      const a = r.int(3, 9)
      let b = r.int(12, 99)
      if (b % 10 === 0) b += r.int(1, 9)
      const tens = Math.floor(b / 10) * 10
      const ones = b - tens
      const ctx = r.int(0, 2)
      const money = ctx === 1
      const f = (x) => (money ? eur(x) : num(x))
      const q =
        ctx === 0
          ? `${a} × ${b} = ?`
          : ctx === 1
            ? T(`A summer job pays ${eur(b)} a day. How much after ${a} days?`, `Ein Ferialjob zahlt ${eur(b)} pro Tag. Wie viel nach ${a} Tagen?`)
            : T(`A hall has ${a} rows of ${b} seats. How many seats is that?`, `Ein Saal hat ${a} Reihen mit je ${b} Plätzen. Wie viele Plätze sind das?`)
      return {
        q,
        answer: a * b,
        tol: 0.005,
        unit: money ? EURO() : '',
        show: f(a * b),
        steps: [`${a} × ${tens} = ${f(a * tens)}`, `${a} × ${ones} = ${f(a * ones)}`, `${f(a * tens)} + ${f(a * ones)} = ${f(a * b)}`],
      }
    },
  },
  {
    id: 'fives',
    group: 'mental',
    title: ['Times 5, 25 and 50', 'Mal 5, 25 und 50'],
    rule: ['× 5 = × 10 ÷ 2 · × 25 = × 100 ÷ 4 · × 50 = × 100 ÷ 2', '× 5 = × 10 ÷ 2 · × 25 = × 100 ÷ 4 · × 50 = × 100 ÷ 2'],
    idea: [
      '5 is half of 10, 25 is a quarter of 100, 50 is half of 100. So multiply by the round number and halve (or quarter) — no times table needed.',
      '5 ist die Hälfte von 10, 25 ein Viertel von 100, 50 die Hälfte von 100. Also mit der glatten Zahl malnehmen und halbieren (oder vierteln) – ganz ohne Einmaleins.',
    ],
    example: {
      q: ['36 × 25', '36 × 25'],
      steps: [
        ['36 × 100 = 3,600', '36 × 100 = 3.600'],
        ['3,600 ÷ 4 = 900', '3.600 ÷ 4 = 900'],
      ],
    },
    trap: ['Halve first when you can: 48 × 5 = 24 × 10 = 240.', 'Halbiere zuerst, wenn es geht: 48 × 5 = 24 × 10 = 240.'],
    use: ['50-cent coins, 25-minute slots, €5 tickets.', '50-Cent-Münzen, 25-Minuten-Einheiten, 5-Euro-Tickets.'],
    gen(r) {
      const m = r.pick([5, 25, 50])
      if (m === 5) {
        const n = r.int(12, 98)
        return {
          q: T(`${n} people each pay €5 for a class trip. How much is collected?`, `${n} Leute zahlen je € 5 für einen Ausflug. Wie viel kommt zusammen?`),
          answer: n * 5,
          tol: 0.005,
          unit: EURO(),
          show: eur(n * 5),
          steps: [`${n} × 10 = ${num(n * 10)}`, `${num(n * 10)} ÷ 2 = ${eur(n * 5)}`],
        }
      }
      if (m === 25) {
        const n = 4 * r.int(3, 24) + r.pick([0, 0, 2])
        return {
          q: `${n} × 25 = ?`,
          answer: n * 25,
          tol: 0.005,
          unit: '',
          show: num(n * 25),
          steps: [`${n} × 100 = ${num(n * 100)}`, `${num(n * 100)} ÷ 4 = ${num(n * 25)}`],
        }
      }
      const n = r.int(13, 99)
      return {
        q: T(`A jar holds ${n} fifty-cent coins. How many euros is that?`, `Ein Glas enthält ${n} 50-Cent-Münzen. Wie viele Euro sind das?`),
        answer: n / 2,
        tol: 0.005,
        unit: EURO(),
        show: eur(n / 2),
        steps: [T(`${n} × 50 cent = ${n} × 100 cent ÷ 2`, `${n} × 50 Cent = ${n} × 100 Cent ÷ 2`), T(`= ${n} euros ÷ 2 = ${eur(n / 2)}`, `= ${n} Euro ÷ 2 = ${eur(n / 2)}`)],
      }
    },
  },
  {
    id: 'receipt',
    group: 'mental',
    title: ['Estimate the receipt', 'Den Kassabon überschlagen'],
    rule: ['Round every price to whole euros and add: you land within a euro or two.', 'Jeden Preis auf ganze Euro runden und addieren: du liegst höchstens ein, zwei Euro daneben.'],
    idea: [
      'To spot a mistake on a receipt or to know whether €20 is enough, you don’t need the exact sum. Round every price and add the round numbers. Rounding up and down mostly cancels out.',
      'Für einen Fehler auf dem Kassabon oder die Frage „reichen 20 Euro?“ brauchst du keine exakte Summe. Runde jeden Preis und addiere die glatten Zahlen. Auf- und Abrunden gleicht sich meistens aus.',
    ],
    example: {
      q: ['€3.85 + €1.20 + €6.95 + €2.49', '€ 3,85 + € 1,20 + € 6,95 + € 2,49'],
      steps: [
        ['4 + 1 + 7 + 2 = €14', '4 + 1 + 7 + 2 = € 14'],
        ['Exactly: €14.49 — close enough to decide', 'Genau: € 14,49 – nah genug, um zu entscheiden'],
      ],
    },
    trap: ['Lots of .99 prices all round up — then knock a little off at the end.', 'Viele ,99-Preise runden alle auf – dann am Ende ein bisschen abziehen.'],
    use: ['Supermarket, shared shopping, checking your change.', 'Supermarkt, gemeinsamer Einkauf, Wechselgeld prüfen.'],
    gen(r) {
      const k = r.int(4, 6)
      const prices = Array.from({ length: k }, () => r2(r.int(0, 14) + r.pick([0.6, 0.79, 0.85, 0.95, 0.99, 0.1, 0.25, 0.39, 0.49])))
      const sum = r2(prices.reduce((a, b) => a + b, 0))
      const rounded = prices.map((p) => Math.round(p))
      const est = rounded.reduce((a, b) => a + b, 0)
      return {
        q: T(`Estimate the total in your head: ${prices.map(eur).join(' + ')}`, `Überschlag die Summe im Kopf: ${prices.map(eur).join(' + ')}`),
        answer: sum,
        min: Math.min(sum, est) - 1,
        max: Math.max(sum, est) + 1,
        unit: EURO(),
        show: `≈ ${eur(est)}`,
        note: T('Within €2 counts', 'Auf € 2 genau zählt'),
        steps: [`${rounded.join(' + ')} = ${eur(est)}`, T(`Exactly: ${eur(sum)}`, `Genau: ${eur(sum)}`)],
      }
    },
  },

  /* ---------- Percentages ---------- */
  {
    id: 'percent-of',
    group: 'percent',
    title: ['Percent of anything', 'Prozent von allem'],
    rule: ['10% = move the decimal point one place. 5% = half of that. 1% = two places.', '10 % = Komma eine Stelle nach links. 5 % = die Hälfte davon. 1 % = zwei Stellen.'],
    idea: [
      'Every percentage you meet can be built from 10%, 5% and 1%. 15% = 10% + 5%. 30% = 3 × 10%. 25% = a quarter. Find 10% first, then build.',
      'Jeder Prozentsatz lässt sich aus 10 %, 5 % und 1 % bauen. 15 % = 10 % + 5 %. 30 % = 3 × 10 %. 25 % = ein Viertel. Zuerst 10 % finden, dann zusammensetzen.',
    ],
    example: {
      q: ['15% of €64', '15 % von € 64'],
      steps: [
        ['10% = €6.40', '10 % = € 6,40'],
        ['5% = half = €3.20', '5 % = die Hälfte = € 3,20'],
        ['15% = €6.40 + €3.20 = €9.60', '15 % = € 6,40 + € 3,20 = € 9,60'],
      ],
    },
    trap: ['“Percent of” is always of the starting amount — say what that is before you start.', '„Prozent von“ bezieht sich immer auf den Grundwert – mach dir zuerst klar, welcher das ist.'],
    use: ['Tips, discounts, rent rises, test scores.', 'Trinkgeld, Rabatte, Mieterhöhungen, Testergebnisse.'],
    gen(r) {
      // Each setting gets percentages and amounts that make sense for it
      const ctx = r.int(0, 3)
      const p = r.pick([[5, 10, 15, 20, 25, 30, 35, 40, 75, 2, 3, 12], [10, 15, 20, 5, 10], [10, 15, 20, 25, 30, 35, 40, 75], [2, 3, 5, 10]][ctx])
      const base =
        ctx === 3 ? 10 * r.int(40, 120) : p === 25 || p === 75 ? 4 * r.int(5, 60) : ctx === 1 ? r.int(12, 180) : r.pick([r.int(12, 99), r.int(100, 480), 10 * r.int(3, 90)])
      const ans = r2((base * p) / 100)
      const q = [
        T(`What is ${pct(p)} of ${eur(base)}?`, `Wie viel sind ${pct(p)} von ${eur(base)}?`),
        T(`The bill is ${eur(base)}. How much is a ${pct(p)} tip?`, `Die Rechnung macht ${eur(base)}. Wie viel sind ${pct(p)} Trinkgeld?`),
        T(`A jacket costs ${eur(base)} and is ${pct(p)} off. How much do you save?`, `Eine Jacke kostet ${eur(base)} und ist um ${pct(p)} reduziert. Wie viel sparst du?`),
        T(`Your rent of ${eur(base)} goes up ${pct(p)}. How much more is that per month?`, `Deine Miete von ${eur(base)} steigt um ${pct(p)}. Wie viel mehr ist das pro Monat?`),
      ][ctx]
      return { q, answer: ans, tol: 0.005, unit: EURO(), show: eur(ans), steps: percentSteps(p, base) }
    },
  },
  {
    id: 'backwards',
    group: 'percent',
    title: ['Back from the final price', 'Vom Endpreis zurückrechnen'],
    rule: ['Original = final ÷ (1 + rate). Including 20% VAT → ÷ 1.2', 'Grundwert = Endpreis ÷ (1 + Satz). Inklusive 20 % USt → ÷ 1,2'],
    idea: [
      'After a 20% increase, the price is 120% of the original. To go back, divide by 1.2. Don’t just take 20% off — the 20% was of the smaller number.',
      'Nach 20 % Aufschlag ist der Preis 120 % vom Original. Zurück geht es mit ÷ 1,2. Nicht einfach 20 % abziehen – die 20 % waren vom kleineren Betrag.',
    ],
    example: {
      q: ['€54 including 20% VAT. Without VAT?', '€ 54 inklusive 20 % USt. Netto?'],
      steps: [
        ['€54 is 120% of the net price', '€ 54 sind 120 % vom Nettopreis'],
        ['54 ÷ 1.2 = €45', '54 ÷ 1,2 = € 45'],
        ['Check: €45 + 20% = €45 + €9 = €54', 'Probe: € 45 + 20 % = € 45 + € 9 = € 54'],
      ],
    },
    trap: ['€54 − 20% = €43.20 is wrong. Always check by going forwards again.', '€ 54 − 20 % = € 43,20 ist falsch. Zur Probe immer wieder vorwärts rechnen.'],
    use: ['Invoices (net and gross), sale prices, pay rises.', 'Rechnungen (netto und brutto), Abverkaufspreise, Gehaltserhöhungen.'],
    gen(r) {
      const kind = r.int(0, 4)
      let X, f, q, ask
      if (kind === 0) {
        X = 5 * r.int(2, 60)
        f = 1.2
        q = T(`A price including 20% VAT is ${eur(X * f)}. What is it without VAT?`, `Ein Preis inklusive 20 % USt beträgt ${eur(X * f)}. Wie viel ist er netto?`)
      } else if (kind === 1) {
        X = 10 * r.int(2, 30)
        f = 1.1
        ask = 'tax'
        q = T(`A restaurant bill is ${eur(X * f)} including 10% VAT. How much of it is tax?`, `Eine Restaurantrechnung beträgt ${eur(X * f)} inklusive 10 % USt. Wie viel davon ist Steuer?`)
      } else if (kind === 2) {
        X = 4 * r.int(5, 50)
        f = 0.75
        q = T(`After 25% off you paid ${eur(X * f)}. What was the original price?`, `Nach 25 % Rabatt hast du ${eur(X * f)} bezahlt. Was war der ursprüngliche Preis?`)
      } else if (kind === 3) {
        X = 5 * r.int(4, 60)
        f = 0.8
        q = T(`After 20% off you paid ${eur(X * f)}. What was the original price?`, `Nach 20 % Rabatt hast du ${eur(X * f)} bezahlt. Was war der ursprüngliche Preis?`)
      } else {
        X = 100 * r.int(15, 35)
        f = 1.1
        q = T(`After a 10% raise you earn ${eur(X * f)} a month. What did you earn before?`, `Nach 10 % Erhöhung verdienst du ${eur(X * f)} im Monat. Wie viel war es vorher?`)
      }
      const F = r2(X * f)
      const rate = Math.round(Math.abs(f - 1) * 100)
      const steps = [
        T(`The final amount is ${pct(f * 100)} of the original`, `Der Endbetrag ist ${pct(f * 100)} vom Ausgangswert`),
        `${eur(F)} ÷ ${num(f)} = ${eur(X)}`,
      ]
      if (ask === 'tax') {
        steps.push(T(`Tax: ${eur(F)} − ${eur(X)} = ${eur(F - X)}`, `Steuer: ${eur(F)} − ${eur(X)} = ${eur(F - X)}`))
        return { q, answer: r2(F - X), tol: 0.005, unit: EURO(), show: eur(F - X), steps }
      }
      steps.push(T(`Check: ${eur(X)} ${f > 1 ? '+' : '−'} ${pct(rate)} = ${eur(F)}`, `Probe: ${eur(X)} ${f > 1 ? '+' : '−'} ${pct(rate)} = ${eur(F)}`))
      return { q, answer: X, tol: 0.005, unit: EURO(), show: eur(X), steps }
    },
  },
  {
    id: 'stacked',
    group: 'percent',
    title: ['Discounts that stack', 'Rabatte, die sich stapeln'],
    rule: ['−30% then −20%: you pay 0.7 × 0.8 = 56%. That’s 44% off, not 50%.', '−30 % und dann −20 %: du zahlst 0,7 × 0,8 = 56 %. Das sind 44 % Rabatt, nicht 50 %.'],
    idea: [
      'The second discount comes off the already-reduced price, so percentages multiply, they don’t add. Think in what you pay: 30% off means you pay 70%.',
      'Der zweite Rabatt kommt vom schon reduzierten Preis weg – Prozente werden multipliziert, nicht addiert. Denk daran, was du zahlst: 30 % Rabatt heißt, du zahlst 70 %.',
    ],
    example: {
      q: ['50% off, then an extra 20% off', '50 % Rabatt, dann noch einmal 20 %'],
      steps: [
        ['You pay 0.5 × 0.8 = 0.4 = 40%', 'Du zahlst 0,5 × 0,8 = 0,4 = 40 %'],
        ['That’s 60% off, not 70%', 'Das sind 60 % Rabatt, nicht 70 %'],
      ],
    },
    trap: ['“An extra 20% off sale prices” is never 20 more percentage points.', '„Zusätzlich 20 % auf reduzierte Ware“ sind nie 20 Prozentpunkte mehr.'],
    use: ['Sales with discount codes, student discounts on reduced items.', 'Abverkauf mit Gutscheincode, Schülerrabatt auf reduzierte Ware.'],
    gen(r) {
      const a = r.pick([10, 20, 25, 30, 40, 50])
      const b = r.pick([10, 20, 25, 30, 50])
      const keep = ((100 - a) * (100 - b)) / 100
      const off = 100 - keep
      const steps = [
        T(`${pct(a)} off → you pay ${pct(100 - a)}`, `${pct(a)} Rabatt → du zahlst ${pct(100 - a)}`),
        T(`${pct(b)} off that → you pay ${pct(100 - b)} of it`, `davon ${pct(b)} Rabatt → du zahlst ${pct(100 - b)} davon`),
        `${num((100 - a) / 100)} × ${num((100 - b) / 100)} = ${num(keep / 100, 4)} → ${pct(keep)}`,
      ]
      if (r.next() < 0.5) {
        steps.push(T(`Total off: 100% − ${pct(keep)} = ${pct(off)}`, `Rabatt insgesamt: 100 % − ${pct(keep)} = ${pct(off)}`))
        return {
          q: T(`A shop takes ${pct(a)} off, then another ${pct(b)} off the sale price. How much off is that in total?`, `Ein Geschäft gibt ${pct(a)} Rabatt und dann noch ${pct(b)} auf den reduzierten Preis. Wie viel Rabatt ist das insgesamt?`),
          answer: off,
          tol: 0.005,
          unit: PCT(),
          show: pct(off),
          steps,
        }
      }
      const P = 20 * r.int(2, 12)
      const final = r2((P * keep) / 100)
      steps.push(`${eur(P)} × ${num(keep / 100, 4)} = ${eur(final)}`)
      return {
        q: T(`Trainers cost ${eur(P)}. They are ${pct(a)} off, and your code takes off another ${pct(b)}. What do you pay?`, `Sneaker kosten ${eur(P)}. Sie sind um ${pct(a)} reduziert, dein Code zieht noch einmal ${pct(b)} ab. Was zahlst du?`),
        answer: final,
        tol: 0.005,
        unit: EURO(),
        show: eur(final),
        steps,
      }
    },
  },
  {
    id: 'change',
    group: 'percent',
    title: ['Percent change, and points', 'Prozentuelle Änderung und Prozentpunkte'],
    rule: ['Change ÷ start × 100. Up 50% then down 50% leaves you at 75%.', 'Änderung ÷ Ausgangswert × 100. +50 % und dann −50 % ergibt 75 %.'],
    idea: [
      'Always divide by where you started. That’s why up and down by the same percent doesn’t cancel out: the second percent is of a different number. And going from 2% to 3% is 1 percentage point — but a 50% rise.',
      'Immer durch den Ausgangswert teilen. Darum heben sich gleich viel Prozent rauf und runter nicht auf: die zweiten Prozent beziehen sich auf eine andere Zahl. Und von 2 % auf 3 % ist 1 Prozentpunkt – aber ein Anstieg um 50 %.',
    ],
    example: {
      q: ['€80 → €100, and back', '€ 80 → € 100 und zurück'],
      steps: [
        ['Up: 20 ÷ 80 = 25% more', 'Hinauf: 20 ÷ 80 = 25 % mehr'],
        ['Down: 20 ÷ 100 = 20% less', 'Hinunter: 20 ÷ 100 = 20 % weniger'],
      ],
    },
    trap: ['Dividing by the new number instead of the old one.', 'Durch den neuen statt durch den alten Wert teilen.'],
    use: ['Price rises, the news, comparing offers, interest rates.', 'Preiserhöhungen, Nachrichten, Angebote vergleichen, Zinsen.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const old = r.pick([20, 40, 50, 80, 120, 200, 250, 400])
        const c = r.pick([10, 20, 25, 50, 75, -10, -20, -25, -50])
        const nw = (old * (100 + c)) / 100
        const diff = Math.abs(nw - old)
        return {
          q:
            c > 0
              ? T(`A price goes up from ${eur(old)} to ${eur(nw)}. By what percent did it rise?`, `Ein Preis steigt von ${eur(old)} auf ${eur(nw)}. Um wie viel Prozent ist er gestiegen?`)
              : T(`A price falls from ${eur(old)} to ${eur(nw)}. By what percent did it fall?`, `Ein Preis sinkt von ${eur(old)} auf ${eur(nw)}. Um wie viel Prozent ist er gesunken?`),
          answer: Math.abs(c),
          tol: 0.05,
          unit: PCT(),
          show: pct(Math.abs(c)),
          steps: [T(`Change: ${eur(diff)}`, `Änderung: ${eur(diff)}`), T(`Divide by the start: ${eur(diff)} ÷ ${eur(old)} = ${num(Math.abs(c) / 100)}`, `Durch den Ausgangswert: ${eur(diff)} ÷ ${eur(old)} = ${num(Math.abs(c) / 100)}`), `= ${pct(Math.abs(c))}`],
        }
      }
      if (kind === 1) {
        const p = r.pick([10, 20, 30, 40, 50])
        const loss = (p * p) / 100
        return {
          q: T(`A share price rises ${pct(p)} and then falls ${pct(p)}. How many percent below its start is it now?`, `Eine Aktie steigt um ${pct(p)} und fällt dann um ${pct(p)}. Wie viel Prozent liegt sie jetzt unter dem Startwert?`),
          answer: loss,
          tol: 0.05,
          unit: PCT(),
          show: pct(loss),
          steps: [T(`Up: × ${num(1 + p / 100)}`, `Hinauf: × ${num(1 + p / 100)}`), T(`Down: × ${num(1 - p / 100)}`, `Hinunter: × ${num(1 - p / 100)}`), `${num(1 + p / 100)} × ${num(1 - p / 100)} = ${num(1 - loss / 100, 4)}`, T(`That’s ${pct(loss)} below the start`, `Das sind ${pct(loss)} unter dem Start`)],
        }
      }
      const [a, b] = r.pick([[2, 3], [1, 2], [4, 5], [4, 6], [5, 6], [2, 4], [1, 3], [2, 5]])
      const rel = ((b - a) / a) * 100
      const pts = b - a
      return {
        q: T(
          `An interest rate rises from ${pct(a)} to ${pct(b)} — that’s ${pts} percentage point${pts === 1 ? '' : 's'}. By what percent did the rate itself rise?`,
          `Ein Zinssatz steigt von ${pct(a)} auf ${pct(b)} – das ${pts === 1 ? 'ist 1 Prozentpunkt' : `sind ${pts} Prozentpunkte`}. Um wie viel Prozent ist der Zinssatz selbst gestiegen?`,
        ),
        answer: rel,
        tol: 0.05,
        unit: PCT(),
        show: pct(rel),
        steps: [T(`Change: ${pts} point${pts === 1 ? '' : 's'}`, `Änderung: ${pts} ${pts === 1 ? 'Punkt' : 'Punkte'}`), `${pts} ÷ ${a} = ${num(rel / 100)} = ${pct(rel)}`],
      }
    },
  },

  /* ---------- Money ---------- */
  {
    id: 'per-year',
    group: 'money',
    title: ['Small amounts, per year', 'Kleine Beträge, aufs Jahr'],
    rule: ['Per day × 365, per week × 52, per month × 12.', 'Pro Tag × 365, pro Woche × 52, pro Monat × 12.'],
    idea: [
      'A coffee or a subscription looks tiny because it’s priced for one day or one month. Multiply it out to a year, then decide if it’s still worth it. Round first, then fix: 12.99 × 12 = 13 × 12 − 0.12.',
      'Ein Kaffee oder ein Abo wirkt winzig, weil der Preis für einen Tag oder Monat dasteht. Rechne es aufs Jahr hoch und entscheide dann, ob es das wert ist. Erst runden, dann korrigieren: 12,99 × 12 = 13 × 12 − 0,12.',
    ],
    example: {
      q: ['A €3.50 coffee, 5 days a week', 'Ein Kaffee um € 3,50, 5 Tage pro Woche'],
      steps: [
        ['€3.50 × 5 = €17.50 a week', '€ 3,50 × 5 = € 17,50 pro Woche'],
        ['€17.50 × 52 = €910 a year', '€ 17,50 × 52 = € 910 im Jahr'],
      ],
    },
    trap: ['A year has 52 weeks, not 48 — and a month is about 4.3 weeks, not 4.', 'Ein Jahr hat 52 Wochen, nicht 48 – und ein Monat ist etwa 4,3 Wochen, nicht 4.'],
    use: ['Subscriptions, snacks, your phone plan, the gym.', 'Abos, Snacks, Handytarif, Fitnessstudio.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const m = r.pick([4.99, 7.99, 9.99, 12.99, 14.99, 19.99, 24.99])
        const up = Math.round(m)
        const ans = r2(m * 12)
        return {
          q: T(`A subscription costs ${eur(m)} a month. How much is that per year?`, `Ein Abo kostet ${eur(m)} im Monat. Wie viel ist das im Jahr?`),
          answer: ans,
          tol: 0.005,
          unit: EURO(),
          show: eur(ans),
          steps: [`${eur(up)} × 12 = ${eur(up * 12)}`, T(`Take off 12 × 1 cent: − ${eur(0.12)}`, `12 × 1 Cent abziehen: − ${eur(0.12)}`), `= ${eur(ans)}`],
        }
      }
      if (kind === 1) {
        const price = r.pick([2.5, 3, 3.5, 4, 4.5, 5.5])
        const days = r.pick([3, 5, 7])
        const item = r.pick([
          ['coffee', 'Kaffee'],
          ['energy drink', 'Energydrink'],
          ['kebab', 'Döner'],
        ])
        const week = price * days
        const year = week * 52
        return {
          q: T(`You buy a${/^[aeiou]/.test(item[0]) ? 'n' : ''} ${item[0]} for ${eur(price)}, ${days} days a week. How much is that per year?`, `Du kaufst ${days}-mal pro Woche einen ${item[1]} um ${eur(price)}. Wie viel ist das im Jahr?`),
          answer: year,
          tol: 0.005,
          unit: EURO(),
          show: eur(year),
          steps: [T(`${eur(price)} × ${days} = ${eur(week)} a week`, `${eur(price)} × ${days} = ${eur(week)} pro Woche`), T(`× 52 = × 50 + × 2: ${eur(week * 50)} + ${eur(week * 2)}`, `× 52 = × 50 + × 2: ${eur(week * 50)} + ${eur(week * 2)}`), `= ${eur(year)}`],
        }
      }
      const d = r.pick([0.5, 1, 1.5, 2, 2.5, 3])
      return {
        q: T(`You spend ${eur(d)} a day on snacks. How much is that per year?`, `Du gibst jeden Tag ${eur(d)} für Snacks aus. Wie viel ist das im Jahr?`),
        answer: d * 365,
        tol: 0.005,
        unit: EURO(),
        show: eur(d * 365),
        steps: [`${eur(d)} × 365 = ${eur(d)} × 300 + ${eur(d)} × 65`, `= ${eur(d * 300)} + ${eur(d * 65)} = ${eur(d * 365)}`],
      }
    },
  },
  {
    id: 'better-deal',
    group: 'money',
    title: ['The better deal', 'Das bessere Angebot'],
    rule: ['Compare the price per kg (or per litre): price ÷ amount.', 'Vergleiche den Preis pro kg (oder Liter): Preis ÷ Menge.'],
    idea: [
      'Big packs aren’t always cheaper. Bring both to the same unit — per kg, per litre — and compare. The shelf label prints it in small type; now you can check it yourself.',
      'Großpackungen sind nicht immer billiger. Bring beide auf dieselbe Einheit – pro kg, pro Liter – und vergleiche. Am Regaletikett steht das klein gedruckt; jetzt kannst du es selbst nachrechnen.',
    ],
    example: {
      q: ['400 g for €2.60 or 650 g for €3.90?', '400 g um € 2,60 oder 650 g um € 3,90?'],
      steps: [
        ['€2.60 ÷ 0.4 kg = €6.50 per kg', '€ 2,60 ÷ 0,4 kg = € 6,50 pro kg'],
        ['€3.90 ÷ 0.65 kg = €6.00 per kg', '€ 3,90 ÷ 0,65 kg = € 6,00 pro kg'],
        ['The big pack wins this time', 'Diesmal gewinnt die große Packung'],
      ],
    },
    trap: ['Compare per kg, not per pack — and watch out for g vs kg.', 'Pro kg vergleichen, nicht pro Packung – und auf g und kg achten.'],
    use: ['Supermarket, drugstore, buying in bulk with friends.', 'Supermarkt, Drogerie, gemeinsam Großpackungen kaufen.'],
    gen(r) {
      const [en, de, u] = r.pick([
        ['Pasta', 'Nudeln', 'g'],
        ['Coffee', 'Kaffee', 'g'],
        ['Muesli', 'Müsli', 'g'],
        ['Orange juice', 'Orangensaft', 'ml'],
        ['Shampoo', 'Shampoo', 'ml'],
      ])
      const sizes = u === 'g' ? [250, 400, 500, 750, 1000] : [250, 500, 750, 1000, 1500]
      const per = T(u === 'g' ? 'kg' : 'litre', u === 'g' ? 'kg' : 'Liter')
      const short = u === 'g' ? 'kg' : 'L'
      const size = (s) => (s >= 1000 ? `${num(s / 1000)} ${u === 'g' ? 'kg' : 'L'}` : `${s} ${u}`)
      let A, B
      for (let i = 0; i < 30; i++) {
        const [s1, s2] = [r.pick(sizes), r.pick(sizes)]
        if (s1 === s2) continue
        const base = r.pick([2, 3, 4, 5, 6, 8, 10, 12])
        const p1 = Math.max(0.5, Math.round(((s1 / 1000) * base * (1 + r.pick([-0.15, -0.1, 0.1, 0.15, 0.2]))) * 20) / 20)
        const p2 = Math.max(0.5, Math.round(((s2 / 1000) * base) * 20) / 20)
        const u1 = p1 / (s1 / 1000)
        const u2 = p2 / (s2 / 1000)
        if (Math.abs(u1 - u2) / Math.min(u1, u2) < 0.04) continue
        A = { s: s1, p: p1, u: u1 }
        B = { s: s2, p: p2, u: u2 }
        break
      }
      if (!A) {
        A = { s: 500, p: 2.6, u: 5.2 }
        B = { s: 1000, p: 4.8, u: 4.8 }
      }
      const best = A.u < B.u ? 0 : 1
      const label = (x, name) => T(`${name} · ${size(x.s)} for ${eur(x.p)}`, `${name} · ${size(x.s)} um ${eur(x.p)}`)
      const line = (x, name) => `${name}: ${eur(x.p)} ÷ ${num(x.s / 1000)} ${short} = ${eur(x.u)} ${T('per', 'pro')} ${per}`
      return {
        q: T(`${en}: which pack is cheaper per ${per}?`, `${de}: Welche Packung ist pro ${per} billiger?`),
        choices: [label(A, 'A'), label(B, 'B')],
        answer: best,
        show: best === 0 ? 'A' : 'B',
        steps: [line(A, 'A'), line(B, 'B'), T(`${best === 0 ? 'A' : 'B'} is cheaper by ${eur(Math.abs(A.u - B.u))} per ${per}`, `${best === 0 ? 'A' : 'B'} ist pro ${per} um ${eur(Math.abs(A.u - B.u))} billiger`)],
      }
    },
  },
  {
    id: 'split-bill',
    group: 'money',
    title: ['Splitting the bill', 'Die Rechnung teilen'],
    rule: ['Divide first, then add the tip to your share.', 'Zuerst teilen, dann das Trinkgeld auf deinen Anteil.'],
    idea: [
      'A small number is easier to work with than a big one. Split the bill first, then add 10% to your own share (move the decimal point, add). Same answer, half the effort.',
      'Mit einer kleinen Zahl rechnet es sich leichter als mit einer großen. Teil zuerst die Rechnung, dann 10 % auf deinen Anteil (Komma verschieben, dazuzählen). Gleiches Ergebnis, halbe Arbeit.',
    ],
    example: {
      q: ['€78 for 4 people, plus a 10% tip', '€ 78 für 4 Personen, plus 10 % Trinkgeld'],
      steps: [
        ['€78 ÷ 4 = €19.50', '€ 78 ÷ 4 = € 19,50'],
        ['10% of that = €1.95', '10 % davon = € 1,95'],
        ['€19.50 + €1.95 = €21.45 each', '€ 19,50 + € 1,95 = € 21,45 pro Person'],
      ],
    },
    trap: ['If everyone rounds down, the last person pays extra — round up to the next 50 cent.', 'Wenn alle abrunden, zahlt die letzte Person drauf – lieber auf 50 Cent aufrunden.'],
    use: ['Dinner with friends, shared taxis, holiday flats.', 'Essen mit Freunden, geteiltes Taxi, Ferienwohnung.'],
    gen(r) {
      const n = r.int(3, 6)
      const tip = r.pick([10, 10, 5])
      // Half euros only with 10%, so every step stays exact to the cent
      const b = r.int(14, 38) + (tip === 10 ? r.pick([0, 0, 0.5]) : 0)
      const total = b * n
      const extra = (b * tip) / 100
      const each = r2(b + extra)
      return {
        q: T(`Dinner for ${n} costs ${eur(total)}. You add a ${pct(tip)} tip and split it evenly. How much does each person pay?`, `Ein Essen für ${n} kostet ${eur(total)}. Ihr gebt ${pct(tip)} Trinkgeld und teilt gleichmäßig. Wie viel zahlt jede Person?`),
        answer: each,
        tol: 0.011,
        unit: EURO(),
        show: eur(each),
        steps: [`${eur(total)} ÷ ${n} = ${eur(b)}`, T(`${pct(tip)} of ${eur(b)} = ${eur(extra)}`, `${pct(tip)} von ${eur(b)} = ${eur(extra)}`), `${eur(b)} + ${eur(extra)} = ${eur(each)}`],
      }
    },
  },
  {
    id: 'borrowing',
    group: 'money',
    title: ['What borrowing costs', 'Was Schulden kosten'],
    rule: ['Interest per month ≈ amount × yearly rate ÷ 12.', 'Zinsen pro Monat ≈ Betrag × Jahreszins ÷ 12.'],
    idea: [
      'A yearly rate sounds abstract. Turn it into euros per month: amount × rate is a year’s interest, ÷ 12 is one month. An overdraft at 12% costs 1% of what you owe, every month.',
      'Ein Jahreszins klingt abstrakt. Rechne ihn in Euro pro Monat um: Betrag × Zinssatz ist ein Jahr Zinsen, ÷ 12 ist ein Monat. Ein Überziehungsrahmen mit 12 % kostet jeden Monat 1 % von dem, was du schuldest.',
    ],
    example: {
      q: ['€1,500 overdrawn at 12% for 3 months', '€ 1.500 überzogen zu 12 % für 3 Monate'],
      steps: [
        ['A year: €1,500 × 12% = €180', 'Ein Jahr: € 1.500 × 12 % = € 180'],
        ['A month: €180 ÷ 12 = €15', 'Ein Monat: € 180 ÷ 12 = € 15'],
        ['3 months: €45', '3 Monate: € 45'],
      ],
    },
    trap: ['“Only 1.5% a month” is about 18% a year — more than most loans.', '„Nur 1,5 % im Monat“ sind rund 18 % im Jahr – mehr als bei den meisten Krediten.'],
    use: ['Overdrafts, buy now pay later, credit cards, car loans.', 'Kontoüberziehung, Ratenkauf, Kreditkarten, Autokredite.'],
    gen(r) {
      if (r.next() < 0.7) {
        const P = r.pick([500, 800, 1000, 1200, 1500, 2000, 2400, 3000, 5000])
        const rate = r.pick([6, 9, 12, 15, 18])
        const m = r.pick([1, 2, 3, 4, 6, 12])
        const Y = (P * rate) / 100
        const M = Y / 12
        const ans = r2(M * m)
        const steps = [T(`A year: ${eur(P)} × ${pct(rate)} = ${eur(Y)}`, `Ein Jahr: ${eur(P)} × ${pct(rate)} = ${eur(Y)}`), T(`A month: ${eur(Y)} ÷ 12 = ${eur(M)}`, `Ein Monat: ${eur(Y)} ÷ 12 = ${eur(M)}`)]
        if (m > 1) steps.push(T(`${m} months: ${m} × ${eur(M)} = ${eur(ans)}`, `${m} Monate: ${m} × ${eur(M)} = ${eur(ans)}`))
        return {
          q: T(
            `Your account is ${eur(P)} overdrawn at ${pct(rate)} a year. How much interest do you pay for ${m} month${m === 1 ? '' : 's'}?`,
            `Dein Konto ist mit ${eur(P)} überzogen, zu ${pct(rate)} pro Jahr. Wie viel Zinsen zahlst du für ${m} ${m === 1 ? 'Monat' : 'Monate'}?`,
          ),
          answer: ans,
          tol: 0.011,
          unit: EURO(),
          show: eur(ans),
          steps,
        }
      }
      const mr = r.pick([1, 1.5, 2, 2.5])
      const simple = mr * 12
      const comp = (Math.pow(1 + mr / 100, 12) - 1) * 100
      return {
        q: T(`A pay-later plan charges ${pct(mr)} a month. Roughly what is that per year?`, `Ein Ratenkauf verlangt ${pct(mr)} pro Monat. Ungefähr wie viel ist das pro Jahr?`),
        answer: simple,
        min: simple - 0.5,
        max: comp + 0.5,
        unit: PCT(),
        show: `≈ ${pct(simple)}`,
        steps: [`${pct(mr)} × 12 = ${pct(simple)}`, T(`With interest on the interest it’s even ${pct(comp, 1)}`, `Mit Zinseszins sind es sogar ${pct(comp, 1)}`)],
      }
    },
  },
  {
    id: 'rule-72',
    group: 'money',
    title: ['The rule of 72', 'Die 72er-Regel'],
    rule: ['Years to double ≈ 72 ÷ the yearly percent.', 'Jahre bis zur Verdopplung ≈ 72 ÷ Prozent pro Jahr.'],
    idea: [
      'Anything that grows by a fixed percent a year — savings, debt, prices — doubles in about 72 ÷ rate years. It works backwards too: to double in 9 years you need about 8% a year.',
      'Alles, was um einen festen Prozentsatz pro Jahr wächst – Erspartes, Schulden, Preise –, verdoppelt sich in etwa 72 ÷ Zinssatz Jahren. Das geht auch umgekehrt: Um in 9 Jahren zu verdoppeln, brauchst du etwa 8 % pro Jahr.',
    ],
    example: {
      q: ['Savings at 6%, prices with 3% inflation', 'Sparen zu 6 %, Preise bei 3 % Inflation'],
      steps: [
        ['72 ÷ 6 = 12 years for your savings to double', '72 ÷ 6 = 12 Jahre, bis sich dein Erspartes verdoppelt'],
        ['72 ÷ 3 = 24 years for prices to double', '72 ÷ 3 = 24 Jahre, bis sich die Preise verdoppeln'],
      ],
    },
    trap: ['It’s an estimate for rates from about 2% to 15% — good enough to decide, not to the day.', 'Eine Schätzung für Zinssätze von etwa 2 % bis 15 % – genau genug für Entscheidungen, nicht auf den Tag.'],
    use: ['Savings, index funds, inflation, credit-card debt.', 'Sparen, ETFs, Inflation, Kreditkartenschulden.'],
    gen(r) {
      const kind = r.int(0, 3)
      const exactYears = (rate) => Math.log(2) / Math.log(1 + rate / 100)
      if (kind === 2) {
        const y = r.pick([6, 8, 9, 12, 18, 24])
        const need = 72 / y
        return {
          q: T(`You want your money to double in ${y} years. About what yearly return do you need?`, `Dein Geld soll sich in ${y} Jahren verdoppeln. Etwa welche Rendite pro Jahr brauchst du?`),
          answer: need,
          tol: 0.6,
          unit: PCT(),
          show: `≈ ${pct(need, 1)}`,
          steps: [`72 ÷ ${y} = ${num(need, 1)}`, T(`About ${pct(need, 1)} a year`, `Etwa ${pct(need, 1)} pro Jahr`)],
        }
      }
      const rate = kind === 3 ? r.pick([12, 18, 24]) : r.pick([2, 3, 4, 6, 8, 9, 12])
      const y = 72 / rate
      const q = [
        T(`Savings grow ${pct(rate)} a year. In about how many years do they double?`, `Ersparnisse wachsen um ${pct(rate)} pro Jahr. In etwa wie vielen Jahren verdoppeln sie sich?`),
        T(`Inflation is ${pct(rate)} a year. In about how many years do prices double?`, `Die Inflation liegt bei ${pct(rate)} pro Jahr. In etwa wie vielen Jahren verdoppeln sich die Preise?`),
        '',
        T(`An unpaid credit-card debt grows ${pct(rate)} a year. In about how many years does it double?`, `Unbezahlte Kreditkartenschulden wachsen um ${pct(rate)} pro Jahr. In etwa wie vielen Jahren verdoppeln sie sich?`),
      ][kind]
      return {
        q,
        answer: y,
        tol: Math.max(0.6, y * 0.05),
        unit: YEARS(),
        show: T(`≈ ${num(y, 1)} years`, `≈ ${num(y, 1)} Jahre`),
        steps: [`72 ÷ ${rate} = ${num(y, 1)}`, T(`Exactly it’s ${num(exactYears(rate), 1)} years — the rule is close`, `Genau sind es ${num(exactYears(rate), 1)} Jahre – die Regel liegt knapp dran`)],
      }
    },
  },
  {
    id: 'growth',
    group: 'money',
    title: ['Growth over many years', 'Wachstum über viele Jahre'],
    rule: ['Count the doublings (72 ÷ rate years each), then double that many times.', 'Zähl die Verdopplungen (je 72 ÷ Zinssatz Jahre) und verdopple so oft.'],
    idea: [
      'Compound growth is hard to work out in your head but easy to estimate. Find the doubling time with the rule of 72, count how many doublings fit, and double that many times. This is why starting to save early matters so much.',
      'Zinseszins ist im Kopf schwer zu rechnen, aber leicht zu schätzen. Bestimme mit der 72er-Regel die Verdopplungszeit, zähl, wie oft sie hineinpasst, und verdopple so oft. Darum ist es so wichtig, früh mit dem Sparen anzufangen.',
    ],
    example: {
      q: ['€1,000 at 8% for 27 years', '€ 1.000 zu 8 % für 27 Jahre'],
      steps: [
        ['Doubles every 72 ÷ 8 = 9 years', 'Verdoppelt sich alle 72 ÷ 8 = 9 Jahre'],
        ['27 years = 3 doublings: 1,000 → 2,000 → 4,000 → 8,000', '27 Jahre = 3 Verdopplungen: 1.000 → 2.000 → 4.000 → 8.000'],
        ['About €8,000 (exactly €7,988)', 'Etwa € 8.000 (genau € 7.988)'],
      ],
    },
    trap: ['Simple interest (1,000 + 27 × 80 = 3,160) badly underestimates long-term growth.', 'Einfache Zinsen (1.000 + 27 × 80 = 3.160) unterschätzen langfristiges Wachstum gewaltig.'],
    use: ['Saving for later, why starting early matters, long loans.', 'Vorsorge, warum früh anfangen zählt, lange Kredite.'],
    gen(r) {
      const rate = r.pick([3, 4, 6, 8, 9, 12])
      const d = 72 / rate
      const kmax = Math.max(1, Math.min(4, Math.floor(40 / d)))
      const k = r.int(1, kmax)
      const n = k * d
      const P = r.pick([500, 1000, 2000, 5000, 10000])
      const est = P * 2 ** k
      const exact = P * (1 + rate / 100) ** n
      const chain = Array.from({ length: k + 1 }, (_, i) => num(P * 2 ** i)).join(' → ')
      return {
        q: T(`You invest ${eur(P)} at ${pct(rate)} a year and leave it for ${n} years. Roughly how much do you have then?`, `Du legst ${eur(P)} zu ${pct(rate)} pro Jahr an und lässt es ${n} Jahre liegen. Ungefähr wie viel hast du dann?`),
        answer: exact,
        min: Math.min(est, exact) * 0.94,
        max: Math.max(est, exact) * 1.06,
        unit: EURO(),
        show: `≈ ${eur(est)}`,
        steps: [
          T(`Doubling time: 72 ÷ ${rate} = ${d} years`, `Verdopplungszeit: 72 ÷ ${rate} = ${d} Jahre`),
          T(`${n} years = ${k} doubling${k === 1 ? '' : 's'}: ${chain}`, `${n} Jahre = ${k} Verdopplung${k === 1 ? '' : 'en'}: ${chain}`),
          T(`Exactly: ${eur(Math.round(exact))}`, `Genau: ${eur(Math.round(exact))}`),
        ],
      }
    },
  },

  /* ---------- Chance & data ---------- */
  {
    id: 'expected',
    group: 'chance',
    title: ['Is the bet worth it?', 'Lohnt sich die Wette?'],
    rule: ['Expected value = prize × chance − cost.', 'Erwartungswert = Gewinn × Wahrscheinlichkeit − Einsatz.'],
    idea: [
      'Imagine playing many times. A 1-in-1,000 chance at €500 is worth €0.50 per ticket on average. If the ticket costs €2, you lose €1.50 every time — on average, for ever.',
      'Stell dir vor, du spielst sehr oft. Eine 1-zu-1.000-Chance auf € 500 ist im Schnitt € 0,50 pro Los wert. Kostet das Los € 2, verlierst du jedes Mal € 1,50 – im Schnitt, für immer.',
    ],
    example: {
      q: ['€2 ticket, 1 in 1,000 wins €500', 'Los um € 2, 1 von 1.000 gewinnt € 500'],
      steps: [
        ['€500 ÷ 1,000 = €0.50 back per ticket on average', '€ 500 ÷ 1.000 = € 0,50 pro Los im Schnitt zurück'],
        ['€0.50 − €2 = −€1.50 per ticket', '€ 0,50 − € 2 = −€ 1,50 pro Los'],
      ],
    },
    trap: ['A big prize doesn’t make a bet good — only prize × chance does.', 'Ein hoher Gewinn macht eine Wette nicht gut – nur Gewinn × Chance zählt.'],
    use: ['Lotteries, raffles, sports bets, “win a phone” games, insurance.', 'Lotto, Tombola, Sportwetten, „Gewinne ein Handy“-Spiele, Versicherungen.'],
    gen(r) {
      if (r.next() < 0.65) {
        const c = r.pick([1, 2, 3, 5])
        const N = r.pick([100, 1000, 10000])
        const v = r.pick([0.2, 0.25, 0.5, 0.6, 0.75].filter((x) => x < c))
        const W = v * N
        const lose = r2(c - v)
        return {
          q: T(`A raffle ticket costs ${eur(c)}. 1 ticket in ${num(N)} wins ${eur(W)}. On average, how much do you lose per ticket?`, `Ein Tombola-Los kostet ${eur(c)}. Eines von ${num(N)} Losen gewinnt ${eur(W)}. Wie viel verlierst du im Schnitt pro Los?`),
          answer: lose,
          tol: 0.005,
          unit: EURO(),
          show: eur(lose),
          steps: [
            T(`Average win per ticket: ${eur(W)} ÷ ${num(N)} = ${eur(v)}`, `Durchschnittlicher Gewinn pro Los: ${eur(W)} ÷ ${num(N)} = ${eur(v)}`),
            `${eur(v)} − ${eur(c)} = −${eur(lose)}`,
            T(`Play 100 times and you’re down about ${eur(lose * 100)}`, `Spielst du 100-mal, fehlen dir etwa ${eur(lose * 100)}`),
          ],
        }
      }
      const B = r.pick([10, 20, 37, 50])
      const loss = r2(B / 37)
      return {
        q: T(
          `In roulette, a ${eur(B)} bet on red wins ${eur(B)} in 18 of 37 cases and loses ${eur(B)} in the other 19. On average, how much do you lose per bet?`,
          `Beim Roulette gewinnt ein Einsatz von ${eur(B)} auf Rot in 18 von 37 Fällen ${eur(B)} und verliert in den anderen 19 Fällen ${eur(B)}. Wie viel verlierst du im Schnitt pro Spiel?`,
        ),
        answer: loss,
        tol: 0.011,
        unit: EURO(),
        show: eur(loss),
        steps: [
          T(`Over 37 spins: win 18 × ${eur(B)}, lose 19 × ${eur(B)}`, `In 37 Runden: 18 × ${eur(B)} gewonnen, 19 × ${eur(B)} verloren`),
          T(`Net: −${eur(B)} every 37 spins`, `Unterm Strich: −${eur(B)} alle 37 Runden`),
          `${eur(B)} ÷ 37 ≈ ${eur(loss)}`,
        ],
      }
    },
  },
  {
    id: 'positive-test',
    group: 'chance',
    title: ['A positive test — now what?', 'Test positiv – und jetzt?'],
    rule: ['Picture 10,000 people. Count true and false positives, then compare.', 'Stell dir 10.000 Menschen vor. Zähl echte und falsche Positive und vergleiche.'],
    idea: [
      'When something is rare, most positive results can be false alarms — even with a good test. Don’t think in percentages, think in people: out of 10,000, how many have it and test positive, and how many don’t but test positive anyway?',
      'Wenn etwas selten ist, können die meisten positiven Ergebnisse Fehlalarme sein – auch bei einem guten Test. Denk nicht in Prozent, sondern in Menschen: Wie viele von 10.000 haben es und testen positiv, und wie viele haben es nicht, testen aber trotzdem positiv?',
    ],
    example: {
      q: ['1% have it, the test finds 90%, 9% false alarms', '1 % haben es, der Test findet 90 %, 9 % Fehlalarme'],
      steps: [
        ['Of 10,000: 100 have it → 90 test positive', 'Von 10.000: 100 haben es → 90 testen positiv'],
        ['9,900 don’t → 891 test positive anyway', '9.900 haben es nicht → 891 testen trotzdem positiv'],
        ['90 of 981 positives ≈ 9%', '90 von 981 Positiven ≈ 9 %'],
      ],
    },
    trap: ['“The test is 90% accurate” doesn’t mean a positive result is 90% certain.', '„Der Test ist zu 90 % genau“ heißt nicht, dass ein positives Ergebnis zu 90 % stimmt.'],
    use: ['Medical tests, spam filters, fraud alerts, screening in the news.', 'Medizinische Tests, Spamfilter, Betrugswarnungen, Vorsorge in den Nachrichten.'],
    gen(r) {
      const p = r.pick([1, 2, 5, 10])
      const s = r.pick([80, 90, 95, 99])
      const f = r.pick([2, 5, 9, 10, 20])
      const sick = 100 * p
      const tp = (sick * s) / 100
      const healthy = 10000 - sick
      const fp = (healthy * f) / 100
      const ans = (100 * tp) / (tp + fp)
      return {
        q: T(
          `${pct(p)} of people have an illness. A test spots ${pct(s)} of them, but also wrongly flags ${pct(f)} of healthy people. You test positive. What’s the chance (in %) that you really have it?`,
          `${pct(p)} der Menschen haben eine Krankheit. Ein Test erkennt ${pct(s)} davon, schlägt aber auch bei ${pct(f)} der Gesunden falsch an. Du testest positiv. Wie wahrscheinlich (in %) bist du wirklich krank?`,
        ),
        answer: ans,
        tol: 1.01,
        unit: PCT(),
        show: `≈ ${pct(Math.round(ans))}`,
        steps: [
          T(`Of 10,000 people, ${num(sick)} are ill → ${num(tp)} test positive`, `Von 10.000 Menschen sind ${num(sick)} krank → ${num(tp)} testen positiv`),
          T(`${num(healthy)} are healthy → ${num(fp)} test positive anyway`, `${num(healthy)} sind gesund → ${num(fp)} testen trotzdem positiv`),
          `${num(tp)} ÷ ${num(tp + fp)} ≈ ${pct(ans, 1)}`,
        ],
      }
    },
  },
  {
    id: 'at-least-once',
    group: 'chance',
    title: ['At least once', 'Mindestens einmal'],
    rule: ['P(at least once) = 1 − P(never).', 'P(mindestens einmal) = 1 − P(nie).'],
    idea: [
      '“At least once” has many cases; “never” has just one. Work out the chance it never happens — multiply the “no” chances — and subtract from 100%.',
      '„Mindestens einmal“ hat viele Fälle, „nie“ nur einen. Rechne aus, wie wahrscheinlich es nie passiert – die „Nein“-Chancen multiplizieren – und zieh das von 100 % ab.',
    ],
    example: {
      q: ['30% chance of rain on each of 3 days', 'An jedem von 3 Tagen 30 % Regenwahrscheinlichkeit'],
      steps: [
        ['No rain at all: 0.7 × 0.7 × 0.7 = 0.343', 'Gar kein Regen: 0,7 × 0,7 × 0,7 = 0,343'],
        ['At least one rainy day: 1 − 0.343 ≈ 66%', 'Mindestens ein Regentag: 1 − 0,343 ≈ 66 %'],
      ],
    },
    trap: ['Adding gives nonsense: 3 × 30% = 90%, and 4 days would make 120%.', 'Addieren führt zu Unsinn: 3 × 30 % = 90 %, und 4 Tage wären 120 %.'],
    use: ['Weather on a trip, “will one of us be late?”, risks that add up over years.', 'Wetter im Urlaub, „kommt einer von uns zu spät?“, Risiken, die sich über Jahre summieren.'],
    gen(r) {
      const kind = r.int(0, 2)
      let q, no, n, pNo
      if (kind === 0) {
        const p = r.pick([10, 20, 30, 40, 50])
        n = r.pick([2, 3, 4])
        pNo = 1 - p / 100
        q = T(`There’s a ${pct(p)} chance of rain on each day of a ${n}-day trip. What’s the chance (in %) it rains at least once?`, `An jedem Tag eines ${n}-tägigen Ausflugs regnet es mit ${pct(p)} Wahrscheinlichkeit. Wie wahrscheinlich (in %) regnet es mindestens einmal?`)
      } else if (kind === 1) {
        n = r.pick([2, 3, 4])
        pNo = 5 / 6
        q = T(`You roll a die ${n} times. What’s the chance (in %) of at least one six?`, `Du würfelst ${n}-mal. Wie wahrscheinlich (in %) ist mindestens ein Sechser?`)
      } else {
        const p = r.pick([10, 20])
        n = r.pick([2, 3, 5])
        pNo = 1 - p / 100
        q = T(`Your bus is late ${pct(p)} of the time. What’s the chance (in %) it’s late at least once in ${n} school days?`, `Dein Bus ist in ${pct(p)} der Fälle zu spät. Wie wahrscheinlich (in %) ist er an ${n} Schultagen mindestens einmal zu spät?`)
      }
      no = pNo ** n
      const ans = 100 * (1 - no)
      return {
        q,
        answer: ans,
        tol: 1.51,
        unit: PCT(),
        show: `≈ ${pct(Math.round(ans))}`,
        steps: [T(`Chance of never: ${pow(kind === 1 ? '(5/6)' : num(pNo), n)} = ${num(no, 3)}`, `Chance auf nie: ${pow(kind === 1 ? '(5/6)' : num(pNo), n)} = ${num(no, 3)}`), `1 − ${num(no, 3)} = ${num(1 - no, 3)} ≈ ${pct(Math.round(ans))}`],
      }
    },
  },
  {
    id: 'headlines',
    group: 'chance',
    title: ['Scary headlines', 'Schlagzeilen, die Angst machen'],
    rule: ['Ask: out of how many? “+50%” can mean 2 → 3 in 10,000.', 'Frag: von wie vielen? „+50 %“ kann 2 → 3 von 10.000 heißen.'],
    idea: [
      'Headlines love relative risk: “doubles the risk!”. What matters to you is absolute risk: how many extra people out of 10,000. A doubled tiny risk is still tiny.',
      'Schlagzeilen lieben relatives Risiko: „verdoppelt das Risiko!“. Für dich zählt das absolute Risiko: wie viele Menschen mehr von 10.000. Ein verdoppeltes winziges Risiko bleibt winzig.',
    ],
    example: {
      q: ['Risk goes from 4 to 6 in 10,000', 'Das Risiko steigt von 4 auf 6 pro 10.000'],
      steps: [
        ['Relative: 2 ÷ 4 = +50% — sounds big', 'Relativ: 2 ÷ 4 = +50 % – klingt viel'],
        ['Absolute: 2 extra cases in 10,000 = 0.02% of people', 'Absolut: 2 Fälle mehr pro 10.000 = 0,02 % der Menschen'],
      ],
    },
    trap: ['Never judge a percent change without the number it started from.', 'Beurteile nie eine prozentuelle Änderung ohne den Wert, von dem sie ausgeht.'],
    use: ['Health news, side effects, crime figures, adverts.', 'Gesundheitsnews, Nebenwirkungen, Kriminalstatistik, Werbung.'],
    gen(r) {
      const [a, b] = r.pick([[2, 3], [2, 4], [4, 6], [5, 10], [10, 15], [20, 30], [4, 8], [5, 15], [10, 20]])
      const d = b - a
      const intro = T(`A study finds a habit raises the risk of an illness from ${a} to ${b} in 10,000 people.`, `Eine Studie: Eine Gewohnheit erhöht das Risiko einer Krankheit von ${a} auf ${b} pro 10.000 Menschen.`)
      const kind = r.int(0, 2)
      const rel = (d / a) * 100
      const steps = [
        T(`${b} − ${a} = ${d} extra cases in 10,000`, `${b} − ${a} = ${d} Fälle mehr pro 10.000`),
        T(`Relative: ${d} ÷ ${a} = +${pct(rel)} — sounds big`, `Relativ: ${d} ÷ ${a} = +${pct(rel)} – klingt viel`),
        T(`Absolute: ${pct(d / 100)} of people`, `Absolut: ${pct(d / 100)} der Menschen`),
      ]
      if (kind === 0)
        return { q: `${intro} ${T('By what percent did the risk rise?', 'Um wie viel Prozent ist das Risiko gestiegen?')}`, answer: rel, tol: 0.05, unit: PCT(), show: pct(rel), steps }
      if (kind === 1)
        return { q: `${intro} ${T('How many extra cases is that per 10,000 people?', 'Wie viele zusätzliche Fälle sind das pro 10.000 Menschen?')}`, answer: d, tol: 0.05, unit: '', show: num(d), steps }
      const nnh = 10000 / d
      return {
        q: `${intro} ${T('How many people would need the habit for one extra case?', 'Wie viele Menschen bräuchten diese Gewohnheit für einen zusätzlichen Fall?')}`,
        answer: nnh,
        tol: 0.5,
        unit: '',
        show: num(nnh, 0),
        steps: [steps[0], `${num(10000)} ÷ ${d} = ${num(nnh, 0)}`, T(`So ${num(nnh, 0)} people for one extra case`, `Also ${num(nnh, 0)} Menschen für einen zusätzlichen Fall`)],
      }
    },
  },
  {
    id: 'median',
    group: 'chance',
    title: ['Average or median?', 'Durchschnitt oder Median?'],
    rule: ['Median = the middle value once sorted. One extreme value moves the mean, not the median.', 'Median = der mittlere Wert, wenn sortiert. Ein Ausreißer verschiebt den Durchschnitt, nicht den Median.'],
    idea: [
      'The mean adds everything up and divides; one huge value drags it up. The median just takes the middle one. When someone quotes an “average salary” or “average rent”, ask which one they mean.',
      'Der Durchschnitt zählt alles zusammen und teilt; ein riesiger Wert zieht ihn hoch. Der Median nimmt einfach den mittleren Wert. Wenn jemand vom „Durchschnittsgehalt“ oder der „Durchschnittsmiete“ spricht, frag, welchen Wert er meint.',
    ],
    example: {
      q: ['Pocket money: 20, 25, 30, 35, 190', 'Taschengeld: 20, 25, 30, 35, 190'],
      steps: [
        ['Mean: 300 ÷ 5 = 60', 'Durchschnitt: 300 ÷ 5 = 60'],
        ['Median: the middle one, 30', 'Median: der mittlere, 30'],
        ['Which describes the group better?', 'Was beschreibt die Gruppe besser?'],
      ],
    },
    trap: ['Sort the numbers before you pick the middle one.', 'Zuerst sortieren, dann die Mitte nehmen.'],
    use: ['Salaries, rents, house prices, grades, screen time.', 'Gehälter, Mieten, Wohnungspreise, Noten, Bildschirmzeit.'],
    gen(r) {
      const ctx = r.int(0, 2)
      const distinct = (lo, hi, step) => {
        const out = []
        while (out.length < 4) {
          const v = lo + step * r.int(0, Math.floor((hi - lo) / step))
          if (!out.includes(v)) out.push(v)
        }
        return out
      }
      let vals, outlier, fmt, what
      if (ctx === 0) {
        vals = distinct(11, 16, 1)
        outlier = r.int(50, 90)
        while ((vals.reduce((a, b) => a + b, 0) + outlier) % 5) outlier++
        fmt = eur
        what = T('hourly wages in a small café (the owner included)', 'Stundenlöhne in einem kleinen Café (die Chefin eingerechnet)')
      } else if (ctx === 1) {
        vals = distinct(600, 900, 50)
        outlier = 100 * r.int(25, 40)
        fmt = eur
        what = T('monthly rents in one building (one is a penthouse)', 'Monatsmieten in einem Haus (eine davon ein Penthouse)')
      } else {
        vals = distinct(60, 150, 10)
        outlier = 10 * r.int(40, 60)
        fmt = (x) => `${num(x)} min`
        what = T('daily screen times in your friend group', 'täglichen Bildschirmzeiten in deinem Freundeskreis')
      }
      const all = [...vals, outlier]
      const shown = [...all].sort(() => r.next() - 0.5)
      const sorted = [...all].sort((a, b) => a - b)
      const med = sorted[2]
      const sum = all.reduce((a, b) => a + b, 0)
      const mean = sum / 5
      const kind = r.int(0, 2)
      const unit = ctx === 2 ? MIN() : EURO()
      const lead = T(`The ${what}: ${shown.map(fmt).join(', ')}.`, `Die ${what}: ${shown.map(fmt).join(', ')}.`)
      const steps = [
        T(`Sorted: ${sorted.map(fmt).join(', ')}`, `Sortiert: ${sorted.map(fmt).join(', ')}`),
        T(`Median (the middle one): ${fmt(med)}`, `Median (der mittlere): ${fmt(med)}`),
        T(`Mean: ${fmt(sum)} ÷ 5 = ${fmt(mean)}`, `Durchschnitt: ${fmt(sum)} ÷ 5 = ${fmt(mean)}`),
      ]
      if (kind === 0) return { q: `${lead} ${T('What is the median?', 'Wie groß ist der Median?')}`, answer: med, tol: 0.005, unit, show: fmt(med), steps: steps.slice(0, 2) }
      if (kind === 1) return { q: `${lead} ${T('What is the mean (average)?', 'Wie groß ist der Durchschnitt?')}`, answer: mean, tol: 0.005, unit, show: fmt(mean), steps: [steps[2]] }
      steps.push(`${fmt(mean)} − ${fmt(med)} = ${fmt(mean - med)}`)
      return { q: `${lead} ${T('How much higher is the mean than the median?', 'Um wie viel liegt der Durchschnitt über dem Median?')}`, answer: mean - med, tol: 0.005, unit, show: fmt(mean - med), steps }
    },
  },

  /* ---------- Time, trips & kitchen ---------- */
  {
    id: 'clock',
    group: 'life',
    title: ['Clock maths', 'Mit Uhrzeiten rechnen'],
    rule: ['Hop to the next full hour, then whole hours, then the rest.', 'Zur nächsten vollen Stunde springen, dann ganze Stunden, dann der Rest.'],
    idea: [
      'Time isn’t decimal: an hour has 60 minutes, so 14:47 + 30 minutes isn’t 14:77. Hop in friendly steps — up to the full hour, then whole hours, then the leftover minutes.',
      'Zeit ist nicht dezimal: Eine Stunde hat 60 Minuten, also ist 14:47 + 30 Minuten nicht 14:77. Spring in bequemen Schritten – bis zur vollen Stunde, dann ganze Stunden, dann die restlichen Minuten.',
    ],
    example: {
      q: ['14:47 to 17:12', '14:47 bis 17:12'],
      steps: [
        ['14:47 → 15:00: 13 min', '14:47 → 15:00: 13 min'],
        ['15:00 → 17:00: 120 min', '15:00 → 17:00: 120 min'],
        ['17:00 → 17:12: 12 min. Total 145 min', '17:00 → 17:12: 12 min. Zusammen 145 min'],
      ],
    },
    trap: ['1.5 hours is 1 h 30 min, not 1 h 50 min.', '1,5 Stunden sind 1 h 30 min, nicht 1 h 50 min.'],
    use: ['Train connections, cooking times, shifts, when the film ends.', 'Zuganschlüsse, Kochzeiten, Schichten, wann der Film aus ist.'],
    gen(r) {
      if (r.next() < 0.6) {
        let s, e
        for (let i = 0; i < 30; i++) {
          s = r.int(6 * 60, 20 * 60)
          e = s + r.int(25, 230)
          if (s % 60 && e % 60 && Math.floor(e / 60) > Math.floor(s / 60)) break
        }
        const nextH = Math.ceil(s / 60) * 60
        const endH = Math.floor(e / 60) * 60
        const a = nextH - s
        const h = (endH - nextH) / 60
        const b = e - endH
        const steps = [`${hm(s)} → ${hm(nextH)}: ${a} min`]
        if (h > 0) steps.push(`${hm(nextH)} → ${hm(endH)}: ${h * 60} min`)
        steps.push(`${hm(endH)} → ${hm(e)}: ${b} min`, `${[a, h * 60, b].filter(Boolean).join(' + ')} = ${e - s} min`)
        return {
          q: T(`Your train leaves at ${hm(s)} and arrives at ${hm(e)}. How many minutes is the journey?`, `Dein Zug fährt um ${hm(s)} ab und kommt um ${hm(e)} an. Wie viele Minuten dauert die Fahrt?`),
          answer: e - s,
          tol: 0.005,
          unit: MIN(),
          show: `${e - s} min`,
          steps,
        }
      }
      const w = r.int(10, 16)
      const mins = r.pick([75, 90, 105, 135, 150, 165, 195, 210, 225])
      const H = mins / 60
      const pay = r2(w * H)
      const h = Math.floor(H)
      const m = mins - h * 60
      return {
        q: T(`You worked ${h} h ${m} min at ${eur(w)} an hour. How much did you earn?`, `Du hast ${h} h ${m} min zu ${eur(w)} pro Stunde gearbeitet. Wie viel verdienst du?`),
        answer: pay,
        tol: 0.005,
        unit: EURO(),
        show: eur(pay),
        steps: [`${m} min = ${num(m / 60)} h`, `${h} h ${m} min = ${num(H)} h`, `${num(H)} × ${eur(w)} = ${eur(pay)}`],
      }
    },
  },
  {
    id: 'speed',
    group: 'life',
    title: ['Speed, distance, time', 'Geschwindigkeit, Strecke, Zeit'],
    rule: ['Time = distance ÷ speed. Minutes = distance ÷ speed × 60.', 'Zeit = Strecke ÷ Geschwindigkeit. Minuten = Strecke ÷ Geschwindigkeit × 60.'],
    idea: [
      'At 60 km/h you cover 1 km a minute; at 120 km/h it’s 2. And the average speed of a round trip is not the average of the two speeds — you spend longer on the slow part.',
      'Mit 60 km/h schaffst du 1 km pro Minute, mit 120 km/h 2 km. Und die Durchschnittsgeschwindigkeit einer Hin- und Rückfahrt ist nicht der Mittelwert beider Geschwindigkeiten – auf dem langsamen Teil bist du länger unterwegs.',
    ],
    example: {
      q: ['150 km at 100 km/h', '150 km mit 100 km/h'],
      steps: [
        ['150 ÷ 100 = 1.5 h', '150 ÷ 100 = 1,5 h'],
        ['1.5 × 60 = 90 min', '1,5 × 60 = 90 min'],
      ],
    },
    trap: ['There at 60 and back at 40 averages 48 km/h, not 50.', 'Hin mit 60 und zurück mit 40 ergibt im Schnitt 48 km/h, nicht 50.'],
    use: ['Road trips, cycling, “will I make the train?”.', 'Autofahrten, Radtouren, „erwisch ich den Zug noch?“.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        let v, m, d
        for (let i = 0; i < 40; i++) {
          v = r.pick([30, 40, 50, 60, 80, 90, 100, 120, 130])
          m = r.pick([15, 20, 30, 40, 45, 50, 75, 90, 105, 120, 150])
          d = (v * m) / 60
          if (Number.isInteger(d)) break
        }
        return {
          q: T(`${d} km at ${v} km/h. How many minutes does that take?`, `${d} km mit ${v} km/h. Wie viele Minuten dauert das?`),
          answer: m,
          tol: 0.5,
          unit: MIN(),
          show: `${m} min`,
          steps: [`${d} ÷ ${v} = ${num(d / v, 3)} h`, `${num(d / v, 3)} × 60 = ${m} min`],
        }
      }
      if (kind === 1) {
        const [a, b] = r.pick([[60, 40], [30, 60], [40, 120], [50, 75], [80, 120], [100, 150], [60, 90], [20, 30]])
        const D = (a * b) / gcd(a, b)
        const t1 = D / a
        const t2 = D / b
        const avg = (2 * D) / (t1 + t2)
        return {
          q: T(`You go somewhere at ${a} km/h and come back the same way at ${b} km/h. What’s your average speed?`, `Du fährst mit ${a} km/h hin und auf derselben Strecke mit ${b} km/h zurück. Wie hoch ist deine Durchschnittsgeschwindigkeit?`),
          answer: avg,
          tol: 0.5,
          unit: 'km/h',
          show: `${num(avg)} km/h`,
          steps: [
            T(`Say it’s ${D} km each way`, `Angenommen, es sind ${D} km pro Richtung`),
            T(`There: ${t1} h, back: ${t2} h`, `Hin: ${t1} h, zurück: ${t2} h`),
            `${2 * D} km ÷ ${t1 + t2} h = ${num(avg)} km/h`,
          ],
        }
      }
      const v = r.pick([18, 36, 54, 72, 90, 108, 126])
      return {
        q: T(`A car drives at ${v} km/h. How many metres does it cover every second?`, `Ein Auto fährt ${v} km/h. Wie viele Meter legt es pro Sekunde zurück?`),
        answer: v / 3.6,
        tol: 0.05,
        unit: 'm/s',
        show: `${num(v / 3.6)} m/s`,
        steps: [`${v} km/h = ${num(v * 1000)} m ÷ 3600 s`, `${v} ÷ ${num(3.6)} = ${num(v / 3.6)} m/s`, T('Glance at your phone for 2 seconds and the car has moved twice that far', 'Zwei Sekunden aufs Handy schauen, und das Auto ist doppelt so weit gefahren')],
      }
    },
  },
  {
    id: 'trip-cost',
    group: 'life',
    title: ['What a trip costs', 'Was eine Fahrt kostet'],
    rule: ['Litres = km ÷ 100 × consumption. Cost = litres × price.', 'Liter = km ÷ 100 × Verbrauch. Kosten = Liter × Preis.'],
    idea: [
      'Fuel use is given per 100 km. Divide the trip by 100 and multiply by the consumption to get litres, then by the price per litre. Split it by the number of people to compare with a train ticket.',
      'Der Verbrauch wird pro 100 km angegeben. Strecke durch 100, mal Verbrauch ergibt die Liter, dann mal Literpreis. Durch die Anzahl der Leute teilen, um mit dem Zugticket zu vergleichen.',
    ],
    example: {
      q: ['300 km, 6 L per 100 km, €1.70 a litre', '300 km, 6 L auf 100 km, € 1,70 pro Liter'],
      steps: [
        ['3 × 6 = 18 L', '3 × 6 = 18 L'],
        ['18 × €1.70 = €30.60', '18 × € 1,70 = € 30,60'],
      ],
    },
    trap: ['The way back counts too — double it for a return trip.', 'Der Rückweg zählt auch – bei Hin und Retour verdoppeln.'],
    use: ['Road trips, car sharing, car vs train.', 'Autofahrten, Fahrgemeinschaften, Auto oder Zug.'],
    gen(r) {
      const d = r.pick([100, 150, 200, 240, 300, 400, 500])
      const c = r.pick([5, 5.5, 6, 6.5, 7, 8])
      const p = r.pick([1.5, 1.6, 1.7, 1.8])
      const k = r.pick([1, 1, 2, 3, 4])
      const ret = r.next() < 0.35
      const L = (d / 100) * c
      const cost = L * p
      const each = r2(cost / k)
      const dist = ret ? T(`${d / 2} km there and ${d / 2} km back`, `${d / 2} km hin und ${d / 2} km zurück`) : `${d} km`
      const steps = []
      if (ret) steps.push(`${d / 2} × 2 = ${d} km`)
      steps.push(`${d} ÷ 100 × ${num(c)} = ${num(L)} L`, `${num(L)} × ${eur(p)} = ${eur(cost)}`)
      if (k > 1) steps.push(`${eur(cost)} ÷ ${k} = ${eur(each)}`)
      return {
        q: T(
          `A trip of ${dist}. The car uses ${num(c)} L per 100 km and petrol costs ${eur(p)} a litre.${k > 1 ? ` You split the cost ${k} ways.` : ''} How much ${k > 1 ? 'does each person pay' : 'does the fuel cost'}?`,
          `Eine Fahrt: ${dist}. Das Auto braucht ${num(c)} L auf 100 km, Benzin kostet ${eur(p)} pro Liter.${k > 1 ? ` Ihr teilt die Kosten durch ${k}.` : ''} Wie viel ${k > 1 ? 'zahlt jede Person' : 'kostet der Sprit'}?`,
        ),
        answer: each,
        tol: 0.011,
        unit: EURO(),
        show: eur(each),
        steps,
      }
    },
  },
  {
    id: 'scale',
    group: 'life',
    title: ['Scale it up or down', 'Hoch- und runterrechnen'],
    rule: ['Go through one: find the amount for one, then multiply.', 'Über die Einheit: zuerst für eins, dann malnehmen.'],
    idea: [
      'If 4 portions need 300 g, one portion needs 75 g, so 6 portions need 450 g. Going through “one” works for recipes, prices and maps. But when more people finish faster it’s the other way round — the time gets divided.',
      'Wenn 4 Portionen 300 g brauchen, braucht eine Portion 75 g, also 6 Portionen 450 g. Der Umweg über „eins“ klappt bei Rezepten, Preisen und Landkarten. Aber wenn mehr Leute schneller fertig sind, ist es umgekehrt – dann wird die Zeit geteilt.',
    ],
    example: {
      q: ['3 kg of apples cost €4.50. What do 5 kg cost?', '3 kg Äpfel kosten € 4,50. Was kosten 5 kg?'],
      steps: [
        ['1 kg: €4.50 ÷ 3 = €1.50', '1 kg: € 4,50 ÷ 3 = € 1,50'],
        ['5 kg: 5 × €1.50 = €7.50', '5 kg: 5 × € 1,50 = € 7,50'],
      ],
    },
    trap: ['More people, less time: 4 people × 6 h = 24 person-hours, so 3 people need 8 h.', 'Mehr Leute, weniger Zeit: 4 Leute × 6 h = 24 Personenstunden, also brauchen 3 Leute 8 h.'],
    use: ['Cooking, buying by weight, maps, sharing out work.', 'Kochen, Einkauf nach Gewicht, Landkarten, Arbeit aufteilen.'],
    gen(r) {
      const kind = r.int(0, 3)
      if (kind === 0) {
        const a = r.pick([2, 3, 4, 6])
        let b = r.int(1, 8)
        if (b === a) b = a + 1
        const g = r.pick([25, 40, 50, 60, 75, 80, 100, 120, 150])
        const [en, de, u] = r.pick([
          ['flour', 'Mehl', 'g'],
          ['pasta', 'Nudeln', 'g'],
          ['milk', 'Milch', 'ml'],
          ['sugar', 'Zucker', 'g'],
        ])
        return {
          q: T(`A recipe for ${a} people uses ${g * a} ${u} of ${en}. How much for ${b} ${b === 1 ? 'person' : 'people'}?`, `Ein Rezept für ${a} Personen braucht ${g * a} ${u} ${de}. Wie viel für ${b} ${b === 1 ? 'Person' : 'Personen'}?`),
          answer: g * b,
          tol: 0.5,
          unit: u,
          show: `${g * b} ${u}`,
          steps: [T(`For 1 person: ${g * a} ÷ ${a} = ${g} ${u}`, `Für 1 Person: ${g * a} ÷ ${a} = ${g} ${u}`), T(`For ${b}: ${g} × ${b} = ${g * b} ${u}`, `Für ${b}: ${g} × ${b} = ${g * b} ${u}`)],
        }
      }
      if (kind === 1) {
        const a = r.pick([2, 3, 4, 5])
        let b = r.int(1, 7)
        if (b === a) b = a + 2
        const [en, de, per] = r.pick([
          ['apples', 'Äpfel', [0.8, 1.2, 1.5, 2.5]],
          ['potatoes', 'Erdäpfel', [0.6, 0.8, 1.2]],
          ['cheese', 'Käse', [9, 12, 14, 16]],
        ])
        const q1 = r.pick(per)
        return {
          q: T(`${a} kg of ${en} cost ${eur(a * q1)}. How much do ${b} kg cost?`, `${a} kg ${de} kosten ${eur(a * q1)}. Wie viel kosten ${b} kg?`),
          answer: r2(b * q1),
          tol: 0.005,
          unit: EURO(),
          show: eur(b * q1),
          steps: [`1 kg: ${eur(a * q1)} ÷ ${a} = ${eur(q1)}`, `${b} kg: ${b} × ${eur(q1)} = ${eur(b * q1)}`],
        }
      }
      if (kind === 2) {
        const w = r.pick([2, 3, 4, 6])
        const h = r.pick([3, 4, 6, 8, 12])
        const total = w * h
        const options = [1, 2, 3, 4, 6, 8, 12].filter((x) => x !== w && total % x === 0)
        const w2 = r.pick(options)
        return {
          q: T(`${w} friends paint a fence in ${h} hours. How long would ${w2} friend${w2 === 1 ? '' : 's'} take at the same pace?`, `${w} Freunde streichen einen Zaun in ${h} Stunden. Wie lange ${w2 === 1 ? 'bräuchte 1 Person' : `bräuchten ${w2} Freunde`} im selben Tempo?`),
          answer: total / w2,
          tol: 0.05,
          unit: HOURS(),
          show: `${num(total / w2)} h`,
          steps: [T(`Total work: ${w} × ${h} = ${total} person-hours`, `Gesamtarbeit: ${w} × ${h} = ${total} Personenstunden`), `${total} ÷ ${w2} = ${num(total / w2)} h`],
        }
      }
      const scale = r.pick([25000, 50000])
      const cm = r.pick([2, 3, 4, 5, 6, 8, 12])
      const perCm = scale / 100000
      return {
        q: T(`On a 1:${num(scale)} hiking map, a path is ${cm} cm long. How many km is that?`, `Auf einer Wanderkarte im Maßstab 1:${num(scale)} ist ein Weg ${cm} cm lang. Wie viele km sind das?`),
        answer: cm * perCm,
        tol: 0.005,
        unit: 'km',
        show: `${num(cm * perCm)} km`,
        steps: [T(`1 cm on the map = ${num(scale)} cm = ${num(perCm)} km`, `1 cm auf der Karte = ${num(scale)} cm = ${num(perCm)} km`), `${cm} × ${num(perCm)} = ${num(cm * perCm)} km`],
      }
    },
  },
  {
    id: 'area',
    group: 'life',
    title: ['Area grows with the square', 'Fläche wächst im Quadrat'],
    rule: ['Twice as wide → 4 times the area. Compare pizzas by diameter².', 'Doppelt so breit → 4-fache Fläche. Pizzen nach Durchmesser² vergleichen.'],
    idea: [
      'Area is length × length. Make every length 1.5 times as big and the area grows by 1.5 × 1.5 = 2.25. That’s why one large pizza often beats two small ones — and why paint and tiles run out faster than you think.',
      'Fläche ist Länge × Länge. Werden alle Längen 1,5-mal so groß, wächst die Fläche um 1,5 × 1,5 = 2,25. Deshalb schlägt eine große Pizza oft zwei kleine – und deshalb gehen Farbe und Fliesen schneller aus als gedacht.',
    ],
    example: {
      q: ['A 30 cm pizza vs a 20 cm one', 'Eine 30-cm-Pizza gegen eine 20-cm-Pizza'],
      steps: [
        ['30 ÷ 20 = 1.5', '30 ÷ 20 = 1,5'],
        ['1.5² = 2.25 times as much pizza', '1,5² = 2,25-mal so viel Pizza'],
      ],
    },
    trap: ['A 40 cm pizza isn’t twice a 20 cm one — it’s four times.', 'Eine 40-cm-Pizza ist nicht doppelt so groß wie eine 20-cm-Pizza – sondern viermal.'],
    use: ['Pizza deals, screen sizes, flat sizes, paint and flooring.', 'Pizza-Angebote, Bildschirmgrößen, Wohnungsgrößen, Farbe und Bodenbelag.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const [D, d] = r.pick([[30, 20], [40, 20], [36, 24], [45, 30], [32, 24], [40, 25], [28, 20]])
        const k = (D / d) ** 2
        return {
          q: T(`How many times as much pizza is a ${D} cm pizza as a ${d} cm one?`, `Wie viel mal so viel Pizza ist eine ${D}-cm-Pizza im Vergleich zu einer ${d}-cm-Pizza?`),
          answer: k,
          tol: 0.03,
          unit: '×',
          show: `${num(k)} ×`,
          steps: [`${D} ÷ ${d} = ${num(D / d, 3)}`, `${pow(num(D / d, 3), 2)} = ${num(k)}`],
        }
      }
      if (kind === 1) {
        const [Lg, S] = r.pick([[32, 22], [30, 20], [40, 28], [28, 20], [36, 26], [34, 24]])
        const big = Lg * Lg
        const two = 2 * S * S
        const one = T(`One ${Lg} cm pizza`, `Eine ${Lg}-cm-Pizza`)
        const pair = T(`Two ${S} cm pizzas`, `Zwei ${S}-cm-Pizzen`)
        const win = big > two ? 0 : 1
        return {
          q: T(`Same price: one ${Lg} cm pizza or two ${S} cm pizzas. Which is more pizza?`, `Gleicher Preis: eine ${Lg}-cm-Pizza oder zwei ${S}-cm-Pizzen. Was ist mehr Pizza?`),
          choices: [one, pair],
          answer: win,
          show: win === 0 ? one : pair,
          steps: [T(`Compare diameter²: ${pow(Lg, 2)} = ${num(big)}`, `Vergleiche Durchmesser²: ${pow(Lg, 2)} = ${num(big)}`), `2 × ${pow(S, 2)} = 2 × ${num(S * S)} = ${num(two)}`, T(`${win === 0 ? one : pair} — by ${pct((Math.abs(big - two) / Math.min(big, two)) * 100, 0)}`, `${win === 0 ? one : pair} – um ${pct((Math.abs(big - two) / Math.min(big, two)) * 100, 0)} mehr`)],
        }
      }
      const w = r.pick([3, 4, 5, 6])
      const h = 2.5
      const c = r.pick([5, 10])
      const A = w * h
      const litres = (A * 2) / c
      return {
        q: T(`You paint a wall ${w} m wide and ${num(h)} m high with two coats. One litre covers ${c} m². How many litres do you need?`, `Du streichst eine Wand, ${w} m breit und ${num(h)} m hoch, zweimal. Ein Liter reicht für ${c} m². Wie viele Liter brauchst du?`),
        answer: litres,
        tol: 0.05,
        unit: 'L',
        show: `${num(litres)} L`,
        steps: [T(`Area: ${w} × ${num(h)} = ${num(A)} m²`, `Fläche: ${w} × ${num(h)} = ${num(A)} m²`), T(`Two coats: ${num(2 * A)} m²`, `Zwei Schichten: ${num(2 * A)} m²`), `${num(2 * A)} ÷ ${c} = ${num(litres)} L`],
      }
    },
  },
  {
    id: 'big-numbers',
    group: 'life',
    title: ['A feel for big numbers', 'Ein Gefühl für große Zahlen'],
    rule: ['A day = 86,400 s. A million seconds ≈ 11.5 days, a billion ≈ 32 years.', 'Ein Tag = 86.400 s. Eine Million Sekunden ≈ 11,5 Tage, eine Milliarde ≈ 32 Jahre.'],
    idea: [
      '“Million” and “billion” sound alike but are a thousand times apart. Turn big numbers into something you can picture — days, years, euros per person — and headlines suddenly make sense. Austria has about 9 million people.',
      '„Million“ und „Milliarde“ klingen ähnlich, liegen aber tausendfach auseinander. Rechne große Zahlen in etwas um, das du dir vorstellen kannst – Tage, Jahre, Euro pro Person –, dann ergeben Schlagzeilen plötzlich Sinn. Österreich hat rund 9 Millionen Einwohner.',
    ],
    example: {
      q: ['€450 million spread over Austria', '450 Millionen Euro auf ganz Österreich verteilt'],
      steps: [
        ['450 million ÷ 9 million = 50', '450 Millionen ÷ 9 Millionen = 50'],
        ['About €50 per person', 'Etwa € 50 pro Kopf'],
      ],
    },
    trap: ['English “billion” is German “Milliarde” (10⁹), not “Billion” (10¹²).', 'Englisch „billion“ ist deutsch „Milliarde“ (10⁹), nicht „Billion“ (10¹²).'],
    use: ['The news, budgets, “how long would it take to…”, your own life.', 'Nachrichten, Budgets, „wie lange würde es dauern…“, das eigene Leben.'],
    gen(r) {
      const kind = r.int(0, 3)
      if (kind === 0) {
        const X = r.pick([90, 180, 270, 450, 900, 1800, 2700, 4500])
        return {
          q: T(`The state spends €${num(X)} million on a project. Austria has about 9 million people. How much is that per person?`, `Der Staat gibt ${num(X)} Millionen Euro für ein Projekt aus. Österreich hat rund 9 Millionen Einwohner. Wie viel ist das pro Kopf?`),
          answer: X / 9,
          tol: 0.5,
          unit: EURO(),
          show: eur(X / 9),
          steps: [T(`${num(X)} million ÷ 9 million = ${num(X)} ÷ 9`, `${num(X)} Millionen ÷ 9 Millionen = ${num(X)} ÷ 9`), `= ${eur(X / 9)}`],
        }
      }
      if (kind === 1) {
        const k = r.pick([1, 2, 5, 10])
        const days = (k * 1e6) / 86400
        return {
          q: T(`About how many days is ${k} million seconds?`, `Wie viele Tage sind ungefähr ${k === 1 ? 'eine Million' : `${k} Millionen`} Sekunden?`),
          answer: days,
          tol: days * 0.05,
          unit: T('days', 'Tage'),
          show: T(`≈ ${num(days, 1)} days`, `≈ ${num(days, 1)} Tage`),
          steps: [T('A day has 24 × 60 × 60 = 86,400 seconds', 'Ein Tag hat 24 × 60 × 60 = 86.400 Sekunden'), `${num(k * 1e6)} ÷ ${num(86400)} ≈ ${num(days, 1)}`, T('Quick guess: call a day 100,000 s, then add a bit', 'Schnelle Schätzung: einen Tag als 100.000 s rechnen, dann etwas dazugeben')],
        }
      }
      if (kind === 2) {
        const y = r.pick([15, 16, 18, 20, 50, 80])
        const days = Math.round(y * 365.25)
        return {
          q: T(`About how many days old is someone who just turned ${y}?`, `Wie viele Tage alt ist ungefähr jemand, der gerade ${y} geworden ist?`),
          answer: days,
          tol: days * 0.01,
          unit: T('days', 'Tage'),
          show: T(`≈ ${num(days)} days`, `≈ ${num(days)} Tage`),
          steps: [`${y} × 365 = ${num(y * 365)}`, T(`plus about ${Math.round(y / 4)} leap days ≈ ${num(days)}`, `plus etwa ${Math.round(y / 4)} Schalttage ≈ ${num(days)}`)],
        }
      }
      const s = r.pick([100, 200, 500, 1000])
      const years = 1e6 / (12 * s)
      return {
        q: T(`You put ${eur(s)} under your mattress every month. In about how many years do you have €1 million?`, `Du legst jeden Monat ${eur(s)} unter die Matratze. In etwa wie vielen Jahren hast du eine Million Euro?`),
        answer: years,
        tol: years * 0.04,
        unit: YEARS(),
        show: T(`≈ ${num(years, 0)} years`, `≈ ${num(years, 0)} Jahre`),
        steps: [T(`A year: 12 × ${eur(s)} = ${eur(12 * s)}`, `Pro Jahr: 12 × ${eur(s)} = ${eur(12 * s)}`), `${num(1e6)} ÷ ${num(12 * s)} ≈ ${num(years, 0)}`, T('Without interest it takes a lifetime — see the rule of 72', 'Ohne Zinsen dauert das ein Leben lang – siehe 72er-Regel')],
      }
    },
  },
]

// Two tracks share one engine: olympiad problem-solving (first) and everyday maths
export const GROUPS = [...OLY_GROUPS.map((g) => ({ ...g, track: 'olympiad' })), ...EVERYDAY_GROUPS.map((g) => ({ ...g, track: 'everyday' }))]
export const SKILLS = [...OLYMPIAD.map((s) => ({ ...s, track: 'olympiad' })), ...EVERYDAY.map((s) => ({ ...s, track: 'everyday' }))]
export const SKILLS_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]))
export const GROUPS_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g]))

// Where a beginner starts: the skills that pay off most often, first
export const OLY_PATH = ['o-squares-mod', 'o-true-false', 'o-amgm', 'o-angles', 'o-pigeonhole', 'o-fermat', 'o-first-move', 'o-vieta', 'o-cyclic', 'o-incl-excl', 'o-divisors', 'o-square', 'o-power', 'o-stars', 'o-last-digit', 'o-sums', 'o-triangle', 'o-choose', 'o-legendre', 'o-gcd', 'o-paths', 'o-mod9', 'o-tri-ineq']
export const PATH = ['percent-of', 'round-fix', 'split-bill', 'better-deal', 'per-year', 'backwards', 'clock', 'stacked', 'receipt', 'expected', 'borrowing', 'rule-72', 'change', 'trip-cost', 'scale', 'positive-test', 'median', 'speed', 'growth', 'headlines', 'at-least-once', 'area', 'split', 'fives', 'big-numbers']
