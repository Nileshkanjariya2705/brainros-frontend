import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import SeoHead, { PRODUCTION_DOMAIN } from './SeoHead';

describe('SeoHead Component', () => {
  beforeEach(() => {
    // Clear head elements between tests
    document.head.innerHTML = '';
    document.title = '';
  });

  it('sets document title and formats with Brainros suffix when needed', () => {
    render(
      <SeoHead
        title="Features"
        description="Comprehensive feature suite for online examination"
        canonicalPath="/features"
      />,
    );

    expect(document.title).toBe('Features | Brainros');
  });

  it('preserves existing Brainros in title without duplicating', () => {
    render(
      <SeoHead
        title="About Brainros — Online Examination Platform"
        description="Learn about our online examination platform"
        canonicalPath="/about"
      />,
    );

    expect(document.title).toBe('About Brainros — Online Examination Platform');
  });

  it('sets meta description, author, and robots tags correctly', () => {
    render(
      <SeoHead
        title="Contact Us"
        description="Get in touch with Brainros for school and coaching institute test series."
        canonicalPath="/contact"
      />,
    );

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta).not.toBeNull();
    expect(descMeta?.getAttribute('content')).toBe(
      'Get in touch with Brainros for school and coaching institute test series.',
    );

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta).not.toBeNull();
    expect(robotsMeta?.getAttribute('content')).toContain('index, follow');

    const authorMeta = document.querySelector('meta[name="author"]');
    expect(authorMeta).not.toBeNull();
    expect(authorMeta?.getAttribute('content')).toBe('Brainros');
  });

  it('sets normalized canonical URL tag for root and subpaths', () => {
    const { unmount } = render(
      <SeoHead
        title="Home"
        description="Home page description"
        canonicalPath="/"
      />,
    );

    const canonicalLinkRoot = document.querySelector('link[rel="canonical"]');
    expect(canonicalLinkRoot).not.toBeNull();
    expect(canonicalLinkRoot?.getAttribute('href')).toBe(`${PRODUCTION_DOMAIN}/`);

    unmount();

    render(
      <SeoHead
        title="Services"
        description="Services page description"
        canonicalPath="/services"
      />,
    );

    const canonicalLinkServices = document.querySelector('link[rel="canonical"]');
    expect(canonicalLinkServices?.getAttribute('href')).toBe(`${PRODUCTION_DOMAIN}/services`);
  });

  it('renders Open Graph and Twitter Card tags', () => {
    render(
      <SeoHead
        title="JEE Practice Exams"
        description="Prepare for IIT JEE Main & Advanced"
        canonicalPath="/exams/jee"
        ogType="course"
      />,
    );

    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe(
      'Brainros',
    );
    expect(document.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      'en_US',
    );
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe(
      'course',
    );
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      `${PRODUCTION_DOMAIN}/exams/jee`,
    );
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'JEE Practice Exams | Brainros',
    );

    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      'JEE Practice Exams | Brainros',
    );
  });

  it('renders valid Schema.org JSON-LD script', () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: 'Brainros',
      url: 'https://www.brainros.com',
    };

    render(
      <SeoHead
        title="About Us"
        description="About Brainros"
        canonicalPath="/about"
        jsonLd={jsonLd}
      />,
    );

    const script = document.getElementById('seo-json-ld');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    const parsed = JSON.parse(script?.textContent || '{}');
    expect(parsed['@type']).toBe('EducationalOrganization');
    expect(parsed.name).toBe('Brainros');
  });
});
