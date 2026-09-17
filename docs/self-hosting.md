# Self-hosting Guide

> [!WARNING]
> This guide is currently a work in progress.

This guide will help you self-host Linky on your own infrastructure. Follow these steps to get your instance up and running.

We recommend first following the [local development guide](./local-development.md) to get your instance running locally.

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

You will need to add the environment variables to where you are hosting the
frontend application and the API. Please refer to the `turbo.json` file for
the list of environment variables that you need to set for each application.

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

1. You will need to setup a PostgreSQL database. Once you have done so, you will need to add the following environment variables to your frontend and API applications:

```bash
DIRECT_URL=
DATABASE_URL=
```

The migrations will be run automatically when you deploy the API.

## Step 4: Running the applications.

Linky uses [Turbo](https://turbo.build/) to run the frontend and backend applications. As such, you will need to use the following commands to run the applications:

Frontend:

```bash
turbo run build:frontend --filter=@trylinky/frontend
```

API (a Cloudflare Worker, deployed with Wrangler):

```bash
DIRECT_URL=<your direct postgres url> pnpm --filter @trylinky/db migrate
cd apps/api && pnpm wrangler deploy
```

Before the first deploy, edit `apps/api/wrangler.jsonc`: set `name`, the
`vars` (`APP_FRONTEND_URL`, `API_BASE_URL`, `NEXT_PUBLIC_BASE_URL`), the
`hyperdrive` binding id for a [Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
config pointing at your Postgres, and the `routes` entry for your API
hostname. Load the remaining values as secrets with
`pnpm wrangler secret bulk <file.json>`; `apps/api/.dev.vars.example` lists
every name. The Worker needs the Workers Paid plan (image resizing and the
TikTok orchestrator exceed the free CPU limit).

## Security Considerations

1. Always use HTTPS in production
2. Keep your `ENCRYPTION_KEY` secure and never share it
3. Regularly update dependencies for security patches
4. Use strong passwords for all services

## License

Make sure you comply with the project's license terms when self-hosting.
