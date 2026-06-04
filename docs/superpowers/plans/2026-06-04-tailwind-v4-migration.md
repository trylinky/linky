# Tailwind v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the monorepo from Tailwind CSS v3.4 to v4 with zero intended visual change, unblocking later Catalyst UI work.

**Architecture:** Adopt Tailwind v4 while keeping the existing JavaScript config files, wired in through the v4 `@config` directive (approach A from the spec). Swap PostCSS to `@tailwindcss/postcss`, rewrite the two CSS entrypoints, run the official upgrade codemod for mechanical class renames, then add a compatibility base layer that pins v4's changed defaults back to v3 values. Correctness is proven by before/after screenshot diffs — the public logged-out `/jack` view is the hard parity line.

**Tech Stack:** Tailwind CSS v4, `@tailwindcss/postcss`, PostCSS, Next.js 16 (Turbopack), pnpm workspaces (`@trylinky/ui`, `apps/frontend`, `apps/marketing`), the `browse` skill for screenshot verification.

**Spec:** `docs/superpowers/specs/2026-06-04-tailwind-v4-migration-design.md`

---

## File Structure

Files created or modified by this plan:

- `docs/superpowers/baselines/` — **Create.** Holds v3 (before) and v4 (after) screenshots for diffing. Throwaway/uncommitted is fine; see Task 1.
- `packages/ui/package.json` — **Modify.** Bump `tailwindcss` to v4.
- `apps/frontend/package.json` — **Modify.** Bump `tailwindcss`, add `@tailwindcss/postcss`, remove `autoprefixer`.
- `apps/marketing/package.json` — **Modify.** Same as frontend.
- `apps/frontend/postcss.config.js` — **Modify.** Use `@tailwindcss/postcss`.
- `apps/marketing/postcss.config.js` — **Modify.** Same.
- `apps/frontend/app/globals.css` — **Modify.** `@import "tailwindcss"` + `@config` + compatibility layer.
- `apps/marketing/src/app/globals.css` — **Modify.** Same.
- `packages/ui/tailwind.config.ts`, `apps/frontend/tailwind.config.ts`, `apps/marketing/tailwind.config.ts` — **Unchanged in shape** (kept and referenced via `@config`); only touched if the codemod proposes a change, reviewed manually.
- Any `.tsx`/`.ts`/`.css` with renamed utility classes — **Modify** via codemod (Task 5), reviewed.

Branch: `ui/tailwind-v4-migration` (already created; currently holds only the spec commit).

---

## Task 1: Capture v3 visual baselines

Baselines must be captured while the working tree is still Tailwind v3 (it is — no code changes yet). These are the "expected" images every later diff compares against.

**Files:**
- Create: `docs/superpowers/baselines/v3/` (screenshot output dir)

- [ ] **Step 1: Add the baseline dir to git ignore (keep screenshots out of commits)**

Append to `.gitignore`:

```
# Tailwind v4 migration visual baselines (local verification only)
docs/superpowers/baselines/
```

- [ ] **Step 2: Start the dev server**

Run: `pnpm dev`
Expected: frontend on its dev URL (e.g. `http://localhost:3000`) and marketing on its dev port. Confirm both compile with no errors. Leave running (use a background shell).

- [ ] **Step 3: Capture logged-out public page baselines**

Using the `browse` skill (no auth cookies), for each of these representative published pages, capture a full-page screenshot at desktop (1280px wide) and mobile (390px wide):
- one plain published page,
- one published page that uses a **background image**,
- one published page that uses a **custom theme** (exercises runtime `sys-*` injection).

