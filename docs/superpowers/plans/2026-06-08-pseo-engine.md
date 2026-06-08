# PSEO Engine (Spec 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable programmatic-SEO landing-page engine in the marketing app and ship two data-driven archetypes — integration pages (block-registry data) and template-gallery pages (real theme palettes rendered as live CSS mocks) — at clean root URLs, fully statically generated, with FAQ + Breadcrumb schema.

**Architecture:** A shared `<PseoPage>` server-component template + typed-TS content modules drive every page; `@trylinky/seo` gains a `buildFaqSchema` helper (single source for FAQPage JSON-LD). Pages live in `apps/marketing` under `/integrations/*` and `/templates/*`, exposed at `lin.ky/...` via frontend rewrites + middleware exclusions, prerendered via `generateStaticParams`, and listed in the existing `pseoSitemap` slot behind a content quality gate.

**Tech Stack:** Next.js 16 (App Router, SSG), Tailwind v4, `@trylinky/seo`, `@trylinky/blocks` (block registry), `@trylinky/ui`, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-08-pseo-engine-design.md`

**Branch:** `seo/geo-foundation` (continues the initiative; Spec 1 already on this branch).

---

## Conventions & key facts (read before starting)

- Branch `seo/geo-foundation` is already checked out — do NOT create/switch branches. Commit messages end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Marketing app: `apps/marketing`, basePath `/i`, path alias `@/` → `apps/marketing/src/`. Already depends on `@trylinky/common`, `@trylinky/seo`, `@trylinky/ui`; does NOT yet depend on `@trylinky/blocks` (Task 5 adds it).
- Marketing pages are wrapped by the root layout's `<MarketingNavigation>` + `<MarketingFooter>` automatically — PSEO pages render only their own content.
- `@trylinky/seo` exports (from `packages/seo/src/json-ld.ts`): `buildBreadcrumbSchema`, `buildOrganizationSchema`, `buildWebSiteSchema`, `buildProfilePageSchema`, `serializeJsonLd`. Barrel `packages/seo/src/index.ts` re-exports `./should-index-page`, `./json-ld`, `./crawlers`. Tests run via `pnpm --filter @trylinky/seo test`.
- Gates: `pnpm typecheck`, `pnpm lint` (only `@trylinky/frontend` + `@trylinky/marketing` have lint scripts), `pnpm --filter @trylinky/seo test`.
- Block registry (`@trylinky/blocks`, `packages/blocks/src/blocks/config.ts`): `export const blocks: Record<Blocks, { schema, defaults, isBeta?, integrationType? }>`. `integrationType` mapping: `spotify`→`spotify-playing-now`; `instagram`→`instagram-latest-post`,`instagram-follower-count`; `threads`→`threads-follower-count`; `tiktok`→`tiktok-follower-count`,`tiktok-latest-post`; `github`→`github-commits-this-month`. Block configs have NO display name/icon in code — presentation copy lives in our content modules.
- Theme palettes: source of truth is `apps/frontend/lib/theme.ts` `defaultThemeSeeds` (keys `Default`, `Purple`, `Black`, `Forest`, `Lilac`, `OrangePunch`). Color fields are `{ h: 0–360, s: 0–1, l: 0–1 }`. We SNAPSHOT the 6 palettes into `templates.ts` (do NOT import the frontend module — 11+ importers, keep decoupled).
- Marketing footer (`apps/marketing/src/components/marketing-footer.tsx`) renders nav links as `<li><Link href>…</Link></li>` items; the existing `MarketingContainer` is `max-w-6xl mx-auto px-4`.

---

# Task 1: `buildFaqSchema` in `@trylinky/seo` (TDD) + refactor marketing FAQ

**Files:**
- Modify: `packages/seo/src/json-ld.ts`
- Modify: `packages/seo/src/json-ld.test.ts`
- Modify: `apps/marketing/src/components/landing-page/Faq.tsx`

- [ ] **Step 1: Add the failing test.** Append to `packages/seo/src/json-ld.test.ts`:
```ts
import { buildFaqSchema } from './json-ld';

