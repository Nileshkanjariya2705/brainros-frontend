import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Academic Calendar & Scheduling', () => {
  test('CAL-001: Monthly Calendar Grid & Event Days', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/exam-calendar');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /calendar|schedule/i }).first()).toBeVisible();
    await expect(page.locator('.grid, table, [role="grid"]').first()).toBeVisible();
  });
});
