import type { ComparisonRow } from '@/content/pseo-types';
import { CheckIcon } from '@heroicons/react/20/solid';

/** Compact "what you get with Linky" snapshot for the alternative-page hero. */
export function ComparisonGlance({
  competitor,
  rows,
}: {
  competitor: string;
  rows: ComparisonRow[];
}) {
  const top = rows.slice(0, 4);
  return (
    <div className="relative">
      {/* Offset backdrop card for a little depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-zinc-100"
      />
      <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          At a glance
        </p>
        <h2 className="mt-1 text-base font-semibold text-zinc-900">
          What you get with Linky
        </h2>
        <ul className="mt-3 divide-y divide-zinc-950/5">
          {top.map((row) => (
            <li key={row.feature} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <CheckIcon className="size-3.5 text-zinc-900" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {row.feature}
                </p>
                <p className="truncate text-sm text-zinc-500">{row.linky}</p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="#comparison"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
        >
          See the full comparison with {competitor} →
        </a>
      </div>
    </div>
  );
}