describe('buildFaqSchema', () => {
  it('builds a FAQPage with Question/acceptedAnswer entries', () => {
    expect(
      buildFaqSchema([
        { question: 'What is Linky?', answer: 'A link-in-bio builder.' },
        { question: 'Is it free?', answer: 'Yes, with paid upgrades.' },
      ])
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is Linky?', acceptedAnswer: { '@type': 'Answer', text: 'A link-in-bio builder.' } },
        { '@type': 'Question', name: 'Is it free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, with paid upgrades.' } },
      ],
    });
  });
});
```
(If `buildFaqSchema` isn't in the existing top import block, add it there instead of a second import line to avoid a duplicate-import lint error.)

- [ ] **Step 2: Run tests, confirm the new one FAILS.** `pnpm --filter @trylinky/seo test` → fails resolving `buildFaqSchema`.

- [ ] **Step 3: Implement.** Add to `packages/seo/src/json-ld.ts` (after `buildBreadcrumbSchema`):
```ts
export function buildFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
```
(No barrel change needed — `index.ts` already does `export * from './json-ld'`.)

- [ ] **Step 4: Run tests, confirm all PASS** (19 total).

- [ ] **Step 5: Refactor the marketing FAQ component to use it.** In `apps/marketing/src/components/landing-page/Faq.tsx`: remove the local `generateFaqJsonLd` function; import `{ buildFaqSchema, serializeJsonLd } from '@trylinky/seo'`; replace the JSON-LD `<script>` body with `serializeJsonLd(buildFaqSchema(faqs))` (where `faqs` is the selected question array). Keep the Accordion rendering and `questionSet` prop unchanged.

- [ ] **Step 6: Typecheck + commit.** `pnpm typecheck` PASS. Then:
```bash
git add packages/seo/src/json-ld.ts packages/seo/src/json-ld.test.ts apps/marketing/src/components/landing-page/Faq.tsx
git commit -m "$(cat <<'EOF'
feat(seo): buildFaqSchema helper; marketing FAQ uses it

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 2: Clean-URL plumbing for `/integrations` and `/templates`

**Files:**
- Modify: `apps/frontend/next.config.ts`
- Modify: `apps/frontend/middleware.ts`

