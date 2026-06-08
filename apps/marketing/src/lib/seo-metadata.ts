import type { Metadata } from 'next';

const BASE = 'https://lin.ky';

/**
 * Builds consistent, answer-first metadata for marketing pages. `description`
 * should lead with the direct answer to the page's target query — not a brand
 * tagline (GEO/AI-search best practice, June 2026).
 */
export function buildPageMetadata(input: {
  title: string;
  description: string;
  /** Path including the /i basePath, e.g. "/i/pricing". */
  path: string;
  ogImage?: string;
}): Metadata {
  const url = `${BASE}${input.path}`;
  const image = input.ogImage ?? `${BASE}/assets/og.png`;
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: 'Linky',
      type: 'website',
      images: [{ url: image }],
    },
    twitter: { card: 'summary_large_image', site: '@trylinky', creator: '@trylinky', images: image },
  };
}
