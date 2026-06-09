import { MarketingContainer } from '@/components/marketing-container';
import { MinimalHubHero } from '@/components/pseo/minimal-hub';
import { authors } from '@/lib/cms/authors';
import { getBlogPosts } from '@/lib/cms/get-blog-posts';
import { Button } from '@trylinky/ui';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog | Linky',
};

export const revalidate = 300;

export default async function ArticlesLandingPage() {
  const blogPosts = await getBlogPosts();
  if (!blogPosts.length) return null;

  const [featuredPost, ...otherPosts] = blogPosts;
  const featuredAuthor = authors.find(
    (author) => author.id === featuredPost.author
  );

  return (
    <main className="min-h-screen bg-white">
      <MinimalHubHero
        hideCta
        eyebrow="Blog"
        h1="Blog"
        answer="Product updates, tutorials, and other helpful content from the Linky team."
      />

      {/* Featured Post */}
      <section className="py-16 md:py-20">
        <MarketingContainer>
          <p className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            Latest
          </p>
          <div className="flex flex-col items-stretch gap-0 overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-950/5 md:flex-row md:gap-8 md:p-8">
            <div className="relative flex min-h-[280px] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 md:w-1/2">
              {featuredPost.featuredImage?.url && (
                <Image
                  src={featuredPost.featuredImage.url}
                  alt={featuredPost.title}
                  className="absolute left-0 top-0 w-full object-cover object-center"
                  fill
                  priority
                />
              )}
            </div>
            <div className="flex w-full flex-1 flex-col justify-center p-8">
              <h2 className="mb-2 text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
                <Link href={`/i/blog/${featuredPost.slug}`}>
                  {featuredPost.title}
                </Link>
              </h2>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-sm md:gap-3">
                <span className="font-semibold text-zinc-700">
                  {featuredAuthor?.name}
                </span>
                <span className="text-zinc-300">·</span>
                <time
                  className="text-zinc-500"
                  dateTime={featuredPost.displayedPublishedAt}
                >
                  {Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(featuredPost.displayedPublishedAt))}
                </time>
              </div>
              <p className="mb-5 max-w-2xl text-base text-zinc-500 md:text-lg">
                {featuredPost.description}
              </p>
              <Button
                asChild
                size="lg"
                className="w-fit rounded-full bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
              >
                <Link href={`/i/blog/${featuredPost.slug}`}>Read more</Link>
              </Button>
            </div>
          </div>
        </MarketingContainer>
      </section>

      {/* Grid of Other Posts */}
      <section className="pb-20 md:pb-28">
        <MarketingContainer>
          <p className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            All posts
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => {
              const author = authors.find(
                (author) => author.id === post.author
              );
              return (
                <Link
                  key={post.slug}
                  href={`/i/blog/${post.slug}`}
                  className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm"
                >
                  {post.featuredImage?.url && (
                    <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-zinc-100">
                      <Image
                        src={post.featuredImage.url}
                        alt={post.title}
                        className="object-cover"
                        fill
                      />
                    </div>
                  )}
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-zinc-900">
                    {post.title}
                  </h3>
                  <div className="mb-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">
                      {author?.name}
                    </span>{' '}
                    <time dateTime={post.displayedPublishedAt}>
                      on{' '}
                      {Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }).format(new Date(post.displayedPublishedAt))}
                    </time>
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-zinc-500">
                    {post.description}
                  </p>
                  <span className="mt-4 text-sm font-medium text-zinc-900">
                    Read more →
                  </span>
                </Link>
              );
            })}
          </div>
        </MarketingContainer>
      </section>
    </main>
  );
}
