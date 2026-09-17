# Paywall Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the advertised Free/Premium/Team limits in the API, make the 14-day trial actually end, fix the broken upgrade path, and surface one upgrade dialog in the editor wherever a Free user hits a limit.

**Architecture:** A single `resolveEntitlements` function in the API is the only place that knows what a plan allows. Every mutating route that a plan limits consults it and returns one `402 UPGRADE_REQUIRED` shape. Stripe state is mirrored into the `Subscription` row by an idempotent `syncSubscriptionFromStripe` that all webhook branches call. The frontend reads `GET /billing/entitlements` and shows one `UpgradeDialog`; it never decides entitlement itself.

**Tech Stack:** Hono on Cloudflare Workers (`apps/api`), **Drizzle ORM** via `@trylinky/db` (the API was ported off Prisma on 2026-09-17; the frontend still uses Prisma until Phase 2), Stripe SDK 17 (fetch client), Vitest (DB-backed integration tests with `@/test/fixtures`), Next.js App Router (`apps/frontend`), SWR, PostHog.

**Spec:** `docs/superpowers/specs/2026-09-17-paywall-enforcement-design.md`

## Global Constraints

- Plan ids are exactly `freeLegacy`, `premium`, `team` everywhere (the database value). Never `legacyFree`.
- Free limits: `pages: 1`, `blocksPerPage: 6` (header plus five addable). Paid limits keep the existing abuse caps `pages: 100`, `blocksPerPage: 100`.
- Every gate returns HTTP `402` with body `{ error: { code: 'UPGRADE_REQUIRED', feature, message, label } }` where `feature` is one of `pages | blocks | analytics | privatePages | verification | customDomain`.
- Gates are live only when `process.env.PAYWALL_ENFORCED === 'true'`. When off, entitlements report paid limits and all features true, but `tier` is still real.
- Site admins (`isAdminUser`) resolve to tier `team`.
- Trial subscriptions are created with `trial_settings.end_behavior.missing_payment_method: 'cancel'`.
- **Database access in the API is Drizzle only.** `import db from '@/lib/db'`, tables from `@trylinky/db/schema`, operators from `drizzle-orm`, row types and the `VerificationRequestStatus` value object from `@trylinky/db`. Authorization joins use the EXISTS predicates in `@/lib/db-predicates` (`userIsMemberOfOrg`, `pageOwnedByUser`). No `prisma` import anywhere under `apps/api`.
- **Running API tests.** The env file points at port 5432, which another project's Postgres holds; Linky's dev Postgres is on 5433. Do not edit `.env.local`. Prefix every test command with the override (dotenvx does not overwrite an existing variable):
  ```bash
  DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- <path>
  ```
  Tests share that database serially. Every fixture uses a `randomUUID().slice(0, 8)` suffix and is removed in `afterAll` with `cleanupTestData` from `@/test/fixtures` (plus manual deletes for tables it does not cover: `verificationRequest`, `userFlag`). Global `fetch` throws unless stubbed (see `apps/api/src/vitest.setup.ts`), so any handler that reaches PostHog, Resend, Slack or the frontend revalidate hook must have that module mocked in its test.
- **The API imports `@trylinky/common/billing`, never `@trylinky/common`.** The package root re-exports browser-only modules and breaks the Worker typecheck.
- **Route tests cast JSON bodies.** In `apps/api` the Workers types make `Response.json()` return `unknown`; write `const body = (await response.json()) as Record<string, any>;` (or an explicit shape) before reading fields, as `forms/routes.test.ts` does. Run `pnpm --filter api typecheck` before every API commit.
- Frontend has no test runner. Verification for frontend tasks is `pnpm --filter frontend typecheck` and `pnpm --filter frontend lint`, plus the manual checklist in the final task. Frontend model types still come from `@trylinky/prisma` (matching the existing files) until Phase 2.
- **Commits:** short, lowercase, `scope: what changed` (match the log: `api: …`, `billing: …`, `common: …`, `frontend: …`). **No `Co-Authored-By` trailer, no attribution footer.** `git add` explicit code paths only; never `-A`. **Never commit `docs/superpowers/**` or any other AI artifact.** Do not push.
- Work on a branch: `git checkout -b feat/paywall-enforcement` before Task 1.
- Prettier is enforced in CI: run `pnpm prettier --write <changed files>` before each commit.

## File map

| File | Responsibility |
|---|---|
| `apps/api/src/env.ts` | Add optional `TEST_SESSION` binding for tests |
| `apps/api/src/middleware/authenticate.ts` | Honour `TEST_SESSION` under Vitest only |
| `apps/api/src/test/env.ts` | Shared test env factory (`testEnv`) |
| `packages/common/src/billing/plans.ts` | Canonical `Plan`, `Tier`, `Entitlements`, `PaywallFeature` types |
| `apps/frontend/lib/plans.ts` | Fix plan id |
| `apps/api/src/modules/billing/entitlements.ts` | `resolveTier`, `resolveEntitlements`, `getEntitlementsForOrganization` |
| `apps/api/src/modules/billing/handlers/entitlements.ts` | `GET /billing/entitlements` |
| `apps/api/src/lib/upgrade-required.ts` | `upgradeRequired(c, feature)` 402 helper + `paywall-hit` event |
| `apps/api/src/modules/pages/index.ts` | Page-count gate |
| `apps/api/src/modules/blocks/index.ts` | Block-count gate |
| `apps/api/src/modules/analytics/handlers/analytics-for-page.ts` | Analytics gate |
| `apps/api/src/modules/pages/handlers/update-page-settings.ts` | New `POST /pages/:pageId/settings` with private-pages gate |
| `apps/api/src/modules/pages/service.ts` | `updatePageSettings` |
| `apps/api/src/modules/verification/` | New module: `POST /verification-requests` with gate |
| `apps/api/src/modules/billing/utils/create-new-subscription.ts` | Trial end behaviour |
| `apps/api/src/modules/billing/utils/sync-subscription.ts` | `syncSubscriptionFromStripe`, `applyDowngradeSideEffects`, `isUnconvertedTrial` |
| `apps/api/src/modules/billing/handlers/stripe/*` | Wire sync; remove `handle-trial-expired` |
| `apps/api/src/modules/billing/handlers/upgrade-to-premium.ts` | Stripe Checkout |
| `apps/api/src/modules/flags/handlers/hide-free-downgrade-notice.ts` | Dismiss post-downgrade dialog |
| `apps/api/scripts/backfill-trial-end-behaviour.ts` | One-off Stripe backfill |
| `packages/common/src/api/internal-api.ts` | Parse error bodies on non-2xx; 402 listener |
| `apps/frontend/lib/hooks/use-entitlements.ts` | `useEntitlements()` |
| `apps/frontend/app/components/UpgradeDialog.tsx` | Dialog + provider + `useUpgradeDialog()` |
| `apps/frontend/app/components/TrialBanner.tsx` | Trial-ending banner |
| `apps/frontend/app/components/FreeDowngradeDialog.tsx` | One-time post-downgrade dialog |
| `apps/frontend/app/components/{DraggableBlockButton,PageSwitcher,SidebarAnalytics,VerificationRequestDialog}.tsx`, `EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx` | UX gates |
| `packages/notifications/emails/{trial-ending-soon,trial-finished}.tsx` | Copy |
| `.env.example`, `apps/api/.dev.vars.example`, `apps/api/wrangler.jsonc`, `docs/self-hosting.md` | `PAYWALL_ENFORCED` |

---

### Task 1: Test session hook for session-protected routes

Today no API test can reach a `requireSession` route: `resolveSession` calls better-auth with the request cookies. This adds a Vitest-only bypass so later tasks can test gates end to end.

**Files:**
- Modify: `apps/api/src/env.ts`
- Modify: `apps/api/src/middleware/authenticate.ts`
- Create: `apps/api/src/test/env.ts`
- Test: `apps/api/src/middleware/authenticate.test.ts`

**Interfaces:**
- Produces: `testEnv(session?: AuthenticatedSession)` returning the third argument for `app.request(path, init, env)`.

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/middleware/authenticate.test.ts
import { createApp } from '@/app';
import { testEnv } from '@/test/env';
import { describe, expect, it } from 'vitest';

