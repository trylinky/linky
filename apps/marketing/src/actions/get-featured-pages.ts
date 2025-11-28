import { apiServerFetch } from '@/lib/api-server';

type FeaturedPage = {
  id: string;
  slug: string;
  headerTitle: string;
  headerDescription: string;
};

export async function getFeaturedPages(): Promise<FeaturedPage[]> {
  const response = await apiServerFetch('/marketing/featured-pages', {
    method: 'GET',
    next: {
      revalidate: 600, // Revalidate every 10 minutes
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch featured pages');
  }

  return await response.json();
}
