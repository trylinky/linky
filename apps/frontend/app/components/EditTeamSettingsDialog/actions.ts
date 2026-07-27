'use server';

import { FormValues } from './EditTeamSettingsGeneralForm';
import { TeamInviteFormValues } from './EditTeamSettingsMembersForm';
import { teamInviteSchema } from './shared';
import { auth, getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

// NOTE: this handler validates access and then does nothing - see the TODO
// at the end. `values` is unused because the update was never implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const updateGeneralTeamSettings = async (values: FormValues) => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    return {
      error: { message: 'You must be logged in to update team settings' },
    };
  }

  const { user, session: sessionData } = session?.data ?? {};

  const orgId = sessionData?.activeOrganizationId;

  if (!orgId) {
    return {
      error: { message: 'You must be in a team to update team settings' },
    };
  }

  const team = await prisma.organization.findFirst({
    where: {
      id: orgId,
      members: {
        some: {
          userId: user?.id,
        },
      },
    },
  });

  if (!team) {
    return {
      error: { message: 'You must be in a team to update team settings' },
    };
  }

  // TODO: Update team settings
};

export const createTeamInvite = async (values: TeamInviteFormValues) => {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  if (!session) {
    return {
      error: { message: 'You must be logged in to create a team invite' },
    };
  }

  const validatedValues = teamInviteSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      error: { message: validatedValues.error.message },
    };
  }

  try {
    await auth.organization.inviteMember({
      email: values.email,
      role: 'member',
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error(error);
    return {
      error: { message: 'Failed to create invite' },
    };
  }
};
