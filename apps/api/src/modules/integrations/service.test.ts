import { beforeEach, describe, expect, it, vi } from 'vitest';

const findFirst = vi.fn();
const update = vi.fn();

vi.mock('@/lib/prisma', () => ({
  default: {
    block: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock('@/lib/revalidate', () => ({
  blockCacheTag: (id: string) => `block-${id}`,
  pageIdCacheTag: (id: string) => `page-id-${id}`,
  revalidatePageCache: vi.fn(),
}));

const { linkIntegrationToBlock } = await import('./service');

const USER_ID = 'user-1';

describe('linkIntegrationToBlock', () => {
  beforeEach(() => {
    findFirst.mockReset();
    update.mockReset();
  });

  it('links the integration to a block the user can reach', async () => {
    findFirst.mockResolvedValue({ id: 'block-1', pageId: 'page-1' });

    await expect(
      linkIntegrationToBlock({
        blockId: 'block-1',
        integrationId: 'integration-1',
        userId: USER_ID,
      })
    ).resolves.toBe(true);

    expect(update).toHaveBeenCalledWith({
      where: { id: 'block-1' },
      data: { integrationId: 'integration-1' },
    });
  });

  it('scopes the lookup to blocks the user is a member of', async () => {
    findFirst.mockResolvedValue({ id: 'block-1', pageId: 'page-1' });

    await linkIntegrationToBlock({
      blockId: 'block-1',
      integrationId: 'integration-1',
      userId: USER_ID,
    });

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'block-1',
          page: {
            organization: { members: { some: { userId: USER_ID } } },
          },
        },
      })
    );
  });

  it('writes nothing when the block belongs to someone else', async () => {
    // The blockId reaches this function from an OAuth `state` value that
    // originated in a caller-supplied query string, and block ids are public.
    // An unscoped update here let any signed-in user attach their own
    // integration to another user's block.
    findFirst.mockResolvedValue(null);

    await expect(
      linkIntegrationToBlock({
        blockId: 'someone-elses-block',
        integrationId: 'integration-1',
        userId: USER_ID,
      })
    ).resolves.toBe(false);

    expect(update).not.toHaveBeenCalled();
  });
});
