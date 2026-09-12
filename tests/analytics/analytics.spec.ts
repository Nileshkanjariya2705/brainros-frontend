import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Performance Analytics & Student Comparison', () => {
  test('ANAL-001 & ANAL-002: Student Performance Trends & Peer Comparison', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/performance-trends');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /performance|trends/i }).first()).toBeVisible();

    await page.goto('/student/comparison');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1, h2, h3').filter({ hasText: /comparison/i }).first()).toBeVisible();
  });
});
