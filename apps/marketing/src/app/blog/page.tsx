import { MarketingContainer } from '@/components/marketing-container';
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
    <main>
      <div className="w-full flex-auto bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea]">
        <MarketingContainer>
          <div className="mx-auto max-w-2xl lg:max-w-none pt-32 pb-16">
            <div>
              <h1>
                <span className="text-pretty text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
                  Blog
                </span>
              </h1>
              <div className="mt-6 max-w-3xl text-xl text-slate-800">
                <p>
                  Product updates, tutorials, and other helpful content from the
                  Linky team.
                </p>
              </div>
            </div>
          </div>
          {/* Featured Post */}
          <div className="mx-auto max-w-6xl mb-20 px-4">
            <div className="rounded-3xl bg-white shadow-xl p-0 md:p-8 flex flex-col md:flex-row gap-0 md:gap-8 items-stretch overflow-hidden">
              <div className="w-full min-h-[280px] md:w-1/2 flex-shrink-0 flex items-center justify-center bg-slate-100 relative rounded-xl overflow-hidden">
                {featuredPost.featuredImage?.url && (
                  <Image
                    src={featuredPost.featuredImage.url}
                    alt={featuredPost.title}
                    className="object-cover w-full object-center absolute top-0 left-0"
                    fill
                    priority
                  />
                )}
              </div>
              <div className="flex-1 w-full p-8 flex flex-col justify-center">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                  <Link href={`/i/blog/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </Link>
                </h2>
                <div className="flex items-center gap-2 md:gap-4 mb-2 flex-wrap text-base md:text-lg">
                  <span className="text-slate-700 font-semibold">
                    {featuredAuthor?.name}
                  </span>
                  <span className="text-slate-400">·</span>
                  <time
                    className="text-slate-500"
                    dateTime={featuredPost.displayedPublishedAt}
                  >
                    {Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(featuredPost.displayedPublishedAt))}
                  </time>
                </div>
                <p className="text-base md:text-lg text-slate-700 mb-4 max-w-2xl">
                  {featuredPost.description}
                </p>
                <Button asChild variant="default" size="lg">
                  <Link href={`/i/blog/${featuredPost.slug}`}>Read more</Link>
                </Button>
              </div>
            </div>
          </div>
        </MarketingContainer>
      </div>
      {/* Grid of Other Posts */}
      <MarketingContainer className="py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {otherPosts.map((post) => {
              const author = authors.find(
                (author) => author.id === post.author
              );
              return (
                <div
                  key={post.slug}
                  className="rounded-2xl bg-white shadow-md hover:shadow-xl transition-shadow p-6 flex flex-col h-full"
                >
                  {post.featuredImage?.url && (
                    <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                      <Image
                        src={post.featuredImage.url}
                        alt={post.title}
                        className="object-cover"
                        fill
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    <Link href={`/i/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <div className="mb-1">
                    <span className="font-semibold text-sm text-slate-800">
                      {author?.name}
                    </span>{' '}
                    <time
                      className="text-xs text-slate-500 mb-2"
                      dateTime={post.displayedPublishedAt}
                    >
                      on{' '}
                      {Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }).format(new Date(post.displayedPublishedAt))}
                    </time>
                  </div>
                  <p className="text-base text-slate-600 mb-4 flex-1">
                    {post.description}
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                  >
                    <Link href={`/i/blog/${post.slug}`}>Read more</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </MarketingContainer>
    </main>
  );
}
