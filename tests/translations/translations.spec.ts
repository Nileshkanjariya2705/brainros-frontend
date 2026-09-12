import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Regional Language & Translations', () => {
  test('TRANS-001: Language List & Translation Coverage', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/languages');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /language|translation/i }).first()).toBeVisible();
  });
});
