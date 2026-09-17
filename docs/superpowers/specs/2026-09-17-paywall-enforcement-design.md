# Paywall Enforcement — Design Spec

**Date:** 2026-09-17
**Status:** Approved (brainstorm validated 2026-09-17)

## Summary

Linky advertises a Premium tier (custom domains, unlimited pages, unlimited blocks, verification badge, private pages, analytics) but enforces almost none of it. Every signup gets a 14-day Premium trial; when it ends the API sends an email and a Slack ping and the product does not change. The only real paid effect today is search indexing.

This spec introduces a single **entitlements** resolver in the API, enforces the Free limits server-side at every mutation that matters, surfaces an upgrade prompt in the editor at each locked feature, and makes the trial actually end. It also fixes the plan-id mismatch and the broken free-to-premium upgrade path that would otherwise stop anyone from paying once they hit the wall.

## Goals

- A user whose trial ends without paying lands on a working Free account with clear, enforced limits and an obvious upgrade path.
- Every limit shown on the pricing page is enforced by the API, not just the UI.
- Paying (trial → Premium, Free → Premium) works end to end and is reflected in the database within seconds via Stripe webhooks.
- The team can measure conversion: every paywall hit and upgrade emits a PostHog event.

## Non-goals (v1)

- Price changes or annual billing (item 3 in the strategy discussion; separate spec).
- Team-plan seat enforcement changes (existing `hasAvailableSeat` stays as is).
- Google Analytics / Facebook Pixel features listed on the Team tier (remove from copy or build separately).
- Self-serve custom domains (see `2026-09-17-custom-domains-vercel-design.md`; that spec consumes the entitlements resolver defined here).
- Retroactively hiding or deleting content on existing accounts that exceed the limits.

## Decisions made during brainstorm

| Question | Decision |
|---|---|
| Post-trial behaviour | **Soft paywall.** Page stays live. Account drops to Free: 1 page, 5 blocks per page, no analytics, no private pages, no custom domain, no verification badge. |
| Existing accounts over the limits | **Cap going forward.** Nothing removed or hidden. Cannot add blocks or pages beyond the cap. Analytics and private pages lock immediately. |
| Where enforcement lives | API (Hono worker) for every mutation. Frontend gates are UX only. Page-settings server actions that currently write Prisma directly from the frontend move behind API routes so the gate cannot be bypassed. |
| Source of truth for "is paid" | `Subscription.plan` **and** `Subscription.status` together, via one resolver. Today `get-page-load` uses plan only and `current-user-subscription` uses status only; they disagree for `past_due`. |
| Trial expiry mechanics | Cancel the Stripe subscription at trial end instead of letting Stripe dun a card-less customer. The existing `customer.subscription.deleted` path then flips the row to Free. |

## Findings that shape the design

1. **Plan id mismatch.** The database, every API handler and every Stripe handler use `freeLegacy`. `packages/common/src/billing/plans.ts` and `apps/frontend/lib/plans.ts` use `legacyFree`. `getNextPlan('freeLegacy')` returns `null`, so the frontend never knows a Free user's next plan. Fix: standardise on `freeLegacy` and export the `Plan` type from `@trylinky/common`.
2. **Free → Premium upgrade is broken.** `upgrade-to-premium.ts` calls `stripe.subscriptions.update` with `items: [{ id: <database subscription id> }]`. Stripe expects a subscription-item id (`si_…`), so this call fails for every caller. Separately, `handleSubscriptionCreated`'s `premium` branch only posts to Slack and never writes the plan to the database.
3. **`past_due` is ambiguous.** A trial that ends without a card goes `trialing → active → past_due` (Stripe creates an invoice that immediately fails). A paying customer with an expired card also goes `active → past_due`. The first should downgrade now; the second should keep access while Stripe retries.
4. **Limits are only abuse caps.** Pages: 100 per org. Blocks: 100 per page. Neither is tied to plan.
5. **Analytics gate is age-only.** `GET /analytics/pages/:pageId` checks ownership and a 3-day minimum age. No plan check.
6. **Private pages have no gate.** `updateGeneralPageSettings` (frontend server action, direct Prisma write) toggles `publishedAt` for anyone.
7. **Verification requests have no gate.** `apps/frontend/app/lib/actions/verification.ts` writes directly via Prisma.

