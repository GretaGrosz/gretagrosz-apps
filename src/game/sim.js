// Loopy & Co. – die Spielwelt als reine Logik (ohne React, ohne 3D). Die Szene liest den Zustand jedes Bild,
// die Oberfläche bekommt Ereignisse (Fragen, Hinweise, Töne) über `events`.
//
// Ein Spieltag dauert DAY_LEN Sekunden (08:00 bis 18:00). Kundschaft kommt an die Theke, Loopy bedient,
// holt Nachschub aus dem Lager, bestellt beim Lieferanten am Steg und liest die Post. Bei jeder Station gibt es
// BW-Fragen zum passenden Thema. Während eine Frage offen ist, steht die Zeit still.

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

export const PRICES = {
  sale: 5, // je Stück an der Theke
  tipAsk: 8, // richtig beantwortete Kundenfrage
  tipRegular: 12, // Stammkundschaft (Frage, die früher falsch war) richtig
  letter: 15,
  inventur: 10,
  wrongCustomer: 3,
  wrongLetter: 5,
  wrongInventur: 4,
  boxGood: 6, // Einkaufspreis je Kiste mit Rabatt (richtige Antwort beim Bestellen)
  boxFull: 9, // ohne Rabatt
  rent: 20, // Standmiete pro Tag
  kaiWage: 12,
}

export const UPGRADES = [
  { id: 'jars', cost: 60 },
  { id: 'shoes', cost: 80 },
  { id: 'bench', cost: 100 },
  { id: 'kai', cost: 120 },
  { id: 'choco', cost: 150 },
]

// ---------- Orte auf der Insel (Welt-Einheiten, Insel von −6 bis 6) ----------
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
  kaiHome: [1.9, -2.9],
  loopyStart: [0, -1.1],
}
// Die Schlange läuft vor der Theke quer nach rechts (so verdecken sich die Sprechblasen nicht)
export const QUEUE = [
  [0.0, 1.6],
  [1.2, 1.45],
  [2.4, 1.3],
  [3.6, 1.15],
  [4.8, 1.0],
]

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
]

const STATION_RANGE = { counter: 1.15, store: 1.2, dock: 1.35, mail: 1.0 }

const rand = (a, b) => a + Math.random() * (b - a)
const pickIndex = (n) => Math.floor(Math.random() * n)

export function isRush(t) {
  return RUSH.some(([a, b]) => t >= a && t < b)
}

