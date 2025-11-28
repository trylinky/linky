'use server';

import { getAuthSession } from '@/lib/api/auth';
import { hideOnboardingTour as hideOnboardingTourService } from '@/lib/api/flags';
import { captureException } from '@sentry/nextjs';
import { auth } from '@trylinky/common';

export async function signOut() {
  await auth.signOut();
}

export async function hideOnboardingTour() {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return { success: false };
    }

    const result = await hideOnboardingTourService(session.user.id);

    return result;
  } catch (error) {
    captureException(error);

    return {
      success: false,
    };
  }
}