describe('TEST_SESSION binding', () => {
  it('authenticates a session-protected route when set', async () => {
    const response = await createApp().request(
      '/pages/me',
      {},
      testEnv({ user: { id: 'user-test' }, activeOrganizationId: 'org-test' })
    );

    // /pages/me returns [] for an org with no pages; a 401 means the
    // session was not honoured.
    expect(response.status).toBe(200);
  });

  it('leaves a session-protected route unauthenticated when unset', async () => {
    const response = await createApp().request('/pages/me', {}, testEnv());

    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/middleware/authenticate.test.ts`
Expected: FAIL, `Cannot find module '@/test/env'`.

- [ ] **Step 3: Add the binding, the bypass, and the helper**

`apps/api/src/env.ts`: add this member to the `Env` interface, after `AUTH_STRICT_RATE_LIMIT`:

```ts
  /**
   * Vitest only. When set, resolveSession uses it instead of better-auth so
   * route tests can exercise session-protected handlers. Ignored unless the
   * process is running under Vitest — never define it in wrangler.jsonc.
   */
  TEST_SESSION?: AuthenticatedSession;
```

`apps/api/src/middleware/authenticate.ts`, at the top of `resolveSession` before the `try`:

```ts
  // Vitest-only bypass. `process.env.VITEST` is set by the Vitest runner and
  // by nothing else; wrangler never defines TEST_SESSION, so this branch is
  // dead in every deployed environment.
  if (process.env.VITEST === 'true' && c.env.TEST_SESSION) {
    c.set('session', c.env.TEST_SESSION);
    await next();
    return;
  }
```

`apps/api/src/test/env.ts`:

```ts
import type { createApp } from '@/app';
import type { AuthenticatedSession } from '@/middleware/authenticate';

type RequestEnv = Parameters<ReturnType<typeof createApp>['request']>[2];

/**
 * The env every route test passes to `app.request`. Mirrors the shape used
 * ad hoc in forms/routes.test.ts; the optional session flows through the
 * Vitest-only TEST_SESSION bypass in middleware/authenticate.ts.
 */
export function testEnv(session?: AuthenticatedSession): RequestEnv {
  return {
    HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
    AUTH_RATE_LIMIT: { limit: async () => ({ success: true }) },
    AUTH_STRICT_RATE_LIMIT: { limit: async () => ({ success: true }) },
    ...(session ? { TEST_SESSION: session } : {}),
  } as unknown as RequestEnv;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/middleware/authenticate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck and commit**

```bash
pnpm --filter api typecheck
pnpm prettier --write apps/api/src/env.ts apps/api/src/middleware/authenticate.ts apps/api/src/test/env.ts apps/api/src/middleware/authenticate.test.ts
git add apps/api/src/env.ts apps/api/src/middleware/authenticate.ts apps/api/src/test/env.ts apps/api/src/middleware/authenticate.test.ts
git commit -m "api: add a vitest-only test session binding"
```

---

### Task 2: Canonical plan ids and shared entitlement types

**Files:**
- Modify: `packages/common/src/billing/plans.ts`
- Modify: `apps/frontend/lib/plans.ts`
- Modify: `packages/common/src/index.ts`

**Interfaces:**
- Produces: `Plan`, `Tier`, `PaywallFeature`, `Entitlements`, `UPGRADE_REQUIRED`, `UpgradeRequiredError` from `@trylinky/common`.

- [ ] **Step 1: Replace `packages/common/src/billing/plans.ts`**

```ts
/** The value stored in Subscription.plan. `freeLegacy` is the database spelling. */
export type Plan = 'freeLegacy' | 'premium' | 'team';

export const plansToNames: Record<Plan, string> = {
  freeLegacy: 'Free',
  premium: 'Premium',
  team: 'Team',
};

/** What an organisation is entitled to, resolved from plan + status. */
export type Tier = 'free' | 'premium' | 'team';

export type PaywallFeature =
  | 'pages'
  | 'blocks'
  | 'analytics'
  | 'privatePages'
  | 'verification'
  | 'customDomain';

export interface Entitlements {
  tier: Tier;
  limits: { pages: number; blocksPerPage: number };
  features: {
    analytics: boolean;
    privatePages: boolean;
    customDomain: boolean;
    verification: boolean;
  };
  trial: { active: boolean; daysLeft: number | null };
}

export const UPGRADE_REQUIRED = 'UPGRADE_REQUIRED' as const;

export interface UpgradeRequiredError {
  code: typeof UPGRADE_REQUIRED;
  feature: PaywallFeature;
  message: string;
  label: string;
}
```

- [ ] **Step 2: Export it from the package index and as its own entry point**

Append to `packages/common/src/index.ts`:

```ts
export * from './billing/plans';
```

The API worker must never import the package root: `packages/common/src/index.ts` re-exports browser-only modules (`login-form.tsx`, `pricing-table.tsx`, the DOM `fetch` wrappers), and pulling them into the Worker's typecheck fails on `window`. Add a billing-only entry point next to the existing `./slugs` one in `packages/common/package.json` `exports`:

```json
    "./billing": {
      "types": "./src/billing/plans.ts",
      "default": "./src/billing/plans.ts"
    }
```

API code imports `@trylinky/common/billing`; frontend code may import either.

- [ ] **Step 3: Fix `apps/frontend/lib/plans.ts`**

```ts
import { plansToNames } from '@trylinky/common';

export { plansToNames };

export const getNextPlan = (planId?: string | null) => {
  if (!planId) {
    return null;
  }

  switch (planId) {
    case 'freeLegacy':
      return 'premium';
    case 'premium':
      return 'team';
    case 'team':
      return null;
    default:
      return null;
  }
};
```

- [ ] **Step 4: Verify**

Run: `pnpm typecheck`
Expected: passes. Then `command grep -rn "legacyFree" apps packages --include='*.ts' --include='*.tsx' | grep -v node_modules` prints nothing.

- [ ] **Step 5: Commit**

```bash
pnpm prettier --write packages/common/src/billing/plans.ts packages/common/src/index.ts apps/frontend/lib/plans.ts
git add packages/common/src/billing/plans.ts packages/common/src/index.ts apps/frontend/lib/plans.ts
git commit -m "common: standardise the free plan id and share entitlement types"
```

---

### Task 3: Entitlements resolver and `GET /billing/entitlements`

**Files:**
- Create: `apps/api/src/modules/billing/entitlements.ts`
- Create: `apps/api/src/modules/billing/handlers/entitlements.ts`
- Modify: `apps/api/src/modules/billing/index.ts`
- Test: `apps/api/src/modules/billing/entitlements.test.ts`
- Test: `apps/api/src/modules/billing/handlers/entitlements.test.ts`

**Interfaces:**
- Produces:
  - `resolveTier(sub: SubscriptionLike | null | undefined, opts?: { isAdmin?: boolean }): Tier`
  - `resolveEntitlements(sub, opts?: { isAdmin?: boolean; enforced?: boolean; now?: Date }): Entitlements`
  - `getEntitlementsForOrganization(organizationId: string, userId?: string): Promise<Entitlements>`
  - `isPaywallEnforced(): boolean`
  - `FREE_LIMITS`, `PAID_LIMITS`, `type SubscriptionLike = { plan: string; status: string; trialEnd: Date | null }`

- [ ] **Step 1: Write the failing unit tests**

```ts
// apps/api/src/modules/billing/entitlements.test.ts
import {
  FREE_LIMITS,
  PAID_LIMITS,
  resolveEntitlements,
  resolveTier,
} from './entitlements';
import { describe, expect, it } from 'vitest';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-17T12:00:00Z');

const sub = (
  over: Partial<{ plan: string; status: string; trialEnd: Date | null }>
) => ({
  plan: 'premium',
  status: 'active',
  trialEnd: null,
  ...over,
});

describe('resolveTier', () => {
  it.each([
    [null, 'free'],
    [sub({ plan: 'freeLegacy', status: 'active' }), 'free'],
    [sub({ plan: 'premium', status: 'active' }), 'premium'],
    [sub({ plan: 'premium', status: 'trialing' }), 'premium'],
    [sub({ plan: 'premium', status: 'past_due' }), 'premium'],
    [sub({ plan: 'team', status: 'active' }), 'team'],
    [sub({ plan: 'premium', status: 'canceled' }), 'free'],
    [sub({ plan: 'premium', status: 'unpaid' }), 'free'],
    [sub({ plan: 'premium', status: 'incomplete' }), 'free'],
    [sub({ plan: 'premium', status: 'incomplete_expired' }), 'free'],
    [sub({ plan: 'team', status: 'canceled' }), 'free'],
  ])('%o resolves to %s', (input, expected) => {
    expect(resolveTier(input)).toBe(expected);
  });

  it('treats site admins as team regardless of subscription', () => {
    expect(resolveTier(null, { isAdmin: true })).toBe('team');
    expect(
      resolveTier(sub({ plan: 'premium', status: 'canceled' }), {
        isAdmin: true,
      })
    ).toBe('team');
  });
});

describe('resolveEntitlements', () => {
  it('gives free the free limits and no features when enforced', () => {
    const e = resolveEntitlements(null, { enforced: true, now });

    expect(e.tier).toBe('free');
    expect(e.limits).toEqual(FREE_LIMITS);
    expect(e.features).toEqual({
      analytics: false,
      privatePages: false,
      customDomain: false,
      verification: false,
    });
    expect(e.trial).toEqual({ active: false, daysLeft: null });
  });

  it('gives premium the paid limits and every feature', () => {
    const e = resolveEntitlements(sub({}), { enforced: true, now });

    expect(e.tier).toBe('premium');
    expect(e.limits).toEqual(PAID_LIMITS);
    expect(Object.values(e.features).every(Boolean)).toBe(true);
  });

  it('reports the real tier but paid limits and features when not enforced', () => {
    const e = resolveEntitlements(null, { enforced: false, now });

    expect(e.tier).toBe('free');
    expect(e.limits).toEqual(PAID_LIMITS);
    expect(Object.values(e.features).every(Boolean)).toBe(true);
  });

  it('reports trial days left, rounded up', () => {
    const e = resolveEntitlements(
      sub({ status: 'trialing', trialEnd: new Date(now.getTime() + 2.2 * day) }),
      { enforced: true, now }
    );

    expect(e.trial).toEqual({ active: true, daysLeft: 3 });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/entitlements.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the resolver**

```ts
// apps/api/src/modules/billing/entitlements.ts
import db from '@/lib/db';
import { isAdminUser } from '@/lib/roles';
import type { Entitlements, Tier } from '@trylinky/common/billing';

export type SubscriptionLike = {
  plan: string;
  status: string;
  trialEnd: Date | null;
};

// Free is marketed as "5 blocks". Every page starts with one header block,
// so the enforced per-page limit is 6: the header plus five the user adds.
export const FREE_LIMITS = { pages: 1, blocksPerPage: 6 } as const;
// The pre-existing abuse caps, unchanged.
export const PAID_LIMITS = { pages: 100, blocksPerPage: 100 } as const;

const PAID_PLANS = new Set(['premium', 'team']);
// `past_due` keeps access: once trials cancel themselves at trial end (see
// create-new-subscription.ts), only a previously paying customer with a
// failed card can be past_due, and Stripe is still retrying for them.
const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isPaywallEnforced(): boolean {
  return process.env.PAYWALL_ENFORCED === 'true';
}

export function resolveTier(
  sub: SubscriptionLike | null | undefined,
  opts: { isAdmin?: boolean } = {}
): Tier {
  if (opts.isAdmin) {
    return 'team';
  }

  if (!sub || !PAID_PLANS.has(sub.plan)) {
    return 'free';
  }

  if (!ENTITLED_STATUSES.has(sub.status)) {
    return 'free';
  }

  return sub.plan as Tier;
}

export function resolveEntitlements(
  sub: SubscriptionLike | null | undefined,
  opts: { isAdmin?: boolean; enforced?: boolean; now?: Date } = {}
): Entitlements {
  const enforced = opts.enforced ?? isPaywallEnforced();
  const now = opts.now ?? new Date();
  const tier = resolveTier(sub, { isAdmin: opts.isAdmin });
  const paid = tier !== 'free' || !enforced;

  const trialActive = sub?.status === 'trialing' && sub.trialEnd != null;
  const daysLeft = trialActive
    ? Math.max(
        0,
        Math.ceil((sub!.trialEnd!.getTime() - now.getTime()) / 86_400_000)
      )
    : null;

  return {
    tier,
    limits: paid ? { ...PAID_LIMITS } : { ...FREE_LIMITS },
    features: {
      analytics: paid,
      privatePages: paid,
      customDomain: paid,
      verification: paid,
    },
    trial: { active: trialActive, daysLeft },
  };
}

/**
 * The one loader every gate uses. `userId` is optional so server-to-server
 * callers (page load) can resolve without a session; when given, site
 * admins are exempt from every limit.
 */
export async function getEntitlementsForOrganization(
  organizationId: string,
  userId?: string
): Promise<Entitlements> {
  const [sub, dbUser] = await Promise.all([
    db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.referenceId, organizationId),
      columns: { plan: true, status: true, trialEnd: true },
    }),
    userId
      ? db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
          columns: { role: true },
        })
      : Promise.resolve(null),
  ]);

  return resolveEntitlements(sub ?? null, { isAdmin: isAdminUser(dbUser) });
}
```

- [ ] **Step 4: Run unit tests**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/entitlements.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing route test**

```ts
// apps/api/src/modules/billing/handlers/entitlements.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const suffix = randomUUID().slice(0, 8);

let organizationId: string;
let userId: string;
let subscriptionId: string;

beforeAll(async () => {
  userId = (await createTestUser(`ent-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `ent-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'trialing',
      referenceId: organizationId,
      stripeCustomerId: `cus_ent_${suffix}`,
      trialEnd: new Date(Date.now() + 5 * 86_400_000),
    })
    .returning();
  subscriptionId = sub.id;
});

