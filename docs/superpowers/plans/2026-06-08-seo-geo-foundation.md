# SEO/GEO Foundation (Spec 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the technical + GEO foundation — reusable JSON-LD schema, quality-gated indexing for public user pages, AI-crawler-aware robots, answer-first metadata, and measurement — so the PSEO engine (Specs 2–3) launches onto solid, measurable ground.

**Architecture:** A new pure-TS `@trylinky/seo` package holds the correctness-critical logic (the `shouldIndexPage` gate + JSON-LD builders) with real Vitest unit tests — both Next apps import it. The `apps/api` public page payload is extended with the three signals the gate needs (`isFeatured`, `verifiedAt`, `isPaid`). The frontend public route applies the gate (robots + gated `ProfilePage` schema); the marketing app gets `Organization`/`WebSite` schema, a shared answer-first metadata helper, the blog canonical fix, dynamic `robots.ts`, sitemap structure for PSEO (never user pages), `llms.txt`, and GSC verification.

**Tech Stack:** Next.js 16 (App Router, Metadata API), Fastify + Prisma (`apps/api`), TypeScript, Vitest (newly introduced), Turborepo/pnpm workspaces.

**Spec:** `docs/superpowers/specs/2026-06-08-seo-geo-foundation-design.md`

**Branch:** `seo/geo-foundation` (already created; holds the spec commit).

---

## Conventions & key facts (read before starting)

- **Monorepo:** pnpm workspaces glob `apps/*` and `packages/*` (`pnpm-workspace.yaml`). Packages are consumed as source (e.g. `@trylinky/blocks` exports `./src/index.ts` directly, no build step). Mirror that for `@trylinky/seo`.
- **No test infra exists yet** anywhere in the repo. Task 1 introduces Vitest scoped to the new package only (leaf, pure TS — no Next/React, so setup is trivial).
- **Public page data path** (cookie-free, cached) lives in `apps/frontend/app/lib/actions/page-actions.ts` (`getPublicPage*`). Do NOT add `headers()`/`cookies()` to anything on this path — it would break the `use cache` caching.
- **The public load payload** comes from `apps/api` handler `apps/api/src/modules/pages/handlers/get-page-load.ts` (`/pages/:pageId/internal/load`, guarded by `x-api-key`). It currently returns `{ id, organizationId, publishedAt, metaTitle, metaDescription, slug, customDomain, blocks[] }`. Task 4 adds `isFeatured`, `verifiedAt`, `isPaid`.
- **Data model** (`packages/prisma/prisma/schema.prisma`): `Page` has `verifiedAt: DateTime?`, `isFeatured: Boolean @default(false)`, `customDomain: String?`. Paid status is on `Organization.subscription` (`Subscription.plan`, one of `legacyFree | premium | team`; paid = `premium | team`).
- **Header block** (`type: 'header'`) `data` shape: `{ title: string, description: string, avatar: { src: string } }`. **Link blocks** (`type: 'link-box' | 'link-bar'`) `data` carries `link: string`.
- **Marketing app** has `basePath: '/i'`; its public URLs are `https://lin.ky/i/...`. The blog post route file is `apps/marketing/src/app/blog/[blogPostSlug]/page.tsx`, served at `https://lin.ky/i/blog/<slug>`.
- **Verification gates** (run from repo root): `pnpm typecheck` and `pnpm lint`. The new package's tests run via `pnpm --filter @trylinky/seo test`.
- **Commits:** end every commit body with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. We are already on branch `seo/geo-foundation` — do not create a new branch.

---

# Task 1: Scaffold the `@trylinky/seo` package with Vitest

**Files:**
- Create: `packages/seo/package.json`
- Create: `packages/seo/tsconfig.json`
- Create: `packages/seo/vitest.config.ts`
- Create: `packages/seo/src/index.ts`
- Modify: `turbo.json` (add a `test` task)
- Modify: `package.json` (root — add a `test` script)

- [ ] **Step 1: Create the package manifest**

Create `packages/seo/package.json`:

```json
{
  "name": "@trylinky/seo",
  "version": "1.0.0",
  "description": "Shared SEO/GEO helpers: indexing gate + JSON-LD builders.",
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "typescript": "^5"
  },
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./src/index.ts"
    }
  }
}
```

- [ ] **Step 2: Create the tsconfig** (mirrors `packages/blocks/tsconfig.json`)

Create `packages/seo/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "strict": true,
    "esModuleInterop": false,
    "rootDir": "./",
    "outDir": "dist"
  },
  "include": ["src/**/*", "vitest.config.ts"]
}
```

- [ ] **Step 3: Create the Vitest config**

