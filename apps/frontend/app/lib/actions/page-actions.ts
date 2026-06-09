import { apiServerFetch } from '@/app/lib/api-server';
import { publicApiFetch } from '@/app/lib/public-read';
import { cacheLife, cacheTag } from 'next/cache';

export async function getPageIdBySlugOrDomain(slug: string, domain: string) {
  const res = await apiServerFetch(
    `/pages/internal/slug-or-domain?slug=${slug}&domain=${domain}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.INTERNAL_API_KEY as string,
      },
    }
  );

  if (res.status !== 200) {
    return null;
  }

  const data = await res.json();

  return data;
}

export async function getPageLoadData(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/internal/load`, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.INTERNAL_API_KEY as string,
    },
  });

  const data = await res.json();

  return data;
}

export async function getPageTheme(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/theme`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageLayout(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/layout`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageSettings(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/settings`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageBlocks(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/blocks`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

/**
 * ---------------------------------------------------------------------------
 * Cacheable PUBLIC read variants.
 *
 * Used ONLY by the session-free public `/[domain]/[slug]` route. These mirror
 * the editor read functions above but use `publicApiFetch` (no cookies/headers,
 * cache-safe) and are wrapped in `'use cache'` with a tag + long `cacheLife`.
 *
 * Do NOT use these from the editor (`/e/*`) — owner/unpublished data must keep
 * forwarding the session cookie via the non-cached functions above.
 *
 * Revalidation is explicit, not TTL-driven: publish/theme/settings server
 * actions `revalidateTag` in-process, and apps/api mutations (block CRUD,
 * layout saves, page create/delete) call POST /api/revalidate with the same
 * tags. The 'days' profile (daily background refresh) is only a safety net
 * for a missed invalidation.
 * ---------------------------------------------------------------------------
 */

export async function getPublicPageBySlugOrDomain(slug: string, domain: string) {
  'use cache';
  cacheLife('days');
  cacheTag(`page-slug-${slug}-${domain}`);

  const res = await publicApiFetch(
    `/pages/internal/slug-or-domain?slug=${slug}&domain=${domain}`,
    {
      headers: {
        'x-api-key': process.env.INTERNAL_API_KEY as string,
      },
    }
  );

  if (res.status !== 200) {
    return null;
  }

  const data = await res.json();

  // Also tag by the resolved id so a single `revalidateTag('page-id-' + id)`
  // invalidates everything for the page (content AND this slug->id lookup).
  if (data?.id) {
    cacheTag(`page-id-${data.id}`);
  }

  return data;
}

export async function getPublicPageLoadData(pageId: string) {
  'use cache';
  cacheLife('days');
  cacheTag(`page-id-${pageId}`);

  const res = await publicApiFetch(`/pages/${pageId}/internal/load`, {
    headers: {
      'x-api-key': process.env.INTERNAL_API_KEY as string,
    },
  });

  if (res.status !== 200) {
    return null;
  }

  return res.json();
}

export async function getPublicPageLayout(pageId: string) {
  'use cache';
  cacheLife('days');
  cacheTag(`page-id-${pageId}`);

  const res = await publicApiFetch(`/pages/${pageId}/layout`);

  return res.json();
}

export async function getPublicPageTheme(pageId: string) {
  'use cache';
  cacheLife('days');
  cacheTag(`page-id-${pageId}`);

  const res = await publicApiFetch(`/pages/${pageId}/theme`);

  return res.json();
}

export async function getPublicPageBlocks(pageId: string) {
  'use cache';
  cacheLife('days');
  cacheTag(`page-id-${pageId}`);

  const res = await publicApiFetch(`/pages/${pageId}/blocks`);

  return res.json();
}
