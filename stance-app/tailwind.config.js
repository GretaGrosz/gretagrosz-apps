/** @type {import('tailwindcss').Config} */
// Colours are CSS variables (src/index.css), so light and dark mode share one set of names.
// The shared suite tokens: system backgrounds, solid surfaces, label greys with real contrast, one accent.
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
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
