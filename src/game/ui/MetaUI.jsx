import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../../components/Button.jsx'
import Sheet from '../../components/Sheet.jsx'
import { CheckIcon } from '../../components/Icons.jsx'
import { SPRING } from '../../motion.js'
import { AREAS, DECOR, OUTFITS, STAFF, UPGRADES, holidayOf, seasonOf } from '../data.js'
import {
  ALBUM_GOAL,
  AREA_TEXT,
  DECOR_NAME,
  GIFT_COINS,
  GIFT_KINDS,
  JOB_TEXT,
  OUTFIT_NAME,
  SPEAKERS,
  STAFF_TEXT,
  STICKER_GROUPS,
  UPGRADE_TEXT,
  decodeIsland,
  encodeIsland,
  giftEmoji,
  islandLink,
  makeGift,
  missionLabel,
  stickerGroupTitle,
} from '../meta.js'

// Oberfläche der „Weiterspielen“-Schicht: Tagesgeschenk, Aufgaben, Album, Kleiderschrank, Insel, Freunde,
// Geschichte und Besuchs-Banner. Alles über Props gesteuert, Texte in de/en/hu bringen die Teile selbst mit.

const TEXT = {
  de: {
    done: 'Fertig',
    coins: 'Münzen',
    giftTitle: 'Dein Tagesgeschenk!',
    giftTap: 'Tipp aufs Packerl!',
    giftStreak: '{n} Tage in Folge',
    giftStreak1: 'Tag 1 – komm morgen wieder!',
    giftTomorrow: 'Morgen gibt’s mehr. Bleib dran!',
    giftBonus: '+{n} Bonus – den Hut hast du schon',
    giftOutfit: 'Neu im Kleiderschrank',
    yay: 'Juhu!',
    missions: 'Heutige Aufgaben',
    missionsNew: 'Neue um Mitternacht',
    claim: 'Abholen',
    claimed: 'Erledigt',
    album: 'Stickeralbum',
    albumGot: '{n} von {total} Stickern',
    albumGoal: 'Noch {n} bis zum Partyhut 🥳',
    albumGoalDone: 'Partyhut freigeschaltet 🥳',
    new: 'Neu',
    wardrobe: 'Kleiderschrank',
    wear: 'Anziehen',
    wearing: 'Trägt sie',
    free: 'Gratis!',
    lockDaily: 'Tagesgeschenk Tag 7',
    lockAlbum: 'Album: {n} Sticker',
    lockStory: 'Markt-Preis gewinnen',
    lockSeason: 'Nur zur Weihnachtszeit',
    island: 'Insel ausbauen',
    areas: 'Neue Inselteile',
    staff: 'Team',
    upgrades: 'Verbesserungen',
    decor: 'Deko',
    owned: 'Gehört dir',
    hired: 'Im Team',
    wage: 'Lohn {n} pro Tag',
    energy: 'Energie',
    needsCafe: 'Braucht Café',
    cozy: 'Gemütlich +{n}',
    inStock: '{n} zum Aufstellen',
    onlyNow: 'Nur jetzt',
    place: 'Deko auf der Insel aufstellen ({n})',
    friends: 'Freunde',
    friendsHint: 'Ganz ohne Konto: Codes einfach kopieren und per Chat schicken.',
    myIsland: 'Meine Insel',
    islandName: 'Name deiner Insel',
    islandNamePh: 'z. B. Loopys Zuckerinsel',
    myCode: 'Mein Insel-Code',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    copyFail: 'Markiert – jetzt kopieren',
    share: 'Teilen',
    shareText: 'Besuch meine Insel bei Loopy & Co.! 🍬',
    visit: 'Freund:in besuchen',
    visitPh: 'Insel-Code',
    visitGo: 'Hinschwimmen',
    visitBad: 'Der Code passt nicht. Ganz kopiert?',
    redeem: 'Geschenk einlösen',
    redeemPh: 'Geschenk-Code',
    redeemGo: 'Einlösen',
    r_invalid: 'Der Code passt nicht. Tippfehler?',
    r_used: 'Den hast du schon eingelöst.',
    r_own: 'Das ist dein eigenes Geschenk 😉',
    r_coins: '🎉 {n} Münzen von {from}!',
    r_decor: '🎉 {item} von {from} – liegt bei deiner Deko.',
    someone: 'jemandem',
    makeGift: 'Geschenk für Freund:innen',
    makeGiftHint: 'Eins pro Tag. Wer den Code einlöst, bekommt es.',
    pack: 'Einpacken',
    packed: 'Fertig verpackt! Schick diesen Code:',
    packedAgain: 'Heute hast du schon eins verpackt – hier ist es noch einmal:',
    giftShare: 'Ein Geschenk für dich bei Loopy & Co.! 🎁',
    k_coins: '{n} Münzen',
    tapNext: 'Tippen',
    reward: 'Belohnung',
    visiting: 'Zu Besuch bei',
    unnamed: 'Namenlose Insel',
    visitMeta: 'Tag {d} · {s} Sticker',
    home: 'Heim',
    sendGift: 'Geschenk',
  },
  en: {
    done: 'Done',
    coins: 'coins',
    giftTitle: 'Your daily gift!',
    giftTap: 'Tap the present!',
    giftStreak: '{n} days in a row',
    giftStreak1: 'Day 1 – come back tomorrow!',
    giftTomorrow: 'More tomorrow. Keep it up!',
    giftBonus: '+{n} bonus – you already have the hat',
    giftOutfit: 'New in your wardrobe',
    yay: 'Yay!',
    missions: 'Today’s tasks',
    missionsNew: 'New ones at midnight',
    claim: 'Collect',
    claimed: 'Done',
    album: 'Sticker album',
    albumGot: '{n} of {total} stickers',
    albumGoal: '{n} more for the party hat 🥳',
    albumGoalDone: 'Party hat unlocked 🥳',
    new: 'New',
    wardrobe: 'Wardrobe',
    wear: 'Wear',
    wearing: 'Wearing',
    free: 'Free!',
    lockDaily: 'Daily gift day 7',
    lockAlbum: 'Album: {n} stickers',
    lockStory: 'Win the Market Prize',
    lockSeason: 'Only at Christmas time',
    island: 'Build your island',
    areas: 'New island parts',
    staff: 'Team',
    upgrades: 'Upgrades',
    decor: 'Decor',
    owned: 'Owned',
    hired: 'On the team',
    wage: 'Wage {n} per day',
    energy: 'Energy',
    needsCafe: 'Needs café',
    cozy: 'Cosy +{n}',
    inStock: '{n} to place',
    onlyNow: 'Only now',
    place: 'Place decor on the island ({n})',
    friends: 'Friends',
    friendsHint: 'No account needed: just copy codes and send them in a chat.',
    myIsland: 'My island',
    islandName: 'Your island’s name',
    islandNamePh: 'e.g. Loopy’s Sugar Isle',
    myCode: 'My island code',
    copy: 'Copy',
    copied: 'Copied!',
    copyFail: 'Selected – copy it now',
    share: 'Share',
    shareText: 'Visit my island in Loopy & Co.! 🍬',
    visit: 'Visit a friend',
    visitPh: 'Island code',
    visitGo: 'Swim over',
    visitBad: 'That code doesn’t work. Copied all of it?',
    redeem: 'Redeem a gift',
    redeemPh: 'Gift code',
    redeemGo: 'Redeem',
    r_invalid: 'That code doesn’t work. Typo?',
    r_used: 'You already redeemed that one.',
    r_own: 'That’s your own gift 😉',
    r_coins: '🎉 {n} coins from {from}!',
    r_decor: '🎉 {item} from {from} – it’s with your decor.',
    someone: 'someone',
    makeGift: 'A gift for a friend',
    makeGiftHint: 'One per day. Whoever redeems the code gets it.',
    pack: 'Wrap it',
    packed: 'All wrapped! Send this code:',
    packedAgain: 'You already wrapped one today – here it is again:',
    giftShare: 'A gift for you in Loopy & Co.! 🎁',
    k_coins: '{n} coins',
    tapNext: 'Tap',
    reward: 'Reward',
    visiting: 'Visiting',
    unnamed: 'Unnamed island',
    visitMeta: 'Day {d} · {s} stickers',
    home: 'Home',
    sendGift: 'Gift',
  },
  hu: {
    done: 'Kész',
    coins: 'érme',
    giftTitle: 'A napi ajándékod!',
    giftTap: 'Koppints a csomagra!',
    giftStreak: '{n} nap egymás után',
    giftStreak1: '1. nap – gyere vissza holnap!',
    giftTomorrow: 'Holnap még több jár. Csak így tovább!',
    giftBonus: '+{n} bónusz – a kalapod már megvan',
    giftOutfit: 'Új a ruhatárban',
    yay: 'Juhú!',
    missions: 'Mai feladatok',
    missionsNew: 'Éjfélkor jönnek az újak',
    claim: 'Átveszem',
    claimed: 'Kész',
    album: 'Matricaalbum',
    albumGot: '{n} / {total} matrica',
    albumGoal: 'Még {n} a bulisapkáig 🥳',
    albumGoalDone: 'Bulisapka feloldva 🥳',
    new: 'Új',
    wardrobe: 'Ruhatár',
    wear: 'Felveszem',
    wearing: 'Rajta van',
    free: 'Ingyen!',
    lockDaily: 'Napi ajándék 7. nap',
    lockAlbum: 'Album: {n} matrica',
    lockStory: 'Nyerd meg a Piac-díjat',
    lockSeason: 'Csak karácsonykor',
    island: 'Sziget bővítése',
    areas: 'Új szigetrészek',
    staff: 'Csapat',
    upgrades: 'Fejlesztések',
    decor: 'Dekor',
    owned: 'A tiéd',
    hired: 'A csapatban',
    wage: 'Bér: {n} naponta',
    energy: 'Energia',
    needsCafe: 'Kávézó kell',
    cozy: 'Hangulat +{n}',
    inStock: '{n} kirakható',
    onlyNow: 'Csak most',
    place: 'Dekor kirakása a szigetre ({n})',
    friends: 'Barátok',
    friendsHint: 'Fiók nélkül: csak másold ki a kódot, és küldd el chaten.',
    myIsland: 'Az én szigetem',
    islandName: 'A szigeted neve',
    islandNamePh: 'pl. Loopy Cukorszigete',
    myCode: 'A szigetkódom',
    copy: 'Másolás',
    copied: 'Kimásolva!',
    copyFail: 'Kijelölve – most másold',
    share: 'Megosztás',
    shareText: 'Látogasd meg a szigetemet a Loopy & Co.-ban! 🍬',
    visit: 'Barát meglátogatása',
    visitPh: 'Szigetkód',
    visitGo: 'Átúszom',
    visitBad: 'Ez a kód nem jó. Az egészet kimásoltad?',
    redeem: 'Ajándék beváltása',
    redeemPh: 'Ajándékkód',
    redeemGo: 'Beváltom',
    r_invalid: 'Ez a kód nem jó. Elírás?',
    r_used: 'Ezt már beváltottad.',
    r_own: 'Ez a saját ajándékod 😉',
    r_coins: '🎉 {n} érme tőle: {from}!',
    r_decor: '🎉 {item} tőle: {from} – a dekorjaid között van.',
    someone: 'valaki',
    makeGift: 'Ajándék egy barátnak',
    makeGiftHint: 'Naponta egy. Aki beváltja a kódot, megkapja.',
    pack: 'Becsomagolom',
    packed: 'Becsomagolva! Küldd el ezt a kódot:',
    packedAgain: 'Ma már csomagoltál egyet – itt van újra:',
    giftShare: 'Ajándék neked a Loopy & Co.-ban! 🎁',
    k_coins: '{n} érme',
    tapNext: 'Koppints',
    reward: 'Jutalom',
    visiting: 'Vendégségben itt:',
    unnamed: 'Névtelen sziget',
    visitMeta: '{d}. nap · {s} matrica',
    home: 'Haza',
    sendGift: 'Ajándék',
  },
}

