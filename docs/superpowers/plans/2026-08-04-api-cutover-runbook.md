# API cutover runbook: Render + Fastify → Cloudflare Workers + Hono

> **Done — 2026-09-17.** `api.lin.ky` is served by the Worker `linky-api-production`
> through a Workers Custom Domain, and the `lin.ky` zone lives on Cloudflare. The
> cutover happened at the nameserver switch rather than by adding a route, so
> Steps 1–3 and 5 were not followed as written (see Prerequisites below). The
> remaining live items are Step 7's decommission list: delete the Render service
> once the Worker has run clean for about a week. Kept for the record.

This is the hand-run runbook for Task 18 of `docs/superpowers/plans/2026-08-04-api-cloudflare-hono-migration.md`
(brief: `.superpowers/sdd/2026-08-04-api-cloudflare-hono-migration/task-18-brief.md`). Everything
in this document reaches outside the repo — Cloudflare DNS, Stripe, three OAuth consoles, Render —
so it is written to be followed by hand, not automated. Work through it top to bottom; do not
skip Step 4 (baseline) or Step 6 (watch window), and do not proceed past a single smoke-script
failure.

All commands run from `apps/api` unless noted.

---

## Prerequisites discovered after this runbook was written (2026-09-16)

Read before following any step below; several steps are wrong as written.

1. **`lin.ky` DNS is on Vercel, not Cloudflare.** Nameservers are `ns1/ns2.vercel-dns.com` and the
   zone lives in the hyperdusk Vercel team. `api.lin.ky` is a plain CNAME to
   `glow-t230.onrender.com`; the `server: cloudflare` header on the live API is Render's own edge.
   Worker routes (`zone_name: "lin.ky"`) therefore cannot be created, and Step 1's staging deploy
   and Step 5's cutover both fail until the zone is moved into the Cloudflare account. The zone
   move (32 records, all DNS-only) is its own piece of work and must land first.
2. **There is no staging environment.** The `env.staging` block and the `--env staging` commands
   in Step 1 were removed on 2026-09-16 (`3b0f338`). There is one Worker, `linky-api-production`,
   deployed with no route and `workers_dev: false`. Pre-cutover verification happens by adding a
   temporary second route, `api-next.lin.ky/*`, to that same Worker after the zone move, and by
   briefly enabling `workers_dev` for the smoke script (done once already: 8/8 passed).
3. **The secret list in Step 0 is missing one name.** better-auth reads its signing secret from
   the environment itself (`BETTER_AUTH_SECRET`, or the alias `AUTH_SECRET`, which is what Render
   uses), so a grep of `apps/api/src` never saw it. Without it every `/api/auth/*` request throws
   `You are using the default secret`. All 37 names were loaded on 2026-09-16.
4. **Non-secret values were entered as plain-text variables in the dashboard.** `keep_vars: true`
   in `wrangler.jsonc` stops `wrangler deploy` from deleting them; do not remove that flag.
5. **The integration callback URLs on Render point at `lin.ky/api/services/...`,** which has
   returned 404 since the API was split out of the frontend. The correct values are
   `https://api.lin.ky/services/{instagram/v2/callback, instagram/callback, spotify/callback,
   threads/callback, tiktok/callback}`, and the same URIs must be registered in the Meta, Spotify
   and TikTok consoles. Pre-existing bug, not a migration regression.

---

## Step 0: Load secrets before doing anything else

The Worker reads secrets and vars through `process.env`/`c.env`, exactly like the old Fastify app
did — but there is no build-time check that any of them exist. A missing one doesn't fail
`pnpm typecheck`, doesn't fail `wrangler deploy`, and doesn't 404 — it fails the first time that
one code path runs, in production, as a thrown error or `undefined` reaching somewhere it
shouldn't (see the `NODE_ENV` note below for a live example of this shape of bug being caught
elsewhere).

Do this now, before Step 1, so Step 1's deploy doesn't wake up half-configured:

