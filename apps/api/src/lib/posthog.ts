import { config } from '@/modules/features';
import { PostHog } from 'posthog-node';

export const createPosthogClient = () => {
  if (!config.posthog.enabled) {
    console.info('Posthog is not enabled, skipping client creation');
    return null;
  }

  if (!process.env.POSTHOG_API_KEY) {
    console.warn('POSTHOG_API_KEY KEY is not set');
    return null;
  }

  return new PostHog(process.env.POSTHOG_API_KEY, {
    host: 'https://eu.i.posthog.com',
    // Workers kill the isolate at the end of a request, taking any buffered
    // events with them. Send immediately and let callers waitUntil the flush.
    flushAt: 1,
    flushInterval: 0,
  });
};
