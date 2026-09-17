import {
  cleanupTestData,
  createTestOrganization,
  createTestTheme,
  createTestUser,
} from '@/test/fixtures';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const checkUserHasAccessToBlock = vi.fn();
const checkUserHasAccessToPage = vi.fn();

vi.mock('@/modules/blocks/service', () => ({
  checkUserHasAccessToBlock: (...args: unknown[]) =>
    checkUserHasAccessToBlock(...args),
}));

vi.mock('@/modules/pages/service', () => ({
  checkUserHasAccessToPage: (...args: unknown[]) =>
    checkUserHasAccessToPage(...args),
}));

const { NEW_THEME_REFERENCE_ID, canUploadAsset } =
  await import('./authorization');

const suffix = randomUUID().slice(0, 8);
let userId: string;
let ORG_ID: string;
let otherOrgId: string;
let ownThemeId: string;
let otherThemeId: string;

beforeAll(async () => {
  userId = (await createTestUser(`assets-${suffix}`)).id;
  ORG_ID = (
    await createTestOrganization({
      suffix: `assets-${suffix}`,
      ownerId: userId,
    })
  ).id;
  otherOrgId = (
    await createTestOrganization({ suffix: `assets-other-${suffix}` })
  ).id;
  ownThemeId = (
    await createTestTheme({ createdById: userId, organizationId: ORG_ID })
  ).id;
  otherThemeId = (
    await createTestTheme({ createdById: userId, organizationId: otherOrgId })
  ).id;
});

afterAll(async () => {
  await cleanupTestData({
    themeIds: [ownThemeId, otherThemeId],
    organizationIds: [ORG_ID, otherOrgId],
    userIds: [userId],
  });
});

describe('canUploadAsset', () => {
  beforeEach(() => {
    checkUserHasAccessToBlock.mockReset().mockResolvedValue(false);
    checkUserHasAccessToPage.mockReset().mockResolvedValue(false);
  });

  it('allows a block asset for a block the user can reach', async () => {
    checkUserHasAccessToBlock.mockResolvedValue(true);

    await expect(
      canUploadAsset({
        context: 'blockAsset',
        referenceId: 'block-1',
        userId,
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
        userId,
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
        userId,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it("allows a theme background for the caller's own organization", async () => {
    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: ownThemeId,
        userId,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it('refuses a theme belonging to another organization', async () => {
    await expect(
      canUploadAsset({
        context: 'pageBackgroundImage',
        referenceId: otherThemeId,
        userId,
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
        userId,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(true);
  });

  it('refuses an unknown context', async () => {
    await expect(
      canUploadAsset({
        context: 'somethingElse' as 'blockAsset',
        referenceId: 'block-1',
        userId,
        organizationId: ORG_ID,
      })
    ).resolves.toBe(false);
  });
});
