import { MarketingContainer } from '@/components/marketing-container';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export function MinimalCta({
  headline = 'Your page is one username away',
  subtext = 'Claim your link in bio and have it live in minutes - free, no credit card.',
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-24 md:py-32">
      <MarketingContainer>
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            Free forever
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 text-balance md:text-5xl">
            {headline}
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg text-zinc-500 text-pretty">
            {subtext}
          </p>

          <div className="mx-auto mt-9 max-w-xl">
            <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-sm ring-1 ring-zinc-950/10">
              <span className="font-medium text-zinc-400">lin.ky/</span>
              <input
                type="text"
                placeholder="yourname"
                aria-label="Choose your username"
                className="min-w-0 flex-1 border-0 bg-transparent px-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
              <Button
                asChild
                size="xl"
                className="group shrink-0 rounded-full bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
              >
                <Link href="/i/auth/signup">
                  Claim page
                  <ArrowRightIcon className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-400">
            No credit card · Connect a custom domain anytime · Cancel whenever
          </p>
        </div>
      </MarketingContainer>
    </section>
  );
}
