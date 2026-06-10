'use client';

import { PageThemePreview } from '@/app/components/PageThemePreview';
import { defaultThemeSeeds } from '@/lib/theme';
import { Label, RadioGroup, RadioGroupItem } from '@trylinky/ui';
import { Check } from 'lucide-react';

interface ThemeStepProps {
  currentThemeId: string;
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}

export function ThemeStep({ currentThemeId, setFieldValue }: ThemeStepProps) {
  return (
    <RadioGroup
      onValueChange={(val: string) => setFieldValue('themeId', val)}
      value={currentThemeId}
      className="grid grid-cols-2 gap-3 lg:grid-cols-3"
    >
      {Object.entries(defaultThemeSeeds).map(([themeName, themeValues]) => (
        <Label
          key={themeValues.id}
          htmlFor={themeValues.id}
          className="group cursor-pointer"
        >
          <RadioGroupItem
            value={themeValues.id}
            id={themeValues.id}
            className="sr-only"
          />
          <span className="relative block overflow-hidden rounded-xl ring-1 ring-slate-900/10 group-hover:ring-slate-900/25 group-has-[[data-state=checked]]:ring-2 group-has-[[data-state=checked]]:ring-slate-900 dark:ring-white/10 dark:group-hover:ring-white/25 dark:group-has-[[data-state=checked]]:ring-white">
            <PageThemePreview themeValues={themeValues} />
            <span className="absolute top-1.5 right-1.5 hidden size-5 items-center justify-center rounded-full bg-slate-900 text-white group-has-[[data-state=checked]]:flex dark:bg-white dark:text-slate-900">
              <Check className="size-3" strokeWidth={3} />
            </span>
          </span>
          <span className="mt-1.5 block text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {themeName.replace(/([a-z])([A-Z])/g, '$1 $2')}
          </span>
        </Label>
      ))}
    </RadioGroup>
  );
}
