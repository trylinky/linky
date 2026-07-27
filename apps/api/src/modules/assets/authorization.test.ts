import { beforeEach, describe, expect, it, vi } from 'vitest';

const checkUserHasAccessToBlock = vi.fn();
const checkUserHasAccessToPage = vi.fn();
const themeCount = vi.fn();

vi.mock('@/modules/blocks/service', () => ({
  checkUserHasAccessToBlock: (...args: unknown[]) =>
    checkUserHasAccessToBlock(...args),
}));

vi.mock('@/modules/pages/service', () => ({
  checkUserHasAccessToPage: (...args: unknown[]) =>
    checkUserHasAccessToPage(...args),
}));

vi.mock('@/lib/prisma', () => ({
  default: { theme: { count: (...args: unknown[]) => themeCount(...args) } },
}));

const { NEW_THEME_REFERENCE_ID, canUploadAsset } =
  await import('./authorization');

const USER_ID = 'user-1';
const ORG_ID = 'org-1';

describe('canUploadAsset', () => {
  beforeEach(() => {
    checkUserHasAccessToBlock.mockReset().mockResolvedValue(false);
    checkUserHasAccessToPage.mockReset().mockResolvedValue(false);
    themeCount.mockReset().mockResolvedValue(0);
  });

  it('allows a block asset for a block the user can reach', async () => {
    checkUserHasAccessToBlock.mockResolvedValue(true);

    await expect(
      canUploadAsset({
        context: 'blockAsset',
        referenceId: 'block-1',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it("refuses a block asset for someone else's block", async () => {
    // The whole point of the check: referenceId picks the S3 prefix, so an
    // unchecked value let any authenticated user write into another user's.
    await expect(
      canUploadAsset({
        context: 'blockAsset',
        referenceId: 'someone-elses-block',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(false);
  });

  it('allows a page background for a page the user can reach', async () => {
    checkUserHasAccessToPage.mockResolvedValue(true);

    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: 'page-1',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it("allows a theme background for the caller's own organization", async () => {
    themeCount.mockResolvedValue(1);

    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: 'theme-1',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);

    expect(themeCount).toHaveBeenCalledWith({
      where: { id: 'theme-1', organizationId: ORG_ID },
    });
  });

  it('refuses a theme belonging to another organization', async () => {
    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: 'theme-from-another-org',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(false);
  });

  it('still allows the new-theme sentinel, which has no entity yet', async () => {
    // Regression guard: the theme create form picks a background before the
    // theme exists, so this must keep working.
    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: NEW_THEME_REFERENCE_ID,
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it('refuses an unknown context', async () => {
    await expect(
      canUploadAsset({
        context: 'somethingElse' as 'blockAsset',
        referenceId: 'block-1',
        userId: USER_ID,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(false);
  });
});