## 1. Entitlements resolver

New module `apps/api/src/modules/billing/entitlements.ts`. Pure function plus a thin Prisma loader so it is unit-testable without a database.

```ts
export type Tier = 'free' | 'premium' | 'team';

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

// Free is marketed as "5 blocks". Every page starts with one header block,
// so the enforced per-page limit is 6: the header plus five the user adds.
export const FREE_LIMITS = { pages: 1, blocksPerPage: 6 };
export const PAID_LIMITS = { pages: 100, blocksPerPage: 100 }; // existing abuse caps

export function resolveTier(sub: Pick<Subscription, 'plan' | 'status' | 'trialEnd'> | null): Tier
export function resolveEntitlements(sub): Entitlements
export async function getEntitlementsForOrganization(organizationId: string): Promise<Entitlements>
```

`resolveTier` rules, in order:

1. No subscription row → `free`.
2. `plan` not in `premium | team` → `free`.
3. `status` in `active | trialing | past_due` → the plan's tier. `past_due` keeps access because, once §3 ships, only a previously paying customer with a failed card can be in that state, and Stripe is still retrying. (Legacy trials stuck in `past_due` are cancelled by the backfill script in §3, so they never reach this rule.)
4. Anything else (`canceled`, `unpaid`, `incomplete`, `incomplete_expired`) → `free`.

Site admins (`User.role`, via `isAdminUser`) are treated as `team` everywhere the resolver is consulted, preserving the existing admin exemption on page count.

Every existing ad-hoc check is replaced by this resolver:

- `get-page-load.ts` `isPaid` → `resolveTier(...) !== 'free'`.
- `current-user-subscription.ts` keeps its response shape but derives `plan`/`status` from the resolver so the UI and the API agree. It gains a `tier` field.
- `should-index-page.ts` input `isPaid` is unchanged (already a boolean fed from `get-page-load`).

## 2. Server-side gates

Every gate returns the same error shape so the frontend can route it to one upgrade modal:

```json
{ "error": { "code": "UPGRADE_REQUIRED", "feature": "blocks", "message": "...", "label": "Upgrade to Premium to add more blocks" } }
```

Status `402 Payment Required`. Existing 400-with-message callers (`EditWrapper`, `NewPageDialog`) already toast `error.message`, so nothing breaks before the frontend work lands.

| Gate | Where | Rule |
|---|---|---|
| Page count | `POST /pages` (`apps/api/src/modules/pages/index.ts`) | Replace the hard-coded 100 with `entitlements.limits.pages`. Count excludes soft-deleted pages, as today. |
| Block count | `POST /blocks/add` (`apps/api/src/modules/blocks/index.ts`) | Replace the hard-coded 100 with `entitlements.limits.blocksPerPage` (6 on Free). A new page is created with one `header` block, so Free users can add five more, matching the "5 blocks" marketing copy. |
| Analytics | `GET /analytics/pages/:pageId` | If `!features.analytics` return `UPGRADE_REQUIRED` with `feature: "analytics"` **before** the 3-day check. Free users see the upgrade panel, never a chart. |
| Private pages | New `POST /pages/:pageId/settings` (moved from the frontend server action, see §4) | Setting `published: false` when `!features.privatePages` returns `UPGRADE_REQUIRED` with `feature: "privatePages"`. Setting `published: true` is always allowed so a downgraded user can re-publish an old private page. |
| Verification | New `POST /verification-requests` (moved from frontend server action) | `!features.verification` → `UPGRADE_REQUIRED`. Badges are revoked on downgrade (see below). |
| Custom domain | Defined in the custom-domains spec | Consumes `features.customDomain`. |

