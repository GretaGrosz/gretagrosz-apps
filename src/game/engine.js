import { ALL_CASES, LESSONS, caseById, lessonById } from './content/kapitel1.js'

// Spielregeln von Loopy & Co.: Spielstand, Tagesplan, Belohnungen, Kosten, Ausbau.
// Alles hier ist reine Logik ohne Oberfläche (leicht zu testen und zu ändern).

export const SAVE_KEY = 'loopy-co-save'

export const RULES = {
  startCoins: 40,
  right: 10, // Münzen für einen richtig gelösten Fall
  comboStep: 2, // Bonus je weiterem richtigen Fall in Folge …
  comboMax: 8, // … höchstens
  comeback: 5, // Bonus für einen richtig gelösten Wiederholungsfall (Stammkundschaft)
  wrong: 6, // Abzug für einen Fehler
  rent: 12, // Standmiete pro Tag
  loan: 100, // Kredit von der Bank, wenn das Geld ausgeht
  interest: 5, // Zinsen pro Tag, solange der Kredit läuft
  lessonCases: 4, // neue Fälle pro Lektionstag
  comebacks: 2, // Wiederholungsfälle pro Tag
  bossCases: 8,
  bossPass: 7,
}

export const UPGRADES = [
  { id: 'sorten', name: 'Neue Bonbonsorten', text: 'Mehr Auswahl am Stand: +3 Münzen für jeden richtigen Fall.', cost: 80, stars: 0, days: 0 },
  { id: 'bank', name: 'Sitzbank und Sonnenschirm', text: 'Wartende Kundschaft bleibt entspannt: Fehler kosten nur noch die Hälfte.', cost: 140, stars: 8, days: 1 },
  { id: 'staff', name: 'Aushilfe einstellen', text: 'Du wählst aus drei Bewerbungen. Jede Aushilfe kann etwas anderes – und kostet Lohn.', cost: 200, stars: 14, days: 0 },
  { id: 'rad', name: 'Lieferfahrrad', text: 'Loopy liefert auch aus: +12 Münzen Einnahmen pro Tag.', cost: 260, stars: 20, days: 1 },
  { id: 'laden', name: 'Eigener Laden', text: 'Vom Marktstand zum eigenen Geschäft. Der Bau dauert 2 Tage.', cost: 500, stars: 0, boss: true, days: 2 },
]

export const STAFF = [
  { id: 'mia', name: 'Mia', trait: 'freundlich', text: '+4 Münzen für jeden richtigen Fall', wage: 10, color: '#FFB3C7', dark: '#FF84A6', hat: '#339AFF' },
  { id: 'bruno', name: 'Bruno', trait: 'gründlich', text: 'Fehler kosten keine Münzen mehr', wage: 8, color: '#FFC89A', dark: '#FF9F6B', hat: '#5CD6B0' },
  { id: 'kiki', name: 'Kiki', trait: 'sparsam', text: 'Die Standmiete sinkt auf die Hälfte', wage: 4, color: '#C9BBFF', dark: '#B39CFF', hat: '#FFD45E' },
]

export const MAX_STARS = LESSONS.length * 3

const fresh = () => ({ v: 1, day: 1, coins: RULES.startCoins, loan: 0, lessons: {}, cases: {}, owned: {}, staff: null, build: null, boss: false })

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')
    if (s && s.v === 1 && typeof s.day === 'number' && typeof s.coins === 'number') return { ...fresh(), ...s }
  } catch {
    /* kein oder kaputter Spielstand → neu beginnen */
  }
  return fresh()
}

export function storeSave(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
  } catch {
    /* Speicher voll oder gesperrt – das Spiel läuft trotzdem weiter */
  }
}

export const totalStars = (save) => Object.values(save.lessons).reduce((n, l) => n + (l.stars || 0), 0)
export const nextLesson = (save) => LESSONS.find((l) => !save.lessons[l.id]?.passed) ?? null
export const companyName = (save) => (save.owned.laden ? 'Loopy Süßwaren e.U.' : 'Loopys Bonbonstand')

