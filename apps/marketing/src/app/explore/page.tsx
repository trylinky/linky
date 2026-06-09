import { getFeaturedPages } from '@/actions/get-featured-pages';
import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHubHero } from '@/components/pseo/minimal-hub';
import { buildPageMetadata } from '@/lib/seo-metadata';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = buildPageMetadata({
  title: 'Explore Linky pages - community link-in-bio examples',
  description:
    'Browse real link-in-bio pages built with Linky - from creators and musicians to photographers and developers. Get inspired and start building your own.',
  path: '/i/explore',
});

export default async function ExploreLandingPage() {
  const featuredPages = await getFeaturedPages();

  return (
    <main className="min-h-screen bg-white">
      <MinimalHubHero
        hideCta
        eyebrow="Explore"
        h1="Explore"
        answer="Some of the best link-in-bio pages created by the Linky community - get inspired, then build your own."
      />
      <section className="py-16 md:py-24">
        <MarketingContainer>
          <div className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-3">
            {featuredPages.map((page) => (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className="rounded-2xl px-4 py-4 transition-colors hover:bg-zinc-50"
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_APP_URL}/${page.slug}/opengraph-image`}
                  alt=""
                  width={1200}
                  height={630}
                  className="rounded-xl ring-1 ring-zinc-950/5"
                />
                <div className="mt-3 flex flex-col">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {page.headerTitle}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {page.headerDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </MarketingContainer>
      </section>
    </main>
  );
}