Create `packages/seo/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Create an empty barrel** so the package resolves

Create `packages/seo/src/index.ts`:

```ts
// Barrel for @trylinky/seo. Exports added in later tasks.
export {};
```

- [ ] **Step 5: Add a `test` task to Turbo (only if absent)**

> **Coordination note:** the unmerged `feat/page-schema-foundation` branch also adds a root `test` task/script (it introduces Vitest in `@trylinky/blocks` + `@trylinky/api`). To avoid a merge collision, only add these if they don't already exist on the current branch.

Check first: `grep -q '"test"' turbo.json && echo EXISTS || echo MISSING`. If MISSING, add a `test` task inside `turbo.json` `"tasks"`, alongside `lint`:

```json
    "test": {
      "dependsOn": ["^prisma:generate"],
      "outputs": []
    },
```

If it already EXISTS, leave it as-is (it should already pick up the new package).

- [ ] **Step 6: Add a root `test` script (only if absent)**

Check: `grep -q '"test"' package.json && echo EXISTS || echo MISSING`. If MISSING, add to the root `package.json` `"scripts"`:

```json
    "test": "turbo test",
```

If it EXISTS, leave it as-is.

- [ ] **Step 7: Install and verify the package resolves**

Run from repo root:
```bash
pnpm install
pnpm --filter @trylinky/seo test
```
Expected: Vitest runs and reports "No test files found" (exit 0 is fine) — the toolchain is wired. If `pnpm install` is undesirable in this environment, confirm `node_modules/.pnpm` contains `vitest` before proceeding.

- [ ] **Step 8: Commit**

```bash
git add packages/seo turbo.json package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
chore(seo): scaffold @trylinky/seo package with Vitest

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 2: `shouldIndexPage` quality gate (TDD)

The gate: a page is indexable iff it is **published**, has at least one **strong signal** (paid / custom domain / verified / featured), **and** clears a **content floor** (a header block with a non-empty title, ≥1 non-header block, and a non-empty description from either `metaDescription` or the header).

**Files:**
- Create: `packages/seo/src/should-index-page.ts`
- Create: `packages/seo/src/should-index-page.test.ts`
- Modify: `packages/seo/src/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/seo/src/should-index-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { shouldIndexPage, type PageIndexInput } from './should-index-page';

const headerBlock = {
  type: 'header',
  data: { title: 'Jane Doe', description: 'Photographer in Berlin', avatar: { src: 'https://x/a.png' } },
};
const linkBlock = { type: 'link-box', data: { link: 'https://instagram.com/jane' } };

function base(overrides: Partial<PageIndexInput> = {}): PageIndexInput {
  return {
    publishedAt: '2026-01-01T00:00:00.000Z',
    customDomain: null,
    verifiedAt: null,
    isFeatured: false,
    isPaid: false,
    metaDescription: null,
    blocks: [headerBlock, linkBlock],
    ...overrides,
  };
}

describe('shouldIndexPage', () => {
  it('indexes a paid page that clears the content floor', () => {
    expect(shouldIndexPage(base({ isPaid: true }))).toBe(true);
  });

  it('indexes a page on a custom domain', () => {
    expect(shouldIndexPage(base({ customDomain: 'jane.com' }))).toBe(true);
  });

  it('indexes a verified page', () => {
    expect(shouldIndexPage(base({ verifiedAt: '2026-02-02T00:00:00.000Z' }))).toBe(true);
  });

  it('indexes a featured page', () => {
    expect(shouldIndexPage(base({ isFeatured: true }))).toBe(true);
  });

  it('noindexes a free page with no strong signal', () => {
    expect(shouldIndexPage(base())).toBe(false);
  });

  it('noindexes an unpublished page even if paid', () => {
    expect(shouldIndexPage(base({ isPaid: true, publishedAt: null }))).toBe(false);
  });

  it('noindexes a paid page with no header title (content floor)', () => {
    const blocks = [{ type: 'header', data: { title: '   ', description: 'x', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks }))).toBe(false);
  });

  it('noindexes a paid page with only a header (no content block)', () => {
    expect(shouldIndexPage(base({ isPaid: true, blocks: [headerBlock] }))).toBe(false);
  });

  it('noindexes a paid page with no description anywhere', () => {
    const blocks = [{ type: 'header', data: { title: 'Jane', description: '', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks, metaDescription: null }))).toBe(false);
  });

  it('accepts metaDescription as the description source', () => {
    const blocks = [{ type: 'header', data: { title: 'Jane', description: '', avatar: { src: '' } } }, linkBlock];
    expect(shouldIndexPage(base({ isPaid: true, blocks, metaDescription: 'Berlin photographer' }))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm --filter @trylinky/seo test`
Expected: FAIL — `Failed to resolve import './should-index-page'`.

- [ ] **Step 3: Implement the gate**

