import prisma from '@/lib/prisma';

export async function getIntegrationsForOrganizationId(organizationId: string) {
  const integrations = await prisma.integration.findMany({
    where: {
      organizationId,
      deletedAt: null,
    },
    select: {
      id: true,
      createdAt: true,
      type: true,
      displayName: true,
      blocks: {
        select: {
          page: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      },
    },
  });

  return integrations;
}

export async function disconnectIntegration(integrationId: string) {
  await prisma.integration.update({
    where: {
      id: integrationId,
    },
    data: {
      deletedAt: new Date(),
      encryptedConfig: null,
    },
  });

  await prisma.block.updateMany({
    where: {
      integrationId,
    },
    data: {
      integrationId: null,
    },
  });

  return {
    sucess: true,
  };
}
