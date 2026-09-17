import { createApp } from '@/app';
import db from '@/lib/db';
import {
  cleanupTestData,
  createTestBlock,
  createTestOrganization,
  createTestPage,
} from '@/test/fixtures';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Route-level tests: the service has its own coverage in service.test.ts,
// but the TypeBox body validator runs BEFORE the service sees the payload,
// so schema-layer behavior (e.g. the absence of AJV-style type coercion) is
// only observable here.

const suffix = randomUUID().slice(0, 8);
const IP = '198.51.100.21';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  // Cloudflare's native Rate Limiting binding, not KV — see the comment on
  // `AUTH_RATE_LIMIT` in env.ts. `limit()` always succeeds here so these
  // tests aren't rate-limited against each other.
  AUTH_RATE_LIMIT: {
    limit: async () => ({ success: true }),
  },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

const testFormConfig = {
  title: 'Contact me',
  submitLabel: 'Submit',
  successMessage: 'Thanks!',
  fields: [
    { id: 'f-email', type: 'email', label: 'Email', required: true },
    { id: 'f-agree', type: 'checkbox', label: 'I agree', required: true },
  ],
};

let app: ReturnType<typeof createApp>;
let organizationId: string;
let pageId: string;
let blockId: string;

beforeAll(async () => {
  organizationId = (await createTestOrganization({ suffix: `form-routes-${suffix}` })).id;
  pageId = (await createTestPage({ organizationId, suffix: `form-routes-${suffix}` })).id;
  blockId = (await createTestBlock({ pageId, type: 'form', data: testFormConfig })).id;

  app = createApp();
});

afterAll(async () => {
  await cleanupTestData({ pageIds: [pageId], organizationIds: [organizationId] });
});

describe('POST /forms/:blockId/submissions', () => {
  it('accepts a checked required checkbox and stores it as a boolean', async () => {
    const response = await app.request(
      `/forms/${blockId}/submissions`,
      {
        method: 'POST',
        headers: {
          'x-forwarded-for': IP,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          answers: { 'f-email': 'visitor@example.com', 'f-agree': true },
          website: '',
        }),
      },
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });

    const stored = await db.query.formSubmission.findFirst({
      where: (s, { eq }) => eq(s.blockId, blockId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    // Strict boolean: AJV coercion through the body schema's string|boolean
    // union once turned `true` into "true", silently breaking checkboxes.
    expect(stored?.answers).toEqual({
      'f-email': 'visitor@example.com',
      'f-agree': true,
    });
  });

  it('rejects an unchecked required checkbox', async () => {
    const response = await app.request(
      `/forms/${blockId}/submissions`,
      {
        method: 'POST',
        headers: {
          'x-forwarded-for': IP,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          answers: { 'f-email': 'visitor@example.com', 'f-agree': false },
          website: '',
        }),
      },
      env
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { fields: Record<string, string> };
    };
    expect(body.error.fields).toMatchObject({
      'f-agree': 'I agree is required',
    });
  });

  it('stores a checkbox answer as a real boolean, not the string "true"', async () => {
    // Fastify's AJV ran with coerceTypes, which turned booleans into strings
    // through a string|boolean union. Hono's TypeBox validator does not
    // coerce. This pins the corrected behaviour so it cannot silently
    // regress.
    const response = await app.request(
      `/forms/${blockId}/submissions`,
      {
        method: 'POST',
        headers: {
          'x-forwarded-for': '198.51.100.99',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          answers: { 'f-email': 'bool@example.com', 'f-agree': true },
          website: '',
        }),
      },
      env
    );

    expect(response.status).toBe(200);

    const stored = await db.query.formSubmission.findFirst({
      where: (s, { eq }) => eq(s.pageId, pageId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    expect((stored?.answers as Record<string, unknown>)['f-agree']).toBe(true);
  });
});
