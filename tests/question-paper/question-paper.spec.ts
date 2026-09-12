import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Question Paper Management', () => {
  test('QP-001: Question Paper Upload Page & Template Requirements', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/exam-manager');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /exam manager|question paper/i }).first()).toBeVisible();
  });
});
