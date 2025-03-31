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
        </MarketingContainer>
      </div>
      <MarketingContainer className="py-16">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          <div className="space-y-16">
            {blogPosts.map((post) => {
              const author = authors.find(
                (author) => author.id === post.author
              );
              return (
                <div key={post.slug}>
                  <article>
                    <div className="relative lg:-mx-4 lg:flex lg:justify-end">
                      <div className="pt-10 lg:w-2/3 lg:flex-none lg:px-4 lg:pt-0">
                        <h2 className="font-serf text-2xl font-bold text-slate-800">
                          <Link href={`/i/blog/${post.slug}`}>
                            {post.title}
                          </Link>
                        </h2>
                        <dl className="lg:absolute lg:left-0 lg:top-0 lg:w-1/3 lg:px-4">
                          <dt className="sr-only">Published</dt>
                          <dd className="absolute left-0 top-0 text-sm text-slate-800 lg:static">
                            <time dateTime={post.displayedPublishedAt}>
                              {Intl.DateTimeFormat('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              }).format(new Date(post.displayedPublishedAt))}
                            </time>
                          </dd>
                          <dt className="sr-only">Author</dt>
                          <dd className="mt-6 flex gap-x-4">
                            <div className="flex-none overflow-hidden rounded-xl bg-slate-100">
                              {author?.avatar && (
                                <Image
                                  width={48}
                                  height={48}
                                  src={author.avatar}
                                  className="h-12 w-12 object-cover"
                                  alt={author.name}
                                />
                              )}
                            </div>
                            <div className="text-sm text-slate-700">
                              <div className="font-semibold">
                                {author?.name}
                              </div>
                              {author?.linkyLink && (
                                <Link
                                  href={author.linkyLink}
                                  className="text-slate-500"
                                >
                                  lin.ky/{author.linkyUsername}
                                </Link>
                              )}
                            </div>
                          </dd>
                        </dl>
                        <p className="mt-6 max-w-2xl text-base text-neutral-600">
                          {post.description}
                        </p>
                        <Button
                          asChild
                          variant="outline"
                          size="lg"
                          className="mt-4"
                        >
                          <Link href={`/i/blog/${post.slug}`}>Read more</Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </MarketingContainer>
    </main>
  );
}
