import '../blog.css';
import { PostContent } from '@/app/blog/[blogPostSlug]/post-content';
import { PostCover } from '@/components/blog/post-cover';
import { ShareButtons } from '@/components/blog/share-buttons';
import { MinimalCta } from '@/components/pseo/pseo-minimal-cta';
import { authors } from '@/lib/blog/authors';
import {
  formatPostDate,
  getBlogPost,
  getBlogPosts,
  readingMinutes,
} from '@/lib/blog/posts';
import { Author, BlogPost } from '@/lib/blog/types';
import { buildBreadcrumbSchema, serializeJsonLd } from '@trylinky/seo';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Posts only change when the content repo is rebuilt, so every page is
// generated at build time and unknown slugs 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ blogPostSlug: post.slug }));
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ blogPostSlug: string }>;
}): Promise<Metadata> => {
  const { blogPostSlug } = await params;
  const blogPost = await getBlogPost(blogPostSlug);
  if (!blogPost) notFound();

  return {
    title: blogPost.title + ' | Linky - The delightful link in bio',
    description: blogPost.description,
    alternates: { canonical: `https://lin.ky/i/blog/${blogPost.slug}` },
    openGraph: {
      title: blogPost.title,
      description: blogPost.description,
      images: [
        {
          url: blogPost.featuredImage
            ? new URL(blogPost.featuredImage, 'https://lin.ky').toString()
            : 'https://lin.ky/assets/og.png',
        },
      ],
    },
  };
};

// "https://lin.ky/jack" -> "lin.ky/jack"
const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '');

function AuthorByline({ author }: { author?: Author }) {
  if (!author) return null;

  return (
    <>
      <Image
        src={author.avatar}
        alt=""
        width={40}
        height={40}
        className="size-10 flex-none rounded-[0.625rem] object-cover shadow-[0_0_0_1px_var(--line)]"
      />
      <div>
        <p className="leading-[1.35] font-semibold">{author.name}</p>
        <p className="text-[13px] leading-[1.35] text-(--ink-soft)">
          <a href={author.linkyLink} className="hover:text-(--ink)">
            {displayUrl(author.linkyLink)}
          </a>
        </p>
      </div>
    </>
  );
}

type Direction = 'next' | 'previous';

// Posts are listed newest first, so the next (newer) post points up and the
// previous (older) one points down.
function AdjacentLabel({ direction }: { direction: Direction }) {
  return (
    <span className="blog-eyebrow flex items-center gap-1.5">
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-3.5"
      >
        <path
          d={
            direction === 'next' ? 'M8 13V3M4 7l4-4 4 4' : 'M8 3v10M4 9l4 4 4-4'
          }
        />
      </svg>
      {direction === 'next' ? 'Next post' : 'Previous post'}
    </span>
  );
}

function AdjacentRailLink({
  direction,
  post,
}: {
  direction: Direction;
  post: BlogPost;
}) {
  return (
    <Link
      href={`/i/blog/${post.slug}`}
      className="group -mx-3 flex flex-col gap-1.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/80"
    >
      <AdjacentLabel direction={direction} />
      <span className="text-sm leading-[1.45] font-medium text-(--ink) group-hover:underline">
        {post.title}
      </span>
    </Link>
  );
}

