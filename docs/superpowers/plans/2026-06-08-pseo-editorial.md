# PSEO Editorial Archetypes (Spec 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add use-case/industry pages (`/for/<niche>`) and competitor-alternative pages (`/alternatives/<competitor>`) on the existing Spec 2 PSEO engine, with the strictest quality gate and an accuracy review for every competitor claim.

**Architecture:** Reuse the Spec 2 engine wholesale — `<PseoPage>`, `buildFaqSchema`/`buildPseoMetadata`, `<IntegrationBlocks>`, `<ThemeMock>`, the typed-content + quality-gate pattern, clean-URL plumbing, and sitemap/footer wiring. Add two typed content modules + two route groups + one new `<ComparisonTable>` component. Everything is in-repo + fully SSG.

**Tech Stack:** Next.js 16 (App Router, SSG), Tailwind v4, `@trylinky/seo`, `@trylinky/blocks`, `@trylinky/ui`.

**Spec:** `docs/superpowers/specs/2026-06-08-pseo-editorial-design.md`

**Branch:** `seo/geo-foundation` (continues the initiative).

---

## Conventions & key facts (read before starting)

- Branch `seo/geo-foundation` already checked out — do NOT create/switch branches. Commit messages end with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Marketing app, basePath `/i`, alias `@/` → `apps/marketing/src/`. Existing Spec 2 pieces to REUSE (already built): `@/components/pseo/pseo-page` (`PseoPage`), `@/components/pseo/pseo-faq` (`FaqEntry`), `@/components/pseo/theme-mock` (`ThemeMock`), `@/components/pseo/integration-blocks` (`IntegrationBlocks` — props `{ blockCopy }`), `@/lib/seo-metadata` (`buildPseoMetadata`), `@/content/pseo-types` (`ContentSection`, `FaqEntry` types). Spec 2 content: `@/content/integrations` (slugs: spotify, instagram, tiktok, threads, github), `@/content/templates` (slugs: classic, violet, midnight, forest, lilac, orange-punch).
- Real block keys (for niche `recommendedBlocks`): `spotify-playing-now`, `instagram-latest-post`, `instagram-follower-count`, `tiktok-follower-count`, `tiktok-latest-post`, `threads-follower-count`, `github-commits-this-month`, `link-box`, `link-bar`, `image`, `youtube`, `map`, `content`, `waitlist-email`, `reactions`. Validate any recommendedBlocks against the `@trylinky/blocks` registry (use the existing `isRealBlock` from `@/components/pseo/integration-blocks` — export it if not already exported).
- Gates: `pnpm typecheck`, `pnpm lint`, `pnpm --filter @trylinky/seo test`.
- Plans/pricing facts for the comparison tables live in `packages/common/src/billing/plans.ts` (`Plan = 'legacyFree' | 'premium' | 'team'`; names Free/Premium/Team) and `packages/common/src/billing/pricing-table.tsx` (feature lists). Use these for the "Linky" column — do not invent Linky features.

---

# Task 1: Content types (niche + alternative) + stricter gates + ComparisonTable

**Files:**
- Modify: `apps/marketing/src/content/pseo-types.ts`
- Modify: `apps/marketing/src/components/pseo/integration-blocks.tsx` (export `isRealBlock` if not exported)
- Create: `apps/marketing/src/components/pseo/comparison-table.tsx`

