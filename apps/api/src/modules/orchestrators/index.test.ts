import { createApp } from '@/app';
import db from '@/lib/db';
import { orchestration } from '@trylinky/db/schema';
import { eq, inArray } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

// Route-level tests for the orchestrator create/validate endpoints. These
// only cover create/validate — `/orchestrators/tiktok/create` calls out to
// TikTok and S3 and is intentionally not exercised here (see
// vitest.setup.ts, which makes any real `fetch` throw).

const INTERNAL_API_KEY = 'test-internal-api-key';

const env = {
  HYPERDRIVE: { connectionString: process.env.DATABASE_URL as string },
  AUTH_RATE_LIMIT: {
    limit: async () => ({ success: true }),
  },
} as unknown as Parameters<ReturnType<typeof createApp>['request']>[2];

let app: ReturnType<typeof createApp>;
const createdOrchestrationIds: string[] = [];

beforeAll(() => {
  app = createApp();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(async () => {
  if (createdOrchestrationIds.length) {
    await db
      .delete(orchestration)
      .where(inArray(orchestration.id, createdOrchestrationIds));
  }
});

describe('POST /orchestrators/create', () => {
  it('creates an orchestration expiring about 30 minutes out', async () => {
    vi.stubEnv('INTERNAL_API_KEY', INTERNAL_API_KEY);

    const before = Date.now();
    const response = await app.request(
      '/orchestrators/create',
      {
        method: 'POST',
        headers: {
          'x-api-key': INTERNAL_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ type: 'TIKTOK' }),
      },
      env
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string };
    expect(body.id).toBeTruthy();
    createdOrchestrationIds.push(body.id);

    const row = await db.query.orchestration.findFirst({
      where: (o, { eq }) => eq(o.id, body.id),
    });

    expect(row).toBeTruthy();
    expect(row?.type).toBe('TIKTOK');

    const expiresAtMs = row!.expiresAt.getTime();
    const expectedMs = before + 1000 * 60 * 30;
    // Allow a few seconds of slack for the test's own execution time.
    expect(Math.abs(expiresAtMs - expectedMs)).toBeLessThan(5000);
  });
});

describe('POST /orchestrators/validate', () => {
  it('returns valid: true for a fresh orchestration', async () => {
    vi.stubEnv('INTERNAL_API_KEY', INTERNAL_API_KEY);

    const [created] = await db
      .insert(orchestration)
      .values({
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        type: 'TIKTOK',
      })
      .returning({ id: orchestration.id });
    createdOrchestrationIds.push(created.id);

    const response = await app.request(
      '/orchestrators/validate',
      {
        method: 'POST',
        headers: {
          'x-api-key': INTERNAL_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ orchestrationId: created.id, type: 'TIKTOK' }),
      },
      env
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: true });
  });

  it('returns 400 for an expired orchestration', async () => {
    vi.stubEnv('INTERNAL_API_KEY', INTERNAL_API_KEY);

    const [created] = await db
      .insert(orchestration)
      .values({
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        type: 'TIKTOK',
      })
      .returning({ id: orchestration.id });
    createdOrchestrationIds.push(created.id);

    await db
      .update(orchestration)
      .set({ expiresAt: new Date(Date.now() - 1000 * 60) })
      .where(eq(orchestration.id, created.id));

    const response = await app.request(
      '/orchestrators/validate',
      {
        method: 'POST',
        headers: {
          'x-api-key': INTERNAL_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ orchestrationId: created.id, type: 'TIKTOK' }),
      },
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Orchestration not found',
    });
  });

  it('returns 400 for an orchestration that already generated a page', async () => {
    vi.stubEnv('INTERNAL_API_KEY', INTERNAL_API_KEY);

    const [created] = await db
      .insert(orchestration)
      .values({
        expiresAt: new Date(Date.now() + 1000 * 60 * 30),
        type: 'TIKTOK',
      })
      .returning({ id: orchestration.id });
    createdOrchestrationIds.push(created.id);

    await db
      .update(orchestration)
      .set({ pageGeneratedAt: new Date() })
      .where(eq(orchestration.id, created.id));

    const response = await app.request(
      '/orchestrators/validate',
      {
        method: 'POST',
        headers: {
          'x-api-key': INTERNAL_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ orchestrationId: created.id, type: 'TIKTOK' }),
      },
      env
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Orchestration not found',
    });
  });
});
