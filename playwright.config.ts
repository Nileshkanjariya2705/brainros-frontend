import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config.
 *
 * `webServer` builds the app and serves the PRODUCTION bundle via `vite preview`
 * on a fixed, dedicated port before the tests run — so `npm run test:e2e` is the
 * only command you need, the URL never drifts, and you test what actually ships.
 * (Using a dedicated preview port also avoids colliding with a dev server on 3000.)
 *
 * Docs: https://playwright.dev/docs/test-configuration
 */
const PORT = 4173; // matches `preview` in vite.config.ts
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI, // fail CI if a `test.only` was left in
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['html', { open: 'never' }], ['list']] : 'list',

  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry', // capture a trace when a test retries
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