- [ ] **Step 1: Add rewrites.** In `apps/frontend/next.config.ts`, inside the `rewrites()` returned array, add (after the `/llms.txt` entry, before the `/i/:path*` entry):
```ts
  { source: '/integrations', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/integrations` },
  { source: '/integrations/:path*', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/integrations/:path*` },
  { source: '/templates', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/templates` },
  { source: '/templates/:path*', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/templates/:path*` },
```

- [ ] **Step 2: Exclude from the user-slug middleware.** In `apps/frontend/middleware.ts`, change the matcher to add `integrations|templates` to the negative-lookahead:
```ts
    '/((?!api/|_next/|i/|_static/|_vercel|e(?=/|$)|edit|invite|new|new-api|assets|integrations|templates|[\\w-]+\\.\\w+).*)',
```

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/frontend/next.config.ts apps/frontend/middleware.ts
git commit -m "$(cat <<'EOF'
feat(pseo): route /integrations and /templates to the marketing app

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 3: PSEO metadata helper + `<PseoFaq>` + `<PseoPage>` engine

**Files:**
- Modify: `apps/marketing/src/lib/seo-metadata.ts`
- Create: `apps/marketing/src/components/pseo/pseo-faq.tsx`
- Create: `apps/marketing/src/components/pseo/pseo-page.tsx`

- [ ] **Step 1: Add `buildPseoMetadata`.** Append to `apps/marketing/src/lib/seo-metadata.ts`:
```ts
/**
 * Metadata for a programmatic SEO page. `path` is the CLEAN root path
 * (e.g. "/integrations/spotify") — canonical points there, not at /i/...,
 * because the frontend rewrites the clean URL to the marketing route.
 */
export function buildPseoMetadata(input: { title: string; description: string; path: string }): Metadata {
  return buildPageMetadata({ title: input.title, description: input.description, path: input.path });
}
```
(`buildPageMetadata` already builds canonical = `https://lin.ky${path}` + OG/twitter. Passing the clean path yields the correct clean canonical.)

- [ ] **Step 2: Create `<PseoFaq>`.** Create `apps/marketing/src/components/pseo/pseo-faq.tsx`:
```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@trylinky/ui';
import { buildFaqSchema, serializeJsonLd } from '@trylinky/seo';

export interface FaqEntry {
  question: string;
  answer: string;
}

export function PseoFaq({ faqs }: { faqs: FaqEntry[] }) {
  return (
    <section className="mx-auto w-full max-w-3xl py-12">
      <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
      <Accordion type="single" collapsible>
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildFaqSchema(faqs)) }}
      />
    </section>
  );
}
```
(Confirm the `Accordion`/`AccordionItem`/`AccordionTrigger`/`AccordionContent` props against `apps/marketing/src/components/landing-page/Faq.tsx`'s usage — mirror them exactly, e.g. whether it uses `type="single" collapsible`.)

- [ ] **Step 3: Create `<PseoPage>` template.** Create `apps/marketing/src/components/pseo/pseo-page.tsx`:
```tsx
import { MarketingContainer } from '@/components/marketing-container';
import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { PseoFaq, type FaqEntry } from '@/components/pseo/pseo-faq';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Breadcrumb {
  name: string;
  url: string;
}

export function PseoPage(props: {
  h1: string;
  answer: string;
  breadcrumbs: Breadcrumb[]; // Home → hub → current (absolute https://lin.ky URLs)
  hero?: ReactNode; // optional visual (e.g. theme mock / block mock)
  children: ReactNode; // body sections
  faqs: FaqEntry[];
}) {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
          {props.breadcrumbs.map((c, i) => (
            <span key={c.url}>
              {i > 0 && <span className="mx-1">/</span>}
              {i < props.breadcrumbs.length - 1 ? (
                <Link href={c.url} className="hover:underline">{c.name}</Link>
              ) : (
                <span className="text-gray-700">{c.name}</span>
              )}
            </span>
          ))}
        </nav>

        <header className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight">{props.h1}</h1>
          <p className="mt-4 text-xl text-gray-600">{props.answer}</p>
        </header>

        {props.hero && <div className="mt-10">{props.hero}</div>}

        <div className="mt-12 max-w-3xl prose prose-lg">{props.children}</div>

        <PseoFaq faqs={props.faqs} />

        <div className="mt-12">
          <CallToActionBlock />
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildBreadcrumbSchema(props.breadcrumbs)) }}
        />
      </MarketingContainer>
    </div>
  );
}
```

- [ ] **Step 4: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/lib/seo-metadata.ts apps/marketing/src/components/pseo
git commit -m "$(cat <<'EOF'
feat(pseo): PseoPage template, PseoFaq, buildPseoMetadata

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 4: Live theme-mock component + `hslToCss`

**Files:**
- Create: `apps/marketing/src/components/pseo/theme-mock.tsx`

- [ ] **Step 1: Create the component.** Create `apps/marketing/src/components/pseo/theme-mock.tsx`:
```tsx
export interface HslColor { h: number; s: number; l: number } // s,l are 0–1 fractions

export interface ThemePalette {
  colorBgBase: HslColor;
  colorBgPrimary: HslColor;
  colorBgSecondary: HslColor;
  colorBorderPrimary: HslColor;
  colorLabelPrimary: HslColor;
  colorLabelSecondary: HslColor;
  colorLabelTertiary: HslColor;
}

/** Convert a Linky theme color ({h:0-360, s:0-1, l:0-1}) to a CSS hsl() string. */
export function hslToCss(c: HslColor): string {
  return `hsl(${c.h} ${Math.round(c.s * 100)}% ${Math.round(c.l * 100)}%)`;
}

/** A realistic, static link-in-bio preview rendered from a real theme palette. */
export function ThemeMock({ palette, name, size = 'full' }: { palette: ThemePalette; name: string; size?: 'full' | 'thumb' }) {
  const rows = ['Latest music', 'My shop', 'Newsletter'];
  return (
    <div
      className={size === 'thumb' ? 'rounded-xl p-4' : 'rounded-2xl p-8'}
      style={{ backgroundColor: hslToCss(palette.colorBgBase) }}
    >
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full" style={{ backgroundColor: hslToCss(palette.colorBgSecondary) }} />
        <div className="text-lg font-bold" style={{ color: hslToCss(palette.colorLabelPrimary) }}>{name}</div>
        <div className="text-sm" style={{ color: hslToCss(palette.colorLabelSecondary) }}>your link in bio</div>
        <div className="mt-2 flex w-full flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row}
              className="rounded-lg px-4 py-3 text-center text-sm font-medium"
              style={{
                backgroundColor: hslToCss(palette.colorBgPrimary),
                color: hslToCss(palette.colorLabelPrimary),
                border: `1px solid ${hslToCss(palette.colorBorderPrimary)}`,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/components/pseo/theme-mock.tsx
git commit -m "$(cat <<'EOF'
feat(pseo): live CSS theme-mock preview component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 5: Integration-blocks showcase (reads the real block registry)

**Files:**
- Modify: `apps/marketing/package.json` (add `@trylinky/blocks`)
- Create: `apps/marketing/src/components/pseo/integration-blocks.tsx`

- [ ] **Step 1: Add the dependency.** In `apps/marketing/package.json` `"dependencies"`, add `"@trylinky/blocks": "workspace:*",`. Run `pnpm install` from root.

- [ ] **Step 2: Create the showcase.** Create `apps/marketing/src/components/pseo/integration-blocks.tsx`:
```tsx
import { blocks } from '@trylinky/blocks';

/** Returns the real block keys the registry maps to an integration type. */
export function blocksForIntegration(integrationType: string): string[] {
  return Object.entries(blocks)
    .filter(([, cfg]) => cfg.integrationType === integrationType)
    .map(([key]) => key);
}

/**
 * Lists the real blocks this integration powers (registry-backed), with
 * presentation copy supplied per block by the content module.
 */
export function IntegrationBlocks({
  integrationType,
  blockCopy,
}: {
  integrationType: string;
  blockCopy: Record<string, { name: string; description: string }>;
}) {
  const keys = blocksForIntegration(integrationType);
  return (
    <ul className="grid gap-4 sm:grid-cols-2 not-prose">
      {keys.map((key) => {
        const copy = blockCopy[key];
        return (
          <li key={key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="font-semibold">{copy?.name ?? key}</div>
            {copy?.description && <p className="mt-1 text-sm text-gray-600">{copy.description}</p>}
          </li>
        );
      })}
    </ul>
  );
}
```
(Verify `blocks` is exported from `@trylinky/blocks` root barrel — check `packages/blocks/src/index.ts`; if it re-exports from `./blocks/config`, `import { blocks } from '@trylinky/blocks'` works. If the export path differs, import from the correct subpath.)

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/package.json pnpm-lock.yaml apps/marketing/src/components/pseo/integration-blocks.tsx
git commit -m "$(cat <<'EOF'
feat(pseo): registry-backed integration-blocks showcase

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 6: Content types + quality gate + integration content (5 records)

**Files:**
- Create: `apps/marketing/src/content/pseo-types.ts`
- Create: `apps/marketing/src/content/integrations.ts`

- [ ] **Step 1: Define shared content types + the quality gate.** Create `apps/marketing/src/content/pseo-types.ts`:
```ts
import type { FaqEntry } from '@/components/pseo/pseo-faq';

export interface ContentSection {
  heading: string;
  body: string; // 1–3 paragraphs of unique, answer-first prose
}

export interface IntegrationContent {
  slug: string; // matches integrationType, e.g. 'spotify'
  integrationType: string;
  name: string; // 'Spotify'
  h1: string; // answer-first, mirrors the target query
  answer: string; // one-sentence direct answer
  targetKeyword: string;
  blockCopy: Record<string, { name: string; description: string }>;
  sections: ContentSection[];
  faqs: FaqEntry[];
}

export interface TemplateContent {
  slug: string; // editorial, e.g. 'midnight'
  name: string; // display name
  h1: string;
  answer: string;
  targetKeyword: string;
  font?: string;
  palette: import('@/components/pseo/theme-mock').ThemePalette;
  sections: ContentSection[];
  faqs: FaqEntry[];
}

/** Quality gate (anti-thin-content): only publishable pages get prerendered + sitemapped. */
export function isPublishableIntegration(c: IntegrationContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 4 &&
    c.faqs.length >= 3 &&
    Object.keys(c.blockCopy).length >= 1
  );
}

export function isPublishableTemplate(c: TemplateContent): boolean {
  return c.h1.trim() !== '' && c.answer.trim() !== '' && c.sections.length >= 4 && c.faqs.length >= 3;
}
```

- [ ] **Step 2: Author the integration content (5 records).** Create `apps/marketing/src/content/integrations.ts`. Provide a typed array of 5 `IntegrationContent` records — `spotify`, `instagram`, `tiktok`, `threads`, `github` — and accessors. **Worked example (author the other four to the same standard):**
```ts
import type { IntegrationContent } from '@/content/pseo-types';
import { isPublishableIntegration } from '@/content/pseo-types';

const INTEGRATIONS: IntegrationContent[] = [
  {
    slug: 'spotify',
    integrationType: 'spotify',
    name: 'Spotify',
    h1: 'Add Spotify to your link in bio',
    answer:
      'Linky lets you show what you are listening to on Spotify right inside your link-in-bio page, so fans can follow your taste and play your tracks in one tap.',
    targetKeyword: 'spotify link in bio',
    blockCopy: {
      'spotify-playing-now': {
        name: 'Now Playing',
        description: 'Live-updates with the track you are currently playing on Spotify.',
      },
    },
    sections: [
      { heading: 'What you can show', body: 'Your Now Playing track updates automatically… (2–3 sentences of unique copy).' },
      { heading: 'How to add Spotify to your Linky', body: '1) Create your page. 2) Connect Spotify. 3) Drop in the Now Playing block. (unique copy).' },
      { heading: 'Why it works for creators', body: 'A live music block turns a static bio into something fans check back on… (unique copy).' },
      { heading: 'Make it yours', body: 'Pair the Spotify block with your theme and other blocks… (unique copy).' },
    ],
    faqs: [
      { question: 'Is the Spotify block free?', answer: 'Yes — the Now Playing block is available on the free plan.' },
      { question: 'Does it update automatically?', answer: 'Yes, it reflects your current Spotify playback.' },
      { question: 'Do my visitors need a Spotify account?', answer: 'No, anyone can see the block; playback opens in Spotify.' },
    ],
  },
  // TODO(author): instagram, tiktok, threads, github — same shape, unique answer-first copy,
  // blockCopy keyed by the REAL block keys for that integrationType (see Conventions),
  // ≥4 sections and ≥3 FAQs each. Keep claims accurate to real blocks.
];

export const integrations = INTEGRATIONS.filter(isPublishableIntegration);
export const getIntegration = (slug: string) => integrations.find((i) => i.slug === slug) ?? null;
export const getIntegrationSlugs = () => integrations.map((i) => i.slug);
```
**Authoring rules:** answer-first H1 mirroring `targetKeyword`; every section body is unique prose (no boilerplate repeated across integrations); `blockCopy` keys MUST be real block keys for that `integrationType` (spotify→`spotify-playing-now`; instagram→`instagram-latest-post`,`instagram-follower-count`; tiktok→`tiktok-follower-count`,`tiktok-latest-post`; threads→`threads-follower-count`; github→`github-commits-this-month`); claims must be accurate. Replace the `TODO` with the four real records (do NOT leave a TODO in the committed file).

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/content/pseo-types.ts apps/marketing/src/content/integrations.ts
git commit -m "$(cat <<'EOF'
feat(pseo): integration content (5) + content types + quality gate

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 7: Template content (6 records, snapshotted palettes)

**Files:**
- Create: `apps/marketing/src/content/templates.ts`

- [ ] **Step 1: Author the template content (6 records).** Create `apps/marketing/src/content/templates.ts` with 6 `TemplateContent` records for the curated themes (`Default`, `Purple`, `Black`, `Forest`, `Lilac`, `OrangePunch`), each with an editorial `slug`/`name`/`h1`/`answer` and the SNAPSHOTTED palette. **Worked examples for two themes (snapshot the other four palettes from `apps/frontend/lib/theme.ts`):**
```ts
import type { TemplateContent, ThemePalette } from '@/content/pseo-types';
import { isPublishableTemplate } from '@/content/pseo-types';

// Palettes mirror apps/frontend/lib/theme.ts defaultThemeSeeds (source of truth).
const PALETTES: Record<string, ThemePalette> = {
  // mirrors defaultThemeSeeds.Default
  classic: {
    colorBgBase: { h: 60, s: 0.0476, l: 0.96 },
    colorBgPrimary: { h: 0, s: 0, l: 1 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 0, s: 0, l: 0.9176 },
    colorLabelPrimary: { h: 240, s: 0.0345, l: 0.1137 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.16 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  // mirrors defaultThemeSeeds.Black
  midnight: {
    colorBgBase: { h: 0, s: 0, l: 0 },
    colorBgPrimary: { h: 0, s: 0, l: 0 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 0, s: 0, l: 0.1607 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.9804 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  // TODO(author): purple, forest, lilac, orange-punch — snapshot from defaultThemeSeeds.
};

const TEMPLATES: TemplateContent[] = [
  {
    slug: 'midnight',
    name: 'Midnight',
    h1: 'Midnight — a dark link in bio template',
    answer: 'Midnight is a bold, all-black link-in-bio template with high-contrast white text — clean, modern, and easy to read on any screen.',
    targetKeyword: 'dark link in bio template',
    palette: PALETTES.midnight,
    sections: [
      { heading: 'A dark theme that pops', body: 'Unique copy on the look/feel…' },
      { heading: 'What is included', body: 'Background, text, and accent colors tuned for contrast… (unique).' },
      { heading: 'Best for', body: 'Musicians, photographers, night-mode lovers… (unique).' },
      { heading: 'Make it yours', body: 'Swap colors, add blocks, set your font… (unique).' },
    ],
    faqs: [
      { question: 'Is the Midnight template free?', answer: 'Yes — start free and apply it in seconds.' },
      { question: 'Can I customize the colors?', answer: 'Yes, every color is editable in the editor.' },
      { question: 'Does dark mode hurt readability?', answer: 'Midnight uses high-contrast white text for legibility.' },
    ],
  },
  // TODO(author): classic (Default), + purple, forest, lilac, orange-punch records.
];

export const templates = TEMPLATES.filter(isPublishableTemplate);
export const getTemplate = (slug: string) => templates.find((t) => t.slug === slug) ?? null;
export const getTemplateSlugs = () => templates.map((t) => t.slug);
```
**Authoring rules:** snapshot ALL 6 palettes exactly from `apps/frontend/lib/theme.ts` `defaultThemeSeeds` (read that file; copy the `{h,s,l}` values verbatim, keeping `s`/`l` as 0–1 fractions); give each an editorial slug (e.g. `classic`, `midnight`, `violet`, `forest`, `lilac`, `orange-punch`) and unique answer-first copy targeting a real long-tail (e.g. "purple link in bio template"); ≥4 sections, ≥3 FAQs each. Replace BOTH `TODO`s — no TODOs in the committed file.

- [ ] **Step 2: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/content/templates.ts
git commit -m "$(cat <<'EOF'
feat(pseo): template content (6) with snapshotted palettes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 8: Integration routes (hub + dynamic page)

**Files:**
- Create: `apps/marketing/src/app/integrations/page.tsx`
- Create: `apps/marketing/src/app/integrations/[integration]/page.tsx`

- [ ] **Step 1: Dynamic integration page.** Create `apps/marketing/src/app/integrations/[integration]/page.tsx`:
```tsx
import { PseoPage } from '@/components/pseo/pseo-page';
import { IntegrationBlocks } from '@/components/pseo/integration-blocks';
import { getIntegration, getIntegrationSlugs } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getIntegrationSlugs().map((integration) => ({ integration }));
}

export async function generateMetadata(props: { params: Promise<{ integration: string }> }): Promise<Metadata> {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/integrations/${c.slug}` });
}

export default async function IntegrationPage(props: { params: Promise<{ integration: string }> }) {
  const { integration } = await props.params;
  const c = getIntegration(integration);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Integrations', url: 'https://lin.ky/integrations' },
        { name: c.name, url: `https://lin.ky/integrations/${c.slug}` },
      ]}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 0 && <IntegrationBlocks integrationType={c.integrationType} blockCopy={c.blockCopy} />}
        </section>
      ))}
    </PseoPage>
  );
}
```

- [ ] **Step 2: Integrations hub.** Create `apps/marketing/src/app/integrations/page.tsx`:
```tsx
import { MarketingContainer } from '@/components/marketing-container';
import { integrations } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio integrations | Linky',
  description: 'Connect Spotify, Instagram, TikTok, Threads, and GitHub to your Linky link-in-bio page. See every integration and what it adds.',
  path: '/integrations',
});