export function clockOf(t) {
  const hours = OPEN_HOUR + (Math.min(t, DAY_LEN) / DAY_LEN) * (CLOSE_HOUR - OPEN_HOUR)
  const h = Math.floor(hours)
  const m = Math.floor(((hours - h) * 60) / 15) * 15
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Neuer Tag. save: { upgrades, jars, store } aus dem Spielstand. regulars: Anzahl Stammkunden heute. */
export function createDay(save, regulars = 0) {
  const types = save.upgrades.choco ? 4 : 3
  const cap = save.upgrades.jars ? 6 : 4
  const jars = Array.from({ length: types }, (_, i) => Math.min(cap, save.jars?.[i] ?? cap))
  const store = Array.from({ length: types }, (_, i) => save.store?.[i] ?? 2)
  const regularTimes = [18, 64, 118].slice(0, regulars)
  return {
    t: 0,
    over: false,
    closing: false,
    paused: false,
    types,
    cap,
    storeCap: 4, // Kisten je Sorte im Lager
    speed: save.upgrades.shoes ? 3.9 : 3.0,
    patienceK: save.upgrades.bench ? 1.4 : 1,
    loopy: { x: PLACES.loopyStart[0], z: PLACES.loopyStart[1], yaw: 0.6, moving: false, mood: 'idle', moodT: 0, carry: null },
    jars,
    store,
    dockBoxes: [],
    order: null, // { eta, types }
    boat: { state: 'away', p: 0, timer: 0 },
    customers: [],
    nextId: 1,
    nextSpawn: 2.5,
    regularTimes,
    letter: false,
    nextLetter: 24,
    inventur: false,
    nextInventur: 44,
    combo: 0,
    bestCombo: 0,
    rushWas: false,
    ledger: { sales: 0, tips: 0, penalties: 0, goods: 0 },
    served: 0,
    lost: 0,
    answers: [], // { ref, ok, station }
    kai: save.upgrades.kai ? { x: PLACES.kaiHome[0], z: PLACES.kaiHome[1], yaw: 0, moving: false, carry: null, task: 'idle' } : null,
    near: null, // aktuelle Station in Reichweite
    pending: null, // offene Frage { station, customerId }
    events: [],
    money: 0, // Veränderung des Kontostands heute (ohne Miete/Lohn)
  }
}

function emit(s, type, data = {}) {
  s.events.push({ type, ...data })
}

function addMoney(s, amount, kind) {
  s.money += amount
  if (kind) s.ledger[kind] += Math.abs(amount)
  emit(s, 'money', { amount })
}

// ---------- Bewegung ----------
function collide(x, z, r) {
  for (const [x1, z1, x2, z2] of RECTS) {
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
  for (const [cx, cz, cr] of CIRCLES) {
    const dx = x - cx
    const dz = z - cz
    const d = Math.hypot(dx, dz)
    if (d < cr + r && d > 1e-5) {
      x = cx + (dx / d) * (cr + r)
      z = cz + (dz / d) * (cr + r)
    }
  }
  x = Math.max(-ISLAND, Math.min(ISLAND, x))
  z = Math.max(-ISLAND, Math.min(ISLAND, z))
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
  const len = Math.hypot(dx, dz)
  L.moving = len > 0.08
  if (!L.moving) return
  if (len > 1) {
    dx /= len
    dz /= len
  }
  const step = s.speed * dt * (L.carry ? 0.88 : 1)
  const [nx, nz] = collide(L.x + dx * step, L.z + dz * step, 0.34)
  L.x = nx
  L.z = nz
  L.yaw = Math.atan2(dx, dz)
}

const dist = (a, b) => Math.hypot(a.x - b[0], a.z - b[1])

// ---------- Stationen ----------
function stationAt(s) {
  const L = s.loopy
  const list = [
    ['counter', dist(L, PLACES.serve) < STATION_RANGE.counter || (L.z < -0.1 && L.z > -1.6 && Math.abs(L.x) < 1.3)],
    ['store', dist(L, PLACES.storeDoor) < STATION_RANGE.store],
    ['dock', dist(L, PLACES.dock) < STATION_RANGE.dock],
    ['mail', dist(L, PLACES.mailFront) < STATION_RANGE.mail],
  ]
  return list.find(([, ok]) => ok)?.[0] ?? null
}

export function frontCustomer(s) {
  const c = s.customers.find((c) => c.slot === 0 && c.state === 'wait')
  return c ?? null
}

/** Was Loopy an der aktuellen Station tun kann: { station, action, ok } (action = Schlüssel für den Text) */
export function promptOf(s) {
  const st = s.near
  if (!st) return null
  const L = s.loopy
  if (st === 'counter') {
    if (L.carry) return { station: st, action: 'refill', ok: true, type: L.carry.type }
    const c = frontCustomer(s)
    if (!c) return { station: st, action: 'noCustomer', ok: false }
    if (c.kind === 'ask' || c.kind === 'regular') return { station: st, action: 'talk', ok: true }
    return s.jars[c.want] >= c.qty ? { station: st, action: 'serve', ok: true } : { station: st, action: 'empty', ok: false, type: c.want }
  }
  if (st === 'store') {
    if (s.inventur && !L.carry) return { station: st, action: 'inventur', ok: true }
    if (L.carry?.src === 'dock') return s.store[L.carry.type] < s.storeCap ? { station: st, action: 'stash', ok: true } : { station: st, action: 'storeFull', ok: false }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    return s.store.some((n) => n > 0) ? { station: st, action: 'takeBox', ok: true } : { station: st, action: 'storeEmpty', ok: false }
  }
  if (st === 'dock') {
    if (s.dockBoxes.length && !L.carry) return { station: st, action: 'unload', ok: true }
    if (s.order || s.boat.state !== 'away') return { station: st, action: 'onTheWay', ok: false }
    if (L.carry) return { station: st, action: 'handsFull', ok: false }
    return { station: st, action: 'order', ok: true }
  }
  if (st === 'mail') return s.letter ? { station: st, action: 'letter', ok: true } : { station: st, action: 'noMail', ok: false }
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
      break
    }
    case 'serve': {
      const c = frontCustomer(s)
      s.jars[c.want] -= c.qty
      const rush = isRush(s.t)
      const bonus = Math.floor(s.combo / 3) * (rush ? 2 : 1)
      const base = PRICES.sale * c.qty * (c.kind === 'gold' ? 3 : 1)
      addMoney(s, base, 'sales')
      if (bonus) addMoney(s, bonus, 'tips')
      bumpCombo(s)
      leave(s, c, 'happy')
      s.served += 1
      emit(s, 'sfx', { name: c.kind === 'gold' ? 'gold' : 'coin' })
      break
    }
    case 'talk': {
      const c = frontCustomer(s)
      c.mood = 'talk'
      ask(s, 'counter', { customerId: c.id, ref: c.ref })
      break
    }
    case 'takeBox': {
      const t = boxTypeToTake(s)
      s.store[t] -= 1
      L.carry = { type: t, src: 'store' }
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
      L.carry = { type: t, src: 'dock' }
      emit(s, 'sfx', { name: 'pickup' })
      break
    }
    case 'order':
      ask(s, 'dock')
      break
    case 'letter':
      ask(s, 'mail')
      break
  }
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
  if (s.combo >= 3 && s.combo % 3 === 0) emit(s, 'combo', { n: s.combo })
}

