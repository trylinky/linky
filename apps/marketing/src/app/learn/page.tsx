import { getLearnPosts } from './utils';
import { LearnPost } from '@/app/learn/utils';
import { MarketingContainer } from '@/components/marketing-container';
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
    <main>
      <div className="w-full flex-auto bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea]">
        <MarketingContainer>
          <div className="mx-auto max-w-2xl lg:max-w-none pt-32 pb-16">
            <div>
              <h1>
                <span className="text-pretty text-5xl lg:text-6xl font-black text-black tracking-tight">
                  Learn
                </span>
              </h1>
              <div className="mt-6 max-w-3xl text-xl text-slate-900">
                <p>Common questions and answers about Linky and link-in-bio.</p>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </div>
      <MarketingContainer className="py-16">
        <div className="divide-y divide-slate-200 space-y-8">
          {Object.entries(learnPostsByCategory).map(
            ([category, posts]: [string, LearnPost[]]) => {
              return (
                <div key={category} className="pt-8">
                  <h3 className="text-pretty text-2xl font-black text-slate-900 tracking-tight mb-8">
                    {
                      learnPostCategories[
                        category as keyof typeof learnPostCategories
                      ].title
                    }
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {posts.map((post) => (
                      <article key={post.title}>
                        <h2 className="font-display text-xl font-medium text-slate-800">
                          <Link href={`/i/learn/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>
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
