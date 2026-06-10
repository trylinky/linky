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

/**
 * Integration-block data (follower counts, latest posts, …) is cached per
 * block under this tag; revalidate it whenever the block or its linked
 * integration changes.
 */
export function blockCacheTag(blockId: string): string {
  return `block-${blockId}`;
}

const REVALIDATE_TIMEOUT_MS = 3000;
// Keep in sync with MAX_TAGS_PER_REQUEST in apps/frontend/app/api/revalidate/route.ts
const MAX_TAGS_PER_REQUEST = 20;

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

  for (let i = 0; i < tags.length; i += MAX_TAGS_PER_REQUEST) {
    const batch = tags.slice(i, i + MAX_TAGS_PER_REQUEST);

    try {
      const res = await fetch(`${frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': process.env.INTERNAL_API_KEY as string,
        },
        body: JSON.stringify({ tags: batch }),
        signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
      });

      if (!res.ok) {
        console.error(
          `Cache revalidation failed with status ${res.status} for tags: ${batch.join(', ')}`
        );
      }
    } catch (error) {
      console.error('Cache revalidation request failed', error);
      captureException(error);
    }
  }
}
