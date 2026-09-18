import { BlogHero } from '@/components/blog/blog-hero';
import { CompactPostCard, PostCard } from '@/components/blog/post-card';
import { BlogPost } from '@/lib/blog/types';
import { cn } from '@trylinky/ui';
import Link from 'next/link';

// The newest posts are featured at the top of the first page; everything
// after them is listed as compact cards, a page at a time.
const FEATURED_COUNT = 3;
const PAGE_SIZE = 12;

export function paginatePosts(posts: BlogPost[], page: number) {
  const rest = posts.slice(FEATURED_COUNT);
  return {
    featured: page === 1 ? posts.slice(0, FEATURED_COUNT) : [],
    listed: rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    pageCount: Math.max(1, Math.ceil(rest.length / PAGE_SIZE)),
  };
}

const pageHref = (page: number) =>
  page === 1 ? '/i/blog' : `/i/blog/page/${page}`;

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path
        d={direction === 'left' ? 'M13 8H3M7 4 3 8l4 4' : 'M3 8h10M9 4l4 4-4 4'}
      />
    </svg>
  );
}

function Pagination({ page, pageCount }: { page: number; pageCount: number }) {
  if (pageCount < 2) return null;

  return (
    <nav
      aria-label="Blog pages"
      className="flex items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          href={pageHref(page - 1)}
          className="blog-btn blog-btn-secondary"
          rel="prev"
        >
          <Arrow direction="left" />
          Newer
        </Link>
      ) : (
        <span />
      )}

      <p className="text-[13px] text-(--ink-soft) sm:hidden">
        Page {page} of {pageCount}
      </p>
      <ol className="flex items-center gap-1 max-sm:hidden">
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <Link
              href={pageHref(n)}
              aria-current={n === page ? 'page' : undefined}
              aria-label={`Page ${n}`}
              className={cn(
                'flex size-9 items-center justify-center rounded-lg text-[13px] font-medium text-(--ink-soft) transition-colors hover:bg-black/4 hover:text-(--ink)',
                n === page && 'bg-black/6 text-(--ink)'
              )}
            >
              {n}
            </Link>
          </li>
        ))}
      </ol>

      {page < pageCount ? (
        <Link
          href={pageHref(page + 1)}
          className="blog-btn blog-btn-secondary"
          rel="next"
        >
          Older
          <Arrow direction="right" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function BlogIndex({
  posts,
  page,
}: {
  posts: BlogPost[];
  page: number;
}) {
  const { featured, listed, pageCount } = paginatePosts(posts, page);

  return (
    <div className="blog">
      <div className="blog-wash" aria-hidden="true" />
      <div className="blog-wrap blog-wrap-narrow flex flex-col gap-10 pb-24 md:pb-32">
        <BlogHero page={page} pageCount={pageCount} />

        {featured.length > 0 && (
          <section aria-labelledby="newest-heading">
            <h2 className="blog-eyebrow mb-3.5" id="newest-heading">
              Newest
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post, i) => (
                <PostCard key={post.slug} post={post} eager={i === 0} />
              ))}
            </div>
          </section>
        )}

        {listed.length > 0 && (
          <section aria-labelledby="more-heading">
            <h2 className="blog-eyebrow mb-3.5" id="more-heading">
              {page === 1 ? 'More articles' : 'Articles'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {listed.map((post) => (
                <CompactPostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}

        <Pagination page={page} pageCount={pageCount} />
      </div>
    </div>
  );
}