1. Enumerate every var/secret the Worker actually reads. Confirmed by grepping
   `apps/api/src` for `process.env.*` (excluding `.test.ts` files): **43 distinct names**.
   `apps/api/.dev.vars.example` only lists 10 of these — it predates the OAuth/Slack/PostHog/
   Sentry/Tinybird/Instagram-legacy/Threads/TikTok ports (Tasks 8–16) and should not be treated
   as authoritative. The full list, cross-checked against the repo-root `.env.example` where
   names overlap:

   **Already set as plain `vars` in `wrangler.jsonc`** (both top level and `env.staging` —
   nothing to do here):
   - `APP_ENV`, `APP_FRONTEND_URL`, `API_BASE_URL`, `NEXT_PUBLIC_BASE_URL`

   **Cloudflare resource bindings, not secrets — already in `wrangler.jsonc`, nothing to load
   as a secret:**
   - `HYPERDRIVE` (id `962b7339d781499985faa016771f2c6a`, `linky-production`)
   - `AUTH_RATE_LIMIT` (native Rate Limiting binding, `namespace_id: "1001"`, 100 req/10s)

   **Not something to set — resolved automatically:**
   - `NODE_ENV`: Wrangler's bundler statically replaces `process.env.NODE_ENV` with the literal
     `"production"` on `wrangler deploy` (and `"development"` on `wrangler dev`) at build time —
     confirmed in `wrangler-dist/cli.js`'s esbuild `define` step. This matters because
     `create-new-subscription.ts` and two other billing files pick Stripe price IDs off
     `process.env.NODE_ENV`; there is nothing to configure, but it's worth knowing this isn't a
     var you'll find in the dashboard.
   - `DATABASE_URL`: only read by `lib/prisma.ts`'s local/test fallback path, when there's no
     `AsyncLocalStorage` request-context (Vitest, local scripts). A deployed Worker never has
     `DATABASE_URL` set and never needs it — it always goes through `HYPERDRIVE`.

   **Everything else — must be pushed as secrets (37 names).** Pull the values from wherever
   Render's environment currently lives (Render dashboard → your service → Environment) and from
   the repo-root `.env.example` for names, not values:

   ```
   AUTH_SECRET                    # better-auth reads this itself (alias of BETTER_AUTH_SECRET); not in any apps/api grep
   ENCRYPTION_KEY
   INTERNAL_API_KEY
   STRIPE_API_SECRET_KEY
   STRIPE_WEBHOOK_SECRET          # production webhook secret — staging gets its own, see Step 3
   RESEND_API_KEY
   RESEND_AUDIENCE_ID
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION
   REACTIONS_TABLE_NAME
   AUTH_GOOGLE_CLIENT_ID
   AUTH_GOOGLE_CLIENT_SECRET
   AUTH_TWITTER_CLIENT_ID
   AUTH_TWITTER_CLIENT_SECRET
   AUTH_TIKTOK_CLIENT_KEY
   AUTH_TIKTOK_CLIENT_SECRET
   INSTAGRAM_CLIENT_ID
   INSTAGRAM_CLIENT_SECRET
   INSTAGRAM_CALLBACK_URL
   INSTAGRAM_LEGACY_CLIENT_ID
   INSTAGRAM_LEGACY_CLIENT_SECRET
   INSTAGRAM_LEGACY_CALLBACK_URL
   SPOTIFY_CLIENT_ID
   SPOTIFY_CLIENT_SECRET
   SPOTIFY_REDIRECT_URL
   THREADS_CLIENT_ID
   THREADS_CLIENT_SECRET
   THREADS_CALLBACK_URL
   TIKTOK_CLIENT_KEY
   TIKTOK_CLIENT_SECRET
   TIKTOK_CALLBACK_URL
   SLACK_TOKEN
   POSTHOG_API_KEY
   SENTRY_DSN
   TINYBIRD_API_KEY
   TRUSTED_ORIGINS                # optional — only if self-hosting extra origins
   NEXT_PUBLIC_ROOT_DOMAIN
   ```