- [ ] **Step 1: Add types + gates.** Append to `apps/marketing/src/content/pseo-types.ts`:
```ts
export interface ComparisonRow {
  feature: string;
  linky: string;
  competitor: string;
}

export interface NicheContent {
  slug: string; // e.g. 'musicians'
  name: string; // 'Musicians'
  h1: string;
  answer: string;
  targetKeyword: string;
  sections: ContentSection[];
  faqs: FaqEntry[];
  recommendedBlocks?: string[]; // real @trylinky/blocks keys
  relatedIntegrations?: string[]; // slugs in @/content/integrations
  recommendedTemplate?: string; // slug in @/content/templates
}

export interface AlternativeContent {
  slug: string; // e.g. 'linktree'
  competitor: string; // 'Linktree'
  h1: string;
  answer: string;
  targetKeyword: string;
  sections: ContentSection[];
  faqs: FaqEntry[];
  comparison: ComparisonRow[];
}

/** Strictest gate (editorial): require richer content than Spec 2's data-driven pages. */
export function isPublishableNiche(c: NicheContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 5 &&
    c.faqs.length >= 4 &&
    ((c.recommendedBlocks?.length ?? 0) >= 1 ||
      (c.relatedIntegrations?.length ?? 0) >= 1 ||
      Boolean(c.recommendedTemplate))
  );
}

export function isPublishableAlternative(c: AlternativeContent): boolean {
  return (
    c.h1.trim() !== '' &&
    c.answer.trim() !== '' &&
    c.sections.length >= 5 &&
    c.faqs.length >= 4 &&
    c.comparison.length >= 4
  );
}
```

- [ ] **Step 2: Export `isRealBlock`.** In `apps/marketing/src/components/pseo/integration-blocks.tsx`, confirm `isRealBlock` is `export`ed (it was added in Spec 2). If it is already exported, no change. If not, add `export`.

- [ ] **Step 3: Create `<ComparisonTable>`.** Create `apps/marketing/src/components/pseo/comparison-table.tsx`:
```tsx
import type { ComparisonRow } from '@/content/pseo-types';

export function ComparisonTable({ competitor, rows }: { competitor: string; rows: ComparisonRow[] }) {
  return (
    <div className="not-prose my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 pr-4 font-semibold">Feature</th>
            <th className="py-3 pr-4 font-semibold">Linky</th>
            <th className="py-3 font-semibold">{competitor}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-3 pr-4 font-medium text-gray-900">{row.feature}</td>
              <td className="py-3 pr-4 text-gray-700">{row.linky}</td>
              <td className="py-3 text-gray-700">{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: typecheck + lint + commit.**
```bash
git add apps/marketing/src/content/pseo-types.ts apps/marketing/src/components/pseo/integration-blocks.tsx apps/marketing/src/components/pseo/comparison-table.tsx
git commit -m "$(cat <<'EOF'
feat(pseo): niche/alternative content types + strict gates + comparison table

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 2: Clean-URL plumbing for `/for` and `/alternatives`

**Files:**
- Modify: `apps/frontend/next.config.ts`
- Modify: `apps/frontend/middleware.ts`

