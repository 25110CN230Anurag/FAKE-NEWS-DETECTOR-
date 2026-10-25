/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070b14',
          900: '#0b1329',
          800: '#111e3f',
          700: '#192b59',
          600: '#233d7c'
        },
        electric: {
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd'
        },
        violetAccent: {
          500: '#8b5cf6',
          400: '#a78bfa',
          300: '#c4b5fd'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-violet': '0 0 25px -5px rgba(139, 92, 246, 0.3)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'glow-green': '0 0 25px -5px rgba(16, 185, 129, 0.3)'
      }
    },
  },
  plugins: [],
};
