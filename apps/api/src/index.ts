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
