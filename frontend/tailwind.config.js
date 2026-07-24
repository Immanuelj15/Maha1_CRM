/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Toggle dark theme via html element class
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C59B27', // Metallic Gold from Logo
          hover: '#A9811C',
          light: '#FDF9EB',
        },
        secondary: {
          DEFAULT: '#7A1C2C', // Deep Burgundy Maroon from Logo Border
          hover: '#5F1321',
          light: '#FDF2F4',
        },
        accent: {
          DEFAULT: '#E5B842', // Bright Gold Accent
          hover: '#CFA332',
          light: '#FFFDF0',
        },
        success: {
          DEFAULT: '#10B981', // Emerald
          light: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#C59B27', // Gold
          light: '#FDF9EB',
        },
        danger: {
          DEFAULT: '#7A1C2C', // Burgundy
          light: '#FDF2F4',
        },
        darkBg: '#0F172A', // Slate 900
        darkCard: '#1E293B', // Slate 800
      },
      borderRadius: {
        'premium': '20px',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(197, 155, 39, 0.25)',
        'premium-hover': '0 20px 40px -10px rgba(122, 28, 44, 0.3)',
        'glass': '0 8px 32px 0 rgba(122, 28, 44, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
