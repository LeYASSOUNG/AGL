/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        // Neutral system (no beige)
        ink: '#020617',
        surface: '#FFFCE0', // page background
        card: '#ffffff', // card/navbar background
        soft: '#f8fafc', // inputs / subtle sections
        muted: '#6b7280',
        line: '#e5e7eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '1rem',
        control: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px rgb(0 0 0 / 0.06), 0 4px 24px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
};
