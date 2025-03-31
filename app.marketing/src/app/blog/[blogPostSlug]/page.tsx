import { MarketingContainer } from '@/components/marketing-container';
import { getBlogPost } from '@/lib/cms/get-blog-post-by-slug';

type Author = {
  id: 'alex' | 'jack';
  name: string;
  position: string;
  avatar: string;
  link: string;
  linkyUsername: string;
  linkyLink: string;
};

export const authors: Author[] = [
  {
    id: 'alex',
    name: 'Alex',
    position: 'Founder',
    avatar:
      'https://cdn.lin.ky/block-f5a2d44d-6933-4a51-a9e2-9fbb27923585/f4fdd080-46be-483f-9b04-e5646efb157d',
    link: 'https://x.com/alexjpate',
    linkyUsername: 'alex',
    linkyLink: 'https://alex.now',
  },
  {
    id: 'jack',
    name: 'Jack',
    position: 'Co-founder',
    avatar:
      'https://cdn.lin.ky/666b7445-c171-4ad7-a21d-eb1954b7bd40/0885d7ec-9af4-4430-94f4-ad1a033c2704',
    link: 'https://x.com/trylinky',
    linkyUsername: 'jack',
    linkyLink: 'https://lin.ky/jack',
  },
];

export default async function BlogPostPage({
  params,
}: {
  params: { blogPostSlug: string };
}) {
  const blogPost = await getBlogPost(params.blogPostSlug);
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
