import { trustedOrigins } from '@/lib/origins';
import prisma from '@/lib/prisma';
import { createContact } from '@/lib/resend';
import { createUserInitialFlags, handleUserCreated } from '@/lib/user-created';
import {
  sendMagicLinkEmail,
  sendOrganizationInvitationEmail,
  sendWelcomeEmail,
  sendWelcomeFollowUpEmail,
} from '@/modules/notifications/service';
import { sendNewUserSlackMessage } from '@/modules/slack/service';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, magicLink, organization } from 'better-auth/plugins';

export const auth = betterAuth({
  baseUrl: process.env.API_BASE_URL,
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
  },
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  socialProviders: {
    google: {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
      // redirectURI: `${process.env.API_BASE_URL}/api/auth/callback/google`,
    },
    twitter: {
      clientId: process.env.AUTH_TWITTER_CLIENT_ID as string,
      clientSecret: process.env.AUTH_TWITTER_CLIENT_SECRET as string,
      // redirectURI: `${process.env.API_BASE_URL}/api/auth/callback/twitter`,
    },
    tiktok: {
      clientId: process.env.AUTH_TIKTOK_CLIENT_ID as string,
      clientKey: process.env.AUTH_TIKTOK_CLIENT_KEY as string,
      clientSecret: process.env.AUTH_TIKTOK_CLIENT_SECRET as string,
      // redirectURI: `${process.env.API_BASE_URL}/api/auth/callback/tiktok`,
    },
  },
  advanced: {
    generateId: false, // Let the database generate UUIDs
    crossSubDomainCookies:
      process.env.NODE_ENV === 'production'
        ? {
            enabled: true,
            domain: '.lin.ky',
          }
        : {
            enabled: false,
          },
    defaultCookieAttributes: {
      secure: true,
      httpOnly: true,
      sameSite: 'none', // Allows CORS-based cookie sharing across subdomains
      partitioned: true, // New browser standards will mandate this for foreign cookies
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await handleUserCreated({ userId: user.id });
          await createUserInitialFlags(user.id);
          if (user.email) {
            await createContact(user.email);
            await sendWelcomeEmail(user.email);
            await sendWelcomeFollowUpEmail(user.email);
          }
          await sendNewUserSlackMessage(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const organization = await getActiveOrganization(session.userId);

          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id || null,
            },
          };
        },
      },
    },
  },
  plugins: [
    admin(),
    organization({
      allowUserToCreateOrganization: false,
      sendInvitationEmail: async (data) => {
        const inviteLink = `${process.env.APP_FRONTEND_URL}/invite/${data.id}`;

        sendOrganizationInvitationEmail({
          email: data.email,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          teamName: data.organization.name,
          inviteLink,
        });
      },
    }),
    magicLink({
      sendMagicLink: async ({ email, token }) => {
        // There's a bug in better-auth where the invite link is not using
        // the API_BASE_URL, so we need to construct it manually

        const callbackUrl = new URL(
          '/edit',
          process.env.APP_FRONTEND_URL as string
        );

        const magicLinkUrl = new URL(
          `/api/auth/magic-link/verify?token=${token}&callbackURL=${callbackUrl.toString()}`,
          process.env.API_BASE_URL as string
        );

        await sendMagicLinkEmail({ email, url: magicLinkUrl.toString() });
      },
    }),
  ],
});

const getActiveOrganization = async (userId: string) => {
  const organization = await prisma.organization.findFirst({
    where: {
      members: { some: { userId } },
    },
  });

  return organization;
};