export default function IntegrationsHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Integrations</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Everything you can connect to your Linky page.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <li key={i.slug}>
              <Link href={`/integrations/${i.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">{i.name}</div>
                <p className="mt-1 text-sm text-gray-600">{i.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/app/integrations
git commit -m "$(cat <<'EOF'
feat(pseo): integration hub + pages (SSG, schema, clean URLs)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 9: Template routes (hub + dynamic page)

**Files:**
- Create: `apps/marketing/src/app/templates/page.tsx`
- Create: `apps/marketing/src/app/templates/[template]/page.tsx`

- [ ] **Step 1: Dynamic template page.** Create `apps/marketing/src/app/templates/[template]/page.tsx`:
```tsx
import { PseoPage } from '@/components/pseo/pseo-page';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getTemplate, getTemplateSlugs } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getTemplateSlugs().map((template) => ({ template }));
}

export async function generateMetadata(props: { params: Promise<{ template: string }> }): Promise<Metadata> {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/templates/${c.slug}` });
}

export default async function TemplatePage(props: { params: Promise<{ template: string }> }) {
  const { template } = await props.params;
  const c = getTemplate(template);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Templates', url: 'https://lin.ky/templates' },
        { name: c.name, url: `https://lin.ky/templates/${c.slug}` },
      ]}
      hero={<ThemeMock palette={c.palette} name={c.name} />}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
        </section>
      ))}
    </PseoPage>
  );
}
```

- [ ] **Step 2: Templates hub (gallery grid).** Create `apps/marketing/src/app/templates/page.tsx`:
```tsx
import { MarketingContainer } from '@/components/marketing-container';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio templates | Linky',
  description: 'Browse free link-in-bio templates — light, dark, colorful — and apply one to your Linky page in seconds.',
  path: '/templates',
});

