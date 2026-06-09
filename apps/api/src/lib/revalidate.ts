import { captureException } from '@sentry/node';

/**
 * Cache tags for the public page route. Must stay in sync with the tags set
 * in apps/frontend/app/lib/actions/page-actions.ts.
 *
 * `page-id-{id}` invalidates all cached content for a page INCLUDING every
 * cached slug/domain lookup that resolved to it (those entries are tagged
 * with both). The slug tag is only needed to clear cached "not found"
 * lookups, e.g. when a new page claims a previously-404ing slug.
 */
export function pageIdCacheTag(pageId: string): string {
  return `page-id-${pageId}`;
}

export function pageSlugCacheTag(slug: string, domain: string): string {
  return `page-slug-${slug}-${domain}`;
}

const REVALIDATE_TIMEOUT_MS = 3000;

/**
 * Tell the frontend to drop cached public-page data for the given tags.
 *
 * Fire-and-forget semantics: failures are reported but never thrown, so a
 * lost revalidation can never fail the mutation that triggered it. The
 * frontend's daily background revalidate is the backstop for missed calls.
 */
export async function revalidatePageCache(tags: string[]): Promise<void> {
  const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!frontendUrl || tags.length === 0) {
    return;
  }

  try {
    const res = await fetch(`${frontendUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': process.env.INTERNAL_API_KEY as string,
      },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(
        `Cache revalidation failed with status ${res.status} for tags: ${tags.join(', ')}`
      );
    }
  } catch (error) {
    console.error('Cache revalidation request failed', error);
    captureException(error);
  }
}