Create `packages/seo/src/should-index-page.ts`:

```ts
export interface IndexBlock {
  type: string;
  data: Record<string, unknown>;
}

export interface PageIndexInput {
  publishedAt: string | null;
  customDomain: string | null;
  verifiedAt: string | null;
  isFeatured: boolean;
  isPaid: boolean;
  metaDescription: string | null;
  blocks: IndexBlock[];
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Quality gate for indexing public user pages. We never list user pages in the
 * sitemap; this decides whether a crawled page is `index` or `noindex`.
 *
 * Generous by design — start here and tighten against GSC coverage data.
 */
export function shouldIndexPage(page: PageIndexInput): boolean {
  if (!page.publishedAt) return false;

  const hasStrongSignal =
    page.isPaid || Boolean(page.customDomain) || Boolean(page.verifiedAt) || page.isFeatured;
  if (!hasStrongSignal) return false;

  const header = page.blocks.find((b) => b.type === 'header');
  const headerTitle = asTrimmedString(header?.data?.title);
  const headerDescription = asTrimmedString(header?.data?.description);
  const nonHeaderBlocks = page.blocks.filter((b) => b.type !== 'header').length;
  const hasDescription = asTrimmedString(page.metaDescription) !== '' || headerDescription !== '';

  return headerTitle !== '' && nonHeaderBlocks >= 1 && hasDescription;
}
```

- [ ] **Step 4: Export it from the barrel**

Replace `packages/seo/src/index.ts` with:

```ts
export * from './should-index-page';
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `pnpm --filter @trylinky/seo test`
Expected: PASS — 10 passing.

- [ ] **Step 6: Commit**

```bash
git add packages/seo/src
git commit -m "$(cat <<'EOF'
feat(seo): shouldIndexPage quality gate with unit tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 3: JSON-LD builders (TDD)

Pure builders returning plain schema.org objects, plus an XSS-safe serializer and a helper that derives `Person` input from a page's blocks.

**Files:**
- Create: `packages/seo/src/json-ld.ts`
- Create: `packages/seo/src/json-ld.test.ts`
- Modify: `packages/seo/src/index.ts`

- [ ] **Step 1: Write the failing tests**

Create `packages/seo/src/json-ld.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumbSchema,
  buildOrganizationSchema,
  buildProfilePageSchema,
  buildWebSiteSchema,
  personInputFromPage,
  serializeJsonLd,
} from './json-ld';

describe('buildProfilePageSchema', () => {
  it('wraps a Person as the mainEntity and omits empty fields', () => {
    const schema = buildProfilePageSchema({ name: 'Jane', url: 'https://lin.ky/jane' });
    expect(schema).toEqual({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: { '@type': 'Person', name: 'Jane', url: 'https://lin.ky/jane' },
    });
  });

  it('includes description, image and sameAs when present', () => {
    const schema = buildProfilePageSchema({
      name: 'Jane',
      url: 'https://lin.ky/jane',
      description: 'Photographer',
      image: 'https://x/a.png',
      sameAs: ['https://instagram.com/jane'],
    });
    expect(schema.mainEntity).toMatchObject({
      description: 'Photographer',
      image: 'https://x/a.png',
      sameAs: ['https://instagram.com/jane'],
    });
  });
});

describe('personInputFromPage', () => {
  const blocks = [
    { type: 'header', data: { title: 'Jane Doe', description: 'Berlin photographer', avatar: { src: 'https://x/a.png' } } },
    { type: 'link-box', data: { link: 'https://instagram.com/jane' } },
    { type: 'link-bar', data: { link: 'https://tiktok.com/@jane' } },
    { type: 'content', data: { html: 'hi' } },
  ];

  it('derives name/description/image and sameAs from blocks', () => {
    expect(personInputFromPage({ blocks }, 'https://lin.ky/jane')).toEqual({
      name: 'Jane Doe',
      description: 'Berlin photographer',
      image: 'https://x/a.png',
      url: 'https://lin.ky/jane',
      sameAs: ['https://instagram.com/jane', 'https://tiktok.com/@jane'],
    });
  });

  it('returns null when there is no header title', () => {
    expect(personInputFromPage({ blocks: [{ type: 'content', data: {} }] }, 'https://lin.ky/x')).toBeNull();
  });
});

describe('buildOrganizationSchema / buildWebSiteSchema', () => {
  it('builds an Organization', () => {
    expect(buildOrganizationSchema({ name: 'Linky', url: 'https://lin.ky', logo: 'https://lin.ky/assets/og.png' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Linky',
      url: 'https://lin.ky',
      logo: 'https://lin.ky/assets/og.png',
    });
  });

  it('builds a WebSite', () => {
    expect(buildWebSiteSchema({ name: 'Linky', url: 'https://lin.ky' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Linky',
      url: 'https://lin.ky',
    });
  });
});

describe('buildBreadcrumbSchema', () => {
  it('numbers positions from 1', () => {
    const schema = buildBreadcrumbSchema([
      { name: 'Home', url: 'https://lin.ky' },
      { name: 'Blog', url: 'https://lin.ky/i/blog' },
    ]);
    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://lin.ky' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://lin.ky/i/blog' },
    ]);
  });
});

describe('serializeJsonLd', () => {
  it('escapes < to prevent breaking out of the script tag', () => {
    expect(serializeJsonLd({ a: '</script><b>' })).toBe('{"a":"\\u003c/script>\\u003cb>"}');
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `pnpm --filter @trylinky/seo test`
Expected: FAIL — `Failed to resolve import './json-ld'`.

- [ ] **Step 3: Implement the builders**

Create `packages/seo/src/json-ld.ts`:

```ts
export interface PersonInput {
  name: string;
  url: string;
  description?: string;
  image?: string;
  sameAs?: string[];
}

