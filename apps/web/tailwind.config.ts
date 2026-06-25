import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf8f4',
          100: '#f3efe6',
          200: '#e7ddc9',
        },
        ink: {
          50: '#f7f7f6',
          100: '#e5e3df',
          300: '#a8a39a',
          500: '#6b6760',
          700: '#3a3733',
          900: '#1c1a18',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
