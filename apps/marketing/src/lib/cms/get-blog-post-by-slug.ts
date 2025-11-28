import { client } from '@/lib/cms/client';
import { BlogPost } from '@/lib/cms/types';

interface BlogPostResponse {
  blogPost: BlogPost;
}

const GET_POST_QUERY = `
  query GetBlogPosts($slug: String!) {
    blogPost(where: { slug: $slug }) {
      title
      author
      content {
        html
        raw
      }
      author
      slug
      displayedPublishedAt
      description
      featuredImage {
        url
      }
    }
  }
`;

export async function getBlogPost(slug: string): Promise<BlogPost> {
  try {
    const variables = { slug };
    const response = await client.request<BlogPostResponse>(
      GET_POST_QUERY,
      variables
    );

    if (!response.blogPost) {
      throw new Error(`Blog post with slug "${slug}" not found`);
    }

    return response.blogPost;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch blog post: ${error.message}`);
    }
    throw new Error('Failed to fetch blog post: Unknown error occurred');
  }
}
