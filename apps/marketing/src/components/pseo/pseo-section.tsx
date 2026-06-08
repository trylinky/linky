import { MarketingContainer } from '@/components/marketing-container';
import { cn } from '@trylinky/ui';
import type { ReactNode } from 'react';

type Tone = 'white' | 'cream' | 'beige';

const toneClasses: Record<Tone, string> = {
  white: 'bg-white',
  cream: 'bg-[#f8f7f3]',
  beige: 'bg-[#f5f3ea]',
};

export function PseoBand({
  tone = 'white',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn('py-16 md:py-24', toneClasses[tone], className)}>
      <MarketingContainer>{children}</MarketingContainer>
    </section>
  );
}

export function PseoEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </p>
  );
}

export function PseoSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
      {children}
    </h2>
  );
}
