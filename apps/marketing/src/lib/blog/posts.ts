import { authors } from '@/lib/blog/authors';
import { AuthorIds, BlogPost } from '@/lib/blog/types';
import { readdir, readFile } from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import { cache } from 'react';

// Posts live in a separate, private content repository which
// scripts/sync-blog-content.mjs makes available at build time. When it is not
// configured the blog is simply empty, so the site still runs without it.
const CONTENT_DIR = path.resolve(
  // Only read at build time, so there is nothing to trace into the output.
  /*turbopackIgnore: true*/ process.cwd(),
  process.env.BLOG_CONTENT_DIR || '.blog-content'
);

// The content repo's images/ folder, served from public/blog-assets.
const ASSETS_URL = '/i/blog-assets';

// Posts reference images relative to themselves (../images/...), so they also
// preview correctly on GitHub. Map those onto the public URL.
export function resolveBlogAssetUrl(src: string): string {
  return src.startsWith('../images/')
    ? `${ASSETS_URL}/${src.slice('../images/'.length)}`
    : src;
}

function parsePost(fileName: string, source: string): BlogPost {
  const { data, content } = matter(source);
  const slug = path.basename(fileName, '.md');

  for (const field of ['title', 'description', 'author', 'publishedAt']) {
    if (!data[field]) {
      throw new Error(`Blog post "${fileName}" is missing "${field}"`);
    }
  }

  if (!authors.some((author) => author.id === data.author)) {
    throw new Error(
      `Blog post "${fileName}" has an unknown author "${data.author}"`
    );
  }

  // Unquoted YAML dates are parsed into Date objects.
  const publishedAt =
    data.publishedAt instanceof Date
      ? data.publishedAt.toISOString().slice(0, 10)
      : String(data.publishedAt);

  return {
    slug,
    title: data.title,
    description: data.description,
    author: data.author as AuthorIds,
    publishedAt,
    featuredImage: data.featuredImage
      ? resolveBlogAssetUrl(data.featuredImage)
      : undefined,
    draft: data.draft === true,
    content,
  };
}

export const getBlogPosts = cache(async (): Promise<BlogPost[]> => {
  const postsDir = path.join(CONTENT_DIR, 'posts');

  let fileNames: string[];
  try {
    fileNames = await readdir(postsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }

  const posts = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .map(async (fileName) =>
        parsePost(
          fileName,
          await readFile(path.join(postsDir, fileName), 'utf8')
        )
      )
  );

  return posts
    .filter((post) => !post.draft || process.env.NODE_ENV === 'development')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
});

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}
