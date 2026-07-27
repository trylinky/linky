import { isForbiddenSlug, isReservedSlug, regexSlug } from './index';
import { describe, expect, it } from 'vitest';

describe('isForbiddenSlug', () => {
  it('blocks reserved app routes', () => {
    expect(isForbiddenSlug('pricing')).toBe(true);
    expect(isForbiddenSlug('privacy-policy')).toBe(true);
  });

  it('blocks slugs that only the API used to block', () => {
    // The two copies of this list had drifted: the API blocked 'explore' and
    // the frontend did not, so the client-side check passed and the create
    // call then failed server-side.
    expect(isForbiddenSlug('explore')).toBe(true);
  });

  it('allows an ordinary handle', () => {
    expect(isForbiddenSlug('alexpate')).toBe(false);
    expect(isForbiddenSlug('some_person123')).toBe(false);
  });
});

describe('isReservedSlug', () => {
  it('reserves the product names', () => {
    expect(isReservedSlug('onedash')).toBe(true);
    expect(isReservedSlug('glow')).toBe(true);
  });

  it('reserves slugs that only the frontend used to reserve', () => {
    expect(isReservedSlug('linky')).toBe(true);
  });

  it('is case insensitive', () => {
    expect(isReservedSlug('GLOW')).toBe(true);
    expect(isReservedSlug('Linky')).toBe(true);
  });

  it('allows an ordinary handle', () => {
    expect(isReservedSlug('alexpate')).toBe(false);
  });
});

describe('regexSlug', () => {
  it('accepts lowercase alphanumerics and underscores', () => {
    expect(regexSlug.test('alex_pate123')).toBe(true);
  });

  it('rejects uppercase, spaces, dots and slashes', () => {
    for (const invalid of ['AlexPate', 'alex pate', 'alex.pate', 'alex/pate']) {
      expect(regexSlug.test(invalid)).toBe(false);
    }
  });
});
