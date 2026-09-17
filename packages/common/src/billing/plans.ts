/** The value stored in Subscription.plan. `freeLegacy` is the database spelling. */
export type Plan = 'freeLegacy' | 'premium' | 'team';

export const plansToNames: Record<Plan, string> = {
  freeLegacy: 'Free',
  premium: 'Premium',
  team: 'Team',
};

/** What an organisation is entitled to, resolved from plan + status. */
export type Tier = 'free' | 'premium' | 'team';

export type PaywallFeature =
  | 'pages'
  | 'blocks'
  | 'analytics'
  | 'privatePages'
  | 'verification'
  | 'customDomain';

export interface Entitlements {
  tier: Tier;
  limits: { pages: number; blocksPerPage: number };
  features: {
    analytics: boolean;
    privatePages: boolean;
    customDomain: boolean;
    verification: boolean;
  };
  trial: { active: boolean; daysLeft: number | null };
}

export const UPGRADE_REQUIRED = 'UPGRADE_REQUIRED' as const;

export interface UpgradeRequiredError {
  code: typeof UPGRADE_REQUIRED;
  feature: PaywallFeature;
  message: string;
  label: string;
}
