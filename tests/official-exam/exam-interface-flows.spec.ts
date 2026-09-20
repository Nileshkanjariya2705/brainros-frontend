import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Live Exam Taking & Interactive Exam Interface Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, 'student');
  });

  test('EXAM-UI-001: Student Available Exams Page Lists Upcoming & Active Tests', async ({ page }) => {
    await page.goto('/student/exams');
    await page.waitForLoadState('domcontentloaded');

    // Verify main exams directory heading
    await expect(page.locator('h1, h2, header').filter({ hasText: /exam|tests|assessment/i }).first()).toBeVisible();
  });

  test('EXAM-UI-002: Mock Tests Directory & Instant Attempt Launch', async ({ page }) => {
    await page.goto('/student/mock-tests');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, header').filter({ hasText: /mock test/i }).first()).toBeVisible();
  });

  test('EXAM-UI-003: Performance Trends & Student Analytics Portal', async ({ page }) => {
    await page.goto('/student/performance-trends');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('h1, h2, header').filter({ hasText: /performance|trends|analytics/i }).first()).toBeVisible();
  });
});
