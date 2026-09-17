import { plansToNames } from '@trylinky/common';

export { plansToNames };

export const getNextPlan = (planId?: string | null) => {
  if (!planId) {
    return null;
  }

  switch (planId) {
    case 'freeLegacy':
      return 'premium';
    case 'premium':
      return 'team';
    case 'team':
      return null;
    default:
      return null;
  }
};
