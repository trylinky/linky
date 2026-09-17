# Self-Serve Custom Domains on Vercel — Design Spec

**Date:** 2026-09-17
**Status:** Approved (brainstorm validated 2026-09-17)
**Depends on:** `2026-09-17-paywall-enforcement-design.md` (uses `getEntitlementsForOrganization` and `features.customDomain`)

## Summary

Custom domains are the headline Premium feature and the most common reason people pay for a link-in-bio tool. Today `Page.customDomain` exists, the public render honours it, and the frontend middleware already rewrites unknown hosts to the page route. What is missing is any way for a user to set one: the column is written by hand and the domain is attached to the Vercel project by hand.

This spec adds a Domain section to page settings that connects a domain through the **Vercel REST API** (the frontend already runs on Vercel, project `prj_26v4…`), shows the user exactly which DNS record to create, polls until it is live, and pauses the domain cleanly when the account drops to Free.

## Goals

- A Premium or Team user connects `links.example.com` or `example.com` to a page in under two minutes without contacting support.
- The UI shows the exact DNS record to add and reports status until the certificate is issued.
- Downgrade pauses the domain (visitors land on `lin.ky/slug`) and upgrade reactivates it with no re-setup.
- Existing manually provisioned domains keep working with no user action.

## Non-goals (v1)

- Multiple domains per page, or one domain shared across pages.
- Domain purchase or registrar integration.
- Custom domains on the Cloudflare side (the API worker on `api.lin.ky` is unaffected; public pages are served by the Next.js app on Vercel).
- Automatic removal from Vercel after a long downgrade (see §7; can be a follow-up cron).
- Per-domain analytics split. Analytics stay per page.

## How it works today

- `apps/frontend/middleware.ts`: any host that is not `NEXT_PUBLIC_ROOT_DOMAIN` is rewritten to `/${hostname}/unknown`, which lands on `app/[domain]/[slug]/page.tsx` with `slug = 'unknown'`.
- `apps/api/src/modules/pages/handlers/get-page-slug-or-domain.ts`: when `domain !== rootDomain` it looks the page up by `customDomain` and ignores `slug`.
- `app/[domain]/[slug]/page.tsx`: if the page has a `customDomain` and was reached via `lin.ky/slug`, it redirects to `//customDomain` **unconditionally**. This is a latent bug once domains can be half-configured: a domain that has not resolved yet would send every visitor to a dead host.
- `Page.customDomain` is `@unique`, which gives cross-organisation conflict detection for free.
- `Page` is looked up on the public path with cache tags `page-slug-{slug}-{domain}` and `page-id-{id}` (`apps/frontend/app/lib/actions/page-actions.ts`), invalidated by the API via `POST /api/revalidate`.
- Vercel requests only reach the app for hosts attached to the project. Attaching is the missing step.

## Decisions

| Question | Decision |
|---|---|
| Where the Vercel calls live | The API worker (`apps/api`). The Vercel token is a Worker secret, never in the Next.js app, consistent with moving secrets out of the frontend. |
| Data model | Extend `Page` with status columns rather than a new table. One domain per page, and `customDomain` is already on `Page` and read on the hot path. |
| Apex handling | If the user enters an apex (`example.com`), also attach `www.example.com` as a 308 redirect to the apex. If they enter a subdomain, attach only that. Users who want `www` as the canonical host enter `www.example.com`. |
| Status polling | On demand from the UI (SWR `refreshInterval` while pending) hitting one API route that refreshes from Vercel. No cron in v1. |
| Downgrade | Domain stays attached in Vercel and in the database. The public render checks entitlement and redirects the custom host to `https://lin.ky/{slug}`. Settings show "Paused". Upgrade reactivates instantly. |
| Backfill | Existing rows with `customDomain` set are marked `ACTIVE` by the migration; they were attached by hand. |

## 1. Data model