- [ ] **Step 1: Rewrites.** In `apps/frontend/next.config.ts` `rewrites()` array, add BEFORE the `/i/:path*` entry (next to the Spec 2 integrations/templates entries):
```ts
  { source: '/for', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/for` },
  { source: '/for/:path*', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/for/:path*` },
  { source: '/alternatives', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/alternatives` },
  { source: '/alternatives/:path*', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/alternatives/:path*` },
```

- [ ] **Step 2: Middleware.** In `apps/frontend/middleware.ts`, add `for|alternatives` to the matcher negative-lookahead (after `integrations|templates|`):
```ts
    '/((?!api/|_next/|i/|_static/|_vercel|e(?=/|$)|edit|invite|new|new-api|assets|integrations|templates|for|alternatives|[\\w-]+\\.\\w+).*)',
```

- [ ] **Step 3: typecheck + commit.**
```bash
git add apps/frontend/next.config.ts apps/frontend/middleware.ts
git commit -m "$(cat <<'EOF'
feat(pseo): route /for and /alternatives to the marketing app

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 3: Competitor-alternative content (5 records) — ACCURACY-CRITICAL

**Files:**
- Create: `apps/marketing/src/content/alternatives.ts`

Author 5 `AlternativeContent` records: `linktree`, `beacons`, `bio-link` (Bio.link), `carrd`, `later`. This names real competitors — every claim must be accurate and fair.

- [ ] **Step 1: Author the file.** Create `apps/marketing/src/content/alternatives.ts`:
```ts
import type { AlternativeContent } from '@/content/pseo-types';
import { isPublishableAlternative } from '@/content/pseo-types';

const ALTERNATIVES: AlternativeContent[] = [ /* 5 records */ ];

export const alternatives = ALTERNATIVES.filter(isPublishableAlternative);
export const getAlternative = (slug: string) => alternatives.find((a) => a.slug === slug) ?? null;
export const getAlternativeSlugs = () => alternatives.map((a) => a.slug);
```

**Authoring requirements (per record):**
- `slug`/`competitor` per the list (e.g. `slug:'linktree', competitor:'Linktree'`; `slug:'bio-link', competitor:'Bio.link'`).
- `h1`: answer-first, e.g. "Linky: a Linktree alternative built for rich pages". `targetKeyword`: e.g. "linktree alternative".
- `answer`: one fair sentence positioning Linky vs the competitor.
- `sections`: ≥5 distinct, unique sections. Suggested arc: (1) what to look for in an alternative; (2) where Linky stands out (rich blocks/themes — real Linky features); (3) honest note on what the competitor does well (fairness builds trust + avoids false claims); (4) migration/getting-started; (5) who should switch. Lead with Linky's strengths; do NOT disparage.
- `comparison`: ≥4 `ComparisonRow`s. The **Linky column must reflect REAL Linky capabilities** (cross-check `packages/common/src/billing/plans.ts` + `pricing-table.tsx` + the block registry — e.g. custom domains on paid, themes, blocks like Spotify/Instagram). The **competitor column must be accurate or omitted** — only state competitor facts that are currently true and broadly known; when unsure, use a neutral/parity statement, never an invented limitation.
- `faqs`: ≥4, e.g. "Is Linky free?", "Can I import my <competitor> links?", "How is Linky different from <competitor>?". Accurate only.

**ACCURACY RULES (hard):** No invented competitor limitations. No unverifiable pricing claims. Fair tone. If you cannot verify a competitor fact, write a neutral comparison row or omit it. The reviewer will cut unverifiable claims.

- [ ] **Step 2: typecheck + lint + commit.** Confirm `alternatives.length === 5`.
```bash
git add apps/marketing/src/content/alternatives.ts
git commit -m "$(cat <<'EOF'
feat(pseo): competitor-alternative content (5), accuracy-reviewed

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 4: Niche content — creator set (5 records)

**Files:**
- Create: `apps/marketing/src/content/niches.ts` (with the creator-set records; Task 5 appends the rest)

- [ ] **Step 1: Author the file with the 5 creator-set records.** Create `apps/marketing/src/content/niches.ts`:
```ts
import type { NicheContent } from '@/content/pseo-types';
import { isPublishableNiche } from '@/content/pseo-types';

const NICHES: NicheContent[] = [
  // creator set (this task): musicians, photographers, podcasters, artists, content-creators
];

export const niches = NICHES.filter(isPublishableNiche);
export const getNiche = (slug: string) => niches.find((n) => n.slug === slug) ?? null;
export const getNicheSlugs = () => niches.map((n) => n.slug);
```

**Authoring requirements (per niche):**
- `slug`/`name`: e.g. `musicians`/"Musicians".
- `h1`: answer-first, e.g. "The best link in bio for musicians". `targetKeyword`: "link in bio for musicians".
- `answer`: one sentence on why Linky fits this niche.
- `sections`: ≥5 distinct, UNIQUE sections tailored to the niche (no boilerplate swap). Suggested arc: (1) why this niche needs a link in bio; (2) which Linky blocks suit them (reference REAL blocks); (3) a suggested setup; (4) themes/branding angle; (5) tips/getting started.
- `recommendedBlocks`: 2–4 REAL block keys that genuinely suit the niche (e.g. musicians → `spotify-playing-now`, `link-box`, `youtube`). Must be real registry keys.
- `relatedIntegrations`: where natural, slugs from `@/content/integrations` (e.g. musicians → `spotify`; content-creators → `instagram`, `tiktok`).
- `recommendedTemplate`: where natural, a real slug from `@/content/templates` (e.g. photographers → `midnight`).
- `faqs`: ≥4, tailored + accurate.

Make each niche genuinely distinct and concrete. No TODOs/placeholders.

- [ ] **Step 2: typecheck + lint + commit.** Confirm the 5 creator records pass the gate.
```bash
git add apps/marketing/src/content/niches.ts
git commit -m "$(cat <<'EOF'
feat(pseo): niche content — creator set (5)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 5: Niche content — local + professional sets (8 records)

**Files:**
- Modify: `apps/marketing/src/content/niches.ts`

- [ ] **Step 1: Append 8 records to the `NICHES` array.** Local: `restaurants`, `salons`, `real-estate-agents`, `personal-trainers`. Professional: `writers`, `developers`, `designers`, `coaches`. Same `NicheContent` shape and authoring requirements as Task 4 (≥5 unique sections, ≥4 FAQs, real `recommendedBlocks`, natural `relatedIntegrations`/`recommendedTemplate`). Examples of fitting real-data links: `developers` → `recommendedBlocks: ['github-commits-this-month', 'link-box']`, `relatedIntegrations: ['github']`; `restaurants` → `recommendedBlocks: ['map', 'link-box', 'image']`; `writers` → `recommendedBlocks: ['content', 'link-box', 'waitlist-email']`. Keep each niche's prose unique and concrete to that profession/business.

- [ ] **Step 2: typecheck + lint + commit.** Confirm `niches.length === 13`.
```bash
git add apps/marketing/src/content/niches.ts
git commit -m "$(cat <<'EOF'
feat(pseo): niche content — local + professional sets (8)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 6: Alternative routes (hub + dynamic page)

**Files:**
- Create: `apps/marketing/src/app/alternatives/page.tsx`
- Create: `apps/marketing/src/app/alternatives/[competitor]/page.tsx`

- [ ] **Step 1: Dynamic alternative page.** Create `apps/marketing/src/app/alternatives/[competitor]/page.tsx`:
```tsx
import { PseoPage } from '@/components/pseo/pseo-page';
import { ComparisonTable } from '@/components/pseo/comparison-table';
import { getAlternative, getAlternativeSlugs } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getAlternativeSlugs().map((competitor) => ({ competitor }));
}

export async function generateMetadata(props: { params: Promise<{ competitor: string }> }): Promise<Metadata> {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/alternatives/${c.slug}` });
}

