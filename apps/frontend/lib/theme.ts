import { JsonValue } from '@trylinky/prisma/types';

export {
  defaultThemes,
  defaultThemeSeeds,
  type DefaultThemeNames,
} from '@trylinky/db/seed-data';

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
