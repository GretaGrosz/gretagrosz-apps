// Mini-Spiele für Loopy & Co. – reine Logik ohne React (läuft auch in Node, siehe Tests).
//
//   makeMiniGame(kind, { lang, year, topicIds, seed?, exclude?, cards? }) → Spielobjekt oder null
//
//   kind: 'change' (Theke: Rückgeld geben) · 'calc' (Steg: kurze BW-Rechnung) ·
//         'sort' (Lager: 6 Kärtchen in 2 Körbe) · 'match' (Post/Aquarium: 4 Begriffe ↔ Erklärungen)
//   lang: 'de' | 'en' | 'hu'   year: 1 | 2 | 3   topicIds: Themen des gewählten Lernstoffs (leer = ganzer Jahrgang)
//   seed:    optional, für wiederholbare Spiele (Tests)
//   exclude: optional, Liste/Set von game.key, die heute schon kamen (werden nach Möglichkeit vermieden)
//   cards:   optional, Karteikarten [{ term, erklaerung, topicId }] (z. B. aus cardsOfTopic) –
//            kurze Karten (≤ 70 Zeichen) kommen zusätzlich in den Topf für 'match'
//
// Jedes Spielobjekt: { kind, key, title, prompt, topicIds, summary, …Daten }. summary = eine Zeile für
// die Liste "Heute gelernt". Auswerten: scoreMiniGame(game, answer) → { ok, mistakes, … }.
//
// Inhalte: österreichische BW (USt 20 %, UGB, Firmenbuch, OG/KG/GmbH/AG), passend zu src/data/curriculum.js.

import { jahrgaenge } from '../data/curriculum.js'

export const MINI_KINDS = ['change', 'calc', 'sort', 'match']
// Welche Station welches Mini-Spiel zeigt (das Aquarium nutzt ebenfalls 'match')
export const MINI_OF_STATION = { counter: 'change', dock: 'calc', store: 'sort', mail: 'match' }

// ---------- Hilfen ----------
const TOPIC_YEAR = {}
for (const j of jahrgaenge) for (const k of j.kapitel) for (const t of k.topicIds) TOPIC_YEAR[t] = j.id
const yearsOf = (topics) => [...new Set(topics.map((t) => TOPIC_YEAR[t]).filter(Boolean))]

function makeRng(seed) {
  if (seed === undefined || seed === null) return Math.random
  let a = typeof seed === 'number' ? seed >>> 0 : [...String(seed)].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7)
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pick = (rng, list) => list[Math.floor(rng() * list.length)]
const int = (rng, a, b) => a + Math.floor(rng() * (b - a + 1))
function shuffle(rng, list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const L = (lang, obj) => obj[lang] ?? obj.de
const r2 = (x) => Math.round(x * 100) / 100
const asSet = (x) => (x instanceof Set ? x : new Set(x ?? []))

// ---------- Zahlen und Euro je Sprache ----------
// de: 1.234,50 €   en: €1,234.50   hu: 1234,50 € / 12 345,50 €
export function formatNumber(x, lang = 'de', dec = 0) {
  const neg = x < 0
  const [i, f] = Math.abs(x).toFixed(dec).split('.')
  let whole = i
  if (lang === 'en') whole = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  else if (lang === 'hu') whole = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : i
  else whole = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '−' : '') + whole + (f ? (lang === 'en' ? '.' : ',') + f : '')
}
// Zahl mit so vielen Nachkommastellen wie nötig (höchstens max)
export function formatSmart(x, lang = 'de', max = 2) {
  for (let d = 0; d <= max; d++) if (Math.abs(x - Number(x.toFixed(d))) < 1e-9) return formatNumber(x, lang, d)
  return formatNumber(x, lang, max)
}
/** Euro-Betrag. cents=true: x in Cent. whole: ganze Beträge ohne ",00" (z. B. Geldscheine) */
export function formatEuro(x, lang = 'de', { cents = false, whole = false } = {}) {
  const v = cents ? x / 100 : x
  const dec = whole && Number.isInteger(r2(v)) ? 0 : Math.abs(v) >= 10000 && Number.isInteger(r2(v)) ? 0 : 2
  const n = formatNumber(v, lang, dec)
  return lang === 'en' ? (n.startsWith('−') ? '−€' + n.slice(1) : '€' + n) : `${n} €`
}
export function formatPercent(x, lang = 'de', max = 2) {
  const n = formatSmart(x, lang, max)
  return lang === 'de' ? `${n} %` : `${n}%`
}

// ---------- Mini-Spiel bauen ----------
export function makeMiniGame(kind, opts = {}) {
  const ctx = {
    lang: ['de', 'en', 'hu'].includes(opts.lang) ? opts.lang : 'de',
    year: Number(opts.year) || null,
    topicIds: Array.isArray(opts.topicIds) ? opts.topicIds.filter(Boolean) : [],
    rng: makeRng(opts.seed),
    exclude: asSet(opts.exclude),
    cards: Array.isArray(opts.cards) ? opts.cards : [],
  }
  try {
    if (kind === 'change') return makeChange(ctx)
    if (kind === 'calc') return makeCalc(ctx)
    if (kind === 'sort') return makeSort(ctx)
    if (kind === 'match') return makeMatch(ctx)
  } catch (e) {
    if (typeof console !== 'undefined') console.warn('makeMiniGame', kind, e)
  }
  return null
}

// Aus einer Liste von Inhalten (mit .topics) die zum Lernstoff passenden wählen:
// 1. Thema im Lernstoff · 2. gleicher Jahrgang · 3. alles. Heute schon gespielte (exclude) nach hinten.
function choosePool(ctx, list, keyOf) {
  const { topicIds, year, exclude } = ctx
  const byTopic = topicIds.length ? list.filter((x) => x.topics.some((t) => topicIds.includes(t))) : []
  const byYear = year ? list.filter((x) => yearsOf(x.topics).includes(year)) : []
  const tiers = [byTopic, byYear, list].filter((t) => t.length)
  for (const tier of tiers) {
    const fresh = tier.filter((x) => !exclude.has(keyOf(x)))
    if (fresh.length) return fresh
  }
  return tiers[0] ?? []
}

// =====================================================================
// 1) RÜCKGELD (Theke)
// =====================================================================
const CANDY_NAMES = {
  lolly: { de: ['Lolli', 'Lollis'], en: ['lolly', 'lollies'], hu: ['nyalóka', 'nyalóka'], prices: [40, 50, 60, 80, 90, 120] },
  drops: { de: ['Zitronendrops', 'Zitronendrops'], en: ['lemon drop', 'lemon drops'], hu: ['citromos cukorka', 'citromos cukorka'], prices: [30, 50, 70, 110, 150] },
  gummy: { de: ['Sackerl Gummibärchen', 'Sackerl Gummibärchen'], en: ['bag of gummy bears', 'bags of gummy bears'], hu: ['zacskó gumimaci', 'zacskó gumimaci'], prices: [120, 150, 180, 220, 250] },
  choco: { de: ['Schokotafel', 'Schokotafeln'], en: ['chocolate bar', 'chocolate bars'], hu: ['tábla csoki', 'tábla csoki'], prices: [150, 180, 220, 240, 280, 320] },
}
export const DENOMS = [500, 200, 100, 50, 20, 10]
export function denomLabel(c, lang) {
  if (c >= 100) return formatEuro(c, lang, { cents: true, whole: true })
  return lang === 'en' ? `${c}c` : `${c} c`
}
// Wenigste Münzen/Scheine (der Euro ist "gierig" lösbar)
export function fewestCoins(cents) {
  const out = []
  let rest = cents
  for (const d of DENOMS) while (rest >= d) {
    out.push(d)
    rest -= d
  }
  return rest === 0 ? out : null
}

function makeChange(ctx) {
  const { rng, lang } = ctx
  const e = (c, whole) => formatEuro(c, lang, { cents: true, whole })
  for (let attempt = 0; attempt < 60; attempt++) {
    const variant = pick(rng, ['plain', 'plain', 'combo', 'combo', 'rabatt'])
    const ids = shuffle(rng, Object.keys(CANDY_NAMES)).slice(0, variant === 'combo' ? 2 : 1)
    const lines = ids.map((id) => {
      const qty = variant === 'combo' ? int(rng, 1, 3) : int(rng, 2, 5)
      const unit = pick(rng, CANDY_NAMES[id].prices)
      return { candy: id, qty, unitCents: unit, sumCents: qty * unit }
    })
    const subtotal = lines.reduce((s, l) => s + l.sumCents, 0)
    let discountPct = 0
    if (variant === 'rabatt') {
      if (subtotal % 100 !== 0) continue // 10 % muss glatte 10 Cent ergeben
      discountPct = 10
    }
    const discount = (subtotal * discountPct) / 100
    const total = subtotal - discount
    if (total < 100 || total > 1800) continue
    const notes = [500, 1000, 2000, 5000].filter((n) => n > total)
    let paid = notes[0]
    // zu wenig Rückgeld ist langweilig → dann mit dem nächstgrößeren Schein
    if (notes[1] && notes[1] - total <= 1500 && (paid - total < 50 || rng() < 0.3)) paid = notes[1]
    const change = paid - total
    if (change <= 0 || change > 1990 || change % 10 !== 0) continue

    const name = (l) => CANDY_NAMES[l.candy][lang][l.qty === 1 ? 0 : 1]
    lines.forEach((l) => {
      l.label =
        lang === 'en'
          ? `${l.qty} ${name(l)} ${l.qty === 1 ? 'for' : 'at'} ${e(l.unitCents)}${l.qty === 1 ? '' : ' each'}`
          : lang === 'hu'
            ? `${l.qty} ${name(l)}, ${l.qty === 1 ? 'ára' : 'darabja'} ${e(l.unitCents)}`
            : `${l.qty} ${name(l)} à ${e(l.unitCents)}`
    })
    const buys = lines.map((l) => l.label).join(lang === 'en' ? ' and ' : lang === 'hu' ? ' és ' : ' und ')
    const paidTxt = e(paid, true)
    const prompt = L(lang, {
      de: `Kauft ${buys}${discountPct ? ' – mit 10 % Stammkunden-Rabatt' : ''}. Bezahlt mit ${paidTxt}. Gib das Rückgeld!`,
      en: `Buys ${buys}${discountPct ? ' – with a 10% regular-customer discount' : ''}. Pays with ${paidTxt}. Give the change!`,
      hu: `Vásárol: ${buys}${discountPct ? ' – 10% törzsvásárlói kedvezménnyel' : ''}. Fizet: ${paidTxt}. Add vissza a visszajárót!`,
    })
    const mult = (l) => `${l.qty} × ${e(l.unitCents)} = ${e(l.sumCents)}`
    const steps = [...lines.map(mult)]
    if (lines.length > 1) steps.push(`${lines.map((l) => e(l.sumCents)).join(' + ')} = ${e(subtotal)}`)
    if (discountPct)
      steps.push(
        L(lang, {
          de: `10 % Rabatt: ${e(subtotal)} − ${e(discount)} = ${e(total)}`,
          en: `10% discount: ${e(subtotal)} − ${e(discount)} = ${e(total)}`,
          hu: `10% kedvezmény: ${e(subtotal)} − ${e(discount)} = ${e(total)}`,
        }),
      )
    steps.push(
      L(lang, {
        de: `Rückgeld: ${paidTxt} − ${e(total)} = ${e(change)}`,
        en: `Change: ${paidTxt} − ${e(total)} = ${e(change)}`,
        hu: `Visszajáró: ${paidTxt} − ${e(total)} = ${e(change)}`,
      }),
    )
    const summary = L(lang, {
      de: `Rückgeld: ${paidTxt} − ${e(total)} = ${e(change)}`,
      en: `Change: ${paidTxt} − ${e(total)} = ${e(change)}`,
      hu: `Visszajáró: ${paidTxt} − ${e(total)} = ${e(change)}`,
    })
    return {
      kind: 'change',
      key: `change:${variant}`,
      title: L(lang, { de: 'Rückgeld geben', en: 'Give change', hu: 'Visszajáró' }),
      prompt,
      topicIds: ['zahlungsformen-1jg'],
      lines,
      subtotalCents: subtotal,
      discountPct,
      discountCents: discount,
      totalCents: total,
      paidCents: paid,
      changeCents: change,
      denoms: DENOMS.map((c) => ({ cents: c, label: denomLabel(c, lang), type: c >= 500 ? 'note' : 'coin' })),
      bestCoins: fewestCoins(change),
      steps,
      summary,
    }
  }
  return null
}

// =====================================================================
// 2) RECHNEN (Steg)
// =====================================================================
// Jeder Rechner: { id, topics, core?, make(rng, lang) → { prompt, correct, wrong[], fmt, steps[], summary, title? } }
const GOODS = {
  de: ['Kakao', 'Zucker', 'Verpackungen', 'Gummibärchen', 'Lollistiele', 'Schokolade'],
  en: ['cocoa', 'sugar', 'packaging', 'gummy bears', 'lolly sticks', 'chocolate'],
  hu: ['kakaó', 'cukor', 'csomagolóanyag', 'gumimaci', 'nyalókapálcika', 'csokoládé'],
}
const goodsOf = (rng, lang) => {
  const i = Math.floor(rng() * GOODS.de.length)
  return L(lang, { de: GOODS.de[i], en: GOODS.en[i], hu: GOODS.hu[i] })
}

