'use client';

import { NewPageDialog } from '@/components/NewPageDialog';
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from '@radix-ui/react-icons';
import { Page } from '@trylinky/prisma';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  cn,
} from '@trylinky/ui';
import { Popover, PopoverContent, PopoverTrigger } from '@trylinky/ui';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface Props {
  teamPages?: Partial<Page>[] | null;
}

export function PageSwitcher({ teamPages }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const params = useParams();

  const currentPage = teamPages?.find((page) => page.slug === params.slug);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a team"
            className="md:w-[200px] justify-between"
            id="tour-page-switcher"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage
                src={`https://avatar.vercel.sh/${currentPage?.id}.png`}
                alt={currentPage?.slug}
              />
              <AvatarFallback>
                {currentPage?.slug?.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            /{currentPage?.slug}
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="md:w-[200px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search pages..." />
              <CommandEmpty>No page found.</CommandEmpty>
              {teamPages?.map((page) => {
                return (
                  <CommandItem
                    key={page.id}
                    onSelect={() => {
                      router.push(`/${page.slug}`);
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <AvatarImage
                        src={`https://avatar.vercel.sh/${page.id}.png`}
                        alt={page.slug}
                      />
                      <AvatarFallback>
                        {page?.slug?.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    /{page.slug}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4',
                        currentPage?.id === page.id
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowNewTeamDialog(true);
                  }}
                >
                  <PlusCircledIcon className="mr-2 h-5 w-5" />
                  Create Page
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <NewPageDialog
        open={showNewTeamDialog}
        onOpenChange={setShowNewTeamDialog}
        onClose={() => setShowNewTeamDialog(false)}
      />
    </>
  );
}