```prisma
enum CustomDomainStatus {
  PENDING_VERIFICATION // Vercel needs a TXT record (domain is used elsewhere on Vercel)
  PENDING_DNS          // Verified on Vercel, waiting for CNAME/A to point at Vercel
  ACTIVE               // Resolving to Vercel, certificate issued
  ERROR                // Vercel rejected it or we lost the attachment; see customDomainError
}

model Page {
  // existing
  customDomain             String?             @unique
  // new
  customDomainStatus       CustomDomainStatus?
  customDomainVerification Json?               // [{ type: 'TXT', domain, value }] from Vercel, only while PENDING_VERIFICATION
  customDomainError        String?
  customDomainCheckedAt    DateTime?
}
```

Migration backfills `customDomainStatus = 'ACTIVE'` where `customDomain IS NOT NULL`.

Invariant: `customDomainStatus` is non-null iff `customDomain` is non-null.

## 2. Vercel client

`apps/api/src/lib/vercel.ts`, plain `fetch` (Workers-safe, same approach as `aws4fetch` for S3). Configured from Worker secrets:

| Secret | Purpose |
|---|---|
| `VERCEL_API_TOKEN` | Token scoped to the team, with project-domain permissions |
| `VERCEL_PROJECT_ID` | `prj_26v4M9MsDkou2fIlXqFmARZk6krX` (the frontend project from `.vercel/project.json`) |
| `VERCEL_TEAM_ID` | `team_VtLnIS9GCt5wpuXPTHbJ2rE2` |

All calls append `?teamId=`. Endpoints (versions confirmed against the Vercel REST reference on 2026-09-17):

| Operation | Call |
|---|---|
| Attach | `POST /v10/projects/{projectId}/domains` body `{ name, redirect?, redirectStatusCode? }` → `{ verified, verification[] }` |
| Read | `GET /v9/projects/{projectId}/domains/{domain}` → `{ verified, verification[] }` |
| Verify | `POST /v9/projects/{projectId}/domains/{domain}/verify` → `{ verified }` |
| DNS state | `GET /v6/domains/{domain}/config?projectIdOrName={projectId}` → `{ misconfigured, configuredBy, recommendedCNAME[], recommendedIPv4[] }` |
| Detach | `DELETE /v9/projects/{projectId}/domains/{domain}` |

The client exposes a small interface so route tests can inject a fake:

```ts
export interface VercelDomainsClient {
  addDomain(name: string, opts?: { redirect?: string }): Promise<VercelProjectDomain>;
  getDomain(name: string): Promise<VercelProjectDomain | null>;
  verifyDomain(name: string): Promise<VercelProjectDomain>;
  getDomainConfig(name: string): Promise<VercelDomainConfig>;
  removeDomain(name: string): Promise<void>;
}
```

Error mapping from Vercel status codes, surfaced as `customDomainError` and in the API response:

| Vercel | User-facing |
|---|---|
| 400 "domain is not valid" | "That doesn't look like a valid domain." |
| 400 "latest production deployment was not successful" | Internal; alert Slack, tell the user to try again shortly. |
| 409 "already assigned to another Vercel project" / "owner already has domain" | "This domain is connected to another site on Vercel. Remove it there first." |
| 402 | Internal billing problem on our Vercel account; alert Slack. |
| anything else | "We couldn't connect this domain. Try again or contact support." |

## 3. Hostname validation

Pure function `normaliseHostname(input): { ok: true, hostname } | { ok: false, reason }` in `apps/api/src/modules/domains/hostname.ts`:

1. Trim, lowercase, strip a leading `https://`, `http://`, trailing `/`, and a trailing dot.
2. Convert to ASCII with `URL` punycode (`new URL('https://' + input).hostname`).
3. Reject if longer than 253 characters, any label longer than 63, fewer than two labels, or characters outside `[a-z0-9-.]`.
4. Reject if the hostname equals or ends with `.` + `NEXT_PUBLIC_ROOT_DOMAIN` (`lin.ky`), or ends with `.vercel.app`, `.vercel.dev`, `.workers.dev`, `.pages.dev`.
5. Reject IP literals and `localhost`.