const CALCS = [
  {
    id: 'rabatt',
    core: true,
    topics: ['bestandteile-kaufvertrag', 'schriftverkehr-kaufvertrag', 'beschaffungsmarketing'],
    make(rng, lang) {
      const Lp = pick(rng, [120, 160, 200, 240, 250, 300, 360, 400, 450, 480, 500, 600, 800, 1200])
      const p = pick(rng, [5, 10, 15, 20, 25])
      const R = r2((Lp * p) / 100)
      const Z = r2(Lp - R)
      const E = (x) => formatEuro(x, lang)
      const P = formatPercent(p, lang)
      const g = goodsOf(rng, lang)
      return {
        title: L(lang, { de: 'Rabatt', en: 'Discount', hu: 'Rabatt' }),
        prompt: L(lang, {
          de: `Bestellung: ${g}, Listenpreis ${E(Lp)}. Der Lieferant gibt ${P} Rabatt. Was kostet die Bestellung nach Abzug des Rabatts?`,
          en: `Order: ${g}, list price ${E(Lp)}. The supplier gives a ${P} discount. What does the order cost after the discount?`,
          hu: `Rendelés: ${g}, listaár ${E(Lp)}. A szállító ${P} rabattot ad. Mennyibe kerül a rendelés a rabatt levonása után?`,
        }),
        correct: Z,
        wrong: [R, r2(Lp + R), Lp - p, r2(Lp - R / 10)],
        fmt: E,
        steps: [
          L(lang, { de: `Rabatt: ${P} von ${E(Lp)} = ${E(R)}`, en: `Discount: ${P} of ${E(Lp)} = ${E(R)}`, hu: `Rabatt: ${E(Lp)} ${P}-a = ${E(R)}` }),
          `${E(Lp)} − ${E(R)} = ${E(Z)}`,
        ],
        summary: L(lang, {
          de: `Rabatt: ${P} von ${E(Lp)} = ${E(R)} → ${E(Z)}`,
          en: `Discount: ${P} of ${E(Lp)} = ${E(R)} → ${E(Z)}`,
          hu: `Rabatt: ${E(Lp)} ${P}-a = ${E(R)} → ${E(Z)}`,
        }),
      }
    },
  },
  {
    id: 'skonto',
    core: true,
    topics: ['bestandteile-kaufvertrag', 'schriftverkehr-kaufvertrag', 'beschaffungsmarketing', 'finanzmanagement'],
    make(rng, lang) {
      const R = pick(rng, [200, 250, 300, 400, 450, 500, 600, 750, 800, 1000, 1200, 1500])
      const s = pick(rng, [2, 3])
      const k = pick(rng, [8, 10, 14])
      const variant = pick(rng, ['pay', 'pay', 'amount', 'late'])
      const d = variant === 'late' ? int(rng, k + 2, 28) : int(rng, 3, k)
      const S = r2((R * s) / 100)
      const P = r2(R - S)
      const E = (x) => formatEuro(x, lang)
      const sp = formatPercent(s, lang)
      const terms = L(lang, {
        de: `Zahlungsbedingung: ${k} Tage ${sp} Skonto, 30 Tage netto.`,
        en: `Terms: ${sp} cash discount within ${k} days, net 30 days.`,
        hu: `Fizetési feltétel: ${k} napon belül ${sp} skontó, 30 nap nettó.`,
      })
      const base = {
        title: L(lang, { de: 'Skonto', en: 'Cash discount', hu: 'Skontó' }),
        fmt: E,
        summary: L(lang, {
          de: `Skonto: ${sp} von ${E(R)} = ${E(S)} (nur innerhalb von ${k} Tagen)`,
          en: `Cash discount: ${sp} of ${E(R)} = ${E(S)} (only within ${k} days)`,
          hu: `Skontó: ${E(R)} ${sp}-a = ${E(S)} (csak ${k} napon belül)`,
        }),
      }
      const skStep = L(lang, { de: `Skonto: ${sp} von ${E(R)} = ${E(S)}`, en: `Discount: ${sp} of ${E(R)} = ${E(S)}`, hu: `Skontó: ${E(R)} ${sp}-a = ${E(S)}` })
      if (variant === 'amount')
        return {
          ...base,
          prompt: L(lang, {
            de: `Rechnung über ${E(R)}. ${terms} Wie hoch ist der Skonto, wenn Loopy innerhalb von ${k} Tagen zahlt?`,
            en: `Invoice for ${E(R)}. ${terms} How big is the cash discount if Loopy pays within ${k} days?`,
            hu: `Számla: ${E(R)}. ${terms} Mennyi a skontó, ha Loopy ${k} napon belül fizet?`,
          }),
          correct: S,
          wrong: [r2(S * 10), P, r2(S / 10), s],
          steps: [skStep],
        }
      if (variant === 'late')
        return {
          ...base,
          prompt: L(lang, {
            de: `Rechnung über ${E(R)}. ${terms} Loopy zahlt erst nach ${d} Tagen. Wie viel muss Loopy überweisen?`,
            en: `Invoice for ${E(R)}. ${terms} Loopy pays after ${d} days. How much must Loopy transfer?`,
            hu: `Számla: ${E(R)}. ${terms} Loopy csak ${d} nap után fizet. Mennyit kell átutalnia?`,
          }),
          correct: R,
          wrong: [P, r2(R + S), S, R - s],
          steps: [
            L(lang, {
              de: `${d} Tage > ${k} Tage → kein Skonto`,
              en: `${d} days > ${k} days → no cash discount`,
              hu: `${d} nap > ${k} nap → nincs skontó`,
            }),
            L(lang, { de: `Zahlbetrag = ${E(R)}`, en: `Amount to pay = ${E(R)}`, hu: `Fizetendő = ${E(R)}` }),
          ],
        }
      return {
        ...base,
        prompt: L(lang, {
          de: `Rechnung über ${E(R)}. ${terms} Loopy zahlt nach ${d} Tagen. Wie viel überweist Loopy?`,
          en: `Invoice for ${E(R)}. ${terms} Loopy pays after ${d} days. How much does Loopy transfer?`,
          hu: `Számla: ${E(R)}. ${terms} Loopy ${d} nap után fizet. Mennyit utal át?`,
        }),
        correct: P,
        wrong: [R, S, R - s, r2(R + S)],
        steps: [
          L(lang, {
            de: `${d} Tage ≤ ${k} Tage → Skonto darf abgezogen werden`,
            en: `${d} days ≤ ${k} days → discount may be deducted`,
            hu: `${d} nap ≤ ${k} nap → levonható a skontó`,
          }),
          skStep,
          `${E(R)} − ${E(S)} = ${E(P)}`,
        ],
      }
    },
  },
  {
    id: 'ust-brutto',
    core: true,
    topics: ['bestandteile-kaufvertrag', 'schriftverkehr-kaufvertrag'],
    make(rng, lang) {
      const N = pick(rng, [50, 80, 120, 150, 200, 250, 300, 350, 450, 600, 750, 900])
      const U = r2(N * 0.2)
      const B = r2(N * 1.2)
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Umsatzsteuer', en: 'VAT', hu: 'Áfa' }),
        prompt: L(lang, {
          de: `Ein Karton Lollis kostet ${E(N)} netto. Wie viel kostet er inklusive 20 % Umsatzsteuer (brutto)?`,
          en: `A box of lollies costs ${E(N)} net. What does it cost including 20% VAT (gross)?`,
          hu: `Egy doboz nyalóka nettó ára ${E(N)}. Mennyi a bruttó ár 20% áfával?`,
        }),
        correct: B,
        wrong: [r2(N * 0.8), N + 20, r2(N / 1.2), U],
        fmt: E,
        steps: [
          L(lang, { de: `USt: 20 % von ${E(N)} = ${E(U)}`, en: `VAT: 20% of ${E(N)} = ${E(U)}`, hu: `Áfa: ${E(N)} 20%-a = ${E(U)}` }),
          `${E(N)} + ${E(U)} = ${E(B)}  (= ${formatSmart(N, lang)} · 1${lang === 'en' ? '.' : ','}2)`,
        ],
        summary: L(lang, {
          de: `Netto ${E(N)} + 20 % USt = brutto ${E(B)}`,
          en: `Net ${E(N)} + 20% VAT = gross ${E(B)}`,
          hu: `Nettó ${E(N)} + 20% áfa = bruttó ${E(B)}`,
        }),
      }
    },
  },
  {
    id: 'ust-netto',
    core: true,
    topics: ['bestandteile-kaufvertrag', 'schriftverkehr-kaufvertrag'],
    make(rng, lang) {
      const B = pick(rng, [60, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1200])
      const N = r2(B / 1.2)
      const E = (x) => formatEuro(x, lang)
      const c = lang === 'en' ? '.' : ','
      return {
        title: L(lang, { de: 'Umsatzsteuer', en: 'VAT', hu: 'Áfa' }),
        prompt: L(lang, {
          de: `Die Rechnung zeigt ${E(B)} brutto (inkl. 20 % USt). Wie hoch ist der Nettobetrag?`,
          en: `The invoice shows ${E(B)} gross (incl. 20% VAT). What is the net amount?`,
          hu: `A számlán ${E(B)} bruttó összeg áll (20% áfával). Mennyi a nettó összeg?`,
        }),
        correct: N,
        wrong: [r2(B * 0.8), r2(B * 1.2), B - 20, r2(B / 6)],
        fmt: E,
        steps: [
          L(lang, { de: 'Brutto = 120 % des Nettobetrags', en: 'Gross = 120% of the net amount', hu: 'Bruttó = a nettó 120%-a' }),
          `${E(B)} : 1${c}2 = ${E(N)}`,
          L(lang, {
            de: `Nicht ${E(B)} − 20 % (= ${E(r2(B * 0.8))}) – die 20 % gelten vom Netto!`,
            en: `Not ${E(B)} − 20% (= ${E(r2(B * 0.8))}) – the 20% is of the net amount!`,
            hu: `Nem ${E(B)} − 20% (= ${E(r2(B * 0.8))}) – a 20% a nettóra vonatkozik!`,
          }),
        ],
        summary: L(lang, {
          de: `Brutto ${E(B)} : 1,2 = netto ${E(N)}`,
          en: `Gross ${E(B)} ÷ 1.2 = net ${E(N)}`,
          hu: `Bruttó ${E(B)} : 1,2 = nettó ${E(N)}`,
        }),
      }
    },
  },
  {
    id: 'ust-betrag',
    core: true,
    topics: ['bestandteile-kaufvertrag', 'schriftverkehr-kaufvertrag'],
    make(rng, lang) {
      const B = pick(rng, [60, 120, 180, 240, 300, 360, 480, 600, 720, 900, 1200])
      const U = r2(B / 6)
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Umsatzsteuer', en: 'VAT', hu: 'Áfa' }),
        prompt: L(lang, {
          de: `Wie viel Umsatzsteuer (20 %) steckt in einem Bruttobetrag von ${E(B)}?`,
          en: `How much VAT (20%) is contained in a gross amount of ${E(B)}?`,
          hu: `Mennyi áfa (20%) van egy ${E(B)} bruttó összegben?`,
        }),
        correct: U,
        wrong: [r2(B * 0.2), r2(B / 1.2), r2(B / 4)],
        fmt: E,
        steps: [
          L(lang, {
            de: 'Brutto = 120 % → USt = 20/120 = 1/6 des Bruttobetrags',
            en: 'Gross = 120% → VAT = 20/120 = 1/6 of the gross amount',
            hu: 'Bruttó = 120% → áfa = 20/120 = a bruttó 1/6-a',
          }),
          `${E(B)} : 6 = ${E(U)}`,
        ],
        summary: L(lang, {
          de: `USt in ${E(B)} brutto = ${E(B)} : 6 = ${E(U)}`,
          en: `VAT in ${E(B)} gross = ${E(B)} ÷ 6 = ${E(U)}`,
          hu: `Áfa ${E(B)} bruttóban = ${E(B)} : 6 = ${E(U)}`,
        }),
      }
    },
  },
  {
    id: 'bezug',
    core: true,
    topics: ['bestandteile-kaufvertrag'],
    make(rng, lang) {
      const Lp = pick(rng, [400, 500, 600, 800, 1000, 1200, 1500, 2000])
      const r = pick(rng, [10, 20, 25])
      const s = pick(rng, [2, 3])
      const BK = pick(rng, [15, 20, 25, 30, 40, 50])
      const R = r2((Lp * r) / 100)
      const Z = r2(Lp - R)
      const S = r2((Z * s) / 100)
      const K = r2(Z - S)
      const Ep = r2(K + BK)
      const E = (x) => formatEuro(x, lang)
      const rp = formatPercent(r, lang)
      const sp = formatPercent(s, lang)
      return {
        title: L(lang, { de: 'Bezugskalkulation', en: 'Purchase calculation', hu: 'Beszerzési kalkuláció' }),
        prompt: L(lang, {
          de: `Listenpreis ${E(Lp)}, ${rp} Rabatt, ${sp} Skonto, Bezugskosten ${E(BK)}. Wie hoch ist der Einstandspreis?`,
          en: `List price ${E(Lp)}, ${rp} discount, ${sp} cash discount, delivery costs ${E(BK)}. What is the landed cost?`,
          hu: `Listaár ${E(Lp)}, ${rp} rabatt, ${sp} skontó, beszerzési költségek ${E(BK)}. Mennyi a beszerzési ár (Einstandspreis)?`,
        }),
        correct: Ep,
        wrong: [r2(Z + BK), K, r2(Z - (Lp * s) / 100 + BK), r2(K - BK), r2((Lp * (100 - r - s)) / 100 + BK)],
        fmt: E,
        steps: L(lang, {
          de: [`Listenpreis ${E(Lp)}`, `− ${rp} Rabatt ${E(R)} = Zieleinkaufspreis ${E(Z)}`, `− ${sp} Skonto ${E(S)} = Kassaeinkaufspreis ${E(K)}`, `+ Bezugskosten ${E(BK)} = Einstandspreis ${E(Ep)}`],
          en: [`List price ${E(Lp)}`, `− ${rp} discount ${E(R)} = price after discount ${E(Z)}`, `− ${sp} cash discount ${E(S)} = cash price ${E(K)}`, `+ delivery costs ${E(BK)} = landed cost ${E(Ep)}`],
          hu: [`Listaár ${E(Lp)}`, `− ${rp} rabatt ${E(R)} = célbeszerzési ár ${E(Z)}`, `− ${sp} skontó ${E(S)} = készpénzes beszerzési ár ${E(K)}`, `+ beszerzési költségek ${E(BK)} = beszerzési ár ${E(Ep)}`],
        }),
        summary: L(lang, {
          de: `Einstandspreis: ${E(Lp)} − Rabatt − Skonto + Bezugskosten = ${E(Ep)}`,
          en: `Landed cost: ${E(Lp)} − discount − cash discount + delivery = ${E(Ep)}`,
          hu: `Beszerzési ár: ${E(Lp)} − rabatt − skontó + költségek = ${E(Ep)}`,
        }),
      }
    },
  },
  {
    id: 'skonto-zins',
    topics: ['bestandteile-kaufvertrag', 'finanzmanagement'],
    make(rng, lang) {
      const combos = []
      for (const s of [2, 3]) for (const z of [30, 40, 45, 60]) for (const k of [8, 10, 12, 14, 15, 20]) if (z - k >= 15 && (s * 360) % (z - k) === 0) combos.push([s, z, k])
      const [s, z, k] = pick(rng, combos)
      const J = (s * 360) / (z - k)
      const P = (x) => formatPercent(x, lang, 1)
      const sp = formatPercent(s, lang)
      return {
        title: L(lang, { de: 'Skonto als Jahreszins', en: 'Cash discount as annual rate', hu: 'Skontó éves kamatlábként' }),
        prompt: L(lang, {
          de: `Bedingung: ${k} Tage ${sp} Skonto, ${z} Tage netto. Welchem Jahreszinssatz entspricht der Skonto?`,
          en: `Terms: ${sp} cash discount within ${k} days, net ${z} days. What annual interest rate does the discount equal?`,
          hu: `Feltétel: ${k} napon belül ${sp} skontó, ${z} nap nettó. Milyen éves kamatlábnak felel meg a skontó?`,
        }),
        correct: J,
        wrong: [r2((s * 360) / z), r2((s * 360) / k), s * 12, r2((s * 365) / (z - k))],
        fmt: P,
        steps: [
          L(lang, {
            de: 'Skonto % : (Zahlungsziel − Kassafrist) · 360',
            en: 'discount % ÷ (payment term − discount period) · 360',
            hu: 'skontó % : (fizetési határidő − skontóhatáridő) · 360',
          }),
          `${s} : (${z} − ${k}) · 360 = ${P(J)}`,
          L(lang, { de: '→ Skonto ausnützen lohnt sich fast immer!', en: '→ Taking the discount almost always pays off!', hu: '→ A skontót szinte mindig érdemes kihasználni!' }),
        ],
        summary: L(lang, {
          de: `Skonto-Jahreszins: ${s} : (${z} − ${k}) · 360 = ${P(J)}`,
          en: `Discount as annual rate: ${s} ÷ (${z} − ${k}) · 360 = ${P(J)}`,
          hu: `Skontó éves kamata: ${s} : (${z} − ${k}) · 360 = ${P(J)}`,
        }),
      }
    },
  },
  {
    id: 'verzugszinsen',
    topics: ['unzuverlaessige-kaeufer', 'finanzmanagement'],
    make(rng, lang) {
      const combos = []
      for (const K of [600, 900, 1200, 1500, 1800, 2400, 3000, 3600, 4800, 6000]) for (const p of [4, 6, 8, 9, 10, 12]) for (const T of [15, 30, 45, 60, 90, 120]) if ((K * p * T) % 360 === 0) combos.push([K, p, T])
      const [K, p, T] = pick(rng, combos)
      const Z = r2((K * p * T) / 36000)
      const E = (x) => formatEuro(x, lang)
      const pp = formatPercent(p, lang)
      return {
        title: L(lang, { de: 'Verzugszinsen', en: 'Default interest', hu: 'Késedelmi kamat' }),
        prompt: L(lang, {
          de: `Ein Kunde zahlt ${E(K)} um ${T} Tage zu spät. Vereinbart sind ${pp} Verzugszinsen pro Jahr. Wie viel Verzugszinsen fallen an?`,
          en: `A customer pays ${E(K)} ${T} days late. The agreed default interest is ${pp} per year. How much interest is due?`,
          hu: `Egy vevő ${E(K)} összeget ${T} nap késéssel fizet. A megállapodott késedelmi kamat évi ${pp}. Mennyi kamat jár?`,
        }),
        correct: Z,
        wrong: [r2((K * p) / 100), r2(Z * 10), r2((K * p * T) / 36500), r2(Z * 2)],
        fmt: E,
        steps: [
          L(lang, { de: 'Zinsen = Kapital · Zinssatz · Tage : 36.000', en: 'Interest = capital · rate · days ÷ 36,000', hu: 'Kamat = tőke · kamatláb · napok : 36\u00a0000' }),
          `${formatSmart(K, lang)} · ${p} · ${T} : ${formatNumber(36000, lang)} = ${E(Z)}`,
        ],
        summary: L(lang, {
          de: `Verzugszinsen: ${E(K)} · ${pp} · ${T} Tage / 360 = ${E(Z)}`,
          en: `Default interest: ${E(K)} · ${pp} · ${T} days / 360 = ${E(Z)}`,
          hu: `Késedelmi kamat: ${E(K)} · ${pp} · ${T} nap / 360 = ${E(Z)}`,
        }),
      }
    },
  },
  {
    id: 'lager-schnitt',
    topics: ['lager-transport-entsorgung', 'material-warenwirtschaft'],
    make(rng, lang) {
      const AB = pick(rng, [12, 16, 18, 20, 24, 30, 36, 40]) * 1000
      let EB = pick(rng, [14, 18, 20, 22, 26, 28, 32, 44]) * 1000
      if (EB === AB) EB += 2000
      const A = (AB + EB) / 2
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Ø Lagerbestand', en: 'Average stock', hu: 'Átlagos készlet' }),
        prompt: L(lang, {
          de: `Anfangsbestand ${E(AB)}, Endbestand ${E(EB)}. Wie hoch ist der durchschnittliche Lagerbestand?`,
          en: `Opening stock ${E(AB)}, closing stock ${E(EB)}. What is the average stock?`,
          hu: `Nyitókészlet ${E(AB)}, zárókészlet ${E(EB)}. Mennyi az átlagos készlet?`,
        }),
        correct: A,
        wrong: [AB + EB, AB + EB / 2, Math.abs(EB - AB), Math.abs(EB - AB) / 2],
        fmt: E,
        steps: [
          L(lang, { de: 'Ø Lagerbestand = (AB + EB) : 2', en: 'Average stock = (opening + closing) ÷ 2', hu: 'Átlagos készlet = (nyitó + záró) : 2' }),
          `(${E(AB)} + ${E(EB)}) : 2 = ${E(A)}`,
          L(lang, { de: 'Klammer nicht vergessen!', en: "Don't forget the brackets!", hu: 'Ne felejtsd el a zárójelet!' }),
        ],
        summary: L(lang, {
          de: `Ø Lagerbestand = (${E(AB)} + ${E(EB)}) : 2 = ${E(A)}`,
          en: `Average stock = (${E(AB)} + ${E(EB)}) ÷ 2 = ${E(A)}`,
          hu: `Átlagos készlet = (${E(AB)} + ${E(EB)}) : 2 = ${E(A)}`,
        }),
      }
    },
  },
  {
    id: 'lager-umschlag',
    topics: ['lager-transport-entsorgung', 'material-warenwirtschaft'],
    make(rng, lang) {
      const AB = pick(rng, [10, 12, 16, 20, 24]) * 1000
      const EB = pick(rng, [14, 18, 22, 26, 30]) * 1000
      const A = (AB + EB) / 2
      const k = pick(rng, [4, 5, 6, 8, 10])
      const WE = A * k
      const E = (x) => formatEuro(x, lang)
      const times = (x) => L(lang, { de: `${formatSmart(x, lang)}-mal`, en: `${formatSmart(x, lang)} times`, hu: `${formatSmart(x, lang)}-szor` })
      return {
        title: L(lang, { de: 'Umschlagshäufigkeit', en: 'Stock turnover', hu: 'Forgási sebesség' }),
        prompt: L(lang, {
          de: `Anfangsbestand ${E(AB)}, Endbestand ${E(EB)}, Wareneinsatz ${E(WE)}. Wie oft wird das Lager im Jahr umgeschlagen?`,
          en: `Opening stock ${E(AB)}, closing stock ${E(EB)}, cost of goods sold ${E(WE)}. How often is the stock turned over per year?`,
          hu: `Nyitókészlet ${E(AB)}, zárókészlet ${E(EB)}, árufelhasználás ${E(WE)}. Évente hányszor fordul meg a készlet?`,
        }),
        correct: k,
        wrong: [r2(WE / AB), r2(WE / EB), r2(WE / (AB + EB)), k * 2],
        fmt: times,
        steps: [
          L(lang, { de: `Ø Lagerbestand = (${E(AB)} + ${E(EB)}) : 2 = ${E(A)}`, en: `Average stock = (${E(AB)} + ${E(EB)}) ÷ 2 = ${E(A)}`, hu: `Átlagos készlet = (${E(AB)} + ${E(EB)}) : 2 = ${E(A)}` }),
          L(lang, {
            de: `Umschlagshäufigkeit = Wareneinsatz : Ø Lagerbestand = ${formatSmart(WE, lang)} : ${formatSmart(A, lang)} = ${k}`,
            en: `Turnover = cost of goods sold ÷ average stock = ${formatSmart(WE, lang)} ÷ ${formatSmart(A, lang)} = ${k}`,
            hu: `Forgási sebesség = árufelhasználás : átlagos készlet = ${formatSmart(WE, lang)} : ${formatSmart(A, lang)} = ${k}`,
          }),
        ],
        summary: L(lang, {
          de: `Umschlagshäufigkeit = Wareneinsatz : Ø Lagerbestand = ${k}`,
          en: `Stock turnover = cost of goods sold ÷ average stock = ${k}`,
          hu: `Forgási sebesség = árufelhasználás : átlagos készlet = ${k}`,
        }),
      }
    },
  },
  {
    id: 'lager-dauer',
    topics: ['lager-transport-entsorgung'],
    make(rng, lang) {
      const UH = pick(rng, [4, 5, 8, 10, 12])
      const D = Math.round((365 / UH) * 10) / 10
      const days = (x) => L(lang, { de: `${formatSmart(x, lang, 1)} Tage`, en: `${formatSmart(x, lang, 1)} days`, hu: `${formatSmart(x, lang, 1)} nap` })
      return {
        title: L(lang, { de: 'Umschlagsdauer', en: 'Days in stock', hu: 'Forgási idő' }),
        prompt: L(lang, {
          de: `Die Umschlagshäufigkeit beträgt ${UH}. Wie lange liegt die Ware durchschnittlich im Lager?`,
          en: `The stock turnover is ${UH}. How long do goods stay in stock on average?`,
          hu: `A forgási sebesség ${UH}. Átlagosan mennyi ideig van az áru raktáron?`,
        }),
        correct: D,
        wrong: [Math.round((360 / UH) * 10) / 10, Math.round((D / 2) * 10) / 10, UH * 30, Math.round((52 / UH) * 10) / 10, D * 2],
        fmt: days,
        steps: [
          L(lang, { de: 'Umschlagsdauer = 365 : Umschlagshäufigkeit', en: 'Days in stock = 365 ÷ turnover', hu: 'Forgási idő = 365 : forgási sebesség' }),
          `365 : ${UH} = ${days(D)}`,
          L(lang, { de: 'Kurz ist gut – die Ware bindet weniger Kapital.', en: 'Short is good – less capital is tied up.', hu: 'A rövid jó – kevesebb tőke van lekötve.' }),
        ],
        summary: L(lang, { de: `Umschlagsdauer = 365 : ${UH} = ${days(D)}`, en: `Days in stock = 365 ÷ ${UH} = ${days(D)}`, hu: `Forgási idő = 365 : ${UH} = ${days(D)}` }),
      }
    },
  },
  {
    id: 'meldebestand',
    topics: ['beschaffungsmarketing', 'material-warenwirtschaft'],
    make(rng, lang) {
      const v = pick(rng, [10, 15, 20, 25, 40, 50])
      const t = pick(rng, [3, 4, 5, 6, 8, 10])
      const S = pick(rng, [20, 30, 50, 60, 100])
      const M = v * t + S
      const pcs = (x) => L(lang, { de: `${formatSmart(x, lang)} Packungen`, en: `${formatSmart(x, lang)} packs`, hu: `${formatSmart(x, lang)} csomag` })
      return {
        title: L(lang, { de: 'Meldebestand', en: 'Reorder level', hu: 'Rendelési pont' }),
        prompt: L(lang, {
          de: `Verbrauch: ${v} Packungen pro Tag, Lieferzeit: ${t} Tage, Sicherheitsbestand: ${S} Packungen. Bei welchem Bestand muss Loopy nachbestellen?`,
          en: `Usage: ${v} packs per day, delivery time: ${t} days, safety stock: ${S} packs. At what stock level must Loopy reorder?`,
          hu: `Felhasználás: napi ${v} csomag, szállítási idő: ${t} nap, biztonsági készlet: ${S} csomag. Milyen készletszintnél kell Loopynak újrarendelnie?`,
        }),
        correct: M,
        wrong: [v * t, v * t - S, v * (t + 1) + S, v + t + S],
        fmt: pcs,
        steps: [
          L(lang, {
            de: 'Meldebestand = Verbrauch · Lieferzeit + Sicherheitsbestand',
            en: 'Reorder level = usage · delivery time + safety stock',
            hu: 'Rendelési pont = felhasználás · szállítási idő + biztonsági készlet',
          }),
          `${v} · ${t} + ${S} = ${pcs(M)}`,
        ],
        summary: L(lang, { de: `Meldebestand = ${v} · ${t} + ${S} = ${M}`, en: `Reorder level = ${v} · ${t} + ${S} = ${M}`, hu: `Rendelési pont = ${v} · ${t} + ${S} = ${M}` }),
      }
    },
  },
  {
    id: 'dividende',
    topics: ['rechtsformen-unternehmen'],
    make(rng, lang) {
      const combos = []
      for (const G of [200000, 400000, 600000, 800000, 1000000]) for (const n of [10000, 20000, 25000, 40000, 50000, 100000]) if ((G * 95) % n === 0 && (G * 0.95) / n >= 1) combos.push([G, n])
      const [G, n] = pick(rng, combos)
      const Rk = G * 0.05
      const D = r2((G - Rk) / n)
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Dividende', en: 'Dividend', hu: 'Osztalék' }),
        prompt: L(lang, {
          de: `Eine AG macht ${E(G)} Gewinn. 5 % kommen in die Rücklage, der Rest wird auf ${formatNumber(n, lang)} Aktien verteilt. Wie hoch ist die Dividende pro Aktie?`,
          en: `A public limited company (AG) makes ${E(G)} profit. 5% goes into reserves, the rest is shared among ${formatNumber(n, lang)} shares. What is the dividend per share?`,
          hu: `Egy részvénytársaság (AG) nyeresége ${E(G)}. 5% tartalékba kerül, a többit ${formatNumber(n, lang)} részvény között osztják szét. Mennyi az osztalék részvényenként?`,
        }),
        correct: D,
        wrong: [r2(G / n), r2(Rk / n), r2((G * 0.9) / n), r2((G * 1.05) / n)],
        fmt: E,
        steps: [
          `${E(G)} − ${formatPercent(5, lang)} (${E(Rk)}) = ${E(G - Rk)}`,
          `${E(G - Rk)} : ${formatNumber(n, lang)} = ${E(D)}`,
        ],
        summary: L(lang, {
          de: `Dividende = (Gewinn − 5 % Rücklage) : Aktien = ${E(D)}`,
          en: `Dividend = (profit − 5% reserve) ÷ shares = ${E(D)}`,
          hu: `Osztalék = (nyereség − 5% tartalék) : részvények = ${E(D)}`,
        }),
      }
    },
  },
  {
    id: 'wirtschaftlichkeit',
    topics: ['grundlagen-leistungserstellung-2jg'],
    make(rng, lang) {
      const [K, W] = pick(rng, [[15000, 1.2], [20000, 1.25], [40000, 1.1], [16000, 1.5], [25000, 0.8], [30000, 1.2], [12000, 1.25]])
      const Er = K * W
      const E = (x) => formatEuro(x, lang)
      const n = (x) => formatSmart(x, lang)
      return {
        title: L(lang, { de: 'Wirtschaftlichkeit', en: 'Efficiency', hu: 'Gazdaságosság' }),
        prompt: L(lang, {
          de: `Erlöse ${E(Er)}, Kosten ${E(K)}. Wie hoch ist die Wirtschaftlichkeit?`,
          en: `Revenue ${E(Er)}, costs ${E(K)}. What is the efficiency ratio (revenue ÷ costs)?`,
          hu: `Bevételek ${E(Er)}, költségek ${E(K)}. Mennyi a gazdaságosság?`,
        }),
        correct: W,
        wrong: [r2(K / Er), r2(Math.abs(Er - K) / K), r2(W + 1), r2(W * 10)],
        fmt: n,
        steps: [
          L(lang, { de: 'Wirtschaftlichkeit = Erlöse : Kosten', en: 'Efficiency = revenue ÷ costs', hu: 'Gazdaságosság = bevételek : költségek' }),
          `${n(Er)} : ${n(K)} = ${n(W)}`,
          W > 1
            ? L(lang, { de: '> 1 → wirtschaftlich', en: '> 1 → efficient', hu: '> 1 → gazdaságos' })
            : L(lang, { de: '< 1 → unwirtschaftlich (Verlust)', en: '< 1 → inefficient (loss)', hu: '< 1 → nem gazdaságos (veszteség)' }),
        ],
        summary: L(lang, { de: `Wirtschaftlichkeit = Erlöse : Kosten = ${n(W)}`, en: `Efficiency = revenue ÷ costs = ${n(W)}`, hu: `Gazdaságosság = bevételek : költségek = ${n(W)}` }),
      }
    },
  },
  {
    id: 'tkp',
    topics: ['instrumente-marketings'],
    make(rng, lang) {
      const combos = []
      for (const C of [300, 500, 800, 1200, 1500, 2000]) for (const R of [20000, 25000, 40000, 50000, 100000]) if (((C * 1000 * 100) % R) === 0) combos.push([C, R])
      const [C, R] = pick(rng, combos)
      const T = r2((C * 1000) / R)
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Tausend-Kontakt-Preis', en: 'Cost per thousand', hu: 'Ezer kontaktusra jutó ár' }),
        prompt: L(lang, {
          de: `Ein Inserat kostet ${E(C)} und erreicht ${formatNumber(R, lang)} Personen. Wie hoch ist der Tausend-Kontakt-Preis?`,
          en: `An ad costs ${E(C)} and reaches ${formatNumber(R, lang)} people. What is the cost per thousand contacts?`,
          hu: `Egy hirdetés ára ${E(C)}, és ${formatNumber(R, lang)} embert ér el. Mennyi az ezer kontaktusra jutó ár?`,
        }),
        correct: T,
        wrong: [r2(T * 10), r2(T / 10), r2(R / C), r2(T * 2)],
        fmt: E,
        steps: [
          L(lang, { de: 'TKP = Kosten · 1.000 : erreichte Personen', en: 'CPT = cost · 1,000 ÷ people reached', hu: 'Ezer kontaktus ára = költség · 1000 : elért személyek' }),
          `${formatSmart(C, lang)} · ${formatNumber(1000, lang)} : ${formatNumber(R, lang)} = ${E(T)}`,
        ],
        summary: L(lang, { de: `Tausend-Kontakt-Preis = ${E(T)} pro 1.000 Personen`, en: `Cost per thousand = ${E(T)} per 1,000 people`, hu: `Ezer kontaktus ára = ${E(T)} / 1000 fő` }),
      }
    },
  },
  {
    id: 'rentabilitaet',
    topics: ['grundlagen-leistungserstellung-2jg', 'finanzmanagement'],
    make(rng, lang) {
      const [K, p] = pick(rng, [[200000, 8], [500000, 6], [400000, 5], [250000, 12], [800000, 10], [300000, 15], [1000000, 4]])
      const G = (K * p) / 100
      const E = (x) => formatEuro(x, lang)
      const P = (x) => formatPercent(x, lang, 2)
      return {
        title: L(lang, { de: 'Rentabilität', en: 'Return on capital', hu: 'Jövedelmezőség' }),
        prompt: L(lang, {
          de: `Gewinn ${E(G)}, Kapitaleinsatz ${E(K)}. Wie hoch ist die Rentabilität?`,
          en: `Profit ${E(G)}, capital employed ${E(K)}. What is the return on capital?`,
          hu: `Nyereség ${E(G)}, befektetett tőke ${E(K)}. Mennyi a jövedelmezőség?`,
        }),
        correct: p,
        wrong: [r2(p / 100), 100 - p, r2(p * 10), r2(p / 2)],
        fmt: P,
        steps: [
          L(lang, { de: 'Rentabilität = Gewinn : Kapitaleinsatz · 100', en: 'Return = profit ÷ capital · 100', hu: 'Jövedelmezőség = nyereség : tőke · 100' }),
          `${formatNumber(G, lang)} : ${formatNumber(K, lang)} · 100 = ${P(p)}`,
        ],
        summary: L(lang, { de: `Rentabilität = Gewinn : Kapital · 100 = ${P(p)}`, en: `Return = profit ÷ capital · 100 = ${P(p)}`, hu: `Jövedelmezőség = nyereség : tőke · 100 = ${P(p)}` }),
      }
    },
  },
  {
    id: 'amortisation',
    topics: ['investitionsmanagement'],
    make(rng, lang) {
      const combos = []
      for (const AK of [100000, 120000, 200000, 240000, 300000, 400000, 600000]) for (const ND of [5, 8, 10]) for (const Y of [2, 2.5, 3, 4, 5]) {
        const A = AK / ND
        const G = AK / Y - A
        if (Y < ND && G > 0 && Number.isInteger(A) && Number.isInteger(G) && G % 1000 === 0) combos.push([AK, ND, Y, A, G])
      }
      const [AK, ND, Y, A, G] = pick(rng, combos)
      const E = (x) => formatEuro(x, lang)
      const yrs = (x) => L(lang, { de: `${formatSmart(x, lang, 1)} Jahre`, en: `${formatSmart(x, lang, 1)} years`, hu: `${formatSmart(x, lang, 1)} év` })
      return {
        title: L(lang, { de: 'Amortisationsdauer', en: 'Payback period', hu: 'Megtérülési idő' }),
        prompt: L(lang, {
          de: `Eine Maschine kostet ${E(AK)} (kein Restwert). Pro Jahr bringt sie ${E(G)} Gewinn, die Abschreibung beträgt ${E(A)}. Nach wie vielen Jahren hat sie sich amortisiert?`,
          en: `A machine costs ${E(AK)} (no residual value). Each year it brings ${E(G)} profit; depreciation is ${E(A)}. After how many years has it paid for itself?`,
          hu: `Egy gép ára ${E(AK)} (maradványérték nélkül). Évente ${E(G)} nyereséget hoz, az értékcsökkenés ${E(A)}. Hány év alatt térül meg?`,
        }),
        correct: Y,
        wrong: [r2(AK / G), ND, r2(AK / (G + A) / 2), r2(Y + 1)],
        fmt: yrs,
        steps: [
          L(lang, {
            de: 'Amortisationsdauer = (Anschaffung − Restwert) : (Gewinn + Abschreibung)',
            en: 'Payback = (cost − residual value) ÷ (profit + depreciation)',
            hu: 'Megtérülési idő = (beszerzés − maradványérték) : (nyereség + értékcsökkenés)',
          }),
          `${formatNumber(AK, lang)} : (${formatNumber(G, lang)} + ${formatNumber(A, lang)}) = ${yrs(Y)}`,
        ],
        summary: L(lang, {
          de: `Amortisation: ${E(AK)} : (Gewinn + Abschreibung) = ${yrs(Y)}`,
          en: `Payback: ${E(AK)} ÷ (profit + depreciation) = ${yrs(Y)}`,
          hu: `Megtérülés: ${E(AK)} : (nyereség + écs.) = ${yrs(Y)}`,
        }),
      }
    },
  },
  {
    id: 'breakeven-menge',
    topics: ['produktionsbetriebe', 'leistungserstellungsprozess-produktion', 'businessplan-3jg'],
    make(rng, lang) {
      const combos = []
      for (const F of [6000, 9000, 12000, 18000, 24000, 30000]) for (const p of [4, 5, 6, 8, 10, 12]) for (const kv of [1, 2, 3, 4, 5, 6]) if (p > kv && F % (p - kv) === 0) combos.push([F, p, kv])
      const [F, p, kv] = pick(rng, combos)
      const M = F / (p - kv)
      const E = (x) => formatEuro(x, lang)
      const EW = (x) => formatEuro(x, lang, { whole: true })
      const pcs = (x) => L(lang, { de: `${formatNumber(Math.round(x), lang)} Stück`, en: `${formatNumber(Math.round(x), lang)} units`, hu: `${formatNumber(Math.round(x), lang)} darab` })
      return {
        title: L(lang, { de: 'Break-even-Menge', en: 'Break-even quantity', hu: 'Fedezeti pont (mennyiség)' }),
        prompt: L(lang, {
          de: `Fixkosten ${EW(F)} pro Monat, Preis ${E(p)} pro Stück, variable Kosten ${E(kv)} pro Stück. Ab welcher Menge sind alle Kosten gedeckt?`,
          en: `Fixed costs ${EW(F)} per month, price ${E(p)} per unit, variable costs ${E(kv)} per unit. From what quantity are all costs covered?`,
          hu: `Fix költség havi ${EW(F)}, ár darabonként ${E(p)}, változó költség darabonként ${E(kv)}. Milyen mennyiségtől fedez minden költséget?`,
        }),
        correct: M,
        wrong: [Math.ceil(F / p), Math.ceil(F / kv), Math.ceil(F / (p + kv)), M * 2],
        fmt: pcs,
        steps: [
          L(lang, { de: `Deckungsbeitrag pro Stück = ${E(p)} − ${E(kv)} = ${E(p - kv)}`, en: `Contribution margin per unit = ${E(p)} − ${E(kv)} = ${E(p - kv)}`, hu: `Fedezeti hozzájárulás/db = ${E(p)} − ${E(kv)} = ${E(p - kv)}` }),
          L(lang, { de: `Break-even-Menge = Fixkosten : DB pro Stück = ${pcs(M)}`, en: `Break-even = fixed costs ÷ margin per unit = ${pcs(M)}`, hu: `Fedezeti pont = fix költség : fedezet/db = ${pcs(M)}` }),
        ],
        summary: L(lang, {
          de: `Break-even-Menge = Fixkosten : (Preis − var. Kosten) = ${pcs(M)}`,
          en: `Break-even = fixed costs ÷ (price − variable cost) = ${pcs(M)}`,
          hu: `Fedezeti pont = fix költség : (ár − vált. ktg.) = ${pcs(M)}`,
        }),
      }
    },
  },
  {
    id: 'breakeven-umsatz',
    topics: ['businessplan-3jg'],
    make(rng, lang) {
      const combos = []
      for (const F of [30000, 45000, 60000, 90000, 120000]) for (const q of [20, 25, 40, 50, 60, 75]) if ((F * 100) % q === 0) combos.push([F, q])
      const [F, q] = pick(rng, combos)
      const U = (F * 100) / q
      const E = (x) => formatEuro(x, lang)
      return {
        title: L(lang, { de: 'Break-even-Umsatz', en: 'Break-even sales', hu: 'Fedezeti pont (árbevétel)' }),
        prompt: L(lang, {
          de: `Fixkosten ${E(F)} pro Jahr, DBU-Quote ${formatPercent(q, lang)}. Wie hoch ist der Break-even-Umsatz?`,
          en: `Fixed costs ${E(F)} per year, contribution margin ratio ${formatPercent(q, lang)}. What are the break-even sales?`,
          hu: `Fix költség évi ${E(F)}, fedezeti hányad ${formatPercent(q, lang)}. Mennyi a fedezeti ponthoz tartozó árbevétel?`,
        }),
        correct: U,
        wrong: [(F * q) / 100, r2(F / (1 - q / 100)), F + (F * q) / 100, U * 2],
        fmt: E,
        steps: [
          L(lang, { de: 'Break-even-Umsatz = Fixkosten : DBU-Quote', en: 'Break-even sales = fixed costs ÷ margin ratio', hu: 'Fedezeti árbevétel = fix költség : fedezeti hányad' }),
          `${formatNumber(F, lang)} : ${formatSmart(q / 100, lang)} = ${E(U)}`,
        ],
        summary: L(lang, {
          de: `Break-even-Umsatz = ${E(F)} : ${formatPercent(q, lang)} = ${E(U)}`,
          en: `Break-even sales = ${E(F)} ÷ ${formatPercent(q, lang)} = ${E(U)}`,
          hu: `Fedezeti árbevétel = ${E(F)} : ${formatPercent(q, lang)} = ${E(U)}`,
        }),
      }
    },
  },
  {
    id: 'ek-quote',
    topics: ['finanzplan-analyse', 'investition-finanzierung-ueberblick'],
    make(rng, lang) {
      const GK = pick(rng, [200000, 400000, 500000, 800000, 1000000])
      const q = pick(rng, [10, 15, 20, 25, 30, 35, 40])
      const EK = (GK * q) / 100
      const FK = GK - EK
      const E = (x) => formatEuro(x, lang)
      const P = (x) => formatPercent(x, lang, 1)
      return {
        title: L(lang, { de: 'Eigenkapitalquote', en: 'Equity ratio', hu: 'Saját tőke aránya' }),
        prompt: L(lang, {
          de: `Eigenkapital ${E(EK)}, Fremdkapital ${E(FK)}. Wie hoch ist die Eigenkapitalquote?`,
          en: `Equity ${E(EK)}, debt ${E(FK)}. What is the equity ratio?`,
          hu: `Saját tőke ${E(EK)}, idegen tőke ${E(FK)}. Mennyi a saját tőke aránya?`,
        }),
        correct: q,
        wrong: [Math.round((EK / FK) * 1000) / 10, 100 - q, Math.round((FK / EK) * 100), q * 2],
        fmt: P,
        steps: [
          L(lang, { de: `Gesamtkapital = ${E(EK)} + ${E(FK)} = ${E(GK)}`, en: `Total capital = ${E(EK)} + ${E(FK)} = ${E(GK)}`, hu: `Összes tőke = ${E(EK)} + ${E(FK)} = ${E(GK)}` }),
          L(lang, {
            de: `EK-Quote = EK · 100 : Gesamtkapital = ${P(q)} (≥ 30 % sehr gut)`,
            en: `Equity ratio = equity · 100 ÷ total = ${P(q)} (≥ 30% very good)`,
            hu: `Sajáttőke-arány = saját tőke · 100 : összes = ${P(q)} (≥ 30% nagyon jó)`,
          }),
        ],
        summary: L(lang, {
          de: `Eigenkapitalquote = EK · 100 : Gesamtkapital = ${P(q)}`,
          en: `Equity ratio = equity · 100 ÷ total capital = ${P(q)}`,
          hu: `Sajáttőke-arány = saját tőke · 100 : összes tőke = ${P(q)}`,
        }),
      }
    },
  },
]
export const CALC_IDS = CALCS.map((c) => c.id)

