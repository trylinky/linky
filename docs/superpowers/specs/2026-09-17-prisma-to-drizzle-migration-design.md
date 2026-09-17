# Prisma to Drizzle Migration — Design

**Date:** 2026-09-17
**Status:** Draft

## Goal

Replace Prisma with Drizzle ORM as the data layer for the API worker, make
drizzle-kit the schema migration tool, and move the frontend's remaining direct
database access behind the API so that Prisma is removed from the workspace
entirely.

The driver is Worker size and cold start. Today's dry-run upload of
`apps/api` is 9.7 MB (2.45 MB gzipped). Prisma's query compiler WASM is
1.8 MB of that on its own, and the Prisma client runtime is a large share of
the 6.6 MB JavaScript bundle. Prisma also forces a dual-generator build (a
Node client and a workerd client selected by an export condition) and a
`prisma generate` step in CI, on Vercel, and before every typecheck.

## Current state

Established by inventory on 2026-09-17.

- `packages/prisma` owns `schema.prisma` (16 models, 2 enums, 325 lines), two
  generators (`src/generated` and `src/generated-workerd`), 70 migrations, and
  a seed script. `apps/api` resolves the workerd build via the `workerd`
  export condition; `apps/frontend` resolves the Node build.
- `apps/api` has 41 files importing the client and roughly 106 query call
  sites. It builds a client per request from the Hyperdrive connection string
  and exposes it through an AsyncLocalStorage-backed proxy in
  `apps/api/src/lib/prisma.ts`, so call sites use a plain module import.
  better-auth uses `prismaAdapter` over the same proxy.
- The query surface is narrow. There are no `$transaction` calls, no raw SQL,
  no Prisma error-code handling, no JSON path filters, no `createMany`,
  `aggregate`, `connectOrCreate`, `contains`, or `OR`/`AND`/`NOT` filters. The
  hard parts are 21 authorization filters that hop through
  `page → organization → members`, three four-level nested selects in the
  Stripe webhook handlers, eight nested `connect`/`create` writes, one
  `distinct` and one `groupBy` in forms, and cursor pagination in forms.
- `apps/frontend` still runs Prisma directly in 16 files: theme CRUD, page
  settings, team settings, invite acceptance, verification requests, page
  create and list, the OG image data route, and the Spotify, Instagram,
  TikTok, Threads, and GitHub block fetchers (which also perform token-refresh
  writes). It wraps the client with Prisma Accelerate for pooling only; no
  call site uses `cacheStrategy`. Its Vercel build runs
  `prisma migrate deploy`.
- No Prisma types leak into `packages/blocks`, `packages/common`,
  `packages/ui`, `packages/seo`, or `packages/notifications`. The frontend has
  23 type-only imports of model types. `apps/marketing` imports one type.
- The local dev database is managed with `prisma db push` and has an empty
  migration history. Production has all 70 migrations applied.
- API tests run against the shared dev database, serially, with per-file
  hand-rolled fixtures. Three tests mock the Prisma module and assert on
  Prisma argument shapes.

## Design

### Approach

Two phases, API first.

**Phase 1** swaps the API worker to Drizzle, makes drizzle-kit the migration
tool, and removes Prisma's migrate step from the frontend build. The frontend
keeps its Prisma client against an unchanged `schema.prisma` for the duration
of Phase 2.

**Phase 2** adds the API endpoints the frontend needs, switches the frontend
to them, deletes Prisma from the frontend, and deletes `packages/prisma`.

This order delivers the Worker size win first and writes every new endpoint
once, in Drizzle. The alternative of moving frontend access behind the API
first would write those endpoints in Prisma and port them weeks later. A
strangler approach running both ORMs inside the API was rejected: the bundle
only shrinks at the end, and two clients per request doubles Hyperdrive
connection cost.

Between the phases, any schema change must be made in both the Drizzle schema
and `schema.prisma`. This window should be short and no schema changes are
planned for it.

### Package: `packages/db` (`@trylinky/db`)

Replaces `packages/prisma`.

```
packages/db/
  package.json          exports: ".", "./schema", "./seed-data"
  drizzle.config.ts     dialect postgresql, schema ./src/schema, out ./migrations, url DIRECT_URL
  src/
    schema/             one file per table, plus enums.ts and relations.ts, re-exported from index.ts
    client.ts           createDb(connectionString): { db, close }
    types.ts            Page, Block, Theme, ... = typeof table.$inferSelect; NewPage etc. = $inferInsert
    seed-data.ts        defaultThemeSeeds (moved here from apps/frontend/lib/theme.ts)
    seed.ts             idempotent seed
  migrations/
    0000_baseline.sql
    meta/
```

