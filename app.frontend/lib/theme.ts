import { JsonValue } from '@prisma/client/runtime/library';

export type DefaultThemeNames =
  | 'Default'
  | 'Purple'
  | 'Black'
  | 'Forest'
  | 'Lilac'
  | 'OrangePunch';

export const defaultThemes: { id: string; name: DefaultThemeNames }[] = [
  {
    id: '00441c91-6762-44d8-8110-2b5616825bd9',
    name: 'Default',
  },
  {
    id: '14fc9bdf-f363-4404-b05e-856670722fda',
    name: 'Purple',
  },
  {
    id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
    name: 'Black',
  },
  {
    id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
    name: 'Forest',
  },
];

// TODO - Fix the L/S color values to be in the correct format (divide by 100)

export const defaultThemeSeeds: Record<DefaultThemeNames, any> = {
  Default: {
    id: '00441c91-6762-44d8-8110-2b5616825bd9',
    colorBgBase: { h: 60, l: 0.96, s: 0.0476 },
    colorBgPrimary: { h: 0, l: 1, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.9176, s: 0 },
    colorLabelPrimary: { h: 240, l: 0.1137, s: 0.0345 },
    colorLabelSecondary: { h: 0, l: 0.16, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Purple: {
    id: '14fc9bdf-f363-4404-b05e-856670722fda',
    colorBgBase: { h: 255.48, l: 0.202, s: 0.301 },
    colorBgPrimary: { h: 255, l: 0.135, s: 0.29 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 253.55, l: 0.2837, s: 0.1969 },
    colorLabelPrimary: { h: 0, l: 1, s: 0 },
    colorLabelSecondary: { h: 293.33, l: 0.7627, s: 0.0744 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Black: {
    id: '1e24ab02-9b97-4a61-9b83-fe278a41b30b',
    colorBgBase: { h: 0, l: 0, s: 0 },
    colorBgPrimary: { h: 0, l: 0, s: 0 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 0, l: 0.1607, s: 0 },
    colorLabelPrimary: { h: 0, l: 1, s: 0 },
    colorLabelSecondary: { h: 0, l: 0.9804, s: 0 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Forest: {
    id: '4c47b21f-9183-4e7a-be6c-6ee4fabae92a',
    colorBgBase: { h: 141.18, l: 0.41, s: 0.0813 },
    colorBgPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorBgSecondary: { h: 0, l: 0.902, s: 0 },
    colorBorderPrimary: { h: 140, l: 0.31, s: 0.0988 },
    colorLabelPrimary: { h: 0, l: 1, s: 0 },
    colorLabelSecondary: { h: 141.18, l: 0.8392, s: 0.4146 },
    colorLabelTertiary: { h: 0, l: 0.9804, s: 0 },
  },
  Lilac: {
    id: '0192b479-69c1-7bb4-936d-26f9e3a2024f',
    colorBgBase: { a: 1, h: 244.86, l: 0.85, s: 1 },
    colorBgPrimary: { h: 244.86, l: 0.92, s: 0.91 },
    colorBgSecondary: { h: 0, l: 0, s: 0 },
    colorBorderPrimary: { h: 244.86, l: 0.76, s: 0.48 },
    colorLabelPrimary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelSecondary: { h: 250.0, l: 0.18, s: 0.32 },
    colorLabelTertiary: { h: 250.0, l: 0.18, s: 0.32 },
  },
  OrangePunch: {
    id: '44ddcc5a-aa85-45b9-b333-3ddcbe7d7db3',
    colorBgBase: { h: 226.15, l: 0.1, s: 0.48 },
    colorBgPrimary: { h: 13.5, l: 0.53, s: 0.67 },
    colorBgSecondary: { h: 33.3, l: 0.48, s: 0.95 },
    colorBorderPrimary: { h: 226.15, l: 0.1, s: 0.48 },
    colorLabelPrimary: { h: 144, l: 0.69, s: 0.78 },
    colorLabelSecondary: { h: 144, l: 0.97, s: 0.76 },
    colorLabelTertiary: { h: 144, l: 0.98, s: 0 },
  },
};

export const themeFields = [
  {
    id: 'colorBgBase',
    variable: 'color-sys-bg-base',
    label: 'Page background',
  },
  {
    id: 'colorBgPrimary',
    variable: 'color-sys-bg-primary',
    label: 'Primary background',
  },
  {
    id: 'colorBgSecondary',
    variable: 'color-sys-bg-secondary',
    label: 'Secondary background',
  },
  {
    id: 'colorTitlePrimary',
    variable: 'color-sys-title-primary',
    label: 'Primary title',
  },
  {
    id: 'colorTitleSecondary',
    variable: 'color-sys-title-secondary',
    label: 'Secondary title',
  },
  {
    id: 'colorLabelPrimary',
    variable: 'color-sys-label-primary',
    label: 'Primary text',
  },
  {
    id: 'colorLabelSecondary',
    variable: 'color-sys-label-secondary',
    label: 'Secondary text',
  },
  {
    id: 'colorLabelTertiary',
    variable: 'color-sys-label-tertiary',
    label: 'Tertiary text',
  },
  {
    id: 'colorBorderPrimary',
    variable: 'color-sys-bg-border',
    label: 'Primary border',
  },
];

export type HSLColor = {
  h: number;
  s: number;
  l: number;
};

export const themeColorToCssValue = (color?: JsonValue): string => {
  if (!color) return '';
  const colorAsHsl = color as HSLColor;
  return `${colorAsHsl.h}deg ${colorAsHsl.s * 100}% ${colorAsHsl.l * 100}%`;
};

export const hslToHex = ({ h, s, l }: HSLColor) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};
