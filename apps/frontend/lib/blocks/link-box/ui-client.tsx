import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { LinkBoxServerUI } from '@/lib/blocks/link-box/ui-server';
import { LinkBoxBlockConfig } from '@trylinky/blocks';
import { cn } from '@trylinky/ui';
import Link from 'next/link';
import { Suspense } from 'react';

export function LinkBox(props: BlockProps & LinkBoxBlockConfig) {
  const { icon, title, label, showPreview, link } = props;

  return (
    <CoreBlock
      {...props}
      className={cn('items-center flex group', showPreview && 'p-0')}
      component={props.isEditable ? 'div' : Link}
      linkProps={
        props.isEditable
          ? {}
          : {
              href: link ?? '',
              target: '_blank',
              rel: 'noopener noreferrer',
            }
      }
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