Downgrade side effects are deliberately minimal (soft paywall): no pages are unpublished, no blocks hidden. Two things do change on a drop to Free:

- **Verification badges are revoked.** `syncSubscriptionFromStripe` (§4) sets `verifiedAt = null` on every page in the org when the resolved tier becomes `free`, and cancels any `PENDING` `VerificationRequest` for those pages. The badge is a Premium feature and its trust value depends on it being current. Re-upgrading does not restore it automatically; the user submits a new request, which admins can approve quickly since the history is kept on `VerificationRequest`.
- **Custom domains pause** (other spec).

## 3. Making the trial actually end

Today's flow: `trialing → active → past_due` (invoice fails) → Stripe Smart Retries for up to three weeks → eventually `canceled` → `handleSubscriptionDeleted` sets `plan: freeLegacy`. During those weeks `get-page-load` still reports paid.

New flow:

1. `createNewSubscription` (`apps/api/src/modules/billing/utils/create-new-subscription.ts`) passes `trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }` when creating the trial subscription. Stripe cancels the subscription itself the moment the trial ends with no card on file.
2. `handleSubscriptionDeleted` becomes the single downgrade path. It already sets `status: 'canceled', plan: 'freeLegacy'`. It gains a branch: the subscription is an **unconverted trial** iff `trial_end` is set and `ended_at <= trial_end + 60s` (it ended at the moment the trial did, so nothing was ever paid). For those, send `sendTrialEndedEmail` instead of `sendSubscriptionDeletedEmail`. `previous_attributes` is not used because Stripe does not guarantee it on `deleted` events.
3. `handleTrialExpired` and its `previous_attributes.status === 'active' && status === 'past_due'` detection in `stripe/index.ts` are removed. `handleSubscriptionCancelled` (sets `cancelAtPeriodEnd`) stays.
4. `handleTrialWillEnd` (3 days before) stays. Its email copy is updated to name what locks on Free (see §6).

Existing trials created before this ships still have `create_invoice` behaviour. A one-off script (`apps/api/scripts/backfill-trial-end-behaviour.ts`, run once against production) updates every `status: 'trialing'` Stripe subscription to the new `end_behavior`. Trials already in `past_due` at ship time are cancelled by the same script so they downgrade immediately.

## 4. Fixing the upgrade path

### Trial → Premium (has a card)

Unchanged. `upgrade-eligibility` → `addPaymentMethod` (billing portal) → `completeTrial` → `upgrade-trial` sets `trial_end: 'now'`, DB `status: 'active'`. Verified working today.

### Free → Premium (subscription was cancelled)

`POST /billing/upgrade/premium` is rewritten to create a **Stripe Checkout Session**:

```ts
stripe.checkout.sessions.create({
  mode: 'subscription',
  customer: subscription.stripeCustomerId,
  line_items: [{ price: prices[env].premium, quantity: 1 }],
  subscription_data: { metadata: { organizationId } },
  success_url: `${APP_FRONTEND_URL}/edit?upgraded=premium`,
  cancel_url: `${APP_FRONTEND_URL}/edit?showBilling=true`,
  allow_promotion_codes: true,
});
```

Response: `{ url }`. Frontend redirects to it. This replaces the broken `subscriptions.update` call.

### Webhook sync

`handleSubscriptionCreated`'s `premium` branch is replaced by a shared `syncSubscriptionFromStripe(stripeSubscription)` in `apps/api/src/modules/billing/utils/sync-subscription.ts`:

- Resolves the org via `subscription_data.metadata.organizationId`, falling back to `stripeCustomerId` lookup.
- Derives `plan` from the price id (existing `prices` map), `status`, `periodStart`, `periodEnd`, `cancelAtPeriodEnd`, `trialStart`, `trialEnd`, `stripeSubscriptionId`.
- Upserts the `Subscription` row keyed on `referenceId` (org id). One org, one row, as today.

