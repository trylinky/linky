import type { MetadataRoute } from 'next';
import { AI_CRAWLERS } from '@trylinky/seo';

// NOTE: with basePath '/i' this serves at lin.ky/i/robots.txt, which crawlers do
// not read - the authoritative robots.txt for lin.ky is apps/frontend/app/robots.ts.
// Kept for correctness if the marketing app is ever served on its own domain.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: 'https://lin.ky/sitemap.xml',
  };
}
