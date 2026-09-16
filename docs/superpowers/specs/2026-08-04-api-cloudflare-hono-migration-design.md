# API Migration: Render + Fastify → Cloudflare Workers + Hono — Design Spec

**Date:** 2026-08-04
**Status:** Approved (brainstorm validated)

## Summary

Move `apps/api` off Render and Fastify onto a single Cloudflare Worker running Hono, serving the same `api.lin.ky` origin. Postgres stays where it is, reached through Cloudflare Hyperdrive. S3 and DynamoDB stay, reached through `aws4fetch` instead of the AWS SDK. Image resizing moves from `sharp` to a WASM codec so the `cdn.lin.ky` URL shape and the S3 bucket layout are unchanged.

The API is ~59 routes across 20 modules. All business logic, every Prisma query, every TypeBox schema, all of `packages/*`, and the frontend are unchanged. The port is confined to route wiring, the client-construction layer, and five integrations.

## Goals

- `api.lin.ky` served by a Cloudflare Worker; Render decommissioned.
- No change to the API's public contract — same paths, same request/response shapes, same cookie behaviour.
- No user-visible disruption at cutover: sessions survive, OAuth callbacks and Stripe webhook URLs are unchanged.
- Rollback available in seconds, without waiting on DNS.

## Non-goals

- Moving Postgres, S3, DynamoDB or Tinybird to Cloudflare equivalents (R2, D1, Durable Objects, Analytics Engine). Possible follow-ups; out of scope here.
- Restructuring modules, adding an OpenAPI spec, or changing validation semantics beyond what the framework swap forces.
- Migrating `apps/frontend` or `apps/marketing`.

## Decisions made during brainstorm

| Question                                  | Decision                                                                                      |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| Image resize (`sharp` is a native binary) | WASM resize inside the Worker; keep S3 and the existing CDN URL shape                         |
| Database connectivity                     | Cloudflare Hyperdrive in front of the existing Postgres; keep Prisma 7 + `@prisma/adapter-pg` |
| Cutover strategy                          | Big-bang, with fast rollback (see §6) — no strangler proxy                                    |
| Validation                                | `@hono/typebox-validator`; existing TypeBox schema files unchanged                            |
| Test environment                          | Plain Node vitest with `app.request()`; **not** `@cloudflare/vitest-pool-workers`             |
| AWS access                                | Replace AWS SDK v3 with `aws4fetch` (SigV4 over `fetch`)                                      |
| Repo layout & deploy                      | Rewrite `apps/api` in place; deploy from GitHub Actions so tests gate deploys                 |

