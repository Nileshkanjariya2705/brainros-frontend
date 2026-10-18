import { test, expect } from '@playwright/test';

test.describe('Authentication routing & forms', () => {
  test('redirects an unauthenticated visitor from a protected route to /login', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('renders the Mobile OTP login form by default and preserves mobile OTP', async ({ page }) => {
    await page.goto('/login');

    // Default tab is Mobile OTP
    await expect(page.getByRole('button', { name: /mobile otp/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /student id/i })).toBeVisible();

    await expect(page.locator('input[name="mobileNumber"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /send login otp/i })).toBeVisible();
  });

  test('switches to Student ID tab and displays Student ID + Password fields', async ({ page }) => {
    await page.goto('/login');

    // Click Student ID tab
    await page.getByRole('button', { name: /student id/i }).click();

    // Verify Student ID and Password inputs
    await expect(page.locator('input[name="studentId"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in with password/i })).toBeVisible();

    // Verify OTP button is NOT present in Student ID tab
    await expect(page.getByRole('button', { name: /send login otp/i })).not.toBeVisible();
  });

  test('shows validation errors when submitting an empty Student ID form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /student id/i }).click();

    await page.getByRole('button', { name: /sign in with password/i }).click();

    await expect(page.getByText(/Student ID or Student Code is required/i)).toBeVisible();
    await expect(page.getByText(/Password is required/i)).toBeVisible();
  });
});

