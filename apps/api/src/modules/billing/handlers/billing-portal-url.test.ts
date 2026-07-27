import { safeReturnUrl } from './billing-portal-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('@/lib/stripe', () => ({ stripeClient: {} }));

const APP = 'https://lin.ky';

describe('safeReturnUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps a return url on our own origin', () => {
    vi.stubEnv('APP_FRONTEND_URL', APP);

    expect(safeReturnUrl('https://lin.ky/edit?showBilling=true')).toBe(
      'https://lin.ky/edit?showBilling=true'
    );
  });

  it('rejects another origin and falls back to the app', () => {
    // redirectTo is caller-supplied and handed to Stripe as return_url, so an
    // unchecked value bounces the user to an arbitrary site on the way out.
    vi.stubEnv('APP_FRONTEND_URL', APP);

    expect(safeReturnUrl('https://evil.example.com/phish')).toBe(
      'https://lin.ky/edit'
    );
  });

  it('rejects a protocol-relative url', () => {
    vi.stubEnv('APP_FRONTEND_URL', APP);

    expect(safeReturnUrl('//evil.example.com')).toBe('https://lin.ky/edit');
  });

  it('falls back when nothing is supplied or it does not parse', () => {
    vi.stubEnv('APP_FRONTEND_URL', APP);

    expect(safeReturnUrl(undefined)).toBe('https://lin.ky/edit');
    expect(safeReturnUrl('not a url')).toBe('https://lin.ky/edit');
  });
});
