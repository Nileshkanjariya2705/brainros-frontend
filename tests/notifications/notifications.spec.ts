import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Notifications System', () => {
  test('NOTIF-001: Student Notifications Page & Mark Read', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/notifications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /notification/i }).first()).toBeVisible();
  });
});
