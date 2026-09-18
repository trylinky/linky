import './blog.css';
import { BlogIndex } from '@/components/blog/blog-index';
import { getBlogPosts } from '@/lib/blog/posts';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Blog | Linky',
  description:
    'Product updates, tutorials, and advice on getting more from your link in bio, from the Linky team.',
  alternates: { canonical: 'https://lin.ky/i/blog' },
};

export default async function ArticlesLandingPage() {
  const blogPosts = await getBlogPosts();
  if (!blogPosts.length) notFound();

  return <BlogIndex posts={blogPosts} page={1} />;
}
