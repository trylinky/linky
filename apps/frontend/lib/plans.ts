export const plansToNames: Record<string, string> = {
  legacyFree: 'Free',
  premium: 'Premium',
  team: 'Team',
};

export const getNextPlan = (planId?: string | null) => {
  if (!planId) {
    return null;
  }

  switch (planId) {
    case 'legacyFree':
      return 'premium';
    case 'premium':
      return 'team';
    case 'team':
      return null;
    default:
      return null;
  }
};
