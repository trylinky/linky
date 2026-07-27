# Security Policy

## Reporting a vulnerability

Please **don't** open a public issue for a security problem.

Report it privately through GitHub:
[Report a vulnerability](https://github.com/trylinky/linky/security/advisories/new).
That opens a private advisory visible only to the maintainers.

Useful things to include, as far as you have them:

- what an attacker can do, and what they need in order to do it
- the affected endpoint, page or package
- steps to reproduce, or a proof of concept
- whether it affects lin.ky, self-hosted instances, or both

You should get an acknowledgement within a few days. Please give us a
reasonable window to ship a fix before disclosing publicly.

## Supported versions

Linky is developed on `main` and the hosted version at lin.ky tracks it.
Fixes land on `main`; there are no long-lived release branches to back-port to.

## Notes for self-hosted deployments

A few settings are security-relevant and easy to miss:

- **`TRUSTED_ORIGINS`** — the origins allowed to make credentialed
  (cookie-bearing) requests to the API. Set this to your own domains. If it is
  unset, the API falls back to the hosted lin.ky origins plus
  `APP_FRONTEND_URL`. Pages on user custom domains do **not** need to be listed:
  they only call session-free public endpoints.
- **`ENCRYPTION_KEY`** — encrypts stored integration credentials. Treat it like
  a database password. Rotating it requires re-encrypting existing rows; see
  `reencrypt` in `apps/api/src/lib/encrypt.ts`.
- **`INTERNAL_API_KEY`** — shared secret between the frontend and the API for
  internal endpoints. Anyone holding it can read unpublished page data.
- **Run the API behind a proxy that sets a trustworthy client IP.** Form
  submission rate limiting and per-visitor reaction caps are keyed on it.
  `getIpAddress` prefers Cloudflare's `CF-Connecting-IP` and otherwise takes the
  nearest `X-Forwarded-For` hop. If your origin is reachable directly, bypassing
  the proxy, a client can set those headers itself and sidestep both limits —
  restrict the origin to your proxy.
- **Stripe webhooks** are verified against `STRIPE_WEBHOOK_SECRET`. Don't
  disable that check.
