import { prisma } from '@/lib/prisma';
import { OrchestrationType } from '@trylinky/prisma';

export async function createOrchestration(type: OrchestrationType) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Expires in 1 hour

  const orchestration = await prisma.orchestration.create({
    data: {
      type,
      expiresAt,
    },
  });

  return orchestration;
}

export async function validateOrchestration(orchestrationId: string) {
  const orchestration = await prisma.orchestration.findUnique({
    where: { id: orchestrationId },
  });

  if (!orchestration) {
    return false;
  }

  // Check if expired
  if (new Date() > orchestration.expiresAt) {
    return false;
  }

  return true;
}

export async function getOrchestration(orchestrationId: string) {
  return prisma.orchestration.findUnique({
    where: { id: orchestrationId },
  });
}

export async function updateOrchestrationWithPage(
  orchestrationId: string,
  pageId: string
) {
  return prisma.orchestration.update({
    where: { id: orchestrationId },
    data: {
      pageId,
      pageGeneratedAt: new Date(),
    },
  });
}
