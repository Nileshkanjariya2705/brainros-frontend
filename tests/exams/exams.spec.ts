import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Exam Management & Scheduling', () => {
  test('EXAM-001: Exam Scheduling Directory & Status Tabs', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/exam-scheduling');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /exam/i }).first()).toBeVisible();
    await expect(page.locator('table, .card, .grid').first()).toBeVisible();
  });

  test('EXAM-002: Student Available Exams List', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /exam|examination/i }).first()).toBeVisible();
  });
});
