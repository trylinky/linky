# Final whole-branch review — API migration to Cloudflare Workers + Hono

Branch: `feat/api-cloudflare-hono-migration` (30 commits, `ef5b87e..55c761a`)
Reviewer scope: cross-task seams, spec completeness, route coverage, deferred-item triage,
whole-surface security posture, operational readiness. Per-task findings deliberately not re-litigated.
Review was read-only; no tracked file was modified, no deploy or secret command was run.

---

## A. Merge verdict — **not ready** (two blockers, both small fixes)

One route that existed before the migration is registered but **unreachable**, producing a silent
production 404 on an endpoint the editor depends on. Separately, an auth-abuse control was weakened
by roughly 33x on the sign-in and sign-up endpoints as a side effect of the rate-limiting redesign.

Everything else stands up. The build, bindings, environment coverage, ALS scoping, cookie
configuration, CORS behaviour, IP resolution and the full response surface all check out, and the
suite is green (128 tests, typecheck, lint, clean tree). Both blockers are a few lines each; once
they land, this is ready to merge.

### What was verified sound

- **ALS scoping is genuinely universal.** `requestContext` is registered as `app.use('*', …)` at
  `apps/api/src/app.ts:36` and wraps the entire downstream chain through `next()`, so all 59 routes
  — including `/api/auth/*` and the 404 path — execute inside both the Prisma store
  (`apps/api/src/lib/prisma.ts:41`) and the better-auth store
  (`apps/api/src/middleware/request-context.ts:29`). No mounted route can reach the
  `resolveClient()` fallback.
- **Cookie configuration survives cutover.** `crossSubDomainCookies` is gated on
  `process.env.NODE_ENV === 'production'` (`apps/api/src/lib/auth.ts:76`). Wrangler's bundler
  defines `NODE_ENV` as `"production"` at build time — confirmed in the dry-run output, where the
  branch is emitted as `crossSubDomainCookies: true ? { … domain: ".lin.ky" }`. Sessions will
  survive the flip and a rollback, as spec §6 requires.
- **CORS and `Cache-Control` apply to error responses.** A concern with the Hono port was that
  `hono/cors` and `cacheControl` both set headers around `await next()`, which would skip them when
  a handler throws `HTTPException`. Probed directly: 200, 401-via-throw and 404 all carry
  `Access-Control-Allow-Origin`, `Access-Control-Allow-Credentials`, `Vary: Origin` and
  `Cache-Control: no-store, must-revalidate`. `hono/cors` sets headers before `next()`. No finding.
- **Exactly one IP-resolution implementation** (`apps/api/src/modules/analytics/utils.ts:29`),
  CF-Connecting-IP first, then the *rightmost* XFF hop. Matches the pre-migration precedence.
- **Operational readiness.** `wrangler deploy --dry-run` succeeds: 9723 KiB raw / **2450 KiB gzip**,
  comfortably under the 10 MB compressed Worker limit. Bindings resolve (`HYPERDRIVE`,
  `AUTH_RATE_LIMIT`, 4 vars). All 43 distinct `process.env` reads are accounted for — 4 in
  `wrangler.jsonc` `vars`, `NODE_ENV` build-defined, `DATABASE_URL` deliberately absent in
  production (so `resolveClient()` fails loudly rather than bypassing Hyperdrive), the remaining 37
  supplied as secrets per the cutover runbook.
- **Spec completeness.** Every §1–§7 section is delivered or has its deviation recorded in the
  ledger: the §2 rate-limiting rewrite (KV → native binding), the §6 correction that production
  Postgres is PlanetScale rather than Render-private, and the §5 smoke-script coverage gap (upload
  round-trip and real-session checks deferred to the manual cutover step, documented inline in
  `apps/api/scripts/smoke.ts`). No spec promise is undelivered.

---

## B. Findings

Restricted to things a per-task, single-diff review structurally could not have caught.

### CRITICAL — `GET /blocks/enabled-blocks` is shadowed and unreachable

**Where.** `apps/api/src/modules/blocks/index.ts`, registration block at lines 273–277:

```
273  blocksRoutes.post('/add', ...postCreateBlockHandlers);
274  blocksRoutes.get('/:blockId', getBlockHandler);          <-- shadows line 276
275  blocksRoutes.delete('/:blockId', deleteBlockHandler);
276  blocksRoutes.get('/enabled-blocks', getEnabledBlocksHandler);   <-- never reached
277  blocksRoutes.post('/:blockId/update-data', ...updateBlockDataHandlers);
```

`GET /:blockId` at **line 274** shadows `GET /enabled-blocks` at **line 276**.

**Why Hono differs from Fastify.** This is a router-semantics difference, not path drift.

- Fastify uses `find-my-way`, a radix tree. At each node it tries the **static** child before the
  **parametric** child, so `/blocks/enabled-blocks` matched the static `enabled-blocks` segment
  regardless of the order the two routes were registered in. Static-beats-param is a property of
  the tree walk.
- Hono's default `SmartRouter`/`RegExpRouter` resolves competing patterns by **registration order**
  — first registered wins. Because `/:blockId` is registered two lines earlier, it captures the
  request and `blockId` binds to the literal string `"enabled-blocks"`.

**What it returns today.** The request falls into `getBlockHandler`
(`apps/api/src/modules/blocks/index.ts:71-87`):

- With a valid session: `requireSession` passes, `getBlockById('enabled-blocks')`
  (`apps/api/src/modules/blocks/service.ts:6`) runs `prisma.block.findUnique({ where: { id: 'enabled-blocks' } })`.
  `Block.id` is `String @id @default(uuid())` (`packages/prisma/prisma/schema.prisma:195`), which maps
  to a Postgres `text` column, so the query does not error — it returns `null`. `!block?.page.publishedAt`
  is then true and `session.activeOrganizationId !== undefined`, so the handler returns
  **`404 {"error":{"message":"Block not found"}}`** (line 79).
- Without a session: `requireSession` throws `HTTPException(401)` before any of that.

**What it should return.** `getEnabledBlocksHandler`
(`apps/api/src/modules/blocks/index.ts:155-172`) — a `200` with the `Blocks[]` array from
`getEnabledBlocks(dbUser)` (`apps/api/src/modules/blocks/service.ts:63-75`), or `401 []` when there
is no user.

**Who calls it.** Three call sites, all in the editor:

- `apps/frontend/app/components/SidebarBlocks.tsx:12` — the SWR key that populates the block picker
  in the editor sidebar. A 404 leaves `enabledBlocks` undefined and the picker empty, so **no block
  of any type can be added to a page**.
- `apps/frontend/app/lib/actions/blocks.ts:4` — the server-side fetch via `apiServerFetch`.
- `apps/frontend/app/e/[slug]/layout.tsx:67` — seeds the SWR fallback cache for that same key.

**How confirmed.** By **running it**, not by reading. I wrote a throwaway probe under the scratchpad
that imports the real `hono@4.13.0` from `apps/api/node_modules/hono` and registers the five routes
in the exact order above, then issued `GET /blocks/enabled-blocks`. It resolved to the parametric
handler and echoed `param:enabled-blocks`. The same probe confirmed the `pages` module's
`/internal/slug-or-domain` and `/internal/slug-availability` routes resolve correctly (their
competing param routes have differing final segments, so there is no conflict there).

**Fix.** Move line 276 above line 274, so `/enabled-blocks` is registered before `/:blockId`. No
other change is needed. I checked all 20 modules for the same shape: **`blocks` is the only module
with a static path registered after a parametric route that could match it.**

**Why per-task review missed it.** Task 16's reviewer enumerated route *prefixes and paths* against
the Fastify registrations and correctly found zero drift — the route is registered, with the right
method and the right path. The defect only exists in the interaction between two registrations and
only manifests under Hono's resolution order, which a set-comparison of paths cannot surface.

### IMPORTANT — better-auth's stricter per-endpoint throttles were dropped, not replaced

**Before.** `git show ef5b87e:apps/api/src/lib/auth.ts:23-26` configured:

