/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (src/index.css), so light and dark mode share one set of names.
// The shared suite tokens: system backgrounds, solid surfaces, label greys with real contrast, one accent.
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    // Every corner is scaled by --round, so a theme can square them all off (Blocks sets it to 0)
    borderRadius: {
      none: '0', sm: 'calc(0.125rem * var(--round, 1))', DEFAULT: 'calc(0.25rem * var(--round, 1))', md: 'calc(0.375rem * var(--round, 1))', lg: 'calc(0.5rem * var(--round, 1))',
      xl: 'calc(0.75rem * var(--round, 1))', '2xl': 'calc(1rem * var(--round, 1))', '3xl': 'calc(1.5rem * var(--round, 1))', full: 'calc(9999px * var(--round, 1))',
    },
    extend: {
      fontFamily: {
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', '"New York"', 'Georgia', 'serif'],
      },
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        fg2: 'rgb(var(--fg2) / <alpha-value>)',
        fg3: 'rgb(var(--fg3) / <alpha-value>)',
        fill: 'rgb(var(--fill) / 0.12)',
        fill2: 'rgb(var(--fill) / 0.2)',
        line: 'rgb(var(--line) / var(--line-a))',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--accent-ink) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
