import { authenticateApiKeyDecorator } from './authenticate-api-key';
import { FastifyReply, FastifyRequest } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';

const KEY = 'internal-api-key-value';

const buildRequest = (headers: Record<string, string | string[]> = {}) =>
  ({ headers }) as unknown as FastifyRequest;

const reply = {} as FastifyReply;

describe('authenticateApiKeyDecorator', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts the correct key', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);

    await expect(
      authenticateApiKeyDecorator(buildRequest({ 'x-api-key': KEY }), reply)
    ).resolves.toBe(true);
  });

  it('throws a 401 for a wrong key', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);

    await expect(
      authenticateApiKeyDecorator(
        buildRequest({ 'x-api-key': 'not-the-key' }),
        reply
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws a 401 when the header is absent', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);

    await expect(
      authenticateApiKeyDecorator(buildRequest(), reply)
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects rather than allowing everything when no key is configured', async () => {
    vi.stubEnv('INTERNAL_API_KEY', '');

    await expect(
      authenticateApiKeyDecorator(buildRequest({ 'x-api-key': '' }), reply)
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('does not treat a prefix of the key as valid', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);

    await expect(
      authenticateApiKeyDecorator(
        buildRequest({ 'x-api-key': KEY.slice(0, -1) }),
        reply
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns false instead of throwing when throwError is false', async () => {
    vi.stubEnv('INTERNAL_API_KEY', KEY);

    await expect(
      authenticateApiKeyDecorator(
        buildRequest({ 'x-api-key': 'nope' }),
        reply,
        {
          throwError: false,
        }
      )
    ).resolves.toBe(false);
  });
});