export default async function AlternativePage(props: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await props.params;
  const c = getAlternative(competitor);
  if (!c) notFound();

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Alternatives', url: 'https://lin.ky/alternatives' },
        { name: c.competitor, url: `https://lin.ky/alternatives/${c.slug}` },
      ]}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 1 && <ComparisonTable competitor={c.competitor} rows={c.comparison} />}
        </section>
      ))}
    </PseoPage>
  );
}
```

- [ ] **Step 2: Alternatives hub.** Create `apps/marketing/src/app/alternatives/page.tsx`:
```tsx
import { MarketingContainer } from '@/components/marketing-container';
import { alternatives } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio alternatives | Linky',
  description: 'See how Linky compares to Linktree, Beacons, Bio.link, Carrd, and Later — and why creators switch to a richer link-in-bio page.',
  path: '/alternatives',
});

export default function AlternativesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Linky vs the alternatives</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">Honest comparisons with the other link-in-bio tools.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link href={`/alternatives/${a.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">Linky vs {a.competitor}</div>
                <p className="mt-1 text-sm text-gray-600">{a.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
```

- [ ] **Step 3: typecheck + lint + commit.**
```bash
git add apps/marketing/src/app/alternatives
git commit -m "$(cat <<'EOF'
feat(pseo): alternatives hub + pages (SSG, comparison tables)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 7: Niche routes (hub + dynamic page) with real-data cross-links

**Files:**
- Create: `apps/marketing/src/app/for/page.tsx`
- Create: `apps/marketing/src/app/for/[niche]/page.tsx`

- [ ] **Step 1: Dynamic niche page.** Create `apps/marketing/src/app/for/[niche]/page.tsx`:
```tsx
import { PseoPage } from '@/components/pseo/pseo-page';
import { IntegrationBlocks } from '@/components/pseo/integration-blocks';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { getNiche, getNicheSlugs } from '@/content/niches';
import { getTemplate } from '@/content/templates';
import { blocks } from '@trylinky/blocks';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamicParams = false;

export function generateStaticParams() {
  return getNicheSlugs().map((niche) => ({ niche }));
}

export async function generateMetadata(props: { params: Promise<{ niche: string }> }): Promise<Metadata> {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) return {};
  return buildPseoMetadata({ title: `${c.h1} | Linky`, description: c.answer, path: `/for/${c.slug}` });
}

export default async function NichePage(props: { params: Promise<{ niche: string }> }) {
  const { niche } = await props.params;
  const c = getNiche(niche);
  if (!c) notFound();

  // Build a blockCopy map from recommended real block keys (label = humanized key).
  const blockCopy: Record<string, { name: string; description: string }> = {};
  for (const key of c.recommendedBlocks ?? []) {
    if (Object.prototype.hasOwnProperty.call(blocks, key)) {
      blockCopy[key] = { name: humanizeBlockKey(key), description: '' };
    }
  }
  const template = c.recommendedTemplate ? getTemplate(c.recommendedTemplate) : null;

  return (
    <PseoPage
      h1={c.h1}
      answer={c.answer}
      breadcrumbs={[
        { name: 'Home', url: 'https://lin.ky' },
        { name: 'Use cases', url: 'https://lin.ky/for' },
        { name: c.name, url: `https://lin.ky/for/${c.slug}` },
      ]}
      hero={template ? <ThemeMock palette={template.palette} name={template.name} /> : undefined}
      faqs={c.faqs}
    >
      {c.sections.map((s, i) => (
        <section key={i}>
          <h2>{s.heading}</h2>
          <p>{s.body}</p>
          {i === 1 && Object.keys(blockCopy).length > 0 && <IntegrationBlocks blockCopy={blockCopy} />}
        </section>
      ))}
      {(c.relatedIntegrations?.length || c.recommendedTemplate) && (
        <section className="not-prose">
          <h2 className="text-xl font-semibold">Related</h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            {(c.relatedIntegrations ?? []).map((slug) => (
              <li key={slug}>
                <Link href={`/integrations/${slug}`} className="text-blue-700 hover:underline">{slug} integration</Link>
              </li>
            ))}
            {c.recommendedTemplate && (
              <li>
                <Link href={`/templates/${c.recommendedTemplate}`} className="text-blue-700 hover:underline">{c.recommendedTemplate} template</Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </PseoPage>
  );
}

function humanizeBlockKey(key: string): string {
  return key.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}
```

- [ ] **Step 2: Niche hub.** Create `apps/marketing/src/app/for/page.tsx`:
```tsx
import { MarketingContainer } from '@/components/marketing-container';
import { niches } from '@/content/niches';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio for every creator and business | Linky',
  description: 'Link-in-bio pages tailored for musicians, photographers, restaurants, developers, and more. Find the right setup for you.',
  path: '/for',
});

