'use client';

import { PageThemePreview } from '@/app/components/PageThemePreview';
import { defaultThemeSeeds } from '@/lib/theme';
import { Label, RadioGroup, RadioGroupItem } from '@trylinky/ui';

interface ThemeStepProps {
  currentThemeId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFieldValue: (field: string, value: any, shouldValidate?: boolean) => void;
}

export function ThemeStep({ currentThemeId, setFieldValue }: ThemeStepProps) {
  return (
    <div>
      <RadioGroup
        onValueChange={(val) => setFieldValue('themeId', val)}
        value={currentThemeId} // Use value prop for controlled component
        className="grid max-w-md grid-cols-2 gap-4 pt-2"
      >
        {Object.entries(defaultThemeSeeds).map(([themeName, themeValues]) => {
          return (
            <Label
              key={themeValues.id} // Use themeValues.id for a more stable key if themeName can change
              htmlFor={themeValues.id}
              className="cursor-pointer [&:has([data-state=checked])>div]:border-primary"
            >
              <RadioGroupItem
                value={themeValues.id}
                id={themeValues.id}
                className="sr-only"
              />
              <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent transition-colors">
                <PageThemePreview themeValues={themeValues} />
              </div>
              <span className="block w-full p-2 text-center font-medium">
                {themeName}
              </span>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
