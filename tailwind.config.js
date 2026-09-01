/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Class-based dark mode (repo convention): toggle by adding `dark` to <html>.
  darkMode: 'class',
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      // Colors map to CSS variables (defined in src/styles/index.css :root / .dark)
      // so theming/dark-mode is a single source of truth.
      colors: {
        brand: {
          50: 'var(--brand-50)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
        },
        surface: 'var(--surface)',
        'surface-muted': 'var(--surface-muted)',
        content: 'var(--content)',
        'content-muted': 'var(--content-muted)',
        border: 'var(--border-color)',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(0 0 0 / 0.03)',
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      zIndex: {
        1: '1',
        2: '11',
        3: '111',
        4: '1111',
      },
    },
  },
  plugins: [],
};
