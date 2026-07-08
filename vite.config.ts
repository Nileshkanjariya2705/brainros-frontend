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
    port: 3000,
    open: true,
  },
  // Used by Playwright E2E (`npm run preview`). Fixed port + strictPort so the
  // E2E base URL is deterministic and never silently drifts to another port.
  preview: {
    port: 4173,
    strictPort: true,
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
