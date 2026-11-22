// Gemeinsame Spieldaten von Loopy & Co. (ohne Texte – die stehen in strings.js, meta.js und minigames.js).
// Alle Teile des Spiels (Logik, 3D, Oberfläche) lesen die IDs von hier, damit sie zusammenpassen.

// ---------- Kundschaft: Tierarten ----------
// fav: Lieblingssorte (Index in CANDY: 0 Lolli, 1 Drops, 2 Gummi, 3 Schoko)
// voice: Grundton der Plapperstimme in Hz   sea: Meerestier?
export const SPECIES = [
  { id: 'puffer', fav: 1, voice: 520, sea: true, emoji: '🐡' },
  { id: 'cat', fav: 0, voice: 640, sea: false, emoji: '🐱' },
  { id: 'bunny', fav: 2, voice: 760, sea: false, emoji: '🐰' },
  { id: 'frog', fav: 2, voice: 300, sea: false, emoji: '🐸' },
  { id: 'penguin', fav: 1, voice: 430, sea: true, emoji: '🐧' },
  { id: 'duck', fav: 0, voice: 560, sea: false, emoji: '🦆' },
  { id: 'hamster', fav: 3, voice: 880, sea: false, emoji: '🐹' },
  { id: 'otter', fav: 3, voice: 470, sea: true, emoji: '🦦' },
]
export const SPECIES_IDS = SPECIES.map((s) => s.id)
export const speciesById = (id) => SPECIES.find((s) => s.id === id) ?? SPECIES[0]

// Charakter: wirkt auf Geduld, Trinkgeld und wie oft sie etwas fragen
export const PERSONALITIES = {
  cheerful: { patience: 1.0, tip: 1.0, ask: 1.0 },
  shy: { patience: 1.25, tip: 0.8, ask: 0.6 },
  grumpy: { patience: 0.75, tip: 1.6, ask: 1.0 },
  chatty: { patience: 1.1, tip: 1.0, ask: 1.8 },
}
export const PERSONALITY_IDS = Object.keys(PERSONALITIES)

// Stammkundschaft mit Namen: kommt Tag für Tag wieder, merkt sich Loopy (Freundschaft 0–5 Herzen)
export const CAST = [
  { id: 'mila', name: 'Mila', species: 'cat', personality: 'cheerful' },
  { id: 'bruno', name: 'Bruno', species: 'frog', personality: 'grumpy' },
  { id: 'pip', name: 'Pip', species: 'penguin', personality: 'chatty' },
  { id: 'lulu', name: 'Lulu', species: 'bunny', personality: 'shy' },
  { id: 'kiki', name: 'Kiki', species: 'duck', personality: 'chatty' },
  { id: 'nuss', name: 'Nussi', species: 'hamster', personality: 'cheerful' },
  { id: 'perla', name: 'Perla', species: 'puffer', personality: 'shy' },
  { id: 'fritz', name: 'Fritz', species: 'otter', personality: 'grumpy' },
]
export const castById = (id) => CAST.find((c) => c.id === id)
export const MAX_HEARTS = 5

// ---------- Personal (Meerestiere) ----------
// job: carry = Lieferungen vom Steg ins Lager, refill = leere Gläser aus dem Lager nachfüllen,
//      calm = Wartende bleiben geduldiger, cafe = Kakao im Café zubereiten und servieren
// Energie 0–100: sinkt bei jeder Aufgabe, Loopy kann füttern (Snack) – müde arbeiten sie langsamer, bei 0 schlafen sie.
export const STAFF = [
  { id: 'kai', species: 'crab', cost: 120, wage: 12, job: 'carry', emoji: '🦀' },
  { id: 'luma', species: 'jelly', cost: 150, wage: 10, job: 'calm', emoji: '🪼' },
  { id: 'otto', species: 'octopus', cost: 200, wage: 14, job: 'refill', emoji: '🐙' },
  { id: 'momo', species: 'seal', cost: 220, wage: 14, job: 'cafe', needs: 'cafe', emoji: '🦭' },
]
export const staffById = (id) => STAFF.find((s) => s.id === id)
export const SNACK_COST = 3 // Münzen für einen Snack
export const SNACK_ENERGY = 50

// ---------- Neue Inselteile ----------
export const AREAS = [
  { id: 'beach', cost: 150, emoji: '🏖️' }, // Strand: Personal erholt sich, Kundschaft entspannter
  { id: 'cafe', cost: 250, emoji: '☕' }, // Café: Kakao an Tischen servieren
  { id: 'aquarium', cost: 400, emoji: '🐠' }, // Aquarium: Führungen mit Mini-Spiel, lockt Stars an
]

// ---------- Feste Verbesserungen ----------
export const UPGRADES = [
  { id: 'jars', cost: 60, emoji: '🫙' },
  { id: 'shoes', cost: 80, emoji: '👟' },
  { id: 'bench', cost: 100, emoji: '⛱️' },
  { id: 'choco', cost: 150, emoji: '🍫' },
]

