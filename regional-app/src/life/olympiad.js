// Olympiad training for the bus stop: the small facts and moves a proof is built from, drilled in seconds.
// Same shape as the everyday skills (a lesson plus a generator), so lessons, rounds and the mix work the same.
// The last two skills don't compute: true-or-false claims, and picking the idea that cracks a past GWF problem.
import { BANK } from '../data'
import { getLang } from '../i18n'
import { T, frac, num, pow } from './format'

export const OLY_GROUPS = [
  { id: 'oN', name: ['Number theory', 'Zahlentheorie'], color: 'var(--pink)', glyph: 'N' },
  { id: 'oA', name: ['Algebra', 'Algebra'], color: 'var(--blue)', glyph: 'A' },
  { id: 'oK', name: ['Combinatorics', 'Kombinatorik'], color: 'var(--orange)', glyph: 'K' },
  { id: 'oG', name: ['Geometry', 'Geometrie'], color: 'var(--green)', glyph: 'G' },
  { id: 'oX', name: ['Instinct', 'Gespür'], color: 'var(--indigo)', glyph: '!' },
]

const powmod = (a, n, m) => {
  let r = 1 % m
  let b = a % m
  let e = n
  while (e > 0) {
    if (e & 1) r = (r * b) % m
    b = (b * b) % m
    e = Math.floor(e / 2)
  }
  return r
}
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
const C = (n, k) => {
  if (k < 0 || k > n) return 0
  let r = 1
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i
  return Math.round(r)
}
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1))
const ANY = () => ''
const DEG = '°'

// A fraction answer: typed as 7/3 or as a decimal
const fracQ = (n, d) => {
  const f = frac(n, d)
  return { answer: f.n / f.d, tol: f.d === 1 ? 0.005 : 0.002, show: f.d === 1 ? num(f.n) : `${f.n}/${f.d}` }
}

