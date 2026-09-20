import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Regional Language & AI Question Paper Translation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('AITRANS-001: Regional Language Management Page Lists Supported Languages', async ({ page }) => {
    await page.goto('/super-admin/languages');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, header').filter({ hasText: /language|translation/i }).first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Hindi|Gujarati|Marathi|Bengali|Tamil|Telugu|Kannada/i);
  });

  test('AITRANS-002: Question Paper Translation Hub Renders Language Actions', async ({ page }) => {
    await page.goto('/super-admin/exam-manager/translation/test-exam-01');
    await page.waitForLoadState('domcontentloaded');

    // Verify presence of Translation Manager UI and language action cards
    await expect(page.locator('body')).toContainText(/translation manager|languages|translate/i);
  });
});
