import { BlockProps } from '../ui';
import { HeaderServerUI } from './ui-server';
import { CoreBlock } from '@/components/CoreBlock';
import { HeaderBlockConfig } from '@trylinky/blocks';
import { cn } from '@trylinky/ui';
import Image from 'next/image';
import { FunctionComponent, Suspense } from 'react';

export const Header: FunctionComponent<BlockProps & HeaderBlockConfig> = ({
  title,
  description,
  avatar,
  showVerifiedBadge,
  verifiedPageTitle,
  alignment = 'left',
  ...otherProps
}) => {
  return (
    <CoreBlock {...otherProps} isFrameless>
      <header
        className={cn(
          'py-4 flex flex-col',
          alignment === 'center' && 'items-center text-center text-pretty',
          alignment === 'right' && 'items-end'
        )}
      >
        {avatar?.src && (
          <Image
            src={avatar.src}
            alt="Profile avatar"
            width={80}
            height={80}
            className="mb-6 rounded-lg"
          />
        )}
        <h1 className="font-bold text-4xl mb-1 text-sys-title-primary">
          {showVerifiedBadge ? (
            <Suspense>
              <HeaderServerUI
                pageId={otherProps.pageId}
                verifiedPageTitle={verifiedPageTitle}
                title={title}
              />
            </Suspense>
          ) : (
            title
          )}
        </h1>
        <p className="text-2xl text-sys-title-secondary">{description}</p>
      </header>
    </CoreBlock>
  );
};
