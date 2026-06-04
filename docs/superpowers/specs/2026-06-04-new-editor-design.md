# Spec 2 — New Editor: `/e/` routes, Catalyst stacked-layout shell, per-tab pages, cacheable public page

**Date:** 2026-06-04
**Status:** Approved for planning
**Depends on:** Spec 1 (Tailwind v4 migration — merged). This spec adds Catalyst and the new
editor; it is the heart of the dashboard overhaul.
**Followed by:** Spec 3 (deep Catalyst refresh of shared dialogs, global Formik forms, and
block-editing chrome).

## Goal

Move the page editor from in-place editing at `lin.ky/<slug>` to a dedicated, logged-in
editor at `lin.ky/e/<slug>` with a Catalyst **StackedLayout** top-nav shell and a real
route per tab (settings, analytics, integrations, forms, themes). Make the public page at
`lin.ky/<slug>` public-only and cacheable. Begin adopting the Catalyst UI kit (vendored
into `@trylinky/ui`), replacing shadcn in the surfaces this spec touches.

## The carried-over invariant (sacred)

> **The logged-out public page at `lin.ky/<slug>` must remain visually identical —
> pixel-for-pixel — for logged-out visitors.**

Consequences:
- "Begin replacing shadcn" applies **only to components not on the public render path**.
  Any `@trylinky/ui` component used by the public page (block UIs, theme rendering,
  `ShareButton`, page footer, etc.) is left untouched, or swapped only with verified
  pixel-parity. An explicit audit of the public render path's component usage is the first
  implementation task; those components are quarantined from replacement in this spec.
- The public route is being refactored (session/edit-mode removed) and cached — both are
  verified against a logged-out browser-diff of `/<slug>` (same method as Spec 1).

## Decisions locked in brainstorming

1. **Catalyst location:** vendored into `packages/ui/src/catalyst/*` with a Next.js `Link`
   adapter, exported from `@trylinky/ui`. Begin replacing shadcn in Spec-2 surfaces (shell +
   tab pages); shadcn remains where untouched.
2. **Caching:** hybrid — `use cache` + short `cacheLife` (~60s) on the public page, plus
   in-process `revalidateTag` from the frontend publish/theme/settings **server actions** so
   publishing is instant. (See note below: publish is a frontend server action, so NO
   cross-service webhook/secret is needed — strictly simpler than first assumed.)
3. **Scope:** Spec 2 = shell + the 6 tab routes + porting each tab's content restyled in
   Catalyst + caching + auth/redirects. Spec 3 = shared dialogs, global Formik forms, and
   block-editing chrome.
4. **Auth:** `/e/*` is logged-in + root-domain only. Logged-out → redirect to login then
   back to `/e/<slug>`. Logged-in non-owner → redirect to public `/<slug>`. `/e` (no slug)
   → redirect to first page (replaces `app/edit/route.ts`). Custom domains stay public-only,
   unchanged.

## Current architecture (what we're changing)

- `app/[domain]/[slug]/page.tsx` + `layout.tsx` render BOTH the public page and the editor,
  flipping to edit mode when the logged-in user owns the page (`isEditMode`). Both are
  `force-dynamic` / `revalidate = 0`.
- The editor chrome is `GlobalNavigation` (top bar) + `EditLayout`/`EditSidebar` (icon rail
  + collapsible panel) with tabs as client state (`sidebarView`): `SidebarBlocks`,
  `SidebarThemes`, `SidebarPageSettings`, `SidebarIntegrations`, `SidebarAnalytics`,
  `SidebarForms`, `SidebarBlockForm`. The canvas is `Grid` → `EditWrapper` (react-grid-layout
  drag/drop) driven by `EditModeContextProvider`.
- Reads are direct-Prisma server functions in `app/lib/actions/page-actions.ts`
  (`getPageIdBySlugOrDomain`, `getPageLoadData`, `getPageLayout`, `getPageBlocks`,
  `getPageTheme`, `getPageSettings`). No caching wrappers exist today.
- Writes (block add/update, layout save, publish, theme, settings) go through a **separate
  API service** `apps/api` (`NEXT_PUBLIC_API_URL`, port 3001) via `InternalApi`/SWR. The
  frontend does not currently revalidate anything.
- `middleware.ts` rewrites root-domain paths to `/<host>/<path>` (→ `[domain]/[slug]`),
  excluding `api/_next/i/_static/_vercel/edit/invite/new/new-api/assets` and dotted files.
- `app/edit/route.ts` redirects a logged-in user to their first page's slug.

## Section A — Routing & the public/editor split

