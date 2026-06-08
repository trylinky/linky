# PSEO Initiative — Spec 3: Editorial Archetypes

> **Date:** 2026-06-08
> **Status:** Design — awaiting review
> **Author:** Alex Pate (with Claude)
> **Part of** the SEO/GEO/PSEO initiative. Builds directly on **Spec 2** (`2026-06-08-pseo-engine-design.md`, shipped on branch `seo/geo-foundation`) — it reuses the `<PseoPage>` engine, `buildFaqSchema`/`buildPseoMetadata`, the typed-content + quality-gate pattern, the clean-URL plumbing, and the sitemap/internal-linking approach. This is the final spec of the initiative.

---

## Goal

Add the two **editorial** PSEO archetypes — **use-case/industry** pages (`/for/<niche>`) and **competitor-alternative** pages (`/alternatives/<competitor>`) — on the Spec 2 engine. These target the highest-volume and highest-conversion long-tail in the category, but are the most editorial, so they get the **strictest** quality gate and an **accuracy review** (especially for any claim about a competitor). Real-data grounding comes from cross-linking each niche to the actual blocks/integrations/themes that suit it (the content we already built in Spec 2).

## Locked decisions

| Decision | Choice |
|---|---|
| Archetypes | **Use-case/industry** (`/for/<niche>`) + **competitor-alternative** (`/alternatives/<competitor>`) |
| Content approach | **Reuse the Spec 2 typed-content engine** (typed TS modules + `<PseoPage>`; NO MDX) |
| Competitor set (5) | `linktree`, `beacons`, `bio-link`, `carrd`, `later` |
| Niche set (~13) | Creator: `musicians`, `photographers`, `podcasters`, `artists`, `content-creators`. Local: `restaurants`, `salons`, `real-estate-agents`, `personal-trainers`. Professional: `writers`, `developers`, `designers`, `coaches` |
| Anti-thin-content | Strictest gate (≥5 sections, ≥4 FAQs, real-data cross-links); fair, accurate competitor claims; staged publish + GSC monitoring |

---

## Architecture (reuses Spec 2)

### Routing & clean URLs
New marketing routes, exposed at clean root URLs via the same frontend-rewrite + middleware-exclusion mechanism as Spec 2:
- `apps/marketing/src/app/for/page.tsx` → hub at `lin.ky/for`
- `apps/marketing/src/app/for/[niche]/page.tsx` → `lin.ky/for/musicians`
- `apps/marketing/src/app/alternatives/page.tsx` → hub at `lin.ky/alternatives`
- `apps/marketing/src/app/alternatives/[competitor]/page.tsx` → `lin.ky/alternatives/linktree`

Add to `apps/frontend/next.config.ts` rewrites: `/for`, `/for/:path*`, `/alternatives`, `/alternatives/:path*` → marketing (before the `/i/:path*` catch-all). Add `for|alternatives` to the `apps/frontend/middleware.ts` matcher negative-lookahead.

### Content layer (typed, reuses `pseo-types.ts`)
Extend `apps/marketing/src/content/pseo-types.ts` with two interfaces + their gates:
- `NicheContent` = `{ slug, name, h1, answer, targetKeyword, sections, faqs, recommendedBlocks?: string[], relatedIntegrations?: string[], recommendedTemplate?: string }` — the `recommended*` fields are the **real-data cross-links** (validated against the block registry / the Spec 2 integration & template content).
- `AlternativeContent` = `{ slug, competitor, h1, answer, targetKeyword, sections, faqs, comparison: ComparisonRow[] }` where `ComparisonRow = { feature: string; linky: string; competitor: string }`.
- `isPublishableNiche` / `isPublishableAlternative`: **stricter** than Spec 2 — require `sections.length >= 5`, `faqs.length >= 4`, non-empty h1/answer, and (niche) ≥1 real cross-link / (alternative) `comparison.length >= 4`.

New content modules: `apps/marketing/src/content/niches.ts` (13 records), `apps/marketing/src/content/alternatives.ts` (5 records), each with `getX`/`getXSlugs`/filtered export accessors.

### New component — comparison table (alternatives only)
`apps/marketing/src/components/pseo/comparison-table.tsx`: a server component rendering `ComparisonRow[]` as a "Linky vs <Competitor>" table (feature | Linky | competitor). Plain, accessible `<table>`. This is the real differentiator content on alternative pages.

