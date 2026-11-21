/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      fontFamily: {
        // The device's own type: SF on Apple devices, Roboto/Segoe elsewhere. No web font to wait for.
        body: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Theme colours come from CSS variables (src/index.css) so they flip for dark mode
        ink: 'rgb(var(--ink) / <alpha-value>)',
        mist: 'rgb(var(--mist) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        page: 'rgb(var(--page) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        sub: 'rgb(var(--sub) / <alpha-value>)',
        spark: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', ink: 'rgb(var(--accent-ink) / <alpha-value>)', soft: 'rgb(var(--accent-soft) / <alpha-value>)' },
        good: 'rgb(var(--good) / <alpha-value>)',
        bad: 'rgb(var(--bad) / <alpha-value>)',
      },
      transitionDuration: { DEFAULT: '200ms' },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        pop: 'var(--shadow-pop)',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        spring: 'cubic-bezier(0.32, 0.72, 0, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        pop: { '0%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.18)' }, '100%': { transform: 'scale(1)' } },
        rise: { '0%': { opacity: 0, transform: 'translateY(10px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        fade: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        sheet: { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: 0, transform: 'scale(0.96)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
        toast: { '0%': { opacity: 0, transform: 'translateY(12px) scale(0.98)' }, '100%': { opacity: 1, transform: 'translateY(0) scale(1)' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-5px)' }, '75%': { transform: 'translateX(5px)' } },
      },
      animation: {
        pop: 'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        rise: 'rise 0.28s cubic-bezier(0.32, 0.72, 0, 1) both',
        fade: 'fade 0.18s ease-out both',
        sheet: 'sheet 0.32s cubic-bezier(0.32, 0.72, 0, 1) both',
        'scale-in': 'scaleIn 0.22s cubic-bezier(0.32, 0.72, 0, 1) both',
        toast: 'toast 0.26s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        shake: 'shake 0.24s ease-in-out',
      },
    },
  },
  plugins: [],
}
