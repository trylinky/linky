import { LoggedInAcceptInviteUI, LoggedOutAcceptInviteUI } from './accept-ui';
import { auth } from '@/app/lib/auth';
import prisma from '@/lib/prisma';
import { Avatar, AvatarFallback, AvatarImage } from '@trylinky/ui';
import { headers } from 'next/headers';

const getInvite = async (inviteId: string) => {
  const invite = await prisma.invitation.findUnique({
    where: {
      id: inviteId,
      expiresAt: {
        gt: new Date(),
      },
      status: 'pending',
    },
    select: {
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      inviter: {
        select: {
          name: true,
        },
      },
    },
  });

  return invite;
};

export default async function AcceptInvitePage(props: {
  params: Promise<{ inviteId: string }>;
}) {
  const params = await props.params;
  const headersList = await headers();

  const session = await auth.getSession({
    fetchOptions: {
      headers: headersList,
    },
  });

  const invite = await getInvite(params.inviteId);

  if (!invite) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 text-center">
          <h1 className="text-2xl font-bold mb-2">Invite not found</h1>
          <p>The invite you are trying to accept is not valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl w-full mx-auto py-16 px-4">
      <div className="bg-white shadow-sm px-8 py-12 rounded-2xl border border-slate-200 text-center w-full flex flex-col items-center">
        <Avatar className="h-16 w-16 mb-4">
          <AvatarImage
            src={`https://avatar.vercel.sh/${invite?.organization.id}.png`}
            alt={invite?.organization.name}
          />
          <AvatarFallback>
            {invite?.organization.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Join {invite?.organization.name} on Linky!
        </h1>
        <p className="mb-4 max-w-md mx-auto text-pretty">
          You&apos;ve been invited to join {invite?.organization.name} on Linky
          by {invite?.inviter.name}.
          <br />
          {session?.data
            ? 'To accept the invitation, click below.'
            : 'To accept the invitation, signup or login using one of the options below.'}
        </p>

        {session?.data ? (
          <LoggedInAcceptInviteUI inviteId={params.inviteId} />
        ) : (
          <LoggedOutAcceptInviteUI inviteId={params.inviteId} />
        )}
      </div>
    </div>
  );
}