function makeCalc(ctx) {
  const { rng, lang, topicIds, year, exclude } = ctx
  const byTopic = topicIds.length ? CALCS.filter((c) => c.topics.some((t) => topicIds.includes(t))) : []
  const byYear = !topicIds.length && year ? CALCS.filter((c) => yearsOf(c.topics).includes(year)) : []
  let pool = byTopic.length ? byTopic : byYear.length ? byYear : CALCS.filter((c) => c.core)
  // Wenig Auswahl im Lernstoff → ab und zu eine Einkaufsrechnung (Rabatt, Skonto, USt) dazu
  if (pool.length < 3 && rng() < 0.25) pool = [...pool, ...CALCS.filter((c) => c.core)]
  const fresh = pool.filter((c) => !exclude.has(`calc:${c.id}`))
  const gen = pick(rng, fresh.length ? fresh : pool)
  const g = gen.make(rng, lang)
  const options = finishOptions(rng, g.correct, g.wrong, g.fmt)
  return {
    kind: 'calc',
    key: `calc:${gen.id}`,
    calcId: gen.id,
    title: g.title,
    prompt: g.prompt,
    topicIds: gen.topics,
    options: options.map((o) => o.text),
    values: options.map((o) => o.value),
    correctIndex: options.findIndex((o) => o.correct),
    // Englisch rechnet mit ÷ statt :
    steps: lang === 'en' ? g.steps.map((x) => x.replace(/ : /g, ' ÷ ')) : g.steps,
    summary: lang === 'en' ? g.summary.replace(/ : /g, ' ÷ ') : g.summary,
  }
}

