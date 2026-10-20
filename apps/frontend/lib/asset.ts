export type AssetContexts = 'pageBackgroundImage' | 'blockAsset';

/**
 * The size the API crops and resizes each kind of upload to. Mirrors
 * `assetContexts` in apps/api/src/modules/assets/constants.ts.
 */
export const assetOutputSizes: Record<
  AssetContexts,
  { width: number; height: number }
> = {
  pageBackgroundImage: { width: 1200, height: 800 },
  blockAsset: { width: 800, height: 800 },
};
