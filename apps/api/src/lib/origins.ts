/**
 * Origins that are allowed to make *credentialed* (cookie-bearing) requests to
 * the API — i.e. the first-party app surfaces.
 *
 * Pages served on a user's custom domain are deliberately NOT in this list.
 * They only ever call session-free public endpoints (reactions, form
 * submissions), which are served with CORS but without credentials. See the
 * CORS delegator in src/index.ts.
 */

const HOSTED_APP_ORIGINS = [
  'https://lin.ky',
  'https://www.lin.ky',
  'https://admin.lin.ky',
  'https://glow.as',
  'https://www.glow.as',
  'https://admin.glow.as',
];

const LOCAL_DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3004',
];

function isLoopbackOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    );
  } catch {
    return false;
  }
}

/** Normalises a URL to its origin, dropping any path/query. */
function toOrigin(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function parseConfiguredOrigins(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => toOrigin(entry.trim()))
    .filter((entry): entry is string => entry !== null);
}

function buildTrustedOrigins(): string[] {
  const configured = parseConfiguredOrigins(process.env.TRUSTED_ORIGINS);
  // The frontend this API is paired with is always trusted.
  const appOrigin = toOrigin(process.env.APP_FRONTEND_URL);
  const withAppOrigin = (origins: string[]) => [
    ...new Set(appOrigin ? [...origins, appOrigin] : origins),
  ];

  // Self-hosted deployments set TRUSTED_ORIGINS and should not inherit the
  // hosted lin.ky origins.
  if (configured.length > 0) {
    return withAppOrigin(configured);
  }

  // Deliberately keyed off APP_FRONTEND_URL rather than NODE_ENV: the API is
  // bundled by esbuild, which inlines process.env at build time, so a NODE_ENV
  // branch can be baked in wrong (see the same warning in lib/prisma.ts and
  // modules/analytics/utils.ts). APP_FRONTEND_URL is set per deployment and is
  // already load-bearing for auth callbacks, so it is the reliable signal.
  const base =
    appOrigin && isLoopbackOrigin(appOrigin)
      ? LOCAL_DEVELOPMENT_ORIGINS
      : HOSTED_APP_ORIGINS;

  return withAppOrigin(base);
}

export const trustedOrigins = buildTrustedOrigins();

/**
 * A missing Origin header means the request is same-origin or not from a
 * browser (server-to-server, curl), which CORS does not govern — those are
 * treated as trusted so non-browser clients keep working.
 */
export function isTrustedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  return trustedOrigins.includes(origin);
}
