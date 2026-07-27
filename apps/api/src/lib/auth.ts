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
import { hasAvailableSeat } from '@/modules/organizations/utils';
import { sendNewUserSlackMessage } from '@/modules/slack/service';
import { PrismaClient } from '@trylinky/prisma';
import { betterAuth, BetterAuthPlugin } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import { admin, magicLink, organization } from 'better-auth/plugins';

export const auth = betterAuth({
  // `baseURL`, not `baseUrl` — the misspelling was silently ignored, so
  // better-auth fell back to deriving the origin from each incoming request.
  baseURL: process.env.API_BASE_URL,
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
  },
  trustedOrigins,
  database: prismaAdapter(prisma as PrismaClient, {
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
      clientKey: process.env.AUTH_TIKTOK_CLIENT_KEY as string,
      clientSecret: process.env.AUTH_TIKTOK_CLIENT_SECRET as string,
      // redirectURI: `${process.env.API_BASE_URL}/api/auth/callback/tiktok`,
    },
  },
  advanced: {
    database: {
      generateId: false, // Let the database generate UUIDs
    },
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
    admin() as unknown as BetterAuthPlugin,
    organization({
      allowUserToCreateOrganization: false,
      organizationHooks: {
        /**
         * Seat enforcement has to live here, not in the caller. The frontend
         * checked seats in a server action and then called
         * `organization.acceptInvitation` separately, so anyone hitting the
         * better-auth endpoint directly joined regardless of the plan limit.
         * This hook is awaited before the invitation is accepted, so throwing
         * aborts the join.
         */
        beforeAcceptInvitation: async ({ organization: invitedTo }) => {
          if (await hasAvailableSeat(invitedTo.id)) {
            return;
          }

          throw new APIError('FORBIDDEN', {
            message:
              'This team has reached the maximum number of seats for its plan.',
          });
        },
      },
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
        // Built explicitly rather than relying on better-auth's own link.
        // This originally worked around what looked like a better-auth bug —
        // it was actually the `baseUrl`/`baseURL` typo above leaving the
        // server with no configured origin. Kept explicit because it is
        // unambiguous about which host each half of the URL points at.

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
  const organization = await prisma?.organization.findFirst({
    where: {
      members: { some: { userId } },
    },
  });

  return organization;
};
