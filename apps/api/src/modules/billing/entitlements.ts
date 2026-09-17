import db from '@/lib/db';
import { isAdminUser } from '@/lib/roles';
import type { Entitlements, Tier } from '@trylinky/common';

export type SubscriptionLike = {
  plan: string;
  status: string;
  trialEnd: Date | null;
};

// Free is marketed as "5 blocks". Every page starts with one header block,
// so the enforced per-page limit is 6: the header plus five the user adds.
export const FREE_LIMITS = { pages: 1, blocksPerPage: 6 } as const;
// The pre-existing abuse caps, unchanged.
export const PAID_LIMITS = { pages: 100, blocksPerPage: 100 } as const;

const PAID_PLANS = new Set(['premium', 'team']);
// `past_due` keeps access: once trials cancel themselves at trial end (see
// create-new-subscription.ts), only a previously paying customer with a
// failed card can be past_due, and Stripe is still retrying for them.
const ENTITLED_STATUSES = new Set(['active', 'trialing', 'past_due']);

export function isPaywallEnforced(): boolean {
  return process.env.PAYWALL_ENFORCED === 'true';
}

export function resolveTier(
  sub: SubscriptionLike | null | undefined,
  opts: { isAdmin?: boolean } = {}
): Tier {
  if (opts.isAdmin) {
    return 'team';
  }

  if (!sub || !PAID_PLANS.has(sub.plan)) {
    return 'free';
  }

  if (!ENTITLED_STATUSES.has(sub.status)) {
    return 'free';
  }

  return sub.plan as Tier;
}

export function resolveEntitlements(
  sub: SubscriptionLike | null | undefined,
  opts: { isAdmin?: boolean; enforced?: boolean; now?: Date } = {}
): Entitlements {
  const enforced = opts.enforced ?? isPaywallEnforced();
  const now = opts.now ?? new Date();
  const tier = resolveTier(sub, { isAdmin: opts.isAdmin });
  const paid = tier !== 'free' || !enforced;

  const trialActive = sub?.status === 'trialing' && sub.trialEnd != null;
  const daysLeft = trialActive
    ? Math.max(
        0,
        Math.ceil((sub!.trialEnd!.getTime() - now.getTime()) / 86_400_000)
      )
    : null;

  return {
    tier,
    limits: paid ? { ...PAID_LIMITS } : { ...FREE_LIMITS },
    features: {
      analytics: paid,
      privatePages: paid,
      customDomain: paid,
      verification: paid,
    },
    trial: { active: trialActive, daysLeft },
  };
}

/**
 * The one loader every gate uses. `userId` is optional so server-to-server
 * callers (page load) can resolve without a session; when given, site
 * admins are exempt from every limit.
 */
export async function getEntitlementsForOrganization(
  organizationId: string,
  userId?: string
): Promise<Entitlements> {
  const [sub, dbUser] = await Promise.all([
    db.query.subscription.findFirst({
      where: (s, { eq }) => eq(s.referenceId, organizationId),
      columns: { plan: true, status: true, trialEnd: true },
    }),
    userId
      ? db.query.user.findFirst({
          where: (u, { eq }) => eq(u.id, userId),
          columns: { role: true },
        })
      : Promise.resolve(null),
  ]);

  return resolveEntitlements(sub ?? null, { isAdmin: isAdminUser(dbUser) });
}
