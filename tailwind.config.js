/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.php",
    "./admin/**/*.php",
    "./api/**/*.php",
    "./games/**/*.php",
    "./embed/**/*.php",
    "./assets/js/**/*.js",
  ],
  corePlugins: {
    // CRITICAL: disable preflight/base reset — this is a utility layer on top
    // of an existing hand-written design system (global.css / portal.css).
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#f5c518',
          bright: '#ffd94a',
          deep: '#c99a08',
        },
        ink: {
          950: '#0b0d11',
          900: '#111318',
          800: '#161920',
          700: '#1e222b',
          600: '#2a2f3a',
        },
        cream: '#f7f6f2',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        shell: '72rem',
      },
    },
  },
  plugins: [],
};
