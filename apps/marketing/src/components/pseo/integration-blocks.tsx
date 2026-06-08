import { blocks } from '@trylinky/blocks';

/** True if `key` is a real block in the @trylinky/blocks registry. */
export function isRealBlock(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(blocks, key);
}

/**
 * Lists the real blocks an integration page showcases. The content module
 * declares the block keys + presentation copy in `blockCopy`; we render only
 * keys that genuinely exist in the @trylinky/blocks registry (real-data guarantee).
 */
export function IntegrationBlocks({
  blockCopy,
}: {
  blockCopy: Record<string, { name: string; description: string }>;
}) {
  const entries = Object.entries(blockCopy).filter(([key]) => isRealBlock(key));
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 not-prose">
      {entries.map(([key, copy]) => (
        <li
          key={key}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs hover:shadow-sm transition-shadow"
        >
          <div className="text-base font-semibold text-gray-900">{copy.name}</div>
          {copy.description && (
            <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
              {copy.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
