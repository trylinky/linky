import { createApp } from '@/app';
import { testEnv } from '@/test/env';
import { describe, expect, it } from 'vitest';

describe('TEST_SESSION binding', () => {
  it('authenticates a session-protected route when set', async () => {
    const response = await createApp().request(
      '/pages/me',
      {},
      testEnv({ user: { id: 'user-test' }, activeOrganizationId: 'org-test' })
    );

    // /pages/me returns [] for an org with no pages; a 401 means the
    // session was not honoured.
    expect(response.status).toBe(200);
  });

  it('leaves a session-protected route unauthenticated when unset', async () => {
    const response = await createApp().request('/pages/me', {}, testEnv());

    expect(response.status).toBe(401);
  });
});
