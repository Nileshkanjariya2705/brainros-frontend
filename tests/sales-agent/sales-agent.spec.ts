import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Sales Agent Module E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate and navigate to Sales Agent Dashboard
    await loginViaUI(page, 'salesAgent');
    await page.goto('/sales-agent/dashboard');
  });

  test('should render sales dashboard with KPI metrics and quick actions', async ({ page }) => {
    // Check main title or header
    await expect(page.locator('text=Field Sales Command Center')).toBeVisible();
    await expect(page.locator('text=Total Field Visits')).toBeVisible();
    await expect(page.locator('text=Conversion Rate')).toBeVisible();
    await expect(page.locator('text=Month Revenue')).toBeVisible();
    await expect(page.locator('text=Monthly Visits Target')).toBeVisible();

    // Verify Quick Action buttons
    await expect(page.getByRole('button', { name: /Add Activity/i }).first()).toBeVisible();
  });

  test('should navigate to Activity History and verify layout', async ({ page }) => {
    await page.goto('/sales-agent/visits');
    await expect(page.locator('h1').filter({ hasText: /Activity History|Field Visits/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Activity/i }).first()).toBeVisible();

    // Search bar
    await expect(page.locator('input[placeholder*="Search school name"]').first()).toBeVisible();
  });

  test('should log activity on Add Activity page and immediately show in Dashboard and History lists', async ({ page }) => {
    // Click Add Activity
    await page.getByRole('button', { name: /Add Activity/i }).first().click();
    await page.waitForURL('**/sales-agent/add-activity');

    await expect(page.locator('h1').filter({ hasText: /Log Today's Activity/i })).toBeVisible();

    const uniqueSchoolName = `Greenfield Academy ${Date.now()}`;
    await page.getByPlaceholder(/St. Xavier's Senior Secondary School/i).fill(uniqueSchoolName);
    await page.getByPlaceholder(/Dr. R. K. Sharma/i).fill('Mr. Rajesh Kumar');
    await page.getByPlaceholder(/9876543210/i).fill('9876512345');
    await page.getByPlaceholder(/Met with Principal/i).fill('Demonstrated exam portal. Positive response.');

    // Submit form
    await page.getByRole('button', { name: /Submit & Log Activity/i }).click();

    // Verify redirected back to dashboard
    await page.waitForURL('**/sales-agent/dashboard');
    await expect(page.locator(`text=${uniqueSchoolName}`).first()).toBeVisible();

    // Verify it also appears in Activity History
    await page.goto('/sales-agent/visits');
    await expect(page.locator(`text=${uniqueSchoolName}`).first()).toBeVisible();
  });
});