**Why `aws4fetch` over keeping the SDK:** three AWS SDK v3 packages add roughly 1–2 MB to a bundle that also carries Prisma, better-auth, Stripe and a WASM image codec, against a 10 MB compressed Worker limit. `aws4fetch` is ~3 KB. Uploads are single-shot `PUT`s (files cap at 10 MB, so `lib-storage`'s multipart machinery is unnecessary) and DynamoDB needs exactly two operations. The cost is hand-writing the attribute-value JSON that `lib-dynamodb` marshals today.

**Why plain vitest over the workers pool:** the DB-backed integration tests are the valuable ones and they need a real Postgres, which the workers pool complicates. The accepted trade-off is that tests will not catch workerd-specific breakage; §5 defines the compensating smoke-test control.

---

## 1. Architecture

Single Worker, `compatibility_flags = ["nodejs_compat"]`, on a recent `compatibility_date`.

```
                    ┌─ Hyperdrive ──→ Postgres (existing host, unchanged)
Cloudflare edge     │
  api.lin.ky ──→ Worker (Hono) ──┼─ aws4fetch ──→ S3 (assets) + DynamoDB (reactions)
                    ├─ fetch ─────→ Tinybird, Stripe, Resend, Slack, PostHog
                    └─ Rate Limiting binding → /api/auth/* throttling
```

### Framework mapping

| Fastify                                           | Hono                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `fastify.register(routes, { prefix })`            | `app.route('/pages', pagesRoutes)` over sub-`Hono()` instances                 |
| `@fastify/cors` with per-request `credentials`    | `hono/cors` with the same `isTrustedOrigin` — `lib/origins.ts` ports unchanged |
| `@fastify/sensible` (`httpErrors.unauthorized()`) | `HTTPException` from `hono/http-exception`                                     |
| `@fastify/compress`                               | **deleted** — Cloudflare compresses at the edge                                |
| `@fastify/multipart`                              | `await c.req.formData()` — native                                              |
| `fastify-raw-body` (Stripe webhook only)          | `await c.req.text()` on that one route                                         |
| `fastify.decorate('authenticate', …)`             | middleware setting `c.set('session', …)`, typed via Hono `Variables`           |
| `onSend` Cache-Control default                    | `app.use('*', …)` middleware, same logic                                       |
| `onResponse` slow-request log                     | middleware timing around `await next()`                                        |
| `@sentry/node`                                    | `@sentry/cloudflare` + `withSentry()` around the default export                |

### Module layout

Unchanged: `src/modules/<name>/{index,service,schemas,handlers}`. Each module's `index.ts` changes from `export default async function xRoutes(fastify)` to a `new Hono<Env>()` instance with `export default routes`. One mechanical, reviewable diff per module.

### One deliberate improvement

`src/decorators/authenticate.ts` imports the app instance from `@/index` solely to reach `fastify.httpErrors` — a circular import between the app root and a leaf. As Hono middleware it throws `HTTPException` directly and the cycle disappears.

---

## 2. Environment, bindings and client lifecycle

This is the highest-risk part of the migration.

### Config vars stay on `process.env`

There are 127 `process.env` reads across 37 files (46 distinct vars). Under `nodejs_compat`, Wrangler populates `process.env` from `[vars]` and secrets, so those reads are left alone. Only genuine _bindings_ — Hyperdrive, the Rate Limiting binding — move to `c.env`.

If `process.env` population turns out not to be available at the chosen `compatibility_date`, the fallback is a one-file shim re-exporting `import { env } from 'cloudflare:workers'`. Confirm during the spike (§7).

Side benefit: `build.js` uses `@dotenv-run/esbuild`, which **inlines env vars into the bundle at build time**. Comments in `lib/prisma.ts` and `modules/analytics/utils.ts` exist only to warn readers off `NODE_ENV` branches because of it. Wrangler injects at runtime, so that constraint disappears. (Behaviour is not changed as part of this migration; the comments can be updated.)

### Client lifecycle

Today every client is a module-scope singleton built from `process.env`: `lib/prisma.ts`, `lib/auth.ts`, `lib/stripe.ts`, `modules/assets/service.ts`, `modules/reactions/service.ts`, `modules/slack/service.ts`. On Workers, module scope runs once per isolate, before any request, and is where I/O is illegal. Reusing an object that holds a socket opened during request A in request B throws `Cannot perform I/O on behalf of a different request`.

| Thing                                       | Lifecycle                                                 | Why                                                                                   |
| ------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `PrismaClient` + `PrismaPg`                 | **per request**, from `c.env.HYPERDRIVE.connectionString` | holds the TCP socket; Hyperdrive pools on Cloudflare's side, so construction is cheap |
| `betterAuth(...)` instance                  | **per request**                                           | holds the Prisma adapter, so it inherits Prisma's lifetime                            |
| Stripe, Resend, `aws4fetch` signer, PostHog | module scope                                              | pure JS over `fetch`, no persistent socket                                            |

**40 files import `@/lib/prisma` as a default singleton.** Threading it as a parameter would rewrite nearly every file in the app and couple the framework swap to a large unrelated refactor. Instead, request scoping goes through `AsyncLocalStorage` (provided by `nodejs_compat`, and the mechanism Sentry itself uses for request context on Workers):

```ts
// lib/prisma.ts
const als = new AsyncLocalStorage<{ prisma: PrismaClient }>();

export function runWithPrisma<T>(prisma: PrismaClient, fn: () => T): T {
  return als.run({ prisma }, fn);
}

export default new Proxy({} as PrismaClient, {
  get: (_, prop) =>
    Reflect.get(als.getStore()?.prisma ?? fallbackClient(), prop),
});
```

```ts
// middleware, registered before every route
app.use('*', (c, next) => runWithPrisma(createPrisma(c.env), next));
```

**All 40 import sites stay byte-identical.** The migration diff stays proportional to the framework swap.

`fallbackClient()` lazily constructs a client from `process.env.DATABASE_URL` when no store is set, so the existing `service.test.ts` files — which call services directly, outside any request — keep working untouched.

`lib/auth.ts` becomes `createAuth({ kv })`, constructed per request in the same middleware; it reads Prisma through the same proxy.

### better-auth rate limiting

`rateLimit: { window: 10, max: 100 }` currently uses better-auth's **in-memory** store. On Render's single instance that worked; across Worker isolates each isolate keeps its own counter, silently weakening the limit.

**Revised during implementation — the original KV plan was wrong twice over.** This section first specified a `secondaryStorage` backed by a KV namespace. Two problems surfaced in Task 6:

1. **KV cannot express the window.** Cloudflare KV rejects any `expirationTtl` below 60 seconds, in production and in miniflare. With `window: 10` and no `increment` method on the adapter, better-auth falls back to `legacyConsume`, which calls `put(..., { expirationTtl: 10 })` — an uncaught throw on the first request to `/api/auth/*`. KV is also eventually consistent, so any limit built on it is a per-colo approximation rather than a global one.
2. **`secondaryStorage` silently relocates sessions.** Merely configuring it diverts _all_ session storage into it unless `storeSessionInDatabase: true` is set — verified in better-auth 1.6.25's `internal-adapter.mjs`, where the Postgres write is gated behind `executeMainFn`. That would have moved live sessions out of Postgres and broken §6's cutover guarantee that sessions survive the flip and a rollback.

**What was built instead:** Cloudflare's native **Rate Limiting binding**, which supports a 10-second period and so preserves the existing flat 100-per-10s ceiling exactly. better-auth's own rate limiting is disabled (`rateLimit: { enabled: false }`), and a Hono middleware in front of `/api/auth/*` calls the binding and returns 429. No `secondaryStorage`, no KV namespace, sessions untouched in Postgres.

**Correction (post-merge final review):** the sentence above is true of the general ceiling but was silently untrue of a per-endpoint tier. Configuring `rateLimit` at all — as the pre-migration config did — also activated better-auth's built-in `getDefaultSpecialRules()`: 3-per-10s on `/sign-in*`, `/sign-up*`, `/change-password` and `/change-email`, keyed per IP _and_ per path, independent of the configured 100-per-10s. Disabling `rateLimit` to move to the Cloudflare binding dropped that tier along with the rest of the mechanism, which was a ~33x loosening on `/api/auth/sign-in/magic-link` specifically (18/min → up to 600/min per IP), since every call dispatches a real Resend email to a caller-supplied address.

This is now fixed with a second Rate Limiting binding, `AUTH_STRICT_RATE_LIMIT` (`simple: { limit: 3, period: 10 }`), mounted in `app.ts` in front of `/api/auth/sign-in/*` and `/api/auth/sign-up/*` specifically, in addition to the flat 100-per-10s binding covering the rest of `/api/auth/*`. It is not mounted in front of `/change-password` or `/change-email`: both require an already-authenticated session (`sensitiveSessionMiddleware`), so the anonymous-abuse threat model this restores protection against doesn't apply the same way. The other half of better-auth's tiers — the 3-per-60s rules on password-reset and verification-email endpoints — needed no coverage: `forget-password*` and `email-otp/*` only exist under the `email-otp` plugin, which this app doesn't install (404 regardless), and `request-password-reset`/`send-verification-email` are registered but immediately throw `BAD_REQUEST` before any side effect, because this app configures neither `emailAndPassword.sendResetPassword` nor `emailVerification.sendVerificationEmail`.

The binding's `namespace_id` is user-chosen (any integer unique within the account), not an account-provisioned resource — no pre-deploy provisioning step.

Form submission rate limiting is already DB-backed (`modules/forms/service.ts`) and needs no change.

Form submission rate limiting is already DB-backed (`modules/forms/service.ts`) and needs no change.

---

## 3. Module port map

### Tier A — mechanical (15 modules, ~45 routes)

`core`, `marketing`, `blocks`, `pages`, `themes`, `integrations`, `orchestrators`, `analytics`, `flags`, `forms`, `organizations`, and `services/{tiktok,instagram,threads,spotify}`.

Per module:

- `FastifyInstance` signature → `Hono` sub-app.
- `request.body` / `params` / `query` → `c.req.valid('json'|'param'|'query')` or `c.req.param()`.
- `response.status(n).send(x)` → `c.json(x, n)`.
- `request.server.authenticate(...)` → `c.get('session')`.
- `{ schema: xSchema }` → `tbValidator('json', xSchema.body)`.
- `prisma` threaded in as an argument.

Two things to watch:

- **`orchestrators/tiktok.ts`** is 776 lines with deliberate `setTimeout` pauses and a long external call chain. Wall-clock time is not billed on Workers, but the module must be checked against the per-request subrequest limit and given an explicit `limits.cpu_ms` in `wrangler.jsonc`.
- **Validation coercion.** Fastify's AJV runs with `coerceTypes`, which turns boolean `true` into `"true"` through `string | boolean` body unions. TypeBox validation under Hono does not coerce, so affected routes will start receiving real booleans. This is a behaviour change to assert on in tests, not a regression — see `modules/forms`.

### Tier B — real rewrites

**1. `assets` — sharp → WASM.**
`c.req.formData()` replaces `@fastify/multipart`; the manual `MultipartFile` reconstruction in `modules/assets/index.ts` disappears entirely.

`sharp().resize(w, h)` defaults to **fit: cover, position: centre**. The replacement must compute a crop rect and then scale — a plain resize would silently change the framing of every uploaded image. Small images are currently upscaled (`withoutEnlargement` is not set); match that.

Use `@jsquash/resize` + `@jsquash/webp` + `@jsquash/png` rather than Photon: modular, so only the codecs used land in the bundle.

Accepted caveat: `sharp`'s `png({ quality })` drives palette quantisation and has no jsquash equivalent, so PNG bytes will differ (visually equivalent, likely a different file size). The webp path maps cleanly. Resize targets are unchanged (`pageBackgroundImage` 1200×800 @ q100, `blockAsset` 800×800 @ q80).

**2. `assets` + `reactions` — aws4fetch.**
S3 becomes a signed `PUT` per variant; the `PassThrough` stream plumbing and `@aws-sdk/lib-storage` go away (buffer → encode → PUT).

DynamoDB becomes two signed `POST`s to the `DynamoDB_20120810.BatchGetItem` and `.UpdateItem` targets. Attribute-value marshalling (`{"S": …}`, `{"N": …}`) is hand-written and isolated in `src/modules/reactions/dynamo-marshal.ts` with its own unit tests. `modules/reactions/service.test.ts` already exists and gets extended.

**3. `billing` — Stripe.**

- `new Stripe(key, { httpClient: Stripe.createFetchHttpClient() })`.
- `constructEvent` → `await constructEventAsync` (sync HMAC is unavailable on Workers).
- The webhook route reads `await c.req.text()`, dropping `fastify-raw-body` and its global registration.

**4. `notifications` + `slack` + `posthog`.**

- `@slack/web-api` is Node-HTTP-based; replaced with a single `fetch` to `chat.postMessage` — the module makes exactly one kind of call.
- `posthog-node` buffers events and flushes on a timer the Worker will kill mid-flight. Configure `flushAt: 1` and call `c.executionCtx.waitUntil(client.shutdown())`.
- Email: render React to an HTML string with `@react-email/render` and pass `html` to Resend, rather than handing Resend the `react` prop. Same output, but `react-dom/server` resolution stays under our control instead of inside the SDK.

**5. `lib/encrypt.ts` — node:crypto → WebCrypto.**
PBKDF2-SHA256 (100k iterations) and AES-256-GCM are both native WebCrypto primitives, and the serialised format is unchanged, so **existing encrypted integration tokens decrypt correctly**. `pbkdf2Sync` / `createCipheriv` may work under `nodejs_compat`, but WebCrypto is the guaranteed path and the exported functions are already `async`. `Buffer` usage stays (provided by `nodejs_compat`).

### Cross-cutting

**Sentry.** `@sentry/node` → `@sentry/cloudflare`, `withSentry()` wrapping the default export. `captureException` imports change in ~15 files (find-and-replace). The `sentry:sourcemaps` script moves from `sentry-cli` over `dist/` to Wrangler's source-map upload.

**`/api/auth/*`.** The 30-line manual Fastify→`Request` reconstruction in `src/index.ts` — which JSON-stringifies the already-parsed body, and is therefore lossy for non-JSON content types — collapses to:

```ts
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));
```

`fromNodeHeaders(request.headers)` in the authenticate middleware becomes `c.req.raw.headers`. Cookie configuration (`sameSite: 'none'`, `partitioned: true`, `.lin.ky` domain) carries over unchanged.

---

## 4. Dependencies

**Removed:** `fastify`, `fastify-cli`, `fastify-tsconfig`, `@fastify/{compress,cors,multipart,sensible,type-provider-typebox}`, `fastify-raw-body`, `sharp`, `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@slack/web-api`, `@sentry/node`, `@sentry/types`, `@sentry/cli`, `esbuild`, `@dotenv-run/esbuild`, `dotenv`, `tsx`.

Also drop `@fastify/basic-auth` and `cross-env`, which are already declared but unreferenced — incidental cleanup, verified unused before removal.

**Added:** `hono`, `@hono/typebox-validator`, `aws4fetch`, `@jsquash/{resize,webp,png}`, `@sentry/cloudflare`, `wrangler`, `@cloudflare/workers-types`.

**Kept:** `@sinclair/typebox`, `@prisma/adapter-pg`, `better-auth`, `stripe`, `resend`, `posthog-node`, `@sindresorhus/slugify`, `safe-await`, `react`, `@dotenvx/dotenvx` (still used by the `test` script), all `@trylinky/*` workspace packages.

**Scripts:** `dev` becomes `wrangler dev` (Wrangler reads `.dev.vars`, replacing the `dotenvx … tsx watch` chain). `build:api` and `start:api` are deleted — `wrangler deploy` builds and ships in one step. `test`, `lint` and `typecheck` are unchanged.

**Deleted files:** `build.js`, `cjs-shim.ts`. **New:** `wrangler.jsonc`, `.dev.vars` (gitignored).

`tsconfig.json` swaps `"types": ["node"]` for `["@cloudflare/workers-types"]` (plus `node` for the `Buffer`/`process` surface that `nodejs_compat` provides).

---

## 5. Testing

`app.inject({ method, url, headers, payload })` → `app.request(url, { method, headers, body })`, returning a real `Response`.

Five test files touch routes: `lib/origins.test.ts`, `modules/forms/routes.test.ts`, `decorators/authenticate-api-key.test.ts`, `modules/billing/handlers/billing-portal-url.test.ts`. The remainder are pure unit tests and do not move.

The app becomes `createApp()`, and route tests supply a fake env to `app.request()`:

```ts
const env = { HYPERDRIVE: { connectionString: process.env.DATABASE_URL } };
const response = await app.request('/forms/…', { method: 'POST', body }, env);
```

The only Hyperdrive surface the code uses is `.connectionString`, so a plain object satisfies it and the DB-backed tests keep hitting local Postgres exactly as they do today. `fileParallelism: false` stays.

Service-level tests (`forms/service.test.ts`, `reactions/service.test.ts`, `integrations/service.test.ts`) call services directly with no request in flight; the `fallbackClient()` path in `lib/prisma.ts` means they need **no changes at all**.

**Accepted limitation:** these run in Node, not workerd, so they will not catch Node-only APIs slipping through, bundle-size overruns, or isolate I/O violations.

**Compensating control — smoke tests.** A `pnpm smoke <base-url>` script exercising what cannot be tested honestly in Node:

- asset upload round-trip, asserting both `.webp` and `.png` land in S3 and the returned CDN URL resolves
- a Stripe webhook POST with a genuine signature
- `GET /session/me` with a valid session cookie
- one Hyperdrive-backed read (`GET /pages/…`)
- `GET /ping`

Run against the deployed staging Worker before cutover. Can be wired into CI post-deploy later.

---

## 6. CI/CD and cutover

### CI/CD

`.github/workflows/ci.yml` gains a `deploy` job: `needs: verify`, `if: github.ref == 'refs/heads/main'`, using `cloudflare/wrangler-action` with a `CLOUDFLARE_API_TOKEN` repository secret. Tests gate deploys.

The 46 environment values are loaded once via `wrangler secret bulk` from a JSON file. Non-secret config (`APP_ENV`, `APP_FRONTEND_URL`, `API_BASE_URL`, …) goes in `wrangler.jsonc` `[vars]` so it is reviewable in git.

### Prerequisite

Hyperdrive connects outbound over the public internet with TLS. **If production Postgres is only reachable on Render's private network, it needs a public endpoint first.** This blocks the entire migration and must be checked on day one.

### Cutover — Worker route, not DNS

**Correction (2026-09-16): `api.lin.ky` is _not_ proxied through a Cloudflare zone this account controls.** `lin.ky` DNS is hosted at Vercel and `api` is a CNAME straight to Render; the Cloudflare headers on the live API are Render's own edge. The zone must be moved into the Cloudflare account before any Worker route on `lin.ky` can exist. With that prerequisite met, the rest of this section holds: the flip is adding a Worker route for `api.lin.ky/*`. Routes take precedence over the origin record, so it is instant, and **rollback is deleting the route** — traffic returns to Render immediately with no DNS TTL to wait out.

Sequence:

1. Deploy to `api-next.lin.ky` (a second proxied hostname on the same zone). Register a **separate Stripe webhook endpoint** against it with its own signing secret.
2. Run the smoke script. Point a local frontend at it and click through the app.
3. **OAuth cannot be fully verified on staging** without adding `api-next.lin.ky` callback URLs to Google, Twitter and TikTok. Add them temporarily — a broken sign-in is the worst thing to discover live.
4. Add the `api.lin.ky/*` Worker route. Nothing changes in Stripe or the OAuth providers, because the production URLs are unchanged.
5. Watch Sentry, Worker logs and Stripe webhook delivery for an hour.
6. Keep the Render service running and deployable for ~a week, then decommission. Remove the staging hostname, its Stripe endpoint, and the temporary OAuth callback URLs.

**Sessions survive the cutover** — better-auth stores them in the same Postgres and the cookie domain is unchanged — so a rollback does not sign anyone out either.

### Rollback triggers

- 5xx rate above baseline
- any Stripe webhook signature failure
- any session-resolution failure
- an upload producing a visibly wrong image (crop/framing regression)

---

## 7. Sequencing

**Day one, before any porting — de-risking spike.** A Worker that boots Hono, resolves a session through better-auth, and runs one Prisma query through Hyperdrive. Confirms in one go: Hyperdrive reachability from Cloudflare to the production Postgres host, Prisma 7 + `@prisma/adapter-pg` behaviour on workerd, `process.env` population under `nodejs_compat`, and per-request client construction cost. **If Prisma-over-Hyperdrive misbehaves, the plan changes.**

Then, roughly in order:

1. Client lifecycle — `createPrisma(env)`, the `AsyncLocalStorage` proxy in `lib/prisma.ts`, `createAuth({ kv })`. Land this **first and on its own**: it is the one change that must be right before anything else is ported, and because the 40 import sites are untouched it can ship against the existing Fastify app and stay green.
2. Scaffold — `wrangler.jsonc`, `Env` types, `createApp()`, middleware (ALS, CORS, Cache-Control, timing, auth), `/api/auth/*`, `core` routes. Prove `/ping` and `/session/me` work deployed.
3. Cross-cutting swaps — Sentry, `encrypt.ts` → WebCrypto, Slack → `fetch`, PostHog `waitUntil`, email `html` rendering.
4. Tier B rewrites — `aws4fetch` + `dynamo-marshal` (reactions), WASM image pipeline (assets), Stripe webhook. Each with tests before the port where an existing test file covers it.
5. Tier A modules — port in batches, keeping the test suite green.
6. Smoke script, CI deploy job, staging deploy, cutover.

## Open items to confirm during implementation

- Production Postgres host and public reachability (blocks §7 spike).
- Whether `process.env` is populated at the chosen `compatibility_date`, or the `cloudflare:workers` shim is needed.
- Final compressed bundle size against the 10 MB limit, once the WASM codecs are in.
- `limits.cpu_ms` value for the image pipeline and the TikTok orchestrator, measured rather than guessed.
