import { CheckIcon } from '@heroicons/react/20/solid';
import type { ComparisonRow } from '@/content/pseo-types';

export function ComparisonTable({
  competitor,
  rows,
}: {
  competitor: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="not-prose overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            <th className="px-5 py-4 font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
              Feature
            </th>
            <th className="px-5 py-4 font-bold text-gray-900 bg-[#fff4f0] border-b border-gray-200">
              Linky
            </th>
            <th className="px-5 py-4 font-semibold text-gray-700 bg-gray-50 border-b border-gray-200">
              {competitor}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100">
              <td className="px-5 py-4 font-medium text-gray-900">
                {row.feature}
              </td>
              <td className="px-5 py-4 bg-[#fffaf8] text-gray-900 font-medium">
                <span className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-green-500" />
                  <span>{row.linky}</span>
                </span>
              </td>
              <td className="px-5 py-4 text-gray-500">{row.competitor}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
