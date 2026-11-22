// Loopy & Co. – die Spielwelt als reine Logik (ohne React, ohne 3D). Die Szene liest den Zustand jedes Bild,
// die Oberfläche bekommt Ereignisse (Fragen, Hinweise, Töne) über `events`.
//
// Ein Spieltag dauert DAY_LEN Sekunden (08:00 bis 18:00). Kundschaft (verschiedene Tiere mit Charakter) kommt an
// die Theke, Loopy bedient, holt Nachschub aus dem Lager, bestellt am Steg und liest die Post. Dazu kommen, wenn
// gekauft: Café (Kakao an Tischen servieren), Aquarium (Führungen), Strand (Personal erholt sich) und Personal
// (Meerestiere mit eigener Aufgabe, die müde werden und gefüttert werden wollen). Zufällige Ereignisse
// (Gewitter, Finanzamt, Star-Gast, Haiberts Werbung, Lieferverzug) machen jeden Tag anders.
// Bei jeder Station gibt es BW-Fragen oder Mini-Spiele. Während eine Frage offen ist, steht die Zeit still.

import { CAST, COZY_MAX, PERSONALITIES, PERSONALITY_IDS, SPECIES, STAFF, UPGRADES, castById, decorById, speciesById } from './data.js'

export { UPGRADES }

export const DAY_LEN = 180
export const OPEN_HOUR = 8
export const CLOSE_HOUR = 18
export const RUSH = [
  [72, 90], // 12:00–13:00
  [144, 162], // 16:00–17:00
]

export const CANDY = [
  { id: 'lolly', color: '#FF5E8A', dark: '#E04573' },
  { id: 'drops', color: '#FFD45E', dark: '#E8B63A' },
  { id: 'gummy', color: '#5CD6B0', dark: '#3FBF98' },
  { id: 'choco', color: '#A86B45', dark: '#7E4C2E' },
]

// Preise abgestimmt mit einem realistischen Test-Bot und Richtwerten aus anderen Spielen (Recherche Nov. 2026):
// ~90–110 Münzen Gewinn an Tag 1, erster Kauf nach Tag 1, alle 1–2 Tage etwas Neues, alles nach ~60–80 Spieltagen.
// Fragen-Prämien sind ~30 % des Einkommens: deutlich spürbar, aber auch wer viel falsch hat, kommt gut voran.
export const PRICES = {
  sale: 2, // je Stück an der Theke
  quickTip: 1, // schnell bedient (mehr als halbe Geduld übrig)
  tipAsk: 5, // richtig beantwortete Kundenfrage
  tipRegular: 8, // Stammkundschaft richtig (die Frage war früher falsch)
  letter: 9,
  inventur: 6,
  cocoa: 3,
  tour: 10,
  tourBad: 2, // Eintritt zahlen sie trotzdem
  inspector: 12,
  inspectorBad: 0,
  late: 9, // Lieferverzug richtig behandelt → Entschädigung
  // Fehler kosten keine Münzen (Lernen soll sich sicher anfühlen): man bekommt nur den Bonus nicht.
  wrongCustomer: 0,
  wrongLetter: 0,
  wrongInventur: 0,
  boxGood: 3, // Einkaufspreis je Kiste mit Rabatt (richtige Antwort beim Bestellen)
  boxFull: 5, // ohne Rabatt
  rent: 10, // Standmiete pro Tag
  snack: 2,
}

// ---------- Orte (Welt-Einheiten; Hauptinsel von −6 bis 6) ----------
export const ISLAND = 5.55
export const PLACES = {
  stall: [0, 0],
  serve: [0, -0.85], // hinter der Theke
  store: [-3.6, -3.25], // Mitte der Lagerhütte
  storeDoor: [-3.6, -1.75],
  dock: [3.75, -3.7], // vor dem Steg
  dockPile: [4.45, -4.75],
  board: [2.55, -4.35],
  mail: [-4.35, 2.7],
  mailFront: [-3.55, 2.7],
  entry: [7.4, 0.8],
  loopyStart: [0, -1.1],
  turtle: [-2.9, 3.7], // Oma Schildi schaut zu
}
// Die Schlange läuft vor der Theke quer nach rechts (so verdecken sich die Sprechblasen nicht)
export const QUEUE = [
  [0.0, 1.6],
  [1.2, 1.45],
  [2.4, 1.3],
  [3.6, 1.15],
  [4.8, 1.0],
]

// Zusatz-Inseln, über Brücken erreichbar. platform: [x1, z1, x2, z2], bridge: [x1, z1, x2, z2]
export const AREA_GEO = {
  cafe: { center: [-9, 1], platform: [-11.2, -1.2, -6.8, 3.2], bridge: [-7.0, 0.6, -5.3, 1.6] },
  aquarium: { center: [-1.5, -9.2], platform: [-4.3, -11.4, 1.3, -7.0], bridge: [-1.9, -7.1, -0.9, -5.3] },
  beach: { center: [-2.5, 8.7], platform: [-5.3, 6.8, 0.3, 10.6], bridge: [-3.0, 5.3, -2.0, 7.0] },
}
export const CAFE = {
  machine: [-9.7, -0.55],
  machineFront: [-9.7, 0.25],
  tables: [
    [-10.2, 1.25],
    [-7.9, 0.55],
    [-8.9, 2.45],
  ],
  seat: [0.55, 0.15], // Sitzplatz relativ zum Tisch
  momoHome: [-7.9, -0.55],
}
export const AQUARIUM = { tank: [-3.7, -10.9, 0.7, -9.7], front: [-1.5, -8.7] }
export const BEACH = {
  beds: [
    [-4.3, 9.55],
    [-3.1, 9.75],
    [-1.9, 9.55],
  ],
  umbrella: [-0.5, 8.0],
}
export const STAFF_HOME = { kai: [1.9, -2.9], otto: [-1.9, -1.55], luma: [2.9, 2.7], momo: CAFE.momoHome }

// Hindernisse als Rechtecke [x1, z1, x2, z2] und Kreise [x, z, r]
const RECTS = [
  [-1.35, -0.12, 1.35, 0.82], // Theke
  [-1.28, -1.05, -1.02, -0.8], // Pfosten
  [1.02, -1.05, 1.28, -0.8],
  [-4.95, -4.3, -2.25, -2.3], // Lagerhütte
  [2.25, -4.6, 2.85, -4.1], // Bestelltafel
  [-4.6, 2.45, -4.1, 2.95], // Briefkasten
]
const CIRCLES = [
  [-4.7, 4.6, 0.45],
  [4.5, 4.1, 0.45],
  [-5.0, -0.2, 0.4],
  [1.75, 0.45, 0.4], // Kiste neben der Theke
  [-2.15, 1.6, 0.25], // Tafel
  [PLACES.turtle[0], PLACES.turtle[1], 0.4],
]
const AREA_RECTS = {
  cafe: [[CAFE.machine[0] - 0.55, CAFE.machine[1] - 0.4, CAFE.machine[0] + 0.55, CAFE.machine[1] + 0.35]],
  aquarium: [AQUARIUM.tank],
  beach: BEACH.beds.map(([x, z]) => [x - 0.3, z - 0.5, x + 0.3, z + 0.5]),
}
const AREA_CIRCLES = {
  cafe: CAFE.tables.map(([x, z]) => [x, z, 0.38]),
  aquarium: [],
  beach: [[BEACH.umbrella[0], BEACH.umbrella[1], 0.18]],
}

