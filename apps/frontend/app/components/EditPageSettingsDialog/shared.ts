import { HSLColor } from '@/lib/theme';
import { z } from 'zod';

export const designPageSettingsSchema = z.object({
  themeId: z.string({
    required_error: 'Please select a theme',
  }),
  backgroundImage: z.string().optional(),
});

export const generalPageSettingsSchema = z.object({
  pageSlug: z.string({ required_error: 'Please provide a page slug' }),
  metaTitle: z.string({ required_error: 'Please provide a page title' }),
  published: z.boolean(),
});

export type ThemeData = {
  themeName: string;
  colorBgBase: HSLColor;
  colorBgPrimary: HSLColor;
  colorBgSecondary: HSLColor;
  colorLabelPrimary: HSLColor;
  colorLabelSecondary: HSLColor;
  colorLabelTertiary: HSLColor;
  colorBorderPrimary: HSLColor;
  colorTitlePrimary: HSLColor;
  colorTitleSecondary: HSLColor;
  font?: string;
  backgroundImage?: string;
};
