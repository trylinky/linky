# Contributing to Linky

Thanks for taking the time to contribute.

## Getting set up

Follow the [local development guide](./docs/local-development.md). In short:

```bash
pnpm install
cp .env.example .env.local          # then fill it in
docker-compose up -d                # postgres
cd packages/prisma && pnpm prisma db push && cd ../..
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
- **Don't weaken the types.** `apps/api/types/auth.d.ts` describes the
  `authenticate` decorator. It once referenced types it never imported, which
  `skipLibCheck` quietly turned into `any` and disabled type checking on
  `session` in every route handler. If you change it, check with
  `tsc --noEmit --skipLibCheck false` and confirm nothing in `src/` or `types/`
  errors.
- **The API bundle inlines `process.env` at build time.** Avoid branching on
  `NODE_ENV` in `apps/api` — the value gets baked in at build and can be wrong
  at runtime. Key behaviour off an explicit variable instead. There are
  comments marking the places this has already bitten.
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
