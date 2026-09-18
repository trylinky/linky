import '../../blog.css';
import { BlogIndex, paginatePosts } from '@/components/blog/blog-index';
import { getBlogPosts } from '@/lib/blog/posts';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Every page is generated at build time; page 1 lives at /blog itself.
export const dynamicParams = false;

export async function generateStaticParams() {
  const { pageCount } = paginatePosts(await getBlogPosts(), 1);
  return Array.from({ length: pageCount - 1 }, (_, i) => ({
    page: String(i + 2),
  }));
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> => {
  const { page } = await params;
  return {
    title: `Blog - Page ${page} | Linky`,
    alternates: { canonical: `https://lin.ky/i/blog/page/${page}` },
  };
};

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const page = Number((await params).page);
  const blogPosts = await getBlogPosts();
  const { pageCount } = paginatePosts(blogPosts, page);
  if (!Number.isInteger(page) || page < 2 || page > pageCount) notFound();

  return <BlogIndex posts={blogPosts} page={page} />;
}
