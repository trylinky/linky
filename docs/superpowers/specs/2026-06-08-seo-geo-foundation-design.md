# SEO / GEO / PSEO Initiative — Spec 1: Technical & GEO Foundation

> **Date:** 2026-06-08
> **Status:** Design — awaiting review
> **Author:** Alex Pate (with Claude)
> **This doc** covers the full initiative roadmap (overview) and then details **Spec 1** in full. Specs 2 and 3 get their own design docs.

---

## Initiative overview (the "full-court press")

We're making a deliberate push on three fronts at once: classic **SEO**, **programmatic SEO (PSEO)** for long-tail keywords, and **AI-search optimization (GEO** — Generative Engine Optimization). The bet: build a programmatic long-tail landing-page engine on top of a solid technical/GEO foundation, and measure as we go.

### What the June 2026 landscape tells us (research summary)

- **AI search is the main event.** ~50% of US Google queries now trigger AI Overviews (up ~58% YoY); Gartner projects a 25% decline in organic clicks to commercial sites by end of 2026. AI engines *cite* sources rather than rank them. Winning citations rewards: **answer-first structure** (H1 / first ~200 words directly answer the query), **JSON-LD schema** (FAQPage pages ~3.2× more likely to be cited), **freshness** (citations to pages >3 months old fall off), **E-E-A-T author signals**, and **server-rendered, crawler-accessible content**.
- **Programmatic SEO still works — but the bar moved hard.** Google's March 2026 "scaled content abuse" core update cut 60–90% of traffic from sites mass-producing near-identical keyword-swap pages. Survivors carry **unique, structured data and real user value on every page** (Zillow listings, Zapier integration pages). Practical threshold: ~30% genuinely unique content per page, real data, real UX.
- **Winning PSEO archetypes for SaaS** (build order): integration pages (fastest — product data already exists), comparison/alternative pages (highest conversion), use-case/industry pages (highest value/page), template galleries.
- **llms.txt is a weak lever** (~10% adoption; AI crawlers almost never fetch it; Google rejects it) but worth shipping cheaply — it helps in-product AI assistants / MCP / IDE agents, not search citations.

### Locked decisions

| Decision | Choice |
|---|---|
| Overall structure | **3 sequenced specs** (foundation → data-driven archetypes → editorial archetypes) |
| PSEO archetypes (all four) | use-case/industry, competitor alternatives, integration pages, template gallery |
| Content differentiation | **Editorial + light data** — AI/eng-authored copy **plus** injected real data + a per-page quality gate + staged rollout (mitigates scaled-content risk) |
| Hosting / URLs | **Marketing app**, served at clean root URLs via frontend rewrites (`lin.ky/alternatives/linktree`, not `/i/...`) |
| Content data layer | **In-repo MDX / typed collections** (quality gate = code review) |
| User pages in sitemap | **No** — never enumerate user pages in the sitemap |
| User-page index policy | **Quality-gated indexing** — `noindex` thin/free pages, `index` pages clearing a quality bar |

### The 3-spec roadmap

1. **Spec 1 — Technical & GEO foundation** (this doc): structured data, quality-gated indexing, sitemap/robots/llms.txt, answer-first metadata + canonical fixes, measurement. Everything downstream rides on this.
2. **Spec 2 — PSEO engine + data-driven archetypes**: the reusable template/renderer/quality-gate system, URL namespace + rewrites, and the two archetypes powered by data we already have — **integration pages** and **template-gallery pages**.
3. **Spec 3 — Editorial archetypes**: **use-case/industry** and **competitor-alternative** pages on the Spec-2 engine, with the strictest quality gate and staged, GSC-monitored rollout.

---

## Spec 1 — Technical & GEO Foundation

### Goals

Make every existing surface (marketing pages + public user pages) maximally indexable *and* citable by AI engines, protect the root domain's authority from thin user-page content, and stand up measurement — so Specs 2–3 launch onto solid ground and we can see their impact.

### Non-goals

- No programmatic landing pages yet (Specs 2–3).
- No redesign of marketing or public pages; this is metadata/schema/crawl/measurement only.
- No new editor UI (the index-policy gate is server-side; an opt-in *toggle* is explicitly deferred — see Open Questions).

---

### 1. Structured data (JSON-LD)

Add a small **typed schema-builder helper** (one module, pure functions returning JSON-LD objects) so schema is reusable and consistent rather than hand-rolled per page. Render via a single `<JsonLd>` component (`<script type="application/ld+json">`).

Apply:

- **`ProfilePage` + `Person`** on public user pages (`apps/frontend/app/[domain]/[slug]`). `Person` from the page's header block (name, bio/description, avatar image, and `sameAs` links derived from the page's social/link blocks — e.g. Instagram, TikTok, Spotify, GitHub URLs). This is the highest-value, most natural schema win we're currently leaving on the table. **Gated by the same indexing rule (§2)** — don't emit rich Person markup for pages we're `noindex`-ing.
- **`Organization` + `WebSite`** (with `potentialAction: SearchAction` if a public search/explore endpoint exists) on the marketing root layout.
- **`BreadcrumbList`** on marketing content pages (blog, learn) and — forward-looking — a reusable breadcrumb schema the Spec-2 PSEO templates can call.

Keep the existing `BlogPosting` and `FAQPage` schema; migrate them onto the new helper for consistency (no behavior change).

### 2. Quality-gated indexing for public user pages

**Rule (tunable):** a published page is `index, follow` if it meets **any** strong signal —

- on a **paid plan**, OR
- has a **custom domain**, OR
- `verifiedAt` is set, OR
- `isFeatured`,

