# Spec 1 — Tailwind v4 Migration

**Date:** 2026-06-04
**Status:** Approved for planning
**Part of:** Dashboard UI overhaul (Catalyst). This is the foundation spec; it unblocks
Spec 2 (new editor shell + routes) and Spec 3 (deep Catalyst refresh). It ships **no
features** — only the Tailwind upgrade.

## Goal

Upgrade the monorepo from Tailwind CSS v3.4 to v4 so the Catalyst UI kit (which is
authored for v4) can be adopted in later specs. This spec adds **no** Catalyst code and
makes **no** intentional visual change.

## The governing invariant

> **The rendered output must look identical before and after this migration — most
> critically the public page at `lin.ky/jack` for logged-out visitors.**

"Looks identical" is the success criterion, verified by before/after screenshot diffs
(see Verification). Any surviving visual delta must be individually explained and
explicitly accepted, not silently shipped.

## Current state (what must be preserved)

- **Configs (Tailwind v3.4):**
  - `packages/ui/tailwind.config.ts` — the real config: `darkMode: ['class']`, color
    tokens, `borderRadius`, keyframes/animations, and plugins.
  - `apps/frontend/tailwind.config.ts` and `apps/marketing/tailwind.config.ts` both
    `...uiConfig` and override `content` (frontend also globs
    `../../packages/ui/src/**` and `../../packages/common/src/**`).
- **PostCSS (v3 style):** `tailwindcss` + `autoprefixer` in both apps
  (`apps/frontend/postcss.config.js`, `apps/marketing/postcss.config.js`).
- **Plugins:** `tailwindcss-animate`, `@tailwindcss/forms`, `@tailwindcss/typography`,
  `@tailwindcss/container-queries`.
- **Tokens:**
  - shadcn-style `hsl(var(--…) / <alpha-value>)` colors (border, input, ring,
    background, primary, sidebar, etc.).
  - A `sys-*` theme system: `sys.bg.*`, `sys.label.*`, `sys.title.*`, all
    `hsl(var(--color-sys-…) / <alpha-value>)`. A few of these vars are defined in
    `globals.css`; the rest are injected **at runtime** by `RenderPageTheme` per page
    theme. The migration must keep `<alpha-value>` color resolution working so runtime
    theme injection is unaffected.
- **CSS entrypoints:**
  - `apps/frontend/app/globals.css` — `@tailwind base/components/utilities`,
    `:root`/`.dark` token blocks, `@layer base { * { @apply border-border } }`,
    `body { @apply bg-background text-foreground }`, and a `@layer utilities` font
    `font-variation-settings` hack + `.no-scrollbar`.
  - `apps/marketing/src/app/globals.css` — analogous entrypoint.
  - Imported via `import './globals.css'` in each app's `app/layout.tsx`.
- **Sass (independent of Tailwind, low risk):** `apps/frontend/app/react-grid-layout.scss`
  (imported in `layout.tsx`) and marketing `*.module.scss`. Compiled by Next, not by
  Tailwind. Left untouched; verified visually only.

## Approach — A: keep the JS config via `@config` (chosen)

Migrate to v4 while keeping the existing JavaScript config files, wired in through the
v4 `@config` directive. This preserves the color tokens, `<alpha-value>` resolution,
plugins, and `darkMode: ['class']` with the smallest possible diff. A full CSS-first
`@theme` rewrite (rejected approach B) is deferred — it can happen incrementally later
and should not land during the parity-critical step.

### Per-package changes

**`packages/ui` (`@trylinky/ui`)**
- Bump `tailwindcss` to `^4`.
- Keep `tailwind.config.ts` as-is (consumed by both apps via `@config`). No token or
  plugin changes.
- Keep the four Tailwind plugins; they continue to load through the JS config's
  `plugins` array. (If any plugin is incompatible with v4, fall back to the v4 `@plugin`
  directive or the documented v4-native replacement, e.g. `tw-animate-css` for
  `tailwindcss-animate` — only if required, and re-verified for parity.)

**`apps/frontend`**
- `package.json`: `tailwindcss` → `^4`; add `@tailwindcss/postcss`; remove
  `autoprefixer` (v4 handles vendor prefixing). Keep `postcss`.
- `postcss.config.js`: replace `{ tailwindcss: {}, autoprefixer: {} }` with
  `{ '@tailwindcss/postcss': {} }`.
- `app/globals.css`:
  - Replace `@tailwind base; @tailwind components; @tailwind utilities;` with
    `@import "tailwindcss";`.
  - Add `@config "../tailwind.config.ts";` (path relative to `app/globals.css`).
  - Keep the `:root`/`.dark` token blocks and the `@layer` blocks (valid in v4).
  - Add the **compatibility base layer** (see below).
- `tailwind.config.ts`: unchanged in shape; **keep the `content` globs** — including the
  cross-package `../../packages/ui/src/**` and `../../packages/common/src/**` — so v4
  still scans workspace-package source for classes. (Equivalent `@source` directives in
  CSS are an acceptable alternative; whichever is used, the `@trylinky/ui` and
  `@trylinky/common` source MUST be scanned, or shared-component styling silently
  breaks.)

