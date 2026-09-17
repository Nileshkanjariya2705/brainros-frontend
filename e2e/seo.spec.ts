import { test, expect } from '@playwright/test';

test.describe('Brainros SEO Suite — Public Pages & Metadata Verification', () => {
  test('Homepage has correct SEO title, description, canonical, OG tags, and JSON-LD', async ({ page }) => {
    await page.goto('/');

    // Title
    const title = await page.title();
    expect(title).toContain('Brainros — AI-Powered Online Examination');

    // Description
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toBeTruthy();
    expect(metaDescription).toContain('Brainros');

    // Canonical Link
    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.brainros.com');

    // Open Graph Tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toContain('Brainros');

    const ogSiteName = await page.getAttribute('meta[property="og:site_name"]', 'content');
    expect(ogSiteName).toBe('Brainros');

    // H1 Heading
    const h1Text = await page.textContent('h1');
    expect(h1Text).toBeTruthy();

    // JSON-LD Structured Data
    const jsonLdContent = await page.textContent('#seo-json-ld');
    expect(jsonLdContent).toBeTruthy();
    const jsonLd = JSON.parse(jsonLdContent || '[]');
    expect(Array.isArray(jsonLd)).toBe(true);
  });

  test('Public Exams Directory (/exams) has unique SEO metadata and BreadcrumbList JSON-LD', async ({ page }) => {
    await page.goto('/exams');

    const title = await page.title();
    expect(title).toContain('Public Practice Exams');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.brainros.com/exams');

    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    expect(metaDescription).toContain('competitive online examination');

    const jsonLdContent = await page.textContent('#seo-json-ld');
    expect(jsonLdContent).toContain('BreadcrumbList');
  });

  test('Public Exam Target Hub (/exams/neet) has custom NEET title, description, and Course JSON-LD', async ({ page }) => {
    await page.goto('/exams/neet');

    const title = await page.title();
    expect(title).toContain('NEET Online Exams');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.brainros.com/exams/neet');

    const jsonLdContent = await page.textContent('#seo-json-ld');
    expect(jsonLdContent).toContain('Course');
  });

  test('About Page (/about) has correct SEO metadata and EducationalOrganization JSON-LD', async ({ page }) => {
    await page.goto('/about');

    const title = await page.title();
    expect(title).toContain('About Brainros');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.brainros.com/about');

    const jsonLdContent = await page.textContent('#seo-json-ld');
    expect(jsonLdContent).toContain('EducationalOrganization');
  });

  test('Contact Page (/contact) has correct SEO metadata and ContactPoint JSON-LD', async ({ page }) => {
    await page.goto('/contact');

    const title = await page.title();
    expect(title).toContain('Contact Brainros');

    const canonical = await page.getAttribute('link[rel="canonical"]', 'href');
    expect(canonical).toBe('https://www.brainros.com/contact');

    const jsonLdContent = await page.textContent('#seo-json-ld');
    expect(jsonLdContent).toContain('ContactPoint');
  });

  test('Login Page (/login) and Register Page (/register) have unique SEO titles and canonicals', async ({ page }) => {
    await page.goto('/login');
    expect(await page.title()).toContain('Student & Institution Login');
    expect(await page.getAttribute('link[rel="canonical"]', 'href')).toBe('https://www.brainros.com/login');

    await page.goto('/register');
    expect(await page.title()).toContain('Student Registration');
    expect(await page.getAttribute('link[rel="canonical"]', 'href')).toBe('https://www.brainros.com/register');
  });

  test('robots.txt disallows private portals and references sitemap.xml', async ({ page }) => {
    const response = await page.goto('/robots.txt');
    expect(response?.status()).toBe(200);

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toContain('Disallow: /student/');
    expect(body).toContain('Disallow: /admin/');
    expect(body).toContain('Disallow: /super-admin/');
    expect(body).toContain('Sitemap: https://www.brainros.com/sitemap.xml');
  });

  test('sitemap.xml lists production HTTPS URLs', async ({ page }) => {
    const response = await page.goto('/sitemap.xml');
    expect(response?.status()).toBe(200);

    const body = await page.content();
    expect(body).toContain('https://www.brainros.com/');
    expect(body).toContain('https://www.brainros.com/exams');
    expect(body).toContain('https://www.brainros.com/exams/neet');
    expect(body).toContain('https://www.brainros.com/about');
    expect(body).toContain('https://www.brainros.com/contact');
  });
});
