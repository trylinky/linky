import { blocks } from '@trylinky/blocks';

/** Returns the real block keys the registry maps to an integration type. */
export function blocksForIntegration(integrationType: string): string[] {
  return Object.entries(blocks)
    .filter(([, cfg]) => cfg.integrationType === integrationType)
    .map(([key]) => key);
}

/**
 * Lists the real blocks this integration powers (registry-backed), with
 * presentation copy supplied per block by the content module.
 */
export function IntegrationBlocks({
  integrationType,
  blockCopy,
}: {
  integrationType: string;
  blockCopy: Record<string, { name: string; description: string }>;
}) {
  const keys = blocksForIntegration(integrationType);
  return (
    <ul className="grid gap-4 sm:grid-cols-2 not-prose">
      {keys.map((key) => {
        const copy = blockCopy[key];
        return (
          <li key={key} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="font-semibold">{copy?.name ?? key}</div>
            {copy?.description && <p className="mt-1 text-sm text-gray-600">{copy.description}</p>}
          </li>
        );
      })}
    </ul>
  );
}
