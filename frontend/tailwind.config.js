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
          DEFAULT: '#7D1525', // Rich Royal Crimson Burgundy (High Contrast)
          hover: '#610F1B',
          light: '#FDF2F4',
          glow: 'rgba(125, 21, 37, 0.2)',
        },
        secondary: {
          DEFAULT: '#B8860B', // Rich Golden Amber
          hover: '#946B07',
          light: '#FFFDF0',
          glow: 'rgba(184, 134, 11, 0.2)',
        },
        accent: {
          DEFAULT: '#4F46E5', // Vibrant Indigo Accent
          hover: '#4338CA',
          light: '#EEF2FF',
        },
        success: {
          DEFAULT: '#059669', // Emerald 600 (Higher Contrast)
          light: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#D97706', // Amber 600
          light: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626', // Red 600
          light: '#FEF2F2',
        },
        darkBg: '#0B132B', // Deep Rich Navy Night
        darkCard: '#1C2541', // Slate Navy Card
      },
      borderRadius: {
        'premium': '18px',
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(125, 21, 37, 0.2)',
        'premium-hover': '0 20px 40px -10px rgba(125, 21, 37, 0.35)',
        'glass': '0 8px 32px 0 rgba(11, 19, 43, 0.1)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
