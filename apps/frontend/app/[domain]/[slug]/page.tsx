import Grid from './grid';
import {
  getPageIdBySlugOrDomain,
  getPageLayout,
  getPageLoadData,
} from '@/app/lib/actions/page-actions';
import { getSession } from '@/app/lib/auth';
import { renderBlock } from '@/lib/blocks/ui';
import { isUserAgentMobile } from '@/lib/user-agent';
import { type BlockModel, type IntegrationModel } from '@trylinky/prisma/types';
import type { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { Layout } from 'react-grid-layout';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata(
  props: { params: Promise<{ slug: string; domain: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;
  const isCustomDomain =
    decodeURIComponent(params.domain) !== process.env.NEXT_PUBLIC_ROOT_DOMAIN;

  const corePage = await getPageIdBySlugOrDomain(params.slug, params.domain);

  if (!corePage) {
    return {};
  }

  const page = await getPageLoadData(corePage.id);

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
  IntegrationModel,
  'id' | 'createdAt' | 'type'
>[];

export default async function Page(props: { params: Promise<Params> }) {
  const params = await props.params;
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const headersList = await headers();

  const { user } = session?.data ?? {};

  const isLoggedIn = !!user;

  const corePage = await getPageIdBySlugOrDomain(params.slug, params.domain);

  if (!corePage) {
    return notFound();
  }

  const [layout, page] = await Promise.all([
    getPageLayout(corePage.id),
    getPageLoadData(corePage.id),
  ]);

  if (!page) {
    notFound();
  }

  let isEditMode = false;

  if (
    session &&
    page?.organizationId === session?.data?.session.activeOrganizationId
  ) {
    isEditMode = true;
  }

  if (page.publishedAt == null && !isEditMode) {
    return notFound();
  }

  if (
    page.customDomain &&
    page.customDomain !== decodeURIComponent(params.domain) &&
    !isEditMode
  ) {
    redirect(`//${page.customDomain}`);
  }

  const isMobile = isUserAgentMobile(headersList.get('user-agent'));
  const mergedIds = [
    ...(layout?.config as unknown as Layout[]),
    ...(layout?.mobileConfig as unknown as Layout[]),
  ].map((item) => item.i);

  const pageLayout = {
    sm: (layout?.config as unknown as Layout[]) || [],
    xxs: (layout?.mobileConfig as unknown as Layout[]) || [],
  };

  return (
    <Grid
      isPotentiallyMobile={isMobile}
      layout={pageLayout}
      editMode={isEditMode}
      isLoggedIn={isLoggedIn}
    >
      {page.blocks
        .filter((block: BlockModel) => mergedIds.includes(block.id))
        .map((block: BlockModel) => {
          return (
            <section
              key={block.id}
              style={{ fontFamily: 'var(--font-sys-body)' }}
            >
              {renderBlock(block, page.id, isEditMode)}
            </section>
          );
        })}
    </Grid>
  );
}
