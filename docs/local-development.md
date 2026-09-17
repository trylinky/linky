# Local Development

This guide will help you get Linky running locally. Follow these steps to get your instance up and running.

## Prerequisites

Before you begin, make sure you have the following installed:

- Node.js (version specified in `.nvmrc`)
- Docker and Docker Compose
- PostgreSQL 15.1 or later
- Git

## Step 1: Clone the repository

```bash
git clone https://github.com/trylinky/linky.git
cd linky
```

## Step 2: Environment Setup

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Fill in the required environment variables in `.env.local` (please see the env file for more details on what is required and what the variables are for).

### Third-party Services

You'll need to set up the following services and add their credentials:

#### Required Services

- AWS (for asset storage):
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
- Google OAuth:
  - `AUTH_GOOGLE_CLIENT_ID`
  - `AUTH_GOOGLE_CLIENT_SECRET`
- Twitter (X) OAuth:
  - `AUTH_TWITTER_CLIENT_ID`
  - `AUTH_TWITTER_CLIENT_SECRET`
- TikTok OAuth:
  - `AUTH_TIKTOK_CLIENT_ID`
  - `AUTH_TIKTOK_CLIENT_SECRET`
- Stripe (for payments):
  - `STRIPE_API_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Sentry (for error tracking):
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
- Tinybird (for analytics):
  - `NEXT_PUBLIC_TINYBIRD_TRACKER_TOKEN`
  - `TINYBIRD_API_KEY`
- Posthog (for analytics):
  - `POSTHOG_API_KEY`
- DynamoDB (for reactions storage):
  - `REACTIONS_TABLE_NAME`
- Slack (for notifications):
  - `SLACK_TOKEN`

#### Integrations

- Instagram Integration:
  - `INSTAGRAM_CALLBACK_URL`
  - `INSTAGRAM_CLIENT_ID`
  - `INSTAGRAM_CLIENT_SECRET`
- Spotify:
  - `SPOTIFY_CLIENT_ID`
  - `SPOTIFY_CLIENT_SECRET`
  - `SPOTIFY_REDIRECT_URL`
- Threads:
  - `THREADS_CALLBACK_URL`
  - `THREADS_CLIENT_ID`
  - `THREADS_CLIENT_SECRET`
- TikTok:
  - `TIKTOK_CALLBACK_URL`
  - `TIKTOK_CLIENT_KEY`
  - `TIKTOK_CLIENT_SECRET`

## Step 3: Database Setup

1. Start the PostgreSQL database using Docker Compose:

```bash
docker-compose up -d
```

2. The database will be bootstrapped with the following default credentials:
   - Username: glow_user
   - Password: KGfUZosCOm
   - Database: glow_development

## Step 4: Installation

1. Install dependencies:

```bash
pnpm install
```

2. Create the schema. `pnpm dev:push` syncs the database to the Drizzle
   schema in `packages/db`:

```bash
pnpm dev:push
pnpm dev:seed
```

> [!NOTE]
> Prefer `dev:push` locally. Migration files are only generated for changes
> that ship (`pnpm --filter @trylinky/db generate`); see
> `packages/db/migrations/README.md`. `pnpm dev:reset` drops and recreates
> the `public` schema, then pushes and seeds; it needs `psql` on your PATH
> (or run it through `docker compose exec postgres psql`).

## Step 5: Building the Application

Start every app in watch mode:

```bash
pnpm dev
```

Turbo will start the API and the frontend application on the following ports:

- Frontend: http://localhost:3000
- API: http://localhost:3001

The API runs under `wrangler dev`, Cloudflare's local Workers runtime. It
reads its variables from `apps/api/.dev.vars` (gitignored), not from
`.env.local`, so create that file once:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

and fill in the values you need. `DATABASE_URL` there is only used by the
tests; `wrangler dev` reaches Postgres through the `HYPERDRIVE` binding's
`localConnectionString` in `apps/api/wrangler.jsonc`, which already points at
the docker-compose database.

## Step 6: Running the checks

The same four checks run in CI on every pull request:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"
```

`pnpm test` includes DB-backed integration tests for the API, so the database
from Step 3 needs to be running and `DATABASE_URL` set in `.env.local`.

## Security Considerations

1. Always use HTTPS in production
2. Keep your `ENCRYPTION_KEY` secure and never share it
3. Regularly update dependencies for security patches
4. Use strong passwords for all services

## License

Make sure you comply with the project's license terms when self-hosting.
