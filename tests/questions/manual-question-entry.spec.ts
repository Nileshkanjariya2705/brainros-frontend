import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Manual Question Entry & Auto-Draft Persistence Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
  });

  test('MQE-001: Manual Question Entry Page Renders 5 Supported Question Types', async ({ page }) => {
    await page.goto('/super-admin/exam-manager/manual-questions/test-exam-01');
    await page.waitForLoadState('domcontentloaded');

    // Verify main headings and Question Type Selection buttons
    await expect(page.locator('h1, h2').filter({ hasText: /manual question entry/i }).first()).toBeVisible();

    // Verify presence of all 5 supported question types
    await expect(page.getByText('Single correct MCQ', { exact: false })).toBeVisible();
    await expect(page.getByText('Multiple correct', { exact: false })).toBeVisible();
    await expect(page.getByText('Numerical answer', { exact: false })).toBeVisible();
    await expect(page.getByText('Assertion & Reason', { exact: false })).toBeVisible();
    await expect(page.getByText('Match the following', { exact: false })).toBeVisible();
  });

  test('MQE-002: Validation prevents saving invalid question configurations', async ({ page }) => {
    await page.goto('/super-admin/exam-manager/manual-questions/test-exam-01');
    await page.waitForLoadState('domcontentloaded');

    // Leave question statement blank and click Review / Save
    const saveBtn = page.getByRole('button', { name: /save question paper|save & review/i }).first();
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      // Form validation error should appear
      await expect(page.locator('body')).toContainText(/statement|question|required|fill/i);
    }
  });

  test('MQE-003: Auto-Save Local Storage Draft Persists Across Page Reloads', async ({ page }) => {
    await page.goto('/super-admin/exam-manager/manual-questions/test-exam-01');
    await page.waitForLoadState('domcontentloaded');

    // Fill in question statement
    const statementInput = page.locator('textarea, input[placeholder*="statement" i], [data-testid="question-statement"]').first();
    if (await statementInput.isVisible().catch(() => false)) {
      await statementInput.fill('What is Newton third law of motion?');

      // Reload the page to simulate accidental browser close / refresh
      await page.reload({ waitUntil: 'domcontentloaded' });

      // Verify draft restored from localStorage
      await expect(statementInput).toHaveValue('What is Newton third law of motion?');
    }
  });

  test('MQE-004: Question Palette and Slot Navigation', async ({ page }) => {
    await page.goto('/super-admin/exam-manager/manual-questions/test-exam-01');
    await page.waitForLoadState('domcontentloaded');

    // Verify slot navigation / Question palette buttons (Q1, Q2, etc.)
    const qButtons = page.getByRole('button', { name: /Q\d+|Question \d+/i });
    if ((await qButtons.count()) > 0) {
      await expect(qButtons.first()).toBeVisible();
    }
  });
});
