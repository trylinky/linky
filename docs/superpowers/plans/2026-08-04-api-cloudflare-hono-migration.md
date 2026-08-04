# API Migration: Render + Fastify → Cloudflare Workers + Hono — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `apps/api` from Fastify on Render to Hono on a Cloudflare Worker serving the same `api.lin.ky` origin, with no change to the API's public contract.

**Architecture:** A single Worker with `nodejs_compat`. Postgres is reached through Cloudflare Hyperdrive with Prisma 7 + `@prisma/adapter-pg`, scoped per request via `AsyncLocalStorage` so the 40 existing `import prisma from '@/lib/prisma'` sites are untouched. S3 and DynamoDB are reached with `aws4fetch` instead of the AWS SDK. Image resizing moves from `sharp` to `@jsquash` WASM codecs, preserving the existing S3 keys and `cdn.lin.ky` URL shape.

**Tech Stack:** Hono, `@hono/typebox-validator`, `@sinclair/typebox` (existing schemas kept), Prisma 7, Cloudflare Hyperdrive + KV, `aws4fetch`, `@jsquash/{resize,webp,png}`, better-auth, `@sentry/cloudflare`, Wrangler, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-04-api-cloudflare-hono-migration-design.md`

## Global Constraints

- Working directory for all commands is `apps/api` unless stated otherwise. The repo root is a pnpm + turbo monorepo.
- **The API's public contract must not change:** same paths, same request and response bodies, same status codes, same cookie attributes (`sameSite: 'none'`, `partitioned: true`, `secure: true`, domain `.lin.ky` in production).
- **Never** change behaviour and framework in the same commit. If a port surfaces a bug, note it and keep the bug; fix it in a separate follow-up commit.
- Tests run with `pnpm test` in `apps/api` (Vitest, Node environment, `fileParallelism: false`, DB-backed tests hit local Postgres via `DATABASE_URL` from `.env.local`).
- The local database is **`db push`-managed and has an empty migration history**. Never run `prisma migrate dev` — use `pnpm prisma db push` from `packages/prisma`.
- Every task ends green: `pnpm test`, `pnpm typecheck`, `pnpm lint` all pass in `apps/api` before committing.
- Prettier config is repo-root `prettier.config.js` with `@trivago/prettier-plugin-sort-imports`. Run `pnpm prettier --write` on touched files before committing; CI checks formatting.
- Worker compressed bundle limit is **10 MB**. Check with `pnpm wrangler deploy --dry-run --outdir=/tmp/wsize` after any task that adds a dependency.
- `compatibility_date` is `2026-07-01`; `compatibility_flags` is `["nodejs_compat"]`. Do not change these without re-running Task 1.
- **Never import Prisma from a subpath.** Every consumer uses the bare specifier `@trylinky/prisma`; the `workerd` export condition (Task 2 Step 3) picks the right client per runtime. In `packages/prisma/package.json`'s `exports`, `workerd` must be listed **before** `default` — `default` matches unconditionally, so listing it first silently wins on workerd and crashes the Worker at startup.
- Provisioned Cloudflare resources — use these, do not create new ones: Hyperdrive `962b7339d781499985faa016771f2c6a` (`linky-production`, PlanetScale origin, query caching disabled).
- Commit messages follow the repo convention: lowercase `type: summary`, imperative, no scope. Types in use: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`.

---

## File Structure

**New files:**

| Path                                         | Responsibility                                                                                                   |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `apps/api/wrangler.jsonc`                    | Worker config: name, entry, compat date/flags, bindings, vars, routes, limits                                    |
| `apps/api/src/env.ts`                        | The `Env` binding interface and the Hono `Variables` type; single source of truth for `c.env` and `c.get()`      |
| `apps/api/src/app.ts`                        | `createApp()` — builds the Hono instance, registers middleware and all module routes. No side effects on import. |
| `apps/api/src/middleware/request-context.ts` | Per-request Prisma + better-auth construction, wrapped in `AsyncLocalStorage`                                    |
| `apps/api/src/middleware/cors.ts`            | Per-request CORS policy using `isTrustedOrigin`                                                                  |
| `apps/api/src/middleware/cache-control.ts`   | Default `no-store` unless a route set its own                                                                    |
| `apps/api/src/middleware/timing.ts`          | Slow-request (>200ms) warning log                                                                                |
| `apps/api/src/middleware/authenticate.ts`    | Session resolution → `c.set('session', …)`; replaces `decorators/authenticate.ts`                                |
| `apps/api/src/lib/aws.ts`                    | The shared `aws4fetch` `AwsClient` and region/credential config                                                  |
| `apps/api/src/lib/s3.ts`                     | `putObject()` — signed single-shot S3 PUT                                                                        |
| `apps/api/src/modules/reactions/dynamo.ts`   | DynamoDB attribute-value marshalling + `batchGetItem` / `updateItem` over `aws4fetch`                            |
| `apps/api/src/modules/assets/image.ts`       | Cover-crop + resize + webp/png encode via `@jsquash`                                                             |
| `apps/api/scripts/smoke.ts`                  | Post-deploy smoke tests against a deployed base URL                                                              |
| `apps/api/.dev.vars`                         | Local Worker env (gitignored)                                                                                    |

**Rewritten in place:** `src/index.ts` (becomes a thin `export default withSentry(...)` wrapper), `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/encrypt.ts`, `src/lib/stripe.ts`, `src/lib/origins.ts` (lazy init), `src/modules/*/index.ts` (20 files), `src/modules/assets/service.ts`, `src/modules/reactions/service.ts`, `src/modules/slack/service.ts`, `src/modules/analytics/utils.ts`.

**Deleted:** `build.js`, `cjs-shim.ts`, `src/decorators/authenticate.ts`, `src/decorators/authenticate-api-key.ts` (moves to `src/middleware/`).

**Untouched:** all `service.ts` business logic except the three named above, all `schemas.ts`, all `handlers/` except signature changes, everything in `packages/`, both frontend apps.

---

## Task 1: De-risking spike — Hyperdrive, Prisma and `process.env` on workerd

