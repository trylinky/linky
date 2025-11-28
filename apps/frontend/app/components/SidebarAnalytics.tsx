import { InternalApi } from '@trylinky/common';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  SidebarContentHeader,
  SidebarGroup,
  SidebarGroupContent,
  Card,
  CardContent,
  Skeleton,
} from '@trylinky/ui';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useSWRConfig } from 'swr';

const dataPoints = [
  {
    name: 'Unique visitors',
    key: 'unique_visitors',
    description: 'Showing unique visitors for the last 7 days',
  },
  {
    name: 'Page views',
    key: 'total_views',
    description: 'Showing total views for the last 7 days',
  },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function SidebarAnalytics() {
  const [showPlaceholder, setShowPlaceholder] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<{
    stats: {
      totals: {
        views: number;
        uniqueVisitors: number;
      };
      data: { date: string; total_views: number; unique_visitors: number }[];
    };
    locations: {
      location: string;
      hits: number;
      visits: number;
    }[];
  }>({
    stats: {
      totals: {
        views: 0,
        uniqueVisitors: 0,
      },
      data: [],
    },
    locations: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const { cache } = useSWRConfig();
  const pageId = cache.get('pageId');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const responseData = await InternalApi.get(
          `/analytics/pages/${pageId}`
        );

        if (responseData.error?.code) {
          setShowPlaceholder(true);
          return;
        }

        if (!responseData || Object.keys(responseData).length === 0) {
          setShowPlaceholder(true);
          return;
        }

        setAnalyticsData(responseData);
      } catch (error) {
        console.error(error);
        setShowPlaceholder(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pageId]);

  if (showPlaceholder) {
    return <SidebarAnalyticsComingsoon />;
  }

  return (
    <>
      <SidebarContentHeader title="Analytics"></SidebarContentHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          {dataPoints.map((dataPoint) => (
            <div key={dataPoint.key}>
              <Card className="shadow-none mb-4">
                <CardContent>
                  <div className="flex flex-col gap-0 mt-4 mb-4">
                    {isLoading ? (
                      <>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">
                          {dataPoint.key === 'total_views'
                            ? analyticsData.stats.totals.views
                            : analyticsData.stats.totals.uniqueVisitors}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {dataPoint.name}
                        </span>
                      </>
                    )}
                  </div>
                  <ChartContainer config={chartConfig}>
                    {isLoading ? (
                      <div className="h-[120px] flex items-center justify-center">
                        <Skeleton className="h-[100px] w-full" />
                      </div>
                    ) : (
                      <AreaChart
                        accessibilityLayer
                        data={analyticsData.stats.data}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            });
                          }}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Area
                          dataKey={dataPoint.key}
                          type="natural"
                          fill="#aec8ff"
                          fillOpacity={0.4}
                        />
                      </AreaChart>
                    )}
                  </ChartContainer>
                  <span className="text-xs text-neutral-500 block">
                    {dataPoint.description}
                  </span>
                </CardContent>
              </Card>
            </div>
          ))}

          <Card className="shadow-none mb-4">
            <CardContent>
              <div className="flex flex-col gap-0 mt-4 mb-4">
                <span className="text-lg font-semibold mb-4">
                  Top Locations
                </span>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyticsData.locations.map((location, index) => (
                      <div
                        key={location.location}
                        className="flex items-center gap-2"
                      >
                        <Image
                          src={`https://flag.vercel.app/s/${location.location}.svg`}
                          alt={location.location}
                          width={20}
                          height={15}
                          className="rounded-sm"
                        />
                        <div className="flex-1 h-8 relative">
                          <div
                            className="absolute inset-y-0 left-0 bg-stone-100 rounded"
                            style={{
                              width: `${(location.hits / Math.max(...analyticsData.locations.map((l) => l.hits))) * 100}%`,
                            }}
                          />
                          <div className="absolute inset-y-0 left-2 flex items-center">
                            <span className="text-sm font-medium">
                              {location.location}
                            </span>
                          </div>
                          <div className="absolute inset-y-0 right-2 flex items-center">
                            <span className="text-sm text-stone-500">
                              {Math.round(
                                (location.hits /
                                  analyticsData.stats.totals.views) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}

export function SidebarAnalyticsComingsoon() {
  return (
    <>
      <SidebarContentHeader title="Analytics"></SidebarContentHeader>

      <SidebarGroup>
        <SidebarGroupContent>
          <div className="w-full p-6 bg-stone-50 rounded-lg flex flex-col items-center justify-center text-center">
            <span className="text-lg font-medium mb-2">
              Analytics coming soon
            </span>
            <span className="text-sm text-muted-foreground">
              We're still collecting data for this page. Please check back in a
              few days.
            </span>
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