Save as `docs/superpowers/baselines/v3/public-<name>-<desktop|mobile>.png`.
(If specific slugs aren't known, pick three live pages that match those traits and record which slug maps to which file in a short `docs/superpowers/baselines/v3/INDEX.md`.)

- [ ] **Step 4: Capture editor baselines (requires auth)**

If an authenticated browser session is available (use the `setup-browser-cookies` skill to import login cookies), capture the logged-in editor for one owned page:
- the canvas (default Blocks view), desktop + mobile,
- each sidebar tab opened: Themes, Settings, Integrations, Analytics, Forms (desktop).

Save as `docs/superpowers/baselines/v3/editor-<view>-<desktop|mobile>.png`.
If auth can't be set up, record in `INDEX.md` that editor parity will be eyeballed manually post-migration, and proceed — the logged-out public view remains the hard line.

- [ ] **Step 5: Capture marketing baseline**

Using the `browse` skill, screenshot the marketing homepage at desktop + mobile.
Save as `docs/superpowers/baselines/v3/marketing-home-<desktop|mobile>.png`.

- [ ] **Step 6: Commit the gitignore change**

```bash
git add .gitignore
git commit -m "chore: ignore local tailwind v4 migration baselines"
```

---

## Task 2: Bump dependencies to Tailwind v4

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `apps/frontend/package.json`
- Modify: `apps/marketing/package.json`

- [ ] **Step 1: Bump `@trylinky/ui`**

In `packages/ui/package.json`, change the `tailwindcss` dependency:

```jsonc
"tailwindcss": "^4",
```

Leave the four plugins (`tailwindcss-animate`, `@tailwindcss/forms`, `@tailwindcss/typography`, `@tailwindcss/container-queries`) as-is for now; they load via the JS config.

- [ ] **Step 2: Bump `apps/frontend`**

In `apps/frontend/package.json`:
- change `"tailwindcss": "^3.4.14"` → `"tailwindcss": "^4"`,
- add `"@tailwindcss/postcss": "^4"` to `devDependencies`,
- remove `"autoprefixer": "^10.4.20"` (v4 handles vendor prefixing; `postcss` stays).

- [ ] **Step 3: Bump `apps/marketing`**

In `apps/marketing/package.json`, apply the identical three changes as Step 2.

- [ ] **Step 4: Install**

Run: `pnpm install`
Expected: lockfile updates, Tailwind v4 + `@tailwindcss/postcss` resolved, no peer-dependency errors that block install. Note any plugin peer warnings (esp. `tailwindcss-animate`) for Task 6.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/package.json apps/frontend/package.json apps/marketing/package.json pnpm-lock.yaml
git commit -m "build: bump tailwindcss to v4 and add @tailwindcss/postcss"
```

---

## Task 3: Switch PostCSS to the v4 plugin

**Files:**
- Modify: `apps/frontend/postcss.config.js`
- Modify: `apps/marketing/postcss.config.js`

- [ ] **Step 1: Rewrite the frontend PostCSS config**

Replace the entire contents of `apps/frontend/postcss.config.js` with:

```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 2: Rewrite the marketing PostCSS config**

Replace the entire contents of `apps/marketing/postcss.config.js` with the identical content from Step 1.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/postcss.config.js apps/marketing/postcss.config.js
git commit -m "build: use @tailwindcss/postcss in both apps"
```

---

## Task 4: Rewrite CSS entrypoints (`@import` + `@config`)

**Files:**
- Modify: `apps/frontend/app/globals.css`
- Modify: `apps/marketing/src/app/globals.css`

- [ ] **Step 1: Frontend globals.css header**

In `apps/frontend/app/globals.css`, replace the first three lines:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

with:

```css
@import "tailwindcss";
@config "../tailwind.config.ts";
```

(`../tailwind.config.ts` is relative to `apps/frontend/app/globals.css` → `apps/frontend/tailwind.config.ts`.)
Leave the rest of the file (the `:root`/`.dark` token blocks, `@layer base`, `@layer utilities` font hack, `.no-scrollbar`, mapbox rule) unchanged.

- [ ] **Step 2: Marketing globals.css header**

In `apps/marketing/src/app/globals.css`, replace the same first three `@tailwind` lines with:

```css
@import "tailwindcss";
@config "../../tailwind.config.ts";
```

(`../../tailwind.config.ts` is relative to `apps/marketing/src/app/globals.css` → `apps/marketing/tailwind.config.ts`.)
Leave the rest of the file unchanged.

- [ ] **Step 3: Smoke-test the dev server**

Restart `pnpm dev`. Load the logged-out public page and the marketing homepage.
Expected: pages render styled (not unstyled HTML). If they're unstyled, the `@config` path is wrong or content globs aren't resolving — fix before continuing. Some defaults will look off (borders/rings) — that's expected and handled in Task 6.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/globals.css apps/marketing/src/app/globals.css
git commit -m "build: switch css entrypoints to tailwind v4 import + @config"
```

---

## Task 5: Run the upgrade codemod and review

**Files:**
- Modify: any `.tsx`/`.ts`/`.css` containing renamed utilities (codemod output)

- [ ] **Step 1: Run the official codemod**

Run: `npx @tailwindcss/upgrade@latest` at the repo root.
If it errors on the monorepo layout, run it once per package directory (`apps/frontend`, `apps/marketing`, `packages/ui`).
Expected: it edits class names in source files and may touch the config/CSS. Do **not** accept config/CSS rewrites that move tokens into `@theme` — this plan keeps the JS config via `@config`. Revert any such rewrite; keep only the mechanical class renames.

- [ ] **Step 2: Review the diff**

Run: `git diff --stat` then `git diff`.
Verify the changes are limited to class renames such as: `shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`, `rounded`→`rounded-sm`/`rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, `flex-shrink-0`→`shrink-0`, deprecated `*-opacity-*` → slash syntax, `blur`/`drop-shadow` scale shifts.
Watch items to inspect manually (codemod may miss): any use of `container` utility, `space-x-*`/`space-y-*` stacks, and `ring`/`ring-offset` usage in the editor and public page.

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS. Fix any breakage the codemod introduced.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: apply tailwind v4 codemod class renames"
```

---

## Task 6: Add the compatibility base layer

Pin v4's changed defaults back to v3 so the public view stays identical. Add the same block to both `globals.css` files, after the existing `:root`/`.dark` token blocks.

**Files:**
- Modify: `apps/frontend/app/globals.css`
- Modify: `apps/marketing/src/app/globals.css`

- [ ] **Step 1: Add the compatibility layer to frontend**

In `apps/frontend/app/globals.css`, add this block (after the `.dark { … }` block, before the existing `@layer base { * { @apply border-border } }`):

```css
/* Tailwind v4 compatibility: restore v3 default behaviors for visual parity.
   Remove incrementally once intentionally redesigned. */
@layer base {
  /* v4 defaults border/divide color to currentColor; v3 used gray-200. */
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, #e5e7eb);
  }

  /* v4 defaults placeholder to currentColor@50%; v3 used gray-400. */
  input::placeholder,
  textarea::placeholder {
    color: var(--color-gray-400, #9ca3af);
    opacity: 1;
  }

  /* v4 sets interactive elements to cursor:default; v3 used pointer. */
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}

/* v4 default ring width is 1px (v3 was 3px). Restore the v3 width so any
   bare `ring` utility matches. Ring colors in this codebase are set
   explicitly (e.g. ring-ring), so only the width needs restoring. */
@theme {
  --default-ring-width: 3px;
}
```

Note: the file already has `* { @apply border-border }`, which sets borders to the `--border` token where applied. The rule above is a safety net for elements that get a `border-*` utility without an explicit color. If after diffing the existing rule already covers all cases, the border rule here can be trimmed — decide against the screenshots, not preemptively.

- [ ] **Step 2: Add the same layer to marketing**

Add the identical block to `apps/marketing/src/app/globals.css` in the same relative position.

- [ ] **Step 3: Restart and smoke-test**

Restart `pnpm dev`. Confirm the public page and marketing home render with borders/placeholders/cursors looking like v3 again.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/globals.css apps/marketing/src/app/globals.css
git commit -m "fix: pin tailwind v4 defaults to v3 for visual parity"
```

---

## Task 7: Build gate

**Files:** none (verification only)

- [ ] **Step 1: Production build, both apps**

Run: `pnpm build` (or `turbo build`).
Expected: both `apps/frontend` and `apps/marketing` build successfully with Tailwind v4. Investigate and fix any CSS/PostCSS build error.

- [ ] **Step 2: Typecheck + lint once more**

Run: `pnpm typecheck && pnpm lint`
Expected: PASS.

---

## Task 8: Capture v4 screenshots and diff against baselines

**Files:**
- Create: `docs/superpowers/baselines/v4/` (screenshot output dir)

- [ ] **Step 1: Re-capture every baseline shot on v4**

With `pnpm dev` running on the migrated branch, repeat **every** capture from Task 1 (same URLs, same viewports, same auth state), saving to `docs/superpowers/baselines/v4/` with the same filenames.

- [ ] **Step 2: Diff each pair**

For each filename, compare `v3/<name>.png` against `v4/<name>.png` (the `browse` skill's diff/compare, or an image-diff). Produce a list of pages with non-empty diffs.

- [ ] **Step 3: Resolve deltas against the compatibility checklist**

For each non-empty diff, identify the cause and fix it by extending the compatibility layer (Task 6) — common culprits: border color, ring width/color, placeholder, `space-x/y` selector change, `container` padding, `hover:` on touch. Re-capture and re-diff until:
- **logged-out `/jack` (all three pages, both viewports): pixel-clean**, and
- editor + marketing: clean, or each remaining delta written down in `INDEX.md` with a one-line justification and explicit acceptance.

- [ ] **Step 4: Commit any parity fixes**

```bash
git add apps/frontend/app/globals.css apps/marketing/src/app/globals.css
git commit -m "fix: resolve tailwind v4 visual parity deltas"
```

---

## Task 9: Finalize

**Files:** none

- [ ] **Step 1: Confirm clean tree and green checks**

Run: `git status` (clean), `pnpm typecheck && pnpm lint && pnpm build` (all PASS).

- [ ] **Step 2: Verify the deferral boundary held**

Run: `git diff main --stat`
Expected: changes limited to package.json/lockfile, the two `postcss.config.js`, the two `globals.css`, codemod class renames, and the spec/plan docs. **No** Catalyst code, **no** `/e/` routes, **no** new components. If anything outside that boundary changed, it doesn't belong in this spec.

- [ ] **Step 3: Hand off**

Migration complete. Report the diff summary and the parity result (which pages were pixel-clean, which deltas were accepted and why). Spec 2 (Catalyst editor shell + routes) can now begin.

---

## Notes for the implementer

- **The hard line is logged-out `/jack`.** Editor/marketing deltas can be accepted with justification; the public view cannot.
- **Keep the JS config.** If the codemod or any guide tempts you to move tokens into a `@theme` block, don't — that's deliberately deferred. The `@config` directive is doing that job.
- **Content scanning is load-bearing.** The frontend config globs `../../packages/ui/src/**` and `../../packages/common/src/**`. If shared-component styles vanish after migration, that glob (or an `@source` directive) is the first thing to check.
- **`tailwindcss-animate` is the most likely plugin casualty.** If accordion/animation utilities break under v4, swap it for the v4-native `tw-animate-css` (add dep, replace the `require('tailwindcss-animate')` plugin entry) and re-verify the affected components.
