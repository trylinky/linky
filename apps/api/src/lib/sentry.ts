import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });
}