afterAll(async () => {
  await cleanupTestData({
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /billing/entitlements', () => {
  it('returns 401 without a session', async () => {
    const response = await createApp().request(
      '/billing/entitlements',
      {},
      testEnv()
    );

    expect(response.status).toBe(401);
  });

  it('returns the active org entitlements with trial info', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await createApp().request(
      '/billing/entitlements',
      {},
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, any>;
    expect(body.tier).toBe('premium');
    expect(body.trial.active).toBe(true);
    expect(body.trial.daysLeft).toBe(5);
    expect(body.limits.blocksPerPage).toBe(100);
  });
});
```

- [ ] **Step 6: Implement the handler and mount it**

```ts
// apps/api/src/modules/billing/handlers/entitlements.ts
import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import type { Context } from 'hono';

export async function getEntitlementsHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const entitlements = await getEntitlementsForOrganization(
    session.activeOrganizationId,
    session.user.id
  );

  return c.json(entitlements, 200);
}
```

In `apps/api/src/modules/billing/index.ts` add the import and, directly under the `/subscription/me` line:

```ts
import { getEntitlementsHandler } from '@/modules/billing/handlers/entitlements';
// ...
billingRoutes.get('/entitlements', getEntitlementsHandler);
```

- [ ] **Step 7: Run both test files**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/entitlements.test.ts src/modules/billing/handlers/entitlements.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
pnpm prettier --write apps/api/src/modules/billing
git add apps/api/src/modules/billing/entitlements.ts apps/api/src/modules/billing/entitlements.test.ts apps/api/src/modules/billing/handlers/entitlements.ts apps/api/src/modules/billing/handlers/entitlements.test.ts apps/api/src/modules/billing/index.ts
git commit -m "billing: add the entitlements resolver and endpoint"
```

---

### Task 4: Page load and current subscription use the resolver

Two places still decide "is paid" on their own and disagree for `past_due`. Both now defer to `resolveTier`.

**Files:**
- Modify: `apps/api/src/modules/pages/handlers/get-page-load.ts`
- Modify: `apps/api/src/modules/billing/handlers/current-user-subscription.ts`
- Test: `apps/api/src/modules/pages/handlers/get-page-load.test.ts`

**Interfaces:**
- Consumes: `resolveTier` from Task 3.
- Produces: `GET /billing/subscription/me` gains a `tier: Tier` field on every branch. `isPaid` on the internal page-load response is now `resolveTier(...) !== 'free'` (real tier, never affected by `PAYWALL_ENFORCED`, because it feeds SEO indexing only).

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/pages/handlers/get-page-load.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const suffix = randomUUID().slice(0, 8);
const API_KEY = `internal-${suffix}`;
let organizationId: string;
let pageId: string;
let subscriptionId: string;

beforeAll(async () => {
  organizationId = (await createTestOrganization({ suffix: `pl-${suffix}` })).id;
  pageId = (await createTestPage({ organizationId, suffix: `pl-${suffix}` })).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'past_due',
      referenceId: organizationId,
      stripeCustomerId: `cus_pl_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const load = () =>
  createApp().request(
    `/pages/${pageId}/internal/load`,
    { headers: { 'x-api-key': API_KEY } },
    testEnv()
  );

describe('GET /pages/:pageId/internal/load isPaid', () => {
  it('is true for a past_due premium subscription (Stripe still retrying)', async () => {
    vi.stubEnv('INTERNAL_API_KEY', API_KEY);

    const body = (await (await load()).json()) as Record<string, any>;

    expect(body.isPaid).toBe(true);
  });

  it('is false once the subscription is canceled, even if plan still reads premium', async () => {
    vi.stubEnv('INTERNAL_API_KEY', API_KEY);
    await db
      .update(subscription)
      .set({ status: 'canceled' })
      .where(eq(subscription.id, subscriptionId));

    const body = (await (await load()).json()) as Record<string, any>;

    expect(body.isPaid).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages/handlers/get-page-load.test.ts`
Expected: the second test FAILS (`isPaid` is true because only `plan` is checked).

- [ ] **Step 3: Page load uses the resolver**

In `get-page-load.ts`, change the `organization` relation in the `with` block to:

```ts
      organization: {
        columns: { id: true },
        with: {
          subscription: { columns: { plan: true, status: true, trialEnd: true } },
        },
      },
```

and replace the two lines computing `plan` / `isPaid` with:

```ts
  const isPaid = resolveTier(row.organization?.subscription ?? null) !== 'free';
```

with `import { resolveTier } from '@/modules/billing/entitlements';`.

- [ ] **Step 4: Current subscription reports `tier`**

In `current-user-subscription.ts`, add `import { resolveTier } from '@/modules/billing/entitlements';` and, immediately after `const session = requireSession(c);`:

```ts
  // The lookup below filters to active/trialing for its team-association
  // logic, so a past_due or canceled row is invisible to it. Resolve the
  // tier from the raw row so the frontend and the API gates agree.
  const activeOrgSubscription = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
    columns: { plan: true, status: true, trialEnd: true },
  });
  const tier = resolveTier(activeOrgSubscription ?? null);
```

Then add `tier,` as the first property of every object passed to `c.json(...)` in the handler (five sites).

- [ ] **Step 5: Run, typecheck, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages/handlers/get-page-load.test.ts src/modules/billing && pnpm --filter api typecheck`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/pages/handlers/get-page-load.ts apps/api/src/modules/pages/handlers/get-page-load.test.ts apps/api/src/modules/billing/handlers/current-user-subscription.ts
git add apps/api/src/modules/pages/handlers/get-page-load.ts apps/api/src/modules/pages/handlers/get-page-load.test.ts apps/api/src/modules/billing/handlers/current-user-subscription.ts
git commit -m "billing: resolve isPaid and the reported tier through the resolver"
```

---

### Task 5: The `upgradeRequired` 402 helper

**Files:**
- Create: `apps/api/src/lib/upgrade-required.ts`
- Test: `apps/api/src/lib/upgrade-required.test.ts`

**Interfaces:**
- Produces: `upgradeRequired(c: Context<AppBindings>, feature: PaywallFeature, opts?: { organizationId?: string; userId?: string; tier?: Tier })` returning a `Response` with status 402.

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/lib/upgrade-required.test.ts
import { upgradeRequired } from './upgrade-required';
import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

describe('upgradeRequired', () => {
  it('returns the shared 402 shape for a feature', async () => {
    const app = new Hono();
    app.get('/x', (c) => upgradeRequired(c as never, 'blocks'));

    const response = await app.request('/x');

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: 'UPGRADE_REQUIRED',
        feature: 'blocks',
        message: "You've used your 5 free blocks",
        label: 'Upgrade to Premium to add more blocks',
      },
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/lib/upgrade-required.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// apps/api/src/lib/upgrade-required.ts
import type { AppBindings } from '@/env';
import { createPosthogClient } from '@/lib/posthog';
import {
  UPGRADE_REQUIRED,
  type PaywallFeature,
  type Tier,
  type UpgradeRequiredError,
} from '@trylinky/common/billing';
import type { Context } from 'hono';

const COPY: Record<PaywallFeature, { message: string; label: string }> = {
  pages: {
    message: 'Free includes one page',
    label: 'Upgrade to Premium for unlimited pages',
  },
  blocks: {
    message: "You've used your 5 free blocks",
    label: 'Upgrade to Premium to add more blocks',
  },
  analytics: {
    message: "See who's visiting",
    label: 'Upgrade to Premium to unlock analytics',
  },
  privatePages: {
    message: 'Keep pages private with Premium',
    label: 'Upgrade to Premium to unpublish pages',
  },
  verification: {
    message: 'Get verified',
    label: 'Upgrade to Premium to request a verified badge',
  },
  customDomain: {
    message: 'Use your own domain',
    label: 'Upgrade to Premium to connect a custom domain',
  },
};

/**
 * The single 402 every plan gate returns. The frontend's InternalApi client
 * routes this code to the UpgradeDialog, so handlers never need bespoke UI.
 */
export function upgradeRequired(
  c: Context<AppBindings>,
  feature: PaywallFeature,
  opts: { organizationId?: string; userId?: string; tier?: Tier } = {}
) {
  const error: UpgradeRequiredError = {
    code: UPGRADE_REQUIRED,
    feature,
    ...COPY[feature],
  };

  if (opts.userId) {
    const posthog = createPosthogClient();
    posthog?.capture({
      distinctId: opts.userId,
      event: 'paywall-hit',
      properties: {
        feature,
        tier: opts.tier ?? 'free',
        organizationId: opts.organizationId,
      },
    });
    if (posthog) {
      // `c.executionCtx` throws outside a Workers runtime (app.request in
      // tests); fall back to a plain fire-and-forget flush there.
      try {
        c.executionCtx.waitUntil(posthog.shutdown());
      } catch {
        void posthog.shutdown();
      }
    }
  }

  return c.json({ error }, 402);
}
```

- [ ] **Step 4: Run to verify pass, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/lib/upgrade-required.test.ts`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/lib/upgrade-required.ts apps/api/src/lib/upgrade-required.test.ts
git add apps/api/src/lib/upgrade-required.ts apps/api/src/lib/upgrade-required.test.ts
git commit -m "api: add the shared upgrade-required 402 helper"
```

---

### Task 6: Page-count and block-count gates

**Files:**
- Modify: `apps/api/src/modules/pages/index.ts` (the `createPageHandlers` block)
- Modify: `apps/api/src/modules/blocks/index.ts` (the `postCreateBlockHandlers` block)
- Test: `apps/api/src/modules/pages/limits.test.ts`

**Interfaces:**
- Consumes: `getEntitlementsForOrganization`, `upgradeRequired`.

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/pages/limits.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));
vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (slug: string, domain: string) => `page-slug-${slug}-${domain}`,
}));

const suffix = randomUUID().slice(0, 8);

let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;
let pageSlug: string;

beforeAll(async () => {
  userId = (await createTestUser(`lim-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `lim-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_lim_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;

  const testPage = await createTestPage({ organizationId, suffix: `lim-${suffix}` });
  pageId = testPage.id;
  pageSlug = testPage.slug;
  for (let i = 0; i < 6; i += 1) {
    await createTestBlock({ pageId, type: 'content' });
  }
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const session = () => ({ user: { id: userId }, activeOrganizationId: organizationId });

const addBlock = () =>
  createApp().request(
    '/blocks/add',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ block: { id: randomUUID(), type: 'content' }, pageSlug }),
    },
    testEnv(session())
  );

describe('free plan limits', () => {
  it('refuses a second page with 402 UPGRADE_REQUIRED', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await createApp().request(
      '/pages',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // The gate fires before any insert, so the theme id never has to exist.
        body: JSON.stringify({ slug: `lim-second-${suffix}`, themeId: 'unused' }),
      },
      testEnv(session())
    );

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.code).toBe('UPGRADE_REQUIRED');
    expect(body.error.feature).toBe('pages');
  });

  it('refuses a seventh block with 402 UPGRADE_REQUIRED', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await addBlock();

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('blocks');
  });

  it('allows the same block add when the paywall is not enforced', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'false');

    const response = await addBlock();

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages/limits.test.ts`
Expected: the two 402 cases FAIL (receive 200), the third passes.

- [ ] **Step 3: Gate page creation**

In `apps/api/src/modules/pages/index.ts`, add imports:

```ts
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { upgradeRequired } from '@/lib/upgrade-required';
```

Replace the block from `const maxNumberOfPages = 100;` through the closing `}` of `if (teamPageCount >= maxNumberOfPages) { ... }` (which includes the `db.query.user.findFirst` admin lookup) with:

```ts
    const entitlements = await getEntitlementsForOrganization(
      session.activeOrganizationId,
      session.user.id
    );

    if (teamPageCount >= entitlements.limits.pages) {
      return upgradeRequired(c, 'pages', {
        organizationId: session.activeOrganizationId,
        userId: session.user.id,
        tier: entitlements.tier,
      });
    }
```

Remove the now-unused `isAdminUser` import if nothing else in the file uses it (admins are exempt through the resolver).

- [ ] **Step 4: Gate block creation**

In `apps/api/src/modules/blocks/index.ts`, add the same two imports, and replace:

```ts
    const maxNumberOfBlocks = 100;
    if (target.blocks.length >= maxNumberOfBlocks) {
      return c.json(
        {
          error: {
            message: 'You have reached the maximum number of blocks per page',
          },
        },
        400
      );
    }
```

with:

```ts
    const entitlements = await getEntitlementsForOrganization(
      session.activeOrganizationId,
      session.user.id
    );

    if (target.blocks.length >= entitlements.limits.blocksPerPage) {
      return upgradeRequired(c, 'blocks', {
        organizationId: session.activeOrganizationId,
        userId: session.user.id,
        tier: entitlements.tier,
      });
    }
```

- [ ] **Step 5: Run tests, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages src/modules/blocks`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/pages/index.ts apps/api/src/modules/blocks/index.ts apps/api/src/modules/pages/limits.test.ts
git add apps/api/src/modules/pages/index.ts apps/api/src/modules/blocks/index.ts apps/api/src/modules/pages/limits.test.ts
git commit -m "api: gate page and block counts on plan entitlements"
```

---

### Task 7: Analytics gate

**Files:**
- Modify: `apps/api/src/modules/analytics/handlers/analytics-for-page.ts`
- Test: `apps/api/src/modules/analytics/handlers/analytics-for-page.test.ts`

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/analytics/handlers/analytics-for-page.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { page, subscription } from '@trylinky/db/schema';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;

beforeAll(async () => {
  userId = (await createTestUser(`an-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `an-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_an_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  const [row] = await db
    .insert(page)
    .values({
      slug: `an-page-${suffix}`,
      config: [],
      publishedAt: new Date(),
      organizationId,
      // Older than the 3-day minimum so only the plan gate can block it.
      createdAt: new Date(Date.now() - 10 * 86_400_000),
    })
    .returning();
  pageId = row.id;
});

afterAll(async () => {
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

describe('GET /analytics/pages/:pageId', () => {
  it('returns 402 for a free org before any Tinybird call', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    // The global fetch tripwire would throw if the handler reached Tinybird.
    const response = await createApp().request(
      `/analytics/pages/${pageId}`,
      {},
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('analytics');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/analytics/handlers/analytics-for-page.test.ts`
Expected: FAIL (the fetch tripwire throws, or status is 400/200).

- [ ] **Step 3: Add the gate**

In `analytics-for-page.ts`, add imports:

```ts
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { upgradeRequired } from '@/lib/upgrade-required';
```

The gate must resolve entitlements for the page's **owning** organisation, not `session.activeOrganizationId`: `checkUserHasAccessToPage` only proves membership of the page's org, so a user in two orgs could set a paid org active and read a free org's analytics. Move the existing `db.query.page.findFirst` (selecting `createdAt`) to directly after the `userHasAccess` 403 check, add `organizationId: true` to its `columns`, keep its 404, then insert:

```ts
  if (!row.organizationId) {
    return c.json({}, 404);
  }

  const entitlements = await getEntitlementsForOrganization(
    row.organizationId,
    session.user.id
  );

  if (!entitlements.features.analytics) {
    return upgradeRequired(c, 'analytics', {
      organizationId: row.organizationId,
      userId: session.user.id,
      tier: entitlements.tier,
    });
  }
```

The 3-day age check stays after the gate. Add a second test: the same user with a second, premium org set as `activeOrganizationId` still gets 402 for the free org's page.

- [ ] **Step 4: Run, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/analytics`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/analytics
git add apps/api/src/modules/analytics/handlers/analytics-for-page.ts apps/api/src/modules/analytics/handlers/analytics-for-page.test.ts
git commit -m "api: gate page analytics on the analytics entitlement"
```

---

### Task 8: Page settings route with the private-pages gate

Moves the frontend's direct-Prisma `updateGeneralPageSettings` server action behind the API (also a Phase 2 item of the Drizzle migration).

**Files:**
- Modify: `apps/api/src/modules/pages/service.ts` (add `updatePageSettings`)
- Create: `apps/api/src/modules/pages/handlers/update-page-settings.ts`
- Modify: `apps/api/src/modules/pages/index.ts` (mount)
- Modify: `apps/frontend/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx`
- Modify: `apps/frontend/app/components/EditPageSettingsDialog/actions.ts` (delete `updateGeneralPageSettings`)
- Test: `apps/api/src/modules/pages/handlers/update-page-settings.test.ts`

**Interfaces:**
- Produces: `POST /pages/:pageId/settings` body `{ pageSlug: string; metaTitle: string; published: boolean }` → `200 { slug }` | `400 { error: { message, field? } }` | `402 UPGRADE_REQUIRED`.

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/pages/handlers/update-page-settings.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));
vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (slug: string, domain: string) => `page-slug-${slug}-${domain}`,
}));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;
let slug: string;
const pageIds: string[] = [];

beforeAll(async () => {
  userId = (await createTestUser(`ps-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `ps-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_ps_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  const testPage = await createTestPage({ organizationId, suffix: `ps-${suffix}` });
  pageId = testPage.id;
  slug = testPage.slug;
  pageIds.push(pageId);
});

afterAll(async () => {
  await cleanupTestData({
    pageIds,
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const post = (body: unknown) =>
  createApp().request(
    `/pages/${pageId}/settings`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

const currentPage = () =>
  db.query.page.findFirst({ where: (p, { eq }) => eq(p.id, pageId) });

describe('POST /pages/:pageId/settings', () => {
  it('updates the title and keeps the page published', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post({ pageSlug: slug, metaTitle: 'New title', published: true });

    expect(response.status).toBe(200);
    const row = await currentPage();
    expect(row?.metaTitle).toBe('New title');
    expect(row?.publishedAt).not.toBeNull();
  });

  it('refuses to unpublish on the free tier', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post({ pageSlug: slug, metaTitle: 'New title', published: false });

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('privatePages');
    expect((await currentPage())?.publishedAt).not.toBeNull();
  });

  it('rejects a slug already in use with a field error', async () => {
    const other = await createTestPage({ organizationId, suffix: `ps-other-${suffix}` });
    pageIds.push(other.id);

    const response = await post({ pageSlug: other.slug, metaTitle: 'x', published: true });

    expect(response.status).toBe(400);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.field).toBe('pageSlug');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages/handlers/update-page-settings.test.ts`
Expected: FAIL with 404 (route does not exist).

- [ ] **Step 3: Service function**

Append to `apps/api/src/modules/pages/service.ts` (its imports already include `db`, `page`, `eq`, `regexSlug`, `isForbiddenSlug`, `isReservedSlug`):

```ts
export async function updatePageSettings({
  pageId,
  organizationId,
  pageSlug,
  metaTitle,
  published,
}: {
  pageId: string;
  organizationId: string;
  pageSlug: string;
  metaTitle: string;
  published: boolean;
}): Promise<
  | { slug: string; previousSlug: string }
  | { error: { message: string; field?: 'pageSlug' | 'metaTitle' } }
> {
  const current = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt), eq(p.organizationId, organizationId)),
    columns: { id: true, slug: true },
  });

  if (!current) {
    return { error: { message: 'Page not found' } };
  }

  if (!metaTitle) {
    return { error: { message: 'Please provide a page title', field: 'metaTitle' } };
  }

  if (current.slug !== pageSlug) {
    if (!pageSlug.match(regexSlug)) {
      return { error: { message: 'Slug is invalid', field: 'pageSlug' } };
    }

    if (isForbiddenSlug(pageSlug)) {
      return { error: { message: 'Slug is forbidden', field: 'pageSlug' } };
    }

    if (isReservedSlug(pageSlug)) {
      return {
        error: {
          message: 'Slug is reserved - reach out on twitter to request this',
          field: 'pageSlug',
        },
      };
    }

    const existing = await db.query.page.findFirst({
      where: (p, { and, eq, isNull }) => and(eq(p.slug, pageSlug), isNull(p.deletedAt)),
      columns: { id: true },
    });

    if (existing) {
      return {
        error: { message: 'Page with this slug already exists', field: 'pageSlug' },
      };
    }
  }

  await db
    .update(page)
    .set({
      metaTitle,
      slug: pageSlug,
      publishedAt: published ? new Date() : null,
    })
    .where(eq(page.id, current.id));

  return { slug: pageSlug, previousSlug: current.slug };
}
```

- [ ] **Step 4: Handler**

```ts
// apps/api/src/modules/pages/handlers/update-page-settings.ts
import type { AppBindings } from '@/env';
import {
  pageIdCacheTag,
  pageSlugCacheTag,
  revalidatePageCache,
} from '@/lib/revalidate';
import { upgradeRequired } from '@/lib/upgrade-required';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { updatePageSettings } from '@/modules/pages/service';
import { tbValidator } from '@hono/typebox-validator';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts.
import { Type } from 'typebox';

const bodySchema = Type.Object({
  pageSlug: Type.String(),
  metaTitle: Type.String(),
  published: Type.Boolean(),
});

// Bound to the route's literal path so `c.req.param('pageId')` is `string`.
const factory = createFactory<AppBindings, '/:pageId/settings'>();

export const updatePageSettingsHandlers = factory.createHandlers(
  tbValidator('json', bodySchema),
  async (c) => {
    const session = requireSession(c);
    const pageId = c.req.param('pageId');
    const { pageSlug, metaTitle, published } = c.req.valid('json');

    if (!published) {
      const entitlements = await getEntitlementsForOrganization(
        session.activeOrganizationId,
        session.user.id
      );

      if (!entitlements.features.privatePages) {
        return upgradeRequired(c, 'privatePages', {
          organizationId: session.activeOrganizationId,
          userId: session.user.id,
          tier: entitlements.tier,
        });
      }
    }

    const result = await updatePageSettings({
      pageId,
      organizationId: session.activeOrganizationId,
      pageSlug,
      metaTitle,
      published,
    });

    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    void revalidatePageCache([
      pageIdCacheTag(pageId),
      ...(rootDomain
        ? [
            pageSlugCacheTag(result.previousSlug, rootDomain),
            pageSlugCacheTag(result.slug, rootDomain),
          ]
        : []),
    ]);

    return c.json({ slug: result.slug }, 200);
  }
);
```

Mount in `apps/api/src/modules/pages/index.ts` next to the other `/:pageId/*` routes:

```ts
import { updatePageSettingsHandlers } from '@/modules/pages/handlers/update-page-settings';
// ...
pagesRoutes.post('/:pageId/settings', ...updatePageSettingsHandlers);
```

- [ ] **Step 5: Run API tests**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/pages`
Expected: PASS.

- [ ] **Step 6: Point the frontend form at the API**

In `EditPageSettingsGeneralForm.tsx`, remove `import { updateGeneralPageSettings } from './actions';` and replace the body of `onSubmit`'s `try` with:

```ts
      const response = await InternalApi.post(`/pages/${pageId}/settings`, {
        pageSlug: values.pageSlug,
        metaTitle: values.metaTitle,
        published: values.published,
      });

      if (response?.error) {
        // 402 UPGRADE_REQUIRED is surfaced by the UpgradeDialog provider via
        // InternalApi's listener; only field/validation errors toast here.
        if (response.error.code !== 'UPGRADE_REQUIRED') {
          toast({
            variant: 'error',
            title: 'Something went wrong',
            description: response.error.message,
          });
          if (response.error.field) {
            setFieldError(response.error.field, response.error.message);
          }
        }
        return;
      }

      if (response.slug && response.slug !== params.slug) {
        router.push(`/e/${response.slug}/settings`);
      }

      toast({ title: 'Your page settings have been updated' });
      router.refresh();
```

Delete `updateGeneralPageSettings` from `EditPageSettingsDialog/actions.ts` (keep `fetchPageSettings` and `fetchTeamThemes`). Remove the now-unused `GeneralPageSettingsFormValues`, `generalPageSettingsSchema`, `isForbiddenSlug`, `isReservedSlug` and `revalidateTag` imports there if nothing else in the file uses them.

- [ ] **Step 7: Typecheck, commit**

Run: `pnpm --filter frontend typecheck && pnpm --filter frontend lint`
Expected: pass.

```bash
pnpm prettier --write apps/api/src/modules/pages apps/frontend/app/components/EditPageSettingsDialog
git add apps/api/src/modules/pages/service.ts apps/api/src/modules/pages/index.ts apps/api/src/modules/pages/handlers/update-page-settings.ts apps/api/src/modules/pages/handlers/update-page-settings.test.ts apps/frontend/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx apps/frontend/app/components/EditPageSettingsDialog/actions.ts
git commit -m "pages: move settings updates behind the api and gate private pages"
```

---

### Task 9: Verification request route with gate

**Files:**
- Create: `apps/api/src/modules/verification/index.ts`
- Create: `apps/api/src/modules/verification/service.ts`
- Modify: `apps/api/src/app.ts` (mount `/verification-requests`)
- Modify: `apps/frontend/app/components/VerificationRequestDialog.tsx`
- Delete: `apps/frontend/app/lib/actions/verification.ts`
- Test: `apps/api/src/modules/verification/index.test.ts`

**Interfaces:**
- Produces: `POST /verification-requests` body `{ pageId: string; requestedPageTitle: string }` → `200 { success: true }` | `400 { error: { message } }` | `402`.

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/verification/index.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import { subscription, verificationRequest } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;

beforeAll(async () => {
  userId = (await createTestUser(`vr-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `vr-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'active',
      referenceId: organizationId,
      stripeCustomerId: `cus_vr_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  pageId = (await createTestPage({ organizationId, suffix: `vr-${suffix}` })).id;
});

afterAll(async () => {
  await db.delete(verificationRequest).where(eq(verificationRequest.pageId, pageId));
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => vi.unstubAllEnvs());

const post = () =>
  createApp().request(
    '/verification-requests',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId, requestedPageTitle: 'My Page' }),
    },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

describe('POST /verification-requests', () => {
  it('creates a pending request for a premium org', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');

    const response = await post();

    expect(response.status).toBe(200);
    const request = await db.query.verificationRequest.findFirst({
      where: (r, { eq }) => eq(r.pageId, pageId),
    });
    expect(request?.status).toBe('PENDING');
  });

  it('refuses a duplicate while one is pending', async () => {
    const response = await post();

    expect(response.status).toBe(400);
  });

  it('returns 402 once the org is free', async () => {
    vi.stubEnv('PAYWALL_ENFORCED', 'true');
    await db.delete(verificationRequest).where(eq(verificationRequest.pageId, pageId));
    await db
      .update(subscription)
      .set({ plan: 'freeLegacy', status: 'canceled' })
      .where(eq(subscription.id, subscriptionId));

    const response = await post();

    expect(response.status).toBe(402);
    const body = (await response.json()) as Record<string, any>;
    expect(body.error.feature).toBe('verification');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/verification`
Expected: FAIL (404).

- [ ] **Step 3: Service**

```ts
// apps/api/src/modules/verification/service.ts
import db from '@/lib/db';
import { VerificationRequestStatus } from '@trylinky/db';
import { verificationRequest } from '@trylinky/db/schema';

export async function createVerificationRequest({
  pageId,
  userId,
  organizationId,
  requestedPageTitle,
}: {
  pageId: string;
  userId: string;
  organizationId: string;
  requestedPageTitle: string;
}): Promise<{ success: true } | { error: { message: string } }> {
  if (!requestedPageTitle.trim()) {
    return { error: { message: 'Page title is required' } };
  }

  const target = await db.query.page.findFirst({
    where: (p, { and, eq, isNull }) =>
      and(eq(p.id, pageId), isNull(p.deletedAt), eq(p.organizationId, organizationId)),
    columns: { id: true },
  });

  if (!target) {
    return { error: { message: 'Page not found' } };
  }

  const existing = await db.query.verificationRequest.findFirst({
    where: (r, { and, eq, inArray }) =>
      and(
        eq(r.pageId, pageId),
        inArray(r.status, [
          VerificationRequestStatus.PENDING,
          VerificationRequestStatus.APPROVED,
        ])
      ),
    columns: { status: true },
  });

  if (existing?.status === VerificationRequestStatus.APPROVED) {
    return { error: { message: 'A verification request already exists for this page' } };
  }

  if (existing?.status === VerificationRequestStatus.PENDING) {
    return { error: { message: 'A verification request is already pending for this page' } };
  }

  await db.insert(verificationRequest).values({
    pageId,
    requestedByUserId: userId,
    requestedPageTitle,
  });

  return { success: true };
}
```

- [ ] **Step 4: Routes**

```ts
// apps/api/src/modules/verification/index.ts
import type { AppBindings } from '@/env';
import { upgradeRequired } from '@/lib/upgrade-required';
import { requireSession } from '@/middleware/authenticate';
import { getEntitlementsForOrganization } from '@/modules/billing/entitlements';
import { createVerificationRequest } from '@/modules/verification/service';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';
import { createFactory } from 'hono/factory';
// Built with `typebox`, NOT `@sinclair/typebox` — see the comment on
// postReactionsBodySchema in reactions/handlers/post-reactions.ts.
import { Type } from 'typebox';

const bodySchema = Type.Object({
  pageId: Type.String(),
  requestedPageTitle: Type.String(),
});

const factory = createFactory<AppBindings>();

const createHandlers = factory.createHandlers(
  tbValidator('json', bodySchema),
  async (c) => {
    const session = requireSession(c);
    const { pageId, requestedPageTitle } = c.req.valid('json');

    const entitlements = await getEntitlementsForOrganization(
      session.activeOrganizationId,
      session.user.id
    );

    if (!entitlements.features.verification) {
      return upgradeRequired(c, 'verification', {
        organizationId: session.activeOrganizationId,
        userId: session.user.id,
        tier: entitlements.tier,
      });
    }

    const result = await createVerificationRequest({
      pageId,
      userId: session.user.id,
      organizationId: session.activeOrganizationId,
      requestedPageTitle,
    });

    if ('error' in result) {
      return c.json({ error: result.error }, 400);
    }

    return c.json(result, 200);
  }
);

const verificationRoutes = new Hono<AppBindings>();

verificationRoutes.post('/', ...createHandlers);

export default verificationRoutes;
```

In `apps/api/src/app.ts`, add `import verificationRoutes from '@/modules/verification';` and `app.route('/verification-requests', verificationRoutes);` after the `/analytics` line.

- [ ] **Step 5: Run API tests**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/verification`
Expected: PASS.

- [ ] **Step 6: Frontend dialog calls the API**

In `VerificationRequestDialog.tsx`, replace the `createVerificationRequest` import with `import { InternalApi } from '@trylinky/common';` and replace the call (currently `const req = await createVerificationRequest({ pageId, requestedPageTitle: ... })` around line 79 and its `if (req.error)` toast) with:

```ts
    const req = await InternalApi.post('/verification-requests', {
      pageId,
      requestedPageTitle: values.requestedPageTitle,
    });

    if (req.error) {
      if (req.error.code !== 'UPGRADE_REQUIRED') {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: req.error.message,
        });
      }
      return;
    }
```

`pageId` and `toast` are already in scope in that component. Delete `apps/frontend/app/lib/actions/verification.ts`.

- [ ] **Step 7: Typecheck, commit**

Run: `pnpm --filter frontend typecheck && pnpm --filter api typecheck`

```bash
pnpm prettier --write apps/api/src/modules/verification apps/api/src/app.ts apps/frontend/app/components/VerificationRequestDialog.tsx
git add apps/api/src/modules/verification apps/api/src/app.ts apps/frontend/app/components/VerificationRequestDialog.tsx apps/frontend/app/lib/actions/verification.ts
git commit -m "api: move verification requests behind the api and gate them"
```

---

### Task 10: Subscription sync and downgrade side effects

The idempotent mirror of Stripe state into `Subscription`, plus what happens when an org drops to Free.

**Files:**
- Create: `apps/api/src/modules/billing/utils/sync-subscription.ts`
- Test: `apps/api/src/modules/billing/utils/sync-subscription.test.ts`

**Interfaces:**
- Produces:
  - `planFromPriceId(priceId: string): Plan | null`
  - `isUnconvertedTrial(sub: Pick<Stripe.Subscription, 'trial_end' | 'ended_at'>): boolean`
  - `syncSubscriptionFromStripe(sub: Stripe.Subscription): Promise<{ organizationId: string; previousTier: Tier; tier: Tier } | null>`
  - `applyDowngradeSideEffects(organizationId: string): Promise<void>`
  - `FREE_DOWNGRADE_NOTICE_FLAG = 'showFreeDowngradeNotice'`

- [ ] **Step 1: Failing tests**

```ts
// apps/api/src/modules/billing/utils/sync-subscription.test.ts
import {
  applyDowngradeSideEffects,
  isUnconvertedTrial,
  planFromPriceId,
  syncSubscriptionFromStripe,
} from './sync-subscription';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import {
  cleanupTestData,
  createTestOrganization,
  createTestPage,
  createTestUser,
} from '@/test/fixtures';
import {
  page,
  subscription,
  userFlag,
  verificationRequest,
} from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (slug: string, domain: string) => `page-slug-${slug}-${domain}`,
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;
let pageId: string;

beforeAll(async () => {
  userId = (await createTestUser(`sync-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `sync-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      status: 'trialing',
      referenceId: organizationId,
      stripeCustomerId: `cus_sync_${suffix}`,
      stripeSubscriptionId: `sub_sync_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
  pageId = (await createTestPage({ organizationId, suffix: `sync-${suffix}` })).id;
  await db.update(page).set({ verifiedAt: new Date() }).where(eq(page.id, pageId));
  await db.insert(verificationRequest).values({
    pageId,
    requestedByUserId: userId,
    requestedPageTitle: 'x',
  });
});

afterAll(async () => {
  await db.delete(verificationRequest).where(eq(verificationRequest.pageId, pageId));
  await db.delete(userFlag).where(eq(userFlag.userId, userId));
  await cleanupTestData({
    pageIds: [pageId],
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

describe('planFromPriceId', () => {
  it('maps every known price in both environments', () => {
    expect(planFromPriceId(prices.development.premium)).toBe('premium');
    expect(planFromPriceId(prices.production.team)).toBe('team');
    expect(planFromPriceId(prices.production.freeLegacy)).toBe('freeLegacy');
    expect(planFromPriceId('price_unknown')).toBeNull();
  });
});

describe('isUnconvertedTrial', () => {
  const t = 1_800_000_000;
  it('is true when the subscription ended at the trial end', () => {
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t })).toBe(true);
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t + 30 })).toBe(true);
  });
  it('is false when it ran on after the trial or never had one', () => {
    expect(isUnconvertedTrial({ trial_end: t, ended_at: t + 86_400 })).toBe(false);
    expect(isUnconvertedTrial({ trial_end: null, ended_at: t })).toBe(false);
    expect(isUnconvertedTrial({ trial_end: t, ended_at: null })).toBe(false);
  });
});

describe('syncSubscriptionFromStripe', () => {
  const stripeSub = (over: Record<string, unknown>) =>
    ({
      id: `sub_sync_${suffix}`,
      customer: `cus_sync_${suffix}`,
      status: 'active',
      items: { data: [{ price: { id: prices.development.premium } }] },
      current_period_start: 1_800_000_000,
      current_period_end: 1_802_592_000,
      cancel_at_period_end: false,
      trial_start: null,
      trial_end: null,
      ended_at: null,
      metadata: { organizationId },
      ...over,
    }) as never;

  it('mirrors an activation and reports the tier change', async () => {
    const result = await syncSubscriptionFromStripe(stripeSub({}));

    expect(result).toEqual({ organizationId, previousTier: 'premium', tier: 'premium' });
    const row = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, subscriptionId),
    });
    expect(row?.status).toBe('active');
    expect(row?.periodEnd?.getTime()).toBe(1_802_592_000 * 1000);
  });

  it('downgrades to free on cancellation and applies side effects', async () => {
    const result = await syncSubscriptionFromStripe(
      stripeSub({ status: 'canceled', ended_at: 1_802_592_000 })
    );

    expect(result?.tier).toBe('free');
    const row = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, subscriptionId),
    });
    expect(row?.plan).toBe('freeLegacy');
    expect(row?.status).toBe('canceled');

    const pageRow = await db.query.page.findFirst({ where: (p, { eq }) => eq(p.id, pageId) });
    expect(pageRow?.verifiedAt).toBeNull();
    const request = await db.query.verificationRequest.findFirst({
      where: (r, { eq }) => eq(r.pageId, pageId),
    });
    expect(request?.status).toBe('CANCELLED');
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) => and(eq(f.userId, userId), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(true);
  });

  it('returns null for a subscription it cannot attribute to an org', async () => {
    const result = await syncSubscriptionFromStripe(
      stripeSub({ id: 'sub_nope', customer: 'cus_nope', metadata: {} })
    );

    expect(result).toBeNull();
  });
});

describe('applyDowngradeSideEffects', () => {
  it('is idempotent', async () => {
    await applyDowngradeSideEffects(organizationId);
    await applyDowngradeSideEffects(organizationId);
    const flags = await db
      .select()
      .from(userFlag)
      .where(eq(userFlag.userId, userId));
    expect(flags.filter((f) => f.key === 'showFreeDowngradeNotice')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/utils/sync-subscription.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// apps/api/src/modules/billing/utils/sync-subscription.ts
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import { createPosthogClient } from '@/lib/posthog';
import { pageIdCacheTag, revalidatePageCache } from '@/lib/revalidate';
import { resolveTier } from '@/modules/billing/entitlements';
import type { Plan, Tier } from '@trylinky/common/billing';
import { VerificationRequestStatus } from '@trylinky/db';
import {
  member,
  page,
  subscription,
  userFlag,
  verificationRequest,
} from '@trylinky/db/schema';
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import type Stripe from 'stripe';

export const FREE_DOWNGRADE_NOTICE_FLAG = 'showFreeDowngradeNotice';

const PLAN_KEPT_ON_ROW_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function planFromPriceId(priceId: string): Plan | null {
  for (const env of [prices.development, prices.production]) {
    for (const [plan, id] of Object.entries(env)) {
      if (id === priceId) {
        return plan as Plan;
      }
    }
  }
  return null;
}

/**
 * A trial that ended without ever being paid: Stripe ended the subscription
 * at (or within a minute of) the trial end. Used to pick the right email.
 */
export function isUnconvertedTrial(
  sub: Pick<Stripe.Subscription, 'trial_end' | 'ended_at'>
): boolean {
  if (sub.trial_end == null || sub.ended_at == null) {
    return false;
  }
  return sub.ended_at <= sub.trial_end + 60;
}

function toDate(seconds: number | null | undefined): Date | null {
  return seconds == null ? null : new Date(seconds * 1000);
}

/**
 * Mirror a Stripe subscription into the org's Subscription row. Idempotent:
 * every field is derived from the Stripe object, so duplicate or
 * out-of-order webhooks converge on the same row.
 *
 * Returns the tier transition so callers can react (emails, cache), or null
 * when the subscription cannot be attributed to an organisation.
 */
export async function syncSubscriptionFromStripe(
  sub: Stripe.Subscription
): Promise<{ organizationId: string; previousTier: Tier; tier: Tier } | null> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  const orgIdFromMetadata = sub.metadata?.organizationId;

  const existing =
    (orgIdFromMetadata
      ? await db.query.subscription.findFirst({
          where: (s, { eq }) => eq(s.referenceId, orgIdFromMetadata),
        })
      : undefined) ??
    (await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.stripeSubscriptionId, sub.id),
    })) ??
    (await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.stripeCustomerId, customerId),
    }));

  if (!existing) {
    return null;
  }

  const priceId = sub.items?.data?.[0]?.price?.id;
  const planFromPrice = priceId ? planFromPriceId(priceId) : null;
  // A canceled/unpaid subscription is recorded as freeLegacy so the row
  // reads correctly even to code that only looks at `plan`.
  const plan: Plan =
    planFromPrice && PLAN_KEPT_ON_ROW_STATUSES.has(sub.status)
      ? planFromPrice
      : 'freeLegacy';

  const previousTier = resolveTier(existing);

  const [updated] = await db
    .update(subscription)
    .set({
      plan,
      status: sub.status,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: customerId,
      periodStart: toDate(sub.current_period_start),
      periodEnd: toDate(sub.current_period_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      trialStart: toDate(sub.trial_start),
      trialEnd: toDate(sub.trial_end),
    })
    .where(eq(subscription.id, existing.id))
    .returning();

  const tier = resolveTier(updated);
  const organizationId = existing.referenceId;

  if (tier !== previousTier) {
    if (tier === 'free') {
      await applyDowngradeSideEffects(organizationId);
    }

    const pages = await db
      .select({ id: page.id })
      .from(page)
      .where(and(eq(page.organizationId, organizationId), isNull(page.deletedAt)));
    void revalidatePageCache(pages.map((p) => pageIdCacheTag(p.id)));

    if (tier !== 'free') {
      const posthog = createPosthogClient();
      posthog?.capture({
        distinctId: organizationId,
        event: 'subscription-activated',
        properties: { plan, fromStatus: existing.status, organizationId },
      });
      if (posthog) void posthog.shutdown();
    }
  }

  return { organizationId, previousTier, tier };
}

/**
 * Everything that changes in the product when an org drops to Free:
 * badges come off, pending verification requests are cancelled, and every
 * member sees the one-time "you're on Free now" notice. Safe to call twice.
 */
export async function applyDowngradeSideEffects(organizationId: string) {
  const orgPageIds = db
    .select({ id: page.id })
    .from(page)
    .where(eq(page.organizationId, organizationId));

  await db
    .update(page)
    .set({ verifiedAt: null })
    .where(
      and(
        eq(page.organizationId, organizationId),
        isNull(page.deletedAt),
        isNotNull(page.verifiedAt)
      )
    );

  await db
    .update(verificationRequest)
    .set({ status: VerificationRequestStatus.CANCELLED })
    .where(
      and(
        eq(verificationRequest.status, VerificationRequestStatus.PENDING),
        inArray(verificationRequest.pageId, orgPageIds)
      )
    );

  const members = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  for (const { userId } of members) {
    const existingFlag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, userId), eq(f.key, FREE_DOWNGRADE_NOTICE_FLAG)),
      columns: { id: true },
    });

    if (existingFlag) {
      await db.update(userFlag).set({ value: true }).where(eq(userFlag.id, existingFlag.id));
    } else {
      await db
        .insert(userFlag)
        .values({ userId, key: FREE_DOWNGRADE_NOTICE_FLAG, value: true });
    }
  }
}
```

- [ ] **Step 4: Run tests, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/utils`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/billing/utils
git add apps/api/src/modules/billing/utils/sync-subscription.ts apps/api/src/modules/billing/utils/sync-subscription.test.ts
git commit -m "billing: add the stripe subscription sync and downgrade side effects"
```

---

### Task 11: Trials cancel themselves; webhook handlers use the sync

**Files:**
- Modify: `apps/api/src/modules/billing/utils/create-new-subscription.ts`
- Modify: `apps/api/src/modules/billing/handlers/stripe/handle-subscription-deleted.ts`
- Modify: `apps/api/src/modules/billing/handlers/stripe/handle-subscription-deleted.test.ts` (existing file; rewritten)
- Modify: `apps/api/src/modules/billing/handlers/stripe/handle-subscription-created.ts`
- Modify: `apps/api/src/modules/billing/handlers/stripe/index.ts`
- Delete: `apps/api/src/modules/billing/handlers/stripe/handle-trial-expired.ts`

- [ ] **Step 1: Rewrite the deleted-handler test**

Replace the whole of `handle-subscription-deleted.test.ts` with:

```ts
import { handleSubscriptionDeleted } from './handle-subscription-deleted';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { member, subscription, userFlag } from '@trylinky/db/schema';
import { inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type Stripe from 'stripe';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sendSubscriptionDeletedEmail = vi.fn();
const sendTrialEndedEmail = vi.fn();
const sendSlackMessage = vi.fn();

vi.mock('@/modules/notifications/service', () => ({
  sendSubscriptionDeletedEmail: (...args: unknown[]) =>
    sendSubscriptionDeletedEmail(...args),
  sendTrialEndedEmail: (...args: unknown[]) => sendTrialEndedEmail(...args),
}));
vi.mock('@/modules/slack/service', () => ({
  sendSlackMessage: (...args: unknown[]) => sendSlackMessage(...args),
}));
vi.mock('@/lib/revalidate', () => ({
  revalidatePageCache: vi.fn(async () => undefined),
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  pageSlugCacheTag: (s: string, d: string) => `page-slug-${s}-${d}`,
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);

const userIds: string[] = [];
const organizationIds: string[] = [];
const subscriptionIds: string[] = [];

function fakeEvent({
  id,
  customer,
  comment = null,
  trialEnd = null,
  endedAt = 1_805_000_000,
}: {
  id: string;
  customer: string;
  comment?: string | null;
  trialEnd?: number | null;
  endedAt?: number;
}): Stripe.Event {
  return {
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id,
        customer,
        status: 'canceled',
        items: { data: [{ price: { id: prices.development.premium } }] },
        current_period_start: 1_800_000_000,
        current_period_end: endedAt,
        cancel_at_period_end: false,
        trial_start: trialEnd ? 1_800_000_000 : null,
        trial_end: trialEnd,
        ended_at: endedAt,
        cancellation_details: { comment },
        metadata: {},
      },
    },
  } as unknown as Stripe.Event;
}

async function seed(label: string, status: string) {
  const owner = await createTestUser(`del-${label}-${suffix}`);
  userIds.push(owner.id);
  const org = await createTestOrganization({
    suffix: `del-${label}-${suffix}`,
    ownerId: owner.id,
  });
  organizationIds.push(org.id);
  const stripeSubscriptionId = `sub_${suffix}_${label}`;
  const stripeCustomerId = `cus_${suffix}_${label}`;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'premium',
      referenceId: org.id,
      stripeCustomerId,
      stripeSubscriptionId,
      status,
    })
    .returning();
  subscriptionIds.push(sub.id);
  return { owner, org, sub, stripeSubscriptionId, stripeCustomerId };
}