> **✅ COMPLETE — 2026-08-04. Do not re-run.** Findings below; they amend Tasks 2, 3 and 7.
> Full evidence in `.superpowers/sdd/2026-08-04-api-cloudflare-hono-migration/task-1-report.md`.
>
> **Resolved, no action needed:**
>
> - `AsyncLocalStorage` works on workerd, including across `await` boundaries. Task 3's design holds.
> - `process.env` **is** populated from Wrangler `vars` at `compatibility_date` 2026-07-01.
>   The `cloudflare:workers` env shim is **not needed** — Task 2 Step 4 and Task 7 Step 6 drop it.
> - Per-request Prisma construction survives consecutive requests with no isolate I/O errors.
> - `node:crypto`'s `createCipheriv`/`pbkdf2Sync` exist under `nodejs_compat` (Task 5 moves to
>   WebCrypto regardless; this is FYI).
> - **Production Postgres is PlanetScale** (`us-east-3.pg.psdb.cloud`), not Render. Only the API
>   compute was on Render. The spec's "private-network Postgres blocks the migration" prerequisite
>   never applied and is closed.
> - Hyperdrive config created: **`962b7339d781499985faa016771f2c6a`** (`linky-production`),
>   `origin_connection_limit` 15. Query caching was on by default and has been **disabled** —
>   the API's cache-tag revalidation system cannot purge a Hyperdrive cache, so leaving it on
>   would have added unpurgeable staleness to page edits.
>
> **Blocker found — Prisma 7 cannot run on workerd as currently generated.** The generated client
> builds its query compiler with `new WebAssembly.Module(bytes)` at request time; workerd forbids
> runtime WASM codegen categorically and no compatibility flag lifts it. It also calls
> `fileURLToPath(import.meta.url)` at module load, which is `undefined` for bundled non-entry
> modules. Both are fixed by the generator's documented `runtime = "workerd"` option
> (corroborated upstream at prisma/prisma#28657). Prisma 7.0.1 is fine; no version bump.
>
> A single workerd-targeted client would break plain Node — where `apps/api`'s vitest DB tests
> run — because Node's ESM loader does not understand the `?module` resource query. So the package
> needs **two generator outputs selected by a `workerd` export condition**, which keeps every
> existing `@trylinky/prisma` import specifier unchanged. **This work is now Task 2, Steps 1-4.**

Throwaway code. Its only output is a decision. **If this task fails, stop and re-plan — every later task assumes its findings.**

**Files:**

- Create: `apps/api/spike/` (deleted at the end of this task, never committed)

**Interfaces:**

- Consumes: nothing
- Produces: a written findings note appended to the spec's "Open items" section — specifically whether `process.env` is populated under `nodejs_compat` at `compatibility_date = 2026-07-01`, and whether a Prisma client built per request over Hyperdrive returns rows.

- [ ] **Step 1: Confirm production Postgres is publicly reachable**

Get the production `DATABASE_URL` host from the Render dashboard. Then, from your machine:

```bash
psql "postgresql://USER:PASS@PROD_HOST:5432/DBNAME?sslmode=require" -c 'select 1'
```

Expected: `1`. If this fails because the host is private-network-only, **stop**. Hyperdrive connects outbound over the public internet, so the database needs a public TLS endpoint before this migration can proceed. Report the blocker and end the task here.

- [ ] **Step 2: Create the Hyperdrive config**

```bash
cd apps/api
pnpm dlx wrangler hyperdrive create linky-api-prod \
  --connection-string="postgresql://USER:PASS@PROD_HOST:5432/DBNAME"
```

Record the returned Hyperdrive **id** — Task 2 puts it in `wrangler.jsonc`.

- [ ] **Step 3: Write the spike worker**

`apps/api/spike/wrangler.jsonc`:

```jsonc
{
  "name": "linky-api-spike",
  "main": "index.ts",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat"],
  "vars": { "SPIKE_MARKER": "hello-from-vars" },
  "hyperdrive": [{ "binding": "HYPERDRIVE", "id": "PASTE_ID_FROM_STEP_2" }],
}
```

`apps/api/spike/index.ts`:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@trylinky/prisma';
import { AsyncLocalStorage } from 'node:async_hooks';

const als = new AsyncLocalStorage<{ marker: string }>();

export default {
  async fetch(
    request: Request,
    env: { HYPERDRIVE: { connectionString: string } }
  ) {
    const adapter = new PrismaPg({
      connectionString: env.HYPERDRIVE.connectionString,
    });
    const prisma = new PrismaClient({ adapter });

    const started = Date.now();
    const pageCount = await prisma.page.count();
    const queryMs = Date.now() - started;

    const alsWorks =
      als.run({ marker: 'set' }, () => als.getStore()?.marker) === 'set';

    return Response.json({
      pageCount,
      queryMs,
      alsWorks,
      processEnvPopulated: process.env.SPIKE_MARKER === 'hello-from-vars',
      hasAsyncLocalStorage: typeof AsyncLocalStorage === 'function',
    });
  },
};
```

- [ ] **Step 4: Deploy the spike and record the findings**

```bash
cd apps/api/spike
pnpm dlx wrangler deploy
curl https://linky-api-spike.<your-subdomain>.workers.dev
```

Expected: a JSON body where `pageCount` is a number matching production, `alsWorks` is `true`, `hasAsyncLocalStorage` is `true`, and `processEnvPopulated` is `true`.

Decision rules:

- `pageCount` errors or hangs → **stop and re-plan.** Prisma-over-Hyperdrive is the load-bearing assumption of this whole migration.
- `alsWorks` or `hasAsyncLocalStorage` false → **stop and re-plan.** Task 3's design depends on `AsyncLocalStorage`.
- `processEnvPopulated` false → not a blocker. Record it; Task 2 Step 4 then adds the `cloudflare:workers` env shim and every later task keeps using `process.env` unchanged through it.
- `queryMs` above ~200ms → note it. Not a blocker, but it sets expectations for the whole API.

- [ ] **Step 5: Hit the spike twice more to check isolate reuse**

```bash
curl https://linky-api-spike.<your-subdomain>.workers.dev
curl https://linky-api-spike.<your-subdomain>.workers.dev
```

Expected: three successful responses, no `Cannot perform I/O on behalf of a different request`. This confirms per-request client construction is correct. Record `queryMs` for the warm calls.

- [ ] **Step 6: Tear the spike down and record findings**

```bash
cd apps/api
pnpm dlx wrangler delete --name linky-api-spike
rm -rf spike
```

Append the findings to the "Open items to confirm during implementation" section of `docs/superpowers/specs/2026-08-04-api-cloudflare-hono-migration-design.md`, resolving each bullet with the measured answer.

- [ ] **Step 7: Commit**

```bash
cd /Users/alexpate/src/alexpate/linky
git add docs/superpowers/specs/2026-08-04-api-cloudflare-hono-migration-design.md
git commit -m "docs: record cloudflare migration spike findings"
```

---

## Task 2: A workerd-targeted Prisma client, plus the Worker scaffold

Two deliverables that must land together: `@trylinky/prisma` gains a second, workerd-targeted
client (without which no Worker can run a query at all — see Task 1's findings), and `apps/api`
gains its Wrangler config. Adds Wrangler **without removing Fastify** — the existing app still
runs and all tests still pass at the end of this task.

**Files:**

- Create: `packages/prisma/index.workerd.ts`, `apps/api/wrangler.jsonc`, `apps/api/src/env.ts`, `apps/api/.dev.vars.example`
- Modify: `packages/prisma/prisma/schema.prisma`, `packages/prisma/package.json`, `apps/api/package.json`, `apps/api/tsconfig.json`, `.gitignore`

**Interfaces:**

- Consumes: the Hyperdrive id and KV id below (both already provisioned — do not create new ones)
- Produces:
  - `@trylinky/prisma` resolving to a **workerd**-targeted client under Wrangler and a **Node**-targeted one everywhere else, via the same bare specifier. No call site anywhere in the repo changes.
  - `Env` and `Variables` interfaces from `src/env.ts`, imported by every later task:

  ```ts
  export interface Env {
    HYPERDRIVE: { connectionString: string };
    AUTH_RATE_LIMIT: KVNamespace;
  }
  export interface Variables {
    session: AuthenticatedSession | null;
  }
  export type AppBindings = { Bindings: Env; Variables: Variables };
  ```

- [ ] **Step 1: Add the second Prisma generator block**

In `packages/prisma/prisma/schema.prisma`, leave the existing `generator client` block exactly as
it is and add a second one below it. One `pnpm prisma:generate` call produces both outputs.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated"
}

// Prisma's default output compiles its WASM query compiler at request time via
// `new WebAssembly.Module(bytes)`, which workerd forbids outright. The workerd
// target instead emits a real query_compiler_bg.wasm and imports it statically.
// It also avoids `fileURLToPath(import.meta.url)`, which is undefined for
// bundled non-entry modules. Both failures are fatal at import or first query.
generator clientWorkerd {
  provider = "prisma-client"
  output   = "../src/generated-workerd"
  runtime  = "workerd"
}
```

Add `src/generated-workerd` alongside the existing `src/generated` entry in whatever gitignores
the generated output (check `packages/prisma/.gitignore` and the repo-root `.gitignore`).

- [ ] **Step 2: Create `packages/prisma/index.workerd.ts`**

A line-for-line mirror of the existing `index.ts`, with every `./src/generated/...` path changed
to `./src/generated-workerd/...`. Read `index.ts` first and mirror it exactly — it re-exports the
client, the enums, and a list of model types, and the two files must stay in sync.

```ts
// Mirror of index.ts against the workerd-targeted generator output. Selected
// automatically by the "workerd" export condition in package.json; nothing
// imports this file by path.
export { PrismaClient } from './src/generated-workerd/client';
export type { Prisma } from './src/generated-workerd/client';
export * from './src/generated-workerd/enums';
// ...plus every model type index.ts re-exports, sourced from
// ./src/generated-workerd/models/* instead of ./src/generated/models/*
```

- [ ] **Step 3: Add the `workerd` export condition**

In `packages/prisma/package.json`:

```json
  "exports": {
    ".": {
      "workerd": "./index.workerd.ts",
      "default": "./index.ts"
    },
    "./types": "./types.ts"
  }
```

**Condition order is load-bearing and has been verified empirically.** `default` matches
unconditionally, so if it is listed first it wins even on workerd and the Worker crashes at
startup with the `import.meta.url` error. `workerd` MUST come before `default`.

`./types` stays a plain string — it exports only types, so it needs no workerd variant.

- [ ] **Step 4: Verify both clients resolve correctly**

```bash
cd packages/prisma && pnpm prisma:generate
ls src/generated-workerd/query_compiler_bg.wasm    # must exist, ~1.8MB
grep -c "decodeBase64AsWasm" src/generated-workerd/internal/class.ts   # must be 0
grep -c "decodeBase64AsWasm" src/generated/internal/class.ts           # must be >0
```

Then confirm the Node side still works through the bare specifier:

```bash
cd ../../apps/api && pnpm test
```

Expected: the existing suite passes unchanged. It runs under vitest in Node, which does not set
the `workerd` condition, so it must resolve to `./index.ts` and the Node client. If any DB-backed
test now fails with `The loaded wasm module was unexpectedly undefined`, the condition order in
Step 3 is wrong.

The workerd side is proven at the end of Task 7, when the Worker first boots. Do not try to
verify it here — there is no Worker yet.

- [ ] **Step 5: Install Wrangler and Worker types**

```bash
cd apps/api
pnpm add -D wrangler @cloudflare/workers-types
```

- [ ] **Step 6: Use the existing KV namespace**

A KV namespace and the Hyperdrive config are **already provisioned** — do not create new ones.

```bash
pnpm wrangler kv namespace list
```

Find the `AUTH_RATE_LIMIT` namespace and record its id. If none exists, create it:

```bash
pnpm wrangler kv namespace create AUTH_RATE_LIMIT
```

- [ ] **Step 7: Write `wrangler.jsonc`**

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "linky-api",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-01",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "limits": { "cpu_ms": 30000 },
  "vars": {
    "APP_ENV": "production",
    "APP_FRONTEND_URL": "https://lin.ky",
    "API_BASE_URL": "https://api.lin.ky",
    "NEXT_PUBLIC_BASE_URL": "https://lin.ky",
  },
  "hyperdrive": [
    { "binding": "HYPERDRIVE", "id": "962b7339d781499985faa016771f2c6a" },
  ],
  "kv_namespaces": [{ "binding": "AUTH_RATE_LIMIT", "id": "PASTE_KV_ID" }],
}
```

The Hyperdrive id above is real and already provisioned (`linky-production`, PlanetScale origin,
query caching disabled). Use it verbatim. Only the KV id needs filling in from Step 6.

No `define` key is needed — that workaround was only for Prisma's Node-targeted output, and
Task 2 Step 1 replaces it with the workerd target on the Worker side.

Note: no `routes` key yet. The route for `api.lin.ky/*` is added at cutover (Task 18), not before — adding it now would take production traffic.

- [ ] **Step 8: Write `src/env.ts`**

```ts
import type { AuthenticatedSession } from '@/middleware/authenticate';

export interface Env {
  HYPERDRIVE: { connectionString: string };
  AUTH_RATE_LIMIT: KVNamespace;
}

export interface Variables {
  session: AuthenticatedSession | null;
}

export type AppBindings = { Bindings: Env; Variables: Variables };
```

`AuthenticatedSession` does not exist yet — it arrives in Task 6. Until then, temporarily declare it inline in this file and delete the placeholder in Task 6:

```ts
export interface AuthenticatedSession {
  user: { id: string };
  activeOrganizationId: string;
}
```

No env shim is needed. Task 1 confirmed Wrangler populates `process.env` from `vars` and secrets
at this `compatibility_date`, so the 127 existing `process.env` reads work untouched.

- [ ] **Step 9: Point tsconfig at Worker types**

In `apps/api/tsconfig.json`, change:

```json
"types": ["node"],
```

to:

```json
"types": ["node", "@cloudflare/workers-types"],
```

`node` stays because `nodejs_compat` provides `Buffer`, `process`, `node:crypto` and `node:async_hooks`, all of which the code uses.

- [ ] **Step 10: Add `.dev.vars.example` and gitignore the real one**

`apps/api/.dev.vars.example`:

```
# Copy to .dev.vars for `wrangler dev`. Mirrors the API-relevant subset of
# the repo-root .env.local. Never commit .dev.vars.
DATABASE_URL=postgresql://glow_user:KGfUZosCOm@localhost:5432/glow_development
APP_ENV=development
APP_FRONTEND_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
ENCRYPTION_KEY=
INTERNAL_API_KEY=
STRIPE_API_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
REACTIONS_TABLE_NAME=
```

Also note the local Hyperdrive override for `wrangler dev`, used from Task 7 onward:

```
# Wrangler dev points the HYPERDRIVE binding at local Postgres via this env var.
# (The WRANGLER_-prefixed form still works but is deprecated.)
CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE=postgresql://glow_user:KGfUZosCOm@localhost:5432/glow_development
```

Append to the repo-root `.gitignore`:

```
apps/api/.dev.vars
```

- [ ] **Step 11: Verify nothing broke**

```bash
cd apps/api && pnpm typecheck && pnpm test && pnpm lint
```

Expected: all pass. Fastify is still the running app; this task only added config and a second
Prisma output. If `pnpm test` fails on wasm resolution, revisit Step 3's condition order.

- [ ] **Step 12: Commit**

```bash
git add apps/api/wrangler.jsonc apps/api/src/env.ts apps/api/.dev.vars.example \
        apps/api/package.json apps/api/tsconfig.json .gitignore pnpm-lock.yaml \
        packages/prisma/prisma/schema.prisma packages/prisma/package.json \
        packages/prisma/index.workerd.ts
git commit -m "feat: add a workerd-targeted prisma client and the worker scaffold"
```

---

## Task 3: Request-scoped Prisma via AsyncLocalStorage

The load-bearing change. Lands against the **still-running Fastify app** so it can be verified by the existing test suite before any framework churn.

**Files:**

- Modify: `apps/api/src/lib/prisma.ts`
- Test: `apps/api/src/lib/prisma.test.ts` (create)

**Interfaces:**

- Consumes: `Env` from `src/env.ts` (Task 2)
- Produces:

  ```ts
  export function createPrisma(env: {
    HYPERDRIVE: { connectionString: string };
  }): PrismaClient;
  export function runWithPrisma<T>(prisma: PrismaClient, fn: () => T): T;
  export default prismaProxy; // PrismaClient — resolves to the request's client, or a lazy fallback
  ```

  All 40 existing `import prisma from '@/lib/prisma'` sites keep working unchanged.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/lib/prisma.test.ts`:

```ts
import prisma, { createPrisma, runWithPrisma } from './prisma';
// Exported alongside the proxy purely so the concurrency test can observe
// which client the store currently holds.
import { resolveClient } from './prisma';
import { describe, expect, it } from 'vitest';

const testEnv = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
};

describe('request-scoped prisma', () => {
  it('resolves to the client bound to the current request', async () => {
    const client = createPrisma(testEnv);

    const insideStore = runWithPrisma(client, () => prisma);

    // The proxy must forward to the request's client, not a shared singleton.
    expect(await insideStore.page.count()).toEqual(await client.page.count());
  });

  it('keeps two concurrent requests on their own clients', async () => {
    const a = createPrisma(testEnv);
    const b = createPrisma(testEnv);
    const seen: unknown[] = [];

    await Promise.all([
      runWithPrisma(a, async () => {
        await new Promise((r) => setTimeout(r, 10));
        seen.push(resolveClient());
      }),
      runWithPrisma(b, async () => {
        seen.push(resolveClient());
      }),
    ]);

    expect(seen).toHaveLength(2);
    expect(seen[0]).not.toBe(seen[1]);
  });

  it('falls back to a lazily-built client outside any request', async () => {
    // Service-level tests call services directly, with no store set. They must
    // keep working without wiring a request context.
    await expect(prisma.page.count()).resolves.toBeTypeOf('number');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/lib/prisma.test.ts
```

Expected: FAIL — `createPrisma`, `runWithPrisma` and `resolveClient` are not exported.

- [ ] **Step 3: Rewrite `src/lib/prisma.ts`**

```ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@trylinky/prisma';
import { AsyncLocalStorage } from 'node:async_hooks';

// Synchronous console I/O on every query is a measurable tax in production,
// so only surface genuinely slow queries.
const SLOW_QUERY_THRESHOLD_MS = 50;

/**
 * Workers cannot reuse an object holding a socket opened during another
 * request — doing so throws "Cannot perform I/O on behalf of a different
 * request". So the client is built per request and reached through an
 * AsyncLocalStorage store, which leaves all 40 `import prisma` sites
 * unchanged.
 */
const store = new AsyncLocalStorage<{ prisma: PrismaClient }>();

export function createPrisma(env: {
  HYPERDRIVE: { connectionString: string };
}): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: env.HYPERDRIVE.connectionString,
  });

  return new PrismaClient({ adapter }).$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const before = Date.now();
        const result = await query(args);
        const duration = Date.now() - before;

        if (duration >= SLOW_QUERY_THRESHOLD_MS) {
          console.log(`Slow query ${model}.${operation} took ${duration}ms`);
        }

        return result;
      },
    },
  }) as unknown as PrismaClient;
}

export function runWithPrisma<T>(prisma: PrismaClient, fn: () => T): T {
  return store.run({ prisma }, fn);
}

/**
 * Outside a request — service-level unit tests, and local scripts — there is
 * no store. Fall back to a process-lifetime client built from DATABASE_URL,
 * which is exactly the old behaviour.
 */
let fallback: PrismaClient | undefined;

export function resolveClient(): PrismaClient {
  const scoped = store.getStore()?.prisma;

  if (scoped) {
    return scoped;
  }

  if (!fallback) {
    fallback = createPrisma({
      HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
    });
  }

  return fallback;
}

export default new Proxy({} as PrismaClient, {
  get: (_target, property, receiver) =>
    Reflect.get(resolveClient(), property, receiver),
}) as PrismaClient;
```

- [ ] **Step 4: Run the new test**

```bash
cd apps/api && pnpm vitest run src/lib/prisma.test.ts
```

Expected: PASS, all three cases.

- [ ] **Step 5: Run the whole suite — the real proof**

```bash
cd apps/api && pnpm test && pnpm typecheck && pnpm lint
```

Expected: everything passes unchanged. The DB-backed tests in `forms/routes.test.ts`, `forms/service.test.ts`, `reactions/service.test.ts` and `integrations/service.test.ts` all go through the fallback path and must be green **without any edits to those files**. If any of them needed changing, the fallback is wrong — fix `resolveClient`, not the tests.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/prisma.ts apps/api/src/lib/prisma.test.ts
git commit -m "refactor: scope the prisma client per request via AsyncLocalStorage"
```

---

## Task 4: Lazy trusted-origins and the CORS middleware

`lib/origins.ts` computes `trustedOrigins` at module load. On Workers, module scope may run before env is available, which would silently produce an empty list and break every credentialed request. Make it lazy, then port the CORS policy.

**Files:**

- Modify: `apps/api/src/lib/origins.ts`, `apps/api/src/lib/origins.test.ts`
- Create: `apps/api/src/middleware/cors.ts`

**Interfaces:**

- Consumes: `AppBindings` from `src/env.ts`
- Produces:

  ```ts
  // lib/origins.ts
  export function getTrustedOrigins(): string[];   // replaces the `trustedOrigins` const
  export function isTrustedOrigin(origin: string | undefined): boolean;  // unchanged signature
  // middleware/cors.ts
  export const corsMiddleware: MiddlewareHandler<AppBindings>;
  ```

- [ ] **Step 1: Write the failing test for lazy evaluation**

Append to `apps/api/src/lib/origins.test.ts`:

```ts
describe('lazy evaluation', () => {
  it('reads the environment at call time, not at module load', async () => {
    // On Workers, module scope can run before env is populated. If the list
    // were computed at import, it would be permanently empty.
    vi.resetModules();
    const previous = { ...process.env };
    delete process.env.APP_FRONTEND_URL;
    delete process.env.TRUSTED_ORIGINS;

    const { isTrustedOrigin } = await import('./origins');

    process.env.APP_FRONTEND_URL = 'https://app.example.com';

    try {
      expect(isTrustedOrigin('https://app.example.com')).toBe(true);
    } finally {
      process.env = previous;
    }
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/lib/origins.test.ts -t 'reads the environment at call time'
```

Expected: FAIL — `isTrustedOrigin` returns `false`, because the list was frozen at import with no `APP_FRONTEND_URL`.

- [ ] **Step 3: Make the list lazy**

In `apps/api/src/lib/origins.ts`, replace:

```ts
export const trustedOrigins = buildTrustedOrigins();
```

with:

```ts
/**
 * Computed per call, not at module load. On Workers, module scope can run
 * before the environment is populated, which would freeze this to an empty
 * list and break every credentialed request.
 */
export function getTrustedOrigins(): string[] {
  return buildTrustedOrigins();
}
```

and change `isTrustedOrigin` to:

```ts
export function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  return getTrustedOrigins().includes(origin);
}
```

Update the two consumers:

- `src/lib/auth.ts`: `trustedOrigins,` becomes `trustedOrigins: getTrustedOrigins(),` (the import changes to `getTrustedOrigins`).
- `src/lib/origins.test.ts`: the two existing cases that destructure `trustedOrigins` (`'lets a self-hosted deployment define its own origins'` and `'ignores unparseable entries instead of trusting them'`) become `const { isTrustedOrigin, getTrustedOrigins } = await loadOrigins({...})` and assert on `getTrustedOrigins()`.

- [ ] **Step 4: Run the origins tests**