const STATION_RANGE = { counter: 1.15, store: 1.2, dock: 1.35, mail: 1.0, machine: 1.0, table: 1.15, aquarium: 1.3, staff: 0.95 }

// Feste Stellen, an denen keine Deko stehen darf (Stationen, Wege der Kundschaft)
const KEEP_FREE = [
  [-1.6, -1.6, 1.6, 2.4], // Theke, dahinter und davor
  [0.5, 0.4, 7.0, 1.9], // Schlange
  [-4.3, -2.3, -2.9, -1.0], // Lagertür
  [2.9, -4.6, 4.9, -2.9], // Steg
  [-4.0, 2.2, -3.0, 3.2], // vor dem Briefkasten
  [-8.0, 0.4, -5.0, 1.8], // Weg zum Café
  [-2.1, -7.2, -0.7, -4.9], // Weg zum Aquarium
  [-3.2, 4.9, -1.8, 7.2], // Weg zum Strand
]

const rand = (a, b) => a + Math.random() * (b - a)
const pickIndex = (n) => Math.floor(Math.random() * n)
const pick = (list) => list[pickIndex(list.length)]

export function isRush(t) {
  return RUSH.some(([a, b]) => t >= a && t < b)
}

export function clockOf(t) {
  const hours = OPEN_HOUR + (Math.min(t, DAY_LEN) / DAY_LEN) * (CLOSE_HOUR - OPEN_HOUR)
  const h = Math.floor(hours)
  const m = Math.floor(((hours - h) * 60) / 15) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Gemütlichkeit durch aufgestellte Deko (0 … COZY_MAX) plus Strand. */
export function cozyOf(save) {
  const sum = (save.decor ?? []).reduce((n, d) => n + (decorById(d.id)?.cozy ?? 0), 0)
  return Math.min(COZY_MAX, sum * 0.02) + (save.areas?.beach ? 0.08 : 0)
}

/** Begehbare Flächen: Hauptinsel, dazu Brücken und Zusatzinseln, wenn gekauft. */
export function walkRects(areas = {}) {
  const list = [[-ISLAND, -ISLAND, ISLAND, ISLAND]]
  for (const id of Object.keys(AREA_GEO)) {
    if (!areas[id]) continue
    const g = AREA_GEO[id]
    // Brücke ein Stück in beide Inseln hinein verlängern, damit kein Spalt bleibt
    const [b1, b2, b3, b4] = g.bridge
    list.push(b3 - b1 > b4 - b2 ? [b1 - 0.7, b2, b3 + 0.7, b4] : [b1, b2 - 0.7, b3, b4 + 0.7])
    const [x1, z1, x2, z2] = g.platform
    list.push([x1 + 0.35, z1 + 0.35, x2 - 0.35, z2 - 0.35])
  }
  return list
}

const DECOR_R = { fountain: 0.62, xmasTree: 0.45, benchDeco: 0.45, parasol: 0.2, flamingo: 0.3 }
export const decorRadius = (id) => DECOR_R[id] ?? 0.3

/** Darf hier Deko stehen? */
export function canPlace(save, id, x, z, ignoreIndex = -1) {
  const r = decorRadius(id)
  const inside = walkRects(save.areas).some(([x1, z1, x2, z2]) => x - r >= x1 - 0.2 && x + r <= x2 + 0.2 && z - r >= z1 - 0.2 && z + r <= z2 + 0.2)
  if (!inside) return false
  // nicht auf Brücken
  for (const g of Object.values(AREA_GEO)) {
    const [x1, z1, x2, z2] = g.bridge
    if (x > x1 - r && x < x2 + r && z > z1 - r && z < z2 + r) return false
  }
  const hitRect = (list) => list.some(([x1, z1, x2, z2]) => x > x1 - r - 0.1 && x < x2 + r + 0.1 && z > z1 - r - 0.1 && z < z2 + r + 0.1)
  if (hitRect(RECTS) || hitRect(KEEP_FREE)) return false
  for (const a of Object.keys(AREA_GEO)) if (save.areas?.[a] && hitRect(AREA_RECTS[a])) return false
  const circles = [...CIRCLES, ...Object.keys(AREA_GEO).flatMap((a) => (save.areas?.[a] ? AREA_CIRCLES[a] : []))]
  if (circles.some(([cx, cz, cr]) => Math.hypot(x - cx, z - cz) < cr + r + 0.1)) return false
  if (save.areas?.cafe && Math.hypot(x - CAFE.machineFront[0], z - CAFE.machineFront[1]) < 0.9) return false
  if (save.areas?.aquarium && Math.hypot(x - AQUARIUM.front[0], z - AQUARIUM.front[1]) < 1.0) return false
  if (save.areas?.cafe && CAFE.tables.some(([tx, tz]) => Math.hypot(x - tx - CAFE.seat[0], z - tz - CAFE.seat[1]) < 0.6)) return false
  return !(save.decor ?? []).some((d, i) => i !== ignoreIndex && Math.hypot(d.x - x, d.z - z) < decorRadius(d.id) + r + 0.05)
}

/**
 * Neuer Tag.
 * save: Spielstand (upgrades, jars, store, staff, areas, decor, outfit)
 * opts: { regulars: [castId…], diff: 0.8–1.3, events: [{ type, at }], holiday }
 */
export function createDay(save, opts = {}) {
  const { regulars = [], diff = 1, events = [], holiday = null } = opts
  const up = save.upgrades ?? {}
  const types = up.choco ? 4 : 3
  const cap = up.jars ? 6 : 4
  const jars = Array.from({ length: types }, (_, i) => Math.min(cap, save.jars?.[i] ?? cap))
  const store = Array.from({ length: types }, (_, i) => save.store?.[i] ?? 2)
  const regularTimes = [18, 64, 118, 150].slice(0, regulars.length)
  const areas = { ...(save.areas ?? {}) }
  const staff = {}
  for (const st of STAFF) {
    const have = save.staff?.[st.id] ?? (st.id === 'kai' && up.kai ? { energy: 100 } : null)
    if (!have) continue
    if (st.needs && !areas[st.needs]) continue
    const [x, z] = STAFF_HOME[st.id]
    staff[st.id] = { id: st.id, x, z, yaw: 0, moving: false, carry: null, task: 'idle', energy: have.energy ?? 100, asleep: false, sleepy: false, happyT: 99, wait: 0, target: null }
  }
  const decorCircles = (save.decor ?? []).map((d) => [d.x, d.z, decorRadius(d.id)])
  return {
    t: 0,
    over: false,
    closing: false,
    paused: false,
    types,
    cap,
    storeCap: 4, // Kisten je Sorte im Lager
    speed: up.shoes ? 3.9 : 3.0,
    patienceK: (up.bench ? 1.4 : 1) * (1 + cozyOf(save)) * (1.12 - (diff - 1) * 0.7),
    spawnK: diff,
    diff,
    holiday,
    areas,
    walk: walkRects(areas),
    rects: [...RECTS, ...Object.keys(AREA_GEO).flatMap((a) => (areas[a] ? AREA_RECTS[a] : []))],
    circles: [...CIRCLES, ...Object.keys(AREA_GEO).flatMap((a) => (areas[a] ? AREA_CIRCLES[a] : [])), ...decorCircles],
    loopy: { x: PLACES.loopyStart[0], z: PLACES.loopyStart[1], yaw: 0.6, moving: false, mood: 'idle', moodT: 0, carry: null, outfit: save.outfit ?? 'none' },
    jars,
    store,
    dockBoxes: [],
    order: null, // { types }
    boat: { state: 'away', p: 0, timer: 0, slow: false },
    customers: [],
    nextId: 1,
    nextSpawn: 2.5,
    regularQueue: [...regulars],
    regularTimes,
    letter: false,
    letterKind: null, // 'late' = Lieferverzug-Brief
    nextLetter: 24,
    inventur: false,
    nextInventur: 44,
    tour: false,
    nextTour: 35,
    combo: 0,
    bestCombo: 0,
    rushWas: false,
    ledger: { sales: 0, tips: 0, penalties: 0, goods: 0 },
    served: 0,
    lost: 0,
    cocoa: 0,
    staffCare: 0,
    regularsHappy: 0,
    species: {}, // bediente Tierarten
    met: {},
    answers: [], // { ref, ok, station, text }
    staff,
    near: null, // aktuelle Station in Reichweite
    nearRef: null, // Tisch-Index bzw. Personal-ID
    pending: null, // offene Frage { station, customerId, sub }
    plan: [...events].sort((a, b) => a.at - b.at), // geplante Ereignisse
    weather: null, // { kind: 'rain' | 'rainbow', until }
    rivalUntil: 0,
    seenEvents: [],
    fx: [], // kleine Effekte für die Szene: { id, kind, x, z, y, age }
    fxId: 1,
    events: [],
    money: 0, // Veränderung des Kontostands heute (ohne Miete/Lohn)
  }
}

function emit(s, type, data = {}) {
  s.events.push({ type, ...data })
}

function fx(s, kind, x, z, y = 1.6) {
  s.fx.push({ id: s.fxId++, kind, x, z, y, age: 0 })
  if (s.fx.length > 14) s.fx.shift()
}

function addMoney(s, amount, kind) {
  if (!amount) return
  s.money += amount
  if (kind) s.ledger[kind] += Math.abs(amount)
  emit(s, 'money', { amount })
}

// ---------- Bewegung ----------
function inWalk(s, x, z, r) {
  return s.walk.some(([x1, z1, x2, z2]) => x >= x1 + r * 0.3 && x <= x2 - r * 0.3 && z >= z1 + r * 0.3 && z <= z2 - r * 0.3)
}

function collide(s, x, z, r) {
  for (const [x1, z1, x2, z2] of s.rects) {
    const cx = Math.max(x1, Math.min(x, x2))
    const cz = Math.max(z1, Math.min(z, z2))
    const dx = x - cx
    const dz = z - cz
    const d = Math.hypot(dx, dz)
    if (d < r) {
      if (d > 1e-5) {
        x = cx + (dx / d) * r
        z = cz + (dz / d) * r
      } else {
        // genau im Rechteck: zur nächsten Kante hinaus
        const out = [x - x1, x2 - x, z - z1, z2 - z]
        const m = out.indexOf(Math.min(...out))
        if (m === 0) x = x1 - r
        else if (m === 1) x = x2 + r
        else if (m === 2) z = z1 - r
        else z = z2 + r
      }
    }
  }
  for (const [cx, cz, cr] of s.circles) {
    const dx = x - cx
    const dz = z - cz
    const d = Math.hypot(dx, dz)
    if (d < cr + r && d > 1e-5) {
      x = cx + (dx / d) * (cr + r)
      z = cz + (dz / d) * (cr + r)
    }
  }
  return [x, z]
}

// Eingabe in Bildschirmrichtung (x rechts, y oben) → Weltrichtung für die isometrische Kamera
export function screenToWorld(sx, sy) {
  const k = Math.SQRT1_2
  return [(sx - sy) * k, (-sx - sy) * k]
}

function moveLoopy(s, dt, input) {
  const L = s.loopy
  let [dx, dz] = screenToWorld(input.x, input.y)
  let len = Math.hypot(dx, dz)
  if (len > 0.08) L.path = null // Joystick/Tasten haben Vorrang vor dem Hintippen
  else if (L.path?.length) {
    const [gx, gz] = L.path[0]
    dx = gx - L.x
    dz = gz - L.z
    const d = Math.hypot(dx, dz)
    if (d < 0.12) {
      L.path.shift()
      if (!L.path.length) {
        L.path = null
        L.moving = false
        s.near = stationAt(s)
        if (L.autoAct) {
          L.autoAct = false
          act(s)
        }
        return
      }
      return moveLoopy(s, dt, input)
    }
    // die letzten Zentimeter nicht überschießen
    const k = Math.min(1, (d / (s.speed * dt)) || 1)
    dx = (dx / d) * k
    dz = (dz / d) * k
    len = 1
  }
  L.moving = len > 0.08
  if (!L.moving) return
  if (len > 1) {
    dx /= len
    dz /= len
  }
  const step = s.speed * dt * (L.carry ? 0.88 : 1) * (L.path ? 1.3 : 1)
  let nx = L.x + dx * step
  let nz = L.z + dz * step
  // am Rand entlanggleiten statt hängenbleiben
  if (!inWalk(s, nx, nz, 0.34)) {
    if (inWalk(s, nx, L.z, 0.34)) nz = L.z
    else if (inWalk(s, L.x, nz, 0.34)) nx = L.x
    else {
      nx = L.x
      nz = L.z
    }
  }
  ;[nx, nz] = collide(s, nx, nz, 0.34)
  if (inWalk(s, nx, nz, 0.34)) {
    L.x = nx
    L.z = nz
  }
  L.yaw = Math.atan2(dx, dz)
}

const dist = (a, b) => Math.hypot(a.x - b[0], a.z - b[1])

// ---------- Wegsuche (A* auf einem 0,25-Raster der begehbaren Flächen) ----------
const CELL = 0.25
const GX0 = -11.5
const GZ0 = -11.5
const GW = 76
const GH = 92

function blockedAt(s, x, z, r) {
  if (!inWalk(s, x, z, r)) return true
  for (const [x1, z1, x2, z2] of s.rects) {
    const cx = Math.max(x1, Math.min(x, x2))
    const cz = Math.max(z1, Math.min(z, z2))
    if (Math.hypot(x - cx, z - cz) < r) return true
  }
  for (const [cx, cz, cr] of s.circles) if (Math.hypot(x - cx, z - cz) < cr + r) return true
  return false
}

function gridOf(s) {
  if (s._grid) return s._grid
  const g = new Uint8Array(GW * GH)
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) g[j * GW + i] = blockedAt(s, GX0 + i * CELL, GZ0 + j * CELL, 0.36) ? 0 : 1
  Object.defineProperty(s, '_grid', { value: g, enumerable: false, writable: true })
  return g
}

