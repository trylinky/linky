export interface HslColor { h: number; s: number; l: number } // s,l are 0–1 fractions

export interface ThemePalette {
  colorBgBase: HslColor;
  colorBgPrimary: HslColor;
  colorBgSecondary: HslColor;
  colorBorderPrimary: HslColor;
  colorLabelPrimary: HslColor;
  colorLabelSecondary: HslColor;
  colorLabelTertiary: HslColor;
}

/** Convert a Linky theme color ({h:0-360, s:0-1, l:0-1}) to a CSS hsl() string. */
export function hslToCss(c: HslColor): string {
  return `hsl(${c.h} ${Math.round(c.s * 100)}% ${Math.round(c.l * 100)}%)`;
}

/** A realistic, static link-in-bio preview rendered from a real theme palette. */
export function ThemeMock({ palette, name, size = 'full' }: { palette: ThemePalette; name: string; size?: 'full' | 'thumb' }) {
  const rows = ['Latest music', 'My shop', 'Newsletter'];
  return (
    <div
      className={size === 'thumb' ? 'rounded-xl p-4' : 'rounded-2xl p-8'}
      style={{ backgroundColor: hslToCss(palette.colorBgBase) }}
    >
      <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-full" style={{ backgroundColor: hslToCss(palette.colorBgSecondary) }} />
        <div className="text-lg font-bold" style={{ color: hslToCss(palette.colorLabelPrimary) }}>{name}</div>
        <div className="text-sm" style={{ color: hslToCss(palette.colorLabelSecondary) }}>your link in bio</div>
        <div className="mt-2 flex w-full flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row}
              className="rounded-lg px-4 py-3 text-center text-sm font-medium"
              style={{
                backgroundColor: hslToCss(palette.colorBgPrimary),
                color: hslToCss(palette.colorLabelPrimary),
                border: `1px solid ${hslToCss(palette.colorBorderPrimary)}`,
              }}
            >
              {row}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
