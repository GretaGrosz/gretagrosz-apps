// Blank's word check (free, no AI): slurs, sexual words, "kill yourself" and the like, and ways to move a chat
// somewhere private (phone numbers, Snapchat, Telegram...), in English, German and Hungarian.
// Posts that hit it wait in the admin queue; names, bios and usernames that hit it are refused.
// Text is lowercased, accents and 1337 spelling are undone, and repeated letters count once ("fuuuck"), so
// a word list entry catches its common variants. Add words here; keep short ones in WORDS (whole words only),
// because inside other words they'd catch innocent text ("class", "grape").

// Whole words only
const WORDS = [
  // en
  'cunt', 'cunts', 'fag', 'fags', 'faggot', 'faggots', 'nigga', 'niggas', 'nigger', 'niggers', 'retard', 'retards', 'tranny',
  'whore', 'whores', 'slut', 'sluts', 'rape', 'raped', 'rapist', 'dick', 'dicks', 'cock', 'pussy', 'tits', 'boobs', 'anal',
  'cum', 'nude', 'nudes', 'naked', 'sex', 'sexy', 'horny', 'blowjob', 'kys', 'stfu', 'nazi', 'nazis', 'hitler', 'heil',
  // de
  'fotze', 'hure', 'huren', 'hurensohn', 'schlampe', 'wichser', 'missgeburt', 'spast', 'spasti', 'kanake', 'schwuchtel', 'nackt', 'nacktbilder',
  // hu
  'kurva', 'kurvak', 'kurvanyad', 'fasz', 'faszt', 'faszom', 'faszfej', 'geci', 'gecik', 'picsa', 'picsaba', 'pina', 'buzi', 'buzik',
  'csicska', 'cigany', 'meztelen', 'szex', 'basz', 'baszd', 'bazd', 'bazmeg', 'baszki', 'kurvaanyad',
  // moving the chat somewhere private
  'snapchat', 'snap', 'telegram', 'whatsapp', 'kik', 'onlyfans',
]

// Phrases (words in a row)
const PHRASES = [
  'kill yourself', 'kill urself', 'go die', 'hang yourself', 'fuck you', 'fuck off', 'suck my', 'send nudes', 'send pics',
  'add me on', 'dm me on', 'text me',
  'bring dich um', 'toete dich', 'sieg heil', 'heil hitler', 'fick dich', 'schick nacktbilder',
  'old meg magad', 'nyird ki magad', 'dogolj meg', 'bazd meg', 'baszd meg', 'kurva anyad', 'anyad picsaja',
]

// Inside any word too (for usernames like "xxfuckerxx"): only ones that are never part of an innocent word
const ANYWHERE = ['fuck', 'nigger', 'nigga', 'faggot', 'hitler', 'kurva', 'fasz', 'geci', 'fotze', 'hurensohn', 'wichser', 'porn', 'hentai', 'onlyfans']

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' }
const squeeze = (s) => s.replace(/(.)\1+/g, '$1')
function normal(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[013457@$!]/g, (c) => LEET[c])
    .replace(/[^a-z]+/g, ' ')
    .trim()
}

// A list entry with double letters ("nigger") only matches as written, so squeezing can't make it hit innocent
// words ("niger", "nigeria"); entries without doubles also match squeezed text ("fuuuck").
const forms = (list) => ({ exact: new Set(list), squeezed: new Set(list.filter((w) => squeeze(w) === w)) })
const W = forms(WORDS)

export function badWords(...texts) {
  const text = normal(texts.join(' '))
  if (!text) return false
  // Letters spelled out one by one ("k y s", "f.u.c.k") count as one word too
  const words = text.split(' ')
  words.push(...(text.match(/\b[a-z](?: [a-z]\b)+/g) || []).map((w) => w.replace(/ /g, '')))
  const sq = squeeze(text)
  if (words.some((w) => W.exact.has(w) || W.squeezed.has(squeeze(w)))) return true
  const padded = ` ${text} `
  const paddedSq = ` ${sq} `
  if (PHRASES.some((p) => padded.includes(` ${p} `) || (squeeze(p) === p && paddedSq.includes(` ${p} `)))) return true
  if (words.some((word) => ANYWHERE.some((w) => word.includes(w) || (squeeze(w) === w && squeeze(word).includes(w))))) return true
  // A phone number: 8 or more digits, maybe with spaces, dashes, dots or a +
  if (texts.some((t) => /(?:\+|\b)\d(?:[\s.\-/()]*\d){7,}\b/.test(String(t || '')))) return true
  return false
}
