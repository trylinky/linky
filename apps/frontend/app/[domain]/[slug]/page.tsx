import Grid, { PageConfig } from './grid';
import {
  getPublicPageBySlugOrDomain,
  getPublicPageLayout,
  getPublicPageLoadData,
} from '@/app/lib/actions/page-actions';
import { renderBlock } from '@/lib/blocks/ui';
import { Block, Integration } from '@trylinky/prisma';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ slug: string; domain: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const isCustomDomain =
    decodeURIComponent(params.domain) !== process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  const corePage = await getPublicPageBySlugOrDomain(params.slug, params.domain);

  if (!corePage) {
    return {};
  }

  const page = await getPublicPageLoadData(corePage.id);

  if (!page || !page.publishedAt) {
    return {};
  }

  const parentMeta = await parent;

  return {
    openGraph: {
      images: [
        `${process.env.NEXT_PUBLIC_APP_URL}/${page?.slug}/opengraph-image`,
      ],
    },
    twitter: {
      images: [
        `${process.env.NEXT_PUBLIC_APP_URL}/${page?.slug}/opengraph-image`,
      ],
    },
    title: `${page?.metaTitle} - Linky` || parentMeta.title?.absolute,
    description: page?.metaDescription || parentMeta.description,
    alternates: {
      canonical: isCustomDomain
        ? `https://${params.domain}`
        : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${params.slug}`,
    },
  };
}

interface Params {
  slug: string;
  domain: string;
}

export type InitialDataUsersIntegrations = Pick<
  Integration,
  'id' | 'createdAt' | 'type'
>[];

export default async function Page(props: { params: Promise<Params> }) {
  const params = await props.params;

  const corePage = await getPublicPageBySlugOrDomain(params.slug, params.domain);

  if (!corePage) {
    return notFound();
  }

  const [layout, page] = await Promise.all([
    getPublicPageLayout(corePage.id),
    getPublicPageLoadData(corePage.id),
  ]);

  if (!page) {
    notFound();
  }

  if (page.publishedAt == null) {
    return notFound();
  }

  if (
    page.customDomain &&
    page.customDomain !== decodeURIComponent(params.domain)
  ) {
    redirect(`//${page.customDomain}`);
  }

  const pageLayout = layout as unknown as PageConfig;
  const mergedIds = [...pageLayout.sm, ...pageLayout.xxs].map((item) => item.i);

  return (
    <Grid isPotentiallyMobile={false} layout={pageLayout}>
      {page.blocks
        .filter((block: Block) => mergedIds.includes(block.id))
        .map((block: Block) => {
          return (
            <section
              key={block.id}
              style={{ fontFamily: 'var(--font-sys-body)' }}
            >
              {renderBlock(block, page.id, false)}
            </section>
          );
        })}
    </Grid>
  );
}