// 4 Antworten: richtig + 3 typische Fehler (eindeutig nach Anzeige), notfalls sinnvoll verschoben
function finishOptions(rng, correct, wrong, fmt) {
  const out = [{ value: correct, text: fmt(correct), correct: true }]
  const seen = new Set([out[0].text])
  const add = (v) => {
    if (out.length >= 4 || !Number.isFinite(v) || v <= 0) return
    const text = fmt(v)
    if (seen.has(text)) return
    seen.add(text)
    out.push({ value: v, text, correct: false })
  }
  shuffle(rng, wrong).forEach(add)
  const roundLike = (v) => (Number.isInteger(correct) ? Math.round(v) : r2(v))
  for (const f of [1.1, 0.9, 1.2, 0.8, 1.5, 0.5, 2, 1.25, 0.75, 3]) add(roundLike(correct * f))
  return shuffle(rng, out)
}

// =====================================================================
// 3) SORTIEREN (Lager) – 6 Kärtchen in 2 Körbe
// =====================================================================
// items: [korb (0|1), de, en, hu]
const SORT_SETS = [
  {
    id: 'sachgut-dienstleistung',
    topics: ['grundlagen-des-wirtschaftens'],
    station: 'counter',
    b: { de: ['Sachgut', 'Dienstleistung'], en: ['Physical good', 'Service'], hu: ['Anyagi jószág', 'Szolgáltatás'] },
    why: {
      de: 'Sachgüter kann man angreifen und lagern, Dienstleistungen nicht.',
      en: 'You can touch and store physical goods – services you can’t.',
      hu: 'Az anyagi javak megfoghatók és tárolhatók, a szolgáltatások nem.',
    },
    items: [
      [0, 'Fahrrad', 'Bicycle', 'Kerékpár'],
      [0, 'Schulbuch', 'Schoolbook', 'Tankönyv'],
      [0, 'Schokolade', 'Chocolate', 'Csokoládé'],
      [0, 'Winterjacke', 'Winter jacket', 'Télikabát'],
      [0, 'Smartphone', 'Smartphone', 'Okostelefon'],
      [0, 'Schreibtisch', 'Desk', 'Íróasztal'],
      [1, 'Haarschnitt', 'Haircut', 'Hajvágás'],
      [1, 'Arztbesuch', 'Visit to the doctor', 'Orvosi vizsgálat'],
      [1, 'Busfahrt', 'Bus ride', 'Buszút'],
      [1, 'Nachhilfestunde', 'Tutoring lesson', 'Korrepetálás'],
      [1, 'Autoreparatur', 'Car repair', 'Autójavítás'],
      [1, 'Versicherung', 'Insurance', 'Biztosítás'],
    ],
  },
  {
    id: 'konsum-investition',
    topics: ['grundlagen-des-wirtschaftens', 'produktionsbetriebe'],
    station: 'counter',
    b: { de: ['Konsumgut', 'Investitionsgut'], en: ['Consumer good', 'Capital good'], hu: ['Fogyasztási jószág', 'Beruházási jószág'] },
    why: {
      de: 'Konsumgüter verbraucht oder benutzt man privat, mit Investitionsgütern arbeitet ein Betrieb.',
      en: 'Consumer goods are used up or used privately; capital goods are used by a business to produce.',
      hu: 'A fogyasztási javakat magánemberek használják; a beruházási javakkal egy vállalat termel.',
    },
    items: [
      [0, 'Pizza fürs Abendessen', 'Pizza for dinner', 'Pizza vacsorára'],
      [0, 'Shampoo für zu Hause', 'Shampoo for home', 'Sampon otthonra'],
      [0, 'Fahrrad für die Freizeit', 'Bike for leisure', 'Kerékpár szabadidőre'],
      [0, 'Spielkonsole im Kinderzimmer', 'Games console at home', 'Játékkonzol a gyerekszobában'],
      [0, 'Wintermantel', 'Winter coat', 'Télikabát'],
      [1, 'Pizzaofen der Pizzeria', 'Pizzeria’s pizza oven', 'A pizzéria kemencéje'],
      [1, 'Lieferwagen der Bäckerei', 'Bakery’s delivery van', 'A pékség furgonja'],
      [1, 'Nähmaschine der Schneiderei', 'Tailor’s sewing machine', 'A szabóság varrógépe'],
      [1, 'Traktor des Bauern', 'Farmer’s tractor', 'A gazda traktora'],
      [1, 'Bürogebäude einer Firma', 'Company office building', 'Egy cég irodaháza'],
    ],
  },
  {
    id: 'stakeholder',
    topics: ['unternehmen-und-umfeld'],
    station: 'mail',
    b: { de: ['Interne Stakeholder', 'Externe Stakeholder'], en: ['Internal stakeholders', 'External stakeholders'], hu: ['Belső stakeholderek', 'Külső stakeholderek'] },
    why: {
      de: 'Intern: Eigentümer, Management, Mitarbeiter. Extern: alle außerhalb des Unternehmens.',
      en: 'Internal: owners, management, staff. External: everyone outside the company.',
      hu: 'Belső: tulajdonos, menedzsment, munkatársak. Külső: mindenki a vállalaton kívül.',
    },
    items: [
      [0, 'Eigentümerin', 'Owner', 'Tulajdonos'],
      [0, 'Geschäftsführer', 'Managing director', 'Ügyvezető'],
      [0, 'Mitarbeiter in der Produktion', 'Production worker', 'Termelési dolgozó'],
      [0, 'Lehrling im Betrieb', 'Apprentice in the firm', 'Tanonc a cégnél'],
      [0, 'Abteilungsleiterin', 'Head of department', 'Osztályvezető'],
      [1, 'Lieferant', 'Supplier', 'Szállító'],
      [1, 'Kundschaft', 'Customers', 'Vevők'],
      [1, 'Bank als Kreditgeber', 'Bank as lender', 'Hitelező bank'],
      [1, 'Konkurrenz', 'Competitors', 'Versenytársak'],
      [1, 'Staat (Finanzamt)', 'State (tax office)', 'Állam (adóhivatal)'],
      [1, 'Nachbarn der Fabrik', 'Neighbours of the factory', 'A gyár szomszédai'],
    ],
  },
  {
    id: 'anlage-umlauf',
    topics: ['leistungserstellung-1jg', 'investition-finanzierung-ueberblick', 'finanzplan-analyse'],
    station: 'store',
    b: { de: ['Anlagevermögen', 'Umlaufvermögen'], en: ['Fixed assets', 'Current assets'], hu: ['Befektetett eszközök', 'Forgóeszközök'] },
    why: {
      de: 'Anlagevermögen bleibt lange im Betrieb, Umlaufvermögen ändert sich laufend.',
      en: 'Fixed assets stay in the business for a long time; current assets keep changing.',
      hu: 'A befektetett eszközök hosszú ideig a cégnél maradnak, a forgóeszközök folyamatosan változnak.',
    },
    items: [
      [0, 'Geschäftsgebäude', 'Business premises', 'Üzletház'],
      [0, 'Produktionsmaschine', 'Production machine', 'Termelőgép'],
      [0, 'Lieferwagen', 'Delivery van', 'Szállítóautó'],
      [0, 'Büromöbel', 'Office furniture', 'Irodabútor'],
      [0, 'Firmengrundstück', 'Company land', 'Céges telek'],
      [0, 'Computer im Büro', 'Office computer', 'Irodai számítógép'],
      [1, 'Waren im Lager', 'Goods in stock', 'Raktáron lévő áru'],
      [1, 'Rohstoffe', 'Raw materials', 'Nyersanyagok'],
      [1, 'Bargeld in der Kassa', 'Cash in the till', 'Készpénz a kasszában'],
      [1, 'Bankguthaben', 'Bank balance', 'Bankszámla-egyenleg'],
      [1, 'Forderungen an Kunden', 'Receivables from customers', 'Vevőkövetelések'],
      [1, 'Verpackungsmaterial', 'Packaging material', 'Csomagolóanyag'],
    ],
  },
  {
    id: 'pflichten-kauf',
    topics: ['phasen-kaufen-verkaufen', 'gesetzliche-grundlagen-kauf'],
    station: 'counter',
    b: { de: ['Pflicht des Verkäufers', 'Pflicht des Käufers'], en: ['Seller’s duty', 'Buyer’s duty'], hu: ['Az eladó kötelessége', 'A vevő kötelessége'] },
    why: {
      de: 'Verkäufer: liefern und richtig verrechnen. Käufer: annehmen und bezahlen.',
      en: 'Seller: deliver and invoice correctly. Buyer: accept and pay.',
      hu: 'Eladó: szállít és helyesen számláz. Vevő: átvesz és fizet.',
    },
    items: [
      [0, 'Ware rechtzeitig liefern', 'Deliver goods on time', 'Időben szállítani'],
      [0, 'Am vereinbarten Ort übergeben', 'Hand over at the agreed place', 'A megbeszélt helyen átadni'],
      [0, 'Mangelfreie Ware liefern', 'Deliver goods free of defects', 'Hibátlan árut szállítani'],
      [0, 'Ordnungsgemäße Rechnung ausstellen', 'Issue a proper invoice', 'Szabályos számlát kiállítani'],
      [0, 'Die bestellte Menge liefern', 'Deliver the quantity ordered', 'A rendelt mennyiséget szállítani'],
      [1, 'Ware annehmen', 'Accept the goods', 'Átvenni az árut'],
      [1, 'Rechnung fristgerecht bezahlen', 'Pay the invoice on time', 'Határidőre fizetni'],
      [1, 'Annehmen, auch wenn es woanders billiger ist', 'Accept even if it’s cheaper elsewhere', 'Átvenni, akkor is, ha máshol olcsóbb'],
      [1, 'Den vereinbarten Preis zahlen', 'Pay the agreed price', 'Kifizetni a megbeszélt árat'],
      [1, 'Ware abholen, wenn Abholung vereinbart ist', 'Collect goods if collection was agreed', 'Elvinni az árut, ha így szólt a megállapodás'],
    ],
  },
  {
    id: 'wer-ist-unzuverlaessig',
    topics: ['unzuverlaessige-verkaeufer', 'unzuverlaessige-kaeufer'],
    station: 'dock',
    b: { de: ['Verkäufer unzuverlässig', 'Käufer unzuverlässig'], en: ['Seller at fault', 'Buyer at fault'], hu: ['Az eladó hibázik', 'A vevő hibázik'] },
    why: {
      de: 'Verkäufer: Lieferverzug, Mangel, falsche Rechnung. Käufer: Annahmeverzug, Zahlungsverzug.',
      en: 'Seller: late delivery, defects, wrong invoice. Buyer: default of acceptance or payment.',
      hu: 'Eladó: szállítási késedelem, hiba, rossz számla. Vevő: átvételi vagy fizetési késedelem.',
    },
    items: [
      [0, 'Die Torte kommt erst nach der Feier', 'The cake arrives after the party', 'A torta csak a buli után érkezik'],
      [0, 'Die Hälfte der Gläser ist zerbrochen', 'Half the glasses are broken', 'A poharak fele eltört'],
      [0, 'Rechnung: 12 statt 10 Stück verrechnet', 'Invoice charges 12 items instead of 10', 'A számla 10 helyett 12 darabot tartalmaz'],
      [0, 'Statt Blau wird Rot geliefert', 'Red is delivered instead of blue', 'Kék helyett pirosat szállítanak'],
      [0, 'Lieferung kommt zwei Wochen zu spät', 'Delivery is two weeks late', 'Két hetet késik a szállítás'],
      [1, 'Kunde holt das bestellte Sofa nicht ab', 'Customer doesn’t collect the sofa', 'A vevő nem viszi el a rendelt kanapét'],
      [1, 'Firma zahlt trotz Mahnung nicht', 'Firm doesn’t pay despite a reminder', 'A cég felszólítás ellenére sem fizet'],
      [1, 'Käuferin verweigert einwandfreie Ware', 'Buyer refuses flawless goods', 'A vevő megtagadja a hibátlan árut'],
      [1, 'Kunde zahlt 6 Wochen zu spät', 'Customer pays 6 weeks late', 'A vevő 6 hetet késik a fizetéssel'],
      [1, 'Shop nimmt pünktliche Lieferung nicht an', 'Shop refuses an on-time delivery', 'Az üzlet nem veszi át a pontos szállítást'],
    ],
  },
  {
    id: 'liefer-annahmeverzug',
    topics: ['unzuverlaessige-verkaeufer', 'unzuverlaessige-kaeufer'],
    station: 'counter',
    b: { de: ['Lieferverzug', 'Annahmeverzug'], en: ['Late delivery', 'Default of acceptance'], hu: ['Szállítási késedelem', 'Átvételi késedelem'] },
    why: {
      de: 'Lieferverzug: Verkäufer liefert nicht wie vereinbart. Annahmeverzug: Käufer nimmt nicht an.',
      en: 'Late delivery: the seller doesn’t deliver as agreed. Default of acceptance: the buyer won’t accept.',
      hu: 'Szállítási késedelem: az eladó nem a megállapodás szerint szállít. Átvételi késedelem: a vevő nem veszi át.',
    },
    items: [
      [0, 'Ware kommt nicht zum vereinbarten Termin', 'Goods don’t arrive on the agreed date', 'Az áru nem érkezik meg időben'],
      [0, 'Ware geht an die falsche Filiale', 'Goods go to the wrong branch', 'Az áru rossz fióktelepre megy'],
      [0, 'Christbäume kommen erst am 27. Dezember', 'Christmas trees arrive on 27 December', 'A karácsonyfák december 27-én jönnek'],
      [0, 'Lieferant vertröstet: „Nächste Woche!“', 'Supplier says: “Next week!”', 'A szállító halogat: „Jövő héten!”'],
      [0, 'Bäckerei bringt die Torte 3 Stunden zu spät', 'Bakery brings the cake 3 hours late', 'A pékség 3 órát késik a tortával'],
      [1, 'Kunde verweigert die mangelfreie Ware', 'Customer refuses goods free of defects', 'A vevő megtagadja a hibátlan árut'],
      [1, 'Bestellte Möbel werden nicht abgeholt', 'Ordered furniture isn’t collected', 'A rendelt bútort nem viszik el'],
      [1, 'Firma schickt den Lkw mit der Bestellung weg', 'Firm sends the delivery truck away', 'A cég elküldi a rendelést hozó kamiont'],
      [1, 'Kundin will die Ware nicht – woanders billiger', 'Buyer refuses – it’s cheaper elsewhere', 'A vevő nem kéri – máshol olcsóbb'],
      [1, 'Käufer öffnet dem Zusteller nicht', 'Buyer won’t open the door to the courier', 'A vevő nem nyit ajtót a futárnak'],
    ],
  },
  {
    id: 'fix-termin',
    topics: ['bestandteile-kaufvertrag'],
    station: 'dock',
    b: { de: ['Fixgeschäft', 'Gewöhnliches Termingeschäft'], en: ['Fixed-date contract', 'Ordinary forward contract'], hu: ['Fix határidős ügylet', 'Szokásos határidős ügylet'] },
    why: {
      de: 'Fixgeschäft: genauer Termin oder Zweck – später ist die Ware nutzlos. Sonst: ungefährer Termin.',
      en: 'Fixed date: exact date or purpose – later the goods are useless. Otherwise: an approximate date.',
      hu: 'Fix ügylet: pontos időpont vagy cél – később az áru haszontalan. Egyébként: hozzávetőleges időpont.',
    },
    items: [
      [0, 'Hochzeitstorte für den 14. Juni', 'Wedding cake for 14 June', 'Esküvői torta június 14-re'],
      [0, 'Lieferung „fix am 20. April“', 'Delivery “fixed on 20 April”', 'Szállítás „fixen április 20-án”'],
      [0, 'Christbäume bis spätestens 20. Dezember', 'Christmas trees by 20 December at the latest', 'Karácsonyfák legkésőbb december 20-ig'],
      [0, 'Kostüme für den Ball am 8. Februar', 'Costumes for the ball on 8 February', 'Jelmezek a február 8-i bálra'],
      [0, 'Blumen für die Eröffnung Montag 9 Uhr', 'Flowers for the opening, Monday 9 am', 'Virágok a hétfő 9 órai megnyitóra'],
      [1, 'Lieferung innerhalb von 2 Wochen', 'Delivery within 2 weeks', 'Szállítás 2 héten belül'],
      [1, 'Lieferung „Anfang Mai“', 'Delivery “early May”', 'Szállítás „május elején”'],
      [1, 'Lieferung ca. 10 Tage nach Bestellung', 'Delivery approx. 10 days after ordering', 'Szállítás kb. 10 nappal a rendelés után'],
      [1, 'Lieferung im Laufe des Monats', 'Delivery in the course of the month', 'Szállítás a hónap folyamán'],
      [1, 'Lieferung in 3 bis 4 Wochen', 'Delivery in 3 to 4 weeks', 'Szállítás 3-4 héten belül'],
    ],
  },
  {
    id: 'firmenbuch-pflicht',
    topics: ['unternehmer-firma-firmenbuch', 'unternehmen-und-umfeld'],
    station: 'mail',
    b: { de: ['Eintragung Pflicht', 'Eintragung freiwillig'], en: ['Registration required', 'Registration optional'], hu: ['Kötelező bejegyzés', 'Önkéntes bejegyzés'] },
    why: {
      de: 'Pflicht: Gesellschaften (OG, KG, GmbH, AG), Genossenschaften und große Einzelunternehmen.',
      en: 'Required: partnerships and companies (OG, KG, GmbH, AG), cooperatives and large sole traders.',
      hu: 'Kötelező: társaságok (OG, KG, GmbH, AG), szövetkezetek és nagy egyéni vállalkozások.',
    },
    items: [
      [0, 'GmbH', 'GmbH', 'GmbH'],
      [0, 'AG', 'AG', 'AG'],
      [0, 'OG', 'OG', 'OG'],
      [0, 'KG', 'KG', 'KG'],
      [0, 'Genossenschaft', 'Cooperative', 'Szövetkezet'],
      [0, 'Einzelunternehmen mit 1,5 Mio. € Umsatz', 'Sole trader with €1.5m turnover', 'Egyéni vállalkozás 1,5 millió € forgalommal'],
      [1, 'Kleiner Friseursalon (Einzelunternehmen)', 'Small hair salon (sole trader)', 'Kis fodrászszalon (egyéni vállalkozás)'],
      [1, 'Ärztin mit eigener Praxis (freier Beruf)', 'Doctor with own practice (profession)', 'Orvos saját rendelővel (szabadfoglalkozás)'],
      [1, 'Bauer mit eigenem Hof', 'Farmer with own farm', 'Gazda saját gazdasággal'],
      [1, 'Kleiner Onlineshop als Einzelunternehmen', 'Small online shop run by a sole trader', 'Kis webshop egyéni vállalkozásként'],
    ],
  },
  {
    id: 'personen-kapital',
    topics: ['rechtsformen-unternehmen', 'wahl-der-rechtsform-1jg'],
    station: 'mail',
    b: { de: ['Personengesellschaft', 'Kapitalgesellschaft'], en: ['Partnership', 'Corporation'], hu: ['Személyegyesítő társaság', 'Tőketársaság'] },
    why: {
      de: 'Personengesellschaft: mind. ein Gesellschafter haftet persönlich. Kapitalgesellschaft: es haftet nur das Gesellschaftsvermögen.',
      en: 'Partnership: at least one partner is personally liable. Corporation: only the company’s assets are liable.',
      hu: 'Személyegyesítő társaság: legalább egy tag személyesen felel. Tőketársaság: csak a társaság vagyona felel.',
    },
    items: [
      [0, 'OG (Offene Gesellschaft)', 'OG (general partnership)', 'OG (közkereseti társaság)'],
      [0, 'KG (Kommanditgesellschaft)', 'KG (limited partnership)', 'KG (betéti társaság)'],
      [0, 'GesbR', 'GesbR (civil-law partnership)', 'GesbR (polgári jogi társaság)'],
      [0, 'Mind. einer haftet unbeschränkt', 'At least one partner has unlimited liability', 'Legalább egy tag korlátlanul felel'],
      [0, 'Kein Mindestkapital nötig', 'No minimum capital needed', 'Nincs szükség minimális tőkére'],
      [1, 'GmbH', 'GmbH (limited company)', 'GmbH (kft.)'],
      [1, 'AG (Aktiengesellschaft)', 'AG (public limited company)', 'AG (részvénytársaság)'],
      [1, 'FlexCo', 'FlexCo (flexible company)', 'FlexCo (rugalmas tőketársaság)'],
      [1, 'Es haftet nur das Gesellschaftsvermögen', 'Only the company’s assets are liable', 'Csak a társaság vagyona felel'],
      [1, 'Juristische Person mit Organen', 'Legal entity with governing bodies', 'Jogi személy szervekkel'],
    ],
  },
  {
    id: 'prokura-hv',
    topics: ['vollmachten'],
    station: 'mail',
    b: { de: ['Prokura', 'Handlungsvollmacht'], en: ['Prokura', 'Commercial power of attorney'], hu: ['Prokura', 'Kereskedelmi meghatalmazás'] },
    why: {
      de: 'Prokura ist die umfangreichste Vollmacht und steht im Firmenbuch; die Handlungsvollmacht ist eingeschränkt.',
      en: 'Prokura is the broadest power and is in the company register; commercial power of attorney is limited.',
      hu: 'A prokura a legszélesebb meghatalmazás, és a cégjegyzékbe kerül; a kereskedelmi meghatalmazás korlátozott.',
    },
    items: [
      [0, 'Umfangreichste Vollmacht', 'Broadest power of attorney', 'Legszélesebb meghatalmazás'],
      [0, 'Nur von Unternehmen im Firmenbuch', 'Only from firms in the company register', 'Csak cégjegyzékben szereplő cég adhatja'],
      [0, 'Muss ins Firmenbuch eingetragen werden', 'Must be entered in the company register', 'Be kell jegyezni a cégjegyzékbe'],
      [0, 'Unterschrift mit „ppa.“', 'Signs with “ppa.”', 'Aláírás „ppa.” jelöléssel'],
      [0, 'Alle Geschäfte, die ein Betrieb mit sich bringt', 'All business any firm involves', 'Minden ügylet, ami egy üzlettel jár'],
      [1, 'Eingeschränkte Vollmacht', 'Limited power of attorney', 'Korlátozott meghatalmazás'],
      [1, 'Von jedem Unternehmen erteilbar', 'Can be granted by any business', 'Bármely vállalkozás adhatja'],
      [1, 'Kein Firmenbucheintrag', 'No entry in the company register', 'Nincs cégjegyzéki bejegyzés'],
      [1, 'Auch durch schlüssiges Handeln erteilt', 'Can be granted by implied conduct', 'Ráutaló magatartással is adható'],
      [1, 'Unterschrift mit „i. A.“', 'Signs with “i. A.” (by order)', 'Aláírás „i. A.” jelöléssel'],
    ],
  },
  {
    id: 'absatzweg',
    topics: ['instrumente-marketings', 'der-handel'],
    station: 'counter',
    b: { de: ['Direkter Absatz', 'Indirekter Absatz'], en: ['Direct sales channel', 'Indirect sales channel'], hu: ['Közvetlen értékesítés', 'Közvetett értékesítés'] },
    why: {
      de: 'Direkt: Das Unternehmen verkauft selbst an die Endkunden. Indirekt: Zwischenhändler oder Vermittler sind dabei.',
      en: 'Direct: the company sells to end customers itself. Indirect: intermediaries are involved.',
      hu: 'Közvetlen: a cég maga ad el a végfelhasználóknak. Közvetett: közvetítők is részt vesznek.',
    },
    items: [
      [0, 'Verkauf im eigenen Onlineshop', 'Selling in its own online shop', 'Értékesítés saját webshopban'],
      [0, 'Bauer verkauft im Hofladen', 'Farmer sells in the farm shop', 'A gazda a háztáji boltban árul'],
      [0, 'Außendienst besucht die Kunden', 'Sales reps visit customers', 'Üzletkötők látogatják a vevőket'],
      [0, 'Eigene Filiale in der Innenstadt', 'Own branch in the city centre', 'Saját üzlet a belvárosban'],
      [0, 'Winzer verkauft ab Hof', 'Winemaker sells from the estate', 'A borász a pincéből árul'],
      [1, 'Verkauf über den Supermarkt', 'Selling via the supermarket', 'Értékesítés szupermarketen keresztül'],
      [1, 'Verkauf über Amazon-Marktplatz', 'Selling on the Amazon marketplace', 'Értékesítés az Amazon piacterén'],
      [1, 'Großhändler beliefert Geschäfte', 'Wholesaler supplies shops', 'Nagykereskedő látja el az üzleteket'],
      [1, 'Handelsvertreter vermittelt Aufträge', 'Commercial agent brokers orders', 'Kereskedelmi ügynök közvetít'],
      [1, 'Franchise-Partner verkauft die Produkte', 'Franchise partner sells the products', 'Franchise-partner árulja a termékeket'],
    ],
  },
  {
    id: 'werbemittel-traeger',
    topics: ['instrumente-marketings'],
    station: 'counter',
    b: { de: ['Werbemittel', 'Werbeträger'], en: ['Advertising material', 'Advertising medium'], hu: ['Reklámeszköz', 'Reklámhordozó'] },
    why: {
      de: 'Werbemittel = die gestaltete Botschaft. Werbeträger = das Medium, das sie zur Zielgruppe bringt.',
      en: 'Advertising material = the designed message. Advertising medium = the channel that carries it.',
      hu: 'Reklámeszköz = a megtervezett üzenet. Reklámhordozó = a médium, amely eljuttatja a célcsoporthoz.',
    },
    items: [
      [0, 'Plakat', 'Poster', 'Plakát'],
      [0, 'Inserat', 'Print ad', 'Hirdetés'],
      [0, 'TV-Spot', 'TV commercial', 'Tévéreklám'],
      [0, 'Radiospot', 'Radio spot', 'Rádióreklám'],
      [0, 'Flyer', 'Flyer', 'Szórólap'],
      [0, 'Werbebanner', 'Web banner', 'Reklámbanner'],
      [1, 'Zeitung', 'Newspaper', 'Újság'],
      [1, 'Fernsehsender', 'TV channel', 'Tévécsatorna'],
      [1, 'Litfaßsäule', 'Advertising pillar', 'Hirdetőoszlop'],
      [1, 'Straßenbahn', 'Tram', 'Villamos'],
      [1, 'Website', 'Website', 'Weboldal'],
      [1, 'Radiosender', 'Radio station', 'Rádióadó'],
    ],
  },
  {
    id: 'primaer-sekundaer',
    topics: ['marktforschung', 'beschaffungsmarketing'],
    station: 'counter',
    b: { de: ['Primärforschung', 'Sekundärforschung'], en: ['Primary research', 'Secondary research'], hu: ['Primer kutatás', 'Szekunder kutatás'] },
    why: {
      de: 'Primär: Daten werden neu am Markt erhoben. Sekundär: vorhandene Daten werden ausgewertet.',
      en: 'Primary: new data is collected in the market. Secondary: existing data is analysed.',
      hu: 'Primer: új adatokat gyűjtenek a piacon. Szekunder: meglévő adatokat elemeznek.',
    },
    items: [
      [0, 'Kunden im Geschäft befragen', 'Interviewing customers in the shop', 'Vevők megkérdezése az üzletben'],
      [0, 'Online-Umfrage durchführen', 'Running an online survey', 'Online kérdőív'],
      [0, 'Kunden beim Einkaufen beobachten', 'Observing customers shopping', 'Vásárlók megfigyelése'],
      [0, 'Produkttest mit Testpersonen', 'Product test with testers', 'Terméktesztelés alanyokkal'],
      [0, 'Experten befragen', 'Interviewing experts', 'Szakértők megkérdezése'],
      [1, 'Daten der Statistik Austria auswerten', 'Analysing Statistics Austria data', 'A Statistik Austria adatainak elemzése'],
      [1, 'Kundendatei auswerten', 'Analysing the customer database', 'Az ügyféladatbázis elemzése'],
      [1, 'Prospekte der Konkurrenz vergleichen', 'Comparing competitors’ brochures', 'Versenytársak prospektusainak összevetése'],
      [1, 'Google Analytics auswerten', 'Analysing Google Analytics', 'Google Analytics elemzése'],
      [1, 'Umsatzstatistik der letzten Jahre', 'Sales figures of past years', 'Az elmúlt évek forgalmi statisztikája'],
    ],
  },
  {
    id: 'einzel-gross',
    topics: ['der-handel'],
    station: 'counter',
    b: { de: ['Einzelhandel', 'Großhandel'], en: ['Retail', 'Wholesale'], hu: ['Kiskereskedelem', 'Nagykereskedelem'] },
    why: {
      de: 'Einzelhandel verkauft an Konsumenten, Großhandel an andere Unternehmen.',
      en: 'Retail sells to consumers, wholesale sells to other businesses.',
      hu: 'A kiskereskedelem fogyasztóknak, a nagykereskedelem más vállalatoknak ad el.',
    },
    items: [
      [0, 'Supermarkt verkauft an Familien', 'Supermarket sells to families', 'Szupermarket családoknak árul'],
      [0, 'Buchhandlung im Einkaufszentrum', 'Bookshop in the mall', 'Könyvesbolt a bevásárlóközpontban'],
      [0, 'Drogeriemarkt', 'Drugstore', 'Drogéria'],
      [0, 'Sportgeschäft verkauft Ski an Urlauber', 'Sports shop sells skis to tourists', 'Sportbolt sílécet árul turistáknak'],
      [0, 'Trafik verkauft Zeitungen', 'Kiosk sells newspapers', 'Trafik újságot árul'],
      [1, 'Liefert Obst kistenweise an Restaurants', 'Supplies fruit by the crate to restaurants', 'Ládaszámra szállít gyümölcsöt éttermeknek'],
      [1, 'Abholmarkt nur für Gastronomen', 'Cash-and-carry for restaurateurs only', 'Csak vendéglátósoknak szóló nagyáruház'],
      [1, 'Baustoffhändler beliefert Baufirmen', 'Building supplier delivers to builders', 'Építőanyag-kereskedő építőcégeknek szállít'],
      [1, 'Pharmagroßhändler beliefert Apotheken', 'Pharma wholesaler supplies pharmacies', 'Gyógyszer-nagykereskedő patikáknak szállít'],
      [1, 'Getränkehändler beliefert Wirtshäuser', 'Drinks supplier delivers to pubs', 'Italkereskedő kocsmáknak szállít'],
    ],
  },
  {
    id: 'material-ware',
    topics: ['material-warenwirtschaft'],
    station: 'store',
    b: { de: ['Materialwirtschaft', 'Warenwirtschaft'], en: ['Materials management', 'Merchandise management'], hu: ['Anyaggazdálkodás', 'Árugazdálkodás'] },
    why: {
      de: 'Materialwirtschaft: Roh-, Hilfs- und Betriebsstoffe für die Produktion. Warenwirtschaft: Handelswaren zum Weiterverkauf.',
      en: 'Materials: raw materials and supplies for production. Merchandise: goods bought for resale.',
      hu: 'Anyaggazdálkodás: nyers- és segédanyagok a termeléshez. Árugazdálkodás: továbbeladásra szánt áruk.',
    },
    items: [
      [0, 'Holz für die Möbeltischlerei', 'Wood for the furniture maker', 'Fa a bútorasztalosnak'],
      [0, 'Leim in der Tischlerei', 'Glue in the joinery', 'Ragasztó az asztalosműhelyben'],
      [0, 'Schmieröl für die Maschinen', 'Lubricating oil for the machines', 'Kenőolaj a gépekhez'],
      [0, 'Stoff für die Schneiderei', 'Fabric for the tailor', 'Szövet a szabóságnak'],
      [0, 'Mehl in der Bäckerei', 'Flour in the bakery', 'Liszt a pékségben'],
      [1, 'Handys im Elektrofachhandel', 'Phones in an electronics store', 'Mobiltelefonok a műszaki boltban'],
      [1, 'Bücher in der Buchhandlung', 'Books in the bookshop', 'Könyvek a könyvesboltban'],
      [1, 'Getränke im Supermarkt', 'Drinks in the supermarket', 'Italok a szupermarketben'],
      [1, 'Ski im Sportgeschäft', 'Skis in the sports shop', 'Síléc a sportboltban'],
      [1, 'Spielzeug im Spielwarengeschäft', 'Toys in the toy shop', 'Játékok a játékboltban'],
    ],
  },
  {
    id: 'festplatz-freiplatz',
    topics: ['lager-transport-entsorgung'],
    station: 'store',
    b: { de: ['Festplatzsystem', 'Freiplatzsystem'], en: ['Fixed-location system', 'Free-location system'], hu: ['Fix helyes rendszer', 'Szabad helyes rendszer'] },
    why: {
      de: 'Festplatz: jede Ware hat ihren fixen Platz. Freiplatz (chaotisch): Ware kommt, wo Platz frei ist – mit EDV.',
      en: 'Fixed: every item has its own place. Free (chaotic): goods go wherever there’s space – needs IT.',
      hu: 'Fix hely: minden árunak saját helye van. Szabad (kaotikus): ahol van hely – informatikával.',
    },
    items: [
      [0, 'Jede Ware hat ihren fixen Platz', 'Every item has a fixed place', 'Minden árunak fix helye van'],
      [0, 'Platz muss für die größte Menge reichen', 'Space must fit the largest quantity', 'A hely a legnagyobb mennyiségre méretezett'],
      [0, 'Funktioniert auch ohne EDV', 'Works without IT', 'Informatika nélkül is működik'],
      [0, 'Gut für Gefahrengüter', 'Suitable for hazardous goods', 'Veszélyes árukhoz alkalmas'],
      [0, 'Lagerarbeiter kennen die Plätze auswendig', 'Staff know the places by heart', 'A raktárosok fejből tudják a helyeket'],
      [1, 'Ware kommt dorthin, wo Platz frei ist', 'Goods go where space is free', 'Az áru oda kerül, ahol hely van'],
      [1, 'Optimale Platznutzung', 'Optimal use of space', 'Optimális helykihasználás'],
      [1, 'Braucht ein EDV-System', 'Needs an IT system', 'Informatikai rendszer kell hozzá'],
      [1, 'Typisch für Amazon-Logistikzentren', 'Typical of Amazon warehouses', 'Jellemző az Amazon raktáraira'],
      [1, 'Auch „chaotische Lagerung“ genannt', 'Also called “chaotic storage”', '„Kaotikus raktározásnak” is hívják'],
    ],
  },
  {
    id: 'import-export',
    topics: ['kaufvertraege-aussenhandel'],
    station: 'dock',
    b: { de: ['Import (Einfuhr)', 'Export (Ausfuhr)'], en: ['Import', 'Export'], hu: ['Import (behozatal)', 'Export (kivitel)'] },
    why: {
      de: 'Aus Sicht Österreichs: Import = Ware kommt herein, Export = Ware geht ins Ausland.',
      en: 'From Austria’s point of view: import = goods come in, export = goods go abroad.',
      hu: 'Ausztria szemszögéből: import = az áru bejön, export = az áru külföldre megy.',
    },
    items: [
      [0, 'Wiener Café kauft Kaffee aus Brasilien', 'Vienna café buys coffee from Brazil', 'Bécsi kávézó brazil kávét vesz'],
      [0, 'Loopy & Co. bestellt Kakao aus Ghana', 'Loopy & Co. orders cocoa from Ghana', 'A Loopy & Co. Ghánából rendel kakaót'],
      [0, 'Linzer Autohaus kauft Autos aus Japan', 'Linz car dealer buys cars from Japan', 'Linzi autókereskedés japán autókat vesz'],
      [0, 'Supermarkt kauft Bananen aus Ecuador', 'Supermarket buys bananas from Ecuador', 'Szupermarket ecuadori banánt vesz'],
      [0, 'Grazer Shop bezieht Jeans aus der Türkei', 'Graz shop buys jeans from Turkey', 'Grazi bolt Törökországból hoz farmert'],
      [1, 'Tiroler Skifirma liefert nach Kanada', 'Tyrolean ski maker ships to Canada', 'Tiroli sígyártó Kanadába szállít'],
      [1, 'Salzburger Brauerei verkauft in die USA', 'Salzburg brewery sells to the USA', 'Salzburgi sörfőzde az USA-ba ad el'],
      [1, 'Steirisches Kürbiskernöl geht nach Japan', 'Styrian pumpkin seed oil goes to Japan', 'Stájer tökmagolaj megy Japánba'],
      [1, 'Vorarlberger Firma liefert in die Schweiz', 'Vorarlberg firm delivers to Switzerland', 'Vorarlbergi cég Svájcba szállít'],
      [1, 'Kärntner Sägewerk liefert nach China', 'Carinthian sawmill ships to China', 'Karintiai fűrészüzem Kínába szállít'],
    ],
  },
  {
    id: 'fix-variabel',
    topics: ['produktionsbetriebe', 'businessplan-3jg', 'investitionsmanagement', 'leistungserstellungsprozess-produktion'],
    station: 'store',
    b: { de: ['Fixkosten', 'Variable Kosten'], en: ['Fixed costs', 'Variable costs'], hu: ['Fix költségek', 'Változó költségek'] },
    why: {
      de: 'Fixkosten fallen auch ohne Produktion an. Variable Kosten steigen mit jeder produzierten Menge.',
      en: 'Fixed costs arise even without production. Variable costs rise with every unit produced.',
      hu: 'A fix költség termelés nélkül is felmerül. A változó költség minden legyártott egységgel nő.',
    },
    items: [
      [0, 'Miete für die Halle', 'Rent for the factory hall', 'A csarnok bérleti díja'],
      [0, 'Gehälter der Büroangestellten', 'Office staff salaries', 'Irodai dolgozók fizetése'],
      [0, 'Versicherungsprämie', 'Insurance premium', 'Biztosítási díj'],
      [0, 'Leasingrate für die Maschine', 'Lease payment for the machine', 'A gép lízingdíja'],
      [0, 'Kreditzinsen', 'Interest on loans', 'Hitelkamat'],
      [0, 'Abschreibung der Maschine', 'Depreciation of the machine', 'A gép értékcsökkenése'],
      [1, 'Rohstoffe für jedes Stück', 'Raw materials for each unit', 'Nyersanyag minden darabhoz'],
      [1, 'Verpackung je Produkt', 'Packaging per product', 'Csomagolás termékenként'],
      [1, 'Strom für die laufenden Maschinen', 'Power for the running machines', 'Áram a működő gépekhez'],
      [1, 'Frachtkosten je Lieferung', 'Freight costs per delivery', 'Fuvarköltség szállításonként'],
      [1, 'Verkaufsprovision je Stück', 'Sales commission per unit', 'Értékesítési jutalék darabonként'],
      [1, 'Wareneinsatz', 'Cost of goods sold', 'Áruk beszerzési értéke'],
    ],
  },
  {
    id: 'eigen-fremd',
    topics: ['finanzmanagement', 'investition-finanzierung-ueberblick'],
    station: 'mail',
    b: { de: ['Eigenfinanzierung', 'Fremdfinanzierung'], en: ['Equity financing', 'Debt financing'], hu: ['Sajáttőke-finanszírozás', 'Idegentőke-finanszírozás'] },
    why: {
      de: 'Eigenfinanzierung: Kapital von den Eigentümern. Fremdfinanzierung: Kapital von Gläubigern – befristet, mit Zinsen.',
      en: 'Equity: capital from the owners. Debt: capital from creditors – for a limited time, with interest.',
      hu: 'Saját tőke: a tulajdonosoktól. Idegen tőke: hitelezőktől – határozott időre, kamattal.',
    },
    items: [
      [0, 'Gesellschafterin zahlt 20.000 € ein', 'Partner pays in €20,000', 'Egy tag 20 000 €-t fizet be'],
      [0, 'Neue Aktien werden ausgegeben', 'New shares are issued', 'Új részvényeket bocsátanak ki'],
      [0, 'Ein neuer Gesellschafter steigt ein', 'A new partner joins', 'Új tag lép be'],
      [0, 'Gewinn bleibt im Unternehmen', 'Profit is kept in the business', 'A nyereség a cégben marad'],
      [0, 'Eigentümer bringt sein Auto ein', 'Owner contributes his car', 'A tulajdonos bevezeti az autóját'],
      [1, 'Bankkredit für eine Maschine', 'Bank loan for a machine', 'Bankhitel egy gépre'],
      [1, 'Kontokorrentkredit', 'Overdraft facility', 'Folyószámlahitel'],
      [1, 'Lieferant gewährt ein Zahlungsziel', 'Supplier grants payment terms', 'A szállító fizetési halasztást ad'],
      [1, 'Unternehmen gibt eine Anleihe aus', 'Company issues a bond', 'A cég kötvényt bocsát ki'],
      [1, 'Kunde leistet eine Anzahlung', 'Customer makes a down payment', 'A vevő előleget fizet'],
    ],
  },
  {
    id: 'aufbau-ablauf',
    topics: ['organisieren-und-fuehren'],
    station: 'mail',
    b: { de: ['Aufbauorganisation', 'Ablauforganisation'], en: ['Organisational structure', 'Process organisation'], hu: ['Szervezeti felépítés', 'Folyamatszervezés'] },
    why: {
      de: 'Aufbau: Wer ist wofür zuständig (Stellen, Abteilungen)? Ablauf: In welcher Reihenfolge läuft die Arbeit?',
      en: 'Structure: who is responsible for what (positions, departments)? Process: in what order is the work done?',
      hu: 'Felépítés: ki miért felel (munkakörök, osztályok)? Folyamat: milyen sorrendben zajlik a munka?',
    },
    items: [
      [0, 'Organigramm', 'Organisation chart', 'Szervezeti ábra'],
      [0, 'Stellen und Abteilungen bilden', 'Creating positions and departments', 'Munkakörök és osztályok kialakítása'],
      [0, 'Wer ist wem vorgesetzt?', 'Who reports to whom?', 'Ki kinek a felettese?'],
      [0, 'Stellenbeschreibung', 'Job description', 'Munkaköri leírás'],
      [0, 'Einliniensystem', 'Single-line system', 'Egyvonalas rendszer'],
      [1, 'Flussdiagramm', 'Flowchart', 'Folyamatábra'],
      [1, 'Reihenfolge der Arbeitsschritte', 'Order of the work steps', 'A munkalépések sorrendje'],
      [1, 'Durchlaufzeit verkürzen', 'Shortening the lead time', 'Az átfutási idő csökkentése'],
      [1, 'Prozess „Bestellung bearbeiten“', 'Process “handle an order”', '„Rendelés feldolgozása” folyamat'],
      [1, 'Wer macht wann was?', 'Who does what and when?', 'Ki mikor mit csinál?'],
    ],
  },
  {
    id: 'herzberg',
    topics: ['personaleinsatzgestaltung'],
    station: 'mail',
    b: { de: ['Motivator', 'Hygienefaktor'], en: ['Motivator', 'Hygiene factor'], hu: ['Motivátor', 'Higiéniai tényező'] },
    why: {
      de: 'Motivatoren machen zufrieden (die Arbeit selbst). Hygienefaktoren verhindern nur Unzufriedenheit (Umfeld).',
      en: 'Motivators create satisfaction (the work itself). Hygiene factors only prevent dissatisfaction (environment).',
      hu: 'A motivátorok elégedettséget okoznak (maga a munka). A higiéniai tényezők csak az elégedetlenséget előzik meg.',
    },
    items: [
      [0, 'Anerkennung für gute Arbeit', 'Recognition for good work', 'Elismerés a jó munkáért'],
      [0, 'Verantwortung übernehmen', 'Taking on responsibility', 'Felelősségvállalás'],
      [0, 'Interessante Aufgaben', 'Interesting tasks', 'Érdekes feladatok'],
      [0, 'Aufstiegsmöglichkeiten', 'Chances of promotion', 'Előrelépési lehetőségek'],
      [0, 'Erfolgserlebnisse', 'Sense of achievement', 'Sikerélmény'],
      [1, 'Gehalt', 'Salary', 'Fizetés'],
      [1, 'Arbeitsbedingungen (Licht, Lärm)', 'Working conditions (light, noise)', 'Munkakörülmények (fény, zaj)'],
      [1, 'Verhältnis zu den Kollegen', 'Relationship with colleagues', 'Kapcsolat a kollégákkal'],
      [1, 'Sicherer Arbeitsplatz', 'Job security', 'Biztos munkahely'],
      [1, 'Unternehmenspolitik', 'Company policy', 'Vállalati politika'],
    ],
  },
  {
    id: 'personalsuche',
    topics: ['personalbedarfsplanung'],
    station: 'mail',
    b: { de: ['Interne Personalsuche', 'Externe Personalsuche'], en: ['Internal recruiting', 'External recruiting'], hu: ['Belső toborzás', 'Külső toborzás'] },
    why: {
      de: 'Intern: Lösung mit dem vorhandenen Personal. Extern: neue Leute von außen.',
      en: 'Internal: solved with existing staff. External: new people from outside.',
      hu: 'Belső: a meglévő munkatársakkal. Külső: új emberek kívülről.',
    },
    items: [
      [0, 'Beförderung einer Mitarbeiterin', 'Promoting an employee', 'Egy munkatárs előléptetése'],
      [0, 'Versetzung aus einer anderen Abteilung', 'Transfer from another department', 'Áthelyezés egy másik osztályról'],
      [0, 'Innerbetriebliche Ausschreibung', 'Internal job posting', 'Belső álláshirdetés'],
      [0, 'Überstunden anordnen', 'Ordering overtime', 'Túlóra elrendelése'],
      [0, 'Mitarbeiter weiterbilden', 'Training existing staff', 'Munkatársak továbbképzése'],
      [1, 'Inserat auf einer Jobbörse', 'Ad on a job board', 'Hirdetés egy állásportálon'],
      [1, 'AMS einschalten', 'Asking the public employment service (AMS)', 'Az AMS (munkaügyi szolgálat) bevonása'],
      [1, 'Headhunter beauftragen', 'Hiring a headhunter', 'Fejvadász megbízása'],
      [1, 'Personalleasing', 'Temporary staffing agency', 'Munkaerő-kölcsönzés'],
      [1, 'Stand auf einer Jobmesse', 'Stand at a job fair', 'Stand egy állásbörzén'],
    ],
  },
  {
    id: 'auftrag-vorrat',
    topics: ['leistungserstellungsprozess-produktion', 'produktionsbetriebe'],
    station: 'store',
    b: { de: ['Auftragsproduktion', 'Vorratsproduktion'], en: ['Make to order', 'Make to stock'], hu: ['Rendelésre gyártás', 'Készletre gyártás'] },
    why: {
      de: 'Auftrag: Produktion erst bei konkretem Kundenauftrag. Vorrat: Produktion nach erwarteter Absatzmenge.',
      en: 'To order: production starts with a specific customer order. To stock: production based on expected sales.',
      hu: 'Rendelésre: a gyártás konkrét megrendeléssel indul. Készletre: a várható eladások alapján.',
    },
    items: [
      [0, 'Maßgeschneiderter Anzug', 'Tailor-made suit', 'Méretre szabott öltöny'],
      [0, 'Hochzeitstorte nach Wunsch', 'Custom wedding cake', 'Esküvői torta egyedi kérésre'],
      [0, 'Spritzgießmaschine für einen Kunden', 'Injection moulding machine for a client', 'Fröccsöntő gép egy megrendelőnek'],
      [0, 'Einbauküche nach Maß', 'Made-to-measure fitted kitchen', 'Méretre készült beépített konyha'],
      [0, 'Yacht nach Sonderwunsch', 'Custom-built yacht', 'Egyedi kérésre épített jacht'],
      [1, 'Waschmittel', 'Washing powder', 'Mosószer'],
      [1, 'Mineralwasser', 'Mineral water', 'Ásványvíz'],
      [1, 'Zahnpasta', 'Toothpaste', 'Fogkrém'],
      [1, 'Schrauben in Standardgrößen', 'Standard-size screws', 'Szabványos csavarok'],
      [1, 'Schokoriegel', 'Chocolate bars', 'Csokiszelet'],
    ],
  },
]
export const SORT_SET_COUNT = SORT_SETS.length

