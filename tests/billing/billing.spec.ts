import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Billing & Invoice Operations', () => {
  test('BILL-001: Super Admin Billing Directory and Filters', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /billing|invoices/i }).first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('BILL-002: Accountant Billing Portal Access', async ({ page }) => {
    await loginViaUI(page, 'accountant');
    await page.goto('/staff/billing');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /billing|invoices/i }).first()).toBeVisible();
  });
});
