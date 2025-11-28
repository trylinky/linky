'use server';

import { getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

export async function acceptInvite(invitationId: string) {
  const headersList = await headers();

  const session = await getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  if (!session) {
    return {
      error: 'You must be logged in to accept an invite',
    };
  }

  try {
    const dbInvite = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
      },
      select: {
        organization: {
          select: {
            id: true,
          },
        },
      },
    });

    const org = await prisma.organization.findUnique({
      where: {
        id: dbInvite?.organization.id,
      },
      select: {
        subscription: {
          select: {
            seats: true,
          },
        },
        members: {
          select: {
            id: true,
          },
        },
      },
    });

    if (org?.members && org?.subscription?.seats) {
      if (org.members.length >= org.subscription.seats) {
        return {
          error: 'You have reached the maximum number of seats for your plan',
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);

    return {
      error: 'Failed to accept invite',
    };
  }
}
