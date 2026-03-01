/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wine: {
          50: '#fef1f2',
          100: '#fee2e2',
          500: '#991b1b', // Primary wine red
          900: '#450a0a',
        },
        gold: '#d4af37',
        offwhite: '#f5f5f7',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        serif: ['var(--font-playfair)'],
      }
    },
  },
  plugins: [],
}