2. Build `/path/to/secrets.json` as a flat `{"KEY": "value", ...}` of the 36 names above, sourced
   from Render's current environment. Keep this file out of the repo and delete it once loaded
   (it is a plaintext copy of every production secret).

3. **Discrepancy worth flagging**: the task brief's background notes say "the KV namespace and
   rate-limit binding are already configured." That's half true today — there is **no KV
   namespace** in the current `wrangler.jsonc` at all. Task 2 provisioned one
   (`AUTH_RATE_LIMIT`, id `8b445579ed994833826ab40616934b4c`), but Task 6 removed it entirely and
   replaced it with the native Rate Limiting binding, because Cloudflare KV's 60-second minimum
   `expirationTtl` is incompatible with better-auth's 10-second rate-limit window. Only the
   Rate Limiting binding (also confusingly named `AUTH_RATE_LIMIT`) remains. Don't go looking for
   a KV namespace to configure — there isn't one, and that's correct.

---

## Step 1: Deploy to a staging hostname

`apps/api/wrangler.jsonc` now has an `env.staging` block (added by this task) defining
`linky-api-staging` on `api-next.lin.ky/*`, with `API_BASE_URL` pointed at the staging hostname
while `APP_FRONTEND_URL` and `NEXT_PUBLIC_BASE_URL` still point at production `https://lin.ky` —
staging is verified against the real frontend, not a staging one.

