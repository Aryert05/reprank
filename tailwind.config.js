/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces — cool near-black, never pure #000
        ink: {
          950: '#0A0C10',
          900: '#12151B',
          800: '#191D25',
          700: '#232833',
          600: '#2E3543',
        },
        // Text
        mist: {
          400: '#7C8698',
          300: '#A3ACBB',
          100: '#EEF1F5',
        },
        // Primary accent — "volt": the one strong color for XP, buttons, progress
        volt: {
          100: '#FFE4CC',
          400: '#FF9847',
          DEFAULT: '#FF7A1A',
          600: '#E85F00',
        },
        // Secondary accent — "surge": reserved for achievements/badges only
        surge: {
          400: '#9B82FF',
          DEFAULT: '#7C5CFF',
        },
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 12px 24px -12px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};
