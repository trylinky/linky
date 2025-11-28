'use client';

import {
  popularGoogleFonts,
  getFontFamilyValue,
  loadGoogleFont,
} from '@/lib/fonts';
import { Label } from '@trylinky/ui';
import { useEffect, useState } from 'react';

interface FontSelectorProps {
  value: string | undefined;
  onChange: (font: string) => void;
  label?: string;
  id?: string;
}

export function FontSelector({
  value,
  onChange,
  label = 'Font',
  id = 'font-selector',
}: FontSelectorProps) {
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  // Load the currently selected font
  useEffect(() => {
    if (value && !loadedFonts.has(value)) {
      const font = popularGoogleFonts.find((f) => f.family === value);
      if (font) {
        loadGoogleFont(font.family, font.variants);
        setLoadedFonts((prev) => new Set(prev).add(value));
      }
    }
  }, [value, loadedFonts]);

  // Preload fonts when dropdown is opened
  const handleFocus = () => {
    // Load the first 5 fonts if they haven't been loaded yet
    popularGoogleFonts.slice(0, 5).forEach((font) => {
      if (!loadedFonts.has(font.family)) {
        loadGoogleFont(font.family, font.variants);
        setLoadedFonts((prev) => new Set(prev).add(font.family));
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <select
            id={id}
            name={id}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Default system font</option>
            {popularGoogleFonts.map((font) => (
              <option
                key={font.family}
                value={font.family}
                style={{ fontFamily: getFontFamilyValue(font.family) }}
              >
                {font.family}
              </option>
            ))}
          </select>
        </div>
      </div>
      <style>
        {`:root {
            --font-sys-body: ${value ? getFontFamilyValue(value) : 'initial'} !important;
       }`}
      </style>
    </>
  );
}
