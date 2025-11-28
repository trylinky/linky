import {
  Heading,
  TableOfContents,
} from '@/app/blog/[blogPostSlug]/rich-text-components';
import { CallToActionBlock } from '@/components/landing-page/CallToActionBlock';
import { MarketingContainer } from '@/components/marketing-container';
import { authors } from '@/lib/cms/authors';
import { getBlogPost } from '@/lib/cms/get-blog-post-by-slug';
import { getBlogPosts } from '@/lib/cms/get-blog-posts';
import { RichText } from '@graphcms/rich-text-react-renderer';
import { ElementNode, RichTextContent } from '@graphcms/rich-text-types';
import slugify from '@sindresorhus/slugify';
import { Button } from '@trylinky/ui';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

function buildTocFromRaw(raw: {
  children: Array<ElementNode>;
}): { level: number; title: string; id: string }[] {
  const levels = {
    'heading-one': 1,
    'heading-two': 2,
    'heading-three': 3,
    'heading-four': 4,
    'heading-five': 5,
    'heading-six': 6,
  };

  const toc = raw.children
    .filter((child) => child.type.startsWith('heading-'))
    .map((child) => {
      const title = child.children
        .map((child) => child.text)
        .join('')
        .trim();

      return {
        level: levels[child.type as keyof typeof levels],
        title,
        id: slugify(title),
      };
    });

  return toc;
}

