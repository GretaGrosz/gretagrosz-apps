// „Weiterspielen“-Schicht von Loopy & Co.: Tagesgeschenk, Tagesaufgaben, Stickeralbum, Geschichte
// mit Oma Schildi und Haibert, Insel-Codes und Geschenk-Codes für Freunde (ganz ohne Server).
// Reine Logik ohne JSX – läuft auch unter node (Tests). Alle Funktionen geben einen NEUEN Spielstand zurück
// (der alte wird nie verändert). Spielstand-Format: freshSave() in data.js.

import { AREAS, CAST, DECOR, EVENTS, OUTFITS, SPECIES, STAFF, seasonOf } from './data.js'
import { jahrgaenge } from '../data/curriculum.js'
import { titleOf } from '../data/translate.js'

const pick3 = (lang, de, en, hu) => (lang === 'en' ? en : lang === 'hu' ? hu : de)
const L = (obj, lang) => obj[lang] ?? obj.de
const fill = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))

// ---------- Datum ----------
const pad2 = (n) => String(n).padStart(2, '0')
export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}
function dayBefore(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1, 12)
}

// ---------- Zufall mit Startwert (gleiches Datum → gleiche Aufgaben) ----------
function hashStr(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const has = (arr, x) => Array.isArray(arr) && arr.includes(x)
const addOutfit = (save, id) => (has(save.wardrobe, id) ? save : { ...save, wardrobe: [...(save.wardrobe ?? ['none']), id] })

// =====================================================================
// Tagesgeschenk
// =====================================================================
export const DAILY_OUTFIT = 'pirate'
export const DAILY_OUTFIT_BONUS = 50

// gift: { coins, streak, outfit?, bonus? } – coins enthält den Bonus schon NICHT; gesamt = coins + (bonus ?? 0)
export function claimDaily(save, now = new Date()) {
  const today = todayKey(now)
  const daily = save.daily ?? { last: null, streak: 0 }
  if (daily.last === today) return { save, gift: null }
  // Ein verpasster Tag pausiert die Serie nur (kein Neustart) – Zurückkommen soll sich nie wie eine Strafe anfühlen
  const streak = (daily.streak || 0) + 1
  const gift = { coins: 10 + 5 * Math.min(streak, 6), streak }
  let next = { ...save, daily: { last: today, streak } }
  if (streak % 7 === 0) {
    if (has(next.wardrobe, DAILY_OUTFIT)) gift.bonus = DAILY_OUTFIT_BONUS
    else {
      gift.outfit = DAILY_OUTFIT
      next = addOutfit(next, DAILY_OUTFIT)
    }
  }
  next.coins = (next.coins || 0) + gift.coins + (gift.bonus || 0)
  return { save: next, gift }
}

// Wurde heute schon abgeholt?
export const dailyClaimed = (save, now = new Date()) => save.daily?.last === todayKey(now)

// =====================================================================
// Tagesaufgaben (3 pro Kalendertag)
// =====================================================================
// add: wie der Fortschritt aus den Tageswerten wächst · max: Bestwert an EINEM Spieltag zählt
const MISSION_KINDS = {
  serve: { emoji: '🛎️', reward: 20, target: (d) => 6 + Math.floor(d / 3), add: (s) => s.served },
  right: { emoji: '🧠', reward: 20, target: (d) => 4 + Math.floor(d / 4), add: (s) => s.right },
  combo: { emoji: '🔥', reward: 20, target: (d) => 3 + Math.floor(Math.min(d, 24) / 6), max: (s) => s.bestCombo },
  coins: { emoji: '💰', reward: 25, target: (d) => 40 + 10 * Math.floor(d / 3), max: (s) => s.profit },
  species: { emoji: '🐾', reward: 20, target: (d) => 2 + Math.floor(d / 10), add: (s, m) => s.species?.[m.species] },
  staff: { emoji: '🍪', reward: 15, target: (d) => Math.min(6, 3 + Math.floor(d / 10)), add: (s) => s.staffCare, needs: (sv) => Object.keys(sv.staff ?? {}).length > 0 },
  minigames: { emoji: '🎯', reward: 25, target: (d) => (d > 15 ? 2 : 1), add: (s) => s.minigamesWon },
  cocoa: { emoji: '☕', reward: 20, target: (d) => 4 + Math.floor(d / 6), add: (s) => s.cocoa, needs: (sv) => Boolean(sv.areas?.cafe) },
  regular: { emoji: '💛', reward: 20, target: (d) => (d < 10 ? 1 : 2), add: (s) => s.regularsHappy },
  stars: { emoji: '⭐', reward: 30, target: () => 1, add: (s) => (s.stars >= 3 ? 1 : 0) },
}
export const MISSION_KIND_IDS = Object.keys(MISSION_KINDS)

export function makeMissions(save, now = new Date()) {
  const date = todayKey(now)
  const rand = rng(hashStr(`loopy-missions:${date}`))
  const d = Math.min(30, Math.max(1, save.day || 1))
  // Reihenfolge nur nach Datum mischen, dann die passenden nehmen → gleicher Tag, gleiche Aufgaben
  const order = [...MISSION_KIND_IDS]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const speciesRoll = rand()
  const kinds = order.filter((k) => !MISSION_KINDS[k].needs || MISSION_KINDS[k].needs(save)).slice(0, 3)
  const list = kinds.map((kind, i) => {
    const def = MISSION_KINDS[kind]
    const m = { id: `${date}-${i}-${kind}`, kind, target: def.target(d), progress: 0, reward: def.reward + Math.floor(d / 2), claimed: false }
    if (kind === 'species') {
      const met = SPECIES.filter((s) => save.met?.[s.id])
      const pool = met.length >= 2 ? met : SPECIES
      m.species = pool[Math.floor(speciesRoll * pool.length)].id
    }
    return m
  })
  return { date, list }
}

// Spielstand mit den heutigen Aufgaben (unverändert, wenn sie schon da sind)
export function ensureMissions(save, now = new Date()) {
  if (save.missions?.date === todayKey(now) && Array.isArray(save.missions.list)) return save
  return { ...save, missions: makeMissions(save, now) }
}

// stats: { served, lost, right, wrong, bestCombo, profit, stars, species: { cat: 2 }, staffCare, minigamesWon, cocoa, regularsHappy }
export function applyDayToMissions(save, stats = {}) {
  if (!save.missions?.list) return save
  const list = save.missions.list.map((m) => {
    if (m.claimed || m.progress >= m.target) return m
    const def = MISSION_KINDS[m.kind]
    if (!def) return m
    const v = Math.max(0, Number((def.add ?? def.max)(stats, m)) || 0)
    const progress = Math.min(m.target, def.add ? m.progress + v : Math.max(m.progress, v))
    return progress === m.progress ? m : { ...m, progress }
  })
  return { ...save, missions: { ...save.missions, list } }
}

export const missionDone = (m) => m.progress >= m.target
export const missionsReady = (save) => (save.missions?.list ?? []).filter((m) => missionDone(m) && !m.claimed).length

export function claimMission(save, missionId) {
  const list = save.missions?.list ?? []
  const m = list.find((x) => x.id === missionId)
  if (!m || m.claimed || !missionDone(m)) return save
  return {
    ...save,
    coins: (save.coins || 0) + m.reward,
    missions: { ...save.missions, list: list.map((x) => (x.id === missionId ? { ...x, claimed: true } : x)) },
  }
}

const MISSION_TEXT = {
  serve: { de: 'Bediene {n} Gäste', en: 'Serve {n} guests', hu: 'Szolgálj ki {n} vendéget' },
  right: { de: 'Beantworte {n} Fragen richtig', en: 'Answer {n} questions right', hu: 'Válaszolj jól {n} kérdésre' },
  combo: { de: 'Schaff eine Serie von ×{n}', en: 'Reach a ×{n} combo', hu: 'Érj el ×{n} sorozatot' },
  coins: { de: 'Mach {n} Münzen Gewinn an einem Tag', en: 'Make {n} coins profit in one day', hu: 'Keress {n} érme nyereséget egy nap alatt' },
  species: { de: 'Bediene {n} {emoji}-Gäste', en: 'Serve {n} {emoji} guests', hu: 'Szolgálj ki {n} {emoji} vendéget' },
  staff: { de: 'Füttere oder streichle dein Team {n}×', en: 'Feed or pet your team {n}×', hu: 'Etesd vagy simogasd a csapatod {n}×' },
  minigames: { de: 'Gewinn {n} Mini-Spiel', en: 'Win {n} mini-game', hu: 'Nyerj {n} minijátékot' },
  minigames2: { de: 'Gewinn {n} Mini-Spiele', en: 'Win {n} mini-games', hu: 'Nyerj {n} minijátékot' },
  cocoa: { de: 'Servier {n} Kakao im Café', en: 'Serve {n} cocoas in the café', hu: 'Szolgálj fel {n} kakaót a kávézóban' },
  regular: { de: 'Mach einen Stammgast glücklich', en: 'Make a regular happy', hu: 'Tegyél boldoggá egy törzsvendéget' },
  regular2: { de: 'Mach {n} Stammgäste glücklich', en: 'Make {n} regulars happy', hu: 'Tegyél boldoggá {n} törzsvendéget' },
  stars: { de: 'Schaff einen Tag mit 3 Sternen', en: 'Finish a day with 3 stars', hu: 'Zárj egy napot 3 csillaggal' },
}

// Text und Emoji einer Aufgabe in der gewählten Sprache
export function missionLabel(m, lang = 'de') {
  let key = m.kind
  if ((key === 'minigames' || key === 'regular') && m.target > 1) key += '2'
  const sp = m.species && SPECIES.find((s) => s.id === m.species)
  const text = fill(L(MISSION_TEXT[key] ?? MISSION_TEXT.serve, lang), { n: m.target, emoji: sp?.emoji ?? '' })
  return { text, emoji: sp?.emoji ?? MISSION_KINDS[m.kind]?.emoji ?? '✨' }
}

// =====================================================================
// Stickeralbum
// =====================================================================
export const STICKER_GROUPS = ['species', 'friends', 'topics', 'staff', 'areas', 'events', 'seasons']
export const TOPIC_GOAL = 5 // richtige Antworten pro Thema
export const FRIEND_GOAL = 3 // Herzen
export const ALBUM_GOAL = 12 // Sticker für den Partyhut
export const ALBUM_OUTFIT = 'party'

const GROUP_TITLE = {
  species: { de: 'Gäste', en: 'Guests', hu: 'Vendégek' },
  friends: { de: 'Stammgäste', en: 'Regulars', hu: 'Törzsvendégek' },
  topics: { de: 'BW-Themen', en: 'BW topics', hu: 'BW-témák' },
  staff: { de: 'Team', en: 'Team', hu: 'Csapat' },
  areas: { de: 'Insel', en: 'Island', hu: 'Sziget' },
  events: { de: 'Ereignisse', en: 'Events', hu: 'Események' },
  seasons: { de: 'Jahreszeiten', en: 'Seasons', hu: 'Évszakok' },
}
export const stickerGroupTitle = (group, lang = 'de') => L(GROUP_TITLE[group] ?? { de: group }, lang)

export const SPECIES_NAME = {
  puffer: { de: 'Kugelfisch', en: 'Pufferfish', hu: 'Gömbhal' },
  cat: { de: 'Katze', en: 'Cat', hu: 'Cica' },
  bunny: { de: 'Hase', en: 'Bunny', hu: 'Nyuszi' },
  frog: { de: 'Frosch', en: 'Frog', hu: 'Béka' },
  penguin: { de: 'Pinguin', en: 'Penguin', hu: 'Pingvin' },
  duck: { de: 'Ente', en: 'Duck', hu: 'Kacsa' },
  hamster: { de: 'Hamster', en: 'Hamster', hu: 'Hörcsög' },
  otter: { de: 'Otter', en: 'Otter', hu: 'Vidra' },
}
export const STAFF_TEXT = {
  kai: { name: 'Kai', kind: { de: 'Krabbe', en: 'Crab', hu: 'Rák' } },
  luma: { name: 'Luma', kind: { de: 'Qualle', en: 'Jellyfish', hu: 'Medúza' } },
  otto: { name: 'Otto', kind: { de: 'Oktopus', en: 'Octopus', hu: 'Polip' } },
  momo: { name: 'Momo', kind: { de: 'Robbe', en: 'Seal', hu: 'Fóka' } },
}
export const JOB_TEXT = {
  carry: { de: 'Trägt Lieferungen vom Steg ins Lager.', en: 'Carries deliveries from the jetty to the storeroom.', hu: 'A stégről a raktárba hordja a szállítmányokat.' },
  calm: { de: 'Beruhigt Wartende – sie bleiben länger geduldig.', en: 'Keeps waiting guests calm and patient.', hu: 'Megnyugtatja a várakozókat, így tovább türelmesek.' },
  refill: { de: 'Füllt leere Gläser aus dem Lager nach.', en: 'Refills empty jars from the storeroom.', hu: 'Utántölti az üres üvegeket a raktárból.' },
  cafe: { de: 'Macht Kakao im Café und serviert ihn.', en: 'Makes cocoa in the café and serves it.', hu: 'Kakaót főz és felszolgál a kávézóban.' },
}
export const AREA_TEXT = {
  beach: { name: { de: 'Strand', en: 'Beach', hu: 'Strand' }, text: { de: 'Dein Team erholt sich, Gäste sind entspannter.', en: 'Your team recharges, guests are more relaxed.', hu: 'A csapatod pihen, a vendégek nyugodtabbak.' } },
  cafe: { name: { de: 'Café', en: 'Café', hu: 'Kávézó' }, text: { de: 'Kakao an Tischen servieren – mehr Umsatz.', en: 'Serve cocoa at tables – more sales.', hu: 'Kakaó az asztaloknál – több bevétel.' } },
  aquarium: { name: { de: 'Aquarium', en: 'Aquarium', hu: 'Akvárium' }, text: { de: 'Führungen mit Mini-Spiel, lockt Stars an.', en: 'Tours with a mini-game, attracts stars.', hu: 'Túrák minijátékkal, sztárokat vonz.' } },
}
export const UPGRADE_TEXT = {
  jars: { name: { de: 'Große Gläser', en: 'Big jars', hu: 'Nagy üvegek' }, text: { de: 'Jedes Glas fasst 6 statt 4 Bonbons.', en: 'Each jar holds 6 sweets instead of 4.', hu: 'Minden üvegbe 4 helyett 6 cukorka fér.' } },
  shoes: { name: { de: 'Flossen-Sneaker', en: 'Fin sneakers', hu: 'Uszonyos cipő' }, text: { de: 'Loopy ist 30 % schneller unterwegs.', en: 'Loopy moves 30% faster.', hu: 'Loopy 30%-kal gyorsabb.' } },
  bench: { name: { de: 'Bank und Sonnenschirm', en: 'Bench and parasol', hu: 'Pad és napernyő' }, text: { de: 'Gäste warten 40 % länger.', en: 'Customers wait 40% longer.', hu: 'A vásárlók 40%-kal tovább várnak.' } },
  choco: { name: { de: 'Neue Sorte: Schoko', en: 'New kind: chocolate', hu: 'Új fajta: csoki' }, text: { de: 'Eine 4. Bonbonsorte lockt mehr Gäste an.', en: 'A 4th kind of sweet attracts more guests.', hu: 'Egy negyedik fajta több vendéget vonz.' } },
}
export const DECOR_NAME = {
  flowerpot: { de: 'Blumentopf', en: 'Flower pot', hu: 'Virágcserép' },
  lantern: { de: 'Laterne', en: 'Lantern', hu: 'Lampion' },
  shellLamp: { de: 'Muschellampe', en: 'Shell lamp', hu: 'Kagylólámpa' },
  parasol: { de: 'Sonnenschirm', en: 'Parasol', hu: 'Napernyő' },
  benchDeco: { de: 'Bankerl', en: 'Little bench', hu: 'Padocska' },
  balloons: { de: 'Luftballons', en: 'Balloons', hu: 'Lufik' },
  flamingo: { de: 'Flamingo', en: 'Flamingo', hu: 'Flamingó' },
  fountain: { de: 'Brunnen', en: 'Fountain', hu: 'Szökőkút' },
  xmasTree: { de: 'Christbaum', en: 'Christmas tree', hu: 'Karácsonyfa' },
  snowman: { de: 'Schneemann', en: 'Snowman', hu: 'Hóember' },
  pumpkin: { de: 'Kürbis', en: 'Pumpkin', hu: 'Tök' },
  eggs: { de: 'Ostereier', en: 'Easter eggs', hu: 'Hímes tojások' },
}
export const OUTFIT_NAME = {
  none: { de: 'Ohne', en: 'Nothing', hu: 'Semmi' },
  bow: { de: 'Masche', en: 'Bow', hu: 'Masni' },
  straw: { de: 'Strohhut', en: 'Straw hat', hu: 'Szalmakalap' },
  beanie: { de: 'Kapperl', en: 'Cap', hu: 'Baseballsapka' },
  shades: { de: 'Sonnenbrille', en: 'Shades', hu: 'Napszemüveg' },
  flowers: { de: 'Blumenkranz', en: 'Flower crown', hu: 'Virágkoszorú' },
  headphones: { de: 'Kopfhörer', en: 'Headphones', hu: 'Fejhallgató' },
  chef: { de: 'Kochmütze', en: 'Chef’s hat', hu: 'Szakácssapka' },
  pirate: { de: 'Piratenhut', en: 'Pirate hat', hu: 'Kalózkalap' },
  party: { de: 'Partyhut', en: 'Party hat', hu: 'Bulisapka' },
  crown: { de: 'Goldene Krone', en: 'Golden crown', hu: 'Aranykorona' },
  santa: { de: 'Weihnachts\u00admütze', en: 'Santa hat', hu: 'Mikulássapka' },
}
const EVENT_TEXT = {
  storm: { emoji: '⛈️', de: 'Sturm', en: 'Storm', hu: 'Vihar' },
  inspector: { emoji: '🧾', de: 'Finanzamt-Otter', en: 'Tax otter', hu: 'Adóellenőr vidra' },
  star: { emoji: '🌟', de: 'Star-Besuch', en: 'Star guest', hu: 'Sztárvendég' },
  rival: { emoji: '📣', de: 'Haiberts Werbung', en: 'Haibert’s ads', hu: 'Haibert reklámja' },
  late: { emoji: '📦', de: 'Lieferverzug', en: 'Late delivery', hu: 'Szállítási késés' },
}
const SEASON_TEXT = {
  spring: { emoji: '🌷', de: 'Frühling', en: 'Spring', hu: 'Tavasz' },
  summer: { emoji: '☀️', de: 'Sommer', en: 'Summer', hu: 'Nyár' },
  autumn: { emoji: '🍂', de: 'Herbst', en: 'Autumn', hu: 'Ősz' },
  winter: { emoji: '❄️', de: 'Winter', en: 'Winter', hu: 'Tél' },
}
export const SEASONS = Object.keys(SEASON_TEXT)
const YEAR_EMOJI = { 1: '📗', 2: '📘', 3: '📙' }

// Alle Themen der Jahrgänge 1–3
function albumTopics() {
  return jahrgaenge.filter((j) => j.id >= 1 && j.id <= 3).flatMap((j) => j.topics.map((t) => ({ ...t, year: j.id })))
}

// opts.topicTitle(topic, lang): eigene Titelfunktion (Standard: Übersetzungen der App)
export function stickerList(save, lang = 'de', opts = {}) {
  const topicTitle = opts.topicTitle ?? titleOf
  const yearWord = pick3(lang, 'Jg.', 'Year', 'Évf.')
  const out = []
  for (const s of SPECIES) out.push({ id: `species:${s.id}`, group: 'species', got: Boolean(save.met?.[s.id]), emoji: s.emoji, title: L(SPECIES_NAME[s.id], lang), sub: '' })
  for (const c of CAST) {
    const hearts = Math.min(FRIEND_GOAL, save.friends?.[c.id] || 0)
    const sp = SPECIES.find((s) => s.id === c.species)
    out.push({ id: `friend:${c.id}`, group: 'friends', got: hearts >= FRIEND_GOAL, emoji: sp?.emoji ?? '💛', title: c.name, sub: `♥ ${hearts}/${FRIEND_GOAL}` })
  }
  for (const t of albumTopics()) {
    const n = Math.min(TOPIC_GOAL, save.topics?.[t.id] || 0)
    out.push({ id: `topic:${t.id}`, group: 'topics', got: n >= TOPIC_GOAL, emoji: YEAR_EMOJI[t.year], title: topicTitle(t, lang), sub: `${yearWord} ${t.year} · ${n}/${TOPIC_GOAL}` })
  }
  for (const s of STAFF) out.push({ id: `staff:${s.id}`, group: 'staff', got: Boolean(save.staff?.[s.id]), emoji: s.emoji, title: STAFF_TEXT[s.id].name, sub: L(STAFF_TEXT[s.id].kind, lang) })
  for (const a of AREAS) out.push({ id: `area:${a.id}`, group: 'areas', got: Boolean(save.areas?.[a.id]), emoji: a.emoji, title: L(AREA_TEXT[a.id].name, lang), sub: '' })
  for (const e of EVENTS) out.push({ id: `event:${e}`, group: 'events', got: Boolean(save.eventsSeen?.[e]), emoji: EVENT_TEXT[e].emoji, title: L(EVENT_TEXT[e], lang), sub: '' })
  for (const s of SEASONS) out.push({ id: `season:${s}`, group: 'seasons', got: Boolean(save.eventsSeen?.[`season:${s}`]), emoji: SEASON_TEXT[s].emoji, title: L(SEASON_TEXT[s], lang), sub: '' })
  return out
}

export const stickerCount = (save) => stickerList(save, 'de', { topicTitle: (t) => t.id }).filter((s) => s.got).length

// Gesammelt, aber noch nicht eingeklebt (für „Neu!“)
export function newStickers(save, lang = 'de') {
  return stickerList(save, lang).filter((s) => s.got && !save.stickers?.[s.id])
}
export function markStickers(save, ids) {
  if (!ids?.length) return save
  const stickers = { ...save.stickers }
  ids.forEach((id) => (stickers[id] = true))
  return { ...save, stickers }
}

// Partyhut ab 12 Stickern (gibt denselben Spielstand zurück, wenn sich nichts ändert)
export function albumRewards(save, lang = 'de') {
  if (has(save.wardrobe, ALBUM_OUTFIT)) return save
  const got = stickerList(save, lang, { topicTitle: (t) => t.id }).filter((s) => s.got).length
  return got >= ALBUM_GOAL ? addOutfit(save, ALBUM_OUTFIT) : save
}

// Jahreszeit (und Feiertag) als „erlebt“ eintragen – beim Start eines Spieltags aufrufen
export function markSeason(save, now = new Date()) {
  const key = `season:${seasonOf(now)}`
  if (save.eventsSeen?.[key]) return save
  return { ...save, eventsSeen: { ...save.eventsSeen, [key]: true } }
}

// =====================================================================
// Geschichte: Oma Schildi und Haibert
// =====================================================================
export const SPEAKERS = {
  schildi: { de: 'Oma Schildi', en: 'Granny Shelly', hu: 'Teknős nagyi' },
  haibert: { de: 'Haibert', en: 'Haibert', hu: 'Haibert' },
  loopy: { de: 'Loopy', en: 'Loopy', hu: 'Loopy' },
}
export const RIVAL_SHOP = { de: 'Haiberts Happen', en: 'Haibert’s Bites', hu: 'Haibert Falatozója' }
export const MARKET_GOAL = 150

const seen = (save, id) => has(save.story?.seen, id)
const line = (who, de, en, hu) => ({ who, de, en, hu })

export const STORY = [
  {
    id: 'intro',
    when: () => true,
    lines: [
      line('schildi', 'Servus, Loopy! Ich bin Oma Schildi. 80 Jahre hab ich diesen Bonbonstand geführt – ab heute gehört er dir.', 'Hello, Loopy! I’m Granny Shelly. I ran this sweet stall for 80 years – from today, it’s yours.', 'Szia, Loopy! Én vagyok Teknős nagyi. 80 évig vittem ezt a cukorkás standot – mától a tiéd.'),
      line('loopy', 'Mir?! Echt jetzt? Ich kann ja nicht mal ordentlich Münzen zählen …', 'Me?! Seriously? I can’t even count coins properly …', 'Nekem?! Komolyan? Még az érméket sem tudom rendesen megszámolni …'),
      line('schildi', 'Darum stellen dir die Gäste Fragen. Antwortest du richtig, gibt’s extra Münzen. Lernen zahlt sich hier wirklich aus!', 'That’s why guests ask you questions. Answer right and you get extra coins. Learning really pays off here!', 'Ezért kérdeznek a vendégek. Ha jól válaszolsz, extra érmét kapsz. Itt a tanulás tényleg kifizetődik!'),
      line('loopy', 'Na dann: Laden auf! 🍬', 'Well then: shop’s open! 🍬', 'Akkor hát: nyitás! 🍬'),
    ],
  },
  {
    id: 'stock',
    when: (s) => s.day >= 2,
    lines: [
      line('schildi', 'Kleiner Tipp von einer alten Schildkröte: Schau ins Lager, bevor’s leer ist.', 'A little tip from an old turtle: check the storeroom before it runs empty.', 'Egy kis tipp egy öreg teknőstől: nézz be a raktárba, mielőtt kiürül.'),
      line('schildi', 'Nachschub bestellst du am Steg. Das Boot braucht ein bisserl – also rechtzeitig!', 'You order new stock at the jetty. The boat takes a while – so order in time!', 'Utánpótlást a stégen rendelsz. A hajó kicsit lassú – úgyhogy időben!'),
      line('loopy', 'Also nicht erst, wenn das letzte Gummibärli weg ist?', 'So not when the very last gummy bear is gone?', 'Szóval nem akkor, amikor az utolsó gumimaci is elfogyott?'),
      line('schildi', 'Genau. In der BW heißt das Meldebestand: Ist er erreicht, wird nachbestellt.', 'Exactly. In business that’s the reorder point: reach it, and you reorder.', 'Pontosan. A gazdaságtanban ez a rendelési pont: ha eléred, rendelsz.'),
    ],
  },
  {
    id: 'rival',
    when: (s) => s.day >= 3,
    lines: [
      line('haibert', 'Hallöchen, Nachbarin! Haibert mein Name. Drüben auf der Insel eröffne ich „Haiberts Happen“!', 'Hiya, neighbour! The name’s Haibert. I’m opening “Haibert’s Bites” on the island across!', 'Helló, szomszéd! Haibert vagyok. A szomszéd szigeten nyitom meg a „Haibert Falatozóját”!'),
      line('haibert', 'Größer, schneller, haifischiger. Deine Kundschaft gehört bald mir! Hehehe.', 'Bigger, faster, sharkier. Your customers will soon be mine! Hehehe.', 'Nagyobb, gyorsabb, cápásabb. A vevőid hamarosan az enyémek! Hehehe.'),
      line('loopy', 'Ähm … Haie essen doch gar keine Bonbons?', 'Um … sharks don’t even eat sweets?', 'Ööö … a cápák nem is esznek cukrot, nem?'),
      line('haibert', 'Ich hab Zähne für zwei! … Moment, das war kein gutes Verkaufsargument.', 'I’ve got teeth for two! … Wait, that’s not a great sales pitch.', 'Két ember helyett is van fogam! … Várj, ez nem volt jó reklám.'),
      line('schildi', 'Keine Sorge, Loopy. Konkurrenz belebt das Geschäft. Sei freundlich und flott – das merken sich die Leute.', 'Don’t worry, Loopy. Competition keeps business lively. Be friendly and quick – people remember that.', 'Ne aggódj, Loopy. A verseny élénkíti az üzletet. Légy kedves és gyors – ezt megjegyzik.'),
    ],
  },
  {
    id: 'staff',
    when: (s) => Object.keys(s.staff ?? {}).length > 0,
    lines: [
      line('loopy', 'Ich hab wen eingestellt! Jetzt sind wir ein richtiges Team!', 'I hired someone! Now we’re a real team!', 'Felvettem valakit! Most már igazi csapat vagyunk!'),
      line('schildi', 'Wunderbar! Aber denk dran: Lohn sind Kosten – und zwar jeden Tag.', 'Wonderful! But remember: wages are costs – every single day.', 'Csodás! De ne feledd: a bér költség – mégpedig minden nap.'),
      line('schildi', 'Und ein müdes Team arbeitet langsam. Gib ihnen zwischendurch einen Snack!', 'And a tired team works slowly. Give them a snack now and then!', 'A fáradt csapat lassan dolgozik. Adj nekik néha egy kis nasit!'),
      line('loopy', 'Snacks für alle! … Auch für mich?', 'Snacks for everyone! … Me too?', 'Nasi mindenkinek! … Nekem is?'),
    ],
  },
  {
    id: 'area',
    when: (s) => Object.keys(s.areas ?? {}).length > 0,
    lines: [
      line('haibert', 'WAS?! Du baust aus?! Ich hab noch nicht einmal Sessel!', 'WHAT?! You’re expanding?! I don’t even have chairs yet!', 'MI?! Bővítesz?! Nekem még széken sincs!'),
      line('schildi', 'Das ist eine Investition, Loopy: Heute kostet’s, morgen bringt’s mehr Gäste.', 'That’s an investment, Loopy: it costs today, brings more guests tomorrow.', 'Ez befektetés, Loopy: ma pénzbe kerül, holnap több vendéget hoz.'),
      line('loopy', 'Ich nenn’s: Geld, das Freunde mitbringt.', 'I call it: money that brings friends along.', 'Én úgy hívom: pénz, ami barátokat hoz.'),
    ],
  },
  {
    id: 'challenge',
    when: (s) => s.day >= 6,
    lines: [
      line('schildi', 'Große Neuigkeiten! Der Markt-Preis ist ausgeschrieben.', 'Big news! The Market Prize is on.', 'Nagy hír! Kiírták a Piac-díjat.'),
      line('schildi', `Wer an einem Tag ${MARKET_GOAL} Münzen Gewinn macht, bekommt die goldene Krone. 👑`, `Whoever makes ${MARKET_GOAL} coins profit in one day wins the golden crown. 👑`, `Aki egy nap alatt ${MARKET_GOAL} érme nyereséget csinál, megkapja az aranykoronát. 👑`),
      line('haibert', `Pfff, ${MARKET_GOAL}? Das mach ich vorm Frühstück!`, `Pfff, ${MARKET_GOAL}? I do that before breakfast!`, `Pfff, ${MARKET_GOAL}? Azt reggeli előtt megcsinálom!`),
      line('schildi', 'Aufpassen, Haibert: Gewinn heißt Erlöse minus Kosten. Umsatz allein zählt nicht!', 'Careful, Haibert: profit means revenue minus costs. Sales alone don’t count!', 'Vigyázz, Haibert: a nyereség a bevétel mínusz a költségek. A forgalom egyedül nem számít!'),
      line('loopy', 'Also viel verkaufen und nix verschwenden. Machen wir!', 'So sell lots and waste nothing. Let’s do it!', 'Szóval sokat eladni és semmit sem pazarolni. Csináljuk!'),
    ],
  },
  {
    id: 'crown',
    when: (s) => seen(s, 'challenge') && (s.bestDay || 0) >= MARKET_GOAL,
    reward: { outfit: 'crown' },
    lines: [
      line('schildi', `Loopy! Du hast den Markt-Preis gewonnen – über ${MARKET_GOAL} Münzen Gewinn an einem Tag!`, `Loopy! You won the Market Prize – over ${MARKET_GOAL} coins profit in one day!`, `Loopy! Megnyerted a Piac-díjat – több mint ${MARKET_GOAL} érme nyereség egy nap alatt!`),
      line('haibert', 'Wie bitte?! Ich hatte doch viel mehr Umsatz!', 'Excuse me?! I had way more sales!', 'Tessék?! Nekem sokkal nagyobb volt a forgalmam!'),
      line('schildi', 'Aber auch viel mehr Kosten, Haibert. Drei Neon-Schilder und ein Goldfisch-Orchester …', 'But way more costs too, Haibert. Three neon signs and a goldfish orchestra …', 'De sokkal több költséged is, Haibert. Három neonreklám és egy aranyhal-zenekar …'),
      line('loopy', 'Eine Krone! Ich bin die Bonbon-Königin! 👑', 'A crown! I’m the Sweet Queen! 👑', 'Korona! Én vagyok a Cukorkakirálynő! 👑'),
    ],
  },
  {
    id: 'late',
    when: (s) => s.day >= 9 && seen(s, 'rival'),
    lines: [
      line('haibert', 'Loopy … hast du Bonbons übrig? Mein Lieferant ist seit drei Tagen überfällig!', 'Loopy … got any spare sweets? My supplier is three days overdue!', 'Loopy … van egy kis felesleges cukrod? A szállítóm három napja késik!'),
      line('schildi', 'Das ist ein Lieferverzug, Haibert: Der Termin ist vorbei, die Ware ist nicht da.', 'That’s a late delivery, Haibert: the date has passed and the goods aren’t here.', 'Ez szállítási késedelem, Haibert: lejárt a határidő, és nincs itt az áru.'),
      line('schildi', 'Du kannst auf Lieferung bestehen – oder eine Nachfrist setzen und dann vom Vertrag zurücktreten. Ist er schuld, gibt’s sogar Schadenersatz.', 'You can insist on delivery – or set a grace period and then withdraw from the contract. If it’s his fault, you can even claim damages.', 'Ragaszkodhatsz a szállításhoz – vagy adsz póthatáridőt, és utána elállsz a szerződéstől. Ha ő a hibás, még kártérítést is kérhetsz.'),
      line('haibert', 'Nachfrist … Rücktritt … Ich schreib’s mir auf die Flosse.', 'Grace period … withdraw … I’m writing that on my fin.', 'Póthatáridő … elállás … Felírom az uszonyomra.'),
      line('loopy', 'Und bis dahin: Hier, eine Kiste Drops. Unter Nachbarn!', 'And until then: here, a box of drops. That’s what neighbours do!', 'Addig is: tessék, egy doboz drazsé. Szomszédok vagyunk!'),
    ],
  },
  {
    id: 'friend',
    when: (s) => s.day >= 12 && seen(s, 'late'),
    reward: { coins: 30 },
    lines: [
      line('haibert', 'Loopy, ich muss was zugeben … Deine Gäste kommen immer wieder. Meine nur einmal.', 'Loopy, I have to admit something … your guests keep coming back. Mine only come once.', 'Loopy, be kell vallanom valamit … A te vendégeid mindig visszajönnek. Az enyéim csak egyszer.'),
      line('schildi', 'Das nennt man Kundenbindung: freundlich sein, sich Namen merken, gute Qualität – dann kommen sie gern wieder.', 'That’s called customer loyalty: be kind, remember names, good quality – and they’ll happily come back.', 'Ezt hívják ügyfélhűségnek: kedvesség, nevek megjegyzése, jó minőség – és szívesen visszajönnek.'),
      line('haibert', 'Dein Stand ist einfach … gemütlicher. Freunde? 🦈', 'Your stall is just … cosier. Friends? 🦈', 'A te standod egyszerűen … otthonosabb. Barátok? 🦈'),
      line('loopy', 'Freunde! Schwimm jederzeit auf einen Kakao rüber.', 'Friends! Swim over for a cocoa any time.', 'Barátok! Ússz át bármikor egy kakaóra.'),
    ],
  },
  {
    id: 'proud',
    when: (s) => s.day >= 15 && seen(s, 'friend'),
    reward: { coins: 50 },
    lines: [
      line('schildi', 'Loopy, schau dich um: Gäste, ein Team, Freunde – sogar Haibert grinst. Also … noch mehr als sonst.', 'Loopy, look around: guests, a team, friends – even Haibert is grinning. Well … more than usual.', 'Loopy, nézz körül: vendégek, csapat, barátok – még Haibert is vigyorog. Vagyis … jobban, mint máskor.'),
      line('schildi', 'Ich bin so stolz auf dich. Und nebenbei hast du eine Menge BW gelernt.', 'I’m so proud of you. And along the way you learned loads of business.', 'Nagyon büszke vagyok rád. És közben egy csomó gazdaságtant tanultál.'),
      line('loopy', 'Danke, Oma Schildi! Aber ich hör jetzt sicher nicht auf – morgen wird’s noch besser!', 'Thanks, Granny Shelly! But I’m not stopping now – tomorrow will be even better!', 'Köszönöm, Teknős nagyi! De most nem állok meg – holnap még jobb lesz!'),
    ],
  },
]

const publicBeat = ({ id, lines, reward }) => (reward ? { id, lines, reward } : { id, lines })

// Nächste ungesehene Szene, deren Bedingung erfüllt ist – oder null
export function storyBeat(save) {
  const s = { ...save, day: save.day || 1 }
  const b = STORY.find((x) => !seen(s, x.id) && x.when(s))
  return b ? publicBeat(b) : null
}
export const storyById = (id) => {
  const b = STORY.find((x) => x.id === id)
  return b ? publicBeat(b) : null
}

// Als gesehen markieren und die Belohnung (einmalig) gutschreiben
export function markStory(save, id) {
  if (seen(save, id)) return save
  const beat = STORY.find((x) => x.id === id)
  let next = { ...save, story: { ...save.story, seen: [...(save.story?.seen ?? []), id] } }
  if (beat?.reward?.coins) next.coins = (next.coins || 0) + beat.reward.coins
  if (beat?.reward?.outfit) next = addOutfit(next, beat.reward.outfit)
  return next
}

// =====================================================================
// Freunde: Insel-Codes und Geschenk-Codes (ohne Server, ohne Konto)
// =====================================================================
const B64 = /[A-Za-z0-9_-]/
function toB64url(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4))
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}
const checksum = (body) => (hashStr(body) % 1679616).toString(36).padStart(4, '0') // 4 Zeichen