// ---------- Deko zum frei Hinstellen ----------
// cozy: Gemütlichkeit – jede Deko macht die Kundschaft etwas geduldiger (insgesamt höchstens +30 %)
// season: nur in dieser Zeit im Laden erhältlich (gekaufte bleiben)
export const DECOR = [
  { id: 'flowerpot', cost: 15, cozy: 1, emoji: '🪴' },
  { id: 'lantern', cost: 25, cozy: 2, emoji: '🏮' },
  { id: 'shellLamp', cost: 35, cozy: 2, emoji: '🐚' },
  { id: 'parasol', cost: 40, cozy: 2, emoji: '⛱️' },
  { id: 'benchDeco', cost: 45, cozy: 3, emoji: '🪑' },
  { id: 'balloons', cost: 50, cozy: 3, emoji: '🎈' },
  { id: 'flamingo', cost: 60, cozy: 3, emoji: '🦩' },
  { id: 'fountain', cost: 120, cozy: 6, emoji: '⛲' },
  { id: 'xmasTree', cost: 60, cozy: 4, emoji: '🎄', season: 'xmas' },
  { id: 'snowman', cost: 30, cozy: 2, emoji: '⛄', season: 'winter' },
  { id: 'pumpkin', cost: 25, cozy: 2, emoji: '🎃', season: 'halloween' },
  { id: 'eggs', cost: 25, cozy: 2, emoji: '🥚', season: 'easter' },
]
export const decorById = (id) => DECOR.find((d) => d.id === id)
export const COZY_MAX = 0.3

// ---------- Outfits für Loopy ----------
// unlock: 'coins' (im Kleiderschrank kaufen) · 'daily' (Geschenk jeden 7. Tag in Folge) · 'album' (Stickeralbum) · 'season'
export const OUTFITS = [
  { id: 'none', cost: 0, unlock: 'free', emoji: '🙂' },
  { id: 'bow', cost: 40, unlock: 'coins', emoji: '🎀' },
  { id: 'straw', cost: 60, unlock: 'coins', emoji: '👒' },
  { id: 'beanie', cost: 60, unlock: 'coins', emoji: '🧢' },
  { id: 'shades', cost: 80, unlock: 'coins', emoji: '🕶️' },
  { id: 'flowers', cost: 90, unlock: 'coins', emoji: '🌸' },
  { id: 'headphones', cost: 110, unlock: 'coins', emoji: '🎧' },
  { id: 'chef', cost: 140, unlock: 'coins', emoji: '👨‍🍳' },
  { id: 'pirate', cost: 0, unlock: 'daily', emoji: '🏴‍☠️' },
  { id: 'party', cost: 0, unlock: 'album', emoji: '🥳' },
  { id: 'crown', cost: 0, unlock: 'story', emoji: '👑' },
  { id: 'santa', cost: 0, unlock: 'season', season: 'xmas', emoji: '🎅' },
]
export const outfitById = (id) => OUTFITS.find((o) => o.id === id) ?? OUTFITS[0]

// ---------- Zufällige Ereignisse ----------
// storm: Regen, weniger Kundschaft, danach Regenbogen mit Ansturm · inspector: Otter vom Finanzamt stellt eine Frage
// star: berühmter Gast zahlt ×5 · rival: Haibert macht Werbung, alle sind ungeduldiger · late: Lieferverzug-Brief
export const EVENTS = ['storm', 'inspector', 'star', 'rival', 'late']

// ---------- Jahreszeit und Feiertage (nach echtem Datum) ----------
export function seasonOf(date = new Date()) {
  const m = date.getMonth() // 0 = Jänner
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

export function holidayOf(date = new Date()) {
  const m = date.getMonth()
  const d = date.getDate()
  if (m === 11 || (m === 10 && d >= 20)) return 'xmas' // ab 20. November Weihnachtsstimmung
  if ((m === 9 && d >= 15) || (m === 10 && d <= 2)) return 'halloween'
  if ((m === 2 && d >= 20) || (m === 3 && d <= 25)) return 'easter'
  return null
}

// ---------- Spielstand (Version 3) ----------
export const SAVE_VERSION = 3
export function freshSave() {
  return {
    v: SAVE_VERSION,
    day: 1,
    coins: 30,
    upgrades: {}, // { jars: true, … }
    jars: null,
    store: null,
    focus: null,
    audio: { music: true, sfx: true },
    seenHowTo: false,
    staff: {}, // { kai: { energy: 100 } } – eingestellt, wenn vorhanden
    areas: {}, // { beach: true }
    decorOwned: {}, // { lantern: 2 } – gekauft, noch nicht aufgestellt
    decor: [], // [{ id, x, z, rot }] – auf der Insel aufgestellt
    outfit: 'none',
    wardrobe: ['none'],
    friends: {}, // { mila: 2 } – Herzen je Stammkundin
    met: {}, // { cat: true } – schon gesehene Tierarten
    topics: {}, // { topicId: Anzahl richtiger Antworten im Spiel }
    eventsSeen: {}, // { storm: true }
    stickers: {}, // { stickerId: true } – schon eingeklebt (für „Neu“-Hinweis)
    missions: null, // { date, list: [{ id, kind, target, progress, reward, claimed }] }
    daily: { last: null, streak: 0 },
    story: { seen: [] },
    skill: { acc: 0.75, svc: 0.85 }, // gleitender Schnitt: Antworten richtig / Kundschaft bedient
    gifts: { redeemed: [] },
    bestDay: 0, // höchster Tagesgewinn
    name: '', // Name der Insel (für Freunde)
  }
}
