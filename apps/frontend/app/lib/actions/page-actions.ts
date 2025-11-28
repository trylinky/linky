import {
  getPageIdBySlugOrDomain as getPageIdBySlugOrDomainService,
  getPageLoadData as getPageLoadDataService,
  getPageThemeById,
  getPageLayoutById,
  getPageSettings as getPageSettingsService,
  getPageBlocks as getPageBlocksService,
} from '@/lib/api/pages';
import 'server-only';

export async function getPageIdBySlugOrDomain(slug: string, domain: string) {
  const pageIdAndPublishedAt = await getPageIdBySlugOrDomainService(
    slug,
    domain
  );

  if (!pageIdAndPublishedAt) {
    return null;
  }

  return {
    id: pageIdAndPublishedAt.id,
    publishedAt: pageIdAndPublishedAt.publishedAt,
    organizationId: pageIdAndPublishedAt.organizationId,
    slug: pageIdAndPublishedAt.slug,
  };
}

export async function getPageLoadData(pageId: string) {
  return getPageLoadDataService(pageId);
}

export async function getPageTheme(pageId: string) {
  const page = await getPageThemeById(pageId);

  if (!page) {
    return null;
  }

  return {
    theme: page.theme,
    publishedAt: page.publishedAt,
    organizationId: page.organizationId,
    backgroundImage: page.backgroundImage,
  };
}

export async function getPageLayout(pageId: string) {
  const page = await getPageLayoutById(pageId);

  if (!page) {
    return null;
  }

  return {
    config: page.config,
    mobileConfig: page.mobileConfig,
    publishedAt: page.publishedAt,
    organizationId: page.organizationId,
  };
}

export async function getPageSettings(pageId: string) {
  return getPageSettingsService(pageId);
}

export async function getPageBlocks(pageId: string) {
  return getPageBlocksService(pageId);
}
