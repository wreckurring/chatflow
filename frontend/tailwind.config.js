/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0C0C0E',
          1: '#111115',
          2: '#17171C',
          3: '#1E1E25',
          4: '#26262F',
        },
        border: {
          DEFAULT: '#27272F',
          subtle: '#1E1E24',
          strong: '#3A3A46',
        },
        ink: {
          DEFAULT: '#E4E4E7',
          muted: '#71717A',
          faint: '#3F3F46',
        },
        accent: {
          DEFAULT: '#10B981',
          hover: '#059669',
          subtle: '#10B98120',
          text: '#34D399',
        },
        danger: {
          DEFAULT: '#EF4444',
          subtle: '#EF444415',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