export default function NichesHub() {
  return (
    <div className="bg-[#FCFBF8]">
      <MarketingContainer className="py-16">
        <h1 className="text-4xl font-bold tracking-tight">Linky for everyone</h1>
        <p className="mt-4 max-w-2xl text-xl text-gray-600">A link in bio tailored to what you do.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => (
            <li key={n.slug}>
              <Link href={`/for/${n.slug}`} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-gray-300">
                <div className="text-lg font-semibold">{n.name}</div>
                <p className="mt-1 text-sm text-gray-600">{n.answer}</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingContainer>
    </div>
  );
}
```

- [ ] **Step 3: typecheck + lint + commit.**
```bash
git add apps/marketing/src/app/for
git commit -m "$(cat <<'EOF'
feat(pseo): use-case/niche hub + pages (SSG, real-data cross-links)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 8: Sitemap + footer links

**Files:**
- Modify: `apps/marketing/src/app/sitemap.ts`
- Modify: `apps/marketing/src/components/marketing-footer.tsx`

- [ ] **Step 1: Extend `pseoSitemap`.** In `apps/marketing/src/app/sitemap.ts`, add imports `import { niches } from '@/content/niches';` and `import { alternatives } from '@/content/alternatives';`, then add to the `pseoSitemap` array (after the Spec 2 entries):
```ts
  { url: 'https://lin.ky/for', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  { url: 'https://lin.ky/alternatives', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ...niches.map((n) => ({
    url: `https://lin.ky/for/${n.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
  ...alternatives.map((a) => ({
    url: `https://lin.ky/alternatives/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  })),
```

- [ ] **Step 2: Footer links.** In `apps/marketing/src/components/marketing-footer.tsx`, add two links matching the existing Spec 2 Resources links (`/integrations`, `/templates` pattern):
```tsx
                  <li><Link href="/for" className="transition-colors hover:text-white/90">Use cases</Link></li>
                  <li><Link href="/alternatives" className="transition-colors hover:text-white/90">Comparisons</Link></li>
```
(Match the exact `<li>`/`<Link>` className used by the neighboring `/integrations`/`/templates` items — copy their exact markup.)

- [ ] **Step 3: typecheck + lint + commit.**
```bash
git add apps/marketing/src/app/sitemap.ts apps/marketing/src/components/marketing-footer.tsx
git commit -m "$(cat <<'EOF'
feat(pseo): sitemap niche/alternative pages + footer links

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

# Task 9: Full verification

- [ ] **Step 1: Gates.** `pnpm --filter @trylinky/seo test` (19 pass), `pnpm typecheck` (10/10), `pnpm lint` (2/2).
- [ ] **Step 2: Counts.** Confirm `niches.length === 13`, `alternatives.length === 5`, and the sitemap now lists the new hubs + all niche/alternative URLs (clean root URLs; user pages still excluded).
- [ ] **Step 3: Cross-link integrity.** Confirm every niche `recommendedBlocks` key is a real registry block, every `relatedIntegrations` slug exists in `@/content/integrations`, and every `recommendedTemplate` exists in `@/content/templates` (a quick script or grep). Confirm the comparison tables' Linky column matches real Linky capabilities.
- [ ] **Step 4: Manual follow-ups (report, can't do headlessly):** live URL resolution (`lin.ky/for/musicians`, `lin.ky/alternatives/linktree`), canonical = clean URL, FAQPage + BreadcrumbList validate, no user-slug collision (`for`/`alternatives` reserved). **Accuracy sign-off** on all competitor claims before publish.
- [ ] **Step 5: Report** spec coverage + the initiative close-out.

---

## Spec coverage check

| Spec 3 requirement | Task |
|---|---|
| Niche + alternative content types + strict gates | 1 |
| Comparison table component | 1 |
| Clean URLs (`/for`, `/alternatives`) | 2 |
| Alternative content (5), accuracy-reviewed | 3 |
| Niche content creator set (5) | 4 |
| Niche content local + professional (8) | 5 |
| Alternative routes (SSG, comparison) | 6 |
| Niche routes (SSG, real-data cross-links) | 7 |
| Sitemap + footer | 8 |
| Verification + accuracy sign-off | 9 |

## Notes & deferrals
- All editorial copy is AI/eng-authored under the strict gate + accuracy rules; **competitor claims get a dedicated accuracy review** (cut anything unverifiable).
- `/for` and `/alternatives` become reserved root paths (cannot be user slugs) — intended.
- Comparison tables intentionally carry no schema.org markup (no robust type).
- Competitor facts drift; flag alternative pages for periodic copy review (not code).