function makeSort(ctx) {
  const { rng, lang } = ctx
  const pool = choosePool(ctx, SORT_SETS, (s) => `sort:${s.id}`)
  if (!pool.length) return null
  const set = pick(rng, pool)
  const by = [0, 1].map((b) => shuffle(rng, set.items.filter((it) => it[0] === b)))
  const n0 = Math.min(by[0].length, 6 - Math.min(2, by[1].length), Math.max(2, pick(rng, [2, 3, 3, 4])))
  const chosen = shuffle(rng, [...by[0].slice(0, n0), ...by[1].slice(0, 6 - n0)])
  const col = { de: 1, en: 2, hu: 3 }[lang]
  const buckets = L(lang, set.b)
  const items = chosen.map((it, i) => ({ id: `${set.id}-${set.items.indexOf(it)}`, n: i, text: it[col], bucket: it[0] }))
  const ex = items.find((x) => x.bucket === 0)
  return {
    kind: 'sort',
    key: `sort:${set.id}`,
    setId: set.id,
    title: L(lang, { de: `${buckets[0]} oder ${buckets[1]}?`, en: `${buckets[0]} or ${buckets[1]}?`, hu: `${buckets[0]} vagy ${buckets[1]}?` }),
    prompt: L(lang, {
      de: 'Sortiere die 6 Kärtchen in den richtigen Korb.',
      en: 'Sort the 6 cards into the right basket.',
      hu: 'Válogasd a 6 kártyát a megfelelő kosárba.',
    }),
    topicIds: set.topics,
    station: set.station,
    buckets,
    items,
    explanation: L(lang, set.why),
    summary: L(lang, {
      de: `${buckets[0]} oder ${buckets[1]}: z. B. ${ex.text} → ${buckets[0]}`,
      en: `${buckets[0]} or ${buckets[1]}: e.g. ${ex.text} → ${buckets[0]}`,
      hu: `${buckets[0]} vagy ${buckets[1]}: pl. ${ex.text} → ${buckets[0]}`,
    }),
  }
}

