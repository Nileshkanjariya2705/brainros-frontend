import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Role-Based Access Control & Privilege Boundaries', () => {
  test('RBAC-001: Student cannot access Admin Dashboard (/admin/dashboard)', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/restricted|forbidden|unauthorized|permission|403/i);
  });

  test('RBAC-002: Admin cannot access Super Admin Dashboard (/super-admin/dashboard)', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/super-admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/restricted|forbidden|unauthorized|permission|403/i);
  });

  test('RBAC-003: Student cannot access Parent Portal (/parent/dashboard)', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/parent/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/restricted|forbidden|unauthorized|permission|403/i);
  });

  test('RBAC-004: Student cannot access Institution Dashboard (/institution/dashboard)', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/institution/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/restricted|forbidden|unauthorized|permission|403/i);
  });

  test('RBAC-005: Student cannot access Billing API/Page (/super-admin/billing)', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/restricted|forbidden|unauthorized|permission|403/i);
  });
});
