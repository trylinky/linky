import {
  FREE_LIMITS,
  PAID_LIMITS,
  resolveEntitlements,
  resolveTier,
} from './entitlements';
import { describe, expect, it } from 'vitest';

const day = 24 * 60 * 60 * 1000;
const now = new Date('2026-09-17T12:00:00Z');

const sub = (
  over: Partial<{ plan: string; status: string; trialEnd: Date | null }>
) => ({
  plan: 'premium',
  status: 'active',
  trialEnd: null,
  ...over,
});

describe('resolveTier', () => {
  it.each([
    [null, 'free'],
    [sub({ plan: 'freeLegacy', status: 'active' }), 'free'],
    [sub({ plan: 'premium', status: 'active' }), 'premium'],
    [sub({ plan: 'premium', status: 'trialing' }), 'premium'],
    [sub({ plan: 'premium', status: 'past_due' }), 'premium'],
    [sub({ plan: 'team', status: 'active' }), 'team'],
    [sub({ plan: 'premium', status: 'canceled' }), 'free'],
    [sub({ plan: 'premium', status: 'unpaid' }), 'free'],
    [sub({ plan: 'premium', status: 'incomplete' }), 'free'],
    [sub({ plan: 'premium', status: 'incomplete_expired' }), 'free'],
    [sub({ plan: 'team', status: 'canceled' }), 'free'],
  ])('%o resolves to %s', (input, expected) => {
    expect(resolveTier(input)).toBe(expected);
  });

  it('treats site admins as team regardless of subscription', () => {
    expect(resolveTier(null, { isAdmin: true })).toBe('team');
    expect(
      resolveTier(sub({ plan: 'premium', status: 'canceled' }), {
        isAdmin: true,
      })
    ).toBe('team');
  });
});

describe('resolveEntitlements', () => {
  it('gives free the free limits and no features when enforced', () => {
    const e = resolveEntitlements(null, { enforced: true, now });

    expect(e.tier).toBe('free');
    expect(e.limits).toEqual(FREE_LIMITS);
    expect(e.features).toEqual({
      analytics: false,
      privatePages: false,
      customDomain: false,
      verification: false,
    });
    expect(e.trial).toEqual({ active: false, daysLeft: null });
  });

  it('gives premium the paid limits and every feature', () => {
    const e = resolveEntitlements(sub({}), { enforced: true, now });

    expect(e.tier).toBe('premium');
    expect(e.limits).toEqual(PAID_LIMITS);
    expect(Object.values(e.features).every(Boolean)).toBe(true);
  });

  it('reports the real tier but paid limits and features when not enforced', () => {
    const e = resolveEntitlements(null, { enforced: false, now });

    expect(e.tier).toBe('free');
    expect(e.limits).toEqual(PAID_LIMITS);
    expect(Object.values(e.features).every(Boolean)).toBe(true);
  });

  it('reports trial days left, rounded up', () => {
    const e = resolveEntitlements(
      sub({
        status: 'trialing',
        trialEnd: new Date(now.getTime() + 2.2 * day),
      }),
      { enforced: true, now }
    );

    expect(e.trial).toEqual({ active: true, daysLeft: 3 });
  });
});
