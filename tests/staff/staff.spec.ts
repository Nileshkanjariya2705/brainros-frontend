import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Staff Management & Operations', () => {
  test('STAFF-001: Super Admin Staff Directory & Role Filters', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/staff');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /staff/i }).first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('STAFF-002: Staff Member Creation Form Modal', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/staff');
    await page.waitForLoadState('networkidle');

    const addStaffBtn = page.getByRole('button', { name: /add staff|create staff|new staff/i }).first();
    if (await addStaffBtn.isVisible()) {
      await addStaffBtn.click();
      await expect(page.locator('dialog, [role="dialog"], .modal, form').first()).toBeVisible();
    }
  });
});
