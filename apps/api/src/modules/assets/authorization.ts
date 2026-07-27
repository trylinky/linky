import prisma from '@/lib/prisma';
import { AssetContexts } from '@/modules/assets/constants';
import { checkUserHasAccessToBlock } from '@/modules/blocks/service';
import { checkUserHasAccessToPage } from '@/modules/pages/service';

/**
 * A theme's background can be chosen before the theme exists, so the create
 * form has no id to reference yet and sends this sentinel instead. It only
 * selects the S3 key prefix; uploaded objects still get a random UUID
 * filename, so there is nothing to collide with or overwrite.
 */
export const NEW_THEME_REFERENCE_ID = 'new-theme';

/**
 * `referenceId` decides which S3 prefix an upload lands in, and it comes
 * straight from the client. Without this check any authenticated user could
 * write objects into another user's prefix.
 *
 * What the id refers to depends on the context:
 *  - blockAsset          -> a block id
 *  - pageBackgroundImage -> a page id, a theme id, or the new-theme sentinel
 */
export async function canUploadAsset({
  context,
  referenceId,
  userId,
  organizationId,
}: {
  context: AssetContexts;
  referenceId: string;
  userId: string;
  organizationId: string;
}): Promise<boolean> {
  switch (context) {
    case 'blockAsset':
      return checkUserHasAccessToBlock(referenceId, userId);

    case 'pageBackgroundImage': {
      if (referenceId === NEW_THEME_REFERENCE_ID) {
        return true;
      }

      if (await checkUserHasAccessToPage(referenceId, userId)) {
        return true;
      }

      if (!organizationId) {
        return false;
      }

      // Themes owned by the caller's organization. Default themes are shared
      // and belong to no organization, so they are excluded by this filter.
      const themeCount = await prisma.theme.count({
        where: {
          id: referenceId,
          organizationId,
        },
      });

      return themeCount > 0;
    }

    default:
      return false;
  }
}
