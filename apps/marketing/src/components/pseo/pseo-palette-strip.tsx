import { hslToCss, type ThemePalette } from './theme-mock';

const SWATCH_LABELS: { key: keyof ThemePalette; label: string }[] = [
  { key: 'colorBgBase', label: 'Background' },
  { key: 'colorBgPrimary', label: 'Cards' },
  { key: 'colorBgSecondary', label: 'Accent' },
  { key: 'colorBorderPrimary', label: 'Borders' },
  { key: 'colorLabelPrimary', label: 'Text' },
  { key: 'colorLabelSecondary', label: 'Subtext' },
  { key: 'colorLabelTertiary', label: 'Muted' },
];

export function PaletteStrip({ palette }: { palette: ThemePalette }) {
  return (
    <div className="not-prose grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
      {SWATCH_LABELS.map(({ key, label }) => (
        <div key={key}>
          <div
            className="h-16 w-full rounded-xl border border-black/5"
            style={{ backgroundColor: hslToCss(palette[key]) }}
          />
          <p className="mt-2 text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}
