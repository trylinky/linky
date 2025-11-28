'use client';

import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { LinkBarBlockConfig } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import Link from 'next/link';
import useSWR from 'swr';

export function LinkBar(props: BlockProps) {
  const { data } = useSWR<{ blockData: LinkBarBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );

  const { blockData } = data || {};

  return (
    <CoreBlock {...props} isFrameless className="items-center flex">
      <div className="flex flex-row gap-4 items-center justify-center w-full">
        {blockData?.links.map((link) => {
          return (
            <Link key={link.link} href={link.link}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link?.icon?.src}
                className="w-10 h-10 rounded-md"
                alt=""
              />
            </Link>
          );
        })}
      </div>
    </CoreBlock>
  );
}
