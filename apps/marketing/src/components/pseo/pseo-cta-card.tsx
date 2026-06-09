import previewLeft from '@/assets/landing-page/previews/5.png';
import previewRight from '@/assets/landing-page/previews/12.png';
import { MarketingContainer } from '@/components/marketing-container';
import { Button } from '@trylinky/ui';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';

export function PseoCtaCard({
  headline = 'Your page is one username away',
  subtext = 'Claim your link in bio and have it live in minutes - free, no credit card.',
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#0E0D0C] py-24 md:py-32">
      {/* Coral glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,122,92,0.22),transparent_65%)] blur-3xl"
      />
      {/* Real pages peeking from the corners */}
      <Image
        src={previewLeft}
        alt=""
        aria-hidden="true"
        width={1170}
        height={2532}
        className="pointer-events-none absolute -bottom-20 -left-10 hidden w-40 rotate-[10deg] rounded-2xl opacity-50 shadow-2xl ring-1 ring-white/10 md:block lg:w-48"
      />
      <Image
        src={previewRight}
        alt=""
        aria-hidden="true"
        width={1170}
        height={2532}
        className="pointer-events-none absolute -bottom-24 -right-10 hidden w-40 rotate-[-10deg] rounded-2xl opacity-50 shadow-2xl ring-1 ring-white/10 md:block lg:w-48"
      />

      <MarketingContainer>
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-white/15 backdrop-blur">
            <span className="inline-block size-1.5 rounded-full bg-[#FF7A5C]" />
            Free forever
          </p>
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white text-balance md:text-6xl">
            {headline}
          </h2>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg text-zinc-300 text-pretty">
            {subtext}
          </p>

          {/* Oversized claim field */}
          <div className="mx-auto mt-9 max-w-xl">
            <div className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl shadow-black/40 ring-1 ring-white/10">
              <span className="font-medium text-zinc-500">lin.ky/</span>
              <input
                type="text"
                placeholder="yourname"
                aria-label="Choose your username"
                className="min-w-0 flex-1 border-0 bg-transparent px-0 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0"
              />
              <Button
                asChild
                size="xl"
                className="group shrink-0 rounded-full bg-[#E8553F] font-bold text-white hover:bg-[#d6442f]"
              >
                <Link href="/i/auth/signup">
                  Claim page
                  <ArrowRightIcon className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </div>
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            No credit card · Connect a custom domain anytime · Cancel whenever
          </p>
        </div>
      </MarketingContainer>
    </section>
  );
}