function breakCombo(s) {
  if (s.combo >= 3) emit(s, 'comboLost')
  s.combo = 0
}

/** Antwort auf die offene Frage. ok: richtig? ref: welche Frage (für Statistik). */
export function answer(s, ok, ref) {
  const q = s.pending
  if (!q) return
  s.pending = null
  s.paused = false
  s.answers.push({ ref, ok, station: q.station })
  L_mood(s, ok ? 'happy' : 'sad')
  if (q.station === 'counter') {
    const c = s.customers.find((c) => c.id === q.customerId)
    if (ok) {
      addMoney(s, c?.kind === 'regular' ? PRICES.tipRegular : PRICES.tipAsk, 'tips')
      bumpCombo(s)
      s.served += 1
      if (c) leave(s, c, 'happy')
    } else {
      addMoney(s, -PRICES.wrongCustomer, 'penalties')
      breakCombo(s)
      if (c) leave(s, c, 'angry')
    }
  } else if (q.station === 'mail') {
    s.letter = false
    s.nextLetter = s.t + rand(40, 58)
    if (ok) addMoney(s, PRICES.letter, 'tips')
    else addMoney(s, -PRICES.wrongLetter, 'penalties')
  } else if (q.station === 'store') {
    s.inventur = false
    s.nextInventur = s.t + rand(50, 70)
    if (ok) addMoney(s, PRICES.inventur, 'tips')
    else addMoney(s, -PRICES.wrongInventur, 'penalties')
  } else if (q.station === 'dock') {
    const types = orderTypes(s)
    const cost = types.length * (ok ? PRICES.boxGood : PRICES.boxFull)
    addMoney(s, -cost, 'goods')
    s.order = { eta: 6, types }
    s.boat = { state: 'coming', p: 0, timer: 0 }
    emit(s, 'ordered', { cost, discount: ok })
  }
}

// ---------- Kundschaft ----------
const LOOKS = [
  { color: '#FFD45E', dark: '#E8B63A', hat: '#B39CFF' },
  { color: '#8EE3C4', dark: '#3FBF98', hat: '#4DA3FF' },
  { color: '#D9C8FF', dark: '#A98BF0', hat: '#FF84A6' },
  { color: '#FFB3C7', dark: '#FF84A6', hat: '#5CD6B0' },
  { color: '#A5D5FF', dark: '#72B8FA', hat: '#FFD45E' },
  { color: '#FFC89A', dark: '#FF9F6B', hat: '#339AFF' },
]
const GOLD = { color: '#FFE27A', dark: '#F0B429', hat: '#FF5E8A' }
const REGULAR = { color: '#C9BBFF', dark: '#8F78E8', hat: '#FFD45E' }

function spawn(s, kind) {
  const taken = new Set(s.customers.filter((c) => c.state !== 'leave').map((c) => c.slot))
  const slot = QUEUE.findIndex((_, i) => !taken.has(i))
  if (slot < 0) return false
  const look = kind === 'gold' ? GOLD : kind === 'regular' ? REGULAR : LOOKS[pickIndex(LOOKS.length)]
  const rush = isRush(s.t)
  const base = kind === 'ask' || kind === 'regular' ? 48 : rush ? 26 : 32
  const c = {
    id: s.nextId++,
    kind,
    ...look,
    want: pickIndex(s.types),
    qty: kind === 'gold' ? 1 : Math.random() < 0.7 ? 1 : 2,
    slot,
    x: PLACES.entry[0] + rand(-0.3, 0.3),
    z: PLACES.entry[1] + rand(-0.4, 0.4),
    yaw: -1.6,
    state: 'walk',
    mood: 'ok',
    patience: base * s.patienceK,
    max: base * s.patienceK,
    present: true,
    gone: 0,
  }
  s.customers.push(c)
  emit(s, 'sfx', { name: 'bell' })
  return true
}

function leave(s, c, mood) {
  c.state = 'leave'
  c.mood = mood
  c.slot = -1
}

