import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Mock Tests & History', () => {
  test('MOCK-001 & MOCK-002: Student Mock Tests Directory and Mock History', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/exams');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, h3, header').filter({ hasText: /exam|test/i }).first()).toBeVisible();

    await page.goto('/student/history');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('h1, h2, h3, header').filter({ hasText: /history|attempt|exam/i }).first()).toBeVisible();
  });
});
