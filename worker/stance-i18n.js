// German for the Stance API: error messages (the client sends x-lang) and push notifications
// (written in the recipient's language, users.lang).
import { questions } from './stance-content.js'
import { questionsDe } from './stance-content-de.js'

const DE = {
  'Something went wrong': 'Etwas ist schiefgelaufen',
  'Usernames are 3–20 letters, numbers or _': 'Benutzernamen haben 3–20 Buchstaben, Ziffern oder _',
  'Too many new accounts from here today': 'Von hier wurden heute schon zu viele Konten erstellt',
  'That key does not match any account': 'Dieser Schlüssel gehört zu keinem Konto',
  'That took too long, try again': 'Das hat zu lange gedauert. Versuch es noch einmal',
  'That passkey is not linked to an account anymore': 'Dieser Passkey gehört zu keinem Konto mehr',
  'That account was deleted': 'Dieses Konto wurde gelöscht',
  'Please sign in': 'Bitte melde dich an',
  'Pick a side': 'Wähle eine Seite',
  'To change sides, mark the argument that convinced you': 'Um die Seite zu wechseln, markiere das Argument, das dich überzeugt hat',
  'Slow down a little': 'Mach kurz langsamer',
  "You can't mark your own argument": 'Dein eigenes Argument kannst du nicht markieren',
  'Take a side on this question first': 'Bezieh zuerst Stellung zu dieser Frage',
  'Take a side first': 'Bezieh zuerst Stellung',
  "You're already on that side": 'Du bist schon auf dieser Seite',
  'Give it a minute before you switch again': 'Warte eine Minute, bevor du wieder wechselst',
  'Take a side on this question first. Then you can read the arguments.': 'Bezieh zuerst Stellung zu dieser Frage. Dann kannst du die Argumente lesen.',
  'Take a side on the question before you argue': 'Bezieh Stellung, bevor du mitdiskutierst',
  "That was today's last round of Argue back. More tomorrow": 'Das war heute die letzte Runde Gegenrede. Morgen geht es weiter',
  'Not found': 'Nicht gefunden',
  "It's not your turn": 'Du bist nicht dran',
  'Unknown list': 'Unbekannte Liste',
  "You can't debate yourself": 'Mit dir selbst kannst du nicht debattieren',
  'You are both on the same side of this one': 'Ihr seid bei dieser Frage auf derselben Seite',
  'Ten new debates a day is the limit': 'Zehn neue Debatten am Tag sind das Limit',
  'Only a challenge nobody has accepted yet can be withdrawn': 'Zurückziehen geht nur, solange noch niemand angenommen hat',
  "You can't accept your own challenge": 'Deine eigene Herausforderung kannst du nicht annehmen',
  'This challenge is for someone else': 'Diese Herausforderung ist für jemand anderen',
  'This debate has already started': 'Diese Debatte hat schon begonnen',
  'Someone else just accepted it': 'Jemand anderes hat gerade angenommen',
  'Nothing to decline': 'Hier gibt es nichts abzulehnen',
  'Only a declined challenge can be posted as an open one': 'Nur eine abgelehnte Herausforderung kann offen gepostet werden',
  'Voting opens when the debate ends': 'Abstimmen kannst du, wenn die Debatte vorbei ist',
  'This debate was decided by a forfeit': 'Diese Debatte wurde durch Aufgabe entschieden',
  "Debaters can't vote on their own debate": 'Über die eigene Debatte stimmt man nicht ab',
  'Write a topic first': 'Schreib zuerst ein Thema',
  'Add some topics first': 'Füge zuerst Themen hinzu',
  'Twenty talks an hour is plenty. Take a break': 'Zwanzig Vorträge pro Stunde reichen. Mach eine Pause',
  'No recording attached': 'Keine Aufnahme dabei',
  'That recording is too long': 'Diese Aufnahme ist zu lang',
  'That recording is empty': 'Diese Aufnahme ist leer',
  'Unsupported audio format': 'Dieses Audioformat wird nicht unterstützt',
  'Bad subscription': 'Ungültiges Abo',
  'You already have plenty of passkeys': 'Du hast schon genug Passkeys',
  'No such question': 'Diese Frage gibt es nicht',
  'That question has not been asked yet': 'Diese Frage wurde noch nicht gestellt',
  'That argument was deleted': 'Dieses Argument wurde gelöscht',
  'That debate is gone': 'Diese Debatte gibt es nicht mehr',
  'Agora is very busy today. Try again tomorrow': 'Agora ist heute sehr gefragt. Versuch es morgen wieder',
  'No one here by that name': 'Niemand mit diesem Namen',
}
const FIELD = {
  Name: 'Der Name', Bio: 'Die Bio', 'Your argument': 'Dein Argument', 'Your reply': 'Deine Antwort', 'The motion': 'Die These',
  'The context': 'Der Kontext', 'Your opening': 'Deine Eröffnung', 'A topic': 'Ein Thema', 'The topic': 'Das Thema',
}
const PATTERNS = [
  [/^@(\w+) is taken$/, m => `@${m[1]} ist schon vergeben`],
  [/^Up to (\d+) topics$/, m => `Höchstens ${m[1]} Themen`],
  [/^(.+) needs at least (\d+) characters$/, m => `${FIELD[m[1]] || m[1]} braucht mindestens ${m[2]} Zeichen`],
  [/^(.+) can't be empty$/, m => `${FIELD[m[1]] || m[1]} darf nicht leer sein`],
  [/^(.+) can be at most (\d+) characters$/, m => `${FIELD[m[1]] || m[1]} darf höchstens ${m[2]} Zeichen haben`],
]

/** An API error message in the reader's language */
export function tr(lang, message) {
  if (lang !== 'de' || !message) return message
  if (DE[message]) return DE[message]
  for (const [re, fn] of PATTERNS) {
    const m = message.match(re)
    if (m) return fn(m)
  }
  return message
}

const question = (id, lang) => {
  const q = questions.find(x => x.id === id)
  if (!q) return null
  return lang === 'de' && questionsDe[id] ? { ...q, ...questionsDe[id] } : q
}
const motion = (v, lang) => (v.qid && question(v.qid, lang)?.question) || v.motionRaw || ''
const ROUND = { en: ['opening', 'rebuttal', 'closing'], de: ['Eröffnung', 'Erwiderung', 'Schlusswort'] }

/** { title, body } for a notification; vars depend on the key */
export function pushText(lang, key, v) {
  const de = lang === 'de'
  const r = ROUND[de ? 'de' : 'en']
  switch (key) {
    case 'convinced': {
      const side = question(v.qid, lang)?.sides?.[v.side] || ''
      return de
        ? { title: 'Du hast jemanden überzeugt', body: `${v.name} ist wegen deines Arguments zu „${side}“ gewechselt` }
        : { title: 'You changed a mind', body: `${v.name} switched to "${side}" because of your argument` }
    }
    case 'reply': return { title: de ? `${v.name} hat geantwortet` : `${v.name} replied`, body: v.text }
    case 'challenge': return de
      ? { title: `${v.name} fordert dich heraus`, body: `„${motion(v, lang)}“` }
      : { title: `${v.name} challenges you`, body: `"${motion(v, lang)}"` }
    case 'accepted': return de
      ? { title: `${v.name} hat angenommen`, body: `„${motion(v, lang)}“ · die Eröffnung kommt` }
      : { title: `${v.name} accepted your challenge`, body: `"${motion(v, lang)}" · their opening is next` }
    case 'declined': return de
      ? { title: `${v.name} hat abgelehnt`, body: `„${motion(v, lang)}“ · du kannst sie offen posten` }
      : { title: `${v.name} declined`, body: `"${motion(v, lang)}" · you can post it as an open challenge` }
    case 'yourTurn': return de
      ? { title: `Du bist dran: ${r[v.next]}`, body: `${v.name}: ${r[v.made]} zu „${motion(v, lang)}“` }
      : { title: `Your turn: ${r[v.next]}`, body: `${v.name} made their ${r[v.made]} on "${motion(v, lang)}"` }
    case 'finished': return de
      ? { title: 'Debatte beendet', body: `„${motion(v, lang)}“ · jetzt wird abgestimmt` }
      : { title: 'Debate finished', body: `"${motion(v, lang)}" · readers can vote now` }
    case 'test': return de
      ? { title: 'Agora', body: 'Mitteilungen sind an.' }
      : { title: 'Agora', body: 'Notifications are on.' }
    default: return { title: 'Agora', body: '' }
  }
}