// =====================================================================
// 4) ZUORDNEN (Post, Aquarium) – 4 Begriffe ↔ kurze Erklärungen
// =====================================================================
// [topic, de-Begriff, de-Erklärung, en-Begriff, en-Erklärung, hu-Begriff, hu-Erklärung]  (Erklärungen ≤ 70 Zeichen)
const PAIRS = [
  ['grundlagen-des-wirtschaftens', 'Bedürfnis', 'Gefühl eines Mangels, das man beseitigen will', 'Need', 'Feeling of lacking something that you want to remove', 'Szükséglet', 'Hiányérzet, amelyet meg akarunk szüntetni'],
  ['grundlagen-des-wirtschaftens', 'Knappheit', 'Die Mittel reichen nie für alle Wünsche', 'Scarcity', 'Resources are never enough for all wishes', 'Szűkösség', 'Az erőforrások sosem elegendők minden vágyra'],
  ['grundlagen-des-wirtschaftens', 'Subventionen', 'Zuschüsse des Staates an Unternehmen oder Haushalte', 'Subsidies', 'Grants from the state to businesses or households', 'Támogatások', 'Állami juttatás vállalatoknak vagy háztartásoknak'],
  ['der-markt', 'Markt', 'Ort, an dem Angebot und Nachfrage zusammentreffen', 'Market', 'Where supply and demand meet', 'Piac', 'Ahol a kínálat és a kereslet találkozik'],
  ['der-markt', 'Gleichgewichtspreis', 'Preis, bei dem Angebot und Nachfrage gleich groß sind', 'Equilibrium price', 'Price at which supply equals demand', 'Egyensúlyi ár', 'Az az ár, amelynél a kínálat és a kereslet egyenlő'],
  ['unternehmen-und-umfeld', 'Stakeholder', 'Gruppen, die Interesse am Unternehmen haben', 'Stakeholders', 'Groups with an interest in the company', 'Stakeholderek', 'Csoportok, amelyeknek érdekük fűződik a céghez'],
  ['unternehmen-und-umfeld', 'Liquidität', 'Fähigkeit, Rechnungen pünktlich zu bezahlen', 'Liquidity', 'Ability to pay bills on time', 'Likviditás', 'Képesség a számlák időben történő kifizetésére'],
  ['leistungserstellung-1jg', 'Umlaufvermögen', 'Vermögen, das sich laufend ändert (Waren, Geld)', 'Current assets', 'Assets that keep changing (goods, cash)', 'Forgóeszközök', 'Folyamatosan változó vagyon (áru, pénz)'],
  ['phasen-kaufen-verkaufen', 'Anfrage', 'Käufer erkundigt sich unverbindlich nach Ware und Preis', 'Enquiry', 'Buyer asks about goods and prices, without obligation', 'Ajánlatkérés', 'A vevő kötelezettség nélkül érdeklődik áruról és árról'],
  ['phasen-kaufen-verkaufen', 'Angebot', 'Verbindliche Erklärung des Verkäufers, zu liefern', 'Offer', 'Seller’s binding statement that it will deliver', 'Ajánlat', 'Az eladó kötelező érvényű szállítási nyilatkozata'],
  ['phasen-kaufen-verkaufen', 'Freizeichnungsklausel', 'Macht ein Angebot unverbindlich, z. B. „solange der Vorrat reicht“', 'Disclaimer clause', 'Makes an offer non-binding, e.g. “while stocks last”', 'Kötelezettségkizáró záradék', 'Kötetlenné teszi az ajánlatot, pl. „a készlet erejéig”'],
  ['bestandteile-kaufvertrag', 'Rabatt', 'Preisnachlass, z. B. für große Mengen oder Stammkunden', 'Discount (Rabatt)', 'Price reduction, e.g. for large orders or regular customers', 'Rabatt', 'Árengedmény, pl. nagy mennyiségre vagy törzsvevőknek'],
  ['bestandteile-kaufvertrag', 'Skonto', 'Abzug für Zahlung innerhalb der Kassafrist', 'Cash discount (Skonto)', 'Deduction for paying within the discount period', 'Skontó', 'Levonás a skontóhatáridőn belüli fizetésért'],
  ['bestandteile-kaufvertrag', 'Erfüllungsort', 'Ort, an dem Eigentum, Risiko und Kosten übergehen', 'Place of fulfilment', 'Place where ownership, risk and costs pass over', 'Teljesítési hely', 'Ahol a tulajdon, a kockázat és a költség átszáll'],
  ['bestandteile-kaufvertrag', 'Einstandspreis', 'Was die Ware im Einkauf wirklich kostet', 'Landed cost', 'What the goods really cost when you buy them', 'Beszerzési ár', 'Amibe az áru beszerzéskor valójában kerül'],
  ['schriftverkehr-kaufvertrag', 'Auftragsbestätigung', 'Verkäufer bestätigt die Bestellung', 'Order confirmation', 'Seller confirms the order', 'Rendelés-visszaigazolás', 'Az eladó megerősíti a rendelést'],
  ['schriftverkehr-kaufvertrag', 'Gegenangebot', 'Antwort auf ein Angebot mit geänderten Bedingungen', 'Counter-offer', 'Reply to an offer with changed conditions', 'Ellenajánlat', 'Válasz egy ajánlatra módosított feltételekkel'],
  ['zahlungsformen-1jg', 'IBAN', 'Internationale Kontonummer für Überweisungen', 'IBAN', 'International account number for transfers', 'IBAN', 'Nemzetközi bankszámlaszám átutalásokhoz'],
  ['zahlungsformen-1jg', 'Debitkarte', 'Bankkarte: Betrag wird gleich vom Konto abgebucht', 'Debit card', 'Bank card: the amount is taken straight from the account', 'Betéti kártya', 'Bankkártya: az összeget azonnal levonják a számláról'],
  ['zahlungsformen-1jg', 'Zwei-Faktor-Authentifizierung', 'Anmeldung mit zwei unabhängigen Nachweisen', 'Two-factor authentication', 'Login with two independent proofs', 'Kétfaktoros hitelesítés', 'Bejelentkezés két független azonosítóval'],
  ['unzuverlaessige-verkaeufer', 'Mängelrüge', 'Käufer meldet dem Verkäufer einen Mangel', 'Notice of defects', 'Buyer reports a defect to the seller', 'Hibabejelentés', 'A vevő jelzi az eladónak a hibát'],
  ['unzuverlaessige-verkaeufer', 'Deckungskauf', 'Käufer kauft woanders, Verkäufer zahlt die Mehrkosten', 'Substitute purchase', 'Buyer buys elsewhere, the seller pays the extra cost', 'Fedezeti vétel', 'A vevő máshol vásárol, a többletet az eladó fizeti'],
  ['unzuverlaessige-verkaeufer', 'Kulanz', 'Entgegenkommen ohne rechtliche Pflicht', 'Goodwill', 'Accommodating the customer without a legal duty', 'Kulancia', 'Jogi kötelezettség nélküli előzékenység'],
  ['unzuverlaessige-kaeufer', 'Annahmeverzug', 'Käufer nimmt die vertragsgemäße Ware nicht an', 'Default of acceptance', 'Buyer doesn’t accept goods delivered as agreed', 'Átvételi késedelem', 'A vevő nem veszi át a szerződésszerű árut'],
  ['unzuverlaessige-kaeufer', 'Zahlungsverzug', 'Käufer zahlt nicht rechtzeitig', 'Default of payment', 'Buyer doesn’t pay on time', 'Fizetési késedelem', 'A vevő nem fizet időben'],
  ['unzuverlaessige-kaeufer', 'Verzugszinsen', 'Zinsen, die bei verspäteter Zahlung anfallen', 'Default interest', 'Interest charged on late payment', 'Késedelmi kamat', 'Késedelmes fizetés esetén felszámított kamat'],
  ['fernabsatz-ecommerce', 'Fernabsatz', 'Vertrag ohne gleichzeitige Anwesenheit, z. B. online', 'Distance selling', 'Contract without meeting in person, e.g. online', 'Távértékesítés', 'Szerződés személyes jelenlét nélkül, pl. online'],
  ['ruecktrittsrechte', 'Rücktritt im Fernabsatz', 'Innerhalb von 14 Tagen, ohne Gründe anzugeben', 'Withdrawal (distance selling)', 'Within 14 days, without giving reasons', 'Elállás (távértékesítés)', '14 napon belül, indoklás nélkül'],
  ['unternehmensgruendung-schritte', 'Gewerbeberechtigung', 'Erlaubnis, ein Gewerbe auszuüben', 'Trade licence', 'Permission to carry on a trade', 'Iparjogosítvány', 'Engedély egy ipari tevékenység folytatására'],
  ['unternehmensgruendung-schritte', 'Franchising', 'Gegen Gebühr ein fertiges Geschäftskonzept nutzen', 'Franchising', 'Using a proven business concept for a fee', 'Franchise', 'Díj fejében egy kész üzleti koncepció használata'],
  ['wahl-der-rechtsform-1jg', 'Einzelunternehmen', 'Eine Person führt den Betrieb und haftet unbeschränkt', 'Sole proprietorship', 'One person runs the business with unlimited liability', 'Egyéni vállalkozás', 'Egy személy vezeti és korlátlanul felel'],
  ['businessplan-1jg', 'Businessplan', 'Schriftliches Konzept der Geschäftsidee mit Finanzplan', 'Business plan', 'Written concept of the business idea with a financial plan', 'Üzleti terv', 'Az üzleti ötlet írásos koncepciója pénzügyi tervvel'],
  ['vertraege-mitarbeiter', 'Dienstzettel', 'Schriftliche Übersicht über die wichtigsten Arbeitsbedingungen', 'Statement of employment', 'Written summary of the main terms of employment', 'Munkaszerződési összesítő', 'A legfontosabb munkafeltételek írásos összefoglalója'],
  ['unternehmer-firma-firmenbuch', 'Firma', 'Name, unter dem ein Unternehmen im Firmenbuch steht', 'Company name (Firma)', 'Name under which a business is in the company register', 'Cégnév', 'Név, amelyen a vállalkozás a cégjegyzékben szerepel'],
  ['unternehmer-firma-firmenbuch', 'Firmenbuch', 'Öffentliches Verzeichnis mit den wichtigsten Unternehmensdaten', 'Company register', 'Public register with the key data of companies', 'Cégjegyzék', 'Nyilvános jegyzék a vállalkozások fő adataival'],
  ['rechtsformen-unternehmen', 'GmbH', 'Kapitalgesellschaft, Gesellschafter haften nicht persönlich', 'GmbH', 'Limited company: partners are not personally liable', 'GmbH', 'Tőketársaság, a tagok nem felelnek személyesen'],
  ['rechtsformen-unternehmen', 'OG', 'Alle Gesellschafter haften unbeschränkt und solidarisch', 'OG', 'General partnership: all partners fully and jointly liable', 'OG', 'Közkereseti társaság: minden tag korlátlanul, egyetemlegesen felel'],
  ['rechtsformen-unternehmen', 'KG', 'Komplementär haftet unbeschränkt, Kommanditist nur bis zur Haftsumme', 'KG', 'General partner fully liable, limited partner up to a set sum', 'KG', 'Beltag korlátlanul, kültag csak a vállalt összegig felel'],
  ['rechtsformen-unternehmen', 'Dividende', 'Gewinnanteil, der pro Aktie ausgezahlt wird', 'Dividend', 'Share of profit paid out per share', 'Osztalék', 'Részvényenként kifizetett nyereségrész'],
  ['vollmachten', 'Prokura', 'Umfangreichste Vollmacht, im Firmenbuch eingetragen', 'Prokura', 'Broadest commercial power, entered in the company register', 'Prokura', 'A legszélesebb meghatalmazás, a cégjegyzékbe bejegyezve'],
  ['vollmachten', 'Handlungsvollmacht', 'Vollmacht für die gewöhnlichen Geschäfte des Betriebs', 'Commercial power of attorney', 'Power for the usual business of the firm', 'Kereskedelmi meghatalmazás', 'Meghatalmazás a cég szokásos ügyleteire'],
  ['beschaeftigungsverhaeltnisse', 'Werkvertrag', 'Man schuldet ein fertiges Werk, nicht die Arbeitszeit', 'Contract for work', 'You owe a finished result, not your working time', 'Vállalkozási szerződés', 'Kész eredménnyel tartozunk, nem munkaidővel'],
  ['beschaeftigungsverhaeltnisse', 'Freier Dienstvertrag', 'Arbeit gegen Entgelt, aber ohne Weisungen und fixe Arbeitszeit', 'Freelance service contract', 'Paid work, but without instructions or fixed hours', 'Szabad szolgáltatási szerződés', 'Fizetett munka, de utasítások és kötött munkaidő nélkül'],
  ['kaufvertraege-aussenhandel', 'Incoterms', 'Internationale Klauseln: Wer trägt Kosten und Risiko?', 'Incoterms', 'International clauses: who bears costs and risk?', 'Incoterms', 'Nemzetközi klauzulák: ki viseli a költséget és a kockázatot?'],
  ['kaufvertraege-aussenhandel', 'Dokumentenakkreditiv', 'Bank zahlt gegen Vorlage der Versanddokumente', 'Documentary credit', 'Bank pays when the shipping documents are presented', 'Okmányos meghitelezés', 'A bank a szállítási okmányok bemutatásakor fizet'],
  ['kaufvertraege-aussenhandel', 'Wechselkursrisiko', 'Fremdwährung kann teurer oder billiger werden', 'Exchange rate risk', 'A foreign currency can become dearer or cheaper', 'Árfolyamkockázat', 'A deviza drágulhat vagy olcsóbbodhat'],
  ['kunde-im-mittelpunkt', 'USP', 'Einzigartiger Vorteil gegenüber der Konkurrenz', 'USP', 'Unique advantage over the competition', 'USP', 'Egyedi előny a versenytársakkal szemben'],
  ['kunde-im-mittelpunkt', 'Marketingmix', 'Kombination aus Produkt, Preis, Vertrieb und Kommunikation', 'Marketing mix', 'Combination of product, price, place and promotion', 'Marketingmix', 'A termék, ár, értékesítés és kommunikáció együttese'],
  ['marktforschung', 'Primärforschung', 'Daten werden neu und direkt am Markt erhoben', 'Primary research', 'New data is collected directly in the market', 'Primer kutatás', 'Új adatok gyűjtése közvetlenül a piacon'],
  ['marktforschung', 'Sekundärforschung', 'Bereits vorhandene Daten werden ausgewertet', 'Secondary research', 'Existing data is analysed', 'Szekunder kutatás', 'Már meglévő adatok elemzése'],
  ['instrumente-marketings', 'Produktlebenszyklus', 'Phasen eines Produkts von der Einführung bis zum Rückgang', 'Product life cycle', 'Stages of a product from launch to decline', 'Termék-életciklus', 'A termék szakaszai a bevezetéstől a hanyatlásig'],
  ['instrumente-marketings', 'Greenwashing', 'Sich umweltfreundlicher darstellen, als man ist', 'Greenwashing', 'Presenting yourself as greener than you are', 'Zöldrefestés', 'Környezetbarátabbnak mutatni magunkat, mint valójában'],
  ['instrumente-marketings', 'Shrinkflation', 'Weniger Inhalt zum gleichen Preis', 'Shrinkflation', 'Less content for the same price', 'Zsugorinfláció', 'Kevesebb tartalom ugyanazért az árért'],
  ['beschaffungsmarketing', 'ABC-Analyse', 'Teilt Güter nach ihrem Wertanteil ein', 'ABC analysis', 'Groups goods by their share of the total value', 'ABC-elemzés', 'Az árukat értékarányuk szerint csoportosítja'],
  ['beschaffungsmarketing', 'Meldebestand', 'Bestand, bei dem nachbestellt werden muss', 'Reorder level', 'Stock level at which you must reorder', 'Rendelési pont', 'Készletszint, amelynél újra kell rendelni'],
  ['lager-transport-entsorgung', 'Freiplatzsystem', 'Ware kommt dorthin, wo gerade Platz frei ist', 'Free-location system', 'Goods go wherever there is free space', 'Szabad helyes rendszer', 'Az áru oda kerül, ahol éppen van hely'],
  ['supply-chain-management', 'Supply Chain', 'Lieferkette vom Rohstoff bis zur Kundschaft', 'Supply chain', 'Chain from the raw material to the customer', 'Ellátási lánc', 'A nyersanyagtól a vevőig tartó lánc'],
  ['logistik', 'Kombinierter Verkehr', 'Transport mit mehreren Verkehrsmitteln, z. B. Lkw + Bahn', 'Combined transport', 'Transport using several modes, e.g. truck + rail', 'Kombinált fuvarozás', 'Szállítás több eszközzel, pl. kamion + vasút'],
  ['der-handel', 'Großhandel', 'Verkauft an andere Unternehmen, nicht an Konsumenten', 'Wholesale', 'Sells to other businesses, not to consumers', 'Nagykereskedelem', 'Más vállalatoknak ad el, nem fogyasztóknak'],
  ['normatives-management', 'Unternehmensleitbild', 'Beschreibt Werte, Mission und Vision des Unternehmens', 'Mission statement', 'Describes the company’s values, mission and vision', 'Vállalati irányelvek', 'A vállalat értékei, küldetése és víziója'],
  ['normatives-management', 'CSR', 'Freiwillige soziale und ökologische Verantwortung', 'CSR', 'Voluntary social and environmental responsibility', 'CSR', 'Önkéntes társadalmi és környezeti felelősségvállalás'],
  ['strategisches-operatives-management', 'SWOT-Analyse', 'Stärken, Schwächen, Chancen und Risiken im Überblick', 'SWOT analysis', 'Overview of strengths, weaknesses, opportunities, threats', 'SWOT-elemzés', 'Erősségek, gyengeségek, lehetőségek és veszélyek'],
  ['strategisches-operatives-management', 'Benchmarking', 'Vergleich mit den Besten der Branche', 'Benchmarking', 'Comparing yourself with the best in the industry', 'Benchmarking', 'Összehasonlítás az iparág legjobbjaival'],
  ['organisieren-und-fuehren', 'Stelle', 'Kleinste organisatorische Einheit: Aufgaben für eine Person', 'Position', 'Smallest organisational unit: tasks for one person', 'Munkakör', 'A legkisebb szervezeti egység: egy személy feladatai'],
  ['personalbedarfsplanung', 'Stellenbeschreibung', 'Legt Aufgaben, Befugnisse und Anforderungen einer Stelle fest', 'Job description', 'Sets out a job’s tasks, powers and requirements', 'Munkaköri leírás', 'Rögzíti a munkakör feladatait, jogköreit és követelményeit'],
  ['personaleinsatzgestaltung', 'Konkurrenzverbot', 'Arbeitnehmer darf dem Arbeitgeber keine Konkurrenz machen', 'Non-compete clause', 'Employee may not compete with the employer', 'Versenytilalom', 'A munkavállaló nem versenyezhet a munkáltatójával'],
  ['personalbeurteilung', 'Sabbatical', 'Längere Auszeit vom Job mit Rückkehrrecht', 'Sabbatical', 'Longer break from work with the right to return', 'Sabbatical', 'Hosszabb kimaradás a munkából, visszatérési joggal'],
  ['produktionsbetriebe', 'Fixkostendegression', 'Fixkosten pro Stück sinken, je mehr produziert wird', 'Fixed cost degression', 'Fixed cost per unit falls as output rises', 'Fixköltség-degresszió', 'Az egy darabra jutó fix költség csökken a mennyiséggel'],
  ['leistungserstellungsprozess-produktion', 'Kapazität', 'Maximale Leistung eines Betriebs in einer Periode', 'Capacity', 'Maximum output of a business in a period', 'Kapacitás', 'Egy üzem maximális teljesítménye egy időszak alatt'],
  ['leistungserstellungsprozess-produktion', 'Deckungsbeitrag', 'Erlöse minus variable Kosten', 'Contribution margin', 'Revenue minus variable costs', 'Fedezeti hozzájárulás', 'Árbevétel mínusz változó költségek'],
  ['investitionsmanagement', 'Amortisationsdauer', 'Zeit, bis eine Investition ihr Geld zurückgebracht hat', 'Payback period', 'Time until an investment has paid for itself', 'Megtérülési idő', 'Az idő, amíg egy beruházás megtérül'],
  ['finanzmanagement', 'Leasing', 'Ein Gut mieten statt kaufen', 'Leasing', 'Renting an asset instead of buying it', 'Lízing', 'Egy eszköz bérlése vásárlás helyett'],
  ['finanzmanagement', 'Factoring', 'Forderungen an eine Factoring-Gesellschaft verkaufen', 'Factoring', 'Selling receivables to a factoring company', 'Faktoring', 'Követelések eladása egy faktorcégnek'],
  ['finanzmanagement', 'Bürgschaft', 'Eine Person haftet, falls der Schuldner nicht zahlt', 'Guarantee (surety)', 'A person is liable if the debtor doesn’t pay', 'Kezesség', 'Valaki helytáll, ha az adós nem fizet'],
  ['finanzplan-analyse', 'Eigenkapitalquote', 'Anteil des Eigenkapitals am Gesamtkapital', 'Equity ratio', 'Share of equity in total capital', 'Sajáttőke-arány', 'A saját tőke részaránya az összes tőkében'],
  ['finanzplan-analyse', 'Cashflow', 'Geldüberschuss aus der laufenden Geschäftstätigkeit', 'Cash flow', 'Cash surplus from day-to-day business', 'Cash flow', 'A működésből származó pénztöbblet'],
  ['businessplan-3jg', 'Break-even-Point', 'Umsatz, ab dem das Unternehmen Gewinn macht', 'Break-even point', 'Sales level from which the business makes a profit', 'Fedezeti pont', 'Az az árbevétel, amelytől a cég nyereséges'],
  ['businessplan-3jg', 'Rohertrag', 'Umsatz minus Wareneinsatz', 'Gross profit', 'Revenue minus cost of goods sold', 'Bruttó fedezet', 'Árbevétel mínusz az eladott áruk beszerzési értéke'],
  ['investition-finanzierung-ueberblick', 'Investition', 'Geld wird langfristig in Vermögen angelegt', 'Investment', 'Money is tied up long-term in assets', 'Beruházás', 'Pénz hosszú távú lekötése eszközökben'],
].map(([topic, dt, dd, et, ed, ht, hd]) => ({ topics: [topic], de: { t: dt, d: dd }, en: { t: et, d: ed }, hu: { t: ht, d: hd } }))
export const MATCH_PAIR_COUNT = PAIRS.length