export const OLYMPIAD = [
  /* ---------- Number theory ---------- */
  {
    id: 'o-last-digit',
    group: 'oN',
    title: ['Last digits repeat', 'Endziffern wiederholen sich'],
    rule: ['Last digits of powers cycle with length 1, 2 or 4. Reduce the exponent mod the cycle length.', 'Endziffern von Potenzen laufen in Zyklen der Länge 1, 2 oder 4. Den Exponenten modulo Zykluslänge reduzieren.'],
    idea: [
      'Only the last digit of the base matters, and its powers repeat: 7, 9, 3, 1, 7, 9, … So 7²⁰²⁶ ends like 7² because 2026 leaves remainder 2 when divided by 4. This is working mod 10.',
      'Nur die letzte Ziffer der Basis zählt, und ihre Potenzen wiederholen sich: 7, 9, 3, 1, 7, 9, … Also endet 7²⁰²⁶ wie 7², weil 2026 bei Division durch 4 den Rest 2 lässt. Das ist Rechnen modulo 10.',
    ],
    example: {
      q: ['Last digit of 3¹⁰⁰', 'Letzte Ziffer von 3¹⁰⁰'],
      steps: [
        ['3, 9, 7, 1 — cycle of length 4', '3, 9, 7, 1 – Zyklus der Länge 4'],
        ['100 = 4 · 25, remainder 0 → the 4th entry', '100 = 4 · 25, Rest 0 → der 4. Eintrag'],
        ['Last digit 1', 'Letzte Ziffer 1'],
      ],
    },
    trap: ['Remainder 0 means the last entry of the cycle, not the first.', 'Rest 0 heißt der letzte Eintrag im Zyklus, nicht der erste.'],
    use: ['“Prove that 2ⁿ + 3ⁿ is never a square”-type problems: check the last digit first.', 'Aufgaben wie „zeige, dass 2ⁿ + 3ⁿ nie eine Quadratzahl ist“: zuerst die Endziffer prüfen.'],
    gen(r) {
      const a = r.pick([2, 3, 4, 7, 8, 9, 12, 13, 17, 19, 23])
      const n = r.int(50, 2100)
      const cyc = []
      let x = a % 10
      while (!cyc.includes(x)) {
        cyc.push(x)
        x = (x * a) % 10
      }
      const L = cyc.length
      const k = n % L
      const ans = cyc[(k + L - 1) % L]
      return {
        q: T(`What is the last digit of ${a}^${n}?`, `Was ist die letzte Ziffer von ${a}^${n}?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: String(ans),
        steps: [
          T(`Powers of ${a % 10} end in ${cyc.join(', ')}, … (cycle ${L})`, `Potenzen von ${a % 10} enden auf ${cyc.join(', ')}, … (Zyklus ${L})`),
          T(`${n} = ${L} · ${Math.floor(n / L)} + ${k}${k === 0 ? ' → the last entry' : ` → entry ${k}`}`, `${n} = ${L} · ${Math.floor(n / L)} + ${k}${k === 0 ? ' → der letzte Eintrag' : ` → Eintrag ${k}`}`),
          T(`Last digit ${ans}`, `Letzte Ziffer ${ans}`),
        ],
      }
    },
  },
  {
    id: 'o-fermat',
    group: 'oN',
    title: ['Remainders of huge powers', 'Reste riesiger Potenzen'],
    rule: ['Fermat: for a prime p not dividing a, a^(p−1) ≡ 1 (mod p).', 'Fermat: Für eine Primzahl p, die a nicht teilt, gilt a^(p−1) ≡ 1 (mod p).'],
    idea: [
      'Every block of p − 1 factors of a is worth 1 mod p, so only the exponent mod (p − 1) matters. Then compute a small power by hand, reducing after every step.',
      'Jeder Block aus p − 1 Faktoren a ist modulo p gleich 1, also zählt nur der Exponent modulo (p − 1). Dann eine kleine Potenz von Hand ausrechnen und nach jedem Schritt reduzieren.',
    ],
    example: {
      q: ['2¹⁰⁰ mod 7', '2¹⁰⁰ mod 7'],
      steps: [
        ['2⁶ ≡ 1 (mod 7)', '2⁶ ≡ 1 (mod 7)'],
        ['100 = 6 · 16 + 4, so 2¹⁰⁰ ≡ 2⁴ = 16', '100 = 6 · 16 + 4, also 2¹⁰⁰ ≡ 2⁴ = 16'],
        ['16 ≡ 2 (mod 7)', '16 ≡ 2 (mod 7)'],
      ],
    },
    trap: ['Fermat needs p prime and p ∤ a. Mod 9 or mod 10 use the actual cycle instead.', 'Fermat braucht p prim und p ∤ a. Modulo 9 oder 10 stattdessen den echten Zyklus verwenden.'],
    use: ['Showing an expression is never divisible by p, or finding which n make it divisible.', 'Zeigen, dass ein Ausdruck nie durch p teilbar ist, oder finden, für welche n er es ist.'],
    gen(r) {
      const p = r.pick([5, 7, 11, 13])
      let a = r.int(2, 3 * p)
      if (a % p === 0) a++
      const n = r.int(40, 2026)
      const k = n % (p - 1)
      const ans = powmod(a, n, p)
      return {
        q: T(`What is the remainder of ${a}^${n} when divided by ${p}?`, `Welchen Rest lässt ${a}^${n} bei Division durch ${p}?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: String(ans),
        steps: [
          a >= p ? `${a} ≡ ${a % p} (mod ${p})` : T(`${p} is prime and doesn’t divide ${a}`, `${p} ist prim und teilt ${a} nicht`),
          `${a % p}^${p - 1} ≡ 1 (mod ${p})`,
          `${n} = ${p - 1} · ${Math.floor(n / (p - 1))} + ${k} → ${a % p}^${k} ≡ ${ans} (mod ${p})`,
        ],
      }
    },
  },
  {
    id: 'o-divisors',
    group: 'oN',
    title: ['Counting divisors', 'Teiler zählen'],
    rule: ['n = p^a · q^b · r^c has (a + 1)(b + 1)(c + 1) divisors.', 'n = p^a · q^b · r^c hat (a + 1)(b + 1)(c + 1) Teiler.'],
    idea: [
      'A divisor picks an exponent for each prime independently: 0 to a for p, 0 to b for q, and so on. Multiply the numbers of choices. The count is odd exactly when n is a perfect square.',
      'Ein Teiler wählt für jede Primzahl unabhängig einen Exponenten: 0 bis a für p, 0 bis b für q usw. Die Anzahlen der Möglichkeiten multiplizieren. Die Anzahl ist genau dann ungerade, wenn n eine Quadratzahl ist.',
    ],
    example: {
      q: ['Divisors of 360', 'Teiler von 360'],
      steps: [
        ['360 = 2³ · 3² · 5', '360 = 2³ · 3² · 5'],
        ['(3 + 1)(2 + 1)(1 + 1) = 24', '(3 + 1)(2 + 1)(1 + 1) = 24'],
      ],
    },
    trap: ['Factor completely first: 12 = 2² · 3, not 4 · 3.', 'Zuerst vollständig zerlegen: 12 = 2² · 3, nicht 4 · 3.'],
    use: ['“Find all n with exactly 10 divisors”, divisor pairs, squares.', '„Finde alle n mit genau 10 Teilern“, Teilerpaare, Quadratzahlen.'],
    gen(r) {
      const ps = [2, 3, 5, 7]
      let e, n
      for (let i = 0; i < 40; i++) {
        e = [r.int(0, 5), r.int(0, 3), r.int(0, 2), r.int(0, 1)]
        n = ps.reduce((acc, p, j) => acc * p ** e[j], 1)
        if (n >= 30 && n <= 60000 && e.filter(Boolean).length >= 2) break
      }
      const parts = ps.map((p, j) => (e[j] ? (e[j] === 1 ? `${p}` : pow(p, e[j])) : null)).filter(Boolean)
      const ans = e.reduce((acc, x) => acc * (x + 1), 1)
      return {
        q: T(`How many positive divisors does ${num(n)} have?`, `Wie viele positive Teiler hat ${num(n)}?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: String(ans),
        steps: [`${num(n)} = ${parts.join(' · ')}`, `${e.filter(Boolean).map((x) => `(${x} + 1)`).join('')} = ${ans}`],
      }
    },
  },
  {
    id: 'o-legendre',
    group: 'oN',
    title: ['Primes inside n!', 'Primzahlen in n!'],
    rule: ['The exponent of p in n! is ⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + …', 'Der Exponent von p in n! ist ⌊n/p⌋ + ⌊n/p²⌋ + ⌊n/p³⌋ + …'],
    idea: [
      'Count multiples of p up to n, then add the multiples of p² (they give a second factor p), p³, and so on. Trailing zeros of n! = the exponent of 5, since 2s are always more plentiful.',
      'Zähl die Vielfachen von p bis n, dann zusätzlich die Vielfachen von p² (sie liefern einen zweiten Faktor p), p³ usw. Endnullen von n! = Exponent von 5, denn Zweier gibt es immer genug.',
    ],
    example: {
      q: ['Trailing zeros of 100!', 'Endnullen von 100!'],
      steps: [
        ['⌊100/5⌋ = 20, ⌊100/25⌋ = 4', '⌊100/5⌋ = 20, ⌊100/25⌋ = 4'],
        ['20 + 4 = 24 zeros', '20 + 4 = 24 Nullen'],
      ],
    },
    trap: ['Don’t stop at ⌊n/p⌋ — 25, 125, … each give extra factors.', 'Nicht bei ⌊n/p⌋ aufhören – 25, 125, … liefern jeweils zusätzliche Faktoren.'],
    use: ['Divisibility of binomial coefficients, factorial equations, “how many zeros”.', 'Teilbarkeit von Binomialkoeffizienten, Gleichungen mit Fakultäten, „wie viele Nullen“.'],
    gen(r) {
      const zeros = r.next() < 0.6
      const p = zeros ? 5 : r.pick([2, 3, 7])
      const n = zeros ? r.int(30, 2026) : r.int(20, 120)
      const terms = []
      for (let q = p; q <= n; q *= p) terms.push([q, Math.floor(n / q)])
      const ans = terms.reduce((a, [, v]) => a + v, 0)
      return {
        q: zeros ? T(`How many zeros does ${n}! end in?`, `Auf wie viele Nullen endet ${n}!?`) : T(`What is the largest k such that ${p}^k divides ${n}!?`, `Was ist das größte k, sodass ${p}^k die Zahl ${n}! teilt?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: String(ans),
        steps: [...terms.map(([q, v]) => `⌊${n}/${q}⌋ = ${v}`), `${terms.map(([, v]) => v).join(' + ')} = ${ans}`],
      }
    },
  },
  {
    id: 'o-mod9',
    group: 'oN',
    title: ['Digit sums: mod 9 and mod 11', 'Ziffernsummen: mod 9 und mod 11'],
    rule: ['n ≡ digit sum (mod 9). n ≡ alternating digit sum from the right (mod 11).', 'n ≡ Ziffernsumme (mod 9). n ≡ alternierende Ziffernsumme von rechts (mod 11).'],
    idea: [
      'Because 10 ≡ 1 (mod 9), every digit counts as itself. Because 10 ≡ −1 (mod 11), digits count with alternating signs, starting with + at the units digit. Checks like these kill “digit” problems fast.',
      'Weil 10 ≡ 1 (mod 9), zählt jede Ziffer einfach. Weil 10 ≡ −1 (mod 11), zählen die Ziffern mit wechselnden Vorzeichen, beginnend mit + bei der Einerstelle. So erledigt man „Ziffern“-Aufgaben schnell.',
    ],
    example: {
      q: ['918 273 mod 11', '918 273 mod 11'],
      steps: [
        ['3 − 7 + 2 − 8 + 1 − 9 = −18', '3 − 7 + 2 − 8 + 1 − 9 = −18'],
        ['−18 ≡ 4 (mod 11)', '−18 ≡ 4 (mod 11)'],
      ],
    },
    trap: ['For mod 11 start the signs at the units digit; a negative total still needs + 11.', 'Bei mod 11 die Vorzeichen bei der Einerstelle beginnen; eine negative Summe braucht noch + 11.'],
    use: ['Problems about digits, repunits like 111…1, and “is this number a square?”.', 'Aufgaben über Ziffern, Zahlen wie 111…1 und „ist das eine Quadratzahl?“.'],
    gen(r) {
      const len = r.int(6, 9)
      const digits = Array.from({ length: len }, (_, i) => (i === 0 ? r.int(1, 9) : r.int(0, 9)))
      const s = digits.join('')
      const big = BigInt(s)
      const m = r.pick([9, 9, 11, 3])
      const ans = Number(big % BigInt(m))
      const show = s.replace(/\B(?=(\d{3})+(?!\d))/g, getLang() === 'de' ? '.' : ',')
      let steps
      if (m === 11) {
        const rev = [...digits].reverse()
        const alt = rev.reduce((a, d, i) => a + (i % 2 ? -d : d), 0)
        steps = [rev.map((d, i) => (i === 0 ? `${d}` : `${i % 2 ? '−' : '+'} ${d}`)).join(' ') + ` = ${alt}`, `${alt} ≡ ${ans} (mod 11)`]
      } else {
        const ds = digits.reduce((a, b) => a + b, 0)
        steps = [T(`Digit sum: ${digits.join(' + ')} = ${ds}`, `Ziffernsumme: ${digits.join(' + ')} = ${ds}`), `${ds} ≡ ${ans} (mod ${m})`]
      }
      return { q: T(`Remainder of ${show} when divided by ${m}?`, `Rest von ${show} bei Division durch ${m}?`), answer: ans, tol: 0.005, unit: ANY(), show: String(ans), steps }
    },
  },
  {
    id: 'o-gcd',
    group: 'oN',
    title: ['The Euclidean algorithm', 'Der euklidische Algorithmus'],
    rule: ['gcd(a, b) = gcd(b, a − kb). And gcd(2^a − 1, 2^b − 1) = 2^gcd(a, b) − 1.', 'ggT(a, b) = ggT(b, a − kb). Und ggT(2^a − 1, 2^b − 1) = 2^ggT(a, b) − 1.'],
    idea: [
      'Any common divisor of a and b also divides a − kb, so you may subtract multiples freely. In olympiad problems this is how gcd(n² + 1, n + 1) becomes gcd(2, n + 1).',
      'Jeder gemeinsame Teiler von a und b teilt auch a − kb, man darf also beliebig Vielfache abziehen. So wird in Olympiade-Aufgaben aus ggT(n² + 1, n + 1) einfach ggT(2, n + 1).',
    ],
    example: {
      q: ['gcd(n² + 1, n + 1)', 'ggT(n² + 1, n + 1)'],
      steps: [
        ['n² + 1 − (n − 1)(n + 1) = 2', 'n² + 1 − (n − 1)(n + 1) = 2'],
        ['So the gcd is 1 or 2 — it is 2 exactly when n is odd', 'Der ggT ist also 1 oder 2 – genau dann 2, wenn n ungerade ist'],
      ],
    },
    trap: ['Subtract multiples of the smaller number, never divide one of them by something.', 'Vielfache der kleineren Zahl abziehen, nie eine der Zahlen durch etwas teilen.'],
    use: ['gcd of polynomial expressions in n, coprimality, fractions that can’t be reduced.', 'ggT von Ausdrücken in n, Teilerfremdheit, Brüche, die sich nicht kürzen lassen.'],
    gen(r) {
      if (r.next() < 0.35) {
        const a = r.int(6, 30)
        let b = r.int(4, 30)
        if (b === a) b++
        const g = gcd(a, b)
        const ans = 2 ** g - 1
        return {
          q: T(`gcd(2^${a} − 1, 2^${b} − 1) = ?`, `ggT(2^${a} − 1, 2^${b} − 1) = ?`),
          answer: ans,
          tol: 0.005,
          unit: ANY(),
          show: num(ans),
          steps: [T(`gcd(${a}, ${b}) = ${g}`, `ggT(${a}, ${b}) = ${g}`), `2^${g} − 1 = ${num(ans)}`],
        }
      }
      const g = r.pick([3, 6, 7, 9, 12, 13, 14, 17, 21])
      let x = r.int(5, 40)
      let y = r.int(5, 40)
      while (gcd(x, y) !== 1 || x === y) y = r.int(5, 40)
      const a = Math.max(x, y) * g
      const b = Math.min(x, y) * g
      const steps = []
      let p = a
      let q = b
      while (q) {
        steps.push(`${p} = ${Math.floor(p / q)} · ${q} + ${p % q}`)
        ;[p, q] = [q, p % q]
      }
      steps.push(T(`gcd = ${p}`, `ggT = ${p}`))
      return { q: T(`gcd(${a}, ${b}) = ?`, `ggT(${a}, ${b}) = ?`), answer: p, tol: 0.005, unit: ANY(), show: String(p), steps: steps.slice(0, 5) }
    },
  },
  {
    id: 'o-squares-mod',
    group: 'oN',
    title: ['Squares mod small numbers', 'Quadrate modulo kleiner Zahlen'],
    rule: ['Squares are 0, 1 mod 3 and mod 4; 0, 1, 4 mod 8; 0, 1, 4, 7 mod 9.', 'Quadrate sind 0, 1 mod 3 und mod 4; 0, 1, 4 mod 8; 0, 1, 4, 7 mod 9.'],
    idea: [
      'To show an equation has no integer solution, look at it mod a small number where squares (or cubes) can only take a few values. If the two sides can never match, you’re done in one line.',
      'Um zu zeigen, dass eine Gleichung keine ganzzahlige Lösung hat, betrachte sie modulo einer kleinen Zahl, bei der Quadrate (oder Kuben) nur wenige Werte annehmen. Passen die Seiten nie zusammen, ist man in einer Zeile fertig.',
    ],
    example: {
      q: ['Can x² + y² = 2027?', 'Kann x² + y² = 2027 sein?'],
      steps: [
        ['x² + y² mod 4 is 0, 1 or 2', 'x² + y² mod 4 ist 0, 1 oder 2'],
        ['2027 ≡ 3 (mod 4) — impossible', '2027 ≡ 3 (mod 4) – unmöglich'],
      ],
    },
    trap: ['Pick the modulus that fits: squares → 3, 4, 8; cubes → 7, 9.', 'Den passenden Modul wählen: Quadrate → 3, 4, 8; Kuben → 7, 9.'],
    use: ['Diophantine equations — the very first thing to try.', 'Diophantische Gleichungen – das Erste, was man probiert.'],
    gen(r) {
      const kind = r.int(0, 1)
      if (kind === 0) {
        const m = r.pick([3, 4, 5, 7, 8, 9, 10, 11, 16])
        const res = [...new Set(Array.from({ length: m }, (_, x) => (x * x) % m))].sort((a, b) => a - b)
        return {
          q: T(`How many different remainders can a perfect square leave when divided by ${m}?`, `Wie viele verschiedene Reste kann eine Quadratzahl bei Division durch ${m} lassen?`),
          answer: res.length,
          tol: 0.005,
          unit: ANY(),
          show: String(res.length),
          steps: [T(`Square 0, 1, …, ${m - 1} and reduce mod ${m}`, `0, 1, …, ${m - 1} quadrieren und mod ${m} reduzieren`), `{${res.join(', ')}} → ${res.length}`],
        }
      }
      const m = r.pick([7, 9])
      const res = [...new Set(Array.from({ length: m }, (_, x) => (x * x * x) % m))].sort((a, b) => a - b)
      return {
        q: T(`How many different remainders can a perfect cube leave when divided by ${m}?`, `Wie viele verschiedene Reste kann eine Kubikzahl bei Division durch ${m} lassen?`),
        answer: res.length,
        tol: 0.005,
        unit: ANY(),
        show: String(res.length),
        steps: [T(`Cube 0, 1, …, ${m - 1} and reduce mod ${m}`, `0, 1, …, ${m - 1} hoch 3 nehmen und mod ${m} reduzieren`), `{${res.join(', ')}} → ${res.length}`],
      }
    },
  },

  /* ---------- Algebra ---------- */
  {
    id: 'o-vieta',
    group: 'oA',
    title: ['Vieta without the roots', 'Vieta ohne die Lösungen'],
    rule: ['x² − sx + p = 0: x₁ + x₂ = s, x₁x₂ = p. Then x₁² + x₂² = s² − 2p, x₁³ + x₂³ = s³ − 3ps.', 'x² − sx + p = 0: x₁ + x₂ = s, x₁x₂ = p. Dann x₁² + x₂² = s² − 2p, x₁³ + x₂³ = s³ − 3ps.'],
    idea: [
      'Symmetric expressions in the roots can always be written with the sum and the product. You never need the roots themselves — they may not even be real.',
      'Symmetrische Ausdrücke in den Lösungen lassen sich immer durch Summe und Produkt ausdrücken. Die Lösungen selbst braucht man nie – sie müssen nicht einmal reell sein.',
    ],
    example: {
      q: ['x² − 5x + 3 = 0, find x₁² + x₂²', 'x² − 5x + 3 = 0, gesucht x₁² + x₂²'],
      steps: [
        ['s = 5, p = 3', 's = 5, p = 3'],
        ['25 − 6 = 19', '25 − 6 = 19'],
      ],
    },
    trap: ['For x² + bx + c the sum is −b, not b.', 'Bei x² + bx + c ist die Summe −b, nicht b.'],
    use: ['Systems with x + y and xy, polynomial problems, symmetric inequalities.', 'Gleichungssysteme mit x + y und xy, Polynom-Aufgaben, symmetrische Ungleichungen.'],
    gen(r) {
      const s = r.int(2, 12)
      const p = r.int(1, 15)
      const kind = r.int(0, 3)
      const eq = `x² − ${s}x + ${p} = 0`
      const base = T(`x₁, x₂ are the roots of ${eq}.`, `x₁, x₂ sind die Lösungen von ${eq}.`)
      const sp = `x₁ + x₂ = ${s}, x₁x₂ = ${p}`
      if (kind === 0) return { q: `${base} x₁² + x₂² = ?`, answer: s * s - 2 * p, tol: 0.005, unit: ANY(), show: String(s * s - 2 * p), steps: [sp, `(x₁ + x₂)² − 2x₁x₂ = ${s * s} − ${2 * p} = ${s * s - 2 * p}`] }
      if (kind === 1) return { q: `${base} x₁³ + x₂³ = ?`, answer: s ** 3 - 3 * p * s, tol: 0.005, unit: ANY(), show: num(s ** 3 - 3 * p * s), steps: [sp, `s³ − 3ps = ${s ** 3} − ${3 * p * s} = ${num(s ** 3 - 3 * p * s)}`] }
      if (kind === 2) {
        const f = fracQ(s, p)
        return { q: `${base} 1/x₁ + 1/x₂ = ?`, ...f, unit: ANY(), steps: [sp, `1/x₁ + 1/x₂ = (x₁ + x₂)/(x₁x₂) = ${s}/${p}${f.show !== `${s}/${p}` ? ` = ${f.show}` : ''}`] }
      }
      return { q: `${base} (x₁ − x₂)² = ?`, answer: s * s - 4 * p, tol: 0.005, unit: ANY(), show: String(s * s - 4 * p), steps: [sp, `(x₁ + x₂)² − 4x₁x₂ = ${s * s} − ${4 * p} = ${s * s - 4 * p}`, T('This is the discriminant: negative means no real roots', 'Das ist die Diskriminante: negativ heißt keine reellen Lösungen')] }
    },
  },
  {
    id: 'o-amgm',
    group: 'oA',
    title: ['AM-GM for extremes', 'AM-GM für Extremwerte'],
    rule: ['For a, b ≥ 0: (a + b)/2 ≥ √(ab), equality iff a = b. So ax + b/x ≥ 2√(ab) for x > 0.', 'Für a, b ≥ 0: (a + b)/2 ≥ √(ab), Gleichheit genau bei a = b. Also ax + b/x ≥ 2√(ab) für x > 0.'],
    idea: [
      'When a sum has a constant product, AM-GM gives its minimum; when it has a constant sum, the product is largest when the parts are equal. Always say when equality holds — it proves the bound is reached.',
      'Hat eine Summe ein konstantes Produkt, liefert AM-GM ihr Minimum; bei konstanter Summe ist das Produkt am größten, wenn die Teile gleich sind. Immer den Gleichheitsfall angeben – er zeigt, dass die Schranke erreicht wird.',
    ],
    example: {
      q: ['Minimum of 4x + 9/x for x > 0', 'Minimum von 4x + 9/x für x > 0'],
      steps: [
        ['4x + 9/x ≥ 2√(4x · 9/x) = 2√36 = 12', '4x + 9/x ≥ 2√(4x · 9/x) = 2√36 = 12'],
        ['Equality when 4x = 9/x, i.e. x = 3/2', 'Gleichheit bei 4x = 9/x, also x = 3/2'],
      ],
    },
    trap: ['Only for non-negative terms: x + 1/x ≥ 2 fails for x < 0.', 'Nur für nichtnegative Terme: x + 1/x ≥ 2 gilt nicht für x < 0.'],
    use: ['Inequalities, “find the minimum”, optimising areas and products.', 'Ungleichungen, „bestimme das Minimum“, Flächen und Produkte optimieren.'],
    gen(r) {
      if (r.next() < 0.65) {
        const a = r.int(1, 9)
        const c = r.int(1, 6)
        const b = a * c * c
        const ans = 2 * a * c
        return {
          q: T(`What is the smallest value of ${a === 1 ? '' : a}x + ${b}/x for x > 0?`, `Was ist der kleinste Wert von ${a === 1 ? '' : a}x + ${b}/x für x > 0?`),
          answer: ans,
          tol: 0.005,
          unit: ANY(),
          show: String(ans),
          steps: [`${a === 1 ? '' : a}x + ${b}/x ≥ 2√(${a} · ${b}) = 2 · ${a * c} = ${ans}`, T(`Equality at x = ${c}`, `Gleichheit bei x = ${c}`)],
        }
      }
      const S = 2 * r.int(3, 20)
      return {
        q: T(`x, y ≥ 0 with x + y = ${S}. What is the largest possible value of xy?`, `x, y ≥ 0 mit x + y = ${S}. Was ist der größtmögliche Wert von xy?`),
        answer: (S * S) / 4,
        tol: 0.005,
        unit: ANY(),
        show: String((S * S) / 4),
        steps: [`√(xy) ≤ (x + y)/2 = ${S / 2}`, `xy ≤ ${S / 2}² = ${(S * S) / 4}`, T(`Equality at x = y = ${S / 2}`, `Gleichheit bei x = y = ${S / 2}`)],
      }
    },
  },
  {
    id: 'o-sums',
    group: 'oA',
    title: ['Sums that collapse', 'Summen, die zusammenfallen'],
    rule: ['1/(k(k+1)) = 1/k − 1/(k+1). 1 + 2 + … + n = n(n+1)/2. 1 + 3 + … + (2n−1) = n².', '1/(k(k+1)) = 1/k − 1/(k+1). 1 + 2 + … + n = n(n+1)/2. 1 + 3 + … + (2n−1) = n².'],
    idea: [
      'Write each term as a difference f(k) − f(k+1): then neighbours cancel and only the first and last pieces survive. Spotting a telescoping sum turns a long computation into one line.',
      'Schreib jeden Summanden als Differenz f(k) − f(k+1): Dann heben sich Nachbarn weg und nur das erste und letzte Stück bleiben. Eine Teleskopsumme zu erkennen macht aus einer langen Rechnung eine Zeile.',
    ],
    example: {
      q: ['1/(1·2) + 1/(2·3) + … + 1/(9·10)', '1/(1·2) + 1/(2·3) + … + 1/(9·10)'],
      steps: [
        ['= (1 − 1/2) + (1/2 − 1/3) + … + (1/9 − 1/10)', '= (1 − 1/2) + (1/2 − 1/3) + … + (1/9 − 1/10)'],
        ['= 1 − 1/10 = 9/10', '= 1 − 1/10 = 9/10'],
      ],
    },
    trap: ['Count the terms carefully: from 1 to n there are n terms, from 0 to n there are n + 1.', 'Die Anzahl der Summanden genau zählen: von 1 bis n sind es n, von 0 bis n sind es n + 1.'],
    use: ['Sum problems, bounding sums, recursions.', 'Summen-Aufgaben, Summen abschätzen, Rekursionen.'],
    gen(r) {
      const kind = r.int(0, 3)
      if (kind === 0) {
        const n = r.int(5, 99)
        const f = fracQ(n, n + 1)
        return { q: `1/(1·2) + 1/(2·3) + … + 1/(${n}·${n + 1}) = ?`, ...f, unit: ANY(), steps: ['1/(k(k+1)) = 1/k − 1/(k+1)', `1 − 1/${n + 1} = ${f.show}`] }
      }
      if (kind === 1) {
        const n = r.int(10, 200)
        return { q: `1 + 2 + 3 + … + ${n} = ?`, answer: (n * (n + 1)) / 2, tol: 0.005, unit: ANY(), show: num((n * (n + 1)) / 2), steps: [`n(n + 1)/2 = ${n} · ${n + 1} / 2`, `= ${num((n * (n + 1)) / 2)}`] }
      }
      if (kind === 2) {
        const n = r.int(8, 60)
        return { q: `1 + 3 + 5 + … + ${2 * n - 1} = ?`, answer: n * n, tol: 0.005, unit: ANY(), show: num(n * n), steps: [T(`That’s the first ${n} odd numbers`, `Das sind die ersten ${n} ungeraden Zahlen`), `${n}² = ${num(n * n)}`] }
      }
      const n = r.int(3, 6)
      const ans = fact(n + 1) - 1
      return { q: `1·1! + 2·2! + … + ${n}·${n}! = ?`, answer: ans, tol: 0.005, unit: ANY(), show: num(ans), steps: ['k · k! = (k + 1)! − k!', `${n + 1}! − 1! = ${num(fact(n + 1))} − 1 = ${num(ans)}`] }
    },
  },
  {
    id: 'o-square',
    group: 'oA',
    title: ['Complete the square', 'Quadratisch ergänzen'],
    rule: ['x² − 2ax + c = (x − a)² + (c − a²) ≥ c − a².', 'x² − 2ax + c = (x − a)² + (c − a²) ≥ c − a².'],
    idea: [
      'A square is never negative. Rewrite an expression as squares plus a constant and you see its minimum, where it’s reached, and why it can’t go lower — that is a complete proof.',
      'Ein Quadrat ist nie negativ. Schreib einen Ausdruck als Quadrate plus Konstante, und du siehst sein Minimum, wo es erreicht wird und warum es nicht tiefer geht – das ist ein vollständiger Beweis.',
    ],
    example: {
      q: ['Minimum of x² + y² − 4x + 6y + 20', 'Minimum von x² + y² − 4x + 6y + 20'],
      steps: [
        ['(x − 2)² + (y + 3)² + 20 − 4 − 9', '(x − 2)² + (y + 3)² + 20 − 4 − 9'],
        ['≥ 7, at x = 2, y = −3', '≥ 7, bei x = 2, y = −3'],
      ],
    },
    trap: ['When you complete a square, subtract what you added.', 'Was du beim Ergänzen dazugibst, musst du wieder abziehen.'],
    use: ['Inequalities (SOS), minimum problems, Diophantine equations as sums of squares.', 'Ungleichungen (SOS), Minimum-Aufgaben, diophantische Gleichungen als Quadratsummen.'],
    gen(r) {
      if (r.next() < 0.5) {
        const a = r.int(1, 9)
        const c = a * a + r.int(-10, 15)
        const sgn = c >= 0 ? `+ ${c}` : `− ${-c}`
        return {
          q: T(`What is the minimum of x² − ${2 * a}x ${sgn} over all real x?`, `Was ist das Minimum von x² − ${2 * a}x ${sgn} über alle reellen x?`),
          answer: c - a * a,
          tol: 0.005,
          unit: ANY(),
          show: String(c - a * a),
          steps: [`(x − ${a})² ${sgn} − ${a * a}`, T(`Minimum ${c - a * a} at x = ${a}`, `Minimum ${c - a * a} bei x = ${a}`)],
        }
      }
      const a = r.int(1, 5)
      const b = r.int(1, 5)
      const c = a * a + b * b + r.int(0, 12)
      return {
        q: T(`What is the minimum of x² + y² − ${2 * a}x + ${2 * b}y + ${c}?`, `Was ist das Minimum von x² + y² − ${2 * a}x + ${2 * b}y + ${c}?`),
        answer: c - a * a - b * b,
        tol: 0.005,
        unit: ANY(),
        show: String(c - a * a - b * b),
        steps: [`(x − ${a})² + (y + ${b})² + ${c} − ${a * a} − ${b * b}`, T(`Minimum ${c - a * a - b * b} at x = ${a}, y = −${b}`, `Minimum ${c - a * a - b * b} bei x = ${a}, y = −${b}`)],
      }
    },
  },

  /* ---------- Combinatorics ---------- */
  {
    id: 'o-choose',
    group: 'oK',
    title: ['Choosing and pairs', 'Auswählen und Paare'],
    rule: ['C(n, k) = n! / (k!(n − k)!). Pairs: n(n − 1)/2. Diagonals of an n-gon: n(n − 3)/2.', 'C(n, k) = n! / (k!(n − k)!). Paare: n(n − 1)/2. Diagonalen eines n-Ecks: n(n − 3)/2.'],
    idea: [
      'Order doesn’t matter → divide by the ways to order. A handshake is a pair of people; a diagonal is a pair of corners that aren’t neighbours.',
      'Reihenfolge egal → durch die Anzahl der Anordnungen teilen. Ein Händedruck ist ein Paar von Leuten; eine Diagonale ist ein Paar nicht benachbarter Ecken.',
    ],
    example: {
      q: ['Diagonals of a 12-gon', 'Diagonalen eines 12-Ecks'],
      steps: [
        ['Pairs of corners: 12 · 11 / 2 = 66', 'Eckenpaare: 12 · 11 / 2 = 66'],
        ['Minus 12 sides: 54', 'Minus 12 Seiten: 54'],
      ],
    },
    trap: ['C(n, k) = C(n, n − k): choose the smaller k to compute.', 'C(n, k) = C(n, n − k): zum Rechnen das kleinere k nehmen.'],
    use: ['Counting problems, double counting, probability.', 'Abzählaufgaben, doppeltes Abzählen, Wahrscheinlichkeiten.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const n = r.int(6, 15)
        const k = r.int(2, 4)
        const ans = C(n, k)
        return { q: T(`In how many ways can you choose a team of ${k} from ${n} people?`, `Auf wie viele Arten kann man ein ${k}er-Team aus ${n} Leuten wählen?`), answer: ans, tol: 0.005, unit: ANY(), show: num(ans), steps: [`C(${n}, ${k}) = ${Array.from({ length: k }, (_, i) => n - i).join(' · ')} / ${k}!`, `= ${num(ans)}`] }
      }
      if (kind === 1) {
        const n = r.int(8, 40)
        return { q: T(`${n} people each shake hands once with everyone else. How many handshakes?`, `${n} Leute geben einander jeweils einmal die Hand. Wie viele Händedrucke?`), answer: C(n, 2), tol: 0.005, unit: ANY(), show: num(C(n, 2)), steps: [`${n} · ${n - 1} / 2 = ${num(C(n, 2))}`] }
      }
      const n = r.int(5, 30)
      return { q: T(`How many diagonals does a convex ${n}-gon have?`, `Wie viele Diagonalen hat ein konvexes ${n}-Eck?`), answer: (n * (n - 3)) / 2, tol: 0.005, unit: ANY(), show: num((n * (n - 3)) / 2), steps: [T(`Each corner joins ${n - 3} non-neighbours`, `Jede Ecke verbindet ${n - 3} Nicht-Nachbarn`), `${n} · ${n - 3} / 2 = ${num((n * (n - 3)) / 2)}`] }
    },
  },
  {
    id: 'o-stars',
    group: 'oK',
    title: ['Stars and bars', 'Sterne und Striche'],
    rule: ['x₁ + … + x_k = n with all xᵢ ≥ 0: C(n + k − 1, k − 1) solutions. With xᵢ ≥ 1: C(n − 1, k − 1).', 'x₁ + … + x_k = n mit allen xᵢ ≥ 0: C(n + k − 1, k − 1) Lösungen. Mit xᵢ ≥ 1: C(n − 1, k − 1).'],
    idea: [
      'Write n stars in a row and split them into k groups with k − 1 bars. Every arrangement of stars and bars is exactly one solution, so you just choose where the bars go.',
      'Schreib n Sterne in eine Reihe und teile sie mit k − 1 Strichen in k Gruppen. Jede Anordnung aus Sternen und Strichen ist genau eine Lösung – man wählt nur, wo die Striche hinkommen.',
    ],
    example: {
      q: ['a + b + c = 10, a, b, c ≥ 0', 'a + b + c = 10, a, b, c ≥ 0'],
      steps: [
        ['10 stars, 2 bars: 12 places', '10 Sterne, 2 Striche: 12 Plätze'],
        ['C(12, 2) = 66', 'C(12, 2) = 66'],
      ],
    },
    trap: ['If each variable must be ≥ 1, first give everyone 1, then use the ≥ 0 formula.', 'Wenn jede Variable ≥ 1 sein muss, zuerst jedem 1 geben, dann die ≥ 0-Formel.'],
    use: ['Distributing objects, counting solutions, sweets-to-children problems.', 'Gegenstände verteilen, Lösungen zählen, Zuckerl-auf-Kinder-Aufgaben.'],
    gen(r) {
      const k = r.int(2, 4)
      const n = r.int(5, 14)
      const pos = r.next() < 0.4
      const ans = pos ? C(n - 1, k - 1) : C(n + k - 1, k - 1)
      const vars = ['a', 'b', 'c', 'd'].slice(0, k)
      return {
        q: T(`How many solutions does ${vars.join(' + ')} = ${n} have in ${pos ? 'positive' : 'non-negative'} integers?`, `Wie viele Lösungen hat ${vars.join(' + ')} = ${n} in ${pos ? 'positiven' : 'nichtnegativen'} ganzen Zahlen?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: num(ans),
        steps: pos
          ? [T(`Give each 1 first: ${n - k} left for ${k} variables ≥ 0`, `Zuerst jedem 1 geben: ${n - k} bleiben für ${k} Variablen ≥ 0`), `C(${n - 1}, ${k - 1}) = ${num(ans)}`]
          : [T(`${n} stars, ${k - 1} bar${k - 1 === 1 ? '' : 's'}`, `${n} Sterne, ${k - 1} ${k - 1 === 1 ? 'Strich' : 'Striche'}`), `C(${n + k - 1}, ${k - 1}) = ${num(ans)}`],
      }
    },
  },
  {
    id: 'o-incl-excl',
    group: 'oK',
    title: ['Inclusion–exclusion', 'Inklusion–Exklusion'],
    rule: ['|A ∪ B| = |A| + |B| − |A ∩ B|. Multiples of a or b up to N: ⌊N/a⌋ + ⌊N/b⌋ − ⌊N/lcm(a,b)⌋.', '|A ∪ B| = |A| + |B| − |A ∩ B|. Vielfache von a oder b bis N: ⌊N/a⌋ + ⌊N/b⌋ − ⌊N/kgV(a,b)⌋.'],
    idea: [
      'Adding two groups counts their overlap twice, so take it off once. With three sets: add singles, subtract pairs, add the triple back.',
      'Wer zwei Gruppen addiert, zählt die Überschneidung doppelt – also einmal abziehen. Bei drei Mengen: Einzelne addieren, Paare abziehen, das Dreifache wieder dazu.',
    ],
    example: {
      q: ['Numbers 1–100 divisible by 4 or 6', 'Zahlen 1–100, die durch 4 oder 6 teilbar sind'],
      steps: [
        ['25 + 16 = 41', '25 + 16 = 41'],
        ['Both means divisible by lcm = 12: 8', 'Beides heißt durch kgV = 12 teilbar: 8'],
        ['41 − 8 = 33', '41 − 8 = 33'],
      ],
    },
    trap: ['“Both” means divisible by the lcm, not by the product (4 and 6 → 12, not 24).', '„Beides“ heißt durch das kgV teilbar, nicht durch das Produkt (4 und 6 → 12, nicht 24).'],
    use: ['Counting with conditions, derangements, “neither … nor” questions.', 'Zählen mit Bedingungen, fixpunktfreie Permutationen, „weder … noch“-Fragen.'],
    gen(r) {
      const [a, b] = r.pick([[2, 3], [3, 5], [4, 6], [6, 9], [4, 10], [3, 7], [5, 7], [6, 8], [10, 15]])
      const N = r.pick([100, 200, 500, 1000, 2026])
      const l = (a * b) / gcd(a, b)
      const A = Math.floor(N / a)
      const B = Math.floor(N / b)
      const AB = Math.floor(N / l)
      const neither = r.next() < 0.35
      const ans = neither ? N - (A + B - AB) : A + B - AB
      const steps = [`⌊${N}/${a}⌋ + ⌊${N}/${b}⌋ = ${A} + ${B}`, T(`Both: lcm = ${l}, ⌊${N}/${l}⌋ = ${AB}`, `Beides: kgV = ${l}, ⌊${N}/${l}⌋ = ${AB}`), `${A} + ${B} − ${AB} = ${A + B - AB}`]
      if (neither) steps.push(`${N} − ${A + B - AB} = ${ans}`)
      return {
        q: neither
          ? T(`How many of the numbers 1, 2, …, ${N} are divisible by neither ${a} nor ${b}?`, `Wie viele der Zahlen 1, 2, …, ${N} sind weder durch ${a} noch durch ${b} teilbar?`)
          : T(`How many of the numbers 1, 2, …, ${N} are divisible by ${a} or ${b}?`, `Wie viele der Zahlen 1, 2, …, ${N} sind durch ${a} oder ${b} teilbar?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: num(ans),
        steps,
      }
    },
  },
  {
    id: 'o-pigeonhole',
    group: 'oK',
    title: ['Pigeonhole', 'Schubfachprinzip'],
    rule: ['k boxes, k(m − 1) + 1 objects → some box has at least m.', 'k Schubfächer, k(m − 1) + 1 Objekte → ein Fach hat mindestens m.'],
    idea: [
      'The worst case fills every box with m − 1; one more object forces m somewhere. The art is choosing the boxes: remainders mod n, pairs that sum to something, parts of a square.',
      'Im schlimmsten Fall hat jedes Fach m − 1; ein Objekt mehr erzwingt irgendwo m. Die Kunst ist, die Fächer zu wählen: Reste mod n, Paare mit fester Summe, Teile eines Quadrats.',
    ],
    example: {
      q: ['Integers needed so two differ by a multiple of 7', 'Wie viele ganze Zahlen, damit zwei sich um ein Vielfaches von 7 unterscheiden?'],
      steps: [
        ['Boxes = the 7 remainders mod 7', 'Fächer = die 7 Reste mod 7'],
        ['8 integers force two in one box', '8 Zahlen erzwingen zwei im selben Fach'],
      ],
    },
    trap: ['Show the bound is sharp too: with one fewer it can fail.', 'Auch zeigen, dass die Schranke scharf ist: mit einem weniger kann es schiefgehen.'],
    use: ['Existence proofs: “show that two of them…”.', 'Existenzbeweise: „zeige, dass zwei davon …“.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const n = r.int(3, 30)
        return { q: T(`What is the smallest number of integers that guarantees two of them differ by a multiple of ${n}?`, `Wie viele ganze Zahlen braucht man mindestens, damit sich garantiert zwei um ein Vielfaches von ${n} unterscheiden?`), answer: n + 1, tol: 0.005, unit: ANY(), show: String(n + 1), steps: [T(`Boxes: the ${n} remainders mod ${n}`, `Fächer: die ${n} Reste mod ${n}`), T(`${n} can all differ, ${n + 1} can’t`, `${n} können alle verschieden sein, ${n + 1} nicht`)] }
      }
      if (kind === 1) {
        const k = r.int(3, 8)
        const m = r.int(2, 6)
        return { q: T(`A drawer has socks in ${k} colours. How many must you take out in the dark to be sure of ${m} of the same colour?`, `In einer Lade liegen Socken in ${k} Farben. Wie viele musst du im Dunkeln herausnehmen, um sicher ${m} gleichfarbige zu haben?`), answer: k * (m - 1) + 1, tol: 0.005, unit: ANY(), show: String(k * (m - 1) + 1), steps: [T(`Worst case: ${m - 1} of each colour = ${k * (m - 1)}`, `Schlimmster Fall: ${m - 1} von jeder Farbe = ${k * (m - 1)}`), `${k * (m - 1)} + 1 = ${k * (m - 1) + 1}`] }
      }
      const n = r.int(5, 50)
      return { q: T(`From 1, 2, …, ${2 * n}, how many numbers must you pick to be sure two of them add up to ${2 * n + 1}?`, `Wie viele Zahlen aus 1, 2, …, ${2 * n} muss man wählen, damit sicher zwei die Summe ${2 * n + 1} haben?`), answer: n + 1, tol: 0.005, unit: ANY(), show: String(n + 1), steps: [T(`Boxes: the ${n} pairs {1, ${2 * n}}, {2, ${2 * n - 1}}, …`, `Fächer: die ${n} Paare {1, ${2 * n}}, {2, ${2 * n - 1}}, …`), T(`${n} picks can avoid it (one from each pair), ${n + 1} can’t`, `${n} Zahlen gehen ohne (eine aus jedem Paar), ${n + 1} nicht`)] }
    },
  },
  {
    id: 'o-paths',
    group: 'oK',
    title: ['Paths on a grid', 'Wege im Gitter'],
    rule: ['Right/up paths from (0,0) to (a,b): C(a + b, a). Through a point: multiply the two parts.', 'Wege nur nach rechts/oben von (0,0) nach (a,b): C(a + b, a). Über einen Punkt: die zwei Teile multiplizieren.'],
    idea: [
      'A path is a word of a R’s and b U’s; choose which of the a + b steps are R. Forced points split the path into independent pieces.',
      'Ein Weg ist ein Wort aus a R und b O; man wählt, welche der a + b Schritte R sind. Pflichtpunkte zerlegen den Weg in unabhängige Teile.',
    ],
    example: {
      q: ['(0,0) → (4,3)', '(0,0) → (4,3)'],
      steps: [
        ['7 steps, 4 of them right', '7 Schritte, 4 davon nach rechts'],
        ['C(7, 4) = 35', 'C(7, 4) = 35'],
      ],
    },
    trap: ['Avoiding a point: total minus the paths through it.', 'Einen Punkt meiden: alle Wege minus die Wege durch ihn.'],
    use: ['Counting, bijections, binomial identities.', 'Abzählen, Bijektionen, Binomial-Identitäten.'],
    gen(r) {
      const a = r.int(2, 6)
      const b = r.int(2, 6)
      if (r.next() < 0.5) {
        const ans = C(a + b, a)
        return { q: T(`How many shortest grid paths (right and up only) go from (0, 0) to (${a}, ${b})?`, `Wie viele kürzeste Gitterwege (nur rechts und oben) führen von (0, 0) nach (${a}, ${b})?`), answer: ans, tol: 0.005, unit: ANY(), show: num(ans), steps: [T(`${a + b} steps, choose the ${a} right steps`, `${a + b} Schritte, die ${a} Rechtsschritte wählen`), `C(${a + b}, ${a}) = ${num(ans)}`] }
      }
      const x = r.int(1, a - 1)
      const y = r.int(1, b - 1)
      const p1 = C(x + y, x)
      const p2 = C(a - x + b - y, a - x)
      return {
        q: T(`How many shortest grid paths from (0, 0) to (${a}, ${b}) pass through (${x}, ${y})?`, `Wie viele kürzeste Gitterwege von (0, 0) nach (${a}, ${b}) gehen durch (${x}, ${y})?`),
        answer: p1 * p2,
        tol: 0.005,
        unit: ANY(),
        show: num(p1 * p2),
        steps: [`(0,0) → (${x},${y}): C(${x + y}, ${x}) = ${p1}`, `(${x},${y}) → (${a},${b}): C(${a - x + b - y}, ${a - x}) = ${p2}`, `${p1} · ${p2} = ${num(p1 * p2)}`],
      }
    },
  },

  /* ---------- Geometry ---------- */
  {
    id: 'o-angles',
    group: 'oG',
    title: ['Inscribed angles', 'Peripheriewinkel'],
    rule: ['An inscribed angle is half the central angle on the same arc. Same arc → same inscribed angle. Semicircle → 90°.', 'Ein Peripheriewinkel ist halb so groß wie der Zentriwinkel über demselben Bogen. Gleicher Bogen → gleicher Winkel. Halbkreis → 90°.'],
    idea: [
      'Most olympiad angle chases run on one theorem: angles standing on the same arc are equal. Mark every angle you know, then look for arcs that two angles share.',
      'Die meisten Winkeljagden laufen über einen Satz: Winkel über demselben Bogen sind gleich. Markiere jeden bekannten Winkel und such dann Bögen, die zwei Winkel gemeinsam haben.',
    ],
    example: {
      q: ['Central angle AOB = 110°. Angle ACB on the big arc?', 'Zentriwinkel AOB = 110°. Winkel ACB auf dem großen Bogen?'],
      steps: [['Half of 110° = 55°', 'Die Hälfte von 110° = 55°']],
    },
    trap: ['If C is on the small arc, the angle is 180° minus that.', 'Liegt C auf dem kleinen Bogen, ist der Winkel 180° minus das.'],
    use: ['Almost every GWF geometry problem: cyclic quadrilaterals, tangents, angle chasing.', 'Fast jede GWF-Geometrieaufgabe: Sehnenvierecke, Tangenten, Winkeljagd.'],
    gen(r) {
      const kind = r.int(0, 2)
      if (kind === 0) {
        const c = 2 * r.int(20, 85)
        return { q: T(`O is the centre of a circle through A, B, C, and ∠AOB = ${c}°. C lies on the larger arc AB. ∠ACB = ?`, `O ist der Mittelpunkt eines Kreises durch A, B, C, und ∠AOB = ${c}°. C liegt auf dem größeren Bogen AB. ∠ACB = ?`), answer: c / 2, tol: 0.05, unit: DEG, show: `${c / 2}°`, steps: [T(`Inscribed angle = half the central angle`, `Peripheriewinkel = halber Zentriwinkel`), `${c}° / 2 = ${c / 2}°`] }
      }
      if (kind === 1) {
        const c = 2 * r.int(20, 85)
        return { q: T(`O is the centre of a circle through A, B, C, and ∠AOB = ${c}°. C lies on the smaller arc AB. ∠ACB = ?`, `O ist der Mittelpunkt eines Kreises durch A, B, C, und ∠AOB = ${c}°. C liegt auf dem kleineren Bogen AB. ∠ACB = ?`), answer: 180 - c / 2, tol: 0.05, unit: DEG, show: `${180 - c / 2}°`, steps: [T(`From the far side: ${c / 2}°`, `Von der anderen Seite: ${c / 2}°`), T(`ACB and that angle form a cyclic quadrilateral: 180° − ${c / 2}° = ${180 - c / 2}°`, `Zusammen ein Sehnenviereck: 180° − ${c / 2}° = ${180 - c / 2}°`)] }
      }
      const a = r.int(25, 70)
      return { q: T(`AB is a diameter of a circle and C is on the circle with ∠CAB = ${a}°. ∠CBA = ?`, `AB ist ein Durchmesser eines Kreises, C liegt auf dem Kreis, ∠CAB = ${a}°. ∠CBA = ?`), answer: 90 - a, tol: 0.05, unit: DEG, show: `${90 - a}°`, steps: [T(`Thales: ∠ACB = 90°`, `Thales: ∠ACB = 90°`), `180° − 90° − ${a}° = ${90 - a}°`] }
    },
  },
  {
    id: 'o-cyclic',
    group: 'oG',
    title: ['Cyclic quadrilaterals', 'Sehnenvierecke'],
    rule: ['ABCD is cyclic ⇔ ∠A + ∠C = 180° ⇔ ∠ACB = ∠ADB.', 'ABCD ist ein Sehnenviereck ⇔ ∠A + ∠C = 180° ⇔ ∠ACB = ∠ADB.'],
    idea: [
      'Finding a hidden cyclic quadrilateral is often the key step: once four points are on a circle, every inscribed-angle equality comes for free. Look for two right angles on the same segment, or two equal angles seeing the same segment.',
      'Ein verstecktes Sehnenviereck zu finden ist oft der Schlüsselschritt: Liegen vier Punkte auf einem Kreis, bekommt man alle Peripheriewinkel-Gleichheiten gratis. Such nach zwei rechten Winkeln über derselben Strecke oder zwei gleichen Winkeln, die dieselbe Strecke sehen.',
    ],
    example: {
      q: ['Cyclic ABCD with ∠ABC = 100°. ∠ADC?', 'Sehnenviereck ABCD mit ∠ABC = 100°. ∠ADC?'],
      steps: [['Opposite angles: 180° − 100° = 80°', 'Gegenwinkel: 180° − 100° = 80°']],
    },
    trap: ['Opposite angles, not neighbouring ones, add to 180°.', 'Gegenüberliegende Winkel ergeben 180°, nicht benachbarte.'],
    use: ['Feet of altitudes, orthocentre problems, proving four points are concyclic.', 'Höhenfußpunkte, Höhenschnittpunkt-Aufgaben, vier Punkte auf einem Kreis zeigen.'],
    gen(r) {
      if (r.next() < 0.5) {
        const b = r.int(50, 140)
        return { q: T(`ABCD is a cyclic quadrilateral with ∠ABC = ${b}°. ∠ADC = ?`, `ABCD ist ein Sehnenviereck mit ∠ABC = ${b}°. ∠ADC = ?`), answer: 180 - b, tol: 0.05, unit: DEG, show: `${180 - b}°`, steps: [`∠ABC + ∠ADC = 180°`, `180° − ${b}° = ${180 - b}°`] }
      }
      const x = r.int(20, 60)
      const y = r.int(20, 80 - Math.floor(x / 2))
      return {
        q: T(`ABCD is cyclic. ∠BAC = ${x}° and ∠CAD = ${y}°. ∠BDC = ?`, `ABCD ist ein Sehnenviereck. ∠BAC = ${x}° und ∠CAD = ${y}°. ∠BDC = ?`),
        answer: x,
        tol: 0.05,
        unit: DEG,
        show: `${x}°`,
        steps: [T(`∠BDC and ∠BAC stand on the same arc BC`, `∠BDC und ∠BAC stehen über demselben Bogen BC`), T(`So ∠BDC = ${x}° (∠CAD is a distraction)`, `Also ∠BDC = ${x}° (∠CAD lenkt nur ab)`)],
      }
    },
  },
  {
    id: 'o-power',
    group: 'oG',
    title: ['Power of a point', 'Potenz eines Punktes'],
    rule: ['Chords through P: PA · PB = PC · PD. Tangent from P: PT² = PA · PB.', 'Sehnen durch P: PA · PB = PC · PD. Tangente von P: PT² = PA · PB.'],
    idea: [
      'For a point and a circle, the product of the distances to the two intersection points is the same for every line through the point. It turns lengths into equations — and equal products often mean four points on a circle.',
      'Für einen Punkt und einen Kreis ist das Produkt der Abstände zu den beiden Schnittpunkten für jede Gerade durch den Punkt gleich. Das macht aus Längen Gleichungen – und gleiche Produkte heißen oft vier Punkte auf einem Kreis.',
    ],
    example: {
      q: ['Chords AB and CD meet at P: PA = 4, PB = 6, PC = 3. PD?', 'Sehnen AB und CD schneiden sich in P: PA = 4, PB = 6, PC = 3. PD?'],
      steps: [
        ['4 · 6 = 3 · PD', '4 · 6 = 3 · PD'],
        ['PD = 8', 'PD = 8'],
      ],
    },
    trap: ['From outside, PB is the whole distance to the far point, not the chord length.', 'Von außen ist PB die ganze Strecke zum fernen Punkt, nicht die Sehnenlänge.'],
    use: ['Length problems with circles, radical axes, tangent lengths.', 'Längenaufgaben mit Kreisen, Potenzgeraden, Tangentenlängen.'],
    gen(r) {
      if (r.next() < 0.5) {
        const pa = r.int(2, 9)
        const pb = r.int(2, 12)
        const divs = Array.from({ length: pa * pb }, (_, i) => i + 1).filter((d) => (pa * pb) % d === 0 && d !== pa && d !== pb && d > 1 && d < pa * pb)
        const pc = divs.length ? r.pick(divs) : 1
        const pd = (pa * pb) / pc
        return { q: T(`Chords AB and CD of a circle meet at P. PA = ${pa}, PB = ${pb}, PC = ${pc}. PD = ?`, `Die Sehnen AB und CD eines Kreises schneiden sich in P. PA = ${pa}, PB = ${pb}, PC = ${pc}. PD = ?`), answer: pd, tol: 0.005, unit: ANY(), show: num(pd), steps: [`PA · PB = PC · PD`, `${pa} · ${pb} = ${pc} · PD → PD = ${num(pd)}`] }
      }
      const t = r.int(3, 12)
      const divs = Array.from({ length: t - 1 }, (_, i) => i + 1).filter((d) => (t * t) % d === 0 && d < t)
      const pa = r.pick(divs)
      const pb = (t * t) / pa
      return {
        q: T(`From P outside a circle, a line meets the circle at A and B with PA = ${pa} and PB = ${pb}. How long is a tangent from P to the circle?`, `Von einem Punkt P außerhalb eines Kreises schneidet eine Gerade den Kreis in A und B, mit PA = ${pa} und PB = ${pb}. Wie lang ist eine Tangente von P an den Kreis?`),
        answer: t,
        tol: 0.005,
        unit: ANY(),
        show: String(t),
        steps: [`PT² = PA · PB = ${pa} · ${pb} = ${t * t}`, `PT = ${t}`],
      }
    },
  },
  {
    id: 'o-triangle',
    group: 'oG',
    title: ['Area, inradius, sides', 'Fläche, Inkreis, Seiten'],
    rule: ['Heron: A = √(s(s−a)(s−b)(s−c)), s = half the perimeter. Inradius r = A / s.', 'Heron: A = √(s(s−a)(s−b)(s−c)), s = halber Umfang. Inkreisradius r = A / s.'],
    idea: [
      'The incircle splits the triangle into three triangles with height r, so A = r · s. Knowing a few “nice” triangles (3-4-5, 5-12-13, 13-14-15) by heart saves real time.',
      'Der Inkreis zerlegt das Dreieck in drei Dreiecke mit Höhe r, also A = r · s. Ein paar „schöne“ Dreiecke (3-4-5, 5-12-13, 13-14-15) auswendig zu kennen spart echt Zeit.',
    ],
    example: {
      q: ['Triangle 13, 14, 15', 'Dreieck 13, 14, 15'],
      steps: [
        ['s = 21, A = √(21 · 8 · 7 · 6) = 84', 's = 21, A = √(21 · 8 · 7 · 6) = 84'],
        ['r = 84 / 21 = 4', 'r = 84 / 21 = 4'],
      ],
    },
    trap: ['s is half the perimeter, not the whole perimeter.', 's ist der halbe Umfang, nicht der ganze.'],
    use: ['Area arguments, incircle and excircle problems.', 'Flächenargumente, Inkreis- und Ankreisaufgaben.'],
    gen(r) {
      const [a, b, c, A] = r.pick([[13, 14, 15, 84], [5, 12, 13, 30], [9, 10, 17, 36], [7, 15, 20, 42], [6, 8, 10, 24], [10, 13, 13, 60], [13, 20, 21, 126], [8, 15, 17, 60], [5, 5, 6, 12], [5, 5, 8, 12]])
      const s = (a + b + c) / 2
      const k = r.pick([1, 1, 2])
      const [x, y, z, area, ss] = [a * k, b * k, c * k, A * k * k, s * k]
      const steps = [`s = (${x} + ${y} + ${z}) / 2 = ${ss}`, `A = √(${ss} · ${ss - x} · ${ss - y} · ${ss - z}) = ${area}`]
      if (r.next() < 0.5) return { q: T(`What is the area of a triangle with sides ${x}, ${y}, ${z}?`, `Wie groß ist die Fläche eines Dreiecks mit den Seiten ${x}, ${y}, ${z}?`), answer: area, tol: 0.005, unit: ANY(), show: num(area), steps }
      const f = fracQ(area, ss)
      steps.push(`r = A / s = ${area} / ${ss}${f.show !== `${area}/${ss}` ? ` = ${f.show}` : ''}`)
      return { q: T(`What is the inradius of a triangle with sides ${x}, ${y}, ${z}?`, `Wie groß ist der Inkreisradius eines Dreiecks mit den Seiten ${x}, ${y}, ${z}?`), ...f, unit: ANY(), steps }
    },
  },
  {
    id: 'o-tri-ineq',
    group: 'oG',
    title: ['The triangle inequality', 'Die Dreiecksungleichung'],
    rule: ['a, b, c are the sides of a triangle ⇔ each is less than the sum of the other two ⇔ |a − b| < c < a + b.', 'a, b, c sind Seiten eines Dreiecks ⇔ jede ist kleiner als die Summe der anderen ⇔ |a − b| < c < a + b.'],
    idea: [
      'With two sides fixed, the third lives in an open interval. For integers that leaves 2·min(a, b) − 1 choices. The same inequality bounds distances in many geometry and algebra problems.',
      'Bei zwei festen Seiten liegt die dritte in einem offenen Intervall. Für ganze Zahlen bleiben 2·min(a, b) − 1 Möglichkeiten. Dieselbe Ungleichung schätzt Abstände in vielen Geometrie- und Algebraaufgaben ab.',
    ],
    example: {
      q: ['Sides 7 and 11, third side an integer', 'Seiten 7 und 11, dritte Seite ganzzahlig'],
      steps: [
        ['4 < c < 18', '4 < c < 18'],
        ['c = 5, …, 17: 13 values', 'c = 5, …, 17: 13 Werte'],
      ],
    },
    trap: ['Strict inequalities: c = a + b gives a flat “triangle”.', 'Strikte Ungleichungen: c = a + b gibt ein flaches „Dreieck“.'],
    use: ['Existence of triangles, bounds on lengths, inequalities between distances.', 'Existenz von Dreiecken, Schranken für Längen, Ungleichungen zwischen Abständen.'],
    gen(r) {
      const a = r.int(3, 30)
      const b = r.int(3, 30)
      const ans = 2 * Math.min(a, b) - 1
      return {
        q: T(`Two sides of a triangle are ${a} and ${b}. How many integer values can the third side take?`, `Zwei Seiten eines Dreiecks sind ${a} und ${b}. Wie viele ganzzahlige Werte kann die dritte Seite annehmen?`),
        answer: ans,
        tol: 0.005,
        unit: ANY(),
        show: String(ans),
        steps: [`${Math.abs(a - b)} < c < ${a + b}`, `c = ${Math.abs(a - b) + 1}, …, ${a + b - 1}: ${ans}`],
      }
    },
  },

  /* ---------- Instinct ---------- */
  {
    id: 'o-true-false',
    group: 'oX',
    title: ['True or false?', 'Wahr oder falsch?'],
    rule: ['A claim is false if one counterexample exists. Try small cases, 0, negatives, equal values.', 'Eine Aussage ist falsch, sobald es ein Gegenbeispiel gibt. Kleine Fälle, 0, negative und gleiche Werte probieren.'],
    idea: [
      'Half of solving olympiad problems is knowing which “facts” are really true. Before you rely on one in a proof, test it: n = 1, 2, 3, a negative number, two equal numbers. If it survives, find the reason.',
      'Die halbe Arbeit bei Olympiade-Aufgaben ist zu wissen, welche „Tatsachen“ wirklich stimmen. Bevor du dich in einem Beweis darauf verlässt, teste sie: n = 1, 2, 3, eine negative Zahl, zwei gleiche Zahlen. Hält sie, such den Grund.',
    ],
    example: {
      q: ['“If a | bc, then a | b or a | c.”', '„Wenn a | bc, dann a | b oder a | c.“'],
      steps: [
        ['Try a = 6, b = 2, c = 3: 6 | 6, but 6 ∤ 2 and 6 ∤ 3', 'Probier a = 6, b = 2, c = 3: 6 | 6, aber 6 ∤ 2 und 6 ∤ 3'],
        ['False — it is true when a is prime', 'Falsch – es stimmt, wenn a prim ist'],
      ],
    },
    trap: ['A few examples that work never prove a claim; one that fails always disproves it.', 'Ein paar Beispiele, die klappen, beweisen nichts; eines, das scheitert, widerlegt immer.'],
    use: ['Every problem: checking the lemmas your proof uses.', 'Jede Aufgabe: die Hilfsaussagen deines Beweises prüfen.'],
    gen(r) {
      const [en, de, truth, whyEn, whyDe] = r.pick(CLAIMS)
      const choices = [T('True', 'Wahr'), T('False', 'Falsch')]
      return { q: T(en, de), choices, answer: truth ? 0 : 1, show: choices[truth ? 0 : 1], steps: [T(whyEn, whyDe)] }
    },
  },
  {
    id: 'o-first-move',
    group: 'oX',
    title: ['Which idea cracks it?', 'Welche Idee knackt sie?'],
    rule: ['Before computing: what kind of problem is it, and which tool usually opens that kind?', 'Vor dem Rechnen: Welche Art Aufgabe ist das, und welches Werkzeug öffnet diese Art meistens?'],
    idea: [
      'Strong solvers don’t start by calculating — they recognise. “Find all integers with …” → factor, parity, mod. “Prove ≥” → AM-GM, squares. Four points and angles → cyclic quadrilateral. Here you read a real GWF problem and pick the idea its solution uses, no proof needed.',
      'Starke Löser fangen nicht mit Rechnen an – sie erkennen. „Finde alle ganzen Zahlen mit …“ → faktorisieren, Parität, mod. „Zeige ≥“ → AM-GM, Quadrate. Vier Punkte und Winkel → Sehnenviereck. Hier liest du eine echte GWF-Aufgabe und wählst die Idee, die ihre Lösung verwendet – ganz ohne Beweis.',
    ],
    example: {
      q: ['“Find all integers x, y with x² − y² = 2026.”', '„Finde alle ganzen Zahlen x, y mit x² − y² = 2026.“'],
      steps: [
        ['Difference of squares → factorisation (x − y)(x + y)', 'Differenz von Quadraten → Faktorisieren (x − y)(x + y)'],
        ['Both factors have the same parity, 2026 = 2 · 1013 → no solution', 'Beide Faktoren haben dieselbe Parität, 2026 = 2 · 1013 → keine Lösung'],
      ],
    },
    trap: ['Several ideas can appear in one solution — pick the one that’s listed.', 'Eine Lösung kann mehrere Ideen enthalten – wähl die, die angeboten wird.'],
    use: ['The first five minutes of every competition problem.', 'Die ersten fünf Minuten jeder Wettbewerbsaufgabe.'],
    gen(r) {
      const usable = BANK.filter((p) => p.techniques?.some((x) => !GENERIC.has(x)))
      if (!usable.length) return { q: T('Loading the past problems…', 'Die Altaufgaben werden geladen …'), choices: ['—'], answer: 0, show: '—', steps: [] }
      const p = r.pick(usable)
      const own = new Set(p.techniques)
      const right = r.pick(p.techniques.filter((x) => !GENERIC.has(x)))
      // One wrong option from the same area, so the area alone doesn't give it away
      const fromArea = (same) => [...new Set(BANK.filter((x) => (x.area === p.area) === same).flatMap((x) => x.techniques))].filter((x) => !own.has(x) && !GENERIC.has(x))
      const near = fromArea(true)
      const far = fromArea(false)
      const wrong = []
      if (near.length) wrong.push(near[Math.floor(r.next() * near.length)])
      while (wrong.length < 3 && far.length) wrong.push(...far.splice(Math.floor(r.next() * far.length), 1))
      const opts = [right, ...wrong]
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(r.next() * (i + 1))
        ;[opts[i], opts[j]] = [opts[j], opts[i]]
      }
      const label = (x) => (getLang() === 'de' ? TECH_DE[x] || x : x === x.toLowerCase() && x.length > 3 ? x.charAt(0).toUpperCase() + x.slice(1) : x)
      const statement = getLang() === 'de' ? p.qDe || p.q : p.q || p.qDe
      return {
        q: `${p.comp || 'GWF'} ${p.year} · ${p.n}\n\n${statement}`,
        choices: opts.map(label),
        answer: opts.indexOf(right),
        show: label(right),
        bank: p.id,
        steps: [T(`The way in: ${p.hints[0]}`, `Der Einstieg (englisch): ${p.hints[0]}`), T(`Ideas in the solution: ${p.techniques.map(label).join(', ')}`, `Ideen in der Lösung: ${p.techniques.map(label).join(', ')}`)],
      }
    },
  },
]