beforeEach(() => {
  sendSubscriptionDeletedEmail.mockClear();
  sendTrialEndedEmail.mockClear();
  sendSlackMessage.mockClear();
});

afterAll(async () => {
  await db.delete(userFlag).where(inArray(userFlag.userId, userIds));
  await cleanupTestData({ subscriptionIds, organizationIds, userIds });
});

describe('handleSubscriptionDeleted', () => {
  it('cancels the subscription and emails only members with an email', async () => {
    const { owner, org, sub, stripeSubscriptionId, stripeCustomerId } = await seed(
      'with-email',
      'active'
    );
    const withoutEmail = await createTestUser(`del-without-email-${suffix}`, {
      email: null,
    });
    userIds.push(withoutEmail.id);
    await db.insert(member).values({
      userId: withoutEmail.id,
      organizationId: org.id,
      role: 'member',
    });

    await handleSubscriptionDeleted(
      fakeEvent({ id: stripeSubscriptionId, customer: stripeCustomerId })
    );

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, sub.id),
    });
    expect(updated?.status).toBe('canceled');
    expect(updated?.plan).toBe('freeLegacy');
    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledTimes(1);
    expect(sendSubscriptionDeletedEmail).toHaveBeenCalledWith(owner.email);
    expect(sendTrialEndedEmail).not.toHaveBeenCalled();
  });

  it('sends the trial-ended email for an unconverted trial', async () => {
    const { owner, stripeSubscriptionId, stripeCustomerId } = await seed(
      'trial',
      'trialing'
    );

    await handleSubscriptionDeleted(
      fakeEvent({
        id: stripeSubscriptionId,
        customer: stripeCustomerId,
        trialEnd: 1_801_209_600,
        endedAt: 1_801_209_600,
      })
    );

    expect(sendTrialEndedEmail).toHaveBeenCalledWith(owner.email);
    expect(sendSubscriptionDeletedEmail).not.toHaveBeenCalled();
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, owner.id), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(true);
  });

  it('sends no email when the subscription was auto-upgraded to team', async () => {
    const { sub, stripeSubscriptionId, stripeCustomerId } = await seed('upgraded', 'active');

    await handleSubscriptionDeleted(
      fakeEvent({
        id: stripeSubscriptionId,
        customer: stripeCustomerId,
        comment: 'LINKY_AUTO_UPGRADED_TO_TEAM',
      })
    );

    const updated = await db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.id, sub.id),
    });
    expect(updated?.status).toBe('canceled');
    expect(updated?.plan).toBe('freeLegacy');
    expect(sendSubscriptionDeletedEmail).not.toHaveBeenCalled();
    expect(sendTrialEndedEmail).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/handlers/stripe/handle-subscription-deleted.test.ts`
Expected: the trial case FAILS (deleted email sent instead of trial email; no flag).

- [ ] **Step 3: Rewrite `handle-subscription-deleted.ts`**

```ts
import { createPosthogClient } from '@/lib/posthog';
import {
  isUnconvertedTrial,
  syncSubscriptionFromStripe,
} from '@/modules/billing/utils/sync-subscription';
import {
  sendSubscriptionDeletedEmail,
  sendTrialEndedEmail,
} from '@/modules/notifications/service';
import { getOrganizationMemberEmails } from '@/modules/organizations/utils';
import { sendSlackMessage } from '@/modules/slack/service';
import { captureMessage } from '@sentry/cloudflare';
import Stripe from 'stripe';

