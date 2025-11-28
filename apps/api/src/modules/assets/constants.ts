export type AssetContexts = 'pageBackgroundImage' | 'blockAsset';

export const assetContexts: Record<
  AssetContexts,
  {
    keyPrefix: string;
    quality: number;
    resize: {
      width: number;
      height: number;
    };
  }
> = {
  pageBackgroundImage: {
    keyPrefix: 'pg-bg',
    quality: 100,
    resize: {
      width: 1200,
      height: 800,
    },
  },
  blockAsset: {
    keyPrefix: 'block',
    quality: 80,
    resize: {
      width: 800,
      height: 800,
    },
  },
};
