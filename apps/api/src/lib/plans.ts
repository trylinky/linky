export const prices = {
  development: {
    freeLegacy: 'price_1Qzm2LJKLsVNmaiRvZE2YGN4',
    premium: 'price_1QA7JEJKLsVNmaiRillvBTsw',
    team: 'price_1R1OgeJKLsVNmaiREVIN3JNL',
  },
  production: {
    freeLegacy: 'price_1QzlZJJKLsVNmaiRvRdmReAD',
    premium: 'price_1R3asyJKLsVNmaiRJft5GJrG',
    team: 'price_1R3aueJKLsVNmaiR5EZ7pCg8',
  },
};

export const isTeamPlan = (priceId: string) => {
  return (
    priceId === prices.development.team || priceId === prices.production.team
  );
};
