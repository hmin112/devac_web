/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#00d2ff',
          dark: '#0a0a0c',
          navy: '#121218',
        }
      },
    },
  },
  plugins: [],
}
