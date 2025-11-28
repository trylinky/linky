import { apiServerFetch } from '@/app/lib/api-server';

export async function getTeamIntegrations() {
  const res = await apiServerFetch('/integrations/me', {
    method: 'GET',
  });

  const data = await res.json();

  return data;
}
