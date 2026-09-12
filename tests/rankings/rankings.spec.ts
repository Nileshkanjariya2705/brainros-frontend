import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Rank Engine & Leaderboards', () => {
  test('RANK-001: Student Leaderboard View', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/leaderboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /leaderboard|rank/i }).first()).toBeVisible();
  });
});
