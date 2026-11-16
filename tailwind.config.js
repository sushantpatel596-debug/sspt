/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { ink: '#172b4d', brand: '#315efb', mist: '#f5f8ff' }, boxShadow: { soft: '0 8px 30px rgba(26,55,110,.06)' } } },
  plugins: []
}