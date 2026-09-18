import { PostCover } from '@/components/blog/post-cover';
import { authors } from '@/lib/blog/authors';
import { formatPostDate, readingMinutes } from '@/lib/blog/posts';
import { BlogPost } from '@/lib/blog/types';
import Link from 'next/link';

// Both cards are clickable via the title link's stretched ::after, so the
// link's accessible name is the post title alone.

export function PostCard({
  post,
  eager = false,
}: {
  post: BlogPost;
  eager?: boolean;
}) {
  const author = authors.find((author) => author.id === post.author);

  return (
    <article className="group/card blog-surface relative flex flex-col p-2">
      <PostCover
        src={post.featuredImage}
        // Three across inside the 64rem wrap; the grid collapses below lg.
        sizes="(max-width: 40rem) 100vw, (max-width: 64rem) 50vw, 320px"
        priority={eager}
        className="aspect-16/10 rounded-[0.625rem]"
      />
      <div className="flex flex-1 flex-col px-4 pt-5 pb-4">
        <div className="blog-eyebrow flex items-center gap-3">
          {post.draft && <span className="blog-badge-warn">Draft</span>}
          <span>By {author?.name}</span>
          <span className="h-px flex-1 bg-(--line-soft)" aria-hidden="true" />
          <span>{readingMinutes(post)} min read</span>
        </div>
        <h3 className="mt-3 text-xl leading-snug font-semibold tracking-tight text-pretty">
          <Link
            href={`/i/blog/${post.slug}`}
            className="outline-none after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-relaxed text-(--ink-soft)">
          {post.description}
        </p>
        <span
          className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-(--accent-deep)"
          aria-hidden="true"
        >
          Read more
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 text-(--accent) transition-transform group-hover/card:translate-x-0.5"
          >
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </span>
      </div>
    </article>
  );
}

// Just enough to pick an article: the cover, the title and when it was
// published. The featured cards above carry the fuller details.
export function CompactPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="blog-surface relative flex items-center gap-4 p-1.5 pr-5">
      <PostCover
        src={post.featuredImage}
        sizes="80px"
        className="aspect-square w-20 flex-none rounded-[0.625rem]"
      />
      <div className="min-w-0">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold tracking-tight text-pretty">
          <Link
            href={`/i/blog/${post.slug}`}
            className="outline-none after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-2 text-[13px] text-(--ink-muted)">
          {post.draft && <span className="blog-badge-warn">Draft</span>}
          <time dateTime={post.publishedAt}>
            {formatPostDate(post.publishedAt)}
          </time>
        </p>
      </div>
    </article>
  );
}
