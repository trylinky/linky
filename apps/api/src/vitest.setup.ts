import { afterEach, beforeEach, vi } from 'vitest';

/**
 * A stale `vi.mock` target once silently stopped intercepting DynamoDB calls
 * in reactions/service.test.ts, and the test run that exposed it made real
 * DynamoDB calls against `glow-development` with production-adjacent
 * credentials — nothing in the test itself would have failed loudly.
 *
 * Every test file gets a global `fetch` that throws by default, so any
 * external-boundary mock that silently stops intercepting turns into an
 * immediate, loud test failure instead of a live network call. A test that
 * legitimately needs to exercise a real HTTP boundary (Resend, Stripe, S3,
 * Slack, etc.) mocks it explicitly with its own `vi.stubGlobal('fetch', …)`,
 * which overrides this default for the remainder of that test.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => {
      throw new Error(
        'unexpected real fetch call in a test — the external boundary this ' +
          'call was meant to hit is unmocked (or the mock stopped ' +
          'intercepting). Mock it at the client boundary, or stub fetch ' +
          'explicitly for this test if it genuinely needs to exercise one.'
      );
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
