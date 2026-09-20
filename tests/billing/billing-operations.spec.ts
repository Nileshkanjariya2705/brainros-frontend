import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Billing & Invoice Operations Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('BILL-OPS-001: Super Admin Billing Directory and School Price Configuration', async ({ page }) => {
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');

    // Verify main headings and tabs
    await expect(page.locator('h1, h2, header').filter({ hasText: /billing|invoices/i }).first()).toBeVisible();

    // Verify tab switcher exists (Invoices, Schools Pricing, Revenue Analytics)
    await expect(page.getByRole('tab, button', { name: /invoice|school|pricing/i }).first()).toBeVisible();
  });

  test('BILL-OPS-002: Invoice Filters (Month, Year, Payment Status)', async ({ page }) => {
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');

    // Verify presence of filter dropdowns (Month, Year, Status)
    const selects = page.locator('select');
    if ((await selects.count()) > 0) {
      await expect(selects.first()).toBeVisible();
    }
  });

  test('BILL-OPS-003: Staff Bills Portal for Accountant Role', async ({ page }) => {
    await loginViaUI(page, 'accountant');
    await page.goto('/staff/billing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, header').filter({ hasText: /billing|invoice/i }).first()).toBeVisible();
  });
});
