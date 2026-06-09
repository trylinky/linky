import { RenderPageTheme } from '@/app/[domain]/[slug]/render-page-theme';
import { LinkyProviders } from '@/app/components/LinkyProviders';
import { ShareButton } from '@/app/components/ShareButton';
import {
  getPublicPageBlocks,
  getPublicPageBySlugOrDomain,
  getPublicPageLayout,
  getPublicPageTheme,
} from '@/app/lib/actions/page-actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';

export default async function PageLayout(props: {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
    domain: string;
  }>;
}) {
  const params = await props.params;
  const { children } = props;

  // Combine initial page fetch with settings to reduce queries
  const page = await getPublicPageBySlugOrDomain(params.slug, params.domain);

  if (!page) {
    return notFound();
  }

  if (!page.publishedAt) {
    return notFound();
  }

  // Batch fetch core page data
  const [{ blocks }, pageLayout, pageTheme] = await Promise.all([
    getPublicPageBlocks(page.id),
    getPublicPageLayout(page.id),
    getPublicPageTheme(page.id),
  ]);

  const initialData: Record<string, any> = {
    [`/pages/${page.id}/layout`]: pageLayout,
    [`/pages/${page.id}/theme`]: pageTheme,
  };

  if (blocks && blocks.length > 0) {
    blocks.forEach((block: any) => {
      initialData[`/blocks/${block.id}`] = {
        blockData: block.data,
      };
    });
  }

  return (
    <LinkyProviders
      currentUserIsOwner={false}
      pageId={page.id}
      value={{
        fallback: initialData,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
      }}
    >
      {pageTheme?.publishedAt ? (
        <main className="bg-sys-bg-base min-h-screen app-page">
          <div className="w-full max-w-[672px] mx-auto px-3 md:px-6 gap-3 pb-8">
            <div className="w-full py-3 flex items-center">
              <ShareButton />
            </div>
            {children}

            <div className="w-full py-3 flex items-center justify-center">
              <Link
                href={`https://lin.ky/?utm_source=page_footer&utm_campaign=${page.slug}`}
                className="flex flex-col text-center justify-center"
              >
                <span className="uppercase text-[0.6rem] tracking-tight font-medium text-sys-title-secondary">
                  Made with{' '}
                </span>
                <span className="font-bold text-lg -mt-1 text-sys-title-primary">
                  linky
                </span>
              </Link>
            </div>
          </div>
        </main>
      ) : (
        children
      )}

      {pageTheme?.publishedAt && pageTheme?.backgroundImage && (
        <style>
          {`body {
                background: url(${pageTheme.backgroundImage}) no-repeat center center / cover fixed;
                }`}
        </style>
      )}

      <RenderPageTheme pageId={page.id} />

      {process.env.NEXT_PUBLIC_TINYBIRD_TRACKER_TOKEN && (
        <Script
          id="tinybird-tracker"
          strategy="lazyOnload"
          src="/assets/tracker.js"
          data-host="https://api.us-west-2.aws.tinybird.co"
          data-token={process.env.NEXT_PUBLIC_TINYBIRD_TRACKER_TOKEN}
          data-page-id={page.id}
        />
      )}
    </LinkyProviders>
  );
}
