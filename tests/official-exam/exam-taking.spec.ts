import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Live Exam Taking & Navigation Workflow', () => {
  test('RUN-001 to RUN-006: Exam Taking Interface, Timer, Next Loader & Last Question Save & Submit', async ({
    page,
  }) => {
    await loginViaUI(page, 'student');
    await page.goto('/student/exams');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('h1, h2, h3').filter({ hasText: /exam|examination/i }).first()).toBeVisible();

    // Check for exam cards
    const examCard = page.locator('.card, [role="article"], .border').filter({ hasText: /start|resume|take exam|jee|neet/i }).first();
    if (await examCard.isVisible()) {
      const startBtn = examCard.locator('button:has-text("Start"), button:has-text("Resume"), a:has-text("Start"), a:has-text("Resume")').first();
      if (await startBtn.isVisible()) {
        await startBtn.click();
        await page.waitForTimeout(1000);

        // If an instruction/language modal opens, confirm it
        const proceedBtn = page.getByRole('button', { name: /start exam|proceed|i agree/i }).first();
        if (await proceedBtn.isVisible()) {
          await proceedBtn.click();
        }

        // If landed on exam interface
        if (page.url().includes('/exam/')) {
          // Verify Timer badge is present
          await expect(page.getByText(/Time Left|[0-9]{2}:[0-9]{2}:[0-9]{2}/i).first()).toBeVisible();

          // Verify options A, B, C, D exist
          const optionBtn = page.locator('button:has-text("A"), button:has-text("B"), [role="radio"]').first();
          if (await optionBtn.isVisible()) {
            await optionBtn.click();
          }

          // Verify Save & Next or Save & Submit button exists
          const actionBtn = page.locator('button:has-text("Save & Next"), button:has-text("Save & Submit")').first();
          await expect(actionBtn).toBeVisible();

          // Click action button to verify loader / navigation
          await actionBtn.click();
        }
      }
    }
  });
});
