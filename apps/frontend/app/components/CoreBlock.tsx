'use client';

import { EditBlockToolbar } from './EditBlockToolbar';
import { BlockProps } from '@/lib/blocks/ui';
import { cn } from '@trylinky/ui';
import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props extends BlockProps {
  className?: string;
  children: ReactNode;
  isFrameless?: boolean;
  href?: string;
}

export function CoreBlock({
  blockId,
  blockType,
  isEditable,
  className,
  children,
  isFrameless,
  href,
}: Props) {
  const classes = cn(
    'h-full overflow-hidden relative max-w-[624px]',
    !isFrameless &&
      'bg-sys-bg-primary border-sys-bg-border border p-6 rounded-3xl shadow-md ',
    className
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const isClipped = useContentClipping(rootRef, isEditable);

  const content = (
    <>
      {children}
      {isEditable && blockType !== 'default' && (
        <EditBlockToolbar blockId={blockId} blockType={blockType} />
      )}
      {isEditable && isClipped && (
        <span className="pointer-events-none absolute right-2 bottom-2 z-10 rounded-md bg-zinc-950/70 px-1.5 py-0.5 text-xs font-medium text-white">
          Content clipped
        </span>
      )}
    </>
  );

  if (href && !isEditable) {
    return (
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
      >
        {content}
      </Link>
    );
  }

  return (
    <div ref={rootRef} className={classes}>
      {content}
    </div>
  );
}

// Watches the block's box in edit mode and reports whether its content
// overflows the clipped bounds (so the editor can flag hidden content).
function useContentClipping(
  ref: React.RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  const [isClipped, setIsClipped] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      // +1 tolerance: fractional layout sizes cause off-by-one scrollHeight.
      setIsClipped(
        element.scrollHeight > element.clientHeight + 1 ||
          element.scrollWidth > element.clientWidth + 1
      );
    };

    measure();

    const resizeObserver = new ResizeObserver(measure);
    const observeChildren = () => {
      // Content can resize without the box resizing (e.g. async data) — watch
      // the children too. Re-observing an element is a no-op, so this is safe
      // to call again whenever the child list changes.
      for (const child of Array.from(element.children)) {
        resizeObserver.observe(child);
      }
    };

    resizeObserver.observe(element);
    observeChildren();

    // Children mounted after first paint (SWR-fetched block content) would
    // otherwise go unobserved until the box itself resizes.
    const mutationObserver = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    mutationObserver.observe(element, { childList: true, subtree: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [ref, enabled]);

  return isClipped;
}
