/** @type {import('tailwindcss').Config} */
// Colours are the suite's shared tokens (src/index.css), light and dark; Yap's own colour is the accent
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      fontFamily: {
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        fill: 'var(--fill)',
        label: 'var(--label)',
        muted: 'var(--label-2)',
        line: 'var(--sep)',
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-soft': 'var(--accent-soft)',
        'accent-ink': 'var(--accent-ink)',
      },
    },
  },
  plugins: [],
}
