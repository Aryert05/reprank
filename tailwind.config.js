/** @type {import('tailwindcss').Config} */
export default {
  content: ['./*.html', './src/**/*.{js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0A0C10',
          900: '#12151B',
          800: '#191D25',
          700: '#232833',
          600: '#2E3543',
        },
        mist: {
          400: '#7C8698',
          300: '#A3ACBB',
          100: '#EEF1F5',
        },
        volt: {
          100: '#FFE4CC',
          400: '#FF9847',
          DEFAULT: '#FF7A1A',
          600: '#E85F00',
        },
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
