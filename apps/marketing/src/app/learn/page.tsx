import { getLearnPosts } from './utils';
import { LearnPost } from '@/app/learn/utils';
import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHubHero } from '@/components/pseo/minimal-hub';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Learn - Linky',
};

const learnPostCategories: Record<
  LearnPost['category'],
  {
    title: string;
  }
> = {
  linky: {
    title: 'Linky',
  },
  'link-in-bio': {
    title: 'Link in Bio',
  },
  growth: {
    title: 'Tips & Growth',
  },
};

export default async function LearnLandingPage() {
  const learnPosts = await getLearnPosts();

  const learnPostsByCategory = learnPosts.reduce(
    (acc, post) => {
      acc[post.category] = acc[post.category] || [];
      acc[post.category].push(post);
      return acc;
    },
    {} as Record<LearnPost['category'], LearnPost[]>
  );

  return (
    <main className="min-h-screen bg-white">
      <MinimalHubHero
        hideCta
        eyebrow="Learn"
        h1="Learn"
        answer="Common questions and answers about Linky and link-in-bio."
      />
      <MarketingContainer className="py-16 md:py-24">
        <div className="divide-y divide-zinc-950/5">
          {Object.entries(learnPostsByCategory).map(
            ([category, posts]: [string, LearnPost[]]) => {
              return (
                <div key={category} className="py-12 first:pt-0">
                  <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
                    {
                      learnPostCategories[
                        category as keyof typeof learnPostCategories
                      ].title
                    }
                  </h2>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                    {posts.map((post) => (
                      <article key={post.title}>
                        <h3 className="text-lg font-medium text-zinc-700 transition-colors hover:text-zinc-900">
                          <Link href={`/i/learn/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h3>
                      </article>
                    ))}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </MarketingContainer>
    </main>
  );
}
