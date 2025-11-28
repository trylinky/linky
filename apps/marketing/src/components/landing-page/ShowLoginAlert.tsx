'use client';

import { toast } from '@trylinky/ui';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function ShowLoginAlert() {
  const params = useSearchParams();

  useEffect(() => {
    if (params.get('error')) {
      setTimeout(() => {
        toast({
          title: 'Login failed',
          variant: 'error',
        });
      }, 500);
    }
  }, [params]);

  return <></>;
}
