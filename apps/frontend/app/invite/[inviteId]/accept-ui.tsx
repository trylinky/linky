'use client';

import { acceptInvite } from '@/app/invite/[inviteId]/actions';
import { auth, LoginForm } from '@trylinky/common';
import { Button, toast } from '@trylinky/ui';
import { useRouter } from 'next/navigation';

export function LoggedInAcceptInviteUI({ inviteId }: { inviteId: string }) {
  const router = useRouter();

  const handleAcceptInvite = async () => {
    const { error } = await acceptInvite(inviteId);

    if (error) {
      toast({
        title: 'Sorry, there was an error accepting your invite',
        description: error,
      });

      return;
    }

    // The API enforces seats and invite validity; this is the authoritative
    // result, so don't navigate as if it succeeded when it didn't.
    const { error: acceptError } = await auth.organization.acceptInvitation({
      invitationId: inviteId,
    });

    if (acceptError) {
      toast({
        title: 'Sorry, there was an error accepting your invite',
        description: acceptError.message,
      });

      return;
    }

    router.push('/edit');
  };

  return <Button onClick={handleAcceptInvite}>Accept Invite</Button>;
}

export function LoggedOutAcceptInviteUI({ inviteId }: { inviteId: string }) {
  return (
    <LoginForm
      redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteId}`}
    />
  );
}
