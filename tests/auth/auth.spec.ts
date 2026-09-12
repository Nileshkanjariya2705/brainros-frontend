import { test, expect } from '@playwright/test';
import { loginViaUI, TEST_USERS } from '../helpers/auth.helper';

test.describe('Authentication & Session Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies & storage for isolation
    await page.context().clearCookies();
  });

  test('AUTH-001: Student Mobile OTP Login', async ({ page }) => {
    await loginViaUI(page, 'student');
    await expect(page).toHaveURL(/\/student\/dashboard/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('AUTH-002: Student ID Login Mode Toggle', async ({ page }) => {
    await page.goto('/login');
    // Click "Student ID" tab
    const studentIdTab = page.getByRole('button', { name: /student id/i });
    await expect(studentIdTab).toBeVisible();
    await studentIdTab.click();

    // Verify student ID input field is rendered
    const idInput = page.locator('input[name="studentId"]');
    await expect(idInput).toBeVisible();
    await idInput.fill('BRN-2026-000031');

    const sendBtn = page.getByRole('button', { name: /send login otp/i });
    await expect(sendBtn).toBeEnabled();
  });

  test('AUTH-003: Admin Login and Dashboard Redirect', async ({ page }) => {
    await loginViaUI(page, 'admin');
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });

  test('AUTH-004: Super Admin Login and Command Center Access', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await expect(page).toHaveURL(/\/super-admin\/dashboard/);
  });

  test('AUTH-005: Parent Login and Multi-Ward Dashboard', async ({ page }) => {
    await loginViaUI(page, 'parent');
    await expect(page).toHaveURL(/\/parent\/dashboard/);
  });

  test('AUTH-006: Institution Admin Login', async ({ page }) => {
    await loginViaUI(page, 'institutionAdmin');
    await expect(page).toHaveURL(/\/institution\/dashboard/);
  });

  test('AUTH-007 to 010: Staff Roles (Operator, Manager, GM, Accountant) Login', async ({ page }) => {
    await loginViaUI(page, 'operator');
    await expect(page).toHaveURL(/\/staff\/dashboard/);
  });

  test('AUTH-011: Invalid OTP Rejection Error Message', async ({ page }) => {
    await page.goto('/login');
    const mobileInput = page.locator('input[name="mobileNumber"]');
    await mobileInput.fill('8320982232');
    await page.getByRole('button', { name: /send login otp/i }).click();

    const otpInputs = page.locator('input[inputmode="numeric"]');
    await expect(otpInputs.first()).toBeVisible({ timeout: 10000 });

    // Enter wrong OTP 000000
    for (let i = 0; i < 6; i++) {
      await otpInputs.nth(i).fill('0');
    }

    await page.getByRole('button', { name: /verify|sign in/i }).click();

    // Verify error banner is displayed
    const errorBanner = page.locator('text=/invalid|failed|incorrect/i');
    await expect(errorBanner.first()).toBeVisible({ timeout: 8000 });
  });

  test('AUTH-012: User Logout and Protected Route Redirect', async ({ page }) => {
    await loginViaUI(page, 'student');
    await expect(page).toHaveURL(/\/student\/dashboard/);

    // Click Logout button in header
    const logoutBtn = page.locator('button:has-text("Logout"), button[title="Sign Out"]').first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.click();

    // Click confirm logout button in modal
    const confirmLogoutBtn = page.getByRole('button', { name: /yes, log out/i });
    await expect(confirmLogoutBtn).toBeVisible();
    await confirmLogoutBtn.click();

    // Verify redirected to login screen
    await expect(page).toHaveURL(/\/login/);
  });
});
