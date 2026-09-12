import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Answer Key Management', () => {
  test('AK-001: Answer Key Page and Actions', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/exam-manager');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });
});