```bash
cd apps/api && pnpm vitest run src/lib/origins.test.ts
```

Expected: PASS, all cases including the new one.

- [ ] **Step 5: Write the CORS middleware test**

Replace the Fastify `buildApp` block at the top of `src/lib/origins.test.ts` with a Hono equivalent. Delete the `import cors, { FastifyCorsOptions } from '@fastify/cors'` and `import Fastify, ...` lines and the `afterEach` that closes the app; add:

```ts
import { corsMiddleware } from '@/middleware/cors';
import { Hono } from 'hono';

function buildApp(trustedOrigins: string[]) {
  vi.stubEnv('TRUSTED_ORIGINS', trustedOrigins.join(','));
  vi.stubEnv('APP_FRONTEND_URL', '');

  const app = new Hono();
  app.use('*', corsMiddleware);
  app.get('/ping', (c) => c.json({ ping: 'pong' }));

  return app;
}
```

Then rewrite the five CORS cases to use `app.request()`. For example, the first becomes:

```ts
it('allows credentials for a trusted first-party origin', async () => {
  const app = buildApp([TRUSTED]);

  const response = await app.request('/ping', { headers: { origin: TRUSTED } });

  expect(response.headers.get('access-control-allow-origin')).toBe(TRUSTED);
  expect(response.headers.get('access-control-allow-credentials')).toBe('true');
});
```

Apply the same shape to the other four: `toBeUndefined()` becomes `toBeNull()` (Headers.get returns null), `response.statusCode` becomes `response.status`, and the preflight case passes `{ method: 'OPTIONS', headers: { origin: …, 'access-control-request-method': 'DELETE' } }`. Add `afterEach(() => vi.unstubAllEnvs())`.

- [ ] **Step 6: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/lib/origins.test.ts
```

Expected: FAIL — `@/middleware/cors` does not exist, and `hono` is not installed.

- [ ] **Step 7: Install Hono and write the middleware**

```bash
cd apps/api && pnpm add hono @hono/typebox-validator
```

Create `apps/api/src/middleware/cors.ts`:

```ts
import type { AppBindings } from '@/env';
import { isTrustedOrigin } from '@/lib/origins';
import type { MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';

/**
 * CORS is decided per request, because the API serves two different kinds of
 * caller:
 *
 *  - First-party app surfaces (the editor, admin, marketing) are trusted and
 *    need credentialed requests so the session cookie is sent and the response
 *    is readable.
 *
 *  - Public pages on user custom domains, whose origin we cannot enumerate.
 *    These only ever call session-free endpoints (reactions, form
 *    submissions), so they get CORS *without* credentials.
 *
 * Reflecting the origin without credentials is safe: no cookie is attached, so
 * an untrusted caller can only reach data that is already public. Echoing an
 * arbitrary origin *with* credentials would let any site read a logged-in
 * user's data.
 */
export const corsMiddleware: MiddlewareHandler<AppBindings> = (c, next) =>
  cors({
    origin: (origin) => origin, // reflect; hono/cors also sets `Vary: Origin`
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    exposeHeaders: ['Content-Length'],
    credentials: isTrustedOrigin(c.req.header('origin')),
    maxAge: 86400,
  })(c, next);
```

- [ ] **Step 8: Run the tests**

```bash
cd apps/api && pnpm vitest run src/lib/origins.test.ts
```

Expected: PASS — all five CORS cases and all nine origin-resolution cases.

Verify by hand that `Vary: Origin` is present on a credentialed response; if `hono/cors` does not set it with a function origin, add `c.header('Vary', 'Origin', { append: true })` before `next()` in the middleware. A credentialed response cached against another origin is a data leak, and the last test pins it.

- [ ] **Step 9: Full suite and commit**

```bash
cd apps/api && pnpm test && pnpm typecheck && pnpm lint
git add apps/api/src/lib/origins.ts apps/api/src/lib/origins.test.ts \
        apps/api/src/middleware/cors.ts apps/api/package.json pnpm-lock.yaml
git commit -m "refactor: evaluate trusted origins lazily and port CORS to hono"
```

---

## Task 5: WebCrypto encryption

`lib/encrypt.ts` uses `crypto.pbkdf2Sync` and `createCipheriv`. Move to WebCrypto, which is guaranteed on Workers. The serialised format is unchanged, so **existing encrypted integration tokens must still decrypt** — that is the test that matters.

**Files:**

- Modify: `apps/api/src/lib/encrypt.ts`
- Test: `apps/api/src/lib/encrypt.test.ts` (create)

**Interfaces:**

- Consumes: nothing
- Produces: unchanged public signatures —

  ```ts
  export async function encrypt(
    data: unknown,
    encryptionKey?: string
  ): Promise<string>;
  export async function decrypt<T = unknown>(
    encryptedString: string,
    encryptionKey?: string
  ): Promise<T>;
  export async function isEncrypted(data: string): Promise<boolean>;
  export async function reencrypt(
    encryptedData: string,
    currentKey: string,
    newKey: string
  ): Promise<string>;
  ```

- [ ] **Step 1: Capture a ciphertext from the current node:crypto implementation**

```bash
cd apps/api
ENCRYPTION_KEY=test-key-for-fixture pnpm tsx -e "
import { encrypt } from './src/lib/encrypt';
encrypt({ accessToken: 'abc123', refreshToken: 'def456' }).then(console.log);
"
```

Copy the printed base64 string — it becomes the fixture in Step 2. This is the whole point of the task: it is a real payload produced by the code running in production today.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/lib/encrypt.test.ts`, pasting the string from Step 1 as `LEGACY_CIPHERTEXT`:

```ts
import { decrypt, encrypt, isEncrypted, reencrypt } from './encrypt';
import { describe, expect, it } from 'vitest';

const KEY = 'test-key-for-fixture';

// Produced by the node:crypto implementation this task replaces. Existing
// integration tokens in production are encrypted exactly like this, so the
// WebCrypto version MUST decrypt it. If this test fails, every stored OAuth
// token becomes unreadable.
const LEGACY_CIPHERTEXT = 'PASTE_FROM_STEP_1';

describe('encrypt/decrypt', () => {
  it('decrypts a payload produced by the previous node:crypto implementation', async () => {
    await expect(decrypt(LEGACY_CIPHERTEXT, KEY)).resolves.toEqual({
      accessToken: 'abc123',
      refreshToken: 'def456',
    });
  });

  it('round-trips a value', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    await expect(decrypt(encrypted, KEY)).resolves.toEqual({ hello: 'world' });
  });

  it('produces a different ciphertext each time (fresh salt and IV)', async () => {
    const a = await encrypt({ hello: 'world' }, KEY);
    const b = await encrypt({ hello: 'world' }, KEY);
    expect(a).not.toBe(b);
  });

  it('fails to decrypt with the wrong key', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    await expect(decrypt(encrypted, 'wrong-key')).rejects.toThrow(
      /Decryption failed/
    );
  });

  it('rejects a tampered auth tag', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    const parsed = JSON.parse(Buffer.from(encrypted, 'base64').toString());
    parsed.encrypted = Buffer.from('tampered').toString('base64');
    const tampered = Buffer.from(JSON.stringify(parsed)).toString('base64');

    await expect(decrypt(tampered, KEY)).rejects.toThrow(/Decryption failed/);
  });

  it('recognises its own output', async () => {
    await expect(isEncrypted(await encrypt({ a: 1 }, KEY))).resolves.toBe(true);
    await expect(isEncrypted('not-encrypted')).resolves.toBe(false);
  });

  it('re-encrypts under a new key', async () => {
    const encrypted = await encrypt({ hello: 'world' }, KEY);
    const rotated = await reencrypt(encrypted, KEY, 'new-key');
    await expect(decrypt(rotated, 'new-key')).resolves.toEqual({
      hello: 'world',
    });
  });
});
```

- [ ] **Step 3: Run it against the current implementation**

```bash
cd apps/api && pnpm vitest run src/lib/encrypt.test.ts
```

Expected: PASS. This is deliberate — the tests characterise the behaviour that must survive. Now they become the safety net for the rewrite.

- [ ] **Step 4: Rewrite using WebCrypto**

In `apps/api/src/lib/encrypt.ts`, delete `import crypto from 'crypto'` and replace `deriveKey` and the bodies of `encrypt`/`decrypt`. The constants, the `EncryptedData` shape, the base64 envelope and `isEncrypted`/`reencrypt` all stay exactly as they are.

```ts
/**
 * Derives an encryption key from the base key and salt.
 *
 * WebCrypto rather than node:crypto's pbkdf2Sync: Workers guarantees the
 * former, and the parameters (PBKDF2-SHA256, 100k iterations, 32-byte output)
 * are identical, so ciphertext written by the previous implementation still
 * decrypts.
 */
async function deriveKey(
  encryptionKey: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(encryptionKey),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH * 8 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

`encrypt`'s body, between the JSON validation and the `result` object:

```ts
const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
const derivedKey = await deriveKey(key, salt);

// WebCrypto appends the auth tag to the ciphertext; the envelope stores
// them separately, so split the trailing AUTH_TAG_LENGTH bytes back out.
const sealed = new Uint8Array(
  await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
    derivedKey,
    new TextEncoder().encode(jsonString)
  )
);

const ciphertext = sealed.slice(0, sealed.length - AUTH_TAG_LENGTH);
const authTag = sealed.slice(sealed.length - AUTH_TAG_LENGTH);

const result: EncryptedData = {
  iv: Buffer.from(iv).toString('base64'),
  salt: Buffer.from(salt).toString('base64'),
  encrypted: Buffer.from(ciphertext).toString('base64'),
  authTag: Buffer.from(authTag).toString('base64'),
  version: 1,
};
```

`decrypt`'s body, replacing everything from `const iv = Buffer.from(...)` to the `return`:

```ts
    const iv = new Uint8Array(Buffer.from(data.iv, 'base64'));
    const salt = new Uint8Array(Buffer.from(data.salt, 'base64'));
    const authTag = new Uint8Array(Buffer.from(data.authTag, 'base64'));
    const ciphertext = new Uint8Array(Buffer.from(data.encrypted, 'base64'));

    const derivedKey = await deriveKey(key, salt);

    // Re-join ciphertext and tag into the single buffer WebCrypto expects.
    const sealed = new Uint8Array(ciphertext.length + authTag.length);
    sealed.set(ciphertext);
    sealed.set(authTag, ciphertext.length);

    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH * 8 },
      derivedKey,
      sealed
    );

    return JSON.parse(new TextDecoder().decode(plaintext)) as T;
```

- [ ] **Step 5: Run the tests**

```bash
cd apps/api && pnpm vitest run src/lib/encrypt.test.ts
```

Expected: PASS, all seven. The legacy-ciphertext case passing is what proves stored OAuth tokens survive the migration. If it fails, **stop** — do not proceed to later tasks; the parameters have diverged somewhere.

- [ ] **Step 6: Full suite and commit**

```bash
cd apps/api && pnpm test && pnpm typecheck && pnpm lint
git add apps/api/src/lib/encrypt.ts apps/api/src/lib/encrypt.test.ts
git commit -m "refactor: encrypt with WebCrypto instead of node:crypto"
```

---

## Task 6: Auth, session and API-key middleware

**Files:**

- Create: `apps/api/src/middleware/authenticate.ts`, `apps/api/src/middleware/authenticate-api-key.ts`, `apps/api/src/middleware/request-context.ts`
- Modify: `apps/api/src/lib/auth.ts`, `apps/api/src/env.ts`
- Move: `src/decorators/authenticate-api-key.test.ts` → `src/middleware/authenticate-api-key.test.ts`
- Delete: `apps/api/src/decorators/` (whole directory)

**Interfaces:**

- Consumes: `createPrisma`, `runWithPrisma` (Task 3); `AppBindings` (Task 2)
- Produces:

  ```ts
  // lib/auth.ts
  export function createAuth(env: { AUTH_RATE_LIMIT: KVNamespace }): ReturnType<typeof betterAuth>;
  // middleware/request-context.ts
  export const requestContext: MiddlewareHandler<AppBindings>;
  export function getAuth(): ReturnType<typeof betterAuth>;
  // middleware/authenticate.ts
  export interface AuthenticatedSession { user: { id: string }; activeOrganizationId: string }
  export function requireSession(c: Context<AppBindings>): AuthenticatedSession;  // throws 401
  export async function optionalSession(c: Context<AppBindings>): Promise<AuthenticatedSession | null>;
  // middleware/authenticate-api-key.ts
  export const requireApiKey: MiddlewareHandler<AppBindings>;
  ```

- [ ] **Step 1: Port the API-key test**

```bash
cd apps/api && git mv src/decorators/authenticate-api-key.test.ts src/middleware/authenticate-api-key.test.ts
```

Rewrite it to drive Hono middleware rather than a bare function. Replace the whole file with:

```ts
import { requireApiKey } from './authenticate-api-key';
import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

const KEY = 'internal-api-key-value';

function buildApp() {
  const app = new Hono();
  app.use('/protected', requireApiKey);
  app.get('/protected', (c) => c.json({ ok: true }));
  return app;
}

describe('requireApiKey', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts the correct key', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': KEY },
    });

    expect(response.status).toBe(200);
  });

  it('rejects a wrong key with a 401', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': 'not-the-key' },
    });

    expect(response.status).toBe(401);
  });

  it('rejects when the header is absent', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected');

    expect(response.status).toBe(401);
  });

  it('rejects rather than allowing everything when no key is configured', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': '' },
    });

    expect(response.status).toBe(401);
  });

  it('rejects a key of a different length without leaking timing', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);
    const response = await buildApp().request('/protected', {
      headers: { 'x-api-key': 'short' },
    });

    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/middleware/authenticate-api-key.test.ts
```

Expected: FAIL — `./authenticate-api-key` does not exist.

- [ ] **Step 3: Write the API-key middleware**

Create `apps/api/src/middleware/authenticate-api-key.ts`:

```ts
import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time comparison, so a wrong key cannot be narrowed down by timing
 * how long the rejection takes.
 */
function matchesSecret(provided: string, expected: string): boolean {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  // timingSafeEqual throws on a length mismatch, which would leak the length.
  if (providedBytes.length !== expectedBytes.length) {
    return false;
  }

  return timingSafeEqual(providedBytes, expectedBytes);
}

