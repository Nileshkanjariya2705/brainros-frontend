import React, { useEffect } from 'react';

export interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article' | 'course';
  ogImage?: string;
  robots?: string;
  jsonLd?: Record<string, any> | Array<Record<string, any>>;
}

const PRODUCTION_DOMAIN = 'https://www.brainros.com';

const updateMetaTag = (attributeName: string, attributeValue: string, content: string) => {
  let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const updateLinkTag = (rel: string, href: string) => {
  let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
};

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath,
  ogType = 'website',
  ogImage = `${PRODUCTION_DOMAIN}/og-image.png`,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  jsonLd,
}) => {
  useEffect(() => {
    // 1. Update Document Title
    const formattedTitle = title.includes('Brainros') ? title : `${title} | Brainros`;
    document.title = formattedTitle;

    // 2. Canonical URL
    const currentPath = canonicalPath || window.location.pathname;
    const cleanPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`;
    const fullCanonicalUrl = `${PRODUCTION_DOMAIN}${cleanPath === '/' ? '' : cleanPath}`;
    updateLinkTag('canonical', fullCanonicalUrl);

    // 3. Meta Description & Robots
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'robots', robots);
    updateMetaTag('name', 'googlebot', robots);

    // 4. Open Graph Tags
    updateMetaTag('property', 'og:site_name', 'Brainros');
    updateMetaTag('property', 'og:type', ogType);
    updateMetaTag('property', 'og:title', formattedTitle);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:url', fullCanonicalUrl);
    updateMetaTag('property', 'og:image', ogImage);

    // 5. Twitter Card Tags
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', formattedTitle);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', ogImage);

    // 6. Schema.org JSON-LD Structured Data
    const existingScript = document.getElementById('seo-json-ld');
    if (existingScript) {
      existingScript.remove();
    }

    if (jsonLd) {
      const script = document.createElement('script');
      script.id = 'seo-json-ld';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonicalPath, ogType, ogImage, robots, jsonLd]);

  return null;
};

export default SeoHead;
