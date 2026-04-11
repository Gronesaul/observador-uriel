/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        verde: { DEFAULT: '#1a5c2a', light: '#2e7d45', bg: '#e8f5ec' },
        dorado: { DEFAULT: '#c9a227', light: '#f0c840' },
      }
    }
  },
  plugins: [],
}
