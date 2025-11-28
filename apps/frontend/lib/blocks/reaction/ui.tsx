'use client';

import { CoreBlock } from '@/app/components/CoreBlock';
import { BlockProps } from '@/lib/blocks/ui';
import NumberFlow from '@number-flow/react';
import { InternalApi, internalApiFetcher } from '@trylinky/common';
import { motion } from 'framer-motion';
import { FunctionComponent, useEffect, useState, useRef } from 'react';
import useSWR from 'swr';

const Icon = () => {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="none"
      className="fill-sys-label-primary"
      width={40}
      height={40}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
};

export const Reactions: FunctionComponent<BlockProps> = (props) => {
  const { pageId, isEditable } = props;

  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const [displayCount, setDisplayCount] = useState(0); // Track whether we're waiting for an API response
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pendingClicks, setPendingClicks] = useState(0);

  const pendingClicksRef = useRef(0);

  const { data, mutate } = useSWR<{
    current: {
      [reactionType: string]: number;
    };
    total: {
      [reactionType: string]: number;
    };
  }>(`/reactions?pageId=${pageId}`, internalApiFetcher);

  useEffect(() => {
    pendingClicksRef.current = pendingClicks;
  }, [pendingClicks]);

  useEffect(() => {
    if (data?.total?.love !== undefined && !isSubmitting) {
      setDisplayCount(data.total.love);
    }
  }, [data?.total?.love, isSubmitting]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleClick = () => {
    if (isEditable) {
      return;
    }

    // Don't allow more than 16 reactions
    if (displayCount >= 16) {
      return;
    }

    setDisplayCount((prev) => prev + 1);

    setPendingClicks((prev) => {
      const newValue = prev + 1;
      pendingClicksRef.current = newValue; // Update ref immediately
      return newValue;
    });
    setIsAnimating(true);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(async () => {
      try {
        setIsSubmitting(true);

        const incrementAmount = pendingClicksRef.current;

        if (incrementAmount <= 0) {
          setIsSubmitting(false);
          setPendingClicks(0);
          pendingClicksRef.current = 0;
          return;
        }

        const response = await InternalApi.post('/reactions', {
          pageId,
          increment: incrementAmount,
        });

        if (response.error) {
          throw new Error(response.error);
        }

        setPendingClicks(0);
        pendingClicksRef.current = 0;

        // Update data from server
        await mutate(response.data);

        setIsSubmitting(false);
      } catch (error) {
        console.error('Error liking resource:', error);

        if (data?.total?.love !== undefined) {
          setDisplayCount(data.total.love);
        }
        setPendingClicks(0);
        pendingClicksRef.current = 0;
        setIsSubmitting(false);
      }
    }, 1600);

    setDebounceTimer(newTimer);
  };

  return (
    <CoreBlock className="relative !p-0 overflow-hidden" {...props}>
      <button
        onClick={!isEditable ? handleClick : undefined}
        className="flex items-center justify-between gap-2 py-4 px-4 group relative w-full h-full bg-sys-background-primary"
      >
        <div className="flex flex-col text-left gap-1 z-10">
          <span className="uppercase font-bold text-xs tracking-wider text-sys-label-primary">
            Love
          </span>
          <NumberFlow
            value={displayCount}
            className="text-4xl font-medium text-sys-label-primary"
          />
        </div>
        <div className="mr-8 flex justify-center z-10">
          <Icon />
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
                fill="#FF6096"
                d="m0 128 26.7-5.3c26.6-5.7 80.3-15.7 133.3 0 53.3 16.3 107 58.3 160 74.6 53.3 15.7 107 5.7 160 0 53.3-5.3 107-5.3 160 10.7 53.3 16 107 48 160 48 53.3 0 107-32 160-74.7 53.3-42.3 107-96.3 160-90.6 53.3 5.3 107 69.3 160 80 53.3 10.3 107-31.7 133-53.4l27-21.3v224H0Z"
              />
            </svg>
            <div className="w-full h-full bg-gradient-to-b from-[#FF6096] to-[#FF2A76]" />
          </motion.div>
        </div>
      </button>
    </CoreBlock>
  );
};
