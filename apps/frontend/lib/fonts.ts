export interface GoogleFont {
  family: string;
  variants: string[];
  category: string;
}

export const popularGoogleFonts: GoogleFont[] = [
  {
    family: 'Roboto',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Open Sans',
    variants: ['400', '600', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Lato',
    variants: ['400', '700', '900'],
    category: 'sans-serif',
  },
  {
    family: 'Montserrat',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Poppins',
    variants: ['400', '500', '600', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Raleway',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Playfair Display',
    variants: ['400', '700', '900'],
    category: 'serif',
  },
  {
    family: 'DM Mono',
    variants: ['400', '500'],
    category: 'sans-serif',
  },
  {
    family: 'Merriweather',
    variants: ['400', '700', '900'],
    category: 'serif',
  },
  {
    family: 'Source Sans Pro',
    variants: ['400', '600', '700'],
    category: 'sans-serif',
  },
  {
    family: 'PT Sans',
    variants: ['400', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Nunito',
    variants: ['400', '600', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Quicksand',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Work Sans',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Rubik',
    variants: ['400', '500', '700'],
    category: 'sans-serif',
  },
  {
    family: 'Inter',
    variants: ['400', '500', '600', '700'],
    category: 'sans-serif',
  },
];

// Generate a Google Fonts URL for a specific font
export function getGoogleFontUrl(
  fontFamily: string,
  variants: string[] = ['400', '700']
): string {
  const family = `${fontFamily.replace(/ /g, '+')}:wght@${variants.join(';')}`;
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}

// Generate a CSS font-family value
export function getFontFamilyValue(fontFamily: string): string {
  return `"${fontFamily}", ${getFontCategory(fontFamily)}`;
}

// Get the font category (fallback) for a font
export function getFontCategory(fontFamily: string): string {
  const font = popularGoogleFonts.find((f) => f.family === fontFamily);
  return font?.category || 'sans-serif';
}

// Preload a Google Font to improve performance
export function preloadGoogleFont(
  fontFamily: string,
  variants: string[] = ['400', '700']
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = getGoogleFontUrl(fontFamily, variants);
  link.as = 'style';
  document.head.appendChild(link);
  return link;
}

// Load a Google Font
export function loadGoogleFont(
  fontFamily: string,
  variants: string[] = ['400', '700']
): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = getGoogleFontUrl(fontFamily, variants);
  document.head.appendChild(link);
  return link;
}