export function buildProfilePageSchema(input: PersonInput) {
  const person: Record<string, unknown> = { '@type': 'Person', name: input.name };
  if (input.description) person.description = input.description;
  if (input.image) person.image = input.image;
  if (input.url) person.url = input.url;
  if (input.sameAs?.length) person.sameAs = input.sameAs;
  return { '@context': 'https://schema.org', '@type': 'ProfilePage', mainEntity: person };
}

const LINK_BLOCK_TYPES = new Set(['link-box', 'link-bar']);

interface PageLike {
  blocks: Array<{ type: string; data: Record<string, unknown> }>;
}

/** Derives Person schema input from a page's header + link blocks. Pure. */
export function personInputFromPage(page: PageLike, pageUrl: string): PersonInput | null {
  const header = page.blocks.find((b) => b.type === 'header');
  const name = typeof header?.data?.title === 'string' ? header.data.title.trim() : '';
  if (!name) return null;

  const rawDesc = typeof header?.data?.description === 'string' ? header.data.description.trim() : '';
  const avatar = header?.data?.avatar as { src?: unknown } | undefined;
  const image = typeof avatar?.src === 'string' && avatar.src ? avatar.src : undefined;

  const sameAs = page.blocks
    .filter((b) => LINK_BLOCK_TYPES.has(b.type))
    .map((b) => (typeof b.data?.link === 'string' ? b.data.link : null))
    .filter((u): u is string => Boolean(u));

  return {
    name,
    url: pageUrl,
    description: rawDesc || undefined,
    image,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function buildOrganizationSchema(input: { name: string; url: string; logo?: string }) {
  const org: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'Organization', name: input.name, url: input.url };
  if (input.logo) org.logo = input.logo;
  return org;
}

export function buildWebSiteSchema(input: { name: string; url: string; searchUrlTemplate?: string }) {
  const site: Record<string, unknown> = { '@context': 'https://schema.org', '@type': 'WebSite', name: input.name, url: input.url };
  if (input.searchUrlTemplate) {
    site.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: input.searchUrlTemplate },
      'query-input': 'required name=search_term_string',
    };
  }
  return site;
}

export function buildBreadcrumbSchema(crumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };
}

/** JSON-LD string safe to embed in a <script> tag (escapes `<`). */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}
```

- [ ] **Step 4: Export from the barrel**

Replace `packages/seo/src/index.ts` with:

```ts
export * from './should-index-page';
export * from './json-ld';
```

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `pnpm --filter @trylinky/seo test`
Expected: PASS — all suites green.

- [ ] **Step 6: Commit**

```bash
git add packages/seo/src
git commit -m "$(cat <<'EOF'
feat(seo): JSON-LD builders (ProfilePage/Org/WebSite/Breadcrumb) with tests

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 4: Extend the public load payload with index signals (`apps/api`)

Add `isFeatured`, `verifiedAt`, and a derived `isPaid` boolean to the `/pages/:pageId/internal/load` response, so the gate can run on the cached public path without extra fetches.

**Files:**
- Modify: `apps/api/src/modules/pages/handlers/get-page-load.ts`

- [ ] **Step 1: Add the three fields to the response schema**

In `apps/api/src/modules/pages/handlers/get-page-load.ts`, inside `getPageLoadSchema.response[200]` object (currently ends after `blocks`), add three properties. The object becomes:

