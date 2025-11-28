'use client';

import { internalApiFetcher } from '../api/fetch';
import { InternalApi } from '../api/internal-api';
import { auth } from '../auth/auth';
import { LoginWidget } from '../auth/login-widget';
import {
  ArrowTrendingDownIcon,
  ArrowUpIcon,
  CheckBadgeIcon,
  CubeIcon,
  CubeTransparentIcon,
  HandThumbUpIcon,
  UserPlusIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
  PuzzlePieceIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
  toast,
} from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import useSWR from 'swr';

const tiers = [
  // {
  //   name: 'Free',
  //   id: 'free',
  //   description: 'The best way to get started',
  //   priceMonthly: '0',
  //   billingPeriod: 'free forever',
  //   highlights: [
  //     { description: 'Your own page', icon: GlobeAltIcon },
  //     { description: 'Add up to 5 blocks', icon: CubeIcon },
  //     {
  //       description: 'Instagram integration',
  //       icon: PuzzlePieceIcon,
  //     },
  //     {
  //       description: 'Spotify integration',
  //       icon: PuzzlePieceIcon,
  //     },
  //     {
  //       description: 'Custom themes',
  //       icon: PaintBrushIcon,
  //     },
  //   ],
  // },
  {
    name: 'Premium',
    id: 'premium',
    badge: 'Popular',
    description: 'For creators and creatives',
    priceMonthly: '4',
    billingPeriod: 'per month',
    highlights: [
      { description: 'Custom domains', icon: GlobeAltIcon },
      { description: 'Unlimited pages', icon: CubeTransparentIcon },
      { description: 'Unlimited blocks', icon: CubeIcon },
      { description: 'Verification badge', icon: CheckBadgeIcon },
      { description: 'Private pages', icon: LockClosedIcon },
      { description: 'Analytics', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    name: 'Team',
    id: 'team',
    description: 'For teams & agencies',
    priceMonthly: '14',
    billingPeriod: 'per month',
    highlights: [
      { description: 'All Premium features', icon: ArrowUpIcon },
      { description: 'A separate team space', icon: UsersIcon },
      { description: 'Invite up to 5 team members', icon: UserPlusIcon },
      {
        description: 'Google Analytics integration',
        icon: ArrowTrendingDownIcon,
      },
      { description: 'Facebook Pixel integration', icon: HandThumbUpIcon },
    ],
  },
];

interface UpgradeEligibility {
  canUpgrade: boolean;
  nextPlan: string | null;
  nextStep: string | null;
  currentPlan: string | null;
  message: string | null;
}

const getReturnUrl = () => {
  let returnPath = '/edit';

  if (typeof window !== 'undefined') {
    returnPath = window.location.pathname;
  }

  const returnUrl = new URL(`${process.env.NEXT_PUBLIC_APP_URL}${returnPath}`);
  returnUrl.searchParams.set('showBilling', 'true');

  return returnUrl.toString();
};

export function PricingTable({
  isLoggedIn,
  onComplete,
}: {
  isLoggedIn: boolean;
  onComplete?: () => void;
}) {
  const session = auth.useSession();
  const [upgradeEligibility, setUpgradeEligibility] =
    useState<UpgradeEligibility | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const returnUrl = getReturnUrl();

  const router = useRouter();

  const { data: subscriptionData } = useSWR<{
    plan: string;
    status: string;
    isTeamPremium: boolean;
    periodEnd?: string;
  }>(
    session.data?.session ? '/billing/subscription/me' : null,
    internalApiFetcher
  );

  useEffect(() => {
    const fetchUpgradeEligibility = async () => {
      try {
        const res = await InternalApi.get('/billing/upgrade-eligibility');

        setUpgradeEligibility(res);
      } catch (error) {
        console.error(error);
      }
    };

    if (!session.data?.session) {
      return;
    }

    fetchUpgradeEligibility();
  }, [session]);

  const handleAddPaymentMethod = async () => {
    setIsLoading(true);
    const res = await InternalApi.post('/billing/get-billing-portal-url', {
      redirectTo: returnUrl,
    });

    if (res.url) {
      return router.push(res.url);
    }

    toast({
      title: 'Unable to add payment method',
      description: res.error,
    });

    setIsLoading(false);
  };

  const handleUpgrade = async (plan: string) => {
    setIsLoading(true);

    const endpoint =
      plan === 'premium' ? '/billing/upgrade/premium' : '/billing/upgrade/team';

    const res = await InternalApi.post(endpoint);

    if (res.url) {
      return router.push(res.url);
    }

    toast({
      title: 'Unable to upgrade',
      description: res.error,
    });
    setIsLoading(false);
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    const res = await InternalApi.post('/billing/cancel-subscription');

    if (res.url) {
      return router.push(res.url);
    }

    toast({
      title: 'Unable to cancel subscription',
      description: res.error,
    });

    setIsLoading(false);
  };

  const handleCompleteTrial = async () => {
    setIsLoading(true);
    try {
      const res = await InternalApi.post('/billing/upgrade-trial');

      if (res.success) {
        toast({
          title: 'Welcome to Premium!',
          description: 'You can now access all of Linky’s premium features.',
        });
        if (onComplete) {
          onComplete();
        }
        return;
      } else {
        toast({
          title: 'Unable to complete trial',
          description: res.error,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierButton = (tier: (typeof tiers)[number]) => {
    if (tier.id === 'premium') {
      if (subscriptionData?.plan === 'team') {
        return (
          <Button
            variant="default"
            size="lg"
            disabled={true}
            className="w-full rounded-full bg-black text-white hover:bg-gray-800"
          >
            Unable to downgrade
          </Button>
        );
      }

      if (upgradeEligibility?.nextStep === 'addPaymentMethod') {
        return (
          <Button
            variant="default"
            size="lg"
            className="w-full rounded-full bg-black text-white hover:bg-gray-800"
            onClick={handleAddPaymentMethod}
            disabled={isLoading}
          >
            {isLoading ? 'Loading' : 'Add Payment Method'}
          </Button>
        );
      }

      if (
        subscriptionData?.status === 'trialing' &&
        subscriptionData?.plan === 'premium'
      ) {
        return (
          <Button
            variant="default"
            size="lg"
            onClick={handleCompleteTrial}
            disabled={upgradeEligibility?.currentPlan !== tier.id || isLoading}
            className="w-full rounded-full bg-black text-white hover:bg-gray-800"
          >
            {isLoading ? 'Loading' : 'Complete Trial'}
          </Button>
        );
      }
    }

    if (subscriptionData?.plan === 'freeLegacy') {
      return (
        <Button
          variant="default"
          size="lg"
          className="w-full rounded-full bg-black text-white hover:bg-gray-800"
          onClick={() => handleUpgrade(tier.id)}
        >
          Upgrade to {tier.name}
        </Button>
      );
    }

    if (
      subscriptionData?.plan === 'premium' &&
      subscriptionData?.isTeamPremium
    ) {
      return (
        <Button
          variant="default"
          size="lg"
          disabled={true}
          className="w-full rounded-full bg-black text-white hover:bg-gray-800"
        >
          No upgrade available
        </Button>
      );
    }

    if (upgradeEligibility?.nextStep === 'premiumTeamAssociated') {
      return (
        <Button
          variant="default"
          size="lg"
          disabled={true}
          className="w-full rounded-full bg-black text-white hover:bg-gray-800"
        >
          No upgrade available
        </Button>
      );
    }

    if (tier.id === subscriptionData?.plan) {
      return (
        <Button
          variant="outline"
          size="lg"
          disabled={true}
          className="w-full rounded-full"
        >
          Your Current Plan
        </Button>
      );
    }

    if (upgradeEligibility?.currentPlan === tier.id) {
      return (
        <Button
          variant="outline"
          size="lg"
          disabled={true}
          className="w-full rounded-full"
        >
          Your Current Plan
        </Button>
      );
    }

    if (tier.id === 'team') {
      return (
        <Button
          variant="default"
          size="lg"
          className="w-full rounded-full bg-black text-white hover:bg-gray-800"
          onClick={() => handleUpgrade(tier.id)}
        >
          {isLoading ? 'Loading' : 'Upgrade to Team'}
        </Button>
      );
    }
  };

  return (
    <div className="mx-auto relative z-[2] max-w-2xl">
      {subscriptionData?.periodEnd && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            Subscription ending soon
          </AlertTitle>
          <AlertDescription>
            Your subscription has been cancelled and is scheduled to end on{' '}
            {new Date(subscriptionData.periodEnd).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}
      {upgradeEligibility?.nextStep === 'completeTrial' && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            You have an active trial
          </AlertTitle>
          <AlertDescription>
            Clicking "Complete Trial" will upgrade your account.
          </AlertDescription>
        </Alert>
      )}
      {upgradeEligibility?.nextStep === 'addPaymentMethod' && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            You are currently on a free trial
          </AlertTitle>
          <AlertDescription>
            If you would like to upgrade, please add a payment method first by
            clicking below.
          </AlertDescription>
        </Alert>
      )}
      {subscriptionData?.plan === 'premium' &&
        subscriptionData?.isTeamPremium && (
          <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
            <AlertTitle className="text-lg font-medium">
              Your premium subscription is managed by your team
            </AlertTitle>
            <AlertDescription>
              Your personal team has a premium subscription due to being
              associated with a team on the Linky Team plan. There are no
              further upgrades available for your personal team!
            </AlertDescription>
          </Alert>
        )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {tiers.map((tier) => {
          const tierButton = getTierButton(tier);
          return (
            <div
              key={tier.name}
              className={cn(
                'rounded-2xl bg-white/50 p-8 shadow-sm ring-1 ring-gray-200/50',
                tier.id === 'premium' && 'bg-white ring-0'
              )}
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serf font-semibold text-gray-900">
                  {tier.name}
                </h2>
                {tier.badge && (
                  <span className="rounded-full bg-[#e26c1e] px-3 py-1 text-xs font-medium text-white">
                    {tier.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-500">{tier.description}</p>

              <div className="mt-6">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${tier.priceMonthly}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    {tier.billingPeriod}
                  </span>
                </div>

                <div className="mt-6">
                  {isLoggedIn ? (
                    tierButton
                  ) : (
                    <LoginWidget
                      isSignup
                      trigger={
                        <Button
                          variant="default"
                          size="lg"
                          className="w-full rounded-full bg-black text-white hover:bg-gray-800"
                        >
                          Get started
                        </Button>
                      }
                    />
                  )}
                </div>

                <ul className="mt-8 space-y-3">
                  {tier.highlights.map((highlight) => (
                    <li
                      key={highlight.description}
                      className="flex items-center gap-3 text-sm text-gray-600"
                    >
                      <highlight.icon className="h-5 w-5 flex-shrink-0 text-gray-400" />
                      {highlight.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {subscriptionData?.status &&
        !subscriptionData?.isTeamPremium &&
        !subscriptionData?.periodEnd &&
        subscriptionData?.plan !== 'freeLegacy' && (
          <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mt-4">
            <AlertTitle className="text-base font-medium">
              Cancel Subscription
            </AlertTitle>
            <AlertDescription className="text-sm">
              Looking to cancel your subscription?{' '}
              <Button
                variant="link"
                className="px-0"
                onClick={handleCancelSubscription}
              >
                Click here
              </Button>{' '}
              to manage it via Stripe.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
