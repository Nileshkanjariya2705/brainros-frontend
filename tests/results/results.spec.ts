import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Result Evaluation & Publication', () => {
  test('RES-001: Super Admin Result Processing Dashboard', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/exams/results');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /result|evaluation/i }).first()).toBeVisible();
  });
});
