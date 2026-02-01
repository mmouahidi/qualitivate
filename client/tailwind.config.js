/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Qualitivate.io Brand Palette
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Brand Primary (Indigo 600)
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        secondary: { // Teal (Growth/Quality)
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        accent: { // Coral (Vibrant/Action)
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        surface: '#ffffff',
        background: '#f8fafc',  // Slate 50
        border: '#e2e8f0',      // Slate 200
        text: {
          primary: '#1e293b',   // Slate 800
          secondary: '#64748b', // Slate 500
          muted: '#94a3b8',     // Slate 400
        },
      },
      borderRadius: {
        'soft': '10px',
        'soft-lg': '16px',
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)',
        'soft-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 6px rgba(0, 0, 0, 0.05), 0 15px 25px rgba(0, 0, 0, 0.12)',
        'soft-hover': '0 4px 8px rgba(0, 0, 0, 0.08), 0 15px 30px rgba(0, 0, 0, 0.15)',
      },
      transitionDuration: {
        'smooth': '250ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
