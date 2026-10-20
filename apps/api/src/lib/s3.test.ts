import { putObject } from './s3';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('putObject', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends a signed PUT to the right bucket and key', async () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    vi.stubEnv('AWS_REGION', 'us-east-1');

    const fetchMock = vi.fn(
      async (_request: Request) => new Response(null, { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    await putObject({
      bucket: 'test.glow.user-uploads',
      key: 'pg-bg-abc/def.webp',
      body: new Uint8Array([1, 2, 3]),
      contentType: 'image/webp',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][0] as Request;

    expect(request.method).toBe('PUT');
    // Path-style, not virtual-hosted: the bucket names contain dots, which
    // S3's wildcard certificate (*.s3.<region>.amazonaws.com) can't match,
    // so a virtual-hosted URL fails the TLS handshake.
    expect(request.url).toBe(
      'https://s3.us-east-1.amazonaws.com/test.glow.user-uploads/pg-bg-abc/def.webp'
    );
    expect(request.headers.get('content-type')).toBe('image/webp');
    // SigV4 signing is the whole point — an unsigned PUT would 403 in prod.
    expect(request.headers.get('authorization')).toMatch(/^AWS4-HMAC-SHA256 /);
  });

  it('throws when S3 rejects the upload', async () => {
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret');
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('AccessDenied', { status: 403 }))
    );

    await expect(
      putObject({
        bucket: 'b',
        key: 'k',
        body: new Uint8Array(),
        contentType: 'image/png',
      })
    ).rejects.toThrow(/403/);
  });
});