Schema rules:

- Table names, column names, enum names, index names, unique constraints, and
  foreign key actions are declared exactly as Prisma created them: quoted
  PascalCase tables (`"Page"`), camelCase columns (`"createdAt"`), Postgres
  enums `"VerificationRequestStatus"` and `"OrchestrationType"`. This is what
  makes the baseline a no-op against production.
- `id` columns are `uuid` with `defaultRandom()`. `createdAt` uses
  `defaultNow()`. `updatedAt` has no database default today (Prisma set it in
  the client); the Drizzle schema sets it with `$onUpdate(() => new Date())`
  and `defaultNow()` on insert so behaviour matches.
- JSON columns are `jsonb` typed as the same loose `JsonValue`-style type the
  code casts from today. Tightening `Page.config`, `Block.config`, `Block.data`
  and the theme colour columns is out of scope.
- Relations are declared for every foreign key so the relational query API can
  express the nested reads the API performs.
- The `_prisma_migrations` table is left in place in production and dropped
  in a later cleanup migration once Phase 2 has shipped.

Exported types keep today's names (`Page`, `Block`, `Theme`, `Organization`,
`User`, `Integration`, `Invitation`, `UserFlag`, `VerificationRequest`,
`VerificationRequestStatus`, `JsonValue`) so the frontend's 23 type-only
imports change import path only. The package's root entry imports `pg`; the
frontend imports types only from it, which TypeScript erases. The
`./seed-data` subpath is plain data with no driver import, so the frontend
can import `defaultThemeSeeds` from it at runtime.

### Driver

`pg` via `drizzle-orm/node-postgres`. It is already the driver behind
`@prisma/adapter-pg` through Hyperdrive today, `nodejs_compat` is enabled, and
keeping it removes one variable from the cutover. `createDb` builds a `Pool`
of size 1 per request from the Hyperdrive connection string and the caller
ends it when the request completes. Switching to postgres.js is a possible
later optimisation and is out of scope.

### Client access in the API

`apps/api/src/lib/prisma.ts` becomes `apps/api/src/lib/db.ts` with the same
design:

- `createDb(env)` builds the per-request client from `env.HYPERDRIVE`.
- `runWithDb(db, fn)` binds it in an AsyncLocalStorage store.
- `resolveClient()` returns the scoped client, or a process-lifetime fallback
  built from `DATABASE_URL` for tests and scripts, or throws the same
  diagnostic error when neither exists.
- The default export is a Proxy with the same traps and method binding, so
  every call site keeps a plain `import db from '@/lib/db'`.
- `requestContext` middleware calls `runWithDb(createDb(c.env), ...)` and ends
  the pool in a `finally`.
- The slow-query log (50 ms threshold) becomes a Drizzle `logger` that times
  each statement.

`apps/api/src/lib/prisma.test.ts` moves to `db.test.ts` and keeps its proxy
invariant tests.

### Query porting rules

- Nested reads use the relational query API (`db.query.<table>.findFirst` /
  `findMany` with `with`). Writes use the core builder (`insert`, `update`,
  `delete`).
- Authorization filters that traverse relations become reusable predicate
  builders in `apps/api/src/lib/db-predicates.ts`, for example
  `userIsMemberOfPageOrg(userId, pageIdColumn)` returning an `exists`
  subquery. Drizzle `update` and `delete` accept these directly, which is
  required because they cannot take a relation filter inline. The 21 existing
  sites all reduce to two or three such predicates.
- The three four-level Stripe webhook reads
  (`subscription → organization → members → user.email`) become one join
  each returning the member emails.
- `connect: { slug }` on block create becomes a slug-to-id lookup inside the
  same transaction.
- `distinct: ['blockId']` with `orderBy createdAt desc` becomes
  `DISTINCT ON ("blockId")`. `groupBy` with `_count` and `_max` becomes a
  `GROUP BY` select with `count()` and `max()`.
- Cursor pagination in forms keeps the same `pageSize + 1` shape but becomes
  keyset pagination: the cursor row's `createdAt` and `id` are looked up, and
  the query filters on `(createdAt, id) < (cursorCreatedAt, cursorId)` under
  the existing `createdAt desc, id desc` order, instead of Prisma's
  `cursor`/`skip: 1`.
