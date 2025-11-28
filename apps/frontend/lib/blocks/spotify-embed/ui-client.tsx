import { BlockProps } from '../ui';
import { SpotifyEmbedServerUI, SpotifyLogo } from './ui-server';
import { CoreBlock } from '@/components/CoreBlock';
import { SpotifyEmbedBlockConfig } from '@trylinky/blocks';
import { Skeleton } from '@trylinky/ui';
import { FunctionComponent, Suspense } from 'react';

export const SpotifyEmbed: FunctionComponent<
  BlockProps & SpotifyEmbedBlockConfig
> = ({ spotifyAssetUrl, pageId, isEditable, ...otherProps }) => {
  return (
    <CoreBlock
      pageId={pageId}
      isEditable={isEditable}
      isFrameless
      {...otherProps}
    >
      <Suspense fallback={<LoadingState />}>
        <SpotifyEmbedServerUI
          spotifyAssetUrl={spotifyAssetUrl}
          isEditable={isEditable}
        />
      </Suspense>
    </CoreBlock>
  );
};

export const LoadingState = () => {
  return (
    <div className="flex gap-3 px-4 py-4">
      <SpotifyLogo />
      <Skeleton className="w-24 h-24 rounded-xl bg-white/10" />

      <div className="flex flex-col justify-center gap-3">
        <Skeleton className="h-4 w-[250px] bg-white/10" />
        <Skeleton className="h-3 w-[200px] bg-white/10" />
      </div>
    </div>
  );
};

export default SpotifyEmbed;
