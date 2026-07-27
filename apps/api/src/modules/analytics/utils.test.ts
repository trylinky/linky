import { getIpAddress } from './utils';
import { FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

const buildRequest = ({
  ip = '10.0.0.1',
  headers = {},
}: {
  ip?: string;
  headers?: Record<string, string>;
} = {}) => ({ ip, headers }) as unknown as FastifyRequest;

describe('getIpAddress', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the client IP even when NODE_ENV is development', () => {
    // Regression test: a NODE_ENV === 'development' short-circuit used to
    // return 127.0.0.1 for every request. Because the API build inlines
    // process.env at bundle time, a non-production build env baked that
    // branch into production, collapsing all users into one rate-limit
    // bucket.
    vi.stubEnv('NODE_ENV', 'development');

    const request = buildRequest({
      headers: { 'x-forwarded-for': '198.51.100.23' },
    });

    expect(getIpAddress(request)).toBe('198.51.100.23');
  });

  it('prefers cf-connecting-ip, which Cloudflare will not let a client forge', () => {
    const request = buildRequest({
      headers: {
        'cf-connecting-ip': '198.51.100.23',
        'x-forwarded-for': '1.2.3.4, 198.51.100.23',
      },
    });

    expect(getIpAddress(request)).toBe('198.51.100.23');
  });

  it('ignores a spoofed x-forwarded-for prefix and uses the nearest proxy hop', () => {
    // A caller sending `X-Forwarded-For: 1.2.3.4` gets it *prepended* to the
    // real value by the proxy. Trusting the leftmost entry would let anyone
    // pick their own rate-limit bucket on every request.
    const request = buildRequest({
      headers: { 'x-forwarded-for': '1.2.3.4, 203.0.113.9' },
    });

    expect(getIpAddress(request)).toBe('203.0.113.9');
  });

  it('gives a forged header no way to change the bucket', () => {
    const real = '203.0.113.9';

    const forged = ['1.2.3.4', '5.6.7.8', 'not-an-ip'].map((spoof) =>
      getIpAddress(
        buildRequest({
          headers: { 'x-forwarded-for': `${spoof}, ${real}` },
        })
      )
    );

    expect(forged).toEqual([real, real, real]);
  });

  it('handles a single-entry x-forwarded-for, trimmed', () => {
    const request = buildRequest({
      headers: { 'x-forwarded-for': ' 198.51.100.23 ' },
    });

    expect(getIpAddress(request)).toBe('198.51.100.23');
  });

  it('falls back to x-real-ip when x-forwarded-for is missing', () => {
    const request = buildRequest({
      headers: { 'x-real-ip': '203.0.113.9' },
    });

    expect(getIpAddress(request)).toBe('203.0.113.9');
  });

  it('falls back to the socket address when no proxy headers are set', () => {
    const request = buildRequest({ ip: '192.0.2.44' });

    expect(getIpAddress(request)).toBe('192.0.2.44');
  });

  it('falls back to 127.0.0.1 when nothing is available', () => {
    const request = buildRequest({ ip: '' });

    expect(getIpAddress(request)).toBe('127.0.0.1');
  });
});