// Labels that fit almost any problem make bad wrong answers
const GENERIC = new Set(['case analysis', 'equality case', 'construction', 'size bounds', 'construction + bound', 'contradiction', 'induction', 'symmetry', 'substitution', 'counting'])

const TECH_DE = {
  'case analysis': 'Fallunterscheidung',
  'inscribed angle theorem': 'Peripheriewinkelsatz',
  'equality case': 'Gleichheitsfall',
  'cyclic quadrilateral': 'Sehnenviereck',
  'modular arithmetic': 'Modulo-Rechnung',
  parity: 'Parität',
  'angle chasing': 'Winkeljagd',
  factorisation: 'Faktorisieren',
  'size bounds': 'Größenabschätzung',
  invariant: 'Invariante',
  'AM-GM': 'AM-GM',
  construction: 'Konstruktion',
  induction: 'Induktion',
  SOS: 'Quadratsummen (SOS)',
  substitution: 'Substitution',
  'game strategy': 'Spielstrategie',
  'power of a point': 'Potenz eines Punktes',
  'similar triangles': 'Ähnliche Dreiecke',
  counting: 'Abzählen',
  'double counting': 'Doppeltes Abzählen',
  gcd: 'ggT',
  'HM-AM': 'HM-AM',
  'construction + bound': 'Schranke + Konstruktion',
  'extremal principle': 'Extremalprinzip',
  divisibility: 'Teilbarkeit',
  reflection: 'Spiegelung',
  'divisor counting': 'Teiler zählen',
  'squares between squares': 'Quadrate zwischen Quadraten',
  symmetry: 'Symmetrie',
  Thales: 'Thales',
  orthocenter: 'Höhenschnittpunkt',
  contradiction: 'Widerspruch',
  'isogonal lines': 'Isogonale',
  'Euclidean algorithm': 'Euklidischer Algorithmus',
  telescoping: 'Teleskopsumme',
  'quadratic discriminant': 'Diskriminante',
  'incenter-excenter lemma': 'Inkreis-Ankreis-Lemma',
  'QM-AM': 'QM-AM',
  bijection: 'Bijektion',
  'p-adic valuation': 'p-adische Bewertung',
  'Fermat little theorem': 'Kleiner Fermat',
  smoothing: 'Glätten',
  inversion: 'Inversion',
  'Cauchy-Schwarz': 'Cauchy-Schwarz',
  recursion: 'Rekursion',
}