const cellOf = (x, z) => [Math.round((x - GX0) / CELL), Math.round((z - GZ0) / CELL)]
const inGrid = (i, j) => i >= 0 && j >= 0 && i < GW && j < GH

function nearestOpen(g, i, j) {
  if (inGrid(i, j) && g[j * GW + i]) return [i, j]
  for (let r = 1; r < 14; r++) {
    let best = null
    let bd = Infinity
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue
        const a = i + di
        const b = j + dj
        if (inGrid(a, b) && g[b * GW + a] && di * di + dj * dj < bd) {
          bd = di * di + dj * dj
          best = [a, b]
        }
      }
    if (best) return best
  }
  return null
}

function lineFree(g, a, b) {
  const [x0, z0] = a
  const [x1, z1] = b
  const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / (CELL * 0.5))
  for (let k = 1; k < n; k++) {
    const [i, j] = cellOf(x0 + ((x1 - x0) * k) / n, z0 + ((z1 - z0) * k) / n)
    if (!inGrid(i, j) || !g[j * GW + i]) return false
  }
  return true
}

/** Weg von Loopy zu (x, z). act: am Ziel gleich handeln. Gibt false zurück, wenn kein Weg da ist. */
export function goTo(s, x, z, { act: andAct = false } = {}) {
  if (s.paused || s.over || s.pending) return false
  const g = gridOf(s)
  const L = s.loopy
  const start = nearestOpen(g, ...cellOf(L.x, L.z))
  const goal = nearestOpen(g, ...cellOf(x, z))
  if (!start || !goal) return false
  const N = GW * GH
  const cost = new Float32Array(N).fill(Infinity)
  const from = new Int32Array(N).fill(-1)
  const si = start[1] * GW + start[0]
  const gi = goal[1] * GW + goal[0]
  cost[si] = 0
  // kleiner Binärheap über [f, index]
  const heap = [[0, si]]
  const push = (f, id) => {
    heap.push([f, id])
    let c = heap.length - 1
    while (c > 0) {
      const p = (c - 1) >> 1
      if (heap[p][0] <= heap[c][0]) break
      ;[heap[p], heap[c]] = [heap[c], heap[p]]
      c = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const last = heap.pop()
    if (heap.length) {
      heap[0] = last
      let c = 0
      for (;;) {
        const l = 2 * c + 1
        const r = l + 1
        let m = c
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r
        if (m === c) break
        ;[heap[m], heap[c]] = [heap[c], heap[m]]
        c = m
      }
    }
    return top
  }
  const h = (id) => Math.hypot((id % GW) - goal[0], Math.floor(id / GW) - goal[1])
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]
  let found = false
  let guard = 0
  while (heap.length && guard++ < N * 2) {
    const [, id] = pop()
    if (id === gi) {
      found = true
      break
    }
    const i = id % GW
    const j = Math.floor(id / GW)
    for (const [di, dj, c] of DIRS) {
      const a = i + di
      const b = j + dj
      if (!inGrid(a, b)) continue
      const nid = b * GW + a
      if (!g[nid]) continue
      if (di && dj && (!g[j * GW + a] || !g[b * GW + i])) continue // nicht über Ecken schneiden
      const nc = cost[id] + c
      if (nc < cost[nid]) {
        cost[nid] = nc
        from[nid] = id
        push(nc + h(nid), nid)
      }
    }
  }
  if (!found) return false
  const cells = []
  for (let id = gi; id !== -1; id = from[id]) cells.push([GX0 + (id % GW) * CELL, GZ0 + Math.floor(id / GW) * CELL])
  cells.reverse()
  // Ecken glätten: nur Punkte behalten, zwischen denen keine gerade Linie frei ist
  const pts = [[L.x, L.z]]
  let k = 0
  while (k < cells.length - 1) {
    let far = cells.length - 1
    while (far > k + 1 && !lineFree(g, pts[pts.length - 1], cells[far])) far--
    pts.push(cells[far])
    k = far
  }
  if (pts.length <= 1 || Math.hypot(L.x - x, L.z - z) < 0.3) {
    // schon da: gleich handeln
    L.path = null
    L.autoAct = false
    if (andAct) {
      s.near = stationAt(s)
      act(s)
    }
    return true
  }
  L.path = pts.slice(1)
  L.autoAct = andAct
  return true
}

