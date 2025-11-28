'use client';

import { auth } from '@/app/lib/auth';
import { EditTeamSettingsGeneral } from '@/components/EditTeamSettingsDialog/EditTeamSettingsGeneralForm';
import { EditTeamSettingsMembers } from '@/components/EditTeamSettingsDialog/EditTeamSettingsMembersForm';
import { internalApiFetcher } from '@trylinky/common';
import { Invitation, Organization, User } from '@trylinky/prisma';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@trylinky/ui';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface Props {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose: () => void;
}

export function EditTeamSettingsDialog({ open, onOpenChange, onClose }: Props) {
  const [teamSettings, setTeamSettings] =
    useState<Partial<Organization> | null>(null);
  const [teamMembers, setTeamMembers] = useState<
    { user: Partial<User>; role: 'owner' | 'admin' | 'member' }[] | null
  >([]);
  const [teamInvites, setTeamInvites] = useState<Partial<Invitation>[] | null>(
    []
  );

  const { data: orgs } = useSWR<Partial<Organization>[]>(
    '/organizations/me',
    internalApiFetcher
  );

  useEffect(() => {
    const getPageData = async () => {
      const org = await auth.organization.getFullOrganization();

      const filteredInvites = org.data?.invitations.filter(
        (invite) =>
          !['canceled', 'expired', 'accepted'].includes(invite.status as string)
      );

      setTeamSettings(org.data ?? null);
      setTeamMembers(org.data?.members ?? []);
      setTeamInvites(filteredInvites ?? []);
    };

    getPageData();
  }, []);

  const currentOrg = orgs?.find((org) => org.id === teamSettings?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Team Settings</DialogTitle>
          <DialogDescription>
            Manage your team and its settings.
          </DialogDescription>
        </DialogHeader>

        {currentOrg?.isPersonal === false ? (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="general" className="w-1/2">
                General
              </TabsTrigger>
              <TabsTrigger value="members" className="w-1/2">
                Members
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <EditTeamSettingsGeneral
                onCancel={onClose}
                initialValues={{
                  name: teamSettings?.name ?? '',
                }}
              />
            </TabsContent>
            <TabsContent value="members">
              <EditTeamSettingsMembers
                onCancel={onClose}
                members={teamMembers ?? []}
                invites={teamInvites ?? []}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <EditTeamSettingsGeneral
            onCancel={onClose}
            initialValues={{
              name: teamSettings?.name ?? '',
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
