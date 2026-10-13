/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: {
          950: '#0a0e1a',
          900: '#0f1524',
          800: '#161d30',
          700: '#1f293e',
          600: '#2a3652',
        },
        brand: {
          50: '#eafff4',
          100: '#cbffe4',
          400: '#3ddc97',
          500: '#17c982',
          600: '#0fa86b',
          700: '#0c8757',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 21, 36, 0.06), 0 1px 3px 0 rgba(15, 21, 36, 0.08)',
      },
    },
  },
  plugins: [],
};