New route tree `app/e/[slug]/`:
- `layout.tsx` — the Catalyst `StackedLayout` shell. Server component that: runs the auth
  gate (see Section F), loads the page + ownership + the SWR fallback data the editor needs
  (mirroring today's `app/[domain]/[slug]/layout.tsx` owner branch), and renders the navbar
  (Section C) wrapping the tab pages. Provides `EditModeContextProvider` and `LinkyProviders`.
- `page.tsx` — the **blocks canvas**: reuses the existing `Grid` → `EditWrapper` →
  `EditModeContext` drag/drop and block rendering in edit mode. No functional change to the
  canvas itself.
- `settings/page.tsx`, `analytics/page.tsx`, `integrations/page.tsx`, `forms/page.tsx`,
  `themes/page.tsx` — one page each (Section D).
- `app/e/page.tsx` (or a route handler) → redirect to the user's first page slug (logic
  ported from `app/edit/route.ts`, incl. the `/new?freshOnboarding=true` empty-state). Keep
  `app/edit/route.ts` as a 308 redirect to `/e` (+ preserve its query params) for
  back-compat with existing links/bookmarks.

`app/[domain]/[slug]/` becomes **public-only**:
- Remove the `isEditMode` path, the session fetch, the owner-only batch fetches, the
  onboarding dialogs, the `ShareButton` edit affordances tied to ownership, and the
  unpublished-preview-for-owner branch. Render only `publishedAt != null` pages, read-only.
- `Grid` renders with `editMode={false}` (static, no drag layer, no `EditModeContext`). The
  `isLoggedIn` GlobalNavigation branch is removed from the public render.
- Net effect: the public route no longer reads the session → it can be statically cached.

`middleware.ts`:
- Add `e` to the negative-lookahead exclusion so `/e/*` is NOT rewritten and routes to
  `app/e/*` (same treatment as `edit`/`invite`/`new`). Everything else unchanged.

## Section B — Caching & revalidation

**Discovered during planning:** publish is a **frontend Next.js server action**
(`app/components/EditPageSettingsDialog/actions.ts` → `updateGeneralPageSettings`, which
writes `publishedAt` via Prisma directly), as are theme changes (`app/lib/actions/themes.ts`
`setPageTheme`) and page-settings/slug changes. So revalidation happens **in-process** — no
cross-service webhook, no shared secret, no `apps/api` changes. (Block add/update and layout
saves DO route through `apps/api`; those are covered by the `cacheLife` window, not instant.)

- Wrap the public page's read path in `use cache` with `cacheTag('page-slug-<slug>-<domain>')`
  and `cacheTag('page-id-<id>')`, and set a short `cacheLife` (~60s) for incidental freshness.
  Remove `force-dynamic` and `revalidate = 0` from the public route. Tag at the **data-function
  level** in `page-actions.ts`.
  - Constraint: `use cache` functions cannot read request data (`headers()`/`cookies()`). The
    current `apiServerFetch` forwards cookies, so the cached public reads must use a
    **cookie-free** read variant (the public page is session-free, so published-page data needs
    no auth). This cookie-free read path is an explicit task.
- In the frontend **publish/unpublish** server action (and `setPageTheme`, and slug/settings
  changes), call `revalidateTag('page-slug-<slug>-<domain>')` / `revalidateTag('page-id-<id>')`
  after the successful Prisma write so the public page reflects the change immediately. The
  ~60s `cacheLife` window covers block/layout edits that go through `apps/api`.
- No new shared secret or `apps/api` route is required for this spec.
- Owners visiting their own `/<slug>` while logged in see the **public** (cached) view; they
  edit at `/e/<slug>`. The public page stays session-free to remain cacheable (no per-request
  "edit" affordance in this spec).

## Section C — The Catalyst shell & navigation

- Vendor Catalyst components into `packages/ui/src/catalyst/*`. Adapt `link.tsx` to wrap
  Next.js `Link`. Export the set from `@trylinky/ui` (e.g. a `catalyst` subpath or namespaced
  exports) so apps import from the workspace package. Catalyst's default (zinc/neutral)
  aesthetic is the dashboard chrome's look.
- The `StackedLayout` navbar carries over today's `GlobalNavigation` elements: the logo,
  `TeamSwitcher` (when >1 org), `PageSwitcher`, `UserWidget`, and the `ScreenSizeSwitcher`
  (desktop/mobile preview toggle) shown **only on the blocks tab**. A `NavbarSection` holds
  the tab links — Blocks (`/e/<slug>`), Themes, Settings, Integrations, Analytics, Forms —
  each linking to its route with the Catalyst active-tab indicator driven by the current
  pathname.
