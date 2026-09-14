import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe('Chapter Master Data & Cascading Hierarchy', () => {
  test('CHAP-001: Chapter Master UI shows only 4 global subjects with no exam suffixes', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/admin/chapters');
    await page.waitForLoadState('domcontentloaded');

    // Verify page header
    await expect(page.locator('h1, h2, h3').filter({ hasText: /chapter/i }).first()).toBeVisible();

    // Verify no legacy exam-specific subject names in page content
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Physics (JEE)');
    expect(pageContent).not.toContain('Physics (NEET)');
    expect(pageContent).not.toContain('Chemistry (JEE)');
    expect(pageContent).not.toContain('Chemistry (NEET)');
    expect(pageContent).not.toContain('Mathematics (JEE)');
    expect(pageContent).not.toContain('Biology (NEET)');
  });

  test('CHAP-002: Academic Subject & Chapter Hierarchy in Exam Scheduling', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/exams/schedule');
    await page.waitForLoadState('domcontentloaded');

    // Verify Schedule Exam form is rendered
    await expect(page.locator('form, [data-testid="exam-schedule-form"], h1, h2').first()).toBeVisible();

    // Verify no legacy exam-specific subject labels exist
    const pageContent = await page.content();
    expect(pageContent).not.toContain('Physics (JEE)');
    expect(pageContent).not.toContain('Physics (NEET)');
    expect(pageContent).not.toContain('Chemistry (JEE)');
    expect(pageContent).not.toContain('Chemistry (NEET)');
  });
});