function seal(prefix, obj) {
  const body = toB64url(JSON.stringify(obj))
  return `${prefix}${body}${checksum(prefix + body)}`
}

// Code aus Text holen: Leerzeichen, Zeilenumbrüche, ganze Links (…?visit=CODE) sind ok
function extract(input, prefix, param) {
  if (typeof input !== 'string') return null
  let s = input.trim()
  const fromParam = s.match(new RegExp(`[?&#]${param}=([^&#\\s]+)`))
  if (fromParam) s = decodeURIComponent(fromParam[1])
  s = s.replace(/\s+/g, '')
  const at = s.indexOf(prefix)
  if (at < 0) return null
  let end = at + prefix.length
  while (end < s.length && B64.test(s[end])) end++
  return s.slice(at, end)
}

function unseal(input, prefix, param) {
  try {
    const code = extract(input, prefix, param)
    if (!code || code.length < prefix.length + 6 || code.length > 6000) return null
    const body = code.slice(prefix.length, -4)
    if (checksum(prefix + body) !== code.slice(-4)) return null
    const obj = JSON.parse(fromB64url(body))
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null
  } catch {
    return null
  }
}

const cleanName = (n) =>
  String(n ?? '')
    .replace(/[\u0000-\u001f<>]/g, '')
    .trim()
    .slice(0, 24)
