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
        datacenter: {
          950: '#06090e',
          900: '#0b111b',
          850: '#0f1726',
          800: '#141e30',
          700: '#1e2b45',
          600: '#2b3d60',
          border: '#1f2e4a',
          cyan: '#00f2fe',
          neon: '#4facfe',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fan-spin': 'spin 1.2s linear infinite',
      }
    },
  },
  plugins: [],
}