`isApex(hostname)` = exactly two labels, or three where the second-level is a known public suffix pair (`co.uk`, `com.au`, `co.jp`, `com.br`, `co.nz`, `org.uk`). Good enough for v1; a full public-suffix list is a follow-up if support tickets show it is needed.

## 4. API routes

New module `apps/api/src/modules/domains/` mounted at `/pages/:pageId/domain`. All routes: `requireSession`, `checkUserHasAccessToPage(pageId, userId)`, and the Cloudflare rate-limit binding at 10 requests per minute per organisation for the mutating routes.

### `POST /pages/:pageId/domain` — connect

Body `{ hostname: string }`.

1. `normaliseHostname`; 400 on failure.
2. `getEntitlementsForOrganization(session.activeOrganizationId)`; if `!features.customDomain` → 402 `UPGRADE_REQUIRED`, `feature: 'customDomain'` (same shape as the paywall spec).
3. If the page already has a domain → 409 "Remove the current domain first."
4. If another page has this `customDomain` → 409 "This domain is already connected to a Linky page." (Also caught by the unique index; check first for a clean message.)
5. Vercel `addDomain(hostname)`. If `isApex`, also `addDomain('www.' + hostname, { redirect: hostname })`; failure of the `www` attach is logged, not fatal.
6. Derive status: `verified === false` → `PENDING_VERIFICATION` with `verification` stored; else `PENDING_DNS`.
7. Write `customDomain`, `customDomainStatus`, `customDomainVerification`, `customDomainCheckedAt`, clear `customDomainError`.
8. `revalidatePageCache([pageIdCacheTag(pageId), pageSlugCacheTag('unknown', hostname)])` to drop any cached 404 for that host.
9. PostHog `custom-domain-connect-started`. Return the status payload (§4, "Response shape").

### `GET /pages/:pageId/domain` — status (refreshes from Vercel)

1. No domain → `{ domain: null }`.
2. If `PENDING_VERIFICATION`: `verifyDomain`; on `verified: true` move to `PENDING_DNS`.
3. If `PENDING_DNS` or `ACTIVE`: `getDomainConfig`; `misconfigured === false` → `ACTIVE`, else `PENDING_DNS`. (An `ACTIVE` domain whose DNS later breaks reverts to `PENDING_DNS` so the UI can say so.)
4. If `getDomain` returns null (detached out-of-band in the Vercel dashboard) → `ERROR`, `customDomainError = 'Domain is no longer attached'`.
5. Persist status and `customDomainCheckedAt`. On a transition into `ACTIVE`: `revalidatePageCache([pageIdCacheTag(pageId)])`, Slack "Custom domain activated: {hostname} ({pageId})", PostHog `custom-domain-activated`.
6. Throttle: if `customDomainCheckedAt` is under 5 seconds old, return the stored state without calling Vercel. This keeps a polling UI from hammering the Vercel API.

Response shape:

```ts
{
  domain: {
    hostname: string;
    status: 'PENDING_VERIFICATION' | 'PENDING_DNS' | 'ACTIVE' | 'ERROR' | 'PAUSED';
    error: string | null;
    checkedAt: string;
    records: Array<{ type: 'TXT' | 'CNAME' | 'A'; name: string; value: string }>;
    isApex: boolean;
    entitled: boolean;
  } | null
}
```

`PAUSED` is not stored; it is reported when the stored status is `ACTIVE` and `!features.customDomain`. `records` is computed:

- `PENDING_VERIFICATION`: the TXT rows from `customDomainVerification` (`name` is `_vercel` at the apex).
- `PENDING_DNS`, apex: `A` at `@` with `recommendedIPv4[rank 1]` (fallback `76.76.21.21`).
- `PENDING_DNS`, subdomain: `CNAME` at the subdomain label with `recommendedCNAME[rank 1]` (fallback `cname.vercel-dns.com`).
- `ACTIVE`: same records, shown as reference.

