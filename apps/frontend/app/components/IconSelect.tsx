'use client';

import { Icon, icons } from './icons';
import { CheckIcon } from '@radix-ui/react-icons';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  Avatar,
  AvatarFallback,
  AvatarImage,
  cn,
} from '@trylinky/ui';
import { useEffect, useState } from 'react';

interface IconSelectProps {
  onIconChange: (iconSrc: string) => void;
  initialValue?: string;
}

export function IconSelect({ onIconChange, initialValue }: IconSelectProps) {
  const [open, setOpen] = useState(false);

  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);

  useEffect(() => {
    if (initialValue) {
      const icon = icons.find((icon) => icon.value === initialValue);
      if (icon) {
        setSelectedIcon(icon);
      }
    }
  }, [initialValue]);

  useEffect(() => {
    if (selectedIcon) {
      onIconChange(selectedIcon.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIcon]);

  return (
    <Command className="rounded-lg border shadow-md`">
      <CommandList>
        <CommandInput placeholder="Search icons..." />
        <CommandEmpty>No icon found.</CommandEmpty>
        {icons.map((icon) => (
          <CommandItem
            key={icon.value}
            onSelect={() => {
              setSelectedIcon(icon);
              setOpen(false);
            }}
            className="text-sm"
          >
            <Avatar className="mr-2 h-5 w-5">
              <AvatarImage src={icon.value} alt={icon.label} />
              <AvatarFallback>
                {icon.label.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {icon.label}{' '}
            <span className="opacity-50 ml-2 text-xs">{icon?.subLabel}</span>
            <CheckIcon
              className={cn(
                'ml-auto h-4 w-4',
                selectedIcon?.value === icon.value ? 'opacity-100' : 'opacity-0'
              )}
            />
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  );
}
