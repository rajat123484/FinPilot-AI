/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#070D1E',       // ultra deep navy background
          card: '#0D182E',       // card dark navy
          cardBorder: '#1A2A4A', // refined subtle border
          cardHover: '#132140',  // hover navy
          input: '#091224',      // input bg
          muted: '#64748B',      // muted text
          text: '#F1F5F9',       // main text
          primary: '#2563EB',    // royal blue
          accent: '#38BDF8',     // cyan / electric blue
          success: '#10B981',    // emerald green
          warning: '#F59E0B',    // amber
          danger: '#EF4444',     // bright red
          purple: '#8B5CF6'      // violet
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(56, 189, 248, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