### `DELETE /pages/:pageId/domain` — disconnect

1. Vercel `removeDomain(hostname)`; if apex also `removeDomain('www.' + hostname)`. A 404 from Vercel is treated as success.
2. Null the five columns.
3. `revalidatePageCache([pageIdCacheTag(pageId), pageSlugCacheTag('unknown', hostname)])`.
4. PostHog `custom-domain-removed`.

Allowed on any tier so a downgraded user can remove a paused domain.

### Changes to existing routes

- `get-page-load.ts`: select and return `customDomainStatus` alongside `customDomain`.
- `getPageSettings` (`GET /pages/:pageId/settings`): include `customDomain` and `customDomainStatus` so the settings sidebar can render the initial state without a second round-trip.

## 5. Public render changes (`apps/frontend/app/[domain]/[slug]/page.tsx`)

Let `isCustomHost = page.customDomain === decodeURIComponent(params.domain)`.

1. **Custom host, not entitled** (`!page.isPaid`): `redirect('https://{ROOT_DOMAIN}/{slug}')` with 307. This is the downgrade behaviour. The page keeps serving at `lin.ky/slug`.
2. **Root host, page has domain**: redirect to `//customDomain` **only if** `customDomainStatus === 'ACTIVE' && page.isPaid`. Fixes the latent dead-redirect bug for pending or paused domains.
3. `canonicalUrlFor` and `generateMetadata` follow the same rule: the canonical is the custom domain only when it is `ACTIVE` and entitled.
4. `shouldIndexPage` already treats `customDomain` as an indexing signal; pass `customDomain` only when `ACTIVE` so a pending domain on a Free page does not flip it to indexable.

`get-page-slug-or-domain.ts` is unchanged: it resolves any host with a matching `customDomain` row, and the render step decides what to do with it.

Cache: the `page-id-{id}` tag is already on every public read, so the revalidations in §4 cover all states.

## 6. Frontend

### Settings UI

New `EditPageSettingsDomain.tsx` under `apps/frontend/app/components/EditPageSettingsDialog/`, rendered by `SidebarPageSettings.tsx` below the general form as a card titled **Custom domain**. It uses SWR on `/pages/{pageId}/domain` with `refreshInterval` of 10 seconds while status is `PENDING_*`, off otherwise.

States:

| State | UI |
|---|---|
| Locked (`!entitled`, no domain) | Input disabled, "Premium" pill, Connect opens `UpgradeDialog` with `feature: 'customDomain'`. |
| Empty | Input with placeholder `links.yourdomain.com`, Connect button. Helper text: "Use a subdomain like links.yourdomain.com, or your root domain." |
| `PENDING_VERIFICATION` | "Verify ownership" step. Table of the TXT record with copy buttons. "Checking automatically" spinner. Remove button. |
| `PENDING_DNS` | "Point your DNS" step. Table of the A or CNAME record with copy buttons. Note: "DNS changes can take up to an hour." Spinner. Remove button. |
| `ACTIVE` | Green check, the domain as a link, "Certificate issued". Remove button (confirm dialog). |
| `PAUSED` | Amber, "Paused on Free. Visitors are sent to lin.ky/{slug}." Upgrade button (`UpgradeDialog`) and Remove. |
| `ERROR` | Red, the error message, Retry (calls `POST` again after Remove) and Remove. |

For apex domains the record table has two rows: the `A` record at `@` and a `CNAME` for `www` pointing at `cname.vercel-dns.com`, with a note "www.example.com will redirect to example.com." Both must be created at the registrar; the `www` attach on Vercel only handles the redirect once DNS resolves. The `records` array in the API response includes the `www` row when `isApex` is true.

### Editor affordance

