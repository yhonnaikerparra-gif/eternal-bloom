/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
        parchment: {
          50: '#fdfbf7',
          100: '#f9f5ec',
          200: '#f2e8d5',
          300: '#e8d7b8',
          400: '#dbc195',
          500: '#cbab75',
          800: '#433422',
          900: '#2b2116',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'serif'],
        cursive: ['"Dancing Script"', '"Great Vibes"', 'cursive'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'unfold': 'unfold 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        unfold: {
          '0%': { opacity: '0', transform: 'scale(0.85) rotateX(15deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotateX(0deg)' },
        }
      }
    },
  },
  plugins: [],
}
