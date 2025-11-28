import { getFontFamilyValue } from '@/lib/fonts';
import { themeColorToCssValue } from '@/lib/theme';
import { Theme } from '@trylinky/prisma';

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export function PageThemePreview({
  themeValues,
}: {
  themeValues: RequiredFields<
    Theme,
    | 'colorBgBase'
    | 'colorBgPrimary'
    | 'colorBgSecondary'
    | 'colorLabelPrimary'
    | 'colorLabelSecondary'
  >;
}) {
  const fontFamily = themeValues.font
    ? getFontFamilyValue(themeValues.font)
    : undefined;
  const hasBackgroundImage = !!themeValues.backgroundImage;

  return (
    <div
      className="space-y-2 rounded-lg p-2 relative"
      style={{
        backgroundColor: `hsl(${themeColorToCssValue(
          themeValues.colorBgBase
        )})`,
        fontFamily: fontFamily,
        backgroundImage: hasBackgroundImage
          ? `url(${themeValues.backgroundImage})`
          : undefined,
        backgroundSize: hasBackgroundImage ? 'cover' : undefined,
        backgroundPosition: hasBackgroundImage ? 'center' : undefined,
      }}
    >
      <div
        className="flex items-center space-x-2 rounded-md p-2 shadow-sm"
        style={{
          backgroundColor: `hsl(${themeColorToCssValue(
            themeValues.colorBgPrimary
          )})`,
        }}
      >
        <div
          className="h-4 w-4 rounded-full"
          style={{
            backgroundColor: `hsl(${themeColorToCssValue(
              themeValues.colorLabelPrimary
            )})`,
          }}
        />
        <div
          className="h-2 w-[90px] rounded-lg"
          style={{
            backgroundColor: `hsl(${themeColorToCssValue(
              themeValues.colorLabelSecondary
            )})`,
          }}
        />
      </div>
      <div
        className="space-y-2 rounded-md p-2 shadow-sm"
        style={{
          backgroundColor: `hsl(${themeColorToCssValue(
            themeValues.colorBgPrimary
          )})`,
        }}
      >
        <div
          className="h-2 w-[70px] rounded-lg"
          style={{
            backgroundColor: `hsl(${themeColorToCssValue(
              themeValues.colorLabelPrimary
            )})`,
          }}
        />
        <div
          className="h-2 w-[90px] rounded-lg"
          style={{
            backgroundColor: `hsl(${themeColorToCssValue(
              themeValues.colorLabelSecondary
            )})`,
          }}
        />
      </div>
    </div>
  );
}
