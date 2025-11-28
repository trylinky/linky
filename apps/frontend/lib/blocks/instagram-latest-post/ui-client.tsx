import { BlockProps } from '../ui';
import { InstagramLatestPostServerUI, InstagramLogo } from './ui-server';
import { CoreBlock } from '@/components/CoreBlock';
import { InstagramLatestPostBlockConfig } from '@trylinky/blocks';
import { Skeleton } from '@trylinky/ui';
import { FunctionComponent, Suspense } from 'react';

export const InstagramLatestPost: FunctionComponent<
  BlockProps & InstagramLatestPostBlockConfig
> = ({ blockId, numberOfPosts, ...otherProps }) => {
  return (
    <CoreBlock blockId={blockId} {...otherProps} className="!p-0">
      <Suspense fallback={<LoadingState />}>
        <InstagramLatestPostServerUI
          blockId={blockId}
          numberOfPosts={numberOfPosts}
        />
      </Suspense>
    </CoreBlock>
  );
};

export const LoadingState = () => {
  return (
    <div className="absolute h-32 w-full bottom-0 z-10 px-6 py-6 flex flex-row justify-between items-end">
      <span className="flex flex-col gap-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </span>

      <InstagramLogo stroke="#000" />
    </div>
  );
};

export default InstagramLatestPost;