- The six frontend block fetchers that pass a `where` into the to-one
  `Block.integration` relation rely on a filter Prisma ignores. When they move
  into the API in Phase 2, the query filters on `Integration.type` explicitly,
  which is the intended behaviour.
- Read-then-write uniqueness checks (page slug, verification request) keep
  their current shape. Mapping Postgres error `23505` is not introduced.

### Transactions

The inventory found four multi-step writes with no transaction today. Each is
wrapped in `db.transaction`:

1. Page create with its header block (`pages/service.ts`, and the frontend
   duplicate once it moves to the API route).
2. Page soft-delete followed by `block` delete (`pages/service.ts`).
3. Integration disconnect followed by clearing `Block.integrationId`
   (`integrations/service.ts`).
4. Organization create with its owner member (`organizations/utils.ts`).

Block delete followed by stripping the block from `Page.config` is also
wrapped. The TikTok orchestrator's long create sequence is left as is; it has
its own retry and cleanup logic and is out of scope.

### better-auth

`prismaAdapter` is replaced with `drizzleAdapter(db, { provider: 'pg',
schema })`, passing the schema object explicitly so better-auth resolves
`user`, `session`, `account`, `verification`, `organization`, `member`, and
`invitation` to the existing tables. `usePlural` stays false.
`advanced.database.generateId: false` is kept so Postgres generates UUIDs.
better-auth's expected camelCase field names already match the schema; the
adapter's field mapping is verified by the existing sign-in and organization
route tests plus the smoke script.

### Migrations

Drizzle schema is the source of truth from Phase 1.

**Baseline.** `drizzle-kit generate` from the Drizzle schema produces
`0000_baseline.sql`. Parity is proven once, before merge, by applying the
baseline to a fresh database and running `prisma migrate diff` from that
database to `schema.prisma`. The diff must be empty. This check is recorded in
the PR.

**Production adoption.** Production already has the schema. The runbook
inserts the baseline's journal entry into Drizzle's migrations table
(`drizzle.__drizzle_migrations`) without executing the SQL, using the hash
from `migrations/meta/_journal.json`. From then on, `drizzle-kit migrate`
applies only new migrations.

**Where migrations run.** The `deploy` job in `.github/workflows/ci.yml`
gains a step that runs `drizzle-kit migrate` with `DIRECT_URL` from the
Production environment before `wrangler deploy`. The frontend's
`vercel:build` script drops `prisma migrate deploy` in Phase 1 so two tools
never race on the same database. The `prisma generate` steps in `ci.yml`,
`turbo.json`, and the Vercel build are removed as each consumer stops needing
them.

**Dev.** The root scripts become `dev:push` (`drizzle-kit push` against
`.env.local`), `dev:seed`, and `dev:reset` (drop and recreate the public
schema, then push and seed). `dev:migrate` is removed; local databases stay
push-managed. `docs/local-development.md` and `docs/self-hosting.md` are
updated.

**Seed.** Rewritten in Drizzle with `onConflictDoNothing` on `id`. The
current seed omits `id` from the `create` branch of the user and organization
upserts, so a re-run after a manual delete creates a new row; the rewrite
passes the fixed ids. `defaultThemeSeeds` moves from
`apps/frontend/lib/theme.ts` to `packages/db/src/seed-data.ts`, and the
frontend imports it from there, which removes the package-to-app reverse
import.

### Phase 2: frontend behind the API

New routes on the worker, each with the same authorization the frontend
server actions perform today:

