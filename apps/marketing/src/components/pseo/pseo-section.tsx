import { MarketingContainer } from '@/components/marketing-container';
import { cn } from '@trylinky/ui';
import type { ReactNode } from 'react';

type Tone = 'white' | 'cream' | 'beige';

const toneClasses: Record<Tone, string> = {
  white: 'bg-white',
  cream: 'bg-[#FBFAF7]',
  beige: 'bg-[#F4F0E7]',
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
    <section className={cn('py-20 md:py-28', toneClasses[tone], className)}>
      <MarketingContainer>{children}</MarketingContainer>
    </section>
  );
}

export function PseoEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-[#E8553F]">
      <span className="inline-block size-1.5 rounded-full bg-[#E8553F]" />
      {children}
    </p>
  );
}

export function PseoSectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
      {children}
    </h2>
  );
}
