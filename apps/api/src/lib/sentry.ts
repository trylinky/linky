import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Performance Monitoring
  tracesSampleRate: 0.1,

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 0.1,
  });
}