const int = (v, lo, hi) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : lo)
const idx = (list, id) => list.findIndex((x) => x.id === id)
const r10 = (v) => Math.round((Number(v) || 0) * 10)

export const ISLAND_PREFIX = 'L1'
export const GIFT_PREFIX = 'G1'
export const MAX_SHARED_DECOR = 40

// Deko kompakt: je Stück 7 Zeichen (Art 1 · x 2 · z 2 · Drehung 2, Basis 36, Zehntel; x/z bis ±64,8)
const B36 = (n, w) => Math.max(0, Math.min(36 ** w - 1, n)).toString(36).padStart(w, '0')
const OFF = 648
function packDecor(decor) {
  return (decor ?? [])
    .filter((d) => idx(DECOR, d?.id) >= 0)
    .slice(0, MAX_SHARED_DECOR)
    .map((d) => {
      const rot = ((Number(d.rot) || 0) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
      return B36(idx(DECOR, d.id), 1) + B36(r10(d.x) + OFF, 2) + B36(r10(d.z) + OFF, 2) + B36(Math.round(rot * 10), 2)
    })
    .join('')
}
function unpackDecor(str) {
  if (typeof str !== 'string' || !/^[0-9a-z]*$/.test(str)) return []
  const out = []
  for (let i = 0; i + 7 <= str.length && out.length < MAX_SHARED_DECOR; i += 7) {
    const d = DECOR[parseInt(str[i], 36)]
    if (!d) continue
    const n = (a) => parseInt(str.slice(i + a, i + a + 2), 36)
    out.push({ id: d.id, x: (n(1) - OFF) / 10, z: (n(3) - OFF) / 10, rot: n(5) / 10 })
  }
  return out
}

export function encodeIsland(save) {
  const friendsCount = CAST.filter((c) => (save.friends?.[c.id] || 0) >= FRIEND_GOAL).length
  return seal(ISLAND_PREFIX, {
    n: cleanName(save.name),
    d: int(save.day || 1, 1, 99999),
    o: Math.max(0, idx(OUTFITS, save.outfit)),
    a: AREAS.map((a, i) => (save.areas?.[a.id] ? i : -1)).filter((i) => i >= 0),
    x: packDecor(save.decor),
    s: STAFF.map((s, i) => (save.staff?.[s.id] ? i : -1)).filter((i) => i >= 0),
    f: friendsCount,
    k: stickerCount(save),
  })
}

// → { name, day, outfit, areas: { beach: true }, decor: [{ id, x, z, rot }], staff: ['kai'], friendsCount, stickersCount } oder null
export function decodeIsland(code) {
  const o = unseal(code, ISLAND_PREFIX, 'visit')
  if (!o) return null
  const arr = (v) => (Array.isArray(v) ? v : [])
  const areas = {}
  arr(o.a).forEach((i) => AREAS[i] && (areas[AREAS[i].id] = true))
  return {
    name: cleanName(o.n),
    day: int(o.d, 1, 99999),
    outfit: OUTFITS[o.o]?.id ?? 'none',
    areas,
    decor: unpackDecor(o.x),
    staff: [...new Set(arr(o.s).filter((i) => STAFF[i]).map((i) => STAFF[i].id))],
    friendsCount: int(o.f, 0, CAST.length),
    stickersCount: int(o.k, 0, 999),
  }
}

// Besuchte Insel als (schreibgeschützter) Spielstand fürs Zeichnen der Welt
export function islandAsSave(island, base) {
  const staff = {}
  island.staff.forEach((id) => (staff[id] = { energy: 100 }))
  return { ...base, day: island.day, name: island.name, outfit: island.outfit, areas: { ...island.areas }, decor: island.decor.map((d) => ({ ...d })), staff }
}

export const islandLink = (code, loc = typeof location !== 'undefined' ? location : null) => (loc ? `${loc.origin}${loc.pathname}#/spiel?visit=${code}` : `#/spiel?visit=${code}`)

// ---------- Geschenke ----------
export const GIFT_KINDS = ['coins', 'flowerpot', 'lantern', 'balloons']
export const GIFT_COINS = 25
const GIFT_EMOJI = { coins: '💰', flowerpot: '🪴', lantern: '🏮', balloons: '🎈' }
export const giftEmoji = (kind) => GIFT_EMOJI[kind] ?? '🎁'

const nonce = () => (Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6)).padEnd(10, '0').slice(0, 10)

