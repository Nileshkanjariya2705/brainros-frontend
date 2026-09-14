import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Question Architecture & Paper Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('QB-001: Legacy Question Bank route handled gracefully', async ({ page }) => {
    await page.goto('/super-admin/question-bank');
    await page.waitForLoadState('domcontentloaded');

    // Page displays 404 or redirect because question paper upload replaces legacy question bank
    await expect(page.locator('body')).toContainText(/404|not be found|exam-manager/i);
  });

  test('QB-002: Question Paper Upload Management Hub is Active', async ({ page }) => {
    await page.goto('/super-admin/exam-manager');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, h3, header').filter({ hasText: /exam|paper|manager/i }).first()).toBeVisible();
  });
});
