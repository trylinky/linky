# PSEO Initiative — Spec 2: Engine + Data-Driven Archetypes

> **Date:** 2026-06-08
> **Status:** Design — awaiting review
> **Author:** Alex Pate (with Claude)
> **Part of** the SEO/GEO/PSEO initiative. Builds on **Spec 1** (`2026-06-08-seo-geo-foundation-design.md`, shipped on branch `seo/geo-foundation`). **Spec 3** (editorial archetypes) follows and reuses this engine.

---

## Goal

Build a reusable programmatic-SEO landing-page engine in the marketing app and prove it on two **data-driven** archetypes whose uniqueness comes from real product data (so they survive Google's scaled-content-abuse bar): **integration pages** (one per real integration, backed by the block registry) and **template-gallery pages** (one per curated theme, backed by the real theme palette). Each page targets a long-tail keyword cluster, is answer-first, emits FAQ + Breadcrumb schema, and is fully statically generated.

## Locked decisions (from initiative brainstorming + Spec 2 design)

| Decision | Choice |
|---|---|
| Hosting | Marketing app (`apps/marketing`), clean root URLs via frontend rewrites |
| Content data layer | In-repo **typed TS content modules** (MDX reserved for Spec 3's prose archetypes) |
| Archetypes (this spec) | **Integration pages** + **Template-gallery pages** |
| Template preview | **Live CSS mock** (real HSL colors + font; no screenshot/OG-image dependency) |
| Launch scope | 5 integrations (Spotify, Instagram, TikTok, Threads, GitHub) + 6 themes (Default, Purple, Black, Forest, Lilac, Orange Punch) + `/integrations` & `/templates` hubs |
| Anti-thin-content | Real data per page + ≥4 unique editorial sections + tailored FAQ; quality-gated sitemap; staged publish + GSC monitoring |

---

## Architecture

### Routing & clean URLs

Pages live in `apps/marketing/src/app/` (served under basePath `/i`) and are exposed at clean root URLs via the frontend:

- `apps/marketing/src/app/integrations/page.tsx` → hub at `lin.ky/integrations`
- `apps/marketing/src/app/integrations/[integration]/page.tsx` → `lin.ky/integrations/spotify`
- `apps/marketing/src/app/templates/page.tsx` → hub at `lin.ky/templates`
- `apps/marketing/src/app/templates/[template]/page.tsx` → `lin.ky/templates/midnight`

**Frontend rewrites** (`apps/frontend/next.config.ts`, mirroring the existing `/i/:path*` proxy) — add:
```ts
{ source: '/integrations/:path*', destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/integrations/:path*` },
{ source: '/templates/:path*',    destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/templates/:path*` },
{ source: '/integrations',        destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/integrations` },
{ source: '/templates',           destination: `${process.env.NEXT_PUBLIC_MARKETING_URL}/i/templates` },
```
**Frontend middleware** (`apps/frontend/middleware.ts`) — add `integrations` and `templates` to the matcher's negative-lookahead so these paths are NOT rewritten to the user-slug lookup (same mechanism as `e`, `i`, `new`):
```
'/((?!api/|_next/|i/|_static/|_vercel|e(?=/|$)|edit|invite|new|new-api|assets|integrations|templates|[\\w-]+\\.\\w+).*)'
```
Canonical URLs for these pages are the clean root form (`https://lin.ky/integrations/spotify`), set via the page's metadata.

### The reusable engine

**`<PseoPage>` template** (`apps/marketing/src/components/pseo/pseo-page.tsx`): a server component that lays out the shared structure and is wrapped by the existing marketing nav/footer (already applied by the marketing root layout — these routes inherit it). Sections, in order:
1. **Hero** — answer-first `<h1>` (mirrors the target query) + a 1–2 sentence direct answer + primary CTA ("Create your Linky").
2. **Body sections** — archetype-specific (`children` slot): typically 3–4 blocks (what it does, how it works, a real-data showcase, benefits).
3. **FAQ** — `<PseoFaq>` rendering tailored Q&A + emitting FAQPage JSON-LD.
4. **CTA band** — reuse the existing `CallToActionBlock`.
5. **Schema** — BreadcrumbList (Home → hub → page) + FAQPage, via `@trylinky/seo`, injected as `<script type="application/ld+json">` using `serializeJsonLd`.

**Metadata helper** — extend Spec 1's `apps/marketing/src/lib/seo-metadata.ts` with a `buildPseoMetadata({ title, description, path })` (answer-first; canonical = clean root URL, not `/i/...`).

**Schema additions to `@trylinky/seo`:** add `buildFaqSchema(qa: Array<{question, answer}>)` and refactor the existing inline FAQ JSON-LD (`apps/marketing/src/components/landing-page/Faq.tsx`) to use it — single source of truth. (`buildBreadcrumbSchema` already exists from Spec 1.)

**Content layer:** typed TS modules, one record per page, in `apps/marketing/src/content/`:
- `integrations.ts` — `Record<IntegrationSlug, IntegrationContent>` where `IntegrationContent = { slug, name, h1, answer, intro, sections, faq, targetKeyword }`.
- `templates.ts` — `Record<TemplateSlug, TemplateContent>` where `TemplateContent = { slug, name, h1, answer, intro, palette, font, faq, targetKeyword }`. `palette` is the real theme color set.
Each module exports a typed array + a `getBySlug`/`getAll` accessor used by `generateStaticParams` and the pages.

**Rendering:** every PSEO route exports `generateStaticParams` over its content set → fully prerendered (SSG). No dynamic data fetching at request time (content is in-repo). `dynamicParams = false` (unknown slugs → 404).

**Sitemap:** populate the `pseoSitemap` slot in `apps/marketing/src/app/sitemap.ts` from the content modules (hub URLs + every integration + every template), at the clean root URLs. Only pages that pass the quality gate (below) are included.

**Internal linking:** the two hub pages link to every child; the marketing footer (`apps/marketing/src/components/marketing-footer.tsx`) gains a "Resources" column linking `/integrations` and `/templates`; each child links back to its hub (breadcrumb) and to a couple of sibling/related pages.

### Quality gate (anti-thin-content)

A small `isPublishable(content)` check (in the content module) requires: a non-empty `h1` + `answer`, ≥4 body sections worth of real content, ≥3 FAQ entries, and archetype-specific real data present (≥1 real block for an integration; a full palette for a template). Pages failing the gate are excluded from `generateStaticParams` AND the sitemap (so we never ship a thin page). Launch is staged: ship the engine + hubs + a first batch, watch GSC coverage/impressions (Spec 1 baseline), then expand.

---

## Archetype 1 — Integration pages

**Route:** `apps/marketing/src/app/integrations/[integration]/page.tsx`. **Hub:** `apps/marketing/src/app/integrations/page.tsx`.

**Content set (5):** `spotify`, `instagram`, `tiktok`, `threads`, `github`. Each `IntegrationContent` record carries answer-first copy + setup steps + 3+ FAQ. **Real data** comes from the block registry (`@trylinky/blocks` `config.ts` / `types.ts`): the page lists the actual blocks that integration powers (e.g. Spotify → "Now Playing", "Spotify embed") pulled from the registry's `integrationType` mapping, and renders a **live in-page mock** of the headline block (static, themed) so the page shows the real feature, not just prose.

**Page shape (via `<PseoPage>`):**
- H1: e.g. "Add Spotify to your link in bio" / answer: one sentence on what it does.
- Section: "What you can show" — the real blocks for this integration (from the registry) with a live mock.
- Section: "How to add it" — 3-step setup.
- Section: "Why it works" — benefits.
- FAQ (tailored) + CTA.

**Hub** lists all 5 with icon + one-liner, links to each.

---

## Archetype 2 — Template-gallery pages

**Route:** `apps/marketing/src/app/templates/[template]/page.tsx`. **Hub:** `apps/marketing/src/app/templates/page.tsx`.

**Content set (6):** the curated default themes — `Default`, `Purple`, `Black`, `Forest`, `Lilac`, `Orange Punch` — each with an editorial slug + answer-first copy + FAQ. **Real data** = the theme's actual HSL color palette + font.

**Theme palette sharing:** the palette source of truth is `apps/frontend/lib/theme` (`defaultThemeSeeds`). To consume it from the marketing app without a fragile cross-app import, **relocate `defaultThemeSeeds` (and its color types) into `@trylinky/common`** and re-export from the existing `apps/frontend/lib/theme` path for back-compat (so the frontend render path and `packages/prisma/seed.ts` are untouched in behavior). The marketing content module imports the palette from `@trylinky/common`.

**Live CSS mock** (`apps/marketing/src/components/pseo/theme-mock.tsx`): a server component that renders a realistic link-in-bio preview card (avatar circle, title, subtitle, 3–4 link rows, a header) using the theme's HSL colors as inline CSS custom properties and the theme font. No screenshot, no image — real HTML/CSS, which is both fast and SEO-valuable. Used full-size on the template page and as a thumbnail in the hub grid.

**Page shape (via `<PseoPage>`):**
- H1: e.g. "Midnight — a dark link in bio template" / answer: one sentence.
- Hero shows the live mock.
- Section: "What's included" (palette swatches + font).
- Section: "Make it yours" — customization angle.
- FAQ + CTA ("Use this template" → app with the theme preselected if feasible; otherwise generic signup).

**Hub** = responsive gallery grid of live theme-mock thumbnails linking to each template page.

---

## File structure

**Create:**
- `apps/marketing/src/components/pseo/pseo-page.tsx` — shared template
- `apps/marketing/src/components/pseo/pseo-faq.tsx` — FAQ + FAQPage schema (wraps `buildFaqSchema`)
- `apps/marketing/src/components/pseo/theme-mock.tsx` — live theme preview card
- `apps/marketing/src/components/pseo/integration-blocks.tsx` — real-block showcase (reads block registry)
- `apps/marketing/src/content/integrations.ts`, `templates.ts` — typed content + accessors
- `apps/marketing/src/app/integrations/page.tsx`, `integrations/[integration]/page.tsx`
- `apps/marketing/src/app/templates/page.tsx`, `templates/[template]/page.tsx`

**Modify:**
- `packages/seo/src/json-ld.ts` (+ test) — add `buildFaqSchema`
- `apps/marketing/src/components/landing-page/Faq.tsx` — use `buildFaqSchema`
- `apps/marketing/src/lib/seo-metadata.ts` — add `buildPseoMetadata`
- `apps/marketing/src/app/sitemap.ts` — populate `pseoSitemap`
- `apps/marketing/src/components/marketing-footer.tsx` — Resources links
- `apps/frontend/next.config.ts` — rewrites for `/integrations`, `/templates`
- `apps/frontend/middleware.ts` — matcher exclusions
- `packages/common/...` — house `defaultThemeSeeds`; `apps/frontend/lib/theme` re-exports

---

## Non-goals

- No editorial archetypes (use-case/industry, competitor-alternatives) — Spec 3.
- No new public themes/integrations API (everything is in-repo data — simpler, fully static).
- No CMS — typed TS modules; revisit if a non-engineer needs to author.
- No per-theme deep-link "apply this theme in the app" wiring unless trivial (otherwise CTA → generic signup).

## Rollout & verification

1. Ship engine + schema + both hubs + first content batch behind no flag (additive routes).
2. Validate each page type in Rich Results Test (FAQPage + BreadcrumbList).
3. Confirm clean URLs resolve (`lin.ky/integrations/spotify`, `lin.ky/templates/<slug>`) and `/i/...` canonical points to the clean URL; confirm no collision with user slugs (middleware exclusion).
4. Confirm pages are statically generated (`generateStaticParams`) and in the sitemap.
5. `pnpm typecheck` + `pnpm lint` + `@trylinky/seo` tests green.
6. Record the launch in GSC; watch coverage/impressions against the Spec 1 baseline before scaling content.

## Open questions / deferrals

1. **"Use this template" deep-link** — whether the app supports preselecting a theme via URL param; if not trivial, CTA goes to generic signup (deferred).
2. **Exact editorial copy** — written during implementation with the answer-first/quality-gate rules as constraints; AI-assisted drafting reviewed in code review.
3. **Expansion beyond launch set** — more integrations/themes and the editorial archetypes are Spec 3 and beyond.

## Forward look

**Spec 3** reuses `<PseoPage>`, `buildFaqSchema`/`buildPseoMetadata`, the sitemap/linking patterns, and the quality gate to add **use-case/industry** (`/for/<niche>`) and **competitor-alternative** (`/alternatives/<competitor>`) pages — authored as **MDX** (prose-heavy) with the strictest quality gate and staged, GSC-monitored rollout.
