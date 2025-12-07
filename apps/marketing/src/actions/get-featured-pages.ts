import { apiServerFetch } from '@/lib/api-server';

type FeaturedPage = {
  id: string;
  slug: string;
  headerTitle: string;
  headerDescription: string;
};

export async function getFeaturedPages(): Promise<FeaturedPage[]> {
  try {
    const response = await apiServerFetch('/marketing/featured-pages', {
      method: 'GET',
      next: {
        revalidate: 600, // Revalidate every 10 minutes
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch featured pages');
      return [];
    }

    return await response.json();
  } catch (error) {
    console.warn('Error fetching featured pages:', error);
    return [];
  }
}