**AND** clears a **minimal content floor**: a header block present + at least one real content/link block + a non-empty bio or `metaDescription`. Anything else → `noindex, follow` (still allow link-following, just don't index the thin page).

**Implementation:**

- In the public page `generateMetadata` (`apps/frontend/app/[domain]/[slug]/page.tsx`), compute the gate and set Next's `robots: { index, follow }` accordingly.
- The gate needs plan/verified/customDomain/featured + block summary on the **public** data path. Audit what `getPublicPageBySlugOrDomain` / `getPublicPageLoadData` already return; if plan or `verifiedAt`/`isFeatured` aren't exposed on the public API (`apps/api`), add them to the public page payload (these are non-sensitive). Keep this cookie-free so the cached public reads stay cacheable.
- Pure helper `shouldIndexPage(page): boolean` co-located with the schema helper, unit-tested with table-driven cases (free thin → false; paid → true; custom domain → true; verified-but-empty → false on content floor; etc.).
- The Person/ProfilePage schema (§1) reuses `shouldIndexPage` so markup and robots stay in lockstep.

### 3. Sitemap, robots.ts, llms.txt

- **Sitemap** (`apps/marketing/src/app/sitemap.ts`): keep marketing + blog + learn; add a placeholder/structure for the Spec-2 PSEO routes (wired for real in Spec 2). **Explicitly do not add user pages.** Add a short code comment recording that decision so a future contributor doesn't "helpfully" add them.
- **`robots.ts`** (dynamic, both apps — replaces the static `apps/frontend/app/robots.txt`): `Allow: /` for general crawl; **explicitly allow** the major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Google-Extended, CCBot) — we *want* AI citations; `Disallow` editor/app paths (`/e`, `/edit`, `/new`, `/new-api`, `/api`, `/invite`, `/_next`); point at the sitemap. Mirror appropriate rules in the marketing app.
- **`llms.txt`** (root, served via a route handler): a curated, concise index of the highest-value canonical pages (what Linky is, pricing, key learn/help articles, and — later — PSEO hub pages). Cheap hedge; low priority; explicitly not load-bearing.

### 4. Metadata & answer-first patterns + canonical fix

- **Shared metadata helper** for the marketing app that produces consistent `title` / `description` / `openGraph` / `twitter` / `alternates.canonical`, nudging **answer-first** copy (description leads with the direct answer, not a brand tagline). Apply to marketing pages that currently just inherit root (pricing, privacy, terms, explore).
- **Fix the missing canonical on blog posts** (`apps/marketing/.../blog/[blogPostSlug]`) — currently absent (duplicate-content risk). Set self-referential canonical via the helper.
- Establish the **answer-first H1 / first-paragraph** convention as a documented pattern (a short section in the helper's doc comment) that Specs 2–3 templates must follow.

### 5. Measurement

- **Google Search Console**: verify both the root domain and (if separate) marketing surface; submit the marketing sitemap. Verification via DNS or a metadata token in the root layout.
- Capture a **baseline** (current impressions/clicks/indexed-page count) before Spec 2 ships so PSEO impact is measurable.
- Lightweight only — no custom dashboards in Spec 1. Note: Ahrefs analytics is already loaded in production; GSC is the gap.

---

### Data / API changes (cross-cutting)

- Public page payload may need to expose `plan` (or a boolean `isPaid`), `verifiedAt`, `isFeatured`, and a minimal block summary for `shouldIndexPage`. Add to the **public** (cookie-free) API path so cached reads stay cacheable. Confirm none are sensitive (they aren't — plan tier and verification are already implied publicly).

### Rollout & verification

1. Ship schema + `shouldIndexPage` behind no flag (pure additive for indexable pages; `noindex` only newly applied to thin pages — intended).
2. Validate JSON-LD with Google's Rich Results Test on a sample of each page type.
3. Confirm `robots.ts` output (AI crawlers allowed, app paths blocked) and that `noindex` pages emit the correct meta robots.
4. Confirm cached public reads still cache (no new `headers()`/`cookies()` on the public path).
5. Verify GSC, submit sitemap, record baseline.
6. `pnpm typecheck` + `pnpm lint` + unit tests for `shouldIndexPage` and schema builders green.

### Risks & mitigations

- **Over-`noindex`ing** real pages → start the gate generous (any paid/custom-domain/verified/featured passes), monitor GSC coverage for unexpected exclusions, tune.
- **Cache-safety regressions** from new data on the public path → keep all new reads cookie-free; reuse the existing `getPublic*` cached pattern.
- **Schema drift** between markup and robots → single `shouldIndexPage` source of truth, reused by both.

---

## Open questions (resolve during Spec 1 or defer)

1. **Opt-in indexing toggle** — quality-gated indexing is automatic for now. A user-facing "allow search engines to index my page" setting (possibly paid) is a natural follow-up but is **deferred** (needs settings UI + per-page flag). Revisit after we see GSC coverage data.
2. **Exact content-floor thresholds** — finalize block-count/field rules during implementation with a few real pages in front of us.
3. **SearchAction** — only include `WebSite.potentialAction` if a real public search endpoint exists; otherwise omit.

---

## Forward look (not in this spec)

- **Spec 2** builds the PSEO engine (MDX/typed content layer, shared template renderer, clean-URL rewrites + middleware reservation, real-data injection via `apps/api`, per-page FAQ/Breadcrumb schema, quality gate) and ships **integration** + **template-gallery** pages. The trickiest bit flagged early: **live theme previews** in the marketing app — rendering components live in the frontend app, so this likely becomes pre-rendered preview images rather than live iframes.
- **Spec 3** adds **use-case/industry** + **competitor-alternative** pages with the strictest quality gate and staged, GSC-monitored rollout.
