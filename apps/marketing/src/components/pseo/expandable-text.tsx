'use client';

import { cn } from '@trylinky/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Renders a paragraph clamped to a few lines with a "Read more" disclosure.
 * The full text stays in the DOM (good for SEO); only the display is collapsed.
 */
export function ExpandableText({
  children,
  className,
  accentClass = 'text-zinc-900',
  clampClass = 'line-clamp-3',
}: {
  children: string;
  className?: string;
  accentClass?: string;
  clampClass?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 4);
  }, []);

  return (
    <div>
      <p
        ref={ref}
        className={cn(className, !expanded && clampClass)}
      >
        {children}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'mt-3 text-sm font-medium underline-offset-4 transition hover:underline',
            accentClass
          )}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
