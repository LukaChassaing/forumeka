import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        beige: {
          50: 'rgb(var(--beige-50) / <alpha-value>)',
          100: 'rgb(var(--beige-100) / <alpha-value>)',
          200: 'rgb(var(--beige-200) / <alpha-value>)',
        },
        ink: {
          50: 'rgb(var(--ink-50) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      keyframes: {
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(50%)' },
          '100%': { transform: 'translateX(250%)' },
        },
      },
      animation: {
        'loading-bar': 'loading-bar 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
