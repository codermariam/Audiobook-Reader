/** @type {import('tailwindcss').Config} */
// Force Tailwind Re-compilation trigger
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF5F7', // elegant airy blush pink
        surface: '#FFFFFF',
        primary: '#E098AE', // dusty rose
        secondary: '#D4B4CB', // soft mauve/lavender
        textMain: '#333333', // highly readable dark charcoal
        textMuted: '#888888', // legible medium gray
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