const norm = (s) => String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9äöüßáéíóőúűü]+/g, '')

function makeMatch(ctx) {
  const { rng, lang, topicIds, year, exclude } = ctx
  // eigener Topf + kurze Karteikarten aus der App (falls übergeben)
  const own = PAIRS.map((p, i) => ({ id: `p${i}`, topics: p.topics, term: L(lang, p).t, def: L(lang, p).d }))
  const seen = new Set(own.map((p) => norm(p.term)))
  const fromCards = []
  for (const c of ctx.cards) {
    if (!c?.term || !c?.erklaerung || c.erklaerung.length > 70 || c.term.length > 34 || !c.topicId) continue
    const k = norm(c.term)
    if (seen.has(k)) continue
    seen.add(k)
    fromCards.push({ id: `c:${c.id ?? c.term}`, topics: [c.topicId], term: c.term, def: c.erklaerung })
  }
  const all = [...own, ...fromCards]
  const byTopic = topicIds.length ? all.filter((p) => p.topics.some((t) => topicIds.includes(t))) : []
  const byYear = year ? all.filter((p) => yearsOf(p.topics).includes(year)) : []
  const chosen = []
  const take = (list) => {
    const fresh = shuffle(rng, list.filter((p) => !exclude.has(`match:${p.id}`)))
    const rest = shuffle(rng, list.filter((p) => exclude.has(`match:${p.id}`)))
    for (const p of [...fresh, ...rest]) {
      if (chosen.length >= 4) return
      if (chosen.some((c) => c.id === p.id || norm(c.term) === norm(p.term) || c.def === p.def)) continue
      chosen.push(p)
    }
  }
  take(byTopic)
  take(byYear)
  take(all)
  if (chosen.length < 4) return null
  const pairs = chosen.map((p) => ({ id: p.id, term: p.term, def: p.def, topicId: p.topics[0] }))
  return {
    kind: 'match',
    key: `match:${pairs.map((p) => p.id).join(',')}`,
    pairKeys: pairs.map((p) => `match:${p.id}`),
    title: L(lang, { de: 'Begriffe zuordnen', en: 'Match the terms', hu: 'Párosítsd a fogalmakat' }),
    prompt: L(lang, {
      de: 'Tippe einen Begriff, dann die passende Erklärung.',
      en: 'Tap a term, then the matching explanation.',
      hu: 'Koppints egy fogalomra, majd a hozzá illő magyarázatra.',
    }),
    topicIds: [...new Set(pairs.map((p) => p.topicId))],
    pairs,
    left: shuffle(rng, pairs.map((p) => p.id)),
    right: shuffle(rng, pairs.map((p) => p.id)),
    summary: L(lang, { de: 'Zugeordnet: ', en: 'Matched: ', hu: 'Párosítva: ' }) + pairs.map((p) => p.term).join(', '),
  }
}