export default function TemplatesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Templates</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Free link-in-bio templates you can make your own.</p>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.slug}>
              <Link href={`/templates/${t.slug}`} className="block">
                <ThemeMock palette={t.palette} name={t.name} size="thumb" />
                <div className="mt-3 font-semibold">{t.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/app/templates
git commit -m "$(cat <<'EOF'
feat(pseo): template hub (live mock gallery) + pages (SSG, schema)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 10: Sitemap population + footer Resources links

**Files:**
- Modify: `apps/marketing/src/app/sitemap.ts`
- Modify: `apps/marketing/src/components/marketing-footer.tsx`

- [ ] **Step 1: Populate `pseoSitemap`.** In `apps/marketing/src/app/sitemap.ts`, replace `const pseoSitemap: MetadataRoute.Sitemap = [];` with content-driven entries at clean root URLs (only publishable pages are in the exported `integrations`/`templates` arrays, so the gate is honored):
```ts
import { integrations } from '@/content/integrations';
import { templates } from '@/content/templates';

const pseoSitemap: MetadataRoute.Sitemap = [
  { url: 'https://lin.ky/integrations', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: 'https://lin.ky/templates', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ...integrations.map((i) => ({
    url: `https://lin.ky/integrations/${i.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
  ...templates.map((t) => ({
    url: `https://lin.ky/templates/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
];
```
(Keep the existing exclusion comment about user pages. Place the imports at the top of the file.)

- [ ] **Step 2: Footer Resources links.** In `apps/marketing/src/components/marketing-footer.tsx`, add two nav links to the existing nav-links list, matching the existing `<li><Link href>…</Link></li>` pattern exactly:
```tsx
            <li><Link href="/integrations">Integrations</Link></li>
            <li><Link href="/templates">Templates</Link></li>
```
(Use the same `<Link>` import/styling already used by neighboring items in that file.)

- [ ] **Step 3: Typecheck + commit.** `pnpm typecheck` PASS.
```bash
git add apps/marketing/src/app/sitemap.ts apps/marketing/src/components/marketing-footer.tsx
git commit -m "$(cat <<'EOF'
feat(pseo): sitemap PSEO pages + footer Resources links

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 11: Full verification

**Files:** none

- [ ] **Step 1: Gates.** From repo root:
```bash
pnpm --filter @trylinky/seo test   # expect 19 passing
pnpm typecheck                     # expect 10/10
pnpm lint                          # expect frontend + marketing pass
```

- [ ] **Step 2: Static generation check.** Confirm the routes prerender. If a marketing build is runnable in the environment (`pnpm --filter @trylinky/marketing build`), confirm `/integrations/*` and `/templates/*` appear as static (SSG) routes and `generateStaticParams` emitted all 5 + 6 + 2 hubs. If a full build can't run (env/secrets), note it as a manual follow-up.

- [ ] **Step 3: Manual follow-ups (cannot be done headlessly — list in the report):**
  - Load `lin.ky/integrations/spotify` and `lin.ky/templates/midnight` (after deploy or `next dev`): confirm clean URL resolves (not a user-slug 404), canonical = clean URL, FAQPage + BreadcrumbList validate in Rich Results Test.
  - Confirm no collision: a user page whose slug is e.g. `integrations` cannot exist — confirm reserved behavior is acceptable (these are reserved words now).
  - Confirm the theme mocks render with correct colors.

- [ ] **Step 4: Report** spec coverage and any deviations.

---

## Spec coverage check

| Spec 2 requirement | Task |
|---|---|
| `buildFaqSchema` in `@trylinky/seo` + FAQ refactor | 1 |
| Clean URLs (rewrites + middleware) | 2 |
| `<PseoPage>` engine + `buildPseoMetadata` + `<PseoFaq>` | 3 |
| Live CSS theme mock | 4 |
| Registry-backed integration showcase | 5 |
| Typed content + quality gate + integration content (5) | 6 |
| Template content (6) + snapshotted palettes | 7 |
| Integration hub + pages (SSG, schema) | 8 |
| Template hub + pages (SSG, schema) | 9 |
| Sitemap population + internal linking | 10 |
| Verification | 11 |

## Notes & deferrals
- All pages are fully in-repo + SSG (no API/DB/screenshot dependency).
- "Use this template" deep-link into the app is deferred; CTA uses the existing `CallToActionBlock`.
- Editorial copy is AI/eng-authored under the quality-gate constraints and verified in code review (answer-first, ≥4 unique sections, ≥3 FAQs, accurate claims, real block keys / real palettes).
- `/integrations` and `/templates` are now reserved root paths (cannot be user slugs) — acceptable and intended.