The page header in the editor (where the `lin.ky/slug` link is shown) shows the custom domain instead when `ACTIVE`.

## 7. Downgrade and reactivation

No webhook work. Entitlement is evaluated at render time and in `GET /domain`. When a subscription lapses:

- Visitors to the custom host are redirected to `lin.ky/slug` (§5.1).
- `lin.ky/slug` stops redirecting to the custom host (§5.2).
- Settings show `PAUSED`.

When they upgrade, the next request after `revalidatePageCache` (triggered by the paywall spec's `syncSubscriptionFromStripe` on transition to `active`; that function must revalidate `page-id-*` for every page in the org) serves the custom host again. The domain never leaves Vercel, so there is no DNS or certificate re-issue.

Follow-up, not v1: a scheduled Worker (`wrangler` `triggers.crons`) that detaches domains paused for more than 90 days and emails the owner first.

## 8. Operations

- **Vercel token.** Create a team-scoped token with the minimum scope that allows project domain management. Store with `wrangler secret put` for both `staging` and production environments (the worker already has a staging environment per the Hono migration follow-ups).
- **Vercel project must have a successful production deployment** or `addDomain` returns 400. The frontend already does.
- **DNS for `lin.ky` is on Cloudflare** and unaffected; user domains point straight at Vercel.
- **Rate limit** the Vercel client at the route layer (§4) and never call Vercel from the public render path.
- **Slack** on every activation and on every 402/5xx from Vercel (existing `sendSlackMessage`).
- **Sentry** `captureException` on unexpected Vercel responses, with the hostname and page id as extras.

## 9. Self-hosting

`docs/self-hosting.md` gains a short section: custom domains require the three Vercel variables; when unset, the API returns 501 `NOT_CONFIGURED` from the domain routes and the settings card shows "Custom domains are not enabled on this instance." Nothing else in the product depends on Vercel.

## 10. Testing

- **Unit**: `hostname.test.ts` table-driven (trailing dot, uppercase, punycode, `lin.ky` subdomain rejection, IP literal, apex detection including `co.uk`). `status.test.ts` for the pure "Vercel responses → status + records" derivation.
- **Route tests** (existing `app.request` + DB-backed pattern) with an injected fake `VercelDomainsClient`: connect on Free → 402; connect on Premium → row written with `PENDING_DNS`; connect apex → two `addDomain` calls with the second carrying `redirect`; status poll flips `PENDING_DNS → ACTIVE` when the fake reports `misconfigured: false` and triggers revalidation; delete clears columns and calls `removeDomain` twice for apex; `getDomain` returning null → `ERROR`.
- **Render tests**: `page.tsx` redirect matrix (custom host × entitled × status) as a pure helper `resolveDomainRedirect(page, hostParam)` with unit tests, called from the page component.
- **Manual** before launch: connect a real subdomain from a registrar the team controls; connect an apex; connect a domain already on another Vercel project (expect the TXT flow); remove; downgrade a test org and confirm the redirect; upgrade and confirm reactivation.

## 11. Risks

- **Vercel API drift.** Endpoint versions are pinned in the client; the OpenAPI spec at `openapi.vercel.sh` is the reference if a call starts failing.
- **Domains attached out-of-band.** The backfill assumes every existing `customDomain` is attached in Vercel. Verify with a one-off list of project domains before running the migration; any row not present becomes `ERROR` on first poll, which is the correct signal.
- **Users pointing DNS before clicking Connect.** Harmless; Vercel simply reports configured on the first poll.
- **Redirect loops.** `lin.ky/slug → custom` requires `ACTIVE && entitled`; `custom → lin.ky/slug` requires `!entitled`. The two conditions cannot both hold, so no loop is possible.

## 12. Decisions from review (2026-09-17)

- Apex domains get `www` attached automatically as a 308 redirect. (§4, §6)
- No per-org cap on custom domains. One domain per page, bounded only by the existing 100-pages abuse limit.
