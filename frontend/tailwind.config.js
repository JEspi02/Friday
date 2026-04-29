/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { black: '#1a1a1a', gray: '#f3f4f6', accent: '#fbbf24' },
        trade: { up: '#22c55e', down: '#ef4444', upBg: '#f0fdf4', downBg: '#fef2f2' },
        ai: { main: '#8b5cf6', light: '#f3e8ff', dark: '#5b21b6' },
        theme: {
          bg: {
            primary: 'var(--bg-primary)',
            secondary: 'var(--bg-secondary)',
            tertiary: 'var(--bg-tertiary)',
          },
          text: {
            primary: 'var(--text-primary)',
            secondary: 'var(--text-secondary)',
            tertiary: 'var(--text-tertiary)',
          },
          border: {
            primary: 'var(--border-primary)',
            secondary: 'var(--border-secondary)',
          }
        }
      },
      fontFamily: { sans: ['Inter', '-apple-system', 'sans-serif'] },
      screens: { 'dt': '850px' }
    },
  },
  plugins: [],
}