function AdjacentPostCard({
  direction,
  post,
}: {
  direction: Direction;
  post: BlogPost;
}) {
  return (
    <Link
      href={`/i/blog/${post.slug}`}
      className="blog-surface flex flex-col gap-1.5 px-5 py-4"
    >
      <AdjacentLabel direction={direction} />
      <span className="text-[15px] font-semibold text-(--ink)">
        {post.title}
      </span>
    </Link>
  );
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ blogPostSlug: string }>;
}) {
  const { blogPostSlug } = await params;
  const blogPost = await getBlogPost(blogPostSlug);
  if (!blogPost) notFound();

  const author = authors.find((author) => author.id === blogPost.author);

  // Posts are sorted newest first.
  const allPosts = await getBlogPosts();
  const index = allPosts.findIndex((post) => post.slug === blogPost.slug);
  const newer = allPosts[index - 1];
  const older = allPosts[index + 1];

  const authorLinks = author
    ? [
        { label: displayUrl(author.linkyLink), href: author.linkyLink },
        ...(author.link !== author.linkyLink
          ? [{ label: displayUrl(author.link), href: author.link }]
          : []),
      ]
    : [];

  const postUrl = `https://lin.ky/i/blog/${blogPost.slug}`;
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blogPost.title,
    description: blogPost.description,
    url: postUrl,
    mainEntityOfPage: postUrl,
    ...(blogPost.featuredImage && {
      image: new URL(blogPost.featuredImage, 'https://lin.ky').toString(),
    }),
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
    datePublished: blogPost.publishedAt,
    dateModified: blogPost.publishedAt,
  };

  return (
    <>
      <div className="blog">
        <div className="blog-wash" aria-hidden="true" />
        <div className="blog-wrap blog-post-grid pb-16 md:pb-20">
          <aside className="blog-rail blog-rail-author" aria-label="Author">
            <div className="flex items-center gap-3">
              <AuthorByline author={author} />
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="blog-eyebrow">Share</p>
              <ShareButtons url={postUrl} title={blogPost.title} />
            </div>
          </aside>

          <article>
            <header>
              <p className="blog-eyebrow flex flex-wrap items-center gap-2">
                {blogPost.draft && (
                  <span className="blog-badge-warn">Draft</span>
                )}
                <Link href="/i/blog" className="hover:text-(--ink)">
                  Blog
                </Link>
                <span className="blog-sep" aria-hidden="true">
                  ·
                </span>
                <time dateTime={blogPost.publishedAt}>
                  {formatPostDate(blogPost.publishedAt, 'long')}
                </time>
                <span className="blog-sep" aria-hidden="true">
                  ·
                </span>
                <span>{readingMinutes(blogPost)} min read</span>
              </p>
              <h1 className="mt-4 text-[clamp(2.125rem,5vw,3rem)] leading-[1.1] font-semibold tracking-tight text-pretty">
                {blogPost.title}
              </h1>
              <p className="blog-desc mt-4 max-w-none text-lg leading-normal md:text-xl">
                {blogPost.description}
              </p>
              <div className="mt-6 flex items-center gap-3 min-[78rem]:hidden">
                <AuthorByline author={author} />
              </div>
              {blogPost.featuredImage && (
                <PostCover
                  src={blogPost.featuredImage}
                  // The text column is 42rem plus up to 3.5rem of bleed per side.
                  sizes="(min-width: 78rem) 784px, 100vw"
                  priority
                  className="blog-cover blog-surface mt-8 aspect-video"
                />
              )}
            </header>

            <div className="blog-prose">
              <PostContent content={blogPost.content} />
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-(--line-soft) pt-6 min-[78rem]:hidden">
              <p className="text-sm font-medium text-(--ink)">
                Share this article
              </p>
              <ShareButtons url={postUrl} title={blogPost.title} />
            </div>

            {author && (
              <footer className="blog-surface mt-14 flex flex-wrap items-center gap-5 p-6">
                <Image
                  src={author.avatar}
                  alt=""
                  width={56}
                  height={56}
                  className="size-14 flex-none rounded-[0.875rem] object-cover shadow-[0_0_0_1px_var(--line)]"
                />
                <div className="flex-[1_1_18rem]">
                  <p className="blog-eyebrow mb-1">Written by</p>
                  <p className="text-xl leading-tight font-semibold tracking-tight">
                    {author.name}
                  </p>
                  <p className="mt-1.5 text-sm leading-[1.55] text-(--ink-soft)">
                    {author.position} at Linky.
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {authorLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="blog-btn blog-btn-secondary blog-btn-sm"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </footer>
            )}
          </article>

          <aside
            className="blog-rail blog-rail-nav"
            aria-label="Adjacent posts"
          >
            {newer && <AdjacentRailLink direction="next" post={newer} />}
            {older && <AdjacentRailLink direction="previous" post={older} />}
          </aside>

          <nav className="blog-post-nav-bottom" aria-label="Adjacent posts">
            {newer && <AdjacentPostCard direction="next" post={newer} />}
            {older && <AdjacentPostCard direction="previous" post={older} />}
          </nav>
        </div>
      </div>
      <MinimalCta />
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
              { name: blogPost.title, url: postUrl },
            ])
          ),
        }}
      />
    </>
  );
}