/**
 * The single downgrade path. Fires when Stripe deletes a subscription:
 * a card-less trial reaching its end (trial_settings.end_behavior =
 * cancel), a customer cancelling, or dunning giving up.
 */
export async function handleSubscriptionDeleted(event: Stripe.Event) {
  const stripeSubscription = event.data.object as Stripe.Subscription;

  const result = await syncSubscriptionFromStripe(stripeSubscription);

  if (!result) {
    captureMessage(
      `Subscription deleted but not found in database: ${stripeSubscription.id}`
    );
    return;
  }

  const autoUpgradedToTeam =
    stripeSubscription.cancellation_details?.comment ===
    'LINKY_AUTO_UPGRADED_TO_TEAM';

  if (!autoUpgradedToTeam) {
    const unconverted = isUnconvertedTrial(stripeSubscription);
    const emails = await getOrganizationMemberEmails(result.organizationId);

    for (const email of emails) {
      if (unconverted) {
        await sendTrialEndedEmail(email);
      } else {
        await sendSubscriptionDeletedEmail(email);
      }
    }

    if (unconverted) {
      const posthog = createPosthogClient();
      posthog?.capture({
        distinctId: result.organizationId,
        event: 'trial-ended-unconverted',
        properties: { organizationId: result.organizationId },
      });
      if (posthog) void posthog.shutdown();
    }
  }

  await sendSlackMessage({
    text: `Subscription deleted for ${result.organizationId} (Stripe: ${stripeSubscription.id})`,
  });

  return { success: true };
}
```

- [ ] **Step 4: Trial end behaviour**

In `create-new-subscription.ts`, change the `stripeClient.subscriptions.create` call to:

```ts
      stripeClient.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price }],
        trial_period_days: DEFAULT_TRIAL_PERIOD_DAYS,
        ...(DEFAULT_TRIAL_PERIOD_DAYS
          ? {
              // No card at signup: let Stripe cancel the subscription the
              // moment the trial ends instead of dunning a card-less
              // customer for three weeks. customer.subscription.deleted then
              // runs the one downgrade path.
              trial_settings: {
                end_behavior: { missing_payment_method: 'cancel' },
              },
            }
          : {}),
      })
