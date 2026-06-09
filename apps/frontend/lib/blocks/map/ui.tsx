'use client';

import { BlockProps } from '../ui';
import { Props as DynamicMapboxMapProps } from './ui-client';
import { CoreBlock } from '@/components/CoreBlock';
import { MapBlockConfig } from '@trylinky/blocks';
import { internalApiFetcher } from '@trylinky/common';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

// Dynamically import MapboxMap
const DynamicMapboxMap = dynamic<DynamicMapboxMapProps>(
  () =>
    import('./ui-client').then((mod) => ({
      default: mod.MapboxMap,
    })),
  { ssr: false }
);

// mapbox-gl is the single largest chunk we ship (~440KB gz). Only start
// loading it once the block is near the viewport so it never competes with
// initial page load and hydration.
function useIsNearViewport<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isNear) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isNear]);

  return { ref, isNear };
}

export function Map(props: BlockProps) {
  const { data } = useSWR<{ blockData: MapBlockConfig }>(
    `/blocks/${props.blockId}`,
    internalApiFetcher
  );
  const { ref, isNear } = useIsNearViewport<HTMLDivElement>();

  const { blockData } = data || {};

  if (!blockData?.coords) return null;

  return (
    <CoreBlock className="relative p-0! overflow-hidden" {...props}>
      <div ref={ref} className="absolute w-full h-full">
        {isNear && (
          <DynamicMapboxMap
            className="absolute w-full h-full object-cover"
            coords={blockData?.coords}
            mapTheme={blockData?.mapTheme}
          />
        )}
      </div>
    </CoreBlock>
  );
}
