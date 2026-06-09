import { isRealBlock } from '@/components/pseo/integration-blocks';
import { INTEGRATION_LOGOS } from '@/components/pseo/integration-logos';
import {
  MinimalHubHero,
  MinimalHubSection,
} from '@/components/pseo/minimal-hub';
import { integrations } from '@/content/integrations';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio integrations | Linky',
  description:
    'Connect Spotify, Instagram, TikTok, Threads, and GitHub to your Linky link-in-bio page. See every integration and what it adds.',
  path: '/i/integrations',
});

export default function IntegrationsHub() {
  return (
    <div className="min-h-screen">
      <MinimalHubHero
        eyebrow="Integrations"
        h1="Integrations"
        answer="Everything you can connect to your Linky page. Linky integrates with your favourite platforms to keep your link-in-bio fresh and dynamic - automatically."
      >
        <div className="mt-10 flex items-center gap-4">
          {integrations.map((i) =>
            INTEGRATION_LOGOS[i.slug] ? (
              <Image
                key={i.slug}
                src={INTEGRATION_LOGOS[i.slug]}
                alt={i.name}
                width={40}
                height={40}
                className="size-9 rounded-xl md:size-10"
              />
            ) : null
          )}
        </div>
      </MinimalHubHero>

      <MinimalHubSection>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((i) => {
            const blockNames = Object.entries(i.blockCopy)
              .filter(([key]) => isRealBlock(key))
              .map(([, b]) => b.name);
            return (
              <li key={i.slug}>
                <Link
                  href={`/i/integrations/${i.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-zinc-950/5 transition hover:shadow-sm hover:ring-zinc-950/10"
                >
                  <div className="flex items-center gap-4">
                    {INTEGRATION_LOGOS[i.slug] && (
                      <Image
                        src={INTEGRATION_LOGOS[i.slug]}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-xl"
                      />
                    )}
                    <div className="text-lg font-semibold text-zinc-900">
                      {i.name}
                    </div>
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-zinc-500">
                    {i.answer}
                  </p>
                  {blockNames.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {blockNames.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-[#FAFAF9] px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-950/5"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="mt-4 text-sm font-medium text-zinc-900">
                    View integration{' '}
                    <span className="inline-block transition-transform group-hover:translate-x-0.5">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </MinimalHubSection>
    </div>
  );
}
