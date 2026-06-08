import { MarketingContainer } from '@/components/marketing-container';
import { PseoBand } from '@/components/pseo/pseo-section';
import { niches } from '@/content/niches';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio for every creator and business | Linky',
  description:
    'Link-in-bio pages tailored for musicians, photographers, restaurants, developers, and more. Find the right setup for you.',
  path: '/i/for',
});

export default function NichesHub() {
  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className="bg-linear-to-b from-[#f5f3ea] to-white pt-28 md:pt-36 pb-16 md:pb-20">
        <MarketingContainer>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Linky for everyone
            </h1>
            <p className="mt-5 text-lg md:text-xl text-[#241f3d]/80 text-pretty">
              A link in bio tailored to what you do. From musicians to
              restaurateurs, developers to designers — Linky has the right
              blocks, integrations, and templates for your audience.
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

      {/* Niches grid */}
      <PseoBand tone="white">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/i/for/${n.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm hover:border-gray-300 transition-shadow"
              >
                <div className="text-lg font-semibold text-gray-900">
                  {n.name}
                </div>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {n.answer}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </PseoBand>
    </div>
  );
}
