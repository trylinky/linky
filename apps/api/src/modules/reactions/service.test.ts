import { beforeEach, describe, expect, it, vi } from 'vitest';

// DynamoDB is the only external dependency here; stub it at the client
// boundary (the aws4fetch-backed dynamo module) so the allowance logic can
// be tested directly, without ever touching the network.
const batchGetItem = vi.fn();
const updateItem = vi.fn();

vi.mock('./dynamo', () => ({
  batchGetItem: (...args: unknown[]) => batchGetItem(...args),
  updateItem: (...args: unknown[]) => updateItem(...args),
}));

const { MAX_ALLOWED_REACTIONS_PER_IP, reactToResource } =
  await import('./service');

const PAGE_ID = 'page-1';
const IP = '198.51.100.21';

/** Makes the next batchGetItem resolve to the given per-IP / total counts. */
function stubExistingReactions({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  batchGetItem.mockReset();
  updateItem.mockReset();
  batchGetItem.mockResolvedValue([
    { SK: 'totals', reactionTotals: { love: total } },
    { SK: `entries#${IP}`, reactions: { love: current } },
  ]);
  updateItem.mockResolvedValue(undefined);
}

/** The increment actually written, read back off the updateItem calls. */
function writtenIncrement(): number | undefined {
  const call = updateItem.mock.calls.find(
    ([args]) =>
      (args as { expressionAttributeValues?: Record<string, unknown> })
        ?.expressionAttributeValues?.[':increment'] !== undefined
  );

  return (call?.[0] as { expressionAttributeValues?: Record<string, number> })
    ?.expressionAttributeValues?.[':increment'];
}

describe('reactToResource', () => {
  beforeEach(() => {
    batchGetItem.mockReset();
    updateItem.mockReset();
    // ./dynamo is mocked above, so nothing here should ever hit the network.
    // The global fetch tripwire in vitest.setup.ts fails loudly instead of
    // silently making a real DynamoDB call against production data if that
    // mock is ever bypassed.
  });

  it('applies a normal debounced click batch as-is', async () => {
    stubExistingReactions({ current: 2, total: 40 });

    const result = await reactToResource(PAGE_ID, 3, IP, 'love');

    expect(writtenIncrement()).toBe(3);
    expect(result.current.love).toBe(5);
    expect(result.total.love).toBe(43);
  });

  it('clamps an oversized increment to the remaining allowance', async () => {
    // Previously the cap was only checked before applying, so a single
    // request could add an arbitrary amount to a public counter.
    stubExistingReactions({ current: 14, total: 100 });

    const result = await reactToResource(PAGE_ID, 1_000_000, IP, 'love');

    expect(writtenIncrement()).toBe(MAX_ALLOWED_REACTIONS_PER_IP - 14);
    expect(result.current.love).toBe(MAX_ALLOWED_REACTIONS_PER_IP);
    expect(result.total.love).toBe(102);
  });

  it('writes nothing once the allowance is used up', async () => {
    stubExistingReactions({
      current: MAX_ALLOWED_REACTIONS_PER_IP,
      total: 100,
    });

    const result = await reactToResource(PAGE_ID, 5, IP, 'love');

    expect(writtenIncrement()).toBeUndefined();
    expect(result.current.love).toBe(MAX_ALLOWED_REACTIONS_PER_IP);
    expect(result.total.love).toBe(100);
  });

  it('reports zeroed counts rather than undefined for a first reaction', async () => {
    batchGetItem.mockReset();
    updateItem.mockReset();
    batchGetItem.mockResolvedValue([]);
    updateItem.mockResolvedValue(undefined);

    const result = await reactToResource(PAGE_ID, 1, IP, 'love');

    expect(result.current.love).toBe(1);
    expect(result.total.love).toBe(1);
  });
});