function useT(lang) {
  return useMemo(() => {
    const table = TEXT[lang] ?? TEXT.de
    return (key, vars = {}) => (table[key] ?? TEXT.de[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`))
  }, [lang])
}
const L = (obj, lang) => obj?.[lang] ?? obj?.de ?? ''

// ---------- kleine Bausteine ----------
const H = 'px-1 text-[13px] font-semibold uppercase tracking-wide text-label2'
const ROW = 'flex items-center gap-3 rounded-2xl bg-surface p-3.5'
const TILE = 'flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-bg text-[26px]'

function DoneAction({ t, onClose }) {
  return (
    <button onClick={onClose} className="px-2 py-2 text-[17px] font-semibold text-accent-text">
      {t('done')}
    </button>
  )
}

function CoinPill({ t, coins }) {
  return (
    <div className="mb-3 flex justify-center">
      <div className="game-float flex items-center gap-1.5 rounded-full bg-surface px-3.5 py-2 text-[15px] font-semibold tabular-nums">
        <span className="game-coin" />
        {coins} {t('coins')}
      </div>
    </div>
  )
}

function PriceButton({ cost, can, onClick }) {
  return (
    <button disabled={!can} onClick={onClick} className={`flex min-h-[40px] flex-none items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] font-semibold tabular-nums ${can ? 'bg-accent text-white active:opacity-80' : 'bg-fill/20 text-label3'}`}>
      <span className="game-coin !h-4 !w-4" />
      {cost}
    </button>
  )
}

function OwnedMark({ children }) {
  return (
    <span className="flex flex-none items-center gap-1 text-[14px] font-semibold text-success">
      <CheckIcon className="h-4 w-4" strokeWidth={3} />
      {children}
    </span>
  )
}

function Bar({ value, tone = 'bg-accent', className = '' }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-fill/15 ${className}`}>
      <motion.div className={`h-full rounded-full ${tone}`} initial={false} animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} transition={SPRING} />
    </div>
  )
}

