/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': {
          '50': '#f0f7ff',
          '100': '#e0eefe',
          '200': '#c8e2fe',
          '300': '#a4d1fe',
          '400': '#7ab8fd',
          '500': '#5c9cfc',
          '600': '#3e7cf8',
          '700': '#3064eb',
          '800': '#2b52bf',
          '900': '#29479a',
          '950': '#1c2e64',
        },
      },
      keyframes: {
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.3s ease-out'
      }
    },
  },
  plugins: [],
}