### Niche real-data showcase (reuses Spec 2)
Niche pages render, where present, the `recommendedBlocks` via the existing `<IntegrationBlocks>` (block-registry validated) and a `recommendedTemplate` via the existing `<ThemeMock>` (linking to that `/templates/<slug>` page), and link to `relatedIntegrations` (`/integrations/<type>`). This both grounds the page in real product data and builds the internal-link graph across all PSEO pages.

### Schema, metadata, rendering
Each page uses `<PseoPage>` (BreadcrumbList + FAQPage already emitted) + `buildPseoMetadata` (clean canonical). Fully SSG (`generateStaticParams` over the filtered content; `dynamicParams = false`). Alternative pages MAY additionally emit no extra schema (comparison tables don't have a robust schema.org type worth the risk).

### Sitemap & internal linking
Extend `pseoSitemap` with the `/for` + `/alternatives` hubs and every published niche/alternative (clean URLs, gate-filtered). Add `/for` and `/alternatives` to the marketing footer Resources column. Hubs link to all children; niche pages cross-link to integrations/templates; alternative pages link to the relevant niches where natural.

---

## The accuracy/fairness bar (critical for competitor pages)

Competitor-alternative pages name real companies, so:
- **Only state competitor facts that are accurate and broadly verifiable** (e.g. "Linktree's free plan limits X" only if currently true). When unsure, omit — never invent limitations.
- **Lead with Linky's strengths, not competitor disparagement.** Fair, factual comparison; no FUD.
- The `comparison` rows must be **truthful for both columns** — Linky's column must reflect real Linky capabilities (cross-check against the block registry, themes, pricing/plans in `packages/common/src/billing`).
- Reviewers explicitly check every competitor claim and flag anything unverifiable. Unverifiable strong claims are cut before publish.

This mirrors the Spec 2 accuracy pass that caught the integration-copy errors — applied even more strictly here.

---

## File structure

**Create:**
- `apps/marketing/src/content/niches.ts`, `alternatives.ts`
- `apps/marketing/src/components/pseo/comparison-table.tsx`
- `apps/marketing/src/app/for/page.tsx`, `for/[niche]/page.tsx`
- `apps/marketing/src/app/alternatives/page.tsx`, `alternatives/[competitor]/page.tsx`

**Modify:**
- `apps/marketing/src/content/pseo-types.ts` — add `NicheContent`/`AlternativeContent`/`ComparisonRow` + stricter gates
- `apps/marketing/src/app/sitemap.ts` — add niche + alternative URLs to `pseoSitemap`
- `apps/marketing/src/components/marketing-footer.tsx` — add `/for`, `/alternatives` links
- `apps/frontend/next.config.ts`, `apps/frontend/middleware.ts` — clean-URL plumbing for `/for`, `/alternatives`

## Non-goals
- No new infra/components beyond the comparison table (everything else reuses Spec 2).
- No MDX.
- No deep "import this template" wiring (CTA = existing `CallToActionBlock`).
- Niche/competitor expansion beyond the launch set is future work.

## Rollout & verification
1. Ship engine extensions + both hubs + content behind no flag (additive routes).
2. Validate FAQPage + BreadcrumbList in Rich Results Test on a sample of each type.
3. Confirm clean URLs resolve + canonical agrees; no user-slug collision (`for`/`alternatives` reserved).
4. Confirm SSG + gate (thin/under-spec pages excluded from prerender AND sitemap).
5. `pnpm typecheck` + `pnpm lint` + `@trylinky/seo` tests green.
6. Accuracy review sign-off on all competitor claims; staged publish; watch GSC vs the Spec 1 baseline.

## Open questions / deferrals
1. **Competitor claim freshness** — competitor plans/limits change; treat alternative pages as needing periodic review (note in copy review, not code).
2. **Exact niche copy** — authored under the strict gate + accuracy rules during implementation, reviewed for uniqueness/accuracy.
3. **Comparison schema** — intentionally no schema.org markup on the comparison table (no safe robust type); revisit if Google adds support.

## Initiative close-out
With Spec 3, the SEO/GEO/PSEO initiative's planned scope is complete: GEO/technical foundation (Spec 1) + a programmatic engine with four archetypes — integration, template-gallery (Spec 2), use-case/industry, and competitor-alternative (Spec 3) — all measurable against the Spec 1 GSC baseline.
