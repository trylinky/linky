import {
  Heading,
  TableOfContents,
} from '@/app/blog/[blogPostSlug]/rich-text-components';
import { MarketingContainer } from '@/components/marketing-container';
import { MinimalCta } from '@/components/pseo/pseo-minimal-cta';
import { authors } from '@/lib/cms/authors';
import { getBlogPost } from '@/lib/cms/get-blog-post-by-slug';
import { getBlogPosts } from '@/lib/cms/get-blog-posts';
import { RichText } from '@graphcms/rich-text-react-renderer';
import { ElementNode, RichTextContent } from '@graphcms/rich-text-types';
import slugify from '@sindresorhus/slugify';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
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
    alternates: { canonical: `https://lin.ky/i/blog/${blogPost.slug}` },
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
        <div className="border-b border-zinc-950/5 bg-linear-to-b from-white to-[#F5F5F3] pt-32 md:pt-40">
          <MarketingContainer>
            <header className="mx-auto flex max-w-2xl flex-col items-center pb-8 text-center">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                <span className="inline-block h-px w-6 bg-zinc-300" />
                Blog
              </p>
              <h1 className="mt-4 text-pretty text-4xl font-semibold tracking-tight text-zinc-900 lg:text-5xl">
                {blogPost.title}
              </h1>
              <div className="mt-6 mb-2 flex items-center gap-3">
                {author?.avatar && (
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={36}
                    height={36}
                    className="rounded-full ring-1 ring-zinc-950/10"
                  />
                )}
                <span className="text-sm font-medium text-zinc-700">
                  by{' '}
                  <a
                    href={author?.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-900 underline underline-offset-2 hover:text-zinc-600"
                  >
                    {author?.name}
                  </a>
                </span>
                <span className="text-zinc-300">·</span>
                <time
                  dateTime={blogPost.displayedPublishedAt}
                  className="text-sm text-zinc-500"
                >
                  {Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(blogPost.displayedPublishedAt))}
                </time>
              </div>
              <p className="mt-2 mb-6 max-w-2xl text-center text-lg text-zinc-500">
                {blogPost.description}
              </p>
              {blogPost.featuredImage?.url && (
                <div className="relative mb-2 aspect-2/1 w-full overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-950/5">
                  <Image
                    src={blogPost.featuredImage.url}
                    alt={blogPost.title}
                    width={800}
                    height={400}
                    className="h-full w-full object-cover"
                    style={{
                      objectFit: 'cover',
                      width: '100%',
                      height: '100%',
                    }}
                    priority
                  />
                </div>
              )}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                <div className="prose prose-lg prose-zinc max-w-3xl py-16 mx-auto">
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <MarketingContainer className="mt-8 mb-20">
          <h2 className="mb-8 text-2xl font-semibold tracking-tight text-zinc-900">
            Read more
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {readMorePosts.map((post) => (
              <Link
                key={post.slug}
                href={`/i/blog/${post.slug}`}
                className="flex h-full flex-col rounded-2xl bg-white p-5 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm"
              >
                {post.featuredImage?.url && (
                  <div className="relative mb-4 h-40 w-full overflow-hidden rounded-xl bg-zinc-100">
                    <Image
                      src={post.featuredImage.url}
                      alt={post.title}
                      fill
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-zinc-900">
                  {post.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-zinc-500 line-clamp-3">
                  {post.description}
                </p>
                <span className="mt-auto text-sm font-medium text-zinc-900">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </MarketingContainer>
        <MinimalCta />
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(articleJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(
            buildBreadcrumbSchema([
              { name: 'Home', url: 'https://lin.ky' },
              { name: 'Blog', url: 'https://lin.ky/i/blog' },
              { name: blogPost.title, url: `https://lin.ky/i/blog/${blogPost.slug}` },
            ])
          ),
        }}
      />
    </>
  );
}
