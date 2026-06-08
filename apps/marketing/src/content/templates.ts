import type { TemplateContent } from '@/content/pseo-types';
import { isPublishableTemplate } from '@/content/pseo-types';
import type { ThemePalette } from '@/components/pseo/theme-mock';

// Palettes mirror apps/frontend/lib/theme.ts defaultThemeSeeds (source of truth).
// All h/s/l values are copied verbatim — do NOT round or alter.
// Note: Purple.colorLabelPrimary and Forest.colorLabelPrimary have l:100 in the source
// (likely a pre-normalisation value); copied exactly as-is from the seed file.
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
    colorLabelPrimary: { h: 0, s: 0, l: 100 },
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
    colorLabelPrimary: { h: 0, s: 0, l: 100 },
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
};

const TEMPLATES: TemplateContent[] = [
  {
    slug: 'classic',
    name: 'Classic',
    h1: 'Classic — a minimal link in bio template',
    answer:
      'Classic is a clean, light-toned template built on an off-white background with near-black text, giving your page a timeless, professional look that never distracts from your links.',
    targetKeyword: 'minimal link in bio template',
    palette: PALETTES['classic'],
    sections: [
      {
        heading: 'A palette designed for readability',
        body: 'Classic uses a warm off-white page background (hue 60, very lightly saturated) paired with pure-white link cards and soft grey borders. The result is a page that feels airy and inviting without any distracting colour. Primary text sits at a near-black tone with a barely-there blue tint, while secondary text steps back to a medium grey — creating a clear visual hierarchy without needing any bold colour choices.',
      },
      {
        heading: "What's included in the Classic theme",
        body: "The palette ships with seven colour roles: a warm off-white base, white card backgrounds, a light-grey secondary surface, a near-white border, a near-black primary label, a dark-grey secondary label, and an almost-white tertiary label. Together they form a versatile neutral system that works well for personal portfolios, freelance creatives, and anyone who wants their content to do the talking rather than the colour scheme.",
      },
      {
        heading: 'Who Classic is best for',
        body: 'Classic suits creators who prefer understated design — writers, photographers, consultants, and freelancers who want a professional first impression. The neutral tones also make Classic an excellent starting point if you plan to layer in a custom accent colour or swap in a distinctive profile photo without fighting the background.',
      },
      {
        heading: 'Make it yours in the Linky editor',
        body: "Open the Linky editor and select the Classic theme to start with this palette pre-loaded. From there you can swap any of the seven colour roles — for example, nudging the background towards cream or increasing the border contrast — without affecting the overall minimal feel. Add your links, profile photo, and a short bio, and you're ready to publish.",
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
          'Absolutely. The Classic theme is just a starting point. In the editor you can adjust any of the seven colour roles — including swapping the warm off-white base for a pure white or a custom neutral — while keeping everything else in place.',
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
    h1: 'Violet — a purple link in bio template',
    answer:
      'Violet is a deep-purple dark-mode template with layered indigo backgrounds and bright-white text, creating a bold, atmospheric look well-suited to musicians, creators, and brands that want a distinctive purple identity.',
    targetKeyword: 'purple link in bio template',
    palette: PALETTES['violet'],
    sections: [
      {
        heading: 'A rich purple atmosphere',
        body: 'The Violet theme wraps everything in deep indigo tones — the page base sits at hue 255 with roughly 20 % lightness, and link card backgrounds drop even darker to about 13 % lightness, creating a layered sense of depth. A muted violet border at 28 % lightness defines card edges without breaking the moody palette. The overall impression is bold without being garish — deep, jewel-like purple that rewards a slow scroll.',
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
          'The Violet theme is designed with high contrast in mind — pure white labels on a dark indigo background comfortably exceed the WCAG AA 4.5:1 contrast ratio for normal text, making your links easy to read for all visitors.',
      },
    ],
  },
  {
    slug: 'midnight',
    name: 'Midnight',
    h1: 'Midnight — a dark link in bio template',
    answer:
      'Midnight is a pure-black, achromatic dark-mode template with white text and a subtle dark-grey border, delivering the highest-contrast look available on Linky for creators who want a bold, no-colour aesthetic.',
    targetKeyword: 'dark link in bio template',
    palette: PALETTES['midnight'],
    sections: [
      {
        heading: 'Pure black, maximum contrast',
        body: 'Midnight uses a pure-black page background (0 % lightness, zero saturation) and an equally black primary card background — so link cards appear flush with the page until the subtle dark-grey border at 16 % lightness draws a clean, understated outline. White labels at 100 % lightness stand out with striking clarity. The palette is entirely achromatic: there is not a single hue in the system, which makes any profile photo or link thumbnail pop dramatically against the background.',
      },
      {
        heading: "What's in the Midnight palette",
        body: 'All seven colour roles are shades of grey or pure black and white. The base and primary card are both solid black. The secondary surface is a light grey (90 % lightness) used for avatar placeholders. The border is a very dark grey (16 % lightness), just visible enough to define card edges. Both the primary and secondary labels are pure or near-white — the secondary label at 98 % lightness is almost identical to primary, keeping body text legible even at smaller sizes.',
      },
      {
        heading: 'Who Midnight is best for',
        body: 'Midnight is the go-to choice for photographers, filmmakers, typographers, architects, and anyone whose work is best viewed against a dark neutral background. It is also a strong choice for tech creators, software engineers, and brands with a monochromatic identity. Because the background is pure black, it blends seamlessly with OLED screens, saving battery while looking intentional.',
      },
      {
        heading: 'Making Midnight your own',
        body: "Start from Midnight in the Linky editor and your page immediately takes on a high-fashion, editorial quality. From there, try nudging the border colour to a very dark navy or charcoal to add a hint of warmth without breaking the dark-mode feel. You can also introduce a single accent colour to link card backgrounds — the pure black canvas makes even a subtle accent pop. The template name and all copy is yours to replace; Midnight is simply the palette you're building on.",
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
          'Yes. Because the Midnight base is pure black, adding a colour to a single role — such as the card background or border — creates a vivid accent effect. You can do this for any colour role in the editor.',
      },
      {
        question: 'Is the black background true black on OLED screens?',
        answer:
          "Yes. The Midnight background is set to 0 % lightness with zero saturation, which renders as #000000 — true black on all screens, including OLED displays where true black pixels are fully turned off.",
      },
      {
        question: 'Is white text on a black background accessible?',
        answer:
          'Pure white on pure black achieves a 21:1 contrast ratio — the theoretical maximum — far exceeding WCAG AAA requirements. Midnight is among the most accessible colour combinations possible for web content.',
      },
    ],
  },
  {
    slug: 'forest',
    name: 'Forest',
    h1: 'Forest — a green link in bio template',
    answer:
      'Forest is an earthy, muted-green dark template with desaturated green backgrounds and a soft sage-green secondary label, evoking a natural, grounded aesthetic without relying on loud or artificial greens.',
    targetKeyword: 'green link in bio template',
    palette: PALETTES['forest'],
    sections: [
      {
        heading: 'Earthy greens that feel grounded',
        body: 'Forest builds its palette from hue 141 — a cool, mossy green — at medium-dark lightness values. The page base sits at 41 % lightness with low saturation (8 %), giving it the feel of a shaded clearing rather than a bright meadow. Link cards drop to 31 % lightness, creating a subtle depth between page and card. Because both the base and card are restrained in saturation, the template reads as natural and earthy rather than garish.',
      },
      {
        heading: "What's included in the Forest palette",
        body: "The seven Forest colour roles span two layers of muted green (base and primary card), a light-grey secondary surface for avatar placeholders, and a matching card border that mirrors the primary card colour for a seamless, inset look. Primary labels are white (100 % lightness), ensuring headline readability. The secondary label is a light sage green (hue 141, 84 % lightness, 41 % saturation) — a softer, warmer tone that reinforces the nature theme without competing with primary text. Tertiary labels are near-white.",
      },
      {
        heading: 'Who Forest is best for',
        body: 'Forest resonates with outdoor enthusiasts, sustainability advocates, food and wellness creators, gardeners, environmental non-profits, and lifestyle brands with a nature-forward identity. The muted, mid-range greens photograph well alongside plant-themed avatars and earthy product photography. If your content lives at the intersection of nature and community, Forest will feel immediately authentic.',
      },
      {
        heading: 'Customising Forest in the editor',
        body: 'Load Forest in the Linky editor and you have a ready-made nature palette that you can nudge in any direction — deeper towards a forest-floor dark green, lighter towards a spring sage, or slightly warmer towards an olive. Because the border and card background share the same colour by default, increasing the border lightness slightly creates a subtle card outline that adds refinement without breaking the earthy feel.',
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
    h1: 'Lilac — a pastel link in bio template',
    answer:
      'Lilac is a soft, light-mode template built on a pale blue-violet background with near-white card surfaces and deep indigo text, delivering a gentle pastel aesthetic perfect for lifestyle, beauty, and wellness creators.',
    targetKeyword: 'pastel link in bio template',
    palette: PALETTES['lilac'],
    sections: [
      {
        heading: 'Soft pastels with a blue-violet character',
        body: 'Lilac centres on hue 244–250 — a blue-leaning violet — expressed at high lightness values to keep everything airy and calm. The page base sits at 85 % lightness with full saturation (s: 1), creating a vivid but still gentle periwinkle wash. Card backgrounds step up to 92 % lightness, nearly white with a hint of blue-violet. The overall impression is fresh, soft, and distinctly feminine without being clichéd.',
      },
      {
        heading: "What's included in the Lilac palette",
        body: "The seven colour roles form a tight, harmonious family: a periwinkle page base, an almost-white primary card, a pure-black secondary surface (used for avatar placeholder areas), a medium-saturation blue-violet border at 76 % lightness, and a deep indigo primary label (hue 250, 18 % lightness, 32 % saturation). Notably, all three label roles — primary, secondary, and tertiary — share the same deep indigo value, which simplifies the palette and ensures consistent, readable text throughout.",
      },
      {
        heading: 'Who Lilac is best for',
        body: 'Lilac appeals to lifestyle bloggers, beauty and skincare creators, wedding planners, florists, mental-health advocates, and any creator whose content evokes calm, care, and softness. The periwinkle-to-near-white gradient feels contemporary and Instagram-friendly. It also works well for small businesses in the wellness space — yoga instructors, therapists, and coaches — where a gentle, approachable tone builds trust.',
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
          'Yes. The hue of each colour role is fully customisable in the editor. Shifting hue 244 towards 280–300 moves the palette from periwinkle towards true lavender or soft purple, while values around 320–340 take it towards rose and pink.',
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
    h1: 'Orange Punch — a bold, colourful link in bio template',
    answer:
      'Orange Punch is a high-energy, multi-tonal template that pairs a deep navy background with vivid orange card surfaces, amber secondary accents, and mint-green text — an eye-catching combination built for creators who want maximum impact.',
    targetKeyword: 'colorful link in bio template',
    palette: PALETTES['orange-punch'],
    sections: [
      {
        heading: 'A bold palette built for impact',
        body: 'Orange Punch is unlike any other Linky theme — it layers three distinct hue families into a single page. The background is a deep navy (hue 226, 10 % lightness, 48 % saturation), grounding the page in a dark, dramatic base. Link cards explode with a vivid warm orange (hue 13.5, 53 % lightness, 67 % saturation), and secondary surfaces shift to a rich amber-orange (hue 33, 48 % lightness, 95 % saturation). The contrast between the dark navy and bright orange is intentionally high-energy.',
      },
      {
        heading: "What's in the Orange Punch palette",
        body: 'Seven colour roles span three hue families: the dark navy base and matching border, a vivid orange primary card, an amber secondary surface, and mint-green labels. Primary text (hue 144, 69 % lightness, 78 % saturation) is a medium mint-green that reads legibly on both the orange cards and the navy page. Secondary labels are an almost-white mint (97 % lightness), while tertiary labels step back to a nearly pure white. The palette rewards bold design choices and leans into unexpected colour pairings.',
      },
      {
        heading: 'Who Orange Punch is best for',
        body: "Orange Punch is designed for creators who want to stand out immediately — street-wear brands, tattoo artists, graphic designers, festival organisers, sports teams, and food creators who want their page to feel as vibrant as their content. The navy-and-orange combination has a strong sports-and-streetwear association, while the mint-green labels add a retro, neon-sign quality. This template won't suit understated brands, but for creators who want bold, it delivers.",
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
];

export const templates = TEMPLATES.filter(isPublishableTemplate);
export const getTemplate = (slug: string) => templates.find((t) => t.slug === slug) ?? null;
export const getTemplateSlugs = () => templates.map((t) => t.slug);