export function makeGift(fromName, kind) {
  const k = GIFT_KINDS.indexOf(kind)
  return seal(GIFT_PREFIX, { f: cleanName(fromName), k: k < 0 ? 0 : k, n: nonce() })
}

// Geschenk-Code lesen (ohne einzulösen) → { from, kind, nonce } oder null
export function readGift(code) {
  const o = unseal(code, GIFT_PREFIX, 'gift')
  if (!o || !GIFT_KINDS[o.k] || typeof o.n !== 'string' || !/^[a-z0-9]{4,16}$/.test(o.n)) return null
  return { from: cleanName(o.f), kind: GIFT_KINDS[o.k], nonce: o.n }
}

// Ein Geschenk pro Kalendertag verschicken; am selben Tag gibt’s denselben Code noch einmal (again: true).
// Merkt sich den Code, damit man das eigene Geschenk nicht selbst einlösen kann.
export function sendGift(save, kind, now = new Date()) {
  const today = todayKey(now)
  const sent = save.gifts?.sent ?? []
  const last = sent[sent.length - 1]
  if (last?.date === today) return { save, code: last.code, kind: last.kind, again: true }
  const code = makeGift(save.name, kind)
  const g = readGift(code)
  const entry = { date: today, code, kind: g.kind, nonce: g.nonce }
  return { save: { ...save, gifts: { ...save.gifts, redeemed: save.gifts?.redeemed ?? [], sent: [...sent, entry].slice(-10) } }, code, kind: g.kind, again: false }
}

// → { save, gift: { from, kind, coins? } } oder { save, error: 'invalid' | 'used' | 'own' }
export function redeemGift(save, code) {
  const g = readGift(code)
  if (!g) return { save, error: 'invalid' }
  const redeemed = save.gifts?.redeemed ?? []
  if (redeemed.includes(g.nonce)) return { save, error: 'used' }
  if ((save.gifts?.sent ?? []).some((x) => x.nonce === g.nonce)) return { save, error: 'own' }
  let next = { ...save, gifts: { ...save.gifts, redeemed: [...redeemed, g.nonce].slice(-300) } }
  const gift = { from: g.from, kind: g.kind }
  if (g.kind === 'coins') {
    gift.coins = GIFT_COINS
    next.coins = (next.coins || 0) + GIFT_COINS
  } else {
    next.decorOwned = { ...next.decorOwned, [g.kind]: (next.decorOwned?.[g.kind] || 0) + 1 }
  }
  return { save: next, gift }
}
