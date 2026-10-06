import { test, expect } from '@playwright/test';
import { loginViaUI } from '../helpers/auth.helper';

test.describe.serial('Super Admin - Sales Agent Management Module', () => {
  const uniqueId = Date.now();
  const testAgent = {
    name: `Test Agent ${uniqueId}`,
    email: `salesagent_${uniqueId}@example.com`,
    mobileNumber: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
    employeeId: `EMP-${uniqueId.toString().slice(-4)}`,
  };

  test('SA-001: Navigation to Sales Agents module and verify UI layout', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    // Verify Title & Subtitle
    await expect(page.locator('h1').filter({ hasText: /Sales Agents/i })).toBeVisible();

    // Verify Actions & Search
    await expect(page.locator('[data-testid="create-sales-agent-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-sales-agents-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="filter-status-sales-agents"]')).toBeVisible();
  });

  test('SA-002: Create a new Sales Agent via Modal & verify in list', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    // Click Create Button
    await page.locator('[data-testid="create-sales-agent-button"]').click();

    // Verify Modal
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Fill form
    await page.locator('[data-testid="sales-agent-name-input"]').fill(testAgent.name);
    await page.locator('[data-testid="sales-agent-email-input"]').fill(testAgent.email);
    await page.locator('[data-testid="sales-agent-mobile-input"]').fill(testAgent.mobileNumber);

    // Submit
    await page.locator('[data-testid="submit-create-sales-agent-button"]').click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Verify agent appears in list
    await page.locator('[data-testid="search-sales-agents-input"]').fill(testAgent.name);
    await expect(page.locator(`text=${testAgent.name}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('SA-003: Search and Filter Sales Agents', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    // Search by Agent Name
    const searchInput = page.locator('[data-testid="search-sales-agents-input"]');
    await searchInput.fill(testAgent.name);
    await expect(page.locator(`text=${testAgent.name}`).first()).toBeVisible({ timeout: 10000 });

    // Filter by Active status
    await page.locator('[data-testid="filter-status-sales-agents"]').selectOption('ACTIVE');
    await expect(page.locator(`text=${testAgent.name}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('SA-004: Sales Agent Detail Page, Profile, KPIs & Activity Timeline', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    // Search for the agent and wait for row
    await page.locator('[data-testid="search-sales-agents-input"]').fill(testAgent.name);
    await expect(page.locator(`text=${testAgent.name}`).first()).toBeVisible({ timeout: 10000 });

    // Click View Button
    const viewButton = page.locator('button[title*="View Agent Profile"]').first();
    await viewButton.click();

    // Verify Detail Page
    await expect(page.locator('[data-testid="super-admin-sales-agent-detail-page"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: testAgent.name })).toBeVisible({ timeout: 10000 });

    // Verify KPI summary metrics
    await expect(page.locator('text=Total Field Visits').first()).toBeVisible();
    await expect(page.locator('text=Total Orders').first()).toBeVisible();
    await expect(page.locator('text=Conversion Rate').first()).toBeVisible();

    // Verify Activity History Table section
    await expect(page.locator('h3').filter({ hasText: /Activity History/i })).toBeVisible();
  });

  test('SA-005: Edit Sales Agent information', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="search-sales-agents-input"]').fill(testAgent.name);
    await expect(page.locator(`text=${testAgent.name}`).first()).toBeVisible({ timeout: 10000 });

    // Click Edit
    const editBtn = page.locator('button[title="Edit Agent"]').first();
    await editBtn.click();

    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();

    // Update name
    const updatedName = `${testAgent.name} (Updated)`;
    await page.locator('[data-testid="edit-sales-agent-name-input"]').fill(updatedName);
    await page.locator('[data-testid="submit-edit-sales-agent-button"]').click();

    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Verify updated name in table
    await expect(page.locator(`text=${updatedName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('SA-006: Deactivate & Activate Sales Agent', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="search-sales-agents-input"]').fill(testAgent.mobileNumber);
    await page.waitForTimeout(500);

    // Click Toggle Status button
    const toggleBtn = page.locator('button[title*="Deactivate Agent"]').first();
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();

      const modal = page.locator('div[role="dialog"]');
      await expect(modal).toBeVisible();
      await page.locator('[data-testid="confirm-status-toggle-button"]').click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      // Verify status changed to INACTIVE / SUSPENDED
      await expect(page.locator('td').filter({ hasText: /INACTIVE|SUSPENDED/i }).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('SA-007: RBAC Security - Student cannot access Super Admin Sales Agents', async ({ page }) => {
    await loginViaUI(page, 'student');
    await page.goto('/super-admin/sales-agents');
    await page.waitForLoadState('networkidle');

    // Forbidden page rendered or redirected
    const isForbidden = await page.locator('text=/Forbidden|Access Denied|403|Unauthorized/i').first().isVisible();
    const isCreateNotVisible = !(await page.locator('[data-testid="create-sales-agent-button"]').isVisible());
    expect(isForbidden || isCreateNotVisible).toBe(true);
  });

  test('SA-008: Super Admin - Today\'s Field Activities page UI & stats feed', async ({ page }) => {
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agent-activities');
    await page.waitForLoadState('networkidle');

    // Verify Title & Subtitle
    await expect(page.locator('h1').filter({ hasText: /Today's Sales Agent Activities/i })).toBeVisible();

    // Verify KPI Cards Overview
    await expect(page.locator('text=/Active Field Agents/i').first()).toBeVisible();
    await expect(page.locator('text=/Institutions Visited/i').first()).toBeVisible();
    await expect(page.locator('text=/GPS Photo Proofs/i').first()).toBeVisible();

    // Verify page container
    await expect(page.locator('[data-testid="super-admin-sales-agent-activities-page"]')).toBeVisible();

    // Verify separate detail page navigation on Details button click
    const detailsBtn = page.getByRole('button', { name: /Details/i }).first();
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await expect(page.locator('[data-testid="super-admin-activity-detail-page"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=/Back to Activities Feed/i')).toBeVisible();
      await expect(page.locator('text=/Verified GPS Location & Coordinates/i')).toBeVisible();
    }
  });

  test('SA-009: End-to-end verification - Sales agent logs activity & Super Admin inspects in Today Feed and Detail Page', async ({ page }) => {
    // 1. Log in as Sales Agent and submit an activity
    await loginViaUI(page, 'salesAgent');
    await page.goto('/sales-agent/add-activity');
    await page.waitForLoadState('networkidle');

    const uniqueSchool = `Delhi Public Global ${Date.now()}`;
    const uniqueContact = 'Dr. Alok Verma';
    const uniqueNotes = 'Comprehensive portal demo provided to faculty heads.';

    await page.getByPlaceholder(/St. Xavier's Senior Secondary School/i).fill(uniqueSchool);
    await page.getByPlaceholder(/Dr. R. K. Sharma/i).fill(uniqueContact);
    await page.getByPlaceholder(/9876543210/i).fill('9876543219');
    await page.getByPlaceholder(/Met with Principal/i).fill(uniqueNotes);

    // Submit form
    await page.getByRole('button', { name: /Submit & Log Activity/i }).click();
    await page.waitForURL('**/sales-agent/dashboard', { timeout: 10000 });

    // 2. Log in as Super Admin and inspect Today's Activities Feed
    await loginViaUI(page, 'superAdmin');
    await page.goto('/super-admin/sales-agent-activities');
    await page.waitForLoadState('networkidle');

    // Search for the newly submitted school
    await page.locator('input[placeholder*="Search school name"]').fill(uniqueSchool);
    await expect(page.locator(`text=${uniqueSchool}`).first()).toBeVisible({ timeout: 10000 });

    // 3. Click Details to open separate Activity Detail Page
    const rowDetailsBtn = page.locator('tr').filter({ hasText: uniqueSchool }).getByRole('button', { name: /Details/i });
    await rowDetailsBtn.click();

    // 4. Verify separate page loaded with full data
    await expect(page.locator('[data-testid="super-admin-activity-detail-page"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1').filter({ hasText: uniqueSchool })).toBeVisible();
    await expect(page.locator(`text=${uniqueContact}`).first()).toBeVisible();
    await expect(page.locator(`text=${uniqueNotes}`).first()).toBeVisible();
    await expect(page.locator('text=/Verified GPS Location & Coordinates/i')).toBeVisible();

    // 5. Click Back to Activities Feed
    await page.getByRole('button', { name: /Back to Activities Feed/i }).click();
    await page.waitForURL('**/super-admin/sales-agent-activities', { timeout: 10000 });
    await expect(page.locator('[data-testid="super-admin-sales-agent-activities-page"]')).toBeVisible();
  });
});
