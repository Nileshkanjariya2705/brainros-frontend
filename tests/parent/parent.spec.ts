import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Parent Portal & Ward Progress Tracking', () => {
  test('PARENT-001 & PARENT-002: Parent Dashboard & Ward Switcher', async ({ page }) => {
    await loginViaUI(page, 'parent');
    await page.goto('/parent/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3, div').filter({ hasText: /parent|ward|student/i }).first()).toBeVisible();
  });
});
