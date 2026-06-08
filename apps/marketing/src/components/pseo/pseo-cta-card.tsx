import { MarketingContainer } from '@/components/marketing-container';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

import type { ThemePalette } from '@/components/pseo/theme-mock';

const brightPalette: ThemePalette = {
  colorBgBase: { h: 270, s: 0.9, l: 0.96 },
  colorBgPrimary: { h: 270, s: 0.85, l: 0.55 },
  colorBgSecondary: { h: 300, s: 0.7, l: 0.85 },
  colorBorderPrimary: { h: 270, s: 0.6, l: 0.75 },
  colorLabelPrimary: { h: 270, s: 0.5, l: 0.2 },
  colorLabelSecondary: { h: 270, s: 0.4, l: 0.4 },
  colorLabelTertiary: { h: 270, s: 0.3, l: 0.55 },
};

export function PseoCtaCard({
  headline = 'Your link in bio, beautifully done',
  subtext = 'Stand out with a page that looks as good as your brand.',
}: {
  headline?: string;
  subtext?: string;
}) {
  return (
    <section className="py-16">
      <MarketingContainer>
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-fuchsia-500 to-orange-400 px-8 py-12 md:px-14 md:py-16 shadow-lg">
          {/* Subtle glow overlay */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 65%)',
            }}
          />

          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            {/* Left: copy + CTA */}
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                {headline}
              </h2>
              <p className="mt-3 text-lg text-white/85">{subtext}</p>

              {/* Input + button row */}
              <div className="mt-8">
                <div className="w-full md:w-auto inline-flex flex-row items-center rounded-full bg-white/95 pl-4 shadow-sm border border-white/30">
                  <span className="text-gray-500 font-medium text-sm whitespace-nowrap">
                    lin.ky/
                  </span>
                  <input
                    type="text"
                    placeholder="yourname"
                    className="bg-transparent border-0 px-0 focus:outline-none focus:ring-0 rounded-full w-full text-gray-800 placeholder:text-gray-400"
                  />
                  <Button
                    asChild
                    size="xl"
                    className="rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 shrink-0"
                  >
                    <Link href="/i/auth/signup">Claim page</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs">
                <ThemeMock palette={brightPalette} name="yourname" />
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
