import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { LinkBoxServerUI } from '@/lib/blocks/link-box/ui-server';
import { LinkBoxBlockConfig } from '@trylinky/blocks';
import { cn } from '@trylinky/ui';
import { Suspense } from 'react';

export function LinkBox(props: BlockProps & LinkBoxBlockConfig) {
  const { icon, title, label, showPreview, link } = props;

  return (
    <CoreBlock
      {...props}
      className={cn('items-center flex group', showPreview && 'p-0')}
      href={link ?? ''}
    >
      <Suspense>
        <LinkBoxServerUI
          iconSrc={icon?.src}
          title={title}
          label={label}
          showPreview={showPreview}
          link={link}
        />
      </Suspense>
    </CoreBlock>
  );
}
