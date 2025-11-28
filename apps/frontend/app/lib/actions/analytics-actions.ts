'use server';

import { getSession } from '@/app/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

const TINYBIRD_API_URL = 'https://api.us-west-2.aws.tinybird.co';

interface AnalyticsStats {
  totals: {
    views: number;
    uniqueVisitors: number;
  };
  data: { date: string; total_views: number; unique_visitors: number }[];
}

interface AnalyticsLocations {
  location: string;
  hits: number;
  visits: number;
}

export async function getPageAnalytics(pageId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { user, session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: { code: 'UNAUTHORIZED' } };
  }

  // Verify user has access to this page
  const page = await prisma.page.findUnique({
    where: {
      id: pageId,
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
        members: {
          some: {
            userId: user?.id,
          },
        },
      },
    },
  });

  if (!page) {
    return { error: { code: 'PAGE_NOT_FOUND' } };
  }

  const tinybirdToken = process.env.TINYBIRD_API_KEY;

  if (!tinybirdToken) {
    return { error: { code: 'TINYBIRD_NOT_CONFIGURED' } };
  }

  try {
    // Fetch stats
    const statsUrl = new URL(
      `${TINYBIRD_API_URL}/v0/pipes/page_analytics_stats.json`
    );
    statsUrl.searchParams.set('pageId', pageId);

    const statsResponse = await fetch(statsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tinybirdToken}`,
      },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!statsResponse.ok) {
      return { error: { code: 'TINYBIRD_ERROR' } };
    }

    const statsData = await statsResponse.json();

    // Fetch locations
    const locationsUrl = new URL(
      `${TINYBIRD_API_URL}/v0/pipes/page_analytics_locations.json`
    );
    locationsUrl.searchParams.set('pageId', pageId);

    const locationsResponse = await fetch(locationsUrl.toString(), {
      headers: {
        Authorization: `Bearer ${tinybirdToken}`,
      },
      next: { revalidate: 60 },
    });

    if (!locationsResponse.ok) {
      return { error: { code: 'TINYBIRD_ERROR' } };
    }

    const locationsData = await locationsResponse.json();

    // Calculate totals
    const totals = {
      views: 0,
      uniqueVisitors: 0,
    };

    const data = (statsData.data || []).map(
      (row: { date: string; total_views: number; unique_visitors: number }) => {
        totals.views += row.total_views || 0;
        totals.uniqueVisitors += row.unique_visitors || 0;
        return {
          date: row.date,
          total_views: row.total_views || 0,
          unique_visitors: row.unique_visitors || 0,
        };
      }
    );

    return {
      stats: {
        totals,
        data,
      },
      locations: (locationsData.data || []).map(
        (row: { location: string; hits: number; visits: number }) => ({
          location: row.location,
          hits: row.hits || 0,
          visits: row.visits || 0,
        })
      ),
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return { error: { code: 'FETCH_ERROR' } };
  }
}
