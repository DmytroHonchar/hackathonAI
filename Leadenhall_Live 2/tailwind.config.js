/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: '#FBF6EE',   // warm limestone page background
        surface: '#FFFFFF',  // cards
        sand: '#F5EEE2',     // soft inset / secondary surface
        line: '#EADFCD',     // hairline borders
        'line-strong': '#DFD1B9',

        // Text — warm espresso family
        ink: {
          DEFAULT: '#241C15',
          soft: '#6B5D4F',
          faint: '#9C8C79',
        },

        // Primary — terracotta / clay ("I need a service")
        clay: {
          DEFAULT: '#C0532B',
          dark: '#A5431F',
          soft: '#D9764F',
          tint: '#F7E8DF',
        },

        // Secondary — agave green (provider journey + trust/verified)
        agave: {
          DEFAULT: '#2E6A52',
          dark: '#245743',
          soft: '#4E8A70',
          tint: '#E2EDE7',
        },

        // Accent — marigold (ratings, highlights)
        marigold: {
          DEFAULT: '#E4A32B',
          soft: '#F0C35F',
          tint: '#FBF0D6',
        },

        // Emergency
        coral: {
          DEFAULT: '#C4362E',
          tint: '#F8E3E1',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '1.75rem',
        '5xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(60,42,26,0.04), 0 2px 8px rgba(60,42,26,0.05)',
        card: '0 2px 6px rgba(60,42,26,0.05), 0 8px 24px rgba(60,42,26,0.07)',
        lift: '0 8px 20px rgba(60,42,26,0.10), 0 18px 48px rgba(60,42,26,0.12)',
        clay: '0 6px 18px rgba(192,83,43,0.30)',
        agave: '0 6px 18px rgba(46,106,82,0.28)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        floatUp: 'floatUp 0.5s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