```ts
    200: Type.Object({
      id: Type.String(),
      organizationId: Type.String(),
      publishedAt: Type.String(),
      metaTitle: Type.String(),
      metaDescription: Type.String(),
      slug: Type.String(),
      customDomain: Type.String(),
      isFeatured: Type.Boolean(),
      verifiedAt: Type.Union([Type.String(), Type.Null()]),
      isPaid: Type.Boolean(),
      blocks: Type.Array(
        Type.Object({
          id: Type.String(),
          type: Type.String(),
          config: Type.Object({}, { additionalProperties: true }),
          data: Type.Object({}, { additionalProperties: true }),
        })
      ),
    }),
```

- [ ] **Step 2: Select the new fields + the org subscription in the query**

In the same file, change the `prisma.page.findUnique` `select` to add `isFeatured`, `verifiedAt`, and the org's subscription plan:

```ts
  const page = await prisma.page.findUnique({
    where: {
      deletedAt: null,
      id: pageId,
    },
    select: {
      id: true,
      publishedAt: true,
      organizationId: true,
      customDomain: true,
      slug: true,
      metaTitle: true,
      metaDescription: true,
      isFeatured: true,
      verifiedAt: true,
      blocks: true,
      organization: { select: { subscription: { select: { plan: true } } } },
    },
  });
```

- [ ] **Step 3: Derive `isPaid` and shape the response**

Replace the final `return response.status(200).send(page);` with a shaped payload (strip the nested `organization`, expose `isPaid`):

```ts
  if (!page) {
    return response.notFound();
  }

  const plan = page.organization?.subscription?.plan;
  const isPaid = plan === 'premium' || plan === 'team';

  const { organization, ...rest } = page;

  return response.status(200).send({
    ...rest,
    verifiedAt: page.verifiedAt ? page.verifiedAt.toISOString() : null,
    isPaid,
  });
```

(Note: `publishedAt`/`customDomain`/etc. are already serialized by Fastify per the schema; only `verifiedAt` is newly added as a nullable date, so we coerce it explicitly to match the `string | null` schema.)

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @trylinky/api typecheck` (or `pnpm typecheck` from root).
Expected: PASS.

- [ ] **Step 5: Manual verification**

Start the API + frontend dev servers. With a known published page id, run:
```bash
curl -s -H "x-api-key: $INTERNAL_API_KEY" "$NEXT_PUBLIC_API_URL/pages/<PAGE_ID>/internal/load" | jq '{isFeatured, verifiedAt, isPaid, blocks: (.blocks|length)}'
```
Expected: JSON includes `isFeatured` (bool), `verifiedAt` (string or null), `isPaid` (bool).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/modules/pages/handlers/get-page-load.ts
git commit -m "$(cat <<'EOF'
feat(api): expose isFeatured/verifiedAt/isPaid on public page load payload

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 5: Apply the indexing gate + ProfilePage schema on the public route (`apps/frontend`)

Use `shouldIndexPage` to set `robots` in `generateMetadata`, and inject gated `ProfilePage` JSON-LD into the page body. Both read the now-extended `getPublicPageLoadData` payload — no extra fetch.

**Files:**
- Modify: `apps/frontend/app/[domain]/[slug]/page.tsx`
- Modify: `apps/frontend/package.json` (add `@trylinky/seo` dependency)

- [ ] **Step 1: Add the workspace dependency**

In `apps/frontend/package.json` `"dependencies"`, add:

```json
    "@trylinky/seo": "workspace:*",
```

Then run `pnpm install` from root.

- [ ] **Step 2: Set `robots` from the gate in `generateMetadata`**

In `apps/frontend/app/[domain]/[slug]/page.tsx`, add the import at the top:

```ts
import { shouldIndexPage } from '@trylinky/seo';
```

Then in `generateMetadata`, after the `const page = await getPublicPageLoadData(corePage.id);` block and its null/publishedAt guard, compute the gate and add `robots` to the returned metadata object:

```ts
  const indexable = shouldIndexPage({
    publishedAt: page.publishedAt ?? null,
    customDomain: page.customDomain ?? null,
    verifiedAt: page.verifiedAt ?? null,
    isFeatured: Boolean(page.isFeatured),
    isPaid: Boolean(page.isPaid),
    metaDescription: page.metaDescription ?? null,
    blocks: page.blocks ?? [],
  });
```

Add `robots` into the existing returned object (alongside `title`, `description`, `alternates`):

```ts
    robots: { index: indexable, follow: true },
