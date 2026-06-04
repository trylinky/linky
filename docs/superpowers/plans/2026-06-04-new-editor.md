# New Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the page editor to a dedicated logged-in `/e/<slug>` area with a Catalyst StackedLayout top-nav shell and a route per tab, make the public `/<slug>` page public-only and cacheable, and begin adopting Catalyst (vendored into `@trylinky/ui`) in the editor.

**Architecture:** New `app/e/[slug]/` route group hosts the editor (shell layout + blocks canvas + 5 tab pages), reusing the existing `Grid`/`EditWrapper` canvas and the data flow of the current `Sidebar*` tab components. `app/[domain]/[slug]/` is stripped to a session-free, cacheable public renderer. Caching uses Next 16 `use cache` + `cacheTag` with a short `cacheLife`; publish/theme/settings frontend server actions `revalidateTag` in-process for instant freshness.

**Tech Stack:** Next.js 16 (App Router, Cache Components), Tailwind v4, Catalyst (Headless UI + `motion`), `@trylinky/ui` (shadcn, being partially replaced), SWR + `InternalApi` (→ Fastify `apps/api`), better-auth, Prisma, `browse` skill for parity verification.

**Spec:** `docs/superpowers/specs/2026-06-04-new-editor-design.md`

**Branch:** `ui/new-editor` (already created; holds the spec commit).

---

## The sacred invariant (every phase preserves this)

**Logged-out `lin.ky/<slug>` must stay pixel-identical.** The shadcn→Catalyst replacement touches **editor-only** components. The public render path — verified in Task 1 — is quarantined.

## Public-render quarantine list — CONFIRMED (Task E2-1)

The public render path uses these shadcn `@trylinky/ui` exports:
- `SidebarProvider`, `Button` — `LinkyProviders.tsx`
- `Dialog, DialogContent, DialogHeader, DialogTitle, Button, Tabs, TabsContent, TabsList, TabsTrigger, toast` — `ShareDialog.tsx` (via `ShareButton`)
- `cn` — `CoreBlock.tsx` + block UIs (`header/ui-*`, `link-box/ui-client`, …)
- `Button`, `toast`, `Skeleton` — block UIs under `lib/blocks/*/ui*.tsx`

All 18 block UI components and `CoreBlock` render publicly.

**THE LOCKED RULE for this spec:** never modify or delete any shadcn primitive in
`packages/ui/src/ui/` — several are on the public path, and the public page must stay
pixel-identical. To adopt Catalyst in an **editor** file, change *that file's import* from the
shadcn name to `Catalyst.*` (e.g. `Button` → `Catalyst.Button`). The shadcn components stay in
place for the public path (and any non-migrated surface). Catalyst replacement applies only to
the editor shell + tab pages. `Skeleton`, `Card*`, and `Chart*` (analytics) stay shadcn in this
spec (Spec 3).

---

## File Structure

**Create:**
- `packages/ui/src/catalyst/*.tsx` — vendored Catalyst components (button, navbar, stacked-layout, dropdown, avatar, input, select, switch, heading, text, divider, badge, dialog, fieldset, table, link, etc.).
- `packages/ui/src/catalyst/index.ts` — barrel export for the Catalyst set.
- `apps/frontend/app/e/[slug]/layout.tsx` — editor shell (auth gate, providers, navbar).
- `apps/frontend/app/e/[slug]/editor-navbar.tsx` — client navbar (tabs + switchers).
- `apps/frontend/app/e/[slug]/page.tsx` — blocks canvas.
- `apps/frontend/app/e/[slug]/settings/page.tsx`, `themes/page.tsx`, `integrations/page.tsx`, `analytics/page.tsx`, `forms/page.tsx` — tab pages.
- `apps/frontend/app/e/page.tsx` — redirect to first page.
- `apps/frontend/app/lib/public-read.ts` — cookie-free public read helper (for cacheable reads).

**Modify:**
- `packages/ui/src/index.ts` — re-export Catalyst (namespaced).
- `apps/frontend/middleware.ts` — exclude `e` from rewrite.
- `apps/frontend/app/[domain]/[slug]/page.tsx`, `layout.tsx`, `grid.tsx` — public-only + cacheable.
- `apps/frontend/app/lib/actions/page-actions.ts` — `use cache` + `cacheTag` + `cacheLife`.
- `apps/frontend/app/components/EditPageSettingsDialog/actions.ts` — `revalidateTag` on publish/settings.
- `apps/frontend/app/lib/actions/themes.ts` — `revalidateTag` on theme change.
- `apps/frontend/app/edit/route.ts` — 308 redirect to `/e`.

**Retire (Phase 5, after `/e/` works):** `app/components/EditSidebar.tsx`, `EditLayout.tsx`, `GlobalNavigation.tsx`, and the `sidebarView` state in `packages/ui/src/ui/sidebar.tsx`; move/inline the `Sidebar*` tab components into the new pages.

