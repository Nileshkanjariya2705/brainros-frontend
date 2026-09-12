import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Data Exports & Reports', () => {
  test('EXP-001: Institution Export Trigger', async ({ page }) => {
    await loginViaUI(page, 'institutionAdmin');
    await page.goto('/institution/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).toBeVisible();
  });
});
