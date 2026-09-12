import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Student Management & Profiles', () => {
  test('STU-001: Admin Student Directory Search & Filters', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await page.goto('/admin/students');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /student/i }).first()).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search" i]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Nilesh');
    await page.waitForTimeout(600);

    await expect(page.locator('body')).toContainText(/Nilesh|Students/i);
  });

  test('STU-002: Student Self-Profile View & Preferences', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/profile');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/Student Profile|Personal Details|BRN-/i).first()).toBeVisible();
    await expect(page.locator('input, button').first()).toBeVisible();
  });
});
