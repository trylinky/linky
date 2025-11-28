import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/slugs/generator/generate-slug';
import {
  getOrchestration,
  updateOrchestrationWithPage,
} from './service';

interface TikTokUserInfoResponse {
  data?: {
    user?: {
      display_name?: string;
      avatar_url?: string;
      bio_description?: string;
      profile_deep_link?: string;
      username?: string;
      follower_count?: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

async function getTikTokUserPublicInfo(username: string): Promise<TikTokUserInfoResponse | null> {
  // Note: TikTok's public API has limitations
  // This is a placeholder for when/if we have proper API access
  // For now, we'll create a basic page structure
  return null;
}

export async function createPageFromTikTokOrchestration(orchestrationId: string) {
  const orchestration = await getOrchestration(orchestrationId);

  if (!orchestration) {
    return { error: 'Orchestration not found' };
  }

  // Check if page already generated
  if (orchestration.pageId) {
    const page = await prisma.page.findUnique({
      where: { id: orchestration.pageId },
      select: { slug: true },
    });

    return { pageSlug: page?.slug };
  }

  // Check if expired
  if (new Date() > orchestration.expiresAt) {
    return { error: 'Orchestration expired' };
  }

  try {
    // Generate a unique slug
    const slug = await generateSlug();

    // Create a basic page with TikTok-themed layout
    const page = await prisma.page.create({
      data: {
        slug,
        config: {
          sm: [],
          xxs: [],
        },
        mobileConfig: {
          sm: [],
          xxs: [],
        },
        publishedAt: new Date(),
      },
    });

    // Create header block
    await prisma.block.create({
      data: {
        pageId: page.id,
        type: 'header',
        config: {
          title: 'My TikTok Page',
          description: 'Welcome to my page!',
          avatar: {
            src: 'https://cdn.lin.ky/default-data/avatar.png',
          },
          showVerifiedBadge: false,
          verifiedPageTitle: '',
          alignment: 'center',
        },
        data: {},
      },
    });

    // Create a link bar block for TikTok
    await prisma.block.create({
      data: {
        pageId: page.id,
        type: 'link-bar',
        config: {
          link: 'https://tiktok.com',
          label: 'Follow me on TikTok',
        },
        data: {},
      },
    });

    // Update orchestration with page reference
    await updateOrchestrationWithPage(orchestrationId, page.id);

    return { pageSlug: page.slug };
  } catch (error) {
    console.error('Error creating page from TikTok orchestration:', error);
    return { error: 'Failed to create page' };
  }
}