```

- [ ] **Step 3: Inject gated ProfilePage JSON-LD in the page body**

In the same file, add imports:

```ts
import { buildProfilePageSchema, personInputFromPage, serializeJsonLd, shouldIndexPage } from '@trylinky/seo';
```

(Replace the Step 2 single import with this combined import.)

In the default `Page` component, after the existing guards (`publishedAt`, custom-domain redirect) and before building `pageLayout`, compute the schema:

```ts
  const canonicalUrl =
    page.customDomain && page.customDomain === decodeURIComponent(params.domain)
      ? `https://${page.customDomain}`
      : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}`;

  const indexable = shouldIndexPage({
    publishedAt: page.publishedAt ?? null,
    customDomain: page.customDomain ?? null,
    verifiedAt: page.verifiedAt ?? null,
    isFeatured: Boolean(page.isFeatured),
    isPaid: Boolean(page.isPaid),
    metaDescription: page.metaDescription ?? null,
    blocks: page.blocks ?? [],
  });

  const personInput = indexable ? personInputFromPage({ blocks: page.blocks }, canonicalUrl) : null;
  const profileSchema = personInput ? buildProfilePageSchema(personInput) : null;
```

Then render the `<script>` just inside the returned JSX, before `<Grid>`. Change the return to wrap in a fragment:

```tsx
  return (
    <>
      {profileSchema && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileSchema) }}
        />
      )}
      <Grid isPotentiallyMobile={false} layout={pageLayout}>
        {page.blocks
          .filter((block: Block) => mergedIds.includes(block.id))
          .map((block: Block) => {
            return (
              <section key={block.id} style={{ fontFamily: 'var(--font-sys-body)' }}>
                {renderBlock(block, page.id, false)}
              </section>
            );
          })}
      </Grid>
    </>
  );
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter @trylinky/frontend typecheck` (or root `pnpm typecheck`).
Expected: PASS.

- [ ] **Step 5: Manual verification (gate + schema + cache safety)**

Restart frontend dev. Then:
1. **Indexable page** (paid/verified/custom-domain/featured with content): load `/<slug>`, view source. Expect `<meta name="robots" content="index, follow">` (or no robots meta = indexable default is fine) AND a `<script type="application/ld+json">` with `"@type":"ProfilePage"`.
2. **Thin free page**: load its `/<slug>`, view source. Expect `<meta name="robots" content="noindex, follow">` and **no** ProfilePage script.
3. **Cache safety**: confirm nothing added reads `headers()`/`cookies()`. Load an indexable page twice; the second load should still be fast/cached (no regression).
4. Paste the ProfilePage JSON into Google's Rich Results Test (or the schema.org validator) — expect no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/app/[domain]/[slug]/page.tsx apps/frontend/package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(public): quality-gated indexing + ProfilePage JSON-LD on user pages

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 6: Dynamic `robots.ts` allowing AI crawlers (both apps)

Replace the static `robots.txt` with a dynamic `robots.ts` that explicitly welcomes AI crawlers (we WANT citations), blocks editor/app paths, and points at the sitemap. Add an equivalent to the marketing app.

**Files:**
- Delete: `apps/frontend/app/robots.txt`
- Create: `apps/frontend/app/robots.ts`
- Create: `apps/marketing/src/app/robots.ts`

- [ ] **Step 1: Remove the static file**

```bash
git rm apps/frontend/app/robots.txt
```

- [ ] **Step 2: Create the frontend `robots.ts`**

Create `apps/frontend/app/robots.ts`:

```ts
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
```

- [ ] **Step 3: Create the marketing `robots.ts`**

Create `apps/marketing/src/app/robots.ts`:

```ts
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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/' })),
    ],
    sitemap: 'https://lin.ky/sitemap.xml',
  };
}
```

- [ ] **Step 4: Manual verification**

Restart both dev servers. `curl -s http://localhost:3000/robots.txt` — expect the generated output with AI crawler `User-agent` blocks, the disallow list, and the `Sitemap:` line. Confirm `/e`, `/edit`, `/new`, `/api/` are disallowed for `*`.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/robots.ts apps/marketing/src/app/robots.ts
git commit -m "$(cat <<'EOF'
feat(seo): dynamic robots.ts — allow AI crawlers, block editor/app paths

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 7: Org/WebSite schema + answer-first metadata helper + canonical fix (marketing)

**Files:**
- Create: `apps/marketing/src/lib/seo-metadata.ts`
- Modify: `apps/marketing/src/app/layout.tsx`
- Modify: `apps/marketing/src/app/blog/[blogPostSlug]/page.tsx`
- Modify: `apps/marketing/package.json` (add `@trylinky/seo`)

- [ ] **Step 1: Add the workspace dependency**

In `apps/marketing/package.json` `"dependencies"`, add `"@trylinky/seo": "workspace:*",` then run `pnpm install` from root.

- [ ] **Step 2: Inject Organization + WebSite JSON-LD in the marketing root layout**

In `apps/marketing/src/app/layout.tsx`, add the import:

```ts
import { buildOrganizationSchema, buildWebSiteSchema, serializeJsonLd } from '@trylinky/seo';
```

Inside the `<head>` (alongside the existing Ahrefs `<Script>`), add two schema scripts:

```tsx
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(
              buildOrganizationSchema({
                name: 'Linky',
                url: 'https://lin.ky',
                logo: 'https://lin.ky/assets/og.png',
              })
            ),
          }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(buildWebSiteSchema({ name: 'Linky', url: 'https://lin.ky' })),
          }}
        />
```

(Omit `searchUrlTemplate` — there is no public search endpoint, per the spec's SearchAction note.)

- [ ] **Step 3: Create a shared answer-first metadata helper**

Create `apps/marketing/src/lib/seo-metadata.ts`:

```ts
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
```

- [ ] **Step 4: Apply the helper to the pricing page (worked example)**

In `apps/marketing/src/app/pricing/page.tsx`, add a `metadata` export (it currently inherits root). At the top:

```ts
import { buildPageMetadata } from '@/lib/seo-metadata';

export const metadata = buildPageMetadata({
  title: 'Linky pricing — free, Premium, and Team plans',
  description:
    'Linky is free to start. Premium unlocks custom domains, advanced blocks, and analytics; Team adds shared pages and seats. Compare plans and pricing.',
  path: '/i/pricing',
});
```

(Apply the same pattern to `privacy`, `terms`, and `explore` pages with page-appropriate answer-first copy. For `privacy`/`terms` keep titles plain, e.g. `'Privacy Policy — Linky'`, and set `path` to `/i/privacy` and `/i/terms`. For `explore` lead the description with what the page lets you do.)

- [ ] **Step 5: Fix the missing canonical on blog posts + add BreadcrumbList**

In `apps/marketing/src/app/blog/[blogPostSlug]/page.tsx` `generateMetadata`, add a self-referential canonical to the returned `Metadata` object:

```ts
    alternates: { canonical: `https://lin.ky/i/blog/${blogPost.slug}` },
```

In the same file's default component, where the existing `BlogPosting` JSON-LD `<script>` is rendered, add a sibling `BreadcrumbList` script:

```tsx
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbSchema([
              { name: 'Home', url: 'https://lin.ky' },
              { name: 'Blog', url: 'https://lin.ky/i/blog' },
              { name: blogPost.title, url: `https://lin.ky/i/blog/${blogPost.slug}` },
            ])
          ),
        }}
      />
```

Add the import at the top of the file:

```ts
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
```

(If `serializeJsonLd` is already used for the existing BlogPosting script via a local `JSON.stringify`, migrate that script to `serializeJsonLd(...)` for consistency — optional, no behavior change.)

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @trylinky/marketing typecheck` (or root `pnpm typecheck`).
Expected: PASS.

- [ ] **Step 7: Manual verification**

Restart marketing dev. View source on `/i` (root) → expect `Organization` + `WebSite` JSON-LD. On `/i/pricing` → expect the new title/description + `<link rel="canonical" href="https://lin.ky/i/pricing">`. On a blog post → expect a canonical link + `BreadcrumbList` JSON-LD. Validate the blog post URL in Rich Results Test.

- [ ] **Step 8: Commit**

```bash
git add apps/marketing/src apps/marketing/package.json pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(marketing): Org/WebSite schema, answer-first metadata helper, blog canonical + breadcrumbs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 8: Sitemap PSEO structure (no user pages) + llms.txt

**Files:**
- Modify: `apps/marketing/src/app/sitemap.ts`
- Create: `apps/marketing/src/app/llms.txt/route.ts`

- [ ] **Step 1: Document the user-page exclusion + reserve PSEO structure in the sitemap**

In `apps/marketing/src/app/sitemap.ts`, add a comment above the `baseSitemap` array recording the decision, and a clearly-labeled extension point for Spec 2 PSEO routes:

```ts
// IMPORTANT: We deliberately DO NOT enumerate public user pages (lin.ky/<slug>)
// in the sitemap. Thousands of thin user pages would dilute root-domain authority
// and feed scaled-content signals. User pages are indexed individually only when
// they pass the quality gate (see @trylinky/seo `shouldIndexPage`). Do not add them.
//
// Spec 2 will append programmatic SEO routes (integration/template/use-case/
// alternative pages) to `pseoSitemap` below.
const pseoSitemap: MetadataRoute.Sitemap = [];
```

And include it in the returned array:

```ts
  return [
    ...baseSitemap,
    ...pseoSitemap,
    ...blogSitemap,
    ...learnSitemap,
  ] as MetadataRoute.Sitemap;
```

- [ ] **Step 2: Add a curated `llms.txt`**

Create `apps/marketing/src/app/llms.txt/route.ts`:

```ts
export const dynamic = 'force-static';

