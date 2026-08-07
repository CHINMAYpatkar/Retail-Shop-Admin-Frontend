const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#17150F',
          900: '#1C1A17',
          800: '#33302B',
          700: '#4A4640',
          600: '#6B655C',
          400: '#8B857A',
          300: '#A39C90',
        },
        paper: {
          50: '#FBF9F6',
          100: '#F5F2EC',
          200: '#E8E3DA',
        },
        gold: {
          100: '#F7E9C9',
          200: '#EFD59B',
          400: '#D9A441',
          600: '#B8791C',
          700: '#966113',
        },
        paprika: {
          100: '#F6DDD6',
          400: '#C65A42',
          600: '#A8351F',
          700: '#872A18',
        },
        moss: {
          100: '#E3EAD8',
          400: '#7B9764',
          600: '#55713F',
          700: '#445A32',
        },
        clove: {
          100: '#DCE6EC',
          400: '#5A87A0',
          600: '#3B6E8C',
          700: '#2F5A73',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', ...fontFamily.sans],
        sans: ['var(--font-sans)', ...fontFamily.sans],
        mono: ['var(--font-mono)', ...fontFamily.mono],
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgb(23 21 15 / 0.04)',
        popover: '0 4px 16px -2px rgb(23 21 15 / 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-up': 'slide-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
