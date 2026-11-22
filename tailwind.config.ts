import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f7f8f7',
        ink: '#152238',
        accent: {
          50: '#eef8f6',
          100: '#d5eee9',
          500: '#0f8b7e',
          600: '#0f766e',
          700: '#0d5f59',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21, 34, 56, 0.04), 0 4px 16px rgba(21, 34, 56, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
