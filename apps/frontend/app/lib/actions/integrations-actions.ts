'use server';

import { getSession } from '@/app/lib/auth';
import {
  disconnectIntegration as disconnectIntegrationService,
  getIntegrationsForOrganizationId,
} from '@/lib/api/integrations';
import { prisma } from '@/lib/prisma';
import { blocks, Blocks } from '@trylinky/blocks';
import { headers } from 'next/headers';

export async function getTeamIntegrations() {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return [];
  }

  return getIntegrationsForOrganizationId(sessionData.activeOrganizationId);
}

export async function disconnectIntegration(integrationId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: 'Unauthorized' };
  }

  // Verify integration belongs to user's organization
  const integration = await prisma.integration.findUnique({
    where: {
      id: integrationId,
      deletedAt: null,
      organizationId: sessionData.activeOrganizationId,
    },
  });

  if (!integration) {
    return { error: 'Integration not found' };
  }

  const result = await disconnectIntegrationService(integrationId);

  return result;
}

export async function connectBlockToIntegration(
  integrationId: string,
  blockId: string
) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: 'Unauthorized' };
  }

  const integration = await prisma.integration.findUnique({
    where: {
      id: integrationId,
      deletedAt: null,
      organization: {
        id: sessionData.activeOrganizationId,
      },
    },
  });

  if (!integration) {
    return { error: 'Integration not found' };
  }

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organizationId: sessionData.activeOrganizationId,
      },
    },
  });

  if (!block) {
    return { error: 'Block not found' };
  }

  const allowedIntegrationForBlock =
    blocks[block.type as Blocks].integrationType;

  if (allowedIntegrationForBlock !== integration.type) {
    return { error: 'Invalid integration for block' };
  }

  try {
    await prisma.block.update({
      where: {
        id: blockId,
      },
      data: {
        integration: {
          connect: {
            id: integrationId,
          },
        },
      },
    });

    return { success: true };
  } catch (error) {
    return { error: 'Failed to connect block to integration' };
  }
}

export async function disconnectBlockFromIntegration(blockId: string) {
  const session = await getSession({
    fetchOptions: { headers: await headers() },
  });

  const { session: sessionData } = session?.data ?? {};

  if (!session || !sessionData?.activeOrganizationId) {
    return { error: 'Unauthorized' };
  }

  const block = await prisma.block.findUnique({
    where: {
      id: blockId,
      page: {
        organizationId: sessionData.activeOrganizationId,
      },
    },
  });

  if (!block) {
    return { error: 'Block not found' };
  }

  await prisma.block.update({
    where: {
      id: blockId,
    },
    data: {
      integration: {
        disconnect: true,
      },
    },
  });

  return { success: true };
}