// Ein Fall gilt als sicher, wenn er zuletzt mindestens zweimal hintereinander richtig war
export const isSolid = (stat) => Boolean(stat && stat.iv >= 4)
export function mastery(save, lesson) {
  const ids = ALL_CASES.filter((c) => c.lesson.id === lesson.id).map((c) => c.id)
  return { solid: ids.filter((id) => isSolid(save.cases[id])).length, total: ids.length }
}

const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const build = (entry, extra) => ({ ...entry.make(), lessonId: entry.lesson.id, topicId: entry.lesson.topicId, step: entry.lesson.step, ...extra })

// Fälle aus schon begonnenen Lektionen, die wieder dran sind: fällige zuerst (falsch beantwortete
// am frühesten), dann noch nie gesehene.
function dueCases(save, excludeLesson, n) {
  const started = ALL_CASES.filter((c) => save.lessons[c.lesson.id] && c.lesson.id !== excludeLesson)
  const due = started.filter((c) => save.cases[c.id] && save.cases[c.id].due <= save.day).sort((a, b) => save.cases[a.id].due - save.cases[b.id].due)
  const unseen = shuffle(started.filter((c) => !save.cases[c.id]))
  return [...due, ...unseen].slice(0, n)
}

/**
 * Plant den nächsten Spieltag.
 * kind: 'lesson' (neue oder wiederholte Lektion) | 'boss' (Abschlussprüfung) | 'practice' (Übungstag)
 */
export function planDay(save, replayId = null) {
  const lesson = replayId ? lessonById[replayId] : nextLesson(save)
  if (lesson) {
    const own = ALL_CASES.filter((c) => c.lesson.id === lesson.id)
    // noch nicht richtig gelöste Fälle der Lektion zuerst
    const ranked = shuffle(own).sort((a, b) => (save.cases[a.id]?.r ? 1 : 0) - (save.cases[b.id]?.r ? 1 : 0))
    const fresh = ranked.slice(0, RULES.lessonCases).map((c) => build(c))
    const back = dueCases(save, lesson.id, RULES.comebacks).map((c) => build(c, { comeback: true }))
    return { kind: 'lesson', lesson, intro: !replayId && !save.lessons[lesson.id], replay: Boolean(replayId), cases: [...fresh, ...back] }
  }
  if (!save.boss) {
    // Prüfung: aus jeder Lektion höchstens ein Fall, quer durch beide Themen
    const perLesson = shuffle(LESSONS).map((l) => shuffle(ALL_CASES.filter((c) => c.lesson.id === l.id))[0])
    return { kind: 'boss', lesson: null, intro: false, cases: perLesson.slice(0, RULES.bossCases).map((c) => build(c)) }
  }
  const due = dueCases(save, null, 5)
  const fill = shuffle(ALL_CASES.filter((c) => !due.includes(c))).slice(0, 5 - due.length)
  return { kind: 'practice', lesson: null, intro: false, cases: [...due, ...fill].map((c) => build(c, { comeback: true })) }
}

/** Münzen für einen Fall. combo = richtige Fälle in Folge VOR diesem Fall. */
export function reward(save, ok, combo, comeback) {
  if (!ok) {
    if (save.staff === 'bruno') return { coins: 0, parts: [] }
    return { coins: -Math.round(RULES.wrong * (save.owned.bank ? 0.5 : 1)), parts: [] }
  }
  const parts = []
  let coins = RULES.right
  const serie = Math.min(RULES.comboMax, combo * RULES.comboStep)
  if (serie) parts.push(['Serie', serie])
  if (comeback) parts.push(['Stammkundschaft', RULES.comeback])
  if (save.owned.sorten) parts.push(['Neue Sorten', 3])
  if (save.staff === 'mia') parts.push(['Mia', 4])
  coins += parts.reduce((n, p) => n + p[1], 0)
  return { coins, parts }
}

