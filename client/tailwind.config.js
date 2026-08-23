/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        night: {
          950: '#04120f',
          900: '#06201a',
          800: '#0a2f26',
          700: '#104134',
          600: '#175744',
        },
        // Contraste des textes secondaires sur fond vert forêt :
        // stone-400 = texte secondaire (#A8B5A0), stone-500 = très petits textes (#C0C8B8)
        stone: {
          400: '#A8B5A0',
          500: '#C0C8B8',
        },
        gold: {
          100: '#f7ecd2',
          200: '#efdcab',
          300: '#e6c987',
          400: '#dcb566',
          500: '#cfa14a',
          600: '#b1853a',
          700: '#8f6a2e',
        },
        sand: {
          50: '#faf7f0',
          100: '#f4efe3',
          200: '#e9e0cb',
        },
      },
      fontFamily: {
        quran: ['Amiri', 'serif'],
        quranAlt: ['"Scheherazade New"', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px -12px rgba(207, 161, 74, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
