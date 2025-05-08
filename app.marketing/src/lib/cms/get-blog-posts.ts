import { client } from '@/lib/cms/client';
import { BlogPost } from '@/lib/cms/types';

interface BlogPostResponse {
  blogPosts: BlogPost[];
}

const GET_POST_QUERY = `
  query GetBlogPosts {
    blogPosts(orderBy: displayedPublishedAt_DESC, first: 50) {
      title
      author
      author
      displayedPublishedAt
      description
      featuredImage {
        url
      }
      slug
    }
  }
`;

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await client.request<BlogPostResponse>(GET_POST_QUERY);

    if (!response.blogPosts) {
      throw new Error(`Blog posts not found`);
    }

    return response.blogPosts;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch blog posts: ${error.message}`);
    }
    throw new Error('Failed to fetch blog posts: Unknown error occurred');
  }
}
