/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sapphire — refined, чуть теплее и менее «электрик»
        primary: {
          50:  '#eef3ff',
          100: '#dde7ff',
          200: '#bcceff',
          300: '#8eaeff',
          400: '#5e87fa',
          500: '#3a64ee',
          600: '#2548d4',
          700: '#1d39aa',
          800: '#1a3186',
          900: '#1a2c69',
          950: '#0f1740',
        },
        // Champagne gold — мягкий, премиальный
        gold: {
          300: '#facc7a',
          400: '#f4b558',
          500: '#e29a37',
          600: '#bf7a22',
          700: '#945a18',
        },
        // Нейтральная тёмная база (slate-warm), без синего отлива
        dark: {
          950: '#08090d',
          900: '#0c0e14',
          800: '#13161f',
          700: '#1c2030',
          600: '#272c41',
          500: '#3a4060',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      backgroundImage: {
        'hero-pattern': "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(58,100,238,0.18), transparent 60%), linear-gradient(180deg, #0c0e14 0%, #0a0c12 100%)",
        'ambient-soft': "radial-gradient(ellipse 50% 40% at 30% 20%, rgba(58,100,238,0.10), transparent 60%), radial-gradient(ellipse 40% 35% at 80% 70%, rgba(228,154,55,0.06), transparent 60%)",
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(0,0,0,0.2), 0 8px 24px -12px rgba(0,0,0,0.5)',
        'soft-lg': '0 2px 4px rgba(0,0,0,0.25), 0 16px 40px -20px rgba(0,0,0,0.6)',
        'glow-primary': '0 8px 32px -8px rgba(58,100,238,0.45)',
        'glow-gold': '0 8px 32px -8px rgba(228,154,55,0.45)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'float-soft': 'floatSoft 8s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        floatSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
