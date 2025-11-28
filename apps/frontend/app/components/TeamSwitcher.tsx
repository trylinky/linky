'use client';

import { auth, useSession } from '@/app/lib/auth';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { Organization } from '@trylinky/prisma';
import {
  cn,
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
  CommandSeparator,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Popover,
  toast,
  Button,
  PopoverContent,
  PopoverTrigger,
} from '@trylinky/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSWRConfig } from 'swr';

interface Props {
  usersOrganizations?: Partial<Organization>[] | null;
}

export function TeamSwitcher({ usersOrganizations }: Props) {
  const [open, setOpen] = useState(false);

  const router = useRouter();

  const { mutate } = useSWRConfig();

  const { data } = useSession();
  const currentTeam = usersOrganizations?.find(
    (org) => org.id === data?.session?.activeOrganizationId
  );

  const handleSwitchOrganization = async (orgId: string) => {
    if (!orgId) {
      return;
    }

    try {
      await auth.organization.setActive({
        organizationId: orgId,
      });
      toast({
        title: 'Switching team…',
        variant: 'default',
      });

      router.refresh();

      mutate('/pages/me');
    } catch (error) {
      toast({
        title: 'Unable to switch team',
        variant: 'error',
      });
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className="w-[70px] justify-between"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${currentTeam?.id}.png`}
                alt={currentTeam?.id}
              />
              <AvatarFallback>
                {currentTeam?.name?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandEmpty>No team found.</CommandEmpty>
              {usersOrganizations?.map((org) => {
                return (
                  <CommandItem
                    key={org.id}
                    onSelect={() => handleSwitchOrganization(org.id as string)}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${org.id}.png`}
                        alt={org.id}
                      />
                      <AvatarFallback>
                        {org?.name?.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {org.name}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        org.id === data?.session?.activeOrganizationId
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandList>
            <CommandSeparator />
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