---

# PHASE 1 — Catalyst foundation (no behavior change)

### Task 1: Audit & lock the public-render quarantine list

**Files:** none (produces a checked-in note)

- [ ] **Step 1: Verify the quarantine list**

Run, from `apps/frontend`:
```bash
grep -rl "renderBlock\|CoreBlock" lib/blocks app | grep -v node_modules
grep -rn "from '@trylinky/ui'" app/components/ShareDialog.tsx app/components/ShareButton.tsx app/components/CoreBlock.tsx lib/blocks
```
Expected: confirms the public path uses `cn`, `SidebarProvider`, and (via ShareDialog) `Dialog*/Button/Tabs*/toast`, plus block UIs. Cross-check against the "Public-render quarantine list" above; add any newly found public-path `@trylinky/ui` usage to it.

- [ ] **Step 2: Record the list in the plan**

Append any additions to the quarantine list section of this file (so later tasks see it). Commit:
```bash
git add docs/superpowers/plans/2026-06-04-new-editor.md
git commit -m "docs: lock public-render quarantine list for editor migration"
```

### Task 2: Vendor Catalyst components into `@trylinky/ui`

**Files:**
- Create: `packages/ui/src/catalyst/<component>.tsx` (one per kit file used)
- Create: `packages/ui/src/catalyst/index.ts`
- Modify: `packages/ui/src/index.ts`

Source kit: `/Users/alexpate/Downloads/catalyst-ui-kit/typescript/*.tsx` (Tailwind v4, already compatible). Copy the components the editor needs: `link`, `button`, `navbar`, `stacked-layout`, `dropdown`, `avatar`, `heading`, `text`, `divider`, `badge`, `input`, `select`, `switch`, `fieldset`, `dialog`, `table`, `description-list`. (Copy more later as tabs need them — YAGNI for now.)

- [ ] **Step 1: Copy the kit files**

```bash
mkdir -p packages/ui/src/catalyst
cp /Users/alexpate/Downloads/catalyst-ui-kit/typescript/{link,button,navbar,stacked-layout,dropdown,avatar,heading,text,divider,badge,input,select,switch,fieldset,dialog,table,description-list}.tsx packages/ui/src/catalyst/
```

- [ ] **Step 2: Adapt the Link component for Next.js**

Replace the entire contents of `packages/ui/src/catalyst/link.tsx` with:

```tsx
'use client';

import * as Headless from '@headlessui/react';
import NextLink, { type LinkProps } from 'next/link';
import React, { forwardRef } from 'react';

export const Link = forwardRef(function Link(
  props: LinkProps & React.ComponentPropsWithoutRef<'a'>,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Headless.DataInteractive>
      <NextLink {...props} ref={ref} />
    </Headless.DataInteractive>
  );
});
```

- [ ] **Step 3: Create the barrel export**

Create `packages/ui/src/catalyst/index.ts`:

```ts
export * from './link';
export * from './button';
export * from './navbar';
export * from './stacked-layout';
export * from './dropdown';
export * from './avatar';
export * from './heading';
export * from './text';
export * from './divider';
export * from './badge';
export * from './input';
export * from './select';
export * from './switch';
export * from './fieldset';
export * from './dialog';
export * from './table';
export * from './description-list';
```

- [ ] **Step 4: Re-export namespaced from `@trylinky/ui`**

Append to `packages/ui/src/index.ts`:

```ts
export * as Catalyst from './catalyst';
```

(Namespaced to avoid name collisions with shadcn exports like `Button`/`Dialog`. Editor code imports `import * as Catalyst from '@trylinky/ui/catalyst'` then uses `<Catalyst.Button>`.)

- [ ] **Step 5: Verify it compiles in isolation**

