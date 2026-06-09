import { isRealBlock } from '@/components/pseo/integration-blocks';
import { INTEGRATION_LOGOS } from '@/components/pseo/integration-logos';
import { CheckIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';

/** Compact "blocks you can add" snapshot for the integration-page hero. */
export function IntegrationGlance({
  name,
  slug,
  blockCopy,
}: {
  name: string;
  slug: string;
  blockCopy: Record<string, { name: string; description: string }>;
}) {
  const blocks = Object.entries(blockCopy).filter(([key]) => isRealBlock(key));
  const logo = INTEGRATION_LOGOS[slug];

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl bg-zinc-100"
      />
      <div className="relative rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5">
        <div className="flex items-center gap-3">
          {logo && (
            <Image
              src={logo}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-xl"
            />
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Integration
            </p>
            <h2 className="text-base font-semibold text-zinc-900">
              {name} blocks
            </h2>
          </div>
        </div>
        <ul className="mt-3 divide-y divide-zinc-950/5">
          {blocks.map(([key, block]) => (
            <li key={key} className="flex items-start gap-3 py-3">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100">
                <CheckIcon className="size-3.5 text-zinc-900" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {block.name}
                </p>
                <p className="truncate text-sm text-zinc-500">
                  {block.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <a
          href="#blocks"
          className="mt-3 inline-block text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
        >
          See everything you can show →
        </a>
      </div>
    </div>
  );
}
