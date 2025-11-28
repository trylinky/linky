import { Prisma } from '@prisma/client';

import prisma from '../../../lib/prisma';

// Get all of the integrations
// Get the team for the integration
// Get all of the pages for the team
// Get all of the blocks for the pages

// Loop through the blocks that of type "spotify-playing-now"
// Update the block with the integrationId

async function main() {
  await prisma.$transaction(
    async (tx) => {
      console.info('Starting migration');

      const teams = await tx.team.findMany();

      for (const team of teams) {
        // Get all of the integrations
        const integrations = await tx.integration.findMany({
          where: {
            deletedAt: null,
            teamId: team.id,
          },
        });

        const blocks = await tx.block.findMany({
          where: {
            page: {
              teamId: team.id,
            },
            type: {
              in: [
                'spotify-playing-now',
                'tiktok-follower-count',
                'tiktok-latest-post',
                'instagram-latest-post',
                'threads-follower-count',
              ],
            },
          },
        });

        for (const block of blocks) {
          let newIntegration;

          switch (block.type) {
            case 'spotify-playing-now':
              newIntegration = integrations.find((i) => i.type === 'spotify');
              break;
            case 'tiktok-follower-count':
              newIntegration = integrations.find((i) => i.type === 'tiktok');
              break;
            case 'tiktok-latest-post':
              newIntegration = integrations.find((i) => i.type === 'tiktok');
              break;
            case 'instagram-latest-post':
              newIntegration = integrations.find((i) => i.type === 'instagram');
              break;
            case 'threads-follower-count':
              newIntegration = integrations.find((i) => i.type === 'threads');
              break;
          }

          if (!newIntegration) {
            console.info('No integration found for block', block.id);
            continue;
          }

          // Final check to make sure the integration is for the team
          if (newIntegration.teamId !== team.id) {
            console.info('Integration is not for the team', block.id);
            continue;
          }

          await tx.block.update({
            where: {
              id: block.id,
            },
            data: {
              integration: {
                connect: {
                  id: newIntegration.id,
                },
              },
            },
          });
        }
      }
    },
    {
      maxWait: 20000, // 10 seconds max wait to connect to prisma
      timeout: 300000, // 5 minutes
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
