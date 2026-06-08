/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0E79FD',
          dark: '#0553B1',
          soft: '#EAF3FF',
          glow: 'rgba(14, 121, 253, 0.15)',
        },
        ink: { DEFAULT: '#0A0A1A', soft: '#1F2937' },
        muted: { DEFAULT: '#6B7280', light: '#9CA3AF' },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'serif'],
        mono: ['"Geist Mono"', 'monospace'],
      },
      boxShadow: {
        brand: '0 8px 24px rgba(14,121,253,0.18)',
      },
    },
  },
  plugins: [],
};