/** Merkt sich das Ergebnis eines Falls (Wiederholungsabstand wie bei Karteikarten). */
export function recordCase(save, id, ok) {
  const prev = save.cases[id] ?? { r: 0, w: 0, iv: 0, due: save.day }
  const iv = ok ? (prev.iv ? Math.min(prev.iv * 2, 8) : 2) : 0
  return { ...save, cases: { ...save.cases, [id]: { r: prev.r + (ok ? 1 : 0), w: prev.w + (ok ? 0 : 1), iv, due: save.day + (ok ? iv : 1) } } }
}

export const starsFor = (mistakes) => (mistakes === 0 ? 3 : mistakes === 1 ? 2 : mistakes === 2 ? 1 : 0)

/** Laufende Kosten und feste Einnahmen eines Tages. */
export function dailyLines(save) {
  const staff = STAFF.find((s) => s.id === save.staff)
  const lines = [['Standmiete', -Math.round(RULES.rent * (save.staff === 'kiki' ? 0.5 : 1))]]
  if (staff) lines.push([`Lohn für ${staff.name}`, -staff.wage])
  if (save.loan > 0) lines.push(['Zinsen für den Kredit', -RULES.interest])
  if (save.owned.rad) lines.push(['Lieferungen mit dem Fahrrad', 12])
  return lines
}

/**
 * Tagesabschluss: Sterne, Lektion bestanden?, Kosten, Kredit, Baufortschritt.
 * results = [true/false je Fall]. Gibt den neuen Spielstand und einen Bericht zurück.
 */
export function endDay(save, plan, results) {
  const mistakes = results.filter((r) => !r).length
  const right = results.length - mistakes
  let next = { ...save, lessons: { ...save.lessons }, owned: { ...save.owned } }
  const report = { stars: starsFor(mistakes), right, total: results.length, passed: false, firstPass: false, bossPassed: false, lines: dailyLines(save), loanTaken: false, built: null }

  if (plan.kind === 'lesson') {
    const prev = save.lessons[plan.lesson.id] ?? { stars: 0, passed: false }
    report.passed = report.stars >= 2
    report.firstPass = report.passed && !prev.passed
    next.lessons[plan.lesson.id] = { stars: Math.max(prev.stars, report.stars), passed: prev.passed || report.passed }
  } else if (plan.kind === 'boss') {
    report.bossPassed = right >= RULES.bossPass
    report.stars = report.bossPassed ? (mistakes === 0 ? 3 : 2) : right >= 5 ? 1 : 0
    if (report.bossPassed) next.boss = true
  }

  next.coins += report.lines.reduce((n, l) => n + l[1], 0)
  if (next.coins < 0) {
    next.coins += RULES.loan
    next.loan += RULES.loan
    report.loanTaken = true
  }
  if (next.build) {
    const daysLeft = next.build.daysLeft - 1
    if (daysLeft <= 0) {
      next.owned[next.build.id] = true
      report.built = UPGRADES.find((u) => u.id === next.build.id)
      next.build = null
    } else next.build = { ...next.build, daysLeft }
  }
  next.day += 1
  return { save: next, report }
}

/** Warum ein Ausbau (noch) nicht geht – oder null, wenn er gekauft werden kann. */
export function blocked(save, up) {
  if (save.owned[up.id] || (up.id === 'staff' && save.staff)) return 'owned'
  if (save.build?.id === up.id) return 'building'
  if (up.boss && !save.boss) return 'boss'
  if (totalStars(save) < up.stars) return 'stars'
  if (save.build && up.days > 0) return 'busy'
  if (save.coins < up.cost) return 'coins'
  return null
}

export function buy(save, up, staffId = null) {
  if (blocked(save, up)) return save
  const next = { ...save, coins: save.coins - up.cost, owned: { ...save.owned } }
  if (up.id === 'staff') next.staff = staffId
  else if (up.days > 0) next.build = { id: up.id, daysLeft: up.days }
  else next.owned[up.id] = true
  return next
}

export function repayLoan(save) {
  if (!save.loan || save.coins < save.loan) return save
  return { ...save, coins: save.coins - save.loan, loan: 0 }
}

export { LESSONS, caseById }
