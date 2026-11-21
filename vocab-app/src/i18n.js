// UI text in English and German. The UI language is shared with gretagrosz.com through localStorage 'lang'
// (the site writes it), otherwise it follows the phone. Choosing German or English as "I speak" switches it too.
import { createContext, useContext } from 'react'
import THEMES_DE from './themes-de'

export function initialUi() {
  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'de' || saved === 'en') return saved
  } catch {
    // storage blocked: fall back to the phone's languages
  }
  for (const tag of navigator.languages || [navigator.language || 'en']) {
    const code = String(tag).slice(0, 2).toLowerCase()
    if (code === 'de' || code === 'en') return code
  }
  return 'en'
}

export function saveUi(ui) {
  try {
    localStorage.setItem('lang', ui)
  } catch {
    // not saved, still used for this visit
  }
  document.documentElement.lang = ui
}

const plural = (n, one, many) => (n === 1 ? one : many)

const en = {
  locale: 'en-GB',
  languages: { en: 'English', de: 'German', es: 'Spanish', fr: 'French', it: 'Italian' },
  colours: { red: 'Red', orange: 'Orange', yellow: 'Yellow', green: 'Green', teal: 'Teal', blue: 'Blue', indigo: 'Indigo', purple: 'Purple', pink: 'Pink' },
  levelNames: ['Beginner', 'Elementary', 'Intermediate', 'Upper intermediate', 'Advanced'],
  theme: (name) => name,

  speak: 'I speak',
  learn: 'I’m learning',
  choose: 'Choose',
  languagesCaption: 'Languages',
  levelCaption: 'Level',
  findLevel: 'Find my level',
  start: 'Start',
  next: 'Next',
  settings: 'Settings',
  cancel: 'Cancel',
  done: 'Done',
  appLanguage: 'App language',
  sound: 'Speak words',
  back: 'Back',

  today: 'Today',
  dayStreak: (n) => plural(n, 'day streak', 'day streak'),
  wordsKnown: (n) => plural(n, 'word known', 'words known'),
  toReview: 'to review',
  doneToday: 'Done for today',
  learnWords: 'Learn the words',
  takeTest: 'Take the test',
  learnAgain: 'Learn again',
  review: (n) => `Review · ${n}`,
  next10: 'Next 10 words',
  practise: 'Practise again',
  dayCaption: (n, theme) => `Day ${n} · ${theme}`,
  nextCaption: (n, theme) => `Next · Day ${n} · ${theme}`,
  myLists: 'My lists',
  addList: 'Add a list',

  flashcards: 'Flashcards',
  again: 'Again',
  gotIt: 'Got it',
  of: (a, b) => `${a} of ${b}`,
  allDone: (n) => `All ${n} done`,
  goAgain: 'Go through again',
  listen: 'Listen',
  flip: 'Flip',

  test: 'Test',
  reviewTitle: 'Review',
  inLang: (name) => `In ${name}`,
  placeholder: 'Your answer',
  check: 'Check',
  dontKnow: 'I don’t know',
  continue: 'Continue',
  seeResult: 'See result',
  correct: 'Correct',
  wrong: 'Not quite',
  answer: 'Answer',
  article: 'Article',
  spelling: 'Spelling',
  typo: 'Typo',
  alsoRight: 'Also right',
  otherWord: (typed, front) => `“${typed}” means “${front}”`,
  inARow: (n) => `${n} in a row`,

  passed: 'Passed',
  close: 'Close',
  notYet: 'Not yet',
  practice: 'Practice',
  reviewDone: 'Review done',
  toPass: (n) => `${n} to pass`,
  missedCaption: 'To practise',
  tryAgain: 'Try again',
  testPassed: (s, t) => `Test passed · ${s} of ${t}`,
  dayN: (n) => `Day ${n}`,
  newColour: 'New colour',

  yourLevel: 'Your level',
  startAt: (name) => `Start at ${name}`,
  keepDay: (n) => `Stay on day ${n}`,
  right: (n) => `${n} of 10 right`,

  newList: 'New list',
  listName: 'Name',
  listNamePlaceholder: 'Unit 7',
  testDate: 'Test',
  pastePlaceholder: 'dog – der Hund\ncat – die Katze\n…',
  pasteCaption: 'Words',
  wordsCount: (n) => `${n} ${plural(n, 'word', 'words')}`,
  skipped: (n) => `${n} ${plural(n, 'line', 'lines')} not read`,
  swap: 'Swap columns',
  create: 'Create',
  deleteList: 'Delete list',
  confirmDelete: (name) => `Delete “${name}”?`,
  testIn: (n) => (n === 0 ? 'Test today' : n === 1 ? 'Test tomorrow' : `Test in ${n} days`),
  testWas: (date) => `Test was on ${date}`,
  learnNew: (n) => `Learn ${n} new ${plural(n, 'word', 'words')}`,
  finalReview: 'Final review',
  newToday: (n) => `${n} new today`,
  planAll: 'all',
  pickFuture: 'Pick a day after today',
  wordsCaption: 'Words',
  listDefaultName: (date) => `Test ${date}`,
  offline: 'No connection',
  yourYear: 'Your year',
  daysDone: (n) => plural(n, 'day done', 'days done'),
  longestStreak: 'longest streak',
  missed: 'Missed',
  notDoneYet: 'Not done yet',
  doneDay: 'done',
  openYear: 'Your year',
}

