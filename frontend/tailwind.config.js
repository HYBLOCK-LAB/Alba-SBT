/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,jsx,tsx}',
    './index.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e8f0fa',
          100: '#c6d8f3',
          200: '#9fbdea',
          300: '#78a2e1',
          400: '#578ed9',
          500: '#3679d0',
          600: '#2060b8',
          700: '#0b4c86',
          800: '#083a6a',
          900: '#05284e',
        },
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        neutral: {
          0:   '#ffffff',
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error:   '#ef4444',
        info:    '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'NotoSansKR', 'System'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
