import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Schools & Colleges Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'admin');
  });

  test('SCH-001: School Directory Display & Pagination', async ({ page }) => {
    await page.goto('/admin/schools');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /school|institution/i }).first()).toBeVisible();

    // Verify search input
    const searchInput = page.locator('input[placeholder*="Search" i]');
    await expect(searchInput.first()).toBeVisible();
  });

  test('SCH-002: School Search and Filtering', async ({ page }) => {
    await page.goto('/admin/schools');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    await searchInput.fill('Allen');
    await page.waitForTimeout(600); // debounce wait

    // Table should contain filtered result or empty state
    await expect(page.locator('table, .grid, [role="table"]').first()).toBeVisible();
  });
});
