/** @type {import('tailwindcss').Config} */
export default {
  content: { relative: true, files: ['./index.html', './src/**/*.{js,jsx}'] },
  theme: {
    extend: {
      fontFamily: { body: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { DEFAULT: '#1c2430', soft: '#5b6575' },
        brand: { DEFAULT: '#16936b', light: '#e2f6ed', dark: '#0f7353' },
        gold: { DEFAULT: '#e8a317', light: '#fdf3d9' },
      },
      keyframes: {
        bob: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        pop: { '0%': { transform: 'scale(.8)', opacity: 0 }, '100%': { transform: 'scale(1)', opacity: 1 } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
      animation: { bob: 'bob 1.4s ease-in-out infinite', pop: 'pop .25s ease-out', shake: 'shake .3s ease-in-out' },
    },
  },
  plugins: [],
}
