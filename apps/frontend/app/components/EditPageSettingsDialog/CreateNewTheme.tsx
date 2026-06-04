'use client';

import { RenderThemeStyle } from '@/app/[domain]/[slug]/render-page-theme';
import { FontSelector } from '@/app/components/FontSelector';
import { FormFileUpload } from '@/app/components/FormFileUpload';
import { ThemeMockup } from '@/app/components/ThemeMockup';
import { createTheme, updateTheme } from '@/app/lib/actions/themes';
import { HSLColor, hslToHex, themeFields } from '@/lib/theme';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { internalApiFetcher } from '@trylinky/common';
import { Theme } from '@trylinky/prisma';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Input,
  Label,
  toast,
} from '@trylinky/ui';
import { useEffect, useRef, useState } from 'react';
import { SketchPicker } from 'react-color';
import useSWR, { mutate } from 'swr';

type ReactColorValue = {
  hex?: string;
  hsl: HSLColor;
};

const defaultColor = {
  hex: '#000',
  hsl: {
    h: 0,
    s: 0,
    l: 0,
  },
};

export function CreateEditThemeForm({
  action,
  editThemeId,
  onCreateSuccess,
}: {
  action: 'create' | 'edit';
  editThemeId?: string;
  onCreateSuccess?: (newThemeId: string) => void;
}) {
  const [themeName, setThemeName] = useState('');
  const [font, setFont] = useState<string | undefined>(undefined);
  const [backgroundImage, setBackgroundImage] = useState<string | undefined>(
    undefined
  );

  const { data: themes } = useSWR<Theme[]>(
    '/themes/me/team',
    internalApiFetcher
  );

  const currentTheme = themes?.find((theme) => theme.id === editThemeId);

  useEffect(() => {
    if (currentTheme) {
      setThemeName(currentTheme.name);
      setFont(currentTheme.font || undefined);
      setBackgroundImage(currentTheme.backgroundImage || undefined);

      setColors({
        colorBgBase: {
          hsl: currentTheme.colorBgBase,
          hex: hslToHex(currentTheme.colorBgBase as HSLColor),
        } as ReactColorValue,
        colorBgPrimary: {
          hsl: currentTheme.colorBgPrimary,
          hex: hslToHex(currentTheme.colorBgPrimary as HSLColor),
        } as ReactColorValue,
        colorBgSecondary: {
          hsl: currentTheme.colorBgSecondary,
          hex: hslToHex(currentTheme.colorBgSecondary as HSLColor),
        } as ReactColorValue,
        colorLabelPrimary: {
          hsl: currentTheme.colorLabelPrimary,
          hex: hslToHex(currentTheme.colorLabelPrimary as HSLColor),
        } as ReactColorValue,
        colorLabelSecondary: {
          hsl: currentTheme.colorLabelSecondary,
          hex: hslToHex(currentTheme.colorLabelSecondary as HSLColor),
        } as ReactColorValue,
        colorLabelTertiary: {
          hsl: currentTheme.colorLabelTertiary,
          hex: hslToHex(currentTheme.colorLabelTertiary as HSLColor),
        } as ReactColorValue,
        colorBorderPrimary: {
          hsl: currentTheme.colorBorderPrimary,
          hex: hslToHex(currentTheme.colorBorderPrimary as HSLColor),
        } as ReactColorValue,
        colorTitlePrimary: {
          hsl: currentTheme.colorTitlePrimary,
          hex: hslToHex(currentTheme.colorTitlePrimary as HSLColor),
        } as ReactColorValue,
        colorTitleSecondary: {
          hsl: currentTheme.colorTitleSecondary,
          hex: hslToHex(currentTheme.colorTitleSecondary as HSLColor),
        } as ReactColorValue,
      });
    }
  }, [currentTheme]);

  const [colors, setColors] = useState<Record<string, ReactColorValue>>({
    colorBgBase: defaultColor,
    colorBgPrimary: defaultColor,
    colorBgSecondary: defaultColor,
    colorLabelPrimary: defaultColor,
    colorLabelSecondary: defaultColor,
    colorLabelTertiary: defaultColor,
    colorTitlePrimary: defaultColor,
    colorTitleSecondary: defaultColor,
    colorBorderPrimary: defaultColor,
  });

  const setColor = (id: string, value: ReactColorValue) => {
    setColors((prev) => ({ ...prev, [id]: value }));
  };

  const handleThemeAction = async () => {
    const values = {
      themeName: themeName,
      colorBgBase: colors.colorBgBase.hsl,
      colorBgPrimary: colors.colorBgPrimary.hsl,
      colorBgSecondary: colors.colorBgSecondary.hsl,
      colorLabelPrimary: colors.colorLabelPrimary.hsl,
      colorLabelSecondary: colors.colorLabelSecondary.hsl,
      colorLabelTertiary: colors.colorLabelTertiary.hsl,
      colorTitlePrimary: colors.colorTitlePrimary.hsl,
      colorTitleSecondary: colors.colorTitleSecondary.hsl,
      colorBorderPrimary: colors.colorBorderPrimary.hsl,
      font: font,
      backgroundImage: backgroundImage,
    };
    if (action === 'create') {
      const req = await createTheme(values);
      if (req.error) {
        toast({
          title: 'Error',
          description: req.error,
          variant: 'destructive',
        });

        return;
      }

      if (req.data && onCreateSuccess) {
        onCreateSuccess(req.data?.id);
      }
    } else if (editThemeId && action === 'edit') {
      const req = await updateTheme(editThemeId, values);
      if (req.error) {
        toast({
          title: 'Error',
          description: req.error,
          variant: 'destructive',
        });
        return;
      }
    }

    toast({
      title: action === 'create' ? 'Theme created' : 'Theme updated',
      description:
        action === 'create'
          ? 'Your theme has been created'
          : 'Your theme has been updated',
    });

    mutate('/themes/me/team');
  };

  // Build a partial theme from the current form state so the live preview
  // reflects edits before the theme is saved.
  const previewTheme = {
    font,
    backgroundImage,
    ...Object.fromEntries(
      Object.entries(colors).map(([key, value]) => [key, value.hsl])
    ),
  } as Partial<Theme>;

  return (
    <div className="grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="themeName">Theme name</Label>
          <Input
            type="text"
            id="themeName"
            name="themeName"
            className="bg-white"
            placeholder="Give your theme a name"
            value={themeName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setThemeName(e.target.value)
            }
          />
        </div>

        <Collapsible className="group">
          <CollapsibleTrigger className="w-full rounded-lg bg-stone-100 px-3 py-2">
            <div className="flex w-full items-center justify-between">
              <span className="font-semibold">Background</span>
              <ChevronDownIcon className="h-4 w-4 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-lg bg-stone-100 px-3 py-2">
            <FormFileUpload
              htmlFor="theme-background-image"
              onUploaded={(url) => setBackgroundImage(url)}
              initialValue={backgroundImage}
              referenceId={editThemeId || 'new-theme'}
              label="Background image"
              assetContext="pageBackgroundImage"
              isCondensed
            />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group">
          <CollapsibleTrigger className="w-full rounded-lg bg-stone-100 px-3 py-2">
            <div className="flex w-full items-center justify-between">
              <span className="font-semibold">Fonts</span>
              <ChevronDownIcon className="h-4 w-4 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-lg bg-stone-100 px-3 py-2">
            <FontSelector
              value={font}
              onChange={setFont}
              label="Font"
              id="theme-font"
            />
          </CollapsibleContent>
        </Collapsible>

        <Collapsible className="group">
          <CollapsibleTrigger className="w-full rounded-lg bg-stone-100 px-3 py-2">
            <div className="flex w-full items-center justify-between">
              <span className="font-semibold">Colors</span>
              <ChevronDownIcon className="h-4 w-4 group-data-[state=open]:rotate-180" />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-lg bg-stone-100 px-3 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {themeFields.map((field) => {
                return (
                  <ColorField
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    variable={field.variable}
                    onChange={(value) => setColor(field.id, value)}
                    value={colors[field.id]}
                  />
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div>
          <Button type="button" onClick={handleThemeAction}>
            {action === 'create' ? 'Create theme' : 'Update theme'}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="hidden lg:block">
        <div className="sticky top-4 flex flex-col gap-2">
          <span className="text-sm font-medium text-stone-500">Preview</span>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <ThemeMockup theme={previewTheme} />
          </div>
        </div>
      </div>

      <RenderThemeStyle
        theme={Object.fromEntries(
          Object.entries(colors).map(([key, value]) => [key, value.hsl])
        )}
        important
      />
    </div>
  );
}

function ColorField({
  id,
  label,
  variable,
  onChange,
  value,
}: {
  id: string;
  label: string;
  variable: string;
  onChange: (value: ReactColorValue) => void;
  value: ReactColorValue;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const pickerRef = useRef(null);
  useOutsideAlerter(pickerRef, () => setIsOpen(false));

  return (
    <>
      <div className="flex flex-col gap-2 relative">
        <Label htmlFor={id}>{label}</Label>
        <div
          className="w-full h-8 bg-white border rounded-md flex items-center"
          onClick={() => setIsOpen(true)}
        >
          <div
            className="w-8 h-8 rounded-l-md cursor-pointer"
            style={{
              backgroundColor: `hsl(${value.hsl.h}deg ${value.hsl.s * 100}% ${value.hsl.l * 100}%)`,
            }}
          />
          <span className="text-sm text-gray-500 pl-2">{value.hex}</span>
        </div>
        {isOpen && (
          <div className="absolute top-0 left-0 z-10" ref={pickerRef}>
            <SketchPicker
              color={value.hsl}
              onChange={(color) => onChange({ hex: color.hex, hsl: color.hsl })}
            />
          </div>
        )}
      </div>
    </>
  );
}

function useOutsideAlerter(
  ref: React.RefObject<HTMLDivElement | null>,
  callback: () => void
) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}