// ---------- Auswerten ----------
/**
 * change: answer = [Cent, …] (gegebene Münzen/Scheine)  → { ok, given, mistakes }
 * calc:   answer = Index der gewählten Antwort           → { ok, mistakes }
 * sort:   answer = { [itemId]: 0|1 }                     → { ok, mistakes, wrongIds }   (1 Fehler ist ok)
 * match:  answer = { wrongIds: [pairId, …] } (Paare mit Fehlversuch) → { ok, mistakes } (1 Fehler ist ok)
 */
export function scoreMiniGame(game, answer) {
  if (!game) return { ok: false, mistakes: 0 }
  if (game.kind === 'change') {
    const given = (answer ?? []).reduce((s, c) => s + c, 0)
    return { ok: given === game.changeCents, given, mistakes: given === game.changeCents ? 0 : 1 }
  }
  if (game.kind === 'calc') return { ok: answer === game.correctIndex, mistakes: answer === game.correctIndex ? 0 : 1 }
  if (game.kind === 'sort') {
    const wrongIds = game.items.filter((it) => answer?.[it.id] !== it.bucket).map((it) => it.id)
    return { ok: wrongIds.length <= 1, mistakes: wrongIds.length, wrongIds }
  }
  if (game.kind === 'match') {
    const mistakes = new Set(answer?.wrongIds ?? []).size
    return { ok: mistakes <= 1, mistakes }
  }
  return { ok: false, mistakes: 0 }
}
