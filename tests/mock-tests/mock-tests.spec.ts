import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Mock Tests & History', () => {
  test('MOCK-001 & MOCK-002: Student Mock Tests Directory and Mock History', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/mock-tests');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /mock/i }).first()).toBeVisible();

    await page.goto('/student/mock-history');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /history/i }).first()).toBeVisible();
  });
});
