'use client';

import { internalApiFetcher } from '../api/fetch';
import { InternalApi } from '../api/internal-api';
import { auth } from '../auth/auth';
import { LoginWidget } from '../auth/login-widget';
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ArrowUpIcon,
  CheckBadgeIcon,
  CubeIcon,
  CubeTransparentIcon,
  HandThumbUpIcon,
  UserPlusIcon,
  UsersIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
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
  //   name: 'Kostenlos',
  //   id: 'free',
  //   description: 'Der beste Start',
  //   priceMonthly: '0',
  //   billingPeriod: 'immer kostenlos',
  //   highlights: [
  //     { description: 'Deine eigene Seite', icon: GlobeAltIcon },
  //     { description: 'Bis zu 5 Blöcke', icon: CubeIcon },
  //     {
  //       description: 'Instagram Integration',
  //       icon: PuzzlePieceIcon,
  //     },
  //     {
  //       description: 'Spotify Integration',
  //       icon: PuzzlePieceIcon,
  //     },
  //     {
  //       description: 'Eigene Designs',
  //       icon: PaintBrushIcon,
  //     },
  //   ],
  // },
  {
    name: 'Premium',
    id: 'premium',
    badge: 'Beliebt',
    description: 'Für Tagesmütter und Väter',
    priceMonthly: '4',
    billingPeriod: 'pro Monat',
    highlights: [
      { description: 'Eigene Webadresse', icon: GlobeAltIcon },
      { description: 'Unbegrenzte Seiten', icon: CubeTransparentIcon },
      { description: 'Unbegrenzte Inhalte', icon: CubeIcon },
      { description: 'Verifizierungs-Abzeichen', icon: CheckBadgeIcon },
      { description: 'Passwortgeschützte Seiten', icon: LockClosedIcon },
      { description: 'Besucher-Statistik', icon: ArrowTrendingUpIcon },
    ],
  },
  {
    name: 'Team',
    id: 'team',
    description: 'Für Großtagespflege & Teams',
    priceMonthly: '14',
    billingPeriod: 'pro Monat',
    highlights: [
      { description: 'Alle Premium-Funktionen', icon: ArrowUpIcon },
      { description: 'Separater Team-Bereich', icon: UsersIcon },
      { description: 'Bis zu 5 Mitglieder einladen', icon: UserPlusIcon },
      {
        description: 'Google Analytics Integration',
        icon: ArrowTrendingDownIcon,
      },
      { description: 'Facebook Pixel Integration', icon: HandThumbUpIcon },
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
            Downgrade nicht möglich
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
            {isLoading ? 'Laden...' : 'Zahlungsmethode hinzufügen'}
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
            {isLoading ? 'Laden...' : 'Testphase abschließen'}
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
          Upgrade auf {tier.name}
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
          Kein Upgrade verfügbar
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
          Kein Upgrade verfügbar
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
          Dein aktueller Plan
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
          Dein aktueller Plan
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
          {isLoading ? 'Laden...' : 'Upgrade auf Team'}
        </Button>
      );
    }
  };

  return (
    <div className="mx-auto relative z-[2] max-w-2xl">
      {subscriptionData?.periodEnd && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            Abo endet bald
          </AlertTitle>
          <AlertDescription>
            Dein Abo wurde gekündigt und endet am{' '}
            {new Date(subscriptionData.periodEnd).toLocaleDateString('de-DE')}
          </AlertDescription>
        </Alert>
      )}
      {upgradeEligibility?.nextStep === 'completeTrial' && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            Du hast eine aktive Testphase
          </AlertTitle>
          <AlertDescription>
            Klicke auf "Testphase abschließen", um dein Konto upzugraden.
          </AlertDescription>
        </Alert>
      )}
      {upgradeEligibility?.nextStep === 'addPaymentMethod' && (
        <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
          <AlertTitle className="text-lg font-medium">
            Du bist aktuell im kostenlosen Testzeitraum
          </AlertTitle>
          <AlertDescription>
            Wenn du upgraden möchtest, füge bitte zuerst unten eine Zahlungsmethode hinzu.
          </AlertDescription>
        </Alert>
      )}
      {subscriptionData?.plan === 'premium' &&
        subscriptionData?.isTeamPremium && (
          <Alert className="rounded-2xl border-none shadow-sm ring-1 ring-gray-200 mb-8">
            <AlertTitle className="text-lg font-medium">
              Dein Premium-Abo wird vom Team verwaltet
            </AlertTitle>
            <AlertDescription>
              Dein Account hat Premium-Status durch eine Kiko-Mitgliedschaft. 
              Keine weiteren Upgrades verfügbar!
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
                          Jetzt starten
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
              Abo kündigen
            </AlertTitle>
            <AlertDescription className="text-sm">
              Möchtest du dein Abo kündigen?{' '}
              <Button
                variant="link"
                className="px-0"
                onClick={handleCancelSubscription}
              >
                Klicke hier
              </Button>{' '}
              , um es über Stripe zu verwalten.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
