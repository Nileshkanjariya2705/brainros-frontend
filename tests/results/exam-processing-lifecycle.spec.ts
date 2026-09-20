import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Result Evaluation & Publication Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('RES-001: Exam Processing Monitor Directory & Status Filter Tabs', async ({ page }) => {
    await page.goto('/super-admin/exams/results');
    await page.waitForLoadState('domcontentloaded');

    // Verify main title
    await expect(page.locator('h1, h2, header').filter({ hasText: /exam processing|result|evaluation/i }).first()).toBeVisible();

    // Verify status filter tabs (ALL, READY_TO_PUBLISH, PUBLISHED, etc.)
    await expect(page.getByRole('button', { name: /all/i }).first()).toBeVisible();
  });

  test('RES-002: Live Evaluation Pipeline Stages Displayed', async ({ page }) => {
    await page.goto('/super-admin/exams/results');
    await page.waitForLoadState('domcontentloaded');

    // Verify presence of pipeline indicators or examination table
    await expect(page.locator('table, [role="table"], .grid').first()).toBeVisible();
  });

  test('RES-003: Student Cannot Access Super Admin Result Publication Dashboard', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/super-admin/exams/results');
    await page.waitForLoadState('domcontentloaded');

    // Verify 403 Forbidden page is rendered
    await expect(page.locator('body')).toContainText(/403|forbidden|access restricted|authorization policy/i);
  });
});
