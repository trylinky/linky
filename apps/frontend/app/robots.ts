import type { MetadataRoute } from 'next';

const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
];

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