`customer.subscription.updated` calls `syncSubscriptionFromStripe` unconditionally in addition to the existing cancellation branch. This is what makes `past_due → active` (card fixed) and `trialing → active` (paid) land in the database without bespoke handlers.

Whenever `syncSubscriptionFromStripe` changes the resolved tier for an org (in either direction), it calls `revalidatePageCache` with `pageIdCacheTag` for every non-deleted page in that org. Public pages read `isPaid` from the cached page load, so without this a downgrade or upgrade would not reach visitors until the daily background refresh. The custom-domains spec depends on this.

On a transition **to** `free` it also runs the downgrade side effects from §2: clear `verifiedAt` on the org's pages and cancel pending verification requests. `handleSubscriptionDeleted` routes through the same function so there is exactly one place downgrade side effects live.

The `team` branch of `handleSubscriptionCreated` is unchanged (it creates a new org).

### Team

Unchanged.

## 5. Frontend

### Entitlements hook

`GET /billing/entitlements` (new, session-auth, returns the `Entitlements` object for `session.activeOrganizationId`). Frontend hook `useEntitlements()` in `apps/frontend/lib/hooks/use-entitlements.ts` wraps it with SWR. Optimistic: the UI hides nothing while loading.

### Upgrade modal

One component, `UpgradeDialog`, in `apps/frontend/app/components/UpgradeDialog.tsx`. Wraps the existing `PricingTable` from `@trylinky/common` (the same one behind `?showBilling=true`). Takes `feature` and `source` props for copy and analytics. Title copy per feature:

| feature | Title |
|---|---|
| `blocks` | "You've used your 5 free blocks" |
| `pages` | "Free includes one page" |
| `analytics` | "See who's visiting" |
| `privatePages` | "Keep pages private with Premium" |
| `verification` | "Get verified" |
| `customDomain` | "Use your own domain" |

A tiny `useUpgradeDialog()` context lets any component open it. Every 402 `UPGRADE_REQUIRED` response from `InternalApi` opens it automatically with the returned `feature`; components do not need to handle it individually.

### Gates in the editor (UX layer only; the API is the real gate)

- **Block picker** (`EditWrapper.tsx`): when `blocks.length >= limits.blocksPerPage`, the add-block button shows a lock icon and opens `UpgradeDialog` instead of the picker.
- **New page** (`NewPageDialog.tsx`): when `pageCount >= limits.pages`, the trigger opens `UpgradeDialog`.
- **Analytics** (`SidebarAnalytics.tsx`): on `UPGRADE_REQUIRED` render a locked panel with a blurred placeholder chart and an Upgrade button. Distinct from the existing `NOT_ENOUGH_DATA` state.
- **Publish toggle** (`EditPageSettingsGeneralForm.tsx`): when `!features.privatePages`, the toggle is disabled with a lock and a "Premium" pill; clicking opens `UpgradeDialog`.
- **Verification** (`VerificationRequestDialog.tsx`): same pattern.

### Trial and plan status

- `UserWidget.tsx` already shows "Upgrade to Premium" for `freeLegacy` and a trial-days badge exists in the billing dialog. Add a persistent editor banner when `trial.active && trial.daysLeft <= 3`: "Your Premium trial ends in N days. Add a card to keep analytics, unlimited blocks and private pages." with an Upgrade button.
- Post-trial, first editor load after downgrade shows a one-time dialog (flag `UserFlag.key = 'showFreeDowngradeNotice'`, set true by the downgrade side effects and false by `POST /flags/hide-free-downgrade-notice`, mirroring `showOnboardingTour`): "Your trial has ended. You're now on Free. Here's what changed." with the limits listed and an Upgrade button.

### Server actions moved behind the API

`updateGeneralPageSettings` and the verification request action currently write Prisma directly from the Next.js app. They become thin clients of new API routes (`POST /pages/:pageId/settings`, `POST /verification-requests`) so the gate is enforced once, in the worker. This also removes two of the frontend's direct Prisma writes, in line with the direction of moving secrets and data access into the API.

## 6. Emails

