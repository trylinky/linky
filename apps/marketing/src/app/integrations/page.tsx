import { MarketingContainer } from '@/components/marketing-container';
import { PseoBand } from '@/components/pseo/pseo-section';
import { integrations } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import { Button } from '@trylinky/ui';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio integrations | Linky',
  description:
    'Connect Spotify, Instagram, TikTok, Threads, and GitHub to your Linky link-in-bio page. See every integration and what it adds.',
  path: '/i/integrations',
});

export default function IntegrationsHub() {
  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className="bg-linear-to-b from-[#f5f3ea] to-white pt-28 md:pt-36 pb-16 md:pb-20">
        <MarketingContainer>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black">
              Integrations
            </h1>
            <p className="mt-5 text-lg md:text-xl text-[#241f3d]/80 text-pretty">
              Everything you can connect to your Linky page. Linky integrates
              with your favourite platforms to keep your link-in-bio fresh and
              dynamic — automatically.
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

      {/* Integrations grid */}
      <PseoBand tone="white">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => (
            <li key={i.slug}>
              <Link
                href={`/i/integrations/${i.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm hover:border-gray-300 transition-shadow"
              >
                <div className="text-lg font-semibold text-gray-900">
                  {i.name}
                </div>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  {i.answer}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </PseoBand>
    </div>
  );
}
