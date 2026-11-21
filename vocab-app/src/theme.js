// Your streak colour: each colour of the rainbow lasts 30 days and gets a shade deeper every day you keep the streak.
// The page itself is the system background (light or dark, following the phone); the colour lives in the ring,
// the buttons and the links. Every colour is checked for contrast, so text on it is always readable.
// After pink (day 270) it starts again at red.

export const COLORS = [
  { id: 'red', base: '#FF3B30' },
  { id: 'orange', base: '#FF9500' },
  { id: 'yellow', base: '#FFCC00' },
  { id: 'green', base: '#34C759' },
  { id: 'teal', base: '#30B0C7' },
  { id: 'blue', base: '#007AFF' },
  { id: 'indigo', base: '#5856D6' },
  { id: 'purple', base: '#AF52DE' },
  { id: 'pink', base: '#FF2D55' },
]

export const DAYS_PER_COLOR = 30

// Which colour and which shade a streak is on. dayInColor runs 1–30 (0 before the streak starts).
export function stageFor(streak) {
  if (streak <= 0) return { color: COLORS[0], index: 0, next: COLORS[1], dayInColor: 0, shade: 0 }
  const index = Math.floor((streak - 1) / DAYS_PER_COLOR) % COLORS.length
  const dayInColor = ((streak - 1) % DAYS_PER_COLOR) + 1
  return {
    color: COLORS[index],
    index,
    next: COLORS[(index + 1) % COLORS.length],
    dayInColor,
    shade: (dayInColor - 1) / (DAYS_PER_COLOR - 1), // 0 = lightest, 1 = deepest
  }
}

// --- colour maths (sRGB, WCAG contrast) ---
const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}
const toHex = (rgb) => '#' + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
function luminance([r, g, b]) {
  const lin = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
// Move a colour towards black (on light pages) or white (on dark pages) until it reaches the contrast target
function reach(color, bg, target, towards) {
  let c = color
  for (let t = 0; t <= 1 && contrast(c, bg) < target; t += 0.02) c = mix(color, towards, t)
  return c
}

const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]
const PAGE = { light: hexToRgb('#F2F2F7'), dark: BLACK }
const SURFACE = { light: WHITE, dark: hexToRgb('#1C1C1E') }

// The colour of a streak day: day 1 is the colour itself, every day a little deeper, day 30 its deepest shade
export function shadeOf(streak, dark = false) {
  const { color, shade } = stageFor(streak)
  const base = hexToRgb(color.base)
  return mix(base, BLACK, shade * (dark ? 0.3 : 0.5))
}

export function themeFor(streak, dark = false) {
  const page = dark ? PAGE.dark : PAGE.light
  const surface = dark ? SURFACE.dark : SURFACE.light
  // The ring and the filled button: the day's shade, kept visible against the page
  const accent = reach(shadeOf(streak, dark), page, 1.6, dark ? WHITE : BLACK)
  // The filled button: white text when the shade allows it, black text on light shades (yellow, early tints),
  // otherwise the fill goes a little deeper until white text reaches 4.5:1
  let button = accent
  let onAccent = WHITE
  if (contrast(accent, WHITE) < 4.5) {
    if (contrast(accent, BLACK) >= 7) onAccent = BLACK
    else button = reach(accent, WHITE, 4.6, BLACK)
  }
  // Coloured text (links, tinted buttons) must reach 4.5:1 on the page, on a card and on a tinted button
  const tint = mix(surface, accent, dark ? 0.24 : 0.14)
  const away = dark ? WHITE : BLACK
  const ink = reach(reach(reach(accent, page, 4.6, away), surface, 4.6, away), tint, 4.6, away)
  return {
    '--accent': toHex(accent),
    '--button': toHex(button),
    '--on-accent': toHex(onAccent),
    '--link': toHex(ink),
    '--tint': toHex(tint),
  }
}

// The status-bar colour for <meta name="theme-color">
export const pageColor = (dark) => (dark ? '#000000' : '#F2F2F7')

// The colour a streak day had, as a CSS colour (for the year grid)
export const shadeHex = (streak, dark = false) => toHex(shadeOf(Math.max(1, streak), dark))
