'use client';

import { ManageBillingDialog } from '@/app/components/ManageBillingDialog';
import { auth, useSession } from '@/app/lib/auth';
import { EditTeamSettingsDialog } from '@/components/EditTeamSettingsDialog/EditTeamSettingsDialog';
import { NewPageDialog } from '@/components/NewPageDialog';
import { internalApiFetcher } from '@trylinky/common';
import { Organization } from '@trylinky/prisma';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@trylinky/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface Props {
  usersOrganizations?: Partial<Organization>[] | null;
}

type SubscriptionData = {
  plan: string;
  status: string;
  isTeamPremium: boolean;
  periodEnd?: string;
  trialDaysLeft?: number;
};

export function UserWidget({ usersOrganizations }: Props) {
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const [showTeamSettingsDialog, setShowTeamSettingsDialog] = useState(false);
  const [showManageBillingDialog, setShowManageBillingDialog] = useState(false);
  const { data: session } = useSession();

  const router = useRouter();

  const searchParams = useSearchParams();

  const showBilling = searchParams.get('showBilling');

  const { data: subscriptionData } = useSWR<SubscriptionData>(
    '/billing/subscription/me',
    internalApiFetcher
  );

  useEffect(() => {
    if (showBilling) {
      setShowManageBillingDialog(true);
    }
  }, [showBilling]);

  const { user } = session ?? {};

  if (!user) {
    return null;
  }

  const handleCloseManageBillingDialog = () => {
    setShowManageBillingDialog(false);
    router.replace(window.location.pathname);
  };

  return (
    <div className="flex items-center justify-end gap-4">
      {subscriptionData && (
        <button onClick={() => setShowManageBillingDialog(true)}>
          <SubscriptionStatusBadge subscriptionData={subscriptionData} />
        </button>
      )}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-10 w-10 rounded-full">
            <Avatar className="h-8 w-8">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? ''} />
              )}
              <AvatarFallback>
                {user.name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {usersOrganizations && usersOrganizations?.length > 1 && (
            <>
              <DropdownMenuItem onClick={() => setShowTeamSettingsDialog(true)}>
                Team settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={() => setShowManageBillingDialog(true)}>
            Manage Billing
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              await auth.signOut();
              router.refresh();
            }}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewPageDialog
        open={showNewTeamDialog}
        onOpenChange={setShowNewTeamDialog}
        onClose={() => setShowNewTeamDialog(false)}
      />
      {showTeamSettingsDialog && (
        <EditTeamSettingsDialog
          open={showTeamSettingsDialog}
          onOpenChange={setShowTeamSettingsDialog}
          onClose={() => setShowTeamSettingsDialog(false)}
        />
      )}

      {showManageBillingDialog && (
        <ManageBillingDialog
          open={showManageBillingDialog}
          onOpenChange={handleCloseManageBillingDialog}
        />
      )}
    </div>
  );
}

function SubscriptionStatusBadge({
  subscriptionData,
}: {
  subscriptionData: SubscriptionData;
}) {
  if (
    subscriptionData?.status === 'trialing' &&
    subscriptionData.trialDaysLeft &&
    subscriptionData.trialDaysLeft > 0
  ) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 ring-1 ring-inset ring-orange-600/10">
        {subscriptionData.trialDaysLeft} days left on trial
      </span>
    );
  }

  if (subscriptionData?.status === 'inactive') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white ring-1 ring-inset ring-orange-600/10">
        Account Inactive
      </span>
    );
  }

  if (subscriptionData?.plan === 'freeLegacy') {
    return (
      <span className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-sm font-medium text-purple-700 ring-1 ring-inset ring-purple-600/10">
        Upgrade to Premium
      </span>
    );
  }

  return null;
}
