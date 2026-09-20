import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Comprehensive Role-Based Access Control (RBAC) Verification', () => {
  test('RBAC-ALL-001: Student access boundaries', async ({ page }) => {
    await loginViaUI(page, 'student');

    // Student should not access Super Admin Billing
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);

    // Student should not access Staff Management
    await page.goto('/super-admin/staff');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);

    // Student should not access Institution Portal
    await page.goto('/institution/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);
  });

  test('RBAC-ALL-002: Parent access boundaries', async ({ page }) => {
    await loginViaUI(page, 'parent');

    // Parent should not access Admin Dashboard
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);

    // Parent should not access Super Admin Revenue Dashboard
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);
  });

  test('RBAC-ALL-003: Staff Roles (Operator, Manager, GM, Accountant) boundaries', async ({ page }) => {
    await loginViaUI(page, 'operator');

    // Operator should access Exam Manager
    await page.goto('/operator/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toContainText(/403 FORBIDDEN/);

    // Operator should NOT access Super Admin Billing Settings
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);
  });

  test('RBAC-ALL-004: ForbiddenPage renders accessible status and Return to Dashboard button', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/super-admin/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify 403 Forbidden Badge
    await expect(page.getByText('403 FORBIDDEN', { exact: false })).toBeVisible();
    await expect(page.getByText('Access Restricted by Authorization Policy', { exact: false })).toBeVisible();

    // Verify Return to Dashboard button
    const returnBtn = page.getByRole('button', { name: /return to dashboard/i });
    await expect(returnBtn).toBeVisible();
    await returnBtn.click();

    // Verify navigates back to student dashboard
    await expect(page).toHaveURL(/\/student\/dashboard/);
  });
});