function stepCustomers(s, dt) {
  // Warteschlange aufrücken
  const waiting = s.customers.filter((c) => c.state !== 'leave').sort((a, b) => a.slot - b.slot)
  waiting.forEach((c, i) => (c.slot = i))

  for (const c of s.customers) {
    let goal
    if (c.state === 'leave') goal = PLACES.entry
    else goal = QUEUE[c.slot]
    const dx = goal[0] - c.x
    const dz = goal[1] - c.z
    const d = Math.hypot(dx, dz)
    const speed = c.state === 'leave' ? 3.2 : 2.6
    if (d > 0.04) {
      const step = Math.min(d, speed * dt)
      c.x += (dx / d) * step
      c.z += (dz / d) * step
      if (d > 0.3) c.yaw = Math.atan2(dx, dz)
    }
    if (c.state === 'walk' && d < 0.25) c.state = 'wait'
    else if (c.state === 'wait' && d > 0.5) c.state = 'walk' // in der Schlange aufrücken
    if (c.state === 'wait') {
      // Blick zur Theke
      c.yaw = Math.atan2(PLACES.stall[0] - c.x, PLACES.stall[1] + 0.4 - c.z)
      c.patience -= dt
      if (c.patience < c.max * 0.3 && c.mood === 'ok') c.mood = 'talk'
      if (c.patience <= 0) {
        leave(s, c, 'angry')
        s.lost += 1
        breakCombo(s)
        emit(s, 'lost')
        emit(s, 'sfx', { name: 'grumble' })
      }
    }
    if (c.state === 'leave') {
      c.gone += dt
      if (d < 0.6 || c.gone > 6) c.present = false
    }
    if (!c.present) c.fade = (c.fade ?? 0) + dt
  }
  // nach dem Verschwinden (Schrumpfen) aus der Liste nehmen
  s.customers = s.customers.filter((c) => c.present || c.fade < 0.8)
}

// ---------- Krabbe Kai (Lagerhelfer) ----------
function stepKai(s, dt) {
  const k = s.kai
  if (!k) return
  let goal = PLACES.kaiHome
  if (k.task === 'idle' && s.dockBoxes.length && s.store.some((n) => n < s.storeCap)) k.task = 'fetch'
  if (k.task === 'fetch') goal = PLACES.dockPile
  if (k.task === 'bring') goal = PLACES.storeDoor
  const dx = goal[0] - k.x
  const dz = goal[1] - k.z
  const d = Math.hypot(dx, dz)
  k.moving = d > 0.08
  if (k.moving) {
    const step = Math.min(d, 2.3 * dt)
    k.x += (dx / d) * step
    k.z += (dz / d) * step
    k.yaw = Math.atan2(dx, dz)
  }
  if (k.task === 'fetch' && d < 0.15) {
    if (s.dockBoxes.length) {
      k.carry = { type: s.dockBoxes.shift() }
      k.task = 'bring'
    } else k.task = 'idle'
  } else if (k.task === 'bring' && d < 0.15) {
    const t = k.carry.type
    if (s.store[t] < s.storeCap) {
      s.store[t] += 1
      k.carry = null
      k.task = 'idle'
    }
  }
}

// ---------- Ein Schritt ----------
export function step(s, dt, input) {
  if (s.over) return
  dt = Math.min(dt, 0.05)
  s.loopy.moodT += dt
  if (s.loopy.moodT > 2.2 && s.loopy.mood !== 'think') s.loopy.mood = 'idle'
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

  // Neue Kundschaft
  if (s.t < DAY_LEN) {
    if (s.regularTimes.length && s.t >= s.regularTimes[0]) {
      if (spawn(s, 'regular')) s.regularTimes.shift()
    }
    s.nextSpawn -= dt
    if (s.nextSpawn <= 0) {
      const r = Math.random()
      spawn(s, r < 0.27 ? 'ask' : r < 0.32 ? 'gold' : 'normal')
      const every = rush ? 3.3 : 7.2
      s.nextSpawn = rand(every * 0.75, every * 1.25) * (s.types === 4 ? 0.88 : 1)
    }
    if (!s.letter && s.t >= s.nextLetter) {
      s.letter = true
      emit(s, 'mail')
      emit(s, 'sfx', { name: 'mail' })
    }
    if (!s.inventur && s.t >= s.nextInventur) {
      s.inventur = true
      emit(s, 'inventurStart')
    }
  } else if (!s.closing) {
    s.closing = true
    s.customers.forEach((c) => c.state !== 'leave' && leave(s, c, 'ok'))
    emit(s, 'closing')
  }
  stepCustomers(s, dt)

  // Lieferung per Boot
  const b = s.boat
  if (b.state === 'coming') {
    b.p = Math.min(1, b.p + dt / 5)
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
  stepKai(s, dt)

  if (s.closing && s.t > DAY_LEN + 2.5 && !s.pending) {
    s.over = true
    emit(s, 'over')
  }
}

/** Kosten am Tagesende (Miete, Lohn) */
export function closingCosts(save) {
  const lines = [['rent', -PRICES.rent]]
  if (save.upgrades.kai) lines.push(['wageKai', -PRICES.kaiWage])
  return lines
}
