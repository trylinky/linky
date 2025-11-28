'use client';

import { BlockProps } from '../ui';
import { CoreBlock } from '@/components/CoreBlock';
import { StackBlockConfig } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import { FunctionComponent } from 'react';
import useSWR from 'swr';

export const Stack: FunctionComponent<BlockProps> = (props) => {
  const { data } = useSWR<{ blockData: StackBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );

  const { blockData } = data || {};

  if (!blockData) return null;

  return (
    <CoreBlock {...props}>
      <h2 className="text-2xl font-medium text-sys-label-primary">
        {blockData?.title}
      </h2>
      <p className="text-md text-sys-label-secondary">{blockData?.label}</p>

      <div className="flex flex-col gap-6 mt-6">
        {blockData?.items?.map((item) => {
          const Component = item.link && !props.isEditable ? 'a' : 'div';
          return (
            <Component
              key={item.title}
              href={item.link ?? undefined}
              target={item.link ? '_blank' : undefined}
              rel={item.link ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon.src}
                alt=""
                className="w-10 h-10 rounded-md"
              />
              <div className="flex flex-col">
                <h3 className="font-medium text-sys-label-primary text-lg mb-0">
                  {item.title}
                </h3>
                <p className="text-sys-label-secondary -mt-1">{item.label}</p>
              </div>
            </Component>
          );
        })}
      </div>
    </CoreBlock>
  );
};
