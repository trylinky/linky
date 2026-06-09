'use client';

import { CoreBlock } from '@/app/components/CoreBlock';
import { BlockProps } from '@/lib/blocks/ui';
import {
  FaceSmileIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  HeartIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/solid';
import NumberFlow from '@number-flow/react';
import {
  ReactionBlockConfig,
  ReactionType,
  defaultReactionType,
} from '@trylinky/blocks';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { motion } from 'framer-motion';
import { ComponentType, FunctionComponent, useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

export const reactionMeta: Record<
  ReactionType,
  {
    label: string;
    icon: ComponentType<{ className?: string; width?: number; height?: number }>;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  love: {
    label: 'Love',
    icon: HeartIcon,
    gradientFrom: '#FF6096',
    gradientTo: '#FF2A76',
  },
  'thumbs-up': {
    label: 'Thumbs up',
    icon: HandThumbUpIcon,
    gradientFrom: '#4ADE80',
    gradientTo: '#22C55E',
  },
  'thumbs-down': {
    label: 'Thumbs down',
    icon: HandThumbDownIcon,
    gradientFrom: '#F97316',
    gradientTo: '#EF4444',
  },
  smiley: {
    label: 'Smile',
    icon: FaceSmileIcon,
    gradientFrom: '#FBBF24',
    gradientTo: '#F59E0B',
  },
  rocket: {
    label: 'Rocket',
    icon: RocketLaunchIcon,
    gradientFrom: '#A78BFA',
    gradientTo: '#8B5CF6',
  },
};

export const Reactions: FunctionComponent<BlockProps> = (props) => {
  const { blockId, pageId, isEditable } = props;

  const [displayCount, setDisplayCount] = useState(0);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingClicksRef = useRef(0);
  const isSubmittingRef = useRef(false);

  const { data: blockInfo } = useSWR<{ blockData: ReactionBlockConfig }>(
    `/blocks/${blockId}`,
    internalApiFetcher
  );

  // Blocks saved before reactions were configurable have no reactionType
  const reactionType: ReactionType =
    blockInfo?.blockData?.reactionType ?? defaultReactionType;
  const meta = reactionMeta[reactionType] ?? reactionMeta[defaultReactionType];
  const ReactionIcon = meta.icon;
  const label = blockInfo?.blockData?.label?.trim() || meta.label;

  const { data, mutate } = useSWR<{
    current: { [reactionType: string]: number };
    total: { [reactionType: string]: number };
  }>(pageId ? `/reactions?pageId=${pageId}` : null, internalApiFetcher);

  const serverCount = data?.total?.[reactionType];

  useEffect(() => {
    if (serverCount !== undefined && !isSubmittingRef.current) {
      setDisplayCount(serverCount);
    }
  }, [serverCount]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (isEditable) return;
    if (displayCount >= 16) return;

    setDisplayCount((prev) => prev + 1);
    pendingClicksRef.current += 1;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const incrementAmount = pendingClicksRef.current;
      if (incrementAmount <= 0) return;

      isSubmittingRef.current = true;
      try {
        const response = await InternalApi.post('/reactions', {
          pageId,
          increment: incrementAmount,
          reactionType,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        pendingClicksRef.current = 0;
        await mutate(response.data, { revalidate: false });
      } catch (error) {
        console.error('Error reacting to resource:', error);
        pendingClicksRef.current = 0;
        if (data?.total?.[reactionType] !== undefined) {
          setDisplayCount(data.total[reactionType]);
        }
      } finally {
        isSubmittingRef.current = false;
      }
    }, 1600);
  };

  return (
    <CoreBlock className="relative p-0! overflow-hidden" {...props}>
      <button
        onClick={!isEditable ? handleClick : undefined}
        className="flex items-center justify-between gap-2 py-4 px-4 group relative w-full h-full bg-sys-background-primary"
      >
        <div className="flex flex-col text-left gap-1 z-10">
          <span className="uppercase font-bold text-xs tracking-wider text-sys-label-primary">
            {label}
          </span>
          <NumberFlow
            value={displayCount}
            className="text-4xl font-medium text-sys-label-primary"
          />
        </div>
        <div className="mr-8 flex justify-center z-10">
          <ReactionIcon className="fill-sys-label-primary" width={40} height={40} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-full">
          <motion.div
            className="absolute bottom-0 left-0 right-0 w-full"
            initial={{ height: 0 }}
            animate={{
              height: displayCount
                ? `calc(${Math.min((displayCount / 16) * 100, 100)}% + 32px)`
                : '32px',
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <svg
              width="100%"
              height={32}
              preserveAspectRatio="none"
              viewBox="0 0 1440 320"
            >
              <path
                fill={meta.gradientFrom}
                d="m0 128 26.7-5.3c26.6-5.7 80.3-15.7 133.3 0 53.3 16.3 107 58.3 160 74.6 53.3 15.7 107 5.7 160 0 53.3-5.3 107-5.3 160 10.7 53.3 16 107 48 160 48 53.3 0 107-32 160-74.7 53.3-42.3 107-96.3 160-90.6 53.3 5.3 107 69.3 160 80 53.3 10.3 107-31.7 133-53.4l27-21.3v224H0Z"
              />
            </svg>
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(to bottom, ${meta.gradientFrom}, ${meta.gradientTo})`,
              }}
            />
          </motion.div>
        </div>
      </button>
    </CoreBlock>
  );
};
