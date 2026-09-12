import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Predicted Rank Estimation', () => {
  test('PRED-001: Student Dashboard Predicted Rank Widget', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/rank|score|performance|predicted/i).first()).toBeVisible();
  });
});
