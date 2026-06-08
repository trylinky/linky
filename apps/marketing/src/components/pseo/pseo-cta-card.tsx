import { MarketingContainer } from '@/components/marketing-container';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

import type { ThemePalette } from '@/components/pseo/theme-mock';

// ---------------------------------------------------------------------------
// Scheme definitions — all class strings are LITERAL (no dynamic concatenation)
// so Tailwind can pick them up at build time.
// ---------------------------------------------------------------------------

type SchemeKey = 'indigo' | 'coral' | 'soft';

interface Scheme {
  cardClass: string;
  headingClass: string;
  subtextClass: string;
  inputWrapperClass: string;
  inputClass: string;
  prefixClass: string;
  buttonClass: string;
  glowOverlay: boolean;
  palette: ThemePalette;
}

const SCHEMES: Record<SchemeKey, Scheme> = {
  indigo: {
    cardClass:
      'bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg',
    headingClass: 'text-white',
    subtextClass: 'text-white/85',
    inputWrapperClass:
      'inline-flex flex-row items-center rounded-full bg-white/95 pl-4 shadow-sm border border-white/30 w-full md:w-auto',
    inputClass:
      'bg-transparent border-0 px-0 focus:outline-none focus:ring-0 rounded-full w-full text-gray-800 placeholder:text-gray-400',
    prefixClass: 'text-gray-500 font-medium text-sm whitespace-nowrap',
    buttonClass:
      'rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 shrink-0',
    glowOverlay: true,
    palette: {
      colorBgBase:       { h: 245, s: 0.5,  l: 0.22 },
      colorBgPrimary:    { h: 245, s: 0.45, l: 0.3  },
      colorBgSecondary:  { h: 250, s: 0.5,  l: 0.45 },
      colorBorderPrimary:{ h: 245, s: 0.4,  l: 0.35 },
      colorLabelPrimary: { h: 0,   s: 0,    l: 1    },
      colorLabelSecondary:{ h: 250, s: 0.3, l: 0.85 },
      colorLabelTertiary:{ h: 0,   s: 0,    l: 0.98 },
    },
  },

  coral: {
    cardClass:
      'bg-linear-to-br from-[#FF8A5B] to-[#FF5C7A] shadow-lg',
    headingClass: 'text-white',
    subtextClass: 'text-white/85',
    inputWrapperClass:
      'inline-flex flex-row items-center rounded-full bg-white/95 pl-4 shadow-sm border border-white/30 w-full md:w-auto',
    inputClass:
      'bg-transparent border-0 px-0 focus:outline-none focus:ring-0 rounded-full w-full text-gray-800 placeholder:text-gray-400',
    prefixClass: 'text-gray-500 font-medium text-sm whitespace-nowrap',
    buttonClass:
      'rounded-full bg-gray-900 text-white font-bold hover:bg-gray-800 shrink-0',
    glowOverlay: true,
    palette: {
      colorBgBase:        { h: 12,  s: 0.55, l: 0.28 },
      colorBgPrimary:     { h: 8,   s: 0.5,  l: 0.36 },
      colorBgSecondary:   { h: 350, s: 0.5,  l: 0.5  },
      colorBorderPrimary: { h: 10,  s: 0.4,  l: 0.4  },
      colorLabelPrimary:  { h: 0,   s: 0,    l: 1    },
      colorLabelSecondary:{ h: 20,  s: 0.3,  l: 0.9  },
      colorLabelTertiary: { h: 0,   s: 0,    l: 0.98 },
    },
  },

  soft: {
    cardClass:
      'bg-linear-to-br from-[#EEF1FF] to-[#FBEEFF] border border-black/5',
    headingClass: 'text-gray-900',
    subtextClass: 'text-gray-600',
    inputWrapperClass:
      'inline-flex flex-row items-center rounded-full bg-white pl-4 shadow-sm border border-black/10 w-full md:w-auto',
    inputClass:
      'bg-transparent border-0 px-0 focus:outline-none focus:ring-0 rounded-full w-full text-gray-800 placeholder:text-gray-400',
    prefixClass: 'text-gray-500 font-medium text-sm whitespace-nowrap',
    buttonClass:
      'rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 shrink-0',
    glowOverlay: false,
    palette: {
      colorBgBase:        { h: 258, s: 0.6,  l: 0.5  },
      colorBgPrimary:     { h: 258, s: 0.55, l: 0.58 },
      colorBgSecondary:   { h: 270, s: 0.55, l: 0.68 },
      colorBorderPrimary: { h: 258, s: 0.5,  l: 0.62 },
      colorLabelPrimary:  { h: 0,   s: 0,    l: 1    },
      colorLabelSecondary:{ h: 270, s: 0.3,  l: 0.92 },
      colorLabelTertiary: { h: 0,   s: 0,    l: 0.98 },
    },
  },
};

// ---------------------------------------------------------------------------

export function PseoCtaCard({
  headline = 'Your link in bio, beautifully done',
  subtext = 'Stand out with a page that looks as good as your brand.',
  scheme: schemeKey = 'indigo',
}: {
  headline?: string;
  subtext?: string;
  scheme?: SchemeKey;
}) {
  const s = SCHEMES[schemeKey];

  return (
    <section className="py-16">
      <MarketingContainer>
        <div
          className={`relative overflow-hidden rounded-3xl px-8 py-12 md:px-14 md:py-16 ${s.cardClass}`}
        >
          {/* Subtle glow overlay — only on dark gradient schemes */}
          {s.glowOverlay && (
            <div
              className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full blur-3xl"
              style={{
                background:
                  'radial-gradient(ellipse at top right, rgba(255,255,255,0.18) 0%, transparent 65%)',
              }}
            />
          )}

          <div className="relative grid gap-10 md:grid-cols-2 items-center">
            {/* Left: copy + CTA */}
            <div>
              <h2
                className={`text-3xl md:text-4xl font-black tracking-tight ${s.headingClass}`}
              >
                {headline}
              </h2>
              <p className={`mt-3 text-lg ${s.subtextClass}`}>{subtext}</p>

              {/* Input + button row */}
              <div className="mt-8">
                <div className={s.inputWrapperClass}>
                  <span className={s.prefixClass}>lin.ky/</span>
                  <input
                    type="text"
                    placeholder="yourname"
                    className={s.inputClass}
                  />
                  <Button
                    asChild
                    size="xl"
                    className={s.buttonClass}
                  >
                    <Link href="/i/auth/signup">Claim page</Link>
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: product preview */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-xs">
                <ThemeMock palette={s.palette} name="yourname" />
              </div>
            </div>
          </div>
        </div>
      </MarketingContainer>
    </section>
  );
}
