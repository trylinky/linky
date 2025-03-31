import { MarketingContainer } from '@/components/marketing-container';
import { authors } from '@/lib/cms/authors';
import { getBlogPost } from '@/lib/cms/get-blog-post-by-slug';

export const revalidate = 300;

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ blogPostSlug: string }>;
}) {
  const { blogPostSlug } = await params;
  const blogPost = await getBlogPost(blogPostSlug);
  const author = authors.find((author) => author.id === blogPost.author);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blogPost.title,
    author: {
      '@type': 'Person',
      name: author?.name,
      url: author?.link,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Linky',
      logo: {
        '@type': 'ImageObject',
        url: 'https://lin.ky/assets/logo.png',
      },
    },
    datePublished: blogPost.displayedPublishedAt,
    dateModified: blogPost.displayedPublishedAt,
  };

  return (
    <>
      <article>
        <div className="bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea] pt-16">
          <MarketingContainer>
            <header className="flex max-w-2xl flex-col pt-16 pb-16">
              <h1 className="text-pretty text-5xl lg:text-6xl font-black text-slate-900 tracking-tight">
                {blogPost.title}
              </h1>
              <p className="mt-6 text-sm font-semibold text-stone-800">
                by {author?.name} on{' '}
                <time
                  dateTime={blogPost.displayedPublishedAt}
                  className="order-first text-sm text-stone-800 mb-3"
                >
                  {Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(blogPost.displayedPublishedAt))}
                </time>
              </p>
            </header>
          </MarketingContainer>
        </div>
        <MarketingContainer>
          <div
            className="prose prose-lg max-w-3xl pt-16"
            dangerouslySetInnerHTML={{
              __html: blogPost.content.html,
            }}
          />
        </MarketingContainer>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd),
        }}
      />
    </>
  );
}
