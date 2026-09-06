/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  // svgr → import icons as React components:  import Logo from '@/assets/icons/logo.svg?react'
  // tsconfigPaths → resolve the @/, @config, @components/... aliases from tsconfig
  plugins: [react(), svgr(), tsconfigPaths()],
  server: {
    port: 3001,
    open: true,
  },
  // Used by Playwright E2E (`npm run preview`). Fixed port + strictPort so the
  // E2E base URL is deterministic and never silently drifts to another port.
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/scheduler/') ||
              id.includes('/@remix-run/')
            ) {
              return 'vendor-react';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            if (id.includes('@tanstack/react-query') || id.includes('@tanstack/react-table')) {
              return 'vendor-tanstack';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // Vitest owns unit/component tests under src/ ONLY.
    // Playwright owns e2e/ — keep it out of Vitest so the two runners never clash.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
  },
});
