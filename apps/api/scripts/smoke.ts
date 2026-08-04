/**
 * Post-deploy checks against a real Worker. These cover what the Node-based
 * test suite structurally cannot: that the code actually runs on workerd,
 * with real bindings, real network and a real database.
 *
 * Deliberately excluded (require secrets or a live session — do these by
 * hand instead, see Task 18 Step 3):
 *   - the authenticated asset-upload round-trip
 *   - anything requiring a real logged-in session cookie
 *
 * Usage: pnpm smoke https://api-next.lin.ky
 */

// Makes this a module rather than a script, which is what lets top-level
// await work under both tsc and node --experimental-strip-types.
export {};

const baseUrl = process.argv[2];

if (!baseUrl) {
  console.error('Usage: pnpm smoke <base-url>');
  process.exit(1);
}

// The production frontend origin. It must always be able to make credentialed
// requests, no matter which physical Worker URL is under test — see the
// positive-side CORS check below.
const TRUSTED_ORIGIN = 'https://lin.ky';

const failures: string[] = [];

async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ok   ${name}`);
  } catch (error) {
    failures.push(`${name}: ${(error as Error).message}`);
    console.error(`  FAIL ${name}: ${(error as Error).message}`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

console.log(`Smoke testing ${baseUrl}`);

await check('GET /ping', async () => {
  const response = await fetch(`${baseUrl}/ping`);
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = (await response.json()) as { ping?: string };
  assert(body.ping === 'pong', 'unexpected body');
});

await check('Hyperdrive-backed read returns from the database', async () => {
  // Any public page read exercises Prisma over Hyperdrive end to end — this
  // is the single biggest workerd unknown this migration carried (a runtime
  // wasm-codegen ban that plain Node tests cannot reproduce).
  const response = await fetch(
    `${baseUrl}/pages/internal/slug-availability?slug=smoke-test-${Date.now()}`
  );
  assert(response.status === 200, `expected 200, got ${response.status}`);
  const body = (await response.json()) as { isAvailable?: unknown };
  assert(typeof body.isAvailable === 'boolean', 'unexpected body');
});

await check('session endpoint rejects an anonymous caller', async () => {
  const response = await fetch(`${baseUrl}/session/me`);
  assert(response.status === 401, `expected 401, got ${response.status}`);
});

await check('better-auth is mounted and responding', async () => {
  // Also proves the AUTH_RATE_LIMIT binding is actually wired: this route is
  // guarded by requireAuthRateLimit, so a missing binding throws before
  // better-auth ever runs, which would surface here as a 500.
  const response = await fetch(`${baseUrl}/api/auth/get-session`);
  // Any non-5xx proves the handler is wired; the session itself is anonymous.
  assert(response.status < 500, `expected <500, got ${response.status}`);
});

await check('CORS never credentials an untrusted origin', async () => {
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { origin: 'https://evil.example.com' },
  });
  assert(
    response.headers.get('access-control-allow-credentials') === null,
    'untrusted origin received allow-credentials'
  );
});

await check('CORS credentials the real first-party origin', async () => {
  // The mirror image of the check above. A policy that fails closed for
  // every origin (including the real frontend) would pass the check above
  // and break sign-in in production, so both directions need proving.
  const response = await fetch(`${baseUrl}/ping`, {
    headers: { origin: TRUSTED_ORIGIN },
  });
  assert(
    response.headers.get('access-control-allow-credentials') === 'true',
    `trusted origin did not receive allow-credentials (got ${response.headers.get(
      'access-control-allow-credentials'
    )})`
  );
});

await check('unsigned stripe webhook is rejected', async () => {
  const response = await fetch(`${baseUrl}/billing/stripe-webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'invoice.paid' }),
  });
  assert(response.status === 400, `expected 400, got ${response.status}`);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} smoke check(s) failed.`);
  process.exit(1);
}

console.log('\nAll smoke checks passed.');
