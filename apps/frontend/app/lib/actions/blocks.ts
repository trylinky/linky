import { apiServerFetch } from '@/app/lib/api-server';

export async function getEnabledBlocks() {
  const res = await apiServerFetch('/blocks/enabled-blocks', {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}
