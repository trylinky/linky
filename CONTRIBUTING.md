# Contributing to Linky

Thanks for taking the time to contribute.

## Getting set up

Follow the [local development guide](./docs/local-development.md). In short:

```bash
pnpm install
cp .env.example .env.local          # then fill it in
docker-compose up -d                # postgres
pnpm dev:push
pnpm dev
```

The repo pins its package manager in `package.json` (`packageManager`), so use
`pnpm`, not `npm` or `yarn`, or the lockfile will drift.

## Before you open a pull request

CI runs these four on every PR. Run them locally first:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"
```

`pnpm test` includes DB-backed integration tests for the API, so it needs a
running database and `DATABASE_URL` in `.env.local`. CI brings up its own
postgres service container.

If prettier complains, `pnpm prettier --write` on the files you touched. Please
don't reformat files your change doesn't otherwise touch — it makes review
harder.

## Conventions worth knowing

- **Lint is enforced.** `@typescript-eslint/no-unused-vars` is an error. If a
  binding is deliberately unused — a key destructured only to keep it out of a
  rest object, say — prefix it with `_`.
- **Don't weaken the types.** The session a route handler sees comes from
  `apps/api/src/middleware/authenticate.ts` via Hono's typed `Variables`. A
  previous version of this typing referenced types it never imported, which
  `skipLibCheck` quietly turned into `any` and disabled type checking on
  `session` in every route handler. If you change it, check with
  `tsc --noEmit --skipLibCheck false` and confirm nothing in `src/` or `types/`
  errors.
- **The API is a Cloudflare Worker.** `apps/api` runs on workerd via Hono, so
  Node-only APIs and modules are not available; `nodejs_compat` covers
  `Buffer`, `process.env`, `AsyncLocalStorage` and friends, not `sharp`,
  `http` or the AWS SDK. Configuration is read from `process.env` at request
  time (Wrangler populates it from `vars` and secrets), with one exception:
  Wrangler defines `NODE_ENV` at build time, so avoid branching on it. Clients
  that hold a socket (the database pool, better-auth) are constructed per
  request, see `apps/api/src/lib/db.ts`; anything else must be constructed
  lazily, never at module scope, because Cloudflare executes the top level
  when it validates an upload, before any secret exists
  (`apps/api/src/lib/stripe.ts` shows the pattern).
- **CORS is deliberate.** Only first-party origins get credentialed requests.
  Published pages run on user custom domains and may only call session-free
  endpoints. See `apps/api/src/lib/origins.ts` before changing it.
- **Authorization belongs on the server.** A check in a server action that a
  client can skip by calling the underlying endpoint directly is not a check.

## Tests

Vitest, throughout:

- `apps/api` — unit tests plus DB-backed integration tests against the dev
  database. Files run serially (`fileParallelism: false`) because they share it.
- `packages/*` — plain unit tests.

Inject external boundaries (Stripe, S3, DynamoDB, the LLM) rather than reaching
for the network in a test. `apps/api/src/modules/reactions/service.test.ts`
shows the pattern for stubbing an AWS client.

## Commit messages

Explain _why_, not just what. If you fixed a bug, say what the broken behaviour
was — that is the part that is hard to reconstruct later.

## Reporting security issues

Please don't open a public issue. See [SECURITY.md](./SECURITY.md).
