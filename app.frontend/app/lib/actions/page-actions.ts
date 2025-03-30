import { apiServerFetch } from '@/app/lib/api-server';

export async function getPageIdBySlugOrDomain(slug: string, domain: string) {
  const res = await apiServerFetch(
    `/pages/internal/slug-or-domain?slug=${slug}&domain=${domain}`,
    {
      method: 'GET',
      headers: {
        'x-api-key': process.env.INTERNAL_API_KEY as string,
      },
    }
  );

  if (res.status !== 200) {
    return null;
  }

  const data = await res.json();

  return data;
}

export async function getPageLoadData(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/internal/load`, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.INTERNAL_API_KEY as string,
    },
  });

  const data = await res.json();

  return data;
}

export async function getPageTheme(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/theme`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageLayout(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/layout`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageSettings(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/settings`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}

export async function getPageBlocks(pageId: string) {
  const res = await apiServerFetch(`/pages/${pageId}/blocks`, {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}