**`apps/marketing`**
- Same `package.json` / `postcss.config.js` changes as frontend.
- `src/app/globals.css`: `@import "tailwindcss";` + `@config "../../tailwind.config.ts";`
  (path relative to `src/app/globals.css`) + compatibility base layer.
- Keep `content` globs in its `tailwind.config.ts`.

### Codemod

Run `npx @tailwindcss/upgrade` once at the repo root (or per package as it requires) to
apply mechanical class renames across all `.tsx`/`.ts`/`.css`, then review the diff. It
handles, among others:
- `shadow-sm` → `shadow-xs`, `shadow` → `shadow-sm` (and the parallel `rounded-*`,
  `blur-*`, `drop-shadow-*` scale shifts).
- `outline-none` → `outline-hidden`.
- Deprecated opacity utilities (`bg-opacity-*`, `text-opacity-*`, …) → slash syntax.
- `flex-shrink-*`/`flex-grow-*` → `shrink-*`/`grow-*`.

The codemod output is reviewed, not trusted blindly; its renames are the *only* markup
changes permitted in this spec.

### Compatibility base layer (parity-critical)

Tailwind v4 changes several defaults that **will** alter the frozen public view unless
neutralized. Add a small base layer to each app's `globals.css` pinning the v3
behavior, and confirm via diffs. Items to address:

- **Default border & divide color:** v3 = `gray-200`; v4 = `currentColor`. Pin
  `*, ::after, ::before { border-color: <v3 gray-200> }` (or the project's existing
  `--border`-driven rule already present as `* { @apply border-border }`, which largely
  covers this — verify it still wins).
- **Default ring:** v3 ring width 3px / `blue-500`-ish; v4 ring width 1px /
  `currentColor`. Pin ring width + color to the v3 values where rings are used.
- **Placeholder color:** v3 = `gray-400`; v4 = `currentColor` at 50%. Pin to v3.
- **Button cursor:** v4 preflight sets interactive elements to `cursor: default`; v3 was
  `pointer`. Restore `button:not(:disabled), [role="button"]:not(:disabled) { cursor: pointer }`
  if any buttons relied on the default.
- **`hover:` on touch devices:** v4 gates `hover:` behind `@media (hover: hover)`. Note
  and check the editor's touch flows; restore explicitly only if a real regression
  appears (do not blanket-revert).
- **`space-x/space-y` selector change:** verify list/stack spacing in the editor and
  public page; address only if a diff appears.

This list is the migration checklist, not a guess — each item is confirmed resolved
against the screenshot diffs before the spec is considered done.

## Verification (the deliverable)

Using the `browse` daemon, capture baselines on `main` **before** any change, then
re-capture after, and diff:

1. **Public `/jack`, logged out** (the frozen view): desktop + mobile, for several
   representative published pages — at minimum one plain page, one with a background
   image, and one with a custom theme (exercises runtime `sys-*` injection).
2. **Editor `/jack`, logged in** (requires an authenticated browser session / imported
   cookies): the canvas plus each sidebar tab (Blocks, Themes, Settings, Integrations,
   Analytics, Forms).
3. **Marketing homepage**: desktop + mobile.

The migration is "done" only when every diff is clean or every remaining delta is
explained and explicitly accepted. Also run `pnpm typecheck` and `pnpm lint` (the build
must still pass).

## Out of scope (deferred to later specs)

- Any Catalyst component, the `/e/` routes, the stacked-layout shell, caching of `/jack`,
  and any deliberate restyle. Those are Specs 2 and 3.
- CSS-first `@theme` token rewrite (approach B).
- Touching the Sass files beyond confirming they still render.

## Risks

- **Missing content scanning** of workspace packages → silently dropped classes. Mitigated
  by keeping explicit `content` globs / `@source`.
- **Plugin incompatibility** with v4 (esp. `tailwindcss-animate`). Mitigated by JS-config
  loading first, v4-native fallback only if needed.
- **Runtime `sys-*` theme injection** relying on `<alpha-value>` resolution. Mitigated by
  keeping the JS color config via `@config`; explicitly exercised by the themed-page
  screenshot case.
- **Next.js 16 + Turbopack + v4 PostCSS** interaction. Mitigated by using the official
  `@tailwindcss/postcss` plugin and verifying `next dev` and `next build`.

## Order of operations

1. Capture screenshot baselines on `main`.
2. Branch. Bump deps; switch PostCSS; rewrite CSS entrypoints (`@import` + `@config`).
3. Run the upgrade codemod; review the diff.
4. Add the compatibility base layer.
5. `pnpm typecheck`, `pnpm lint`, `next build` for both apps.
6. Re-capture screenshots; diff; resolve deltas against the compatibility checklist.
7. Land only when diffs are clean or accepted.