const de = {
  locale: 'de-AT',
  languages: { en: 'Englisch', de: 'Deutsch', es: 'Spanisch', fr: 'Französisch', it: 'Italienisch' },
  colours: { red: 'Rot', orange: 'Orange', yellow: 'Gelb', green: 'Grün', teal: 'Türkis', blue: 'Blau', indigo: 'Indigo', purple: 'Lila', pink: 'Pink' },
  levelNames: ['Anfänger', 'Grundkenntnisse', 'Mittelstufe', 'Gute Mittelstufe', 'Fortgeschritten'],
  theme: (name) => THEMES_DE[name] || name,

  speak: 'Ich spreche',
  learn: 'Ich lerne',
  choose: 'Auswählen',
  languagesCaption: 'Sprachen',
  levelCaption: 'Niveau',
  findLevel: 'Mein Niveau finden',
  start: 'Starten',
  next: 'Weiter',
  settings: 'Einstellungen',
  cancel: 'Abbrechen',
  done: 'Fertig',
  appLanguage: 'App-Sprache',
  sound: 'Wörter vorlesen',
  back: 'Zurück',

  today: 'Heute',
  dayStreak: (n) => plural(n, 'Tag in Folge', 'Tage in Folge'),
  wordsKnown: (n) => plural(n, 'Wort sitzt', 'Wörter sitzen'),
  toReview: 'zu wiederholen',
  doneToday: 'Für heute erledigt',
  learnWords: 'Wörter lernen',
  takeTest: 'Zum Test',
  learnAgain: 'Nochmal lernen',
  review: (n) => `Wiederholen · ${n}`,
  next10: 'Nächste 10 Wörter',
  practise: 'Nochmal üben',
  dayCaption: (n, theme) => `Tag ${n} · ${theme}`,
  nextCaption: (n, theme) => `Als Nächstes · Tag ${n} · ${theme}`,
  myLists: 'Meine Listen',
  addList: 'Liste hinzufügen',

  flashcards: 'Karteikarten',
  again: 'Nochmal',
  gotIt: 'Kann ich',
  of: (a, b) => `${a} von ${b}`,
  allDone: (n) => `Alle ${n} geschafft`,
  goAgain: 'Nochmal durchgehen',
  listen: 'Anhören',
  flip: 'Umdrehen',

  test: 'Test',
  reviewTitle: 'Wiederholen',
  inLang: (name) => `Auf ${name}`,
  placeholder: 'Deine Antwort',
  check: 'Prüfen',
  dontKnow: 'Weiß ich nicht',
  continue: 'Weiter',
  seeResult: 'Zum Ergebnis',
  correct: 'Richtig',
  wrong: 'Leider falsch',
  answer: 'Lösung',
  article: 'Artikel',
  spelling: 'Schreibweise',
  typo: 'Tippfehler',
  alsoRight: 'Auch richtig',
  otherWord: (typed, front) => `„${typed}“ heißt „${front}“`,
  inARow: (n) => `${n} in Folge`,

  passed: 'Bestanden',
  close: 'Knapp',
  notYet: 'Noch nicht',
  practice: 'Übung',
  reviewDone: 'Wiederholung fertig',
  toPass: (n) => `${n} zum Bestehen`,
  missedCaption: 'Zum Üben',
  tryAgain: 'Nochmal versuchen',
  testPassed: (s, t) => `Test bestanden · ${s} von ${t}`,
  dayN: (n) => `Tag ${n}`,
  newColour: 'Neue Farbe',

  yourLevel: 'Dein Niveau',
  startAt: (name) => `Mit ${name} starten`,
  keepDay: (n) => `Bei Tag ${n} bleiben`,
  right: (n) => `${n} von 10 richtig`,

  newList: 'Neue Liste',
  listName: 'Name',
  listNamePlaceholder: 'Unit 7',
  testDate: 'Test',
  pastePlaceholder: 'dog – der Hund\ncat – die Katze\n…',
  pasteCaption: 'Wörter',
  wordsCount: (n) => `${n} ${plural(n, 'Wort', 'Wörter')}`,
  skipped: (n) => `${n} ${plural(n, 'Zeile', 'Zeilen')} nicht erkannt`,
  swap: 'Spalten tauschen',
  create: 'Erstellen',
  deleteList: 'Liste löschen',
  confirmDelete: (name) => `„${name}“ löschen?`,
  testIn: (n) => (n === 0 ? 'Test heute' : n === 1 ? 'Test morgen' : `Test in ${n} Tagen`),
  testWas: (date) => `Test war am ${date}`,
  learnNew: (n) => `${n} neue ${plural(n, 'Wort', 'Wörter')} lernen`,
  finalReview: 'Letzte Wiederholung',
  newToday: (n) => `heute ${n} neu`,
  planAll: 'alle',
  pickFuture: 'Wähle einen Tag nach heute',
  wordsCaption: 'Wörter',
  listDefaultName: (date) => `Test ${date}`,
  offline: 'Keine Verbindung',
  yourYear: 'Dein Jahr',
  daysDone: (n) => plural(n, 'Tag geschafft', 'Tage geschafft'),
  longestStreak: 'längste Serie',
  missed: 'Verpasst',
  notDoneYet: 'Noch offen',
  doneDay: 'geschafft',
  openYear: 'Dein Jahr',
}

export const STRINGS = { en, de }

export const UiContext = createContext({ ui: 'en', t: en })
export const useT = () => useContext(UiContext).t

export const formatDay = (t, day, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat(t.locale, { ...opts, timeZone: 'UTC' }).format(new Date(day * 864e5))
