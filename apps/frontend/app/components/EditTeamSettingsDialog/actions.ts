'use server';

import { FormValues } from './EditTeamSettingsGeneralForm';
import { TeamInviteFormValues } from './EditTeamSettingsMembersForm';
import { generalTeamSettingsSchema, teamInviteSchema } from './shared';
import { auth, getSession } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { headers } from 'next/headers';

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

  const validatedValues = generalTeamSettingsSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      error: { message: validatedValues.error.errors[0].message },
    };
  }

  // Scoped to a membership the caller actually holds, so this cannot rename
  // another organization.
  const { count } = await prisma.organization.updateMany({
    where: {
      id: orgId,
      members: {
        some: {
          userId: user?.id,
        },
      },
    },
    data: {
      name: validatedValues.data.name,
    },
  });

  if (count === 0) {
    return {
      error: { message: 'You must be in a team to update team settings' },
    };
  }

  return { success: true };
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
