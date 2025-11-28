import { cn } from '@trylinky/ui';
import { ReactNode } from 'react';

export const MarketingContainer = (props: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <div className={cn('max-w-6xl mx-auto px-4', props.className)}>
      {props.children}
    </div>
  );
};
