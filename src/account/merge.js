// Reine Logik fürs Konto (ohne React, ohne Speicher), damit sie sich mit node testen lässt:
// stabile Fingerabdrücke, Aufräumen vor dem Hochladen und das Zusammenführen zweier Stände.

// JSON mit sortierten Schlüsseln: gleicher Inhalt → gleicher Text, egal in welcher Reihenfolge gespeichert wurde
export function stable(v) {
  if (v === undefined) return 'null'
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`
  return `{${Object.keys(v)
    .filter((k) => v[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stable(v[k])}`)
    .join(',')}}`
}

// Schneller 53-bit-Hash (cyrb53) – nur um "hat sich etwas geändert?" zu erkennen
export function hashText(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

const isObj = (x) => Boolean(x) && typeof x === 'object' && !Array.isArray(x)
const obj = (x) => (isObj(x) ? x : {})
const arr = (x) => (Array.isArray(x) ? x : [])
const dateKey = (d) => (typeof d === 'string' ? d : '')

// "review:<karte>:<YYYY-MM-DD>" verhindert nur doppelte XP am selben Tag. Ältere Einträge braucht niemand mehr,
// sie würden den gespeicherten Stand aber jeden Tag größer machen – vor dem Hochladen fliegen sie raus.
export function compactProgress(p, today) {
  if (!isObj(p) || !isObj(p.done)) return p
  const cutoff = shiftDay(today, -2)
  let dropped = false
  const done = {}
  for (const [k, v] of Object.entries(p.done)) {
    const m = /^review:.*:(\d{4}-\d{2}-\d{2})$/.exec(k)
    if (m && m[1] < cutoff) dropped = true
    else done[k] = v
  }
  return dropped ? { ...p, done } : p
}
function shiftDay(day, n) {
  const d = new Date(`${day}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// Wie viel steckt in einem Stand? (für "mehr Fortschritt gewinnt")
export const progressScore = (p) => (isObj(p) ? (Number(p.xp) || 0) : 0)
export const topicsDone = (p) => Object.keys(obj(p?.done)).filter((k) => k.startsWith('summary:')).length
export const hasProgress = (p) => isObj(p) && (progressScore(p) > 0 || Object.keys(obj(p.done)).length > 0 || arr(p.exams).length > 0)
export const hasGame = (g) => isObj(g) && typeof g.day === 'number' && (g.day > 1 || (Number(g.coins) || 0) !== 30 || Object.keys(obj(g.upgrades)).length > 0)

// Zwei Lernstände zusammenführen (z. B. erstes Anmelden auf einem Gerät, das schon Fortschritt hat).
// Nichts Erarbeitetes geht verloren: erledigte Schritte vereinigt, höchste XP, längere Serie, alle Prüfungen.
// Bei Einzelwerten (Jahrgang, zuletzt geöffnet, Lernplan) gewinnt der Stand mit mehr XP.
export function mergeProgress(a, b) {
  if (!isObj(a)) return isObj(b) ? b : a ?? null
  if (!isObj(b)) return a
  const [main, other] = progressScore(b) > progressScore(a) ? [b, a] : [a, b]

  const streak = mergeStreak(obj(a.streak), obj(b.streak))

  // Karteikasten: pro Karte der zuletzt bearbeitete Eintrag (spätere Fälligkeit), bei Gleichstand die höhere Box
  const srs = { ...obj(other.srs) }
  for (const [id, e] of Object.entries(obj(main.srs))) {
    const o = srs[id]
    if (!isObj(o) || !isObj(e)) srs[id] = e
    else if (dateKey(e.due) > dateKey(o.due) || (dateKey(e.due) === dateKey(o.due) && (Number(e.box) || 0) >= (Number(o.box) || 0))) srs[id] = e
  }

  // Ergebnisse je Thema: das mit mehr Antworten (bei Gleichstand das vom Hauptstand)
  const results = { ...obj(other.results) }
  for (const [k, r] of Object.entries(obj(main.results))) {
    const o = results[k]
    if (!isObj(o) || arr(r?.last).length >= arr(o.last).length) results[k] = r
  }

  // Prüfungen nach id; gleiche id → Hauptstand
  const exams = new Map()
  for (const e of [...arr(other.exams), ...arr(main.exams)]) if (isObj(e)) exams.set(String(e.id ?? stable(e)), e)

  // Probetests: alle, doppelte einmal, nach Datum, die letzten 30
  const mocks = new Map()
  for (const m of [...arr(a.mocks), ...arr(b.mocks)]) if (isObj(m)) mocks.set(stable(m), m)

  return {
    ...other,
    ...main,
    xp: Math.max(progressScore(a), progressScore(b)),
    done: { ...obj(other.done), ...obj(main.done) },
    cards: { ...obj(other.cards), ...obj(main.cards) },
    hints: { ...obj(other.hints), ...obj(main.hints) },
    mistakes: { ...obj(other.mistakes), ...obj(main.mistakes) },
    streak,
    srs,
    results,
    exams: [...exams.values()].sort((x, y) => dateKey(x.date).localeCompare(dateKey(y.date))),
    mocks: [...mocks.values()].sort((x, y) => dateKey(x.date).localeCompare(dateKey(y.date))).slice(-30),
    day: mergeDay(a.day, b.day),
    myYear: main.myYear ?? other.myYear ?? null,
    last: main.last ?? other.last ?? null,
    onboarded: Boolean(a.onboarded || b.onboarded),
  }
}

// Serie: der spätere Lerntag zählt; am selben Tag die längere
function mergeStreak(a, b) {
  const da = dateKey(a.day)
  const db = dateKey(b.day)
  if (!da && !db) return { day: null, count: Math.max(Number(a.count) || 0, Number(b.count) || 0) }
  if (da === db) return { day: da, count: Math.max(Number(a.count) || 0, Number(b.count) || 0) }
  return da > db ? { day: da, count: Number(a.count) || 0 } : { day: db, count: Number(b.count) || 0 }
}

// Tagesprotokoll: gleicher Tag → beides zusammen, sonst der spätere Tag
function mergeDay(a, b) {
  if (!isObj(a)) return isObj(b) ? b : a ?? null
  if (!isObj(b)) return a
  if (dateKey(a.date) !== dateKey(b.date)) return dateKey(a.date) > dateKey(b.date) ? a : b
  return {
    ...b,
    ...a,
    practised: [...new Set([...arr(a.practised), ...arr(b.practised)])],
    mocks: Math.max(Number(a.mocks) || 0, Number(b.mocks) || 0),
    reviewed: Math.max(Number(a.reviewed) || 0, Number(b.reviewed) || 0),
    mistakes: Math.max(Number(a.mistakes) || 0, Number(b.mistakes) || 0),
  }
}

// Spielstand (Loopy & Co.): ein Spielstand lässt sich nicht sinnvoll mischen – der weiter fortgeschrittene gewinnt
// (höherer Tag, dann mehr Münzen; bei völligem Gleichstand `a`).
export function pickGame(a, b) {
  if (!isObj(a)) return isObj(b) ? b : null
  if (!isObj(b)) return a
  const day = (g) => Number(g.day) || 0
  const coins = (g) => Number(g.coins) || 0
  if (day(b) !== day(a)) return day(b) > day(a) ? b : a
  return coins(b) > coins(a) ? b : a
}

// Ganzer Stand { progress, game }: `local` ist dieses Gerät, `remote` der Server
export function mergeBlob(local, remote) {
  return {
    progress: mergeProgress(local?.progress ?? null, remote?.progress ?? null),
    game: pickGame(local?.game ?? null, remote?.game ?? null),
  }
}

export const blobHash = (blob) => hashText(stable({ progress: blob?.progress ?? null, game: blob?.game ?? null }))
