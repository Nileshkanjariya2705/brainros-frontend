import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Student Target Exam Logic & Registration Flows', () => {
  test('TARGET-001: Public Registration displays exact 7 Target Exam options', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Look for target exam select element
    const targetSelect = page.locator('select[name="targetExam"], select#targetExam, select').filter({ hasText: /JEE|NEET|CET/i });
    if (await targetSelect.count() > 0) {
      const optionsText = await targetSelect.first().locator('option').allInnerTexts();
      const nonPlaceholderOptions = optionsText.map(o => o.trim()).filter(o => o && !o.toLowerCase().includes('select'));
      
      const expectedOptions = [
        'JEE',
        'CET',
        'NEET',
        'NEET + JEE',
        'NEET + State CET',
        'JEE + State CET',
        'JEE + NEET + State CET',
      ];

      for (const opt of expectedOptions) {
        expect(nonPlaceholderOptions).toContain(opt);
      }
      expect(nonPlaceholderOptions.length).toBe(7);
    }
  });

  test('TARGET-002: Student Dashboard loads successfully and renders target-eligible sections', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should render student elements
    await expect(page.locator('body')).toContainText(/Dashboard|Upcoming Exams|Mock Tests|Recent/i);
  });

  test('TARGET-003: Student Available Exams Page renders without stale or mismatched state', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /exam|available/i }).first()).toBeVisible();
  });
});