- `EditSidebar`, `EditLayout`, and the icon-rail/collapsible-panel pattern are retired.
  `GlobalNavigation` is replaced by the navbar built from Catalyst `Navbar*` primitives.

## Section D — Tab content → pages (Catalyst)

Each `Sidebar*` panel's content becomes the body of its route page, restyled with Catalyst
and laid out full-width (not in an ~18rem rail):
- `SidebarPageSettings` → `settings/page.tsx`
- `SidebarThemes` → `themes/page.tsx`
- `SidebarIntegrations` → `integrations/page.tsx`
- `SidebarAnalytics` → `analytics/page.tsx`
- `SidebarForms` → `forms/page.tsx`
- `SidebarBlocks` (block palette) + `SidebarBlockForm` (per-block edit) → integrated into the
  blocks canvas page (`/e/<slug>`): the palette for adding blocks and the per-block edit
  surface. Drag-to-add and the `EditModeContext` drop flow are preserved.

Where these panels use shadcn primitives (`Button`, `Input`, `Select`, `Switch`, `Dialog`,
`Tabs`, etc.), replace them with Catalyst equivalents — **editor surfaces only**. Components
on the public render path (per the Section "invariant" audit) are not replaced here. The
data flow (SWR keys, `InternalApi` calls, server actions) is preserved; only presentation
changes.

## Section E — What stays in Spec 3 (explicitly out of scope here)

Shared dialogs (`ShareDialog`, `ManageBillingDialog`, onboarding dialogs, `EditPageSettings*`
and `EditTeamSettings*` dialog shells), global Formik form primitives (`FormField`,
`FormInput`, `FormFileUpload`), and the block-editing chrome on the canvas itself
(`CoreBlock`, `EditBlockToolbar`, `DraggableBlockButton` visuals). They keep working in Spec
2; their Catalyst restyle is Spec 3.

## Section F — Auth & redirects (`/e/`)

In `app/e/[slug]/layout.tsx` (server):
- No session → `redirect` to the login flow with a return-to of `/e/<slug>` (use the app's
  existing login entry; preserve return URL).
- Session but the page's `organizationId` !== the active org (not owner) → `redirect` to the
  public `/<slug>`.
- Page does not exist → `notFound()`.
- `app/e/page.tsx` (no slug) → first page slug, or `/new?freshOnboarding=true` if none
  (ported from `app/edit/route.ts`).
- `/edit` → 308 redirect to `/e` (preserving `showTeamOnboarding`/`showPremiumOnboarding`
  query params).
- Custom domains: `/e` is root-domain only; custom-domain requests render the public page
  only, unchanged.

## Section G — Verification

- **Public parity:** re-run the Spec-1 browser-diff on logged-out `/<slug>` (the three
  reference pages: plain, Lilac, Orange Punch — desktop + mobile). Must stay pixel-identical
  despite the route refactor, session removal, and caching.
- **Caching:** confirm `/<slug>` serves from cache (response headers / repeated-load timing),
  and that a publish (frontend server action) `revalidateTag`s so the public page reflects the
  change immediately (not after the `cacheLife` window). Confirm the cached public reads never
  read cookies/session (so no per-user data is cached).
- **Editor QA:** every tab route loads and deep-links; the blocks canvas drag/drop, add, and
  layout-save still function; tab nav active-state is correct; auth redirects behave
  (logged-out→login→back, non-owner→public, `/e`→first page, `/edit`→`/e`).
- `pnpm typecheck` + `pnpm lint` green; `apps/frontend` builds.

## Risks

- **Public parity regressions** from the route refactor or a shadcn→Catalyst swap leaking
  onto the public path. Mitigated by the public-render component audit + browser-diff gate.
- **Revalidation gaps**: block/layout edits route through `apps/api` and are not revalidated
  in-process, so they go live only after the `cacheLife` window (accepted). Publish/theme/
  settings (frontend server actions) revalidate immediately. The `cacheLife` window is the
  backstop for everything else.
- **`use cache` + request data**: a cached read that touches `headers()`/`cookies()` will
  fail or leak per-user data. Mitigated by the cookie-free public read path (session-free
  public route).
- **Catalyst ↔ existing tokens**: Catalyst assumes certain theme tokens/aesthetics; the
  dashboard chrome adopts Catalyst's look, but shared tokens (`sys-*`, shadcn vars) must not
  shift the public page. Covered by the invariant + diff.
- **`use cache` / Cache Components** behavior on Next 16 with dynamic data — validate the
  caching seam doesn't accidentally cache per-user data (public route is session-free, which
  protects this).

## Out of scope

Spec 3 surfaces (above); any change to block rendering output; custom-domain behavior
changes; pushing/deploying.
