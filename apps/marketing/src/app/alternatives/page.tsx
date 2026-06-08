import { MarketingContainer } from '@/components/marketing-container';
import { PseoBand } from '@/components/pseo/pseo-section';
import { alternatives } from '@/content/alternatives';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio alternatives | Linky',
  description:
    'See how Linky compares to Linktree, Beacons, Bio.link, Carrd, and Later — and why creators switch to a richer link-in-bio page.',
  path: '/i/alternatives',
});

export default function AlternativesHub() {
  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className="bg-linear-to-b from-[#f5f3ea] to-white pt-28 md:pt-36 pb-16 md:pb-20">
        <MarketingContainer>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Linky vs the alternatives
            </h1>
            <p className="mt-5 text-lg md:text-xl text-[#241f3d]/80 text-pretty">
              Honest, side-by-side comparisons with every major link-in-bio
              tool. See where Linky wins, where others have strengths, and which
              platform fits how you work.
            </p>
            <Button
              asChild
              variant="default"
              size="xl"
              className="mt-8 rounded-full font-bold"
            >
              <Link href="/i/auth/signup">Get started free</Link>
            </Button>
          </div>
        </MarketingContainer>
      </section>

      {/* Alternatives grid */}
      <PseoBand tone="white">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/i/alternatives/${a.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm hover:border-gray-300 transition-shadow"
              >
                <div className="text-lg font-semibold text-gray-900">
                  Linky vs {a.competitor}
                </div>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {a.answer}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </PseoBand>
    </div>
  );
}
