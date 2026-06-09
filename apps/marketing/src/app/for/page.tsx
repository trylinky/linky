import {
  MinimalHubHero,
  MinimalHubSection,
} from '@/components/pseo/minimal-hub';
import { ThemeMock } from '@/components/pseo/theme-mock';
import { NICHE_PREVIEW } from '@/content/niche-presentation';
import { niches } from '@/content/niches';
import { getTemplate, templates } from '@/content/templates';
import { buildPseoMetadata } from '@/lib/seo-metadata';
import Link from 'next/link';

export const metadata = buildPseoMetadata({
  title: 'Link in bio for every creator and business | Linky',
  description:
    'Link-in-bio pages tailored for musicians, photographers, restaurants, developers, and more. Find the right setup for you.',
  path: '/i/for',
});

export default function NichesHub() {
  return (
    <div className="min-h-screen">
      <MinimalHubHero
        eyebrow="Use cases"
        h1="Linky for everyone"
        answer="A link in bio tailored to what you do. From musicians to restaurateurs, developers to designers - Linky has the right blocks, integrations, and templates for your audience."
      />
      <MinimalHubSection>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {niches.map((n) => {
            const preview = NICHE_PREVIEW[n.slug];
            const palette =
              (n.recommendedTemplate
                ? getTemplate(n.recommendedTemplate)
                : null
              )?.palette ?? templates[0].palette;
            return (
              <li key={n.slug}>
                <Link
                  href={`/i/for/${n.slug}`}
                  className="group flex h-full flex-col rounded-2xl bg-white p-3 ring-1 ring-zinc-950/5 transition hover:shadow-sm hover:ring-zinc-950/10"
                >
                  {/* Cropped tailored page preview */}
                  <div className="relative h-56 overflow-hidden rounded-xl">
                    <ThemeMock
                      palette={palette}
                      name={preview?.name ?? n.name}
                      rows={preview?.rows}
                      size="thumb"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-linear-to-b from-transparent to-black/10"
                    />
                  </div>
                  <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
                    <div className="text-lg font-semibold text-zinc-900">
                      {n.name}
                    </div>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-500 line-clamp-2">
                      {n.answer}
                    </p>
                    <span className="mt-3 text-sm font-medium text-zinc-900">
                      Explore{' '}
                      <span className="inline-block transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </MinimalHubSection>
    </div>
  );
}
