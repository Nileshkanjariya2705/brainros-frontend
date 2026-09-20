import { test, expect } from '@playwright/test';

interface PageSeoExpectation {
  path: string;
  expectedH1Contains: string;
  expectedTitleContains: string;
  expectedCanonical: string;
}

const PUBLIC_PAGES: PageSeoExpectation[] = [
  {
    path: '/',
    expectedH1Contains: 'Smarter Online Exams',
    expectedTitleContains: 'Brainros',
    expectedCanonical: 'https://www.brainros.com/',
  },
  {
    path: '/about',
    expectedH1Contains: 'Empowering Educational Institutions',
    expectedTitleContains: 'About Brainros',
    expectedCanonical: 'https://www.brainros.com/about',
  },
  {
    path: '/features',
    expectedH1Contains: 'World-Class Online Exams',
    expectedTitleContains: 'Features',
    expectedCanonical: 'https://www.brainros.com/features',
  },
  {
    path: '/services',
    expectedH1Contains: 'Academic Excellence',
    expectedTitleContains: 'Services',
    expectedCanonical: 'https://www.brainros.com/services',
  },
  {
    path: '/exams',
    expectedH1Contains: 'Competitive Exam Solutions',
    expectedTitleContains: 'Exams',
    expectedCanonical: 'https://www.brainros.com/exams',
  },
  {
    path: '/exams/jee',
    expectedH1Contains: 'JEE Practice Exams',
    expectedTitleContains: 'JEE',
    expectedCanonical: 'https://www.brainros.com/exams/jee',
  },
  {
    path: '/exams/neet',
    expectedH1Contains: 'NEET Practice Exams',
    expectedTitleContains: 'NEET',
    expectedCanonical: 'https://www.brainros.com/exams/neet',
  },
  {
    path: '/exams/cet',
    expectedH1Contains: 'CET Practice Exams',
    expectedTitleContains: 'CET',
    expectedCanonical: 'https://www.brainros.com/exams/cet',
  },
  {
    path: '/contact',
    expectedH1Contains: 'Get in Touch with',
    expectedTitleContains: 'Contact',
    expectedCanonical: 'https://www.brainros.com/contact',
  },
  {
    path: '/faq',
    expectedH1Contains: 'Frequently Asked',
    expectedTitleContains: 'FAQ',
    expectedCanonical: 'https://www.brainros.com/faq',
  },
  {
    path: '/privacy-policy',
    expectedH1Contains: 'Privacy Policy',
    expectedTitleContains: 'Privacy Policy',
    expectedCanonical: 'https://www.brainros.com/privacy-policy',
  },
  {
    path: '/terms',
    expectedH1Contains: 'Terms of Service',
    expectedTitleContains: 'Terms of Service',
    expectedCanonical: 'https://www.brainros.com/terms',
  },
];

test.describe('Public Marketing Pages SEO Verification', () => {
  for (const pageItem of PUBLIC_PAGES) {
    test(`SEO audit for ${pageItem.path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      const response = await page.goto(pageItem.path, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);

      // 1. Verify Page Title (auto-waiting for SeoHead client-side update)
      await expect(page).toHaveTitle(new RegExp(pageItem.expectedTitleContains, 'i'));
      await expect(page).toHaveTitle(/Brainros/);

      // 2. Verify Exactly One H1
      const h1Elements = page.locator('h1');
      await expect(h1Elements).toHaveCount(1);
      await expect(h1Elements.first()).toContainText(pageItem.expectedH1Contains);

      // 3. Verify Meta Description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveCount(1);
      const descContent = await metaDescription.getAttribute('content');
      expect(descContent).toBeTruthy();
      expect(descContent!.length).toBeGreaterThan(30);

      // 4. Verify Canonical Tag
      const canonicalTag = page.locator('link[rel="canonical"]');
      await expect(canonicalTag).toHaveCount(1);
      const canonicalHref = await canonicalTag.getAttribute('href');
      expect(canonicalHref).toBe(pageItem.expectedCanonical);

      // 5. Verify Open Graph Tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveCount(1);
      const ogDesc = page.locator('meta[property="og:description"]');
      await expect(ogDesc).toHaveCount(1);
      const ogUrl = page.locator('meta[property="og:url"]');
      await expect(ogUrl).toHaveCount(1);
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toHaveCount(1);

      // 6. Verify Twitter Card Tags
      const twitterCard = page.locator('meta[name="twitter:card"]');
      await expect(twitterCard).toHaveCount(1);
      expect(await twitterCard.getAttribute('content')).toBe('summary_large_image');

      // 7. Verify Schema.org JSON-LD Structured Data
      const jsonLdScript = page.locator('#seo-json-ld');
      if ((await jsonLdScript.count()) > 0) {
        const textContent = await jsonLdScript.textContent();
        expect(textContent).toBeTruthy();
        expect(() => JSON.parse(textContent!)).not.toThrow();
      }

      // Filter out non-critical network/favicon error logs
      const criticalErrors = consoleErrors.filter(
        (err) =>
          !err.includes('favicon') &&
          !err.includes('socket.io') &&
          !err.includes('Failed to load resource'),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  }

  test('Redirects /privacy to /privacy-policy', async ({ page }) => {
    await page.goto('/privacy');
    await page.waitForURL('**/privacy-policy');
    expect(page.url()).toContain('/privacy-policy');
  });

  test('Mobile responsive rendering check on /faq', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/faq');
    await page.waitForTimeout(500);

    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check that accordion buttons can be expanded on mobile
    const firstAccordionBtn = page.locator('button[aria-expanded]').first();
    await expect(firstAccordionBtn).toBeVisible();
    await firstAccordionBtn.click();
    await page.waitForTimeout(200);
  });
});