| Frontend file | Replacement |
|---|---|
| `app/lib/actions/themes.ts` | `POST /themes`, `PATCH /themes/:themeId`, `GET /themes/:themeId`, `POST /pages/:pageId/theme` |
| `app/components/EditPageSettingsDialog/actions.ts` | `PATCH /pages/:pageId/settings` (general and design payloads), existing `GET /pages/:pageId/settings`, existing `GET /themes/me/team`, existing `GET /pages/internal/slug-availability` |
| `app/components/EditTeamSettingsDialog/actions.ts` | `PATCH /organizations/:organizationId` for the name; invites via the better-auth client's `organization.inviteMember`, which the frontend already imports |
| `app/invite/[inviteId]/page.tsx` and `actions.ts` | `GET /organizations/invitations/:inviteId` for the invite page; acceptance via the better-auth client's `organization.acceptInvitation`, with the seat check already enforced server-side by `beforeAcceptInvitation` in `lib/auth.ts` |
| `app/lib/actions/verification.ts` | `POST /pages/:pageId/verification-requests`, `GET /pages/:pageId/verification-requests/current` |
| `lib/page.ts` | existing `POST /pages` |
| `app/e/page.tsx` | existing `GET /pages/me` |
| `app/api/pages/[pageSlug]/opengraph-image/route.ts` | `GET /pages/internal/og-data?slug=` behind `requireApiKey` |
| `lib/blocks/{spotify-playing-now,instagram-*,tiktok-*,threads-follower-count,github-commits-this-month}/utils.ts` | `GET /blocks/:blockId/integration-data` behind `requireApiKey`. The fetch, decrypt, token-refresh, and re-encrypt logic moves into `apps/api/src/modules/services/<provider>/` next to the OAuth code that already lives there, using the API's `lib/encrypt.ts` |
| `lib/blocks/header/utils.ts` | existing `GET /pages/:pageId/internal/load` |

The frontend's `'use cache'` wrappers and their tags stay in place and call
`publicApiFetch`, so the public page cache behaviour is unchanged.

After the switch, `apps/frontend` drops `@prisma/client`, `@prisma/adapter-pg`,
`@prisma/extension-accelerate`, `prisma`, `lib/prisma.ts`, `lib/encrypt.ts`,
and the env vars `DATABASE_URL`, `DIRECT_URL`, `ENCRYPTION_KEY`,
`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `GITHUB_AUTH_TOKEN` from
`turbo.json` and Vercel. `packages/prisma` is deleted, along with the
`workerd` export condition and both generators.

### Testing

- DB-backed integration tests keep running serially against the shared dev
  database via `dotenvx`.
- A shared fixture helper at `apps/api/src/test/fixtures.ts` creates a user,
  organization, membership, page, and blocks with a random suffix and returns
  a cleanup function that deletes in foreign-key order. The two forms test
  files adopt it; new Phase 2 route tests use it.
- The three tests that mock the Prisma module and assert on argument shapes
  (`integrations/service.test.ts`, `assets/authorization.test.ts`,
  `billing/handlers/billing-portal-url.test.ts`) are rewritten as
  fixture-backed tests that assert on database state or response bodies.
- Each ported module's existing route tests are the regression gate for that
  module. Porting proceeds module by module inside the Phase 1 branch, with
  tests green at each step.
- `db.test.ts` covers the proxy: methods bound to the real client,
  `ownKeys` and `has` working, scoped client wins over fallback, and the
  no-context error.
- The schema parity check (baseline versus `schema.prisma`) runs once before
  Phase 1 merges and is recorded in the PR.
- `wrangler deploy --dry-run` is run before and after Phase 1 and the sizes
  are recorded in the PR.

### Rollout

Phase 1 is a full swap of the API's data layer, so it ships as one PR after
the module-by-module port is complete and green.

1. Run the parity check and record bundle sizes.
2. Merge. The deploy job runs `drizzle-kit migrate` (a no-op after the
   baseline journal entry is inserted) and deploys the worker.
3. Run the smoke script against production immediately after deploy.
4. If smoke fails, `wrangler rollback` to the previous version. The database
   schema is unchanged by Phase 1, so rollback is safe.

Phase 2 ships as one or more PRs per endpoint group. Each PR adds the route,
switches the frontend caller, and removes the corresponding Prisma usage. The
final PR deletes `packages/prisma` and the frontend's Prisma dependencies.

### Success criteria

- All `apps/api` tests pass. The smoke script passes against production after
  each deploy.
- The Worker dry-run upload is materially smaller than 9.7 MB (2.45 MB
  gzipped). The expected drop is the 1.8 MB WASM plus the Prisma runtime;
  actual numbers are recorded in the Phase 1 PR.
- The schema parity check passes.
- After Phase 2, `grep -r prisma` over `package.json` files in the workspace
  returns nothing, and the frontend has no `DATABASE_URL`.

## Out of scope

- Query result caching in the API.
- Changing the shape or typing of any JSON column.
- Hyperdrive configuration changes.
- Switching the Postgres driver to postgres.js.
- The TikTok orchestrator's write sequence.
- The React Router investigation.
