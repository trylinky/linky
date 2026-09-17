'use client';

import { internalApiFetcher, type Entitlements } from '@trylinky/common';
import useSWR from 'swr';

export function useEntitlements() {
  const { data, isLoading, mutate } = useSWR<Entitlements>(
    '/billing/entitlements',
    internalApiFetcher
  );

  return { entitlements: data, isLoading, mutate };
}