// ---------- Stationen ----------
function cafeWaiting(s) {
  return s.customers.filter((c) => c.state === 'sit' && !c.served && !c.claimed)
}

function stationAt(s) {
  const L = s.loopy
  s.nearRef = null
  if (dist(L, PLACES.serve) < STATION_RANGE.counter || (L.z < -0.1 && L.z > -1.6 && Math.abs(L.x) < 1.3)) return 'counter'
  if (dist(L, PLACES.storeDoor) < STATION_RANGE.store) return 'store'
  if (dist(L, PLACES.dock) < STATION_RANGE.dock) return 'dock'
  if (dist(L, PLACES.mailFront) < STATION_RANGE.mail) return 'mail'
  if (s.areas.cafe) {
    if (dist(L, CAFE.machineFront) < STATION_RANGE.machine) return 'machine'
    let best = null
    let bd = STATION_RANGE.table
    CAFE.tables.forEach((tb, i) => {
      const d = dist(L, tb)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    if (best !== null) {
      s.nearRef = best
      return 'table'
    }
  }
  if (s.areas.aquarium && dist(L, AQUARIUM.front) < STATION_RANGE.aquarium) return 'aquarium'
  let who = null
  let wd = STATION_RANGE.staff
  for (const k of Object.values(s.staff)) {
    const d = Math.hypot(L.x - k.x, L.z - k.z)
    if (d < wd) {
      wd = d
      who = k.id
    }
  }
  if (who) {
    s.nearRef = who
    return 'staff'
  }
  return null
}

export function frontCustomer(s) {
  return s.customers.find((c) => c.slot === 0 && c.state === 'wait') ?? null
}

const isBox = (carry) => carry && carry.kind === 'box'
const isCup = (carry) => carry && carry.kind === 'cocoa'

/** Was Loopy an der aktuellen Station tun kann: { station, action, ok } (action = Schlüssel für den Text) */
export function promptOf(s) {
  const st = s.near
  if (!st) return null
  const L = s.loopy
  if (st === 'counter') {
    if (isBox(L.carry)) return { station: st, action: 'refill', ok: true, type: L.carry.type }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    const c = frontCustomer(s)
    if (!c) return { station: st, action: 'noCustomer', ok: false }
    if (c.kind === 'ask' || c.kind === 'regular' || c.kind === 'inspector') return { station: st, action: c.kind === 'inspector' ? 'inspector' : 'talk', ok: true }
    return s.jars[c.want] >= c.qty ? { station: st, action: 'serve', ok: true } : { station: st, action: 'empty', ok: false, type: c.want }
  }
  if (st === 'store') {
    if (s.inventur && !L.carry) return { station: st, action: 'inventur', ok: true }
    if (isBox(L.carry) && L.carry.src === 'dock') return s.store[L.carry.type] < s.storeCap ? { station: st, action: 'stash', ok: true } : { station: st, action: 'storeFull', ok: false }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    return s.store.some((n) => n > 0) ? { station: st, action: 'takeBox', ok: true } : { station: st, action: 'storeEmpty', ok: false }
  }
  if (st === 'dock') {
    if (s.dockBoxes.length && !L.carry) return { station: st, action: 'unload', ok: true }
    if (s.order || s.boat.state !== 'away') return { station: st, action: 'onTheWay', ok: false }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    return { station: st, action: 'order', ok: true }
  }
  if (st === 'mail') return s.letter ? { station: st, action: s.letterKind === 'late' ? 'lateLetter' : 'letter', ok: true } : { station: st, action: 'noMail', ok: false }
  if (st === 'machine') {
    if (isCup(L.carry)) return { station: st, action: 'dumpCup', ok: true }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    return cafeWaiting(s).length ? { station: st, action: 'brew', ok: true } : { station: st, action: 'noCocoa', ok: false }
  }
  if (st === 'table') {
    const c = s.customers.find((c) => c.state === 'sit' && c.table === s.nearRef && !c.served)
    if (!c) return { station: st, action: 'emptyTable', ok: false }
    if (isCup(L.carry)) return { station: st, action: 'serveCocoa', ok: true }
    return { station: st, action: 'needCocoa', ok: false }
  }
  if (st === 'aquarium') return s.tour ? { station: st, action: 'tour', ok: true } : { station: st, action: 'noTour', ok: false }
  if (st === 'staff') {
    const k = s.staff[s.nearRef]
    if (!k) return null
    if (k.asleep || k.energy < 70) return { station: st, action: 'feed', ok: true, who: k.id }
    return { station: st, action: 'pat', ok: true, who: k.id }
  }
  return null
}

function boxTypeToTake(s) {
  let best = -1
  let bestScore = Infinity
  for (let i = 0; i < s.types; i++) {
    if (s.store[i] <= 0) continue
    const score = s.jars[i] / s.cap
    if (score < bestScore) {
      bestScore = score
      best = i
    }
  }
  return best
}

function orderTypes(s) {
  const level = s.store.map((n, i) => n + s.jars[i] / s.cap + s.dockBoxes.filter((t) => t === i).length)
  const out = []
  for (let k = 0; k < 3; k++) {
    const i = level.indexOf(Math.min(...level))
    out.push(i)
    level[i] += 1
  }
  return out
}

/** Aktionstaste (E / Leertaste / Knopf). */
export function act(s) {
  if (s.paused || s.over || s.pending) return
  const p = promptOf(s)
  if (!p) return
  if (!p.ok) {
    emit(s, 'nope', { action: p.action })
    return
  }
  const L = s.loopy
  switch (p.action) {
    case 'refill': {
      const t = L.carry.type
      s.jars[t] = s.cap
      L.carry = null
      emit(s, 'sfx', { name: 'refill' })
      fx(s, 'sparkle', PLACES.stall[0], PLACES.stall[1] + 0.3, 1.3)
      break
    }
    case 'serve': {
      const c = frontCustomer(s)
      s.jars[c.want] -= c.qty
      const rush = isRush(s.t)
      const bonus = Math.floor(s.combo / 5) * (rush ? 2 : 1)
      const mult = c.vip ? 5 : c.kind === 'gold' ? 3 : 1
      addMoney(s, PRICES.sale * c.qty * mult, 'sales')
      const quick = c.patience > c.max * 0.5 ? Math.round(PRICES.quickTip * (PERSONALITIES[c.personality]?.tip ?? 1)) : 0
      if (bonus + quick) addMoney(s, bonus + quick, 'sales') // Trinkgeld fürs schnelle Bedienen zählt zum Umsatz, nicht zu den Fragen-Prämien
      bumpCombo(s)
      L_mood(s, 'happy')
      served(s, c)
      emit(s, 'sfx', { name: c.vip || c.kind === 'gold' ? 'gold' : 'coin' })
      if (c.vip) emit(s, 'star')
      break
    }
    case 'talk':
    case 'inspector': {
      const c = frontCustomer(s)
      c.mood = 'talk'
      emit(s, 'voice', { species: c.species, mood: 'talk' })
      ask(s, c.kind === 'inspector' ? 'mail' : 'counter', { customerId: c.id, sub: c.kind === 'inspector' ? 'inspector' : c.kind === 'regular' ? 'regular' : null, castId: c.castId ?? null })
      break
    }
    case 'takeBox': {
      const t = boxTypeToTake(s)
      s.store[t] -= 1
      L.carry = { kind: 'box', type: t, src: 'store' }
      emit(s, 'sfx', { name: 'pickup' })
      break
    }
    case 'stash': {
      s.store[L.carry.type] += 1
      L.carry = null
      emit(s, 'sfx', { name: 'drop' })
      break
    }
    case 'inventur':
      ask(s, 'store')
      break
    case 'unload': {
      const t = s.dockBoxes.shift()
      L.carry = { kind: 'box', type: t, src: 'dock' }
      emit(s, 'sfx', { name: 'pickup' })
      break
    }
    case 'order':
      ask(s, 'dock')
      break
    case 'letter':
    case 'lateLetter':
      ask(s, 'mail', { sub: s.letterKind })
      break
    case 'brew': {
      // eine Bestellung reservieren, Tasse in die Hand
      const c = cafeWaiting(s)[0]
      if (c) c.claimed = 'loopy'
      L.carry = { kind: 'cocoa', for: c?.id ?? null }
      emit(s, 'sfx', { name: 'refill' })
      fx(s, 'steam', CAFE.machine[0], CAFE.machine[1], 1.3)
      break
    }
    case 'dumpCup': {
      if (L.carry.for) {
        const c = s.customers.find((x) => x.id === L.carry.for)
        if (c) c.claimed = null
      }
      L.carry = null
      emit(s, 'sfx', { name: 'drop' })
      break
    }
    case 'serveCocoa': {
      const c = s.customers.find((c) => c.state === 'sit' && c.table === s.nearRef && !c.served)
      if (L.carry.for && L.carry.for !== c.id) {
        const other = s.customers.find((x) => x.id === L.carry.for)
        if (other) other.claimed = null
      }
      L.carry = null
      serveCocoa(s, c)
      break
    }
    case 'tour':
      ask(s, 'aquarium')
      break
    case 'feed':
    case 'pat': {
      const k = s.staff[p.who]
      if (p.action === 'feed') {
        addMoney(s, -PRICES.snack, 'goods')
        k.energy = Math.min(100, k.energy + 50)
        k.asleep = false
        emit(s, 'sfx', { name: 'munch' })
      } else {
        k.energy = Math.min(100, k.energy + 5)
        emit(s, 'sfx', { name: 'pat' })
      }
      k.happyT = 0
      s.staffCare += 1
      L_mood(s, 'happy')
      fx(s, 'hearts', k.x, k.z, 1.2)
      emit(s, 'care', { who: k.id, action: p.action })
      break
    }
  }
}

function serveCocoa(s, c) {
  c.served = true
  c.mood = 'happy'
  c.sitT = 0
  s.cocoa += 1
  addMoney(s, PRICES.cocoa, 'sales')
  fx(s, 'hearts', c.x, c.z, 1.4)
  emit(s, 'sfx', { name: 'coin' })
  emit(s, 'voice', { species: c.species, mood: 'happy' })
  emit(s, 'cocoa')
}

function ask(s, station, extra = {}) {
  s.pending = { station, ...extra }
  s.paused = true
  L_mood(s, 'think')
  emit(s, 'ask', { station, ...extra })
}

function L_mood(s, mood) {
  s.loopy.mood = mood
  s.loopy.moodT = 0
}

function bumpCombo(s) {
  s.combo += 1
  s.bestCombo = Math.max(s.bestCombo, s.combo)
  if (s.combo >= 3 && s.combo % 3 === 0) {
    emit(s, 'combo', { n: s.combo })
    fx(s, 'confetti', s.loopy.x, s.loopy.z, 2.0)
  }
}

function breakCombo(s) {
  if (s.combo >= 3) emit(s, 'comboLost')
  s.combo = 0
}

function served(s, c) {
  s.served += 1
  s.species[c.species] = (s.species[c.species] ?? 0) + 1
  fx(s, c.vip ? 'stars' : 'hearts', c.x, c.z, 1.55)
  emit(s, 'voice', { species: c.species, mood: 'happy' })
  // manche setzen sich danach noch ins Café
  if (s.areas.cafe && !c.vip && c.kind !== 'inspector' && Math.random() < 0.38) {
    const free = CAFE.tables.findIndex((_, i) => !s.customers.some((x) => x.table === i && x.state !== 'gone'))
    if (free >= 0) {
      const [tx, tz] = CAFE.tables[free]
      c.state = 'toCafe'
      c.mood = 'happy'
      c.slot = -1
      c.table = free
      c.path = [
        [-2.4, 2.3],
        [-5.6, 1.1],
        [-7.2, 1.1],
        [tx + CAFE.seat[0], tz + CAFE.seat[1]],
      ]
      return
    }
  }
  leave(s, c, 'happy')
}

/** Antwort auf die offene Frage. ok: richtig? ref: welche Frage (für Statistik). */
export function answer(s, ok, ref, text = '') {
  const q = s.pending
  if (!q) return
  s.pending = null
  s.paused = false
  s.answers.push({ ref, ok, station: q.station, text })
  L_mood(s, ok ? 'happy' : 'sad')
  const c = q.customerId ? s.customers.find((c) => c.id === q.customerId) : null
  if (q.sub === 'inspector') {
    if (ok) addMoney(s, PRICES.inspector, 'tips')
    if (c) leave(s, c, ok ? 'happy' : 'ok')
    if (c && ok) fx(s, 'sparkle', c.x, c.z, 1.6)
  } else if (q.station === 'counter') {
    if (ok) {
      addMoney(s, Math.round((q.sub === 'regular' ? PRICES.tipRegular : PRICES.tipAsk) * (PERSONALITIES[c?.personality]?.tip ?? 1)), 'tips')
      bumpCombo(s)
      if (c) served(s, c)
      if (q.sub === 'regular') s.regularsHappy += 1
    } else {
      // nicht schlimm: die Kundschaft kauft trotzdem und geht freundlich (nur ohne Bonus)
      addMoney(s, PRICES.sale, 'sales')
      if (c) {
        s.served += 1
        s.species[c.species] = (s.species[c.species] ?? 0) + 1
        leave(s, c, 'ok')
        emit(s, 'voice', { species: c.species, mood: 'ok' })
      }
    }
    if (q.castId) emit(s, 'friend', { castId: q.castId, ok })
  } else if (q.station === 'mail') {
    const late = q.sub === 'late'
    s.letter = false
    s.letterKind = null
    s.nextLetter = s.t + rand(40, 58)
    if (ok) addMoney(s, late ? PRICES.late : PRICES.letter, 'tips')
  } else if (q.station === 'store') {
    s.inventur = false
    s.nextInventur = s.t + rand(50, 70)
    if (ok) addMoney(s, PRICES.inventur, 'tips')
  } else if (q.station === 'aquarium') {
    s.tour = false
    s.nextTour = s.t + rand(45, 60)
    addMoney(s, ok ? PRICES.tour : PRICES.tourBad, 'tips')
    if (ok) fx(s, 'bubbles', AQUARIUM.front[0], AQUARIUM.front[1] - 1.2, 1.4)
  } else if (q.station === 'dock') {
    const types = orderTypes(s)
    const cost = types.length * (ok ? PRICES.boxGood : PRICES.boxFull)
    addMoney(s, -cost, 'goods')
    s.order = { types }
    s.boat = { state: 'coming', p: 0, timer: 0, slow: Boolean(s.lateOrder) }
    if (s.lateOrder) {
      s.lateOrder = false
      emit(s, 'lateBoat')
    }
    emit(s, 'ordered', { cost, discount: ok })
  }
}

// ---------- Kundschaft ----------
function spawn(s, kind, extra = {}) {
  const taken = new Set(s.customers.filter((c) => c.slot >= 0).map((c) => c.slot))
  const slot = QUEUE.findIndex((_, i) => !taken.has(i))
  if (slot < 0) return false
  const cast = extra.castId ? castById(extra.castId) : null
  const species = cast?.species ?? extra.species ?? pick(SPECIES).id
  const personality = cast?.personality ?? pick(PERSONALITY_IDS)
  const P = PERSONALITIES[personality]
  const rush = isRush(s.t)
  const talky = kind === 'ask' || kind === 'regular' || kind === 'inspector'
  const base = (talky ? 48 : rush ? 26 : 32) * (kind === 'inspector' ? 1.3 : 1)
  const fav = speciesById(species).fav
  const want = fav < s.types && Math.random() < 0.7 ? fav : pickIndex(s.types)
  const patience = base * s.patienceK * P.patience
  const c = {
    id: s.nextId++,
    kind,
    species,
    tint: pickIndex(4),
    personality,
    castId: cast?.id ?? null,
    name: cast?.name ?? null,
    vip: Boolean(extra.vip),
    inspector: kind === 'inspector',
    santa: s.holiday === 'xmas' && Math.random() < 0.5,
    want,
    qty: kind === 'gold' || extra.vip ? 1 : Math.random() < 0.7 ? 1 : 2,
    slot,
    x: PLACES.entry[0] + rand(-0.3, 0.3),
    z: PLACES.entry[1] + rand(-0.4, 0.4),
    yaw: -1.6,
    state: 'walk',
    mood: 'ok',
    moving: true,
    patience,
    max: patience,
    present: true,
    greeted: false,
    gone: 0,
    path: null,
    table: -1,
  }
  s.customers.push(c)
  s.met[species] = true
  emit(s, 'sfx', { name: extra.vip ? 'fanfare' : 'bell' })
  return true
}

function leave(s, c, mood) {
  c.state = 'leave'
  c.mood = mood
  c.slot = -1
  c.path = null
}

function walkTo(c, goal, speed, dt) {
  const dx = goal[0] - c.x
  const dz = goal[1] - c.z
  const d = Math.hypot(dx, dz)
  if (d > 0.04) {
    const stepLen = Math.min(d, speed * dt)
    c.x += (dx / d) * stepLen
    c.z += (dz / d) * stepLen
    if (d > 0.3) c.yaw = Math.atan2(dx, dz)
  }
  return d
}

function stepCustomers(s, dt) {
  // Warteschlange aufrücken
  const waiting = s.customers.filter((c) => c.slot >= 0).sort((a, b) => a.slot - b.slot)
  waiting.forEach((c, i) => (c.slot = i))
  const calm = Object.values(s.staff).some((k) => k.id === 'luma' && !k.asleep && k.energy > 0)
  const drain = (s.t < s.rivalUntil ? 1.35 : 1) * (calm ? 0.72 : 1)

  for (const c of s.customers) {
    let d = 0
    if (c.state === 'toCafe' || (c.state === 'leave' && c.path)) {
      const goal = c.path[0]
      d = walkTo(c, goal, c.state === 'leave' ? 3.0 : 2.6, dt)
      c.moving = true
      if (d < 0.12) {
        c.path.shift()
        if (!c.path.length) {
          c.path = null
          if (c.state === 'toCafe') {
            c.state = 'sit'
            c.mood = 'sit'
            c.moving = false
            c.served = false
            c.claimed = null
            c.sitT = 0
            c.patience = 40 * s.patienceK
            c.max = c.patience
            const [tx, tz] = CAFE.tables[c.table]
            c.yaw = Math.atan2(tx - c.x, tz - c.z)
          }
        }
      }
    } else if (c.state === 'sit') {
      c.moving = false
      c.sitT += dt
      if (!c.served) {
        c.patience -= dt * drain
        if (c.patience <= 0) {
          c.table = -1
          leaveCafe(s, c, 'angry')
          s.lost += 1
          breakCombo(s)
          emit(s, 'lost')
          emit(s, 'sfx', { name: 'grumble' })
        }
      } else if (c.sitT > 2.4) {
        c.table = -1
        leaveCafe(s, c, 'happy')
      }
    } else {
      const goal = c.state === 'leave' ? PLACES.entry : QUEUE[c.slot]
      d = walkTo(c, goal, c.state === 'leave' ? 3.2 : 2.6, dt)
      c.moving = d > 0.05
      if (c.state === 'walk' && d < 0.25) c.state = 'wait'
      else if (c.state === 'wait' && d > 0.5) c.state = 'walk' // in der Schlange aufrücken
      if (c.state === 'wait') {
        // Blick zur Theke
        c.yaw = Math.atan2(PLACES.stall[0] - c.x, PLACES.stall[1] + 0.4 - c.z)
        if (c.slot === 0 && !c.greeted) {
          c.greeted = true
          emit(s, 'voice', { species: c.species, mood: 'ok' })
          if (c.castId) emit(s, 'regularHere', { castId: c.castId })
        }
        c.patience -= dt * drain
        if (c.patience < c.max * 0.3 && c.mood === 'ok') c.mood = 'talk'
        if (c.patience <= 0) {
          leave(s, c, 'angry')
          s.lost += 1
          breakCombo(s)
          fx(s, 'cloud', c.x, c.z, 1.6)
          emit(s, 'lost')
          emit(s, 'sfx', { name: 'grumble' })
          emit(s, 'voice', { species: c.species, mood: 'angry' })
        }
      }
      if (c.state === 'leave') {
        c.gone += dt
        if (d < 0.6 || c.gone > 7) c.present = false
      }
    }
    if (c.state === 'leave' && c.path) {
      c.gone += dt
      if (c.gone > 14) c.present = false
    }
    if (!c.present) c.fade = (c.fade ?? 0) + dt
  }
  // nach dem Verschwinden (Schrumpfen) aus der Liste nehmen
  s.customers = s.customers.filter((c) => c.present || c.fade < 0.8)
}

function leaveCafe(s, c, mood) {
  c.state = 'leave'
  c.mood = mood
  c.slot = -1
  c.path = [
    [-7.2, 1.1],
    [-5.6, 1.1],
    [-2.6, 2.4],
    [1.6, 2.5],
    PLACES.entry,
  ]
}

// ---------- Personal ----------
const STAFF_SPEED = { kai: 2.3, otto: 2.1, luma: 1.6, momo: 2.2 }

function staffWalk(k, goal, dt) {
  const dx = goal[0] - k.x
  const dz = goal[1] - k.z
  const d = Math.hypot(dx, dz)
  k.moving = d > 0.08
  if (k.moving) {
    const sp = STAFF_SPEED[k.id] * (k.sleepy ? 0.55 : 1)
    const stepLen = Math.min(d, sp * dt)
    k.x += (dx / d) * stepLen
    k.z += (dz / d) * stepLen
    k.yaw = Math.atan2(dx, dz)
  }
  return d
}

function tire(k, amount) {
  k.energy = Math.max(0, k.energy - amount)
}

function stepStaff(s, dt) {
  for (const k of Object.values(s.staff)) {
    k.happyT += dt
    k.sleepy = k.energy < 25
    if (k.energy <= 0 && !k.asleep && k.task === 'idle') {
      k.asleep = true
      emit(s, 'asleep', { who: k.id })
    }
    if (k.asleep) {
      k.moving = false
      // am Strand erholt es sich schnell, sonst langsam am Platz
      if (s.areas.beach) {
        const bed = BEACH.beds[['kai', 'otto', 'luma', 'momo'].indexOf(k.id) % BEACH.beds.length]
        const d = staffWalk(k, [bed[0], bed[1] - 0.05], dt)
        k.asleep = true
        if (d < 0.1) k.energy = Math.min(100, k.energy + 9 * dt)
      } else k.energy = Math.min(100, k.energy + 2.2 * dt)
      if (k.energy >= 70) {
        k.asleep = false
        emit(s, 'awake', { who: k.id })
      }
      continue
    }
    const home = STAFF_HOME[k.id]
    if (k.id === 'kai') {
      if (k.task === 'idle' && s.dockBoxes.length && s.store.some((n) => n < s.storeCap)) k.task = 'fetch'
      const goal = k.task === 'fetch' ? PLACES.dockPile : k.task === 'bring' ? PLACES.storeDoor : home
      const d = staffWalk(k, goal, dt)
      if (k.task === 'fetch' && d < 0.15) {
        if (s.dockBoxes.length) {
          k.carry = { kind: 'box', type: s.dockBoxes.shift() }
          k.task = 'bring'
        } else k.task = 'idle'
      } else if (k.task === 'bring' && d < 0.15) {
        const t = k.carry.type
        if (s.store[t] < s.storeCap) {
          s.store[t] += 1
          k.carry = null
          k.task = 'idle'
          tire(k, 7)
        }
      }
    } else if (k.id === 'otto') {
      // leeres Glas? Kiste aus dem Lager holen und nachfüllen
      if (k.task === 'idle') {
        const low = s.jars.findIndex((n, i) => n <= 1 && s.store[i] > 0)
        if (low >= 0) {
          k.task = 'fetch'
          k.target = low
        }
      }
      const goal = k.task === 'fetch' ? PLACES.storeDoor : k.task === 'bring' ? [-0.75, -1.3] : home
      const d = staffWalk(k, goal, dt)
      if (k.task === 'fetch' && d < 0.15) {
        if (s.store[k.target] > 0) {
          s.store[k.target] -= 1
          k.carry = { kind: 'box', type: k.target }
          k.task = 'bring'
        } else k.task = 'idle'
      } else if (k.task === 'bring' && d < 0.15) {
        s.jars[k.carry.type] = s.cap
        k.carry = null
        k.task = 'idle'
        tire(k, 9)
        fx(s, 'sparkle', 0, 0.3, 1.3)
        emit(s, 'sfx', { name: 'refill' })
      }
    } else if (k.id === 'luma') {
      // schwebt vor der Schlange und beruhigt; das kostet Kraft, solange jemand wartet
      const front = s.customers.filter((c) => c.state === 'wait').length
      staffWalk(k, [home[0] + Math.sin(s.t * 0.4) * 0.6, home[1]], dt)
      if (front) tire(k, 0.32 * dt)
    } else if (k.id === 'momo') {
      if (k.task === 'idle') {
        const c = cafeWaiting(s)[0]
        if (c) {
          c.claimed = 'momo'
          k.target = c.id
          k.task = 'brew'
          k.wait = 0
        }
      }
      if (k.task === 'brew') {
        const d = staffWalk(k, CAFE.machineFront, dt)
        if (d < 0.15) {
          k.wait += dt
          k.moving = false
          if (k.wait > 1.4) {
            k.carry = { kind: 'cocoa' }
            k.task = 'serve'
          }
        }
      } else if (k.task === 'serve') {
        const c = s.customers.find((x) => x.id === k.target)
        if (!c || c.state !== 'sit' || c.served) {
          k.carry = null
          k.task = 'idle'
        } else {
          const [tx, tz] = CAFE.tables[c.table]
          const d = staffWalk(k, [tx - 0.55, tz], dt)
          if (d < 0.15) {
            k.carry = null
            k.task = 'idle'
            serveCocoa(s, c)
            tire(k, 8)
          }
        }
      } else staffWalk(k, home, dt)
    }
  }
}

// ---------- Ereignisse ----------
function startEvent(s, type) {
  if (type === 'storm') {
    s.weather = { kind: 'rain', until: s.t + 22 }
    emit(s, 'storm')
  } else if (type === 'inspector') {
    if (!spawn(s, 'inspector', { species: 'otter' })) return false
    emit(s, 'inspector')
  } else if (type === 'star') {
    if (!spawn(s, 'gold', { vip: true })) return false
    emit(s, 'starArrives')
  } else if (type === 'rival') {
    s.rivalUntil = s.t + 28
    emit(s, 'rival')
  } else if (type === 'late') {
    s.lateOrder = true
    s.letter = true
    s.letterKind = 'late'
    emit(s, 'late')
    emit(s, 'sfx', { name: 'mail' })
  }
  s.seenEvents.push(type)
  return true
}

// ---------- Ein Schritt ----------
/** Kundschaft gezielt schicken (für den Einführungstag). */
export function sendCustomer(s, kind = 'normal', extra = {}) {
  const ok = spawn(s, kind, extra)
  if (ok && extra.want !== undefined) {
    const c = s.customers[s.customers.length - 1]
    c.want = extra.want
    c.qty = 1
  }
  return ok
}

export function step(s, dt, input) {
  if (s.over) return
  dt = Math.min(dt, 0.05)
  s.loopy.moodT += dt
  if (s.loopy.moodT > 2.2 && s.loopy.mood !== 'think') s.loopy.mood = 'idle'
  for (const f of s.fx) f.age += dt
  if (s.fx.length && s.fx[0].age > 1.8) s.fx = s.fx.filter((f) => f.age <= 1.8)
  if (s.paused) {
    s.loopy.moving = false
    return
  }
  s.t += dt
  moveLoopy(s, dt, input)
  s.near = stationAt(s)

  const rush = isRush(s.t)
  if (rush !== s.rushWas) {
    s.rushWas = rush
    emit(s, rush ? 'rushStart' : 'rushEnd')
  }

  // Wetter
  if (s.weather && s.t > s.weather.until) {
    if (s.weather.kind === 'rain') {
      s.weather = { kind: 'rainbow', until: s.t + 14 }
      emit(s, 'rainbow')
    } else s.weather = null
  }

  // Einführungstag: Uhr steht, Kundschaft kommt nur, wenn die Anleitung sie schickt, niemand wird ungeduldig
  if (s.tutorial) {
    s.t = 0
    s.customers.forEach((c) => (c.patience = c.max))
    stepCustomers(s, dt)
    const b = s.boat
    if (b.state === 'coming') {
      b.p = Math.min(1, b.p + dt / 4)
      if (b.p >= 1) {
        b.state = 'docked'
        b.timer = 0
        s.dockBoxes.push(...s.order.types)
        s.order = null
        emit(s, 'delivered')
        emit(s, 'sfx', { name: 'horn' })
      }
    } else if (b.state === 'docked') {
      b.timer += dt
      if (b.timer > 1.6) b.state = 'leaving'
    } else if (b.state === 'leaving') {
      b.p = Math.max(0, b.p - dt / 3)
      if (b.p <= 0) b.state = 'away'
    }
    return
  }

  // Zu Besuch bei Freunden: nur herumlaufen, kein Ladenbetrieb
  if (s.visit) {
    s.t = 0
    stepStaff(s, dt)
    return
  }

  // Neue Kundschaft und Ereignisse
  if (s.t < DAY_LEN) {
    if (s.plan.length && s.t >= s.plan[0].at) {
      const ev = s.plan[0]
      if (startEvent(s, ev.type) || s.t > ev.at + 20) s.plan.shift()
    }
    if (s.regularTimes.length && s.t >= s.regularTimes[0]) {
      if (spawn(s, 'regular', { castId: s.regularQueue[0] })) {
        s.regularTimes.shift()
        s.regularQueue.shift()
      }
    }
    s.nextSpawn -= dt
    if (s.nextSpawn <= 0) {
      const r = Math.random()
      const starChance = s.areas.aquarium ? 0.035 : 0.0
      const kind = r < 0.25 ? 'ask' : r < 0.3 ? 'gold' : 'normal'
      spawn(s, kind, { vip: r > 1 - starChance })
      const every = rush ? 3.3 : 7.2
      const weatherK = s.weather?.kind === 'rain' ? 2.0 : s.weather?.kind === 'rainbow' ? 0.6 : 1
      s.nextSpawn = (rand(every * 0.75, every * 1.25) * (s.types === 4 ? 0.88 : 1) * weatherK) / s.spawnK
    }
    if (!s.letter && s.t >= s.nextLetter) {
      s.letter = true
      s.letterKind = null
      emit(s, 'mail')
      emit(s, 'sfx', { name: 'mail' })
    }
    if (!s.inventur && s.t >= s.nextInventur) {
      s.inventur = true
      emit(s, 'inventurStart')
    }
    if (s.areas.aquarium && !s.tour && s.t >= s.nextTour) {
      s.tour = true
      emit(s, 'tourStart')
    }
  } else if (!s.closing) {
    s.closing = true
    s.customers.forEach((c) => {
      if (c.state === 'sit' || c.state === 'toCafe') leaveCafe(s, c, 'ok')
      else if (c.state !== 'leave') leave(s, c, 'ok')
    })
    emit(s, 'closing')
  }
  stepCustomers(s, dt)

  // Lieferung per Luftschiff
  const b = s.boat
  if (b.state === 'coming') {
    b.p = Math.min(1, b.p + dt / (b.slow ? 16 : 5))
    if (b.p >= 1) {
      b.state = 'docked'
      b.timer = 0
      s.dockBoxes.push(...s.order.types)
      s.order = null
      emit(s, 'delivered')
      emit(s, 'sfx', { name: 'horn' })
    }
  } else if (b.state === 'docked') {
    b.timer += dt
    if (b.timer > 1.6) b.state = 'leaving'
  } else if (b.state === 'leaving') {
    b.p = Math.max(0, b.p - dt / 3)
    if (b.p <= 0) b.state = 'away'
  }
  stepStaff(s, dt)

  if (s.closing && s.t > DAY_LEN + 3 && !s.pending) {
    s.over = true
    emit(s, 'over')
  }
}

/** Kosten am Tagesende (Miete, Löhne) */
export function closingCosts(save) {
  const lines = [['rent', -PRICES.rent]]
  for (const st of STAFF) {
    if (save.staff?.[st.id] && (!st.needs || save.areas?.[st.needs])) lines.push([`wage:${st.id}`, -st.wage])
  }
  return lines
}

/** Zufällige Ereignisse für einen Tag (ab Tag 2). */
export function planEvents(day, holiday) {
  if (day < 2) return []
  const n = day < 5 ? 1 : Math.random() < 0.5 ? 2 : 1
  const pool = ['storm', 'inspector', 'star', 'rival', 'late']
  const out = []
  const times = [rand(30, 60), rand(100, 135)]
  for (let i = 0; i < n; i++) {
    const type = pool.splice(pickIndex(pool.length), 1)[0]
    out.push({ type, at: times[i] })
  }
  if (holiday === 'xmas' && day % 3 === 0 && !out.some((e) => e.type === 'star')) out.push({ type: 'star', at: rand(140, 160) })
  return out
}

export { CAST }
