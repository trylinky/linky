'use client';

import { FormField } from '../FormField';
import { teamInviteSchema } from './shared';
import { auth } from '@/app/lib/auth';
import { captureException } from '@sentry/nextjs';
import { Invitation, User } from '@trylinky/prisma';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  cn,
  useToast,
} from '@trylinky/ui';
import { Form, Formik, FormikHelpers } from 'formik';
import { withZodSchema } from 'formik-validator-zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type TeamInviteFormValues = {
  email: string;
};

interface Props {
  onCancel: () => void;
  members: { user: Partial<User>; role: 'owner' | 'admin' | 'member' }[];
  invites?: Partial<Invitation>[];
}

export function EditTeamSettingsMembers({ onCancel, members, invites }: Props) {
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (
    values: TeamInviteFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<TeamInviteFormValues>
  ) => {
    setSubmitting(true);

    try {
      const invite = await auth.organization.inviteMember({
        email: values.email,
        role: 'member',
      });

      if (invite?.error) {
        toast({
          variant: 'error',
          title: 'Something went wrong',
          description: invite.error.message,
        });

        return;
      }

      toast({
        title: 'Invite sent',
        description: 'We sent an invite to ' + invite.data?.email,
      });
      router.refresh();
      onCancel();
    } catch (error) {
      captureException(error);
      toast({
        variant: 'error',
        title: 'Something went wrong',
        description: 'Sorry, there was a problem sending the invite',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await auth.organization.cancelInvitation({
        invitationId: inviteId,
      });

      toast({
        title: 'Invite cancelled',
        description: 'The invite has been cancelled',
      });

      router.refresh();
    } catch (error) {
      captureException(error);
      toast({
        title: 'Something went wrong',
        description: 'Sorry, there was a problem cancelling the invite',
      });
    }
  };

  return (
    <>
      <table className="min-w-full divide-y divide-gray-300">
        <tbody className="divide-y divide-gray-200 bg-white">
          {members.map((member) => {
            return (
              <tr key={member.user.id}>
                <td className="whitespace-nowrap py-3 pr-3 flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {member.user.image && (
                      <AvatarImage
                        src={member.user.image}
                        alt={member.user.name ?? ''}
                      />
                    )}
                    <AvatarFallback>
                      {member.user.name?.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      {member.user.email || member.user.name}
                    </span>
                  </div>
                </td>

                <td className="whitespace-nowrap text-right px-3 py-3">
                  <span
                    className={cn(
                      'tracking-tight font-bold text-xs uppercase rounded-sm px-1.5 py-0.5',
                      member.role === 'admin' && 'bg-red-200 text-red-700',
                      member.role === 'member' && 'bg-blue-200 text-blue-700',
                      member.role === 'owner' && 'bg-purple-200 text-purple-700'
                    )}
                  >
                    {member.role}
                  </span>
                </td>
              </tr>
            );
          })}
          {invites?.map((invite) => {
            return (
              <tr key={invite.id}>
                <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-slate-600">
                  {invite.email}
                </td>
                <td className="whitespace-nowrap text-right px-3 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="inline-flex w-fit mr-4"
                    onClick={() => handleCancelInvite(invite.id as string)}
                  >
                    Cancel invite
                  </Button>
                  <span className="bg-yellow-300 tracking-tight font-bold text-xs uppercase rounded-sm px-1.5 py-0.5 text-yellow-800">
                    Invited
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="border-t border-slate-200 pt-6">
        <h3 className="text-base font-medium leading-6 text-slate-900">
          Invite a team member
        </h3>
        <p className="text-sm text-slate-500">
          Send an invite by entering their email address below.
        </p>

        <Formik
          initialValues={{
            email: '',
          }}
          validate={withZodSchema(teamInviteSchema)}
          onSubmit={onSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, setFieldValue, errors }) => (
            <Form className="w-full flex flex-col mt-4">
              <div>
                <FormField
                  label="Email"
                  name="email"
                  placeholder="hey@lin.ky"
                  id="email"
                  error={errors.email}
                />
              </div>

              <div>
                <Button type="submit">
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Invite
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </section>
    </>
  );
}
