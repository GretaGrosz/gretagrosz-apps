/** @type {import('tailwindcss').Config} */
// Farben kommen aus den gemeinsamen Tokens in src/index.css (hell + dunkel). Werte als "R G B",
// damit Tailwind Transparenz anwenden kann (z. B. bg-accent/15).
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Systemschrift: SF auf Apple-Geräten, Segoe/Roboto anderswo – keine Webfont-Ladezeit
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        label: v('label'),
        label2: v('label-2'),
        label3: v('label-3'),
        sep: v('sep'),
        fill: v('fill'),
        accent: { DEFAULT: v('accent'), text: v('accent-text'), soft: v('accent-soft') },
        success: { DEFAULT: v('success'), soft: v('success-soft') },
        danger: { DEFAULT: v('danger'), soft: v('danger-soft') },
      },
      borderRadius: {
        card: '20px',
        control: '12px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04)',
        sheet: '0 -8px 30px -12px rgb(0 0 0 / 0.25)',
      },
    },
  },
  plugins: [],
}
