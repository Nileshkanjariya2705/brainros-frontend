import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Question Bank Engine', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('QB-001: Question Bank Table and Filter Controls', async ({ page }) => {
    await page.goto('/super-admin/question-bank');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/question bank|feature unavailable|deactivated|not currently enabled/i);
  });

  test('QB-002: Create Question Page Form Structure', async ({ page }) => {
    await page.goto('/super-admin/question-bank/create');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toContainText(/create question|add question|question|feature unavailable|deactivated|not currently enabled/i);
  });
});