async function copyText(text, el) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      el?.focus()
      el?.select()
      return document.execCommand('copy')
    } catch {
      return false
    }
  }
}

// ---------- Porträts ----------
export function Portrait({ who, outfit, size = 64 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
        {who === 'schildi' ? <Schildi /> : who === 'haibert' ? <Haibert /> : <LoopyFace />}
      </svg>
      {outfit && outfit !== 'none' && (
        <span className="absolute left-1/2 -translate-x-1/2 leading-none" style={{ fontSize: size * 0.42, top: size * 0.02 }}>
          {OUTFITS.find((o) => o.id === outfit)?.emoji}
        </span>
      )}
    </div>
  )
}

function Eye({ x, y, r = 3.6 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#1D2B45" />
      <circle cx={x - r * 0.35} cy={y - r * 0.4} r={r * 0.38} fill="#fff" />
    </g>
  )
}

function LoopyFace() {
  const gills = [
    [-1, 15, 30, 4, 22],
    [-1, 12, 37, 2, 34],
    [-1, 13, 44, 4, 47],
  ]
  return (
    <g>
      <circle cx="32" cy="32" r="32" fill="#DCEEFF" />
      {gills.flatMap(([, x1, y1, x2, y2], i) =>
        [-1, 1].map((side) => {
          const ax = side < 0 ? x1 : 64 - x1
          const bx = side < 0 ? x2 + 2 : 62 - x2
          return (
            <g key={`${i}${side}`}>
              <path d={`M${ax} ${y1} Q${(ax + bx) / 2} ${y1 - 7} ${bx} ${y2}`} stroke="#2F7FD6" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              <circle cx={bx} cy={y2} r="4.2" fill="#72B8FA" />
            </g>
          )
        }),
      )}
      <ellipse cx="32" cy="41" rx="21" ry="18" fill="#A5D5FF" />
      <ellipse cx="32" cy="50" rx="13" ry="7" fill="#BFE1FF" />
      <Eye x={23.5} y={38} />
      <Eye x={40.5} y={38} />
      <ellipse cx="17.5" cy="45" rx="4" ry="2.4" fill="#FF8FA3" opacity="0.8" />
      <ellipse cx="46.5" cy="45" rx="4" ry="2.4" fill="#FF8FA3" opacity="0.8" />
      <path d="M27.5 45.5 Q32 49.5 36.5 45.5" stroke="#1D2B45" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Schildi() {
  return (
    <g>
      <circle cx="32" cy="32" r="32" fill="#E3F6E8" />
      {/* Panzer */}
      <ellipse cx="32" cy="64" rx="28" ry="14" fill="#6FAF5C" />
      <path d="M12 60 L22 54 L32 57 L42 54 L52 60 M22 54 L23 64 M42 54 L41 64 M32 57 L32 64" stroke="#4C8A3D" strokeWidth="2" fill="none" strokeLinejoin="round" />
      {/* Kopf */}
      <ellipse cx="32" cy="33" rx="20.5" ry="19" fill="#9FD98B" />
      <ellipse cx="32" cy="42" rx="12" ry="7" fill="#B9E6A8" />
      {/* Kopftuch mit Blume */}
      <path d="M11.5 30 Q32 2 52.5 30 Q32 19 11.5 30 Z" fill="#FF9EB5" />
      {[0, 72, 144, 216, 288].map((a) => (
        <circle key={a} cx={46 + 4.4 * Math.cos((a * Math.PI) / 180)} cy={15 + 4.4 * Math.sin((a * Math.PI) / 180)} r="2.8" fill="#fff" />
      ))}
      <circle cx="46" cy="15" r="2.4" fill="#FFB13D" />
      {/* Brille */}
      <Eye x={24} y={34} r={3.3} />
      <Eye x={40} y={34} r={3.3} />
      <circle cx="24" cy="34" r="6.4" fill="#fff" fillOpacity="0.25" stroke="#8A5A2B" strokeWidth="2" />
      <circle cx="40" cy="34" r="6.4" fill="#fff" fillOpacity="0.25" stroke="#8A5A2B" strokeWidth="2" />
      <path d="M30.4 33.5 Q32 32 33.6 33.5" stroke="#8A5A2B" strokeWidth="2" fill="none" />
      <ellipse cx="16" cy="43" rx="3.4" ry="2" fill="#FF8FA3" opacity="0.65" />
      <ellipse cx="48" cy="43" rx="3.4" ry="2" fill="#FF8FA3" opacity="0.65" />
      <path d="M27 43.5 Q32 47.5 37 43.5" stroke="#2D5A22" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Haibert() {
  return (
    <g>
      <circle cx="32" cy="32" r="32" fill="#E1ECF7" />
      {/* Rückenflosse */}
      <path d="M23 24 Q29 1 45 7 Q38 13 41 24 Z" fill="#5E84AB" />
      <ellipse cx="32" cy="38" rx="25" ry="21" fill="#7FA3C8" />
      <path d="M10 44 Q32 66 54 44 Q32 52 10 44 Z" fill="#EAF2FA" />
      {/* Kiemenstriche */}
      <path d="M50 33 l3 -2 M51 37 l3 -1.5 M51 41 l3 -1" stroke="#5E84AB" strokeWidth="1.6" strokeLinecap="round" />
      {/* freche Augenbraue */}
      <path d="M18 27 Q23 23 28 26" stroke="#3D5D80" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M36 28 Q41 27 45 29" stroke="#3D5D80" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Eye x={23} y={33} r={3.2} />
      <Eye x={41} y={34} r={3.2} />
      {/* breites Grinsen mit Zähnchen */}
      <path d="M17 42 Q32 54 47 42 Q32 47 17 42 Z" fill="#3D5D80" />
      <path d="M19 43 L21.5 46.5 L24 44.3 L26.5 47.5 L29 45 L31.5 48 L34 45 L36.5 47.5 L39 44.3 L41.5 46.5 L45 43 Q32 47 19 43 Z" fill="#fff" />
      <ellipse cx="15" cy="40" rx="3" ry="1.8" fill="#FF8FA3" opacity="0.55" />
    </g>
  )
}

const SPEAKER_TONE = { schildi: '#2FA882', haibert: '#4F78A3', loopy: '#2F7FD6' }

// =====================================================================
// Tagesgeschenk
// =====================================================================
export function DailyGiftCard({ lang, gift, streak, onClose }) {
  const t = useT(lang)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 1100)
    return () => clearTimeout(id)
  }, [])
  if (!gift) return null
  const n = streak ?? gift.streak ?? 1
  const inWeek = ((n - 1) % 7) + 1
  const total = gift.coins + (gift.bonus || 0)
  const outfit = gift.outfit && OUTFITS.find((o) => o.id === gift.outfit)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-5" role="dialog" aria-modal="true" aria-label={t('giftTitle')}>
      <motion.div initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} transition={SPRING} className="game-float relative w-full max-w-sm overflow-hidden rounded-[28px] bg-surface px-5 pb-5 pt-6 text-center">
        <p className="text-[22px] font-extrabold">{t('giftTitle')}</p>
        <button onClick={() => setOpen(true)} className="relative mx-auto mt-1 block h-[150px] w-[180px]" aria-label={t('giftTap')}>
          <Confetti show={open} />
          <motion.svg viewBox="0 0 120 110" className="absolute inset-x-0 bottom-0 mx-auto h-[120px] w-[132px]" animate={open ? { scale: [1, 0.92, 1.04, 1] } : { rotate: [0, -4, 4, -3, 0] }} transition={open ? { duration: 0.45 } : { duration: 0.7, repeat: Infinity, repeatDelay: 0.5 }}>
            <rect x="18" y="50" width="84" height="56" rx="8" fill="#FF84A6" />
            <rect x="53" y="50" width="14" height="56" fill="#FFD45E" />
            <rect x="18" y="50" width="84" height="8" fill="#000" opacity="0.06" />
            <motion.g animate={open ? { y: -46, x: 8, rotate: 18, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }} transition={{ ...SPRING, opacity: { delay: 0.35, duration: 0.3 } }} style={{ transformOrigin: '60px 46px' }}>
              <rect x="12" y="36" width="96" height="18" rx="7" fill="#FF6E93" />
              <rect x="53" y="36" width="14" height="18" fill="#FFC531" />
              <path d="M60 36 C46 18 34 26 44 34 Z M60 36 C74 18 86 26 76 34 Z" fill="#FFD45E" stroke="#FFC531" strokeWidth="2" strokeLinejoin="round" />
            </motion.g>
          </motion.svg>
          <AnimatePresence>
            {open && (
              <motion.div initial={{ y: 50, scale: 0.4, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ ...SPRING, delay: 0.15 }} className="absolute inset-x-0 top-6 flex flex-col items-center">
                {outfit ? <span className="text-[54px] leading-none">{outfit.emoji}</span> : <BigCoin />}
              </motion.div>
            )}
          </AnimatePresence>
        </button>
        {!open ? (
          <p className="h-[132px] pt-2 text-[15px] font-semibold text-label2">{t('giftTap')}</p>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.25 }}>
            <p className="flex items-center justify-center gap-2 text-[34px] font-extrabold tabular-nums text-[#E8A600]">
              +{total}
              <span className="game-coin !h-7 !w-7" />
            </p>
            {gift.bonus > 0 && <p className="text-[13px] font-semibold text-label2">{t('giftBonus', { n: gift.bonus })}</p>}
            {outfit && (
              <p className="mx-auto mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FF84A6]/15 px-3 py-1 text-[14px] font-semibold text-[#D6336C]">
                {outfit.emoji} {t('giftOutfit')}: {L(OUTFIT_NAME[outfit.id], lang)}
              </p>
            )}
            <div className="mt-3 flex justify-center gap-1.5">
              {Array.from({ length: 7 }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...SPRING, delay: 0.35 + i * 0.05 }}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-[18px] ${i < inWeek ? 'bg-[#FFB13D]/20' : 'bg-fill/10'} ${i === inWeek - 1 ? 'ring-2 ring-[#FFB13D]' : ''}`}
                >
                  <span className={i < inWeek ? '' : 'opacity-30 grayscale'}>{i === 6 ? '🏴‍☠️' : '🔥'}</span>
                </motion.div>
              ))}
            </div>
            <p className="mt-2 text-[14px] font-semibold text-label2">{n > 1 ? `${t('giftStreak', { n })} · ${t('giftTomorrow')}` : t('giftStreak1')}</p>
          </motion.div>
        )}
        <Button onClick={onClose} disabled={!open} className="mt-4 w-full">
          {t('yay')}
        </Button>
      </motion.div>
    </motion.div>
  )
}

function BigCoin() {
  return (
    <svg viewBox="0 0 40 40" className="h-14 w-14">
      <circle cx="20" cy="20" r="18" fill="#FFD45E" stroke="#E8B63A" strokeWidth="4" />
      <circle cx="20" cy="20" r="11" fill="none" stroke="#F2C24A" strokeWidth="2" />
      <path d="M20 13.5l2 4.2 4.6.6-3.4 3.2.9 4.5-4.1-2.3-4.1 2.3.9-4.5-3.4-3.2 4.6-.6z" fill="#E8A600" />
      <ellipse cx="13.5" cy="12" rx="3" ry="1.8" fill="#fff" opacity="0.6" transform="rotate(-35 13.5 12)" />
    </svg>
  )
}

const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2 + 0.3
  return { x: Math.cos(a) * (60 + (i % 3) * 14), y: Math.sin(a) * (44 + (i % 4) * 9) - 18, c: ['#FF84A6', '#FFD45E', '#72B8FA', '#3FBF98', '#B48CFF'][i % 5], r: i % 2 ? 4 : 3 }
})
function Confetti({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute left-1/2 top-[58%]">
          {CONFETTI.map((p, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full"
              style={{ width: p.r * 2, height: p.r * 2, background: p.c, marginLeft: -p.r, marginTop: -p.r }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
              animate={{ x: p.x, y: p.y, opacity: [1, 1, 0], scale: 1 }}
              transition={{ duration: 1.1, ease: 'easeOut', delay: 0.1 }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// =====================================================================
// Tagesaufgaben
// =====================================================================
export function MissionsCard({ lang, missions, onClaim }) {
  const t = useT(lang)
  const list = (Array.isArray(missions) ? missions : missions?.list) ?? []
  if (!list.length) return null
  const done = list.filter((m) => m.claimed).length
  return (
    <div className="game-float rounded-[22px] bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2 px-0.5">
        <p className="text-[17px] font-bold">{t('missions')}</p>
        <p className="text-[12px] font-semibold text-label2">
          {done}/{list.length} · {t('missionsNew')}
        </p>
      </div>
      <ul className="mt-2.5 space-y-2">
        {list.map((m) => {
          const { text, emoji } = missionLabel(m, lang)
          const ready = m.progress >= m.target && !m.claimed
          return (
            <li key={m.id} className={`flex items-center gap-3 rounded-2xl bg-bg px-3 py-2.5 transition-opacity ${m.claimed ? 'opacity-60' : ''}`}>
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-surface text-[21px]" aria-hidden>
                {emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] font-semibold leading-tight ${m.claimed ? 'line-through decoration-label3' : ''}`}>{text}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Bar value={m.progress / m.target} tone={m.progress >= m.target ? 'bg-success' : 'bg-accent'} className="flex-1" />
                  <span className="text-[12px] font-semibold tabular-nums text-label2">
                    {Math.min(m.progress, m.target)}/{m.target}
                  </span>
                </div>
              </div>
              {m.claimed ? (
                <OwnedMark>{t('claimed')}</OwnedMark>
              ) : ready ? (
                <motion.button
                  onClick={() => onClaim?.(m.id)}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  whileTap={{ scale: 0.9 }}
                  className="flex min-h-[40px] flex-none items-center gap-1.5 rounded-full bg-[#FFB13D] px-3 text-[14px] font-bold text-white"
                >
                  +{m.reward}
                  <span className="game-coin !h-4 !w-4" />
                </motion.button>
              ) : (
                <span className="flex flex-none items-center gap-1 rounded-full bg-fill/10 px-2.5 py-1.5 text-[13px] font-semibold tabular-nums text-label2">
                  +{m.reward}
                  <span className="game-coin !h-3.5 !w-3.5" />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// =====================================================================
// Stickeralbum
// =====================================================================
const GROUP_TONE = {
  species: ['#FFE3EC', '#FFC2D4'],
  friends: ['#FFF1C9', '#FFD98A'],
  topics: ['#DDEEFF', '#B5D7FF'],
  staff: ['#D9F5EC', '#A9E6D2'],
  areas: ['#E8F7D9', '#C3E9A0'],
  events: ['#EFE5FF', '#D3C0FF'],
  seasons: ['#FFE9DA', '#FFC9A3'],
}
const SURPRISE = new Set(['species', 'events', 'seasons'])
const tilt = (id) => {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return ((Math.abs(h) % 9) - 4) * 1.1
}

export function AlbumSheet({ open, onClose, lang, stickers = [], fresh = [] }) {
  const t = useT(lang)
  const got = stickers.filter((s) => s.got).length
  const isNew = new Set(fresh.map((x) => (typeof x === 'string' ? x : x.id)))
  return (
    <Sheet open={open} onClose={onClose} title={t('album')} action={<DoneAction t={t} onClose={onClose} />}>
      <div className="px-4 pb-2">
        <div className="rounded-2xl bg-surface p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[17px] font-bold">{t('albumGot', { n: got, total: stickers.length })}</p>
            <p className="text-[13px] font-semibold tabular-nums text-label2">{stickers.length ? Math.round((got / stickers.length) * 100) : 0} %</p>
          </div>
          <Bar value={stickers.length ? got / stickers.length : 0} tone="bg-[#FF84A6]" className="mt-2 !h-2.5" />
          <p className="mt-2 text-[13px] font-semibold text-label2">{got >= ALBUM_GOAL ? t('albumGoalDone') : t('albumGoal', { n: ALBUM_GOAL - got })}</p>
        </div>
        {STICKER_GROUPS.map((g) => {
          const list = stickers.filter((s) => s.group === g)
          if (!list.length) return null
          const [light, deep] = GROUP_TONE[g]
          return (
            <section key={g} className="mt-5">
              <div className="flex items-baseline justify-between">
                <p className={H}>{stickerGroupTitle(g, lang)}</p>
                <p className="px-1 text-[13px] font-semibold tabular-nums text-label2">
                  {list.filter((s) => s.got).length}/{list.length}
                </p>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {list.map((s) =>
                  s.got ? (
                    <motion.div
                      key={s.id}
                      initial={isNew.has(s.id) ? { scale: 0.3, rotate: -20 } : false}
                      animate={{ scale: 1, rotate: tilt(s.id) }}
                      transition={SPRING}
                      className="relative flex min-w-0 flex-col items-center rounded-[18px] border-[3px] border-white px-1 pb-1.5 pt-2 text-center shadow-[0_2px_8px_-2px_rgb(29_43_69/0.28)]"
                      style={{ background: `linear-gradient(160deg, ${light}, ${deep})` }}
                    >
                      <span className="text-[30px] leading-none drop-shadow-sm">{s.emoji}</span>
                      <span className="mt-1 line-clamp-2 w-full break-words text-[11px] font-bold leading-[1.15] text-[#1D2B45] [hyphens:auto]">{s.title}</span>
                      {s.sub && g !== 'topics' && g !== 'friends' && <span className="mt-0.5 w-full truncate text-[10px] font-semibold text-[#1D2B45]/60">{s.sub}</span>}
                      {isNew.has(s.id) && <span className="absolute -right-1.5 -top-2 rounded-full bg-[#FF5E8A] px-1.5 py-0.5 text-[10px] font-bold text-white">{t('new')}</span>}
                    </motion.div>
                  ) : (
                    <div key={s.id} className="relative flex min-w-0 flex-col items-center rounded-[18px] border-2 border-dashed border-label3/50 bg-fill/[0.08] px-1 pb-1.5 pt-2 text-center">
                      <span className="relative text-[30px] leading-none">
                        <span style={{ filter: 'grayscale(1) brightness(0)', opacity: 0.12 }}>{s.emoji}</span>
                        <span className="absolute inset-0 flex items-center justify-center text-[20px] font-extrabold text-label3">?</span>
                      </span>
                      <span className="mt-1 line-clamp-2 w-full break-words text-[11px] font-semibold leading-[1.15] text-label3 [hyphens:auto]">{SURPRISE.has(g) ? '???' : s.title}</span>
                      {s.sub && (g === 'topics' || g === 'friends') && <span className="mt-0.5 w-full truncate text-[10px] font-semibold tabular-nums text-label2">{g === 'topics' ? s.sub.split('·').pop().trim() : s.sub}</span>}
                    </div>
                  ),
                )}
              </div>
            </section>
          )
        })}
      </div>
    </Sheet>
  )
}

// =====================================================================
// Kleiderschrank
// =====================================================================
export function WardrobeSheet({ open, onClose, lang, save, onBuy, onWear, now }) {
  const t = useT(lang)
  const date = now ?? new Date()
  const owned = new Set(save.wardrobe ?? ['none'])
  return (
    <Sheet open={open} onClose={onClose} title={t('wardrobe')} action={<DoneAction t={t} onClose={onClose} />}>
      <div className="px-4 pb-2">
        <div className="flex flex-col items-center pt-3">
          <motion.div key={save.outfit} initial={{ y: -6, scale: 0.94 }} animate={{ y: 0, scale: 1 }} transition={SPRING}>
            <Portrait who="loopy" outfit={save.outfit} size={92} />
          </motion.div>
        </div>
        <CoinPill t={t} coins={save.coins} />
        <div className="grid grid-cols-3 gap-2.5">
          {OUTFITS.map((o) => {
            const has = owned.has(o.id)
            const worn = (save.outfit ?? 'none') === o.id
            const seasonNow = o.unlock === 'season' && holidayOf(date) === o.season
            let action
            if (worn)
              action = (
                <span className="flex min-h-[36px] items-center gap-1 text-[13px] font-bold text-accent-text">
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                  {t('wearing')}
                </span>
              )
            else if (has)
              action = (
                <button onClick={() => onWear?.(o.id)} className="min-h-[36px] w-full rounded-full bg-accent/15 px-2 text-[13px] font-bold text-accent-text active:opacity-70">
                  {t('wear')}
                </button>
              )
            else if (o.unlock === 'coins') action = <PriceButton cost={o.cost} can={save.coins >= o.cost} onClick={() => onBuy?.(o.id)} />
            else if (seasonNow)
              action = (
                <button onClick={() => onBuy?.(o.id)} className="min-h-[36px] w-full rounded-full bg-[#FF5E8A] px-2 text-[13px] font-bold text-white active:opacity-80">
                  {t('free')}
                </button>
              )
            else
              action = (
                <span className="flex min-h-[36px] items-center text-center text-[11px] font-semibold leading-tight text-label2">
                  🔒 {o.unlock === 'daily' ? t('lockDaily') : o.unlock === 'album' ? t('lockAlbum', { n: ALBUM_GOAL }) : o.unlock === 'story' ? t('lockStory') : t('lockSeason')}
                </span>
              )
            return (
              <div key={o.id} className={`flex min-w-0 flex-col items-center gap-1.5 rounded-[20px] bg-surface p-2.5 ${worn ? 'ring-[2.5px] ring-accent' : ''}`}>
                <span className={`flex h-14 w-14 items-center justify-center rounded-full bg-bg text-[32px] ${!has && o.unlock !== 'coins' && !seasonNow ? 'opacity-45 grayscale' : ''}`}>{o.emoji}</span>
                <p className="flex min-h-[32px] w-full items-center justify-center text-center text-[13px] font-semibold leading-tight [hyphens:auto]" lang={lang}>
                  {L(OUTFIT_NAME[o.id], lang)}
                </p>
                {action}
              </div>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

// =====================================================================
// Insel ausbauen: Inselteile, Team, Verbesserungen, Deko
// =====================================================================
export function IslandSheet({ open, onClose, lang, save, onBuyArea, onHire, onBuyUpgrade, onBuyDecor, onPlaceDecor, now }) {
  const t = useT(lang)
  const date = now ?? new Date()
  const coins = save.coins || 0
  const stock = save.decorOwned ?? {}
  const stockTotal = Object.values(stock).reduce((n, v) => n + (v || 0), 0)
  const inSeason = (d) => !d.season || d.season === holidayOf(date) || d.season === seasonOf(date)
  const decor = DECOR.filter((d) => inSeason(d) || stock[d.id] > 0)
  return (
    <Sheet open={open} onClose={onClose} title={t('island')} action={<DoneAction t={t} onClose={onClose} />}>
      <div className="px-4 pb-2">
        <CoinPill t={t} coins={coins} />

        <p className={H}>{t('areas')}</p>
        <ul className="mt-2 space-y-2.5">
          {AREAS.map((a) => (
            <li key={a.id} className={ROW}>
              <span className={TILE} aria-hidden>
                {a.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-tight">{L(AREA_TEXT[a.id].name, lang)}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-label2">{L(AREA_TEXT[a.id].text, lang)}</p>
              </div>
              {save.areas?.[a.id] ? <OwnedMark>{t('owned')}</OwnedMark> : <PriceButton cost={a.cost} can={coins >= a.cost} onClick={() => onBuyArea?.(a.id)} />}
            </li>
          ))}
        </ul>

        <p className={`${H} mt-5`}>{t('staff')}</p>
        <ul className="mt-2 space-y-2.5">
          {STAFF.map((s) => {
            const hired = save.staff?.[s.id]
            const blocked = s.needs && !save.areas?.[s.needs]
            const energy = Math.max(0, Math.min(100, hired?.energy ?? 100))
            return (
              <li key={s.id} className={ROW}>
                <span className={TILE} aria-hidden>
                  {s.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[16px] font-semibold leading-tight">
                    {STAFF_TEXT[s.id].name} <span className="font-normal text-label2">· {L(STAFF_TEXT[s.id].kind, lang)}</span>
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-label2">{L(JOB_TEXT[s.job], lang)}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] font-semibold text-label2">
                    <span className="game-coin !h-3 !w-3" />
                    {t('wage', { n: s.wage })}
                  </p>
                  {hired && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[12px]" aria-label={t('energy')}>
                        ⚡
                      </span>
                      <Bar value={energy / 100} tone={energy < 25 ? 'bg-[#FF5E5E]' : energy < 55 ? 'bg-[#FFB13D]' : 'bg-success'} className="flex-1" />
                      <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-label2">{Math.round(energy)}</span>
                    </div>
                  )}
                </div>
                {hired ? (
                  <OwnedMark>{t('hired')}</OwnedMark>
                ) : blocked ? (
                  <span className="flex-none rounded-full bg-fill/15 px-2.5 py-1.5 text-[12px] font-semibold text-label2">☕ {t('needsCafe')}</span>
                ) : (
                  <PriceButton cost={s.cost} can={coins >= s.cost} onClick={() => onHire?.(s.id)} />
                )}
              </li>
            )
          })}
        </ul>

        <p className={`${H} mt-5`}>{t('upgrades')}</p>
        <ul className="mt-2 space-y-2.5">
          {UPGRADES.map((u) => (
            <li key={u.id} className={ROW}>
              <span className={TILE} aria-hidden>
                {u.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[16px] font-semibold leading-tight">{L(UPGRADE_TEXT[u.id].name, lang)}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-label2">{L(UPGRADE_TEXT[u.id].text, lang)}</p>
              </div>
              {save.upgrades?.[u.id] ? <OwnedMark>{t('owned')}</OwnedMark> : <PriceButton cost={u.cost} can={coins >= u.cost} onClick={() => onBuyUpgrade?.(u.id)} />}
            </li>
          ))}
        </ul>

        <p className={`${H} mt-5`}>{t('decor')}</p>
        {stockTotal > 0 && (
          <Button onClick={() => onPlaceDecor?.()} className="mt-2 w-full">
            🪄 {t('place', { n: stockTotal })}
          </Button>
        )}
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {decor.map((d) => (
            <div key={d.id} className="relative flex min-w-0 flex-col items-center gap-1 rounded-[20px] bg-surface p-3">
              {d.season && <span className="absolute left-2 top-2 rounded-full bg-[#FF5E8A]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#D6336C]">{t('onlyNow')}</span>}
              {stock[d.id] > 0 && <span className="absolute right-2 top-2 rounded-full bg-accent px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-white">×{stock[d.id]}</span>}
              <span className="text-[34px] leading-none">{d.emoji}</span>
              <p className="w-full truncate text-center text-[14px] font-semibold">{L(DECOR_NAME[d.id], lang)}</p>
              <p className="text-[12px] text-label2">{t('cozy', { n: d.cozy })}</p>
              {inSeason(d) ? <PriceButton cost={d.cost} can={coins >= d.cost} onClick={() => onBuyDecor?.(d.id)} /> : <p className="text-[12px] font-semibold text-label2">{t('inStock', { n: stock[d.id] })}</p>}
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  )
}

// =====================================================================
// Freunde (Codes ohne Server)
// =====================================================================
function CodeBox({ t, code, shareText, shareUrl }) {
  const ref = useRef(null)
  const [state, setState] = useState(null) // 'ok' | 'fail'
  useEffect(() => setState(null), [code])
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  return (
    <div className="mt-2">
      <div className="rounded-xl bg-bg px-3 py-2">
        <textarea
          ref={ref}
          readOnly
          value={code}
          rows={2}
          onFocus={(e) => e.target.select()}
          className="block h-[36px] w-full resize-none overflow-hidden bg-transparent p-0 font-mono text-[12px] leading-[18px] text-label2 outline-none [word-break:break-all]"
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          onClick={async () => setState((await copyText(code, ref.current)) ? 'ok' : 'fail')}
          className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold ${state === 'ok' ? 'bg-success/15 text-success' : 'bg-fill/[0.14] text-accent-text'} active:opacity-70`}
        >
          {state === 'ok' ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : '📋'} {state === 'ok' ? t('copied') : state === 'fail' ? t('copyFail') : t('copy')}
        </button>
        {canShare && (
          <button onClick={() => navigator.share({ text: shareUrl ? shareText : `${shareText}\n${code}`, url: shareUrl }).catch(() => {})} className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full bg-accent text-[15px] font-semibold text-white active:opacity-80">
            ↗ {t('share')}
          </button>
        )}
      </div>
    </div>
  )
}

function CodeInput({ value, onChange, placeholder, onGo, label, disabled }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!disabled) onGo()
      }}
      className="mt-2 flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className="min-h-[44px] min-w-0 flex-1 rounded-full bg-bg px-4 text-[16px] outline-none placeholder:text-label3 focus:ring-2 focus:ring-accent/40"
        style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
      />
      <button type="submit" disabled={disabled} className={`min-h-[44px] flex-none rounded-full px-4 text-[15px] font-semibold ${disabled ? 'bg-fill/20 text-label3' : 'bg-accent text-white active:opacity-80'}`}>
        {label}
      </button>
    </form>
  )
}

export function FriendsSheet({ open, onClose, lang, save, onVisit, onRedeem, onRename, onMakeGift }) {
  const t = useT(lang)
  const [name, setName] = useState(save.name ?? '')
  const [visit, setVisit] = useState('')
  const [visitBad, setVisitBad] = useState(false)
  const [redeem, setRedeem] = useState('')
  const [result, setResult] = useState(null)
  const [kind, setKind] = useState('coins')
  const [made, setMade] = useState(null) // { code, again }
  useEffect(() => setName(save.name ?? ''), [save.name])
  const code = useMemo(() => (open ? encodeIsland(save) : ''), [open, save])
  const link = code ? islandLink(code) : ''

  const commitName = () => {
    const n = name.trim().slice(0, 24)
    if (n !== (save.name ?? '')) onRename?.(n)
  }
  const goVisit = () => {
    if (!decodeIsland(visit)) return setVisitBad(true)
    setVisitBad(false)
    onVisit?.(visit.trim())
  }
  const goRedeem = () => {
    const r = onRedeem?.(redeem.trim())
    setResult(r ?? null)
    if (r?.gift) setRedeem('')
  }
  const pack = () => {
    const r = onMakeGift ? onMakeGift(kind) : makeGift(save.name, kind)
    setMade(typeof r === 'string' ? { code: r, again: false } : r)
  }
  const resultText = () => {
    if (!result) return null
    if (result.error) return t(`r_${result.error}`)
    const g = result.gift
    const from = g.from || t('someone')
    return g.kind === 'coins' ? t('r_coins', { n: g.coins ?? GIFT_COINS, from }) : t('r_decor', { item: L(DECOR_NAME[g.kind], lang), from })
  }
  const card = 'rounded-2xl bg-surface p-4'

  return (
    <Sheet open={open} onClose={onClose} title={t('friends')} action={<DoneAction t={t} onClose={onClose} />}>
      <div className="space-y-3 px-4 pb-2">
        <p className="px-1 text-center text-[14px] leading-snug text-label2">🔗 {t('friendsHint')}</p>

        <div className={card}>
          <p className={H}>{t('myIsland')}</p>
          <label className="mt-2 block">
            <span className="sr-only">{t('islandName')}</span>
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder={t('islandNamePh')}
              className="min-h-[46px] w-full rounded-xl bg-bg px-3.5 text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-label3 focus:ring-2 focus:ring-accent/40"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            />
          </label>
          <p className="mt-3 px-1 text-[13px] font-semibold text-label2">{t('myCode')}</p>
          <CodeBox t={t} code={code} shareText={t('shareText')} shareUrl={link} />
        </div>

        <div className={card}>
          <p className={H}>🏝️ {t('visit')}</p>
          <CodeInput value={visit} onChange={(v) => (setVisit(v), setVisitBad(false))} placeholder={t('visitPh')} onGo={goVisit} label={t('visitGo')} disabled={!visit.trim()} />
          {visitBad && <p className="mt-2 px-1 text-[14px] font-semibold text-danger">{t('visitBad')}</p>}
        </div>

        <div className={card}>
          <p className={H}>🎁 {t('redeem')}</p>
          <CodeInput value={redeem} onChange={(v) => (setRedeem(v), setResult(null))} placeholder={t('redeemPh')} onGo={goRedeem} label={t('redeemGo')} disabled={!redeem.trim()} />
          <AnimatePresence>
            {result && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-2 px-1 text-[15px] font-semibold ${result.error ? 'text-danger' : 'text-success'}`}>
                {resultText()}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className={card}>
          <p className={H}>💌 {t('makeGift')}</p>
          <p className="mt-1 px-1 text-[13px] text-label2">{t('makeGiftHint')}</p>
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {GIFT_KINDS.map((k) => (
              <button key={k} onClick={() => (setKind(k), setMade(null))} className={`flex min-h-[64px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 ${kind === k ? 'bg-accent/15 ring-2 ring-accent' : 'bg-bg'}`}>
                <span className="text-[24px] leading-none">{giftEmoji(k)}</span>
                <span className="w-full truncate text-center text-[11px] font-semibold">{k === 'coins' ? t('k_coins', { n: GIFT_COINS }) : L(DECOR_NAME[k], lang)}</span>
              </button>
            ))}
          </div>
          {!made ? (
            <Button onClick={pack} className="mt-3 w-full">
              🎀 {t('pack')}
            </Button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING} className="mt-3">
              <p className="px-1 text-[14px] font-semibold">{made.again ? t('packedAgain') : t('packed')}</p>
              <CodeBox t={t} code={made.code} shareText={t('giftShare')} />
            </motion.div>
          )}
        </div>
      </div>
    </Sheet>
  )
}

// =====================================================================
// Geschichte (Visual-Novel-Karte unten)
// =====================================================================
export function StoryDialog({ lang, beat, onDone }) {
  const t = useT(lang)
  const [i, setI] = useState(0)
  const [n, setN] = useState(0)
  const lines = beat?.lines ?? []
  const line = lines[Math.min(i, lines.length - 1)]
  const chars = useMemo(() => Array.from(line ? (line[lang] ?? line.de) : ''), [line, lang])
  const typing = n < chars.length
  const last = i >= lines.length - 1
  useEffect(() => {
    setI(0)
    setN(0)
  }, [beat?.id])
  useEffect(() => setN(0), [i])
  useEffect(() => {
    if (!typing) return
    const id = setTimeout(() => setN((x) => Math.min(chars.length, x + 1)), 24)
    return () => clearTimeout(id)
  }, [n, typing, chars.length])

  const tap = () => {
    if (typing) setN(chars.length)
    else if (!last) setI((x) => x + 1)
    else onDone?.()
  }
  const tapRef = useRef(tap)
  tapRef.current = tap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        e.preventDefault()
        tapRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!beat || !line) return null
  const tone = SPEAKER_TONE[line.who] ?? SPEAKER_TONE.loopy
  const reward = beat.reward
  const rewardOutfit = reward?.outfit && OUTFITS.find((o) => o.id === reward.outfit)
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" onClick={tap} role="dialog" aria-modal="true" aria-label={L(SPEAKERS[line.who], lang)}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
      <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={SPRING} className="relative w-full px-3 pb-[max(14px,env(safe-area-inset-bottom))]">
        <div className="relative mx-auto max-w-xl">
          <AnimatePresence mode="popLayout">
            <motion.div key={`${line.who}-${i}`} initial={{ y: 14, scale: 0.85, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={SPRING} className={`absolute -top-[58px] z-10 ${line.who === 'loopy' ? 'right-4' : 'left-4'}`}>
              <div className="game-float rounded-full bg-surface p-1" style={{ boxShadow: `0 0 0 3px ${tone}, 0 10px 24px -12px rgb(29 43 69 / 0.5)` }}>
                <Portrait who={line.who} size={76} />
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="game-float rounded-[26px] bg-surface px-5 pb-4 pt-5">
            <p className={`text-[14px] font-extrabold uppercase tracking-wide ${line.who === 'loopy' ? 'text-right' : 'pl-[92px]'}`} style={{ color: tone }}>
              <span className={line.who === 'loopy' ? 'pr-[92px]' : ''}>{L(SPEAKERS[line.who], lang)}</span>
            </p>
            <p className="mt-2 text-[17px] font-medium leading-snug">
              {chars.slice(0, n).join('')}
              <span className="opacity-0">{chars.slice(n).join('')}</span>
            </p>
            <AnimatePresence>
              {last && !typing && reward && (
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={SPRING} className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-[#FFB13D]/15 px-3 py-2.5 text-[16px] font-bold text-[#B86E00]">
                  <span className="text-[13px] font-semibold uppercase tracking-wide">{t('reward')}:</span>
                  {reward.coins && (
                    <span className="flex items-center gap-1.5 tabular-nums">
                      +{reward.coins}
                      <span className="game-coin" />
                    </span>
                  )}
                  {rewardOutfit && (
                    <span>
                      {rewardOutfit.emoji} {L(OUTFIT_NAME[rewardOutfit.id], lang)}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                {lines.map((_, k) => (
                  <span key={k} className={`h-2 rounded-full transition-all ${k === i ? 'w-5' : 'w-2'} ${k <= i ? '' : 'bg-fill/25'}`} style={k <= i ? { background: tone } : undefined} />
                ))}
              </div>
              <motion.span animate={typing ? { opacity: 0.35 } : { opacity: [1, 0.4, 1], x: [0, 3, 0] }} transition={typing ? {} : { duration: 1, repeat: Infinity }} className="text-[13px] font-semibold text-label2">
                {last && !typing ? `${t('done')} ✓` : `${t('tapNext')} ▸`}
              </motion.span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// =====================================================================
// Besuchs-Banner
// =====================================================================
export function VisitBanner({ lang, island, onLeave, onGift }) {
  const t = useT(lang)
  if (!island) return null
  return (
    <motion.div initial={{ y: -70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -70, opacity: 0 }} transition={SPRING} className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-[max(10px,env(safe-area-inset-top))]">
      <div className="game-float pointer-events-auto mx-auto flex max-w-xl items-center gap-2.5 rounded-full bg-surface py-1.5 pl-1.5 pr-1.5">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#DCEEFF]">
          <Portrait who="loopy" outfit={island.outfit} size={34} />
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12px] font-semibold text-label2">{t('visiting')}</p>
          <p className="truncate text-[16px] font-bold">{island.name || t('unnamed')}</p>
          <p className="truncate text-[11px] font-semibold text-label2">{t('visitMeta', { d: island.day, s: island.stickersCount })}</p>
        </div>
        {onGift && (
          <button onClick={onGift} aria-label={t('sendGift')} className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#FF84A6]/15 text-[20px] active:opacity-70">
            🎁
          </button>
        )}
        <button onClick={onLeave} className="flex min-h-[44px] flex-none items-center gap-1 rounded-full bg-accent px-4 text-[15px] font-semibold text-white active:opacity-80">
          🏠 {t('home')}
        </button>
      </div>
    </motion.div>
  )
}
