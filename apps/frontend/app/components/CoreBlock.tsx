'use client';

import { EditBlockToolbar } from './EditBlockToolbar';
import { BlockProps } from '@/lib/blocks/ui';
import { cn } from '@trylinky/ui';
import Link from 'next/link';
import { ReactNode } from 'react';

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

  const content = (
    <>
      {children}
      {isEditable && blockType !== 'default' && (
        <EditBlockToolbar blockId={blockId} blockType={blockType} />
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

  return <div className={classes}>{content}</div>;
}
