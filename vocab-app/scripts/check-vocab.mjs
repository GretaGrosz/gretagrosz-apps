// Data + marking check over every day and every language pair.
//   node scripts/check-vocab.mjs            → report, exits 1 if a hard rule breaks
//   node scripts/check-vocab.mjs <old.js>   → also runs an older checker (signature checkAnswer(input, answers, lang)) for comparison
// Hard rules: 10 complete rows a day, no duplicate prompt inside a day, every answer accepted for itself,
// no answer of another word of the same day accepted, the prompt typed back never accepted unless it really is the answer.
import { pathToFileURL } from 'url'
import { DAYS, LANGUAGES, wordsForDay, dictionary } from '../src/words.js'
import { checkAnswer, clean, forms } from '../src/check.js'

const oldPath = process.argv[2]
const old = oldPath ? (await import(pathToFileURL(oldPath))).checkAnswer : null
const IDS = LANGUAGES.map((l) => l.id)
const PAIRS = IDS.flatMap((f) => IDS.filter((t) => t !== f).map((t) => [f, t]))
const fail = []

// 1. structure
DAYS.forEach((d, i) => {
  if (d.words.length !== 10) fail.push(`day ${i + 1} has ${d.words.length} words`)
  d.words.forEach((r) => (r.length !== 5 || r.some((c) => !c)) && fail.push(`day ${i + 1} bad row ${JSON.stringify(r)}`))
})

// 2. duplicate prompts inside a day (per own language)
const dupes = []
DAYS.forEach((d, i) =>
  IDS.forEach((l, c) => {
    const seen = new Set()
    d.words.forEach((r) => {
      const shown = r[c].split('|')[0].toLowerCase()
      if (seen.has(shown)) dupes.push(`day ${i + 1} (${d.theme}) ${l}: "${r[c].split('|')[0]}"`)
      seen.add(shown)
    })
  }),
)

const ctxFor = (words, from, to) => ({ lang: to, from, others: words, dict: dictionary(to) })
const newCheck = (input, word, words, from, to) => checkAnswer(input, word, ctxFor(words, from, to)).correct
const oldCheck = (input, word, _w, _f, to) => old(input, word.answers, to).correct

function run(check) {
  let self = 0, selfFail = [], cross = 0, crossEx = [], prompt = 0, promptReal = 0, promptEx = [], slips = 0, slipsOk = 0
  for (const [from, to] of PAIRS) {
    for (let d = 0; d < DAYS.length; d++) {
      const { words } = wordsForDay(d, from, to)
      for (const w of words) {
        // every answer is accepted for its own word
        for (const a of w.answers) {
          self++
          if (!check(a, w, words, from, to)) selfFail.push(`day ${d + 1} ${from}→${to} "${a}" for "${w.front}"`)
        }
        // another word's answer typed in
        for (const v of words) {
          if (v === w) continue
          if (v.front.trim().toLowerCase() === w.front.trim().toLowerCase()) continue // twin prompts accept both
          const own = new Set(w.answers.map((a) => forms(a, to).norm))
          const typed = v.answers.find((a) => !own.has(forms(a, to).norm) && check(a, w, words, from, to)) // the same answer for two prompts is fine
          if (typed) {
            cross++
            if (crossEx.length < 12) crossEx.push(`day ${d + 1} ${from}→${to}: "${typed}" (= ${v.front}) accepted for "${w.front}"`)
          }
        }
        // the prompt typed back
        if (check(w.front, w, words, from, to)) {
          const real = w.answers.some((a) => forms(a, to).loose === forms(w.front, from).loose || forms(a, to).bare === forms(w.front, from).bare)
          if (real) promptReal++
          else {
            prompt++
            if (promptEx.length < 12) promptEx.push(`${from}→${to} "${w.front}" for [${w.answers[0]}]`)
          }
        }
        // a real slip in the main answer (5+ letters) should still pass
        if (from === 'en' || (from === 'de' && to === 'en')) {
          const a = w.answers[0]
          const core = forms(a, to).core
          if (core.replace(/[\s'-]/g, '').length >= 6) {
            const k = Math.floor(core.length / 2)
            const variants = [core.slice(0, k) + core.slice(k + 1), core.slice(0, k - 1) + core[k] + core[k - 1] + core.slice(k + 1)]
            for (const slip of variants) {
              if (slip.toLowerCase() === core.toLowerCase()) continue
              slips++
              if (check(slip, w, words, from, to)) slipsOk++
            }
          }
        }
      }
    }
  }
  return { self, selfFail, cross, crossEx, prompt, promptReal, promptEx, slips, slipsOk }
}

const pct = (a, b) => `${((a / b) * 100).toFixed(1)}%`
function report(name, r) {
  console.log(`\n== ${name} (${DAYS.length} days × ${PAIRS.length} language pairs)`)
  console.log(`own answer accepted:            ${r.self - r.selfFail.length} of ${r.self}`)
  r.selfFail.slice(0, 10).forEach((x) => console.log('   ✗ ' + x))
  console.log(`another word of the day passes: ${r.cross}`)
  r.crossEx.slice(0, 6).forEach((x) => console.log('   ' + x))
  console.log(`prompt typed back passes:       ${r.prompt} (plus ${r.promptReal} where the word really is the same, e.g. Baby → baby)`)
  r.promptEx.slice(0, 6).forEach((x) => console.log('   ' + x))
  console.log(`real one-letter slips accepted: ${r.slipsOk} of ${r.slips} (${pct(r.slipsOk, r.slips)})`)
}

console.log(`duplicate prompts inside a day: ${dupes.length}`)
dupes.slice(0, 40).forEach((x) => console.log('   ' + x))
if (old) report('old checker', run(oldCheck))
const now = run(newCheck)
report('current checker', now)

if (dupes.length) fail.push(`${dupes.length} duplicate prompts`)
if (now.selfFail.length) fail.push(`${now.selfFail.length} answers not accepted for their own word`)
if (now.cross) fail.push(`${now.cross} answers of another word accepted`)
if (now.prompt) fail.push(`${now.prompt} prompts typed back accepted`)
if (fail.length) {
  console.log('\nFAIL\n' + fail.slice(0, 30).join('\n'))
  process.exit(1)
}
console.log('\nOK')
