import { test, expect } from '@playwright/test';

/**
 * Example E2E specs — they exercise the real app in a real browser, no backend
 * required (only client routing + rendering). Use these as the template for
 * your own flows. Run with `npm run test:e2e` (or `npm run test:e2e:ui`).
 */

test.describe('Authentication routing', () => {
  test('redirects an unauthenticated visitor from a protected route to /login', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('renders the login form fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel(/email/i)).toBeVisible();
    // Target the input by name — /password/i also matches the "Show password" toggle.
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('shows validation errors when submitting an empty form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();

    // yup + react-hook-form surface the required-field messages from constants.
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
