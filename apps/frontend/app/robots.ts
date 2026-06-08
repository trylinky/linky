import type { MetadataRoute } from 'next';
import { AI_CRAWLERS } from '@trylinky/seo';

const DISALLOWED = ['/api/', '/new-api/', '/_next/', '/e/', '/edit', '/new', '/invite'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOWED },
      // Explicitly welcome AI crawlers on public content.
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: DISALLOWED })),
    ],
    sitemap: 'https://lin.ky/sitemap.xml',
  };
}
