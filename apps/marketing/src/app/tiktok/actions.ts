'use server';

import { apiServerFetch } from '@/lib/api-server';

export async function createNewOrchestration() {
  const response = await apiServerFetch('/orchestrators/create', {
    method: 'POST',
    body: JSON.stringify({
      type: 'TIKTOK',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error('Failed to create new orchestration');
  }

  return data.id;
}

export async function validateOrchestration(orchestrationId: string) {
  const response = await apiServerFetch(`/orchestrators/validate`, {
    method: 'POST',
    body: JSON.stringify({
      orchestrationId,
    }),
  });

  const data = await response.json();

  return data;
}

export async function runOrchestration(orchestrationId: string) {
  const response = await apiServerFetch(`/orchestrators/tiktok/create`, {
    method: 'POST',
    body: JSON.stringify({
      orchestrationId,
    }),
  });

  const data = await response.json();

  return data;
}
