export type Plan = 'legacyFree' | 'premium' | 'team';

export const plansToNames: Record<Plan, string> = {
  legacyFree: 'Free',
  premium: 'Premium',
  team: 'Team',
};