```

- [ ] **Step 5: Created handler mirrors premium subscriptions**

In `handle-subscription-created.ts`, replace the `if (plan === 'premium') { ... }` block with:

```ts
  if (plan === 'premium') {
    // Checkout-created (Free → Premium) subscriptions land here. Mirror the
    // Stripe object so the row flips to premium/active without a bespoke
    // handler; signup trials are already inserted by createNewSubscription
    // and the sync is a no-op for them.
    const result = await syncSubscriptionFromStripe(stripeSubscription);

    await sendSlackMessage({
      text: `Premium subscription created for ${result?.organizationId ?? 'unknown org'} (Stripe: ${stripeSubscription.id})`,
    });

    return { success: true };
  }
```

Add `import { syncSubscriptionFromStripe } from '@/modules/billing/utils/sync-subscription';`.

- [ ] **Step 6: Updated handler syncs unconditionally**

In `stripe/index.ts`, replace the whole `case 'customer.subscription.updated':` body with:

```ts
      case 'customer.subscription.updated':
        // Mirror every status change (trialing → active on payment,
        // past_due → active when a card is fixed, and so on).
        await syncSubscriptionFromStripe(event.data.object);

        // Customer chose "cancel at period end" in the portal.
        if (
          event.data.object.cancel_at_period_end &&
          !event.data.previous_attributes?.cancel_at_period_end
        ) {
          await handleSubscriptionCancelled(event);
        }
        break;
```

Remove the `handleTrialExpired` import and delete `handle-trial-expired.ts`. Add the `syncSubscriptionFromStripe` import.

`handleSubscriptionCancelled` only sets `cancelAtPeriodEnd`, which the sync also writes; keep the call for one release so its Sentry message still fires, then remove it in a follow-up.

- [ ] **Step 7: Run the billing suite, typecheck, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing && pnpm --filter api typecheck`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/billing
git add apps/api/src/modules/billing/utils/create-new-subscription.ts apps/api/src/modules/billing/handlers/stripe/handle-subscription-deleted.ts apps/api/src/modules/billing/handlers/stripe/handle-subscription-deleted.test.ts apps/api/src/modules/billing/handlers/stripe/handle-subscription-created.ts apps/api/src/modules/billing/handlers/stripe/index.ts apps/api/src/modules/billing/handlers/stripe/handle-trial-expired.ts
git commit -m "billing: cancel card-less trials at trial end and sync stripe state on every webhook"
```

---

### Task 12: Free → Premium via Stripe Checkout

**Files:**
- Modify: `apps/api/src/modules/billing/handlers/upgrade-to-premium.ts` (full rewrite)
- Test: `apps/api/src/modules/billing/handlers/upgrade-to-premium.test.ts`

**Interfaces:**
- Produces: `POST /billing/upgrade/premium` → `200 { url }` | `400 { error }`.

- [ ] **Step 1: Failing test**

```ts
// apps/api/src/modules/billing/handlers/upgrade-to-premium.test.ts
import { createApp } from '@/app';
import db from '@/lib/db';
import { testEnv } from '@/test/env';
import {
  cleanupTestData,
  createTestOrganization,
  createTestUser,
} from '@/test/fixtures';
import { subscription } from '@trylinky/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const create = vi.fn(async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test' }));
vi.mock('@/lib/stripe', () => ({
  stripeClient: {
    checkout: { sessions: { create: (...a: unknown[]) => create(...(a as [])) } },
  },
}));
vi.mock('@/lib/posthog', () => ({ createPosthogClient: () => null }));

const suffix = randomUUID().slice(0, 8);
let organizationId: string;
let userId: string;
let subscriptionId: string;

beforeAll(async () => {
  userId = (await createTestUser(`up-${suffix}`)).id;
  organizationId = (
    await createTestOrganization({ suffix: `up-${suffix}`, ownerId: userId })
  ).id;
  const [sub] = await db
    .insert(subscription)
    .values({
      plan: 'freeLegacy',
      status: 'canceled',
      referenceId: organizationId,
      stripeCustomerId: `cus_up_${suffix}`,
    })
    .returning();
  subscriptionId = sub.id;
});

afterAll(async () => {
  await cleanupTestData({
    subscriptionIds: [subscriptionId],
    organizationIds: [organizationId],
    userIds: [userId],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  create.mockClear();
});

const post = () =>
  createApp().request(
    '/billing/upgrade/premium',
    { method: 'POST' },
    testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
  );

describe('POST /billing/upgrade/premium', () => {
  it('creates a Checkout session for the org customer and returns its url', async () => {
    vi.stubEnv('APP_FRONTEND_URL', 'https://lin.ky');

    const response = await post();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      url: 'https://checkout.stripe.com/c/pay/cs_test',
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: `cus_up_${suffix}`,
        subscription_data: { metadata: { organizationId } },
        success_url: 'https://lin.ky/edit?upgraded=premium',
      })
    );
  });

  it('refuses when the org is already entitled', async () => {
    await db
      .update(subscription)
      .set({ plan: 'premium', status: 'active' })
      .where(eq(subscription.id, subscriptionId));

    const response = await post();

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/handlers/upgrade-to-premium.test.ts`
Expected: FAIL.

- [ ] **Step 3: Rewrite the handler**

```ts
// apps/api/src/modules/billing/handlers/upgrade-to-premium.ts
import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { prices } from '@/lib/plans';
import { createPosthogClient } from '@/lib/posthog';
import { stripeClient } from '@/lib/stripe';
import { requireSession } from '@/middleware/authenticate';
import { resolveTier } from '@/modules/billing/entitlements';
import { captureException } from '@sentry/cloudflare';
import type { Context } from 'hono';

/**
 * Free → Premium. The old implementation tried to swap the price on the
 * existing Stripe subscription with the *database* subscription id as the
 * item id, which Stripe rejects, and cancelled trials no longer have a live
 * Stripe subscription anyway. A Checkout Session creates a fresh one; the
 * customer.subscription.created webhook mirrors it into the row.
 */
export async function upgradeToPremiumHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  const current = await db.query.subscription.findFirst({
    where: (s, { eq }) => eq(s.referenceId, session.activeOrganizationId),
  });

  if (!current) {
    return c.json({ error: 'No subscription found for this organisation' }, 404);
  }

  if (resolveTier(current) !== 'free') {
    return c.json({ error: 'This organisation already has a paid plan' }, 400);
  }

  const env =
    process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const frontend = process.env.APP_FRONTEND_URL;

  try {
    const checkout = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: current.stripeCustomerId,
      line_items: [{ price: prices[env].premium, quantity: 1 }],
      subscription_data: {
        metadata: { organizationId: session.activeOrganizationId },
      },
      allow_promotion_codes: true,
      success_url: `${frontend}/edit?upgraded=premium`,
      cancel_url: `${frontend}/edit?showBilling=true`,
    });

    if (!checkout.url) {
      return c.json({ error: 'Failed to start checkout' }, 400);
    }

    const posthog = createPosthogClient();
    posthog?.capture({
      distinctId: session.user.id,
      event: 'checkout-started',
      properties: {
        organizationId: session.activeOrganizationId,
        fromTier: 'free',
      },
    });
    if (posthog) {
      try {
        c.executionCtx.waitUntil(posthog.shutdown());
      } catch {
        void posthog.shutdown();
      }
    }

    return c.json({ url: checkout.url }, 200);
  } catch (error) {
    captureException(error);
    return c.json({ error: 'Failed to start checkout' }, 400);
  }
}
```

The pricing table's `handleUpgrade` already does `if (res.url) router.push(res.url)`, so no frontend change is needed for this path.

- [ ] **Step 4: Run, commit**

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/handlers/upgrade-to-premium.test.ts`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/billing/handlers/upgrade-to-premium.ts apps/api/src/modules/billing/handlers/upgrade-to-premium.test.ts
git add apps/api/src/modules/billing/handlers/upgrade-to-premium.ts apps/api/src/modules/billing/handlers/upgrade-to-premium.test.ts
git commit -m "billing: upgrade free organisations to premium through stripe checkout"
```

---

### Task 13: Dismiss route for the post-downgrade notice

**Files:**
- Create: `apps/api/src/modules/flags/handlers/hide-free-downgrade-notice.ts`
- Modify: `apps/api/src/modules/flags/index.ts`
- Modify: `apps/api/src/modules/billing/utils/sync-subscription.test.ts` (one more case)

- [ ] **Step 1: Handler**

```ts
// apps/api/src/modules/flags/handlers/hide-free-downgrade-notice.ts
import type { AppBindings } from '@/env';
import db from '@/lib/db';
import { requireSession } from '@/middleware/authenticate';
import { FREE_DOWNGRADE_NOTICE_FLAG } from '@/modules/billing/utils/sync-subscription';
import { userFlag } from '@trylinky/db/schema';
import { and, eq } from 'drizzle-orm';
import type { Context } from 'hono';

export async function hideFreeDowngradeNoticeHandler(c: Context<AppBindings>) {
  const session = requireSession(c);

  await db
    .update(userFlag)
    .set({ value: false })
    .where(
      and(
        eq(userFlag.userId, session.user.id),
        eq(userFlag.key, FREE_DOWNGRADE_NOTICE_FLAG)
      )
    );

  return c.json({ success: true }, 200);
}
```

Mount in `flags/index.ts`:

```ts
import { hideFreeDowngradeNoticeHandler } from '@/modules/flags/handlers/hide-free-downgrade-notice';
// ...
flagsRoutes.post('/hide-free-downgrade-notice', hideFreeDowngradeNoticeHandler);
```

- [ ] **Step 2: Test through the existing sync suite, commit**

Add to the `applyDowngradeSideEffects` describe in `sync-subscription.test.ts`:

```ts
  it('can be dismissed through POST /flags/hide-free-downgrade-notice', async () => {
    const { createApp } = await import('@/app');
    const { testEnv } = await import('@/test/env');
    const response = await createApp().request(
      '/flags/hide-free-downgrade-notice',
      { method: 'POST' },
      testEnv({ user: { id: userId }, activeOrganizationId: organizationId })
    );
    expect(response.status).toBe(200);
    const flag = await db.query.userFlag.findFirst({
      where: (f, { and, eq }) =>
        and(eq(f.userId, userId), eq(f.key, 'showFreeDowngradeNotice')),
    });
    expect(flag?.value).toBe(false);
  });