```
rateLimit: {
  window: 10, // time window in seconds
  max: 100,   // max requests in the window
}
```

`rateLimit.enabled` defaults to true under `NODE_ENV=production`, which Render set. Configuring
`rateLimit` at all activates better-auth's built-in tiered rules.

**Where those rules live in the installed version.** better-auth **1.6.25**,
`node_modules/.pnpm/better-auth@1.6.25_…/node_modules/better-auth/dist/api/rate-limiter/index.mjs`,
function `getDefaultSpecialRules()` at **line 370**, applied at **line 288** inside
`resolveRateLimitConfig` — it overrides the configured `window`/`max` whenever a path matches:

| Rule (file line) | Paths | Limit |
| --- | --- | --- |
| 371-376 | `startsWith('/sign-in')`, `startsWith('/sign-up')`, `startsWith('/change-password')`, `startsWith('/change-email')` | **3 per 10s** |
| 377-382 | `/request-password-reset`, `/send-verification-email`, `startsWith('/forget-password')`, `/email-otp/send-verification-otp`, `/email-otp/request-password-reset` | **3 per 60s** |

Crucially, the bucket key is `createRateLimitKey(ip, path)` (line 287) — **per IP *and* per path**,
so each endpoint had its own independent counter.

**After.** `apps/api/src/lib/auth.ts:40-42` sets `rateLimit: { enabled: false }`, which short-circuits
the whole mechanism at `onRequestRateLimit` (`…/rate-limiter/index.mjs:331`, `if (!ctx.rateLimit.enabled) return;`).
In its place, `apps/api/src/middleware/rate-limit.ts:16-22` calls Cloudflare's native binding:

```
const { success } = await c.env.AUTH_RATE_LIMIT.limit({ key: getIpAddress(c) });
```

configured in `apps/api/wrangler.jsonc` as `simple: { limit: 100, period: 10 }`, mounted at
`apps/api/src/app.ts:44` across the whole of `/api/auth/*`. The key is the **IP only** — one shared
bucket for every auth endpoint, with no per-path tier.

**Practical exposure.** Per source IP, against `/api/auth/sign-in/*` and `/api/auth/sign-up/*`:

- **Before:** 3 requests per 10s per path = **18 per minute**, on that path's own counter.
- **After:** 100 requests per 10s = **up to 600 per minute**, shared across all of `/api/auth/*`.

That is a **33x increase** on the endpoints that most warrant throttling. The concrete abuse case is
`/api/auth/sign-in/magic-link` — it matches `startsWith('/sign-in')`, so it was previously capped at
18/min, and every call dispatches a Resend email to a caller-supplied address
(`apps/api/src/lib/auth.ts:167-186` → `sendMagicLinkEmail`). An attacker can now attempt ~600
magic-link sends per minute per IP against an arbitrary target address: an email-bombing and
Resend-cost vector that did not exist before. Credential-stuffing style enumeration against the
social sign-in endpoints scales the same way.

Two secondary notes for whoever fixes this: the old limiter was in-memory on a single Render
instance, which made it a real global limit for that deployment; Cloudflare's Rate Limiting binding
is counted per-colo, so the ceiling is per-colo either way — that part is not a regression. And the
spec's §2 rewrite claims the binding "preserves the existing 100-per-10s ceiling exactly", which is
true of the *general* ceiling and silently untrue of the tier; §2 should be corrected alongside the
fix.

**Fix direction.** Add a second `ratelimits` entry (a distinct `namespace_id`) at
`simple: { limit: 3, period: 10 }` and apply it as middleware in front of the sign-in/sign-up
prefixes, in addition to the existing flat 100/10s. Both entries must be redeclared in
`env.staging` — `ratelimits` is not inherited by named environments.

**Why per-task review missed it.** Task 6 reviewed the KV→binding swap against its own diff, where
the visible before/after was `window: 10, max: 100` on both sides. The tiered rules are implicit in
better-auth's internals and only become load-bearing once you compare the *whole* auth surface
before and after.

### MINOR

