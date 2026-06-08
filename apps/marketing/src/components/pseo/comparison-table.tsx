import type { ComparisonRow } from '@/content/pseo-types';

export function ComparisonTable({ competitor, rows }: { competitor: string; rows: ComparisonRow[] }) {
  return (
    <div className="not-prose my-8 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300">
            <th className="py-3 pr-4 font-semibold">Feature</th>
            <th className="py-3 pr-4 font-semibold">Linky</th>
            <th className="py-3 font-semibold">{competitor}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-3 pr-4 font-medium text-gray-900">{row.feature}</td>
              <td className="py-3 pr-4 text-gray-700">{row.linky}</td>
              <td className="py-3 text-gray-700">{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