export const revalidate = 300;

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ blogPostSlug: string }>;
}): Promise<Metadata> => {
  const { blogPostSlug } = await params;
  const blogPost = await getBlogPost(blogPostSlug);

  return {
    title: blogPost.title + ' | Linky - The delightful link in bio',
    description: blogPost.description,
    openGraph: {
      title: blogPost.title,
      description: blogPost.description,
      images: [
        {
          url: blogPost.featuredImage?.url ?? 'https://lin.ky/assets/og.png',
          width: 1200,
          height: 630,
        },
      ],
    },
  };
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ blogPostSlug: string }>;
}) {
  const { blogPostSlug } = await params;
  const blogPost = await getBlogPost(blogPostSlug);
  const author = authors.find((author) => author.id === blogPost.author);
  const allPosts = await getBlogPosts();
  const otherPosts = allPosts.filter((p) => p.slug !== blogPostSlug);

  const shuffled = [...otherPosts].sort(() => 0.5 - Math.random());
  const readMorePosts = shuffled.slice(0, 3);
  const toc = buildTocFromRaw(
    blogPost.content.raw as { children: Array<ElementNode> }
  );

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

  // Social share icons (black)
  const shareIcons = [
    {
      name: 'X / Twitter',
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://lin.ky/i/blog/${blogPost.slug}`)}&text=${encodeURIComponent(blogPost.title)}`,
      icon: 'https://cdn.lin.ky/default-data/icons/twitter-x.svg',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://lin.ky/i/blog/${blogPost.slug}`)}`,
      icon: 'https://cdn.lin.ky/default-data/icons/facebook.svg',
    },
    {
      name: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://lin.ky/i/blog/${blogPost.slug}`)}`,
      icon: 'https://cdn.lin.ky/default-data/icons/linkedin.svg',
    },
    {
      name: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodeURIComponent(`https://lin.ky/i/blog/${blogPost.slug}`)}&title=${encodeURIComponent(blogPost.title)}`,
      icon: 'https://cdn.lin.ky/default-data/icons/reddit.svg',
    },
    {
      name: 'WhatsApp',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(blogPost.title + ' https://lin.ky/i/blog/' + blogPost.slug)}`,
      icon: 'https://cdn.lin.ky/default-data/icons/whatsapp.svg',
    },
  ];

  return (
    <>
      <article>
        <div className="bg-gradient-to-b from-[#f9f9f8] to-[#f5f3ea] pt-16">
          <MarketingContainer>
            <header className="flex flex-col items-center max-w-2xl mx-auto pt-16 pb-8">
              {blogPost.featuredImage?.url && (
                <div className="w-full mb-8 rounded-2xl overflow-hidden shadow-lg bg-slate-100 aspect-[2/1] relative">
                  <Image
                    src={blogPost.featuredImage.url}
                    alt={blogPost.title}
                    width={800}
                    height={400}
                    className="object-cover w-full h-full"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                    priority
                  />
                </div>
              )}
              <h1 className="text-pretty text-5xl lg:text-6xl font-black text-slate-900 tracking-tight text-center">
                {blogPost.title}
              </h1>
              <div className="flex items-center gap-3 mt-6 mb-2">
                {author?.avatar && (
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={40}
                    height={40}
                    className="rounded-full border border-slate-200 shadow"
                  />
                )}
                <span className="text-base font-semibold text-stone-800">
                  by{' '}
                  <a
                    href={author?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-600"
                  >
                    {author?.name}
                  </a>
                </span>
                <span className="text-slate-400">·</span>
                <time
                  dateTime={blogPost.displayedPublishedAt}
                  className="text-base text-stone-800"
                >
                  {Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(blogPost.displayedPublishedAt))}
                </time>
              </div>
              <p className="text-lg text-slate-700 text-center max-w-2xl mt-2 mb-4">
                {blogPost.description}
              </p>
              {/* Social Share Buttons (top, mobile only) */}
              <div className="flex gap-2 justify-center mt-2 mb-2">
                {shareIcons.map((icon) => (
                  <a
                    key={icon.name}
                    href={icon.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-black/5 hover:bg-black/10 transition-colors w-10 h-10 flex items-center justify-center"
                    title={`Share on ${icon.name}`}
                  >
                    <img
                      src={icon.icon}
                      alt={icon.name}
                      className="w-5 h-5 opacity-70 group-hover:opacity-100"
                      style={{ filter: 'invert(0)' }}
                    />
                  </a>
                ))}
              </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 mx-auto w-full justify-between">
              <div className="flex-1 min-w-0 max-w-3xl">
                <div className="prose prose-lg max-w-3xl py-16 mx-auto">
                  <RichText
                    content={blogPost.content.raw}
                    renderers={{
                      h1: ({ children }) => (
                        <Heading as="h1">{children}</Heading>
                      ),
                      h2: ({ children }) => (
                        <Heading as="h2">{children}</Heading>
                      ),
                      h3: ({ children }) => (
                        <Heading as="h3">{children}</Heading>
                      ),
                      h4: ({ children }) => (
                        <Heading as="h4">{children}</Heading>
                      ),
                      h5: ({ children }) => (
                        <Heading as="h5">{children}</Heading>
                      ),
                      h6: ({ children }) => (
                        <Heading as="h6">{children}</Heading>
                      ),
                      a: ({ children, openInNewTab, href, rel, ...rest }) => {
                        if (href?.match(/^https?:\/\/|^\/\//i)) {
                          return (
                            <a
                              href={href}
                              target={openInNewTab ? '_blank' : '_self'}
                              rel={rel || 'noopener'}
                              {...rest}
                            >
                              {children}
                            </a>
                          );
                        }

                        return (
                          <Link href={href ?? ''}>
                            <a {...rest}>{children}</a>
                          </Link>
                        );
                      },
                    }}
                  />
                </div>

                <div className="flex gap-2 justify-center mt-8 mb-8 lg:hidden">
                  {shareIcons.map((icon) => (
                    <a
                      key={icon.name}
                      href={icon.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-slate-100 hover:bg-slate-200 transition-colors w-10 h-10 flex items-center justify-center"
                      title={`Share on ${icon.name}`}
                    >
                      <img
                        src={icon.icon}
                        alt={icon.name}
                        className="w-5 h-5 opacity-70 group-hover:opacity-100"
                        style={{ filter: 'invert(0)' }}
                      />
                    </a>
                  ))}
                </div>
              </div>

              {toc.length > 1 && (
                <aside className="hidden lg:flex flex-col gap-8 w-72 max-w-xs sticky top-8 pt-16 pb-8 self-start">
                  <TableOfContents links={toc} />
                  <div className="flex gap-2 flex-wrap justify-start">
                    {shareIcons.map((icon) => (
                      <a
                        key={icon.name}
                        href={icon.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-black/5 hover:bg-black/10 transition-colors w-10 h-10 flex items-center justify-center"
                        title={`Share on ${icon.name}`}
                      >
                        <img
                          src={icon.icon}
                          alt={icon.name}
                          className="w-5 h-5 opacity-70 group-hover:opacity-100"
                          style={{ filter: 'invert(0)' }}
                        />
                      </a>
                    ))}
                  </div>
                </aside>
              )}
            </div>
          </MarketingContainer>
        </div>
        <MarketingContainer className="mt-8 mb-16">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Read more</h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {readMorePosts.map((post) => {
              const postAuthor = authors.find((a) => a.id === post.author);
              return (
                <div
                  key={post.slug}
                  className="rounded-xl bg-white shadow-md hover:shadow-xl transition-shadow p-4 flex flex-col h-full border border-slate-100"
                >
                  {post.featuredImage?.url && (
                    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-slate-100 relative">
                      <Image
                        src={post.featuredImage.url}
                        alt={post.title}
                        fill
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    <Link href={`/i/blog/${post.slug}`}>{post.title}</Link>
                  </h4>

                  <p className="text-sm text-slate-600 mb-2 line-clamp-3">
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
        </MarketingContainer>
        <MarketingContainer>
          <div className="mb-24">
            <CallToActionBlock />
          </div>
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
