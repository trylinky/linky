# Public Page Performance & Cache-First Architecture — Design

**Date:** 2026-06-09
**Status:** Draft

## Goal

Public profile pages (`/[domain]/[slug]`) load instantly — served from cache by
default, on every request. Freshness comes from explicit invalidation when the
owner updates their page, not from short TTLs. Secondary goal: remove the
self-inflicted overhead found in the 2026-06-09 performance review (API
logging, Sentry sampling, bundle weight, slow reactions endpoint).

Measured today (live, lin.ky/alex): TTFB ~600ms, HTML complete ~1s, full load
3.2–4.3s. Target: HTML from cache in <100ms TTFB, full load <1.5s.

## Why public pages are slow today

The route already has a partial cache layer (`'use cache'` on the public read
functions in `app/lib/actions/page-actions.ts`, tagged `page-id-{id}` /
`page-slug-{slug}-{domain}`), but four things defeat it:

1. **The route itself is never cached.** `next.config.ts` enables only the
   narrow `experimental.useCache` flag, not Cache Components/PPR. Every view
   invokes a server function and renders the full RSC tree per request. Only
   the *data fetches inside* are cached; the render is not, and nothing is
   served from the CDN.
2. **The data cache expires every minute.** All five public read functions use
   `cacheLife('minutes')` (revalidate ≈ 1 min). Most profile pages get modest
   traffic, so a large share of requests miss the cache and pay 3–5 HTTP
   round trips to api.lin.ky — an API that is itself slowed by per-query
   `console.log`, 100% Sentry tracing/profiling, no compression, and a global
   `Cache-Control: no-store`.
3. **Integration blocks bypass the cache entirely.** Instagram / TikTok /
   Spotify / GitHub block server components (`lib/blocks/*/ui-server.tsx`) run
   per request: a Prisma lookup, an external API call, and sometimes inline
   token-refresh *writes* — streamed via Suspense, which holds the document
   open. In the browser the HTML "download" phase is ~2.3s of the total.
4. **The client finishes it off.** ~900KB gz of JS including an eagerly-loaded
   441KB gz mapbox-gl chunk, hydration, then a 400ms–1s client fetch to
   `GET /reactions` and a ~200ms PostHog flags fetch.

`generateMetadata`, the layout, and the page each call the same read functions
(`getPublicPageBySlugOrDomain` ×3, `getPublicPageLayout` ×2). Within a cache
window `'use cache'` dedupes them; on a miss they multiply the API round trips.

## Design

### A. Cache-first rendering (Cache Components / PPR)

Enable full Cache Components in `apps/frontend/next.config.ts`:

```ts
const nextConfig: NextConfig = {
  cacheComponents: true,  // replaces experimental.useCache
  ...
};
```

With this, the public page becomes three layers:

- **Static shell** (layout chrome, footer, grid container): prerendered,
  served instantly from the CDN.
- **Cached content** (page data, blocks, layout, theme): the existing
  `'use cache'` functions, switched from `cacheLife('minutes')` to a long
  profile so the cache is the default serving path:

  ```ts
  cacheLife({
    stale: 300,          // client may use its copy for 5 min
    revalidate: 86400,   // background refresh at most daily (safety net)
    expire: Infinity,    // never hard-expire; invalidation is explicit
  });
  ```

  Freshness is owned by tag invalidation (section B), not the TTL. The daily
  `revalidate` is a belt-and-braces safety net against missed invalidations.
- **Dynamic islands** (integration blocks until C lands, reactions): wrapped
  in `Suspense`, streamed after the cached shell paints.

`cacheComponents: true` applies app-wide: any route that reads
`cookies()`/`headers()` outside a Suspense boundary becomes a build error.
The editor (`/e/*`) and auth routes read session cookies, so part of this task
is an audit pass adding Suspense boundaries (or `'use cache: private'`) where
the build demands them. This is the main migration cost and why A ships as its
own PR.

The per-page `opengraph-image` route gets the same treatment: `'use cache'` +
`page-id-{id}` tag.

### B. Revalidation bridge (API → Next.js cache)

Mutations happen in two places today; only one can invalidate the cache:

- Next server actions (theme/settings dialogs) — already call
  `revalidateTag`. Switch to `updateTag` where the owner expects to see the
  change immediately on their own page.
- **The Fastify API (block add/update/delete, layout save, page CRUD,
  publish) — currently cannot touch Next's cache at all.** This is why the
  current design needed 1-minute TTLs.

Add a revalidation endpoint in the frontend:

```
POST /api/revalidate
Header: x-internal-api-key: <INTERNAL_API_KEY>
Body: { "tags": ["page-id-...", "page-slug-..."] }
→ revalidateTag(tag) for each; 204
```

And a small helper in `apps/api`:

```ts
// apps/api/src/lib/revalidate.ts
export async function revalidatePageCache(tags: string[]): Promise<void>
```

- Fire-and-forget with a short timeout; failures are logged to Sentry but
  never fail the mutation (the daily TTL backstops a lost invalidation).
- Called after every successful mutation that affects public page content:

| Mutation (apps/api) | Tags revalidated |
|---|---|
| Block create / update / delete | `page-id-{pageId}` |
| Layout update (`POST /pages/:id/layout`) | `page-id-{pageId}` |
| Theme change / theme update | `page-id-{pageId}` (all pages using the theme) |
| Page settings (incl. publish/unpublish, meta) | `page-id-{pageId}` + `page-slug-{slug}-{domain}` |
| Slug or custom-domain change | `page-id-{id}` + old **and** new `page-slug-*` tags |
| Page delete | `page-id-{id}` + `page-slug-{slug}-{domain}` |

The existing tag scheme already supports this: `getPublicPageBySlugOrDomain`
tags itself with both the slug tag and the resolved `page-id-{id}`, so a
single `page-id` revalidation invalidates content *and* the slug→id lookup.

Unpublish/delete correctness: the cached page render checks `publishedAt` and
404s; revalidating the tags on unpublish means the next request re-renders and
caches the 404. No stale published page can outlive an invalidation.

### C. Integration blocks off the request path

Today each integration block fetches the external API during render. Change to
cache-backed with stale-serving:

- Wrap each block's `fetchData` in `'use cache'`, tagged `block-{blockId}`,
  `cacheLife('hours')` — follower counts may be up to an hour stale, which is
  acceptable.
- On external API failure, serve the cached/stale value instead of blank.
- Move token refresh out of the render path: a scheduled job in `apps/api`
  refreshes expiring integration tokens (the render path only *reads* the
  stored token). Render-time Prisma *writes* from the frontend are removed.
- Editing/reconnecting an integration revalidates `block-{blockId}` via the
  same bridge.

With A+C, a profile page render touches no external service and no database on
the cached path.

### D. Reactions fast path

Reactions stay dynamic (per-visitor `current` state) but stop being slow:

- Handler (`GET /reactions`): replace the full `prisma.page.findUnique` row
  fetch with `select: { id: true }` — or drop the existence check entirely and
  rely on the DynamoDB lookup returning empty.
- Verify `AWS_REGION` co-location of the DynamoDB table with the API host;
  the measured 400ms+ smells like a cross-region round trip.
- Client: fetch reactions after hydration at low priority (it already renders
  a zero state; just ensure it never blocks paint or competes with hydration).

### E. API and bundle hygiene (from the 2026-06-09 review)

Quick wins, each its own commit:

1. Gate the Prisma `$allOperations` `console.log` on `NODE_ENV !== 'production'`
   (`apps/api/src/lib/prisma.ts:14`); same for the frontend client's dev branch.
2. Sentry sampling: `tracesSampleRate`/`profilesSampleRate` 1.0 → 0.1 in the
   API; client `tracesSampleRate` 1.0 → 0.1.
3. Remove `@prisma/extension-optimize` from the production frontend client.
4. Lazy-load mapbox-gl (`next/dynamic` inside the map block) — removes 441KB gz
   from initial profile-page load.
5. Tinybird tracker: `strategy="lazyOnload"`, non-blocking `_getLocation()`.
6. Scope the API's global `Cache-Control: no-store` hook to authenticated
   routes; public reads get `public, max-age=60, stale-while-revalidate=300`
   (defense in depth under the Next cache; required anyway once C makes the
   frontend hit these endpoints only on revalidation).
7. Register `@fastify/compress`; remove `@fastify/express` if confirmed unused.
8. Editor layout waterfall: merge the two sequential `Promise.all` batches in
   `app/e/[slug]/layout.tsx:48-57` into one.
9. Prisma: composite indexes `@@index([organizationId, deletedAt])` and
   slug+deletedAt; `select: { role: true }` on role checks; `count()` instead
   of `findMany` for page limits; `deleteMany` for block deletion.
10. Move `react-grid-layout.scss` from the root layout to the editor layout;
    longer-term, render the public grid with pure CSS (no react-grid-layout JS
    on public pages).

## Rollout

| Phase | Contents | Risk |
|---|---|---|
| 1 | E1–E5 (config/one-liners) | Low — measurable immediately |
| 2 | B revalidation bridge (endpoint + API helper + call sites), still on `minutes` TTL | Low — additive |
| 3 | A `cacheComponents: true` + long `cacheLife` + Suspense audit | Medium — app-wide flag; needs full QA of editor + auth flows |
| 4 | C integration blocks, D reactions, E6–E10 | Low–medium |

Phases 2 before 3 deliberately: explicit invalidation must be proven (logs/
metrics on the revalidate endpoint) before TTLs are lengthened.

## Verification

- Re-run the live benchmark after each phase against the 2026-06-09 baseline
  (`.gstack/benchmark-reports/baselines/baseline-2026-06-09.md`).
- Phase 3 acceptance: cached profile page TTFB <100ms (CDN hit); editing a
  block in the editor and reloading the public page shows the change in <5s.
- Unpublish a page → public URL 404s on next request.
- Slug change → old slug 404s, new slug serves, no stale cache.
- Integration block shows stale-but-present data when the external API is down.

## Out of scope

- Replacing SWR with server mutations in the editor (would let everything use
  `updateTag` in-process, but is a large editor refactor).
- Moving frontend Prisma usage fully behind the API.
- CDN-level caching of api.lin.ky responses beyond the headers in E6.