Existing templates in `packages/notifications/emails` are updated, not added:

- `trial-ending-soon.tsx` (sent by `handleTrialWillEnd`, 3 days out): list the four things that lock on Free, one-click "Add a card" link to the billing portal.
- `trial-finished.tsx` (now sent from `handleSubscriptionDeleted` on the trial branch): "You're on Free" framing, what still works, upgrade link to Checkout.

No new email cadence in v1.

## 7. Analytics events (PostHog, server-side where possible)

| Event | Where | Properties |
|---|---|---|
| `paywall-hit` | API, every `UPGRADE_REQUIRED` response | `feature`, `tier`, `organizationId` |
| `upgrade-dialog-opened` | Frontend `UpgradeDialog` | `feature`, `source` |
| `checkout-started` | API `upgrade/premium` | `organizationId`, `fromTier` |
| `subscription-activated` | API `syncSubscriptionFromStripe` on transition to `active` with plan premium/team | `plan`, `fromStatus` |
| `trial-ended-unconverted` | API `handleSubscriptionDeleted` trial branch | `organizationId` |

These four events are enough to compute trial-to-paid conversion and which feature drives upgrades.

## 8. Data changes

- No schema migration required for the resolver, gates or Checkout flow. `Subscription` already carries `plan`, `status`, `trialEnd`, `periodEnd`.
- New `UserFlag` key `showFreeDowngradeNotice` (existing key/value table, no migration).
- `packages/common/src/billing/plans.ts`: `Plan = 'freeLegacy' | 'premium' | 'team'`; `Tier` and `Entitlements` types exported from here so the frontend and API share them.

## 9. Rollout

1. Ship the plan-id fix, resolver, `GET /billing/entitlements`, Checkout upgrade and webhook sync **without** gates. Verify in production that `tier` matches expectations for a sample of orgs (Slack message on mismatch between old `isPaid` and new resolver for one week is a cheap check).
2. Ship the frontend upgrade dialog and gates behind an env flag `PAYWALL_ENFORCED` read by the API. Default off. Turn on in development and staging.
3. Run the trial backfill script.
4. Flip `PAYWALL_ENFORCED` on in production. Announce to existing Free users by email the same day (copy out of scope here).
5. Remove the flag after two weeks.

## 10. Testing

- **Unit** (`entitlements.test.ts`): table-driven cases for `resolveTier` covering every `status` × `plan` × trial combination in §1, including the paid-then-past-due case.
- **Integration** (existing DB-backed Vitest setup, `dotenvx` + `app.request`): `POST /pages` and `POST /blocks/add` return 402 at the Free cap and 200 under it; analytics returns 402 for Free and passes for Premium; settings route refuses `published: false` on Free; a sync to `free` clears `verifiedAt` and cancels pending verification requests for the org's pages only.
- **Webhook** (`stripe/index.test.ts` pattern): a `customer.subscription.deleted` event with `previous_attributes.status: 'trialing'` sends the trial email and sets `freeLegacy`; a `customer.subscription.updated` event `past_due → active` restores `active`. Stripe client is injected/mocked, matching the existing `vi.mock('@/lib/stripe')` convention.
- **Manual checklist** before flipping the flag: sign up, hit each gate on a Free account, complete Checkout with a test card, confirm every gate lifts within a webhook round-trip, cancel in the portal, confirm downgrade.

## 11. Risks

- **Existing `past_due` trials.** The backfill script cancels them; they downgrade on flag flip. Expected and intended, but it is the one moment users see a change without acting. The announcement email covers it.
- **Webhook ordering.** `syncSubscriptionFromStripe` is idempotent (upsert from the full Stripe object), so out-of-order or duplicate events converge.
- **Frontend still has direct Prisma access** for other reads. Only the two write paths in scope move; the rest is unchanged.

## 12. Decisions from review (2026-09-17)

- Free block cap is five **addable** blocks: enforced limit 6 including the default header. (§1, §2)
- Verification badges **are** revoked on downgrade. (§2, §4)
