/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0B',
        surface: '#121214',
        'surface-hover': '#18181B',
        border: '#27272A',
        'border-subtle': '#27272A',
        'border-hover': '#3F3F46',
        text: {
          primary: '#FAFAFA',
          muted: '#A1A1AA',
          subdued: '#71717A',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#4F46E5',
          subtle: 'rgba(99, 102, 241, 0.1)',
        },
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
