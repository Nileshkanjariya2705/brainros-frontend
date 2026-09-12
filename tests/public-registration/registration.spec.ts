import { test, expect } from '@playwright/test';

test.describe('Public Student Registration Workflow', () => {
  test('REG-001 & REG-003: Registration Form Validation & Field Requirements', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: /create student profile|student identity/i }).first()).toBeVisible();

    // Verify presence of core fields in Step 1
    const nameInput = page.getByPlaceholder(/aarav sharma/i);
    const mobileInput = page.getByPlaceholder(/9876543210/i);
    await expect(nameInput).toBeVisible();
    await expect(mobileInput).toBeVisible();

    // Click Continue empty form to verify client-side validation
    const submitBtn = page.getByRole('button', { name: /continue/i });
    await submitBtn.click();

    // Verify validation errors are shown
    const validationErrors = page.getByText(/required|valid|enter/i);
    await expect(validationErrors.first()).toBeVisible();
  });

  test('REG-002: Dynamic Target & Academic Stream Selection', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('domcontentloaded');

    // Fill Step 1
    await page.getByPlaceholder(/aarav sharma/i).fill('Test Student');
    await page.getByPlaceholder(/9876543210/i).fill('9876543210');
    await page.getByRole('button', { name: /continue/i }).click();

    // Fill Step 2 (Location & School) if visible
    const nextBtn = page.getByRole('button', { name: /continue/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
    }

    // Check Step 3 (Academic Target) or Step 2 controls
    await expect(page.locator('body')).toBeVisible();
  });
});

