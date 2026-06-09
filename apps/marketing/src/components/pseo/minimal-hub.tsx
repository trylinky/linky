import { MarketingContainer } from '@/components/marketing-container';
import { Button } from '@trylinky/ui';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function HubConfetti() {
  const shapes = [
    { c: '#07B151', t: '34%', l: '4%', s: 12, r: false },
    { c: '#FBB40F', t: '64%', l: '10%', s: 10, r: true },
    { c: '#2357BC', t: '26%', l: '66%', s: 9, r: false },
    { c: '#E8553F', t: '54%', l: '90%', s: 12, r: false },
    { c: '#733B97', t: '74%', l: '72%', s: 10, r: true },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0">
      {shapes.map((sh, i) => (
        <span
          key={i}
          className={sh.r ? 'absolute rounded-[4px]' : 'absolute rounded-full'}
          style={{
            top: sh.t,
            left: sh.l,
            width: sh.s,
            height: sh.s,
            backgroundColor: sh.c,
            transform: sh.r ? 'rotate(20deg)' : undefined,
          }}
        />
      ))}
    </div>
  );
}

export function MinimalHubHero({
  eyebrow,
  h1,
  answer,
  ctaHref = '/i/auth/signup',
  ctaLabel = 'Get started free',
  hideCta = false,
  children,
}: {
  eyebrow: string;
  h1: string;
  answer: string;
  ctaHref?: string;
  ctaLabel?: string;
  hideCta?: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pt-36 pb-16 md:pt-44 md:pb-24">
      <HubConfetti />
      <MarketingContainer>
        <div className="relative z-10 max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 text-balance md:text-5xl">
            {h1}
          </h1>
          <p className="mt-5 max-w-[52ch] text-lg text-zinc-500 text-pretty md:text-xl">
            {answer}
          </p>
          {!hideCta && (
            <Button
              asChild
              size="xl"
              className="mt-8 rounded-full bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
            >
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          )}
          {children}
        </div>
      </MarketingContainer>
    </section>
  );
}

/** Section wrapper for a hub's card grid. */
export function MinimalHubSection({ children }: { children: ReactNode }) {
  return (
    <section className="bg-white py-16 md:py-24">
      <MarketingContainer>{children}</MarketingContainer>
    </section>
  );
}

/** A neutral card linking to a hub child page. */
export function MinimalCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white p-6 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm"
    >
      <div className="text-lg font-semibold text-zinc-900">{title}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{body}</p>
    </Link>
  );
}
