import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Responsive Layout & Viewport Testing', () => {
  const viewports = [
    { name: 'Mobile Small (360x740)', width: 360, height: 740 },
    { name: 'Mobile Standard (390x844)', width: 390, height: 844 },
    { name: 'Tablet (768x1024)', width: 768, height: 1024 },
    { name: 'Desktop (1366x768)', width: 1366, height: 768 },
  ];

  for (const vp of viewports) {
    test(`RESP: Dashboard & Navigation on ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginViaUI(page, 'student');
      await page.goto('/student/dashboard');
      await page.waitForLoadState('networkidle');

      // Ensure page renders cleanly
      await expect(page.locator('body')).toBeVisible();

      // Check horizontal scroll width equals client width (no overflowing body)
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(isOverflowing).toBe(false);
    });
  }
});