const BODY = `# Linky

> Linky is a delightfully rich link-in-bio page builder. Create a customizable
> personal page with blocks (links, embeds, music, social follower counts) on a
> free or paid plan, optionally on a custom domain.

## Core
- [Home](https://lin.ky): What Linky is and how to start
- [Pricing](https://lin.ky/i/pricing): Free, Premium, and Team plans
- [Explore](https://lin.ky/i/explore): Example public pages

## Learn
- [Blog](https://lin.ky/i/blog): Product updates and guides
- [Learn](https://lin.ky/i/learn): How-to articles and help content
`;

export function GET() {
  return new Response(BODY, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
```

- [ ] **Step 3: Manual verification**

Restart marketing dev. `curl -s http://localhost:3000/sitemap.xml | head` → confirm it still renders and contains no user-page URLs. `curl -s http://localhost:3000/i/llms.txt` (or the configured path) → confirm the plain-text body. (Note: with `basePath: '/i'` the route serves under `/i/llms.txt`; if a root `/llms.txt` is desired, add a rewrite in `apps/frontend/next.config.js` mapping `/llms.txt` → `${MARKETING_URL}/i/llms.txt`, mirroring the existing `/sitemap.xml` rewrite.)

- [ ] **Step 4: Commit**

```bash
git add apps/marketing/src/app/sitemap.ts apps/marketing/src/app/llms.txt
git commit -m "$(cat <<'EOF'
feat(seo): sitemap PSEO structure (no user pages) + curated llms.txt

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 9: Google Search Console verification + final gates

**Files:**
- Modify: `apps/frontend/app/layout.tsx`
- Modify: `apps/marketing/src/app/layout.tsx`

- [ ] **Step 1: Add a GSC verification token via Next metadata**

In BOTH `apps/frontend/app/layout.tsx` and `apps/marketing/src/app/layout.tsx`, add a `verification` field to the exported `metadata` object (reads from env so the token isn't hard-coded):

```ts
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
```

(If `apps/frontend/app/layout.tsx` builds metadata differently, add the same `verification` key to whatever `Metadata` object it exports. When the env var is unset the tag is simply omitted — safe.)

- [ ] **Step 2: Document the env var**

Add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the project's `.env.example` (or the documented env list) with a comment: `# Google Search Console HTML-tag verification token`.

- [ ] **Step 3: Manual ops (record, do not block the commit)**

Record these as follow-up ops steps in the PR description (they require dashboard access, not code):
1. Add the property in Google Search Console (DNS or HTML-tag via the env var above).
2. Submit `https://lin.ky/sitemap.xml`.
3. **Capture the baseline** before Spec 2 ships: current total indexed pages, impressions, and clicks (last 28 days). Paste into the PR so Spec 2's impact is measurable.

- [ ] **Step 4: Full verification gates**

Run from repo root:
```bash
pnpm --filter @trylinky/seo test
pnpm typecheck
pnpm lint
```
Expected: all green.

Then a manual sweep:
- Indexable vs thin page robots meta correct (Task 5 verification).
- `robots.txt` output welcomes AI crawlers, blocks app paths (Task 6).
- Org/WebSite/Breadcrumb/ProfilePage JSON-LD all validate in Rich Results Test.
- Cached public reads still cache (no `headers()`/`cookies()` regression on the public path).

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/layout.tsx apps/marketing/src/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(seo): Google Search Console verification via metadata

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Spec coverage check

| Spec 1 requirement | Task |
|---|---|
| `ProfilePage`/`Person` on user pages | 3 (builder) + 5 (wiring) |
| `Organization` + `WebSite` on marketing | 3 (builder) + 7 (wiring) |
| `BreadcrumbList` | 3 (builder) + 7 (blog) |
| Reusable typed schema-builder | 3 |
| Quality-gated indexing (`shouldIndexPage`, single source) | 2 (gate) + 5 (robots) — same helper reused for schema gating |
| API exposes plan/verified/featured on public path | 4 |
| Sitemap = marketing + PSEO, never user pages | 8 |
| Dynamic `robots.ts`, allow AI crawlers, block editor paths | 6 |
| `llms.txt` hedge | 8 |
| Answer-first metadata helper + apply to bare pages | 7 |
| Blog canonical fix | 7 |
| Measurement (GSC + baseline) | 9 |

## Notes & deferrals (from the spec)

- **Opt-in indexing toggle** is explicitly deferred (no settings UI in this spec).
- **Content-floor thresholds** are intentionally generous; tune against GSC coverage after launch.
- **SearchAction** omitted — no public search endpoint exists.
- `shouldIndexPage` is computed twice on the public route (in `generateMetadata` and the component); Next dedupes the underlying `getPublicPageLoadData` fetch via the request cache, so this is cheap. Keep the single `@trylinky/seo` helper as the only source of truth.
