import type { TemplateContent } from '@/content/pseo-types';
import { isPublishableTemplate } from '@/content/pseo-types';
import type { ThemePalette } from '@/components/pseo/theme-mock';

// Palettes mirror apps/frontend/lib/theme.ts defaultThemeSeeds (source of truth).
// All h/s/l values are copied verbatim - do NOT round or alter.
// Note: Purple.colorLabelPrimary and Forest.colorLabelPrimary were l:100 in the source
// (a pre-normalisation quirk); normalized here to l:1 (= white) to satisfy the HslColor
// 0-1 contract. Rendering is identical.
// Lilac.colorBgBase has an extra `a` field in the source; only h/s/l are included here
// to satisfy the HslColor shape.
const PALETTES: Record<string, ThemePalette> = {
  classic: {
    colorBgBase: { h: 60, s: 0.0476, l: 0.96 },
    colorBgPrimary: { h: 0, s: 0, l: 1 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 0, s: 0, l: 0.9176 },
    colorLabelPrimary: { h: 240, s: 0.0345, l: 0.1137 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.16 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  violet: {
    colorBgBase: { h: 255.48, s: 0.301, l: 0.202 },
    colorBgPrimary: { h: 255, s: 0.29, l: 0.135 },
    colorBgSecondary: { h: 0, s: 0, l: 0 },
    colorBorderPrimary: { h: 253.55, s: 0.1969, l: 0.2837 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 293.33, s: 0.0744, l: 0.7627 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  midnight: {
    colorBgBase: { h: 0, s: 0, l: 0 },
    colorBgPrimary: { h: 0, s: 0, l: 0 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 0, s: 0, l: 0.1607 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.9804 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  forest: {
    colorBgBase: { h: 141.18, s: 0.0813, l: 0.41 },
    colorBgPrimary: { h: 140, s: 0.0988, l: 0.31 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 140, s: 0.0988, l: 0.31 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 141.18, s: 0.4146, l: 0.8392 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  lilac: {
    colorBgBase: { h: 244.86, s: 1, l: 0.85 },
    colorBgPrimary: { h: 244.86, s: 0.91, l: 0.92 },
    colorBgSecondary: { h: 0, s: 0, l: 0 },
    colorBorderPrimary: { h: 244.86, s: 0.48, l: 0.76 },
    colorLabelPrimary: { h: 250.0, s: 0.32, l: 0.18 },
    colorLabelSecondary: { h: 250.0, s: 0.32, l: 0.18 },
    colorLabelTertiary: { h: 250.0, s: 0.32, l: 0.18 },
  },
  'orange-punch': {
    colorBgBase: { h: 226.15, s: 0.48, l: 0.1 },
    colorBgPrimary: { h: 13.5, s: 0.67, l: 0.53 },
    colorBgSecondary: { h: 33.3, s: 0.95, l: 0.48 },
    colorBorderPrimary: { h: 226.15, s: 0.48, l: 0.1 },
    colorLabelPrimary: { h: 144, s: 0.78, l: 0.69 },
    colorLabelSecondary: { h: 144, s: 0.76, l: 0.97 },
    colorLabelTertiary: { h: 144, s: 0, l: 0.98 },
  },
  // --- Proposed themes below: NOT yet in apps/frontend/lib/theme.ts defaultThemeSeeds.
  // --- Added for marketing preview; port to the frontend seeds before treating as canon.
  ocean: {
    colorBgBase: { h: 215, s: 0.55, l: 0.16 },
    colorBgPrimary: { h: 213, s: 0.5, l: 0.11 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 213, s: 0.35, l: 0.26 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 205, s: 0.45, l: 0.78 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  blush: {
    colorBgBase: { h: 350, s: 0.72, l: 0.91 },
    colorBgPrimary: { h: 348, s: 0.7, l: 0.96 },
    colorBgSecondary: { h: 0, s: 0, l: 0 },
    colorBorderPrimary: { h: 348, s: 0.42, l: 0.82 },
    colorLabelPrimary: { h: 345, s: 0.45, l: 0.2 },
    colorLabelSecondary: { h: 345, s: 0.45, l: 0.2 },
    colorLabelTertiary: { h: 345, s: 0.45, l: 0.2 },
  },
  sandstone: {
    colorBgBase: { h: 35, s: 0.35, l: 0.9 },
    colorBgPrimary: { h: 38, s: 0.45, l: 0.96 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 35, s: 0.25, l: 0.8 },
    colorLabelPrimary: { h: 28, s: 0.3, l: 0.16 },
    colorLabelSecondary: { h: 28, s: 0.18, l: 0.32 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  slate: {
    colorBgBase: { h: 215, s: 0.16, l: 0.93 },
    colorBgPrimary: { h: 0, s: 0, l: 1 },
    colorBgSecondary: { h: 215, s: 0.14, l: 0.88 },
    colorBorderPrimary: { h: 215, s: 0.18, l: 0.85 },
    colorLabelPrimary: { h: 217, s: 0.3, l: 0.14 },
    colorLabelSecondary: { h: 215, s: 0.14, l: 0.34 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  neon: {
    colorBgBase: { h: 0, s: 0, l: 0.04 },
    colorBgPrimary: { h: 0, s: 0, l: 0.09 },
    colorBgSecondary: { h: 84, s: 1, l: 0.59 },
    colorBorderPrimary: { h: 84, s: 0.85, l: 0.4 },
    colorLabelPrimary: { h: 84, s: 1, l: 0.59 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.92 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  mocha: {
    colorBgBase: { h: 25, s: 0.3, l: 0.18 },
    colorBgPrimary: { h: 24, s: 0.28, l: 0.13 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 25, s: 0.22, l: 0.28 },
    colorLabelPrimary: { h: 33, s: 0.45, l: 0.93 },
    colorLabelSecondary: { h: 30, s: 0.3, l: 0.78 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  sunbeam: {
    colorBgBase: { h: 48, s: 0.9, l: 0.88 },
    colorBgPrimary: { h: 50, s: 0.85, l: 0.96 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 46, s: 0.55, l: 0.74 },
    colorLabelPrimary: { h: 40, s: 0.45, l: 0.15 },
    colorLabelSecondary: { h: 42, s: 0.3, l: 0.32 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  cherry: {
    colorBgBase: { h: 355, s: 0.65, l: 0.18 },
    colorBgPrimary: { h: 354, s: 0.6, l: 0.13 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 355, s: 0.45, l: 0.28 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 0, s: 0.55, l: 0.82 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  sage: {
    colorBgBase: { h: 120, s: 0.12, l: 0.86 },
    colorBgPrimary: { h: 110, s: 0.18, l: 0.94 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 120, s: 0.1, l: 0.76 },
    colorLabelPrimary: { h: 130, s: 0.22, l: 0.16 },
    colorLabelSecondary: { h: 125, s: 0.14, l: 0.32 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  sky: {
    colorBgBase: { h: 205, s: 0.75, l: 0.88 },
    colorBgPrimary: { h: 204, s: 0.7, l: 0.95 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 205, s: 0.45, l: 0.78 },
    colorLabelPrimary: { h: 212, s: 0.5, l: 0.16 },
    colorLabelSecondary: { h: 210, s: 0.35, l: 0.32 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  lagoon: {
    colorBgBase: { h: 185, s: 0.55, l: 0.15 },
    colorBgPrimary: { h: 187, s: 0.5, l: 0.1 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 185, s: 0.35, l: 0.25 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 175, s: 0.5, l: 0.75 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  mulberry: {
    colorBgBase: { h: 340, s: 0.45, l: 0.17 },
    colorBgPrimary: { h: 338, s: 0.42, l: 0.12 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 340, s: 0.3, l: 0.27 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 345, s: 0.35, l: 0.8 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  peach: {
    colorBgBase: { h: 22, s: 0.85, l: 0.89 },
    colorBgPrimary: { h: 24, s: 0.8, l: 0.95 },
    colorBgSecondary: { h: 0, s: 0, l: 0 },
    colorBorderPrimary: { h: 20, s: 0.5, l: 0.8 },
    colorLabelPrimary: { h: 15, s: 0.5, l: 0.2 },
    colorLabelSecondary: { h: 15, s: 0.5, l: 0.2 },
    colorLabelTertiary: { h: 15, s: 0.5, l: 0.2 },
  },
  graphite: {
    colorBgBase: { h: 220, s: 0.06, l: 0.12 },
    colorBgPrimary: { h: 220, s: 0.07, l: 0.17 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 220, s: 0.06, l: 0.26 },
    colorLabelPrimary: { h: 0, s: 0, l: 1 },
    colorLabelSecondary: { h: 220, s: 0.08, l: 0.72 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
  vapor: {
    colorBgBase: { h: 260, s: 0.45, l: 0.12 },
    colorBgPrimary: { h: 318, s: 0.6, l: 0.5 },
    colorBgSecondary: { h: 190, s: 0.9, l: 0.5 },
    colorBorderPrimary: { h: 260, s: 0.45, l: 0.12 },
    colorLabelPrimary: { h: 180, s: 0.85, l: 0.8 },
    colorLabelSecondary: { h: 180, s: 0.7, l: 0.96 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.98 },
  },
  paper: {
    colorBgBase: { h: 0, s: 0, l: 1 },
    colorBgPrimary: { h: 0, s: 0, l: 1 },
    colorBgSecondary: { h: 0, s: 0, l: 0.902 },
    colorBorderPrimary: { h: 0, s: 0, l: 0.08 },
    colorLabelPrimary: { h: 0, s: 0, l: 0.04 },
    colorLabelSecondary: { h: 0, s: 0, l: 0.3 },
    colorLabelTertiary: { h: 0, s: 0, l: 0.9804 },
  },
};

const TEMPLATES: TemplateContent[] = [
  {
    slug: 'classic',
    name: 'Classic',
    h1: 'Classic - a minimal link in bio template',
    answer:
      'Classic is a clean, light-toned template built on an off-white background with near-black text, giving your page a timeless, professional look that never distracts from your links.',
    targetKeyword: 'minimal link in bio template',
    palette: PALETTES['classic'],
    sections: [
      {
        heading: 'A palette designed for readability',
        body: 'Classic uses a warm off-white page background (hue 60, very lightly saturated) paired with pure-white link cards and soft grey borders. The result is a page that feels airy and inviting without any distracting colour. Primary text sits at a near-black tone with a barely-there blue tint, while secondary text steps back to a medium grey - creating a clear visual hierarchy without needing any bold colour choices.',
      },
      {
        heading: "What's included in the Classic theme",
        body: "The palette ships with seven colour roles: a warm off-white base, white card backgrounds, a light-grey secondary surface, a near-white border, a near-black primary label, a dark-grey secondary label, and an almost-white tertiary label. Together they form a versatile neutral system that works well for personal portfolios, freelance creatives, and anyone who wants their content to do the talking rather than the colour scheme.",
      },
      {
        heading: 'Who Classic is best for',
        body: 'Classic suits creators who prefer understated design - writers, photographers, consultants, and freelancers who want a professional first impression. The neutral tones also make Classic an excellent starting point if you plan to layer in a custom accent colour or swap in a distinctive profile photo without fighting the background.',
      },
      {
        heading: 'Make it yours in the Linky editor',
        body: "Open the Linky editor and select the Classic theme to start with this palette pre-loaded. From there you can swap any of the seven colour roles - for example, nudging the background towards cream or increasing the border contrast - without affecting the overall minimal feel. Add your links, profile photo, and a short bio, and you're ready to publish.",
      },
    ],
    faqs: [
      {
        question: 'Is the Classic template free?',
        answer:
          'Yes. Classic is available on every Linky plan, including the free tier. You can customise the colours, add unlimited links, and publish your page at no cost.',
      },
      {
        question: 'Can I change the background colour?',
        answer:
          'Absolutely. The Classic theme is just a starting point. In the editor you can adjust any of the seven colour roles - including swapping the warm off-white base for a pure white or a custom neutral - while keeping everything else in place.',
      },
      {
        question: 'Will Classic look good on mobile?',
        answer:
          'Yes. All Linky pages, including those built on the Classic template, are fully responsive. The layout and colour contrast are optimised for phones, tablets, and desktops alike.',
      },
      {
        question: 'Is this template suitable for a business profile?',
        answer:
          'Classic is one of the most versatile starting points for a business profile. The neutral, high-contrast palette reads as polished and trustworthy, and it pairs well with a company logo or brand colour added as a custom accent.',
      },
    ],
  },
  {
    slug: 'violet',
    name: 'Violet',
    h1: 'Violet - a purple link in bio template',
    answer:
      'Violet is a deep-purple dark-mode template with layered indigo backgrounds and bright-white text, creating a bold, atmospheric look well-suited to musicians, creators, and brands that want a distinctive purple identity.',
    targetKeyword: 'purple link in bio template',
    palette: PALETTES['violet'],
    sections: [
      {
        heading: 'A rich purple atmosphere',
        body: 'The Violet theme wraps everything in deep indigo tones - the page base sits at hue 255 with roughly 20 % lightness, and link card backgrounds drop even darker to about 13 % lightness, creating a layered sense of depth. A muted violet border at 28 % lightness defines card edges without breaking the moody palette. The overall impression is bold without being garish - deep, jewel-like purple that rewards a slow scroll.',
      },
      {
        heading: "What's included in the Violet palette",
        body: "Seven colour roles make up the Violet system: two distinct indigo-purple dark backgrounds (base and primary card), a pure-black secondary surface, a soft violet border, and a white primary label. Secondary labels draw from a light lavender-grey (hue 293, ~76 % lightness, low saturation) that adds a subtle gender-neutral purple note without competing with the white headlines. Tertiary labels match the near-white of the other dark themes.",
      },
      {
        heading: 'Who Violet is best for',
        body: 'Violet works especially well for musicians, DJs, streamers, and visual artists who lean into a dark, high-energy aesthetic. The deep purple palette also resonates with beauty brands, spiritual content creators, and anyone whose audience associates purple with creativity, luxury, or mystery. If your brand colour is already in the blue-purple spectrum, Violet will feel immediately on-brand.',
      },
      {
        heading: 'Customising Violet in the editor',
        body: 'Load Violet in the Linky editor and your page is instantly transformed into a deep-purple canvas. You can shift the hue slightly towards blue or magenta, lighten or darken the card backgrounds, or dial the border up for more definition. Because all seven colour roles are independently editable, you can stay within the purple family or pivot to a completely different accent while keeping the dark-mode structure intact.',
      },
    ],
    faqs: [
      {
        question: 'Is the Violet template free?',
        answer:
          'Yes. The Violet theme is available on all Linky plans including the free tier. No upgrade is required to use a dark or coloured theme.',
      },
      {
        question: 'Can I change the purple shade to a different colour?',
        answer:
          'Yes. Each colour role in the Violet palette can be edited independently in the Linky editor. You can shift the base hue, change the card colour, and adjust the label colour to suit your brand.',
      },
      {
        question: 'Does Violet look good for a music artist page?',
        answer:
          'Violet is one of the most popular choices for music artists and performers because the dark indigo palette pairs well with album artwork and creates a stage-ready, atmospheric feel on mobile.',
      },
      {
        question: 'Will the white text on a dark background be accessible?',
        answer:
          'The Violet theme is designed with high contrast in mind - pure white labels on a dark indigo background comfortably exceed the WCAG AA 4.5:1 contrast ratio for normal text, making your links easy to read for all visitors.',
      },
    ],
  },
  {
    slug: 'midnight',
    name: 'Midnight',
    h1: 'Midnight - a dark link in bio template',
    answer:
      'Midnight is a pure-black, achromatic dark-mode template with white text and a subtle dark-grey border, delivering the highest-contrast look available on Linky for creators who want a bold, no-colour aesthetic.',
    targetKeyword: 'dark link in bio template',
    palette: PALETTES['midnight'],
    sections: [
      {
        heading: 'Pure black, maximum contrast',
        body: 'Midnight uses a pure-black page background (0 % lightness, zero saturation) and an equally black primary card background - so link cards appear flush with the page until the subtle dark-grey border at 16 % lightness draws a clean, understated outline. White labels at 100 % lightness stand out with striking clarity. The palette is entirely achromatic: there is not a single hue in the system, which makes any profile photo or link thumbnail pop dramatically against the background.',
      },
      {
        heading: "What's in the Midnight palette",
        body: 'All seven colour roles are shades of grey or pure black and white. The base and primary card are both solid black. The secondary surface is a light grey (90 % lightness) used for avatar placeholders. The border is a very dark grey (16 % lightness), just visible enough to define card edges. Both the primary and secondary labels are pure or near-white - the secondary label at 98 % lightness is almost identical to primary, keeping body text legible even at smaller sizes.',
      },
      {
        heading: 'Who Midnight is best for',
        body: 'Midnight is the go-to choice for photographers, filmmakers, typographers, architects, and anyone whose work is best viewed against a dark neutral background. It is also a strong choice for tech creators, software engineers, and brands with a monochromatic identity. Because the background is pure black, it blends seamlessly with OLED screens, saving battery while looking intentional.',
      },
      {
        heading: 'Making Midnight your own',
        body: "Start from Midnight in the Linky editor and your page immediately takes on a high-fashion, editorial quality. From there, try nudging the border colour to a very dark navy or charcoal to add a hint of warmth without breaking the dark-mode feel. You can also introduce a single accent colour to link card backgrounds - the pure black canvas makes even a subtle accent pop. The template name and all copy is yours to replace; Midnight is simply the palette you're building on.",
      },
    ],
    faqs: [
      {
        question: 'Is the Midnight template free?',
        answer:
          'Yes. Midnight is available on every Linky plan, including the free tier. Dark themes carry no extra cost.',
      },
      {
        question: 'Can I add a colour accent to the Midnight theme?',
        answer:
          'Yes. Because the Midnight base is pure black, adding a colour to a single role - such as the card background or border - creates a vivid accent effect. You can do this for any colour role in the editor.',
      },
      {
        question: 'Is the black background true black on OLED screens?',
        answer:
          "Yes. The Midnight background is set to 0 % lightness with zero saturation, which renders as #000000 - true black on all screens, including OLED displays where true black pixels are fully turned off.",
      },
      {
        question: 'Is white text on a black background accessible?',
        answer:
          'Pure white on pure black achieves a 21:1 contrast ratio - the theoretical maximum - far exceeding WCAG AAA requirements. Midnight is among the most accessible colour combinations possible for web content.',
      },
    ],
  },
  {
    slug: 'forest',
    name: 'Forest',
    h1: 'Forest - a green link in bio template',
    answer:
      'Forest is an earthy, muted-green dark template with desaturated green backgrounds and a soft sage-green secondary label, evoking a natural, grounded aesthetic without relying on loud or artificial greens.',
    targetKeyword: 'green link in bio template',
    palette: PALETTES['forest'],
    sections: [
      {
        heading: 'Earthy greens that feel grounded',
        body: 'Forest builds its palette from hue 141 - a cool, mossy green - at medium-dark lightness values. The page base sits at 41 % lightness with low saturation (8 %), giving it the feel of a shaded clearing rather than a bright meadow. Link cards drop to 31 % lightness, creating a subtle depth between page and card. Because both the base and card are restrained in saturation, the template reads as natural and earthy rather than garish.',
      },
      {
        heading: "What's included in the Forest palette",
        body: "The seven Forest colour roles span two layers of muted green (base and primary card), a light-grey secondary surface for avatar placeholders, and a matching card border that mirrors the primary card colour for a seamless, inset look. Primary labels are white (100 % lightness), ensuring headline readability. The secondary label is a light sage green (hue 141, 84 % lightness, 41 % saturation) - a softer, warmer tone that reinforces the nature theme without competing with primary text. Tertiary labels are near-white.",
      },
      {
        heading: 'Who Forest is best for',
        body: 'Forest resonates with outdoor enthusiasts, sustainability advocates, food and wellness creators, gardeners, environmental non-profits, and lifestyle brands with a nature-forward identity. The muted, mid-range greens photograph well alongside plant-themed avatars and earthy product photography. If your content lives at the intersection of nature and community, Forest will feel immediately authentic.',
      },
      {
        heading: 'Customising Forest in the editor',
        body: 'Load Forest in the Linky editor and you have a ready-made nature palette that you can nudge in any direction - deeper towards a forest-floor dark green, lighter towards a spring sage, or slightly warmer towards an olive. Because the border and card background share the same colour by default, increasing the border lightness slightly creates a subtle card outline that adds refinement without breaking the earthy feel.',
      },
    ],
    faqs: [
      {
        question: 'Is the Forest template free?',
        answer:
          'Yes. Forest is included in all Linky plans, including free accounts. There is no extra charge for themed templates.',
      },
      {
        question: 'Can I adjust the green shade to match my brand?',
        answer:
          'Yes. In the Linky editor you can shift the hue of the Forest palette away from the default mossy 141° green towards a more yellow-green or blue-green, and adjust the saturation and lightness of each colour role independently.',
      },
      {
        question: 'Does Forest work for a plant or gardening creator?',
        answer:
          'Forest is an especially good fit for plant creators, gardeners, and nature photographers. The muted green tones complement botanical photography and create a cohesive, on-brand look that reinforces your content niche.',
      },
      {
        question: 'How does Forest look on mobile devices?',
        answer:
          'Forest renders well on all screen sizes. The muted green tones maintain their character under different ambient lighting conditions, and the white-on-green contrast ensures links remain easy to read even in bright sunlight.',
      },
    ],
  },
  {
    slug: 'lilac',
    name: 'Lilac',
    h1: 'Lilac - a pastel link in bio template',
    answer:
      'Lilac is a soft, light-mode template built on a pale blue-violet background with near-white card surfaces and deep indigo text, delivering a gentle pastel aesthetic perfect for lifestyle, beauty, and wellness creators.',
    targetKeyword: 'pastel link in bio template',
    palette: PALETTES['lilac'],
    sections: [
      {
        heading: 'Soft pastels with a blue-violet character',
        body: 'Lilac centres on hue 244-250 - a blue-leaning violet - expressed at high lightness values to keep everything airy and calm. The page base sits at 85 % lightness with full saturation (s: 1), creating a vivid but still gentle periwinkle wash. Card backgrounds step up to 92 % lightness, nearly white with a hint of blue-violet. The overall impression is fresh, soft, and distinctly feminine without being clichéd.',
      },
      {
        heading: "What's included in the Lilac palette",
        body: "The seven colour roles form a tight, harmonious family: a periwinkle page base, an almost-white primary card, a pure-black secondary surface (used for avatar placeholder areas), a medium-saturation blue-violet border at 76 % lightness, and a deep indigo primary label (hue 250, 18 % lightness, 32 % saturation). Notably, all three label roles - primary, secondary, and tertiary - share the same deep indigo value, which simplifies the palette and ensures consistent, readable text throughout.",
      },
      {
        heading: 'Who Lilac is best for',
        body: 'Lilac appeals to lifestyle bloggers, beauty and skincare creators, wedding planners, florists, mental-health advocates, and any creator whose content evokes calm, care, and softness. The periwinkle-to-near-white gradient feels contemporary and Instagram-friendly. It also works well for small businesses in the wellness space - yoga instructors, therapists, and coaches - where a gentle, approachable tone builds trust.',
      },
      {
        heading: 'Personalising Lilac in the editor',
        body: 'Open the Linky editor with Lilac selected and you immediately have a pastel foundation to build on. Try shifting the hue slightly warmer (towards lavender) or cooler (towards sky blue) to match your exact brand colour. Increasing the border saturation makes card edges more defined, while reducing it creates an almost-invisible boundary for a minimal float effect. The deep indigo labels can also be lightened for an even softer, more ethereal look.',
      },
    ],
    faqs: [
      {
        question: 'Is the Lilac template free?',
        answer:
          'Yes. Lilac is available to all Linky users at no cost, including those on the free plan.',
      },
      {
        question: 'Can I change the Lilac hue to a warmer purple or pink?',
        answer:
          'Yes. The hue of each colour role is fully customisable in the editor. Shifting hue 244 towards 280-300 moves the palette from periwinkle towards true lavender or soft purple, while values around 320-340 take it towards rose and pink.',
      },
      {
        question: 'Does Lilac suit a beauty or skincare brand page?',
        answer:
          'Lilac is one of the best-performing themes for beauty and skincare creators. The soft, high-lightness palette reads as clean and premium without requiring any design work beyond loading the template and adding your links.',
      },
      {
        question: 'Is the Lilac template accessible for visitors with colour vision deficiencies?',
        answer:
          'The primary text (deep indigo at 18 % lightness on a near-white card) achieves strong contrast and is readable for most colour vision types. If you need to optimise further, the editor lets you darken the labels or increase card contrast.',
      },
    ],
  },
  {
    slug: 'orange-punch',
    name: 'Orange Punch',
    h1: 'Orange Punch - a bold, colourful link in bio template',
    answer:
      'Orange Punch is a high-energy, multi-tonal template that pairs a deep navy background with vivid orange card surfaces, amber secondary accents, and mint-green text - an eye-catching combination built for creators who want maximum impact.',
    targetKeyword: 'colorful link in bio template',
    palette: PALETTES['orange-punch'],
    sections: [
      {
        heading: 'A bold palette built for impact',
        body: 'Orange Punch is unlike any other Linky theme - it layers three distinct hue families into a single page. The background is a deep navy (hue 226, 10 % lightness, 48 % saturation), grounding the page in a dark, dramatic base. Link cards explode with a vivid warm orange (hue 13.5, 53 % lightness, 67 % saturation), and secondary surfaces shift to a rich amber-orange (hue 33, 48 % lightness, 95 % saturation). The contrast between the dark navy and bright orange is intentionally high-energy.',
      },
      {
        heading: "What's in the Orange Punch palette",
        body: 'Seven colour roles span three hue families: the dark navy base and matching border, a vivid orange primary card, an amber secondary surface, and mint-green labels. Primary text (hue 144, 69 % lightness, 78 % saturation) is a medium mint-green that reads legibly on both the orange cards and the navy page. Secondary labels are an almost-white mint (97 % lightness), while tertiary labels step back to a nearly pure white. The palette rewards bold design choices and leans into unexpected colour pairings.',
      },
      {
        heading: 'Who Orange Punch is best for',
        body: "Orange Punch is designed for creators who want to stand out immediately - street-wear brands, tattoo artists, graphic designers, festival organisers, sports teams, and food creators who want their page to feel as vibrant as their content. The navy-and-orange combination has a strong sports-and-streetwear association, while the mint-green labels add a retro, neon-sign quality. This template won't suit understated brands, but for creators who want bold, it delivers.",
      },
      {
        heading: 'Pushing Orange Punch further in the editor',
        body: "Load Orange Punch in the Linky editor and you have the most expressive starting palette in Linky's library. You can dial back the saturation for a more muted take, or shift the orange towards a deeper burnt-sienna to soften the contrast. The mint labels can be swapped for cream or white if you prefer a simpler text treatment. Because the three hue families are all independently adjustable, you can take this palette in almost any bold direction without starting from scratch.",
      },
    ],
    faqs: [
      {
        question: 'Is the Orange Punch template free?',
        answer:
          'Yes. Orange Punch is included on all Linky plans, including the free tier. Bold themes are available to every user.',
      },
      {
        question: 'Can I tone down the Orange Punch palette for a less intense look?',
        answer:
          'Absolutely. You can reduce the saturation of the orange card colour, lighten the base navy, or swap the mint-green labels for white to create a more restrained version while keeping the overall structure.',
      },
      {
        question: 'Does Orange Punch work for a food or beverage brand?',
        answer:
          'Orange Punch is a strong fit for food and beverage brands, particularly those in the hot sauce, craft beer, juice, or street food space. The warm orange tones evoke appetite and energy, and the navy ground creates a premium contrast.',
      },
      {
        question: 'Will the mint-green text on an orange background be readable?',
        answer:
          'The mint-green primary label at 69 % lightness on an orange card (53 % lightness) is designed for medium-contrast readability in keeping with the bold, expressive character of the theme. If you need higher contrast, swapping the label to white or near-white will maximise legibility.',
      },
    ],
  },
  {
    slug: 'ocean',
    name: 'Ocean',
    h1: 'Ocean - a blue link in bio template',
    answer:
      'Ocean is a deep-blue dark-mode template with layered navy backgrounds and a light sky-blue secondary label, giving your page a calm, confident maritime feel that works for tech creators, travel accounts, and trust-led brands alike.',
    targetKeyword: 'blue link in bio template',
    palette: PALETTES['ocean'],
    sections: [
      {
        heading: 'Deep blues with real depth',
        body: 'Ocean builds its palette around hue 215 - a true, slightly cool blue - at dark lightness values. The page base sits at 16 % lightness with 55 % saturation, the colour of open water at dusk, while link cards drop to 11 % lightness for a layered, recessed feel. A muted blue border at 26 % lightness traces the card edges without breaking the immersive palette. The result reads as deep and steady rather than corporate or cold.',
      },
      {
        heading: "What's included in the Ocean palette",
        body: 'Seven colour roles make up the Ocean system: two layered navy backgrounds (base and primary card), a light-grey secondary surface for avatar placeholders, a desaturated blue border, and a pure-white primary label. The secondary label is a light sky blue (hue 205, 78 % lightness) that adds a fresh, airy note against the dark water tones - like light hitting the surface. Tertiary labels are near-white, matching the other dark themes.',
      },
      {
        heading: 'Who Ocean is best for',
        body: "Blue is the most universally trusted colour in branding, and Ocean leans into that. It suits software engineers, SaaS founders, finance and crypto creators, travel bloggers, divers, surfers, and sailing accounts - anyone whose audience associates blue with reliability, depth, or the sea itself. If your existing brand colour is in the blue family, Ocean will feel on-brand the moment you load it.",
      },
      {
        heading: 'Customising Ocean in the editor',
        body: 'Select Ocean in the Linky editor and your page takes on its deep-water atmosphere instantly. From there you can shift the hue cooler towards teal for a tropical feel, or warmer towards indigo for something moodier. Lightening the base a few points creates a softer twilight look, while increasing the border lightness gives cards a sharper, more technical outline. All seven roles are independently editable, so you can fine-tune the depth without losing the structure.',
      },
    ],
    faqs: [
      {
        question: 'Is the Ocean template free?',
        answer:
          'Yes. Ocean is available on every Linky plan, including the free tier. All themed templates are included at no extra cost.',
      },
      {
        question: 'Can I make Ocean lighter or shift it towards teal?',
        answer:
          'Yes. Every colour role in the Ocean palette is independently editable. Shifting the base hue from 215 towards 180-190 moves the palette into teal and aqua territory, and raising the lightness produces a softer daytime-sky variant.',
      },
      {
        question: 'Does Ocean suit a professional or tech profile?',
        answer:
          'Ocean is a natural fit for developers, founders, and finance creators. Deep blue carries strong associations with trust and competence, and the dark-mode structure pairs well with product screenshots and technical content.',
      },
      {
        question: 'Is the white text on the navy background accessible?',
        answer:
          'Yes. Pure-white labels on a navy base at 16 % lightness comfortably exceed the WCAG AA 4.5:1 contrast requirement for normal text, so links remain easy to read for all visitors.',
      },
    ],
  },
  {
    slug: 'blush',
    name: 'Blush',
    h1: 'Blush - a pink link in bio template',
    answer:
      'Blush is a soft pink light-mode template that pairs a rosy page background with near-white cards and deep berry text, delivering a warm, romantic aesthetic ideal for beauty creators, lifestyle bloggers, and wedding professionals.',
    targetKeyword: 'pink link in bio template',
    palette: PALETTES['blush'],
    sections: [
      {
        heading: 'Soft pinks with a warm undertone',
        body: 'Blush centres on hue 348-350 - a warm rose pink - expressed at high lightness to keep the page gentle rather than loud. The base sits at 91 % lightness with 72 % saturation, a true blush wash, while link cards rise to 96 % lightness, nearly white with the faintest pink tint. A rose border at 82 % lightness gives cards a soft, defined edge. The overall impression is warm, romantic, and contemporary without tipping into saccharine.',
      },
      {
        heading: "What's included in the Blush palette",
        body: 'The seven colour roles form a close-knit warm family: a blush page base, an almost-white primary card, a pure-black secondary surface for avatar placeholder areas, a medium rose border, and a deep berry label (hue 345, 20 % lightness, 45 % saturation). As with the Lilac theme, all three label roles share the same deep berry value, which keeps text consistent and highly readable across the whole page.',
      },
      {
        heading: 'Who Blush is best for',
        body: 'Blush is made for beauty and skincare creators, nail artists, lifestyle and fashion bloggers, wedding planners, florists, bakers, and romance authors. The rose-to-white gradient photographs beautifully behind product shots and selfies, and the deep berry text keeps everything grounded and legible. It also suits small businesses in self-care and wellness where warmth and approachability build trust.',
      },
      {
        heading: 'Personalising Blush in the editor',
        body: 'Open the Linky editor with Blush selected and you have a ready-made soft-pink foundation. Shift the hue a few degrees towards 330 for a cooler, more magenta pink, or towards 10-15 for a peachy coral take. Lowering the base saturation produces a dusty, muted rose that reads more editorial, while darkening the berry labels further increases contrast for maximum readability.',
      },
    ],
    faqs: [
      {
        question: 'Is the Blush template free?',
        answer:
          'Yes. Blush is available to all Linky users at no cost, including those on the free plan.',
      },
      {
        question: 'Can I make the pink more muted or more vivid?',
        answer:
          'Yes. The saturation of every colour role is fully adjustable in the editor. Lowering the base saturation creates a dusty-rose, editorial look, while raising it pushes the palette towards a bolder bubblegum pink.',
      },
      {
        question: 'Does Blush work for a beauty or nail business?',
        answer:
          'Blush is one of the strongest fits for beauty, nail, and skincare creators. The soft pink palette reads as warm and premium, and it provides a flattering backdrop for product photography and portfolio shots.',
      },
      {
        question: 'Is the dark text on the pink background accessible?',
        answer:
          'Yes. The deep berry label at 20 % lightness on a near-white card achieves strong contrast, comfortably exceeding WCAG AA requirements for normal text.',
      },
    ],
  },
  {
    slug: 'sandstone',
    name: 'Sandstone',
    h1: 'Sandstone - a warm beige link in bio template',
    answer:
      'Sandstone is a warm, neutral light-mode template built on a sandy beige background with cream cards and espresso-brown text, giving your page the calm, organic feel of natural linen and unbleached paper.',
    targetKeyword: 'beige aesthetic link in bio template',
    palette: PALETTES['sandstone'],
    sections: [
      {
        heading: 'Warm neutrals, naturally calm',
        body: 'Sandstone works in the hue 28-38 range - the territory of sand, oat, and unbleached linen. The page base sits at 90 % lightness with gentle 35 % saturation, while link cards rise to a creamy 96 % lightness. A soft sand border at 80 % lightness keeps card edges visible but quiet. Espresso-brown primary text at 16 % lightness anchors the palette, with a lighter taupe secondary label stepping back for supporting copy.',
      },
      {
        heading: "What's included in the Sandstone palette",
        body: 'The seven colour roles cover a sandy beige base, a cream primary card, a light-grey secondary surface for avatar placeholders, a warm sand border, an espresso primary label, a taupe secondary label at 32 % lightness, and a near-white tertiary label. Unlike a plain grey neutral theme, every tone here carries a warm undertone, which makes photography - especially skin tones, food, and natural materials - look richer against it.',
      },
      {
        heading: 'Who Sandstone is best for',
        body: 'Sandstone suits creators with an organic, earthy aesthetic: interior designers, ceramicists, slow-fashion brands, coffee shops, bakers, photographers, and wellness practitioners. It is also the go-to for the minimalist-but-warm Instagram aesthetic - if your grid leans into beiges, browns, and natural light, Sandstone extends that feel to your link page without any customisation.',
      },
      {
        heading: 'Adjusting Sandstone in the editor',
        body: 'Load Sandstone in the Linky editor and you can push the palette in several directions while keeping its calm character. Nudging the base hue towards 45-50 produces a yellower wheat tone; moving towards 20 gives a pinker, terracotta-adjacent sand. Reducing saturation across the board lands you in greige territory for a more architectural look. The espresso labels can also be warmed towards chestnut or cooled towards charcoal.',
      },
    ],
    faqs: [
      {
        question: 'Is the Sandstone template free?',
        answer:
          'Yes. Sandstone is included in all Linky plans, including free accounts. There is no extra charge for themed templates.',
      },
      {
        question: 'Can I make Sandstone cooler or more grey?',
        answer:
          'Yes. Lowering the saturation of the base and card colours moves the palette from warm sand towards greige and stone. All seven colour roles can be adjusted independently in the editor.',
      },
      {
        question: 'Does Sandstone suit a food or interior design account?',
        answer:
          'Sandstone is an excellent match for food, coffee, ceramics, and interiors content. Warm neutral backgrounds make natural materials and food photography look richer, and the palette signals a considered, organic brand.',
      },
      {
        question: 'How does Sandstone compare with the Classic template?',
        answer:
          'Both are light, minimal themes. Classic is a cool-leaning neutral with white cards and grey borders, while Sandstone carries a consistent warm undertone throughout - beige base, cream cards, and brown text - for an earthier, cosier feel.',
      },
    ],
  },
  {
    slug: 'slate',
    name: 'Slate',
    h1: 'Slate - a professional link in bio template',
    answer:
      'Slate is a cool grey-blue light-mode template with crisp white cards and deep slate-navy text, engineered to read as polished and credible - the natural choice for consultants, founders, and anyone using a link page professionally.',
    targetKeyword: 'professional link in bio template',
    palette: PALETTES['slate'],
    sections: [
      {
        heading: 'A cool, businesslike neutral',
        body: 'Slate is built on hue 215-217 at very low saturation - grey with a deliberate cool blue cast. The page base sits at 93 % lightness, pure-white cards float on top of it, and a cool border at 85 % lightness defines edges with quiet precision. Primary text is a deep slate navy (14 % lightness, 30 % saturation) rather than plain black, which softens the page just enough to feel designed rather than default.',
      },
      {
        heading: "What's included in the Slate palette",
        body: 'The seven colour roles comprise a cool-grey base, pure-white primary cards, a slightly darker cool-grey secondary surface, a matching cool border, a slate-navy primary label, a medium grey-blue secondary label at 34 % lightness, and a near-white tertiary label. Every grey in the system shares the same hue family, which is what gives Slate its coherent, considered character compared with mixing warm and cool neutrals.',
      },
      {
        heading: 'Who Slate is best for',
        body: 'Slate is aimed at people who use their link page for work: consultants, lawyers, accountants, recruiters, agency owners, B2B founders, and job seekers consolidating their CV, portfolio, and contact links. It also suits newsletters and podcasts with a serious editorial tone. If a visitor should leave your page thinking competent and trustworthy, Slate is the strongest starting point in the library.',
      },
      {
        heading: 'Tailoring Slate in the editor',
        body: 'Open Slate in the Linky editor and you have a corporate-grade foundation that accepts a brand colour gracefully. Try swapping the border or secondary surface for your brand hue at low saturation to add identity without losing restraint. Darkening the base a few points creates a subtle contrast boost for card edges, and the slate-navy labels can be shifted to true black if you prefer maximum formality.',
      },
    ],
    faqs: [
      {
        question: 'Is the Slate template free?',
        answer:
          'Yes. Slate is available on every Linky plan, including the free tier.',
      },
      {
        question: 'Can I add my company brand colour to Slate?',
        answer:
          'Yes. The cool-neutral structure of Slate is designed to accept an accent. Applying your brand colour to the border or secondary surface role adds identity while the white cards and slate text keep the page professional.',
      },
      {
        question: 'Is Slate a good choice for a CV or job-search page?',
        answer:
          'Slate is arguably the best fit in the library for a professional landing page. The cool neutral palette and high-contrast text read as credible and organised - exactly the impression you want a recruiter or client to take away.',
      },
      {
        question: 'How does Slate differ from the Classic template?',
        answer:
          'Classic is a warm-leaning minimal theme with an off-white base; Slate is its cooler, more corporate sibling. Slate uses a consistent blue-grey hue family and slate-navy text, which reads noticeably more businesslike than Classic’s softer neutrals.',
      },
    ],
  },
  {
    slug: 'neon',
    name: 'Neon',
    h1: 'Neon - a neon link in bio template',
    answer:
      'Neon is a near-black dark template electrified by a vivid lime-green accent used for both text and highlights, creating a terminal-inspired, after-dark look built for gamers, streamers, producers, and nightlife brands.',
    targetKeyword: 'neon link in bio template',
    palette: PALETTES['neon'],
    sections: [
      {
        heading: 'One colour, maximum voltage',
        body: 'Neon pairs a near-black page base (4 % lightness) and dark charcoal cards (9 % lightness) with a single electric accent: a fully saturated lime green at hue 84 and 59 % lightness. That lime drives the primary label and the secondary surface, while a darker 40 %-lightness version of the same green outlines each card like a powered-on sign. The restraint is the point - one vivid hue against black hits harder than a rainbow.',
      },
      {
        heading: "What's in the Neon palette",
        body: 'Seven colour roles: a near-black base, a charcoal primary card, a neon-lime secondary surface, a deep lime border, a neon-lime primary label, an off-white secondary label at 92 % lightness for supporting copy, and a near-white tertiary label. The off-white secondary text matters - it gives longer descriptions a calm, readable tone so the lime can stay reserved for names, headings, and links.',
      },
      {
        heading: 'Who Neon is best for',
        body: 'Neon is built for creators whose work happens after dark: streamers, esports players, DJs, electronic music producers, club promoters, and tattoo artists. It also lands with developers and tech creators who appreciate the terminal-green-on-black aesthetic. If your thumbnails, overlays, or cover art already use a neon accent, this template will make your link page feel like part of the same set.',
      },
      {
        heading: 'Re-wiring Neon in the editor',
        body: 'The genius of a single-accent theme is how easy it is to re-colour. Load Neon in the Linky editor and shift the accent hue to 180 for cyan, 300 for magenta, or 55 for electric yellow - every other role stays put and the look holds. You can also soften the effect by dropping the accent saturation, or raise the card lightness slightly if you want more separation from the page background.',
      },
    ],
    faqs: [
      {
        question: 'Is the Neon template free?',
        answer:
          'Yes. Neon is included on all Linky plans, including the free tier.',
      },
      {
        question: 'Can I change the lime green to a different neon colour?',
        answer:
          'Yes, and it is the easiest theme to re-colour. Because a single accent hue drives the labels, border, and secondary surface, shifting that hue to cyan, magenta, or yellow transforms the whole page in seconds.',
      },
      {
        question: 'Is neon green text on black readable?',
        answer:
          'The lime label at 59 % lightness and full saturation on a near-black background achieves strong contrast, comfortably above WCAG AA for normal text. Longer supporting copy uses the off-white secondary label for relaxed reading.',
      },
      {
        question: 'Does Neon work for a streamer or gaming profile?',
        answer:
          'Neon is purpose-built for streaming and gaming audiences. The black-and-accent structure mirrors popular overlay and thumbnail styles, so your link page feels continuous with the rest of your channel branding.',
      },
    ],
  },
  {
    slug: 'mocha',
    name: 'Mocha',
    h1: 'Mocha - a brown link in bio template',
    answer:
      'Mocha is a rich coffee-brown dark template with layered espresso backgrounds, cream headline text, and a soft latte secondary label - a cosy, grounded aesthetic for coffee brands, bakers, craftspeople, and earthy lifestyle creators.',
    targetKeyword: 'brown link in bio template',
    palette: PALETTES['mocha'],
    sections: [
      {
        heading: 'Coffee tones with real warmth',
        body: 'Mocha lives in the hue 24-33 range - the spectrum running from espresso to steamed milk. The page base is a dark coffee brown at 18 % lightness with 30 % saturation, and link cards sink to a darker 13 % roast for layered depth. A lighter brown border at 28 % lightness traces card edges gently. Cream primary text at 93 % lightness and a latte-toned secondary label complete the cafe palette.',
      },
      {
        heading: "What's included in the Mocha palette",
        body: 'Seven colour roles: two layers of dark coffee brown (base and primary card), a light-grey secondary surface for avatar placeholders, a warm brown border, a cream primary label, a latte secondary label (hue 30, 78 % lightness), and a near-white tertiary label. Because every tone shares a warm undertone, the page feels enveloping rather than dim - more candlelit cafe than dark mode.',
      },
      {
        heading: 'Who Mocha is best for',
        body: 'Mocha is a natural home for coffee shops and roasters, bakers, chocolatiers, leatherworkers, woodworkers, barbers, and vintage sellers. It also suits writers and slow-living creators who want a page that feels like a warm room. If your photography features wood, leather, baked goods, or warm light, Mocha will frame it beautifully.',
      },
      {
        heading: 'Brewing your own take in the editor',
        body: 'Load Mocha in the Linky editor and adjust to taste. Lightening the base towards 30-35 % produces a milk-chocolate tone; pushing the hue towards 15 adds a redder, mahogany cast; cooling towards 35-40 with lower saturation lands on taupe. The cream labels can be warmed further towards gold for a more vintage flavour, or swapped to pure white for a crisper modern contrast.',
      },
    ],
    faqs: [
      {
        question: 'Is the Mocha template free?',
        answer:
          'Yes. Mocha is available on every Linky plan, including the free tier.',
      },
      {
        question: 'Can I lighten Mocha for a milk-chocolate or caramel look?',
        answer:
          'Yes. Raising the lightness of the base and card roles moves the palette from espresso towards milk chocolate and caramel, and every colour role can be adjusted independently in the editor.',
      },
      {
        question: 'Does Mocha suit a cafe or food business page?',
        answer:
          'Mocha is an obvious fit for cafes, roasters, and bakeries - the palette literally mirrors the product. The warm dark background also makes food photography and product shots feel rich and appetising.',
      },
      {
        question: 'Is the cream text on the brown background accessible?',
        answer:
          'Yes. The cream primary label at 93 % lightness on an espresso base at 18 % lightness comfortably exceeds the WCAG AA 4.5:1 contrast ratio, keeping links easy to read.',
      },
    ],
  },
  {
    slug: 'sunbeam',
    name: 'Sunbeam',
    h1: 'Sunbeam - a yellow link in bio template',
    answer:
      'Sunbeam is a cheerful yellow light-mode template that pairs a soft butter-yellow background with cream cards and deep golden-brown text, radiating optimism and energy without sacrificing readability.',
    targetKeyword: 'yellow link in bio template',
    palette: PALETTES['sunbeam'],
    sections: [
      {
        heading: 'Yellow done right',
        body: 'Yellow is notoriously hard to use on the web - too saturated and it glares, too pale and it disappears. Sunbeam threads the needle with a butter-yellow base at 88 % lightness and 90 % saturation, soft enough to live behind text all day. Link cards rise to a creamy 96 % lightness, and a honey-toned border at 74 % lightness keeps edges defined. Deep golden-brown labels at 15 % lightness anchor the palette so the page feels sunny, never washed out.',
      },
      {
        heading: "What's included in the Sunbeam palette",
        body: 'The seven colour roles cover a butter-yellow base, a cream primary card, a light-grey secondary surface for avatar placeholders, a honey border, a deep golden-brown primary label, a softer bronze secondary label at 32 % lightness, and a near-white tertiary label. Every tone shares the same warm golden hue family, which is what keeps Sunbeam feeling coherent rather than merely bright.',
      },
      {
        heading: 'Who Sunbeam is best for',
        body: 'Sunbeam suits creators whose brand runs on positivity: illustrators, children’s authors, party planners, ice-cream and dessert shops, motivational coaches, and community organisers. Yellow is also the colour of attention - if your goal is a page that visitors remember after a single visit, Sunbeam delivers that with a friendly face. It pairs especially well with playful, hand-drawn, or pastel-toned profile imagery.',
      },
      {
        heading: 'Adjusting Sunbeam in the editor',
        body: 'Load Sunbeam in the Linky editor and tune the warmth to taste. Shifting the base hue towards 40 produces a richer marigold; towards 55-60 lands on a fresher lemon. Dropping the saturation moves the palette into elegant cream-and-gold territory that reads almost neutral. The golden-brown labels can be darkened to near-black for maximum contrast, or warmed further for a vintage, sun-faded feel.',
      },
    ],
    faqs: [
      {
        question: 'Is the Sunbeam template free?',
        answer:
          'Yes. Sunbeam is available on every Linky plan, including the free tier.',
      },
      {
        question: 'Is yellow hard to read? How does Sunbeam handle contrast?',
        answer:
          'Sunbeam avoids the classic yellow pitfall by keeping text in a deep golden brown at 15 % lightness on near-white cards - a combination that comfortably exceeds WCAG AA contrast requirements. The yellow lives in the background, not the text.',
      },
      {
        question: 'Can I make Sunbeam more orange or more lemon?',
        answer:
          'Yes. The base hue at 48 sits between the two - nudging it down towards 40 warms the page towards marigold and amber, while pushing up towards 58 cools it into lemon. Every colour role is independently adjustable.',
      },
      {
        question: 'What kind of creator suits a yellow page?',
        answer:
          'Yellow signals optimism, creativity, and approachability. Illustrators, dessert brands, event planners, kids’ content creators, and coaches all benefit from a page that feels instantly warm and energetic.',
      },
    ],
  },
  {
    slug: 'cherry',
    name: 'Cherry',
    h1: 'Cherry - a red link in bio template',
    answer:
      'Cherry is a deep-red dark-mode template with layered crimson backgrounds, white headline text, and a light rose secondary label - bold and passionate without tipping into alarm-button territory.',
    targetKeyword: 'red link in bio template',
    palette: PALETTES['cherry'],
    sections: [
      {
        heading: 'Deep reds with restraint',
        body: 'Pure red backgrounds shout; Cherry speaks firmly instead. The page base sits at hue 355 - a true cherry red - but at a dark 18 % lightness, reading as rich and velvety rather than aggressive. Link cards drop to 13 % lightness for a layered, dimensional feel, and a muted red border at 28 % lightness traces card edges. White primary labels cut cleanly through the dark red, giving the page a theatrical, curtain-up quality.',
      },
      {
        heading: "What's in the Cherry palette",
        body: 'Seven colour roles: two layers of deep cherry red (base and primary card), a light-grey secondary surface for avatar placeholders, a dark red border, a pure-white primary label, a light rose secondary label at 82 % lightness for supporting copy, and a near-white tertiary label. The rose secondary text is the detail that makes the palette sing - it echoes the background hue at high lightness, tying the whole page together.',
      },
      {
        heading: 'Who Cherry is best for',
        body: 'Red is the colour of passion, appetite, and urgency. Cherry suits musicians and bands, boxing and martial-arts gyms, hot-sauce and barbecue brands, tattoo artists, and fashion creators with a bold streak. It is also a strong pick for sports fans and team-affiliated accounts where red is already part of the identity. If your content trades on intensity, Cherry matches the energy.',
      },
      {
        heading: 'Customising Cherry in the editor',
        body: 'Open Cherry in the Linky editor and adjust the temperature of the red to suit your brand. Shifting the hue towards 10-15 warms it into a brick or rust red; moving towards 345 cools it towards raspberry. Lightening the base raises the energy towards a classic sports red, while darkening it further approaches a dramatic oxblood. The rose secondary label can also be swapped to white for a starker, more graphic look.',
      },
    ],
    faqs: [
      {
        question: 'Is the Cherry template free?',
        answer:
          'Yes. Cherry is included on all Linky plans, including the free tier.',
      },
      {
        question: 'Is a red page too aggressive for my brand?',
        answer:
          'Cherry deliberately uses dark, low-lightness reds rather than fire-engine tones, so it reads as rich and confident rather than alarming. If you want it softer still, lowering the saturation in the editor moves it towards a muted wine red.',
      },
      {
        question: 'Can I change Cherry to a brighter red?',
        answer:
          'Yes. Raising the lightness of the base and card colours moves the palette towards a vivid sports-team red. All seven colour roles are independently adjustable in the editor.',
      },
      {
        question: 'Is the white text on dark red accessible?',
        answer:
          'Yes. Pure-white labels on a cherry base at 18 % lightness comfortably exceed the WCAG AA 4.5:1 contrast ratio, so your links stay easy to read.',
      },
    ],
  },
  {
    slug: 'sage',
    name: 'Sage',
    h1: 'Sage - a sage green link in bio template',
    answer:
      'Sage is a muted green light-mode template built on a soft sage background with near-white cards and deep moss-green text, capturing the calm, organic aesthetic that has made sage green a staple of modern lifestyle branding.',
    targetKeyword: 'sage green link in bio template',
    palette: PALETTES['sage'],
    sections: [
      {
        heading: 'The quiet green',
        body: 'Sage works in low-saturation greens around hue 110-130. The page base is a classic sage at 86 % lightness with just 12 % saturation - green enough to feel botanical, grey enough to stay calm. Link cards rise to 94 % lightness with a whisper of green, and a matching muted border at 76 % lightness keeps the edges soft. Deep moss-green labels at 16 % lightness provide quiet, confident contrast.',
      },
      {
        heading: "What's included in the Sage palette",
        body: 'The seven colour roles span a sage base, a near-white green-tinted primary card, a light-grey secondary surface for avatar placeholders, a muted sage border, a deep moss primary label, a softer grey-green secondary label at 32 % lightness, and a near-white tertiary label. Where the Forest theme is a dark, immersive green, Sage is its daylight counterpart - the same botanical family expressed in light mode.',
      },
      {
        heading: 'Who Sage is best for',
        body: 'Sage green has become the signature colour of calm, intentional living. The template suits wellness practitioners, yoga and pilates instructors, therapists, plant shops, organic skincare brands, doulas and midwives, and slow-living content creators. If your Instagram grid already leans into sage, eucalyptus, and linen tones, this template extends that aesthetic to your link page with zero customisation.',
      },
      {
        heading: 'Tuning Sage in the editor',
        body: 'Load Sage in the Linky editor and adjust the green to match your exact brand. Shifting the hue towards 90 warms it into olive territory; towards 150-160 cools it towards eucalyptus and seafoam. Raising the saturation a few points makes the page noticeably more verdant, while lowering it approaches a green-tinted greige. The moss labels can be darkened to near-black for a crisper read.',
      },
    ],
    faqs: [
      {
        question: 'Is the Sage template free?',
        answer:
          'Yes. Sage is available to all Linky users at no cost, including those on the free plan.',
      },
      {
        question: 'How is Sage different from the Forest template?',
        answer:
          'Forest is a dark-mode theme built on medium-dark mossy greens with white text; Sage is a light-mode theme with a pale sage background and deep green text. They share a botanical character but suit opposite moods - Forest is immersive, Sage is airy.',
      },
      {
        question: 'Can I shift Sage towards olive or eucalyptus?',
        answer:
          'Yes. Moving the base hue down towards 90 produces an olive-khaki tone, while pushing up towards 150-160 lands on cooler eucalyptus and seafoam greens. Each colour role adjusts independently in the editor.',
      },
      {
        question: 'Does Sage suit a wellness or therapy practice?',
        answer:
          'Sage is arguably the best fit in the library for wellness professionals. Muted green is strongly associated with calm, balance, and nature, and the gentle contrast keeps the page feeling unhurried while remaining fully readable.',
      },
    ],
  },
  {
    slug: 'sky',
    name: 'Sky',
    h1: 'Sky - a light blue link in bio template',
    answer:
      'Sky is a fresh, light blue template that pairs a pale sky-blue background with near-white cards and deep navy text - open, optimistic, and effortlessly clean, like a clear morning.',
    targetKeyword: 'light blue link in bio template',
    palette: PALETTES['sky'],
    sections: [
      {
        heading: 'A clear-day palette',
        body: 'Sky is built on hue 204-212 - a true sky blue - at high lightness values. The page base sits at 88 % lightness with a generous 75 % saturation, giving it a fresh, unmistakably blue wash without weight. Link cards rise to 95 % lightness, nearly white with a cool tint, edged by a soft blue border at 78 % lightness. Deep navy labels at 16 % lightness keep everything crisp and legible.',
      },
      {
        heading: "What's included in the Sky palette",
        body: 'The seven colour roles form a single cool family: a pale sky-blue base, a near-white primary card, a light-grey secondary surface for avatar placeholders, a soft blue border, a deep navy primary label, a medium blue-grey secondary label at 32 % lightness, and a near-white tertiary label. Where the Ocean theme is blue at night, Sky is the same hue family in full daylight.',
      },
      {
        heading: 'Who Sky is best for',
        body: 'Sky suits creators who want to feel open and trustworthy without going dark or corporate: travel bloggers, swim and surf coaches, paediatric and family services, cleaning brands, productivity creators, and student communities. Light blue carries associations of clarity, honesty, and fresh air - a strong default for anyone whose page needs to feel friendly at first glance.',
      },
      {
        heading: 'Shaping Sky in the editor',
        body: 'Open Sky in the Linky editor and tilt the palette to your liking. Shifting the hue towards 190 freshens it into an aqua morning; towards 220 deepens it towards periwinkle. Lowering the base saturation produces a misty, Scandinavian softness, while raising the navy labels’ lightness gives the page a gentler, more pastel read. The structure holds up under all of these moves.',
      },
    ],
    faqs: [
      {
        question: 'Is the Sky template free?',
        answer:
          'Yes. Sky is included on every Linky plan, including the free tier.',
      },
      {
        question: 'How is Sky different from the Ocean template?',
        answer:
          'Ocean is a dark-mode theme - deep navy backgrounds with white text. Sky is its light-mode counterpart: a pale blue background with dark navy text. Same hue family, opposite brightness, very different mood.',
      },
      {
        question: 'Can I make Sky more pastel or more vivid?',
        answer:
          'Yes. Lowering the base saturation softens Sky into a misty pastel, while raising it (and nudging lightness down slightly) produces a more vivid, summery blue. Every colour role is independently editable.',
      },
      {
        question: 'Is the navy text on light blue accessible?',
        answer:
          'Yes. The deep navy primary label at 16 % lightness against near-white cards comfortably exceeds WCAG AA contrast requirements for normal text.',
      },
    ],
  },
  {
    slug: 'lagoon',
    name: 'Lagoon',
    h1: 'Lagoon - a teal link in bio template',
    answer:
      'Lagoon is a deep teal dark-mode template with layered blue-green backgrounds, white headline text, and a bright aqua secondary label - tropical depth with a modern, slightly technical edge.',
    targetKeyword: 'teal link in bio template',
    palette: PALETTES['lagoon'],
    sections: [
      {
        heading: 'Between blue and green',
        body: 'Teal occupies the territory where blue’s trust meets green’s freshness, and Lagoon makes the most of it. The page base sits at hue 185 - a true teal - at a deep 15 % lightness with 55 % saturation, while link cards sink to 10 % lightness for genuine depth. A muted teal border at 25 % lightness defines each card. The effect is somewhere between a tropical reef at depth and a modern fintech dashboard - in the best way.',
      },
      {
        heading: "What's in the Lagoon palette",
        body: 'Seven colour roles: two layers of deep teal (base and primary card), a light-grey secondary surface for avatar placeholders, a desaturated teal border, a pure-white primary label, a bright aqua secondary label (hue 175, 75 % lightness) that glows softly against the dark water tones, and a near-white tertiary label. The aqua secondary text is what gives Lagoon its bioluminescent character.',
      },
      {
        heading: 'Who Lagoon is best for',
        body: 'Lagoon suits creators in the space between nature and technology: scuba and freediving instructors, marine conservationists, aquarium hobbyists, pool and spa businesses - but equally developers, designers, and fintech founders who want a dark theme that is not just another navy. Teal is distinctive enough to be memorable while staying professional enough for business use.',
      },
      {
        heading: 'Adjusting Lagoon in the editor',
        body: 'Load Lagoon in the Linky editor and slide along the blue-green spectrum to taste. Shifting the hue towards 170 makes the page greener and more tropical; towards 200 cools it into a steely blue. Raising the base lightness a few points lifts the mood towards daylight shallows, while pushing the aqua secondary label brighter increases the bioluminescent contrast. All seven roles adjust independently.',
      },
    ],
    faqs: [
      {
        question: 'Is the Lagoon template free?',
        answer:
          'Yes. Lagoon is available on all Linky plans, including the free tier.',
      },
      {
        question: 'How does Lagoon differ from the Ocean template?',
        answer:
          'Ocean is a true blue (hue 215) with a navy character; Lagoon sits at hue 185, firmly in teal territory, with a brighter aqua accent. Ocean reads as steady and trustworthy, Lagoon as fresher and more distinctive.',
      },
      {
        question: 'Can I make Lagoon greener or bluer?',
        answer:
          'Yes. The base hue at 185 sits at the centre of the teal range - shifting towards 170 makes it greener and more tropical, towards 200 bluer and more technical. Every colour role is independently editable.',
      },
      {
        question: 'Is the white text on deep teal accessible?',
        answer:
          'Yes. Pure-white labels on the 15 %-lightness teal base comfortably exceed the WCAG AA 4.5:1 contrast ratio for normal text.',
      },
    ],
  },
  {
    slug: 'mulberry',
    name: 'Mulberry',
    h1: 'Mulberry - a burgundy link in bio template',
    answer:
      'Mulberry is a wine-dark template with layered burgundy backgrounds, white headline text, and a dusty rose secondary label - rich, literary, and quietly luxurious.',
    targetKeyword: 'burgundy link in bio template',
    palette: PALETTES['mulberry'],
    sections: [
      {
        heading: 'Wine-dark and warm',
        body: 'Mulberry is built on hue 340 - the boundary where red deepens into wine - at low lightness and moderate saturation. The page base sits at 17 % lightness, the colour of a good Malbec, and link cards drop to 12 % for a layered, velvet depth. A muted burgundy border at 27 % lightness keeps card edges defined without breaking the mood. White primary labels and a dusty rose secondary label complete a palette that feels like a private members’ club.',
      },
      {
        heading: "What's in the Mulberry palette",
        body: 'Seven colour roles: two layers of deep burgundy (base and primary card), a light-grey secondary surface for avatar placeholders, a desaturated wine border, a pure-white primary label, a dusty rose secondary label at 80 % lightness that softens supporting copy, and a near-white tertiary label. Compared with Cherry’s assertive red, Mulberry is cooler, deeper, and more reserved - claret rather than crimson.',
      },
      {
        heading: 'Who Mulberry is best for',
        body: 'Mulberry suits brands trading on richness and refinement: wine bars and sommeliers, bookshops and authors, jazz musicians, vintage fashion sellers, luxury candles and fragrance brands, and academia-adjacent creators. The dark-academia and quiet-luxury aesthetics both live comfortably here. If your brand would rather be described as cultivated than loud, Mulberry sets that tone instantly.',
      },
      {
        heading: 'Decanting Mulberry in the editor',
        body: 'Open Mulberry in the Linky editor and adjust the vintage. Shifting the hue towards 350-355 warms it towards a redder claret; towards 325 cools it into plum and aubergine territory. Raising the saturation deepens the jewel-tone richness, while lowering it produces a faded, antique rose-brown. The dusty rose secondary label can be brightened for more contrast or muted further for an even quieter page.',
      },
    ],
    faqs: [
      {
        question: 'Is the Mulberry template free?',
        answer:
          'Yes. Mulberry is included on every Linky plan, including the free tier.',
      },
      {
        question: 'How does Mulberry compare with the Cherry template?',
        answer:
          'Both are dark red-family themes, but Cherry sits at hue 355 with higher saturation - assertive and energetic - while Mulberry sits at hue 340 with softer saturation, reading as wine-dark, literary, and more reserved.',
      },
      {
        question: 'Can I shift Mulberry towards plum or maroon?',
        answer:
          'Yes. Moving the base hue down towards 325 takes the palette into plum and aubergine, while nudging towards 355 with a touch more saturation lands on a classic maroon. All colour roles adjust independently in the editor.',
      },
      {
        question: 'Does Mulberry suit a luxury or boutique brand?',
        answer:
          'Mulberry is one of the strongest choices for boutique and luxury positioning. Deep burgundy carries long-standing associations with wine, leather-bound books, and old-world quality - signals that translate directly to a premium first impression.',
      },
    ],
  },
  {
    slug: 'peach',
    name: 'Peach',
    h1: 'Peach - a peach link in bio template',
    answer:
      'Peach is a warm, sun-washed light template that pairs a soft peach background with near-white cards and deep terracotta text, landing between pink and orange for a friendly, summery glow.',
    targetKeyword: 'peach link in bio template',
    palette: PALETTES['peach'],
    sections: [
      {
        heading: 'A golden-hour glow',
        body: 'Peach lives at hue 22 - the sweet spot between pink’s softness and orange’s energy. The page base sits at 89 % lightness with a rich 85 % saturation, a true peach wash that feels sunlit rather than sugary. Link cards rise to 95 % lightness with a warm tint, edged by a soft apricot border at 80 % lightness. Deep terracotta labels at 20 % lightness ground the palette with an earthy, Mediterranean warmth.',
      },
      {
        heading: "What's included in the Peach palette",
        body: 'The seven colour roles form a tight warm family: a peach page base, a near-white warm card, a pure-black secondary surface for avatar placeholder areas, an apricot border, and a deep terracotta label. As with the Lilac and Blush themes, all three label roles share the same terracotta value, keeping text consistent and highly readable across the entire page.',
      },
      {
        heading: 'Who Peach is best for',
        body: 'Peach suits creators with warm, social energy: food bloggers and home cooks, picnic and events businesses, summer fashion brands, travel creators covering warm destinations, and lifestyle creators whose feeds run on golden-hour light. It shares Blush’s softness but trades the romance for sunshine - less wedding, more terrace lunch. If your photography is full of warm light, Peach will frame it perfectly.',
      },
      {
        heading: 'Ripening Peach in the editor',
        body: 'Load Peach in the Linky editor and slide along the warm spectrum. Shifting the hue towards 10-15 deepens it towards coral and salmon; towards 30-35 moves it into apricot and soft amber. Lowering the saturation lands on a barely-there nude tone that reads almost neutral, while darkening the terracotta labels increases contrast for a crisper finish.',
      },
    ],
    faqs: [
      {
        question: 'Is the Peach template free?',
        answer:
          'Yes. Peach is available to all Linky users at no cost, including those on the free plan.',
      },
      {
        question: 'How is Peach different from the Blush template?',
        answer:
          'Blush sits at hue 348-350 - a true rose pink - while Peach sits at hue 22, firmly in the warm orange-pink range. Blush reads as romantic and soft; Peach reads as sunny and sociable. They suit different moods of the same light, warm aesthetic.',
      },
      {
        question: 'Can I shift Peach towards coral or apricot?',
        answer:
          'Yes. Moving the base hue down towards 10-15 produces coral and salmon tones, while pushing up towards 30-35 lands on apricot and amber. Every colour role can be adjusted independently in the editor.',
      },
      {
        question: 'Is the terracotta text on the peach background accessible?',
        answer:
          'Yes. The deep terracotta label at 20 % lightness on near-white cards achieves strong contrast, comfortably exceeding WCAG AA requirements for normal text.',
      },
    ],
  },
  {
    slug: 'graphite',
    name: 'Graphite',
    h1: 'Graphite - a grey link in bio template',
    answer:
      'Graphite is a charcoal dark-mode template with subtly cool grey tones and elevated card surfaces - the softer alternative to pure black for creators who want a dark page with more nuance than Midnight.',
    targetKeyword: 'grey link in bio template',
    palette: PALETTES['graphite'],
    sections: [
      {
        heading: 'Dark mode with dimension',
        body: 'Where Midnight commits to pure black, Graphite works in charcoal. The page base sits at 12 % lightness with a barely-there cool cast (hue 220 at just 6 % saturation), and - uniquely among Linky’s dark themes - link cards rise to 17 % lightness, sitting visibly above the page like elevated surfaces in a modern app interface. A soft grey border at 26 % lightness completes the layered effect.',
      },
      {
        heading: "What's in the Graphite palette",
        body: 'Seven colour roles: a charcoal base, a lighter elevated primary card, a light-grey secondary surface for avatar placeholders, a medium-grey border, a pure-white primary label, a cool light-grey secondary label at 72 % lightness, and a near-white tertiary label. The consistent whisper of blue in every grey keeps the palette feeling considered rather than default - the same trick the Slate theme plays in light mode.',
      },
      {
        heading: 'Who Graphite is best for',
        body: 'Graphite suits creators who want dark mode without drama: product designers, developers, photographers who find pure black too stark, podcast hosts, and professionals who want a page that reads as serious after sunset. The elevated-card structure mirrors the design language of modern software interfaces, which makes it feel instantly familiar to a tech-literate audience.',
      },
      {
        heading: 'Sharpening Graphite in the editor',
        body: 'Open Graphite in the Linky editor and tune the character of the grey. Warming the hue towards 30-40 with a touch more saturation produces a taupe-charcoal that pairs beautifully with film photography; pushing saturation up at the existing hue deepens the blue-grey, approaching a dark slate. Lightening the cards further increases the elevation effect, while matching them to the base flattens the page towards Midnight’s aesthetic.',
      },
    ],
    faqs: [
      {
        question: 'Is the Graphite template free?',
        answer:
          'Yes. Graphite is included on all Linky plans, including the free tier.',
      },
      {
        question: 'How does Graphite differ from the Midnight template?',
        answer:
          'Midnight is pure black with cards flush against the page, defined only by a subtle border. Graphite is charcoal with cards visibly lighter than the background, creating an elevated, layered look closer to modern app interfaces.',
      },
      {
        question: 'Can I add a colour accent to Graphite?',
        answer:
          'Yes. The near-neutral charcoal base accepts an accent gracefully - applying a colour to the border or secondary label role adds personality while keeping the understated dark-mode character intact.',
      },
      {
        question: 'Is Graphite easier on the eyes than pure black?',
        answer:
          'Many readers find charcoal backgrounds more comfortable than pure black, as the reduced contrast between background and text lowers visual vibration. Graphite’s 12 % base with white text remains well above WCAG AA contrast requirements.',
      },
    ],
  },
  {
    slug: 'vapor',
    name: 'Vapor',
    h1: 'Vapor - a vaporwave link in bio template',
    answer:
      'Vapor is a retro-futurist template that layers hot magenta cards and a cyan accent over a deep violet-night background, channelling 80s sunset grids and synthwave album art for creators who live in that aesthetic.',
    targetKeyword: 'vaporwave link in bio template',
    palette: PALETTES['vapor'],
    sections: [
      {
        heading: 'A sunset grid for your links',
        body: 'Vapor layers three hue families the way synthwave artwork does. The page base is a deep violet night (hue 260, 12 % lightness), link cards glow in hot magenta-pink (hue 318, 50 % lightness, 60 % saturation), and secondary surfaces flash a vivid cyan at hue 190. Light-cyan labels at 80 % lightness read clearly against both the magenta cards and the violet night. The combination is unmistakably retro-futurist - neon signage on a digital horizon.',
      },
      {
        heading: "What's in the Vapor palette",
        body: 'Seven colour roles spanning three hue families: the violet-night base with a matching border for a seamless ground, a hot magenta primary card, a cyan secondary surface, a light-cyan primary label, a near-white cyan secondary label at 96 % lightness, and a near-white tertiary label. Like Orange Punch, Vapor is a multi-hue statement theme - but where Orange Punch is sport and streetwear, Vapor is arcade and synth.',
      },
      {
        heading: 'Who Vapor is best for',
        body: 'Vapor is built for creators fluent in retro-internet aesthetics: synthwave and electronic musicians, retro game streamers, pixel artists, VHS-style video editors, and anyone whose brand riffs on the 80s-90s digital past. It also works as a deliberate statement for developers and designers with a playful streak. This is not a theme for accountants - and that is exactly the point.',
      },
      {
        heading: 'Remixing Vapor in the editor',
        body: 'Load Vapor in the Linky editor and remix the era to taste. Shifting the card hue towards 330-340 moves the magenta towards hot pink; towards 300 lands on a purpler orchid. Swapping the cyan accent for a sunset orange creates a Miami-sunset variant, while darkening the cards towards the base produces a moodier, outrun-at-midnight feel. Three independent hue families give you a huge remix space.',
      },
    ],
    faqs: [
      {
        question: 'Is the Vapor template free?',
        answer:
          'Yes. Vapor is available on every Linky plan, including the free tier.',
      },
      {
        question: 'Is Vapor too loud for everyday use?',
        answer:
          'Vapor is intentionally a statement theme. If you love the aesthetic but want it quieter, lowering the saturation of the magenta cards and cyan accent in the editor produces a softer, pastel-vaporwave variant that keeps the character at lower volume.',
      },
      {
        question: 'Can I change the magenta and cyan to different neon colours?',
        answer:
          'Yes. The card, secondary surface, and label hues are all independently adjustable, so you can build any two- or three-colour neon combination - pink and yellow, purple and green, or a classic Miami orange and teal.',
      },
      {
        question: 'Will the cyan text be readable on the magenta cards?',
        answer:
          'The light-cyan primary label at 80 % lightness is calibrated to read against both the 50 %-lightness magenta cards and the dark violet base. For maximum legibility you can raise the label lightness further or swap it to white in the editor.',
      },
    ],
  },
  {
    slug: 'paper',
    name: 'Paper',
    h1: 'Paper - a black and white link in bio template',
    answer:
      'Paper is a stark black-and-white template with a pure-white background, white cards outlined by near-black borders, and near-black text - a brutalist, print-inspired look where typography does all the talking.',
    targetKeyword: 'black and white link in bio template',
    palette: PALETTES['paper'],
    sections: [
      {
        heading: 'Ink on paper, nothing else',
        body: 'Paper strips the palette to its absolute minimum: a pure-white page, pure-white cards, and a near-black border at 8 % lightness that outlines each card like a ruled box on a printed page. Primary text sits at 4 % lightness - effectively ink - with a medium-grey secondary label at 30 % for supporting copy. With no colour anywhere in the system, every ounce of personality comes from your words, your photography, and the stark geometry of the layout.',
      },
      {
        heading: "What's in the Paper palette",
        body: 'All seven colour roles are achromatic: white base, white primary card, a light-grey secondary surface for avatar placeholders, a near-black border, a near-black primary label, a medium-grey secondary label, and a near-white tertiary label. Paper is the light-mode mirror of Midnight - where Midnight is white ink on a black page, Paper is black ink on white, with the border doing the structural work that colour does elsewhere.',
      },
      {
        heading: 'Who Paper is best for',
        body: 'Paper suits creators whose work speaks in black and white: graphic designers, type designers, architects, fine-art and street photographers, zine makers, and writers. The brutalist outline aesthetic nods to print design, Swiss typography, and early-web minimalism. It is also the strongest possible canvas for colour photography - against a pure monochrome page, every image becomes the loudest thing on screen.',
      },
      {
        heading: 'Setting Paper in the editor',
        body: 'Load Paper in the Linky editor and the page snaps into its print-like grid immediately. From there, the smallest moves have the biggest effect: softening the border to a mid-grey relaxes the brutalism towards quiet minimalism; introducing a single colour to the border role creates a striking outlined-accent look; and warming the white base a few points towards cream shifts the reference from laser print to book paper.',
      },
    ],
    faqs: [
      {
        question: 'Is the Paper template free?',
        answer:
          'Yes. Paper is available on all Linky plans, including the free tier.',
      },
      {
        question: 'How is Paper different from the Classic template?',
        answer:
          'Classic is a soft minimal theme - warm off-white base, light grey borders, gentle contrast. Paper is deliberately stark: pure white, near-black borders, and maximum-contrast text. Classic recedes politely; Paper makes minimalism the statement.',
      },
      {
        question: 'Can I soften the harsh black borders?',
        answer:
          'Yes. The border colour is an independent role - lightening it from 8 % towards 50-70 % lightness moves the page from brutalist outlines to a soft, barely-there grid while keeping everything else identical.',
      },
      {
        question: 'Is Paper accessible?',
        answer:
          'Near-black text at 4 % lightness on a pure-white background delivers close to the maximum possible contrast ratio, far exceeding WCAG AAA requirements. Paper is among the most accessible palettes you can publish.',
      },
    ],
  },
];

export const templates = TEMPLATES.filter(isPublishableTemplate);
export const getTemplate = (slug: string) => templates.find((t) => t.slug === slug) ?? null;
export const getTemplateSlugs = () => templates.map((t) => t.slug);