Run from `apps/frontend`:
```bash
npx --yes @tailwindcss/cli@4.3.0 -i app/globals.css -o /tmp/fe.css 2>&1 | grep -iE "error|done" | head
```
Expected: `Done` (the new files are scanned; classes compile). Then `pnpm typecheck` → PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/catalyst packages/ui/src/index.ts
git commit -m "feat(ui): vendor Catalyst components with Next.js Link adapter"
```

---

# PHASE 2 — `/e/` shell, routing & auth (editor reachable at /e; public unchanged)

### Task 3: Exclude `/e/` from the middleware rewrite

**Files:** Modify `apps/frontend/middleware.ts`

- [ ] **Step 1: Add `e` to the matcher negative-lookahead**

Change the matcher line from:
```ts
'/((?!api/|_next/|i/|_static/|_vercel|edit|invite|new|new-api|assets|[\\w-]+\\.\\w+).*)',
```
to (use `e(?=/|$)`, NOT bare `e` — bare `e` would exclude every slug starting with "e" like `/emma` and 404 those public pages; the lookahead matches only `/e` exactly and `/e/...`):
```ts
'/((?!api/|_next/|i/|_static/|_vercel|e(?=/|$)|edit|invite|new|new-api|assets|[\\w-]+\\.\\w+).*)',
```

- [ ] **Step 2: Verify `/e/*` is not rewritten**

Restart dev (`pnpm dev`). `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/e` — expect a Next response from the new route (404 until Task 5 lands, NOT a rewrite to `[domain]/[slug]`). Confirm `/<slug>` public pages still 200.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/middleware.ts
git commit -m "feat(editor): route /e/* to the app router instead of the domain rewrite"
```

### Task 4: Editor shell layout with auth gate

**Files:** Create `apps/frontend/app/e/[slug]/layout.tsx`, `apps/frontend/app/e/[slug]/editor-navbar.tsx`

This mirrors the owner branch of today's `app/[domain]/[slug]/layout.tsx` (session, ownership, SWR fallback, `LinkyProviders`, `EditModeContextProvider`) but renders the Catalyst `StackedLayout` shell and enforces the auth gate (Spec §F).

- [ ] **Step 1: Create the shell layout**

Create `apps/frontend/app/e/[slug]/layout.tsx`:

```tsx
import { EditModeContextProvider } from '@/app/contexts/Edit';
import { EditorNavbar } from '@/app/e/[slug]/editor-navbar';
import { LinkyProviders } from '@/app/components/LinkyProviders';
import { getEnabledBlocks } from '@/app/lib/actions/blocks';
import { getTeamIntegrations } from '@/app/lib/actions/integrations';
import {
  getPageBlocks,
  getPageIdBySlugOrDomain,
  getPageLayout,
  getPageSettings,
  getPageTheme,
} from '@/app/lib/actions/page-actions';
import { getSession } from '@/app/lib/auth';
import * as Catalyst from '@trylinky/ui/catalyst';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const session = await getSession({ fetchOptions: { headers: await headers() } });

  // Auth gate (Spec §F)
  if (!session?.data?.user) {
    redirect(`/i/auth/login?redirectTo=/e/${slug}`);
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  const page = await getPageIdBySlugOrDomain(slug, rootDomain);
  if (!page) notFound();

  if (session.data.session.activeOrganizationId !== page.organizationId) {
    redirect(`/${slug}`); // logged-in non-owner → public view
  }

  // Owner data (mirrors today's owner branch)
  const [integrations, enabledBlocks, pageSettings] = await Promise.all([
    getTeamIntegrations(),
    getEnabledBlocks(),
    getPageSettings(page.id),
  ]);
  const [{ blocks }, pageLayout, pageTheme] = await Promise.all([
    getPageBlocks(page.id),
    getPageLayout(page.id),
    getPageTheme(page.id),
  ]);

  const initialData: Record<string, any> = {
    [`/pages/${page.id}/layout`]: pageLayout,
    [`/pages/${page.id}/theme`]: pageTheme,
    [`/integrations/me`]: integrations,
    [`/blocks/enabled-blocks`]: enabledBlocks,
    [`/pages/${page.id}/settings`]: pageSettings,
  };
  if (blocks?.length) {
    blocks.forEach((b: any) => (initialData[`/blocks/${b.id}`] = { blockData: b.data }));
  }

  return (
    <LinkyProviders
      currentUserIsOwner
      pageId={page.id}
      value={{ fallback: initialData }}
    >
      <EditModeContextProvider>
        <Catalyst.StackedLayout navbar={<EditorNavbar slug={slug} />} sidebar={null}>
          {props.children}
        </Catalyst.StackedLayout>
      </EditModeContextProvider>
    </LinkyProviders>
  );
}
```

Note: confirm the login route. The magic-link default callback is `/edit` and the verify page is `/i/auth/verify`; if no dedicated login page exists, redirect to the app's sign-in entry with a `redirectTo`/`callbackURL` of `/e/${slug}` (check `packages/common/src/auth/login-form.tsx`’s `redirectTo` usage and use the same entry the app links to for "Sign in"). Adjust the `redirect(...)` target accordingly.

- [ ] **Step 2: Build the navbar (tabs + switchers)**

Create `apps/frontend/app/e/[slug]/editor-navbar.tsx`:

```tsx
'use client';

import { useEditModeContext } from '@/app/contexts/Edit';
import { PageSwitcher } from '@/app/components/PageSwitcher';
import { TeamSwitcher } from '@/app/components/TeamSwitcher';
import { UserWidget } from '@/app/components/UserWidget';
import { auth } from '@/app/lib/auth';
import * as Catalyst from '@trylinky/ui/catalyst';
import { internalApiFetcher } from '@trylinky/common';
import type { Page } from '@trylinky/prisma';
import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';

const tabs = (slug: string) => [
  { label: 'Blocks', href: `/e/${slug}` },
  { label: 'Themes', href: `/e/${slug}/themes` },
  { label: 'Settings', href: `/e/${slug}/settings` },
  { label: 'Integrations', href: `/e/${slug}/integrations` },
  { label: 'Analytics', href: `/e/${slug}/analytics` },
  { label: 'Forms', href: `/e/${slug}/forms` },
];

export function EditorNavbar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { data: orgs } = auth.useListOrganizations();
  const { data: teamPages } = useSWR<Partial<Page>[]>('/pages/me', internalApiFetcher);
  const onBlocks = pathname === `/e/${slug}`;

  return (
    <Catalyst.Navbar>
      <Catalyst.NavbarSection>
        {orgs && orgs.length > 1 && <TeamSwitcher usersOrganizations={orgs} />}
        <PageSwitcher teamPages={teamPages} />
      </Catalyst.NavbarSection>
      <Catalyst.NavbarDivider />
      <Catalyst.NavbarSection>
        {tabs(slug).map((t) => (
          <Catalyst.NavbarItem key={t.href} href={t.href} current={pathname === t.href}>
            {t.label}
          </Catalyst.NavbarItem>
        ))}
      </Catalyst.NavbarSection>
      <Catalyst.NavbarSpacer />
      <Catalyst.NavbarSection>
        {onBlocks && <ScreenSizeSwitcher />}
        <UserWidget usersOrganizations={orgs} />
      </Catalyst.NavbarSection>
    </Catalyst.Navbar>
  );
}

function ScreenSizeSwitcher() {
  const { editLayoutMode, setEditLayoutMode } = useEditModeContext();
  return (
    <span className="inline-flex items-center gap-1">
      <Catalyst.NavbarItem
        current={editLayoutMode === 'desktop'}
        onClick={() => setEditLayoutMode('desktop')}
        aria-label="Desktop preview"
      >
        <ComputerDesktopIcon />
      </Catalyst.NavbarItem>
      <Catalyst.NavbarItem
        current={editLayoutMode === 'mobile'}
        onClick={() => setEditLayoutMode('mobile')}
        aria-label="Mobile preview"
      >
        <DevicePhoneMobileIcon />
      </Catalyst.NavbarItem>
    </span>
  );
}
```

(Verify `PageSwitcher`/`TeamSwitcher`/`UserWidget` props against their current files; they're reused as-is. If any depend on `useSidebar`, drop that usage since there's no sidebar now.)

- [ ] **Step 3: Verify the shell renders for an owner**

Restart dev. As a logged-in owner, load `http://localhost:3000/e/<your-slug>` → expect the StackedLayout shell with top nav and tabs. Logged-out → redirected to login. Non-owner slug → redirected to `/<slug>`. (The canvas body lands in Task 5.) `pnpm typecheck` PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/e/[slug]/layout.tsx apps/frontend/app/e/[slug]/editor-navbar.tsx
git commit -m "feat(editor): Catalyst stacked-layout shell + auth gate at /e/[slug]"
```

### Task 5: Blocks canvas page + `/e` redirect + `/edit` back-compat

**Files:** Create `apps/frontend/app/e/[slug]/page.tsx`, `apps/frontend/app/e/page.tsx`; Modify `apps/frontend/app/edit/route.ts`

- [ ] **Step 1a: A client canvas that uses `EditWrapper` directly (NOT `Grid`'s editMode branch)**

`Grid`'s `editMode` branch mounts its own `EditModeContextProvider` + the legacy `GlobalNavigation`/`EditLayout`. The shell (Task 4) already provides `EditModeContextProvider` (the navbar's `ScreenSizeSwitcher` needs it) and the chrome. So the canvas must render the drag/drop `EditWrapper` **directly** under the shell's provider — never `Grid` with `editMode`. Create `apps/frontend/app/e/[slug]/canvas.tsx`:

```tsx
'use client';

import type { PageConfig } from '@/app/[domain]/[slug]/grid';
import dynamic from 'next/dynamic';
import { ReactNode, useMemo } from 'react';
import { Responsive, ResponsiveProps } from 'react-grid-layout';

const DynamicEditWrapper = dynamic(
  () => import('@/app/components/EditWrapper').then((m) => ({ default: m.EditWrapper })),
  { ssr: false }
);

const layoutProps: ResponsiveProps = {
  useCSSTransforms: true,
  width: 624,
  rowHeight: 32,
  cols: { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 },
  margin: [10, 10],
  containerPadding: { lg: [0, 20], md: [0, 20], sm: [0, 20], xs: [0, 20], xxs: [10, 20] },
  compactType: 'vertical',
  isResizable: true,
  isDraggable: true,
  isDroppable: true,
};

export function EditorCanvas({ children }: { children: ReactNode[] }) {
  // EditWrapper reads layout from SWR (seeded by the shell's LinkyProviders fallback)
  // and owns drag/drop. The shell provides EditModeContextProvider.
  return <DynamicEditWrapper layoutProps={layoutProps}>{children}</DynamicEditWrapper>;
}
```
(These `layoutProps` are copied from `grid.tsx`'s `defaultLayoutProps`. Keep them in sync; Task 12 makes `grid.tsx` static-only so the two no longer share the edit path.)

- [ ] **Step 1b: The canvas page**

Create `apps/frontend/app/e/[slug]/page.tsx`:

```tsx
import { EditorCanvas } from '@/app/e/[slug]/canvas';
import {
  getPageIdBySlugOrDomain,
  getPageLayout,
  getPageLoadData,
} from '@/app/lib/actions/page-actions';
import type { PageConfig } from '@/app/[domain]/[slug]/grid';
import { renderBlock } from '@/lib/blocks/ui';
import { Block } from '@trylinky/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorCanvasPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN!;
  const corePage = await getPageIdBySlugOrDomain(slug, rootDomain);
  if (!corePage) notFound();

  const [layout, page] = await Promise.all([
    getPageLayout(corePage.id),
    getPageLoadData(corePage.id),
  ]);
  if (!page) notFound();

  const pageLayout = layout as unknown as PageConfig;
  const mergedIds = [...pageLayout.sm, ...pageLayout.xxs].map((i) => i.i);

  return (
    <EditorCanvas>
      {page.blocks
        .filter((b: Block) => mergedIds.includes(b.id))
        .map((b: Block) => (
          <section key={b.id} style={{ fontFamily: 'var(--font-sys-body)' }}>
            {renderBlock(b, page.id, true)}
          </section>
        ))}
    </EditorCanvas>
  );
}
```

This avoids any legacy chrome and any double `EditModeContextProvider`. `Grid` (with its `editMode` branch) is now unused by `/e`; Task 12 removes that branch.

- [ ] **Step 2: `/e` → first page redirect**

Create `apps/frontend/app/e/page.tsx` porting `app/edit/route.ts`'s logic (it uses `prisma` directly + `getSession`):

```tsx
import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditorIndex() {
  const session = await getSession({ fetchOptions: { headers: await headers() } });
  const { user, session: s } = session?.data ?? {};
  if (!user || !s?.activeOrganizationId) redirect('/i/auth/login?redirectTo=/e');

  const pages = await prisma.page.findMany({
    where: { organizationId: s.activeOrganizationId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { slug: true },
    take: 1,
  });
  if (!pages.length) redirect('/new?freshOnboarding=true');
  redirect(`/e/${pages[0].slug}`);
}
```

- [ ] **Step 3: `/edit` → 308 to `/e`**

Replace `apps/frontend/app/edit/route.ts` with a redirect that preserves the onboarding query params:

```ts
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  redirect(`/e${qs ? `?${qs}` : ''}`);
}
```

- [ ] **Step 4: Verify**

Restart dev. Logged-in: `/e` → `/e/<first-slug>` (canvas renders, drag/drop works). `/edit` → `/e`. Empty-org account → `/new?freshOnboarding=true`. `pnpm typecheck` PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/e apps/frontend/app/edit/route.ts
git commit -m "feat(editor): blocks canvas at /e/[slug], /e first-page redirect, /edit back-compat"
```

---

# PHASE 3 — Port the tab pages to Catalyst (editor-only surfaces)

Each tab page is a route under `app/e/[slug]/<tab>/page.tsx` whose body is the corresponding `Sidebar*` component's content, **with shadcn primitives swapped for Catalyst** and laid out full-width. **Preserve every SWR key, `InternalApi` call, and server action** — only presentation changes. The page reads `pageId` the same way the components do today (`useSWRConfig().cache.get('pageId')`), which the shell's `LinkyProviders` populates.

Canonical pattern (worked example = Settings). Apply the same shape to the others using their specifics.

### Task 6: Settings tab page (worked example)

**Files:** Create `apps/frontend/app/e/[slug]/settings/page.tsx`; reference `app/components/SidebarPageSettings.tsx`

- [ ] **Step 1: Create the page wrapper**

```tsx
'use client';

import { SidebarPageSettings } from '@/app/components/SidebarPageSettings';
import * as Catalyst from '@trylinky/ui/catalyst';

export default function SettingsTab() {
  return (
    <div className="mx-auto w-full max-w-3xl py-6">
      <Catalyst.Heading>Settings</Catalyst.Heading>
      <Catalyst.Divider className="my-6" />
      <SidebarPageSettings />
    </div>
  );
}
```

- [ ] **Step 2: Restyle `SidebarPageSettings` body with Catalyst**

In `app/components/SidebarPageSettings.tsx`, replace the `Sidebar*` chrome (`SidebarContentHeader`, `SidebarGroup`, `SidebarGroupContent`) with plain layout (the heading now lives in the page). Replace any shadcn form primitives with `Catalyst.Input`/`Catalyst.Switch`/`Catalyst.Button`/`Catalyst.Fieldset`. Keep its SWR key `/pages/${pageId}/settings`, the `useSWRConfig().cache.get('pageId')` lookup, and its submit/server-action flow unchanged.

- [ ] **Step 3: Verify**

`/e/<slug>/settings` renders the settings form in the shell; editing + saving still works (same network calls). `pnpm typecheck` PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/app/e/[slug]/settings apps/frontend/app/components/SidebarPageSettings.tsx
git commit -m "feat(editor): settings tab page in Catalyst"
```

### Task 7: Themes tab page

Same pattern. `app/e/[slug]/themes/page.tsx` renders `SidebarThemes`. Preserve: SWR `/themes/me/team`, `useSWRConfig` `mutate('/pages/${pageId}/theme')`, and the `setPageTheme` server action (`@/app/lib/actions/themes`). Swap chrome + `Button` for Catalyst. Heading "Themes".
Commit: `feat(editor): themes tab page in Catalyst`.

### Task 8: Integrations tab page

`app/e/[slug]/integrations/page.tsx` renders `SidebarIntegrations`. Preserve: SWR `/integrations/me`, `InternalApi.post('/integrations/disconnect', { integrationId })`, `mutate`. Swap the shadcn `Dialog*`/`Button`/`toast` confirm dialog for `Catalyst.Dialog*`/`Catalyst.Button` (toast stays — `toast` is fine to keep). Heading "Integrations".
Commit: `feat(editor): integrations tab page in Catalyst`.

### Task 9: Analytics tab page

`app/e/[slug]/analytics/page.tsx` renders `SidebarAnalytics`. Preserve: `InternalApi.get('/analytics/pages/${pageId}')`, the chart config, the `Skeleton` fallback. **Keep the shadcn `Chart*` + `Card*`** (charts are not part of the Catalyst kit; restyling them is Spec 3) — only swap the surrounding chrome/headings for Catalyst. Heading "Analytics".
Commit: `feat(editor): analytics tab page (Catalyst chrome, charts unchanged)`.

### Task 10: Forms tab page

`app/e/[slug]/forms/page.tsx` renders `SidebarForms` (placeholder "coming soon"). Swap chrome for Catalyst `Heading`/`Text`. Heading "Forms".
Commit: `feat(editor): forms tab page in Catalyst`.

### Task 11: Blocks palette + per-block edit on the canvas page

**Files:** Modify `apps/frontend/app/e/[slug]/page.tsx`; reference `SidebarBlocks.tsx`, `SidebarBlockForm.tsx`, `EditBlockToolbar.tsx`, `DraggableBlockButton.tsx`

The blocks tab is the canvas (Task 5). Add the block **palette** (`SidebarBlocks` content: search + draggable block buttons) and the **per-block edit** surface (`SidebarBlockForm`, gated on `useEditModeContext().currentEditingBlock`) into the canvas page — e.g. a Catalyst-styled panel beside/over the grid. Replace the `setSidebarView('blockForm'|'blocks')` flow (which referenced the retired sidebar) with `EditModeContext` state: `setCurrentEditingBlock(...)` opens the edit panel, clearing it closes it.

- [ ] **Step 1:** Update `EditBlockToolbar.tsx` and `DraggableBlockButton.tsx` to stop calling `useSidebar().setSidebarView`/`setOpen`; instead drive the edit panel via `EditModeContext` (`setCurrentEditingBlock`) and local panel state.
- [ ] **Step 2:** Render the palette + edit panel in the canvas page using `Catalyst.*` chrome; preserve drag-to-add (`SidebarBlocks` drag handles + `EditWrapper`'s `onDrop`/`nextToAddBlock`) and SWR `/blocks/enabled-blocks`.
- [ ] **Step 3:** Verify add-block (drag + click), edit-block, and close all work on `/e/<slug>`. `pnpm typecheck` PASS.
- [ ] **Step 4:** Commit `feat(editor): block palette + per-block edit on the canvas (Catalyst, context-driven)`.

---

# PHASE 4 — Public-only + cacheable `/<slug>`

### Task 12: Strip edit-mode from the public route

**Files:** Modify `apps/frontend/app/[domain]/[slug]/page.tsx`, `layout.tsx`, `grid.tsx`

- [ ] **Step 1: `layout.tsx` — public-only**

Remove: `getSession`, the owner org check, the owner-only `Promise.all` (`getTeamIntegrations`/`getEnabledBlocks`/`getPageSettings`), the owner `initialData` population, and the onboarding dialogs (`PremiumOnboardingDialog`/`TeamOnboardingDialog`/`UserOnboardingDialog`). Keep the published-theme `<main>` wrapper + `ShareButton` + footer + `RenderPageTheme` + tinybird tracker. `currentUserIsOwner` is always `false` here; `LinkyProviders` gets `currentUserIsOwner={false}` and only the layout/theme fallback. Remove `getSession`-derived branches entirely so the route reads no session.

- [ ] **Step 2: `page.tsx` — public-only**

Remove: `getSession`, `isEditMode`, the `editMode` Grid prop (pass `editMode={false}`), `isLoggedIn` (pass `false`). **Keep** the `publishedAt == null → notFound()` gate and the custom-domain redirect. Drop the `Server-Timing`/`performance.now` instrumentation if it reads request context that blocks caching (optional).

- [ ] **Step 3: `grid.tsx` — drop the edit branch**

The `/e` canvas (Task 5) already uses `EditWrapper` directly, so `Grid`'s `editMode` branch is now dead. Remove the `if (editMode) { … EditModeContextProvider/GlobalNavigation/EditLayout/DynamicEditWrapper … }` block, the dynamic `EditWrapper` import, and the `editMode` prop. `Grid` now only renders the static `ResponsiveReactGridLayout` for the public page. (Verify nothing else imports `Grid` with `editMode` after this: `grep -rn "editMode" apps/frontend/app | grep -v node_modules`.)

- [ ] **Step 4: Verify public render unchanged**

Logged-out `/<slug>` (published) renders identically; logged-in owner visiting `/<slug>` now sees the **public** view (no editor). `pnpm typecheck` PASS.

- [ ] **Step 5: Commit** `refactor(public): make /[domain]/[slug] public-only (editor moved to /e)`.

### Task 13: Cacheable public reads

**Files:** Create `apps/frontend/app/lib/public-read.ts`; Modify `apps/frontend/app/lib/actions/page-actions.ts`, `app/[domain]/[slug]/page.tsx`, `layout.tsx`

- [ ] **Step 1: Cookie-free public read helper**

`apiServerFetch` forwards cookies (reads `headers()`), which `use cache` forbids. Create `app/lib/public-read.ts` — a fetch to `apps/api` that sends NO cookies/headers (published pages are public). Mirror `apiServerFetch` minus the header/cookie forwarding:

```ts
export async function publicApiFetch(path: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method: 'GET',
  });
  return res;
}
```
(Confirm the `apps/api` GET endpoints for page-by-slug/load/layout/theme don't require auth for published pages; if they do, add a public variant — but published page data is already served to logged-out visitors today.)

- [ ] **Step 2: Add cacheable read functions**

In `page-actions.ts`, add cached public variants used by the public route (keep the existing cookie-forwarding ones for the editor). Example:

```ts
import { unstable_cacheTag as cacheTag, unstable_cacheLife as cacheLife } from 'next/cache';
import { publicApiFetch } from '@/app/lib/public-read';

export async function getPublicPageBySlug(slug: string, domain: string) {
  'use cache';
  cacheLife('minutes'); // ~ short window; tune to ~60s
  cacheTag(`page-slug-${slug}-${domain}`);
  const res = await publicApiFetch(
    `/pages/by-slug-or-domain?slug=${encodeURIComponent(slug)}&domain=${encodeURIComponent(domain)}`
  );
  return res.status === 200 ? res.json() : null;
}
```
Add parallel `getPublicPageLoadData(id)`, `getPublicPageLayout(id)`, `getPublicPageTheme(id)` — each `'use cache'`, tagged `page-id-${id}` (+ specific suffix), using `publicApiFetch`. (Use the real `apps/api` GET paths confirmed in Step 1.)

- [ ] **Step 3: Point the public route at the cached reads + remove `force-dynamic`**

In `app/[domain]/[slug]/page.tsx` and `layout.tsx`: replace the read calls with the `getPublic*` variants and **remove** `export const dynamic = 'force-dynamic'` and `export const revalidate = 0`. Keep `dynamicParams = true`. Ensure nothing in the render reads `headers()`/`cookies()` except where unavoidable (user-agent for mobile detection makes the page dynamic — if so, move mobile detection client-side or accept it; prefer not blocking the cache: render a responsive grid without server UA and drop `isUserAgentMobile` on the public path).

- [ ] **Step 4: Verify caching**

Restart dev. Load `/<slug>` twice; confirm the second is served from cache (Next cache headers / much faster). Confirm logged-out parity preserved.

- [ ] **Step 5: Commit** `feat(public): cache /[domain]/[slug] with use cache + cacheTag`.

### Task 14: Revalidate on publish / theme / settings

**Files:** Modify `apps/frontend/app/components/EditPageSettingsDialog/actions.ts`, `apps/frontend/app/lib/actions/themes.ts`

- [ ] **Step 1: Revalidate after publish/settings write**

In `updateGeneralPageSettings` (after the `prisma.page.update` that sets `publishedAt`/`slug`), call:

```ts
import { revalidateTag } from 'next/cache';
// after successful update:
revalidateTag(`page-slug-${updatedPage.slug}-${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);
revalidateTag(`page-id-${updatedPage.id}`);
// if slug changed, also revalidate the old slug tag
```

- [ ] **Step 2: Revalidate after theme change**

In `setPageTheme` (`app/lib/actions/themes.ts`), after the write, `revalidateTag(`page-id-${pageId}`)` (and the slug tag if available). Keep the existing SWR `mutate` in the client unchanged (that updates the editor; `revalidateTag` updates the public cache).

- [ ] **Step 3: Verify instant publish**

Publish a previously-unpublished page → load `/<slug>` logged-out → it appears immediately (not after the `cacheLife` window). Change theme/slug → public reflects on next load.

- [ ] **Step 4: Commit** `feat(public): revalidate public page cache on publish/theme/settings`.

---

# PHASE 5 — Cleanup & verification

### Task 15: Retire dead editor chrome

**Files:** Delete `app/components/EditSidebar.tsx`, `EditLayout.tsx`, `GlobalNavigation.tsx`; Modify `packages/ui/src/ui/sidebar.tsx` (remove `sidebarView`/`setSidebarView`/`SidebarView` if now unused); relocate the `Sidebar*` tab components if they were inlined.

- [ ] **Step 1:** Grep for remaining references: `grep -rn "EditSidebar\|EditLayout\|GlobalNavigation\|setSidebarView\|sidebarView" apps/frontend/app packages/ui/src | grep -v node_modules`. Only remove a symbol once it has zero references.
- [ ] **Step 2:** Delete the now-unused files and the `sidebarView` additions to `@trylinky/ui` sidebar. Keep the base `Sidebar`/`useSidebar` primitives if still used elsewhere (the public `LinkyProviders` uses `SidebarProvider` with `skipSidebar` — do not remove that).
- [ ] **Step 3:** `pnpm typecheck` + `pnpm lint` PASS; frontend builds.
- [ ] **Step 4:** Commit `chore(editor): remove legacy sidebar/global-nav chrome replaced by /e shell`.

### Task 16: Full verification

**Files:** none

- [ ] **Step 1: Public parity** — re-run the Spec-1 browser-diff on logged-out `/<slug>` (tests, xfghfdg, asfsf; desktop + mobile) vs the v3/v4 baselines. Must be pixel-identical.
- [ ] **Step 2: Caching** — confirm `/<slug>` serves cached; confirm publish→public is immediate; confirm the public route reads no cookies (search the public route + cached reads for `headers(`/`cookies(`).
- [ ] **Step 3: Editor QA** (use the `browse` skill, authenticated): each tab route loads + deep-links + active-tab indicator correct; canvas drag/add/save works; `/e`→first page; `/edit`→`/e`; logged-out `/e/<slug>`→login; non-owner→public.
- [ ] **Step 4: Gates** — `pnpm typecheck`, `pnpm lint`, `apps/frontend` build all green.
- [ ] **Step 5:** Report results; confirm no Spec-3 surfaces (shared dialogs, global Formik forms, block-editing chrome restyle) were pulled in.

---

## Notes for the implementer

- **Preserve data flow.** Tab pages are presentation swaps over existing `Sidebar*` logic — keep every SWR key, `InternalApi` call, server action, and the `pageId`-from-SWR-cache pattern. The shell's `LinkyProviders` populates the SWR fallback exactly like today's owner layout.
- **`pageId` in the SWR cache.** Tab components read `useSWRConfig().cache.get('pageId')`. Ensure `LinkyProviders` (reused from the public layout) still sets this in the `/e` shell (it takes `pageId` as a prop today).
- **Catalyst is a SUBPATH export.** Import it as `import * as Catalyst from '@trylinky/ui/catalyst'` and use `Catalyst.Button` etc. Do NOT import Catalyst from the main `@trylinky/ui` barrel — it's deliberately kept off the main barrel so `@trylinky/common`/marketing don't pull in Catalyst (and its `@headlessui/react` dep). All Catalyst files are `'use client'`.
- **Charts stay shadcn** in this spec (not in the Catalyst kit) — Spec 3.
- **Login redirect target** is unverified in code; confirm the real sign-in entry + redirect param before finalizing Task 4/5 (`packages/common/src/auth/login-form.tsx` `redirectTo`, verify page `/i/auth/verify`).
- **Cache + request data**: never call `headers()`/`cookies()` inside a `use cache` function or in a way that forces the public route dynamic. UA-based mobile detection on the public path is the main trap — drop it or move it client-side.
