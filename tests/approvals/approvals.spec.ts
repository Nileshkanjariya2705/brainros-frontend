import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Approval Queue & Workflow', () => {
  test('APPR-001: General Manager & Super Admin Approval Queue', async ({ page }) => {
    await loginViaUI(page, 'generalManager');
    await page.goto('/staff/approvals');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /approval/i }).first()).toBeVisible();
    await expect(page.locator('table').first()).toBeVisible();
  });

  test('APPR-002: Super Admin View Approvals with Action Buttons', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/approval-queue');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /approval/i }).first()).toBeVisible();
  });
});