- **`apps/api/src/app.ts:44`** — the `/api/auth/*` handler calls `createAuth()` directly rather than
  `getAuth()`, constructing a second better-auth instance per auth request when one is already bound
  in the ALS scope by `requestContext`. Not a correctness bug (both read the same Prisma proxy), but
  it doubles per-request construction on the auth path and means `resolveSession` and the auth
  handler operate on different instances.
- **`apps/api/src/modules/forms/service.ts:194`** — `listSubmissions` calls `findMany` with no
  `select`, so `GET /forms/page/:pageId/submissions` returns whole `FormSubmission` rows including
  `visitorIp` (`packages/prisma/prisma/schema.prisma:221`). Pre-existing: that route never had a
  Fastify response schema, so nothing was stripped before either. Same class as the accepted
  `integrationId` item; recorded for completeness, not a migration regression.
- **`apps/api/wrangler.jsonc`** — no top-level `routes` key, and the CI deploy job
  (`.github/workflows/ci.yml`, `cloudflare/wrangler-action@v3` with no `command`) runs
  `wrangler deploy` with no `--env`, which emits a multiple-environments warning. Both are
  intentional per `docs/superpowers/plans/2026-08-04-api-cutover-runbook.md` (the production route
  is added as an explicit cutover step, runbook line 260), but the consequence is that the
  production `api.lin.ky/*` route lives only in the Cloudflare dashboard and is not reviewable in
  git. Worth adding to the runbook's post-cutover checklist so it gets committed once the flip is
  proven.

---

## C. Deferred-item triage

| # | Item | Verdict | Reasoning |
| --- | --- | --- | --- |
| 1 | `resolveClient()` checks `!DATABASE_URL` before the cached fallback | **fine to defer** | Only reachable if `DATABASE_URL` is unset *after* a fallback was already built. Cannot occur in tests or in a Worker. |
| 2 | `getOwnPropertyDescriptor` forces `configurable: true` | **fine to defer** | A descriptor lie on a read-only surface, required to satisfy V8's proxy invariant. Nothing downstream inspects it. |
| 3 | `'AES-GCM'` literal duplicated in encrypt/decrypt | **fine to defer** | Cosmetic. The format is pinned by round-trip tests against a real legacy ciphertext. |
| 4 | Both webp SIMD and non-SIMD wasm ship (~616 KiB raw) | **fine to defer** | Final bundle is 2450 KiB gzip against a 10 MB limit — roughly 4x headroom. Static imports can't be selected conditionally, so trimming this is a real change, not a tidy-up. |
| 5 | `fetch` tripwire is per-file, not a shared vitest setup | **fix before merge** | The only deferred item I'd block on. A real incident already occurred (Task 10: live DynamoDB calls against `glow-development` with production-adjacent credentials, because a stale `vi.mock` target silently stopped intercepting). The fix is a ~10-line `setupFiles` entry in the vitest config; leaving it per-file means the next boundary move re-opens the exact failure mode that already fired once. |
| 6 | `sendEmail` casts payload `as CreateEmailOptions` | **fine to defer** | All 9 current callers pass exactly one of html/text/react. Loses a compile-time guarantee for future callers; worth a follow-up, not a blocker. |
| 7 | `GET /pages/:id/blocks` returns `integrationId` | **fine to defer** | Pre-existing on both sides of the migration; scoped to the caller's own organization. |
| 8 | `null` → `""` wire change on `upgrade-eligibility` / `current-user-subscription` | **fine to defer** | Both consumers (`pricing-table.tsx`, `UserWidget.tsx`) use truthiness or strict equality. Inert. Arguably the more correct wire format. |
| 9 | `services/spotify` missing-access-token branch defaults to 200 | **fine to defer** | Pre-existing; correctly left alone during a port. |
| 10 | `apps/api/.dev.vars.example` lists 13 of ~43 vars | **fine to defer** | Doesn't affect production, but it does mean a fresh clone can't run `wrangler dev` without reverse-engineering the list. Cheap enough to finish alongside the blockers if someone is in the file anyway. |

---

## D. Route-coverage result

