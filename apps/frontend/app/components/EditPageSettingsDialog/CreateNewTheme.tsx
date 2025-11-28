'use client';

import { RenderThemeStyle } from '@/app/[domain]/[slug]/render-page-theme';
import { FontSelector } from '@/app/components/FontSelector';
import { FormFileUpload } from '@/app/components/FormFileUpload';
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
  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-2">
        <Label htmlFor="themeName">Theme name</Label>
        <Input
          type="text"
          id="themeName"
          name="themeName"
          className="bg-white"
          placeholder="Give your theme a name"
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
        />
      </div>

      <Collapsible className="mt-4 group col-span-2">
        <CollapsibleTrigger className="w-full py-2 px-3 bg-stone-100 rounded-lg">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold">Background</span>
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 bg-stone-100 rounded-lg">
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

      <Collapsible className="mt-4 group col-span-2">
        <CollapsibleTrigger className="w-full py-2 px-3 bg-stone-100 rounded-lg">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold">Fonts</span>
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 bg-stone-100 rounded-lg">
          <FontSelector
            value={font}
            onChange={setFont}
            label="Font"
            id="theme-font"
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible className="mt-4 group col-span-2">
        <CollapsibleTrigger className="w-full py-2 px-3 bg-stone-100 rounded-lg">
          <div className="flex justify-between items-center w-full">
            <span className="font-semibold">Colors</span>
            <ChevronDownIcon className="w-4 h-4 group-data-[state=open]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 py-2 bg-stone-100 rounded-lg">
          <div className="grid grid-cols-1 gap-4">
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

      <Button type="button" onClick={handleThemeAction} className="col-span-2">
        {action === 'create' ? 'Create theme' : 'Update theme'}
      </Button>

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