**Important finding, verified against the installed `wrangler@4.118.0`'s config parser
(`wrangler-dist/cli.js`, the `notInheritable2`-tagged fields): named environments do NOT inherit
`vars`, `hyperdrive`, or `ratelimits` from the top level.** Only `compatibility_date`,
`compatibility_flags`, `limits`, and `observability` are inherited. This means `env.staging`
**must** explicitly redeclare `hyperdrive` and `ratelimits`, or the staging Worker would deploy
with an empty `hyperdrive: []` — `c.env.HYPERDRIVE` would be `undefined` and every
database-touching request would throw, and the rate-limit binding would be similarly missing
(500s on any better-auth route). The `env.staging` block already added to `wrangler.jsonc`
redeclares both, pointing at the **same** Hyperdrive config (`962b7339d781499985faa016771f2c6a`)
and the same rate-limit binding as production — there is only one Postgres (PlanetScale, per
Task 1's findings), so staging and production share it by design; this is not a mistake.

Verified: `pnpm wrangler deploy --dry-run --env staging` (run during this task) resolves cleanly
and prints:

```
env.HYPERDRIVE (962b7339d781499985faa016771f2c6a)                Hyperdrive Config
env.AUTH_RATE_LIMIT (100 requests/10s)                            Rate Limit
env.API_BASE_URL ("https://api-next.lin.ky")                      Environment Variable
env.APP_FRONTEND_URL ("https://lin.ky")                           Environment Variable
env.NEXT_PUBLIC_BASE_URL ("https://lin.ky")                       Environment Variable
```

— i.e. staging correctly gets its own `API_BASE_URL` while keeping production's frontend URLs,
and both bindings are present. A `pnpm wrangler deploy --dry-run` (no `--env`) at the same time
confirmed the top-level config is untouched (`API_BASE_URL` still `https://api.lin.ky`).

Now do the parts that reach outside the repo:

1. **Create the `api-next.lin.ky` DNS record** in the Cloudflare dashboard for zone `lin.ky`:
   type `A` or `CNAME` (a dummy/placeholder target is fine — Worker Routes intercept before DNS
   resolution matters), **proxied** (orange cloud).

2. Deploy the staging Worker and load its secrets:

   ```bash
   cd apps/api
   pnpm wrangler deploy --env staging
   pnpm wrangler secret bulk /path/to/secrets.json --env staging
   ```

   `secret bulk` accepts up to 100 key/value pairs per call from a JSON file
   (`{"KEY": "value", ...}`) — the file built in Step 0.

---

## Step 2: Run the smoke script

```bash
cd apps/api && pnpm smoke https://api-next.lin.ky
```

This runs `scripts/smoke.ts` (added in Task 17), which checks: `GET /ping`; a Hyperdrive-backed
Prisma read (`GET /pages/internal/slug-availability?slug=...`); `GET /session/me` anonymous → 401;
`GET /api/auth/get-session` → non-5xx (this incidentally proves the `AUTH_RATE_LIMIT` binding is
wired — if it were missing, `c.env.AUTH_RATE_LIMIT.limit(...)` throws before better-auth runs,
surfacing as a 500 here); CORS denies an untrusted origin; CORS allows `https://lin.ky` with
credentials; and an unsigned Stripe webhook → 400.

**Expected: all seven checks pass (the script itself calls out six checks; a seventh — the
positive-side CORS check — was added in Task 17 beyond the brief's floor). Do not proceed past a
single failure.** The script prints the failing check by name and exits non-zero.

---

## Step 3: Manual verification — the paths the smoke script cannot cover

Register a **separate Stripe webhook endpoint** at `https://api-next.lin.ky/billing/stripe-webhook`
with its own signing secret (Stripe dashboard → Developers → Webhooks → Add endpoint), then load
that secret onto the staging worker specifically:

```bash
cd apps/api
echo '{"STRIPE_WEBHOOK_SECRET": "whsec_..."}' | pnpm wrangler secret bulk --env staging
```

(This intentionally overwrites the `STRIPE_WEBHOOK_SECRET` you bulk-loaded in Step 1 with the
staging-specific one — staging must not share a webhook secret with production.)

Add these three URLs to the corresponding OAuth provider consoles as additional authorized
callback URLs (temporary — removed in Step 7):

- `https://api-next.lin.ky/api/auth/callback/google`
- `https://api-next.lin.ky/api/auth/callback/twitter`
- `https://api-next.lin.ky/api/auth/callback/tiktok`

Then run a local frontend against the staging API:

```bash
NEXT_PUBLIC_API_URL=https://api-next.lin.ky pnpm dev   # from apps/frontend
```

And verify by hand:

- [ ] Sign in with a magic link, end to end
- [ ] Sign in with Google, Twitter and TikTok
- [ ] **Upload a page background image, open the resulting `cdn.lin.ky` URL, and compare the
      framing pixel-for-pixel against the same source image uploaded through the current Render
      API.** This is the single highest-risk manual check in this runbook: `sharp` was replaced
      by `@jsquash` WASM codecs (Task 9) for the resize/crop pipeline. A wrong `coverCrop`
      calculation does not throw, does not 4xx, does not show up in the smoke script or in
      Sentry — it just silently reframes every image uploaded from that point on (different
      crop box, different aspect handling, a stretched or off-center result). It fails
      **quietly** and would sit there being wrong until a user noticed and reported it. Do the
      comparison side by side, same source file, same crop parameters, both URLs open at once.
      Check at least one portrait-oriented and one landscape-oriented source image, since crop
      math bugs are often orientation-dependent.
- [ ] Upload a block asset (not a page background), same side-by-side framing comparison
- [ ] Submit a form on a published page, then confirm the response appears in the dashboard
- [ ] Add a reaction to a published page and confirm the count increments (exercises the
      DynamoDB path over `aws4fetch`)
- [ ] Trigger a Stripe **test-mode** subscription and confirm the webhook lands on the staging
      endpoint registered above
- [ ] Connect and disconnect an Instagram or Spotify integration (exercises Task 5's WebCrypto
      encrypt/decrypt against real stored tokens — a WebCrypto porting bug would surface here as
      a failed decrypt on an existing token, not on a fresh one)
- [ ] Load a page's analytics (exercises the Tinybird-backed path)

Do not proceed to Step 4 until every box above is checked.

---

## Step 4: Record the pre-cutover baseline

From the Render dashboard, note down, right now, before touching anything else:

- Current 5xx rate (requests/min or % of total, whatever the dashboard shows)
- p50 and p95 latency
- Sentry error volume (issues/hour) for the API project

Write these numbers down somewhere durable (a scratch note, a comment on the tracking issue —
this document doesn't have a place for them since they're only known at cutover time). Without
this baseline, "above baseline" in the Step 6 rollback triggers is unmeasurable, and you will not
be able to tell a real regression from normal traffic variance.

---

## Step 5: Cut over

Add to `wrangler.jsonc`'s **top level** (not inside `env.staging`):

```jsonc
"routes": [{ "pattern": "api.lin.ky/*", "zone_name": "lin.ky" }],
```

Then:

```bash
cd apps/api
pnpm wrangler deploy
pnpm smoke https://api.lin.ky
```

Worker Routes take precedence over the origin DNS record, so this takes effect **immediately** —
there is no propagation delay to wait out. Nothing changes in Stripe or the OAuth provider
consoles: the production URLs (`api.lin.ky`) are unchanged, only which compute answers them.

If the smoke script fails here, you are already live on the Worker — go straight to the rollback
procedure below rather than debugging in place.

---

## Step 6: Watch for one hour

Monitor continuously against the Step 4 baseline:

- **Worker logs**: `pnpm wrangler tail` (from `apps/api`, no `--env` — this tails the production
  Worker) for exceptions.
- **Sentry** for new issue types (not just volume — a new _kind_ of error is more informative
  than a volume blip).
- **Stripe dashboard** → Developers → Webhooks → the production endpoint, for delivery failures.
- **5xx rate**, compared to the Step 4 number.

### Roll back immediately on any of

- 5xx rate above the Step 4 baseline
- Any Stripe webhook signature failure
- Any session-resolution failure (a logged-in user getting bounced to anonymous)
- An upload producing a visibly wrong image (the Step 3 framing check, now happening for real
  users)

### Rollback procedure

Remove the `routes` key added in Step 5 from `wrangler.jsonc`'s top level, then:

```bash
cd apps/api && pnpm wrangler deploy
```

This restores the Render origin DNS record as the traffic target within seconds — no DNS TTL to
wait through, since removing the Worker Route just stops it from intercepting, and the origin
record was never changed. Confirm recovery by re-checking the 5xx rate and hitting
`https://api.lin.ky/ping`.

**Sessions live in the same Postgres in both directions, and the cookie domain (`.lin.ky`) is
unchanged by this migration.** Neither the cutover nor a rollback signs anyone out — this is not
a flag to check for, it's a property of the design to keep in mind so a rollback isn't treated as
more disruptive than it is.

---

## Step 7: Decommission after a week

Only once the Worker has run clean for ~7 days past Step 5 with no rollback:

- [ ] Commit the top-level `routes` key added to `wrangler.jsonc` in Step 5. It was added by hand
      at cutover time so it could be deployed and rolled back quickly without waiting on a review —
      that's fine for the cutover itself, but left uncommitted (or, worse, applied only through the
      Cloudflare dashboard rather than this file) it means the production `api.lin.ky/*` route lives
      only in the dashboard and isn't reviewable in git. Now that the flip is proven, commit it.
- [ ] Delete the Render service
- [ ] Remove the `api-next.lin.ky` DNS record
- [ ] Remove its Stripe webhook endpoint (the one registered in Step 3)
- [ ] Remove the three temporary OAuth callback URLs added in Step 3 from the Google, Twitter and
      TikTok consoles
- [ ] Delete the `env.staging` block from `apps/api/wrangler.jsonc`
- [ ] Update `README.md` and `CONTRIBUTING.md` wherever they describe running or deploying the
      API (as of this task, neither file mentions Render, Fastify or Wrangler by name — check
      whether that's still true and update whatever generic "the API" language needs to point at
      the new deploy model)

## Step 8: Commit

```bash
git add apps/api/wrangler.jsonc README.md CONTRIBUTING.md
git commit -m "chore: cut the api over to cloudflare and decommission render"
```