Both surfaces were enumerated mechanically — every `.get/.post/.put/.delete/.patch/.on` registration
across all module files at `ef5b87e` and at HEAD, normalised to `METHOD /prefixed/path` using each
module's mount prefix, then set-differenced.

**Result: 58 module routes on each side, plus `/api/auth/*` = 59. The two sets are identical.**
Zero additions, zero removals, zero method changes, zero path drift. All 18 mount prefixes match,
including the four `services/*` OAuth callback paths registered with Google, Twitter and TikTok,
where drift would break sign-in and could not be fixed by redeploy alone.

**However — one registered route is not reachable.** `GET /blocks/enabled-blocks` is registered with
the correct method and path but is shadowed at runtime by `GET /blocks/:blockId` (see Finding B1).

So the direct answer to "is any pre-migration route now a silent production 404": **yes, exactly
one** — and it is invisible to a path-set comparison, because the route *is* registered. The cause
is router precedence, not a missing or renamed registration.

No other module has a static path registered after a parametric route that could match it; `pages`,
the other module with `internal/*` paths competing against `:pageId`, was probed explicitly and
resolves correctly.

---

## Addendum — whole-surface response-field leak sweep

Because Hono has no response-schema stripping and Task 14 found one real leak that way, I ran an
independent full-surface audit: every route that had a *wired* Fastify `schema.response` at
`ef5b87e`, compared field-for-field against the current Hono handler and the underlying Prisma
`select`, across all 20 modules.

**No new leaks.** Every such route is either explicitly hand-trimmed in the new handler or returns a
shape already within the old schema's declared fields. Confirmed hand-trims:
`GET /pages/:pageId/settings` (`apps/api/src/modules/pages/index.ts:269`),
`GET /pages/:pageId/theme` (`:290`),
`GET /pages/:pageId/internal/load` (`apps/api/src/modules/pages/handlers/get-page-load.ts:40-47`),
`GET /analytics/pages/:pageId` (`apps/api/src/modules/analytics/handlers/analytics-for-page.ts:63-89`),
and the two billing responses that replicate the old schemas' `{}` stripping
(`upgrade-to-premium.ts:93`, `upgrade-eligibility.ts:26`).

Two informational caveats, neither actionable:

1. `POST /assets/upload` — `uploadAssetSchema` in `apps/api/src/modules/assets/schema.ts` was **never
   wired** to the old route (the Fastify registration took no `schema` option; the only reference to
   the symbol in the entire old tree is its own definition). The old response already returned
   `message: 'success'` unstripped, identical to `apps/api/src/modules/assets/index.ts:102`.
2. `GET /integrations/me` — `getCurrentUserTeamIntegrationsSchema` declared its 200 as
   `{ type: 'array', properties: {…} }`, which is malformed JSON Schema (arrays need `items`), so
   fast-json-stringify never stripped anything on this route pre-migration either. The current
   handler returns the identical shape, and `getIntegrationsForOrganizationId`
   (`apps/api/src/modules/integrations/service.ts:62-87`) uses an explicit `select` scoped to the
   caller's own `organizationId`.

This reinforces a nuance Task 14 first recorded and which the spec understates: several old
"response schemas" were authoring bugs that stripped nothing. Where responses are safe, the safety
came from the Prisma `select`, not from Fastify. That is worth knowing for any future module that
relaxes a `select`.

---

## Summary for dispatch

Two fixes gate the merge:

1. `apps/api/src/modules/blocks/index.ts` — move line 276 (`get('/enabled-blocks')`) above line 274
   (`get('/:blockId')`). Add a route test asserting `GET /blocks/enabled-blocks` does not resolve to
   the block-by-id handler, since nothing in the suite currently covers it.
2. `apps/api/wrangler.jsonc` + `apps/api/src/app.ts` — add a 3-per-10s rate-limit binding in front of
   the `/api/auth/sign-in*` and `/api/auth/sign-up*` prefixes, redeclared in `env.staging`. Correct
   spec §2's "preserves the existing ceiling exactly" claim.

One deferred item is worth closing in the same pass: move the AWS `fetch` tripwire into a shared
vitest `setupFiles` entry (triage item 5).