/** Authenticates server-to-server callers via the shared internal API key. */
export const requireApiKey: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  const expected = process.env.INTERNAL_API_KEY;
  const provided = c.req.header('x-api-key');

  const isValid = Boolean(
    expected && provided && matchesSecret(provided, expected)
  );

  if (!isValid) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  await next();
};
```

- [ ] **Step 4: Run the test**

```bash
cd apps/api && pnpm vitest run src/middleware/authenticate-api-key.test.ts
```

Expected: PASS, all five.

- [ ] **Step 5: Make better-auth request-scoped**

In `apps/api/src/lib/auth.ts`, wrap the whole `betterAuth({...})` call in a factory and add KV-backed rate limiting. Change the export from:

```ts
export const auth = betterAuth({
```

to:

```ts
export function createAuth(env: { AUTH_RATE_LIMIT: KVNamespace }) {
  return betterAuth({
```

and close it with `});\n}` at the end. Inside, make three changes and leave everything else identical:

```ts
    baseURL: process.env.API_BASE_URL,
    rateLimit: {
      window: 10,
      max: 100,
      storage: 'secondary-storage',
    },
    /**
     * better-auth's default rate-limit store is in-memory. On Render's single
     * instance that was fine; across Worker isolates each isolate would keep
     * its own counter, silently weakening the limit. KV is shared.
     */
    secondaryStorage: {
      get: (key) => env.AUTH_RATE_LIMIT.get(key),
      set: (key, value, ttl) =>
        env.AUTH_RATE_LIMIT.put(key, value, ttl ? { expirationTtl: ttl } : undefined),
      delete: (key) => env.AUTH_RATE_LIMIT.delete(key),
    },
    trustedOrigins: getTrustedOrigins(),
```

The `database: prismaAdapter(prisma as PrismaClient, ...)` line stays exactly as it is — `prisma` is now the request-scoped proxy from Task 3, so it resolves correctly.

- [ ] **Step 6: Write the request-context middleware**

Create `apps/api/src/middleware/request-context.ts`:

```ts
import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { createPrisma, runWithPrisma } from '@/lib/prisma';
import type { MiddlewareHandler } from 'hono';
import { AsyncLocalStorage } from 'node:async_hooks';

type Auth = ReturnType<typeof createAuth>;

const authStore = new AsyncLocalStorage<Auth>();

/**
 * better-auth holds the Prisma adapter, so it inherits Prisma's per-request
 * lifetime. It is reached through a store rather than the Hono context so
 * that lib/* modules can use it without taking a Context parameter.
 */
export function getAuth(): Auth {
  const auth = authStore.getStore();

  if (!auth) {
    throw new Error('getAuth() called outside a request context');
  }

  return auth;
}

/** Must be the first middleware registered — everything downstream needs it. */
export const requestContext: MiddlewareHandler<AppBindings> = (c, next) =>
  runWithPrisma(createPrisma(c.env), () =>
    authStore.run(createAuth(c.env), next)
  );
```

- [ ] **Step 7: Write the session middleware**

Create `apps/api/src/middleware/authenticate.ts`:

```ts
import type { AppBindings } from '@/env';
import { getAuth } from '@/middleware/request-context';
import { captureException } from '@sentry/node';
import type { Context, MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

export interface AuthenticatedSession {
  user: { id: string };
  activeOrganizationId: string;
}

/**
 * Resolves the session once per request and parks it on the context, so a
 * handler that needs it does not pay for a second lookup.
 *
 * Deliberately never throws: public endpoints (reactions, form submissions)
 * run through the same chain. Handlers that require a session call
 * requireSession().
 */
export const resolveSession: MiddlewareHandler<AppBindings> = async (
  c,
  next
) => {
  try {
    const session = await getAuth().api.getSession({
      headers: c.req.raw.headers,
    });
    const user = session?.user;

    c.set(
      'session',
      user
        ? {
            user: { id: user.id },
            activeOrganizationId:
              (session as { session?: { activeOrganizationId?: string } })
                .session?.activeOrganizationId || '',
          }
        : null
    );
  } catch (error) {
    captureException(error);
    c.set('session', null);
  }

  await next();
};

export function requireSession(c: Context<AppBindings>): AuthenticatedSession {
  const session = c.get('session');

  if (!session) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  return session;
}

export async function optionalSession(
  c: Context<AppBindings>
): Promise<AuthenticatedSession | null> {
  return c.get('session');
}
```

`@sentry/node` is still imported here — Task 11 swaps it repo-wide.

- [ ] **Step 8: Remove the placeholder and delete the decorators**

In `src/env.ts`, delete the temporary inline `AuthenticatedSession` interface added in Task 2 Step 4; the real one now comes from the `import type` at the top of that file.

```bash
cd apps/api && rm -rf src/decorators
```

`src/index.ts` still references the deleted decorators and will not typecheck. That is expected and fixed in Task 7.

- [ ] **Step 9: Run the middleware tests**

```bash
cd apps/api && pnpm vitest run src/middleware/
```

Expected: PASS. `pnpm typecheck` will still fail on `src/index.ts` until Task 7 — that is the one place in this plan where a task ends with a known-red typecheck, because splitting it further would mean shipping an app that boots into nothing.

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/middleware apps/api/src/lib/auth.ts apps/api/src/env.ts
git rm -r --cached apps/api/src/decorators 2>/dev/null || true
git add -A apps/api/src
git commit -m "refactor: port auth and api-key guards to hono middleware"
```

---

## Task 7: The app shell — `createApp()`, `index.ts`, and core routes

Ends with a Worker that boots, serves `/`, `/ping`, `/session/me` and `/api/auth/*`, and typechecks green again.

**Files:**

- Create: `apps/api/src/app.ts`, `apps/api/src/middleware/cache-control.ts`, `apps/api/src/middleware/timing.ts`
- Rewrite: `apps/api/src/index.ts`, `apps/api/src/modules/core.ts`
- Test: `apps/api/src/app.test.ts` (create)

**Interfaces:**

- Consumes: `requestContext`, `resolveSession`, `requireSession` (Task 6); `corsMiddleware` (Task 4); `AppBindings` (Task 2)
- Produces:

  ```ts
  // app.ts
  export function createApp(): Hono<AppBindings>;
  // index.ts
  export default {
    fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
      Response | Promise<Response>,
  };
  ```

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/app.test.ts`:

```ts
import { createApp } from './app';
import { describe, expect, it } from 'vitest';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  AUTH_RATE_LIMIT: {
    get: async () => null,
    put: async () => undefined,
    delete: async () => undefined,
  },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

describe('app shell', () => {
  it('serves the root message', async () => {
    const response = await createApp().request('/', {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: 'Welcome to the Linky API',
    });
  });

  it('serves ping', async () => {
    const response = await createApp().request('/ping', {}, env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ping: 'pong' });
  });

  it('defaults to no-store so nothing is cached by accident', async () => {
    const response = await createApp().request('/ping', {}, env);

    expect(response.headers.get('cache-control')).toBe(
      'no-store, must-revalidate'
    );
  });

  it('returns 401 from /session/me without a session', async () => {
    const response = await createApp().request('/session/me', {}, env);

    expect(response.status).toBe(401);
  });

  it('returns 404 for an unknown path', async () => {
    const response = await createApp().request('/nope', {}, env);

    expect(response.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/app.test.ts
```

Expected: FAIL — `./app` does not exist.

- [ ] **Step 3: Write the two remaining middleware**

`apps/api/src/middleware/cache-control.ts`:

```ts
import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';

/**
 * Default to no-store, but let individual routes opt into caching by setting
 * their own Cache-Control header.
 */
export const cacheControl: MiddlewareHandler<AppBindings> = async (c, next) => {
  await next();

  if (!c.res.headers.get('Cache-Control')) {
    c.res.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
};
```

`apps/api/src/middleware/timing.ts`:

```ts
import type { AppBindings } from '@/env';
import type { MiddlewareHandler } from 'hono';

const SLOW_REQUEST_THRESHOLD_MS = 200;

export const timing: MiddlewareHandler<AppBindings> = async (c, next) => {
  const startTime = Date.now();

  await next();

  const responseTime = Date.now() - startTime;

  if (responseTime > SLOW_REQUEST_THRESHOLD_MS) {
    console.warn(
      JSON.stringify({ url: c.req.url, responseTime, msg: 'Slow request' })
    );
  }
};
```

- [ ] **Step 4: Rewrite `src/modules/core.ts`**

```ts
import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { Hono } from 'hono';

const coreRoutes = new Hono<AppBindings>();

coreRoutes.get('/', (c) => c.json({ message: 'Welcome to the Linky API' }));

coreRoutes.get('/ping', (c) => c.json({ ping: 'pong' }));

coreRoutes.get('/session/me', (c) => c.json({ session: requireSession(c) }));

export default coreRoutes;
```

- [ ] **Step 5: Write `src/app.ts`**

Only `core` is mounted for now; Tasks 12–16 add the rest, each appending one `app.route(...)` line.

```ts
import type { AppBindings } from '@/env';
import { createAuth } from '@/lib/auth';
import { resolveSession } from '@/middleware/authenticate';
import { cacheControl } from '@/middleware/cache-control';
import { corsMiddleware } from '@/middleware/cors';
import { requestContext } from '@/middleware/request-context';
import { timing } from '@/middleware/timing';
import coreRoutes from '@/modules/core';
import { Hono } from 'hono';

export function createApp() {
  const app = new Hono<AppBindings>();

  // Order matters: requestContext must be first, because everything below it
  // (including session resolution) reads the per-request Prisma client.
  app.use('*', requestContext);
  app.use('*', corsMiddleware);
  app.use('*', cacheControl);
  app.use('*', timing);
  app.use('*', resolveSession);

  // better-auth speaks the Fetch API natively, so this is a direct handoff —
  // no header or body reconstruction needed.
  app.on(['GET', 'POST'], '/api/auth/*', (c) =>
    createAuth(c.env).handler(c.req.raw)
  );

  app.route('/', coreRoutes);

  return app;
}
```

- [ ] **Step 6: Rewrite `src/index.ts`**

The whole file becomes:

```ts
import { createApp } from '@/app';

const app = createApp();

export default {
  fetch: app.fetch,
};
```

No env shim import is needed — Task 1 confirmed `process.env` is populated natively.

Delete `apps/api/build.js` and `apps/api/cjs-shim.ts`.

- [ ] **Step 7: Run the tests**

```bash
cd apps/api && pnpm vitest run src/app.test.ts && pnpm typecheck
```

Expected: all five app cases PASS, and typecheck is green again for the first time since Task 6.

Note: `pnpm test` as a whole will fail here, because the 19 not-yet-ported module files still reference Fastify types. Those are fixed in Tasks 12–16. Run `pnpm vitest run src/app.test.ts src/lib src/middleware` to check the ported surface.

- [ ] **Step 8: Boot it locally**

```bash
cd apps/api && cp .dev.vars.example .dev.vars   # fill in values from ../../.env.local
pnpm wrangler dev
# in another shell:
curl http://localhost:8787/ping
```

Expected: `{"ping":"pong"}`. This is the first time the Worker has actually run.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/app.ts apps/api/src/index.ts apps/api/src/modules/core.ts \
        apps/api/src/middleware apps/api/src/app.test.ts
git rm apps/api/build.js apps/api/cjs-shim.ts
git commit -m "feat: boot the api as a hono worker with core routes"
```

---

## Task 8: S3 uploads via aws4fetch

**Files:**

- Create: `apps/api/src/lib/aws.ts`, `apps/api/src/lib/s3.ts`, `apps/api/src/lib/s3.test.ts`
- Modify: `apps/api/src/modules/assets/service.ts`

**Interfaces:**

- Consumes: nothing
- Produces:

  ```ts
  // lib/aws.ts
  export function getAwsClient(): AwsClient;
  // lib/s3.ts
  export async function putObject(args: {
    bucket: string;
    key: string;
    body: Uint8Array;
    contentType: string;
  }): Promise<void>; // throws on non-2xx
  ```

- [ ] **Step 1: Install aws4fetch**

```bash
cd apps/api && pnpm add aws4fetch
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/lib/s3.test.ts`:

```ts
import { putObject } from './s3';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('putObject', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends a signed PUT to the right bucket and key', async () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    vi.stubEnv('AWS_REGION', 'us-east-1');

    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await putObject({
      bucket: 'test.glow.user-uploads',
      key: 'pg-bg-abc/def.webp',
      body: new Uint8Array([1, 2, 3]),
      contentType: 'image/webp',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;

    expect(request.method).toBe('PUT');
    expect(request.url).toBe(
      'https://test.glow.user-uploads.s3.us-east-1.amazonaws.com/pg-bg-abc/def.webp'
    );
    expect(request.headers.get('content-type')).toBe('image/webp');
    // SigV4 signing is the whole point — an unsigned PUT would 403 in prod.
    expect(request.headers.get('authorization')).toMatch(/^AWS4-HMAC-SHA256 /);
  });

  it('throws when S3 rejects the upload', async () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('AccessDenied', { status: 403 }))
    );

    await expect(
      putObject({
        bucket: 'b',
        key: 'k',
        body: new Uint8Array(),
        contentType: 'image/png',
      })
    ).rejects.toThrow(/403/);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/lib/s3.test.ts
```

Expected: FAIL — `./s3` does not exist.

- [ ] **Step 4: Write the AWS client and S3 helper**

`apps/api/src/lib/aws.ts`:

```ts
import { AwsClient } from 'aws4fetch';

let client: AwsClient | undefined;

/**
 * A SigV4 signer over fetch, replacing the AWS SDK. The SDK's three packages
 * added 1-2MB to a bundle with a 10MB ceiling, and this API only ever does
 * single-shot S3 PUTs and two DynamoDB operations.
 *
 * Safe at module scope: the signer holds no socket, just credentials.
 */
export function getAwsClient(): AwsClient {
  if (!client) {
    client = new AwsClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
      region: process.env.AWS_REGION,
    });
  }

  return client;
}

export function getAwsRegion(): string {
  return process.env.AWS_REGION as string;
}
```

`apps/api/src/lib/s3.ts`:

```ts
import { getAwsClient, getAwsRegion } from '@/lib/aws';

/**
 * Single-shot signed PUT. Uploads are capped at 10MB by the route, so the
 * SDK's multipart machinery was never exercised.
 */
export async function putObject({
  bucket,
  key,
  body,
  contentType,
}: {
  bucket: string;
  key: string;
  body: Uint8Array;
  contentType: string;
}): Promise<void> {
  const url = `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`;

  const response = await getAwsClient().fetch(url, {
    method: 'PUT',
    body,
    headers: { 'Content-Type': contentType },
  });

  if (!response.ok) {
    throw new Error(
      `S3 PUT ${key} failed with ${response.status}: ${await response.text()}`
    );
  }
}
```

- [ ] **Step 5: Run the test**

```bash
cd apps/api && pnpm vitest run src/lib/s3.test.ts
```

Expected: PASS, both cases.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/lib/aws.ts apps/api/src/lib/s3.ts apps/api/src/lib/s3.test.ts \
        apps/api/package.json pnpm-lock.yaml
git commit -m "feat: sign s3 uploads with aws4fetch instead of the aws sdk"
```

---

## Task 9: WASM image pipeline

The riskiest behavioural change. `sharp().resize(w, h)` defaults to **fit: cover, position: centre** — a naive resize would silently reframe every uploaded image.

**Files:**

- Create: `apps/api/src/modules/assets/image.ts`, `apps/api/src/modules/assets/image.test.ts`
- Modify: `apps/api/src/modules/assets/service.ts`

**Interfaces:**

- Consumes: `putObject` (Task 8)
- Produces:

  ```ts
  // assets/image.ts
  export function coverCrop(
    width: number,
    height: number,
    targetWidth: number,
    targetHeight: number
  ): { sx: number; sy: number; sWidth: number; sHeight: number };
  export async function encodeVariants(
    source: Uint8Array,
    config: { width: number; height: number; quality: number }
  ): Promise<{ webp: Uint8Array; png: Uint8Array }>;
  ```

  `assets/service.ts` keeps its existing `uploadAsset` contract, except `multipartFile` is replaced by `file: File`:

  ```ts
  export async function uploadAsset(args: {
    context: AssetContexts;
    file: File;
    referenceId: string;
  }): Promise<{ data: { url: string } } | { error: string }>;
  ```

- [ ] **Step 1: Write the failing test for cover-crop geometry**

This is pure arithmetic and deserves its own tests — it is where a regression would be silent.

Create `apps/api/src/modules/assets/image.test.ts`:

```ts
import { coverCrop } from './image';
import { describe, expect, it } from 'vitest';

// sharp's .resize(w, h) defaults to fit:cover, position:centre — it crops the
// source to the target aspect ratio and centres the crop. Replicating that
// exactly is the difference between "resized" and "reframed".
describe('coverCrop', () => {
  it('crops the sides of a too-wide source', () => {
    // 2000x1000 (2:1) into 1200x800 (3:2) -> keep full height, crop width
    expect(coverCrop(2000, 1000, 1200, 800)).toEqual({
      sx: 250,
      sy: 0,
      sWidth: 1500,
      sHeight: 1000,
    });
  });

  it('crops the top and bottom of a too-tall source', () => {
    // 1000x2000 (1:2) into 800x800 (1:1) -> keep full width, crop height
    expect(coverCrop(1000, 2000, 800, 800)).toEqual({
      sx: 0,
      sy: 500,
      sWidth: 1000,
      sHeight: 1000,
    });
  });

  it('does not crop a source that already matches the target ratio', () => {
    expect(coverCrop(2400, 1600, 1200, 800)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 2400,
      sHeight: 1600,
    });
  });

  it('upscales a small source rather than leaving it small', () => {
    // sharp does not set withoutEnlargement, so small images are enlarged.
    // The crop covers the whole source; the resize step does the enlarging.
    expect(coverCrop(100, 100, 800, 800)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 100,
      sHeight: 100,
    });
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/modules/assets/image.test.ts
```

Expected: FAIL — `./image` does not exist.

- [ ] **Step 3: Install the codecs and write the image module**

```bash
cd apps/api && pnpm add @jsquash/resize @jsquash/webp @jsquash/png @jsquash/jpeg
```

`@jsquash/jpeg` is needed because most uploads are JPEG and the decoder is format-specific.

Create `apps/api/src/modules/assets/image.ts`:

```ts
import decodeJpeg from '@jsquash/jpeg/decode';
import decodePng, { encode as encodePng } from '@jsquash/png';
import resize from '@jsquash/resize';
import { encode as encodeWebp } from '@jsquash/webp';

/**
 * Replicates sharp's `.resize(w, h)` default of fit:cover, position:centre —
 * crop the source to the target aspect ratio, centred, then scale.
 *
 * Getting this wrong does not error, it just silently reframes every image a
 * user has ever uploaded, so it is unit-tested separately from the codecs.
 */
export function coverCrop(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const sourceRatio = width / height;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    // Source is too wide: keep full height, crop the sides.
    const sWidth = Math.round(height * targetRatio);
    return {
      sx: Math.round((width - sWidth) / 2),
      sy: 0,
      sWidth,
      sHeight: height,
    };
  }

  if (sourceRatio < targetRatio) {
    // Source is too tall: keep full width, crop top and bottom.
    const sHeight = Math.round(width / targetRatio);
    return {
      sx: 0,
      sy: Math.round((height - sHeight) / 2),
      sWidth: width,
      sHeight,
    };
  }

  return { sx: 0, sy: 0, sWidth: width, sHeight: height };
}

async function decode(source: Uint8Array): Promise<ImageData> {
  // PNG magic bytes; everything else this API accepts is JPEG or WebP, both
  // of which the JPEG decoder rejects loudly rather than silently mangling.
  const isPng =
    source[0] === 0x89 &&
    source[1] === 0x50 &&
    source[2] === 0x4e &&
    source[3] === 0x47;

  const buffer = source.buffer.slice(
    source.byteOffset,
    source.byteOffset + source.byteLength
  ) as ArrayBuffer;

  return isPng ? decodePng(buffer) : decodeJpeg(buffer);
}

function crop(
  image: ImageData,
  region: ReturnType<typeof coverCrop>
): ImageData {
  const { sx, sy, sWidth, sHeight } = region;

  if (
    sx === 0 &&
    sy === 0 &&
    sWidth === image.width &&
    sHeight === image.height
  ) {
    return image;
  }

  const output = new Uint8ClampedArray(sWidth * sHeight * 4);

  for (let row = 0; row < sHeight; row++) {
    const sourceStart = ((sy + row) * image.width + sx) * 4;
    output.set(
      image.data.subarray(sourceStart, sourceStart + sWidth * 4),
      row * sWidth * 4
    );
  }

  return { data: output, width: sWidth, height: sHeight, colorSpace: 'srgb' };
}

/** Produces the webp and png variants the CDN serves, from one source buffer. */
export async function encodeVariants(
  source: Uint8Array,
  config: { width: number; height: number; quality: number }
): Promise<{ webp: Uint8Array; png: Uint8Array }> {
  const decoded = await decode(source);

  const cropped = crop(
    decoded,
    coverCrop(decoded.width, decoded.height, config.width, config.height)
  );

  const resized = await resize(cropped, {
    width: config.width,
    height: config.height,
  });

  // png() has no quality knob in jsquash — sharp's `quality` there drove
  // palette quantisation, which has no equivalent. Output is visually
  // identical; byte size will differ.
  const [webp, png] = await Promise.all([
    encodeWebp(resized, { quality: config.quality }),
    encodePng(resized),
  ]);

  return { webp: new Uint8Array(webp), png: new Uint8Array(png) };
}
```

- [ ] **Step 4: Run the geometry tests**

```bash
cd apps/api && pnpm vitest run src/modules/assets/image.test.ts
```

Expected: PASS, all four.

- [ ] **Step 5: Rewrite `assets/service.ts`**

Replace the whole file:

```ts
import { putObject } from '@/lib/s3';
import { assetContexts, AssetContexts } from '@/modules/assets/constants';
import { encodeVariants } from '@/modules/assets/image';

function bucketName(): string {
  return `${process.env.APP_ENV}.glow.user-uploads`;
}

function cdnUrl(key: string): string {
  return process.env.APP_ENV === 'development'
    ? `https://cdn.dev.lin.ky/${key}`
    : `https://cdn.lin.ky/${key}`;
}

export async function uploadAsset({
  context,
  file,
  referenceId,
}: {
  context: AssetContexts;
  file: File;
  referenceId: string;
}): Promise<{ data: { url: string } } | { error: string }> {
  const assetConfig = assetContexts[context];
  const fileId = crypto.randomUUID();
  const baseFileName = `${assetConfig.keyPrefix}-${referenceId}/${fileId}`;

  try {
    const source = new Uint8Array(await file.arrayBuffer());

    const { webp, png } = await encodeVariants(source, {
      width: assetConfig.resize.width,
      height: assetConfig.resize.height,
      quality: assetConfig.quality,
    });

    const bucket = bucketName();

    await Promise.all([
      putObject({
        bucket,
        key: `${baseFileName}.webp`,
        body: webp,
        contentType: 'image/webp',
      }),
      putObject({
        bucket,
        key: `${baseFileName}.png`,
        body: png,
        contentType: 'image/png',
      }),
    ]);

    return { data: { url: cdnUrl(`${baseFileName}.webp`) } };
  } catch (error) {
    console.error('Error uploading asset:', error);
    return { error: 'Failed to upload asset' };
  }
}
```

Note the key format, the `.webp` URL and the bucket name are byte-identical to the old implementation — that is what keeps every existing `cdn.lin.ky` link valid.

- [ ] **Step 6: Remove sharp and the AWS SDK from assets**

```bash
cd apps/api && pnpm remove sharp @aws-sdk/client-s3 @aws-sdk/lib-storage
```

- [ ] **Step 7: Check the bundle**

```bash
cd apps/api && pnpm wrangler deploy --dry-run --outdir=/tmp/wsize
```

Expected: reported compressed size well under 10 MB. If it is close, report the number before continuing — the WASM codecs are the largest single addition in the plan.

- [ ] **Step 8: Commit**

```bash
cd apps/api && pnpm vitest run src/modules/assets && pnpm typecheck
git add apps/api/src/modules/assets apps/api/package.json pnpm-lock.yaml
git commit -m "feat: resize uploads with jsquash wasm instead of sharp"
```

---

## Task 10: DynamoDB via aws4fetch

**Files:**

- Create: `apps/api/src/modules/reactions/dynamo.ts`, `apps/api/src/modules/reactions/dynamo.test.ts`
- Modify: `apps/api/src/modules/reactions/service.ts`

**Interfaces:**

- Consumes: `getAwsClient`, `getAwsRegion` (Task 8)
- Produces:

  ```ts
  export function marshal(value: unknown): AttributeValue;
  export function unmarshal(value: AttributeValue): unknown;
  export async function batchGetItem(args: {
    table: string;
    keys: Record<string, unknown>[];
  }): Promise<Record<string, unknown>[]>;
  export async function updateItem(args: {
    table: string;
    key: Record<string, unknown>;
    updateExpression: string;
    expressionAttributeNames: Record<string, string>;
    expressionAttributeValues: Record<string, unknown>;
  }): Promise<void>;
  ```

- [ ] **Step 1: Write the failing marshalling test**

Create `apps/api/src/modules/reactions/dynamo.test.ts`:

```ts
import { marshal, unmarshal } from './dynamo';
import { describe, expect, it } from 'vitest';

// lib-dynamodb did this for us. Getting it wrong corrupts reaction counters
// silently, so the mapping is pinned in both directions.
describe('marshal', () => {
  it('maps a string', () => {
    expect(marshal('abc')).toEqual({ S: 'abc' });
  });

  it('maps a number as a string, per the wire format', () => {
    expect(marshal(0)).toEqual({ N: '0' });
    expect(marshal(12)).toEqual({ N: '12' });
  });

  it('maps an empty map', () => {
    expect(marshal({})).toEqual({ M: {} });
  });

  it('maps a nested counter map', () => {
    expect(marshal({ love: 3, rocket: 1 })).toEqual({
      M: { love: { N: '3' }, rocket: { N: '1' } },
    });
  });

  it('maps a boolean and null', () => {
    expect(marshal(true)).toEqual({ BOOL: true });
    expect(marshal(null)).toEqual({ NULL: true });
  });
});

describe('unmarshal', () => {
  it('round-trips a counter map', () => {
    expect(unmarshal(marshal({ love: 3, rocket: 1 }))).toEqual({
      love: 3,
      rocket: 1,
    });
  });

  it('returns numbers as numbers, not strings', () => {
    expect(unmarshal({ N: '7' })).toBe(7);
  });

  it('round-trips a full item', () => {
    const item = { PK: 'page-1', SK: 'totals', reactionTotals: { love: 2 } };
    expect(unmarshal(marshal(item))).toEqual(item);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/modules/reactions/dynamo.test.ts
```

Expected: FAIL — `./dynamo` does not exist.

- [ ] **Step 3: Write the DynamoDB client**

Create `apps/api/src/modules/reactions/dynamo.ts`:

```ts
import { getAwsClient, getAwsRegion } from '@/lib/aws';

export type AttributeValue =
  | { S: string }
  | { N: string }
  | { BOOL: boolean }
  | { NULL: true }
  | { L: AttributeValue[] }
  | { M: Record<string, AttributeValue> };

/** The marshalling @aws-sdk/lib-dynamodb used to do; see dynamo.test.ts. */
export function marshal(value: unknown): AttributeValue {
  if (value === null || value === undefined) {
    return { NULL: true };
  }

  if (typeof value === 'string') {
    return { S: value };
  }

  if (typeof value === 'number') {
    return { N: String(value) };
  }

  if (typeof value === 'boolean') {
    return { BOOL: value };
  }

  if (Array.isArray(value)) {
    return { L: value.map(marshal) };
  }

  return {
    M: Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        marshal(v),
      ])
    ),
  };
}

export function unmarshal(value: AttributeValue): unknown {
  if ('S' in value) return value.S;
  if ('N' in value) return Number(value.N);
  if ('BOOL' in value) return value.BOOL;
  if ('NULL' in value) return null;
  if ('L' in value) return value.L.map(unmarshal);

  return Object.fromEntries(
    Object.entries(value.M).map(([k, v]) => [k, unmarshal(v)])
  );
}

async function call<T>(target: string, body: unknown): Promise<T> {
  const region = getAwsRegion();

  const response = await getAwsClient().fetch(
    `https://dynamodb.${region}.amazonaws.com/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.0',
        'X-Amz-Target': `DynamoDB_20120810.${target}`,
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(
      `DynamoDB ${target} failed with ${response.status}: ${await response.text()}`
    );
  }

  return response.json() as Promise<T>;
}

export async function batchGetItem({
  table,
  keys,
}: {
  table: string;
  keys: Record<string, unknown>[];
}): Promise<Record<string, unknown>[]> {
  const result = await call<{
    Responses?: Record<string, Record<string, AttributeValue>[]>;
  }>('BatchGetItem', {
    RequestItems: {
      [table]: {
        Keys: keys.map(
          (key) => (marshal(key) as { M: Record<string, AttributeValue> }).M
        ),
      },
    },
  });

  return (result.Responses?.[table] ?? []).map(
    (item) => unmarshal({ M: item }) as Record<string, unknown>
  );
}

export async function updateItem({
  table,
  key,
  updateExpression,
  expressionAttributeNames,
  expressionAttributeValues,
}: {
  table: string;
  key: Record<string, unknown>;
  updateExpression: string;
  expressionAttributeNames: Record<string, string>;
  expressionAttributeValues: Record<string, unknown>;
}): Promise<void> {
  await call('UpdateItem', {
    TableName: table,
    Key: (marshal(key) as { M: Record<string, AttributeValue> }).M,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: Object.fromEntries(
      Object.entries(expressionAttributeValues).map(([k, v]) => [k, marshal(v)])
    ),
  });
}
```

- [ ] **Step 4: Run the test**

```bash
cd apps/api && pnpm vitest run src/modules/reactions/dynamo.test.ts
```

Expected: PASS, all eight.

- [ ] **Step 5: Rewrite the calls in `reactions/service.ts`**

Replace the imports and client construction at the top:

```ts
import { batchGetItem, updateItem } from '@/modules/reactions/dynamo';
import { captureException } from '@sentry/node';

const TABLE_NAME = process.env.REACTIONS_TABLE_NAME as string;
```

In `getReactionsForPageId`, replace the `params` object and `dynamoDb.send(new BatchGetCommand(params))` with:

```ts
const items = await batchGetItem({
  table: TABLE_NAME,
  keys: [
    { PK: pageId, SK: 'totals' },
    { PK: pageId, SK: `entries#${ipAddress}` },
  ],
});
```

then delete the `const items = data?.Responses?.[...]` line and the `if (!items)` guard's `data` reference (keep the guard, checking `items.length === 0`). The `for (const item of items)` loop below is unchanged.

In `updateReactionMap`, replace the two `dynamoDb.send(new UpdateCommand(...))` calls with `updateItem` calls, keeping the expressions byte-identical:

```ts
try {
  // DynamoDB rejects a single expression that sets both #map and
  // #map.#type (overlapping document paths), so this must stay two calls:
  // ensure the map exists, then atomically increment the nested counter.
  await updateItem({
    table: TABLE_NAME,
    key: { PK: pageId, SK: sk },
    updateExpression: 'SET #map = if_not_exists(#map, :emptyMap)',
    expressionAttributeNames: { '#map': mapName },
    expressionAttributeValues: { ':emptyMap': {} },
  });

  await updateItem({
    table: TABLE_NAME,
    key: { PK: pageId, SK: sk },
    updateExpression:
      'SET #map.#type = if_not_exists(#map.#type, :zero) + :increment',
    expressionAttributeNames: { '#map': mapName, '#type': reactionType },
    expressionAttributeValues: { ':zero': 0, ':increment': increment },
  });
} catch (error) {
  console.error(`Error updating ${mapName} for ${sk}:`, error);
  captureException(error);
  throw error;
}
```

- [ ] **Step 6: Remove the DynamoDB SDK**

```bash
cd apps/api && pnpm remove @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

- [ ] **Step 7: Run the reactions tests**

```bash
cd apps/api && pnpm vitest run src/modules/reactions
```

Expected: PASS. `service.test.ts` already exists and covers this module; it must pass **without edits**, since the service's public behaviour is unchanged.

- [ ] **Step 8: Commit**

```bash
cd apps/api && pnpm typecheck
git add apps/api/src/modules/reactions apps/api/package.json pnpm-lock.yaml
git commit -m "feat: call dynamodb with aws4fetch instead of the aws sdk"
```

---

## Task 11: Sentry, Slack, PostHog and email

Four small integration swaps, grouped because none is independently shippable and they share one verification pass.

**Files:**

- Modify: `apps/api/src/lib/sentry.ts`, `apps/api/src/index.ts`, `apps/api/src/modules/slack/service.ts`, `apps/api/src/lib/posthog.ts`, `apps/api/src/modules/notifications/service.tsx`, and every file importing `@sentry/node` (~15)
- Test: `apps/api/src/modules/slack/service.test.ts` (create)

**Interfaces:**

- Consumes: `createApp` (Task 7)
- Produces: `index.ts`'s default export is now `withSentry(...)`-wrapped. `sendSlackMessage` and `sendNewUserSlackMessage` keep their exact signatures.

- [ ] **Step 1: Swap the Sentry package**

```bash
cd apps/api && pnpm remove @sentry/node @sentry/types @sentry/cli && pnpm add @sentry/cloudflare
```

Replace every `from '@sentry/node'` with `from '@sentry/cloudflare'`:

```bash
cd apps/api && grep -rl "@sentry/node" src | xargs sed -i '' "s|@sentry/node|@sentry/cloudflare|g"
```

Delete `src/lib/sentry.ts` (its `Sentry.init` is replaced by `withSentry`'s config callback) and remove `import './lib/sentry'` from `src/index.ts`.

Rewrite `src/index.ts`:

```ts
import { createApp } from '@/app';
import { withSentry } from '@sentry/cloudflare';

const app = createApp();

export default withSentry(
  () => ({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV,
    tracesSampleRate: 0.1,
  }),
  { fetch: app.fetch }
);
```

Note `environment` moves from `NODE_ENV` to `APP_ENV`, which is set explicitly per deployment in `wrangler.jsonc`; `NODE_ENV` is not meaningful on Workers.

Remove the `sentry:sourcemaps` script from `package.json`, and add `"upload_source_maps": true` to `wrangler.jsonc`.

- [ ] **Step 2: Write the failing Slack test**

Create `apps/api/src/modules/slack/service.test.ts`:

```ts
import { sendSlackMessage } from './service';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sendSlackMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('posts to chat.postMessage with a bearer token', async () => {
    vi.stubEnv('SLACK_TOKEN', 'xoxb-test');
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, ts: '1.2' }))
    );
    vi.stubGlobal('fetch', fetchMock);

    await sendSlackMessage({ text: 'hello' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer xoxb-test',
        }),
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      channel: 'C08GWNF2MHV',
      text: 'hello',
    });
  });

  it('swallows a Slack API error rather than failing the caller', async () => {
    vi.stubEnv('SLACK_TOKEN', 'xoxb-test');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ ok: false, error: 'nope' }))
      )
    );

    // Slack notifications are incidental; a failure must never break signup.
    await expect(sendSlackMessage({ text: 'hello' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/modules/slack/service.test.ts
```

Expected: FAIL — the current implementation calls `@slack/web-api`, not `fetch`.

- [ ] **Step 4: Rewrite the Slack service**

In `apps/api/src/modules/slack/service.ts`, delete `import { Block, WebClient } from '@slack/web-api'` and the `slackClient` const. Add a local `Block` type and replace `sendSlackMessage`'s body:

```ts
import { config } from '@/modules/features';
import { User } from 'better-auth';

// The SDK is Node-HTTP-based and does not run on Workers. This module makes
// exactly one kind of call, so a plain fetch is a smaller surface than a
// polyfill.
export type Block = Record<string, unknown>;

const slackChannels = {
  default: 'C08GWNF2MHV',
};

export async function sendSlackMessage({
  channel = slackChannels.default,
  text,
  blocks,
}: {
  channel?: string;
  text: string;
  blocks?: Block[];
}): Promise<void> {
  if (!config.slack.enabled) {
    console.info('Slack is not enabled, skipping message');
    return;
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Bearer ${process.env.SLACK_TOKEN}`,
      },
      body: JSON.stringify({ channel, text, blocks }),
    });

    const result = (await response.json()) as { ok: boolean; error?: string };

    if (!result.ok) {
      console.error('Error sending message:', result.error);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
```

`sendNewUserSlackMessage` below is unchanged.

```bash
cd apps/api && pnpm remove @slack/web-api
```

- [ ] **Step 5: Run the Slack test**

```bash
cd apps/api && pnpm vitest run src/modules/slack/service.test.ts
```

Expected: PASS, both cases.

- [ ] **Step 6: Make PostHog flush before the isolate dies**

In `apps/api/src/lib/posthog.ts`, add `flushAt: 1` so events are not buffered past the request:

```ts
  return new PostHog(process.env.POSTHOG_API_KEY, {
    host: 'https://eu.i.posthog.com',
    // Workers kill the isolate at the end of a request, taking any buffered
    // events with them. Send immediately and let callers waitUntil the flush.
    flushAt: 1,
    flushInterval: 0,
  });
```

Then find every call site:

```bash
cd apps/api && grep -rn "createPosthogClient" src
```

For each, ensure the client is shut down inside `c.executionCtx.waitUntil(client.shutdown())` where a Hono context is available, or `await client.shutdown()` where it is not.

- [ ] **Step 7: Render email HTML explicitly**

```bash
cd apps/api && pnpm add @react-email/render
```

In `apps/api/src/modules/notifications/service.tsx`, change the `sendEmail` body so the `react` prop is rendered before hitting Resend:

```ts
import { render } from '@react-email/render';

// ...inside sendEmail, replacing the resend.emails.send call:
const { error } = await resend.emails.send({
  from,
  to: [email],
  replyTo,
  subject,
  // Rendered here rather than handing Resend the `react` prop, so
  // react-dom/server resolution stays under our control on Workers.
  ...(react ? { html: await render(react as React.ReactElement) } : {}),
  ...(text ? { text } : {}),
  ...(scheduledAt ? { scheduledAt: scheduledAt.toISOString() } : {}),
});
```

Keep the surrounding validation, the `resend` null check and the error handling exactly as they are.

- [ ] **Step 8: Verify and commit**

```bash
cd apps/api && pnpm vitest run src/lib src/middleware src/modules/slack src/modules/reactions src/modules/assets
pnpm typecheck && pnpm lint
git add -A apps/api
git commit -m "refactor: move sentry, slack, posthog and email onto worker-safe apis"
```

---

## Task 12: Port the reactions, flags, themes and marketing modules

The first Tier A batch. Deliberately small, to establish the porting pattern that Tasks 13–16 repeat. **Read this task in full before starting Tasks 13–16 — they reference its pattern.**

**Files:**

- Modify: `src/modules/reactions/index.ts`, `src/modules/reactions/handlers/{get,post}-reactions.ts`, `src/modules/flags/index.ts`, `src/modules/flags/handlers/*.ts`, `src/modules/themes/index.ts`, `src/modules/marketing/index.ts`, `src/app.ts`, `src/modules/analytics/utils.ts`

**Interfaces:**

- Consumes: `AppBindings`, `requireSession`, `createApp`
- Produces: `getIpAddress(c: Context<AppBindings>): string` — the signature change in `analytics/utils.ts` that Tasks 13–16 also depend on. Every module's default export becomes `Hono<AppBindings>`.

- [ ] **Step 1: Port `getIpAddress` to a Hono context**

`src/modules/analytics/utils.ts` takes a `FastifyRequest`. Change the signature and the header reads; the doc comment and the precedence logic (CF-Connecting-IP → rightmost X-Forwarded-For → X-Real-IP → socket) stay exactly as written:

```ts
import type { AppBindings } from '@/env';
import type { Context } from 'hono';

const DEFAULT_IP_ADDRESS = '127.0.0.1';

export const getIpAddress = (c: Context<AppBindings>): string => {
  const cloudflareIp = c.req.header('cf-connecting-ip')?.trim();

  if (cloudflareIp) {
    return cloudflareIp;
  }

  const xForwardedFor = c.req.header('x-forwarded-for')?.trim();

  if (xForwardedFor) {
    const hops = xForwardedFor
      .split(',')
      .map((hop) => hop.trim())
      .filter(Boolean);

    // ... rest of the existing body unchanged, with request.headers['x-real-ip']
    // becoming c.req.header('x-real-ip') and request.ip becoming DEFAULT_IP_ADDRESS
  }

  return c.req.header('x-real-ip')?.trim() || DEFAULT_IP_ADDRESS;
};
```

The existing `src/modules/analytics/utils.test.ts` builds fake Fastify requests. Update its helper to build a fake Hono context instead:

```ts
const buildContext = (headers: Record<string, string>) =>
  ({ req: { header: (name: string) => headers[name.toLowerCase()] } }) as never;
```

and leave every assertion unchanged — the precedence rules are security-relevant and must not drift.

- [ ] **Step 2: Run the analytics utils test**

```bash
cd apps/api && pnpm vitest run src/modules/analytics/utils.test.ts
```

Expected: PASS, with no assertion changed.

- [ ] **Step 3: Port `reactions`**

`src/modules/reactions/handlers/get-reactions.ts` — change the handler signature and keep the schema and the logic:

```ts
import type { AppBindings } from '@/env';
import prisma from '@/lib/prisma';
import { getIpAddress } from '@/modules/analytics/utils';
import { getReactionsForPageId } from '@/modules/reactions/service';
import { Type } from '@sinclair/typebox';
import type { Context } from 'hono';

export const getReactionsQuerySchema = Type.Object({
  pageId: Type.String(),
});

export async function getReactionsHandler(c: Context<AppBindings>) {
  const { pageId } = c.req.valid('query' as never) as { pageId: string };

  const page = await prisma.page.findUnique({
    where: { id: pageId },
    // Existence check only — the full row drags large JSON columns along.
    select: { id: true },
  });

  if (!page) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  const reactions = await getReactionsForPageId({
    pageId,
    ipAddress: getIpAddress(c),
  });

  return c.json(reactions, 200);
}
```

Note `@fastify/type-provider-typebox` is replaced by `@sinclair/typebox` directly — it was only ever re-exporting `Type` and `Static`. Apply the same import change everywhere it appears:

```bash
cd apps/api && grep -rl "@fastify/type-provider-typebox" src | xargs sed -i '' "s|@fastify/type-provider-typebox|@sinclair/typebox|g"
```

`src/modules/reactions/index.ts`:

```ts
import type { AppBindings } from '@/env';
import {
  getReactionsHandler,
  getReactionsQuerySchema,
} from '@/modules/reactions/handlers/get-reactions';
import {
  postReactionsBodySchema,
  postReactionsHandler,
} from '@/modules/reactions/handlers/post-reactions';
import { tbValidator } from '@hono/typebox-validator';
import { Hono } from 'hono';

const reactionsRoutes = new Hono<AppBindings>();

reactionsRoutes.get(
  '/',
  tbValidator('query', getReactionsQuerySchema),
  getReactionsHandler
);
reactionsRoutes.post(
  '/',
  tbValidator('json', postReactionsBodySchema),
  postReactionsHandler
);

export default reactionsRoutes;
```

Apply the same shape to `post-reactions.ts`, renaming its exported schema to `postReactionsBodySchema` and exporting only the body schema (Hono has no response-schema concept; the `response` blocks in the old schemas are dropped, which is a serialization change only — Fastify used them to strip unknown keys, Hono does not, so **check each handler returns exactly the documented shape** rather than relying on the schema to trim it).

- [ ] **Step 4: Port `flags`, `themes` and `marketing`**

Same pattern. These are small: `flags` has two routes both requiring a session, `themes` has one (`GET /me`), `marketing` has one. For each:

1. `index.ts` becomes a `Hono<AppBindings>` with `export default`.
2. Handlers take `(c: Context<AppBindings>)`.
3. `await request.server.authenticate(request, response)` becomes `requireSession(c)`.
4. `response.status(n).send(x)` becomes `c.json(x, n)`.
5. Schemas attach via `tbValidator('json'|'query'|'param', schema)`.

- [ ] **Step 5: Mount them in `app.ts`**

Add below `app.route('/', coreRoutes)`:

```ts
app.route('/marketing', marketingRoutes);
app.route('/themes', themesRoutes);
app.route('/reactions', reactionsRoutes);
app.route('/flags', flagsRoutes);
```

- [ ] **Step 6: Add route tests for the batch**

Append to `src/app.test.ts`:

```ts
describe('ported modules — batch 1', () => {
  it('rejects an unauthenticated flags read', async () => {
    const response = await createApp().request('/flags', {}, env);
    expect(response.status).toBe(401);
  });

  it('404s a reaction read for an unknown page', async () => {
    const response = await createApp().request(
      '/reactions?pageId=00000000-0000-0000-0000-000000000000',
      {},
      env
    );
    expect(response.status).toBe(404);
  });

  it('400s a reaction read with no pageId', async () => {
    const response = await createApp().request('/reactions', {}, env);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 7: Run and commit**

```bash
cd apps/api && pnpm vitest run src/app.test.ts src/modules/reactions src/modules/analytics && pnpm typecheck && pnpm lint
git add -A apps/api/src
git commit -m "refactor: port reactions, flags, themes and marketing to hono"
```

---

## Task 13: Port the forms and blocks modules

`forms` carries the AJV-coercion behaviour change, so it gets explicit test coverage for it.

**Files:**

- Modify: `src/modules/forms/index.ts`, `src/modules/forms/routes.test.ts`, `src/modules/blocks/index.ts`, `src/modules/blocks/service.ts`, `src/app.ts`

**Interfaces:**

- Consumes: Task 12's pattern, `getIpAddress(c)`
- Produces: `formsRoutes`, `blocksRoutes` as `Hono<AppBindings>` default exports

- [ ] **Step 1: Update `forms/routes.test.ts` to drive Hono**

Replace the Fastify setup with:

```ts
import { createApp } from '@/app';
```

and in `beforeAll`, replace the three `app = Fastify(); await app.register(...); await app.ready();` lines with:

```ts
app = createApp();
```

Remove `await app.close()` from `afterAll`. Then convert each `app.inject` call. The first becomes:

```ts
const response = await app.request(
  `/forms/${blockId}/submissions`,
  {
    method: 'POST',
    headers: {
      'x-forwarded-for': IP,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      answers: { 'f-email': 'visitor@example.com', 'f-agree': true },
      website: '',
    }),
  },
  env
);

expect(response.status).toBe(200);
await expect(response.json()).resolves.toEqual({ success: true });
```

with `env` defined at the top of the file exactly as in `src/app.test.ts`. Apply the same conversion to every remaining `app.inject` in the file.

- [ ] **Step 2: Add the coercion-behaviour test**

The old comment in `forms/index.ts` explains that AJV's `coerceTypes` turned `true` into `"true"`. TypeBox under Hono does not coerce, so pin the new behaviour explicitly. Append to `forms/routes.test.ts`:

```ts
it('stores a checkbox answer as a real boolean, not the string "true"', async () => {
  // Fastify's AJV ran with coerceTypes, which turned booleans into strings
  // through a string|boolean union. Hono's TypeBox validator does not coerce.
  // This pins the corrected behaviour so it cannot silently regress.
  const response = await app.request(
    `/forms/${blockId}/submissions`,
    {
      method: 'POST',
      headers: {
        'x-forwarded-for': '198.51.100.99',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        answers: { 'f-email': 'bool@example.com', 'f-agree': true },
        website: '',
      }),
    },
    env
  );

  expect(response.status).toBe(200);

  const stored = await prisma.formSubmission.findFirst({
    where: { pageId },
    orderBy: { createdAt: 'desc' },
  });

  expect((stored?.answers as Record<string, unknown>)['f-agree']).toBe(true);
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/modules/forms/routes.test.ts
```

Expected: FAIL — `createApp` does not mount `/forms` yet.

- [ ] **Step 4: Port `forms/index.ts`**

Keep `postSubmissionSchema`'s body definition and its explanatory comment verbatim. The route file becomes:

```ts
import {
  checkUserHasAccessToPage,
  deleteSubmissionById,
  getFormGroupsForPage,
  listSubmissions,
  submitFormResponse,
} from './service';
import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { getIpAddress } from '@/modules/analytics/utils';
import { tbValidator } from '@hono/typebox-validator';
import { Type } from '@sinclair/typebox';
import { Hono } from 'hono';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const postSubmissionBodySchema = Type.Object({
  // Answer values are deliberately untyped here. Per-field type and length
  // validation happens in validateAnswers; overall payload size is capped by
  // maxProperties and the body limit.
  answers: Type.Record(Type.String({ maxLength: 64 }), Type.Unknown(), {
    maxProperties: 10,
  }),
  website: Type.Optional(Type.String({ maxLength: 200 })),
});

const formsRoutes = new Hono<AppBindings>();

// Public endpoint: visitors submit form responses. No auth — the service
// gates on published page + honeypot + per-IP rate limit.
formsRoutes.post(
  '/:blockId/submissions',
  tbValidator('json', postSubmissionBodySchema),
  async (c) => {
    const blockId = c.req.param('blockId');
    const { answers, website } = c.req.valid('json');

    try {
      const result = await submitFormResponse({
        blockId,
        answers,
        honeypot: website ?? '',
        ipAddress: getIpAddress(c),
      });

      switch (result.status) {
        case 'ok':
          return c.json({ success: true }, 200);
        case 'not-found':
          return c.json({ error: { message: 'Form not found' } }, 404);
        case 'rate-limited':
          return c.json(
            {
              error: {
                message: 'Too many submissions. Please try again later.',
              },
            },
            429
          );
        case 'invalid':
          return c.json(
            { error: { message: 'Validation failed', fields: result.errors } },
            400
          );
      }
    } catch {
      return c.json(
        { error: { message: 'Sorry, there was an error submitting the form' } },
        500
      );
    }
  }
);

formsRoutes.get('/page/:pageId', async (c) => {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');

  if (!(await checkUserHasAccessToPage(pageId, session.user.id))) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  return c.json({ groups: await getFormGroupsForPage(pageId) }, 200);
});

formsRoutes.get('/page/:pageId/submissions', async (c) => {
  const session = requireSession(c);
  const pageId = c.req.param('pageId');
  const blockId = c.req.query('blockId');
  const cursor = c.req.query('cursor');

  if (!blockId) {
    return c.json({ error: { message: 'blockId is required' } }, 400);
  }

  if (cursor && !UUID_REGEX.test(cursor)) {
    return c.json({ error: { message: 'Invalid cursor' } }, 400);
  }

  if (!(await checkUserHasAccessToPage(pageId, session.user.id))) {
    return c.json({ error: { message: 'Page not found' } }, 404);
  }

  return c.json(await listSubmissions(pageId, blockId, cursor), 200);
});

formsRoutes.delete('/submissions/:submissionId', async (c) => {
  const session = requireSession(c);

  const deleted = await deleteSubmissionById(
    c.req.param('submissionId'),
    session.user.id
  );

  if (!deleted) {
    return c.json({ error: { message: 'Submission not found' } }, 404);
  }

  return c.json({ success: true }, 200);
});

export default formsRoutes;
```

The old `bodyLimit: 65536` has no direct Hono equivalent. Add an explicit guard as the first line of the POST handler:

```ts
    const contentLength = Number(c.req.header('content-length') ?? 0);

    if (contentLength > 65536) {
      return c.json({ error: { message: 'Payload too large' } }, 413);
    }
```

- [ ] **Step 5: Port `blocks` and mount both**

`blocks` has three routes and imports prisma directly in `index.ts`; apply the Task 12 pattern. Then in `app.ts`:

```ts
app.route('/blocks', blocksRoutes);
app.route('/forms', formsRoutes);
```

- [ ] **Step 6: Run and commit**

```bash
cd apps/api && pnpm vitest run src/modules/forms src/modules/blocks src/app.test.ts && pnpm typecheck && pnpm lint
git add -A apps/api/src
git commit -m "refactor: port forms and blocks to hono"
```

---

## Task 14: Port the pages, organizations and integrations modules

The largest batch by route count (`pages` has 9, `billing` is deferred to Task 15).

**Files:**

- Modify: `src/modules/pages/index.ts`, `src/modules/pages/handlers/*.ts` (3), `src/modules/organizations/index.ts`, `src/modules/integrations/index.ts`, `src/app.ts`

**Interfaces:**

- Consumes: Task 12's pattern
- Produces: `pagesRoutes`, `organizationsRoutes`, `integrationsRoutes` as `Hono<AppBindings>` default exports

- [ ] **Step 1: Port `pages`**

Nine routes across `index.ts` and three files in `handlers/`. Apply the Task 12 pattern to each. Two specifics:

- `get-page-slug-or-domain.ts` and `get-page-load.ts` set their own `Cache-Control` — preserve that, since the `cacheControl` middleware only fills in a default when the route set none. In Hono: `c.header('Cache-Control', '...')` before returning.
- `get-slug-availability.ts` takes a query param; use `tbValidator('query', ...)`.

- [ ] **Step 2: Port `organizations` and `integrations`**

Same pattern. `integrations` has four routes and uses `encrypt`/`decrypt` from Task 5 — no signature change there, so only the route wiring moves.

- [ ] **Step 3: Mount them**

```ts
app.route('/pages', pagesRoutes);
app.route('/integrations', integrationsRoutes);
app.route('/organizations', organizationsRoutes);
```

- [ ] **Step 4: Add route coverage**

Append to `src/app.test.ts`:

```ts
describe('ported modules — batch 3', () => {
  it('serves slug availability for an unclaimed slug', async () => {
    const response = await createApp().request(
      '/pages/slug-availability?slug=definitely-not-taken-abcdef',
      {},
      env
    );

    expect(response.status).toBe(200);
  });

  it('requires a session to list organizations', async () => {
    const response = await createApp().request('/organizations', {}, env);
    expect(response.status).toBe(401);
  });

  it('requires a session to list integrations', async () => {
    const response = await createApp().request('/integrations', {}, env);
    expect(response.status).toBe(401);
  });
});
```

Adjust the exact paths to match the real route definitions as you port them.

- [ ] **Step 5: Run and commit**

```bash
cd apps/api && pnpm vitest run src/modules/integrations src/app.test.ts && pnpm typecheck && pnpm lint
git add -A apps/api/src
git commit -m "refactor: port pages, organizations and integrations to hono"
```

---

## Task 15: Port the billing module and the Stripe webhook

**Files:**

- Modify: `src/modules/billing/index.ts`, `src/modules/billing/handlers/*.ts` (8), `src/modules/billing/handlers/stripe/index.ts`, `src/lib/stripe.ts`, `src/modules/billing/handlers/billing-portal-url.test.ts`, `src/app.ts`

**Interfaces:**

- Consumes: Task 12's pattern
- Produces: `billingRoutes` as a `Hono<AppBindings>` default export

- [ ] **Step 1: Give Stripe a fetch HTTP client**

`apps/api/src/lib/stripe.ts`:

```ts
import Stripe from 'stripe';

/**
 * Stripe Client
 *
 * The default HTTP client is Node's http module, which does not exist on
 * Workers. The fetch client is functionally identical.
 */
export const stripeClient = new Stripe(process.env.STRIPE_API_SECRET_KEY!, {
  httpClient: Stripe.createFetchHttpClient(),
});
```

- [ ] **Step 2: Write the failing webhook test**

Create `apps/api/src/modules/billing/handlers/stripe/index.test.ts`:

```ts
import { createApp } from '@/app';
import { stripeClient } from '@/lib/stripe';
import { describe, expect, it, vi } from 'vitest';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  AUTH_RATE_LIMIT: {
    get: async () => null,
    put: async () => undefined,
    delete: async () => undefined,
  },
} as never;

const SECRET = 'whsec_test_secret';

describe('POST /billing/stripe-webhook', () => {
  it('rejects a request with no signature', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);

    const response = await createApp().request(
      '/billing/stripe-webhook',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'customer.subscription.created' }),
      },
      env
    );

    expect(response.status).toBe(400);
  });

  it('accepts a correctly signed event', async () => {
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET);

    // An event type the handler ignores, so this exercises signature
    // verification and nothing else.
    const payload = JSON.stringify({
      id: 'evt_test',
      type: 'invoice.paid',
      data: { object: {} },
    });

    const header = stripeClient.webhooks.generateTestHeaderString({
      payload,
      secret: SECRET,
    });

    const response = await createApp().request(
      '/billing/stripe-webhook',
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': header,
        },
        body: payload,
      },
      env
    );

    expect(response.status).toBe(200);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

```bash
cd apps/api && pnpm vitest run src/modules/billing/handlers/stripe/index.test.ts
```

Expected: FAIL — `/billing` is not mounted.

- [ ] **Step 4: Port the webhook handler**

In `src/modules/billing/handlers/stripe/index.ts`, change the signature and the first block. `constructEvent` must become `constructEventAsync` — the synchronous form uses Node crypto and throws on Workers.

```ts
export async function stripeWebhookHandler(c: Context<AppBindings>) {
  const signature = c.req.header('stripe-signature') ?? '';
  // The raw body, not the parsed one: Stripe signs the exact bytes.
  const rawBody = await c.req.text();

  let event: Stripe.Event;

  try {
    event = await stripeClient.webhooks.constructEventAsync(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.log('Error', error);
    captureException(error);
    return c.json({ error: 'Invalid signature' }, 400);
  }

  // ...existing switch statement unchanged...
}
```

The `switch (event.type)` block and every `handleSubscription*` call below it are unchanged. End the handler with `return c.json({ received: true }, 200);` matching whatever the current success response is — check the tail of the existing file and preserve it exactly.

- [ ] **Step 5: Port the remaining seven billing routes**

Apply the Task 12 pattern to `index.ts` and the seven non-webhook handlers. `billing-portal-url.test.ts` calls its handler directly; update its fake request/reply to a fake Hono context in the same style as Task 12 Step 1, keeping every assertion.

- [ ] **Step 6: Mount and remove fastify-raw-body**

```ts
app.route('/billing', billingRoutes);
```

```bash
cd apps/api && pnpm remove fastify-raw-body
```

- [ ] **Step 7: Run and commit**

```bash
cd apps/api && pnpm vitest run src/modules/billing && pnpm typecheck && pnpm lint
git add -A apps/api/src apps/api/package.json pnpm-lock.yaml
git commit -m "refactor: port billing and the stripe webhook to hono"
```

---

## Task 16: Port the remaining modules and drop Fastify

`assets`, `analytics`, `orchestrators` and the four `services/*` OAuth modules. Ends with zero Fastify imports in the repo.

**Files:**

- Modify: `src/modules/assets/index.ts`, `src/modules/analytics/index.ts` + handler, `src/modules/orchestrators/index.ts`, `src/modules/services/{tiktok,instagram,threads,spotify}/index.ts`, `src/app.ts`, `apps/api/package.json`

**Interfaces:**

- Consumes: `uploadAsset({ context, file, referenceId })` (Task 9), `requireApiKey` (Task 6)
- Produces: a `Hono` app with all 20 modules mounted; no Fastify anywhere

- [ ] **Step 1: Port `assets` — the upload route**

`@fastify/multipart` and the manual `MultipartFile` reconstruction both disappear:

```ts
import type { AppBindings } from '@/env';
import { requireSession } from '@/middleware/authenticate';
import { canUploadAsset } from '@/modules/assets/authorization';
import { assetContexts } from '@/modules/assets/constants';
import { uploadAsset } from '@/modules/assets/service';
import { isObjKey } from '@/modules/assets/utils';
import { Hono } from 'hono';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const assetsRoutes = new Hono<AppBindings>();

assetsRoutes.post('/upload', async (c) => {
  const session = requireSession(c);

  const body = await c.req.parseBody();
  const file = body.file ?? body.image;
  const referenceId = body.referenceId;
  const context = body.assetContext;

  if (!(file instanceof File)) {
    return c.json({ error: { message: 'No file uploaded' } }, 400);
  }

  if (file.size > MAX_FILE_BYTES) {
    return c.json({ error: { message: 'File too large' } }, 413);
  }

  if (typeof referenceId !== 'string' || !referenceId) {
    return c.json({ error: { message: 'Missing referenceId field' } }, 400);
  }

  if (typeof context !== 'string' || !isObjKey(context, assetContexts)) {
    return c.json({ error: { message: 'Invalid asset context' } }, 400);
  }

  // referenceId chooses the S3 key prefix, so it has to be something the
  // caller actually owns.
  const isAllowed = await canUploadAsset({
    context,
    referenceId,
    userId: session.user.id,
    organizationId: session.activeOrganizationId,
  });

  if (!isAllowed) {
    return c.json(
      {
        error: {
          message: 'You do not have access to upload against this reference',
        },
      },
      403
    );
  }

  const result = await uploadAsset({ context, file, referenceId });

  if ('error' in result) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ message: 'success', url: result.data.url }, 200);
});

export default assetsRoutes;
```

**Check the frontend's field name before finalising.** Grep `apps/frontend/app/components/FormFileUpload.tsx` and `BlockIntegrationUI.tsx` for the `FormData` key used, and match it exactly — the old handler used `request.file()`, which took whichever file field arrived first, so the name was never pinned server-side.

- [ ] **Step 2: Port `analytics`, `orchestrators` and the four `services/*` modules**

Apply the Task 12 pattern. Two specifics:

- `orchestrators/index.ts`'s three routes used `request.server.authenticateApiKey(...)`; replace with the `requireApiKey` middleware on the route: `orchestratorsRoutes.post('/create', requireApiKey, tbValidator('json', ...), handler)`.
- `services/tiktok/index.ts` was mounted with an `as any` cast in the old `index.ts`. Do not carry the cast over — if it does not typecheck cleanly, fix the types.

- [ ] **Step 3: Mount everything**

```ts
app.route('/integrations', integrationsRoutes);
app.route('/assets', assetsRoutes);
app.route('/orchestrators', orchestratorsRoutes);
app.route('/analytics', analyticsRoutes);
app.route('/services/tiktok', tiktokServiceRoutes);
app.route('/services/instagram', instagramServiceRoutes);
app.route('/services/threads', threadsServiceRoutes);
app.route('/services/spotify', spotifyServiceRoutes);
```

Verify against the old `src/index.ts` register list that all 20 prefixes are present and spelled identically. A missed prefix is a silent 404 in production.

- [ ] **Step 4: Remove Fastify entirely**

```bash
cd apps/api
pnpm remove fastify fastify-cli fastify-tsconfig \
  @fastify/compress @fastify/cors @fastify/multipart @fastify/sensible \
  @fastify/type-provider-typebox @fastify/basic-auth \
  esbuild @dotenv-run/esbuild dotenv cross-env tsx
```

Update `package.json` scripts:

```json
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "dotenvx run --quiet -f ../../.env.local --ignore=MISSING_ENV_FILE -- vitest run",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
```

- [ ] **Step 5: Prove Fastify is gone**

```bash
cd apps/api && grep -rn "fastify\|Fastify" src package.json
```

Expected: **no output**. Any hit is an unported route or a stale import.

- [ ] **Step 6: Full green build**

```bash
cd apps/api && pnpm test && pnpm typecheck && pnpm lint
pnpm wrangler deploy --dry-run --outdir=/tmp/wsize
```

Expected: the complete suite passes for the first time since Task 6, and the bundle is under 10 MB. Report the bundle size.

- [ ] **Step 7: Commit**

```bash
git add -A apps/api
git commit -m "refactor: port the remaining modules and remove fastify"
```

---

## Task 17: Smoke tests and the CI deploy job

**Files:**

- Create: `apps/api/scripts/smoke.ts`
- Modify: `.github/workflows/ci.yml`, `apps/api/package.json`

**Interfaces:**

- Consumes: a deployed base URL
- Produces: `pnpm smoke <base-url>` — exits non-zero on any failure

- [ ] **Step 1: Write the smoke script**

Create `apps/api/scripts/smoke.ts`:

```ts
/**
 * Post-deploy checks against a real Worker. These cover what the Node-based
 * test suite structurally cannot: that the code actually runs on workerd,
 * with real bindings, real S3 and a real database.
 *
 * Usage: pnpm smoke https://api-next.lin.ky
 */
const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error('Usage: pnpm smoke <base-url>');
  process.exit(1);
}

const failures: string[] = [];

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`);
    console.error(`  FAIL ${name}: ${(error as Error).message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

console.log(`Smoke testing ${baseUrl}`);

await check('GET /ping', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert(response.status === 200, `expected 200, got ${response.status}`);
  assert((await response.json()).ping === 'pong', 'unexpected body');
});

await check('Hyperdrive-backed read returns from the database', async () => {
  // Any public page read exercises Prisma over Hyperdrive end to end.
  const response = await fetch(
    `${baseUrl}/pages/slug-availability?slug=smoke-test-${Date.now()}`
  );
  assert(response.status === 200, `expected 200, got ${response.status}`);
});

await check('session endpoint rejects an anonymous caller', async () => {
  const response = await fetch(`${baseUrl}/session/me`);
  assert(response.status === 401, `expected 401, got ${response.status}`);
});

await check('better-auth is mounted and responding', async () => {
  const response = await fetch(`${baseUrl}/api/auth/get-session`);
  // Any non-5xx proves the handler is wired; the session itself is anonymous.
  assert(response.status < 500, `expected <500, got ${response.status}`);
});

await check('CORS never credentials an untrusted origin', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { origin: 'https://evil.example.com' },
  });
  assert(
    response.headers.get('access-control-allow-credentials') === null,
    'untrusted origin received allow-credentials'
  );
});

await check('unsigned stripe webhook is rejected', async () => {
  const response = await fetch(`${baseUrl}/billing/stripe-webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'invoice.paid' }),
  });
  assert(response.status === 400, `expected 400, got ${response.status}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll smoke checks passed.');
```

Add to `apps/api/package.json`:

```json
    "smoke": "node --experimental-strip-types scripts/smoke.ts"
```

The asset-upload and authenticated-session checks in the spec's §5 list need real credentials and a real session; do those by hand in Task 18 Step 3 rather than scripting them here — a smoke script that needs a checked-in session cookie is worse than a manual step.

- [ ] **Step 2: Add the deploy job to CI**

Append to `.github/workflows/ci.yml`:

```yaml
deploy:
  name: Deploy the API worker
  needs: verify
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  runs-on: ubuntu-latest

  steps:
    - uses: actions/checkout@v4

    - uses: pnpm/action-setup@v4

    - uses: actions/setup-node@v4
      with:
        node-version-file: .nvmrc
        cache: pnpm

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    # The worker bundles the generated Prisma client, so it has to exist
    # before wrangler builds.
    - name: Generate the Prisma client
      run: pnpm prisma:generate
      working-directory: packages/prisma

    - uses: cloudflare/wrangler-action@v3
      with:
        apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        workingDirectory: apps/api
```

`needs: verify` is the point: the existing typecheck/lint/test job gates every deploy.

- [ ] **Step 3: Load the secrets into Cloudflare**

Build a JSON file of the 46 values from the production Render environment (do **not** commit it):

```bash
cd apps/api
pnpm wrangler secret bulk /path/to/secrets.json
rm /path/to/secrets.json
```

Cross-check against `.env.example` and `wrangler.jsonc`'s `[vars]` so that every variable the code reads is present in exactly one of the two. A missing secret is a runtime failure with no build-time signal.

- [ ] **Step 4: Commit**

```bash
git add apps/api/scripts/smoke.ts apps/api/package.json .github/workflows/ci.yml
git commit -m "ci: add worker smoke tests and a gated deploy job"
```

---

## Task 18: Staging verification and cutover

No code. This is the task that makes the migration real, and the one with a rollback path that must be understood before starting.

**Files:**

- Modify: `apps/api/wrangler.jsonc` (adds the production route, at Step 5 only)

**Interfaces:**

- Consumes: everything

- [ ] **Step 1: Deploy to a staging hostname**

Add a staging environment to `wrangler.jsonc`:

```jsonc
  "env": {
    "staging": {
      "name": "linky-api-staging",
      "routes": [{ "pattern": "api-next.lin.ky/*", "zone_name": "lin.ky" }],
      "vars": {
        "APP_ENV": "production",
        "APP_FRONTEND_URL": "https://lin.ky",
        "API_BASE_URL": "https://api-next.lin.ky",
        "NEXT_PUBLIC_BASE_URL": "https://lin.ky"
      }
    }
  }
```

Create the `api-next.lin.ky` proxied DNS record in Cloudflare, then:

```bash
cd apps/api && pnpm wrangler deploy --env staging
pnpm wrangler secret bulk /path/to/secrets.json --env staging
```

- [ ] **Step 2: Run the smoke script**

```bash
cd apps/api && pnpm smoke https://api-next.lin.ky
```

Expected: all six checks pass. **Do not proceed past a single failure.**

- [ ] **Step 3: Manual verification — the paths the script cannot cover**

Register a **separate Stripe webhook endpoint** at `https://api-next.lin.ky/billing/stripe-webhook` with its own signing secret, and set that secret on the staging worker. Add `https://api-next.lin.ky/api/auth/callback/{google,twitter,tiktok}` to the three OAuth provider consoles.

Then run a local frontend against the staging API (`NEXT_PUBLIC_API_URL=https://api-next.lin.ky`) and verify by hand:

- [ ] Sign in with a magic link, end to end
- [ ] Sign in with Google, Twitter and TikTok
- [ ] Upload a page background image — **open the resulting `cdn.lin.ky` URL and compare the framing against an image uploaded through the Render API.** This is the one behaviour a wrong `coverCrop` would break silently.
- [ ] Upload a block asset, same comparison
- [ ] Submit a form on a published page, then confirm the response appears in the dashboard
- [ ] Add a reaction to a published page and confirm the count increments
- [ ] Trigger a Stripe test-mode subscription and confirm the webhook lands
- [ ] Connect and disconnect an Instagram or Spotify integration (this exercises Task 5's WebCrypto against real stored tokens)
- [ ] Load a page's analytics

- [ ] **Step 4: Record the pre-cutover baseline**

Note current 5xx rate, p50/p95 latency and Sentry error volume from the Render dashboard. Without a baseline, "above baseline" in the rollback triggers is unmeasurable.

- [ ] **Step 5: Cut over**

Add to `wrangler.jsonc`'s top level:

```jsonc
  "routes": [{ "pattern": "api.lin.ky/*", "zone_name": "lin.ky" }]
```

```bash
cd apps/api && pnpm wrangler deploy
pnpm smoke https://api.lin.ky
```

Worker routes take precedence over the origin DNS record, so this takes effect immediately. Nothing changes in Stripe or the OAuth provider consoles: the production URLs are unchanged.

- [ ] **Step 6: Watch for an hour**

Monitor, against the Step 4 baseline:

- Worker logs (`pnpm wrangler tail`) for exceptions
- Sentry for new issue types
- Stripe dashboard for webhook delivery failures
- The 5xx rate

**Roll back immediately** — by removing the `routes` key and redeploying, which restores Render in seconds — on any of: a 5xx rate above baseline, any Stripe webhook signature failure, any session-resolution failure, or an upload producing a visibly wrong image.

Sessions live in the same Postgres and the cookie domain is unchanged, so neither the cutover nor a rollback signs anyone out.

- [ ] **Step 7: Decommission after a week**

Once the Worker has run clean for ~7 days:

- Delete the Render service
- Remove the `api-next.lin.ky` DNS record, its Stripe webhook endpoint, and the three temporary OAuth callback URLs
- Delete the `staging` env block from `wrangler.jsonc`
- Update `README.md` and `CONTRIBUTING.md` wherever they describe running or deploying the API

- [ ] **Step 8: Commit**

```bash
git add apps/api/wrangler.jsonc README.md CONTRIBUTING.md
git commit -m "chore: cut the api over to cloudflare and decommission render"
```

---

## Self-Review

**Spec coverage:**

| Spec section                           | Task                  |
| -------------------------------------- | --------------------- |
| §1 architecture, framework mapping     | 4, 6, 7               |
| §1 authenticate.ts circular import     | 6                     |
| §2 `process.env` vs bindings, env shim | 2                     |
| §2 AsyncLocalStorage Prisma            | 3                     |
| §2 better-auth KV rate limiting        | 6                     |
| §3 Tier A (15 modules)                 | 12, 13, 14, 16        |
| §3 `orchestrators` cpu_ms              | 2 (config), 16 (port) |
| §3 validation coercion change          | 13                    |
| §3 assets → WASM                       | 9                     |
| §3 assets + reactions → aws4fetch      | 8, 10                 |
| §3 Stripe                              | 15                    |
| §3 Slack / PostHog / email             | 11                    |
| §3 encrypt → WebCrypto                 | 5                     |
| §3 Sentry                              | 11                    |
| §3 `/api/auth/*`                       | 7                     |
| §4 dependencies, scripts               | 8, 9, 10, 11, 15, 16  |
| §5 tests, smoke script                 | 4, 6, 7, 12–15, 17    |
| §6 CI/CD, prerequisite, cutover        | 1, 17, 18             |
| §7 sequencing                          | task order            |

Two spec items deliberately land outside a numbered task: `lib/origins.ts`'s lazy evaluation (an issue found while planning, not in the spec — Task 4) and the `bodyLimit: 65536` replacement for form submissions (Task 13 Step 4), which Hono has no direct equivalent for.

**Known cross-task dependencies to hold:** `getIpAddress(c)` changes signature in Task 12 and is consumed by Tasks 13 and 16. `uploadAsset` changes from `multipartFile` to `file: File` in Task 9 and is consumed by Task 16. `AuthenticatedSession` is placeheld in Task 2 and replaced in Task 6. `@fastify/type-provider-typebox` → `@sinclair/typebox` is a repo-wide sed in Task 12 Step 3 that every later porting task depends on.

**Task 6 ends with a red typecheck** — the only place in the plan where that happens. It is deliberate: `src/index.ts` cannot compile between deleting the decorators and writing `createApp()`, and splitting the boundary differently would mean committing an app that boots into nothing. Task 7 restores green.
