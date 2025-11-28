import { getFeaturedPages } from '@/actions/get-featured-pages';
import { MarketingContainer } from '@/components/marketing-container';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Explore - Linky',
};

export default async function ExploreLandingPage() {
  const featuredPages = await getFeaturedPages();

  return (
    <main className="bg-[#FCFBF8]">
      <div className="w-full flex-auto">
        <MarketingContainer>
          <div className="mx-auto max-w-2xl lg:max-w-none pt-24 pb-8">
            <div>
              <h1>
                <span className="text-pretty text-5xl lg:text-6xl font-black text-black tracking-tight">
                  Explore
                </span>
              </h1>
              <div className="mt-6 max-w-3xl text-xl text-slate-900">
                <p>
                  Explore some of the best link-in-bio pages created by the
                  Linky community.
                </p>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </div>
      <MarketingContainer className="pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-2 gap-y-4 w-[calc(100%+2rem)] -ml-4">
          {featuredPages.map((page) => {
            return (
              <Link
                key={page.id}
                href={`/${page.slug}`}
                className="bg-transparent hover:bg-slate-100 transition-colors px-4 py-4 rounded-xl"
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_APP_URL}/${page.slug}/opengraph-image`}
                  alt=""
                  width={1200}
                  height={630}
                  className="rounded-xl"
                />
                <div className="flex flex-col mt-3">
                  <h3 className="text-lg font-bold">{page.headerTitle}</h3>
                  <p className="text-sm text-slate-500">
                    {page.headerDescription}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </MarketingContainer>
    </main>
  );
}
