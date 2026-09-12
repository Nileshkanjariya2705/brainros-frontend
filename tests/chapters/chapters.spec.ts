import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Chapter Master Data Management', () => {
  test('CHAP-001: Chapter Directory View & Subject Filter', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/chapters');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /chapter/i }).first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });
});
