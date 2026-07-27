import { beforeEach, describe, expect, it, vi } from 'vitest';

// DynamoDB is the only external dependency here; stub it at the client
// boundary so the allowance logic can be tested directly.
const send = vi.fn();

vi.mock('@aws-sdk/lib-dynamodb', async () => {
  const actual = await vi.importActual<typeof import('@aws-sdk/lib-dynamodb')>(
    '@aws-sdk/lib-dynamodb'
  );

  return {
    ...actual,
    DynamoDBDocumentClient: { from: () => ({ send }) },
  };
});

const { MAX_ALLOWED_REACTIONS_PER_IP, reactToResource } =
  await import('./service');

const PAGE_ID = 'page-1';
const IP = '198.51.100.21';
const TABLE = process.env.REACTIONS_TABLE_NAME as string;

/** Makes the next BatchGet resolve to the given per-IP / total counts. */
function stubExistingReactions({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  send.mockReset();
  send.mockImplementation((command: { constructor: { name: string } }) => {
    if (command.constructor.name === 'BatchGetCommand') {
      return Promise.resolve({
        Responses: {
          [TABLE]: [
            { SK: 'totals', reactionTotals: { love: total } },
            { SK: `entries#${IP}`, reactions: { love: current } },
          ],
        },
      });
    }

    return Promise.resolve({});
  });
}

/** The increment actually written, read back off the UpdateCommand calls. */
function writtenIncrement(): number | undefined {
  const update = send.mock.calls
    .map(([command]) => command as any)
    .find(
      (command) => command?.input?.ExpressionAttributeValues?.[':increment']
    );

  return update?.input?.ExpressionAttributeValues?.[':increment'];
}

describe('reactToResource', () => {
  beforeEach(() => {
    send.mockReset();
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
    send.mockImplementation(() => Promise.resolve({}));

    const result = await reactToResource(PAGE_ID, 1, IP, 'love');

    expect(result.current.love).toBe(1);
    expect(result.total.love).toBe(1);
  });
});