```

Run: `DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm --filter api test -- src/modules/billing/utils`
Expected: PASS.

```bash
pnpm prettier --write apps/api/src/modules/flags apps/api/src/modules/billing/utils/sync-subscription.test.ts
git add apps/api/src/modules/flags/handlers/hide-free-downgrade-notice.ts apps/api/src/modules/flags/index.ts apps/api/src/modules/billing/utils/sync-subscription.test.ts
git commit -m "api: add the dismiss route for the free downgrade notice"
```

---

### Task 14: Backfill script for existing trials

**Files:**
- Create: `apps/api/scripts/backfill-trial-end-behaviour.ts`

- [ ] **Step 1: Write the script**

```ts
// apps/api/scripts/backfill-trial-end-behaviour.ts
//
// One-off. Run once against production after Task 11 ships:
//   cd apps/api && dotenvx run -f ../../.env.local -- \
//     node --experimental-strip-types scripts/backfill-trial-end-behaviour.ts
//
// 1. Every Stripe subscription still `trialing` gets
//    trial_settings.end_behavior.missing_payment_method = 'cancel', so it
//    cancels itself at trial end like new signups do.
// 2. Every subscription already `past_due` with a trial_end and no successful
//    payment is cancelled now; the deleted webhook downgrades it.
//
// Reads STRIPE_API_SECRET_KEY. Pass --dry-run to print without changing.
import Stripe from 'stripe';

const dryRun = process.argv.includes('--dry-run');
const stripe = new Stripe(process.env.STRIPE_API_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});

async function main() {
  let updated = 0;
  let cancelled = 0;

  for await (const sub of stripe.subscriptions.list({ status: 'trialing', limit: 100 })) {
    const current = sub.trial_settings?.end_behavior?.missing_payment_method;
    if (current === 'cancel') continue;
    console.log(`trialing ${sub.id}: ${current ?? 'create_invoice'} -> cancel`);
    if (!dryRun) {
      await stripe.subscriptions.update(sub.id, {
        trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
      });
    }
    updated += 1;
  }

  for await (const sub of stripe.subscriptions.list({ status: 'past_due', limit: 100 })) {
    if (sub.trial_end == null) continue;
    const invoices = await stripe.invoices.list({ subscription: sub.id, status: 'paid', limit: 1 });
    if (invoices.data.length > 0) continue;
    console.log(`past_due unconverted trial ${sub.id}: cancelling`);
    if (!dryRun) {
      await stripe.subscriptions.cancel(sub.id);
    }
    cancelled += 1;
  }

  console.log(`${dryRun ? '[dry run] ' : ''}updated ${updated}, cancelled ${cancelled}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Dry-run against the development Stripe account**

Run from `apps/api`: `dotenvx run -f ../../.env.local -- node --experimental-strip-types scripts/backfill-trial-end-behaviour.ts --dry-run`
Expected: prints a list (possibly empty) and the summary line; exits 0. If `STRIPE_API_SECRET_KEY` is unset locally, note that in the task report and skip; the script is exercised for real before the production flag flip.

- [ ] **Step 3: Commit**

```bash
pnpm prettier --write apps/api/scripts/backfill-trial-end-behaviour.ts
git add apps/api/scripts/backfill-trial-end-behaviour.ts
git commit -m "billing: add the one-off trial end-behaviour backfill script"
```

---

### Task 15: `InternalApi` surfaces error bodies and routes 402s

Today `InternalApi.post/put` return `{ success: false }` for any non-2xx, so the API's error bodies (including the existing 400s) never reach callers. This is a prerequisite for every frontend gate.

**Files:**
- Modify: `packages/common/src/api/internal-api.ts`

**Interfaces:**
- Produces: `InternalApi.setUpgradeRequiredListener(fn: ((error: UpgradeRequiredError) => void) | null)`; every method returns the parsed JSON body for any status, with `{ success: false }` only when the body is not JSON or the request throws.

- [ ] **Step 1: Rewrite the `InternalApi` class**

Replace the `InternalApi` class (leave `PublicApi` untouched) with:

```ts
import { UPGRADE_REQUIRED, type UpgradeRequiredError } from '../billing/plans';

type UpgradeRequiredListener = (error: UpgradeRequiredError) => void;

let upgradeRequiredListener: UpgradeRequiredListener | null = null;

async function parse(res: Response) {
  try {
    const body = await res.json();

    if (
      res.status === 402 &&
      body?.error?.code === UPGRADE_REQUIRED &&
      upgradeRequiredListener
    ) {
      upgradeRequiredListener(body.error);
    }

    return body;
  } catch {
    return { success: false };
  }
}

async function request(method: string, path: string, body?: any) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    return parse(res);
  } catch {
    return { success: false };
  }
}

/**
 * Session-bearing client for the editor. Unlike PublicApi it returns the
 * parsed body for every status so callers can read `error.message`,
 * `error.field` and `error.code`. A 402 UPGRADE_REQUIRED is also handed to
 * the registered listener (the UpgradeDialog provider) so gates need no
 * bespoke handling at each call site.
 */
export class InternalApi {
  static setUpgradeRequiredListener(listener: UpgradeRequiredListener | null) {
    upgradeRequiredListener = listener;
  }

  static post(path: string, body?: any) {
    return request('POST', path, body);
  }

  static put(path: string, body?: any) {
    return request('PUT', path, body);
  }

  static get(path: string, body?: any) {
    return request('GET', path, body);
  }

  static delete(path: string, body?: any) {
    return request('DELETE', path, body);
  }
}
```

The import line goes at the top of the file, after `'use client';`.

- [ ] **Step 2: Check callers that relied on `{ success: false }`**

Run: `command grep -rn "InternalApi\.\(post\|put\|get\|delete\)" apps/frontend packages/common --include='*.tsx' --include='*.ts' | grep -v node_modules`

For each call site, confirm it handles a body with `error` (most already do: `NewPageDialog`, `EditWrapper`, `pricing-table`). `handleCompleteTrial` checks `res.success`, which still works. No call site should depend on a non-2xx becoming `{ success: false }`.

- [ ] **Step 3: Typecheck, commit**

Run: `pnpm typecheck`

```bash
pnpm prettier --write packages/common/src/api/internal-api.ts
git add packages/common/src/api/internal-api.ts
git commit -m "common: return api error bodies from InternalApi and route 402s to a listener"
```

---

### Task 16: `useEntitlements`, `UpgradeDialog` and its provider

**Files:**
- Create: `apps/frontend/lib/hooks/use-entitlements.ts`
- Create: `apps/frontend/app/components/UpgradeDialog.tsx`
- Modify: `apps/frontend/app/e/[slug]/layout.tsx`

**Interfaces:**
- Produces:
  - `useEntitlements(): { entitlements: Entitlements | undefined; isLoading: boolean; mutate }`
  - `useUpgradeDialog(): { open(feature: PaywallFeature, source: string): void }`
  - `<UpgradeDialogProvider>` (registers the `InternalApi` listener)

- [ ] **Step 1: Hook**

```ts
// apps/frontend/lib/hooks/use-entitlements.ts
'use client';

import { internalApiFetcher, type Entitlements } from '@trylinky/common';
import useSWR from 'swr';

export function useEntitlements() {
  const { data, isLoading, mutate } = useSWR<Entitlements>(
    '/billing/entitlements',
    internalApiFetcher
  );

  return { entitlements: data, isLoading, mutate };
}
```

- [ ] **Step 2: Dialog + provider**

Check `apps/frontend/app/posthog-provider.tsx` first: if it uses `posthog-js/react`'s `PostHogProvider`, `usePostHog` below is correct; if it exposes a different client, use that instead, and if there is none, drop the `posthog` lines (the server-side `paywall-hit` event still captures the funnel).

```tsx
// apps/frontend/app/components/UpgradeDialog.tsx
'use client';

import { useSession } from '@/app/lib/auth';
import {
  InternalApi,
  PricingTable,
  type PaywallFeature,
  type UpgradeRequiredError,
} from '@trylinky/common';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import { usePostHog } from 'posthog-js/react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const TITLES: Record<PaywallFeature, string> = {
  blocks: "You've used your 5 free blocks",
  pages: 'Free includes one page',
  analytics: "See who's visiting",
  privatePages: 'Keep pages private with Premium',
  verification: 'Get verified',
  customDomain: 'Use your own domain',
};

type UpgradeDialogContextValue = {
  open: (feature: PaywallFeature, source: string) => void;
};

const UpgradeDialogContext = createContext<UpgradeDialogContextValue | null>(null);

export function useUpgradeDialog(): UpgradeDialogContextValue {
  const ctx = useContext(UpgradeDialogContext);
  if (!ctx) {
    throw new Error('useUpgradeDialog must be used within UpgradeDialogProvider');
  }
  return ctx;
}

export function UpgradeDialogProvider({ children }: { children: ReactNode }) {
  const [feature, setFeature] = useState<PaywallFeature | null>(null);
  const posthog = usePostHog();
  const router = useRouter();
  const { data } = useSession();

  const open = useCallback(
    (nextFeature: PaywallFeature, source: string) => {
      posthog?.capture('upgrade-dialog-opened', { feature: nextFeature, source });
      setFeature(nextFeature);
    },
    [posthog]
  );

  useEffect(() => {
    InternalApi.setUpgradeRequiredListener((error: UpgradeRequiredError) =>
      open(error.feature, 'api-402')
    );
    return () => InternalApi.setUpgradeRequiredListener(null);
  }, [open]);

  const value = useMemo(() => ({ open }), [open]);

  const handleComplete = () => {
    setFeature(null);
    router.push(window.location.pathname + '?showPremiumOnboarding=true');
  };

  return (
    <UpgradeDialogContext.Provider value={value}>
      {children}
      <Dialog open={feature !== null} onOpenChange={(o) => !o && setFeature(null)}>
        <DialogContent className="max-w-2xl w-full p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>{feature ? TITLES[feature] : ''}</DialogTitle>
            <DialogDescription>
              Premium unlocks unlimited pages and blocks, analytics, private
              pages, a verified badge and your own domain.
            </DialogDescription>
          </DialogHeader>
          <section className="bg-[#f5f3ea] px-6 py-8">
            <PricingTable
              isLoggedIn={!!data?.session}
              onComplete={handleComplete}
            />
          </section>
        </DialogContent>
      </Dialog>
    </UpgradeDialogContext.Provider>
  );
}
```

- [ ] **Step 3: Mount the provider in the editor layout**

In `apps/frontend/app/e/[slug]/layout.tsx`, import `UpgradeDialogProvider` from `@/app/components/UpgradeDialog` and wrap the existing `EditModeContextProvider`:

```tsx
      <UpgradeDialogProvider>
        <EditModeContextProvider>
          ...existing children...
        </EditModeContextProvider>
      </UpgradeDialogProvider>
```

- [ ] **Step 4: Typecheck, lint, commit**

Run: `pnpm --filter frontend typecheck && pnpm --filter frontend lint`

```bash
pnpm prettier --write apps/frontend/lib/hooks/use-entitlements.ts apps/frontend/app/components/UpgradeDialog.tsx 'apps/frontend/app/e/[slug]/layout.tsx'
git add apps/frontend/lib/hooks/use-entitlements.ts apps/frontend/app/components/UpgradeDialog.tsx 'apps/frontend/app/e/[slug]/layout.tsx'
git commit -m "frontend: add useEntitlements and the shared upgrade dialog"
```

---

### Task 17: Editor gates (blocks, pages, analytics, publish toggle, verification)

The API already enforces all of these. This task makes the UI say so before the request instead of after.

**Files:**
- Modify: `apps/frontend/app/components/DraggableBlockButton.tsx`
- Modify: `apps/frontend/app/components/PageSwitcher.tsx`
- Modify: `apps/frontend/app/components/UserWidget.tsx` (same New Page trigger)
- Modify: `apps/frontend/app/components/SidebarAnalytics.tsx`
- Modify: `apps/frontend/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx`

- [ ] **Step 1: Block button**

In `DraggableBlockButton.tsx`, add:

```tsx
import { useUpgradeDialog } from '@/app/components/UpgradeDialog';
import { useEntitlements } from '@/lib/hooks/use-entitlements';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { internalApiFetcher } from '@trylinky/common';
import useSWR, { useSWRConfig } from 'swr';
```

Inside the component, after `const blockConfig = config[type];`:

```tsx
  const { entitlements } = useEntitlements();
  const { open } = useUpgradeDialog();
  const { cache } = useSWRConfig();
  const pageId = cache.get('pageId') as string | undefined;
  const { data: pageBlocks } = useSWR<{ blocks: { id: string }[] }>(
    pageId ? `/pages/${pageId}/blocks` : null,
    internalApiFetcher
  );

  const atLimit =
    !!entitlements &&
    !!pageBlocks &&
    pageBlocks.blocks.length >= entitlements.limits.blocksPerPage;
```

Check the response shape of `GET /pages/:pageId/blocks` (`getPageBlocksHandler` in `apps/api/src/modules/pages/index.ts`) and match the generic above to it.

Then, on the desktop button: set `draggable={!atLimit}` and change `onDragStart` to early-return when `atLimit`. On the mobile button, change `onClick` to:

```tsx
        onClick={() => {
          if (atLimit) {
            open('blocks', 'block-picker');
            return;
          }
          setNextToAddBlock({ i: 'tmp-block', w: blockConfig.drag.w, h: blockConfig.drag.h, type });
        }}
