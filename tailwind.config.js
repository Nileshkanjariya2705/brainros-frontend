/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Class-based dark mode (repo convention): toggle by adding `dark` to <html>.
  darkMode: 'class',
  theme: {
    // Repo uses MAX-width breakpoints (desktop-first). Override defaults.
    screens: {
      '2xl': { min: '1200px' },
      xl: { max: '1199px' },
      lg: { max: '991px' },
      md: { max: '767px' },
      sm: { max: '575px' },
      xsm: { max: '374px' },
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
