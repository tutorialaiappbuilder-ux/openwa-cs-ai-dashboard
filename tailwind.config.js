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
          dark: '#070a13',
          card: '#0f1423',
          border: '#1f294d',
          text: '#f3f4f6',
          muted: '#9ca3af',
        },
        whatsapp: {
          green: '#25D366',
          teal: '#128C7E',
          dark: '#075E54',
          chatBg: '#0b141a',
        },
        ai: {
          indigo: '#6366f1',
          violet: '#8b5cf6',
          fuchsia: '#d946ef',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'glow-gradient': 'radial-gradient(circle at top, rgba(99, 102, 241, 0.15), transparent 50%)',
      }
    },
  },
  plugins: [],
}