```

For the desktop button, add an `onClick` with the same `atLimit` branch (a locked card should still open the dialog on click), and render a lock badge as the last child of the `<>` fragment in `content` when `atLimit`:

```tsx
      {atLimit && (
        <LockClosedIcon className="ml-auto h-4 w-4 shrink-0 text-stone-400" aria-label="Premium" />
      )}
```

- [ ] **Step 2: New page triggers**

In `PageSwitcher.tsx`, the `Create Page` `CommandItem`'s `onSelect` becomes:

```tsx
                  onSelect={() => {
                    if (
                      entitlements &&
                      (teamPages?.length ?? 0) >= entitlements.limits.pages
                    ) {
                      open('pages', 'page-switcher');
                      return;
                    }
                    setShowNewTeamDialog(true);
                  }}
```

with `const { entitlements } = useEntitlements();` and `const { open } = useUpgradeDialog();` added near the top of the component (imports as in Step 1). `teamPages` is already a prop of `PageSwitcher`.

Apply the identical guard to the `NewPageDialog` trigger in `UserWidget.tsx` (find the state setter that opens the dialog around line 125; it has `usersOrganizations` but no page list, so add `const { data: teamPages } = useSWR<Partial<Page>[]>('/pages/me', internalApiFetcher);` there, with `Page` from `@trylinky/prisma` as the file's neighbours do).

- [ ] **Step 3: Analytics locked panel**

In `SidebarAnalytics.tsx`, add a `locked` state next to `showPlaceholder`:

```tsx
  const [locked, setLocked] = useState(false);
```

Replace `InternalApi.get(...)` in `fetchData` with `internalApiFetcher(...)` (import from `@trylinky/common`) so this read does not trigger the global 402 listener on page load, and before the existing `if (responseData.error?.code)` check add:

```tsx
        if (responseData.error?.code === 'UPGRADE_REQUIRED') {
          setLocked(true);
          return;
        }
```

Before the `if (showPlaceholder)` return:

```tsx
  if (locked) {
    return <SidebarAnalyticsLocked />;
  }
```

Add at the bottom of the file:

```tsx
function SidebarAnalyticsLocked() {
  const { open } = useUpgradeDialog();

  return (
    <Card className="shadow-none">
      <CardContent className="py-8 text-center">
        <div className="mx-auto mb-4 h-24 w-full max-w-xs rounded-md bg-linear-to-t from-stone-100 to-stone-50 blur-[2px]" />
        <span className="block text-lg font-semibold">See who&apos;s visiting</span>
        <span className="mt-1 block text-sm text-neutral-500">
          Views, unique visitors and top locations for every page.
        </span>
        <Button className="mt-4" onClick={() => open('analytics', 'sidebar-analytics')}>
          Upgrade to Premium
        </Button>
      </CardContent>
    </Card>
  );
}
```

with `import { useUpgradeDialog } from '@/app/components/UpgradeDialog';` and `Button` added to the `@trylinky/ui` import.

- [ ] **Step 4: Publish toggle**

In `EditPageSettingsGeneralForm.tsx`, add the two hook imports and inside the component:

```tsx
  const { entitlements } = useEntitlements();
  const { open } = useUpgradeDialog();
  const canUnpublish = entitlements?.features.privatePages ?? true;
```

Replace the `Catalyst.Switch` with:

```tsx
                      <Catalyst.Switch
                        name="published"
                        checked={values.published}
                        onChange={(newVal: boolean) => {
                          if (!newVal && !canUnpublish) {
                            open('privatePages', 'settings-publish-toggle');
                            return;
                          }
                          setFieldValue('published', newVal);
                        }}
                      />
```

And under the `Catalyst.Description`, when `!canUnpublish`:

```tsx
                      {!canUnpublish && (
                        <span className="mt-1 inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                          Premium
                        </span>
                      )}
```

- [ ] **Step 5: Verification button**

Same file, the `Begin page verification` button's `onClick`:

```tsx
                  onClick={() => {
                    if (!(entitlements?.features.verification ?? true)) {
                      open('verification', 'settings-verification');
                      return;
                    }
                    setShowVerificationDialog(true);
                  }}
```

- [ ] **Step 6: Typecheck, lint, commit**

Run: `pnpm --filter frontend typecheck && pnpm --filter frontend lint`

```bash
pnpm prettier --write apps/frontend/app/components/DraggableBlockButton.tsx apps/frontend/app/components/PageSwitcher.tsx apps/frontend/app/components/UserWidget.tsx apps/frontend/app/components/SidebarAnalytics.tsx apps/frontend/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx
git add apps/frontend/app/components/DraggableBlockButton.tsx apps/frontend/app/components/PageSwitcher.tsx apps/frontend/app/components/UserWidget.tsx apps/frontend/app/components/SidebarAnalytics.tsx apps/frontend/app/components/EditPageSettingsDialog/EditPageSettingsGeneralForm.tsx
git commit -m "frontend: open the upgrade dialog at every plan-gated action"
```

---

### Task 18: Trial banner and post-downgrade notice

**Files:**
- Create: `apps/frontend/app/components/TrialBanner.tsx`
- Create: `apps/frontend/app/components/FreeDowngradeDialog.tsx`
- Modify: `apps/frontend/app/e/[slug]/layout.tsx`

- [ ] **Step 1: Trial banner**

```tsx
// apps/frontend/app/components/TrialBanner.tsx
'use client';

import { useUpgradeDialog } from '@/app/components/UpgradeDialog';
import { useEntitlements } from '@/lib/hooks/use-entitlements';
import { Button } from '@trylinky/ui';

export function TrialBanner() {
  const { entitlements } = useEntitlements();
  const { open } = useUpgradeDialog();

  const trial = entitlements?.trial;
  if (!trial?.active || trial.daysLeft == null || trial.daysLeft > 3) {
    return null;
  }

  const days = trial.daysLeft === 1 ? '1 day' : `${trial.daysLeft} days`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
      <span>
        Your Premium trial ends in {days}. Add a card to keep analytics, unlimited
        blocks and private pages.
      </span>
      <Button size="sm" onClick={() => open('analytics', 'trial-banner')}>
        Keep Premium
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Post-downgrade dialog**

```tsx
// apps/frontend/app/components/FreeDowngradeDialog.tsx
'use client';

import { useUpgradeDialog } from '@/app/components/UpgradeDialog';
import { captureException } from '@sentry/nextjs';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { UserFlag } from '@trylinky/prisma';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@trylinky/ui';
import { useState } from 'react';
import useSWR from 'swr';

export function FreeDowngradeDialog() {
  const [dismissed, setDismissed] = useState(false);
  const { open } = useUpgradeDialog();
  const { data: userFlags, mutate } = useSWR<{ flags: Partial<UserFlag>[] }>(
    '/flags/me',
    internalApiFetcher
  );

  const show = userFlags?.flags.find((f) => f.key === 'showFreeDowngradeNotice')?.value;

  if (!show || dismissed) {
    return null;
  }

  const dismiss = async () => {
    setDismissed(true);
    try {
      await InternalApi.post('/flags/hide-free-downgrade-notice');
      await mutate();
    } catch (error) {
      captureException(error);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your trial has ended</DialogTitle>
          <DialogDescription>
            You&apos;re now on Free. Your page is still live and nothing has been
            removed.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>One page, up to 5 blocks</li>
          <li>Analytics, private pages and the verified badge are paused</li>
          <li>Custom domains are paused</li>
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={dismiss}>
            Got it
          </Button>
          <Button
            onClick={() => {
              dismiss();
              open('blocks', 'free-downgrade-dialog');
            }}
          >
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Mount both**

In `apps/frontend/app/e/[slug]/layout.tsx`, inside `UpgradeDialogProvider`, render `<TrialBanner />` directly above `<Catalyst.StackedLayout ...>` and `<FreeDowngradeDialog />` next to `<RenderPageTheme ... />`.

- [ ] **Step 4: Typecheck, lint, commit**

Run: `pnpm --filter frontend typecheck && pnpm --filter frontend lint`

```bash
pnpm prettier --write apps/frontend/app/components/TrialBanner.tsx apps/frontend/app/components/FreeDowngradeDialog.tsx 'apps/frontend/app/e/[slug]/layout.tsx'
git add apps/frontend/app/components/TrialBanner.tsx apps/frontend/app/components/FreeDowngradeDialog.tsx 'apps/frontend/app/e/[slug]/layout.tsx'
git commit -m "frontend: add the trial-ending banner and the free downgrade notice"
```

---

### Task 19: Email copy

**Files:**
- Modify: `packages/notifications/emails/trial-ending-soon.tsx`
- Modify: `packages/notifications/emails/trial-finished.tsx`

- [ ] **Step 1: Trial ending soon**

Open `trial-ending-soon.tsx` and replace the body paragraphs (keep header, footer, sign-off components) with:

```tsx
              <Text style={styles.paragraph}>
                Your Premium trial ends in 3 days. If you don&apos;t add a card
                before then, your account moves to Free and these pause:
              </Text>
              <Text style={styles.paragraph}>
                • Analytics
                <br />• Unlimited pages and blocks (Free is one page, five blocks)
                <br />• Private pages
                <br />• Your verified badge and custom domain
              </Text>
              <Text style={styles.paragraph}>
                Your page stays live either way. To keep Premium, add a card
                from the billing screen: https://lin.ky/edit?showBilling=true
              </Text>
```

- [ ] **Step 2: Trial finished**

Replace `TrialFinishedEmailText` in `trial-finished.tsx` with:

```ts
export const TrialFinishedEmailText = `
Hey there,\n\nIt's Alex, the founder of Linky.\n\nYour Premium trial has ended and your account is now on Free. Your page is still live and nothing has been removed.\n\nOn Free you have one page with up to five blocks. Analytics, private pages, the verified badge and custom domains are paused until you upgrade.\n\nUpgrade any time from the editor: https://lin.ky/edit?showBilling=true\n\nThanks for trying Linky. If anything's unclear, just reply.\n\nBest,\nAlex\nFounder of Linky
`;
```

And update the JSX body paragraphs to the same three points.

- [ ] **Step 3: Typecheck, commit**

Run: `pnpm typecheck`

```bash
pnpm prettier --write packages/notifications/emails/trial-ending-soon.tsx packages/notifications/emails/trial-finished.tsx
git add packages/notifications/emails/trial-ending-soon.tsx packages/notifications/emails/trial-finished.tsx
git commit -m "notifications: say what pauses on free in the trial emails"
```

---

### Task 20: `PAYWALL_ENFORCED` configuration and docs

**Files:**
- Modify: `.env.example`
- Modify: `apps/api/.dev.vars.example`
- Modify: `apps/api/wrangler.jsonc`
- Modify: `docs/self-hosting.md`

- [ ] **Step 1: Env examples**

Append to both `.env.example` (under "Stripe") and `apps/api/.dev.vars.example` (under "Stripe - payments"):

```
# Set to "true" to enforce Free plan limits (pages, blocks, analytics, private
# pages, verification, custom domains). Anything else reports paid limits for
# everyone. Self-hosters usually leave this unset.
PAYWALL_ENFORCED=true
```

- [ ] **Step 2: Worker vars**

In `apps/api/wrangler.jsonc`, add to the top-level `"vars"` block:

```jsonc
    "PAYWALL_ENFORCED": "false",
```

If the file has a `staging` environment block with its own `vars`, add `"PAYWALL_ENFORCED": "true"` there. Flipping production to `"true"` is a deliberate deploy after the backfill (spec §9), not part of this task.

- [ ] **Step 3: Self-hosting doc**

In `docs/self-hosting.md`, under the Stripe variables list, add:

```markdown
- `PAYWALL_ENFORCED` — set to `true` to enforce the hosted plan limits. Leave
  unset on a self-hosted instance and every organisation gets the paid limits.
```

- [ ] **Step 4: Commit**

```bash
git add .env.example apps/api/.dev.vars.example apps/api/wrangler.jsonc docs/self-hosting.md
git commit -m "config: add the PAYWALL_ENFORCED flag"
```

---

### Task 21: Full verification and manual checklist

- [ ] **Step 1: Whole-repo checks**

Run, from the repo root:

```bash
pnpm typecheck
pnpm lint
DATABASE_URL='postgresql://glow_user:KGfUZosCOm@localhost:5433/glow_development' pnpm test
pnpm prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"
```

Expected: all pass.

- [ ] **Step 2: Manual checklist against `wrangler dev` + `next dev` with `PAYWALL_ENFORCED=true`**

1. Sign up a fresh user. Confirm the org has a `trialing` Premium subscription and the Stripe subscription shows `missing_payment_method: cancel` under Trial settings.
2. In the Stripe dashboard (test mode), set the trial end to now. Confirm within a minute: DB row is `freeLegacy/canceled`, the trial-ended email is sent (Resend logs), the editor shows the "Your trial has ended" dialog once, and the `showFreeDowngradeNotice` flag flips to false on dismiss.
3. On that Free account: adding a sixth block from the picker opens the upgrade dialog; the API returns 402 if forced via curl. Creating a second page opens the dialog. Analytics tab shows the locked panel. The publish toggle cannot be switched off. "Begin page verification" opens the dialog.
4. Click Upgrade → Checkout with card `4242 4242 4242 4242`. Confirm the `customer.subscription.created` webhook flips the row to `premium/active`, every gate lifts on refresh, and the cached public page still renders.
5. Cancel from the billing portal at period end, then in Stripe cancel immediately. Confirm the cancellation email (not the trial email) is sent and gates return.
6. With `PAYWALL_ENFORCED=false`, repeat step 3 and confirm nothing is gated while `GET /billing/entitlements` still reports `tier: "free"`.

- [ ] **Step 3: Hand back**

Do not push or open a PR. Report the branch name (`feat/paywall-enforcement`), the commit list, and the results of Step 1 and any parts of Step 2 that were run.
