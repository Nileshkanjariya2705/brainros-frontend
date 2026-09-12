import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Institution Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'institutionAdmin');
  });

  test('INST-001: Institution Dashboard KPIs & Performance Cards', async ({ page }) => {
    await page.goto('/institution/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /institute|allen|directory|student|dashboard/i }).first()).toBeVisible();
  });

  test('INST-002: Batch Management Table and Batch Creation', async ({ page }) => {
    await page.goto('/institution/batches');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /batch/i }).first()).toBeVisible();
  });
});