// [English, German, true?, why (en), why (de)]
const CLAIMS = [
  ['Every perfect square leaves remainder 0 or 1 when divided by 4.', 'Jede Quadratzahl lässt bei Division durch 4 den Rest 0 oder 1.', true, '(2k)² = 4k², (2k+1)² = 4k² + 4k + 1.', '(2k)² = 4k², (2k+1)² = 4k² + 4k + 1.'],
  ['A perfect square can end in the digit 7.', 'Eine Quadratzahl kann auf die Ziffer 7 enden.', false, 'Squares end in 0, 1, 4, 5, 6 or 9 — check 0² to 9².', 'Quadrate enden auf 0, 1, 4, 5, 6 oder 9 – prüfe 0² bis 9².'],
  ['n³ − n is divisible by 6 for every integer n.', 'n³ − n ist für jede ganze Zahl n durch 6 teilbar.', true, 'n³ − n = (n − 1)n(n + 1): three consecutive integers.', 'n³ − n = (n − 1)n(n + 1): drei aufeinanderfolgende Zahlen.'],
  ['p² − 1 is divisible by 24 for every prime p.', 'p² − 1 ist für jede Primzahl p durch 24 teilbar.', false, 'p = 2 gives 3 and p = 3 gives 8. It is true for every prime p ≥ 5.', 'p = 2 gibt 3 und p = 3 gibt 8. Für jede Primzahl p ≥ 5 stimmt es.'],
  ['x + 1/x ≥ 2 for every real x ≠ 0.', 'x + 1/x ≥ 2 für jedes reelle x ≠ 0.', false, 'x = −1 gives −2. It holds for x > 0 (AM-GM).', 'x = −1 gibt −2. Es gilt für x > 0 (AM-GM).'],
  ['a² + b² ≥ 2ab for all real a, b.', 'a² + b² ≥ 2ab für alle reellen a, b.', true, 'a² + b² − 2ab = (a − b)² ≥ 0.', 'a² + b² − 2ab = (a − b)² ≥ 0.'],
  ['A sum of two squares can leave remainder 3 when divided by 4.', 'Eine Summe zweier Quadrate kann bei Division durch 4 den Rest 3 lassen.', false, 'Each square is 0 or 1 mod 4, so the sum is 0, 1 or 2.', 'Jedes Quadrat ist 0 oder 1 mod 4, die Summe also 0, 1 oder 2.'],
  ['Among any 5 integers, two differ by a multiple of 4.', 'Unter je 5 ganzen Zahlen unterscheiden sich zwei um ein Vielfaches von 4.', true, 'Pigeonhole: only 4 remainders mod 4.', 'Schubfach: nur 4 Reste mod 4.'],
  ['If a divides bc, then a divides b or a divides c.', 'Wenn a ein Teiler von bc ist, dann teilt a auch b oder c.', false, '6 | 2 · 3 but 6 ∤ 2 and 6 ∤ 3. True when a is prime.', '6 | 2 · 3, aber 6 ∤ 2 und 6 ∤ 3. Stimmt, wenn a prim ist.'],
  ['The orthocentre of a triangle always lies inside it.', 'Der Höhenschnittpunkt eines Dreiecks liegt immer innen.', false, 'In an obtuse triangle it lies outside; in a right triangle it is the right-angle vertex.', 'Im stumpfwinkligen Dreieck liegt er außen, im rechtwinkligen ist er die Ecke beim rechten Winkel.'],
  ['The centroid of a triangle always lies inside it.', 'Der Schwerpunkt eines Dreiecks liegt immer innen.', true, 'It is on every median, 2/3 of the way from the vertex.', 'Er liegt auf jeder Schwerlinie, 2/3 vom Eckpunkt entfernt.'],
  ['gcd(a, b) · lcm(a, b) = ab for all positive integers a, b.', 'ggT(a, b) · kgV(a, b) = ab für alle positiven ganzen a, b.', true, 'For each prime, min + max of the two exponents = their sum.', 'Für jede Primzahl gilt: Minimum + Maximum der Exponenten = ihre Summe.'],
  ['gcd(a, b, c) · lcm(a, b, c) = abc for all positive integers.', 'ggT(a, b, c) · kgV(a, b, c) = abc für alle positiven ganzen Zahlen.', false, 'a = b = c = 2: 2 · 2 = 4 ≠ 8.', 'a = b = c = 2: 2 · 2 = 4 ≠ 8.'],
  ['A positive integer has an odd number of divisors exactly when it is a perfect square.', 'Eine positive ganze Zahl hat genau dann ungerade viele Teiler, wenn sie eine Quadratzahl ist.', true, 'Divisors pair up as d and n/d; only √n is its own partner.', 'Teiler bilden Paare d und n/d; nur √n ist sein eigener Partner.'],
  ['2ⁿ > n² for every positive integer n.', '2ⁿ > n² für jede positive ganze Zahl n.', false, 'n = 2, 3, 4 fail (n = 3: 8 < 9). It holds from n = 5 on.', 'n = 2, 3, 4 scheitern (n = 3: 8 < 9). Ab n = 5 stimmt es.'],
  ['Every real polynomial of odd degree has a real root.', 'Jedes reelle Polynom ungeraden Grades hat eine reelle Nullstelle.', true, 'It goes to −∞ on one side and +∞ on the other, so it crosses 0.', 'Es geht auf einer Seite gegen −∞, auf der anderen gegen +∞, kreuzt also die 0.'],
  ['An integer root of a polynomial with integer coefficients divides the constant term.', 'Eine ganzzahlige Nullstelle eines Polynoms mit ganzen Koeffizienten teilt das konstante Glied.', true, 'P(r) = 0 means a₀ = −r(aₙrⁿ⁻¹ + … + a₁).', 'P(r) = 0 heißt a₀ = −r(aₙrⁿ⁻¹ + … + a₁).'],
  ['An n-element set has n² subsets.', 'Eine Menge mit n Elementen hat n² Teilmengen.', false, 'Each element is in or out: 2ⁿ subsets.', 'Jedes Element ist drin oder nicht: 2ⁿ Teilmengen.'],
  ['In any group of at least 2 people, two have the same number of friends in the group.', 'In jeder Gruppe von mindestens 2 Leuten haben zwei gleich viele Freunde in der Gruppe.', true, 'Degrees are 0 … n − 1, but 0 and n − 1 can’t both occur: pigeonhole.', 'Die Anzahlen sind 0 … n − 1, aber 0 und n − 1 können nicht beide vorkommen: Schubfach.'],
  ['The product of four consecutive integers, plus 1, is always a perfect square.', 'Das Produkt von vier aufeinanderfolgenden ganzen Zahlen plus 1 ist immer eine Quadratzahl.', true, 'n(n+1)(n+2)(n+3) + 1 = (n² + 3n + 1)².', 'n(n+1)(n+2)(n+3) + 1 = (n² + 3n + 1)².'],
  ['n⁵ − n is divisible by 30 for every integer n.', 'n⁵ − n ist für jede ganze Zahl n durch 30 teilbar.', true, 'By Fermat it is divisible by 2, 3 and 5.', 'Nach Fermat ist es durch 2, 3 und 5 teilbar.'],
  ['If a² ≡ b² (mod m), then a ≡ b or a ≡ −b (mod m).', 'Wenn a² ≡ b² (mod m), dann a ≡ b oder a ≡ −b (mod m).', false, 'm = 8: 1² ≡ 3² ≡ 1, but 1 ≢ ±3. True when m is prime.', 'm = 8: 1² ≡ 3² ≡ 1, aber 1 ≢ ±3. Stimmt, wenn m prim ist.'],
  ['1 + 2 + … + n is divisible by n for every n.', '1 + 2 + … + n ist für jedes n durch n teilbar.', false, 'n = 2: the sum is 3. It works exactly for odd n.', 'n = 2: die Summe ist 3. Es klappt genau für ungerade n.'],
  ['An 8×8 board with two opposite corners removed can be tiled by dominoes.', 'Ein 8×8-Brett ohne zwei gegenüberliegende Ecken lässt sich mit Dominosteinen pflastern.', false, 'Both removed squares have the same colour; each domino covers one of each.', 'Beide entfernten Felder haben dieselbe Farbe; jeder Domino deckt eines von jeder.'],
  ['The angle bisector from A divides BC in the ratio AB : AC.', 'Die Winkelhalbierende von A teilt BC im Verhältnis AB : AC.', true, 'The angle bisector theorem.', 'Der Winkelhalbierendensatz.'],
  ['If a + b + c = 0, then a³ + b³ + c³ = 3abc.', 'Wenn a + b + c = 0, dann a³ + b³ + c³ = 3abc.', true, 'a³ + b³ + c³ − 3abc = (a + b + c)(a² + b² + c² − ab − bc − ca).', 'a³ + b³ + c³ − 3abc = (a + b + c)(a² + b² + c² − ab − bc − ca).'],
  ['x² + y² = 3z² has a solution in positive integers.', 'x² + y² = 3z² hat eine Lösung in positiven ganzen Zahlen.', false, 'Mod 3 forces 3 | x and 3 | y, then 3 | z: infinite descent.', 'Mod 3 erzwingt 3 | x und 3 | y, dann 3 | z: unendlicher Abstieg.'],
  ['√2 + √3 is irrational.', '√2 + √3 ist irrational.', true, 'If it were rational, squaring gives √6 rational — it isn’t.', 'Wäre es rational, wäre nach dem Quadrieren √6 rational – ist es nicht.'],
  ['A quadrilateral whose opposite angles add up to 180° is cyclic.', 'Ein Viereck, dessen Gegenwinkel zusammen 180° ergeben, ist ein Sehnenviereck.', true, 'The converse of the inscribed angle theorem.', 'Die Umkehrung des Peripheriewinkelsatzes.'],
  ['Every parallelogram is cyclic.', 'Jedes Parallelogramm ist ein Sehnenviereck.', false, 'Opposite angles are equal, so they add to 180° only for rectangles.', 'Gegenwinkel sind gleich, ergeben also nur beim Rechteck 180°.'],
  ['Every integer greater than 1 has a prime divisor.', 'Jede ganze Zahl größer als 1 hat einen Primteiler.', true, 'Its smallest divisor greater than 1 is prime.', 'Ihr kleinster Teiler größer als 1 ist prim.'],
  ['If n² is divisible by 4, then n is divisible by 4.', 'Wenn n² durch 4 teilbar ist, dann ist n durch 4 teilbar.', false, 'n = 2: 4 | 4 but 4 ∤ 2. Only 2 | n follows.', 'n = 2: 4 | 4, aber 4 ∤ 2. Es folgt nur 2 | n.'],
  ['(a + b)/2 ≥ √(ab) holds for all real a, b.', '(a + b)/2 ≥ √(ab) gilt für alle reellen a, b.', false, 'AM-GM needs a, b ≥ 0; otherwise √(ab) may not even exist.', 'AM-GM braucht a, b ≥ 0; sonst existiert √(ab) eventuell gar nicht.'],
  ['The two tangent segments from a point outside a circle have equal length.', 'Die beiden Tangentenabschnitte von einem Punkt außerhalb eines Kreises sind gleich lang.', true, 'Congruent right triangles with the radius.', 'Kongruente rechtwinklige Dreiecke mit dem Radius.'],
  ['A triangle with sides 5, 6 and 12 exists.', 'Ein Dreieck mit den Seiten 5, 6 und 12 existiert.', false, '5 + 6 = 11 < 12 breaks the triangle inequality.', '5 + 6 = 11 < 12 verletzt die Dreiecksungleichung.'],
  ['C(n, k) = C(n, n − k).', 'C(n, k) = C(n, n − k).', true, 'Choosing who is in = choosing who is out.', 'Wählen, wer dabei ist = wählen, wer nicht dabei ist.'],
  ['The sum of the digits of a multiple of 3 is a multiple of 3.', 'Die Ziffernsumme eines Vielfachen von 3 ist ein Vielfaches von 3.', true, 'n ≡ digit sum (mod 3) because 10 ≡ 1.', 'n ≡ Ziffernsumme (mod 3), weil 10 ≡ 1.'],
  ['If p is prime, then 2ᵖ − 1 is prime.', 'Wenn p prim ist, dann ist 2ᵖ − 1 prim.', false, 'p = 11: 2047 = 23 · 89.', 'p = 11: 2047 = 23 · 89.'],
  ['For x, y > 0: (x + y)(1/x + 1/y) ≥ 4.', 'Für x, y > 0: (x + y)(1/x + 1/y) ≥ 4.', true, 'Expand: 2 + x/y + y/x ≥ 2 + 2.', 'Ausmultiplizieren: 2 + x/y + y/x ≥ 2 + 2.'],
  ['n² + n + 41 is prime for every positive integer n.', 'n² + n + 41 ist für jede positive ganze Zahl n prim.', false, 'n = 40 gives 41², and n = 41 gives 41 · 43.', 'n = 40 gibt 41², und n = 41 gibt 41 · 43.'],
]
