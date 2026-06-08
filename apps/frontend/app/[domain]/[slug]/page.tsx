import Grid, { PageConfig } from './grid';
import {
  getPublicPageBySlugOrDomain,
  getPublicPageLayout,
  getPublicPageLoadData,
} from '@/app/lib/actions/page-actions';
import { renderBlock } from '@/lib/blocks/ui';
import { Block, Integration } from '@trylinky/prisma';
import {
  buildProfilePageSchema,
  personInputFromPage,
  serializeJsonLd,
  shouldIndexPage,
  type PageIndexInput,
} from '@trylinky/seo';
import type { Metadata, ResolvingMetadata } from 'next';
import { notFound, redirect } from 'next/navigation';

export const dynamicParams = true;

function buildIndexInput(page: any): PageIndexInput {
  return {
    publishedAt: page.publishedAt ?? null,
    customDomain: page.customDomain ?? null,
    verifiedAt: page.verifiedAt ?? null,
    isFeatured: Boolean(page.isFeatured),
    isPaid: Boolean(page.isPaid),
    metaDescription: page.metaDescription ?? null,
    blocks: page.blocks ?? [],
  };
}

function canonicalUrlFor(page: any, domainParam: string): string {
  const isCustom = page.customDomain && page.customDomain === decodeURIComponent(domainParam);
  return isCustom
    ? `https://${page.customDomain}`
    : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/${page.slug}`;
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string; domain: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const params = await props.params;

  const corePage = await getPublicPageBySlugOrDomain(params.slug, params.domain);

  if (!corePage) {
    return {};
  }

  const page = await getPublicPageLoadData(corePage.id);

  if (!page || !page.publishedAt) {
    return {};
  }

  const parentMeta = await parent;

  const indexable = shouldIndexPage(buildIndexInput(page));

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
      canonical: canonicalUrlFor(page, params.domain),
    },
    robots: { index: indexable, follow: true },
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

  if (!page.publishedAt) {
    return notFound();
  }

  if (
    page.customDomain &&
    page.customDomain !== decodeURIComponent(params.domain)
  ) {
    redirect(`//${page.customDomain}`);
  }

  const canonicalUrl = canonicalUrlFor(page, params.domain);

  const indexable = shouldIndexPage(buildIndexInput(page));

  const personInput = indexable ? personInputFromPage({ blocks: page.blocks }, canonicalUrl) : null;
  const profileSchema = personInput ? buildProfilePageSchema(personInput) : null;

  const pageLayout = layout as unknown as PageConfig;
  const mergedIds = [...pageLayout.sm, ...pageLayout.xxs].map((item) => item.i);

  return (
    <>
      {profileSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(profileSchema) }}
        />
      )}
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
    </>
  );
}
