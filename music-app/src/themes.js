// The looks you can pick for Tape. Colours and decorations live in index.css under [data-theme="…"];
// this list is what the theme picker shows. index.html sets the saved theme before the app loads, so it never flashes.
// (Names are our own on purpose: the app is public, and "Barbie" and "Minecraft" are other companies' trademarks.)

export const THEMES = [
  { id: 'classic', name: 'Classic', blurb: 'Clean, follows light and dark mode', bar: null },
  { id: 'dream', name: 'Pink Dream', blurb: 'Hot pink, sparkles, total glam', bar: '#FFE3F1' },
  { id: 'blocks', name: 'Blocks', blurb: 'Pixel grass, stone and chunky buttons', bar: '#5D9B2F' },
  { id: 'neon', name: 'Neon Night', blurb: 'Arcade glow after dark', bar: '#0B0221' },
  { id: 'ocean', name: 'Ocean', blurb: 'Calm blues and sea glass', bar: '#E3F2F7' },
]

const KEY = 'tape-theme'

export function savedTheme() {
  try {
    const id = localStorage.getItem(KEY)
    return THEMES.some((t) => t.id === id) ? id : 'classic'
  } catch {
    return 'classic'
  }
}

export function applyTheme(id) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0]
  document.documentElement.dataset.theme = theme.id
  // The browser bar takes the theme's colour; Classic goes back to following light/dark
  const metas = document.querySelectorAll('meta[name="theme-color"]')
  metas.forEach((m, i) => m.setAttribute('content', theme.bar || (i === 0 ? '#F2F2F7' : '#000000')))
  try {
    localStorage.setItem(KEY, theme.id)
  } catch {
    /* private mode */
  }
}
